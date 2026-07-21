# F20-ProcessSkillQuickWins — Lessons

> **Learner disposition (2026-07-21 → nexus 1.39.2):** [APPLIED] list-insert/renumber → grep for in-prose summaries of the same list → create-implementation-plan counted-surface bullet. [ROUTED-TO-BACKLOG] `edit-shipped-plugin-skill` gap → backlog F24 (binding entry lists F16/F17/F20; the exception-vs-anti-pattern two-surface reconciliation folds into that recipe). [TRACKED] range-scoped acceptance (awk-between-headings) as the default form for location claims (1 occurrence).

## Developer Lessons

- **Insert/renumber a numbered list → grep the file for prose that *summarizes* that list.** Adding
  the grep-the-feature-name item as the new **first** item of `## Reading protocol` (renumbering the
  old four to 2–5) silently staled a nearby sentence — Steps step 2 ("Run the reading protocol. Read
  existing feature specs, architecture doc, skill inventory, and existing plans.") enumerated only the
  old four items. A list edit and its in-prose summary are two surfaces of one fact; the self-review's
  "stale adjacent sentences" angle caught it. Cheap guard: after any list insert/renumber, grep the
  same file for a sentence that re-lists the members.
- **Adding a sanctioned *exception* to a prescriptive process skill is a two-surface edit, verified
  from both directions.** The retro-fit mutation variant does the opposite of the tdd anti-pattern
  "test that passes before implementation." Landing it coherently required editing BOTH the variant
  (self-name the exception, defer to the default) AND the contradicting anti-pattern (scope it to new
  behavior, cross-reference the variant), then reading the pair from each end to confirm the skill no
  longer prescribes X in one place and prohibits X in another. Sharing one load-bearing clause verbatim
  across both surfaces ("a temporary mutation, not a pre-implementation red, proves the test has teeth")
  is what makes the bidirectional read obviously consistent. Generalizes to any "exception to a rule"
  addition in a shipped skill.
- **skill-lint E7 is the live tripwire on prose edits to shipped skills.** Angle-bracket tokens in
  prose fail the lint; use `{placeholder}` style. Dashes/lists in the added prose are fine. Ran the
  three edited dirs through `skill-lint.mjs` after each step — all green — so the lint gate never
  became a surprise at Step 4.

## Architect Lessons

- **When a plan adds an exception to a rule the same file states absolutely, the plan must mandate
  the reconciliation — the critic will otherwise be the one to catch it.** The F20 plan's first
  draft required only the variant's own content; the code-grounded critic's HIGH was exactly the
  unqualified contradicting anti-pattern two screens away. The plan-authoring rule that generalizes:
  before adding "sanctioned exception" prose, grep the target file for the rule it excepts and put
  BOTH surfaces in the step's mandate with a range-scoped acceptance gate. (Evidence:
  [F20-ProcessSkillQuickWins])
- **Range-scoped acceptance (awk between headings | grep) turns location claims from judged to
  mechanical.** Adopted from the critic's LOW; the done-check re-ran all three location gates in
  seconds with zero judgment. Use as the default form whenever an acceptance line pins *where*
  content must land, not just *that* it exists. (Evidence: [F20-ProcessSkillQuickWins])

## Skill Gaps

### edit-shipped-plugin-skill (dev-repo)
- **Kind:** missing
- **Searched for:** a skill covering the recurring dev-repo pass "edit shipped plugin skill text
  coherently" — smallest-coherent-edit discipline, enumeration/consumer sweep, adjacent-surface
  staleness (header comment / JSDoc / prose triple — and, new from F20, an in-prose *summary* of a
  numbered list you just renumbered), the two-surface reconciliation when adding an exception that
  contradicts an existing rule, lint gate, release-note obligations
- **Why it would help:** every plugin-feedback apply wave (F9, F16, F17, and now F20, plus the queued
  F21–F22) runs this same pass with the discipline re-derived in each plan; `improve-skills` covers
  project-local scaffolds and routes shipped fixes *to* this repo but no skill covers executing them
  *in* this repo. F20 adds two concrete sub-disciplines the skill should encode: (1) renumber/insert
  → grep for prose summaries of the same list; (2) an exception-vs-anti-pattern reconciliation is a
  paired edit verified from both directions.
- **References:** `docs/specs/F17-MineFieldFixes/delivery/plan.md` (Steps 1–2, 4),
  `docs/specs/F16-ArchitectureMiner/delivery/plan.md` (Step 1 skill-verification note),
  `docs/specs/F20-ProcessSkillQuickWins/delivery/plan.md` (Steps 1–3: variant reconciliation + the
  renumber-cascade coherence touch)
- **Evidence:** [F16-ArchitectureMiner, F17-MineFieldFixes, F20-ProcessSkillQuickWins]
