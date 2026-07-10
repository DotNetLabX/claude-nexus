# Proposal — nexus-data: the Data-Analyst Domain Extension (P5 intake resolved)

**Status:** Ratified (2026-07-10, owner — approach/scope/sequencing ratified via the instruction
to start the specs; the NAME is the one outstanding input: `nexus-data` rejected, shortlist below
in Unresolved #1)
**Decision-maker:** ldumit
**Recommendation:** Build `nexus-data` (working name — see Unresolved #1) as the first DOMAIN
extension plugin: v1 thin slice (one analyst persona + three method skills), first consumer
`D:\omnishelf\analytics`, defined now, built after P4 (mine-semantic-model) ships.
**Confidence:** High — the method is already proven in TWO independent consumers (the analytics
workspace empirically: 13 skills + 7 rules in daily Account-Manager use; KG formally: the
semantic-model bundle + validated-SQL obligations), and the two evolved the SAME guardrails
independently (bad-reports mandatory filter, no-gold-tables, large-table query patterns) — the
extraction target is observed, not speculated.
**Impact:** 9
**Effort:** med (v1 thin slice) + a one-time plugin-machinery cost (gen-omni twin wiring, bump/CI
coverage for a third plugin)
**Date:** 2026-07-10

## Need

Data-analyst method exists today in two project-local silos, neither reusable:

- `D:\omnishelf\analytics` — a LIVE analyst workspace (Account Managers export retail analytics
  Postgres → Sheets through Claude Code): 13 skills (`export-category/brand/sku`, `compare`,
  `data-analyst`, `store-analysis`, `incompliance-analysis`, `data-check`, `templates`,
  `task-completion`, `intercept-queries`, `refresh-reference`, `refresh-schema`) + 7 rules
  (`query-patterns`, `no-gold-tables`, `interview`, `export-workflow`, `security`, `logging`,
  `sheet-handling`) + a hand-rolled semantic model (the `grain-routing` / `metric-dictionary` /
  `dimension-dictionary` CSV trio with synonym resolution).
- `D:\src\knowledge-gateway` — the gateway product: the formal semantic-model bundle (entity
  graph, measures, dimensions, join-guards) + generated-SQL validation obligations.

Every new data-touching consumer (omnivision-ai-sdk next) restarts from zero, and improvements in
one silo never reach the other. The owner's direction (ratified as P5 in
`mine-family-next-wave-2026-07.md`) is a plugin extension; intake resolved 2026-07-10: first
consumer = the analytics workspace, scope = thin slice, timing = define now / build after P4.

**Out of scope (v1):** a data-engineer persona (the mine already has an operator), the
ESTIMATED→MEASURED value-claim lifecycle (adopt when analyst claims ship to stakeholders),
Sheets/gspread tooling (project-side by the boundary rule), any change to VWH's retail flavor,
migrating the analytics repo's 13 skills wholesale (v1 extracts the method they share, not the
skills themselves).

## Approach

A third marketplace plugin in this repo — the first **domain** extension (nexus-dotnet is a
*stack* adapter; this rides the same seam for a domain). The settled boundary rule governs every
line: **method → plugin, data → project, autonomous loop → VWH.**

**v1 thin slice:**

- **One agent:** the data-analyst persona — query discipline, semantic-model-first navigation,
  batched-interview intake (the analytics repo's `interview.md` pattern is the proven shape: ask
  all missing questions in one message; persist answered defaults so they are never re-asked).
- **Three skills:**
  1. **semantic-model query discipline** — the resolution ladder (grain → table, metric → column,
     dimension → join) with the project's mandatory obligations (bad-reports-excluded filter,
     no-gold-tables, large-table bound patterns) enforced as pre-query checks. Reads the model
     THROUGH the P4 project profile — the analytics repo's CSV trio and KG's JSON bundle are two
     profile flavors of the same contract, which is what makes one skill serve both.
  2. **read-only data investigation** — P4's probe catalog + runner contract, consumed as the
     analyst's "what does this column actually mean" tool (same profile, same BR1/BR12 rails).
  3. **answer QA + provenance format** — every shipped answer names its grain, filters, date
     range, and model constructs used (the analytics repo's "Bad/invalid reports excluded."
     response obligation, generalized into a checkable answer contract).
