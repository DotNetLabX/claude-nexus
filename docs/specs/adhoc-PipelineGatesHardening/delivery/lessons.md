# Pipeline Gates Hardening — Lessons

## Architect Lessons

- **Aged-finding re-grounding is the load-bearing discipline for hardening passes.** The prior plan draft was
  written against `docs/pipeline-hardening-findings.md` / the proposal, not the shipped tree — so it asserted
  `## Skills Used` and the done-check skill-conformance check were *missing* when both shipped in 1.5.0
  (`implementation-format/SKILL.md:22-28,56`; `architect.md:230`; `CHANGELOG.md:154-155`). The code-grounded
  critic caught it as CRITICAL-1. Confirms `architect.md:133/:201`: re-verify every aged finding against
  current source *before* scoping its fix. A doc-only review would have missed this entirely — the false
  premise is only visible by reading the live files.
- **Code-grounded critic >> doc-only critic for shared/external-artifact passes — empirically.** Every blocking
  finding (CRITICAL-1, HIGH-2, HIGH-3) was something only source/test-file reading surfaces: a shipped baseline,
  the guard.js anchored-regex house style, and a green test (`boundary-detector.test.mjs:76`) the plan would
  have silently regressed. The architect.md rule "code-grounded review is mandatory for shared/external-artifact
  passes" paid off concretely here.
- **A platform fact the gate hangs on must be a live-verify step, not a Confidence:high assumption.** The whole
  Gate A depends on the platform's `tool_name` for a Skill invocation, and nothing on disk proves it
  (`audit-logger.js` only picks `ti.skill` opportunistically from a broad `||` chain). Dropped Step 2 to
  Confidence: medium and made the live-verify the named highest-risk gate. General pattern: when a hook matcher
  keys on an unverified platform string, the gate is false-green if wrong — that is a low-confidence step.
- **One canonical list, referenced identically everywhere.** HIGH-2's root was the same git-verb list written
  three times (Scope / Step body / Acceptance) and drifting. The fix is to declare the list once and have every
  other location say "the canonical list" — the `create-implementation-plan` rule "a fix-every-file step derives
  from the *exact* grep in its acceptance" generalizes to "any enumerated set appears once."

### Improvement Proposal (optional, for systemic issues)
**Target:** `plugins/nexus/agents/architect.md` (Plan Workflow / done-check) — already covered by `:133`/`:201`;
no new rule needed. This pass is a *clean instance* of those rules working as intended via the code-grounded
critic, not a gap. No promotion owed — note for the learner as evidence that the code-grounded-critic mandate
prevents the aged-finding failure mode.
**Priority:** low (confirmation, not a new gap).
