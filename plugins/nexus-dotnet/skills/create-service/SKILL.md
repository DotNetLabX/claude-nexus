---
name: create-service
description: Scaffolds an empty service skeleton from its CLAUDE.md — folder tree, project files with their references, GlobalUsings, registration stubs, Program.cs, Dockerfile — with no business classes. Use when standing up a new service after its CLAUDE.md exists; create-aggregate and create-feature add the business code afterwards.
---

# Create Service

Scaffolds a new service as an empty skeleton — folders, project files with the right references, start-up and
registration stubs, settings, Dockerfile and compose entry — and **no business classes**. Afterwards the developer
runs `create-aggregate` for the first aggregate and `create-feature` for the first feature.

## Assumes

- **The service's `CLAUDE.md`** exists (Precondition below) and names its axes: endpoint framework, database,
  Application project or not, gRPC, integration events, file storage, Docker.
- **A solution file** (`.slnx`) and **central package management** (`central-package-management`).
- **Whatever shared projects the repo already has** — shared libraries, modules, contracts projects. The skill
  references the ones the service needs and nothing else; a repo with none builds the service against the .NET SDK
  and its packages alone.

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

`src/Services/{Name}/CLAUDE.md` must exist; `create-service-claude-md` writes it. If it is missing, stop:

> `src/Services/{Name}/CLAUDE.md` not found. Ask the architect to run `create-service-claude-md` first.

## Steps

1. **Read the CLAUDE.md** — `workflows/ReadClaudeMd.md`: every axis into a working model.
2. **Create the folder tree** — `workflows/ScaffoldFolders.md`.
3. **Create the project files** — `workflows/ScaffoldCsprojFiles.md`. References follow these rules:
   - **never another service's projects** — another service is reached by an integration event or a gRPC client,
     through a contracts project;
   - **modules selectively** — only the modules the service runs on, each by its contracts project where it has one;
   - **only the shared libraries the service needs** — a reference is added when the first line using it is written;
   - **no project references an API project.**
4. **Scaffold the API project** — `workflows/ScaffoldApiProject.md`. It holds its features, its usings and its
   registration, nothing else. Generic web parts — rate limiting, security headers, the origin check,
   request-failure logging, readiness checks — are shared pieces: found in the repo's shared libraries, or built
   once in the shared place under Look First, never inside one service's API project.
5. **Scaffold the Domain project** — `workflows/ScaffoldDomainProject.md`.
6. **Scaffold the Persistence project** — `workflows/ScaffoldPersistenceProject.md`.
7. **Scaffold the Application project** where the CLAUDE.md says so — always in the mediator style, and in a
   FastEndpoints service that holds shared application pieces (a state machine, the access checker) —
   `workflows/ScaffoldApplicationProject.md`.
8. **Wire the infrastructure** — `workflows/ScaffoldInfrastructure.md`: the solution, the Dockerfile, the compose
   entry.
9. **Verify** — § Verify below.
10. **Report:** "Service `{Name}` scaffolded. Run `create-aggregate` next for the first aggregate, then
    `create-feature` for the first feature."

## Verify

Run each search over the new service's folder and read every hit. The searches read the reference text, not the
printed paths, so they read the same on Windows and Linux; each project sits one folder below the service folder, so
a reference that climbs two folders lands beside the service, and one that climbs three reaches the shared projects:

```bash
dotnet build src/{SolutionFile}                                                                  # compiles, no new warnings
rg -n 'ProjectReference Include=.(\.\..){2,}' src/Services/{Name} --glob '*.csproj'              # every outside reference — each a shared or contracts project
rg -n 'ProjectReference Include=.\.\..\.\..[^.]' src/Services/{Name} --glob '*.csproj'            # another service's project — expect zero
rg -n 'ProjectReference.*\.API\.csproj' src/Services/{Name} --glob '!**/{Name}.API/**'            # nothing references the API project — expect zero
rg -n 'Version=' src/Services/{Name} --glob '*.csproj'                                            # no version on a reference — expect zero
rg -n '<!--|NoWarn|GenerateDocumentationFile' src/Services/{Name} --glob '*.csproj'               # project files carry the basics only — expect zero
rg --files --hidden -g '.gitkeep' src/Services/{Name}                                             # no placeholder files — expect zero
```

The patterns hold no double quote and no doubled backslash, so they reach `rg` unchanged from PowerShell and from
Git Bash alike; a `.` stands for the quote and for either path separator.

## Arguments

Pass the service name: `/create-service Inventory`. The folder `src/Services/Inventory/` exists with its
`CLAUDE.md`.

## What this skill does NOT do

- No aggregates, features or domain classes — `create-aggregate`, `create-feature`.
- No API gateway route — added by hand where external clients must reach the service.
- No migrations — `dotnet ef migrations add InitialCreate` after the first aggregate.
- No edit to the repo-root `CLAUDE.md` service table.
