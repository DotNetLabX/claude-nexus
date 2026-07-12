# F2-AdhocIsSoloOnly — Summary

Mode: architect-led fast lane

## Status: COMPLETE

## What Was Built

The lane rule (ADR-58) baked into the shipped nexus plugin: any unit of work shaped with the PO or designed with the architect — regardless of source — is a **feature** (`F{N}`/tracker slug + `docs/backlog.md` row); `adhoc-{Name}` is the **solo-only** lane, with stop-and-hand-back re-slug guards at the architect and team-lead entry points.

## Key Outcomes

- 18 shipped files modified: `rules/agents-workflow.md` (canonical Lane rule), 8 agent files (converged slug-line annotation + 4 role-specific edits), 8 regenerated commands, `plugin.json` + `CHANGELOG.md` (MINOR bump 1.31.1 → 1.32.0). Delivery artifacts: plan, implementation, review, lessons, summary.
- 510/510 tests pass; `claude plugin validate --strict` pass; convergence lint green.
- Plan review: code-grounded critic **ACCEPT** (3 MEDIUMs, fixed pre-dispatch). Implementation review: baked-in prose pass, 3 findings folded in-round + 1 boy-scout fix; done-check **PASS**, 0 fix cycles.

## Deviations from Plan

- omni twin regeneration deferred at implementation time per the plan's own dirty-tree guard (`Deviated (valid reason)`); resolved at lane close — see Notes.
- One prose-review finder subagent never reported; its angle set was covered by a disclosed in-context fallback (sanctioned pattern).

## Notes

- Definition is ADR-collapsed (ADR-58); `docs/backlog.md`'s lifecycle header was widened accordingly (its old ratified-only wording would have rejected this feature's own row).
- Existing `adhoc-*` history is grandfathered; stale "ad-hoc" wording in `create-implementation-plan` and the mine-family skills is explicitly deferred (superseded-on-next-open, ADR-58 Tradeoffs).
- Consumers pick the rule up via `/plugin update` (version-keyed cache; hence the bump).
