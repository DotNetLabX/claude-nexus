# Unattended Autonomy (v1) — Lessons

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [ROUTED-TO-PROPOSAL] R6/R9 boundary-detector -N-suffix normalization + session scoping → docs/proposals/session-scoped-pipeline-state-2026-07.md.

## Architect Lessons

- **A hook cannot read a launch-prompt token — that's an architectural constraint, not a detail.**
  The spec framed the verify gate as branching on `[UNATTENDED]`, but a hook is a separate process and
  `[UNATTENDED]` is prose the team-lead reads. This forced the gate to be *unconditionally advisory*
  with the entire mode fork in the team-lead. Surfacing this as a **binding interpretation** in the
  plan's Context (and flagging it for the critic) was the right move — the critic confirmed it against
  ADR-30's Tradeoffs with no drift. Lesson: when a spec says "the hook branches on the mode flag," check
  whether the flag is hook-visible *before* planning; it changes where the fork lives.

- **A spike that discards its only on-target run leaves a residual risk the plan must name.** The CR-1
  spike confirmed `SubagentStop` fires + carries `agent_type`, but it fell back to the built-in
  `general-purpose` subagent (the `--agents` custom registration failed) — so the literal
  `nexus:developer` string was never observed. I carried that honestly as `medium` confidence, but wrote
  the reconfirmation as optional ("if"). The critic correctly escalated it to a **mandatory blocking**
  live-verify + an unknown-agent fallback + a permanent `platform-contract.test.mjs` tripwire. Lesson:
  when a spike substitutes a stand-in for the real subject, the gap is load-bearing — make the
  reconfirmation blocking in the plan and pair it with a written-fallback, never a silent skip.

- **Phase-scoping by token can be necessary-but-insufficient — check for intra-phase collisions.** Q-D1:
  the developer proposed scoping the fail-defer to the `developer:implement` token, but red-test-authoring
  (TDD Step 1) runs under that *same* token, so a red-authoring `SubagentStop` (reds correctly failing)
  would record a `verdict:"fail"` that's a true-green. The real discriminator was the **checkpoint**
  (developer handed back implementation.md complete), not the token. Lesson: before keying a decision off
  a `.pipeline-state` token, ask "does any *other* activity share this token?" — here red-authoring and
  implementation both do, so the token alone can't gate.

### Improvement Proposal (optional, for systemic issues)
**Target:** `plugins/nexus/agents/architect.md` (or `create-implementation-plan` SKILL.md, Plan Grounding)
**Change:** Add a grounding rule: "When a plan keys a runtime decision off a `.pipeline-state` token or a
platform-supplied field (`agent_type`, `tool_name`), verify the field is (a) emitted in the relevant
context and (b) *unique* to the activity being gated — name any other phase/activity that shares the
same token/value, and move the discriminator to a unique signal if there is a collision."
**Evidence:** adhoc-UnattendedAutonomy Q-D1 (token collision: red-authoring vs implementation both
`developer:implement` → checkpoint-scoping) and HIGH-2 (the `agent_type` string was unverified for the
stop payload). Both were caught (one by the developer, one by the critic), but a grounding rule would
catch the class at plan-write time.
**Priority:** medium
