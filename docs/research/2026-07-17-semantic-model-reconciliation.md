# Semantic-model reconciliation: VWH `profiles/retail` ⇄ KG `seed/db/semantic-model` (same database)

**Date:** 2026-07-17 · **Author:** architect session (Fable 5); cross-diff executed by a dedicated
agent reading both artifacts · **Companion:**
[`2026-07-17-analytics-semantic-models-head-to-head.md`](2026-07-17-analytics-semantic-models-head-to-head.md).
**Feeds:** `docs/proposals/analytics-enforcement-value-layer-2026-07.md` (workstream W2).

## 0. Headline

Of **20 overlapping concepts**: **4 agree**, **12 conflict**, **4 differ in nuance**. On every
formula conflict, **KG's version carries reconciliation evidence** (0/500 two-window attestations,
code traces, live probes) while VWH's provenance is KPI-workbook/kb-comment lineage without
row-level verification. **Disposition rule: KG is authoritative on derivations; VWH is
authoritative on value/engagement knowledge.** Five of VWH's ten live formulas are refuted or
under-specified; several of its schema mappings point at wrong/dying tables. Conversely, KG lacks
eight classes of battle-tested VWH knowledge (measured rates, SAP mappings, value weights, feed
states) worth importing.

**Scope correction (to the head-to-head doc):** `profiles/retail/value_model.json` does **not**
exist — the profile ships only `kpi_registry.yaml` + `schema_map.yaml`. The Δkpi→Δimpact
*mechanism* is real (`value_model.py`), but the only instantiated value_model.json is a placeholder
seed in the example task. VWH's value layer is mechanism + registry weights, not an instantiated
coefficient set.

## 1. Concept overlap map

| Concept | VWH entry | KG entry | Match |
|---|---|---|---|
| OSA (products) | `osa` KR:42 | `osa-pct` M:18 | same (grain nuance → D12) |
| OSA (facings) | `osa` comment KR:43-44 | `osa-facings-pct` M:96 | same |
| OOS | `oos` KR:55 | `oos-pct` M:28 | **D1** |
| POG (strict) | `pog_compliance` KR:68 (+`r2p` KR:31) | `pog-pct` M:38 | **D2** |
| POG light | `pog_light` KR:172 | `pog-light-pct` M:48 | **D3** |
| SOS | `sos` KR:79 | `sos-pct` M:58 / `sos-overall-pct` M:68 | **D4** |
| Shelf fill rate | `sfr` KR:90 | `shelves-fill-rate-pct` M:116 | **D5** |
| Price compliance | `price_tag_compliance` KR:101 | `price-compliance-pct` M:86 | **D6** |
| Adjusted OSA | `adjusted_osa` KR:123 | `adjusted-osa-pct` M:259 | **D7** |
| Phantom inventory | `phantom_inventory` KR:112 + VL-005 | `isa-pct`/`no-stock-pct` M:239/249 | **D8** (nuance) |
| Bad-reports filter | SM:38 | EG:9 | **D9** |
| Inventory/SoH source | SM:70-77 (`product_stock`) | `stock_level` EG:58, `stock-on-hand` M:292 | **D10** |
| Price master source | SM:64-69 (`prices`) | `reference_price` EG:60 | **D11** |
| Aggregation & grain | KR:14-15, SM:39-45 | M:6-16 (grainException/BR1-2) | **D12** (nuance) |
| Store hierarchy | SM:78-83 | EG:48-51 + dimensions.json:26-32 | **D13** |
| Ground truth / QA | SM:84-87 (`analytics_report_qa`) | none — table doesn't exist | **D14** |
| Planogram targets | SM:53-63 | EG:17, EG:53-56 | **D15** (nuance) |
| Report-items grain | SM:46-50 | `report_item` EG:27-28 | **D16** (nuance) |
| Chain filter + join keys | SM:18-19 | EG relationships | same |
| KPI thresholds | SM:43-45 | `kpi_threshold` EG:65-66 | same |

One-sided: **13 VWH-only** (4 live + 9 declared KPIs — census_coverage, availability_decay,
chronic_oos_share, assortment_gap, depletion, oos_revenue_risk, promo_execution_verification,
trade_funds_recovery, closed_loop_lift, expiry_fifo_compliance, labor_yield, footfall_conversion,
cctv_replenishment_signal — plus the blob/media map). **8 KG-only** (sos-linear-pct,
task-completion-pct, osa-window-pct, lost-reports/failed-upload-runs, incompliance-count,
scan-count/stores-scanned, ISA/no-stock as named measures, plus all join-guards + compatibility
statements).

## 2. The conflicts (full detail)

**D1 · OOS — CONFLICT.** VWH: `100 − osa` (KR:55). KG: `SUM(out_of_shelf_products_count) /
SUM(planogram_products_count)` with the denominator deliberately moved off the (osa+oos) identity —
"correct when an item is undetected — neither osa nor oos" (M:24,32-33). Where undetected items
exist, OSA+OOS < 100 and the complement identity breaks. **KG right** (0/500 on two windows).

