// Spec-driven Cover front-end (harness full-build Increment 1, adhoc-SpecDrivenHarnessBuild).
//
// Runnable via Workflow({ scriptPath: "<abs>/harness/spec-cover.workflow.js" }, { ...args }).
//
// WHAT IT DOES: the spec-driven INVERSE of cover.workflow.js. Where the code-derived Cover mines rules FROM
// source (so it can only test behavior the code already exhibits), this front-end takes the PO golden rules
// as the spec oracle, locates each rule's code, generates mutation-gated tests via the EXISTING Cover engine,
// diffs spec-rules against code-rules on three axes, and labels false positives deterministically — proving
// the method on ONE class (GeneratedSqlValidator) end-to-end through the automated path. Graduates the GO'd
// spike (adhoc-SpecDrivenCoverDiff).
//
// THE ACTORS (never collapse them — design §6 reward-hacking defense / ADR-C):
//
//   ORCHESTRATOR (this JS, trusted, deterministic)
//     • passes PATHS to the agents (it has no fs access — agents do all I/O)
//     • computes the deterministic spec-diff helpers (spec-diff.mjs, inlined below) + the §6 gate helpers
//       (cover-gates.mjs, inlined below) — NO agent self-reports a classification or a gate
//     • drives its OWN loop (NOT cover.workflow.js's all-gates-green stop) — reds route to the diff/labeler
//       BEFORE any green-gate evaluation (reuse boundary, AC-1)
//     • quarantines spec-driven reds as candidate bugs (never deleted — ADR-D); the mutation pass runs over
//       the GREEN subset only (Stryker needs a baseline-green suite)
//
//   SPEC-LOAD AGENT (the SINGLE permitted reader of the golden text — ADR-C placement layer)
//     • reads the sequestered golden set (knowledge-gateway/docs/audit/golden-set.md) and returns structured
//       rules { id, statement, expectedOutcome, codeAttestation? }. The golden path is passed to THIS agent
//       ONLY — it appears in NO Cover/runner/miner prompt (Step-1 / AC-3(a) grep acceptance).
//
//   GUIDED-MINER AGENT (rule→code location fallback, Step 2 / D1)
//     • for a rule with no attestation: given the rule STATEMENT (handed inline) + the candidate class
//       source, returns `file:line` | NO-CODE-FOUND. NO-CODE-FOUND is the first candidate sin-of-omission,
//       not an error. (The rule statement is inline — the golden FILE is never handed to this agent.)
//
//   SPEC-COVER AGENT (clean-room writer — the cover.workflow.js Cover agent, spec-rule input)
//     • input: the KG product source + the rule statements handed INLINE (never the golden file) + the
//       test-style contract. Writes spec-driven tests into an ISOLATED assembly (never KnowledgeGateway.Tests),
//       each asserting Validate(...)'s expected VIOLATION IDENTITY per its golden rule.
//     • a test RED on current code is KEPT + FLAGGED `// CANDIDATE BUG:` — never deleted (ADR-D).
//
//   RUNNER AGENT (executor — a DISTINCT agent() from the Cover agent)
//     • runs `dotnet test` twice + `dotnet stryker` over the GREEN subset; returns testRuns + mutants +
//       mutatedFiles + the red-on-current list via schema; also Write()s nexus-side/git-ignored.
//
// TWO REUSE-BOUNDARY DIVERGENCES from cover.workflow.js — DESIGNED, not inherited (AC-1):
//   1. OWN control flow, not the all-gates-green stop loop. cover.workflow.js computes allGreen = every gate
//      pass (incl. suiteGreen); with kept reds it never reaches all-green and runs to cap-reached. Here reds
//      route to the diff/labeler FIRST; suiteGreen (failed===0) is NEVER run over the spec-driven reds.
//   2. The mutation pass runs over the GREEN subset only. Stryker requires a baseline-green suite (it aborts
//      / mis-scores on initial failures), so the reds are quarantined as candidate bugs and mutationFloor
//      runs over the PASSING spec-driven tests only.
//
// RUNTIME CONTRACT (workflow-contract.test.mjs): no static import / fs / Date / Math.random; `meta` is a
// pure literal; agents do all I/O; `args` arrives JSON-STRINGIFIED (tool) or as an object (composition) —
// parse both. The spec-diff.mjs + cover-gates.mjs helpers are INLINED VERBATIM (the runtime can't import).
//
// LIVE TOOLCHAIN RUN IS OPERATOR-OWED (Q7 / Step 7): the live two-arm dotnet+Stryker reproduction needs a
// KG working-tree git write (stash the dirty `+1e-9`), which the developer is barred from. This file is the
// runnable wire; the live run is an OPERATOR ACTION REQUIRED runbook (implementation.md / Step 7).

