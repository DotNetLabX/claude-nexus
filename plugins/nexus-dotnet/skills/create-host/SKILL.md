---
name: create-host
description: Composes several .NET services into one host - the one web project that runs them in one process, the entry points each service offers it, the registrations only the host makes, the start-up order, a service switched on or off by a setting - and converts a self-hosted service into a class library a host runs (Sdk.Web to the plain SDK, the implicit usings restored). Use when a project wants one executable for several services, when adding a service to an existing host, when composing services, or when converting a service's API project to a class library.
---

# Create Host

A host is the one deployable web project that runs several services in one process. `create-service` builds a
self-running service by default, or a class library a host runs; this skill is used once a project wants a host — to
compose services that are already class libraries (`workflows/ComposeHost.md`), or to convert a self-running service
into one first (`workflows/ConvertService.md`). Which kind a unit is: `system-design` § Kinds of Reusable Unit.

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
aggregate or repository base, a table-configuration base, a save interceptor, an event publisher — look at what the
repo already has: first `project-lists.md` § Helpers, then the shared libraries, modules and packages the project can
reach (its project references and the central package file). Use what you find. Only otherwise build it once, in the
shared place: the lowest project every user of it already references; in a repo of one project, a `Shared` folder in
it; where the users share no project, a new shared project each of them references, with no reference cycle. Never a
copy beside each user. Add its row to `project-lists.md` § Helpers in the same change. An ordinary class — a table
configuration, a repository, an endpoint, a consumer — derives from the base the repo's libraries offer for its kind,
picked by reading that base's members; a skill's sample is the form for a repo with no such library.
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
  project of each service or module it runs — the one production exception to "no project references an API
  project", beside a module's or service's own test project — and a
  module without an API project through its other projects.
- **No production project references a host.** A test project may, for `WebApplicationFactory<Program>`. The repo's
  own architecture test enforces this where it has one.
- **Services never reference each other**, in a host as anywhere else. Glue between two services lives in the host
  (§ Glue Between Services).
- **A host may run a service another host also runs**, and a repo may keep self-running services beside its hosts.
  Each host supplies its own connection strings, to its own database, for every service it runs.

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
  the security headers, then static files, both before routing; `UseCors` before sign-in, sign-in, each service's `Use{Service}`, authorization, then
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
the shared code it calls — the settings binder, the error, request-context and security-headers middlewares,
sign-in.

```csharp file=Program.cs
var builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Configuration.Sources.Clear();
    builder.Configuration.AddCommandLine(args);
}
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
app.UseMiddleware<SecurityHeadersMiddleware>();
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

`public partial class Program;` gives the host's tests their `WebApplicationFactory<Program>`, and the `Testing`
block keeps their settings the only ones the host reads (§ Tests That Start the App, below). `UseOpenApi` serves
the framework's document at the path the API reference page reads by default.

**Security headers before static files.** Static-file serving answers the request and ends the pipeline, so a
middleware placed after it never touches a page or an asset: the headers go first. The middleware is a shared piece
(Look First, above) — the one the repo's shared libraries offer, or this one, built once in the shared place. Its
content security policy is a starting point, to tighten to what the pages load; the API reference page, which
loads its own scripts and styles, is left without it in development.

```csharp file=SecurityHeadersMiddleware.cs
public class SecurityHeadersMiddleware(RequestDelegate next, IHostEnvironment environment)
{
    private const string ContentSecurityPolicy =
        "default-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

    public Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;
        headers.XContentTypeOptions = "nosniff";
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        headers.XFrameOptions = "DENY";
        if (!(environment.IsDevelopment() && context.Request.Path.StartsWithSegments("/scalar")))
            headers.ContentSecurityPolicy = ContentSecurityPolicy;

