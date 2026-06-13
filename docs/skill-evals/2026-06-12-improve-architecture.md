# Skill Evaluation — improve-architecture

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `improve-architecture/SKILL.md` (121 lines; monolithic; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` + the nexus pipeline conventions it references (`docs/kb/index.md`, `docs/backlog.md`).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** E.

## Layer 0 — Lint
PASS.

## F1: Estate-wide ADR contradiction — this skill says "we don't use ADRs", 5 sibling skills cite ADRs as governing law
**Severity:** Medium
**Layer:** 1.4 (citation audit) / 2.1 (one concept once) / AP3 (restated rule with drift)
**Claim vs reality:** This skill's "What This Skill Does NOT Do" states: *"Generate ADRs — **we don't use ADRs**. Findings go into backlog or plan steps."* But FIVE in-scope siblings cite ADRs as *governing law*: domain-patterns (ADR-004/007/011), domain-service (ADR-005/006/010), analytics-computation-service (ADR-005/006/010), central-package-management (ADR-013), framework-currency (ADR-011/012). The estate **contradicts itself** on whether the project uses ADRs. (The ADRs in question are the *consuming project's* decision records — but a reader of the plugin can't reconcile "we don't use ADRs" with five skills citing them.)
**Fix:** Estate-wide Step-3 decision, coupled to the genericization ruling. If the Domain/process skills are genericized (ADR numbers → named conventions per domain-service F1), this contradiction dissolves automatically — improve-architecture's "we don't use ADRs" becomes consistent. If the project-binding is kept, improve-architecture's line must be reconciled. Flag for the normalization section.

## Rubric items checked clean
- L1.1 frontmatter = body (proactive discovery: coupling hotspots, anemic aggregates, leaky boundaries; structural graph + KB; invoker-dependent output)
- **Genericization — CLEAN.** No named-project leakage, no banner. Uses generic structural-graph / KB / CLAUDE.md references.
- **L1.5 scope fence + L1.2 guardrails — EXCELLENT.** "When NOT to Use" + "Guardrails" (never refactor without presenting; don't propose patterns not in the codebase; don't redesign aggregates on code smell alone) + "What This Skill Does NOT Do". The invoker-branching (solo implements / architect → backlog) is a clean output contract.
- **L2.4 followable cold — strong.** The "Deletion Test" (concentrates → load-bearing; scatters → thin glue; nothing changes → dead code) is a memorable, concrete heuristic. The DDD-vocabulary mapping table is a nice touch.
- L1.3: correctly notes "the structural graph is structural, not semantic — a high connection count doesn't automatically mean bad"
- L3 (spawns subagents): N/A — discovery-first, reads structured data; no fan-out

## Verdict: **fix-then-accept** — the single finding (F1 ADR contradiction) is estate-wide and resolves as a side-effect of the Step-3 genericization decision. The skill's *own* content is among the cleanest in the estate (no leakage, strong guardrails, the Deletion Test). No unilateral fix needed — flag F1 for the normalization section.
