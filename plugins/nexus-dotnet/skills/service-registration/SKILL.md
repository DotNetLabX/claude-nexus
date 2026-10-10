---
name: service-registration
description: Within-service registration — one DependencyInjection class per layer (API, Application, Persistence), what goes where, the one-line registration forms and lifetimes, settings bound first, the start-up file's three regions and middleware order, and how a host composes several services. Use when registering a dependency, choosing its layer or lifetime, writing or ordering a start-up file, or composing services into one host.
user-invocable: true
---

# Service Registration

Where each dependency of a service is registered, in which form and with which lifetime, and how the start-up file
reads. Registration is written out line by line, so a reader sees what runs.

## Assumes

- **ASP.NET Core's service collection** and the options system; the settings binder of
  `service-infra-conventions` § 3. Options binding — fail fast at startup.
- **The service's projects** — API, an Application project where the service uses a mediator, Persistence.
- **The service's own framework** (FastEndpoints, Carter or minimal APIs) and, where it publishes or consumes
  events, a message bus (MassTransit samples below).
- No shared library: every registration below is a plain framework call.

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

## Layer Structure

One `DependencyInjection` class per project, each with one method `Add{Layer}Services(services, configuration)`:

```text
ConfigureApiOptions(services, configuration)        settings, first, as its own statement
AddApiServices(services, configuration)             API project
AddApplicationServices(services, configuration)     Application project, where the service has one
AddPersistenceServices(services, configuration)     Persistence project
```

The service's composition calls them in that order — settings first, then API, Application, Persistence — and the
host that runs the service calls the composition. A service with no Application project skips that layer. Where
the repo has modules, they have their own composition, called by the host the same way.

## What Goes Where

### API layer (`AddApiServices`)

- The endpoint framework (`AddFastEndpoints`, `AddCarter`) and the OpenAPI document
- Authentication, authorization and the authorization handlers (`authorization-patterns`)
- The request context and its readers (`service-infra-conventions` § 1)
- The host's JSON settings, once (`service-infra-conventions` § 6)
- gRPC clients and the gRPC server (`create-grpc-contract`); typed HTTP clients (`add-typed-client`)
- File storage, e-mail and other outside systems
- In a service with no Application project: the bus and the event publisher too

### Application layer (`AddApplicationServices`)

- The mediator, its handlers and its open behaviours in order: identity stamp, validation, logging
- The validators
- The bus and its consumers; the domain-event publisher
- Factories of per-call objects (a state machine factory, `add-state-machine`); the resource access checker

### Persistence layer (`AddPersistenceServices`)

- The data context, with its save interceptor; it reads its connection string itself
- Each repository and read store, scoped, one line each (`persistence-patterns`)
- The cache loader of a small, stable table, where one is cached

Middleware lives in the API project's `Middlewares` folder and takes only injected services.

## Registration Patterns

- **One line per class:** `services.Add{Lifetime}<IFoo, Foo>()`, or `services.Add{Lifetime}<Foo>()` where the class
  has no interface. No lambda that forwards an interface to another registration, and no `new Foo(…)` lambda for
  the repo's own class. Where a class still holds shared state, a forwarding line may keep its one shared instance
  until that state moves to a listed cache. Two exceptions build in a lambda because nothing else can: a factory
  delegate that builds an object per call from run-time values (`add-state-machine`), and a second instance of a
  type told apart by its marker, built from that marker's own settings (`file-storage-patterns`).
- **Scoped by default.** State that outlives one request lives only in the caches listed in
  `project-lists.md` § Shared-state caches, added in the same change as the class. A singleton that is not such a
  cache holds no state. Working state of one request is not meant by this rule.
- **Which implementation runs is one visible line.** A setting never selects a stand-in: tests and local runs swap
  the implementation in their own set-up. The exception is a provider the deployment chooses by design; its
  registration says so.
- **A second instance of a type is told apart by a marker type** (a subclass, or a generic marker), not by a key.
  A choice: where a library already tells its clients apart by key, keyed registrations stay for that library.
- **Explicit, not scanned.** A service registers its own classes line by line; it does not scan its assembly for
  repositories, services or mappings. Discovery a framework does for its own types stays: the endpoint framework
  finding its endpoints, validators and summaries; the mediator finding its handlers; the validation library finding
  its validators; the bus finding its consumers; the data context applying its table configurations. A choice:
  scanning hides what is registered, and a line per class costs nothing when an agent writes it.
- **A background service** is one `services.AddHostedService<T>()` line and starts no discarded task
  (`add-hosted-service`).
