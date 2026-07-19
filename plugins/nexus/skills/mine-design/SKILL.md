---
name: mine-design
description: Produce an evidence-cited design brief for one class or function — a mechanical complexity census that classifies every branch by cause, decision-table-constrained clean-room designers that each earn their patterns by citing the census rows they eliminate, and a reject-by-default two-tier judge that kills any pattern that does not earn its rows. Use when a refactoring plan needs a per-unit target architecture (not just "split this file" but into what, using which pattern, protected by which net); when a high-complexity class or function needs a pattern prescription grounded in what its branches actually are; when you want a complexity census that quantifies where a unit's paths come from; when an owner needs a discussable design brief with recorded rejected alternatives rather than pattern names on authority. Not an algorithm-replacement mine (mine-algorithm), a whole-repo debt mine (mine-verify-repo), or a rule/test miner (mine-verify-cover).
user-invocable: true
---

# Mine→Design→Judge (class/function scope)

Point this at ONE class or function and its business-rule (BR) registry. It produces a **design
brief** — the per-unit target architecture nothing else in the family produces: named patterns and
principles, each *earning its place by citing the exact branches it eliminates*, plus rejected
alternatives with reasons.

1. A **complexity census** — every branch/decision classified by cause with file-and-line evidence,
   summarized as a counts-by-cause table. Independently valuable ("31 of 103 paths are config-forks"
   is a finding on its own) and skeptic-checkable exactly like a BR row.
2. A **target architecture** — patterns and principles from a fixed decision table, each move citing
   the census rows it eliminates, with a strangler-fig migration path and house precedent where it
   exists. No pattern without cited census rows — the anti-cosplay rule.
3. A **judged brief** — a reject-by-default two-tier judge kills patterns that do not earn their
   rows and records every rejection with reasons; the synthesis grafts the survivors.

This is the **sixth mine** — the structure-prescribing sibling of the mine family (ground truth: the
mechanical complexity census; gate: the two-tier judge — a grounding kill, then pairwise ranking).
Read `../mine-verify-cover/references/mine-family-core.md` §The mine family for the full 10-row family
table and the shared invariant (bounded unit -> clean-room miners -> consolidate -> skeptic verify
-> graded registry) all ten members follow, and §Routing boundary for the line that decides a
rule/mapping-shaped unit belongs here versus an algorithm-shaped unit that belongs to `mine-algorithm`.

What changes here is the ground truth and the failure mode the gate kills: the gate kills **pattern
cosplay** — prescribing a famous pattern (Visitor everywhere, a rules engine for a parser) that the
unit's branches do not justify. The census-citation obligation and the reject-by-default judge exist
to suppress exactly that; without them this skill should not ship.

## The pipeline

```
Stage 0  precondition   the BR registry exists (the census's deletion oracle and the BR-row ->
                        rule-object mapping source) — absent, HALT and route to a mine-verify-cover
                        run to produce it, then re-run; a cheap in-repo house-precedent sweep is queued
Stage 1  census         ONE clean-room agent classifies every branch by cause with file-and-line
                        evidence, cross-walks BR rows, and emits the counts-by-cause table (the
                        headline artifact); records the two per-unit observations (flow-shape,
                        mutation-fusion)
Stage 2  design         2-3 independent clean-room designers, each constrained by the decision table,
                        propose a target architecture; every pattern cites the census rows it kills,
                        names a strangler path, and cites house precedent; zero-count causes are not
                        prescribed for
Stage 3  judge          a blind, provenance-stripped judge at a higher model tier than the designers
                        runs tier 1 (absolute grounding kill) then tier 2 (pairwise over survivors,
                        both orderings), and synthesizes a census-cited brief
Brief    render         design-brief.md per unit in the consuming repo, with the section grammar of D5
```

### Execution topology (who runs what)

Read `../mine-verify-cover/references/mine-family-core.md` §Execution topology before orchestrating
— the canonical shape (multi-agent by design, orchestrator-owns-spawning, staged background
`general-purpose` agents, "launch = orchestrate stages") is defined there and is not restated. The
orchestrator has no filesystem; agents do all I/O, including running the census and judge evidence
commands. The census's chunked-writes discipline for a large unit is the family core's, not restated
here.

