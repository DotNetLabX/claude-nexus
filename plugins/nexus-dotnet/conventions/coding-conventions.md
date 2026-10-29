# Coding Conventions

The index of this repo's conventions. The coding agents read it, then every file it lists, before every task.

The files `csharp.md`, `ef-core.md`, `testing.md` and `vue.md` come from the nexus-dotnet plugin: copy its
`conventions/` folder here, and copy it again after a plugin update — an update never refreshes this copy by itself.
`project-lists.md` belongs to the repo: copy it once from the plugin's `templates/project-lists.md`, keep it here,
and never copy it again; the repo fills it as it builds. Where the repo keeps its own guardrails in
`project-rules.md` beside this file, read it too: it overrides these defaults, and no plugin update touches it.

## Look First <!-- id: look-first -->

Before building anything a skill relies on — a guard helper, the central error mapper, a settings binder, an
aggregate or repository base, a table-configuration base, a save interceptor, an event publisher — look at what the
repo already has: first `project-lists.md` § Helpers, then the shared libraries, modules and packages the project can
reach (its project references and the central package file). Use what you find. Only otherwise build it once, in the
shared place: the lowest project every user of it already references; in a repo of one project, a `Shared` folder in
it; where the users share no project, a new shared project each of them references, with no reference cycle. Never a
copy beside each user. Add its row to `project-lists.md` § Helpers in the same change. An ordinary class — a table
configuration, a repository, an endpoint, a consumer — derives from the base the repo's libraries offer for its kind,
picked by reading that base's members; a skill's sample is the form for a repo with no such library.
<!-- id-end -->

## Kinds of Reusable Unit <!-- id: unit-kinds -->

A unit's kind comes from whether it could stand alone. Neither having endpoints nor being shared by two apps decides it.

| Kind | What it holds | The test |
|---|---|---|
| Generic module | a capability usable anywhere, often a contract with swappable implementations | it holds no business rules |
| Business module | business rules and its own tables, with endpoints or without | it depends on other services, so it lives inside a service or a host and never stands alone |
| Service | its own data, endpoints, integration events and gRPC calls — everything it needs | it is self-contained, so it could ship as a product of its own |

A service runs on its own by default. In a repo that has a host, a service may instead run inside one host or several
(`create-host`). In the module skills, the Component archetype is the generic module and the Domain archetype the
business module; a generic module that keeps its own tables takes the Domain scaffold.

A module gets a contracts project only where it has several implementations or a second is planned (a generic
module's swappable ones), never because it has several consumers: a business module is referenced directly by the
service or host that composes it. The contracts of integration events and gRPC are always shared projects, whatever
the count, because they cross deployables.
<!-- id-end -->

## Source Files

Source files hold application code: the `.cs` files of the services, modules and shared libraries, and the front
end's `.ts`, `.vue` and `.css` files. An agent barred from writing source code never creates or changes them.
Documentation, specs, plans, agent and skill files, front-end build configuration and root configuration files
(`*.slnx`, `docker-compose.*`, `*.json`, `*.md`) are not source files.

## Repo Guardrails

- **No domain rule bypassed** through an EF configuration or an endpoint.
- **No `.gitkeep` files** — empty directories are not tracked.
- **No secrets in commits or artifacts.** Never commit, include or reference a file holding secrets (`.env`,
  `credentials.json`, API keys, connection strings, tokens); if a file seems to hold one, warn the user instead.
- **No project references an API project,** except a host project, which references the API project of each service
  or module it runs — `create-host` — and a module's or service's own test project, which may reference that unit's
  API project (`testing.md` § Project Structure). A service never references another service's projects.

## Boy Scout Guardrails

Boundaries the boy-scout skill respects:

- **Don't rename aggregate public methods** — they are domain contracts. Internal and private names are fair game.
- **Don't extract logic out of aggregates** — behaviour belongs with state. Simplify a complex aggregate method in
  place.
- **Don't move code across feature folders** — a feature's endpoint, request, validator and handler belong together.
- **Don't create cross-feature helpers** — a shared helper is built in a planned step, under Look First, never as a
  boy-scout fix.
- **Don't touch domain events or integration-event contracts** — they are interfaces between components.

## Plan-to-Code Boundary

- **A plan step describes operations and acceptance criteria, not method bodies.** The developer decides the internal
  structure.
- **A plan step with more than 5 sequential sub-operations** says they become several private methods, never one.

## Build Verification

- Verify: `developer.md` § The step test rule; the front end's type-check and build are the complete run's. File-lock
  errors on Windows (MSB3026, MSB3027, MSB3492) mean a running app holds the output files; they are not compiler
  errors — filter for `error CS`.
- **Under the Bash tool on Windows, never use cmd.exe idioms** — `cd /d <path> && …` fails with "too many
  arguments" and the command never runs. Pass absolute paths instead (`dotnet ef … -p "D:\…\{Project}.csproj"`,
  `git -C "D:/src/repo" …`), and confirm the tool actually ran before calling it a failure.
- Before handing over, search the change for debugging leftovers: `Console.WriteLine`, to-do markers, commented-out
  code.

@csharp.md
@ef-core.md
@testing.md
@vue.md
@project-lists.md
