---
name: domain-service
description: Creates a Domain-layer class for a computation that spans several aggregates — a calculator, resolver or checker named for its job, pure by default, returning domain types. Use when a calculation, a score, a derived figure or a check needs more than one aggregate and belongs in the Domain layer — including figures computed over several periods (totals, rates, trends).
user-invocable: true
---

# Domain Service

A Domain-layer class that holds a computation crossing several aggregates. Logic of one aggregate stays in that
aggregate's behaviour methods; only what genuinely spans several, or is too large for any one of them, comes here.
The name "domain service" is the pattern's; the class itself is never named `…Service`.

## Assumes

- **A Domain project** for the service, holding the aggregates and value objects the computation reads.
- **A caller that loads the data** — a handler or an endpoint — and passes it in.
- No shared library and no persistence library in the Domain project.

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

## Governing Principles

- **Computation in the domain** — a computation over several aggregates lives in the Domain layer and returns
  domain types or domain result records.
- **No outside shapes in** — no request, reply or contract record enters the Domain.
- **The endpoint owns its reply** — it maps the domain result to its own reply, by hand, even when the shapes match.

## When to Use

- The computation needs two or more aggregates — an order's total with the customer's discount and the current price
  list, whether stock covers every line of an order.
- It can be tested without a database.
- A figure computed over several periods — a total, a rate, a trend, a change against the prior period — is the
  same pattern: a calculator over the periods its caller loads, returning one result record per period. The
  period-specific helpers (a rolling average, a change and its direction) are private steps of that calculator.

## Location

```text
{Svc}.Domain/
  {Area}/
    {Name}Calculator.cs     the class
    {Name}Result.cs         its result record, when it has one
```

A computation over several aggregates found in an API project — an `…Service` class beside the endpoints — belongs
here.

## Naming Rule

Named for its job, from the vocabulary — calculator, resolver, checker, factory, provider — never `…Service`, never
`Helper`, `Builder` or `Planner`:

| Good | Bad |
|------|-----|
| `OrderTotalCalculator` | `OrderTotalService` |
| `DeliveryDateResolver` | `DeliveryDomainService` |
| `StockAvailabilityChecker` | `StockHelper` |

## Dependencies — Pure by Default

The class works on aggregates its caller loads and passes in. No database, so a unit test builds the inputs and
asserts the result.

```csharp file=OrderTotalCalculator.cs
public class OrderTotalCalculator
{
    public OrderTotal Calculate(Order order, Customer customer, IReadOnlyList<Price> prices)
    {
        var subtotal = order.Lines.Sum(line => line.Quantity * PriceOf(line.ProductCode, prices));
        var discount = subtotal * customer.DiscountRate;

        return new OrderTotal(subtotal, discount, subtotal - discount);
    }

    private static decimal PriceOf(string productCode, IReadOnlyList<Price> prices) =>
        prices.FirstOrDefault(price => price.ProductCode == productCode)?.Amount
            ?? throw new DomainException($"Product {productCode} has no price.");
}
```

```csharp file=OrderTotal.cs
public record OrderTotal(decimal Subtotal, decimal Discount, decimal Total);
```

### Escape Hatch — Narrow Domain-Owned Read Port (performance only)

When loading everything first is impractical — a history of hundreds of periods — the class takes a **narrow read
port**: an interface declared in the Domain project, returning domain types only, named for the read it performs. It
has an interface because the database is an outside call a test must replace.

```csharp file=IOrderHistory.cs
public interface IOrderHistory
{
    Task<IReadOnlyList<OrderTotal>> GetClosedPeriodTotalsAsync(int customerId, int periodCount, CancellationToken ct = default);
}
```

Never a generic repository, an `IQueryable<T>` or a data context in the Domain. The read port's implementation is a
read store in the Persistence project, registered there (`persistence-patterns`).

## Output Boundary — Endpoint Always Owns the Response DTO

The class returns domain types or domain result records, never a reply type. The endpoint maps the result to its own
reply — a reply that wraps several shapes (a summary with a list, a choice between two modes) is assembled by the
endpoint, never mirrored into the Domain.

```csharp
var total = _orderTotalCalculator.Calculate(order, customer, prices);
await Send.OkAsync(new GetOrderTotalResponse(total.Subtotal, total.Discount, total.Total), ct);
```

## Input Boundary — No DTOs Enter the Domain

Parameters are domain types, value objects, or plain numbers the computation needs (a period count, a window size).
An outside shape — a contract, another system's reply — is mapped to domain types before the class sees it.

## DI Registration

Scoped, one line, where the service registers its application classes (`service-registration` § What Goes Where):
`services.AddScoped<OrderTotalCalculator>()`. A read port's implementation is registered in Persistence:
`services.AddScoped<IOrderHistory, OrderHistoryReadStore>()`.

## When This Doesn't Apply — The Application-Layer Service (Contrast)

Orchestration — loading, coordinating, saving — is not this pattern. It is a handler (or an endpoint), which may use
the data context and repositories; the resource access checker (`authorization-patterns`) is the same kind of class.
This skill's class computes; it never loads.

## Relationship to Other Skills

| Skill | Relationship |
|-------|-------------|
| `domain-patterns` | The aggregates and value objects the class reads and returns |
| `persistence-patterns` | The read store behind a read port |
| `create-feature` | Logic several endpoints share lives in a base endpoint, not in an operation class |
| `service-registration` | Where the class is registered |

## What This Skill Does NOT Cover

- Behaviour of one aggregate — `domain-patterns`.
- Table configuration for a result record — `persistence-patterns`.
- The endpoint — `create-feature`.
