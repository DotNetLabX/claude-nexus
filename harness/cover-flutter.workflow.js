// Cover Workflow — FLUTTER/DART adapter (harness Increment 4, Flutter bringup).
//
// Runnable via Workflow({ scriptPath: "<abs>/harness/cover-flutter.workflow.js" }).
//
// This is the DART sibling of cover.workflow.js. The non-scoring gate helpers (suiteGreen / noFlaky /
// noNewSkips / targetMutated / charPin / mutationRatchet) are copied VERBATIM from cover.workflow.js —
// keep them in sync. THREE things differ from the .NET cover:
//
//   1. COVER AGENT writes a Dart test (flutter_test, mocktail) instead of xUnit.v3 + FsCheck.
//   2. RUNNER AGENT runs `flutter test` ×2 + `mutation_test` (regex, pub.dev 1.8.x) instead of
//      `dotnet test` + `dotnet stryker`. The Dart `mutation_test -f xml` report lists ONLY survivors
//      (its root element is `<undetected-mutations>`); the killed/total counts live ONLY in the stdout
//      summary. So the runner returns a `mutationSummary { found, undetected, timeouts, notCovered }`
//      parsed from stdout, and the `mutants` array carries ONLY survivors — it does NOT (and cannot)
//      enumerate Killed entries, so it never fabricates them.
//   3. mutationFloor INTENTIONALLY DIVERGES from the .NET battery — do NOT "resync" it away. It scores
//      `killed = reachable − survivors` from the summary (matching the shipped adapter skill
//      mine-verify-cover-flutter, "The mutation_test run" step 3), and a survivor-count cross-check
//      (`summary.undetected === mutants.length`) HALTS the loop with `mutant-count-mismatch` rather than
//      scoring a survivor-only subset as the whole set (the method's anti-fake-green invariant,
//      mine-verify-cover SKILL.md). The .NET cover counts a full per-mutant Stryker array, so it cannot
//      reuse this Dart path. Every OTHER gate works unchanged.
//
// TRUST-ANCHOR REALITY (docs/kb/research/dart-flutter-test-trust-anchor.md, hands-on confirmed
// 2026-06-24): Dart has NO Stryker-grade tool. `dart_mutant` (AST) is a Rust binary, not pub-installable;
// `mutation_test` (regex, pub.dev) IS installable and drives `flutter test` directly — so it is the
// practical mechanical gate. Its weakness is EQUIVALENT MUTANTS: a regex mutation of a log/no-output line
// can never be killed by an output-asserting test (the BuildZplCodeUsecase smoke run: 21 mutations, 19
// killed, the 2 survivors were both `info(...)` log-line mutations). The equivalent-mutant FILTER reuses
// the proven .NET mechanism: pass the log/no-output line numbers via _args.expectedSurvivorLines and
// mutationFloor excludes them from the REACHABLE denominator — identical to the BugRatio dead-line list.
//
// SCOPE (thin pilot): the COVER + GATE half on one Dart target. Mine→Verify (rule extraction → KB) is a
// separate stack-agnostic step; this file reads a KB the same way the .NET cover does. Default target is
// BuildZplCodeUsecase (the bringup-validated pure-Dart class); retarget via args.

// meta MUST be the first statement (Workflow tool requirement) and a PURE LITERAL.
export const meta = {
  name: 'cover-flutter',
  description:
    'Harness Inc 4 Flutter adapter: Cover stage for a Dart target. Clean-room Cover agent writes a flutter_test suite; a distinct runner agent double-runs `flutter test` then `mutation_test` (-f xml) and translates its report into the Stryker-shaped mutant schema; the orchestrator gates on the SAME §6 battery (mutation floor >= 75 per-file reachable) as the .NET cover. Equivalent-mutant filter (regex log-line survivors) reuses expectedSurvivorLines. Target from args; defaults to BuildZplCodeUsecase. Three actors, reward-hacking defended.',
  phases: [
    { title: 'Setup', detail: 'orchestrator passes KB_RULES + TEST_STYLE/pattern paths to Cover agent (agent reads them; orchestrator has no fs access)' },
    { title: 'Cover', detail: 'clean-room Cover agent writes the Dart test file; red-on-current tests kept + flagged, never deleted' },
    { title: 'Run',   detail: 'distinct runner agent: double `flutter test` + `mutation_test -f xml`; parses the XML report into the mutants schema (source of truth); also Write()s nexus-side/git-ignored artifact' },
    { title: 'Gate',  detail: 'orchestrator computes the SAME 5-gate battery + mutation ratchet; reachable survivors (minus equivalent-mutant lines) feed back' },
  ],
}

