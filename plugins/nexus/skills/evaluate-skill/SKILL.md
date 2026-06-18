---
name: evaluate-skill
description: Evaluates an existing skill's implementation quality and job fitness — lint first, then the judgment layers of the shipped rubric, producing a severity-rated findings doc and consolidating fixes. Use when a skill misbehaves or underdelivers, after major changes to a skill, or for a periodic review of the skill estate. This is the DIAGNOSE half (it produces findings); improve-skills is the APPLY half that acts on them. Order: evaluate-skill first, then improve-skills — they are not interchangeable.
user-invocable: true
---

# Evaluate Skill

The *review* standard for skills — the third leg of the quality system: `improve-skills`
writes and fixes (the write standard), its `skill-lint` checks form (the mechanical
standard), this skill judges **fitness** (does the skill actually do its job well, for its
real consumers?). It runs evaluations; it is not passive reference material.

## The Lens

Judge the skill against its **own job statement**: input → output → consumer → what
"excellent" looks like *for that consumer*. Every improvement proposed must serve that
specific job — polish that serves no consumer is noise. Two questions anchor everything:

1. **First-pass quality** — when the skill runs, is the output right?
2. **Job fitness** — does the *job* get done across its whole life (correction, refresh,
   revision — not just creation)? Measured pattern: estates score high on first-pass and
   fail on loop-closure; check both.

## Process

1. **Scope.** Name the target skill, read its SKILL.md fully (+ `references/`, `workflows/`,
   changelog if present). Decide the channel up front: a **project-local** skill
   (`.claude/skills/`) can be fixed directly; a **shipped plugin skill** lives in the
   version-keyed cache — findings route to the portable feedback file
   (`docs/plugin-feedback/`), never edits (ADR-1).
2. **Gather run evidence before judging.** A fitness verdict needs ground truth: recent run
   artifacts, receipts/state files, lessons entries, audit logs — whatever shows how the
   skill behaved in practice. An evaluation from the SKILL.md text alone judges the *spec*,
   not the *skill*; say so explicitly if that's all you have.
3. **Layer 0 — run the lint.** `node {improve-skills folder}/scripts/skill-lint.mjs
   {skill-folder}` (the script ships with `improve-skills`, next to its SKILL.md; in a
   consuming project resolve via the plugin cache). Mechanical findings are fixed (local) or
   recorded (shipped) before judgment review starts — don't burn judgment time on them.
4. **Layers 1–4 + overlays.** Work through `references/rubric.md`: contract & safety,
   legibility, the capability overlays that match the skill, maintenance hooks. If the
   consuming project keeps its own overlay rules (project-specific capability checks), apply
   those too.
5. **Write the findings doc** to `docs/skill-evals/{YYYY-MM-DD}-{skill-name}.md` using the
   format in the rubric: severity-rated findings (claim vs reality, one-move fix), a verdict
   (ACCEPT / fix-then-accept / rework), and the rubric items **checked clean** — an
   evaluation that lists only failures hides its own coverage.
6. **Route the fixes.** Local skill → apply via `improve-skills` (consolidating pass — net
   complexity flat or down; lint as the done-condition; backlog + changelog entries).
   Shipped skill → one feedback-file entry per finding cluster, with the evidence citations.
   Never fix-and-not-log: the findings doc is the durable record either way.
7. **Capture lessons** — anything the evaluation taught that isn't skill-specific goes to
   the project's lessons flow.

## Arguments

Pass the skill name: `evaluate-skill kb-sync`. Optionally a scope hint: `evaluate-skill
meeting-to-notes — focus on the batch mode`.

## What This Skill Does NOT Do

- Fix skills inline during the evaluation — fixes go through `improve-skills` (local) or the
  feedback file (shipped), *after* the findings doc exists. Author and reviewer stay
  separate passes.
- Evaluate agents, rules, or conventions — skills only.
- Replace the lint — Layer 0 is the lint's job; this skill starts where the script stops.
- Invent a job statement the skill never claimed — when the description is too thin to
  evaluate against, that itself is a finding (Layer 1.1).
