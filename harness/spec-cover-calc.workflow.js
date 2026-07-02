// Calculator-shaped spec front-end (adhoc-SddCoverageLoop, Step 3).
//
// Runnable via Workflow({ scriptPath: "<abs>/harness/spec-cover-calc.workflow.js" }, { ...args }).
//
// WHAT IT DOES: the spec-arm front-end for a NUMERIC ANALYTICS CALCULATOR — the calculator analog of
// spec-cover.workflow.js, which is built for a first-violation-wins VALIDATOR (rule-name/enum outcome).
// BugRatioAnalyzer.ComputeMultiSprint / ComputeSingleSprint have no violation-identity surface: each rule
// asserts a VALUE (boolean / numeric ± ε / streak-integer) against a named target field. The spec-load agent
// reads the CLEAN-ROOM spec-oracle (delivery/spec-rules-bugratio.md, plan Step 1 — never the sequestered SR
// golden set), the guided-miner locates each rule's code, the spec-Cover agent writes value-assertion tests
// into an isolated assembly, the runner executes them, and the orchestrator computes the deterministic
// spec-diff (spec-diff.mjs, UNCHANGED — plan Step 2 instruction) + the calculator outcome-labeler
// (spec-diff-calc.mjs, new — Step 2) instead of the validator's positional labelRed.
//
// THE ACTORS (never collapse them — same design posture as spec-cover.workflow.js, ADR-C):
//
//   ORCHESTRATOR (this JS, trusted, deterministic)
//     • passes PATHS to the agents (it has no fs access — agents do all I/O)
//     • computes the deterministic spec-diff helpers (spec-diff.mjs, inlined) + the calculator outcome-labeler
//       (spec-diff-calc.mjs, inlined) + the §6 gate helpers (cover-gates.mjs, inlined) — NO agent self-reports
//       a classification or a gate
//     • drives its OWN loop (reds route to the label BEFORE any green-gate evaluation — reuse boundary, AC-1)
//     • quarantines spec-driven reds as candidate bugs (never deleted — ADR-D); the mutation pass runs over
//       the GREEN subset only (Stryker needs a baseline-green suite)
//
//   SPEC-LOAD AGENT (the SINGLE permitted reader of the spec oracle)
//     • reads the CLEAN-ROOM spec-oracle (delivery/spec-rules-bugratio.md) and returns structured rules
//       { id, ruleName, statement, expectedOutcome: {kind, targetField, condition, epsilon?}, boundary?,
//       codeAttestation? }. The spec-oracle path is passed to THIS agent ONLY.
//
//   GUIDED-MINER AGENT (rule→code location fallback, same role as spec-cover.workflow.js)
//     • for a rule with no attestation (every SR-1..4 rule, by Step-1 design — see spec-rules-bugratio.md):
//       given the rule STATEMENT (handed inline) + the candidate class source, returns `file:line` |
//       NO-CODE-FOUND. NO-CODE-FOUND is the first candidate sin-of-omission, not an error.
//
//   SPEC-COVER-CALC AGENT (clean-room writer — the cover.workflow.js Cover agent, calculator spec-rule input)
//     • input: the SR product source + the rule statements/expectedOutcome handed INLINE (never the spec
//       oracle file) + the test-style contract. Writes value-assertion tests into an ISOLATED assembly
//       (Fokus.Domain.SpecHarness.Tests, never Fokus.Domain.Tests), each asserting
//       ComputeMultiSprint(...)/ComputeSingleSprint(...)'s expected FIELD VALUE per its spec rule (not a
//       violation identity).
//     • a test RED on current code is KEPT + FLAGGED `// CANDIDATE BUG:` — never deleted (ADR-D).
//
//   RUNNER AGENT (executor — a DISTINCT agent() from the Cover agent)
//     • runs `dotnet test` twice + `dotnet stryker` over the GREEN subset; returns testRuns + mutants +
//       mutatedFiles + the per-test { id, ruleName, kind, expected, actual, epsilon, errored } outcomes.
//
// REUSE BOUNDARY (AC-1) — same TWO divergences from cover.workflow.js as spec-cover.workflow.js:
//   1. OWN control flow: reds route to the diff/label FIRST; suiteGreen is NEVER applied to the spec-driven
//      reds as a pass/fail.
//   2. The mutation pass runs over the GREEN subset only (reds quarantined as candidate bugs, never deleted).
//
// RUNTIME CONTRACT (workflow-contract.test.mjs): no static import / fs / Date / Math.random; `meta` is a
// pure literal; agents do all I/O; `args` arrives JSON-STRINGIFIED (tool) or as an object (composition) —
// parse both. spec-diff.mjs + spec-diff-calc.mjs + cover-gates.mjs are INLINED VERBATIM below (the runtime
// can't import) — kept in sync via scripts/selfcheck.mjs's "spec-diff inline-copy sync" check (Step 3).
//
// LIVE TOOLCHAIN RUN IS OPERATOR-OWED (plan Steps 6/8): the live two-arm dotnet+Stryker reproduction needs an
// SR working-tree git write + two isolated SR git worktrees (OD-4) + the live .NET/Stryker toolchain, which
// the developer is barred from / lacks. This file is the runnable wire; the live run is an OPERATOR ACTION
// REQUIRED runbook (implementation.md).

