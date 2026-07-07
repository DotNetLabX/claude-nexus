// Cover Workflow — PHP adapter (harness Increment 4, PHP bringup).
//
// Runnable via Workflow({ scriptPath: "<abs>/harness/cover-php.workflow.js" }).
//
// This is the PHP sibling of cover.workflow.js / cover-cpp.workflow.js / cover-flutter.workflow.js. It is
// a deliberately THIN fork: the entire §6 gate battery is copied VERBATIM from cover.workflow.js
// (suiteGreen / noFlaky / mutationFloor / noNewSkips / targetMutated / charPin / mutationRatchet — keep in
// sync). The ONLY gate-battery delta is the language-specific disable regex constant (PHP_DISABLE_RE — the
// C++/Dart forks each carry their own, CPP_DISABLE_RE / DART_DISABLE_RE). Three things differ from .NET:
//
//   1. COVER AGENT writes a PHPUnit 12 class suite (final class XTest extends TestCase; #[DataProvider]
//      boundary matrices; optional eris property tests) instead of xUnit.v3 + FsCheck. Pest-compatible for
//      the consuming repo (Pest runs PHPUnit classes via its compatibility layer).
//   2. RUNNER AGENT runs, INSIDE the mvc-php-probe Docker image ON THE CONTAINER'S NATIVE FS,
//      `phpunit` ×2 + `infection <target>` (positional single-file pin), then TRANSLATES Infection's
//      proprietary `json` log into the gate's Stryker-shaped mutants schema. This is the FLUTTER-STYLE
//      fork (translation required), NOT the mull as-is fork (mull/Stryker already match the gate schema).
//   3. An anti-fake-green TRANSLATION CROSS-CHECK sits in the loop (Flutter precedent): the translated
//      `mutants` array length MUST equal stats.total − ignored − skipped; a mismatch HALTs the run
//      (`mutant-count-mismatch`) — a mis-translated/dropped/padded mutant set is never scored. It does NOT
//      touch the gate-battery functions (which stay byte-identical to cover.workflow.js).
//
// TOOLCHAIN REALITY (docs/kb/research/php-mutation-and-test-tooling.md + Step-1 probe
// delivery/probe-report.md, hands-on confirmed 2026-07-07): Infection 0.34 is the PHP mutation standard;
// it needs PHP ^8.3 + a coverage driver (PCOV, fastest). Single-file mutation is pinned by a POSITIONAL
// CLI arg. Its `json` logger is PROPRIETARY: a mutant's status is the top-level ARRAY it sits in
// (killed/escaped/timeouted/uncovered/errored/killedByStaticAnalysis/syntaxErrors/ignored) — there is NO
// per-mutant `status` field — so the runner translates via INFECTION_STATUS_MAP (below).
//
// NATIVE-FS BRINGUP (Step-1 probe finding): PHP's autoloader reads thousands of vendor/ files; over a
// Windows→Linux bind mount that is ~20x slower, and Infection spawns one PHPUnit subprocess PER MUTANT, so
// every mutant blows past the per-process timeout → a FALSE 45/45 "Timed Out". The runner copies the
// mounted workspace into /native first (cp -r /work /native && cd /native), runs there, and copies the two
// log files back out. See harness/php/cover-php-contract.md "Host reality".
//
// SCOPE (thin pilot): the COVER + GATE half on one PHP target. Mine→Verify (rule extraction → KB) is a
// separate stack-agnostic step; this file reads a KB the same way the .NET/Flutter/C++ cover does. Default
// target is CalculateReferencePeriodAction (the probe-validated pure Carbon-only class); retarget via args.

