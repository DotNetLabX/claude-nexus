// spec-cover-calc-workflow.test.mjs — offline runtime-contract guard for harness/spec-cover-calc.workflow.js
// (adhoc-SddCoverageLoop, Step 3). Mirrors tests/unit/spec-cover-workflow.test.mjs (the validator front-end's
// own mirror test): loads the workflow as raw text and runs it in a vm context that provides ONLY the Workflow
// globals (agent / parallel / phase / log / budget / workflow / args) with throwing Date / Math.random shims,
// so the same class of runtime defect the Inc-2 live run surfaced (static import, fs access, undefined
// globals, Date/Math.random, non-literal meta) is caught in milliseconds — without the .NET toolchain or the
// Workflow tool.
//
// What it pins (Step 3 acceptance):
//   • runs to its return with no ReferenceError (no fs / undefined global / Date / Math.random)
//   • parses BOTH args shapes (JSON string from the tool, object from composition)
//   • REUSE BOUNDARY (AC-1): a spec-driven RED is routed to the outcome-labeler and lands in the
//     candidate-bug queue — it is NOT run through suiteGreen as a pass/fail, and it never short-circuits the run
//   • the green-subset mutation pass scores the PASSING tests (reds quarantined)
//   • a numeric divergence outside epsilon is labeled and reaches the candidate-bug queue with a direction
//   • the spec-oracle path appears in the spec-load prompt ONLY — never in the Cover/runner/miner prompts
//   • meta is a pure literal (no concat / interpolation)
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (selfcheck.mjs:44).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, Script } from 'node:vm';

