# Summary — adhoc-SpecDrivenCoverValidate

**Slug:** adhoc-SpecDrivenCoverValidate
**Type:** Technical feature — full-build Increment 2 (graduates the APPROVED Inc-1 `adhoc-SpecDrivenHarnessBuild`)
**Branch:** main
**Date:** 2026-07-01
**Status:** **CODE TRACK COMPLETE + APPROVED** — live validation (Steps 4–6) **OPERATOR-OWED / OUTSTANDING.**
This is a partial close: the offline code track is reviewed, approved, and committed; the increment is **not**
fully done until the operator runs the live arms and the validation report (Step 6) lands.

## Outcome

Generalized the spec-driven Cover front-end off the single hardcoded `GeneratedSqlValidator` so `ruleOrder`,
the violation-identity, and — the load-bearing fix — the **pass-sentinel (`okValue`)** are per-target config
(ADR-E). Added the second target (`SlackSignatureVerifier`, enum return, `okValue:"Valid"`), an offline
inline-copy **sync guard**, and the tests proving the enum surface. The **live** validation (the two-SHA L272
reproduction + the Slack live run + the cross-class report) is wired as operator runbooks and remains
outstanding.

## Steps (6)

| Step | Deliverable | Disposition |
|------|-------------|-------------|
| 1 | Re-ground L272 fixture to committed SHAs (`9e40d1f`/`0811132`) | Implemented |
| 2 | Generalize `ruleOrder`+identity+`okValue`; sync guard; tests (TDD) | Implemented |
| 3 | `SlackSignatureVerifier` target config | Implemented |
| 4 | Live two-arm AC-6 run (SQL) | **Operator-owed** (runbook written) |
| 5 | Live run (Slack) | **Operator-owed** (runbook written) |
| 6 | Cross-class validation report + Inc-3 verdict | **Operator-owed** (blocked on 4–5) |

## Review

- **Step 1 done-check (architect, code-grounded):** PASS — no Missing; skill-conformance PASS (`nexus:tdd` in
  the log for Step 2). Offline ACs (AC-1/2/6) proven; live ACs (AC-3/4/5) flagged outstanding.
- **Step 2 code review (reviewer, code-grounded over the 7 changed files):** **APPROVED**, cycle 1 — 0
  CRITICAL/HIGH/MED, **1 LOW** (accepted, see below). Ran the tests + selfcheck directly: 36/36 unit tests,
  sync guard `[PASS]`, no `plugins/**` change.
- **Plan gate:** code-grounded critic REVISE (2 HIGH + 5 MED) folded before implementation.

## Accepted finding (no fix cycle — owner decision)

- **LOW — `slacksignatureverifier.json` has no `specTests` field.** The workflow default resolves the Slack
  test file to `GeneratedSqlValidatorSpecTests.cs` (SQL-specific). **Accepted as-is** (owner): the operator
  **must pass `specTests` in `_args`** for the Step-5 live run, e.g.
  `specTests: "…\\KnowledgeGateway.SpecHarness.Slack.Tests\\SlackSignatureVerifierSpecTests.cs"`. Latent only
  for the operator step; no offline impact.

## Open track (operator-owed — the increment is NOT fully done)

The live validation is outstanding. Runbooks are in `implementation.md`:
- **Step 4** — surgical per-file checkout of `9e40d1f` (pre-fix, arm-sanity `> 0.01`) then `0811132`
  (patched, `> 0.01 + 1e-9`); reproduce the L272 case-4 over-rejection live (`actual ===
  "NoStrayLiteralThreshold"`), patched-arm known-answer input green. Proves AC-3.
- **Step 5** — Slack live run **on config alone** (with the `specTests` override above). Proves AC-2/AC-4.
- **Step 6** — the cross-class validation report + the explicit Inc-3 readiness verdict. Proves AC-5.
On completion: extract **ADR-E** to the register; a follow-up commit lands Step 6 + the updated status.

## Process flags (recorded, not conformance fails)

- **Boundary-detector: 2 developer git-write violations** (`git stash`/`pop` on the **nexus** repo to isolate
  pre-existing failures — not a commit, not a KG write, reverted). `.claude/audit/violations.log` has them;
  the git-log author check is clean (no developer commit).
- **4 pre-existing test failures** (`nexus-cpp` CHANGELOG + 3 `gen-omni`) — confirmed not caused by this
  increment; carry-over for the learner/a separate pass.
- **Concurrent run moved HEAD** during this session (session start `4f2abec` → `084fe88`, the
  `adhoc-LearnerConsolidation` 1.18.7 release). Staging was scoped to this increment's files only; unrelated
  dirty paths (`docs/architecture/README.md`, `docs/ops/`, `docs/specs/adhoc-MvcCoverMinimize/`) left untouched.

## Files

**New:** `harness/targets/slacksignatureverifier.json`, `docs/specs/adhoc-SpecDrivenCoverValidate/**`
(plan, implementation, review, lessons, summary).
**Modified:** `harness/lib/spec-diff.mjs`, `harness/spec-cover.workflow.js`,
`harness/targets/generatedsqlvalidator-l272-fixture.json`, `scripts/selfcheck.mjs`,
`tests/unit/spec-diff.test.mjs`, `tests/unit/spec-cover-workflow.test.mjs`.

**No `plugins/**` change; no plugin version bump; no omni-twin sync** (dev-repo `harness/` machinery only).

## Commit

Code track committed to `main` (scoped to the increment's files). Live validation + Step-6 report land as a
follow-up commit.
