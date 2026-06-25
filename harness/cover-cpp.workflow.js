// Cover Workflow — C++ adapter (harness Increment 4, C++ bringup).
//
// Runnable via Workflow({ scriptPath: "<abs>/harness/cover-cpp.workflow.js" }).
//
// This is the C++ sibling of cover.workflow.js / cover-flutter.workflow.js. It is a deliberately THIN
// fork: the entire §6 gate battery is copied VERBATIM from cover.workflow.js (suiteGreen / noFlaky /
// mutationFloor / noNewSkips / targetMutated / charPin / mutationRatchet — keep in sync). Only two things
// differ from the .NET cover:
//
//   1. COVER AGENT writes a GoogleTest suite (extern "C" include + int** matrix helpers) instead of
//      xUnit.v3 + FsCheck.
//   2. RUNNER AGENT runs, INSIDE the probe's Docker image (clang-15 + mull-15 + GoogleTest), `ctest` ×2 +
//      a mutated build + `mull-runner-15`. mull emits a mutation-testing-elements JSON — the SAME schema
//      family Stryker uses — so the per-mutant array is consumed AS-IS (Killed/Survived/Timeout/NoCoverage
//      already match). No translation, unlike the Flutter XML fork. Every gate works UNCHANGED.
//
// TOOLCHAIN REALITY (docs/kb/research/cpp-mutation-and-test-tooling.md + probe adhoc-MineVerifyCppProbe,
// hands-on confirmed 2026-06-24): mull is the C++ Stryker-equivalent (config-driven, JSON+SQLite report,
// headless). It is Clang/LLVM + Linux-only, so the runner executes in Docker, not on the Windows host.
// On jammy the Cloudsmith repo ships mull up to LLVM 15 — clang-15 + mull-15 are pinned in harness/cpp/Dockerfile.
//
// KNOWN BLIND SPOT (probe finding): hungarian_solve calls exit(0) in its internal sanity check
// (L371/376/383). A mutant tripping it makes the process exit 0 → the test falsely "passes" → mutant
// SURVIVES. NOW NEUTRALIZED: the workspace/template links support/exit_wrap.cpp with -Wl,--wrap=exit, so a
// tripping mutant exits non-zero -> killed (46%->64% on Hungarian). The 3 exit LINES themselves stay in
// _args.expectedSurvivorLines so mutationFloor excludes them from the REACHABLE denominator — identical to
// the Flutter log-line and .NET dead-line mechanisms. See harness/cpp/cover-cpp-contract.md.
//
// SCOPE (thin pilot): the COVER + GATE half on one C++ target. Mine→Verify (rule extraction → KB) is a
// separate stack-agnostic step; this file reads a KB the same way the .NET/Flutter cover does. Default
// target is the SDK Hungarian assignment slice (the probe-validated dependency-free class); retarget via args.

