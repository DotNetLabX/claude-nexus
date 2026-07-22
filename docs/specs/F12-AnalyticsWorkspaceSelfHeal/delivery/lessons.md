# F12 — Workspace Self-Heal — Lessons

## Developer Lessons
- **skill-lint E9 colon-space gotcha when authoring a SKILL.md `description`.** The lint rejects a
  `: ` (colon-followed-by-whitespace) inside an unquoted frontmatter scalar (strict YAML reads it as
  a nested mapping). Authored the new `workspace-self-heal` description with em-dashes instead of
  colons, and when quoting `"assumed:"` inside `answer-qa`'s description the colon is followed by the
  closing quote (not a space), so it passes. Practical rule: no bare `key: value` shapes in a
  one-line description — use em-dashes/commas, or the value trips `claude plugin validate --strict`.
- **Two parallel `general-purpose` finder passes are the right first-round review for a docs/prose
  diff.** Splitting the angles (Finder A = counts/cross-refs/directional; Finder B = dropped/narrowed
  guarantees BR-by-BR + stale adjacent sentences) caught the one real risk cheaply — the *generated*
  `commands/*.md` staleness — and confirmed the enumeration sweep (four→five, six→seven) was complete.
  For an enumeration-heavy prose feature, an explicit "no stale count survives" grep per changed
  count is worth running before the finders, not after.
- **A spec's `**Plan:** None → path` line can appear as working-tree dirt the developer didn't
  create.** The architect's plan-creation step edits the spec's Plan pointer; a `Read` of the spec is
  non-mutating, so an unexpected `M spec.md` in the F12 dirty set was architect-owned, not mine. Left
  as-is (developer never edits a spec; no git writes) and documented it in implementation.md so the
  done-check wouldn't misattribute it. Worth a quick `git diff` on any surprising dirty file before
  reporting, to attribute rather than assume.

## Architect Lessons

- **The testable acceptance criterion is the tiebreaker for an internally-ambiguous spec.** F12's
  spec defined workspace "protection" as a conjunction (Entities: "contents ignored AND README
  tracked") while every warning-purpose statement (Purpose, BR4, Flow-3) framed the one warning as
  the pull-conflict risk (contents-not-ignored only). The code-grounded critic correctly flagged that
  the plan (D3) had resolved this **silently**. Resolution: investigate rather than pick cold, and
  weight **AC-3, the one *testable* criterion**, heavily — it names exactly "the pull-conflict risk,"
  which (with the proposal's Need + the "never falsely warned" clause forbidding a pull-warning on a
  pull-safe repo) put confidence HIGH on contents-not-ignored. Lesson: when a spec's descriptive prose
  and its acceptance criteria pull different ways, the AC is ground truth — and a silent narrowing is
  a review finding even when the narrowing is right. Make it loud (D3 rewritten + D6 split out).

- **F24 (`edit-shipped-plugin-skill`) is corroborated again — the enumeration-sweep ripple recurred
  exactly as F11 documented it.** Adding a 5th preloaded skill + a 7th `answer-qa` obligation went
  stale on four hardcoded enumerations (`data-analyst.md` "four sibling skills", its answer-contract
  body + frontmatter description; `answer-qa`'s "All six items" + malformed clause + description). The
  critic caught the sweep the plan under-scoped; F11's own `implementation.md:176-182` had recorded
  the identical ripple. The developer's `## Developer Lessons` E9 colon-space gotcha is a *second*
  F24-shaped datum (authoring-a-shipped-skill mechanics the recipe should encode). Clean recurrence
  signal for the learner: **F24 should land before F19/F21/F22** — its "adjacent-surface staleness"
  fires on every add-a-preloaded-skill / add-a-contract-item change in this plugin. (Not logged as a
  new `## Skill Gaps` entry — the gap is already promoted to the F24 backlog row; this is corroboration
  of an existing bet, not a new one.)

- **A fast-lane subagent can die mid-artifact — verify the on-disk state before re-dispatching.** The
  developer's first run terminated on an API stall while *finalizing* `implementation.md`; the three
  source edits had already landed correctly (confirmed by reading the files + re-running skill-lint +
  the sweep greps myself), only the artifact was truncated. Recovery was to **resume the same developer
  to complete just the artifact** — not re-implement, not re-spawn fresh. On a `failed` fast-lane
  developer: `git status` + read the target files + read the (possibly partial) `implementation.md`
  first; the substantive work is often complete and only the write-up needs finishing, and a
  `SendMessage` resume preserves the agent's context (incl. its finder findings).
