---
name: authorization-patterns
description: Endpoint authorization for a role-based domain — a closed role enum surfaced as string constants, the two-layer role + resource endpoint gate (both wired by one RequireRoleAuthorization extension), the authentication-only read-model exception, per-service resource access checks, framework-specific server-side identity stamping, and JWT validation. Use when gating an endpoint by role, adding a resource access check, stamping the acting user onto a command, configuring JWT authentication, or adding a role.
user-invocable: true
---

# Authorization Patterns

Authorization here is **two gates stacked at the endpoint boundary, plus a shared identity contract** — never
a role check inside a handler or domain body. A role-gated write endpoint passes a **role gate** (is the caller
one of these roles?) and a **resource gate** (does this caller have access to *this* resource?). Read-only
aggregate views take **authentication only**. The acting user is stamped onto the command by a framework hook,
and every service validates the same JWT identically.

> **Worked exemplar — the reference app (dotnet-microservices).** The concrete `UserRoleType` enum, the `Role` string constants, the `RequireRoleAuthorization` extension, `IArticleAccessChecker` / `ArticleRoleRequirement` / `ArticleActors`, the ArticleHub read models, and the Submission / Review / Production service names below are that app's Articles pipeline. The pattern — a closed role enum surfaced as constants, a stacked role+resource gate, auth-only reads, stamped provenance, one shared JWT validator — is domain-neutral; substitute your own aggregate and roles. (The `Article*` names appear throughout as that worked example, not because the pattern is article-specific.)

## Binding rules

Not style preferences — code that violates them is wrong here.

1. **No role check in business code.** The gate is declarative at the endpoint; a handler or domain method never inspects the caller's roles (zero `IsInRole` in business code).
2. **Never bare `RequireRole`.** Role-gated write endpoints go through the `RequireRoleAuthorization` extension, which stacks **both** layers (role gate + resource requirement). Bare `RequireRole` / a bare group-level `RequireAuthorization` never gates a write — it drops the resource layer.
3. **Resource access is answered from local data only.** The access checker reads the service's own replicated table — never a synchronous cross-service query.
4. **Provenance is stamped, never trusted.** `CreatedById` is set by the framework hook from the token, never read from the request body.

## Phase 1 — Role vocabulary

Roles are **one closed vocabulary** shared by every service: the `UserRoleType : int` enum in
`Articles.Abstractions`, surfaced as string constants by `Articles.Security.Role`. Integer values are
range-partitioned by domain (each service owns a numeric block; gaps are deliberate reserved namespace).
The list below is the **complete closed set** — there is no generic `Editor` or `Admin` enum member and no
bare `Admin` role constant; use the real members (the shipped defect referenced names that do not exist).

```csharp
// Articles.Abstractions/Enums/UserRoleType.cs
public enum UserRoleType : int
{
    EOF = 1,          // Editorial Office Admin (cross-domain 1-9)
    AUT = 11,         // Author              (Submission 11-19)
    CORAUT = 12,      // Corresponding Author
    REVED = 21,       // Review Editor        (Review 21-29)
    REV = 22,         // Reviewer
    POF = 31,         // Production Office Admin (Production 31-39)
    TSOF = 32,        // Typesetter
    USERADMIN = 91    // User Admin           (Auth-only 91-99)
}

// Articles.Security/Role.cs — each constant is nameof(UserRoleType.X), so they can never drift
public static class Role
{
    public const string UserAdmin   = nameof(UserRoleType.USERADMIN);
    public const string EditorAdmin = nameof(UserRoleType.EOF);
    public const string Author      = nameof(UserRoleType.AUT);
    public const string Editor      = nameof(UserRoleType.REVED);
    public const string Reviewer    = nameof(UserRoleType.REV);
    public const string ProdAdmin   = nameof(UserRoleType.POF);
    public const string Typesetter  = nameof(UserRoleType.TSOF);
}
```

**To add a role — three edits, in order:** (1) add the enum member **inside its domain's numeric range**
(never reuse a number); (2) add the matching `Role.` constant as `nameof(UserRoleType.NewMember)` — never a
hand-typed literal; (3) use the constant/enum member at the endpoint gate. Do not scatter the role name as a
string anywhere else.

