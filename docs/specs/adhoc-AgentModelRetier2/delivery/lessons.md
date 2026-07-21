# Agent Model Retier 2 (fable retired) — Lessons

## Solo Lessons
- Confirmed two lessons from adhoc-AgentModelRetier: (1) the frontmatter lint's `MODELS` allowlist
  only needs editing when a retier introduces a *new* alias — moving between already-allowlisted
  values (opus/sonnet) passes untouched; (2) `gen-commands.mjs` output embeds no `model:` frontmatter,
  so a model-only retier regenerates byte-identical commands (still run it per CLAUDE.md).
- `node --test tests/lint/` (bare directory form) fails with a single opaque `'test failed'` on this
  Node version — it is a runner invocation artifact, not a lint failure. Use the glob form
  `node --test "tests/lint/*.test.mjs"`, which runs all 49 tests.
- A model retier touches 7+ files but stays solo-lane: it is one mechanical frontmatter change
  fanned across agent definitions, not a multi-file feature — scope caps measure decision surface,
  not file count. Precedent: adhoc-AgentModelRetier (41ed92b).
