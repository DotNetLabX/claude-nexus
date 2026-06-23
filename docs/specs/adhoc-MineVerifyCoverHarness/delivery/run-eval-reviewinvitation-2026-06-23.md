# Mine→Verify→Cover — Run Evaluation: ReviewInvitation (cross-repo)

**Date:** 2026-06-23
**Evaluator:** Claude Code (Opus 4.8, 1M context), interactive session — orchestrator; subagents ran on **Sonnet**
**Subject under evaluation:** the **Mine→Verify→Cover harness** (the method + the .NET adapter), exercised as a *cross-repo generalization* proof — not its coverage objective
**Load used:** `ReviewInvitation.Accept/Decline` in `dotnet-microservices` (`Review.Domain`, .NET 9, multi-project + Central Package Management) — a DDD behavior-guard class, deliberately *not* analytics math (the prior two proofs were analytics in sprint-rituals)
**Host:** Windows 11, .NET SDK 9.0.312 + 10.0.301, Stryker.NET 4.14.2 (repo-local tool), Git Bash + PowerShell
**Purpose of this doc:** a faithful record of the run to (1) improve the harness and (2) serve as the evidence artifact for the "does it generalize across repos/styles?" question. Modeled on VWH's `ENGINE-EVAL-RUN.md`.

---

## 0. TL;DR

- **The harness generalized to a different repo + different code shape end-to-end** — but only after a **test-project scaffold** (the target repo had zero tests), a **cross-repo parameterization** of the harness, and **two harness defects fixed mid-run** (one of them surfaced *offline* before it could fake-green a result). None of the friction was in the .NET toolchain commands — those were correct from the sprint-rituals runs. It was in the harness's implicit assumptions about *one repo, one test-project layout, one-file-per-class* — which a real DDD codebase violates.
- **Headline harness behavior (positive):** the **anti-fake-green machinery worked exactly as designed.** A codebase whose every aggregate is split across two **same-basename partial files** (`Foo.cs` + `Behaviors/Foo.cs`) would have let the old basename-keyed mutant lookup score the **0-mutant data partial** and report a false 100%. The `target_mutated` gate + full-path extraction caught it; the run honestly reported **91%** with the one real survivor named, not a fabricated 100%.
- **Two harness defects** (both fixed, both with offline tests):
  - **Budget gate measured the SHARED session pool, not the run.** `budget.spent()` sums the whole turn (prep + builds + run), so the run halted on `budget-ceiling` after Mine→Verify at **1.62M** though its *own* cost was **~193k**. Fixed: capture `RUN_START_SPENT`, gate on the marginal delta.
  - **Same-basename partial hazard** (the silent one). Two report files share basename `ReviewInvitation.cs`; basename matching could grab the wrong partial → fake-green. Fixed: extract by **full source path**, scope the mutate glob to the behaviors file. Caught **offline** during scaffold validation, before any ~1M-token run paid for it.
- **Net assessment:** the harness's honesty stack (the 6-gate battery, `target_mutated`, the report-on-halt, the never-edit-SUT / never-delete-a-red-test discipline) is sound and the cross-repo proof is genuine. The friction is all variations on **one root assumption — "one repo, one test project beside the code, one file per class"** — which a multi-bounded-context DDD solution breaks in three places (no test project, split partials, repo-specific paths).

---

## 1. Mission & framing

Standing goal: a harness that mines + verifies + mutation-gates the business rules of a class, **.NET first, then Flutter**. Two prior proofs existed (BugRatio 100% / CycleTime 100%, both sprint-rituals **analytics**, same repo + author + style). This run's job: **prove it generalizes to a different repo and a different code shape** — DDD behavior guards, not calculators. That is the real evidence gate before shipping the skill.

Operator decisions up front (genuine forks, decided in-thread):
- **Target:** `ReviewInvitation.Accept/Decline` — pure logic, no `DbContext`/`IMemoryCache`, the cleanest first target in the repo.
- **Model:** Sonnet for every subagent (the mutation gate measures quality, so the model is validated by the gate, not assumed).
- **Scope:** single class (the multi-class sweep is the deferred Discover/3b).

---

## 2. Target & environment

