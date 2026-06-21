# Mine→Verify→Cover Harness — Increment 2 (Cover) — Review

This file carries the Increment-2 review. Increment-1's `review.md` is untouched (suffixed per the
Inc-2 instruction). Step 1 (done-check) is the architect's; Step 2 (code review) is the reviewer's.

## Step 1 — Done-Check

**Scope rule applied:** this increment's *buildable* scope is Steps 1–3 + the Step-4 Stryker
**config edit** only. Steps 4(run)/5/6/7 are **OPERATOR-OWED by design** (the developer subagent has
no `Workflow`/`agent` tool, no .NET toolchain, no commit role — ADR-18; the Inc-1 Step-4 precedent,
Q1 CONFIRMED). They are assessed as **correctly-deferred-and-documented**, not as missing
implementation. A step is marked `Missing` only if its *buildable* portion is incomplete.

**Pre-commitment predictions (made before reading implementation.md):** (1) operator-owed steps
mis-marked Missing — did not occur (scope rule honored); (2) the `.gitignore` edit uncalled-out —
did not occur (it is in `## Files Modified` and serves the Step-7 stray-file hazard); (3) the `tdd`
skill unlogged for the `TDD: yes` Step 3 — did not occur (both `nexus:tdd` and `nexus:boy-scout` are
in the scoped skill log).

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Fix stale Inc-1 target (re-grounding) | Implemented | `targets/bugratio.json` `class`/`source` → `BugRatioAnalyzer`; `mine-verify.workflow.js` `SRC`/`meta.description`/`target.class` flipped (L39/L28/L260, verified). `grep -r BugRatioCalculator harness/` → **zero hits** (verified). `source` resolves to live 386-line file on disk (verified). |
| 2 — Author Cover Workflow (`harness/cover.workflow.js`) | Implemented | 3-actor shape present: orchestrator JS + `coverPrompt` (L141) + `runnerPrompt` (L189), runner a distinct `agent()` call. Cover write-set = exactly `BugRatioAnalyzerTests.cs` + `BugRatioAnalyzerPropertyTests.cs` (L78/79). Clean-room held: "golden" appears **only** in orchestrator-side comments, in **neither** agent prompt (verified by grep). `node --check` parses clean. |
| 3 — Gate battery (`harness/lib/cover-gates.mjs`) — TDD | Implemented | 6 pure fns returning `{pass,detail}`: `suiteGreen`/`noFlaky`/`mutationFloor`/`noNewSkips`/`charPin`/`mutationRatchet`. Per-file (not aggregate) extraction, dead-line exclusion, **fail-loud** on missing per-file entry, 0-reachable ⇒ not-pass, char_pin classify, ratchet-halts — all present and grounded against a real on-disk `mutation-report.json` (schemaVersion 2). `EXPECTED_SURVIVOR_LINES=[17,133,268]` matches live source exactly (L17/L133 `startIndex`, L268 `completedSp==0` guard — verified by `sed`). Unit suite: **24/24 pass**; full CI glob **257 pass / 0 fail**. `tdd` skill: `nexus:tdd` + `nexus:boy-scout` in the scoped log (session `3ed1a863`, token `developer:implement`) — matches the `## Skills Used` claim. |
| 4 — Stryker mutate target + JSON reporter (**config edit only — buildable**) | Implemented | SR `stryker-config.json` verified live: `mutate` = `[HealthScoreCalculator.cs, BugRatioAnalyzer.cs]` (HealthScore kept); `reporters` = `["progress","html","json"]` (`"json"` added); `break:75`, `coverage-analysis:off`, `test-runner:mtp` confirmed unchanged. |
| 4(run) — initial `dotnet stryker` proving per-file JSON entry | N/A — operator-owed (correctly deferred) | Needs .NET toolchain. Documented under `## Operator Actions Required` with exact `cd … && dotnet stryker` invocation + per-file-entry acceptance + a `node -e` quick-check. mtp-required note carried. Correctly-deferred-and-documented. |
| 5 — Run Cover + iterate to floor | N/A — operator-owed (correctly deferred) | Needs `Workflow`/`agent`. Exact `Workflow({scriptPath})` invocation, the `git diff -- …Fokus.Domain/` char_pin seam, the triage/stop rules (≥75 reachable, no ratchet-to-100), and the five-gate acceptance all documented. Correctly-deferred-and-documented. |
| 6 — KB ledger flip + Cover cost capture | N/A — operator-owed (correctly deferred) | Depends on a real Step-5 run. Exact footer/index edits (supersede), cost capture, and `cover-bugratio.md` deliverable documented. Correctly-deferred-and-documented. |
| 7 — SR commit + increment close | N/A — operator-owed (correctly deferred) | Commits are the team lead's; needs Step-5 outputs. SR-only commit contents enumerated; stray-file hazard mitigated mechanically (`harness/.runs/` git-ignored, `git check-ignore` claim corroborated at `.gitignore:30`); dual-repo re-check required. **Nexus-side** Step-7 doc edits (`harness/README.md`, slug `roadmap.md`) done this round. No `plugins/**` change → no version bump (correct: `harness/` ships nothing). |

