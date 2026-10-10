---
name: cqrs-patterns
description: Commands, queries and handlers in a mediator-style service — the command and query markers, the load-call-save handler, where the pipeline and the validators fit, and how the FastEndpoints style differs. Use when implementing a feature that dispatches through a mediator.
user-invocable: true
---

# CQRS Patterns

A write is a command, a read is a query; each has one handler. This skill is the mediator style's — a FastEndpoints
service has no handler class: its endpoint's `HandleAsync` carries the logic (`create-feature`).

## Assumes

- **A mediator** (MediatR in the samples) and **FluentValidation**.
- **The repository base with throwing lookups** (`persistence-patterns`) and **the save interceptor** that publishes
  domain events after a save.
- No shared library: the markers, behaviours and helpers are sampled in the skills that own them.

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

## Command/Query Interfaces

```csharp file=ICommand.cs
public interface ICommand<out TResponse> : IRequest<TResponse>;
```

```csharp file=IQuery.cs
public interface IQuery<out TResponse> : IRequest<TResponse>
    where TResponse : notnull;
```

Each marker lives in its own file in the shared place. They state intent — a command changes state, a query reads
— and nothing branches on them: no behaviour checks whether a request is a command or a query. A behaviour that
applies to some requests constrains to the interface those requests really carry (`add-pipeline-behavior`).

## Handler Pattern (Load-Call-Save)

```csharp file=ShipOrderCommandHandler.cs
public class ShipOrderCommandHandler(OrderRepository _orderRepository)
    : IRequestHandler<ShipOrderCommand, IdResponse>
{
    public async Task<IdResponse> Handle(ShipOrderCommand command, CancellationToken ct)
    {
        var order = await _orderRepository.GetByIdOrThrowAsync(command.OrderId, ct);

        order.Ship(command.TrackingNumber, command);

        await _orderRepository.SaveChangesAsync(ct);

        return new IdResponse(order.Id);
    }
}
```

Load through a throwing lookup, call the aggregate's behaviour method with the command as its action object (who
acts and when), save, reply. The token is passed to every call that takes one. Domain events go out when the data is
saved. A handler does not log, does not catch to build a reply, and does not check access.

## Pipeline Behaviors

The pipeline runs the identity stamp, then validation, then logging — `add-pipeline-behavior` carries the samples
and the order; `service-registration` § Registration Patterns registers them.

## Validator — Framework Variants

| Endpoint style | Validator base | Run by |
|---|---|---|
| FastEndpoints | `Validator<T>` | the framework, before `HandleAsync` |
| Mediator (Carter or minimal APIs) | `AbstractValidator<T>` | the validation behaviour, before the handler |

A base validator several commands share is named for its family (`OrderCommandValidator<T>`) and holds the rules
they share — a route id greater than zero. It adds nothing else: no logging and no null guard. Messages come from
the shared message helpers (`error-handling` § Validation Messages).

## Registration

The mediator finds its handlers and the validation library its validators; the behaviours are added in order
(`service-registration` § Registration Patterns).
