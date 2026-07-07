---
name: add-integration-event
description: Adds a MassTransit integration event — contract, publisher (domain event handler), and consumer wiring. Variant-aware for MediatR and FastEndpoints handlers. Use when a business event needs to propagate across service boundaries. For the consumer body itself (idempotency variants, reference-data hydration, projection vs write-side), see consumer-patterns.
---

# Add Integration Event

Creates a complete MassTransit integration event with contract, publisher, and consumer(s).

> **Scope vs `create-domain-event-handler`.** An *integration event* propagates a business fact **across service boundaries** over MassTransit (contract in a shared `.Integration.Contracts` package, published by a domain-event handler, consumed by other services). A *domain event handler* reacts to a domain event **inside the same service** (SignalR broadcast, background-job trigger). Use this skill when the event must leave the service; use `create-domain-event-handler` when it stays in-process.

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

## Avoid Duplicates

Existing integration events live in the shared contracts package (`src/BuildingBlocks/{ProjectName}.Integration.Contracts/`, where `{ProjectName}` is this solution's prefix). Grep there before adding a new event so you don't introduce a duplicate or a near-name collision.
