// cover-gates.test.mjs — the harness's Cover §6 gate battery (Increment 2, Step 3, TDD).
//
// Design §6 (honesty battery + reward-hacking defense): the gates are DETERMINISTIC, pure fns over the
// runner agent's JSON output — the ORCHESTRATOR computes them, no agent self-reports a gate. This suite
// drives every gate with pass + deliberate-fail fixtures, the per-file-score extraction from a fixture
// Stryker JSON report (schemaVersion 2), the allowed-`Stryker disable`-diff vs disallowed-logic-diff
// char_pin cases, and the ratchet-regression-halts case. No LLM, no .NET — fully deterministic.
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  suiteGreen,
  noFlaky,
  mutationFloor,
  noNewSkips,
  charPin,
  mutationRatchet,
  EXPECTED_SURVIVOR_LINES,
} from '../../harness/lib/cover-gates.mjs';

// =================================================================================================
// Gate: suite_green — all tests pass on BOTH runs (design §6)
// =================================================================================================
test('suiteGreen passes when both runs have zero failures and some passes', () => {
  const res = suiteGreen([
    { passed: 40, failed: 0, skipped: 0 },
    { passed: 40, failed: 0, skipped: 0 },
  ]);
  assert.equal(res.pass, true);
  assert.ok(typeof res.detail === 'string' || typeof res.detail === 'object', 'gate returns a detail');
});

test('suiteGreen fails when either run has a failure', () => {
  const res = suiteGreen([
    { passed: 39, failed: 1, skipped: 0 },
    { passed: 40, failed: 0, skipped: 0 },
  ]);
  assert.equal(res.pass, false, 'a single failure on either run fails the gate');
});

test('suiteGreen fails when a run has zero passing tests (an empty green is not green)', () => {
  const res = suiteGreen([
    { passed: 0, failed: 0, skipped: 0 },
    { passed: 0, failed: 0, skipped: 0 },
  ]);
  assert.equal(res.pass, false, 'zero passes is not a green suite');
});

test('suiteGreen fails on a single-run array (both runs are required by the "BOTH double-runs" contract)', () => {
  // The gate contract ("Two independent dotnet test runs") requires >= 2 runs. A caller supplying
  // exactly one passing run must get pass: false — the gate enforces its own invariant.
  const res = suiteGreen([{ passed: 40, failed: 0, skipped: 0 }]);
  assert.equal(res.pass, false, 'one run is not enough — gate requires both runs to be present');
});

// =================================================================================================
// Gate: no_flaky — identical pass/fail/skip counts across the two runs (design §6)
// =================================================================================================
test('noFlaky passes when both runs report identical counts', () => {
  const res = noFlaky([
    { passed: 40, failed: 0, skipped: 0 },
    { passed: 40, failed: 0, skipped: 0 },
  ]);
  assert.equal(res.pass, true);
});

test('noFlaky fails when the two runs disagree on any count (flaky suite)', () => {
  const res = noFlaky([
    { passed: 40, failed: 0, skipped: 0 },
    { passed: 39, failed: 1, skipped: 0 },
  ]);
  assert.equal(res.pass, false, 'differing pass/fail counts across runs = flaky');
});

// =================================================================================================
// Gate: mutation_floor — per-file REACHABLE kill-rate >= floor, from the Stryker JSON (design §6)
// =================================================================================================
// Fixture mirrors the real Stryker report SHAPE (schemaVersion 2): `files` keyed by ABSOLUTE path, each
// file entry has `mutants: [{ status, location: { start:{line}, end:{line} } }]`. Stryker's kill-rate
// denominator is Killed+Survived+Timeout+NoCoverage (Ignored/CompileError/Pending are excluded). This
// gate further EXCLUDES reachable-survivors on the KB-pre-documented dead lines from the denominator.
const SRC_PATH = 'D:\\src\\sprint-rituals\\src\\Services\\Fokus\\Fokus.Domain\\Analytics\\BugRatioAnalyzer.cs';
const OTHER_PATH = 'D:\\src\\sprint-rituals\\src\\Services\\Fokus\\Fokus.Domain\\Analytics\\HealthScoreCalculator.cs';

function mut(status, line) {
  return { status, location: { start: { line, column: 1 }, end: { line, column: 9 } } };
}

