# Spec vs Code Diff — GeneratedSqlValidator (Step 5 / AC-4)

**Date:** 2026-06-25
**Class:** `KnowledgeGateway.API/Features/TextToSql/GeneratedSqlValidator.cs`
**Spec side (Direction 2):** golden rules GOLD-01..12; tests generated from `golden-set.md` rule text (blind to implementation)
**Code side (Direction 1):** code-derived harness suite from `killdelta-generatedsqlvalidator.md` (single Sonnet agent, production source only, blind to golden set)
**Evidence sources:** `delivery/specdriven-generatedsqlvalidator.md`, `delivery/killdelta-generatedsqlvalidator.md`, `delivery/baseline-generatedsqlvalidator.md`

**Reading this diff:** `spec ∧ ¬code` = behavior the spec names that the code-derived direction missed.
`code ∧ ¬spec` = undocumented behavior the code encodes but the golden spec doesn't name.
`both-divergent` = boundary disagreement where both directions flagged the same location with conflicting evidence.

---

## Axis 1 — `spec ∧ ¬code` (listed first — these are the candidate sins of omission and bugs)

| # | Rule | Spec statement (from `golden-set.md`) | Code-derived gap | Candidate bug? |
|---|------|--------------------------------------|------------------|----------------|
| S1 | GOLD-08 (stray literal threshold) | Tolerance boundary is EXCLUSIVE — a literal differing by *exactly* 0.01 passes | Code-derived direction left a **surviving `>`→`>=` mutant at L272** — the equality boundary untested | **YES — see REAL-01 in `candidate-bugs-generatedsqlvalidator.md`** ⚠ |
| S2 | GOLD-11 (report-IDs-first) | Large detail tables `analytics_report_client_subcategory_stats`, `_product_stats`, `_items` require `report_ids` presence | Code-derived direction left **3 large-table membership string survivors** (L105-107) — exact per-table pattern tests missing | Potential miss — harness's single-pass rules-only run didn't iterate; survivor-feedback loop designed to target these |
| S3 | GOLD-09 (precomputed-stats exemption) | Tables in the precomputed-stats set are exempt from the bad-reports filter | Code-derived direction left **2 PreComputedStats carve-out string survivors** (L82-83) | Low signal — narrow carve-out; borderline equivalent/real |

**S1 is the headline finding.** The other two (S2, S3) were flagged by Direction-1 as survivors but not
confirmed as bugs by Direction-2 (the spec-driven tests didn't probe those specific membership values in
isolation). They are genuine first-pass misses that the harness's survivor-feedback iteration would target.

---

## Axis 2 — `code ∧ ¬spec` (undocumented behaviors)

| # | Behavior | Code location | Notes |
|---|----------|---------------|-------|
| C1 | `NormalizeSql` strips double-quotes only (single-quoted string false-positives possible) | Internal normalization | Divergence #5 in `golden-set.md` — documented gap; over-abstain, fail-safe, F10-deferred. Not in golden spec. |
| C2 | Dead carve-out: `analytics_store_category_stats_report` in exemption set, unreachable via trigger regex | L89 | Divergence #2 in `golden-set.md` — documented dead config; intentional defensive no-op. Not in spec. |
| C3 | F10-deferred absence: no ScriptDom/AST parser, no LIMIT-wrap, no statement-timeout, no EXPLAIN cost ceiling | n/a (absent) | Divergence #1 in `golden-set.md` — correctly absent per F9/F10 boundary. Spec (GOLD-01 note) acknowledges. |
| C4 | Curated profile fully implemented but unreachable at runtime (MVP = god-profile only) | L414-415, 367-368 | Divergence #3 in `golden-set.md` — Phase-5 deferred. Not in golden spec rules. |

All C-items are known divergences documented in `golden-set.md §Divergences`, not discovered by this diff —
the diff confirms they are `code ∧ ¬spec` items (code has them; spec doesn't name them as rules).

---

## Axis 3 — `both-divergent` (boundary disagreements)

| # | Location | Direction-1 signal | Direction-2 signal | Verdict |
|---|----------|-------------------|-------------------|---------|
| D1 | `GeneratedSqlValidator.cs:272` | Surviving `>`→`>=` mutant — code-derived tests never probed the equality boundary | `Gold08.ExactlyAt001_Passes` RED — spec-valid value (`\|0.86-0.85\|` = 0.01) rejected by code | **Convergent finding — both independently flagged L272 as weak.** IEEE-754 makes `0.86-0.85 = 0.010000000000000009 > 0.01`, wrongly rejecting the boundary value the spec says should pass. |

**D1 is the spike's single `both-divergent` item and its primary output.** This is the cross-check value the
proposal predicted: two methods, derived from opposite sources (code vs spec), independently flagging one
weak spot.

**Status in live KG source: FIXED.** After the experiments ran, the KG team patched L272 to
`> 0.01 + 1e-9`, with a comment that restates this spike's diagnosis verbatim ("FP-safe boundary: the
tolerance is exclusive … IEEE-754 makes e.g. 0.86 - 0.85 == 0.0100000000000000009, which is > 0.01 and
would wrongly flag a literal sitting exactly at tolerance. The 1e-9 margin absorbs FP noise."). The fix
comment echoes the spike's finding word-for-word. **This is the strongest possible validation — the harness
found a real bug, the consuming team patched it, the fix acknowledges the same root cause the spike diagnosed.**

---

## Summary

| Axis | Items | Candidate bugs |
|------|-------|---------------|
| `spec ∧ ¬code` (missing features — listed first) | 3 (S1–S3) | 1 confirmed (S1/L272, since fixed); 2 first-pass misses for survivor-feedback iteration |
| `code ∧ ¬spec` (undocumented behavior) | 4 (C1–C4) | 0 — all are known divergences in `golden-set.md §Divergences` |
| `both-divergent` (boundary disagreements) | 1 (D1/L272) | 1 confirmed (same as S1 — convergent finding) |

**Candidate bug count from the diff: 1** (L272 floating-point boundary — confirmed by cross-direction convergence, since fixed in live KG source).

**Spike verdict for GeneratedSqlValidator:** The diff mechanism works. The convergent finding (S1/D1/L272)
is the headline: two independent directions found the same real bug. The false-positive rate is real and
manageable (4/5 Direction-2 reds were artifacts). The first-pass misses (S2, S3) are within the design's
expectation for a single-pass rules-only run (no survivor-feedback iteration). See `spike-result.md`.
