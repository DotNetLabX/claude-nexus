---
name: domain-service
description: Creates a Domain-layer service class for cross-aggregate computation — pure by default, named by what it does, returns domain types. Use when analytics, scoring, or derivation logic spans multiple aggregates and belongs in the Domain layer.
user-invocable: true
---

# Domain Service

A *domain service* is a **Domain-layer class** in `{Module}.Domain/{Area}/` that holds cross-aggregate computation or derivation logic. Single-aggregate logic stays in aggregate behavior methods; only logic that genuinely crosses aggregates or is too complex for any one aggregate belongs here.

**This skill covers one pattern: the Domain-layer service.** For API-layer operation services (shared endpoint logic, no domain purity constraint), see `extract-feature-service`. For the Application-layer service pattern used in projects with an Application layer, see the "When this doesn't apply" section below.

## Governing Principles

This skill encodes three domain-layer rules. Where a project records them as ADRs, the rule is what matters, not the number:

- **Computation-in-domain** — cross-aggregate computation lives in the Domain layer; domain services return domain types/VOs; minimize API service classes.
- **No-DTO-input** — no external/integration/response DTOs enter the Domain.
- **Endpoint-owns-response** — the endpoint always owns its own response contract and maps domain → DTO (Mapster is a common choice; use whatever mapper the project standardizes on).

## When to Use

- Logic spans two or more aggregates (e.g., computing a ratio across two aggregates such as `Sprint` and `Ticket`).
- The computation is pure enough to be tested without a database.
- The computation-in-domain rule keeps it in the Domain layer (especially when no Application layer exists in the stack).

## Location

```
{Module}.Domain/
  {Area}/
    {Name}Calculator.cs    ← domain service (this skill)
    {Name}Result.cs        ← domain result record (if complex enough to split out)
```

Example shape: a `SprintSummaryCalculator` in `{Module}.Domain/Analytics/`. If the same computation currently lives in an API-layer service (a `{Module}.API/Features/Analytics/SprintSummaryService.cs`), that is the computation-in-domain smell — move it to the Domain layer following this skill.

## Naming Rule

**Do not use a `Service` or `DomainService` suffix.** Name the class by what it does:

| Good | Bad |
|------|-----|
| `SprintSummaryCalculator` | `SprintSummaryService` |
| `CycleTimeAnalyzer` | `CycleTimeDomainService` |
| `BugRatioScorer` | `BugRatioService` |
| `VelocityProjector` | `VelocityDomainService` |

This rule applies to domain-layer services. API-layer operation services (see `extract-feature-service`) follow their own naming convention and are not subject to this rule.

## Dependencies — Pure by Default

The domain service operates on aggregates passed in by the caller. It is **DB-free and unit-testable** by default.

```csharp
// CORRECT — caller pre-loads aggregates, passes them in
public class BugRatioScorer
{
    public BugRatioResult Score(IReadOnlyList<Sprint> closedSprints, HealthThresholdConfig thresholds)
    {
        // pure computation over pre-loaded domain objects
        // HealthThresholdConfig is a domain VO the caller supplies
    }
}
```

### Escape Hatch — Narrow Domain-Owned Read Port (performance only)

When pre-loading all aggregates is genuinely impractical (e.g., board-level history across hundreds of sprints), inject a **narrow read port** — an interface **declared in `{Module}.Domain`**, returning **domain types only**, named for the read it performs:

```csharp
// In {Module}.Domain/{Area}/ — declared here, implemented in Persistence.
// ClosedSprintSnapshot is a domain-layer projection record defined alongside this
// interface. Use whatever name describes the domain data your read port needs to return.
public interface IClosedSprintHistory
{
    Task<IReadOnlyList<ClosedSprintSnapshot>> LoadForBoard(int boardId, int lookBackCount, CancellationToken ct);
}
```

```csharp
// Domain service injects the domain-owned abstraction, not a concrete repository.
// Primary constructor: use un-prefixed parameter name (idiomatic C# 12 primary constructor)
public class VelocityProjector(IClosedSprintHistory history)
{
    public async Task<VelocityProjection> ProjectAsync(int boardId, int count, CancellationToken ct)
    {
        var snapshots = await history.LoadForBoard(boardId, count, ct);
        // pure derivation over domain types
    }
}
```

**Forbidden in the escape hatch:**
- `IRepository<T>` / `RepositoryBase<T>` — too broad, leaks persistence shape
- `IQueryable<T>` — leaks EF Core into the domain
- `DbContext` or any EF type — domain cannot depend on persistence

Write the justification at the call site: `// Performance: pre-loading {N} sprint histories is O(N*M) — use read port`.

The read-port interface is registered in Persistence's `DependencyInjection.cs` (it lives in Domain but is implemented in Persistence).

## Output Boundary — Endpoint Always Owns the Response DTO

Domain service methods return **domain types or dedicated domain result records**, never API response DTOs.