// meta MUST be the first statement, and a PURE LITERAL (no concat / interpolation — Workflow-runtime rule).
export const meta = {
  name: 'spec-cover-calc-bugratio',
  description:
    'SDD Coverage Loop (adhoc-SddCoverageLoop) Step 3: the calculator-shaped spec front-end. A spec-load agent reads the CLEAN-ROOM spec-oracle (delivery/spec-rules-bugratio.md, never the sequestered SR golden set); the orchestrator locates each rule (attestation-first, guided-miner fallback), drives a clean-room spec-Cover agent + a distinct runner agent through the EXISTING Cover engine writing VALUE-assertion tests (not violation-identity), then computes the 3-axis spec-vs-code diff (spec-diff.mjs, unchanged) + the calculator outcome-labeler (spec-diff-calc.mjs: boolean / numeric-epsilon / streak-integer). Reuse boundary (AC-1): own loop (reds route to the labeler before any green gate; suiteGreen never over reds); the mutation pass runs over the GREEN subset only (reds quarantined as candidate bugs, never deleted — ADR-D). DEFAULT MODEL: Sonnet for every agent. Live two-arm dotnet+Stryker run is operator-owed (plan Steps 6/8).',
  phases: [
    { title: 'Spec-load', detail: 'the single permitted spec-oracle reader returns structured rules { id, ruleName, statement, expectedOutcome: {kind,targetField,condition,epsilon?}, boundary?, codeAttestation? }' },
    { title: 'Locate', detail: 'attestation-first (decideLocation); guided-miner agent for miner-needed rules (file:line | NO-CODE-FOUND)' },
    { title: 'Cover', detail: 'clean-room spec-Cover agent writes value-assertion tests into an isolated assembly; reds kept + flagged' },
    { title: 'Run', detail: 'distinct runner agent: double dotnet test + dotnet stryker over the GREEN subset; reds quarantined' },
    { title: 'Diff+Label', detail: 'orchestrator computes the 3-axis diff (spec-diff.mjs) + the calculator outcome-labeler (spec-diff-calc.mjs); reds → candidate-bug queue' },
    { title: 'Report', detail: 'orchestrator writes the self-contained run report (3-axis diff + candidate-bug queue + needs-triage bucket) nexus-side, git-ignored' },
  ],
}

// =================================================================================================
// Inlined spec-diff helpers (SOURCE OF TRUTH: harness/lib/spec-diff.mjs, unit-tested in
// tests/unit/spec-diff.test.mjs). Copied VERBATIM — UNCHANGED (plan Step 2 instruction: diffRules/classifyRule
// are reused as-is; they key by name + string boundary). Same Workflow-runtime reason as spec-cover.workflow.js
// (no static import, no fs to load a sibling module). Keep in sync via scripts/selfcheck.mjs.
// =================================================================================================
function decideLocation(rule) {
  const attestation = rule?.codeAttestation;
  if (attestation && String(attestation).trim() !== '') {
    return { source: 'attestation', location: String(attestation).trim(), route: 'located' };
  }
  return { source: 'miner', location: null, route: 'miner-needed' };
}

function evaluateMinerResult(r) {
  const loc = (r?.minerLocation ?? '').trim();
  if (loc === '' || loc === 'NO-CODE-FOUND') {
    return { route: 'code-missing', location: null, isError: false };
  }
  if (r?.codeContainsRule === true) {
    return { route: 'located', location: loc, isError: false };
  }
  return { route: 'needs-triage', location: loc, isError: false, label: 'miner-mislocation' };
}

function ruleKey(r) {
  return (r?.ruleName ?? r?.id ?? '').trim();
}

function classifyRule(specRule, codeRules) {
  const list = codeRules ?? [];
  const match = list.find((c) => ruleKey(c) !== '' && ruleKey(c) === ruleKey(specRule));
  if (!match) return { axis: 'spec-not-code', specRule, codeRule: null };
  const sb = specRule?.boundary;
  const cb = match?.boundary;
  if (sb !== undefined && cb !== undefined && String(sb) !== String(cb)) {
    return { axis: 'both-divergent', specRule, codeRule: match };
  }
  return { axis: 'both-agree', specRule, codeRule: match };
}

function diffRules(specRules, codeRules) {
  const specs = specRules ?? [];
  const codes = codeRules ?? [];
  const specNotCode = [];
  const bothDivergent = [];
  const bothAgree = [];
  for (const s of specs) {
    const { axis, codeRule } = classifyRule(s, codes);
    if (axis === 'spec-not-code') {
      const carries = s.redTest ? 'red-test' : 'code-missing';
      specNotCode.push({ ...s, ruleName: ruleKey(s), axis, carries });
    } else if (axis === 'both-divergent') {
      bothDivergent.push({ ...s, ruleName: ruleKey(s), axis, codeRule });
    } else {
      bothAgree.push({ ...s, ruleName: ruleKey(s), axis, codeRule });
    }
  }
  const specNames = new Set(specs.map(ruleKey).filter((k) => k !== ''));
  const codeNotSpec = codes
    .filter((c) => ruleKey(c) !== '' && !specNames.has(ruleKey(c)))
    .map((c) => ({ ...c, ruleName: ruleKey(c), axis: 'code-not-spec' }));
  const serialized = serializeDiff({ specNotCode, codeNotSpec, bothDivergent, bothAgree });
  return { specNotCode, codeNotSpec, bothDivergent, bothAgree, serialized };
}

