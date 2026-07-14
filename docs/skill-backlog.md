# Skill Backlog

Tracks every skill created or fixed by the learner/developer pipeline. One entry per action.

---

## Skills Created

### domain-service
- **Status:** Created
- **Type:** Gap
- **Source:** adhoc-Pass1-SkillRepair
- **Description:** Domain-layer service pattern for cross-aggregate computation. Pure by default, named by what it does, returns domain types/VOs, never API response DTOs. Narrow domain-owned read-port escape hatch for performance. Encodes ADR-005/006/010.
- **Date:** 2026-06-06

### central-package-management
- **Status:** Created
- **Type:** Gap
- **Source:** adhoc-Pass1-SkillRepair
- **Description:** Central Package Management setup and audit — Directory.Packages.props structure, migration recipe, three-form verification grep (inline Version=, child Version element, VersionOverride). Encodes ADR-013.
- **Date:** 2026-06-06

### framework-currency
- **Status:** Created
- **Type:** Gap
- **Source:** adhoc-Pass1-SkillRepair
- **Description:** General stack currency rule (ADR-012) plus FastEndpoints Send.* migration (ADR-011). Two-stage detection (unqualified endpoint calls → manual receiver inspection), full false-positive list (HttpClient.SendAsync, SignalR Clients.*.SendAsync), version-verify-against-installed caution. FastEndpoints 8.1.0 named as current worked example.
- **Date:** 2026-06-06

### distill-prompt
- **Status:** Created
- **Type:** Gap
- **Source:** adhoc-DistillPrompt
- **Superseded by the Fixed entry below (adhoc-DistillPromptContractFix) — the original build drifted from contract (this entry describes a verbose-prompt-sharpener; the real contract is conversation→reusable-prompt). Kept as the audit trail of what was first built.**
- **Description:** User-invocable nexus-core utility (`/nexus:distill-prompt`, `disable-model-invocation: true`). Rewrites a verbose/underspecified prompt into a tight one without dropping load-bearing requirements — 7-stage method (extract core ask → inventory keep-list → hold lossless rule → cut padding → surface/never-invent gaps → restructure + Cut/Still-ambiguous note), grounded in canonical Anthropic prompt-engineering structure (claude-api). Step-2 evaluate-skill verdict ACCEPT (`docs/skill-evals/2026-06-20-distill-prompt.md`); improve-skills consolidating pass ran and applied **no change** — sole finding was a keep-as-is LOW (lossless rule has one normative owner in stage 4; already AP3-compliant, no net-complexity reduction available). skill-lint exit 0.
- **Date:** 2026-06-20

### figma-to-flutter
- **Status:** Created
- **Type:** Gap (design-fidelity)
- **Source:** adhoc-FigmaToFlutterSkill
- **Description:** nexus-flutter design-fidelity skill (`/figma-to-flutter`, user-invocable). Maps a Figma node (via the Figma MCP — `get_design_context`/`get_metadata`/`get_screenshot`) to a pixel-accurate Flutter widget using this project's design-system primitives — `AppColors` tokens (no inline `Color(0x…)`), `AppText.*` (no raw `Text()`), `pxToW`/`pxToH` scaling (no raw px), lucide-first `AppIcons` — then verifies with a golden test against the Figma screenshot. Ported verbatim from omnishelf_flutter_app; omnishelf-family-specific by design. Grounded in the PD-5444 cycle-count card rebuild (eyeballed layouts → crashing card + wrong icons). Authored on the omni twin, relocated to nexus-flutter as source-of-truth (flows to the omni twin via gen-omni). skill-lint exit 0; evaluate-skill verdict ACCEPT (`docs/skill-evals/2026-06-30-figma-to-flutter.md`) — the gate added a scope fence, a prefix-agnostic Figma-MCP tool-load step, and a lessons-capture pointer. Plugin bump 0.1.3 → 0.2.0 (MINOR, owner-decided; new capability).
- **Date:** 2026-06-30

