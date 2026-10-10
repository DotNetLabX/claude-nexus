---
name: add-integration-event
description: Adds a MassTransit integration event — the contract records, the publisher (the handler that turns a domain event into the contract and publishes it), and where the consumers land. Variant-aware for mediator and FastEndpoints event buses. Use when a business fact must reach another service. For the consumer's body (idempotency, hydration, projection or write-side change), see consumer-patterns.
---

# Add Integration Event

Publishes a business fact to other services over the bus. A domain event stays inside its service; what crosses is
an integration event — a contract record — published by one handler of that domain event.

> **Scope vs `create-domain-event-handler`.** An integration event crosses service boundaries; a domain-event
> handler reacts inside one service. Use this skill when the fact must leave the service.

## Assumes

- **MassTransit**, registered by one call that finds the consumers (`service-registration` § Registration
  Patterns).
- **A contracts project** every publishing and consuming service references — the lowest shared project for event
  contracts; no domain type crosses into it.
- **The domain event and its publisher** (`create-domain-event-handler`) — the integration event is published from
  a handler of it.
- **`consumer-patterns`** for the consumer's body.
- No shared library beyond the contracts project the repo owns.

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

## Steps

1. **Write the contract** — `workflows/EventContract.md`: a flat record per event, every nested shape its own
   record, plain types only.
2. **Write the publisher** — `workflows/Publisher.md`: `PublishIntegrationEventOn{Event}Handler`, the one place the
   event is published, mapping by hand.
3. **Write the consumer(s)** in the receiving services — `workflows/Consumer.md` for where they land and their
   names; `consumer-patterns` for the body.
4. **Verify** the boundaries hold, then build:
   ```bash
   rg -n "using .*\.Domain" {Contracts}                                        # no domain type in the contracts — expect zero
   rg -n "IPublishEndpoint" {Svc} --glob '!**/PublishIntegrationEventOn*'      # published only by the publisher handler — expect zero
   rg -n "AddConsumer<" {Svc}                                                  # no consumer registered by hand — expect zero
   dotnet build
   ```

## Arguments

Pass the event name: `/add-integration-event OrderShipped`

## Consumer is a test harness (no production consumer yet)

A new event may have no production consumer at first. Publish it anyway:

- **Write the contract and the publisher** — the event is a real published fact.
- **Let a test be the consumer** — an `IConsumer<T>` in the test project asserts the event arrives with the right
  payload, shaped like a production consumer.
- **Never a no-op consumer in a real service** — it reads as handling and is worse than none.
- **Record the gap** where the team tracks follow-ups.

## Avoid Duplicates

Search the contracts project for the event before adding one, so no duplicate or near-name appears.