**D2 · POG strict — CONFLICT (numerator).** VWH: `correct_position_products / planogram_facings`
(KR:68). KG numerator is `correct_position_non_stack_products_count` — equal "only when nothing is
vertically stacked" (M:43-44). Denominators agree. **KG right** (two-fix correction, 0/500).

**D3 · POG light — CONFLICT (mechanism).** VWH: "present-but-slightly-misplaced/stacked counted OK"
(KR:170-171). KG: relaxation is `+ incompliance_reason_products_count` in the numerator — "the
earlier 14/500 residual was exactly the incompliance_reason rows" (M:52-54). **KG right** (0/500).

**D4 · SOS — CONFLICT (numerator AND denominator).** VWH: `brand_or_category_facings /
total_shelf_facings` (KR:79). KG `sos-pct`: per-SKU `min(planogram_facings, report_facings)` summed
over planogram-EXPECTED facings, "NOT realogram facings" (M:62-63, code-traced to
`StatisticsShareOfShelfBuilder:61-81` + pinning test). VWH's formula actually matches KG's
*distinct* `sos-overall-pct` — which KG explicitly warns "do not conflate" (M:73). **KG right.**

**D5 · Shelf fill rate — CONFLICT.** VWH: `actual_shelf_fill / planogram_shelf_fill` (KR:90). KG:
the mobile SDK's `shelf_data.fillRate` stored verbatim — "NO stored count ratio reproduces it…
AVG only, NEVER recompute" (M:119-121, refutation-tested). **KG right.**

**D6 · Price compliance — CONFLICT (denominator) + missing gate.** VWH: `tags_matching /
detected_tags` (KR:101). KG: correct tags over **planogram-expected** products — "CORRECTED …
detected_price_tags_count (F38) → planogram_products_count, DATA-VERIFIED 0/104" (M:89-92) — plus
the `price_tags_reading_enabled` answer gate (FALSE on all 640k clean PH June reports) that VWH's
own VL-018 suspects but never encodes. **KG right.**

**D7 · Adjusted OSA — CONFLICT (exclude vs credit).** VWH: "excluding out-of-shelf items with
zero-stock index codes" (KR:123) — reproducing the platform tooltip error KG explicitly flags:
zero-stock OOS products are "CREDITED INTO THE NUMERATOR … denominator UNCHANGED … the tooltip's
'excludes' wording is WRONG" (M:262); zero-stock set comes from `stock_history` at ≤ report date,
with fallback to plain OSA. **KG right** (code-grounded, user-verified).

**D8 · Phantom inventory vs ISA — NUANCE (same predicate, opposite business reading).** Same
signal: OOS ∧ SoH>0. VWH reads it as phantom stock (measured: 67.4% of ~33k obs, confound-checked
at 67.0%; VL-005). KG reads it as ISA — "replenishable from the back room" (M:242). VWH's own
operator note reconciles: the population decomposes into wrong counts AND back-room stock,
store-dependent (VL-005:86-89). **Both right; each lacks the other's half — document both readings
in both models.**

**D9 · Bad-reports filter — CONFLICT (2 vs 4 predicates).** VWH: `is_valid ∧ ¬ignore_in_analytics`
(SM:38). KG: four ANDed predicates — adds `is_good_quality` and `deleted_at IS NULL`
("is_valid=true rows can and do carry a non-null deleted_at"); ~48% of reports pass (EG:9,
provenance:10, verified live on a ~1.21M-report window). VWH's filter admits soft-deleted and
low-quality reports. **KG right.**

**D10 · SoH source — CONFLICT (table + join key).** VWH: `product_stock` joined on
`index_code = index_codes.code` (SM:72-74). KG: `stock_history` (25M rows, temporal truth) /
`stock_current`, joined on the **surrogate** `index_code_id → index_codes.id` (EG:58,186-187) —
and VWH's own VL-005 queried `stock_current`, contradicting its schema_map. VWH's freshness caveat
(48h GR gap linchpin, SM:75-77) is genuine and KG lacks it; KG's "7-11 PH only" feed-scope note is
absent from VWH. **KG right on mapping; VWH contributes the freshness caveat.**

**D11 · Price master — CONFLICT (table).** VWH: `prices` (SM:66). KG: `prices_history` (108M, 35
monthly partitions) / `prices_current` (105M), live-probed; plus the reference-price vs
OCR-observed price_tag distinction VWH blurs (EG:60). **KG right.**

**D12 · Aggregation & grain — NUANCE.** VWH: unconditional "percentages AVG, counts SUM"
(KR:14-15). KG agrees at row grain but conditions second-stage rollups: recompute
`SUM(num)/SUM(den)` at the target grain (BR1/BR2, M:13-15). VWH's rule silently equal-weights
unequal sub-populations beyond the connector's single-pass grain. **Adopt KG's conditioning.**

