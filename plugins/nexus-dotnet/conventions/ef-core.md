# EF Core Conventions

Rules for code that stores data through EF Core. The `persistence-patterns` skill carries the repository, the
context and the table configuration.

## Queries

- **`.AsNoTracking()` on every read-only query** — reads for a reply, reports, background reads.
- **Never read a navigation property in a loop without `.Include()`** — that is N+1.
- **`.AsSplitQuery()` when including 2 or more collection navigations** at the same level — it avoids a Cartesian
  explosion.
- **Project with `.Select()` in the database**, instead of loading whole entities and mapping afterwards.
- **No EF calls in a loop for bulk work.** Use `ExecuteUpdateAsync` / `ExecuteDeleteAsync`.
- **Don't return `IQueryable<T>` from a method.** Compose the predicates in one place, then materialize. The one
  seam is a repository base's `Query()`, composed only by the repository that derives the base — never handed to a
  caller outside it.
- **Check the generated SQL of a `GroupBy`** on an `IQueryable` — it can pull every row to the client.
- **Repositories call `SaveChangesAsync`;** an endpoint or a handler never touches the context directly.

## Navigation Loading

- `ThenInclude` continues from the last included navigation:
  `Include(o => o.Lines).ThenInclude(l => l.Product).ThenInclude(p => p.Supplier)`.
- `Contains` on a fetched `List<string>` translates to SQL `IN (...)`. A very large set needs batching.
- **A missing `ThenInclude` gives a silent null or zero, not an error.** When code reads `line.Product?.Category` but
  the repository included only `line`, the navigation is null and a computation quietly yields 0 or skips entries.
  Match the `ThenInclude` depth to the deepest navigation the calling code reads.

## Cross-Aggregate Queries

- A query that joins several aggregates goes on the repository that owns the primary data (`OrderRepository` for
  order status history). A read-only query with a home of its own goes in a read store, named `…ReadStore`.

## Migrations

- `dotnet ef migrations add {Name} -p {Svc}.Persistence -s {Svc}.API` (project paths as the repo lays them out).
- `dotnet ef migrations remove --force` works cleanly while the migration is not applied to a database.
- When `dotnet ef migrations add` fails because the host cannot start (a FastEndpoints service with no endpoints yet),
  add an `IDesignTimeDbContextFactory` in the Persistence project.
- **A generated `DropColumn` + `AddColumn` pair for the same data destroys existing rows — hand-edit it to
  `RenameColumn`.** EF scaffolds a drop and an add whenever it cannot tell a column was renamed — for example when
  flat members are regrouped into a `ComplexProperty` or an owned value object and the column prefix changes
  (`DiscountRate` → `Discount_Rate`). On a seeded settings row that silently resets production data on deploy.
  **Read every generated migration right after `dotnet ef migrations add`,** and replace such a pair with
  `migrationBuilder.RenameColumn(...)`. A green build does not prove it.

## Migration Defaults

- **The `defaultValue` of an `AddColumn` must match the property's initializer.** EF scaffolds the CLR default
  (`false`, `0m`) unless `HasDefaultValue` is configured — almost always wrong for a column with a meaningful default
  (`IsActive = true`, `DiscountRate = 30m`). Compare every new `AddColumn<T>` default with the property initializer
  and the factory's default; where they differ, set `HasDefaultValue(...)` in the table configuration and regenerate
  or patch the migration.

## Additional Gotchas

- **A required lookup goes through the guard helper** that throws not-found (`…OrThrowAsync`), which the central
  mapper turns into a 404; an optional lookup uses `FirstOrDefaultAsync` and its caller decides. Never `First`, which
  throws an unhandled 500.
- `required int` on composite key members — a plain `int` defaults to 0 and can silently produce an invalid foreign
  key.
- `HasData` and `ToJson()` do not combine: EF cannot seed an entity through `HasData` when it (or an owned type on it)
  uses `ToJson()` column mapping. Seed it at run time, in development only.
- Collection expressions (`[]`) fail inside expression-tree lambdas, which EF translates to SQL — use
  `new List<T>()` or `Array.Empty<T>()` there.
