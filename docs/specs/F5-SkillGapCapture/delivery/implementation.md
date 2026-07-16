# F5-SkillGapCapture — Implementation

## Files Modified

- `plugins/nexus/skills/lessons-format/SKILL.md` — Step 1: added the fielded `## Skill Gaps` entry
  template (Kind/Searched for/Why it would help/References/Evidence) as a new fenced block right after
  the skeleton's closing fence (`:43`), with its own short prose intro and a "Field rationale" note —
  mirrors the `### Improvement Proposal` precedent's shape. Kept the skeleton's `## Skill Gaps` heading
  and its two hint bullets untouched (still exactly one heading occurrence in the file). Extended the
  existing "Provenance & strengthen-don't-duplicate" rule's opening sentence to cover the skill-gap
  entry's `**Evidence:**` line, not just the improvement proposal's.
- `plugins/nexus/agents/architect.md` — Step 2: rewrote `## After Every Review Cycle` (was two lines
  naming only `## Architect Lessons`) to add the binding-record rule: a `None`-disposition step (after
  the Skill Mapping's "Skill verification before setting None" sub-protocol) is a *verified* gap, logged
  to `## Skill Gaps` in the same lessons.md pass using the Step-1 fielded template (referenced, not
  restated). States explicitly that the plan's `Gap?` column is a plan-local marker only — the lessons.md
  write is the binding record.
- `plugins/nexus/agents/solo.md` — Step 3: added `skills: lessons-format` to frontmatter (solo had none).
  Added a new `## Lessons` section (after Debugging & Boy Scout, before What You Never Do) obligating a
  `## Solo Lessons` update before finishing, plus a `## Skill Gaps` log referencing the Step-1 fielded
  template when a skill search comes up empty or ill-fitting.
- `plugins/nexus/agents/developer.md` — Step 4: slimmed the Step-158 inline field list ("missing skill
  (what you needed, suggested name, coverage, references used) or ill-fitting skill (which, what didn't
  fit, what you did instead)") down to a reference to the Step-1 `lessons-format` template, while keeping
  the `**Log skill gaps**` trigger phrase byte-for-byte and preserving the ill-fitting case explicitly.
  The unrelated `:131` hard-rule mention of "Skill Gaps" (file-ownership boundary) was untouched.

- `plugins/nexus/skills/create-implementation-plan/SKILL.md` — Step 5: replaced the "Log to the Gaps
  column for future skill creation" ending of the `None` disposition bullet (line 39) with a route to
  `lessons.md` `## Skill Gaps` per `lessons-format`, explicitly stating the `Gap?` column stays a
  plan-local marker, not the record.
- `plugins/nexus/skills/create-implementation-plan/references/plan-template.md` — Step 5: changed the
  `Disposition rules`' `None` bullet's "Log the gap." to name the destination
  (`lessons.md` `## Skill Gaps` per `lessons-format`). Added a new `Gap?` column vocabulary bullet
  defining the two legal values (`gap: {what's missing}` / `—`) and stating that confidence/owner/TDD
  values don't belong in this column. **Self-review fix:** the plan explicitly said to leave the row-3
  worked-example `Gap?` cell (`Log to lessons.md`) untouched since "it already routes correctly" — but
  that instruction predates this same step's new "exactly two legal values" vocabulary bullet 8 lines
  below it, which the untouched free-text cell then contradicted. Both baked-in finder passes caught this
  independently; changed the cell to `gap: {what's missing}` (the vocabulary bullet's own placeholder) so
  the file is internally consistent. Re-ran Step 5's `gap: ` accept grep after the fix (now 2 matches,
  still ≥1) and the skill-lint gate (still exit 0) — see `## Self-Review`.
- `plugins/nexus/rules/agents-workflow.md` — Step 5: appended `, under `## Skill Gaps` — see
  `lessons-format`.` to the existing "No matching skill: Architect may inline snippets. Log the missing
  skill in lessons.md." sentence — kept the sentence intact per plan instruction, only appended the
  heading + reference.
- `plugins/nexus/commands/architect.md`, `plugins/nexus/commands/developer.md`,
  `plugins/nexus/commands/solo.md` — Step 6: regenerated via `node scripts/gen-commands.mjs nexus` (all
  8 agent commands regenerate; only these three changed content since only these three source agent
  files changed in Steps 2–4). Never hand-edited.
- `docs/architecture/README.md` — Step 7: added `## ADR-59` (Accepted) right after ADR-58's Rejected
  paragraph and before the `---` divider that precedes `## Inherited pipeline decisions` — mirrors
  ADR-58's header-note shape (Status blockquote citing the register re-check, the collapsed-definition
  note, the delivery-record path). Records the binding decision (lessons.md `## Skill Gaps` is the
  record; the `Gap?` column is a two-value marker) and the measured leak (4 of 11 directed + ≥6
  undirected). **Self-review fix:** the Context paragraph's first draft self-contradicted ("only
  `developer.md` named both the heading and fields" immediately followed by "scattered across four
  documents ... none naming the heading or a field," ambiguous about whether `developer.md` was one of
  the four) — reworded to "everywhere *else*... four *other* documents" naming them explicitly, matching
  the plan's own non-contradictory phrasing. Caught by the baked-in finder pass, see `## Self-Review`.
