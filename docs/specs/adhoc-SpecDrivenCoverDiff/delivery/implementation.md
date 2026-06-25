# Spec-driven Cover + diff (one-class spike) — Implementation

## Context

This is a **synthesis closeout**, not a fresh implementation run. A prior solo agent executed the
spike experiments (all experiment files) and flipped `.pipeline-state` to `done` prematurely. This
run synthesizes the two missing headline deliverables from existing evidence, backfills two
named-but-absent step artifacts, and closes the pipeline properly.

No new experiments were run. No KG source was modified. The plan is executed against the
**experiment-time evidence** (the `baseline-*`, `killdelta-*`, `specdriven-*` files produced by the prior
solo run) as instructed (A1): re-deriving against the now-fixed L272 would erase the headline finding.

**L272 live-source note (critical for the reader):** The headline candidate bug (FP boundary at
`GeneratedSqlValidator.cs:272`) was **FIXED in live KG source** after the experiments ran. The fix is
`> 0.01 + 1e-9` with a comment that echoes this spike's diagnosis verbatim. All deliverables report the
finding as-found (experiment time) and annotate the live-source status.

---

## Files Created

- `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/rule-code-map-generatedsqlvalidator.md` — Step 2 / AC-2: maps all 12 GOLD-01..12 rules to `file:line` in `GeneratedSqlValidator.cs`. Extracted from `golden-set.md` Code attestation column. 0 NO-CODE-FOUND items. GOLD-08/L272 carries the candidate-bug annotation.
- `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/rule-code-map-slacksignatureverifier.md` — Step 2 / AC-2: maps all 6 GOLD-13..18 rules to `file:line` in `SlackSignatureVerifier.cs`. 0 NO-CODE-FOUND items.
- `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/candidate-bugs-slacksignatureverifier.md` — Step 4 / AC-3: 0 candidate bugs; 23/23 spec-driven tests PASS. Documents the un-probed Divergence #6 gap (GOLD-15 raw/parsed base string) as a methodological lesson.
- `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/candidate-bugs-generatedsqlvalidator.md` — Step 4 / AC-3: 1 confirmed candidate bug (REAL-01 / L272 FP boundary, since fixed) + 4 triaged artifacts. Triage table: 2 rule-interaction FPs, 1 bad example table, 1 un-constructable profile.
- `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/diff-slacksignatureverifier.md` — Step 5 / AC-4: 3-axis diff. `spec ∧ ¬code` = 0 (harness closed all spec-identified gaps); `code ∧ ¬spec` = 2 minor (constructor null-guards); `both-divergent` = 1 (GOLD-15 base string, code-vs-intent, non-exploitable).
- `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/diff-generatedsqlvalidator.md` — Step 5 / AC-4: 3-axis diff. `spec ∧ ¬code` = 3 items (S1/L272 = confirmed bug, S2-S3 = first-pass survivor misses); `code ∧ ¬spec` = 4 known divergences; `both-divergent` = 1 (D1/L272 = convergent headline finding; since fixed).
- `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/spike-result.md` — Step 6 / AC-5: go/no-go writeup. All 5 ACs pass. **Recommendation: GO on the full build.** 1 candidate bug found (L272, since fixed). Three unknowns answered. Full-build conditions listed.
- `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/implementation.md` — this file (primary deliverable per ADR-17)

## Files Modified

- `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/questions.md` — Q1–Q3 marked Answered; architect's answers (relayed by coordinator) written to Answer blocks
- `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/lessons.md` — `## Developer Lessons` heading appended (lessons from Phase 1 analyze + synthesis closeout)

## Key Decisions

- **Experiment-time basis for all diffs.** Per A1: the diff and go/no-go are computed against
  `killdelta-*` / `specdriven-*` / `baseline-*` evidence, not re-run against the now-fixed live KG
  source. L272 is reported as-found with a FIXED annotation.
- **Backfilled rule-code-map-*.md and candidate-bugs-*.md as standalone files.** Per A2: the architect's
  done-check checks literally — missing named files = guaranteed bounce. Content extracted from existing
  `specdriven-*` / `baseline-*` files (no new analysis).
- **Candidate-bug count = 1.** The 4 SQL reds and the un-probed Slack divergence are not counted as
  candidate bugs after triage. Only the confirmed FP boundary (L272) counts, and it converges from both
  directions.