function serializeDiff({ specNotCode = [], codeNotSpec = [], bothDivergent = [], bothAgree = [] }) {
  const fmtSpecNotCode = (r) =>
    `- **${r.ruleName}** (${r.id ?? 'no-id'}) — ${r.carries === 'red-test' ? 'red test attached' : 'code-missing (sin of omission)'}`;
  const fmtDivergent = (r) =>
    `- **${r.ruleName}** (${r.id ?? 'no-id'}) — spec boundary \`${r.boundary ?? '?'}\` vs code \`${r.codeRule?.boundary ?? '?'}\``;
  const fmtCodeNotSpec = (r) => `- **${r.ruleName}** — undocumented behavior / enshrined bug`;
  const fmtAgree = (r) => `- **${r.ruleName}** (${r.id ?? 'no-id'}) — spec and code agree`;
  return [
    `## spec ∧ ¬code (missing features — headline)`,
    specNotCode.length ? specNotCode.map(fmtSpecNotCode).join('\n') : '_None._',
    ``,
    `## code ∧ ¬spec (undocumented behavior / enshrined bug)`,
    codeNotSpec.length ? codeNotSpec.map(fmtCodeNotSpec).join('\n') : '_None._',
    ``,
    `## both-divergent (boundary disagreement)`,
    bothDivergent.length ? bothDivergent.map(fmtDivergent).join('\n') : '_None._',
    ``,
    `## both-agree (spec and code agree)`,
    bothAgree.length ? bothAgree.map(fmtAgree).join('\n') : '_None._',
  ].join('\n');
}

// =================================================================================================
// Inlined calculator outcome-labeler (SOURCE OF TRUTH: harness/lib/spec-diff-calc.mjs, unit-tested in
// tests/unit/spec-diff-calc.test.mjs). Copied VERBATIM — same Workflow-runtime reason. This REPLACES
// spec-cover.workflow.js's labelRed/RULE_ORDER (validator-only — no positional firing order exists here).
// =================================================================================================
const DEFAULT_EPSILON = 1e-9;

function outcomeMatches(r) {
  const kind = r?.kind;
  const expected = r?.expected;
  const actual = r?.actual;
  if (kind === 'numeric') {
    const eps = r?.epsilon !== undefined && r?.epsilon !== null ? r.epsilon : DEFAULT_EPSILON;
    if (typeof expected !== 'number' || typeof actual !== 'number' || Number.isNaN(expected) || Number.isNaN(actual)) {
      return false;
    }
    return Math.abs(actual - expected) <= eps;
  }
  return expected === actual;
}

function labelOutcome(r) {
  const kind = r?.kind;
  const expected = r?.expected ?? null;
  const rawActual = r?.actual;

  if (r?.errored === true) {
    return { label: 'errored', route: 'needs-triage', detail: 'test errored / fixture un-constructable — not classifiable' };
  }

  if (rawActual === null || rawActual === undefined) {
    return { label: 'code-missing', route: 'candidate-bug', detail: `code never produced a value for this rule's target field (spec ∧ ¬code — sin of omission); spec expected ${JSON.stringify(expected)}` };
  }

  const actual = rawActual;
  const detail = `${kind} outcome diverged: expected ${JSON.stringify(expected)}, actual ${JSON.stringify(actual)}`;
  if ((kind === 'numeric' || kind === 'streak-integer') && typeof expected === 'number' && typeof actual === 'number') {
    const direction = actual > expected ? 'over' : actual < expected ? 'under' : undefined;
    return { label: 'value-divergence', route: 'candidate-bug', detail, direction };
  }
  return { label: 'value-divergence', route: 'candidate-bug', detail };
}

// =================================================================================================
// Inlined §6 gate helpers (SOURCE OF TRUTH: harness/lib/cover-gates.mjs). Copied VERBATIM — same
// runtime-contract reason. REUSED (AC-1) but NOT cover.workflow.js's all-gates-green stop: suiteGreen is
// computed over the GREEN subset for the mutation-pass precondition only, NEVER applied to the spec-driven
// reds (which are the primary output — ADR-D).
// =================================================================================================
function suiteGreen(testRuns) {
  const runs = testRuns ?? [];
  const everyGreen = runs.length >= 2 && runs.every((r) => r.failed === 0 && r.passed > 0);
  return { pass: everyGreen, detail: { runs: runs.map((r) => ({ passed: r.passed, failed: r.failed })) } };
}

function noFlaky(testRuns) {
  const runs = testRuns ?? [];
  const key = (r) => `${r.passed}/${r.failed}/${r.skipped}`;
  const keys = runs.map(key);
  const identical = runs.length >= 2 && keys.every((k) => k === keys[0]);
  return { pass: identical, detail: { counts: keys } };
}

const DENOMINATOR_STATUSES = new Set(['Killed', 'Survived', 'Timeout', 'NoCoverage']);

function mutantLine(m) {
  return m?.location?.start?.line ?? null;
}

function mutationFloor(strykerReport, sourcePath, opts) {
  const floor = opts?.floor ?? 75;
  const deadLines = new Set(opts?.expectedSurvivorLines ?? []);
  const files = strykerReport?.files ?? {};
  const entry = files[sourcePath];
  if (!entry) {
    return {
      pass: false,
      detail: { scorePct: 0, killed: 0, reachableDenominator: 0, error: `no per-file Stryker entry for ${sourcePath} (check the mutate glob + the json reporter)`, reachableSurvivors: [] },
    };
  }
  const mutants = entry.mutants ?? [];
  let killed = 0;
  let reachableDenominator = 0;
  let expectedSurvivorsExcluded = 0;
  const reachableSurvivors = [];
  for (const m of mutants) {
    if (!DENOMINATOR_STATUSES.has(m.status)) continue;
    const line = mutantLine(m);
    const isSurvivor = m.status !== 'Killed' && m.status !== 'Timeout';
    if (isSurvivor && deadLines.has(line)) {
      expectedSurvivorsExcluded++;
      continue;
    }
    reachableDenominator++;
    if (m.status === 'Killed' || m.status === 'Timeout') killed++;
    else reachableSurvivors.push({ status: m.status, line, mutatorName: m.mutatorName, replacement: m.replacement });
  }
  const scorePct = reachableDenominator > 0 ? Math.round((killed / reachableDenominator) * 100) : 0;
  return {
    pass: reachableDenominator > 0 && scorePct >= floor,
    detail: { scorePct, killed, reachableDenominator, expectedSurvivorsExcluded, floor, reachableSurvivors },
  };
}

