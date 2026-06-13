# Skill Evaluation — service-registration

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `service-registration/SKILL.md` (240 lines; monolithic — no workflows/references; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` (DI layer structure, `AddApiServices`/`AddApplicationServices`/`AddPersistenceServices` pattern).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** B (pattern references, monolithic).

## Layer 0 — Lint
PASS.

## F1: Body opens by duplicating the frontmatter description verbatim
**Severity:** Medium
**Layer:** 2.1 (one concept once) / AP3 (restated rule, no single owner) — critic MEDIUM-2 (verified)
**Claim vs reality:** Line 8 (body's first paragraph) is a **verbatim copy** of the frontmatter `description:` (line 3): "Service DI registration — layer structure, where each dependency type goes, Host composition for modular monolith. Loaded when registering dependencies, adding services to the Host, or modifying DependencyInjection.cs files." Frontmatter wins (rubric 4.3); the body restatement is dead duplication.
**Fix:** Delete the duplicated first paragraph; the `# service-registration` heading should become a real title (`# Service Registration`) and the body open with `## Layer Structure` directly. Reformat-class.

## F2: Bare skill-name heading instead of a title
**Severity:** Low
**Layer:** 2 (legibility)
**Claim vs reality:** `# service-registration` (the folder/name string) is the H1, not a human title. Every other Batch-B skill uses a titled H1 ("# Domain Patterns", "# Error Handling"). Inconsistent.
**Fix:** `# Service Registration`. Folds into the F1 reformat.

## F3: Trailing "When to Load This Skill" partially re-states the description
**Severity:** Low
**Layer:** 2.1 / AP3
**Claim vs reality:** The body ends with `## When to Load This Skill` (6 bullets) which overlaps the frontmatter trigger. Not pure duplication (it's more granular), but it's a second when-to-use surface that can drift from the frontmatter.
**Fix:** Keep the granular list OR fold the trigger into the description (estate F1 decision); don't maintain both. Low priority — decide under the Step-3 normalization.

## F4: No `user-invocable` flag (estate consistency)
**Severity:** Low
**Layer:** 4.3 / F10
**Claim vs reality:** Every other Batch-B skill sets `user-invocable: true`; this one omits it. Inconsistent.
**Fix:** Estate-wide F10 invocation-flag normalization (Step 3).

## Rubric items checked clean
- L1.1 frontmatter = body (layer structure + what-goes-where + Host composition — all present and thorough; the "What Goes Where" per-layer breakdown is genuinely useful)
- L1.4 citations: layer names, `AddMassTransitWithRabbitMQ`, `AddCodeFirstGrpcClient<T>` — grounded against reference DI patterns
- L2.4 followable cold: Naming Conventions table + Program.cs composition example are concrete
- L2.3 weight: 240 lines is the largest in-scope, but it's a genuine reference (no workflow split needed); under the 500-line budget (F7)
- L3 N/A

## Verdict: **reformat** — the defects are all legibility/duplication (F1 description-dup is the headline, critic-named). No content defect: the DI guidance is accurate and the most complete single reference in the estate. One consolidating pass (drop dup paragraph, title the H1, decide the trailing trigger, add the flag) — net complexity DOWN.