- **No-code-found = 0 on both classes.** All 18 golden rules have locatable code. The three golden-set
  divergences (Divergence #1, #2, #3) are code-vs-intent gaps, not missing features — the distinction
  is preserved in the rule-code-map files.
- **Rule-code-map method.** Manual per plan §64 ("Manual for the spike") — used the golden-set's Code
  attestation column as the primary source. No new file reads from the KG source were needed for the
  maps (the attestation column already carries `file:line`).

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Skill: None, TDD: no (plan §56) — step completed by prior solo run; not re-executed |
| 2 | None | Skill: None, TDD: no (plan §65) — manual mapping from golden-set.md attestation column |
| 3 | None | Skill: None, TDD: no (plan §73) — step completed by prior solo run; not re-executed |
| 4 | tdd — deviation: not re-run | TDD: yes (plan §80) — spec-driven test generation was executed in the prior solo run; this closeout extracted and formatted those results into `candidate-bugs-*.md`. The TDD red-green-refactor loop ran in the prior solo agent; re-running experiments is out of scope for the synthesis closeout (plan §33-39 and comm-log). |
| 5 | None | Skill: None, TDD: no (plan §89) — three-axis diff written from existing evidence |
| 6 | None | Skill: None, TDD: no (plan §97) — go/no-go writeup synthesized from all evidence |

## Self-Review (Mode-2 — plan §100-105)

**Review mode:** self-review against AC-1..AC-5 (two-way-door spike, low ceremony; AC-list is the gate;
no Step-2 reviewer per plan §105 and comm-log line 6).

| AC | Requirement | Evidence | Pass? |
|----|------------|----------|-------|
| AC-1 | Spec source exists, independent of implementation, isolation demonstrable | Golden rules in sequestered `D:\src\knowledge-gateway\docs\audit\golden-set.md` (outside KG `src/`); `targets/*.json` carries IDs only (verified); no mining agent was pointed at `docs/audit/` (sealed); miner's prompt = production source only. | **PASS** |
| AC-2 | Every spec rule mapped to `file:line` or `no-code-found` | `rule-code-map-slacksignatureverifier.md` (6 rules, 0 NO-CODE); `rule-code-map-generatedsqlvalidator.md` (12 rules, 0 NO-CODE). All 18 rules have locatable code. | **PASS** |
| AC-3 | Spec-driven Cover produces mutation-gated tests; reds captured as candidate bugs, not discarded | `specdriven-slacksignatureverifier.md` (23 tests, 0 reds); `specdriven-generatedsqlvalidator.md` (124 cases, 5 reds); `candidate-bugs-*.md` captures all reds with triage verdicts. No red was deleted. | **PASS** |
| AC-4 | Diff classifies every rule into exactly one axis; each `spec ∧ ¬code` item carries red test or code-missing note | `diff-slacksignatureverifier.md` + `diff-generatedsqlvalidator.md` — every golden rule classified into one axis. S1 (the `spec ∧ ¬code` headline item for SQL) carries the L272 red test reference. Slack's `spec ∧ ¬code` = 0 resolved items. | **PASS** |
| AC-5 | Go/no-go writeup answers each of the three unknowns and reports a candidate-bug count | `spike-result.md` — three unknowns answered (Unknown 1: VIABLE; Unknown 2: FEASIBLE for spike/UNPROVEN at scale; Unknown 3: USABLE signal). Candidate-bug count = 1. Recommendation: **GO.** | **PASS** |

**Self-review result: all 5 ACs pass. Recommendation: GO on the full build.**

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| L272 candidate bug is FIXED in live KG source | medium | architect | `GeneratedSqlValidator.cs:272` now `> 0.01 + 1e-9`; fix comment echoes spike's diagnosis verbatim | Spike reports as-found (experiment time); live-source status annotated in all deliverables. Fix confirms the finding was a true positive — this strengthens the GO. |
| Direction-2 un-probed Slack gap (GOLD-15) | low | architect | `specdriven-slacksignatureverifier.md §Honest caveats` — the spec author used canonical inputs; the raw/parsed-timestamp divergence was not probed | Production Direction-2 needs adversarial input probing per rule; this gap is a known limitation, not a method failure. |
| Rule-code-map files were absent before this closeout | low | architect | `rule-code-map-*.md` didn't exist; Step 2 Accept clause pointed at named files; prior solo run embedded the content in `specdriven-*.md` | Corrected by backfilling both files this run. No information loss — the content was already recorded. |

## Deviations from Plan

- **Step 4 (TDD) — no re-run of spec-driven tests.** Plan §80 marks this `TDD: yes`, meaning the `tdd` skill should govern the red-green-refactor loop. The prior solo run executed the loop; this closeout extracted the results. Re-running experiments is out of scope per plan §33-39 ("no new experiments") and comm-log context. Logged as a deviation with plan-sanction in `## Skills Used` Step 4 row.
- **Steps 1, 3 — not re-executed.** Both were completed in full by the prior solo run. This closeout resumes from Step 2 (backfill) per the idempotency check. No deviation from the plan's intent — steps are done; the pipeline resumes from the first incomplete step per developer protocol.

*Status: COMPLETE — developer, 2026-06-25*
