# Changelog — nexus-analytics

All notable changes to the `nexus-analytics` plugin.

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
