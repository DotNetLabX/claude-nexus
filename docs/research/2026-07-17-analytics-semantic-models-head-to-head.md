# Analytics head-to-head: VWH retail_intelligence vs nexus-analytics — and the two semantic models of the same database

**Date:** 2026-07-17 · **Author:** architect session (Fable 5) · **Companion docs:**
[`2026-07-17-mine-family-vs-vwh-fresh-eval.md`](2026-07-17-mine-family-vs-vwh-fresh-eval.md) (parent
comparison), [`2026-07-17-market-scan-harnesses-and-mining.md`](2026-07-17-market-scan-harnesses-and-mining.md).

**Method.** Three independent evaluator agents, each confined to one repo: (A) VWH's semantic layer
(`D:\omnishelf\virtual-worker-harness\harness\flavors\retail_intelligence`), (B) knowledge-gateway's
semantic model (`D:\src\knowledge-gateway\seed\db\semantic-model`), (C) the `nexus-analytics` plugin
(this repo). Scores are synthesizer-assigned from the three profiles — this section is a comparative
synthesis, not the parent doc's blind protocol. Both semantic models describe the **same database**
(the fmcg_platform / OmniShelf Postgres), which makes §3 a rare like-for-like artifact comparison.
Includes a Fable re-evaluation of the F3-AnalyticsBorrowWave tech-spec (§5), whose nine load-bearing
citations were re-verified against live files this session — all held.

## 1. Verdict

**The parent pattern repeats at the analytics tile, almost score-for-score.** VWH
retail_intelligence (55/80) is the *proven, engine-enforced* half: real production findings on the
live DB, a gaming-resistant scoring lattice, and honesty machinery that caught a real gaming vector
— but its semantic model's *correctness* rests on a one-time operator smoke, and it only runs
inside a campaign it owns. nexus-analytics (53/80) is the *composable, audit-grammared* half: the
best provenance/lifecycle design in either system and a clean plugin/project boundary — but it has
never run post-promotion and ships its hardest guarantees as a contract for a runner the consumer
must build.

**On the semantic model itself — the part the owner calls the most important — the
knowledge-gateway bundle is the better semantic model, and it isn't close on correctness.** KG's
model is probe-verified, formula-reconciled (0/500 two-window attestations), boot-gated, and
provenance-typed; VWH's `formula` field is dead documentation and nothing mechanically checks its
schema mappings. **But VWH's model carries an entire semantic layer KG lacks: value.** Value
weights, demand gating, Δkpi→Δimpact coefficients, feed states with expansion levers. KG knows *how
to query truthfully*; VWH knows *what is worth computing and what an answer is worth*. The ideal
artifact is visibly the union, and F3 + one deferred feature (feed states) is most of the path.

## 2. Category scores — the two analytics systems

Same 8-category rubric as the parent doc (10 = state of the art; 5 = adequate; 2 = aspirational).