**Skill-conformance check (scored against `.claude/audit/skill-invocations.log`, scoped to
`developer:implement` token, session `3ed1a863`):** Step 3 is the only buildable step with a
non-`None` mapping (`TDD: yes`). `nexus:tdd` is logged (2026-06-21T20:50) — gate met. `nexus:boy-scout`
also logged (2026-06-21T20:56), matching the disclosed in-file refactor. Steps 1/2/4 are `Skill: None`
(legitimate gap — no Cover-authoring or gate-battery skill exists; logged to Skill Gaps for Inc-4),
so the all-`None` exemption applies to them. `## Skills Used` section present and corroborated by the
log — no fabrication, no missing-section gate.

**Deviations assessed — all valid:**
- Steps 4(run)/5/6/7 recorded as OPERATOR ACTION REQUIRED — sanctioned by Q1 + the Inc-1 precedent + ADR-18. Each carries exact invocation + per-gate acceptance. **Valid (plan-sanctioned deferral).**
- Step 3 built as per-gate TDD slices (not all-tests-then-all-code) — mandated by the `tdd` skill's one-test-at-a-time rule; same end state as the plan's Step-3 acceptance. **Valid (process, not scope).**
- Q2: Inc-1 `delivery/` records left frozen (accurate history, out of write-scope) — the binding acceptance is `harness/` → zero, which is met. **Valid (Q2-sanctioned; literal-prose deviation only).**
- `.gitignore` edit (`harness/.runs/`) — not a plan step but a mechanical pre-emption of the Step-7 runner-result-strand hazard the plan names; disclosed in `## Files Modified`. **Valid (supports a plan acceptance; no scope creep).**

**Open production gates surfaced (operator-owed, not done-check failures):** the entire honesty
value of this increment — the actual mutation kill ≥75, the five gates going green, the KB flip, the
#4 cost number — is **unproven until the operator runs Steps 4(run)–7.** The gate *logic* is fully
unit-tested (24 tests); the *orchestration* and the *live mutation result* are not (Carry-Over Finding
1). This is by design for a build-only round, but the team lead/operator must run the Cover Workflow
before the increment can be claimed complete. Two operator-watch items from the impl's Carry-Over:
confirm BugRatio mutants don't land as `Ignored` in the live Step-4(run) report (HealthScore baseline
had 5 `Ignored`), and update `BASELINE_SKIPS` if the suite ever gains a legitimate skip.

**Verdict: PASS** — all buildable steps (1, 2, 3, 4-config) Implemented; operator-owed steps
(4-run, 5, 6, 7) correctly-deferred-and-documented per Q1/ADR-18; skill-conformance met; no `Missing`.

*Status: COMPLETE — architect, 2026-06-21*

## Step 2 — Code Review

## Reviewed By
Reviewer agent (nexus:reviewer) — live code read + CI test run (node --test), 2026-06-21.

## Verdict: APPROVED

## Pre-commitment Predictions

1. **`suiteGreen` single-run permissiveness** — predicted: `runs.length >= 1` is looser than the plan's "BOTH double-runs" contract. CONFIRMED. Mitigation: the runner schema (`minItems: 2`) prevents it in production. LOW finding.
2. **`charPin` handling of `diff --git` header** — predicted: might be wrongly treated as a deletion. REFUTED. `isDiffMetaLine` catches `startsWith('diff ')`, filtering it before the `-` prefix check.
3. **`noFlaky` single-run behavior** — predicted: might pass on a single run. REFUTED. `noFlaky` requires `runs.length >= 2`, so it fails on a single run.
4. **`mutationFloor` boundary test at exactly 75%** — predicted: no test at exactly the floor. CONFIRMED. Tests cover 80% (pass) and 60% (fail) but not exactly 75%. LOW gap.
5. **`readProdSourceDiffPlaceholder` as security hole** — predicted: the placeholder always returns empty, effectively disabling the char_pin gate at runtime. EVALUATED. It is clearly documented and the operator instruction is explicit. By design (Q4 seam / Step 5 operator note). LOW disclosed caveat, not a finding.

