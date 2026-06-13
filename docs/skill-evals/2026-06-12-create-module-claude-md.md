# Skill Evaluation — create-module-claude-md

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `create-module-claude-md/SKILL.md` (44 lines) + 4 workflow files (`CaptureCommonAxes.md`, `CaptureComponentAxes.md`, `CaptureDomainAxes.md`, `WriteClaudeMd.md`)
**Run artifacts:** none. Architect-only skill; output is a CLAUDE.md that `create-module` consumes. No factual stack claims to ground (the skill captures axes, it doesn't assert type/package names) — but the Component vs Domain archetype split it captures matches the reference repo `D:\src\dotnet-microservices/src/Modules/` (Component: EmailService/FileService; Domain: ArticleTimeline — verified).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** A.

## Layer 0 — Lint
PASS. All 4 workflow citations resolve.

## F1: `user-invocable: true` frontmatter — estate consistency of invocation flags
**Severity:** Low
**Layer:** 4.3 / F10 estate finding
**Claim vs reality:** Sets `user-invocable: true`. Most in-scope skills omit any invocation flag; only a few (this, create-service-claude-md, domain-patterns) set one. For an **architect-only** skill, the more meaningful control would be whether the *model* auto-invokes it mid-developer-session (it should not — it's an architect design-time skill). The flag set is `user-invocable` (allow human `/` invocation), which is correct, but the family lacks a consistent policy.
**Fix:** Estate-wide F10 decision (Step 3): standardize invocation frontmatter per family — architect-only skills (this, create-service-claude-md, system-design) get a consistent flag set. Not a unilateral edit.

## Rubric items checked clean
- L1.1 frontmatter = body ("Architect-only", archetype branch, writes CLAUDE.md)
- **L1.5 scope fence — PRESENT.** "Does NOT scaffold folders/files; does not touch .sln; does not run dotnet; does not decide silently." Correctly fences against the `create-module` developer skill.
- **L1.2 guardrail — good.** "Do not proceed until the user confirms" (step 3) is an explicit approval gate; correct for an architect design-capture skill.
- L2.4 followable cold (axis capture delegated to workflow files; confirmation step explicit)
- L3 N/A (writes a single markdown file, no batch/external system)

## Verdict: **fix-then-accept** — only the estate-wide F10 invocation-flag normalization. Content and structure are sound; the architect/developer split (this writes the CLAUDE.md, create-module reads it) is clean and well-fenced.
