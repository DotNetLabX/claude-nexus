#!/usr/bin/env node
/**
 * Nexus SubagentStop verify gate (ADR-30/31). Always-on, ADVISORY — it runs the project's
 * declared verify set when the IMPLEMENTATION subagent completes and writes a verdict to the
 * audit trail. It NEVER denies or blocks (run+record only).
 *
 * Why run+record, never block (ADR-31): the CR-1 spike proved a SubagentStop {decision:"block"}
 * IS honored on a background subagent — but it traps a verify-failed subagent in an unsatisfiable
 * retry loop (it has no new information; the spike observed 14 forced re-fires until the platform's
 * stop_hook_active guard cut it off). So enforcement is by CONSUMING the recorded verdict (the
 * team lead reads it at its checkpoint), not by a hook block. This hook only ever runs+records.
 *
 * Why this hook does NOT read [UNATTENDED]: a hook is a separate process and cannot see the
 * launch-prompt token (it is prose the team lead reads behaviorally, not a hook-visible env
 * signal). So the gate is UNCONDITIONALLY advisory — it always runs the verify set and always
 * records the same verdict, in both modes (AC-1.5, AC-1.2 "one execution path"). The mode fork
 * (attended informs / unattended decides) lives entirely in team-lead.md, which reads BOTH the
 * prompt and this verdict.
 *
 * The three-way agent branch (HIGH-2, the false-green guard):
 *   - implementation role (developer/solo)        -> run verify, write a pass/fail verdict
 *   - a recognized NON-impl role (architect/…)    -> skip — not the impl boundary, no verdict
 *   - an ABSENT or UNRECOGNIZED agent_type        -> write a verdict marked agent:"unknown"
 *                                                    (verify NOT run, the reason recorded)
 * A written "couldn't classify" is recoverable by the team lead at its checkpoint; a SILENT
 * no-write would be the feared false-green. So the unknown branch WRITES — it never silently skips.
 * (A genuine parse error, by contrast, is zero-footprint fail-silent — see the catch.)
 *
 * Platform surface note (LOW-2, informational): SubagentStop exposes the same per-subagent
 * transcript (agent_transcript_path -> agent-{agentId}.jsonl) that salvage-transcript.js already
 * consumes by agentId. The gate keys off the lighter agent_type/agent_id/session payload, but the
 * richer transcript is available here if a future maintainer needs the full handback.
 *
 * Plumbing mirrors read-tracker.js (root resolution, .pipeline-state round token, mkdir -p
 * .claude/audit, fail-silent) EXCEPT: it executes commands, so it is SYNCHRONOUS (not async) and
 * hooks.json gives it a generous timeout (the verify set can take seconds).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolveRole } = require('./lib/resolve-role');

// Roles that write application source — the gate's verify boundary. Everything else that is a
// recognized pipeline role is a NON-impl stop (skip); anything not in either set is "unknown".
const IMPL_ROLES = new Set(['developer', 'solo']);
const NONIMPL_ROLES = new Set(['architect', 'reviewer', 'po', 'critic', 'team-lead', 'learner']);

/**
 * Resolve the verify command set (Step 3). Explicit .claude/verify.json wins; on absence, detect
 * this kind of repo's runner. Returns [{ run, blocking }]. Never throws — a malformed config or an
 * undetectable project yields an empty set (the verdict then has no blocking failure to record).
 */