        return next(context);
    }
}
```

**Hardening, as the sibling hosts have it.** A new host takes every hardening registration its sibling hosts and
self-hosted services have — security headers, refused paths, the origin check, rate limiting — read from their
`Program.cs`. The host's plan lists each one it takes, or "none, because …".

**Static files and the page fallback.** The front end's built files sit under the host's web root — `wwwroot/app/`
holds `index.html` and its assets. `UseStaticFiles` serves the assets; the fallback answers only paths with no file
extension, so without static-file serving every asset of the page answers 404. Where the files are in the host
project's `wwwroot` at build time, `MapStaticAssets()` serves them instead.

<!-- nexus-gen testing sections="test-host" BEGIN -->
#### Tests That Start the App

A test that boots the app through `WebApplicationFactory<Program>` reads no setting it did not set and reaches no live
system unless it says so.

- **Settings.** The factory runs the app in the `Testing` environment, never `Development`, so the developer's user
  secrets are never loaded. It hands the app every value with `UseSetting`; the factory passes its host configuration
  to `Program.cs` as command-line arguments, so the values are there before `Build()`, where a host reads its
  switches. That configuration also holds every `ASPNETCORE_`-prefixed environment variable, so before the host is
  built the factory keeps only its own values and the environment, content root and application name. In the
  `Testing` environment the host's `Program.cs` keeps those arguments as its only settings source, so no environment
  variable and no base `appsettings.json` value fills a setting the test left out: the test settings name every
  section the host binds, under its class name, and a missing one fails start-up, as any missing section does.
- **Outbound calls.** Every client the HTTP client factory makes — default, named and typed, one that sets its own
  handler too — gets a primary handler that throws, so a call fails inside the process. A test that needs a client
  registers a fake for the client's type in its own `WithWebHostBuilder`. Every other transport the host starts is
  replaced by an in-process or local test double: the bus by its test harness (MassTransit's
  `AddMassTransitTestHarness` puts an in-memory transport in place of the host's), a gRPC client by a fake of its
  contract, a distributed cache by the in-memory one. The refusing handler cannot reach a client built with
  `new HttpClient()` or owned by a vendor SDK: pointing that one at a local endpoint is the test author's job.
- **Storage.** Databases are local test ones — a container or a file database, as the repo's test projects already
  use. A file root sits under a temp folder of its own per run, set in the test settings.
- **Live tests.** A test meant to reach a live system is opt-in: marked so a default run skips it (`Explicit = true`
  on an xUnit v3 fact, or a category the default run filters out). It names the settings it uses itself, and it
  checks afterwards that it left no rows behind.

The host's `Program.cs`, before anything reads a setting:

```csharp
var builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Configuration.Sources.Clear();
    builder.Configuration.AddCommandLine(args);
}
```

The factory, its refusing handler and the test settings, in the app's wiring test project:

```csharp file=TestHostFactory.cs
public class TestHostFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        foreach (var (key, value) in TestSettings.Values)
            builder.UseSetting(key, value);

        builder.ConfigureTestServices(services =>
        {
            services.PostConfigureAll<HttpClientFactoryOptions>(options =>
                options.HttpMessageHandlerBuilderActions.Add(handler => handler.PrimaryHandler = new NoOutboundCallsHandler()));
            services.AddMassTransitTestHarness();
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.ConfigureHostConfiguration(config =>
        {
            var keep = new HashSet<string>(TestSettings.Values.Keys, StringComparer.OrdinalIgnoreCase)
                { HostDefaults.EnvironmentKey, HostDefaults.ContentRootKey, HostDefaults.ApplicationKey };
            var kept = config.Build().AsEnumerable().Where(setting => keep.Contains(setting.Key)).ToList();
            config.Sources.Clear();
            config.AddInMemoryCollection(kept);
        });

        return base.CreateHost(builder);
    }
}
```

```csharp file=NoOutboundCallsHandler.cs
public class NoOutboundCallsHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
        throw new InvalidOperationException($"A test called {request.RequestUri}; register a fake for that client.");
}
```

```csharp file=TestSettings.cs
public static class TestSettings
{
    public static readonly IReadOnlyDictionary<string, string?> Values = new Dictionary<string, string?>
    {
        ["BillingOptions:Enabled"] = "true",
        ["JwtOptions:Issuer"] = "shop-tests",
        ["JwtOptions:Secret"] = "a-local-test-signing-key-of-at-least-32-characters",
        ["RabbitMqOptions:Host"] = "localhost",
        ["RabbitMqOptions:VirtualHost"] = "/",
        ["RabbitMqOptions:UserName"] = "guest",
        ["RabbitMqOptions:Password"] = "guest",
        ["AllowedOriginsOptions:Origins:0"] = "http://localhost:5173",
        ["ConnectionStrings:Orders"] = "Host=localhost;Port=5433;Database=orders_tests;Username=test;Password=test",
        ["ConnectionStrings:Billing"] = "Host=localhost;Port=5433;Database=billing_tests;Username=test;Password=test",
    };
}
```

`PostConfigureAll` runs after every client's own set-up, so the refusing handler replaces even a handler a client
chose itself.
<!-- nexus-gen testing END -->

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

Verify: `developer.md` § The step test rule; then each search below, reading every hit. The patterns hold no double quote and no
doubled backslash, so they reach `rg` unchanged from PowerShell and from Git Bash alike; a `.` stands for the quote
and for either path separator:

```bash
rg -l 'Sdk=.Microsoft\.NET\.Sdk\.Web' src/Hosts --glob '*.csproj'                                  # one web-SDK project per host folder — one file per folder
rg -l 'Sdk=.Microsoft\.NET\.Sdk\.Web' src/Services/{Service} --glob '*.csproj'                     # each service the host runs: no web-SDK project — expect zero
rg -n 'ProjectReference Include=.[^>]*Hosts.' src --glob '*.csproj' --glob '!**/*Tests*/**'       # no production project references a host — expect zero
rg -n 'ProjectReference Include=.\.\..\.\..[^.]' src/Services --glob '*.csproj'                    # no service references another service — expect zero
rg -n 'SecurityHeaders|UseStaticFiles|MapStaticAssets' src/Hosts --glob 'Program.cs'               # per host: the headers line comes first, above the static-files line
```

## What this skill does NOT do

- **Scaffold a service** — `create-service`, which builds a self-running service by default or a library a host
  runs; this skill converts a self-running one when a host runs it.
- **Ship an architecture test** for the host's references — the repo's own check, where it has one.
- **Choose a repo's host values** — its paths, its page fallbacks, its port numbers.
- **Write a consumer's body or a gRPC contract** — `consumer-patterns`, `create-grpc-contract`.
