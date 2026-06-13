# Skill Evaluation — extract-feature-service

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `extract-feature-service/SKILL.md` (67 lines; no workflows; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` (API-layer feature-area service pattern).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** C.

## Layer 0 — Lint
PASS.

## Rubric items checked clean
- L1.1 frontmatter = body (extracts shared handler logic into a focused operation service, result-record pattern)
- **L1.5 scope fence + L1.2 guardrails — STRONG.** `## Guardrails` (single-purpose; not an entity wrapper; feature-scoped; no repository interfaces) + `## What This Skill Does NOT Do` (no entity-wrapper services; no separate project; no abstractions). The "not an entity wrapper — `SprintService` is a guardrail violation" rule is a concrete, memorable anti-pattern.
- **L2.4 followable cold — strong.** Operation-not-entity naming with good/bad examples; result-record-above-class layout; primary-constructor injection; the 9 steps are concrete.
- Genericization: examples (`SprintIssueSyncService`, `HealthScoreCalculator`) are illustrative within generic `{ServiceName}`/`{Area}`/`{Operation}` placeholders. The bad-example `SprintService` is the teaching device — acceptable, not leakage.
- L1.4 cross-skill: correctly distinguishes itself from `domain-service` (Domain layer, purity) — this is the API-layer counterpart
- L3 N/A

## Verdict: **ACCEPT.** Clean, guardrail-rich refactor skill. The operation-not-entity naming rule and the entity-wrapper anti-pattern are high-value, cold-followable guidance. Pairs cleanly with `domain-service` (the two correctly split API-layer vs Domain-layer service patterns). No fix required.
