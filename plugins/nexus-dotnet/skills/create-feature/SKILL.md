---
name: create-feature
description: Creates a complete vertical slice feature — endpoint, command/query, handler, validator, mappings, DI. Variant-aware across FastEndpoints, Carter, and Minimal APIs. Use when adding a new feature slice to a service (check the service CLAUDE.md for which endpoint framework to use).
---

# Create Feature

Creates a complete vertical slice for a new feature. The endpoint framework determines which workflow variant to follow.

## Assumes

This skill mirrors the reference app (dotnet-microservices). It presumes:

- **A per-service endpoint framework** — FastEndpoints **or** Carter **or** Minimal APIs — chosen in the
  service's `CLAUDE.md`, not by this skill. The FastEndpoints variant is **endpoint-only (no MediatR)**;
  the Carter and Minimal-API variants dispatch through **MediatR**.
- **`GlobalExceptionMiddleware`** for exception-to-status mapping (endpoints never catch-to-respond) and
  the FastEndpoints static **`Send.*`** response API — both declared in the per-framework endpoint
  workflows' Error Handling / Notes sections; this block points at them, it does not restate them.
- **Blocks.Core FluentValidation helpers** (`NotEmptyWithMessage`, `MaximumLengthWithMessage`) and the
  **`MaxLength.C*`** constant ladder for the **MediatR** validator path (reference app). The FastEndpoints
  path uses a service-local `ValidatorsMessagesConstants` instead — see `workflows/Validator.md`.

**Adaptation posture (no BuildingBlocks):** without Blocks.Core, follow the plain-FluentValidation
fallback in `workflows/Validator.md` (inline messages / raw `MaximumLength(n)`); without MediatR, use the
FastEndpoints endpoint-only branch. The vertical-slice shape (endpoint + command + handler + validator +
mappings) holds regardless of package.

## Required Reading

Before invoking this skill, ensure you have read:
- The service's `src/Services/{Svc}/CLAUDE.md` — identifies which endpoint framework (FastEndpoints/Carter/Minimal APIs) to use
- An existing feature in the same service — e.g., `{Svc}.API/Features/{Domain}/{ExistingFeature}/` — for naming and structure conventions
- The plan step's feature-specific inputs (entity names, route paths, request/response shape)

## Anti-patterns

- **Reading the service CLAUDE.md after starting to write code.** The framework choice (FastEndpoints vs Carter vs Minimal APIs) determines which workflow variant to follow. Discovering the wrong framework mid-implementation means rewriting the endpoint. Read CLAUDE.md first.
- **Inventing a new folder structure instead of following the existing feature layout.** All features in a service share the same folder convention. Copy the structure from an existing feature in the same service — don't derive it from the skill template alone.
- **Manually registering a FastEndpoints endpoint.** FastEndpoints auto-discovers endpoints by convention. Adding manual registration creates duplicate routing.

## Steps

1. **Determine the service and framework.** Check the service's CLAUDE.md for which endpoint framework to use:
   - FastEndpoints → `workflows/EndpointFastEndpoints.md`
   - Carter + MediatR → `workflows/EndpointCarter.md`
   - Minimal APIs + MediatR → `workflows/EndpointMinimalApi.md`

2. **Create the endpoint** using the appropriate workflow above.

3. **Create the command/query and handler** — if the service uses MediatR (Carter/MinAPI), follow `workflows/Handler.md`. FastEndpoints has **no separate handler**: the logic lives inline in the endpoint's `HandleAsync` — this is the **endpoint-only / no-CQRS** branch, so skip `Handler.md` entirely for a FastEndpoints service.

4. **Create the validator** — follow `workflows/Validator.md` (variant-aware).

5. **Create mappings** (if needed) — follow `workflows/Mappings.md`.

6. **Register the endpoint:**
   - FastEndpoints: auto-discovered — no manual registration
   - Carter: auto-discovered via `AddCarter()` — no manual registration
   - Minimal APIs: add to `EndpointRegistration.MapAllEndpoints()` in the API project

7. **Verify the build:** `dotnet build`

## Route Conventions

- **CRUD writes** use REST resource routes (`POST /articles`, `PUT /articles/{id}`).
- **Non-CRUD writes** (state transitions, actions) use the **`:verb` convention** — the verb is appended to
  the resource path after a colon: `POST /articles/{articleId:int}:accept`,
  `POST /articles/{articleId:int}/assets/final/files:upload`. This keeps action endpoints distinct from
  resource CRUD. (Reference app: `AcceptArticleEndpoint`, `UploadFinalFileEndpoint`.)
- **Authorization is two-layer for writes** — role gate + resource gate; a group-level `RequireAuthorization`
  alone drops the resource layer. See `authorization-patterns` and the per-framework endpoint workflows.
- **GET reads bind from the query string** — a list/filter read takes no request body; its request DTO
  properties bind from the query string (`GET /articles?status=active&page=2`). FastEndpoints binds query
  params onto the request DTO by convention; Minimal APIs use `[FromQuery]` (or `[AsParameters]`); Carter
  reads `HttpContext.Request.Query`. There is no request-body validation on a GET.
- **DELETE / no-body writes** — `DELETE /articles/{id}` carries no request body; the route parameter is
  the entire input, and the endpoint returns `204 No Content` (`Send.NoContentAsync(ct)` in FastEndpoints,
  `Results.NoContent()` in Minimal APIs). Bind the id from the route, never from a body.

## Arguments

Pass the feature name as argument: `/create-feature CreateOrder`

The feature name is used for all file names: `{FeatureName}Endpoint.cs`, `{FeatureName}Command.cs`, etc.

## Feature Folder Structure

### FastEndpoints (endpoint-only — no CQRS/MediatR)

Everything co-located in the API project:
```
{Svc}.API/Features/{Domain}/{FeatureName}/
├── {FeatureName}Endpoint.cs           (endpoint + handler logic)
├── {FeatureName}Command.cs            (command + validator, co-located)
```

### Carter + MediatR

Endpoint in API project, handler in Application project:
```
{Svc}.API/Endpoints/{Domain}/
└── {FeatureName}Endpoint.cs           (endpoint, dispatches to MediatR)

{Svc}.Application/Features/{Domain}/{FeatureName}/
├── {FeatureName}Command.cs            (command + validator)
└── {FeatureName}CommandHandler.cs     (MediatR handler)
```

### Minimal APIs + MediatR

Endpoint flat in API project, handler in Application project:
```
{Svc}.API/Endpoints/
└── {FeatureName}Endpoint.cs           (endpoint, dispatches to MediatR)

{Svc}.Application/Features/{FeatureName}/
├── {FeatureName}Command.cs            (command + validator)
└── {FeatureName}CommandHandler.cs     (MediatR handler)
```

Check the service's CLAUDE.md for which framework to use.

### Request and response records — where they live

`{CommandType}` / `{ResponseType}` are records, not primitives — place them, don't leave them opaque:

- **FastEndpoints (co-located):** declare the request and response records in the same
  `{FeatureName}Command.cs` beside the command, or inline in the endpoint file — the whole slice lives in
  the API project.
- **Carter / Minimal APIs (MediatR):** the command and its `{ResponseType}` are declared together in the
  Application project's `{FeatureName}Command.cs`; the endpoint in the API project references that type.
- A response record is the endpoint's **contract** — keep it a dedicated `record {Feature}Response(...)`,
  never return the aggregate or the EF entity directly.
