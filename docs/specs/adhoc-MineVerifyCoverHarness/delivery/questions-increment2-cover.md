# Mine→Verify→Cover Harness — Increment 2 (Cover) — Questions

Phase-1 analysis of `plan-increment2-cover.md`. The plan is exceptionally well-grounded (both
its own Open Questions are pre-resolved by the GO-WITH-FIXES review, and every referenced file /
pattern / line number checked out against live source). **No blocking ambiguity** — these are
execution-boundary confirmations for the architect/team-lead so the build/run split is
pre-sanctioned rather than discovered mid-run (the Inc-1 lesson: a "validation run" step should
state its runtime owner up front).

---

## Q1: Build/run boundary — Steps 4–7 are operator-owed (developer subagent has no `Workflow` tool)
**From:** developer
**To:** architect
**Status:** Open
**Step:** Steps 4 (initial Stryker run), 5 (live Cover run), 6 (KB flip + cost capture), 7 (SR commit)
**File:** —

**Context:** Confirmed by tool search this round (and matching the Inc-1 record): a **developer
subagent's tool surface does not include `Workflow({scriptPath})`**, nor the `agent`/`parallel`
orchestration primitives. The Increment-1 Step-4 live run was therefore executed **by the team lead
as orchestrator**, not the developer — and Inc-1 lessons explicitly recommend that future harness
plans mark live-orchestration steps `Owner: operator` / `Owner: top-level session`.

For Increment 2 this means the **developer can fully build**:
- Step 1 (fix stale target — file edits + grep)
- Step 2 (`harness/cover.workflow.js` — authored as a committed file; runnable but not *run* by me)
- Step 3 (`harness/lib/cover-gates.mjs` + `tests/unit/cover-gates.test.mjs` — TDD, fully verifiable via `node --test`)

…but **cannot execute**:
- Step 4's *initial* `dotnet stryker` run (needs the SR .NET toolchain + a runner agent)
- Step 5 (the live Cover Workflow run — needs `Workflow` + spawns Cover/runner agents)
- Step 6's cost capture + KB flip (depends on a real Step-5 run's numbers)
- Step 7's SR commit (commits are the team lead's per the pipeline; also needs Step-5 outputs)

Note Step 4 has **two parts**: (a) the *config edit* to `stryker-config.json` — a plain file edit I
**can** do; (b) the *initial Stryker run* that proves the JSON report carries a per-file BugRatio
entry — operator-owed. I will do (a) and mark (b) `OPERATOR ACTION REQUIRED` per the plan's own
Runner note.

**Question:** Confirm the intended split: developer builds Steps 1–3 + the Step-4 **config edit**,
and records Steps 4(run)/5/6/7 as `OPERATOR ACTION REQUIRED` with exact invocations + acceptance
criteria for the team lead (orchestrator) to execute — exactly as Inc-1 Step-4 was handled. Or does
the team lead intend to drive Steps 4–7 itself immediately after my build, in this same session?

**Recommendation:** Developer builds Steps 1–3 + Step-4 config edit; everything requiring `Workflow`
/ the .NET toolchain / a commit is documented as `OPERATOR ACTION REQUIRED` in
`implementation-increment2-cover.md` with the exact run recipe and per-gate acceptance, for the team
lead to run as orchestrator. This is the Inc-1 precedent, is structurally forced (I lack the tools),
and keeps the deliverable a durable artifact + runnable Workflow rather than a faked run number.
**Confidence:** high — the tool-surface limitation is verified this round, the precedent is recorded
in Inc-1 lessons/implementation, and ADR-17 (deliverable = file write) + the pipeline's commit-rule
(team lead commits) both point the same way.

---

## Q2: Step 1 grep-acceptance — the stale literal also lives in the Inc-1 delivery records (must NOT be rewritten)
**From:** developer
**To:** architect
**Status:** Open
**Step:** Step 1 (fix the stale Inc-1 target)
**File:** `harness/targets/bugratio.json`, `harness/mine-verify.workflow.js`, this slug's `delivery/`

**Context:** Step 1's acceptance is `grep -r BugRatioCalculator harness/` returns **zero** hits. I
verified that constraint is scoped to `harness/` — and `harness/` has exactly two offenders
(`mine-verify.workflow.js`, `targets/bugratio.json`), both fixable. Good. **But** the plan body also
says "Grep `harness/` **and this slug's `delivery/`** for any remaining `BugRatioCalculator` literal;
fix or annotate each." The `delivery/` grep hits **4 files**:
- `plan-increment2-cover.md` (this plan — references the rename intentionally; leave)
- `plan.md` (Increment 1 — **frozen record**, my prompt says do not touch)
- `implementation.md` (Increment 1 — **frozen record**, do not touch)
- `communication-log.md` (Increment 1 — frozen record)

So the `delivery/` occurrences are **all legitimate historical references** (Inc-1 ran against the
then-correct `BugRatioCalculator.cs`; that history is accurate as-written and the plan's own
suffixing rule keeps Inc-1 records intact). The **binding** acceptance gate is `harness/` → zero,
which I will satisfy. The `delivery/` ones I will *not* rewrite — they are correct history, and the
plan distinguishes "fix **or annotate**".

**Question:** Confirm that satisfying Step 1's acceptance = `harness/` grep clean (the 2 harness
files updated), and that the Inc-1 `delivery/` files (`plan.md`, `implementation.md`,
`communication-log.md`) are left **as-is** (frozen Inc-1 records, not rewritten to the new class
name). No annotation needed since they're accurate history, not stale targets.

