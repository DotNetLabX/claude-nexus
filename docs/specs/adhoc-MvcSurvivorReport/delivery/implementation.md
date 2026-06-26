# adhoc-MvcSurvivorReport — Implementation

Structured survivor classification in the Mine→Verify→Cover Report stage, plus making the Dart/Flutter
reference harness demonstrate the corrected summary-scoring + survivor-count cross-check contract.

Plan: `docs/specs/adhoc-MvcSurvivorReport/delivery/plan.md` (rev 2). Team mode: standard+codex (no self-review).
Q1/Q2 proceeded on their recorded proceed-defaults (dedicated `equivalentLoggingLines` arg; classify spawn
gated on residual survivors).

## Files Created
- _(none — Step 5 added test slices to the existing `tests/unit/workflow-contract.test.mjs`.)_

## Files Modified
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — **Step 1.** Added a stack-neutral `## The Report stage — survivor classification` section after the anti-fake-green invariant: a table naming all 5 tags + their assignment owner (orchestrator pre-tags only `equivalent-logging` against an adapter log-line signal; `equivalent-format`/`dead-code`/`masked`/`REAL-gap` are assigned by a classify-survivors agent with source+KB access, orchestrator records only), the REAL-gap-only-iterates rule, final-iteration classification authority, implied-cleanups (`file:line`), and the `expectedSurvivorLines` suggestion. Additive per F5 — references the 1.18.5 invariant without restating it; `## Model` untouched.
- `plugins/nexus/.claude-plugin/plugin.json` + `plugins/nexus/CHANGELOG.md` — **Step 1.** PATCH bump 1.18.5 → 1.18.6 via `scripts/bump-plugin.mjs`; CHANGELOG top entry rewritten descriptively.
- `plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md` — **Step 2.** Added a `### Survivor tags — Dart cues` subsection inside the equivalent-mutant filter: maps the method's 5 tags to Dart cues, marks `equivalent-logging` as the only orchestrator-pre-taggable tag and specifies the adapter must surface the log-call line numbers as an `equivalentLoggingLines` set (distinct from `expectedSurvivorLines`), and lists the Dart cue per agent-assigned tag with live examples (BuildZpl, CycleCount, POG `goPreviousStep`).
- `plugins/nexus-flutter/.claude-plugin/plugin.json` + `plugins/nexus-flutter/CHANGELOG.md` — **Step 2.** PATCH bump 0.1.1 → 0.1.2; CHANGELOG entry rewritten and the misplaced "All notable changes" header line restored.
- `harness/cover-flutter.workflow.js` — **Steps 3 + 4.** (Step 3) Header §3 records the intentional Dart divergence (F6). `mutationFloor` rewritten to score from the stdout summary (`reachable = found − notCovered`; `killed = reachableDenominator − reachableSurvivors.length`) instead of counting the mutant array — removed the now-dead `DENOMINATOR_STATUSES`. `RUNNER_RESULT_SCHEMA` gains a required `mutationSummary { found, undetected, timeouts, notCovered }`; the `mutants` array is documented/treated as **survivors-only**. The runner prompt now parses the summary and returns survivors-only (the "treat all others as Killed" fabrication instruction removed). The loop adds an early-`break` **survivor-count cross-check** (`summary.undetected === mutants.length` → `stopped:'mutant-count-mismatch'`), and the `mutationReport` wrapper was dropped (gate now takes `summary, survivors` directly). (Step 4) Added `EQUIVALENT_LOGGING_LINES` arg (Q1, default `[]`), a pure `pretagEquivalentLogging` helper + `VOID_CALL_REMOVAL_RE`, and the pre-tag is applied when building `reachableSurvivors` (tag stays in the entry — the tag-seam data-flow); forwarded into the gate call.
- `harness/loop-flutter.workflow.js` — **Step 4.** Added `EQUIVALENT_LOGGING_LINES` arg + forwards it to cover-flutter. Added `CLASSIFY_SURVIVORS_SCHEMA` (tag enum = the 4 source-dependent tags) + `classifySurvivorsPrompt`. In the Report phase, after the KB flip, spawns ONE sonnet `classify-survivors` agent gated on residual survivors (Q2), passing only the **un-pre-tagged** survivors; merges pre-tags + the agent's verdicts into a tagged list. The report's Residual Survivors section now renders each survivor's tag + the final-iteration authority note, an `## Implied cleanups` subsection (`dead-code` + equivalent survivors as `file:line`), and an `expectedSurvivorLines: [...]` suggestion. Machine return keeps the raw `reachableSurvivors` (classifications are report-only).
- `tests/unit/workflow-contract.test.mjs` — **Step 5.** Updated slice 9e to the new contract (survivors-only `mutants` + `mutationSummary`; F3). Added 8 slices: summary-scoring → 77% (with an `expectedSurvivorLines` exclusion case → 89%), BuildZpl 90% / CycleCount 94% reproduction, the cross-check HALT on iteration 1, the pre-tagger (positive + the line-alone-not-enough negative), and the loop-flutter populated-survivor classify path (agent spawned, schema enum constrained to the 4 source-dependent tags, report renders tags + cleanups + suggestion). 9f needed no change (see Deviations). F7: scoped green gate to the changed file.