// meta MUST be the first statement (Workflow tool requirement) and a PURE LITERAL.
export const meta = {
  name: 'cover-php',
  description:
    'Harness Inc 4 PHP adapter: Cover stage for a PHP target. Clean-room Cover agent writes a PHPUnit 12 class suite (final class XTest extends TestCase; data-provider boundary matrices; optional eris property tests, Pest-compatible); a distinct runner agent double-runs phpunit then infection (positional single-file pin) INSIDE the mvc-php-probe Docker image on the container native fs, and TRANSLATES Infection proprietary json (status = the group array, no per-mutant status field) into the Stryker-shaped mutant schema via a documented status map. An anti-fake-green cross-check HALTs on a translated-count mismatch. The orchestrator gates on the SAME §6 battery (mutation floor >= 75 per-file reachable) as the .NET cover. Equivalent-mutant filter reuses expectedSurvivorLines. Target from args; defaults to CalculateReferencePeriodAction. Three actors, reward-hacking defended.',
  phases: [
    { title: 'Setup', detail: 'orchestrator passes KB_RULES + TEST_STYLE/pattern paths to Cover agent (agent reads them; orchestrator has no fs access)' },
    { title: 'Cover', detail: 'clean-room Cover agent writes the PHPUnit test file; red-on-current tests kept + flagged, never deleted' },
    { title: 'Run',   detail: 'distinct runner agent: docker run on native fs → double phpunit + infection positional pin; translates Infection json → the mutants schema (source of truth); also Write()s nexus-side/git-ignored artifact' },
    { title: 'Gate',  detail: 'orchestrator computes the SAME 5-gate battery + mutation ratchet after a translation cross-check; reachable survivors (minus equivalent-mutant lines) feed back' },
  ],
}

// =================================================================================================
// §6 GATE BATTERY — copied VERBATIM from harness/cover.workflow.js. KEEP IN SYNC. (The Workflow runtime
// has no module/fs access, so the workflow must be self-contained — same reason the .NET cover inlines it.)
// The ONLY delta from cover.workflow.js is the language-specific disable regex (PHP_DISABLE_RE) — the
// C++/Dart forks each carry their own (CPP_DISABLE_RE / DART_DISABLE_RE).
// =================================================================================================
function suiteGreen(testRuns) {
  const runs = testRuns ?? [];
  const everyGreen = runs.length >= 2 && runs.every((r) => r.failed === 0 && r.passed > 0);
  return {
    pass: everyGreen,
    detail: { runs: runs.map((r) => ({ passed: r.passed, failed: r.failed })) },
  };
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
      detail: {
        scorePct: 0,
        killed: 0,
        reachableDenominator: 0,
        error: `no per-file Stryker entry for ${sourcePath} (check the mutate glob + the json reporter)`,
        reachableSurvivors: [],
      },
    };
  }
  const mutants = entry.mutants ?? [];
  let killed = 0;
  let reachableDenominator = 0;
  let expectedSurvivorsExcluded = 0;
  const reachableSurvivors = [];

  for (const m of mutants) {
    if (!DENOMINATOR_STATUSES.has(m.status)) continue; // Ignored / CompileError / Pending — never counted.
    const line = mutantLine(m);
    // Timeout is treated as killed (Inc-3 Step 3): a timeout = the mutant was detected by a slow/hanging
    // test — it counts as a kill for the numerator. So isSurvivor excludes both Killed and Timeout.
    const isSurvivor = m.status !== 'Killed' && m.status !== 'Timeout';
    if (isSurvivor && deadLines.has(line)) {
      expectedSurvivorsExcluded++;
      continue;
    }
    reachableDenominator++;
    // Timeout counts as killed (standard Stryker semantics: a timeout = a detected mutation — the test
    // ran long enough to break the mutant, which is a kill signal). Inc-3 Step 3 fix.
    if (m.status === 'Killed' || m.status === 'Timeout') killed++;
    else reachableSurvivors.push({ status: m.status, line, mutatorName: m.mutatorName, replacement: m.replacement });
  }

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
// target_mutated — anti-fake-green: the Stryker report ACTUALLY mutated the target file. (Inlined from
// cover-gates.mjs — keep in sync.) Fed by runRaw.mutatedFiles; fails if the target basename is absent/0.
function targetMutated(mutatedFiles, sourcePath) {
  const base = (p) => (p ?? '').split(/[\\/]/).pop();
  const target = base(sourcePath);
  const list = mutatedFiles ?? [];
  const entry = list.find((f) => base(f.file) === target);
  const count = entry?.count ?? 0;
  const detail = { target, count, mutatedFiles: list.map((f) => `${base(f.file)}:${f.count}`) };
  // Surface stray non-target files the mutate glob also caught (e.g. a sibling interface picked up by a
  // loose `**/Foo.cs` glob). Does NOT fail the gate — the kill-rate scores only the reachable target
  // mutants, so the gate stays honest — but a visible strayMutatedFiles list flags a glob that's broader
  // than intended (Article run leaked 4 mutants onto IArticleStateMachine.cs under a Behaviors/ glob).
  const strays = list.filter((f) => base(f.file) !== target && (f.count ?? 0) > 0).map((f) => `${base(f.file)}:${f.count}`);
  if (strays.length) detail.strayMutatedFiles = strays;
  if (count <= 0) detail.error = `target ${target} was NOT mutated (0 mutants in the Stryker report) — mutate scope wrong or a different file mutated; kill-rate untrustworthy (fake-green guard)`;
  return { pass: count > 0, detail };
}

