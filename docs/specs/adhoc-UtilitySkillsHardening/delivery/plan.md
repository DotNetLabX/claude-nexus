# Utility Skills Hardening — apply the dotnet-microservices utility-skill audit (6 consolidating fixes)

**Feature Spec:** None — ad-hoc technical pass. Binding definition: the consuming repo's routed feedback file
`D:\src\dotnet-microservices\docs\plugin-feedback\nexus-1.23.1-2026-07-06.md` (Entries 1–6; full findings in
that repo's `docs/skill-evals/2026-07-06-nexus-utility-skills.md`, verdict fix-then-accept). All six entries
re-grounded by the architect against live nexus source 2026-07-06 — all confirmed, Entry 1 amended (see
Context). Governed by ADR-23 (born-compliant skills), ADR-9 (release flow), ADR-1 (self-contained plugin).
Master gate (ADR-25): two-way-door edits to shipped skill files + one lint script — no tech-spec, this plan
is the definition's delivery arm.

## Context

An external audit of the utility skills (`improve-skills`, `evaluate-skill`, the authoring recipe) against
verified Anthropic authoring canon found six consolidating gaps — no Critical/High; the research otherwise
validated the estate. The fixes: widen the lint's fictional-path net (E6) to `scripts/`/`assets/`, add two
canon warnings (W3 body-size, W4 nested-reference), delete a dead-letter check from the rubric's scripted
layer, sanction `scripts/` in the authoring recipe, and name the degrees-of-freedom axis.

**Entry 1 is amended, not taken literally.** E6's narrow scope was deliberate — the script's own comment
(`skill-lint.mjs:64-67`) excludes repo-level `scripts/` paths. A naive regex widening fails two shipped
skills today: `release-plugin/SKILL.md` cites `scripts/bump-plugin.mjs` / `gen-commands.mjs` / `gen-omni.mjs`
(repo-root-relative, ~10 sites) and `nexus-flutter/skills/figma-to-flutter/SKILL.md:134` cites
`assets/icons/` (a target-app folder). Amended design in Step 1: cwd-fallback existence probe + file-shaped
citation filter.

## Scope

**In:** `plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` (E6 widen, W3, W4, header comment) +
its unit tests; `plugins/nexus/skills/evaluate-skill/references/rubric.md` (Layer 0 item 6 delete, Layer 2.2
pointing clause); `plugins/nexus/skills/improve-skills/references/skill-recipe.md` (§2 scripts element,
degrees-of-freedom bullet, intro harmonization); `plugins/nexus/skills/improve-skills/SKILL.md` (scaffold
step 3, lint-scope sentence); skill-backlog entries; **MINOR** release (owner-escalated: two new lint checks
+ widened E6 are new gate capability).

**Out:** marking the entries applied in the consuming repo's feedback file (dotnet-microservices' learner
owns its file); any change to `proven-patterns.md` (P1 already documents the pattern the recipe now points
at); the audit's "checked clean" items; `nexus-dotnet`/`nexus-flutter` bumps (no files of theirs change).

## Binding vs developer's-call

- **Binding:** the check IDs and severities (widened **E6** = ERROR; **W3**, **W4** = WARN — never ERROR,
  the audit's justify-don't-kill stance); the 500-line W3 threshold; the two DO-NOT-BREAK sites
  (`release-plugin`, `figma-to-flutter` — full-estate lint must stay exit 0); the rubric/recipe section
  targets named per step.
- **Developer's call:** exact regex construction and helper decomposition inside the script; whether the
  file-shaped filter applies uniformly to all four folders or only `scripts/`/`assets/`; exact WARN message
  wording; test case naming.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | yes | lint script + `tests/unit/skill-lint.test.mjs`; full detail in step | JS-script editing has no pattern skill — expected, not a gap |
| 2 | improve-skills | Follow | no | rubric.md: delete Layer 0 item 6; add Layer 2.2 pointing clause (no `references/`-prefixed path — see step) | — |
| 3 | improve-skills | Follow | no | skill-recipe.md §2 + SKILL.md scaffold step 3 + lint-scope sentence | — |
| 4 | release-plugin | Follow | no | full-estate lint sweep; skill-backlog; MINOR (owner-confirmed); gen-omni after | — |

