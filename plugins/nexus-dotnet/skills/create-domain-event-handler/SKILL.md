---
name: create-domain-event-handler
description: Creates and wires an in-process domain-event handler — the {Effect}On{Event}Handler that reacts to an aggregate's domain event within one service. Selects the handler shape (MediatR INotificationHandler vs FastEndpoints IEventHandler) from the service's registered IDomainEventPublisher (its event bus), NOT its endpoint framework — the two are independent axes. Use when adding a handler that reacts to a domain event (email, SignalR broadcast, projection update, background-job trigger) inside a service, or when choosing a new service's publisher/interceptor. Not for cross-service propagation (add-integration-event) or synchronous cross-service reads (create-grpc-contract).
---

# Create Domain Event Handler

Domain events are the aggregate-owned, **in-process** side channel: one event raised on an aggregate,
dispatched to one or more handlers **inside the same service**. Three DI-time decisions get a service wired
— which publisher, what triggers dispatch, and (on the interceptor path) which interceptor flavor — then you
write the handler in the feature folder it serves.

> **Scope fences.**
> - **Cross-service propagation → `add-integration-event`.** Domain events never leave the process; only a
>   DTO projection does, through a `PublishIntegrationEventOn{Event}Handler` that maps to a contract and
>   publishes over MassTransit. That handler is *shaped* like a domain-event handler but belongs to the
>   integration-event skill, not this one.
> - **Domain-model design depth → `domain-patterns`.** Event records, the aggregate event queue, and the
>   `IDomainEvent` typing model are designed there; this skill consumes them and wires the handler.

## The model does not change with the dispatch library

`IDomainEvent` is **dual-typed** so the domain never has to know which dispatch library runs:

```csharp
// Blocks.Domain/IDomainEvent.cs (reference app)
public interface IDomainEvent : INotification, IEvent;   // INotification = MediatR, IEvent = FastEndpoints
```

Because the event carries **both** marker interfaces, picking MediatR or FastEndpoints dispatch is a
**DI-time decision, never a modeling one**. An event raised on an aggregate and harvested by the interceptor
MUST implement `IDomainEvent`; a manually published FastEndpoints event may be a plain record.

> **Variant axis (reconciles with `domain-patterns`).** The dual-typed interface above is this repo's shape,
> and it is what keeps the publisher choice open. A stack that has *genuinely dropped MediatR entirely* would
> instead type it `IDomainEvent : IEvent` only (the "light stack" `domain-patterns` names) and take no MediatR
> package dependency. The discriminator is **whether the stack retains MediatR at all**, not the endpoint
> framework — verify the live `IDomainEvent.cs` before assuming either shape.

## Binding rule — pick the handler shape from the event bus, not the endpoint framework

The handler interface (`INotificationHandler` vs `IEventHandler`) is selected by the service's registered
**`IDomainEventPublisher`** — the library the service runs as its **event bus** — which is **independent of
its request/endpoint framework**. Keying off the endpoint framework is a latent trap:

> **Counterexample (reference app: Production).** Production is a **FastEndpoints** service for endpoints, yet
> it registers **MediatR purely as the event bus** (`Blocks.MediatR.DomainEventPublisher`, one
> `INotificationHandler`, zero `ISender`/`IRequestHandler`). An endpoint-framework-keyed rule would pick the
> wrong handler shape here. Match the handler to the publisher, always.

## Reference-app resolution — copy the row that matches the service

| Service | Publisher (Decision 1) | Trigger (Decision 2) | Interceptor flavor (Decision 3) |
|---|---|---|---|
| Submission | MediatR | EF interceptor | post-save |
| Review | MediatR | EF interceptor | post-save |
| Production | MediatR (event bus only; endpoints are FastEndpoints) | EF interceptor | transactional |
| Auth | FastEndpoints | manual endpoint publish | none |
| Journals | FastEndpoints | manual endpoint publish | none |
| ArticleHub | none (read model) | none | none |

A pure read-model service registers no publisher at all.

## Decision 1 — publisher implementation

One producer seam, `IDomainEventPublisher.PublishAsync`, with two interchangeable implementations. Pick by
what the service runs as its **event bus**.

```csharp
// MediatR event bus — routes to INotificationHandler<T>
public sealed class DomainEventPublisher(IMediator mediator) : IDomainEventPublisher
{
    public Task PublishAsync(IDomainEvent @event, CancellationToken ct = default)
        => mediator.Publish(@event, ct);
}

// FastEndpoints event bus — routes to IEventHandler<T>
public sealed class DomainEventPublisher : IDomainEventPublisher
{
    public Task PublishAsync(IDomainEvent @event, CancellationToken ct = default)
        => @event.PublishAsync(Mode.WaitForAll, ct);
}
```

Register in the composition layer (Application DI when the service has an `.Application` project, otherwise
API DI):