function resolveCommands(root) {
  // 1. Explicit config wins.
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'verify.json'), 'utf8'));
    if (Array.isArray(cfg.commands)) {
      return cfg.commands
        .filter((c) => c && typeof c.run === 'string')
        .map((c) => ({ run: c.run, blocking: c.blocking !== false })); // blocking defaults true
    }
  } catch { /* no/!malformed config -> detection */ }

  // 2. Detection fallback — synthesize a default set from the project's structure.
  const has = (p) => { try { return fs.existsSync(path.join(root, p)); } catch { return false; } };
  // List the *.test.mjs files actually present under a test dir. A zero-match glob handed to
  // `node --test` expands to a literal non-existent path → Node exits non-zero → a spurious
  // verdict:"fail". So we resolve the globs HERE and only emit the command for dirs that have
  // matching files; if none do, the --test command is not synthesized (an empty set = a clean
  // non-blocking pass, never a false fail). This guard only affects detection-fallback consumers —
  // an explicit .claude/verify.json is unaffected.
  const testGlobs = ['tests/lint', 'tests/unit']
    .filter((d) => has(d))
    .map((d) => {
      try { return fs.readdirSync(path.join(root, d)).some((f) => f.endsWith('.test.mjs')) ? `${d}/*.test.mjs` : null; }
      catch { return null; }
    })
    .filter(Boolean);
  const cmds = [];
  // This repo's dogfood shape: a node:test suite under tests/ (the bare-dir form regressed on
  // Node >=22 — use the glob form CI uses) plus a scripts/selfcheck.mjs wiring gate.
  if (testGlobs.length) {
    cmds.push({ run: `node --test ${testGlobs.join(' ')}`, blocking: true });
  }
  if (has('scripts/selfcheck.mjs')) {
    cmds.push({ run: 'node scripts/selfcheck.mjs', blocking: true });
  }
  return cmds;
}

/** Run one command from the project root; ok = exit 0. Never throws. */
function runCommand(run, root) {
  try {
    execSync(run, { cwd: root, stdio: 'ignore', timeout: 120000 }); // 120s inner cap; hooks.json outer is 180s
    return true;
  } catch {
    return false; // non-zero exit, timeout, or spawn failure all read as a failed verify
  }
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');

    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    const auditDir = path.join(root, '.claude', 'audit');
    const verdictFile = path.join(auditDir, 'verify-verdict.json');

    let token = '';
    try { token = fs.readFileSync(path.join(root, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }

    // resolveRole strips a `nexus:` namespace AND resolves a custom/auto-suffixed spawn name
    // (developer-2, developer-f6) to its base role — without it a suffixed re-spawn lands in
    // Branch 3 as verdict:"skipped" (reads as a pass but never ran). kg P1 + sr item 1.
    const role = resolveRole(data.agent_type);
    const session = String(data.session_id || '');
    const agentId = String(data.agent_id || '');
    const base = { ts: new Date().toISOString(), agent_id: agentId, session, token };

    function write(record) {
      fs.mkdirSync(auditDir, { recursive: true });
      fs.appendFileSync(verdictFile, JSON.stringify(record) + '\n');
    }

    // Branch 2: a recognized non-implementation role — not the verify boundary. Skip, no verdict.
    if (role && NONIMPL_ROLES.has(role)) return process.exit(0);

    // Branch 3: absent or unrecognized agent_type — WRITE an unknown-marked record, never a
    // silent skip (HIGH-2). Verify is not run because we cannot confirm this is the impl boundary.
    if (!role || !IMPL_ROLES.has(role)) {
      write({ ...base, agent: 'unknown', verdict: 'skipped', reason: role ? `unrecognized agent_type: ${role}` : 'absent agent_type', commands: [], blocking_failed: false });
      return process.exit(0);
    }

    // Branch 1: the implementation subagent — run the verify set and record the verdict.
    const commands = resolveCommands(root);
    const results = commands.map((c) => ({ run: c.run, ok: runCommand(c.run, root), blocking: c.blocking }));
    const blocking_failed = results.some((r) => r.blocking && !r.ok);
    // commands_count makes an empty/undetectable set a visible audit signal: a verdict:"pass" with
    // commands_count:0 is "nothing was verified", distinct from a real green run — the team lead can
    // tell the difference at its checkpoint instead of trusting a silent pass.
    write({ ...base, agent: role, verdict: blocking_failed ? 'fail' : 'pass', commands: results, commands_count: results.length, blocking_failed });
  } catch { /* fail silent — a genuine error is zero-footprint, distinct from the unknown WRITTEN record */ }
  process.exit(0);
});
