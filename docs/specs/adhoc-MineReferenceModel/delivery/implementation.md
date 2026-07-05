# mine-reference-model — Implementation

Steps 1–3 implemented (developer). Step 4 is operator-owned (see Deviations → OPERATOR ACTION
REQUIRED); no developer action taken on it.

## Files Created
- `plugins/nexus/skills/mine-reference-model/SKILL.md` — the new fourth mine (v1). Single-file heavy
  skill (no `references/` — v1 has no runbook-weight material). Carries the tech-spec method: `# `
  intro + mine-family table → `## The pipeline` (Extract → Consolidate → Verify → Grade → Write →
  Refresh) → `### Execution topology` (session-owned orchestration, five parallel `general-purpose`
  extractors then ONE consolidate+skeptic, orchestrator has no filesystem, Entry-6 sizing basis) →
  `## Contracts` R1–R6 → `## Binding prompt obligations (grep-checkable)` → `## Safety rails` →
  `## What this skill does NOT do` → `## Relationship to other skills` (rows: `mine-verify-repo`,
  `mine-verify-cover`, `mine-from-spec`, `improve-skills` as the NOT-consumer for stage 2). Satisfies
  AC-1, AC-2.
- `docs/skill-evals/2026-07-05-mine-reference-model.md` — the `evaluate-skill` findings doc (Step-1
  Judgment Gate). Verdict ACCEPT; one Low (F1, model policy) routed as a carry-over, no Critical/High.

