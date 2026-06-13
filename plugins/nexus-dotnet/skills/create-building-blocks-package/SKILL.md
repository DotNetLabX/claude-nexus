---
name: create-building-blocks-package
description: Scaffolds a new BuildingBlocks shared library package (Blocks.{Name}) with csproj, GlobalUsings, and solution registration. Use when a reusable, app-agnostic primitive or infrastructure concern needs its own shared package. App-agnostic reusable primitives only.
---

# Create Building Blocks Package

Scaffolds a new shared library in `src/BuildingBlocks/` following the `Blocks.{Name}` naming convention. BuildingBlocks packages are app-agnostic reusable primitives — they contain no project-specific knowledge.

## When to Use

- A reusable pattern or infrastructure concern needs to be shared across services/modules
- An existing package is growing too large and should be split
- A plan step specifies creating a new BuildingBlocks package

## Steps

1. **Verify the gap** — grep `src/BuildingBlocks/` for the package name and related types. Confirm no existing package covers this concern.

2. **Create the folder** — `src/BuildingBlocks/Blocks.{Name}/`

3. **Create the csproj** — follow the pattern from existing BuildingBlocks packages:
   ```xml
   <Project Sdk="Microsoft.NET.Sdk">
     <PropertyGroup>
       <TargetFramework>{current-tfm}</TargetFramework>
       <ImplicitUsings>enable</ImplicitUsings>
       <Nullable>enable</Nullable>
     </PropertyGroup>

     <ItemGroup>
       <!-- Add NuGet packages as needed -->
     </ItemGroup>

     <ItemGroup>
       <!-- Add ProjectReferences to other Blocks.* packages if needed -->
     </ItemGroup>
   </Project>
   ```

   Read an existing `Blocks.*.csproj` to get the current `TargetFramework` value — do not hardcode.

4. **Create GlobalUsings.cs** (if needed) — only if the package has common imports across its files.

5. **Add to solution** — run `dotnet sln add src/BuildingBlocks/Blocks.{Name}/Blocks.{Name}.csproj`.

6. **Verify the build** — `dotnet build` must pass.

7. **Report** — state what was created and which services/modules should reference it.

## Arguments

Pass the package name: `/create-building-blocks-package MassTransit`

## Naming Convention

- Always prefix with `Blocks.` — e.g., `Blocks.MassTransit`, `Blocks.Redis`, `Blocks.SignalR`
- Name after the technology or concern, not a business domain
- Match existing package granularity — check `src/BuildingBlocks/` for reference

## What This Skill Does NOT Do

- Add the package reference to consuming services — the developer does that as part of their feature work.
- Create app-specific packages — BuildingBlocks are technology adapters and infrastructure primitives only.
- Create module contracts — use `create-module` for that.
