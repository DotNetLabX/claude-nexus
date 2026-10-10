---
name: create-building-blocks-package
description: Scaffolds a new shared library — a project the repo's services and modules reference for an app-agnostic primitive or infrastructure concern — with its project file, its read-me, its test project and its solution registration, and carries the rules a shared library follows. Use when a reusable concern needs its own shared project. A repo with no shared library never needs it.
---

# Create Building Blocks Package

Scaffolds a new shared library and carries the rules every shared library follows. A shared library holds
app-agnostic primitives and infrastructure — no knowledge of any one application. A repo that has none never meets
this skill: its helpers live in the shared place the conventions' Look First describes.

## Assumes

- **A solution with shared projects**, under one folder (`src/Shared/`, `src/BuildingBlocks/` — the repo's choice) and
  one name prefix the repo already uses.
- **Central package management** (`central-package-management`) and a test framework the repo already uses.

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

## When to Use

- A concern several services or modules need, which no existing shared library covers — Look First found nothing.
- An existing shared library has grown past one concern and splits.
- A plan step names a new shared library.

## Shared Library Rules

These hold for a shared library and only for one; service and module code follows the conventions instead.

- **Internals stay internal.** Everything public in a shared library is a promise to every project that uses it, so
  only the entry points are public; its own test project may be its friend (`InternalsVisibleTo`). (Inside a service
  or module the opposite holds: every top-level type is public.)
- **Its public entry points guard their arguments,** with the static throw helpers (`ArgumentNullException.ThrowIfNull`,
  `ArgumentOutOfRangeException.ThrowIfNegative`) — callers it cannot see may pass anything. A service has no such
  preamble.
- **A short read-me** in the library's folder says what it is for and how to register it. A member is documented only
  where its behaviour cannot be read from its signature; no documentation comment otherwise.
- **It carries its own tests,** in its own test project.
- **One version of each package.** The services that use the library follow the versions the library uses; the
  library itself moves to the current stable version, in the central package file.
- **Its own code may read the system clock and reads its settings through its own binder** — the clock and settings
  rules of the services do not bind it.

## Steps

1. **Look first** — search the shared folder for the concern and its types; confirm no library covers it.
2. **Create the folder** — `src/{SharedFolder}/{Prefix}.{Concern}/`.
3. **Create the project file:**
   ```xml
   <Project Sdk="Microsoft.NET.Sdk">

     <PropertyGroup>
       <TargetFramework>net10.0</TargetFramework>
       <ImplicitUsings>enable</ImplicitUsings>
       <Nullable>enable</Nullable>
     </PropertyGroup>

   </Project>
   ```
   Read the `TargetFramework` of an existing shared project rather than assuming one. Add package references (no
   versions) and references to other shared libraries only as the code needs them.
4. **Write the read-me** — `README.md` in the folder: purpose, registration line, one usage sample.
5. **Create its test project** — `{Prefix}.{Concern}.Tests`, referencing the library.
6. **Add both to the solution** — `dotnet sln add …`.
7. **Build and test** — `dotnet build`, `dotnet test`.
8. **Report** — what was created and which services or modules should reference it.

## Arguments

Pass the concern's name: `/create-building-blocks-package Messaging`

## Naming Convention

- **The repo's prefix, then the concern** — `{Prefix}.Messaging`, `{Prefix}.Redis`, `{Prefix}.EntityFrameworkCore`.
- **Named for a technology or a concern,** never for a business domain, and never a catch-all (`Common`, `Utils`,
  `Shared`).
- **Shallow and single-concern** — one library per concern, at the granularity the repo's existing libraries have.

## What This Skill Does NOT Do

- Add the reference to the services that will use it — the developer does, with the feature that needs it.
- Create an application-specific library — a shared library knows no application.
- Create a module's contracts — `create-module`.
