# Scaffold Domain Project

Create the `.Domain` project source files. The domain project is intentionally thin at scaffold time — only `GlobalUsings.cs` and empty folders. Aggregates, value objects, and domain events are added by the Developer later via `create-aggregate`.

## `{Name}.Domain/GlobalUsings.cs`

**Reference:** `src/Services/{Svc}/{Svc}.Domain/GlobalUsings.cs`

```csharp
global using Blocks.Entities;
global using {ProjectName}.Abstractions;
```

Match the live exemplar (`{Svc}.Domain/GlobalUsings.cs` imports `Blocks.Entities`). The domain base types
(`Entity`, `AggregateRoot`, value-object bases) are exposed under the **`Blocks.Entities`** namespace —
there is no `Blocks.Domain.ValueObjects` namespace to import. Add more usings only if a specific aggregate
needs them later.

## Empty folders

These were already created by `ScaffoldFolders.md`. Confirm each has a `.gitkeep` if your file system does not track empty directories:

- `{Name}.Domain/Entities/` — aggregates and entities
- `{Name}.Domain/Events/` — domain events
- `{Name}.Domain/ValueObjects/` — value objects and enums

## No other files

Do not create:
- A sample aggregate — `create-aggregate` handles this.
- A base class — use the shared building-block base types (namespace `Blocks.Entities`).
- `DependencyInjection.cs` — the domain project has no DI registrations.

## After this step

The `.Domain` project compiles as an empty shell. Next: `ScaffoldPersistenceProject.md`.