// =================================================================================================
// §6 GATE BATTERY — copied VERBATIM from harness/cover.workflow.js. KEEP IN SYNC. (The Workflow runtime
// has no module/fs access, so the workflow must be self-contained — same reason the .NET cover inlines it.)
// =================================================================================================
function suiteGreen(testRuns) {
  const runs = testRuns ?? [];
  const everyGreen = runs.length >= 2 && runs.every((r) => r.failed === 0 && r.passed > 0);
  // Carry `skipped` through (FIX-B): the all-gates-green path tolerates skipped tests when baselineSkips > 0
  // (see noNewSkips), so a downstream consumer computing the TRUE suite size (e.g. loop-flutter's Minimize
  // activation gate) needs passed + failed + skipped — `passed` alone undercounts. Additive; nothing that
  // reads passed/failed breaks.
  return { pass: everyGreen, detail: { runs: runs.map((r) => ({ passed: r.passed, failed: r.failed, skipped: r.skipped ?? 0 })) } };
}

function noFlaky(testRuns) {
  const runs = testRuns ?? [];
  const key = (r) => `${r.passed}/${r.failed}/${r.skipped}`;
  const keys = runs.map(key);
  const identical = runs.length >= 2 && keys.every((k) => k === keys[0]);
  return { pass: identical, detail: { counts: keys } };
}

function mutantLine(m) {
  return m?.location?.start?.line ?? null;
}

// Void-call-removal mutator signal — tolerant of naming across tools (removeVoidCall / remove_void_call /
// cxx_remove_void_call). PURE; used only by the orchestrator pre-tag below.
const VOID_CALL_REMOVAL_RE = /remove[\W_]*void[\W_]*call/i;

// Orchestrator pre-tag (PURE — no fs/Date): the ONLY survivor tag the orchestrator may assign. A survivor is
// `equivalent-logging` iff its line is in the adapter-supplied log-line set AND its mutator removed a void
// call. Everything else is left UNTAGGED for the source-aware classify-survivors agent — the orchestrator
// NEVER defaults an unprovable survivor to REAL-gap. Returns the tag string or undefined.
function pretagEquivalentLogging(mutant, equivalentLoggingLines) {
  const line = mutantLine(mutant);
  if (equivalentLoggingLines.has(line) && VOID_CALL_REMOVAL_RE.test(mutant?.mutatorName ?? '')) {
    return 'equivalent-logging';
  }
  return undefined;
}

// mutationFloor (DART DIVERGENCE — see header §3): score from the stdout SUMMARY, not by counting the
// mutant array. mutation_test's `-f xml` report lists ONLY survivors (undetected), so `killed` is NOT
// enumerable from the array — it is derived from the summary the runner parsed. `summary` is
// { found, undetected, timeouts, notCovered }; `survivors` is the survivors-only array. Timeouts fall on
// the killed side (they sit in `found`, not in `undetected`). Matches mine-verify-cover-flutter step 3:
//   reachable = found − notCovered;  killed = reachableDenominator − reachableSurvivors.length.
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
    // Equivalent-mutant filter: a survivor on a KB-pre-documented no-output line (e.g. a log call) leaves
    // the reachable denominator entirely, NOT chased — identical to the .NET dead-line mechanism.
    if (deadLines.has(line)) {
      expectedSurvivorsExcluded++;
      continue;
    }
    const entry = { status: m.status, line, mutatorName: m.mutatorName, replacement: m.replacement };
    // Orchestrator pre-tag (pure): equivalent-logging stays in reachableSurvivors but carries its tag so
    // loop-flutter can render it and the source-aware agent can skip it (the tag-seam data-flow).
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

function noNewSkips(testRuns, baselineSkips) {
  const runs = testRuns ?? [];
  const maxSkips = runs.length ? Math.max(...runs.map((r) => r.skipped ?? 0)) : 0;
  return { pass: maxSkips <= baselineSkips, detail: { maxSkips, baselineSkips } };
}

