# Dotnet Feedback Apply — apply the routed nexus-dotnet 1.3.1 feedback (13 entries, ~45 defects)

**Feature Spec:** None — ad-hoc technical pass. Binding definition: the consuming repo's routed feedback file
`D:\src\dotnet-microservices\docs\plugin-feedback\nexus-dotnet-1.3.1-2026-07-05.md` (13 entries, all
`Action: update`) + the recovered Phase B verdict record
`D:\src\dotnet-microservices\docs\skill-evals\2026-07-05-phase-b-verdicts.md` (8 MERGE → patch, 2
keep-A/supersede → replace: `authorization-patterns`, `create-domain-event-handler`). Governed by ADR-23
(born-compliant skills, lint as done-condition), ADR-9 (release flow, single bump), ADR-1 (plugin repo is
source of truth). Master gate (ADR-25): two-way-door prose edits to shipped skill files — no tech-spec;
this plan is the definition's delivery arm.

## Context

A clean-room regeneration + comparative evaluation in the consuming repo (dotnet-microservices, 2026-07-05,
@ cd4d0b1, skeptic-verified against live source) found ~45 defects across 13 shipped nexus-dotnet skills:
stale APIs, fictional identifiers, wrong placement heuristics, a security regression, and a 10-defect
staleness cluster in `create-service`. All 10 comparative pairings were won by the clean-room skills; 8
verdicts were MERGE (shipped skill has salvageable structure → patch it), 2 were keep-A/supersede (shipped
content "contributes no correct fact A lacks" → replace its content).

Architect re-grounding, 2026-07-06, against live plugin source (nexus-dotnet unchanged since the 1.3.1
release commit `f50b9fd`, so the shipped-side claims cannot have drifted) — all spot-checked defects
confirmed, with two target widenings the feedback file understates:

- `SendOkAsync` + the false "used across all services" claim live at
  `create-feature/workflows/EndpointFastEndpoints.md:40,100` (the feedback names SKILL.md; sweep both).
- Fictional `IAction` also appears at `domain-patterns/SKILL.md:98` (feedback flags it only in
  `create-aggregate/workflows/DomainEvent.md:10,29`).
- The `Blocks.Domain`-namespace defect also sits in `create-service/workflows/ScaffoldDomainProject.md:10-12,30`
  (feedback names five other Scaffold files; sweep all `workflows/Scaffold*.md`). **The feedback's blanket
  "`Blocks.Domain` → `Blocks.Entities`" claim is amended, not taken literally** (critic, code-grounded):
  `Blocks.Domain` and `Blocks.Domain.Entities` are REAL live namespaces (`Blocks.Domain/IDomainEvent.cs:4`,
  `IAuditedEntity.cs:3`); only `Blocks.Domain.ValueObjects` is fictional. The defect is that the scaffold's
  GlobalUsings template doesn't match the live exemplar (`Submission.Domain/GlobalUsings.cs:2` =
  `global using Blocks.Entities;` only).
- `MasterData/` confirmed at `ScaffoldFolders.md:20,42,48` + `ScaffoldPersistenceProject.md:68,111`;
  `UserRoleType.Editor/Admin` at `authorization-patterns/SKILL.md:38`, `Role.Admin` at `:111`;
  `FindByIdOrThrowAsync` hard-coded at `create-grpc-contract/workflows/Server.md:14`;
  `internal constructor` at `domain-patterns/SKILL.md:50`.

Consuming-repo proofs are dated 2026-07-05 @ cd4d0b1; `src/` there is unchanged since (docs-only commits),
but re-verification at apply time is binding (below).

## Scope

**In:** the 13 shipped nexus-dotnet skills named in the feedback file — 11 patched
(`add-integration-event`, `error-handling`, `create-aggregate`, `domain-patterns`, `cqrs-patterns`,
`create-feature`, `create-service`, `create-grpc-contract`, `service-registration`,
`central-package-management`, `persistence-patterns`), 2 content-replaced (`create-domain-event-handler`,
`authorization-patterns`); skill-backlog entries; one release (bump after all edits, owner-confirmed tier;
omni twin sync).

