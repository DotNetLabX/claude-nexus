# mine-reference-model — Implementation

Steps 1–3 implemented (developer). Step 4 is operator-owned (see Deviations → OPERATOR ACTION
REQUIRED); no developer action taken on it. Step 5 (post-ship self-reference-mode amendment,
owner-directed 2026-07-05) implemented in a second round — see the Step 5 entries below.

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

**Step 5 (post-ship amendment, 2026-07-05):**
- `plugins/nexus/skills/mine-reference-model/SKILL.md` — three surgical edits per tech-spec R1's
  self-reference-mode bullet (binding wording source): (1) `## Contracts` → R1 Inputs & scope —
  new bullet between "Optional seed docs" and "Cost rail": reference repo = consuming repo is a
  valid parameterization, portability collapses to `portable`, translation dictionary omitted, run
  report states the mode, skeptic gate unchanged (cross-refs R3); (2) R3 Verify gate — new bullet
  after the clean-room-extractor bullet: in self-reference mode the skeptic additionally
  cross-checks each confirmed pattern against the repo's `docs/tech-debt/` rows, a contradiction
  demotes to IMPRECISE, never silent CONFIRMED; (3) frontmatter `description` — extended the "Use
  when" clause with "— or the repo itself, self-reference mode, to formalize its own unwritten
  conventions" (795 → 951 chars, under the 1024-char W2 lint cap).
- `plugins/nexus/.claude-plugin/plugin.json` — version 1.23.0 → 1.23.1 (Step 5, PATCH bump via
  `bump-plugin.mjs`, default accepted — no owner escalation; 1.23.0 was already committed so this
  is a fresh bump, not a ride-within).
- `plugins/nexus/CHANGELOG.md` — 1.23.1 entry added above the 1.23.0 entry ("PATCH bump. - skill
  change (mine-reference-model)").

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
| 5 | None; release-plugin | Content edit: `Skill: None` per plan (surgical single-file wording amendment, no restructuring). Bump: originally applied by running `scripts/bump-plugin.mjs` directly (`--dry-run` proposed PATCH 1.23.0 → 1.23.1, accepted as-is, no owner escalation) — NOT via the Skill tool at that point, so the audit log (`.claude/audit/skill-invocations.log`) carried no record; a done-check finding (fix cycle 1/3) caught the gap. `release-plugin` Skill invocation completed after the finding, validate-only (no re-bump — 1.23.1 rides within; the post-bump `--dry-run` correctly proposed 1.23.2, the documented false dirty-vs-HEAD signal on an already-bumped uncommitted feature, ignored per the fix instruction): `claude plugin validate plugins/nexus --strict` → "Validation passed". Left uncommitted per role boundary. |

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
- **Step 5 — none.** Fully specified by the plan (three exact bullets) and the tech-spec R1 binding
  wording; no ambiguity, no questions needed. Bump left uncommitted (developer never commits) —
  same commit-time deferral as Step 3, re-stated here since 1.23.0 was already committed between
  Step 3 and Step 5 (this pass is a fresh PATCH, not a ride-within, per the plan's explicit note).
  Two unrelated files (`docs/specs/adhoc-MineReferenceModel/definition/tech-spec.md`,
  `docs/specs/adhoc-MineReferenceModel/delivery/plan.md`) were already modified/uncommitted in the
  working tree before this round started (the architect's Step-5 authoring); the developer made no
  edits to either — read-only per role boundary.
- **Fix cycle 1/3 (done-check FAIL, evidentiary).** The bump was originally applied by running
  `scripts/bump-plugin.mjs` directly, without a Skill-tool invocation — a workable path, but the
  original `## Skills Used` row 5 asserted "release-plugin invoked", which
  `.claude/audit/skill-invocations.log` refuted (zero entries for this run). Fixed by (1) invoking
  `release-plugin` via the Skill tool, validate-only — no re-bump, since 1.23.1 was already applied
  and uncommitted (rides within; the post-bump `--dry-run` correctly proposed 1.23.2, the documented
  false dirty-vs-HEAD signal, ignored per instruction) — and (2) amending row 5 to the truthful
  record. No content files (SKILL.md, plugin.json, CHANGELOG.md) touched in this fix cycle, per the
  coordinator's instruction that the content edits were already verified correct.

## Verification
- `skill-lint.mjs` → `OK` on all three skills (`mine-reference-model`, `mine-verify-repo`,
  `mine-verify-cover`) — exit 0.
- `evaluate-skill` Judgment Gate → verdict ACCEPT (no Critical/High/Medium; one Low carry-over).
- `bump-plugin.mjs --check` (CI backstop) → exit 0; `plugin.json` version = 1.23.0.
- No executable tests in this repo (plan Testing Strategy: `evaluate-skill` + `skill-lint` + CI
  plugin-release check are the verification surface — all green).

**Step 5 verification:**
- `grep -n -i "self-reference" plugins/nexus/skills/mine-reference-model/SKILL.md` → 3 hits: line 3
  (frontmatter `description`), line 92 (R1 Inputs & scope bullet), line 134 (R3 Verify gate
  cross-check bullet) — all three plan-required locations present.
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-reference-model`
  → `OK    mine-reference-model` (no warnings — description at 951 chars, under both the 40-char
  floor and 1024-char cap).
- `node scripts/bump-plugin.mjs --dry-run` → `nexus: PATCH 1.23.0 -> 1.23.1 - skill change
  (mine-reference-model)`; `node scripts/bump-plugin.mjs` (apply) → `plugin.json` 1.23.1,
  `CHANGELOG.md` 1.23.1 entry written. Left uncommitted (developer never commits).

*Status: COMPLETE — developer, 2026-07-05 (Step 5 amendment round)*
