---
name: authorization-patterns
description: Endpoint authorization for a role-based domain — the two-layer role and resource gate (a closed role enum surfaced as string constants, both layers attached by one role-authorization extension), the authentication-only read-model exception, per-service resource access checks, the identity stamp for each endpoint style, and JWT validation; plus when to reach for ASP.NET Core policy-based authorization instead and a minimal single-principal shape. Use when gating an endpoint by role, adding a resource access check, choosing between the role and resource gate and a policy, stamping the acting user onto a command, configuring JWT authentication, or adding a role. Does not cover OAuth or OIDC sign-in middleware, client-side route guards, or 401 response interception.
user-invocable: true
---

# Authorization Patterns

Authorization is **declared on the endpoint**, never checked inside the logic. A write endpoint passes two gates: a
**role gate** (is the caller one of these roles?) and a **resource gate** (may this caller act on *this* order?).
A read model takes **authentication only**. The acting user is stamped onto the command by one framework hook, and
every service validates the token the same way. The samples use an ordering domain — orders, clerks, managers;
substitute your own aggregate and roles.

## Assumes

- **A closed role vocabulary** every service shares — an enum surfaced as string constants. A repo with one service
  keeps it in that service; with several, in the lowest project they all reference.
- **The gate's three helpers** — the role-authorization extension, its requirement and the access handler, all
  sampled below — built once in the shared place where the repo has no equivalent.
- **Each write-side service answers access from its own data** — a local, replicated table of who acts on what —
  never a synchronous call to another service.
- **The request context's claims reader** (`service-infra-conventions` § 1. Ambient context — depend on the capability, not on HttpContext) for the identity stamp.
- No shared library is assumed: every helper here is sampled whole.

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

## Choosing your authorization model

The phases below teach one model — a stacked role and resource gate. Pick the model first:

- **Two-layer role and resource gate (Phases 1–5).** When the question is *"which roles, and does the caller act on
  this resource?"* — a closed role vocabulary plus per-resource ownership.
- **Policy-based authorization.** When the decision is a claim or attribute predicate — "has a verified-email
  claim", "is over a spend threshold" — use ASP.NET Core's named policies:
  `AddAuthorizationBuilder().AddPolicy(name, policy => …)` with an `IAuthorizationRequirement` and its handler,
  attached by `.RequireAuthorization(name)`. The role and resource gate is a policy too; do not build its machinery
  where one claim policy expresses the rule.

### Minimal shape — single principal

A service with one principal and no role vocabulary yet authenticates only — `.RequireAuthorization()` plus JWT
validation (Phase 5) — and stamps the caller's id. Promote to the two-layer gate when a second role appears; that is
the three-edit recipe of Phase 1, not a rewrite.

## Binding rules

1. **No access check in the logic.** The gate is declared on the endpoint, with constants; a handler, an endpoint
   body or a domain method never inspects the caller's roles, never compares the caller with an owner, and never
   writes a 403 by hand.
2. **A write takes both layers.** Role-gated writes go through the role-authorization extension, which attaches the
   role gate and the resource requirement together. A bare role check or a bare `RequireAuthorization()` never
   gates a write.
3. **Resource access is answered from local data only.**
4. **Provenance is stamped, never trusted.** The acting user and the time are set by the framework hook, never read
   from the request body.

## Phase 1 — Role vocabulary

One closed enum, surfaced as string constants derived with `nameof`, so the two can never drift:

```csharp file=UserRole.cs
public enum UserRole
{
    Customer = 1,
    Clerk = 2,
    Manager = 3,
    Admin = 4
}
```

```csharp file=Role.cs
public static class Role
{
    public const string Customer = nameof(UserRole.Customer);
    public const string Clerk = nameof(UserRole.Clerk);
    public const string Manager = nameof(UserRole.Manager);
    public const string Admin = nameof(UserRole.Admin);
}
```

**To add a role — three edits, in order:** the enum member, with a number never used before; the matching
constant as `nameof(UserRole.NewMember)`; the constant at the endpoint gate. The role name appears nowhere else.

## Phase 2 — Endpoint gate

One policy shape carries both layers: the role check, and the requirement the resource gate (Phase 3) answers, both
built from the same role set. The extension attaches it to a route, or registers it under a name.