**Out:** `create-module` — it shares the staleness family (`Blocks.Domain` globals, `MasterData/` at
`workflows/ScaffoldDomain.md:21,40-51`) but is not in the routed feedback; record it as a backlog row in
Step 10, do not edit it. Marking the entries applied in the consuming repo's feedback file (its learner
owns that file). The consuming repo's local skill estate (shadowing/retirement is its call). The Deferred
coverage gaps (each waits for its unblock condition). nexus core (1.24.0 already shipped).

## Binding vs developer's-call

- **Binding:** every listed defect correction lands (the 13 entries' bullets are the acceptance checklist,
  including the three target widenings above); the patch/replace split follows the recovered verdict record;
  skill folder names and `name:` frontmatter are **unchanged** for all 13 (renames break marketplace refs);
  **re-verify each defect's live-source proof against `D:\src\dotnet-microservices` before editing** — a
  claim that no longer reproduces is recorded in implementation.md and skipped, never applied blind (owner's
  standing rule: verify every aged finding against current source); Write tool, UTF-8 without BOM (ADR-23);
  full-estate lint exit 0 after every step-group; **one** bump, after all edits, never per-step (dev-repo
  CLAUDE.md); register rule: a placeholder-generic skill (`{Name}`, `{Resource}`) states the corrected rule
  generically and names the reference-app fact in a callout; a skill already citing family/app identifiers
  states them exactly — **no fictional identifier survives anywhere**.
- **Developer's call:** exact wording; whether a correction lands in SKILL.md, a workflow file, or both when
  the wrong claim appears in both; how much structure/coverage the two replacements port from their local
  bases vs re-derive; section ordering inside replaced skills; consolidated vs per-skill backlog entries.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills | Follow | no | add-integration-event: 3 defects, files in step | — |
| 2 | improve-skills | Follow | no | error-handling: 3 defects | — |
| 3 | improve-skills | Follow | no | aggregate cluster: create-aggregate + domain-patterns + cqrs-patterns, 6 defects + IAction widening | — |
| 4 | improve-skills | Follow | no | create-feature: 5 defects incl. the Critical Send API | — |
| 5 | improve-skills | Follow | no | create-service: 10-defect staleness cluster, all `Scaffold*.md` | — |
| 6 | improve-skills | Follow | no | create-grpc-contract: 4 defects | — |
| 7 | improve-skills | Follow | no | spine cluster: service-registration + central-package-management + persistence-patterns, 9 defects | — |
| 8 | improve-skills | Follow | no | replace create-domain-event-handler content; base = consuming repo `domain-event-wiring` | — |
| 9 | improve-skills | Follow | no | replace authorization-patterns content; base = consuming repo `authorization-security` | — |
| 10 | release-plugin | Follow | no | estate lint sweep; backlog; single bump (owner tier); gen-omni | — |

For Steps 1–9, `improve-skills` is the write standard for modifying shipped skills (dev-repo carve-out —
ADR-23's single owner of "write or modify a skill correctly": consolidating pass, net complexity flat or
down, lint gate per skill). TDD is `no` throughout: prose-only edits, no executable change; the regression
gate is the estate lint suite + grep-shaped acceptance.

## Domain Model Changes

N/A — markdown skill files + a version bump.

## Data Model Changes

N/A.

## Implementation Steps

**1. Patch `add-integration-event` (3 defects).** Follow improve-skills.
Files: `plugins/nexus-dotnet/skills/add-integration-event/SKILL.md`, `workflows/EventContract.md`,
`workflows/Consumer.md` (+ `workflows/Publisher.md` if the placement heuristic appears there — grep first).
- Namespace-vs-folder warning: contracts namespace `Articles.IntegrationEvents.Contracts` ≠ folder
  `Articles.Integration.Contracts` — state the correct namespace where the templates are namespace-silent
  and call out the divergence (reference-app callout; the skill is placeholder-generic elsewhere).
