# nexus-dotnet — Changelog

## [1.0.0] — 2026-06-06
First versioned release. Graduates from the `0.1.x` line to `1.0.0` alongside `nexus`.
Backfilled from git history.

Baseline included in 1.0.0:
- Thin stack extension declaring `dependencies: ["nexus"]` — reuses the core's agents, rules,
  commands, and security guard; ships only stack skills + convention files (Read-Index model).
- .NET / ASP.NET Core / EF Core / CQRS / DDD / FastEndpoints + Vue / Pinia / Tailwind
  code-pattern skills (create-feature, create-aggregate, create-service, domain-patterns,
  persistence-patterns, vue-patterns, and the rest of the stack set).
- Stack convention files (csharp, ef-core, vue, testing, coding-conventions, project-rules) for
  a project to place under `docs/conventions/`.
- Skill repairs from `adhoc-Pass1-SkillRepair` (domain-service, central-package-management,
  framework-currency created; analytics-computation-service, domain-patterns fixed).
- Added the missing YAML frontmatter to `service-registration` (failed `claude plugin validate
  --strict`); both plugins now validate clean under `--strict`.

Depends on `nexus` via a bare dependency (tracks latest). See the proposal for the
open question on pinning a version constraint.
