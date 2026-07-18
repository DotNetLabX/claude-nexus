# F7-MineMachineryBorrowWave2 — Questions

## Q1: S6 golden-set class — BugRatio or CycleTime?
**From:** architect
**To:** user
**Status:** Answered
**Step:** Phase 1 analysis (feeds S6 — recall golden set)

**Context:** The tech-spec explicitly reserves this pick to the owner ("owner picks; BugRatio or
CycleTime — both have adjudicated registries", tech-spec S6). Grounding done during analysis:
`harness/lib/recall-score.mjs` (recall-only, GOLD-NN table format, orchestrator-side LLM judge for
substance-match) is wired and tested; all existing pilot tooling — `cover.workflow.js` KB default
(`docs/kb/bug-ratio.md` in the host repo), `EXPECTED_SURVIVOR_LINES` in `cover-gates.mjs` — targets
BugRatio.

**Question:** Which proven class gets the one S6 golden set this wave: BugRatio or CycleTime?

**Recommendation:** BugRatio — and the deciding evidence changed under research: it is now **oracle
independence**, not wiring cost. Registry evidence (pilot host repo `D:\src\sprint-rituals`):
- **Registry trust is equal.** Both registries are mutation-gated at 100% reachable kill, floor 75,
  0 candidate bugs, one day apart (`docs/kb/bug-ratio.md` footer 2026-06-22, 37 confirmed rules;
  `docs/kb/cycle-time.md` footer 2026-06-21, 59 confirmed rules). Rule count favors CycleTime; that
  is outweighed by the next two points.
- **BugRatio has two golden-truth legs INDEPENDENT of the harness being measured:** (1) a FROZEN,
  user-confirmed (2026-06-11, pre-pipeline), sequestered golden set already exists at
  `docs/audit/golden-set.md` — 20 GOLD rows, 3 of them BugRatio (GOLD-16/17/18, the exact example
  ids in `recall-score.mjs`'s docstring), spec/KB-sourced; (2) the 2026-06-14 manual pilot (3
  independent clean-room miners + Codex refutation, ~22 converged behaviors) recorded in
  bug-ratio.md's Source section, plus the original `fokus-spec.md` §Bug Ratio.
- **CycleTime's only adjudicated truth is the automated harness's own output** (its Source cites
  only the analyzer; no manual pilot; Edge Cases "deferred, none recorded"; only 1 cross-cutting
  frozen-set row cites it). A golden set curated from it and scored against the same pipeline is
  **circular** — it measures run-to-run variance, not recall of true rules.
- Disclosed caveat (stands, manageable): the method was tuned on BugRatio, so recall on it reads as
  "recall on the development class" — the run report discloses this, and the S6 golden set should
  be curated primarily from the independent legs (frozen GOLD rows + manual-pilot rules + fokus
  spec), not from the harness-mined registry. The plan will encode this curation recipe.
**Confidence:** high — the circularity asymmetry is decisive on the spec's own terms (S6 is method
*evidence*; evidence needs an oracle independent of the thing measured), and the frozen-set +
scorer wiring for BugRatio is already proven end-to-end.
**Research offer:** consumed (2026-07-18) — both registries equally mutation-gated (37 vs 59
rules); BugRatio uniquely has pipeline-independent golden truth (frozen 20-row set with 3 BugRatio
rows + 2026-06-14 manual pilot), while CycleTime's only truth is the harness's own output
(circular oracle) — recommendation upgraded to BugRatio at high confidence.

### Answer
User (relayed by team lead, 2026-07-18, after the research round): **BugRatio.**