function targetMutated(mutatedFiles, sourcePath) {
  const base = (p) => (p ?? '').split(/[\\/]/).pop();
  const target = base(sourcePath);
  const list = mutatedFiles ?? [];
  const entry = list.find((f) => base(f.file) === target);
  const count = entry?.count ?? 0;
  const detail = { target, count, mutatedFiles: list.map((f) => `${base(f.file)}:${f.count}`) };
  if (count <= 0) detail.error = `target ${target} was NOT mutated (0 mutants in the Stryker report) — mutate scope wrong or a different file mutated; kill-rate untrustworthy (fake-green guard)`;
  return { pass: count > 0, detail };
}

// =================================================================================================
// Target + contract paths (parameterized via args; defaults = sprint-rituals / BugRatioAnalyzer).
// Mirrors harness/targets/bugratio-spec.json (kept inline so the Workflow is self-contained).
// args arrive two ways: Workflow TOOL → JSON STRING (parse it); workflow() composition → OBJECT (as-is).
// =================================================================================================
const _argsRaw = (typeof args !== 'undefined' && args) ? args : {}
let _args = {}
try { _args = typeof _argsRaw === 'string' ? JSON.parse(_argsRaw) : _argsRaw } catch { _args = {} }

const SR = 'D:\\src\\sprint-rituals'
const NEXUS = 'D:\\src\\claude-plugins\\nexus'
// Model for every agent. Default Sonnet (owner directive — matches cover/loop/spec-cover defaults); override via _args.model.
const MODEL = _args.model ?? 'sonnet'
const TARGET_CLASS = _args.targetClass ?? 'BugRatioAnalyzer'
const SRC = _args.src ?? `${SR}\\src\\Services\\Fokus\\Fokus.Domain\\Analytics\\BugRatioAnalyzer.cs`
// The CLEAN-ROOM spec-oracle (plan Step 1) — passed to the SPEC-LOAD agent ONLY. It appears in NO other
// prompt. NEVER the sequestered SR golden set (sprint-rituals/docs/audit/golden-set.md) — that is read
// post-hoc only, by the operator's scorer, never by any agent in this run (AC-2, Q1).
const SPEC_ORACLE = _args.specOracle ?? `${NEXUS}\\docs\\specs\\adhoc-SddCoverageLoop\\delivery\\spec-rules-bugratio.md`
// The test-style contract (xUnit v3 + AwesomeAssertions + FsCheck) — clean-room-safe (an API/style contract,
// not the oracle).
const TEST_STYLE = _args.testStyle ?? `${SR}\\docs\\conventions\\mutation-testing.md`

// The ISOLATED assembly (AC-3(b) analog) — NEVER Fokus.Domain.Tests. Its .csproj references the SR PRODUCT
// project but not the main test project. Created at live-run time (plan Step 8) — does not exist on disk yet.
const ISOLATED_ASSEMBLY = _args.isolatedAssembly ?? `${SR}\\src\\Services\\Fokus\\Fokus.Domain.SpecHarness.Tests`
const PRODUCT_PROJECT = _args.productProject ?? `${SR}\\src\\Services\\Fokus\\Fokus.Domain\\Fokus.Domain.csproj`
const SPEC_TESTS = _args.specTests ?? `${ISOLATED_ASSEMBLY}\\${TARGET_CLASS}SpecTests.cs`
const TEST_PROJECT_DIR = _args.testProjectDir ?? ISOLATED_ASSEMBLY
const MUTATE_GLOB = _args.mutateGlob ?? `**/${TARGET_CLASS}.cs`

// The spec-rule id set this run covers (ids only — spec-rules-bugratio.md IS the rule text; the spec-load
// agent reads it directly, unlike the validator's golden-catalog-ids-only pattern).
const SPEC_RULE_IDS = _args.specRuleIds ?? ['SR-1', 'SR-2', 'SR-3', 'SR-4']

// Runner results + the run report land HERE — nexus-side + git-ignored (.gitignore: harness/.runs/). NEVER
// in the SR tree (a result file in SR's working tree would strand in an SR commit).
const RUNS_DIR = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'
const RUNNER_RESULT = _args.runnerResult ?? `${RUNS_DIR}\\spec-cover-calc-bugratio-run.json`
const REPORT_PATH = _args.reportPath ?? `${RUNS_DIR}\\spec-cover-calc-bugratio.md`

const MUTATION_FLOOR = _args.mutationFloor ?? 75
const RUN_DATE = _args.runDate ?? null

// MARGINAL accounting — budget.spent() is the SHARED session pool, not this run's cost.
const RUN_START_SPENT = budget.spent()
const runSpent = () => budget.spent() - RUN_START_SPENT

// =================================================================================================
// Schemas
// =================================================================================================
// The spec-load agent returns structured rules { id, ruleName, statement, expectedOutcome, codeAttestation?,
// boundary? } (Step 1's golden-shaped intermediate). expectedOutcome is a STRUCTURED OBJECT (kind/targetField/
// condition/epsilon?) — unlike the validator's flat rule-name string, since this class has no violation-id surface.
const SPEC_RULES_SCHEMA = {
  type: 'object',
  properties: {
    rules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          ruleName: { type: 'string' },        // authored identifier, spec arm's own id space (reconciled post-hoc — Step 7)
          statement: { type: 'string' },
          expectedOutcome: {
            type: 'object',
            properties: {
              kind: { type: 'string' },          // 'boolean' | 'numeric' | 'streak-integer'
              targetField: { type: 'string' },   // the intent/conceptual field name (never an exact C# member — Q1)
              condition: { type: 'string' },
              epsilon: { type: 'number' },        // numeric kind only
            },
            required: ['kind', 'targetField'],
          },
          codeAttestation: { type: 'string' }, // the spec-oracle's file:line column (absent → miner-needed; absent for all SR-1..4 by Step-1 design)
          boundary: { type: 'string' },        // the rule's stated numeric/operator boundary (feeds both-divergent)
        },
        required: ['id', 'statement', 'expectedOutcome'],
      },
    },
  },
  required: ['rules'],
}

