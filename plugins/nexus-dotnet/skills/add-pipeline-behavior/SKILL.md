---
name: add-pipeline-behavior
description: Creates a mediator pipeline behaviour for a concern that wraps every matching handler — the identity stamp, validation, request logging, or a new one — and places it in the fixed order. Use when adding or changing logic that runs around many handlers in a mediator-style service.
---

# Add Pipeline Behavior

A pipeline behaviour wraps every matching handler of a mediator-style service. FastEndpoints services have no
mediator pipeline: their equivalents are global pre- and post-processors.

> **Scope vs `cqrs-patterns`.** `cqrs-patterns` covers the commands, queries and handlers themselves; this skill
> covers the wrapper that runs around many of them.

## Assumes

- **A mediator** (MediatR in the samples) whose handlers implement `IRequestHandler<TRequest, TResponse>`.
- **FluentValidation** for the validation behaviour.
- No shared library: the behaviours are sampled whole and built once, in the shared place, under Look First.

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

## The Fixed Order

Behaviours run in registration order:

1. **The identity stamp** — sets the acting user and the time on a command that carries an action
   (`authorization-patterns` § Phase 4 — Identity stamping — pick by framework). First, so the others see them.
2. **Validation** — runs every validator of the request, throws one validation error with all failures.
3. **Logging** — the request's start, end and slowness; logging is central, and this is one of its two homes (the
   error middleware is the other).

A new behaviour takes its place by what it needs to see: after the stamp if it reads the acting user, after
validation if it must only see valid requests.

## Validation Behaviour

```csharp file=ValidationBehavior.cs
using FluentValidation;

public class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> _validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var context = new ValidationContext<TRequest>(request);
        var results = await Task.WhenAll(_validators.Select(validator => validator.ValidateAsync(context, ct)));
        var failures = results.SelectMany(result => result.Errors).ToList();

        if (failures.Count > 0)
            throw new ValidationException(failures);

        return await next();
    }
}
```

The central error mapper turns the validation error into a 400 with the failures (`error-handling`).

## Logging Behaviour

```csharp file=LoggingBehavior.cs
using System.Diagnostics;

public class LoggingBehavior<TRequest, TResponse>(ILogger<LoggingBehavior<TRequest, TResponse>> _logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private const int SlowRequestMilliseconds = 500;

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var requestName = typeof(TRequest).Name;
        _logger.LogInformation("Handling {Request}", requestName);
        var stopwatch = Stopwatch.StartNew();

        var response = await next();

        if (stopwatch.ElapsedMilliseconds > SlowRequestMilliseconds)
            _logger.LogWarning("{Request} took {Elapsed} ms", requestName, stopwatch.ElapsedMilliseconds);

        _logger.LogInformation("Handled {Request}", requestName);
        return response;
    }
}
```

Because this behaviour logs every request, handlers do not log. A handler that runs several outside stages, where a
stage can fail or fall back without failing the request, may log a decision or an outcome — and is listed in
`project-lists.md` § Logging classes in the same change.

## A New Behaviour

A behaviour that applies to some requests only constrains `TRequest` to the interface those requests really carry —
the identity stamp constrains to the action interface (`where TRequest : IAction`; its sample is
`authorization-patterns` § Phase 4 — Identity stamping — pick by framework). It never takes every request and branches
on a marker interface at run time. Its shape:

```csharp
public class {Name}Behavior<TRequest, TResponse>({Dependencies})
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : {TheInterfaceItNeeds}
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        {before the handler}

        var response = await next();

        {after the handler}

        return response;
    }
}
```

## Registration

In the Application project's registration, inside the mediator's set-up, in the fixed order
(`service-registration` § Registration Patterns):

```csharp
services.AddMediatR(config =>
{
    config.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
    config.AddOpenBehavior(typeof(StampActionBehavior<,>));
    config.AddOpenBehavior(typeof(ValidationBehavior<,>));
    config.AddOpenBehavior(typeof(LoggingBehavior<,>));
});
```

## Location

A behaviour every service uses is built once, in the shared place; a behaviour one service needs lives in that
service's Application project, `Behaviors/{Name}Behavior.cs`.
