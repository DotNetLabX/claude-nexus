# Spec-Arm Trigger (mine-from-spec at spec-Ready) — Summary

## Status: COMPLETE

## What Was Built
- The `mine-from-spec` mode in `mine-verify-cover/SKILL.md` — Mine+Verify against a spec manifest
  (input-source axis, orthogonal to the depth modes): clean-room miners with a forbidden-path manifest,
  skeptic `verified | ambiguous` verdicts, the pinned `Spec-stamp` grammar (LF-normalized sha256, 12 hex),
  and the Execution-topology rule (orchestrator = spawning session; staged background `general-purpose`
  agents; never one delegated agent). SDD-lifecycle section reconciled: Mine+Verify-from-spec is
  shipped/ungated; only Cover-from-spec + the two-arm merge stay AC-6-gated.
- Pipeline wiring: `po.md` spec-review gate carries the batched "run mine-from-spec once Ready?" question
  (qualification gate: rule-shaped behavior; silence = default-skip); `architect.md` gained the net-new
  Technical-branch definition checkpoint (codifies the ADR-27 review-gate practice) with the same batched
  offer, the Phase-1 spec-rules join (stamp recompute + delta re-check, opportunistic never a barrier),
  the advisory `Satisfies: {ruleName}` guidance, and the done-check third referent;
  `create-implementation-plan` gained the `{ruleName}` referent (still optional/never-blanket);
  `team-lead.md` gained checkpoint surfacing/recording + the Mine-from-spec Dispatch subsection.
- Released as nexus **1.20.0** (MINOR, owner-escalated per OD-T3) with regenerated commands.
- Implements `adhoc-SddLifecycle` OD-L8/ADR-I; pulls the Mine+Verify half forward out of the AC-6 gate
  (amendment recorded in the SddLifecycle tech-spec).

## Key Outcomes
- **AC-T5 drill passed on first run:** mine-from-spec on the SddLifecycle tech-spec via the
  architect-gate path — 54 consolidated rules (144 miner rows, 3 miners + skeptic), 52 verified, 2
  ambiguous (both genuine spec findings), stamp `ab725d865a7f` reproducible, 3/3 citation grep-backs.
  Artifact: `docs/specs/adhoc-SddLifecycle/definition/spec-rules.md`.
- Review chain: spec critic (code-grounded, NO-GO → fixed), plan critic (REVISE → fixed), done-check PASS
  (all 8 steps Implemented), reviewer **APPROVED, 0 findings** (its one low-confidence open question
  dispositioned by the architect as intentional deferral — see lessons.md).
- Gates: `claude plugin validate --strict` exit 0; lint/unit green; selfcheck 4/5 (`gen-omni --check`
  expected-RED until the twin sync at commit).

## Deviations from Plan
- None. Step 7's main-session execution and Step 8's expected-RED twin-sync gate are plan-sanctioned.

## Notes
- Operator-owed, named: **AC-T6** — first consuming-repo run (KG or SR) on the next qualifying spec; it
  also live-exercises the PO-gate path. Team-mode technical-branch surfacing is explicitly deferred to
  the fold-in (spec Out-of-scope).
- Owner-AFK checkpoint: the plan-review-mode choice was auto-applied (code-grounded critic) at the 60s
  ask timeout, consistent with the owner's spec-review choice; recorded in plan.md.
