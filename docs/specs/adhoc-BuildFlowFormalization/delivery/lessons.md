# Build-Flow Formalization — Lessons

## Architect Lessons

- **A "formalize the flow" pass is overwhelmingly definitional, not code.** The research had already
  *decided* most items (§8); the plan's real risk was scope creep (R6 harness) and collision with the
  systems it consumes (P1/P2/P3) — not implementation difficulty. The four Phase-1 questions that mattered
  were all scope/ownership forks, not technical unknowns. Right call to surface them before planning rather
  than guess.

- **The hard constraint "consume, don't redefine" needs a *greppable* acceptance, not just a prose vow.**
  Step 1's acceptance includes "references P1/P2 by name AND copies no schema fields" as an explicit check.
  A reviewer can't catch a silent restatement of P2's schema from a prose "we reference P2" claim — the
  grep makes the boundary checkable.

- **Eating the dog food clarified two decisions.** (Q4) New ADRs land PROPOSED because the flow we're
  defining says the owner ratifies — and ADR-24 already set that precedent in the same register. (Step 2)
  The tech-spec *is* the "technical feature → tech-spec + extracted ADRs" example the R4 ADR prescribes.
  When a pass defines a process, applying that process to the pass's own artifacts resolves framing questions
  for free.

- **Shared-file edit races are avoidable by ownership, not ordering.** Both this pass and `adhoc-ResearchKB`
  conceptually touch research. Rather than impose a hard sequence, the plan assigns `research-before-asking.md`
  recall-edits to P2 and keeps this pass to *referencing* the P1 rule in the flow ADR — so neither edits a
  file the other owns. No ordering dependency, no race.

- **Optional-additive conventions must say "where present", never "every X must".** R5's `Satisfies: AC-n`
  could retro-fail every existing plan if written as a hard done-check gate. The plan binds it as
  optional/where-present and forbids the blanket-mandate phrasing — a recurring trap when adding a new
  annotation to an existing artifact format.

## Skill Gaps
- None new. `proposal-format` is created by this pass (Step 3) via `improve-skills`, closing the gap that
  proposals had no format skill (the ADR-4 sibling to `kb-entry-schema`).
