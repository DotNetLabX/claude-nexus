# Implementation Plan — F20-ProcessSkillQuickWins (plugin-feedback P12 + P13 + P14)

**Feature Spec:** None — ADR-collapsed definition (ADR-25/58): binding input = backlog row F20
(`docs/backlog.md`) + plugin-feedback `docs/plugin-feedback/nexus-1.36.0-2026-07-18.md` items
P12/P13/P14 (+ its `## Triage` block).
**Slug:** F20-ProcessSkillQuickWins · **Intent:** Scoped (three prose additions, three skills)
**Plan status:** Approved — code-grounded critic review folded (see `## Plan Review`)
**Baseline at plan time (2026-07-20):** HEAD `a5f276d`, nexus **1.38.1**.
**Mode:** architect-led fast lane (standalone). The developer runs **no git write of any kind** and
**no version bump** — release + commit happen at lane close in the main session.
**Unrelated dirt (do not touch):** `docs/kb/research/br-anchored-regeneration-landscape.md`
(untracked, another thread's file).

## Context

Three process-skill additions from the knowledge-gateway 2026-07-18 run, each a named branch for a
situation the field hit and the shipped protocol didn't name:

- **P12 (`tdd`):** tests written over *already-shipped* behavior can't run red-first against
  correct code — the field's proven loop is green-first → single-mutation → red → revert (the
  manual analogue of the mull mutation gate; the SDK campaign's daily discipline). Evidence:
  KG F24:50 + architect concurrence F24:14 (two-role sighting).
- **P13 (`diagnose`):** a tool-level infrastructure gate (auth wall, wrapper script, runner
  precondition, permission hook) can emit an error shaped like a pipeline-phase failure — the
  protocol should name the "identify the emitter first" branch. Evidence: KG F56:44.
- **P14 (`create-implementation-plan`):** a stale same-name proposal was nearly re-planned (KG
  F59 IP :106-109) — the reading protocol needs a grep-the-feature-name-before-authoring check.

All three verified **still absent** at 1.38.1 (plan-time greps, before-states below).

## Scope

**In:** the three SKILL.md additions + lint + acceptance-grep conformance.
**Out:** any runtime code (none of these skills ships tools); the architect agent file (the P14
check's cheapest correct locus is the skill the architect always invokes at plan time — see
Decisions); the release bump/commit (lane close).

**Binding identifiers (public surface):** variant name **retro-fit mutation variant** (`tdd`);
branch name **infra-gate mimicry** (`diagnose`); the loop tokens green-first → single-mutation →
red → revert. Exact sentences are the developer's within the acceptance greps.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | prose addition to a shipped process skill (same verified-None class as F17: no skill covers dev-repo shipped-skill editing) | gap: recurring — strengthen the existing `edit-shipped-plugin-skill` lessons entry, do not twin it |
| 2 | (none) | — | no | same class | — (covered by step 1's entry) |
| 3 | (none) | — | no | same class | — (covered by step 1's entry) |
| 4 | (none) | — | no | lint + grep re-runs | — |

## Implementation Steps

### Step 1 — P12: `tdd` retro-fit mutation variant
**Skill:** None · **TDD:** no · **Satisfies:** feedback P12
**File:** `plugins/nexus/skills/tdd/SKILL.md`

Add a named variant section (place it after `## Workflow`, before `## What to Test…`), plus one
`## When to Use` bullet ("writing tests over already-shipped behavior — use the retro-fit
mutation variant"). Variant content (developer phrases it; these semantics are binding):
- **When:** the behavior already ships and is believed correct — characterization/coverage
  backfill — so Step 2's red-first is impossible (the test is born green against correct code).
- **The loop, per test (or tight behavior cluster):** write the test → green; introduce **ONE
  temporary mutation** into the covered code (flip an operator/boundary/constant on a line the
  test guards) → run → confirm **RED for the right reason**; **revert** the mutation → green.
- **Rules:** one mutation at a time; the mutation is never committed (verify working tree clean of
  it before moving on); a test that stays green under its mutation is testing nothing — rewrite
  it (this is the manual analogue of a mutation-testing gate, anti-vacuity).
- Normal red-green-refactor remains the default for NEW behavior — the variant never replaces it.
- **Reconciliation (critic HIGH — both halves mandatory):** (a) the variant section names itself
  the sanctioned exception to red-first ("the one case where the test is born green — the
  mutation step, not a pre-implementation red, proves the test has teeth"); (b) the existing
  anti-pattern bullet "**Writing a test that passes before any implementation**" (line ~113)
  gains a scope qualifier: it applies to **new behavior**; for coverage over already-shipped
  code, see the **retro-fit mutation variant**. Without both, the skill prescribes X in one
  section and prohibits X in another.

**Accept** (before-state: `grep -ic 'mutation'` = 0; range-scoped per the mechanism rule):
- `grep -ic 'mutation' plugins/nexus/skills/tdd/SKILL.md` ≥ 3
- `grep -ic 'retro-fit' plugins/nexus/skills/tdd/SKILL.md` ≥ 3 (When-to-Use bullet + section +
  anti-pattern qualifier)
- `grep -ic 'revert' plugins/nexus/skills/tdd/SKILL.md` ≥ 1
- Range-scoped: `awk '/^## Anti-patterns/,/^## What This Skill/' plugins/nexus/skills/tdd/SKILL.md | grep -ic 'retro-fit'` ≥ 1
  (the anti-pattern bullet itself references the variant)

### Step 2 — P13: `diagnose` infra-gate mimicry branch
**Skill:** None · **TDD:** no · **Satisfies:** feedback P13
**File:** `plugins/nexus/skills/diagnose/SKILL.md`

Add a short named paragraph **in the Phase 3 (Hypothesize) area** — heading or bold lead
**Infra-gate mimicry** (developer places it as a hypothesis-class callout, not a new phase):
- A tool-level infrastructure gate (auth wall, wrapper script, test-runner precondition,
  permission hook, proxy) can emit an error **shaped like** an application/pipeline-phase
  failure. When the error's apparent phase/source doesn't match where you are, rank a hypothesis
  that **the message's emitter is a gate in front of the tool, not the tool itself**.
- Probe: identify the emitter first — locate which layer prints the literal message (grep the
  toolchain/hooks/wrappers for it) before debugging the application path.

**Accept** (before-state: `grep -ic 'infra-gate'` = 0, `grep -ic 'mimic'` = 0; range-scoped):
- `awk '/^### Phase 3/,/^### Phase 4/' plugins/nexus/skills/diagnose/SKILL.md | grep -ic 'infra-gate mimicry'` ≥ 1
- `grep -ic 'emitter' plugins/nexus/skills/diagnose/SKILL.md` ≥ 1

### Step 3 — P14: `create-implementation-plan` grep-before-authoring check
**Skill:** None · **TDD:** no · **Satisfies:** feedback P14
**File:** `plugins/nexus/skills/create-implementation-plan/SKILL.md`

Extend `## Reading protocol` (line ~19) with a new **first** item (renumber or prefix as item 0 —
developer's call): **grep the feature name before authoring** — grep the feature name / slug
keywords across `docs/proposals/`, `docs/specs/`, and `docs/backlog.md`; a same-name or
same-topic artifact found is **surfaced in the plan's Context** (stale? superseded? already
covering part of the scope?) — never silently re-planned. Cite the measured near-miss (KG F59: a
stale same-name proposal was nearly re-planned).

Also add a one-line pointer in `## Required Reading` (line ~90) — "plus the reading-protocol
grep-the-feature-name collision check" — so the two pre-authoring lists don't silently diverge
(critic MEDIUM: they enumerate the same four items today; the divergence must be resolved
explicitly, and the pointer is the chosen resolution).

**Accept** (before-state: `grep -ic 'same-name'` = 0; range-scoped):
- `awk '/^## Reading protocol/,/^## Steps/' plugins/nexus/skills/create-implementation-plan/SKILL.md | grep -ic 'grep the feature name'` ≥ 1
- `grep -ic 'same-name' plugins/nexus/skills/create-implementation-plan/SKILL.md` ≥ 1
- `awk '/^## Required Reading/,/^## Anti-patterns/' plugins/nexus/skills/create-implementation-plan/SKILL.md | grep -ic 'feature name'` ≥ 1

### Step 4 — Conformance: lint + grep re-runs
**Skill:** None · **TDD:** no

- Re-run every Step 1–3 acceptance grep; fix any miss.
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs <dir>` green (exit 0) for the
  three edited dirs: `tdd`, `diagnose`, `create-implementation-plan`.
- No runtime code changed → no test-suite run owed (nothing in `tests/unit/` covers these files);
  state that explicitly in implementation.md rather than silently skipping.

## Testing Strategy

Prose-only diff — the gates are the executed acceptance greps + skill-lint. No unit-test surface.

## KB Impact

None — dev-repo plugin prose.

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| P14 lands in `create-implementation-plan` only, not the architect agent file | Cheapest correct locus: the skill is invoked at every plan authoring, agent-file edits force gen-commands churn + a larger blast radius | Also editing `agents/architect.md` (duplicates the rule in two shipped surfaces — drift risk) | decided |
| P12 is a variant section inside `tdd`, not a new skill | The loop is TDD's own anti-vacuity discipline applied retro-fit; a separate skill would fragment the red-green teaching | New `retrofit-tests` skill | decided |
| P13 is a Phase-3 hypothesis-class callout, not a new phase | The protocol's phases are sequential gates; mimicry is a hypothesis to rank, not a stage | New Phase 0 "verify the emitter" (over-weights a niche case) | decided |
| PATCH tier (nexus only) | Named branches/variants inside existing skills = fix-tier hardening (F9/F17 precedent) | MINOR (owner may escalate at close) | decided |
| Architect-led fast lane | Owner-approved continuation of the F17 lane shape ("ok, do it" on the F20 recommendation) | Full pipeline | decided |

## Open Questions

None.

## Plan Review

Code-grounded critic (2026-07-20): **REVISE → folded → approved.** 1 HIGH, 1 MEDIUM, 1 LOW:
- HIGH (retro-fit variant contradicts the `tdd:113` anti-pattern + Step-2 red-first with no
  reconciliation) → Step 1 now mandates both halves: the variant self-names the sanctioned
  exception AND the anti-pattern bullet gains the new-behavior scope qualifier with a variant
  cross-reference; range-scoped acceptance added.
- MEDIUM (`## Required Reading` diverges from `## Reading protocol`) → explicit pointer line
  added to Step 3 with its own acceptance grep.
- LOW (location claims not mechanically proven) → all three location gates rewritten as
  range-scoped awk|grep checks.
Critic evidence highlights: all before-state greps re-executed at `a5f276d` (all 0); P14
single-locus validated (`architect.md:175` routes plan authoring through the skill
unconditionally); P13 callout-not-phase validated (`developer.md:97` phase summary stays
accurate); acceptance greps judged non-vacuous.
