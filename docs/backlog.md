# Backlog — the ratified-proposal queue

The bet work, queued and ranked. This is **not** an idea inbox: a row lands here only when a proposal
is **ratified** (by its named decision-maker, ADR-28). **Unratified proposals stay the idea inbox** in
`docs/proposals/`. Rows are ranked by **impact ÷ effort** (the `Impact` and `Effort` the proposal
front-matter carries, `proposal-format` skill) — highest first.

Lifecycle (ADR-29): **ratified proposal ⇒ a backlog row; unratified = idea inbox.** Don't let unbet
ideas accumulate here as zombie rows (Shape Up) — if it isn't ratified, it stays in `docs/proposals/`.
The team lead reads this file to triage "what's next" and flips a row to `Done` on ship; the PO puts
the spec path in the `Spec` column when a row goes to `Spec Ready`.

## Rows

| Slug / Title | Source proposal | Impact (1-10) | Effort | Impact ÷ Effort | Spec | Status |
|--------------|-----------------|---------------|--------|-----------------|------|--------|
| adhoc-SddMergeGen — SDD merge machinery + diff-driven Cover-from-spec | `docs/proposals/sdd-generate-merge-2026-07.md` | 8 | high | 2.7 | docs/specs/adhoc-SddMergeGen/delivery/plan.md (ad-hoc: plan is the definition) | Done |
| adhoc-SkillAuthoringRecipe — ship the skill-authoring recipe reference | `docs/proposals/skill-authoring-recipe.md` | — (no front-matter rank; pre-format proposal) | low | — | docs/specs/adhoc-SkillAuthoringRecipe/delivery/plan.md (ad-hoc: plan is the definition) | Done |

- **Status** values: `Ready` (ratified, not yet started) · `Spec Ready` (spec written — put its path
  in the `Spec` column) · `In Progress` · `Done` (shipped) · `Superseded`.
- **Spec** column: empty (`—`) until a spec exists; on `Spec Ready` the PO fills it with the spec path
  (`docs/specs/{slug}/definition/spec.md`).
- **Effort → divisor for the rank** (the appetite buckets): `low` = 1, `med` = 2, `high` = 3. So
  Impact ÷ Effort = `Impact / divisor`; sort the table by it, highest first.
- One row per ratified proposal. The example row above is illustrative only — replace it with real
  rows as proposals are ratified. **No bulk migration** of existing `docs/proposals/*` into rows;
  populating the backlog is operator curation as each proposal is ratified (ADR-29).
