# Kill-delta — SlackSignatureVerifier (harness vs existing suite)

**Date:** 2026-06-25
**Class:** `KnowledgeGateway.API/Features/Slack/SlackSignatureVerifier.cs` (111 lines, simple)
**Question:** Does the harness generate tests that kill mutants the existing human suite leaves alive?

## Result — YES, +14.29 pp; all 3 survivors killed

| Suite | Tests | Mutation score | Survivors (of 21 reachable) |
|-------|-------|----------------|------------------------------|
| **A — existing human suite** | 9 | **85.71%** | 3 (L37 null-options guard, L38 null-time guard, **L67 boundary `>`→`>=`**) |
| **B — harness clean-room suite** | 54 (71 cases) | **100.00%** | 0 — all 21 killed |

The harness killed **every** mutant the human suite missed — the two constructor null-guards *and* the
L67 timestamp-tolerance boundary (the off-by-one discontinuity), which it hit via an explicit boundary
sweep (−301/−300/−299, +299/+300/+301).

## How it was run (honest method)

- **Clean-room:** a single Sonnet agent authored the suite from the **production source only**
  (`SlackSignatureVerifier.cs` + `SlackOptions.cs`) — verifiably **blind to the existing tests and the
  golden set** (prompt-sealed; it never read any `*Test*.cs` / `KnowledgeGateway.Tests` / `docs/audit/`).
- **Apples-to-apples:** both suites scored by the same Stryker run, same `--mutate` scope, same 21
  reachable mutants on the same file. Isolated scratch assemblies; KG repo untouched.
- **Spike simplification:** Mine + Cover folded into one clean-room agent; the independent Codex **Verify**
  step was skipped (not needed to measure kill-delta). One pass, rules-only — hit 100% first try, so no
  survivor-feedback iteration was required.
- **Model:** Sonnet (owner directive). Cost: ~38k tokens for generation + two local Stryker runs (~55–60s each).

## Caveats (do not over-read)

- **One simple class.** `GeneratedSqlValidator` (519 lines, 90 branches, 808-line existing suite) is the
  real test — a guard-dense crypto verifier is the harness's easy case. The complex class could go either way.
- **The harness suite is larger** (54 vs 9 tests) — this is "more thorough," not "fewer-but-better." The
  human suite was deliberately minimal. The metric that matters is kill, not count — but note the asymmetry.
- Stryker's run logged many `CompileError` mutants in *other* API files (safe-mode); those are outside the
  `--mutate` scope and not in the SlackSignatureVerifier score (21 reachable, unchanged from baseline A).

## So what

- **Strong go signal on the simple class:** the harness beat a real human suite on a real already-tested KG
  class, closing a meaningful gap (boundary + guards) — the exact failure modes mutation testing exists to find.
- **Next:** repeat on `GeneratedSqlValidator` (the complex class) — baseline its 808-line suite, then run the
  harness. That result is the one that decides whether this generalizes beyond the easy case.
