// Mine→Verify→Cover controller — FLUTTER/DART (harness Increment 4, Flutter bringup).
//
// Runnable via Workflow({ scriptPath: "<abs>/harness/loop-flutter.workflow.js", args: {...} }).
//
// The Flutter twin of loop.workflow.js: ONE invocation does the whole loop for a Dart class —
//   compose mine-verify (the STACK-AGNOSTIC workflow, unchanged) → serialize + write the KB →
//   compose cover-flutter → write the report → flip the KB to mutation-gated on all-gates-green.
//
// Thinner than the .NET controller by design:
//   • No MONOLITH_FALLBACK — workflow() composition is proven (the .NET loop ships on it).
//   • KB is OVERWRITTEN from the verified rules (harness-owned file), not superseded — no kb-read step.
//   • Mine→Verify needs NO Dart variant: mine-verify.workflow.js is language-neutral and runs on a
//     `.dart` source via args.src (proven 2026-06-24).
//
// SAFETY RAILS (never fake green): budget ceiling (run-marginal), mine-verify clean-halt propagation,
// and the cover-flutter sub-workflow's own §6 gate battery. On halt/cap it returns the stop reason.

// meta MUST be the first statement (Workflow tool requirement) and a PURE LITERAL.
export const meta = {
  name: 'mine-verify-cover-flutter-loop',
  description:
    'Harness Inc 4 Flutter controller: ONE invocation runs Mine→Verify→Cover for a Dart class. Composes the stack-agnostic mine-verify workflow, serializes the verified rules into the consuming app KB, composes cover-flutter (mutation_test gate), writes the run report, and flips the KB to mutation-gated on all-gates-green. DEFAULT MODEL: Sonnet (the mutation gate measures test quality). Budget cap safety rail. Target from args; defaults to BuildZplCodeUsecase.',
  phases: [
    { title: 'Mine→Verify', detail: 'compose mine-verify.workflow.js on the Dart source (stack-agnostic) → consensus rules' },
    { title: 'KB Write', detail: 'serialize the verified rules into the app KB (status: verified) before Cover reads it' },
    { title: 'Cover', detail: 'compose cover-flutter.workflow.js: Cover agent writes flutter_test; runner runs flutter test + mutation_test; §6 gates' },
    { title: 'Report', detail: 'write the run report; flip the KB to mutation-gated on all-gates-green' },
  ],
}

// --- Args (Workflow-tool injects a JSON STRING; workflow() composition injects an OBJECT) ----------
const _argsRaw = (typeof args !== 'undefined' && args) ? args : {}
let _args = {}
try { _args = typeof _argsRaw === 'string' ? JSON.parse(_argsRaw) : _argsRaw } catch { _args = {} }

const APP = _args.appDir ?? 'D:\\omnishelf\\omnishelf_flutter_app'
const MODEL = _args.model ?? 'sonnet'
const TARGET_CLASS = _args.targetClass ?? 'BuildZplCodeUsecase'
const SRC = _args.src ?? `${APP}\\lib\\domain\\usecases\\zebra_printer\\build_zpl_code_usecase.dart`
const KB_RULES = _args.kbRules ?? `${APP}\\docs\\kb\\${kebab(TARGET_CLASS)}.md`
const KB_INDEX = _args.kbIndex ?? `${APP}\\docs\\kb\\index.md`
const COVER_TEST = _args.coverTest ?? `${APP}\\test\\domain\\usecases\\${snake(TARGET_CLASS)}_harness_test.dart`
const TEST_PROJECT_DIR = _args.testProjectDir ?? APP
const MUTATE_FILE = _args.mutateFile ?? toAppRel(SRC, APP)
const TEST_STYLE = _args.testStyle ?? `${APP}\\test\\flutter_test_config.dart`
const PATTERN_TESTS = _args.patternTests ?? null
const EXPECTED_SURVIVOR_LINES = _args.expectedSurvivorLines ?? []
// Pre-tag signal (Q1) — log-call line numbers the adapter surfaces; forwarded to cover-flutter so the
// orchestrator can pre-tag `equivalent-logging`. Distinct from EXPECTED_SURVIVOR_LINES (denominator exclusion).
const EQUIVALENT_LOGGING_LINES = _args.equivalentLoggingLines ?? []
const MUTATION_FLOOR = _args.mutationFloor ?? 75
const MAX_ITERATIONS = _args.maxIterations ?? 5
// Minimize activation-gate margin (feedback-F1): the stage runs only when the generated test count exceeds
// the distinct mined-rule count by MORE than this margin. Default 1 — a non-degenerate band (margin 0 would
// be `> distinctRules`, which never skips); tunable via args.
const MINIMIZE_ACTIVATION_MARGIN = _args.minimizeActivationMargin ?? 1

// Sub-workflow script paths (nexus dev repo).
const MINE_VERIFY_SCRIPT = 'D:\\src\\claude-plugins\\nexus\\harness\\mine-verify.workflow.js'
const COVER_FLUTTER_SCRIPT = 'D:\\src\\claude-plugins\\nexus\\harness\\cover-flutter.workflow.js'

// Report (nexus-side delivery doc) + runner result (nexus-side, git-ignored — set by cover-flutter).
const REPORT_PATH = _args.reportPath ?? `D:\\src\\claude-plugins\\nexus\\docs\\specs\\adhoc-MineVerifyCoverHarness\\delivery\\cover-flutter-${TARGET_CLASS.toLowerCase()}.md`

// Minimize-stage confirm re-gate result (nexus-side, git-ignored — set by the minimize-confirm-run agent).
const RUNS_DIR = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'
const MINIMIZE_RUNNER_RESULT = _args.minimizeRunnerResult ?? `${RUNS_DIR}\\loop-flutter-${TARGET_CLASS.toLowerCase()}-minimize-run.json`

// Budget ceiling (run-marginal — budget.spent() is the SHARED session pool; gate on the run's own spend).
const BUDGET_CEILING_TOKENS = _args.budgetCeiling ?? 4_000_000
const RUN_START_SPENT = budget.spent()
const runSpent = () => budget.spent() - RUN_START_SPENT

