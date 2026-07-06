---
name: create-grpc-contract
description: Creates a gRPC code-first contract, server implementation, and client registration. Use when adding service-to-service synchronous communication.
---

# Create gRPC Contract

Creates a complete gRPC code-first contract with server and client. No .proto files — pure C# with `protobuf-net.Grpc`.

> **Scope vs `add-integration-event`.** Use gRPC for **synchronous** service-to-service calls where the caller blocks for a response (a read/query, or a command that needs a result). Use `add-integration-event` for **asynchronous** state propagation where the caller doesn't wait. If the caller needs data back now → gRPC; if it's fire-and-forget → integration event.

## When to Use — decide before the mechanics

Before scaffolding a gRPC contract, pick the right integration shape. gRPC is one of three, and usually not the first choice:

1. **Synchronous gRPC call** (this skill) — the caller needs data back **now** and must block on it (a cross-service read, or a command that returns a result). Adds a runtime coupling: the callee must be up for the caller to work.
2. **Event-replicated local data** — the caller reads the data repeatedly and can tolerate eventual consistency. Replicate it locally via an integration event + consumer (`add-integration-event`) and read from the local store — no runtime coupling, no per-call latency.
3. **Data already in the event payload** — if the consumer only needs fields the triggering event already carries, use the payload directly; add neither a gRPC call nor a replica.

Reach for gRPC only when (1) genuinely holds — a fresh, on-demand read the caller must wait for. Prefer (2)/(3) otherwise to avoid the synchronous coupling.

## Steps

1. **Create the contract** — follow `workflows/Contract.md`
2. **Create the server implementation** — follow `workflows/Server.md`
3. **Register the client** in consuming services — follow `workflows/Client.md`
4. **Verify the build:** `dotnet build`

## Arguments

Pass the service contract name: `/create-grpc-contract OrderQueryService`

## Avoid Duplicates

Existing gRPC contracts live in the shared contracts package (`src/BuildingBlocks/{ProjectName}.Grpc.Contracts/`, where `{ProjectName}` is this solution's prefix). Grep there before adding a new contract to avoid duplicating an existing service interface.

## Port Conventions

Check the root CLAUDE.md Port Convention section for assigned service indices and derived ports.

**gRPC client URLs target internal Docker ports, not the 44xx host ports.** Caller and callee run inside the
same Docker network, so the client address is the callee container's internal port (e.g. `https://{svc}-api:8081`),
not the host-mapped 44xx port you'd use from the host machine. (Reference app: `GrpcServicesOptions` in the
service `appsettings.json` — e.g. `https://journals-api:8081`.)
