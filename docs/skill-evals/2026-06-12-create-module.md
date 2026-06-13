# Skill Evaluation — create-module

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `create-module/SKILL.md` (55 lines) + 6 workflow files (`ReadClaudeMd.md`, `ScaffoldComponent.md`, `ScaffoldDomain.md`, `ScaffoldDomainApi.md`, `ScaffoldDomainApplication.md`, `ScaffoldInfrastructure.md`)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` — `src/Modules/` verified with both archetypes: Component (`EmailService`, `FileService`) + Domain (`ArticleTimeline` with `.Domain`/`.Application`).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** A.

## Layer 0 — Lint
PASS. All 6 workflow citations resolve.

## Rubric items checked clean
- L1.1 frontmatter = body (archetype branch Component vs Domain; both implemented in workflows)
- **L1.2 guardrail mechanism — STRONG.** Precondition "hard-error if `CLAUDE.md` missing" with the exact error string — a real gate, not prose. Grounded: this enforces the create-module-claude-md → create-module handoff.
- **L1.5 scope fence — PRESENT and thorough.** Names what it does NOT do (no aggregates → `create-aggregate`; no first feature → `create-feature`; no host wiring; no YARP routes; no root CLAUDE.md edit) — and names the adjacent skills. Reference standard for the family.
- L1.6 failure modes: second-run-reuses-Contracts branch encoded for Component archetype
- L2.3 right weight (orchestrator + phase workflows — correct heavy-skill shape)
- L2.4 followable cold (per-archetype report messages templated)
- L3 (writes external system): generates source + edits the .sln via `dotnet sln add` — single-writer is clear (the workflow owns it); idempotency handled by the Component second-run branch
- L4 no per-skill changelog (consistent with the majority; estate F9)

## Verdict: **ACCEPT.** Best-in-class heavy scaffolder — hard-error precondition, thorough scope fence, archetype branching all sound and reference-matched. No fix required.
