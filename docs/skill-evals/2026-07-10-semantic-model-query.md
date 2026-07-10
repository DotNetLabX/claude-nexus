# Skill Evaluation — semantic-model-query

**Evaluator:** developer (adhoc-AnalystExtension, Step 4) · **Date:** 2026-07-10
**Scope:** `plugins/nexus-analytics/skills/semantic-model-query/SKILL.md` (freshly authored this
round — no prior version). **Run artifacts consulted:** none exist yet (the skill has never
executed against a real consuming repo) — this evaluation judges the *spec* against the rubric,
not observed job fitness across a life cycle; that gap is itself noted below, not concealed.

## Layer 0 — Mechanical (scripted)

```
$ node .../improve-skills/scripts/skill-lint.mjs plugins/nexus-analytics/skills/semantic-model-query
OK    semantic-model-query
```
PASS — no blocking mechanical findings.

## Findings

### F1: Missing scope fence
**Severity:** Medium
**Layer:** 1.5
**Claim vs reality:** The rubric requires a "what this skill does NOT do" section naming adjacent
skills plus a downstream-consumers note. The authored SKILL.md has no such section — a reader
can't tell where this skill's job ends and `data-investigation`/`answer-qa`'s begin, or who
consumes its output.
**Fix:** Add a scope-fence section naming the two sibling skills and the `data-analyst` agent as
consumer. **Applied in this pass** (see Files Modified).

### F2: No lessons-capture instruction
**Severity:** Low
**Layer:** 4.1
**Claim vs reality:** No pointer for what to do when a defect or gap is discovered while using this
skill (the sibling `mine-semantic-model` skill carries this instruction; this one doesn't).
**Fix:** Add a one-line lessons-capture pointer matching the pattern already proven in
`mine-semantic-model`. **Applied in this pass.**

### F3: Prose-only mandatory-obligation checks (observation, not a blocking finding)
**Severity:** Low
**Layer:** 2.2
**Claim vs reality:** The bad-reports/no-gold-tables/large-table checks are stated as prose
discipline the model must apply at query time, not a scripted gate — Layer 2.2 prefers mechanical
checks over exhortation. However, the rubric's MUST-convert trigger is "a prose rule that has
FAILED TWICE in run evidence" — there is no run evidence yet (this skill has never executed), and
the analytics repo's own proven source (`query-patterns.md`) uses the identical prose-checklist
shape in daily production use, per the tech-spec's stated grounding. Not converted to a mechanical
gate this pass — no failure evidence to convert against, and there is no project-side tooling this
skill could script a check into (it's a modeling discipline for the model itself, applied against
whatever SQL surface the consuming repo uses). **Not fixed — recorded as a future-hardening
trigger**: if this proves to drift or get skipped in a real run, that is the point to add a
mechanical self-check (e.g. an explicit checklist the model must echo before presenting a query).

## Checked clean

- Layer 0 (all 5 mechanical checks).
- Layer 1.1 (frontmatter promise = body behavior — every capability the description claims is
  implemented: the ladder, both flavors, the 3 obligation classes).
- Layer 1.2 (no fabricated guardrail claims — this skill makes none needing separate mechanism
  verification; it's a read discipline, not a write/side-effect skill).
- Layer 1.3 (no external-system claims).
- Layer 1.4 (citation audit — the only citation, `docs/semantic-model/profile.md`, is referenced
  consistently and accurately as "this skill's only source of truth", never contradicted).
- Layer 1.6 (known failure modes — N/A for a first-authored skill with no prior lessons/runs to
  encode; nothing to have missed).
- Layer 2.1 (one concept once — no restated rules).
- Layer 2.3 (right weight — light skill, single SKILL.md, no changelog needed).
- Layer 2.4 (followable cold — the 3-step ladder + the 3-class obligation list are concrete,
  numbered, and example-bearing).
- Layer 2.5 (anti-patterns — AP1 assessed under F3 above and not converted per the stated reason;
  AP2/AP3/AP4/AP6 don't apply; AP5 — `docs/semantic-model/profile.md` is a prospective,
  explicitly-documented onboarding artifact per the tech-spec, not fictional infrastructure).
- Layer 3 overlays — none apply (not a writer, not a fan-out orchestrator, not iterating an
  unbounded list, not multi-phase/resumable).
- Layer 4.2/4.3 — N/A for a light skill pre-registration; will be live once Step 5 registers the
  plugin in `marketplace.json`.

## Verdict

**Fix-then-accept.** F1/F2 applied this pass (see `## Files Modified` in `implementation.md`); F3
recorded as an observation with an explicit future-hardening trigger, not a defect blocking
acceptance for a v1 skill with no run evidence yet.
