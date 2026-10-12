---
name: add-conventions-check
description: Adopts the shipped conventions check in a .NET repo — copies the check into the repo's architecture-test project, copies the lists file once, switches checks off by settings, and reads a failure. Use when a repo turns on the conventions check, sets up or repairs its architecture-test project for it, updates the check after a plugin update, or when a run fails with a convention rule id and someone needs to know what to change.
---

# Add Conventions Check

The plugin ships a test that reads a repo's C# and project files and fails on the mechanical rules of the
conventions — the token name, the `Async` suffix, one type per file, central package versions, and the rest. It is
an ordinary xUnit test, so the same suite fails code written by people and by agents, in CI and in the pipeline's
verify step. Adopting it is optional.

## Assumes

- **xUnit** with plain `Assert` (tested with xUnit v3) and **.NET 10**; no other package.
- **Central package management** for the test project's versions (`central-package-management`).
- **The check's files** in this skill's plugin, at `../../templates/conventions-check/` from this skill's base
  directory (the Skill tool states that directory when it loads the skill), and the example lists file at
  `../../templates/project-lists.md`.
- Without central package management, adapt by putting the three versions on the test project's references (its own
  project is not scanned), and switch `central-versions` off: the repo's other projects carry their versions too.

## Steps

1. **The test project.** Use the repo's architecture-test project where it has one; otherwise create one inside
   the folder that holds the central package file, since the build finds that file by walking up from the project:
   `src/{Repo}.ArchitectureTests` where it is `src/Directory.Packages.props`, a test folder beside `src` where it
   sits at the repo root. It references no project of the repo: the check reads files, not types.

   ```xml file=Conventions.Tests.csproj
   <Project Sdk="Microsoft.NET.Sdk">
     <PropertyGroup>
       <TargetFramework>net10.0</TargetFramework>
       <OutputType>Exe</OutputType>
       <Nullable>enable</Nullable>
     </PropertyGroup>
     <ItemGroup>
       <PackageReference Include="xunit.v3" />
       <PackageReference Include="xunit.runner.visualstudio" />
       <PackageReference Include="Microsoft.NET.Test.Sdk" />
     </ItemGroup>
   </Project>
   ```

   Add the three `PackageVersion` lines to the central file at current stable versions, and the project to the
   solution where the repo has one.
2. **Copy the check.** Copy every file of `../../templates/conventions-check/` into a `ConventionsCheck` folder of
   the test project, unchanged but for the one edit § What It Scans allows. The pattern table
   (`ConventionChecks.g.cs`) is the plugin's, generated from its rule list; after a plugin update, delete the folder
   and copy it again, so a file the update removed does not stay behind, then re-apply that one edit.
3. **Copy the lists file once.** Copy `../../templates/project-lists.md` to `docs/conventions/project-lists.md` when
   that file does not exist — never over an existing one: the repo owns it from then on. It holds the repo's helpers
   and the classes a rule lets break it (logging classes, shared-state caches, run-time settings); keep its four
   section headings and table headers as they are, since the check parses them.
4. **Settings, where needed.** A `conventions-check.json` beside the test project file:

   ```json
   {
     "off": ["attribute-order"],
     "roots": ["src"],
     "libraryRoots": ["src/Shared"],
     "listsFile": "docs/conventions/project-lists.md",
     "report": "artifacts/conventions-report.md"
   }
   ```

   Every key is optional. `off` switches checks off by id. `roots` replaces discovery. `libraryRoots` names the
   repo's shared-library folders, where the checks a shared library may break (documentation comments, argument
   guards, the system clock, settings and reply helpers) do not run. `listsFile` moves the lists file. `report` makes
   every run write a count report there: the total per check (checks switched off included, marked off), the count
   per project and check (a project is the nearest folder above the file holding a project file), then every
   finding as check, file and line. The report never changes a verdict — only a report that cannot be written fails
   the run — so point it at an ignored path and runs leave the tree clean. An unknown key or check id fails the run.

   A relative path resolves against the repo root; an absolute one is used as written. Two limits hold for a root
   outside the repo: finding paths stay relative to the repo root found above the test project, and the shared
   build files above that outside root are not read.
5. **Run it** — `dotnet test` on the test project — and read the failures (below). Fix the code, add the class to the
   lists file where the rule allows an exception, or switch the check off; a check switched off is a decision the
   repo records in its conventions.

## Sizing the Work Before Adopting

To know how much a repo breaks before deciding what to switch off, add the test project inside the repo (steps 1
to 3), leave `off` empty, set `report`, and run it once. The report gives the size per check and per project; switch
off what the repo will not fix now, and record why.

## What It Scans

- **The repo root** is the nearest folder above the test project holding `.git`, else a `.sln` or `.slnx`. Neither
  found fails the run, naming the folder it started from.
- **The roots** are `roots` from the settings, else the projects the solution lists, else every project file under
  the root. Build output (`bin`, `obj`) and generated files (`*.g.cs`, `*.designer.cs`, a file marked
  `<auto-generated>`, which covers migrations) are skipped.
- **The files** are `.cs` and the project files (`.csproj`, `.props`, `.targets`) under the roots, and the shared
  build files (`Directory.Packages.props`, `Directory.Build.props`, `Directory.Build.targets`) in every folder from a
  root up to the repo root — so a central package file in `src/` is read too.
- **The test project holding the check is never scanned,** so keep production code out of it.
- **A documentation comment counts once,** at its first line, however many `///` lines it runs to.
- **A test method is exempt from the `Async` ending** (`conventions/testing.md` § Naming, the backend one) when
  `Fact`, `Theory`, `Test`, `TestCase`, `TestCaseSource`, `TestMethod` or `DataTestMethod` names an attribute on its
  line or in the attribute lines directly above it, alone or in a shared list; a name inside an attribute's
  arguments never counts. An async helper in a test project still needs the ending, and every other check binds test
  code as written. A repo whose tests use another attribute switches the check off, or adds the name to the
  `async-suffix` entry's `UnlessAttribute` pattern in its copied `ConventionChecks.g.cs`. That table is the plugin's,
  as its header says: this is the one change to the copied files a repo makes, a fresh copy after an update drops
  it, and the repo re-applies it then.

## Reading a Failure

| The test that fails | What it says | What to do |
|---|---|---|
| `TheSourceFollowsTheRule({check-id})` | `{file}:{line} [{check-id}] {message}`, one line per place, then the settings file to switch it off in | fix each place; or add the class to the lists file where the message names it; or switch the check off |
| `TheScanReadsTheRepository` | the scan did not run: no repo root, no source file found, the lists file missing or unreadable, an unknown setting, a report that could not be written | fix what it names — every case names the path it tried |

When the scan fails, every rule case fails too, pointing at `TheScanReadsTheRepository`; fix that one first.

## What this skill does NOT do

- **Teach the rules themselves** — the conventions files and the job skills do; the check only holds the mechanical
  part of some.
- **Check the skills' own samples** — that is the plugin's own test, not a repo's.
- **Replace review** — most rules stay with the reviewer, because text alone cannot decide them.
