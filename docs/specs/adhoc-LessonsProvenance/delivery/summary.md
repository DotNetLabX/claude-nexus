# adhoc-LessonsProvenance — Summary

## Status: COMPLETE

## What Was Built
- Adopted the provenance-tag + strengthen-don't-duplicate half of vwh-adoptions A6: lessons carry an
  `**Evidence:**` provenance tag (recurrence count = maturity), and the learner strengthens matching
  tracked entries instead of appending near-identical twins. The cosmetic "first-person voice" half
  was dropped by design (architect call — unproven value). Solo lane.

## Key Outcomes
- 2 plugin files modified: `plugins/nexus/skills/lessons-format/SKILL.md`, `plugins/nexus/agents/learner.md`
  (+ regenerated `commands/learner.md`, PATCH bump 1.18.1 → 1.18.2, CHANGELOG).
- Lint: 27/27 pass across the 6 lint suites.
- Shipped in `e7e5060`, released as nexus 1.18.2. All commit-time steps owed by implementation.md
  (bump, gen-commands regen) verifiably landed in that commit.

## Deviations from Plan
- First-person-voice half of A6 dropped by design (sanctioned).

## Notes
- Closure written retroactively 2026-07-03 by the team lead.
- The owed proposal-bookkeeping step (mark A6 delivered in `docs/proposals/vwh-adoptions-2026-06.md`)
  was still open at closure — applied 2026-07-03 alongside this summary.
- Omni-twin sync rides the batched twin regen (later nexus releases have since synced past 1.18.2).
