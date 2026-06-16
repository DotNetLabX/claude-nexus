// T2 — the GOLDEN regression test (AC-0.3, ADR-30): autonomy is a strictly ADDITIVE mode, and
// this test is the mechanical form of the don't-break-attended constraint. With the flag OFF (no
// [UNATTENDED] anywhere — and note a hook can't see the flag at all, so "off" is simply the
// unconditional advisory behavior), it pins the offline observables AC-0.3 names. *This test must
// exist and pass before any other v1 code merges* (CR-3).
//
// Why these specific assertions (the critic's MED-1 adjudication):
//   (a)  the new verify-gate emits zero deny/block and writes NO review-queue artifact (the
//        advisory verdict in .claude/audit/ IS allowed — that is the always-on AC-1.5 behavior,
//        present in both modes; "filesystem no-op" means "no queue artifact + no deny", per the
//        binding interpretation, NOT "writes nothing").
//   (b)  pipeline-gate.js + guard.js still decide as expected for a fixed fixture set — a
//        DOCUMENTATION pin (neither gate is in any v1 step's modify list, so it can't fail from
//        anything v1 does; it records AC-0.3b's intent).
//   (b') THE ASSERTION THAT BITES: with the new SubagentStop entry PRESENT in hooks.json, the
//        existing PreToolUse/PostToolUse hooks still fire and decide identically — i.e. the new
//        entry didn't corrupt sibling registration or break the hooks.json parse. This is the
//        real attended-regression catch (a malformed new entry breaking the whole file).
//   (c)  the gate's advisory run (pass OR fail) exits 0 and emits no deny — it never alters exit
//        codes or blocks.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, runHook, denyReason, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const HOOKS = join(pluginRoot('nexus'), 'hooks', 'scripts');
const GATE = join(HOOKS, 'verify-gate.js');
const PIPELINE = join(HOOKS, 'pipeline-gate.js');
const GUARD = join(HOOKS, 'guard.js');
const hooksJson = readFileSync(join(pluginRoot('nexus'), 'hooks', 'hooks.json'), 'utf8');
after(cleanupSandboxes);

const write = (fp, content = 'x') => ({ tool_name: 'Write', tool_input: { file_path: fp, content } });
function withState(token) {
  const dir = makeSandbox();
  mkdirSync(join(dir, '.claude'), { recursive: true });
  if (token !== null) writeFileSync(join(dir, '.claude', '.pipeline-state'), token);
  return dir;
}

// ── (a) the verify gate is advisory-only: zero deny/block, no review-queue artifact ──────────
test('(a) verify-gate emits no deny/block and writes NO review-queue artifact (advisory verdict is allowed)', () => {
  const dir = makeSandbox();
  mkdirSync(join(dir, '.claude'), { recursive: true });
  writeFileSync(join(dir, '.claude', 'verify.json'), JSON.stringify({ commands: [{ run: `${JSON.stringify(process.execPath)} -e "process.exit(1)"`, blocking: true }] }));
  const res = runHook(GATE, { session_id: 's', agent_id: 'a', agent_type: 'developer', cwd: dir }, { projectDir: dir });
  assert.equal(res.status, 0, 'advisory run exits 0 even on a failing verify');
  assert.equal(denyReason(res), null, 'no PreToolUse-style deny');
  assert.doesNotMatch(res.stdout, /"decision"\s*:\s*"block"/, 'no SubagentStop block');
  assert.ok(!existsSync(join(dir, '.claude', 'review-queue')), 'the gate never writes the review queue — that is team-lead-driven (AC-3.2)');
  assert.ok(existsSync(join(dir, '.claude', 'audit', 'verify-verdict.json')), 'the advisory verdict IS written (AC-1.5) — allowed in both modes');
});

// ── (b) documentation pin: the unmodified gates still decide as expected (representative set) ──
// Reuses the canonical fixtures from pipeline-gate.test.mjs / guard.test.mjs. This can never fail
// from a v1 change (neither gate is modified); it records the AC-0.3b intent.
const APPROVED_OPEN_HIGH = [
  '## Step 2 — Code Review', '', '## Verdict: APPROVED', '', '## Findings', '',
  '### [HIGH] SQL injection in OrderQuery',
  '**File:** `src/Orders/OrderQuery.cs:42`',
  '**Issue:** user input concatenated into the WHERE clause',
  '**Fix:** parameterize the query',
].join('\n');

