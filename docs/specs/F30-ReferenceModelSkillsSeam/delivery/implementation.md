# F30-ReferenceModelSkillsSeam — Implementation

The reference-model→skills seeding seam: graded `reference-model.md` rows become `improve-skills`
pattern-pack authoring inputs; the three deferral surfaces in `mine-reference-model` flip from
"not a consumer" to consumer; ADR-69 records the durable decision; program-doc/backlog sync + MINOR
release.

## Files Modified

- `plugins/nexus/skills/improve-skills/SKILL.md` (Step 1) — three edits, all consolidating into
  existing structure:
  1. `## Entry Points`: `Two callers, one process:` → `Three callers, one process:`; added caller 3
     **Reference-model seeding** (the pack path), pointing at §Pattern-Pack Seeding for intake and
     the existing recipes/gates for authoring. `## Two Channels (ADR-1)` left untouched (channels
     vs callers is a different axis — plan explicit).
  2. New section `## Pattern-Pack Seeding (Reference-Model Entry Point)` inserted after
     `## Two Channels (ADR-1)` (the intake contract precedes the authoring recipes it points to).
     Covers the fail-closed input contract (CONFIRMED `portable`/`adapt` reference-model rows;
     F27 charter three-way disposition incl. the `replace` named-successor + unseedable-disclosure
     path; registry anti-pattern kill filter), the one batched pack-manifest owner checkpoint,
     authoring-routes-to-existing-recipes (adds no authoring rules — one owner), seed-row-id
     provenance, and the two-leg promotion note. No F18/backlog/dev-repo-doc citation (shipped text
     self-contained).
  3. Frontmatter `description:` — appended one auto-invocation trigger sentence for pack requests.

- `plugins/nexus/skills/mine-reference-model/SKILL.md` (Step 2) — flipped the three deferral
  surfaces from "not a consumer" to consumer, each keeping its boundary (this skill still never
  scaffolds skills; `improve-skills` owns scaffolding):
  1. **R5 consumption-seam bullet** (was `**Not** a consumer`) → a positive seam bullet:
     `improve-skills` §Pattern-Pack Seeding consumes CONFIRMED `portable`/`adapt` rows (+ the
     ratified charter when present); the Entry-8 second stage, formalized (F30).
  2. **"What this skill does NOT do" first bullet** — kept "does not generate/refresh skills from
     the mined patterns"; re-pointed the ownership sentence at `improve-skills` §Pattern-Pack
     Seeding; dropped the "separate proposal if the pilot proves demand" clause.
  3. **Relationship-table `improve-skills` row** (was `**NOT a consumer**`) → **Consumer** (F30),
     same substance as (1); scaffolding stays owned by `improve-skills`.

- `docs/architecture/README.md` (Step 3) — ADR-69, three edits:
  1. **Contents row** after the ADR-68 line (now :86) — `ADR-69 — The reference-model→skills seam…
     (fulfills mine-reference-model R5's named deferral; reverses ADR-50's Rejected stage-2 entry)`.
  2. **Full ADR-69 section** (now :1990) appended in register order, after ADR-68's closing `---`
     and before `## Inherited pipeline decisions`. Status block first (ADR-67/68 precedent) with the
     register re-check + numbering note (highest written ADR-68; ADR-66 claimed-unwritten by F15 →
     F30 takes 69). Then Context (R5 deferral; E3 ratified 2026-07-20; demand = program §4
     per-campaign pack cost, F31/F23 waiting; **explicitly names the ADR-50 reversal**) → Decision
     (direct seeding pass; charter three-way + registry kill filter → existing recipes; one batched
     manifest checkpoint; leg B rides the dev-repo carve-out) → Why (twice-gated rows; E3 names the
     pipeline) → Tradeoffs (bypasses the ADR-63 single funnel; accepted) → Rejected (registry-funnel
     route; standalone seeding skill).
  3. **ADR-50 reconciliation** (critic HIGH-5) — appended to ADR-50's Rejected *"Auto-generating
     project skills…"* clause (:1297): "— revisited and accepted, demand proven; see ADR-69."
     Nothing else in ADR-50 changed. Cross-refs verified resolvable: ADR-63 (mine-skill-gaps funnel),
     ADR-50, program §4 Pattern-packs row all exist.

- `plugins/nexus/.claude-plugin/plugin.json` (Step 4) — version 1.44.1 → **1.45.0** (MINOR, owner-directed
  new capability). Applied via `node scripts/bump-plugin.mjs --minor` after all Step 1–3 edits landed
  (one bump, whole-tree classification). Dry-run reasons named **only** `improve-skills` +
  `mine-reference-model` skill changes — no F27 file, no docs (rule-2 clean).
- `plugins/nexus/CHANGELOG.md` (Step 4) — replaced the generated `[1.45.0]` stub with the real entry:
  the §Pattern-Pack Seeding entry point + input contract, the three-surface R5 flip, ADR-69. Reworded
  the flip bullet to "previously marked non-consumer" (not the literal `"not a consumer"`) so the
  CHANGELOG does not pollute the plan's plugins-wide `not a consumer` estate-invariant grep.
- `docs/programs/br-anchored-regeneration.md` (Step 4) — §7 build-queue line: `F30/F31` → `F30 shipped
  (nexus 1.45.0 — the reference-model→skills seeding seam) → F31 next`. §4 capability-stack "Pattern
  packs" status cell gains "seeding seam shipped (F30, nexus 1.45.0)". Both cited lines re-read in the
  same turn before editing (multi-session doc).
- `docs/backlog.md` (Step 4) — F30 row → **Done (shipped 2026-07-22, nexus 1.45.0, sha at lane close)**;
  plan-link column filled with the ADR-collapsed plan path (matches sibling ADR-collapsed Done rows).

