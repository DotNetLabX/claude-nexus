# F8-W2b plan — VWH retail-profile corrections from KG's verified derivations

**Status:** Plan — architect (Fable 5), 2026-07-18. Transcription-fidelity critic ran same day:
**GO-with-fixes, folded** (16/16 D-rows verified exact against the reconciliation doc; one LOW —
the D15 join key — folded).
**Executes in:** `D:\omnishelf\virtual-worker-harness`, target `profiles/retail/`. **This repo's
files never change during W2b**; what comes back feeds the W2-close ADR here.
**Content authority:** `D:\src\claude-plugins\nexus\docs\research\2026-07-17-semantic-model-reconciliation.md`
§2 (D1–D16 full detail) + §5 (ratified dispositions). **Acceptance authority:** F8 tech-spec §W2b.
**File refs below:** KR = `kpi_registry`, SM = `schema_map` (as named in the recon doc). Its line
numbers are as-of 2026-07-17 — **locate every edit by construct name, never by line number.**

## Step 0 — D13 triage FIRST (time-critical, possibly live-broken)

Probe whether `stores.zone / cluster / ofc / district_manager` still exist (the flat hierarchy was
scheduled to drop ~mid-July 2026 — that is past). Columns dropped ⇒ the current mapping is
live-broken: treat D13 as a **repair**, do it before everything else. Either way the fix is the
same: replace the flat-column hierarchy with `store_groups` / `store_group_levels`.

## Corrections (each lands with a provenance comment citing KG's verification stamp)

| Item | Target | Action | KG evidence to cite |
|------|--------|--------|---------------------|
| D1 OOS | KR | replace `100 − osa` with `SUM(out_of_shelf_products_count) / SUM(planogram_products_count)` — the complement identity breaks on undetected items | 0/500 on two windows |
| D2 POG strict | KR | numerator → `correct_position_non_stack_products_count` | 0/500 |
| D3 POG light | KR | relaxation = `+ incompliance_reason_products_count` in the numerator, not "slightly-misplaced counted OK" | 0/500 (the 14/500 residual) |
| D4 SOS | KR | per-SKU `min(planogram_facings, report_facings)` over planogram-EXPECTED facings; VWH's current formula is KG's *distinct* `sos-overall-pct` — keep both, correctly named, never conflated | code-traced + pinning test |
| D5 Shelf fill | KR | store the SDK's `shelf_data.fillRate` verbatim, AVG only, NEVER recompute from counts | refutation-tested |
| D6 Price compliance | KR | denominator → planogram-expected products; ADD the `price_tags_reading_enabled` answer gate | 0/104; 640k-report gate check |
| D7 Adjusted OSA | KR | zero-stock OOS products are **credited into the numerator**, denominator unchanged (the "excludes" tooltip wording is wrong); zero-stock set from `stock_history` at ≤ report date, fallback plain OSA | code-grounded, user-verified |
| D8 Phantom ⇄ ISA | KR/notes | ADD the dual reading: same predicate (OOS ∧ SoH>0) decomposes into wrong-counts AND back-room stock, store-dependent — keep VWH's 67.4% measurement, add KG's ISA reading | both models carry both halves |
| D9 Bad-reports filter | SM | 2 → 4 predicates: `is_valid ∧ ¬ignore_in_analytics ∧ is_good_quality ∧ deleted_at IS NULL` | ~48% pass on a 1.21M window |
| D10 SoH source | SM | remap `product_stock` → `stock_history`/`stock_current`, join on surrogate `index_code_id → index_codes.id`; **KEEP VWH's freshness caveat (48h GR gap) — it is VWH-authoritative** | live schema + VL-005's own query |
| D11 Price master | SM | remap `prices` → `prices_history`/`prices_current`; add the reference-price vs OCR-observed distinction | live-probed |
| D12 Aggregation | KR | condition the "percentages AVG" rule: second-stage rollups recompute `SUM(num)/SUM(den)` at target grain | KG BR1/BR2 |
| D13 Hierarchy | SM | per Step 0 — `store_groups`/`store_group_levels` | user-directed 2026-07-09 |
| D14 Phantom table | SM | DELETE the `analytics_report_qa` mapping — the table does not exist; QA lives as columns on reports | live whole-area mine, 15 tables |
| D15 Planogram targets | SM | add the ~98%-null caveat on `target_osa/target_pog`; real thresholds via `task_kpis`; grading binds to `planogram_versions` via `planogram_version_id` (not the planogram header) | live null-rate |
| D16 Report items | SM | row count → est 1.07B; loosen the prohibition to the verified capability (flexible aggregation surface, report-IDs-first guard unchanged) | user-confirmed |

## Preserve list (VWH-authoritative — do NOT overwrite)

| Keep | Why |
|------|-----|
| SoH freshness gate (48h GR-gap linchpin) | genuine VWH contribution KG lacks |
| Feed-states layer (`availability`/`expand_priority`/`expand_via`) | VWH-authoritative; the "7-11 PH only" scope note is KG's, not VWH's |
| Value weights / pools / SAP mappings | VWH-only knowledge (KG imports it separately) |
| VL evidence entries (VL-005, VL-018, …) | measurement provenance |

## Acceptance (from F8 tech-spec §W2b)

No formula in the profile contradicts a KG-verified derivation; every correction's provenance
comment cites the KG stamp it adopts; the preserve-list material is intact; the D8 dual note is
present; **the working tree is left uncommitted for operator review.**

## Report back (feeds the W2-close ADR in the nexus repo)

A short summary in the VWH session's final message: corrections applied (per D-item), D13 triage
outcome (columns alive or dropped), anything the live DB **refuted or changed** versus the table
above (a deviation is a finding, not a silent skip). The nexus architect extracts the owed ADR
("cross-model reconciliation disposition — verified derivations win; engagement knowledge
imports") once this lands.

## Handoff prompt (paste into a new plain session in the VWH repo)

```
Execute the F8-W2b correction pass per
D:\src\claude-plugins\nexus\docs\specs\F8-AnalyticsEnforcementValueLayer\delivery\w2b-plan.md —
read it first and follow it exactly: Step 0 (D13 triage) before anything, then the 16-row
correction table with per-item provenance citations, honoring the preserve list. Leave the
working tree uncommitted and end with the "Report back" summary the plan specifies.
```
