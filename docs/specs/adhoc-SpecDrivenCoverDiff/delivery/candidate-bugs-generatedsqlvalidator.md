# Candidate Bugs — GeneratedSqlValidator (Step 4 / AC-3)

**Date:** 2026-06-25
**Class:** `KnowledgeGateway.API/Features/TextToSql/GeneratedSqlValidator.cs`
**Evidence source:** `delivery/specdriven-generatedsqlvalidator.md`
**Method:** A Sonnet agent authored 107 tests from golden rules GOLD-01..12 (rule text only, blind to
implementation — given a signatures-only contract + `SurfaceProfile.cs`). Instructed to probe edge inputs per
rule (boundaries, case, near-misses). Tests run against real code in an isolated scratch assembly.
124 cases run; 5 RED. Triaged below.

## Candidate bugs (1 confirmed, 4 artifacts)

### REAL-01 — Floating-point boundary bug at L272 ★ HEADLINE FINDING ★

| Field | Value |
|-------|-------|
| Rule | GOLD-08 (stray-literal-threshold) |
| Test | `Gold08.ExactlyAt001_Passes` |
| Expected | `\|0.86 - 0.85\|` = exactly 0.01 → passes (boundary exclusive per spec) |
| Actual | Code returned `"NoStrayLiteralThreshold"` (rejected as stray literal) |
| Root cause | `Math.Abs(0.86 - 0.85)` = `0.010000000000000009` in IEEE-754 → is `> 0.01` → wrongly rejects a spec-valid value on the tolerance boundary |
| Code location | `GeneratedSqlValidator.cs:272` (experiment-time): `if (Math.Abs(literal - resolvedNumeric.Value) > 0.01)` |
| **Live KG status** | **FIXED** — code now reads `> 0.01 + 1e-9`; a comment in the fix echoes this spike's diagnosis verbatim ("FP-safe boundary: the tolerance is exclusive … IEEE-754 makes e.g. 0.86 - 0.85 == 0.0100000000000000009, which is > 0.01 and would wrongly flag a literal sitting exactly at tolerance"). The fix was applied by the KG team post-experiment. |
| Cross-direction corroboration | Direction 1 (code-derived mutation) independently left a surviving `>`→`>=` mutant on this same line. Two methods from opposite sources (code vs spec) converged on one weak spot — the proposal's cross-check thesis, demonstrated live. |

### ARTIFACT-01 — Rule-interaction false positive (GOLD-03)

| Field | Value |
|-------|-------|
| Test | `Gold03.DdlVerb_CreateInsideQuery...` |
| Expected | null (no violation) |
| Actual | `"BadReportsFilterPresent"` |
| Verdict | **Test artifact** — the example SQL incidentally references an `analytics_report*` table, triggering GOLD-09/GOLD-10 (a different rule) under first-violation-wins. Code is correct; the test used a poorly constructed SQL example that fires an unintended rule. |

### ARTIFACT-02 — Bad example table (GOLD-01)

| Field | Value |
|-------|-------|
| Test | `Gold01.ValidMinimalSelect_ReturnsNull` — `SELECT 1 FROM public.analytics_reports` |
| Expected | null |
| Actual | `"BadReportsFilterPresent"` |
| Verdict | **Test artifact** — `analytics_reports` is a report table requiring all 5 filter conditions (GOLD-10). Code is correct; the test used a table name that triggers a report-filter guard. |

### ARTIFACT-03 — Rule isolation failure (GOLD-11)

| Field | Value |
|-------|-------|
| Test | `Gold11.Subcategory...Unqualified_WithoutReportIds` |
| Expected | `"ReportIdsFirst"` |
| Actual | `"RelationPolicy"` |
| Verdict | **Test artifact** — the unqualified table reference trips Rule 2 (GOLD-05, `"RelationPolicy"`) first under first-violation-wins (GOLD-01). Code is correct; the test didn't isolate the rule under test from earlier rules in the chain. |

### ARTIFACT-04 — Un-constructable profile (GOLD-06)

| Field | Value |
|-------|-------|
| Test | `Gold06.CuratedQualifiedView_CuratedProfile_Exempt` |
| Expected | exempt (null return) |
| Actual | `"RelationPolicy"` |
| Verdict | **Harness artifact** — `SurfaceProfile.Curated` doesn't exist in source (curated profile is MVP-unreachable, documented as Divergence #3 in `golden-set.md`). The agent synthesized a curated profile whose allowlist doesn't match any real path. Setup limitation, not a confirmed code bug. |

## Triage summary

| Count | Verdict |
|-------|---------|
| 1 | Real candidate bug (FP boundary at L272 — since fixed in live KG) |
| 2 | Test artifacts — poorly chosen example SQL triggers unintended rules under first-violation-wins |
| 1 | Test artifact — rule isolation failure (earlier rule fires first) |
| 1 | Harness artifact — un-constructable curated profile |

**Signal:** 4/5 reds were test/harness artifacts. Triage is mandatory in Direction-2. The 1 real finding was
independently corroborated by Direction 1, which is the spike's headline validation.
