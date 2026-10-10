# C# Conventions

Rules for all C# code: services, modules and shared libraries. A skill teaches the rules of its own job; these hold
everywhere. Two endpoint styles exist — FastEndpoints, or a mediator with minimal or Carter endpoints — and a rule
that belongs to one style says so. Where a rule allows a listed exception, the list is the repo's own
`project-lists.md` (see the conventions index), and a class enters it in the same change as the class.

## Classes and Methods

- **Records and classes.** Requests, replies, domain events and integration-event contracts are records; settings,
  entities and value objects are classes. A record is plain data — behaviour and factories live on classes, though a
  small computed member on a record does no harm. Never a record for an EF Core entity, and no `set` on a record
  member — except the acting user and time a stamping hook sets on a command, which the wire never sets.
- **Data shapes.** A shape is a record or a class. A tuple only as one two-element named pair; a record has at most
  about 13 positional members.
- **One type per file.** The exceptions: the command or query file (request, response, validator); a contract file
  holding one family (a service interface with its request and reply shapes); a `Models.cs` holding the shapes of
  another system's format; a named delegate beside the interface it serves; a private nested shape (below).
- **No nested types,** except a private shape that hides another system's format; where such shapes are shared they
  are top-level types in a `Models.cs`. Either form is fair for another system's format — pick one per repo.
- **A `_Shared` folder** sorts first in its feature area; its namespace is `.Shared`, without the underscore.
- **Primary constructors.** An explicit constructor only when its body builds state.
- **Every dependency is required.** No constructor parameter defaults to `null`, and no code path is chosen by a
  missing dependency.
- **Interfaces.** An interface only where production code has two or more implementations (a provider that can be
  swapped), or for an outside call a test must replace (a model, a database, another service). A test double is not a
  second implementation. An interface gives no member a body; a derived property is the one exception.
- **Visibility.** In a service and in a module every top-level type is public and there are no friend declarations
  (`InternalsVisibleTo`); the layer tests guard what may reference what. A shared library keeps its internals
  internal, because everything public there is a promise to every project that uses it; its own test project may be
  its friend.
- **Not sealed by default.** A leaf infrastructure type that faces a framework — a middleware, a filter, an event
  publisher, a consumer, a disposable scope, a design-time factory — may be sealed. Harmless either way; the default
  keeps the code free of noise.
- **No argument-checking preamble in a service.** No `ArgumentNullException.ThrowIfNull` and no guard block at the
  top of a method: inputs are validated at the edge, values are guarded in the domain, and the compiler's null
  checking covers the rest. A shared library does guard the arguments of its public entry points, with the static
  throw helpers (`ThrowIfNull`, `ThrowIfNegative`).
- **Names from the vocabulary.** Application logic lives in instance classes named for their job: handler, consumer,
  validator, repository, checker, factory, resolver, provider. `…Service` names a class around another system or a
  protocol, never application logic; no `Helper`, `Builder`, `Holder`, `Gate`, `Sink` or `Planner` classes, and no
  `Services/`, `Helpers/` or `Utils/` folders. A choice: whether a long multi-stage flow becomes one class per
  operation is tried on one class first, not decided in advance.
- **Extension methods.** A helper that extends a value is an extension method in a class named `Extensions` or
  `{Subject}Extensions`. A guard class, a seed class and a constants class stay static classes; registration classes
  have their own names. Apply it to real helpers only — not everything is an extension method.
- **Mapping by hand.** One shape is turned into another by hand-written code; a mapping library only where a shared
  library the repo uses needs it. A choice: hand mapping costs nothing when agents write it and the compiler checks
  it, while a mapping library moves mistakes to run time.
- **Collections by layer.** An entity keeps a private list and shows it read-only (`IReadOnlyList<T>`, or
  `IReadOnlyCollection<T>` over a set); requests, replies and shared shapes carry `List<T>` or `HashSet<T>`. Modern
  forms stay — collection expressions, patterns, source-generated regular expressions. A `switch` over a closed set
  of values is a sign the value should carry the answer itself.
- **The clock is injected.** Code that needs the time takes it from `TimeProvider`, so a test can set it; never
  `DateTime.UtcNow` or `DateTimeOffset.UtcNow` in a service or a module. A shared library's own code is exempt.
- **Order of members:** fields and constants, constructor, public, protected, private. Pure sameness — let a
  formatter do it; not worth a review comment.
- **Size targets, not hard checks.** A method stays under about 50 lines and takes one request object plus the
  cancellation token; a class takes about 6 dependencies at most; a hand-written file stays under about 200 lines. A
  class with many stages may honestly pass them — hold them in review, never as a gate.
