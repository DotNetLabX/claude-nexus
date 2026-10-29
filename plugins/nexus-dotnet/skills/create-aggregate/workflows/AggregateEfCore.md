# Create Aggregate — EF Core

Used by: services that store their aggregates with EF Core.

## State File: `{Svc}.Domain/{Aggregates}/{Name}.cs`

Members, the backing list, and the private constructor the data library rebuilds through:

```csharp file=Order.cs
public partial class Order : AggregateRoot<int>
{
    private readonly List<OrderLine> _lines = [];

    private Order()
    {
    }

    public required int CustomerId { get; init; }

    public OrderStatus Status { get; private set; }

    public string? TrackingNumber { get; private set; }

    public DateTimeOffset? ShippedOn { get; private set; }

    public IReadOnlyList<OrderLine> Lines => _lines;
}
```

## Behavior File: `{Svc}.Domain/{Aggregates}/Behaviors/{Name}.cs`

The factory and every method that changes state. Each takes the action object last, throws the domain error on a
broken rule, changes state, and raises its event:

```csharp file=Behaviors/Order.cs
public partial class Order
{
    public static Order Place(int customerId, IReadOnlyList<OrderLine> lines, IAction action)
    {
        if (lines.Count == 0)
            throw new DomainException("An order has at least one line.");

        var order = new Order
        {
            CustomerId = customerId,
            Status = OrderStatus.Placed,
            CreatedById = action.ActingUserId,
            CreatedOn = action.ActedOn
        };
        order._lines.AddRange(lines);
        order.AddDomainEvent(new OrderPlaced(order, action));

        return order;
    }

    public void Ship(string trackingNumber, IAction action)
    {
        if (Status is not OrderStatus.Placed)
            throw new DomainException("Only a placed order ships.");

        Status = OrderStatus.Shipped;
        TrackingNumber = trackingNumber;
        ShippedOn = action.ActedOn;
        MarkModified(action);
        AddDomainEvent(new OrderShipped(this, action));
    }
}
```

Where the legal moves depend on the current state and the action, the check is a state machine, not an `if`
(`add-state-machine`).

## Table Configuration: `{Svc}.Persistence/Configurations/{Name}Configuration.cs`

One configuration class per table, derived from the table-configuration base the repo's libraries offer
(`persistence-patterns` § Entity Configuration); the sample is the form for a repo with no such base. Lengths come
from the field-length constants; an enum is stored as text, or as a table of its own where each value carries data
(the two forms, same section):

```csharp file=OrderConfiguration.cs
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(order => order.Id);
        builder.Property(order => order.Status).HasConversion<string>().HasMaxLength(MaxLength.Code);
        builder.Property(order => order.TrackingNumber).HasMaxLength(MaxLength.Code);
        builder.HasMany(order => order.Lines).WithOne().HasForeignKey(line => line.OrderId);
        builder.Navigation(order => order.Lines).HasField("_lines");
    }
}
```

The audit columns and the table names follow `persistence-patterns` § Entity Configuration. A table two writers
really race on takes a version column and changes through the repository base's race-safe change
(`persistence-patterns` § A row two writers race on); every other table keeps the concurrency token off.

## Repository: `{Svc}.Persistence/Repositories/{Name}Repository.cs`

A repository derives the repository base (`persistence-patterns` § Repository Pattern). It overrides `Query()` to
include the collections a change needs, so the base's `GetByIdAsync` loads them, and adds only the named reads this
aggregate needs, named `GetBy{Key}Async`, `Exists…` or `Find…`. A read returns nothing for a missing row, and a
caller adds `.OrThrowNotFound(id)` where the row is required. The sample is `OrderRepository`, in
`persistence-patterns` § Tier 3: A repository with its own reads.

Register it scoped, one line, in the Persistence registration: `services.AddScoped<OrderRepository>()`.
