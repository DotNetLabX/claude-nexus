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
