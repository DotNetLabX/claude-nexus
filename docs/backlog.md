# Backlog — the ratified-proposal queue

The bet work, queued and ranked. This is **not** an idea inbox: a row lands here when a proposal is
**ratified** (by its named decision-maker, ADR-28) — **or**, per ADR-58 (widening ADR-29), when a unit
of work is **shaped with the PO or designed with the architect** from any source (owner directive,
external proposal, tracker item): such work always takes a feature slug and a row. **Unratified,
unshaped proposals stay the idea inbox** in `docs/proposals/`. Rows are ranked by **impact ÷ effort**
(the `Impact` and `Effort` the proposal front-matter carries, `proposal-format` skill) — highest first.

Lifecycle (ADR-29, widened by ADR-58): **ratified proposal or PO/architect-shaped work ⇒ a backlog
row; unratified ideas = idea inbox.** Don't let unbet
ideas accumulate here as zombie rows (Shape Up) — if it isn't ratified or actively shaped, it stays in `docs/proposals/`.
The team lead reads this file to triage "what's next" and flips a row to `Done` on ship; the PO puts
the spec path in the `Spec` column when a row goes to `Spec Ready`.

## Rows

| Slug / Title | Source proposal | Impact (1-10) | Effort | Impact ÷ Effort | Spec | Status |
|--------------|-----------------|---------------|--------|-----------------|------|--------|
| adhoc-SddMergeGen — SDD merge machinery + diff-driven Cover-from-spec | `docs/proposals/sdd-generate-merge-2026-07.md` | 8 | high | 2.7 | docs/specs/adhoc-SddMergeGen/delivery/plan.md (ad-hoc: plan is the definition) | Done |
| adhoc-SkillAuthoringRecipe — ship the skill-authoring recipe reference | `docs/proposals/skill-authoring-recipe.md` | — (no front-matter rank; pre-format proposal) | low | — | docs/specs/adhoc-SkillAuthoringRecipe/delivery/plan.md (ad-hoc: plan is the definition) | Done |
| F1-NotesPlugin — nexus-notes: the notes-pipeline extension plugin (full suite, two waves; omni-notes clone) | `omnishelf-docs docs/proposals/2026-07-12-omni-notes-plugin.md` (ratified 2026-07-12; scope superseded by owner at F1 shaping: consumer-only → full suite) | 5 | high | 1.7 | docs/specs/F1-NotesPlugin/definition/spec.md | In Progress |
| F2-AdhocIsSoloOnly — lane rule: PO/architect-shaped work is always a feature; adhoc is solo-only | Owner directive 2026-07-12 (no proposal; definition = ADR-58) | 6 | low | 6.0 | ADR-58 (collapsed definition, ADR-25) | Done |

- **Status** values: `Ready` (ratified, not yet started) · `Spec Ready` (spec written — put its path
  in the `Spec` column) · `In Progress` · `Done` (shipped) · `Superseded`.
- **Spec** column: empty (`—`) until a spec exists; on `Spec Ready` the PO fills it with the spec path
  (`docs/specs/{slug}/definition/spec.md`).
- **Effort → divisor for the rank** (the appetite buckets): `low` = 1, `med` = 2, `high` = 3. So
  Impact ÷ Effort = `Impact / divisor`; sort the table by it, highest first.
- One row per ratified proposal. The example row above is illustrative only — replace it with real
  rows as proposals are ratified. **No bulk migration** of existing `docs/proposals/*` into rows;
  populating the backlog is operator curation as each proposal is ratified (ADR-29).
