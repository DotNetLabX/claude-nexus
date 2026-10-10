# Create Domain Event

## Pattern

A domain event is a past-tense record in the aggregate's `Events/` folder. It carries the aggregate, and the action
where the service tracks who acted and when:

```csharp file=OrderShipped.cs
public record OrderShipped(Order Order, IAction Action) : IDomainEvent;
```

A service that does not track the action carries the aggregate alone:

```csharp file=OrderArchived.cs
public record OrderArchived(Order Order) : IDomainEvent;
```

Records are not sealed, and their positional members are PascalCase.

## Raising Events

In the behaviour method, after the change succeeds — an event is a fact, not an intent. The action object is the
last parameter:

```csharp
public void Ship(string trackingNumber, IAction action)
{
    if (Status is not OrderStatus.Placed)
        throw new DomainException("Only a placed order ships.");

    Status = OrderStatus.Shipped;
    TrackingNumber = trackingNumber;
    MarkModified(action);
    AddDomainEvent(new OrderShipped(this, action));
}
```

The save interceptor sends the event when the data is saved; nothing publishes it by hand on that path.

## Handling Events

A handler reacts inside the same service and is named for its effect, `{Effect}On{Event}Handler` — writing and
wiring it is `create-domain-event-handler`. An event another service needs leaves through
`PublishIntegrationEventOn{Event}Handler` (`add-integration-event`).

## Location

- Events: `{Svc}.Domain/{Aggregates}/Events/{Event}.cs` (aggregate-grouped) or `{Svc}.Domain/Events/{Event}.cs`
  (flat).
- Handlers: the feature folder whose effect they carry (`create-domain-event-handler`).
