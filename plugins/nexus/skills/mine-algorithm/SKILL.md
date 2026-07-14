---
name: mine-algorithm
description: Recognize a hand-rolled algorithm as a canonical one and adjudicate a BR-conformance-gated replacement — clean-room problem characterization, catalog match by 2-3 independent matchers, then row-by-row conformance against the unit's business-rule registry, emitting an algorithm brief that recommends replacement only with a quantified win. Use when a unit reads as a hand-rolled algorithm (custom clustering, assignment, alignment, greedy selection, RANSAC) and you want to know whether a canonical replacement exists and would preserve verified behavior; when a tech-debt or refactoring pass needs a BR-conformance verdict before swapping in a library or vendored algorithm; when an owner asks "is this a known algorithm, and what would replacing it cost or save". Not a structural-design prescription (mine-design), a whole-repo debt mine (mine-verify-repo), or a rule/test miner (mine-verify-cover).
user-invocable: true
---

# Mine→Match→Adjudicate (algorithm-shaped unit scope)

Point this at ONE algorithm-shaped unit and its business-rule (BR) registry. It produces an
**algorithm brief** that answers a question nothing else in the family answers: **is this
hand-rolled code a canonical algorithm in disguise, would a canonical replacement reproduce the
unit's verified behavior, and does the swap earn a quantified win?**

1. A **problem characterization** — the computational problem the unit solves (inputs, outputs,
   invariants, objective function), abstracted from the implementation and cited to registry
   rows and source lines.
2. A **catalog match** — the canonical algorithm(s) the problem maps to, each with complexity
   class and a build-verified availability tier, proposed by 2-3 independent clean-room matchers.
3. A **conformance adjudication** — the canonical candidate checked against the unit's verified BR
   rows, row by row, every deviation classified `adjudicated-bug | domain-requirement | accident`,
   ending in a replacement verdict backed by a quantified-win table.

This is the **seventh mine** — the algorithm-shaped sibling of the mine family (ground truth: the
BR registry as the conformance oracle; gate: row-by-row deviation classification with
deviation-triggered row re-grounding). Read
`../mine-verify-cover/references/mine-family-core.md` §The mine family for the full 8-row family
table and the shared invariant (bounded unit -> clean-room miners -> consolidate -> skeptic verify
-> graded registry) all eight members follow, and §Routing boundary for the line that decides an
algorithm-shaped unit belongs here versus a rule/mapping-shaped unit that belongs to `mine-design`.

What changes here is the ground truth and the failure mode the gate kills: the gate kills the
**reckless replacement** — swapping hand-rolled code for a canonical algorithm on cleanliness
grounds while silently dropping behavior clients depend on. Hand-rolled code accretes emergent
behavior the registry names; the conformance gate is what makes replacement safe rather than
reckless.

## The pipeline

```
Stage 0  precondition   the BR registry exists at the canonical path and is fresh; the per-repo
                        availability inventory is assembled from the build files. Registry absent
                        or stale -> STOP and request a mine-verify-cover run; never self-mine.
Stage 1  characterize   ONE clean-room agent states the computational problem from registry rows +
                        source, under a canonical-naming ban (name the problem, never the answer)
Stage 2  match          2-3 independent clean-room matchers map the problem statement + catalog to
                        canonical candidates (problem statement + catalog ONLY, never the source);
                        off-catalog candidates flagged; a "no canonical match" verdict is honored
Stage 3  adjudicate     one adversarial gate checks each candidate against the BR rows row by row;
                        every deviation classified; a deviation re-grounds the BR row before it is
                        honored as a domain-requirement; every verdict carries an evidence excerpt
Brief    render         algorithm-brief.md per unit in the consuming repo, with the section grammar
                        of A6 — recommend replacement only with a quantified win
```

### Execution topology (who runs what)

Read `../mine-verify-cover/references/mine-family-core.md` §Execution topology before orchestrating
— the canonical shape (multi-agent by design, orchestrator-owns-spawning, staged background
`general-purpose` agents, "launch = orchestrate stages") is defined there and is not restated. The
orchestrator has no filesystem; agents do all I/O, including reading source and running the
comparator harness.

