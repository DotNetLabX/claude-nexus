# adhoc-DotnetSkillSweep — External Research Sweep (Step 1)

**Date:** 2026-06-12
**Method:** Direct web/document research (WebSearch + WebFetch) by the executing developer — the
plan's Step-1 mandate is capability-level ("OMC research agents *or equivalent web/document research
capability*", critic MEDIUM-1). Parallel `general-purpose` research agents were dispatched first but
stranded their deliverables behind lifecycle closers (the documented Explore/agent failure mode,
lessons.md Architect #1); the sweep was completed directly, which is the sanctioned fallback.
**Methodology cloned from:** `D:\src\temp-skills-eval\SKILL_RESEARCH.md` (Flutter round, 2026-05-13)
— sources → per-package skill tables → overlap map → gap table → form findings.
**Clones:** the 4 most credible packages cloned to `D:\src\temp-skills-eval\dotnet\` (Flutter content
left untouched). SKILL.md frontmatter/bodies of the highest-overlap skills read directly, not just READMEs.
**Our estate under comparison:** the 26 in-scope `nexus-dotnet` skills (DDD/CQRS/MediatR/MassTransit/
Redis.OM/gRPC/FastEndpoints; Modules + Services + BuildingBlocks layout).

---

## Section 1 — External packages found (per-package skill tables)

Eight packages were located; **6 are genuine .NET Claude-Code SKILL.md packages**, ranked by
credibility + overlap. Two are noted as non-independent / out-of-genre.

### Package credibility summary

| Package | Repo | Stars | Maintainer | Recency | Independent? |
|---------|------|-------|-----------|---------|--------------|
| **Aaronontheweb/dotnet-skills** | github.com/Aaronontheweb/dotnet-skills | ~1,000 | Aaron Stannard (Akka.NET founder, Petabridge) | v1.3.2, 2026-04-16 | Yes — highest-credibility individual |
| **codewithmukesh/dotnet-claude-kit** | github.com/codewithmukesh/dotnet-claude-kit | 446 | Mukesh Murugan (codewithmukesh.com), MIT | 2026-03-21 rel. | Yes — closest architectural overlap |
| **managedcode/dotnet-skills** | github.com/managedcode/dotnet-skills | 429 | ManagedCode org (multi-tool catalog) | 187 commits, 2026 | Yes — broad framework catalog |
| **nesbo/dotnet-claude-code-skills** | github.com/nesbo/dotnet-claude-code-skills | 53 | nesbo (individual) | 2025-10-22 | Yes — DDD/CQRS/hexagonal, thin (4) |
| **jeffallan/claude-skills** (dotnet-core-expert) | github.com/jeffallan/claude-skills | unconfirmed | jeffallan (listed on agentskills.so / tessl.io) | unconfirmed | Yes — single skill, CQRS+MediatR+EF |
| **wshaddix/dotnet-skills** | github.com/wshaddix/dotnet-skills | 55 | wshaddix | fork | **No — fork of Aaronontheweb**; install cmd points back to `Aaronontheweb/dotnet-skills`. Excluded from overlap (duplicate). |

> Marketplaces (claudemarketplaces.com, skillsmp.com, skillhub.club, agentskills.so, tessl.io) surface
> the same GitHub-origin packages above as listings (notably jeffallan's `dotnet-core-expert` on
> agentskills.so/tessl.io) — no marketplace-exclusive .NET package was found. **No official
> Microsoft / dotnet-org / Anthropic .NET skill package exists** as of 2026-06 (searched; none found).
> Anthropic ships *authoring guidance* (Section 4) and `anthropics/skills` (general, non-.NET).

### Aaronontheweb/dotnet-skills (30 skills, 5 agents)

Production-pattern plugin from the Akka.NET founder. Philosophy: "No magic — no AutoMapper, no
reflection-heavy frameworks", sealed-by-default, composition over inheritance. **Architecture-axis
gap for us:** no DDD-aggregate / CQRS / MediatR / domain-event scaffolders — it is a *patterns &
standards* estate, not a *vertical-slice scaffolder* estate like ours.

| Family | Skills (folder names) | Relevant to our 26? |
|--------|----------------------|---------------------|
| Akka.NET (5) | akka-best-practices, akka-testing-patterns, akka-hosting-actor-patterns, akka-aspire-configuration, akka-management | No (different concurrency model) |
| C# language (4) | csharp-coding-standards, csharp-concurrency-patterns, csharp-api-design, csharp-type-design-performance | Partial — value objects, API versioning |
| Data (2) | **efcore-patterns**, database-performance | HIGH — vs our persistence-patterns |
| .NET ecosystem (5) | dotnet-project-structure, **package-management**, serialization, local-tools, slopwatch | package-management → HIGH vs our central-package-management |
| MS.Extensions (2) | microsoft-extensions-configuration, **microsoft-extensions-dependency-injection** | HIGH — vs our service-registration |
| Aspire (3) | aspire-configuration, aspire-integration-testing, aspire-service-defaults | No |
| Testing (5) | testcontainers, snapshot-testing, crap-analysis, playwright-blazor, verify-email-snapshots | Gap-fill (we have zero test skills) |
| Misc (4) | mjml-email-templates, ilspy-decompile, dotnet-devcert-trust, marketplace-publishing | No |

Form note: frontmatter `name` + `description` only, plus a non-standard **`invocable: false`** field
(verified in `efcore-patterns/SKILL.md`) — their analog of our `disable-model-invocation`. Flat layout
(no `references/`/`workflows/`); single repo-level `RELEASE_NOTES.md` (no per-skill CHANGELOGs).

### codewithmukesh/dotnet-claude-kit (45 skills, 10 agents, 14 commands) — CLOSEST OVERLAP

.NET 10 / C# 14 kit. **Highest architectural overlap with our estate** — has dedicated `ddd`,
`vertical-slice`, `clean-architecture`, `minimal-api`, `ef-core`, `error-handling`, `messaging`,
`dependency-injection`. Stated form discipline: "each skill under 400 lines", BAD/GOOD anti-pattern
pairs, ADRs in `knowledge/decisions/`.

| Category | Skills (folder names) | Overlap with ours |
|----------|----------------------|-------------------|
| Architecture | architecture-advisor, **vertical-slice**, **clean-architecture**, **ddd**, project-structure | HIGH (ddd↔domain-patterns; vertical-slice↔create-feature) |
| Web/API | **minimal-api**, api-versioning, authentication, openapi, scalar, httpclient-factory | HIGH (minimal-api↔create-feature; authentication↔authorization-patterns) |
| Data | **ef-core** | HIGH (↔persistence-patterns) |
| Resilience | **error-handling**, resilience, caching, **messaging** | HIGH (error-handling↔error-handling; messaging↔add-integration-event) |
| Cross-cutting | **dependency-injection**, configuration | HIGH (↔service-registration) |
| Observability | logging, serilog, opentelemetry | No |
| Testing/DevOps/Workflow | testing, docker, ci-cd, aspire, container-publish + 14 slash-command skills (spec/plan/tdd/...) | Gap-fill (testing) / out-of-scope (workflow) |

Form note (verified from SKILL.md): rich `description: >` blocks with what-it-does + **"Load this
skill when…" + explicit trigger-keyword lists** (e.g. messaging lists `"Wolverine","MassTransit",
"outbox","saga","integration event","queue","pub/sub"`). Flat `skills/<name>/SKILL.md`; single
repo-level CHANGELOG (no per-skill). **This is the best-in-class description form found** (Section 4).

### managedcode/dotnet-skills (multi-tool catalog)

Installable catalog for Claude/Copilot/Gemini/Codex/Junie; `catalog/<type>/<package>/skills/<skill>/
SKILL.md`. Broad framework coverage (gRPC, Minimal-APIs, EF Core, ASP.NET Core, Aspire, Orleans,
SignalR, Blazor, MAUI, WPF…). **No DDD/CQRS/MediatR/domain-events skill** — explicitly invites those
as contributions.

| Relevant skill | Catalog path | Overlap |
|----------------|-------------|---------|
| **grpc** | catalog/Frameworks/gRPC/skills/grpc/ | HIGH (↔create-grpc-contract) |
| minimal-apis / dotnet-webapi | catalog/Frameworks/{Minimal-APIs, Official-DotNet-ASPNet}/ | MEDIUM (↔create-feature) |
| entity-framework-core | catalog/Frameworks/Entity-Framework-Core/ | MEDIUM (↔persistence-patterns) |
| convert-to-cpm | catalog/Tools/Official-DotNet-NuGet/ | MEDIUM (↔central-package-management) |
| aspnet-core, web-api, worker-services | catalog/Frameworks/… | LOW |

Form note (verified from `grpc/SKILL.md`): aggressive structured trigger —
**`USE FOR: … DO NOT USE FOR: … INVOKES: …`** in the description, plus a **`compatibility:`**
frontmatter field and a `## Trigger On` body section. Uses `references/` + `assets/` optional
subdirectories (per repo schema). This is the best-in-class *boundary* form (DO NOT USE FOR).

### nesbo/dotnet-claude-code-skills (4 skills)

DDD + CQRS + Hexagonal, .NET 8 / C# 12, but **CQRS via Paramore.Brighter (not MediatR)** and **no
MediatR / domain-events / integration-events / gRPC / FastEndpoints**. Thin.

| Skill | Covers | Overlap |
|-------|--------|---------|
| ddd-dotnet | aggregates/entities, command+query handlers (Brighter), domain exceptions | MEDIUM (↔domain-patterns/cqrs-patterns — different mediator) |
| data-dotnet | EF Core configs, write/query repo split, DI auto-registration | MEDIUM (↔persistence-patterns) |
| bdd-dotnet | BDD-style tests with in-memory fakes | Gap-fill (testing) |
| add-serena | Serena MCP integration | No |

Form note (verified): **`ddd-dotnet/SKILL.md` has NO YAML frontmatter at all** — opens straight to
`# Domain-Driven Design (DDD) in .NET`. Defect by Anthropic's standard (name+description required).
Body cites "real-world production code from the **LMP project**" — project-specific leakage, the same
defect class as our genericization artifacts.

### jeffallan/claude-skills — dotnet-core-expert (1 skill)

Single broad skill: ".NET 8, C# 12, ASP.NET Core, minimal APIs, EF Core, MediatR, CQRS, clean
architecture, DI, JWT, xUnit, Docker, K8s, AOT, OpenAPI." Trigger phrasing (verified on agentskills.so):
"Use when building .NET 8 applications with minimal APIs, clean architecture, or cloud-native
microservices. Invoke for Entity Framework Core, CQRS with MediatR, JWT authentication, AOT." One of
the few externals that names **MediatR + CQRS together** like our stack — but it is one monolithic
skill, not a per-pattern estate. Stars unconfirmed (listed via registries, not fetched from GitHub).

---

## Section 2 — Overlap map (HIGH / MEDIUM / none per pair vs our 26)

Each row cites the concrete external skill (repo + path). "—" = no external counterpart found.

| Our skill | HIGH-overlap external | MEDIUM-overlap external | Notes |
|-----------|----------------------|-------------------------|-------|
| **domain-patterns** | codewithmukesh `skills/ddd` | nesbo `ddd-dotnet`; jeffallan `dotnet-core-expert` | ddd covers aggregates/VOs/domain-events/strongly-typed-IDs — directly comparable |
| **cqrs-patterns** | — | codewithmukesh `vertical-slice` (handler patterns); nesbo `ddd-dotnet` (Brighter); jeffallan (MediatR+CQRS) | No external uses our MediatR-pipeline-behaviors framing; closest is jeffallan |
| **create-feature** | codewithmukesh `vertical-slice` + `minimal-api` | managedcode `minimal-apis`/`dotnet-webapi` | External = patterns; ours = full vertical-slice scaffolder (endpoint+cmd+handler+validator+DI). Ours is more generative |
| **persistence-patterns** | Aaronontheweb `efcore-patterns`; codewithmukesh `ef-core` | managedcode `entity-framework-core`; nesbo `data-dotnet` | Strongest external coverage area — 4 comparators (NoTracking, query-splitting, migrations) |
| **service-registration** | Aaronontheweb `microsoft-extensions-dependency-injection`; codewithmukesh `dependency-injection` | — | keyed services, scope mgmt, IServiceCollection extensions |
| **central-package-management** | Aaronontheweb `package-management` | managedcode `convert-to-cpm` | CPM + Directory.Packages.props — direct comparators |
| **error-handling** | codewithmukesh `error-handling` | Aaronontheweb (`csharp-api-design` ProblemDetails) | Result pattern + ProblemDetails (RFC 9457) + global handler — directly comparable |
| **add-integration-event** | codewithmukesh `messaging` (MassTransit + outbox + saga) | — | Ours is MassTransit-specific scaffolder; theirs is broader (Wolverine+MassTransit, outbox, saga) — outbox/saga are gap candidates |
| **create-grpc-contract** | managedcode `grpc` | — | Both .NET gRPC; theirs is `.proto`+ASP.NET, ours is code-first protobuf-net — note the variant difference |
| **authorization-patterns** | codewithmukesh `authentication` | — | Different slice (authn vs our two-layer authz) — partial |
| **system-design** | codewithmukesh `architecture-advisor` + `clean-architecture` | managedcode `dotnet` (arch review) | Architecture-decision guidance — comparable at the advisory level |
| **create-aggregate** | codewithmukesh `ddd` (aggregate patterns) | nesbo `ddd-dotnet` | Ours scaffolds the full aggregate+VO+EF-config+repo; theirs is pattern guidance |
| **improve-architecture** | — | codewithmukesh `architecture-advisor` | Proactive discovery is our angle; theirs is advisory |
| **add-pipeline-behavior** | — | codewithmukesh `vertical-slice` (Mediator handlers) | MediatR pipeline behaviors — no dedicated external |
| **domain-service** | — | Aaronontheweb `csharp-coding-standards` (static pure fns) | No dedicated external domain-service skill |
| **analytics-computation-service** | — | — | No external counterpart — specialized to our analytics tabs |
| **extract-endpoint-types** | — | — | Refactor skill; no external counterpart |
| **extract-feature-service** | — | — | Refactor skill; no external counterpart |
| **create-domain-event-handler** | — | codewithmukesh `ddd` (domain events) | Handler-by-effect placement is our convention; no external scaffolder |
| **create-building-blocks-package** | — | — | BuildingBlocks packaging — no external counterpart |
| **create-module** / **create-module-claude-md** | — | — | Modular-monolith module scaffolders — no external counterpart |
| **create-service** / **create-service-claude-md** | — | — | Service scaffolders — no external counterpart |
| **framework-currency** | — | Aaronontheweb `slopwatch` (anti-pattern detection, different aim) | Version-currency + FastEndpoints migration — no external counterpart |

**Reading:** overlap concentrates on the **pattern-reference** family (persistence, DI, error-handling,
CPM, gRPC, DDD) where externals are strong. Our **scaffolder** family (create-*, extract-*, module/
service) and **specialized** skills (analytics, framework-currency, improve-architecture) are largely
**unmatched externally** — confirms our estate's distinctive value is generative scaffolding + our
specific Modules/Services/BuildingBlocks topology, not the pattern knowledge externals also hold.

---

## Section 3 — Gap table (capability, best source, priority)

Capabilities present in credible externals that our 26 in-scope skills lack. (Each feeds the Step-6
proposal; nothing here is built this pass — convergent scope.)

| Capability | Best external source | Priority | Notes |
|-----------|---------------------|----------|-------|
| **.NET testing skills** (unit/integration) | Aaronontheweb `testcontainers`, `snapshot-testing`; codewithmukesh `testing`; nesbo `bdd-dotnet` | **HIGH** | We have **zero** test skills; core `tdd` is process-only. Headed the gap list as the plan predicted. xUnit + WebApplicationFactory + Testcontainers is the consensus external stack |
| **Outbox / saga messaging patterns** | codewithmukesh `messaging` (outbox, saga, choreography) | MEDIUM | Our add-integration-event scaffolds publish/consume but not transactional-outbox or saga lifecycle |
| **Resilience patterns** (Polly/retry/circuit-breaker) | codewithmukesh `resilience`; Aaronontheweb `aspire-service-defaults` | MEDIUM | No resilience skill in our estate |
| **Caching patterns** | codewithmukesh `caching` | MEDIUM | No caching skill |
| **Observability** (OpenTelemetry/structured logging) | codewithmukesh `opentelemetry`/`serilog`; Aaronontheweb `opentelementry-dotnet-instrumentation` | MEDIUM | No observability skill; relevant to a microservices estate |
| **Database performance** (N+1, AsNoTracking depth) | Aaronontheweb `database-performance` | LOW-MEDIUM | Partially inside our persistence-patterns; could be deepened or split |
| **API versioning** | codewithmukesh `api-versioning`; Aaronontheweb `csharp-api-design` | LOW | No dedicated versioning skill |
| **AOT / serialization source-gen** | Aaronontheweb `serialization` | LOW | Niche; only if AOT becomes a target |
| **LLM-slop / anti-pattern detection for C#** | Aaronontheweb `slopwatch`; codewithmukesh `de-sloppify` | LOW | Overlaps our improve-architecture aim; could inform it |

---

## Section 4 — Form findings (structure/trigger/disclosure conventions ours lack)

This is the half of external value that survives even where external *content* is shallow. Each finding
is checked against **Anthropic's official skill-authoring best-practices**
(platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices, fetched 2026-06-12) and the
best externals. These feed Step-3's estate-wide normalization decisions.

| # | Convention | Source (official + external) | Ours today | Adopt? (Step-3 call) |
|---|-----------|------------------------------|-----------|----------------------|
| **F1** | **Description must state what-it-does AND when-to-use, with explicit trigger key-terms.** Official: *"Include both what the Skill does and specific triggers/contexts… 'Use when working with PDF files or when the user mentions PDFs, forms…'"* | Anthropic best-practices (Writing effective descriptions); codewithmukesh `description: >` + "Load this skill when…" keyword lists; managedcode `USE FOR:/DO NOT USE FOR:` | Mixed — some ours have "Use when…"/"Loaded when…" (create-grpc-contract, domain-patterns), some are pure what-it-does with a weak tail (create-feature: "Check the service CLAUDE.md…" is not a trigger) | **Candidate: standardize a when-to-use clause on every description.** Highest-value form finding |
| **F2** | **Third-person, no first/second person.** Official *Warning*: *"Always write in third person… Avoid 'I can help you…' / 'You can use this…'"* | Anthropic best-practices | Ours are already third-person — **compliant**. Confirm none regressed | Confirm (likely no-op) |
| **F3** | **Gerund-form names preferred** (`processing-pdfs`); noun-phrase acceptable | Anthropic best-practices (Naming conventions) | Ours are imperative (`create-feature`) or noun (`domain-patterns`) — "Acceptable alternatives" per the doc, **not** the preferred gerund | **Do NOT adopt** — names are the frozen invocation contract (plan Scope); renames are breaking. Note the divergence, don't act |
| **F4** | **`references/` is the official supporting-file subdir name** (`reference/finance.md`); progressive-disclosure split; **one level deep** | Anthropic best-practices (Progressive disclosure; "Keep references one level deep"); managedcode uses `references/` | We use **`workflows/`** (9 skills), **zero `references/`** among the 26. `workflows/` is itself an official pattern (the best-practices "Workflows and feedback loops" section legitimizes step-folders) | **Likely keep `workflows/`** for scaffolders (it matches the official *workflow* pattern) but the Step-3 decision should pick ONE convention and state when each applies. Not a defect — a consistency call |
| **F5** | **ToC for any reference/body file >100 lines** | Anthropic best-practices (Structure longer reference files) | Not done anywhere in our estate; our monolithic bodies (service-registration 240 lines) have no ToC | **Candidate** — cheap legibility win for the monolithic Batch-B skills |
| **F6** | **No time-sensitive / "not yet proven" scaffolding in body** — use an "old patterns" `<details>` block instead | Anthropic best-practices (Avoid time-sensitive information) | `domain-patterns` opens with a banner *"Accepted but not proven until Passes 2/3 consume it"* — exactly the time-sensitive content the doc warns against | **Candidate fix** — Batch-B reformat target (move/retire the banner) |
| **F7** | **Body < 500 lines** | Anthropic best-practices (token budgets) | Our largest (service-registration 240) is well under — **compliant**. Confirm none exceed | Confirm (likely no-op) |
| **F8** | **`DO NOT USE FOR:` boundary clause** sharpens trigger precision | managedcode `grpc` (`DO NOT USE FOR: SignalR hubs, plain REST…`) | None of ours state negative triggers | **Optional** — high-value for skills with confusable siblings (create-feature vs create-aggregate; create-grpc-contract vs add-integration-event) |
| **F9** | **Per-skill CHANGELOG is NON-standard** — no credible external keeps per-skill changelogs; all use one repo/plugin-level changelog | Aaronontheweb (repo `RELEASE_NOTES.md`), codewithmukesh (repo `CHANGELOG.md`), managedcode, nesbo — none per-skill; Anthropic docs never mention per-skill changelogs | **5 of our 26** carry a per-skill `CHANGELOG.md` (analytics-computation-service, create-aggregate, create-feature, domain-patterns, persistence-patterns) — inconsistent and unsupported by any external norm | **Strong candidate to drop to git history** — our repo already version-keys the whole plugin (ADR-9); per-skill CHANGELOGs duplicate that. Step-3 estate-wide decision |
| **F10** | **`invocable:`/`compatibility:` frontmatter** for non-model-invoked or stack-gated skills | Aaronontheweb `invocable: false`; managedcode `compatibility:` | We use `user-invocable: true` (domain-patterns) inconsistently — most skills omit it | **Candidate to standardize** — decide per family whether architect-only skills (create-*-claude-md, system-design) set an explicit model-invocation flag |

**Form headline:** the single highest-value adoptable convention is **F1 (when-to-use + trigger
key-terms in every description)** — it is official Anthropic guidance, the best externals all do it
richly, and our estate does it inconsistently. **F9 (drop per-skill CHANGELOGs)** is the clearest
consistency fix. **F3 (gerund names) is explicitly out** — names are frozen. F4 (`workflows/` vs
`references/`) is a consistency *decision*, not a defect, and belongs to the owner at Step 3.

---

## Provenance / honesty notes

- Every star count, date, and maintainer above came from a fetched GitHub/registry page (2026-06-12);
  items I could not confirm are marked **unconfirmed** (jeffallan stars; some last-commit dates).
- Frontmatter/body quotes in Sections 1 & 4 were read from the **cloned** SKILL.md files
  (`D:\src\temp-skills-eval\dotnet\…`), not inferred from READMEs.
- `wshaddix/dotnet-skills` is a **fork** of Aaronontheweb (its own install command installs the
  upstream) — excluded from the overlap map to avoid double-counting; recorded for completeness.
- No official Microsoft/.NET-team/Anthropic **.NET** skill package was found; the only official input
  is Anthropic's *authoring* guidance (Section 4) — that absence is itself a finding (the .NET
  Claude-skill space is entirely community-driven as of 2026-06).