// meta MUST be the first statement (Workflow tool requirement) and a PURE LITERAL.
export const meta = {
  name: 'cover-cpp',
  description:
    'Harness Inc 4 C++ adapter: Cover stage for a C/C++ target. Clean-room Cover agent writes a GoogleTest suite (extern "C" include + int** matrix helpers); a distinct runner agent runs ctest ×2 + a mutated build + mull-runner-15 INSIDE the clang-15/mull-15 Docker image, and consumes mull mutation-testing-elements JSON AS-IS (no translation — same schema family as Stryker); the orchestrator gates on the SAME §6 battery (mutation floor >= 75 per-file reachable) as the .NET cover. Equivalent-mutant filter (e.g. exit() false-survivor lines) reuses expectedSurvivorLines. Target from args; defaults to the SDK Hungarian slice. Three actors, reward-hacking defended.',
  phases: [
    { title: 'Setup', detail: 'orchestrator passes KB_RULES + TEST_STYLE/pattern paths to Cover agent (agent reads them; orchestrator has no fs access)' },
    { title: 'Cover', detail: 'clean-room Cover agent writes the GoogleTest file; red-on-current tests kept + flagged, never deleted' },
    { title: 'Run',   detail: 'distinct runner agent: docker run → double ctest + mutated build + mull-runner-15; reads mull JSON (mutation-testing-elements) AS-IS; also Write()s nexus-side/git-ignored artifact' },
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
      detail: { scorePct: 0, killed: 0, reachableDenominator: 0, error: `no per-file mutation entry for ${sourcePath}`, reachableSurvivors: [] },
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
    const isSurvivor = m.status !== 'Killed' && m.status !== 'Timeout';
    // Equivalent-mutant filter: a survivor on a KB-pre-documented no-output line (e.g. an exit() sanity
    // check) is excluded from the reachable denominator, NOT chased — identical to the .NET dead-line mechanism.
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

// C++ analogue of the .NET/Dart disable regex — the only prod-source change char_pin tolerates is a mull
// suppression comment. (In practice the slice is never edited, so the diff is empty and char_pin passes.)
const CPP_DISABLE_RE = /^\/\/\s*(mull|Stryker)\s+disable\b/i;

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
    if (!CPP_DISABLE_RE.test(content)) disallowed.push(raw);
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
// TARGET + CONTRACT PATHS (C++ defaults — retarget via args; same arg names as the .NET/Flutter cover)
// =================================================================================================
// Workflow-tool args arrive JSON-STRINGIFIED; workflow() composition args arrive as an object. Parse the
// string form so _args.X resolves in both cases (see loop.workflow.js for the why).
const _argsRaw = (typeof args !== 'undefined' && args) ? args : {}
let _args = {}
try { _args = typeof _argsRaw === 'string' ? JSON.parse(_argsRaw) : _argsRaw } catch { _args = {} }

const MODEL = _args.model ?? 'sonnet'
const TARGET_CLASS = _args.targetClass ?? 'Hungarian'
// The Docker image (built from harness/cpp/Dockerfile) and the HOST workspace mounted to /probe.
const IMAGE = _args.image ?? 'mvc-probe'
const HOST_WS = _args.hostWs ?? 'D:\\src\\claude-plugins\\nexus\\harness\\cpp\\workspace'
// Two path namespaces: the CONTAINER source path is the mull-report KEY (gate lookup); the HOST source
// path is what the Cover agent reads. Keep them distinct — this is the only structural difference from
// the host-native .NET/Flutter covers.
const CONTAINER_SRC = _args.containerSrc ?? '/probe/src/hungarian.cpp'
const SRC = CONTAINER_SRC
const HOST_SRC = _args.hostSrc ?? `${HOST_WS}\\src\\hungarian.cpp`
// The verified rules — path passed to the Cover agent (the agent reads it; golden set NEVER passed).
const KB_RULES = _args.kbRules ?? 'D:\\src\\claude-plugins\\nexus\\docs\\specs\\adhoc-MineVerifyCppAdapter\\delivery\\kb-hungarian.md'
// Test-style contract: the probe's proven seed test is the in-repo PATTERN the Cover agent mirrors.
const TEST_STYLE = _args.testStyle ?? 'D:\\src\\claude-plugins\\nexus\\harness\\cpp\\examples\\hungarian_smoke_test.cpp'
// The Cover agent's SINGLE write target — HOST path (mounted into the container as CONTAINER_TEST).
const COVER_TEST = _args.coverTest ?? `${HOST_WS}\\tests\\${snakeCase(TARGET_CLASS)}_harness_test.cpp`
const CONTAINER_TEST = _args.containerTest ?? `/probe/tests/${snakeCase(TARGET_CLASS)}_harness_test.cpp`
// The CMake test-binary target the GLOB workspace CMakeLists builds (see harness/cpp/cover-cpp-contract.md).
const TEST_BINARY = _args.testBinary ?? 'cover_tests'

// Runner results land nexus-side + git-ignored. NEVER in the consuming source tree.
const RUNS_DIR = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'
const RUNNER_RESULT = _args.runnerResult ?? `${RUNS_DIR}\\cover-cpp-${TARGET_CLASS.toLowerCase()}-run.json`

const MUTATION_FLOOR = 75
const MAX_ITERATIONS = _args.maxIterations ?? 5
const BASELINE_SKIPS = _args.baselineSkips ?? 0
// Equivalent-mutant filter: line numbers whose mutations a behaviour-asserting test can never kill — for
// hungarian_solve, the exit() sanity-check lines (371/376/383). Default [] (no known equivalents); pass per
// target. Excluded from the REACHABLE denominator, NOT chased.
const EXPECTED_SURVIVOR_LINES = _args.expectedSurvivorLines ?? []

// snake_case helper for the default test filename (no Date/Math.random — pure string op, resume-safe).
function snakeCase(name) {
  return String(name).replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').toLowerCase()
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
    // Absolute path to the mull JSON report (returned for the record; orchestrator does NOT read it).
    reportPath: { type: 'string' },
    // The per-mutation array for the TARGET file, taken AS-IS from mull's mutation-testing-elements JSON:
    //   statuses already are Killed / Survived / Timeout / NoCoverage — no translation needed.
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
    // Per-file mutation counts — EVERY file mull mutated. Feeds target_mutated (anti-fake-green).
    mutatedFiles: {
      type: 'array',
      items: { type: 'object', properties: { file: { type: 'string' }, count: { type: 'integer' } }, required: ['file', 'count'] },
    },
    redOnCurrent: {
      type: 'array',
      items: { type: 'object', properties: { test: { type: 'string' }, note: { type: 'string' } }, required: ['test'] },
    },
  },
  required: ['testRuns', 'reportPath', 'mutants', 'mutatedFiles'],
}

// =================================================================================================
// PHASE: Setup
// =================================================================================================
phase('Setup')
log(`Setup (C++): Cover agent gets KB_RULES=${KB_RULES}, TEST_STYLE=${TEST_STYLE}, pattern in-repo. Target src (container): ${CONTAINER_SRC}. Image: ${IMAGE}.`)

function coverPrompt(survivingMutants) {
  const survBlock = survivingMutants.length
    ? `SURVIVING MUTANTS to target this iteration (each is a REACHABLE mutation no current test killed — write a test that fails on the mutated behaviour):\n${survivingMutants
        .map((m) => `- ${m.mutatorName} at line ${m.line}: replacement \`${m.replacement}\` (status ${m.status})`)
        .join('\n')}`
    : 'FIRST ITERATION — no surviving-mutant feedback yet. Write the full suite covering every verified rule boundary below.'

  return `You are the COVER agent. Write mutation-gated GoogleTest tests for ONE C/C++ production unit, against the VERIFIED rules below.

