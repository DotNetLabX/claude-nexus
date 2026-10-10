# Create Integration Event Consumer

The consumer in each receiving service. The bus finds it; there is no registration line per consumer.

> **The body lives in `consumer-patterns`.** This file covers where a consumer lands and its name; the five phases,
> the idempotency variants and the no-swallow rule are `consumer-patterns`.

## Placement — the project that registers the bus

A consumer goes in the project that registers the service's bus (`service-registration` § What Goes Where):

- a service **with** an Application project registers the bus there, so its consumers live there;
- a service **without** one registers it in the API project, so its consumers live there.

Place by the registration, never by how simple or rich the consumer is.

## Class shape

```csharp
public class {Event}Consumer({Dependencies}) : IConsumer<{Event}Event>
{
    public async Task Consume(ConsumeContext<{Event}Event> context)
    {
        {idempotency first, hydration, the change, one save with context.CancellationToken}
    }
}
```

## Registration

The one call that registers the bus finds the consumers — `bus.AddConsumers(typeof(DependencyInjection).Assembly)`
(`service-registration` § Registration Patterns). No `AddConsumer<T>` line per consumer.

## Naming Convention

`{Event}Consumer` — the event's name without its `Event` suffix: `OrderPlacedEvent` → `OrderPlacedConsumer`. A class
named for its effect is a domain-event handler, not a consumer.

## Location

The bus-registering project, then the service's folder convention:

- a feature-organised service: `Features/{Area}/{Operation}/` for a consumer that owns a slice of work, or
  `Features/{Thing}Created/` and `Features/{Thing}Updated/` for a replicated-row pair;
- a read-model service: `{Area}/Consumers/`.