## Findings

### [LOW] `suiteGreen` gate accepts a single-run array (looser than the "BOTH double-runs" contract)
**File:** `harness/lib/cover-gates.mjs:29`
**Origin:** implementation
**Issue:** `suiteGreen` requires `runs.length >= 1`, but its JSDoc contract says "Two independent dotnet test runs" and the plan defines the gate as "all tests pass on BOTH runs." A caller supplying a single passing run would get `pass: true`. In production this cannot occur (the runner schema enforces `minItems: 2`), but the pure function doesn't enforce its own invariant — a test or crafted caller could be misled.
**Fix:** Change the condition to `runs.length >= 2 && ...` to align the gate's self-enforcement with its stated contract. Add a test: `suiteGreen([{ passed: 40, failed: 0, skipped: 0 }])` should return `pass: false`.
**Confidence:** 90/100

### [LOW] No boundary test at exactly the mutation floor (75%)
**File:** `tests/unit/cover-gates.test.mjs` (gap — no test case)
**Origin:** implementation
**Issue:** The `mutationFloor` tests cover 80% (passes) and 60% (fails) but there is no test at exactly 75% (should pass) or 74% (should fail). Threshold-logic boundary tests at N and N−1 are required by the review checklist. The `>= floor` condition is correct, but boundary coverage would pin the floor value explicitly in the test suite.
**Fix:** Add two tests: one with a fixture producing exactly 75% (e.g. 6 killed / 8 reachable = 75.0% → `Math.round` = 75 — passes) and one at 74% (7 killed / 9.45... → need integer counts: e.g., 7 killed + 9 denominator = 78%, or better: 6 killed + 1 survivor = 6/7... a clean 74% would be 74 killed / 100 = `scorePct = 74` → fails). Concretely: 3 killed / 4 reachable = `Math.round(0.75 * 100)` = 75 (passes); 2 killed / 3 reachable = `Math.round(0.667 * 100)` = 67 (fails at 75 floor); for a cleaner near-boundary: 14 killed / 19 reachable = 73.7% → 74 (fails).
**Confidence:** 87/100

## Positive Observations

