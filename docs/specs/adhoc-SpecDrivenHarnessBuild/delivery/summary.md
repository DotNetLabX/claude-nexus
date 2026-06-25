# Summary — adhoc-SpecDrivenHarnessBuild

**Slug:** adhoc-SpecDrivenHarnessBuild
**Type:** Technical feature — full-build Increment 1 (graduates the GO'd `adhoc-SpecDrivenCoverDiff` spike)
**Branch:** main
**Date:** 2026-06-25
**Status:** COMPLETE — reviewer APPROVED (cycle 1/3)

## Outcome

Automated the spec-driven Cover direction the spike proved half-manually: a runnable front-end that takes the
PO golden rules, locates each rule's code, generates mutation-gated tests via the **existing** Cover engine,
diffs spec-rules against code-rules on three axes, and deterministically labels false positives — proven on
one class (`GeneratedSqlValidator`) end-to-end through the *automated* path, including an **offline**
known-answer reproduction of the spike's L272 finding. No plugin bump (dev-repo machinery).

## Steps (7, all Implemented)

| Step | Deliverable | Disposition |
|------|-------------|-------------|
| 1 | target config + `loadSpecRules()` seam (all 12 GOLD ids, Q6) | Implemented |
| 2 | `locateRuleCode()` seam (attestation-first, guided-miner fallback) | Implemented |
| 3 | `spec-cover.workflow.js` (engine reuse + 2 reuse-boundary divergences) | Implemented |
| 4 | three-axis diff | Implemented |
| 5 | 5-case FP-labeler (case 4 = L272 shape) | Implemented |
| 6 | run report | Implemented (folded into workflow, `loop.workflow.js` precedent) |
| 7 | offline known-answer + `OPERATOR ACTION REQUIRED` runbook | Implemented (offline) + Deviated (live arm operator-owed) |

Plan order ran **2→4→5→3→6→7** (inline-after-define dependency; Deviation D1).

## Review

- **Step 1 done-check (architect):** PASS — no Missing; skill-conformance PASS.
- **Step 2 code review (reviewer, code-grounded over `harness/**`):** APPROVED, cycle 1/3. All four mandatory
  checkpoints verified vs live source + fresh test runs.
- **Independent verify gate:** PASS — 347/347 CI glob, selfcheck 4/4, no `plugins/**` change, no version bump
  (AC-7 hygiene clean).
- **Code-grounded critic gate:** satisfied at **spec** (Mode-1) + **plan** (Mode-2), both folded.

## Accepted non-blocking findings (no fix cycle — approved as-is)

- **MEDIUM** (carry-over, documented/intentional): `codeContainsRule` auto-assignment bypasses AC-2
  mis-anchor protection for wire-time miner results.
- **LOW ×2:** `cover-gates` formatting difference; `isRed` guard confirmation.

## Files

**New:** `harness/lib/spec-diff.mjs`, `harness/spec-cover.workflow.js`,
`harness/targets/generatedsqlvalidator.json`, `harness/targets/generatedsqlvalidator-l272-fixture.json`,
`tests/unit/spec-diff.test.mjs`, `tests/unit/spec-cover-workflow.test.mjs`.
**Modified:** `tests/unit/workflow-contract.test.mjs`, `delivery/plan.md` (Q6 Step-1 edit),
`delivery/questions.md` (Q6/Q7 Answered).

## Operator-owed next (plan-sanctioned, NOT a gap)

The live two-arm dotnet+Stryker AC-6 reproduction (pre-fix reds `NoStrayLiteralThreshold` vs patched green)
is operator-owed — exact `git stash`/restore runbook + per-arm assertions in implementation.md (Deviations
D3). Blocked for the developer by the no-git-writes boundary + KG's dirty-with-`+1e-9` tree (Q7=A).

## Named next increments (out of scope here)

Multi-class / domain sweep; embedding retrieval (D1); automated spec-source extraction (D4); automated input
rule-isolation; shipping as a `plugins/nexus/skills/` skill; coverage as a gate.

## Commits

1. `71d57d9` — `feat(adhoc-SpecDrivenHarnessBuild): add implementation plan`
2. `feat(adhoc-SpecDrivenHarnessBuild): implement spec-driven Cover front-end + spec-vs-code diff` (this commit)

## Lessons

`delivery/lessons.md` carries architect + developer + reviewer lessons. Processing is offered post-close
(optional).
