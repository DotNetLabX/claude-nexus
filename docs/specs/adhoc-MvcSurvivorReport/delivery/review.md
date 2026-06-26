# adhoc-MvcSurvivorReport — Review

## Step 1 — Done-Check

**Pre-commitment predictions (before reading implementation.md):** given the plan's redesigned Steps 3–4 (summary-scoring arithmetic + agent seam) and the F3 dual-mock update, the two most likely gaps were (a) the survivor-count cross-check not being a true early-`break` HALT, and (b) one of the two cover-shaped test mocks (9e/9f) not updated for the new required `mutationSummary` field. Prediction (b) hit — 9f was deliberately left unchanged; judged below.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Method: survivor-classification taxonomy + Report-stage spec | Implemented | `mine-verify-cover/SKILL.md` gains the stack-neutral Report-stage section: all 5 tags + per-tag assignment owner, REAL-gap-only-iterates rule, final-iteration authority, implied-cleanups (`file:line`), `expectedSurvivorLines` suggestion. Additive per F5 (1.18.5 invariant referenced, not restated). nexus 1.18.5 → **1.18.6** (plugin.json confirmed). |
| 2 — Adapter: Dart patterns mapped to taxonomy | Implemented | `mine-verify-cover-flutter/SKILL.md` adds the Survivor-tags subsection: 5 tags → Dart cues, `equivalent-logging` marked as the only orchestrator-pre-taggable tag with an `equivalentLoggingLines` log-line signal, live examples (BuildZpl / CycleCount / POG `goPreviousStep`). nexus-flutter 0.1.1 → **0.1.2** (confirmed). |
| 3 — Reference impl: rescore from summary + survivor-count cross-check + HALT | Implemented | `cover-flutter.workflow.js`: `mutationSummary {found,undetected,timeouts,notCovered}` added to `RUNNER_RESULT_SCHEMA` + `required`; `mutationFloor` rescored from the summary (`reachable = found − notCovered`; `killed = reachableDenominator − reachableSurvivors.length`); survivor-count cross-check early-`break` → `stopped:'mutant-count-mismatch'`; F6 header divergence note present. BuildZpl 90% / CycleCount 94% reproduced in the contract suite. |
| 4 — Survivor classification: pre-tag + classify-survivors agent + report emission | Implemented | `cover-flutter.workflow.js`: pure `pretagEquivalentLogging` + `VOID_CALL_REMOVAL_RE`, `EQUIVALENT_LOGGING_LINES` arg, tag carried on `reachableSurvivors` (the data-flow seam). `loop-flutter.workflow.js`: `CLASSIFY_SURVIVORS_SCHEMA` (4-tag enum), sonnet `classify-survivors` agent gated on residual survivors, report renders tagged survivors + `## Implied cleanups` + `expectedSurvivorLines` suggestion; machine return keeps raw `reachableSurvivors`. |
| 5 — Contract tests | Deviated (valid reason) | 8 new slices added (9e-2..9e-7, 9f-2 + the summary-scoring/cross-check/pretag cases); slice 9e updated to the survivors-only + `mutationSummary` contract; scoped gate **41/41 green** (33 baseline + 8). **Slice 9f intentionally left unchanged** vs F3's literal text — judged below. |

### Judgment 1 — Slice 9f left unchanged (plan Step 5 / F3): acceptable deviation, NOT Missing

F3's literal instruction was to add `mutationSummary` to **both** 9e and 9f's cover-shaped mocks "so they stay green under the new gate." 9e was updated (it runs the real cover-flutter, so the new required field + scoring genuinely apply). 9f was left unchanged. Verified the developer's reasoning against live source:
- **`grep mutationSummary harness/loop-flutter.workflow.js` → zero matches.** loop-flutter never reads `coverResult.mutationSummary`; the new cross-check gate lives **inside** cover-flutter, which 9f **mocks**. Adding the field to 9f's mock would be dead data, and a real green all-gates `coverResult` carries no top-level `mutationSummary`.
- 9f runs green unchanged (it is one of the 41/41).

F3's **intent** ("stay green under the new gate") is delivered; its **literal text** is a verified no-op for 9f because the gate is inside the mocked sub-workflow. This is `Deviated (valid reason)` — a hedge in the plan (F3 assumed 9f's mock needed the field) correctly resolved against actual source. Not Missing: the substantive obligation is met and 9f is green.

### Judgment 2 — Session verify gate fail introduces NO new failure vs baseline (confirmed)

