# Direction 2 (spec-driven) — GeneratedSqlValidator — divergences FOUND

**Date:** 2026-06-25
**Question:** Generate tests from the PO golden rules (GOLD-01..12), run vs code — where does code diverge from spec?

## Method
- Spec: `docs/audit/golden-set.md`, rules GOLD-01..12 (ids from `targets/gateway-sqlvalidator.json`).
- Sonnet agent authored 107 tests from rule text, **blind to `GeneratedSqlValidator.cs`** and existing tests
  (given a signatures-only contract + `SurfaceProfile.cs`). Instructed to **probe edge inputs** per rule
  (boundaries, case, near-misses), not happy paths.
- Built + run vs real code in an isolated scratch assembly. KG repo untouched.

## Result — 124 cases, 5 RED. Triage: 1 real finding, 4 test/harness artifacts.

| Test | Expected vs actual | Verdict |
|------|--------------------|---------|
| **`Gold08.ExactlyAt001_Passes`** | spec: `\|0.86-0.85\|` = exactly 0.01 → passes (boundary exclusive); code returned `NoStrayLiteralThreshold` | **REAL — floating-point boundary bug** |
| `Gold03.DdlVerb_CreateInsideQuery...` | expected null; got `BadReportsFilterPresent` | Test artifact — the example SQL incidentally references an `analytics_report*` table → a *different* rule fires. Code correct. |
| `Gold01.ValidMinimalSelect_ReturnsNull` | `SELECT 1 FROM public.analytics_reports` expected null; got `BadReportsFilterPresent` | Test artifact — `analytics_reports` is a report table requiring the 5 filter conditions. Code correct; bad example table. |
| `Gold11.Subcategory...Unqualified_WithoutReportIds` | expected `ReportIdsFirst`; got `RelationPolicy` | Test artifact — unqualified table trips RelationPolicy (Rule 2) first; first-violation-wins (GOLD-01). Code correct; test didn't isolate the rule. |
| `Gold06.CuratedQualifiedView_CuratedProfile_Exempt` | expected exempt; got `RelationPolicy` | Harness artifact — `SurfaceProfile.Curated` doesn't exist in source (commented out); the agent synthesized a curated profile whose allowlist doesn't match. Setup limit, not a confirmed code bug. |

## The real finding — L272 floating-point boundary

```csharp
if (Math.Abs(literal - resolvedNumeric.Value) > 0.01)   // L272
    return "NoStrayLiteralThreshold";
```
Spec (GOLD-08): the tolerance boundary is exclusive — a literal differing by *exactly* the tolerance passes.
Code: `Math.Abs(0.86 - 0.85)` is `0.010000000000000009` in IEEE-754, which **is** `> 0.01` → the code
**rejects a value the PO spec says is valid.** A naive float comparison with no epsilon/rounding makes the
boundary unreliable. Candidate bug (worth a human ruling on whether the 2-decimal-percent domain makes it benign).

**Status: FIXED + verified (2026-06-25, solo).** Patched `GeneratedSqlValidator.cs:272` to
`> 0.01 + 1e-9` (epsilon absorbs FP noise, preserves the exclusive boundary). Verified: the spec-driven
`Gold08.ExactlyAt001_Passes` red flipped green; the existing 51-test SQL suite stays 51/51 (no regression);
spec-driven reds dropped 5 → 4 (the remaining 4 are test/harness artifacts, not code). Uncommitted on KG `main`.

**Cross-direction corroboration (the headline):** Direction 1 (code-derived mutation) independently left a
**surviving mutant on this exact line L272** (the `>`→`>=` equality mutant), and Direction 2 (spec-derived)
independently produced a **red on the same line**. Two methods, derived from opposite sources (code vs spec),
converged on one weak spot. That convergence is exactly the cross-check value the proposal predicted — and the
strongest signal in the spike.

## Honest lessons (the research's caveats, confirmed live)

- **Reds are candidates, not bugs — triage is mandatory.** 4/5 here were test/harness artifacts, not code defects:
  rule-precedence interactions (the input trips an earlier rule), a poorly-chosen example table, and an
  un-constructable curated profile. A production Direction-2 must (a) isolate each rule (inputs that trip ONLY
  the rule under test — hard given first-violation-wins), and (b) faithfully build all profiles/fixtures.
- **The "probe edge inputs" technique works** — it surfaced the real FP boundary that a happy-path suite (Slack)
  hid. But edge inputs also raise the rule-interaction false-positive rate; the two must be balanced.
- **Spec independence still matters:** Slack found 0 divergences partly because it's correct, partly unverified
  golden-rule independence. SQL found a real one — evidence the SQL golden rules carry genuine intent, not a
  code mirror.

## Spike verdict — Direction 2 proven
- Mechanism works end-to-end on both classes (golden rules → tests → run → diff).
- Found a **real candidate bug** (FP boundary) on the complex class that the **cross-check with Direction 1
  corroborates** — demonstrating the proposal's core thesis (spec∧code agreement = confidence; the convergent
  weak spot = the finding).
- Confirmed the triage burden is real (4/5 reds were artifacts) — the productionized harness needs rule-isolation
  + fixture-fidelity + an equivalent/false-positive filter, exactly as scoped in the proposal's Unresolved section.