// A report where BugRatioAnalyzer.cs has 8 killed + 2 survived (both on LIVE lines) = 80% kill of 10
// reachable mutants. HealthScoreCalculator.cs is also present (blended aggregate would be meaningless —
// the gate must read the PER-FILE entry, not the whole-array aggregate).
function reportFloorPass() {
  return {
    schemaVersion: '2',
    files: {
      [SRC_PATH]: {
        language: 'cs',
        mutants: [
          mut('Killed', 35), mut('Killed', 48), mut('Killed', 76), mut('Killed', 95),
          mut('Killed', 145), mut('Killed', 165), mut('Killed', 272), mut('Killed', 334),
          mut('Survived', 35), mut('Survived', 272), // 2 survivors on LIVE lines
        ],
      },
      [OTHER_PATH]: {
        language: 'cs',
        // All survived — if the gate blended this in, BugRatio would never pass. It must be IGNORED.
        mutants: [mut('Survived', 10), mut('Survived', 11), mut('Survived', 12)],
      },
    },
  };
}

test('mutationFloor reads the PER-FILE BugRatio score (not the blended aggregate) and passes at >=75', () => {
  const res = mutationFloor(reportFloorPass(), SRC_PATH, { floor: 75, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES });
  assert.equal(res.pass, true, '8 killed / 10 reachable = 80% >= 75 floor');
  assert.equal(res.detail.scorePct, 80, 'per-file reachable kill rate is 80%, computed from the BugRatio entry alone');
  assert.equal(res.detail.killed, 8);
  assert.equal(res.detail.reachableDenominator, 10, 'denominator excludes only Ignored-type, both survivors are on live lines');
});

test('EXPECTED_SURVIVOR_LINES holds the three KB-pre-documented dead lines (L17, L133, L268)', () => {
  // BugRatioAnalyzer.cs: startIndex destructured-unused at L17 & L133, the `completedSp == 0` streak guard
  // at L268 — all flagged in bug-ratio.md Edge Cases. These survivors are EXPECTED, excluded from the floor.
  assert.deepEqual([...EXPECTED_SURVIVOR_LINES].sort((a, b) => a - b), [17, 133, 268]);
});

test('mutationFloor EXCLUDES survivors on KB-pre-documented dead lines from the denominator', () => {
  // 7 killed + 1 survivor-on-L268 (dead) + 0 other survivors. WITHOUT exclusion: 7/8 = 87%. WITH exclusion
  // the L268 survivor leaves the denominator: 7/7 = 100%. The exclusion is what the Domain policy requires.
  const report = {
    schemaVersion: '2',
    files: {
      [SRC_PATH]: {
        language: 'cs',
        mutants: [
          mut('Killed', 35), mut('Killed', 48), mut('Killed', 76), mut('Killed', 95),
          mut('Killed', 145), mut('Killed', 165), mut('Killed', 272),
          mut('Survived', 268), // expected-survivor on the `== 0` streak guard dead line
        ],
      },
    },
  };
  const res = mutationFloor(report, SRC_PATH, { floor: 75, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES });
  assert.equal(res.detail.killed, 7);
  assert.equal(res.detail.reachableDenominator, 7, 'the L268 dead-line survivor is excluded from the denominator');
  assert.equal(res.detail.expectedSurvivorsExcluded, 1);
  assert.equal(res.detail.scorePct, 100, '7/7 reachable = 100% once the expected-survivor is excluded');
  assert.equal(res.detail.reachableSurvivors.length, 0, 'no REACHABLE survivor remains to feed back to Cover');
  assert.equal(res.pass, true);
});

test('mutationFloor still counts a KILLED mutant on a dead line (killing it is fine, never dropped)', () => {
  // A killed mutant on L17 stays in both numerator and denominator — exclusion only drops dead-line SURVIVORS.
  const report = {
    schemaVersion: '2',
    files: { [SRC_PATH]: { language: 'cs', mutants: [mut('Killed', 17), mut('Killed', 35), mut('Survived', 35)] } },
  };
  const res = mutationFloor(report, SRC_PATH, { floor: 75, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES });
  assert.equal(res.detail.killed, 2, 'the killed mutant on dead-line L17 still counts as a kill');
  assert.equal(res.detail.reachableDenominator, 3, 'L17 kill stays in the denominator; only the L35 live survivor remains');
  assert.equal(res.detail.expectedSurvivorsExcluded, 0, 'no dead-line SURVIVOR to exclude');
});

test('mutationFloor fails below the floor and lists the reachable survivors for feedback', () => {
  // 6 killed + 4 live survivors = 60% < 75. The 4 reachable survivors must surface to feed back to Cover.
  const report = {
    schemaVersion: '2',
    files: {
      [SRC_PATH]: {
        language: 'cs',
        mutants: [
          mut('Killed', 35), mut('Killed', 48), mut('Killed', 76),
          mut('Killed', 95), mut('Killed', 145), mut('Killed', 165),
          mut('Survived', 35), mut('Survived', 48), mut('NoCoverage', 76), mut('Timeout', 95),
        ],
      },
    },
  };
  const res = mutationFloor(report, SRC_PATH, { floor: 75, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES });
  assert.equal(res.detail.scorePct, 60, '6 killed / 10 reachable = 60%');
  assert.equal(res.pass, false, '60% < 75 floor');
  assert.equal(res.detail.reachableSurvivors.length, 4, 'all 4 non-killed reachable mutants feed back (Survived/NoCoverage/Timeout)');
});

