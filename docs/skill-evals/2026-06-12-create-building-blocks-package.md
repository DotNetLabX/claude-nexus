# Skill Evaluation — create-building-blocks-package

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `create-building-blocks-package/SKILL.md` (65 lines; no workflows, no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` — `Blocks.*` packages verified (Blocks.Core, Blocks.Domain, Blocks.Messaging, Blocks.Redis, Blocks.FastEndpoints, etc.).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** A.

## Layer 0 — Lint
PASS.

## Rubric items checked clean
- L1.1 frontmatter = body (scaffold Blocks.{Name} csproj + GlobalUsings + sln registration)
- **L1.5 scope fence — PRESENT and good.** `## What this skill does NOT do` names the boundary (no consuming-service reference add; no app-specific packages; module contracts → `create-module`).
- L1.2 guardrail: "app-agnostic primitives only / no project-specific knowledge" stated and reinforced in the fence + Naming Convention ("name after technology, not a business domain")
- **L2.4 / AP4 avoided — good.** The csproj template is inline but the skill explicitly says "Read an existing Blocks.*.csproj to get the current TargetFramework — do not hardcode." Avoids the stale-TFM trap.
- L2.3 right weight: single SKILL.md, no workflows needed (correct — it's a one-shot scaffold)
- "When to Use" section present (F1 trigger satisfied in-body even though the frontmatter description is what-it-does only — minor)
- L3 N/A

## Minor note (not a finding)
Frontmatter `description` is what-it-does only; the in-body "When to Use" carries the trigger. Under the estate-wide F1 standardization (Step 3), consider folding a short when-to-use into the description for auto-invocation discovery. Low priority — the body already covers it.

## Verdict: **ACCEPT.** Reference-quality thin scaffolder — scope fence present, no-hardcode discipline, grounded `Blocks.*` convention. No fix required (one optional F1 description tweak deferred to the estate decision).
