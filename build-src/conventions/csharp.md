# C# Conventions

Programming conventions for C# / .NET. Inlined into the developer, reviewer, and solo agents.

## Namespace Imports

- C# does not auto-import parent namespaces. When a class in `{App}.API.Features.Orders.PlaceOrder` consumes a class in `{App}.API.Features.Orders`, an explicit `using` is required.
- `GlobalUsings.cs` should exist in all three service projects (API, Domain, Persistence), not just API. Each project has its own frequently-used namespaces.

## Error Handling in Handlers

- Inside `HandleAsync`, throw domain exceptions (`NotFoundException`, `BadRequestException`, etc.). The `GlobalExceptionMiddleware` maps them to HTTP responses.
- `AddError`/`SendErrorsAsync` is only for FluentValidation pre-handler validation, not for handler business logic errors.

## Method Overrides

- Use `new` keyword when a derived repository overrides a base method signature (e.g., `UpsertAsync` with entity-specific field-copy logic). This is intentional hiding, not an accident — suppress CS0108.

## Type Conventions

- Use `sealed record` for DTOs, value objects, and domain events.
- Use `required init` properties for entity creation when no business rules or domain events are involved.

## Solution Format

- The solution file uses `.slnx` format (XML-based, .NET 10 default). Adding projects means adding `<Project Path="...">` entries under the appropriate `<Folder>` element.

---

## Method Design

- **~60 lines max per method.** Decompose at natural seams (validation, data construction, persistence, notification).
- **One level of abstraction per method.** Don't mix high-level orchestration with low-level field mapping.
- **Guard clauses first, happy path last.** No deep nesting — early returns flatten the structure.
- **Plan sub-steps ≠ one method.** Never mirror plan structure literally in code. A plan step with 5+ sub-operations = multiple private methods.

## Decomposition Judgment

- **Extract when:** the block has a clear name, is >15 lines, or is called from a loop body.
- **Don't extract when:** single-call, <10 lines, trivial try/catch, or would need 5+ parameters passed.
- **Prefer pure helpers over side-effectful helpers.** Separate data construction (returns data) from persistence (calls repos). Builder methods are testable and readable.
- **Rule of three for DRY.** Don't extract a helper for 2 call sites. Wait for 3.
- **Named records for 3+ field returns.** Tuples only for 2-field returns (e.g., `(int Count, bool Success)`).

## Async / Await

- **Never `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()`** — blocks thread, causes deadlocks.
- **Never `async void`** outside event handlers — unhandled exceptions crash the process.
- **Always propagate `CancellationToken`** as the last parameter. Pass it to every awaitable call downstream.
- **`throw;` not `throw ex;`** — preserves the original stack trace.
- **Use `ct.ThrowIfCancellationRequested()`** — don't silently return on cancellation.

## EF Core

- **`.AsNoTracking()` on all read-only queries.** GET endpoints, reports, background reads.
- **Never access navigation properties in a loop without `.Include()`.** This is N+1.
- **`.AsSplitQuery()` when including 2+ collection navigations** at the same level — avoids Cartesian explosion.
- **Project with `.Select()` at the database layer** — don't load entire entities and map afterward.
- **Don't use EF for bulk operations in loops.** Use `ExecuteUpdateAsync` / `ExecuteDeleteAsync` (EF Core 7+) for bulk work.
- **Don't return `IQueryable<T>` from methods.** Compose all query predicates in one place, then materialize.

## LINQ

- **`.Any()` over `.Count() > 0`** — `Any()` short-circuits; on EF it generates `EXISTS` vs `COUNT(*)`.
- **`.ToList()` before iterating twice.** `IEnumerable<T>` from a LINQ chain re-executes on each enumeration.
- **No LINQ for side-effectful operations.** Use `foreach` for upserts, API calls, anything with side effects.
- **Verify generated SQL when using `GroupBy`** on `IQueryable` — it can pull all rows to the client.

## Error Handling

- **Don't catch `Exception` without a filter or re-throw.** Swallowing the base type hides bugs.
- **Use exception filters** (`catch (HttpException ex) when (ex.StatusCode == ...)`) to narrow catches.
- **Don't use exceptions for expected control flow.** Validation failures, "not found" — these are domain results, not exceptions.
- **Order catch blocks most-derived first.** Otherwise specific handlers are unreachable.
- **Centralize unhandled exceptions via middleware** — endpoints let exceptions propagate, not catch-all.

## Null Handling

- **`ArgumentNullException.ThrowIfNull(param)`** at the top of public methods — shorter, analyzer-recognized.
- **`is not null` over `!= null`** — works correctly with overloaded equality operators.
- **Don't use `?.` as a silent suppressor** when you expect the value to always exist. Assert or throw.
- **Optional navigation properties are explicitly `?`** — required ones use `required` or constructor.

## Return Types

- **Return `IReadOnlyList<T>` from public methods** that return materialized collections — not `List<T>`.
- **Accept `IEnumerable<T>` or `IReadOnlyList<T>` as parameters** — not `List<T>`.
- **`Task<IReadOnlyList<T>>` over `Task<IEnumerable<T>>`** for async query methods — the data is already materialized.

## Records

- **Use `record` for:** DTOs, commands/queries, domain events, value objects.
- **Never use `record` for EF Core entities** — EF relies on reference equality and mutable state.
- **No `set` accessors on record properties** — use `init` if post-construction initialization needed.
- **`IReadOnlyList<T>` for collection properties on records** — shallow immutability doesn't protect `List<T>` contents.
- **Prefer non-positional `init` properties when extending positional records.** Adding a new positional parameter breaks all existing construction sites. Add `public T NewProp { get; init; }` in the record body instead — existing call sites compile unchanged.

## Naming by Intent

- **Methods = verb phrase.** If no verb fits, the method has unclear scope — split it.
- **Consistent verb prefixes:** `Get` (sync read), `Find` (may return null), `Build` (pure, returns data), `Sync`/`Persist` (side-effectful), `Extract`/`Parse` (static, transforms input).
- **Boolean = affirmative prefix:** `IsActive`, `CanEdit`, `HasChildren`. Never `NotActive`.
- **Events = past tense verb phrase:** `OrderPlaced`, `SprintClosed`. Never noun-only (`OrderEvent`).
- **Don't use:** `data`, `info`, `result`, `temp`, `obj`, `item` as variable names. Name by semantic content.

## Modern C# Idioms

- **Collection expressions `[]`** for empty or inline collections.
- **`var` when RHS makes type obvious.** Explicit type when return type is unclear from method name.
- **File-scoped namespaces** (`namespace X;`) — not the braced block form.
- **Declaration-form `using`** (`using var conn = ...;`) — not the block form when scope is rest of method.
- **Pattern matching** (`is`, `switch` expressions) over `is` + cast pairs.
- **`??` coalescing** for single-fallback. Multi-step fallback gets its own method.
- **`ArgumentOutOfRangeException.ThrowIfNegative`** and related static helpers (C# 11+) — not manual guard boilerplate.

## Domain Model (DDD reinforcements)

- **No public setters on entities.** State changes go through intention-named methods.
- **Collection navigation properties exposed as `IReadOnlyList<T>`** — never the internal `List<T>`.
- **Cross-aggregate references by ID only** — never navigation property.
- **Domain events raised after state transitions succeed** — they represent facts, not intents.
- **No database queries inside entity methods.** Queries belong in handlers or repositories.
