---
name: create-aggregate
description: Creates a DDD aggregate root with behavior split, value objects, domain events, EF config, and repository. Variant-aware for EF Core and Redis persistence. Use when adding a new aggregate to a service's domain model.
---

# Create Aggregate

Creates a DDD aggregate root following the partial class behavior split pattern.

## Steps

1. **Create the aggregate** — variant determines the pattern:
   - EF Core service → `workflows/AggregateEfCore.md`
   - Redis service → `workflows/AggregateRedis.md`

2. **Create value objects** (if needed) — follow `workflows/ValueObject.md`

3. **Create domain events** (if needed) — follow `workflows/DomainEvent.md`

4. **Create EF Core entity configuration** (EF variant only) — included in `workflows/AggregateEfCore.md`

5. **Create/update the repository** — included in the variant workflow

6. **Add migration** (EF variant only):
   ```bash
   dotnet ef migrations add {Name} -p Services/{Svc}/{Svc}.Persistence -s Services/{Svc}/{Svc}.API
   ```

7. **Verify the build:** `dotnet build`

## Arguments

Pass the aggregate name: `/create-aggregate OrderItem`

## Promote an Existing Entity to an Aggregate Root (in place)

Promoting `{Entity} : Entity<TKey>` to `AggregateRoot<TKey>` is a **type-change-in-place**, not a fresh scaffold — most Steps above don't apply. What does:

1. **Change the base class** on the existing state partial. Keep the entity's existing EF configuration class and repository — do NOT swap them for the scaffold's bases.
2. **Check the schema consequence at plan time, not after.** If the aggregate base adds mapped members (audit columns, concurrency token), read the model snapshot: if sibling aggregates in the same DbContext map those columns and nothing ignores them, the promotion WILL generate a migration — treat it as mandatory, not "diff and decide".
3. **Mirror an existing aggregate in the same service** for the behavior split and event-raising pattern (e.g. raise the created event *after* save when the PK is store-generated, so the event carries a real id).
4. **Domain events and behavior methods** — follow `workflows/DomainEvent.md`; move external mutation into behavior methods as usual.

Variant note: with ASP.NET Core Identity, `User` cannot extend `AggregateRoot<T>` (see Special Cases). In a plain-DDD identity model the promotion applies normally.

## Special Cases

- **Identity `User`:** Cannot extend `AggregateRoot<T>` due to `IdentityUser` constraint — must implement `IAggregateRoot` manually
- **Redis services:** Uses `Blocks.Redis.Entity` base, not `AggregateRoot`. No audit fields, no domain event queue on the base class. Domain events still exist (`IDomainEvent` records) and are dispatched via FastEndpoints `IEventHandler`.
