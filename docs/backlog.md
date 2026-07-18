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
| F1-NotesPlugin — nexus-notes: the notes-pipeline extension plugin (full suite, two waves; omni-notes clone) — wave 1 shipped (nexus-notes 0.1.0) | `omnishelf-docs docs/proposals/2026-07-12-omni-notes-plugin.md` (ratified 2026-07-12; scope superseded by owner at F1 shaping: consumer-only → full suite) | 5 | high | 1.7 | docs/specs/F1-NotesPlugin/definition/spec.md | In Progress |
| F2-AdhocIsSoloOnly — lane rule: PO/architect-shaped work is always a feature; adhoc is solo-only | Owner directive 2026-07-12 (no proposal; definition = ADR-58) | 6 | low | 6.0 | ADR-58 (collapsed definition, ADR-25) | Done |
| F3-AnalyticsBorrowWave — import VWH retail-flavor honesty discipline into nexus-analytics (value ledger + grounding gate + analyst craft) — increment 0 (feedback-loop port into mine-semantic-model) shipped 2026-07-17 as 0.2.0 (`22fe93e`); S1–S4 remain pilot-gated | Owner-directed 2026-07-12 (no proposal; analysis = `docs/research/2026-07-12-mine-family-vs-vwh-per-member.md` §7) | 6 | med | 3.0 | docs/specs/F3-AnalyticsBorrowWave/definition/tech-spec.md | Spec Ready |
| F4-ResearchBoostedAsks — clickable research option on medium/low-confidence questions (depth-dial offer branch made selectable; one round, re-ask boosted) | Owner idea 2026-07-12 (no proposal; shaped in-session per ADR-58) | 5 | low | 5.0 | docs/specs/F4-ResearchBoostedAsks/definition/spec.md | Done |
| F5-SkillGapCapture — one-owner fielded `## Skill Gaps` entry template in `lessons-format`; the plan's `Gap?` column becomes a two-value marker, never the binding record | Owner-directed 2026-07-15 (no proposal; definition = ADR-59) | 6 | low | 6.0 | ADR-59 (collapsed definition, ADR-25) | Done |
| F6-MineMachineryHardening — close the mine-family enforcement gaps: wire the resume (R1), persist skeptic excerpts into registry rows (R2), capability-contract selfcheck (R3, ADR-60), tier disclosure (R5); R4 (ship the gates) spike-gated | `docs/proposals/mine-machinery-hardening-2026-07.md` (ratified 2026-07-16) | 7 | med | 3.5 | docs/specs/F6-MineMachineryHardening/definition/tech-spec.md | Spec Ready |
| F7-MineMachineryBorrowWave2 — ship the enforcement runtime (M1, wave-1's unlanded R4) + mechanized firing (M2), cross-session resume (M3), blocking kickoff (M4), runway forecast (M5), recall golden set (N1); Stage-0 delivery-mechanism + clean-room-seal spike gates the build | `docs/proposals/mine-machinery-borrow-wave-2-2026-07.md` (ratified 2026-07-17) | 7 | high | 2.3 | docs/specs/F7-MineMachineryBorrowWave2/definition/tech-spec.md | Done |
| F8-AnalyticsEnforcementValueLayer — W2 reconciliation dispositions now (KG imports VWH battle-tested knowledge; VWH corrects 12 verified conflicts from KG derivations); W1 reference probe runner + conformance (post-F3-pilot); W3 value-layer output contract (trigger-gated) | `docs/proposals/analytics-enforcement-value-layer-2026-07.md` (ratified 2026-07-17) | 7 | med | 3.5 | docs/specs/F8-AnalyticsEnforcementValueLayer/definition/tech-spec.md | Spec Ready |
| F9-CoordinationHardening — apply plugin-feedback nexus-1.34.8: arrival-order caveats, universal idle-recovery protocol, capability pins + role-prefixed spawn names, read-tracker per-file round decay, `## Decisions` heading standardized | Plugin feedback `nexus-1.34.8-2026-07-17` (omnishelf_flutter_app; entries re-grounded + Entry 3 rediagnosed in-session, owner-approved 2026-07-18) | 6 | low | 6.0 | ADR-61 (collapsed definition, ADR-25) | Done |
| F10-SkillGapMiner — mine-skill-gaps (ninth mine): sweep a repo's delivery artifacts for cross-plan `(none)` clusters + pre-flagged ADR-59 records → skeptic-verified candidate registry (`docs/skill-gaps/registry.md`) feeding owner-triaged improve-skills authoring | `docs/proposals/skill-gap-miner-2026-07.md` (ratified 2026-07-18) | 6 | med | 3.0 | docs/specs/F10-SkillGapMiner/definition/tech-spec.md | Done (shipped 2026-07-18, nexus 1.36.0, `49cc325`) |
| F11-AnalyticsFailClosedIntake — D: mandatory clarification / fail-closed intake for the data-analyst run (batched interview correlated against per-measure must-specify model flags; every applied default named in the answer; baseline-mandatory fallback while KG's flags don't exist) | `docs/proposals/2026-07-18-nexus-analytics-am-lane.md` (ratified 2026-07-18; lane Impact/Effort — intra-lane rank 1/4 fixed at parent ratification) | 8 | med | 4.0 | docs/specs/F11-AnalyticsFailClosedIntake/definition/spec.md | Spec Ready |
| F12-AnalyticsWorkspaceSelfHeal — B: `my-workspace/` self-heal (create parent + `exports/`/`prompts/` when missing; warn-only when the star-form ignore entry is absent; never append to `.gitignore`; export skills default output there) | `docs/proposals/2026-07-18-nexus-analytics-am-lane.md` (ratified 2026-07-18; lane Impact/Effort — intra-lane rank 2/4) | 8 | med | 4.0 | — | Ready |
| F13-AnalyticsSavedPrompts — C: saved prompts as plain files in `my-workspace/prompts/` ("save this as…", "run / list my prompts"; sharing = send to owner, who promotes to a committed shared folder; no server) | `docs/proposals/2026-07-18-nexus-analytics-am-lane.md` (ratified 2026-07-18; lane Impact/Effort — intra-lane rank 3/4) | 8 | med | 4.0 | — | Ready |
| F14-AnalyticsUsageCapture — E-capture: per-question signal record (question/measures/SQL/outcome, never result rows) buffered to a local append-only log, batch-flushed to the product's shared-Sheet channel; fail-open; wrong+correction affordance — staged project-local in omnishelf-analytics first (proposal Unresolved 1), gated on shared-Sheet provisioning | `docs/proposals/2026-07-18-nexus-analytics-am-lane.md` (ratified 2026-07-18; lane Impact/Effort — intra-lane rank 4/4) | 8 | med | 4.0 | — | Ready |

- **Status** values: `Ready` (ratified, not yet started) · `Spec Ready` (spec written — put its path
  in the `Spec` column) · `In Progress` · `Done` (shipped) · `Superseded`.
- **Spec** column: empty (`—`) until a spec exists; on `Spec Ready` the PO fills it with the spec path
  (`docs/specs/{slug}/definition/spec.md`).
- **Effort → divisor for the rank** (the appetite buckets): `low` = 1, `med` = 2, `high` = 3. So
  Impact ÷ Effort = `Impact / divisor`; sort the table by it, highest first.
- One row per ratified proposal. The example row above is illustrative only — replace it with real
  rows as proposals are ratified. **No bulk migration** of existing `docs/proposals/*` into rows;
  populating the backlog is operator curation as each proposal is ratified (ADR-29).