**Model defaults in the stage dispatches** (pilot-measured — full quality, no Fable stage needed):
the parallel lanes (characterization, matchers) dispatch on `sonnet`; the Stage-3 adjudication gate
dispatches on `opus` (it produced the deepest findings — the availability and re-grounding calls a
sonnet lane did not fully pin). Fable is never required. **Pin the target-repo search root in every
stage prompt** — an unscoped file search runs against the orchestrator's own working directory and
yields false "not found" results.

**On a NEW target, walk the core §Kickoff checklist first** (tool preflight, expected survival rate,
stop-budget, run-report location) before launching a run.

## Contracts

### A1 — Inputs, scope, and the Stage-0 precondition

- **Unit source** (required; read-only).
- **BR registry** (required, HARD) — the unit's verified business-rule registry at the canonical
  path `docs/business-rules/{area}/{unit}.md`. It is the **stage-3 conformance oracle**: without it
  there is no ground truth against which a replacement is checked.
- **Availability inventory** (required) — which libraries and library modules the build **actually
  links**, assembled from the build files (the CMake/Bazel/package manifests) **at kickoff**, never
  discovered mid-run. This is what a candidate's dependency tier (A6) is computed against; a run
  that greps a build file mid-stage to learn whether a module is linked has skipped a required
  input.
- **Optional** — a tech-debt row (targeting/ranking only; never needed for the method), a
  bug-handoff list (to classify a deviation as an adjudicated-bug). The external **reference-model
  is NOT an input** — neither miner consumes it.

**Stage-0 precondition (HARD BLOCK — the skill never self-mines its own oracle).** Before Stage 1,
confirm the BR registry file exists at the canonical path and is fresh against the unit's current
source. If it is **absent or stale, the run STOPS** and requests a separate `mine-verify-cover` run
to produce or refresh it — the skill must **never self-mine** the registry it will then consume.
Rationale, shipped with the check: an oracle produced by the same session that consumes it forks the
truth (two competing registries for one code range) and destroys the independence that is the whole
point of the conformance gate. This is a **checkable precondition**, not prose guidance — the
orchestrator verifies the file's presence and freshness and halts on failure, exactly like the
family's kickoff tool-preflight.

### A2 — Stage 1: problem characterization (clean-room, one agent)

State the **computational problem** the unit solves — inputs, outputs, invariants, objective
function — abstracted from the implementation. The unit's BR rows are the raw material (they
describe verified behavior, which is the problem spec); every claim cites rows and source lines so
the statement is skeptic-checkable.

- **Canonical-naming ban (load-bearing, cheap):** the characterization names the *problem*, never
  the *answer*. It may not write "this is DBSCAN" or "this is Hungarian"; it describes the shape
  (density-reachable grouping over a distance predicate; min-cost one-to-one assignment) so Stage 2
  matches on the problem signature rather than a leaked label. A leaked canonical name contaminates
  the independent match.
- Record one whole-unit shape observation (the problem family the unit sits in) so a genuinely
  domain-specific heuristic can earn a "no clean canonical match" whole-unit verdict rather than a
  forced fit.

### A3 — Stage 2: catalog match (2-3 independent matchers, clean-room)

Each matcher receives the **problem statement plus the catalog ONLY — never the source** (source
would let a matcher rationalize the existing implementation instead of matching the problem). Each
maps the problem to canonical candidates from `references/canonical-catalog.md`, each candidate
carrying its complexity class and its availability against the inventory (A1).

- **Off-catalog flagging:** a candidate the catalog does not list is allowed but flagged as
  off-catalog, so a catalog extension is a conscious decision (the catalog's own bounding discipline
  governs whether it is added).
- **The candor / no-match obligation:** "no canonical match" is a first-class verdict, issued
  freely. A whole-unit verdict of "domain-specific heuristic over a {family}-shaped problem" is more
  useful than a forced match; matchers must not manufacture a match to avoid an empty result.
- **Availability determines a candidate's dependency tier, never its viability.** The dependency
  budget constrains only the *recommendation tier* (A6), never the stage-2 candidate set — matching
  stays open to the full literature and to external libraries. An already-linked library is tier 0,
  not the only legal candidate; "not linked" is a tier assignment, never grounds to drop a candidate
  at match time.