## Files Modified
- `plugins/nexus/skills/mine-verify-repo/SKILL.md` — four surgical cross-reference edits (Step 2,
  AC-3): (1) family enumeration ("This is the third mine.") now names `mine-reference-model` as the
  fourth sibling (ONE reference repo; ground truth reference source; gate skeptic re-execution /
  invented-virtue kill) — the three existing mine descriptions kept intact; (2) C4 `by-design`
  adjudication-reference clause adds `docs/reference-model.md` as an **additional** formal source
  alongside the repo's own ADRs/conventions; (3) C5 triage clause likewise, keeping the existing
  referent and degrade condition (`no-reference-model` fires only when no reference model of any kind
  exists — additive, never replacement, per the critic's HIGH resolution); (4) a
  `mine-reference-model` relationship-table row (the "what to copy" arm). Pipeline-block line 44
  ("against the reference model") confirmed still consistent — no edit, as the plan anticipated.
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — one edit (Step 2, AC-3): a
  `mine-reference-model` relationship-table row after the `mine-verify-repo` row (reference-repo
  sibling; virtues not debts; no Cover arm — gate is skeptic re-execution, not a mutation gate).
- `plugins/nexus/.claude-plugin/plugin.json` — version 1.22.1 → 1.23.0 (Step 3, MINOR bump via
  `bump-plugin.mjs --minor`, owner-escalated for the new capability).
- `plugins/nexus/CHANGELOG.md` — 1.23.0 entry, generated stub rewritten to describe the actual change
  (new skill + the two cross-reference edits).

## Key Decisions
- **F1 (evaluate-skill Low) not fixed — routed as carry-over.** The fan-out overlay flags "state a
  model policy"; the tech-spec is silent on model and the structural donor `mine-verify-repo` omits a
  `## Model` section too. Adding one is design beyond the plan/spec (developer scope boundary), so it
  is a Low carry-over to the architect/reviewer, not an improvised code fix. See F1 in the findings
  doc and Carry-Over below.
- **Relationship-table placement.** In `mine-verify-repo` the new row is appended after the
  `mine-from-spec` row (keeps the mine-family rows readable at the end); in `mine-verify-cover` it is
  placed immediately after the `mine-verify-repo` row (topical grouping of the two sibling mines). The
  plan said "add a row" without pinning position; both placements are surgical and touch nothing else.
- **Read the repo-source `references/skill-recipe.md`, not the plugin cache.** The recipe ships in
  nexus 1.22.1 but was absent from the 1.21.0 cache the Skill tool loaded; the dev-repo `plugins/**`
  copy is authoritative. (Skill tool invocations themselves succeeded on both `improve-skills` and
  `evaluate-skill`; only the recipe reference file was cache-absent, read from source.)

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | improve-skills, evaluate-skill | dev-repo carve-out authoring path (consulted `references/skill-recipe.md` + `proven-patterns.md`); Judgment Gate = lint `OK` (exit 0) + `evaluate-skill` verdict ACCEPT (1 Low carry-over, no Critical/High to fold). TDD: no (method text, not executable code — plan-sanctioned). |
| 2 | None | Cross-reference wiring edits only (plan: `Skill: None`). |
| 3 | release-plugin | `--dry-run` → PATCH proposed; owner-escalated `--minor` → 1.22.1 → 1.23.0; CHANGELOG described; CI `--check` exit 0. No `gen-commands` (no agents changed); omni-twin sync + commit + tag deferred to team lead (commit-time). |
| 4 | mine-reference-model (not run) | OPERATOR ACTION REQUIRED — operator-owned pilot, not executable in-pipeline (see Deviations). |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| No model policy stated for the fan-out agents | low | reviewer/architect | `evaluate-skill` F1; `docs/skill-evals/2026-07-05-mine-reference-model.md` | Tech-spec silent + donor `mine-verify-repo` omits it too; if wanted, mirror `mine-verify-cover` (Sonnet extractors, possibly-stronger skeptic). Not fixed — would be design past the spec. |
| `skill-recipe.md:79` overstates lint coverage | low | learner (via architect) | recipe claims E7/E8 enforce comparator rephrasing; E7 = XML-tag tokens only | Already flagged by the architect; re-confirmed by the developer while authoring under the recipe (provenance now 2 sightings). Shipped-skill fix → feedback channel, not this slug. |

## KB Changes
None (docs/skill artifacts only — KB Impact confirmed None in the plan).

## Deviations from Plan
- **Step 4 — OPERATOR ACTION REQUIRED (no developer action).** The pilot run is operator-owned and
  not executable in-pipeline. Parameters, verbatim from the plan for the operator: reference repo
  `D:/src/dotnet-microservices` → consuming repo `D:\Omnishelf\omnishelf_flutter_app` (stack tag
  Flutter/Dart), seed doc
  `D:/omnishelf/app_flutter/docs/proposals/architecture-review/dotnet-reference.md` (seed rows
  re-verified per R1, never trusted on age/authorship). Output `docs/reference-model.md` in the
  consuming repo (the durable home — the Flutter program's Step-10 triage reads
  `docs/reference-model.md`, not a run-scoped `delivery/` copy). Capture in the run report: patterns
  mined/confirmed/killed (the survival rate — the flattery measurement), per-dimension counts,
  seed-row fate. Skill defects flow back as plugin feedback in the consuming repo, not silent local
  fixes. There is **no build-time helper script** for this step — it is a manual run of the shipped
  skill by the operator; a PASS on Steps 1–3 proves the skill ships and gates green, not that the
  method works on a real reference repo (AC-5).
- **No commit / no omni-twin sync / no tag (by design).** The developer never commits or advances the
  pipeline; the release-plugin skill left `plugin.json` + `CHANGELOG.md` staged-ready. The omni-twin
  regeneration + mirrored commit and the re-check-branch-before-commit step are the team lead's
  commit-time concerns per the repo CLAUDE.md and the plan's Step 3.

## Verification
- `skill-lint.mjs` → `OK` on all three skills (`mine-reference-model`, `mine-verify-repo`,
  `mine-verify-cover`) — exit 0.
- `evaluate-skill` Judgment Gate → verdict ACCEPT (no Critical/High/Medium; one Low carry-over).
- `bump-plugin.mjs --check` (CI backstop) → exit 0; `plugin.json` version = 1.23.0.
- No executable tests in this repo (plan Testing Strategy: `evaluate-skill` + `skill-lint` + CI
  plugin-release check are the verification surface — all green).

*Status: COMPLETE — developer, 2026-07-05*