- **Machinery (one-time, in the v1 slug):** plugin scaffold `plugins/nexus-data/`, gen-omni twin
  (`omni-data`), bump-plugin + CI release-check coverage for a third plugin.

**Sequencing:** proposal now → ratify → tech-spec (technical branch, ADR-27) → build AFTER
adhoc-MineSemanticModel ships, because skill 1 and 2 read the profile/bundle contract P4 puts on
disk. First validation run: a real Account-Manager export flow in the analytics workspace passing
through the plugin's skills instead of the local ones.

## Benefits

- The method survives its silo: omnivision-ai-sdk (and any future consumer) starts from the
  plugin, not from zero.
- Convergent guardrails become one artifact: today the bad-reports filter exists twice (analytics
  `query-patterns.md`, KG's validator) and drifts independently; the plugin makes it one method
  with per-project profile values.
- The mine family gets its consumption counterpart: P4 authors the model, nexus-data queries
  through it — the profile/bundle is the shared contract, so model improvements (F60 feedback
  loop later) reach analysts automatically.
- Establishes the domain-extension pattern itself (the seam nexus-dotnet proved, applied beyond
  stacks) — the precedent every future domain (e.g. ops, QA) reuses.

## Alternatives

- **Grow the analytics repo instead (no plugin).** Cheapest short-term; rejected because the
  method stays trapped — omnivision-ai-sdk cannot consume another project's `.claude/rules/`, and
  the KG/analytics drift continues.
- **Put the analyst skills in nexus core.** Rejected: core is the stack-agnostic *pipeline*;
  domain skills in core bloat every consumer that never touches data (the same reason
  mine-semantic-model's runner stayed project-side).
- **Full proposal-list v1 (two personas, authoring formats, ESTIMATED→MEASURED).** Rejected at
  intake (owner, 2026-07-10): most of it has no proven consumer yet; thin slice + grow on demand.
- **Build immediately, parallel with P4.** Rejected at intake: skills 1–2 would spec against a
  moving contract (the profile lands with P4).
- **Park until a real P4 mine run in the first consumer.** Rejected at intake: the analytics
  repo's CSV model is already a live, usable profile flavor — definition need not wait.

## Unresolved

1. ~~Name~~ **Resolved 2026-07-10: `nexus-analytics`** (owner pick from the shortlist, over
   `nexus-bi` — "plain and simple"). The record of the search: owner rejected `nexus-analyst`
   ("reads as one agent") and `nexus-data`. Shortlist as delivered: **`nexus-insights`**
   (outcome-named — what analysts deliver; team-flavored; twin `omni-insights`),
   `nexus-lens` (concept-named — every query goes THROUGH the semantic model; short, distinctive),
   `nexus-analytics` (plainest domain name; consistent with the consumer vocabulary),
   `nexus-analysis` (activity-named, sober), `nexus-metrics` (concrete but narrower than the
   scope), `nexus-bi` (instantly legible to business stakeholders; dated), `nexus-datalab`
   (investigation flavor). The tech-spec is fully parameterized on the pick (`{PLUGIN}`).
2. ~~CSV trio vs profile wrapper~~ **Resolved in the tech-spec** (adhoc-AnalystExtension,
   Decisions): model access is profile-mediated and representation-agnostic — the CSV trio and
   the JSON bundle are both valid profile flavors; the analytics repo onboards by authoring its
   profile file (operator-owed, that repo).
3. **Which of the analytics repo's 13 skills, if any, migrate INTO the plugin later** (the
   export-* family is Sheets-coupled and likely stays project-side forever) — v2 triage, not v1.

## Graduate-to-spec

Technical branch (ADR-27/28): on ratification this graduates to a tech-spec
(`adhoc-NexusDataPlugin` or similar) authored by the architect, with the naming decision and the
profile-flavor decision extracted as its first two Decisions rows. The build slug is sequenced
after adhoc-MineSemanticModel's release.

## Provenance

Session 2026-07-10 (vwh-improvments): P5 intake resolved by owner (first consumer
`D:\omnishelf\analytics`, thin slice, name TBD, define-now/build-after-P4). Grounding reads:
analytics repo CLAUDE.md + rules/skills inventory (13 skills, 7 rules, CSV semantic model);
KG mine-semantic-model package (P4 tech-spec, same session); parent proposal
`mine-family-next-wave-2026-07.md` §P5 + backlog row 12; VWH boundary rule
(`vwh-adoptions-2026-06.md`).
