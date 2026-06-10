# Nexus test harness

Offline test tiers for the plugins (strategy: `docs/research/testing-claude-code-plugins.md`,
roadmap: `docs/proposals/plugin-evaluation-2026-06.md` §A). Plain `node:test`, zero dependencies,
no package.json. **Dev-repo machinery only** — never shipped, never version-bumped.

```
node --test tests/lint/*.test.mjs tests/unit/*.test.mjs   # the CI hard gate (T1 + T2)
node --test tests/red/*.test.mjs                          # TDD reds — EXPECTED to fail (see below)
```

| Dir | Tier | What it proves | Cost |
|---|---|---|---|
| `lint/` | T1 structural lint | Frontmatter schema; skill references resolve; convergence of duplicated vocabulary (verdicts, severities, Carry-Over Findings); CHANGELOG ↔ plugin.json agreement; no `${CLAUDE_PLUGIN_ROOT}` in markdown; hooks.json scripts exist; everything parses | $0, ms |
| `unit/` | T2 unit tests | Hook scripts driven by synthetic event JSON on stdin (the platform contract): guard matrix, gate invariants + deliberate fail-open edges, audit-logger opt-in footprint, persona register/restore, rule injection. Build scripts against fixture trees: bump-plugin classification + check gate, gen-commands wrapper contract, gen-omni round-trip + drift detection | $0, sec |
| `red/` | TDD reds | The enforcement + relay fix package (B.1, C.2–C.4) — written FIRST, each failing for the right reason, so every fix has a deterministic definition of done | $0 |

T3/T4 (model-in-the-loop trajectory + judge evals) are a separate follow-up gated on CI auth —
see the research doc §3–4. Lint proves the contract *text* exists; only an eval proves the LLM
*honors* it.

## The red-suite rule

`tests/red/` fails BY DESIGN until the fix package lands; CI runs it `continue-on-error` for
visibility. When a fix ships: its red turns green → **move the test into `lint/` or `unit/`**
(it becomes the permanent regression test) → when the directory is empty, delete it and the
non-blocking CI step. Never add a red test for speculation — only for decided roadmap items.

## Conventions

- Tests never touch the real working tree or the private omni twin: hook tests run in
  per-test temp sandboxes (`CLAUDE_PROJECT_DIR` override), script tests run in throwaway
  git repos / tree copies under the system temp dir.
- Fixture transcripts in `fixtures/transcripts/` mirror the platform's subagent
  `agent-{id}.jsonl` shape. The hook stdin schema and transcript format are **unversioned**
  platform surfaces (research §5) — if a Claude Code release changes them, update the
  fixtures and note the version.
- Deliberate fail-open edges (ADR-7) are pinned by tests named `deliberate edge: …` —
  if one of those fails, the hook got *stricter*; read the ADR before "fixing" either side.
