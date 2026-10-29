# nexus-dotnet — Changelog


## [2.1.2] — 2026-10-29
- PATCH bump.
  - skill change (central-package-management)
  - skill change (diagnose-dotnet)
  - skill change (framework-currency)
  - estate raise: plugins/nexus-dotnet/skills/central-package-management/SKILL.md 6623→6628 B — adhoc-TddStepRunFix: skills point at the step test rule
  - estate raise: plugins/nexus-dotnet/skills/diagnose-dotnet/SKILL.md 3393→3511 B — adhoc-TddStepRunFix: skills point at the step test rule
  - estate raise: plugins/nexus-dotnet/skills/framework-currency/SKILL.md 7686→7820 B — adhoc-TddStepRunFix: skills point at the step test rule

## [2.1.1] — 2026-10-28
- F310-StepTestCap: the skills carry no build or test command of their own — each verify line points to the core's `developer.md` § The step test rule; the front end's type-check and build are the complete run's. The .NET runner, in a developer's step run, selects each test class by its full name (nested and generic classes included), splits an oversized filter into batches under the run's deadline, reads failed tests from its own report, and records a run that ran no test as `no test ran`, never a green.
  - plugin payload (conventions/coding-conventions.md)
  - hook behavior/enforcement change
  - skill change (add-conventions-check)
  - skill change (add-hosted-service)
  - skill change (add-integration-event)
  - skill change (add-typed-client)
  - skill change (central-package-management)
  - skill change (create-aggregate)
  - skill change (create-building-blocks-package)
  - skill change (create-domain-event-handler)
  - skill change (create-feature)
  - skill change (create-grpc-contract)
  - skill change (create-host)
  - skill change (create-module)
  - skill change (create-service)
  - skill change (create-vue-feature)
  - skill change (diagnose-dotnet)
  - skill change (extract-endpoint-types)


## [2.1.0] — 2026-10-28
- F312: the persistence skill follows the reference project — no read stores (every C# query is an EF Core read in a repository, the repository is the unit of work); the reference's repository base with a no-tracking read and no throwing members (callers add .OrThrowNotFound(id)); a row two writers race on takes EF Core's version check (SQL Server rowversion or PostgreSQL xmin) with one retry and a 409 conflict error; small tables through a cached repository, warmed at start-up where synchronous code reads them; enums as text or a table of their own; and every skill's look-first rule now says an ordinary class derives from the base the repo's libraries offer.
  - plugin payload (conventions/coding-conventions.md)
  - plugin payload (conventions/csharp.md)
  - plugin payload (conventions/ef-core.md)
  - skill change (add-hosted-service)
  - skill change (add-integration-event)
  - skill change (add-pipeline-behavior)
  - skill change (add-state-machine)
  - skill change (add-typed-client)
  - skill change (authorization-patterns)
  - skill change (central-package-management)
  - skill change (consumer-patterns)
  - skill change (cqrs-patterns)
  - skill change (create-aggregate)
  - skill change (create-building-blocks-package)
  - skill change (create-domain-event-handler)
  - skill change (create-feature)
  - skill change (create-grpc-contract)
  - skill change (create-host)
  - skill change (create-module)
  - skill change (create-service)
  - skill change (domain-patterns)
  - skill change (domain-service)
  - skill change (error-handling)
  - skill change (file-storage-patterns)
  - skill change (framework-currency)
  - skill change (persistence-patterns)
  - skill change (redis-patterns)
  - skill change (service-infra-conventions)
  - skill change (service-registration)
  - owner-escalated to minor
  - estate raise: plugins/nexus-dotnet/skills/add-hosted-service/SKILL.md 7809→8302 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/add-integration-event/SKILL.md 3984→4263 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/add-integration-event/workflows/Publisher.md 3134→3374 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/add-pipeline-behavior/SKILL.md 6137→6416 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/add-state-machine/SKILL.md 10150→10931 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/add-typed-client/SKILL.md 8731→9010 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/authorization-patterns/SKILL.md 16553→17008 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/central-package-management/SKILL.md 6324→6603 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/consumer-patterns/SKILL.md 5839→6331 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/consumer-patterns/references/projection-consumer.md 2779→3549 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/consumer-patterns/references/write-side-consumer.md 3864→4430 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/cqrs-patterns/SKILL.md 4212→4829 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-aggregate/SKILL.md 7613→7892 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-aggregate/workflows/AggregateEfCore.md 3477→4079 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-building-blocks-package/SKILL.md 5389→5668 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-domain-event-handler/SKILL.md 7967→8568 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-feature/SKILL.md 15358→15745 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-feature/workflows/EndpointCarter.md 2718→2727 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-feature/workflows/EndpointFastEndpoints.md 4165→4318 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-feature/workflows/EndpointMinimalApi.md 2765→2774 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-feature/workflows/Handler.md 3277→3446 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-grpc-contract/SKILL.md 4891→5400 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-grpc-contract/workflows/Server.md 2029→2361 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-host/SKILL.md 17910→18189 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-module/SKILL.md 7278→7557 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/create-service/SKILL.md 9316→9595 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/domain-patterns/SKILL.md 9053→9498 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/domain-service/SKILL.md 7292→7751 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/error-handling/SKILL.md 11441→12243 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/file-storage-patterns/SKILL.md 7448→7727 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/file-storage-patterns/references/templates.md 6498→6526 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/framework-currency/SKILL.md 7678→7686 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/persistence-patterns/SKILL.md 20652→26536 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/redis-patterns/SKILL.md 7464→7743 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/service-infra-conventions/SKILL.md 19601→19880 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)
  - estate raise: plugins/nexus-dotnet/skills/service-registration/SKILL.md 13386→13744 B — F312-PersistenceLikeReference: the look-first base-class sentence in 25 .NET skills; the persistence skill and its samples follow the reference (no read stores, repository reads, version check, cached repository, two enum forms)

## [2.0.14] — 2026-10-27
- Narrows 2.0.13 (owner): only a Component module's implementation classes are `internal`, its test project its
  friend (the scaffold names it); services and Domain modules are public throughout again, the layer tests guarding
  references.
