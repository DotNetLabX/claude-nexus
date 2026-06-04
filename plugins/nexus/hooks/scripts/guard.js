#!/usr/bin/env node
/**
 * Nexus PreToolUse security guard (SYNCHRONOUS — can block).
 *
 * Posture comes from ${user_config.security_mode} (passed as argv[2]):
 *   open      (default) — block catastrophic actions only: root/home deletes, sudo,
 *                         force-push, reset --hard, remote-pipe-to-shell, publish/push,
 *                         secret-file access, writes outside the project root.
 *   hardened           — open PLUS: no git push at all, no network package installs,
 *                         no network fetches.
 *   off                — no enforcement (audit-logger still records).
 *
 * Blocks by emitting a PreToolUse "deny" decision. Otherwise stays silent and exits 0,
 * letting the normal permission flow proceed (it never auto-approves).
 */
'use strict';
const path = require('path');

const mode = (process.argv[2] || 'open').toLowerCase();

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

  const reason = evaluate(tool, ti, cwd, mode);
  if (reason) return deny(reason);
  return allow();
});

function evaluate(tool, ti, cwd, mode) {
  const fp = ti.file_path || ti.path || ti.notebook_path || '';
  const isFileTool = /^(Read|Edit|Write|NotebookEdit|MultiEdit)$/.test(tool);

  if (fp && isFileTool && isSecret(fp)) {
    return `access to a secret file (${fp})`;
  }
  if (fp && /^(Edit|Write|NotebookEdit|MultiEdit)$/.test(tool) && isAbsoluteOutside(fp, cwd)) {
    return `write outside the project root (${fp})`;
  }
  if (tool === 'Bash') {
    const bad = badBash(ti.command || '', mode);
    if (bad) return bad;
  }
  return null;
}

function isSecret(fp) {
  const p = String(fp).replace(/\\/g, '/');
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

  // recursive force-delete of a root / home / absolute path
  const rmFlag = c.match(/\brm\s+(-[a-z]+)/);
  const rmRF = rmFlag && rmFlag[1].includes('r') && rmFlag[1].includes('f');
  if (rmRF && /[\s=](\/(\s|\*|$)|~(\/|\s|\*|$)|\$home|\/[a-z])/i.test(c)) {
    return 'recursive force-delete of a root/home/absolute path';
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
