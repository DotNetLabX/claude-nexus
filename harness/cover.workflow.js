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
//     • reads the VERIFIED rules from the consuming project's KB (orchestrator-side)
//     • spawns the Cover agent, then the runner agent (distinct agent() calls)
//     • computes the §6 gate battery via harness/lib/cover-gates.mjs (NOT in this file — pure helpers)
//     • applies the `// Stryker disable` annotation on KB-pre-documented dead lines (NOT the Cover agent)
//     • writes/flips the KB ledger (Step 6 — operator-owed; out of this file's runnable surface)
//     • NEVER writes the test files itself and NEVER lets the Cover agent touch config/gates/KB
//
//   COVER AGENT (clean-room writer)
//     • input: BugRatioAnalyzer.cs source + the verified KB rules + the current surviving-mutant list
//       + the project's mutation-testing.md test-style contract (FsCheck-3.x / MTP API — NOT the golden set)
//     • ONLY writes: BugRatioAnalyzerTests.cs + BugRatioAnalyzerPropertyTests.cs
//     • forbidden: BugRatioAnalyzer.cs, stryker-config.json, the KB, the gate infra
//     • a test that is RED on current code is KEPT and FLAGGED as a candidate bug — NEVER deleted
//
//   RUNNER AGENT (executor — a DISTINCT agent() call from the Cover agent)
//     • runs `dotnet test` twice (double-run for suite_green + no_flaky) then `dotnet stryker`
//     • Write()s structured results to a NEXUS-SIDE, git-ignored path (harness/.runs/), NEVER into the
//       sprint-rituals working tree (Step-7 hazard: stray files must not land in the SR commit)
//
// CLEAN-ROOM (design §3): the golden set is NEVER passed into the Cover or runner agent. Cover scores
// against MUTANTS, not golden — its input is source + verified KB rules + surviving-mutant list only.
// (The golden set path appears nowhere in any agent prompt in this file — that is a Step-2 acceptance.)
//
// DELIVERABLE = A FILE WRITE, NEVER THE FINAL MESSAGE (design §4): the Cover agent Write()s the test
// files; the runner Write()s its results; the orchestrator reads the files. This makes the run resumable.
//
// SCOPE (Increment 2, bounded loop only): one target class (BugRatioAnalyzer), the already-done
// HealthScore Cover as the pattern, mutation floor >= 75 on REACHABLE mutants (no ratchet-to-100 — that
// is Increment 3). The full loop controller + stopping-signal battery + Discover are Increment 3.

// meta MUST be the first statement (Workflow tool requirement).
export const meta = {
  name: 'cover-bugratio',
  description:
    'Harness Inc 2: Cover stage on BugRatioAnalyzer — clean-room Cover agent writes example + property tests; a distinct runner agent double-runs dotnet test then dotnet stryker; the orchestrator gates on the §6 battery (mutation floor >= 75 per-file reachable) via cover-gates.mjs. Three actors, reward-hacking defended.',
  phases: [
    { title: 'Setup', detail: 'orchestrator reads verified KB rules + the test-style contract (golden set NEVER read here)' },
    { title: 'Cover', detail: 'clean-room Cover agent writes the 2 test files; red-on-current tests kept + flagged, never deleted' },
    { title: 'Run', detail: 'distinct runner agent: double `dotnet test` + `dotnet stryker`; results Write()n nexus-side/git-ignored' },
    { title: 'Gate', detail: 'orchestrator computes the 5-gate battery + mutation ratchet via cover-gates.mjs; reachable survivors feed back' },
  ],
}

import {
  suiteGreen,
  noFlaky,
  mutationFloor,
  noNewSkips,
  charPin,
  mutationRatchet,
  EXPECTED_SURVIVOR_LINES,
} from './lib/cover-gates.mjs'