- PATCH bump.
  - plugin payload (conventions/csharp.md)
  - skill change (create-building-blocks-package)
  - skill change (create-module)
  - estate raise: plugins/nexus-dotnet/skills/create-module/SKILL.md 7256→7278 B — adhoc-ContractsOnlyForImplementations: internal implementations for Component modules only (owner, 2026-10-27)
  - estate raise: plugins/nexus-dotnet/skills/create-module/workflows/ScaffoldComponent.md 4107→4187 B — adhoc-ContractsOnlyForImplementations: internal implementations for Component modules only (owner, 2026-10-27)

## [2.0.13] — 2026-10-27
- A module shows only its contract: the types its callers use are public, everything else `internal`, so no caller
  reaches its internals; its own projects and its test project may be its friends. A service stays public
  throughout. The Component scaffold's implementation class is `internal` (knowledge-gateway feedback, owner).
- PATCH bump.
  - plugin payload (conventions/csharp.md)
  - skill change (create-building-blocks-package)
  - skill change (create-module)
  - estate raise: plugins/nexus-dotnet/skills/create-building-blocks-package/SKILL.md 5380→5404 B — adhoc-ContractsOnlyForImplementations: a module shows only its contract, the rest internal (owner, 2026-10-27)
  - estate raise: plugins/nexus-dotnet/skills/create-module/SKILL.md 7182→7256 B — adhoc-ContractsOnlyForImplementations: a module shows only its contract, the rest internal (owner, 2026-10-27)
  - estate raise: plugins/nexus-dotnet/skills/create-module/workflows/ScaffoldComponent.md 4105→4107 B — adhoc-ContractsOnlyForImplementations: a module shows only its contract, the rest internal (owner, 2026-10-27)

## [2.0.12] — 2026-10-27
- A module gets a contracts project only for several implementations or a planned second, never for several
  consumers: a business module is referenced directly; a dependency split is named as the one other reason for a
  separate project; integration-event and gRPC contracts stay shared projects. The interface rule takes the same
  planned-second case, and the service scaffold and repo template stop giving every module a contracts project
  (knowledge-gateway feedback).
- PATCH bump.
  - plugin payload (conventions/coding-conventions.md)
  - plugin payload (conventions/csharp.md)
  - skill change (create-module-claude-md)
  - skill change (create-module)
  - skill change (create-service-claude-md)
  - skill change (create-service)
  - skill change (system-design)
  - plugin payload (templates/CLAUDE.md)
  - estate raise: plugins/nexus-dotnet/skills/create-module-claude-md/SKILL.md 4163→4584 B — adhoc-ContractsOnlyForImplementations: a contracts project only for several implementations (knowledge-gateway feedback)
  - estate raise: plugins/nexus-dotnet/skills/create-module/SKILL.md 6766→7182 B — adhoc-ContractsOnlyForImplementations: a contracts project only for several implementations (knowledge-gateway feedback)
  - estate raise: plugins/nexus-dotnet/skills/create-module/workflows/ScaffoldDomain.md 4048→4053 B — adhoc-ContractsOnlyForImplementations: a contracts project only for several implementations (knowledge-gateway feedback)
  - estate raise: plugins/nexus-dotnet/skills/create-service-claude-md/SKILL.md 3852→4236 B — adhoc-ContractsOnlyForImplementations: a contracts project only for several implementations (knowledge-gateway feedback)
  - estate raise: plugins/nexus-dotnet/skills/create-service/workflows/ScaffoldCsprojFiles.md 4463→4549 B — adhoc-ContractsOnlyForImplementations: a contracts project only for several implementations (knowledge-gateway feedback)
  - estate raise: plugins/nexus-dotnet/skills/system-design/SKILL.md 10711→11095 B — adhoc-ContractsOnlyForImplementations: a contracts project only for several implementations (knowledge-gateway feedback)

## [2.0.11] — 2026-10-26
- F292: every full run names each failed test and why, for .NET, vitest, Flutter and Node, even when cut; a .NET or Flutter timeout in a test the change did not touch no longer holds the close
  - hook behavior/enforcement change

