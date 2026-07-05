# Lessons — adhoc-MineReferenceModel

## Architect Lessons

- **A missing design donor is not a blocker when the family invariants + a hand-built precursor
  exist.** The designated donor run (the Flutter program's ad-hoc reference-model extraction) had
  not happened — but the seed doc (`dotnet-reference.md`, 2026-05-31) was a working miniature of
  the target artifact, and the mine-family contracts transferred. Resolution chosen with the
  owner: ship-first, donor-run-becomes-pilot — the family's established rhythm (mine-verify-repo
  itself piloted after shipping).
- **Reusing a family term for a new artifact needs an explicit additive-vs-redefinition clause at
  every consumer site.** "Reference model" already had an ADR-47-fixed referent (the repo's own
  ADRs/conventions); naming the new artifact `reference-model.md` silently overloaded it, and the
  plan's surgical one-clause instruction was readable two incompatible ways. Caught by the
  code-grounded critic (the HIGH). Rule: when a new skill's output joins an existing adjudication
  concept, state the relationship (additional source vs replacement) in the tech-spec, the ADR,
  AND the cross-reference step — never leave it to the developer's reading.
- **The code-grounded critic mandate paid again on a docs-only pass:** every plan line-anchor
  verified (zero drift — the anchors were grepped at plan time, which is why), and the one real
  finding was exactly the class a doc-only review misses (a semantic collision visible only by
  reading the live sibling's C4/C5 text against ADR-47).
- **Upstream doc bug found in passing (route to learner):** `improve-skills/references/`
  `skill-recipe.md:79` overstates the lint gate — it claims comparator rephrasing is "enforced by
  the shipped skill-lint.mjs gate (checks E7/E8)", but E7 matches XML-tag-shaped tokens only (the
  char after the angle bracket must be a letter); bare comparators are not lint-caught. Fix
  belongs to a feedback/learner pass on improve-skills, not this slug.
- **Locating an externally-referenced feedback file: verify with PowerShell, then widen, then
  transcripts.** The prompt said "from KG project"; the file actually lived in the Flutter pilot
  repo. Glob + PowerShell sweep + session-transcript grep resolved it without asking the user a
  question they'd already part-answered ("might be contradictory").