- **Class:** `Invitations/Behaviors/ReviewInvitation.cs` — the *behaviors* partial of a split aggregate. **2 methods (`Accept`, `Decline`), ~3 branches** (status-not-Open guard, strict-`<` expiry guard, guard order) + two state assignments + three throw messages.
- **House style (load-bearing finding):** every aggregate in `Review.Domain` (and `UserRole` in Auth) is split `Foo.cs` (data/`required init` props + computed members) + `Behaviors/Foo.cs` (behavior methods). So **two source files share the basename `ReviewInvitation.cs`.**
- **Dependency closure:** `Review.Domain → Blocks.Domain / Blocks.Core / Blocks.Exceptions / Articles.* / FileService.Contracts` — builds clean (18 pre-existing nullable warnings in BuildingBlocks, not ours).
- **Test stack (had to be created — repo had ZERO test projects):** xUnit v3 (3.2.2) + AwesomeAssertions (9.0.0) + FsCheck.Xunit.v3 (3.3.3) + Microsoft.NET.Test.Sdk (17.14.1). Stryker.NET 4.14.2 as a **repo-local dotnet tool** (`.config/dotnet-tools.json`). `test-runner=mtp`, `coverage-analysis=off`, isolated from CPM (`ManagePackageVersionsCentrally=false`).
- **Host caveat:** the SR test project's csproj comment claims "MTP not supported by Stryker 4.14" — **false**: mtp works on 4.14.2 + xunit.v3 (confirmed by the baseline Stryker run here).

---

## 3. Chronological run log (everything I did)

### Phase A — Ground the target + repo (read-only)
1. Located `ReviewInvitation` (data + behaviors partials), read both, the `InvitationStatus` enum, `InvitationToken`/`EmailAddress` VOs, `AggregateRoot`, `DomainException`.
2. Discovered the **split-partial house style** is pervasive (Asset, Author, Reviewer, Article, UserRole all split) — so the same-basename issue is unavoidable by picking another target; the harness must handle it.
3. Read the central package management (`src/Directory.Packages.props`), confirmed **zero test projects** repo-wide, and pulled the **proven package versions** from sprint-rituals' `Fokus.Domain.Tests` to mirror a known-good set.

### Phase B — Scaffold the test project (the missing capability, done manually)
4. Wrote `Review.Domain.Tests.csproj` (net9.0, **CPM opt-out**, pinned test stack, `ProjectReference` to `Review.Domain`), `.config/dotnet-tools.json` (Stryker 4.14.2), `stryker-config.json` (mtp, coverage off, json reporter, mutate scoped to `**/Invitations/Behaviors/ReviewInvitation.cs`), a smoke test, a tailored `docs/conventions/mutation-testing.md`, and a test-project `.gitignore`.
5. **Build:** green (only pre-existing repo warnings). **Smoke test:** 1 passed (31 ms).
6. **Baseline Stryker** (smoke test only, so all-survive expected): **11 testable mutants on the behaviors partial** (13 total, 2 Ignored), report keyed by **absolute path**, schemaVersion 2. Exit 2 / 0% kill — *expected* (no real tests yet); the toolchain worked.

### Phase C — The disambiguation hazard (found offline)
7. Inspected the report's `files` keys: **two entries end in `ReviewInvitation.cs`** — the behaviors partial (13 mutants) and the data partial (0). A stray `IArticleStateMachine.cs` showed 4 mutants — all **Ignored** (filtered), harmless. The harness runner extracted "the entry whose key ends with `{Class}.cs`" → **basename-ambiguous**, could grab the 0-mutant data partial → fake-green.
8. **Decision:** key extraction on the **full source path**, scope the mutate glob to the behaviors file. This is the exact class of bug a cross-repo proof exists to surface — caught **before** a live run.

### Phase D — Cross-repo parameterization (offline)
9. Parameterized `cover.workflow.js` + `loop.workflow.js`: new args `testDir`, `testProjectDir` (runner cwd), `mutateGlob`, `patternTests`; `expectedSurvivorLines` parameterized (was hardcoded `[17,133,268]` — a latent fake-green for any non-BugRatio class); `EXAMPLE/PROPERTY_TESTS` defaults derived from `${TARGET_CLASS}`. Runner extraction switched to full-path. Controller forwards all to the Cover sub-workflow.
10. Added **3 offline contract tests** (304 → 307): runner prompt honors `testProjectDir`/`mutateGlob`/full-path SRC; `expectedSurvivorLines` defaults `[]` for a non-BugRatio class; controller forwards the params. Lint + `node --check` + suite all green.

### Phase E — Run 1 (the budget-gate misfire)
11. Created a 2-line KB stub (`docs/kb/index.md` + `review-invitation.md`) so the index-flip is clean; fired `loop.workflow.js` (Sonnet, the dotnet-microservices args).
12. **Run 1 halted on `budget-ceiling` after Mine→Verify:** `spent 1,623,438 > ceiling 1,500,000`. But `subagent_tokens` was **192,729** — the run's own cost. Root cause: `budget.spent()` is the **shared session pool** (my whole prep turn + the run), so the gate tripped on the session's prior spend. Mine→Verify itself *succeeded* (7 consensus rules) — the result was discarded by the halt.