## [2.0.10] — 2026-10-25
- PATCH bump.
  - F302-ReusableUnitKinds: the three kinds of reusable unit — a generic module (no business rules), a business module (rules and its own tables, living inside a service or a host) and a service (self-contained, could ship as a product) — told apart by whether the unit could stand alone, not by its endpoints; stated once in `conventions/coding-conventions.md` (§ Kinds of Reusable Unit) and copied into `system-design`, `create-service-claude-md` and `create-module-claude-md`, with pointers from `create-module`, `create-service` and `create-host`.
  - The data rule, once in `conventions/ef-core.md` (§ Data Ownership) and copied into `system-design` and `persistence-patterns`: every unit owns its tables and migration history; a module defaults to its own schema, a service to its own database, either may take the other; no foreign key, join or shared table crosses units. Replaces "never share a database" and "a service has no schema of its own".
  - skill change (create-service-claude-md, create-service): a self-running service stays the default; in a repo that already has a host the setup asks whether the service runs on its own or inside a host, and `create-service` builds the library form directly (`workflows/ScaffoldHostedApi.md`, the end state `create-host`'s conversion leaves); a SQL Server or PostgreSQL service may take its own schema in a shared database.
  - skill change (create-host): a host may run a service another host also runs, each with its own connection strings; its verify no longer fails on a self-running service elsewhere in the repo.
  - estate raise: 16 nexus-dotnet skill files, +18,049 B in all against 9bfb6c1a (`ScaffoldHostedApi.md` +5,427 B new, `system-design` +2,070 B, `create-service` +1,738 B) — F302.

## [2.0.9] — 2026-10-23
- PATCH bump.
  - F47-FlowAtlas: two flow-atlas profiles (need nexus-pro) — `flow-atlas-dotnet` (entry kinds: FastEndpoints, controllers, minimal APIs, MCP tools, hosted services, consumers, handlers, executables; the closed `reg:` binding vocabulary; `tools/extract-dotnet.mjs`) and `flow-atlas-vue` (route → view → store → API module; `tools/extract-vue.mjs` with the client-to-server join). Test code is left out by default. Both need the repo's `features.flowAtlas` switch on.

## [2.0.8] — 2026-10-23
- PATCH bump.
  - F291-DotnetTestSelection: the .NET test runner moves here (`hooks/scripts/test-runner.js`); ties follow project references transitively, build-wide files select every test project, an empty set falls back; builds are reused while nothing changed; the timing pass keeps to what `full` leaves out. Needs nexus 2.4.50.
  - skill change (create-module, create-service): one `{Name}.Tests` project per module or service, referencing only that unit; testing.md teaches it.
  - skill change (create-host, persistence-patterns) and coding-conventions.md: the unit's own test project is an allowed reference to its API project.
  - estate raise: create-module +1089 B, create-service +1048 B, create-host +62 B, persistence-patterns +93 B — F291.

## [2.0.7] — 2026-10-20
- F272-MinerRunSetup: the .NET mining adapter follows the repo's own test stack (its scaffold only where the repo has
  no test project; classic xUnit 2 on Stryker's default runner); the no-production-edit check covers every non-test
  project, not only Domain; the conventions file and an internal class's access grant are one-time setup steps; a
  one-file Stryker reach probe per target project, read by the new `tools/stryker-reach.mjs`; a `ConfigureAwait`
  survivor is an `equivalent-other` candidate only with a proof. Needs nexus-miner 0.1.7 for the kickoff fields.
  - estate raise: `mine-verify-cover-dotnet/SKILL.md` +4416 B.

## [2.0.6] — 2026-10-20
- PATCH bump.
  - plugin payload (conventions/csharp.md)
  - skill change (add-conventions-check)
  - skill change (central-package-management)
  - skill change (create-service)
  - plugin payload (templates/conventions-check/ConventionCheck.cs)
  - plugin payload (templates/conventions-check/ConventionChecks.g.cs)
  - plugin payload (templates/conventions-check/ConventionScanner.cs)
  - plugin payload (templates/conventions-check/ConventionsTests.cs)
  - plugin payload (templates/conventions-check/ProjectLists.cs)
  - plugin payload (templates/conventions-check/RepositoryScan.cs)
  - estate raise: plugins/nexus-dotnet/skills/add-conventions-check/SKILL.md 8335→8485 B — F275-ConventionRefinements: project-file comment rule (divider banners, multi-line packages) and the lists-file path in a list-backed failure
  - estate raise: plugins/nexus-dotnet/skills/central-package-management/SKILL.md 6295→6324 B — F275-ConventionRefinements: project-file comment rule (divider banners, multi-line packages) and the lists-file path in a list-backed failure
  - estate raise: plugins/nexus-dotnet/skills/create-service/SKILL.md 6492→6530 B — F275-ConventionRefinements: project-file comment rule (divider banners, multi-line packages) and the lists-file path in a list-backed failure
  - estate raise: plugins/nexus-dotnet/skills/create-service/workflows/ScaffoldCsprojFiles.md 4348→4463 B — F275-ConventionRefinements: project-file comment rule (divider banners, multi-line packages) and the lists-file path in a list-backed failure

## [2.0.5] — 2026-10-20
- F271-MinerQuickWins (`mine-verify-cover-dotnet`): the tool check probes Stryker with `--help`, so Stryker 4.16 (which rejects `--version`) is no longer reported missing; the test-project section states that Stryker mutates only projects the test project references directly, and that a green build is no evidence of reach.
  - estate raise: `mine-verify-cover-dotnet/SKILL.md` +324 B.

## [2.0.4] — 2026-10-19
- F270-DotnetConventionsOneHome — the conventions become the one home for a consuming repo's elected .NET rules:
  an argument error now answers 500 with a fixed sentence (it was 400); a required number or enum setting is
  nullable with `[Required]`; the JSON-name rule and its check cover endpoint request and reply files only; a
  project-file comment may stand directly above the setting or package it explains; the logging check names the
  logging list's path; `is null` carries its reason. No new exception. (Feedback
  `nexus-2026-10-18-campaign-questions-and-conventions` `#2`, `#3`.)
- PATCH bump.
  - plugin payload (conventions/csharp.md)
  - skill change (add-typed-client)
  - skill change (central-package-management)
  - skill change (error-handling)
  - skill change (service-infra-conventions)
  - plugin payload (templates/conventions-check/ConventionCheck.cs)
  - plugin payload (templates/conventions-check/ConventionChecks.g.cs)
  - plugin payload (templates/conventions-check/ConventionScanner.cs)
  - estate raise: plugins/nexus-dotnet/skills/add-typed-client/SKILL.md 8652→8731 B — F270-DotnetConventionsOneHome: elected .NET rules — argument errors answer 500, required value-type settings, JSON-name rule scoped to endpoint files, project-file comment rule, logging list path, is-null reason
  - estate raise: plugins/nexus-dotnet/skills/central-package-management/SKILL.md 6001→6295 B — F270-DotnetConventionsOneHome: elected .NET rules — argument errors answer 500, required value-type settings, JSON-name rule scoped to endpoint files, project-file comment rule, logging list path, is-null reason
  - estate raise: plugins/nexus-dotnet/skills/error-handling/SKILL.md 11164→11441 B — F270-DotnetConventionsOneHome: elected .NET rules — argument errors answer 500, required value-type settings, JSON-name rule scoped to endpoint files, project-file comment rule, logging list path, is-null reason
  - estate raise: plugins/nexus-dotnet/skills/service-infra-conventions/SKILL.md 19274→19601 B — F270-DotnetConventionsOneHome: elected .NET rules — argument errors answer 500, required value-type settings, JSON-name rule scoped to endpoint files, project-file comment rule, logging list path, is-null reason