- **`var` for locals; one-line members written as expressions** — except a FastEndpoints `HandleAsync`, which has a
  block body.

## Method Design

- **One level of abstraction per method.** Don't mix high-level orchestration with low-level field mapping.
- **Early returns, happy path last.** No deep nesting.
- **Plan sub-steps are not one method.** Never mirror plan structure literally in code; a plan step with 5+
  sub-operations becomes several private methods.
- **Extract when** the block has a clear name, is over 15 lines, or is called from a loop body. **Don't extract** a
  single-call block under 10 lines, a trivial try/catch, or one that would need 5+ parameters.
- **Separate building data from saving it.** A method that returns data is testable and readable; a method that
  calls a repository is a side effect.
- **Rule of three.** Don't extract a shared method for 2 call sites; wait for 3.
- **Hiding a base method on purpose** (a derived repository's `UpsertAsync` with its own field copy) uses the `new`
  modifier, which states the hiding — no warning suppression.

## Namespaces and Usings

- C# does not import parent namespaces. A class in `{App}.API.Features.Orders.PlaceOrder` that uses a class in
  `{App}.API.Features.Orders` needs an explicit `using`.
- Each project of a service has its own `GlobalUsings.cs` for the namespaces it uses often, so its files carry few
  `using` lines. Shared libraries and modules carry their `using` lines per file.

## Domain Model

- **No public setters on entities.** A member set once at creation is `init` (and `required` when it must be given);
  a member that behaviour changes later has a private setter and changes only through the entity's own
  intention-named methods.
- **`required` + `private set` is a compile error (CS9032)** — a `required` member must be at least as visible as its
  setter. For a member that behaviour changes after creation, drop `required` and add a private constructor (the
  factory is then the only construction path); use `init` when nothing changes it after creation.
- **Creation.** A static factory when business rules or domain events are involved; an object initialiser with
  `required init` members when the entity is plain data.
- **Cross-aggregate references by id only** — never a navigation property.
- **Domain events** are raised after a state change succeeds — they are facts, not intents — and carry the aggregate
  reference. A domain event stays inside its service; what crosses to another service is an integration event.
- **No database queries inside entity methods.** Queries belong in handlers or repositories.

## Names and Small Forms

- **No service prefix on a type name;** the namespace says it. The cost: two services may then hold types with the
  same name, told apart only by namespace — fine in code, so name the service where a log line or a search needs it.
- **Public names are spelled correctly.**
- **Constants are PascalCase,** in a class and inside a method alike.
- **Primary-constructor parameters are named by use.** Kept and used in the class's methods → `_camelCase`; only
  passed to the base class → plain; used once to set a declared member → plain, and the member carries the
  underscore. A record's positional members are PascalCase, every one, including a parameter only handed to the
  record's base. Tools and models do not produce this unprompted, so the convention check holds the record half.
- **Comparisons.** No explicit comparison where `==` already compares exactly. A case-insensitive match goes through
  one extension method for that equality, and uses `StringComparer.OrdinalIgnoreCase` for a set or a lookup.
- **JSON names come from the web default;** no per-property name that only repeats it. A name another system
  dictates stays.
- **Small forms.** Status codes by named constant; a callback shape as a named delegate type; a shared text with
  placeholders as `static readonly`; public constants in dedicated constants classes; no `Empty`, `None` or `Default`
  static instances; named arguments not aligned into columns. In a FastEndpoints service: route, access and tag as
  attributes. A bundle of small sameness rules — worth holding where a check or a formatter does the work, not in a
  review comment.
- **Methods are verb phrases.** If no verb fits, the method's scope is unclear — split it. A lookup by key is
  `GetBy{Key}Async`; `Find…` is a search by something that is not a key and may return none or many; existence is
  `Exists…`; writes are `AddAsync`, `Update`, `Remove`, `UpsertAsync`.
- **Booleans read affirmatively:** `IsActive`, `CanEdit`, `HasChildren` — never `NotActive`.
- **Events are past-tense verb phrases:** `OrderPlaced`, `OrderShipped` — never a bare noun (`OrderEvent`).
- **No vague or abbreviated names:** not `data`, `info`, `result`, `temp`, `obj`, `item`, `req`, `cmd`, `res`. The one
  short name is `ct` for the cancellation token.
- **Modern forms:** file-scoped namespaces (`namespace X;`); declaration-form `using` (`using var conn = …;`); pattern
  matching over `is` plus a cast; `??` for a single fallback, a method of its own for several.

## Async / Await

- **Never `.Result`, `.Wait()` or `.GetAwaiter().GetResult()`** — they block the thread and deadlock.
- **Never `async void`** outside event handlers — an unhandled exception crashes the process.
- **The cancellation token is named `ct`;** a signature a framework fixes keeps the framework's name. It is the last
  parameter. It has `= default` on the methods of an interface, a repository or a read store, and none on an endpoint
  or a handler, which receive it from the framework. Every library and model defaults to the long name, so the
  convention check holds the name.
- **The token is always passed on,** except where the called library takes none.
- **Every async method ends in `Async`,** private steps included; names a framework fixes (`Handle`, `Consume`) apart.
- **No `.ConfigureAwait(false)`** in services, modules or shared libraries — a web service has nothing it protects.
- **`ct.ThrowIfCancellationRequested()`** — don't silently return on cancellation.
- **`throw;` not `throw ex;`** — it keeps the original stack trace.

## Errors

- **One family of errors.** A broken business rule throws the domain error, its message written inline where the rule
  is. A required lookup throws not-found through the guard helpers (`…OrThrow…`); an optional lookup returns nothing
  and its caller decides. A service's own error class derives the domain error. The `error-handling` skill carries
  the helpers' samples.
- **One central mapper turns errors into replies.** An endpoint has no `try/catch` that builds a reply and writes no
  error status by hand.
- **Validation runs at the edge,** in the request's validator, before the handler. In a FastEndpoints service
  `AddError` and `ThrowIfAnyErrors` belong to validation, never to a handler's business errors.
- **Don't catch `Exception` without a filter or a rethrow;** narrow a catch with an exception filter
  (`catch (HttpRequestException ex) when (…)`), and order catch blocks most-derived first.

## Null Handling

- **`is null` and `is not null` in statements;** `== null` only inside a query expression, where the language allows
  no other form.
- **A member that must be given is `required`,** in preference to `= null!`.
- **Don't use `?.` as a silent suppressor** where the value must exist.
- **Optional navigation properties are explicitly `?`.**

## Return Types

- **A method that returns a materialized collection returns `IReadOnlyList<T>`,** and `Task<IReadOnlyList<T>>` over
  `Task<IEnumerable<T>>` for an async query — the data is already materialized.
- **Parameters accept `IEnumerable<T>` or `IReadOnlyList<T>`,** not `List<T>`.

## LINQ

- **`.Any()` over `.Count() > 0`** — `Any()` short-circuits; on EF it generates `EXISTS` instead of `COUNT(*)`.
- **`.ToList()` before iterating twice.** An `IEnumerable<T>` from a LINQ chain re-executes on each enumeration.
- **No LINQ for side effects.** Use `foreach` for upserts, outside calls, anything with side effects.

## Comments and Logging

- **No documentation comments** on a class or a method: the name says what a thing does. Text for the API reference
  pages, where an endpoint needs any, goes in a `{Operation}Summary` class beside it.
- **A comment keeps only a reason** that neither the code nor a business rule holds. A line covered by a business
  rule carries its rule tag. No marker comments (`//insight`, `//talk`).
- **No comment cites a ticket, a ruling or a build step,** and no numbered step banners.
- **No to-do comments and no commented-out code** in committed code.
- **No divider comments.** Sections are `#region`, and only in start-up files, data contexts and a shared library's
  base classes; a file that needs dividers is too long.
- **Logging is central:** the request-diagnostics middleware or pipeline behaviour, and the error middleware. A class
  that serves a request may log only when that request runs several stages with outside calls, a stage can fail or
  fall back without failing the request, and the line states a decision or an outcome, not progress. Each such class
  is listed in `project-lists.md` § Logging classes, in the same change, and the convention check holds the list. A
  flow with many outside stages needs more logging than an ordinary service, so a repo's list may be long. A job or
  a hosted service logs its start, its outcome and its failures.

## Files and Encoding

- **No byte-order mark.** Files are saved as UTF-8 without one.
- **The solution file uses `.slnx`** (XML-based, the .NET 10 default). Adding a project means adding a
  `<Project Path="...">` entry under the right `<Folder>` element.

## Versions and Project Files

- **Target the latest stable stack** — currently **.NET 10** — and current framework APIs, never deprecated ones. In a
  FastEndpoints service replies go through `Send.…` (`Send.OkAsync`), never the legacy `SendOkAsync`.
- **One version of each package, set once,** in the central package file (`Directory.Packages.props`); a
  `<PackageReference>` carries no `Version`. Where the repo has a shared library, its services use the versions that
  library uses; without one, the current stable version.
- **A package pinned against a newer version the dependency graph would pick** keeps its pin, with a one-line comment
  above the pin giving the reason. That comment is the only comment a project file carries.
- **Project files set nothing beyond the basics:** no documentation-file generation and no warning suppressions,
  except the one a pinned package needs.
