# EF Core Conventions

Programming conventions for EF Core. Inlined into the developer and reviewer agents.

## Navigation Loading

- `ThenInclude` chains continue from the last included navigation. Pattern: `Include(o => o.Lines).ThenInclude(l => l.Product).ThenInclude(p => p.Supplier)`.
- `Contains` on a fetched `List<string>` translates to SQL `IN (...)` correctly. For very large sets this would need batching, but assume the dataset here is bounded.
- **Missing `ThenInclude` causes silent null/zero — not a runtime error.** When service logic accesses `line.Product?.Category` but the repository only includes `line` (not `.ThenInclude(l => l.Product)`), the navigation property is null. Computations silently produce 0 or skip entries. Always match `ThenInclude` depth to the deepest navigation property accessed in downstream service code.

## Cross-Aggregate Queries

- For analytic queries that join across aggregates, add the query method to the repository that owns the primary data (e.g., `TicketRepository` for status transitions). Don't create a separate read-model query class until the pattern recurs.

## Migrations

- `dotnet ef migrations remove --force` works cleanly when the migration has not been applied to a database. No need to delete files manually.
- When running `dotnet ef migrations add` with FastEndpoints and no endpoints are registered yet, the host startup fails. Add `IDesignTimeDbContextFactory` in the Persistence project to bypass this.
- **A generated `DropColumn` + `AddColumn` pair for the same logical data destroys existing rows — hand-edit it to `RenameColumn`.** EF Core scaffolds drop+add (not a rename) whenever it can't detect that a column was renamed across a schema change — e.g. when flat scalars are regrouped into a `ComplexProperty`/owned VO and the column prefix changes (`BugRatioTarget` → `BugRatio_Target`). Drop+add wipes the values; on a seeded singleton (sync/Xray config) that silently resets production data on deploy. **Read every generated migration immediately after `dotnet ef migrations add`, before declaring the step done** — if it contains `DropColumn` + `AddColumn` for the same data, replace them with `migrationBuilder.RenameColumn(...)`. The green build does not prove the migration is rename-not-drop; that is the one failure that silently destroys data.

## Migration Defaults

- **Verify `defaultValue` in `AddColumn` migrations matches the entity property initializer.** EF Core scaffolds the CLR default (`false` for `bool`, `0m` for `decimal`) unless `HasDefaultValue` is configured. This is almost always wrong for columns with a meaningful default (e.g., `IsActive = true`, `BugRatioTarget = 30m`). Compare every new `AddColumn<T>` migration default against both the C# property initializer and `CreateDefault()` factory. If they differ, set `HasDefaultValue(...)` in the entity configuration so EF generates the correct default, then regenerate or patch the migration.

## Additional Gotchas

- `First` vs `FirstOrDefault` at service boundaries: even in single-user SQLite apps, prefer `FirstOrDefault` with null handling over `First` which throws an unhandled 500.
- `required int` on composite key members is more defensively correct than plain `int` — int defaults to 0 which can silently produce invalid FK records.
- `HasData` + `ToJson()` are incompatible. EF Core cannot seed entities via `HasData` when the entity (or an owned type on it) uses `ToJson()` column mapping. Use runtime seeding (`SeedTestData`) instead.
- Collection expressions (`[]`) fail in expression tree lambdas. EF Core translates lambdas to SQL via expression trees. C# 12 collection expressions are not representable as expression trees — use `new List<T>()` or `Array.Empty<T>()` explicitly.
