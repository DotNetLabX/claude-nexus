---
name: domain-patterns
description: DDD patterns — aggregates, entities, value objects, domain events, partial class split, state machines, event dispatch. Use when designing or implementing domain models.
user-invocable: true
---

# Domain Patterns

DDD building blocks for the domain layer. Two stack variants recur and are called out per pattern:

- **Light stack** — FastEndpoints events, no MediatR, no ASP.NET Core Identity. Domain events extend FastEndpoints `IEvent`.
- **Full stack** — MediatR `INotification`-based events, optional ASP.NET Core Identity.

Pick the variant from the service's CLAUDE.md; the patterns below are otherwise stack-agnostic. Examples name a concrete type only to make a shape legible — substitute your own.

## Assumes

- **`Blocks.Domain` base classes** — `Entity<TPrimaryKey>`, `AggregateRoot`, the value-object bases
  (`ValueObject` / `StringValueObject` / `SingleValueObject<T>`), and `IDomainEvent`. Every pattern below
  names its `Blocks.Domain/…` source file.
- **MediatR** for the **full-stack** variant (dual-typed events, the `INotification` publisher). The
  **light stack** (`IDomainEvent : IEvent`, FastEndpoints) drops MediatR **but still uses `Blocks.Domain`**
  — dropping MediatR is not dropping BuildingBlocks.
- The reference app (dotnet-microservices) for the concrete file paths and the identity-model variants.

**No `Blocks.Domain` at all?** See the **Zero-dependency variant** below — declare tiny inline base
classes instead of taking the package.

## AggregateRoot

**File:** `src/BuildingBlocks/Blocks.Domain/Entities/AggregateRoot.cs`

- Extends `Entity<TPrimaryKey>`, implements `IAuditedEntity<TPrimaryKey>`, adds audit fields (types per live
  `Blocks.Domain/Entities/AggregateRoot.cs` / `IAuditedEntity.cs`):
  - `CreatedById` — `TPrimaryKey`, non-null `init`
  - `CreatedOn` — `DateTime`, non-null `init` (defaults `DateTime.UtcNow`)
  - `LastModifiedById` — `TPrimaryKey?` (nullable), `set`
  - `LastModifiedOn` — `DateTime?` (nullable), `set`
  - For the non-generic `AggregateRoot` convenience form, `TPrimaryKey` = `int` (so `CreatedById` is `int`, `LastModifiedById` is `int?`)
- Private `_domainEvents` list exposed as `IReadOnlyList<IDomainEvent>`
- Methods: `AddDomainEvent()`, `ClearDomainEvents()`
- Convenience form: `AggregateRoot` (non-generic, PK = int)

> **Identity-model variant.** Two coherent shapes — choose per service:
> - **Plain-DDD identity (light stack):** `User : Entity<int>` — a plain DDD entity, NOT `IdentityUser<int>`; no ASP.NET Core Identity packages. Use when an external provider (e.g. Google) is the identity authority and roles are string claims.
> - **ASP.NET Core Identity:** extend `IdentityUser<int>` and implement `IAggregateRoot` manually to satisfy the Identity package constraint. Use only when the service actually adopts ASP.NET Core Identity.
>
> Whichever a service picks, record it as a locked decision in that service's CLAUDE.md so features don't drift between the two.

## Entity

**File:** `src/BuildingBlocks/Blocks.Domain/Entities/Entity.cs`

- `Entity<TPrimaryKey>` with `Id` property and equality by ID
- `IsNew` returns true when ID is default value
- Transient entities (both `IsNew`) are never considered equal
- **Encapsulating an entity's setters?** Do not write `required` + `private set` together — that is a CS9032 compile error (a `required` member must be at least as visible as its setter). For an entity whose behavior methods mutate the property after construction (e.g. an `UpdateFromGoogle`-style method), drop `required` and add a private constructor (the factory is then the only construction path, making `required` redundant); use `init` only when nothing mutates it post-construction. Full rule + remedies: `conventions/csharp.md` → Type Conventions.
- **`Entity<int>` vs the non-generic `Entity` — mind the alias and constraint chain.** `AggregateRoot` and the non-generic `Entity` convenience forms fix `TPrimaryKey` = `int`. When you change a base class — swap a hand-rolled base for `Entity<int>`, or move an entity onto the non-generic `Entity` — the generic argument and any generic constraints must line up at **every** reference: a repository typed `IRepository<TEntity, TKey>`, an `IAuditedEntity<TPrimaryKey>` implementation, an EF `IEntityTypeConfiguration<TEntity>`. A mismatch — e.g. a `where T : Entity<int>` constraint meeting an entity that now extends the non-generic `Entity` — is a compile-time failure, not a runtime surprise. Reconcile the whole chain in one edit, not just the class declaration.

