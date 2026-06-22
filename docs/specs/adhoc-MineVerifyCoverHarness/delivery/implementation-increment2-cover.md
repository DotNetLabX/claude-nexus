# Mine→Verify→Cover Harness — Increment 2 (Cover) — Implementation

**Plan:** `docs/specs/adhoc-MineVerifyCoverHarness/delivery/plan-increment2-cover.md` (Increment 2 — NOT
`plan.md`, which is Increment 1, already shipped).
**Phase-1 questions:** `questions-increment2-cover.md` — Q1–Q4 all CONFIRMED before this build.

## Build/run split (Q1 CONFIRMED — read first)

The developer subagent has **no `Workflow`/`agent` tool** and **no .NET toolchain / commit role** (ADR-18).
Per Q1 (CONFIRMED), this round **builds**:
- **Step 1** — fix the stale Inc-1 target (file edits + grep gate).
- **Step 2** — `harness/cover.workflow.js` (authored as a committed, runnable file — not *run* here).
- **Step 3** — `harness/lib/cover-gates.mjs` + `tests/unit/cover-gates.test.mjs` (TDD, fully verifiable via `node --test`).
- **Step 4 (config edit only)** — the `stryker-config.json` edit in SR (a plain file edit).

…and records as **OPERATOR ACTION REQUIRED** (the Inc-1 Step-4 precedent), with exact invocations + per-gate
acceptance, the steps that need `Workflow` / the .NET toolchain / a commit:
- **Step 4 (initial Stryker run)** — proves the JSON report carries a per-file BugRatio entry.
- **Step 5** — the live Cover Workflow run (spawns Cover + runner agents; iterates to the floor).
- **Step 6** — Cover cost capture + KB ledger flip (depends on a real Step-5 run's numbers).
- **Step 7** — the SR commit + increment close.

All four operator-owed steps are detailed under **## Operator Actions Required** below.

## Files Created
- `harness/cover.workflow.js` — the Cover Workflow (3-actor: orchestrator + Cover agent + runner agent), runnable via `Workflow({ scriptPath })`. (Step 2)
- `harness/lib/cover-gates.mjs` — the §6 gate battery as pure functions over runner JSON output (5 gates + mutation ratchet). (Step 3)
- `tests/unit/cover-gates.test.mjs` — TDD unit suite driving every gate (pass + deliberate-fail fixtures, per-file score extraction, char_pin classify cases, ratchet-regression-halts). Inside the CI glob. (Step 3)

## Files Modified
- `harness/targets/bugratio.json` — `class` + `source` re-grounded from the stale `BugRatioCalculator` to the live `BugRatioAnalyzer` (renamed since the pilot). (Step 1)
- `harness/mine-verify.workflow.js` — `SRC` const + the `meta.description` label + the `target.class` literal updated `BugRatioCalculator` → `BugRatioAnalyzer`. (Step 1)
- `D:\src\sprint-rituals\src\Services\Fokus\Fokus.Domain.Tests\stryker-config.json` — added `**/Analytics/BugRatioAnalyzer.cs` to `mutate` (kept HealthScore — gate is per-file), added `"json"` to `reporters`. `break: 75` + `coverage-analysis: off` + `test-runner: mtp` already correct, confirmed unchanged. (Step 4 config edit)
- `harness/README.md` — status/contents updated to reflect Increment 2 (Cover) component. (Step 7, nexus-side doc)
- `.gitignore` — added `harness/.runs/` so the runner agent's nexus-side result files never strand in any commit (Step 2/7 hazard pre-emption).
- `docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md` — Increment 2 marked done (Step 7, slug-local roadmap per Q3).

## Step 1 — Fix the stale Inc-1 target (DONE)

The live production class is `BugRatioAnalyzer.cs`, not `BugRatioCalculator.cs` (renamed since the pilot;
confirmed: old path absent on disk, new path present — `BugRatioAnalyzer.cs`, 386 lines).

Updated:
- `harness/targets/bugratio.json` — `class` and `source` → `BugRatioAnalyzer` / `…\BugRatioAnalyzer.cs`.
- `harness/mine-verify.workflow.js` — three literals: the `SRC` const (L39), the `meta.description` text
  (L28), and the `target.class` in the return object (L260). `meta.name` (`mine-verify-bugratio`) carries
  no class literal — left as-is.

**Acceptance — MET:**
- `grep -rn BugRatioCalculator harness/` → **zero hits**.
- `targets/bugratio.json.source` resolves to an existing file on disk (`fs.existsSync` → true).

**Q2 (CONFIRMED) — `delivery/` records left frozen.** The plan's body mentions grepping `delivery/` too,
but the *binding* acceptance gate is `harness/` → zero. The Inc-1 `delivery/` occurrences
(`plan.md`, `implementation.md`, `communication-log.md`) are **accurate history** (Inc-1 ran against the
then-live `BugRatioCalculator.cs`) and are out of my write-scope per the Inc-2 suffixing instruction — not
rewritten. `plan-increment2-cover.md` references the rename intentionally — left.

## Step 2 — Author the Cover Workflow (`harness/cover.workflow.js`) (DONE)

A committed Workflow runnable via `Workflow({ scriptPath })`, with the **three-actor** shape (design §1 + §6):

- **Orchestrator** (the JS): reads the verified rules from `D:\src\sprint-rituals\docs\kb\bug-ratio.md`
  orchestrator-side; spawns the Cover agent then the runner agent (two distinct `agent()` calls); computes
  the §6 gate battery via the Step-3 helpers; owns the KB flip (Step 6, operator-owed). The
  `// Stryker disable` annotation on dead lines is applied by the orchestrator, never the Cover agent.
- **Cover agent** (`coverPrompt`): input = `BugRatioAnalyzer.cs` source + the verified KB rules + the current
  surviving-mutant list + `mutation-testing.md` (the FsCheck-3.x / MTP API contract — clean-room-safe, NOT the
  golden set). Its **only** writes are `BugRatioAnalyzerTests.cs` + `BugRatioAnalyzerPropertyTests.cs`. The
  prompt forbids touching `BugRatioAnalyzer.cs`, `stryker-config.json`, the gate infra, or the KB, and
  instructs: **a red-on-current-code test is kept + flagged as a candidate bug, never deleted.** It points at
  the HealthScore Cover (`HealthScoreCalculatorTests.cs`) + `MetricCardBuilderPropertyTests.cs` as the pattern.
- **Runner agent** (`runnerPrompt`): a **distinct** `agent()` call; double-runs `dotnet test` then runs
  `dotnet stryker`; `Write()`s structured results to `harness/.runs/cover-bugratio-run.json` — a **nexus-side,
  git-ignored** path (`.gitignore: harness/.runs/`), never into the SR tree (Step-7 stray-file hazard).

The bounded loop (≤5 iterations, floor ≥75 on reachable mutants) triages survivors: expected-survivors on
KB dead lines are excluded (not chased); reachable survivors feed back. The mutation ratchet halts on a
kill-rate regression. char_pin receives the prod-source diff **pre-scoped** by the orchestrator (Q4 seam).

**Acceptance — MET (mechanically verified):**
- The Workflow defines exactly the **3 actors** (orchestrator JS + `coverPrompt` + `runnerPrompt`).
- The Cover agent's write set is the **2 test files only** (`EXAMPLE_TESTS`, `PROPERTY_TESTS`); forbidden-list explicit.
- The **golden-set.md path appears nowhere** in the file, and the word "golden" appears in **neither agent
  prompt** (only orchestrator-side comments stating it is withheld). Verified by grep + per-prompt regex.
- The runner is a **distinct `agent()` call** from the Cover agent (two separate `await agent(...)`).
- `node --check harness/cover.workflow.js` → parses clean. (Like Inc-1's workflow it uses platform-injected
  ambient globals `phase/agent/read/log/budget`; not directly `node`-runnable, validated live at Step 5.)

**Key decision (Q4 seam, CONFIRMED):** `char_pin` is a **pure fn over a pre-scoped `Fokus.Domain/**` diff** —
the orchestrator (which has `git`) scopes `git diff -- src/Services/Fokus/Fokus.Domain/` before calling, so
the helper stays deterministic + CI-testable (Inc-1 helper-contract precedent). The Workflow carries a
`readProdSourceDiffPlaceholder()` returning the empty diff (→ char_pin passes when no prod change is staged);
the operator substitutes the real scoped diff at run time (see ## Operator Actions Required, Step 5).

## Step 3 — Gate battery as deterministic helpers (`harness/lib/cover-gates.mjs`) — TDD (DONE)

Built via the **`tdd` skill** (invoked — `TDD: yes`), red-green-refactor, one slice per gate. Six pure
functions over the runner's JSON output, each returning `{ pass, detail }`:

| Gate | Behavior | Key detail |
|------|----------|-----------|
| `suiteGreen(testRuns)` | all tests pass on BOTH runs (failed=0 AND passed>0 each) | empty-green (0 passes) is NOT green |
| `noFlaky(testRuns)` | identical pass/fail/skip triples across the two runs | — |
| `mutationFloor(report, src, {floor, expectedSurvivorLines})` | per-file REACHABLE kill ≥ floor, read from the Stryker JSON | reads the **per-file** entry (not the blended aggregate, HIGH-2); excludes dead-line survivors from the denominator; surfaces `reachableSurvivors` for feedback; **fails loud** on a missing per-file entry; 0 reachable ⇒ not a pass |
| `noNewSkips(testRuns, baselineSkips)` | max skip across runs ≤ the **measured** baseline | reads the baseline (MED-2), does not hard-code 0 |
| `charPin(prodSourceDiff)` | the only allowed `Fokus.Domain/**` diff is `// Stryker disable`-only additions | empty diff passes; any removed line or non-annotation addition fails (HIGH-1, Q4) |
| `mutationRatchet(prior, current)` | a kill-rate **regression** halts the run | `pass=true` ⇒ continue, `false` ⇒ halt; null prior ⇒ continue |

Plus `EXPECTED_SURVIVOR_LINES = [17, 133, 268]` — the KB-pre-documented dead lines (`startIndex` L17/L133,
`== 0` streak guard L268), confirmed against **live** `BugRatioAnalyzer.cs`.

**Stryker JSON grounding (decisive).** I inspected real Stryker reports already in the SR tree
(`Fokus.Domain.Tests/StrykerOutput/.../mutation-report.json`, schemaVersion 2) before writing the gate:
`files` is keyed by **absolute path**; each entry has `mutants: [{ status, location:{start:{line},end:{line}}, mutatorName, replacement }]`.
The kill-rate denominator follows standard Stryker semantics — `Killed+Survived+Timeout+NoCoverage`;
`Ignored`/`CompileError`/`Pending` are excluded — then dead-line survivors are further excluded.

**TDD cycle log (red→green→refactor, one gate per slice):**
1. `suiteGreen` — red (module ERR_MODULE_NOT_FOUND) → green.
2. `noFlaky` — red (stub throws) → green.
3. `mutationFloor` — red → green (per-file extraction); then dead-line-exclusion + killed-on-dead-line + below-floor-feedback + missing-entry + zero-reachable cases, each red→green.
4. `noNewSkips` — red → green (incl. a non-zero-baseline case proving the baseline is read).
5. `charPin` — red → green (empty / annotation-only / logic-change / bundled / added-code / non-Stryker-comment cases).
6. `mutationRatchet` — red → green (first-iter / hold / improve / regression-halts).
**Refactor (while green):** removed the now-unused `_notYet` TDD stub helper.

**Acceptance — MET:**
- Each gate is a pure fn returning `{pass, detail}`.
- `tests/unit/cover-gates.test.mjs` drives **every gate** (pass + deliberate-fail fixtures), the per-file
  score extraction from a fixture Stryker JSON, the allowed-`Stryker disable`-diff vs disallowed-logic-diff
  char_pin cases, and the ratchet-regression-halts case.
- **Runs inside the CI glob** (`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`): the new file
  contributes **24 tests**; full glob **257 pass / 0 fail** — no collisions, no regressions.

**char_pin caveat (recorded, design §6):** this is the documented **proxy**; the true manifest-pin (hash
the allowed-diff) is **deferred to Inc 3**. The module's header comment states this — no manifest pin is claimed.

## Step 4 — Stryker mutate target + JSON reporter (config edit) (DONE)

Edited `D:\src\sprint-rituals\src\Services\Fokus\Fokus.Domain.Tests\stryker-config.json`:
- (a) added `**/Analytics/BugRatioAnalyzer.cs` to the `mutate` array (kept `HealthScoreCalculator.cs` —
  the gate is per-file per Step 3, so re-verifying HealthScore is free).
- (b) added `"json"` to `reporters` (was `["progress","html"]`) — `mutation_floor` needs the machine-readable
  per-file score and there was no json reporter before.
- (c) confirmed `break: 75`, `coverage-analysis: off`, `test-runner: mtp` — all already correct, left unchanged.

**Acceptance (config portion) — MET:** `stryker-config.json.mutate` now contains `BugRatioAnalyzer.cs`;
`reporters` contains `"json"`. The **initial `dotnet stryker` run** that proves the JSON report carries a
per-file `BugRatioAnalyzer.cs` entry is **operator-owed** (needs the .NET toolchain) — see
## Operator Actions Required, Step 4(run).

*(Steps 5–7 are operator-owed — see ## Operator Actions Required below.)*

## Operator Actions Required

Per **Q1 (CONFIRMED)** + the Inc-1 Step-4 precedent: the steps below need the `Workflow`/`agent` tools, the
.NET toolchain, and/or the commit role (ADR-18) — none available to the developer subagent. Each is listed
with its **exact invocation** + **per-gate acceptance** for the team lead (orchestrator) to execute.

### Step 4(run) — OPERATOR ACTION REQUIRED: prove the Stryker JSON carries a per-file BugRatio entry
The config edit (Step 4 a/b/c) is **done**. The **initial run** proving the JSON report has a per-file
`BugRatioAnalyzer.cs` entry needs the .NET toolchain:
```
cd D:\src\sprint-rituals\src\Services\Fokus\Fokus.Domain.Tests
dotnet stryker          # MTP runner — emits StrykerOutput/<ts>/reports/mutation-report.json (schemaVersion 2)
```
**Acceptance:** the emitted `mutation-report.json` `files` object has a key ending `…\BugRatioAnalyzer.cs`
with a non-empty `mutants` array. (Quick check: `node -e "const r=require('<path>');console.log(Object.keys(r.files).find(k=>k.includes('BugRatioAnalyzer.cs')))"`.)
**Runner note (plan Step 4):** `test-runner: mtp` is **required** for xUnit v3 — there is no fallback runner.
If Stryker fails to enumerate BugRatio mutants, the cause is the `mutate` glob or a missing
`coverage-analysis: off` — **fix the config, do not switch the runner.**

### Step 5 — OPERATOR ACTION REQUIRED: run the Cover Workflow + iterate to the floor
Needs `Workflow` (spawns the Cover + runner agents). The Workflow is built + committed:
```
Workflow({ scriptPath: "D:\\src\\claude-plugins\\nexus\\harness\\cover.workflow.js" })
```
The orchestrator must, at gate time, supply the **pre-scoped prod-source diff** to `char_pin` (Q4 seam — the
Workflow ships a `readProdSourceDiffPlaceholder()` returning the empty diff; replace it with the real scoped
diff at run time):
```
git -C D:\src\sprint-rituals diff -- src/Services/Fokus/Fokus.Domain/
```
**Triage rule (plan Step 5):** a survivor on a KB-pre-documented dead line (`startIndex` L17/L133, the
`== 0` streak guard L268) is an **expected-survivor** — the orchestrator applies
`// Stryker disable once all : <reason>` (comment-only, never the Cover agent) and `mutation_floor` already
excludes those lines from the denominator. Every **reachable** survivor feeds back to the Cover agent. Loop
until per-file reachable `mutation_floor` ≥ 75 **or** the ~5-iteration cap.
**Stop rule:** first-pass acceptance is **≥75 on reachable mutants** — do NOT ratchet toward 100 (Inc 3).
Any red-on-current test → candidate-bug list in `cover-bugratio.md` (preserved, never deleted).
**Acceptance:** all five gates green via the Step-3 helpers — `suite_green` (double-run), `no_flaky`,
`mutation_floor` (per-file reachable ≥75 from the Stryker JSON), `no_new_skips` (≤ measured baseline, 0 today),
`char_pin` (only allowed-annotation diffs); both `BugRatioAnalyzerTests.cs` + `BugRatioAnalyzerPropertyTests.cs`
exist under `Fokus.Domain.Tests/Analytics/`. If the floor is not reached at the cap, the run **stops and
reports** the surviving reachable mutants (the Workflow returns `stopped:'cap-reached'`) — does not fake green.

### Step 6 — OPERATOR ACTION REQUIRED: flip the KB ledger + capture the Cover cost
Depends on a real Step-5 run's numbers. On **all-gates-green**:
- `D:\src\sprint-rituals\docs\kb\bug-ratio.md` footer: flip `<!-- mutation-gated: false -->` →
  `<!-- mutation-gated: true -->` and `<!-- last-stryker-run: none — Cover not yet run -->` →
  `<!-- last-stryker-run: {date} — kill {score}% -->`. (**Supersede, never delete** prior history.)
- `D:\src\sprint-rituals\docs\kb\index.md`: change the `bug-ratio` row Status `verified` → `mutation-gated`.
- Capture the Cover **token + wall-time** number (the Workflow returns `outputTokensThisTurn`).
- Write `docs/specs/adhoc-MineVerifyCoverHarness/delivery/cover-bugratio.md` (every gate value, the mutation
  score, the candidate-bug list, the recorded Cover cost — our half of the #4 comparison).
**Acceptance:** KB footer + index row read `mutation-gated`; `cover-bugratio.md` records every gate value +
the recorded Cover cost.

### Step 7 — OPERATOR ACTION REQUIRED: land the SR commit + close the increment
Commits are the team lead's (pipeline rule); also needs Step-5 outputs. The **sprint-rituals** change is its
**own SR commit**, separate from any nexus commit. It contains exactly: the 2 test files, the
`stryker-config.json` edit (Step 4 — already applied to the SR tree), any allowed `// Stryker disable`
annotation diffs (Domain section), and the KB ledger flip (Step 6).
**Hazards to pre-empt (already mitigated where possible):**
- Runner result files: the Workflow writes them to `harness/.runs/` (nexus-side, **git-ignored** — verified
  `git check-ignore` passes), so they cannot strand in the SR commit.
- Concurrent-run drift: re-check `git status`/branch in **both** repos immediately before each commit
  (`recheck-branch-under-concurrent-run`).
The **nexus-side** Step-7 doc edits are **done** by this build: `harness/README.md` (status → Inc 2) +
`docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md` (Inc 2 marked BUILT). **No nexus plugin version bump** —
`harness/` ships nothing (dev-repo machinery, like `scripts/`/`tests/`).
**Acceptance:** `git show --stat` on the SR commit lists only SR-side files (no nexus paths, no runner result
files); `harness/README.md`/roadmap show Inc 2; `git status` in nexus shows no `plugins/**` change.

## Key Decisions

- **`char_pin` input seam (Q4 CONFIRMED): pure fn over a PRE-SCOPED diff.** The orchestrator (which has
  `git`) scopes `git diff -- src/Services/Fokus/Fokus.Domain/` before calling; the helper classifies diff
  lines and stays deterministic + CI-testable (Inc-1 helper-contract precedent — `recall-score` likewise
  took a supplied verdict map, not the LLM call). The Workflow ships a `readProdSourceDiffPlaceholder()`
  (returns empty diff → char_pin passes) that the operator replaces with the real scoped diff at run time.
- **`mutation_floor` denominator = standard Stryker semantics, then dead-line exclusion.** Numerator =
  `Killed`; reachable denominator = `Killed+Survived+Timeout+NoCoverage` minus survivors on
  `EXPECTED_SURVIVOR_LINES` (L17/L133/L268); `Ignored`/`CompileError`/`Pending` never counted. Grounded
  against a real on-disk `mutation-report.json` (schemaVersion 2), not the design doc. 0 reachable ⇒ not a
  pass (nothing proven); a missing per-file entry ⇒ fail loud (bad mutate glob), never a silent pass.
- **Runner result files land nexus-side + git-ignored (`harness/.runs/`).** Pre-empts the Step-7 stray-file
  hazard mechanically (`git check-ignore` verified) rather than relying on the runner agent's discipline.
- **`mutationRatchet.detail` is a string** (not the `{...}` object the other gates use) so the orchestrator
  can log it directly on halt; the gate's `pass` flag carries the continue/halt signal.
- **`no_new_skips` baseline is read, pinned at the known value (0) in the Workflow.** The gate reads a
  supplied baseline (MED-2, proven by a non-zero-baseline unit test); `BASELINE_SKIPS = 0` is the measured
  current value, not a hard-coded literal inside the gate.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Plan: `Skill: None, TDD: no`. Re-grounding file edits + grep gate — no behavior to test. |
| 2 | None (gap) | Plan: `Skill: None (gap), TDD: no — agent orchestration, validated live in Step 5`. No nexus skill covers "author a Cover/mutation-gate Workflow stage" → the Inc-4 harness skill (logged in Skill Gaps). |
| 3 | **tdd**, boy-scout | Plan: `Skill: None (gap), TDD: yes`. `tdd` invoked + red-green-refactor followed per gate (the gap is a *pattern* skill — "compute a Stryker honesty-gate battery"; TDD is not waived). `boy-scout` invoked after authoring (removed `_notYet` stub + a duplicate gate call). |
| 4 | None | Plan: `Skill: None, TDD: no (config)`. JSON config edit. |
| 5–7 | None | **Operator-owed** (Q1) — not executed this round; recorded under ## Operator Actions Required with exact invocations. |

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Cover Workflow validated only by `node --check` + import-resolution, never live-run | medium | reviewer/operator | `cover.workflow.js` uses platform-injected globals (`phase/agent/read/log/budget`) — not `node`-runnable, identical to Inc-1's workflow | The real validation is the Step-5 live run (operator-owed). Gate **logic** is fully unit-tested (24 tests); the **orchestration** is not. |
| `char_pin` is a proxy, not a manifest pin | low | reviewer | `cover-gates.mjs` header + plan §6 caveat | By design — the true hash-the-allowed-diff manifest pin is **deferred to Inc 3**. Module claims no manifest pin. |
| `no_new_skips` baseline pinned at 0 in the Workflow (`BASELINE_SKIPS`) | low | operator | live suite skips 0 today | The gate *reads* the baseline (MED-2 satisfied — proven by a non-zero-baseline unit test); the Workflow constant is the known value at Cover time. If the suite gains a legit skip, update `BASELINE_SKIPS`. |
| `mutationFloor` denominator uses standard Stryker semantics (Ignored/CompileError/Pending excluded) | low | reviewer | grounded against real `mutation-report.json` (schemaVersion 2) in the SR tree | Worth a glance at the live Step-4(run) report to confirm BugRatio mutants don't land as `Ignored` (the HealthScore baseline had 5 `Ignored` "block already covered"). |

## KB Changes

No KB change **this round** (the KB ledger flip is Step 6 — operator-owed, post-live-run). When Step 6 runs:

| Entry | Action | What changed |
|-------|--------|-------------|
| `D:\src\sprint-rituals\docs\kb\bug-ratio.md` | UPDATE (Step 6) | footer `mutation-gated: false` → `true` + `last-stryker-run` date/score (supersede) |
| `D:\src\sprint-rituals\docs\kb\index.md` | UPDATE (Step 6) | `bug-ratio` row Status `verified` → `mutation-gated` |

## Reviewer Fix Round — Cycle 1 (2026-06-21)

Two LOW findings from `review-increment2-cover.md § Step 2` addressed:

**Finding 1 — `suiteGreen` accepts a single-run array (looser than "BOTH double-runs" contract)**
- `harness/lib/cover-gates.mjs:29`: changed `runs.length >= 1` → `runs.length >= 2`. The gate now
  enforces its own invariant (BOTH runs required) without relying on the caller's schema validation.
- `tests/unit/cover-gates.test.mjs`: added test `suiteGreen fails on a single-run array` — a single
  passing run (length 1) now returns `pass: false`.

**Finding 2 — No boundary test at exactly the mutation floor (75%)**
- `tests/unit/cover-gates.test.mjs`: added two boundary tests:
  - `mutationFloor PASSES at exactly the floor (75%)`: 3 killed / 4 reachable = `Math.round(75.0)` = 75 → `pass: true`
  - `mutationFloor FAILS at 74% (N-1 boundary)`: 14 killed / 19 reachable = `Math.round(73.68)` = 74 → `pass: false`
- These pin the `>= floor` threshold explicitly in the test suite at both sides of the boundary.

**CI after fixes:** `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → **260 pass / 0 fail / 0 skip** (+3 new tests).

## Deviations from Plan

- **Steps 4(run)/5/6/7 not executed — recorded as OPERATOR ACTION REQUIRED.** Reason: the developer subagent
  has no `Workflow`/`agent` tool, no .NET toolchain, and no commit role (ADR-18). This is **Q1 (CONFIRMED)**
  and the exact Inc-1 Step-4 precedent. Each step is documented above with its precise invocation + per-gate
  acceptance for the team lead (orchestrator). **OPERATOR ACTION REQUIRED** — helper paths: the Cover Workflow
  `harness/cover.workflow.js`; the gate helpers `harness/lib/cover-gates.mjs`.
- **Built Step 3 (gates) order — implemented per gate as TDD slices, not all-tests-then-all-code.** Reason:
  the `tdd` skill mandates one-test-at-a-time (anti-horizontal-slicing). Same end state as the plan's Step-3
  acceptance; just the *process* is the skill's red-green-refactor.
- **Q2 (CONFIRMED): Inc-1 `delivery/` records left frozen.** The plan body mentions grepping `delivery/`, but
  the binding acceptance is `harness/` → zero. Inc-1 records are accurate history + out of write-scope — not
  rewritten. (Not a deviation from acceptance; a deviation from a literal reading of the plan's prose, sanctioned by Q2.)

## Live-run Fix (2026-06-22)

Three runtime defects surfaced during live-run of the Cover Workflow, plus a class-of-defect audit:

**Defect 1 — `read is not defined` (Setup phase, lines 254-255)**
`const verifiedRules = read(KB_RULES)` and `const testStyleContract = read(TEST_STYLE)` — `read()` is NOT a Workflow global. The orchestrator has no filesystem access. Fix: removed both calls and the `log` that used their `.length`. The Cover agent now receives KB_RULES and TEST_STYLE as paths in `coverPrompt` with explicit "READ THIS FILE" instructions. The agent has the Read tool; the orchestrator does not.

**Defect 2 — orchestrator `read()` calls in the loop body (lines 351-352)**
`JSON.parse(read(RUNNER_RESULT))` and `JSON.parse(read(run.strykerReportPath))` — same class: orchestrator-side filesystem reads. Fix: extended `RUNNER_RESULT_SCHEMA` to include a `mutants` field (the per-file BugRatioAnalyzer.cs mutant array from the Stryker JSON). Updated `runnerPrompt` to instruct the runner to read the emitted `mutation-report.json`, extract the per-file mutants, and return them in its schema'd result. In the loop, both `read()` calls replaced by direct use of `runRaw.mutants`. `mutationFloor` receives `{ files: { [SRC]: { mutants: runRaw.mutants } } }` — unchanged call site. All gate calls updated from `run.*` to `runRaw.*`.

**Defect 3 — class-of-defect audit (required fix)**
Full-file grep and line-by-line trace for `read`, `require`, `fs`, `process`, `Date`, `Math.random` in the orchestrator body: **zero hits after fixes**. `readProdSourceDiffPlaceholder()` confirmed as a defined local function at line 455-457 returning `''` (empty diff → char_pin passes on no prod-source change — by design, noted in Operator Actions Required). No other fs/global violations found.

**I/O model correction:**
The orchestrator body now follows the Workflow runtime contract: globals only (`phase`, `agent`, `log`, `budget`), no filesystem, agents do all I/O and hand data back via schema. Comments and `meta.phases` updated to reflect the corrected model.

*Status: COMPLETE — developer, 2026-06-21 (reviewer fix cycle 1 applied 2026-06-21; live-run fix applied 2026-06-22)*
