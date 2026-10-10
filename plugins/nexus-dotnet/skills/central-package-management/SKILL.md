---
name: central-package-management
description: Introduces or audits Central Package Management — one Directory.Packages.props at the solution root holding every version, bare PackageReference lines in project files, the pin rule, and the three-form verification search. Use when setting up central package management, bumping a version, or auditing a solution for stray version declarations.
user-invocable: true
---

# Central Package Management

One `Directory.Packages.props` at the solution's `src/` root declares every package version; project files carry
bare `<PackageReference Include="…" />` lines with no version.

## Assumes

- **A .NET solution** built with MSBuild and NuGet.
- No shared library. Where the repo has one, its services use the versions that library uses; without one, the
  current stable version of each package.

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

## The CPM Convention

- **One version of each package, set once,** in `src/Directory.Packages.props`, with
  `ManagePackageVersionsCentrally` on. A `<PackageReference>` carries no version.
- **The version is current stable**, or the shared library's where the repo has one — never a number copied from
  another project's file.
- **A pin.** A package the dependency graph would otherwise lift to a newer version, kept back on purpose, stays
  pinned in the props file with a one-line comment directly above it giving the reason. That comment is the only
  comment a package file carries.

## When to Use

- Setting up central management on a solution whose project files carry versions.
- After a version bump, to confirm no stray version remains.
- Beside `framework-currency` when moving to the latest stable versions.

## The Props File

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
    <CentralPackageTransitivePinningEnabled>true</CentralPackageTransitivePinningEnabled>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="FastEndpoints" Version="{current stable}" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore" Version="{current stable}" />
    <!-- Pinned: version 3 changes the token format the mobile app still reads -->
    <PackageVersion Include="System.IdentityModel.Tokens.Jwt" Version="{the pinned version}" />
  </ItemGroup>
</Project>
```

- `ManagePackageVersionsCentrally` — turns central management on; a project file that declares a version fails the
  build.
- `CentralPackageTransitivePinningEnabled` — also pins transitive dependencies, so no graph lifts a package
  silently.
- `{current stable}` is the latest stable version on NuGet the day the line is written — read it there, not from
  memory.

## Bare References in `.csproj`

Every `<PackageReference>` has no `Version` attribute and no `<Version>` child; other attributes stay:

```xml
<ItemGroup>
  <PackageReference Include="FastEndpoints" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.Design" PrivateAssets="all" />
</ItemGroup>
```

Project files set nothing beyond the basics: no documentation-file generation, no warning suppressions (except the
one a pinned package needs), no comments.

## Migration Recipe

1. **Collect every version** — all three forms of the search below; record each package and its version.
2. **Write `src/Directory.Packages.props`** with one `<PackageVersion>` per package, at its current stable version
   unless a pin with a reason keeps it back.
3. **Strip every version from every project file** — the `Version` attribute, the `<Version>` child, and
   `VersionOverride` (keep an override only with a stated reason, as a pin).
4. **Run the search** again — zero hits in project files.
5. **Build** — `dotnet build`.

## Verification Search — Three Forms

```bash
rg -n 'Version=' --glob '*.csproj' src/             # an inline Version attribute
rg -n '<Version>' --glob '*.csproj' src/            # a Version child element
rg -n 'VersionOverride=' --glob '*.csproj' src/     # an override — legitimate only as a stated pin
```

All three return zero hits in project files; `Directory.Packages.props` declares versions by design. (With plain
`grep`, use `-rn --include="*.csproj"`; a `src/**/*.csproj` pattern matches nothing where the shell has no globstar.)

## Nested Props Check — expect exactly one

MSBuild picks the **nearest** `Directory.Packages.props`, so a nested one silently overrides the root for the
projects under it — and the three-form search cannot see it. Count the files:

```bash
rg --files -g 'Directory.Packages.props' src/
```

Exactly one hit, `src/Directory.Packages.props`. Fold any nested file into the root, or state why it stays.

## Interplay with `framework-currency`

A bump can bring a breaking change through a transitive package beyond the one bumped. Build and run after every
bump; `framework-currency` owns the currency rule.

## What This Skill Does NOT Cover

- Which version to move to — read the package's release notes.
- Transitive resolution beyond transitive pinning — the NuGet documentation.
- The target framework (`<TargetFramework>`) — `framework-currency`.
