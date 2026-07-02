# Lessons — adhoc-SddCoverageLoop

## Architect Lessons

- **Don't build composition/reuse claims from a harness's self-description.** The first tech-spec drew its
  "spec-cover just needs retargeting" thesis from file headers, ADR labels, and the loop-diagram vocabulary —
  a code-grounded critic caught a CRITICAL (spec-cover is validator-shaped; the pilot target is a numeric
  calculator, so the spec-load prompt / test model / runner schema / FP-labeler don't transfer) + 5 HIGH.
  Trace the actual agent prompts, return schemas, and the target class's real API before claiming reuse.
- **For a spec-vs-code diff, verify the JOIN KEY exists.** `spec-diff.mjs` matches rules by NAME. Two *blind*
  arms with different id spaces (code arm `BR-N`, spec arm authored names) never intersect → `both-agree` is
  empty by construction and `code∧¬spec` is falsely inflated. A comparison harness needs an explicit
  rule-identity reconciliation (a post-hoc crosswalk applied *outside* the blind runs, to preserve
  independence) whenever the two sides don't already share a canonical name space. This was the plan's
  near-critical gap.
- **"Passes the contract test" is a real acceptance only if the new file is REGISTERED.**
  `workflow-contract.test.mjs` is a hard-coded registry, not a globber — a new workflow is tested by nothing
  until added. An acceptance criterion that reads as green while testing nothing is a false-green trap; the
  plan step must include the registry edit.
- **Operator-owed must cite the durable bar, not the tool surface.** "Steps need the Workflow tool the
  developer lacks" was wrong (the developer has all tools). The durable, correct reasons a live harness run is
  operator-owed: the consuming-project working-tree git write the developer is barred from, the live toolchain,
  and the isolated worktrees.
- **A code-grounded critic earns its cost on shared/harness artifacts.** Two passes (tech-spec, plan) each
  returned 1 near-critical + several HIGH that a doc-only pass would have missed — every finding rested on
  reading the live harness, not the doc. Worth the ~8 min each on this class of work.
