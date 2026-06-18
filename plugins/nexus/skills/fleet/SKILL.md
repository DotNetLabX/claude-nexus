---
name: fleet
description: Renders the fleet view — a consolidated, on-invoke snapshot of the running background pipeline agents. Shows a run-state header, one line per agent (role, phase/step, tokens, run-state, elapsed, tool-calls), and a health footer. Reads the live roster the subagentStatusLine heartbeat persists to .claude/audit/fleet-state.json; tool-call depth needs the token_audit plugin config ON. User-invoked dashboard — run when the user asks for fleet or team status, not auto-invoked by the model.
---

# Fleet View

A single-screen snapshot of the **running background agents** — the aggregation layer above the
per-row `subagentStatusLine`. Where the statusline restyles each agent's row in the live panel, this
view consolidates the whole roster into one dashboard you can call on demand: how many agents are
running vs idle, what phase the run is in, and what each agent is burning.

This is a **user-invoked** surface — run it when the user asks for fleet status. It is not a report
the model reaches for on its own.

## Why it reads a file, not the live tasks

The rich live roster — per-task `tokenCount`, `startTime`, `status`, and role — is delivered **only**
to the `subagentStatusLine` hook. The in-session `TaskList` tool returns just the task board
(`{id, subject, status, owner, blockedBy}`), not the agent panel. So the statusline persists a
heartbeat snapshot to `.claude/audit/fleet-state.json` on every render, and this skill reads that
file rather than querying on demand. No team has run since install → no heartbeat → "No active
fleet." (See ADR-33.)

**Activation:** the `subagentStatusLine` heartbeat is registered in the plugin's bundled
`settings.json`, which Claude Code reads at plugin-load — **not** hot-reloaded. After installing
or updating nexus, run `/reload-plugins` or restart the session before starting a team run, or no
heartbeat is written and this view stays empty.

## Data sources it joins (single-project, current session)

| Source | Carries | Missing → |
|--------|---------|-----------|
| `.claude/audit/fleet-state.json` | live roster: role, run-state, tokens, elapsed | "No active fleet" |
| `docs/specs/*/delivery/communication-log.md` (newest) | phase/step + cycle | phase/cycle columns omitted |
| `.claude/audit/token-usage.jsonl` | depth: per-agent tool-call count | "(enable token_audit for depth)" |
| `.claude/audit/violations.log` | health: boundary-event count | counted as 0 |

Every join is **best-effort**: a missing or malformed source degrades to a one-line hint, never an
error. A snapshot older than 60s is rendered but labelled **stale** (`last seen {age} ago`) — a
roster left over from an ended run must not read as live.

## Render it

`scripts/render-fleet.mjs` sits next to this SKILL.md. In a consuming project resolve it via the
plugin cache (glob `~/.claude/plugins/cache/**/skills/fleet/scripts/render-fleet.mjs`, highest
version). Run it with the project root as the first argument (it falls back to the current working
directory):

```bash
node {fleet folder}/scripts/render-fleet.mjs .
```

The script resolves the four sources under that root, prints the ANSI dashboard, and always exits 0 —
the fleet view is an observability surface, never a gate.

## Reading the output

- **header** — `running N · idle M` by run-state, plus a `stale` flag when the snapshot is old.
- **per agent** — `[tag] · phase/step · tokens · ▶/⏸ elapsed · calls`. `▶` = running, `⏸` = idle;
  `calls` is the agent's tool-call count from the token-usage log (depth only with `token_audit`).
- **footer** — `cycle N/M` from the comm log, the depth hint when `token_audit` is off, and
  `health: K boundary events` from the violations log.
