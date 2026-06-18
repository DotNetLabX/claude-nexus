# adhoc-FleetHeartbeatFix — Summary

**Status:** COMPLETE · **Lane:** solo · **Release:** nexus 1.14.0 → **1.14.1** (PATCH) · **Branch:** main

## What shipped

Fixes the FleetView heartbeat so `/nexus:fleet` works in real runs (root-caused in
`adhoc-NexusFleetView` Issues Log #6).

- **`subagent-rows.js` `resolveRoot()`** → `data.workspace?.project_dir || data.cwd`. The real
  `subagentStatusLine` payload is hook-shaped and carries no `workspace` object — only base-hook `cwd`
  (= session/launch root). `workspace.project_dir` kept as a forward-compat no-op. False-premise block
  comments rewritten.
- **Tests** — 2 new hook-shaped fixtures (the regression guard that would have caught the live bug: no
  `workspace`, has `cwd` → snapshot writes; empty `tasks` → drain fires); the "no root" negative fixed to
  also drop `cwd`; stale comments corrected. Suite green (subagent-rows 16/16; full suite 0 failing).
- **`fleet/SKILL.md`** — activation note: the heartbeat is registered in the plugin's bundled
  `settings.json` (read at plugin-load, not hot-reloaded) → run `/reload-plugins` or restart after
  install/update.
- **Release** — PATCH bump 1.14.0 → 1.14.1; CHANGELOG `[1.14.1]`; **omni twin regenerated + in sync**
  (selfcheck 4/4).

## Verification

- selfcheck **4/4** (tests, gen-commands, gen-omni twin in-sync, bump present); verify-gate verdict **pass**.
- Code-path fix confirmed; resolveRoot + version verified directly in source.

## Operator step (still required — outside this session)

- **Activation:** run `/reload-plugins` or restart Claude Code so the `subagentStatusLine` registration
  loads, then a live multi-agent run should populate `fleet-state.json`. The code fix is validated by
  unit test now; a live `NEXUS_SUBAGENT_CAPTURE` capture was not possible this session (hook not yet active).

## Commits

- nexus: `feat→fix(adhoc-FleetHeartbeatFix): resolveRoot base-hook cwd fallback, release 1.14.1`
- omni twin: mirrored in `../omni` (covers 1.14.0 + 1.14.1 since omni 1.13.2)