function targetMutated(mutatedFiles, sourcePath) {
  const base = (p) => (p ?? '').split(/[\\/]/).pop();
  const target = base(sourcePath);
  const list = mutatedFiles ?? [];
  const entry = list.find((f) => base(f.file) === target);
  const count = entry?.count ?? 0;
  const detail = { target, count, mutatedFiles: list.map((f) => `${base(f.file)}:${f.count}`) };
  const strays = list.filter((f) => base(f.file) !== target && (f.count ?? 0) > 0).map((f) => `${base(f.file)}:${f.count}`);
  if (strays.length) detail.strayMutatedFiles = strays;
  if (count <= 0) detail.error = `target ${target} was NOT mutated (0 mutants in the report) — mutate scope wrong or a different file mutated; kill-rate untrustworthy (fake-green guard)`;
  return { pass: count > 0, detail };
}

const DART_DISABLE_RE = /^\/\/\s*(mutation_test|Stryker)\s+disable\b/i;

function isDiffMetaLine(line) {
  return (
    line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@') ||
    line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('new file mode') ||
    line.startsWith('deleted file mode') || line.startsWith('rename ') ||
    line.startsWith('similarity index') || line.startsWith('\\ No newline')
  );
}

function charPin(prodSourceDiff) {
  const text = prodSourceDiff ?? '';
  if (text.trim() === '') return { pass: true, detail: { changedLines: 0, disallowed: [] } };
  const disallowed = [];
  let changedLines = 0;
  for (const raw of text.split(/\r?\n/)) {
    if (isDiffMetaLine(raw)) continue;
    const isAdd = raw.startsWith('+');
    const isDel = raw.startsWith('-');
    if (!isAdd && !isDel) continue;
    changedLines++;
    if (isDel) { disallowed.push(raw); continue; }
    const content = raw.slice(1).trim();
    if (!DART_DISABLE_RE.test(content)) disallowed.push(raw);
  }
  return { pass: disallowed.length === 0, detail: { changedLines, disallowed } };
}

function mutationRatchet(priorScore, currentScore) {
  if (priorScore === null || priorScore === undefined) {
    return { pass: true, detail: `first iteration — no prior score to regress against (current ${currentScore}%)` };
  }
  if (currentScore < priorScore) {
    return { pass: false, detail: `mutation kill regressed ${priorScore}% → ${currentScore}% (harness broken — halt)` };
  }
  return { pass: true, detail: `kill held/improved ${priorScore}% → ${currentScore}%` };
}

// =================================================================================================
// TARGET + CONTRACT PATHS (Dart defaults — retarget via args; same arg names as the .NET cover)
// =================================================================================================
// Workflow-tool args arrive JSON-STRINGIFIED; workflow() composition args arrive as an object. Parse the
// string form so _args.X resolves in both cases (see loop.workflow.js for the why).
const _argsRaw = (typeof args !== 'undefined' && args) ? args : {}
let _args = {}
try { _args = typeof _argsRaw === 'string' ? JSON.parse(_argsRaw) : _argsRaw } catch { _args = {} }

const APP = _args.appDir ?? 'D:\\omnishelf\\omnishelf_flutter_app'
const MODEL = _args.model ?? 'sonnet'
const TARGET_CLASS = _args.targetClass ?? 'BuildZplCodeUsecase'
const SRC = _args.src ?? `${APP}\\lib\\domain\\usecases\\zebra_printer\\build_zpl_code_usecase.dart`
// The verified rules — path passed to the Cover agent (the agent reads it; golden set NEVER passed).
const KB_RULES = _args.kbRules ?? `${APP}\\docs\\kb\\build-zpl-code.md`
// Test-style contract: point the Cover agent at the project's existing test conventions + an in-repo
// example so the generated test COMPILES and matches house style (mocktail, flutter_test, fixtures).
const TEST_STYLE = _args.testStyle ?? `${APP}\\test\\flutter_test_config.dart`
// The Cover agent's SINGLE write target — a HARNESS-OWNED test file, separate from any hand-written test
// (so the pilot never clobbers an existing benchmark suite). Override via _args.coverTest.
const COVER_TEST = _args.coverTest ?? `${APP}\\test\\domain\\usecases\\zebra_printer\\${snakeCase(TARGET_CLASS)}_harness_test.dart`
// The directory `flutter test` / `mutation_test` execute from (the Flutter app root).
const TEST_PROJECT_DIR = _args.testProjectDir ?? APP
// The mutation_test glob/file — the production file to mutate, app-root-relative (forward slashes for the XML).
const MUTATE_FILE = _args.mutateFile ?? toAppRel(SRC, APP)
// Pattern-to-follow block: an in-repo test the Cover agent mirrors for API shape (mocktail/flutter_test).
const PATTERN_BLOCK = _args.patternTests ?? `PATTERN TO FOLLOW (in-repo, same project + test conventions):
  • ${APP}\\test\\domain\\usecases\\zebra_printer\\build_zpl_code_usecase_test.dart
    (flutter_test \`test()\`/\`group()\`, one test per rule boundary; mocktail for any faked collaborator)
  • ${APP}\\test\\mocks.dart  (central mocktail mocks for every repo/usecase — reuse, do not re-declare)`

