# Agent Model Retier — Lessons

> **Learner disposition (2026-07-21 → nexus 1.39.2):** [RESOLVED] the pending omni-ahead back-port landed as adhoc-OmniFlowsBackport (`8e6d697`, nexus 1.34.9 + nexus-flutter 0.4.3). [TRACKED] pre-commit `git diff --numstat` omni-ahead-signature guard for twin regens (1 occurrence, data-loss-shaped; owner approval not given this pass). MODELS-allowlist and gen-commands-no-op facts confirmed by adhoc-AgentModelRetier2 (repo-internal, recorded here). [APPLIED-PRIOR] commit-scope staging discipline (recurrence evidence).

## Solo Lessons
- The frontmatter lint's `MODELS` allowlist (`tests/lint/frontmatter.test.mjs`) is a closed set — a
  model retier that introduces a new alias (here `fable`) must ship the allowlist update in the same
  commit, or the lint gate rejects the shipped agents.
- `tests/lint/enforcement.test.mjs` C.4 used an unanchored `.search(/re-spawn|re-ask/i)` that
  false-matched inside the *filename* `research-before-asking.md` cited in team-lead.md — CI was red
  at HEAD from an unrelated commit. Naive substring lints over prose need word boundaries
  (`/\bre-(spawn|ask)/i`). When a lint over agent prose fails, check whether the match is a real
  mention before rewording the agent file.
- Concurrent-tree hazard, commit-scope variant (recurrence of the staging hazard recorded in
  F5-SkillGapCapture's lessons, cb9762e): the tree carried another feature's finished-but-uncommitted
  closure (bump + changelog), which blocks a clean bump of your own change. Resolution: re-check
  `git status` at decision time — the owning session had committed mid-conversation, dissolving the
  collision. Never claim or renumber another feature's pending version without the owner's call.
- `gen-commands.mjs` output does not embed the `model:` frontmatter — regenerating after a
  model-only agent edit is a byte-identical no-op (still cheap to run as CLAUDE.md prescribes).
- **The omni twin can be AHEAD of canonical nexus** — the prior sync (omni 7e412fd) hand-carried
  FL-2 first-consumer feedback (omni-flutter 0.4.3 + `mine-verify-flows/SKILL.md` edits) that never
  landed in nexus, violating ADR-1's single-source-of-truth direction. A naive `gen-omni` commit
  would have erased it. Before committing a regenerated twin, scan `git diff --numstat` for files
  where deletions exceed insertions — that is the omni-ahead signature. Those files were excluded
  (restored from HEAD) in omni a8cf2ed; **back-port to nexus is pending** (nexus-flutter 0.4.3 +
  the mine-verify-flows core-skill feedback, reverse token-swap Omni→Nexus).