## Key Decisions

- In-file section references written as `§Pattern-Pack Seeding` / `§Two Channels` / `§For New
  Project-Local Skills` (bare `§Name`, no markdown anchor link) to match the file's existing
  directional-reference convention (`(below)`, `§frontmatter cheat-sheet`) — no anchor-link style
  exists in this file to match, and bare `§` is unambiguous given the sections are all present.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | improve-skills | Dev-repo carve-out, fix-to-existing-shipped-skill branch; consolidating pass, lint alone is the done-condition (New-Skill Judgment Gate N/A — no new skill). Invoked via Skill tool before Step-1 code. |
| 2 | improve-skills | Same branch pin; re-invoked via Skill tool before Step-2 code (invocation log distinguishes invoked from remembered). Lint exit 0 on the folder. |
| 3 | None | Plan maps `Skill: None` (ADR-register authoring); TDD no. Conventions re-derived from ADR-67/68 Status-block precedent (as the plan directs). |
| 4 | release-plugin | Invoked via Skill tool before Step-4 work. Dry-run → checked reasons (rule 2) → `--minor` apply → CHANGELOG rewrite. No gen-commands (no agent files), no gen-omni/commit (lane close). |

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Backlog sha owed at lane close | low | team-lead | `docs/backlog.md` F30 row: "sha at lane close" | The Done row carries version 1.45.0 but the closure-commit sha is a placeholder — the lane-close session must replace "sha at lane close" with the real commit sha (a commit cannot self-reference). |
| gen-omni + commit owed at lane close | low | team-lead | plan Step 4 | Per plan: no `gen-omni`, no commit in this dispatch — both belong to lane close, along with the omni twin sync. |

## Deviations from Plan

- **CHANGELOG wording adjusted to protect an estate invariant (self-caught, self-review).** My first
  CHANGELOG draft quoted the literal phrase `"not a consumer"` to describe the flip, which added a
  6th plugins-wide hit and would have broken the plan's Step-2 estate-invariant grep (exactly five
  carve-out files). Reworded to "previously marked non-consumer"; the invariant is back to exactly 5.
- **Backlog plan-link column filled (minor, in-scope).** Plan Step 4 named only status → Done + version;
  I also filled the plan-link column (was `—`) with the ADR-collapsed plan path, matching sibling
  ADR-collapsed Done rows. Low-risk consistency fill on a row I was already editing.
- **Self-review run in-context, disclosed.** No `general-purpose` subagent-spawn tool is available in
  this dispatch's toolset (nor in the deferred-tool list), so the baked-in review round was run as a
  disclosed in-context self-review against the same prose angle set (see `## Self-Review`), per the
  dispatch's fallback clause — not as two parallel finder passes.

## Self-Review

**Verdict: PASS — no findings requiring a fold.** Docs/rules-only diff, so PROSE angles were run (not
code-review). Method: in-context self-review over the full diff, each cross-reference backed by a grep
(disclosed fallback — no subagent-spawn tool available).

- **Internal consistency** — the new §Pattern-Pack Seeding input vocabulary matches its source
  artifacts exactly: reference-model `CONFIRMED` + `portable`/`adapt` (mine-reference-model R2/R3);
  F27 charter `keep`/`aspire`/`replace` three-way (plan-asserted, critic-verified — F27 tree not read,
  rule 2); `skill-gaps/registry.md ## Anti-patterns (do-not-propagate)` (mine-skill-candidates). The
  section states "adds no authoring rules — one owner per fact" (AP3), preserving single-ownership.
- **Dangling cross-references** — one grep per new cross-ref: `§Pattern-Pack Seeding`, `§Two Channels`,
  `§For New Project-Local Skills` headings all resolve (1 each); `references/skill-recipe.md` exists;
  mine-reference-model's three flipped surfaces point at improve-skills §Pattern-Pack Seeding (present,
  3 hits). ADR-69's refs resolve: ADR-50/63/68 headings exist; the "ADR-66 claimed by F15" note matches
  the ADR-67/68 precedent (3 consistent occurrences). External runtime paths (`docs/reference-model.md`,
  `docs/conventions/coding-conventions.md`, `docs/skill-gaps/registry.md`) are consuming-repo artifacts
  cited "when present" — correctly not asserted to exist here.
- **Dropped/silently-narrowed guarantees** — none. All three mine-reference-model surfaces preserve the
  boundary "this skill mines and grades the rows; it never scaffolds skills; improve-skills owns
  scaffolding". The "does NOT do" bullet keeps "does not generate/refresh skills from the mined
  patterns" and only re-points ownership; only the (intended) "separate proposal if the pilot proves
  demand" deferral clause was dropped.
- **Directional references** — verified against final layout: caller 3 "§Pattern-Pack Seeding below"
  (Entry Points @12 → section @30 ✓); "The third caller (above)" (@30 refs callers @12 ✓); "existing
  recipes below" / "§For New Project-Local Skills" (@30 → @69 ✓); "home (per §Two Channels)" (@18,
  above ✓). ADR-69 appended in register order after ADR-68's `---`, before `## Inherited pipeline
  decisions`.
- **Stale adjacent sentences** — none. All 4 `improve-skills` mentions in mine-reference-model are the
  3 flipped surfaces (all consumer-positive); `out of scope for v1` = 0 remaining; the one `Entry-8`
  mention now correctly reads "the pilot's Entry-8 second stage, formalized (F30)" (historical, not
  stale). `## Two Channels` (a different axis — channels vs callers) left untouched per plan and stays
  correct.

*Status: COMPLETE — developer, 2026-07-22*
