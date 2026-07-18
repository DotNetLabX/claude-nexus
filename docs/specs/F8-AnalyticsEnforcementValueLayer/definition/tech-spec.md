# F8-AnalyticsEnforcementValueLayer — reconciliation dispositions, probe-runner keystone, value layer

**Status:** Ready (W2 executed 2026-07-17/18 — KG side committed; W1 stage-gated; W3 **triggered
2026-07-18**, definition in `w3-value-layer-spec.md`) — architect (Fable 5), 2026-07-17;
code-grounded critic returned GO-with-fixes same day, all findings folded (1 HIGH, 3 MEDIUM,
4 LOW — see `## Critic disposition`).
Ratified proposal: `docs/proposals/analytics-enforcement-value-layer-2026-07.md` (Laurentiu,
2026-07-17). This tech-spec is deliberately lean: the binding analysis lives in the reconciliation
doc and the proposal; this file fixes execution order, homes, and acceptance.
**Binding inputs:** `docs/research/2026-07-17-semantic-model-reconciliation.md` (the D1–D16 conflict
register + §3 import list + §5 dispositions — the single source of truth for W2 content);
`docs/research/2026-07-17-analytics-semantic-models-head-to-head.md` (scores + borrow rationale).
**Boundary rule (unchanged):** method → plugin, data → project, loop → VWH. F3 is untouched; its
Stage-0 pilot still gates F3's own S1–S4.

## W2 — reconciliation dispositions (execution-ready NOW; two runbooks, two repos)

