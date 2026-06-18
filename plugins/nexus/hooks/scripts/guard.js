#!/usr/bin/env node
/**
 * Nexus PreToolUse security guard (SYNCHRONOUS — can block).
 *
 * Posture comes from ${user_config.security_mode} (passed as argv[2]):
 *   open      (default) — block catastrophic actions: root/home deletes, sudo,
 *                         force-push, reset --hard, remote-pipe-to-shell, publish/push,
 *                         secret-file access, writes outside the project root, AND a
 *                         non-code pipeline role editing application source.
 *   hardened           — open PLUS: no git push at all, no network package installs,
 *                         no network fetches.
 *   off                — no enforcement (audit-logger still records).
 *
 * Blocks by emitting a PreToolUse "deny" decision. Otherwise stays silent and exits 0,
 * letting the normal permission flow proceed (it never auto-approves). Fail-open on any
 * uncertainty (bad JSON, unreadable registry) so it can never wedge a run, including -p.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { isCodeFile } = require('./lib/is-code-file');

const mode = (process.argv[2] || 'open').toLowerCase();

// Pipeline roles that must never edit application source — they route code changes to the
// developer (write findings/instructions instead). Code roles (developer, solo) are absent.
const NONCODE_ROLES = new Set(['architect', 'reviewer', 'po', 'critic', 'team-lead', 'learner']);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  if (mode === 'off') return allow();
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return allow(); }

  const tool = data.tool_name || '';
  const ti = data.tool_input || {};
  const cwd = data.cwd || process.cwd();

  const reason = evaluate(tool, ti, cwd, mode, data);
  if (reason) return deny(reason);
  return allow();
});

function evaluate(tool, ti, cwd, mode, data) {
  const fp = ti.file_path || ti.path || ti.notebook_path || '';
  const isFileTool = /^(Read|Edit|Write|NotebookEdit|MultiEdit)$/.test(tool);
  const isWriteTool = /^(Edit|Write|NotebookEdit|MultiEdit)$/.test(tool);

  if (fp && isFileTool && isSecret(fp)) {
    return `access to a secret file (${fp})`;
  }
  if (fp && isWriteTool && isAbsoluteOutside(fp, cwd)) {
    return `write outside the project root (${fp})`;
  }
  // Persona scope: a non-code pipeline role must not edit application source code.
  if (fp && isWriteTool && isCodeFile(fp)) {
    const role = activeRole(data);
    if (NONCODE_ROLES.has(role)) {
      return `the ${role} role editing application source (${fp}); non-code roles route code changes ` +
             `to the developer — write findings/instructions instead of editing the file`;
    }
  }
  if (tool === 'Bash') {
    const bad = badBash(ti.command || '', mode);
    if (bad) return bad;
  }
  return null;
}

// Active pipeline role for this tool call. Subagent calls carry agent_type; the main-thread
// persona is recorded per-session in .claude/.personas.json. Either may be namespaced
// (e.g. "nexus:architect") — take the final segment. Unknown -> "main" (never blocked).
function activeRole(data) {
  const a = data.agent_type || readSessionPersona(data.session_id, data.cwd) || 'main';
  return String(a).toLowerCase().split(/[:/]/).pop();
}

function readSessionPersona(sid, cwd) {
  if (!sid) return null;
  try {
    const root = process.env.CLAUDE_PROJECT_DIR || cwd || process.cwd();
    const reg = JSON.parse(fs.readFileSync(path.join(root, '.claude', '.personas.json'), 'utf8'));
    return reg[sid] && reg[sid].agent;
  } catch { return null; }
}

function isSecret(fp) {
  const p = String(fp).replace(/\\/g, '/');
  // .env.example/.template/.sample are committed, secret-free scaffolds — legitimate reads.
  if (/\.env\.(example|template|sample)$/i.test(p)) return false;
  return /(^|\/)\.env(\.|$)/i.test(p)
    || /\/secrets?\//i.test(p)
    || /\/\.credentials\//i.test(p)
    || /(^|\/)\.aws\/credentials/i.test(p)
    || /(^|\/)id_rsa(\.|$)/i.test(p);
}

function isAbsoluteOutside(fp, cwd) {
  if (!path.isAbsolute(fp)) return false; // relative paths stay within the project
  const norm = p => path.resolve(p).replace(/\\/g, '/').toLowerCase();
  const abs = norm(fp);
  const root = norm(cwd);
  return !(abs === root || abs.startsWith(root + '/'));
}

function badBash(cmd, mode) {
  const c = cmd.toLowerCase();

  // recursive force-delete of a root / home / absolute path.
  // Flags may be split ("rm -r -f") — collect every flag token after rm, not just the first.
  const rmMatch = c.match(/\brm\s+((?:-[a-z-]+\s*)+)/);
  const rmFlags = rmMatch ? rmMatch[1] : '';
  const rmRF = rmFlags.includes('r') && rmFlags.includes('f');
  // Targets: POSIX (/, ~, $HOME) AND Windows shapes (C:\, C:/, UNC \\server) — this runs on
  // Windows-first machines where "rm -rf D:\foo" is just as catastrophic.
  if (rmRF && /[\s='"]([a-z]:[\\/]|\\\\|\/(\s|\*|$)|~([\\/]|\s|\*|$)|\$home|\/[a-z])/i.test(c)) {
    return 'recursive force-delete of a root/home/absolute path';
  }
  // PowerShell equivalent: Remove-Item -Recurse -Force on an absolute/home path (flag order varies,
  // flags may be abbreviated -rec/-fo): basic coverage, fail-open beyond it.
  if (/\b(remove-item|ri|del|rmdir|rd)\b/.test(c)
      && /\s-rec\w*/.test(c) && /\s-fo\w*/.test(c)
      && /[\s'"]([a-z]:[\\/]|\\\\|~[\\/]|\/)/i.test(c)) {
    return 'recursive force-delete of a root/home/absolute path (PowerShell)';
  }
  if (/\bsudo\b/.test(c)) return 'sudo escalation';
  if (/\bgit\s+push\b[^\n]*(--force\b|-f\b|--force-with-lease\b)/.test(c)) return 'force push';
  if (/\bgit\s+reset\s+--hard\b/.test(c)) return 'git reset --hard (irreversible)';
  if (/\b(curl|wget|iwr|invoke-webrequest)\b[^|]*\|\s*(sh|bash|zsh|pwsh|powershell|node|python)\b/.test(c)) {
    return 'piping a remote script straight into a shell';
  }
  if (/\bnpm\s+publish\b/.test(c)) return 'npm publish';
  if (/\bdocker\s+(push|rmi?)\b/.test(c)) return 'docker push/rm';
  if (/:\(\)\s*\{\s*:\s*\|\s*:?\s*&\s*\}\s*;\s*:/.test(cmd)) return 'fork bomb';

  if (mode === 'hardened') {
    if (/\bgit\s+push\b/.test(c)) return 'git push (hardened mode disables pushes)';
    if (/\b(npm|pnpm|yarn|pip|pip3|cargo|gem|go)\s+(install|add|get|i)\b/.test(c)) {
      return 'network package install (hardened mode)';
    }
    if (/\b(curl|wget|iwr|invoke-webrequest)\b/.test(c)) return 'network fetch (hardened mode)';
  }
  return null;
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `Nexus guard (${mode}) blocked: ${reason}.`
    }
  }));
  process.exit(0);
}

function allow() { process.exit(0); }
