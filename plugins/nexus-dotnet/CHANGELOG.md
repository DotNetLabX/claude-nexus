# nexus-dotnet — Changelog


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
