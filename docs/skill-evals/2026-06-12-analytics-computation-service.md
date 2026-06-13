# Skill Evaluation — analytics-computation-service

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `analytics-computation-service/SKILL.md` (183 lines; monolithic; has `CHANGELOG.md`)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices`; "this stack" examples are Fokus.
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** D. **Project-binding + unbuilt-state, same axis as domain-service (22 leakage hits) — see F1.**

## Layer 0 — Lint
PASS.

## F1: Bound to Fokus + references unbuilt future state (same finding class as domain-service F1)
**Severity:** Medium-High (owner-decision)
**Layer:** 1.1 / genericization / AP5-adjacent
**Claim vs reality:** Generic frontmatter ("Domain-layer analytics calculator"), but the body binds to a named project and to future state:
- **Named project:** `Fokus.Domain/Analytics/SprintSummaryCalculator.cs`, `Fokus.API/Features/Analytics/SprintSummaryService.cs`, live VO `HealthThresholdConfig`, live calculator names (`BugRatioScorer`).
- **Unbuilt/future state:** "**Target-state example (created by Pass 2/3)**" (repeated), "**Current before-state**: … violates ADR-005. Pass 2/3 migrates it", "**Mapster package not yet in CPM, added in Pass 2/3 — snippet won't build until then**", "This is a project-specific type, not from BuildingBlocks. Target-state example (created by Pass 2/3)".
- **Project-internal ADRs:** ADR-005/006/010 as governing law.
**Grounding caveat:** the analytics *content* is excellent and reusable — the delta/direction/polarity triplet, sparkline builder, rolling-average-with-exclusion-guards (`TakeLast` after guards, not before), multi-vs-single-period split, and the wire-only `{Mode,Multi?,Single?}` envelope rule are high-quality, project-independent computation patterns. Defect is **scope + temporality**, not correctness.
**Fix (owner-decision, Step 3):** same two options as domain-service F1 — genericize "this stack"→placeholder + demote Fokus paths to illustrative + **remove all Pass-2/3 / target-state / won't-build framing**, restate ADRs as principles; OR relabel-and-keep while still dropping the unbuilt-state references.

## F2: Time-sensitive "not proven until Passes 2/3" banner
**Severity:** Medium · **Layer:** 2 / F6 — same as domain-service F2. Remove regardless of the binding decision.

## F3: Per-skill CHANGELOG (estate consistency)
**Severity:** Low · **Layer:** 4.2 / F9 — one of the 5 changelog-carrying in-scope skills. Step-3 estate decision. (The changelog itself is informative — it records the Pass-1 reframe — but duplicates git history.)

## Rubric items checked clean
- L1.1 frontmatter = body (delta/direction/polarity, multi-period iteration, sparkline builders, rolling average — all present); correctly declares itself a **specialization of `domain-service`** ("Read domain-service first — all its rules apply")
- **L1.5 scope fence + relationship table — EXCELLENT.** "What This Skill Does NOT Cover" + relationship table (domain-service base, domain-patterns, persistence-patterns, create-feature, create-vue-feature). Clean specialization-of pattern.
- **L2.4 followable cold — strong.** The reference-shape calculator table, the delta/direction/polarity field semantics, the `BuildSparkline(...)` signature, and the rolling-average ordering caveat are concrete.
- **L2.1 one-concept-once — good.** Defers all base rules to `domain-service` (no restatement); the wire-envelope rule references domain-service's Output Boundary rather than re-deriving.
- L2.5: no proven-patterns AP except the F1/F2 genericization + temporality concern

## Verdict: **rewrite** (owner-confirm at Step 3) — same ruling and rationale as `domain-service`. The analytics computation content is excellent; the framing binds to Fokus and documents unbuilt Pass-2/3 state. This skill + `domain-service` + `domain-patterns` form the genericization-decision cluster. **The Pass-2/3 / won't-build references must go regardless of the binding ruling.** As a specialization of `domain-service`, this should be rewritten *in lockstep* with it (same decision, applied consistently — AP2 half-landed-fix risk if only one is done).