### Phase F — Budget fix + Run 2 (resume)
13. Fixed: `const RUN_START_SPENT = budget.spent()` at controller start; gate on `runSpent()` = marginal. Updated the 3 budget checks + the report's cost line + the meta. Contract suite stayed green (the budget mock makes marginal 0).
14. **Resumed** (`resumeFromRunId`): the cached Mine→Verify replayed instantly, the now-fixed budget gate passed, and Cover ran live.
15. **Run 2 completed `all-gates-green`** at **iteration 1**. Read the generated tests to sanity-check before committing into a real repo: the Cover agent built a `_Fixtures` factory (using `EmailAddress.Create` + `InvitationToken.CreateNew()`), boundary tests, exact-message pins, guard-order tests, and status-assignment kills.
16. Committed: nexus (parameterize / proof+budget-fix / cost-honesty / ship-skill); dotnet-microservices tests on an isolated branch `harness/review-invitation-cover` (the repo's `main` was mid-refactor — kept my commit out of it).

---

## 4. Results

| Metric | Value |
|---|---|
| Reachable mutation kill | **91%** (10/11) |
| Mutants on target (behaviors partial) | 13 total → 11 testable (2 Ignored) |
| `target_mutated` | ✓ — confirmed `ReviewInvitation.cs` (behaviors), 13 mutants |
| `suite_green` | ✓ — 39 passed / 0 failed, ×2 |
| `no_flaky` | ✓ — `39/0/0` both runs |
| `mutation_floor` (75) | ✓ — 91% |
| `no_new_skips` | ✓ — 0 |
| `char_pin` | ✓ — production source never edited |
| Verified rules mined | 7 (BR-1…BR-7) |
| Tests written by Cover | 39 |
| Candidate bugs (red-on-current) | 0 |
| Model | Sonnet (every agent) |

**The one survivor:** line 13, `ExpiresOn < DateTime.UtcNow` → `<=`. Killing it requires a test where `ExpiresOn == UtcNow` at the exact comparison instant — undeterminable because the clock moves between fixture setup and the guard read. It is an **equivalent-in-practice mutant**: unkillable without a production change (inject a controllable clock), which the harness is forbidden to make. **91% is the honest ceiling for the code as written.** The Cover agent tried (`AddMilliseconds(200)`), couldn't kill it, and *reported* it.

---

## 5. What worked **out of the box** (carried from the prior .NET proofs)

- **The .NET toolchain commands** — `dotnet test` ×2, `dotnet stryker --mutate {glob} --reporter json`, the schemaVersion-2 report shape — all correct on the first cross-repo attempt. Every problem was layout/assumption, never a command.
- **The 6-gate battery** — all computed correctly; `mutation_floor` passed honestly at 91% (not rounded to a fake 100), `target_mutated` did its job, `char_pin` confirmed the SUT untouched.
- **Sonnet sufficiency** — 91% kill, 39 well-formed tests, the fixture factory figured out from the VOs. The gate validated quality; the cheaper model held.
- **The Cover agent's discipline** — boundary cases, exact exception-message pins (kills string mutants), guard-order tests, status-assignment kills, and a `_Fixtures` factory. Zero red-on-current (no candidate bugs in this class).
- **Resume** — `resumeFromRunId` replayed the cached Mine→Verify and continued past the edited budget gate, saving the ~193k re-spend.
- **Offline guards** — `node --check` + the mock-globals contract suite + `skill-lint` caught everything they were meant to in milliseconds.

---

## 6. What did **not** work / needed adaptation

### Harness defects fixed this run
| # | Problem | Locus | Severity | Fix |
|---|---|---|---|---|
| B1 | `budget.spent()` is the **shared session pool**, not the run → ceiling trips on the session's prior spend (halted at 1.62M, own cost ~193k) | controller | **blocker (false halt)** | `RUN_START_SPENT` baseline + gate on marginal `runSpent()`; report shows run-marginal + session-total separately |
| B2 | **Same-basename partials**: basename-keyed mutant extraction could grab the 0-mutant data partial → fake-green | runner prompt / adapter | **blocker (silent)** | extract by **full source path**; scope the mutate glob to the behaviors file; honest `mutatedFiles` list feeds `target_mutated`. **Caught offline.** |
| B3 | `EXPECTED_SURVIVOR_LINES` hardcoded to BugRatio's `[17,133,268]` in `cover.workflow.js` → would exclude real survivors for any other class | adapter | latent fake-green | parameterized; default `[]`; BugRatio keeps its list only when targeted |

### Repo-shape adaptations (one-time)
| # | Problem | Fix |
|---|---|---|
| 1 | **Zero test projects** in the repo | scaffold `Review.Domain.Tests` (CPM opt-out, pinned stack, Stryker local tool, smoke test) — the "scaffold a test project" capability, done manually |
| 2 | Central Package Management would force editing the shared `Directory.Packages.props` for test packages | opt OUT (`ManagePackageVersionsCentrally=false`); pin the test stack inline in the isolated project |
| 3 | Harness paths hardcoded to sprint-rituals (SR const, Fokus test dir, runner cwd) | parameterize `testDir`/`testProjectDir`/`mutateGlob`/`patternTests` |
| 4 | No test-style doc + no in-repo test precedent for the Cover agent | tailored `docs/conventions/mutation-testing.md`; `patternTests` arg pointing the agent at the contract instead of a non-existent example |

### Cosmetic / low-severity
- **Date-stamp agent guessed wrong** (`2026-06-21` vs the real `2026-06-23`). It can't call `Date()` (Workflow rule), so it infers from context and can be stale — the KB footer + report header carry the wrong date. Fragile design; pass the date via args.
- **`StrykerOutput/` is not gitignored by default** in a fresh test project — added a test-project `.gitignore`.

---

## 7. Cost behavior

| Operation | Cost |
|---|---|
| Run 1 (Mine→Verify, then false halt) | ~192,729 output tokens (subagent), ~133 s |
| Run 2 (resume: Cover + gate + KB flip + report) | ~202,920 output tokens (subagent), ~607 s |
| **Total run cost (actual)** | **~396k output tokens, Sonnet** |
| Misleading display | `budget.spent()` showed **1.66M** — the shared session pool (prep + builds + run), NOT the run's cost (the B1 bug) |

- **Stryker dominates wall-time** (the ~607 s Run-2 is mostly the toolchain: build + 2 test runs + the mutation pass on 11 mutants + the Cover agent's writes).
- **The ~400k run cost is one-time-ish per class** — Mine→Verify (~190k) + one Cover iteration (~200k). A multi-class sweep is ~400k × N, so whole-repo coverage is a real spend to budget for.
- **Lesson:** report **marginal** run cost, never the absolute pool — the 1.6M display read as "very expensive" when the run was ~4× cheaper.

---

## 8. Harness behavior assessment (qualitative)

**Strong:**
- The **anti-fake-green stack is the real value** — `target_mutated` + full-path extraction caught a silent wrong-file scoring that the basename shortcut would have passed as 100%. This is the thing a coverage number alone never gives you, and it worked on a *new* repo shape.
- **Honest sub-100%** — 91% with the survivor named beats a fabricated 100%. The never-edit-SUT / never-delete-a-red-test rules held.
- **Resume** turned a costly false halt into a cheap continuation.
- **Offline-first discipline** — the same-basename hazard and the contract regressions were caught in the offline guard, not by burning live runs.

**Rough edges:**
- The harness assumes **one repo, one test project beside the code, one file per class**. A multi-bounded-context DDD solution breaks all three (no test project, split partials, repo-specific paths). The fixes were point-patches; the *scaffold* and the *same-basename* handling want to be first-class adapter concerns (now they are — see §9).
- **Budget accounting** conflated session and run (B1). A run is not the only thing spending the pool.
- **The date-stamp-via-agent** design is fragile (B-cosmetic).
- **No whole-project coverage rollup** — "coverage" is per-class; the KB index lists which classes are mutation-gated, but there's no aggregate view. That's the deferred sweep.

---

## 9. Recommendations (prioritized)

**P0 — correctness (done this run):**
1. *(done)* Marginal budget accounting (B1).
2. *(done)* Full-path mutant extraction + mutate-glob scope for same-basename partials (B2); parameterized dead-line exclusion (B3). Encoded in the .NET adapter skill so it ships, not re-discovered.

**P1 — adapter robustness:**
3. **Make "scaffold a test project" a first-class adapter step** (it's documented in `mine-verify-cover-dotnet` now; the next step is to *automate* it so a fresh repo is one command, not a manual scaffold).
4. **Source the date via args**, not a guessing agent (kills the `2026-06-21` class of cosmetic error).
5. **Richer auto-report** — the per-run `cover-{class}.md` is mechanical (gates + survivors). Add survivor-cluster analysis, cost (marginal), and a "what to strengthen next" line so each run self-documents toward this eval's depth.

**P2 — coverage visibility:**
6. **Whole-project coverage rollup** — an aggregate view over the KB index (which classes mined / verified / mutation-gated, residual survivors per class). This is the Discover/3b sweep's natural output.
7. **Equivalent-mutant marking** — let the KB record a known-equivalent survivor (like the line-13 `<`/`<=` clock case) so it isn't re-chased every run.

---

## 10. For the architecture discussion

The findings collapse into **one root tension and two axes.**

### 10.1 Root tension: "one repo, one test project, one file per class" vs. real DDD codebases
The harness's mental model is **one repo with a test project beside the code and one source file per class.** A multi-bounded-context DDD solution breaks this: no test project exists (scaffold needed), each aggregate is **split across same-basename partials** (extraction must key on full path, mutate must scope to the behavior file), and paths are repo-specific (parameterize). **Question:** should the adapter own a first-class **"scaffold + scope" contract** — (a) ensure-test-project-exists, (b) resolve the *behavior* file of a split aggregate, (c) scope mutation to exactly that file — rather than treating each as a point-patch? (Now documented in the .NET adapter; automation is the open piece.)

### 10.2 Axis: run-cost accounting honesty
`budget.spent()` is a **shared pool**; a run is one of several spenders in a turn. The fix (marginal accounting) is the local patch, but the broader question is whether the harness should **own a per-run cost ledger** (start-spend, marginal, per-phase) so cost is always attributed to the run, not the session — important once a sweep fires N runs in one turn.

### 10.3 Axis: completeness/recall is unmeasured without a golden set
This run produced **verified + mutation-gated** rules (correct + well-tested) but **recall is unmeasured** — no hand-authored golden set, so no proof the 3 miners didn't *miss* a rule. For a 28-line two-method class it's eyeball-complete; for a large class it's a real gap. **Question:** is the 3-miner consensus + surviving-mutants signal sufficient as the standing completeness proxy, or does a class above some size threshold warrant a golden set (or a recall-style second opinion)?

---

## 11. Reproduction

```
# 1. Scaffold (one-time per bounded context) — see plugins/nexus-dotnet/skills/mine-verify-cover-dotnet
#    Review.Domain.Tests: CPM opt-out, pinned xUnit-v3/FsCheck/Stryker set, .config/dotnet-tools.json,
#    stryker-config.json (mtp, coverage off, json, mutate **/Invitations/Behaviors/ReviewInvitation.cs)
dotnet tool restore
dotnet build src/Services/Review/Review.Domain.Tests/Review.Domain.Tests.csproj   # green
dotnet test  src/Services/Review/Review.Domain.Tests                              # smoke green

# 2. Run the harness (Workflow tool, args point at the dotnet-microservices target; model=sonnet)
Workflow({ scriptPath: ".../harness/loop.workflow.js" }, {
  targetClass: "ReviewInvitation",
  src: ".../Invitations/Behaviors/ReviewInvitation.cs",
  testProjectDir: ".../Review.Domain.Tests",
  mutateGlob: "**/Invitations/Behaviors/ReviewInvitation.cs",
  testStyle: ".../docs/conventions/mutation-testing.md",
  expectedSurvivorLines: [], model: "sonnet" })
```

---

## 12. Commit trail

**nexus** (branch `adhoc-MineVerifyCoverHarness`):
```
4f0df88 feat: ship Mine→Verify→Cover as a two-part skill (nexus 1.18.0 + nexus-dotnet 1.2.0)
f24b76b chore: bake Sonnet default into meta + report run-marginal cost honestly
3e2a29d feat: cross-repo proof GREEN on dotnet-microservices ReviewInvitation + budget-gate fix
94ba2e5 feat: parameterize harness for cross-repo targets + dotnet-microservices bringup prep
```
**dotnet-microservices** (branch `harness/review-invitation-cover`):
```
86666e1 test(Review): mutation-gated tests for ReviewInvitation.Accept/Decline (Mine→Verify→Cover harness)
```

---

## 13. Open items / what a follow-up would do

- **Automate the test-project scaffold** (P1.3) so a fresh repo is one command, not a manual setup.
- **Discover/3b sweep** — graph-scoped multi-class coverage + the whole-project rollup (§9.6). graphify selects rule-rich classes; the harness covers each.
- **Flutter Phase 0** — de-risk Dart mutation tooling before the second language (the Cover gate's premise weakens without a Stryker-equivalent).
- **The two cosmetic fixes** — date-via-args (§9.4) and equivalent-mutant marking (§9.7).
