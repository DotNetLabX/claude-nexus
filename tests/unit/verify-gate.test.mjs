// T2 — verify-gate.js (ADR-31): the always-on advisory SubagentStop verification gate.
// When the IMPLEMENTATION subagent (developer/solo) completes, the gate runs the project's
// declared verify set and writes a verdict to .claude/audit/verify-verdict.json — run+record
// ONLY, never a deny/block (the spike proved a SubagentStop block traps a verify-failed
// subagent in an unsatisfiable retry loop, ADR-31 Rejected). The verdict is advisory in BOTH
// modes; the [UNATTENDED] fork lives in the team lead (it consumes the verdict), NOT here — a
// hook is a separate process and cannot read the launch-prompt token.
//
// Mirrors the read-tracker/skill-tracker idiom (fixture event on stdin via runHook; root =
// CLAUDE_PROJECT_DIR; one JSON line appended; round-keyed by the .pipeline-state token) with one
// difference: it RUNS a command, so it is synchronous and needs a generous hooks.json timeout.
//
// THE FALSE-GREEN GUARD (HIGH-2): the discriminator is three-way. impl role → run verify + write
// the verdict; a recognized non-impl role → skip (no verdict); an ABSENT/UNRECOGNIZED agent_type
// → still write a verdict marked agent:"unknown" (verify NOT run, reason recorded). A written
// "couldn't classify" is recoverable at the team-lead checkpoint; a silent no-write is the feared
// false-green, so the unknown branch must WRITE.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, runHook, denyReason, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const GATE = join(pluginRoot('nexus'), 'hooks', 'scripts', 'verify-gate.js');
after(cleanupSandboxes);

const VERDICT = (dir) => join(dir, '.claude', 'audit', 'verify-verdict.json');
const QUEUE = (dir) => join(dir, '.claude', 'review-queue');
const verdicts = (dir) => readFileSync(VERDICT(dir), 'utf8').trim().split('\n').map(JSON.parse);
const lastVerdict = (dir) => verdicts(dir).at(-1);

// A SubagentStop event as the spike confirmed the platform surfaces it: agent_type (the role),
// agent_id, last_assistant_message (the handback), session_id (the parent session).
function stop(dir, { agentType, agentId = 'agt-1', session = 'sess-vg', msg = 'done' } = {}) {
  const event = {
    session_id: session,
    agent_id: agentId,
    last_assistant_message: msg,
    cwd: dir,
  };
  if (agentType !== undefined) event.agent_type = agentType;
  return runHook(GATE, event, { projectDir: dir });
}

// Write a .claude/verify.json with one command whose pass/fail we control via the shell exit code.
function setVerify(dir, commands) {
  mkdirSync(join(dir, '.claude'), { recursive: true });
  writeFileSync(join(dir, '.claude', 'verify.json'), JSON.stringify({ commands }));
}
function setToken(dir, token) {
  mkdirSync(join(dir, '.claude'), { recursive: true });
  writeFileSync(join(dir, '.claude', '.pipeline-state'), token);
}
// Cross-platform pass/fail commands (Windows + POSIX): `node -e process.exit(N)`.
const PASS = `${JSON.stringify(process.execPath)} -e "process.exit(0)"`;
const FAIL = `${JSON.stringify(process.execPath)} -e "process.exit(1)"`;

test('implementation subagent + passing verify → a pass verdict line is written', () => {
  const dir = makeSandbox();
  setToken(dir, 'developer:implement');
  setVerify(dir, [{ run: PASS, blocking: true }]);
  const res = stop(dir, { agentType: 'developer' });
  assert.equal(res.status, 0, 'the gate never fails the call');
  const v = lastVerdict(dir);
  assert.equal(v.verdict, 'pass');
  assert.equal(v.agent, 'developer');
  assert.equal(v.agent_id, 'agt-1');
  assert.equal(v.token, 'developer:implement', 'round-keyed by the .pipeline-state token (team-lead scoping)');
  assert.equal(v.blocking_failed, false);
  assert.ok(Array.isArray(v.commands) && v.commands[0].ok === true, 'each command records its run + ok');
});

