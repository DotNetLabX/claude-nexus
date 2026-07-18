# Skill-gap registry — nexus (F10 Tier-A post-standardization fixture)

**Fixture run of `mine-skill-gaps` (Follow-by-Read, plan D2)** over this repo's
`docs/specs/*/delivery/` estate on 2026-07-18. Tier A exercises the **pre-flagged** path: the
candidate-of-record is the fielded `## Skill Gaps` lessons entry (`### {Suggested skill name}`,
per `lessons-format`); a plan `gap:` cell **corroborates only** (never an independent counted
candidate); an orphan `gap:` cell with no matching lessons entry is a **capture-leak**, not a
candidate. Discovery only — owner triages `candidate → confirmed`. This is a fixture copy; the real
consumer path is `docs/skill-gaps/registry.md` in the swept repo.

**Estate swept:** ~40 `*/delivery/lessons.md` (28 with a `## Skill Gaps` section) + the sibling
plan.md files. **Verify (Tier A):** citation-resolution — each cited lessons entry / plan cell
re-read at its line and confirmed to say what the row claims (deterministic grep; the fresh-context
cluster-skeptic is reserved for Tier-B, where coincidental-grouping risk lives). **Parser posture:**
tolerant — the fielded `### {name}` form is rare in this estate (4 entries); most gap candidates are
expressed as bold-lead bullets, which the tolerant read also surfaces (this is the estate's
strongest cross-plan signal — see row 1).

## Candidate skills (ranked by recurrence — plan count first)

| name | kind | recurrence | citations | repo | skeptic excerpt (citation-resolution) | last_verified | status |
|------|------|-----------|-----------|------|----------------------------------------|---------------|--------|
| `skill-hook-agent-authoring` | gap | 6 plans / ~7 rows | adhoc-LearnerCadenceNudge; adhoc-MineSemanticModel; adhoc-AnalystExtension; adhoc-PipelineGatesHardening; F5-SkillGapCapture (`### edit-shipped-agent-file`); adhoc-UnattendedAutonomy | nexus | Citation-resolved. Explicit cross-plan self-nomination with the promotion bar named: adhoc-AnalystExtension states this is the "3rd consecutive occurrence (LearnerCadenceNudge hook-authoring → MineSemanticModel skill-promotion → this one) … the recurrence bar is met." Fielded member `### edit-shipped-agent-file` resolves at F5-SkillGapCapture/lessons.md:115. | 2026-07-18 | candidate |
| `harness-workflow-authoring` | gap | 3 plans / ~3 rows | F7-MineMachineryBorrowWave2 (`### harness-workflow-authoring`); adhoc-SddCoverageLoop (`harness-inline-helper` bullet); adhoc-MineVerifyCoverHarness (`author-cover-workflow`, since filled by mine-verify-cover) | nexus | Citation-resolved: fielded entry at F7/lessons.md:126; **corroborated (not double-counted) by** the F7 plan.md:37 `gap:` cell "harness/Workflow tooling authoring (logged in lessons.md)" — same candidate, so the cell folds in, one row. | 2026-07-18 | candidate |
| `inlined-copy-convergence-check` | gap | 1 plan / 1 row | F7-MineMachineryBorrowWave2 (`### inlined-copy-convergence-check`) | nexus | Citation-resolved: fielded entry at F7/lessons.md:112 — a mechanical convergence test that a Workflow driver's inlined-VERBATIM copy of a shipped lib helper matches source. Narrower sibling of `harness-workflow-authoring`; kept distinct (its own `### ` entry). | 2026-07-18 | candidate |
| `skill-lint-colon-space-check` | fix | 1 plan / 1 row | adhoc-NexusResearch (`### skill-lint should catch colon-space in an unquoted \`description:\``) | nexus | Citation-resolved: fielded entry at adhoc-NexusResearch/lessons.md:78. Kind=`fix` (a fix to a shipped skill, `skill-lint.mjs`), not a new-skill gap; its own heading self-labels "(Fix to a shipped skill)". | 2026-07-18 | candidate |

## Corroboration folded (not counted as separate candidates)

- **F7-MineMachineryBorrowWave2 plan.md:37 `gap:` cell** ("harness/Workflow tooling authoring")
  and its steps 2–7 `— (same gap)` cells → folded into `harness-workflow-authoring`. This is the
  candidate-of-record rule working: the cell corroborates its lessons entry, one row, zero
  double-count.
- **`### edit-shipped-agent-file` (F5, fielded)** → folded into `skill-hook-agent-authoring` as its
  agent-file-editing facet (strengthen-don't-duplicate), rather than a twin row.

## Capture leaks

None. The only literal plan `gap:` marker in the estate (F7 plan.md:37) has a matching lessons
entry (`### harness-workflow-authoring`), so it corroborates rather than orphaning. No orphan
`gap:` cell (a gap the estate noticed but never logged) was found.

## Run report

- **Estate:** this repo's `docs/specs/*/delivery/` — 28 `lessons.md` carry a `## Skill Gaps`
  section; only 4 use the fielded `### {name}` form; the sibling plan.md files carried exactly one
  literal `gap:` skill-mapping cell (F7).
- **Tier-A candidates-of-record:** all 4 fielded `### ` entries surfaced (2 folded/consolidated per
  the corroboration rules above, yielding 4 ranked rows with no double-counts).
- **Tolerant-parse finding:** the estate's strongest cross-plan gap (`skill-hook-agent-authoring`,
  6 plans) lives in the **bold-bullet** form, not the fielded `### ` form — the strict `### `-only
  read would miss the single most-nominated gap. Surfacing it is the tolerant-parser posture the
  skill's S1 calls for, and it is a recorded developer lesson.
- **Verify:** Tier-A citation-resolution by deterministic grep — every cited lessons entry / plan
  cell re-read at its exact line and confirmed. (Zero double-counts is the Tier-A accept; met.)
- **Acceptance vs the tech-spec Tier-A gate:** fielded `## Skill Gaps` entries appear as
  candidates-of-record (met); `gap:` cells fold as corroboration only (met — the one F7 cell); one
  row per candidate, zero double-counts (met).

## Changelog (append-only)

- 2026-07-18 — Initial fixture run. 4 candidate rows (3 gap, 1 fix); 1 `gap:` cell + 1 fielded
  entry folded as corroboration; 0 capture leaks.
