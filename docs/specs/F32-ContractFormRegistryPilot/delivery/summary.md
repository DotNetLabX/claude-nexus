# F32-ContractFormRegistryPilot (grammar half) — Summary

Mode: architect-led fast lane

## Status: COMPLETE (grammar half — the campaign-side pilot remains owed)

## What Was Built
- The optional `precondition:` registry row field (nexus 1.44.0): input assumptions under which a
  rule's outcome holds — mined never invented, never-blanket, zero-field registries stay valid.
  Consumers wired: the Cover test-writer (input construction) and regenerate-unit's generator
  (binding input-assumption contract). Research-backed (contracts close the implicit-input-
  assumption soundness gap, `spec-representation-and-equivalence-oracles.md`).

## Key Outcomes
- 2 skill files edited (grammar owner + consumer), MINOR bump 1.43.1 → 1.44.0 + CHANGELOG.
- Lint 589/0 (×2); plugin validate --strict passed; zero deviations.
- Plan review: code-grounded critic GO-with-fixes (1 MEDIUM — the plan's own bullet weight —
  folded pre-implementation). Done-check PASS, first cycle.

## Deviations from Plan
- None. (gen-omni twin sync deferred to lane close by rule; remains operator-owed — repo absent
  on this machine.)

## Notes
- **The pilot half is the row's point and is still owed:** re-author ONE P0-RC/FSD-class registry
  in contract form and regenerate vs the prose baseline — campaign-side session, after
  `/plugin update` to ≥1.44.0 there.
