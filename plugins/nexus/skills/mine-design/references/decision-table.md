# Decision table v2 (mine-design Stage 2 constraint)

The fixed table a designer's proposal is constrained by. It maps a **census shape** (a cause the
Stage-1 census counted) to a **candidate move**. The rule that gives the method its value: a pattern
is legitimate only when it cites the census rows it eliminates — **no pattern without cited census
rows** (the anti-cosplay rule). The table holds at roughly **15 rows** (a standing growth cap); a new
row is a deliberate, census-anchored addition, never pattern accretion.

## The table

| # | census shape | candidate move |
|---|--------------|----------------|
| 1 | rule-shaped branching | Specification objects / an ordered rules pipeline; first-match-wins where precedence exists (Chain-of-Responsibility *semantics*, never CoR *structure*) |
| 2 | type-fork | Strategy per kind + a plain-map factory (not an abstract-factory hierarchy) |
| 3 | config-fork | resolve at the composition root (construction-time); inject config and kill mid-flight singleton reads |
| 4 | mapping-shaped | DTO + a versioned tolerant mapper at the format seam |
| 5 | decision fused with mutation | CQS split — pure rules, a single applier (functional core, imperative shell) |
| 6 | data-shaped branches | table-driven lookup; a Special Case object for sentinel categories |
| 7 | defensive re-validation | parse-don't-validate — validate once at entry into a type that cannot be invalid |
| 8 | absence-handling (legitimately optional) | define absence behavior **once**: a Null Object / neutral element at the source, a Special Case value, or a single entry gate; kill the per-site re-checks |
| 9 | error-propagation | a single error channel at the module seam (a Result / `expected` style). **Verify the repo's exception posture from its build files and prefer the repo's own error idiom** — do not assume a no-exceptions build and force an exception-based rewrite, and do not assume exceptions are welcome where the repo avoids them; the build files are the ground truth |
| 10 | dead / duplicate | delete, registry-gated; parameterize surviving near-twins into one function |
| 11 | flow: an invariant staged sequence with variation inside stages | an explicit Pipeline of stage objects (composition); Template Method is the standing anti-move |

## Census anchors (the observations rows 5, 6, and 11 depend on)

Every row must have a census anchor — the Stage-1 census must have *found* the shape before a
designer may prescribe its move:

- **Row 5 (CQS)** is anchored by the **mutation-fusion** observation — the sites where a branch both
  decides and writes. Without a mutation-fusion count, the CQS move cannot cite census evidence and
  dies at the judge's tier-1 grounding kill.
- **Row 6 (table-driven / Special Case)** is anchored by the data-shaped predicate causes — the
  `business-rule` / `mapping` rows representable as a threshold or a lookup.
- **Row 11 (Pipeline)** is anchored by the **flow-shape** observation (`staged-pipeline`); it is what
  licenses the Pipeline move and distinguishes it from Template Method.

## Deferred row (promote-trigger recorded)

- **`state-transition` -> a transition table + validate-before-mutate** — promoted the **first time a
  census classifies branches as genuine transition logic** (a current status gates the next status,
  a lifecycle rather than a fresh classification-then-write). Until the trigger fires, state-shaped
  branches fold into row 6 (they are lookup-shaped: classify, then write). The `state-transition`
  value of the flow-shape observation is what arms this trigger.

## Anti-moves (the cite-nothing tier — can never satisfy the census-citation obligation)

- **Extract Method** — relocates paths, does not reduce them (103 paths split into 10 functions is
  still 103 paths); legitimate **only** as the first strangler cut that makes the rules visible,
  never as the destination.
- **Guard-clause flattening** — reduces nesting depth, not path count.
- **Standing estate rejections**, recorded per unit with reasons:
  - **Visitor** — rejected where the domain is flat data structs with a kind discriminator (double
    dispatch has nothing to dispatch on); applying it is pattern cosplay.
  - **Template Method** — rejected where it buys the row-11 variation with inheritance coupling in a
    codebase with no inheritance culture; the Pipeline of stage objects is the composition answer.
  - **Chain-of-Responsibility as structure** — the honest implementation of precedence is a
    first-match-wins loop over an ordered vector, not handler-linkage boilerplate (row 1 keeps the
    *semantics*, drops the *structure*).
  - **Abstract-factory hierarchies** — a plain map suffices (row 2).

## The three hard obligations (per proposed pattern)

A Stage-2 designer attaches to every pattern it proposes:

1. **Census citations** — the exact census rows the pattern eliminates (no pattern without them).
2. **A strangler-fig migration path** — the small safe steps that reach the design; never big-bang.
3. **House precedent where it exists** — grep/read-verified in the target repo, with the **search
   root pinned** (an unscoped sweep hits the wrong repo and yields a false "not found").

A pattern is additionally **scoped to what the census found** — a designer never prescribes for a
cause the census counted **zero** of.

## How a move reaches the brief (output grammar)

Each surviving move contributes one **per-move block** to the design brief's target-architecture
section — pattern name + principle + census citations + migration path + house precedent — and the
moves are **ranked by paths eliminated** (dedup-first is routinely the top move). The brief's full
section grammar is the skill's output contract (SKILL.md §D5, the owner); this note names only what a
table row produces, so the two never drift.

## Provenance

Ported from the ratified `mine-design` proposal's decision table v2 (11 rows + one deferred row,
grounded against real source rather than a web pass — the pattern canon is weight-stable knowledge,
the curation was the deliverable). The row-9 revision (exception posture verified from build files,
prefer the repo's own idiom) is the pilot-upheld correction to the original no-exceptions
assumption. The roughly-15-row growth cap is a standing rule.
