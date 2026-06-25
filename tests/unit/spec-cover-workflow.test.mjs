// spec-cover-workflow.test.mjs — offline runtime-contract guard for harness/spec-cover.workflow.js
// (adhoc-SpecDrivenHarnessBuild, Step 3). Mirrors workflow-contract.test.mjs: loads the workflow as raw
// text and runs it in a vm context that provides ONLY the Workflow globals (agent / parallel / phase / log
// / budget / workflow / args) with throwing Date / Math.random shims, so the same class of runtime defect
// the Inc-2 live run surfaced (static import, fs access, undefined globals, Date/Math.random, non-literal
// meta) is caught in milliseconds — without the .NET toolchain or the Workflow tool.
//
// What it pins (Step 3 acceptance):
//   • runs to its return with no ReferenceError (no fs / undefined global / Date / Math.random)
//   • parses BOTH args shapes (JSON string from the tool, object from composition)
//   • REUSE BOUNDARY (AC-1): a spec-driven RED is routed to the labeler and lands in the candidate-bug
//     queue — it is NOT run through suiteGreen as a pass/fail, and it never short-circuits the run
//   • the green-subset mutation pass scores the PASSING tests (reds quarantined)
//   • the case-4 over-rejection red (the L272 shape) is labeled and reaches the candidate-bug queue
//   • the golden-set path appears in the spec-load prompt ONLY — never in the Cover/runner/miner prompts (AC-3(a))
//   • meta is a pure literal (no concat / interpolation)
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (selfcheck.mjs:44).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, Script } from 'node:vm';

