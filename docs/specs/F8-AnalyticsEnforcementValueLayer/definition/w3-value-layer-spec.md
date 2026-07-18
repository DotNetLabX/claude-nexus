# F8 W3 — Value Layer: construct contract + value-briefing capability

**Status:** Ready (2026-07-18) — code-grounded critic **REVISE** (1H/3M/2L) → all folded same
day → delta re-verify **ACCEPT** (see `## Spec review`)
**Shaped:** PO (Fable 5), 2026-07-18 — from the W2a-staged raw material. Supplements the F8
tech-spec's `## W3` section: that section stays the gate/order record; this file is the W3
content authority.
**Plan:** `docs/specs/F8-AnalyticsEnforcementValueLayer/delivery/plan.md` (2026-07-18)
**Trigger:** pulled by owner decision 2026-07-18, ahead of the recorded pilot-friction triggers —
the VWH raw material is freshly imported, and the three open ledger entries otherwise nag every
analytics run as still-open (KG's BR-C mandatory dispositions).

**Owner decisions locked (2026-07-18):**

1. **Delivery shape: skill-first** — a gated `value-briefing` skill in nexus-analytics. No
   intelligence-analyst agent in this slice; defer until the skill proves demand.
2. **First consumer: the omnishelf-analytics product repo only** — KG's web-ask stays a pure
   accuracy surface; value content never enters `seed/db/` grounding.
3. **Value-model artifact home: KG `docs/value-model/`, governed** — KG owns it; edits land only
   via governed runs (ledger entry → run disposition → value model), sibling discipline to
   `docs/model-feedback/` + `docs/model-runs/`. The product repo pulls it as a second, opt-in
   sync artifact (KG → product one-way, like the bundle sync; never product → KG). VWH remains a
   historical source, not a live upstream.
4. **Spec home: this F8 lane** — no new feature slug.

**Consequence (critic M2): proposal Unresolved #4 is dissolved.** The separate-artifact decision
(3) means NO additive optional constructs land on the `mine-semantic-model` output contract and
NO consuming-validator compatibility rule is needed — the output contract is untouched by W3.
The tech-spec's original W3 sentence describing that shape is marked superseded there.

## Problem

After W2a, the battle-tested VWH value knowledge sits as raw material with no structured home:
three open ledger entries in KG (`docs/model-feedback/analytics.md` — SAP mappings, value
weights/pools incl. the labor_yield 0.9→1.4 revision, feed states + expansion levers) and the OD
KB draft (`kb/analytics-value-model-vwh-import.md` — the full 24-KPI table + S001–S007
coefficient register). Nothing validates it, nothing joins it to the semantic model, and no tool
is sanctioned to use it. Anyone asking "what is this worth / what should we prioritize" today
gets either nothing or ungoverned improvisation — while the accuracy surface must stay exactly
as clean as the F8 critic correction left it (no value/SAP/feed constructs in the bundle).

## Deliverable 1 — the value-model contract (data)

A structured, validated artifact carrying, per KPI:

- **pool** (A / B / E, composites allowed — operational, monetizable, enabler),
- **value weight** incl. provenance-adjusted revisions (labor_yield 0.9→1.4 with its evidence),
- **SAP displacement mapping** (field + Fiori app) where sourced,
- **elasticity/coefficient sources** (S001–S007) carried WITH their guardrails — dimensional
  plausibility (a 1pp OOS reduction is worth fractions of a percent of category revenue, never
  20%) and the confounds-to-encode list (phantom inventory, substitution, promo, seasonality),
- **provenance** in the schema-v2 grammar — cited origins, truthful `verified` dates, no scalar
  confidence values.

Contract rules:

- **Joined to the KG semantic model by construct id** where one exists (measureId / termId); by
  VWH KPI id otherwise — rows with no KG construct are legal and explicitly marked so.
- **Fail-closed validation:** every referenced construct id must resolve against the bundle;
  the provenance-grammar rules apply. A validation failure blocks the run that produced it.
- **Home: KG `docs/value-model/`** — outside `seed/db/` (hard boundary: everything under
  `seed/db/` is served recursively as answer grounding by the KG ask path).
- **Feed states split (corrected per critic M1):** the durable knowledge imports as value-model
  rows — the feed taxonomy itself (the structurally-integrated PRESENT class and the
  un-integrated ABSENT class with its unlock map), `expand_via` / `expand_priority` semantics,
  the operator expansion ranking, and per-KPI blocked flags. Only the truly operational part
  stays OUT: per-client import lag / live coverage drift (the IMPORTED class's "may lag per
  client" status). No connected-vs-blocked knowledge is dropped by this split.
- Machine-consumable — whatever format the plan picks must parse with a stock parser (the
  JSON / YAML / CSV class; no bespoke grammar); the exact file shape/format remains the
  architect's plan-time call (skeptic SF-2 fold: gives "machine-consumable" a pass/fail floor).
- Seeded from the three W3-parked KG ledger entries + the OD KB note's 24-KPI table.

## Deliverable 2 — the value-briefing skill (activation)

A nexus-analytics plugin skill — the ONLY sanctioned reader of value content in agentic flows:

- **Invoked explicitly** for an intelligence task (worth / prioritization / monetization /
  displacement questions). The default accuracy flows (`semantic-model-query`,
  `data-investigation`, `answer-qa`) never load it.
- **Loads:** the consuming project's value model + the cited KB sources + — where the consuming
  project maintains a model-feedback ledger — that area's open entries. The ledger input is
  optional and may legitimately be empty: the first consumer (the product repo) hosts no ledger,
  and Deliverable 3 closes the three staged entries (critic L2 fold). KB sources are enrichment,
  not a hard dependency: the value model's provenance rows carry their citations inline, and
  where a cited KB source file is not locally reachable (the product repo pulls only the value
  model), the briefing runs on the embedded provenance and DISCLOSES which sources were
  unavailable (skeptic SF-3 fold).
- **Output:** a briefing in which every number is labeled **measured vs estimated** — measured =
  KG-verified constructs/probe evidence; estimated = coefficient-derived — with the guardrails
  enforced in-method: a dimensional-plausibility violation is refused or flagged, never emitted
  as a plain number; confounds are declared alongside any estimate they threaten.
- **Project-parameterized** like `mine-semantic-model`: the value-model location and any
  project-specific inputs come from the consuming project's profile; the shipped skill contains
  no KG-specific paths.

## Deliverable 3 — ledger closure + consumer wiring

- A governed run migrates the three W3-parked ledger entries' content into the value model and
  closes them **grounded** — each resolution line points at the value-model rows. BR-C stops
  dispositioning them on every subsequent run.
- The product repo's owner-pulled sync gains the value model as a second, **opt-in** artifact —
  an owner-owned change in the product repo (`scripts/sync_model.py`, today a hardcoded
  single-bundle copy; the extension is additive — new source/dest + flag), sequenced AFTER the
  value model first exists in KG; same one-way direction as the bundle sync, documented there
  (critic M3 fold).
- KG web-ask: untouched (negative acceptance below).

## Non-goals

- No value/SAP/feed fields in the semantic-model bundle (`seed/db/semantic-model/`) — this
  boundary is permanent for this slice, not deferred.
- No KG runtime changes (AskEngine, endpoints, prompts, grounding roots).
- No intelligence-analyst agent persona.
- W1's probe-runner/tooling generalization stays its own workstream — this slice does not ship
  or move probe tooling.
- No live feed-coverage tracking (ops state, not model knowledge).

## Acceptance criteria (pass/fail)

1. A value-model artifact exists under KG `docs/value-model/` carrying all 24 VWH KPI rows
   (pool, weight, SAP mapping where sourced), the S001–S007 coefficient register with both
   guardrail classes, and provenance for every value/weight/mapping.
2. Validation is fail-closed and demonstrated by must-fail cases: corrupting one construct id →
   non-zero exit; introducing a scalar-confidence leaf → non-zero exit.
3. The three W3-parked ledger entries are closed **grounded** with resolutions pointing at the
   value model; the next analytics-area run reports zero still-open W3-parked dispositions.
4. The `value-briefing` skill ships in nexus-analytics (MINOR bump + CHANGELOG); a briefing over
   a sample intelligence question labels every number measured vs estimated, and a
   dimensional-implausibility probe is refused/flagged (must-fail demo recorded).
5. Grep-checkable negatives: zero value/SAP/feed tokens under `seed/db/semantic-model/`; KG ask
   path sources untouched.
6. The product repo pulls the value model via its sync script as an opt-in second artifact —
   an owner-run change made in the product repo after the value model exists, verified by one
   owner-run sync (documented there).
7. The default accuracy flows contain no value-model reference — grep over the three shipped
   skills (verified clean 2026-07-18, critic pass). Measured-vs-estimated labeling lives ONLY in
   `value-briefing` (AC-4): `answer-qa` carries no estimate-labeling rule today and is
   deliberately untouched in this slice — adding one would modify a default accuracy flow,
   which the Non-goals forbid (critic HIGH fold).

## Open questions (plan-time, architect)

- Value-model file format: JSON + provenance sidecar mirroring the bundle style, vs a single
  structured file.
- Validator home for the construct-id join check — **net-new capability**, not an extension of
  the existing grammar scan (`validate-provenance.cs` today validates provenance grammar only —
  critic L1): a sibling tool vs extending the validator; coordinate with W1's
  tooling-generalization lane, do not pre-empt it.
- Briefing output contract (required sections/labels) — skill-design time.
- Whether the OD KB note stays the published human-readable companion or is superseded by the
  value model + a pointer.

## Spec review (2026-07-18 — code-grounded critic, verdict REVISE → all folded same day)

| Sev | Finding | Fold |
|---|---|---|
| HIGH | AC-7 falsely claimed `answer-qa` ships an estimate-labeling rule — either a false claim about shipped code or a silent scope-add contradicting the Non-goals | AC-7 rewritten: labeling lives ONLY in `value-briefing` (AC-4); `answer-qa` deliberately untouched |
| MEDIUM | Feed-states split mischaracterized PRESENT/ABSENT as operational; only IMPORTED's per-client lag is | Deliverable 1 bullet corrected — taxonomy + unlock map + blocked flags import; no connected-vs-blocked knowledge dropped |
| MEDIUM | Proposal Unresolved #4 neither resolved nor dissolved; tech-spec W3 sentence stale | Dissolution stated under owner decisions; tech-spec sentence marked superseded |
| MEDIUM | AC-6's sync change (third repo) left ownership/sequencing implicit | Deliverable 3 + AC-6: owner-run product-repo change, sequenced after the value model exists |
| LOW | AC-2's construct-id check is net-new validator capability, not an "extend the scan" tweak | Open question reworded: net-new, W1-coordinated |
| LOW | Briefing "loads open ledger entries" may be empty for the first consumer | Deliverable 2: ledger input optional, may legitimately be empty |

Code-grounded confirms recorded by the critic: `seed/db/` recursive grounding
(`ReadReferenceTool.cs:32,53,92,152`); `sync_model.py` exists, extension additive; the three
shipped accuracy skills are value-free today; the mine-semantic-model profile pattern extends
coherently; `validate-provenance.cs` present at its new KG path
(`docs/semantic-model/tools/`).

Skeptic spec-findings (mine-from-spec run, 2026-07-18): SF-1 by-design (AC-2 binds the
fail-closed outcome; the open question defers only the validator's home); SF-2 folded — the
machine-consumable line gained a stock-parser pass/fail floor; SF-3 folded — KB sources
declared enrichment-not-dependency with inline provenance citations + unavailable-source
disclosure.
