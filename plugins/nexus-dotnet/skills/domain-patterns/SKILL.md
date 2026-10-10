---
name: domain-patterns
description: DDD design rules for the domain layer — the aggregate and its base, entities, value objects, enums for closed sets, the state and behaviour split, domain events and how they are sent, the action object, and where a state machine fits. Use when designing or changing a domain model; create-aggregate is the build recipe.
user-invocable: true
---

# Domain Patterns

The design rules of a domain project. `create-aggregate` builds an aggregate step by step and carries the samples
of the base classes; this skill is what those samples must satisfy. The samples use an ordering domain — orders,
lines, customers; substitute your own.

## Assumes

- **A Domain project per service** (or a `Domain` folder in a one-project repo) that references no web framework
  and no persistence library.
- **The aggregate base, the event interface and the event publisher** — sampled whole in `create-aggregate` and
  `create-domain-event-handler`; built once under Look First.
- **The action object** every write command carries — who acts and when (`create-feature` § Requests, Replies and
  Names).
- No shared library: nothing here names a package.

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

## AggregateRoot

Every aggregate derives the aggregate base, which supplies the id, the audit fields (who created it and when, who
changed it last and when) and the list of domain events.

- **State in `{Name}.cs`, behaviour in `Behaviors/{Name}.cs`** (a partial class), with `Events/`, `Enums/` and
  `ValueObjects/` folders beside them.
- **A member set once, at creation,** is `init` — and `required` when it must be given — set through an object
  initialiser in the aggregate's factory.
- **A member that behaviour changes later** has a private setter and changes only through the aggregate's own
  methods.
- **The data library rebuilds an aggregate through a private constructor** — no `Reconstitute` method.
- **A broken rule throws the domain error,** its message written where the rule is (`error-handling`). No
  validator classes and no limits records in the domain: input shape is checked at the edge, rules in the aggregate.
- **A behaviour method takes the action object** — who acts and when, as the command carries it — never a `now`
  argument. Time members end in `On` (`ShippedOn`).
- **The time comes from the action,** which the stamping hook fills from the injected clock — the domain never reads
  the system clock.
- **The domain is not held to a stricter rule than the code around it:** it may reference contracts, the JSON
  library, or a mapping library a shared library needs, and a factory may take the incoming contract shape so the
  aggregate builds itself from it. How one shape becomes another is hand-written (the conventions' § Classes and
  Methods).

> **Identity-model variant.** A service that adopts ASP.NET Core Identity extends `IdentityUser<int>` for its user
> and implements the aggregate interface by hand, because the Identity base is fixed. A service whose identity comes
> from an outside provider keeps its user a plain entity. Record the choice in the service's `CLAUDE.md`.

## Entity

- An entity has an id and equality by id; two new entities (no id yet) are never equal.
- **Collections by layer:** an entity keeps a private list and shows it read-only — `IReadOnlyList<T>`, or
  `IReadOnlyCollection<T>` over a set — while requests, replies and shared shapes carry `List<T>` or `HashSet<T>`.
- **Cross-aggregate references by id only,** never a navigation property to another aggregate.
- **`required` with a private setter does not compile** (CS9032). A member behaviour changes after creation drops
  `required`; the factory, through the private constructor, is then the only way in.
- **Which id type and which time type an entity uses is not settled** — a whole number and a `Guid` each have their
  purpose. An entity keeps the id and time types it has. A first guide: one `Guid` in a route reads fine, several ids
  in one route do not, and a catalog has no need of a `Guid`.

## Promoting an Entity to an AggregateRoot in place

An entity that gains its own consistency boundary — raises events, is loaded as a root — is promoted in place:

1. **Change the base** to the aggregate base; the id type must line up at every reference (repository, table
   configuration).
2. **Adopt the behaviour split** — move its mutating methods into `Behaviors/{Name}.cs`.
3. **Route writes through the root** — callers that changed it directly now call a behaviour method.
4. **Check the schema at plan time:** the base's audit columns make a migration.

Promote only when it truly gains a boundary; a child of another aggregate stays an entity.

## Value Objects

A value that exists as a concept with a rule — an e-mail address, an amount of money, a date range — is a class with
a private constructor and a guarded static `Create`, compared by value (`../create-aggregate/workflows/ValueObject.md`).

- **Two or more fields always used together, or sharing an invariant,** form one value object; an incidental scalar
  with no rule (a count, a flag) stays a plain property.
- **Each service owns its value objects,** even when two services hold the same shape.
- **A choice: no domain objects forced on a service with little real domain.** A value becomes a type with its rule
  on it where one class shows that it helps; until then a closed set of values is an enum. Value objects are ceremony
  where nothing is protected.

Persistence maps them as owned or complex types (`persistence-patterns`).

## Enums

- **A closed set of values is an enum,** written as text on the wire and in storage — one converter for the wire (the
  host's JSON settings), one for storage (the table configuration).
- **An enum that needs data** (a display order, a limit per value) becomes a seeded table type instead.
- **A `switch` over a closed set** is a sign the value should carry the answer itself.

## Partial Class Behavior Split

```text
Orders/
├── Order.cs                 state: members, the private constructor, the backing list
├── Behaviors/
│   └── Order.cs             behaviour: the factory and the methods that change state and raise events
├── Events/
│   ├── OrderPlaced.cs
│   └── OrderShipped.cs
├── Enums/
│   └── OrderStatus.cs
└── ValueObjects/
    └── EmailAddress.cs
```

The action object is a behaviour method's **last** parameter, after the values and any factory it needs:
`order.Ship(trackingNumber, action)`, `order.Approve(stateMachineFactory, action)`.

## Domain Events

- **A domain event is a fact,** raised after the change succeeds, named in the past tense (`OrderShipped`), a record
  carrying the aggregate and, where the service tracks it, the action:

```csharp file=OrderShipped.cs
public record OrderShipped(Order Order, IAction Action) : IDomainEvent;
```

- **A domain event stays inside the process.** What crosses to another service is an integration event, published
  by a handler named `PublishIntegrationEventOn{Event}Handler` as a contract record (`add-integration-event`).
- **The event interface carries the event bus's marker** — the mediator's or FastEndpoints' — so the publisher is a
  choice made at registration (`create-domain-event-handler` § Decision 1 — publisher implementation).

## Event Dispatch

Domain events are sent **when the data is saved**: a save interceptor collects the events of every tracked
aggregate after a successful save, clears them, and sends each through the event publisher. No endpoint and no
handler publishes a domain event by hand on that path. The interceptor's sample is in `persistence-patterns`; the
publisher's, and the manual-publish path for a store with no interceptor, in `create-domain-event-handler`.

## State Machine Pattern

Where an aggregate's lifecycle gates its changes by action, the legal moves are seed data, checked by a validator a
factory supplies, before the aggregate changes state. The factory is a delegate registered once, so the domain never
builds the machine itself. The build recipe is `add-state-machine`.