// --- Pure helpers (no Date/Math.random/fs — resume-safe) ------------------------------------------
function snake(name) {
  return String(name).replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').toLowerCase()
}
function kebab(name) {
  return snake(name).replace(/_/g, '-')
}
function toAppRel(abs, appRoot) {
  const a = String(abs).replace(/\//g, '\\')
  const root = String(appRoot).replace(/\//g, '\\').replace(/\\+$/, '')
  const rel = a.startsWith(root) ? a.slice(root.length).replace(/^\\+/, '') : a
  return rel.replace(/\\/g, '/')
}
// Serialize the verified rules into the consuming-app KB markdown (the build-zpl-code.md shape).
function serializeKb(rules, verdicts, opts) {
  const tally = (k) => (verdicts ?? []).filter((v) => v.verdict === k).length
  const summary = `${rules.length} rules; ${tally('CONFIRMED')} CONFIRMED, ${tally('IMPRECISE')} IMPRECISE, ${tally('WRONG')} WRONG`
  const ruleLines = rules
    .map((r) => `- ${r.id}: ${r.statement}${r.agreement < 3 ? ` _(agreement ${r.agreement}/3)_` : ''}`)
    .join('\n')
  const status = opts.mutationGated ? 'mutation-gated' : 'verified'
  const note = opts.mutationGated ? 'Cover gate PASSED.' : 'Cover not yet run.'
  return `# ${opts.targetClass} — verified business rules

Source: \`${opts.relpath}\`.

## Rules

Mined by 3 clean-room miners + skeptic verify (${summary}). ${note}

${ruleLines}

---
<!-- status: ${status} — ${opts.runNote} (${opts.date}) -->
<!-- mutation-gated: ${opts.mutationGated} -->
`
}

// --- Date stamp (prefer args.runDate; the orchestrator VM has no Date — see loop.workflow.js) ------
const DATE_STAMP_SCHEMA = { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] }
const dateStampResult = _args.runDate
  ? { date: _args.runDate }
  : await agent('Output ONLY today\'s date as YYYY-MM-DD. Return nothing else.', { label: 'date-stamp', phase: 'Mine→Verify', schema: DATE_STAMP_SCHEMA, model: MODEL })
const today = dateStampResult?.date ?? '(date-unavailable)'

// =================================================================================================
// PHASE 1: MINE → VERIFY (compose the stack-agnostic workflow on the Dart source)
// =================================================================================================
phase('Mine→Verify')
log(`Flutter controller start: target=${TARGET_CLASS}, src=${SRC}. Budget ceiling ${BUDGET_CEILING_TOKENS.toLocaleString()} run-marginal (baseline ${RUN_START_SPENT.toLocaleString()}).`)

const mineVerifyResult = await workflow(
  { scriptPath: MINE_VERIFY_SCRIPT },
  { src: SRC, targetClass: TARGET_CLASS, model: MODEL },
)
if (mineVerifyResult?.stopped) {
  log(`HALT: mine-verify stopped (${mineVerifyResult.stopped}): ${mineVerifyResult.reason ?? ''}`)
  return { stopped: mineVerifyResult.stopped, reason: mineVerifyResult.reason, after: 'mine-verify', outputTokensThisTurn: budget.spent() }
}
if (!mineVerifyResult?.consensusRules?.length) {
  return { stopped: 'mine-fail', reason: 'mine-verify returned no consensus rules', outputTokensThisTurn: budget.spent() }
}
log(`Mine→Verify complete: ${mineVerifyResult.consensusRules.length} consensus rules.`)

if (runSpent() > BUDGET_CEILING_TOKENS) {
  return { stopped: 'budget-ceiling', after: 'mine-verify', spent: runSpent(), sessionTotal: budget.spent(), outputTokensThisTurn: budget.spent() }
}

// =================================================================================================
// PHASE 2: KB WRITE (serialize verified rules to the app KB BEFORE Cover reads it)
// =================================================================================================
phase('KB Write')
const relpath = toAppRel(SRC, APP)
const kbText = serializeKb(mineVerifyResult.consensusRules, mineVerifyResult.interpretiveVerdicts, {
  targetClass: TARGET_CLASS, relpath, date: today, mutationGated: false,
  runNote: 'Mine→Verify pass complete, Cover not yet run',
})
const KB_WRITE_SCHEMA = { type: 'object', properties: { written: { type: 'boolean' } }, required: ['written'] }
const kbWritePrompt = `You are the KB-WRITE-FILE agent. Write EXACTLY this content to the file — no changes, no reformatting, no summarizing. Create the docs/kb/ directory if needed.

TARGET FILE: ${KB_RULES}

CONTENT TO WRITE (verbatim):
${kbText}

Write the file now with the Write tool. Return { "written": true }.`
const kbWriteConfirm = await agent(kbWritePrompt, { label: 'kb-write-file', phase: 'KB Write', schema: KB_WRITE_SCHEMA, model: MODEL })
if (!kbWriteConfirm?.written) log('WARNING: KB-write-file agent did not confirm the write.')
log(`KB Write complete: ${KB_RULES} (status: verified, ${mineVerifyResult.consensusRules.length} rules).`)

// =================================================================================================
// PHASE 3: COVER (compose cover-flutter — it runs its own bounded loop + §6 gate battery)
// =================================================================================================
phase('Cover')
const coverResult = await workflow(
  { scriptPath: COVER_FLUTTER_SCRIPT },
  {
    targetClass: TARGET_CLASS, src: SRC, kbRules: KB_RULES, appDir: APP, coverTest: COVER_TEST,
    testProjectDir: TEST_PROJECT_DIR, mutateFile: MUTATE_FILE, testStyle: TEST_STYLE,
    patternTests: PATTERN_TESTS, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES,
    equivalentLoggingLines: EQUIVALENT_LOGGING_LINES,
    mutationFloor: MUTATION_FLOOR, maxIterations: MAX_ITERATIONS, model: MODEL,
  },
)
if (!coverResult) {
  return { stopped: 'cover-fail', reason: 'cover-flutter sub-workflow returned no result', after: 'cover', outputTokensThisTurn: budget.spent() }
}
log(`Cover done: ${coverResult.stopped} after ${coverResult.iter ?? '?'} iteration(s); achieved ${coverResult.achievedScore ?? '?'}% reachable kill.`)

// =================================================================================================
// PHASE 3.5: MINIMIZE (post-floor trim + fail-closed confirm — mine-verify-cover SKILL.md "The Minimize
// stage", the dual of classify-survivors below). Runs ONLY when Cover reached all-gates-green (nothing to
// trim from a halted/capped run). Every I/O step is an AGENT — the orchestrator has no filesystem
// (mine-verify-cover SKILL.md): the minimize agent reads + reasons (a HYPOTHESIS — no per-test kill-map
// exists to verify it), a write-owning agent applies the removal (and restores on regression), a runner
// agent re-runs the FULL gate on the reduced suite. The orchestrator only routes the proposal and makes
// the PURE accept/restore decision on the EXACT reachable killed-count (never the rounded scorePct — a
// one-mutant drop on a large denominator can round away).
// =================================================================================================

// --- Minimize-stage pure helpers — mutationFloor + its deps are copied VERBATIM from
// cover-flutter.workflow.js (KEEP IN SYNC) so the confirm scores the post-removal summary with the
// IDENTICAL exact-count formula the original gate used to produce killedBefore. No cross-file import is
// possible in the Workflow runtime, so this is an intentional, documented duplication — the same pattern
// cover-flutter.workflow.js itself uses for the gate battery it copies from cover.workflow.js.
function mutantLine(m) {
  return m?.location?.start?.line ?? null;
}
const VOID_CALL_REMOVAL_RE = /remove[\W_]*void[\W_]*call/i;
function pretagEquivalentLogging(mutant, equivalentLoggingLines) {
  const line = mutantLine(mutant);
  if (equivalentLoggingLines.has(line) && VOID_CALL_REMOVAL_RE.test(mutant?.mutatorName ?? '')) {
    return 'equivalent-logging';
  }
  return undefined;
}
function mutationFloor(summary, survivors, opts) {
  const floor = opts?.floor ?? 75;
  const deadLines = new Set(opts?.expectedSurvivorLines ?? []);
  const loggingLines = new Set(opts?.equivalentLoggingLines ?? []);
  const found = summary?.found ?? 0;
  const notCovered = summary?.notCovered ?? 0;
  const reachable = found - notCovered;
  const reachableSurvivors = [];
  let expectedSurvivorsExcluded = 0;

  for (const m of survivors ?? []) {
    const line = mutantLine(m);
    if (deadLines.has(line)) {
      expectedSurvivorsExcluded++;
      continue;
    }
    const entry = { status: m.status, line, mutatorName: m.mutatorName, replacement: m.replacement };
    const tag = pretagEquivalentLogging(m, loggingLines);
    if (tag) entry.tag = tag;
    reachableSurvivors.push(entry);
  }

  const reachableDenominator = reachable - expectedSurvivorsExcluded;
  const killed = reachableDenominator - reachableSurvivors.length;
  const scorePct = reachableDenominator > 0 ? Math.round((killed / reachableDenominator) * 100) : 0;
  return {
    pass: reachableDenominator > 0 && scorePct >= floor,
    detail: { scorePct, killed, reachableDenominator, expectedSurvivorsExcluded, floor, reachableSurvivors },
  };
}

// --- Minimize agent (source-aware, sonnet) — proposes removals BY REASONING. This is a HYPOTHESIS, never
// a verified fact: the mutation tool reports only aggregate survivors, never which TEST killed which
// mutant. Mirrors the classify-survivors actor split exactly: the agent proposes, the orchestrator only
// records/routes and NEVER derives a removal itself.
const MINIMIZE_PROPOSAL_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          testName: { type: 'string' },
          killsMutants: { type: 'array', items: { type: 'string' } },
          subsumedBy: { type: 'array', items: { type: 'string' } },
          documentsDistinctRule: { type: 'boolean' },
          categoricalKeep: { type: 'boolean' },
          ruleId: { type: 'string' },
          category: { type: 'string' },
        },
        // FAIL-CLOSED (FIX-A): `categoricalKeep` is REQUIRED — a fresh MVC run always emits it, so a proposal
        // omitting a keep flag is malformed, not a legacy proposal. Making it required (alongside the
        // orchestrator's fail-closed filter below) means a keeper can never be silently dropped by an absent flag.
        required: ['testName', 'killsMutants', 'subsumedBy', 'documentsDistinctRule', 'categoricalKeep'],
      },
    },
  },
  required: ['candidates'],
}
function minimizeAgentPrompt(residualSurvivors) {
  const survivorBlock = residualSurvivors.length
    ? `RESIDUAL SURVIVORS (NOT killed by ANY current test — no test can accurately claim to kill these):\n${residualSurvivors
        .map((s) => `  - line ${s.line}: ${s.mutatorName} → \`${s.replacement}\` (${s.status})`)
        .join('\n')}`
    : 'RESIDUAL SURVIVORS: none — every reachable mutant is currently killed by at least one test.'

  return `You are the MINIMIZE agent. This suite just reached the mutation floor. Find REDUNDANT tests —
