# Proposal — Analytics wave 2: the enforcement keystone, the model reconciliation, and the value layer

**Status:** Ratified — Laurentiu (ldumit), 2026-07-17 (in-session). Backlog row: F8.
**Decision-maker:** Laurentiu (ldumit)
**Recommendation:** A three-workstream follow-on to F3-AnalyticsBorrowWave — W1: ship a reference probe runner + conformance check (nexus-analytics' missing enforcement keystone, post-F3-pilot); W2: execute the semantic-model reconciliation dispositions now (VWH profile corrections from KG's verified derivations; KG imports of VWH's battle-tested value knowledge — W2 is independent of F3 and ready today); W3: feed-state + value/demand + SAP mapping fields on the `mine-semantic-model` output contract (trigger-gated, per F3's recorded non-goal, now with a proven reference shape).
**Confidence:** High — W2 rests on a row-level-verified cross-diff (12 conflicts, every one adjudicated by KG's 0/500 attestations or live probes); W1 generalizes a shape proven in KG (`run-probe.cs` + the F52 pilot); W3 changes nothing about F3's trigger discipline, only pre-stages the design input.
**Impact:** 7
**Effort:** med
**Date:** 2026-07-17

## Need

Three gaps, each measured this week (2026-07-17 evaluations):

1. **The shipped plugin's hardest guarantees are unenforced by default.** nexus-analytics' BR1
   (read-only DSN refusal), BR12 (EXPLAIN cost gate, fail-closed), and BR12c (bound-predicate
   check) exist only as a prose contract for a runner the consumer must build
   (`references/project-profile.md:50-51`, `probe-catalog.md:97-114`); no reference implementation
   or conformance test ships. This is the analytics twin of the mine family's #1 gap (prose-tier
   enforcement) and the same unclosed-seam class.
2. **The two semantic models of the same database materially disagree — and the client-facing one
   is wrong.** The entry-level reconciliation
   (`docs/research/2026-07-17-semantic-model-reconciliation.md`) found 12 conflicts across 20
   overlapping concepts: five of VWH's ten live KPI formulas are refuted or under-specified against
   KG's verified derivations (OOS complement identity, POG non-stack numerator, POG-light
   mechanism, SOS numerator+denominator, SFR non-reproducibility, price-compliance denominator,
   adjusted-OSA exclude-vs-credit), its bad-reports filter admits soft-deleted and low-quality
   reports (2 of 4 predicates), its SoH/price mappings point at the wrong tables, its store
   hierarchy columns die mid-July 2026, and its QA table doesn't exist. Conversely KG lacks eight
   classes of battle-tested VWH knowledge (measured phantom-inventory rate, SAP mappings, value
   weights, feed states/expansion levers, price-tag field measurements, derived-KPI semantics, SoH
   freshness gate, media map).
3. **The model's value dimension has no home in the mine estate.** KG's bundle answers "how to
   query truthfully"; nothing in the nexus-analytics output contract answers "what is worth
   computing, what's blocked, and what would unlock it" — VWH's `schema_map` feed states +
   `kpi_registry` value weights are the proven reference shape.

**Out of scope:** any change to F3 (Status: Ready stands; its Stage-0 pilot still gates its own
S1–S4); VWH loop machinery (boundary rule: method → plugin, data → project, loop → VWH); an
engine-computed scoring loop in the plugin (F3 non-goal, re-affirmed).

## Approach

**W2 — execute the reconciliation dispositions (ready now, independent of F3):**
- *VWH-side corrections* (VWH repo, `profiles/retail/`): fix D1–D7 formulas to KG's verified
  derivations; adopt the 4-predicate bad-reports filter (D9); remap SoH to
  `stock_history`/`stock_current` with the surrogate join and prices to `prices_history` (D10/D11);
  replace the dying flat hierarchy with `store_groups` (D13); delete the phantom
  `analytics_report_qa` mapping (D14); adopt the D12 grain conditioning and D15/D16 caveats. Each
  correction's provenance comment cites KG's verification stamp.
- *KG-side imports* (KG repo, via a `mine-semantic-model` **Refresh + interview** run promoting
  through the feedback ledger): the 8 ranked items — measured phantom-inventory rate, SAP mappings,
  value weights/pools, feed states + expansion levers, price-tag measurements, derived-KPI
  semantics (chronic-vs-acute OOS, availability decay, census coverage), SoH freshness gate, media
  map — landing with typed origins (`kb(citation)`/`interview(date)`).
- *Shared framing*: D8 phantom-vs-ISA decomposition documented in both models.
- **Side benefit:** the KG Refresh run is itself the "KG is run #2" real-run evidence F3 Stage-0
  wants for the relocated skill — W2 feeds F3's gate rather than waiting on it.

