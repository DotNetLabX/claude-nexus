# F5-SkillGapCapture — Summary

**Mode: architect-led fast lane**

## Status: COMPLETE

## What Was Built

Skill gaps were being **detected** reliably and **captured** unreliably. `lessons-format`'s `## Skill
Gaps` section now owns a fielded entry template (`Kind` / `Searched for` / `Why it would help` /
`References` / `Evidence`), and every other surface references it instead of restating it — collapsing
the four scattered "log the gap" phrasings that let the architect's own detections die in a plan column
the learner never reads. Solo gained the lessons mandate it never had; the plan template's `Gap?` column
gained a two-value vocabulary so the leak is measurable with one grep. Definition: **ADR-59**
(ADR-25 collapsed, F2 precedent).

## Key Outcomes

- **12 files modified**, 1 ADR added, 1 backlog row added, across 8 plan steps.
- **`nexus` 1.34.5 → 1.34.6** (PATCH — the owner may escalate to MINOR; see Notes).
- **Done-check: PASS** — 8/8 steps Implemented; 0 Missing, 0 Deviated. Every pinned Accept grep
  re-executed independently by the architect, not taken from the self-report. Both `skill-lint` gates
  exit 0; `claude plugin validate` passed.
- **Skill conformance: PASS** — 3 scoped log entries (`improve-skills` ×2, `release-plugin` ×1) matching
  the plan's 3 non-`None` mappings. No fabrication.
- **Plan review: code-grounded critic, NO-GO → 4 HIGH / 4 MEDIUM / 2 LOW, all folded** before dispatch.
  Every HIGH was findable only by reading live source — including a `## Skill Gaps` heading nested inside
  a fenced block (both candidate implementations would have passed the gates, one shipping broken
  markdown `skill-lint` cannot detect) and an acceptance gate that stayed green on the exact deletion it
  existed to prevent.
- **Developer self-review: PASS** — 2 parallel prose-angle finder passes, 3 real findings (2 fixed
  in-place, 1 carried to the architect), 0 false positives.
- **Dogfooded:** the run logged its own gap ("no skill covers editing a shipped agent file in the dev
  repo") using the template it had just authored. The developer reports the template was easy to fill.

## Deviations from Plan

None. All 8 steps implemented as written.

## Notes

**Three things to know before committing — nothing here is committed yet.**

1. **Nothing is committed and the bump is live in the tree.** `plugin.json` reads `1.34.6` in the working
   tree with no commit behind it. That is a known hazard: `bump-plugin.mjs` classifies the whole tree
   against HEAD, so **any other feature that runs a bump before this is committed will double-count F5's
   files.** Commit or revert before starting unrelated plugin work.
2. **Two open owner decisions**, both cheap to reverse, both recorded in `plan.md` `## Decisions` /
   `review.md`:
   - **The `Gap?` column vocabulary** (Step 5) was an architect expansion beyond the owner's selected
     5-file scope, made on evidence the owner didn't have at scope time (the column carries five
     incompatible vocabularies across 33 plans, which is *why* the leak resisted counting).
   - **The ill-fitting field gap** — the shipped template drops the old `developer.md:158` ill-fitting
     case's "what didn't fit" sub-field. Real but narrow: "which skill" survives via the entry heading and
     "what you did instead" via `Why it would help`. Costs `improve-skills`' `Kind: ill-fitting` branch,
     whose feedback entry wants "the skill + section".
3. **PATCH vs MINOR** is the owner's call. `bump-plugin.mjs` proposes PATCH by default and never
   auto-escalates; solo gaining a lessons mandate is the one change here arguable as new capability.
4. **The `../omni` twin is not synced** — deliberately out of scope, owner-run after this lands
   (CLAUDE.md).
5. **`F1-NotesPlugin` is leaking right now** — out of F5's scope. It is `In Progress` and its plan
   declares "No scaffold skill for marketplace plugins — log to lessons.md" with no `## Skill Gaps`
   section. Recoverable by its own run.
6. **A PASS here does not prove agents will now log gaps** — that is deferred by construction and shows
   up in the next few runs' `lessons.md`. Baseline to beat: 4-of-11 directed gaps leaked, plus ≥6
   undirected.
7. **`selfcheck` reports 3/5 — both failures are pre-existing or expected, neither is F5's.** Verified,
   not assumed:
   - `gen-omni --check` — **expected mid-feature** (the check says so itself): the twin syncs
     post-commit, ADR-6. Genuine only if it persists after the closure commit.
   - `tests (lint + unit) — 1 failing`: `C.4: team-lead.md names the salvage script as a designed
     recovery leg, before any re-ask` (`tests/lint/enforcement.test.mjs:55`). **F5 never touched
     `team-lead.md`** (clean vs HEAD), and the test fails at HEAD independently — first `/salvage/i` at
     char 5660, first `/re-ask/i` at char 2690, so `salvageAt < reAskAt` is false.
     **This is a pre-existing broken gate on `main`, and the test looks wrong rather than the file:**
     the Relay Contract does order salvage before re-ask correctly; the test's naive whole-file
     `search()` heuristic is tripped by an *earlier, unrelated* "re-ask" mention (`team-lead.md:26`, a
     confidence-label rule). `team-lead.md` was last touched by F4-ResearchBoostedAsks (1.33.0).
     **Owner action: worth its own fix — the assertion should scope to the Relay Contract section, not
     the whole file.** Out of F5's scope; not fixed here.
