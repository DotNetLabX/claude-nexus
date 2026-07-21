# F11 — Fail-Closed Intake (Mandatory Clarification) — Implementation

**Scope of this round:** Steps 1-5 only (prose/agent+skill authoring). Step 6 (release: version
bump + `gen-commands.mjs` + `gen-omni.mjs` + commit) is explicitly **out of scope** for this round —
owned by the architect at lane close per the dispatch instructions. No git writes were made (no
add/commit/stage/restore/checkout/branch/stash); `plugins/nexus-analytics/.claude-plugin/plugin.json`
and `CHANGELOG.md` are untouched.

## Files Created

- `plugins/nexus-analytics/skills/fail-closed-intake/SKILL.md` — new skill (Step 1). Owns the
  declaration schema (one `inputs` dictionary + `question_level` list + per-measure `must_specify`
  list, verbatim from the plan's owner-approved schema), the per-item/per-measure precedence
  resolution (BR5, including the Flow-6 "flag interim-section removal to owner" note), the
  mandatory-set union (BR7), the fail-closed gate (BR1), one-batch asking (BR2), the per-user
  defaults record at `my-workspace/analyst-defaults.json` (BR4/BR10/BR11), legacy migration via
  `legacy_source` (BR6), the plugin-native floor (`grain`, `date_range`) + output destination
  (BR6), data-anchored relative dates (BR8), and the persistence boundary (BR10/AC-10). Mirrors the
  sibling skills' shape: frontmatter + short `##` sections + `## What this skill does NOT do` +
  `## References`. Neutral placeholders only in the schema — no product-specific input (BR6).

## Files Modified

- `plugins/nexus-analytics/agents/data-analyst.md` (Step 2) — added `fail-closed-intake` to the
  `skills:` frontmatter (now preloaded alongside `semantic-model-query`, `data-investigation`,
  `answer-qa`); rewrote `## Batched-Interview Intake` to delegate to `fail-closed-intake` (cites it
  as owner of the declaration/precedence/defaults/gate) while keeping the one-message-batching and
  never-re-ask-a-persisted-default rules stated briefly for actionability, and made the fail-closed
  stop-and-restate behavior explicit ("do not run the query... There is no run-anyway path"); added
  a `fail-closed-intake` line to `## Sibling Skills`; added a new `## What You Never Do` bullet
  ("Run a query while a mandatory input is unresolved -> instead: resolve it through
  fail-closed-intake"); updated "the three sibling skills" -> "the four sibling skills" in
  `## What You Know` (now stale otherwise, since a fourth was just added); updated the `##  Answer
  Contract` section's summary and the frontmatter `description:` to mention the new
  applied-defaults obligation and the fail-closed guarantee (see Key Decisions — these two are
  self-review fixes, not explicit plan-Step-2 line items).
- `plugins/nexus-analytics/skills/semantic-model-query/SKILL.md` (Step 3) — extended bullet 1
  (`grain -> table`) of `## The resolution ladder` with the grain-floor branch: a lookup-miss IS
  the "cannot establish grain" signal (no guessed grain), and the intake's ask (owned by
  `fail-closed-intake`) is a business-language clarification ("per store, or per SKU?"), never a
  technical "what grain?" prompt. Added a one-line cross-reference paragraph noting the
  bad-reports-excluded row-quality exclusions (BR9) are never asked about at all, in contrast to
  the grain arm's lookup-miss ask — no behavior change, a restatement.
- `plugins/nexus-analytics/skills/answer-qa/SKILL.md` (Step 4) — appended a 6th numbered item
  ("Applied defaults") to `## The answer contract`; updated the preamble "All five items" -> "All
  six items"; extended `## Malformed answers` with the default-without-naming clause, explicitly
  covering "a default that maps to none of items 1-5"; updated the frontmatter `description:` to
  mention the default-naming obligation (self-review fix, not an explicit plan-Step-4 line item).
- `plugins/nexus-analytics/skills/mine-semantic-model/references/project-profile.md` (Step 5) —
  added a new `## Intake declaration (interim bridge)` section at the end of the file describing
  the bridge a consumer's `docs/semantic-model/profile.md` may carry, the per-measure-flags-mirror
  rule, and the per-item precedence + owner-flag-on-full-shadow rule — pointing at
  `fail-closed-intake`'s authoritative schema rather than restating it. Added one sentence to the
  file's intro paragraph noting this additional section exists (so the intro doesn't undersell the
  file's contents versus its own "eleven inputs" framing).
- `plugins/nexus-analytics/skills/value-briefing/SKILL.md` (self-review fix, not a plan-listed
  file) — added `fail-closed-intake` to the two "default accuracy flows" / "never loaded by"
  enumerations (lines ~18 and ~94). This file is not one of the plan's five named files, but Step
  2's `skills:` frontmatter change (3 -> 4 preloaded skills) made these enumerations stale the
  moment `fail-closed-intake` joined the data-analyst roster; the prose-angle review (below) caught
  it as a direct, mechanical ripple of my own edit. See Deviations.

## Key Decisions

- **`## Answer Contract` in `data-analyst.md` and the `answer-qa`/`data-analyst` frontmatter
  descriptions were updated even though Step 2/Step 4 didn't name them explicitly.** The prose-angle
  review (see Self-Review) found these summary sentences went stale the instant the 6-item contract
  landed in Step 4 — both a plan-adjacent (Step 2's own file) and a Step-4 same-file staleness. Fixed
  as small, factual, non-architectural corrections rather than left as carry-over, since leaving a
  persona's own summary undercounting the contract it delegates to is exactly the kind of drift this
  feature exists to eliminate.
- **The Flow-6 "flag interim-section removal to owner" behavior was added to
  `fail-closed-intake/SKILL.md`'s Precedence resolution section**, even though the plan's Step 1
  bullet list for BR5 doesn't spell out this specific sentence (Step 5's bullet list does, for
  `project-profile.md`). Step 1's own `Satisfies:` tag explicitly claims Flow 6 in full, and Flow 6
  step 3 (spec.md) is this exact behavior; a fresh-context finder pass confirmed the words existed
  only in a template-authoring reference file `data-analyst` never loads, so the runtime guarantee
  was effectively unreachable. Added a one-sentence completion, consistent with what Step 1 already
  claimed to satisfy.
- **The "plugin-native floor and destination" section's opening sentence was reworded** ("Two intake
  items are plugin-native... grain and date_range" -> "The floor -- grain and date_range -- is never
  carried..."; closing "these are the only plugin-native intake items" -> "the floor and the
  destination together are the only plugin-native intake items"). The original wording
  self-contradicted BR6, which groups plugin-native items as *floor + destination* (3 concrete
  items across 2 categories), not 2 total. Caught by an independent finder pass; fixed to match
  BR6's own framing exactly.
- **`fail-closed-intake` is `user-invocable: true`**, matching the two skills it most directly
  extends (`semantic-model-query`, `answer-qa` are both `user-invocable: true`; `data-investigation`
  is too) per Step 1's "match the siblings' frontmatter fields" instruction.
- **Cross-skill file citations use the full `skills/{name}/references/{file}` path form**
  (e.g. `skills/mine-semantic-model/references/project-profile.md`), matching the existing
  precedent in `answer-qa/SKILL.md` (its `mine-family-core.md` citation) — this form is what
  `skill-lint`'s E6 dangling-reference check expects for a cross-skill pointer (a bare
  `references/x.md` is checked skill-locally and fails if the target isn't there).

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | `Skill: None` per plan's Skill Mapping — plugin agent/skill prose, no generative pattern skill exists for authoring this content (same posture as F6-MineMachineryHardening / F20-ProcessSkillQuickWins, both cited in the plan). Born-compliant via `skill-lint.mjs` (ADR-23), run and passing (`OK fail-closed-intake`). |
| 2 | None | `Skill: None` — agent-prose edit. |
| 3 | None | `Skill: None` — skill-prose edit. |
| 4 | None | `Skill: None` — skill-prose edit. |
| 5 | None | `Skill: None` — skill-prose edit. |
| Review | general-purpose x2 (finder passes) | Not a plan-mapped skill — the dispatch instructions substitute two parallel `general-purpose` prose-angle finder passes for `/code-review` on this docs/prose-only diff (a code-review skill would be a category error here — there is no code). Both passes' findings verified in-context and folded or dismissed; see Self-Review. |

TDD: N/A for all of Steps 1-5 — every step is `TDD: no` in the plan (prose diff, no executable
behavior to red-green; gates are the acceptance greps + skill-lint, per the plan's Testing
Strategy section and the F20 precedent it cites).

## Acceptance Evidence

**Step 1 — skill-lint (born-compliant, ADR-23):**
```
$ node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-analytics/skills/fail-closed-intake
OK    fail-closed-intake
```
Exit 0. Also re-ran across every touched/adjacent skill after the fix round (fail-closed-intake,
semantic-model-query, answer-qa, mine-semantic-model, data-investigation, value-briefing) -> exit 0
overall; only pre-existing W4 nested-reference warnings on `mine-semantic-model` (confirmed via
`git diff --stat` on `project-profile.md` = pure additive 31 insertions, 0 deletions — the warnings
predate this feature and are unrelated to the Step 5 edit).

**Step 1 — acceptance greps (all hit, re-verified after the fix round):**
- `no query runs while any mandatory input` (fail-closed no-run-while-unresolved rule) — SKILL.md:67
- `no run-anyway` — SKILL.md:69
- `Precedence is resolved` (per-item precedence rule) — SKILL.md:45
- `my-workspace/analyst-defaults.json` — SKILL.md:82, 155
- `legacy_source` — SKILL.md:27, 34, 92
- `destination.*not re-asked` — SKILL.md:112
- `business-language clarification` (grain deferral) — SKILL.md:105
- `latest available date` (BR8) — SKILL.md:119
- `never version-controlled` (persistence boundary) — SKILL.md:126, 156

**Step 2 — acceptance greps:**
- frontmatter `skills:` line includes `fail-closed-intake` — data-analyst.md:6
- intake section names `fail-closed-intake` and the fail-closed gate — data-analyst.md:17-25, 63
- `## What You Never Do` new never-run line — data-analyst.md:76

**Step 3 — acceptance greps:**
- unresolved-grain branch ("lookup resolves nothing") — SKILL.md:17
- `per store, or per SKU` — SKILL.md:21
- `never a technical` (grain-prompt clause) — SKILL.md:21
- bad-reports pre-query obligation cross-referenced as never-asked — SKILL.md:39, 50

**Step 4 — acceptance greps:**
- 6th numbered obligation naming defaults — SKILL.md:31 (`6. **Applied defaults**`)
- `assumed:` — SKILL.md:32, 88
- `Using default` — SKILL.md:31
- `## Malformed answers` default-without-naming clause — SKILL.md:87

**Step 5 — acceptance greps:**
- new intake-declaration section — project-profile.md:138 (`## Intake declaration (interim bridge)`)
- pointer to `fail-closed-intake` — project-profile.md:143, 147
- no duplicated schema block — confirmed absent (`question_level:` / `must_specify:` as YAML keys
  do not appear in project-profile.md; only prose mentions of the field names)

## Self-Review

**Verdict: PASS — 6 real findings folded (2 HIGH, 3 MEDIUM/LOW converged, 1 LOW ripple), 2 findings
dismissed with reason. No CRITICAL or unresolved HIGH remains.**

Ran two independent parallel `general-purpose` finder passes (fast-mode substitute for
`/code-review` on this prose-only diff, per dispatch instructions) checking: (a) internal
consistency, (b) dangling cross-references, (c) guarantees dropped/narrowed vs plan/spec, (d)
directional references vs final file layout, (e) stale adjacent sentences.

**Folded (real, fixed):**
1. **HIGH** (Pass B) — `fail-closed-intake/SKILL.md`'s "plugin-native floor and destination"
   section self-contradicted on the count of plugin-native items (opened "two", closed "these are
   the only" after introducing a third). Fixed — reworded to mirror BR6's own floor-plus-destination
   framing exactly.
2. **HIGH** (Pass A) — Flow 6 step 3's "flag interim-section removal to owner" existed only in
   `project-profile.md` (a file `data-analyst` never loads), even though Step 1's `Satisfies:` tag
   claims Flow 6 in full. Fixed — added to `fail-closed-intake/SKILL.md`'s Precedence resolution.
3. **MEDIUM** (both passes, converged independently — strong signal) — `data-analyst.md`'s own
   `## Answer Contract` summary undercounted the contract at 5 items after Step 4 made it 6. Fixed.
4. **MEDIUM/LOW** (both passes) — `answer-qa/SKILL.md` and `data-analyst.md` frontmatter
   `description:` fields didn't mention the new default-naming/fail-closed obligations. Fixed.
5. **LOW** (Pass B) — `value-briefing/SKILL.md`'s two "default accuracy flows" enumerations
   (not a plan-listed file) went stale the instant Step 2 added a 4th preloaded skill to
   `data-analyst`. Fixed as a direct, mechanical ripple of my own edit (see Deviations).

**Dismissed (false positive / out of round-scope, with reason):**
- Pass A's LOW finding that Step 2's intake section "restates mechanics rather than pure
  delegation" — dismissed: the section's first sentence explicitly attributes ownership
  ("resolve every mandatory input through the `fail-closed-intake` skill — it owns...") before
  briefly restating the batching/never-re-ask behavior for in-context actionability, matching the
  existing `## Model-First Navigation` section's own pattern (cites `semantic-model-query` as owner
  while still stating its rule inline). A judgment call, not a defect.
- Pass B's informational note that `plugins/nexus-analytics/commands/data-analyst.md` still says
  "the three sibling skills" — dismissed: that's the generated command file, explicitly Step 6's
  job (`gen-commands.mjs` regeneration), which is out of scope for this round per the dispatch
  instructions ("Do NOT run... gen-commands.mjs").

Both passes independently confirmed clean on: internal consistency of the declaration schema
(field names, path, policy enum values byte-for-byte identical across all files), dangling
cross-references (none), and all 12 BRs walked individually with a shipped sentence at least as
strong as the spec requires.

## Carry-Over Findings

None outstanding — all findings from the prose-angle review were either folded (fixed) or
dismissed with reason above; nothing is being deferred to the reviewer unresolved.

## KB Changes

None. Per the plan's KB Impact section, this feature edits plugin skill/agent prose, not a
consuming project's `docs/kb/`.

## Deviations from Plan

- **`plugins/nexus-analytics/skills/value-briefing/SKILL.md` was edited, though it is not one of
  the plan's five named files.** Reason: Step 2's `skills:` frontmatter change (adding
  `fail-closed-intake` as a 4th preloaded skill on `data-analyst`) made `value-briefing`'s two
  "default accuracy flows" / "never loaded by" enumerations factually stale the moment it landed —
  a direct, mechanical consequence of my own Step 2 edit, not a new design decision. The fix is a
  2-line addition of the new skill's name to two existing enumerated lists; no new behavior, no
  architecture. Flagging explicitly per the "deviation = documented, never silent" rule; the
  architect can revert this file alone if it should instead route through a separate change.
- **`## Answer Contract` (data-analyst.md), `answer-qa`'s frontmatter `description:`, and
  `data-analyst`'s frontmatter `description:` were updated beyond Step 2/Step 4's literal file-scope
  lists.** Reason: same-file staleness the prose-angle review caught (see Key Decisions and
  Self-Review above); these are corrections to summaries the plan's own steps made stale, not new
  scope.
- **The Flow-6 "flag removal to owner" sentence and the floor/destination reword in
  `fail-closed-intake/SKILL.md` go slightly beyond Step 1's literal bullet list** but are within
  what Step 1's `Satisfies:` tag already claims (BR5, BR6, Flow 6) — completions of an existing
  claim, not new scope. See Key Decisions.
- **No other deviations.** All five plan-named files were edited exactly as scoped; Step 6 (release)
  was not touched (no version bump, no `gen-commands.mjs`/`gen-omni.mjs`, no commit) per the
  dispatch's explicit hard-scope instruction.
- **Pre-existing, unrelated dirty state observed and left untouched:**
  `docs/specs/F11-AnalyticsFailClosedIntake/definition/spec.md` shows as modified in `git status`
  (its `**Plan:**` line changed from `None` to the plan path) — this predates this implementation
  round (the architect's own plan-writing step) and was not touched by me; confirmed via `git diff`
  that the only change is that one line, and I never opened this file with Edit/Write. Similarly,
  `docs/kb/research/br-anchored-regeneration-landscape.md` and `docs/programs/` (flagged in the
  dispatch as explicitly not-mine) were left exactly as-is — never read or touched this round.

## Carry-Over for Architect (Step 6 confirmation)

- Per the plan's Decisions table (D4), the recommended release tier is **MINOR** (new
  `fail-closed-intake` skill + new fail-closed capability = new capability, not a fix) — the plan
  marks this "deferred (owner confirms)". Confirm at Step 6.
- `data-analyst.md` frontmatter changed (both `skills:` and `description:`), so
  `node scripts/gen-commands.mjs nexus-analytics` must run at Step 6 to regenerate
  `plugins/nexus-analytics/commands/data-analyst.md` (currently stale — still says "the three
  sibling skills", correctly not touched by me this round).

*Status: COMPLETE — developer, 2026-07-21.*
