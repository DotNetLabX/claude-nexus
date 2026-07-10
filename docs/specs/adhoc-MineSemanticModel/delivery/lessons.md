# Lessons — adhoc-MineSemanticModel

## Architect Lessons

- **A fixed token list under-covers a coupling SURFACE — derive sweep ACs from the coupling
  class, not from remembered example tokens.** [adhoc-MineSemanticModel] AC-6's original five
  KG tokens (`laurentiu_read|kg_seed|…`) were all real, all verified — and still let 14
  dotnet/C#/ps1 anchors plus 4 feature-ids ship, because the list was built from the tokens I
  remembered seeing, not from the CLASS of coupling being excluded (stack anchors, feature-ids,
  repo paths). The critic's measured inventory showed a fully KG-coupled skill passing every AC.
  **How to apply:** when an AC's job is "artifact X is free of coupling Y", write the sweep as a
  class regex (`\.cs\b|\.ps1\b|\bdotnet\b|\bF[0-9]{2}\b|…`) with named per-file exceptions —
  then enumerate the current hits and disposition each one in the plan, so the grep and the
  dispositions are the same query.
- **Verify a critic's suggested fix-grep with the same per-context scoping you'd demand of your
  own AC.** [adhoc-MineSemanticModel] The critic's H1 fix proposed `all four` = 0 hits across the
  skills tree; my re-grep found FOUR live hits, one of them legitimate (`mine-family-core.md:109`
  counts the kickoff checklist's four ITEMS, not the four members). Adopting the suggestion
  verbatim would have built a false-positive AC into the plan — the same failure class the AC
  guards against, one level up. **How to apply:** every grep that enters a spec/plan gets executed
  against disk and its hit inventory classified — including greps proposed by a reviewer; the
  reviewer's authority doesn't transfer to their regex.
- **Skill-promotion passes have a recurring shape — the "lift" leaks the source project through
  three channels: literal tokens, tooling anchors, and provenance ids.** [adhoc-MineSemanticModel]
  Paths (`seed/db/…`) are the visible channel; the ones that slip are code-symbol anchors
  (`DataPoolQueryExecutor.cs:103` cited as behavioral precedent) and feature-ids (`F38`/`F52`)
  woven into prose. A generalization plan owes a disposition for each channel, plus the sanctioned
  exceptions named per file (here: the origin story's `F38` in SKILL.md; everything KG-flavored in
  the profile's worked example).

## Developer Lessons

- **Byte-for-byte fidelity and a token-scoping AC can genuinely conflict — and the conflict lives
  inside the SOURCE, not the transform.** [adhoc-MineSemanticModel] Two of the seven probes carried
  pre-existing inline comments naming KG's large-table names and a pilot feature-id (`F52`) — Step
  1's "byte-for-byte, do not edit SQL" instruction and AC-6/AC-9's literal "whole shipped folder"
  wording can't both hold when the copied bytes themselves contain the forbidden tokens. Executing
  the plan's own Satisfies/Acceptance lines revealed the resolution was already implicit (neither
  Step 1 nor Step 2/3's acceptance lines ever claim AC-6/AC-9 for `probes/`) — but that implicit
  scoping only surfaces by running the grep and reading which step claims which AC, not by reading
  the tech-spec's prose in isolation. **How to apply:** when a plan lifts source verbatim AND
  imposes a token-scoping AC on the same package, explicitly state the AC's scope exclusion for the
  verbatim artifact class up front (mirroring how AC-9 already excludes `project-profile.md`) —
  don't leave it to be inferred from step-level acceptance omissions.
- **A green sequencing gate at hand-off is a snapshot, not a guarantee — re-verify immediately
  before the gated action, not just at session start.** [adhoc-MineSemanticModel] The task brief
  confirmed the Step-5 gate was green (`plugin.json` == HEAD at 1.28.0) and named the exact
  re-check command. Re-running that exact command right before the bump (not trusting the
  brief's earlier snapshot) caught a live concurrent sibling bump to 1.29.0 that had landed,
  uncommitted, sometime during this session. Had I bumped on the brief's word alone, this would
  have been the exact double-bump CLAUDE.md's rule exists to prevent. **How to apply:** any
  precondition stated as true "at hand-off" for a long-running implementation session is a
  point-in-time fact, not a standing one — re-verify mechanically, at the moment of the gated
  action, every time, regardless of how confidently the brief states it.
- **An internal numbering scheme lifted from a promoted source can collide with the promoting
  repo's OWN numbering for the same artifact.** [adhoc-MineSemanticModel] The KG source cited its
  own spec's `AC-2`/`AC-4`/`AC-6`/`AC-7`/`AC-10` inline as load-bearing cross-references. This
  promotion's OWN tech-spec independently defines `AC-1..AC-10` with different meanings for the
  same numbers. Neither numbering scheme is wrong on its own — the collision only exists because
  both share a repo now. Caught by `evaluate-skill`'s Layer 1.4 citation audit, not by skill-lint
  (dangling-reference checks don't catch a citation to a NUMBER, only to a file path). **How to
  apply:** when promoting a skill/doc from a source repo that has its own AC/FR/SR-style internal
  numbering, grep for that numbering pattern across the promoted package and check it against the
  PROMOTING repo's own numbering namespace before shipping — a coincidental collision is worse
  than an obviously-foreign one because it reads as correct.

## Skill Gaps

- No skill-authoring / promote-skill skill exists (Steps 2–3 ran as `Skill: None`); `evaluate-skill`
  covers post-authoring quality but lints SKILL.md only — references and non-md package files have
  no authoring guidance or lint. Second consecutive authoring-shaped gap (LearnerCadenceNudge
  logged the hook-authoring variant).
