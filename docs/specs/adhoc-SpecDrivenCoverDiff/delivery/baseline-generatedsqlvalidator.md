# Baseline A — GeneratedSqlValidator (existing suite mutation score)

**Date:** 2026-06-25
**Class:** `KnowledgeGateway.API/Features/TextToSql/GeneratedSqlValidator.cs` (519 lines, ~90 branches, complex; `static class`)
**Suite under test:** existing `KnowledgeGateway.Tests/TextToSql/GeneratedSqlValidatorTests.cs` (51 tests, 808 lines)
**Tool:** Stryker.NET 4.15.0, `--mutate` scoped to the one file; isolated scratch assembly (test file self-contained: FluentAssertions + Xunit + API namespace only). KG repo untouched.

## Result — Baseline A = 53.80%

| Status | Count |
|--------|-------|
| Killed | 85 |
| Survived | 35 |
| NoCoverage | 38 |
| Ignored (other files) | 23 |
| CompileError (excluded) | 2 |

Reachable = 158; killed = 85 → **53.80%**. **73 survivors** (35 covered-but-unasserted + 38 never-executed).

## Survivor shape — READ WITH CARE (equivalent-mutant caveat)

Much of the 73 is **String** and **Bitwise** mutation noise, not necessarily real gaps:
- **String mutations** L65–72, L82–89, L105–159, L312–320 — mutated regex patterns, rule-name constants,
  and remediation/error-message literals. Mutating a *remediation message* does not change validation
  behavior → no test can kill it, but it is arguably an **equivalent / low-value** mutant, not a real bug-risk.
- **Bitwise mutations** L98–176 — `RegexOptions` flag combinations (`A | B`). Often behavior-equivalent.
- **The real logic survivors** are the few **Equality / Negate** mutants (L272, L294, L297) + the **38
  no-coverage paths** (code the existing suite never runs).

So the raw `53.80% → X` kill-delta will be **inflated** by equivalent string/flag mutants. The honest signal
is: does the harness (a) cover the 38 dead paths and (b) kill the *logic* survivors — not the message-string ones.

## So what / next

- The existing complex-class suite genuinely under-tests the logic (38 no-coverage paths is a real gap),
  so there is real room — but the headline number needs equivalent-mutant triage to be meaningful.
- **Next (bigger spend):** run the harness clean-room suite on this class (519 lines → more generation
  tokens than the simple class's 38k, still far below the ~1.9M full-loop figure), then compare — and
  classify survivors real-vs-equivalent rather than trusting the raw %.
- Re-runnable: `dotnet stryker --mutate "**/Features/TextToSql/GeneratedSqlValidator.cs"` from the SQL baseline dir.
