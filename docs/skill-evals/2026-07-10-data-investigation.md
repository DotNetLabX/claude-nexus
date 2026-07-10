# Skill Evaluation — data-investigation

**Evaluator:** developer (adhoc-AnalystExtension, Step 4) · **Date:** 2026-07-10
**Scope:** `plugins/nexus-analytics/skills/data-investigation/SKILL.md` (freshly authored this
round). **Run artifacts consulted:** none — never executed; this judges the spec, not observed
job fitness, disclosed rather than concealed.

## Layer 0 — Mechanical (scripted)

```
$ node .../improve-skills/scripts/skill-lint.mjs plugins/nexus-analytics/skills/data-investigation
OK    data-investigation
```
PASS.

## Findings

### F1: Adjacent skill named by concept, not by name, in the scope fence
**Severity:** Low
**Layer:** 1.5
**Claim vs reality:** The scope fence's third bullet ("Substitute for the resolution ladder on a
routine lookup") references `semantic-model-query`'s core concept but never names the skill
itself — a reader has to already know which skill owns "the resolution ladder."
**Fix:** Name `semantic-model-query` explicitly alongside the concept. **Applied in this pass.**

### F2: No lessons-capture instruction
**Severity:** Low
**Layer:** 4.1
**Claim vs reality:** Same gap as the other two new skills — no pointer for what to do on
discovering a defect while using this skill.
**Fix:** Add the same one-line pointer used across the other two. **Applied in this pass.**

## Checked clean

- Layer 0 (all 5 mechanical checks).
- Layer 1.1 (frontmatter promise = body — "delegates to the sibling mine-semantic-model skill's
  read-only investigation posture" is implemented exactly as claimed).
- Layer 1.2 (guardrail claim VERIFIED against a real mechanism — "read-only investigation posture"
  points to the mine's own enforced BR1 read-only-role refusal and BR12 load floor, not just an
  assertion; this skill correctly delegates the mechanism rather than re-asserting it).
- Layer 1.3 (no external-system claims).
- Layer 1.4 (citation audit — BR1/BR12 are real obligation IDs in `mine-semantic-model`'s own
  obligations table, checked against that file; not a mismatched or invented citation).
- Layer 1.5 (partially — scope fence IS present, unlike the other two skills; F1 above is a naming
  polish within an already-present fence, not an absent one).
- Layer 1.6 (the "inconclusive" branch is an explicitly encoded failure mode — "say so to the
  user; do not present a guess as a resolved answer, and do not block indefinitely").
- Layer 2.1 (one concept once — the mine's own method isn't restated here, only referenced).
- Layer 2.3 (right weight — light skill, single file).
- Layer 2.4 (followable cold — the "when to invoke" / "delegate" / "routing a finding" flow is a
  clear three-part decision structure).
- Layer 2.5 (anti-patterns — AP5 assessed: delegating entirely to `mine-semantic-model` rather than
  vendoring any of its probe catalog is the SPEC-MANDATED zero-duplication design (tech-spec
  Decisions table), not a fictional-infrastructure risk; AP1/AP2/AP3/AP4/AP6 don't apply).
- Layer 3 overlays — none apply directly (this skill doesn't itself run probes or spawn agents; it
  delegates that entirely to the mine, which carries its own overlay compliance from its own prior
  evaluation under adhoc-MineSemanticModel).
- Layer 4.2/4.3 — N/A pre-registration (Step 5).

## Verdict

**Fix-then-accept.** Both findings are Low-severity polish, applied in this pass.
