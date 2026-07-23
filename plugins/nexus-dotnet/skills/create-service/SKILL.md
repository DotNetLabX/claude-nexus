---
name: create-service
description: Scaffolds an empty service skeleton from its CLAUDE.md — folder tree, csproj files with references, GlobalUsings, DI wire-up stubs, Program.cs, Dockerfile. Use when standing up a new service after its CLAUDE.md exists (run create-aggregate and create-feature afterward for the business code). Creates no business classes.
---

# Create Service

Scaffolds a new service as an empty skeleton — folders, csproj files with correct references, infrastructure wire-up (Program.cs, DI stubs, appsettings, Dockerfile, docker-compose entry), but **no business classes**. After this skill runs the Developer runs `create-aggregate` for the first aggregate and `create-feature` for the first feature.

## Assumes

This skill scaffolds a service in the shape of the reference app (dotnet-microservices). It presumes:

- **The BuildingBlocks packages** the csproj references pull in — `Blocks.Domain` (Domain layer),
  `Blocks.Core` (Application), `Blocks.MediatR` (MediatR variants), `Blocks.EntityFrameworkCore` /
  `Blocks.Redis` (Persistence), `Blocks.AspNetCore` / `Blocks.FastEndpoints` (API). The exact reference
  set is in `workflows/ScaffoldCsprojFiles.md`.
- **MediatR** for the Carter / Minimal-API variants (the FastEndpoints variant is inline-handler).
- **The `create-service-claude-md` precondition** — the service's `CLAUDE.md` already exists (see
  Precondition below); this skill reads its axes, it does not invent them.
- **The reference app's solution / folder layout** — `src/Services/{Svc}/…`, a `BuildingBlocks/` tree,
  a `docker-compose` file.

**If the target repo has no BuildingBlocks** — a standalone service, a fresh solution — do not scaffold
the `Blocks.*` packages just to satisfy the references. Follow the **Minimal-stack branch** below.

## Precondition

`src/Services/{Name}/CLAUDE.md` must already exist. It is produced by the Architect's `create-service-claude-md` skill. If the file is missing, **hard-error**:

> `src/Services/{Name}/CLAUDE.md` not found. Ask the Architect to run `create-service-claude-md` first.

Do not proceed without the CLAUDE.md.

## Steps

1. **Read the CLAUDE.md** — follow `workflows/ReadClaudeMd.md`. Extract every axis into a mental model.

2. **Create the folder tree** — follow `workflows/ScaffoldFolders.md`. Empty placeholder folders so it is obvious where things go.

3. **Create the csproj files with correct references** — follow `workflows/ScaffoldCsprojFiles.md`. Branches by framework, persistence, and shared-state axes.

4. **Scaffold the `.API` project files** — follow `workflows/ScaffoldApiProject.md`. Branches by endpoint framework.

5. **Scaffold the `.Domain` project files** — follow `workflows/ScaffoldDomainProject.md`. Mostly empty plus `GlobalUsings.cs`.

6. **Scaffold the `.Persistence` project files** — follow `workflows/ScaffoldPersistenceProject.md`. Branches by persistence technology.

7. **Scaffold the `.Application` project files** (conditional) — follow `workflows/ScaffoldApplicationProject.md`. Only when the CLAUDE.md says shared-state = Y.

8. **Scaffold the infrastructure** — follow `workflows/ScaffoldInfrastructure.md`. Updates `the solution file`, `docker-compose.yml`, `docker-compose.dcproj`. Runs `dotnet sln add` inline.

9. **Verify:** `dotnet build`. The solution must compile cleanly with only the empty skeleton.

10. **Report to the user:**
    > Service `{Name}` scaffolded. Run `create-aggregate` next for the first aggregate, then `create-feature` for the first feature.

## Minimal-stack branch (no BuildingBlocks)

Use this when the service is **standalone** — no `Blocks.*` packages, often a fresh solution or a single
service rather than the microservices estate. The layered shape (Domain / Persistence / Application / API)
still holds; what changes is every fork point that reaches for a BuildingBlock. Author fresh — there is
nothing to promote from the reference app here.

At each csproj / DI fork in `workflows/ScaffoldCsprojFiles.md` and the `Scaffold*Project.md` workflows,
substitute:

- **Packages, not BuildingBlocks references.** Drop the `..\..\..\BuildingBlocks\Blocks.*` project
  references. Add the underlying NuGet packages directly where they are used — e.g.
  `Microsoft.EntityFrameworkCore` plus a provider in `.Persistence`, `FluentValidation` in the validator's
  project — instead of inheriting them transitively through a `Blocks.*` package.
- **Inline base classes, or none.** `Blocks.Domain` supplies the `Entity` / `AggregateRoot` / value-object
  bases. Without it, either declare a tiny inline `Entity` / `AggregateRoot` base in `.Domain` (see the
  `domain-patterns` zero-dependency variant) or skip the base entirely and use plain classes.
- **SQLite-first, raw provider config.** Prefer SQLite for a standalone service
  (`UseSqlite("Data Source=app.db")`) — no SQL Server / Postgres container to stand up. For PostgreSQL use
  raw Npgsql (`UseNpgsql(...)`) configured directly in the Persistence DI, not a `Blocks` EF extension.
- **No MediatR.** Skip `Blocks.MediatR` and the `.Application` MediatR wiring; put handler logic inline in
  the endpoint (the FastEndpoints endpoint-only shape from `create-feature`) or in a plain service class
  the endpoint calls.
- **Skip the estate infrastructure** that assumes the microservices repo — `docker-compose` entries, the
  API-gateway route, the shared `{ProjectName}.Security` / `.Abstractions` packages — unless the standalone
  service genuinely needs them.

The result compiles against the .NET SDK alone. Promote to the full BuildingBlocks stack only if the
service later joins the microservices estate.

## Arguments

Pass the service name: `/create-service Indexing`

The folder `src/Services/Indexing/` must already exist with a `CLAUDE.md` inside (from the Architect skill). The skill reads the axes from that file.

## What this skill does NOT do

- No aggregates, no features, no domain classes — those come from `create-aggregate` and `create-feature`.
- No API Gateway (YARP) route registration. If the service needs to be reachable via the gateway, the Developer adds the route manually in `ApiGateway/` after this skill runs.
- No migrations — run `dotnet ef migrations add InitialCreate` manually after `create-aggregate`.
- No root CLAUDE.md update — the service table in the repo-root CLAUDE.md is edited manually.
