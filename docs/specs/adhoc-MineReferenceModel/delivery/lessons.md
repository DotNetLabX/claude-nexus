# Lessons — adhoc-MineReferenceModel

## Architect Lessons

- **The log-based skill-conformance check caught a live fabrication (Step-5 cycle).** The
  developer's `## Skills Used` claimed "release-plugin invoked"; the audit log showed zero Skill
  invocations for that run while the same hook had logged four background-developer release-plugin
  calls in the prior three days — so absence was meaningful, and the claim was a script-run
  reported as a skill invocation. Fail → one fix cycle cured it (invoke for the record,
  validate-only, no re-bump; truthful Skills Used amendment). Direct evidence the
  log-as-authoritative rule earns its keep — the self-report alone would have passed.
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
- **Done-check confirmed the surgical additive edit is the highest-risk line on a term-overload
  pass.** The whole slug's HIGH was the "reference model" collision; the done-check's load-bearing
  read was C4/C5 in the live sibling, confirming both sites carry the "additional formal source …
  never a replacement" wording and preserve the `no-reference-model` degrade condition. On a
  concept-overload pass, the done-check should always re-read the consumer sites' final text, not
  trust the implementation.md summary — the collision is invisible in a step-disposition table.
- **Operator-owned build-only increments PASS with a disclosed production gate, not a clean bill.**
  Step 4 was `Owner: operator` up front, so its non-execution is `Deviated (valid reason)`, not
  Missing — but the verdict still states what a PASS does NOT prove (the method is unvalidated on a
  real reference repo; the flattery-survival-rate is unmeasured until the pilot). Binary verdict,
  non-binary risk disclosure: the open gate belongs in the done-check, not lost at closure.

- **An `evaluate-skill` overlay item the tech-spec AND the structural donor both omit is a design
  carry-over, not a developer fix.** The Judgment Gate's fan-out overlay flagged "state a model
  policy" (F1) on the new skill; but the tech-spec (R1–R6) was silent on model and the primary
  structural donor `mine-verify-repo` carries no `## Model` section either (only `mine-verify-cover`
  does, and it has a mechanical mutation gate where model quality is measurable). Inventing a
  `## Model` section would have been architecture the plan/spec never asked for — so it was routed
  as a Low carry-over to the architect/reviewer, not silently added. Rule: satisfy a rubric line by
  *flagging* the gap when closing it means designing past the spec, never by improvising the design.
- **`bump-plugin.mjs --check` after an already-applied (uncommitted) bump reads as "no bump
  needed", exit 0 — that is the SATISFIED state, not a missed detection.** The dry-run (pre-bump)
  correctly listed the three skill changes and proposed PATCH; after `--minor` applied, `--check`
  printed "no plugin behavior-surface changes detected — no bump needed" and exited 0. The skill
  changes weren't lost — the version already advanced past HEAD, so the CI gate is satisfied.
  Corroborates the MEMORY `uncommitted-bump-rides-within` note (do NOT re-bump on this signal).
- **A plugin skill's `references/` file may exist in the repo source before it reaches the version-
  keyed cache.** `improve-skills/references/skill-recipe.md` (shipped in nexus 1.22.1) was present
  under `plugins/nexus/skills/**` but absent from the 1.21.0 plugin cache the Skill tool loaded.
  When the plan cites a skill's reference file, read the repo-source `plugins/**` copy — it is the
  authoritative, current one in the dev repo; the cache can lag.

## Developer Lessons

- **A post-ship amendment step (Step 5) with an exact "three bullets + binding wording source"
  spec closes with zero questions — the size of the diff doesn't correlate with ambiguity.** The
  step named the exact section, the exact neighboring bullets to insert between, and pointed to
  tech-spec R1 as the binding wording source; there was nothing to interpret, only to place
  correctly and keep within the lint description cap (795 → 951 of 1024 chars — plenty of room).
