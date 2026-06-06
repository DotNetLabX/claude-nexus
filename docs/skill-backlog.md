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
