# Create Integration Event Publisher

A handler of the domain event that turns it into the contract and publishes it.

> **One seam.** `PublishIntegrationEventOn{Event}Handler` is the **only** place an integration event is published —
> never an aggregate, a command handler or an endpoint. The domain event crosses the service boundary here and
> nowhere else.

**Reload with what the contract needs.** The domain event's aggregate may not carry its collections loaded, and it
references other aggregates by id only: load it again with its collections, load what it references, then map by
hand. Both reads are named no-tracking reads on their repositories, since the publisher changes nothing
(`persistence-patterns` § Tier 3: A repository with its own reads).

## Mediator Event Bus

`{Svc}.Application/Features/{Area}/{Operation}/PublishIntegrationEventOn{Event}Handler.cs`:

```csharp file=PublishIntegrationEventOnOrderPlacedHandler.cs
public class PublishIntegrationEventOnOrderPlacedHandler(
    OrderRepository _orderRepository,
    CustomerRepository _customerRepository,
    IPublishEndpoint _publishEndpoint)
    : INotificationHandler<OrderPlaced>
{
    public async Task Handle(OrderPlaced domainEvent, CancellationToken ct)
    {
        var order = (await _orderRepository.GetByIdNotTrackedAsync(domainEvent.Order.Id, ct)).OrThrowNotFound(domainEvent.Order.Id);
        var customer = (await _customerRepository.GetByIdNotTrackedAsync(order.CustomerId, ct)).OrThrowNotFound(order.CustomerId);

        await _publishEndpoint.Publish(new OrderPlacedEvent(order.ToOrderContract(customer)), ct);
    }
}
```

## FastEndpoints Event Bus

`{Svc}.API/Features/{Area}/{Operation}/PublishIntegrationEventOn{Event}Handler.cs`:

```csharp file=PublishIntegrationEventOnOrderShippedHandler.cs
public class PublishIntegrationEventOnOrderShippedHandler(IPublishEndpoint _publishEndpoint)
    : IEventHandler<OrderShipped>
{
    public Task HandleAsync(OrderShipped domainEvent, CancellationToken ct)
    {
        var order = domainEvent.Order;

        return _publishEndpoint.Publish(
            new OrderShippedEvent(order.Id, order.Status.ToString(), order.TrackingNumber!, order.ShippedOn!.Value), ct);
    }
}
```

`Handle` and `HandleAsync` are the names each bus fixes; pick the shape from the service's event publisher
(`create-domain-event-handler`).

## Mapping

By hand, in a `{Subject}Extensions` class beside the publisher:

```csharp file=OrderContractExtensions.cs
public static class OrderContractExtensions
{
    public static OrderContract ToOrderContract(this Order order, Customer customer) =>
        new(
            order.Id,
            order.Status.ToString(),
            order.CreatedOn,
            new CustomerContract(customer.Id, customer.Name, customer.Email.Value),
            order.Lines.Select(line => new OrderLineContract(line.ProductCode, line.Quantity, line.Price.Amount)).ToList(),
            order.Documents.Select(document => new DocumentContract(document.Kind, document.FileId)).ToList(),
            order.CreatedById);
}
```

## Naming Convention

`PublishIntegrationEventOn{Event}Handler` — the literal "IntegrationEvent", then the domain event that triggers it.

## Location

- Mediator event bus: `{Svc}.Application/Features/{Area}/{Operation}/`
- FastEndpoints event bus: `{Svc}.API/Features/{Area}/{Operation}/`
