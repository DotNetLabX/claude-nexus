# adhoc-ResearchKB — Communication Log

**Branch:** main
**Step:** done
**Cycle:** 1/3 (resolved at cycle 1 — APPROVED after one fix round)
**Team Mode:** standard+codex
**Review Mode:** critic (plan already reviewed pre-run — REVISE, 6 findings folded in); Step-2 = reviewer + Codex in parallel (round 1)
**Architect ID:** acba0386a566228cd (Step-1 done-check, frontmatter model, background)
**Developer ID:** Phase-1 a81c2402e4788e332 (analyze, idle); Phase-2 aa62238966df851c9 (implement, opus, idle); Round-1-fixes afc77683dbbb40588 (opus, ACTIVE) — each fresh-spawned on opus because developer.md frontmatter=sonnet would not preserve the opus config across a SendMessage resume
**Reviewer ID:** aba526bd63875515a (Step-2 review, frontmatter model, background)
**Codex ID:** a720158fde8a89676 (Step-2 cross-check → review-codex.md, background)
**Plan Steps Completed / Remaining:** [1,2,3,4,5,6,7,8] / []
**Questions Resolved:** Q1 (self-contained), Q2 (revised → inline-skill + forked-execution), R1–R6 — all resolved pre-plan
**Model overrides:** developer=opus (nexus-agents.json); critic=opus; solo=opus

## Launch context

- Existing critic-reviewed plan → entry point = Developer (architect on standby). PO skipped (spec already defined via proposal + questions).
- Pre-flight: committed an in-flight 1.9.2 release first (user-approved) to clear a version collision with the Step-8 MINOR bump; then committed the ResearchKB plan (commit 1 of the 2-commit default). ResearchKB MINOR bump will go 1.9.2 → 1.10.0.

## Messages

| # | From → To | Phase | Message | Problem |
|---|-----------|-------|---------|---------|
| 1 | TL → developer | developer:analyze | `Analyze adhoc-ResearchKB.` (Phase 1, background, opus) | — |
| 2 | developer → TL | developer:analyze | Phase-1 complete: 0 blocking questions, all deps verified present, fresh build. Stopped at boundary (no source written). | — |
| 3 | TL → developer | developer:implement | Re-spawned FRESH on opus (not SendMessage resume — would fall back to sonnet frontmatter). `Implement adhoc-ResearchKB.` + context handoff. | Model caveat: spawn-param opus doesn't survive resume |
| 4 | developer → TL | developer:implement | Phase-2 complete: all 8 steps, 156/156 tests, MINOR bump 1.9.3→1.10.0 (file edits only, no commit). 2 documented deviations. | — |
| 5 | TL → architect | architect:donecheck | `Step 1 done check for adhoc-ResearchKB.` (single dispatch, background) | — |
| 6 | architect → TL | architect:donecheck | Done-check PASS: 7 Implemented, 1 Deviated-valid, 0 Missing; both deviations independently verified; skill conformance clean. | — |
| 7 | TL → reviewer + Codex | reviewer:review | Step-2 dispatched in parallel (Standard+Codex round 1): reviewer → review.md ## Step 2; Codex → review-codex.md. Independent, no cross-feeding. | — |
| 8 | Codex → TL | reviewer:review | NO-GO. 2 BLOCKERs in cite-check.mjs (prose claim lines skipped; corroboration counted file-globally not per-block) + 1 MAJOR test-coverage gap. Written to review-codex.md. Holding for reviewer before merge. | — |
| 9 | reviewer → TL | reviewer:review | APPROVED (no CRIT/HIGH); MEDIUM = Fix/Alternatives test gap; LOW = file-global source Map + first-only Corroboration check. 156/0 green. Written to review.md ## Step 2. | — |
| 10 | TL → developer | developer:implement | Reconciled finding-by-finding → merged verdict REQUEST CHANGES (Codex BLOCKERs block; reviewer LOW = same root cause as Codex BLOCKER #2). Consolidated fix-list dispatched to FRESH opus dev. Cycle 1/3. | Split verdict reviewer APPROVED vs Codex NO-GO — resolved per Standard+Codex (Codex HIGH/CRIT block) |
| 11 | developer → TL | developer:implement | Round-1 fixes done: per-block rewrite of cite-check.mjs (split on `## {Question}`), prose-claim now fails, tests 7→19, suite 168/0. Proved bug #2 real via crafted fixture. No commit. | — |
| 12 | TL → reviewer | reviewer:review | Resume (SendMessage, keeps context). `Re-review after fixes. Cycle 1/3.` + explicit pointer to the 2 Codex-origin fixes it didn't originally raise. | — |
| 13 | reviewer → TL | reviewer:review | APPROVED. All 4 items verified resolved (both reviewer findings + both Codex BLOCKERs); per-block boundary logic + prose edge cases re-verified; 168/0. | — |
| 14 | TL (close) | done | Final gate green (168/0, skill-lint OK, cite-check exit 0). summary.md written. Scoped implementation commit (commit 2/2) — feature surface + docs + kb artifact only; external f51f1f3 + unrelated dirty files excluded. | — |

## Runtime / Plugin Issues Log

- **One-time full-tree staging (resolved, non-recurring).** Between read-only git calls at pre-flight the entire working tree got staged once. No nexus hook stages files (verified: git appears only in boundary-detector/guard/audit-logger, none run `git add`). `git reset` unstaged it and it stayed unstaged. Cause unidentified (suspected external one-shot or prior-session residue); not reproduced. Commits since are scoped and verified.
- **`.current-agent` rewritten team-lead → architect (benign).** Nexus persona machinery (register-persona.js / restore-agent.js, plus a likely lingering background agent from the prior learner session). `.current-agent` is only a write-trigger marker; the gate keys off `.pipeline-state` (TL-owned). Harness flagged the change as intentional; not reverted.
- **Background untracked file creation (benign).** `plugins/nexus/statusline/`, `plugins/nexus/settings.json`, `tests/unit/subagent-rows.test.mjs` appeared mid-session — external tool (statusbar daemon / OMC residue), all untracked, none staged into any commit. TaskList empty → no concurrent pipeline agent.
- **Stray `.omc/` state dirs deleted (user-approved).** `docs/specs/adhoc-MineVerifyCoverHarness/.omc/` and `plugins/nexus/agents/.omc/` — OMC runtime state left behind after OMC was uninstalled.
- **CONCURRENT external commit on `main` mid-pipeline (f51f1f3, NOT unwound).** `feat(nexus): subagentStatusLine rows for pipeline roles` landed at 17:48 today, on top of the plan commit, bumping 1.9.2→1.9.3 (statusline/subagent-rows.js, settings.json, subagent-rows.test.mjs). Confirmed NOT a pipeline-subagent breach: violations.log has zero entries today (boundary-detector would log a subagent git write), content is unrelated to ResearchKB, developer reported no commit. Treated as legitimate external/parallel work → scoped around, not unwound (never unwind a commit the TL didn't create without user say-so). Effect: developer's MINOR bump correctly went 1.9.3→1.10.0; my uncommitted CHANGELOG delta is only the 1.10.0 entry. **Risk to watch:** if the external process bumps/commits again during review, re-verify the tree before the final implementation commit. Flagged to user.