- `docs/backlog.md` — Step 7: added the F5-SkillGapCapture row after the F4 row, following F2's row
  shape (Spec column = `ADR-59 (collapsed definition, ADR-25)`, Status = `In Progress`). Impact/Effort
  (6 / low / 6.0) chosen by analogy to F2's row (a similarly-scoped systemic process-integrity fix,
  8-step doc-only plan) — the plan did not specify exact Impact/Effort numbers for this row, so this is
  a judgment call; see Key Decisions.
- `plugins/nexus/.claude-plugin/plugin.json` — Step 8: `version` bumped `1.34.5` → `1.34.6` (PATCH) via
  `node scripts/bump-plugin.mjs` (default, no `--minor`/`--major`), per the plan's PATCH decision.
- `plugins/nexus/CHANGELOG.md` — Step 8: `bump-plugin.mjs` prepended a `## [1.34.6]` stub with the
  auto-detected reason bullets (agent instruction/behavior change, shipped command changed, rule changed,
  two skill changes); I then replaced the stub body with a full description of the actual change
  (per the release-plugin skill's step 3 instruction to "edit the generated CHANGELOG entry to describe
  the actual change — the stub line is just a placeholder"), matching the existing entries' bolded
  one-line summary + bulleted detail style.

## Key Decisions

- Steps 1–4 combine the "trigger" and "binding record" rationale into one cohesive paragraph per file
  rather than two separate edits, where the plan's two numbered edits for a step (e.g. Step 2's two
  edits) land in the same section — both edits concern the same act (writing lessons.md at the point a
  gap is known), so splitting them into two separate locations would fragment one obligation across the
  file for no gain. Confidence: high — the plan's own Step 2 prose treats both edits as describing a
  single behavior change.
- Step 7 backlog row Impact/Effort (6 / low / 6.0): the plan didn't give exact numbers, so I set them by
  analogy to F2-AdhocIsSoloOnly's row (same shape of change — a systemic process-integrity/lane-rule
  fix, ADR-collapsed definition, no proposal). Confidence: medium — a reasonable lean, not derived from
  a cited source; the owner can adjust at backlog triage without touching any Accept-gated content.
- Step 8 bump ran PATCH (`1.34.6`), matching the plan's decision. Flagging to the owner per the plan's
  own instruction ("flag possible MINOR to owner"): the plan's `## Decisions` table already recorded and
  resolved this ("PATCH, not MINOR... decided — flagged to owner in Step 8"), so this is a restatement of
  an already-made call, not a new open question — solo gaining a lessons mandate is the one change in
  this feature that could be argued as a new capability rather than a fix.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | improve-skills | Invoked via Skill tool before editing `lessons-format/SKILL.md` (dev-repo carve-out: fix shipped skill directly, lint is the done-condition) |
