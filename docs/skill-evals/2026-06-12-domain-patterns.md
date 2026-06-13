# Skill Evaluation — domain-patterns

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `domain-patterns/SKILL.md` (201 lines; monolithic; has `CHANGELOG.md`)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` (cited by the skill as its "reference-only variant").
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** B. **This is the highest-consequence evaluation in the estate — see F1.**

## Layer 0 — Lint
PASS.

## F1: Skill is bound to a specific named consuming project ("this solution" = Fokus/SprintRituals), not app-agnostic
**Severity:** Medium-High (owner-decision — see disposition)
**Layer:** 1.1 (frontmatter promise vs body scope) / genericization / AP3
**Claim vs reality:** The frontmatter promises generic "DDD patterns — aggregates, entities, value objects, domain events…". The body, however, is written in two named tiers:
- **"This solution"** — repeatedly references a *specific* project: live file paths `Fokus.Domain/Settings/ValueObjects/`, `Identity.Domain/Users/User.cs`, `Fokus.Persistence/DependencyInjection.cs:15-16`; named live types `AppSettings`, `HealthThresholdConfig`, `HealthWeightConfig`, `QaHealthThresholdConfig`, `BugRatioAlertThreshold`, `XrayEnabled`; and project-specific decision records **ADR-004 / ADR-007 / ADR-011** that exist in *that* project, not in this plugin repo.
- **"Full-stack / reference-only variant — NOT in this solution"** — the `dotnet-microservices` reference (MediatR, `Articles.Abstractions`, `DomainEvent<TAction>`).

For a **shipped, app-agnostic plugin skill**, "this solution" should be a generic placeholder, not a hardwired second project. The skill effectively ships *Fokus's* domain conventions as the default and *dotnet-microservices* as the alt — but the plugin repo's own reference project (per this whole sweep) is `dotnet-microservices`. This is the same defect class as the external nesbo skill ("real-world production code from the LMP project") flagged in research-external.md §1.

**Grounding caveat:** the dual-variant *content* is technically accurate for both projects (the light-stack FastEndpoints `IEvent` path and the full-stack MediatR `INotification` path both exist and are correctly described). The defect is **scope/genericization**, not correctness — the skill teaches real patterns, but frames them around a named private project a plugin consumer won't have.

**Fix (owner-decision, Step 3):** Two coherent options —
1. **`rewrite` (genericize):** replace "this solution" with a generic placeholder (`{the service}`/`{project}`), demote BOTH Fokus and dotnet-microservices specifics to clearly-labelled *illustrative examples*, and keep the light-stack vs full-stack split as a **variant axis** (not a this/that-project binary). Removes the ADR-004/007/011 hard references (or restates them as "the light-stack variant" without the project's ADR numbers).
2. **`keep` (accept the binding) + relabel:** if the owner intends nexus-dotnet to ship Fokus's conventions as canonical, keep the content but relabel "this solution" → the named baseline so it's honest, and document the binding in the skill. (Weaker — a plugin skill bound to one private project limits reuse.)

This is explicitly a Step-3 owner call ("fate of genericization artifacts" + merge/rewrite verdicts are owner calls). **Assume neither.**

## F2: Time-sensitive "not proven until Passes 2/3" banner at the top
**Severity:** Medium
**Layer:** 2 / F6 (Anthropic: avoid time-sensitive info)
**Claim vs reality:** Body opens with `> **Accepted but not proven until Passes 2/3 consume it.** ADR-007 ... were added in adhoc-Pass1-SkillRepair; they will be validated when applied in Pass 2/3.` This is exactly the time-sensitive scaffolding Anthropic's authoring guidance says to avoid (research-external.md F6) — it references internal pass-numbers (`Pass1-SkillRepair`, `Pass 2/3`) meaningless to a plugin consumer, and it will be stale the moment those passes complete.
**Fix:** Remove the banner (the ADR rules are either accepted or not — ship them without the provisional hedge), or move historical context into an `<details>` "old patterns" block per the Anthropic pattern. Reformat-class, but coupled to the F1 decision (the ADR-007 reference is part of the project-binding question).

## F3: Per-skill CHANGELOG (estate consistency)
**Severity:** Low · **Layer:** 4.2 / F9 — Step-3 estate decision.

## Rubric items checked clean
- L1.6 failure-mode encoding — strong (CS9032 `required` + `private set` error; `SetValues` cross-reference; the light/full-stack interceptor variants)
- L2.1 "one concept once": EF config correctly delegated ("Do not restate EF config here … see `persistence-patterns`") — good single-source discipline
- L2.4 followable cold: ADR-007 VO-vs-scalar rule has a concrete worked example + decision criteria
- L2.5: no proven-patterns AP *except* the AP3/genericization concern in F1
- L1.4 citation discipline: cross-references to `persistence-patterns`, `service-registration` are accurate

## Verdict: **rewrite** (owner-confirm at Step 3) — F1 project-binding is the headline and is the strongest single argument for the whole sweep's genericization decision. The content is accurate and valuable; the *framing* ships a private project's conventions as a plugin default. F2 banner removal rides along. This skill should anchor the Step-3 estate-wide "genericization artifacts" decision: **does nexus-dotnet genericize to placeholders, or bind to a named baseline project?** Every other "this solution"-style reference in the estate (persistence-patterns, cqrs-patterns) follows from that ruling.
