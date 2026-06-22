# Cover Run Report — BugRatioAnalyzer (Mine→Verify→Cover Increment 2)

**Run date:** 2026-06-22 · **Workflow:** `harness/cover.workflow.js` (Run ID `wf_a3f06dcb-00d`) ·
**Target:** `D:\src\sprint-rituals\src\Services\Fokus\Fokus.Domain\Analytics\BugRatioAnalyzer.cs` ·
**Verdict:** ✅ **ALL GATES GREEN** — stopped `all-gates-green` at iteration 2 of 5.

This is the durable record of the first live Cover run (design §5 KB-ledger companion + the #4 cost
half). Written operator-side this round; **moving forward the Workflow must emit this report itself on
every run** (see "Harness gap" below).

## Gate battery (§6) — all pass

| Gate | Result | Detail |
|------|--------|--------|
| `mutation_floor` | ✅ **88%** | 132 killed / 150 reachable; floor 75; 0 expected-survivors excluded |
| `suite_green` | ✅ | 121 passed / 0 failed on **both** runs |
| `no_flaky` | ✅ | identical `121/0/0` across the double-run |
| `no_new_skips` | ✅ | maxSkips 0 ≤ baseline 0 |
| `char_pin` | ✅ | 0 production lines changed (Cover wrote tests only) |
| mutation ratchet | ✅ | kill held/improved into iter 2 |

## What was produced (in sprint-rituals)

- `src/Services/Fokus/Fokus.Domain.Tests/Analytics/BugRatioAnalyzerTests.cs` — example xUnit v3 `[Fact]` tests
- `src/Services/Fokus/Fokus.Domain.Tests/Analytics/BugRatioAnalyzerPropertyTests.cs` — FsCheck property tests
- 121 tests total, all green, stable across the double-run.

## Candidate bugs

**None.** `redOnCurrent: []` — no test failed on current production code. BugRatioAnalyzer's encoded
behavior matches its verified KB rules (unlike HealthScore's Cover, which surfaced the negative-amber
pathology).

## Residual survivors (18 — all `Timeout`, none blocking)

All 18 reachable survivors are `Timeout` mutants (a mutation that makes the suite hang), concentrated on
the ratio computations and ordering:
- ratio lines 75–76, 145, 161, 186, 201 (arithmetic / conditional / equality on `completedSp`/`bugSp`)
- LINQ/order lines 351, 376 (`Reverse`, `OrderByDescending → OrderBy`), boolean line 218, string line 166.

**Semantics note:** the gate counts `Timeout` as a *survivor* (not a kill), which is **stricter** than
standard Stryker (Stryker treats a timeout as detected ⇒ killed). Under standard semantics the score
would be ~100% (150/150). The conservative treatment only *understates* the score — no reward-hacking
risk — but **Inc 3 should decide the Timeout convention explicitly** and, if killed-by-timeout is
accepted, these 18 clear without new tests.

## Cost (the #4 comparison number)

| Metric | Value |
|--------|-------|
| Output tokens (this run) | **~231,426** |
| Subagent tokens (total) | ~345,445 |
| Wall-time | **~27.5 min** (1,650,113 ms) |
| Agents | 4 (Cover ×2 iterations + runner ×2) |
| Tool calls | 103 |
| Iterations to floor | 2 of 5 |

This is the harness's per-class Cover cost — the half owed to the design's #4 VWH comparison (the Mine→Verify
half was ~267k tokens / class from the pilot).

## Run-time defects fixed mid-bringup (the workflow had never been live-run)

The Workflow was authored against an imagined runtime; three defects surfaced one at a time, none catchable
by `node --check`:
1. static `import` of the gate module → **inlined** the §6 battery (self-contained; `cover-gates.mjs` stays
   the unit-tested source of truth).
2. `read()` undefined → removed.
3. orchestrator assumed filesystem access it doesn't have → reworked: agents do all file I/O and return data
   via schema (Cover agent reads its inputs by path; runner returns the per-file Stryker mutants).

**Lesson (recorded in `lessons.md`):** `node --check` is necessary-not-sufficient for Workflow scripts; the
only real validation is an actual `Workflow({scriptPath})` run.

## Harness gap (forward item)

This report was assembled **operator-side**. The Workflow returns the result object but does **not** persist
a run report. **Inc 3 requirement:** the orchestrator writes `cover-{class}.md` (this shape) as its final
step on every run, so the complete report is a harness output, not a manual step. Tracked for Increment 3.

## KB ledger (flipped this round)

- `sprint-rituals/docs/kb/bug-ratio.md` footer → `mutation-gated: true`, `last-stryker-run: 2026-06-22 — 88%`.
- `sprint-rituals/docs/kb/index.md` `bug-ratio` row → `verified` → `mutation-gated`.