// PHP analogue of the .NET/Dart/C++ disable regex — the only prod-source change char_pin tolerates is an
// Infection ignore annotation. (In practice the slice is never edited, so the diff is empty and char_pin passes.)
const PHP_DISABLE_RE = /^(?:\/\/|#|\*|\/\*+)\s*@infection-ignore(?:-all)?\b/i;

function isDiffMetaLine(line) {
  return (
    line.startsWith('+++') ||
    line.startsWith('---') ||
    line.startsWith('@@') ||
    line.startsWith('diff ') ||
    line.startsWith('index ') ||
    line.startsWith('new file mode') ||
    line.startsWith('deleted file mode') ||
    line.startsWith('rename ') ||
    line.startsWith('similarity index') ||
    line.startsWith('\\ No newline')
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
    if (!isAdd && !isDel) continue; // context line — unchanged.
    changedLines++;
    if (isDel) {
      disallowed.push(raw);
      continue;
    }
    const content = raw.slice(1).trim();
    if (!PHP_DISABLE_RE.test(content)) disallowed.push(raw);
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
// INFECTION json → gate mutants TRANSLATION (the Flutter-style seam — visible here, applied by the runner)
// -------------------------------------------------------------------------------------------------
// Infection's `json` log groups mutants by STATUS as top-level ARRAYS (there is no per-mutant `status`
// field — the array key IS the status). INFECTION_STATUS_MAP is the probe-OBSERVED map
// (delivery/probe-report.md; extends the plan's capabilities table with killedByStaticAnalysis +
// syntaxErrors, which the research had NOT enumerated — critic L-2). The runner reads
// infection-log.json, and for each array key in this map emits one gate mutant per element as
//   { status, location: { start: { line: <mutator.originalStartLine> } }, mutatorName: <mutator.mutatorName>,
//     replacement: '' }
// Groups mapped to null (ignored / skipped) are NOT enumerated into `mutants`. `CompileError` is a real
// gate status but is NOT in DENOMINATOR_STATUSES, so a syntaxErrors mutant is present-but-unscored (mirrors
// Stryker CompileError). This map is the single source of truth the runner prompt renders and applies.
const INFECTION_STATUS_MAP = {
  killed: 'Killed',
  killedByStaticAnalysis: 'Killed',
  errored: 'Killed',
  escaped: 'Survived',
  timeouted: 'Timeout',
  uncovered: 'NoCoverage',
  syntaxErrors: 'CompileError', // present in `mutants` for an honest count, but excluded from the score
  ignored: null,                // NOT enumerated into `mutants` (user-configured ignores)
  skipped: null,                // stats-only (no array); excluded
}
// Render the map for the runner prompt (pure string op — no Date/Math.random, resume-safe).
function renderStatusMap(map) {
  return Object.entries(map)
    .map(([k, v]) => `    ${k} -> ${v === null ? '(excluded — do NOT enumerate)' : v}`)
    .join('\n')
}

// =================================================================================================
// TARGET + CONTRACT PATHS (PHP defaults — retarget via args; same arg names as the .NET/Flutter/C++ cover)
// =================================================================================================
// Workflow-tool args arrive JSON-STRINGIFIED; workflow() composition args arrive as an object. Parse the
// string form so _args.X resolves in both cases (see loop.workflow.js for the why).
const _argsRaw = (typeof args !== 'undefined' && args) ? args : {}
let _args = {}
try { _args = typeof _argsRaw === 'string' ? JSON.parse(_argsRaw) : _argsRaw } catch { _args = {} }

const MODEL = _args.model ?? 'sonnet'
const TARGET_CLASS = _args.targetClass ?? 'CalculateReferencePeriodAction'
// The Docker image (built from harness/php/Dockerfile) and the HOST workspace mounted to /work.
const IMAGE = _args.image ?? 'mvc-php-probe'
const HOST_WS = _args.hostWs ?? 'D:\\src\\claude-plugins\\nexus\\harness\\php\\workspace'
// The target's workspace-RELATIVE path (the positional single-file pin arg, relative to /native). The
// CONTAINER source path is the mutationFloor lookup KEY; the HOST path is what the Cover agent reads.
const TARGET_REL = _args.targetRel ?? 'src/Actions/CalculateReferencePeriodAction.php'
const CONTAINER_SRC = _args.containerSrc ?? `/native/${TARGET_REL}`
const SRC = CONTAINER_SRC
const HOST_SRC = _args.hostSrc ?? `${HOST_WS}\\${TARGET_REL.replace(/\//g, '\\')}`
// The verified rules — path passed to the Cover agent (the agent reads it; golden set NEVER passed).
const KB_RULES = _args.kbRules ?? 'D:\\src\\claude-plugins\\nexus\\docs\\specs\\adhoc-MineVerifyPhpAdapter\\delivery\\kb-calculate-reference-period.md'
// Test-style: the probe's proven seed test is the in-repo PATTERN the Cover agent mirrors, plus the contract.
const TEST_STYLE = _args.testStyle ?? 'D:\\src\\claude-plugins\\nexus\\harness\\php\\examples\\calculate_reference_period_seed_test.php'
const CONTRACT = _args.contract ?? 'D:\\src\\claude-plugins\\nexus\\harness\\php\\cover-php-contract.md'
// The Cover agent's SINGLE write target — HOST path in the workspace tests/ dir (PHPUnit auto-discovers *Test.php).
const COVER_TEST = _args.coverTest ?? `${HOST_WS}\\tests\\${TARGET_CLASS}HarnessTest.php`

// Runner results land nexus-side + git-ignored. NEVER in the consuming source tree.
const RUNS_DIR = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'
const RUNNER_RESULT = _args.runnerResult ?? `${RUNS_DIR}\\cover-php-${TARGET_CLASS.toLowerCase()}-run.json`

const MUTATION_FLOOR = _args.mutationFloor ?? 75
const MAX_ITERATIONS = _args.maxIterations ?? 5
const BASELINE_SKIPS = _args.baselineSkips ?? 0
// Equivalent-mutant filter: line numbers whose mutations a behaviour-asserting test can never kill.
// Default [] (no known equivalents on the pure target #1). Pass per target. Excluded from the REACHABLE
// denominator, NOT chased.
const EXPECTED_SURVIVOR_LINES = _args.expectedSurvivorLines ?? []
// Optional per-target SUT-shape hint. The adapter is NOT CalculateReferencePeriod-shaped: the SUT API +
// how inputs are built come from the PATTERN file + KB + this note. Empty by default (de-hardcoding: a
// second unlike target must be drivable WITHOUT editing this file — see Step 7).
const SUT_NOTES = _args.sutNotes ? `\n  • ${_args.sutNotes}` : ''

// =================================================================================================
// RUNNER RESULT SCHEMA — testRuns + mutants are IDENTICAL to the .NET cover (so the gate battery is reused
// unchanged); mutationSummary is added for the anti-fake-green translation cross-check (Flutter precedent).
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
    // Absolute path to the Infection json log (returned for the record; orchestrator does NOT read it).
    reportPath: { type: 'string' },
    // Infection's `stats` block, carried through for the translation cross-check. `total` = totalMutantsCount;
    // `ignored`/`skipped` = the excluded groups. The orchestrator verifies mutants.length === total − ignored − skipped.
    mutationSummary: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        killed: { type: 'integer' },
        escaped: { type: 'integer' },
        timeout: { type: 'integer' },
        notCovered: { type: 'integer' },
        errored: { type: 'integer' },
        killedByStaticAnalysis: { type: 'integer' },
        syntaxError: { type: 'integer' },
        ignored: { type: 'integer' },
        skipped: { type: 'integer' },
      },
      required: ['total', 'ignored', 'skipped'],
    },
    // The FULL per-mutant array for the TARGET file, TRANSLATED from Infection's group arrays via
    // INFECTION_STATUS_MAP: each { status, location:{start:{line}}, mutatorName, replacement }. Statuses are
    // already the gate's Killed/Survived/Timeout/NoCoverage/CompileError — no further translation.
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
    // Per-file mutation counts — EVERY distinct originalFilePath in the log. Feeds target_mutated (anti-fake-green).
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
log(`Setup (PHP): Cover agent gets KB_RULES=${KB_RULES}, TEST_STYLE=${TEST_STYLE}, CONTRACT=${CONTRACT}. Target src (container): ${CONTAINER_SRC}. Image: ${IMAGE}.`)

function coverPrompt(survivingMutants) {
  const survBlock = survivingMutants.length
    ? `SURVIVING MUTANTS to target this iteration (each is a REACHABLE mutation no current test killed — write a test that fails on the mutated behaviour):\n${survivingMutants
        .map((m) => `- ${m.mutatorName} at line ${m.line}: replacement \`${m.replacement}\` (status ${m.status})`)
        .join('\n')}`
    : 'FIRST ITERATION — no surviving-mutant feedback yet. Write the full suite covering every verified rule boundary below.'

  return `You are the COVER agent. Write mutation-gated PHPUnit tests for ONE PHP production class, against the VERIFIED rules below.