by REASONING about the source + the suite, NOT by re-running mutation testing — and PROPOSE removals. Your
proposal is a HYPOTHESIS: no tool can verify per-test mutant attribution (the mutation tool reports only
AGGREGATE survivors), so the orchestrator will re-run the FULL gate on the reduced suite you propose and
RESTORE everything if the kill count drops by even one. A wrong proposal costs a wasted re-gate, never a
silent coverage hole — so reason carefully, but do not be afraid to propose nothing.

YOU HAVE NO WRITE ACCESS — you only READ and PROPOSE. A separate write-owning agent applies your proposal.

STEP 1 — READ THE PRODUCTION SOURCE (the SUT):
  ${SRC}

STEP 2 — READ THE CURRENT TEST SUITE (every test that reached the floor):
  ${COVER_TEST}

STEP 3 — READ THE VERIFIED RULES (ground truth — which distinct rule each test should map to):
  ${KB_RULES}

${survivorBlock}

FOR EACH TEST YOU CONSIDER removing, reason about which mutant(s) in the production source it kills (read
the assertion + the line's operator), then check:
  (a) is every one of those mutants ALSO killed by a test you are NOT proposing to remove — name it in
      \`subsumedBy\`?
  (b) does this test document a DISTINCT verified rule that no retained test documents — \`documentsDistinctRule\`?

Propose removing a test ONLY if (a) holds for every mutant it kills AND (b) is false — OR the test is one
of these four categorical-dead classes (always propose these, regardless of (a)/(b)):
  1. Log-only — asserts on log/no-output side effects only.
  2. Occurrence-count escalation — a near-duplicate that only escalates a call-count assertion.
  3. Same-call-same-assertion under two rule labels — identical call + assertion filed under two rule IDs.
  4. Boundary test with no distinguishing input — a "boundary" test that never actually constructs the
     input that distinguishes the boundary.

A test that uniquely documents a distinct verified rule is KEPT even when mutation-redundant — set
\`documentsDistinctRule: true\` and the orchestrator will NOT remove it, regardless of \`subsumedBy\`.

CATEGORICAL-KEEP (the INVERSE of the four categorical-dead classes — NEVER remove these, even when
mutation-redundant and filed under a shared rule ID): a DEGENERATE-INPUT test that CONSTRUCTS a
boundary/edge input — empty input, no-match, zero / empty-collection, or the documented failure-passthrough
— AND asserts the observable SAFE / NO-OP result. Its removal kills NO unique mutant, so the confirm re-gate
is BLIND to its loss — this categorical rule is the only guard. If a test you would otherwise flag for
removal is a categorical-KEEP, include it in \`candidates\` with \`categoricalKeep: true\` (exactly like
\`documentsDistinctRule\`); the orchestrator refuses its removal, regardless of \`subsumedBy\`.

DISCRIMINATOR vs categorical-dead class #4: the single test separating a KEEP from a DROP-#4 is *does the
test actually CONSTRUCT the distinguishing input and ASSERT the result?* Constructs the degenerate edge +
asserts the no-op → \`categoricalKeep: true\` (KEEP). Names a boundary but never builds it → class #4 (remove).

Do NOT propose removing a test that kills a mutant on the RESIDUAL SURVIVORS list above — nothing else
kills those yet, so removing its only chance is never safe to propose.

Return { "candidates": [ { "testName": "...", "killsMutants": ["..."], "subsumedBy": ["retainedTestName"],
  "documentsDistinctRule": false, "categoricalKeep": false, "ruleId": "BR-...", "category": "..." }, ... ] } —
one entry PER TEST you propose removing OR flag as a keep. An empty \`candidates\` array is a valid, complete
answer (nothing redundant found).`
}

