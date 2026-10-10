---
name: service-infra-conventions
description: Cross-cutting infrastructure of a .NET service and the conventions every project follows. Use when wiring the request context (the claims and route readers, the scoped request context and its correlation id), binding settings so they fail at start-up, ordering a mediator pipeline, keeping the HTTP JSON default, or applying the per-project conventions (GlobalUsings, primary-constructor parameter names, validators).
user-invocable: true
---

# Service Infra & Conventions

How a .NET service wires its cross-cutting pieces, and the conventions every project follows. Two through-lines:

1. **Inner layers depend on a narrow capability, never on the transport.** A handler, a pipeline behaviour or a
   domain method asks for the caller or a route value through a small interface — it never sees `HttpContext`.
2. **Required settings fail at start-up, not at first use.** Settings are bound once, validated, and injected.

## Assumes

- **ASP.NET Core** and its options system; **DataAnnotations** for settings validation.
- **A mediator** only for § 5; a FastEndpoints service skips it.
- **Central package management** for § 7 (`central-package-management`).
- No shared library: the request context, its readers and the settings binder are sampled whole below and built
  once under Look First.

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

## Cheat sheet

| Concern | The rule |
|---|---|
| The caller and route values | Inject `IClaimsProvider` / `IRouteProvider`; only `HttpContextProvider` touches `HttpContext` |
| Request context | A scoped `RequestContext`, filled once by middleware, read by injection |
| Correlation id | The incoming header, else the current trace id, else the server's request id |
| Settings | Bound by the bind-and-validate helper, validated by attributes, failing at start-up; injected, read once |
| Pipeline (mediator style) | Stamp the action, then validate, then log |
| HTTP JSON | Keep the camelCase default; set only case-insensitive reading and enums as text, once per host |
| Package versions | One central file, no `Version` on a reference (`central-package-management`) |
| Global usings | Per service project, grouped under comment headers |
| Primary-constructor parameters | Named by use |

## 1. Ambient context — depend on the capability, not on HttpContext

The caller comes from `IClaimsProvider`, route values from `IRouteProvider`. One class implements both and is the
only place that reads `HttpContext`. The interfaces exist because a test must replace the caller; the split keeps
each reader asking for only what it needs. The identity stamps (`authorization-patterns` § Phase 4 — Identity
stamping — pick by framework) take `IClaimsProvider` and nothing else.

```csharp file=IClaimsProvider.cs
public interface IClaimsProvider
{
    int GetUserId();

    int? TryGetUserId();

    IReadOnlySet<TRole> GetUserRoles<TRole>()
        where TRole : struct, Enum;
}
```

```csharp file=IRouteProvider.cs
public interface IRouteProvider
{
    int? GetRouteId(string key);
}
```

```csharp file=HttpContextProvider.cs
using System.Security.Claims;

public class HttpContextProvider(IHttpContextAccessor _httpContextAccessor) : IClaimsProvider, IRouteProvider
{
    private HttpContext HttpContext =>
        _httpContextAccessor.HttpContext ?? throw new InvalidOperationException("No request is in progress.");

    public int GetUserId() =>
        TryGetUserId() ?? throw new UnauthorizedException("The caller has no user id.");

    public int? TryGetUserId() =>
        int.TryParse(HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : null;

    public IReadOnlySet<TRole> GetUserRoles<TRole>()
        where TRole : struct, Enum =>
        HttpContext.User.FindAll(ClaimTypes.Role)
            .Select(claim => Enum.TryParse<TRole>(claim.Value, out var role) ? role : (TRole?)null)
            .OfType<TRole>()
            .ToHashSet();

    public int? GetRouteId(string key) =>
        int.TryParse(HttpContext.GetRouteValue(key)?.ToString(), out var id) ? id : null;
}
```

Register it in one line per interface — `services.AddHttpContextAccessor()`, then
`services.AddScoped<IClaimsProvider, HttpContextProvider>()` and `services.AddScoped<IRouteProvider, HttpContextProvider>()`;
the class holds no state, so two instances cost nothing. **Don't** inject `IHttpContextAccessor` or `HttpContext` into a handler,
a pipeline behaviour, a repository or a domain method.

## 2. RequestContext — a scoped object filled once

