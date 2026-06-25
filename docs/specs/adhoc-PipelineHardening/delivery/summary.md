# Pipeline Hardening (gate re-instatement) — Summary

## Status: SUPERSEDED — did NOT ship

> This is a terminal **closure note**, not a completion. The feature's implementation was never committed
> and its design direction was abandoned. A `summary.md` is written here only to give the slug a terminal
> disposition so it stops surfacing as an in-flight/resumable run — **not** to claim it shipped.

## What Was Built
- An attempt to re-instate hook-level pipeline gating — the team-lead read-lane (**H0**) and a dev-repo
  markdown-source guard (**H2b**) in `pipeline-gate.js` — to block the analyze→implement two-phase collapse
  when the pipeline self-hosts on the nexus source repo. Code was written in-session (with a 25-case test
  suite) but **never committed**.

## Key Outcomes
- **Commits:** plan only — `755dd41` + `347df17` (`add implementation plan` / `part 2`). **No implementation
  commit exists.** Working tree is clean; the H0/H2b code described in `review.md` is **not in HEAD and not on
  disk** (`grep isDevRepoPluginSource|H2b|personas.json plugins/nexus/hooks/scripts/pipeline-gate.js` → absent).
- **Why superseded:** H0/H2b were originally a **1.2.0** addition that was **later dropped** (CHANGELOG
  ~lines 780–788). The hook-blocking approach cannot work as intended — a `PreToolUse`/gate **deny is not
  honored for a background subagent** (ADR-13) — so the architecture moved to a **detection layer**
  (boundary-detector → `.claude/audit/violations.log`, critic `disallowedTools`, salvage-transcript) instead
  of blocking. That detection design is what shipped and evolved through to the current 1.17.0 gate.
- **Run history:** the live run was **halted by the user mid-flight** over a team-lead protocol violation
  (read-discipline breach + mis-routed finding + a terse-return→re-prompt two-phase collapse). See the
  post-mortem in `communication-log.md`.

## Deviations from Plan
- The entire release tail (Step 10 — regenerate commands, MINOR bump, omni sync, commit) was **never run**.
- `review.md` carries a Step-1 PASS and a Step-2 APPROVED, but it reviewed **code that never landed in the
  repo**; that approval is therefore not a shippable verdict and is recorded here as void-for-closure.

## Notes
- Nothing to commit or revert — there is no orphaned code in the tree.
- The problem this feature targeted (analyze-collapse / prose↔enforcement divergence) was addressed by the
  later detection-layer work, not by this slug. If hook-level blocking is ever revisited, start from the
  ADR-13 constraint (background-subagent denies are dropped), which is the reason this approach was dropped.
- Useful residue: the team-lead protocol-violation post-mortem in `communication-log.md` and `lessons.md`
  (terse-return recovery, read-discipline enforcement) fed subsequent hardening.
