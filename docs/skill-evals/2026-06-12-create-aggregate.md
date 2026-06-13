# Skill Evaluation — create-aggregate

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `create-aggregate/SKILL.md` (49 lines) + `workflows/{AggregateEfCore,AggregateRedis,DomainEvent,ValueObject}.md` + `CHANGELOG.md`
**Run artifacts:** none (consuming-project skill). Spec judged against `D:\src\dotnet-microservices`.
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** A.

## Layer 0 — Lint
PASS. All 4 workflow citations resolve.

## F1: Per-skill CHANGELOG duplicates git history (estate consistency)
**Severity:** Low
**Layer:** 4.2 (changelog) / F9 estate finding
**Claim vs reality:** Carries `CHANGELOG.md` (one of only 5 of 26 in-scope skills that do). The changelog is real and dated but explicitly "reconstructed from git history" — it duplicates what `git log` already holds, and no credible external package keeps per-skill changelogs (research-external.md F9). Inconsistent across the estate.
**Fix:** Estate-wide Step-3 decision (keep-all vs drop-to-git-history). Not a unilateral fix — flagged for the normalization section.

## Rubric items checked clean
- L1.1 frontmatter = body (aggregate + VO + domain events + EF config + repository; EF/Redis variants — all in workflows)
- **L1.6 known failure modes encoded — STRONG.** "Promote an Existing Entity (in place)" section + "Special Cases" (Identity `User` cannot extend `AggregateRoot<T>`; Redis uses `Blocks.Redis.Entity`). These are real failure branches lifted from past passes (adhoc-Pass4/Pass5 per changelog) into the skill's own steps — exactly what rubric 1.6 wants. Grounded: reference repo has `AggregateRoot.cs` in `Blocks.Domain/Entities/` (verified).
- L2.3 right weight (orchestrator + 4 variant workflows)
- L2.4 schema-consequence check at plan-time is a followable-cold mechanical instruction (read the model snapshot) — good
- L3 N/A

## Verdict: **ACCEPT** (modulo the estate-wide CHANGELOG decision). This is a best-in-class scaffolder in the batch — the promote-in-place and Special-Cases sections are the reference standard for encoding failure modes. No content or structure defect.