const SPEC_COVER_CALC_PATH = new URL('../../harness/spec-cover-calc.workflow.js', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

function readWorkflow(path) {
  return readFileSync(path, 'utf8');
}

// A faithful spec-load return: the 4 rules from spec-rules-bugratio.md (SR-1..4), none carrying
// codeAttestation — every rule routes to the guided miner (Step-1 clean-room design, Q1).
function specLoadFixture() {
  const rules = [
    { id: 'SR-1', ruleName: 'BugClassification', statement: 'IssueType == "Bug" (exact match, case-sensitive)', expectedOutcome: { kind: 'boolean', targetField: 'bugClassification', condition: 'IssueType == "Bug"' } },
    { id: 'SR-2', ruleName: 'BugRatioPercent', statement: 'ratio of totals: totalBugSp / totalCompletedSp * 100', expectedOutcome: { kind: 'numeric', targetField: 'bugRatioPercent', condition: 'totalBugSp/totalCompletedSp*100', epsilon: 1e-9 } },
    { id: 'SR-3', ruleName: 'AlertActive', statement: 'consecutiveStreak >= consecutiveSprintCountThreshold', expectedOutcome: { kind: 'boolean', targetField: 'alertActive', condition: 'consecutiveStreak >= threshold' }, boundary: 'consecutiveSprintCountThreshold=2' },
    { id: 'SR-4', ruleName: 'ConsecutiveStreak', statement: 'count of trailing consecutive qualifying sprints', expectedOutcome: { kind: 'streak-integer', targetField: 'consecutiveStreak', condition: 'trailing count where bugRatioPercent >= threshold' }, boundary: 'threshold=50%' },
  ];
  return { rules };
}

// All 4 rules are miner-needed (no attestation) — the guided miner locates all 4.
function minerFixture() {
  return {
    locations: [
      { id: 'SR-1', location: 'BugRatioAnalyzer.cs:20' },
      { id: 'SR-2', location: 'BugRatioAnalyzer.cs:40' },
      { id: 'SR-3', location: 'BugRatioAnalyzer.cs:60' },
      { id: 'SR-4', location: 'BugRatioAnalyzer.cs:70' },
    ],
  };
}

// A runner return whose testOutcomes contain a numeric over-divergence (SR-2: expected 33.33, actual 40 —
// outside epsilon) and a boolean divergence (SR-3), plus two green tests (SR-1, SR-4). testRuns = the GREEN
// subset double-run (the reds are quarantined first).
function runnerFixture() {
  return {
    testRuns: [
      { passed: 2, failed: 0, skipped: 0 },
      { passed: 2, failed: 0, skipped: 0 },
    ],
    strykerReportPath: 'D:\\mock\\bugratio-mutation-report.json',
    mutants: [
      { status: 'Killed', location: { start: { line: 20 } }, mutatorName: 'Equality', replacement: '!=' },
      { status: 'Killed', location: { start: { line: 42 } }, mutatorName: 'Arithmetic', replacement: '+' },
    ],
    mutatedFiles: [{ file: 'D:\\x\\BugRatioAnalyzer.cs', count: 2 }],
    testOutcomes: [
      { id: 'SR-1', ruleName: 'BugClassification', kind: 'boolean', expected: true, actual: true, errored: false },
      // numeric divergence outside epsilon — actual > expected → direction "over".
      { id: 'SR-2', ruleName: 'BugRatioPercent', kind: 'numeric', expected: 33.33, actual: 40, epsilon: 1e-9, errored: false },
      // boolean divergence.
      { id: 'SR-3', ruleName: 'AlertActive', kind: 'boolean', expected: true, actual: false, errored: false },
      { id: 'SR-4', ruleName: 'ConsecutiveStreak', kind: 'streak-integer', expected: 2, actual: 2, errored: false },
    ],
  };
}

// Fixtures consumed in order per agent() call. Order in the workflow (runDate set → date-stamp SKIPPED):
//   spec-load → guided-miner → spec-cover-calc (write, return ignored) → runner → report-write
function fixtures() {
  return [
    specLoadFixture(),
    minerFixture(),
    null,               // spec-cover-calc agent: Write() is the deliverable
    runnerFixture(),    // runner
    { written: true },  // report-write
  ];
}

async function runInSandbox(src, agentFixtures, argsValue) {
  let callIndex = 0;
  const calls = [];
  function thr() { throw new ReferenceError('Date.now() / new Date() unavailable in workflow scripts (breaks resume).'); }
  thr.now = () => { throw new ReferenceError('Date.now() unavailable in workflow scripts (breaks resume).'); };
  const throwingMath = Object.create(null);
  for (const k of Object.getOwnPropertyNames(Math)) {
    throwingMath[k] = typeof Math[k] === 'function'
      ? (k === 'random' ? () => { throw new ReferenceError('Math.random() unavailable in workflow scripts (breaks resume).'); } : Math[k].bind(Math))
      : Math[k];
  }
  const sandbox = {
    agent: async (prompt, opts) => {
      const fixture = agentFixtures[callIndex++] ?? null;
      calls.push({ promptFull: typeof prompt === 'string' ? prompt : '', opts, returned: fixture });
      return fixture;
    },
    parallel: async (fns) => { const r = []; for (const fn of fns) r.push(await fn()); return r; },
    phase: () => {},
    log: () => {},
    budget: { spent: () => 42000 },
    workflow: async () => null,
    args: argsValue ?? null,
    Date: thr,
    Math: throwingMath,
    // Deliberately NOT provided: read, require, fs, process — any use throws ReferenceError.
  };
  const patchedSrc = src.replace(/^export\s+const\s+meta\s*=/m, 'const meta =');
  const ctx = createContext(sandbox);
  const result = await new Script(`(async () => { ${patchedSrc} })()`, { filename: 'spec-cover-calc-under-test.js' }).runInContext(ctx);
  return { result, calls };
}

const ARGS = JSON.stringify({ runDate: '2026-07-02' });

test('spec-cover-calc.workflow.js has no static import', () => {
  assert.equal(/^import\s+/m.test(readWorkflow(SPEC_COVER_CALC_PATH)), false, 'static import is a syntax error in the Workflow runtime');
});

test('spec-cover-calc runs in the mock-globals sandbox without ReferenceError (no fs / Date / Math.random / undefined global)', async () => {
  let threw = null;
  try { await runInSandbox(readWorkflow(SPEC_COVER_CALC_PATH), fixtures(), ARGS); }
  catch (err) { threw = err; }
  assert.equal(threw, null, `spec-cover-calc threw in sandbox: ${threw?.message}`);
});

test('spec-cover-calc parses JSON-STRING args (Workflow-tool injection shape) AND object args (composition shape)', async () => {
  const strRun = await runInSandbox(readWorkflow(SPEC_COVER_CALC_PATH), fixtures(), JSON.stringify({ runDate: '2026-07-02', targetClass: 'BugRatioAnalyzer' }));
  assert.equal(strRun.result?.target?.class, 'BugRatioAnalyzer', 'string args JSON.parsed → _args honored');
  const objRun = await runInSandbox(readWorkflow(SPEC_COVER_CALC_PATH), fixtures(), { runDate: '2026-07-02', targetClass: 'BugRatioAnalyzer' });
  assert.equal(objRun.result?.target?.class, 'BugRatioAnalyzer', 'object args honored as-is');
});

test('REUSE BOUNDARY (AC-1): a numeric-outside-epsilon RED is labeled and lands in the candidate-bug queue — never gated away by suiteGreen', async () => {
  const { result } = await runInSandbox(readWorkflow(SPEC_COVER_CALC_PATH), fixtures(), ARGS);
  assert.ok(Array.isArray(result?.candidateBugQueue), 'return carries the candidate-bug queue');
  const ratio = result.candidateBugQueue.find((e) => e.ruleName === 'BugRatioPercent');
  assert.ok(ratio, 'the numeric-divergence red reached the candidate-bug queue (the run did NOT short-circuit on a red)');
  assert.equal(ratio.label, 'value-divergence', 'the numeric divergence is labeled value-divergence');
  assert.equal(ratio.direction, 'over', 'actual (40) > expected (33.33) → direction "over"');
  const alert = result.candidateBugQueue.find((e) => e.ruleName === 'AlertActive');
  assert.ok(alert, 'the boolean-divergence red also reached the candidate-bug queue');
  assert.equal(alert.label, 'value-divergence');
  assert.equal(alert.direction, undefined, 'a boolean divergence has no over/under direction');
});

test('green-only rules (SR-1, SR-4) do NOT appear in the candidate-bug queue', async () => {
  const { result } = await runInSandbox(readWorkflow(SPEC_COVER_CALC_PATH), fixtures(), ARGS);
  const names = result.candidateBugQueue.map((e) => e.ruleName);
  assert.equal(names.includes('BugClassification'), false, 'SR-1 matched (true===true) — not a red');
  assert.equal(names.includes('ConsecutiveStreak'), false, 'SR-4 matched (2===2) — not a red');
});

test('the green-subset mutation pass scores the PASSING tests (reds quarantined) — greenSubsetProven on a 100% green subset', async () => {
  const { result } = await runInSandbox(readWorkflow(SPEC_COVER_CALC_PATH), fixtures(), ARGS);
  assert.equal(result?.mutationScore, 100, '2/2 killed on the green subset = 100%');
  assert.equal(result?.greenSubsetProven, true, 'target_mutated + suite_green_subset + no_flaky + mutation_floor all pass over the green subset');
  assert.equal(result?.greenGates?.suite_green_subset?.pass, true, 'suite_green_subset passes (reds were quarantined, not run through it)');
});

test('the spec-oracle path appears in the spec-load prompt ONLY — not in the Cover / runner / miner prompts (AC-2, Q1)', async () => {
  const { calls } = await runInSandbox(readWorkflow(SPEC_COVER_CALC_PATH), fixtures(), ARGS);
  const oracleRe = /spec-rules-bugratio\.md/;
  const specLoad = calls.find((c) => c.opts?.label === 'spec-load');
  const cover = calls.find((c) => c.opts?.label === 'spec-cover-calc');
  const runner = calls.find((c) => c.opts?.label === 'runner');
  const miner = calls.find((c) => c.opts?.label === 'guided-miner');
  assert.ok(specLoad && oracleRe.test(specLoad.promptFull), 'spec-load prompt carries the spec-oracle path (it is the permitted reader)');
  assert.equal(oracleRe.test(cover?.promptFull ?? ''), false, 'Cover prompt must NOT contain the spec-oracle path');
  assert.equal(oracleRe.test(runner?.promptFull ?? ''), false, 'runner prompt must NOT contain the spec-oracle path');
  assert.equal(oracleRe.test(miner?.promptFull ?? ''), false, 'miner prompt must NOT contain the spec-oracle path (rule statements handed inline)');
});

test('the spec-oracle path is also absent from the guided-miner/runner/cover prompts under the sequestered SR golden-set filename (defense in depth)', async () => {
  const { calls } = await runInSandbox(readWorkflow(SPEC_COVER_CALC_PATH), fixtures(), ARGS);
  const goldenRe = /golden-set\.md/;
  for (const c of calls) {
    assert.equal(goldenRe.test(c.promptFull ?? ''), false, `${c.opts?.label} prompt must never cite the sequestered SR golden set`);
  }
});

test('the Cover prompt directs tests into the isolated assembly and forbids Fokus.Domain.Tests', async () => {
  const { calls } = await runInSandbox(readWorkflow(SPEC_COVER_CALC_PATH), fixtures(), ARGS);
  const cover = calls.find((c) => c.opts?.label === 'spec-cover-calc');
  assert.ok(cover, 'spec-cover-calc agent was invoked');
  assert.match(cover.promptFull, /SpecHarness\.Tests/, 'Cover writes into the isolated Fokus.Domain.SpecHarness.Tests assembly');
  assert.match(cover.promptFull, /NOT Fokus\.Domain\.Tests/i, 'Cover is forbidden from referencing Fokus.Domain.Tests');
});

test('the Cover prompt directs the agent to bind intent targetField to the real return-type member itself (Q1: intent→member binding is the test-writer\'s job, not the spec-oracle\'s)', async () => {
  const { calls } = await runInSandbox(readWorkflow(SPEC_COVER_CALC_PATH), fixtures(), ARGS);
  const cover = calls.find((c) => c.opts?.label === 'spec-cover-calc');
  assert.match(cover.promptFull, /real return-type member/i, 'Cover prompt explicitly assigns intent→member binding to the test-writer');
});

test('meta is a pure literal (no string concat / template interpolation)', () => {
  const src = readWorkflow(SPEC_COVER_CALC_PATH);
  const m = src.match(/\bmeta\s*=\s*\{/);
  assert.ok(m, 'meta block found');
  let depth = 0, block = '';
  for (let i = m.index + m[0].length - 1; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) { block = src.slice(m.index, i + 1); break; }
  }
  assert.equal(/['"]\s*\+\s*['"]/.test(block), false, 'no string concatenation in meta (BinaryExpression)');
  assert.equal(/`[^`]*\$\{/.test(block), false, 'no template interpolation in meta');
});