// The guided-miner agent returns file:line | NO-CODE-FOUND per miner-needed rule (Step 2 of the actor skeleton).
const MINER_SCHEMA = {
  type: 'object',
  properties: {
    locations: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, location: { type: 'string' } }, // location: "file:line" or "NO-CODE-FOUND"
        required: ['id', 'location'],
      },
    },
  },
  required: ['locations'],
}

// The runner agent's result. testOutcomes carries { id, ruleName, kind, expected, actual, epsilon?, errored }
// — richer than the validator's shape (kind + epsilon are needed by outcomeMatches/labelOutcome).
const RUNNER_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    testRuns: {
      type: 'array', minItems: 2,
      items: { type: 'object', properties: { passed: { type: 'integer' }, failed: { type: 'integer' }, skipped: { type: 'integer' } }, required: ['passed', 'failed', 'skipped'] },
    },
    strykerReportPath: { type: 'string' },
    mutants: {
      type: 'array',
      items: { type: 'object', properties: { status: { type: 'string' }, location: { type: 'object', properties: { start: { type: 'object', properties: { line: { type: 'integer' } }, required: ['line'] } }, required: ['start'] }, mutatorName: { type: 'string' }, replacement: { type: 'string' } }, required: ['status', 'location', 'mutatorName'] },
    },
    mutatedFiles: {
      type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, count: { type: 'integer' } }, required: ['file', 'count'] },
    },
    // Per-test outcomes — { id, ruleName, kind, expected, actual, epsilon?, errored }. A red is
    // !outcomeMatches(...); the orchestrator labels each red via labelOutcome. The runner reports the
    // OBSERVED actual, never deletes a red.
    testOutcomes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          ruleName: { type: 'string' },
          kind: { type: 'string' },
          expected: {},
          actual: {},
          epsilon: { type: 'number' },
          errored: { type: 'boolean' },
        },
        required: ['id', 'kind', 'expected'],
      },
    },
  },
  required: ['testRuns', 'strykerReportPath', 'mutants', 'mutatedFiles', 'testOutcomes'],
}

const WRITE_CONFIRM_SCHEMA = { type: 'object', properties: { written: { type: 'boolean' } }, required: ['written'] }
const DATE_SCHEMA = { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] }

// =================================================================================================
// Phase: date stamp (workflows can't call Date — an agent stamps it; or _args.runDate short-circuits).
// =================================================================================================
let today = RUN_DATE
if (!today) {
  const dateResult = await agent('Output ONLY today\'s date as YYYY-MM-DD, nothing else, in your schema response.', { label: 'date-stamp', phase: 'Spec-load', schema: DATE_SCHEMA, model: MODEL })
  today = dateResult?.date ?? 'unknown-date'
}

// =================================================================================================
// Phase: Spec-load — the SINGLE permitted spec-oracle reader. The spec-oracle path is in THIS prompt only —
// never the sequestered SR golden set (AC-2, Q1).
// =================================================================================================
phase('Spec-load')
log(`Spec-load: the spec-load agent (the ONLY spec-oracle reader) reads ${SPEC_ORACLE} for ${SPEC_RULE_IDS.length} ids. This is the CLEAN-ROOM intermediate (never the sequestered SR golden set) — that path is NOT passed to any agent in this run (Q1 / AC-2).`)
const specLoadPrompt = `You are the SPEC-LOAD agent — the SINGLE permitted reader of the clean-room spec-oracle (delivery/spec-rules-bugratio.md). No other agent in this run sees this file OR the sequestered golden set; you hand rule statements onward INLINE.

READ this spec-oracle file:
  ${SPEC_ORACLE}

For EXACTLY these spec-rule ids (this class's whole spec-rule set for this pilot):
  ${SPEC_RULE_IDS.join(', ')}

For each id return:
  - id              — the spec-rule id (e.g. "SR-2").
  - ruleName        — the authored rule identifier from the document (e.g. "BugRatioPercent").
  - statement       — the rule's durable prose (the document's "statement" — what the rule asserts and why).
  - expectedOutcome — an OBJECT: { kind: "boolean"|"numeric"|"streak-integer", targetField: <the
                      intent/conceptual field name from the document — NEVER infer or substitute an exact C#
                      member name>, condition: <the assertable condition/formula>, epsilon?: <only for
                      kind="numeric", the document's stated tolerance> }.
  - codeAttestation — OMIT this field (the document cites none for this pilot — every rule routes to the
                      guided miner).
  - boundary        — the rule's stated numeric/operator boundary if the document states one; omit otherwise.

Return all ${SPEC_RULE_IDS.length} rules. Read ONLY the spec-oracle file — do not read source, tests, the SR
golden set, or any other file.`
const specLoadResult = await agent(specLoadPrompt, { label: 'spec-load', phase: 'Spec-load', schema: SPEC_RULES_SCHEMA, model: MODEL })
const specRules = specLoadResult?.rules ?? []
if (!specRules.length) {
  log('HALT: spec-load returned no rules — cannot run the spec-driven direction without the spec oracle.')
  return { stopped: 'spec-load-failed', reason: 'spec-load agent returned no rules', outputTokensThisTurn: budget.spent() }
}
log(`Spec-load: ${specRules.length} structured rules returned (expected ${SPEC_RULE_IDS.length}).`)