## Promoting an Entity to an AggregateRoot in place

An entity often starts as a plain `Entity<int>` and later earns aggregate status — it acquires its own consistency boundary, raises domain events, or becomes the root others load through. Promote it in place, without moving the file or rewriting every call site:

1. **Change the base** from `Entity<int>` (or the non-generic `Entity`) to `AggregateRoot` (PK = int) or `AggregateRoot<TKey>`. This adds the audit fields, the `_domainEvents` list, and `AddDomainEvent()` — mind the `Entity<int>`-vs-`Entity` constraint chain noted above.
2. **Adopt the partial behavior split** — move the mutating methods into `Behaviors/{Aggregate}.cs` (see Partial Class Behavior Split below) so the new aggregate raises its events from one place.
3. **Add the EF `OwnsOne` / navigation config** for anything the aggregate now owns, and stop the former parent from tracking the promoted type as an owned child once it loads it as a root.
4. **Route writes through the root** — callers that mutated the entity directly now call an aggregate behavior method; the resource gate and repository target the new root.

Promote only when the entity truly gains a boundary — not every entity should be an aggregate. If it stays a child of another aggregate, leave it an `Entity`.

## Value Objects

**File:** `src/BuildingBlocks/Blocks.Domain/ValueObjects/`

Three base types:
- `ValueObject` — multi-property, implements `GetEqualityComponents()`
- `StringValueObject` — single string `Value`, full equality (`Equals`, `==`/`!=`, `GetHashCode`)
- `SingleValueObject<T>` — single struct `Value`; `Equals(object?)` compares against another `SingleValueObject<T>` of the **same concrete type** (runtime type check via `GetType()` — not a general boxed-T comparison)

Pattern: static `Create()` factory with validation and a **`private` + `[JsonConstructor]`** constructor
(`[JsonConstructor]` lets the serializer rehydrate past the private ctor, `using Newtonsoft.Json;`):
```csharp
public class EmailAddress : StringValueObject
{
    [JsonConstructor]
    private EmailAddress(string value) { Value = value; }
    public static EmailAddress Create(string value)
    {
        Guard.ThrowIfNullOrWhiteSpace(value);
        return new EmailAddress(value);
    }
}
```

**`private` is the prescriptive default** — it keeps the static `Create()` factory the only construction path
(live majority, ~14 of 17 VO ctors). **`internal` + `[JsonConstructor]` is a sanctioned minority variant**
(live: `Auth.Domain/Persons/ValueObjects/EmailAddress.cs`, `Review.Domain/_Shared/ValueObjects/EmailAddress.cs`,
`Review.Domain/Assets/ValueObjects/FileName.cs`), used when a factory or behavior in the same assembly must
construct the VO directly — it widens construction to the assembly, so prefer `private` unless that in-assembly
access is genuinely needed.

**Per-bounded-context duplication is intentional.** Each service defines its own VOs even if the shape is identical. This follows DDD — each BC owns its types. Only share VOs through BuildingBlocks when they are truly cross-cutting (e.g., `SingleValueObject<T>` base).

### When to Use a Value Object vs a Flat Scalar

**Rule:** When two or more scalar fields are *cohesive* — always used together, share an invariant, or represent one concept — group them into a value object or owned type rather than flat scalars. A single standalone scalar with its own validation or identity (e.g. `EmailAddress`) is also a VO. A single incidental scalar (a count, a flag, a timestamp with no invariant) stays a plain property.

**Worked example (illustrative).** A plain settings class (not an aggregate) that carries a mix of flat scalars and cohesive config VOs demonstrates the rule. Cohesive groups extracted as VOs:

