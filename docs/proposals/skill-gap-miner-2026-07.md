# Proposal — Skill-gap miner (cross-plan `(none)` cluster detection)

**Status:** Ratified — Laurentiu, 2026-07-18 (graduated: `docs/specs/F10-SkillGapMiner/definition/tech-spec.md`; extracted ADR-63)
**Decision-maker:** Laurentiu (repo owner)
**Recommendation:** Ship a discovery skill (working name `mine-skill-gaps`) that sweeps a consumer repo's delivery artifacts — plan.md skill-mapping tables, implementation.md, review.md, lessons.md — clusters recurring uncovered work, and emits a verified skill-candidate registry that feeds the existing evaluate-skill / improve-skills apply-half. The pilot sweep already ran on knowledge-gateway (see Pilot results) — candidate yield is confirmed, so build v1 from the pilot's parser + method.
**Confidence:** High — the blind spot is proven (see Need) AND the pilot sweep ran (2026-07-17, knowledge-gateway): 359 `(none)` rows across 72 plans yielded six clusters clearing the 3+ threshold, two of which plan authors had *named identically* across 3–4 plans with no skill ever built — see Pilot results.
**Impact:** 6
**Effort:** med
**Date:** 2026-07-17

## Need

The gap-detection loop for missing skills is **per-plan local, but the signal is cross-plan**. A
plan's Skill Mapping row marked `(none)` asserts only "no existing skill fits this step"; whether
that step's work is *repetitive* — and therefore skill-worthy — is invisible to the single plan
author who fills in the Gap? column. The learner's recurrence tracking only sees what each run
logged to lessons.md, so a task that surfaces as an unflagged `(none)` in plan after plan never
accumulates anywhere.

Evidence from knowledge-gateway (2026-07-17 sweep of 72 plans with skill-mapping tables): only
**one** plan (F55) has ≥70% skill presence across >8 steps; the bulk of the estate runs 0–55%
presence, and the `(none)` rows split three ways — genuinely one-off work, gaps flagged in the Gap?
column (the caught case), and the silent case: recurring uncovered work each author correctly
marks "no skill fits" without anyone seeing the pattern (e.g. orchestrator/prompt-assembly
internals recur as `Skill: None` across the ask-path features).

Out of scope: creating or fixing skills — that stays with evaluate-skill (diagnose) and
improve-skills (apply). This proposal owns **discovery only**: turning artifact exhaust into a
ranked candidate list those skills consume.

## Approach

A shipped (not dev-repo-only) skill, since the artifacts it mines live in consumer repos. Shape
rhymes with the mine family (discover → verify → triage registry):

1. **Discover:** parse every `docs/specs/*/delivery/` artifact —
   - plan.md skill-mapping tables → `(none)` rows and their step descriptions,
   - implementation.md → hand-rolled patterns re-derived across features,
   - review.md → repeated reviewer findings a pattern skill would prevent,
   - lessons.md → gap entries logged but never promoted.
2. **Cluster:** group rows by what the step actually does (task-shape, not wording), count
   cross-plan recurrence.
3. **Verify:** a skeptic pass re-reads each cluster's source rows to kill coincidental groupings
   (mine-verify precedent — extraction without verification invents virtues).
4. **Emit:** a candidate registry (proposed home: `docs/skill-gaps/registry.md` in the consumer
   repo) ranked by recurrence × step cost, each row citing its source plans. Confirmed candidates
   route to improve-skills' New-Skill recipe.

## Pilot results (2026-07-17, knowledge-gateway)

The discovery half ran once, manually (a table parser + model clustering over 72 plans; 359
`(none)` rows total). Clusters clearing the 3+ recurrence threshold:

| Cluster | Recurrence | Strongest evidence |
|---------|-----------|--------------------|
| Orchestrator decorator/state/loop wiring | ~20 rows / ~15 plans | F43, F45, F48 each write "recurring 'orchestrator decorator/state' None across F42/F45/F48 → candidate project skill" — three explicit nominations, no skill exists |
| Raw-Npgsql persistence (repository, FTS, column-add) | ~13 rows / ~11 plans | F51: "recurring raw-Npgsql None (F17/F21/F50/F51)"; notes-hybrid-retrieval: "reinforced; scaffold candidate" |
| Prompt-content steering / judge-prompt revision | ~12 rows / ~10 plans | F59: "no prompt-revision skill (same gap F58 Step 1 logged)" |
| Additive wire-contract / SSE-frame extension | ~11 rows / ~10 plans | F26 judged it "fine inline"; ten plans later it recurs |
| Cost-audit additive JSONL fields | ~7 rows / ~7 plans | F59: "additive-JSONL pattern lives in precedent, no skill" |
| M.E.VectorData records/collections/tests | ~7 rows / 3 plans | F3: "extends the vectordata-* gap family (F2 lesson #1)" |