The session verify gate recorded a blocking fail on the full unit suite + selfcheck. Re-ran here to separate pre-existing from introduced:
- **Full suite: 358 tests / 354 pass / 4 fail.** The 4 failures are exactly: gen-omni ×3 (`--check` drift-detection, `apply` mirror+token-swap, `refuses MIT README after overrides`) + nexus-cpp ×1 (`plugin.json valid / CHANGELOG top entry matches version` — unbracketed `## 0.1.0`).
- **Structurally independent of every touched file.** gen-omni tests run against **synthetic sandboxes**, not the live twin — the nexus/nexus-flutter version bumps cannot reach them. nexus-cpp was **not touched** by this change at all.
- **Delta vs Phase-1 baseline (zero changes): 350/4 → 358/4.** Exactly +8 tests, all 8 passing; the 4 failures are unchanged in identity and count. 0 new failures introduced.
- The changed file's **scoped gate is 41/41 green**; all 8 new slices pass.

The verify gate's blocking fail is entirely the 4 pre-existing, out-of-scope failures (plan F7 / Out of scope). **Confirmed: the implementation introduced no new failure versus the pre-existing baseline.**

### Skill conformance (scored against `.claude/audit/skill-invocations.log`)

- Scoped to this developer run (session `9a804a87…`, agent `developer`, token `developer:implement`): one logged invocation — `nexus:tdd` (2026-06-26T08:39:55Z).
- Plan maps `tdd` on the TDD:yes steps 3–5; Steps 1–2 are `Skill: None` / `TDD: no` (no skill expected). The single logged `tdd` invocation satisfies the mapping — `tdd` is loaded once and applied across the paired Steps 3–5 (consistent with the `## Skills Used` self-report). No fabrication: every self-reported invocation appears in the log; `## Skills Used` section present.

### Carry-over (out-of-scope, flagged for downstream)
- 4 pre-existing full-suite failures (gen-omni ×3, nexus-cpp ×1) — NOT introduced here; plan lists both out of scope.
- Omni twin out of sync (nexus→1.18.6, nexus-flutter→0.1.2; twin not regenerated) — deliberate; plan defers `gen-omni.mjs` regen + mirrored-commit convention to the merge step. Team lead to run it before/at close.

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-06-26*

## Step 2 — Code Review

## Reviewed By
Reviewer (nexus:reviewer) — cycle 1/3 re-review after fix-cycle 1. Verified all four adjudicated findings (F1/F2/F4/F3) plus SKILL.md reconciliation against live source and fresh test run.

## Verdict: APPROVED

## Pre-commitment Predictions (cycle 1 re-review)

Targeted the two paths the first pass missed (adjudication F1 + F2) and the adjacent call sites:
- **F1 re-feed filter** — expected `survivingMutants = reachableSurvivors.filter((s) => !s.tag)` at the right point, denominator unchanged, cap-reached using the full list. Found: confirmed correct.
- **F2 per-survivor index keying** — expected `required: ['index', ...]` in schema, counter-based merge avoiding line-key collision. Found: confirmed correct.
- **F4 explicit unclassified** — expected `reason` in required, logged terminal state. Found: confirmed correct.
- **Adjacent regressions** — `all-gates-green` break still fires before the re-feed line (no change to that path), cap-reached uses `reachableSurvivors` (full list, not filtered). Found: both correct.

## Findings

No CRITICAL or HIGH findings. All adjudicated findings resolved.

## Fix Verification

### F1 (HIGH) — re-feed filter applied, denominator preserved, cap-reached full list

`harness/cover-flutter.workflow.js:466-470`:
```
const reachableSurvivors = gates.mutation_floor.detail.reachableSurvivors
survivingMutants = reachableSurvivors.filter((s) => !s.tag)

if (iter === MAX_ITERATIONS) {
  result = { stopped: 'cap-reached', iter, gates, achievedScore: score, reachableSurvivors }
}
```

Verified: `survivingMutants` carries only un-pre-tagged survivors → Cover agent never chases a known-equivalent mutant. `mutationFloor` unchanged → pre-tagged equivalent-logging survivor stays scored in the denominator (two-tier design preserved). `result.reachableSurvivors` on cap-reached is the FULL list (not filtered) → loop-flutter's Report phase classifies all survivors. `all-gates-green` break at `:455` fires before the re-feed lines → that path unaffected.

Test 9f-3 (line 966) drives `equivalentLoggingLines → cover-flutter pre-tag → 2-iteration run` and asserts iter-2's Cover prompt contains `line 60` (REAL) and does NOT contain `line 50` (pre-tagged equivalent-logging). Green ✓.

### F2 (HIGH) — per-survivor index keying, two-on-one-line distinct verdicts

`harness/loop-flutter.workflow.js:181-200, 201-229, 270-292`:

