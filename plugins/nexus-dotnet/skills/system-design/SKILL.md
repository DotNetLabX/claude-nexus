---
name: system-design
description: Architect-only skill — system decomposition, domain lifecycle design, service boundary definition, variant axis selection. Use when the Architect is designing a new app or decomposing a domain into services.
user-invocable: true
disable-model-invocation: true
---

# System Design (Architect Reference)

This skill is for the **Architect agent only**. It provides templates and checklists for designing new applications or decomposing domains into services. The Developer never loads this skill — they receive the Architect's decisions via plan files.

## Assumes

- **A .NET solution of services and, where used, modules**, each service on one endpoint framework.
- No shared library: a design names the pieces the services need by their job; whether the repo already has them is
  the developer's Look First.

## 1. Variant Axes

The Architect picks these 3 axes first. Everything else cascades:

| Axis | Options | Cascading Effects |
|------|---------|-------------------|
| **Endpoint framework** | FastEndpoints / Carter / Minimal APIs | Validator base, user ID assignment, swagger setup, endpoint file structure |
| **CQRS/Dispatch** | MediatR / FastEndpoints events | Domain event handler interface, pipeline behaviors, DomainEventPublisher implementation |
| **Persistence** | EF Core + SQL Server / EF Core + PostgreSQL / Redis | Repository base, seed approach, interceptors, DbContext type, folder structure |

### Axis Selection Guide

**Endpoint framework:**
- **FastEndpoints** — when handler logic is simple (no separate handler class needed), endpoint + command in one class. Good for: simple CRUD services, services without complex pipelines.
- **Carter + MediatR** — when you want clean endpoint-to-handler separation, pipeline behaviors (validation, logging, user assignment). Good for: domain-heavy services with complex handlers.
- **Minimal APIs + MediatR** — same benefits as Carter but with static method endpoints and explicit registration. Good for: when you prefer explicit route wiring over auto-discovery.

**CQRS/Dispatch:**
- **MediatR** — when you need pipeline behaviors, `INotificationHandler` for domain events, or the service has complex cross-cutting concerns. Most services use this.
- **FastEndpoints events** — when the service is simple and doesn't need pipeline behaviors.

**Persistence:**
- **EF Core + SQL Server** — default. Complex domain, relational data, ACID transactions, reporting queries.
- **EF Core + PostgreSQL** — same as SQL Server but for read-heavy aggregate views (read-model pattern).
- **Redis** — read-heavy, low-complexity domain, shallow entity graph, data fits in memory. 1-2 services per system max.

### Cascading Effects Matrix

| Concept | FastEndpoints + FE Events | Carter + MediatR | Minimal APIs + MediatR |
|---------|---------------------------|-------------------|------------------------|
| Identity stamp | FE global pre-processor | Mediator behaviour | Mediator behaviour (or an endpoint filter) |
| Validator | `Validator<T>` (auto-discovered) | `AbstractValidator<T>` + `ValidationBehavior` | `AbstractValidator<T>` + `ValidationBehavior` |
| Domain event handler | `IEventHandler<T>.HandleAsync()` | `INotificationHandler<T>.Handle()` | `INotificationHandler<T>.Handle()` |
| Domain-event publisher | the FastEndpoints publisher | the mediator publisher | the mediator publisher |
| Endpoint discovery | Auto (FastEndpoints scans assembly) | Auto (`AddCarter()` scans assembly) | Manual (`MapAllEndpoints()`) |
| Application layer | Optional (logic can live in endpoint) | Yes (handlers in Application project) | Yes (handlers in Application project) |

## 2. Domain Lifecycle Template

When designing a new domain, answer these questions:

### States and Transitions
- What are the core entity states? (e.g., Draft → Submitted → Reviewed → Published)
- What triggers each transition? (user action, event from another service, timer)
- Which transitions are reversible?
- Are transition rules static or configurable (DB-stored)?

### Service Ownership
- Which service owns which states?
- Where do handoffs happen between services?
- What data does each service need to own vs receive?

### Event Flow
- Which state transitions produce domain events?
- Which domain events bridge to integration events?
- Which services consume which integration events?
- What does each consumer create locally? (factory method pattern)

### State Machine Implementation
If the domain has a state machine:
- Store transition rules in DB (`{Aggregate}StateTransition` table seeded via master data JSON)
- `{Aggregate}StateMachineFactory` registered as delegate factory
- Aggregate behavior methods validate transitions before mutation
- Per-service action enum defines allowed actions

## 3. Service Boundary Checklist

When decomposing into services:

### Bounded Context Rules
- Each service and each business module owns its data, by the data rule below
- Each service defines its own representation of cross-cutting entities
- Communication: integration events for state propagation, with the data a reader needs replicated locally; gRPC only for write-path hydration or a check that must be live, served by the owner of the data
- Each unit's kind — generic module, business module or service — comes from the kinds table below, never from how it is deployed. A service runs on its own by default; in a repo with a host it may instead run inside one, and it is deployed on its own where deployment, scaling or ownership demands it (`create-service-claude-md` asks)

