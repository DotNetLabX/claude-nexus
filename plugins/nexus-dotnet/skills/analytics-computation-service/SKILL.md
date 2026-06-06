---
name: analytics-computation-service
description: Creates a Domain-layer analytics calculator — delta/direction/polarity helpers, multi-period iteration, sparkline builders, rolling average. Specialization of domain-service for time-series metrics. Use when adding a new analytics tab or metric endpoint.
user-invocable: true
---

# Analytics Computation Service

**Specialization of `domain-service` for time-series analytics.** This skill adds analytics-specific helpers (sparklines, delta/direction/polarity, rolling averages, multi/single-period split) on top of the base `domain-service` rules. Read `domain-service` first — all its rules apply here.

> **Accepted but not proven until Passes 2/3 consume it.** This skill encodes ADR-005, ADR-006, and ADR-010; it will be validated when applied in Pass 2/3.

## Governing ADRs

- **ADR-005** — Analytics computation lives in the Domain layer; calculators/analyzers return domain types, never API response DTOs.
- **ADR-006** — No external/integration/response DTOs enter the Domain as inputs.
- **ADR-010** — Endpoint always owns its own response contract and maps domain → DTO (Mapster is the chosen mapper per ADR-010/CLAUDE.md).

## When to Use

When a plan step creates a new analytics metric calculator (e.g., `BugRatioScorer`, `CycleTimeAnalyzer`, `WorkloadAnalyzer`) or extends an existing one with a new computation area.

## Location

Analytics calculators live in the **Domain layer**, not the API layer:

```
{Module}.Domain/
  Analytics/
    {Name}Analyzer.cs      ← calculator (this skill)
    {Name}Result.cs        ← domain result record(s) (if large enough to split)
```

> **Target-state example (created by Pass 2/3):** `Fokus.Domain/Analytics/SprintSummaryCalculator.cs`
>
> **Current before-state:** Analytics computation currently lives in `Fokus.API/Features/Analytics/SprintSummaryService.cs` — an API-layer service that violates ADR-005. Pass 2/3 migrates it to the Domain layer.

**Not** `{Module}.API/Features/Analytics/` — that was the pre-ADR-005 location. Analytics services found in the API layer are candidates for migration to the Domain layer.

## Naming

Follow the `domain-service` no-suffix rule — **never use a `Service` suffix on a domain calculator**. Name by what the class computes:

| Good (use these) |
|------------------|
| `CycleTimeAnalyzer` |
| `BugRatioScorer` |
| `WorkloadAnalyzer` |
| `SprintSummaryCalculator` |
| `VelocityProjector` |

Bad names — `CycleTimeService`, `BugRatioService`, `WorkloadService`, `SprintSummaryDomainService` — all violate the no-`Service`-suffix prohibition on domain-layer classes.

## Reference Shape

A typical analytics feature area has one calculator per metric group:

| Calculator (example) | What it shows |
|----------------------|---------------|
| `{Module}.Domain/Analytics/RatioAnalyzer.cs` | Multi/single split, delta helpers, alert/threshold evaluation |
| `{Module}.Domain/Analytics/WorkloadAnalyzer.cs` | Delta + direction + polarity triplet per column |
| `{Module}.Domain/Analytics/MetricsAnalyzer.cs` | Sparkline builders, metric-card pattern |
| `{Module}.Domain/Analytics/TimelineAnalyzer.cs` | Per-day computation, static helper extraction |
| `{Module}.Domain/Analytics/ProgressAnalyzer.cs` | Gap delta, stall detection, direction derivation |

## Calculator Structure

1. **Domain result records** — the types the calculator returns, using `sealed record`. These are **domain types**, not API response DTOs. Named `{Metric}Result`, `{Metric}PeriodResult`, etc.
2. **Calculator class** — primary constructor with domain dependencies (only pre-loaded domain objects or the narrow read-port escape hatch — see `domain-service`).
3. **Public method(s)** — typically `ComputeMultiPeriod` and/or `ComputeSinglePeriod`.
4. **Private helpers** — decomposed computation: `BuildMetricCards`, `BuildSparkline`, `ComputeDelta`, etc.

```csharp
// SparklinePoint — define as a domain-layer sealed record in {Module}.Domain/Analytics/
// alongside the calculator. This is a project-specific type, not from BuildingBlocks.
// Target-state example (created by Pass 2/3):
public sealed record SparklinePoint(int PeriodId, decimal Value);

// Domain result record — lives in Domain, not API
public sealed record BugRatioResult(
    decimal Current,
    decimal? Prior,
    decimal? Delta,
    string? Direction,
    string? Polarity,
    SparklinePoint[] Sparkline);

// Calculator — Domain layer
// HealthThresholdConfig is a live domain VO (Fokus.Domain/Settings/ValueObjects/)
public class BugRatioScorer
{
    public BugRatioResult Score(
        IReadOnlyList<Sprint> closedSprints,
        HealthThresholdConfig thresholds,
        int windowSize)
    {
        // pure computation
    }
}
```

