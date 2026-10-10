# Scaffold Application Project

**Only where the CLAUDE.md's Application axis is Y.** Always in the mediator style (Carter or minimal APIs with a
mediator), where the handlers live here. A FastEndpoints service has one only when it holds shared application
pieces — a state machine factory, the access checker — and then without the mediator registration and without
`Features/`: its endpoints keep their logic. With no Application project, API references Persistence directly.

## `{Name}.Application/GlobalUsings.cs`

```csharp
global using FluentValidation;
global using MediatR;
global using {Name}.Domain;
global using {Name}.Persistence;
```

Add `MassTransit` and the event contracts' namespace only when the service publishes or consumes events.

## `{Name}.Application/DependencyInjection.cs`

The mediator with its behaviours in the fixed order, and the validators — `service-registration` § Registration
Patterns:

```csharp
public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMediatR(config =>
        {
            config.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            config.AddOpenBehavior(typeof(StampActionBehavior<,>));
            config.AddOpenBehavior(typeof(ValidationBehavior<,>));
            config.AddOpenBehavior(typeof(LoggingBehavior<,>));
        });
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        return services;
    }
}
```

The three behaviours are found first, or built once in the shared place (`add-pipeline-behavior`,
`authorization-patterns` § Phase 4 — Identity stamping — pick by framework). There is no mapping library to
register: mapping is by hand.

## What goes in the Application project

- `Features/{Area}/{Operation}/` — commands, queries, their validators, handlers, consumers
- Factories of per-call objects (a state machine factory) and the resource access checker
- Nothing shared across features as a dump: a shape two features share moves to the area's `_Shared` folder

## After this step

Next: `ScaffoldInfrastructure.md`.
