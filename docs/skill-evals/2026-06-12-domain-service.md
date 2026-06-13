# Skill Evaluation — domain-service

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `domain-service/SKILL.md` (211 lines; monolithic; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` (cited as the reference; the "this stack" examples are Fokus, not the reference repo).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** D (domain computation). **Heaviest project-binding in the estate (33 leakage hits) — see F1.**

## Layer 0 — Lint
PASS.

## F1: Bound to the Fokus project + references unbuilt future state ("Pass 2/3", "snippet won't build until then")
**Severity:** Medium-High (owner-decision — same axis as domain-patterns F1)
**Layer:** 1.1 / genericization / AP5-adjacent (references infrastructure that does not yet exist)
**Claim vs reality:** Frontmatter promises a generic "Domain-layer service" pattern. The body is bound to a specific project and to *future* state:
- **Named project:** live paths `Fokus.Domain/Analytics/SprintSummaryCalculator.cs`, `Fokus.API/Features/Analytics/SprintSummaryService.cs`, `Fokus.API/Features/Analytics/GetBugRatio/`; live VO `HealthThresholdConfig` (Fokus.Domain/Settings/ValueObjects/).
- **Future/unbuilt state:** "**Target-state example (created by Pass 2/3)**", "**Current before-state**: … violates ADR-005. Pass 2/3 will move it", and a code snippet annotated "**Mapster package not yet in CPM, added in Pass 2/3 — snippet won't build until then**." A shipped skill that documents a code path that does not compile in the reference project, gated on an internal future pass, is teaching aspiration as if it were pattern.
- **Project-internal ADRs:** ADR-005/006/010 referenced as governing law — these are Fokus's decision records, not plugin-repo ADRs.
**Grounding caveat:** the *architecture content* is genuinely high-quality and correct — pure-by-default, the narrow domain-owned read-port escape hatch (forbidding `IRepository<T>`/`IQueryable<T>`/`DbContext` in the domain), and the ADR-010 output-boundary discipline (endpoint owns the response DTO, never return the domain type) are excellent, reusable DDD guidance. The defect is **scope + temporality**, not correctness.
**Fix (owner-decision, Step 3 — same ruling as domain-patterns F1):**
1. **`rewrite` (genericize + de-tense):** "this stack"/"this solution" → generic placeholder; demote Fokus paths to clearly-labelled illustrative examples; **remove all "Pass 2/3 / target-state / before-state / won't build until then" framing** (ship the pattern as current, not provisional); restate ADR-005/006/010 as named principles ("computation-in-domain", "no-DTO-input", "endpoint-owns-response") without the project's ADR numbers.
2. **`keep` + relabel:** if nexus-dotnet intends to ship Fokus's conventions as canonical, relabel honestly and drop only the time-sensitive Pass-2/3 scaffolding (the unbuilt-state references are indefensible in a shipped skill regardless of the binding decision).
**Assume neither — Step-3 owner call.**

## F2: Time-sensitive "not proven until Passes 2/3" banner
**Severity:** Medium
**Layer:** 2 / F6 (Anthropic: avoid time-sensitive info)
**Claim vs reality:** Opens with `> Accepted but not proven until Passes 2/3 consume it. This skill encodes ADR-005, ADR-006, ADR-010…`. Internal pass-numbers, stale on completion — exactly the anti-pattern. Couples to F1.
**Fix:** Remove the banner (ship the rules as accepted) or `<details>` "old patterns" per Anthropic. Rides with the F1 rewrite.

## Rubric items checked clean
- **L1.5 scope fence + relationship table — EXCELLENT.** "What This Skill Does NOT Cover" + a full relationship table (domain-patterns, persistence-patterns, extract-feature-service, service-registration, cqrs-patterns) — best cross-skill navigation in the estate. Correctly distinguishes itself from `extract-feature-service` (API-layer, no purity).
- **L1.6 / L2.4 — strong.** The escape-hatch "Forbidden" list (`IRepository<T>`, `IQueryable<T>`, `DbContext`) + the call-site-justification requirement are concrete mechanical rules. The discriminated-`*Response`-envelope-is-wire-only rule is a real, well-explained boundary trap.
- L2.1 one-concept-once: defers EF config to persistence-patterns, handler placement to cqrs-patterns — good single-source discipline
- L2.5: no proven-patterns AP except the F1 genericization/temporality concern

## Verdict: **rewrite** (owner-confirm at Step 3). The DDD architecture content is among the best in the estate; the *framing* binds it to a named private project AND to unbuilt future state. Together with domain-patterns and analytics-computation-service, this skill is the core of the Step-3 genericization decision. **The "Pass 2/3 / won't-build-until-then" references (F2 + F1 temporal half) should be removed regardless of how the project-binding question resolves** — a shipped skill must not document code that does not yet compile.