// meta MUST be the first statement, and a PURE LITERAL (no concat / interpolation — Workflow-runtime rule).
export const meta = {
  name: 'spec-cover-generatedsqlvalidator',
  description:
    'Harness full-build Inc 1: spec-driven Cover front-end. A spec-load agent reads the sequestered PO golden set (the single permitted reader — ADR-C); the orchestrator locates each rule (attestation-first, guided-miner fallback), drives a clean-room spec-Cover agent + a distinct runner agent through the EXISTING Cover engine, then computes the 3-axis spec-vs-code diff + the deterministic 5-case FP-labeler (spec-diff.mjs, inlined). Reuse boundary (AC-1): own loop (reds route to the labeler before any green gate; suiteGreen never over reds); the mutation pass runs over the GREEN subset only (reds quarantined as candidate bugs, never deleted — ADR-D). DEFAULT MODEL: Sonnet for every agent. Live two-arm dotnet+Stryker run is operator-owed (Q7).',
  phases: [
    { title: 'Spec-load', detail: 'the single permitted golden-text reader returns structured rules { id, statement, expectedOutcome, codeAttestation? }' },
    { title: 'Locate', detail: 'attestation-first (decideLocation); guided-miner agent for miner-needed rules (file:line | NO-CODE-FOUND)' },
    { title: 'Cover', detail: 'clean-room spec-Cover agent writes violation-identity tests into an isolated assembly; reds kept + flagged' },
    { title: 'Run', detail: 'distinct runner agent: double dotnet test + dotnet stryker over the GREEN subset; reds quarantined' },
    { title: 'Diff+Label', detail: 'orchestrator computes the 3-axis diff + 5-case FP-labeler (spec-diff.mjs, inlined); reds → candidate-bug queue' },
    { title: 'Report', detail: 'orchestrator writes the self-contained run report (3-axis diff + candidate-bug queue + needs-triage bucket) nexus-side, git-ignored' },
  ],
}

// =================================================================================================
// Inlined spec-diff helpers (SOURCE OF TRUTH: harness/lib/spec-diff.mjs, unit-tested in
// tests/unit/spec-diff.test.mjs). Copied VERBATIM — the Workflow runtime parses a non-module context, so a
// static `import` is a syntax error and there is no fs to load a sibling module. Keep the two copies in sync.
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

const RULE_ORDER = [
  'SingleSelect',
  'RelationPolicy',
  'CategoryIdPresent',
  'NoRelativeDateUnderAnchoring',
  'NoStrayLiteralThreshold',
  'BadReportsFilterPresent',
  'ReportIdsFirst',
];