## Phase 2 — Endpoint gate

Role-gated write endpoints get **both** layers through the single `RequireRoleAuthorization` extension: it
adds the ASP.NET `RequireRole` check **and** registers the `ArticleRoleRequirement` that drives the resource
gate in Phase 3 — one call wires both.

```csharp
// Articles.Security/Extensions.cs — keeps BOTH the role layer and the resource requirement
public static TBuilder RequireRoleAuthorization<TBuilder>(this TBuilder builder, params string[] roles)
    where TBuilder : IEndpointConventionBuilder
    => builder.RequireAuthorization(policy =>
    {
        policy.RequireRole(roles);                                 // role layer
        policy.Requirements.Add(new ArticleRoleRequirement(roles)); // resource layer marker
    });
// (a second overload takes params UserRoleType[] and RequireRole(roles.Select(r => r.ToString())))
```

Apply it at the endpoint (either the string constants or the enum members):

```csharp
// role-gated write endpoint — role gate + resource gate
group.MapPost("/{articleId:int}:approve", ApproveArticle)
     .RequireRoleAuthorization(Role.EditorAdmin, Role.Editor);
```

**The one sanctioned single-layer case: authentication-only read models.** Read-only aggregate/read-model
views (reference app: the ArticleHub service — `SearchArticles`, `GetTimeline`, `GetArticle`) use a bare `.RequireAuthorization()` —
any authenticated user, no role or resource check — because they expose a cross-service **read model**, not a
write on one resource. The rule: **writes get role + resource; aggregate reads get authentication only.** A
role-only admin endpoint is **not** the single-layer case — do not drop the resource layer for a write.

```csharp
searchGroup.MapGet("/", SearchArticles).RequireAuthorization(); // read model — auth only
```

## Phase 3 — Resource check

The resource gate answers "does *this* caller reach *this* resource?" — in the reference app,
`IArticleAccessChecker.HasAccessAsync`, implemented **once per write-side service** against that service's own
replicated actors table (`ArticleActors`) — local data, never a synchronous cross-service query. The `ArticleRoleRequirement` from Phase 2 is handled by
the shared `ArticleAccessAuthorizationHandler`, which narrows the caller's token roles to the requirement's
allowed set, then — only if at least one survives — asks the checker.

Each service's checker follows the **same decision tree** with a **service-specific admin bypass**:

