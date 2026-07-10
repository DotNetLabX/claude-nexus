# Skill Evaluation — mine-family-core dedup pass (mine-verify-cover, mine-verify-repo, mine-reference-model)

**Evaluator:** developer (adhoc-MineFamilyCore, plan Step 6)
**Date:** 2026-07-10
**Scope:** the P1 de-duplication edit across `plugins/nexus/skills/mine-verify-cover/SKILL.md`,
`plugins/nexus/skills/mine-verify-repo/SKILL.md`, `plugins/nexus/skills/mine-reference-model/SKILL.md`,
and the new `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`.
**Focus (per plan Decision — scoped, not the full judgment rubric):** pointer integrity, no
orphaned references, frontmatter-body match. A prose-shape refactor with zero behavior change does
not warrant the full Layer 1-4 rubric per skill; the code-grounded critic already covered the
judgment layer at plan review (`docs/specs/adhoc-MineFamilyCore/delivery/review-critic.md`).
**Channel:** dev-repo source skills (not version-keyed cache copies) → findings fixed directly in
source.
**Run artifacts consulted:** none — this is a docs/prose-only pass; there is no runtime behavior to
observe (Testing Strategy in the plan: "no runtime behavior -> no tests").

## Layer 0 — Mechanical (skill-lint.mjs)

```
node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-verify-cover
node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-verify-repo
node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-reference-model
```
→ `OK mine-verify-cover`, `OK mine-verify-repo`, `OK mine-reference-model` (no errors, no
warnings, all three).

## Pointer integrity

Every pointer in the three sibling files resolves to a real `##` heading in
`mine-verify-cover/references/mine-family-core.md`:

| Pointer target cited | Core heading present |
|---|---|
| §The mine family | `## The mine family` |
| §Execution topology | `## Execution topology (who runs what)` |
| §Marginal-budget rail | `## Marginal-budget rail + report-on-halt` |
| §Skeptic protocol | `## Skeptic protocol` |
| §Fact/judgment doctrine | `## Fact/judgment doctrine` |
| §Registry invariants (+ refresh outcome grammar) | `## Registry invariants + refresh outcome grammar` |
| core §kickoff checklist | `## Kickoff checklist (new-target runs, B4)` |

Path form verified: `mine-verify-cover/SKILL.md` uses the self-relative
`references/mine-family-core.md` (critic F8c); `mine-verify-repo/SKILL.md` and
`mine-reference-model/SKILL.md` use the sibling-relative `../mine-verify-cover/references/mine-family-core.md`
— both forms confirmed to resolve within the flat `skills/` cache directory.

## No orphaned references

- The `Execution topology (who runs what)` landmark (bold run-in in cover, `###` heading in
  repo/ref-model) is retained in all three files — now holding the pointer + per-skill staging
  delta instead of the restated canonical text. Nothing outside these three files references the
  removed prose by section-body text (checked: `mine-verify-cover`'s own "What this skill does NOT
  do" section still names `mine-verify-repo`/`mine-reference-model` independently of the trimmed
  relationship-table rows — no dangling reference).
- `plugins/nexus/agents/team-lead.md:127` (+ regenerated `commands/team-lead.md:127`) — repointed
  from the removed "mine-verify-cover's Execution topology" heading citation to
  `` `mine-verify-cover references/mine-family-core.md` §Execution topology `` — verified present in
  both files.
- The 4-row family table (`mine-verify-cover`/`mine-from-spec`/`mine-verify-repo`/`mine-reference-model`)
  now appears exactly once (core); confirmed 0 hits in `mine-reference-model/SKILL.md` (previously
  its intro), 0 hits added elsewhere.

## Frontmatter-body match

None of the three `---` frontmatter blocks (`name`, `description`, `user-invocable`) were touched.
Each `description` promise was re-checked against the trimmed body:
- `mine-verify-cover`: description doesn't mention "Execution topology" or the safety-rail bullets
  by name — no promise broken by pointing them at the core reference.
- `mine-verify-repo`: description's "a fresh skeptic re-executes each finding's evidence" promise
  still holds — C3 keeps the severity-recalibration + cross-model-seam deltas in-file and points to
  core for the shared must-RUN mechanism; the mechanism is still fully documented, just not
  duplicated.
- `mine-reference-model`: description's "a fresh skeptic re-executes each pattern's evidence to kill
  invented virtues" promise still holds — R3 keeps the flattery-framing + self-mode cross-check
  deltas in-file.

## Findings

None above Low. No findings at all in the pointer-integrity / orphaned-reference / frontmatter-match
scope — all three skills lint-clean, all pointers resolve, no dangling references found.

## Verdict

**ACCEPT.** Scoped pass finds no findings requiring a fix. AC-8's "no finding above Low left
unfixed" is satisfied vacuously (zero findings). The full judgment-layer rubric (Layers 1-4 per
skill) was not run in this pass, per the plan's Decision row ("evaluate-skill scoped to
pointer/structural integrity"); the code-grounded critic already re-executed the AC-3 grep battery
and the file-level greps at plan review, which is this pass's judgment-layer substitute for a
zero-behavior-change docs refactor.
