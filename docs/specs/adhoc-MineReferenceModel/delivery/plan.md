# mine-reference-model — v1 (Extract→Verify→Grade → reference-model registry)

**Feature Spec:** `docs/specs/adhoc-MineReferenceModel/definition/tech-spec.md` (technical branch, ADR-27)

## Context

Ships the fourth mine as a stack-neutral nexus skill: reference-repo virtue extraction producing a
portability-graded `docs/reference-model.md` in the consuming repo, consumed at mine-verify-repo's
C5 triage as the by-design adjudication reference. Governing ADR: **ADR-50** (extracted 2026-07-05;
provenance = pilot feedback Entry 8 + owner directive). All method content comes from the
tech-spec's contracts R1–R6 — this plan adds no design. The designated live donor run has not
happened; per owner decision the skill ships first and that run is the pilot (Step 4).

## Scope

**In:** the `mine-reference-model` skill (single SKILL.md — no `references/` folder: v1 has no
runbook-weight material; the method fits the orchestrator file), cross-reference updates in
`mine-verify-repo` and `mine-verify-cover`, nexus release, the operator-owed pilot.
**Out (v1, per tech-spec):** the skill-generation second stage, multi-reference-repo merge, any
metric layer, a security dimension, any stack adapter, edits to either target repo's source.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills; evaluate-skill | Follow (dev-repo carve-out authoring path, incl. `references/skill-recipe.md`); Follow (post-authoring gate) | no | new skill `mine-reference-model`; method source = tech-spec R1–R6 | |
| 2 | (none) | — | no | two cross-reference edits, exact anchors in step | |
| 3 | release-plugin | Follow | no | nexus → MINOR (new capability, owner-escalated) | |
| 4 | mine-reference-model (the new skill) | Follow | no | reference repo = `D:/src/dotnet-microservices`; consuming repo = `D:\Omnishelf\omnishelf_flutter_app` (stack: Flutter/Dart) | Owner: operator |

No TDD steps: this ships method text (skill markdown), not executable code; the `evaluate-skill`
gate + CI plugin-release check are the verification surface.

## Domain Model Changes
None (docs/skill artifacts only).

## Data Model Changes
None.

## Implementation Steps

### Step 1 — Author the skill
Create `plugins/nexus/skills/mine-reference-model/SKILL.md`.

**Follow improve-skills** (the dev-repo carve-out path for new shipped skills — consult its
`references/skill-recipe.md` for archetype + element menu + frontmatter) — archetype is **heavy**
(multi-agent, verification gate), but single-file: no `references/` folder for v1.

- SKILL.md carries the method from the tech-spec, in the sibling's structural style: pipeline block
  (Extract → Consolidate → Verify → Grade → Write → Refresh) → contracts (R1 inputs incl.
  seed-docs-are-hypotheses and the per-dimension cap; R2 pattern schema with the fact/judgment
  split and the negative-claim rule; R3 verify gate with the invented-virtue framing; R4 output
  artifact + registry invariants + refresh grammar; R5 consumption seam; R6 rails incl. the
  no-metric-layer asymmetry note) → binding prompt obligations → safety rails → "What this skill
  does NOT do" → relationship table (rows: mine-verify-repo, mine-verify-cover, mine-from-spec,
  improve-skills as the NOT-consumer for stage 2).
- Execution topology paragraph: inherit the **semantics** of mine-verify-cover's "Execution
  topology (who runs what)" run-in heading — session-owned orchestration, staged background
  `general-purpose` agents (default five dimension extractors in parallel, then ONE
  consolidate+skeptic), orchestrator has no filesystem. Cite the Entry-6 scale datapoint as the
  sizing basis.
- Binding prompt obligations (grep-checkable, per AC-2): (a) the skeptic prompt forbids
  reasoning-only verdicts AND the text states the structural enforcement (a verdict row without
  its re-execution output excerpt is dropped by the orchestrator); (b) the extractor prompt asks
  "what pattern choices does this repo make and what rule does each encode" — it must NOT prime
  with "best practices"/"exemplary" framing (the flattery defense); (c) a pattern asserting
  absence embeds the zero-hit command as its evidence.
