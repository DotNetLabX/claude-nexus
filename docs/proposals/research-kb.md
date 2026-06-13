# Proposal P2 — The research-KB: local-first search, entry schema, output format

**Status:** Draft (overview: `research-system-overview.md`).
**Confidence:** **High** on the schema (ported from a proven design) and the local-first rule;
**Medium** on researcher-as-skill vs. agent.
**Priority:** 2 (after P1's trigger).

## Decision

### a. `search-researches` — local-first (the load-bearing primitive)
Every PO/architect research call routes through one skill: **search the local pool first, then the
web.** This is what makes research *compound* instead of *repeat*. Recall key = the **question** an
entry answers. Local hit → read it (subject to validity); miss or stale hit → research and write a new
entry. Pool: `docs/kb/research/{topic}.md`.

### b. Entry schema — ported from `build-persona`, not invented
`kb-entry-schema` + the persona discipline. Each entry carries:
- **Question answered** (recall key) · **Verdict** · **Evidence tier** (ran-it / read-docs / inferred)
  · **As-of date + validity scope** (the versions/context it holds for) · **Status**
  (`current | uncertain | superseded`) · **Reconfirm trigger** (what rots it).
- **Cite or drop** — primary sources, linked, or the row doesn't exist.
- **Supersede, don't delete** (build-persona Hard rule 8).

Two orthogonal axes, never collapsed: **heat** (reuse → ranking) and **validity** (freshness →
supersession). Cold ≠ wrong; stale = dangerous regardless of heat. (Lifecycle mechanics: **P3**.)

### c. Research-output format — the Stryker result is the reference shape
A research run (and its stored entry) produces, in order:
1. **Verdict** — and whether it *changes a prior verdict* ("NO-GO → very-likely-GO").
2. **Root cause / finding** — what's true, with the **correction to the prior assumption** named
   explicitly.
3. **The fix / answer** — concrete, testable steps.
4. **Alternatives considered** *(required — anti-confirmation-bias)* — what else was evaluated and why
   rejected. The question is framed **neutrally** ("what's the best way to achieve Y?"), **not** as
   hypothesis-confirmation ("does X work?"). This makes the owner's open question on the Stryker run —
   *did it explore or just validate?* — a structural requirement, not a hope.
5. **Honest caveat** — maturity, open issues that could still bite, the **confidence bound** ("very
   likely, not guaranteed").
6. **Fallback** — the rock-solid alternative if the primary fails (Stryker: xUnit v2).
7. **Primary sources** — linked.
8. **Recommendation + decisive next probe** — the cheapest test that confirms.

High-stakes findings want **independent corroboration** — the Stryker research cross-checked an agent's
result against the owner's own searches, agreeing on primary sources; same adversarial-verify ethos as
`deep-research` and the pipeline gates.

### Boundary (ADR-1) + agent-vs-skill
This ships in the pipeline → it is self-contained → it **cannot depend on `omc:document-specialist`**
(OMC, not shipped to consumers). Lead with a **skill** over the existing `deep-research` engine; promote
to a dedicated researcher agent only if it needs its own context budget (the **Medium-confidence** open
part of this proposal).

## Allocation
local-first rule + output format → the `search-researches` skill; entry schema → a skill sibling to
`kb-entry-schema`; consolidation → P3 (a learner mode).

## Builds on
`deep-research`, `kb-entry-schema`, ADR-1, ADR-17, omnishelf `build-persona` / `kb-sync`. Consumed by
P1; aged by P3.

## Provenance
Session `researcher-build-persona`, 2026-06-13. Output format reverse-engineered from this session's
Stryker research result.