// Runner results land nexus-side + git-ignored. NEVER in the consuming app tree.
const RUNS_DIR = _args.runsDir ?? 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'
const RUNNER_RESULT = _args.runnerResult ?? `${RUNS_DIR}\\cover-flutter-${TARGET_CLASS.toLowerCase()}-run.json`

const MUTATION_FLOOR = _args.mutationFloor ?? 75 // per-file REACHABLE kill floor; raise via args to ratchet toward 100
const MAX_ITERATIONS = _args.maxIterations ?? 5
const BASELINE_SKIPS = _args.baselineSkips ?? 0
// Equivalent-mutant filter: line numbers of no-output statements (log calls etc.) whose mutations a
// behaviour-asserting test can never kill. Default [] (no known equivalents); pass the log lines per target
// (BuildZplCodeUsecase: the two `info(...)` calls). Excluded from the REACHABLE denominator, NOT chased.
const EXPECTED_SURVIVOR_LINES = _args.expectedSurvivorLines ?? []
// Pre-tag signal (Q1) — line numbers of log/no-output CALLS the adapter surfaces (from the mined KB or a
// project `docs/conventions/mutation-testing.md`). A survivor on one of these lines whose mutator removed a
// void call is pre-tagged `equivalent-logging` but STAYS in reachableSurvivors (so the report can suggest
// adding it to expectedSurvivorLines). DISTINCT from EXPECTED_SURVIVOR_LINES (which drops lines from the
// denominator): an excluded line never reaches the tag seam. Default [] (orchestrator pre-tags nothing).
const EQUIVALENT_LOGGING_LINES = _args.equivalentLoggingLines ?? []

// snake_case helper for the default test filename (no Date/Math.random — pure string op, resume-safe).
function snakeCase(name) {
  return String(name).replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').toLowerCase()
}
// Make an app-root-relative POSIX path for the mutation_test config (it runs from the app root).
function toAppRel(abs, appRoot) {
  const a = String(abs).replace(/\//g, '\\')
  const root = String(appRoot).replace(/\//g, '\\').replace(/\\+$/, '')
  const rel = a.startsWith(root) ? a.slice(root.length).replace(/^\\+/, '') : a
  return rel.replace(/\\/g, '/')
}

// =================================================================================================
// RUNNER RESULT SCHEMA — IDENTICAL to the .NET cover (so the gate battery is reused unchanged).
// =================================================================================================
const RUNNER_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    testRuns: {
      type: 'array', minItems: 2,
      items: {
        type: 'object',
        properties: { passed: { type: 'integer' }, failed: { type: 'integer' }, skipped: { type: 'integer' } },
        required: ['passed', 'failed', 'skipped'],
      },
    },
    // Absolute path to the mutation_test XML report (returned for the record; orchestrator does NOT read it).
    reportPath: { type: 'string' },
    // The stdout SUMMARY counts (authoritative — the XML lists only survivors). The gate scores from these:
    //   found = total mutations; undetected = survivors; timeouts = killed-by-timeout; notCovered = no-coverage.
    mutationSummary: {
      type: 'object',
      properties: {
        found: { type: 'integer' },
        undetected: { type: 'integer' },
        timeouts: { type: 'integer' },
        notCovered: { type: 'integer' },
      },
      required: ['found', 'undetected', 'timeouts', 'notCovered'],
    },
    // The SURVIVORS-ONLY array for the TARGET file, from mutation_test's `<undetected-mutations>` XML
    //   (undetected→"Survived"). It carries ONLY survivors — never synthesized Killed entries; the gate
    //   cross-checks `mutationSummary.undetected === mutants.length` and derives killed from the summary.
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
    // Per-file mutation counts — EVERY file mutation_test mutated. Feeds target_mutated (anti-fake-green).
    mutatedFiles: {
      type: 'array',
      items: { type: 'object', properties: { file: { type: 'string' }, count: { type: 'integer' } }, required: ['file', 'count'] },
    },
    redOnCurrent: {
      type: 'array',
      items: { type: 'object', properties: { test: { type: 'string' }, note: { type: 'string' } }, required: ['test'] },
    },
  },
  required: ['testRuns', 'reportPath', 'mutationSummary', 'mutants', 'mutatedFiles'],
}

