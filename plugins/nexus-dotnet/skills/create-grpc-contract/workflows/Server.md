# Create gRPC Server

In the service that **owns** the data: `{Svc}.API/Features/{Area}/{Contract}Server.cs` (or the Application project's
features folder in the mediator style).

## Pattern

```csharp file=CustomerDirectoryServer.cs
public class CustomerDirectoryServer(CustomerRepository _customerRepository) : ICustomerDirectory
{
    public async ValueTask<GetCustomerReply> GetCustomerAsync(GetCustomerRequest request, CallContext context = default)
    {
        var customer = (await _customerRepository.GetByIdNotTrackedAsync(request.Id, context.CancellationToken)).OrThrowNotFound(request.Id);

        return new GetCustomerReply { Customer = customer.ToCustomerInfo() };
    }

    public async ValueTask<GetCustomerStatusReply> GetCustomerStatusAsync(GetCustomerRequest request, CallContext context = default)
    {
        var customer = (await _customerRepository.GetByIdNotTrackedAsync(request.Id, context.CancellationToken)).OrThrowNotFound(request.Id);

        return new GetCustomerStatusReply { IsActive = customer.IsActive };
    }
}
```

The signature matches the contract: `ValueTask<T>` and `CallContext context = default`; the token is
`context.CancellationToken`, passed on. The reply is built by hand from the entity (`{Subject}Extensions`), never the
entity itself. The server changes nothing, so it reads through a named no-tracking read on the owner's repository —
`CustomerRepository` holds `GetByIdNotTrackedAsync` the way `OrderRepository` does
(`persistence-patterns` § Tier 3: A repository with its own reads). A Redis-backed owner reads through its document
repository instead (`redis-patterns`).

## Registration

In the owner's API registration and its start-up file's Use region:

```csharp
services.AddCodeFirstGrpc(options => options.EnableDetailedErrors = false);
```

```csharp
app.MapGrpcService<CustomerDirectoryServer>();
```

In a service a host runs, the `MapGrpcService` line sits in the service's `Map{Service}Endpoints`, which the host
calls (`create-host`).

## Errors

A missing record throws not-found through the guard after the read, as everywhere. gRPC has no HTTP error mapper:
where the repo has no gRPC interceptor that turns the error family into gRPC status codes, a caller sees a generic
failure — build that interceptor once, under Look First, before relying on the status a caller receives.
