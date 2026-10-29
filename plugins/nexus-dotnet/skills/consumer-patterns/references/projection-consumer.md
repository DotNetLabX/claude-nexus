# Template: read-model projection consumer

A read-model service writes to a **plain data class** on the entity base — an id, public members, `List<T>`
collections, no behaviour. There is no factory and no rule to run: the consumer sets the members from the event's
contract, by hand. Every field the read model needs must be in the event, because the read model calls no other
service.

The projection it writes to:

```csharp file=OrderSummary.cs
public class OrderSummary : Entity<int>
{
    public required string CustomerName { get; set; }

    public required string Status { get; set; }

    public DateTimeOffset PlacedOn { get; set; }

    public DateTimeOffset? ShippedOn { get; set; }

    public List<OrderSummaryLine> Lines { get; set; } = [];
}
```

The row has an id, so the repository base fits it as it fits an aggregate: the reporting service's own repository,
over its own data context (`persistence-patterns` § Repository Pattern). The consumer reads and saves
through it and never touches the data context:

```csharp file=OrderSummaryRepository.cs
public class OrderSummaryRepository(ReportingDbContext dbContext) : RepositoryBase<ReportingDbContext, OrderSummary>(dbContext);
```

The reporting service's persistence registration adds it by its own scoped line, as it does every derived repository
(`persistence-patterns` § Spine Rules): `services.AddScoped<OrderSummaryRepository>();`.

## Variant A — create the row (the first event of its lifecycle)

**Throw on duplicate:** the first event creates the row exactly once.

```csharp file=OrderPlacedConsumer.cs
public class OrderPlacedConsumer(OrderSummaryRepository _orderSummaryRepository) : IConsumer<OrderPlacedEvent>
{
    public async Task Consume(ConsumeContext<OrderPlacedEvent> context)
    {
        var order = context.Message.Order;
        var ct = context.CancellationToken;

        if (await _orderSummaryRepository.ExistsAsync(order.Id, ct))
            throw new AlreadyExistsException($"Order {order.Id} is already summarised.");

        await _orderSummaryRepository.AddAsync(new OrderSummary
        {
            Id = order.Id,
            CustomerName = order.Customer.Name,
            Status = order.Status,
            PlacedOn = order.PlacedOn,
            Lines = order.Lines.Select(line => new OrderSummaryLine(line.ProductCode, line.Quantity)).ToList()
        }, ct);

        await _orderSummaryRepository.SaveChangesAsync(ct);
    }
}
```

## Variant B — update the row (a later event of the same lifecycle)

The row must exist from an earlier event, so idempotency inverts: **load or throw**, then set only what this event
changes. Setting the same values twice converges, so a redelivery is harmless.

```csharp file=OrderShippedConsumer.cs
public class OrderShippedConsumer(OrderSummaryRepository _orderSummaryRepository) : IConsumer<OrderShippedEvent>
{
    public async Task Consume(ConsumeContext<OrderShippedEvent> context)
    {
        var shipped = context.Message;
        var ct = context.CancellationToken;

        var summary = (await _orderSummaryRepository.GetByIdAsync(shipped.OrderId, ct)).OrThrowNotFound(shipped.OrderId);
        summary.Status = shipped.Status;
        summary.ShippedOn = shipped.ShippedOn;

        await _orderSummaryRepository.SaveChangesAsync(ct);
    }
}
```

The load is tracked because the row is changed and saved. `.OrThrowNotFound(id)` is the not-found guard
(`error-handling` § Guard Utilities): it throws not-found when the row is absent, and the bus delivers the message
again.
