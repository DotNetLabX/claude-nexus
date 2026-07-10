# Lessons — adhoc-ConclusionGateSemantics

## Architect Lessons

- **Never cap severity on an epistemic property — cap the attribution, not the impact.**
  [adhoc-ConclusionGateSemantics] The drafted `correlation-only → MEDIUM` cap silently broke the
  severity/confidence orthogonality: a ≥80-confidence data-loss finding with an unproven mechanism
  would have been forced non-blocking. The correct shape: the epistemic tag downgrades the *causal
  attribution* (→ Open Questions), while a directly-observed CRITICAL/HIGH impact keeps its floor.
  **How to apply:** when adding any verdict/grammar rule, check it against the artifact's existing
  axis model (severity = impact, confidence = certainty) before letting one axis act on the other.
- **When adding a rule beside an existing counting trigger, define the count's terms.**
  [adhoc-ConclusionGateSemantics] "Inconclusive stays alive" sat next to "3 hypotheses exhausted →
  escalate" and made "exhausted" ambiguous — a developer could defer a warranted escalation.
  One clause fixed it (escalation is a handoff, not a kill; inconclusive counts toward the
  trigger). Adjacent unchanged text is part of the change's semantic surface.
- **Executed-true AC greps paid off on first reuse.** [adhoc-ConclusionGateSemantics,
  adhoc-MineFamilyCore] Running the signature inventory pre-spec (and per-file-scoping where a
  collision existed) meant the critic found zero AC-feasibility defects this time — versus three
  HIGH on the previous slug. Second data point for the promoted practice.