test('(b) documentation pin: pipeline-gate + guard decide identically to the pre-v1 baseline for fixed fixtures', () => {
  const analyze = withState('architect:analyze');
  assert.match(denyReason(runHook(PIPELINE, write('docs/specs/F1/delivery/plan.md'), { projectDir: analyze })) || '', /analyze phase/, 'analyze-phase plan.md deny');
  assert.match(denyReason(runHook(PIPELINE, write('src/Feature/Handler.cs'), { projectDir: analyze })) || '', /analyze phase/, 'analyze-phase source deny');
  const implement = withState('developer:implement');
  assert.equal(denyReason(runHook(PIPELINE, write('src/Feature/Handler.cs'), { projectDir: implement })), null, 'implement-phase source allow');
  const noState = withState(null);
  assert.match(denyReason(runHook(PIPELINE, write('docs/specs/F1/delivery/review.md', APPROVED_OPEN_HIGH), { projectDir: noState })) || '', /APPROVED while an unresolved/, 'review-verdict integrity deny');
  assert.ok(denyReason(runHook(GUARD, { tool_name: 'Read', tool_input: { file_path: '.env' } }, { argv: ['open'] })), 'guard secret-read deny');
});

// ── (b') THE ASSERTION THAT BITES: the new entry didn't corrupt the file or sibling registration ──
test('(b\') hooks.json still parses and registers the existing PreToolUse/PostToolUse siblings unchanged', () => {
  const cfg = JSON.parse(hooksJson); // a malformed new SubagentStop entry would throw here
  // Sibling events are present and structurally intact.
  for (const ev of ['SessionStart', 'PreToolUse', 'PostToolUse']) {
    assert.ok(Array.isArray(cfg.hooks[ev]) && cfg.hooks[ev].length > 0, `${ev} registration intact`);
  }
  // The new event was added cleanly, matcher-less, pointing at verify-gate.js.
  assert.ok(Array.isArray(cfg.hooks.SubagentStop) && cfg.hooks.SubagentStop.length === 1, 'one SubagentStop entry');
  assert.equal(cfg.hooks.SubagentStop[0].matcher, undefined, 'SubagentStop is matcher-less (Stop-family takes no tool matcher)');
  assert.match(cfg.hooks.SubagentStop[0].hooks[0].command, /verify-gate\.js/, 'it wires verify-gate.js');
});

test('(b\') the sibling hooks still FIRE and decide identically with the new entry present', () => {
  // Drive the existing gates through runHook against the CURRENT hooks.json state — proving the
  // new SubagentStop entry neither hijacked a sibling's event nor broke their behavior.
  const analyze = withState('architect:analyze');
  assert.match(denyReason(runHook(PIPELINE, write('src/X.cs'), { projectDir: analyze })) || '', /analyze phase/, 'pipeline-gate still denies under :analyze');
  const implement = withState('developer:implement');
  assert.equal(denyReason(runHook(PIPELINE, write('src/X.cs'), { projectDir: implement })), null, 'pipeline-gate still allows under :implement');
  assert.ok(denyReason(runHook(GUARD, { tool_name: 'Bash', tool_input: { command: 'rm -rf /' } }, { argv: ['open'] })), 'guard still denies a catastrophic op');
});

// ── (c) the advisory run never alters exit codes or blocks — pass AND fail ────────────────────
test('(c) the gate exits 0 and emits no deny for BOTH a passing and a failing verify run', () => {
  for (const code of [0, 1]) {
    const dir = makeSandbox();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'verify.json'), JSON.stringify({ commands: [{ run: `${JSON.stringify(process.execPath)} -e "process.exit(${code})"`, blocking: true }] }));
    const res = runHook(GATE, { session_id: 's', agent_id: 'a', agent_type: 'developer', cwd: dir }, { projectDir: dir });
    assert.equal(res.status, 0, `verify exit ${code} → hook still exits 0`);
    assert.equal(denyReason(res), null, `verify exit ${code} → no deny`);
    assert.doesNotMatch(res.stdout, /"decision"\s*:\s*"block"/, `verify exit ${code} → no block`);
  }
});
