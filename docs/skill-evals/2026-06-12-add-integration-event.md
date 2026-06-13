# Skill Evaluation — add-integration-event

**Evaluator:** developer (nexus pipeline, adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `plugins/nexus-dotnet/skills/add-integration-event/SKILL.md` (25 lines) + `workflows/EventContract.md`, `workflows/Publisher.md`, `workflows/Consumer.md`
**Run artifacts consulted:** none available (these skills execute in consuming projects; no run receipts in this repo). Verdict judges the **spec against the reference code** `D:\src\dotnet-microservices` (read-only) — per the skill's own scarce-run-evidence rule.
**Channel:** **ADR-1 dev-repo carve-out** — this is the canonical plugin repo, so findings route to direct fixes here (not the `docs/plugin-feedback/` consuming-project path). Cited so a reviewer does not read a direct edit as an ADR-1 violation (plan Step-2 Channel note; critic Note A).
**Batch:** A (scaffolders, workflows-shape).

## Layer 0 — Lint
PASS (`skill-lint.mjs` exit 0). No BOM, frontmatter parses, name=folder, all 3 workflow citations resolve.

## F1: Ships an empty project-specific "Existing Integration Events" registry table
**Severity:** Medium
**Layer:** 2 (legibility) / AP4 (hardcoded inventory) / genericization
**Claim vs reality:** The body ends with an `## Existing Integration Events` table whose only row is `(check src/BuildingBlocks/{ProjectName}.Integration.Contracts/)`. This is a **consuming-project registry stub shipped inside an app-agnostic skill** — the named genericization artifact from Phase-1. Grounding: the reference repo's real contracts live in `src/BuildingBlocks/Articles.Integration.Contracts/` (verified), confirming `{ProjectName}` is a correct placeholder but the *table itself* belongs to the project, not the skill. An empty table teaches nothing and reads as unfinished.
**Fix:** Drop the table; replace with a one-line pointer ("Existing events live in `src/BuildingBlocks/{ProjectName}.Integration.Contracts/` — grep there before adding a new event to avoid duplicates"). Step-3 estate-wide decision: registry tables belong to consuming projects, not shipped skills (confirm across the family).

## F2: No scope fence ("What this skill does NOT do")
**Severity:** Low
**Layer:** 1.5 (scope fence)
**Claim vs reality:** Rubric 1.5 wants a scope fence naming adjacent skills. This skill has none, despite a close sibling (`create-domain-event-handler` — the publisher IS a domain event handler) that a reader could confuse it with. The body says the publisher is a "domain event handler" but never points to the dedicated skill for the non-integration case.
**Fix:** Add a short `## What this skill does NOT do` — "in-process-only reactions to a domain event → use `create-domain-event-handler` (no contract, no consumer)". One adjacency line.

## Rubric items checked clean
- L1.1 frontmatter promise = body (MassTransit contract+publisher+consumer, MediatR/FastEndpoints variants — all present in workflows)
- L1.4 no "per {convention}" miscitations
- L2.3 right weight (thin orchestrator + 3 workflow files — correct shape for a scaffolder)
- L3 (writes external system): N/A — generates source files, no live external write
- L4.1 lessons-capture: not present, but acceptable for a thin generative skill (no per-skill changelog — see estate decision F9 in research-external.md)

## Verdict: **fix-then-accept** — both findings are reformat-class (drop the stub table, add a fence). No content defect; the generative logic in the workflows is sound and matches the reference stack.
