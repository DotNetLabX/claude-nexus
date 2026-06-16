# Skill-Authoring Recipe — extract §0/§1/§4 into a shipped nexus reference

**Feature Spec:** None — ad-hoc technical pass. Binding definition: `docs/proposals/skill-authoring-recipe.md`
(P5, **High** confidence). Source material: `D:\omnishelf\omnishelf-docs\.claude\skills\SKILL_AND_AGENT_RECIPES.md`
§0/§1/§4. Governed by ADR-1 (self-contained plugin), ADR-4 (formats/recipes are skills), ADR-23
(born-compliant skills), ADR-9 (release flow). Master gate (ADR-25): a two-way-door doc addition — the
proposal is the definition, no separate tech-spec.

## Context

Nexus tells an author how to **evaluate** a skill (`evaluate-skill` + its rubric) and how to **fix/scaffold**
one (`improve-skills` + `proven-patterns.md` + the `skill-lint.mjs` gate), but it has **no crisp
authoring-from-scratch recipe**: the archetype decision (pick heavy vs light first), the reusable-element
menu, and the frontmatter cheat-sheet. That gap is why the `adhoc-ResearchKB` plan had to reach into the raw
omnishelf path (`…\SKILL_AND_AGENT_RECIPES.md`) and note the recipe "is not yet a shipped nexus reference."
This pass closes that gap by extracting **only** §0/§1/§4 — the three parts the proposal confirmed are a real
gap — into a sibling reference under `improve-skills`, and wiring it so it's actually consulted.

The rest of the omnishelf doc is **not** ported: §2 (agent recipe — Nexus *is* that pipeline), §3 (effort
policy — out of scope here), §5/§6 (omnishelf-project-specific), §7 (already shipped as
`proven-patterns.md`). Porting wholesale would manufacture the **AP3 "restated rules, no single owner"**
failure the catalog itself warns about — so the central design constraint of this pass is *reference, never
restate*.

## Scope

**In:** one new reference file `plugins/nexus/skills/improve-skills/references/skill-recipe.md` (faithful
extraction of §0/§1/§4, **nexus-grounded** — omnishelf skill examples swapped for real nexus skills,
frontmatter fields verified against live Claude Code semantics); wiring into `improve-skills/SKILL.md` so the
recipe is consulted at authoring time; a skill-backlog entry; born-compliant lint; a **PATCH** release.

**Out:** §2/§3/§5/§6/§7 of the source (see Context). No new skill, no agent edits (so no `gen-commands`
regen). No restating of `proven-patterns.md` (P1–P11/AP1–AP7) or the loader-safety/lint rules — those are
referenced, not duplicated. No change to `evaluate-skill` or its rubric.

## Binding vs developer's-call

- **Binding (public surface):** the reference path
  `plugins/nexus/skills/improve-skills/references/skill-recipe.md` (sibling to `proven-patterns.md`); the
  three sections it must carry (archetype decision / element menu / frontmatter cheat-sheet); the
  reference-not-restate constraint (AP3).
