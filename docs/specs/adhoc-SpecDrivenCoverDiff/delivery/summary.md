# Summary — adhoc-SpecDrivenCoverDiff

**Type:** Spike (two-way-door) — spec-driven Cover + spec-vs-code diff, one-class on KG
**Outcome:** **GO** on the full build. All 5 ACs PASS (architect Step-1 done-check, 0 fix cycles).
**Branch:** adhoc-MineVerifyCoverHarness · **Date:** 2026-06-25

## The three unknowns — resolved

1. **Usable spec source on KG** — VIABLE. The PO golden rules (GOLD-01..18) double as the spec source;
   text sequestered in `golden-set.md` outside KG `src/`; isolation demonstrable, not asserted.
2. **rule→code location** — FEASIBLE for the spike (manual; 18/18 rules mapped, 0 no-code-found);
   UNPROVEN at scale — retrieval is the open risk and the load-bearing new piece.
3. **Diff signal-to-noise** — USABLE for triage, but the triage burden is real (4/5 SQL reds were
   test/harness artifacts, exactly as the research warned).

## Headline

Both directions independently converged on `GeneratedSqlValidator.cs:272` — Direction 1 (code-derived
mutation) left a surviving `>`→`>=` mutant; Direction 2 (spec-derived) produced a red (FP boundary
rejects a spec-valid value). The proposal's cross-check thesis, demonstrated live. The bug was a **true
positive** — since **FIXED in live KG** (`> 0.01 + 1e-9`, fix comment echoes the spike's diagnosis).

## Results

- **Candidate-bug count:** 1 (L272 FP boundary; since fixed in live KG).
- **Kill-delta (Direction 1, code-derived):** Slack 85.71%→100%; SQL 53.80%→89.24% (~97% of killable).
  The harness beat the real human suites on both an easy and a hard already-tested class.
- **Direction 2 (spec-derived):** Slack 0 divergences (correct, careful crypto class); SQL 5 reds →
  1 real + 4 triaged artifacts (rule-precedence interactions, a bad example table, an un-constructable profile).

## Deliverables

- `definition/spec.md`, `delivery/plan.md`
- Experiments: `baseline-*`, `killdelta-*`, `specdriven-*` (both classes)
- Synthesis: `rule-code-map-*` (Step 2 / AC-2), `candidate-bugs-*` (Step 4 / AC-3), `diff-*` (Step 5 / AC-4),
  `spike-result.md` (Step 6 / AC-5)
- Pipeline: `implementation.md` (+ `## Self-Review` vs AC-1..5), `review.md` (`## Step 1` done-check PASS),
  `lessons.md`, `communication-log.md`

## Build recommendation (from `spike-result.md`)

**GO.** Extract ADR-A..D at the build. Three full-build conditions: retrieval-based rule→code at scale, a
false-positive / rule-isolation filter, spec-source extraction beyond the PO golden rules. The
**code-grounded critic becomes mandatory at the full-build plan** (shared change to `harness/**`) — the
spike's self-review does not carry forward.

## Pipeline

- **Team mode:** standard (lean — synthesis closeout; no Step-2 reviewer per the spike's low-ceremony gate).
- **Review:** self-review (Mode 2 vs AC list) + architect Step-1 done-check (the gate) = **PASS**, 0 cycles.
- **Enforcement:** 0 boundary violations this run; no rogue commits; verify gate N/A (docs-only synthesis).
- **Runtime note:** the prior solo run flipped `.pipeline-state=done` while the go/no-go deliverable was
  unwritten — premature; corrected and completed by this team-lead run.
