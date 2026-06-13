# nexus-dotnet skill estate — gap/adoption proposals

**Date:** 2026-06-12 · **Author:** Developer (adhoc-DotnetSkillSweep, Step 6) · **Status:** proposals — none implemented this pass (convergent scope: the sweep improved the existing 26 skills; capability gaps land here for a future pass).
**Sources:** `docs/specs/adhoc-DotnetSkillSweep/delivery/research-external.md` §3 (gap table) + §4 (form findings), and the 26 `docs/skill-evals/2026-06-12-*.md` docs. Every entry below cites its source.
**Decision owner:** each proposal is a future-pass candidate; the owner triages priority and sequence. Nothing here is a commitment.

## Context

The external sweep compared our 26 in-scope skills against 6 credible community .NET Claude-Code packages (research-external.md §1). The finding: **overlap concentrates on the pattern-reference family** (persistence, DI, error-handling, CPM, gRPC, DDD), where externals are strong; our **scaffolder family** (create-*, extract-*, module/service) and **specialized skills** (analytics, framework-currency, improve-architecture) are largely **unmatched externally** (research-external.md §2). So the gaps are not in what we scaffold — they are **adjacent capabilities** credible externals cover that our estate omits entirely, headed (as the plan predicted) by **.NET testing skills**: we ship zero, and the core `tdd` skill is process-only.

Proposals are grouped: **capability gaps** (new skills, §3 of research) and **form/convention adoptions** (cross-cutting improvements to the estate, §4 of research — the ones NOT already applied this pass).

---

## Part A — Capability gaps (candidate new skills)

Each row of research-external.md §3, converted to a proposal: capability, best external source, what adoption would look like (new skill vs extension), priority, and a proposed slug for a future pass.

### A1 — .NET testing skills (the headline gap) — **HIGH**

**Gap:** zero test skills in the estate; core `tdd` is process-only (no .NET test patterns). (research-external.md §3 row 1; Step-2 finding class "missing capability" — the predicted head of the gap list, plan Context line 19.)
**Best external source:** Aaronontheweb `testcontainers` + `snapshot-testing`; codewithmukesh `testing`; nesbo `bdd-dotnet`. Consensus external stack: **xUnit + WebApplicationFactory (integration) + Testcontainers (real DB)**.
**Adoption shape:** likely **two or three new skills**, not one — they cover distinct loops:
  - `dotnet-unit-testing` — xUnit conventions, the domain-service purity payoff (our `domain-service` skill already advertises "DB-free and unit-testable by default" — a unit-test skill is its natural completion), VO/aggregate test patterns.
  - `dotnet-integration-testing` — `WebApplicationFactory` + Testcontainers, the **save → reload → assert positive-write** check that `persistence-patterns` already mandates but no skill operationalizes (2026-06-12-persistence-patterns.md: the Mapster no-op-write section explicitly calls for a save/reload assertion).
  - (optional) `dotnet-test-data-builders` — fixture/builder patterns.
**Proposed slug(s):** `dotnet-unit-testing`, `dotnet-integration-testing`.
**Why HIGH:** it is the one gap that touches every other skill (every scaffolded feature/aggregate/domain-service is currently shipped test-less), the consensus stack is settled, and two of our existing skills (`domain-service`, `persistence-patterns`) already point at the missing test as their verification step.

### A2 — Outbox / saga messaging patterns — **MEDIUM**

**Gap:** `add-integration-event` scaffolds publish/consume but not transactional-outbox or saga lifecycle. (research-external.md §3 row 2 + §2 add-integration-event row: "outbox/saga are gap candidates".)
**Best external source:** codewithmukesh `messaging` (outbox, saga, choreography; trigger keywords include `"outbox"`,`"saga"`).
**Adoption shape:** **extension of `add-integration-event`** (a new workflow file for the outbox variant) OR a sibling `add-outbox-saga` skill if the saga lifecycle proves too large for a workflow file. Decide at design time.
**Proposed slug:** `add-outbox-saga` (or `add-integration-event/workflows/Outbox.md`).

### A3 — Resilience patterns (Polly / retry / circuit-breaker) — **MEDIUM**

