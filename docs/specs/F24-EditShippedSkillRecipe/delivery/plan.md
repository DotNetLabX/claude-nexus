# F24-EditShippedSkillRecipe — `edit-shipped-plugin-skill` (ADR-collapsed: plan is the definition)

**Feature Spec:** None — ADR-collapsed per F17/F20/F30/F32 precedent. Definition = the backlog F24
row (learner consolidation 2026-07-21, skill-gap threshold met) + the binding `## Skill Gaps`
records + this plan. No new ADR (Decisions).

## Context

Every plugin-feedback apply wave (F9, F16, F17, F20; queued F19/F21/F22) re-derives the same
"edit shipped plugin text coherently" discipline in its plan. Six binding/corroborating records
define the content:

- `F17-MineFieldFixes/delivery/lessons.md:38–48` — the founding entry: smallest-coherent-edit,
  enumeration/consumer sweep, adjacent-surface staleness (header comment / JSDoc / prose triple),
  lint gate, release-note obligations; "improve-skills routes shipped fixes *to* this repo but no
  skill covers executing them *in* this repo."
- `F20-ProcessSkillQuickWins/delivery/lessons.md:44–54` — + renumbered-list in-prose-summary sweep;
  the two-surface reconciliation when an added exception contradicts an existing rule.
- `F29-OracleStrengthMiner/delivery/lessons.md:66–74` — + DO-NOT-TOUCH carve-outs; member-count
  sweeps across ~9 files. Evidence tag: [F17, F20, F16, F29].
- `F12-AnalyticsWorkspaceSelfHeal/delivery/lessons.md:38–46` — the enumeration ripple (hardcoded
  "four sibling skills" / "All six items" / frontmatter descriptions going stale); E9 colon-space
  as authoring mechanics; "F24 should land before F19/F21/F22."
- `F5-SkillGapCapture/delivery/lessons.md:117–125` — the `edit-shipped-agent-file` sibling:
  obligation placement in an agent's section structure, trigger-sentence phrasing that binds,
  reference-a-template-not-restate.
- `F30-ReferenceModelSkillsSeam/delivery/lessons.md` (fresh, not yet learner-consolidated) —
  estate-invariant protection (never reproduce a counted literal in adjacent prose), paste-not-
  retype grep output, markup breaks contiguous greps (`**Not**`), echo-sweep scope floor = full
  estate + every file the pass edits.

Backlog scope addendum: the recipe also owns the skill-lint authoring traps — **E9** colon-space in
an unquoted frontmatter value, **E7** XML-tag-shaped tokens in prose (code blocks exempt), **E6**
cited reference files must resolve (`skill-lint.mjs:13–17`).

**Plan-time greps (2026-07-22, executed):** `edit-shipped` in `plugins/` → 0 files (no name
collision; all mentions live in `docs/specs/*/lessons.md` + the backlog). Program doc §7 names
F30/F31 only — F24 is not program-tracked, no program-doc edit owed. improve-skills' dev-repo
carve-out is `SKILL.md:22` (one blockquote paragraph) — the Step 2 wiring target.

## Scope

