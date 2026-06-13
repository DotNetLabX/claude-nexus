# Skill Evaluation — create-service

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `create-service/SKILL.md` (52 lines) + 8 workflow files (`ReadClaudeMd.md`, `ScaffoldFolders.md`, `ScaffoldCsprojFiles.md`, `ScaffoldApiProject.md`, `ScaffoldDomainProject.md`, `ScaffoldPersistenceProject.md`, `ScaffoldApplicationProject.md`, `ScaffoldInfrastructure.md`)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` — 6 services verified (`Auth`, `Journals`, `Production`, `Review`, `Submission`, `ArticleHub`), `ApiGateway/`, `docker-compose.yml` all present.
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** A.

## Layer 0 — Lint
PASS. All 8 workflow citations resolve.

## Rubric items checked clean
- L1.1 frontmatter = body (folder tree + csproj + Program.cs + DI stubs + appsettings + Dockerfile + compose entry; no business classes)
- **L1.2 guardrail — STRONG.** Hard-error precondition on missing `CLAUDE.md` with exact error string (mirrors create-module). Real gate.
- **L1.5 scope fence — thorough.** No aggregates/features/domain classes; no YARP route; no migrations; no root CLAUDE.md edit — each with the adjacent skill named.
- L2.3 right weight (orchestrator + 8 phase workflows — correct for the heaviest scaffolder)
- L2.4 followable cold (conditional `.Application` step gated on shared-state axis; branches stated)
- L3 (writes external system): edits `.sln`, `docker-compose.yml`, `docker-compose.dcproj` — single-writer via `ScaffoldInfrastructure.md`; `dotnet sln add` run inline; build-verify gate at step 9
- L4 no per-skill changelog (majority-consistent; estate F9)

## Minor note (not a finding)
Workflows reference "the solution file" rather than a named `.sln` — correct genericization (the reference repo has two: `Articles.sln`, `Submission.sln`), so a hardcoded name would be wrong. No action.

## Verdict: **ACCEPT.** Best-in-class heavy scaffolder, peer to `create-module`. Hard-error precondition, thorough fence, grounded folder/csproj/compose topology. No fix required.
