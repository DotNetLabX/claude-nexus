---
name: domain-patterns
description: DDD patterns — aggregates, entities, value objects, domain events, partial class split, state machines, event dispatch. Loaded when designing or implementing domain models.
user-invocable: true
---

# Domain Patterns

> **Accepted but not proven until Passes 2/3 consume it.** ADR-007 (VO-vs-scalar rule) and ADR-004/011 variant annotations were added in adhoc-Pass1-SkillRepair; they will be validated when applied in Pass 2/3.

## AggregateRoot

**File:** `src/BuildingBlocks/Blocks.Domain/Entities/AggregateRoot.cs`

- Extends `Entity<TPrimaryKey>`, adds audit fields:
  - `CreatedById (string?)`, `CreatedOn (DateTime?)`, `LastModifiedById (string?)`, `LastModifiedOn (DateTime?)`
- Private `_domainEvents` list exposed as `IReadOnlyList<IDomainEvent>`
- Methods: `AddDomainEvent()`, `ClearDomainEvents()`
- Convenience form: `AggregateRoot` (non-generic, PK = int)

> **Identity model (this solution — ADR-004 / CLAUDE.md locked decision):** `User : Entity<int>` — plain DDD entity, NOT `IdentityUser<int>`. This solution uses no ASP.NET Core Identity packages. Google is the identity provider; roles are string claims. See `Identity.Domain/Users/User.cs`.
>
> **Full-stack / reference-only variant:** Projects that adopt ASP.NET Core Identity may extend `IdentityUser<int>` and implement `IAggregateRoot` manually to satisfy the Identity package constraint. This variant does NOT apply to this solution.

## Entity

**File:** `src/BuildingBlocks/Blocks.Domain/Entities/Entity.cs`

- `Entity<TPrimaryKey>` with `Id` property and equality by ID
- `IsNew` returns true when ID is default value
- Transient entities (both `IsNew`) are never considered equal

## Value Objects

**File:** `src/BuildingBlocks/Blocks.Domain/ValueObjects/`

Three base types:
- `ValueObject` — multi-property, implements `GetEqualityComponents()`
- `StringValueObject` — single string `Value`, full equality (`Equals`, `==`/`!=`, `GetHashCode`)
- `SingleValueObject<T>` — single struct `Value`; `Equals(object?)` compares against another `SingleValueObject<T>` of the **same concrete type** (runtime type check via `GetType()` — not a general boxed-T comparison)

Pattern: static `Create()` factory with validation, internal constructor:
```csharp
public class EmailAddress : StringValueObject
{
    internal EmailAddress(string value) { Value = value; }
    public static EmailAddress Create(string value)
    {
        Guard.ThrowIfNullOrWhiteSpace(value);
        return new EmailAddress(value);
    }
}
```

**Per-bounded-context duplication is intentional.** Each service defines its own VOs even if the shape is identical. This follows DDD — each BC owns its types. Only share VOs through BuildingBlocks when they are truly cross-cutting (e.g., `SingleValueObject<T>` base).

### When to Use a Value Object vs a Flat Scalar (ADR-007)

**Rule:** When two or more scalar fields are *cohesive* — always used together, share an invariant, or represent one concept — group them into a value object or owned type rather than flat scalars. A single standalone scalar with its own validation or identity (e.g. `EmailAddress`) is also a VO. A single incidental scalar (a count, a flag, a timestamp with no invariant) stays a plain property.

**Live worked example (SprintRituals):** `AppSettings` is a plain class (not an aggregate) that currently carries a mix of flat scalars and cohesive config VOs. The cohesive groups already extracted as VOs demonstrate ADR-007:

| Live VO (SprintRituals) | Location | Cohesion reason |
|------------------------|----------|----------------|
| `HealthThresholdConfig` | `Fokus.Domain/Settings/ValueObjects/` | Completion/Disruption/CarryOver Green+Amber pairs always set together |
| `HealthWeightConfig` | `Fokus.Domain/Settings/ValueObjects/` | Completion/Disruption/CarryOver weights sum to 100 — invariant group |
| `QaHealthThresholdConfig` | `Fokus.Domain/Settings/ValueObjects/` | Coverage/Execution/PassRate threshold pairs |
| `QualitySubScoreWeightConfig` | `Fokus.Domain/Settings/ValueObjects/` | CoverageWeight/PassRateWeight sum to 100 |

These extend `ValueObject` directly and are mapped via EF `OwnsOne(..., b => b.ToJson())` in `AppSettingsConfiguration.cs`. The remaining flat scalars in `AppSettings` (e.g. `BugRatioAlertThreshold`, `XrayEnabled`) are ADR-007 targets for Pass 2/3 — they will be grouped into additional config VOs when that pass runs.

**Persistence:** Cohesive VOs map via EF Core `OwnsOne` (JSON columns) or `ComplexProperty` (flat columns) — see `persistence-patterns` for the config patterns. Do not restate EF config here.

## Partial Class Behavior Split

All services split aggregate state from behavior:
- `{Aggregate}.cs` — properties, backing collections
- `Behaviors/{Aggregate}.cs` — domain methods that mutate state and raise events

Backing collection pattern:
```csharp
private readonly List<LineItem> _lineItems = new();
public IReadOnlyList<LineItem> LineItems => _lineItems.AsReadOnly();
```

Behavior method convention — **action parameter is typically last.** Prefer action last when writing new code:

