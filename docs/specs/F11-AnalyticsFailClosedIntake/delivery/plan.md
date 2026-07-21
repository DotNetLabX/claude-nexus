# F11 — Fail-Closed Intake (Mandatory Clarification)

**Feature Spec:** `docs/specs/F11-AnalyticsFailClosedIntake/definition/spec.md` (Status: Ready)
**Slug:** `F11-AnalyticsFailClosedIntake`
**Intent class:** Scoped (1 agent + 3 skills edited + 1 new skill + 1 profile-template doc; single
`nexus-analytics` release). No consuming-app code — all agent/skill prose in the plugin.
**Release tier:** **MINOR** recommended (new `fail-closed-intake` skill + a new fail-closed capability
= new capability, not a fix). `bump-plugin.mjs` proposes PATCH by default; the **owner escalates** to
MINOR at release (CLAUDE.md release policy). Confirm at Step 6.

## Context

The `nexus-analytics` data-analyst agent already batches its interview, delegates the answer contract
to `answer-qa`, and routes navigation through `semantic-model-query`'s resolution ladder. F11 **hardens
that existing intake** — it does not build a new one. It makes the intake *fail-closed* (no query while
a mandatory input is unresolved), adds a declaration-precedence engine (model → profile → floor,
resolved per item), per-measure must-specify flags, a per-user defaults record with legacy migration,
and the rule that every applied default is named in the shipped answer.

**Collision check (reading-protocol item 1):** grepped `FailClosedIntake` / `fail-closed` / `F11` across
`docs/proposals/`, `docs/specs/`, `docs/backlog.md` — the only hits are this spec, its two sibling specs
(F12/F13), the parent proposal `2026-07-18-nexus-analytics-am-lane.md`, and the backlog row. No stale or
superseding same-name artifact. (Unrelated `F11` string hits in a 2026-06 evidence doc and an old
plugin-feedback file are a different feature-numbering context, not this feature.)

**Current-state anchors (grep-verified at plan time, 2026-07-21):**
- `agents/data-analyst.md` — `## Batched-Interview Intake` exists (thin; asks date range, destination,
  profile-declared identifiers, never re-asks a persisted default). Preloads
  `semantic-model-query, data-investigation, answer-qa` via `skills:` frontmatter.
- `skills/semantic-model-query/SKILL.md` — `## The resolution ladder` (grain→table, metric→column,
  dimension→join) and `## Mandatory-obligation pre-query check` (3-item; **BR9 row-quality exclusions
  already implemented** as always-on/never-asked/always-named). **Gap: no branch for an unresolvable
  *grain-within-profile*** — only a missing *profile* is handled.
- `skills/answer-qa/SKILL.md` — `## The answer contract` is an enumerated **5-item** numbered list
  (grain, filters, date range, constructs, data caveats) + a `## Malformed answers` section. Clean append
  point for a 6th obligation.
- `skills/mine-semantic-model/references/project-profile.md` — flat numbered-input template; **no**
  existing must-specify/interview section (greenfield for the declaration shape).
- No per-user defaults file or `my-workspace/` persistence exists anywhere in the plugin (greenfield).

### The declaration schema (owner-approved 2026-07-21; authoritative source = the semantic model)

The authoritative source is the **semantic model** (spec precedence layer 1) — the profile is only the
**interim bridge** (layer 2) for what the model doesn't yet declare, using the *identical* shape so the
bridge→model switch is a pure data move (BR12). The plugin ships the **shape** only, with neutral
placeholders — never a product's real inputs (BR6). Authoritative home of the shape: the
`fail-closed-intake` skill; the profile template and (out of scope here) the KG model lane reference it.

**Normalized one-shape schema** — one input dictionary, referenced by both a question-level list and each
measure's flags, so "one shape" is literally true and the per-measure half has the same field breakdown
as the question-level half (resolving critic HIGH-1 + mine-from-spec SF-1, both of which flagged the
earlier `measure_flags`-map-vs-inline-`must_specify` divergence). Identical in the model bundle and the
profile bridge:

