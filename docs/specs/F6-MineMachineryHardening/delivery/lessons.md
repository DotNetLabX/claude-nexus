# F6-MineMachineryHardening — Lessons

## Architect Lessons

- **A "runs in CI" claim is a wiring fact — grep the invoker, never trust the invokee or repo prose.**
  The definition's CRITICAL (C1) came from the README §Known-limitations sentence claiming
  `selfcheck.mjs` is "gated by `plugin-release-check.yml`" — the workflow never invokes it. My own
  same-day grounding verified both files *exist* but not the wiring between them, and the false
  mechanism reached a ratified ADR before the critic caught it. Grounding an "X runs Y" anchor means
  grepping X for Y.
- **In a Workflow harness, prompts are not mechanisms — serializer functions are.** R2's acceptance
  originally targeted "the KB-writer prompt"; the row is actually built by a pure function
  (`buildRulesSection`) whose input mapping strips the very field the criterion cared about, so a
  prompt-grep acceptance could pass with zero behavioral change. Extends the existing "acceptance
  asserts the mechanism, not the surface" rule (`create-implementation-plan`) with the harness-specific
  trap: point acceptance at the composing function and the written artifact, never at prompt text.
- **A dev-repo reference implementation can have multiple homes for one mechanism** — the verify
  schema lives in both the delegated workflow (preferred path) and the caller's inline fallback.
  Any "harden/extend the schema" scope must enumerate all copies explicitly or the change lands only
  on the path that doesn't run.

### Improvement Proposal (optional, for systemic issues)
**Target:** `plugins/nexus/agents/architect.md` (technical-branch definition checkpoint)
**Change:** strengthen the definition-review guidance from "apply the shared-artifact mandate when
the tech-spec touches shared/external artifacts" to an explicit recommendation that the code-grounded
critic is the default for such tech-specs even when the author grounded the claims the same day —
author-grounding verifies anchors' existence, a fresh critic verifies their *wiring*.
**Evidence:** [F6-MineMachineryHardening] — definition review NO-GO with 1 CRITICAL (false CI
mechanism inside a just-extracted ADR) that same-session author grounding had missed.
**Priority:** medium