- `CLASSIFY_SURVIVORS_SCHEMA` items: `required: ['index', 'line', 'tag', 'reason']` — agent must echo `index`.
- `classifySurvivorsPrompt`: numbers each entry `index ${i} | line ${s.line}: ...` so the agent sees a stable identifier independent of line number.
- Merge: `classifyByIndex = new Map()` keyed by `c.index`; `let nextClassifyIndex = 0` counter increments only for un-pre-tagged entries, recovering the `toClassify[i]` → agent index mapping. Order-stable: `filter` preserves `survivors` order → counter assigns indices in the same order the prompt presented them.
- No-verdict path (`!c`): logs warning, returns `tag: 'unclassified'` — never silent, never REAL-gap.

Trace of 9f-4's two-on-one-line scenario: `survivors = [pre50, log60a, replaceFirst60b, cond70]` → `toClassify = [log60a (idx=0), replaceFirst60b (idx=1), cond70 (idx=2)]` → merge: pre50 skips counter; log60a → idx=0 → `masked`; replaceFirst60b → idx=1 → `REAL-gap`; cond70 → idx=2 → `dead-code`. Report renders two distinct entries for line 60. Under the old line key: `classifyByLine.set(60, masked)` then overwritten by `classifyByLine.set(60, REAL-gap)` → both rendered as REAL-gap. Fix eliminates the collision.

Test 9f-4 (line 1003) runs the real cover-flutter pre-tagger and feeds the genuine coverResult into real loop-flutter; asserts: `index 0 | line 60` and `index 1 | line 60` in classify prompt (distinct); report contains `Line 60: logical.and ... **masked**` AND `Line 60: replaceFirst ... **REAL-gap**` (no clobber). Green ✓.

Test 9f-2 updated: classify fixture now echoes `index: 0` / `index: 1`, stays green under the new schema. ✓

### F4 (LOW) — `reason` required, `unclassified` explicit and logged

`loop-flutter.workflow.js:195`: `required: ['index', 'line', 'tag', 'reason']` — `reason` present.