function labelRed(r) {
  const order = r?.ruleOrder ?? RULE_ORDER;
  // okValue: the per-target pass sentinel (ADR-E). Defaults to null (SQL: Validate returns null on pass).
  // For Slack: "Valid" (SignatureVerificationResult.Valid). Compare cases 3+4 against okValue, not literal null.
  const okValue = r?.okValue !== undefined ? r.okValue : null;
  const expected = r?.expected ?? null;
  const actual = r?.actual ?? null;

  // Case 5 — the test errored or the fixture couldn't be constructed (the spike ARTIFACT-04 shape).
  if (r?.errored === true) {
    return { label: 'errored', route: 'needs-triage', detail: 'test errored / fixture un-constructable — not classifiable' };
  }

  // Case 4 — expected a PASS (okValue), but a rule fired: over-rejection. The L272 shape. Candidate-bug
  // queue, tagged needs-triage (real boundary bug OR a #2 fixture-fidelity artifact — not auto-decided).
  if (expected === okValue && actual !== okValue) {
    return {
      label: 'over-rejection',
      route: 'candidate-bug',
      needsTriage: true,
      detail: `code rejected a spec-valid input with "${actual}" (over-reject — real-or-fixture, not auto-decided)`,
    };
  }

  // Case 3 — expected a rejection by R, but the validator passed (okValue): sin of omission (spec ∧ ¬code).
  if (expected !== okValue && actual === okValue) {
    return { label: 'sin-of-omission', route: 'candidate-bug', detail: `code passed an input the spec says "${expected}" should reject (spec ∧ ¬code)` };
  }

  // expected R and actual a (different) rule — compare positions in the fixed order.
  const ei = order.indexOf(expected);
  const ai = order.indexOf(actual);
  // Case 1 — an EARLIER rule fired before R could (an interaction artifact: the earlier rule masked R).
  if (ai !== -1 && ei !== -1 && ai < ei) {
    return { label: 'interaction-artifact', route: 'needs-triage', autoResolved: true, detail: `"${actual}" (rule ${ai + 1}) fired before "${expected}" (rule ${ei + 1}) could — earlier rule masked R` };
  }
  // Case 2 — a LATER rule fired: R should have fired but a later one did (R under-enforces).
  if (ai !== -1 && ei !== -1 && ai > ei) {
    return { label: 'under-enforce', route: 'candidate-bug', detail: `"${expected}" (rule ${ei + 1}) should have fired but "${actual}" (rule ${ai + 1}) did — R under-enforces` };
  }
  // Defensive: an unknown rule name on either side (not in the order) — route to needs-triage rather than
  // silently mislabel. (Not one of the 5 canonical cases — a name typo or an off-catalog rule.)
  return { label: 'unrecognized-rule', route: 'needs-triage', detail: `expected="${expected}" actual="${actual}" — a rule name is not in the known order` };
}

// =================================================================================================
// Inlined §6 gate helpers (SOURCE OF TRUTH: harness/lib/cover-gates.mjs). Copied VERBATIM — same
// runtime-contract reason. The spec front-end REUSES these helpers (AC-1) but NOT cover.workflow.js's
// all-gates-green stop: suiteGreen is computed over the GREEN subset for the mutation-pass precondition
// only, NEVER applied as a pass/fail to the spec-driven reds (which are the primary output — ADR-D).
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
// Target + contract paths (parameterized via args; defaults = knowledge-gateway / GeneratedSqlValidator).
// Mirrors harness/targets/generatedsqlvalidator.json (kept inline so the Workflow is self-contained).
// args arrive two ways: Workflow TOOL → JSON STRING (parse it); workflow() composition → OBJECT (as-is).
// =================================================================================================
const _argsRaw = (typeof args !== 'undefined' && args) ? args : {}
let _args = {}
try { _args = typeof _argsRaw === 'string' ? JSON.parse(_argsRaw) : _argsRaw } catch { _args = {} }

const KG = 'D:\\src\\knowledge-gateway'
// Model for every agent. Default Sonnet (owner directive — matches cover/loop defaults); override via _args.model.
const MODEL = _args.model ?? 'sonnet'
const TARGET_CLASS = _args.targetClass ?? 'GeneratedSqlValidator'
const SRC = _args.src ?? `${KG}\\src\\Services\\KnowledgeGateway\\KnowledgeGateway.API\\Features\\TextToSql\\GeneratedSqlValidator.cs`
// The sequestered golden set — passed to the SPEC-LOAD agent ONLY (ADR-C). It appears in NO other prompt.
const GOLDEN_SET = _args.goldenSet ?? `${KG}\\docs\\audit\\golden-set.md`
// The test-style contract (xUnit v3 + the API facts) — clean-room-safe (it is the API contract, not the oracle).
const TEST_STYLE = _args.testStyle ?? `${KG}\\docs\\conventions\\mutation-testing.md`

