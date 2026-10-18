---
name: create-host
description: Composes several .NET services into one host - the one web project that runs them in one process, the entry points each service offers it, the registrations only the host makes, the start-up order, a service switched on or off by a setting - and converts a self-hosted service into a class library a host runs (Sdk.Web to the plain SDK, the implicit usings restored). Use when a project wants one executable for several services, when adding a service to an existing host, when composing services, or when converting a service's API project to a class library.
---

# Create Host

A host is the one deployable web project that runs several services in one process. `create-service` scaffolds a
service that hosts itself; this skill is used once a project wants a host — to compose services that are already
class libraries (`workflows/ComposeHost.md`), or to convert a self-hosted service into one first
(`workflows/ConvertService.md`).

## Assumes

- **Services in the shape `create-service` builds** — an API project, an Application project where the service has
  one, a Persistence project, each with its `DependencyInjection` class (`service-registration`).
- **The settings binder** and its `GetRequiredOptions` reader (`service-infra-conventions` § 3. Options binding — fail
  fast at startup).
- **A solution file** and **central package management** (`central-package-management`).
- No shared library: every sample below is a plain framework call or a whole file of the host or a service.

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

## The Shape

```text
src/
  Hosts/
    Shop.Host/                  the deployable: Program.cs, settings, its own registration, Composition/
  Services/
    Orders/Orders.API/          a class library — the service's entry points
    Billing/Billing.API/        a class library
  Modules/
    Audit/Audit.API/            a module's endpoints, composed by the host
```

- **`src/Hosts/{Host}/` holds the deployable's one web-SDK project and no business code.** It references the API
  project of each service or module it runs — the one exception to "no project references an API project" — and a
  module without an API project through its other projects.
- **No production project references a host.** A test project may, for `WebApplicationFactory<Program>`. The repo's
  own architecture test enforces this where it has one.
- **Services never reference each other**, in a host as anywhere else. Glue between two services lives in the host
  (§ Glue Between Services).

## What a Service Offers Its Host

Up to four entry points and one bus contribution, each present only where the service has that kind of work:

| Entry point | Class | Present when |
|-------------|-------|--------------|
| `Add{Service}Services(services, configuration)` | `{Service}Registration` | always — the composing class; it binds the service's settings first (`service-registration`) |
| `Add{Service}Consumers(this IBusRegistrationConfigurator bus)` | `{Service}Registration` | the service consumes bus messages; the consumers stay in the service project that holds them |
| `Use{Service}(this IApplicationBuilder app)` | `{Service}Extensions` | the service has middleware for its own routes; request-wide middleware is the host's |
| `Map{Service}Endpoints(this IEndpointRouteBuilder endpoints)` | `{Service}Extensions` | the service maps routes the endpoint framework does not find — a gRPC server, minimal endpoints |
| `Init{Service}DataAsync(this IHost host)` | `{Service}Extensions` | the service sets up its tables or seeds data at start-up |

```csharp file=BillingRegistration.cs
public static class BillingRegistration
{
    public static IServiceCollection AddBillingServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.ConfigureApiOptions(configuration);

        return services
            .AddApiServices(configuration)
            .AddApplicationServices(configuration)
            .AddPersistenceServices(configuration);
    }

    public static IBusRegistrationConfigurator AddBillingConsumers(this IBusRegistrationConfigurator bus)
    {
        bus.AddConsumers(typeof(OrderPlacedConsumer).Assembly);

        return bus;
    }
}
```

```csharp file=BillingExtensions.cs
public static class BillingExtensions
{
    public static IApplicationBuilder UseBilling(this IApplicationBuilder app) =>
        app.UseWhen(
            context => context.Request.Path.StartsWithSegments("/api/billing"),
            billing => billing.UseMiddleware<PaymentWebhookSignatureMiddleware>());

    public static IEndpointRouteBuilder MapBillingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGrpcService<InvoiceLookupServer>();

        return endpoints;
    }

    public static Task InitBillingDataAsync(this IHost host)
    {
        host.Migrate<BillingDbContext>();
        if (host.Services.GetRequiredService<IHostEnvironment>().IsDevelopment())
            host.SeedTestData();

        return Task.CompletedTask;
    }
}
```