// =================================================================================================
// Phase: Locate — attestation-first (decideLocation); guided-miner for miner-needed rules.
// =================================================================================================
phase('Locate')
const located = []
const minerNeeded = []
for (const r of specRules) {
  const d = decideLocation(r)
  if (d.route === 'located') located.push({ id: r.id, location: d.location, source: 'attestation' })
  else minerNeeded.push(r)
}
log(`Locate: ${located.length} via attestation, ${minerNeeded.length} miner-needed.`)

// The guided miner sees the rule STATEMENT (inline) + the candidate class SOURCE — never the spec-oracle FILE.
if (minerNeeded.length) {
  const minerPrompt = `You are the GUIDED-MINER agent (rule→code location). For each rule below, locate the code in the candidate class that ENCODES it.

CANDIDATE CLASS SOURCE (read it):
  ${SRC}

For each rule (statement handed INLINE — you have NO access to any spec/golden file):
${minerNeeded.map((r) => `  - ${r.id}: ${r.statement}`).join('\n')}

Return one location per rule id:
  - "file:line" (e.g. "BugRatioAnalyzer.cs:40") if you find the encoding code, OR
  - the literal "NO-CODE-FOUND" if the class does not encode this rule. NO-CODE-FOUND is NOT an error — it
    is a candidate sin-of-omission (the spec requires it, the code does not implement it). Report it honestly.`
  const minerResult = await agent(minerPrompt, { label: 'guided-miner', phase: 'Locate', schema: MINER_SCHEMA, model: MODEL })
  for (const loc of (minerResult?.locations ?? [])) {
    const ev = evaluateMinerResult({ minerLocation: loc.location, codeContainsRule: loc.location !== 'NO-CODE-FOUND' })
    located.push({ id: loc.id, location: ev.location, source: 'miner', route: ev.route })
  }
}

// =================================================================================================
// Phase: Cover — clean-room spec-Cover agent writes VALUE-assertion tests into the ISOLATED assembly.
// The spec-oracle FILE path is NOT in this prompt — rule statements + expectedOutcome are handed INLINE.
// =================================================================================================
phase('Cover')
const specCoverPrompt = `You are the SPEC-COVER-CALC agent (clean-room writer). Write spec-driven tests for ONE production class, asserting each spec rule's expected VALUE for its target field.

YOUR ONLY WRITE TARGET (touching anything else is a hard violation):
  ${SPEC_TESTS}

It lives in the ISOLATED assembly ${ISOLATED_ASSEMBLY}, whose .csproj references the SR PRODUCT project
(${PRODUCT_PROJECT}) but NOT Fokus.Domain.Tests (the isolated-assembly rule). If the project file does not
yet exist or does not yet reference the product project, create/add ONLY that reference; never reference
Fokus.Domain.Tests.

FORBIDDEN — you have NO write access to:
  • ${SRC} (the production class — NEVER edit it, not even a comment)
  • Fokus.Domain.Tests, any stryker config, any docs file

NON-NEGOTIABLE RULES:
  • Each test asserts ${TARGET_CLASS}.ComputeMultiSprint(...) / ComputeSingleSprint(...)'s expected VALUE for
    its rule's target field (e.g. result.BugRatioPercent should be within epsilon of the spec's expected
    value; result.AlertActive should equal the spec's expected boolean) — a VALUE assertion, never a
    violation-identity assertion (this class has no such surface).
  • You choose the REAL return-type member that corresponds to each rule's intent/conceptual targetField
    (read the production source to bind it) — the spec-oracle intentionally does NOT name the exact member
    (clean-room boundary); binding intent→member is YOUR job at this step, not the spec-oracle's.
  • A test that is RED on the CURRENT production code is KEPT and FLAGGED with a \`// CANDIDATE BUG:\` comment —
    NEVER deleted, and you NEVER edit production code to make it pass (deleting a red is exactly the hack the
    harness exists to stop). The red is the PRIMARY OUTPUT of this direction (ADR-D), not a failure.

STEP 1 — READ THE PRODUCTION SOURCE (the SUT, incl. its return-type declarations):
  ${SRC}

STEP 2 — READ THE TEST-STYLE CONTRACT (xUnit v3 + AwesomeAssertions + FsCheck — follow it so the tests
COMPILE; this is the API/style contract, NOT the oracle):
  ${TEST_STYLE}

THE SPEC RULES TO COVER (handed INLINE — you have NO access to any spec-oracle/golden file; the rule text
below is your entire spec input):
${specRules.map((r) => `  - ${r.id} [${r.ruleName || 'unnamed'}] (${r.expectedOutcome?.kind ?? '?'} → ${r.expectedOutcome?.targetField ?? '?'}): ${r.statement}${r.expectedOutcome?.condition ? ` (condition: ${r.expectedOutcome.condition})` : ''}${r.expectedOutcome?.epsilon !== undefined ? ` (epsilon: ${r.expectedOutcome.epsilon})` : ''}`).join('\n')}

Write the test file now.`
await agent(specCoverPrompt, { label: 'spec-cover-calc', phase: 'Cover', model: MODEL })