- **The clock is one line,** `services.TryAddSingleton(TimeProvider.System)`, in the API registration (or a worker
  host's registration where there is no API): every class that needs the time takes `TimeProvider`, and the host
  registers none by itself. `TryAdd` keeps a clock a test registered first.

### Data context

```csharp
services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();
services.AddDbContext<OrdersDbContext>((provider, options) => options
    .UseSqlServer(configuration.GetRequiredConnectionString("Orders"))
    .AddInterceptors(provider.GetServices<ISaveChangesInterceptor>()));
services.AddScoped<OrderRepository>();
services.AddScoped<CustomerRepository>();
services.AddScoped<OrderReadStore>();
```

The save interceptor is `persistence-patterns`'; it publishes domain events after a successful save.

### Mediator (mediator style)

```csharp
services.AddMediatR(config =>
{
    config.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
    config.AddOpenBehavior(typeof(StampActionBehavior<,>));
    config.AddOpenBehavior(typeof(ValidationBehavior<,>));
    config.AddOpenBehavior(typeof(LoggingBehavior<,>));
});
services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
```

### Message bus

One call registers the bus and finds the consumers; its settings come from the bound options:

```csharp
services.AddMassTransit(bus =>
{
    bus.AddConsumers(typeof(DependencyInjection).Assembly);
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
```

## Options Validation

All settings of a service are bound in one method, `ConfigureApiOptions`, called first and as its own statement; it
returns nothing. It sits in the registration of the service whose settings they are. The form matters little; the
point is that settings come first and in one place.

```csharp file=OptionsRegistration.cs
public static class OptionsRegistration
{
    public static void ConfigureApiOptions(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddAndValidateOptions<JwtOptions>(configuration)
            .AddAndValidateOptions<RabbitMqOptions>(configuration);
    }
}
```

## Program.cs Structure (self-hosted service)

The start-up file has three regions — Add, InitData, Use — and no registration logic of its own: each line calls a
registration or an extension.

- **The error middleware comes early:** after HTTPS redirection, before routing and sign-in, so it also catches a
  sign-in failure. The request-context and request-diagnostics middlewares, where used, follow it directly, in that
  order.
- **The route prefix is set once,** on the route group or the endpoint framework's configuration; an endpoint
  declares only the rest of its route.
- **The API reference pages are served in development only.**
- **Table set-up runs at start-up, test data is seeded in development only** (`persistence-patterns`).

```csharp file=Program.cs
var builder = WebApplication.CreateBuilder(args);

#region Add
builder.Services.ConfigureApiOptions(builder.Configuration);
builder.Services.AddOrdersServices(builder.Configuration);
#endregion

var app = builder.Build();

#region InitData
app.Migrate<OrdersDbContext>();
if (app.Environment.IsDevelopment())
    app.SeedTestData();
#endregion

#region Use
app.UseHttpsRedirection();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<RequestContextMiddleware>();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}
app.MapAllEndpoints();
#endregion

app.Run();
```

In a FastEndpoints service the last mapping line is `app.UseFastEndpoints(config => …)`, which sets the route prefix
and the serializer's JSON settings (`service-infra-conventions` § 6. HTTP JSON casing — keep the framework default).

## Composing services into one host

Where one host runs several services, each service keeps one composing class, called by the host — the one place a
registration is named for its service. It calls the service's layers in order and nothing else:

```csharp file=OrdersRegistration.cs
public static class OrdersRegistration
{
    public static IServiceCollection AddOrdersServices(this IServiceCollection services, IConfiguration configuration) =>
        services
            .AddApiServices(configuration)
            .AddApplicationServices(configuration)
            .AddPersistenceServices(configuration);
}
```

A FastEndpoints host that runs services from several class libraries names their assemblies once, where it registers
the framework's discovery:
`services.AddFastEndpoints(options => options.Assemblies = [typeof(OrdersRegistration).Assembly, …])`.

## Naming Conventions

| Item | Convention |
|------|-----------|
| Registration class | `DependencyInjection` (one per project) or `{Subject}Registration` (a provider or concern) — never `…Module` |
| Layer methods | `AddApiServices`, `AddApplicationServices`, `AddPersistenceServices` — named for the layer, never the service |
| Settings | `ConfigureApiOptions`, returns nothing |
| A registration class holds | only `Add…` and `Configure…` methods; nothing calls it at run time, and it never takes the environment |
| `Use…` and `Map…` | in a separate `Extensions` class, extending the narrowest type (`IApplicationBuilder`, `IHost`, `IEndpointRouteBuilder`) — never `WebApplication` |
| Parameters | `(this IServiceCollection services, IConfiguration configuration)` — `configuration`, never `config`, which collides with the libraries' own lambda parameter |
| Return type | `IServiceCollection`, for chaining (`ConfigureApiOptions` apart) |
| A middleware's request parameter | `context`; `httpContext` when the method also takes a second context object; never an abbreviation |

The layer rules hold in any repo; the composing class is needed only where one host runs several services.

## When to Load This Skill

- Adding a dependency to an existing service, or choosing its lifetime
- Creating a service (beside `create-service`)
- Writing or reordering a start-up file
- Composing services into one host
