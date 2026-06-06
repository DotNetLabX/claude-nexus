# CLAUDE.md

> Starter `CLAUDE.md` for a .NET / Vue project using the **nexus-dotnet** plugin (which pulls in **nexus**).
> Copy this to your repo root and fill in the TBD sections (app prefix, service indices, domain).
> Place this plugin's `conventions/` under `docs/conventions/` — the nexus agents read them (Read-Index).
> This file captures *project-specific* architecture, structure, and stack decisions.

## Architecture

DDD, Vertical Slice, CQRS, Clean Architecture, Event Driven Design.

## Repo Structure

```
src/
  BuildingBlocks/              # Shared libraries
    (app-agnostic)             #   Reusable primitives (no project knowledge)
    (app-specific)             #   gRPC contracts, integration event contracts
  Services/                    # Microservices — one folder per service
    {Svc}/
      {Svc}.API/               #   FastEndpoints feature slices (endpoint + request + response + validator + event handlers), SignalR hubs, DI, migration startup host
      {Svc}.Domain/            #   Aggregates, value objects, domain events
      {Svc}.Persistence/       #   EF Core DbContext, configs, migrations, repositories
  Modules/                     # Modular monolith (Contracts + Implementation per module)
  ApiGateway/                  # YARP reverse proxy
docker-compose                 # Local dev environment
```

Default to a **module**; only use a microservice when deployment/scaling/ownership demands it.
New services use the three-project split above (API / Domain / Persistence). There is no separate
Application project — FastEndpoints endpoint classes own feature slices directly (request + response
+ validator + handler logic + event handlers all live in `{Svc}.API/Features/`).

## Tech Stack

- .NET 10 / ASP.NET Core — solution uses `.slnx` format (XML-based, .NET 10 default).
- **FastEndpoints** — endpoint class per feature (request + response + handler); validator is a sibling class. Pre/post processors handle cross-cutting concerns.
- **FluentValidation** — request validators, auto-discovered and run by FastEndpoints before the handler.
- **FastEndpoints `IEvent` bus** — in-process pub/sub for domain events. Aggregates raise events onto a `DomainEvents` list; a `SaveChangesInterceptor` publishes them after a successful save. `IEventHandler<T>` implementations live alongside their feature slices in `{Svc}.API`.
- **Mapster** — object mapping.
- **EF Core** — SQLite (file-backed; local dev and single-node deploys).
- **MassTransit + RabbitMQ** — integration events.
- **gRPC code-first** — service-to-service sync communication.
- **SignalR** — real-time server → browser push (hub-per-service, groups for multi-tenant isolation).
- **Google OAuth** via ASP.NET Core `AddGoogle` (cookie auth; email + profile scope only).
- **OpenAPI** via `Microsoft.AspNetCore.OpenApi` (built into .NET 10) + **Scalar** (`Scalar.AspNetCore`) for the UI. Do not use Swashbuckle. Gate the Scalar UI to `IsDevelopment`.

## Frontend

- **Vue 3** + **TypeScript** — SPA framework.
- **Pinia** — state management.
- **Tailwind CSS** — styling. No full UI kit (no Vuetify/PrimeVue). `shadcn-vue` acceptable if it stays lightweight.
- Built with **Vite** into the API's `wwwroot/` and served as static files — single-solution monorepo.
- Optimistic UI for user actions; reconcile or revert on API response.

## Port Convention

Services publish host ports using an `{AA}XY` scheme:

- `{AA}` — 2-digit app prefix (**TBD** per project).
- `X` — protocol slot (tens digit): `0` HTTP (8080, mandatory) · `1–3` reserved · `4` HTTPS (8081, opt-in) · `5` gRPC h2c (8082, opt-in, only if the service exposes gRPC).
- `Y` — service index (units digit) — **TBD** per service.

Host port derives mechanically: `<app prefix> + <protocol slot> + <service index>`. HTTP is mandatory on every
service; HTTPS and gRPC are opt-in. gRPC runs h2c on container port 8082 (explicit Kestrel endpoint config required).

| Index | Service |
|-------|---------|
| TBD   | TBD     |

## Guardrails

The plugin's agents carry the coding conventions inline (naming, formatting, async, DI, immutability,
EF Core, Vue/Pinia/Tailwind, testing). Keep any *project-specific* guardrails and the authoritative
reference graph in `docs/conventions/project-rules.md` — agents read project-owned `docs/conventions/`
at start and treat it as an override of the inline defaults.
