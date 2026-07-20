# F17-MineFieldFixes — Summary

Mode: architect-led fast lane

## Status: COMPLETE

## What Was Built
- Plugin-feedback P18: `mine-skill-gaps`' S1 Tier-A census now sweeps the `Skill Gaps` heading
  case-insensitively at any heading level, with a heading-less-bullet **capture-signal** tolerance
  in the parser posture (fixes the measured KG field miss).
- Plugin-feedback P19: the mine-family kickoff checklist gains Tier-1 item 5 **Stage-model-plan
  declared** (declare-and-veto; mechanical vs judgment stage classes), enforced in
  `kickoff-preflight.mjs` (new `stageModelPlan` universal key, TDD red-first) and reflected in all
  eight sibling Tier-1 enumerations (7 nexus mines + nexus-analytics `mine-semantic-model`).

## Key Outcomes
- 12 files modified (10 skill/reference prose, 1 shipped tool, 1 test); releases: **nexus 1.38.1**
  (PATCH) + **nexus-analytics 0.4.1** (PATCH) — PATCH-vs-MINOR decided deliberately (fix-tier
  hardening, F9 precedent; rejected MINOR recorded in the plan's Decisions).
- Tests: kickoff-preflight 10/10; full regression 538 pass / 0 fail (42 files). skill-lint exit 0
  on all 9 edited skill dirs. Both plugins `claude plugin validate --strict` green.
- Reviews: code-grounded critic APPROVE on the plan (2 MEDIUM folded); developer disclosed
  self-review APPROVED (1 LOW folded); architect done-check **PASS** (0 fix cycles); `tdd`
  invocation platform-logged in the scoped window.

## Deviations from Plan
- Step-4 full-suite invocation form: `node --test tests/unit/` (directory form) fails under Node
  v24.18.0; the equivalent glob ran the full suite. Documented; plans should pin the glob form.

## Notes
- **Behavior change for consumers:** every mine-family kickoff now REFUSES unless the run declares
  its stage-model-plan — declare (e.g. `all=session-tier`) at the next SDK mining-wave kickoff.
- Omni twin not present on this machine — `gen-omni.mjs` skipped (sanctioned); run the sync on the
  machine holding the twin.