| # | Category | VWH retail_intelligence | nexus-analytics | Notes |
|---|----------|:-----------------------:|:---------------:|-------|
| 1 | Grounding & enforcement | **8** | 5 | VWH: engine-computed maximand, row-range evidence checks, citation-required coefficient strength, non-editable feedback log, 59 unit tests — docked for the scoring-inert schema map. nexus: BR1–BR13 each name an enforcer and probes ship as read-only-preambled SQL, but the runner (BR1/BR12 refusal logic) is consumer-owed and the query lane is pure prose. |
| 2 | Verification & skepticism | 7 | 7 | VWH: a gaming vector caught live (summed forecast → penalty-only), status-earned coefficients; no probe layer, no formula reconciliation. nexus: refutation-framed Audit mode, fact/judgment doctrine, answer-qa's inverted-claim rule; strong semantics, undelivered in anger. |
| 3 | Proven value | **8** | 4 | VWH: real production analyses on the live DB (VL-005 phantom inventory 67.4% confound-controlled; VL-011 classifier arc; honest nulls VL-014/017), client deliverables. nexus: zero post-promotion runs; its live evidence (KG pilot, phantom-column kill) is inherited, external, and explicitly not re-verified (eval finding F2). |
| 4 | Generality & extensibility | 6 | **7** | VWH: "any BI/DS task via swappable profile" is asserted with exactly one instantiated profile; connector hardcodes schema. nexus: genuine 10-item profile parameterization, representation-agnostic ladder — but Postgres-only probes, KG residue in 2 shipped files, CSV flavor unexercised. |
| 5 | Composability & workflow fit | 5 | **9** | VWH: campaign-owned; artifacts are portable YAML but semantics are data-coupled to the day-keyed facts shape. nexus: the whole design — thin nexus extension, skills chain (ladder → query → answer-qa; investigation → governed mine modes), model artifact consumable by any session or product. |
| 6 | State, resumability & audit | 7 | **8** | VWH: kernel ledger + per-line provenance comments; no per-construct typing or re-attestation. nexus: typed origin enum, idempotent refresh, never-ask-twice, per-construct resume, stamped run reports — best-in-class on paper, never instantiated from the plugin (docked from 9). |
| 7 | Economy | 7 | 7 | VWH: demand-gated coverage (padding the registry earns nothing) + kernel cost controls; no token accounting. nexus: diff-driven refresh, KB-first interview suppression, EXPLAIN ceilings; no measured cost data. |
| 8 | Operability & DX | **7** | 6 | VWH: briefing CLI, bootstrap, cookbook — but needs a campaign to run at all. nexus: `/data-analyst` + 4 skills, batched intake — but the consumer must build a runner, author a profile, wire a gate; CI release-check doesn't cover the plugin. |
|   | **Total** | **55/80** | **53/80** | Same complementarity as the parent comparison: proven+enforced vs composable+audited-but-unproven. |

**Asymmetry disclosure:** VWH's scores lean on production evidence; nexus-analytics' scores lean on
design quality plus inherited pilot evidence. A single real nexus-analytics run (F3 Stage 0) is the
cheapest possible move on this table — it either lifts Proven value 4→6+ or surfaces the gaps early.

## 3. The two semantic models of the same database

