# Utility Skills Hardening — Implementation

Applies the six consolidating fixes from the routed feedback file
`D:\src\dotnet-microservices\docs\plugin-feedback\nexus-1.23.1-2026-07-06.md` (Entries 1–6).

## Files Created

- (none — Step 4 will add the omni twin under `../omni`, out of this repo.)

## Files Modified

- `plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` — **Step 1.** Widened E6, added W3 + W4,
  rewrote the header + E6 rationale comments. Details:
  - E6 citation regex alternation widened `(?:references|workflows)` → `(?:references|workflows|scripts|assets)`.
  - Added `findRepoRoot(startDir)` — walks ancestors of the skill folder to the nearest `.git`; a
    citation now resolves if it exists **skill-relative OR at that repo root** (critic M2: never
    `process.cwd()`, so exit code is cwd-independent). This is what lets `release-plugin`'s repo-root
    `scripts/bump-plugin.mjs` pass from any invocation directory.
  - Added `isFileShaped(ref)` — for the two new folders (`scripts/`, `assets/`) only file-shaped
    citations (last segment contains a dot) are existence-checked; directory-shaped anatomy like
    `assets/icons/` (figma-to-flutter) is skipped. `references/`/`workflows/` keep their prior
    shape-agnostic check.
  - W3 (WARN, never ERROR): SKILL.md body **after the frontmatter block** over 500 lines → suggests a
    progressive-disclosure `references/` split.
  - W4 (WARN, never ERROR): a cited `references/*.md` that itself cites another `references/` path →
    warns naming the chain. Scope is **`references/`-only** (critic H1: the widened four-folder regex
    would self-trip on `workflows/`/`scripts/` chains).
  - Header comment E6 line rewritten + W3/W4 added; the stale lines-64-67 exclusion rationale replaced
    with the new semantics (`.git`-anchored fallback + file-shaped filter + W4 references-only scope).
- `tests/unit/skill-lint.test.mjs` — **Step 1.** Added 9 TDD cases (see Skills Used). New helpers
  `bodyOf`/`withBody` for W3 body sizing. Baseline 16 tests retained; suite now 25 tests, all green.