```csharp file=AuthorizationExtensions.cs
public static class AuthorizationExtensions
{
    public static TBuilder RequireRoleAuthorization<TBuilder>(this TBuilder builder, params string[] roles)
        where TBuilder : IEndpointConventionBuilder =>
        builder.RequireAuthorization(policy => policy.RequireRoleAndResourceAccess(roles));

    public static AuthorizationBuilder AddResourceAccessPolicy(this AuthorizationBuilder builder, string name, params string[] roles) =>
        builder.AddPolicy(name, policy => policy.RequireRoleAndResourceAccess(roles));

    private static AuthorizationPolicyBuilder RequireRoleAndResourceAccess(this AuthorizationPolicyBuilder policy, string[] roles) =>
        policy.RequireRole(roles).AddRequirements(new ResourceAccessRequirement(roles));
}
```

```csharp file=ResourceAccessRequirement.cs
public class ResourceAccessRequirement(IEnumerable<string> allowedRoles) : IAuthorizationRequirement
{
    public IReadOnlySet<string> AllowedRoles { get; } = allowedRoles.ToHashSet();
}
```

Endpoint style decides how it is attached:

- **Mediator style (minimal or Carter):** the fluent call on the route —
  `.RequireRoleAuthorization(Role.Clerk, Role.Manager)`.
- **FastEndpoints:** the named policy for the endpoint's role set in the authorization attribute —
  `[Authorize(Policy = Policy.Clerks)]`. Each role set an endpoint admits is one policy, registered once at start-up
  with its roles, so the role check and the resource requirement always carry the same set. A role set nobody uses
  yet gets its policy in the change that first uses it.

```csharp file=Policy.cs
public static class Policy
{
    public const string Clerks = nameof(Clerks);
    public const string ClerksAndManagers = nameof(ClerksAndManagers);
}
```

```csharp
services.AddAuthorizationBuilder()
    .AddResourceAccessPolicy(Policy.Clerks, Role.Clerk)
    .AddResourceAccessPolicy(Policy.ClerksAndManagers, Role.Clerk, Role.Manager);
```

**The one single-layer case: authentication-only read models.** A read-only view across many resources (a search,
a timeline) takes `.RequireAuthorization()` — any authenticated caller — because it is a read model, not a write
on one resource. Writes get role and resource; read models get authentication only. A role-only admin write is not
this case.

## Phase 3 — Resource check

The handler narrows the caller's roles to the set the requirement carries — the roles the endpoint admits, in both
styles — then asks the service's checker whether the caller reaches the resource named in the route. So a caller
holding Clerk and Manager on a Clerk-only endpoint reaches the checker as a Clerk: the Manager bypass applies only
where the endpoint admits managers. A requirement with no roles admits nobody.

```csharp file=ResourceAccessHandler.cs
using System.Security.Claims;

public class ResourceAccessHandler(IResourceAccessChecker _accessChecker)
    : AuthorizationHandler<ResourceAccessRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, ResourceAccessRequirement requirement)
    {
        if (context.Resource is not HttpContext httpContext
            || !int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return;

        var roles = context.User.FindAll(ClaimTypes.Role)
            .Select(claim => claim.Value)
            .Where(requirement.AllowedRoles.Contains)
            .Select(role => Enum.TryParse<UserRole>(role, out var parsed) ? parsed : (UserRole?)null)
            .OfType<UserRole>()
            .ToHashSet();

        if (roles.Count == 0)
            return;

        var resourceId = int.TryParse(httpContext.GetRouteValue(_accessChecker.RouteKey)?.ToString(), out var id)
            ? id
            : (int?)null;

        if (await _accessChecker.HasAccessAsync(resourceId, userId, roles, httpContext.RequestAborted))
            context.Succeed(requirement);
    }
}
```

The checker is the service's own: the handler is shared, and every write-side service supplies its implementation —
which is why it has an interface.

```csharp file=IResourceAccessChecker.cs
public interface IResourceAccessChecker
{
    string RouteKey { get; }

    Task<bool> HasAccessAsync(int? resourceId, int userId, IReadOnlySet<UserRole> roles, CancellationToken ct = default);
}
```

Every checker follows the same decision tree, with a bypass role set per service:

1. No resource id in the route → **true** (the endpoint is not resource-specific).
2. The caller holds the service's bypass role → **true**.
3. Else → is the caller an actor on this resource, by the service's own table?

