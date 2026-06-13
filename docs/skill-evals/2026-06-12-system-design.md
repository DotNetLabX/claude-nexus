# Skill Evaluation — system-design

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `system-design/SKILL.md` (134 lines; monolithic; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` (variant axes, port range, communication patterns) + sibling skill frontmatter (for the F1 citation check).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** E.

## Layer 0 — Lint
PASS.

## F1: Mis-cites sibling skills' frontmatter — claims create-*-claude-md are `user-invocable: false`, they are `true`
**Severity:** Medium
**Layer:** 1.4 (citation audit — the exact defect class the rubric names)
**Claim vs reality:** §3 states: *"Both skills are Architect-only (`user-invocable: false`)."* Verified reality: both `create-service-claude-md/SKILL.md` and `create-module-claude-md/SKILL.md` set **`user-invocable: true`**. This is a confident citation of the *opposite* of what the cited skills actually declare — precisely rubric 1.4's measured defect ("skills have confidently cited conventions for the opposite of what they say"). A reader trusting system-design would believe those skills block human invocation; they don't.
**Fix:** Correct the line to `user-invocable: true` — OR, better, this exposes the real F10 question: *should* architect-only skills be model-invocable? If the intent is "architect-only, not auto-invoked by the model mid-developer-session," the correct frontmatter is `disable-model-invocation: true` (which none of them set) while keeping `user-invocable: true`. Resolve under the Step-3 F10 invocation-flag normalization, then make system-design's citation match reality.

## Rubric items checked clean
- L1.1 frontmatter = body (variant axes, domain lifecycle, service boundaries, communication patterns — all present and thorough)
- **Genericization — CLEAN.** No named-project leakage, no banner. Generic `{Entity}`/`{Name}`/`{Source}` placeholders; port range stated as a convention (4400-4499).
- **L2.4 followable cold — EXCELLENT.** The three variant axes + the cascading-effects matrix (FastEndpoints+FE-Events / Carter+MediatR / MinAPI+MediatR × user-id / validator / event-handler / publisher / discovery / app-layer) is the best decision-support table in the estate. The communication-pattern guide (gRPC sync vs integration-event async, with decision rules) is concrete.
- **L1.5 scope fence — clear.** "This skill is for the Architect agent only. The Developer never loads this skill." Correctly points downstream to create-service-claude-md / create-module-claude-md → create-service/create-module → create-aggregate/create-feature (the full handoff chain).
- L3 N/A

## Verdict: **fix-then-accept** — single Medium finding (F1 frontmatter mis-citation), which doubles as the concrete trigger for the Step-3 F10 invocation-flag decision (architect-only skills should likely set `disable-model-invocation: true`, and system-design's citation must then match). The skill's content (variant axes, cascading matrix, communication guide) is excellent and fully genericized — a model architect reference.