| VO (example) | Cohesion reason |
|------------------------|----------------|
| `HealthThresholdConfig` | Completion/Disruption/CarryOver Green+Amber pairs always set together |
| `HealthWeightConfig` | Completion/Disruption/CarryOver weights sum to 100 — invariant group |
| `QaHealthThresholdConfig` | Coverage/Execution/PassRate threshold pairs |
| `QualitySubScoreWeightConfig` | CoverageWeight/PassRateWeight sum to 100 |

These extend `ValueObject` directly and are mapped via EF `OwnsOne(..., b => b.ToJson())`. Remaining incidental scalars on the settings class (a standalone alert threshold, a feature flag) stay flat — they carry no shared invariant, so a VO would add ceremony without protecting anything.

**Persistence:** Cohesive VOs map via EF Core `OwnsOne` (JSON columns) or `ComplexProperty` (flat columns) — see `persistence-patterns` for the config patterns. Do not restate EF config here.

## Zero-dependency variant (no Blocks.Domain)

When the service does not take `Blocks.Domain` — a standalone service (see `create-service`'s minimal-stack branch) — declare tiny inline bases instead of the package. The DDD shape is unchanged; only where the base classes come from differs.

```csharp
// Inline, in your own .Domain project — no Blocks.Domain package.
public abstract class Entity<TKey>
{
    public TKey Id { get; protected set; } = default!;
    public bool IsNew => EqualityComparer<TKey>.Default.Equals(Id, default!);
    // equality-by-Id: override Equals/GetHashCode; transient entities (both IsNew) are never equal
}

public abstract class AggregateRoot<TKey> : Entity<TKey>
{
    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    protected void AddDomainEvent(IDomainEvent e) => _domainEvents.Add(e);
    public void ClearDomainEvents() => _domainEvents.Clear();
}

public interface IDomainEvent; // plain marker — no MediatR/FastEndpoints base when neither is present
```

Keep the same conventions the packaged bases enforce (equality by Id, `AddDomainEvent` / `ClearDomainEvents`, value objects with a static `Create()` factory). Without an event bus, dispatch events yourself after `SaveChanges` rather than through `DispatchDomainEventsInterceptor` (which ships in `Blocks.EntityFrameworkCore`). Promote to `Blocks.Domain` if the service later joins the estate.

## Partial Class Behavior Split

All services split aggregate state from behavior:
- `{Aggregate}.cs` — properties, backing collections
- `Behaviors/{Aggregate}.cs` — domain methods that mutate state and raise events

Backing collection pattern:
```csharp
private readonly List<LineItem> _lineItems = new();
public IReadOnlyList<LineItem> LineItems => _lineItems.AsReadOnly();
```

Behavior method convention — **the action/owner parameter is always last, after the factory/domain
arguments.** This is an owner-binding rule, not a preference. (Reference-app drift: Submission places the
action *before* a trailing `stateMachineFactory` argument — e.g.
`SetStage(ArticleStage, IArticleAction<...> action, ArticleStateMachineFactory)` — treat Submission's
ordering as the documented exception, not the template.)

```csharp
// action always last — illustrative; substitute your own real action interface
public void AssignTo(Assignee assignee, IArticleAction action)
{
    // validate
    // mutate state
    AddDomainEvent(new AssigneeChanged(this, action));
}
```

Simpler services often need no action object — a plain notification record is enough:
```csharp
public sealed record UserCreated(int UserId) : IDomainEvent;
public sealed record PersonCreated(int PersonId) : IDomainEvent;
```

## Domain Events

**Interface — light-stack variant (`Blocks.Domain/IDomainEvent.cs`, MediatR dropped):**

```csharp
public interface IDomainEvent : IEvent;
```

This `IEvent`-only shape is the **light-stack variant**: `IDomainEvent` extends FastEndpoints `IEvent` only —
**no** MediatR `INotification` — so a stack that has genuinely dropped MediatR takes no MediatR package
dependency. The **reference app keeps MediatR**, so its live file at this same path (`Blocks.Domain/IDomainEvent.cs`)
is instead **dual-typed** `IDomainEvent : INotification, IEvent` (see the variant-axis note below) — verify the
live `IDomainEvent.cs` before assuming either shape.

> **Variant axis — which shape a stack uses.** The discriminator is **whether the stack retains MediatR at
> all**, not the endpoint framework. A stack that has genuinely dropped MediatR types it `IDomainEvent : IEvent`
> (above). A stack that keeps MediatR — including a service that runs FastEndpoints endpoints but a MediatR
> event bus — types it **dual** as `IDomainEvent : INotification, IEvent`, so the publisher choice stays a
> DI-time decision (this is the reference-app shape; see `create-domain-event-handler`). Verify the live
> `IDomainEvent.cs` before assuming either.

**Event record pattern:**
```csharp
// Simple notification — aggregate reference only
public sealed record SprintSynced(Sprint Sprint) : IDomainEvent;

// With data payload
public sealed record PersonCreated(int PersonId, string Email) : IDomainEvent;
```

> **Full-stack variant (MediatR):**
> In MediatR-based services, domain events extend both `INotification` and a base `DomainEvent<TAction>` record:
> ```csharp
> public abstract record DomainEvent<TAction>(TAction Action) : IDomainEvent
>     where TAction : IAuditableAction;
> public record OrderApproved(Order Order, IOrderAction Action) : DomainEvent<IOrderAction>(Action);
> ```
> This adds MediatR's `INotification` to `IDomainEvent` so events route through `INotificationHandler<T>`. Use only when the service has MediatR wired.

## Event Dispatch

**Standard interceptor** — `DispatchDomainEventsInterceptor` in `Blocks.EntityFrameworkCore/Interceptors/`:

```csharp
// Registered in {Module}.Persistence/DependencyInjection.cs
services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();
```

- Dispatches **after** `SaveChanges` completes (non-transactional)
- Scans `ChangeTracker` for `IAggregateRoot` entries with pending events
- Clears events then calls `IDomainEventPublisher.PublishAsync`
- Registered alongside `IDomainEventPublisher` in the module's Persistence DI

> **Transactional variant.** Some services also ship a `TransactionalDispatchDomainEventsInterceptor` that wraps save + dispatch in a single DB transaction (for handlers that write back to the same DbContext). Add it only when a service needs that guarantee; otherwise the standard interceptor is the default.

## IDomainEventPublisher — Framework Variants

**Light-stack variant (FastEndpoints):**

| Implementation | Location | Mechanism |
|---------------|----------|-----------|
| `Blocks.FastEndpoints/DomainEventPublisher` | `src/BuildingBlocks/Blocks.FastEndpoints/` | `domainEvent.PublishAsync(Mode.WaitForAll, ct)` → `IEventHandler<T>` |

Register in the module's Persistence `DependencyInjection.cs`:
```csharp
services.AddScoped<IDomainEventPublisher, DomainEventPublisher>();
```

`IEventHandler<T>` implementations live alongside their feature slices in `{Module}.API/Features/`. Check the service's CLAUDE.md for the exact location.

> **Full-stack variant (MediatR):**
> MediatR-based services use `Blocks.MediatR/DomainEventPublisher`:
> ```csharp
> public sealed class DomainEventPublisher(IMediator mediator) : IDomainEventPublisher
> {
>     public Task PublishAsync(IDomainEvent @event, CancellationToken ct = default)
>         => mediator.Publish(@event, ct);  // routes to INotificationHandler<T>
> }
> ```
> Register in the Application layer's `AddApplicationServices`. Use only when the service has MediatR wired.

## State Machine Pattern

Two location variants — choose based on whether the project has an Application layer:

**Full-stack variant (with Application layer):**

**File:** `src/Services/{Svc}/{Svc}.Application/StateMachines/`

- `{Aggregate}StateMachineFactory` registered as delegate factory — avoids injecting into aggregates
- Validates stage transitions via transition table stored in DB (`{Aggregate}StageTransition`)
- Called in aggregate behavior methods before state mutation
- Per-service `{Aggregate}ActionType` enum defines allowed actions
- Registered in `AddApplicationServices` in the Application layer

**Light-stack variant (no Application layer):**

When there is no Application layer, state machine factories live in the module's API or Domain composition instead. Register them in the module's `AddApiServices` or alongside the relevant aggregate's DI wiring. See `service-registration` for the layer structure without an Application project.

The pattern is the same regardless of layer: DB-stored transition rules + factory-provided validator + aggregate-enforced invariants.

For the build recipe — the seed table, the factory delegate, the DI variants, and the validate-before-mutate guard step by step — follow `add-state-machine`. This section is the design-level placement decision; `add-state-machine` is how you construct it.
