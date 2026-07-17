# Changelog — nexus-analytics

All notable changes to the `nexus-analytics` plugin.

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