test('implementation subagent + failing blocking verify → a fail verdict with the failing command captured', () => {
  const dir = makeSandbox();
  setToken(dir, 'developer:implement');
  setVerify(dir, [{ run: FAIL, blocking: true }]);
  const v = (stop(dir, { agentType: 'developer' }), lastVerdict(dir));
  assert.equal(v.verdict, 'fail');
  assert.equal(v.blocking_failed, true, 'a blocking command failure flips the verdict to fail');
  assert.ok(v.commands.some((c) => c.ok === false && c.blocking === true), 'the failing blocking command is captured');
});

test('a non-blocking command failure is recorded but does NOT flip the verdict to fail', () => {
  const dir = makeSandbox();
  setToken(dir, 'developer:implement');
  setVerify(dir, [{ run: PASS, blocking: true }, { run: FAIL, blocking: false }]);
  const v = (stop(dir, { agentType: 'developer' }), lastVerdict(dir));
  assert.equal(v.verdict, 'pass', 'only blocking failures gate the verdict');
  assert.equal(v.blocking_failed, false);
  assert.ok(v.commands.some((c) => c.ok === false && c.blocking === false), 'the non-blocking failure is still recorded');
});

test('the solo role is also an implementation subagent (it writes source)', () => {
  const dir = makeSandbox();
  setVerify(dir, [{ run: PASS, blocking: true }]);
  stop(dir, { agentType: 'solo' });
  assert.equal(lastVerdict(dir).verdict, 'pass');
  assert.equal(lastVerdict(dir).agent, 'solo');
});

test('a namespaced agent_type is reduced to its final segment (nexus:developer → developer)', () => {
  const dir = makeSandbox();
  setVerify(dir, [{ run: PASS, blocking: true }]);
  stop(dir, { agentType: 'nexus:developer' });
  assert.equal(lastVerdict(dir).agent, 'developer', 'matches boundary-detector/read-tracker normalization');
});

test('a recognized NON-implementation role (architect) → verify is NOT run, no verdict written', () => {
  const dir = makeSandbox();
  setVerify(dir, [{ run: FAIL, blocking: true }]); // would fail loudly if it ran
  const res = stop(dir, { agentType: 'architect' });
  assert.equal(res.status, 0);
  assert.ok(!existsSync(VERDICT(dir)), 'a non-impl stop is not the implementation boundary — no verify, no verdict');
});

test('unknown-agent fallback (HIGH-2): an ABSENT agent_type writes an agent:"unknown" verdict, never a silent skip', () => {
  const dir = makeSandbox();
  setVerify(dir, [{ run: PASS, blocking: true }]);
  const res = stop(dir, { /* agentType absent */ });
  assert.equal(res.status, 0);
  assert.ok(existsSync(VERDICT(dir)), 'a written "couldn\'t classify" is recoverable; a silent no-write is the feared false-green');
  const v = lastVerdict(dir);
  assert.equal(v.agent, 'unknown');
  assert.equal(v.verdict, 'skipped', 'verify is not run for an unclassifiable stop; the gate writes exactly verdict:"skipped" with the reason recorded');
});

test('unknown-agent fallback (HIGH-2): an UNRECOGNIZED agent_type also writes agent:"unknown"', () => {
  const dir = makeSandbox();
  setVerify(dir, [{ run: PASS, blocking: true }]);
  stop(dir, { agentType: 'some-future-role' });
  assert.equal(lastVerdict(dir).agent, 'unknown', 'an unrecognized role is classified unknown, not silently dropped');
});

