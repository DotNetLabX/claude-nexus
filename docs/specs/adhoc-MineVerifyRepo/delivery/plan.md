# mine-verify-repo — first slice (Mine→Verify→Registry + KG pilot)

**Feature Spec:** `docs/specs/adhoc-MineVerifyRepo/definition/tech-spec.md` (technical branch, ADR-27)

## Context

Ships the third mine as a stack-neutral nexus skill: repo-scoped Mine→Verify producing a
`docs/tech-debt/<area>.md` triage registry that feeds the ad-hoc refactoring lane. Governing ADRs:
ADR-46 (unit + lane), ADR-47 (fact/judgment split + must-reproduce gate), ADR-48 (hotspot gate),
ADR-49 (registry species). All method content comes from the tech-spec's contracts C1–C6 — this plan
adds no design.

## Scope

**In:** the `mine-verify-repo` skill (SKILL.md + metric-layer runbook), cross-reference updates in
`mine-verify-cover` and `improve-architecture`, plugin release, the operator-owed KG pilot.
**Out (slice 1):** Cover at repo scale, auto-plan generation, the security lens, cross-model critic
execution, any stack-adapter seam, the docs/render layer (ADR-43).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | evaluate-skill | Follow (as the post-authoring gate) | no | new skill `mine-verify-repo`; method source = tech-spec C1–C6 | |
| 2 | (none) | — | no | two cross-reference edits, exact locations in step | |
| 3 | release-plugin | Follow | no | nexus → MINOR (new capability, owner-escalated); nexus-dotnet → PATCH | |
| 4 | mine-verify-repo (the new skill) | Follow | no | target repo = d:\src\knowledge-gateway | Owner: operator |

No TDD steps: this slice ships method text (skill markdown), not executable code; the CI
plugin-release check + `evaluate-skill` gate are the verification surface.

## Domain Model Changes
None (docs/skill artifacts only).

## Data Model Changes
None.

## Implementation Steps

### Step 1 — Author the skill
Create `plugins/nexus/skills/mine-verify-repo/SKILL.md` and
`plugins/nexus/skills/mine-verify-repo/references/metric-layer.md`.

- SKILL.md carries the method: the pipeline stages, the **global-pass catalog** (tech-spec §The
  pipeline — layering violations, dependency-direction violations, god nodes; graph-visible only),
  contracts C1–C6 from the tech-spec (transcribed as the skill's own sections, in
  mine-verify-cover's structural style: pipeline block → contracts → safety rails → "What this skill
  does NOT do" → relationship table), the execution topology paragraph (inherit the semantics of
  mine-verify-cover's "Execution topology (who runs what)" run-in heading: session-owned
  orchestration, staged background `general-purpose` agents, orchestrator has no filesystem), and
  frontmatter with `user-invocable: true`.
- `references/metric-layer.md` carries the C1 runbook: the bot-filter procedure, the exact
  `git log --numstat`-family commands, Code Maat invocation, lizard invocation, the hotspot filter
  (μ+3σ AND >1 change/month), within-repo calibration note, the degraded-signal reporting rule, and
  a **tool-availability preflight** — check Code Maat (JVM) + lizard are runnable before the run,
  with the documented fallback (pure `git log` churn/coupling computation, complexity column dropped
  loudly) when a tool is absent.
- Binding prompt obligations (grep-checkable, per AC-3): every miner stage prompt forbids estimating
  a metric a table provides; the skeptic stage prompt forbids reasoning-only verdicts; the method
  text states the structural enforcement (a verdict row without its re-execution output excerpt is
  dropped by the orchestrator).
- Then **Follow evaluate-skill** on the result and fix findings before proceeding.
- Satisfies: AC-1, AC-3, AC-7.

### Step 2 — Cross-reference updates (two files, surgical)
- `plugins/nexus/skills/mine-verify-cover/SKILL.md`:
  - `## Relationship to other skills` table: add a `mine-verify-repo` row (the repo-scoped sibling;
    finds WHERE to refactor, composes via M2 as the safety net).
  - `## What this skill does NOT do`, the "Multi-class sweeps … deferred extensions" bullet: point it
    at `mine-verify-repo` as the shipped home of graph-scoped repo evaluation (single-class stance of
    this skill unchanged).
- `plugins/nexus-dotnet/skills/improve-architecture/SKILL.md`: add a short supersession note near the
  top — its discovery phase is superseded by `mine-verify-repo` (ADR-46); its heuristic catalog
  remains donor look-for material for the architecture lens; the skill's architect→backlog flow for
  already-known improvements is untouched.
- Do NOT touch any other mine-verify-cover section (concurrent RulesRegistry edits live in the same
  file's registry section — keep the diff scoped to the two locations above).
- Satisfies: ADR-46.

### Step 3 — Release both plugins (once, after Steps 1–2 land)
**Follow release-plugin.** nexus gets **MINOR** (new capability — owner-escalated per this plan);
nexus-dotnet gets the default PATCH (cross-reference note only). Run the bump exactly once, after all
edits in Steps 1–2 are complete — never per-step. No `agents/*.md` changed, so no `gen-commands`
run. The omni-twin regeneration + mirrored commit is the commit-time concern per repo CLAUDE.md
(re-check the branch immediately before committing — a concurrent pipeline shares this tree).
- Satisfies: AC-1 (shipped = versioned).

### Step 4 — KG pilot run (Owner: operator — not executable in-pipeline)
Precondition: the metric-layer preflight (Step 1's runbook) passes on the pilot machine — Code Maat
(JVM) + lizard runnable, or the documented fallback consciously accepted for this run.
Run the shipped skill against `d:\src\knowledge-gateway`: metric layer → top-N areas → Mine →
Verify → registry write → triage session with the owner. Capture in the run report: bot-exclusion
count, degraded signals, mined→confirmed survival rate, registry delta; then flow ≥1 accepted row to
a KG backlog row and record the payoff baseline (hotspot scores + finding set at run date).
A PASS on Steps 1–3 proves the skill text ships and gates green — it does **not** prove AC-2/4/5/6;
those only land at this run. Pilot findings that are skill defects come back as plugin feedback
(`docs/plugin-feedback/` in KG), not as silent local fixes.
- Satisfies: AC-2, AC-4, AC-5, AC-6.

## Cross-Service Changes
None.

## Migration Notes
None (new artifacts only; no existing paths move).

## Testing Strategy
No executable tests in this repo for slice 1. Verification = the `evaluate-skill` gate (Step 1), the
CI plugin-release check (Step 3), and the pilot's measured AC-2/4/5 (Step 4). The pilot's survival
rate is the empirical precision test of the method itself.

## KB Impact
None to update: `docs/kb/research/repo-technical-evaluation-for-refactoring.md` already captures the
evidence base and needs no change from this slice.

## Open Questions
None blocking. Slice-2 items (cross-model critic execution, registry row-grammar hardening, payoff
re-measurement design) are recorded in the tech-spec's out-of-scope list and the proposal's
Unresolved section.