// --- Write-owning agent: applies the proposed removal. Captures the EXACT original file content in its
// structured return (the orchestrator has no filesystem, so this is the ONLY way it can later instruct a
// verbatim restore) — mirrors the "write EXACTLY this content, no changes" idiom this controller already
// uses for kb-write-file/kb-flip/report-write.
const MINIMIZE_APPLY_SCHEMA = {
  type: 'object',
  properties: {
    removed: { type: 'array', items: { type: 'string' } },
    originalContent: { type: 'string' },
  },
  required: ['removed', 'originalContent'],
}
function minimizeApplyPrompt(testNames) {
  return `You are the MINIMIZE-APPLY agent — the write-owning agent for the Minimize stage.

YOUR ONLY WRITE TARGET (touching anything else is a hard violation):
  • ${COVER_TEST}

STEP 1 — Read ${COVER_TEST} and capture its EXACT current full content verbatim. You will return it
UNCHANGED as "originalContent" — this is the ONLY way the orchestrator (it has no filesystem) can restore
the file later if this removal regresses the mutation gate.

STEP 2 — Remove EXACTLY these named tests from the file, and touch NOTHING else (no reformatting, no
other test touched, no production source touched):
${testNames.map((n) => `  - ${n}`).join('\n')}

STEP 3 — Write the reduced file back to ${COVER_TEST}.

Return { "removed": [${testNames.map((n) => `"${n}"`).join(', ')}], "originalContent": "<the EXACT full
file content you read in Step 1, before any edit — verbatim>" }.`
}

// --- Write-owning agent: restores the suite verbatim on a confirm regression (the fail-closed branch).
const MINIMIZE_RESTORE_SCHEMA = { type: 'object', properties: { restored: { type: 'boolean' } }, required: ['restored'] }
function minimizeRestorePrompt(originalContent) {
  return `You are the MINIMIZE-RESTORE agent — the write-owning agent for the Minimize stage's fail-closed
confirm. The confirm re-gate detected a kill-count DROP (or an inconsistent result) after the last
removal, so it must be undone NOW.

Write EXACTLY this content to ${COVER_TEST} — no changes, no reformatting. This is the suite BEFORE the
proposed removal:

${originalContent}

Return { "restored": true }.`
}

