# Nexus /research skill — rename + depth-route + capture — Implementation

Implementing `docs/specs/adhoc-NexusResearch/delivery/plan.md`. Both Phase-1 questions are Answered
(architect rulings ratify the plan defaults): Q1 — `../omni` twin repo ABSENT, do the in-repo half of
Step 5 only and surface gen-omni as `OPERATOR ACTION REQUIRED`; Q2 — exclude `CHANGELOG.md` from the
zero-hit rename gate (3 historical hits left untouched).

## Files Created
- _(none — the rename moves files; see the move note under Step 1)_

## Files Modified

### Step 1 — Rename `search-researches` → `research` (live surfaces only)
- **`plugins/nexus/skills/search-researches/` → `plugins/nexus/skills/research/`** — folder renamed via
  `git mv` (preserves file history). Moves both shipped files: `SKILL.md` and `scripts/cite-check.mjs`.
- `plugins/nexus/skills/research/SKILL.md` — frontmatter `name: search-researches` → `name: research`
  (E4 gate: lint requires name == folder); `# Search Researches` title → `# Research`; the two
  `node {search-researches folder}/scripts/cite-check.mjs` invocation tokens (≈L89, L115) →
  `{research folder}`; the cache-resolution glob `**/skills/search-researches/scripts/…` (≈L96) →
  `**/skills/research/scripts/…`. (The `deep-research` re-label in the description / L28-31 / L131 is
  Step 2's concern, deliberately left for that step — Step 1 is rename-only.)
- `plugins/nexus/skills/research/scripts/cite-check.mjs` — in-file header comment (L6)
  "…for the search-researches skill…" → "…for the research skill…" (the inert string the grep gate flags;
  the MEDIUM the critic caught). No logic change — path-only move, tests stay green.
- `plugins/nexus/skills/research-entry-schema/SKILL.md` — 4 cross-references to the renamed skill:
  the writer ref (L8), the validator-path ref `search-researches/scripts/cite-check.mjs` → `research/…`
  (L13), the "shipped in `search-researches`" ref (L66), and the Consumers-table row label (L109).
- `plugins/nexus/rules/research-before-asking.md` — the 3 bare skill-name references (section heading
  L39 + 2 body refs L42, L44) `search-researches` → `research`. (Renaming the *name* now keeps the
  Step-1 `grep … rules/` gate clean per AP2 no-half-landed-rename; the depth-dial *mechanics* extension
  is Step 4 — see below.)

### Step 4 — Extend the `research-before-asking` rule's depth dial (sister normative surface)
- `plugins/nexus/rules/research-before-asking.md` — added an engine-split block to **`## The depth dial`**
  (after the existing cheap/expensive bullets): for a **fact-shaped unknown**, the expensive route splits
  **low–medium** (`/research` runs a self-contained forked dive now + captures) vs. **heavy / breadth-first**
  (`/research` recommends the gated user-invocable built-in `/deep-research` + captures its report). Closes
  with "Either way you call `/research`; it decides the engine. The depth heuristic and the capture
  mechanics live in the skill (one owner — don't restate them here)" — **AP3 one-owner**: the rule names the
  two tiers as a routing summary and defers all mechanics to the skill. (The skill-name rename in this file
  was already landed in Step 1 to keep the Step-1 gate clean.)

**Step 4 verification (all green):**
- `grep -rn "search-researches" plugins/nexus/rules/` → **zero** (PASS — already clean from Step 1).
- The depth dial **names both engines** (`/research` low–medium forked; `/deep-research` heavy + capture)
  — verified by grep.
- **No duplicated mechanics**: the new depth-dial block carries no Evidence-tier / cite-check / 8-part /
  reconfirm-trigger / validity-scope / corroboration mechanics; the only brief schema references in the file
  (L59/L63) are pre-existing pointers in the separate `## Capture and recall` section that *name* the schema
  skill (appropriate cross-references), not the heuristic restatement AP3 warns against.

### Step 5 — Release: bump (in-repo half only, per Q1 ruling)
- `plugins/nexus/.claude-plugin/plugin.json` — **MINOR bump 1.13.2 → 1.14.0** via `release-plugin`
  (`node scripts/bump-plugin.mjs --minor`; owner-confirmed tier per plan Open Q1: new capability +
  user-facing rename). dry-run first proposed PATCH; escalated to MINOR per the ruling.
- `plugins/nexus/CHANGELOG.md` — replaced the auto-generated **`[1.14.0]`** stub with a real entry
  describing the rename (`search-researches` → `research`, `/research`), depth-routing, capture, the
  `/deep-research` built-in re-label, and the rule depth-dial extension — **using the new name** (Q2: the
  new entry is additive and references `research`). The 3 historical CHANGELOG hits (L11/L118/L121, now in
  the released `[1.13.2]`/`[1.10.0]` blocks) left untouched.
- **gen-commands NOT run** (correct — no `agents/*.md` changed). **Verified**: `node scripts/gen-commands.mjs
  nexus` then `git diff --exit-code plugins/nexus/commands` → no diff (the CI B5 check), confirming the
  gen-commands-not-needed claim.
- **gen-omni DEFERRED** — `OPERATOR ACTION REQUIRED` (Q1: `../omni` twin absent on this machine).

**Step 5 verification (in-repo acceptance):**
- **Full test suite** `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (CI-exact) → **224 pass /
  0 fail**. Covers the rename-sensitive lint tests (skill-refs, frontmatter, release, wiring, salience) and
  cite-check at the renamed path.
- `claude plugin validate plugins/nexus --strict` → see **Deviations / diagnosed pre-existing failure**
  below. **`research` (this feature's skill) validates CLEAN** under `--strict`; the remaining 4 failures
  are pre-existing and out of scope.
- gen-commands no-diff confirmed (above).
- Same-commit staging + commit is the **team-lead's** job (developer never commits — hard rule).

### Diagnosis — `claude plugin validate --strict` pre-existing YAML failure (diagnose skill)
**Symptom:** `--strict` exits 1; 5 skills report `YAML Parse error: Unexpected token` — `boy-scout`,
`diagnose`, `evaluate-skill`, `improve-skills`, `research`.
**Root cause (evidence-backed):** the `--strict` validator uses a real YAML parser; an **unquoted
`description:` value containing `: ` (colon-space)** parses as a nested mapping and fails. `skill-lint`
(the plan's per-skill done-condition) uses a lenient line-regex parser and does *not* catch this — hence
the gap.
**Pre-existing vs. mine:**
- The 4 non-`research` skills are **unchanged in the working tree** (`git status` empty for them) yet fail
  identically → the failure is **pre-existing on `main`**, not introduced by this feature.
- The **original** `search-researches` description already carried a colon-space (`Limitation: inline …`)
  at HEAD → so `research` *inherited* a pre-existing failure; my Step-2 rewrite additionally introduced a
  second one (`route by depth: a …`).
**Fix (in scope — `research` is this feature's skill, and its description is now my artifact):** reworded
the `research` description to remove **both** colon-spaces (`depth:` → `depth —`; `Limitation:` →
`Recall is …`), matching the passing `research-entry-schema` style. **Result:** `--strict` YAML errors
5 → 4; **`research` now validates clean**; `skill-lint` still `OK research`. Minimal change, meaning
preserved.
**Out of scope (carry-over, NOT fixed here):** the 4 pre-existing failures (`boy-scout`, `diagnose`,
`evaluate-skill`, `improve-skills`) are a separate repo-wide issue a rename/route/capture feature should
neither fix nor be blocked by — flagged for the architect.
- `tests/unit/cite-check.test.mjs` — header comment (L1) skill name + the `CHECK` path const (L11)
  `'skills', 'search-researches', 'scripts'` → `'skills', 'research', 'scripts'`. Path-only; all 19
  assertions unchanged (logic-identical script moved).

### Step 2 — Depth-routing branch + `/deep-research` re-label (consolidating rewrite of `research/SKILL.md`)
All edits are folds into existing sections (net complexity flat — AP2/AP3 consolidating, not additive
patching):
- **`## Why the dive is a forked subagent` section** — replaced the old "decoupled from / never delegates
  to deep-research" rationale (which was wrong: the skill *does* route to and capture from it) with the
  **correct constraint**: `/deep-research` is a **Claude Code built-in workflow**, **user-invocable only**
  (cannot be spawned programmatically), **gated** (CLI version / paid plan / `disableWorkflows`/`/config`),
  and **may be absent** — *that* is why the low–medium dive stays self-contained, and why heavy dives are
  *routed* (user runs it) + captured, never auto-invoked. (Corrects the old "forbidden external dependency"
  framing per the plan.)
- **New `## Route by depth (cache miss)` section** (folded in just before the execution path) — the depth
  fork: **low–medium** (focused fact) → the forked researcher runs now (default, today's behavior);
  **high / breadth-first** (landscape / multi-source) → surface a recommended `/deep-research {neutral
  question}` to the caller, then go to capture. States the depth heuristic (one fact vs. a field; when
  unsure prefer low–medium) and the "do not auto-spawn fan-out for breadth" rule.
- **`## Steps (execution path …)` heading** retitled `## Steps (execution path — low–medium, cache miss)`
  and its preamble scoped to the low–medium route (the forked-dive steps themselves are unchanged — this is
  today's behavior, now correctly labeled as the low–medium branch).
- **`## Default a single researcher` section** — reworked so breadth points at the depth route (AP3: the
  route section owns the routing decision; this section references it) and clarifies the ~3-worker fan-out
  is a deferred P3 option, *not* the current breadth answer (breadth routes to `/deep-research`).
- **Frontmatter `description`** — rewritten from "decoupled / NOT for a standalone report" to the
  route-and-capture model (low–medium forked dive | heavy → built-in `/deep-research`, both captured),
  noting `/deep-research` is a gated user-invocable built-in the skill routes to and captures, never
  auto-invokes. Stays a valid auto-invocation trigger; within E7/length limits.

**Step 2 verification (all green):**
- Acceptance grep `grep -n "external .deep-research" plugins/nexus/skills/research/SKILL.md` → **zero**
  (re-label complete). Broader sweep for any `external`/`OMC` framing of deep-research → none.
- SKILL.md shows `recall → route(low-med forked | heavy → /deep-research) → capture`; depth heuristic
  stated (verified by grep of the routing chain).
- `skill-lint plugins/nexus/skills/research` → `OK research`, exit 0.

### Step 3 — Capture path (`/deep-research` report → pool entry)
- `plugins/nexus/skills/research/SKILL.md` — added a **`## Capture a /deep-research report (the heavy
  route)`** section (placed after the low–medium execution path, before Fallback — the destination the
  Step-2 routing chain forward-references). Six numbered steps: read the report from the caller's context →
  model-driven semantic reshape into `research-entry-schema` (metadata + 8-part body + `[n]` claim grammar,
  explicitly *not* a brittle parser keyed on deep-research's layout) → **derive the three fields a report
  doesn't hand you** (Evidence tier, Validity scope + Reconfirm trigger, Corroboration) → fail-closed
  `cite-check` before persist → supersede-don't-delete + persist → surface verdict last.
- **The three derived-field rules** follow the plan: Evidence tier `read-docs`/`inferred`, **never
  `ran-it`** (a web dive observes nothing first-hand); Validity scope + Reconfirm trigger synthesized from
  the question subject, **never blank** (a blank scope is stale by schema); Corroboration mapped from the
  per-claim cross-check. **Exception — see Deviations:** the plan's single-source rule was corrected
  against the actual `cite-check.mjs` behavior (Q3).

**Step 3 verification (acceptance met):**
- Built a representative `/deep-research`-style sample report + applied the capture reshape rules by hand to
  produce a two-block `research-entry-schema` topic file (the build-time mapping check the plan's
  operator-owed clause calls for, since no live `/deep-research` report is available at build time).
- `node plugins/nexus/skills/research/scripts/cite-check.mjs {reshaped-entry}` → **OK, exit 0** — the
  capture mapping yields a cite-check-clean entry, including both Corroboration paths (high-stakes with 2
  sources clears the floor; high-stakes-single-source recorded as `Status: uncertain` + count, no
  `high-stakes` label — see Deviations / Q3).
- `skill-lint plugins/nexus/skills/research` → `OK research`, exit 0.
- Scratch validation files written under a temp dir and **removed** after; `git status` confirms no stray
  files landed in the repo.

**Step 1 verification (all green):**
- Authoritative gate `grep -rn "search-researches" plugins/ tests/ | grep -v CHANGELOG.md` → **zero hits**
  (Q2 effective gate). The 3 historical CHANGELOG hits (L11/L118/L121, inside released `[1.13.2]`/`[1.10.0]`
  blocks) left **untouched** per the architect's Q2 ruling.
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/research` →
  `OK research`, exit 0 (E4 satisfied).
- `node --test tests/unit/cite-check.test.mjs` → 19 pass / 0 fail at the renamed path.

## Key Decisions
- **`git mv` over delete+recreate** for the folder rename — preserves file history; the plan says "rename
  the folder," and `git mv` is the history-preserving way. (Side effect: the harness re-reads the file at
  the new path before allowing edits, which is expected.)
- **The plan's `rules/` grep target resolves to `plugins/nexus/rules/`** — there is no top-level `rules/`
  directory in this repo (verified: `D:\src\claude-plugins\nexus\rules` does not exist). The only rules
  dir is `plugins/nexus/rules/`, already covered by the `plugins/` scan. Noted so the gate scope isn't
  misread.
- **`deep-research` re-label kept out of Step 1.** Step 1's table is the rename (`search-researches`→
  `research`); the `deep-research` mislabel (external/OMC → gated built-in) is Step 2's explicit scope.
  Splitting them keeps each step's gate clean and auditable.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | improve-skills | Dev-repo carve-out (ADR-1): shipped skill edited directly under `plugins/nexus/skills/`; skill-lint exit 0 is the done-condition. TDD no (cite-check.mjs is *moved*, not changed — its 19 tests stay green at the new path; test-maintenance, not new TDD). |
| 2 | improve-skills | Consolidating rewrite of `research/SKILL.md` — folds into existing sections, net complexity flat (AP2/AP3). TDD no (no executable code changed). |
| 3 | improve-skills, research-entry-schema | research-entry-schema invoked to load the entry format + claim grammar for the capture reshape; improve-skills for the consolidating SKILL.md edit + the skill-lint gate. TDD no (the only executable code, `cite-check.mjs`, is unchanged — Step-3 derivation is *guidance* validated against it, not new code). |
| 4 | improve-flow (applied with documented misfit) | improve-flow invoked; it is oriented to the learner's promotion-list flow, not a direct feature edit (plan pre-acknowledged this; critic logged it LOW). Applied its *fitting* mechanics — dev-repo direct edit (ADR-1 carve-out, same as improve-skills), read-fully + preserve-style + dedup + AP3 one-owner — directly. TDD no. See Deviations. |
| 5 | release-plugin, diagnose | release-plugin for the MINOR bump + CHANGELOG + validate/gen-commands flow (in-repo half per Q1). diagnose invoked when `--strict` failed — phased static-analysis diagnosis (no debug instrumentation needed) identified the pre-existing colon-space YAML issue; fixed `research`, flagged the 4 pre-existing failures. TDD no. |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Plan Step-3 single-source rule contradicts `cite-check.mjs` (Q3) | medium | architect / reviewer | `cite-check.mjs` pass C (L126-143) fails `high-stakes && <2 sources` **regardless of `Status`**; the plan's "set `Status: uncertain` so the validator does not fail-closed" produces a CITE-FAIL (verified ×3 isolated runs + the existing test L77-85) | Corrected guidance applied to the skill (omit the `high-stakes` label, record count + `Status: uncertain` + prose caveat — verified cite-check exit 0). Surfaced as Q3 (Open, To: architect); deviation documented below. The plan PROSE still carries the wrong rule — architect should patch plan Step 3 to match. |
| Pre-existing `claude plugin validate --strict` YAML failure on 4 skills | medium | architect | After fixing `research`, `--strict` still exits 1 on `boy-scout`, `diagnose`, `evaluate-skill`, `improve-skills` (all **unchanged** in the working tree — pre-existing on `main`). Cause: unquoted `description:` values with a `: ` (colon-space) parse as a mapping; the real YAML parser in `--strict` rejects it, `skill-lint`'s lenient regex does not. | OUT OF SCOPE for this rename/route/capture feature (it neither introduced nor should fix them). The trivial fix is to quote or reword those 4 descriptions to drop the colon-space — a separate small pass. Flagged so the architect's done-check does not attribute the `--strict` non-zero to this feature: `research` itself is clean. **Possible skill-lint gap:** `skill-lint` E-checks should arguably catch a colon-space in an unquoted `description:` so it's caught at the per-skill gate, not only at `--strict`. |

## Deviations from Plan

- **Step 3 — corrected the Corroboration derivation rule for a high-stakes single-source verdict (Q3).**
  *Plan said:* "if a high-stakes verdict rests on a single source, set `Status: uncertain` so the validator
  does not fail-closed on it." *Verified wrong against the code:* `cite-check.mjs` pass C keys the
  high-stakes floor **only** on the `**Corroboration:**` line (`highStakes && singleSource` → fail,
  **unconditionally**); it never reads `Status`. The plan's exact mechanism (high-stakes + 1 source +
  `Status: uncertain`) **CITE-FAILs exit 1** — the opposite of the plan's intent — and the fail-closed
  behavior is the validator's *tested* contract (cite-check.test.mjs L77-85; no test asserts a `Status`
  bypass). *Did instead:* the skill's capture guidance now says — for a high-stakes claim resting on a
  single source, **do not label Corroboration `high-stakes`**; record the source count, set
  `Status: uncertain`, and state the single-source limit in `## Caveat`. *Why:* this is the honest capture
  the validator accepts (verified cite-check exit 0 end-to-end), and the fix belongs in the *guidance*, not
  in loosening a deliberately fail-closed safety gate (the rejected alternative — a `Status`-bypass in
  cite-check — would let any capture dodge the corroboration floor by self-labeling uncertain, and breaks
  the existing test). Surfaced as **Q3 (Open, To: architect)** for confirmation; the build is not left
  repeating a rule that produces a rejected entry. **The plan's Step-3 prose still carries the wrong rule —
  architect should patch it to match.**

- **Step 4 — improve-flow applied with a documented misfit (plan-pre-acknowledged, critic LOW).**
  *Plan said:* "Follow improve-flow … If improve-flow doesn't cleanly fit a direct feature edit, document
  the deviation and apply the AP2/AP3 discipline from `proven-patterns.md` directly." *Did:* invoked
  improve-flow; its core flow is the learner's project-bound-vs-plugin-bound promotion-list routing, which
  doesn't map onto a direct feature edit to a plugin rule file. Applied the parts that *do* fit — the ADR-1
  **dev-repo carve-out** (we ARE the plugin source repo, so the rule is edited directly, exactly as
  improve-skills states for shipped skills), plus improve-flow's read-fully / find-section / preserve-style
  / dedup steps and the AP3 one-owner discipline. *Why:* this is the plan's own sanctioned fallback for the
  known misfit; the edit is correct and minimal regardless of the skill's promotion-list framing.

## OPERATOR ACTION REQUIRED

These items could not be run to green by the developer at build time (build-time-unavailable resources) and
are owed to the team-lead / owner at commit time. Each resolves at done-check as **Deviated (valid reason)**,
not Missing — the open gate is surfaced, not silently passed.

1. **Step 5 — regenerate the `omni`/`omni-dotnet` twin (Q1, architect-ruled).** The `../omni` twin repo is
   **absent on this machine** (`D:\src\omni` and its `marketplace.json` verified absent; `gen-omni.mjs`
   hard-exits 1 when missing). The developer did the **in-repo half** of Step 5 only. The owner runs, at
   commit time:
   ```bash
   node scripts/gen-omni.mjs            # or: node scripts/gen-omni.mjs <path-to-omni> if cloned elsewhere
   node scripts/gen-omni.mjs --check    # must be in sync
   ```
   then commits the regenerated twin in the **separate `../omni` repo** with a message mirroring this nexus
   change (per CLAUDE.md's omni-twin commit convention). The developer neither has the twin present nor
   commits to it (hard rule).

2. **Step 3 — validate capture against ONE real `/deep-research` report (plan Step 3 operator-owed).** The
   developer validated the capture mapping against a **representative hand-built** sample report
   (cite-check exit 0). The plan's Open-Question ruling has the **owner run `/deep-research` once** on a
   sample question and share the report, so the capture can be validated against genuine built-in output
   (its exact layout may differ from the hand-built sample — the reshape is model-driven and robust to
   that, but a live confirmation closes the loop). Owed before the capture path is considered
   production-validated.

## Plan Coverage (every step accounted for)

| Step | Status | Done-conditions met |
|------|--------|---------------------|
| 1 — Rename `search-researches` → `research` | DONE | gate (Q2-effective) zero hits; skill-lint OK; cite-check 19 tests pass at new path |
| 2 — Depth-routing branch + `/deep-research` re-label | DONE | `external .deep-research` grep zero; routing chain stated; skill-lint OK |
| 3 — Capture path | DONE (1 deviation, Q3) | sample report → cite-check exit 0; skill-lint OK; **Q3 correction applied + open for architect**; live-report validation = OPERATOR ACTION |
| 4 — `research-before-asking` depth dial | DONE | zero `search-researches` in rules/; both engines named; no duplicated mechanics |
| 5 — Release (in-repo half, Q1) | DONE (gen-omni deferred) | MINOR 1.13.2→1.14.0; CHANGELOG new entry; full suite 224 pass; `research` `--strict`-clean; gen-commands no-diff; **gen-omni = OPERATOR ACTION** |

*Status: COMPLETE — developer, 2026-06-18*
