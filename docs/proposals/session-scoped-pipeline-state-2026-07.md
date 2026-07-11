# Proposal — Session-scoped pipeline state & audit attribution

**Status:** Draft
**Decision-maker:** Laurentiu (repo owner)
**Recommendation:** Key `.claude/.pipeline-state` (and the audit surfaces that trust it) by session id + worktree, and make the boundary detector / verify gate attribute events to the run that produced them
**Confidence:** High — every load-bearing fact below is measured in this repo's own audit logs across 8+ runs; the session-keyed `.personas.json` is the in-repo precedent for the fix shape
**Impact:** 7
**Effort:** med
**Date:** 2026-07-11

## Need

`.claude/.pipeline-state` is a single flat file per working tree with no session identity. With two
concurrent pipelines (now the *normal* condition in this repo), the gate and audit trail cannot
attribute writes to a run:

- A concurrent session's `architect:analyze` state false-tripped the source-write gate inside an
  unrelated worktree run (tracked as CPA-11; recurred verbatim on the next adapter run).
- Two runs at the same phase produce token coincidences — live write collisions on the state file
  were observed at phase transitions, with correctness preserved only by luck (token happened to match).
- The boundary detector doesn't normalize `-N` agent-name suffixes or scope by session: it flagged a
  developer writing its **own** `implementation.md` as a foreign-role write, and flagged a parallel
  session's files against this one.
- The verify gate resolves the role from the SubagentStop payload's `agent_type`; a **resumed** agent
  can present no `agent_type`, so the verify set silently skips on a resumed developer — a real gap
  in unattended mode.

Out of scope: the team-lead-level concurrency *policy* (worktree-or-serialize at launch) — that
shipped as prose in the 2026-07-11 learner consolidation; this proposal is the deterministic root-cause
half.

## Approach

- Make the pipeline-state file session-scoped (session id + worktree path in the record, or a
  per-session file with a SessionStart self-heal), mirroring the session-keyed `.personas.json`
  design the estate already ships.
- `pipeline-gate.js` honors only state belonging to its own session/worktree; foreign state is
  ignored, not trusted and not clobbered.
- `boundary-detector.js` normalizes `-N` spawn-name suffixes, records session id per line, and checks
  ownership against the normalized role.
- The verify gate falls back to a durable role source (the roster/persona record) when a resumed
  agent's stop payload lacks `agent_type`, instead of silently skipping — and the known
  expected-RED (`gen-omni --check` mid-feature) is classified rather than deferred on unattended runs.

## Benefits

Kills the whole recurrence class (8+ runs' worth of triage): no cross-session gate false positives,
no unattributable state writes, honest violations.log lines usable as evidence, and unattended runs
that neither skip verification on resume nor defer on a documented false positive.

## Alternatives

- **Prose-only guidance (status quo after the 2026-07-11 consolidation):** the team-lead launch
  guard reduces exposure but decays and doesn't fix attribution — the audit trail stays untrustworthy
  under concurrency.
- **A commit mutex / lock file:** serializes commits but not state reads; doesn't fix attribution or
  the verify-gate resume gap; adds a new stale-lock failure mode.
- **Forbid concurrent runs outright:** contradicts observed practice (the owner deliberately runs
  parallel features) and wastes the worktree isolation the platform already offers.

## Unresolved

- Migration: does old flat-file state self-heal on first read (SessionStart prune), or is a one-time
  manual reset acceptable?
- Should the verify-gate fallback role source be `.personas.json`, the fleet roster, or the
  communication-log header?

## Provenance

Learner consolidation 2026-07-11. Evidence: adhoc-MineVerifyCppAdapter (CPA-11, tracked),
adhoc-MineVerifyPhpAdapter (2nd occurrence), adhoc-ConclusionGateSemantics + adhoc-LearnerCadenceNudge
(live write collision, commit race), adhoc-UnattendedAutonomy (R6 name-suffix false positives),
adhoc-RecipeEstateAudit (implementation.md owner false positive), adhoc-SddCoverageLoop (resumed-agent
verify skip), adhoc-SkillEstateConsolidation (violations.log absent in worktree).