// =================================================================================================
// Phase: Run — distinct runner agent. Double dotnet test + dotnet stryker over the GREEN subset (reds
// quarantined first — Stryker needs a baseline-green suite). The runner reports per-test outcomes so the
// orchestrator can label reds; it NEVER deletes a red.
// =================================================================================================
phase('Run')
const runnerPrompt = `You are the RUNNER agent. You execute the .NET toolchain — you do NOT write tests and you do NOT edit production code.

STEPS (run from the test project directory ${TEST_PROJECT_DIR}):
  1. Run \`dotnet test\` ONCE to identify which spec-driven tests are RED on the current production code.
     Record per test: { id, ruleName, kind (the rule's expectedOutcome.kind), expected (the value the test
     asserts), actual (the value observed on current code), epsilon (only for kind="numeric"), errored (true
     if the test could not run / a fixture would not construct) }. Do NOT delete any red — the reds are the
     primary output. Report them in testOutcomes.
  2. QUARANTINE the reds: the mutation pass requires a BASELINE-GREEN suite (Stryker aborts / mis-scores if
     the initial run has failures). Run the next steps over the GREEN (passing) subset only — e.g. via a trait
     filter / a [Trait("spec-red","true")] exclusion the Cover agent tagged, or by excluding the red test ids.
     The reds are NOT lost — they are reported in testOutcomes and kept in the file (ADR-D).
  3. Run \`dotnet test\` TWICE over the GREEN subset (the double-run for suite_green + no_flaky). Record
     { passed, failed, skipped } for EACH run.
  4. Run \`dotnet stryker\` over the GREEN subset, SCOPED to the target file: pass \`--mutate "${MUTATE_GLOB}"\`
     so Stryker mutates ONLY the target. It emits StrykerOutput/<ts>/reports/mutation-report.json
     (schemaVersion 2). Capture its ABSOLUTE path.
  5. Read the report; extract the \`mutants\` array from the per-file entry for the TARGET SOURCE FILE
     (match the FULL path, never the basename — same-basename partials are a fake-green hazard):
       ${SRC}
     If the target entry has NO mutants, return an EMPTY mutants array — NEVER substitute another file's mutants.
     Build \`mutatedFiles\`: for EVERY file with >=1 mutant, { file: <full path>, count: <int> }.

ALSO WRITE YOUR RESULTS HERE for the record (nexus-side, git-ignored — NEVER into the SR tree):
  ${RUNNER_RESULT}

as JSON: { "testRuns": [{passed,failed,skipped},{passed,failed,skipped}] (GREEN subset),
           "strykerReportPath": "<abs>", "mutants": [<target-file mutants; EMPTY if none>],
           "mutatedFiles": [{file,count},...],
           "testOutcomes": [{ "id","ruleName","kind","expected","actual","epsilon","errored" }, ...] (ALL tests, reds included) }

IMPORTANT: return the same data in your schema'd response AND in the Write(). NEVER report mutants from a
file other than the target ${SRC}.`
const runRaw = await agent(runnerPrompt, { label: 'runner', phase: 'Run', schema: RUNNER_RESULT_SCHEMA, model: MODEL })
if (!runRaw) {
  log('HALT: runner returned no result.')
  return { stopped: 'runner-failed', reason: 'runner agent returned no result', outputTokensThisTurn: budget.spent() }
}

// =================================================================================================
// Phase: Diff+Label — orchestrator computes the deterministic spec-diff + outcome-label helpers. REUSE
// BOUNDARY (AC-1): reds route to the labeler HERE, BEFORE any green-gate evaluation; suiteGreen is NEVER
// applied to the reds.
// =================================================================================================
phase('Diff+Label')

// 1) Label every red (!outcomeMatches). The reds are the PRIMARY output — labeled, never gated away.
const outcomes = runRaw.testOutcomes ?? []
const candidateBugQueue = []
const needsTriageBucket = []
for (const o of outcomes) {
  const isRed = o.errored === true || !outcomeMatches({ kind: o.kind, expected: o.expected ?? null, actual: o.actual, epsilon: o.epsilon })
  if (!isRed) continue
  const lab = labelOutcome({ kind: o.kind, expected: o.expected ?? null, actual: o.actual, epsilon: o.epsilon, errored: o.errored === true })
  const entry = { id: o.id, ruleName: o.ruleName, kind: o.kind, expected: o.expected ?? null, actual: o.actual ?? null, ...lab }
  // ADR-D: EVERY red lands in the candidate-bug queue (never deleted).
  candidateBugQueue.push(entry)
  if (lab.route === 'needs-triage') needsTriageBucket.push(entry)
}
// Miner mis-locations + code-missing also feed the needs-triage bucket.
for (const l of located) {
  if (l.route === 'needs-triage') needsTriageBucket.push({ id: l.id, label: 'miner-mislocation', location: l.location, route: 'needs-triage' })
}
log(`Diff+Label: ${candidateBugQueue.length} red(s) labeled → candidate-bug queue; ${needsTriageBucket.length} in needs-triage. (suiteGreen NEVER applied to reds — AC-1 reuse boundary.)`)

// 2) The three-axis diff (spec-diff.mjs, UNCHANGED — plan Step 2). The code-rules side is the existing
// mine-verify consensusRules for this class, already rewritten through the Step-7 canonical-name crosswalk
// (post-hoc, outside this run — the crosswalk map is NEVER an input to this workflow). At wire time it is
// passed via _args.codeRules (the operator supplies the crosswalked mine-verify output); absent, the diff
// runs spec-only (every spec rule → an axis).
const codeRules = _args.codeRules ?? []
const redByRule = new Map(candidateBugQueue.map((e) => [e.ruleName, e]))
const specForDiff = specRules.map((r) => ({ id: r.id, ruleName: r.ruleName, boundary: r.boundary, redTest: redByRule.get(r.ruleName) ?? null }))
const diff = diffRules(specForDiff, codeRules)
log(`Diff+Label: 3-axis diff — spec∧¬code=${diff.specNotCode.length}, code∧¬spec=${diff.codeNotSpec.length}, both-divergent=${diff.bothDivergent.length}, both-agree=${diff.bothAgree.length}.`)