1. `articleId` is null → **true** (endpoint isn't resource-specific).
2. `userId` null or roles empty → **false**.
3. Caller holds this service's **admin bypass role** → **true**.
4. Else → is the caller an actor on this article? (`ArticleActors` lookup by `(articleId, userId)`).

```csharp
public class ArticleAccessChecker(SubmissionDbContext _dbContext) : IArticleAccessChecker
{
    public async Task<bool> HasAccessAsync(int? articleId, int? userId, IReadOnlySet<UserRoleType> roles, CancellationToken ct = default)
    {
        if (articleId is null) return true;
        if (userId is null || roles.IsNullOrEmpty()) return false;
        if (roles.Overlaps([UserRoleType.EOF, UserRoleType.REVED])) return true; // admin bypass — set per service
        return await _dbContext.ArticleActors.AsNoTracking()
            .AnyAsync(e => e.ArticleId == articleId && e.Person.UserId == userId, ct);
    }
}
```

The admin bypass is the one line that changes per service: Submission `Overlaps([EOF, REVED])`, Review
`Contains(EOF)`, Production `Contains(POF)`. For a new write-side service, copy the skeleton into
`{Svc}.Application`, swap the `DbContext`, set the bypass to the role(s) that own every article there, and
register `IArticleAccessChecker` scoped.

## Phase 4 — Identity stamping — pick by framework

The acting user's id is stamped onto every `IAuditableAction` command as `CreatedById`, pipeline-computed and
never client-trusted (`ArticleCommandBase` `[JsonIgnore]`s the field so the wire can't set it). The stamp is
reimplemented **once per endpoint framework**, each hooking the shared `IClaimsProvider`:

| Dispatch / framework | Hook | Register as |
|---|---|---|
| MediatR pipeline (Submission, Review) | `AssignUserIdBehavior` | **first** open pipeline behavior — before Validation, before Logging |
| Minimal API, no MediatR | `AssignUserIdFilter` | endpoint filter |
| FastEndpoints (Production) | `AssignUserIdPreProcessor` | global pre-processor |

```csharp
// MediatR — stamps ahead of validation so downstream behaviors see the id
public class AssignUserIdBehavior<TRequest, TResponse>(IClaimsProvider _claimsProvider)
    : IPipelineBehavior<TRequest, TResponse> where TRequest : IAuditableAction
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var userId = _claimsProvider.TryGetUserId();
        if (userId is not null) request.CreatedById = userId.Value;
        return await next();
    }
}
```

All three share the contract: **stamp only when the request is an `IAuditableAction`, and source the id from
`IClaimsProvider`**. These three hooks are the **primary** stampers — the framework-level path that stamps every
auditable request automatically. A handler may still assign `CreatedById` directly when it holds an id the hook
can't supply (live: `Review.Application/Features/Invitations/AcceptInvitation/AcceptInvitationCommandHandler.cs`
sets `command.CreatedById` from a resolved reviewer id); such direct assignment is the deliberate exception, not
the rule. The presence guard differs: the MediatR behavior and the Minimal-API filter use `TryGetUserId()` and
skip silently when the claim is absent; the FastEndpoints pre-processor calls `GetUserId()`, which **throws** if
the id claim is missing — use the throwing form only where every request is guaranteed authenticated.

## Phase 5 — JWT validation

Every service validates the bearer token identically through `Articles.Security.AddJwtAuthentication`
(`services.AddJwtAuthentication(configuration)`). It enforces **issuer + signing key** and **deliberately
skips audience** — a single-audience internal system, so issuer and signature are the trust boundary. Roles map
from `ClaimTypes.Role`, which feeds `GetUserRoles<UserRoleType>()` in Phases 3–4.

```csharp
options.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,           ValidIssuer = jwtOptions.Issuer,
    ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.Default.GetBytes(jwtOptions.Secret)),
    ValidateAudience = false,        // single-audience internal system — deliberate, do not "harden"
    RequireExpirationTime = true,
    RoleClaimType = ClaimTypes.Role  // makes the role/resource gates resolve
};
```

`ValidateAudience = false` is intentional (one audience); `ValidateIssuer` + `ValidateIssuerSigningKey` are the
real boundary; `RoleClaimType = ClaimTypes.Role` is what makes `GetUserRoles<UserRoleType>()` work.

## Source Files (reference app)

- `src/BuildingBlocks/Articles.Abstractions/Enums/UserRoleType.cs` — the closed role enum
- `src/BuildingBlocks/Articles.Security/Role.cs` — role string constants
- `src/BuildingBlocks/Articles.Security/Extensions.cs` — `RequireRoleAuthorization()` (stacks both layers)
- `src/BuildingBlocks/Articles.Security/ArticleRoleRequirement.cs` + `ArticleAccessAuthorizationHandler.cs`
- `src/BuildingBlocks/Articles.Abstractions/Security/IArticleAccessChecker.cs`
- `src/BuildingBlocks/Articles.Security/ConfigureAuthentication.cs` — `AddJwtAuthentication`

## What this skill does NOT do

- **Issue or sign tokens** — that is the Auth service's login flow; this skill only *validates* an incoming token.
- **Populate `ArticleActors`** — filled by integration-event consumers (`add-integration-event`); the resource gate only reads it.
- **Implement `IClaimsProvider` / `HttpContextProvider`** — they live in `Blocks.Core` / `Blocks.AspNetCore`.
- **Define `IAuditableAction` / `ArticleCommandBase`** — the CQRS command contract, used here, not created here.
- **Multi-tenant / tenant-scoped authorization** — not applicable to this stack; there is no tenant dimension in the access check.