For Steps 2–3, `improve-skills` is both the skill being edited and the write standard to follow
(dev-repo carve-out; Write Discipline — UTF-8 no BOM, Write tool; consolidating pass, net complexity flat).

## Domain / Data Model Changes

N/A — one lint script + tests + three markdown skill files + a version bump.

## Implementation Steps

**1. Extend `skill-lint.mjs`: widen E6, add W3 + W4 — TDD against `tests/unit/skill-lint.test.mjs`.**
Invoke the `tdd` skill; the existing suite is sandbox-based (`makeSkill(name, skillMd, extra)` builds a
throwaway skill folder) — write each red first, then implement. File:
`plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs`.

- **E6 widened.** Citation regex alternation grows to `(?:references|workflows|scripts|assets)/`. A citation
  is dangling (ERROR) only when it exists at **neither** `join(dir, ref)` (skill-relative) **nor** the
  repo-root resolve — where repo root is the **nearest ancestor of the skill folder containing `.git`**
  (critic M2: never raw `process.cwd()`, which would make the exit code caller-cwd-dependent). This makes
  `release-plugin`'s `scripts/bump-plugin.mjs` pass deterministically wherever the lint is invoked from.
  Only **file-shaped** citations (last path segment contains a `.`) are checked for the two new folders —
  directory-shaped prose like `assets/icons/` (figma-to-flutter) is anatomy description, not a file
  citation, and must not flag. **Record the deliberate narrowing in implementation.md:** a directory-shaped
  *fictional* citation (`assets/fake-dir/`) escapes the net by design — the trade-off that lets the legit
  dir citation pass.
- **W3 body-size.** WARN (never ERROR) when the SKILL.md body **after the frontmatter block** exceeds
  **500 lines**: suggest a progressive-disclosure split (`references/`) or a recorded justification.
  Current largest shipped body is **410 lines** (`mine-verify-cover` — 90 lines of headroom, thin) — zero
  trips expected today.
