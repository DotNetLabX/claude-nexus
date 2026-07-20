# Changelog — nexus-analytics

All notable changes to the `nexus-analytics` plugin.

## [0.4.1] — 2026-07-20
- F17-MineFieldFixes: `mine-semantic-model`'s kickoff-checklist pointer enumeration gains the new
  core Tier-1 item `stage-model-plan` (nexus 1.38.1 — a run declares which model tier each stage
  class runs on; declare-and-veto).

## [0.4.0] — 2026-07-19
- **Analyst honesty discipline imported from the VWH retail flavor as nexus-analytics method**
  (F3-AnalyticsBorrowWave wave 1 — S1–S4; boundary rule preserved: *method → plugin, data →
  project*, nothing of the autonomous loop imported):
  - **New `value-ledger` skill** — the ESTIMATED-to-MEASURED value-claim lifecycle. A persistent,
    provenance-backed record so an impact estimate that reaches a stakeholder gets a home, a
    validation path, and a status instead of living in throwaway prose. Five statuses
    (`proposed | validating | validated | invalidated | retired`; `retired` is the never-delete
    terminal, re-entry is `validating`). The ledger artifact lives in the consuming project at
    `docs/value-ledger/`; the skill ships only the method + an output contract (per-claim YAML
    frontmatter, a one-line index, an append-only dated changelog). Registry invariants are cited by
    cross-plugin pointer to the nexus `mine-verify-cover` skill's mine-family core, never restated. A
    first-class *pending-live-validation* reading gives a shape-attested-but-unexecuted number a home
    (enters `proposed`, names its probe window/cohort) — an ESTIMATED number in any shipped answer
    MUST have a ledger entry. Two species carve-outs stated: the value ledger is not the
    model-feedback ledger, and it is the accuracy-side claims registry, not value-briefing's
    worth/prioritization monopoly (a coordinating sentence added to `value-briefing` to match).
  - **`answer-qa` hardened** with a `## Grounding gate` (re-execute-or-drop, excerpt attached; a
    number that cannot re-execute ships only as an explicitly-pending ESTIMATE routed to the ledger as
    `proposed`, never as a validated value), a penalty-only doctrine (an unvalidated estimate feeding
    a score/rank/recommendation counts only *against* it), and a provenance panel integrating the
    date-range and constructs contract items with source + query (a presentation convention, not a
    duplicate obligation). EXEMPT-filter vocabulary added: a profile-declared filter exemption is
    named as "not applied and why" — omitting it is as malformed as claiming it was applied.
  - **`analyst-craft.md`** reference (under `answer-qa/references/`) — the ten transferable
    analyst-craft moves (attribution isolation, effort≠outcome, actionable-vs-structural
    decomposition, validity firewall, coverage-as-frontier, per-entity baselines, distribution over
    mean, heterogeneous effect sizes, value-as-provenance-band, managed-cohort≠population),
    domain-generalized. The `data-analyst` persona points to it and carries the penalty-only doctrine.
  - **CI rider** — `plugin-release-check.yml` now regenerates + diffs `nexus-analytics` commands and
    runs `plugin validate` on `nexus-analytics` (the gap this wave's agent edit made live).
  - New capability (a new skill + a new consuming-project artifact species) — owner-escalated to
    MINOR.

## [0.3.0] — 2026-07-18
- value-briefing skill — gated value/intelligence briefings over a governed value model (F8-W3)
  - plugin.json metadata change
  - skill change (value-briefing)
  - owner-escalated to minor

## [0.2.0] — 2026-07-17
- **Feedback-loop layer** ported into the shipped `mine-semantic-model` skill from the KG pilot's
  project-local evolution, generalized (F3 increment 0):
  - Provenance **Schema v2**: optional `verified: YYYY-MM-DD` (entry- and `fields`-scalar-level,
    truthful dates only — a `code({ref})`-primary entry never receives one), appendable
    `confirmed-in-use: [{date, ref}]` tags (never a scalar score), `deprecated` formally
    documented, origin enum + precedence gain `code({ref})`; single-primary-origin rule unchanged.
  - **Model-feedback ledger**: new `references/feedback-ledger.md` + eleventh profile input
    (proposed default `docs/model-feedback/{area}.md`) — consumed ledger-first by Phase 1 step 4,
    Phase 3 step 0, and Audit's new leg 0; BR10 idempotence reconciled (an open entry is new
    input).
  - **Obligations BR-A..BR-H**: ledger placement, no second write path, mandatory per-run
    dispositions incl. the explicit `none open` line, append-only closure, no scalar confidence,
    truthful dates, advisory staleness posture, BOM discipline.
  - Run-report template: `Audit` joins the mode enum; mandatory `## Feedback dispositions` and new
    `## Findings / follow-ups` sections; Audit leg 3's refutation ordering becomes data-grounded
    (undated-and-never-confirmed → stale-dated → sampled/pilot-only → heavily-confirmed last);
    Phase-5 step 6 runs the profile's provenance-schema validation via the item-10 attestation
    (project-provided; absence case disclosed, never silent).
  - Interview answers recorded in v2 per-construct shapes (flattened pre-v2 example retired);
    standalone defect logging repointed to the run report's `## Findings / follow-ups` (the plugin
    cache is not a writable working tree).
  - skill change (mine-semantic-model); owner-escalated to minor

## [0.1.1] — 2026-07-16
- Agent model retier: po/architect/reviewer move to fable; developer/solo/data-analyst move to opus.
  - agent instruction/behavior change

## [0.1.0] — 2026-07-10

Initial release. The estate's first domain extension: the data-analyst persona plus its
semantic-model-first query method.

- **`data-analyst` agent** — the analyst persona: batched-interview intake (all missing run inputs
  in ONE message, persisted defaults never re-asked), model-first navigation through the profile's
  resolution ladder, answer-contract discipline. First agent shipped by a non-core plugin.
- **`mine-semantic-model` skill** — the fifth mine (relocated from nexus core per owner decision
  2026-07-10; built + done-check-verified under `adhoc-MineSemanticModel`, never committed to
  core). Grounds a semantic-model bundle in live-datasource evidence via a five-phase method
  (Mine -> Probe -> Ground -> Interview -> Emit+Validate).
- **`semantic-model-query` skill** — the resolution ladder (grain -> table, metric -> column,
  dimension -> join) plus the mandatory pre-query obligation checks (bad-reports-excluded class,
  no-gold-tables class, large-table bound patterns), representation-agnostic over the profile's
  construct-file map (JSON bundle or CSV trio).
- **`data-investigation` skill** — the analyst-side "what does this column actually mean"
  discipline: delegates to the sibling `mine-semantic-model` skill in read-only investigation mode.
- **`answer-qa` skill** — the shipped-answer contract: every answer names grain, applied filters,
  date range, and model constructs; a missing-obligation answer is malformed.
- All three skills read the model through the consuming project's `docs/semantic-model/profile.md`
  — the plugin requires nexus core installed and defines no new consuming-repo artifacts itself.
