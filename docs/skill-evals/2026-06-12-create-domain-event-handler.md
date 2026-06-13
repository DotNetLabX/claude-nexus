# Skill Evaluation — create-domain-event-handler

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `create-domain-event-handler/SKILL.md` (24 lines) + `workflows/Handler.md`
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices`.
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** A. (Thin skill → thin doc, per plan.)

## Layer 0 — Lint
PASS. Workflow citation resolves.

## F1: No scope fence vs add-integration-event
**Severity:** Low
**Layer:** 1.5
**Claim vs reality:** The publisher in `add-integration-event` IS a domain event handler, so the two skills are genuinely confusable. This skill (in-process reaction, no contract/consumer) has no fence pointing to the cross-service case.
**Fix:** One-line fence: "cross-service propagation (contract + consumer) → use `add-integration-event`; this skill is in-process only (SignalR broadcast, background-job trigger, etc.)." Pairs with `add-integration-event` F2.

## Rubric items checked clean
- L1.1 frontmatter = body — description is strong (states effect-based naming + co-location + example triggers "SignalR broadcast, background job trigger"); the body delegates the location rule, naming rule, and pattern to `workflows/Handler.md` (FastEndpoints/MediatR variants)
- L1.1 description quality — this is one of the better descriptions in the estate (what + when + concrete examples); F1-compliant already
- L2.3 right weight (24-line orchestrator + 1 workflow — correct for the job)
- L2.4 followable cold (delegates the 3 decisions to the workflow consistently)
- L3 N/A

## Verdict: **fix-then-accept** — single Low fence addition. Otherwise a clean, well-described thin scaffolder; its description is a positive F1 exemplar for the estate.
