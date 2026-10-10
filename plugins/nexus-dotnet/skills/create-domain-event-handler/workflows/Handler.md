# Handler Workflow

## Location Rule

The handler lives in the feature folder it *serves* — `{Svc}.API/Features/{Area}/{Operation}/` (or the Application
project's, in the mediator style) — not necessarily the one that raised the event.

- **One handler for an event:** in the feature folder that raises it.
- **Several handlers for the same event:** each in the feature folder its effect belongs to.
- **One handler family reacting to many aggregates' events** (an audit trail or timeline over a family of events,
  through one generic base): the one exception — it lives in an `EventHandlers/` folder of its project, because it
  belongs to no single feature.

## Naming Rule

A handler is named for its effect, not its trigger:

- **`{Effect}On{Event}Handler`** — `NotifyCustomerOnOrderShippedHandler`.
- **Several effects:** `{Effect}And{Effect}On{Event}Handler` — `NotifyAndRecalculateOnOrderLineAddedHandler`.
- A class named for the event it receives is a consumer of another service's event, not this
  (`consumer-patterns`).

## Namespace

The namespace follows the folder, with one exception: a `_Shared` folder's namespace is `.Shared`, without the
underscore.

```text
Features/Orders/ShipOrder/        →  {Svc}.API.Features.Orders.ShipOrder
Features/Orders/_Shared/          →  {Svc}.API.Features.Orders.Shared
```

## Pattern — FastEndpoints Event Bus

```csharp file=NotifyCustomerOnOrderShippedHandler.cs
public class NotifyCustomerOnOrderShippedHandler(EmailSender _emailSender) : IEventHandler<OrderShipped>
{
    public Task HandleAsync(OrderShipped domainEvent, CancellationToken ct) =>
        _emailSender.SendOrderShippedAsync(domainEvent.Order.CustomerId, domainEvent.Order.TrackingNumber, ct);
}
```

## Pattern — Mediator Event Bus

```csharp file=NotifyCustomerOnOrderShippedHandler.cs
public class NotifyCustomerOnOrderShippedHandler(EmailSender _emailSender) : INotificationHandler<OrderShipped>
{
    public Task Handle(OrderShipped domainEvent, CancellationToken ct) =>
        _emailSender.SendOrderShippedAsync(domainEvent.Order.CustomerId, domainEvent.Order.TrackingNumber, ct);
}
```

**Pick the pattern from the service's event publisher, not its endpoint framework** (the skill's binding rule).
`Handle` and `HandleAsync` are the names each framework fixes.

## Rules

- The token is passed on to every call that takes one.
- A handler does not log and does not catch to swallow; a failure propagates.
- A handler that writes saves its own changes; on the interceptor path its events go out on that save.