`RequestContext` is a plain scoped class. One middleware fills it once per request; everything downstream (the
logging behaviour, a diagnostics middleware) reads it by injection, never from `HttpContext.Items`. The correlation
id takes the incoming `X-Correlation-ID` header, else the current trace id, else the server's request id.

```csharp file=RequestContext.cs
public class RequestContext
{
    public string CorrelationId { get; set; } = null!;

    public DateTimeOffset StartedOn { get; set; }

    public string? RemoteIp { get; set; }
}
```

```csharp file=RequestContextMiddleware.cs
using System.Diagnostics;

public class RequestContextMiddleware(RequestDelegate _next, TimeProvider _timeProvider)
{
    private const string CorrelationIdHeader = "X-Correlation-ID";

    public async Task InvokeAsync(HttpContext httpContext, RequestContext requestContext)
    {
        requestContext.CorrelationId = ResolveCorrelationId(httpContext);
        requestContext.StartedOn = _timeProvider.GetUtcNow();
        requestContext.RemoteIp = httpContext.Connection.RemoteIpAddress?.ToString();
        httpContext.Response.Headers[CorrelationIdHeader] = requestContext.CorrelationId;

        await _next(httpContext);
    }

    private static string ResolveCorrelationId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(CorrelationIdHeader, out var header) && !string.IsNullOrWhiteSpace(header))
            return header.ToString();

        return Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier;
    }
}
```

A middleware lives in the `Middlewares` folder and takes only injected services. Its request parameter is
`context`, or `httpContext` when the method also takes a second context object, as `InvokeAsync` above does.

## 3. Options binding — fail fast at startup

- **One helper binds and validates.** Every settings class is bound through the bind-and-validate helper: it binds
  the section named after the class, runs the attribute validation, and fails at start-up when the section is
  missing or a value is wrong. Settings are consumed as `IOptions<T>`. No `configuration["…"]` reads, and no hand
  `GetSection(…)` binding outside registration code.
- **A settings class is data only.** Named `{Subject}Options`, one class per file, no methods and no static members,
  no section-name constant — the section in the settings file carries the class's name. A value is `init`, and
  `required` when it has no default; a required value is never `string?` and never `= string.Empty` as a
  placeholder (`= null!` only where a binder needs it). Validation is by attributes; a rule that spans two settings
  lives in one validator class (`IValidateOptions<T>`) beside them, in the project that binds them. Connection
  strings stay under `ConnectionStrings`.
- **One section, one class, bound once.** Settings classes sit at the project root or in an `Options` folder —
  never in a feature folder or the Persistence project.
- **Injected and read once.** A class takes `IOptions<T>` in its constructor and passes on only the value it needs.
  A setting that must change while the service runs is the exception: it is read through `IOptionsMonitor<T>`, and
  the class is listed in `project-lists.md` § Run-time settings in the same change.
- **Renaming an existing section is a deployment change:** the deployed settings move in the same change.

```csharp file=OptionsExtensions.cs
public static class OptionsExtensions
{
    public static IServiceCollection AddAndValidateOptions<TOptions>(this IServiceCollection services, IConfiguration configuration)
        where TOptions : class
    {
        var section = configuration.GetSection(typeof(TOptions).Name);
        if (!section.Exists())
            throw new InvalidOperationException($"The settings section {section.Key} is missing.");

        services.AddOptions<TOptions>()
            .Bind(section)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        return services;
    }

    public static TOptions GetRequiredOptions<TOptions>(this IConfiguration configuration)
        where TOptions : class =>
        configuration.GetSection(typeof(TOptions).Name).Get<TOptions>()
            ?? throw new InvalidOperationException($"The settings section {typeof(TOptions).Name} is missing.");

    public static string GetRequiredConnectionString(this IConfiguration configuration, string name) =>
        configuration.GetConnectionString(name)
            ?? throw new InvalidOperationException($"The connection string {name} is missing.");
}
```

`GetRequiredOptions` and `GetRequiredConnectionString` are for registration code that needs a value while it
registers (a client's address, a data context's connection); every other reader takes `IOptions<T>`. A missing
value is a configuration fault, so this shared helper is where its framework error is thrown — a service's own
registration never throws one (`error-handling` § Exception Hierarchy).