// --- Target + contract paths ----------------------------------------------------------------------
// All consuming-project (sprint-rituals) paths. Mirrors harness/targets/bugratio.json (kept inline so
// the Workflow is self-contained when the platform Workflow tool executes this file directly).
const SR = 'D:\\src\\sprint-rituals'
const SRC = `${SR}\\src\\Services\\Fokus\\Fokus.Domain\\Analytics\\BugRatioAnalyzer.cs`
// The VERIFIED rules — read orchestrator-side (the Cover agent receives them inline, never the golden set).
const KB_RULES = `${SR}\\docs\\kb\\bug-ratio.md`
// The test-style contract: FsCheck-3.x C# API + MTP runner facts. Clean-room-safe — it is the API
// contract that prevents FsCheck-API compile failures in the generated property tests, NOT the golden set.
const TEST_STYLE = `${SR}\\docs\\conventions\\mutation-testing.md`

// The Cover agent's ONLY two write targets (design §1 / §6 — its entire write set).
const TEST_DIR = `${SR}\\src\\Services\\Fokus\\Fokus.Domain.Tests\\Analytics`
const EXAMPLE_TESTS = `${TEST_DIR}\\BugRatioAnalyzerTests.cs`
const PROPERTY_TESTS = `${TEST_DIR}\\BugRatioAnalyzerPropertyTests.cs`

// Runner results land HERE — nexus-side + git-ignored (.gitignore: harness/.runs/). NEVER in the SR tree
// (Step-7 hazard: a runner result file in the SR working tree would strand in the SR commit).
const RUNS_DIR = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'
const RUNNER_RESULT = `${RUNS_DIR}\\cover-bugratio-run.json`

// First-pass acceptance floor (design §6 / plan Step 5 stop rule): per-file REACHABLE kill >= 75. The
// 70→75→80 ratchet toward 100 is Increment 3 — NOT chased here.
const MUTATION_FLOOR = 75
const MAX_ITERATIONS = 5 // hard cap (plan Step 5: ~5 iterations / budget) — stop + report, never fake green.

// The MEASURED baseline skip count (design §6 / plan Step 3: read the baseline, do NOT assert a literal 0).
// The project's current suite skips 0 today; the runner re-measures it each run and no_new_skips gates on
// THIS baseline. Pinned here as the known baseline at Cover time (declared before the loop — a const used
// in the loop body cannot be hoisted, so its declaration must precede first use).
const BASELINE_SKIPS = 0

// --- Runner result schema (what the runner agent Write()s) ----------------------------------------
// The gate helpers (cover-gates.mjs) are pure fns over THIS shape. Keep it in lockstep with the helpers.
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
    // Absolute path to the Stryker JSON report (schemaVersion 2) the runner produced. The orchestrator
    // reads the per-file BugRatioAnalyzer.cs score from it — the runner does NOT compute the score.
    strykerReportPath: { type: 'string' },
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
  required: ['testRuns', 'strykerReportPath'],
}

// --- Phase: Setup (orchestrator-side reads; NO golden set) -----------------------------------------
phase('Setup')
const verifiedRules = read(KB_RULES) // orchestrator-side — the Cover agent gets this inline, never the golden set.
const testStyleContract = read(TEST_STYLE)
log(`Setup: read ${verifiedRules.length} chars of verified rules + ${testStyleContract.length} chars of test-style contract. Golden set NOT read (clean-room §3).`)

// The Cover agent's standing prompt. `survivingMutants` is injected per iteration (empty on the first pass).
// NOTE: SRC + the verified rules + the surviving-mutant list + the test-style contract are the ENTIRE
// input surface — the golden set path appears NOWHERE here (Step-2 acceptance / design §3).
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

PRODUCTION SOURCE (read it; this is the SUT):
${SRC}

VERIFIED RULES (from the consuming project's KB — these are GROUND TRUTH, already Mine→Verify'd):
${verifiedRules}

TEST-STYLE CONTRACT (the project's xUnit-v3 + FsCheck-3.x C# API + MTP facts — follow it EXACTLY so the
property tests COMPILE; this is the API contract, not an answer key):
${testStyleContract}

