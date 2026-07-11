# Lessons — adhoc-DecisionLog

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [APPLIED] acceptance-and-step-text-are-the-same-query, 2nd occurrence → create-implementation-plan executed-acceptance bundle. [TRACKED] retroactive Step-2 review pattern (with adhoc-MineFamilyCore).

## Architect Lessons

- **When a plan says "define section X" in a doc that DOCUMENTS an artifact's structure, pin the
  representation — quoted name or live heading.** [adhoc-DecisionLog] team-lead.md *names* the
  comm-log's sections in prose (`**Runtime / Plugin Issues Log**`) while the runtime artifact
  carries them as real H2s; my plan's "define `## Decisions Log`" was ambiguous between the two,
  and a live H2 in the agent doc would have structurally swallowed the following content — with
  **zero gate coverage** (the AC greps pass either way). **How to apply:** for any doc-about-a-doc
  edit, state explicitly "rendered as a quoted section name, never a live heading" (or vice
  versa), because grep-shaped ACs are blind to markdown structure.
- **A paraphrase in a plan step can silently break a count-based AC.** [adhoc-DecisionLog]
  Dropping the two words "Decisions Log" from the shutdown clause would have failed AC-1's ≥3 —
  the tech-spec and plan must carry load-bearing phrases verbatim, not paraphrased.
  Second occurrence class of "acceptance and step text must be the same query"
  (create-implementation-plan's grep-derivation rule, applied to prose phrases).

## Developer Lessons

- **A pure-prose plan step (Skill Mapping `(none)` across every step) is still worth a quick
  post-edit grep of the exact AC signature before moving on**, not just at the final Step 3 gate.
  [adhoc-DecisionLog] Running the AC-1/AC-2/AC-3 greps immediately after each file edit (rather than
  batching all verification to the end) caught nothing wrong here, but it's what made the critic's
  M1 wording fix (verbatim "Decisions Log" in the shutdown clause) verifiably land — a paraphrase
  slip would have shown up as a count of 2 instead of 3 right away instead of at the final gate.
- **`selfcheck.mjs`'s `gen-omni --check` will legitimately FAIL between "commands regenerated" and
  "omni twin regenerated"** — this is expected mid-sequence state, not a regression, when the plan's
  step ordering (regen commands → bump → sync twin) is followed literally. Re-run selfcheck only
  after the full release sequence (bump + omni sync) completes, not after each intermediate step,
  to avoid mis-reading an expected transient FAIL as a break.

## Reviewer Lessons

- **A retroactive Step-2 review (code already committed/released) is still fully verifiable when
  the plan's ACs are grep-shaped.** [adhoc-DecisionLog] With git read-only and no diff to review
  (tree clean at HEAD, well past the feature commit), every AC re-executed cleanly against the
  current file state — `grep -c`/`grep -n` re-derive the same evidence a pre-commit review would
  have gotten, plus a `gen-commands.mjs` re-run and `git show <sha> --stat` substitute for a live
  diff. **How to apply:** when handed "review the committed changes, git is read-only," don't
  treat the missing diff as a blocker — pull the commit's file list via `git show --stat`/`git show
  -- <path>` and verify against the current tree; it's equivalent evidence for a prose/grep-gated
  feature.
- **Critic-fixed findings (M1/M2 here) are exactly where a reviewer's fresh-evidence check earns
  its keep** — both fixes were paraphrase/representation risks with zero gate coverage on their
  own (the critic said as much: "the greps pass either way" for M2). Re-verifying that a
  critic-adopted fix actually landed byte-for-byte (not just referenced as "adopted" in plan prose)
  is cheap and catches the class of defect gates can't.

## Skill Gaps

None. `release-plugin` (Step 4) and the plan's prose-only steps (1–3, Skill Mapping `(none)`)
matched their skills/tech-spec anchors exactly; no gap encountered.
