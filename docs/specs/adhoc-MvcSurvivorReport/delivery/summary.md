# Summary — adhoc-MvcSurvivorReport

**Status:** Complete · **Branch:** adhoc-FlutterSonnetDefault · **Team mode:** Standard+Codex · **Closed:** 2026-06-26

## What this delivered

Structured survivor classification in the Mine→Verify→Cover **Report stage**, plus a Dart/Flutter reference harness that demonstrates the corrected mutation-scoring contract (the reference half of the anti-fake-green hardening whose shipped-prose fix landed earlier as solo `1525cba`, nexus 1.18.5).

| Step | Change | Shipped file |
|------|--------|--------------|
| 1 | Stack-neutral Report-stage spec: 5-tag taxonomy + per-tag assignment owner, REAL-gap-only-iterates, implied cleanups, `expectedSurvivorLines` suggestion (additive to the 1.18.5 invariant) | `plugins/nexus/skills/mine-verify-cover/SKILL.md` (nexus **1.18.5 → 1.18.6**) |
| 2 | Dart cues mapped to the taxonomy; `equivalent-logging` marked the only orchestrator-pre-taggable tag + its `equivalentLoggingLines` signal | `plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md` (nexus-flutter **0.1.1 → 0.1.2**) |
| 3 | Summary-based mutation scoring (`killed = reachable − survivors`, from the stdout summary, not array-counting) + survivor-count cross-check with an early-`break` HALT; Dart-divergence header note | `harness/cover-flutter.workflow.js` |
| 4 | Pure orchestrator pre-tag (`equivalentLoggingLines`) + tag-seam; source-aware `classify-survivors` agent (Q2-gated) that the orchestrator only records; tagged report + implied cleanups | `harness/cover-flutter.workflow.js`, `harness/loop-flutter.workflow.js` |
| 5 | Contract tests — 9e rewritten to the survivors-only + `mutationSummary` contract; new slices for scoring, exclusion, fixtures, HALT, pre-tagger, classify path, and the fix-cycle regressions | `tests/unit/workflow-contract.test.mjs` |

## Review outcome

- **Plan:** picked up rev 2 (critic NO-GO on rev 1 folded by the architect); proceeded without a re-review per the owner's launch decision.
- **Step 1 done-check:** PASS (5/5 conform; the one deviation — slice 9f left unchanged — adjudicated acceptable, not Missing; 0 new test failures vs baseline).
- **Step 2 (Standard+Codex):** reviewer APPROVED, **Codex NO-GO** — a true verdict conflict. The architect adjudicated REQUEST CHANGES: Codex caught **two real HIGH defects the single-pass reviewer blessed** —
  - **F1** pre-tagged `equivalent-logging` survivors were re-fed into the next Cover iteration (chasing unkillable equivalents). Fix: filter the re-feed only; denominator intentionally unchanged (two-tier `equivalentLoggingLines`-suggestion vs `expectedSurvivorLines`-confirmed design).
  - **F2** classify verdicts keyed by source `line` collided when two survivors shared a line. Fix: per-survivor `index` keying.
  - F3 (test seam) and F4 (`reason` required + explicit `unclassified`) also fixed; SKILL.md:68 wording reconciled.
- **Fix-cycle 1/3 → reviewer re-review: APPROVED.** Scoped gate `workflow-contract.test.mjs` **43/43 green**; `node --check` clean.

## Files & versions

- **Shipped plugin:** `mine-verify-cover/SKILL.md` (nexus → **1.18.6**), `mine-verify-cover-flutter/SKILL.md` (nexus-flutter → **0.1.2**) + the two plugin.json/CHANGELOG bumps. A single bump per plugin covers the whole feature (the SKILL.md:68 fix-cycle edit rode within the uncommitted 1.18.6 — no phantom 1.18.7).
- **Dev harness (not shipped):** `harness/cover-flutter.workflow.js`, `harness/loop-flutter.workflow.js`, `tests/unit/workflow-contract.test.mjs`.

## Commits

1. `360fd4a feat(adhoc-MvcSurvivorReport): add implementation plan`
2. `feat(adhoc-MvcSurvivorReport): implement structured survivor classification + corrected Dart scoring` (this close)

## Outstanding (cross-repo)

- **Omni twin out of sync — deferred to merge** (deliberate, per plan). After the branch is final, run `node scripts/gen-omni.mjs` and commit in the `../omni` repo with the mirrored-commit convention (subject mirrors the nexus subject; footer pins this feature's nexus sha). Not done at close because a PR review/merge may add commits the twin's footer must pin.

## Carry-overs (out of scope, pre-existing)

- 4 pre-existing full-suite failures (gen-omni ×3, nexus-cpp ×1) — not introduced here; F7. The session verify-gate's blocking `fail` was entirely this set (proven: identical fail at the pre-code analyze phase).

## Lessons

Recorded in `lessons.md` (developer/architect/reviewer). Notable: an independent Codex cross-check caught two HIGH correctness bugs the focused single-pass reviewer approved — concrete evidence for Standard+Codex on interacting-computation-path features. **Processing status: unprocessed — user deferred the learner at closure** (run it later scoped to this slug's lessons.md).

## Closure state

- **Commit:** local only (`936b054`) — user chose not to push. Branch `adhoc-FlutterSonnetDefault` carries this feature plus 3 prior adhoc commits.
- **PR tail:** not run (no push).
- **Omni twin:** deferred to merge (regen + mirrored `../omni` commit after the branch is final).
