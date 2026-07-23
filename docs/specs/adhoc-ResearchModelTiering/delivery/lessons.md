# Research-Dive Model Tiering — Lessons

## Solo Lessons
- Model-policy recommendations must weigh **runtime availability, not just capability tiering**: the
  fable pin was right on capability grounds ("verdicts are load-bearing") but failed operationally —
  on the owner's plan, fable deep-research runs either died out of tokens or depleted the 5h quota
  (4h lockout), and unattended nobody recovers. The repo had exact precedent predicting this
  (the `sonnet[1m]` rollback after a credit error blocked Developer Phase 1, nexus CHANGELOG 1.9.x)
  — check CHANGELOG model-policy precedents before recommending a premium pin.
- Run mode (attended vs `[UNATTENDED]`) is a dimension the model-tier doctrine didn't carry — the
  asymmetry rule speaks to capability ordering, not plan-gating/quota resilience. The fix pattern:
  unattended → cheapest adequate tier always; attended → tier by stakes; top tier → human approval
  only, never auto-spawned.
- A user asking for an "interview question before the skill" was better served by an approval gate
  on the escalation path only — an unconditional interview blocks the unattended case it was meant
  to help, and the skill's existing stakes/depth classification already does the "evaluate per
  circumstances" half.

### Improvement Proposal (optional, for systemic issues)
**Target:** docs/programs/br-anchored-regeneration.md (tuning-knob estate census, queued campaign-1 P2)
**Change:** Add run-mode/quota-resilience as a census dimension for every model knob — each fable/opus
pin should record what happens when the tier is plan-gated or quota-exhausted mid-run.
**Evidence:** [adhoc-ResearchModelTiering]
**Priority:** medium

## Skill Gaps
- None — `edit-shipped-plugin-skill` fit the pass exactly (sweep, two-surface reconciliation, gates).
