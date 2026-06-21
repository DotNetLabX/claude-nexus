# Mine→Verify→Cover Harness — Increment 2 (Cover stage, proven on BugRatio)

**Feature Spec:** `docs/proposals/mine-verify-automation-design.md` (design §1 Cover contract, §4 deliverable
invariants, §5 KB ledger, §6 gate battery) + `../roadmap.md` Increment 2. No `definition/spec.md` — ad-hoc
technical feature; the design proposal + roadmap are the binding definition (ADR-27/28).

**Substrate:** standalone Workflow + dev-repo helpers (VWH ruled out as host — `vwh-engine-eval-result`).
Design §7 substrate fork is **resolved**, not open.

## Context

Mine→Verify is built and proven (Increment 1; recall 3/3 on BugRatio). Cover is the stage that turns the
**verified** rules into **mutation-gated tests** — the heart of the harness's value and the phase that still
owes the #4 cost number (the only phase that maps to VWH's ~73s/experiment). This increment builds the Cover
stage as a runnable Workflow and proves it on the one pending class, **BugRatioAnalyzer**, against the already-
done HealthScore Cover as the pattern. Bounded loop only — the full loop controller + stopping-signal battery
+ Discover are Increment 3; shipping as a nexus skill is Increment 4.

## Scope

**In:** a committed Cover Workflow (`harness/cover.workflow.js`) + deterministic gate helpers
(`harness/lib/cover-gates.mjs`); a first Cover **run** on `BugRatioAnalyzer` producing mutation-gated
`BugRatioAnalyzerTests.cs` + `BugRatioAnalyzerPropertyTests.cs` in sprint-rituals; the KB ledger flip
(`bug-ratio.md` → `mutation-gated`); the recorded Cover cost number (closes #4).
**Out:** integration tests (analyzer + callers/endpoint — confirmed out of harness scope; separate work if
wanted); the Inc-3 loop controller / external-signal stopping / Discover; the Inc-4 shipped skill. No miner/
verifier changes beyond the stale-target fix (Step 1).

**Cross-repo:** the Workflow + gate helpers live **here** (nexus, dev-repo machinery — ships nothing, no
version bump). The tests, the Stryker config edit, and the KB ledger flip land **in sprint-rituals** as their
own SR commit (owner decision: this session writes + commits in SR).

## Binding design invariants (carry into every step — not the developer's memory)

- **Actor separation (reward-hacking defense, §6).** The **Cover agent** writes ONLY the two test files. It
  gets **no write** to `stryker-config.json`, the gate infra, or the KB schema. A **separate runner agent**
  executes `dotnet test` / `dotnet stryker`. The **orchestrator** (the JS) computes gates and writes the KB.
  Three distinct actors; never collapse them.
- **Coverage is never an acceptance criterion** anywhere — informational only. The acceptance gate is mutation
  kill, not line coverage.
- **A test that fails on current code is NOT deleted** → it is preserved and routed to a candidate-bug list in
  `cover-bugratio.md` (the pilot's negative-amber pathology is exactly this case). Deleting a red test to go
  green is the hack the gate exists to stop.
- **Deliverable = a file write, never the final message (§4).** Cover agent `Write`s the test files; runner
  `Write`s its results; orchestrator reads the files. Makes the run resumable.
- **Clean-room (§3):** the orchestrator MAY read the golden set for nothing here (Cover scores against
  mutants, not golden) — but the golden set is **never** passed into the Cover or runner agent. Cover's input
  is source + verified KB rules + surviving-mutant list only.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | stale target `BugRatioCalculator.cs` → live `BugRatioAnalyzer.cs` in `harness/` | — |
| 2 | (none) | — | no | design §1 Cover contract; 3-actor separation; HealthScore test pattern path | Log: no Cover-stage-authoring skill (Inc 4) |
| 3 | (none) | — | **yes** | the 5 gates (§6) + mutation ratchet as pure fns over runner output | Log: no gate-battery skill (Inc 4) |
| 4 | (none) | — | no | SR `stryker-config.json` mutate-array add; mtp-runner risk | — |
| 5 | (none) | — | no | run Cover on BugRatioAnalyzer; bounded mutant-feedback loop; floor 75 | — |
| 6 | (none) | — | no | KB footer + index flip (supersede); Cover cost capture | — |
| 7 | (none) | — | no | SR commit (tests + stryker + KB); harness roadmap close | — |

No nexus skill covers "author a Cover/mutation-gate Workflow stage" or "compute a Stryker honesty-gate
battery" — all steps `None` (gap → the Inc-4 harness skill). Step 3 is `TDD: yes` (the gate computations are
deterministic helpers — failing test first via the `tdd` skill, same shape as Inc-1's recall scorer). The
.NET tests are produced by the in-Workflow Cover agent, not the nexus developer, so no nexus-dotnet test skill
maps to the developer's work here.

## Domain / Data Model Changes

N/A in nexus (JS dev-repo tooling). In sprint-rituals: **no domain-logic change**. Cover adds tests + a Stryker
mutate-target + KB metadata. The **only** permitted production-source diff is `// Stryker disable once all : <reason>`
annotations on **KB-pre-documented dead-code lines** (the HealthScore Cover precedent — `adhoc-CoverHealthScore`
annotated two unreachable guards to reach its kill floor; `BugRatioAnalyzer.cs` has the same shape: `startIndex`
destructured-unused at L17/L133, the `completedSp == 0` streak guard at L268, both flagged in `bug-ratio.md` Edge
Cases). That annotation is applied by the **runner/orchestrator actor, never the Cover agent** (§6), is comment-only
(no logic change), and is recorded in `cover-bugratio.md`. `char_pin`'s proxy treats a diff that is *only* such
annotations on pre-documented dead lines as allowed; the true manifest-pin (hash the allowed-diff) is deferred to
Inc 3.

## Implementation Steps

**1. Fix the stale Inc-1 target (re-grounding correctness).**
The live production class is `BugRatioAnalyzer.cs`, not `BugRatioCalculator.cs` (renamed since the pilot). Update
`harness/targets/bugratio.json` (`class`, `source`) and `harness/mine-verify.workflow.js` (`SRC` const + the
`'BugRatioCalculator'` label in `meta`/`target`) to `BugRatioAnalyzer`. Grep `harness/` and this slug's
`delivery/` for any remaining `BugRatioCalculator` literal; fix or annotate each.
Acceptance: `grep -r BugRatioCalculator harness/` returns zero hits; `targets/bugratio.json.source` resolves to
an existing file on disk.
Skill: None. TDD: no.
Satisfies: re-grounding rule (harness must target live source) — a no-op fix on a non-existent path otherwise.

**2. Author the Cover Workflow (`harness/cover.workflow.js`).**
A committed Workflow runnable via `Workflow({scriptPath})`, with the **three-actor** shape above. Orchestrator
reads the verified rules from `D:\src\sprint-rituals\docs\kb\bug-ratio.md` (orchestrator-side). It spawns a
**Cover agent** whose input is the `BugRatioAnalyzer.cs` source + the verified rules + the current surviving-
mutant list + the project test-style contract `D:\src\sprint-rituals\docs\conventions\mutation-testing.md`
(clean-room-safe — it is the FsCheck-3.x / MTP API contract, **not** the golden set; including it prevents
FsCheck-API compile failures in the generated property tests), and whose ONLY writes are
`Fokus.Domain.Tests/Analytics/BugRatioAnalyzerTests.cs` and
`...BugRatioAnalyzerPropertyTests.cs` — following the **HealthScore pattern** at
`D:\src\sprint-rituals\src\Services\Fokus\Fokus.Domain.Tests\Analytics\HealthScoreCalculatorTests.cs` (xUnit v3
+ AwesomeAssertions, one `[Fact]` per rule boundary with epsilon-pinned threshold cases to kill `>=/>` mutants;
FsCheck properties for invariants in the `*PropertyTests.cs` file, per `MetricCardBuilderPropertyTests.cs`). It
spawns a **separate runner agent** that executes the .NET toolchain in SR and `Write`s structured results. The
Cover agent prompt forbids touching `BugRatioAnalyzer.cs`, `stryker-config.json`, or the KB, and instructs:
**a red-on-current-code test is kept and flagged as a candidate bug, never deleted.**
Acceptance: the Workflow defines exactly the 3 actors; the Cover agent's write set is the 2 test files only; the
golden set path appears nowhere in any agent prompt; the runner is a distinct `agent()` call from the Cover
agent.
Skill: None (gap). TDD: no — agent orchestration, validated live in Step 5.
Satisfies: design §1 (Cover contract) + §3 (clean-room) + §4 (file-write deliverable).

**3. Build the gate battery as deterministic helpers (`harness/lib/cover-gates.mjs`).**
Pure functions over the runner's JSON output, one per §6 gate, plus the ratchet:
`suite_green` (all tests pass on both runs); `no_flaky` (identical pass/fail/skip counts across the two runs);
`mutation_floor` — reads the **per-file** score for `BugRatioAnalyzer.cs` from the Stryker **JSON report** (NOT
the run's blended aggregate — Stryker computes one score over the whole `mutate` array, so with HealthScore also
present the aggregate is meaningless for a BugRatio gate; the gate is the per-file kill-rate ≥ **75** of
**reachable** mutants, where KB-pre-documented dead-code survivors — `startIndex` L17/L133, `==0` streak guard
L268 — are excluded from the denominator as expected-survivors, handled per the Domain section's annotation
policy, not chased); `no_new_skips` (skip count ≤ the **measured baseline run's** skip count, not a literal 0 —
baseline is 0 today but read it, don't assert it); `char_pin` — prod-source proxy: the only allowed
`Fokus.Domain/**` diff is `// Stryker disable`-only annotations on KB-pre-documented dead lines (Domain section);
any other prod-source change fails the gate. Mutation ratchet: a kill-rate **regression** halts the run (harness
broken, do not continue). **char_pin caveat (design §6):** this is the documented *proxy*; the true manifest-pin
(hash the allowed-diff) is **deferred to Inc 3** — do not claim a manifest pin it isn't.
Acceptance: each gate is a pure fn returning `{pass, detail}`; `tests/unit/cover-gates.test.mjs` drives every
gate (pass + deliberate-fail fixtures), the per-file-score extraction from a fixture Stryker JSON, the
allowed-`Stryker-disable`-diff vs disallowed-logic-diff char_pin cases, and the ratchet-regression-halts case;
runs inside the CI glob.
Skill: None (gap). TDD: **yes** — failing test first (`tdd` skill).
Satisfies: design §6 (gate battery + reward-hacking defense + ratchet).

**4. Wire the Stryker mutate target + JSON reporter (SR setup — NOT the Cover agent).**
Edit `D:\src\sprint-rituals\src\Services\Fokus\Fokus.Domain.Tests\stryker-config.json`: (a) add
`**/Analytics/BugRatioAnalyzer.cs` to the `mutate` array (keep HealthScore — the gate is per-file per Step 3, so
re-verifying HealthScore is free); (b) **add `"json"` to `reporters`** (currently `["progress","html"]`) — the
`mutation_floor` gate needs the machine-readable **per-file** score and there is no json reporter today; (c)
confirm `break: 75` and `coverage-analysis: off` (required with MTP). Done by the developer/orchestrator, never
the Cover agent (reward-hacking defense).
**Runner note (corrects an earlier mis-scoping):** `test-runner: mtp` is **required** for xUnit v3 — the legacy
`dotnet` runner cannot discover v3 tests (`docs/conventions/mutation-testing.md:108`), and the proven 4.14.2 runs
(`adhoc-CoverHealthScore`, `adhoc-CoverageApparatus`) already used mtp successfully. There is **no** alternative
runner to fall back to. If `dotnet stryker` fails to enumerate BugRatio mutants, the cause is the `mutate` glob or
a missing `coverage-analysis: off` — **fix the config, do not switch the runner.** Record any genuine blocker as
an `OPERATOR ACTION REQUIRED` note in `implementation.md`.
Acceptance: `stryker-config.json.mutate` contains `BugRatioAnalyzer.cs`; `reporters` contains `"json"`; an initial
`dotnet stryker` run emits a JSON report carrying a per-file entry for `BugRatioAnalyzer.cs`.
Skill: None. TDD: no (config).
Satisfies: design §6 (mutation_floor wiring — per-file, machine-readable).

**5. Run Cover on BugRatioAnalyzer + iterate to the floor.**
Execute the Cover Workflow. Cover agent writes the two test files; runner double-runs `dotnet test` then
`dotnet stryker`; **surviving mutants are triaged before feedback** — a survivor on a KB-pre-documented dead-code
line (`startIndex` L17/L133, `==0` streak guard L268) is an **expected-survivor**: the runner/orchestrator
applies the `// Stryker disable once all` annotation (Domain section) and excludes it from the floor denominator,
**not** chased with a test. Every *reachable* survivor feeds back to the Cover agent for targeted tests; loop
until the per-file reachable `mutation_floor` (≥75) **or** a hard cap (~5 iterations / budget). **Stop rule
(resolves the 75-vs-100 ambiguity):** first-pass acceptance is ≥75 on reachable mutants — do **not** ratchet
toward 100 in this increment (the 70→75→80 ratchet is Inc 3); record the achieved score. Any red-on-current-code
test → candidate-bug list in `cover-bugratio.md` (preserved, never deleted).
Acceptance: all five gates green via Step-3 helpers — `suite_green` (double-run), `no_flaky`, `mutation_floor`
(per-file BugRatio reachable kill **≥75** read from the Stryker JSON), `no_new_skips` (≤ measured baseline),
`char_pin` (only allowed-annotation diffs on prod); both test files exist under `Fokus.Domain.Tests/Analytics/`.
If the floor is not reached at the cap, the run **stops and reports** the surviving reachable mutants (does not
fake green, does not delete reds).
Skill: None. TDD: no — this is the generation run (the .NET tests are its output; the Cover agent does the
red-green internally).
Satisfies: roadmap Inc 2 + design §6.

**6. Promote the KB ledger + capture the Cover cost.**
On all-gates-green: flip `D:\src\sprint-rituals\docs\kb\bug-ratio.md` footer to `<!-- mutation-gated: true -->`
+ `<!-- last-stryker-run: {date} — kill {score}% -->`, and update the `bug-ratio` row in
`D:\src\sprint-rituals\docs\kb\index.md` from `verified` → `mutation-gated` (**supersede, never delete** prior
history). Capture the Cover token + wall-time number. Write
`docs/specs/adhoc-MineVerifyCoverHarness/delivery/cover-bugratio.md` (gate values, mutation score, candidate
bugs, the cost number).
Acceptance: KB footer + index row reflect `mutation-gated`; `cover-bugratio.md` records every gate value + the
recorded Cover cost (our half of the #4 comparison).
Skill: None. TDD: no.
Satisfies: design §5 (KB ledger) + the #4 owed Cover cost.

**7. Land the SR commit + close the increment.**
Commit the **sprint-rituals** change as its own SR commit, separate from any nexus commit (owner decision). The SR
commit contains exactly: the 2 test files, the `stryker-config.json` edit (Step 4), any allowed `// Stryker
disable` annotation diffs (Domain section), and the KB ledger flip (Step 6). **Hazard to pre-empt:** the runner
agent's result/score files must `Write` to a **nexus-side or git-ignored** path — never into the SR working tree —
so they don't land as stray files in the SR commit; and re-check `git status`/branch in **both** repos immediately
before each commit (concurrent-run drift, `recheck-branch-under-concurrent-run`). Update `harness/README.md` +
`../roadmap.md` to mark Increment 2 done. **No nexus plugin version bump** — `harness/` ships nothing (dev-repo
machinery, like `scripts/`/`tests/`).
Acceptance: `git show --stat` on the SR commit lists only SR-side files (no nexus paths, no runner result files);
`harness/README.md`/roadmap show Inc 2 complete; `git status` in nexus shows no `plugins/**` change.
Skill: None. TDD: no.
Satisfies: roadmap Inc 2 close + the SR-landing decision.

## Testing Strategy

Unit-test the deterministic gate helpers (Step 3, TDD) under `tests/unit/cover-gates.test.mjs` — inside the CI
glob, like the Inc-1 recall scorer. The Cover Workflow itself is validated by the live Step-5 run against the
five fixed gates (mutation ≥75, double-run green, no-flaky, no-new-skips, char_pin), not by unit tests — it
orchestrates non-deterministic agents. The `.NET` tests produced are themselves the BugRatio coverage; their
quality bar is the Stryker mutation floor, not their own count.

## KB Impact

This increment **writes** the KB ledger (Step 6) — `bug-ratio.md` footer + `index.md` row flip to
`mutation-gated`, in sprint-rituals. (Inc-1 deliberately wrote no KB; the ledger write is a Cover/Inc-2+
responsibility per design §5.) Supersession, not deletion.

## Open Questions

1. **char_pin depth — RESOLVED by the review.** Inc 2 ships the prod-source **proxy** (Step 3 / Domain section):
   the only allowed prod diff is `// Stryker disable`-only annotations on KB-pre-documented dead lines, applied by
   a non-Cover actor and recorded. The true manifest-pin (hash the allowed-diff) is deferred to Inc 3. This is the
   design's own §6 caveat, grounded in the HealthScore Cover precedent — not a shortcut.
2. **Mutation floor — RESOLVED.** First-pass acceptance is **per-file reachable kill ≥75** on `BugRatioAnalyzer`
   (read from the Stryker JSON); the 70→75→80 ratchet toward 100 is **Inc 3**, not chased here. KB-documented
   dead-code mutants are expected-survivors, excluded from the denominator (Step 5). No remaining ambiguity.

## Plan Review

Code-grounded critic (`nexus:critic`, Mode 2, read live SR source + the prior HealthScore Cover implementation):
**GO-WITH-FIXES** — no CRITICAL, 4 HIGH, 2 MEDIUM, all folded in-place. Grounding verified accurate (class rename,
HealthScore pattern, Stryker shape, KB footer all confirmed against live files); design-invariant coverage (3-actor
split, clean-room, file-write deliverable, red-test-preserved) confirmed faithful.

| # | Finding (code-grounded) | Disposition |
|---|---|---|
| HIGH-1 | `char_pin` "zero prod writes" contradicted the proven HealthScore Cover, which `// Stryker disable`-annotated dead guards in prod source | Fixed — Domain section + Step 3/5 allow annotation-only diffs on KB-documented dead lines by a non-Cover actor; manifest-pin deferred to Inc 3 |
| HIGH-2 | Stryker computes one **aggregate** score over the `mutate` array → "≥75 on BugRatio" unmeasurable blended with HealthScore's 100%; no `json` reporter for a per-file score | Fixed — Step 3 gates on the **per-file** BugRatio score from the Stryker **JSON**; Step 4 adds the `"json"` reporter |
| HIGH-3 | The `mtp`-runner "fallback to the supported runner" was backwards — `mtp` is **required** for xUnit v3, no alternative exists | Fixed — Step 4 states mtp is the required proven path; on failure fix the config/glob, never switch runner |
| HIGH-4 | "Floor 75 matches HealthScore" ambiguous vs HealthScore's **achieved 100%** + the §6 ratchet | Fixed — Step 5 stop rule: first-pass ≥75 reachable; no ratchet-to-100 in Inc 2 |
| MED-1 | FsCheck 3.x C#-API specifics needed or generated property tests won't compile | Fixed — Step 2 adds `mutation-testing.md` to the Cover agent input (clean-room-safe) |
| MED-2 | `no_new_skips ≤ 0` hard-coded the baseline instead of measuring it | Fixed — Step 3 reads the baseline run's skip count |
| Gap | Runner result files could strand in the SR commit; concurrent-repo drift | Fixed — Step 7 pins runner writes nexus-side/git-ignored + dual-repo re-check before commit |
