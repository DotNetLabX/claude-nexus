# Skill Evaluation — authorization-patterns

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `authorization-patterns/SKILL.md` (113 lines; monolithic; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` — `{ProjectName}.Security/` pattern (reference repo has `Articles.Security/`, verified).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** B.

## Layer 0 — Lint
PASS.

## Rubric items checked clean
- L1.1 frontmatter = body (two-layer authz: role gate + resource gate — both fully implemented with requirement, registration, handler, endpoint-application)
- **Genericization — CLEAN.** Generic placeholders throughout (`{Resource}`, `{resource}`, `{Action}`, `{ProjectName}`); source files cited as `{ProjectName}.Security/…` (grounded: reference repo has `Articles.Security/`). Zero named-project leakage. Positive exemplar alongside cqrs-patterns.
- **L2.4 followable cold — strong.** Three variants (Simple role-only / Full role+resource / Tenant-scoped) each with when-to-use; the per-framework endpoint-authorization table (FastEndpoints / Carter / Minimal APIs) is concrete.
- L1.4 citation: Source Files section lists exact paths consistently
- L2.1 one-concept-once: the authorization handler combining both layers is shown once, variants reference it
- L3 N/A

## Minor note (not a finding)
No `## What this skill does NOT do` fence; `user-invocable: true` set (consistent with Batch B). The "Source Files" + "Variants" sections give enough boundary context. Optional fence under estate normalization.

## Verdict: **ACCEPT.** Clean, fully-genericized two-layer authorization reference. Variant coverage (simple/full/tenant) and the framework table make it followable cold. No fix required.
