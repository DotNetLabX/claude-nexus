# Distill Prompt Skill — Summary

## Status: COMPLETE

## What Was Built
A new user-invocable nexus-core skill, `/nexus:distill-prompt`, that rewrites a verbose or
underspecified prompt into a tight, effective one (clear task, binding constraints, defined output
shape) **without dropping any load-bearing requirement** — a 7-stage method with an explicit
lossless-on-requirements rule and an explicit never-invent rule. Ships in `plugins/nexus/skills/`,
human-triggered only (`disable-model-invocation: true`).

## Key Outcomes
- **Files:** 1 skill created (`plugins/nexus/skills/distill-prompt/SKILL.md`); version bump
  (`plugin.json` 1.14.1 → **1.15.0** MINOR, owner-escalated) + `CHANGELOG.md`; omni twin
  regenerated (`../omni`); 1 test-gate fix (`tests/lint/wiring.test.mjs`); supporting docs
  (`docs/skill-evals/2026-06-20-distill-prompt.md`, `docs/skill-backlog.md`).
- **Gates:** `skill-lint` exit 0; `selfcheck` 4/4 PASS; `frontmatter.test.mjs` 4/4; `wiring.test.mjs`
  4/4 — all re-run fresh by the architect (done-check) and reviewer (Step 2).
- **Review:** Step-1 done-check **PASS** (0 Missing, 1 valid deviation). Step-2 **APPROVED** by the
  reviewer (no CRITICAL/HIGH), 1 cycle. Codex cross-check returned NO-GO; **overridden** after
  finding-by-finding reconciliation — both BLOCKERs refuted against live source (see Notes).

## Deviations from Plan
- **`tests/lint/wiring.test.mjs` resolver fix (accepted).** selfcheck failed because the wiring lint
  resolved every `/nexus:X` reference to a shipped *agent* only; the new skill's own
  `/nexus:distill-prompt` description string had no matching agent. Fixed at root cause (resolver now
  accepts agent **or** skill) rather than mangling the load-bearing description. Test file, not shipped
  `plugins/**` → no extra version bump. Latent gap that would have hit the first user-invocable skill
  without a matching agent.
- **Owner-directed active improve-skills pass.** Applied 3 AP3 (one-fact-one-owner) consolidations to
  SKILL.md (opener, grounding section, output-block shape) — net complexity down.

## Notes
- **Codex NO-GO was a false alarm and was overridden.** BLOCKER-1 ("frontmatter not
  `name/description/usage/examples`") was a hallucinated schema — the repo's enforced closed key set
  (`frontmatter.test.mjs:13`) is `name/description/user-invocable/disable-model-invocation`, all four
  present, test green. BLOCKER-2 ("never-invent") is stated explicitly twice in SKILL.md. The lone WARN
  (lowercase-only resolver) is non-blocking — plugin/skill names are lowercase kebab-case. Codex also
  could not run `node --test` (sandbox EPERM), so it was code-read-only. Full reconciliation in
  `communication-log.md` Runtime/Issues + `review-codex.md`.
- **Omni twin:** regenerated in `../omni` and committed there separately with the mirroring-message
  convention (CLAUDE.md) — not part of this repo's commits.
- The unrelated untracked `docs/kb/research/plugin-token-optimization.md` was deliberately left out of
  the commits (pre-existing, not part of this work).
