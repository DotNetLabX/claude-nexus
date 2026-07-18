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

## Reviewer Lessons
- **A "generalize, never copy" port needs the sweep list derived from a token *census* of the
  reference tree, not from memory.** The plan's alternation missed KG's `SR-\d` spec-rule ids and
  "review cycle 1" history phrases — the exact same foreign-id class as the `F52` the done-check
  caught — because the list was authored from recalled tokens rather than grepping the reference
  tree for id-shaped patterns (`[A-Z]{1,3}-?\d+`, dates, tool paths) first. For the next port:
  build the forbidden-token list mechanically from the source tree, then subtract the sanctioned
  set.
- **Reviewing a semantic-fidelity port is a three-way diff, not a two-way one:** target vs
  reference for meaning drift, AND target-internal for cross-file consistency (the identical
  disclosure string in three homes, the item-11 merge rule stated twice). The single most effective
  check was hunting each mandatory phrase (`none open`, "never receives `verified`",
  "append-only") in BOTH trees and comparing force-carrying words — faster and higher-yield than
  reading files linearly side by side.

## Skill Gaps
- None. This was a prose/markdown contract-file port; no plan step mapped a pattern skill, and no
  gap surfaced that an existing skill should have covered. (`improve-skills` is the wrong home — this
  was a planned feature port of an existing shipped skill, not a lesson-driven skill fix or a gap.)
