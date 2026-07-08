---
name: service-infra-conventions
description: Cross-cutting infrastructure wiring and repo-wide conventions for a .NET microservice. Use when wiring a service's ambient request context, options binding, MediatR pipeline order, HTTP JSON casing, or validators, and when applying repo conventions (per-project GlobalUsings, private-field naming). Covers the segregated claims/route providers, the scoped RequestContext and correlation-id chain, fail-fast options, default-interface derivations, and the framework-split validation vocabulary.
user-invocable: true
---

# Service Infra & Conventions

How a .NET microservice wires cross-cutting infrastructure and the conventions every project follows. Reach for this when standing up a service, adding a middleware or pipeline step, binding a new options type, or writing a new project file.

Two through-lines run under everything here:

1. **Inner layers depend on a narrow capability, never on the transport.** A handler, a domain method, a pipeline behavior asks for identity or a route value through a small interface — it never sees `HttpContext`.
2. **Required config fails at startup, not at first use.** Options are bound once through shared helpers that validate and fail fast.

> **Worked exemplar — the reference app (dotnet-microservices).** Every concrete class (`HttpContextProvider`, `RequestContext`, `AddAndValidateOptions`), building-blocks package (`Blocks.Core`, `Blocks.AspNetCore`, `Blocks.Domain`), and service name (Submission / Review / Production / ArticleHub) below is that app's Articles pipeline. Each section cites the reference-app source file that grounds it. The rules are portable; the class names are the example.

## Cheat sheet

| Concern | The rule |
|---|---|
| Ambient identity/route | Inject `IClaimsProvider` / `IRouteProvider`; only `HttpContextProvider` touches `HttpContext` |
| Request context | Scoped `RequestContext` POCO, populated once by middleware, read via DI |
| Correlation id | Priority: incoming header, then `Activity.Current`, then Kestrel `TraceIdentifier` |
| Options binding | Only `AddAndValidateOptions` / `GetSectionByTypeName`; fail fast at startup |
| Shared derivations | C# default interface method, no base class |
| MediatR pipeline | Fixed order: AssignUserId, then Validation, then Logging |
| HTTP JSON casing | Set only `PropertyNameCaseInsensitive`; keep the camelCase default |
| Package versions | Central management, zero inline `Version=` — mechanics in `central-package-management` |
| Global usings | Per-project `GlobalUsings.cs` with category headers |
| Private fields | `_camelCase` for declared fields and ctor captures |
| Validators | Vocabulary follows the framework; no shared cross-framework helpers |

---

## 1. Ambient context — depend on the capability, not on HttpContext

Inner layers ask for the narrow thing they need. Identity comes from `IClaimsProvider` (reference app: `Blocks.Core`); route values come from `IRouteProvider` (reference app: `Blocks.AspNetCore`). Both are implemented by one class, `HttpContextProvider`, which is the **only** place that reads `HttpContext`. The interface split is deliberate (marked with an "interface segregation" insight comment in the source). All three identity-stamping mechanisms — the MediatR behavior, the Minimal-API filter, the FastEndpoints pre-processor — inject `IClaimsProvider` and nothing else.

Source (reference app): `Blocks.AspNetCore/HttpContextProvider.cs`.

```csharp
// Blocks.Core
public interface IClaimsProvider
{
    string GetClaimValue(string claimName);
    int GetUserId();
    int? TryGetUserId();
    IReadOnlySet<TEnum> GetUserRoles<TEnum>() where TEnum : struct, Enum;
    // ...
}

// Blocks.AspNetCore
public interface IRouteProvider
{
    string GetRouteValue(string key);
    int? GetArticleId();
}

// The single adapter — the only class allowed to touch HttpContext
public class HttpContextProvider(IHttpContextAccessor _httpContextAccessor)
    : IClaimsProvider, IRouteProvider
{
    // ...
}
```

**Don't** inject `IHttpContextAccessor` or `HttpContext` into a handler, a pipeline behavior, a repository, or any domain method. If a handler needs the caller's id, it takes `IClaimsProvider`.

## 2. RequestContext — a scoped POCO populated once

`RequestContext` (reference app: `Blocks.Core.Context`) is a plain scoped object registered per service with `services.AddScoped<RequestContext>()`. A `RequestContextMiddleware` fills it in once per request — correlation id, upload/download flags, remote ip. Everything downstream (the logging behavior, a diagnostics middleware) reads it by DI. Nothing re-derives these values from `HttpContext.Items`.

The correlation id follows a fixed priority chain: the incoming `X-Correlation-ID` header, then the current distributed-trace id (`Activity.Current`), then Kestrel's `TraceIdentifier`.

Source (reference app): `Blocks.Core/Context/RequestContext.cs`; `Blocks.AspNetCore/Middlewares/RequestContextMiddleware.cs`.