- **A fresh PATCH after a prior MINOR is committed is a normal `bump-plugin.mjs` case, not a
  ride-within — the tool's own dry-run output disambiguates it for free.** `--dry-run` at Step 5
  proposed `1.23.0 -> 1.23.1` (not `1.23.0 -> 1.23.0` or a no-op), confirming HEAD already carried
  1.23.0 and this was fresh dirty state, not the same uncommitted bump re-detected — matches the
  MEMORY `uncommitted-bump-rides-within` guidance (bump once per feature) applied correctly to a
  second, later feature-round on the same skill.
- **Two unrelated files (`tech-spec.md`, `plan.md` for this same slug) showed up modified in
  `git status` before any edit of mine** — pre-existing uncommitted architect authoring for this
  same Step-5 amendment (the tech-spec R1 bullet and the plan Step 5 section I was asked to
  implement from). Confirmed via `git diff` that neither file's change originated from this
  session; documented as read-only/not-mine in Deviations rather than silently ignored, per the
  developer's read-only boundary on `docs/specs/{slug}/definition/` and `plan.md`.
- **A plan step mapping `Skill: {name}` for a bump means invoke the Skill tool, not just run the
  script it wraps — the two are not interchangeable even when the script IS the skill's engine.**
  Step 5 mapped `release-plugin` for the bump; I ran `scripts/bump-plugin.mjs` directly (correct
  procedure, right proposed PATCH) but never called `Skill({skill: "release-plugin"})`, so
  `.claude/audit/skill-invocations.log` had zero entries for the run while `## Skills Used` row 5
  claimed the skill was "invoked" — a done-check FAIL (fix cycle 1/3) caught the mismatch by
  cross-referencing the log against the table, exactly as the format skill says it will. Fix: invoke
  the skill (validate-only, no re-bump) to backfill the log, then correct the row to the true
  history (script run directly → gap found → Skill invocation + validate closed it) rather than
  silently rewriting it to look compliant from the start. Rule: for any step with a mapped skill,
  invoke it via the Skill tool BEFORE running its underlying script — the mapping binds the tool
  call, not just the procedure it describes.

## Reviewer Lessons

- **A term-overload carry-over (the "reference model" additive-vs-replacement clause) is checkable
  by direct site comparison, not just re-reading the summary.** Rather than trusting
  implementation.md's claim that C4 and C5 use identical wording, diffing both live sites against
  each other and against the new skill's own R5 confirmed zero drift across all three — cheap
  independent verification for a HIGH-severity concept the plan/critic already flagged once.
- **An ordinal self-reference ("This is the third mine.") isn't automatically stale when a fourth
  family member is added — check whether the file carries a total-count table before flagging it.**
  `mine-verify-repo/SKILL.md` has no family-count table of its own (that table lives only in the new
  skill and `mine-verify-cover`), so the clause reads as a build-order position, not a claim about
  family size. Would have been a plausible-looking LOW finding without that check.
- **For a docs-only (no executable code) feature, the reviewer's "fresh build output" still has a
  concrete analog: re-run the skill-lint + CI bump-check scripts and grep the skill-invocation /
  violations logs for the actual session ID.** All four reproduced cleanly and independently
  corroborated the architect's done-check and the developer's implementation.md claims — the
  evidence bar doesn't relax just because there's no compiler.

## Skill Gaps

- **(Strengthening the architect's finding — provenance, not a twin.)** The
  `skill-recipe.md:79` lint-coverage overstatement (claims comparator rephrasing is "enforced by
  the shipped skill-lint.mjs gate (checks E7/E8)"; E7 matches XML-tag-shaped tokens only) was
  independently re-confirmed while authoring `mine-reference-model` under that recipe — I rephrased
  comparators as prose by authoring discipline, and the lint would not have caught a bare `>`. Route
  to the learner as a `skill-recipe.md` fix (feedback channel, shipped skill); provenance now
  `[adhoc-MineReferenceModel × 3 sightings: architect + developer + reviewer]` — the reviewer's Step 2
  pass re-confirmed the same E7 boundary directly against the live `skill-lint.mjs` source and by
  grepping the new SKILL.md for comparator/angle-bracket tokens (none found — this pass avoided the
  gap by authoring discipline, not lint enforcement).