## Key Decisions
- **Single bump-tool invocation for both plugins (Steps 1+2).** `bump-plugin.mjs` classifies the whole working tree and bumps every changed plugin in one pass. Running it after each skill edit would re-detect the still-changed nexus skill and double-bump nexus (→ 1.18.7). So both skill edits landed first, then one bump produced exactly nexus 1.18.5→1.18.6 and nexus-flutter 0.1.1→0.1.2 (verified by `--dry-run`). End state matches the plan's per-step acceptance.
- **`equivalentLoggingLines` (pre-tag signal) is separate from `expectedSurvivorLines` (denominator exclusion)** — Q1 proceed-default. An excluded line never reaches the tag seam; a pre-tagged `equivalent-logging` survivor STAYS in `reachableSurvivors` (so the report can suggest excluding it). Default `[]`.
- **Void-call-removal detection is tolerant across tool naming** — `VOID_CALL_REMOVAL_RE = /remove[\W_]*void[\W_]*call/i` matches `removeVoidCall`, `remove_void_call`, and `cxx_remove_void_call`.
- **classify spawn gated on `survivors.length > 0 && toClassify.length > 0`** — Q2 proceed-default (`residualSurvivors.length > 0`) with a strict refinement: also skip the agent when every survivor is already pre-tagged (nothing source-dependent to classify). In every tested path the two are equivalent (a run never has all survivors as void-call-removals on log lines); 9f's empty-survivor path skips the spawn either way.
- **Killed is derived, never enumerated.** The runner returns survivors-only `mutants`; the gate derives `killed` from the summary. This is what lets the cross-check (`undetected === mutants.length`) be satisfiable from the tool's real output without fabricating Killed entries (the critic's F2).

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | skill-doc edit (plan: Skill None, TDD no) |
| 2 | None | skill-doc edit (plan: Skill None, TDD no) |
| 3 | tdd | plan: Skill None, TDD yes — paired with Step 5; drove red (9e) → green |
| 4 | tdd | plan: Skill None, TDD yes — paired with Step 5 |
| 5 | tdd | plan: Skill tdd, TDD yes — wrote/updated the proving slices |

`tdd` was invoked once (loaded for the Steps 3-5 paired TDD work) and applied across all three; the red→green
was driven at the contract-suite level (9e went red after Step 3's scoring change, green after Step 5's F3 update).

## Deviations from Plan
- **CHANGELOG entries hand-refined after the bump tool wrote them.** The tool seeds a generic `- PATCH bump.` line; per CLAUDE.md (audit B8) I rewrote each top entry descriptively. CHANGELOG.md is a generated-seed artifact, not hand-edit-forbidden.
- **Slice 9f's cover mock NOT given a `mutationSummary` (F3 said to).** F3 asks to add `mutationSummary` to both 9e and 9f's cover-shaped mocks. 9e genuinely needs it (it runs the REAL cover-flutter, so the new required field + scoring apply). 9f runs the REAL loop-flutter but **mocks the cover-flutter sub-workflow**, and loop-flutter never reads `coverResult.mutationSummary` — so adding the field would be dead, and a green all-gates coverResult carries no top-level `mutationSummary` in reality. 9f stays green unchanged (verified). F3's intent ("stay green under the new gate") is satisfied; the literal text is a no-op for 9f because the gate lives inside the mocked sub-workflow.
- **`tdd` red phase is at the suite level, not per-micro-test.** The plan sequences impl (3-4) before tests (5) and marks them paired; I implemented the scoring/seam, captured the suite-level red (9e), then wrote/updated Step-5 slices to green. No production behavior was written without a proving slice in the same round.

## Fix-cycle 1/3 (REQUEST CHANGES — 4 findings + SKILL reconciliation)

Step-2 review (reviewer + Codex, architect-adjudicated) returned 4 findings; all addressed. **No new bump** — the existing uncommitted 1.18.6 covers the shipped SKILL.md edit. Scoped gate re-run **43/43 green** (41 + 2 new slices).

