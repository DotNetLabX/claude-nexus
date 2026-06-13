# Skill Evaluation — create-grpc-contract

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `create-grpc-contract/SKILL.md` (29 lines) + `workflows/Contract.md`, `workflows/Server.md`, `workflows/Client.md`
**Run artifacts:** none (consuming-project skill). Spec judged against `D:\src\dotnet-microservices` (read-only).
**Channel:** ADR-1 dev-repo carve-out (direct fix here, not feedback file) — critic Note A.
**Batch:** A.

## Layer 0 — Lint
PASS. All 3 workflow citations resolve.

## F1: Ships an empty project-specific "Existing Contracts" registry table
**Severity:** Medium
**Layer:** 2 / AP4 / genericization
**Claim vs reality:** Body ends with `## Existing Contracts` table, only row `(check src/BuildingBlocks/{ProjectName}.Grpc.Contracts/)`. Same artifact class as `add-integration-event`'s empty events table — a consuming-project registry stub in an app-agnostic skill. Grounding: reference repo has real contracts at `src/BuildingBlocks/Articles.Grpc.Contracts/{Service}/` (verified — `PersonContracts.cs`, `JournalContracts.cs`), so `{ProjectName}` is a correct placeholder but the table is the project's, not the skill's.
**Fix:** Replace the empty table with a one-line pointer to grep the contracts folder before adding. Estate decision F9 (registry tables → consuming projects).

## F2: No scope fence
**Severity:** Low
**Layer:** 1.5
**Claim vs reality:** No `## What this skill does NOT do`. The close sibling is `add-integration-event` (async messaging vs this skill's sync RPC) — a reader choosing between sync/async cross-service comms gets no steer.
**Fix:** Add a one-line fence: "asynchronous event propagation → use `add-integration-event` (MassTransit); this skill is synchronous request/response only."

## Rubric items checked clean
- L1.1 frontmatter = body (code-first contract+server+client; `protobuf-net.Grpc` — verified in `workflows/Contract.md`: `ValueTask<T>`, `CallContext context = default`, `[ProtoContract]`/`[ProtoMember]` all correct against reference)
- L1.3 external-system claim (protobuf-net.Grpc API shape) — grounded against reference repo, accurate
- L2.4 followable cold; Port Conventions points to root CLAUDE.md (no magic numbers inline)
- L3 N/A (generates source, no live external write)

## Verdict: **fix-then-accept** — two reformat-class findings (drop stub table, add fence). gRPC pattern content is accurate and reference-matched.
