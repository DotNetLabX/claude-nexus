# Skill Evaluation — cqrs-patterns

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `cqrs-patterns/SKILL.md` (117 lines; monolithic; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` — `Blocks.MediatR/{Abstractions,Behaviors}/` verified.
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** B.

## Layer 0 — Lint
PASS.

## Rubric items checked clean
- L1.1 frontmatter = body (commands, queries, handlers, MediatR pipeline behaviors — all present)
- **Genericization — CLEAN (positive exemplar).** Uses generic placeholders throughout (`{Feature}`, `{Svc}`, `{AggregateRepository}`, `{Domain}`); references shared `Blocks.MediatR` types (not a named consuming project). Zero Fokus/SprintRituals/ADR-number leakage (scan confirmed). This is the *correct* pattern that the leaky Batch-D skills diverge from — cite it as the genericization reference at Step 3.
- **L1.6 / L2.4 — strong.** Pipeline order documented (AssignUserId → Validation → Logging) with each behavior's mechanism; the three framework variants for User-ID assignment (MediatR Behavior / FE PreProcessor / Endpoint Filter) are a clean variant table.
- L2.2 mechanical: ValidationBehavior parallel-discovery code is concrete; `MaxLength` constants enumerated in one place (`Blocks.Core/MaxLength.cs`)
- L2.1 one-concept-once: validator variants and user-id variants each in a single table, no drift
- L3 N/A

## Minor note (not a finding)
No `## What this skill does NOT do` adjacency fence. Adjacents are `add-pipeline-behavior` (creating a new behavior) and `create-feature` (the handler is part of a feature slice). Optional add under estate normalization — low priority given the skill's clarity.

## Verdict: **ACCEPT.** Clean, well-structured, fully genericized MediatR/CQRS reference. The variant tables (user-id assignment, validators) are a model for how to document framework variance without binding to a project. No fix required. **Designate as the genericization positive-exemplar for the Step-3 decision.**