| 2 | None | Plan: `Skill: None` — no skill covers editing a shipped agent file (see plan's Gap note; logged to `lessons.md` `## Skill Gaps`, dogfooding the Step-1 template) |
| 3 | None | Plan: `Skill: None` — same gap as Step 2 |
| 4 | None | Plan: `Skill: None` — same gap as Step 2 |
| 5 | improve-skills | Invoked again via Skill tool (fresh invocation, not reused from Step 1) before editing `create-implementation-plan/SKILL.md` and `plan-template.md`; `agents-workflow.md` is a rule file, edited directly per plan |
| 6 | None | Plan: `Skill: None` — mechanical script run (`gen-commands.mjs`) |
| 7 | None | Plan: `Skill: None` — ADR + backlog prose |
| 8 | release-plugin | Invoked via Skill tool before running `bump-plugin.mjs` |

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Skill-gap template's `Kind: ill-fitting` case has no dedicated diagnostic sub-field | low | architect | `lessons-format/SKILL.md`'s new template carries `{Suggested skill name}` / `Kind` / `Searched for` / `Why it would help` / `References` / `Evidence`. The pre-edit `developer.md:158` inline list had two genuinely distinct field sets: missing-skill (what you needed, suggested name, coverage, references) vs. ill-fitting-skill (**which existing skill**, **what didn't fit**, what you did instead). The new template's `Kind: ill-fitting` flag preserves that you *can tell which case it is*, but there is no field asking "which skill" or "what specifically didn't fit" — `Searched for` and `Why it would help` are both worded prospectively ("what you needed" / "what it would cover"), not diagnostically for a rejected existing skill. Found independently by the baked-in review's Pass B. | Not developer-actionable: this exact 5-field template is plan-pinned content (Step 1's `## Decisions` table explicitly weighed and decided this shape — "Ship the 4 owner-selected fields as-is" was the *rejected* alternative to adding `Kind`). I implemented the plan's template byte-for-byte rather than unilaterally adding fields beyond what the plan specified. Softened my own CHANGELOG/implementation.md language to say the distinction "survives as the `Kind` flag" rather than claiming full 1:1 field parity. Flagging for the architect to judge whether this is acceptable as shipped or warrants a follow-up field. |

## Deviations from Plan

- None. All 8 steps implemented as written; every pinned Accept grep re-executed and matched its
  plan-time baseline. The two judgment calls made where the plan was silent (backlog row Impact/Effort
  numbers; combining a step's two numbered edits into one section per file) are recorded under
  `## Key Decisions`, not here, since neither contradicts or departs from a plan instruction — the plan
  simply didn't specify a value/location for them. The two fixes made in response to the baked-in
  Self-Review (ADR-59 wording, `plan-template.md`'s worked-example cell) are documented inline in
  `## Files Modified` and are not plan deviations — they correct internal contradictions my own Step 5/7
  prose introduced, not departures from what the plan instructed.

## Self-Review

**Verdict: PASS — 3 real findings folded (2 fixed in-place, 1 carried over as not developer-actionable),
0 false positives.**

Two parallel `general-purpose` finder passes (not `Explore`, per dispatch instructions) ran read-only
over the working diff, each on a distinct pair of prose angles from the dispatch's angle set.

**Pass A — internal consistency / dangling cross-references; directional references vs. final layout:**
1. **FOLDED (fixed).** `docs/architecture/README.md`'s ADR-59 Context paragraph self-contradicted: "only
   `developer.md` named both the heading and its fields" was immediately followed by "the instruction was
   scattered across four documents ... none naming the heading or a field," ambiguous about whether
   `developer.md` was one of those four. Reworded to "everywhere *else* ... four *other* documents"
   naming them explicitly (`create-implementation-plan/SKILL.md`, `plan-template.md` twice,
   `agents-workflow.md`), matching the plan's own (non-contradictory) phrasing.
2. **FOLDED (fixed) — confirmed independently by Pass B too.** `plan-template.md:26`'s worked-example
   `Gap?` cell contradicted the new two-value vocabulary rule 8 lines below it. Fixed (see Files
   Modified).
3. Directional references: **none found** — the finder verified `lessons-format/SKILL.md`'s Section-map
   sentence still lists an accurate heading set post-edit, and that no ADR text assumes ADR-58/59 is "the
   last one" in a way the insertion would stale.
4. Bonus (not a required angle): independently re-verified the ADR-59/CHANGELOG quantitative claims
   (4 leaked `lessons.md` files by name, `adhoc-PipelineHardening`'s 9 gap cells) against the actual
   files — both check out.

**Pass B — dropped/narrowed guarantees; stale adjacent sentences:**
1. **Verified clean, no defect:** the `None`-disposition rewording in both `create-implementation-plan`
   files still directs an immediate, plan-writing-time log (not deferred), reinforced by `architect.md`'s
   "in the same pass" language; the new `Gap?` vocabulary's `—` value still legally covers an "expected,
   not a gap" note; `architect.md`'s rewritten "After Every Review Cycle" section keeps both original
   obligations intact verbatim while adding the new material; `solo.md`/`agents-workflow.md` edits are
   clean additions with no adjacent contradiction; the three regenerated commands match their source
   agent files exactly (only the wrapper/frontmatter differs, as designed).
2. **Real finding, carried over (see `## Carry-Over Findings`), not fixed in-place.** The plan-pinned
   5-field template flattens the old two-case field set for the ill-fitting case down to a `Kind` flag —
   the label survives, the two diagnostic sub-fields ("which skill", "what didn't fit") do not carry over
   1:1. Not developer-actionable since the field set is plan-pinned; softened my own wording instead of
   silently absorbing the gap.
3. Same finding as Pass A's #2 (`plan-template.md:26`) — independent confirmation, already folded once.

No false positives were dismissed — every finding from both passes was either real (folded/fixed or
carried over) or the pass explicitly verified the area clean with cited evidence, not just silence.

*Status: COMPLETE — developer, 2026-07-15*
