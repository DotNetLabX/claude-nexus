# Skill Evaluation — mine-reference-model

**Evaluator:** developer (adhoc-MineReferenceModel, Step 1 Judgment Gate)
**Date:** 2026-07-05
**Scope read:** `plugins/nexus/skills/mine-reference-model/SKILL.md` (new, v1 — authored this pass);
cross-checked against `docs/specs/adhoc-MineReferenceModel/definition/tech-spec.md` (R1–R6, AC-1..5),
the structural donors `plugins/nexus/skills/mine-verify-repo/SKILL.md` and
`plugins/nexus/skills/mine-verify-cover/SKILL.md`, and `docs/architecture/README.md` (ADR-45/47/48/49/50).
**Run artifacts consulted:** none — the skill has not run yet (the pilot is the operator-owed Step 4).
This evaluation therefore judges the **spec-as-written** against the rubric, not runtime behavior; the
survival-rate / flattery-kill evidence lands only with the pilot (AC-5).
**Layer 0 (lint):** `skill-lint.mjs` → `OK  mine-reference-model` (exit 0).

## F1: Fan-out overlay omits an explicit model policy

**Severity:** Low
**Layer:** Layer 3 — capability overlay (spawns subagents / fan-out): "states its concurrency cap and
model policy."
**Claim vs reality:** The Execution-topology section states the **concurrency cap** (default five
dimension extractors in parallel, then ONE consolidate+skeptic) but states **no model policy** for the
staged `general-purpose` agents. The sibling `mine-verify-cover` carries a `## Model` section (pin
agents to Sonnet, reserve a stronger model for the Verify skeptic); this skill's primary structural
donor `mine-verify-repo` carries **none** and passed its own eval (`docs/skill-evals/2026-07-04-mine-verify-repo.md`).
**Fix:** Deliberately **not fixed in this pass** — the tech-spec (R1–R6) is silent on model, the plan's
Step-1 structural spec did not request a `## Model` section, and inventing one is design beyond the
plan/spec (developer scope boundary). Routed as a Low carry-over to the architect/reviewer: if a model
policy is wanted, the natural call mirrors `mine-verify-cover` — Sonnet extractors, a possibly-stronger
skeptic (the skeptic is the flattery gate, where model strength most plausibly pays). No consumer is
harmed in v1 by inheriting the session model, so this is polish, not a defect.

## Verdict

**ACCEPT.** No Critical/High/Medium findings; one Low (F1) routed as a design carry-over, not a code
fix. The skill is lint-green and its load-bearing contracts, safety rails, and grep-checkable prompt
obligations are present and internally consistent.

## Rubric items checked clean

- **Layer 1.1 — frontmatter promise = body.** Every `description` capability (parallel clean-room
  extraction per dimension, skeptic re-execution / invented-virtue kill, `portable|adapt|not-portable`
  grading, translation dictionary, `docs/reference-model.md` in the consuming repo, read-only, C5
  consumption) is implemented in the body (pipeline + R1–R6).
- **Layer 1.2 — guardrail claims have mechanisms.** "Read-only on both repos" is backed by R6's
  agents-do-I/O + the forbidden-list (no source edits), not just a sentence; "reasoning-only verdicts
  forbidden" is backed by the structural drop-without-excerpt enforcement (R3), not a bare request.
- **Layer 1.3 — external-system claims.** None (no external API); N/A.
- **Layer 1.4 — citation audit.** ADR-43/45/47/48/49/50, ADR-21, C3/C5 references transcribed from the
  tech-spec and verified against `docs/architecture/README.md` (ADR-45 line 63, ADR-47 line 65, ADR-48
  line 66, ADR-49 §line 1193, ADR-50 §line 1227) and the sibling SKILL.md (C3 verify gate, C5 triage).
- **Layer 1.5 — scope fence + consumers.** "What this skill does NOT do" names adjacent skills
  (`improve-skills`, `mine-verify-repo`, `/security-review`); R5 names the downstream consumers
  (mine-verify-repo C5, the ad-hoc lane).
- **Layer 1.6 — known failure mode encoded.** The flattery failure mode is the central encoded concern
  (R3 + the binding prompt obligations), not left to lessons.
- **Layer 2.1 — one concept once.** The two summary sections (Binding prompt obligations; Safety rails)
  restate contract clauses **by design and by parity with `mine-verify-repo`**: AC-2 requires the
  binding obligations to be independently grep-findable, and Safety rails explicitly names R6 as "the
  single source … nothing here overrides it" — the deliberate-copy convergence check the rubric asks
  for is the R6 pointer.
- **Layer 2.3 — right weight.** Heavy method, single SKILL.md — precedented by `mine-verify-cover`
  (also heavy, single-file); the plan explicitly ruled v1 has no runbook-weight material, so an empty
  `references/` folder would be noise.
- **Layer 2.5 — proven-patterns anti-patterns.** AP1 (every MUST has an executor: skeptic-must-run →
  orchestrator drops rows without excerpts; budget cap → orchestrator gates the delta), AP5 (no
  fictional paths/tools — `docs/reference-model.md` is the skill's own output, `/security-review` is
  real), AP6 (finalize path: report-on-halt, never silently green) all clear.
- **Layer 3 — fan-out overlay (except F1).** Completion is disk-verified (drop-without-excerpt is a
  written-artifact check); dispatch reads inputs from a path, not bulk-pasted content; concurrency cap
  stated. Idempotent re-runs + append-only changelog + rows-never-deleted stated (R4).
- **Layer 4.2/4.3 — maintenance hooks.** Changelog + version bump is the plugin-level release concern
  (Step 3, `release-plugin`); ADR-50 is the registration record and is present in the architecture
  README (no per-skill index exists to add a row to).
