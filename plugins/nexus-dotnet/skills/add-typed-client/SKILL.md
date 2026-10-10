---
name: add-typed-client
description: Adds a call to another system over HTTP through a typed client — the settings class with its address, the interface a test replaces, the client class, and the one registration line that carries the retries. Use when a service, handler or job calls an outside HTTP API (a payment gateway, a partner service, another team's REST endpoint), or when replacing a raw HttpClient, a hand-built request or a retry loop in a handler.
---

# Add Typed Client

A call to another system goes through a typed client: one class owns the address, the request and reply shapes and
the error handling of that system, and its retries live in one place — the client's set-up. A gRPC call to another
service of the repo is `create-grpc-contract`'s, not this skill's.

## Assumes

- **ASP.NET Core** with `IHttpClientFactory` (`AddHttpClient`), and `System.Net.Http.Json` for the body.
- **`Microsoft.Extensions.Http.Resilience`** for the retries (`AddStandardResilienceHandler`); its version sits in
  the central package file (`central-package-management`).
- **The settings binder** of `service-infra-conventions` § 3. Options binding — fail fast at startup.
- No shared library: the samples below are whole files of the service. Without the resilience package, adapt by
  configuring the retry policy the repo already uses on the same registration line — never in the caller.

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

## Steps

1. **Look first** — the repo may already hold a client for this system (search for its address key, its name, and
   `AddHttpClient`). Use it and add the call to it; a second client for one system splits its retries.
2. **The settings class** — `{System}Options`, the base address `required`, bound and validated at start-up.
3. **The interface** — `I{System}`, one method per call the service makes, each ending `Async` and taking `ct`. It
   exists because a test must replace an outside call; it names the service's own verbs, not the other system's
   URLs.
4. **Two sets of shapes.** The service's own request and reply sit beside the interface, in its file
   (`I{System}.cs`), named in the service's words — the interface names nothing else. The other system's wire
   shapes are private records nested in the client, so nothing else reaches them — or, the repo's other form and
   the one for shapes several classes share, public top-level types in a `Models.cs` beside the client
   (`conventions/csharp.md` § Classes and Methods). Where their
   names differ from the camelCase default, `JsonPropertyName` states them, and a name the default already produces
   is not repeated. The client maps between the two by hand.
5. **The client class** — `{System}Client`, taking `HttpClient` by its primary constructor. No `try/catch` that
   turns a failure into a value; a non-success status throws, the set-up retries what is worth retrying, and what
   still fails reaches the central error mapper (`error-handling`). A reply the client cannot use is one of the
   family's errors, never a framework error type.
6. **One registration line** — `AddHttpClient<I{System}, {System}Client>` with the base address from the bound
   settings and the retries on the same line. No caller builds an `HttpClient`, an address or a retry of its own.
7. **Verify** — `dotnet build`; search the service for `new HttpClient(` and for a retry loop around the call — both
   0.

## Samples

```csharp file=PaymentGatewayOptions.cs
using System.ComponentModel.DataAnnotations;

public class PaymentGatewayOptions
{
    [Required]
    public required Uri BaseAddress { get; init; }
}
```

```json
{
  "PaymentGatewayOptions": {
    "BaseAddress": "https://payments.example.com/v1/"
  }
}
```

The base address ends with `/`: a relative path such as `charges` is appended to it only then.

```csharp file=IPaymentGateway.cs
public interface IPaymentGateway
{
    Task<PaymentReceipt> ChargeAsync(PaymentCharge charge, CancellationToken ct = default);
}

public record PaymentCharge(Guid OrderId, decimal Amount, string Currency);

public record PaymentReceipt(string PaymentId, bool Settled);
```

```csharp file=PaymentGatewayClient.cs
using System.Net.Http.Json;
using System.Text.Json.Serialization;

public class PaymentGatewayClient(HttpClient _httpClient) : IPaymentGateway
{
    public async Task<PaymentReceipt> ChargeAsync(PaymentCharge charge, CancellationToken ct)
    {
        var request = new ChargeRequest(charge.OrderId, charge.Amount, charge.Currency);
        using var response = await _httpClient.PostAsJsonAsync("charges", request, ct);
        response.EnsureSuccessStatusCode();

        var reply = await response.Content.ReadFromJsonAsync<ChargeResponse>(ct)
            ?? throw new DomainException("The payment gateway returned no receipt.");

        return new PaymentReceipt(reply.PaymentId, reply.Status == "settled");
    }

    private record ChargeRequest(
        [property: JsonPropertyName("order_ref")] Guid OrderId,
        decimal Amount,
        string Currency);

    private record ChargeResponse(
        [property: JsonPropertyName("payment_id")] string PaymentId,
        string Status);
}
```

## Registration

The settings join the service's one settings method (`service-registration` § Options Validation):

```csharp
.AddAndValidateOptions<PaymentGatewayOptions>(configuration)
```

The client is registered beside the other outside systems (`service-registration` § What Goes Where), reading the
bound settings for its address, with its retries on the same line:

```csharp
var paymentGateway = configuration.GetRequiredOptions<PaymentGatewayOptions>();
services.AddHttpClient<IPaymentGateway, PaymentGatewayClient>(client => client.BaseAddress = paymentGateway.BaseAddress)
    .AddStandardResilienceHandler(options => options.Retry.DisableForUnsafeHttpMethods());
```

```xml
<PackageVersion Include="Microsoft.Extensions.Http.Resilience" Version="{current stable}" />
```

The standard handler retries transient failures with back-off, and adds a timeout per attempt and a circuit
breaker. It retries every method unless told otherwise, so a client whose calls change state — a charge here —
turns retries off for them on the same line, as above; a client of reads alone keeps the plain
`AddStandardResilienceHandler()`. Where the other system takes an idempotency key, the client sends one and may keep
the retries. Never a retry loop in the caller.

## Where It Lives

- The interface, with the service's own shapes in its file, where its callers reach it: the Application project in
  the mediator style, the API project in a FastEndpoints service with no Application project.
- The client class, its wire shapes and its registration in the API project, beside the other outside systems. The
  API project references the Application project, never the reverse — so the interface names no type the API
  project holds.
- A client several services use is built once, in the shared place, under Look First.

## Gotchas

- **A typed client is transient.** A singleton — a hosted service included — never keeps one: it resolves the client
  from a scope for each pass (`add-hosted-service`); a kept client's handler is never renewed, so it misses a change
  of the other system's address records.
- **Settings are read once, at registration.** A base address that must change while the service runs is not a
  typed-client setting.
- **A test replaces the interface,** never the `HttpClient`: the handler under test takes `IPaymentGateway`.

## What this skill does NOT do

- **gRPC calls between the repo's services** — `create-grpc-contract`.
- **Messages over the bus** — `add-integration-event`.
- **Where each registration goes in general** — `service-registration`.
