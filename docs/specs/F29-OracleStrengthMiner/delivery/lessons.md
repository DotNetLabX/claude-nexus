# F29-OracleStrengthMiner — Lessons

## Architect Lessons

- **Mechanically-verifiable plan claims need a live dry-run before being written.** The code-grounded
  critic's three HIGH findings shared one root: a grep/path/citation asserted with confidence language
  that had never been executed (a runner path resolved to a decoy exact-name file from an unrelated
  campaign; a `grep -c "^|"` row-count command counting header+separator; a §7 item-number citation
  contradicting its own DO-NOT-TOUCH clause). The plan-grounding rule "every pinned acceptance command
  is executed at plan time" was applied to the sweep greps but NOT to the acceptance-verification
  commands themselves — the rule's coverage in practice was partial. Structural work (echo-site
  enumeration, decision-pin fidelity, Satisfies mapping) all survived verification.
- **The code-grounded review mode earned its mandatory-grade status again.** A doc-only pass could not
  have found any of the three HIGHs — all required reading live files in two repos (including diffing
  three candidate runner scripts in the campaign repo). Fourth corroborating instance for the
  shared-artifact code-grounded mandate.
- **An external mid-planning backlog edit changed a binding input** (the owner-ratified stage-model-plan
  superseding the proposal's all-sonnet line, edited into the F28 row while planning was in flight).
  Caught only because the backlog was re-read after the system flagged the file modified. Supports the
  revision-pass re-grounding rule: a proposal's operational lines can be superseded by later ratifications
  living in a different file than the proposal.

## Developer Lessons

- **Per-process isolation for a battery runner means isolating the test's TEMP, not its CWD.** My
  first cut set `cwd=scratch` on the test subprocess to honor D4(b) "per-pid/GUID scratch" — but a
  real `flutter test` (or any stack) must run from the project root to find its suite/package;
  running from an empty temp dir breaks every live run. The correct mechanism routes `TMPDIR`/`TEMP`/
  `TMP` (+ a named `OSMB_SCRATCH`) at the per-pid dir while leaving cwd inherited. The offline
  dry-run's stub command was cwd-agnostic (`python -c print(...)`), so it passed green over the bug —
  a cwd-sensitive fixture, or explicit reasoning, is needed to catch it. Caught in the baked-in
  self-review, not the dry-run.
- **A "field-validated" promoted asset still needs verifying against the CURRENT rules, not trusted.**
  The pinned source runner scored `round(100*kills/denom, 2)` — which is *exactly* the
  instrument-integrity 74.59→75 rounding bug the D4 rules forbid. Promotion ≠ conformance; the D4
  "verify it against D4, don't rebuild it" instruction is load-bearing precisely because the source
  can carry a latent violation of a rule minted after it shipped.
- **skill-lint E6 checks a backtick-quoted `references/X.md` skill-relative; cite siblings with the
  full `../sibling/references/X.md`.** A citation preceded by `/` or a word char is treated as part of
  a longer path and skipped; one preceded by a backtick/space is resolved against the citing skill's
  own folder and errors if absent. One bare `` `references/mine-family-core.md` `` in my Relationship
  table tripped the shipped lint; the full sibling-relative path (used everywhere else in the file)
  resolves clean.
- **A `": "` (colon-space) in an unquoted frontmatter `description:` trips strict-YAML nested-mapping
  detection (skill-lint).** Trimming the description to `...suite is: a clean-room agent...` introduced
  it; an em-dash (`is —`) or comma avoids it. Both a `>1024`-char (W2) and a colon-space finding fired
  on the same description in sequence — worth checking both when tightening a long description.

## Skill Gaps

### mine-family-member-authoring
- **Kind:** missing
- **Searched for:** a recipe for adding the Nth mine-family member (SKILL.md skeleton with family-core
  pointers, the member-count sweep with positional-ordinal + homonym carve-outs, family-table row
  insert, program-doc/ADR updates, skill-lint + family-grep acceptance pair)
- **Why it would help:** F29's plan inlines the entire checklist as Steps 1, 3, 4 — re-derived from the
  F16 CHANGELOG precedent and a fresh estate grep; a recipe would make the sweep list and carve-out
  grammar reusable instead of re-enumerated per member
- **References:** plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md,
  plugins/nexus/skills/mine-architecture/SKILL.md, plugins/nexus/CHANGELOG.md (F16 entry),
  docs/specs/F29-OracleStrengthMiner/delivery/plan.md (Steps 1/3/4)
- **Evidence:** [F10-SkillGapMiner, F15-SkillCandidateMiner, F16-ArchitectureMiner, F29-OracleStrengthMiner]

### edit-shipped-plugin-skill
- **Kind:** missing
- **Searched for:** the coherent-edit discipline for sweeping shipped skill text (enumeration/consumer
  sweep, adjacent-surface staleness, DO-NOT-TOUCH carve-outs) — F29's Step 3 inlines it
- **Why it would help:** already the registered F24 gap; F29 adds a fresh occurrence (the 12-member
  count sweep across ~9 shipped files)
- **References:** docs/specs/F29-OracleStrengthMiner/delivery/plan.md (Step 3),
  docs/backlog.md (F24 row)
- **Evidence:** [F17-MineFieldFixes, F20-ProcessSkillQuickWins, F16-ArchitectureMiner, F29-OracleStrengthMiner]