```yaml
inputs:                                  # the declared-input dictionary — every input's fields, defined once
  <input_id>:
    ask: "<question wording>"
    examples: ["<optional>"]
    policy: must_ask | documented_default | persistable_per_user_default
    default: { value: "<v>", wording: "<w>" }   # documented_default only; relative dates data-anchored (BR8)
    legacy_source: "<path>"              # persistable_per_user_default only, OPTIONAL — where a legacy value migrates from (BR6)
question_level: [<input_id>, ...]        # inputs mandatory on EVERY question
measures:
  - name: <measure_name>
    must_specify: [<input_id>, ...]      # inputs mandatory ONLY when this measure is in the question
```

Precedence is resolved **per `id` / per measure**: the model's entry supersedes the profile's for that
item; profile entries the model doesn't declare stay in force; each bridge entry retires as its model
counterpart lands, with no window where a mandatory input lapses (BR5, Flow 6). The **floor** (`grain`,
resolved via the ladder and never a user-interview item; `date_range`, a real user input) and the
**output destination** are **plugin-native** — never in this declaration. A relative-date documented
default resolves against the data's latest available date (BR8), not today's.

Design notes the review should weigh:
- **`legacy_source` is a *declared* field** (D2) — how the agnostic plugin locates the legacy value
  without shipping product knowledge, resolving the BR6-vs-Flow-5 tension; `mine-from-spec` SF-3
  independently recommended exactly this.
- **`must_specify` references dictionary ids** — a measure's flags name inputs already declared in
  `inputs`, so their ask/policy is defined once, never duplicated per measure.
- **Neutral placeholders only** — the product-flavored values (`retail_chain`, `out_of_stock_rate`) I
  showed earlier were a bad example; no product input appears in any plugin artifact (BR6).

## Scope

**In scope:** the fail-closed intake behavior across the data-analyst agent + `semantic-model-query`,
`answer-qa`; the new `fail-closed-intake` skill owning the declaration/precedence/defaults-record/
migration logic; the interim-bridge declaration doc in the profile template; one `nexus-analytics`
release (bump + regen + twin).

**Explicitly out of scope:**
- **The must-specify classification pass** (which measures flag which inputs) — model content, KG's lane
  (spec Out of Scope). F11 defines the *shape* the model will carry and *reads* it; it does not emit it.
- **Retiring the consuming repo's interview rule + legacy config helper** — a product-repo work item
  (spec Dependencies). F11 ships the plugin behavior that makes retirement safe; it adds **no** activation
  guard — the double-owner window is closed product-side, not in the plugin.
- **`my-workspace/` structure/self-heal, ignore-entry warnings, export defaults** — F12. F11 only
  create-if-missing the folders its defaults record needs (F12 spec confirms the overlap is intentional
  and safe; F11 owns its record's path).
- **Saved prompts / usage capture** — F13 / F14.
- **Any write into the semantic model or profile** — parent-proposal binding exclusion; the intake writes
  only the per-user defaults record (BR10).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | New skill `fail-closed-intake`; the declaration schema above; defaults-record path/format; the 12 BRs' behavior; sibling-skill structure to mirror | — (new plugin skill; born-compliant via skill-lint. No generative skill authors *this* content — same disposition as F6/F20 plugin-prose) |
| 2 | (none) | — | no | `data-analyst.md` intake section rewrite; add `fail-closed-intake` to `skills:` frontmatter | — (agent-prose edit) |
| 3 | (none) | — | no | `semantic-model-query` grain-floor branch; business-language grain wording | — (skill-prose edit) |
| 4 | (none) | — | no | `answer-qa` obligation #6 (default-naming); malformed-answer clause | — (skill-prose edit) |
| 5 | (none) | — | no | profile-template intake-declaration section; pointer to the skill's schema | — (skill-prose edit) |
| 6 | release-plugin | Follow | no | nexus-analytics MINOR (owner-confirmed); `gen-commands nexus-analytics` (frontmatter changed); `gen-omni` after bump | |

All of Steps 1–5 are honestly `Skill: None` — plugin agent/skill **prose** with no generative pattern
skill (identical posture to F6-MineMachineryHardening and F20-ProcessSkillQuickWins). `Skill: None` never
waives TDD; every step here is `TDD: no` because the diff is prose with **no executable behavior to
red-green** — the gates are executed acceptance greps + the shipped skill-lint, not a unit suite (F20
precedent: "prose-only diff — the gates are the greps + skill-lint; no unit-test surface").

## Domain Model Changes

None (no consuming-app domain model — plugin agent/skill prose + one persistence file the plugin writes).

## Data Model Changes

One plugin-written file, not a database: the **per-user defaults record** at
`my-workspace/analyst-defaults.json` — a flat JSON map of input `id` → persisted value (e.g.
`{ "retail_chain": "Chain A" }`). Created with any missing parent folders on first persist; a record that
cannot be read is treated as absent (re-ask + rewrite); concurrent sessions are last-writer-wins (BR10).
Never version-controlled, never the model/profile/ignore file.

## Implementation Steps

### Step 1 — Author the new `fail-closed-intake` skill

`Satisfies: BR1, BR2, BR4, BR5, BR6, BR7, BR8, BR10, BR11, BR12` (and Flows 2–6; AC-1,2,4,5,7,8,9,10).

Create `plugins/nexus-analytics/skills/fail-closed-intake/SKILL.md`. This is the home for everything the
existing agent/skills don't already own. Mirror the shape and length of the sibling skills
`semantic-model-query/SKILL.md` and `answer-qa/SKILL.md` (frontmatter + short `##` sections + a
`## What this skill does NOT do` + `## References`). Match the siblings' frontmatter fields (including a
`user-invocable` flag if they carry one); the skill is born-compliant via the skill-lint gate (ADR-23) in
this step's acceptance — no other authoring-standard citation (F18 is unshipped and stack-scoped, N/A here).