### A4 — Stage 3: conformance adjudication (adversarial, one gate)

The surviving candidate(s) are checked against the unit's verified BR rows, **row by row**. Every
deviation between the canonical behavior and a verified row is classified:

- **adjudicated-bug** — the deviation is a known defect (cite the bug-handoff item); the replacement
  *fixes* it, and the fix is a quantified win.
- **domain-requirement** — genuine business behavior the canonical algorithm must be
  parameterized/extended to honor, or the candidate dies.
- **accident** — behavior nobody chose; recorded as an owner call, gating the verdict.

- **The oracle is itself challengeable (deviation-triggered row re-grounding).** A canonical
  deviation is *also* evidence that the BR row may be mis-mined — a bug captured as a "rule",
  low-agreement rows especially. **Before a deviation is honored as a domain-requirement, the
  deviating row is re-grounded against source**; a row that fails re-grounding is corrected in the
  registry (via the registry's own changelog discipline), not defended by the gate. This closes the
  mis-mined-row gap: without it the gate would let a captured bug block a legitimate replacement.
- **Equivalence check by output type.** Where a candidate produces floating-point or geometric
  output, conformance requires **executable back-to-back comparison** on a shared corpus with an
  engineered per-quantity tolerance — reasoning-only conformance is permitted solely for
  exact integer/discrete output with full row-by-row reproduction. The comparator recipe, the
  tolerance policy, the corpus strategy, and the seed-injection refactor for unseeded-RNG units live
  in `references/equivalence-net.md`; the gate follows it rather than restating it.
- **Every verdict carries an evidence excerpt** (a row-vs-behavior citation, a re-execution output,
  a re-grounding trace). A conformance verdict without its excerpt is dropped — the same must-RUN
  enforcement the family skeptic uses (core §Skeptic protocol).

### A5 — Verdict grammar & the quantified win

The whole-unit verdict is one of five: **replace** (canonical drop-in preserves behavior) /
**restructure-toward-canonical** (keep the unit, reshape it toward the canonical form — e.g. a
sequential sampler over already-linked primitives) / **owner-gated** (viable only if named
accidents are ratified as fixes) / **keep-domain** (no clean canonical match; the heuristic stays) /
**deletion-set** (code the registry proves is dead — the cheapest win, often found by the registry
rather than the matcher).

A replacement verdict requires a **quantified win** — never "cleaner" as an adjective. The brief
carries a mandatory **quantified-win table**: NLOC deleted, CCN drop, adjudicated bugs eliminated,
complexity-class change, and new dependencies added. Maintainability qualifies only when it arrives
as those numbers.

### A6 — Output artifact: the algorithm brief

`algorithm-brief.md` per unit, written to the **consuming** repo at
`docs/algorithm-briefs/{area}/{unit}.md` — area-mirrored alongside the `docs/business-rules/{area}/`
registry (ADR-45-aligned placement). Required section grammar:

- **Problem statement** — row-cited (A2).
- **Matches** — each canonical candidate with complexity class and build-verified availability.
- **Conformance table** — BR rows against canonical behavior, every deviation classified (A4).
- **Dependency-tier ranking** — every *viable* candidate ranked by dependency cost, each with its
  quantified win, so the owner decides the dependency budget per case:
  - **tier 0** — already-linked primitives; hand-roll on what the build links today.
  - **tier 1** — a new module of an already-shipped library (e.g. enabling an optional vision module
    already partly linked).
  - **tier 2** — a new external dependency.
  "Not linked" is a **tier assignment, never a rejection reason** — a tier-1/2 candidate with a real
  quantified win belongs in the ranking, not buried in rejected-candidates.
- **Recommendation** — the verdict (A5) with its quantified wins.
- **Migration path + required net** — the small safe steps to reach it, and the safety net the swap
  requires (a golden flow, a gated suite, seed-injection where the unit is nondeterministic).
- **Rejected candidates with reasons** — genuinely nonviable candidates only.

**Calibration note (expectation-setting, state it in the brief).** The bugs-vs-deviations crosswalk
is a **partial map by nature**: *algorithmic* bugs fall out as deviations, *plumbing/adjacent* bugs
do not — so expect a partial crosswalk, not a sweep, and read a partial crosswalk as normal rather
than as failure. The formalization also routinely surfaces **new** latent hazards the known bug list
never named — discovery value beyond the crosswalk.

### A7 — Cost & safety rails

- **Read-only on the target source** — the only writes are the algorithm brief (+ registry
  corrections via the registry's own changelog when a row fails re-grounding). No agent edits the
  unit's source; performing the replacement is the developer/plan pipeline's job, not this skill's.
- **Budget cap + report on halt:** read `../mine-verify-cover/references/mine-family-core.md`
  §Marginal-budget rail — gate on the spend delta, never the shared-pool absolute; every stop writes
  a report and never exits silently green.
- **Availability verified against the installed build**, never library documentation — a `library`
  availability claim is re-checked against the actual linked module set before it counts.

## Binding prompt obligations (grep-checkable)

Load-bearing prompt clauses, verifiable by grep in this file:

- **The Stage-0 precondition halts on a missing or stale oracle.** The run confirms the BR registry
  exists and is fresh before Stage 1, and **STOPS to request a mine-verify-cover run** rather than
  generating its own — the skill must **never self-mine** the oracle it consumes.
- **The characterization stage prompt enforces the canonical-naming ban.** Stage 1 names the
  problem, never the canonical answer; a leaked algorithm name is a contamination the prompt forbids.
- **The matcher stage prompt withholds the source.** Stage 2 matchers see the problem statement plus
  the catalog only — never the unit source — and may issue a free "no canonical match" verdict.
- **The adjudication stage prompt re-grounds a deviating row before honoring it.** A deviation
  claimed as a domain-requirement re-grounds its BR row against source first; every conformance
  verdict carries its evidence excerpt or is dropped.

## Safety rails

The safety floor is **A7 — Cost & safety rails** above; it is the single source and nothing here
overrides it. The load-bearing invariants at a glance:

- **Never self-mine the oracle** — a missing/stale registry halts the run for a separate
  mine-verify-cover pass; the conformance gate's independence depends on it (A1, Stage 0).
- **Read-only on the target** — the sole writes are the brief and registry corrections; the
  replacement itself rides the developer/plan lane (A7).
- **Availability is per-link-set, verified against the installed build** — never asserted from
  library docs (A3, A7).
- **Marginal budget cap + report-on-halt** — gate on the spend delta, never the shared-pool
  absolute; every stop writes a report (A7).
- **The four prohibitions** — no conformance verdict without an evidence excerpt, no candidate
  dropped for its dependency tier at match time, no replacement verdict without a quantified win, no
  self-mined oracle. These are the method's hard floor.

## What this skill does NOT do

- **Perform the replacement** — the brief is a design artifact; the swap rides the developer/plan
  pipeline, gated by the brief's required net.
- **Invent new algorithms** — it recognizes canonical ones from the catalog; an off-catalog shape is
  flagged, not synthesized.
- **Prescribe structure** — pattern/principle prescription for a rule/mapping-shaped unit is
  `mine-design`'s territory; the routing boundary (family core) hands such units back.
- **Mine its own oracle** — a missing registry routes to `mine-verify-cover`, never self-produced.
- **Run a repo-scale scan** — one algorithm-shaped unit per run; whole-repo debt ranking is
  `mine-verify-repo`.

## Relationship to other skills

See `../mine-verify-cover/references/mine-family-core.md` §The mine family for the full family table
and §Routing boundary for the algorithm-shaped vs rule/mapping-shaped split.

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover` | **Upstream oracle producer** — mines the BR registry this skill's Stage-0 precondition requires; a missing/stale registry routes here, never self-mined. |
| `mine-design` | **Sibling prescription mine** — prescribes structure where this prescribes computation; the family-core routing boundary splits the unit population between them, and a mixed unit is prescribed for by both on its own portion. |
| `mine-verify-repo` | **Optional targeting input** — a tech-debt row ranks/targets a unit for a run; never needed for the method itself. |
