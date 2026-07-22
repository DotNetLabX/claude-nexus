# F18-SkillAuthoringStandards — P11+P20 as authoring standards (ADR-collapsed: plan is the definition)

**Feature Spec:** None — ADR-collapsed per F17/F20/F24/F30/F32 precedent. Definition = the backlog
F18 row + plugin-feedback `docs/plugin-feedback/nexus-1.36.0-2026-07-18.md` P11 (:94–99) + P20
(:153–157) + this plan. No new ADR (standards live in the skill estate; ADR-23 governs the gate).

## Context

- **P11 (KG F50 umbrella — "recurred on literally every mapped skill"; reflekt + fokus
  corroborated):** every stack skill declares its assumptions up front (BuildingBlocks, MediatR,
  EF, endpoint framework, reference app) + a minimal-stack branch or a named adaptation posture.
- **P20 (fokus — skill existed, 6 plans mapped `(none)`; discovery failed, not coverage):**
  frontmatter-trigger discoverability — the description names the step-shapes plans actually use.
- F18 ships the **standard**, not the per-skill fixes (F19 retrofits nexus-dotnet; the F23 C++ and
  F31 Flutter packs must be born under it, ADR-23).

**Plan-time censuses (2026-07-22, executed):**
- `^## Assumes` headings in `plugins/` = **0** (the canonical heading is net-new).
- nexus-dotnet: **37 skills, 6** mention "assum" anywhere, **0** structured → P11's gap is real.
- `Use when` in descriptions: dotnet **32/37** (missing: frontend-review, pinia-patterns,
  tailwind-theme, vue-component-architecture, vue-patterns), flutter 3/3, cpp 1/1, php 1/1.
- skill-lint warn codes W1–W4 taken (`skill-lint.mjs:19–22`) → new checks are **W5/W6**; the
  header comment enumerates checks (adjacent-surface staleness — sweep it).
- Lint has a test suite: `tests/unit/skill-lint.test.mjs` (+ `tests/lint/enforcement.test.mjs`
  references) — W5/W6 need test coverage there.
- skill-recipe.md sections: §1 archetype, §2 element menu, §3 frontmatter cheat-sheet → the
  standards land as **§4**.

## Scope

**In:** the standards text (skill-recipe §4), the deterministic warn tier (skill-lint W5/W6 +
tests), the judgment wiring (improve-skills Quality Gate bullet; evaluate-skill rubric row), MINOR
release. **Out:** any per-skill retrofit (F19); the packs (F23/F31); analytics/notes plugins
(exempt — see Decisions); escalating W5/W6 to errors (a post-F19 owner call).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | edit-shipped-plugin-skill | Follow | no | §4 standards content (inline below) | — |
| 2 | edit-shipped-plugin-skill | Follow | **yes** | W5/W6 rules + scoping regex (inline below) | — (no pattern skill for lint-rule JS; the edit recipe covers the prose surfaces; `tdd` covers the checks) |
| 3 | edit-shipped-plugin-skill | Follow | no | two pointer additions (inline below) | — |
| 4 | release-plugin | Follow | no | MINOR; backlog row | — |

**Branch note:** Steps 1–3 are edits to existing shipped files — `edit-shipped-plugin-skill` is
the recipe (its first consumer wave, by design); skill-lint exit 0 per its phase 5 where a skill
folder is touched. No new skill folder → the New-Skill Judgment Gate does not apply.

## Implementation Steps

### Step 1 — The standards, in `plugins/nexus/skills/improve-skills/references/skill-recipe.md`

Follow edit-shipped-plugin-skill. Append **§4 — Stack-skill standards (binding for stack-extension
plugins)** after §3. Binding content (developer words the prose):

- **Assumes block (P11).** Every stack-extension skill opens with a `## Assumes` section — the
  **first H2 after the title** — declaring: the stack packages/infrastructure it presumes
  (BuildingBlocks, MediatR, EF Core, endpoint framework — whichever apply), the reference app it
  cites, and **either** a minimal-stack branch in the body **or** a one-line adaptation posture
  ("without X, adapt by …"). An assumption the skill silently makes is the F50 failure shape.
- **Discoverability (P20).** The frontmatter description names the **step-shapes plans actually
  use** ("adding an endpoint to an existing service", "creating an aggregate") — not just the
  topic — phrased with the `Use when …` trigger. A skill that exists but never gets mapped is a
  discovery failure, not coverage.
