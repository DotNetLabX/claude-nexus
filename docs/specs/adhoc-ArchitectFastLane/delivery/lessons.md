# Architect-Led Fast Lane — Lessons

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [APPLIED] prose-diff code-review variant, 2nd occurrence with adhoc-BranchStrategyAsk (+ general-purpose-not-Explore correction) → architect.md fast-lane dispatch. [APPLIED] bump dry-run reasons-list contamination, 2nd occurrence → CLAUDE.md release section. Structure-independent acceptance phrasing → create-implementation-plan bundle.

## Architect Lessons

- **The plan's central scope thesis ("single file suffices") was wrong, and only a code-grounded
  critic caught it.** The always-on ownership hard rule (`agents-workflow.md:158`) restates the
  prohibition the lane excepts — an in-context self-review would have shipped a lane contradicting
  its highest-authority rule surface every session. Generalizable: when a pass carves an exception
  into ANY role boundary, grep the whole plugin for other statements of the same rule
  (`agents-workflow.md` All-Agents section first) — ownership rules are deliberately multi-stated,
  so a single-file exception is almost never complete.
  **Evidence:** adhoc-ArchitectFastLane.
- **My original Decisions row rejected a strawman.** "Lane lives in architect.md only — rejected:
  section in agents-workflow.md (paid by every session)" framed the alternative as all-or-nothing;
  the real need was one clause, not a section. When writing a rejected-alternative, check whether
  a smaller version of the alternative survives the rejection argument.
  **Evidence:** adhoc-ArchitectFastLane.
- **An acceptance criterion can fail a correct implementation — calibrate greps against the real
  file structure, not the plan's own description of it.** The `grep -c ≥ 3` I wrote assumed "two
  bullets" that are one physical line; a faithful implementation would have scored 2 and failed.
  The critic caught it because it read the live file. Structure-independent phrasing greps beat
  line-count greps for prose amendments.
  **Evidence:** adhoc-ArchitectFastLane.
- **Pin gate mechanisms with evidence, not plausible prose.** "Scoped by agent + session" had two
  readings, one of which silently voids the skill-conformance gate. The fix cited the live log
  from the previous lane run (spawned developer logs the parent session id) — and this run then
  dogfooded the pinned mechanism successfully (two lane runs' entries separated cleanly by the
  ts lower bound).
  **Evidence:** adhoc-ArchitectFastLane.

## Developer Lessons

- **A plan's "e.g." example wording for a hard-rule amendment can carry a real ambiguity the
  acceptance grep doesn't catch — resolve it before shipping, not just after the grep passes.**
  The plan's Step 1b example text ("except both, at the close of an Architect-Led Fast Lane run")
  left "both" with no clean two-item antecedent (the preceding clause lists three forbidden
  artifacts joined by "or", not two) — grammatically dangling even though every required grep
  (`close of an Architect-Led Fast Lane run` ≥2) passed cleanly. Two independent code-review
  finder passes flagged it. The fix (naming the two excepted actions explicitly) kept every
  acceptance grep green while removing the ambiguity — a reminder that "the acceptance greps are
  exact" governs the *content that must be present*, not a proof the prose reads unambiguously.
  When a plan gives "e.g." wording for a hard-rule sentence, treat it as a starting point to refine
  for clarity, not a verbatim mandate, as long as the required phrases stay intact.
  **Evidence:** adhoc-ArchitectFastLane.
- **A directional cross-reference ("above"/"below") written before the section layout is finalized
  is easy to get backwards, and a plain grep-based acceptance check can't catch it.** The new lane
  section's Done-check bullet said "the Step 1: Done Check rules **above** apply verbatim" — but
  `## Step 1: Done Check` sits at line 280, structurally *below* the new lane section at line 224.
  None of the plan's acceptance greps would have caught this (they check phrase presence, not
  spatial claims). Caught by a code-review finder pass reading both sections' actual positions.
  When writing a plan-mandated cross-reference into a *new* section inserted relative to *existing*
  sections, verify the directional word against the actual final line numbers, not the mental model
  of where the referenced section "usually" sits.
  **Evidence:** adhoc-ArchitectFastLane.
