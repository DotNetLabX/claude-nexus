# Skill Evaluation — extract-endpoint-types

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `extract-endpoint-types/SKILL.md` (60 lines; no workflows; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` (FastEndpoints feature-folder layout).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** C.

## Layer 0 — Lint
PASS.

## Rubric items checked clean
- L1.1 frontmatter = body (splits a fat FastEndpoints endpoint into endpoint + command/query sibling)
- **L1.5 scope fence — PRESENT and precise.** `## What This Skill Does NOT Do` names BOTH adjacents correctly: create new endpoints → `create-feature`; move handler logic out → `extract-feature-service`; and explicitly "does not introduce MediatR." Reference-quality fence.
- **L2.4 followable cold — strong.** Move-these / keep-these lists + the using-statement carry-over guidance + before/after file layout are concrete and cold-followable.
- "When to Use" present (F1 trigger satisfied)
- Genericization: examples (`SyncSprintsCommand`, `SyncSprintsResponse`) are clearly illustrative within generic `{Name}`/`{Feature}` placeholders — acceptable (named examples for a refactor, not a project-binding default). Minor: these are Fokus-flavored names but used purely as "e.g." — not a leakage finding.
- L3 N/A

## Verdict: **ACCEPT.** Clean refactor skill with a precise, adjacent-naming scope fence and cold-followable steps. No fix required. Its fence is a model for the estate (names two adjacents + a negative constraint).
