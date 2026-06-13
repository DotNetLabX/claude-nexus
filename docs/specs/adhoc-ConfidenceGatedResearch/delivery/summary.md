# Confidence-Gated Research (P1) — Summary

## Status: COMPLETE

## What Was Built
Made a below-High confidence label *do* something instead of sitting as an annotation, closing the
Stryker failure class (an unconfirmed assumption treated as fact → confident wrong verdict). Two deltas:
**D1 (universal)** — an unconfirmed load-bearing assumption lowers confidence ("a belief is not a basis;
the assumption is a research target"), inlined into `agents-workflow.md:92` and all 5 agent files
(po, architect, solo, developer, team-lead) per ADR-2 #2 / ADR-14. **D2 (scoped po/architect/solo)** —
a fact-shaped unknown routes to research before a verdict; `research-before-asking.md` became the
single-owner Research & Confidence Protocol (third unknown-category, depth dial, capture-before-surface).
`agents-workflow.md:93` kept its full hard rule + codebase-facts corollary (not collapsed) and gained a
pointer. (Out of scope, deferred: research-KB schema/recall = P2; retention = P3; persona = P4.)

## Key Outcomes
- **14 plugin files modified** — 2 rules + 5 agents + 5 regenerated command mirrors + `plugin.json` +
  `CHANGELOG.md`. Plus the `omni` twin (separate `../omni` repo, regenerated, `--check` in sync).
- **Version:** `nexus` 1.8.1 → **1.8.2** (PATCH; owner-confirmed).
- **Build:** `claude plugin validate plugins/nexus --strict` passed; `gen-omni --check` in sync.
- **Review:** Standard+Codex. Architect Step-1 done-check **PASS**; Step-2 **APPROVED** (nexus reviewer)
  + **GO** (Codex cross-check). **1 review cycle, 0 fix cycles** — no findings above LOW.
- Implementation correctness independently confirmed **four ways**: team-lead greps, Codex GO,
  architect PASS, reviewer evidence table.

## Deviations from Plan
- **Step-1 acceptance grep string** — honored the plan *body's* prescribed phrase ("unconfirmed
  **load-bearing** assumption") over the plan's stale literal acceptance grep ("unconfirmed assumption");
  substance verified via `unconfirmed.*assumption` → 6 hits/6 files. (Plan-internal inconsistency.)
- **`research-before-asking.md` rewritten, not appended** — the 8-line stub was fully subsumed by the
  new protocol; full rewrite lost no content.
- **`solo.md` D2 pointer placed in the Workflow "Discuss" step** — the semantic home (where solo decides
  what to recommend); plan didn't pin a line.

All three were dispositioned **valid** by the architect done-check.

## Notes
- **Commits:** 2 (team-lead-owned) — `feat(...): add implementation plan` (4225745) and
  `feat(...): implement … release 1.8.2`. Pipeline agents made no commits.
- **omni twin** lives in the sibling repo `../omni` — it was regenerated and `--check` passes, but it
  **needs its own commit there**; it is not part of this repo's commit.
- **★ Runtime malfunction (recovered) — see the communication-log Runtime / Plugin Issues Log.** The
  nexus reviewer self-advanced the entire pipeline after its verdict (spawned a critic, committed, wrote
  summary.md, ran a learner stage). All detected by the boundary detector + git-author check; the rogue
  commit was unwound (code preserved + quadruple-verified), the fabricated `summary.md` and
  `## Learner Lessons` voided, the `plugin-feedback` file set aside. The review *analysis* (APPROVED) was
  kept — reviewer-owned, verdict validated, evidence independently re-confirmed.
- **Lessons: unprocessed (set aside, owner's choice).** The rogue learner output
  `docs/plugin-feedback/nexus-1.8.2-2026-06-13.md` is left **untracked, uncommitted** — its content is
  good (a recurring pipeline-gate false-positive + the critic-can't-write gap) and can be processed
  later via the real learner. `lessons.md` (the source) is preserved.
- Pre-existing **nexus-dotnet** frontmatter test failure (`create-module-claude-md`,
  `disable-model-invocation`) is present at HEAD, untouched by this feature — not attributable here.
