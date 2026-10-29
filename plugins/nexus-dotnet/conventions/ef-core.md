# EF Core Conventions

Rules for code that stores data through EF Core. The `persistence-patterns` skill carries the repository, the
context and the table configuration.

## Queries

- **A load that will be changed and saved is tracked; every other read is no-tracking.** A change loads through the
  repository's tracked `GetByIdAsync`; a read for a reply, a report or a background job is a named repository read
  over `QueryNotTracked()`.
- **Never read a navigation property in a loop without `.Include()`** — that is N+1.
- **`.AsSplitQuery()` when including 2 or more collection navigations** at the same level — it avoids a Cartesian
  explosion.
- **Project with `.Select()` in the database**, instead of loading whole entities and mapping afterwards.
- **No EF calls in a loop for bulk work.** Use `ExecuteUpdateAsync` / `ExecuteDeleteAsync`.
- **Don't return `IQueryable<T>` from a method.** Compose the predicates in one place, then materialize. The seams
  are the repository base's `Query()` and `QueryNotTracked()`, both protected and composed only by the repository
  that derives the base — never handed to a caller outside it.
- **Check the generated SQL of a `GroupBy`** on an `IQueryable` — it can pull every row to the client.
- **Every query written in C# is an EF Core query in a repository,** and no class reads with SQL. The repository is
  the unit of work: an endpoint, a handler or a consumer calls the repository's `SaveChangesAsync` and never touches
  the context directly.

## Navigation Loading

- `ThenInclude` continues from the last included navigation:
  `Include(o => o.Lines).ThenInclude(l => l.Product).ThenInclude(p => p.Supplier)`.
- `Contains` on a fetched `List<string>` translates to SQL `IN (...)`. A very large set needs batching.
- **A missing `ThenInclude` gives a silent null or zero, not an error.** When code reads `line.Product?.Category` but
  the repository included only `line`, the navigation is null and a computation quietly yields 0 or skips entries.
  Match the `ThenInclude` depth to the deepest navigation the calling code reads.

## Cross-Aggregate Queries

- A query that joins several aggregates goes on the repository that owns the primary data (`OrderRepository` for
  order status history), as a named read.

## Data Ownership <!-- id: data-ownership -->

- **Every service and business module owns its own tables and its own migration history.**
- **A business module defaults to its own schema in the database it shares; a service defaults to its own
  database.** Either may take the other: a module may keep a database of its own, and a service its own schema in a
  shared database.
- **No foreign key, join or shared table ever crosses from one unit's tables to another's.** A unit reaches another
  unit's data through that unit's contract — a call or an event — never through its tables.
<!-- id-end -->

## Migrations

- `dotnet ef migrations add {Name} -p {Svc}.Persistence -s {Svc}.API` (project paths as the repo lays them out); in a service a host
  runs, the start-up project is the host, `-s {Host}` (`create-host`).
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

- **A required lookup is a nullable read plus `.OrThrowNotFound(id)`,** the guard helper that throws not-found, which
  the central mapper turns into a 404; an optional lookup is the nullable read alone, and its caller decides. Never
  `First`, which throws an unhandled 500.
- `required int` on composite key members — a plain `int` defaults to 0 and can silently produce an invalid foreign
  key.
- `HasData` and `ToJson()` do not combine: EF cannot seed an entity through `HasData` when it (or an owned type on it)
  uses `ToJson()` column mapping. Seed it at run time, in development only.
- Collection expressions (`[]`) fail inside expression-tree lambdas, which EF translates to SQL — use
  `new List<T>()` or `Array.Empty<T>()` there.