PATTERN TO FOLLOW (the already-done, mutation-gated HealthScore Cover — same shape, same project):
  • ${SR}\\src\\Services\\Fokus\\Fokus.Domain.Tests\\Analytics\\HealthScoreCalculatorTests.cs
    (xUnit v3 + AwesomeAssertions, one [Fact] per rule boundary, epsilon-pinned threshold cases)
  • ${SR}\\src\\Services\\Fokus\\Fokus.Domain.Tests\\Analytics\\MetricCardBuilderPropertyTests.cs
    (FsCheck [Property] invariants — direct bool return, FsCheck.Xunit.v3, no Prop.ForAll)

${survBlock}

Write both files now.`
}

// The runner agent prompt — a DISTINCT agent() call from the Cover agent (design §6). It executes the
// .NET toolchain in sprint-rituals and Write()s structured results NEXUS-SIDE (never into the SR tree).
const runnerPrompt = `You are the RUNNER agent. You execute the .NET toolchain — you do NOT write tests and you do NOT edit production code.

STEPS (run from the test project directory ${SR}\\src\\Services\\Fokus\\Fokus.Domain.Tests):
  1. Run \`dotnet test\` TWICE (two independent invocations — this is the double-run for suite_green + no_flaky).
     Record { passed, failed, skipped } for EACH run.
  2. Run \`dotnet stryker\` (MTP runner, per the project's mutation-testing.md). It emits a JSON report under
     StrykerOutput/<timestamp>/reports/mutation-report.json (schemaVersion 2). Capture its ABSOLUTE path.
  3. Note any test that FAILS on the current production code (red-on-current) — list it; do NOT delete it.

WRITE YOUR RESULTS HERE (nexus-side, git-ignored — NEVER into the sprint-rituals tree):
  ${RUNNER_RESULT}

as JSON: { "testRuns": [{passed,failed,skipped}, {passed,failed,skipped}], "strykerReportPath": "<abs>",
           "redOnCurrent": [{ "test": "...", "note": "..." }] }

Deliverable = the file write. Write() the JSON; do not summarize it in your final message.`

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
  const runRaw = await agent(runnerPrompt, { label: `runner:iter-${iter}`, phase: 'Run', schema: RUNNER_RESULT_SCHEMA })
  if (!runRaw) throw new Error(`Cover iteration ${iter}: runner returned no result`)
  // Re-read the runner's durable artifact (deliverable = file write; the schema'd return is a convenience).
  const run = JSON.parse(read(RUNNER_RESULT))
  const strykerReport = JSON.parse(read(run.strykerReportPath))

  phase('Gate')
  // §6 gate battery — pure fns over the runner output (Step-3 helpers). The orchestrator gates; no agent
  // self-reports a gate. char_pin receives the prod-source diff PRE-SCOPED to Fokus.Domain/** by the
  // orchestrator (it has git; the helper stays pure) — see Step-7 operator note for how it is produced.
  const prodSourceDiff = readProdSourceDiffPlaceholder() // operator supplies the scoped diff at run time (Step 5/7).
  const gates = {
    suite_green: suiteGreen(run.testRuns),
    no_flaky: noFlaky(run.testRuns),
    mutation_floor: mutationFloor(strykerReport, SRC, { floor: MUTATION_FLOOR, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES }),
    no_new_skips: noNewSkips(run.testRuns, BASELINE_SKIPS),
    char_pin: charPin(prodSourceDiff),
  }
  const score = gates.mutation_floor.detail.scorePct

  // Mutation ratchet (design §6): a kill-rate REGRESSION halts the run — the harness is broken, do not continue.
  const ratchet = mutationRatchet(lastScore, score)
  if (!ratchet.pass) {
    log(`HALT (ratchet): ${ratchet.detail} — a kill-rate regression means the harness is broken. Not continuing.`)
    result = { stopped: 'ratchet-regression', iter, gates, ratchet, run, achievedScore: score }
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
    result = { stopped: 'all-gates-green', iter, gates, achievedScore: score, redOnCurrent: run.redOnCurrent ?? [] }
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

// --- Return (orchestrator reads the files; KB flip + cost capture are Step 6, operator-owed) -------
log(`Cover done: ${result.stopped} after ${result.iter} iteration(s); achieved ${result.achievedScore}% reachable kill.`)
return {
  variant: 'inc2-cover-bugratio',
  target: { class: 'BugRatioAnalyzer', source: SRC },
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
