# F3 increment 0 — port the feedback-loop layer into `mine-semantic-model` — Lessons

## Developer Lessons
- **The plan's Step 6.3 test command (`node --test tests/`) is broken on this repo's Node.** The
  bare-directory form errors `MODULE_NOT_FOUND: tests` on Node 24.18.0 (regressed on Node ≥22). The
  repo's own `tests/README.md:63-66` already documents this and mandates the glob form
  (`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`). Lesson: when a plan hard-codes a
  bare-dir `node --test` acceptance line, run the glob form and flag the plan line — don't burn a
  circuit-breaker attempt debugging a documented platform regression.
- **Generalizing a KG-origin contract file is mostly mechanical token-substitution, but two spots
  need genuine rewriting, not find-replace:** (1) illustrative examples (KG's
  `code(AnalyticsReport.scopeIsAutocompleted)`, the flat-hierarchy `deprecated` example) must be
  re-authored as generic-but-native examples — the plan explicitly keeps KG's own examples in KG;
  (2) KG runtime vocabulary (`read_reference`) generalizes to a *concept* ("a runtime-served
  grounding root"), which reads differently in each sentence and can't be blind-substituted.
- **A file-scoped token allowance is only checkable with `grep -n` + a known section boundary.** The
  acceptance sweep passes only because every KG-token hit in `project-profile.md` sits at a line
  number past the `## Worked example` heading (line 68). Recording the heading line number turns a
  "these look like they're in the worked example" hand-wave into a mechanical proof — worth doing
  whenever an allowance is "only in section X".
- **Cross-citations between two new/edited reference files each raise a skill-lint nested-reference
  WARN, one per direction.** `output-contract.md` ↔ `feedback-ledger.md` produced two WARNs. These
  are advisory (exit 0) and accepted here per the KG-pilot precedent, but if a future skill needs
  zero WARNs, the fix is to inline the cross-referenced content or flatten the chain — budget for
  that when a plan adds a reference file that legitimately depends on a sibling reference.
- **A token-sweep acceptance grep must span ALL file types in the unit, not `--include="*.md"`.** I
  scoped the KG-token sweep to markdown and it silently excluded the 7 `probes/*.sql` files in the
  same skill dir — a pre-existing `F52` in an SQL comment slipped the gate and the architect's
  done-check (which swept all types) caught it. When a plan says "scoped to `{dir}/`", sweep the
  whole tree (drop `--include`, or enumerate every extension present); a foreign token hides just as
  easily in a `.sql`/`.cs`/`.json` sibling as in a `.md`. The gate is only as wide as its file filter.
- **(wave 1) A case-insensitive substring token-sweep catches banned tokens hiding inside ordinary
  English words.** The F3 sweep regex includes `OOS`, `SAP`, `SKU`, `shelf` — and `OOS` matches
  inside `choose`/`boost`/`loose`/`goose`, `SAP` inside `disappear`/`sapling`. Writing a
  domain-generalized rewrite (analyst-craft.md) means avoiding those *carrier words*, not just the
  retail nouns — I wrote `pick`/`lift`/`raise`/`drop out` instead of `choose`/`boost`/`disappear`.
  Lesson: when the sweep is case-insensitive + substring, treat the banned list as substrings and let
  the grep be the gate; a visual read will not catch `oos` inside `choose`.
- **(wave 1) The step-6 sweep runs over every file you EDIT, not just the files you create — so a
  pre-existing foreign token in a line you didn't author becomes yours to fix.** answer-qa contract
  item 1 carried a pre-existing retail example (`store-day, SKU-day`); the moment I edited that file
  it entered the 0-hit sweep scope and `SKU-day` had to be generalized. Budget for cleaning
  pre-existing tokens in any file a "generalize" wave touches, and surface it as a disclosed finding
  (not a silent change) since it edits a line outside the plan's named edits.
- **(wave 1) skill-lint E6 dangling-ref check + a cross-plugin reference citation: prefix the path
  with the skill dir.** A bare `references/foo.md` token in a SKILL.md is checked for on-disk
  existence (skill-relative OR repo-root); citing another plugin's reference file that legitimately
  does NOT ship under your plugin would dangle. Writing it as
  `skills/mine-verify-cover/references/mine-family-core.md` puts a `/` before `references/`, and E6's
  `(?<![\w/])` lookbehind skips the token — the lint-safe form for a cross-plugin prose citation.
- **(wave 1) Hardening a skill's body without updating its frontmatter description is a recurring
  drift the evaluate-skill Layer-1.1 check catches.** The answer-qa S2 edits added a whole grounding
  gate + penalty-only doctrine + provenance panel, but the description still described only the
  original 5-item contract — invisible to auto-invocation. Make "does the description still describe
  the body?" a reflexive last step of any skill-body edit; here it was cheap to fix in-pass and
  turned a fix-then-accept into an ACCEPT.
- **(wave 1, fix cycle) Perturbing a fingerprint number means perturbing its whole *coherent set*,
  not the one line the finding names.** F1 named `output-contract.md:146` (`4,570/4,038/~532`), but the
  same fingerprint lived at the index row (`:30`) and the "probe-sized" estimate (`:142`) as `~530`
  (i.e. `532` rounded). Changing only line 146 would (a) still ship a real-run fingerprint and (b) make
  the worked example internally incoherent — a "probe-sized" estimate of `~530` next to a probe delta of
  `~350`. Lesson: when a fix perturbs a number that other lines *derive from*, trace the derivation and
  move the set together; verify with a stale-number grep over the whole file (`4,570|4,038|532|~530|530`
  → 0 hits), and disclose the beyond-the-named-line edits as a finding.

## Reviewer Lessons
- **A "generalize, never copy" port needs the sweep list derived from a token *census* of the
  reference tree, not from memory.** The plan's alternation missed KG's `SR-\d` spec-rule ids and
  "review cycle 1" history phrases — the exact same foreign-id class as the `F52` the done-check
  caught — because the list was authored from recalled tokens rather than grepping the reference
  tree for id-shaped patterns (`[A-Z]{1,3}-?\d+`, dates, tool paths) first. For the next port:
  build the forbidden-token list mechanically from the source tree, then subtract the sanctioned
  set. **Recurred in wave 1 (Step-2 review) with a new sub-class: numeric fingerprints.** The
  step-6 sweep ran clean, yet the shipped worked example carried the pilot run's exact measured
  magnitudes (`4,570/4,038/~532` — `output-contract.md:146` = `pilot-report.md:101`); a vocabulary
  regex cannot see numbers. The census approach extends: harvest the reference/pilot tree's literal
  magnitudes alongside id-shaped tokens, or mandate perturbed numbers in worked examples at
  authoring time. Evidence: [F3 increment 0, F3 wave 1].
- **Reviewing a semantic-fidelity port is a three-way diff, not a two-way one:** target vs
  reference for meaning drift, AND target-internal for cross-file consistency (the identical
  disclosure string in three homes, the item-11 merge rule stated twice). The single most effective
  check was hunting each mandatory phrase (`none open`, "never receives `verified`",
  "append-only") in BOTH trees and comparing force-carrying words — faster and higher-yield than
  reading files linearly side by side.
- **A mandated verbatim duplication is verifiable mechanically, and should be** (wave 1, critic
  MED-2): normalize both occurrences (strip emphasis markers, collapse whitespace across the hard
  wrap) and string-compare, then confirm each carries the mutual "one rule" cross-reference. A
  hard-wrapped file defeats naive `indexOf`/grep of the full sentence — normalize first. Two
  minutes of script beats an eyeball judgment on a sentence the plan requires to be identical.
- **"Same skeleton, nouns swapped" is the residual leak class a genuine rewrite still carries**
  (wave 1, AC-9): after vocabulary and cross-references are cleaned, the last thing to check is
  whether an illustration's *sentence structure* survives from the source (move 10's
  "cohort rose sharply while the population stayed flat over the same window"). Where the skeleton
  is the move's minimal statement it can pass — but it must be a deliberate judgment call in the
  review, not an unexamined pass.

## Skill Gaps
- None. This was a prose/markdown contract-file port; no plan step mapped a pattern skill, and no
  gap surfaced that an existing skill should have covered. (`improve-skills` is the wrong home — this
  was a planned feature port of an existing shipped skill, not a lesson-driven skill fix or a gap.)
