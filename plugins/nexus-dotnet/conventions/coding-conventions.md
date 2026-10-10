# Coding Conventions

The index of this repo's conventions. The coding agents read it, then every file it lists, before every task.

The files `csharp.md`, `ef-core.md`, `testing.md` and `vue.md` come from the nexus-dotnet plugin: copy its
`conventions/` folder here, and copy it again after a plugin update — an update never refreshes this copy by itself.
`project-lists.md` belongs to the repo: copy it once from the plugin's `templates/project-lists.md`, keep it here,
and never copy it again; the repo fills it as it builds. Where the repo keeps its own guardrails in
`project-rules.md` beside this file, read it too: it overrides these defaults, and no plugin update touches it.

## Look First <!-- id: look-first -->

Before building anything a skill relies on — a guard helper, the central error mapper, a settings binder, an
aggregate or repository base, a save interceptor, an event publisher — look at what the repo already has: first
`project-lists.md` § Helpers, then the shared libraries, modules and packages the project can reach (its project
references and the central package file). Use what you find. Only otherwise build it once, in the shared place: the
lowest project every user of it already references; in a repo of one project, a `Shared` folder in it; where the
users share no project, a new shared project each of them references, with no reference cycle. Never a copy beside
each user. Add its row to `project-lists.md` § Helpers in the same change.
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
- **No project references an API project,** and a service never references another service's projects.

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

- `dotnet build` after every backend step — fresh output, never assumed. File-lock errors on Windows (MSB3026,
  MSB3027, MSB3492) mean a running app holds the output files; they are not compiler errors — filter for `error CS`.
- `npm run build` in the front-end folder after front-end changes — exit 0, no TypeScript errors; `npx vitest run`
  when front-end tests exist.
- **Under the Bash tool on Windows, never use cmd.exe idioms** — `cd /d <path> && …` fails with "too many
  arguments" and the command never runs. Pass absolute paths instead (`dotnet build "D:\…\{Solution}.slnx"`,
  `git -C "D:/src/repo" …`), and confirm the tool actually ran before calling it a failure.
- Before handing over, search the change for debugging leftovers: `Console.WriteLine`, to-do markers, commented-out
  code.

@csharp.md
@ef-core.md
@testing.md
@vue.md
@project-lists.md