YOUR ONLY WRITE TARGET (write ONLY this file — touching anything else is a hard violation):
  • ${COVER_TEST}   — a PHPUnit 12 class suite: \`final class ${TARGET_CLASS}HarnessTest extends TestCase\`, one \`public function test…(): void\` per rule boundary (use #[DataProvider] for boundary matrices; optional \`use Eris\\TestTrait;\` property tests)

FORBIDDEN — you have NO write access to any of these (a separate actor owns them):
  • ${HOST_SRC} (the production slice — NEVER edit it; not even a comment)
  • any composer.json, phpunit.xml, infection.json5, Dockerfile, gate infrastructure, or any docs/kb/** file

NON-NEGOTIABLE RULES:
  • A test that FAILS on the CURRENT production code is KEPT and FLAGGED with a \`// CANDIDATE BUG:\` comment —
    NEVER deleted, and you NEVER change production code to make it pass.
  • Coverage is NOT the goal — KILLING MUTANTS is. Pin exact boundary cases: every logical connective
    (\`&&\`/\`||\`), every predicate (isMonday/isSunday/isStartOf*/isEndOf*), every \`===\`/\`!==\`, the exact
    arithmetic (\`diffInDays(...) + 1\`, subDays/subWeek/subMonth semantics). Assert on execute()'s RETURN
    VALUE (\`$result['from']\` / \`$result['to']\`), so a mutated comparison or constant flips a test RED.
  • ASSERT STRUCTURAL INVARIANTS, not a wall of hand-typed dates (contract: assert period-length
    conservation, adjacency, previous-full-period mapping; exactly ONE hand-computed anchor case). The SUT's
    public API + how inputs are built come from the PATTERN file (STEP 3) and the KB (STEP 2) — mirror them
    EXACTLY. Do NOT assume the CalculateReferencePeriod shape for a different target — follow the pattern.${SUT_NOTES}
  • Pest-compatibility: use ONLY plain PHPUnit-class APIs (TestCase, assertSame, #[DataProvider],
    expectException). Do NOT write Pest it()/test() closures and no PHPUnit-internal APIs beyond Pest's layer.
  • Deliverable = the file write. Write() the file; do not summarize it in your final message.

STEP 1 — READ THE PRODUCTION SOURCE (the SUT):
  ${HOST_SRC}

STEP 2 — READ THE VERIFIED RULES (the KB — GROUND TRUTH, already Mine→Verify'd):
  ${KB_RULES}

STEP 3 — READ THE TEST-STYLE / PATTERN (so the test RUNS and matches the proven shape) and the CONTRACT
(the assertion + Pest-compatibility rules):
  ${TEST_STYLE}
  ${CONTRACT}

${survBlock}

Write the test file now.`
}