- **Developer's call:** the exact prose, section ordering inside the file, and **which** nexus skills to name
  as the archetype examples (pick honest ones from the live estate — see Step 1 candidates). Internal heading
  structure of the recipe.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills | Follow | no | extract omnishelf §0/§1/§4; swap examples for real nexus skills; verify §4 frontmatter fields against live skills; reference (don't restate) `proven-patterns.md` + the lint gate | — |
| 2 | improve-skills | Follow | no | add a consult-the-recipe pointer to `improve-skills/SKILL.md` "For New Project-Local Skills" steps 2 + 4; consolidating pass (net complexity flat) | — |
| 3 | release-plugin | Follow | no | PATCH bump (additive reference, owner-confirmed); skill-backlog entry; no `gen-commands` (no agent frontmatter changed) | — |

For authoring Steps 1–2, consult `improve-skills` itself (born-compliant Write Discipline — **UTF-8 no BOM**;
the consolidating-pass rule; the AP3 single-owner check in `references/proven-patterns.md`).

## Domain / Data Model Changes

N/A — one markdown reference file + one markdown wiring edit + a version bump. No code surface.

## Implementation Steps

**1. Author `references/skill-recipe.md` — faithful extraction of §0/§1/§4, nexus-grounded.**
Create `plugins/nexus/skills/improve-skills/references/skill-recipe.md`, sibling to `proven-patterns.md`.
Extract from `D:\omnishelf\omnishelf-docs\.claude\skills\SKILL_AND_AGENT_RECIPES.md`:
- **§0 (source lines 10–23) — the archetype decision.** The heavy/autonomous vs light/conversational table
  and the "pick the right weight first / simplest-thing-that-works" rule of thumb. **Swap the omnishelf
  example skills for real nexus skills** — read 3–4 live nexus skills and name honest examples (candidates to
  verify: *light/conversational* → `create-feature-spec`, `create-implementation-plan`, the `*-format`
  skills; *heavy/autonomous* → `evaluate-skill`, `release-plugin`). Do not transcribe omnishelf's example
  list.
- **§1 (source lines 27–46) — the reusable-element menu.** Keep the menu (modes table, config-constants
  table, numbered hard rules, phase index + CHECKPOINT gates, ASCII pipeline diagram, state persistence,
  changelog+Lessons, self-check, provenance, downstream-consumers table, error/refusal tables, "what this
  does NOT do"). **Re-point omnishelf-specific references:** state-persistence example → nexus's pipeline
  resume artifacts (`communication-log.md` / `.pipeline-state`), not `_meta/{skill}-state.yaml`; the
  "loader safety (blocking)" line → the nexus `skill-lint.mjs` gate + the SKILL.md "Write Discipline
  (encoding)" / "Deterministic Gate" sections, not `SKILL_AUTHORING.md`. For the self-check / mechanical
  re-derivation item, **reference `proven-patterns.md` (P5/P6) — do not restate the patterns** (AP3).
- **§4 (source lines 84–100) — the frontmatter cheat-sheet.** The field table (`description`, `when_to_use`,
  `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `effort`, `model`,
  `context: fork`/`agent`). **Verify every field name and its stated behavior against live Claude Code
  semantics before writing it — using the correct ground truth per field (critic HIGH-1):**
  - **`user-invocable` and `disable-model-invocation` only** have in-repo frontmatter precedent — confirm
    these by grep (e.g. `improve-skills/SKILL.md` uses both). The grep is authoritative **only** for these two.
  - **`allowed-tools`, `disallowed-tools`, `context: fork`/`agent`, and `when_to_use` (+ its char cap) have
    ZERO in-repo frontmatter precedent** — a grep will not confirm them, so do **not** pass the omnishelf
    forms through unverified. Confirm each (exact field name, hyphen-vs-underscore, behavior, the
    `when_to_use` cap) via the **claude-code-guide agent** before writing it; drop or flag any the agent
    cannot confirm. (Empirically: `context: fork` appears in the repo only as *prose arguing against* its use
    in `search-researches/SKILL.md`, not as live frontmatter — exactly the silent-passthrough trap.)

  Replace the omnishelf "Building Effective Agents" prose with a pointer to the nexus **allocation
  principle** (architecture README) — the nexus-native "add complexity only when it pays."

Loader safety: `{placeholder}` only, **no angle-bracket / XML-tag-shaped tokens**; rephrase math comparisons
as "under/over/at most." Write with the Write tool (UTF-8 no BOM). Follow improve-skills.
Confidence: medium (adaptation — honest nexus example mapping + the §4 field fact-check are the judgment).
Satisfies: P5 "the one real gap" (§0/§1/§4); ADR-4; ADR-23.

**2. Wire the recipe into `improve-skills/SKILL.md` (single-owner consumer).**
A reference nobody reads is dead (AP1 — name the executor). In `plugins/nexus/skills/improve-skills/SKILL.md`,
"For New Project-Local Skills":
- **Step 2** ("Study 2–3 existing skills … Consult `references/proven-patterns.md`") — add: consult
  `references/skill-recipe.md` for the **archetype decision** (pick heavy vs light first) and the
  **reusable-element menu**.
- **Step 4** ("Write SKILL.md born compliant — frontmatter first") — add: see `references/skill-recipe.md`
  §frontmatter cheat-sheet for the field semantics.
State the pointer applies to **both** authoring paths (project-local and the dev-repo plugin-skill carve-out
at the top of the file). **The pointer MUST cite the literal relative path `references/skill-recipe.md`**
(not a paraphrase like "consult the recipe") — Step 3's lint done-condition only bites because this exact
token makes the reference resolvable (critic MEDIUM-1; `skill-lint.mjs` checks cited refs exist). Consolidating
pass — fold the pointers into the existing steps, net complexity flat, no additive sprawl. Follow
improve-skills. Confidence: high.
Satisfies: P5 Decision (single owner: `improve-skills` already owns scaffolding); AP1.

**3. Born-compliant lint + skill-backlog entry + PATCH release.**
- Run `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/improve-skills`
  → **exit 0** (it verifies the newly-cited `references/skill-recipe.md` exists, no BOM, frontmatter valid).
  If node is genuinely unavailable, walk the checklist by hand and say so in implementation.md.
- Add a `docs/skill-backlog.md` entry under `## Skills Fixed`: `improve-skills` — Type Fix — Source
  `adhoc-SkillAuthoringRecipe` — "Added `references/skill-recipe.md` (archetype/element-menu/frontmatter
  authoring recipe, extracted from omnishelf §0/§1/§4) + wired it into the New-skills steps."
- Release: **PATCH** bump + CHANGELOG via the `release-plugin` skill (`node scripts/bump-plugin.mjs`;
  owner-confirmed PATCH — additive reference, not a new capability surface). **No `gen-commands` regen** (no
  agent frontmatter changed). Per the dev-repo CLAUDE.md, commit the bump in the **same commit** as the
  change, then run `node scripts/gen-omni.mjs` so the twin rides along.
Follow release-plugin. Confidence: high.
Satisfies: P5 Note (touches `plugins/nexus/**` → needs a bump); ADR-9; ADR-23 (lint is the done-condition).

## Testing Strategy

No unit tests — this pass produces reference prose + a wiring edit, not executable logic. The structural
done-condition is the **skill-lint exit 0** (Step 3) plus, if the repo's lint suite runs here,
`node --test tests/lint/*.test.mjs` staying green (the dangling-reference / frontmatter lints — the new cited
reference must resolve). The content correctness is verified by the **code-grounded critic** review below
(checks the §4 frontmatter facts and the nexus-example swap against live source).

## KB Impact

None — no `docs/kb/` entries. (The "KB" here is the skill estate itself; the change is internal to the
`improve-skills` skill.)

## Open Questions

None blocking. The three forks are resolved: source = faithful extraction from the now-reachable omnishelf
file; bump = **PATCH** (owner-confirmed); review = **code-grounded critic**.

## Plan Review (critic, code-grounded, 2026-06-15)

Mode 2 ad-hoc plan review by the `nexus:critic` — read the live skill estate (omnishelf source,
`improve-skills/SKILL.md`, `proven-patterns.md`, `skill-lint.mjs`), not just the plan. Verdict: **REVISE** —
every P5 scope item, the out-of-scope dispositions, the AP3 reference-not-restate constraint, the
single-owner wiring, and the ADR-9 release mechanics confirmed correct against source. One HIGH + one MEDIUM
folded in; one LOW informational:

- **H1 — §4 verification mis-targeted the ground truth (Step 1).** Grep finds only `user-invocable` and
  `disable-model-invocation` in live frontmatter; `allowed-tools`/`disallowed-tools`/`context: fork`/
  `when_to_use` (+ cap) have **zero** in-repo precedent, so the prescribed grep would silently pass the
  omnishelf forms through unverified — the AP5 "fictional infrastructure" trap on the one reference authors
  trust. **Fixed:** Step 1 §4 now splits verification by field — grep authoritative only for the two
  confirmable fields; the other four verified via the `claude-code-guide` agent or dropped/flagged.
- **M1 — lint done-condition depended on an unstated Step 2↔3 coupling.** Step 3's lint only bites if Step 2
  cites the literal `references/skill-recipe.md` token; a paraphrased pointer would pass green while the
  reference is effectively unwired. **Fixed:** Step 2 now requires the literal relative path.
- **L1 — `Satisfies:` heading-refs (informational).** `P5 Decision` / `P5 Note` / `P5 "the one real gap"`
  map to real proposal headings — verifiable, slightly soft (prose headings, not numbered units). No change.

Confirmed correct, no change needed: extraction scope (§0/§1/§4 in, §2/§3/§5/§6/§7 out), AP3 routing of the
§1 self-check to reference `proven-patterns.md` P5/P6, wiring targets (SKILL.md steps 2/4 exist), and the
PATCH + no-gen-commands + gen-omni-after release mechanics (ADR-9).