- **W4 nested references.** For each cited `references/*.md` that exists on disk, scan its content for
  further **`references/`-prefixed paths ONLY** — explicitly NOT the widened four-folder regex (critic H1:
  the widened reading trips `skill-recipe.md:31`'s `workflows/Template.md`, `create-feature`'s workflow
  chain, and Step 3's own `scripts/` exemplar additions — self-defeating). WARN naming the **chain**
  (source ref → nested ref) so an author can locate it ("canon: references one level deep from SKILL.md").
  Zero trips in the shipped estate under this scope — verified by the code-grounded critic.
- **Header comment** (the `E1…W2` check list at the top) updated to describe the widened E6 and the two new
  warnings; the lines 64-67 rationale comment rewritten to state the new semantics (`.git`-anchored
  repo-root fallback + file-shaped filter + W4's references-only scope) instead of the old exclusion
  rationale.
- **Test cases (minimum):** dangling `scripts/x.mjs` cite (sandbox has no `.git` ancestor) → ERROR;
  repo-level cite resolving via a `.git`-anchored sandbox root → pass; `assets/icons/`-style dir citation →
  no error; 501-line body → WARN + exit 0; 500-line body → no WARN; cited reference citing another
  `references/*.md` → W4 WARN + exit 0; cited reference citing `workflows/x.md` or `scripts/x.mjs` → **no**
  W4 (references-only scope); placeholder-prefixed `{folder}/scripts/x.mjs` still skipped (lookbehind).
- **Acceptance (mechanism):** `node --test tests/unit/skill-lint.test.mjs` green with the new cases;
  `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` over **every**
  `plugins/{nexus,nexus-dotnet,nexus-flutter}/skills/*` folder from the repo root → exit 0.

Confidence: high. Satisfies: feedback Entries 1, 2, 6.

**2. `evaluate-skill/references/rubric.md` — delete the dead-letter, add the degrees-of-freedom clause.**
Follow improve-skills (consolidating pass on a shipped skill file).
- Delete Layer 0 **item 6** (`rubric.md:18` — "If the project keeps a skills index…"): the layer is titled
  "scripted" and the script has no index check (AP1 inside the quality doc); Layer 4.3 (`rubric.md:88`)
  already owns index sync as judgment. Items 1–5 remain; no renumbering needed beyond the deletion.
- Sync Layer 0 **item 4** (`rubric.md:16`) to the widened E6: its folder list currently reads
  "(`references/`, `workflows/`)" and goes stale when Step 1 lands — extend to name `scripts/` and
  `assets/` (file-shaped citations). Do not add the W3/W4 warnings to Layer 0 — the layer is "all
  blocking" and warnings aren't.
- While editing item territory: item 3's "not the skill name repeated" clause is judgment the script only
  approximates via W1 — soften to make the scripted/judgment boundary honest (one wording touch, e.g.
  "thinness is scripted (W1); 'real prose, not the name repeated' is confirmed at Layer 1.1"). Developer's
  call on exact wording; do not add new checks.
- Layer **2.2** gains one clause: "is each fragile step pinned to low freedom? — see the degrees-of-freedom
  axis in improve-skills' skill-recipe §2." **Constraint: do NOT write a `references/`-prefixed path here**
  — rubric.md is itself a cited reference, and a `references/…` token inside it would trip the new W4
  nested-reference warning from Step 1. Name it in prose ("improve-skills' `skill-recipe.md` §2").
- **Acceptance (mechanism):** grep `rubric.md` for `skills index` → 0 hits in Layer 0 (the Layer 4.3 row
  remains); grep for `degrees-of-freedom|low freedom` → 1 hit in Layer 2.2; grep Layer 2.2's added clause
  for `references/` → 0 hits; grep Layer 0 item 4 for `scripts/` → present (E6-scope sync).

Confidence: high. Satisfies: feedback Entries 3, 5 (rubric half).

**3. Sanction `scripts/` + name the degrees-of-freedom axis in the authoring path.**
Follow improve-skills. Two files:
- `plugins/nexus/skills/improve-skills/references/skill-recipe.md` **§2 element menu**:
  - New element bullet: **"Bundled executable `scripts/`"** — the home of P1 deterministic post-condition
    checks; runnable without being read into context; reference `proven-patterns.md` P1, don't restate it
    (AP3). Name the live exemplars (`improve-skills`' skill-lint, `research`'s cite-check, `fleet`'s
    render-fleet).
  - New bullet: **degrees-of-freedom axis** — per-step specificity matched to fragility: high freedom
    (heuristic prose), medium (parameterized template/pseudocode), low ("run exactly this; do not modify").
    One bullet, no sub-essay.
  - **Harmonize the §2 intro sentence** ("heavy nexus skills instead keep a single `references/` folder") —
    already dated: three shipped skills also ship `scripts/`. Reword to sanction both folders.
- `plugins/nexus/skills/improve-skills/SKILL.md`:
  - **Scaffold step 3** (`SKILL.md:48`): widen "(add `workflows/` or `references/` only if variant-aware or
    template-bearing)" to also offer `scripts/` — "or `scripts/` when a post-condition is deterministically
    checkable (P1)".
  - **Lint-scope sentence** (`SKILL.md:70`): sync "cited `references/`/`workflows/` files exist" to the
    widened E6 (+ mention the body-size and nested-reference warnings in one clause).
- **Acceptance (mechanism):** grep `skill-recipe.md` for `scripts/` → hits in §2 menu; grep for
  `degrees of freedom|low freedom` → 1 bullet; grep `SKILL.md:48` region for `scripts/` → present; grep
  `SKILL.md` for `references/\`/\`workflows/` old wording → replaced.

Confidence: high. Satisfies: feedback Entries 4, 5 (recipe half).

**4. Full-estate lint sweep, skill-backlog, MINOR release + omni twin.**
Follow release-plugin. Run **once, after Steps 1–3 all land** (never per-step — CLAUDE.md bump rule).
- **Sweep:** lint every `plugins/*/skills/*` folder from the repo root → exit 0 (warnings allowed, errors
  not). This is the regression gate for the two DO-NOT-BREAK sites. Also `node --test tests/` green.
- **Skill-backlog:** one `## Skills Fixed` entry each for `improve-skills` and `evaluate-skill`, source
  `adhoc-UtilitySkillsHardening`, summarizing the audit-driven fixes.
- **Release:** `node scripts/bump-plugin.mjs --dry-run` then `--minor` (owner-confirmed MINOR — new gate
  capability). No `gen-commands` regen (no agent files change). Then `node scripts/gen-omni.mjs` +
  `--check` exit 0; the omni twin commit follows the mirrored-subject convention (dev-repo CLAUDE.md).
- **Acceptance (mechanism):** `bump-plugin.mjs --check` exit 0 on the staged tree; CHANGELOG top entry names
  the six audit entries; `gen-omni.mjs --check` exit 0.

Confidence: high. Satisfies: feedback header (routing/consolidation contract); ADR-9.

## Cross-Service Changes

None. (Cross-**repo**: the consuming project's feedback file is marked applied by *its* learner on the next
sweep — out of scope here, noted in Scope-Out.)

## Migration Notes

N/A.

## Testing Strategy

Step 1 is the only executable change and is TDD-gated (`tests/unit/skill-lint.test.mjs`, sandbox harness).
The estate-wide regression gate is the Step 4 lint sweep (exit 0 across all three plugins' skill folders)
plus the full `node --test tests/` suite. Steps 2–3 are prose edits verified by grep-shaped acceptance and
the code-grounded critic review.

## KB Impact

None — no `docs/kb/` entries. The skill estate itself is the artifact under change.

## Open Questions

None blocking. Review mode = **code-grounded critic** (user-confirmed; shared-artifact pass — the mandate
applies). Semver = **MINOR** (user-confirmed, owner-escalated).

## Plan Review (critic, code-grounded, 2026-07-06)

Mode 2 ad-hoc plan review by the `nexus:critic` against the routed feedback file + live source (lint
script, rubric, recipe, SKILL.md, tests, estate-wide citation greps). Verdict: **REVISE** — all six
feedback entries dispositioned COVERED, every cited line number exact, the Entry-1 amendment confirmed
necessary and sound (naive widening would break `release-plugin` + `figma-to-flutter`; the amended design
leaves the whole estate exit 0). One HIGH + two MEDIUM folded in; one LOW noted:

- **H1 — W4 scope was ambiguous (folded).** "Scan with the citation regex" read as the widened four-folder
  pattern would trip `skill-recipe.md:31` (`workflows/Template.md`), `create-feature`'s workflow chain, and
  Step 3's own `scripts/` recipe additions — self-defeating. **Fixed:** Step 1 now pins W4 to
  `references/`-prefixed nested paths ONLY, with an explicit no-trip test case for `workflows/`/`scripts/`
  cites inside references.
- **M1 — W3 headroom number was a measurement artifact (folded).** Plan claimed max body 325 lines; real
  max is **410** (`mine-verify-cover` — architect's `Measure-Object -Line` silently skipped blank lines).
  Conclusion (zero W3 trips) survives; the number and the thin 90-line headroom are now stated honestly.
- **M2 — raw-cwd fallback made E6 caller-cwd-dependent (folded).** **Fixed:** the repo-level fallback now
  anchors to the nearest `.git` ancestor of the skill folder — deterministic from any invocation directory;
  test cases adjusted (sandbox without `.git` → dangling errors; `.git`-anchored sandbox → passes).
- **L1 — informational, no plan change.** `research`/`research-entry-schema`'s `scripts/` citations pass via
  lookbehind-skip (`/`-preceded), not existence — only `improve-skills:70` and `fleet:45` actually reach the
  existence check. Step 1's test cases already target both mechanisms.

Checked clean (no change needed): all line-number claims; rubric.md and skill-recipe.md are W4-safe under
the references-only scope (their sibling citations are bare filenames); Step 2's no-`references/`-path
constraint on the new rubric clause; the item-3 wording touch is the same dead-letter class as Entry 3;
Scope-Out of `proven-patterns.md` (P1 already owns the pattern); Step 4's single-bump ordering + gen-omni
gates (ADR-9).