```csharp
public class RequestContext
{
    public string? CorrelationId { get; set; }
    public DateTime StartedOn { get; set; } = DateTime.UtcNow;
    public string? RemoteIp { get; set; }

    public bool IsUpload { get; set; } = false;
    public bool IsDownload { get; set; } = false;
    public bool IsFileTransfer => IsUpload || IsDownload;
}

private static string ResolveCorrelationId(HttpContext httpContext)
{
    if (httpContext.Request.Headers.TryGetValue(CorrelationIDHeader, out var value)
        && !string.IsNullOrWhiteSpace(value))
        return value.ToString();

    var activityId = Activity.Current?.TraceId.ToString();
    if (!string.IsNullOrEmpty(activityId))
        return activityId!;

    return httpContext.TraceIdentifier;
}
```

**Don't** read `HttpContext.Items["X-Correlation-ID"]` in a handler or a second middleware. Take `RequestContext` by constructor injection and read the property.

## 3. Options binding — fail fast at startup

Bind every options type through the two shared helpers (reference app: `Blocks.Core`). Both name the config section by the type name, so the section is `JwtOptions`, `RabbitMqOptions`, and so on — no string keys.

- `AddAndValidateOptions<TOptions>(configuration)` — binds, runs DataAnnotations, and calls `ValidateOnStart()`, so a missing or invalid section throws when the app boots. This is the default for anything a service needs to be present.
- `GetSectionByTypeName<TOptions>()` — returns the bound value right there at registration time, for when you need it to build something else (a gRPC client, the MassTransit connection). It throws if the section is absent.

In the reference app there are many call sites and zero ad-hoc `services.Configure<SomethingOptions>(...)` calls anywhere. Keep it that way.

Source (reference app): `Blocks.Core/Configurations/ConfigurationExtensions.cs`.

```csharp
public static IServiceCollection AddAndValidateOptions<TOptions>(
    this IServiceCollection services, IConfiguration configuration)
    where TOptions : class
{
    var section = configuration.GetSection(typeof(TOptions).Name);
    if (!section.Exists())
        throw new InvalidOperationException($"Configuration section '{section.Key}' is missing.");

    services.AddOptions<TOptions>()
        .Bind(section)
        .ValidateDataAnnotations()
        .ValidateOnStart(); // fail fast if required values are missing
    return services;
}

// Registration
services
    .AddAndValidateOptions<RabbitMqOptions>(configuration)
    .AddAndValidateOptions<TransactionOptions>(configuration);

var grpcOptions = configuration.GetSectionByTypeName<GrpcServicesOptions>();
services.AddCodeFirstGrpcClient<IPersonService>(grpcOptions, "Person");
```

**Don't** call `services.Configure<SomethingOptions>(section)` directly. If a required value is missing you want a startup crash, not a `null` surfacing three requests later.

## 4. Default interface methods for shared derivations

When a value follows mechanically from another property, put it in a C# default interface method instead of a base class. In the reference app, `IAuditableAction<TActionType>` derives the audit `Action` string from the generic enum, and `IsAuthenticated` from `CreatedById` — every command that implements the interface gets both for free, with no inheritance.

Source (reference app): `Blocks.Domain/IAuditableAction.cs`.

```csharp
public interface IAuditableAction
{
    int CreatedById { get; set; }
    bool IsAuthenticated => CreatedById != default;   // default interface method
    DateTime CreatedOn { get; }
    string Action { get; }
    string? Comment { get; }
}

public interface IAuditableAction<TActionType> : IAuditableAction
    where TActionType : Enum
{
    TActionType ActionType { get; }
    string IAuditableAction.Action => ActionType.ToString();  // derived, no base class
}
```

## 5. MediatR pipeline order

MediatR services register open behaviors in one fixed order: `AssignUserIdBehavior`, then `ValidationBehavior`, then `LoggingBehavior`. The order carries meaning — identity is stamped **before** validation runs, and logging wraps only the innermost span. (Reference app: Submission and Review register the same three in the same order.)

Source (reference app): `Submission.Application/DependencyInjection.cs`.

```csharp
.AddMediatR(config =>
{
    config.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());

    config.AddOpenBehavior(typeof(AssignUserIdBehavior<,>));
    config.AddOpenBehavior(typeof(ValidationBehavior<,>));
    config.AddOpenBehavior(typeof(LoggingBehavior<,>));
})
```

**Don't** reorder these. Validating before `AssignUserId` runs would validate a command whose `CreatedById` is not yet stamped.

## 6. HTTP JSON casing — keep the framework default

Never override JSON property naming for the HTTP wire format. Every service's `JsonOptions` sets only `PropertyNameCaseInsensitive = true` plus a `JsonStringEnumConverter`. This keeps ASP.NET's camelCase web default, which is what a typical SPA frontend expects. (Reference app: the one place that sets an explicit naming policy is `Blocks.Hasura`, because it talks to Hasura and Postgres — not the browser.)

Source (reference app): the API DI files, e.g. `Submission.API/DependecyInjection.cs`.

```csharp
.Configure<JsonOptions>(opt =>
{
    opt.SerializerOptions.PropertyNameCaseInsensitive = true;
    opt.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
```

**Don't** set `PropertyNamingPolicy` in a service. Fighting the default breaks the frontend contract.