**W1 — reference probe runner + conformance check (post-F3-Stage-0):** generalize KG's proven
runner shape (`tools/run-probe.cs`: read-only DSN refusal, `SET TRANSACTION READ ONLY` + timeout +
`ROLLBACK`, EXPLAIN ceiling) into a shipped reference implementation under
`mine-semantic-model/tools/` plus a conformance checklist a consumer-built runner must pass —
mirroring the family's ADR-60 capability-contract pattern (a gate that cannot fail is no gate:
include an adversarial must-fail case). Postgres-first, seam documented for other engines. The
F3 pilot's runner experience feeds the requirements — hence post-Stage-0.

**W3 — value layer on the output contract (trigger-gated, design pre-staged):** extend the
`mine-semantic-model` output contract with optional constructs: per-source feed states
(`present/imported/absent` + expansion lever), per-measure value fields (weight, pool,
business-system mapping à la `sap_field`/`sap_app`). Trigger unchanged from F3's non-goal: the
pilot surfacing "why can't this be answered" friction (feed states) / analyst claims shipping to
stakeholders (value fields, downstream of F3's ledger). This proposal pre-stages the design input
(the reconciliation's §3 items 2–4), not the build.

## Benefits

- W2 removes verified wrongness from a client-facing profile (five refuted formulas, a filter
  admitting bad reports) and gives KG the value knowledge it structurally lacks — both models
  converge toward the union artifact the head-to-head identified as the ideal.
- W1 closes the plugin's largest scored gap (Grounding 5 → ~7): the guarantees stop being
  contract-only, and every future consumer inherits a working, conformance-checked runner instead
  of building one blind.
- W2's KG Refresh doubles as the plugin's first post-promotion real run — the single cheapest move
  on the analytics scoreboard (Proven value 4 → 6+), and it de-risks F3's own Stage-0.
- W3, when triggered, gives the mine estate the "what is it worth / what would unlock it" dimension
  with a battle-tested reference shape instead of a blank page.

## Alternatives

- **Fold everything into F3.** Rejected: F3 is Ready with a code-grounded critic pass; W1 needs
  pilot input F3-Stage-0 produces, W2 doesn't need F3 at all, and scope-creeping a Ready spec
  re-opens its review for no sequencing gain.
- **Skip reconciliation; let each model own its truth.** Rejected: they model the same database for
  the same client; the conflicts are not stylistic — VWH's OOS/POG/price numbers are computed
  differently from the platform's verified semantics, and its engagement deliverables inherit that
  wrongness. Measured, not hypothetical.
- **Have VWH re-mine its profile from scratch with mine-semantic-model.** Considered — it would
  exercise the skill on a second consumer — but rejected for now: KG's bundle already holds the
  verified derivations for the same DB; a targeted correction pass citing KG's stamps is a day, a
  re-mine is a campaign. Revisit if VWH's profile drifts again after corrections.
- **Build W1 as a generic multi-engine runner.** Rejected: Postgres is the only engine any consumer
  has needed; the KG shape is proven there. Generalize the seam, ship the instance (the family's
  adapter doctrine).

## Unresolved

1. W1 packaging: the same shipped-executable delivery question as machinery wave-2's Stage-0 spike
   (`mine-machinery-borrow-wave-2-2026-07.md`) — coordinate the two so the delivery mechanism is
   decided once.
2. W2 VWH-side execution home: the corrections belong to the VWH repo's own workflow (this repo
   only records the dispositions) — who runs that pass and when.
3. Whether the D8 phantom/ISA measured rate (67.4%, chain 22, June window) should enter KG as a
   dated *finding* (feedback-ledger entry) or a *measure annotation* — it is time- and
   chain-scoped, not a stable property.
4. W3's value fields: optional-constructs versioning on the output contract (additive, but the
   consuming validators need a compatibility rule).

## Graduate-to-spec

Technical branch (ADR-27/28): on ratification, W2 graduates immediately to a tech-spec (it is
execution-ready; expected ADR: "cross-model reconciliation disposition — verified derivations win,
engagement knowledge imports"); W1/W3 graduate after F3 Stage-0 lands their inputs. Backlog rows at
the next free `F{N}`, ranked by front-matter Impact/Effort.

## Provenance

Session 2026-07-17 (architect, Fable 5). Inputs: the analytics head-to-head
(`docs/research/2026-07-17-analytics-semantic-models-head-to-head.md`), the reconciliation cross-diff
(`2026-07-17-semantic-model-reconciliation.md` — 12 conflicts, dispositions §5), the nexus-analytics
plugin profile (this session), F3-AnalyticsBorrowWave (Ready; its citations re-verified live this
session), and the F52/KG pilot artifacts as the runner reference shape.