- **F1 (HIGH) — the re-feed leaked pre-tagged equivalents.** `harness/cover-flutter.workflow.js` (~460) — the next-iteration re-feed now withholds pre-tagged survivors: `survivingMutants = reachableSurvivors.filter((s) => !s.tag)`. The denominator is untouched (a pre-tagged `equivalent-logging` survivor stays SCORED — the intended two-tier suggestion-vs-confirmed design); only the re-feed is filtered, so the Cover agent never chases an orchestrator-recognized equivalent. The cap-reached result keeps the FULL residual list (intermediate `const reachableSurvivors`) so the report/classifier still see every survivor.
- **F2 (HIGH) — classify verdicts collided per source line.** `harness/loop-flutter.workflow.js` — verdicts are now keyed PER-SURVIVOR by `index`, not by line (two survivors on one line no longer overwrite each other, last-verdict-wins). `CLASSIFY_SURVIVORS_SCHEMA` gains a required `index`; `classifySurvivorsPrompt` numbers each survivor (`index N | line …`) and instructs the agent to echo it back; the merge keys a `classifyByIndex` map and walks survivors with a running counter (filter preserves order, so the counter recovers each `toClassify` index — no object-identity reliance, cross-vm-context safe).
- **F4 (LOW) — silent `unclassified` default.** `harness/loop-flutter.workflow.js` — `reason` is now required in the schema; the no-verdict path is an explicit, **logged** `unclassified` terminal state (`log('WARNING (classify): no verdict for residual survivor #idx …')`), never a silent default and never `REAL-gap`.
- **F3 (LOW) — folded into F1; honest end-to-end slices.** `tests/unit/workflow-contract.test.mjs` — two new slices prove the REAL seam (not an injected pre-tagged coverResult):
  - *9f-3 — F1 re-feed (REAL cover-flutter, 2 iterations):* a genuine `equivalentLoggingLines`→pre-tag→re-feed run; asserts the iter-2 Cover prompt re-feeds the un-pre-tagged line 60 but WITHHOLDS the pre-tagged line 50.
  - *9f-4 — F1/F2 end-to-end seam (REAL cover-flutter → REAL loop-flutter):* the genuine cover pre-tag is fed into loop-flutter (no hand-set `tag`); asserts (a) the genuine line-50 pre-tag is withheld from the classify agent, and (b) TWO survivors on line 60 get DISTINCT verdicts (masked vs REAL-gap) — proving per-survivor index keying.
  - Slice 9f-2 updated: its classify fixture now echoes `index` (0/1) so it stays green under the new keying.
- **Item 5 — SKILL.md reconciliation (no new bump).** `plugins/nexus/skills/mine-verify-cover/SKILL.md:68` — reconciled "Only `REAL-gap` drives another Cover iteration" with the orchestrator's real mid-loop capability (mid-loop it filters only its own `equivalent-logging` pre-tags; the full REAL-gap-only rule is a Report-stage / follow-up-run property, not a per-iteration filter). Documented `unclassified` as the agent-non-response terminal state, and aligned the prior line-66 wording (now "untagged" for the pre-agent hand-off, reserving `unclassified` for the terminal state). `plugins/nexus/CHANGELOG.md` 1.18.6 entry softened to match — **no version change**.

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| 4 pre-existing full-suite failures (gen-omni ×3, nexus-cpp release ×1) | low | reviewer | full glob = 358 tests / 4 fail; same 4 the architect measured at Phase 1 (then 350/4). `gen-omni.test.mjs:1` runs against SYNTHETIC sandboxes (not the live twin), so the version bumps cannot affect them; `nexus-cpp/CHANGELOG.md` top entry is unbracketed (`## 0.1.0`) vs the lint's `## [X.Y.Z]`. | NOT introduced here — plan lists both out of scope (F7 / Out of scope). My 8 new slices all pass; scoped gate `workflow-contract.test.mjs` = 41/41 green. |
| Omni twin is now out of sync (versions bumped, twin not regenerated) | low | architect | nexus→1.18.6, nexus-flutter→0.1.2; `gen-omni.mjs` mirrors both skills | Deliberate — plan defers the omni regen to merge (Out of scope). Flagging so the merge step runs `gen-omni.mjs` + the mirrored-commit convention. |

## Verification
- `node --test tests/unit/workflow-contract.test.mjs` → **43/43 green** (33 baseline + 8 Step-5 + 2 fix-cycle slices).
- `node --test tests/lint/*.test.mjs` → 45/46 (the 1 failure is the pre-existing nexus-cpp CHANGELOG — out of scope, see carry-over).
- `node --check` clean on both modified workflow scripts; meta-purity + no-static-import + sandbox slices green.
- `bump-plugin.mjs --dry-run`: working-tree versions remain **nexus 1.18.6 / nexus-flutter 0.1.2** (the existing bumps). The dry-run *proposes* `1.18.6→1.18.7` and `0.1.2→0.1.3` only because the tool always offers `current+1` for any plugin file dirty-vs-HEAD (the whole feature is uncommitted, HEAD = 1.18.5/0.1.1) — that proposal was **NOT applied**. Per the fix-list, the existing 1.18.6 covers the SKILL.md reconciliation; omni twin regen still deferred to merge.

*Status: COMPLETE (fix-cycle 1/3 applied) — developer, 2026-06-26*