**Model defaults in the stage dispatches** (pilot-measured — full quality, no Fable stage needed):
the census and the designer lanes dispatch on `sonnet`; the Stage-3 judge dispatches on `opus`, a
**different, higher tier than the designers** (tier separation is part of the judge's independence).
Fable is never required. **Pin the target-repo search root in every stage prompt** — an unscoped
file search runs against the orchestrator's own working directory and yields a false "precedent not
found".

**On a NEW target, walk the core §Kickoff checklist first** (tool preflight, expected survival rate,
stop-budget, run-report location) before launching a run.

## Contracts

### D1 — Inputs & scope

- **Unit source** (required; read-only — one class or function per run).
- **BR registry** (required) — the unit's verified business-rule registry at
  `docs/business-rules/{area}/{unit}.md`. Without it the census loses its **deletion oracle** (a
  branch with no corresponding verified rule is a deletion candidate, not a mystery) and the
  brief loses its BR-row -> rule-object mapping. **Absent → HALT and route to a `mine-verify-cover`
  run to produce the registry, then re-run** — the census's deletion oracle is trustworthy only if
  the registry was independently mutation-gated by a real `mine-verify-cover` pass, so producing it
  in-run would yield an unverified oracle. This is a halt to obtain a required input, not a
  self-mining prohibition.
- **Optional** — a tech-debt row (targeting/ranking + pre-verified metrics; not needed for the
  method); a house-precedent inventory (a cheap stage-0 sweep inside this skill). The external
  **reference-model is NOT an input** — this miner does not consume it.

### D2 — Stage 1: the complexity census (mechanical, one clean-room agent)

Classify **every** branch/decision by cause, each with file-and-line evidence. The nine fixed
causes: `business-rule` (maps to a BR registry row where one exists) · `type-fork` · `config-fork` · `defensive-validation` · `absence-handling` (a legitimately-optional input or collaborator, distinct from defensive because valid input may legitimately lack it) · `error-propagation` (per-call return-code plumbing) · `mapping` · `dead` · `duplicate`.

Plus **two per-unit observations**, recorded once each because the decision table anchors to them:

- **flow-shape** — one of `staged-pipeline | state-transition | single-pass`. It is what licenses the
  Pipeline move (decision-table row 11) and arms the deferred state-transition row's promote-trigger.
- **mutation-fusion** — the sites where a branch both decides and writes (decision fused with
  mutation). It is the census anchor for the CQS move (decision-table row 5); without it the deepest
  move cannot cite census evidence and dies at the judge's tier-1 grounding kill.

**Every decision-table row must have a census anchor** — flow-shape anchors row 11, mutation-fusion
anchors row 5, the data-shaped predicate causes (`business-rule`/`mapping` rows representable as a
threshold or lookup) anchor row 6. The census cross-walks BR rows to branches, and the
**counts-by-cause table is the headline artifact** — a better conversation-opener than a CCN number.

### D3 — Stage 2: designers (2-3 independent, clean-room, decision-table-constrained)

Each designer proposes a target design constrained by `references/decision-table.md`, with **three
hard obligations per proposed pattern**:

1. **Cite the census rows it eliminates** — no pattern without cited census rows (the anti-cosplay
   rule). A pattern that cannot name the branches it kills is rejected.
2. **Name the strangler-fig migration path** — the design must be reachable in small safe steps, not
   a big-bang rewrite.
3. **Cite house precedent where it exists** — grep/read-verified in the target repo, with the
   **search root pinned** (an unscoped sweep hits the wrong repo).

- **Honest zero-cause scoping** — a designer never prescribes for a cause the census counted **zero**
  of; the prescription is scoped to what the census actually found.
- **Bug-preservation discipline** — a documented live bug in the unit is **preserved-and-ticketed**,
  never silently fixed by the redesign; the brief carries it forward as a known behavior to migrate,
  not a defect to erase mid-refactor.

### D4 — Stage 3: the two-tier judge (reject-by-default, adversarial)

The judge is **blind** (no exemplar or reference brief in its inputs), **provenance-stripped**
(which-designer-produced-what is removed), and runs at a **higher model tier than the designers**.

- **Tier 1 — absolute grounding kill.** Each pattern survives only if its census-row citation
  **verifies** — the judge re-executes the citation against live source and records the excerpt.
  Famous pattern **names score zero**: grounding is the only currency, so an authority citation
  ("this is the GoF X pattern") earns nothing. Anti-move proposals (the decision table's cite-nothing
  tier — Extract Method as a destination, guard-clause flattening, the standing estate rejections)
  **fail outright**. A candidate with fabricated census rows is caught here by the range-check.
- **Tier 2 — pairwise over survivors only.** Only the tier-1 survivors are pairwise-ranked, run in
  **both orderings**; a position flip is resolved by grounding **evidence**, never by order. (Pairwise
  judging is far more distractor-gameable than absolute, which is why the grounding kill runs first.)
- **Synthesis** — the judge grafts the surviving moves into one brief, every graft **census-cited**.

**Calibration note.** A *planted fabricated-authority candidate* (a deliberately over-confident,
ungrounded design) is a **calibration-time instrument only** — it measures the judge's authority
robustness during skill calibration. **Production runs do not include a plant**; the validated gate
suffices.

### D5 — Output artifact: the design brief

`design-brief.md` per unit, written to the **consuming** repo at `docs/design-briefs/{area}/{unit}.md`
— area-mirrored alongside the `docs/business-rules/{area}/` registry (ADR-45-aligned placement).
Required section grammar:

- **Census summary** — counts by cause (the headline table).
- **Target architecture** — prose plus the moves **ranked by paths eliminated**. (Estate-wide
  empirical finding: **dedup-first is routinely the top move** — duplicate-cause dominance recurs
  across units, matching the "delete the fake paths first" ladder; rank accordingly unless the census
  says otherwise.)
- **Per-move detail** — pattern name + principle + census citations + migration path + house
  precedent, one block per move.
- **BR-row -> rule-object mapping** — for rule-shaped units, each BR row mapped to its rule object
  with its own small test.
- **Rejected alternatives with reasons** — rejections are half the brief's discussion value; record
  each with the census-grounded reason it failed.
- **Required safety net** — the golden flow / gated suite / registry the refactor depends on.

### D6 — Cost & safety rails

- **Read-only on the target source** — the only write is the design brief. Generating the refactored
  code is the developer/plan pipeline's job; the brief is a design artifact, adjudicated not
  auto-applied.
- **Budget cap + report on halt:** read `../mine-verify-cover/references/mine-family-core.md`
  §Marginal-budget rail — gate on the spend delta, never the shared-pool absolute; every stop writes
  a report and never exits silently green.
- **Decision-table growth cap** — the table holds at roughly 15 rows; a new row is a deliberate,
  census-anchored addition, never pattern accretion.

## Binding prompt obligations (grep-checkable)

Load-bearing prompt clauses, verifiable by grep in this file:

- **The census stage prompt classifies every branch by one of the nine fixed causes** and records the
  flow-shape and mutation-fusion observations — the decision table's anchors depend on them.
- **The designer stage prompt forbids a pattern without cited census rows** (the anti-cosplay rule)
  and forbids prescribing for a zero-count cause; house precedent is cited with the search root
  pinned.
- **The judge stage prompt is blind and provenance-stripped, at a higher tier than the designers**;
  tier 1 re-executes every census citation and scores authority citations zero; tier 2 ranks only
  tier-1 survivors, in both orderings, flips resolved by evidence.
- **A documented live bug is preserved-and-ticketed, never silently fixed** by the redesign.

## Safety rails

The safety floor is **D6 — Cost & safety rails** above; it is the single source and nothing here
overrides it. The load-bearing invariants at a glance:

- **No pattern without cited census rows** — the anti-cosplay rule is the method's reason to exist
  (D3, D4 tier 1).
- **The judge is blind, provenance-stripped, and a tier above the designers** — grounding is the only
  currency; authority scores zero (D4).
- **Read-only on the target** — the sole write is the brief; the refactor itself rides the
  developer/plan lane (D6).
- **Marginal budget cap + report-on-halt** — gate on the spend delta, never the shared-pool absolute;
  every stop writes a report (D6).
- **The four prohibitions** — no pattern without a census citation, no prescription for a zero-count
  cause, no judge that is not blind and provenance-stripped, no silently-fixed live bug. These are the
  method's hard floor.

## What this skill does NOT do

- **Generate the refactored code** — the brief is a design artifact; implementation rides the
  developer/plan pipeline, gated by the brief's required net.
- **Rank a whole repo** — one class/function per run; repo-level debt ranking is `mine-verify-repo`.
- **Prescribe computation** — canonical-algorithm recognition and replacement for an algorithm-shaped
  unit is `mine-algorithm`'s territory; the routing boundary (family core) hands such units there.
- **Replace architect judgment** — the brief is adjudicated, not auto-applied.
- **Plant a fabricated-authority candidate in a production run** — the plant is a calibration-time
  instrument only (D4).

## Relationship to other skills

See `../mine-verify-cover/references/mine-family-core.md` §The mine family for the full family table
and §Routing boundary for the rule/mapping-shaped vs algorithm-shaped split.

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover` | **Upstream input producer** — mines the BR registry the census uses as its deletion oracle and the source of the BR-row -> rule-object mapping. |
| `mine-algorithm` | **Sibling prescription mine** — prescribes computation where this prescribes structure; the family-core routing boundary splits the unit population, and a mixed unit is prescribed for by both on its own portion. |
| `mine-verify-repo` | **Optional targeting input** — a tech-debt row ranks/targets a unit and supplies pre-verified metrics; never needed for the method itself. |
