# F20-ProcessSkillQuickWins — Summary

Mode: architect-led fast lane

## Status: COMPLETE

## What Was Built
- Plugin-feedback P12: `tdd` gains the **Retro-fit Mutation Variant** (green-first →
  single-mutation → red → revert) for tests over already-shipped behavior, reconciled in both
  directions with the red-first anti-pattern (scoped to new behavior, cross-referenced).
- Plugin-feedback P13: `diagnose` Phase 3 gains the **Infra-gate mimicry** hypothesis-class
  callout (identify the error's emitter before debugging the application path).
- Plugin-feedback P14: `create-implementation-plan`'s Reading protocol starts with the
  **grep-the-feature-name** collision check (+ Required Reading pointer) — a stale same-name
  artifact is surfaced, never silently re-planned.

## Key Outcomes
- 3 files modified (prose-only, nexus core process skills); release: **nexus 1.38.2** (PATCH,
  deliberate — fix-tier hardening, rejected MINOR recorded in the plan's Decisions).
- Gates: all acceptance greps pass incl. three range-scoped location gates; skill-lint exit 0 on
  all three dirs; no unit-test surface (stated, not silently skipped); plugin validate --strict
  green.
- Reviews: code-grounded critic **REVISE → folded** (1 HIGH: the variant/anti-pattern
  contradiction — both reconciliation halves now shipped; 1 MEDIUM: Required-Reading divergence —
  pointer added; 1 LOW: location gates made range-scoped); developer disclosed self-review
  APPROVED; architect done-check **PASS**, 0 fix cycles.

## Deviations from Plan
- One valid in-scope coherence touch: the Reading-protocol renumber staled the Steps-section
  summary sentence in the same file; fixed under the stale-adjacent-sentence rule, documented.

## Notes
- The `edit-shipped-plugin-skill` skill gap is now thrice-sighted (F16, F17, F20) with two new
  sub-disciplines recorded — strong learner-promotion candidate before F18/F19.
- Untracked outsiders left alone: `docs/kb/research/br-anchored-regeneration-landscape.md`,
  `docs/programs/br-anchored-regeneration.md` (other threads' files).