```csharp
// CORRECT — domain result record (lives in Domain layer)
public record BugRatioResult(
    decimal Current,
    decimal? Prior,
    decimal? Delta,
    HealthThresholdConfig Thresholds);  // HealthThresholdConfig is a domain VO

public class BugRatioScorer
{
    public BugRatioResult Score(IReadOnlyList<Sprint> sprints, HealthThresholdConfig thresholds) { ... }
}
```

```csharp
// WRONG — response DTO in domain
public class BugRatioScorer
{
    public BugRatioResponse Score(...) { ... }  // "Response" suffix → API concern, not domain
}
```

The **endpoint always defines its own response contract and maps domain → DTO via the project's mapper** — even when the shapes are identical. The domain type and the wire contract evolve independently; do not return the domain type directly from the endpoint, and do not reuse the domain type as the response.

> **Discriminated `*Response` envelopes are wire-only — never mirror them into the domain.** Many analytics features wrap two compute shapes in a `{ Mode, Multi?, Single? }` `*Response` envelope. That envelope is a **transport construct**: the calculator returns the two shapes **separately** (as domain result records) and the **endpoint assembles** the envelope. Do not add a `Mode`/`Multi`/`Single` wrapper type to the Domain layer (a wire-name leak), and do not list it in a domain rename table when planning a migration. State this explicitly for any service whose response is a discriminated wrapper.

```csharp
// Endpoint maps the domain result to its own wire response (Mapster shown; use the project's mapper):
public class GetBugRatioEndpoint : Endpoint<GetBugRatioRequest, BugRatioResponse>
{
    public override async Task HandleAsync(GetBugRatioRequest req, CancellationToken ct)
    {
        var sprints = await _sprintRepo.GetAnalyticsSprints(ct);
        var result = _scorer.Score(sprints, _settings.HealthThresholds);  // domain type out
        await Send.OkAsync(result.Adapt<BugRatioResponse>(), ct);          // endpoint maps
    }
}
```

## Input Boundary — No DTOs Enter the Domain

Domain service parameters must be **domain types, value objects, or intrinsic primitives**. External/integration/response DTOs are forbidden as parameters.

```csharp
// CORRECT — domain types + primitives
public BugRatioResult Score(
    IReadOnlyList<Sprint> closedSprints,      // domain aggregate
    HealthThresholdConfig thresholds,          // domain VO
    int windowSize)                            // intrinsic computation primitive

// WRONG — external DTO leaks into domain
public BugRatioResult Score(JiraSprintResponse jiraData, ...) { ... }
```

Use a **value object** when a parameter carries domain meaning or an invariant. Use a plain primitive when it is an incidental computation parameter (look-back count, window size, index).

Map external data → domain types at the API/Persistence boundary *before* the domain service sees it.

## DI Registration

Register the domain service as **scoped** in the owning module's API or Persistence `DependencyInjection.cs`. No Application layer is needed — the domain service is a Domain-layer class registered wherever the module wires its DI.

```csharp
// {Module}.API/DependencyInjection.cs  (light-stack variant — no Application layer)
services.AddScoped<BugRatioScorer>();
services.AddScoped<SprintSummaryCalculator>();
```

If using the escape-hatch read port, register its implementation in Persistence:

```csharp
// {Module}.Persistence/DependencyInjection.cs
services.AddScoped<IClosedSprintHistory, ClosedSprintHistoryQuery>();
```

See `service-registration` for the full layer structure and "skip layer 2 when no Application project" guidance.

## When This Doesn't Apply — The Application-Layer Service (Contrast)

In projects **with an Application layer**, cross-aggregate orchestration commonly lives in an **Application-layer service** instead — such as an `ArticleAccessChecker` in a `Submission.Application/` project. That is a **distinct pattern** with different rules: it may depend on a `DbContext` or repositories directly and is **not** bound by the domain-service purity rule above. Use the Application-layer approach when the project structure provides that layer and the logic is orchestration (loading + coordinating) rather than pure computation.

No sentence in this skill implies a domain service can live in or depend on an Application layer, a `DbContext`, or concrete repositories. If you need that pattern, see `cqrs-patterns` for Application-layer handler placement.

## Relationship to Other Skills

| Skill | Relationship |
|-------|-------------|
| `analytics-computation-service` | Specialization of this skill for time-series analytics — adds sparkline builders, delta/direction/polarity helpers, rolling averages |
| `domain-patterns` | Defines the domain types (aggregates, VOs, owned types) that domain services consume and return |
| `persistence-patterns` | Shows how the narrow read-port escape-hatch interface is implemented in Persistence |
| `extract-feature-service` | The API-layer operation service pattern — different layer, different rules (may inject concrete repos; no purity constraint) |
| `service-registration` | Where DI registration goes per layer; the "skip layer 2 when no Application project" fallback |
| `cqrs-patterns` | Application-layer handler placement for the full-stack (MediatR) world |

## What This Skill Does NOT Cover

- Analytics-specific helpers (sparklines, rolling averages, delta/direction/polarity) — see `analytics-computation-service`
- Aggregate behavior methods (single-aggregate logic) — see `domain-patterns`
- EF Core persistence config for domain result records — see `persistence-patterns`
- API endpoint creation — see `create-feature`
