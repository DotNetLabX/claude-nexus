# nexus-net

The **.NET / Vue** stack plugin for Claude Code — a self-contained **superset** of `nexus`.

It ships the same multi-agent feature pipeline as `nexus` (agents, rules, persona commands, security
guard), but the code-touching agents carry the **.NET / ASP.NET Core / EF Core / CQRS / DDD / FastEndpoints
+ Vue / Pinia / Tailwind** conventions **inlined**, and it adds 29 stack code-pattern skills. Install this
**instead of** `nexus` on .NET projects — not alongside it.

## What's inside

| Component | Count | Notes |
|-----------|-------|-------|
| **Agents** | 8 | Same roles as core; developer/reviewer/solo carry full stack standards inline, architect carries structure + standards (`system-design` re-added) |
| **Rules** | 10 | Always-on, injected at SessionStart |
| **Skills** | 38 | 9 process (planning, specs, reviews, lessons, TDD, debugging, cleanup, KB) + 29 stack (services, modules, aggregates, CQRS, EF, gRPC, Vue, Pinia, Tailwind, …) |
| **Commands** | 9 | 8 persona activators (`/nexus-net:<agent>`) + `backlog` |
| **Hooks** | 4 | `inject-rules`, `restore-agent` (SessionStart); `guard`, `audit-logger` (PreToolUse) |
| **Template** | 1 | `templates/CLAUDE.md` — a .NET/Vue project starter to copy into your repo root |

## Why superset (not a dependency on omni)

A Claude Code plugin can only inline conventions into **its own** agents — and pipeline agents run as
**subagents**, which receive only their own agent file. A separate plugin therefore can't add stack
conventions to `nexus`'s agents at subagent-time. So `nexus-net` ships its own complete agent set
with the stack conventions inlined. DRY is preserved at **build time**: the dotnet agents are generated
from the core agent bodies + the convention source in `build-src/conventions/` (see `scripts/`).

## The 29 stack skills

Service/module scaffolding (`create-service`, `create-module`, `create-feature`, `create-building-blocks-package`,
`create-service-claude-md`, `create-module-claude-md`), domain & CQRS (`create-aggregate`,
`create-domain-event-handler`, `add-pipeline-behavior`, `cqrs-patterns`, `domain-patterns`,
`add-integration-event`, `create-grpc-contract`), persistence (`persistence-patterns`, `redis-patterns`),
cross-cutting (`authorization-patterns`, `error-handling`, `service-registration`,
`analytics-computation-service`), refactoring (`extract-endpoint-types`, `extract-feature-service`,
`improve-architecture`), architecture (`system-design`), and frontend (`create-vue-feature`,
`vue-patterns`, `vue-component-architecture`, `pinia-patterns`, `tailwind-theme`, `frontend-review`).

## Install

```
/plugin marketplace add <path-or-url to claude-nexus>
/plugin install nexus-net@claude-nexus
```

Pick a security mode when prompted, then fully restart Claude Code (plugin load state is latched per
session). Optionally copy `templates/CLAUDE.md` into your project root and fill in the TBD sections.

## Generic projects

For a non-.NET project, install **`nexus`** instead — the stack-agnostic core with the same pipeline,
shorter command prefix (`/nexus:<agent>`), and the 9 process skills only.
