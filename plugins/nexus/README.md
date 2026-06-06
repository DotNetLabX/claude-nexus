# nexus

The stack-agnostic, self-contained core of **Nexus** — a multi-agent feature pipeline for Claude Code.

> **Name alternatives considered:** Gravity, Blade — in case of future rename.

It ships a coordinated team of specialized agents, always-on behavioral rules, reusable process skills, persona commands, and a configurable security guard. Nothing in here assumes a particular tech stack — the companion **nexus-dotnet** plugin (which depends on this one) layers .NET / Vue / EF code-pattern skills on top.

## What's inside

| Component | Count | Notes |
|-----------|-------|-------|
| **Agents** | 8 | architect, po, critic, learner, team-lead (`opus`); developer, reviewer, solo (`sonnet`) |
| **Rules** | 10 | Always-on, injected at SessionStart (plugins have no auto-loaded `rules/`) |
| **Skills** | 14 | 9 process recipes (planning, specs, reviews, lessons, TDD, debugging, cleanup, KB schema) + 5 artifact-format schemas (implementation/questions/review/summary/lessons) |
| **Commands** | 9 | 8 persona activators + `backlog` |
| **Hooks** | 4 | `inject-rules`, `restore-agent` (SessionStart); `guard`, `audit-logger` (PreToolUse) |

## Two ways to use an agent

1. **Subagent (native)** — the pipeline spawns agents via the Task tool. The team-lead orchestrates; agents hand off through files (`docs/specs/{slug}/...`) and route messages hub-and-spoke.
2. **Persona (`/nexus:<agent>`)** — the main thread *adopts* a role for the session (e.g. `/nexus:architect`). The command records the role per-session in `.claude/.personas.json` (keyed by session id, so concurrent sessions don't collide). `restore-agent` re-injects the full role on `/compact` — the one event that drops it; `/clear` exits the persona, and entries older than 16h are pruned automatically.

Pipeline entry points: `backlog` (triage) → `team-lead` (orchestrate) → `architect` (plan) → `developer` (implement) → `architect` done-check → `reviewer` (code review). `solo` is the lightweight path for 1–3 file changes. `po` shapes specs; `critic` cross-checks specs/plans; `learner` consolidates lessons.

## Design: where conventions live

- **Always-on rules** → `rules/*.md`, injected every session via `inject-rules.js`.
- **Coordination protocol & per-agent conventions** → **inlined directly into the agent files** (plugin agents can't `@`-import bundled files, and `${CLAUDE_PLUGIN_ROOT}` doesn't expand in agent/command markdown). Each pipeline agent carries its own `## Coordination Protocol`; the team-lead also carries `## Operations`.
- **Project-owned docs** (`docs/architecture/`, `docs/conventions/`, `docs/kb/`) → agents **read them at start if present**. Stack-agnostic by design; absent files are skipped.
- **On-demand recipes** → skills, invoked by name (architect → `create-implementation-plan`/`create-architecture-doc`; po → `create-feature-spec`; learner → `improve-flow`/`improve-skills`).

## Security

A `userConfig.security_mode` is chosen at install time and passed to the synchronous `guard.js` PreToolUse hook:

| Mode | Behavior |
|------|----------|
| `open` (default) | Allow everything **except** catastrophic actions — `rm` outside the repo, force-push, `git reset --hard`, `curl\|sh`, secret reads (`.env`, `secrets`, `id_rsa`), cross-repo writes, `sudo`, fork bombs |
| `hardened` | `open` + blocks `git push`, network installs, and remote fetches (for teams / CI) |
| `off` | No guard |

`audit-logger.js` runs asynchronously and appends every tool call to `docs/audit/tool-calls.log` (record-only; never blocks).

## Install

```
/plugin marketplace add <path-or-url to claude-nexus>
/plugin install nexus@claude-nexus
```

Pick a security mode when prompted, then fully restart Claude Code (plugin load state is latched per session).

## Stack-specific work

For .NET / ASP.NET / EF Core / CQRS / DDD / FastEndpoints / Vue / Pinia / Tailwind patterns, install **nexus-dotnet**, which declares `dependencies: ["nexus"]` (so it auto-installs this plugin) and adds the stack code-pattern skills plus convention files.
