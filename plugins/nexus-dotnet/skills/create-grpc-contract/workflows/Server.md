# Create gRPC Server

In the service that **owns** the data: `{Svc}.API/Features/{Area}/{Contract}Server.cs` (or the Application project's
features folder in the mediator style).

## Pattern

```csharp file=CustomerDirectoryServer.cs
public class CustomerDirectoryServer(CustomerRepository _customerRepository) : ICustomerDirectory
{
    public async ValueTask<GetCustomerReply> GetCustomerAsync(GetCustomerRequest request, CallContext context = default)
    {
        var customer = await _customerRepository.GetByIdOrThrowAsync(request.Id, context.CancellationToken);

        return new GetCustomerReply { Customer = customer.ToCustomerInfo() };
    }

    public async ValueTask<GetCustomerStatusReply> GetCustomerStatusAsync(GetCustomerRequest request, CallContext context = default)
    {
        var customer = await _customerRepository.GetByIdOrThrowAsync(request.Id, context.CancellationToken);

        return new GetCustomerStatusReply { IsActive = customer.IsActive };
    }
}
```

The signature matches the contract: `ValueTask<T>` and `CallContext context = default`; the token is
`context.CancellationToken`, passed on. The reply is built by hand from the entity (`{Subject}Extensions`), never the
entity itself. A Redis-backed owner calls the same lookup on its document repository (`redis-patterns`).

## Registration

In the owner's API registration and its start-up file's Use region:

```csharp
services.AddCodeFirstGrpc(options => options.EnableDetailedErrors = false);
```

```csharp
app.MapGrpcService<CustomerDirectoryServer>();
```

## Errors

A missing record throws not-found through the lookup, as everywhere. gRPC has no HTTP error mapper: where the repo has
no gRPC interceptor that turns the error family into gRPC status codes, a caller sees a generic failure — build that
interceptor once, under Look First, before relying on the status a caller receives.
