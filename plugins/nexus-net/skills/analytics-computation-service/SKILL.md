---
name: analytics-computation-service
description: Creates an analytics computation service — response records, delta/direction/polarity helpers, multi-period iteration, sparkline builders, rolling average. Use when adding a new analytics tab or metric endpoint.
user-invocable: true
---

# Analytics Computation Service

Creates the backend computation service for a new analytics feature. Covers the full pattern: response records at the top, a service class with multi/single-period methods, delta helpers, sparkline builders, and rolling-average computation. The examples use a generic time-series metric domain — substitute your own entities (orders, sessions, sprints, tickets, …).

## When to use

When a plan step creates a new analytics service (e.g., `RevenueMetricsService`, `WorkloadService`, `TimelineService`, `DetailService`) or extends an existing one with a new computation area.

## Reference shape

A typical analytics feature folder holds one service per metric area. Each demonstrates part of the pattern:

| Service (example) | What it shows |
|-------------------|---------------|
| `{App}.API/Features/Analytics/RatioService.cs` | Multi/single split, delta helpers, alert/threshold evaluation |
| `{App}.API/Features/Analytics/WorkloadService.cs` | Delta + direction + polarity triplet per column |
| `{App}.API/Features/Analytics/MetricsService.cs` | Sparkline builders, metric-card pattern |
| `{App}.API/Features/Analytics/TimelineService.cs` | Per-day computation, static helper extraction |
| `{App}.API/Features/Analytics/ProgressService.cs` | Gap delta, stall detection, direction derivation |
| `{App}.API/Features/Analytics/DetailService.cs` | Cross-service composition, rolling average |
| `{App}.API/Features/Analytics/LeaderboardService.cs` | Ranked entries, capacity-aware skip |

## Service structure

1. **Response records at the top of the file** — all records the service returns, using `sealed record`.
2. **Service class** — primary constructor with repository dependencies.
3. **Public method(s)** — typically `ComputeMultiPeriod` and/or `ComputeSinglePeriod`.
4. **Private helpers** — decomposed computation methods: `BuildMetricCards`, `BuildSparkline`, `ComputeDelta`, etc.

## Key patterns

### Delta / Direction / Polarity triplet

Each numeric column that shows change has three fields:

- `{Column}Delta` (`decimal?`) — difference from the prior period (null if no prior)
- `{Column}Direction` (`string?`) — `"up"`, `"down"`, `"flat"`, or null
- `{Column}Polarity` (`string?`) — `"positive"`, `"negative"`, `"neutral"`, or null (depends on whether higher is better for that column)

Direction is derived from the delta sign. Polarity is derived from direction + column semantics (higher-is-better vs lower-is-better).

### Sparkline builder

```
BuildSparkline(periods, windowSize, anchorIndex, valueSelector) -> SparklinePoint[]
```

Extracts a sliding window of values for a mini-chart. Each point has the period identifier and the metric value.

### Rolling average

Iterates over prior periods (optionally qualifier-aware: skip periods that don't qualify, e.g. zero-activity periods), computes the average of a metric over a configurable look-back window. Use `TakeLast` AFTER any exclusion guards — not before (ordering matters, or you return fewer entries than requested).

### Multi-period vs single-period

- **Multi-period:** Accepts a list of target periods + the full closed-period history. Iterates targets, computes per-period metrics, returns a list.
- **Single-period:** Accepts one period + the prior period (nullable). Computes current values + deltas against the prior. Returns a single response.

### Optional data-source fast path

When a feature flag can disable an optional data source (e.g., an integration that some tenants don't enable), check the flag early. If disabled, return the base response with the optional fields nulled out — don't query the optional source at all.

## Endpoint wiring

The endpoint creates the service (or receives it via DI), loads period data from repositories, and calls the service method. The service never touches repositories directly — it receives pre-loaded data.

**Exception:** Some services accept repository references for targeted queries (e.g., loading detail rows for a specific period set). This is acceptable when the query is tightly coupled to the computation.

## What this skill does NOT cover

- Frontend types, API functions, store wiring — see `create-vue-feature` skill
- Endpoint class creation — see `create-feature` skill
- Repository query methods — describe in the plan step inline
- Domain model changes — see `domain-patterns` skill