- `plugins/nexus/skills/evaluate-skill/references/rubric.md` — **Step 2** (consolidating pass). Layer 0:
  deleted item 6 (the "skills index" dead-letter — the scripted layer's script has no index check;
  Layer 4.3 already owns index sync as judgment); synced item 4's folder list to the widened E6
  (`references/`/`workflows/` + file-shaped `scripts/`/`assets/`, skill-relative-or-repo-root); softened
  item 3 to make the scripted/judgment boundary honest (thinness scripted via W1; "real prose, not the
  name repeated" is Layer 1.1 judgment). Layer 2.2: added the degrees-of-freedom clause pointing at
  `skill-recipe.md` §2 in **prose** (no `references/`-prefixed path — would trip the new W4). Net: one
  item deleted, one softened, two synced — complexity flat/down.
- `plugins/nexus/skills/improve-skills/references/skill-recipe.md` — **Step 3** (consolidating pass). §2:
  harmonized the intro sentence to sanction a `scripts/` folder alongside `references/` (three shipped
  skills already ship `scripts/`); added a **Bundled executable `scripts/`** element bullet (P1
  post-condition home; names live exemplars skill-lint/cite-check/render-fleet; points at
  `proven-patterns.md` P1 without restating it, AP3); added a **Degrees of freedom, matched to fragility**
  bullet (high/medium/low specificity). All exemplar references are bare filenames — W4-safe.
- `plugins/nexus/skills/improve-skills/SKILL.md` — **Step 3.** Scaffold step 3 now offers `scripts/`
  "when a post-condition is deterministically checkable (P1)"; the lint-scope sentence (the Deterministic
  Gate section) synced to the widened E6 (`references/`/`workflows/` + file-shaped `scripts/`/`assets/`,
  skill-relative-or-repo-root) and now mentions the W3 body-size and W4 nested-reference warnings. All
  folder tokens are backtick-trailing (`scripts/` etc.), so E6 does not match them — SKILL.md stays
  lint-clean (dogfood + estate sweep exit 0).
- `plugins/nexus/.claude-plugin/plugin.json` — **Step 4.** Version 1.23.1 → **1.24.0** via
  `node scripts/bump-plugin.mjs --minor` (owner-confirmed MINOR — two new gate capabilities + widened E6).
- `plugins/nexus/CHANGELOG.md` — **Step 4.** Replaced the generated stub with a descriptive `[1.24.0]`
  entry naming the six audit entries and the four changed plugin files.
- `docs/skill-backlog.md` — **Step 4.** Added one `## Skills Fixed` entry each for `improve-skills` and
  `evaluate-skill` (source `adhoc-UtilitySkillsHardening`).

## Key Decisions

- **File-shaped filter scoped to `scripts/`/`assets/` only** (a developer's-call per plan §Binding). Kept
  `references/`/`workflows/` existence checks shape-agnostic (unchanged prior semantics) to avoid any
  regression to the existing suite's directory-tolerant behavior; the plan frames file-shaping as being
  "for the two new folders."
- **Repo-root fallback applied to all four folders** (the plan states the neither-skill-relative-nor-repo-root
  rule generally). It can only make more citations pass, never fewer, so it cannot regress the dangling-error
  cases (a sandbox's `.git` ancestor, if any, will not contain the fabricated citation).
- **W4 depth detection is structural, not existence-based** — it flags a nested `references/` token in the
  cited reference's text whether or not that nested target exists; a dangling nested path is E6's job.
- **Deliberate narrowing (plan-required record):** a directory-shaped *fictional* `scripts/`/`assets/`
  citation (e.g. `assets/fake-dir/`) escapes the net by design — that is the trade-off that lets the legit
  directory citation (`assets/icons/`) pass. Fictional *file-shaped* cites in those folders are still caught.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | tdd | Plan Skill Mapping: `(none)` pattern skill (JS-script editing has no pattern skill — expected, not a gap), `TDD: yes`. Drove E6/W3/W4 as three red-green slices: dangling-`scripts` red → widen regex; repo-root red (dogfood + isolated) → `.git` fallback; dir-shaped `assets/` red → file-shaped filter; 501-line red → W3; nested-reference red → W4. Guard tests added green (lookbehind pins incl. the carry-forward tailwind class; boundary + references-only scope). |
| 2 | improve-skills | Plan `TDD: no` (prose edits on a shipped reference file, verified by grep acceptance). Applied under the dev-repo carve-out as a consolidating pass; W4-safe (no `references/`-prefixed path in the new clause). |
| 3 | improve-skills | Plan `TDD: no` (prose edits to a shipped SKILL.md + its reference). Re-invoked per the per-step skill-first protocol. Consolidating pass; exemplars cited as bare filenames + `proven-patterns.md` P1 (AP3 — don't restate). Re-linted improve-skills + full estate sweep exit 0. |
| 4 | release-plugin | Plan `TDD: no`. `--dry-run` → confirmed only `nexus` changed (improve-skills + evaluate-skill), classified PATCH; applied `--minor` (owner-confirmed) → 1.24.0; edited the CHANGELOG stub; `--check` exit 0. gen-omni + the commit are deferred to the team lead (see Deviations). |

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Carry-forward class pinned | low | reviewer | `tests/unit/skill-lint.test.mjs` "slash-preceded file-shaped assets/ … inside a code block" | Phase-1's non-blocking finding (tailwind-theme:16 `client/src/assets/main.css` in a code block) is now guarded by a test — the `(?<![\w/])` lookbehind, not the file-shaped filter, is load-bearing. |

## Deviations from Plan

- **Test path.** The plan cited the test file as `tests/unit/skill-lint.test.mjs`; it lives at the repo
  root `tests/unit/` (consistent with the plan's acceptance command). Not a deviation.
- **Step 4 — gen-omni + the commit deferred to the team lead (developer role boundary + mechanical
  constraint).** The plan's Step 4 lists `gen-omni.mjs` + `--check` and the omni-twin commit under the
  developer's step, but:
  1. gen-omni's twin footer pins the **impl commit sha** (`Generated from the nexus plugin (nexus {sha})`);
     that commit does not exist yet, so running gen-omni now would stamp the PRIOR feature's HEAD sha —
     wrong. Per the standing finalize-artifacts-before-commit2 rule this is a team-lead commit-protocol step.
  2. The developer never commits or advances the pipeline (hard rule).

  **OPERATOR / TEAM-LEAD ACTION REQUIRED (commit protocol, in order):**
  1. Branch off `main` if needed, then commit the working tree as ONE commit (all 6 plugin files —
     `plugin.json`, `CHANGELOG.md`, `rubric.md`, `SKILL.md`, `skill-recipe.md`, `skill-lint.mjs` — plus
     `docs/skill-backlog.md`, `tests/unit/skill-lint.test.mjs`, and the slug delivery artifacts).
  2. `node scripts/gen-omni.mjs` then `node scripts/gen-omni.mjs --check` (exit 0) — sync the omni twin;
     commit it in `../omni` with the mirrored-subject convention (dev-repo CLAUDE.md), footer pinning this
     commit's sha.
  - The **bump is already applied** (1.24.0, working tree). Do NOT re-bump — `bump-plugin --dry-run` will
    show a `current+1` that is a false dirty-vs-HEAD signal per the uncommitted-bump-rides-within rule.
  - No `gen-commands` regen needed (no `agents/*.md` changed).
- **boy-scout not invoked.** Considered on the touched files; `skill-lint.mjs` and the test file are clean
  (tight comments, no dead code, no duplication) and this is a consolidating pass landing on a release bump
  — adding adjacent churn now would force re-verification for no legibility gain. Skipped by judgment.

*Status: COMPLETE — developer, 2026-07-06*
