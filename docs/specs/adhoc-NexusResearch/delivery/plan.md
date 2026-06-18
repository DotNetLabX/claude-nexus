# Nexus /research skill — rename + depth-route + capture

**Feature Spec:** None (ad-hoc technical pass; binding inputs: ADR-1, ADR-26 RESEARCH-stage, the
conversation decisions of 2026-06-18, and the doc-verified `/deep-research` constraints below)

## Context

We have a shipped `search-researches` skill (recall-first grep over `docs/kb/research/`, then a forked
read-only `Explore` researcher on a miss). Two things change:

1. **It becomes the everyday `/research` command.** The owner reaches for research constantly and wants a
   short, self-contained skill for **low–medium** depth — no external tool, no friction.
2. **Heavy dives route to the platform.** Claude Code ships a first-party **built-in `/deep-research`**
   workflow (fan-out search → per-claim adversarial cross-check → cited report). Verified against
   `code.claude.com/docs/en/workflows.md` (2026-06-17): it is **(a)** a bundled built-in, gated by CLI
   ≥ v2.1.154 + a paid plan + `disableWorkflows`/Pro-`/config` toggle — **not guaranteed present**; and
   **(b) not programmatically invocable** — user-typed / user-prompted only. So a skill **cannot** call
   it; the integration is **route-and-capture**, never auto-invoke. The built-in also **persists nothing**
   (its report lands in-session), so capturing it into the pool is pure net value.

The result is a depth-routed research front door: recall → low–medium handled by our own forked
researcher → heavy routed to `/deep-research` → either way, captured into the pool so it compounds.

## Scope

**In:**
- Rename the shipped skill `search-researches` → `research` (folder, frontmatter, all **live** internal
  references) so it is invocable as `/research`.
- Add the depth-routing branch: low–medium → self-contained forked researcher (current behavior); heavy /
  breadth-first → recommend the user run `/deep-research {framed question}`.
- Add the capture path: ingest a `/deep-research` report from caller context → `research-entry-schema`
  format → `cite-check` → supersede-don't-delete → persist.
- Re-label `/deep-research` correctly inside the skill (gated built-in, not an external/OMC skill).
- Update the `research-before-asking` rule's depth dial + the renamed skill reference (sister surface).
- Release: bump + regenerate the `omni` twin.