`loop-flutter.workflow.js:285-290`:
```
if (!c) {
  log(`WARNING (classify): no verdict for residual survivor #${idx} (line ${s.line}, ${s.mutatorName}) — recording tag 'unclassified' ...`)
  return { ..., tag: 'unclassified' }
}
```

Never silent, never defaults to REAL-gap. SKILL.md:70 documents `unclassified` as the terminal state for agent non-response.

### F3 (LOW) — seam slices cover the real path

9f-3 proves `equivalentLoggingLines → cover-flutter pre-tag → re-feed filter` at the genuine seam (not an injected tag). 9f-4 proves `cover-flutter pre-tag → loop-flutter classify withhold + two-on-one-line distinct verdicts` end-to-end. Both new, both green. ✓

### SKILL.md reconciliation

`plugins/nexus/skills/mine-verify-cover/SKILL.md:66-70`:
- Line 66: orchestrator pre-tags only `equivalent-logging` via adapter signal; without that signal the survivor stays *untagged* (not `REAL-gap`) and is handed to the classify agent.
- Line 68: two-tier re-feed filter correctly documented — mid-loop the orchestrator withholds only its own `equivalent-logging` pre-tags; the "only REAL-gap is worth chasing" rule is a Report-stage / follow-up-run property, not a per-iteration filter. Prior wording reconciled with the actual implementation.
- Line 70: `unclassified` documented as the agent-non-response terminal state, loud/logged, never silently defaulted.

No version bump applied (fits within existing uncommitted 1.18.6 as adjudicated). ✓

## Carry-Over Findings (implementation.md)

| Finding | Status |
|---------|--------|
| 4 pre-existing full-suite failures (gen-omni ×3, nexus-cpp ×1) | **Confirmed pre-existing.** 43/43 scoped gate green; pre-existing failures unchanged in identity and count. |
| Omni twin out of sync | **Confirmed deliberate.** Deferred to merge per plan. |

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Contract suite (scoped) | PASS | `node --test tests/unit/workflow-contract.test.mjs` | **43/43 green** (33 baseline + 8 Step-5 + 2 fix-cycle slices) |
| Syntax check | PASS | `node --check harness/cover-flutter.workflow.js harness/loop-flutter.workflow.js` | Clean (SYNTAX_OK) |

*Status: COMPLETE — reviewer, 2026-06-26*

## Step 2 — Conflict Adjudication

**Context:** the nexus reviewer (above) returned APPROVED (no CRITICAL/HIGH); the Codex cross-check (`review-codex.md`) returned NO-GO. Team lead confirmed the code mechanisms and asked the architect to rule each finding REAL vs INTENDED. Every Codex line citation was re-verified against live source — all accurate; this is **not** a fabricated-schema cross-check (cf. the prior Codex-fabrication case), Codex read the real code. Codex could not run the suite (`spawn EPERM`); the suite is independently confirmed 41/41 green, and none of the green slices exercise the two paths below (Codex's gap analysis concurs and the reviewer's own positive observations at lines 84-86 bless exactly these paths), so the green suite and these findings do not conflict — the suite simply never exercises them.

**Adjudicated verdict: REQUEST CHANGES.** Codex's NO-GO is upheld; the reviewer's APPROVE is overturned on F1 + F2. Both are HIGH-equivalent and were missed because they need a cross-file behavioral trace against the SKILL.md:68 contract (the reviewer's line-84-86 observations asserted the pre-tag-stays design and the `classifyByLine` merge were "correct" without tracing the feedback re-feed or the same-line collision). F3 + F4 are real but non-blocking; folded into the same fix cycle.

| # | Codex sev | Disposition | Adjudicated sev | Origin |
|---|-----------|-------------|-----------------|--------|
| F1 | MAJOR | **REAL** (feedback) / **INTENDED** (denominator) | HIGH | design |
| F2 | MAJOR | **REAL** | HIGH | implementation |
| F3 | MINOR | **REAL** (test gap) | LOW | implementation |
| F4 | NOTE | **REAL** | LOW | design |

### F1 — equivalent-logging survivors re-fed into Cover iterations → REAL (feedback leak); denominator INTENDED

**Mechanism (verified):** `mutationFloor` pushes equivalent-logging pre-tags into `reachableSurvivors` carrying `.tag` (cover-flutter:112-117); the denominator exclusion (cover-flutter:108-110) fires only for `expectedSurvivorLines`, NOT for equivalent-logging; the loop then sets `survivingMutants = gates.mutation_floor.detail.reachableSurvivors` (cover-flutter:460) and feeds the whole array — tagged ones included — back into `coverPrompt` (cover-flutter:311-316). SKILL.md:68 ("Only `REAL-gap` drives another Cover iteration … feeding [equivalent] back wastes iterations") is directly contradicted.

**Ruling — split the two concerns the code conflates:**
- **Denominator = INTENDED, do NOT change (reject option b).** Keeping equivalent-logging in the reachable denominator until the operator confirms is the deliberate two-tier honesty design: `equivalentLoggingLines` = orchestrator *suggestion* (stays scored, surfaced in the report's `expectedSurvivorLines` suggestion); `expectedSurvivorLines` = operator-*confirmed* exclusion (dropped from the denominator). Option (b) would let the orchestrator auto-trust its own heuristic (line-membership + void-call mutator) to inflate the kill rate with no operator review — exactly the silent inflation the two-tier split exists to prevent (cover-flutter header 229-234; SKILL.md:60/76).
- **Feedback = REAL defect, fix with option (a).** There is no honesty reason to ask the Cover agent to "write a test that kills" a mutant the orchestrator has ALREADY tagged equivalent-logging. Feed back only un-pre-tagged survivors.

**Precise fix (a):** at `cover-flutter.workflow.js:460`, change `survivingMutants = gates.mutation_floor.detail.reachableSurvivors` → `… .reachableSurvivors.filter((s) => !s.tag)`. During the bounded cover loop the only tag present is the orchestrator's equivalent-logging pre-tag (the source-aware classify agent runs later, in loop-flutter's Report phase), so `!s.tag` removes exactly the known-equivalent ones and keeps every not-yet-classified survivor (which may be REAL-gap and must still be chased).

**Intended residual — do NOT "fix" it with (b):** with (a) applied and (b) rejected, a run whose only sub-floor survivor is equivalent-logging still hits `cap-reached` (the score never clears because the survivor stays in the denominator) and emits the `expectedSurvivorLines` suggestion. That is the correct honest terminus — it forces operator review rather than auto-passing.

### F2 — classify verdicts keyed by `line` only → same-line collision → REAL

**Mechanism (verified):** `CLASSIFY_SURVIVORS_SCHEMA` items require `[line, tag]` (loop-flutter:186-192); `classifyByLine.set(c.line, c)` (loop-flutter:268) and `.get(s.line)` (loop-flutter:273) key purely by line. Two survivors on one source line → the second agent verdict overwrites the first and BOTH render with that one verdict (loop-flutter:271-275).

**Why real:** regex `mutation_test` routinely emits multiple survivors per line (`if (a && b || c)` → one survivor per operator, all on one line, differing only by `mutatorName`/`replacement`). The prompt itself (loop-flutter:223) asks for "one entry per survivor", so the line-keying diverges from the contract's own intent. Consequence: a REAL-gap survivor sharing a line with an equivalent one is silently rendered as equivalent — the feature's core deliverable (accurate classification) is wrong, and `expectedSurvivorLines`/implied-cleanups pick wrong lines. (Gate PASS/FAIL is unaffected — the floor counts `reachableSurvivors.length` regardless of tag — so this is a report-accuracy logic error, not a scoring error.)

**Precise fix:** key per survivor. Recommended (deterministic, model-robust): add a required `index` to each schema item, number the survivors in `classifySurvivorsPrompt` (loop-flutter:197-198 → `- [i] line N: …`), instruct the agent to echo `index`, then `classifyByIndex.set(c.index, c)` and map `toClassify[i]` by index. (Composite `${line}:${mutatorName}:${replacement}` also works but needs those fields added to the return schema and is fragile if the model paraphrases — prefer the index.) Add a two-survivors-on-one-line regression slice asserting distinct tags survive.

### F3 — populated-classify slice injects a pre-tagged coverResult → REAL (minor test gap)

**Verified:** slice 9f-2 (test:889-956) injects an already-pre-tagged `coverResult` and mocks the cover sub-workflow, so it proves loop-flutter's Report-phase merge/render but not the real `equivalentLoggingLines → cover-flutter pre-tag → loop-flutter` seam. The seam IS covered in pieces (pre-tagger slices test:795-825; forwarding at loop-flutter:163-166 is a literal pass-through) → LOW, non-blocking. **Fold into F1's fix:** the F1 feedback-filter needs a regression test anyway — one slice that drives `equivalentLoggingLines` through the real cover-flutter pre-tag and asserts (1) the survivor arrives pre-tagged AND (2) it is absent from the next iteration's cover feedback closes F1's regression and F3's seam gap together.

### F4 — `reason` optional + undocumented `unclassified` fallback → REAL (low)

**Verified:** `reason` is NOT in the schema `required` (loop-flutter:191) while SKILL.md:74 and the prompt (loop-flutter:222) both promise one — a prompt-only obligation with no enforcement. `tag: c?.tag ?? 'unclassified'` (loop-flutter:274) is a 6th, undocumented terminal tag: an `unclassified` survivor drives nothing (not REAL-gap → no iteration; not in `EQUIVALENT_TAGS` → not in cleanups/suggestion), so a dropped verdict can bury a real gap. Low impact (bites only on agent misbehavior) but a genuine fail-safe gap. **Precise fix:** (1) add `reason` to schema `required`; (2) make the no-verdict fallback explicit/loud (render `unclassified` with a literal "AGENT DID NOT CLASSIFY — re-run / treat as REAL-gap" note) and document `unclassified` in SKILL.md's Report-stage taxonomy. Do NOT silently auto-default to REAL-gap (SKILL.md:66 forbids the orchestrator defaulting unprovable survivors to REAL-gap) — surface for review.

### Consolidated fix-list (developer fix-cycle 1)

1. **[HIGH — F1]** `cover-flutter.workflow.js:460` — feed back only un-pre-tagged survivors: `.filter((s) => !s.tag)`. Do NOT change the denominator (reject option b). Add the F3 seam regression slice.
2. **[HIGH — F2]** `loop-flutter.workflow.js:186-192, 197-198, 268, 273` — key classify verdicts per-survivor (add required `index`, echo it, key by index), not per `line`. Add a two-survivors-on-one-line regression slice.
3. **[LOW — F4]** `loop-flutter.workflow.js:191, 274` — make `reason` required; make the `unclassified` no-verdict fallback explicit/loud.
4. **[LOW — F3]** folded into #1.

### SKILL.md wording reconciliation owed (same cycle)
- `plugins/nexus/skills/mine-verify-cover/SKILL.md:68` — reconcile "Only `REAL-gap` drives another Cover iteration" with the orchestrator's actual mid-loop capability: the cover loop can only filter what it can pre-tag (equivalent-logging); full REAL-gap-only resolution is a Report-stage classification, not a per-iteration filter. State both rules — per-iteration (filter known-equivalent pre-tags from feedback) and Report-stage (only REAL-gap should drive a *follow-up* run). **This is a shipped-skill edit → requires a nexus PATCH bump** (1.18.6 → 1.18.7) in the same commit.
- `SKILL.md` Report-stage taxonomy — document `unclassified` as the agent-non-response terminal state (F4).

*Status: COMPLETE — architect (conflict adjudication), 2026-06-26*