// The ISOLATED assembly (AC-3(b)) — NEVER KnowledgeGateway.Tests. Its .csproj references the KG PRODUCT
// project but not the main test project.
const ISOLATED_ASSEMBLY = _args.isolatedAssembly ?? `${KG}\\src\\Services\\KnowledgeGateway\\KnowledgeGateway.SpecHarness.Tests`
const PRODUCT_PROJECT = _args.productProject ?? `${KG}\\src\\Services\\KnowledgeGateway\\KnowledgeGateway.API\\KnowledgeGateway.API.csproj`
const SPEC_TESTS = _args.specTests ?? `${ISOLATED_ASSEMBLY}\\GeneratedSqlValidatorSpecTests.cs`
const TEST_PROJECT_DIR = _args.testProjectDir ?? ISOLATED_ASSEMBLY
const MUTATE_GLOB = _args.mutateGlob ?? `**/${TARGET_CLASS}.cs`

// The 12-id golden CATALOG (ids only — the rule TEXT stays sequestered; the spec-load agent reads it).
const GOLDEN_IDS = _args.goldenIds ?? ['GOLD-01', 'GOLD-02', 'GOLD-03', 'GOLD-04', 'GOLD-05', 'GOLD-06', 'GOLD-07', 'GOLD-08', 'GOLD-09', 'GOLD-10', 'GOLD-11', 'GOLD-12']

// Per-target rule order (ADR-E). Source of truth lives in harness/targets/{target}.json's `ruleOrder` field.
// Pass via _args.ruleOrder. Null when not provided; labelRed falls back to its internal RULE_ORDER constant.
// AC-1(b): the workflow sources ruleOrder from _args, NOT from the hardcoded RULE_ORDER constant at the call site.
const RULE_ORDER_CFG = _args.ruleOrder ?? null

// Per-target pass sentinel (ADR-E). null = SQL (Validate returns string? — null on pass).
// "Valid" = Slack (SignatureVerificationResult.Valid). Threaded into labelRed alongside ruleOrder.
const OK_VALUE = _args.okValue !== undefined ? _args.okValue : null

// Runner results + the run report land HERE — nexus-side + git-ignored (.gitignore: harness/.runs/). NEVER
// in the KG tree (a result file in KG's working tree would strand in a KG commit — cover.workflow.js:261-264).
const RUNS_DIR = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'
const RUNNER_RESULT = _args.runnerResult ?? `${RUNS_DIR}\\spec-cover-generatedsqlvalidator-run.json`
// Q8 (architect-confirmed default): the run report is git-ignored, nexus-side, mirroring the RUNS_DIR discipline.
const REPORT_PATH = _args.reportPath ?? `${RUNS_DIR}\\spec-cover-generatedsqlvalidator.md`

const MUTATION_FLOOR = _args.mutationFloor ?? 75
const BASELINE_SKIPS = 0
const RUN_DATE = _args.runDate ?? null

// MARGINAL accounting — budget.spent() is the SHARED session pool, not this run's cost.
const RUN_START_SPENT = budget.spent()
const runSpent = () => budget.spent() - RUN_START_SPENT

// =================================================================================================
// Schemas
// =================================================================================================
// The spec-load agent returns structured rules { id, statement, expectedOutcome, codeAttestation? } (Step 1).
const SPEC_RULES_SCHEMA = {
  type: 'object',
  properties: {
    rules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          ruleName: { type: 'string' },        // the Validate() rule name this golden rule maps to (RULE_ORDER member), if any
          statement: { type: 'string' },
          expectedOutcome: { type: 'string' }, // the Validate return the rule expects ("R" or "null") for a conforming input
          codeAttestation: { type: 'string' }, // the golden file:line column (may be absent → miner-needed)
          boundary: { type: 'string' },        // the rule's stated boundary (e.g. "> 0.01") — feeds both-divergent
        },
        required: ['id', 'statement'],
      },
    },
  },
  required: ['rules'],
}

