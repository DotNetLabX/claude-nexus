# Map by Hand

One shape is turned into another by hand-written code. The compiler checks every member, and a mistake shows at
build time instead of at run time. A mapping library is the exception, kept only where a shared library the repo
uses needs it.

## Inputs
- Source type (an entity, a value object, another reply)
- Destination type (a reply or a `{Thing}Dto`)
- Members whose names or shapes differ

## Outputs
- An extension method in `{Subject}Extensions.cs`, beside the feature that needs it, or in the area's `_Shared`
  folder once a second feature maps the same type

## Gate
Proceed only after: both types exist. Look for an existing `To{Destination}()` before writing a second one.

## Pattern

A map from an entity to a reply is an extension method named `To{Destination}`, in a static class named for its
subject. Records are built with positional arguments:

```csharp file=OrderExtensions.cs
public static class OrderExtensions
{
    public static GetOrderResponse ToGetOrderResponse(this Order order) =>
        new(order.Id, order.Status, order.CreatedOn, order.Lines.Select(line => line.ToOrderLineDto()).ToList());

    public static OrderDto ToOrderDto(this Order order) =>
        new(order.Id, order.Status, order.CreatedOn);

    public static OrderLineDto ToOrderLineDto(this OrderLine line) =>
        new(line.ProductCode, line.Quantity, line.Price.Amount);
}
```

The shape the list reply carries for each order (`ListOrdersResponse`, the skill's § Requests, Replies and Names)
is a shared `{Thing}Dto` in the area's `_Shared` folder:

```csharp file=OrderDto.cs
public record OrderDto(int Id, OrderStatus Status, DateTimeOffset CreatedOn);
```

A value object flattens explicitly — `line.Price.Amount` above — so a renamed member breaks the build, not a reply.

## Inbound: a Command Never Maps onto an Entity

A command changes an aggregate through the aggregate's behaviour methods (`order.Ship(command.TrackingNumber, command)`), never by copying
its members onto a tracked entity. A new aggregate is built by its factory from the command's values, with the
command as the action (`Order.Place(command.CustomerId, lines, command)`); an update calls the method named for the
change. That keeps every rule inside the aggregate (`create-aggregate`).

## Where Mapping Does Not Belong

- Not in a record — a record is plain data; the map is an extension method or a factory on the class.
- Not in a `…Mapper` or `…Helper` class, and not in a `Mappings/` folder of configuration classes.
- Not through `.Adapt<T>()`, `IRegister`, `IMapper` or an assembly scan for mapping profiles.
