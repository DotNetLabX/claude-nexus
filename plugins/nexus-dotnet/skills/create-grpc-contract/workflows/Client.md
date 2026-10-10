# Register gRPC Client

**The channel is created in one place only** — this registration. Callers take the typed client by injection; no
handler or service builds a channel, an address or a retry of its own.

## Settings

A settings class with one address per called contract, bound and validated at start-up
(`service-infra-conventions` § 3. Options binding — fail fast at startup):

```csharp file=GrpcClientsOptions.cs
using System.ComponentModel.DataAnnotations;

public class GrpcClientsOptions
{
    [Required]
    public required string CustomerDirectory { get; init; }
}
```

```json
{
  "GrpcClientsOptions": {
    "CustomerDirectory": "https://customers-api:8082"
  }
}
```

## Registration

In the caller's registration — the address from the bound settings, retries in the client's set-up, never in a
handler:

```csharp
services.AddCodeFirstGrpcClient<ICustomerDirectory>((provider, client) =>
        client.Address = new Uri(provider.GetRequiredService<IOptions<GrpcClientsOptions>>().Value.CustomerDirectory))
    .AddStandardResilienceHandler();
```

## Usage in Handlers and Endpoints

Inject the interface; pass the token in `CallOptions`:

```csharp
var reply = await _customerDirectory.GetCustomerAsync(
    new GetCustomerRequest { Id = command.CustomerId },
    new CallOptions(cancellationToken: ct));
```

## Notes

- No code generation and no `.proto` files — the shared `[ServiceContract]` interface is the contract.
- The address names the callee's internal port inside the container network.