```csharp file=JwtOptions.cs
using System.ComponentModel.DataAnnotations;

public class JwtOptions
{
    [Required]
    public required string Issuer { get; init; }

    [Required]
    [MinLength(32)]
    public required string Secret { get; init; }
}
```

```csharp file=RabbitMqOptions.cs
using System.ComponentModel.DataAnnotations;

public class RabbitMqOptions
{
    [Required]
    public required string Host { get; init; }

    public string VirtualHost { get; init; } = "/";

    [Required]
    public required string UserName { get; init; }

    [Required]
    public required string Password { get; init; }
}
```

The settings are bound in one method, first, in the service's registration (`service-registration` § Options
Validation).

## 4. Derived properties on an interface

An interface declares members and gives none a body; the one exception is a property derived from another member of
the same interface, which every implementation would otherwise repeat:

```csharp
bool IsAuthenticated => ActingUserId != default;
```

## 5. Pipeline order (mediator style)

A mediator service registers its open behaviours in one fixed order: the identity stamp, then validation, then
logging. The stamp runs first so validation and logging see the acting user (`add-pipeline-behavior`;
`service-registration` § Registration Patterns). A FastEndpoints service has no mediator pipeline: its stamp is a
global pre-processor and its validators run before `HandleAsync`.

## 6. HTTP JSON casing — keep the framework default

JSON names come from the web default (camelCase); no per-property name that only repeats it. A name another system
dictates stays. The JSON settings — case-insensitive reading and enums written as text — are set once per host,
never per class, on the serializer the endpoint style replies through.

The mediator style (Carter or minimal APIs) replies through the host's HTTP JSON options, set in its API
registration:

```csharp
services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
```

FastEndpoints replies through its own serializer options, which the host's options do not reach; they are set in
its configuration line of the start-up file:

```csharp
app.UseFastEndpoints(config =>
{
    config.Endpoints.RoutePrefix = "api";
    config.Serializer.Options.PropertyNameCaseInsensitive = true;
    config.Serializer.Options.Converters.Add(new JsonStringEnumConverter());
});
```

**Don't** set `PropertyNamingPolicy` in a service: the front end reads the default.

## 7. Central Package Management (convention only — mechanics elsewhere)

Package versions live in one central file; a project's `PackageReference` carries no `Version`.
`central-package-management` owns the set-up and the audit.

## 8. Per-project GlobalUsings

Each project of a service has its own `GlobalUsings.cs`, grouped under comment headers — third-party, then the
repo's shared libraries where it has any, then the domain, then the project's own layers — so its files carry few
`using` lines. Shared libraries and modules carry their `using` lines per file. Tidiness, not a gate: hold it in
review, not in a check.

```csharp file=GlobalUsings.cs
// Third-party libraries
global using Microsoft.EntityFrameworkCore;
global using Microsoft.EntityFrameworkCore.Metadata.Builders;

// Domain
global using Orders.Domain.Orders;

// Persistence
global using Orders.Persistence.Repositories;
```

## 9. Primary-constructor parameter names

A primary constructor's parameters are named by use:

- kept and used in the class's methods → `_camelCase` (`OrderRepository _orderRepository`);
- only passed to the base class → plain (`OrdersDbContext dbContext`);
- used once to set a declared member → plain, and the member carries the underscore
  (`protected readonly TimeProvider _clock = clock;`).

A record's positional members are PascalCase, every one. Tools and models do not produce this unprompted, so the
convention check holds the record half.

```csharp
public class OrderRepository(OrdersDbContext dbContext) : Repository<Order>(dbContext);

public class ShipmentScheduler(CarrierClient _carrierClient, TimeProvider clock)
{
    private readonly TimeProvider _clock = clock;
}
```

## 10. Validators

Every input has a validator in its command or query file (`create-feature` § Validation and Binding). Messages come
from the shared message helpers or constants (`error-handling` § Validation Messages), which work in both endpoint
styles: FastEndpoints' `Validator<T>` derives FluentValidation's `AbstractValidator<T>`. A validator checks the
input's shape and nothing else — no lookup, no business rule, no logging.

---

## What this skill does NOT do

- **Feature slices, aggregates, endpoints, repositories** — the job skills cover those.
- **Choosing a service's endpoint framework or database** — each service's `CLAUDE.md` names them.
- **Where each dependency is registered** — `service-registration`.
- **Central package management mechanics** — `central-package-management`.
