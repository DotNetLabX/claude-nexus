# Lessons — adhoc-LearnerConsolidationCommit

> **Learner disposition (2026-07-21 → nexus 1.39.2):** [APPLIED] (self-applied in-feature — re-ground inbound feedback text; agent-workflow-edit ripple surfaces). Both confirmed in practice by this consolidation; no further action.

## Solo Lessons

- **Re-ground inbound feedback text before pasting it in** — the proposed step 9 wording carried
  two fabrications and a rule conflict, all caught by grepping live source: (1) "ledger/tags" — no
  learner ledger artifact exists; the persisted state is the `[APPLIED]`/`[TRACKED]` tags in source
  lessons files; (2) "a guard hook blocks push" — `guard.js` blocks force-push always but plain
  `git push` only in hardened mode, so the step says "owner-owed, never push" without overclaiming;
  (3) an unconditional self-commit step would breach the team-lead-owns-commits hard rule when the
  learner runs as a team subagent — the step got the same standalone/subagent carve-out step 7
  (critic spawn) already uses, and `agents-workflow.md`'s "sole exception" line was updated in the
  same pass to stay consistent. **Evidence:** adhoc-LearnerConsolidationCommit
- **A workflow-step addition to an agent ripples to two other surfaces** — the generated
  `commands/{agent}.md` (gen-commands) and any always-on rule that enumerates the behavior the step
  changes (here: commit ownership in `agents-workflow.md`). Checking rule files for contradicted
  enumerations should be part of any agent-workflow edit. **Evidence:** adhoc-LearnerConsolidationCommit

## Skill Gaps

None — release-plugin machinery covered the flow.