The **endpoint** defines its own `{Action}Response` and maps via Mapster — even when the shapes are identical (ADR-010):

```csharp
// Target-state endpoint (Mapster — the project's chosen mapper per ADR-010/CLAUDE.md;
// Mapster package not yet in CPM, added in Pass 2/3 — snippet won't build until then)
var result = _scorer.Score(sprints, settings.HealthThresholds, windowSize);  // domain type
await Send.OkAsync(result.Adapt<BugRatioResponse>(), ct); // endpoint maps to its own response
```

## Key Patterns

### Delta / Direction / Polarity Triplet

Each numeric column that shows change has three fields on the domain result:

- `{Column}Delta` (`decimal?`) — difference from the prior period (null if no prior)
- `{Column}Direction` (`string?`) — `"up"`, `"down"`, `"flat"`, or null
- `{Column}Polarity` (`string?`) — `"positive"`, `"negative"`, `"neutral"`, or null (depends on whether higher is better for that column)

Direction is derived from the delta sign. Polarity is derived from direction + column semantics (higher-is-better vs lower-is-better).

### Sparkline Builder

```
BuildSparkline(periods, windowSize, anchorIndex, valueSelector) -> SparklinePoint[]
```

Extracts a sliding window of values for a mini-chart. Each point has the period identifier and the metric value. Returns domain-typed `SparklinePoint` records — the endpoint maps these to its wire shape.

### Rolling Average

Iterates over prior periods (optionally qualifier-aware: skip periods that don't qualify, e.g. zero-activity periods), computes the average of a metric over a configurable look-back window. Use `TakeLast` **after** any exclusion guards — not before (ordering matters, or you return fewer entries than requested).

### Multi-Period vs Single-Period

- **Multi-period:** Accepts a list of target periods + the full closed-period history. Iterates targets, computes per-period metrics, returns a list of domain result records.
- **Single-period:** Accepts one period + the prior period (nullable). Computes current values + deltas against the prior. Returns a single domain result record.

### Optional Data-Source Fast Path

When a feature flag can disable an optional data source (e.g., an integration that some tenants don't enable), check the flag early. If disabled, return the base domain result with the optional fields nulled out — don't query the optional source at all.

## Endpoint Wiring

The endpoint pre-loads period data from repositories and calls the calculator. The calculator never touches repositories directly — it receives pre-loaded domain data.

**Escape hatch:** When pre-loading is genuinely impractical for performance reasons, use the **narrow domain-owned read port** described in `domain-service` — an interface declared in `{Module}.Domain`, returning domain types only, implemented in Persistence. This is the *only* acceptable form of direct data access from a domain service. Direct repository injection (`IRepository<T>`, `RepositoryBase<T>`) and `IQueryable<T>` are forbidden.

## Input Boundary (ADR-006)

Calculator parameters must be domain types, value objects, or intrinsic computation primitives (window size, look-back count, anchor index). External/integration/response DTOs (`JiraSprintResponse`, `XrayTestRunDto`, `*Response` records) are forbidden as inputs. Map them at the API/Persistence boundary before they reach the calculator.

## DI Registration

Register the calculator as scoped in the owning module's API `DependencyInjection.cs`:

```csharp
// {Module}.API/DependencyInjection.cs
services.AddScoped<BugRatioScorer>();
services.AddScoped<SprintSummaryCalculator>();
```

See `service-registration` for layer structure. See `domain-service` for the read-port interface registration in Persistence.

## Relationship to Other Skills

| Skill | Relationship |
|-------|-------------|
| `domain-service` | **Base skill** — this is a specialization of it; all `domain-service` rules apply |
| `domain-patterns` | Domain types (aggregates, VOs) that calculators consume and return |
| `persistence-patterns` | Read-port escape-hatch implementation |
| `create-feature` | Endpoint creation that calls the calculator |

## What This Skill Does NOT Cover

- Frontend types, API functions, store wiring — see `create-vue-feature`
- Endpoint class creation — see `create-feature`
- Repository query methods — describe in the plan step inline
- Domain model changes — see `domain-patterns`
- General domain service rules (location, naming, purity, DI) — see `domain-service`