// =================================================================================================
// PHASE: Setup
// =================================================================================================
phase('Setup')
log(`Setup (Flutter): Cover agent gets KB_RULES=${KB_RULES}, TEST_STYLE=${TEST_STYLE}, pattern in-repo. Mutate file: ${MUTATE_FILE}.`)

function coverPrompt(survivingMutants) {
  const survBlock = survivingMutants.length
    ? `SURVIVING MUTANTS to target this iteration (each is a REACHABLE mutation no current test killed — write a test that fails on the mutated behaviour):\n${survivingMutants
        .map((m) => `- ${m.mutatorName} at line ${m.line}: replacement \`${m.replacement}\` (status ${m.status})`)
        .join('\n')}`
    : 'FIRST ITERATION — no surviving-mutant feedback yet. Write the full suite covering every verified rule boundary below.'

  return `You are the COVER agent. Write mutation-gated Dart tests for ONE production class, against the VERIFIED rules below.

YOUR ONLY WRITE TARGET (write ONLY this file — touching anything else is a hard violation):
  • ${COVER_TEST}   — flutter_test suite, one \`test()\` per rule boundary, grouped with \`group()\`

FORBIDDEN — you have NO write access to any of these (a separate actor owns them):
  • ${SRC} (the production class — NEVER edit it; not even a comment)
  • any mutation_test config, any gate infrastructure, any docs/kb/** file, test/mocks.dart (REUSE it, do not edit)

NON-NEGOTIABLE RULES:
  • A test that FAILS on the CURRENT production code is KEPT and FLAGGED with a \`// CANDIDATE BUG:\` comment —
    NEVER deleted, and you NEVER change production code to make it pass.
  • Coverage is NOT the goal — KILLING MUTANTS is. Pin exact boundary cases: every \`&&\`/\`||\`, every null
    guard, every \`==\`/\`!=\`/\`<=\`/\`>=\`, and the exact string-replacement / arithmetic semantics. Assert on the
    RETURNED value (and any observable collaborator call), so a regex mutation of the logic flips a test RED.
  • Do NOT assert on log output — log calls are no-output side effects; asserting them over-specifies and the
    harness's equivalent-mutant filter already excludes log-line mutations.
  • Deliverable = the file write. Write() the file; do not summarize it in your final message.

STEP 1 — READ THE PRODUCTION SOURCE (the SUT):
  ${SRC}

STEP 2 — READ THE VERIFIED RULES (the consuming project's KB — GROUND TRUTH, already Mine→Verify'd):
  ${KB_RULES}

STEP 3 — READ THE TEST-STYLE / PROJECT CONVENTIONS (so the test COMPILES and matches house style):
  ${TEST_STYLE}

${PATTERN_BLOCK}

${survBlock}

Write the test file now.`
}