## [2.0.3] — 2026-10-13
- PATCH bump.
  - plugin.json metadata change
  - plugin payload (conventions/coding-conventions.md)
  - plugin payload (conventions/ef-core.md)
  - skill change (add-integration-event)
  - skill change (authorization-patterns)
  - skill change (consumer-patterns)
  - skill change (create-aggregate)
  - skill change (create-domain-event-handler)
  - skill change (create-grpc-contract)
  - skill change (create-host)
  - skill change (create-module)
  - skill change (create-service)
  - skill change (persistence-patterns)
  - skill change (service-registration)
  - estate raise: plugins/nexus-dotnet/skills/add-integration-event/workflows/Consumer.md 1789→1950 B — F21: create-host skill and the hosted-case pointers
  - estate raise: plugins/nexus-dotnet/skills/authorization-patterns/SKILL.md 16395→16553 B — F21: create-host skill and the hosted-case pointers
  - estate raise: plugins/nexus-dotnet/skills/consumer-patterns/SKILL.md 5724→5839 B — F21: create-host skill and the hosted-case pointers
  - estate raise: plugins/nexus-dotnet/skills/create-aggregate/SKILL.md 7552→7613 B — F21: create-host skill and the hosted-case pointers
  - estate raise: plugins/nexus-dotnet/skills/create-domain-event-handler/SKILL.md 7654→7967 B — F21: fix round 1
  - estate raise: plugins/nexus-dotnet/skills/create-grpc-contract/workflows/Server.md 1891→2029 B — F21: create-host skill and the hosted-case pointers
  - estate raise: plugins/nexus-dotnet/skills/create-host/SKILL.md 0→17484 B — F21: fix round 1
  - estate raise: plugins/nexus-dotnet/skills/create-host/workflows/ComposeHost.md 0→3752 B — F21: fix round 1
  - estate raise: plugins/nexus-dotnet/skills/create-host/workflows/ConvertService.md 0→3930 B — F21: fix round 1
  - estate raise: plugins/nexus-dotnet/skills/create-service/SKILL.md 6291→6492 B — F21: fix round 1
  - estate raise: plugins/nexus-dotnet/skills/create-service/workflows/ScaffoldCsprojFiles.md 4301→4348 B — F21: create-host skill and the hosted-case pointers
  - estate raise: plugins/nexus-dotnet/skills/create-service/workflows/ScaffoldPersistenceProject.md 3479→3601 B — F21: create-host skill and the hosted-case pointers
  - estate raise: plugins/nexus-dotnet/skills/persistence-patterns/SKILL.md 19590→19695 B — F21: fix round 1
  - estate raise: plugins/nexus-dotnet/skills/service-registration/SKILL.md 12877→13386 B — F21: create-host skill and the hosted-case pointers

## [2.0.2] — 2026-10-11
- PATCH bump.
  - skill change (frontend-review)
  - estate raise: plugins/nexus-dotnet/skills/frontend-review/SKILL.md 4227→4419 B — F220-ReviewTestRuns: reviewers cite the run record; no rerun after a fix round

## [2.0.1] — 2026-10-11
- F219-DotnetSettingsAndCheck — PATCH, from knowledge-gateway's 2.0.0 feedback. In plain words, for a consuming repo:
  - **The conventions check can size the work before you adopt it:** a `report` setting writes totals per check
    (switched-off checks included), counts per project and every finding. A documentation comment now counts once,
    not once per line, and a test method no longer needs the `Async` ending. **Re-copy the template files.**
  - **The settings skill** teaches derived settings classes, unique names within one host, a section that is always
    required, and the markers that make nested values validate; the sample `GetRequiredOptions` now validates what it
    reads — **update a copied `OptionsExtensions`.**
  - **New skill `change-copied-library`:** what to do when a copied shared library does not fit, and the hand-over
    file that carries the fix back.
  Detail, by file:
  - plugin.json metadata change
  - plugin payload (conventions/csharp.md)
  - plugin payload (conventions/testing.md)
  - skill change (add-conventions-check)
  - skill change (create-building-blocks-package)
  - skill change (service-infra-conventions)
  - plugin payload (templates/conventions-check/ConventionChecks.g.cs)
  - plugin payload (templates/conventions-check/ConventionPattern.cs)
  - plugin payload (templates/conventions-check/ConventionScanner.cs)
  - plugin payload (templates/conventions-check/ConventionSettings.cs)
  - plugin payload (templates/conventions-check/RepositoryScan.cs)
  - skill change (change-copied-library)
  - plugin payload (templates/conventions-check/ConventionReport.cs)
  - estate raise: plugins/nexus-dotnet/skills/add-conventions-check/SKILL.md 6237→8335 B — F219 fix round 1: conventions-check skill (attribute list, re-copy remedy), settings skill sample and re-wrap
  - estate raise: plugins/nexus-dotnet/skills/change-copied-library/SKILL.md 0→3597 B — F219 fix round 1: conventions-check skill (attribute list, re-copy remedy), settings skill sample and re-wrap
  - estate raise: plugins/nexus-dotnet/skills/create-building-blocks-package/SKILL.md 5299→5380 B — F219 fix round 1: conventions-check skill (attribute list, re-copy remedy), settings skill sample and re-wrap
  - estate raise: plugins/nexus-dotnet/skills/service-infra-conventions/SKILL.md 15599→19274 B — F219 fix round 1: conventions-check skill (attribute list, re-copy remedy), settings skill sample and re-wrap