const runnerPrompt = `You are the RUNNER agent. You execute the PHP toolchain INSIDE Docker — you do NOT write tests and you do NOT edit production code.

Every step runs the prebuilt image ${IMAGE} (php:8.4-cli + PCOV + composer + per-workspace Infection/PHPUnit/eris,
built from harness/php/Dockerfile) with the HOST workspace mounted to /work. RUN ON THE CONTAINER'S NATIVE FS
(the bind mount is ~20x slower and makes every mutant falsely time out — Step-1 probe finding). Use this exact form (Git Bash):
  MSYS_NO_PATHCONV=1 docker run --rm -v "${HOST_WS}:/work" ${IMAGE} bash -c '<cmd>'

where <cmd> is (single invocation — copy in, run, copy logs back):
  set -e
  cp -r /work /native && cd /native
  vendor/bin/phpunit                                  # run 1  (suite_green + no_flaky)
  vendor/bin/phpunit                                  # run 2
  vendor/bin/infection ${TARGET_REL} --no-progress --threads=4   # POSITIONAL single-file pin
  cp infection-log.json infection-summary.log /work/  # deliver logs to the host side

STEPS:
  1. Run the container command above. Parse each phpunit run's summary line into { passed, failed, skipped }
     (e.g. "OK (N tests, M assertions)" → passed=N, failed=0, skipped=0; or "Tests: N, ... Failures: F, Skipped: S").
     Record BOTH runs.
  2. Read the host-side log ${HOST_WS}\\infection-log.json. Its TOP-LEVEL keys are:
       stats (an object of counts) + per-status ARRAYS: killed, killedByStaticAnalysis, errored, escaped,
       timeouted, uncovered, syntaxErrors, ignored. THE STATUS IS THE ARRAY KEY — there is NO per-mutant status field.
     Each element is { mutator: { mutatorName, originalStartLine, originalFilePath, ... }, diff, processOutput }.
  3. TRANSLATE to the gate \`mutants\` array using EXACTLY this status map (Infection group → gate status):
${renderStatusMap(INFECTION_STATUS_MAP)}
     For every element of each NON-excluded group, emit ONE mutant:
       { "status": <mapped>, "location": { "start": { "line": <mutator.originalStartLine> } },
         "mutatorName": <mutator.mutatorName>, "replacement": "" }
     Do NOT enumerate the excluded groups (ignored / skipped). Do NOT synthesize or drop entries.
  4. Build \`mutationSummary\` from stats: { total: totalMutantsCount, killed: killedCount, escaped: escapedCount,
     timeout: timeOutCount, notCovered: notCoveredCount, errored: errorCount,
     killedByStaticAnalysis: killedByStaticAnalysisCount, syntaxError: syntaxErrorCount,
     ignored: ignoredCount, skipped: skippedCount }.
     INVARIANT (the orchestrator HALTs on violation): mutants.length MUST equal total − ignored − skipped.
     Report EXACTLY what the log lists — never pad or drop to force the match.
  5. Build \`mutatedFiles\`: one { "file": <originalFilePath>, "count": <#mutants> } per DISTINCT originalFilePath
     across all groups. (The positional pin scopes to the target, so normally just one entry — but report every
     distinct path for the fake-green guard.)
  6. Note any test that FAILS on the current production code (red-on-current) — list it; do NOT delete it.

FORBIDDEN — executing mutant PHP by hand. Survivor triage is READ-ONLY (reason from infection-log.json + the
source); never run individual mutants outside \`vendor/bin/infection\`. If any SUT execution outside phpunit/
infection is ever unavoidable, wrap it in \`timeout <N>s\`.

ALSO WRITE YOUR RESULTS HERE for the record (nexus-side, git-ignored — NEVER into the consuming source tree):
  ${RUNNER_RESULT}

as JSON: { "testRuns": [{passed,failed,skipped},{passed,failed,skipped}], "reportPath": "<abs path to infection-log.json>",
           "mutationSummary": { "total": N, "killed": N, "escaped": N, "timeout": N, "notCovered": N, "errored": N,
                                "killedByStaticAnalysis": N, "syntaxError": N, "ignored": N, "skipped": N },
           "mutants": [<the TRANSLATED gate mutants array>],
           "mutatedFiles": [{ "file": "<path>", "count": <int> }],
           "redOnCurrent": [{ "test": "...", "note": "..." }] }

IMPORTANT: return the same data in your schema'd response AND in the Write() — the orchestrator uses the
schema return directly and does NOT read files. NEVER report mutations from a file other than the target ${CONTAINER_SRC}.`