// --- Runner agent: the confirm re-gate. Re-runs the FULL toolchain on the (now-reduced) test file — a
// REAL re-mutation producing a FRESH mutationSummary, never a recompute over the pre-minimize numbers.
// Mirrors cover-flutter.workflow.js's runner path (`runnerPrompt` / RUNNER_RESULT_SCHEMA) verbatim in
// shape — reused here because no cross-file import exists in the Workflow runtime; keep in sync.
const MINIMIZE_CONFIRM_SCHEMA = {
  type: 'object',
  properties: {
    testRuns: {
      type: 'array', minItems: 2,
      items: { type: 'object', properties: { passed: { type: 'integer' }, failed: { type: 'integer' }, skipped: { type: 'integer' } }, required: ['passed', 'failed', 'skipped'] },
    },
    reportPath: { type: 'string' },
    mutationSummary: {
      type: 'object',
      properties: { found: { type: 'integer' }, undetected: { type: 'integer' }, timeouts: { type: 'integer' }, notCovered: { type: 'integer' } },
      required: ['found', 'undetected', 'timeouts', 'notCovered'],
    },
    mutants: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          location: { type: 'object', properties: { start: { type: 'object', properties: { line: { type: 'integer' } }, required: ['line'] } }, required: ['start'] },
          mutatorName: { type: 'string' },
          replacement: { type: 'string' },
        },
        required: ['status', 'location', 'mutatorName'],
      },
    },
    mutatedFiles: {
      type: 'array',
      items: { type: 'object', properties: { file: { type: 'string' }, count: { type: 'integer' } }, required: ['file', 'count'] },
    },
  },
  required: ['testRuns', 'reportPath', 'mutationSummary', 'mutants', 'mutatedFiles'],
}
function minimizeConfirmRunnerPrompt() {
  return `You are the RUNNER agent — the Minimize stage's CONFIRM re-gate. Execute the Flutter/Dart
toolchain on the REDUCED test file exactly as the Cover/Gate loop's runner does. You do NOT write tests
and you do NOT edit production code.

STEPS (run from the app root ${TEST_PROJECT_DIR}):
  1. Run \`flutter test ${COVER_TEST}\` TWICE (two independent invocations). Record { passed, failed,
     skipped } for EACH run.
  2. Run mutation testing on ONLY the target file with a machine-readable report:
     a. Write a mutation_test config XML (mutation_test_minimize_confirm.xml in the app root) with:
          <mutations version="1.0">
            <files><file>${MUTATE_FILE}</file></files>
            <commands><command group="test" expected-return="0" working-directory="." timeout="180">flutter test ${COVER_TEST}</command></commands>
          </mutations>
        (builtin rules are used by default — do NOT pass --rules.)
     b. Run: \`dart pub global run mutation_test -f xml -o mutation_test_confirm_out mutation_test_minimize_confirm.xml\`
  3. Parse the stdout SUMMARY — it is AUTHORITATIVE (the XML lists only survivors). Read:
          "Found {found} mutations"     → found
          "Undetected Mutations: {n}"   → undetected
          "Timeouts: {n}"               → timeouts
          "Not covered by tests: {n}"   → notCovered
     Return these as mutationSummary: { found, undetected, timeouts, notCovered }.
  4. Read the XML report under mutation_test_confirm_out/ to ENUMERATE SURVIVORS ONLY (never to count
     kills). For each undetected mutation build ONE entry: { "status": "Survived", "location": { "start":
     { "line": N } }, "mutatorName": "...", "replacement": "..." }. The number of survivor entries MUST
     equal mutationSummary.undetected — report exactly what the tool lists, never padded or dropped.
  5. Build \`mutatedFiles\`: one { "file": "<path>", "count": <int> } per file mutation_test mutated.
  6. Clean up: delete mutation_test_minimize_confirm.xml and mutation_test_confirm_out/ from the app tree
     when done.

ALSO WRITE YOUR RESULTS HERE for the record (nexus-side, git-ignored — NEVER into the consuming app tree):
  ${MINIMIZE_RUNNER_RESULT}

as JSON: { "testRuns": [{passed,failed,skipped},{passed,failed,skipped}], "reportPath": "<abs path to the
xml report>", "mutationSummary": { "found": N, "undetected": N, "timeouts": N, "notCovered": N },
"mutants": [<SURVIVORS-ONLY array for the target file>], "mutatedFiles": [{ "file": "<path>", "count": <int> }] }

IMPORTANT: return the same data in your schema'd response AND in the Write() — the orchestrator uses the
schema return directly and does NOT read files. NEVER report mutations from a file other than the target ${SRC}.`
}

// Zero-removal reason (feedback-F1 / FIX-C): when Minimize proposes candidates but removes NONE, say WHY —
// an empty proposal, kept by distinct-rule, kept by categorical-KEEP (degenerate-input), or held back
// fail-closed (a candidate missing a keep flag is never removed). PURE — no fs/Date/Math.random. Returns the
// per-reason counts + a rendered `clause` shared by the log and the report line, so neither can drift into a
// blanket "documented a distinct rule" (false when survivors were kept by categoricalKeep — MED/FIX-C).
function zeroRemovalReason(candidates) {
  const distinct = candidates.filter((c) => c.documentsDistinctRule === true).length
  const categorical = candidates.filter((c) => c.categoricalKeep === true).length
  const missingFlag = candidates.filter((c) => c.documentsDistinctRule !== true && c.categoricalKeep !== true).length
  const parts = []
  if (distinct) parts.push(`${distinct} kept as distinct-rule`)
  if (categorical) parts.push(`${categorical} kept as categorical-KEEP (degenerate-input)`)
  if (missingFlag) parts.push(`${missingFlag} held back fail-closed (missing keep flag)`)
  const clause = candidates.length === 0
    ? 'no redundant tests proposed (nothing categorically dead, nothing mutation-redundant found)'
    : parts.join(', ')
  return { distinct, categorical, missingFlag, empty: candidates.length === 0, clause }
}

const allGatesGreen = coverResult.stopped === 'all-gates-green'
let minimizeResult = null

