---
name: consumer-patterns
description: Author or edit a MassTransit integration-event consumer — the consumer class and its dependencies, the three idempotency variants and when each fits, local reference-data hydration, the split between a read-model projection and a write-side domain change, and the no-swallow rule. Use when adding or editing an IConsumer that reacts to another service's integration event. To propagate a new event (contract, publisher, wiring), use add-integration-event; this skill owns the consumer's body.
user-invocable: true
---

# Consumer Patterns

A consumer is how one service reacts to another service's integration event: it brings the foreign data it needs
into its own store, then either projects a read model or changes an aggregate. Always five phases, in one order.
The samples use an ordering domain — a fulfilment service reacting to `OrderPlacedEvent`; substitute your own.

## Assumes

- **MassTransit** as the bus, registered by one call that finds the consumers (`service-registration` § Registration
  Patterns).
- **The repository base** with `ExistsAsync`, `UpsertAsync` and the throwing lookups, and the queryable
  `SingleOrThrowAsync` (`persistence-patterns`); the error family (`error-handling`).
- **The contract records** of the event (`add-integration-event`).
- No shared library: every helper named here has a sample in the skill that owns it.

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

## When to use

Adding or editing a class that implements `IConsumer<TEvent>` for another service's integration event. Not for a
domain-event handler — an in-process `INotificationHandler` or `IEventHandler`, named for its effect
(`create-domain-event-handler`). Copy the closest template from `references/` and fill each phase.

## The five phases

1. **The class and its dependencies.** A consumer is named for the event it receives — `{Event}Consumer`
   (`OrderPlacedConsumer` for `OrderPlacedEvent`); a class named for its effect is a domain-event handler instead.
   It takes the service's data context and repositories as concrete classes; an outside system it calls (a file
   store) comes through that system's interface.
2. **Idempotency, first.** Guard against a second delivery before any write, so a redelivery is cheap. Pick one of
   the three variants below.
3. **Local reference-data hydration.** Foreign data is replicated by events, never fetched on demand: look it up in
   the local store and build it from the event's contract only when it is missing — a private
   `GetOrCreate{Thing}Async` step, mapping by hand. Reference data that changes on its own (a product's name) is
   kept fresh by a `{Thing}Created` / `{Thing}Updated` consumer pair instead (`references/reference-data-consumer.md`).
4. **The change.** A write-side service builds or changes the aggregate through its factory or behaviour method, so
   its rules run. A read-model service sets the members of its projection — a plain data class with no behaviour.
   When the event carries files, copy their bytes into this service's own store here (`file-storage-patterns`).
5. **Save once,** at the end, passing `context.CancellationToken`. The data context is the unit of work.

**No swallowing.** A consumer has no `catch`, or its `catch` undoes the consumer's own work and rethrows, so the bus
delivers the message again. A consumer that swallows a failure loses the message for good. A consumer does not log.

## Idempotency: pick one of three

| Variant | Mechanism | Use when |
|---|---|---|
| Silent skip | `if (await _repository.ExistsAsync(id, ct)) return;` — or `UpsertAsync` for an update | a redelivery is normal and harmless — reference-data replication |
| Throw on duplicate | `throw new AlreadyExistsException(…)` when the row exists | the row is created exactly once, and a second delivery is a bug to surface |
| Load or throw | `SingleOrThrowAsync(…)`, then change it | a later event changes a row an earlier one created |

Decision rule: reference data → silent skip. Aggregate creation where a duplicate is a bug worth seeing → throw.
Aggregate creation where you would rather absorb the redelivery → silent skip. A later stage of the same row → load
or throw (`references/projection-consumer.md`, variant B).

## Templates

- `references/write-side-consumer.md` — aggregate creation, all five phases, with reference data and file copying.
- `references/projection-consumer.md` — a read model: variant A creates the row, variant B updates it.
- `references/reference-data-consumer.md` — the `{Thing}Created` / `{Thing}Updated` replicated-row pair.

## What this skill does NOT do

- Create the contract, the publisher or the bus registration — `add-integration-event`.
- In-process domain-event handlers — `create-domain-event-handler`.
- File-store mechanics — `file-storage-patterns`.