test('mutationFloor fails loud when the target file has no per-file Stryker entry (bad mutate glob)', () => {
  const report = { schemaVersion: '2', files: { [OTHER_PATH]: { language: 'cs', mutants: [mut('Killed', 10)] } } };
  const res = mutationFloor(report, SRC_PATH, { floor: 75, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES });
  assert.equal(res.pass, false, 'no BugRatio entry → gate fails, never silently passes');
  assert.match(res.detail.error, /no per-file Stryker entry/i, 'the missing-entry cause is surfaced');
});

test('mutationFloor fails when zero reachable mutants exist (nothing proven is not a pass)', () => {
  // Only Ignored mutants — denominator 0. A 0/0 must NOT be treated as 100% green.
  const report = {
    schemaVersion: '2',
    files: { [SRC_PATH]: { language: 'cs', mutants: [mut('Ignored', 35), mut('Ignored', 48)] } },
  };
  const res = mutationFloor(report, SRC_PATH, { floor: 75, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES });
  assert.equal(res.detail.reachableDenominator, 0);
  assert.equal(res.pass, false, '0 reachable mutants proves nothing → not a pass');
});

test('mutationFloor PASSES at exactly the floor (75%): 3 killed / 4 reachable = Math.round(0.75*100) = 75', () => {
  // Boundary pin at N: exactly 75% must pass. 3 killed + 1 survivor on a live line = 4 reachable.
  // Math.round(3/4 * 100) = Math.round(75.0) = 75 → scorePct === floor → pass: true.
  const report = {
    schemaVersion: '2',
    files: {
      [SRC_PATH]: { language: 'cs', mutants: [mut('Killed', 35), mut('Killed', 48), mut('Killed', 76), mut('Survived', 95)] },
    },
  };
  const res = mutationFloor(report, SRC_PATH, { floor: 75, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES });
  assert.equal(res.detail.scorePct, 75, '3/4 reachable = exactly 75%');
  assert.equal(res.pass, true, 'exactly at the floor is a pass (>= floor)');
});

test('mutationFloor FAILS at 74% (N-1 boundary): 14 killed / 19 reachable = Math.round(73.68...) = 74', () => {
  // Boundary pin at N-1: 74% must fail. 14 killed + 5 survivors on live lines = 19 reachable.
  // Math.round(14/19 * 100) = Math.round(73.68) = 74 → scorePct < floor → pass: false.
  const report = {
    schemaVersion: '2',
    files: {
      [SRC_PATH]: {
        language: 'cs',
        mutants: [
          mut('Killed', 30), mut('Killed', 31), mut('Killed', 32), mut('Killed', 33), mut('Killed', 34),
          mut('Killed', 35), mut('Killed', 36), mut('Killed', 37), mut('Killed', 38), mut('Killed', 39),
          mut('Killed', 40), mut('Killed', 41), mut('Killed', 42), mut('Killed', 43),
          mut('Survived', 50), mut('Survived', 51), mut('Survived', 52), mut('Survived', 53), mut('Survived', 54),
        ],
      },
    },
  };
  const res = mutationFloor(report, SRC_PATH, { floor: 75, expectedSurvivorLines: EXPECTED_SURVIVOR_LINES });
  assert.equal(res.detail.scorePct, 74, '14/19 reachable = 73.68% → rounds to 74%');
  assert.equal(res.pass, false, '74% < 75 floor → fails');
});

// =================================================================================================
// Gate: no_new_skips — skip count <= the MEASURED baseline, not a literal 0 (design §6 / MED-2)
// =================================================================================================
test('noNewSkips passes when the run skip count equals the measured baseline', () => {
  // Baseline measured at 0 today, but the gate reads it — it does not hard-code 0.
  const res = noNewSkips([{ passed: 40, failed: 0, skipped: 0 }, { passed: 40, failed: 0, skipped: 0 }], 0);
  assert.equal(res.pass, true);
});

test('noNewSkips passes when a NON-zero baseline is respected (baseline is read, not assumed 0)', () => {
  // If the baseline were 3 skips, a run with 3 skips must PASS — proves the gate reads the baseline.
  const res = noNewSkips([{ passed: 38, failed: 0, skipped: 3 }, { passed: 38, failed: 0, skipped: 3 }], 3);
  assert.equal(res.pass, true, 'skip count == baseline (3) passes — the baseline is measured, not 0');
});

