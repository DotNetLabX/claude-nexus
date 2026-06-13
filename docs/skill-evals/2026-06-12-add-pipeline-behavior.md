# Skill Evaluation — add-pipeline-behavior

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `add-pipeline-behavior/SKILL.md` (79 lines; no workflows; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` — `Blocks.MediatR/Behaviors/` verified.
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** C (extract/refactor).

## Layer 0 — Lint
PASS.

## F1: No scope fence
**Severity:** Low
**Layer:** 1.5
**Claim vs reality:** No `## What this skill does NOT do`. The adjacent is `cqrs-patterns` (which documents the *existing* behaviors and pipeline order) — a reader could load the wrong one. The skill creates a NEW behavior; cqrs-patterns documents the standard set.
**Fix:** One-line fence: "documenting the existing pipeline order / standard behaviors → see `cqrs-patterns`; this skill creates a new behavior."

## Rubric items checked clean
- L1.1 frontmatter = body (custom `IPipelineBehavior<TRequest,TResponse>` + constrained variant + registration)
- **Genericization — CLEAN.** Generic `{Name}`/`{Service}`/`{Dependencies}`; references shared `Blocks.MediatR`. The `AssignUserIdBehavior`/`ValidationBehavior`/`LoggingBehavior` examples are the *real shared* behaviors (grounded), not project-specific leakage.
- **"Existing Behaviors" table is legitimate (contrast add-integration-event).** Unlike the empty `{ProjectName}` registry stubs, this table documents real BuildingBlocks behaviors with their constraints — useful reference, correctly populated. NOT an AP4 finding.
- L2.2 mechanical: "Order matters! Behaviors execute in registration order" with the numbered sequence
- L2.4 followable cold: before/after handler structure + registration lambda are concrete
- L3 N/A

## Verdict: **fix-then-accept** — single Low fence addition. Clean, genericized, well-grounded; the populated Existing-Behaviors table is a positive contrast to the empty registry stubs elsewhere in the estate.