if (allGatesGreen) {
  phase('Minimize')
  const killedBefore = coverResult.gates?.mutation_floor?.detail?.killed ?? null
  const scorePctBefore = coverResult.achievedScore ?? 0
  const residualSurvivors = coverResult.gates?.mutation_floor?.detail?.reachableSurvivors ?? []

  // --- Activation gate (feedback-F1): Minimize runs ONLY when the generated test count MATERIALLY exceeds
  // the distinct mined-rule count. Both counts come from UPSTREAM results — do NOT re-derive (HIGH-1):
  //   • distinctRules = mine-verify's consensus rule count (mineVerifyResult.consensusRules.length)
  //   • generated     = the TRUE green suite size = passed + failed + skipped of a suite_green run
  //                     (cover-flutter.workflow.js suiteGreen()). Use the TOTAL, NOT `passed` alone (FIX-B):
  //                     the all-gates-green path tolerates skipped tests when baselineSkips > 0, so `passed`
  //                     undercounts the real suite size and would let Minimize skip early. failed is 0 on the
  //                     green path; it is included only for completeness.
  // Do NOT count the rule total from the proposal `candidates` — those are the REMOVED tests only and do not
  // exist until AFTER the minimize agent runs. At/near the rule count there is nothing safe to trim, so the
  // whole stage is skipped — logged AND reported (never a silent no-op). When `generated` is unknown (no runs
  // data on the cover result) the gate cannot fire and Minimize proceeds as before.
  const distinctRules = mineVerifyResult.consensusRules.length
  const suiteRun0 = coverResult.gates?.suite_green?.detail?.runs?.[0]
  const generated = suiteRun0 && typeof suiteRun0.passed === 'number'
    ? suiteRun0.passed + (suiteRun0.failed ?? 0) + (suiteRun0.skipped ?? 0)
    : null

  if (killedBefore === null) {
    log('Minimize SKIPPED: no pre-minimize killed-count on the cover result — cannot confirm safely.')
  } else if (generated !== null && generated <= distinctRules + MINIMIZE_ACTIVATION_MARGIN) {
    log(`Minimize SKIPPED (at rule-floor): generated ${generated} <= distinctRules ${distinctRules} + margin ${MINIMIZE_ACTIVATION_MARGIN} — nothing safe to trim near the rule count; the minimize agent is NOT spawned.`)
    minimizeResult = { skipped: 'at-rule-floor', generated, distinctRules }
  } else {
    const proposal = await agent(minimizeAgentPrompt(residualSurvivors), {
      label: 'minimize-propose', phase: 'Minimize', schema: MINIMIZE_PROPOSAL_SCHEMA, model: MODEL,
    })
    const candidates = proposal?.candidates ?? []
    // Pure decision: honor BOTH agent keep-flags, NEVER override them (rule-traceable boundary — the suite
    // target is rule-traceable, not mutation-minimal). `documentsDistinctRule` keeps a test that documents a
    // distinct verified rule; `categoricalKeep` keeps a degenerate-input test that constructs the edge and
    // asserts the no-op (feedback-F1) — its removal kills no UNIQUE mutant, so it is invisible to the confirm
    // re-gate below; the guard MUST live here, pre-removal. The orchestrator derives nothing — it only reads
    // the two agent booleans. FAIL-CLOSED (FIX-A): remove a candidate ONLY when BOTH flags are explicitly
    // `false`; one MISSING either flag (undefined) is HELD BACK, never removed — a keeper whose flag the agent
    // omitted must not be silently dropped (its loss is invisible to the confirm). `categoricalKeep` is also in
    // the proposal schema's `required` list, so a well-formed proposal always carries it; this is the backstop.
    const toRemove = candidates.filter((c) => c.documentsDistinctRule === false && c.categoricalKeep === false)

    if (toRemove.length === 0) {
      // FIX-C: report the ACTUAL zero-removal reason — empty proposal, kept-by-distinct-rule, kept-by-
      // categorical-KEEP (degenerate-input), or held-back fail-closed (a candidate missing a keep flag) — NOT
      // a blanket "every candidate documented a distinct rule" (false when survivors were kept by categoricalKeep).
      const zeroRemoval = zeroRemovalReason(candidates)
      log(`Minimize: no removals — ${zeroRemoval.clause}.`)
      minimizeResult = { removed: 0, killedBefore, killedAfter: killedBefore, scorePctBefore, scorePctAfter: scorePctBefore, zeroRemoval }
    } else {
      const testNames = toRemove.map((c) => c.testName)
      const applyResult = await agent(minimizeApplyPrompt(testNames), {
        label: 'minimize-apply', phase: 'Minimize', schema: MINIMIZE_APPLY_SCHEMA, model: MODEL,
      })
      const originalContent = applyResult?.originalContent ?? null
      if ((applyResult?.removed ?? []).length !== testNames.length) {
        log(`WARNING (minimize): write-agent reported removing ${(applyResult?.removed ?? []).length} test(s) but ${testNames.length} were proposed — the confirm re-gate below is still the authority on kill-count safety, but the reported removed/restored count may not match reality.`)
      }

      // The CONFIRM: a REAL re-gate producing a FRESH mutationSummary — distinct from the pre-minimize
      // map. This is what makes the confirm a real verifier, never a vacuous recompute.
      const confirmRaw = await agent(minimizeConfirmRunnerPrompt(), {
        label: 'minimize-confirm-run', phase: 'Minimize', schema: MINIMIZE_CONFIRM_SCHEMA, model: MODEL,
      })
      const confirmSummary = confirmRaw?.mutationSummary
      const confirmSurvivors = confirmRaw?.mutants ?? []
      // Anti-fake-green cross-check (mine-verify-cover SKILL.md invariant), applied to the confirm too:
      // an inconsistent survivor set is untrustworthy — never score on it.
      const countsConsistent = !!(confirmSummary && confirmSummary.undetected === confirmSurvivors.length)
      const confirmGate = countsConsistent
        ? mutationFloor(confirmSummary, confirmSurvivors, {
            floor: MUTATION_FLOOR, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES, equivalentLoggingLines: EQUIVALENT_LOGGING_LINES,
          })
        : null
      const killedAfter = confirmGate ? confirmGate.detail.killed : null
      const scorePctAfter = confirmGate ? confirmGate.detail.scorePct : null

      // Restore-on-regression is a HARD branch (modeled on the real ratchet HALT) — not advisory. Any
      // drop in the EXACT reachable killed-count, or an untrustworthy confirm result, restores everything.
      if (!countsConsistent || killedAfter < killedBefore) {
        if (originalContent) {
          await agent(minimizeRestorePrompt(originalContent), {
            label: 'minimize-restore', phase: 'Minimize', schema: MINIMIZE_RESTORE_SCHEMA, model: MODEL,
          })
        } else {
          log('WARNING (minimize): confirm needs a restore but no originalContent was captured — suite may be left reduced; investigate manually.')
        }
        log(`Minimize HELD BACK (confirm-regression): killed ${killedBefore} -> ${killedAfter ?? 'n/a'} (${countsConsistent ? 'exact-count drop' : 'confirm mutant-count-mismatch'}) — restored ${testNames.length} test(s).`)
        minimizeResult = { removed: 0, heldBack: 'confirm-regression', restored: testNames.length, killedBefore, killedAfter, scorePctBefore, scorePctAfter }
      } else {
        log(`Minimize ACCEPTED: removed ${testNames.length} test(s), killed ${killedBefore} -> ${killedAfter} (confirmed unchanged).`)
        minimizeResult = { removed: testNames.length, killedBefore, killedAfter, scorePctBefore, scorePctAfter }
      }
    }
  }
}

