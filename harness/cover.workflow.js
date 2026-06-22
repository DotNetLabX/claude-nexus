// Cover Workflow (harness Increment 2) — turn VERIFIED rules into MUTATION-GATED tests.
//
// Runnable via Workflow({ scriptPath: "<abs>/harness/cover.workflow.js" }).
//
// This is the harness's Cover stage (design §1 Cover row). Mine→Verify (Increment 1) produced the
// verified BugRatio rule set in the consuming project's KB; Cover writes example + property tests and
// proves them with Stryker mutation kill — the phase that owes the #4 Cover cost number.
//
// THE THREE ACTORS (design §1 + §6 reward-hacking defense — never collapse them):
//
//   ORCHESTRATOR (this JS, trusted, deterministic)
//     • passes KB_RULES + TEST_STYLE paths to the Cover agent (has no filesystem access itself — agents do all I/O)
//     • spawns the Cover agent, then the runner agent (distinct agent() calls)
//     • computes the §6 gate battery via harness/lib/cover-gates.mjs (NOT in this file — pure helpers)
//     • applies the `// Stryker disable` annotation on KB-pre-documented dead lines (NOT the Cover agent)
//     • writes/flips the KB ledger (Step 6 — operator-owed; out of this file's runnable surface)
//     • NEVER writes the test files itself and NEVER lets the Cover agent touch config/gates/KB
//
//   COVER AGENT (clean-room writer)
//     • input: reads BugRatioAnalyzer.cs source + KB_RULES (bug-ratio.md, verified rules) + TEST_STYLE
//       (mutation-testing.md, FsCheck-3.x / MTP API — NOT the golden set) + the current surviving-mutant list
//     • ONLY writes: BugRatioAnalyzerTests.cs + BugRatioAnalyzerPropertyTests.cs
//     • forbidden: BugRatioAnalyzer.cs, stryker-config.json, the KB, the gate infra
//     • a test that is RED on current code is KEPT and FLAGGED as a candidate bug — NEVER deleted
//
//   RUNNER AGENT (executor — a DISTINCT agent() call from the Cover agent)
//     • runs `dotnet test` twice (double-run for suite_green + no_flaky) then `dotnet stryker`
//     • reads the emitted mutation-report.json; extracts the BugRatioAnalyzer.cs per-file mutants array
//     • returns testRuns + strykerReportPath + mutants in its schema'd result (source of truth)
//     • also Write()s the same data to a NEXUS-SIDE, git-ignored path (harness/.runs/) for the record
//
// CLEAN-ROOM (design §3): the golden set is NEVER passed into the Cover or runner agent. Cover scores
// against MUTANTS, not golden — its input is source + verified KB rules + surviving-mutant list only.
// (The golden set path appears nowhere in any agent prompt in this file — that is a Step-2 acceptance.)
//
// DELIVERABLE = A FILE WRITE, NEVER THE FINAL MESSAGE (design §4): the Cover agent Write()s the test
// files; the runner Write()s its results nexus-side for the record and returns them via schema. The
// orchestrator uses the schema return (not file reads — it has no fs access) to compute gates.
//
// SCOPE (Increment 2, bounded loop only): one target class (BugRatioAnalyzer), the already-done
// HealthScore Cover as the pattern, mutation floor >= 75 on REACHABLE mutants (no ratchet-to-100 — that
// is Increment 3). The full loop controller + stopping-signal battery + Discover are Increment 3.

// meta MUST be the first statement (Workflow tool requirement).
export const meta = {
  name: 'cover-bugratio',
  description:
    'Harness Inc 2 (Inc-3 parameterized): Cover stage — clean-room Cover agent writes example + property tests; a distinct runner agent double-runs dotnet test then dotnet stryker; the orchestrator gates on the §6 battery (mutation floor >= 75 per-file reachable) via cover-gates.mjs. Target from args when provided; defaults to BugRatioAnalyzer (back-compat). Three actors, reward-hacking defended.',
  phases: [
    { title: 'Setup', detail: 'orchestrator passes KB_RULES + TEST_STYLE paths to Cover agent (agent reads them; orchestrator has no fs access; golden set NEVER passed)' },
    { title: 'Cover', detail: 'clean-room Cover agent writes the 2 test files; red-on-current tests kept + flagged, never deleted' },
    { title: 'Run', detail: 'distinct runner agent: double `dotnet test` + `dotnet stryker`; reads mutation-report.json; returns testRuns + mutants via schema (source of truth); also Write()s nexus-side/git-ignored artifact' },
    { title: 'Gate', detail: 'orchestrator computes the 5-gate battery + mutation ratchet via cover-gates.mjs; reachable survivors feed back' },
  ],
}