## 7. Central Package Management (convention only — mechanics elsewhere)

Convention: package versions are **centrally managed** at the `src/` root, and every csproj carries bare `PackageReference` entries with no inline `Version=` (reference app: zero inline `Version=` across all csproj files; central management and transitive pinning both on).

This skill states only the convention. For the full setup — the `Directory.Packages.props` layout, the `PackageVersion`/`PackageReference` split, and the stray-version audit grep — follow `central-package-management` (single owner of the CPM mechanics; do not restate them here).

Reference-app smell to avoid: a nested `Directory.Packages.props` under one service silently overrides the root by nearest-wins — tracked as debt, not a pattern to copy.

## 8. Per-project GlobalUsings

Each layered project ships its own `GlobalUsings.cs`, curated for that project — not a repo-wide dump. Group the usings under category headers in this order: third-party, then internal building blocks, then domain, then the project's own layers. (Reference app: the header grouping is the house habit — most files use it; follow it in new files.)

Source (reference app): `Submission.Persistence/GlobalUsings.cs`.

```csharp
// Third-party libraries
global using Microsoft.EntityFrameworkCore;
global using Microsoft.EntityFrameworkCore.Metadata.Builders;

// Internal libraries (Building Blocks)
global using Blocks.Core;
global using Blocks.EntityFrameworkCore;
global using Articles.Abstractions.Enums;

// Domain
global using Submission.Domain.Entities;

// Persistence
global using Submission.Persistence.Repositories;
global using Submission.Persistence;
```

## 9. Private-field naming

Declared private instance fields are `_camelCase`, with no exceptions. Primary-constructor parameter captures are the one spot to watch — in the reference app `dbContext` and `_dbContext` both appear, even between sibling repositories of the same service.

Converge on the underscore form: name primary-constructor captures `_camelCase` too, matching the declared-field convention. The infrastructure classes already do this — `HttpContextProvider(IHttpContextAccessor _httpContextAccessor)`, `RequestContextMiddleware(RequestDelegate _next, ILogger _log)`. Follow those, not the bare-name repositories.

```csharp
// Follow this — underscore capture, matches the field convention
public class HttpContextProvider(IHttpContextAccessor _httpContextAccessor) { }

// Not this — bare capture, the unsettled form
public class ArticleRepository(ProductionDbContext dbContext) { }
```

## 10. Validators — vocabulary follows the framework

Validation infrastructure splits along the endpoint-framework line all the way down. There is **no** shared cross-framework message vocabulary — pick the one that matches the service's framework and do not reach across.

- **MediatR services** (reference app: Submission, Review): validators extend FluentValidation `AbstractValidator<T>` and use the shared message helpers in the `Blocks.Core` FluentValidation extensions — `NotEmptyWithMessage`, `WithMessageForInvalidId`, `MaximumLengthWithMessage`.
- **FastEndpoints services** (reference app: Production, Journals): validators extend `Validator<T>` — Production uses a local `BaseValidator<T>` — and draw their strings from a service-local `ValidatorsMessagesConstants`. They do **not** use the `Blocks.Core` extensions.

Source (reference app): `Blocks.Core/FluentValidation/Extensions.cs`; `Production.API/Features/_Shared/Validators.cs`.

```csharp
// FastEndpoints side (Production) — local BaseValidator + local message constants
public abstract class BaseValidator<T> : Validator<T>
{
    public BaseValidator()
    {
        RuleFor(command => command).NotEmpty()
            .WithMessage(ValidatorsMessagesConstants.NotNull);
    }
}

// MediatR side (Submission, Review) — shared Blocks.Core message helpers
public static class Extensions
{
    public static IRuleBuilderOptions<T, TProperty> NotEmptyWithMessage<T, TProperty>(
        this IRuleBuilder<T, TProperty> ruleBuilder, string propertyName)
        => ruleBuilder.NotEmpty()
            .WithMessage(c => ValidationMessages.NullOrEmptyValue.FormatWith(propertyName));
}
```

**Don't** call the `Blocks.Core` FluentValidation helpers from a FastEndpoints validator, or the local `ValidatorsMessagesConstants` from a MediatR one.

---

## What this skill does NOT do

- **Feature slices, aggregates, endpoints, repositories** — this is the wiring and conventions layer, not the business-code recipe. Use the domain and feature skills for those.
- **Deciding a service's endpoint framework or database** — that lives in each service's `CLAUDE.md`. This skill assumes the choice is already made and shows how the cross-cutting pieces attach to it.
- **The DI layer structure** (which project registers what, where each dependency type is composed) — that is `service-registration`. This skill covers what the ambient/options/validation pieces *are*, not where every dependency is wired.
- **Central Package Management mechanics** — the `Directory.Packages.props` setup and the stray-version audit grep are `central-package-management` (section 7 keeps only the convention-level statement).

**Found a gap?** If a convention here has moved, or this skill steered you wrong, record it in the run's `lessons.md` under your role heading so the correction can be folded back into this file.
