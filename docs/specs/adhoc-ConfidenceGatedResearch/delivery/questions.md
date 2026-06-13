# adhoc-ConfidenceGatedResearch — Questions

Phase 1 analysis of proposal P1 (`docs/proposals/research-confidence-gated.md`) against the ADR
register. Ad-hoc lane — no spec; binding input is the proposal + ADR-1/2/7/14/17 + the allocation
principle. Two genuine forks below; the rest are architect-owned design calls recorded in the plan.

## Q1: P1 / P2 scope boundary — does P1 persist research, or stay pure-behavioral?

**From:** architect
**To:** user
**Status:** Answered
**Step:** Phase 1 analysis

**Context:** P1 Decision 4 ("capture-before-surface") writes research findings to the research-KB —
but the research-KB (schema + the `search-researches` local-first skill) is **P2**, not yet built. So
P1's capture step has a forward dependency. Two coherent boundaries:
- **(a) Pure-behavioral.** P1 = the confidence→research branch + depth dial + assumption-derived
  confidence only. Research is surfaced inline as today, *not* persisted. All capture/recall waits for
  P2. Smallest surface; P1 is pure agent-prose. Cost: every research done between P1 and P2 evaporates,
  so P2 launches against an **empty pool**.
- **(b) Minimal capture.** P1 also writes findings to `docs/kb/research/{topic}.md` as a bare
  convention (no schema, no search yet — those are P2). Research persists from day one; P2 starts with
  a non-empty pool and adds the schema (additive frontmatter) + recall. Cost: front-loads the pool
  *location* decision (low risk — the path is already the proposal's, and P2's schema is additive).

**Question:** Should P1 include minimal capture (b), or defer all persistence to P2 (a)?

**Recommendation:** (b) minimal capture.
**Confidence:** medium — capture-before-surface is cheap and ADR-17-aligned, and a non-empty pool makes
P2 immediately useful; the only real cost is committing the pool path early, which is low-risk since
P2's schema is purely additive. The clean-architecture argument for (a) (keep P1 pure-prose) is real
but weaker than the "don't ship a research feature that forgets everything" argument.

### Answer
**(b) Minimal capture** — user-confirmed via AskUserQuestion, 2026-06-13. P1 adds the capture
convention (findings → `docs/kb/research/{topic}.md`); schema + search remain P2.

## Q2: Agent scope — which agents get the confidence→research branch?

**From:** architect
**To:** user
**Status:** Answered
**Step:** Phase 1 analysis

**Context:** P1 names **PO + architect**. But the motivating Stryker NO-GO happened in a
**solo / main-session-style** smoke test, not a PO/architect pipeline run — which is an argument that
**solo** is the lane most in need of this. The **developer** already has a different blocker path (the
`diagnose` skill + `questions.md`), so it's a weaker fit. Extending scope beyond the proposal's named
agents is a user decision (architect doesn't widen scope unasked).

**Question:** PO + architect only (as proposed), or also **solo**, or also **solo + developer**?

**Recommendation:** PO + architect + **solo**.
**Confidence:** high — solo is structurally the same decision-at-a-fork situation the Stryker run hit;
developer's blocker handling is already a separate, working mechanism and folding research into it
risks muddying two paths.

### Answer
**PO + architect + solo** — user-confirmed via AskUserQuestion, 2026-06-13. Developer stays out.

## Q3: Review mode

**From:** architect
**To:** user
**Status:** Answered
**Step:** Phase 1 → Phase 2 checkpoint

**Question:** Self-review or critic for the plan?

**Recommendation:** Critic — code-grounded (mandatory for plugin-source passes per the architect role).
**Confidence:** high — this pass edits live rule + agent files; a doc-only review is structurally blind
to whether the edits break surrounding rules.

### Answer
**Critic — code-grounded** — user-confirmed via AskUserQuestion, 2026-06-13.