- **A same-artifact contradiction can survive an edit that touches only the "new" paragraph and
  leaves an adjacent, untouched sentence stating the old unconditional rule.** `summary-format`
  SKILL.md's Step 3 amendment added a new `**Producers.**` paragraph naming two producers — but the
  file's pre-existing opening sentence ("Written by team lead after reviewer approval…") was never
  touched and sat two lines above the correction, recreating in miniature the exact ownership
  contradiction this whole feature exists to eliminate. The plan's acceptance greps (`architect`
  count ≥2, `architect-led fast lane` hits) were satisfied by the new paragraph alone and didn't
  require reading the file's *other* sentences for staleness. When a plan step adds a corrective
  paragraph next to (rather than replacing) an existing unconditional claim, explicitly re-read the
  paragraph immediately before/after the insertion point for staleness — don't assume "I added the
  new truth" is the same as "no old contradicting claim remains nearby."
  **Evidence:** adhoc-ArchitectFastLane.
- **Scaling `code-review` to a proportionate depth for a pure-prose diff, reusing a documented
  precedent shape, continues to work well and surfaced real defects a doc-only self-review likely
  would have missed.** Reused the exact shape documented in
  `docs/specs/adhoc-BranchStrategyAsk/delivery/lessons.md` (two parallel `general-purpose` finder
  passes at a scoped depth, then in-context verification myself rather than a separate verifier
  agent per finding) rather than the skill's literal xhigh-flavored 10-angle/8-candidate procedure,
  which is written for executable code (SQL injection, wrapper/proxy correctness, language
  pitfalls) and doesn't map onto an agent-instruction markdown diff. This is now a second data point
  for the pattern — worth promoting once a third occurrence confirms it.
  **Evidence:** [adhoc-BranchStrategyAsk, adhoc-ArchitectFastLane]
- **`Explore`'s current agent description explicitly excludes the exact task shape this precedent
  needs ("code review, design-doc auditing, cross-file consistency checks, open-ended analysis"),
  where the prior run's lesson used "Explore-agent finder passes."** Used `general-purpose` instead
  for both finder passes this round — full tool access, no such exclusion, and it is the agent type
  whose own description names "design-doc auditing" and "open-ended analysis" as in-scope. Worth
  updating the prior lesson's wording (or the eventual promoted skill note) to say `general-purpose`
  rather than `Explore` for this pattern, so a future developer doesn't reach for the wrong agent
  type on a stale reading.
  **Evidence:** adhoc-ArchitectFastLane.
- **`bump-plugin.mjs`'s working-tree-wide contamination (documented in the prior run's lessons) is
  not a one-off — it recurred verbatim this round with a different set of unrelated in-flight
  files (mine-reference-model / mine-verify-cover / mine-verify-repo / mine-semantic-model instead
  of the prior run's single mine-semantic-model entry).** The in-flow fix (the `release-plugin`
  skill's own Step 3: hand-correct the generated CHANGELOG entry) continues to be sufficient and
  low-friction, but the recurrence across two independent runs strengthens the case for the CLAUDE.md
  bump-guidance addition the prior lesson already proposed (check the dry-run's reasons list against
  files you actually intended to touch, especially in a multi-agent environment).
  **Evidence:** [adhoc-BranchStrategyAsk, adhoc-ArchitectFastLane]

## Skill Gaps

- **`code-review` still has no docs/prose-diff variant** (recurrence of the gap logged in
  `docs/specs/adhoc-BranchStrategyAsk/delivery/lessons.md`). Its Phase-1 angle set (line-by-line
  for null-deref/off-by-one, language-pitfall specialist, wrapper/proxy correctness, SQL injection)
  remains written for executable code. Adapted by hand again this round (see Developer Lessons
  above) using the same manual 2-finder shape rather than the skill's literal procedure. This is
  now a 2-occurrence recurrence of the same gap — meets the promotion threshold for a "prose/rules
  diff" branch in the skill (swap the code-specific angles for prose-specific ones: internal
  consistency, dangling cross-references, dropped guarantees, directional-reference accuracy —
  the new "above vs below" defect class this round adds to the prior run's list of what such a
  branch should check for).
  **Evidence:** [adhoc-BranchStrategyAsk, adhoc-ArchitectFastLane]
