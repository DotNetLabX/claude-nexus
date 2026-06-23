// cover-gates.mjs — the harness's Cover §6 gate battery (Increment 2, Step 3).
//
// Design §6 (honesty battery + reward-hacking defense): these are DETERMINISTIC, pure functions over the
// runner agent's JSON output. The ORCHESTRATOR computes them (cover.workflow.js) — no agent self-reports a
// gate. Each gate returns { pass: boolean, detail: object } so the orchestrator can both branch and log.
//
// The five gates (design §6) + the mutation ratchet:
//   suiteGreen     — all tests pass on BOTH double-runs
//   noFlaky        — identical pass/fail/skip counts across the two runs
//   mutationFloor  — per-file kill-rate >= floor of REACHABLE mutants (KB-pre-documented dead-code
//                    survivors excluded from the denominator), read from the Stryker JSON (schemaVersion 2)
//   noNewSkips     — skip count <= the MEASURED baseline (read it; do not assert a literal 0)
//   charPin        — prod-source-touch PROXY: the only allowed Fokus.Domain/** diff is `// Stryker disable`
//                    -only comment additions on KB-pre-documented dead lines; any other prod change fails
//   mutationRatchet— a kill-rate REGRESSION halts the run (the harness is broken — do not continue)
//
// char_pin caveat (design §6): this is the documented PROXY. The true manifest-pin (hash the allowed-diff)
// is DEFERRED to Increment 3 — this module does NOT claim a manifest pin.

// =================================================================================================
// suite_green — all tests pass on BOTH runs (design §6)
// =================================================================================================
/**
 * @param {{passed:number,failed:number,skipped:number}[]} testRuns  Two independent `dotnet test` runs.
 * @returns {{pass:boolean, detail:object}}
 */
export function suiteGreen(testRuns) {
  const runs = testRuns ?? [];
  const everyGreen = runs.length >= 2 && runs.every((r) => r.failed === 0 && r.passed > 0);
  return {
    pass: everyGreen,
    detail: { runs: runs.map((r) => ({ passed: r.passed, failed: r.failed })) },
  };
}

// =================================================================================================
// no_flaky — identical pass/fail/skip counts across the two runs (design §6)
// =================================================================================================
/**
 * @param {{passed:number,failed:number,skipped:number}[]} testRuns  Two independent `dotnet test` runs.
 * @returns {{pass:boolean, detail:object}}
 */
export function noFlaky(testRuns) {
  const runs = testRuns ?? [];
  const key = (r) => `${r.passed}/${r.failed}/${r.skipped}`;
  const keys = runs.map(key);
  const identical = runs.length >= 2 && keys.every((k) => k === keys[0]);
  return { pass: identical, detail: { counts: keys } };
}
// =================================================================================================
// mutation_floor — per-file REACHABLE kill-rate >= floor, read from the Stryker JSON (design §6 / HIGH-2)
// =================================================================================================
// Stryker computes ONE aggregate score over the whole `mutate` array, so with HealthScore also present the
// aggregate is meaningless for a BugRatio gate. This gate reads the PER-FILE entry for the target source
// and computes the kill-rate over REACHABLE mutants only:
//   killed       = mutants with status Killed
//   reachable    = Killed + Survived + Timeout + NoCoverage  (standard Stryker denominator)
//                  MINUS any survivor whose line is a KB-pre-documented dead line (expected-survivor)
//   excluded     = Ignored / CompileError / Pending  (never in the denominator) + expected-survivors
//   scorePct     = round(killed / reachable * 100)  (0 reachable → scorePct 0, pass=false: nothing proven)

// Stryker statuses that count toward the kill-rate denominator (the "covered + run" mutants).
const DENOMINATOR_STATUSES = new Set(['Killed', 'Survived', 'Timeout', 'NoCoverage']);

function mutantLine(m) {
  return m?.location?.start?.line ?? null;
}

/**
 * @param {object} strykerReport  Parsed Stryker JSON (schemaVersion 2): { files: { <absPath>: { mutants } } }.
 * @param {string} sourcePath     Absolute path of the target source file (the key into `files`).
 * @param {{floor:number, expectedSurvivorLines?:number[]}} opts
 * @returns {{pass:boolean, detail:object}}  detail carries scorePct, killed, reachableDenominator,
 *          expectedSurvivorsExcluded, and reachableSurvivors (the feedback list for the Cover loop).
 */