// 3) The §6 gate battery over the GREEN subset ONLY (reuse boundary divergence 2). suiteGreen here is the
// mutation-pass PRECONDITION (Stryker needs baseline-green), NOT a pass/fail over the spec-driven reds.
const strykerReport = { files: { [SRC]: { mutants: runRaw.mutants } } }
const greenGates = {
  target_mutated: targetMutated(runRaw.mutatedFiles, SRC),
  suite_green_subset: suiteGreen(runRaw.testRuns),   // GREEN-subset precondition, NOT applied to reds
  no_flaky: noFlaky(runRaw.testRuns),
  mutation_floor: mutationFloor(strykerReport, SRC, { floor: MUTATION_FLOOR, expectedSurvivorLines: [] }),
}
const mutationScore = greenGates.mutation_floor.detail.scorePct
const greenSubsetProven = greenGates.target_mutated.pass && greenGates.suite_green_subset.pass && greenGates.no_flaky.pass && greenGates.mutation_floor.pass
log(`Diff+Label: green-subset mutation pass — score ${mutationScore}% (floor ${MUTATION_FLOOR}); green subset ${greenSubsetProven ? 'PROVEN' : 'NOT proven'}. Reds are quarantined, never deleted (ADR-D).`)

// =================================================================================================
// Phase: Report — orchestrator writes the self-contained run report nexus-side, git-ignored.
// =================================================================================================
phase('Report')
const candidateBugSection = candidateBugQueue.length
  ? candidateBugQueue.map((e) => `- **${e.label}** — ${e.id}${e.ruleName ? ` [${e.ruleName}]` : ''}: expected \`${JSON.stringify(e.expected)}\`, actual \`${JSON.stringify(e.actual)}\`${e.direction ? ` (${e.direction})` : ''}\n  - ${e.detail ?? ''}`).join('\n')
  : '_No reds — no candidate bugs this run._'
const needsTriageSection = needsTriageBucket.length
  ? needsTriageBucket.map((e) => `- **${e.label}** — ${e.id}${e.ruleName ? ` [${e.ruleName}]` : ''}${e.location ? ` @ ${e.location}` : ''}: ${e.detail ?? e.route}`).join('\n')
  : '_None._'
const greenGateRows = Object.entries(greenGates).map(([name, g]) => `| ${name} | ${g.pass ? 'PASS' : 'FAIL'} | ${g.detail?.scorePct !== undefined ? `${g.detail.scorePct}%` : (g.detail?.error ? g.detail.error.slice(0, 60) : 'ok')} |`).join('\n')

const reportContent = `# Spec-driven Cover run (calculator front-end) — ${TARGET_CLASS} (${today})

**Front-end:** \`harness/spec-cover-calc.workflow.js\` (adhoc-SddCoverageLoop Step 3 — the calculator-shaped spec direction)
**Target:** \`${SRC}\`
**Spec oracle:** \`${SPEC_ORACLE}\` (clean-room; read by the spec-load agent ONLY — never the sequestered SR golden set)
**Isolated assembly:** \`${ISOLATED_ASSEMBLY}\` (references the SR product project, NOT Fokus.Domain.Tests)
**Model:** ${MODEL} (every agent; default Sonnet)
**Run cost (marginal):** ${runSpent().toLocaleString()} output tokens — THIS run only.

## Three-axis diff (spec ∧ ¬code FIRST)

${diff.serialized}

## Candidate-bug queue (every red, kept + flagged, never deleted — ADR-D)

${candidateBugSection}

## needs-triage bucket (errored tests, miner mis-locations)

${needsTriageSection}

## Green-subset mutation pass (the mutation gate runs over the PASSING tests only — reuse boundary AC-1)

| Gate | Result | Detail |
|------|--------|--------|
${greenGateRows}

Green subset proven: **${greenSubsetProven ? 'YES' : 'NO'}** (mutation kill ${mutationScore}%, floor ${MUTATION_FLOOR}).

## Notes

- Reuse boundary (AC-1): the spec-driven reds are routed to the labeler BEFORE any green gate; \`suiteGreen\`
  is NEVER applied to the reds (they are the primary output — ADR-D). The mutation pass runs over the GREEN
  subset only (Stryker needs a baseline-green suite); the reds are quarantined as candidate bugs, never deleted.
- The outcome-labeler (spec-diff-calc.mjs) is the calculator analog of the validator's 5-case labelRed: no
  positional rule order exists for a value assertion, so the cases are errored / code-missing (sin of
  omission) / value-divergence (with an over/under direction for orderable kinds).
- This report was written automatically by the orchestrator (git-ignored, nexus-side — never in the SR tree).
`

await agent(`You are the REPORT-WRITE agent. Write EXACTLY this content to ${REPORT_PATH} — no changes, no reformatting.\n\nCONTENT:\n${reportContent}\n\nWrite the file now using the Write tool. Return { "written": true } when done.`, { label: 'report-write', phase: 'Report', schema: WRITE_CONFIRM_SCHEMA, model: MODEL })
log(`Report written: ${REPORT_PATH}`)

// =================================================================================================
// RETURN
// =================================================================================================
log(`Spec-cover-calc done: ${candidateBugQueue.length} candidate bug(s), ${needsTriageBucket.length} needs-triage; green subset ${greenSubsetProven ? 'proven' : 'not proven'} at ${mutationScore}%.`)
return {
  variant: 'sdd-coverage-loop-spec-cover-calc-bugratio',
  target: { class: TARGET_CLASS, source: SRC },
  specRuleCount: specRules.length,
  located: located.length,
  diff: { specNotCode: diff.specNotCode.length, codeNotSpec: diff.codeNotSpec.length, bothDivergent: diff.bothDivergent.length, bothAgree: diff.bothAgree.length },
  candidateBugQueue,
  needsTriageBucket,
  greenGates,
  greenSubsetProven,
  mutationScore,
  reportPath: REPORT_PATH,
  outputTokensThisTurn: budget.spent(),
}