- **Scope line:** binding for stack-extension plugins (plugin dir suffix `-dotnet`, `-flutter`,
  `-cpp`, `-php`); advisory elsewhere. Enforced as lint **warns** W5/W6 (deterministic tier) + the
  evaluate-skill rubric (judgment tier).
- §3 cheat-sheet: one cross-ref line pointing at §4's discoverability standard from the
  `description:` row (pointer, not restatement).

**Title reconciliation (critic C.1):** `skill-recipe.md:1`'s title enumerates the file's sections
("archetype, element menu, frontmatter cheat-sheet") — extend it to name the standards section
(the in-prose-summary staleness leg).

**Acceptance:** `## 4\.|§4` heading present in skill-recipe.md; `## Assumes` ≥ 2 mentions (the
standard + template line); `Use when` in §4 ≥ 1; the title names the standards section;
skill-lint exit 0 on improve-skills (its cited references must still resolve).
Satisfies: P11 + P20 (the standard half).

### Step 2 — The deterministic tier: `skill-lint.mjs` W5/W6 + tests

Follow edit-shipped-plugin-skill (header-comment enumeration W1–W4 → W1–W6 is the staleness
triple's header leg). TDD: yes — extend `tests/unit/skill-lint.test.mjs` with fixture-driven cases
(warn fires / doesn't fire / scope exclusion) red-first per the `tdd` skill.

- **Scoping predicate (both checks):** the **plugin directory = the path segment immediately
  above `skills/`** in the resolved target path (critic B — the script has no plugin-dir concept
  today; this is the resolution rule); it matches `/-(dotnet|flutter|cpp|php)$/` — suffix-based so
  it survives the gen-omni token swap (`omni-dotnet` keeps the suffix) and auto-covers future
  stack adapters. Analytics/notes/core: out of scope, no warn.
- **W5** — stack-plugin SKILL.md lacks a `^## Assumes` heading → warn ("stack skill should open
  with an Assumes section — see skill-recipe §4"). Expected baseline: fires on all **42** current
  stack skills (0 have the heading) — deliberate: the warn list is the **full standard-retrofit
  worklist, of which F19 is the first tranche (P1–P10)**; the remainder closes via later passes
  and the born-compliant F23/F31 packs (critic D). Warn-only, never blocks (verified:
  `skill-lint.mjs:158` keys exit on errors only).
- **W6** — stack-plugin description lacks `use when` as a **case-insensitive substring**
  (`.includes('use when')` — critic A: substring is the pinned semantics; figma-to-flutter's "Use
  whenever…" passes via containment, which is *why* flutter is 3/3) → warn. Expected baseline:
  **5** (the census list above).
- Header comment gains the two lines (W5/W6) in the existing format.
- **Test-helper extension (critic F):** `makeSkill` in `tests/unit/skill-lint.test.mjs` builds the
  skill flat under the sandbox — it cannot express the plugin-dir dimension. Extend it (or build
  the path bespoke) so fixtures nest as `<sandbox>/x-dotnet/skills/<name>`; the predicate reads the
  **plugin** dir, never the skill folder's own basename.

**Acceptance:** `node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"` green with the new
cases; running skill-lint against `plugins/nexus-dotnet/skills/create-feature` emits W5 (and no
E-error); against `plugins/nexus/skills/improve-skills` emits neither W5 nor W6 (scope exclusion);
warn count claims re-run and recorded as actuals in implementation.md.
Satisfies: backlog F18 "wired into skill-lint".

### Step 3 — The judgment tier: two pointer additions

Follow edit-shipped-plugin-skill.
- `plugins/nexus/skills/improve-skills/SKILL.md` — Quality Gate: one bullet — a stack-extension
  skill meets skill-recipe §4 (Assumes block + step-shape description); pointer, no restatement.
  Also (critic C.2, decided): the Deterministic Gate's warn summary (:110 — currently enumerates
  the oversize + nested-reference warns) gains one clause for the stack-standards warns, so the
  prose summary stays faithful to the check list it describes.
- `plugins/nexus/skills/evaluate-skill/references/rubric.md` — one row placed as a **Layer 3
  capability overlay** ("Stack-extension skill:") holding only the stack-specific half — the
  Assumes block present **and honest** (matches what the body actually presumes), the description
  names step-shapes — **pointing at, never restating,** Layer 0.3/1.1's general description rules
  (critic LOW: avoid a third drifting statement, AP3).

**Acceptance:** `skill-recipe` mention in improve-skills Quality Gate ≥ 1 (currently its Quality
Gate section has none — the §frontmatter cheat-sheet cite elsewhere stays); `Assumes` in rubric.md
≥ 1 (0 today); skill-lint exit 0 on both folders.
Satisfies: P20 ("as part of skill-lint or a one-off audit" → the recurring rubric home).

### Step 4 — Release + backlog

Follow release-plugin. **MINOR** (new standard + lint capability; same-loop sanction + precedent —
veto to PATCH remains open at close). Dry-run reasons must name only improve-skills /
evaluate-skill files; the untracked `docs/specs/F27-ConventionsPipeline/`,
`docs/specs/adhoc-VwhRound4Eval/` trees and `docs/research/2026-07-22-mine-family-vs-vwh-round4-eval.md`
must not appear — stop on contamination. Backlog F18 row → Done (date, version — no sha). Lint
suite glob form green before bump. No gen-commands, no gen-omni/commit (lane close owns them).

## Testing Strategy

The W5/W6 fixture tests (red-first) + the full glob-form suite; skill-lint self-runs on the edited
skill folders; the standards' live validation is F19's retrofit + the F23/F31 packs (out of scope
by design).

## KB Impact

None (dev-repo).

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| Scope = stack-suffix plugins (`-dotnet/-flutter/-cpp/-php`); analytics/notes exempt | P11's evidence is all stack-skill failures; analytics/notes skills carry their own heavier assumption structure; suffix predicate survives gen-omni | All extension plugins mandatory | decided |
| Warn tier (W5/W6), never error | 42 pre-F19 skills would hard-fail an error; warns are the F19 worklist; escalation is a post-F19 owner call | Error for new skills only (lint can't tell new from old) | decided |
| Canonical heading `## Assumes` | Short, greppable, deterministic for W5; F19 standardizes onto it | Free-form assumption prose (undetectable) | decided |
| ADR-collapsed, no new ADR | Standards live in the estate; ADR-23 already owns the born-compliant gate | An ADR-70 entry | decided |
| P20's deterministic half = `use when` presence only | The real standard (step-shapes) is judgment — rubric-homed; a phrasing grep is the honest machine-checkable proxy | NLP-ish description heuristics in lint | decided |
| Consuming-project cache: W5/W6 never fire there (the segment above `skills/` is the version dir) | Disclosed, not accidental (critic B): shipped-skill fixes in consuming projects route via the feedback file and never lint the cache; project-local `.claude/skills/` correctly never matches | Cache-layout-aware plugin resolution (complexity for a path that is never linted) | decided |

## Open Questions

None.

## Plan Review

**Code-grounded critic (opus, 2026-07-22): GO-with-fixes — all findings folded.**
- A (W6 semantics unpinned — baseline 5 only holds under substring): folded — substring pinned,
  figma-to-flutter containment note added.
- B (plugin-dir resolution unspecified; cache-layout non-firing undisclosed): folded — resolution
  rule pinned (segment above `skills/`) + a disclosure Decisions row.
- C (staleness sweep incomplete — skill-recipe title + improve-skills warn summary): folded — title
  reconciliation in Step 1 acceptance; warn-summary clause decided into Step 3.
- D ("warn list IS F19's worklist" overstated 42 vs 10): folded — reworded to first-tranche framing.
- F (`makeSkill` can't express the plugin-dir dimension): folded — helper extension named, with the
  predicate-reads-plugin-dir-not-basename warning.
- LOW (rubric third-statement risk): folded — Layer 3 overlay placement, point-don't-restate.
- Open Question (MINOR authority): kept MINOR — owner-sanctioned via the approved same-loop
  directive; veto to PATCH open at close.
- Verified clean: every census exact (incl. the 5 named dotnet skills); warns-never-block confirmed
  at `skill-lint.mjs:158`; gen-omni suffix survival confirmed in the swap table; Step 3 baselines
  (0/0) confirmed; no further consumer echoes of the check list.