- Consumer placement: replace the "rich → `.Application`, simple → `.API`" heuristic with: the consumer
  goes in the project that calls `AddMassTransitWithRabbitMQ(...)`, regardless of complexity. The
  rich-vs-simple **shape** split stays (`Consumer.md:36`'s "Rich Consumer" heading is valid content) —
  only the placement keying changes (`Consumer.md:7` vs `:38` reference paths, Location rows `:90-91`).
- `sealed` on consumers: present as optional (2-of-9 minority in the reference app), not required.
- Re-verify greps (binding, before edit): `Articles.IntegrationEvents.Contracts` in
  `D:\src\dotnet-microservices\src\BuildingBlocks\Articles.Integration.Contracts\`; `AddMassTransitWithRabbitMQ`
  call sites across the 5 messaging services; `sealed.*IConsumer` count.
- Accept: grep the skill folder for placement wording that keys the target project off rich/simple (the
  Location rows + `:7`/`:38` couplings) → 0 hits; `AddMassTransitWithRabbitMQ` → ≥1 hit;
  `Articles.IntegrationEvents.Contracts` → ≥1 hit; lint exit 0.
Satisfies: feedback Entry "add-integration-event"; verdict #1 (MERGE).

**2. Patch `error-handling` (3 defects).** Follow improve-skills.
File: `plugins/nexus-dotnet/skills/error-handling/SKILL.md`.
- Add the two prohibitions: no `Result<T>` error monad (errors flow as thrown exceptions); `try/catch` only
  at genuine I/O boundaries, never as domain control flow.
- Extension-Points recipe: adding a new exception type MUST add its arm to the middleware's `MapStatusCode`
  switch — state the failure mode (forgotten arm silently falls through to 500). Note: `MapStatusCode`
  already appears at `SKILL.md:43` — the defect is its absence from the **recipe steps**, so the fix and
  its check are recipe-scoped.
- `UnauthorizedException` "Where" row: thrown from endpoint code (reference app: Auth RefreshToken
  endpoint), not authentication middleware; middleware only translates.
- Accept: grep for `Result<` prohibition wording → ≥1 hit; `MapStatusCode` inside the Extension-Points
  recipe section (not merely elsewhere in the file) → ≥1 hit; "Authentication middleware" as the throw
  site → 0 hits; lint exit 0.
Satisfies: feedback Entry "error-handling"; verdict #2 (MERGE).

**3. Patch the aggregate cluster — `create-aggregate`, `domain-patterns`, `cqrs-patterns` (6 defects +
IAction widening).** Follow improve-skills. One step so the three skills state the same rules identically.
Files: `create-aggregate/SKILL.md`, `create-aggregate/workflows/ValueObject.md`,
`create-aggregate/workflows/DomainEvent.md`, `domain-patterns/SKILL.md`, `cqrs-patterns/SKILL.md`.
- Action-order rule (both aggregate skills + the cqrs-patterns snippet): the action/owner parameter is
  **always last, after the factory arguments** — not "preferred last". Name the reference app's Submission
  drift as the known exception, not the template. Reorder `cqrs-patterns`' own command/handler example.
- Value-object ctor (both aggregate skills): `private` ctor + `[JsonConstructor]`, not `internal`
  (`domain-patterns/SKILL.md:50`, `create-aggregate/workflows/ValueObject.md`).
- Remove fictional `IAction` from `create-aggregate/workflows/DomainEvent.md:10,29` **and**
  `domain-patterns/SKILL.md:98` (widened target). No `IAction` type exists; the reference app's real
  abstraction is `IArticleAction` — the developer re-verifies the correct replacement identifier against
  `D:\src\dotnet-microservices\src\BuildingBlocks\Articles.Abstractions\` before choosing generic vs exact.
- Accept: grep all three skill folders for `IAction[^a-zA-Z]` → 0 hits; `internal` ctor guidance → 0 hits;
  "preferred last" / order-unstated action wording → 0 hits; lint exit 0 on all three.
Satisfies: feedback Entries "create-aggregate", "domain-patterns", "cqrs-patterns"; verdict #3/#4 (MERGE).

**4. Patch `create-feature` (5 defects, one Critical).** Follow improve-skills.
Files: `create-feature/SKILL.md`, `workflows/EndpointFastEndpoints.md` (Critical site, lines 40 + 100),
`workflows/Handler.md`, `workflows/EndpointCarter.md`.
- **[Critical]** `SendOkAsync` → `Send.OkAsync`; delete the false "the pattern used across all services"
  claim (`EndpointFastEndpoints.md:100`). Sweep the whole skill folder for **all** legacy `Send*Async`
  forms — the framework-currency skill's migration table is the vocabulary reference (do not restate it).
  `EndpointFastEndpoints.md:95`'s `SendUnauthorizedAsync()` is a legitimate prohibition sentence — migrate
  its vocabulary to the `Send.*` form, do not delete the sentence.
- Handler.md: creator/acting-user id is stamped server-side (reference app: `ArticleCommandBase` +
  pipeline), never bound from the request. The live pattern **keeps** the property, wire-protected
  (`ArticleCommandBase.cs:23-24`: `[JsonIgnore] public int CreatedById`), and the template command
  implements `IAuditableAction` which requires it — so the fix is *make it non-wire-bindable*
  (`[JsonIgnore]` / base-record stamping), never delete the property.
- EndpointCarter.md: replace generic `record with { Id }` with the dominant mutate-then-assign pattern.
- Add the `:verb` route convention for non-CRUD write endpoints.
- Authorization guidance: writes need the two-layer gate (role + resource); group-level
  `RequireAuthorization` alone drops the resource layer. This step states the binding two-layer rule and
  references `authorization-patterns` by name — correctness rests on the rule, not on Step 9's replaced
  text (Step 9 runs later; both land in the same release commit).
- Accept: grep skill folder for legacy `Send[A-Z]\w*Async` forms → 0 hits (the `Send.OkAsync` /
  `Send.*Async` new forms don't match); every `CreatedById` occurrence in Handler.md sits with
  `[JsonIgnore]` or the server-side-stamping note (no bare request-bound field); `:verb`/`:{verb}` route
  convention → ≥1 hit; lint exit 0.
Satisfies: feedback Entry "create-feature"; verdict #4 (MERGE).

**5. Patch `create-service` (10-defect staleness cluster).** Follow improve-skills.
Files: **all** `create-service/workflows/Scaffold*.md` (the feedback names five; the namespace defect also
sits in `ScaffoldDomainProject.md` — derive the touched set from the greps below, not the feedback's list)
+ `SKILL.md` if any defect surfaces there.
- DbContext base: `ApplicationDbContext<T>(options, cache)` — the current stub doesn't compile.
- GlobalUsings/namespace template lines (`ScaffoldDomainProject.md:10-12,30` + anywhere the grep hits):
  match the live exemplar (`global using Blocks.Entities;` — `Submission.Domain/GlobalUsings.cs:2`) and
  drop the fictional `Blocks.Domain.ValueObjects`. **Amended scope (critic H1):** `Blocks.Domain` and
  `Blocks.Domain.Entities` are real namespaces — do NOT blanket-replace; the substitution is scoped to
  the GlobalUsings/namespace-claim template blocks. File-path references to the `Blocks.Domain` *project
  folder* (e.g. `ScaffoldCsprojFiles.md:24`) are correct and stay.
- Fictional `Use{Name}Middleware` / `Add{Name}Services` → the real uniform `AddApiServices` (etc.) +
  explicit `UseMiddleware` chain.
- MediatR registration: include the three open behaviors — order AssignUserId → Validation → Logging.
- Register `DispatchDomainEventsInterceptor` (a scaffolded service must dispatch domain events).
- Mapper: Mapster, not AutoMapper/Mapperly.
- Integration-contracts csproj: `Articles.IntegrationEvents.Contracts.csproj` inside folder
  `Articles.Integration.Contracts` (mirror Step 1's divergence callout).
- EF provider registration moves to `.Persistence`, not `.API`.
- launchSettings profiles: `https` + `Container`.
- Seed folders: `Data/Master` + `Data/Test`, not `MasterData/` (`ScaffoldFolders.md:20,42,48`,
  `ScaffoldPersistenceProject.md:68,111`).
- Re-verify greps (binding): each corrected fact against a live service under
  `D:\src\dotnet-microservices\src\Services\` (e.g. Submission) before editing.
- Accept: grep `create-service/` for `MasterData` → 0 hits; `global using Blocks.Domain` → 0 hits and
  `global using Blocks.Entities` → ≥1 hit (the scoped, implementable form of the namespace check — path
  refs like `ScaffoldCsprojFiles.md:24` don't match it); `AutoMapper|Mapperly` → 0 hits;
  `DispatchDomainEventsInterceptor` → ≥1 hit; `Data/Master` → ≥1 hit; lint exit 0.
Satisfies: feedback Entry "create-service"; verdict #5 (MERGE).

**6. Patch `create-grpc-contract` (4 defects).** Follow improve-skills.
Files: `create-grpc-contract/SKILL.md`, `workflows/Server.md`.
- Remove the error-mapping claim: no gRPC status-mapping interceptor exists (the standing gap is the
  `//todo` at the reference app's `JournalGrpcService.cs:11`) — state the honest current behavior.
- Fork the server repo method by persistence engine — `Server.md:14` currently hard-codes
  `FindByIdOrThrowAsync` as universal. **Precision (critic M4):** `FindByIdOrThrowAsync` is EF-only, but
  `GetByIdOrThrowAsync` exists on BOTH engines (`Blocks.EntityFrameworkCore/Extensions/RepositoryExtensions.cs:20`)
  — state "Redis-backed services must use `GetByIdOrThrowAsync`; `FindByIdOrThrowAsync` is EF-only", not
  an engine-exclusive pairing.
- Add the when-to-use decision layer up front: synchronous gRPC vs event-replicated local data vs event
  payload (the gate, before mechanics).
- Port note: gRPC client URLs target internal Docker ports, not the 44xx host ports.
- Accept: grep for the middleware/interceptor mapping claim → 0 hits; `Server.md` no longer presents
  `FindByIdOrThrowAsync` as universal (the EF-only qualifier + the Redis `GetByIdOrThrowAsync` variant
  both present); a when-to-use section before the phase mechanics; lint exit 0.
Satisfies: feedback Entry "create-grpc-contract"; verdict #8 (MERGE).

**7. Patch the spine cluster — `service-registration`, `central-package-management`,
`persistence-patterns` (9 defects).** Follow improve-skills.
Files: the three `SKILL.md`s.
- service-registration: behavior order **AssignUserId → Validation → Logging** (currently misordered);
  Application-less services register MassTransit/MediatR in the **API** layer; add the
  `TransactionalDispatchDomainEventsInterceptor` variant alongside the non-transactional one; replace
  foreign eShop examples with Articles-family examples.
- central-package-management: add the nested-props check ("find all `Directory.Packages.props`, expect
  exactly one at `src/` root" — nearest-wins override; live example `Review.API`); soften "one file, not
  per-project" from invariant to intended-state-plus-check.
- persistence-patterns: fix the configuration ladder to
  `AuditedEntityConfiguration<T> : AuditedEntityConfiguration<T,int> : EntityConfiguration<T,TKey>`; add
  the two spine rules (repository-as-unit-of-work base; type-keyed reference-data cache); replace
  SQLite/foreign examples with repo-grounded ones.
- Accept: grep service-registration for the behavior order listing AssignUserId first → 1 hit, old order →
  0, and `eShop|Catalog` foreign examples (`SKILL.md:164-176`) + `SQLite` (`:80-100`) → 0 hits (the
  eShop-removal check the feedback's Low bullet needs — critic PARTIAL); CPM skill for the
  **"expect exactly one"** discovery phrase → ≥1 hit (`Directory.Packages.props` alone already appears
  ~8× pre-fix and discriminates nothing); persistence-patterns for `AuditedEntityConfiguration<T,int>` →
  ≥1 hit and `SQLite` → 0 hits; lint exit 0 on all three.
Satisfies: feedback Entries "service-registration", "central-package-management", "persistence-patterns";
verdicts #9, #10 (MERGE).

**8. Replace the content of `create-domain-event-handler`.** Follow improve-skills (whole-content
consolidating rewrite; folder + `name:` unchanged).
File: `plugins/nexus-dotnet/skills/create-domain-event-handler/SKILL.md` + `workflows/Handler.md`
(keep, replace, or fold into SKILL.md — developer's call on final shape; lint decides nothing dangles).
Base content: `D:\src\dotnet-microservices\.claude\skills\domain-event-wiring\SKILL.md` (the Phase B
winner), genericized to the plugin's placeholder register.
- Binding correction the replacement must encode: the handler variant keys off the **registered
  `IDomainEventPublisher`** (the service's event bus), never the endpoint framework — with the Production
  counterexample (FastEndpoints endpoints, MediatR event bus).
- Carry the base's decision structure: publisher implementation, dispatch trigger (interceptor vs manual
  publish), interceptor flavor (post-save vs transactional), `{Effect}On{Event}Handler` naming +
  feature-folder placement.
- Scope fence: cross-service propagation → `add-integration-event`; design depth → `domain-patterns`.
  Write a fresh description for the plugin context — do **not** copy the local base's description verbatim
  (it was sharpened to win a discovery collision against this very skill).
- Cross-skill consistency (critic L3): the base states the dual-typed `IDomainEvent : INotification, IEvent`
  model (matches live source); `domain-patterns/SKILL.md:117-120` carries a light-stack
  `IDomainEvent : IEvent`-only claim. Reconcile so the two skills don't flatly contradict post-pass — if
  domain-patterns' light-stack annotation is a sanctioned family variant, keep it but name the variant
  axis explicitly in both; developer verifies which reading holds before wording it.
- Accept: grep for endpoint-framework-keyed variant selection → 0 hits; `IDomainEventPublisher` as the
  selection axis → ≥1 hit; both handler shapes (`INotificationHandler`/`Handle`,
  `IEventHandler`/`HandleAsync`) present; lint exit 0.
Satisfies: feedback Entry "create-domain-event-handler"; verdict #6 (keep-A/supersede → replace).

**9. Replace the content of `authorization-patterns`.** Follow improve-skills (whole-content consolidating
rewrite; folder + `name:` unchanged).
File: `plugins/nexus-dotnet/skills/authorization-patterns/SKILL.md`.
Base content: `D:\src\dotnet-microservices\.claude\skills\authorization-security\SKILL.md` (the Phase B
winner — "B contributes no correct fact A lacks").
- Binding corrections the replacement must encode: the real closed role vocabulary (no
  `UserRoleType.Editor`/`UserRoleType.Admin`/`Role.Admin` — fictional, currently at `SKILL.md:38,111`);
  policy registration keeps **both** layers (`RequireRole` + resource requirement); the legitimate
  single-layer case is **authentication-only read models** (ArticleHub-style), not role-only admin
  endpoints; the tenant variant is dropped or explicitly marked not-applicable to this stack.
- Carry the base's five-phase structure (role vocabulary, endpoint gate, resource check, identity
  stamping, JWT) at whatever depth fits the plugin register — developer's call on how much per-service
  bypass detail ports.
- Accept: grep for `UserRoleType\.(Editor|Admin)|Role\.Admin` → 0 hits; `RequireRole` present in the
  policy-registration guidance; "read model" single-layer characterization present, role-only-admin
  characterization absent; tenant variant absent or marked not-applicable; lint exit 0.
Satisfies: feedback Entry "authorization-patterns"; verdict #7 (keep-A/supersede → replace).

**10. Estate sweep, backlog, release.** Follow release-plugin. Run once, after Steps 1–9 all land (never
per-step — dev-repo CLAUDE.md bump rule).
- Full-estate lint: every `plugins/{nexus,nexus-dotnet,nexus-flutter}/skills/*` folder → exit 0; test
  suite `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` green (glob form — bare `tests/`
  regressed on Node ≥22).
- Skill-backlog: `## Skills Fixed` entries for the pass (consolidated or per-skill — developer's call),
  source `adhoc-DotnetFeedbackApply`; plus one `## Deferred`/backlog row for `create-module`'s shared
  staleness family (out of scope here, same defect class — `workflows/ScaffoldDomain.md:21,40-51`).
- Release: `node scripts/bump-plugin.mjs --dry-run` → tool proposes PATCH; **owner decides the tier at
  this step** — architect recommendation: MINOR (two skills' content replaced + a new decision layer =
  new capability; precedent: DotnetSkillSweep → 1.1.0). Bump in the same commit as the changes. Then
  `node scripts/gen-omni.mjs` + `--check` exit 0; omni twin commit follows the mirrored-subject
  convention.
- Accept: `bump-plugin.mjs --check` exit 0 on the staged tree; nexus-dotnet CHANGELOG top entry names the
  13 skills and the patch/replace split; `gen-omni.mjs --check` exit 0.
Satisfies: feedback file header (routing contract); ADR-9; ADR-23 (estate lint).

## Cross-Service Changes

None. Cross-**repo**: the consuming project marks its feedback file applied on its own next learner sweep
(out of scope, noted in Scope). The omni twin sync in Step 10 is the only downstream propagation.

## Migration Notes

N/A.

## Testing Strategy

No executable change — the regression gates are: (1) per-step grep-shaped acceptance (each defect's
absence/presence is a named grep above); (2) full-estate skill-lint exit 0 (ADR-23) after each step-group
and again at Step 10; (3) the repo test suite (lint + unit) green at Step 10; (4) the code-grounded Step 2
review reads the changed skill files against the consuming repo's live source.

## KB Impact

None — this repo keeps no `docs/kb/`. The skill estate itself is the artifact under change.

## Open Questions

None blocking. Review mode = **code-grounded critic** (user-confirmed; shared-artifact pass — the mandate
applies). Semver tier = owner decides at Step 10 (`--dry-run` first; architect recommends MINOR).

## Plan Review (critic, code-grounded, 2026-07-06)

Mode 2 ad-hoc plan review against the routed feedback file + verdict record + live plugin source + the
consuming repo's `src/`. **Disclosure:** this session's agent registry has no `critic` subagent type; the
review ran as a read-only `general-purpose` agent with the critic's Mode-2 charter (fresh context,
code-grounded, no writes) — independence preserved, provenance noted. Verdict: **REVISE** — coverage
43/45 COVERED, 2 PARTIAL, 0 MISSING; every plan-cited file:line verified exact; 12 consuming-repo proofs
re-verified live (behavior order, `ApplicationDbContext` ctor, MassTransit placement incl. the Production
counterexample, `Data/Master`, csproj-name divergence, the `//todo` interceptor gap, RefreshToken throw
site, transactional interceptor, `Send.OkAsync`, config ladder, EF-provider placement, nested
`Review.API` props). One HIGH + four MEDIUM + three LOW folded in:

- **H1 (folded, Step 5 + Context).** The `Blocks\.Domain(?!\\)` acceptance was unimplementable (PCRE-only,
  path false-positives) and over-corrective — `Blocks.Domain`/`Blocks.Domain.Entities` are real live
  namespaces; only `Blocks.Domain.ValueObjects` is fictional. Fixed: substitution scoped to the
  GlobalUsings/namespace template blocks; acceptance rewritten as `global using`-anchored greps; the
  feedback entry's blanket namespace bullet recorded as amended in Context.
- **M1 (folded, Step 4).** "Remove wire-settable `CreatedById`" + 0-hits grep pushed toward deleting a
  property the `IAuditableAction` template requires. Fixed: keep-but-wire-protect (`[JsonIgnore]` /
  base-record stamping), acceptance keyed to protected occurrences.
- **M2 (folded, Step 4).** Acceptance grep `SendOkAsync|SendAsync\(` missed `SendUnauthorizedAsync()`
  (`EndpointFastEndpoints.md:95`). Fixed: `Send[A-Z]\w*Async` legacy-form grep + migrate-don't-delete
  note for line 95.
- **M3 (folded, Step 1).** Bare `rich → 0 hits` acceptance would force deleting the valid Rich-Consumer
  shape heading (`Consumer.md:36`). Fixed: acceptance targets the placement keying only.
- **M4 (folded, Step 6).** The EF/Redis fork risked a new false claim — `GetByIdOrThrowAsync` exists on
  BOTH engines. Fixed: "FindByIdOrThrowAsync is EF-only" phrasing, no engine-exclusive pairing.
- **L1 (folded, Steps 2, 7).** Two ≥1 acceptance greps were non-discriminating (`MapStatusCode` and
  `Directory.Packages.props` already hit pre-fix). Fixed: recipe-scoped / phrase-scoped greps.
- **L2 (folded, Step 4).** Forward reference to Step 9's replaced text clarified — correctness rests on
  the binding two-layer rule; both land in one release commit.
- **L3 (folded, Step 8).** `IDomainEvent` dual-typed model vs domain-patterns' light-stack claim —
  reconciliation bullet added (variant-axis-aware, developer verifies).
- **2 PARTIALs (folded, Steps 4, 7).** The Send-sweep acceptance now covers all legacy forms (M2); the
  eShop/SQLite foreign-example removal in service-registration now has an acceptance grep.

Checked clean (no change needed): all cited file:lines; Step 3's `IAction[^a-zA-Z]` grep (exactly the 3
sites estate-wide, no `IArticleAction` collision); Step 9's role-identifier grep (real vocabulary
confirmed at `Role.cs:8-17`; the fictional identifiers confirmed fictional); Steps 8–9 keep-name
constraint (only in-plugin xref is `add-integration-event`'s scope fence, preserved); Step 10 vs the
dev-repo release rules (single bump, owner-escalated tier, gen-omni, no gen-commands); defect counts sum
to 45 and match the Skill Mapping; the create-module exclusion (defects confirmed live, backlog row
planned).
