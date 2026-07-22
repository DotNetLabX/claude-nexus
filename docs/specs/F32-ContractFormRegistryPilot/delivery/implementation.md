# F32-ContractFormRegistryPilot (grammar half) — Implementation

Architect-led fast lane. Docs-only diff (skill prose + CHANGELOG + version bump). Grammar half only —
the contract-form re-authoring / regeneration-vs-prose pilot is campaign-side, out of scope here.

## Files Modified

- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — Step 1, TWO edits in §The rule registry:
  (1) added the optional `precondition:` row-field bullet **verbatim from the plan**, placed after the
  `source:` bullet and before `status:`, at sibling weight (2-space continuation, matching the `status`
  bullet's format); (2) added the consumers/provenance sentence to the **section prose** (a new
  paragraph after the "Rule statements are durable prose" paragraph, before the Flutter migration note),
  never inside the bullet — naming the two consumers (Cover test-writer / regeneration) and the research
  provenance file. Satisfies backlog F32 grammar clause.
- `plugins/nexus/skills/regenerate-unit/SKILL.md` — Step 2, one appended sentence on the
  Registry-semantics bullet (the `bug-preserve` line, located by grep = line 110, not from plan memory):
  a row's optional `precondition:` field is the rule's input-assumption contract, binding on the
  generator the same way the rule statement is. Satisfies backlog F32 consumption clause.
- `plugins/nexus/.claude-plugin/plugin.json` — Step 3, MINOR bump 1.43.1 → 1.44.0 (new grammar
  capability; owner-escalated per plan, F26 charter-tier precedent). Applied by `bump-plugin.mjs --minor`.
- `plugins/nexus/CHANGELOG.md` — Step 3, replaced the generated stub for [1.44.0] with a prose entry
  stating the optional `precondition:` field, its two consumers (Cover test-writer / regeneration),
  the research provenance (`spec-representation-and-equivalence-oracles.md`), and the explicit
  "grammar half shipped / pilot owed campaign-side" status.

## Key Decisions

- Step 1 bullet copied **verbatim** from the plan (binding rule 3 — already critic-compressed to sibling
  weight in the plan's M1 fold). Not re-expanded; consumers/provenance kept out of the bullet and placed
  in the section prose below the bullet list.
- Step 1 consumers sentence placed as its own paragraph after the durable-prose paragraph (plan wording:
  "the prose BELOW the bullet list, after the 'Rule statements are durable prose' paragraph"), before the
  Flutter migration note. Guarded on "A present `precondition:`" so it stays consistent with the field's
  optional / zero-precondition-valid semantics.
- Step 3 tier = MINOR per plan (new additive grammar capability), applied via `release-plugin` skill's
  `bump-plugin.mjs --minor`. Dry-run reasons named only `mine-verify-cover` + `regenerate-unit` with no
  cross-feature contamination; `cur` (1.43.1) equalled committed HEAD, so this is a single fresh bump,
  not a double-bump.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Plan Skill Mapping: `(none)`, TDD no — surgical prose edit in the grammar owner section |
| 2 | None | Plan Skill Mapping: `(none)`, TDD no — one consumer line in regenerate-unit Stage 3 |
| 3 | release-plugin | Invoked via Skill tool; dry-run → `--minor` apply → CHANGELOG authored → validate |

## Self-Review

Disclosed prose-angle self-review (docs-only diff; code-grounded, no re-ask per plan's review-mode decision).

- **Obligation diff vs the plan.** Every plan obligation met: Step 1's two edits (verbatim bullet after
  `source:`; consumers/provenance sentence in section prose), Step 2's appended sentence on the
  `bug-preserve` line, Step 3's lint-green → MINOR bump → CHANGELOG (field + two consumers + provenance +
  pilot-owed) → no gen-commands → no commit. No extra obligations added. All plan-named no-edit surfaces
  left untouched: the pilot, any mandatory/blanket use of the field, `kb-navigation.md`, `kb-entry-schema`,
  the row-grammar framing sentence, and the other field bullets. One release-plugin procedure step
  (gen-omni twin sync) deferred — see Deviations.
- **Dangling refs.** The new prose and the CHANGELOG both cite
  `docs/kb/research/spec-representation-and-equivalence-oracles.md` — verified present (Glob hit). No
  other new external references introduced. No dangling refs.
- **Stale adjacent sentences.** mine-verify-cover: the grammar-list intro at line 307 ("this sentence is
  the grammar every other shipped file references") still holds — the field is additive, the referenced
  grammar list still stands. The `status` bullet immediately after the new bullet reads cleanly (the new
  bullet is self-contained, terminal punctuation intact, no run-on). The durable-prose paragraph is
  unchanged; the new prose paragraph follows it and precedes the Flutter migration note, which still reads
  correctly. regenerate-unit: the appended sentence continues the Registry-semantics bullet; the following
  "MANDATORY outputs" bullet is unaffected.
- **Internal consistency between the two files' consumer statements.** mine-verify-cover prose says a
  present `precondition:` is consumed by regeneration where "the generator treats it as the rule's binding
  input contract"; regenerate-unit says the field "is the rule's input-assumption contract, binding on the
  generator the same way the rule statement is." Consistent framing and weight; no contradiction. The
  field's own bullet semantics (optional; mined never invented; zero-`precondition:` registries valid)
  are consistent with both consumption statements being guarded on a *present* field.
- **Findings folded/dismissed:** none material. The 22 estate-wide `precondition` grep hits are
  ordinary-English prose ("precondition for X"), not row-field tokens — confirmed the two target files'
  pre-existing hits ("Two preconditions before authoring", "A failed hard precondition") are prose, so no
  field-token collision. Consistent with the plan's "0 collisions" grep.

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Concurrent untracked feature in the tree | low | team-lead (lane close) | `git status` shows untracked `docs/specs/F27-ConventionsPipeline/` (not created by this lane) | Scope the closure commit to the 4 F32 plugin files + `docs/specs/F32-ContractFormRegistryPilot/`; do not sweep in F27's docs. Bump classification was unaffected (it is `docs/`, not `plugins/**`; dry-run named only the two F32 skills). |

## Deviations from Plan

- **release-plugin Step 5 (gen-omni twin sync) deferred to lane close.** The skill's procedure runs
  `gen-omni.mjs` after the bump, but the omni sync writes into the sibling `../omni` repo and is coupled to
  a commit there. HARD RULE 1 ("NO git writes. Commit at lane close, main session.") and the plan's Step 3
  ("No commit — lane close owns it") reserve all committing for lane close. The bumped `plugin.json` +
  CHANGELOG mirror into the twin by content, so the twin regen + its commit belong to the same lane-close
  step that commits the nexus change. Not run here by design.

*Status: COMPLETE — developer, 2026-07-22*