test('never a deny/block (LOW-1): run+record only, in BOTH the pass and fail cases', () => {
  const dir = makeSandbox();
  setVerify(dir, [{ run: FAIL, blocking: true }]);
  const res = stop(dir, { agentType: 'developer' });
  // helpers.denyReason() only covers the PreToolUse deny shape; the SubagentStop block half needs
  // a RAW match on the decision:"block" field, which denyReason() does not read.
  assert.equal(denyReason(res), null, 'no PreToolUse-style permissionDecision:"deny"');
  assert.doesNotMatch(res.stdout, /"decision"\s*:\s*"block"/, 'no SubagentStop decision:"block" — a verify-fail must never trap the subagent in a retry loop (ADR-31)');
});

test('flag-off no-queue invariant: the gate writes a verdict but NEVER a review-queue artifact', () => {
  const dir = makeSandbox();
  setVerify(dir, [{ run: FAIL, blocking: true }]);
  stop(dir, { agentType: 'developer' });
  assert.ok(existsSync(VERDICT(dir)), 'the advisory verdict is the always-on behavior (AC-1.5)');
  assert.ok(!existsSync(QUEUE(dir)), 'the review queue is team-lead-driven (AC-3.2), never hook-driven — even on a fail');
});

test('fail-silent: malformed stdin → exit 0, no crash, no verdict written', () => {
  const dir = makeSandbox();
  const res = runHook(GATE, '{{{not json', { projectDir: dir });
  assert.equal(res.status, 0);
  assert.ok(!existsSync(VERDICT(dir)), 'a genuine parse error is zero-footprint, distinct from the unknown-agent WRITTEN record');
});

test('detection fallback: with no .claude/verify.json, the resolver synthesizes this repo\'s runner set', () => {
  const dir = makeSandbox();
  // This repo's dogfood detection: a tests/ dir + a scripts/selfcheck.mjs present → the node --test
  // glob + selfcheck command set. Recreate the structural markers in the sandbox.
  mkdirSync(join(dir, 'tests', 'unit'), { recursive: true });
  writeFileSync(join(dir, 'tests', 'unit', 'marker.test.mjs'), '// marker\n'); // a matching file → the glob is emitted
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  writeFileSync(join(dir, 'scripts', 'selfcheck.mjs'), '// marker\n');
  // No verify.json — the gate must fall back to detection and still write a verdict (not crash).
  const res = stop(dir, { agentType: 'developer' });
  assert.equal(res.status, 0);
  assert.ok(existsSync(VERDICT(dir)), 'detection fallback resolves a command set when config is absent');
  const v = lastVerdict(dir);
  assert.ok(v.commands.some((c) => /--test/.test(c.run)), 'the detected set includes the node --test runner');
});

test('absent config AND no detectable runner → fail-silent, an empty-set verdict, never a crash', () => {
  const dir = makeSandbox();
  // No verify.json, no tests/, no selfcheck — nothing to detect.
  const res = stop(dir, { agentType: 'developer' });
  assert.equal(res.status, 0, 'an undetectable project never wedges the gate');
});

test('detection fallback: an empty test dir (no *.test.mjs) does NOT synthesize a --test command → no spurious fail', () => {
  const dir = makeSandbox();
  // tests/unit exists but is EMPTY — a zero-match glob handed to `node --test` would expand to a
  // literal non-existent path and exit non-zero, a spurious verdict:"fail". The resolver must
  // resolve the glob and emit nothing for a dir with no matching files.
  mkdirSync(join(dir, 'tests', 'unit'), { recursive: true });
  // No verify.json, no selfcheck — the only structural marker is the empty test dir.
  const res = stop(dir, { agentType: 'developer' });
  assert.equal(res.status, 0);
  const v = lastVerdict(dir);
  assert.ok(!v.commands.some((c) => /--test/.test(c.run)), 'a zero-match glob is stripped — no --test command is synthesized');
  assert.equal(v.commands_count, 0, 'an empty test dir yields an empty command set');
  assert.equal(v.verdict, 'pass', 'an empty set is a clean non-blocking pass, never a false fail');
  assert.equal(v.blocking_failed, false);
});