## [2.0.0] — 2026-10-09
- F195-DotnetSkillsFromReference — MAJOR. The skills now teach 113 settled .NET rules, and every code sample obeys
  the rules it teaches. In plain words, what changes for a consuming repo:
  - **No skill assumes a building-block library any more.** Each skill teaches its pattern with a self-contained
    sample; a repo lists its own helpers in `docs/conventions/project-lists.md`.
  - **Look first.** Before building something a skill relies on, an agent checks the repo's helper list, then the
    shared libraries, modules and packages it can reach, and only then builds it once in the shared place.
  - **Re-copy `conventions/`** after this update. `project-rules.md` is no longer shipped (its content moved into
    the other conventions files; a repo's own file of that name is kept). **Copy `templates/project-lists.md` once**
    and never again — it is the repo's own list.
  - **An optional check** a repo can turn on: `templates/conventions-check/` (an xUnit test project) holds the
    mechanical rules; the new `add-conventions-check` skill shows how to adopt it.
  - **Skills retired:** `extract-feature-service` (now `create-feature`'s shared base endpoint) and
    `analytics-computation-service` (its rule lives in `domain-service`). **Skills added:** `add-typed-client`,
    `add-hosted-service`, `add-conventions-check`.
  - Front-end skills no longer carry another project's names.
  Detail, by file:
  - plugin payload (conventions/coding-conventions.md)
  - plugin payload (conventions/csharp.md)
  - plugin payload (conventions/ef-core.md)
  - plugin payload (conventions/project-rules.md)
  - plugin payload (conventions/testing.md)
  - plugin payload (conventions/vue.md)
  - skill change (add-conventions-check)
  - skill change (add-hosted-service)
  - skill change (add-integration-event)
  - skill change (add-pipeline-behavior)
  - skill change (add-state-machine)
  - skill change (add-typed-client)
  - skill change (analytics-computation-service)
  - skill change (authorization-patterns)
  - skill change (central-package-management)
  - skill change (consumer-patterns)
  - skill change (cqrs-patterns)
  - skill change (create-aggregate)
  - skill change (create-building-blocks-package)
  - skill change (create-domain-event-handler)
  - skill change (create-feature)
  - skill change (create-grpc-contract)
  - skill change (create-module-claude-md)
  - skill change (create-module)
  - skill change (create-service-claude-md)
  - skill change (create-service)
  - skill change (create-vue-feature)
  - skill change (diagnose-dotnet)
  - skill change (domain-patterns)
  - skill change (domain-service)
  - skill change (error-handling)
  - skill change (extract-endpoint-types)
  - skill change (extract-feature-service)
  - skill change (file-storage-patterns)
  - skill change (framework-currency)
  - skill change (frontend-review)
  - skill change (improve-architecture)
  - skill change (mine-verify-cover-dotnet)
  - skill change (persistence-patterns)
  - skill change (pinia-patterns)
  - skill change (redis-patterns)
  - skill change (service-infra-conventions)
  - skill change (service-registration)
  - skill change (system-design)
  - skill change (tailwind-theme)
  - skill change (vue-component-architecture)
  - skill change (vue-patterns)
  - plugin payload (templates/CLAUDE.md)
  - plugin payload (templates/conventions-check/CSharpText.cs)
  - plugin payload (templates/conventions-check/ConventionCheck.cs)
  - plugin payload (templates/conventions-check/ConventionChecks.g.cs)
  - plugin payload (templates/conventions-check/ConventionHit.cs)
  - plugin payload (templates/conventions-check/ConventionPattern.cs)
  - plugin payload (templates/conventions-check/ConventionScanner.cs)
  - plugin payload (templates/conventions-check/ConventionSettings.cs)
  - plugin payload (templates/conventions-check/ConventionsTests.cs)
  - plugin payload (templates/conventions-check/ProjectLists.cs)
  - plugin payload (templates/conventions-check/RepositoryScan.cs)
  - plugin payload (templates/conventions-check/TopLevelTypeReader.cs)
  - plugin payload (templates/conventions-check/TypeDeclaration.cs)
  - plugin payload (templates/project-lists.md)
  - owner-set to major (--tier)
  - estate raise: plugins/nexus-dotnet/skills/add-conventions-check/SKILL.md 0→6237 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/add-hosted-service/SKILL.md 0→7809 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/add-integration-event/workflows/EventContract.md 1532→1742 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/add-integration-event/workflows/Publisher.md 2320→3134 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/add-pipeline-behavior/SKILL.md 2828→6137 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/add-typed-client/SKILL.md 0→8652 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-aggregate/SKILL.md 2801→7552 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-building-blocks-package/SKILL.md 2666→5299 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-feature/SKILL.md 7588→15358 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-feature/workflows/EndpointFastEndpoints.md 3435→4165 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-feature/workflows/EndpointMinimalApi.md 2721→2765 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-feature/workflows/Handler.md 2948→3277 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-grpc-contract/SKILL.md 4570→4891 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-grpc-contract/workflows/Client.md 1421→1530 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-grpc-contract/workflows/Contract.md 1636→2272 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-grpc-contract/workflows/Server.md 1672→1891 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-module-claude-md/SKILL.md 2480→2858 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-module-claude-md/workflows/CaptureDomainAxes.md 3432→3656 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-module/SKILL.md 3551→5471 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-service-claude-md/SKILL.md 2259→2596 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-service-claude-md/workflows/CaptureAxes.md 3767→4040 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/create-service-claude-md/workflows/WriteClaudeMd.md 3645→3785 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/error-handling/SKILL.md 4361→11164 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/extract-endpoint-types/SKILL.md 2723→3186 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/framework-currency/SKILL.md 6851→7678 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/frontend-review/SKILL.md 3853→4227 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/improve-architecture/SKILL.md 6983→7451 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/mine-verify-cover-dotnet/SKILL.md 10155→10668 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/persistence-patterns/SKILL.md 12255→19590 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/redis-patterns/SKILL.md 6408→7464 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/service-registration/SKILL.md 9883→12877 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/system-design/SKILL.md 8020→8641 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/tailwind-theme/SKILL.md 5147→5524 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/vue-component-architecture/SKILL.md 4352→4735 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2
  - estate raise: plugins/nexus-dotnet/skills/vue-patterns/references/recommended-packages.md 2207→2261 B — F195: .NET skills taught from the settled rules - look-first duty in the core, generated look-first blocks in 24 skills, three new skills, helper samples added in review fix rounds 1 and 2

## [1.9.3] — 2026-10-09
- PATCH bump.
  - skill change (mine-verify-cover-dotnet)
  - estate raise: plugins/nexus-dotnet/skills/mine-verify-cover-dotnet/SKILL.md 10149→10155 B — F167-DevProdRepoSplit: install addresses in published form; edition sync, tags and 'reaches users' re-timed to the owner's publish (ADR-119)

## [1.9.2] — 2026-09-22
- F90-MineFamilyExtension: the mine family moves out of core into the new paid plugin nexus-miner
  - skill change (diagnose-dotnet)
  - skill change (improve-architecture)
  - skill change (mine-verify-cover-dotnet)
  - estate raise: plugins/nexus-dotnet/skills/diagnose-dotnet/SKILL.md 3366→3388 B — F90-MineFamilyExtension: 14 skills move to nexus-miner; install pointers in five agents; locate-miner; adapter gate lines
  - estate raise: plugins/nexus-dotnet/skills/improve-architecture/SKILL.md 6967→6983 B — F90-MineFamilyExtension: 14 skills move to nexus-miner; install pointers in five agents; locate-miner; adapter gate lines
  - estate raise: plugins/nexus-dotnet/skills/mine-verify-cover-dotnet/SKILL.md 9907→10149 B — F90-MineFamilyExtension: 14 skills move to nexus-miner; install pointers in five agents; locate-miner; adapter gate lines

## [1.9.1] — 2026-08-30
- remove every company literal from shipped text and defaults (F84-PluginDeliteral); standing company-literal lint
  - plugin payload (conventions/csharp.md)

## [1.9.0] — 2026-08-15
- diagnose-dotnet: the .NET adapter for the diagnose skill's Phase-1 feedback-loop menu (F64-ClineAdoptionsSmall)
  - plugin.json metadata change
  - skill change (diagnose-dotnet)
  - owner-escalated to minor

## [1.8.0] — 2026-08-08
- MINOR bump.
  - skill change (mine-verify-cover-dotnet)
  - owner-escalated to minor

## [1.7.0] — 2026-07-23
F19-DotnetSkillCoverageWave — plugin-feedback P1–P10 applied under the F18 authoring standard
(nexus-1.36.0-2026-07-18 §A; first W5 retrofit tranche). All 10 skills gain an `## Assumes`
first-H2 block + a minimal-stack branch or adaptation posture; owner-escalated MINOR (new decision
branches/patterns).

- `authorization-patterns` (P7) — policy-based vs two-layer architecture branch; minimal
  single-stub-principal shape; honest-scope description (names non-coverage: OAuth/OIDC sign-in
  middleware, client route guards, 401 interception).
- `create-feature` (P1) — FastEndpoints validator template reconciled with
  service-infra-conventions §10 (`ValidatorsMessagesConstants`, no Blocks.Core helpers); Blocks.Core
  helpers scoped to the MediatR path + plain-FluentValidation fallback; explicit no-CQRS/endpoint-only
  framing; GET query-string + DELETE/no-body coverage; response-record location guidance.
- `create-service` (P5) — minimal-stack branch (no BuildingBlocks: direct NuGet, inline/no base
  classes, SQLite-first or raw Npgsql, no MediatR).
- `domain-patterns` (P6) — zero-dependency variant (inline bases); in-place Entity→AggregateRoot
  promotion recipe; `Entity<int>` vs non-generic `Entity` constraint-chain note.
- `create-vue-feature` (P2) — extend-an-existing-slice branch; layout-mismatch callout.
- `vue-patterns` (P3) — Project Conventions scoped reference-app/discovery-driven; `Use when`
  description (W6).
- `pinia-patterns` (P4) — localStorage persistence pattern; extend-an-existing-store section
  (distinct from cross-store composition); `Use when` description (W6).
- `service-registration` (P8) — description/lead refit to within-service DI layer structure +
  host composition; §4.1 adaptation posture.
- `service-infra-conventions` (P9) — §3 options-binding no-BuildingBlocks fallback
  (`AddOptions<T>().Bind().ValidateDataAnnotations().ValidateOnStart()`); unconditional imperatives
  scoped to the reference-app branch.
- `add-integration-event` (P10) — test-harness-only consumer guidance (no production consumer yet).
  - skill change (create-service)
  - skill change (create-vue-feature)
  - skill change (domain-patterns)
  - skill change (pinia-patterns)
  - skill change (service-infra-conventions)
  - skill change (service-registration)
  - skill change (vue-patterns)
  - owner-escalated to minor

## [1.6.0] — 2026-07-21
- instrument-integrity: kill-attribution rule — timeout/crash/compile-fail are adjudication buckets, never auto-kills; exact floor comparison (no rounding); per-instrument honesty proofs; evidence committed
  - skill change (mine-verify-cover-dotnet)
  - owner-escalated to minor

## [1.5.0] — 2026-07-07
Skill estate consolidation (adhoc-SkillEstateConsolidation) — the estate becomes pattern-first and
exemplar-cited (PROPOSED ADR-51); count claim 33 → 37. MINOR (4 new skills = new capability).

- **4 new skills** — pattern-first ports of the last four project-local skills that had no shipped
  counterpart, Articles material recast as explicit `(reference app: …)` exemplars:
  - `add-state-machine` — data-driven state-transition validation for a write-side aggregate (cached
    transition table, factory-provided validator, validate-before-mutate guard, cache/DbContext DI variants).
  - `file-storage-patterns` (+ `references/templates.md`) — pluggable file-storage module composition,
    options-marker second stores, compensating `TryDeleteAsync`, cross-stage byte migration.
  - `consumer-patterns` (+ 3 references) — MassTransit consumer shape, three-variant idempotency decision,
    reference-data hydration, projection-vs-write-side split.
  - `service-infra-conventions` — cross-cutting infra (ambient request context, fail-fast options, MediatR
    pipeline order, JSON casing, validators) + repo conventions.
- **Re-registration** — `authorization-patterns` description + framing made pattern-first (was
  "the article lifecycle"); content facts unchanged.
- **Fold-upstream** — 10-pair diff of the overlapping locals against their shipped counterparts folded the
  genuinely-missing portable patterns: exclusive-publish-site rule + Verify greps (`add-integration-event`),
  a resource-check-location fix (`create-feature`), a cross-cutting `EventHandlers/` exception + wiring
  verify-greps (`create-domain-event-handler`), gRPC handler-usage patterns + ProtoMember-permanence
  (`create-grpc-contract`), and `EnumEntityConfiguration`/`MetadataConfiguration` ladder rungs
  (`persistence-patterns`). `add-integration-event/workflows/Consumer.md` slimmed to wiring-only (routes to
  `consumer-patterns`). `domain-patterns` gained a build-recipe pointer to `add-state-machine`.

## [1.4.0] — 2026-07-06
- **MINOR — applied the routed `dotnet-microservices` nexus-dotnet 1.3.1 feedback (13 skills, ~45 defects; `adhoc-DotnetFeedbackApply`).**
  Clean-room regeneration + comparative evaluation (repo `dotnet-microservices` @ `cd4d0b1`, skeptic-verified
  against live source) found stale APIs, fictional identifiers, wrong placement heuristics, a security
  regression, and a 10-defect `create-service` staleness cluster. Every defect's live-source proof was
  re-verified before editing; folder + `name:` frontmatter unchanged for all 13; per-skill + full-estate
  skill-lint exit 0. Owner-escalated to MINOR (two skills' content replaced + new decision layers).
  - **11 patched (MERGE verdicts):**
    - `add-integration-event` — namespace-vs-folder trap (`Articles.IntegrationEvents.Contracts` ≠ folder `Articles.Integration.Contracts`); consumer placement keyed off the `AddMassTransitWithRabbitMQ` site, not consumer complexity; `sealed` softened to optional.
    - `error-handling` — added the `Result<T>` / boundary-only `try/catch` prohibitions; `MapStatusCode` recipe step; `UnauthorizedException` thrown from endpoint code (not auth middleware).
    - `create-aggregate`, `domain-patterns`, `cqrs-patterns` — action/owner param always last (Submission drift named); VO ctor `private` + `[JsonConstructor]`; removed fictional `IAction` (real `IArticleAction`).
    - `create-feature` — **[Critical]** `SendOkAsync` → `Send.OkAsync` + dropped the false "used across all services" claim; wire-protected `CreatedById` (`[JsonIgnore]`); Carter mutate-then-assign; `:verb` routes; two-layer authorization.
    - `create-service` — 10-defect staleness cluster: generic `ApplicationDbContext<T>(options, cache)`; `Blocks.Entities` globals; uniform `AddApiServices` + explicit `UseMiddleware` chain; MediatR behavior order; `DispatchDomainEventsInterceptor`; Mapster; csproj-name divergence; EF provider in `.Persistence`; `https`+`Container` profiles; `Data/Master`+`Data/Test`.
    - `create-grpc-contract` — no gRPC error-mapping interceptor (honest `//todo` gap); `GetByIdOrThrowAsync` engine fork; when-to-use decision layer; internal-Docker-port note.
    - `service-registration`, `central-package-management`, `persistence-patterns` — behavior order + no-Application API-layer messaging + transactional interceptor variant + Articles examples; nested-`Directory.Packages.props` check; config ladder `AuditedEntityConfiguration<T> : AuditedEntityConfiguration<T,int> : EntityConfiguration<T,TKey>` + repository-as-UoW / type-keyed-cache spine rules; SQLite dropped.
  - **2 content-replaced (keep-A supersede verdicts):**
    - `create-domain-event-handler` — replaced from base `domain-event-wiring`; handler variant keys off the registered `IDomainEventPublisher` (event bus), **not** the endpoint framework (Production counterexample: FastEndpoints endpoints + MediatR bus).
    - `authorization-patterns` — replaced from base `authorization-security`; real closed `UserRoleType`/`Role` vocabulary (no fictional `Role.Admin`/`UserRoleType.Editor`), two-layer `RequireRoleAuthorization`, authentication-only read-model single-layer case, tenant variant dropped.

## [1.3.1] — 2026-07-04
- PATCH — `improve-architecture/SKILL.md`: added an ADR-46 supersession note pointing repo-scoped
  structural-debt discovery at the new `mine-verify-repo` skill (the .NET skill stays the in-file /
  aggregate-level improver).

## [1.3.0] — 2026-07-03
- **`mine-verify-cover-dotnet` — fact tags & test tiers mapping (`adhoc-SddMergeGen`).** New capability:
  maps the core method's fact-tagging vocabulary (`mine-verify-cover` → "Fact tagging & test tiers") to
  the .NET toolchain — `layer`/`criticality`/`mutation-gated`/`runtime-cost` facts as `[Trait]`
  attributes, the `smoke`/`full`/`gate` tiers as `dotnet test --filter` expressions, and the parked-red
  idiom (`[Fact(Skip = "SPEC-CODE DIVERGENCE … pending triage")]`) for a generated test that documents a
  divergence without failing the suite.

## [1.2.0] — 2026-06-23
**mine-verify-cover .NET adapter (new skill)** — fills the 5 toolchain capabilities of the `mine-verify-cover`
method for .NET: Stryker.NET (MTP runner, JSON report), `dotnet test` (xUnit v3), the xUnit v3 +
AwesomeAssertions + FsCheck test-style contract, and a self-contained test-project scaffold (opts out of
central package management; pins the proven xUnit-v3/Stryker set; Stryker as a local tool). Handles the DDD
same-basename-partial hazard (`Foo.cs` + `Behaviors/Foo.cs`) by scoping the mutate glob to the behaviors file
and extracting the report entry by full path, not basename (the classic fake-green). plugin.json skill count
32→33. Owner-escalated to MINOR (new capability).
  - plugin.json metadata change
  - skill change (mine-verify-cover-dotnet)
  - owner-escalated to minor

## [1.1.1] — 2026-06-13
- nexus-dotnet description fixes — plugin blurb skill count 29→32; 7 pattern-skill descriptions Use-when uniformity
  - plugin.json metadata change
  - skill change (authorization-patterns)
  - skill change (cqrs-patterns)
  - skill change (domain-patterns)
  - skill change (error-handling)
  - skill change (persistence-patterns)
  - skill change (redis-patterns)
  - skill change (service-registration)

## [1.1.0] — 2026-06-12
.NET skill estate sweep — rubric evaluation, format normalization, genericization fixes (ADR-23).
First pass of all 26 .NET skills through the ADR-23 quality system (`skill-lint`, `evaluate-skill`,
proven-patterns). Skill **names are frozen** — no renames; all changes are descriptions/bodies/frontmatter.
Dispositions: 9 keep · 12 reformat · 5 rewrite (`docs/specs/adhoc-DotnetSkillSweep/delivery/disposition.md`).
MINOR tier: 26-skill breadth + `disable-model-invocation` behavior change (owner-escalated).

- **Genericization (the pivotal change).** Five skills were bound to private projects and/or documented
  unbuilt "Pass 2/3" future state; all are now app-agnostic:
  - `domain-patterns`, `domain-service`, `analytics-computation-service` — removed the "not proven until
    Passes 2/3" banners and all "target-state / before-state / won't-build-until-then" framing; demoted
    live `Fokus.*` paths to illustrative examples; restated ADR-004/005/006/007/010/011 as **named
    conventions** (the rule, not the project's ADR number). The valuable mechanical content (CS9032
    rule, VO-vs-scalar rule, pure-by-default + escape-hatch read-port, output/input boundaries, the
    wire-only `{Mode,Multi?,Single?}` envelope rule, delta/direction/polarity, sparkline builder,
    rolling-average ordering caveat) is preserved verbatim.
  - `central-package-management` — dropped the banner + the `sprint-rituals` "Pass 0" snapshot;
    **preserved verbatim** the three-form verification grep with its globstar-portability warning.
  - `framework-currency` — dropped the banner + named-project `file:line` examples; **preserved
    verbatim** the two-stage `Send.*` detection (grep → receiver inspection) and version-verification
    discipline.
- **Blocking lint fixes (Layer 0).** `persistence-patterns` and `redis-patterns` had `<T>` tokens in
  prose headings (XML-tag-in-prose) — wrapped in inline code; both now lint clean.
- **Format normalization.**
  - Per-skill `CHANGELOG.md` dropped to git history on all 5 that carried one (analytics-computation-service,
    create-aggregate, create-feature, domain-patterns, persistence-patterns) — per-skill evolution lives in
    this plugin CHANGELOG (no external norm keeps per-skill changelogs).
  - Every in-scope description now carries a `Use when` / `Loaded when` trigger clause (auto-invocation
    discovery; Anthropic authoring guidance).
  - Architect-only skills (`system-design`, `create-service-claude-md`, `create-module-claude-md`) set
    **`disable-model-invocation: true`** (keep `user-invocable: true`) — a developer-session model no
    longer auto-invokes them. Fixed `system-design`'s incorrect `user-invocable: false` sibling citation.
  - `service-registration` — removed a paragraph that duplicated its frontmatter description; title-cased.
  - Empty `{ProjectName}` registry tables in `add-integration-event` / `create-grpc-contract` replaced
    with grep-before-adding pointer lines; added scope/adjacency fences between confusable siblings
    (integration-event ↔ grpc ↔ domain-event-handler; pipeline-behavior ↔ cqrs).

## [1.0.3] — 2026-06-12
Learner consolidation — Pass 4 finalize-stage malfunction log (M6).

- **`conventions/csharp.md`**: generalized the **Build Verification** `cd /d` rule from build commands to **any command under the Bash tool** (added the `git -C "…"` form). Third occurrence of the cmd-ism class — Pass 0 (developer, build), Pass 3c-B (architect, build), Pass 4 M6 (team-lead, **git**); the build-scoped wording could not catch the git context.

## [1.0.2] — 2026-06-10
Learner consolidation from Passes 4 and 5.

- **`skills/persistence-patterns`**: `UpsertAsync` value-copy rule — copy through EF `PropertyValues` (`Entry(existing).CurrentValues.SetValues(Entry(entity).CurrentValues)`), never `SetValues(object)`: the object overload uses plain reflection and silently skips `PropertyAccessMode.Field` backing-field properties (latent shallow-copy, invisible to shape greps). Cross-referenced with the existing owned/complex-type deep-copy caveat. Promoted at one occurrence (silent-data-bug class).
- **`skills/create-aggregate`**: new **Promote an Existing Entity to an Aggregate Root (in place)** section — type-change-in-place (keep the existing EF config + repository), check the schema consequence from the model snapshot at plan time (audit columns ⇒ mandatory migration), mirror an existing aggregate for the behavior split and raise-after-save event pattern. Variant-aware (plain-DDD vs ASP.NET Identity).

## [1.0.1] — 2026-06-08
Learner consolidation from Passes 0–3c-B — proven (2+ occurrence) and critical lessons promoted into the stack skills and conventions.

- **`conventions/csharp.md`**: added a **Build Verification** rule (on Windows under the Bash tool, never `cd /d … && dotnet build` — `/d` is a cmd flag bash mis-reads, the build never runs, and exit-1 masquerades as a compile failure; pass the absolute `.slnx` path with no `cd`) and a **`required` + `private set` = CS9032** type rule (drop `required` + private ctor, or use `init`); `domain-patterns` (`## Entity`) cross-references it from its encapsulation guidance.
- **`conventions/ef-core.md`**: a generated `DropColumn` + `AddColumn` for the same data **destroys rows** — read every migration after `add` and hand-edit to `RenameColumn`; critical for seeded singletons (VO-regrouping renames).
- **`persistence-patterns`**: new "Mapping a Command onto a Tracked Entity (Mapster)" section — `IgnoreNonMapped(true)` is a whitelist not a shield (zero `.Map()` = silent no-op write), `.Adapt(existing)` never nulls unmatched members (no guard needed), `ComplexProperty`/owned VOs must be assigned explicitly, and write paths must verify **save → reload → assert**.
- **`create-feature` (Mappings workflow)**: added the **Mapster eligibility test** (single-source + name-aligned only; method-dispatch / multi-source / conditional stay explicit), the two-direction caveat (outbound new-object vs inbound onto-tracked), and the **prefix-dropping VO flattening** caveat (auto-flatten breaks → explicit `.Map()`).
- **`domain-service` + `analytics-computation-service`**: discriminated `{Mode, Multi?, Single?}` `*Response` envelopes are **wire-only** — the endpoint assembles them; never mirror into the domain or a domain rename table.

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