**In:** the new shipped skill `plugins/nexus/skills/edit-shipped-plugin-skill/` (dev-repo-scoped
recipe); one pointer sentence in improve-skills' dev-repo carve-out; MINOR release + backlog row.
**Out:** retro-applying the recipe to past features; any per-skill content fixes (F19/F21/F22 own
those); an ADR-register recipe (the distinct `add-adr-entry` gap, F30 lessons — stays registered,
not built here); mine-family member authoring (F25's sibling recipe).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills | Follow | no | new-skill content skeleton (inline below) | — |
| 2 | improve-skills | Follow | no | one pointer sentence in the carve-out | — |
| 3 | release-plugin | Follow | no | MINOR; backlog row | — |

**Branch pins:** Step 1 is the **NEW-shipped-skill branch** — the full New-Skill recipe *including*
the Judgment Gate (lint exit 0 AND an `evaluate-skill` pass with CRITICAL/HIGH findings resolved or
waived-with-reason — the heavier half; do not skip it). Step 2 is the fix-to-existing branch — lint
alone.

## Implementation Steps

### Step 1 — Author `plugins/nexus/skills/edit-shipped-plugin-skill/SKILL.md`

Follow improve-skills (NEW-shipped-skill branch pinned above; consult `references/skill-recipe.md`
for the frontmatter cheat-sheet). Feature-specific inputs the recipe can't know:

- **Archetype: light** — SKILL.md only, no `references/`/`workflows/` (a checklist recipe; nothing
  variant-aware or template-bearing).
- **Frontmatter:** `name: edit-shipped-plugin-skill`; `user-invocable: true`; `description:` names
  the dev-repo trigger situations — editing shipped plugin skill / agent / rule / hook-prose text in
  the plugin source repo; enumeration sweeps; adjacent-surface staleness; two-surface
  reconciliation; the lint traps. (Description is quoted — E9 discipline — and stays one line.)
- **Scope statement (binding):** dev-repo only; covers all shipped prose surfaces —
  `plugins/*/skills/**`, `plugins/*/agents/*.md`, `plugins/*/rules/*.md`, and hook/script header
  comments (the JSDoc/header half of the staleness triple). Consuming projects never run this pass
  (the cache is read-only there — route via plugin-feedback instead; one pointer to improve-skills'
  Two Channels, no restatement).
- **Recipe phases (binding content, developer words the prose):**
  1. **Scope the edit** — smallest coherent edit; consolidating-pass posture (point at
     improve-skills' fix-channel language, don't restate — one owner).
  2. **Pre-edit sweeps (executed, pasted, never retyped):** enumeration/consumer sweep — the count
     word, any enumerated member list near it, and any in-prose sentence *summarizing* the list
     (three echo shapes); scope floor = full estate + every file this pass will edit; DO-NOT-TOUCH
     carve-outs for same-text different-pair hits, each with file:line; markup-tolerance note — bold
     markers break contiguous-substring greps (illustrate with a **synthetic** phrase, e.g.
     `**Not** a member` vs `not a member` — NEVER with a live estate-counted literal; choosing a
     non-invariant example is itself the estate-invariant discipline in action, critic HIGH-1).
  3. **Edit discipline:** two-surface reconciliation — an added exception that contradicts an
     existing rule edits *both* surfaces in the same pass; renumber/insert a list → grep the file
     for its in-prose summaries; directional references ("above"/"below") verified against final
     layout; canonical terms pointed at their defining artifact, never paraphrased;
     estate-invariant protection — when a plan/gate counts a literal phrase estate-wide, adjacent
     prose (CHANGELOG, docs) must paraphrase, never reproduce the literal.
  4. **Agent-file rider (the F5 sibling, folded):** place a new obligation inside the agent's
     existing section structure; phrase the trigger sentence in the binding shape the file already
     uses; reference a skill's template instead of restating it; after any `agents/*.md` edit run
     `node scripts/gen-commands.mjs {plugin}`.
  5. **Gates:** `skill-lint.mjs` on every touched skill folder (exit 0), naming the three authoring
     traps to pre-empt — E9 colon-space in unquoted frontmatter values, E7 angle-bracket tokens in
     prose, E6 cited-path resolution (sibling cites resolve or go by-name); repo lint suite in the
     glob form.
  6. **Release obligations:** one release-plugin run per feature, after all edits land (never
     per-step — point at the release-plugin skill for the policy, don't restate it).
- The skill must itself pass every discipline it teaches (born-compliant, ADR-23).
- **Self-trip pre-emption (critic MEDIUM-1):** any `<...>` illustration lives inside a code span or
  fence (E7 scans bare prose only); any sibling-skill file citation uses the resolvable sibling form
  (`../improve-skills/scripts/skill-lint.mjs`), never a bare `references/`/`scripts/` path that
  dangles for a light skill (`scripts/gen-commands.mjs` is safe — it resolves at repo root).

**Acceptance:** folder exists; `skill-lint.mjs` exit 0; `evaluate-skill` invoked (logged) with
CRITICAL/HIGH resolved or waived-with-reason in implementation.md; in the new SKILL.md each of these
greps ≥ 1 — `two-surface`, `DO-NOT-TOUCH` (or `DO NOT TOUCH`), `gen-commands.mjs`, `E9`, `E7`,
`E6`, `glob form`; description contains `dev repo` (or `plugin source repo`). **Estate-invariant
guard (critic HIGH-1):** `not a consumer` (-i) in `plugins/` still hits exactly **5 files** after
this step — the new SKILL.md adds no hit.
Satisfies: backlog F24 row (all named disciplines + the lint-trap scope addendum).

### Step 2 — Wire the pointer in improve-skills

Follow improve-skills (fix branch — lint alone). In `plugins/nexus/skills/improve-skills/SKILL.md`,
the dev-repo carve-out blockquote (:22): append one sentence — the edit pass itself follows
`edit-shipped-plugin-skill` (the coherent-edit recipe); the carve-out's existing guarantees (direct
authoring, lint as done-condition, New-Skill Judgment Gate) stay verbatim — no dropped or narrowed
clause.
**Acceptance:** `edit-shipped-plugin-skill` in improve-skills/SKILL.md = 1 (0 today); the carve-out
still contains "authored and fixed **directly**" and "the skill's own lint is the done-condition"
(no guarantee dropped); skill-lint exit 0.
Satisfies: F17 entry's "no skill covers executing them *in* this repo" — the in-repo pass is now
named at the seam where the two channels split.

### Step 3 — Release + backlog

Follow release-plugin. **MINOR** (new skill = new capability; F27 D5 / F30 precedent). CHANGELOG:
the new recipe skill (its six source records in one line), the carve-out pointer. Dry-run reasons
must name only `edit-shipped-plugin-skill` + `improve-skills` files — F27's in-flight tree
(`docs/specs/F27-ConventionsPipeline/`, still untracked) must not appear; stop on contamination.
`docs/backlog.md` F24 row → Done (shipped date, version — no sha, F17-row precedent). Lint suite
glob form green before bump. No gen-commands (no agent files edited), no gen-omni/commit (lane
close owns both).

## Testing Strategy

skill-lint on both folders; the evaluate-skill judgment pass (Step 1's gate); the pinned acceptance
greps; repo lint suite. The recipe's live validation is its first consumer wave (F19/F21/F22) — out
of scope by design.

## KB Impact

None (dev-repo; no `docs/kb/` entries).

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| Scope covers agent files + rules + hook-prose, not skills only | The backlog title says "skill/agent text"; F5's sibling gap folds in cleanly (identical trap classes + one rider) | Skills-only recipe, separate agent-file skill later | decided |
| Ships in `plugins/nexus/skills/` (dev-repo-scoped) | release-plugin precedent — dev-repo tools ride the shipped bundle so the omni twin and every checkout carry them | Project-local `.claude/skills/` (invisible to the twin; drifts) | decided |
| ADR-collapsed, **no** new ADR | A recipe skill is not an architecture decision — ADR-9 (release flow) and ADR-23 (born-compliant meta-loop) already govern; F32 precedent | An ADR-70 entry | decided |
| Light archetype (SKILL.md only) | Checklist recipe; nothing variant-aware or template-bearing | `references/` split | decided |
| F30's un-consolidated lessons folded as content sources | They are exactly F24-shaped (estate-invariant, paste-not-retype, markup-grep) and cost nothing to include now; the learner's tag strengthens later | Wait for learner consolidation | decided |

## Open Questions

None.

## Plan Review

**Code-grounded critic (opus, 2026-07-22): GO-with-fixes — all findings folded.**
- HIGH-1 (markup example reproduced F30's live `not a consumer` 5-file estate invariant): folded —
  synthetic example mandated + a stays-at-5 acceptance guard on Step 1.
- MEDIUM-1 (E7/E6 self-trip risk in the teaching content): folded — encoding note added to Step 1
  (angle examples in code spans; sibling cites in resolvable `../` form).
- LOW (carve-out cite off by one): folded — `:22` both places.
- Open Question (MINOR semver authority): kept MINOR — owner-sanctioned via the approved
  same-loop directive + unbroken F10/F15/F16/F27/F30 new-skill precedent; surfaced again in the
  close report for veto.
- Verified clean: all six lessons citations faithful; no skill-estate enumeration to update
  (glob-auto-discovery confirmed in wiring.test.mjs); carve-out guarantee phrases present verbatim;
  scope expansion properly disclosed in Decisions.