// --- Inlined §6 gate battery (self-contained — the Workflow runtime has no module/fs access) -------
// SOURCE OF TRUTH: harness/lib/cover-gates.mjs (unit-tested in tests/unit/cover-gates.test.mjs). The
// Workflow runtime parses this body in a non-module context, so a static `import` is a syntax error and
// there is no filesystem to load a sibling module — the workflow must be self-contained (same reason the
// Inc-1 workflow inlines its target config). Copied VERBATIM from cover-gates.mjs; keep in sync until a
// build step dedupes them (Inc-3 debt).

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

const STRYKER_DISABLE_RE = /^\/\/\s*Stryker\s+disable\b/i;

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
    if (!STRYKER_DISABLE_RE.test(content)) disallowed.push(raw);
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

const EXPECTED_SURVIVOR_LINES = [17, 133, 268];

// --- Target + contract paths ----------------------------------------------------------------------
// All consuming-project (sprint-rituals) paths. Mirrors harness/targets/bugratio.json (kept inline so
// the Workflow is self-contained when the platform Workflow tool executes this file directly).
//
// Inc-3 parameterization: if the Workflow runtime injects an `args` global (unverified — Step-1/8
// bringup check), the controller passes { src, kbRules, testStyle, exampleTests, propertyTests,
// runnerResult, targetClass } to retarget. Default to the BugRatio consts so standalone invocations
// are back-compatible. If `args` injection is absent, the controller can parameterize another way
// (see loop.workflow.js header).
const _args = (typeof args !== 'undefined' && args) ? args : {}
const SR = 'D:\\src\\sprint-rituals'
const SRC = _args.src ?? `${SR}\\src\\Services\\Fokus\\Fokus.Domain\\Analytics\\BugRatioAnalyzer.cs`
// The VERIFIED rules — path passed to Cover agent (the agent reads this; golden set NEVER passed — clean-room §3).
const KB_RULES = _args.kbRules ?? `${SR}\\docs\\kb\\bug-ratio.md`
// The test-style contract: FsCheck-3.x C# API + MTP runner facts. Clean-room-safe — it is the API
// contract that prevents FsCheck-API compile failures in the generated property tests, NOT the golden set.
const TEST_STYLE = _args.testStyle ?? `${SR}\\docs\\conventions\\mutation-testing.md`

// The Cover agent's ONLY two write targets (design §1 / §6 — its entire write set).
const TEST_DIR = `${SR}\\src\\Services\\Fokus\\Fokus.Domain.Tests\\Analytics`
const EXAMPLE_TESTS = _args.exampleTests ?? `${TEST_DIR}\\BugRatioAnalyzerTests.cs`
const PROPERTY_TESTS = _args.propertyTests ?? `${TEST_DIR}\\BugRatioAnalyzerPropertyTests.cs`

// Runner results land HERE — nexus-side + git-ignored (.gitignore: harness/.runs/). NEVER in the SR tree
// (Step-7 hazard: a runner result file in the SR working tree would strand in the SR commit).
const RUNS_DIR = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'
const RUNNER_RESULT = _args.runnerResult ?? `${RUNS_DIR}\\cover-bugratio-run.json`

// First-pass acceptance floor (design §6 / plan Step 5 stop rule): per-file REACHABLE kill >= 75. The
// 70→75→80 ratchet toward 100 is Increment 3 — NOT chased here.
const MUTATION_FLOOR = 75
const MAX_ITERATIONS = 5 // hard cap (plan Step 5: ~5 iterations / budget) — stop + report, never fake green.

// The MEASURED baseline skip count (design §6 / plan Step 3: read the baseline, do NOT assert a literal 0).
// The project's current suite skips 0 today; the runner re-measures it each run and no_new_skips gates on
// THIS baseline. Pinned here as the known baseline at Cover time (declared before the loop — a const used
// in the loop body cannot be hoisted, so its declaration must precede first use).
const BASELINE_SKIPS = 0

