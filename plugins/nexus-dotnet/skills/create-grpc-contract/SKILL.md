---
name: create-grpc-contract
description: Creates a gRPC code-first contract, its server in the service that owns the data, and its client registration in each caller — for a write-path hydration or a check that must be live. Use when one service must call another synchronously; decide first whether replicated local data or the event's payload already answers.
---

# Create gRPC Contract

A code-first gRPC contract with its server and client — plain C# with `protobuf-net.Grpc`, no `.proto` files.

> **Scope vs `add-integration-event`.** gRPC is a **synchronous** call: the caller waits, and the callee must be up.
> An integration event is **asynchronous** propagation. Reads of another service's data use a replicated local copy
> kept fresh by events, not gRPC.

## Assumes

- **`protobuf-net.Grpc`** (`protobuf-net.Grpc.AspNetCore` on the server, `protobuf-net.Grpc.ClientFactory` on the
  caller).
- **A gRPC contracts project** the server and every caller reference — the lowest shared project for contracts.
- **The settings binder** (`service-infra-conventions`) and **the error family** (`error-handling`).
- No shared library: the registration below is plain framework calls.

<!-- nexus-gen coding-conventions sections="look-first" BEGIN -->
#### Look First

Before building anything a skill relies on — a guard helper, the central error mapper, a settings binder, an
aggregate or repository base, a save interceptor, an event publisher — look at what the repo already has: first
`project-lists.md` § Helpers, then the shared libraries, modules and packages the project can reach (its project
references and the central package file). Use what you find. Only otherwise build it once, in the shared place: the
lowest project every user of it already references; in a repo of one project, a `Shared` folder in it; where the
users share no project, a new shared project each of them references, with no reference cycle. Never a copy beside
each user. Add its row to `project-lists.md` § Helpers in the same change.
<!-- nexus-gen coding-conventions END -->

## When to Use — decide before the mechanics

gRPC is the last of three choices, and the service that **owns the data owns the server** — a caller never hosts a
server for someone else's data.

1. **Write-path hydration** — handling a write, the service needs a foreign record it does not yet hold. It reads its
   local copy first and calls gRPC **only on a miss**, then stores the copy so the next request stays local.
2. **A check that must be live** — a decision must rest on the owner's answer *now* (is the account still active?):
   call the owner, and throw before changing anything when the answer is no.
3. Otherwise **no gRPC**: a read of another service's data uses the copy replicated by events
   (`consumer-patterns`, the replicated-row pair), and data the triggering event already carries is used from the
   event.

A read-model service registers no gRPC client at all — a client there means the wrong tool was picked.

## Steps

1. **Write the contract** — `workflows/Contract.md`: the service interface and its request and reply classes. A reply
   is a **nested envelope** shaped for the call — never the owner's entity or its persistence type.
2. **Write the server** in the owning service — `workflows/Server.md`.
3. **Register the client** in each caller — `workflows/Client.md`. **The channel is created in one place only:** the
   client's registration, from bound settings; no handler or service ever builds a channel.
4. **Build:** `dotnet build`.

## Handler usage — the two ways a handler calls the client

The token is always passed on.

1. **Lazy get-or-create hydration:**

   ```csharp
   var customer = await _customerRepository.GetByIdAsync(command.CustomerId, ct);
   if (customer is null)
   {
       var reply = await _customerDirectory.GetCustomerAsync(new GetCustomerRequest { Id = command.CustomerId }, new CallOptions(cancellationToken: ct));
       customer = reply.Customer.ToCustomer();
       await _customerRepository.AddAsync(customer, ct);
   }
   ```

2. **Authoritative gate before a change:**

   ```csharp
   var reply = await _customerDirectory.GetCustomerStatusAsync(new GetCustomerRequest { Id = order.CustomerId }, new CallOptions(cancellationToken: ct));
   if (!reply.IsActive)
       throw new DomainException("The customer's account is not active.");

   order.Approve(stateMachineFactory, command);
   ```

## Arguments

Pass the contract's name: `/create-grpc-contract CustomerDirectory`

## Avoid Duplicates

Search the gRPC contracts project for the interface and its methods before adding one.

## Port Conventions

A client inside the same container network calls the callee's **internal** port (`https://customers-api:8082`), never
the host-mapped port. The port scheme is the repo-root `CLAUDE.md`'s Port Convention.
