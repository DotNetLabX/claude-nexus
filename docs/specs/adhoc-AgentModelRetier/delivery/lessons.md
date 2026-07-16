# Agent Model Retier — Lessons

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
