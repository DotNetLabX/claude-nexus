# Lessons — F16-ArchitectureMiner

> **Learner disposition (2026-07-21 → nexus 1.39.2):** [APPLIED] enumeration-echo sweep (count word + adjacent member list + ordinal anaphora) and paste-don't-retype transcription → create-implementation-plan (counted-surface + refactor hardening). [ROUTED-TO-BACKLOG] mine-family-member authoring gap → backlog F25 (this entry is the binding record, ADR-59); edit-shipped-plugin-skill occurrence → backlog F24. [TRACKED] ADR next-free must include claimed-but-unwritten numbers (1 occurrence); critic-continuation fallback cost (1 occurrence).

## Architect Lessons

- **A hand-transcribed sweep table drifted from its own source grep in the same authoring pass.**
  The plan rule "derive the file list from the exact acceptance grep" was followed for the grep
  but the transcription into the table dropped 1 of 8 files (`mine-verify-repo`). The grep output
  should be pasted, not retyped — or the table should be generated from the grep output
  mechanically. Second-order: the acceptance grep pair caught it structurally (the critic caught
  it earlier), confirming the both-layers design.
- **Concurrent-thread bookkeeping is the dominant defect class in this repo's spec passes.** All
  three MEDIUM ordinal/number findings (species count, ADR number, member-count enumeration) came
  from concurrent closures (F3→ADR-65, F15→ADR-66/tenth member) not being folded into a spec
  written the same day. "Verify the ordinal against the register at close, never pin it at spec
  time" is now baked into acceptance #5 — candidate for a standing spec-authoring rule if it
  recurs.
- **Critic-continuation worked, critic-termination has a fallback cost.** Resuming the same
  critic for the plan pass reused its grounding cheaply, but the platform API error killed it
  mid-pass; the tail ran in-context (disclosed in review-critic.md). If subagent availability
  degrades again, budget for a fresh spawn per pass rather than continuation.

## Developer Lessons

- **A member-count sweep has two edit classes, and the acceptance grep only catches one.** The grep
  (`ten-member|all ten|ten members|10-row`) matches the *count word*, but a sibling can also carry
  an *enumeration* of members adjacent to that word (`mine-verify-cover/SKILL.md`'s "including X, Y,
  … Z"). Bumping the count word to "11-row" while leaving the enumeration at ten members leaves a
  stale-adjacent-sentence inconsistency the acceptance grep will pass clean over. Sweep the
  enumerations that sit next to a matched count string, not only the string itself.
- **Inserting into an enumerated list can silently break an ordinal anaphora.** `mine-family-core.md`'s
  member list ends "…, and `mine-skill-candidates` (the latter two are name-and-shape members)".
  Appending the new member at the end would have re-scoped "the latter two" to the wrong pair. Insert
  a new full-contract member *before* the trailing special-cased group so the anaphora still binds.
- **ADR next-free must account for claimed-but-unwritten numbers, not just the highest written.**
  The register topped at ADR-65 written, but F15's summary had *claimed* ADR-66 (renumber recorded,
  body not yet in the README). Grepping `ADR-6[6-9]` returned zero, but taking 66 would have collided
  with F15's recorded claim. Cross-check sibling summaries for pending claims, not only the file's
  written maximum; disclose the resulting visible gap (65→67) in the status blockquote.

## Skill Gaps

- **Gap:** Authoring a new shipped mine-family SKILL.md (dev-repo) has no covering skill —
  `improve-skills` scaffolds project-local skills only; `evaluate-skill` is the diagnose half.
  **Occurrences:** F10-SkillGapMiner, F15-SkillCandidateMiner, F16-ArchitectureMiner (3rd).
  **Shape if built:** a "mine-family-member authoring" recipe — the section skeleton (intro
  triangle, pipeline block, family-core pointers, binding obligations, safety rails, NOT-do,
  relationship table), the member-count sweep procedure with the positional-ordinal carve-out,
  and the skill-lint + family-grep acceptance pair. **Owner:** learner triage (ADR-59 — this
  entry is the binding record; the plan's Gap? column is the marker).
