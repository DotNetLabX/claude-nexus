# Create Integration Event Consumer

MassTransit consumer in the target service. Auto-discovered — no manual registration.

## Placement — key off the registration site, not the consumer's shape

The consumer goes in **whichever project calls `AddMassTransitWithRabbitMQ(...)`** for the target service — regardless of whether the consumer is simple or rich. Grep the service for that call and place the consumer in the same project (`{ConsumerProject}` below):

- A service **with** an `.Application` project registers MassTransit there → consumers live in `.Application`.
- A service **without** one registers in `.API` → consumers live in `.API`.

The Simple/Rich split below is about the consumer's **shape** (update/upsert vs factory + supporting entities), not about which project it lands in. Do not key placement off complexity — the reference app hosts a rich consumer in `.API` (Production) and simple consumers in `.Application` (Submission/Review).

## Simple Consumer (Update/Upsert)

**Reference:** `src/Services/{Svc}/{ConsumerProject}/{Domain}/Consumers/{EventName}Consumer.cs`

```csharp
public class {EventName}Consumer({DbContext} _dbContext)
    : IConsumer<{EventName}Event>
{
    public async Task Consume(ConsumeContext<{EventName}Event> context)
    {
        var dto = context.Message.{DtoName};

        // Idempotency: check if already processed
        var existing = await _dbContext.{Entities}
            .SingleOrDefaultAsync(e => e.Id == dto.Id);

        if (existing != null)
        {
            existing.{Property} = dto.{Property};
        }
        else
        {
            var entity = dto.Adapt<{Entity}>();
            await _dbContext.{Entities}.AddAsync(entity);
        }

        await _dbContext.SaveChangesAsync();
    }
}
```

## Rich Consumer (Factory Method + Supporting Entities)

**Reference:** `src/Services/{Svc}/{ConsumerProject}/Features/{Domain}/{Feature}/{EventName}Consumer.cs`

When the consumer creates a full local aggregate with supporting entities:

```csharp
public class {EventName}Consumer({Dependencies})
    : IConsumer<{EventName}Event>
{
    public async Task Consume(ConsumeContext<{EventName}Event> context)
    {
        var dto = context.Message.{DtoName};

        // Idempotency
        await _repository.EnsureNotExistsOrThrowAsync(dto.Id);

        // Factory method on aggregate
        var entity = {Entity}.From{Source}(dto);

        // Create supporting entities
        await GetOrCreate{RelatedEntity}(dto);

        await _repository.AddAsync(entity);
        await _repository.SaveChangesAsync();
    }
}
```

## Rules

1. **Consumers MUST be idempotent** — events may be delivered more than once
2. Check for existing records before inserting
3. `sealed` is optional — a minority pattern in the reference app (2 of 9 consumers), not a rule
4. Inject DbContext or repository depending on the service's persistence pattern
5. Use Mapster for DTO → entity mapping
6. Factory methods (e.g., `{Entity}.From{Source}()`) keep creation logic in the domain

## Registration

Auto-discovered by MassTransit:
```csharp
config.AddConsumers(assembly);
```

Queue naming handled by `SnakeCaseWithServiceSuffixNameFormatter`.

## Naming Convention

`{EventName}Consumer` — matches the event name without "Event" suffix.
Example: `OrderAcceptedForFulfillmentEvent` -> `OrderAcceptedForFulfillmentConsumer`

## Location

Project = wherever `AddMassTransitWithRabbitMQ(...)` is registered (see **Placement** above). Sub-path follows the service's folder convention:

- Read-model / API-only services: `{Svc}.API/{Domain}/Consumers/`
- Feature-organized services: `{ConsumerProject}/Features/{Domain}/Consumers/` (or `.../{Feature}/` for a rich consumer that owns a feature slice)
