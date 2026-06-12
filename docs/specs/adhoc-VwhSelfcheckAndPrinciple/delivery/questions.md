# adhoc-VwhSelfcheckAndPrinciple — Questions

## Q1: Salience lint — failing thresholds in CI, or report-only?
**From:** architect
**To:** user
**Status:** Open
**Step:** Phase 1 analysis
**File:** tests/lint/ (new salience lint), scripts/ (new report script)

**Context:** The pass adds the salience diagnostics from the VWH dive (bold-density, longest-block
word count per agent/rule file). The mechanics are settled: a report script
(`scripts/salience-report.mjs`) prints the measured numbers per file so a declutter pass (A2) has
its before/after evidence. The open call is whether a *lint test* also fails CI when a file crosses
a ceiling. Failing thresholds catch regressions mechanically (ADR-23 spirit) but make CI opinionated
about prose style — an aggressive ceiling would block unrelated agent-file edits and create
pressure to game the metric instead of fixing the prose.

**Question:** Should the salience lint fail CI at generous ceilings, or stay report-only until A2's
first declutter pass calibrates real numbers?

**Recommendation (initial):** failing lint at generous ceilings (bold >1-in-3 lines, block >250
words), assumed to pass against today's files.

**Resolution by measurement (architect, 2026-06-12):** ran the diagnostics against all shipped
agent/rule files before presenting — **8 of 19 files fail those ceilings today** (worst:
`rules/agents-workflow.md` max-block 1034 words; `agents/architect.md` 574; `agents/po.md` bold
density 0.34). A failing lint would block half the shipped files immediately. The data makes this
one-sided: **report-only in this pass** (`scripts/salience-report.mjs` + a lint test asserting the
script runs and parses every file — not thresholds). Failing ceilings are introduced by A2, which
both shrinks the files and calibrates the ceilings from post-cleanup numbers. The measured table is
also priority evidence for A2.
**Confidence:** high — determined by measurement, not preference.
**Status:** Resolved

### Answer
Resolved by architect via measurement; no user decision needed. (Recorded here per
write-first protocol.)
