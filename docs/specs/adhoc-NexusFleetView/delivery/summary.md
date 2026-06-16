# Nexus Fleet View — Summary

## Status: COMPLETE

## What Was Built
- `/nexus:fleet` — a consolidated, on-invoke dashboard of the running background agents: a summary
  header (counts by run-state), one line per pipeline agent (`[role] · phase/step · tokens · ▶/⏸
  elapsed · calls`), and a health footer. It is the **aggregation layer** above the per-row
  `subagentStatusLine` (`subagent-rows.js`), fed by a new fail-open **heartbeat** the statusline
  writes to `.claude/audit/fleet-state.json`, joined with the communication log (phase/cycle),
  `token-usage.jsonl` (depth), and `violations.log` (health). Each join degrades to a one-line hint.

## Key Outcomes
- **Files:** 5 modified (`statusline/subagent-rows.js`, `.claude-plugin/plugin.json`, `CHANGELOG.md`,
  `docs/architecture/README.md` [ADR-33], `tests/unit/subagent-rows.test.mjs`); created
  `skills/fleet/SKILL.md` + `skills/fleet/scripts/render-fleet.mjs`, `tests/unit/render-fleet.test.mjs`,
  and `tests/fixtures/fleet/{full,roster-only,stale,malformed,zero-token}`.
- **Tests/build:** full suite **193/193** pass; `skill-lint` clean; `claude plugin validate --strict`
  clean; `gen-omni --check` in sync.
- **Release:** MINOR bump **1.12.0** + CHANGELOG; omni twin (`../omni`) regenerated.
- **Review (Standard+Codex):** nexus reviewer **APPROVE** + Codex **GO** (round 1, parallel, no
  conflict); plan-stage critic Mode 2 passed earlier. 6 LOW findings → 5 unique after dedup → 4 fixed
  in cycle 2, 1 deferred. **Cycles:** 1 review round + 1 LOW cleanup (2/3, never exhausted).

## Deviations from Plan
- **D1** — dropped the dead `CLAUDE_PROJECT_DIR` fallback (hooks-only env, absent for a statusLine
  process); root resolves from `data.workspace.project_dir` (confirmed via official Claude Code docs).
- **D2** — `SKILL.md` avoids the literal `/nexus:fleet` token (wiring-lint reserves `nexus:<name>` for
  agents); the trigger still resolves via the standard skill mechanism (reviewer-confirmed).
- **D3** — `description` frontmatter rephrased to avoid a YAML colon-space the strict validator rejects.
- **Step 1.0 resequenced** — the gating live-capture spike's root-field unknown was resolved from
  official docs (`workspace.project_dir`) rather than a live capture (a subagent can't capture a
  main-session statusLine payload); the live confirmation moved to a team-lead post-build check.

## Notes
- **Not committed by the pipeline** (team-lead owns commits). Commit is **path-scoped to FleetView
  files only** — a concurrent `adhoc-UnattendedAutonomy` run's changes in the shared working tree were
  deliberately excluded (never staged, never reverted).
- **Version stays 1.12.0** — the cycle-1 bump is uncommitted, so cycle-2 rides the same unreleased
  version. `bump-plugin --dry-run` proposes 1.12.1 only because it diffs against the last *commit*
  (1.11.0); **do not re-bump.**
- **C2 live confirm (team-lead-owed):** write-path verified end-to-end with a Windows-safe synthetic
  payload (`fleet-state.json` written with the correct normalized shape + role detection), CLI render
  smoke passed, suite 193/193. **Residual:** that *this* platform build populates `workspace.project_dir`
  in the live statusLine payload AND hot-reloads the edited script is only observable after a session
  restart — fail-open guarantees worst-case-inert (reads "No active fleet"), never broken. Eyeball
  `.claude/audit/fleet-state.json` after the next team run.
- **Deferred follow-up (plan M2):** extract the `consumption-report` dedup into a shared `scripts/`
  module both consume (Codex LOW-4 — the current copy keeps exact parity; limitation documented in-code).
- **Runtime/plugin issues** are recorded in `communication-log.md` (Runtime/Plugin Issues Log):
  `.pipeline-state` hook reverts, boundary-detector false-positives from the re-spawn name suffix
  (`developer-2`), and the model-on-resume re-spawn.