// The guided-miner agent returns file:line | NO-CODE-FOUND per miner-needed rule (Step 2).
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

// The runner agent's result (the cover.workflow.js runner shape, extended with per-test fired-rule outcomes
// so the orchestrator can label reds). testRuns is the GREEN-subset double-run (reds quarantined first).
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
    // Per-test outcomes — { id, ruleName (the golden rule under test), expected (Validate return the test
    // asserts), actual (the Validate return observed on current code) }. A red is actual ≠ expected; the
    // orchestrator labels each red via labelRed. The runner reports the OBSERVED actual, never deletes a red.
    testOutcomes: {
      type: 'array',
      items: { type: 'object', properties: { id: { type: 'string' }, ruleName: { type: 'string' }, expected: { type: ['string', 'null'] }, actual: { type: ['string', 'null'] }, errored: { type: 'boolean' } }, required: ['id', 'expected', 'actual'] },
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
// Phase: Spec-load — the SINGLE permitted golden-text reader (ADR-C). The golden path is in THIS prompt only.
// =================================================================================================
phase('Spec-load')
log(`Spec-load: the spec-load agent (the ONLY golden-text reader) reads ${GOLDEN_SET} for ${GOLDEN_IDS.length} ids. Golden path NOT passed to any other agent (ADR-C / AC-3(a)).`)
const specLoadPrompt = `You are the SPEC-LOAD agent — the SINGLE permitted reader of the sequestered golden rule set (ADR-C placement layer). No other agent in this run sees the golden file; you hand rule statements onward INLINE.

READ this golden set file:
  ${GOLDEN_SET}

For EXACTLY these golden ids (this class's whole golden set), return one structured rule each:
  ${GOLDEN_IDS.join(', ')}

For each id return:
  - id              — the golden id (e.g. "GOLD-08").
  - ruleName        — the decision method's rule name this golden rule maps to, if it maps to one of:
                      ${(RULE_ORDER_CFG ?? RULE_ORDER).join(', ')}. (Several golden rules can map to the
                      same decision-method rule name — that is fine. A golden rule with no mapping returns
                      an empty ruleName.)
  - statement       — the rule's DURABLE prose (the golden Rule column), describing the rule by symbol +
                      condition. This is what is handed inline to the Cover/miner agents.
  - expectedOutcome — the Validate(...) return a CONFORMING input should produce for this rule: the rule
                      NAME if a conforming-but-violating input should be rejected by it, or the literal
                      "null" if a conforming input should PASS. (Used to build the test's expected assertion.)
  - codeAttestation — the golden "Code attestation" column verbatim (e.g. "GeneratedSqlValidator.cs:260-277").
                      If a row has no attestation, omit it (the orchestrator routes it to the guided miner).
  - boundary        — the rule's stated numeric/operator boundary if it has one (e.g. "> 0.01" for the
                      stray-literal rule); omit if the rule has no boundary.

Return all ${GOLDEN_IDS.length} rules. Read ONLY the golden file — do not read source, tests, or any other file.`
const specLoadResult = await agent(specLoadPrompt, { label: 'spec-load', phase: 'Spec-load', schema: SPEC_RULES_SCHEMA, model: MODEL })
const specRules = specLoadResult?.rules ?? []
if (!specRules.length) {
  log('HALT: spec-load returned no rules — cannot run the spec-driven direction without the golden oracle.')
  return { stopped: 'spec-load-failed', reason: 'spec-load agent returned no rules', outputTokensThisTurn: budget.spent() }
}
log(`Spec-load: ${specRules.length} structured rules returned (expected ${GOLDEN_IDS.length}).`)

// =================================================================================================
// Phase: Locate — attestation-first (decideLocation); guided-miner for miner-needed rules (Step 2 / D1).
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

// The guided miner sees the rule STATEMENT (inline) + the candidate class SOURCE — never the golden FILE.
if (minerNeeded.length) {
  const minerPrompt = `You are the GUIDED-MINER agent (rule→code location). For each rule below, locate the code in the candidate class that ENCODES it.

CANDIDATE CLASS SOURCE (read it):
  ${SRC}

For each rule (statement handed INLINE — you have NO access to any spec/golden file):
${minerNeeded.map((r) => `  - ${r.id}: ${r.statement}`).join('\n')}

Return one location per rule id:
  - "file:line" (e.g. "GeneratedSqlValidator.cs:260") if you find the encoding code, OR
  - the literal "NO-CODE-FOUND" if the class does not encode this rule. NO-CODE-FOUND is NOT an error — it
    is a candidate sin-of-omission (the spec requires it, the code does not implement it). Report it honestly.`
  const minerResult = await agent(minerPrompt, { label: 'guided-miner', phase: 'Locate', schema: MINER_SCHEMA, model: MODEL })
  for (const loc of (minerResult?.locations ?? [])) {
    // codeContainsRule is operator-verified at the live run; at wire time the miner's own claim is recorded.
    const ev = evaluateMinerResult({ minerLocation: loc.location, codeContainsRule: loc.location !== 'NO-CODE-FOUND' })
    located.push({ id: loc.id, location: ev.location, source: 'miner', route: ev.route })
  }
}

// =================================================================================================
// Phase: Cover — clean-room spec-Cover agent writes violation-identity tests into the ISOLATED assembly.
// The golden FILE path is NOT in this prompt (AC-3(a)) — rule statements are handed INLINE.
// =================================================================================================
phase('Cover')
const specCoverPrompt = `You are the SPEC-COVER agent (clean-room writer). Write spec-driven tests for ONE production class, asserting each golden rule's expected VIOLATION IDENTITY.

YOUR ONLY WRITE TARGET (touching anything else is a hard violation):
  ${SPEC_TESTS}

It lives in the ISOLATED assembly ${ISOLATED_ASSEMBLY}, whose .csproj references the KG PRODUCT project
(${PRODUCT_PROJECT}) but NOT KnowledgeGateway.Tests (the isolated-assembly rule — AC-3(b)). If the project
file does not yet reference the product project, add ONLY that reference; never reference KnowledgeGateway.Tests.

FORBIDDEN — you have NO write access to:
  • ${SRC} (the production class — NEVER edit it, not even a comment)
  • KnowledgeGateway.Tests, any stryker config, any docs file

NON-NEGOTIABLE RULES:
  • Each test asserts GeneratedSqlValidator.Validate(...)'s expected return (the violation IDENTITY) for its
    golden rule — e.g. Validate(sql, profile, requireCategoryId, resolvedThreshold) == "NoStrayLiteralThreshold"
    for a rule that should fire, or == null for an input the rule should pass.
  • A test that is RED on the CURRENT production code is KEPT and FLAGGED with a \`// CANDIDATE BUG:\` comment —
    NEVER deleted, and you NEVER edit production code to make it pass (deleting a red is exactly the hack the
    harness exists to stop). The red is the PRIMARY OUTPUT of this direction (ADR-D), not a failure.

STEP 1 — READ THE PRODUCTION SOURCE (the SUT):
  ${SRC}

STEP 2 — READ THE TEST-STYLE CONTRACT (the xUnit-v3 + API facts — follow it so the tests COMPILE; this is
the API contract, NOT the oracle):
  ${TEST_STYLE}

THE GOLDEN RULES TO COVER (handed INLINE — you have NO access to any golden/spec file; the rule text below
is your entire spec input):
${specRules.map((r) => `  - ${r.id} [${r.ruleName || 'no-validate-rule'}]: ${r.statement}${r.expectedOutcome ? ` (expected: ${r.expectedOutcome})` : ''}`).join('\n')}

Write the test file now.`
await agent(specCoverPrompt, { label: 'spec-cover', phase: 'Cover', model: MODEL })

// =================================================================================================
// Phase: Run — distinct runner agent. Double dotnet test + dotnet stryker over the GREEN subset (reds
// quarantined first — Stryker needs a baseline-green suite). The runner reports per-test outcomes so the
// orchestrator can label reds; it NEVER deletes a red.
// =================================================================================================
phase('Run')
const runnerPrompt = `You are the RUNNER agent. You execute the .NET toolchain — you do NOT write tests and you do NOT edit production code.

STEPS (run from the test project directory ${TEST_PROJECT_DIR}):
  1. Run \`dotnet test\` ONCE to identify which spec-driven tests are RED on the current production code.
     Record per test: { id, ruleName, expected (the Validate return the test asserts), actual (the Validate
     return observed on current code), errored (true if the test could not run / a fixture would not construct) }.
     Do NOT delete any red — the reds are the primary output. Report them in testOutcomes.
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

ALSO WRITE YOUR RESULTS HERE for the record (nexus-side, git-ignored — NEVER into the KG tree):
  ${RUNNER_RESULT}

as JSON: { "testRuns": [{passed,failed,skipped},{passed,failed,skipped}] (GREEN subset),
           "strykerReportPath": "<abs>", "mutants": [<target-file mutants; EMPTY if none>],
           "mutatedFiles": [{file,count},...],
           "testOutcomes": [{ "id","ruleName","expected","actual","errored" }, ...] (ALL tests, reds included) }

IMPORTANT: return the same data in your schema'd response AND in the Write(). NEVER report mutants from a
file other than the target ${SRC}.`
const runRaw = await agent(runnerPrompt, { label: 'runner', phase: 'Run', schema: RUNNER_RESULT_SCHEMA, model: MODEL })
if (!runRaw) {
  log('HALT: runner returned no result.')
  return { stopped: 'runner-failed', reason: 'runner agent returned no result', outputTokensThisTurn: budget.spent() }
}

// =================================================================================================
// Phase: Diff+Label — orchestrator computes the deterministic spec-diff helpers. REUSE BOUNDARY (AC-1):
// reds route to the labeler HERE, BEFORE any green-gate evaluation; suiteGreen is NEVER applied to the reds.
// =================================================================================================
phase('Diff+Label')

// 1) Label every red (actual ≠ expected). The reds are the PRIMARY output — labeled, never gated away.
const outcomes = runRaw.testOutcomes ?? []
const candidateBugQueue = []
const needsTriageBucket = []
const sameOutcome = (a, b) => (a ?? null) === (b ?? null)
for (const o of outcomes) {
  const isRed = o.errored === true || !sameOutcome(o.actual, o.expected)
  if (!isRed) continue
  const lab = labelRed({ expected: o.expected ?? null, actual: o.actual ?? null, ruleOrder: RULE_ORDER_CFG, okValue: OK_VALUE, errored: o.errored === true })
  const entry = { id: o.id, ruleName: o.ruleName, expected: o.expected ?? null, actual: o.actual ?? null, ...lab }
  // ADR-D: EVERY red lands in the candidate-bug queue (never deleted). A case-4/under-enforce/sin red is a
  // candidate; case-1/case-5/mislocation reds are also recorded but additionally flagged needs-triage.
  candidateBugQueue.push(entry)
  if (lab.route === 'needs-triage' || lab.needsTriage === true) needsTriageBucket.push(entry)
}
// Miner mis-locations + code-missing also feed the needs-triage bucket (Step 2 caveat).
for (const l of located) {
  if (l.route === 'needs-triage') needsTriageBucket.push({ id: l.id, label: 'miner-mislocation', location: l.location, route: 'needs-triage' })
}
log(`Diff+Label: ${candidateBugQueue.length} red(s) labeled → candidate-bug queue; ${needsTriageBucket.length} in needs-triage. (suiteGreen NEVER applied to reds — AC-1 reuse boundary.)`)

// 2) The three-axis diff. The code-rules side is the existing mine-verify consensusRules for this class
// (the proven path — no new code; reuse its output). At wire time it is passed via _args.codeRules (the
// operator supplies the mine-verify run output); absent, the diff runs spec-only (every spec rule → an axis).
const codeRules = _args.codeRules ?? []
// Attach each spec-not-code item's red test (if any) so the headline carries it (AC-4).
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
// Phase: Report — orchestrator writes the self-contained run report (3-axis diff + candidate-bug queue +
// needs-triage bucket) nexus-side, git-ignored (Step 6 / Q8). The report is the operator's triage surface.
// =================================================================================================
phase('Report')
const candidateBugSection = candidateBugQueue.length
  ? candidateBugQueue.map((e) => `- **${e.label}** — ${e.id}${e.ruleName ? ` [${e.ruleName}]` : ''}: expected \`${e.expected}\`, actual \`${e.actual}\`${e.needsTriage ? ' _(tagged needs-triage)_' : ''}\n  - ${e.detail ?? ''}`).join('\n')
  : '_No reds — no candidate bugs this run._'
const needsTriageSection = needsTriageBucket.length
  ? needsTriageBucket.map((e) => `- **${e.label}** — ${e.id}${e.ruleName ? ` [${e.ruleName}]` : ''}${e.location ? ` @ ${e.location}` : ''}: ${e.detail ?? e.route}`).join('\n')
  : '_None._'
const greenGateRows = Object.entries(greenGates).map(([name, g]) => `| ${name} | ${g.pass ? 'PASS' : 'FAIL'} | ${g.detail?.scorePct !== undefined ? `${g.detail.scorePct}%` : (g.detail?.error ? g.detail.error.slice(0, 60) : 'ok')} |`).join('\n')

const reportContent = `# Spec-driven Cover run — ${TARGET_CLASS} (${today})

**Front-end:** \`harness/spec-cover.workflow.js\` (full-build Increment 1 — the spec-driven direction)
**Target:** \`${SRC}\`
**Golden oracle:** \`${GOLDEN_SET}\` (read by the spec-load agent ONLY — ADR-C placement layer)
**Isolated assembly:** \`${ISOLATED_ASSEMBLY}\` (references the KG product project, NOT KnowledgeGateway.Tests — AC-3(b))
**Model:** ${MODEL} (every agent; default Sonnet)
**Run cost (marginal):** ${runSpent().toLocaleString()} output tokens — THIS run only.

## Three-axis diff (ADR-B — spec ∧ ¬code FIRST)

${diff.serialized}

## Candidate-bug queue (every red, kept + flagged, never deleted — ADR-D)

${candidateBugSection}

## needs-triage bucket (case-4 over-rejections, case-5 errors, miner mis-locations, fixture-fidelity artifacts)

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
- FP-labeler is the deterministic 5-case identity comparison against the fixed rule order (spec-diff.mjs).
  Only case 1 (earlier-fired) is auto-resolved; case 4 (over-rejection — the L272 shape) is a candidate
  tagged needs-triage, never auto-confirmed real-vs-artifact.
- This report was written automatically by the orchestrator (git-ignored, nexus-side — never in the KG tree).
`

await agent(`You are the REPORT-WRITE agent. Write EXACTLY this content to ${REPORT_PATH} — no changes, no reformatting.\n\nCONTENT:\n${reportContent}\n\nWrite the file now using the Write tool. Return { "written": true } when done.`, { label: 'report-write', phase: 'Report', schema: WRITE_CONFIRM_SCHEMA, model: MODEL })
log(`Report written: ${REPORT_PATH}`)

// =================================================================================================
// RETURN
// =================================================================================================
log(`Spec-cover done: ${candidateBugQueue.length} candidate bug(s), ${needsTriageBucket.length} needs-triage; green subset ${greenSubsetProven ? 'proven' : 'not proven'} at ${mutationScore}%.`)
return {
  variant: 'inc1-spec-cover-generatedsqlvalidator',
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
