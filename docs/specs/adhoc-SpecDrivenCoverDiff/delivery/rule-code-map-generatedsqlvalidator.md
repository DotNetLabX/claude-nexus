# Rule → Code Map — GeneratedSqlValidator (Step 2 / AC-2)

**Date:** 2026-06-25
**Class:** `KnowledgeGateway.API/Features/TextToSql/GeneratedSqlValidator.cs`
**Spec source:** `D:\src\knowledge-gateway\docs\audit\golden-set.md`, rules GOLD-01..12
**Method:** Manual mapping per plan §64 — each golden rule's Code attestation column from `golden-set.md`
locates the production line(s). A rule with **no locatable code** would be flagged `NO-CODE-FOUND` (candidate
sin-of-omission). All 12 rules have locatable code; notes are added where coverage is partial or the code
diverges from stated intent.

## Map

| Rule ID | Summary | Code location | Notes |
|---------|---------|---------------|-------|
| GOLD-01 | Parser-free fixed-order decision model; `Validate` returns first violated rule name or null; null/whitespace SQL → `"SingleSelect"` | `GeneratedSqlValidator.cs:218-301` (main `Validate` method); short-circuit at L221-222 | No AST/ScriptDom. F10-deferred path not present (correctly absent per F9/F10 boundary — logged as Divergence #1 in golden-set.md). |
| GOLD-02 | Read-only lead guard: mutation/DDL verb at string start → `"SingleSelect"` (case-insensitive) | `GeneratedSqlValidator.cs:127-129, 228-229` | Lead-verb regex at L127-129; applied at L228-229. |
| GOLD-03 | DML-anywhere guard (INSERT/UPDATE/DELETE/MERGE/TRUNCATE anywhere — not DDL) | `GeneratedSqlValidator.cs:132-134, 232-233` | Separate from GOLD-02's lead guard. DDL handled at lead only. |
| GOLD-04 | Single-statement: interior `;` + statement keyword → `"SingleSelect"`; trailing `;` allowed | `GeneratedSqlValidator.cs:122-124, 230-231` | SET and SHOW in interior follow-set (not in lead keyword set). |
| GOLD-05 | Relation policy: ≥1 `public.<relation>` after FROM/JOIN required; non-public schemas → `"RelationPolicy"`; no pg_catalog exemption | `GeneratedSqlValidator.cs:147-149, 137-139, 355-364` | Runs on whitespace/quote-normalized SQL. |
| GOLD-06 | Bare unqualified `v_*` rejected on both god and curated profiles; only `curated.v_*` exempt | `GeneratedSqlValidator.cs:152-154, 367-368, 414-415` | Note: curated profile currently unreachable at runtime (MVP = god only — Divergence #3 in golden-set.md). |
| GOLD-07 | Relative-date ban unconditional: `CURRENT_DATE` (substring) or `now(` → `"NoRelativeDateUnderAnchoring"` | `GeneratedSqlValidator.cs:253-257, 506-507` | Former `maxDateAnchoringApplied` gate removed (Design B, ADR 2026-06-14). |
| GOLD-08 | Stray-literal-threshold: numeric literal in range-comparison differing from resolved threshold by strictly > 0.01 → `"NoStrayLiteralThreshold"`; range ops only (not `=`/`!=`) | `GeneratedSqlValidator.cs:179-181, 260-277, 509-518` | **⚠ Candidate bug at L272 (experiment-time):** `Math.Abs(literal - resolvedNumeric.Value) > 0.01` — IEEE-754 made `0.86-0.85 = 0.0100000000000000009 > 0.01`, rejecting a spec-valid value. **Status in live KG source: FIXED** — now `> 0.01 + 1e-9`; fix comment echoes the spike's diagnosis. This is the headline finding (converged from both directions). |
| GOLD-09 | Bad-reports filter required when SQL references `analytics_report*`; precomputed-stats tables exempt | `GeneratedSqlValidator.cs:95-98, 428-440` | Dead carve-out `analytics_store_category_stats_report` (trigger regex mismatch) — Divergence #2 in golden-set.md. |
| GOLD-10 | Bad-reports filter: all 5 conditions required; asymmetric matching (`ignore_in_analytics = false` value-locked; `type != 'internal'` exact operator) | `GeneratedSqlValidator.cs:158-176, 443-447` | |
| GOLD-11 | Report-IDs-first: large detail table ref requires `report_ids` CTE or IN subquery — presence heuristic only | `GeneratedSqlValidator.cs:111-119, 482-489` | Presence-only, not closure proof (Divergence #4 in golden-set.md). |
| GOLD-12 | Category-isolation: `client_category_id` substring required when flag on → `"CategoryIdPresent"` | `GeneratedSqlValidator.cs:244-248` | |

## No-code-found items

None — all 12 rules have locatable code. The three divergences noted above (GOLD-01 F10 deferral,
GOLD-06 curated unreachable, GOLD-09 dead carve-out) represent code-vs-intent gaps **already documented
in golden-set.md §Divergences** — not sins of omission (the code exists; intent and behavior diverge
or the feature is deferred).
