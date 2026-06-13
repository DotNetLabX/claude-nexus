---
name: central-package-management
description: Introduces Central Package Management — Directory.Packages.props at src/ root, bare PackageReference in csproj files, three-form verification grep. Use when setting up CPM or auditing a project for stray version declarations.
user-invocable: true
---

# Central Package Management

Introduces or audits **Central Package Management (CPM)** for a .NET solution. One `Directory.Packages.props` at the solution `src/` root declares every package version; `.csproj` files use bare `<PackageReference Include="..."/>` with no `Version` attribute.

## The CPM Convention

- **CPM** — `Directory.Packages.props` at `src/`, `ManagePackageVersionsCentrally=true`, bare `<PackageReference>` in every `.csproj`. (Where a project records this as an ADR, the convention is what matters, not the number.)

## When to Use

- Setting up CPM on a project that has per-`csproj` `Version=` attributes.
- Auditing a project after a package-version bump to confirm no stray versions remain.
- Cross-referencing with `framework-currency` when bumping to latest stable versions.

## The Props File

Create `src/Directory.Packages.props` (one file at the `src/` root, not per-project):

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
    <CentralPackageTransitivePinningEnabled>true</CentralPackageTransitivePinningEnabled>
  </PropertyGroup>
  <ItemGroup>
    <!-- Group by concern for readability -->
    <PackageVersion Include="FastEndpoints" Version="8.1.0" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore" Version="10.0.8" />
    <!-- ... one <PackageVersion> per package ... -->
  </ItemGroup>
</Project>
```

- `ManagePackageVersionsCentrally=true` — enables CPM; MSBuild will error if any `.csproj` declares a `Version` attribute.
- `CentralPackageTransitivePinningEnabled=true` — also pins transitive dependencies, preventing accidental upgrades via dependency graphs.
- One `<PackageVersion Include="..." Version="..."/>` per package — no version declared anywhere else.

**Illustrative example:** a real `src/Directory.Packages.props` typically runs to dozens of `<PackageVersion>` entries grouped by concern with comments. The "after" state of a fully migrated solution is one such file at `src/` plus `.csproj` files that carry only bare references.

## Bare References in `.csproj`

Every `<PackageReference>` in every `.csproj` must have **no** `Version` attribute and **no** `<Version>` child element:

```xml
<!-- CORRECT — bare reference, version from Directory.Packages.props -->
<ItemGroup>
  <PackageReference Include="FastEndpoints" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.Design">
    <PrivateAssets>all</PrivateAssets>
    <IncludeAssets>runtime; build; native; contentfiles; analyzers</IncludeAssets>
  </PackageReference>
</ItemGroup>

<!-- WRONG — version declared in csproj -->
<PackageReference Include="FastEndpoints" Version="8.1.0" />
```

Other child elements (`PrivateAssets`, `IncludeAssets`) are **preserved** — they are not version declarations.

## Migration Recipe

1. **Collect all package versions** — scan every `.csproj` for all three version-declaration forms (see Verification Grep below): inline `Version="..."` attributes, child `<Version>` elements, and `VersionOverride="..."` attributes. For each hit, record the package name and the version value.
2. **Create `src/Directory.Packages.props`** with a `<PackageVersion Include="X" Version="Y"/>` entry for every collected package.
3. **Strip all version declarations from every `.csproj`**:
   - Remove inline `Version="..."` attributes from `<PackageReference>` elements.
   - Remove child `<Version>...</Version>` elements — move their value into `Directory.Packages.props` instead.
   - Remove `VersionOverride="..."` attributes — if the override was intentional, document the reason and consider whether to keep it as an explicit CPM `VersionOverride` or normalise into the central version.
   - **Preserve** all other attributes and child elements (`PrivateAssets`, `IncludeAssets`, etc.).
4. **Run the verification grep** (see below).
5. **Build** — `dotnet build` confirms CPM is wired correctly. MSBuild will error on any remaining `Version=` or `VersionOverride=` declaration in a `.csproj`.

## Verification Grep — Three Forms

A project is clean only when **all three version-declaration forms** are absent from `.csproj` files. Use the portable `--include` / `--glob` flag form — do **not** use `src/**/*.csproj` with bare `grep` (globstar is off by default in many shells including Windows bash and CI environments; the `**` pattern would silently match nothing).

**Form 1 — Inline `Version` attribute:**
```
grep -rn --include="*.csproj" 'Version="' src/
```
Matches: `<PackageReference Include="X" Version="1.0" />`

**Form 2 — Child `<Version>` element:**
```
grep -rn --include="*.csproj" '<Version>' src/
```
Matches:
```xml
<PackageReference Include="X">
  <Version>1.0</Version>
</PackageReference>
```

**Form 3 — `VersionOverride` attribute:**
```
grep -rn --include="*.csproj" 'VersionOverride=' src/
```
Matches: `<PackageReference Include="X" VersionOverride="1.0" />` — a CPM escape hatch that overrides the central version for one project. Legitimate only when intentionally overriding; flag every hit for review.

With ripgrep (`rg`), use `--glob` instead of `--include`:
```
rg -n 'Version="' --glob '*.csproj' src/
```

**Expected output after clean migration:** all three greps return zero hits in `.csproj` files (`Directory.Packages.props` itself intentionally declares versions — its hits are expected and correct). The three-form grep is a general requirement to run against any project that has not yet been confirmed clean.

## Interplay with `framework-currency`

Bumping packages to latest via CPM can surface transitive breaking changes beyond the targeted package. Example: upgrading a package that depends on `Refit` may pull a major Refit version with breaking API changes. Always build and run after a version bump. See `framework-currency` for the FastEndpoints `Send.*` currency rule and the version-bump caution.

## What This Skill Does NOT Cover

- Choosing which version to upgrade to — verify against the package's release notes.
- Transitive dependency resolution beyond `CentralPackageTransitivePinningEnabled` — see MSBuild / NuGet docs.
- Framework version targeting (`<TargetFramework>`) — that is the framework-currency convention; see `framework-currency`.
