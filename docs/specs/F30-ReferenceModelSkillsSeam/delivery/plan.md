# F30-ReferenceModelSkillsSeam — the reference-model→skills seeding seam (ADR-collapsed: plan is the definition)

**Feature Spec:** None — ADR-collapsed per F17/F20/F32 precedent. Definition = the backlog F30 row +
`omnishelf_flutter_app docs/proposals/refactoring-method-v2.md` §E3 (ratified 2026-07-20) + this
plan; durable record = ADR-69 (Step 3).

## Context

E3 formalizes the seam `mine-reference-model` R5 deliberately deferred ("a separate proposal if the
pilot proves the demand"): graded reference-model rows become `improve-skills` authoring inputs, so
pattern packs stop being a hand-rolled per-campaign cost (program doc §4 names "per-campaign cost"
verbatim; §5 precondition 4; F31 Flutter + F23 C++ are the waiting consumers).

**Owner decisions (2026-07-22, this session):** direct seeding pass into `improve-skills` — NOT the
skill-gaps-registry funnel (rows arrive already skeptic-verified + owner-elected; E3's ratified text
names `improve-skills` as the pipeline); F30 proceeds now — F18 is a prerequisite of the *packs*,
not the seam; review = code-grounded critic.

**Plan-time greps (2026-07-22, executed):**
- Absence-claim surfaces to flip: **3**, all in `plugins/nexus/skills/mine-reference-model/SKILL.md`
  (R5 bullet :150–152; "What this skill does NOT do" first bullet :206–208; relationship-table row
  :226). `"separate proposal"` = 3 hits in that file; `"not a consumer"` (-i) = **1** hit (line 226
  only — :150's `**Not** a consumer` is broken by the bold markers, so it never matched).
- New heading "Pattern-Pack Seeding": 0 collisions estate-wide.
- Same-topic-artifact check: the seam exists only as deferral records (`adhoc-MineReferenceModel`
  tech-spec — historical, stays untouched) + compatible consumer mentions (F27 tech-spec :89
  "pattern packs (F30/F31) seed from it"; program doc :199). No stale same-name proposal.
- Echo check: `plugins/nexus/README.md:31` mentions improve-skills only as a delivery-mechanism
  example — no capability enumeration, no edit owed. Agent files (learner/architect) route items to
  improve-skills; the new entry point changes no routing — no edit owed.
  **`docs/architecture/README.md:1294–1296` — ADR-50's Rejected bullet records this exact seam**
  ("Auto-generating project skills from the extracted patterns … separate proposal if demand proves
  out") — F30 *is* that proposal; reconciled as an explicit Step 3 edit (critic HIGH-5).

## Scope

**In:** the seeding entry point + input contract in `improve-skills`; the three-surface flip in
`mine-reference-model`; ADR-69; program-doc/backlog sync; MINOR release.
**Out:** any new promotion machinery (leg B stays the existing dev-repo carve-out — F23's
campaign-close fold pilots it); registry schema changes (`mine-skill-gaps` stays schema owner); F18
standards content; the pack authoring itself (F31/F23 consume this seam); edits to historical specs.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills | Follow | no | new §Pattern-Pack Seeding contract (inline below) | — |
| 2 | improve-skills | Follow | no | three-surface flip text (inline below) | — |
| 3 | (none) | — | no | ADR-69 content (inline below) | — (F24-class shipped-prose-edit recipe gap already registered on the backlog) |
| 4 | release-plugin | Follow | no | MINOR; program-doc + backlog sync | — |

**Branch pin (Steps 1–2):** `improve-skills` dev-repo carve-out, *fix-to-existing-shipped-skill*
branch — consolidating pass, net complexity flat or down, **lint alone is the done-condition**. The
New-Skill Judgment Gate does **not** apply to these edits (no new skill is created).

## Implementation Steps

### Step 1 — The seeding entry point (`plugins/nexus/skills/improve-skills/SKILL.md`)

Follow improve-skills (branch pinned above). Three edits:

1. **Caller count:** line 12 `Two callers, one process:` → `Three callers, one process:`; add
   caller 3: **Reference-model seeding** (the pack path) — a campaign/repo asks for pattern skills
   seeded from its mined estate; intake per §Pattern-Pack Seeding.
   **DO NOT TOUCH** `## Two Channels (ADR-1)` (line 17) — channels (shipped vs project-local) are a
   different axis than callers; the "Two" there stays.
2. **New section `## Pattern-Pack Seeding (Reference-Model Entry Point)`**, inserted after the
   `## Two Channels (ADR-1)` section (the intake contract precedes the authoring recipes it points
   to). Binding contract items (developer words the prose; each item must survive verbatim in
   substance):
   - **Inputs (fail-closed disclosure — a missing input is named in the pack report, never silently
     skipped):**
     - `docs/reference-model.md` rows with verdict **CONFIRMED** and portability **`portable` |
       `adapt`** (an `adapt` row seeds together with its translation note); `not-portable` and
       non-CONFIRMED rows never seed.
     - The ratified conventions charter (`docs/conventions/coding-conventions.md`, F27) **when
       present** — charter-elected patterns seed by disposition (F27's three-way vocabulary):
       `keep` and `aspire` rows seed; for a `replace` row the banned old idiom never seeds
       (`§ Banned`) and its **named successor** seeds via the reference-model channel when it
       appears there — a successor living only in the research pool is **disclosed as unseedable
       in the pack report**, never silently dropped. No charter → reference-model-only seeding,
       disclosed in the pack report.
     - `docs/skill-gaps/registry.md` `## Anti-patterns (do-not-propagate)` **when present** — kill
       filter: a candidate matching an anti-pattern row is dropped, citing the row id.
   - **Pack manifest checkpoint:** one batched owner confirmation before any authoring — per
     candidate skill: seed row ids, home (per §Two Channels), archetype (per
     `references/skill-recipe.md`). No authoring before the manifest is confirmed.
   - **Authoring = the existing recipes, unchanged** — project-local → §For New Project-Local
     Skills; shipped pack (dev-repo carve-out) → the New-Skill recipe **including** its Judgment
     Gate. This section adds no authoring rules (one owner; do not restate).
   - **Provenance:** each authored skill's changelog/backlog entry cites its seed row ids.
   - **Two legs:** campaign-side authoring is project-local first; promotion to a shipped pack rides
     the existing dev-repo carve-out at campaign close.
3. **Frontmatter `description:`** — append one trigger sentence so auto-invocation fires on pack
   requests, e.g.: "Also seeds pattern-pack skills from a repo's graded reference model + ratified
   charter (Pattern-Pack Seeding entry point)."

No F18 / backlog / dev-repo-doc citations in the shipped text (shipped text is self-contained; the
live bar — skill-recipe, proven-patterns, judgment gate — is already shipped-anchored).

**Acceptance (from plan-time counts):** in the file — `Pattern-Pack Seeding` ≥ 2 (heading +
description; 0 today); `Three callers` = 1, `Two callers` = 0; `## Two Channels` = 1 (unchanged);
`node {improve-skills}/scripts/skill-lint.mjs` exit 0 on the folder.
Satisfies: E3 clause "repeatable pipeline via improve-skills"; ADR-69 (Step 3).

### Step 2 — Flip the three deferral surfaces (`plugins/nexus/skills/mine-reference-model/SKILL.md`)

Follow improve-skills (same branch pin). Locate all three by grepping `improve-skills` in the file
at edit time — not by this plan's line numbers. Flip, keeping each surface's *boundary* intact (this
skill still never scaffolds skills):

1. **R5 consumption-seam bullet** (today :150–152): "Not a consumer" → consumer:
   `improve-skills` §Pattern-Pack Seeding — CONFIRMED `portable`/`adapt` rows (+ the ratified
   charter when present) seed pattern-skill authoring; the Entry-8 second stage, formalized (F30).
2. **"What this skill does NOT do" first bullet** (today :206–208): keep "does not generate or
   refresh skills from the mined patterns" — re-point the ownership sentence at `improve-skills`
   §Pattern-Pack Seeding; drop the "separate proposal if the pilot proves demand" clause.
3. **Relationship-table `improve-skills` row** (today :226): "NOT a consumer" → consumer, same
   substance as (1); scaffolding stays owned by improve-skills.

**DO NOT TOUCH** (same-text different-pair carve-outs): `mine-architecture/SKILL.md:220–221`,
`mine-oracle-strength/SKILL.md:318`, `mine-verify-flows/SKILL.md:157`,
`mine-verify-cover/references/mine-family-core.md:173`, and `mine-skill-gaps/SKILL.md:3`
(frontmatter — "evaluate-skill is a sibling diagnostic, not a consumer": about evaluate-skill, not
improve-skills) — their "not a consumer" claims are about other relationships.

**Acceptance (from plan-time counts, critic-corrected):** in mine-reference-model/SKILL.md —
`not a consumer` (-i) = 0 (1 today, line 226) and `separate proposal` = 0 (3 today);
`Pattern-Pack Seeding` ≥ 2 (the flipped surfaces point at the owner section); plugins-wide
`not a consumer` (-i) still hits exactly the **five** carve-out files above; skill-lint exit 0 on
the folder.
Satisfies: E3; mine-reference-model R5 deferral closure.

### Step 3 — ADR-69 (`docs/architecture/README.md`)

Skill: None (ADR-register authoring; compact section, ~14 lines). Three edits:
1. Contents row after the ADR-68 line: `ADR-69 — The reference-model→skills seam: graded rows seed
   improve-skills pattern-pack authoring (fulfills mine-reference-model R5's named deferral;
   reverses ADR-50's Rejected stage-2 entry) (Accepted — F30-ReferenceModelSkillsSeam, 2026-07-22)`.
2. Full section appended in register order — **Status block first, per ADR-67/68 precedent:**
   `> **Status: Accepted — F30-ReferenceModelSkillsSeam, 2026-07-22.** Register re-checked —
   highest written is ADR-68; ADR-66 is claimed by F15-SkillCandidateMiner (not yet written), so
   F30 takes 69, no renumber.` Then Context (R5 deferral; E3 ratified 2026-07-20; demand = the
   program's per-campaign pattern-pack cost, F31/F23 waiting; **explicitly names that this reverses
   ADR-50's Rejected "Auto-generating project skills…" entry — demand now proven, the very
   condition that entry set**) → Decision (direct seeding pass: CONFIRMED portable/adapt rows +
   charter three-way disposition filter + registry anti-pattern kill filter → improve-skills'
   existing authoring recipes, behind one batched pack-manifest owner checkpoint; no new promotion
   machinery — leg B rides the dev-repo carve-out) → Why (rows arrive twice-gated — skeptic +
   election; E3 names improve-skills as the pipeline) → Tradeoffs (bypasses the ADR-63 single
   funnel; accepted — a registry re-triage adds no information) → Rejected (registry-funnel route;
   a standalone seeding skill).
3. **ADR-50 reconciliation (critic HIGH-5):** in ADR-50's Rejected block (:1294–1296), append to
   the *"Auto-generating project skills from the extracted patterns"* clause: "— revisited and
   accepted, demand proven; see ADR-69." Nothing else in ADR-50 changes.

**Numbering guard:** ADR-66 is claimed-but-unwritten by F15 (README :1875, :1932) — the next free
number is **69**; never backfill 66.
**Acceptance:** `ADR-69` ≥ 3 in the README (contents row + section heading + the ADR-50 pointer;
0 today).
Satisfies: ADR-25 collapsed-definition obligation (the durable record).

### Step 4 — Program/backlog sync + release

Follow release-plugin. **MINOR** (new capability; F27 D5 + F32 precedent).
- `docs/programs/br-anchored-regeneration.md` — **re-read the cited lines in the same turn before
  editing (multi-session doc):** §7 build-queue line (today :199, "conventions pipeline → F30/F31")
  — mark F30 shipped (version); §4 capability-stack "Pattern packs" row — status cell gains
  "seeding seam shipped (F30)".
- `docs/backlog.md` F30 row → Done (version + sha; at the closure commit).
- CHANGELOG bullets: the seeding entry point + input contract; the three-surface R5 flip; ADR-69.
- Lint before bump: `node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"` green.
- Dry-run reasons must name **only** `improve-skills` + `mine-reference-model` files; if a reason
  names another feature's file (e.g. F27's in-flight tree), stop and hand the bump to the owning
  session (CLAUDE.md rule).
- No `gen-commands` (no agent files edited). `gen-omni` + commit belong to lane close, not this step.

## Testing Strategy

Lint suite (glob form) + skill-lint exit 0 on both edited folders + the pinned greps in Steps 1–3.
The seam's live validation is the first pack run (F31/F23) — deliberately out of scope; a PASS here
proves text + lint conformance only, not that a seeded pack authors well.

## KB Impact

None (dev-repo prose; no `docs/kb/` entries).

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| ADR-collapsed (plan-is-definition) + ADR-69 as the durable record | Two-way-door skill-text edits; F32/F17 precedent; the ADR gives the cross-skill contract a home | Full tech-spec (F27-scale ceremony for a two-skill edit) | decided |
| Leg-B promotion = thin pointer to the existing dev-repo carve-out | F23's campaign-close fold pilots it; formalize only if it hurts (mirrors R5's own deferral discipline) | New promotion recipe in v1 | decided |
| No F18 citation in shipped text | Shipped text is self-contained; the live authoring bar is already shipped-anchored; F18 strengthens it later without a dangling forward-cite | Forward-cite the F18 backlog row | decided |
| Historical specs untouched (`adhoc-MineReferenceModel` tech-spec keeps its "out of scope for v1") | Point-in-time records stay true; the register + live skills carry current truth | Retro-edit the old tech-spec | decided |
| New section placed after `## Two Channels` | The intake contract precedes the authoring recipes it points to | Trailing/appendix placement | decided |

## Open Questions

None.

## Plan Review

**Code-grounded critic (opus, 2026-07-22): GO-with-fixes — all findings folded.**
- HIGH-1 (5th `not a consumer` file missed — `mine-skill-gaps:3`): folded — DO-NOT-TOUCH list +
  Step 2 acceptance now say five files.
- HIGH-3 (charter filter silent on `replace`): folded — Step 1 contract states the three-way
  disposition incl. the named-successor path and the unseedable-disclosure rule.
- HIGH-5 (ADR-50's Rejected entry contradicted by ADR-69, echo-check ran on the wrong README):
  folded — Step 3 gains the ADR-50 reconciliation edit; Context echo-check corrected.
- MEDIUM-2 (in-file `not a consumer` baseline is 1, not 2 — bold markers break the match): folded.
- MEDIUM-4 (ADR-69 missing the ADR-67/68-style Status/numbering block): folded.
- Verified clean (not re-litigated): input-contract vocabulary matches R2/R3 exactly; self-mode
  portability collapse keeps the `portable|adapt` filter valid; description edit is lint-safe;
  section placement collision-free with resolving forward references.
- Root cause recorded: the plan's evidence block was executed at too-narrow scope (the echo-check
  skipped the very file Step 3 edits). Lesson logged to `lessons.md`.