// --- Runner result schema (what the runner agent returns via schema) --------------------------------
// The gate helpers (cover-gates.mjs) are pure fns over THIS shape. Keep it in lockstep with the helpers.
// NOTE: strykerReportPath is still returned (so the runner can Write() the artifact nexus-side for the
// record), but the orchestrator no longer reads the file — it uses runRaw.mutants directly.
const RUNNER_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    // Two independent `dotnet test` runs (double-run → suite_green + no_flaky).
    testRuns: {
      type: 'array',
      minItems: 2,
      items: {
        type: 'object',
        properties: {
          passed: { type: 'integer' },
          failed: { type: 'integer' },
          skipped: { type: 'integer' },
        },
        required: ['passed', 'failed', 'skipped'],
      },
    },
    // Absolute path to the Stryker JSON report (schemaVersion 2) the runner produced. Returned for the
    // record; the orchestrator does NOT read this file — it uses `mutants` below instead.
    strykerReportPath: { type: 'string' },
    // The per-file mutant array for BugRatioAnalyzer.cs extracted by the runner from the Stryker JSON.
    // Each mutant: { status, location: { start: { line } }, mutatorName, replacement }.
    // This is the source of truth the orchestrator uses — eliminates the need for a filesystem read.
    mutants: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          location: {
            type: 'object',
            properties: { start: { type: 'object', properties: { line: { type: 'integer' } }, required: ['line'] } },
            required: ['start'],
          },
          mutatorName: { type: 'string' },
          replacement: { type: 'string' },
        },
        required: ['status', 'location', 'mutatorName'],
      },
    },
    // The runner's own list of red-on-current-code tests (kept + flagged, never deleted). May be empty.
    redOnCurrent: {
      type: 'array',
      items: {
        type: 'object',
        properties: { test: { type: 'string' }, note: { type: 'string' } },
        required: ['test'],
      },
    },
  },
  required: ['testRuns', 'strykerReportPath', 'mutants'],
}

// --- Phase: Setup ----------------------------------------------------------------------------------
// The orchestrator has no filesystem access — the Cover agent reads KB_RULES + TEST_STYLE itself
// (they are passed as paths in coverPrompt). The golden set is NEVER read here or in any agent prompt
// (clean-room §3).
phase('Setup')
log(`Setup: paths passed to Cover agent — KB_RULES=${KB_RULES}, TEST_STYLE=${TEST_STYLE}. Golden set NOT read (clean-room §3).`)

// The Cover agent's standing prompt. `survivingMutants` is injected per iteration (empty on the first pass).
// NOTE: SRC path + KB_RULES path + TEST_STYLE path + the surviving-mutant list are the ENTIRE input
// surface — the agent reads the files itself (has Read tool). The golden set path appears NOWHERE here
// (Step-2 acceptance / design §3). The orchestrator passes PATHS, not file content — it has no fs access.
function coverPrompt(survivingMutants) {
  const survBlock = survivingMutants.length
    ? `SURVIVING MUTANTS to target this iteration (each is a REACHABLE mutation no current test killed — write a test that fails on the mutated behavior):\n${survivingMutants
        .map((m) => `- ${m.mutatorName} at line ${m.line}: replacement \`${m.replacement}\` (status ${m.status})`)
        .join('\n')}`
    : 'FIRST ITERATION — no surviving-mutant feedback yet. Write the full example + property suite covering every verified rule boundary below.'

  return `You are the COVER agent. Write mutation-gated tests for ONE production class, against the VERIFIED rules below.

YOUR ONLY TWO WRITE TARGETS (write ONLY these — touching anything else is a hard violation):
  1. ${EXAMPLE_TESTS}      — example-based xUnit v3 [Fact] tests (AwesomeAssertions; one Fact per rule boundary)
  2. ${PROPERTY_TESTS}     — FsCheck property tests for invariants

