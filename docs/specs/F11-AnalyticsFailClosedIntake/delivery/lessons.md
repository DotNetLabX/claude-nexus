# F11-AnalyticsFailClosedIntake — Lessons

> **Learner disposition (2026-07-22 → nexus 1.44.1):** [APPLIED] roster-enumeration ripple → backlog F24 evidence (+F11). [TRACKED] Satisfies-tag sub-step cross-check (final literal AC pass + every Flow sub-step vs the step's own bullet list) — 1 feature occurrence (2 intra-run instances). Two-parallel-finder prose review: already encoded (architect.md fast-lane dispatch) — corroboration only. Schema-stress-test-against-cited-BR and authoritative-layer-first presentation: stay with judgment.

## Architect Lessons

- **A novel cross-repo contract schema must be stress-tested against the very BR it satisfies, before
  presenting it.** The plan introduced a concrete declaration schema to satisfy BR12 ("one declaration
  shape"), but the first draft used two structurally different flavors for the per-measure half
  (`measure_flags:` map in the profile vs. inline `must_specify:` on the model) — a direct BR12 violation
  sitting in the same block as the BR it cited. Both the code-grounded critic (HIGH-1) *and* mine-from-spec
  (SF-1) caught it independently. **Convergent independent review on the same defect is a strong signal** —
  when the miner and the critic point at the same thing, it's real. Fix landed as D5 (one `inputs`
  dictionary referenced by both `question_level` and per-measure `must_specify`).

- **The user's premise challenge beat my presentation.** I led the owner review with the *profile*
  (interim-bridge) flavor and product-flavored example values, which read as "old-project hardcoding." The
  user's "shouldn't this come from the semantic model?" was correct and was the same issue the reviews
  found from the other side. Lesson: for a layered/precedence design, present the **authoritative** layer
  first and use neutral placeholders for any shipped-artifact schema (BR6-style agnosticism) — a
  product-flavored example in a plugin artifact invites exactly this (justified) pushback.

- **`Satisfies:` tags need a final literal pass against the spec's BR/AC numbers.** The plan shipped an
  off-by-one (AC-10 vs AC-11) that would have let a reviewer grep "AC-10" at the wrong step and conclude
  the persistence-boundary AC was covered when it was untagged. The code-groundedness was strong; the
  bookkeeping layer was where the drift hid.

## Skill Gaps

- None verified this pass. Steps 1–5 are `Skill: None` because they author/edit **plugin agent+skill
  prose**, for which no generative pattern skill exists (same posture as F6/F20). This is a *known,
  recurring* `Skill: None` category, not a newly-discovered gap — noting it here for the miner's cross-plan
  signal, not as a new gap entry.

## Developer Lessons

- **A `skills:` frontmatter roster change ripples into every file that enumerates that roster by
  name, not just the file whose frontmatter changed.** Adding `fail-closed-intake` as a 4th preloaded
  skill on `data-analyst` (Step 2) went on to make `value-briefing/SKILL.md`'s two "default accuracy
  flows" / "never loaded by" enumerations stale — a file the plan's 5-file list never named. Neither
  the plan nor the Skill Mapping table flagged this ripple; only the prose-angle review's finder pass
  caught it. **Grep the whole plugin tree for the OLD roster's exact skill-name list before/after a
  `skills:` frontmatter edit**, not just the file being edited — any enumeration mirroring "the
  default accuracy flows" or similar is a candidate for silent staleness.
- **A "these are the only N items" closing sentence is a self-contradiction trap when the section
  header names more categories than the opening sentence counts.** `fail-closed-intake/SKILL.md`'s
  "## The plugin-native floor and destination" section opened with "Two intake items are
  plugin-native... grain and date_range" but the section (and its own header) also covers a third
  ("destination"), so the closing "these are the only plugin-native intake items" silently expanded
  scope from 2 to 3 without the opening being corrected. When a section's header names 2+ categories,
  state the total count once, matching the spec's own framing (BR6 here: "floor" + "destination" as
  2 *categories*, not "2 items") — never let an opening count and a closing count refer to different
  sets.
- **A plan step's `Satisfies:` tag can promise more (a whole spec Flow) than that step's own bullet
  list spells out.** Step 1 claimed `Flows 2–6` but its bullet list never mentioned Flow 6 step 3
  ("flag interim-section removal to owner") — that exact sentence was written only into Step 5's
  bullet list (for `project-profile.md`, a file the runtime agent never loads). When a step's
  `Satisfies:` tag names a Flow/BR, cross-check every numbered sub-step of that Flow against the
  step's own bullet list, not just against the plan as a whole — a requirement can be textually
  present *somewhere* in the plan yet absent from the one file that would actually execute it at
  runtime.
- **Two independent `general-purpose` finder passes with the identical prompt still surface
  different real findings** (Pass A found the Flow-6 orphaned-behavior gap; Pass B found the
  floor/destination self-contradiction; each missed what the other caught, and both independently
  converged on the same 2 staleness findings). Running two passes rather than one caught real HIGH
  issues a single pass would have missed — worth the extra round-trip on a prose-only diff where
  `/code-review` doesn't apply.
