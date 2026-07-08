# Create Integration Event Consumer

MassTransit consumer in the target service. Auto-discovered — no manual registration.

> **Authoring depth lives in `consumer-patterns`.** This file is the **wiring minimum**: where the consumer lands, how it is discovered, and how it is named. The consumer *body* — the three idempotency variants and when each fits, local reference-data hydration, and the read-model-projection vs write-side-mutation split — is `consumer-patterns` (author/edit an `IConsumer`). Add the event here; write the consumer's insides there.

## Placement — key off the registration site, not the consumer's shape

The consumer goes in **whichever project calls `AddMassTransitWithRabbitMQ(...)`** for the target service — regardless of whether the consumer is simple or rich. Grep the service for that call and place the consumer in the same project (`{ConsumerProject}` below):

- A service **with** an `.Application` project registers MassTransit there → consumers live in `.Application`.
- A service **without** one registers in `.API` → consumers live in `.API`.

Do not key placement off complexity — the reference app hosts a rich consumer in `.API` (Production) and simple consumers in `.Application` (Submission/Review).

## Class shape

The minimal shape — one class implementing `IConsumer<TEvent>`, idempotency guard first, one save last. Fill the body per `consumer-patterns`.

```csharp
public class {EventName}Consumer({Dependencies})
    : IConsumer<{EventName}Event>
{
    public async Task Consume(ConsumeContext<{EventName}Event> context)
    {
        var dto = context.Message.{DtoName};

        // 1. Idempotency guard FIRST (pick a variant — see consumer-patterns).
        // 2. Hydrate foreign reference data (GetOrCreate — see consumer-patterns).
        // 3. Projection write OR aggregate mutation through its factory.
        // 4. One SaveChangesAsync at the end.
        await _dbContext.SaveChangesAsync(context.CancellationToken);
    }
}
```

## Registration

Auto-discovered by MassTransit — no per-consumer registration:

```csharp
config.AddConsumers(assembly);
```

Queue naming handled by `SnakeCaseWithServiceSuffixNameFormatter`.

## Naming Convention

`{EventName}Consumer` — matches the event name without the "Event" suffix.
Example: `OrderAcceptedForFulfillmentEvent` -> `OrderAcceptedForFulfillmentConsumer`.

## Location

Project = wherever `AddMassTransitWithRabbitMQ(...)` is registered (see **Placement** above). Sub-path follows the service's folder convention:

- Read-model / API-only services: `{Svc}.API/{Domain}/Consumers/`
- Feature-organized services: `{ConsumerProject}/Features/{Domain}/Consumers/` (or `.../{Feature}/` for a rich consumer that owns a feature slice)