export function mutationFloor(strykerReport, sourcePath, opts) {
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
// =================================================================================================
// target_mutated — the Stryker report ACTUALLY mutated the target file (anti-fake-green, Inc-3 Step 9)
// =================================================================================================
// Why this exists: the orchestrator fabricates `{ files: { [SRC]: runner-returned mutants } }` and trusts
// the runner to have extracted the TARGET file's mutants. A config drift (Stryker's `mutate` glob pointing
// at a different class) or a runner error makes Stryker mutate file A while the gate scores those mutants
// AS IF they were the target's — a silent FAKE GREEN (observed live: CycleTime "100%" was actually
// BugRatio's 177 mutants; CycleTime had 0). This gate is the independent cross-check: from a faithful
// per-file mutant-count summary (every file in the report with ≥1 mutant), assert the TARGET basename is
// present with count > 0. If the target was never mutated, the kill-rate proves nothing → FAIL the run.
/**
 * @param {{file:string,count:number}[]} mutatedFiles  Per-file mutant counts straight from the Stryker
 *        report — EVERY file with ≥1 mutant. The runner returns this independently of the scored `mutants`.
 * @param {string} sourcePath  Absolute path of the target source file.
 * @returns {{pass:boolean, detail:object}}
 */
export function targetMutated(mutatedFiles, sourcePath) {
  const base = (p) => (p ?? '').split(/[\\/]/).pop();
  const target = base(sourcePath);
  const list = mutatedFiles ?? [];
  const entry = list.find((f) => base(f.file) === target);
  const count = entry?.count ?? 0;
  const detail = { target, count, mutatedFiles: list.map((f) => `${base(f.file)}:${f.count}`) };
  if (count <= 0) {
    detail.error = `target ${target} was NOT mutated (0 mutants in the Stryker report) — the mutate scope is wrong or Stryker mutated a different file; the kill-rate cannot be trusted (fake-green guard)`;
  }
  return { pass: count > 0, detail };
}

// =================================================================================================
// no_new_skips — skip count <= the MEASURED baseline (design §6 / MED-2: read the baseline, not 0)
// =================================================================================================
/**
 * Catches the "skip the failing test" hack. The baseline is the project's MEASURED skip count at Cover
 * time (0 today, but read — never asserted as a literal 0). The gate uses the MAX skip across the runs.
 * @param {{skipped:number}[]} testRuns
 * @param {number} baselineSkips  The measured baseline skip count.
 * @returns {{pass:boolean, detail:object}}
 */
export function noNewSkips(testRuns, baselineSkips) {
  const runs = testRuns ?? [];
  const maxSkips = runs.length ? Math.max(...runs.map((r) => r.skipped ?? 0)) : 0;
  return { pass: maxSkips <= baselineSkips, detail: { maxSkips, baselineSkips } };
}
// =================================================================================================
// char_pin — prod-source-touch PROXY over the PRE-SCOPED Fokus.Domain/** diff (design §6 / HIGH-1, Q4)
// =================================================================================================
// PROXY, not a manifest pin (the true hash-the-allowed-diff is DEFERRED to Increment 3 — design §6 caveat;
// this function does NOT claim a manifest pin). Pure fn over a unified `git diff` ALREADY scoped to
// Fokus.Domain/** by the orchestrator (Q4 seam — the helper does not run git; it classifies diff lines).
// PASS iff the diff is empty OR every changed CONTENT line is an ADDITION of a `// Stryker disable`-only
// comment. Any removed content line, or any added line that is not a Stryker-disable comment, FAILS.

// An added line whose trimmed content is a Stryker-disable annotation, e.g.
//   // Stryker disable once all : <reason>   /   // Stryker disable all
const STRYKER_DISABLE_RE = /^\/\/\s*Stryker\s+disable\b/i;

function isDiffMetaLine(line) {
  // Unified-diff headers that are NOT content changes.
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

/**
 * @param {string} prodSourceDiff  Unified `git diff` PRE-SCOPED to Fokus.Domain/** (empty string = no change).
 * @returns {{pass:boolean, detail:object}}
 */
export function charPin(prodSourceDiff) {
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
      // A removed production line is a real prod-source change — never allowed by the proxy.
      disallowed.push(raw);
      continue;
    }
    // Added line: allowed ONLY if its content is a `// Stryker disable` comment.
    const content = raw.slice(1).trim();
    if (!STRYKER_DISABLE_RE.test(content)) disallowed.push(raw);
  }
  return { pass: disallowed.length === 0, detail: { changedLines, disallowed } };
}
// =================================================================================================
// mutation ratchet — a kill-rate REGRESSION halts the run (design §6: regression ⇒ harness broken)
// =================================================================================================
/**
 * The suite mutation score must never regress across iterations. A regression means the harness is broken
 * (e.g. a test was lost or weakened) → HALT, do not continue. `detail` is a human string (the orchestrator
 * logs it on halt).
 * @param {number|null} priorScore   The previous iteration's per-file score (null on the first iteration).
 * @param {number} currentScore      This iteration's per-file score.
 * @returns {{pass:boolean, detail:string}}  pass=true means "continue"; pass=false means "halt".
 */
export function mutationRatchet(priorScore, currentScore) {
  if (priorScore === null || priorScore === undefined) {
    return { pass: true, detail: `first iteration — no prior score to regress against (current ${currentScore}%)` };
  }
  if (currentScore < priorScore) {
    return { pass: false, detail: `mutation kill regressed ${priorScore}% → ${currentScore}% (harness broken — halt)` };
  }
  return { pass: true, detail: `kill held/improved ${priorScore}% → ${currentScore}%` };
}

// The KB-pre-documented dead lines in BugRatioAnalyzer.cs whose mutant SURVIVORS are expected-survivors —
// excluded from the mutation_floor denominator, NOT chased with tests (Domain section / bug-ratio.md Edge
// Cases). Confirmed against live source: `startIndex` destructured-unused at L17 & L133; the
// `if (completedSp == 0) break;` streak guard at L268. The orchestrator (never the Cover agent) annotates
// these with `// Stryker disable once all` at run time; this list is the gate-time exclusion set.
export const EXPECTED_SURVIVOR_LINES = [17, 133, 268];
