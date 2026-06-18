# Fleet Heartbeat Fix — Implementation

## Files Modified

- `plugins/nexus/statusline/subagent-rows.js` — fixed `resolveRoot()` to read `data.cwd` (base-hook
  field present in real subagent payloads) with `data.workspace.project_dir` as a harmless
  forward-compat fallback. Without this fix, root was always null in live runs (subagent payload is
  hook-shaped and carries no `workspace` object), so `writeFleetState` was always skipped and
  `fleet-state.json` was never written. Also rewrote the two false-premise block comments (header
  §Heartbeat, §resolveRoot) to correctly describe the hook-shaped payload schema.
- `tests/unit/subagent-rows.test.mjs` — added two regression-guard tests for the hook-shaped
  payload shape (no `workspace`, `cwd` at top level): one for a populated tasks array, one for the
  drain-on-empty case. Fixed the "no root" negative test comment (now correctly names both absent
  fields). Corrected two stale section/inline comments that still claimed root comes only from
  `workspace.project_dir`.
- `plugins/nexus/skills/fleet/SKILL.md` — added activation note near "Why it reads a file": the
  `subagentStatusLine` registration in the plugin's bundled `settings.json` is read at plugin-load
  only — `/reload-plugins` or a session restart is required after install/update.
- `plugins/nexus/.claude-plugin/plugin.json` — PATCH bump 1.14.0 → 1.14.1 (via `release-plugin`
  skill, `node scripts/bump-plugin.mjs`).
- `plugins/nexus/CHANGELOG.md` — 1.14.1 entry written (stub replaced with actual change
  description covering the `resolveRoot` fix and the activation note).

## Key Decisions

- **Forward-compat fallback order:** `workspace.project_dir || cwd`, not `cwd` alone. The
  `workspace.project_dir` path is currently absent from all real subagent payloads (docs confirm it
  is main-statusLine-only), but keeping it first costs nothing and guards against a future schema
  convergence without requiring another bump.
- **No `cwd` session-cwd caveat guard:** docs note `cwd` reflects the main session's cwd at render
  time — equal to the launch root unless the user explicitly `cd`'d mid-session. No nexus flow
  changes session cwd and the write is fail-open, so no active guard is warranted; the nuance is
  documented in the `resolveRoot` block comment.
- **Existing `workspace.project_dir` tests kept unchanged:** the forward-compat path must remain
  tested; the original tests already cover it. The new hook-shaped tests are additive, not
  replacements.
- **Pre-existing validate errors not fixed here:** `claude plugin validate --strict` reports 4
  YAML-frontmatter errors (boy-scout, diagnose, evaluate-skill, improve-skills). These are
  pre-existing on HEAD (confirmed via stash-and-validate) and are out of scope for this fix.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 — resolveRoot fix + comments | None | Solo scoped fix, no plan step mapping; no TDD skill — validated via existing test harness |
| 2 — test additions / comment fixes | None | Test-only; no tdd skill (adding to existing node:test suite, not starting a red-green cycle) |
| 3 — SKILL.md activation note | None | One-paragraph docs addition |
| 4 — PATCH bump + CHANGELOG | `nexus:release-plugin` | Invoked via Skill tool; dry-run confirmed PATCH 1.14.0→1.14.1 before apply |

## Deviations from Plan

None. The authorized scope (resolveRoot, tests, SKILL.md note, PATCH bump) was implemented exactly
as discussed and confirmed. The coordinator-relayed approval matched the user's prior message
verbatim; no new scope was added.

## Verification

- **Unit suite (subagent-rows.test.mjs):** 16/16 pass. Includes both new hook-shaped regression tests.
- **Full suite:** 182/182 pass (no regressions).
- **gen-omni + check:** twin regenerated and verified in sync (`✓ omni twin is in sync with nexus`).
- **validate --strict:** same 4 pre-existing YAML errors as HEAD; no new errors introduced.

*Status: COMPLETE — solo, 2026-06-18*
