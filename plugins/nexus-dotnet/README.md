# nexus-dotnet

A **thin .NET / Vue stack extension** for the `nexus` core pipeline — the dependency-based alternative
to the self-contained `nexus-net` superset.

Unlike `nexus-net` (which inlines stack conventions into its own full copy of every agent), `nexus-dotnet`
ships **no agents, rules, commands, or hooks**. It depends on `nexus` for the entire engine and adds only:

| Component | Count | Notes |
|-----------|-------|-------|
| **Skills** | 29 | The .NET/Vue stack code-pattern skills (services, modules, aggregates, CQRS, EF, gRPC, Vue, Pinia, Tailwind, …). The 9 process skills come from `nexus`. |
| **Conventions** | 6 | `csharp`, `ef-core`, `vue`, `testing`, `project-rules`, `coding-conventions` — scaffold source for the Read-Index pattern. |
| **Template** | 1 | `templates/CLAUDE.md` — a .NET/Vue project starter. |

## Install (alongside nexus)

```
/plugin marketplace add DotNetLabX/claude-nexus
/plugin install nexus-dotnet@claude-nexus
```

`nexus-dotnet` declares `dependencies: ["nexus"]`, so installing it **auto-installs `nexus`** — the
install output lists the dependency it pulled in. Then run `/reload-plugins` (or restart Claude Code) to
activate.

For the full lifecycle — update and remove — see the marketplace README's
[Install & lifecycle](../../README.md#install--lifecycle) section.

## Conventions — the Read-Index model

The stack conventions are **not** inlined into agents here. Instead they live as files the project reads:

1. Copy this plugin's `conventions/` into your project's `docs/conventions/`.
2. `docs/conventions/coding-conventions.md` is the index — it lists `csharp.md`, `vue.md`, `ef-core.md`, `testing.md`.
3. Code-touching agents read the index (and the files it lists) before writing or reviewing code.

> The core `nexus` agents (developer, reviewer, solo, architect) read `docs/conventions/coding-conventions.md`
> and the files it lists before writing or reviewing code — so once you place these conventions there, they are
> applied automatically. See `omni-convention-loading-v2.md` for the full design.

## When to use which

- **Generic / non-.NET project** → `nexus` alone.
- **.NET project, prefer one self-contained install** → `nexus-net` (superset; conventions inlined into agents).
- **.NET project, prefer the thin/dependency model** → `nexus` + `nexus-dotnet` (this plugin).
