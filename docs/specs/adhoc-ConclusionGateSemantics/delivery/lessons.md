# Lessons — adhoc-ConclusionGateSemantics

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [APPLIED] concurrent-feature worktree/serialize launch policy + developer-stops-team-lead-bumps (Improvement Proposal, with adhoc-LearnerCadenceNudge) → team-lead.md Pre-Flight 2 (Concurrent-run guard). Executed-true AC greps → confirming data point for the create-implementation-plan bundle (strengthened this pass). Shared .pipeline-state attribution → docs/proposals/session-scoped-pipeline-state-2026-07.md.

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
- **Done-check skill-conformance must key on session ID when two features share the tree.**
  [adhoc-ConclusionGateSemantics] Two concurrent developer sessions (this feature's `0b3a9544` and
  adhoc-LearnerCadenceNudge's `54db1d0c`) both logged `release-plugin` under the `developer:implement`
  token within ~40s of each other. Filtering by agent+token alone would have attributed the wrong
  invocation; the `session` field disambiguated. When a done-check runs against a shared-tree feature,
  scope the skill-invocations.log by the feature's developer **session**, not just the round token.

## Reviewer Lessons

- **Re-deriving grep counts from raw diff hunks (not just re-running the self-reported grep) catches
  a class of self-report error the grep re-run alone misses.** [adhoc-ConclusionGateSemantics] Both
  checks agreed here, but the two are not redundant: a grep re-run confirms the *final* count, while
  reading the actual `git diff` hunks confirms *how* that count was reached (e.g., whether a
  guardrail echo was deliberately worded to avoid double-counting, per critic F3). For a
  prose-only/grammar-sensitive feature, do both — the hunk read is what surfaces a phrase like
  "cause-variable" chosen specifically to keep a signature at exactly 1 hit.
- **"Additive only, no text removed or reworded" needs a literal diff read, not a self-report trust.**
  [adhoc-ConclusionGateSemantics] The plan's own step 1 instruction said to "extend" the gate line —
  which unavoidably swaps a trailing period for a continuation dash. Reading the raw hunk caught
  this exact byte-level change; it was correctly judged non-substantive (plan-sanctioned) rather than
  a violation, but the judgment call only exists because the diff was read, not assumed.

## Developer Lessons

- **A shared working tree with a concurrent feature breaks the release bump — stop, don't bump.**
  [adhoc-ConclusionGateSemantics] Mid-implementation, a second feature (adhoc-LearnerCadenceNudge)
  appeared in the same working tree; `bump-plugin.mjs` classifies the *whole* tree vs HEAD, so its
  dry-run reasons spanned both features' agent/command/hook files. Applying the bump would set
  `plugin.json` ahead of HEAD in the shared tree — the exact CLAUDE.md-documented false "already
  bumped, ride along" signal that makes the *other* developer skip their own bump (→ CI failure on
  the second commit) — and `gen-omni` would sweep the foreign files into my twin. Correct move:
  invoke release-plugin (skill-first), run only `--dry-run`, then defer the mutating bump to the
  team lead at commit time and flag the sequencing in questions.md. The bump is version-coupled to
  the commit; when two features share a tree, only the committer (who controls order) can pick the
  right patch number.

### Improvement Proposal (optional, for systemic issues)
**Target:** `plugins/nexus/agents/team-lead.md` (concurrent-feature launch policy)
**Change:** When launching a second pipeline feature while another is uncommitted in the working
tree, isolate it with `isolation: "worktree"` (or serialize the two), so each feature's
`bump-plugin.mjs` classification and `gen-omni` twin sync see only their own delta. A shared tree
silently entangles the release machinery across features.
**Evidence:** [adhoc-ConclusionGateSemantics] — bump dry-run reasons + `git diff --name-only HEAD`
showed adhoc-LearnerCadenceNudge's files interleaved with this feature's; the developer had to
defer Step 4 to avoid corrupting the parallel feature's bump.
**Priority:** medium