```csharp file=OrderAccessChecker.cs
public class OrderAccessChecker(OrdersDbContext _dbContext) : IResourceAccessChecker
{
    public string RouteKey => "orderId";

    public async Task<bool> HasAccessAsync(int? resourceId, int userId, IReadOnlySet<UserRole> roles, CancellationToken ct = default)
    {
        if (resourceId is null || roles.Contains(UserRole.Manager))
            return true;

        return await _dbContext.OrderActors
            .AnyAsync(actor => actor.OrderId == resourceId && actor.UserId == userId, ct);
    }
}
```

Register the checker and the handler, scoped, in the service's registration:
`services.AddScoped<IResourceAccessChecker, OrderAccessChecker>()` and
`services.AddScoped<IAuthorizationHandler, ResourceAccessHandler>()`.

## Phase 4 — Identity stamping — pick by framework

The acting user's id and the time are stamped onto every command that carries an action (`create-feature` § Requests,
Replies and Names) by one hook per endpoint style. Endpoints never read the caller; a class that needs the caller
takes the narrow claims reader (`service-infra-conventions` § 1. Ambient context — depend on the capability, not on HttpContext), never the concrete holder or `HttpContext`. The
time comes from the injected clock.

| Endpoint style | Hook | Registered as |
|---|---|---|
| A mediator (Carter or minimal APIs) | `StampActionBehavior` | the first pipeline behaviour, before validation |
| FastEndpoints | `StampActionPreProcessor` | a global pre-processor |
| Adaptation outside the two styles: minimal APIs with no mediator | `StampActionFilter` | an endpoint filter on the route group |

```csharp file=StampActionBehavior.cs
public class StampActionBehavior<TRequest, TResponse>(IClaimsProvider _claimsProvider, TimeProvider _timeProvider)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IAction
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (_claimsProvider.TryGetUserId() is { } userId)
            request.ActingUserId = userId;

        request.ActedOn = _timeProvider.GetUtcNow();

        return await next();
    }
}
```

```csharp file=StampActionFilter.cs
public class StampActionFilter(IClaimsProvider _claimsProvider, TimeProvider _timeProvider) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        foreach (var action in context.Arguments.OfType<IAction>())
        {
            if (_claimsProvider.TryGetUserId() is { } userId)
                action.ActingUserId = userId;

            action.ActedOn = _timeProvider.GetUtcNow();
        }

        return await next(context);
    }
}
```

```csharp file=StampActionPreProcessor.cs
public class StampActionPreProcessor : IGlobalPreProcessor
{
    public Task PreProcessAsync(IPreProcessorContext context, CancellationToken ct)
    {
        if (context.Request is IAction action)
        {
            action.ActingUserId = context.HttpContext.Resolve<IClaimsProvider>().GetUserId();
            action.ActedOn = context.HttpContext.Resolve<TimeProvider>().GetUtcNow();
        }

        return Task.CompletedTask;
    }
}
```

The presence guard differs on purpose: the behaviour and the filter use `TryGetUserId()` and leave the id unset
for an anonymous request; the pre-processor calls `GetUserId()`, which throws when the claim is missing — use the
throwing form only where every request is authenticated. A handler may set the acting user itself only when it
holds an id the hook cannot know; that is the exception, never the rule.

## Phase 5 — JWT validation

Every service validates the bearer token the same way, through one registration: issuer and signing key are the
trust boundary, the audience check is off for a system with one audience, and roles map from `ClaimTypes.Role`,
which the resource gate reads. The token settings are bound and validated at start-up like any other settings
(`service-infra-conventions` § 3. Options binding — fail fast at startup).

```csharp file=JwtAuthenticationRegistration.cs
using System.Security.Claims;
using System.Text;

public static class JwtAuthenticationRegistration
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();

        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOptions>>((options, jwtOptions) => options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Value.Issuer,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Value.Secret)),
                ValidateAudience = false,
                RequireExpirationTime = true,
                RoleClaimType = ClaimTypes.Role
            });

        return services;
    }
}
```

## What this skill does NOT do

- **Issue or sign tokens** — that is the sign-in service's flow; this skill only validates a token.
- **Fill the actors table** a checker reads — integration-event consumers do (`add-integration-event`).
- **Implement the claims reader** — `service-infra-conventions` carries it.
- **Define the command base** — `create-feature` carries it; it is used here.
- **Tenant-scoped authorization** — the access check has no tenant dimension.
- **OAuth or OIDC sign-in middleware** — the interactive flow that mints the token.
- **Client-side route guards, and 401 or 403 interception** — front-end concerns.