const runnerPrompt = `You are the RUNNER agent. You execute the Flutter/Dart toolchain — you do NOT write tests and you do NOT edit production code.

STEPS (run from the app root ${TEST_PROJECT_DIR}):
  1. Run \`flutter test ${COVER_TEST}\` TWICE (two independent invocations — the double-run for suite_green + no_flaky).
     Record { passed, failed, skipped } for EACH run (parse flutter test's summary line, e.g. "+9: All tests passed!").
  2. Run mutation testing on ONLY the target file with a machine-readable report:
     a. Write a mutation_test config XML (call it mutation_test_harness.xml in the app root) with:
          <mutations version="1.0">
            <files><file>${MUTATE_FILE}</file></files>
            <commands><command group="test" expected-return="0" working-directory="." timeout="180">flutter test ${COVER_TEST}</command></commands>
          </mutations>
        (builtin rules are used by default — do NOT pass --rules.)
     b. Run: \`dart pub global run mutation_test -f xml -o mutation_test_out mutation_test_harness.xml\`
        It writes an XML report under mutation_test_out/. The \`expected-return=0\` means: test passes (exit 0)
        → mutation UNDETECTED (survived); test fails → mutation DETECTED (killed).
  3. Parse the stdout SUMMARY — it is AUTHORITATIVE for the counts (the XML lists ONLY survivors). Read:
          "Found {found} mutations"     → found
          "Undetected Mutations: {n}"   → undetected
          "Timeouts: {n}"               → timeouts
          "Not covered by tests: {n}"   → notCovered
     Return these as mutationSummary: { found, undetected, timeouts, notCovered }.
  4. Read the XML report under mutation_test_out/ to ENUMERATE SURVIVORS ONLY (never to count kills — its
     root element \`<undetected-mutations>\` contains only the surviving mutations). For each undetected
     mutation build ONE survivor entry: { "status": "Survived", "location": { "start": { "line": N } },
       "mutatorName": <the rule id / mutation kind, e.g. "logical.and", "replaceFirst", or "removeVoidCall">,
       "replacement": <mutated text if available, else ""> }.
     The \`mutants\` array carries ONLY these survivors. Do NOT synthesize "Killed" entries — the XML cannot
     supply them, and the orchestrator derives killed = reachable − survivors from the summary. The number of
     survivor entries MUST equal mutationSummary.undetected (the orchestrator HALTS on mismatch — never pad
     or drop entries to make it match; report exactly what the report lists).
  5. Build \`mutatedFiles\`: for EVERY file mutation_test mutated, one { "file": "<path>", "count": <int> }.
     (mutation_test mutates exactly the <file> list — normally just the target.)
  6. Note any test that FAILS on the current production code (red-on-current) — list it; do NOT delete it.
  7. Clean up: delete mutation_test_harness.xml and the mutation_test_out/ directory from the app tree when done.

ALSO WRITE YOUR RESULTS HERE for the record (nexus-side, git-ignored — NEVER into the consuming app tree):
  ${RUNNER_RESULT}

as JSON: { "testRuns": [{passed,failed,skipped},{passed,failed,skipped}], "reportPath": "<abs path to the xml report>",
           "mutationSummary": { "found": N, "undetected": N, "timeouts": N, "notCovered": N },
           "mutants": [<SURVIVORS-ONLY array for the target file>],
           "mutatedFiles": [{ "file": "<path>", "count": <int> }],
           "redOnCurrent": [{ "test": "...", "note": "..." }] }

IMPORTANT: return the same data in your schema'd response AND in the Write() — the orchestrator uses the
schema return directly and does NOT read files. NEVER report mutations from a file other than the target ${SRC}.`

// =================================================================================================
// THE BOUNDED COVER LOOP (orchestrator-driven) — identical control flow to the .NET cover.
// =================================================================================================
let survivingMutants = []
let lastScore = null
let result = null

