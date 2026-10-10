---
name: create-module
description: Scaffolds an empty module skeleton from its CLAUDE.md. Branches on archetype — Component (a contracts project and its first implementation) or Domain (Domain and Persistence, with an optional Application project and an optional API class library). Use when standing up a new module after its CLAUDE.md exists.
---

# Create Module

Scaffolds a new module as an empty skeleton. A module is a set of class libraries that host services compose; it
never runs alone. Two archetypes, recorded in the module's CLAUDE.md:

- **Component** — a contracts project plus one or more implementations: a stateless adapter to an outside system.
- **Domain** — Domain and Persistence (plus an optional Application project and an optional API class library): owns
  its aggregates and its tables.

Afterwards the developer runs `create-aggregate` (Domain only) and `create-feature`.

## Assumes

- **The module's `CLAUDE.md`** exists (Precondition below), written by `create-module-claude-md`.
- **A solution file** and **central package management** (`central-package-management`).
- **Whatever shared projects the repo already has** — the module references only those its code uses; a repo with
  none builds the module against the .NET SDK and its packages alone.

<!-- nexus-gen coding-conventions sections="look-first" BEGIN -->
#### Look First

Before building anything a skill relies on — a guard helper, the central error mapper, a settings binder, an
aggregate or repository base, a save interceptor, an event publisher — look at what the repo already has: first
`project-lists.md` § Helpers, then the shared libraries, modules and packages the project can reach (its project
references and the central package file). Use what you find. Only otherwise build it once, in the shared place: the
lowest project every user of it already references; in a repo of one project, a `Shared` folder in it; where the
users share no project, a new shared project each of them references, with no reference cycle. Never a copy beside
each user. Add its row to `project-lists.md` § Helpers in the same change.
<!-- nexus-gen coding-conventions END -->

## Precondition

`src/Modules/{Name}/CLAUDE.md` must exist. If it is missing, stop:

> `src/Modules/{Name}/CLAUDE.md` not found. Ask the architect to run `create-module-claude-md` first.

## Steps

1. **Read the CLAUDE.md** — `workflows/ReadClaudeMd.md`: the archetype and every axis.
2. **Branch on archetype:**
   - **Component** → `workflows/ScaffoldComponent.md` (a first run creates the contracts project and the first
     implementation; a later run adds an implementation only).
   - **Domain** → `workflows/ScaffoldDomain.md`, then `workflows/ScaffoldDomainApplication.md` where the
     Application axis is yes, and `workflows/ScaffoldDomainApi.md` where the API axis is yes.
3. **Hold the module's reference rules** while writing the project files:
   - **A contracts project holds interfaces, records and settings only** — no behaviour — and exists only where the
     module has several implementations or several consumers.
   - **A module references its own contracts and the repo's shared libraries** — never another module, and its core
     projects never the web framework (only its optional API class library does). The exception is a module that
     orchestrates others: it may reference the modules it runs on, by the level rules the repo writes in that module's
     CLAUDE.md, and only those.
   - **A module's registration registers only its own services.** The modules are composed in one place, the host's
     composition, never inside another module.
   - **A module that owns tables owns its schema and its migration history** (`persistence-patterns` § Entity
     Configuration).
4. **Wire the infrastructure** — `workflows/ScaffoldInfrastructure.md`.
5. **Verify:**
   ```bash
   dotnet build src/{SolutionFile}
   rg -n 'ProjectReference Include=.\.\..\.\..[^.]' src/Modules/{Name} --glob '*.csproj'   # another module — expect zero unless the CLAUDE.md names it
   rg -n 'Microsoft.AspNetCore' src/Modules/{Name} --glob '!**/{Name}.API/**'               # no web framework outside the API library — expect zero
   ```
   The patterns hold no double quote and no doubled backslash, so PowerShell and Git Bash pass them to `rg`
   unchanged; a `.` stands for the quote and for either path separator.
6. **Report**, per archetype:
   - **Component:** "Module `{Name}` scaffolded with contract `{IContractName}` and implementation `{FirstImpl}`. A host
     references `{Name}.Contracts` and `{Name}.{FirstImpl}`; add implementations by re-running `create-module {Name}`."
   - **Domain:** "Module `{Name}` scaffolded. A host composes it with `services.Add{Name}Persistence(configuration)` and
     `app.Migrate<{Name}DbContext>()` (`persistence-patterns` § Migrations at Start-up){, and
     `app.Map{Name}Endpoints()` with an API library}. Run `create-aggregate` next."

## Arguments

Pass the module name: `/create-module Audit`. The folder `src/Modules/{Name}/` exists with its `CLAUDE.md`.

## What this skill does NOT do

- No aggregates, events or value objects — `create-aggregate`; no first feature — `create-feature`.
- No host wiring — adopting a module is a deliberate change in the host's composition.
- No API gateway route — a module is reached through its host.
- No edit to the repo-root `CLAUDE.md` module table.