<!-- nexus-gen coding-conventions sections="unit-kinds" BEGIN -->
#### Kinds of Reusable Unit

A unit's kind comes from whether it could stand alone. Neither having endpoints nor being shared by two apps decides it.

| Kind | What it holds | The test |
|---|---|---|
| Generic module | a capability usable anywhere, often a contract with swappable implementations | it holds no business rules |
| Business module | business rules and its own tables, with endpoints or without | it depends on other services, so it lives inside a service or a host and never stands alone |
| Service | its own data, endpoints, integration events and gRPC calls — everything it needs | it is self-contained, so it could ship as a product of its own |

A service runs on its own by default. In a repo that has a host, a service may instead run inside one host or several
(`create-host`). In the module skills, the Component archetype is the generic module and the Domain archetype the
business module; a generic module that keeps its own tables takes the Domain scaffold.

A module gets a contracts project only where it has several implementations or a second is planned (a generic
module's swappable ones), never because it has several consumers: a business module is referenced directly by the
service or host that composes it. The contracts of integration events and gRPC are always shared projects, whatever
the count, because they cross deployables.
<!-- nexus-gen coding-conventions END -->

<!-- nexus-gen ef-core sections="data-ownership" BEGIN -->
#### Data Ownership

- **Every service and business module owns its own tables and its own migration history.**
- **A business module defaults to its own schema in the database it shares; a service defaults to its own
  database.** Either may take the other: a module may keep a database of its own, and a service its own schema in a
  shared database.
- **No foreign key, join or shared table ever crosses from one unit's tables to another's.** A unit reaches another
  unit's data through that unit's contract — a call or an event — never through its tables.
<!-- nexus-gen ef-core END -->

### Per-Service Decisions
For each service, the Architect specifies in the plan:
1. **Endpoint framework** (axis 1)
2. **CQRS/dispatch approach** (axis 2)
3. **Persistence technology** (axis 3)
4. **Folder structure variant:** 4-project (complex) / 3-project (simple) / merged (read-only)
5. **Port assignment** (by the repo's port convention, from its root CLAUDE.md)
6. **gRPC contracts** it exposes and consumes
7. **Integration events** it publishes and subscribes to

### Capturing decisions into CLAUDE.md

After making the decisions above, capture them into the target file by running:

- **For a new service:** `create-service-claude-md` → writes `src/Services/{Name}/CLAUDE.md`
- **For a new module:** `create-module-claude-md` → writes `src/Modules/{Name}/CLAUDE.md`

Both skills are Architect-only: they set `disable-model-invocation: true` (a developer-session model never auto-invokes them) while staying `user-invocable: true` (a human can run them as `/{name}`). They walk the Architect through the full axis checklist — pre-filling from the current conversation — and confirm with the user before writing.

Once the CLAUDE.md exists, the Developer runs the scaffold skill in a Developer session:

- **For a new service:** `create-service {Name}` → reads the CLAUDE.md and scaffolds the empty skeleton (folders, csprojs, DI stubs, Dockerfile, docker-compose entry, solution registration)
- **For a new module:** `create-module {Name}` → same, branching on archetype (Component vs Domain)

After scaffolding, the Developer continues with `create-aggregate` and `create-feature` for the business work.

### Folder Structure Variants

| Variant | Layout | When |
|---------|--------|------|
| 4-project | API / Application / Domain / Persistence | Complex domain, CQRS, separate handler layer |
| 3-project | API / Domain / Persistence | Simple CRUD, handler logic in endpoints |
| Merged | API+Application / Domain / Persistence | Read-only aggregation, no domain logic |

## 4. Communication Pattern Guide

| Pattern | When | Mechanism |
|---------|------|-----------|
| **gRPC (sync)** | A write needs a foreign record it does not hold yet, or a decision needs the owner's live answer | Code-first contracts (`[ServiceContract]`), `AddCodeFirstGrpcClient<T>()` — the owner hosts the server |
| **Integration event (async)** | Service needs to react to state changes in another service | MassTransit + RabbitMQ, record types in shared contracts |
| **Event → local aggregate creation** | Receiving service needs its own copy of data | Consumer calls factory method (e.g., `{Entity}.From{Source}()`) |
| **API Gateway** | External clients need unified entry point | YARP reverse proxy, route-based forwarding |

### Decision Rules
- If the data is needed for **reading or display** → replicate it locally through integration events; read the local copy
- If a write **needs a foreign record it does not hold yet** → gRPC, on a miss only, then keep the copy
- If a decision **must rest on the owner's live answer** → gRPC, before the change
- If the caller **doesn't care** about the response timing → integration event
- If the data triggers **local state creation** → integration event + consumer + factory method
- **Never** a foreign key, join or shared table across two units' tables — the data rule in § 3
