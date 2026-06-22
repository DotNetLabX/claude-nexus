# adhoc-MineVerifyCoverHarness — Increment 3a (loop controller) — Summary

**Status:** BUILD COMPLETE — APPROVED, pipeline closed 2026-06-22. **Live proof PENDING** — Step 8 (the
live controller runs) is operator-owed and has **not** run; the increment is build-complete, not live-proven
(same posture as Inc-2). **Definition:** `mine-verify-automation-design.md` + `roadmap.md` (ADR-27, no spec).
**Plan:** `plan-increment3-loop.md`. **Branch:** adhoc-MineVerifyCoverHarness.

**Scope:** Increment 3 **split** at owner's confirmation — this is **3a** (automate the 3 proven stages,
single-class). **3b deferred:** Discover, multi-class worklist sweep, dry-counter. **Also deferred** (owner):
the language-adapter extraction (until C++) and the real char_pin manifest-pin.

## What was delivered (Steps 1–7, buildable scope)
- **`harness/loop.workflow.js`** — the pipeline controller: one invocation runs Mine→Verify→(KB write)→Cover
  →KB flip→auto-report for one class. `workflow()` composition preferred + `MONOLITH_FALLBACK` flag; budget cap
  (`budget.spent()` vs 1.5M); mutation ratchet; gate + kb-write helpers inlined (no static import).
- **`harness/lib/kb-write.mjs`** — deterministic rules-array → KB-markdown serializer (supersede-not-delete) + 15 tests.
- **`tests/unit/workflow-contract.test.mjs`** — the offline guard (10 tests): mock-globals sandbox catches the
  static-import / undefined-global / `read()` class that cost 3 live-debug cycles in Inc-2.
- **Timeout fix** — `Timeout` now counts as killed (standard Stryker) across all three `mutationFloor` copies.
- **`args` parameterization** of both sub-workflows (BugRatio default, back-compat).
- **Self-written run report** — the controller auto-writes `cover-{class}.md` (closes the Inc-2 operator gap).

## Pipeline outcome
- **Developer Phase 1:** all clear, 0 questions; grounded every plan claim against live code.
- **Architect Step-1 done-check:** PASS — Steps 1–7 Implemented (5/6/7 valid documented deviations), Step 8
  correctly deferred, skill-conformance met (`tdd` logged), no Missing.
- **Step-2 code review (code-grounded):** **APPROVED** — no CRITICAL/HIGH. One MEDIUM (inlined `supersedingRules`
  new-entry branch diverged from source — appended Rules instead of inserting before the first `##`) — **fixed
  post-approval**: inlined `_insertRulesIntoNew` to match the source module. Suite **285 pass / 0 fail**.

## Key lesson (architect)
The **code-grounded critic caught a CRITICAL the prose plan hid**: the Mine→Verify→Cover seam is a *filesystem*
hop (Mine→Verify returns rules in memory; Cover reads them from the KB file), not an in-memory pass — invisible
in a prose-only review. Same root as Inc-2's runtime defects: for Workflow-harness work the runtime contract
(no fs, no imports, agents-return-via-schema) is only visible in source. **Code-grounded review is load-bearing
here, not optional** — every increment's worst finding came from reading source, never from the doc.

## Operator-owed next actions (Step 8 — exact invocations in implementation-increment3-loop.md)
1. **Run 1 — BugRatioAnalyzer** (re-prove automated; expect ~100% now Timeout counts as killed).
2. **Run 2 — CycleTimeAnalyzer** (generalize; skips recall if no golden set).
3. **Bringup checks resolved by the run:** `args` injection, `workflow()` composition+nesting, the `agentType` seal.
   Each has a sanctioned fallback (consts / `MONOLITH_FALLBACK` flag / PROMPT-ONLY) — no path blocks.

## Files
Created: `harness/loop.workflow.js`, `harness/lib/kb-write.mjs`, `tests/unit/{workflow-contract,kb-write}.test.mjs`,
`delivery/{plan,implementation,review,summary}-increment3-loop.md`.
Modified: `harness/{mine-verify,cover}.workflow.js`, `harness/lib/cover-gates.mjs`, `tests/unit/cover-gates.test.mjs`,
`delivery/lessons.md`. **No `plugins/**` change → no version bump** (harness ships nothing).
