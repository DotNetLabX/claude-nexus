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
 * signal). So the gate is UNCONDITIONALLY advisory — it runs the verify set (a developer's step
 * checkpoint aside, below) and records the same verdict in both modes (AC-1.5, AC-1.2 "one
 * execution path"); the step-checkpoint skip reads the stop's own message, never the mode. The
 * mode fork (attended informs / unattended decides) lives entirely in team-lead.md, which reads
 * BOTH the prompt and this verdict.
 *
 * The three-way agent branch (HIGH-2, the false-green guard):
 *   - implementation role (developer/solo)        -> run verify, write a pass/fail verdict
 *                                                    (a developer's step checkpoint: verdict
 *                                                    "skipped", no command — see below)
 *   - a recognized NON-impl role (architect/…)    -> skip — not the impl boundary, no verdict
 *   - an ABSENT or UNRECOGNIZED agent_type        -> write a verdict marked agent:"unknown"
 *                                                    (verify NOT run, the reason recorded)
 * A written "couldn't classify" is recoverable by the team lead at its checkpoint; a SILENT
 * no-write would be the feared false-green. So the unknown branch WRITES — it never silently skips.
 * (A genuine parse error, by contrast, is zero-footprint fail-silent — see the catch.)
 *
 * The step checkpoint (F175, ADR-122): a spawned DEVELOPER hands back after every step with
 * `Step {n} done for …` (lib/step-checkpoint.js). At such a stop — and never "ready for Step 1" or
 * "range complete" — the gate runs NO command and appends verdict:"skipped", reason:"step checkpoint".
 * Why: the team lead consumes only a developer's latest verdict, at the build's end, so a mid-slice
 * verdict is never read, and the developer already ran its own quick check at that step's close;
 * running the set per step cost up to ~4 minutes a step in this repo. It still WRITES, so every stop
 * stays on the audit trail. Solo never takes this branch (it keeps every run), and a message the
 * matcher does not recognise runs the commands as before — the fail-safe side. The record uses the
 * resolved root's tree and token, like branch 3: the worktree redirect exists for decision-grade
 * verdicts, and this one decides nothing.
 *
 * Platform surface note (LOW-2, informational): SubagentStop exposes the same per-subagent
 * transcript (agent_transcript_path -> agent-{agentId}.jsonl) that salvage-transcript.js already
 * consumes by agentId. The gate keys off the lighter agent_type/agent_id/session payload, but the
 * richer transcript is available here if a future maintainer needs the full handback.
 *
 * NON-EXECUTION CONTRACT — .claude/verify.json's `roles` block is NOT this gate's (F81).
 * The file now carries two independent declarations:
 *   `commands` — THIS gate's quick set, run at every implementation SubagentStop but a developer's
 *                step checkpoint, under a 120s per-command cap (hooks.json's outer cap is 180s).
 *   `roles`    — { build, unit, full, mutation }, each an optional command string, declared for
 *                READERS OTHER THAN THIS HOOK: the spawn-time carrier (inject-verify-roles.js)
 *                delivers them to the implementation subagent, and the close gate runs `full`
 *                from the main session via verify-run.js.
 * resolveCommands below reads `commands` and ONLY `commands`. This gate never executes a role, and
 * a `roles` key never suppresses the detection fallback: a file carrying `roles` but no `commands`
 * array is, to this gate, a file with no explicit config — it falls through to detection exactly as
 * an absent file does. That is deliberate, not an oversight. A 7-minute full suite cannot live under
 * a 120s cap, so admitting roles here would either wedge the hook on a timeout or force the roles
 * block to be sized for this gate rather than for the run. Declaration and execution are separated
 * so each command can be sized for the reader that actually runs it.
 *
 * Each `commands[]` entry is `{run, ok, blocking, duration_ms[, output_excerpt]}`; `duration_ms` is the
 * whole milliseconds around that one command, pass or fail — a reader's only source for a hook run's
 * time, since the record's `ts` is stamped when the hook starts.
 *
 * Plumbing mirrors read-tracker.js (root resolution, .pipeline-state round token, mkdir -p
 * .claude/audit, fail-silent) EXCEPT: it executes commands, so it is SYNCHRONOUS (not async) and
 * hooks.json gives it a generous timeout (the verify set can take seconds).
 *
 * WORKTREE DIVERGENCE from skill-tracker.js — deliberate, do NOT "fix" it back (F51). That hook
 * carries an explicit do-not-make-this-worktree-aware decision, and it gave a real reason:
 *   "a split log would break the token-scoped round queries Step 3 depends on."
 * This gate diverges on WHERE IT MEASURES while honoring that reason exactly: on a session-matching
 * published target it resolves commands, the execution cwd, and the round token from that tree —
 * but the verdict still APPENDS TO THE RESOLVED ROOT'S audit file, so there is still ONE log home
 * and the token-scoped round queries keep working. Measuring and writing are separate choices; only
 * the first one moved.
 *
 * The asymmetry that licenses diverging at all: skill-tracker only RECORDS, so one log home is
 * simply right for it. This gate's verdict DECIDES an unattended close (ADR-31/32) — so measuring
 * the wrong tree is not a bookkeeping wart, it is a correctness bug that fails GREEN (measured
 * 2026-08-04: a worktree round recorded verdict:"pass" from the main checkout, under a stale token,
 * against a tree holding none of the feature's changes).
 *
 * ARMING CONDITION: the redirect fires ONLY on a session-matching line in .claude/.worktree-target,
 * published by the dispatching coordinator (team-lead / solo / architect fast lane). A lane that
 * publishes nothing keeps pre-F51 behavior byte-for-byte — this is inert by default, never a
 * topology heuristic.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolveRole } = require('./lib/resolve-role');
const { readWorktreeTarget } = require('./lib/worktree-target');
const { stepCheckpoint, handbackText } = require('./lib/step-checkpoint');

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
  const testGlobs = ['tests/lint', 'tests/unit', 'tests/mined']
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

// Head+tail rather than a plain tail, so a check added at EITHER end of a verify command's output
// survives: a bare tail measurably dropped selfcheck's line-1 "[FAIL] tests" result, which turned a
// real failure into a false-benign.
const EXCERPT_HEAD = 400;
const EXCERPT_TAIL = 400;

// Piping stdout/stderr means the parent BUFFERS them, and exceeding the buffer kills the child with
// ENOBUFS — turning a command that would have exited 0 into a recorded failure. execSync's default
// bound is 1 MB. This repo's own three-suite output is ~90 KB, but the bound that matters is a
// CONSUMING repo's: the synthesized fallback (GAP-1's whole subject) runs in repos that declared
// nothing, and a large suite, a verbose build step, or a run with many failures — precisely when the
// excerpt matters most — all clear 1 MB. Hence an explicit, generous bound. It is a bound, not an
// absence of one: past it the child still dies, so failureCause() names ENOBUFS in the excerpt
// rather than letting a head+tail of healthy output masquerade as the reason for the red.
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024;

function excerpt(text) {
  const s = String(text || '');
  if (s.length <= EXCERPT_HEAD + EXCERPT_TAIL) return s;
  const dropped = s.length - EXCERPT_HEAD - EXCERPT_TAIL;
  return `${s.slice(0, EXCERPT_HEAD)}\n… [${dropped} chars elided] …\n${s.slice(-EXCERPT_TAIL)}`;
}

/**
 * Why a failed command ALWAYS gets a stated cause: the classes that carry no output are exactly the
 * ones a reader cannot otherwise diagnose. A timeout throws ETIMEDOUT with empty stdout/stderr, and
 * an over-buffer throws ENOBUFS while stdout holds megabytes of perfectly healthy output — so
 * relying on captured output alone yields an EMPTY excerpt in the first case and a MISLEADING one in
 * the second. Both are the unattributed red the gate's attribution rule forbids.
 */
function failureCause(e) {
  if (!e) return 'unknown error';
  if (e.code) return String(e.code);                    // ETIMEDOUT / ENOBUFS / ENOENT — the no-output classes
  if (e.signal) return `killed by ${e.signal}`;
  if (typeof e.status === 'number') return `exit status ${e.status}`;
  return 'unknown error';
}

/**
 * Run one command from the given tree; ok = exit 0. Never throws. Returns { ok, output } — output is
 * the combined stdout+stderr plus a stated cause, captured so a FAILURE can be attributed. Without
 * it, a redirected run records an unattributable red and a reader cannot tell an environmental
 * ceremony failure from a real one.
 */
function runCommand(run, root) {
  try {
    // 120s inner cap; hooks.json outer is 180s
    execSync(run, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000, maxBuffer: MAX_OUTPUT_BYTES });
    return { ok: true };
  } catch (e) {
    // non-zero exit, timeout, over-buffer, and spawn failure all read as a failed verify — and the
    // cause line is appended LAST so it survives the tail of the excerpt even when output is huge.
    const captured = `${String((e && e.stdout) || '')}${String((e && e.stderr) || '')}`;
    return { ok: false, output: `${captured}\n[verify-gate] command failed: ${failureCause(e)}\n` };
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
    // Branch 3 as verdict:"skipped" (reads as a pass but never ran). plugin-feedback from two
    // consuming repos.
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
      write({ ...base, tree: root, agent: 'unknown', verdict: 'skipped', reason: role ? `unrecognized agent_type: ${role}` : 'absent agent_type', commands: [], blocking_failed: false });
      return process.exit(0);
    }

    // A developer's mid-slice step checkpoint: record it, run nothing (header, F175). Developer
    // only — solo keeps every run — and checked before the redirect, which decision-grade verdicts need.
    if (role === 'developer' && stepCheckpoint(handbackText(data))) {
      write({ ...base, tree: root, agent: role, verdict: 'skipped', reason: 'step checkpoint', commands: [], commands_count: 0, blocking_failed: false });
      return process.exit(0);
    }

    // Branch 1: the implementation subagent — run the verify set and record the verdict.
    // The redirect is BRANCH-1-ONLY by design: branches 2/3 keep their triggers and outputs (branch
    // 3 still records the resolved root's token), so the signal can only ever change what a
    // decision-grade verdict measured.
    let signal = { status: 'absent' };
    try { signal = readWorktreeTarget(root, data.session_id); } catch { /* degrade to status quo — never a new silent-skip path */ }

    let tree = root; // the tree whose token was read (= the execution tree, once redirected)
    let reason;
    if (signal.status === 'no-match') {
      // Loud rather than silently inert: a wrong publisher derivation is then one look to diagnose.
      reason = 'worktree-target present, no session match';
    } else if (signal.status === 'match') {
      const declared = String(signal.tree);
      // Absolute-only, and checked BEFORE any resolution or comparison. A relative value would
      // otherwise resolve against the hook process's INCIDENTAL cwd — the wrong-base class this
      // gate exists to kill — and could even compare equal to the root and pass as a benign
      // self-publication. The producer contract is absolute-only, so this converts a contract
      // violation from a silent wrong-tree run into a one-look diagnosis.
      let usable = false;
      if (path.isAbsolute(declared)) {
        // Existence + directory-ness only, never git topology: the signal is a coordinator-authored,
        // session-scoped declaration, and a newer appended line supersedes a stale one.
        try { usable = fs.statSync(declared).isDirectory(); } catch { usable = false; }
      }
      if (!usable) {
        // Loud NON-decision: never a pass, never a fail. verdict:"unknown" is not advanceable.
        write({ ...base, tree, agent: role, verdict: 'unknown', reason: `worktree-target invalid: ${signal.tree}`, commands: [], commands_count: 0, blocking_failed: false });
        return process.exit(0);
      }
      if (path.resolve(declared) !== path.resolve(root)) {
        tree = declared;
        token = '';
        try { token = fs.readFileSync(path.join(tree, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* absent there → '' recorded, as today */ }
      }
    }

    const commands = resolveCommands(tree);
    const results = commands.map((c) => {
      const started = Date.now();
      const r = runCommand(c.run, tree);
      const entry = { run: c.run, ok: r.ok, blocking: c.blocking, duration_ms: Date.now() - started };
      if (!r.ok) entry.output_excerpt = excerpt(r.output);
      return entry;
    });
    const blocking_failed = results.some((r) => r.blocking && !r.ok);
    // commands_count makes an empty/undetectable set a visible audit signal: a verdict:"pass" with
    // commands_count:0 is "nothing was verified", distinct from a real green run — the team lead can
    // tell the difference at its checkpoint instead of trusting a silent pass.
    write({ ...base, token, tree, agent: role, verdict: blocking_failed ? 'fail' : 'pass', ...(reason ? { reason } : {}), commands: results, commands_count: results.length, blocking_failed });
  } catch { /* fail silent — a genuine error is zero-footprint, distinct from the unknown WRITTEN record */ }
  process.exit(0);
});
