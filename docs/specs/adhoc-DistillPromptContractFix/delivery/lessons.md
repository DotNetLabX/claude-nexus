# Distill-Prompt Contract Fix — Lessons

## Developer Lessons
- **Phase 1 analysis (2026-06-20):** plan is fully code-grounded — every referenced file, script,
  ADR, and test floor verified against live source on first read; zero blocking questions. Notably
  clean for an ad-hoc pass.
- **Step-5 selfcheck has expected pre-existing drift (not a defect to chase).** `selfcheck.mjs`'s
  `gen-commands drift`, `gen-omni --check`, and `bump-plugin --check` checks are git-diff/git-HEAD
  based, so the uncommitted 19-file plugin sweep in the working tree will surface them as FAIL. Per
  the coordination note + MEMORY (`gen-commands selfcheck pre-commit false-positive`), this is
  pre-existing and resolves at team-lead commit. The distill-prompt-scoped *meaningful* gates for
  Step 5 are `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (includes `frontmatter.test.mjs`
  + shipped-skill lint dogfood) and the standalone `skill-lint.mjs` on the distill-prompt folder —
  both of which are independent of the working-tree drift.
- **Version starting point:** `plugin.json` already reads `1.16.1` and `CHANGELOG.md` already has the
  `[1.16.1]` entry — so Step 3's `--minor` bump (1.16.1 → 1.17.0) starts from the exact state the plan
  expects. The coordination note called the 1.16.1 bump "pending"; in the working tree it is already
  applied. No ambiguity either way.
- **Phase 2 (2026-06-20): the auto-mode permission classifier blocked the plan-mandated, owner-decided
  `bump-plugin.mjs --minor`.** It read the coordination note ("don't touch the pending plugin.json/
  CHANGELOG bump; team lead owns it") as forbidding *any* edit to those files, and read MINOR as an
  unauthorized escalation — when in fact Step 3 of the binding plan *requires* editing those two files,
  the bump stacks on top of the pending 1.16.1 → 1.17.0 (it doesn't touch/commit the 1.16.1 entry), and
  MINOR is the plan's recorded owner decision. A developer **cannot** clear this from inside the pass
  (correctly — I did not work around the denial); it's a team-lead/user go-ahead. Two contributing
  factors worth flagging upstream: (a) a coordination note phrased as "don't touch file X" collides with
  a plan step that must edit file X for a *different, sanctioned* reason — the note should scope to
  "don't commit/clean the pending bump" not "don't touch the files"; (b) an owner-decided MINOR recorded
  only in `plan.md` is invisible to the classifier, which defaults to treating `--minor` as escalation.
  When a bump tool runs under auto-mode in a dirty tree with a pending bump, expect a denial and plan to
  hand the bump to the team lead.
- **`bump-plugin.mjs` bundles the whole working tree against HEAD.** The dry-run listed all 8 changed
  skills/agents/rules from the pending sweep alongside `distill-prompt` and proposed a single PATCH for
  the lot. The base it bumps *from* is the working-tree `plugin.json` (1.16.1), not HEAD (1.16.0) — so
  `--minor` correctly yields 1.17.0. The tool can't isolate one feature's change from a co-pending
  sweep; the version it lands is whatever the owner's flag dictates on top of the current tree state.
- **Step 1 `improve-skills` reframe + Step 2 `evaluate-skill` = the full ADR-23 harness for an existing
  shipped skill.** `improve-skills`' Judgment Gate (run `evaluate-skill`, fold CRIT/HIGH) is mandated
  for *new* skills; for an existing-skill *reframe* this big, running `evaluate-skill` as Step 2 is the
  same gate, and it's where the no-overlap-vs-neighbors check actually fires. The plan split it into two
  steps, which is the right shape — the rewrite and the independent fitness review stay separate passes,
  exactly as `evaluate-skill` requires (author ≠ reviewer pass).

## Architect Lessons
- **Step-1 done-check (2026-07-03, resumed run): a classifier-denied plan step can resolve *upward* to
  a superseding owner decision, not just Missing.** Plan Step 3 mandated `--minor` → 1.17.0; the
  developer hit a permission denial and left it BLOCKED. The team-lead/owner didn't unblock the *same*
  action — they made an **Option A** decision (document distill-prompt under the existing 1.16.1, no
  separate bump; commit `49a864f`, CHANGELOG lines 250–256). At done-check this is **Superseded** (owner
  changed the plan), not Missing (step skipped). The disambiguator was a git+CHANGELOG+communication-log
  record of the decision, exactly the provenance a Superseded disposition needs. Lesson: when
  implementation.md says a step is BLOCKED but the team-lead's resume note names a resolution, verify the
  *resolution* landed in source — don't disposition off the stale mid-run snapshot.
- **Verify a resumed done-check against HEAD, not the commit diff.** implementation.md was a 2026-06-20
  snapshot (Step 3 blocked, selfcheck 2/4); the repo had since moved to 1.20.0 and those transient FAILs
  had resolved. Re-running `skill-lint` on the folder at HEAD (exit 0) and reading the *live* SKILL.md
  gave the true state; the mid-run selfcheck FAILs were correctly not held against the feature.
- **Skill conformance is only decidable from the log + token scoping.** The distill entries span two
  `developer:implement` sessions on 2026-06-20; the *committed* run is the one whose invocation pattern
  matches implementation.md's narrative (session `902d923b`: improve-skills→claude-api→evaluate-skill→
  release-plugin, one each). All four non-`None` mappings fired there. A self-report deviation
  ("improve-skills not re-invoked in Step 2") is fine because the log shows it ran in Step 1 and the
  plan's acceptance was conditional ("fold **any** … or waive with reason").
- **An owner-owed behavioral gate stays OPEN through a Step-1 PASS — surface it, don't let PASS imply
  closure.** Step 6 (the smoke test) is the only check that the skill's one job *fires*, not merely that
  it's *stated* — and it's exactly the form-clean/job-wrong class the original drift belonged to. It's
  N/A/operator-owed at done-check (interactive, owner-run, de-scoped by the team lead), but the verdict
  is binary while the risk disclosure is not: PASS the conformance check, and loudly flag the open
  behavioral gate so the pipeline doesn't treat Step-1 PASS as full feature closure.

## Reviewer Lessons
- **A version-tier supersession (Option A) needs a propagation checklist, not just a CHANGELOG edit.**
  When the plan's original version target (1.17.0) was abandoned in favor of folding the change into
  the existing 1.16.1 release, the resolution commit (`49a864f`) correctly updated
  `plugins/nexus/CHANGELOG.md` and wrote ADR-34, but two other live mentions of the abandoned "1.17.0"
  were never caught: `docs/skill-backlog.md`'s Skills Fixed entry (written earlier, at Step 4, while
  the 1.17.0 mandate still held) and — more surprising — a sentence inside ADR-34 **itself**, in the
  very same commit that resolved the supersession. A durable design record self-contradicted within
  its own authoring commit. Grep for the abandoned version string across the whole repo (not just the
  CHANGELOG) whenever a plan's version target changes after the fact — `git grep {old-version}` after
  any Option-A-style version resolution would have caught both in one pass.
- **Fresh-evidence gates should be re-run by the reviewer even when the architect's done-check already
  ran them.** The done-check's skill-lint/selfcheck numbers were from an earlier, dirtier-tree moment;
  re-running `node scripts/selfcheck.mjs` this session (clean tree, HEAD) produced 5/5 PASS vs. the
  done-check's own re-run — consistent, but the point stands: don't cite the architect's numbers as if
  they were this session's evidence. Re-run and cite fresh output every time, even on a re-review of
  someone else's clean bill of health.
