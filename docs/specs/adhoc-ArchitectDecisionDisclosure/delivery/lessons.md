# Lessons — adhoc-ArchitectDecisionDisclosure

## Architect Lessons

- **An externally-sourced recommendation names a concept, not this repo's structure — transplanting
  its vocabulary literally into a plan step creates unsatisfiable acceptance.** The research verdict
  said "surface 'Decisions taken: N' at the checkpoint report"; the plan wired it into "the
  Checkpoint Report when reporting Phase-2 completion" — a structure that does not exist in
  architect.md (the usage list covers Phase-1 outputs and verdicts only), making the `grep -c ≥ 2`
  acceptance unsatisfiable without mutating a shared placeholder (critic HIGH). Before wiring
  anything into a named artifact structure, grep that structure's usage list in the live file —
  even when the plan already cites the file elsewhere.
- **Two gates sharing one criterion phrase is an ambiguity generator.** The disclosure bar reused
  "hard to reverse" both as the row-earning trigger and as the ask-first (one-way door) trigger, so
  one call could match both rules (critic MEDIUM). When a new rule borrows an existing lens (ADR-25),
  split the thresholds explicitly — the borrowed lens's axis must map to exactly one outcome per
  band (two-way door → disclose; one-way door → ask).
- **Dogfooding the mechanism in its own plan surfaced design questions before the critic did.**
  Writing this plan's `## Decisions` section forced the row-shape calls (where open items live,
  severity level, explicit-None sentence) to be made explicitly at authoring time — and gave the
  code-grounded critic a well-formed instance to verify against instead of an abstract spec.
- **A `grep -A{n}` acceptance is window-fragile — assert tokens on one line instead.** Step 3's
  original `grep -A2` check would pass or fail on the implementer's line-wrapping choice, not the
  content (critic MEDIUM). Acceptance lines should name tokens co-located on a single greppable line
  (`## Decisions` + `MEDIUM` + `predate`), never depend on a context-window size.
