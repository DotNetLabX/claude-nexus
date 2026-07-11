# Proposal — Estate-authoring skill (hooks, plugin scaffolds, skill packages)

**Status:** Draft
**Decision-maker:** Laurentiu (repo owner)
**Recommendation:** Ship one dev-repo authoring skill (working name `create-nexus-hook` / `create-plugin-asset`) covering the three recurring authoring shapes the estate has no skill for: PostToolUse-style hooks, new-plugin scaffolds, and non-SKILL.md skill package files
**Confidence:** High — three consecutive runs hit the same gap and each documented the repeatable shape it had to reinvent; the raw material (worked examples, lint suites) already exists in-repo
**Impact:** 6
**Effort:** med
**Date:** 2026-07-11

## Need

Three consecutive pipeline runs surfaced the same class of gap — authoring the nexus estate itself
has no skill coverage, so each run re-derived a non-obvious repeatable pattern from precedent files:

1. **Hook authoring** (adhoc-LearnerCadenceNudge): stdin JSON → `tool_input.file_path` → root
   resolve → self-filter → `systemMessage` envelope → swallow-all + `exit(0)`, plus hooks.json
   append-not-duplicate and the CJS `module.exports` + `require.main === module` guarded-main
   testability split.
2. **Skill-promotion / package authoring** (adhoc-MineSemanticModel): evaluate-skill lints SKILL.md
   only — `references/` and non-md package files have no authoring guidance or lint; a promoted
   source's internal numbering collided with the promoting repo's own namespace.
3. **Plugin scaffold + extension-agent authoring** (adhoc-AnalystExtension): a new plugin trips
   hard-coded registries in shared scripts (`gen-commands.mjs` role map, `gen-omni.test.mjs`
   fixtures) that only executing the machinery reveals.

Out of scope: the release mechanics for a new plugin — that shipped as the release-plugin skill's
"New-plugin ship checklist" (2026-07-11 consolidation); this proposal owns the *authoring* recipe,
not the release gate.

## Approach

One dev-repo-scoped skill under `plugins/nexus/skills/` (authored via the improve-skills New-Skill
recipe, so it gets the Judgment Gate), with a section (or `workflows/` variant) per authoring shape:
hook script + hooks.json wiring + unit-test scaffold; new-plugin scaffold with the shared-registry
sweep; skill-package rules for `references/`/`scripts/` files. Each section points at the live
exemplar files rather than restating them.

## Benefits

Cuts the re-derivation cost the last three estate-editing runs each paid, makes the fourth
occurrence a `Follow {skill}` plan step instead of an invention, and gives the hard-won platform
facts (hook stdin contract, guarded-main pattern, registry sweep) a durable, lintable home.

## Alternatives

- **Do nothing (precedent files as the de-facto source):** this is the status quo that produced three
  reinventions; precedent files carry no "when to use" trigger and decay silently.
- **Fold into improve-skills:** improve-skills owns the meta-loop (creating/fixing skills), not hook
  or plugin authoring; overloading it violates its scope fence and bloats a shipped high-traffic skill.
- **Three micro-skills:** discoverability suffers (auto-invocation keys on descriptions; three thin
  descriptions compete), and the shapes share the same "author estate machinery born-compliant" core.

## Unresolved

- Single skill with three sections vs. skill + `workflows/` variants — pick at authoring time by size.
- Should it be dev-repo-only (`disable-model-invocation` posture) or shipped generically for
  consumers who write their own project-local hooks?

## Provenance

Learner consolidation 2026-07-11. Evidence: adhoc-LearnerCadenceNudge (Skill Gaps),
adhoc-MineSemanticModel (Skill Gaps — second consecutive authoring-shaped gap),
adhoc-AnalystExtension (Skill Gaps — third occurrence, "the recurrence bar is met").