FORBIDDEN — you have NO write access to any of these (a separate actor owns them):
  • ${SRC} (the production class — NEVER edit it; not even a comment)
  • stryker-config.json, any gate infrastructure, any docs/kb/** file

NON-NEGOTIABLE RULES:
  • A test that FAILS on the CURRENT production code is KEPT and FLAGGED as a candidate bug in a
    \`// CANDIDATE BUG:\` comment — it is NEVER deleted, and you NEVER change the production code to make
    it pass. (Deleting a red test to go green is exactly the hack the mutation gate exists to stop.)
  • Coverage is NOT the goal — KILLING MUTANTS is. Pin exact threshold/boundary cases (epsilon on each
    >=/> and ==/!= comparison) so Stryker's relational/equality mutants are caught.
  • Deliverable = the file write. Write() both files; do not summarize them in your final message.

STEP 1 — READ THE PRODUCTION SOURCE (the SUT):
  ${SRC}

STEP 2 — READ THE VERIFIED RULES (from the consuming project's KB — GROUND TRUTH, already Mine→Verify'd;
this is NOT the golden set — it is the verified rule document used as test input):
  ${KB_RULES}

STEP 3 — READ THE TEST-STYLE CONTRACT (the project's xUnit-v3 + FsCheck-3.x C# API + MTP facts — follow
it EXACTLY so the property tests COMPILE; this is the API contract, not an answer key):
  ${TEST_STYLE}

PATTERN TO FOLLOW (the already-done, mutation-gated HealthScore Cover — same shape, same project):
  • ${SR}\\src\\Services\\Fokus\\Fokus.Domain.Tests\\Analytics\\HealthScoreCalculatorTests.cs
    (xUnit v3 + AwesomeAssertions, one [Fact] per rule boundary, epsilon-pinned threshold cases)
  • ${SR}\\src\\Services\\Fokus\\Fokus.Domain.Tests\\Analytics\\MetricCardBuilderPropertyTests.cs
    (FsCheck [Property] invariants — direct bool return, FsCheck.Xunit.v3, no Prop.ForAll)

${survBlock}

Write both files now.`
}

// The runner agent prompt — a DISTINCT agent() call from the Cover agent (design §6). It executes the
// .NET toolchain in sprint-rituals, reads the Stryker JSON report, and returns the per-file mutant array
// in its schema'd result. It also Write()s the results nexus-side for the record, but the schema return
// is the source of truth — the orchestrator does NOT read any files (no fs access in the orchestrator).
const runnerPrompt = `You are the RUNNER agent. You execute the .NET toolchain — you do NOT write tests and you do NOT edit production code.

STEPS (run from the test project directory ${SR}\\src\\Services\\Fokus\\Fokus.Domain.Tests):
  1. Run \`dotnet test\` TWICE (two independent invocations — this is the double-run for suite_green + no_flaky).
     Record { passed, failed, skipped } for EACH run.
  2. Run \`dotnet stryker\` (MTP runner, per the project's mutation-testing.md). It emits a JSON report under
     StrykerOutput/<timestamp>/reports/mutation-report.json (schemaVersion 2). Capture its ABSOLUTE path.
  3. Read the emitted mutation-report.json. Find the per-file entry whose key ends with BugRatioAnalyzer.cs
     (the \`files\` object is keyed by absolute path). Extract its \`mutants\` array. Each element has:
       { "status": "Killed"|"Survived"|"NoCoverage"|"Timeout"|"Ignored"|...,
         "location": { "start": { "line": N }, "end": { "line": M } },
         "mutatorName": "...", "replacement": "..." }
     Return the FULL mutants array from that per-file entry in your schema'd result.
  4. Note any test that FAILS on the current production code (red-on-current) — list it; do NOT delete it.

ALSO WRITE YOUR RESULTS HERE for the record (nexus-side, git-ignored — NEVER into the sprint-rituals tree):
  ${RUNNER_RESULT}

as JSON: { "testRuns": [{passed,failed,skipped}, {passed,failed,skipped}], "strykerReportPath": "<abs>",
           "mutants": [<the per-file BugRatioAnalyzer.cs mutants array from the Stryker JSON>],
           "redOnCurrent": [{ "test": "...", "note": "..." }] }

IMPORTANT: return the same data in your schema'd response AND in the Write() — the orchestrator uses the
schema return directly and does NOT read files.`

// --- The bounded Cover loop (orchestrator-driven) -------------------------------------------------
// Each iteration: Cover agent writes/updates the tests → runner double-runs + Stryker → orchestrator
// triages survivors (expected-survivors on KB dead lines are excluded, NOT chased) → reachable survivors
// feed back to the Cover agent. Stop at floor>=75 OR the hard cap.
let survivingMutants = []
let lastScore = null
let result = null

for (let iter = 1; iter <= MAX_ITERATIONS; iter++) {
  phase('Cover')
  log(`Cover iteration ${iter}/${MAX_ITERATIONS}: ${survivingMutants.length} surviving mutant(s) fed back.`)
  // The Cover agent writes the two test files (its ONLY writes). Deliverable is the file write, not the return.
  await agent(coverPrompt(survivingMutants), {
    label: `cover:iter-${iter}`,
    phase: 'Cover',
    // Mechanical clean-room sealing (disallowedTools restricting the write set + golden path) is the
    // Increment-3 hardening; this increment the boundary is prompt-enforced (design §3 / ADR-13), exactly
    // as Inc-1's miners were. The Cover agent's prompt carries the full forbidden-list above.
  })

  phase('Run')
  // DISTINCT agent() call — the runner is a different actor from the Cover agent (design §6).
  // The runner returns testRuns + strykerReportPath + mutants in its schema'd result — the orchestrator
  // uses that return directly; no file reads here (the orchestrator has no filesystem access).
  const runRaw = await agent(runnerPrompt, { label: `runner:iter-${iter}`, phase: 'Run', schema: RUNNER_RESULT_SCHEMA })
  if (!runRaw) throw new Error(`Cover iteration ${iter}: runner returned no result`)
  // Reconstruct the shape mutationFloor expects from the schema'd return — no file reads needed.
  const strykerReport = { files: { [SRC]: { mutants: runRaw.mutants } } }

  phase('Gate')
  // §6 gate battery — pure fns over the runner output (Step-3 helpers). The orchestrator gates; no agent
  // self-reports a gate. char_pin receives the prod-source diff PRE-SCOPED to Fokus.Domain/** by the
  // orchestrator (it has git; the helper stays pure) — see Step-7 operator note for how it is produced.
  const prodSourceDiff = readProdSourceDiffPlaceholder() // operator supplies the scoped diff at run time (Step 5/7).
  const gates = {
    suite_green: suiteGreen(runRaw.testRuns),
    no_flaky: noFlaky(runRaw.testRuns),
    mutation_floor: mutationFloor(strykerReport, SRC, { floor: MUTATION_FLOOR, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES }),
    no_new_skips: noNewSkips(runRaw.testRuns, BASELINE_SKIPS),
    char_pin: charPin(prodSourceDiff),
  }
  const score = gates.mutation_floor.detail.scorePct

  // Mutation ratchet (design §6): a kill-rate REGRESSION halts the run — the harness is broken, do not continue.
  const ratchet = mutationRatchet(lastScore, score)
  if (!ratchet.pass) {
    log(`HALT (ratchet): ${ratchet.detail} — a kill-rate regression means the harness is broken. Not continuing.`)
    result = { stopped: 'ratchet-regression', iter, gates, ratchet, runRaw, achievedScore: score }
    break
  }
  lastScore = score

  const allGreen = Object.values(gates).every((g) => g.pass)
  log(
    `Gate iter ${iter}: suite_green=${gates.suite_green.pass} no_flaky=${gates.no_flaky.pass} ` +
      `mutation_floor=${gates.mutation_floor.pass} (${score}% reachable, floor ${MUTATION_FLOOR}) ` +
      `no_new_skips=${gates.no_new_skips.pass} char_pin=${gates.char_pin.pass}`,
  )

  if (allGreen) {
    result = { stopped: 'all-gates-green', iter, gates, achievedScore: score, redOnCurrent: runRaw.redOnCurrent ?? [] }
    break
  }

  // Not green yet → triage survivors. Expected-survivors on KB-pre-documented dead lines are already
  // EXCLUDED by mutation_floor (not chased); reuse its computed list — every REACHABLE survivor feeds back.
  survivingMutants = gates.mutation_floor.detail.reachableSurvivors

  if (iter === MAX_ITERATIONS) {
    // Hard cap reached without the floor: STOP and REPORT (never fake green, never delete reds).
    result = { stopped: 'cap-reached', iter, gates, achievedScore: score, reachableSurvivors: survivingMutants }
  }
}

// --- Return (KB flip + cost capture are Step 6, operator-owed) -------------------------------------
log(`Cover done: ${result.stopped} after ${result.iter} iteration(s); achieved ${result.achievedScore}% reachable kill.`)
return {
  variant: 'inc2-cover-bugratio',
  target: { class: _args.targetClass ?? 'BugRatioAnalyzer', source: SRC },
  ...result,
  // On all-gates-green the orchestrator (Step 6, operator-owed) flips the KB footer + index to
  // mutation-gated and captures the Cover cost. This Workflow returns the gate verdicts + the score; it
  // does NOT itself write the KB (that write is the orchestrator's privilege, not in this runnable file).
  outputTokensThisTurn: budget.spent(),
}

// --- Orchestrator-side helpers --------------------------------------------------------------------
// char_pin needs the Fokus.Domain/** prod-source diff PRE-SCOPED (the orchestrator has git; the helper
// stays pure and unit-testable). At live-run time (Step 5/7) the operator supplies the scoped diff via
// `git diff -- src/Services/Fokus/Fokus.Domain/`. When run with no diff staged the gate trivially passes
// (empty diff = no prod-source change = allowed). This placeholder returns the empty diff; the operator
// replaces it with the real scoped diff string at run time (see ## Operator Actions Required, Step 5).
function readProdSourceDiffPlaceholder() {
  return '' // empty diff → char_pin passes (no prod-source change). Operator supplies the scoped diff at run time.
}
