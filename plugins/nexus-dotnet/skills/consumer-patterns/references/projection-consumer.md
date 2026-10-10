# Template: read-model projection consumer

A read-model service writes to a **plain data class** — public members, `List<T>` collections, no behaviour. There
is no factory and no rule to run: the consumer sets the members from the event's contract, by hand. Every field the
read model needs must be in the event, because the read model calls no other service.

The projection it writes to:

```csharp file=OrderSummary.cs
public class OrderSummary
{
    public int Id { get; set; }

    public required string CustomerName { get; set; }

    public required string Status { get; set; }

    public DateTimeOffset PlacedOn { get; set; }

    public DateTimeOffset? ShippedOn { get; set; }

    public List<OrderSummaryLine> Lines { get; set; } = [];
}
```

## Variant A — create the row (the first event of its lifecycle)

**Throw on duplicate:** the first event creates the row exactly once.

```csharp file=OrderPlacedConsumer.cs
public class OrderPlacedConsumer(ReportingDbContext _dbContext) : IConsumer<OrderPlacedEvent>
{
    public async Task Consume(ConsumeContext<OrderPlacedEvent> context)
    {
        var order = context.Message.Order;
        var ct = context.CancellationToken;

        if (await _dbContext.OrderSummaries.AnyAsync(summary => summary.Id == order.Id, ct))
            throw new AlreadyExistsException($"Order {order.Id} is already summarised.");

        _dbContext.OrderSummaries.Add(new OrderSummary
        {
            Id = order.Id,
            CustomerName = order.Customer.Name,
            Status = order.Status,
            PlacedOn = order.PlacedOn,
            Lines = order.Lines.Select(line => new OrderSummaryLine(line.ProductCode, line.Quantity)).ToList()
        });

        await _dbContext.SaveChangesAsync(ct);
    }
}
```

## Variant B — update the row (a later event of the same lifecycle)

The row must exist from an earlier event, so idempotency inverts: **load or throw**, then set only what this event
changes. Setting the same values twice converges, so a redelivery is harmless.

```csharp file=OrderShippedConsumer.cs
public class OrderShippedConsumer(ReportingDbContext _dbContext) : IConsumer<OrderShippedEvent>
{
    public async Task Consume(ConsumeContext<OrderShippedEvent> context)
    {
        var shipped = context.Message;
        var ct = context.CancellationToken;

        var summary = await _dbContext.OrderSummaries.SingleOrThrowAsync(summary => summary.Id == shipped.OrderId, ct);
        summary.Status = shipped.Status;
        summary.ShippedOn = shipped.ShippedOn;

        await _dbContext.SaveChangesAsync(ct);
    }
}
```

`SingleOrThrowAsync` is the queryable throwing lookup (`persistence-patterns`): it throws not-found when the row is
absent, and the bus delivers the message again.