const SPEC_COVER_PATH = new URL('../../harness/spec-cover.workflow.js', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

function readWorkflow(path) {
  return readFileSync(path, 'utf8');
}

// A faithful spec-load return: 12 golden rules. The case-4 rule (GOLD-08 / NoStrayLiteralThreshold) carries
// an attestation; one rule (GOLD-XX) carries none → exercises the guided-miner branch.
function specLoadFixture() {
  const rules = [
    { id: 'GOLD-01', ruleName: 'SingleSelect', statement: 'first-violation-wins parser-free', expectedOutcome: 'SingleSelect', codeAttestation: 'GeneratedSqlValidator.cs:218-301', boundary: 'first-violation-wins' },
    { id: 'GOLD-08', ruleName: 'NoStrayLiteralThreshold', statement: 'stray literal threshold > 0.01', expectedOutcome: 'NoStrayLiteralThreshold', codeAttestation: 'GeneratedSqlValidator.cs:260-277', boundary: '> 0.01' },
    { id: 'GOLD-XX', ruleName: '', statement: 'a rule with no attestation (miner-needed)' },
  ];
  return { rules };
}

// A runner return whose testOutcomes contain ONE case-4 red (expected null, actual NoStrayLiteralThreshold —
// the L272 shape) plus a green test. testRuns = the GREEN subset double-run (the red is quarantined first).
function runnerFixture() {
  return {
    testRuns: [
      { passed: 2, failed: 0, skipped: 0 },
      { passed: 2, failed: 0, skipped: 0 },
    ],
    strykerReportPath: 'D:\\mock\\mutation-report.json',
    mutants: [
      { status: 'Killed', location: { start: { line: 276 } }, mutatorName: 'Equality', replacement: '>=' },
      { status: 'Killed', location: { start: { line: 228 } }, mutatorName: 'Conditional', replacement: 'false' },
    ],
    mutatedFiles: [{ file: 'D:\\x\\GeneratedSqlValidator.cs', count: 2 }],
    testOutcomes: [
      // case 4 — expected null (spec-valid), actual a rule fired (L272 over-rejection).
      { id: 'GOLD-08', ruleName: 'NoStrayLiteralThreshold', expected: null, actual: 'NoStrayLiteralThreshold', errored: false },
      // a green test — expected == actual.
      { id: 'GOLD-01', ruleName: 'SingleSelect', expected: 'SingleSelect', actual: 'SingleSelect', errored: false },
    ],
  };
}

// Fixtures consumed in order per agent() call. Order in the workflow (runDate set → date-stamp SKIPPED):
//   spec-load → guided-miner → spec-cover (write, return ignored) → runner → report-write
function fixtures() {
  return [
    specLoadFixture(),
    { locations: [{ id: 'GOLD-XX', location: 'NO-CODE-FOUND' }] }, // guided-miner: the no-attestation rule is code-missing
    null,                                                          // spec-cover agent: Write() is the deliverable
    runnerFixture(),                                              // runner
    { written: true },                                           // report-write
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
  const result = await new Script(`(async () => { ${patchedSrc} })()`, { filename: 'spec-cover-under-test.js' }).runInContext(ctx);
  return { result, calls };
}

const ARGS = JSON.stringify({ runDate: '2026-06-25' });

test('spec-cover.workflow.js has no static import', () => {
  assert.equal(/^import\s+/m.test(readWorkflow(SPEC_COVER_PATH)), false, 'static import is a syntax error in the Workflow runtime');
});

test('spec-cover runs in the mock-globals sandbox without ReferenceError (no fs / Date / Math.random / undefined global)', async () => {
  let threw = null;
  try { await runInSandbox(readWorkflow(SPEC_COVER_PATH), fixtures(), ARGS); }
  catch (err) { threw = err; }
  assert.equal(threw, null, `spec-cover threw in sandbox: ${threw?.message}`);
});

test('spec-cover parses JSON-STRING args (Workflow-tool injection shape) AND object args (composition shape)', async () => {
  const strRun = await runInSandbox(readWorkflow(SPEC_COVER_PATH), fixtures(), JSON.stringify({ runDate: '2026-06-25', targetClass: 'GeneratedSqlValidator' }));
  assert.equal(strRun.result?.target?.class, 'GeneratedSqlValidator', 'string args JSON.parsed → _args honored');
  const objRun = await runInSandbox(readWorkflow(SPEC_COVER_PATH), fixtures(), { runDate: '2026-06-25', targetClass: 'GeneratedSqlValidator' });
  assert.equal(objRun.result?.target?.class, 'GeneratedSqlValidator', 'object args honored as-is');
});

test('REUSE BOUNDARY (AC-1): the case-4 over-rejection RED is labeled and lands in the candidate-bug queue — never gated away by suiteGreen', async () => {
  const { result } = await runInSandbox(readWorkflow(SPEC_COVER_PATH), fixtures(), ARGS);
  assert.ok(Array.isArray(result?.candidateBugQueue), 'return carries the candidate-bug queue');
  const l272 = result.candidateBugQueue.find((e) => e.ruleName === 'NoStrayLiteralThreshold');
  assert.ok(l272, 'the case-4 red reached the candidate-bug queue (the run did NOT short-circuit on a red)');
  assert.equal(l272.label, 'over-rejection', 'the L272 red is labeled over-rejection (case 4)');
  assert.equal(l272.needsTriage, true, 'case 4 is tagged needs-triage (real-or-fixture, not auto-decided)');
});

test('the green-subset mutation pass scores the PASSING tests (reds quarantined) — greenSubsetProven on a 100% green subset', async () => {
  const { result } = await runInSandbox(readWorkflow(SPEC_COVER_PATH), fixtures(), ARGS);
  assert.equal(result?.mutationScore, 100, '2/2 killed on the green subset = 100%');
  assert.equal(result?.greenSubsetProven, true, 'target_mutated + suite_green_subset + no_flaky + mutation_floor all pass over the green subset');
  // suite_green is computed over the GREEN subset as a precondition — it must NOT carry the reds.
  assert.equal(result?.greenGates?.suite_green_subset?.pass, true, 'suite_green_subset passes (reds were quarantined, not run through it)');
});

test('AC-3(a): the golden-set path appears in the spec-load prompt ONLY — not in the Cover / runner / miner prompts', async () => {
  const { calls } = await runInSandbox(readWorkflow(SPEC_COVER_PATH), fixtures(), ARGS);
  const goldenRe = /golden-set\.md/;
  const specLoad = calls.find((c) => c.opts?.label === 'spec-load');
  const cover = calls.find((c) => c.opts?.label === 'spec-cover');
  const runner = calls.find((c) => c.opts?.label === 'runner');
  const miner = calls.find((c) => c.opts?.label === 'guided-miner');
  assert.ok(specLoad && goldenRe.test(specLoad.promptFull), 'spec-load prompt carries the golden-set path (it is the permitted reader)');
  assert.equal(goldenRe.test(cover?.promptFull ?? ''), false, 'Cover prompt must NOT contain the golden-set path (ADR-C)');
  assert.equal(goldenRe.test(runner?.promptFull ?? ''), false, 'runner prompt must NOT contain the golden-set path');
  assert.equal(goldenRe.test(miner?.promptFull ?? ''), false, 'miner prompt must NOT contain the golden-set path (rule statements handed inline)');
});

test('AC-3(b): the Cover prompt directs tests into the isolated assembly and forbids KnowledgeGateway.Tests', async () => {
  const { calls } = await runInSandbox(readWorkflow(SPEC_COVER_PATH), fixtures(), ARGS);
  const cover = calls.find((c) => c.opts?.label === 'spec-cover');
  assert.ok(cover, 'spec-cover agent was invoked');
  assert.match(cover.promptFull, /SpecHarness\.Tests/, 'Cover writes into the isolated SpecHarness.Tests assembly');
  assert.match(cover.promptFull, /NOT KnowledgeGateway\.Tests/i, 'Cover is forbidden from referencing KnowledgeGateway.Tests');
});

test('meta is a pure literal (no string concat / template interpolation)', () => {
  const src = readWorkflow(SPEC_COVER_PATH);
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
