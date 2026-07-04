# adhoc-RulesRegistry — Summary

## Status: COMPLETE

## What Was Built
- ADR-45's registry species split, increments 1+2: the two omnivision first-mover registries moved
  from `docs/kb/` to `docs/business-rules/{tracking,planogram}/` and converted to Contract R1
  annotated-bullet rows (41 + 18 rules), then the entire shipped estate re-pointed — cpp adapter
  contract, core `mine-verify-cover` grammar section (`## The rule registry`), `kb-entry-schema`
  species boundary, 3 agent hooks + regenerated commands.
- Released as nexus 1.21.1 and nexus-cpp 0.1.4 (both PATCH, per plan).

## Key Outcomes
- 2 repos touched: nexus (plugins + docs) and `D:\omnishelf\omnivision-ai-sdk` (registry move +
  mvc-report migration entry), external-repo facts PowerShell-verified throughout.
- Verification sweep green: 0 live ledger-path references; the 3 Step-6 greps re-run independently
  by the reviewer with identical results.
- Review: APPROVED after 1 fix cycle (reviewer APPROVED round 1 with 1 MEDIUM; Codex cross-check
  NO-GO reconciled finding-by-finding — 2 findings confirmed and fixed, 3 rejected with recorded
  rationale in communication-log.md #17 and review-codex.md).
- Verify gate: lint/unit + selfcheck pass except the expected `gen-omni --check` twin drift,
  resolved by the close-out twin sync.

## Deviations from Plan
- Step 6 Grep-3 returned 5 hits vs the plan's stated 4 — adjudicated valid (5th is immutable
  nexus-cpp CHANGELOG history); plan bullet amended by the architect at done-check to carry the
  CHANGELOG carve-out.

## Notes
- **Deferred successor-slice item (Codex-confirmed fact):** the merge-stage harness still defaults
  to the old registry path — `harness/merge.workflow.js:444` (`docs\kb\golden\{Class}.md`) and
  `harness/lib/rules-registry.mjs` table renderer + its unit tests. Out of scope here by the plan's
  Merge/Generate guard; belongs to the C2→C1/Merge rebase successor slice (tech-spec Out-of-scope).
- The Flutter repo's physical registry migration is owed on that repo's next touch (migration note
  shipped in the core skill).
- Omnivision repo edits are uncommitted in `D:\omnishelf\omnivision-ai-sdk` — commit there is the
  owner's call.
