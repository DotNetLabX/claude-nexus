# F24-EditShippedSkillRecipe — Implementation

## Files Created
- `plugins/nexus/skills/edit-shipped-plugin-skill/SKILL.md` — new shipped, dev-repo-scoped **light**
  skill (SKILL.md only). The "edit shipped plugin text coherently" recipe: a scope statement (dev-repo
  only; glob surfaces `plugins/*/skills/**`, `plugins/*/agents/*.md`, `plugins/*/rules/*.md`, hook/script
  header comments; consuming projects route via improve-skills' Two Channels) and a six-phase recipe —
  (1) scope the edit / smallest-coherent-edit + consolidating-pass posture, (2) pre-edit enumeration/consumer
  sweep (three echo shapes, scope floor, DO-NOT-TOUCH carve-outs, markup-tolerance with a **synthetic**
  example), (3) edit discipline (two-surface reconciliation, renumber/insert ripple, directional refs,
  adjacent-surface staleness triple, canonical terms, estate-invariant protection), (4) agent-file rider
  (F5 sibling folded — obligation placement, binding trigger shape, reference-a-template, `gen-commands.mjs`),
  (5) gates (skill-lint exit 0 naming E9/E7/E6 traps; repo lint suite in the glob form), (6) release
  obligations (one release-plugin run per feature). Plus a born-compliant note and a "does NOT do" fence.

## Files Modified
- `plugins/nexus/skills/improve-skills/SKILL.md` — Step 2 (fix branch). Appended one pointer sentence to
  the dev-repo carve-out blockquote (:22): "The in-repo edit itself follows `edit-shipped-plugin-skill` — the
  coherent-edit recipe (…)." Names the in-repo edit pass at the seam where the two channels split (satisfies
  F17's "no skill covers executing them *in* this repo"). All three existing carve-out guarantees — direct
  authoring, lint as done-condition, the New-Skill Judgment Gate clause — stay verbatim (nothing dropped or
  narrowed). Dogfooded the recipe: additive, no rule contradicted (no two-surface conflict), no adjacent
  in-prose summary of the carve-out to reconcile, skill-lint exit 0.
- `plugins/nexus/.claude-plugin/plugin.json` — Step 3. `version` 1.45.0 → **1.46.0** (MINOR, owner-escalated
  via `bump-plugin.mjs --minor`; new skill = new capability).
- `plugins/nexus/CHANGELOG.md` — Step 3. New `## [1.46.0]` entry describing the new recipe skill (its six
  source records in one line) and the improve-skills carve-out pointer; replaced the generated stub.
- `docs/backlog.md` — Step 3. F24 row flipped to `Done (shipped 2026-07-22, nexus 1.46.0)` (no sha, F17-row
  precedent) and the Plan column filled with the plan path (ADR-collapsed precedent).

## Key Decisions
- **Findings/waiver record lives in implementation.md, not `docs/skill-evals/` + `docs/skill-backlog.md`.**
  The generic evaluate-skill/improve-skills process would drop a findings doc under `docs/skill-evals/`
  and a `## Skills Created` row in `docs/skill-backlog.md`. The plan's Step 1 acceptance explicitly channels
  the evaluate-skill disposition "in implementation.md," and the lane's rule-2 release-dry-run guard requires
  the bump's reasons to name only edit-shipped-plugin-skill / improve-skills / this feature's docs. Recording
  the judgment-gate result here (below) satisfies the plan and keeps the Step-3 dry-run clean. See Deviations.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | improve-skills, evaluate-skill | NEW-shipped-skill branch (dev-repo carve-out) incl. the Judgment Gate; both invoked via the Skill tool (logged/audited). `tdd` N/A (plan TDD: no; prose-recipe skill, no testable behavior). |
| 2 | improve-skills | fix-to-existing branch (lint alone); invoked via the Skill tool. skill-lint exit 0. |
| 3 | release-plugin | invoked via the Skill tool. Dry-run reasons named only improve-skills + edit-shipped-plugin-skill (rule-2 clean); `--minor` → 1.46.0; CHANGELOG edited; `--check` exit 0; `claude plugin validate --strict` passed. No gen-commands/gen-omni/commit (lane close owns them). |

### Step 3 — Release acceptance
- Dry-run reasons: `skill change (improve-skills)`, `skill change (edit-shipped-plugin-skill)` **only** — the
  untracked F27 and adhoc-VwhRound4Eval trees did NOT appear (bump-plugin classifies `plugins/**` only). Rule-2
  contamination check: **clean**.
- MINOR applied: nexus 1.45.0 → **1.46.0**. `bump-plugin.mjs --check` exit 0 (change covered by a bump).
- `claude plugin validate plugins/nexus --strict` → Validation passed (exit 0).
- Repo lint+unit suite (glob form) after all edits: **589 pass, 0 fail**.
- docs/backlog.md F24 → Done (shipped 2026-07-22, nexus 1.46.0).

### Step 1 — Judgment Gate record (evaluate-skill, 2026-07-22)
Layers 0–4 of `evaluate-skill/references/rubric.md` walked against the new SKILL.md. **Verdict:
fix-then-accept → ACCEPT** after the single fold below.

Findings:
- **F1 (MEDIUM, Layer 1.1 — promise vs body):** description promised "adjacent-surface staleness" but the
  edit-discipline phase folded it into the enumeration echo-shapes without giving the header-comment/JSDoc/prose
  triple its own beat. **Resolved** — added an "Adjacent-surface staleness" bullet to phase 3 (net-neutral
  consolidating add; closes the promise gap; born-compliant per ADR-23). Re-lint exit 0.
- **F2 (LOW, Layer 4.1 — lessons-capture instruction absent):** **Waived** — this is a light recipe followed
  inline by an agent that already carries its own lessons obligation; the shipped light `*-format` skills
  (`implementation-format`, `questions-format`, `lessons-format`) carry no lessons-capture line either, so
  adding one would break estate consistency for no consumer.

Rubric items checked clean: Layer 0 (skill-lint exit 0); L1.2 guardrails have executors (skill-lint /
release-plugin / grep — no AP1 dead-letter); L1.3 no unverified external-system claims; L1.4 citation audit
faithful (improve-skills Two Channels + fix-channel language, release-plugin, `../improve-skills/scripts/skill-lint.mjs`,
`scripts/gen-commands.mjs`, E9/E7/E6 match skill-lint.mjs's real checks, glob-form test matches CLAUDE.md);
L1.5 scope fence present; L2.1 one-concept-once (points at owners, no restatement — AP3 clean); L2.3 right
weight (light, single SKILL.md); L2.5 AP4 (glob surfaces, no hardcoded list) + AP5 (all paths verified on disk)
clean; L3 overlays N/A (writes nothing, no subagents, no unbounded iterate, not resumable); L4.3 auto-discovered
shipped skill (no index row owed — glob-auto-discovery confirmed in wiring.test.mjs per plan review).

### Step 1 — Acceptance (re-run after the fold, actual counts)
- folder exists; `skill-lint.mjs` exit 0.
- new-SKILL.md greps (each ≥ 1): `two-surface`=1, `DO-NOT-TOUCH`=2, `gen-commands.mjs`=1, `E9`=2, `E7`=3,
  `E6`=2, `glob form`=2; description contains `plugin source repo` (=2) and `dev repo` (=1).
- **Estate-invariant guard:** `not a consumer` (-i) in `plugins/` = **5 files** (unchanged); new SKILL.md
  adds 0 hits (`grep -ic` = 0).

## Self-Review
**Baked-in end-of-implementation review (docs/rules-only diff → PROSE angles). Subagent spawning is NOT
available in this tool context (no Task/Agent tool), so this is a disclosed in-context self-review against
the dispatch's angle set — stated explicitly.** Verdict: **PASS — no CRITICAL/HIGH/MEDIUM findings.**

Evidence per angle:
1. **Internal consistency** — phase numbering 1–6 coherent; the skill teaches "one owner per fact" and
   practices it (points at improve-skills/release-plugin, never restates their policy). Clean.
2. **Dangling cross-references** (one grep per cross-ref the new text makes) — all resolve on disk:
   improve-skills `## Two Channels` (1), `For New Project-Local Skills` New-Skill recipe (1),
   `../improve-skills/scripts/skill-lint.mjs` (file present), repo-root `scripts/gen-commands.mjs` (present),
   `release-plugin/SKILL.md` (present), surface globs `plugins/nexus/agents` + `plugins/nexus/rules` (both
   dirs exist). E9/E7/E6 codes match skill-lint.mjs's real checks; glob-form test matches CLAUDE.md.
3. **Dropped/silently-narrowed guarantees** (esp. improve-skills carve-out after Step 2) — the three
   guarantees are present verbatim on :22 (direct=1, done-condition=1, Judgment-Gate clause=1); the pointer
   is strictly appended. No clause dropped or narrowed.
4. **Directional references vs final layout** — every directional ref in the new SKILL.md is accurate against
   the shipped layout: "agent-file rider below" (→ phase 4, below), "phase 3 guards against" (→ estate-invariant,
   in phase 3), "release bump (phase 6)" (→ phase 6). Correct.
5. **Stale adjacent sentences** — the four other `carve-out` references in improve-skills (:59, :66, :85, :117)
   all concern *authoring* a new shipped skill under the carve-out; the Step-2 append is purely additive about
   the in-repo *edit* pass, so none went stale. (The new skill's own adjacent-surface-staleness discipline,
   applied to its own edit — and it passes.)
6. **The skill passes every discipline it teaches** (born-compliant, ADR-23) — `not a consumer`=0 in the new
   file (estate-invariant honored); the only `<tag>` token sits inside a code span (E7-exempt; skill-lint exit 0);
   surfaces given as globs not a hardcoded list (AP4); all cited paths verified (AP5); every gate names its
   executor (AP1); body 131 lines (light archetype, well under W3's 500).

**Final change-set audit:** modified = `docs/backlog.md`, `plugins/nexus/.claude-plugin/plugin.json`,
`plugins/nexus/CHANGELOG.md`, `plugins/nexus/skills/improve-skills/SKILL.md`; new = this feature's
`docs/specs/F24-EditShippedSkillRecipe/` tree + `plugins/nexus/skills/edit-shipped-plugin-skill/`. The
untracked `docs/specs/F27-ConventionsPipeline/` and `docs/specs/adhoc-VwhRound4Eval/` trees were **not touched**
(they were already `??` at dispatch). Rule-2 honored.

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Recipe's live validation is deferred to its first consumer wave | low | architect/reviewer | plan Testing Strategy: "The recipe's live validation is its first consumer wave (F19/F21/F22) — out of scope by design" | Not a defect — the born-compliance self-audit is the only in-feature validation available; real-world proof lands when F19/F21/F22 consume the recipe. |

## Deviations from Plan
- **evaluate-skill / improve-skills durable-record location.** Generic skill process → `docs/skill-evals/…`
  + `docs/skill-backlog.md`; here → implementation.md (this file). Reason: the plan's Step 1 acceptance names
  implementation.md as the disposition record, and lane rule-2 requires the Step-3 release dry-run reasons to
  stay within edit-shipped-plugin-skill / improve-skills / this feature's docs — a `docs/skill-evals/`
  or `docs/skill-backlog.md` write is outside that set. Following the plan on this feature-specific output
  decision (skill-authority: plan wins on feature-specific decisions).

*Status: COMPLETE — developer, 2026-07-22*