**Gap:** no resilience skill. (research-external.md §3 row 3.)
**Best external source:** codewithmukesh `resilience`; Aaronontheweb `aspire-service-defaults`.
**Adoption shape:** **new skill** — Polly v8 resilience pipelines, `HttpClient` standard handlers, retry/circuit-breaker/timeout policies. Relevant to a microservices estate making gRPC + HTTP calls (couples to `create-grpc-contract` clients and `service-registration`'s external HTTP clients).
**Proposed slug:** `resilience-patterns`.

### A4 — Caching patterns — **MEDIUM**

**Gap:** no caching skill. (research-external.md §3 row 4.)
**Best external source:** codewithmukesh `caching`.
**Adoption shape:** **new skill** — `IMemoryCache` / `HybridCache` (.NET 9+) / distributed cache, cache-aside, invalidation. Note: `persistence-patterns` already documents an in-memory `ApplicationDbContext` cache helper — a caching skill should fence against that (entity-data cache vs response cache).
**Proposed slug:** `caching-patterns`.

### A5 — Observability (OpenTelemetry / structured logging) — **MEDIUM**

**Gap:** no observability skill. (research-external.md §3 row 5.)
**Best external source:** codewithmukesh `opentelemetry` / `serilog`; Aaronontheweb OpenTelemetry instrumentation.
**Adoption shape:** **new skill** — OpenTelemetry traces/metrics/logs, structured logging conventions, the modular-monolith correlation story. Relevant to the Services + ApiGateway topology.
**Proposed slug:** `observability-patterns`.

### A6 — Database performance (N+1, AsNoTracking depth) — **LOW-MEDIUM**

**Gap:** partially inside `persistence-patterns`; no dedicated depth. (research-external.md §3 row 6.)
**Best external source:** Aaronontheweb `database-performance`.
**Adoption shape:** **deepen or split `persistence-patterns`** — N+1 detection, `AsNoTracking`/`AsSplitQuery` decision rules, compiled queries, projection-over-materialization. A split only if `persistence-patterns` grows too large; otherwise a new section.
**Proposed slug:** (extension of `persistence-patterns`, or `ef-core-performance`).

### A7 — API versioning — **LOW**

**Gap:** no dedicated versioning skill. (research-external.md §3 row 7.)
**Best external source:** codewithmukesh `api-versioning`; Aaronontheweb `csharp-api-design`.
**Adoption shape:** **new skill** if versioning becomes a real need (multiple API consumers); otherwise defer.
**Proposed slug:** `api-versioning`.

### A8 — AOT / serialization source-gen — **LOW**

**Gap:** niche; relevant only if AOT becomes a target. (research-external.md §3 row 8.)
**Best external source:** Aaronontheweb `serialization`.
**Adoption shape:** **new skill**, deferred until AOT is on the roadmap.
**Proposed slug:** `aot-serialization`.

### A9 — C# LLM-slop / anti-pattern detection — **LOW**

**Gap:** overlaps our `improve-architecture` aim; no C#-specific slop detector. (research-external.md §3 row 9.)
**Best external source:** Aaronontheweb `slopwatch`; codewithmukesh `de-sloppify`.
**Adoption shape:** could **inform `improve-architecture`** (a C#-specific anti-pattern checklist) rather than a new skill — the core `boy-scout` + `improve-architecture` already own cleanup. Low priority; evaluate as an extension.
**Proposed slug:** (extension of `improve-architecture`).

---

## Part B — Form / convention adoptions not applied this pass

The sweep applied the form findings that fit a convergent pass (F1 description standard → §2.C; F6 time-sensitive banners → removed in the rewrites; F9 per-skill CHANGELOGs → dropped §2.A; F10 invocation flags → §2.D; F4 `workflows/` convention → kept §2.B). The remaining §4 findings are deferred here because they touch many skills or are net-additive:

### B1 — ToC for monolithic reference bodies (F5) — **LOW-MEDIUM**

**Finding:** Anthropic best-practices recommend a table of contents for any body/reference file > 100 lines; our monolithic Batch-B skills (e.g. `persistence-patterns` ~205 lines, `service-registration` ~240) have none. (research-external.md §4 F5.)
**Adoption shape:** add a short ToC to the monolithic pattern skills. **Not done this pass** — it is net-additive (grows the file), which the consolidating constraint discourages without a clear legibility payoff per skill; better as a deliberate legibility pass.
**Why deferred:** low risk but additive; belongs in a pass that can measure the read-time win, not a genericization sweep.

### B2 — `DO NOT USE FOR:` negative-trigger clauses (F8) — **LOW-MEDIUM**

**Finding:** managedcode's `grpc` skill sharpens its trigger with an explicit `DO NOT USE FOR:` boundary (SignalR hubs, plain REST…). None of ours state negative triggers. (research-external.md §4 F8.)
**Adoption shape:** add negative-trigger clauses to skills with confusable siblings. **Partially pre-empted this pass** by the prose adjacency fences added between `add-integration-event` ↔ `create-grpc-contract` ↔ `create-domain-event-handler` and `add-pipeline-behavior` ↔ `cqrs-patterns` (Step 4 — body-level scope fences). A future pass could promote those into structured `DO NOT USE FOR:` description clauses for auto-invocation precision.
**Why deferred:** the body fences capture the disambiguation now; formalizing them into the description (auto-invocation surface) is a separate, estate-wide trigger-engineering decision.

### B3 — Gerund-form skill names (F3) — **explicitly OUT (recorded, not proposed)**

**Finding:** Anthropic prefers gerund names (`processing-pdfs`); ours are imperative/noun (`create-feature`, `domain-patterns`), which the same doc lists as "acceptable alternatives." (research-external.md §4 F3.)
**Decision:** **not a candidate.** Skill `name:` is the consumer-facing invocation contract — renames are breaking and were excluded from this convergent pass (plan Scope). Recorded as a known divergence from Anthropic's *preferred* form; no action proposed unless a future major version deliberately re-keys the estate.

---

## Honesty notes

- Every Part-A capability traces to a specific research-external.md §3 row and, where an existing skill already points at the gap (A1, A6), the relevant skill-eval doc.
- **Nothing in this proposal was implemented this pass.** The sweep's scope was convergent (improve the 26 existing skills); these are future-pass candidates only (plan Step 6 accept: "no entry was implemented this pass").
- Priorities are the research's (§3) carried forward; the owner re-triages at adoption time.
- No official Microsoft/.NET-team/Anthropic .NET skill package exists to adopt from (research-external.md §1) — every external source above is community-maintained; vet currency before adopting.
