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
- **Description:** User-invocable nexus-core utility (`/nexus:distill-prompt`, `disable-model-invocation: true`). Rewrites a verbose/underspecified prompt into a tight one without dropping load-bearing requirements — 7-stage method (extract core ask → inventory keep-list → hold lossless rule → cut padding → surface/never-invent gaps → restructure + Cut/Still-ambiguous note), grounded in canonical Anthropic prompt-engineering structure (claude-api). Step-2 evaluate-skill verdict ACCEPT (`docs/skill-evals/2026-06-20-distill-prompt.md`); improve-skills consolidating pass ran and applied **no change** — sole finding was a keep-as-is LOW (lossless rule has one normative owner in stage 4; already AP3-compliant, no net-complexity reduction available). skill-lint exit 0.
- **Date:** 2026-06-20

---

## Skills Fixed

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
