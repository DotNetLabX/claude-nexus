// workflow-contract.test.mjs — offline contract guard for the harness Workflow scripts (Inc 3, Step 2).
//
// The Inc-2 live-run surfaced 3 runtime defects invisible to `node --check`:
//   1. static `import` (syntax error in the Workflow runtime's non-module context)
//   2. `read()` calls (not a Workflow global — orchestrators have no fs access)
//   3. undefined global references
//
// This suite loads each workflow script as raw text and validates its runtime contract in milliseconds,
// without the .NET toolchain or the Workflow tool. It mocks the six Workflow globals (agent / phase /
// log / budget / workflow / args) and fixture-returns so the orchestration code runs to its return.
//
// Limitations (known, documented):
//   • The sandbox has no filesystem — the KB-file seam (Step 4) is covered by kb-write.test.mjs.
//   • The mock agent() returns fixture data; real agent output is non-deterministic.
//   • `node --check` (syntax only) is NECESSARY but NOT SUFFICIENT. This test is the SUFFICIENT guard.
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, Script } from 'node:vm';

// ---- Paths to the workflow scripts ---------------------------------------------------------------
const MINE_VERIFY_PATH = new URL('../../harness/mine-verify.workflow.js', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const COVER_PATH       = new URL('../../harness/cover.workflow.js',       import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const LOOP_PATH        = new URL('../../harness/loop.workflow.js',        import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

// ---- Raw source readers --------------------------------------------------------------------------
function readWorkflow(path) {
  return readFileSync(path, 'utf8');
}

// ---- Static-import detector ----------------------------------------------------------------------
// A static `import` in a Workflow script is a syntax error at runtime (non-module context).
// Detect it without executing the code.
function hasStaticImport(src) {
  // Match `import ... from` or `import "..."` / `import '...'` at statement position.
  // Allow inline strings containing the word import (e.g. in comments or strings).
  return /^import\s+/m.test(src);
}

// ---- Undefined-global sandbox -------------------------------------------------------------------
// Runs the workflow body in a vm context that provides ONLY the six Workflow globals.
// Any access to an undefined name (e.g. `read`, `require`, `fs`, `process`) throws ReferenceError.
// `args` is provided as a mock so the Step-1 parameterization guard doesn't throw on `typeof args`.
//
// The function signature: run(src, agentFixtures) → the `return` value of the script.
// agentFixtures: a list of return values, consumed in order per `agent()` call.
async function runInSandbox(src, agentFixtures = []) {
  let callIndex = 0;
  const calls = []; // records every agent() call shape

  const mockBudget = { spent: () => 42000 };

  // Throwing shims for Workflow-forbidden globals.
  // The real Workflow runtime disallows Date.now() / new Date() / Math.random() — they throw and
  // break resume. Mirror that here so the sandbox catches the same class of defect offline.
  function throwingDateShim() {
    throw new ReferenceError('Date.now() / new Date() are unavailable in workflow scripts (breaks resume).');
  }
  throwingDateShim.now = function () {
    throw new ReferenceError('Date.now() / new Date() are unavailable in workflow scripts (breaks resume).');
  };

  // Math: expose all standard methods EXCEPT random, which throws like the real Workflow runtime.
  const throwingMath = Object.create(null);
  for (const k of Object.getOwnPropertyNames(Math)) {
    throwingMath[k] = typeof Math[k] === 'function'
      ? (k === 'random' ? function () { throw new ReferenceError('Math.random() is unavailable in workflow scripts (breaks resume).'); } : Math[k].bind(Math))
      : Math[k];
  }

  // Mock Workflow globals:
  const sandbox = {
    // agent(prompt, opts) — returns the next fixture, records the call.
    agent: async (prompt, opts) => {
      const fixture = agentFixtures[callIndex++] ?? null;
      calls.push({ prompt: typeof prompt === 'string' ? prompt.slice(0, 80) : prompt, opts, returned: fixture });
      return fixture;
    },
    // parallel(fns) — runs each fn sequentially (no true parallelism needed in the test).
    parallel: async (fns) => {
      const results = [];
      for (const fn of fns) results.push(await fn());
      return results;
    },
    phase: (name) => { /* no-op */ },
    log:   (msg)  => { /* no-op */ },
    budget: mockBudget,
    // workflow({scriptPath}) — the nesting primitive (unverified in the real runtime).
    // Returns a mock result shaped like a mine-verify return.
    workflow: async ({ scriptPath } = {}, extraArgs) => ({
      consensusRules: [{ id: 'BR-1', kind: 'interpretive', agreement: 3, lines: '10-20', statement: 'mock rule' }],
      counts: { consensusRules: 1 },
      outputTokensThisTurn: 1000,
    }),
    // args global — present so `typeof args` succeeds; _args fallback reads it.
    args: null, // null → falsy → _args = {} → defaults kick in.
    // Forbidden globals: Date and Math.random throw exactly as in the real Workflow runtime.
    // Any script that calls new Date() / Date.now() / Math.random() will throw — which is correct.
    Date: throwingDateShim,
    Math: throwingMath,
    // Deliberately NOT provided: read, require, fs, process.
    // Any script that uses `read(...)` will throw ReferenceError — which is what we want to catch.
  };

  // Strip the `export const meta = ...;` statement so vm can execute the body.
  // The meta export is a Workflow tool requirement but invalid JS syntax in a vm context
  // (vm doesn't handle `export`). We replace `export const meta` → `const meta` so the body runs.
  const patchedSrc = src.replace(/^export\s+const\s+meta\s*=/m, 'const meta =');

  const ctx = createContext(sandbox);
  // Wrap in an async IIFE so the top-level `await` in the workflow body works.
  const wrapped = `(async () => { ${patchedSrc} })()`;
  const script = new Script(wrapped, { filename: 'workflow-under-test.js' });
  const result = await script.runInContext(ctx);
  return { result, calls };
}

// ==================================================================================================
// Slice 1: no static import in either workflow script
// ==================================================================================================
test('mine-verify.workflow.js has no static import', () => {
  const src = readWorkflow(MINE_VERIFY_PATH);
  assert.equal(hasStaticImport(src), false, 'static `import` would be a syntax error in the Workflow runtime');
});

test('cover.workflow.js has no static import', () => {
  const src = readWorkflow(COVER_PATH);
  assert.equal(hasStaticImport(src), false, 'static `import` would be a syntax error in the Workflow runtime');
});

// ==================================================================================================
// Slice 2: mine-verify.workflow.js runs without ReferenceError (no undefined global)
// ==================================================================================================
test('mine-verify runs in mock-globals sandbox without ReferenceError', async () => {
  const src = readWorkflow(MINE_VERIFY_PATH);

  // Fixture agent returns that satisfy every agent() call in mine-verify:
  //   • 3 miners → { rules: [...] }
  //   • 1 consolidator → { consistencyScore, contradictions, consensusRules }
  //   • 1 slicer (for interpretive rules) → { slices: [...] }
  //   • 1 batch verifier → { verdicts: [...] }
  //   • 1 transcribed check → { failures: [] }
  const minerResult = { rules: [{ statement: 'rule A', quote: 'code()', lines: '10-12' }] };
  const consolidateResult = {
    consistencyScore: '1 rule in all 3',
    contradictions: [],
    consensusRules: [
      { id: 'BR-1', statement: 'rule A', quote: 'code()', lines: '10-12', agreement: 3, kind: 'interpretive' },
    ],
  };
  const slicerResult = { slices: [{ id: 'BR-1', slice: 'slice text' }] };
  const batchVerifierResult = { verdicts: [{ id: 'BR-1', verdict: 'CONFIRMED', evidence: 'ok' }] };
  const transcribedResult = { failures: [] };

  const fixtures = [
    minerResult, minerResult, minerResult, // 3 miners (run via parallel)
    consolidateResult,
    slicerResult,
    batchVerifierResult,
    transcribedResult,
  ];

  let threw = null;
  try {
    await runInSandbox(src, fixtures);
  } catch (err) {
    threw = err;
  }
  assert.equal(threw, null, `mine-verify threw in sandbox: ${threw?.message}`);
});

// ==================================================================================================
// Slice 3: mine-verify returns consensusRules with id/kind/agreement/lines/statement
// ==================================================================================================
test('mine-verify sandbox return has consensusRules array with expected shape', async () => {
  const src = readWorkflow(MINE_VERIFY_PATH);
  const minerResult = { rules: [{ statement: 'rule A', quote: 'code()', lines: '10-12' }] };
  const consolidateResult = {
    consistencyScore: '1 rule in all 3',
    contradictions: [],
    consensusRules: [
      { id: 'BR-1', statement: 'rule A', quote: 'code()', lines: '10-12', agreement: 3, kind: 'interpretive' },
    ],
  };
  const slicerResult = { slices: [{ id: 'BR-1', slice: 'slice text' }] };
  const batchVerifierResult = { verdicts: [{ id: 'BR-1', verdict: 'CONFIRMED', evidence: 'ok' }] };
  const transcribedResult = { failures: [] };
  const fixtures = [minerResult, minerResult, minerResult, consolidateResult, slicerResult, batchVerifierResult, transcribedResult];

  const { result } = await runInSandbox(src, fixtures);
  assert.ok(Array.isArray(result?.consensusRules), 'return has consensusRules array');
  const rule = result.consensusRules[0];
  assert.ok(rule.id,        'rule has id');
  assert.ok(rule.kind,      'rule has kind');
  assert.ok(rule.agreement, 'rule has agreement');
  assert.ok(rule.lines,     'rule has lines');
  assert.ok(rule.statement, 'rule has statement');
  // The golden set MUST NOT appear in the return — the test simply checks there is no goldenSet field.
  assert.equal(rule.goldenSet, undefined, 'consensusRules must not carry the golden set');
});

// ==================================================================================================
// Slice 4: mine-verify rejects a script that references an undefined global
// ==================================================================================================
test('sandbox ReferenceError fires when a workflow references an undefined global', async () => {
  // Inject a synthetic `read(someFile)` call into a minimal body to prove the sandbox catches it.
  const syntheticSrc = `
const meta = { name: 'test', description: 'test', phases: [] };
const _args = (typeof args !== 'undefined' && args) ? args : {};
const x = read('/some/file'); // <-- this MUST throw ReferenceError
return { result: x };
`;
  let threw = null;
  try {
    await runInSandbox(syntheticSrc, []);
  } catch (err) {
    threw = err;
  }
  // Note: vm context ReferenceError !== outer ReferenceError constructor, so check by name + message.
  assert.ok(threw !== null, 'expected an error to be thrown');
  assert.equal(threw?.name, 'ReferenceError', `expected ReferenceError, got: ${threw?.name} — ${threw?.message}`);
  assert.match(threw.message, /read is not defined/i, 'error names the undefined global');
});

// ==================================================================================================
// Slice 5: cover.workflow.js runs in mock-globals sandbox without ReferenceError
// ==================================================================================================
test('cover.workflow.js runs in mock-globals sandbox without ReferenceError', async () => {
  const src = readWorkflow(COVER_PATH);

  // Fixture returns for cover.workflow.js:
  //   • Cover agent (iter 1) → null/void (its deliverable is a file Write, return ignored)
  //   • Runner agent (iter 1) → { testRuns, strykerReportPath, mutants }
  //   The loop runs one iteration and gates green → stops.
  const coverAgentReturn = null; // cover agent's Write() is the deliverable; return is unused
  const runnerReturn = {
    testRuns: [
      { passed: 10, failed: 0, skipped: 0 },
      { passed: 10, failed: 0, skipped: 0 },
    ],
    strykerReportPath: 'D:\\mock\\mutation-report.json',
    mutants: [
      // 10 Killed → 100% → all gates green immediately
      ...[1,2,3,4,5,6,7,8,9,10].map(line => ({
        status: 'Killed',
        location: { start: { line } },
        mutatorName: 'Arithmetic',
        replacement: '+',
      })),
    ],
    redOnCurrent: [],
  };

  const fixtures = [coverAgentReturn, runnerReturn];

  let threw = null;
  try {
    await runInSandbox(src, fixtures);
  } catch (err) {
    threw = err;
  }
  assert.equal(threw, null, `cover threw in sandbox: ${threw?.message}`);
});

// ==================================================================================================
// Slice 6: cover.workflow.js return carries gates + achievedScore on all-gates-green
// ==================================================================================================
test('cover sandbox return has gates + achievedScore on all-green', async () => {
  const src = readWorkflow(COVER_PATH);

  const coverAgentReturn = null;
  const runnerReturn = {
    testRuns: [
      { passed: 5, failed: 0, skipped: 0 },
      { passed: 5, failed: 0, skipped: 0 },
    ],
    strykerReportPath: 'D:\\mock\\mutation-report.json',
    mutants: [
      { status: 'Killed', location: { start: { line: 5 } }, mutatorName: 'Arithmetic', replacement: '+' },
      { status: 'Killed', location: { start: { line: 10 } }, mutatorName: 'Arithmetic', replacement: '-' },
      { status: 'Killed', location: { start: { line: 20 } }, mutatorName: 'Arithmetic', replacement: '*' },
      { status: 'Killed', location: { start: { line: 30 } }, mutatorName: 'Equality', replacement: '==' },
    ],
    redOnCurrent: [],
  };

  const { result } = await runInSandbox(src, [coverAgentReturn, runnerReturn]);
  assert.equal(result?.stopped, 'all-gates-green', 'stopped reason is all-gates-green');
  assert.equal(result?.achievedScore, 100, '4/4 killed = 100%');
  assert.ok(result?.gates, 'return carries gates object');
  assert.equal(result.gates.suite_green?.pass, true, 'suite_green gate passes');
  assert.equal(result.gates.mutation_floor?.pass, true, 'mutation_floor gate passes');
});

// ==================================================================================================
// Slice 7: cover.workflow.js halts and reports on budget-ceiling breach signal
//          (the ratchet regression path — proves the halt-and-report, never-fake-green invariant)
// ==================================================================================================
test('cover sandbox halts with ratchet-regression when score drops iteration to iteration', async () => {
  const src = readWorkflow(COVER_PATH);

  // Iter 1: score 80% (below floor 75? no — above, but gates not all green: suite fails)
  // Actually easier: we want a ratchet regression. Iter 1 → 80%, iter 2 → 60%.
  // To get two iterations: suite_green must fail on iter 1 (one run failed), so not all-green.
  const coverReturn = null;
  const runnerIter1 = {
    testRuns: [
      { passed: 5, failed: 1, skipped: 0 }, // failed → suite_green fails → not all green
      { passed: 5, failed: 1, skipped: 0 },
    ],
    strykerReportPath: 'D:\\mock\\r1.json',
    mutants: [
      // 8 killed / 10 reachable = 80%
      ...[1,2,3,4,5,6,7,8].map(l => ({ status: 'Killed',   location: { start: { line: l } }, mutatorName: 'A', replacement: '+' })),
      ...[9,10].map(l =>              ({ status: 'Survived', location: { start: { line: l } }, mutatorName: 'B', replacement: '-' })),
    ],
    redOnCurrent: [],
  };
  const runnerIter2 = {
    testRuns: [
      { passed: 5, failed: 0, skipped: 0 },
      { passed: 5, failed: 0, skipped: 0 },
    ],
    strykerReportPath: 'D:\\mock\\r2.json',
    mutants: [
      // 6 killed / 10 reachable = 60% → REGRESSION from 80%
      ...[1,2,3,4,5,6].map(l => ({ status: 'Killed',   location: { start: { line: l } }, mutatorName: 'A', replacement: '+' })),
      ...[7,8,9,10].map(l =>    ({ status: 'Survived', location: { start: { line: l } }, mutatorName: 'B', replacement: '-' })),
    ],
    redOnCurrent: [],
  };

  const fixtures = [coverReturn, runnerIter1, coverReturn, runnerIter2];
  const { result } = await runInSandbox(src, fixtures);
  assert.equal(result?.stopped, 'ratchet-regression', `expected ratchet-regression, got: ${result?.stopped}`);
});

// ==================================================================================================
// Slices 8–9: loop.workflow.js (the Inc-3a pipeline controller)
// ==================================================================================================
test('loop.workflow.js has no static import', () => {
  const src = readWorkflow(LOOP_PATH);
  assert.equal(hasStaticImport(src), false, 'static `import` would be a syntax error in the Workflow runtime');
});

test('loop.workflow.js runs in mock-globals sandbox without ReferenceError (MONOLITH path)', async () => {
  // The loop controller uses workflow() composition by default. To run offline we set MONOLITH_FALLBACK
  // via args. But since args=null in the sandbox, MONOLITH_FALLBACK defaults to false and the controller
  // tries `workflow()`. Our mock workflow() returns a mine-verify-shaped result → the controller
  // proceeds through KB Write (kb-read/kb-write agents) and Cover (cover sub-workflow) → Report.
  // This exercises the full controller code path with mock agents.
  const src = readWorkflow(LOOP_PATH);

  // The controller calls (in order):
  //   agent(date-stamp) → workflow(mine-verify sub) → agent(kb-read) → agent(kb-write-file)
  //   → workflow(cover sub) → agent(kb-flip) → agent(report-write)
  const dateStampReturn    = { date: '2026-06-22' };
  const mineVerifySubReturn = {
    consensusRules: [{ id: 'BR-1', kind: 'interpretive', agreement: 3, lines: '10-20', statement: 'rule A' }],
    counts: { consensusRules: 1 },
    outputTokensThisTurn: 5000,
  };
  const kbReadReturn   = { content: '# Fake KB\n\n## Rules\n\n- BR-old: old rule.\n\n---\n<!-- mutation-gated: false -->\n<!-- last-stryker-run: none -->\n' };
  const kbWriteReturn  = { written: true };
  const coverSubReturn = { stopped: 'all-gates-green', iter: 1, achievedScore: 100,
    gates: { suite_green: { pass: true, detail: {} }, mutation_floor: { pass: true, detail: { scorePct: 100, reachableSurvivors: [] } } },
    redOnCurrent: [] };
  const kbFlipReturn   = { written: true };
  const reportReturn   = { written: true };

  // workflow() is called twice (mine-verify + cover). agent() is called 5 times
  // (date-stamp + kb-read + kb-write-file + kb-flip + report-write).
  const agentFixtures = [dateStampReturn, kbReadReturn, kbWriteReturn, kbFlipReturn, reportReturn];

  // We need a custom sandbox for this test to return different workflow results per call,
  // and to expose throwing Date/Math shims matching the real Workflow runtime.
  let workflowCallCount = 0;
  const workflowReturns = [mineVerifySubReturn, coverSubReturn];

  function sandboxThrowingDate() {
    throw new ReferenceError('Date.now() / new Date() are unavailable in workflow scripts (breaks resume).');
  }
  sandboxThrowingDate.now = () => { throw new ReferenceError('Date.now() / new Date() are unavailable in workflow scripts (breaks resume).'); };

  let threw = null;
  let loopResult = null;
  try {
    // Build a custom sandbox with a stateful workflow mock and throwing Date/Math shims.
    const { createContext: cc, Script: S } = await import('node:vm');
    let agentIdx2 = 0;
    const sandbox2 = {
      agent: async (prompt, opts) => { const f = agentFixtures[agentIdx2++] ?? null; return f; },
      parallel: async (fns) => { const r = []; for (const fn of fns) r.push(await fn()); return r; },
      phase: () => {},
      log: () => {},
      budget: { spent: () => 50000 },
      workflow: async () => workflowReturns[workflowCallCount++] ?? null,
      args: null,
      Date: sandboxThrowingDate,
      Math: { random: () => { throw new ReferenceError('Math.random() is unavailable in workflow scripts (breaks resume).'); } },
    };
    const patchedSrc = src.replace(/^export\s+const\s+meta\s*=/m, 'const meta =');
    const ctx = cc(sandbox2);
    const wrapped2 = `(async () => { ${patchedSrc} })()`;
    loopResult = await new S(wrapped2, { filename: 'loop-under-test.js' }).runInContext(ctx);
  } catch (err) {
    threw = err;
  }
  assert.equal(threw, null, `loop.workflow.js threw in sandbox: ${threw?.message}`);
  assert.equal(loopResult?.allGatesGreen, true, 'controller returns allGatesGreen: true on sub-workflow green');
  assert.ok(loopResult?.reportPath, 'controller returns reportPath');
});

// ==================================================================================================
// Slice 10: `meta` must be a PURE LITERAL (4th Workflow-runtime rule — Inc-3a bringup)
// ==================================================================================================
// The Workflow tool rejects any non-literal node in `meta` ("meta must be a pure literal: non-literal
// node type in meta: BinaryExpression"). Inc-3a hit this: a `'...' + '...'` string-concat in
// meta.description was rejected AT LAUNCH. Both `node --check` (valid JS) and the sandbox above (which
// STRIPS the export, line 89) miss it — so we check the meta initializer source directly.
// Heuristic, zero-dep: extract the `meta {...}` block and reject the realistic non-literal signatures
// (string concatenation + template interpolation). Not a full AST walk, but it catches the class we hit.
function extractMetaBlock(src) {
  const m = src.match(/\bmeta\s*=\s*\{/);
  if (!m) return null;
  const start = m.index + m[0].length - 1; // index of the opening `{`
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  return null;
}
function metaNonLiteralReason(src) {
  const block = extractMetaBlock(src);
  if (!block) return 'no meta block found';
  if (/['"]\s*\+\s*['"]/.test(block)) return 'string concatenation (`+`) — BinaryExpression';
  if (/`[^`]*\$\{/.test(block)) return 'template interpolation (`${...}`)';
  return null; // pure literal by these heuristics
}

for (const [name, path] of [['mine-verify', MINE_VERIFY_PATH], ['cover', COVER_PATH], ['loop', LOOP_PATH]]) {
  test(`${name}.workflow.js meta is a pure literal (no concat / interpolation)`, () => {
    const reason = metaNonLiteralReason(readWorkflow(path));
    assert.equal(reason, null, `meta must be a pure literal — found: ${reason}`);
  });
}
test('meta-purity detector catches a string-concat meta (synthetic negative)', () => {
  const synthetic = `export const meta = { name: 'x', description: 'a ' + 'b', phases: [] };`;
  assert.equal(metaNonLiteralReason(synthetic), 'string concatenation (`+`) — BinaryExpression');
});

// ==================================================================================================
// Slices 11–12: sandbox catches Date / Math.random violations (synthetic negative proofs)
// The sandbox Date shim throws exactly like the real Workflow runtime — confirm it fires.
// ==================================================================================================
test('sandbox throws on new Date() in workflow body (synthetic negative)', async () => {
  // A minimal body that calls new Date() — must throw in the hardened sandbox.
  const syntheticSrc = `
const meta = { name: 'test', description: 'test', phases: [] };
const _args = (typeof args !== 'undefined' && args) ? args : {};
const d = new Date(); // <-- must throw in the Workflow sandbox
return { d };
`;
  let threw = null;
  try {
    await runInSandbox(syntheticSrc, []);
  } catch (err) {
    threw = err;
  }
  assert.ok(threw !== null, 'expected an error to be thrown for new Date()');
  assert.match(threw?.message ?? '', /unavailable in workflow scripts/i,
    'error message identifies the Workflow runtime restriction');
});

test('sandbox throws on Math.random() in workflow body (synthetic negative)', async () => {
  // A minimal body that calls Math.random() — must throw in the hardened sandbox.
  const syntheticSrc = `
const meta = { name: 'test', description: 'test', phases: [] };
const _args = (typeof args !== 'undefined' && args) ? args : {};
const r = Math.random(); // <-- must throw in the Workflow sandbox
return { r };
`;
  let threw = null;
  try {
    await runInSandbox(syntheticSrc, []);
  } catch (err) {
    threw = err;
  }
  assert.ok(threw !== null, 'expected an error to be thrown for Math.random()');
  assert.match(threw?.message ?? '', /unavailable in workflow scripts/i,
    'error message identifies the Workflow runtime restriction');
});
