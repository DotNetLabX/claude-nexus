# F18-SkillAuthoringStandards — Implementation

Standards for stack-extension skill authoring: the `## Assumes` block (P11) and step-shape
discoverability (P20), landed as skill-recipe §4 (the standard), skill-lint W5/W6 (the deterministic
warn tier + tests), and the improve-skills/evaluate-skill judgment wiring — then a MINOR release.

## Files Modified

- `plugins/nexus/skills/improve-skills/references/skill-recipe.md` — **Step 1.** Title extended to
  name the new section (`… frontmatter cheat-sheet, stack-skill standards`); §3 `description:` row
  gained a one-line pointer to §4's discoverability standard (pointer, not restatement); appended
  **§4 — Stack-skill standards (binding for stack-extension plugins)** with §4.1 Assumes block (P11),
  §4.2 discoverability (P20), §4.3 scope + enforcement. Acceptance: `## 4.` heading at :124,
  `## Assumes` ×4, `Use when` present, title names the section, skill-lint exit 0.

- `plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` — **Step 2.** Added the
  `stackPluginDir()` predicate (segment immediately above `skills/`, split on both `\` and `/` for
  win32) + `isStackPlugin` (suffix `/-(dotnet|flutter|cpp|php)$/`); added the W5 check (`^## Assumes`
  heading missing) and W6 check (`data.description.toLowerCase().includes('use when')` — case-insensitive
  substring) inside the frontmatter-present branch, guarded by `isStackPlugin`; extended the header
  comment enumeration W1–W4 → W1–W6. Warns only — exit code still keyed on errors (unchanged :158/now
  the same line). Actual baselines from the full stack census: **W5 = 42** (all 42 stack skills, 0 have
  `## Assumes`), **W6 = 5** (frontend-review, pinia-patterns, tailwind-theme, vue-component-architecture,
  vue-patterns — exactly the plan's census). Acceptance: full glob suite green (593 pass); create-feature
  emits W5 + no ERROR + exit 0; improve-skills emits neither (scope exclusion).
- `tests/unit/skill-lint.test.mjs` — **Step 2 (TDD).** Extended `makeSkill` with an `opts.plugin`
  param nesting fixtures under `<sandbox>/<plugin>/skills/<name>` so the predicate reads a real plugin
  dir (critic F). Added: W5-fires (red-first, genuine); W6-fires (red-first proven by neutralizing the
  W6 branch — went red for the right reason, then restored); W6 "Use whenever …" substring passes;
  scope-exclusion (a skill that trips BOTH W5+W6 on `-dotnet` stays clean under `nexus-core`, with a
  same-skill `-dotnet` control proving the plugin dir is the only gate).

- `plugins/nexus/skills/improve-skills/SKILL.md` — **Step 3.** Deterministic Gate warn summary (:110)
  extended with a clause naming the stack-standards warns (W5 missing `## Assumes`, W6 missing `use when`,
  scoped to stack-suffix plugins, per skill-recipe §4) — keeps the prose summary faithful to the check
  list (critic C.2). Quality Gate gained one bullet: a stack-extension skill meets skill-recipe §4
  (Assumes block + step-shape description) — pointer, no restatement.
- `plugins/nexus/skills/evaluate-skill/references/rubric.md` — **Step 3.** Added a Layer 3 capability
  overlay "**Stack-extension skill**" holding only the stack-specific half — the `## Assumes` block
  present **and honest**, the description names step-shapes — pointing at (not restating) Layer 0.3/1.1's
  general description rules (critic LOW / AP3). Acceptance: skill-recipe in Quality Gate section (:154);
  `Assumes` present in rubric.md; skill-lint exit 0 on improve-skills and evaluate-skill.

- `plugins/nexus/.claude-plugin/plugin.json` + `plugins/nexus/CHANGELOG.md` — **Step 4.** MINOR bump
  1.46.0 → **1.47.0** (owner-sanctioned per plan; veto-to-PATCH open at close). Dry-run reasons named
  ONLY `skill change (evaluate-skill)` + `skill change (improve-skills)` — no F27 / adhoc-VwhRound4Eval /
  mine-family-research contamination (rule-2 clean; all that dirt is under docs/, no bump). CHANGELOG
  stub replaced with a real F18 entry. **No gen-commands** (no agent files changed), **no gen-omni**,
  **no commit/tag** — lane close owns those (per plan + edit-shipped-plugin-skill phase 6).
- `docs/backlog.md` — **Step 4.** F18 row status `Ready` → `Done (shipped 2026-07-23, nexus 1.47.0)`
  (no sha — commit is at lane close).

## Key Decisions

- §4 states each standard once and **points at** its enforcement surfaces (skill-lint W5/W6, the
  evaluate-skill overlay) rather than restating the check logic — one owner per fact (AP3), the
  point-don't-restate posture the critic pinned for the rubric row applied uniformly.
- `## Assumes` references in §4 are wrapped in backticks (inline code), so the recipe file itself
  does not sprout a stray structural H2 while still satisfying the `## Assumes` acceptance substring.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | edit-shipped-plugin-skill — **Read-channel deviation** | Skill tool returned "Unknown skill" on both `edit-shipped-plugin-skill` and `nexus:edit-shipped-plugin-skill`; the skill is net-new in the repo (`plugins/nexus/skills/edit-shipped-plugin-skill`) and not yet in the installed cache (cache glob empty). Consumed the recipe by Read from repo source (materially compliant per developer Skill-Authority fallback); ran its phase-2 pre-edit sweeps and phase-3 two-surface/adjacent-surface disciplines. |
| 2 | edit-shipped-plugin-skill — **Read-channel deviation** (same reason as Step 1); **tdd** (invoked via Skill tool) | tdd: genuine red-first for W5; W6 red-first proven by branch-neutralization mutation (anti-vacuity). Header-comment enumeration W1–W4→W1–W6 = the adjacent-surface staleness triple's header leg. |
| 3 | edit-shipped-plugin-skill — **Read-channel deviation** (same reason as Step 1) | Two pointer additions (improve-skills Quality Gate + warn summary; evaluate-skill rubric overlay); two-surface reconciliation of the warn summary with the check list. |
| 4 | release-plugin (invoked via Skill tool) | MINOR bump; rule-2 contamination check on dry-run reasons. |

## Deviations from Plan

- **edit-shipped-plugin-skill invoked via Read, not the Skill tool** (Steps 1–3). Reason: the skill
  is authored in this repo but absent from the version-keyed install cache, so neither the bare nor
  namespaced Skill-tool name resolves. Per the developer agent's documented fallback, reading the
  installed/at-source `SKILL.md` and following it is materially compliant; skipping it is not.
  Logged in lessons.md.
- **Self-review run in-context, not via spawned finders.** The dispatch offered "two parallel
  general-purpose finders if spawning is available." As a spawned developer subagent I did **not**
  spawn review agents (a subagent commissioning a review gate is exactly what the boundary detector
  flags — ADR-21); ran the same angles in-context, disclosed here and in `## Self-Review`.

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| MINOR-vs-PATCH veto open at close | low | architect/owner | plan.md Decisions row + Plan Review "kept MINOR … veto to PATCH open at close" | Bumped `--minor` (1.47.0) per the same-loop owner sanction; if the owner vetoes to PATCH at close, re-bump before commit. Not a defect — a documented open call. |
| W5/W6 census grep is case-sensitive on the warn text | low | reviewer | The W6 warn message reads "Use when" (capital); a `grep "use when"` census undercounts (I hit this — recount via the unique phrase "step-shapes" gave the correct 5) | Only affects a hand-run census, not the lint (which compares `.toLowerCase()`). Flagged so the reviewer doesn't re-investigate a "W6=0" false reading. |

## Self-Review

**Verdict: PASS** (in-context self-review — no finder agents spawned; same angles as the dispatch).

Prose angles (skill-recipe §4, improve-skills SKILL.md, evaluate-skill rubric):
- **Cross-ref resolution:** all 9 `§4` references across the four edited files resolve to the new
  heading `## 4. Stack-skill standards` (skill-recipe.md:124). No dangling ref.
- **Title/section consistency:** title clause "stack-skill standards" matches the §4 heading; §3
  `description:` row pointer aims at §4.2 (discoverability) which exists.
- **Warn-summary reconciliation (critic C.2):** improve-skills:110 now enumerates W5/W6 faithfully
  (missing `## Assumes` / missing `use when`, stack-scoped) — the prose summary matches the check list.
- **No dropped guarantees:** every edit is additive to existing sentences (the two pre-existing warn
  clauses at :110 preserved; the rubric closing overlays-note preserved after the new overlay).
- **Point-don't-restate:** the rubric Layer-3 overlay points at Layer 0.3/1.1 rather than restating
  the general description rules (AP3); §4 points at W5/W6 + the rubric rather than restating them.

Code angle (skill-lint.mjs):
- **Windows path parsing:** `stackPluginDir` splits on `/[\\/]/` (both separators) and uses
  `lastIndexOf('skills')` with an `i > 0` guard — verified live: create-feature (`nexus-dotnet`)
  fires W5 on win32; `omni-dotnet` keeps its suffix; the consuming cache's version dir never matches.
- **Warn format + no exit-code regression:** W5/W6 are plain-string `warnings.push(...)` identical to
  W1–W4; `failed` is set only by `errors.length`; `process.exit(failed ? 1 : 0)` unchanged — create-feature
  emits W5 at exit 0.
- **Anti-vacuity:** W5 genuine red-first; W6 red proven by branch neutralization then restored.
- **Encoding:** no BOM in any of the 5 edited shipped files (E2 clean); full glob suite 593/593 green.

*Status: COMPLETE — developer, 2026-07-23*