> **Illustrative pseudocode — types below (`Assignee`, `IAction`, `AssigneeChanged`) are NOT live in this solution.** They are adapted from the `dotnet-microservices` reference project to show the parameter-order convention only. For real this-solution examples see `Identity.Domain`: `PersonCreated`, `UserCreated`.

```csharp
// action last (preferred convention) — illustrative pseudocode
public void AssignTo(Assignee assignee, IAction action)
{
    // validate
    // mutate state
    AddDomainEvent(new AssigneeChanged(this, action));
}
```

Real this-solution domain event records (no `IAction` — simple notification pattern):
```csharp
// Identity.Domain/Users/Events/UserCreated.cs
public sealed record UserCreated(int UserId) : IDomainEvent;

// Identity.Domain/Persons/Events/PersonCreated.cs
public sealed record PersonCreated(int PersonId) : IDomainEvent;
```

## Domain Events

**Interface (this solution — `Blocks.Domain/Events/IDomainEvent.cs`):**

```csharp
public interface IDomainEvent : IEvent;
```

`IDomainEvent` extends FastEndpoints `IEvent` only. There is **no** `INotification` (MediatR) in this solution's BuildingBlocks — adding it would require a MediatR package dependency that ADR-004 explicitly excludes.

**Event record pattern (this solution):**
```csharp
// Simple notification — aggregate reference only
public sealed record SprintSynced(Sprint Sprint) : IDomainEvent;

// With data payload
public sealed record PersonCreated(int PersonId, string Email) : IDomainEvent;
```

> **Full-stack / reference-only variant — NOT in this solution:**
> In MediatR-based projects (e.g. `dotnet-microservices` reference), domain events extend both `INotification` and a base `DomainEvent<TAction>` record:
> ```csharp
> // Articles.Abstractions (reference project only)
> public abstract record DomainEvent<TAction>(TAction Action) : IDomainEvent
>     where TAction : IArticleAction;
> public record OrderApproved(Order Order, IOrderAction Action) : DomainEvent<IOrderAction>(Action);
> ```
> This variant adds MediatR's `INotification` to `IDomainEvent` so events route through `INotificationHandler<T>`. Use only when the project has MediatR wired; do not apply to this solution.

## Event Dispatch

**This solution:** One interceptor — `DispatchDomainEventsInterceptor` in `Blocks.EntityFrameworkCore/Interceptors/`:

```csharp
// Registered in {Module}.Persistence/DependencyInjection.cs
services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();
```

- Dispatches **after** `SaveChanges` completes (non-transactional)
- Scans `ChangeTracker` for `IAggregateRoot` entries with pending events
- Clears events then calls `IDomainEventPublisher.PublishAsync`
- Registered alongside `IDomainEventPublisher` in Persistence DI (see `Fokus.Persistence/DependencyInjection.cs:15-16` as live example)

> **Full-stack / reference-only variant — NOT in this solution:**
> Some reference implementations also ship a `TransactionalDispatchDomainEventsInterceptor` that wraps save + dispatch in a single DB transaction (for handlers that write back to the same DbContext). This type does not exist in this solution's BuildingBlocks; use the standard `DispatchDomainEventsInterceptor` here.

## IDomainEventPublisher — Framework Variants

**This solution (light-stack variant — ADR-004/011):**

| Implementation | Location | Mechanism |
|---------------|----------|-----------|
| `Blocks.FastEndpoints/DomainEventPublisher` | `src/BuildingBlocks/Blocks.FastEndpoints/` | `domainEvent.PublishAsync(Mode.WaitForAll, ct)` → `IEventHandler<T>` |

Register in the module's Persistence `DependencyInjection.cs`:
```csharp
services.AddScoped<IDomainEventPublisher, DomainEventPublisher>();
```

`IEventHandler<T>` implementations live alongside their feature slices in `{Module}.API/Features/`. Check the service's CLAUDE.md for the exact location.

> **Full-stack / reference-only variant — NOT in this solution:**
> MediatR-based projects use `Blocks.MediatR/DomainEventPublisher` (from the `dotnet-microservices` reference):
> ```csharp
> // Blocks.MediatR/DomainEventPublisher — reference project only
> public sealed class DomainEventPublisher(IMediator mediator) : IDomainEventPublisher
> {
>     public Task PublishAsync(IDomainEvent @event, CancellationToken ct = default)
>         => mediator.Publish(@event, ct);  // routes to INotificationHandler<T>
> }
> ```
> Register in the Application layer's `AddApplicationServices`. Do not use in this solution (no MediatR — ADR-004).

## State Machine Pattern

Two location variants — choose based on whether the project has an Application layer:

**Full-stack variant (with Application layer):**

**File:** `src/Services/{Svc}/{Svc}.Application/StateMachines/`

- `{Aggregate}StateMachineFactory` registered as delegate factory — avoids injecting into aggregates
- Validates stage transitions via transition table stored in DB (`{Aggregate}StageTransition`)
- Called in aggregate behavior methods before state mutation
- Per-service `{Aggregate}ActionType` enum defines allowed actions
- Registered in `AddApplicationServices` in the Application layer

**Light-stack variant (no Application layer — ADR-004):**

When there is no Application layer, state machine factories live in the module's API or Domain composition instead. Register them in the module's `AddApiServices` or alongside the relevant aggregate's DI wiring. See `service-registration` for the layer structure without an Application project.

The pattern is the same regardless of layer: DB-stored transition rules + factory-provided validator + aggregate-enforced invariants.
