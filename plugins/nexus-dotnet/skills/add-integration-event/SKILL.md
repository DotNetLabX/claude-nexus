---
name: add-integration-event
description: Adds a MassTransit integration event — contract, publisher (domain event handler), and consumer wiring. Variant-aware for MediatR and FastEndpoints handlers. Use when a business event needs to propagate across service boundaries. For the consumer body itself (idempotency variants, reference-data hydration, projection vs write-side), see consumer-patterns.
---

# Add Integration Event

Creates a complete MassTransit integration event with contract, publisher, and consumer(s).

> **Scope vs `create-domain-event-handler`.** An *integration event* propagates a business fact **across service boundaries** over MassTransit (contract in a shared `.Integration.Contracts` package, published by a domain-event handler, consumed by other services). A *domain event handler* reacts to a domain event **inside the same service** (SignalR broadcast, background-job trigger). Use this skill when the event must leave the service; use `create-domain-event-handler` when it stays in-process.

## Assumes

- **A MassTransit + RabbitMQ wiring site** — the service registers the bus with `AddMassTransitWithRabbitMQ`
  (see `service-registration`), so a published event actually reaches the broker and consumers are
  auto-discovered.
- **A shared `{ProjectName}.Integration.Contracts` package** for the event contract (no domain types cross
  it — the Step 4 grep enforces this).
- **The `consumer-patterns` hand-off** for the consumer body — this skill wires the contract, publisher,
  and consumer placement; the idempotency / hydration / projection-vs-write-side logic lives there.

**No MassTransit yet?** This skill assumes the transport is already wired; standing up MassTransit +
RabbitMQ itself is `service-registration`'s job, not this one.

## Steps

1. **Create the event contract** — follow `workflows/EventContract.md`
2. **Create the publisher** (domain event handler) — follow `workflows/Publisher.md` (variant-aware)
3. **Create consumer(s)** in target services — `workflows/Consumer.md` for placement, discovery, and naming; **`consumer-patterns`** for the consumer body (idempotency, hydration, projection vs write-side)
4. **Verify** the boundary rules hold, then build (replace `{ProjectName}`/`{Svc}`):
   ```bash
   rg -n "using .*\.Domain"      src/BuildingBlocks/{ProjectName}.Integration.Contracts   # contract carries NO domain type — expect zero
   rg -n "_publishEndpoint.Publish|IPublishEndpoint" src/Services --glob '!**/PublishIntegrationEventOn*'  # publish lives ONLY in the publisher handler — expect zero
   rg -n "AddConsumer\b|RegisterConsumer" src/Services   # no manual consumer registration — auto-discovered — expect zero
   dotnet build
   ```

## Arguments

Pass the event name: `/add-integration-event OrderApproved`

## Consumer is a test harness (no production consumer yet)

Sometimes a new event has **no production consumer** at first — the only thing that consumes it is a test
harness proving the event is published and shaped correctly, or the consuming service does not exist yet.
That is a valid state; publish the event anyway:

- **Still create the contract and publisher** (Steps 1–2) — the event is a real published fact even with
  no production reader.
- **Point the consumer at the test harness.** Put the `IConsumer<T>` in the test project (or a throwaway
  diagnostics service) so an end-to-end test asserts the event arrives with the right payload. It follows
  the same `consumer-patterns` shape as a production consumer — idempotency and hydration still apply.
- **Don't fake a production consumer** just to have one. A no-op consumer in a real service that discards
  the event reads as intentional handling and is worse than none. Leave the production side unconsumed
  until a service genuinely needs the fact, and let the test harness be the only consumer meanwhile.
- **Record the gap** where the team tracks follow-ups, so the unconsumed event is a known state rather than
  a silently dropped one.

## Avoid Duplicates

Existing integration events live in the shared contracts package (`src/BuildingBlocks/{ProjectName}.Integration.Contracts/`, where `{ProjectName}` is this solution's prefix). Grep there before adding a new event so you don't introduce a duplicate or a near-name collision.