`Migrate<TContext>` and `SeedTestData` are the helpers of `persistence-patterns` § Migrations at Start-up and
`persistence-patterns` § Seed Data (Dual Pattern); test data is seeded in development only. The entry point returns a
`Task` so a store whose set-up is asynchronous fits it too (`redis-patterns`' `SeedTestDataAsync`).

A service's own middleware runs for its own routes only, so it never touches a request of another service.
The service's API project carries the usings these two files need, `MassTransit` among them
(`workflows/ConvertService.md` § 2. The implicit usings — the silent trap).

## Registered Once, by the Host

Some registrations exist once per process; two services each making one fail at start-up or silently override each
other. The host makes them, and a service a host runs makes none of them:

- **The endpoint framework**, with its explicit assembly list and automatic discovery off, so a switched-off
  service's endpoints are never found. The list names every project holding endpoints, validators or event handlers
  — each service's and each composed module's API project, an Application project holding event handlers, the
  host's own where it has endpoints — each gated with its owner. Once discovery is off, an assembly left out of the
  list is never scanned: its endpoints, validators and handlers are silently missing.
- **The OpenAPI document** — the endpoint framework's own integration: a FastEndpoints host uses
  `FastEndpoints.Swagger`, since the framework's own document generator is what describes its endpoints.
- **Sign-in.** The host calls `AddJwtAuthentication` (`authorization-patterns` § Phase 5 — JWT validation) once and
  binds `JwtOptions` once; a service adds only its own authorization policies and handlers.
- **The bus** — `AddMassTransit` and its transport — calling each service's `Add{Service}Consumers`.
- **CORS, health checks and the fallback routes.**

The clock stays as `service-registration` § Registration Patterns has it: each API registration's `TryAdd` line is
idempotent, so the first one wins and the rest change nothing.

```csharp file=ShopHostRegistration.cs
public static class ShopHostRegistration
{
    public static IServiceCollection AddShopHostServices(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddAndValidateOptions<JwtOptions>(configuration)
            .AddAndValidateOptions<RabbitMqOptions>(configuration)
            .AddAndValidateOptions<AllowedOriginsOptions>(configuration);

        var billing = configuration.GetRequiredOptions<BillingOptions>();

        List<Assembly> endpointAssemblies =
            [typeof(OrdersRegistration).Assembly, typeof(ListAuditEntriesEndpoint).Assembly];
        if (billing.Enabled)
            endpointAssemblies.Add(typeof(BillingRegistration).Assembly);
        services.AddFastEndpoints(options =>
        {
            options.DisableAutoDiscovery = true;
            options.Assemblies = endpointAssemblies;
        });
        services.SwaggerDocument();
        services.AddJwtAuthentication();

        var origins = configuration.GetRequiredOptions<AllowedOriginsOptions>();
        services.AddCors(cors => cors.AddDefaultPolicy(policy => policy
            .WithOrigins(origins.Origins)
            .AllowAnyHeader()
            .AllowAnyMethod()));
        services.AddHealthChecks();

        services.AddMassTransit(bus =>
        {
            bus.AddOrdersConsumers();
            if (billing.Enabled)
                bus.AddBillingConsumers();

            bus.UsingRabbitMq((context, rabbit) =>
            {
                var options = context.GetRequiredService<IOptions<RabbitMqOptions>>().Value;
                rabbit.Host(options.Host, options.VirtualHost, host =>
                {
                    host.Username(options.UserName);
                    host.Password(options.Password);
                });
                rabbit.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}
```

## The Host's Program.cs

The three regions `service-registration` § Program.cs Structure (self-hosted service) uses, with no registration
logic of its own:

- **Add** — each service's `Add{Service}Services`, then the host's own registration.
- **InitData** — every setting checked first, then each service's `Init{Service}DataAsync` in a stated order: one
  data context after another, and the folder a relative data path needs created before the context that uses it.
  The settings checks registered with `ValidateOnStart` would otherwise run only when the host starts, after the
  database has already changed, so the region opens by running them itself.
- **Use** — the request-wide middleware once: the error middleware early, the request-context and request-diagnostics
  middlewares directly after it, where used (`service-registration` § Program.cs Structure (self-hosted service));
  static files before routing; `UseCors` before sign-in, sign-in, each service's `Use{Service}`, authorization, then
  the mapping: health, the endpoint framework, each service's `Map{Service}Endpoints`, the API reference pages in
  development only, the page fallbacks last.

```csharp file=GlobalUsings.cs
// Framework
global using System.Reflection;
global using Microsoft.Extensions.Options;

// Third-party libraries
global using FastEndpoints;
global using FastEndpoints.Swagger;
global using MassTransit;
global using Scalar.AspNetCore;

// Services and modules
global using Audit.API;
global using Billing.API;
global using Orders.API;
```

The host's `GlobalUsings.cs` (`service-infra-conventions` § 8. Per-project GlobalUsings) also names the namespaces of
the shared code it calls — the settings binder, the error and request-context middlewares, sign-in.

```csharp file=Program.cs
var builder = WebApplication.CreateBuilder(args);
var billing = builder.Configuration.GetRequiredOptions<BillingOptions>();

#region Add
builder.Services.AddOrdersServices(builder.Configuration);
if (billing.Enabled)
    builder.Services.AddBillingServices(builder.Configuration);
builder.Services.AddShopHostServices(builder.Configuration);
#endregion

var app = builder.Build();

#region InitData
app.Services.GetRequiredService<IStartupValidator>().Validate();
await app.InitOrdersDataAsync();
if (billing.Enabled)
    await app.InitBillingDataAsync();
#endregion

#region Use
app.UseHttpsRedirection();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<RequestContextMiddleware>();
app.UseStaticFiles();
app.UseRouting();
app.UseCors();
app.UseAuthentication();
if (billing.Enabled)
    app.UseBilling();
app.UseAuthorization();
app.MapHealthChecks("/health");
app.UseFastEndpoints(config => config.Endpoints.RoutePrefix = "api");
if (billing.Enabled)
    app.MapBillingEndpoints();
if (app.Environment.IsDevelopment())
{
    app.UseOpenApi(openApi => openApi.Path = "/openapi/{documentName}.json");
    app.MapScalarApiReference();
}
app.MapFallbackToFile("app/{*path:nonfile}", "app/index.html");
#endregion

app.Run();

public partial class Program;
```

`public partial class Program;` gives the host's tests their `WebApplicationFactory<Program>`. `UseOpenApi` serves
the framework's document at the path the API reference page reads by default.

**Static files and the page fallback.** The front end's built files sit under the host's web root — `wwwroot/app/`
holds `index.html` and its assets. `UseStaticFiles` serves the assets; the fallback answers only paths with no file
extension, so without static-file serving every asset of the page answers 404. Where the files are in the host
project's `wwwroot` at build time, `MapStaticAssets()` serves them instead.

## Switching a Service by a Setting

One flag switches a whole service, and it gates every call of that service together: `Add{Service}Services`,
`Add{Service}Consumers`, its endpoint assembly, `Use{Service}`, `Map{Service}Endpoints` and `Init{Service}DataAsync`.
A call left ungated runs half a service. The flag is read at start-up with `GetRequiredOptions`, wherever a gated call
sits, and never changes while the host runs — above, `BillingOptions.Enabled`, read in `Program.cs` and in the host's
registration, which keeps its two-parameter signature (`service-registration` § Naming Conventions).

A switched-off service's routes answer 404, never a fallback page: a page fallback is mapped under the front end's
own path, never at the root, so an `api/…` route nobody serves falls through to 404.

## Glue Between Services

Where one service needs what another holds, the first declares a port — an interface in its own Application
project — and the host's `Composition/` folder holds the adapter that implements it with the other service's
contract, registered in the host's registration. The services stay unaware of each other; a service that cannot
run without the other is reached through an integration event or a gRPC client instead (`add-integration-event`,
`create-grpc-contract`).

## What the Host Owns on Disk

- **`appsettings*.json`** — one file set for every service it runs, merged; every settings class name unique within
  the host (`service-infra-conventions` § 3. Options binding — fail fast at startup).
- **The user-secrets id** and **`Properties/launchSettings.json`.**
- **Static files and runtime assets**, copied to the host's output.
- **The Dockerfile's entry point** — the image builds and runs the host.
- **The EF tooling start-up project** — `dotnet ef migrations add {Name} -p {Service}.Persistence -s {Host}`.

## gRPC in a Host

Where gRPC runs without TLS, the host's settings declare a separate Kestrel endpoint that speaks HTTP/2 only
(h2c) — on clear text a client cannot negotiate HTTP/2 on an endpoint that also speaks HTTP/1.1:

```json
{
  "Kestrel": {
    "Endpoints": {
      "Http": { "Url": "http://+:8080", "Protocols": "Http1" },
      "Grpc": { "Url": "http://+:8081", "Protocols": "Http2" }
    }
  }
}
```

`MapGrpcService<T>` sits in the owning service's `Map{Service}Endpoints`; the contract and the server are
`create-grpc-contract`'s.

## Verify

`dotnet build` of the solution; then each search below, reading every hit. The patterns hold no double quote and no
doubled backslash, so they reach `rg` unchanged from PowerShell and from Git Bash alike; a `.` stands for the quote
and for either path separator:

```bash
rg -l 'Sdk=.Microsoft\.NET\.Sdk\.Web' src/Hosts --glob '*.csproj'                                  # one web-SDK project per host folder — one file per folder
rg -l 'Sdk=.Microsoft\.NET\.Sdk\.Web' src/Services --glob '*.csproj'                               # no web-SDK project under a service folder — expect zero
rg -n 'ProjectReference Include=.[^>]*Hosts.' src --glob '*.csproj' --glob '!**/*Tests*/**'       # no production project references a host — expect zero
rg -n 'ProjectReference Include=.\.\..\.\..[^.]' src/Services --glob '*.csproj'                    # no service references another service — expect zero
```

## What this skill does NOT do

- **Scaffold a service** — `create-service`, which keeps scaffolding a self-hosted one; this skill converts it when
  a host runs it.
- **Ship an architecture test** for the host's references — the repo's own check, where it has one.
- **Choose a repo's host values** — its paths, its page fallbacks, its port numbers.
- **Write a consumer's body or a gRPC contract** — `consumer-patterns`, `create-grpc-contract`.