**W2a — KG-side import** (home: `D:\src\knowledge-gateway`; operator-triggered session there):
- **Prep step (critic L4):** the §3 items are VWH-sourced and not currently in KG's feedback
  ledger — first stage them as **open entries in `docs/model-feedback/`**, then run the governed
  `mine-semantic-model` **Refresh** over `seed/db/semantic-model/` with the ledger-first
  discipline (KG's Audit-mode "leg 0" rule, applied to this Refresh) consuming them as hypotheses.
- **Import scope (critic HIGH-1 — items 2–4 are W3's constructs, not W2a's):**
  - Items **1, 5, 6, 7, 8** (phantom-inventory rate, price-tag measurements, derived-KPI
    semantics, SoH freshness gate, media map) import fully — into existing construct types
    (measure/dimension/entity annotations) or dated ledger entries per the placement rule below.
  - Items **2, 3, 4** (SAP mappings, value weights/pools/coefficients, feed states + expansion
    levers) land in W2a **only as unstructured knowledge** — dated feedback-ledger/KB entries
    citing the VWH source — **never as new model construct types**: KG's bundle has no
    value/SAP/feed construct today, and inventing ad-hoc ones now creates rework for W3's
    standardized optional-constructs contract, which owns that dimension. Item 3 (named
    explicitly, incl. the labor_yield 0.9→1.4 revision) follows this same unstructured route.
- Per-item placement rule (**narrows** proposal Unresolved #3 — critic M2; the
  ledger-vs-annotation binary stays a per-item run-time decision recorded in the run report):
  stable structural knowledge → existing-construct annotations with `kb(citation)` /
  `interview(date)` origins; time/chain-scoped findings (67.4% rate, VL-018 measurements) → dated
  ledger entries or measure *annotations*, never stable properties.
- D8 dual framing (phantom ⇄ ISA) added to the ISA/no-stock measure notes.
- **No derivation changes** — KG is authoritative on formulas (D1–D7 resolved in KG's favor).
- Skill resolution: prefer the nexus-analytics plugin's `mine-semantic-model` (this run doubles as
  the relocated skill's run-#2 evidence, F3 Stage-0); if the project-local F52 skill shadows it —
  precedence direction is unconfirmed in-repo (critic L3) — proceed and record which executed:
  the import is valid either way; the run-#2 evidence claim attaches **only** if the plugin skill
  actually executed.
- Accept: stamped run report in `docs/model-runs/`; validation gate green; provenance ledger rows
  for every imported annotation; the §3 staging entries present in `docs/model-feedback/`; working
  tree left uncommitted for operator review.

**W2b — VWH-side corrections** (home: `D:\omnishelf\virtual-worker-harness`; operator-triggered
session there): correct `profiles/retail/` per reconciliation §5 — D1–D7 formulas to KG's verified
derivations, D9 four-predicate filter, D10/D11 table+join remaps, **D13 store_groups migration —
TIME-CRITICAL (critic M3): the flat hierarchy columns drop ~mid-July 2026, i.e. as of this spec's
date; if already dropped, the current mapping is live-broken and D13 becomes a repair, not a
migration — check first, run soonest**, D14 phantom-table deletion, D12/D15/D16 caveats, and
**D8: annotate `phantom_inventory` (KR:112 / VL-005) with KG's ISA/back-room reading** (critic M1
— the dual framing lands in BOTH models, not only KG). Each correction's provenance comment cites
the KG verification stamp it adopts. Accept: no formula in the profile contradicts a KG-verified
derivation; the VWH-authoritative material is preserved, not overwritten — the SoH freshness gate
and the **feed states** layer (availability/`expand_priority`/`expand_via` — critic L2; "feed
scope 7-11 PH only" is KG's note, not VWH's); the D8 dual note present.

W2a and W2b are independent of each other and of F3; **W2b's D13 is the time-critical item — it
should not wait on anything else**. Neither edits this repo —
F8's nexus-side W2 deliverable is only the dispositions record (already landed) and, at close,
extraction of the owed ADR: **"cross-model reconciliation disposition — verified derivations win;
engagement knowledge imports"** (ADR-28: extract, never re-author).

## W1 — reference probe runner + conformance check (gated: after F3 Stage-0 pilot)

Generalize KG's runner shape (`.claude/skills/mine-semantic-model/tools/run-probe.cs` in the KG
repo — critic L1) into `plugins/nexus-analytics/skills/mine-semantic-model/` shipped tooling + a conformance checklist with an adversarial must-fail case (ADR-60 pattern).
Postgres-first. **Coordinate the delivery mechanism with F7's Stage-0 spike — one decision for both
waves** (proposal Unresolved #1). Plugin bump rides the wave that ships it (MINOR — new capability).

W3 note (2026-07-18): the value-model construct-id validator ships KG-local (docs/semantic-model/tools/validate-value-model.cs, net-new sibling — W3 plan Decision D2). It is a candidate input to this lane's generalization pass; W1 decides adopt/ignore at its gate — W3 does not pre-empt the delivery-mechanism decision (shared with F7-S0).

## W3 — value-layer output contract (gated: F3's recorded triggers, unchanged)

Feed states + expansion levers; per-measure value fields (weight, pool, business-system mapping).
Design input pre-staged = reconciliation §3 items 2–4. Build only on trigger: pilot surfaces
"why can't this be answered" friction (feed states) / analyst claims ship to stakeholders (value
fields). ~~Additive optional constructs; consuming validators get a compatibility rule.~~
*(Superseded 2026-07-18 — the supplement's separate-artifact decision dissolves proposal
Unresolved #4: the `mine-semantic-model` output contract is untouched by W3; no compatibility
rule exists to plan for.)*

**Triggered 2026-07-18 (owner decision, ahead of the recorded pilot-friction triggers).**
Definition: `w3-value-layer-spec.md` (same folder, PO-shaped; **Ready 2026-07-18** — critic
REVISE → all folded → delta ACCEPT).
Decisions locked there: skill-first (`value-briefing`, no agent persona), first consumer =
omnishelf-analytics product repo only, artifact home = KG `docs/value-model/` governed (outside
`seed/db/` — the bundle stays value-free per critic HIGH-1). This section remains the gate/order
record; the supplement is the W3 content authority.

Plan: ../delivery/plan.md (2026-07-18) — W3 planned. W1 remains gated.

## Decisions

- **Lean pointer-spec, not a restatement** — the reconciliation doc is the content authority; this
  spec fixes homes/order/acceptance only. (Two-way door; rejected: full restated tech-spec —
  duplicate authority drifts.)
- **W2 split into two repo-scoped runbooks executed where the artifacts live** — this repo never
  edits KG or VWH artifacts. (Two-way door; rejected: running the edits from this session — wrong
  repo boundaries, no local gates.)
- **F7/F8 delivery-mechanism decision unified** — recorded in both artifacts. (Deferred-shared,
  status: deferred to F7 Stage-0.)

## Critic disposition (2026-07-17, code-grounded, verdict GO-with-fixes — all folded)

| Finding | Disposition |
|---|---|
| HIGH-1 W2a "items 1–8" collided with W3's ownership of items 2–4; item 3 unplaced; no KG construct home exists | Fixed — W2a scoped: items 1/5/6/7/8 import fully; items 2–4 (incl. item 3 by name) land as unstructured ledger/KB entries only; W3 owns the structured contract |
| MEDIUM-1 D8 dual framing only landed KG-side | Fixed — D8 annotation added to W2b |
| MEDIUM-2 "resolves Unresolved #3" overclaimed | Fixed — reworded to "narrows"; ledger-vs-annotation is a per-item run-time decision recorded in the report |
| MEDIUM-3 D13 deadline is at/past the spec date; "either may run first" undersold it | Fixed — D13 flagged TIME-CRITICAL with the already-dropped repair contingency |
| LOW-1 run-probe.cs path imprecise | Fixed — full KG path cited in W1 |
| LOW-2 "feed scopes" mislabeled VWH's feed-states layer | Fixed — feed states named; the "7-11 PH" scope note attributed to KG |
| LOW-3 skill-shadowing precedence unconfirmed in-repo | Fixed — disclosed; run-#2 evidence claim explicitly contingent on the plugin skill executing |
| LOW-4 "leg-0" is Audit-mode vocabulary; §3 items not yet ledger entries | Fixed — prep step added (stage §3 items as open ledger entries first); wording corrected |

## Open questions

None blocking W2. W1/W3 questions are recorded in the proposal's Unresolved and resolve at their
gates. (Standing L3 question: does a project-local skill deterministically shadow a same-name
plugin skill? Unverifiable from repo docs — the W2a hedge makes it non-blocking; worth settling
once via the F7-S0 spike session, which is already probing platform behavior.)
