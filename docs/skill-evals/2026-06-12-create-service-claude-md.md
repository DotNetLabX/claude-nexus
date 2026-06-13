# Skill Evaluation — create-service-claude-md

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `create-service-claude-md/SKILL.md` (38 lines) + 2 workflow files (`CaptureAxes.md`, `WriteClaudeMd.md`)
**Run artifacts:** none. Architect-only; output is a CLAUDE.md that `create-service` consumes. No factual stack claims to ground (captures axes, doesn't assert type/package names) — but the axis set it captures (endpoint framework, persistence, shared-state) matches the reference repo `D:\src\dotnet-microservices/src/Services/` topology (6 services, FastEndpoints, EF Core + Redis variants — verified).
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** A.

## Layer 0 — Lint
PASS. Both workflow citations resolve.

## F1: `user-invocable: true` — estate consistency (same as create-module-claude-md)
**Severity:** Low
**Layer:** 4.3 / F10
**Fix:** Estate-wide F10 invocation-flag normalization (Step 3). Architect-only skills should share one policy.

## Rubric items checked clean
- L1.1 frontmatter = body ("Architect-only", captures axes, writes `src/Services/{Name}/CLAUDE.md`)
- **L1.5 scope fence — PRESENT.** Does NOT scaffold; does not touch .sln/compose; does not create business code; does not write the feature plan. Cleanly fenced vs `create-service` and vs the normal plan workflow.
- **L1.2 guardrail — good.** "Ask about every unanswered axis in one batch" + "Wait for the user to confirm or correct" — explicit approval gate; correct for design capture.
- L2.2 mechanical: "one consolidated question. No sequential Q&A" is a concrete instruction
- L2.4 followable cold (pre-fill-from-context → batch-ask → confirm → write)
- L3 N/A (single markdown output)

## Verdict: **fix-then-accept** — only the estate-wide F10 invocation-flag decision. The architect/developer handoff (this writes CLAUDE.md, create-service reads it) is clean, well-fenced, and grounded. Peer-quality with create-module-claude-md.