KG bundle = `seed/db/semantic-model/` (7 JSON files, ~186 KB) built by F38 hand-authoring → the F52
mining skill (the origin of nexus-analytics' `mine-semantic-model`) → **9 live mining runs**
(2026-07-08→10, 13 run reports). VWH profile = `profiles/retail/` (kpi_registry.yaml 24 KPIs,
schema_map.yaml, value_model.json) hand-seeded from the 133-KPI master registry + KB + value-ledger
corpus, agent-extended inside campaigns under demand gating.

### 3.1 Dimension scores (artifact-level)

| Dimension | KG bundle | VWH profile | Evidence |
|---|:--:|:--:|---|
| Semantic depth (grain, additivity, joins) | **9** | 5 | KG: 31 measures all with additivity class, numerator/denominator, `grainSafeReAgg`, AVG-of-percentages doctrine; 34 entities / 76 relationships; 26 dims + 5 hierarchies. VWH: grain/aggregation rules live in YAML *comments*; per-source feed grain, not per-KPI semantics. |
| Correctness verification | **8** | 3 | KG: 7 read-only probes, formula reconciliation 0/500 on two windows (OSA/OOS/POG), boot consistency gate that fails the host on dangling refs/duplicate aliases, SHA-256 model version, schema-hash drift gate. VWH: one-time operator smoke; `formula` never executed ("dead documentation"); mapping correctness mechanically invisible. |
| Provenance & lifecycle | **9** | 6 | KG: typed origins (`carried/data-derived/kb/code/interview`), idempotent refresh ("second Refresh over unchanged DB asks zero questions"), feedback ledger as mandatory leg-0 hypotheses, 90-day staleness nudge. VWH: good per-line provenance comments (VL/roast citations), campaign-driven growth — but drift already observed (FLAVOR.md's stale KPI count; connector SQL duplicating schema_map). |
| Negative knowledge | **9** | 4 | KG: compatibility refusals with reasons, `gold_*` anti-surfaces, join-guard hazards, dispositioned exclusions (DEFERRED/EXCLUDED with reasons). VWH: absent feeds only. |
| Value / business semantics | 3 | **9** | VWH: value weights, A/B/E pools, demand-gated coverage, Δkpi→Δimpact coefficients with citation-required strength, SAP field/app mappings, KPI-as-JOIN of observed-vs-intended. KG: nothing prices a query or ranks what to compute. |
| Coverage economics | 5 | **8** | VWH: coverage IS the maximand, demand-denominated — the model grows exactly where questions exist, padding earns nothing. KG: excellent dispositions but no demand signal decides what gets modeled next. |
| Machine consumability | 7 | 7 | KG: structured JSON but critical semantics in multi-hundred-word prose notes (one documented staleness incident, AC-10). VWH: clean small YAML but comment-tier semantics. |

### 3.2 The read

**These are two layers of one ideal artifact, built by two philosophies.** KG's bundle is a
*correctness* model — its build method (mine → probe → ground → interview → emit, then refutation
audits) produces claims with attestations, and its residual weaknesses are at the edges (a
nearly-vacuous runtime join-guard validator, the between-runs staleness window, undated
`carried(F38)` rows that never age out). VWH's profile is a *value* model — its build method
(seed from business corpus, grow under demand pressure inside campaigns) produces a catalog whose
every entry knows what it's worth and what unlocks it, and its residual weakness is exactly what
KG's method fixes: nothing proves the mappings.

**Which is better?** As a semantic model of the database: **KG, clearly** — it is deeper, verified,
and lifecycle-managed; it also models ~34 entities vs VWH's ~8 mapped tables. As an analytics
*operating asset*: incomplete without VWH's value layer — KG can tell you the SQL is safe and the
grain is right; it cannot tell you which of two hundred possible KPIs is worth an analyst-hour.

### 3.3 Borrow list

**Into the KG/nexus-analytics side:**
| # | Borrow | From | What it buys |
|---|---|---|---|
| A1 | **Value/demand layer** — value weights + demand gating + Δkpi→Δimpact with citation-required strength | `semantic.py`, `value_model.py` | The missing "what is it worth" dimension; F3's value-ledger (S1) is the lifecycle half; the scoring semantics are this half |
| A2 | **Feed states + expansion levers** on the entity graph (`present/imported/absent` + "what would unlock") | `schema_map.yaml` | Turns KG's DEFERRED/EXCLUDED dispositions into a demand-weighted expansion roadmap — the deliberately deferred "KPI feed-state coverage" feature, now with a proven reference shape |
| A3 | **Business-system mapping fields** (SAP field/app per KPI) | `kpi_registry.yaml` | Anchors each measure to the client's operational system — cheap columns, real stakeholder value |

**Into the VWH side:**
| # | Borrow | From | What it buys |
|---|---|---|---|
| B1 | **Probe-verified mappings** — run the 7 probe classes over schema_map at campaign start | `mine-semantic-model` probes | Kills VWH weakness #1 (scoring-inert schema map): a wrong JOIN/grain/stale column becomes mechanically visible |
| B2 | **Formula reconciliation attestations** (recompute vs stored, 0/N two-window) | KG measures.json pattern | Kills weakness #2 (dead `formula` field) — formulas become executed claims with dated stamps |
| B3 | **Load-time consistency gate + single-source schema knowledge** (generate or cross-check connector SQL from schema_map) | `SemanticModelConsistencyChecker` pattern | Kills weakness #3 (duplicated schema knowledge drifting); VWH already has the test culture to hold it |
| B4 | **Typed per-construct provenance + staleness aging** | KG provenance.json | Upgrades comment-tier provenance to auditable, ageable claims |

## 4. Does VWH have a semantic model of the database already? (direct answer)

**Yes.** `profiles/retail/` is an instantiated semantic model of the real fmcg_platform/OmniShelf
Postgres: 24 KPIs (15 live + 9 declared), real tables/columns with operational annotations (the
823M-row `analytics_report_items` warning, ~4% NULL on store zone/cluster, 4 join keys, chain
filter, bad-reports filter mechanics), 7 absent feeds each with an expansion lever, SAP mappings —
last enriched 2026-07-11. It is *not* synthetic-only: the synthetic task copies (5 KPIs) are
derivatives. Caveats from §3: its correctness machinery is thin (one-time smoke), and the stale KPI
count in FLAVOR.md shows drift is already real.

## 5. F3-AnalyticsBorrowWave — Fable re-evaluation of the opus-authored spec

**Verdict: GO — the spec stands as scoped. Confidence: high.** Re-verified this session against
live files, all nine load-bearing citations held: the `bump-plugin.mjs` `pluginOf` regex; both CI
gaps (`plugin-release-check.yml` gen-commands runs `nexus` only — and the gap is *live*, since
nexus-analytics ships a generated command; validate list lacks the plugin); answer-qa's missing
grounding/penalty content (S2 is genuinely net-new); the `## Registry invariants + refresh outcome
grammar` heading at `mine-family-core.md:139`; the deferral text at
`nexus-data-extension-2026-07.md:39-41`; VWH's `evidence_valid` rows-in-range gate
(`value_model.py:48-57`), the ten §CRAFT moves (`cookbook.md:210+`), `forecast-not-summed.md`; and
the boundary rule (`vwh-adoptions-2026-06.md:242-244`). The critic disposition is genuine (all 11
findings resolved in text), the Stage-0 gate has the evidence order right, and the Decisions
section discloses its judgment calls properly.

**What F3 contains vs what today's findings add — the owner's question answered:**

F3 deliberately covers the *honesty-discipline* wave only: value ledger (S1), answer-qa grounding
gate + penalty-only + provenance panel (S2), analyst-craft reference (S3), CI riders (S4), and two
pilot-gated Stage-2 items (boot briefing, interview expansion grammar). It does **not** contain —
and today's evaluation says these deserve their own rows, not F3 scope-creep:

1. **Reference probe runner + conformance check** *(new finding, the sharpest gap)*. nexus-analytics'
   hardest guarantees (BR1 DSN refusal, BR12 EXPLAIN cost gate, BR12c bound-predicate check) exist
   only as a contract for a consumer-built runner; no reference implementation or conformance test
   ships. This is the analytics twin of the family's M1 ("ship the enforcement runtime") and the
   same unclosed-seam class the parent eval ranks #1. KG's `run-probe.cs` is the proven shape to
   generalize. → **candidate F-row, post-Stage-0.**
2. **KPI feed-state coverage** (A2) — already an explicit F3 non-goal with a named trigger; §3
   strengthens the case and supplies the reference shape. → stays its own future feature; the
   pilot's "why can't this be answered" friction is the trigger, as speced.
3. **Value/demand scoring semantics** (A1, beyond the ledger's lifecycle) and **SAP-style mapping
   fields** (A3) — natural riders on the feed-state feature, not on F3.
4. **Family-level borrows** (recall golden set N1, market items) — nexus-core scope, tracked in the
   parent doc, not analytics scope.

One Stage-0 note worth adding when the pilot runs (not a spec change): the pilot's
`mine-semantic-model` run doubles as the freshness/refresh-path exercise for the relocated skill —
the spec already names KG as run #2; today's KG profile (9 mining runs, feedback ledger in active
use) confirms the refresh path is the valuable one to exercise.

## 6. Correction log

| Date | Change | Cause |
|---|---|---|
| 2026-07-17 (same day) | §3 intro's profile contents corrected: `profiles/retail/` ships `kpi_registry.yaml` + `schema_map.yaml` only — **`value_model.json` is not instantiated there** (the only instance is a placeholder seed in the example task). The Δkpi→Δimpact *mechanism* (`value_model.py`) and the registry's value weights stand; "value semantics 9" in §3.1 rests on those, not on an instantiated coefficient set. | The follow-up reconciliation pass (below) read the profile directory listing directly. |
| 2026-07-17 (same day) | §3's comparison superseded in one respect: the models were subsequently **cross-diffed entry-by-entry** — 20 overlapping concepts, 4 agree, **12 conflict**, 4 nuances; KG authoritative on derivations, VWH on value/engagement knowledge. Where §3 reads as "two valid layers", the reconciliation shows five of VWH's ten live formulas are refuted or under-specified against KG's verified versions. | [`2026-07-17-semantic-model-reconciliation.md`](2026-07-17-semantic-model-reconciliation.md). |

## 7. Limitations

- §2/§3 scores are synthesizer-assigned from three single-repo profiles — comparative judgment, not
  the parent doc's locked-blind protocol; treat ±1 as noise.
- The KG profile was read by one evaluator in one pass; its quality claims (0/500 attestations,
  boot-gate behavior) were not independently re-executed this round.
- VWH's retail evidence and the KG bundle share ancestry (same client, same KB lineage) — the two
  "philosophies" in §3.2 are not fully independent experiments.