// --- classify-survivors agent contract (source-aware; the orchestrator only records its verdict) --------
// Assigns the SOURCE-DEPENDENT tags the orchestrator cannot derive. `equivalent-logging` is NOT in the enum:
// it is the orchestrator's pre-tag (cover-flutter). REAL-gap is the ONLY tag that should drive more tests.
// Each verdict echoes back the survivor's `index` (its position in the list sent to the agent) — TWO survivors
// can share one source line, so the verdict is keyed PER-SURVIVOR by index, never by line (F2 — keying by line
// let the last verdict clobber the first). `reason` is required: a verdict with no rationale is not actionable (F4).
const CLASSIFY_SURVIVORS_SCHEMA = {
  type: 'object',
  properties: {
    classifications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          line: { type: 'integer' },
          tag: { type: 'string', enum: ['equivalent-format', 'dead-code', 'masked', 'REAL-gap'] },
          reason: { type: 'string' },
          cleanup: { type: 'string' },
        },
        required: ['index', 'line', 'tag', 'reason'],
      },
    },
  },
  required: ['classifications'],
}
function classifySurvivorsPrompt(survivorsToClassify) {
  const list = survivorsToClassify.map((s, i) => `  - index ${i} | line ${s.line}: ${s.mutatorName} → \`${s.replacement}\` (${s.status})`).join('\n')
  return `You are the CLASSIFY-SURVIVORS agent. You have SOURCE access; the orchestrator does not — it only
RECORDS your verdict. Read the target source + the verified-rule KB, then assign EACH residual surviving
mutant below exactly ONE tag. (equivalent-logging survivors were already pre-tagged by the orchestrator and
are NOT in this list.)

STEP 1 — READ THE PRODUCTION SOURCE (the SUT):
  ${SRC}
STEP 2 — READ THE VERIFIED RULES KB (ground truth, already Mine→Verify'd):
  ${KB_RULES}

RESIDUAL SURVIVORS TO CLASSIFY — each carries a stable \`index\`. TWO survivors can share one source line, so the
INDEX (not the line) identifies which survivor your verdict is for; echo the exact index back in every entry:
${list}

TAGS (assign exactly one per survivor; you MUST prove equivalence before falling back to REAL-gap):
  • equivalent-format — a consistent internal-format change (the same key-builder mutated on BOTH the
    construction and the lookup side), so matching is unaffected. Equivalent — not a test gap.
  • dead-code — the mutated statement sits in a branch NO caller reaches (a guard/edge never taken).
    Equivalent AND a cleanup signal — return a \`cleanup\` of \`file:line — what to remove\`.
  • masked — a fallback / \`else\` / \`?? default\` reproduces the same observable result, so no assertion can
    distinguish the mutant. Equivalent.
  • REAL-gap — a genuine behaviour the suite missed. The ONLY tag that should drive another Cover iteration.
    Use it ONLY after you FAIL to prove the mutant equivalent/dead/masked — never as a default.

Give a one-line \`reason\` for EVERY verdict (it is required). Return
  { "classifications": [ { "index": I, "line": N, "tag": "...", "reason": "...", "cleanup": "file:line — ..." }, ... ] }
with one entry per survivor listed above — copy each \`index\` EXACTLY as shown so two survivors on one line never collide.`
}

// =================================================================================================
// PHASE 4: REPORT + KB FLIP (on all-gates-green)
// =================================================================================================
phase('Report')
const achievedScore = coverResult.achievedScore ?? 0
const candidateBugs = coverResult.redOnCurrent ?? []

if (allGatesGreen) {
  const flippedKb = serializeKb(mineVerifyResult.consensusRules, mineVerifyResult.interpretiveVerdicts, {
    targetClass: TARGET_CLASS, relpath, date: today, mutationGated: true,
    runNote: `${achievedScore}% reachable kill, floor ${MUTATION_FLOOR} cleared, ${candidateBugs.length} candidate bug${candidateBugs.length !== 1 ? 's' : ''}`,
  })
  const kbEntryFile = KB_RULES.split('\\').pop()
  const KB_FLIP_SCHEMA = { type: 'object', properties: { written: { type: 'boolean' } }, required: ['written'] }
  await agent(
    `You are the KB-FLIP agent. Write EXACTLY this content to ${KB_RULES} — no changes:\n\n${flippedKb}\n\nThen, IF ${KB_INDEX} exists, find the row for \`${kbEntryFile}\` and set its Status to "mutation-gated" (if there is no such row or no index file, skip silently). Return { "written": true }.`,
    { label: 'kb-flip', phase: 'Report', schema: KB_FLIP_SCHEMA, model: MODEL },
  )
  log('KB flipped to mutation-gated.')
} else {
  log(`Cover did not reach all-gates-green (${coverResult.stopped}). KB stays at verified.`)
}

const gateRows = coverResult.gates
  ? Object.entries(coverResult.gates).map(([name, g]) => `| ${name} | ${g.pass ? 'PASS' : 'FAIL'} | ${typeof g.detail === 'string' ? g.detail : (g.detail?.scorePct !== undefined ? `${g.detail.scorePct}%` : JSON.stringify(g.detail).slice(0, 90))} |`).join('\n')
  : '| — | — | Cover did not reach gate evaluation — see stopped reason |'
// --- Survivor classification (Report-stage enhancement: structured, repeatable run output) -------------
// Runs on the FINAL iteration's residual survivors (after expectedSurvivorLines exclusions are known) so the
// tagged set does not shrink run-over-run. The orchestrator pre-tagged equivalent-logging (cover-flutter,
// pure); a source-aware classify-survivors agent assigns the source-dependent tags
// (equivalent-format / dead-code / masked / REAL-gap) to the rest — the orchestrator only RECORDS its verdict.
const survivors = coverResult.gates?.mutation_floor?.detail?.reachableSurvivors ?? []
const toClassify = survivors.filter((s) => !s.tag) // un-pre-tagged → need source to classify
// Key the agent's verdicts by the survivor's INDEX in `toClassify`, NOT by source line: two survivors can
// share one line (e.g. two mutators on the same `&&`), and a line key lets the last verdict clobber the first
// (F2 — last-verdict-wins collision). The agent echoes the index back; the merge below walks survivors in the
// SAME order `toClassify` was built (filter preserves order), so a running counter recovers each index.
const classifyByIndex = new Map()
// Q2: spawn only when there are residual survivors (skipped on the empty-survivor path); additionally skip the
// agent when every survivor is already pre-tagged (nothing source-dependent left to classify).
if (survivors.length > 0 && toClassify.length > 0) {
  const classifyResult = await agent(classifySurvivorsPrompt(toClassify), {
    label: 'classify-survivors', phase: 'Report', schema: CLASSIFY_SURVIVORS_SCHEMA, model: MODEL,
  })
  for (const c of classifyResult?.classifications ?? []) classifyByIndex.set(c.index, c)
}
// Merge pre-tags + the agent's verdicts into one tagged list (orchestrator records; never derives source tags).
let nextClassifyIndex = 0
const taggedSurvivors = survivors.map((s) => {
  if (s.tag) return { line: s.line, mutatorName: s.mutatorName, replacement: s.replacement, status: s.status, tag: s.tag }
  const idx = nextClassifyIndex++
  const c = classifyByIndex.get(idx)
  if (!c) {
    // No verdict for an un-pre-tagged survivor → the classify agent did not respond for it. `unclassified` is
    // a LOUD, logged terminal state (never a silent default, and NEVER REAL-gap): it flags that the Report
    // carries a survivor the classify step never covered, so the operator must look.
    log(`WARNING (classify): no verdict for residual survivor #${idx} (line ${s.line}, ${s.mutatorName}) — recording tag 'unclassified' (classify-agent non-response; terminal state).`)
    return { line: s.line, mutatorName: s.mutatorName, replacement: s.replacement, status: s.status, tag: 'unclassified' }
  }
  return { line: s.line, mutatorName: s.mutatorName, replacement: s.replacement, status: s.status, tag: c.tag, reason: c.reason, cleanup: c.cleanup }
})
const survivorsSection = taggedSurvivors.length
  ? taggedSurvivors.map((m) => `- Line ${m.line}: ${m.mutatorName} \`${m.replacement}\` (${m.status}) — **${m.tag}**${m.reason ? ` — ${m.reason}` : ''}`).join('\n')
  : '_No reachable survivors._'
