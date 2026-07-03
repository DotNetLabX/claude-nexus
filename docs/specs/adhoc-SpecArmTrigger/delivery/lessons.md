# Lessons — adhoc-SpecArmTrigger

## Architect Lessons

- **The vocabulary-not-shapes failure now has four logged instances in one spec family** (SddCoverageLoop
  CRITICAL, SddLifecycle systemic note, this spec's CRITICAL-1 "spawn a background agent", this plan's
  HIGH-1 "the existing architect review gate"). The pattern generalizes: *any* wiring claim of the form
  "extend the existing X" must be grep-verified that X exists in the live file before the spec is written
  — the assumed structure is exactly as dangerous as the assumed module shape. Candidate promotion: add
  "grep the anchor before citing it" to the tech-spec authoring checklist (create-feature-spec /
  architect instructions).
- **A checkpoint that exists only as practice is not a checkpoint you can batch into.** The ADR-27
  tech-spec review gate was real in every recent run yet absent from architect.md — formalizing it was
  net-new work this feature almost mis-scoped as "existing." When a convention is exercised repeatedly
  but never written into the agent file, flag the codification as its own step.
- **Owner-AFK checkpoint handling worked:** at the 60s AskUserQuestion timeout, proceeding on the
  architect's own recommendation (code-grounded critic — the same choice the owner made one checkpoint
  earlier) kept the pipeline moving and was consistent with the owner's revealed preference. Record the
  auto-application in the artifact (plan.md notes it) so the owner can reverse on return.
- **Two code-grounded critic passes paid for themselves again:** Mode 1 caught a CRITICAL topology
  incompatibility (single agent can't orchestrate the multi-agent method); Mode 2 caught the nonexistent
  anchor Mode 1 missed. Neither is findable by a doc-only pass; both would have bounced at done-check or
  shipped broken.
- **The drill validated the mode end-to-end on first run** (54 rules, 52 verified, stamp reproducible;
  the 3-miner redundancy earned its cost — 10 of 54 rules came from fewer than 3 miners). The 2
  `ambiguous` verdicts were genuine spec findings, not mode defects — the "spec findings are the second
  product" claim held on the very first run.
- **Reviewer Open Question disposition (architect answer):** the dense routing sentence at
  `architect.md:151-154` is intentional — the generic checkpoint-report relay carries the offer in team
  mode; bespoke team-lead recording for the technical branch is the spec's explicit Out-of-scope deferral
  (rides with AC-T6/the fold-in). Leave as-is; revisit at the fold-in when the deferral closes. The
  reviewer's two-sentence convention proposal (mechanism + limitation stated separately) is a good
  learner candidate.

## Developer Lessons

- **A plan that pins exact anchor line ranges (`:150-164`, `:218-224`, `:246`) survives a preceding edit
  cleanly** — even after Step 3's four edits shifted architect.md's own line numbers, the *content*
  anchors (paragraph text, section headings) the plan cited were still findable by grep/Read, so no
  re-triangulation was needed. Anchor-by-content (not just by line number) in a plan is what makes this
  robust — worth calling out explicitly as the reason to prefer it over "L136" alone.
- **Renumbering an existing continuous numbered list (Phase 1 → Phase 2 sharing one sequence) when
  inserting a mid-list step is easy to under-scope.** Inserting one new Phase 1 item meant six downstream
  items across two sections needed renumbering, not just the immediately following one. Worth a plan-level
  callout next time a plan step says "insert a new item in Phase N's numbered list" — flag whether the
  numbering is local-to-phase or continues across phases, so the developer renumbers the right span in one
  pass instead of discovering the second phase's collision after the fact.
- **A pre-existing uncommitted change to a file outside the plan's five-file scope** (the OD-T2 amendment
  in `adhoc-SddLifecycle/definition/tech-spec.md`) was present at stint start, made by a prior
  architect/PO round, not by this developer stint. Caught it with `git status --short` before starting —
  confirming the anti-pattern rule ("attributing pre-existing changes to the current feature") also runs
  in reverse: a developer must actively check for *unrelated* pre-existing dirt and document it, not just
  avoid claiming credit/blame for it.

## Reviewer Lessons

- **Independently re-running cheap verification commands (hash recompute, grep-back, gen-commands, plugin
  validate, selfcheck) instead of trusting implementation.md's reported output caught nothing wrong here,
  but it's cheap insurance for instruction-file features** — the developer's claims all reproduced exactly,
  which is itself useful evidence (corroboration, not just citation). Worth keeping as the default posture
  for "no runtime source code" plans where the only artifacts are agent/skill prose and a drilled output.
- **A three-way cross-file contract (PO/architect/team-lead describing the same batched-question routing)
  is best verified by reading all three checkpoint sections side-by-side in one pass**, not sequentially —
  wording drift shows up as a missing parallel clause (e.g., one file stating an unattended-default
  behavior the sibling file omits), which is easy to miss without a direct three-way diff-by-eye.
- **A dense, single-sentence "spawned by X: do Y (parenthetical disclosing Y doesn't fully work)" pattern
  is a recurring readability trap** in these agent files — it's technically correct (discloses the gap) but
  reads as self-contradictory on a first pass. Worth a possible convention: state the positive mechanism
  and the disclosed limitation as two separate sentences, not one compound clause, when the limitation
  meaningfully qualifies the mechanism.

## Skill Gaps

- None surfaced this stint. All six steps plan-mapped `Skill: None` (instruction-file edits with no
  pattern skill to invoke); the `implementation-format` skill's guidance on documenting an all-`None`
  stint (cite the plan's exemption, don't fabricate an invocation) was sufficient as-is.
