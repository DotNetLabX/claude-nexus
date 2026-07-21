# Agent Model Resume Q&A — Lessons

> **Learner disposition (2026-07-21 → nexus 1.39.2):** [APPLIED-PRIOR] all items — the stale resume-model doctrine was retired in-feature (nexus 1.38.3) and the plugin-first-fixes doctrine is in memory. Version-first triage of consuming-team reports: confirmed practice, recorded here.

## Solo Lessons
- Both halves of this investigation resolved to "known bug, already fixed in a later version" —
  the resume-model claim maps to Claude Code's pre-v2.1.211 silent model-reversion bug (fixed
  upstream, CHANGELOG v2.1.211), and the architect-doesn't-commit observation maps to the fast-lane
  close hardening shipped in nexus 1.33.1. When a consuming team reports plugin/harness misbehavior,
  ask for their `claude --version` and nexus plugin version *first* — the report is often a truthful
  observation of an already-patched defect.
- The stale behavior wasn't just the other team's folklore — it was OUR shipped doctrine:
  `team-lead.md` carried "model overrides do not survive resume" in two places (RUNTIME caveats +
  Pre-Flight 4b), written from a real pre-v2.1.211 measurement. Fixed in nexus 1.38.3. Owner
  doctrine confirmed this session: when a consuming team hits plugin-related confusion, the fix
  lands in the plugin ("here we tell them"), never as per-project advice.
- Research-pool recall worked as designed: the keyword grep surfaced the adjacent
  `claude-code-builtin-skill-model-pinning` entry (spawn-time model precedence), and judging it a
  miss for the *resume-time* question was correct — the new dive captured the missing half to
  `docs/kb/research/claude-code-subagent-resume-model.md`, so the pair now covers both spawn and
  resume model resolution.
