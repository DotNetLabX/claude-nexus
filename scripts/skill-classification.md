# Skill classification — core / dotnet / drop

Source: `D:\src\fokus\.claude\skills\` (39 skills) + `docs/conventions/kb-entry-schema.md` (→ new core skill).
Decided 2026-05-31. Split: **9 core · 29 dotnet · 2 drop** (39 = 8 core-from-source + 29 dotnet + 2 drop; kb-entry-schema is new, not from the 39).

## CORE (nexus) — 9 skills ✅ DONE

| Skill | Source | Notes |
|-------|--------|-------|
| create-implementation-plan | ported as-is | architect frontmatter |
| create-architecture-doc | ported as-is | architect frontmatter |
| create-feature-spec | ported as-is | po frontmatter |
| improve-flow | ported as-is | learner frontmatter |
| improve-skills | ported as-is | learner frontmatter |
| diagnose | ported as-is | debugging protocol |
| boy-scout | de-leaked | usings→imports, LINQ→chained expr, coding-conventions path softened |
| tdd | de-leaked | EF config / WebApplicationFactory → infra wiring / in-process harness |
| kb-entry-schema | NEW (was docs/conventions/kb-entry-schema.md) | kb-maintenance rule repointed to it |

## DOTNET (nexus-net) — 29 skills (TODO)

Stack code-pattern skills — port wholesale into dotnet:

add-pipeline-behavior, add-integration-event, create-aggregate, create-building-blocks-package,
create-domain-event-handler, create-feature, create-grpc-contract, create-module,
create-module-claude-md, create-service, create-service-claude-md, create-vue-feature,
analytics-computation-service, authorization-patterns, cqrs-patterns, domain-patterns,
error-handling, extract-endpoint-types, extract-feature-service, frontend-review,
persistence-patterns, pinia-patterns, redis-patterns, service-registration, tailwind-theme,
vue-component-architecture, vue-patterns

**Moved here from core-candidates (DDD/.NET-coupled):**
- **system-design** — body is FastEndpoints/MediatR/EF/gRPC axis tables. dotnet architect frontmatter. (Removed from core architect.)
- **improve-architecture** — DDD/CQRS-opinionated (anemic aggregates, vertical slices, HandleAsync, pipeline behaviors, entity-wrapper guardrail, Sprint/Ticket examples). User decision 2026-05-31: move to dotnet.

When porting these two, de-fokus the examples (Sprint/Ticket → generic) and keep the .NET specifics (that's the point of the dotnet plugin).

## DROP — 2

- export-cc-setup, import-cc-setup — the plugin distribution supersedes the export/import kit.
