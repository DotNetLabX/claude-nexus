# Scaffold Domain Project

The Domain project is thin at scaffold time — its `GlobalUsings.cs`, nothing else. Aggregates, value objects and
events come later, from `create-aggregate`.

## `{Name}.Domain/GlobalUsings.cs`

Only the namespaces the domain will use — the aggregate base's, where the repo keeps it in a shared project, and
the shared types it references by fit:

```csharp
global using {Shared}.Domain;
```

A repo with no shared domain project leaves the file empty until the first aggregate needs a namespace; where the
aggregate base does not exist yet, `create-aggregate` builds it once under Look First.

## No other files

- No sample aggregate — `create-aggregate`.
- No base class of its own when the repo has one — look first.
- No `DependencyInjection.cs` — the Domain project registers nothing.

## After this step

Next: `ScaffoldPersistenceProject.md`.