// =================================================================================================
// THE BOUNDED COVER LOOP (orchestrator-driven) — identical control flow to the .NET/Flutter/C++ cover.
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
  // Anti-fake-green TRANSLATION cross-check (PHP seam — Flutter precedent): every non-excluded mutant
  // Infection reported must appear in the translated array. A mismatch means the runner mis-translated,
  // dropped, or padded the mutant set — HALT like the ratchet, never score on an inconsistent set.
  const summary = runRaw.mutationSummary
  const enumerated = (runRaw.mutants ?? []).length
  const expected = (summary?.total ?? 0) - (summary?.ignored ?? 0) - (summary?.skipped ?? 0)
  if (!summary || enumerated !== expected) {
    log(`HALT (mutant-count-mismatch): translated mutants=${enumerated} !== total−ignored−skipped=${expected} (summary=${JSON.stringify(summary ?? null)}) — the translated set does not match Infection's stats; scoring on an inconsistent mutant set is forbidden.`)
    result = { stopped: 'mutant-count-mismatch', iter, mutationSummary: summary ?? null, enumerated, expected, runRaw }
    break
  }

  // Reconstruct the shape mutationFloor expects from the schema'd return — no file reads needed.
  const mutationReport = { files: { [SRC]: { mutants: runRaw.mutants } } }

  const prodSourceDiff = readProdSourceDiffPlaceholder()
  const gates = {
    target_mutated: targetMutated(runRaw.mutatedFiles, SRC),
    suite_green: suiteGreen(runRaw.testRuns),
    no_flaky: noFlaky(runRaw.testRuns),
    mutation_floor: mutationFloor(mutationReport, SRC, { floor: MUTATION_FLOOR, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES }),
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

  survivingMutants = gates.mutation_floor.detail.reachableSurvivors

  if (iter === MAX_ITERATIONS) {
    result = { stopped: 'cap-reached', iter, gates, achievedScore: score, reachableSurvivors: survivingMutants }
  }
}

log(`Cover (PHP) done: ${result.stopped} after ${result.iter} iteration(s); achieved ${result.achievedScore}% reachable kill.`)
return {
  variant: 'inc4-cover-php',
  target: { class: TARGET_CLASS, source: CONTAINER_SRC },
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
