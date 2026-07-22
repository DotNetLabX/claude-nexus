# F12 — Workspace Self-Heal — Implementation

Scope implemented here: **Steps 1–3 only** (prose feature). Step 4 (release: bump + gen-commands
+ gen-omni + `plugin validate`) is the architect's at-close obligation, not a developer action —
not run here (plan Step 4; CLAUDE.md "never bump per-step").

## Files Created
- `plugins/nexus-analytics/skills/workspace-self-heal/SKILL.md` — the new skill owning the
  workspace contract and every heal/warn/default rule the analyst and siblings don't already own.
  Mirrors the shape/length of `fail-closed-intake/SKILL.md` and `answer-qa/SKILL.md`: frontmatter
  (`name` / `description` / `user-invocable: true`), short `##` sections, a `## What this skill
  does NOT do`, a `**Consumed by:**` line, the lessons-log pointer, and `## References`. Written as
  prose the analyst follows — no pseudo-code, no bash script-body (`mkdir -p` / `git check-ignore`
  appear only as illustrative inline examples, exactly as the plan's Step 1 phrases them).

## Files Modified
- `plugins/nexus-analytics/agents/data-analyst.md` — Step 2 rewire (see Step 2 entry below).
- `plugins/nexus-analytics/skills/answer-qa/SKILL.md` — Step 3 obligation #7 + enumeration sweep
  (see Step 3 entry below).

## Step-by-Step Conformance

### Step 1 — Author `workspace-self-heal/SKILL.md` — DONE
What I did: authored the new skill covering all five plan bullets —
- **Workspace contract** — `my-workspace/` at repo root, standard structure `exports/` (default
  landing) + `prompts/` (F13-owned behavior), co-residents named (`analyst-defaults.json` (F11),
  F13 prompts, F14 log) with this skill as the single owner of the *structure*.
- **Heal check (BR1/BR2/BR6, Flows 1–2)** — runs at session start AND before any workspace write;
  create-if-missing / idempotent (`mkdir -p` effect); never deletes/moves/renames/overwrites;
  never creates or edits the README; quiet when healthy, one-line note on creation; F11 overlap
  called out as intentional/safe.
- **Ignore-protection detection + warn-once (BR3/BR4, Flow 3)** — outcome-based detection
  (`git check-ignore -q`, `git ls-files --error-unmatch`), "never the exact wording"; warning
  fires on the **D3 pull-conflict condition only** (contents NOT ignored); README-tracked half
  detected but NOT an independent trigger (README-only-broken deliberately un-warned); exactly
  once per session, AM-facing, names the pull-conflict risk + the repo owner; non-git repo skips
  the warning (D6) but still heals folders; never edits `.gitignore` or any tracked file.
- **Default file location (BR5, Flow 4)** — no-named-location produced file lands in
  `my-workspace/exports/`; answer names the path (enforced by `answer-qa` #7); user-named location
  always wins; NOT a delivery destination; never bypasses the large-export gate; never changes
  F11's delivery resolution.
- **Heal failure reported, never silent (BR7)** — reports plainly and continues with what doesn't
  need the folder.
Plus `## What this skill does NOT do` carrying the hard exclusions.

Files: created `plugins/nexus-analytics/skills/workspace-self-heal/SKILL.md`.

Acceptance:
- `skill-lint.mjs plugins/nexus-analytics/skills/workspace-self-heal` → `OK    workspace-self-heal`,
  **exit 0** — PASS (born-compliant, ADR-23).
- All 9 grep groups the plan's Step 1 acceptance names — PASS:
  1. `exports/`+`prompts/` standard structure → lines 21–22 (+ description, exports refs) — PASS
  2. "session start" AND "before any write" heal timing → line 32 (`**at session start**` +
     `**again immediately before any write into**`) — PASS
  3. create-if-missing / "never deletes, moves, renames, or overwrites" → lines 34, 37 — PASS
  4. "never edits the repository's ignore file (`.gitignore`)" / "tracked file" → lines 75–76, 104 — PASS
  5. "exactly once per session" + pull-conflict + "repo owner" → lines 66–67 (+ 59, 71) — PASS
  6. `my-workspace/exports/` default + "not … delivery destination" + "never bypass … large-export
     gate" → lines 82, 87–90, 115 — PASS
  7. "Quiet when healthy" / "one-line note" → lines 41–42 — PASS
  8. heal-failure "reports … continues" → `## Heal failure is reported, never silent` + line 99 — PASS
  9. outcome detection `check-ignore` / `ls-files` / "never the exact wording" → lines 49, 54, 56 — PASS

### Step 2 — Rewire the data-analyst agent — DONE
What I did (all five plan Step-2 sub-edits to `plugins/nexus-analytics/agents/data-analyst.md`):
- Added `workspace-self-heal` to the `skills:` frontmatter (5th preloaded skill).
- Added a new **`## Workspace Self-Heal`** section placed **first** among the conversation-start
  behaviors (immediately before `## Batched-Interview Intake`): run the skill at conversation start,
  create missing folders (one-line note only on creation), warn **once** if ignore protection is
  absent, re-run the folder check before any workspace write, default no-location produced files to
  `my-workspace/exports/`, and it never edits `.gitignore`/tracked files (warns, never fixes). Cites
  the skill as owner of the mechanics rather than restating them.
- Added the `## Sibling Skills` 5th bullet for `workspace-self-heal` (folder self-heal / warn-once /
  default exports location one-liner).
- Added the `## What You Never Do` bullet: never edit `.gitignore` or any tracked file for a
  workspace purpose → warn the AM to ask the repo owner (per `workspace-self-heal`).
- **Enumeration sweep:** `## What You Know` "The four sibling skills above" → **"five"**; produced-file-path
  obligation added to **both** the `## Answer Contract` body **and** the frontmatter `description`,
  matching Step 3's item-7 wording.

Files: modified `plugins/nexus-analytics/agents/data-analyst.md`.

Acceptance greps (all PASS):
- frontmatter `skills:` includes `workspace-self-heal` → line 6 — PASS
- `## Workspace Self-Heal` heading names the skill + session-start heal + warn-once → lines 15/17/19 — PASS
- `## Sibling Skills` new one-liner → line 77 — PASS
- `## What You Never Do` never-edit-`.gitignore`/tracked-file line → line 100 (`or any tracked file
  for a workspace purpose`) — PASS
- `## What You Know` reads "five sibling skills" → line 84 — PASS; **no stale "four sibling" survives**
  (grep returned none) — PASS
- `## Answer Contract` body names the produced-file-path obligation → line 50 — PASS
- frontmatter `description` names the produced-file-path obligation → line 3 — PASS
- (`value-briefing/SKILL.md` "default accuracy flows" list deliberately NOT extended — plan
  Plan-Review HIGH-2(ii); confirmed untouched.)

### Step 3 — Extend the `answer-qa` contract with obligation #7 — DONE
What I did (to `plugins/nexus-analytics/skills/answer-qa/SKILL.md`):
- Appended a **7th** numbered item to `## The answer contract`: **Produced-file path** — a produced
  file's full path is named in the shipped answer (under `my-workspace/exports/` when the AM named no
  location); conditional like the others, vacuous when no file is produced. Cites `workspace-self-heal`
  as owner of *where* the file lands vs. this contract owning that the answer *names* it.
- **Enumeration sweep:** contract opener "All six items are required" → **"All seven items"**; added a
  produced-file clause to `## Malformed answers` (an answer that produced a file without naming its
  path is malformed); updated the frontmatter `description`'s obligation enumeration to include the
  produced-file path.

Files: modified `plugins/nexus-analytics/skills/answer-qa/SKILL.md`.

Acceptance (all PASS):
- `skill-lint.mjs plugins/nexus-analytics/skills/answer-qa` → `OK    answer-qa`, **exit 0** — PASS
  (stays green after the edit).
- 7th numbered obligation naming the produced-file path + `my-workspace/exports/` → line 37 (+ 39) — PASS
- "All seven items" replaces "All six items" in the opener → line 11 — PASS; **no stale "All six
  items" survives** (grep returned none) — PASS
- `## Malformed answers` produced-file-without-path clause → line 96 — PASS
- frontmatter `description` mentions the produced-file path → line 3 — PASS

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Plan Skill Mapping: `Skill: None` / `TDD: no` — new plugin-skill *prose*, no generative pattern skill authors this prose (identical posture to F11/F20); born-compliant via skill-lint. |
| 2 | None | Plan Skill Mapping: `Skill: None` / `TDD: no` — agent-prose edit. |
| 3 | None | Plan Skill Mapping: `Skill: None` / `TDD: no` — skill-prose edit. |

## Self-Review

**First-round prose review — verdict: PASS (no findings to fold).** Two parallel `general-purpose`
finder passes ran over the full F12 diff (this is a docs/prose-only diff — agent + skill prose, no
runtime source — so prose angles, not code angles). Both read the three changed files against the
plan (Steps 1–3, Decisions D1–D6, Plan-Review dispositions) and the spec (BR1–BR7, Flows 1–4, ACs).

**Finder A — internal consistency, dangling/broken cross-references, directional references. All
three angles CLEAN:**
- Counts: `data-analyst.md` reads "five sibling skills" (line 84) with `## Sibling Skills` carrying
  exactly 5 bullets; no stale "four" survives. `answer-qa` reads "All seven items" (line 11) over a
  genuine, correctly-sequenced 1–7 list; no stale "six" survives. All four answer-contract
  enumerations (data-analyst body + its frontmatter description; answer-qa frontmatter + `##
  Malformed answers`) carry the produced-file-path obligation.
- Non-stale ordinal confirmed: `answer-qa`'s "items 1–5 above" is correctly NOT made stale by item 7
  — items 1–5 are the substantive content obligations an *applied default* could coincide with; item
  7 (produced-file path) is a system output, not a user-supplied run-input, so the `1–5` bound holds.
- Cross-refs: every skill name referenced resolves to a real folder under `plugins/nexus-analytics/
  skills/`; the new skill's `name:` equals its folder; the `obligation #7` pointers resolve in both
  directions (workspace-self-heal ↔ answer-qa item 7).
- Directional refs: the top-of-file `## Workspace Self-Heal` insertion broke no "above"/"first"/
  "below" wording — "The five sibling skills above" still points correctly at `## Sibling Skills`.

**Finder B — dropped/narrowed guarantees vs plan/spec, cross-file guarantee consistency, stale
adjacent sentences. Angles D & E fully CLEAN:**
- BR1 (both triggers: session-start AND before-any-write), BR2 (never delete/move/rename/overwrite +
  never README), BR3 (never edits `.gitignore`/tracked file — stated absolutely, not hedged), BR4
  (exactly once, names pull-conflict risk + repo owner, fires on the D3 contents-NOT-ignored condition
  and is **not** inverted — a pull-safe contents-ignored repo is correctly not warned; README-tracked
  half detected but not an independent trigger; D6 non-git skip present), BR5 (default
  `my-workspace/exports/`, user-named always wins, "not a delivery destination", "never bypass the
  large-export gate" — present and **not softened**, never changes F11's resolution), BR6, BR7 — all
  carried at full strength. `## What this skill does NOT do` carries all seven hard exclusions.
- No cross-file contradiction: no file claims the plugin can fix `.gitignore`; no file treats the
  exports default as a delivery destination.

**Only flagged item — DISMISSED (out of developer scope):** Finder B (Angle F) noted the *generated*
`plugins/nexus-analytics/commands/data-analyst.md` is stale (still "four", missing the new bullets/
section). This is a `scripts/gen-commands.mjs` artifact regenerated at **Step 4** (`gen-commands.mjs
nexus-analytics`), which is the architect's at-close obligation and explicitly NOT in my Steps-1–3
scope. Not a prose defect — expected to be stale until Step 4 runs. Dismissed with reason; carried
over below so it is not forgotten. Both finders also confirmed `fail-closed-intake` (D2) and
`value-briefing` (HIGH-2(ii)) were correctly left untouched.

## Behavioral AC Coverage (consumer-side)

Per the plan's Testing Strategy, this is a prose-only diff with **no unit-test surface** (F11/F20
precedent); the executed gates are the per-step acceptance greps + shipped skill-lint (both green)
+ `claude plugin validate --strict` (a Step-4 gate, architect at close). Behavioral coverage of the
eight acceptance criteria (AC-1…AC-8) is a **live analyst-session concern in the consuming repo
(omnishelf-analytics)** — the plugin ships the behavior, the consumer exercises it (e.g. AC-1
fresh-clone folder creation, AC-3 one-warning-per-session, AC-4 byte-identical ignore file). This is
consumer-side coverage, **not** a missing plugin test. **AC-5 and AC-6 are vacuous in the plugin
today** — there is no shipped export flow that produces a file and no plugin-side large-export gate;
the rules ship forward-looking (spec AC-5 explicitly allows vacuous satisfaction).

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Generated command file stale until Step 4 | low | architect | `plugins/nexus-analytics/commands/data-analyst.md:70` still "four sibling skills"; no `## Workspace Self-Heal`; `skills:` line lacks `workspace-self-heal` | Expected — regenerated by `node scripts/gen-commands.mjs nexus-analytics` at Step 4 (frontmatter `skills:` changed). Flagged so the regen isn't skipped at lane close. |

## Deviations from Plan
- **None in the implemented scope (Steps 1–3).** All three source edits landed exactly as the plan
  specified; no pattern skill was mapped (`Skill: None` all steps), no fallback fired.
- **Pre-existing working-tree change NOT introduced by me — architect-owned:**
  `docs/specs/F12-AnalyticsWorkspaceSelfHeal/definition/spec.md` shows one modified line
  (`**Plan:** None` → `**Plan:** docs/.../delivery/plan.md`). I only Read that file (non-mutating);
  this is the architect's plan-creation spec-pointer update. The developer never edits a spec and I
  performed no git writes, so I left it exactly as-is — documented here so the done-check does not
  attribute it to F12 implementation.
- **Plan-sanctioned non-edits (not deviations, recorded for the done-check):** `fail-closed-intake/
  SKILL.md` deliberately not edited (create-if-missing overlap left in place, plan D2);
  `value-briefing/SKILL.md` "default accuracy flows" list deliberately not extended (workspace-self-heal
  is hygiene, not an accuracy flow — plan Plan-Review HIGH-2(ii)). Both confirmed untouched.

*Status: COMPLETE — developer, 2026-07-22*