The skill must specify, as prose the analyst agent follows (describe the behavior + the contract; do
**not** write pseudo-code):
- **The declaration schema** — the concrete shape in Context above, as the authoritative contract
  (question-level inputs with `id`/`ask`/`examples`/`policy`/`default`/`legacy_source`; per-measure
  `must_specify` flags). This is the one shipped file that *defines* the shape; every other surface points
  here.
- **Precedence resolution (BR5)** — per `id` and per measure: model entry supersedes profile entry;
  profile entries the model doesn't declare stay in force; no window where a mandatory input stops being
  mandatory.
- **Mandatory-set resolution (BR7)** — the union of question-level inputs and the `must_specify` flags of
  every measure the question touches; a flag-less measure adds nothing.
- **The fail-closed gate (BR1)** — no query runs while any mandatory input is unresolved (not in the
  question wording, no persisted default, no documented default whose policy allows applying it).
  Declining or being unable to answer keeps the query blocked and restates which inputs are still needed
  — there is no run-anyway path and no fallback guess.
- **One batch (BR2)** — all missing mandatory inputs asked in one message; nothing asked twice.
- **The per-user defaults record (BR4, BR10, BR11)** — path `my-workspace/analyst-defaults.json`; JSON
  `id`→value; create file + missing parents on first persist; a persisted default is read back and
  confirmed inline, never re-asked; the user can change it by saying so (persisted); an unreadable record
  is treated as absent (re-ask + rewrite); last-writer-wins; a persisted default is UX only, never access
  control.
- **Legacy migration (BR6, Flow 5)** — per input: when the record lacks a `persistable_per_user_default`
  input for which the declared `legacy_source` file holds a value, port that value into the record and
  confirm it inline ("Using default {input}: {value} — migrated from your previous setting"); the legacy
  file is never written.
