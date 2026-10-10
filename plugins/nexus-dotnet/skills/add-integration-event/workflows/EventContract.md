# Create Integration Event Contract

## Pattern

Create the contract in the contracts project, `{Contracts}/{Area}/{Event}Event.cs`. Its namespace is whatever that
project already declares — open an existing contract and copy it; never derive it from the folder name.

Every record is **flat**: plain members (numbers, text, dates, enums), and every nested shape is its own record in
its own file — never a domain type, never a nested type.

```csharp file=OrderPlacedEvent.cs
public record OrderPlacedEvent(OrderContract Order);
```

```csharp file=OrderContract.cs
public record OrderContract(
    int Id,
    string Status,
    DateTimeOffset PlacedOn,
    CustomerContract Customer,
    List<OrderLineContract> Lines,
    List<DocumentContract> Documents,
    int PlacedById);
```

```csharp file=CustomerContract.cs
public record CustomerContract(int Id, string Name, string Email);
```

```csharp file=OrderLineContract.cs
public record OrderLineContract(string ProductCode, int Quantity, decimal Price);
```

An event about one change can carry only what changed:

```csharp file=OrderShippedEvent.cs
public record OrderShippedEvent(int OrderId, string Status, string TrackingNumber, DateTimeOffset ShippedOn);
```

## Rules

- Contracts are records; their positional members are PascalCase.
- **Carry everything a consumer needs** — a consumer never calls back to the publishing service.
- **Plain types only** — no domain type, no value object, no entity; an enum is sent as text.
- **Named for what happened, in the past tense, ending `Event`** — `OrderPlacedEvent`.
- **A contract is a snapshot** of the state at the time of the event.
- **Each nested shape is its own record,** named `{Thing}Contract`, in its own file.