**D13 · Store hierarchy — CONFLICT (freshness).** VWH: `stores.zone/cluster/ofc/district_manager`
(SM:78-83). KG: flat columns being **dropped ~mid-July 2026**, superseded by
`store_groups`/`store_group_levels` (dimensions:26-32, user-directed 2026-07-09). VWH's hierarchy
dies this month. **KG right.**

**D14 · Ground truth — CONFLICT (phantom table).** VWH: `analytics_report_qa` (SM:86). KG's live
whole-area mine enumerates all 15 `analytics_*` tables — no such table exists; QA lives as columns
on reports (EG:6). **KG right (DB = truth).** Note the irony: a phantom *table* in the profile of
the system whose flagship finding is phantom *inventory* — and the exact defect class
(phantom column, F38) that motivated the mine-semantic-model skill.

**D15 · Planogram targets — NUANCE.** VWH lists `planograms.target_osa/target_pog` as usable
(SM:59-60); KG: ~98% null rarely-set overrides — real thresholds resolve via `task_kpis`, and
grading binds to `planogram_versions` via `planogram_version_id`, not the header (EG:17,54). Both
already agree on task_kpis at runtime. **Adopt KG's null-rate caveat.**

**D16 · Report items — NUANCE.** VWH: "823M rows, restricted to shelf-position/recognition work"
(SM:50). KG: est **1.07B** rows, same report-IDs-first guard, but user-confirmed as a flexible
aggregation surface for rollups the `*_stats` tables can't do (EG:28). VWH's row count is stale and
its prohibition stricter than the verified capability.

## 3. Battle-tested VWH knowledge absent from KG (import candidates, ranked)

1. **Measured phantom-inventory rate** — 67.4% (date-aligned, ~33k obs, chain 22; confound-checked
   67.0%; per-store decomposition mandate) — VL-005. KG has the columns, not the finding.
2. **SAP field/app mapping per KPI** (e.g. "Inventory Discrepancy (Mvt Type 711/712)") — KG has
   zero SAP surface; this is the displacement/value story.
3. **Value weights, pools (A/B/E), cited coefficients** — incl. provenance-adjusted revisions
   (labor_yield 0.9→1.4 on the 160h/store/month finding) and cookbook §SOURCES elasticities.
4. **Feed states + expansion levers** — `present/imported/absent` per source, `expand_priority`,
   per-absent-feed unlock mapping. KG models only what exists; no "what to connect next" layer.
5. **Price-tag field measurements** — 87% expected tags missing; 53% of read tags wrong; compliance
   9.3%/12.4% (chains 22/41) — VL-018.
6. **Derived-KPI semantics** — chronic-vs-acute OOS routing (VL-012), audited-vs-experienced
   availability decay (VL-014, "highest-value runnable-now"), census coverage.
7. **SoH freshness gating** — the 48h goods-receipt gap / master-data-readiness gate.
8. **Blob media map** — panorama/price-crop containers, per-report URL pattern.

## 4. KG knowledge absent from VWH (top 5 — feeds the VWH-side fix list)

1. The four-predicate bad-reports filter + `is_valid` materialization mechanics (~48% pass rate).
2. The five verified formula corrections (D2/D3/D5/D6/D7 shapes) with 0/500 stamps.
3. Additivity/grain law (BR1/BR2; semi-additive SoH never summed over time; rolling-window hazard)
   + compatibility refusals.
4. Join hazards: brand↔category fan-trap, surrogate-id stock join, temporal feed guards, the
   253M-row `planogram_version_items` binding rule, gold-tables anti-surface.
5. Deprecations/freshness: flat hierarchy dropping mid-July 2026, `price_tags_reading_enabled`
   gate, special-purpose category exclusion.

## 5. Recommended dispositions (owner ratifies; work routed via the analytics proposal W2)

| Direction | What | Where the work lives |
|---|---|---|
| **VWH ← KG (corrections)** | Fix D1–D7 formulas from KG's verified derivations; fix D9 filter to 4 predicates; remap D10/D11 to `stock_history`/`prices_history` + surrogate join; replace D13 hierarchy with store_groups; delete the phantom D14 table; adopt D12 conditioning, D15/D16 caveats | VWH repo, `profiles/retail/` (its own correction pass; KR provenance comments should cite KG's stamps) |
| **KG ← VWH (imports)** | §3 items 1–8, via `mine-semantic-model` Refresh + interview + curation promotion (typed origins `kb(citation)`/`interview(date)`) | KG repo, `seed/db/semantic-model/` + feedback ledger |
| **Both (shared framing)** | D8: document phantom-vs-ISA decomposition in both models | both |

## 6. Counts

20 overlapping concepts · 4 agreements · **12 conflicts** · 4 nuances · 13 VWH-only · 8 KG-only.