- **The plugin-native floor + destination (BR6)** — `grain` (resolved via the ladder; the *ask*, when the
  ladder can't establish it, is a business-language clarification — see Step 3 for the trigger) and
  `date_range` are always resolved regardless of the declaration; the **output destination** is always
  resolved (conversation, or spreadsheet link + tab), but a destination already given in the question
  wording is not re-asked. These are the only plugin-native intake items — the plugin ships no
  product-specific input.
- **Data-anchored relative dates (BR8)** — when applying a documented default that is a relative range
  ("last 30 days"), resolve it against the data's *latest available date*, never today's real-world date,
  and hand the resolved concrete range to the answer's "assumed:" line (Step 4). Same restatement
  treatment BR9 gets in Step 3 — an obligation the intake boundary must state explicitly, not assume.
- **The persistence boundary (BR10, AC-10)** — the per-user defaults record is the ONLY file the intake
  ever writes: never a version-controlled file, never the repository's ignore file, never the semantic
  model or profile. A failed *persist* (permissions/disk) falls back to re-asking — defaults are UX-only,
  so a write failure never blocks an answer (mirrors the unreadable-read = absent policy).

Acceptance (mechanisms):
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-analytics/skills/fail-closed-intake`
  exits 0 (born-compliant, ADR-23).
- `grep -n` in the new SKILL.md finds: the fail-closed no-run-while-unresolved rule; "no run-anyway";
  the per-item precedence rule; the path `my-workspace/analyst-defaults.json`; the `legacy_source`
  field; the "destination … not re-asked" relaxation; the business-language-grain deferral to Step 3;
  the data-anchored "latest available date" resolution (BR8); the persistence-boundary "never
  version-controlled" clause (BR10/AC-10).

### Step 2 — Rewrite the data-analyst intake to delegate + preload the skill

`Satisfies: BR1, BR2` (Flow 1, Flow 2).

`plugins/nexus-analytics/agents/data-analyst.md`:
- Add `fail-closed-intake` to the `skills:` frontmatter (preload — the intake runs before every query, so
  it must be guaranteed-present like `semantic-model-query`/`answer-qa`).
- Rewrite `## Batched-Interview Intake` to run `fail-closed-intake` before any query and **fail closed**;
  keep the one-message-batching and never-re-ask-a-persisted-default rules but cite the skill as their
  owner rather than restating the mechanics.
- Update `## Sibling Skills` (add the fail-closed-intake one-liner) and `## What You Never Do` (add: never
  run a query while a mandatory input is unresolved → instead resolve through fail-closed-intake).
- Binding: the agent name `data-analyst` and its command route are unchanged.

Acceptance: `grep` the frontmatter `skills:` line includes `fail-closed-intake`; the intake section names
`fail-closed-intake` and the fail-closed rule; `## What You Never Do` carries the new never-run line.

### Step 3 — Add the grain-floor branch to `semantic-model-query`

`Satisfies: AC-6, BR9` (the floor's grain arm).

`plugins/nexus-analytics/skills/semantic-model-query/SKILL.md`, in `## The resolution ladder`: state that
when the `grain → table` lookup resolves nothing — that lookup-miss **is** the "cannot establish grain"
signal (resolving mine-from-spec finding SF-2, which noted the spec delegates this trigger to the ladder
without defining it) — the query does **not** proceed on a guessed grain; the intake asks a
business-language clarification ("per store, or per SKU?"), never a technical "what grain?" prompt; grain is otherwise resolved from the question's wording via the ladder and is never a
user-interview item. Note this is the fail-closed floor's grain arm — `fail-closed-intake` owns the ask;
this skill owns the "unresolved grain → signal, don't guess" trigger. Add a one-line cross-reference that
the existing `## Mandatory-obligation pre-query check` row-quality exclusions (BR9) are **always applied,
never asked about, always named** — restated as an intake non-question (no behavior change; the obligation
already exists here).

Acceptance: `grep` the ladder section for the unresolved-grain branch, the "per store, or per SKU"
wording, and a "never" technical-grain-prompt clause; confirm the bad-reports pre-query obligation is
cross-referenced as never-asked.

### Step 4 — Extend the `answer-qa` contract with default-naming (obligation #6)

`Satisfies: BR3, AC-3, AC-11` (AC-3 = the "assumed:" line names the data-anchored range resolved in Step 1;
AC-11 = the default-naming gate; the earlier `AC-10` tag here was a mislabel — real AC-10 is the
persistence boundary, now tagged at Step 1).

`plugins/nexus-analytics/skills/answer-qa/SKILL.md`:
- Append a **6th** item to `## The answer contract`: **Applied defaults** — every persisted default named
  inline ("Using default {input}: {value}"); every documented default named as an "assumed: {input} =
  {value}" line (dates data-anchored, BR8).
- Extend `## Malformed answers`: an answer that applied any default (persisted or documented) without its
  inline confirmation / "assumed:" line is malformed and is fixed before shipping — **including a default
  that maps to none of items 1–5**.

Acceptance: `grep` the contract for a 6th numbered obligation naming defaults; `grep` for `assumed:` and
`Using default`; `grep` `## Malformed answers` for the default-without-naming clause.

### Step 5 — Document the interim-bridge declaration in the profile template

`Satisfies: BR5, BR12, AC-4, AC-5` (Flow 6).

`plugins/nexus-analytics/skills/mine-semantic-model/references/project-profile.md`: add a section
describing the **intake declaration** a consumer's `docs/semantic-model/profile.md` may carry (the interim
bridge) — its `## Intake declaration` block, that per-measure flags mirror the model's `must_specify`, and
the per-item precedence rule (a model-carried counterpart supersedes a profile entry item by item; the
interim section's removal is flagged to the owner, not auto-edited, once every entry is shadowed).
**Point at `fail-closed-intake`'s authoritative schema — do not restate it** (self-contained-shipped-text
rule: one definition, referenced here).

Acceptance: `grep` the profile template for the new intake-declaration section and a pointer to
`fail-closed-intake` (and *not* a duplicated schema block).

### Step 6 — Release: bump + regen + twin

`Satisfies:` dev-repo release machinery (ADR-9).

Follow `release-plugin`. Because `data-analyst.md` frontmatter changed, run
`node scripts/gen-commands.mjs nexus-analytics` (regenerate the persona command). Tier: **nexus-analytics
MINOR** — confirm with the owner (the bump tool proposes PATCH; the owner escalates for the new
capability). After the bump, run `node scripts/gen-omni.mjs` so the twin's versions ride along; commit the
omni twin in `../omni` with the mirrored subject per CLAUDE.md. Bump + CHANGELOG + regenerated command ride
in the **same** feature commit.

Acceptance: `plugins/nexus-analytics/.claude-plugin/plugin.json` `version` bumped (MINOR);
`plugins/nexus-analytics/CHANGELOG.md` has the entry; `plugins/nexus-analytics/commands/data-analyst.md`
regenerated to match the new frontmatter; `claude plugin validate plugins/nexus-analytics --strict` clean.

## Cross-Service Changes

N/A — conversational intake behavior; no HTTP/gRPC/event surface (spec API Surface = N/A).

## Migration Notes

No database migration. The **legacy-default migration** (Flow 5) is runtime behavior owned by the
`fail-closed-intake` skill (Step 1), not a schema change: per input, port a declared `legacy_source`
value into the defaults record and confirm inline; never write the legacy file. Its removal is the
product-repo retirement work item (out of scope).

## Testing Strategy

Prose-only diff — no runtime code, so **no unit-test surface** (F20 precedent). The gates are the executed
acceptance greps per step + the shipped skill-lint on the new skill dir + `claude plugin validate
--strict`. Behavioral coverage of the 11 acceptance criteria is a **live analyst-session concern in the
consuming repo** (omnishelf-analytics), not a plugin unit test — the plugin ships the behavior; the
consumer exercises it. Flag this in `implementation.md` so the done-check reads AC coverage as
consumer-side, not a missing plugin test.

## KB Impact

None. This edits plugin skill/agent prose, not a consuming project's `docs/kb/`. (The one doc F11 writes —
the profile-template intake-declaration section, Step 5 — is a plugin reference file, already a numbered
step, not a trailing KB task.)

