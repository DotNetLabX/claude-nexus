---
name: consumer-patterns
description: Author or edit a MassTransit integration-event consumer — the consumer-class shape and primary-constructor dependencies, the three idempotency variants and when each fits, local reference-data hydration, and the split between a read-model projection and a write-side domain mutation. Use when adding or editing an IConsumer that reacts to another service's cross-service event. To propagate a NEW event (contract + publisher + wiring), use add-integration-event; this skill owns the consuming IConsumer.
user-invocable: true
---

# Consumer Patterns

A MassTransit consumer is how one service reacts to another service's integration event: it hydrates foreign-owned reference data into its own store, then either projects a read model or drives a domain mutation. Always five phases, in one order. The single real decision is which of three idempotency strategies to use.

> **Worked exemplar — the reference app (dotnet-microservices).** The concrete `Article` / `Journal` events, the `Articles.IntegrationEvents.Contracts` package, the Submission / Review / Production write services, the `ArticleHub` read-model service, and `UserRoleType` are that app's pipeline. The five-phase shape and the idempotency decision are domain-neutral; substitute your own aggregate and events.

## When to use

Adding or editing a class that implements `IConsumer<TEvent>` for a cross-service integration event. Not for domain-event handlers (in-process `INotificationHandler` / FastEndpoints `IEventHandler`) — those stay inside a service boundary and never hydrate foreign data (see `create-domain-event-handler`). Copy the closest template from `references/` and fill each phase.

## The five phases

1. **Consumer class + primary-constructor dependencies.** Implement `IConsumer<TEvent>`. Inject persistence collaborators as **concrete** types — the service `DbContext`, `Repository<T>`, a `{X}Repository` — never a repository interface (the no-interface-without-multiple-implementations guardrail). Non-persistence collaborators (`IFileService`, `FileServiceFactory`, a state-machine factory delegate) **are** injected as interfaces or delegates.
2. **Idempotency check.** Guard against duplicate delivery before any write, and put it first so a redelivery is cheap. Pick one of the three strategies below.
3. **Local reference-data hydration.** Foreign-owned data is replicated per-event, not queried on demand: look it up in the local store first and materialize from the event DTO only if missing — a `GetOrCreate{X}` helper. Materialize with Mapster `Adapt<T>()` or by hand; both are sanctioned (hand-construction wins when you also stamp a local-only field the event never carries). Reference data that changes independently of the aggregate flow (e.g. a reference entity's name or abbreviation) is instead kept fresh by a dedicated `{X}Created` / `{X}Updated` shadow-row consumer pair, one per consuming write service — see `references/reference-data-consumer.md`.
4. **Domain mutation or projection write.** Write-side service: build the aggregate through its factory (e.g. `{Aggregate}.From{Stage}`) so invariants run, then `AddAsync`. Read-model service: the projection entity is a plain data bag — set its properties or `Adapt` the DTO directly, never add behavior to it. When the stage change carries files, migrate the bytes here — `DownloadAsync` from the sending stage's store, `UploadAsync` into your own, because each service owns its storage (mechanics in `file-storage-patterns`).
5. **Save.** One `SaveChangesAsync(context.CancellationToken)` at the end — the repository is the unit of work, there is no separate commit. Single-entity reference-data consumers call `SaveChangesAsync()` on the repository itself.

## Idempotency: pick one of three

Keep all three strategies on purpose — pick by what a duplicate delivery **means**:

| Strategy | Mechanism | Use when | Reference-app example |
|---|---|---|---|
| Silent skip-if-exists | look up by id, `if (existing is not null) return;` (or `UpsertAsync` for updates) | a redelivery is normal and harmless — reference-data replication | `Journal` Created / Updated consumers |
| Throw-if-exists | `EnsureNotExistsOrThrowAsync(id, ct)`, or `AnyAsync(...)` then `throw new BadRequestException(...)` | a duplicate signals a bug — the row should be created exactly once and you want it surfaced | aggregate-creation consumers (reference app: Review, ArticleHub first stage) |
| ExistsAsync then return | `if (await repository.ExistsAsync(id)) return;` | same create-once intent, but a redelivery should be swallowed quietly, not thrown | Production |

Decision rule: reference-data upsert → **silent skip**. Aggregate creation where a second delivery is a bug worth seeing → **throw**. Aggregate creation where you would rather absorb the redelivery → **ExistsAsync return**. An update-existing projection (a later stage mutating a row an earlier stage created) inverts the guard: load-or-throw with `SingleOrThrowAsync`, then mutate — see `references/projection-consumer.md` variant B.

## Templates

- `references/write-side-consumer.md` — aggregate-creation consumer (throw-if-exists), all five phases including actor/asset hydration and file migration; based on the reference app's Review `ArticleApprovedForReviewConsumer`, with the Production hand-construction and ExistsAsync-return variants inline.
- `references/projection-consumer.md` — read-model: variant A create-new (`AnyAsync` throw) and variant B update-existing (`SingleOrThrowAsync` then field set).
- `references/reference-data-consumer.md` — the `{X}Created` (skip-if-exists) / `{X}Updated` (upsert) shadow-row pair.

## What this skill does NOT do

- Create the event contract, the publisher (the domain-event handler that publishes the event), or the MassTransit wiring — that is `add-integration-event`. Its `Consumer.md` workflow covers only where the consumer lands and how it is auto-discovered; the authoring depth is here.
- Domain-event handlers (in-process) — a different pattern (effect-named `INotificationHandler` in a feature folder), covered by `create-domain-event-handler`.
- File-storage mechanics — the byte migration in phase 4 lives here, but the `IFileService` download/upload details are `file-storage-patterns`.
