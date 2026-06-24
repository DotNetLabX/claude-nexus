# Baseline A — SlackSignatureVerifier (existing suite mutation score)

**Date:** 2026-06-24
**Class:** `KnowledgeGateway.API/Features/Slack/SlackSignatureVerifier.cs` (111 lines, simple)
**Suite under test:** the existing `KnowledgeGateway.Tests/Slack/SlackSignatureVerifierTests.cs` (9 tests)
**Tool:** Stryker.NET 4.15.0 (global install — no KG repo change), scoped `--mutate` to the one file.
**Isolation:** ran via an isolated scratch test project (`scratchpad/kg-stryker/SlackBaseline.Tests.csproj`)
that links ONLY the Slack test file + references `KnowledgeGateway.API` — so Stryker's initial run
executes only the 9 Slack unit tests, not the 14 Testcontainers/Postgres integration suites. KG repo untouched.

## Result

**Baseline A = 85.71% mutation score** (18 killed of 21 reachable; Timeout counted as killed).

| Status | Count |
|--------|-------|
| Killed | 17 |
| Timeout (→ killed) | 1 |
| Survived | 3 |
| CompileError (excluded from score) | 2 |
| Ignored (other files, `--mutate` scope) | 88 |

## Survivors (the gap the harness must close to beat baseline)

| Line | Mutator | Survivor | Reading |
|------|---------|----------|---------|
| L37 | Statement removal | `ArgumentNullException.ThrowIfNull(options)` → removed | no test asserts null `options` throws |
| L38 | Statement removal | `ArgumentNullException.ThrowIfNull(time)` → removed | no test asserts null `time` throws |
| L67 | Equality | `Math.Abs(nowSeconds - timestampSeconds) > tolerance` → `>=` | **boundary** — exactly-at-tolerance case untested (the discontinuity) |

## Toolchain findings (friction surfaced cheaply, before any token spend)

- Stryker 4.15 has **no test-case filter** — test selection is coverage-based, so its *initial* run executes
  the whole test project. KG's test project mixes 14 infra-bound integration suites with unit tests →
  the isolated mini-assembly was required (and is exactly the "isolated assembly" the harness output needs).
- KG uses the new `.slnx` solution format; the project+test-project auto-detect path was used instead.
- A **running KG API process** locked `KnowledgeGateway.API.exe` and blocked the mutated rebuild — operator
  stopped the app, then the run completed (~55s).

## So what

- **Go signal for the simple class:** toolchain proven end-to-end on KG; baseline is 85.71%, not 100% —
  there is a real, meaningful gap (2 null-guards + 1 boundary) for the harness to attempt.
- **Next (expensive) step:** run the code-derived harness (Sonnet) on this class into a *separate* isolated
  assembly; kill-delta = (harness kills the 3 survivors?) → up to 100% vs the human suite's 85.71%.
- Re-runnable: `dotnet stryker --mutate "**/Features/Slack/SlackSignatureVerifier.cs"` from the mini project dir.
