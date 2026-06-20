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