- **Gate logic correctness is excellent.** All six pure functions (`suiteGreen`, `noFlaky`, `mutationFloor`, `noNewSkips`, `charPin`, `mutationRatchet`) implement the §6 design precisely. The per-file extraction (not aggregate) in `mutationFloor` correctly addresses HIGH-2 from the plan's critic pass. The dead-line exclusion correctly drops only *survivors* on those lines while counting *killed* mutants on the same lines.
- **`charPin` is thorough.** The meta-line filter (`isDiffMetaLine`) covers all unified-diff header forms including `diff --git`, `---`, `+++`, `@@`, `index `, `new file mode`, `deleted file mode`, `rename `, `similarity index`, `\\ No newline`. The six test cases drive every distinct scenario (empty, Stryker-only, logic change, bundled, added code, non-Stryker comment).
- **`mutationFloor` fail-loud on missing entry.** The gate returns a structured error with a human-readable message when the target file has no per-file Stryker entry (line 82–91). This is the correct reward-hacking defense — a bad mutate glob never silently passes.
- **0-reachable denominator handled correctly.** `reachableDenominator === 0` → `scorePct = 0` → `pass: false`. The test at line 186 confirms this. Correctly guards against an empty mutant list (Ignored-only) being treated as a perfect score.
- **Three-actor separation in the Cover Workflow is faithfully implemented.** The Cover agent's prompt (lines 148–184) forbids touching `BugRatioAnalyzer.cs`, `stryker-config.json`, the KB, and gate infra. The runner is a distinct `agent()` call (line 228 vs 218). The golden set path appears nowhere in either agent prompt (verified in the done-check).
- **TDD discipline was followed.** The `## TDD cycle log` in implementation.md records red→green→refactor for each of the six gate slices. The `_notYet` stub removal in the refactor phase is documented. `nexus:tdd` and `nexus:boy-scout` both logged.
- **Stryker JSON schema grounded against a real report.** The implementation notes that the gate was built against a real `mutation-report.json` on disk (schemaVersion 2), not the design doc. This directly prevents schema mismatch bugs and correctly captures the absolute-path keying and `Ignored` status semantics.
- **CI is fully green.** `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → **257 pass / 0 fail / 0 skip** (verified in this review session). The 24 new tests in `cover-gates.test.mjs` are all passing.
- **Step 1 re-grounding: zero stale literals.** `Get-ChildItem -Recurse harness/ | Select-String BugRatioCalculator` → **no output** (verified). The `bugratio.json` class/source and the three `mine-verify.workflow.js` literals (L39 `SRC`, L28 `meta.description`, L260 `target.class`) are all updated.
- **`.gitignore` entry for `harness/.runs/`** correctly pre-empts the Step-7 stray-file hazard mechanically. The comment in `.gitignore` explains why.
- **SR stryker-config.json** confirms: `mutate` = `[HealthScoreCalculator.cs, BugRatioAnalyzer.cs]`, `reporters` = `["progress", "html", "json"]`, `break: 75`, `coverage-analysis: off`, `test-runner: mtp`. All plan requirements met.

## Gaps

- **`suiteGreen` single-run path untested and gate contract looser than spec.** Documented as LOW finding above. Mitigated in production by the runner schema (`minItems: 2`), but the pure function is miscalibrated relative to its own doc.
- **No boundary test at exactly the mutation floor (75%).** Documented as LOW finding above.
- **`readProdSourceDiffPlaceholder()` always returns empty diff.** This is the Q4 seam — the operator replaces it with the real scoped diff at Step-5 run time. It is correctly documented in the workflow header and implementation.md, and the Operator Actions Required section gives the exact `git diff -- src/Services/Fokus/Fokus.Domain/` command. Not a gap in the code, but a runtime discipline requirement the operator must follow. The Carry-Over Finding (no_new_skips baseline) is noted — `BASELINE_SKIPS = 0` is the known current value, not a hard-coded literal inside the gate (gate reads a supplied baseline, non-zero-baseline unit test confirms this).

## Carry-Over Findings — Addressed

| Carry-Over | Disposition |
|------------|-------------|
| Cover Workflow validated only by `node --check` + import-resolution, never live-run | CONFIRMED. The gate *logic* is fully unit-tested (24/24). The orchestration and the live mutation result are operator-owed (Steps 4-run/5). This is the correct design per Q1/ADR-18. Not a code defect — a disclosed architectural boundary. |
| `char_pin` is a proxy, not a manifest pin | CONFIRMED. Module header explicitly states "PROXY, not a manifest pin — deferred to Increment 3." Plan §6 caveat, by design. No claim of manifest pin is made. |
| `no_new_skips` baseline pinned at 0 in the Workflow (`BASELINE_SKIPS`) | CONFIRMED benign. The constant is the measured current value; the gate itself reads a supplied baseline (proven by the non-zero-baseline unit test at line 206). If the suite gains a legitimate skip, the operator updates `BASELINE_SKIPS`. |
| `mutationFloor` denominator uses standard Stryker semantics (Ignored/CompileError/Pending excluded) | CONFIRMED correct. The gate is grounded against a real `mutation-report.json` (schemaVersion 2) from the SR tree. The HealthScore baseline had 5 `Ignored` mutants — the choice to exclude them from the denominator is not an assumption, it is observed behavior. The live Step-4(run) report should be checked to confirm BugRatio mutants similarly avoid landing as `Ignored`. Operator watch item — not a code defect. |

## Open Questions

None — all carry-over findings confirmed or refuted; all low-confidence concerns resolved through code inspection.

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Unit tests — CI glob | PASS | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 257 pass / 0 fail / 0 skip; 24 new cover-gates tests included |
| Step 1: no stale BugRatioCalculator in harness/ | PASS | `Get-ChildItem -Path harness -Recurse | Select-String BugRatioCalculator` | No output (zero hits) |
| SR stryker-config.json mutate + reporters | PASS | Read `D:\src\sprint-rituals\...stryker-config.json` | `mutate` = [HealthScoreCalculator, BugRatioAnalyzer]; `reporters` = [progress, html, json]; break=75; coverage-analysis=off; test-runner=mtp |
| `node --check` on workflow | PASS (disclosed) | Reported by developer | Parses clean; runtime constraints (globals) validated only at operator run time |
| cover-gates.mjs correctness | PASS | Code read (all 6 gates) | Per-file extraction correct; dead-line exclusion correct; fail-loud on missing entry; 0-reachable → not-pass; char_pin meta-line filter comprehensive |

*Status: COMPLETE — reviewer, 2026-06-21*