test('noNewSkips fails when a run introduces a new skip above the baseline', () => {
  const res = noNewSkips([{ passed: 39, failed: 0, skipped: 1 }, { passed: 39, failed: 0, skipped: 1 }], 0);
  assert.equal(res.pass, false, 'a new skip above the baseline = the "skip the failing test" hack → fail');
});

// =================================================================================================
// Gate: char_pin — prod-source-touch PROXY over the PRE-SCOPED Fokus.Domain/** diff (design §6 / HIGH-1)
// =================================================================================================
// Q4 (CONFIRMED): char_pin is a PURE fn over a unified `git diff` already scoped to Fokus.Domain/** by the
// orchestrator (it has git; the helper stays deterministic). It passes iff that diff is EMPTY or consists
// SOLELY of `// Stryker disable`-only comment ADDITIONS on the analyzer; any other prod change fails. This
// is the documented PROXY — the true manifest-pin (hash the allowed-diff) is DEFERRED to Increment 3.
test('charPin passes on an empty prod-source diff (no production change at all)', () => {
  assert.equal(charPin('').pass, true);
  assert.equal(charPin('   \n  \n').pass, true, 'whitespace-only diff is still an empty diff');
});

test('charPin passes when the ONLY prod change is a `// Stryker disable` annotation addition', () => {
  const diff = [
    'diff --git a/src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs b/.../BugRatioAnalyzer.cs',
    '--- a/src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs',
    '+++ b/src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs',
    '@@ -267,6 +267,7 @@',
    '             // BR11: zero SP sprint resets streak',
    '+            // Stryker disable once all : KB-documented dead guard (== 0 streak), bug-ratio.md Edge Cases',
    '             if (completedSp == 0)',
  ].join('\n');
  const res = charPin(diff);
  assert.equal(res.pass, true, 'a Stryker-disable-only comment addition is the allowed prod diff');
});

test('charPin FAILS on a production logic change (== 0 → > 0)', () => {
  const diff = [
    '--- a/src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs',
    '+++ b/src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs',
    '@@ -267,3 +267,3 @@',
    '-            if (completedSp == 0)',
    '+            if (completedSp > 0)',
  ].join('\n');
  const res = charPin(diff);
  assert.equal(res.pass, false, 'a logic change to production source must fail the gate');
});

test('charPin FAILS when a logic change is bundled WITH an allowed annotation (any non-annotation line fails)', () => {
  const diff = [
    '--- a/src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs',
    '+++ b/src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs',
    '@@ -267,4 +267,5 @@',
    '+            // Stryker disable once all : looks allowed',
    '-            if (completedSp == 0)',
    '+            if (completedSp > 0)',
  ].join('\n');
  const res = charPin(diff);
  assert.equal(res.pass, false, 'one disallowed (logic) line fails even alongside an allowed annotation');
});

test('charPin FAILS on an added non-comment code line (not every addition is allowed)', () => {
  const diff = [
    '--- a/src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs',
    '+++ b/src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs',
    '@@ -334,2 +334,3 @@',
    '     private static bool IsBug(SprintMembership m) =>',
    '+        m.Ticket?.IssueType == "Defect" ||',
    '         m.Ticket?.IssueType == "Bug";',
  ].join('\n');
  assert.equal(charPin(diff).pass, false, 'an added production statement is not a Stryker-disable comment → fail');
});

test('charPin FAILS on an added non-Stryker comment (only Stryker-disable annotations are allowed)', () => {
  const diff = [
    '--- a/src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs',
    '+++ b/src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs',
    '@@ -16,2 +16,3 @@',
    '+        // TODO: clean up the unused startIndex',
    '         var (orderedStages, startIndex) = TransitionAttributionChecker.ResolveStartIndex(settings);',
  ].join('\n');
  assert.equal(charPin(diff).pass, false, 'a generic comment is not an allowed annotation — only `// Stryker disable` is');
});

// =================================================================================================
// Mutation ratchet — a kill-rate REGRESSION halts the run (design §6: regression = harness broken)
// =================================================================================================
test('mutationRatchet passes (continue) on the first iteration when there is no prior score', () => {
  const res = mutationRatchet(null, 80);
  assert.equal(res.pass, true, 'no prior score → nothing to regress against → continue');
});

test('mutationRatchet passes when the score holds or improves', () => {
  assert.equal(mutationRatchet(75, 75).pass, true, 'equal score is not a regression');
  assert.equal(mutationRatchet(75, 88).pass, true, 'an improved score continues');
});

test('mutationRatchet HALTS on a kill-rate regression (the harness is broken — do not continue)', () => {
  const res = mutationRatchet(88, 75);
  assert.equal(res.pass, false, 'a drop from 88% to 75% is a regression → halt');
  assert.match(res.detail, /regress/i, 'the halt reason names the regression');
});