The decisive finding: **detection is not the bottleneck — collection is.** Plan authors *did*
cross-reference recurring gaps by name across plans; the candidates still died in Gap? cells
because no artifact accumulates them. The miner's registry is the missing collector, not a smarter
detector — which also means v1 can lean on cheap clustering, since the strongest candidates
self-identify by name.

## Benefits

Closes the one leg of the skill-feedback loop that has no owner: plan-time Gap? catches what one
author notices, learner catches what runs logged, this catches what *nobody* logged because no
single vantage point could see it. Each confirmed candidate converts N future re-derivations into
`Follow {skill}` plan steps, and the registry gives skill-authoring investment an evidence-ranked
queue instead of anecdote.

## Alternatives

- **Status quo (learner + Gap? column only):** structurally cannot see cross-plan repetition of
  unflagged `(none)` rows; the KG evidence shows the silent case is the common case.
- **Extend the learner:** the learner's input contract is lessons.md; widening it to raw artifact
  mining changes its job from consolidation to discovery and bloats a shipped high-traffic agent.
  A separate miner keeps the learner's scope fence intact and can be invoked on demand.
- **Manual periodic sweep (no skill):** this session's ad-hoc sweep took real effort and its method
  (table parsing, none-cell semantics, clustering) would be re-derived each time — exactly the
  failure mode the estate builds skills to prevent.
- **Fold into evaluate-skill:** evaluate-skill judges *existing* skills; mining for *absent* ones
  is a different input, method, and output. Overloading it violates its diagnose-half scope.

## Unresolved

- Naming: `mine-skill-gaps` (joins the mine family) vs `skill-gap-miner`; and whether it formally
  adopts the mine-family method contract or just its shape.
  **Resolved (ratified 2026-07-18):** `mine-skill-gaps`, ninth family member by name + shape
  (mine-verify-flows is the eighth — corrected at the definition review)
  (discover → verify → registry), NOT the method contract — no stack adapter, no ADR-60
  obligations (markdown unit, no toolchain); mine-reference-model precedent.
- Registry home in consumer repos: `docs/skill-gaps/` vs a section in the existing tech-debt
  registry (mine-verify-repo's home).
  **Resolved (ratified 2026-07-18):** own species at `docs/skill-gaps/registry.md` (ADR-63) —
  different consumer (skill authoring vs refactoring lane) and lifecycle; ADR-43/45/49 registry
  invariants carried.
- Recurrence threshold: 3+ confirmed by the pilot (six clusters clear it with margin).
  **Resolved (ratified 2026-07-18):** 3+ kept for clustered (Tier-B) candidates; pre-flagged
  post-ADR-59 records (Tier A) enter at their native count — the asymmetry vs the learner's 2+ is
  deliberate (noisier input, higher bar).
- Cross-repo recurrence: several consumer repos share the plugin; a task recurring once per repo
  across three repos is the same signal. Single-repo scope for v1, but the registry format should
  not preclude merging.
  **Resolved (ratified 2026-07-18):** single-repo v1; rows carry a `repo` field so merging stays
  format-compatible — no merge machinery now.
- Whether review.md mining pays: reviewer findings may be too feature-specific to cluster —
  pilot decides if that source stays.
  **Resolved (ratified 2026-07-18):** dropped from v1 — and implementation.md with it: zero of the
  pilot's six clusters cited either. Re-entry condition recorded in the tech-spec (a confirmed
  cluster on another estate whose only evidence lives there).

## Graduate-to-spec

Technical branch: on ratification this becomes a tech-spec in this repo (the skill ships in the
nexus plugin), authored via improve-skills' New-Skill recipe so it gets the Judgment Gate.

**Graduated 2026-07-18:** tech-spec at `docs/specs/F10-SkillGapMiner/definition/tech-spec.md`;
ADR-63 extracted (architecture README); backlog row F10-SkillGapMiner.

## Provenance

knowledge-gateway session 2026-07-17: a plan-quality query ("plans with >8 skill-mapping rows and
≥70% skill presence") returned exactly one match out of 72, which surfaced the three-way `(none)`
split and the untracked silent case. Related: estate-authoring-skill-2026-07 (same "recurring
uncovered work with no owner" class, estate-side), mine-verify-repo (the discover→verify→registry
shape borrowed here).
