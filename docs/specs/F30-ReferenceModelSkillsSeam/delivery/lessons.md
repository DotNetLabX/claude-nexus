# F30-ReferenceModelSkillsSeam — Lessons

## Architect Lessons

- **A plan's evidence block must sweep every file the plan itself edits.** The Context echo-check ran
  against `plugins/nexus/README.md` but skipped `docs/architecture/README.md` — the very file Step 3
  edits — missing ADR-50's Rejected entry that F30 reverses (critic HIGH-5). The echo sweep's scope
  floor is: full estate + each file named in an implementation step.
- **Paste executed grep output; never re-transcribe it.** The plans-rule "paste the executed output"
  applies to Context evidence blocks too — the carve-out list was retyped from memory of the grep and
  dropped a hit (`mine-skill-gaps:3`), turning the Step 2 acceptance count wrong (critic HIGH-1).
- **Inline markup breaks contiguous-substring count baselines.** `**Not** a consumer` never matches
  `not a consumer` (-i) — a count baseline over prose with markdown bold needs markup-tolerant
  patterns or per-surface eyeballing (critic MEDIUM-2).
- **When filtering by another artifact's disposition vocabulary, enumerate all its values.** The
  charter filter named `keep / aspire` and was silent on `replace` — F27's vocabulary is three-way,
  and the silent value was exactly the one carrying the pack's target patterns (critic HIGH-3).
- **Code-grounded critic on a shared-artifact pass paid again:** 3 HIGH, none findable by a doc-only
  pass (a Rejected entry deep in a 2,000-line register; live grep counts; a sibling file's frontmatter).

### Improvement Proposal (optional, for systemic issues)
**Target:** `plugins/nexus/skills/create-implementation-plan/SKILL.md` (Plan Grounding & Deviation Rules)
**Change:** Extend the "paste the executed output" rule beyond file-list tables to *every* plan-time
evidence claim (counts, carve-out lists, echo-check dispositions), and state the echo-sweep scope
floor: full estate + every file the plan's steps edit.
**Evidence:** [F30-ReferenceModelSkillsSeam]
**Priority:** medium

## Developer Lessons

- **A "flip X → Y" CHANGELOG/doc entry can quote the old text and break the plan's own estate-invariant
  grep.** The plan pinned a plugins-wide `not a consumer` count (exactly five carve-out files) as a
  Step-2 acceptance invariant. My CHANGELOG bullet described the flip as `flipped from "not a consumer"
  to consumer` — reproducing the literal old substring, which added a sixth plugins-wide hit and would
  have failed the invariant. Fix: when a plan uses a phrase as a whole-estate count invariant, do not
  reproduce that literal substring in adjacent prose (CHANGELOG, docs) — paraphrase the old value
  ("previously marked non-consumer"). Caught by re-running the full acceptance sweep after the release
  step, not just the per-file greps — the invariant grep is estate-wide, so it must be re-run after
  *every* edit in the round, including CHANGELOG/doc edits, not only after the SKILL edits.
- **Fast-lane backlog Done rows: mark version now, carry the sha to lane close.** The Done-row format
  is `Done (shipped {date}, nexus {ver}, {sha})`, but a no-git-writes developer can't produce the
  closure-commit sha (a commit can't self-reference). Write the version and a `sha at lane close`
  placeholder, and record the owed sha as a Carry-Over finding for the team-lead — don't invent a sha
  and don't leave the row Ready.

## Skill Gaps

### add-adr-entry (dev-repo)
- **Kind:** missing
- **Searched for:** a recipe for appending an ADR to the dev-repo register — contents row, the
  ADR-67/68-style Status + register-re-check numbering block, and the reconciliation sweep for prior
  ADRs whose Rejected/Superseded entries the new ADR overturns
- **Why it would help:** Step 3 re-derived the conventions by reading ADR-67/68, and the missed
  ADR-50 Rejected reconciliation had to be caught by the critic (HIGH-5); a recipe step "grep the
  register for prior claims on the same seam before numbering" prevents that class. Sibling recipes
  (F24 edit-shipped-skill, F25 mine-family-member) don't cover the ADR register.
- **References:** `docs/architecture/README.md` (ADR-67 :1871–1876, ADR-68 :1928–1933, ADR-50
  :1293–1298 as the reconciliation instance)
- **Evidence:** [F30-ReferenceModelSkillsSeam]
