# Kill-delta — GeneratedSqlValidator (harness vs existing suite) — the decisive class

**Date:** 2026-06-25
**Class:** `KnowledgeGateway.API/Features/TextToSql/GeneratedSqlValidator.cs` (519 lines, ~90 branches, complex)
**Question:** Does the harness beat a real, substantial human suite (51 tests / 808 lines) on a hard class?

## Result — YES, +35.44 pp raw; ~58% → ~97% of *killable* mutants

| Suite | Tests | Mutation score | Killed | NoCoverage | Survivors |
|-------|-------|----------------|--------|------------|-----------|
| **A — existing human suite** | 51 | **53.80%** | 85 | **38** | 73 |
| **B — harness clean-room suite** | ~125 (192 cases) | **89.24%** | 141 | **0** | 17 |

- The harness killed **56 more mutants** and **eliminated all 38 no-coverage paths** (code the 808-line human
  suite never executed).
- Clean-room: a single Sonnet agent authored the suite from production source only (blind to existing tests
  + golden set). Cost ~56k tokens. One compile-fix by operator: removed 5 tests of the `internal` `NormalizeSql`
  (unreachable from an external assembly without modifying KG prod) — public-surface coverage unchanged.

## Survivor triage (the honest read — raw % overstates due to equivalent mutants)

17 survivors, classified by reading source:

| Count | Kind | Lines | Verdict |
|-------|------|-------|---------|
| 8 | Bitwise on `RegexOptions.IgnoreCase \| Compiled` | L119–169 | **Equivalent/low-value** — `Compiled` is perf-only; `IgnoreCase` redundant (SQL normalized before match) |
| 2 | `break;` removal in a flag-set loop | L386, L435 | **Equivalent** — flag already true; extra iterations don't change result |
| 1 | carve-out table string | L89 | **Equivalent** — code comment: entry "cannot trigger Rule 6 in practice" (documented dead) |
| 2 | PreComputedStats carve-out strings | L82–83 | borderline (narrow carve-out) |
| 3 | large-table membership strings | L105–107 | **REAL, missed** — killable with exact per-table Rule-7 tests |
| 1 | epsilon boundary `Math.Abs(...) > 0.01` → `>=` | L272 | **REAL, missed** — the exact `== 0.01` case |

- **~11–12 of the 17 are equivalent/low-value** (RegexOptions flags, break-removal, documented-dead carve-out).
  Adjusted killable universe ≈ 146 → harness killed 141 ≈ **96.6%**; existing suite 85 ≈ **58%**.
- **~5 are real first-pass misses** (large-table membership + the epsilon boundary). The harness's
  survivor-feedback iteration (not run here — this was a single rules-only pass) is designed to target exactly these.

## So what — the decisive class confirms the simple-class signal

- On a hard, already-well-tested class the harness still **roughly doubled the killable-mutant kill rate** and
  **closed a 38-path coverage hole** the human suite missed — in one clean-room pass, blind to the existing tests.
- **The equivalent-mutant caveat is real and material**: the raw 89.24% must be read with triage, not at face value.
  This is the exact issue the design's "exclude equivalent/dead from the floor" rule and the research's 4–39%
  equivalent-rate finding predicted. A production harness needs an equivalent-mutant filter (the design has the seam).
- Re-runnable: `dotnet stryker --mutate "**/Features/TextToSql/GeneratedSqlValidator.cs"` from the SQL harness dir.

## Spike verdict (both classes)
| Class | Baseline A | Harness B | Real survivors left |
|-------|-----------|-----------|---------------------|
| SlackSignatureVerifier (simple) | 85.71% | **100%** | 0 |
| GeneratedSqlValidator (complex) | 53.80% | **89.24%** (~97% of killable) | ~5 (1 iteration away) |

**GO signal for the code-derived harness on KG:** it beat real human suites on both an easy and a hard class,
finding real gaps (boundaries, no-coverage paths) — with the documented caveat that mutation scores need
equivalent-mutant triage to be read honestly.
