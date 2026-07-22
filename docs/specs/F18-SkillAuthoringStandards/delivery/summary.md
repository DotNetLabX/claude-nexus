# F18-SkillAuthoringStandards — Summary

Mode: architect-led fast lane

## Status: COMPLETE

## What Was Built

The P11+P20 skill-authoring standards, three-tiered: **skill-recipe §4** (the binding standard —
every stack-extension skill opens with a `## Assumes` block naming its stack packages/reference app
plus a minimal-stack branch or adaptation posture; descriptions name the step-shapes plans actually
use); **skill-lint W5/W6** (the deterministic warn tier, scoped to `-dotnet/-flutter/-cpp/-php`
plugin dirs, warn-only, with red-first fixture tests); and the **judgment wiring** (improve-skills
Quality Gate + warn-summary; an evaluate-skill Layer-3 "Stack-extension skill" overlay).

## Key Outcomes

- 5 shipped files + tests modified; suite grew 589 → 593, all green; skill-lint exit 0 everywhere.
- Warn baselines: W5 = 42 (the full retrofit worklist — F19 is the first tranche), W6 = 5.
- Review chain: code-grounded critic GO-with-fixes (6 findings folded pre-implementation);
  developer self-review PASS; done-check PASS with the architect re-running the warns live;
  0 fix cycles.
- Release: nexus **1.47.0** (MINOR — veto to PATCH open at close).
- First live consumption of the F24 recipe — via a documented Read-channel deviation (the install
  cache predates 1.46.0), disposition Deviated-valid.

## Deviations from Plan

- `edit-shipped-plugin-skill` consumed by Read, not the Skill tool (cache staleness — valid,
  self-disclosed).
- Self-review in-context rather than spawned finders (ADR-21 — correct call by the developer).

## Notes

- F19 can now run: its 10-skill retrofit clears the W5 warns for the P1–P10 set; the packs
  (F23/F31) are born under §4.
- After `/plugin update` in consuming sessions, the Skill tool resolves the F24 recipe normally.
- omni twin sync + push run at this lane close.