- Frontmatter: `name`, `description` (specific — "extract skeptic-verified virtues from a
  designated reference repo … portability verdict … translation dictionary … use at
  mine-verify-repo triage"), `user-invocable: true`. Loader safety per the recipe: curly
  placeholders, rephrase comparators as prose — note `skill-lint.mjs` E7 catches angle-bracket
  tags only; comparator rephrasing is authoring discipline, not lint-enforced.
- Then **Follow evaluate-skill** on the result (lint first, then the judgment layers) and fix
  findings before proceeding.
- Satisfies: AC-1, AC-2.

### Step 2 — Cross-reference updates (two files, surgical)
Skill: None — two anchored edits; exact locations below. Do NOT touch any other section of either
file.

- `plugins/nexus/skills/mine-verify-repo/SKILL.md`:
  - The family enumeration ("This is the third mine." — SKILL.md:22-26): rework to the four-mine
    enumeration, adding `mine-reference-model` (ONE reference repo; ground truth: reference
    source; gate: skeptic re-execution / invented-virtue kill). Keep the existing three mines'
    descriptions intact.
  - C4 (`SKILL.md:156`) and C5 (`SKILL.md:165-166`): where `no-reference-model` is defined, add
    `docs/reference-model.md` (produced by `mine-reference-model`) as an **additional formal
    source** of the reference model, **alongside** the repo's own ADRs/conventions — do NOT
    redefine the existing referent or the degrade condition: `no-reference-model` fires when no
    reference model of **any** kind is available (architect-adjudicated resolution of the critic's
    HIGH — additive, never replacement; ADR-47's text stands). One clause each — do not restate
    the new skill's method. After settling the C5 wording, confirm the pipeline-block line
    (`SKILL.md:44`, "against the reference model") still reads consistently — no edit expected
    there.
  - `## Relationship to other skills` table (`SKILL.md:237+`): add a `mine-reference-model` row —
    the "what to copy" arm; produces the C5 adjudication reference + translation dictionary this
    skill's triage consumes.
- `plugins/nexus/skills/mine-verify-cover/SKILL.md`:
  - `## Relationship to other skills` table (`SKILL.md:405+`, after the `mine-verify-repo` row at
    `SKILL.md:412`): add a `mine-reference-model` row — the reference-repo sibling (virtues, not
    debts; no Cover arm).
- Satisfies: AC-3.

### Step 3 — Release nexus (once, after Steps 1–2 land)
**Follow release-plugin.** nexus gets **MINOR** (new capability — owner-escalated per this plan).
Run the bump exactly once, after all edits in Steps 1–2 are complete — never per-step. No
`agents/*.md` changed, so no `gen-commands` run. nexus-dotnet is untouched this pass (both Step-2
files are nexus-core skills) — no nexus-dotnet bump. The omni-twin regeneration + mirrored commit
is the commit-time concern per repo CLAUDE.md (re-check the branch immediately before committing —
a concurrent pipeline can share this tree).
- Satisfies: AC-1 (shipped = versioned).

### Step 4 — Pilot run (Owner: operator — not executable in-pipeline)
Run the shipped skill: reference repo `D:/src/dotnet-microservices` → consuming repo
`D:\Omnishelf\omnishelf_flutter_app` (stack tag: Flutter/Dart), seed doc
`D:/omnishelf/app_flutter/docs/proposals/architecture-review/dotnet-reference.md` (seed rows
re-verified per R1, never trusted). Output `docs/reference-model.md` in the consuming repo — the
artifact the Flutter program's Step-10 triage consumes (its handoff sketched a run-scoped
`delivery/reference-model.md`; the skill's durable home wins — the triage step reads
`docs/reference-model.md`).
Capture in the run report: patterns mined/confirmed/killed (the survival rate — the flattery
measurement), per-dimension counts, seed-row fate. Skill defects flow back as plugin feedback in
the consuming repo, not silent local fixes.
A PASS on Steps 1–3 proves the skill text ships and gates green — it does **not** prove the method
works on a real reference repo; that lands only here.
- Satisfies: AC-5.

## Cross-Service Changes
None.

## Migration Notes
None (new artifacts only). **AC-4 is satisfied in the definition phase** — ADR-50 landed in
`docs/architecture/README.md` (contents line + section) before this plan, authored by the
architect; it is not a plan step and needs no developer action.

## Testing Strategy
No executable tests in this repo. Verification = the `evaluate-skill` gate + `skill-lint.mjs`
(Step 1), the CI plugin-release check (Step 3), and the pilot's measured survival rate (Step 4).

## KB Impact
None: the evidence base (`docs/kb/research/repo-technical-evaluation-for-refactoring.md`) needs no
change; the family knowledge lives in ADR-50 + the tech-spec.

## Open Questions
None blocking. Named seams deliberately not built (tech-spec Out-of-scope): per-repo file split
for multi-reference, pattern-load-bearing change-frequency signal, the skill-generation stage 2.

## Plan Review

Code-grounded critic, 2026-07-05: **GO-with-fixes** — all six line anchors verified against live
source with zero drift; AC coverage complete both directions; release logic, species-collision,
and lint-transcription checks clean; the ADR-48 asymmetry and ADR-47 portability-as-judgment
calls confirmed coherent. Findings folded:
- **HIGH (resolved):** "reference model" concept overload — Step 2's C4/C5 clause now states the
  additive relationship explicitly (`docs/reference-model.md` is an additional formal source
  alongside the repo's own ADRs/conventions; `no-reference-model` = no reference model of any
  kind). Same clarification applied to tech-spec R5 and ADR-50. Architect-adjudicated: additive,
  never replacement.
- **LOW (fixed):** Step 1 no longer overstates `skill-lint.mjs` coverage (E7 = angle-bracket tags
  only; comparator rephrasing is authoring discipline). The upstream overstatement in
  `skill-recipe.md:79` is routed to lessons for the learner, not fixed in this pass.
- **LOW (fixed):** AC-4 ledger line added to Migration Notes.
