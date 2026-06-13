# Skill Evaluation — framework-currency

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `framework-currency/SKILL.md` (130 lines; monolithic; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` — cited as the target state ("Auth.API uses Send.OkAsync throughout — zero legacy calls remain").
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** E.

## Layer 0 — Lint
PASS.

## F1: Time-sensitive banner + ADR-011/012 + project-specific live examples
**Severity:** Medium
**Layer:** 2 / F6 / genericization
**Claim vs reality:** Opens with the `> Accepted but not proven until Passes 2/3 consume it…` banner. References "This solution is on FastEndpoints 8.1.0" and project-specific live false-positive examples (`GraphQLXrayClient.cs:296`, `SyncSprintsEndpoint.cs:46`) — these are Fokus/this-project file:line references.
**Caveat:** the version pin (8.1.0) and "verify against the installed version" guidance are GOOD (the skill explicitly says "never trust memory; verify against the installed package" and re-verify if the version differs) — so the version specificity is self-correcting, not a stale trap. The defect is the banner + the named-project file:line examples.
**Fix:** Remove the banner; keep the version-verification discipline (it's correct); demote the `GraphQLXrayClient.cs:296` / `SyncSprintsEndpoint.cs:46` references to generic "e.g. an HttpClient call site / a SignalR hub call site" (the receiver-type is what matters, not the file). Restate ADR-011/012 as named conventions. Step-3 genericization decision.

## Rubric items checked clean
- L1.1 frontmatter = body (general currency rule + FastEndpoints Send.* migration — both present, two-rules-one-skill correctly scoped)
- **L1.6 / L2.2 — BEST-IN-ESTATE false-positive handling.** The two-stage `Send*Async` detection (Stage 1 grep → Stage 2 receiver inspection) explicitly solves the HttpClient/SignalR false-positive problem: "any dot-qualified receiver before `SendAsync` means it is NOT a FastEndpoints call." This is exactly the P9 "empirically-validated tool playbook" pattern — a grep that would over-match, paired with the manual filter that disambiguates. Excellent.
- **L1.3 external-system claim — well-handled.** "Verify all names against the installed FastEndpoints version — method names shifted between major versions (6→7, 7→8) and may shift again. Never trust memory." This is the correct way to encode a version-sensitive external API (P9) — dated, version-anchored, with a re-verification instruction.
- L1.5 scope fence present; relationship table to central-package-management
- L2.4 followable cold: the legacy→modern migration map table is concrete
- L3 N/A

## Verdict: **fix-then-accept** (rewrite-lite). The migration *content* is excellent — the two-stage detection with receiver-inspection and the version-verification discipline are standout (P9). Defects are the banner + named-project file:line examples (F1), resolved by the Step-3 genericization decision. Preserve the two-stage detection logic verbatim.
