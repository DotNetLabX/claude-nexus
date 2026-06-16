# Unattended Autonomy (v1) — Summary

## Status: COMPLETE

## What Was Built
An **additive "unattended mode"** for the nexus pipeline (ADR-30/31/32): a net-new `SubagentStop`
verify-gate hook (`verify-gate.js`) that runs the project's declared verify set and **records an
advisory verdict — never blocks** (ADR-31, confirmed by the CR-1 spike that a `SubagentStop` block
would trap a verify-failed subagent in a retry loop). Under `[UNATTENDED]` the team lead **consumes**
that verdict at its implementation-phase checkpoint and **fails closed → a structured, resumable
review queue** (ADR-32); attended behavior is unchanged, pinned by a golden regression test. Strictly
additive — a switch, not a rewrite.

## Key Outcomes
- **Files:** 4 created (`plugins/nexus/hooks/scripts/verify-gate.js`, `.claude/verify.json`,
  `tests/unit/verify-gate.test.mjs`, `tests/unit/attended-unchanged.golden.test.mjs`), 7 modified
  (`hooks.json`, `agents/team-lead.md`, `commands/team-lead.md`, `rules/agents-workflow.md`,
  `tests/lint/platform-contract.test.mjs`, `plugin.json`, `CHANGELOG.md`). Plus the generated `omni`
  twin (sibling repo, ADR-6, not in this repo's git).
- **Tests:** `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → **215/215 green** (was 177
  pre-feature; +38 incl. the 13-test gate suite, the AC-0.3 golden, the 3-check `SubagentStop`
  CONTRACT entry, and the detection-fallback empty-dir guard). Independently re-run by the architect
  (done-check), both Step-2 reviewers, and the team lead at close.
- **Live-verify (the HIGH-2 load-bearing unknown):** a real `nexus:developer` subagent was spawned and
  observed emitting `agent_type = nexus:developer` on `SubagentStop` (→ `developer` ∈ IMPL_ROLES). The
  gate keys correctly; the value is permanently tripwired by the `platform-contract.test.mjs` CONTRACT
  entry, with an `agent:"unknown"` runtime fallback if it ever changes.
- **Review:** Plan — critic Mode-2 **REVISE** → 6 findings folded → **ACCEPT**. Code (Standard+Codex) —
  nexus reviewer **APPROVED** ∥ Codex **GO**, both with no CRITICAL/HIGH, corroborating on the three
  highest-risk areas (agent_type matching, never-block, Q-D1 fail-closed scoping). One polish cycle
  applied 5 merged MED/LOW fixes. **0 reviewer↔developer change cycles** (cap 3).
- **Version:** MINOR bump → **1.13.0** (+ CHANGELOG, regenerated commands + omni twin).

## Deviations from Plan
- **Version 1.12.0→1.13.0, not the plan's literal 1.11.0→1.12.0** — `adhoc-NexusFleetView` shipped
  1.12.0 from a parallel session between plan-approval and implementation. The owner-set **MINOR tier
  is preserved**; only the number-line shifted. No owner decision required.
- **`solo` added to `IMPL_ROLES` alongside `developer`** (architect-sanctioned) — both write
  application source, so both are the verify boundary; excluding `solo` would blind-spot small fixes.
- **Q-D1 precision amendment (post-plan-approval):** the team-lead consumes the fail-defer **only at
  the implementation-phase verify checkpoint** (developer handed back `implementation.md`), never on an
  intermediate `developer:implement` `SubagentStop` — because red-test-authoring shares that token, so
  the discriminator is the checkpoint, not the token. Approval stood; not a re-open.

## Notes
- **Owner-owed validation outstanding (not run, by design):** the end-to-end `claude -p [UNATTENDED]`
  loop — verify-pass→advance AND verify-fail→**defer-to-`.claude/review-queue/`**→resume-at-failing-phase
  (ADR-19, not a cold restart). The in-session probe validated the *platform boundary*; the full
  fail-defer-resume loop needs the install updated (`/plugin update` to 1.13.0) and is an operator step.
- **Runtime issues this run (all recovered, see communication-log Runtime/Plugin Issues Log R1–R9):**
  multiple agent strands (critic, developer ×2) recovered via `salvage-transcript`/artifact at zero
  model tokens; one transient API 500 mid-finalization recovered by resume (no lost work);
  boundary-detector **false-positive ownership flags** from harness `-N` agent-name suffixes under
  parallel sessions (R6); cross-session notification noise from a shared `developer-2` name (R9); a
  pipeline-agent `git stash` diagnostic by developer-3 (ADR-18 breach, tree verified intact, no commit).
  None affected the deliverable. The two strongest learner asks: **scope agent identity/notifications &
  the boundary-detector role-match by session and normalize `-N` suffixes**, and **harden agents against
  stranding** (the artifact-first relay recovery held throughout).
- **selfcheck:** 2/4 until this commit — the gen-commands and gen-omni "drift" checks are
  `git diff`-based and resolve once the regenerated `commands/team-lead.md` + bump are committed
  **with** the change (this commit). Tests + bump-check pass.
- **Commit:** team-lead-owned, scoped to this feature's files only (the parallel `adhoc-NexusFleetView`
  changes were left untouched; no `git add -A`).