**Out (explicit):**
- **Auto-invoking `/deep-research`** — verified impossible; do not design around it.
- **Rewriting historical records** — `docs/specs/adhoc-ResearchKB/**`, `docs/proposals/research-*.md`,
  `docs/research/**`, ADR prose in `docs/architecture/README.md`, and past CHANGELOG entries are the
  audit trail (supersede-don't-delete). DO NOT TOUCH on the rename.
- **The RecipeEstateAudit selection-index** `deep-research` re-label — owed, but owned by that in-flight
  pass; flag it there, don't edit it here.
- A `/nexus:research` command *wrapper*, breadth-first 3-worker fan-out tuning, retention (P3), persona
  (P4) — future.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|-------------------------|------|
| 1 | improve-skills | Follow | no | old→new rename table; live-surface grep target; DO-NOT-TOUCH historical-doc carve-out | |
| 2 | improve-skills | Follow | no | depth heuristic (low-med vs heavy); `/deep-research` gated-built-in re-label text | |
| 3 | improve-skills + research-entry-schema | Follow | no | capture flow; `cite-check` as the fail-closed enforcement; operator sample report | |
| 4 | improve-flow | Follow | no | rule depth-dial delta + `search-researches`→`research` name update | |
| 5 | release-plugin | Follow | no | MINOR tier (owner-confirm); regen omni twin; gen-commands NOT needed (no agent files changed) | |

**Disposition notes.** Every step is `Follow` (no new pattern is invented) and `TDD: no` (the only
executable code, `cite-check.mjs`, is *moved*, not changed — its existing unit tests must stay green at
the new path; that is test-maintenance, not new TDD). All steps consult
`improve-skills/references/proven-patterns.md` — especially **AP2** (sweep every normative surface in one
pass, not just where reported), **AP3** (one fact, one owner), **AP5** (every named path/tool verified),
and **P1** (the deterministic post-condition script — here `cite-check` and `skill-lint` — is the gate,
not the prose).

## Implementation Steps

### Step 1 — Rename `search-researches` → `research` (live surfaces only)
**Follow improve-skills** (dev-repo carve-out: shipped skills are edited directly under
`plugins/nexus/skills/`; the skill's own lint is the done-condition).
**Satisfies:** ADR-26 RESEARCH-stage (the front-door skill), ADR-1 (self-contained).

Rename the folder and update every **live** reference. Old → new:

| Old | New |
|-----|-----|
| `plugins/nexus/skills/search-researches/` (dir) | `plugins/nexus/skills/research/` |
| `name: search-researches` (SKILL.md frontmatter) | `name: research` |
| `plugins/nexus/skills/search-researches/scripts/cite-check.mjs` | `plugins/nexus/skills/research/scripts/cite-check.mjs` |
| refs in `plugins/nexus/skills/research-entry-schema/SKILL.md` (skill name + the `…/scripts/cite-check.mjs` path + the cache-glob `**/skills/search-researches/scripts/…`) | `research` / `…/research/scripts/…` |
| skill-name ref in `plugins/nexus/rules/research-before-asking.md` | `research` |
| cite-check path in `tests/unit/cite-check.test.mjs` | `…/research/scripts/cite-check.mjs` |
| the cache-resolution glob inside `research/SKILL.md` itself | `**/skills/research/scripts/cite-check.mjs` |
| invocation token in `research/SKILL.md` body — `node {search-researches folder}/scripts/cite-check.mjs` (≈L87) | `{research folder}` |
| in-file comment in `research/scripts/cite-check.mjs` (≈L6, "…for the search-researches skill…") | `research` |

- **Verification sub-step (hard, numbered):** `grep -r "search-researches" plugins/ rules/ tests/` →
  **zero hits required.** This grep IS the acceptance and is **authoritative over the table** — the table
  is the known set; update **every** hit the grep returns, including any not pre-listed. (The two rows
  above were live hits the first table draft missed — the grep, not the hand list, is the gate.)
- **DO NOT TOUCH** any `search-researches` hit under `docs/` — those are the audit trail. For
  `docs/architecture/README.md`: if the hit is ADR prose → leave it; only update a live skill-index *row*
  if one exists (developer judgment, note which).
- **Done-condition:** `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/research`
  exits 0; `node --test tests/unit/cite-check.test.mjs` passes at the new path.

### Step 2 — Add the depth-routing branch + `/deep-research` re-label
**Follow improve-skills** (consolidating rewrite of `research/SKILL.md` — fold into the existing
*Recall first* / *Steps (execution path)* sections; net complexity flat, never additive patching; AP2/AP3).
**Satisfies:** ADR-26 RESEARCH-stage.

In `plugins/nexus/skills/research/SKILL.md`, after recall (unchanged) and on a miss, route by depth:
- **Low–medium** (a focused fact, one library capability, "does X work / what did spec Y decide"): the
  self-contained forked `Explore` researcher runs the dive **now** — this is today's behavior and the
  default. No external tool.
- **High / breadth-first** (a landscape or multi-source comparison, "what's the best approach across the
  field"): surface a **recommended option** to the caller — *run the built-in `/deep-research {question
  framed neutrally}`* (reuse the existing neutral-framing rule to build the string) — then go to capture
  (Step 3). Do **not** auto-spawn the 3-worker fan-out for these; the built-in does breadth better.
- **Re-label `/deep-research`** wherever the skill currently calls it an external/OMC `deep-research`
  harness: it is a **Claude Code built-in workflow** — user-invocable only, gated by CLI version / plan /
  `disableWorkflows`. State that this gating is *why* the low–medium path stays self-contained (the
  built-in can't be invoked programmatically and may be absent), correcting the old "forbidden external
  dependency" rationale.
- **Acceptance:** SKILL.md shows `recall → route(low-med forked | heavy → /deep-research) → capture`;
  the depth heuristic is stated; `grep -n "external .deep-research" plugins/nexus/skills/research/SKILL.md`
  → zero (re-label complete); skill-lint exits 0.

### Step 3 — Add the capture path (`/deep-research` report → pool entry)
**Follow improve-skills + Follow research-entry-schema** (the entry format and claim grammar).
**Satisfies:** ADR-26 RESEARCH-stage (capture-before-surface, ADR-17).

Add a *Capture a `/deep-research` report* section to `research/SKILL.md`:
- Read the report already sitting in the **caller's context** (the built-in lands it in-session).
- Reshape it into `research-entry-schema` format — metadata block (Verdict, Evidence tier, As-of,
  Validity scope, Status, Reconfirm trigger, Corroboration) + the 8-part body + the `[n]` claim grammar.
  This is **model-driven semantic reshaping**, not a brittle parser keyed on `/deep-research`'s exact
  layout — robust to its output changing.
- **Derive the three fields a `/deep-research` report does NOT hand you** (the hard part — naive
  reshaping fails `cite-check`, per cite-check.mjs's high-stakes/validity checks):
  - **Evidence tier** → `read-docs` when an authoritative source backs the claim, else `inferred`;
    **never `ran-it`** (a web dive observes nothing first-hand).
  - **Validity scope + Reconfirm trigger** → synthesize from the question's subject (the version / API /
    platform the answer holds for). **Never leave blank** — the schema treats a blank Validity scope as
    stale.
  - **Corroboration** → map `/deep-research`'s per-claim cross-check to the cite-check grammar: record the
    source **count** (≥ 2 clears the high-stakes floor) or the literal `second independent source agreed`.
    **If a high-stakes verdict rests on a single source, do NOT label its Corroboration `high-stakes`** —
    `cite-check.mjs` pass C keys the floor on the `high-stakes` token in the `**Corroboration:**` line and
    fails `high-stakes && <2 sources` **unconditionally** (it never reads `Status`; verified against
    cite-check.mjs:130-141 + the tested contract cite-check.test.mjs:77-85). Instead record the source
    count, set `Status: uncertain`, and state the single-source limitation in prose (`## Caveat`). This is
    the honest capture the validator accepts (cite-check exit 0): a high-stakes verdict that genuinely
    cannot meet the second-source floor is recorded as uncertain, never asserted as a *cleared* high-stakes
    claim. (Corrected 2026-06-18 — Q3: the original prose said `Status: uncertain` bypasses the floor; it
    does not, and loosening the gate to make it do so would weaken a deliberately fail-closed safety check
    and break its test.)
- **Fail-closed enforcement (P1, pairs the prompt obligation):** run
  `node plugins/nexus/skills/research/scripts/cite-check.mjs {drafted-entry}` before persisting — an
  uncited / single-source-high-stakes / placeholder entry does not get written. The prompt rule is the
  request; cite-check is the enforcement.
- **Supersede-don't-delete**, then persist to `docs/kb/research/{topic}.md`; surface the verdict after.
- **Operator-owed validation (build-time-unavailable resource).** End-to-end capture wants one real
  `/deep-research` report. **OPERATOR ACTION** owed in implementation.md: the owner runs `/deep-research`
  once on a sample question and shares the report; the developer validates that capture yields a
  cite-check-clean entry. **Provisional fallback if unavailable at build time:** validate the mapping
  against a representative hand-built sample report and note the open production check — `Deviated (valid
  reason)` at done-check, with the live validation surfaced as operator-owed, not silently passed.
- **Acceptance:** a sample report → a `research-entry-schema`-shaped entry that `cite-check` exits 0 on.

### Step 4 — Update the `research-before-asking` rule (sister normative surface)
**Follow improve-flow** (rule-file edits are improve-flow's domain, not improve-skills). If improve-flow
doesn't cleanly fit a direct feature edit, document the deviation and apply the AP2/AP3 discipline from
`proven-patterns.md` directly. **Satisfies:** ADR-26 RESEARCH-stage.

In `plugins/nexus/rules/research-before-asking.md`:
- Rename the skill reference `search-researches` → `research` (closes the AP2 half-landed-rename risk).
- Extend the depth dial with the engine split: a low–medium fact-shaped unknown → `/research` (forked,
  self-contained); a heavy / breadth-first one → `/research` routes to the built-in `/deep-research` +
  capture. Keep one owner for the depth heuristic — the rule points at the skill, the skill holds the
  mechanics (AP3); don't restate the full mechanics in both.
- **Acceptance:** `grep -rn "search-researches" plugins/nexus/rules/` → zero; the depth dial names both
  engines; no duplicated mechanics across rule and skill.

### Step 5 — Release: bump + regenerate the twin
**Follow release-plugin.** **Satisfies:** ADR-9 (bump in the same commit as the shipped-file change).

- Bump `plugins/nexus/.claude-plugin/plugin.json` + `CHANGELOG.md` — **MINOR** (new capability:
  depth-routing + capture; plus a user-facing rename). Owner confirms the tier (Open Questions).
- **gen-commands is NOT needed** — no `agents/*.md` changed. State this so it isn't run spuriously.
- Regenerate the `omni`/`omni-dotnet` twin (`node scripts/gen-omni.mjs`, ADR-6) so the twin's versions
  ride along; `gen-omni --check` must be in sync.
- **Acceptance:** `claude plugin validate plugins/nexus --strict` passes; the bump is present and rides
  in the same commit; `gen-omni --check` clean; full suite green.

## Testing Strategy

- `cite-check.test.mjs` passes at the renamed path (Step 1) — no logic change, path-only.
- Capture produces a `cite-check`-exit-0 entry on a sample `/deep-research` report (Step 3).
- `skill-lint` exits 0 on `plugins/nexus/skills/research` after every edit.
- Zero `search-researches` hits across `plugins/ rules/ tests/` (Steps 1 & 4).
- `claude plugin validate --strict` + `gen-omni --check` (Step 5).

## KB Impact

None in `docs/kb/` (the research *pool* is a consuming-project artifact, created lazily, never shipped —
ADR-1). The schema/skill changes are plugin source, covered by the steps above.

## Open Questions (resolved 2026-06-18)

1. **Version tier → MINOR.** Owner-confirmed. Step 5 bumps MINOR.
2. **Capture validation → owner runs `/deep-research` once.** Owner-confirmed: the owner provides a real
   report and the developer validates capture yields a `cite-check`-clean entry before ship — no
   operator-owed deferral.

## Plan Review (critic, code-grounded — 2026-06-18)

Verdict: **GO-with-fixes**, all folded in above. The code-grounded pass caught two HIGHs a doc-only
review would have missed:
- **[HIGH] `SKILL.md:87` token** — the `{search-researches folder}` invocation token was absent from
  Step 1's rename table. *Fixed:* added the row; the acceptance grep is now declared authoritative over
  the hand list.
- **[HIGH] Step 3 derived fields** — Evidence tier / Validity scope / Corroboration cannot be lifted
  verbatim from a `/deep-research` report and would fail `cite-check`. *Fixed:* Step 3 now names the
  derivation rules.
- **[MEDIUM] `cite-check.mjs:6` comment** — an inert `search-researches` string the grep gate flags.
  *Fixed:* added to Step 1's table.
- **[LOW] Step 4 improve-flow misfit** — already pre-acknowledged in-plan; no change.

Confirmed clean against live source: no `search-researches` in `agents/`, `commands/`, or
`agents-workflow.md` (so **gen-commands-not-needed is correct**); no fictional infrastructure (AP5); the
RecipeEstateAudit selection-index re-label correctly punted to its owning pass.