## Decisions

| # | Decision | Why | Rejected alternative | Status |
|---|----------|-----|----------------------|--------|
| D1 | The declaration/precedence/defaults/migration logic lives in a **new `fail-closed-intake` skill** preloaded onto data-analyst, not folded into the agent section | Skill-sized, reused-conceptually logic; matches the established delegation pattern (semantic-model-query, answer-qa are skills the agent points to) and the allocation principle (cheapest correct locus that can't decay) | Fold it all into the agent's `## Batched-Interview Intake` prose — bloats the agent, breaks the delegation pattern, no single home for the KG-facing schema | decided |
| D2 | `legacy_source` is a **declared field** in the schema (profile/model tell the plugin where the legacy value is) | Keeps the plugin agnostic (BR6) while enabling Flow-5 migration — resolves the BR6-vs-Flow-5 tension without hardcoding `chain` | Hardcode the legacy chain-file path in the skill — violates BR6 plugin input-agnosticism | decided |
| D3 | Defaults record = JSON at `my-workspace/analyst-defaults.json` | Simple id→value map; F12 leaves F11's record path to F11 (confirmed no conflict); JSON is trivially create/read/rewrite for an unreadable=absent policy | A dotfile / a per-input directory / an INI — no benefit over one JSON map | decided |
| D4 | Recommend **MINOR** release tier | New skill + new fail-closed capability is a new capability, not a fix | PATCH (the tool default) — undersells a new capability; owner confirms at Step 6 | deferred (owner confirms) |
| D5 | The declaration is **one `inputs` dictionary** + a `question_level` list + per-measure `must_specify` id-references, identical in the model bundle and the profile bridge | Makes BR12 "one shape" literally true (same field name + topology in both flavors) and defines the per-measure field breakdown once — resolving critic HIGH-1 + mine-from-spec SF-1 | Two divergent flavors (a `measure_flags` map vs. inline `must_specify`) — the exact BR12 defect both reviews flagged | decided (owner-approved 2026-07-21) |

## Open Questions

None open. **Q-A resolved** — keep the interim bridge (owner, 2026-07-21): F11 ships independent of KG's
must-specify timeline; each profile entry auto-retires per-item as the model lands it. **Q-B resolved** —
the normalized one-shape `inputs`-dictionary schema is owner-approved (2026-07-21). The MINOR release tier
(D4) is owner-confirmed at Step 6.

Resolved by the reviews: SF-3 legacy-file locate → D2 (`legacy_source` declared field); SF-1 / critic
HIGH-1 per-measure shape divergence → D5 (one `inputs` dictionary); SF-2 grain-ladder trigger → Step 3 (a
`grain → table` lookup-miss is the signal); critic write-failure LOW → Step 1 persistence bullet.

## Plan Review

**Critic (code-grounded, Mode 2) — verdict REVISE → all findings folded.**

| Finding | Sev | Disposition |
|---------|-----|-------------|
| HIGH-1 — BR12 per-measure shape divergence (`measure_flags` map vs inline `must_specify`) | HIGH | Fixed — D5 normalized one `inputs` dictionary (schema block) |
| HIGH-2 — AC-10/AC-11 `Satisfies` mislabel; real AC-10 untagged | HIGH | Fixed — Step 4 → AC-11; AC-10 tagged at Step 1 + grep added |
| HIGH-3 — BR8 data-anchored dates unowned by any step | HIGH | Fixed — Step 1 BR8 bullet + grep; AC-3 tagged at Step 4 |
| MED-4 — F18 citation (unshipped, stack-scoped) | MED | Fixed — dropped from Step 1; born-compliant via skill-lint only |
| MED-5 — AC-10 negative constraint absent from Step 1 checklist/grep | MED | Fixed — Step 1 persistence-boundary bullet + grep |
| LOW — defaults-record write-failure undefined | LOW | Fixed — Step 1 persistence bullet (re-ask fallback) |
| LOW — `user-invocable` frontmatter mirror | LOW | Fixed — Step 1 "match siblings' frontmatter fields" |
| Code-grounded confirmations (grain-branch gap real; BR9 already present; answer-qa 5-item list; skill-lint path; sibling shapes; data-analyst headings; profile greenfield) | — | No change needed |

BR1-enforceability scrutiny: no defect — the plan is honest that a prose feature has no runtime backstop
(Testing Strategy), which is the ceiling for prose enforcement; the residual risk is disclosed, not hidden.

**mine-from-spec (spec-text mine) — 3 blind miners → 36 consensus rules, 33 verified / 3 ambiguous;
`definition/spec-rules.md` written (`sha256:6b21518f3f61`, 2026-07-21).**
- SR-12 / SF-1 (BR12 per-measure half unverifiable) → resolved by D5.
- SR-34 / SF-2 (grain-ladder trigger undefined in spec) → resolved by Step 3.
- SR-35 / SF-3 (legacy-file locate vs BR6) → resolved by D2.

The three spec findings are **spec gaps the plan closes at plan level** — none block proceeding. SF-1's
per-measure serialization is precisely the schema owner-review item (Q-B); if the owner wants the spec
itself amended to carry the resolved shape, that is a PO follow-up, not a plan blocker.
