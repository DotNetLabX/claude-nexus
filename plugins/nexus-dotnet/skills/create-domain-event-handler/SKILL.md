---
name: create-domain-event-handler
description: Creates and wires an in-process domain-event handler — the {Effect}On{Event}Handler that reacts to an aggregate's domain event within one service — and the event publisher behind it. Selects the handler shape (mediator INotificationHandler or FastEndpoints IEventHandler) from the service's event bus, not its endpoint framework; the two are independent. Use when adding a handler that reacts to a domain event (an e-mail, a push to the browser, a projection, a background job) inside a service, or when choosing a service's publisher and dispatch trigger. Not for cross-service propagation (add-integration-event) or synchronous cross-service calls (create-grpc-contract).
---

# Create Domain Event Handler

A domain event is the aggregate's **in-process** side channel: raised on an aggregate, sent when the data is saved,
handled inside the same service. Three choices wire a service — which publisher, what triggers the send, and which
interceptor — then each handler is written in the feature folder whose effect it carries.

> **Scope fences.**
> - **Cross-service propagation → `add-integration-event`.** A domain event never leaves the process; what crosses
>   is a contract record, published by a `PublishIntegrationEventOn{Event}Handler`.
> - **Domain-model design → `domain-patterns`.** The event records and the aggregate's event list are designed
>   there; this skill sends and handles them.

## Assumes

- **The aggregate base with its event list** (`create-aggregate` § The Aggregate Base).
- **An event bus inside the service** — the mediator, or FastEndpoints' event bus.
- **The save interceptor** for an EF Core store (`persistence-patterns`).
- No shared library: the event interface and both publishers are sampled below and built once under Look First.

<!-- nexus-gen coding-conventions sections="look-first" BEGIN -->
#### Look First

Before building anything a skill relies on — a guard helper, the central error mapper, a settings binder, an
aggregate or repository base, a save interceptor, an event publisher — look at what the repo already has: first
`project-lists.md` § Helpers, then the shared libraries, modules and packages the project can reach (its project
references and the central package file). Use what you find. Only otherwise build it once, in the shared place: the
lowest project every user of it already references; in a repo of one project, a `Shared` folder in it; where the
users share no project, a new shared project each of them references, with no reference cycle. Never a copy beside
each user. Add its row to `project-lists.md` § Helpers in the same change.
<!-- nexus-gen coding-conventions END -->

## Binding rule — pick the handler shape from the event bus, not the endpoint framework

The handler's interface follows the service's **event publisher** — the library it runs as its event bus — which
is independent of its endpoint framework. A FastEndpoints service may run the mediator purely as its event bus, and
then its handlers are mediator handlers. Keying the handler off the endpoint framework picks the wrong shape there.

## Decision 1 — publisher implementation

One seam, `IDomainEventPublisher`, with one implementation per event bus. It has an interface because production
code has two implementations.

```csharp file=IDomainEventPublisher.cs
public interface IDomainEventPublisher
{
    Task PublishAsync(IDomainEvent domainEvent, CancellationToken ct = default);
}
```

**The mediator as the event bus** — the event interface carries the mediator's notification marker, and handlers
are `INotificationHandler<T>`:

```csharp file=IDomainEvent.cs
public interface IDomainEvent : INotification;
```

```csharp file=MediatorDomainEventPublisher.cs
public class MediatorDomainEventPublisher(IPublisher _publisher) : IDomainEventPublisher
{
    public Task PublishAsync(IDomainEvent domainEvent, CancellationToken ct = default) =>
        _publisher.Publish(domainEvent, ct);
}
```

**FastEndpoints as the event bus** — the event interface carries FastEndpoints' event marker, and handlers are
`IEventHandler<T>`:

```csharp file=IDomainEvent.cs
public interface IDomainEvent : IEvent;
```

```csharp file=FastEndpointsDomainEventPublisher.cs
public class FastEndpointsDomainEventPublisher : IDomainEventPublisher
{
    public Task PublishAsync(IDomainEvent domainEvent, CancellationToken ct = default) =>
        domainEvent.PublishAsync(Mode.WaitForAll, ct);
}
```

A repo whose services use both buses types the interface with both markers
(`public interface IDomainEvent : INotification, IEvent;`), so each service picks its publisher at registration.

Register one publisher, one line, where the service registers its bus (`service-registration` § What Goes Where):
`services.AddScoped<IDomainEventPublisher, MediatorDomainEventPublisher>()`.

## Decision 2 — dispatch trigger

A domain event stays inside the process and is sent **when the data is saved**, through the publisher:

- **The save interceptor (EF Core stores).** The aggregate raises the event in its behaviour method; the handler or
  endpoint saves; a save interceptor collects the events of the tracked aggregates after the save, clears them, and
  sends each through the publisher (`persistence-patterns` § Save Interceptor). No feature code publishes.
- **Publish after the write (stores with no interceptor — Redis, ASP.NET Core Identity).** The code that writes
  builds the event and publishes it through the publisher right after the write:

```csharp
await _productRepository.AddAsync(product);
await _domainEventPublisher.PublishAsync(new ProductCreated(product), ct);
```

What crosses to another service is an integration event, published by a handler named
`PublishIntegrationEventOn{Event}Handler` (`add-integration-event`).

## Decision 3 — interceptor flavor (interceptor path only)

- **After the save (the default).** Sends after the save completes; cheap.
- **In the save's transaction.** Opens a transaction before the save, sends, then commits, so a handler's writes
  land with the trigger's. Pay for it only where a handler must write in that same transaction.

`persistence-patterns` samples the first and describes the second; register one, one line, in the Persistence
registration.

## Writing the handler

Name it by its **effect** — `{Effect}On{Event}Handler` — put it in the feature folder its effect belongs to, and
match its interface to the publisher (`workflows/Handler.md`). The bus finds its handlers itself; there is no
registration line per handler.

## Steps

1. **Define the event record** — it implements `IDomainEvent`, in the aggregate's `Events/` folder
   (`create-aggregate`).
2. **Raise it** — in the aggregate's behaviour method (`AddDomainEvent`), or, on the publish-after-write path, after
   the write.
3. **Confirm the publisher is registered** (Decision 1); where a FastEndpoints service runs the mediator as its bus,
   register the mediator too.
4. **Confirm the trigger** (Decisions 2 and 3) — the interceptor is registered and attached to the data context.
5. **Write the handler** — `workflows/Handler.md`.
6. **Verify:**
   ```bash
   rg -n "IDomainEventPublisher" {Svc}          # one publisher registered
   rg -n "ISaveChangesInterceptor" {Svc}        # the interceptor registered (EF Core stores)
   dotnet build
   ```

## What this skill does NOT do

- **Cross-service propagation** — `add-integration-event`.
- **Create the aggregate or its behaviour** — `create-aggregate`.
- **The save interceptor's code** — `persistence-patterns`.
