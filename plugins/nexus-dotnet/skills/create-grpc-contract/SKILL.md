---
name: create-grpc-contract
description: Creates a gRPC code-first contract, server implementation, and client registration. Use when adding service-to-service synchronous communication.
---

# Create gRPC Contract

Creates a complete gRPC code-first contract with server and client. No .proto files — pure C# with `protobuf-net.Grpc`.

> **Scope vs `add-integration-event`.** Use gRPC for **synchronous** service-to-service calls where the caller blocks for a response (a read/query, or a command that needs a result). Use `add-integration-event` for **asynchronous** state propagation where the caller doesn't wait. If the caller needs data back now → gRPC; if it's fire-and-forget → integration event.

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
