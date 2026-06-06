---
name: framework-currency
description: Keeps the .NET stack on latest stable versions — general currency rule plus FastEndpoints Send.* migration (two-stage detection, false-positive list). Use when upgrading framework versions or migrating legacy SendOkAsync/Send*Async calls.
user-invocable: true
---

# Framework Currency

Two rules in one skill: the **general currency rule** (stack-agnostic) and the **FastEndpoints `Send.*` variant** (FastEndpoints specialization). Both are governed by ADRs 011 and 012.

> **Accepted but not proven until Passes 2/3 consume it.** This skill encodes ADR-011 and ADR-012; it will be validated when applied in Pass 2/3.

## Governing ADRs

- **ADR-012** — Always track the latest stable versions of the core stack; target framework .NET 10.
- **ADR-011** — FastEndpoints variant: use the modern `Send.*` static API; never legacy `Send*Async` instance methods.

---

## Rule 1 — General Currency (Stack-Agnostic)

Track the latest stable versions of the core stack declared centrally via CPM (see `central-package-management`). Target framework is **.NET 10** (`<TargetFramework>net10.0</TargetFramework>`).

- All package versions live in `src/Directory.Packages.props` — one bump in one file updates all projects.
- Verify each version against the package's release notes / NuGet before bumping; do not rely on memory.
- After bumping, build immediately — breaking changes may appear as compile errors or runtime failures.

**Version-bump caution:** Bumping to latest can surface transitive breaking changes beyond the targeted package. Example: a dependency upgrade may pull a major version of a transitive library with API changes. See `central-package-management` for the three-form verification grep after a bump.

---

## Rule 2 — FastEndpoints `Send.*` (FastEndpoints Variant — ADR-011)

> This rule is the FastEndpoints specialization of ADR-011. It applies only to projects using FastEndpoints as the endpoint framework.

Use the **modern static `Send.*` API**. Never use the legacy instance `Send*Async` methods.

### Migration Map

Verify all names against the **installed FastEndpoints version** before migrating — method names shifted between major versions (6→7, 7→8) and may shift again. **Never trust memory; verify against the installed package.**

**This solution is on FastEndpoints 8.1.0** (see `src/Directory.Packages.props`). The table below is the 8.x worked example:

| Legacy (WRONG) | Modern (CORRECT) |
|----------------|-----------------|
| `await SendOkAsync(response, ct)` | `await Send.OkAsync(response, ct)` |
| `await SendAsync(body, statusCode, ct)` | `await Send.ResponseAsync(body, statusCode, ct)` |
| `await SendNoContentAsync(ct)` | `await Send.NoContentAsync(ct)` |
| `await SendNotFoundAsync(ct)` | `await Send.NotFoundAsync(ct)` |
| `await SendErrorsAsync(cancellation: ct)` | `await Send.ErrorsAsync(cancellation: ct)` |
| `await SendCreatedAtAsync(...)` | `await Send.CreatedAtAsync(...)` |
| `await SendForbiddenAsync(ct)` | `await Send.ForbiddenAsync(ct)` |
| `await SendUnauthorizedAsync(ct)` | `await Send.UnauthorizedAsync(ct)` |

**Bare overloads to include in migration:**
- Three-arg `SendAsync(body, statusCode, ct)` → `Send.ResponseAsync(body, statusCode, ct)`
- Two-arg `SendAsync(body, ct)` (no status code) → `Send.OkAsync(body, ct)`

The reference project (`d:\src\dotnet-microservices`) uses `Send.OkAsync(...)` throughout Auth.API — zero legacy calls remain there. That is the target state.

### Two-Stage Detection

A naive `Send*Async(` grep in a mostly-migrated repo hits both legacy FastEndpoints calls **and** unrelated `SendAsync` calls from other frameworks (SignalR, HttpClient). The grep cannot distinguish them — that is Stage 2's job. Use this approach:

**Stage 1 — Find candidate `Send*Async` calls:**

Search `*.cs` files for any `Send*Async(` pattern. The regex will also match receiver-qualified false positives — Stage 2 filters those out:

```
grep -rn --include="*.cs" "\bSend\w*Async(" src/
```

Or scoped to endpoint files first (reduces noise):
```
grep -rn --include="*Endpoint.cs" "\bSend\w*Async(" src/
```

Candidate hits include:
- `await SendOkAsync(...)` — legacy FastEndpoints, migrate
- `await SendAsync(body, 200, ct)` — legacy 3-arg bare overload, migrate
- `await SendAsync(body, ct)` — legacy 2-arg bare overload, migrate to `Send.OkAsync`
- `await SendNoContentAsync()` — legacy FastEndpoints, migrate
- `await httpClient.SendAsync(request, ct)` — HttpClient false positive, **skip**
- `await hubContext.Clients.All.SendAsync(...)` — SignalR false positive, **skip**

**Stage 2 — Manual receiver inspection for each hit:**

For every hit from Stage 1, check whether the call has a receiver (an object before the dot). **Receiver-qualified calls are NOT FastEndpoints calls and must be left alone:**

| Hit | Receiver | Action |
|-----|----------|--------|
| `await SendOkAsync(response)` | none | MIGRATE — FastEndpoints legacy |
| `await SendAsync(body, ct)` | none | MIGRATE — 2-arg form → `Send.OkAsync` |
| `await httpClient.SendAsync(request, ct)` | `httpClient` | SKIP — `HttpClient` method |
| `await hubContext.Clients.All.SendAsync("event", data, ct)` | `hubContext` | SKIP — SignalR hub context |

### False Positives — Do NOT Migrate

**Inspect the receiver before migrating.** These live examples exist in this repo:

1. **`HttpClient.SendAsync`** — used in GraphQL/REST clients.
   - Live example: `GraphQLXrayClient.cs:296` — `await httpClient.SendAsync(request, ct)`
   - Receiver: `httpClient` (type `HttpClient`)

2. **SignalR `hubContext.Clients.*.SendAsync`** — used to push messages to browser clients.
   - Live example: `SyncSprintsEndpoint.cs:46` — `await hubContext.Clients.All.SendAsync("SprintsSynced", ...)`
   - Receiver: `hubContext` (type `IHubContext<T>`)

The safe rule: **any dot-qualified receiver before `SendAsync` means it is not a FastEndpoints call**.

### Version Verification Reminder

Before applying any migration map:
1. Open `src/Directory.Packages.props` and note the `FastEndpoints` version.
2. Check the FastEndpoints changelog for that version to confirm the static method names.
3. If the version differs from the 8.x example above, re-verify every method name.

---

## Relationship to Other Skills

| Skill | Relationship |
|-------|-------------|
| `central-package-management` | Where versions are declared (CPM props file); cross-reference for the three-form verification grep and transitive-break caution |

## What This Skill Does NOT Cover

- Central Package Management setup — see `central-package-management`
- Endpoint class structure — see `create-feature`
- Repository or EF Core version changes — follow the same general currency rule; no special guidance needed beyond the migration map above
