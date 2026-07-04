# adhoc-RulesRegistry — Lessons

## Architect Lessons

- **Grep-gate acceptance must be reconciled against actual grep output at plan time.** All five
  plan-review findings (2 HIGH, 2 MED, 1 LOW) shared one root: the edits were sound but the
  *acceptance assertions* were stated slightly wrong against what the greps really return — a
  self-colliding `docs/kb/golden` gate (the migration note must CONTAIN the string a sibling clause
  banned), a missed sanctioned hit (`docs/kb/index.md`), a missed second in-file reference (`:392`).
  Before writing a grep-based acceptance line, RUN the grep and enumerate the expected end-state hits
  as a whitelist; a "0 hits" gate coexisting with a "must name the old location" requirement needs a
  directive-form/bare-form split.
- **Shipped-text self-containment is a plan-time check, not a review-time catch.** Steps directing
  shipped-skill edits must never resolve load-bearing definitions through dev-repo-only documents
  (tech-spec contracts, ADR numbers). Rule of thumb: for every reference a plan tells a shipped file
  to carry, ask "does the consuming repo receive the referent?" — if not, inline the definition in
  ONE shipped file and point everything else at that.
- **Code-grounded critic ROI confirmed twice in one arc:** spec pass (2 HIGH — species ambiguity,
  grammar-vs-artifact mismatch) and plan pass (2 HIGH above); every HIGH was findable only by reading
  live source/running greps, none by doc-conformance review. For shared-artifact passes the mandate
  earns its cost.
- **Bash sandbox fabricated an external-repo directory listing** (showed `docs/business-rules/`
  populated in omnivision before it existed); PowerShell refuted it. Encoded as a binding execution
  constraint in the plan header (PowerShell for all external-repo filesystem facts). Also saved to
  session memory.

### Improvement Proposal (optional, for systemic issues)
**Target:** `plugins/nexus/skills/create-implementation-plan/SKILL.md` (Plan Grounding & Deviation Rules)
**Change:** add the two rules above: (1) grep-gate acceptance lines are written from an executed grep
with an enumerated expected-hits whitelist, never from memory of the intended end state; (2)
shipped-text self-containment — a plan step editing a shipped file must verify every reference it
introduces resolves within shipped artifacts.
**Evidence:** [adhoc-RulesRegistry]
**Priority:** medium