for (let iter = 1; iter <= MAX_ITERATIONS; iter++) {
  phase('Cover')
  log(`Cover iteration ${iter}/${MAX_ITERATIONS}: ${survivingMutants.length} surviving mutant(s) fed back.`)
  await agent(coverPrompt(survivingMutants), { label: `cover:iter-${iter}`, phase: 'Cover', model: MODEL })

  phase('Run')
  const runRaw = await agent(runnerPrompt, { label: `runner:iter-${iter}`, phase: 'Run', schema: RUNNER_RESULT_SCHEMA, model: MODEL })
  if (!runRaw) throw new Error(`Cover iteration ${iter}: runner returned no result`)

  phase('Gate')
  // Anti-fake-green survivor-count cross-check (DART DIVERGENCE — see header §3): the stdout summary's
  // undetected count MUST equal the survivors-only XML array length. A mismatch means the gate would score
  // on an inconsistent mutant set (a survivor-only XML read as the whole set, or padded/dropped entries) —
  // HALT like the ratchet, never score on it. (method invariant: mine-verify-cover SKILL.md.)
  const summary = runRaw.mutationSummary
  const survivorCount = (runRaw.mutants ?? []).length
  if (!summary || summary.undetected !== survivorCount) {
    log(`HALT (mutant-count-mismatch): summary.undetected=${summary?.undetected ?? 'n/a'} !== survivors=${survivorCount} — the survivor array does not match the summary; scoring on an inconsistent mutant set is forbidden.`)
    result = { stopped: 'mutant-count-mismatch', iter, mutationSummary: summary ?? null, survivorCount, runRaw }
    break
  }

  const prodSourceDiff = readProdSourceDiffPlaceholder()
  const gates = {
    target_mutated: targetMutated(runRaw.mutatedFiles, SRC),
    suite_green: suiteGreen(runRaw.testRuns),
    no_flaky: noFlaky(runRaw.testRuns),
    mutation_floor: mutationFloor(summary, runRaw.mutants, { floor: MUTATION_FLOOR, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES, equivalentLoggingLines: EQUIVALENT_LOGGING_LINES }),
    no_new_skips: noNewSkips(runRaw.testRuns, BASELINE_SKIPS),
    char_pin: charPin(prodSourceDiff),
  }
  const score = gates.mutation_floor.detail.scorePct

  const ratchet = mutationRatchet(lastScore, score)
  if (!ratchet.pass) {
    log(`HALT (ratchet): ${ratchet.detail} — a kill-rate regression means the harness is broken. Not continuing.`)
    result = { stopped: 'ratchet-regression', iter, gates, ratchet, runRaw, achievedScore: score }
    break
  }
  lastScore = score

  const allGreen = Object.values(gates).every((g) => g.pass)
  log(
    `Gate iter ${iter}: target_mutated=${gates.target_mutated.pass} suite_green=${gates.suite_green.pass} ` +
      `no_flaky=${gates.no_flaky.pass} mutation_floor=${gates.mutation_floor.pass} (${score}% reachable, floor ${MUTATION_FLOOR}) ` +
      `no_new_skips=${gates.no_new_skips.pass} char_pin=${gates.char_pin.pass}`,
  )

  if (allGreen) {
    result = { stopped: 'all-gates-green', iter, gates, achievedScore: score, redOnCurrent: runRaw.redOnCurrent ?? [] }
    break
  }

  // F1: only UN-PRE-TAGGED survivors drive the next Cover iteration. A pre-tagged `equivalent-logging`
  // survivor is an orchestrator-recognized equivalent mutant — re-feeding it makes the Cover agent chase a
  // mutant no behaviour-asserting test can kill. The DENOMINATOR is unchanged (the pre-tagged survivor stays
  // SCORED in mutationFloor — the two-tier equivalentLoggingLines-suggestion vs expectedSurvivorLines-confirmed
  // design); only the re-feed is filtered. The full residual list (pre-tags included) is kept for the
  // cap-reached report below + the loop-flutter Report-stage classifier.
  const reachableSurvivors = gates.mutation_floor.detail.reachableSurvivors
  survivingMutants = reachableSurvivors.filter((s) => !s.tag)

  if (iter === MAX_ITERATIONS) {
    result = { stopped: 'cap-reached', iter, gates, achievedScore: score, reachableSurvivors }
  }
}

log(`Cover (Flutter) done: ${result.stopped} after ${result.iter} iteration(s); achieved ${result.achievedScore}% reachable kill.`)
return {
  variant: 'inc4-cover-flutter',
  target: { class: TARGET_CLASS, source: SRC },
  ...result,
  outputTokensThisTurn: budget.spent(),
}

// =================================================================================================
// Orchestrator-side helper — char_pin needs the prod-source diff PRE-SCOPED (orchestrator has git; the
// helper stays pure). At live-run time the operator supplies `git diff -- <prod path>`; empty diff =
// no prod change = char_pin passes. This placeholder returns the empty diff.
// =================================================================================================
function readProdSourceDiffPlaceholder() {
  return ''
}