// Implied cleanups: dead-code + always-equivalent (logging/format) survivors are removable/buggy-code signals.
const EQUIVALENT_TAGS = new Set(['equivalent-logging', 'equivalent-format'])
const impliedCleanups = taggedSurvivors
  .filter((s) => s.tag === 'dead-code' || EQUIVALENT_TAGS.has(s.tag))
  .map((s) => (s.cleanup
    ? `- ${s.cleanup}`
    : `- \`${relpath}:${s.line}\` — ${s.tag === 'dead-code' ? 'dead branch; candidate removal' : 'equivalent mutant; redundant code / add to expectedSurvivorLines'} (${s.mutatorName})`))
const impliedCleanupsSection = impliedCleanups.length ? impliedCleanups.join('\n') : '_None — no dead-code or equivalent survivors._'
// expectedSurvivorLines suggestion: the equivalent (logging/format) lines, so a follow-up run is honest.
const suggestedLines = [...new Set(taggedSurvivors.filter((s) => EQUIVALENT_TAGS.has(s.tag)).map((s) => s.line))].sort((a, b) => a - b)
// Minimize-stage report line (mine-verify-cover SKILL.md "The Minimize stage" — never a silent trim).
const minimizeSection = !minimizeResult
  ? '_Not run — Cover did not reach all-gates-green._'
  : minimizeResult.skipped
    ? `**minimized: skipped (at rule-floor)** — generated ${minimizeResult.generated} ≤ rules ${minimizeResult.distinctRules} + margin ${MINIMIZE_ACTIVATION_MARGIN} (the suite is at the rule floor; nothing safe to trim, so Minimize did not run).`
    : minimizeResult.heldBack
    ? `**held-back: confirm-regression** — restored ${minimizeResult.restored} test(s); killed ${minimizeResult.killedBefore} → ${minimizeResult.killedAfter ?? 'n/a'} (the confirm re-gate detected a drop, so the suite was restored to its pre-minimize state).`
    : minimizeResult.removed > 0
      ? `**minimized: removed ${minimizeResult.removed} tests, reachable kill ${minimizeResult.scorePctBefore}%→${minimizeResult.scorePctAfter}% (confirmed unchanged)**`
      : `minimized: removed 0 tests — ${minimizeResult.zeroRemoval?.clause ?? 'no redundant tests proposed'}.`

const reportContent = `# Cover run (Flutter) — ${TARGET_CLASS} (${today})

**Controller:** \`harness/loop-flutter.workflow.js\` (Inc 4 — Flutter Mine→Verify→Cover, one invocation)
**Target:** \`${SRC}\`
**Mutation tool:** mutation_test (regex) driving \`flutter test\`. **Clean-room:** PROMPT-ONLY.

## Result

| Field | Value |
|-------|-------|
| Stopped | ${coverResult.stopped} |
| Iterations | ${coverResult.iter ?? '?'} |
| Achieved score | ${achievedScore}% reachable kill |
| Floor | ${MUTATION_FLOOR} |
| Model | ${MODEL} |
| Run cost (marginal) | ${runSpent().toLocaleString()} output tokens — THIS run |
| Date | ${today} |

## Gate Battery (§6)

| Gate | Result | Detail |
|------|--------|--------|
${gateRows}

## Minimize

${minimizeSection}

## Residual Survivors

_Classified on the FINAL iteration's residual survivors (after \`expectedSurvivorLines\` exclusions are known), so the tags do not shrink run-over-run. Only \`REAL-gap\` should drive another Cover iteration._

${survivorsSection}

## Implied cleanups

${impliedCleanupsSection}

**\`expectedSurvivorLines\` suggestion:** \`expectedSurvivorLines: [${suggestedLines.join(', ')}]\` — add the equivalent (logging/format) lines so a follow-up run reports an honest reachable kill rate.

## Candidate Bugs (red-on-current tests kept, never deleted)

${candidateBugs.length ? candidateBugs.map((b) => `- \`${b.test}\`${b.note ? ` — ${b.note}` : ''}`).join('\n') : '_None._'}

## Mine→Verify Summary

- Consensus rules: ${mineVerifyResult.consensusRules.length}
- KB: \`${KB_RULES}\` (${allGatesGreen ? 'mutation-gated' : 'verified'})

## Notes

- mutation_test is regex-based: equivalent mutants (log-line / consistent-key-format) may survive — exclude by reasoning via expectedSurvivorLines, do not chase.
- Written automatically by the controller (no manual assembly).
`
const REPORT_SCHEMA = { type: 'object', properties: { written: { type: 'boolean' } }, required: ['written'] }
await agent(
  `You are the REPORT-WRITE agent. Write EXACTLY this content to ${REPORT_PATH} — no changes:\n\n${reportContent}\n\nReturn { "written": true }.`,
  { label: 'report-write', phase: 'Report', schema: REPORT_SCHEMA, model: MODEL },
)
log(`Report written: ${REPORT_PATH}`)

return {
  variant: 'inc4-loop-flutter',
  target: { class: TARGET_CLASS, source: SRC },
  mineVerify: { consensusRules: mineVerifyResult.consensusRules.length },
  cover: coverResult,
  allGatesGreen,
  achievedScore,
  minimize: minimizeResult,
  kbPath: KB_RULES,
  reportPath: REPORT_PATH,
  runCostMarginal: runSpent(),
  outputTokensThisTurn: budget.spent(),
}
