# Skill Evaluation — error-handling

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `error-handling/SKILL.md` (98 lines; monolithic; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` — `Blocks.Exceptions/`, `Blocks.AspNetCore/Middlewares/` pattern.
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** B.

## Layer 0 — Lint
PASS.

## Rubric items checked clean
- L1.1 frontmatter = body (exception hierarchy + guard utilities + global error middleware — all present)
- **Genericization — CLEAN.** Generic placeholders (`{Context}Exception`); shared `Blocks.Exceptions`/`Blocks.Domain` types; zero named-project leakage. Positive exemplar.
- **L2.4 followable cold — strong.** The exception hierarchy is drawn as an ASCII tree; the "Usage Rules" table (exception × when × where) is concrete; the middleware `MapStatusCode` type-switch is enumerated with exact status codes (incl. the 499 client-disconnect and the no-generic-`HttpException`-case note).
- **L1.6 — good.** "each subclass is matched individually — there is no generic `HttpException` case" encodes a real gotcha (adding a subclass requires adding a switch arm).
- **L2.1 — good.** "Extension Points" lists ConflictException/ForbiddenException as *future* extensions following the same pattern — guidance without premature implementation (correct restraint, not AP4).
- L3 N/A

## Minor note (not a finding)
No `## What this skill does NOT do` fence. Adjacents are weak (it's a foundational reference); low priority. `user-invocable: true` set (Batch-B-consistent).

## Verdict: **ACCEPT.** Clean, genericized, followable-cold error-handling reference. The status-code mapping table and the individually-matched-subclass note make it precise and grounded. No fix required.
