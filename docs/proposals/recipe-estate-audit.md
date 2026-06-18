# Proposal — Recipe-estate consistency & discoverability audit

**Status:** Ratified — by ldumit (owner), 2026-06-17 (this session)
**Decision-maker:** ldumit (owner)
**Recommendation:** Run a read-only, cross-cutting audit of the recipe/rule/gate estate — drift sweep + a selection/navigation index + gate-coherence check — then stage fixes by priority. Do **not** build new abstractions; the recipe layer already exists (ADR-2).
**Confidence:** High — the recipe layer is present and dense (ADR-2 names skills as the reusable-recipe/schema carrier); the prior pass used a different lens (mechanism strength, not coherence); and three drift incidents *this session* evidence the need. The audit itself is read-only and reversible, so the cost of running it is low.
**Impact:** 6 — internal correctness/maintainability across the whole pipeline (fewer wrong-primitive and drift errors); not user-facing product surface.
**Effort:** med
**Date:** 2026-06-17

## Need

The plugin's reusable machinery — skills (recipes/schemas), rules (the always-on playbook), and gates
(spec-review, done-check, the master gate, the pipeline-gate hook, boundary-detector) — has **grown
faster than its coherence has been maintained.** The ADR register has expanded by roughly half since
the last evaluation (ADR-25 → 30+ across BuildFlowFormalization, UnattendedAutonomy, FleetView), and no
pass has swept the *current* estate for internal consistency or navigability.

The evidence is concrete and recent — three drift failures surfaced in a single session (2026-06-17)
while diagnosing one research-capture miss:

1. A **fabricated precedent** (an "F23 cited `docs/kb/research/session-state-…`" claim) — the file does
   not exist; a memory/drift artifact surfaced as fact.
2. A capability that **already ships but is mis-framed**: `search-researches` already fans out for
   breadth-first topics (SKILL.md:104-108), but its framing reads "single fact," so an agent reached for
   a generic helper instead of the right primitive.
3. A proposed fix that would have **reversed a ratified decision** (ADR-1's deliberate decoupling of
   `search-researches` from the external `deep-research` harness).

None of these is an *abstraction gap*. All three are **discoverability / drift / consistency** — the
class a taller recipe stack makes worse, not better.

**Out of scope:** re-running the 06-10 quality scorecard (`plugin-evaluation-2026-06.md`); per-skill
quality deep-dives (that is `evaluate-skill`); authoring new recipes; the actual fixes (each is a
separately-triaged, staged pass); and any heavy re-formalization while the recent ADR wave is still
settling. The audit is read-only; only the downstream fixes touch files.

## Approach

Four phases, audit-then-fix — **not** one pipeline:

- **Phase 0 — Capture & scope (this proposal).** Owner ratifies (ADR-28). Fixes the evaporation problem
  the diagnosis kept hitting.
- **Phase 1 — Audit (read-only, architect-owned, Explore-assisted).** Three sweeps:
  - **(a) Drift & contradiction** — dead cross-references, stale framing, ADR conflicts, format skills
    diverged from how agents actually write the artifact. Picks up the 06-10 eval's open thread
    (duplicated agent blocks, no drift lint).
  - **(b) Inventory → selection index** — enumerate every skill/rule/gate with its trigger/situation,
    and design the missing *"situation → recipe + gate"* index. This is the one genuinely-missing
    abstraction: ADR-2 says *where* knowledge lives, nothing says *which recipe to reach for in
    situation X*. An index over existing recipes, not new recipes.
  - **(c) Gate-coherence** — list each gate, its enforcement point, and whether it is actually wired
    (the recurring "inert on background subagents" risk). Wiring-check against source, not new live
    probes — P1 was already answered in the 06-10 roadmap.
  - Output: `docs/specs/adhoc-RecipeEstateAudit/delivery/` — a severity-rated findings doc, a draft
    selection index, a gate map.
- **Phase 2 — Triage.** Findings become backlog rows ranked impact ÷ effort (ADR-29). Owner picks
  action-now vs. defer.
- **Phase 3 — Fixes (per item).** Each actioned item runs its own scoped pipeline: skill fixes via
  `improve-skills` (ends in skill-lint), rule/flow fixes via `improve-flow`, the selection index as a
  small build. Reviewer does a **code-grounded** Step-2 (mandatory for shared plugin-source). Critic
  runs Mode 2 against the **ADR register** (ad-hoc lane, no spec). Each fix bumps the plugin in-commit
  (`release-plugin`).

## Benefits

- **Fewer wrong-primitive / drift errors** — the three incidents above are the recurring tax this
  directly targets.
- **A navigable estate** — the selection index is what would have routed an agent to the fan-out mode
  instead of a generic helper.
- **Confidence the gates are real** — a wiring check closes the standing "is this gate actually
  enforced?" doubt the 06-10 eval scored at 5 (pipeline enforcement).
- **Closes an open thread** — the 06-10 eval's flagged drift risk (duplicated blocks, no lint) finally
  gets swept and, where cheap, lint-guarded.

## Alternatives

- **Do nothing; rely on `evaluate-skill` + the learner per-item.** Rejected: neither does a
  *cross-cutting* sweep. `evaluate-skill` is per-skill quality; the learner consolidates lessons. Drift
  between recipes accumulates silently — exactly what this session demonstrated.
- **Build new abstractions/recipes (the original framing).** Rejected: ADR-2 shows skills already *are*
  the extracted reusable layer, and the estate is dense (~21 nexus skills + format skills for every
  artifact). Re-extraction is churn — the over-build trap.
- **Re-run the 06-10 quality scorecard.** Rejected: different lens (mechanism *strength* vs. *coherence*
  + navigability); it would not catch discoverability/drift, and re-scoring a still-settling estate
  churns.
- **Wire it as a recurring learner health-check now.** Rejected as premature: prove the one-shot audit's
  value first; a periodic version is a reasonable future follow-on (noted in Unresolved).

## Unresolved

1. **Where the selection index lives** — a new skill, a section in the architecture README, or a rule.
   The one real design choice; defer to the audit's inventory finding.
2. **Depth of the gate-coherence check** — "full audit" here means enumerate every gate and check its
   wiring claims against source, **not** re-run expensive live background-subagent probes (the 06-10
   roadmap already answered P1). Confirm this reading is what "full" meant.
3. **Fast-path candidates** — whether any already-found fix (e.g. the research-capture trio: fallback
   capture, framing, the route-through-`search-researches` workflow step) should jump the backlog rather
   than wait for the full sweep.

## Graduate-to-spec

Technical branch (ADR-27/28). On ratification this graduates to the **audit run itself** (Phase 1), with
findings → backlog rows (ADR-29) and any decisions extracted as ADR lines. Per the master gate (ADR-25)
this two-way-door pass collapses: the audit findings doc + backlog rows + targeted ADR lines are the
graduated form — **no separate full tech-spec** unless the audit surfaces a one-way-door decision.

## Provenance

Session 2026-06-17 (architect, standalone). Fed by: the four-turn research-capture diagnosis this
session (the three drift incidents); the prior evaluation `plugin-evaluation-2026-06.md` (2026-06-10,
the quality-scorecard pass — a different lens, explicitly positioned against); and ADR-2 (recipe layer),
ADR-25 (master gate), ADR-27/28 (technical-definition branch + proposal lifecycle), ADR-29 (backlog
rows).