### add-state-machine
- **Status:** Created
- **Type:** Gap (port from project-local)
- **Source:** adhoc-SkillEstateConsolidation
- **Description:** nexus-dotnet skill, pattern-first port of the local `article-state-machine` (D2/D3). Data-driven state-transition validation for a write-side aggregate: cached `{Aggregate}StateTransition` seed table, `I{Aggregate}StateMachine` + `{Aggregate}StateMachineFactory` delegate, `ValidateStateTransition` guard as the first line of the state-mutation method, cache-backed + DbContext-backed DI variants. Articles material cited only inside `(reference app: …)` exemplar clauses. `domain-patterns` gained a build-recipe pointer. skill-lint exit 0; inline rubric (Layers 1–4) ACCEPT, no Critical/High.
- **Date:** 2026-07-07

### file-storage-patterns
- **Status:** Created
- **Type:** Gap (port from project-local)
- **Source:** adhoc-SkillEstateConsolidation
- **Description:** nexus-dotnet skill (+ `references/templates.md`), pattern-first port of the local `file-storage-patterns`. Pluggable file-storage module composition — provider choice per service, generic options-marker subclass as the DI key (no keyed DI), singleton-default + scoped-per-extra registration, compensating `TryDeleteAsync`, cross-stage byte migration, factory-vs-direct-injection decision. Kept the `## Verify` deterministic greps. Description neutralized; reference-model tags dropped. skill-lint exit 0; inline rubric ACCEPT.
- **Date:** 2026-07-07

### consumer-patterns
- **Status:** Created
- **Type:** Gap (port from project-local)
- **Source:** adhoc-SkillEstateConsolidation
- **Description:** nexus-dotnet skill (+ 3 references), pattern-first port of the local `consumer-patterns`. Five-phase MassTransit consumer shape, three-variant idempotency decision table (silent skip / throw-if-exists / ExistsAsync-return), reference-data hydration + shadow-row pair, projection-vs-write-side split. Delimited against `add-integration-event` (F6: this skill = author/edit an `IConsumer`; add-integration-event = propagate an event); `add-integration-event/workflows/Consumer.md` slimmed to wiring-only with a pointer. skill-lint exit 0; inline rubric ACCEPT.
- **Date:** 2026-07-07