```csharp
// MediatR or FastEndpoints service — DomainEventPublisher resolves via the using in scope
services.AddScoped<IDomainEventPublisher, DomainEventPublisher>();

// A FastEndpoints service that uses the MediatR publisher (Production) must disambiguate AND add MediatR:
services.AddMediatR(config => config.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
services.AddScoped<IDomainEventPublisher, Blocks.MediatR.DomainEventPublisher>();
```

## Decision 2 — dispatch trigger

Two legitimate triggers. Pick by whether the service writes through EF.

- **EF interceptor (automatic harvest)** — EF write-side services. The aggregate raises the event with
  `AddDomainEvent`, the repository calls `SaveChangesAsync`, and a `SaveChangesInterceptor` harvests events
  off tracked aggregates and pushes each through `IDomainEventPublisher`. No endpoint code touches publishing.
- **Manual endpoint publish (explicit)** — Redis-backed and Identity flows, where there is no aggregate side
  channel to harvest. The endpoint constructs the event and calls the FastEndpoints-inherited `PublishAsync`
  right after the write:

```csharp
await _repository.AddAsync(entity);
await PublishAsync(new {EventName}(entity));
```

The manual path is correct, not a smell — the interceptor path covers only the EF write-side services.

## Decision 3 — interceptor flavor (interceptor path only)

Register one line in `{Svc}.Persistence/DependencyInjection.cs` and wire it onto the DbContext.

- **Post-save (default, cheap)** — `DispatchDomainEventsInterceptor`. Dispatches after the save completes.
- **Transactional** — `TransactionalDispatchDomainEventsInterceptor`. Opens a transaction before the save,
  dispatches after, then commits, so handlers can write atomically with the trigger. Needs two extra
  registrations: `TransactionProvider` and a bound `TransactionOptions`.

```csharp
// Post-save (default):
services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();

// Transactional (only where a handler must write in the trigger's transaction — reference app: Production):
services.AddScoped<ISaveChangesInterceptor, TransactionalDispatchDomainEventsInterceptor>();
services.AddScoped<TransactionProvider>();
services.AddAndValidateOptions<TransactionOptions>(configuration); // in the API options composition
```

Default to the cheap post-save interceptor; pay for the transactional flavor only where a handler must write
in the same transaction as the trigger.

## Writing the handler

Name it by its **effect** (`{Effect}On{Event}Handler`), co-locate it in the feature folder it serves, and
match the interface to the service's publisher. Full location/naming/pattern rules + both handler shapes:
follow `workflows/Handler.md`. It is discovered by assembly scan (MediatR `RegisterServicesFromAssembly`, or
FastEndpoints auto-registration) — no manual DI line.

## Steps

1. **Define the event record** — implement `IDomainEvent` if an aggregate raises it (interceptor path) or you
   want it usable by either library; a plain record is fine only for a manually published FastEndpoints event.
   Co-locate under the aggregate's `Events/` folder (see `domain-patterns` / `create-aggregate`).
2. **Emit it** — interceptor path: call `AddDomainEvent(...)` in the aggregate behavior method; manual path:
   construct it and call `PublishAsync(...)` in the endpoint after the write.
3. **Confirm the publisher is registered** (Decision 1) — match the implementation to the service's event bus;
   add `AddMediatR(...)` too if it is a FastEndpoints service using the MediatR publisher.
4. **Confirm the trigger** (Decisions 2/3) — EF write-side: register the interceptor and wire `AddInterceptors`
   onto the DbContext (+ `TransactionProvider`/`TransactionOptions` for the transactional flavor). Manual: the
   `PublishAsync` from step 2 is the trigger.
5. **Write the handler** — feature folder, `{Effect}On{Event}Handler`, the interface matching the publisher
   (`INotificationHandler`/`Handle` or `IEventHandler`/`HandleAsync`). No DI line — follow `workflows/Handler.md`.
6. **Verify** the wiring is present, then build (replace `{Svc}` with the service folder):
   ```bash
   rg -n "AddScoped<IDomainEventPublisher"  src/Services/{Svc}   # a publisher is registered (Decision 1)
   rg -n "AddScoped<ISaveChangesInterceptor" src/Services/{Svc}   # the EF interceptor is registered (Decision 2, write-side)
   dotnet build
   ```
   (A pure read-model or a manual-publish-only service registers neither — expect zero there by design.)

## What this skill does NOT do

- **Cross-service propagation** — a `PublishIntegrationEventOn{Event}Handler` that maps to a DTO and publishes
  via MassTransit is `add-integration-event`'s job, even though it is shaped like a domain-event handler.
- **Creating the aggregate** or its behavior methods — that is `create-aggregate`; this skill assumes the
  aggregate exists and only wires the event out of it.
- **Editing the `Blocks.*` building blocks** (`IDomainEvent`, the publishers, the interceptors) — stable
  infrastructure this skill consumes.