YOUR ONLY WRITE TARGET (write ONLY this file — touching anything else is a hard violation):
  • ${COVER_TEST}   — a GoogleTest suite (#include <gtest/gtest.h>), one TEST() per rule boundary

FORBIDDEN — you have NO write access to any of these (a separate actor owns them):
  • ${HOST_SRC} (the production slice — NEVER edit it; not even a comment)
  • any CMakeLists.txt, mull.yml, Dockerfile, gate infrastructure, or any docs/kb/** file

NON-NEGOTIABLE RULES:
  • A test that FAILS on the CURRENT production code is KEPT and FLAGGED with a \`// CANDIDATE BUG:\` comment —
    NEVER deleted, and you NEVER change production code to make it pass.
  • Coverage is NOT the goal — KILLING MUTANTS is. Pin exact boundary cases: every comparison
    (\`<\`, \`<=\`, \`==\`, \`!=\`, \`>=\`, \`>\`), every branch, the exact assignment/cost semantics. Assert on the
    RETURNED assignment matrix (and the computed total cost), so a mutated comparison flips a test RED.
  • The SUT is C with an \`extern "C"\` header — include it as:  extern "C" { #include "hungarian.h" }
  • Build the int** cost matrix with malloc, call hungarian_init / hungarian_solve / hungarian_free, and
    free what you allocate. Mirror the helper shape in the PATTERN file exactly.
  • Deliverable = the file write. Write() the file; do not summarize it in your final message.

STEP 1 — READ THE PRODUCTION SOURCE (the SUT):
  ${HOST_SRC}

STEP 2 — READ THE VERIFIED RULES (the KB — GROUND TRUTH, already Mine→Verify'd):
  ${KB_RULES}

STEP 3 — READ THE TEST-STYLE / PATTERN (so the test COMPILES and matches the proven shape):
  ${TEST_STYLE}

${survBlock}

Write the test file now.`
}

const runnerPrompt = `You are the RUNNER agent. You execute the C++ toolchain INSIDE Docker — you do NOT write tests and you do NOT edit production code.

Every step runs the prebuilt image ${IMAGE} (clang-15 + mull-15 + GoogleTest, built from harness/cpp/Dockerfile)
with the HOST workspace mounted to /probe. Use this exact mount form (Git Bash):
  MSYS_NO_PATHCONV=1 docker run --rm -v "${HOST_WS}:/probe" -w /probe ${IMAGE} bash -lc '<cmd>'

STEPS:
  1. Configure + build (non-mutated) and run the suite TWICE (the double-run for suite_green + no_flaky):
       cmake -S /probe -B /probe/build -G Ninja -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
       cmake --build /probe/build
       ctest --test-dir /probe/build --output-on-failure    # run 1
       ctest --test-dir /probe/build --output-on-failure    # run 2
     Record { passed, failed, skipped } for EACH run (parse the ctest summary line, e.g. "100% tests passed, 0 failed out of N").
  2. Mutated build + mull on ONLY the target file:
       export MULL_CONFIG=/probe/mull.yml
       cmake -S /probe -B /probe/build-mull -G Ninja -DMULL=ON
       cmake --build /probe/build-mull
       mull-runner-15 --reporters Elements --reporters SQLite --report-name cover --report-dir /probe/mull-out --workers 4 /probe/build-mull/${TEST_BINARY}
     mull writes /probe/mull-out/cover.json (mutation-testing-elements) + cover.sqlite. mull.yml already scopes
     mutation to the target file (includePaths) — do NOT mutate the test or gtest.
  3. Read /probe/mull-out/cover.json. It is ALREADY in the mutation-testing-elements schema:
       files["${CONTAINER_SRC}"].mutants = [ { status, location:{start:{line}}, mutatorName, replacement }, ... ]
     Take the TARGET file's mutants array AS-IS — the statuses (Killed / Survived / Timeout / NoCoverage)
     ALREADY match the gate schema. NO translation. (Treat Timeout as a kill; the gate does.)
  4. Build \`mutatedFiles\`: for EVERY key in cover.json.files, one { "file": "<key>", "count": <#mutants> }.
     (mull.yml scopes to the target, so normally just one entry — but report every key for the fake-green guard.)
  5. Note any test that FAILS on the current production code (red-on-current) — list it; do NOT delete it.

ALSO WRITE YOUR RESULTS HERE for the record (nexus-side, git-ignored — NEVER into the consuming source tree):
  ${RUNNER_RESULT}

as JSON: { "testRuns": [{passed,failed,skipped},{passed,failed,skipped}], "reportPath": "<abs path to cover.json>",
           "mutants": [<the target file's mutants array, AS-IS from mull>],
           "mutatedFiles": [{ "file": "<key>", "count": <int> }],
           "redOnCurrent": [{ "test": "...", "note": "..." }] }

IMPORTANT: return the same data in your schema'd response AND in the Write() — the orchestrator uses the
schema return directly and does NOT read files. NEVER report mutations from a file other than the target ${CONTAINER_SRC}.`

// =================================================================================================
// THE BOUNDED COVER LOOP (orchestrator-driven) — identical control flow to the .NET/Flutter cover.
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
  const mutationReport = { files: { [SRC]: { mutants: runRaw.mutants } } }

  phase('Gate')
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

log(`Cover (C++) done: ${result.stopped} after ${result.iter} iteration(s); achieved ${result.achievedScore}% reachable kill.`)
return {
  variant: 'inc4-cover-cpp',
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