### service-infra-conventions
- **Status:** Created
- **Type:** Gap (port from project-local)
- **Source:** adhoc-SkillEstateConsolidation
- **Description:** nexus-dotnet skill, pattern-first port of the local `service-infra-conventions` (recorded divergence from Phase B pairing #9 — ported as a new skill, not folded into `service-registration`). Ten cross-cutting-infra sections: segregated claims/route providers, scoped `RequestContext` + correlation chain, fail-fast options binding, default-interface derivations, MediatR pipeline order, JSON casing, GlobalUsings, private-field naming, framework-split validators. CPM section slimmed to a convention + pointer (mechanics owned by `central-package-management`, AP3). skill-lint exit 0; inline rubric ACCEPT.
- **Date:** 2026-07-07

### mine-algorithm
- **Status:** Created
- **Type:** Gap
- **Source:** adhoc-MineSkillAuthoring
- **Description:** The seventh mine — recognizes a hand-rolled algorithm as a canonical one and adjudicates a BR-conformance-gated replacement. Heavy archetype (thin SKILL.md orchestrator + `references/canonical-catalog.md` (frozen R2 catalog, CV/C++-instantiated availability field) + `references/equivalence-net.md` (frozen R1 route-by-output-type comparator recipe)). 3-stage method: clean-room problem characterization under a canonical-naming ban → 2-3 clean-room matchers (problem statement + catalog only, never source) → adversarial conformance adjudication with the deviation-triggered row re-grounding rule. Stage-0 HARD BLOCK: never self-mine the oracle (a missing/stale BR registry halts the run for a separate mine-verify-cover pass). Dependency-tier ranking (tier 0/1/2) so "not linked" is a tier assignment, never a rejection. Model tiers: sonnet lanes, opus gate. Graduated from the ratified `mine-algorithm-2026-07` proposal (2 validated pilots). skill-lint exit 0; evaluate-skill Judgment Gate ACCEPT, no Critical/High.
- **Date:** 2026-07-12

### mine-design
- **Status:** Created
- **Type:** Gap
- **Source:** adhoc-MineSkillAuthoring
- **Description:** The sixth mine — produces an evidence-cited design brief for one class/function. Heavy archetype (thin SKILL.md orchestrator + `references/decision-table.md` (decision table v2: 11 rows + deferred state-row + anti-moves + the three obligations, row-9 revised to "verify exception posture from build files") + `references/judge-protocol.md` (two-tier judge, authority-zero rule, geometric-median escalation ladder, distilled rejection exemplars)). 3-stage method: mechanical complexity census (9 fixed causes + flow-shape/mutation-fusion anchors) → 2-3 decision-table-constrained clean-room designers (no pattern without cited census rows) → blind, provenance-stripped, higher-tier reject-by-default judge (tier-1 grounding kill then tier-2 pairwise). Model tiers: sonnet lanes, opus gate. Graduated from the ratified `mine-design-2026-07` proposal (calibration pair + held-out pilot). skill-lint exit 0; evaluate-skill Judgment Gate found + folded one MEDIUM (a reserved `D5` contract placeholder → removed, net complexity down), re-lint exit 0, ACCEPT, no Critical/High.
- **Date:** 2026-07-12

---

## Skills Fixed

### Learner consolidation 2026-07-11 (multi-skill)
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-LearnerConsolidation2 (cross-run lessons sweep, 49 runs)
- **Description:** `create-implementation-plan` — executed-acceptance rule bundle (execute every pinned
  acceptance command at plan time, whitelist from real output, sibling-carve-out reconciliation,
  pair-hardening, structure-independent phrasing) + shipped-text self-containment.
  `release-plugin` — New-plugin ship checklist (no re-bump of authored 0.1.0, both gen-omni sites,
  both gen-omni.test sites, toolchain assets cite SKILL.md). `improve-skills` — skill-lint E9
  (colon-space in unquoted frontmatter value = error, aligns with `claude plugin validate --strict`)
  and `references/skill-recipe.md` E7/E8 lint-coverage claim corrected (comparator rephrasing is
  prose-only, not lint-enforced). Agent files: architect (tech-spec anchor grounding; fast-lane
  prose-diff review variant), team-lead (Pre-Flight concurrent-run guard). Deferred-to-proposal:
  estate-authoring skill (`docs/proposals/estate-authoring-skill-2026-07.md`, 3-occurrence gap).
- **Date:** 2026-07-11

### nexus-dotnet 1.3.1 feedback — 13-skill application (consolidated)
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-DotnetFeedbackApply
- **Description:** Applied the routed `dotnet-microservices` feedback file
  (`docs/plugin-feedback/nexus-dotnet-1.3.1-2026-07-05.md`, 13 entries / ~45 defects) + the recovered Phase-B
  verdict record. **11 patched:** `add-integration-event` (namespace-vs-folder trap, consumer-placement keyed
  off `AddMassTransitWithRabbitMQ` not complexity, `sealed` optional); `error-handling` (Result<T>/try-catch
  prohibitions, MapStatusCode recipe step, UnauthorizedException throw-site); aggregate cluster
  `create-aggregate`+`domain-patterns`+`cqrs-patterns` (action-always-last + Submission drift, VO `private`+
  `[JsonConstructor]` ctor, fictional `IAction`→`IArticleAction`); `create-feature` (Critical `SendOkAsync`→
  `Send.OkAsync`, wire-protected `CreatedById`, Carter mutate-then-assign, `:verb` routes, two-layer auth);
  `create-service` (10-defect staleness cluster — generic DbContext ctor, `Blocks.Entities` globals, uniform
  `AddApiServices`/`UseMiddleware` chain, MediatR behavior order, `DispatchDomainEventsInterceptor`, Mapster,
  csproj-name divergence, EF-provider→`.Persistence`, `https`+`Container` profiles, `Data/Master`+`Data/Test`);
  `create-grpc-contract` (no error-mapping interceptor honesty, `GetByIdOrThrowAsync` fork, when-to-use gate,
  Docker port note); spine cluster `service-registration`+`central-package-management`+`persistence-patterns`
  (behavior order, no-Application API-layer messaging, transactional interceptor variant, Articles examples;
  nested-props check; config ladder + repository-as-UoW/type-keyed-cache spine rules; SQLite dropped).
  **2 content-replaced** (verdicts #6/#7, keep-A supersede): `create-domain-event-handler` (from base
  `domain-event-wiring` — variant keys off `IDomainEventPublisher`, not the endpoint framework) and
  `authorization-patterns` (from base `authorization-security` — real closed `UserRoleType`/`Role` vocabulary,
  two-layer `RequireRoleAuthorization`, auth-only read-model single-layer case, tenant variant dropped).
  Every defect's live-source proof re-verified against `D:\dotnet-microservices` before editing; folder + `name:`
  frontmatter unchanged for all 13; per-skill + full-estate skill-lint exit 0; test suite 484 pass. Plugin bump
  nexus-dotnet 1.3.1 → 1.4.0 (MINOR, owner-confirmed — two skills' content replaced + new decision layers).
- **Date:** 2026-07-06

### improve-skills
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-UtilitySkillsHardening
- **Description:** Applied the routed dotnet-microservices utility-skill audit (Entries 1, 2, 4, 5, 6).
  Hardened the shipped `scripts/skill-lint.mjs` gate: **widened E6** to check file-shaped
  `scripts/`/`assets/` citations, each resolving skill-relative OR at the `.git`-anchored repo root
  (deterministic from any cwd — never `process.cwd()`); added two **WARN-only** canon checks — **W3**
  (SKILL.md body over 500 lines → progressive-disclosure split) and **W4** (a cited `references/*.md`
  that itself cites another reference → one-level-deep canon, references-only scope). Sanctioned a
  bundled `scripts/` folder element + named the degrees-of-freedom axis in `references/skill-recipe.md`
  §2, and synced the SKILL.md scaffold step + lint-scope sentence to the widened gate. 9 TDD cases added
  to `tests/unit/skill-lint.test.mjs` (25 total, green); full-estate lint sweep exit 0 — the two
  DO-NOT-BREAK sites (release-plugin repo-root `scripts/`, figma-to-flutter `assets/icons/`) stay clean.
  Plugin bump 1.23.1 → 1.24.0 (MINOR, owner-confirmed — two new gate capabilities + widened E6).
- **Date:** 2026-07-06

### evaluate-skill
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-UtilitySkillsHardening
- **Description:** Applied the audit's rubric-half (Entries 3, 5). `references/rubric.md`: deleted the
  Layer 0 dead-letter (item 6 "skills index" — the scripted layer's `skill-lint.mjs` has no index check;
  Layer 4.3 already owns index sync as judgment); synced Layer 0 item 4's folder list to the widened E6;
  softened item 3 to make the scripted (W1 thinness) vs judgment (Layer 1.1 "real prose, not the name
  repeated") boundary honest; added a Layer 2.2 degrees-of-freedom clause pointing at improve-skills'
  `skill-recipe.md` §2 in **prose** (no `references/`-prefixed path — that would trip the new W4).
  Consolidating pass, net complexity down (one item deleted). skill-lint exit 0. Ships in the nexus
  1.24.0 release tree (same bump as improve-skills).
- **Date:** 2026-07-06

### improve-skills
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-SkillAuthoringRecipe
- **Description:** Added `references/skill-recipe.md` (archetype decision / reusable-element
  menu / frontmatter cheat-sheet authoring recipe, extracted from omnishelf
  `SKILL_AND_AGENT_RECIPES.md` §0/§1/§4, nexus-grounded — examples swapped for real nexus
  skills, all 9 frontmatter fields fact-checked against live Claude Code Skills semantics via
  the `claude-code-guide` agent) + wired a pointer into "For New Project-Local Skills" steps 2
  and 4 (both authoring paths). Reference-not-restate throughout — no duplication of
  `proven-patterns.md` or the `skill-lint.mjs` gate. skill-lint exit 0. Plugin bump 1.22.0 →
  1.22.1 (PATCH, owner-confirmed — additive reference, not a new capability).
- **Date:** 2026-07-04

### distill-prompt
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-DistillPromptContractFix
- **Description:** Contract correction — whole-skill reframe from the drifted **verbose-prompt-sharpener** (see the superseded `Skills Created` entry) to its real graduated-proposal contract: **conversation/transcript → ONE reusable prompt + a short title**. Cardinal rule **inverted** from lossless / keep-values to **STRIP every run-specific data value** (categories, dates, brand/SKU names, IDs, sheet URLs, retrieved figures → generalized to role-descriptive prose) while **KEEPING the converged intent + final working approach**; added the inseparable-datum rule (generalize the role, flag the literal). **Prose-only** output (no `[placeholder]` parameterization — deferred, owner D1 2026-06-20). Source-agnostic transcript input; never auto-saved / nothing to disk; never-invent rule kept. Scope fence names **`learner`** (no recurrence threshold / approval gate / shared-source write — they compose) and **`improve-skills`** (distill output is ephemeral/in-conversation vs improve-skills' durable, stored, lint-gated SKILL.md) as the adjacent owners. Re-eval verdict **ACCEPT** against the corrected job statement (`docs/skill-evals/2026-06-20-distill-prompt-contractfix.md`); prior eval marked superseded (wrong job statement). skill-lint exit 0. Shipped inside the existing **1.16.1** release tree (Option A, owner-decided — no separate bump: distill-prompt's rewrite landed in the 1.16.1 tree, so it's documented under the existing `[1.16.1]` CHANGELOG entry rather than a phantom 1.17.0).
- **Date:** 2026-06-20

### analytics-computation-service
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-Pass1-SkillRepair
- **Description:** Whole-skill reframe as specialization of domain-service. Removed "Response records at the top of the file" (API response DTO coupling). Removed repository Exception clause (replaced with narrow domain-owned read-port). Relocated placement from API layer to Domain layer. Applied no-suffix naming rule. Encodes ADR-005/006/010.
- **Date:** 2026-06-06

### domain-patterns
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-Pass1-SkillRepair
- **Description:** Added "When to Use a Value Object vs a Flat Scalar" subsection (ADR-007 gap). Variant-annotated IDomainEventPublisher section (full-stack Blocks.MediatR vs light-stack Blocks.FastEndpoints variants). Variant-annotated State Machine Pattern section (Application/StateMachines/ full-stack vs no-Application-layer light-stack placement). No content scrubbed.
- **Date:** 2026-06-06

### create-implementation-plan
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-Pass3c-C-DevEpicAnalytics, adhoc-Pass4-IdentityExtraction, adhoc-Pass5-EventCorrectness (learner consolidation)
- **Description:** New "Plan Grounding & Deviation Rules" section (binding-vs-developer-free surfaces; hedge-is-a-deferred-read; counts-from-grep; trace contract fields to source DTO). Method-hiding sweep added to the enumerate-all-consumers refactoring rule.
- **Date:** 2026-06-10

### persistence-patterns
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-Pass5-EventCorrectness (learner consolidation; B7 improvement proposal)
- **Description:** `UpsertAsync` value-copy rule — EF `PropertyValues` overload, never `SetValues(object)`; backing-field (`PropertyAccessMode.Field`) shallow-copy hazard; cross-referenced owned/complex-type caveat.
- **Date:** 2026-06-10

### create-aggregate
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-Pass4-IdentityExtraction, adhoc-Pass5-EventCorrectness (learner consolidation)
- **Description:** Added "Promote an Existing Entity to an Aggregate Root (in place)" section — folded the promote-entity-to-aggregate gap into the existing skill per owner decision. Variant-aware (plain DDD vs ASP.NET Identity).
- **Date:** 2026-06-10

### Skill Estate Consolidation — re-registration + fold-upstream (consolidated)
- **Status:** Fixed
- **Type:** Fix
- **Source:** adhoc-SkillEstateConsolidation
- **Description:** **Step 5 (D3 re-registration):** `authorization-patterns` description + framing made pattern-first ("a role-based domain", was "the article lifecycle"); a top-level reference-app exemplar clause now attributes all `UserRoleType`/`Article*`/ArticleHub identifiers; content facts unchanged. `create-domain-event-handler` sweep = no-op (its only `article` token is `ArticleHub` inside a "Reference-app resolution" table). **Step 6 (fold-upstream of 9+1 overlapping locals):** the 1.4.0 fold held — overwhelmingly `already-upstream`. Seven fold-groups landed (targets: `add-integration-event` exclusive-publish-site rule + Verify greps; `create-feature/workflows/EndpointCarter.md` resource-check-location fix; `create-domain-event-handler` cross-cutting `EventHandlers/` exception + wiring verify-greps; `create-grpc-contract` handler-usage patterns + ProtoMember-permanence; `persistence-patterns` `EnumEntityConfiguration`/`MetadataConfiguration` ladder rungs + `MaxLength.C*` rule). Two contradictions (VO-ctor absolute; promote-in-place EF-config; UpsertAsync framing) resolve as shipped-is-correct — local stale wording superseded, not re-folded. Full disposition table in `docs/specs/adhoc-SkillEstateConsolidation/delivery/implementation.md`. All touched skills re-lint exit 0.
- **Date:** 2026-07-07

### mine-verify-flows
- **Status:** Created
- **Type:** Gap
- **Source:** adhoc-MineVerifyFlows graduation (OmniShelf pilot — 19 flows mined & code-verified, 3 flows golden-gated on-device through a real FFI SDK)
- **Description:** The flow-scoped mine (8th family member) — clean-room flow miners + skeptic re-trace + on-device Cover with a JSON golden gate and a per-flow sabotage check. Ships in `plugins/nexus/skills/mine-verify-flows/` (nexus 1.34.0) with family-core integration (8th table row, staging bullet, skeptic-protocol carve-out, member-count sweep seven → eight). Authored in the `omni` twin and ported back (`adhoc-MineVerifyFlowsPort`).
- **Date:** 2026-07-14

### mine-verify-flows-flutter
- **Status:** Created
- **Type:** Gap
- **Source:** adhoc-MineVerifyFlows graduation (same pilot)
- **Description:** The Dart/Flutter adapter filling the method's 5 device-toolchain capabilities — `flutter drive --keep-app-running`, the two-hop adb golden bless, docs-dir pre/post capture, the pure-Dart golden module, harness bringup + fixture-soundness greps. Ships in `plugins/nexus-flutter/skills/mine-verify-flows-flutter/` (nexus-flutter 0.4.0). Authored in the `omni` twin and ported back (`adhoc-MineVerifyFlowsPort`).
- **Date:** 2026-07-14

---

## Deferred

### create-module
- **Status:** Deferred
- **Type:** Fix
- **Source:** adhoc-DotnetFeedbackApply
- **Description:** Shares the `create-service` staleness family — `Blocks.Domain` GlobalUsings + `MasterData/`
  seed folder at `create-module/workflows/ScaffoldDomain.md:21,40-51` (same defect class as create-service's
  ScaffoldDomainProject/ScaffoldFolders). **Not** in the routed nexus-dotnet 1.3.1 feedback file, so out of
  scope for this pass (the feedback's 13 entries are the acceptance checklist). Fix when a feedback pass covers
  it, or as a follow-up ad-hoc: mirror the create-service Step-5 corrections (`Blocks.Entities` globals,
  `Data/Master`+`Data/Test`).
- **Date:** 2026-07-06

### Fold-upstream residual patterns (adhoc-SkillEstateConsolidation Step 6)
- **Status:** Deferred
- **Type:** Fix
- **Source:** adhoc-SkillEstateConsolidation
- **Description:** Genuine, portable local-only patterns identified in the Step-6 fold-upstream diff but deferred (larger/lower-priority folds, not drops — recorded here so the mining is not lost, D2). **persistence-patterns:** the caching implementation cluster (`ICacheable` marker + `GetOrCreateByType`, `CachedRepository`, `DatabaseCacheLoader` prewarm, `UnTrackCacheableEntities`) — the *concept* (type-keyed reference data) is already upstream; the impl cluster is a coherent future "Caching" section. Also `{Svc}DbContext`-not-`AppDbContext` check, no-per-repo-interface guardrail, `UseEntityTypeNamesAsTables` + engine-conditional snake_case table naming. **error-handling:** repository `*OrThrow` family docs, "two not-found spellings, don't add a third" + `SingleOrThrow` discipline, DomainException-subclass-needs-no-switch-arm. **create-feature:** Mapster inheritance/VO-factory idioms, FastEndpoints `[AllowFileUploads]`, Minimal-API `[AsParameters]` query binding. **create-service:** two layering verify-greps, Postgres snake_case rewriter, Redis Domain-csproj branch. **create-aggregate:** EF-vs-Redis variant-decision heuristic, AddDomainEvent-exclusivity rule, two Domain-layer verify-greps. **authorization-patterns:** JWT `RequireHttpsMetadata=false`/`SaveToken=true` knobs, Minimal-API filter `CreatedById==default` guard. Full per-item disposition: implementation.md Step-6 table.
- **Date:** 2026-07-07
