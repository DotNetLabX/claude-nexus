# CLAUDE.md

> Starter `CLAUDE.md` for a .NET / Vue project using the **nexus-dotnet** plugin (which pulls in **nexus**).
> Copy this to your repo root and fill in the TBD sections (app prefix, service indices, domain, providers).
> Copy this plugin's `conventions/` folder to `docs/conventions/` — the nexus agents read its index — and copy it
> again after a plugin update. Copy `templates/project-lists.md` to `docs/conventions/project-lists.md` once, and
> never again: it is the repo's own.
> This file captures *project-specific* architecture, structure, and stack decisions.

## Architecture

DDD, Vertical Slice, CQRS, Clean Architecture, Event Driven Design.

## Repo Structure

```text
src/
  BuildingBlocks/              # Shared libraries, where the repo has any (TBD)
  Services/                    # Microservices — one folder per service
    {Svc}/
      {Svc}.API/               #   Feature folders (endpoint file + command or query file), DI, start-up
      {Svc}.Domain/            #   Aggregates, value objects, domain events
      {Svc}.Persistence/       #   EF Core context, table configurations, migrations, repositories
  Modules/                     # Modular monolith (Contracts + Implementation per module), where used (TBD)
  ApiGateway/                  # YARP reverse proxy
docker-compose                 # Local dev environment
```

Default to a **module**; only use a microservice when deployment, scaling or ownership demands it.
A FastEndpoints service uses the three-project split above (API / Domain / Persistence): each feature is a folder
`Features/{Area}/{Operation}/` holding `{Operation}Endpoint.cs` (the endpoint) and `{Operation}Command.cs` or
`{Operation}Query.cs` (the request, its response and its validator). A service built on a mediator adds an
Application project for its handlers. One endpoint framework per service, named here per service (TBD).

## Tech Stack

- .NET 10 / ASP.NET Core — solution uses `.slnx` format (XML-based, .NET 10 default).
- **FastEndpoints** — one endpoint class per feature; its request, response and validator live in the feature's
  command or query file. Pre/post processors handle cross-cutting concerns.
- **FluentValidation** — every request has a validator, run before the handler.
- **FastEndpoints `IEvent` bus** — in-process pub/sub for domain events. Aggregates raise events onto their event
  list; a save interceptor publishes them after a successful save. `IEventHandler<T>` implementations live with
  their feature folders in `{Svc}.API`.
- **Mapping by hand** — no mapping library.
- **EF Core** — provider TBD.
- **MassTransit + RabbitMQ** — integration events.
- **gRPC code-first** — service-to-service synchronous calls.
- **SignalR** — real-time server → browser push (hub-per-service, groups for multi-tenant isolation).
- **Authentication** — TBD.
- **OpenAPI** via `Microsoft.AspNetCore.OpenApi` (built into .NET 10) + **Scalar** (`Scalar.AspNetCore`) for the UI.
  Do not use Swashbuckle. Serve the API reference pages in development only.

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

The coding agents read `docs/conventions/coding-conventions.md` and every file it lists — the plugin's conventions
and this repo's `project-lists.md`. Keep any *project-specific* guardrails and the authoritative project reference
graph in `docs/conventions/project-rules.md`; the index tells the agents to read it, and they treat it as an override
of the plugin's defaults.