**Recommendation:** Yes — fix only the two `harness/` files; leave all Inc-1 `delivery/` records
untouched (they correctly record an Inc-1 run against the then-live `BugRatioCalculator.cs`). The
acceptance gate is explicitly `grep -r BugRatioCalculator harness/` → zero; `delivery/` history is
out of that gate's scope and out of my write-scope per the Inc-2 suffixing instruction.
**Confidence:** high — the acceptance line names `harness/` only; the suffixing rule + my prompt both
forbid editing Inc-1 records; rewriting accurate history would be the wrong fix.

---

## Q3: Step 7 roadmap path — `../roadmap.md` resolves to the slug's `roadmap.md`, not a repo-root file
**From:** developer
**To:** architect
**Status:** Open
**Step:** Step 7 (land SR commit + close increment), and the plan header's roadmap citation
**File:** `docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md`

**Context:** The plan cites "`../roadmap.md` Increment 2" (header) and Step 7 says "harness roadmap
close." Taken literally relative to the `delivery/` folder, `../roadmap.md` =
`docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md` — which **exists** and is the increment roadmap
(I read it; its "Build increments" section is what "Increment 2" refers to). A repo-root
`D:/src/claude-plugins/roadmap.md` does **not** exist (confirmed by find). So the reference resolves
correctly to the slug-local roadmap; there is no missing file. Step 7's "mark Increment 2 done"
applies to **that** file (+ `harness/README.md`, which currently says "Status: Increment 1").

**Question:** Confirm Step 7's roadmap update targets `docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md`
(the slug-local increment roadmap) — i.e. add an "Increment 2 done" marker there + flip
`harness/README.md`'s status — and that there is no separate repo-root roadmap I'm meant to touch.

**Recommendation:** Yes — Step 7's roadmap close = the slug-local
`docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md` + `harness/README.md` "Status" line. Both are
nexus-side doc edits (no plugin bump). The slug-local roadmap is the only `roadmap.md` that exists
and the only one whose "Build increments" list maps to "Increment 2."
**Confidence:** high — verified by `find` (no repo-root roadmap) and by reading the slug roadmap's
increment list; the `../` is delivery-folder-relative and lands exactly there.

---

## Q4: char_pin scope — gate the prod-source diff against `Fokus.Domain/**`, but the *allowed* test/config diffs are separate
**From:** developer
**To:** architect
**Status:** Open
**Step:** Step 3 (`char_pin` gate helper), Step 5 (acceptance)
**File:** `harness/lib/cover-gates.mjs`

**Context:** The `char_pin` gate (Step 3) checks "the only allowed `Fokus.Domain/**` diff is
`// Stryker disable`-only annotations on KB-pre-documented dead lines; any other prod-source change
fails." I want to pin the **denominator of the diff scope** precisely so the helper is deterministic
and testable. The live dead lines are confirmed in source:
- `startIndex` destructured-unused at **L17** and **L133** (both in `BugRatioAnalyzer.cs`) — KB
  `bug-ratio.md` Edge Cases L37 documents this.
- the `if (completedSp == 0) break;` streak guard at **L268** — KB Edge Cases L38 documents the
  `== 0` (not `> 0`) guard.

These match the plan's Domain section exactly. The question is purely about what the **helper's
input contract** is, since I'm building it as a pure fn over runner JSON (and a diff): does `char_pin`
receive (a) a *prod-source-only* diff (i.e. `Fokus.Domain/**`, excluding the test project and the
stryker config, which are legitimately allowed to change), or (b) the whole SR working-tree diff and
must itself partition prod-source from test/config? The plan says the allowed SR commit contains test
files + the stryker edit + KB flip + the annotation diffs — so test/config/KB changes are expected and
must **not** trip `char_pin`; only a non-annotation change **inside `Fokus.Domain/**`** should fail.

**Question:** Confirm `char_pin`'s contract: it evaluates the **`Fokus.Domain/**` production-source
diff only** (the analyzer + any prod source), passing iff that diff is empty OR consists solely of
`// Stryker disable`-only comment additions; test-project files, `stryker-config.json`, and KB files
are out of its scope (they have their own expected changes). The helper takes the prod-source diff
(or a structured representation) as input — the orchestrator/runner is responsible for *scoping* the
diff to `Fokus.Domain/**` before calling, since a developer-built pure fn can't run `git diff` itself
at gate time. Is that the intended seam?

**Recommendation:** Yes — `char_pin(prodSourceDiff)` is a pure fn that passes iff the supplied
`Fokus.Domain/**` diff is empty or only-`// Stryker disable`-comment additions; scoping the diff to
prod-source is the orchestrator's job (it has `git`), mirroring how Inc-1's `recall-score` took a
*supplied* verdict map rather than computing the LLM call itself. Unit fixtures: (i) empty diff →
pass; (ii) `// Stryker disable once all : <reason>` added on L268 → pass; (iii) a logic change (e.g.
`== 0` → `> 0`) → fail; (iv) a logic change *plus* an allowed annotation → fail (any non-annotation
line fails). This keeps the helper deterministic and CI-testable, consistent with the plan's
"manifest-pin deferred to Inc 3" caveat (we are NOT hashing; we are classifying diff lines).
**Confidence:** medium — the *gate semantics* are unambiguous in the plan, but the **input seam**
(does the helper scope the diff or receive it pre-scoped?) is an implementation choice the plan
leaves to me. I'm recommending the "receive pre-scoped, stay pure" seam to match the Inc-1
helper-contract precedent and keep it inside the CI glob; flagging it so the architect can redirect
if a self-scoping helper (that shells out to `git`) is preferred — but that would make it
non-deterministic and harder to unit-test, so I lean against it.
