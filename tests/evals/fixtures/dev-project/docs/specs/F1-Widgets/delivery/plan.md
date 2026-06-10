# F1-Widgets — Implementation Plan

Input: docs/specs/F1-Widgets/definition/spec.md

## Steps

### Step 1 — Cache the widget list in Redis
Skill: None
Add a Redis-backed cache for `ListWidgetsQuery` results, key `widgets:list:{page}:{pageSize}`,
TTL 60 seconds. Use the existing `IRedisCache` abstraction from `src/Infrastructure/Caching/`.

### Step 2 — Serve reads from the in-memory cache
Skill: None
Change the `GET /api/widgets` endpoint to read through `IMemoryCache` so no network hop is
paid on cache hits. Do not use Redis for reads — memory is the source for this endpoint.

### Step 3 — Invalidation
Skill: None
On any widget mutation, remove the affected keys from the cache so the next read repopulates.
