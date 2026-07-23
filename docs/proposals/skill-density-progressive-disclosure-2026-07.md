# Proposal — Skill density: progressive disclosure + a mine dispatcher (round-4 cat-8 remedy)

**Status:** Draft
**Decision-maker:** Laurentiu
**Recommendation:** Split the largest mine-family SKILL.md protocols into on-demand per-phase
reference files (skill body = trigger + phase map + invariants only) and add one `mine` dispatcher
skill that routes to the right member and assembles the multi-skill sequence for non-cover members.
**Confidence:** Medium — rests on one unconfirmed assumption: that an executing agent reliably loads
the phase file at each phase boundary instead of improvising from the summary (needs a pilot on one
member before ratification).
**Impact:** 6
**Effort:** med
**Date:** 2026-07-23

## Need

Round-4 blind eval locked Operability & DX at **7 vs VWH's 8** (`docs/research/2026-07-22-mine-family-vs-vwh-round4-eval.md` §2 cat 8),
naming two concrete costs:

- **Per-invocation cognitive load.** `mine-verify-cover/SKILL.md` is **545 lines** of multi-phase
  protocol (clean-room rules, skeptic gates, mutation thresholds, failure branches); the top skills
  run ~250–320 lines each (~5,900 lines across the plugin's SKILL.md estate). The whole protocol is
  front-loaded into context to execute any one phase. VWH's contrast: rules surface per phase via
  kernel nudges, when they apply.
- **Operator-assembled orchestration.** Non-cover members (repo mine → design brief → regenerate,
  etc.) have no entry point; the operator hand-sequences skills and hand-carries outputs between them.

Out of scope: changing any protocol *content* (the rules are load-bearing gates, confirmed by the
eval's cat 1/2 scores); the doctor-style env-preflight borrow (tracked in the round-4 doc §4 backlog).

## Approach

1. **Progressive disclosure per member.** Each dense SKILL.md keeps: trigger, invariants
   (clean-room, anti-self-mine, evidence rules), and a phase map. Each phase's full procedure moves
   to `references/phase-N-<name>.md`, loaded at that phase boundary. The skill instructs: "do not
   start phase N without reading its file" — the same pattern the format already uses for
   per-stack adapters.
2. **One `mine` dispatcher skill.** Input: what the operator wants (rules for a class / debt for a
   repo / a design brief / regeneration). Output: routes to the member, or for multi-member lanes
   emits the sequence with each step's inputs/outputs pinned — killing the hand-assembly.
3. **Line-budget lint.** Extend the existing skill-lint with a soft budget (~250 lines) on SKILL.md
   bodies so density regressions surface mechanically.

Pilot on one member first (`mine-verify-cover`, the densest), measure fidelity (does a cold run
still pass its own gates?), then roll out.

## Benefits

- Cat 8 path to 8–9: lower context burn per run, fewer operator sequencing errors, faster onboarding.
- Phase files become independently editable (the edit-shipped-skill recipe touches one phase, not a
  545-line monolith).
- The dispatcher is the natural home for the future doctor-style preflight borrow.

## Alternatives

- **Leave as-is.** The runbooks are candid and complete; density is a reading cost, not a
  correctness bug. Rejected: two independent eval rounds priced it at −1 category point, and the
  estate keeps growing.
- **Cut protocol content to shorten files.** Rejected: the rules are the enforcement perimeter
  (cat 1/2 strength); shrinking content trades correctness for readability.
- **VWH-style runtime nudger (CLI kernel surfacing rules per phase).** Rejected for nexus: no
  persistent kernel process exists in the skill-invocation model; file-layered disclosure achieves
  the same without new machinery.

## Unresolved

- Does phase-file loading survive a cold, uncoached run? (The confidence gate — pilot required.)
- Dispatcher granularity: one `mine` skill, or one per stack plugin?
- Where does the line budget live — skill-lint rule or release-plugin check?

## Provenance

Round-4 blind evaluation (2026-07-22, orchestrator session 2026-07-23); evaluator-M DX findings +
skeptic-confirmed line counts; discussed with Laurentiu 2026-07-23.
