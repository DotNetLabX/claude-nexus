# nexus-dotnet

**Your agents build .NET services the way a senior team does.**

- **113 settled .NET coding rules, taught by example.** Every code sample obeys the rules it teaches.
- **A skill for every piece of a service**: services, modules and feature slices, aggregates and domain events, CQRS, EF Core, gRPC, integration events, background jobs, typed HTTP clients, authorization, Redis, file storage.
- **A Vue front end?** Its skills ship in the free `nexus-vue` plugin, installed beside this one.
- **Your conventions, enforced by a test.** The check fails when code breaks a convention, and names the rule.
- **It looks before it builds.** Your own helpers and shared libraries are reused, not written twice.
- **Architecture problems found before they cost you**: coupling hotspots, leaky boundaries, thin domain models.
- **Always on the latest stable .NET.**
- **95%+ test coverage on your C# classes** — with the paid `nexus-miner`.

nexus-dotnet is a free plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), part of [Nexus](../../README.md).

## What's inside

A **thin .NET stack extension** for the `nexus` core pipeline. It declares `dependencies: ["nexus"]`,
so installing it auto-installs and enables `nexus`, then layers the stack on top.

It ships **no agents, rules, commands, or hook registrations** — those come from `nexus`. It adds only:

| Component | Count | Notes |
|-----------|-------|-------|
| **Test runner** | 1 | `hooks/scripts/test-runner.js` — how .NET tests run, for the core's test runs: named-file and step-tied runs (a change ties to every test project that reaches it through project references), the slow label, the per-test stop, a reused build while no file changed, and what the slow-test timing leaves out. The core finds it in this plugin; without it, a .NET repo's step checks run the declared `unit` whole. It needs a `nexus` core that ships the runner contract. |
| **Skills** | 37 | The .NET stack code-pattern skills (services, modules, aggregates, CQRS, EF, gRPC, …). The process + artifact-format skills come from `nexus`. |
| **Conventions** | 4 | `csharp`, `ef-core`, `testing`, `coding-conventions` — scaffold source for the Read-Index pattern; copied again after each update. |
| **Templates** | 3 | `templates/CLAUDE.md` — a starter for a .NET project with a Vue front end; `templates/project-lists.md` — the repo's lists file, copied once and never again; `templates/conventions-check/` — the optional conventions check (`add-conventions-check`). |

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
2. Copy `templates/project-lists.md` to `docs/conventions/project-lists.md` once; the repo owns it from then on.
3. `docs/conventions/coding-conventions.md` is the index — it lists `csharp.md`, `ef-core.md`, `testing.md` and
   `project-lists.md`. A Vue front end adds `vue.md` from the `nexus-vue` plugin and its `@vue.md` line, and adds
   that line back after every re-copy of this folder.
4. Code-touching agents read the index (and the files it lists) before writing or reviewing code.

> The core `nexus` agents (developer, reviewer, solo, architect) read `docs/conventions/coding-conventions.md`
> and the files it lists before writing or reviewing code — so once you place these conventions there, they are
> applied automatically. See `omni-convention-loading-v2.md` for the full design.

## When to use which

- **Generic / non-.NET project** → `nexus` alone.
- **.NET project** → `nexus-dotnet` (this plugin); it pulls in `nexus` automatically via `dependencies`.
- **Vue front end** (with this plugin or any other back end) → `nexus-vue` as well.
