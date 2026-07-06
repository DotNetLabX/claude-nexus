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

---

## Skills Fixed

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
