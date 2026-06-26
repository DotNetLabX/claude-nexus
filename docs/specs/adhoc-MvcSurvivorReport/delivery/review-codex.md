# Cross-Check: adhoc-MvcSurvivorReport

## Verdict
NO-GO — the summary-based scoring and the survivor-count HALT are implemented correctly, but the survivor-classification loop still misses two material parts of the plan: pre-tagged `equivalent-logging` survivors are re-fed into Cover iterations, and the classify contract cannot safely distinguish multiple survivors on the same source line. Until those are fixed, the report-stage behavior is not faithful to the plan.

## Findings

| # | Severity | File | Location | Issue |
|---|----------|------|----------|-------|
| 1 | MAJOR | `harness/cover-flutter.workflow.js` | `mutationFloor()` / `coverPrompt()` / cover loop (`113-117`, `311-315`, `460`) | Pre-tagged `equivalent-logging` survivors are kept in `reachableSurvivors` and then fed straight back into the next Cover prompt. That contradicts the "Only `REAL-gap` drives another Cover iteration" rule documented in `plugins/nexus/skills/mine-verify-cover/SKILL.md:68` and repeated in `harness/loop-flutter.workflow.js:316`, so known-equivalent log mutants will still burn iterations chasing tests they should no longer request. |
| 2 | MAJOR | `harness/loop-flutter.workflow.js` | `CLASSIFY_SURVIVORS_SCHEMA` + classification merge (`178-195`, `261-275`) | The classify-survivors contract keys verdicts only by `line`, and `classifyByLine.set(c.line, c)` merges by that same key. If two survivors share one source line, one verdict overwrites the other and the report cannot preserve per-survivor tag/reason/cleanup data, even though the plan and prompt operate on "each residual survivor". |
| 3 | MINOR | `tests/unit/workflow-contract.test.mjs` | populated-survivor classify slice (`889-956`) | The new classify-path test injects an already pre-tagged `coverResult` instead of proving the real seam `equivalentLoggingLines -> cover-flutter pre-tag -> loop-flutter skip`. If forwarding at `harness/loop-flutter.workflow.js:163-166` or feedback filtering regresses, the current slice can still pass. |
| 4 | NOTE | `harness/loop-flutter.workflow.js` | schema/report fallback (`186-189`, `222-224`, `274-277`) | HYPOTHESIS: the method SKILL promises one-line reasons for source-dependent tags (`plugins/nexus/skills/mine-verify-cover/SKILL.md:74`), but `reason` is optional here and missing agent output falls back to an undocumented `unclassified` tag. The happy-path tests never exercise that path. |

## Scoring Arithmetic Analysis
The scoring arithmetic in `harness/cover-flutter.workflow.js` is correct as implemented. `mutationFloor()` reads `found` and `notCovered` from `mutationSummary` and derives `reachable = found - notCovered` at lines `98-100`. It removes survivors whose lines are in `expectedSurvivorLines` from both the survivor list and the denominator via `expectedSurvivorsExcluded` at lines `104-120`. It then computes `killed = reachableDenominator - reachableSurvivors.length` at line `121`, with the percentage derived from that value at line `122`.

That matches the intended Flutter contract: killed is summary-derived, not mutant-array-derived. I did not find an off-by-one error, a wrong field reference, or a place where the code falls back to counting killed mutants from the array. The pre-score HALT at lines `421-426` also correctly guards this arithmetic by requiring `mutationSummary.undetected === runRaw.mutants.length` before scoring, so the array stays a survivors-only enumeration and the summary remains authoritative.

## Classify-Agent Data-Flow Analysis
The high-level ordering is mostly correct. `loop-flutter` forwards `equivalentLoggingLines` into `cover-flutter` at lines `163-166`. `cover-flutter` pre-tags only `equivalent-logging` via `pretagEquivalentLogging()` at lines `76-85`, and applies that tag while building `reachableSurvivors` at lines `112-117`. Back in `loop-flutter`, the Report phase runs after the optional KB flip (`235-246`), reads the final iteration's `reachableSurvivors` (`259`), filters out already tagged survivors (`260`), spawns one `classify-survivors` agent only when untagged survivors remain (`264-267`), and merges the pre-tags with the agent verdicts before rendering the report (`270-324`).

The two data-flow defects are the ones in Findings 1 and 2. First, the pre-tag does not affect loop feedback: the same tagged `reachableSurvivors` array is handed back to `coverPrompt()` through `survivingMutants = gates.mutation_floor.detail.reachableSurvivors` at line `460`, so the loop still asks Cover to kill known-equivalent log mutants. Second, the agent contract is not stable per survivor because it identifies outputs by `line` only. That means the orchestrator can record source-aware tags only when there is at most one survivor per line.

## Test Coverage Assessment
The 8 added slices do cover the intended happy-path behaviors:

- `732-744` proves summary-derived scoring on `70 found / 16 undetected / 0 notCovered -> 77%`.
- `746-760` proves `expectedSurvivorLines` removes a survivor from both denominator and survivor count, yielding `89%`.
- `763-775` adds the BuildZpl (`90%`) and CycleCount (`94%`) fixture reproductions.
- `777-793` proves the iteration-1 `mutant-count-mismatch` HALT path.
- `795-813` proves positive `equivalent-logging` pre-tagging.
- `815-825` proves the negative pre-tag case where line membership alone is insufficient.
- `889-956` proves the populated classify path: agent spawn, 4-value schema enum, report tags, cleanup rendering, and `expectedSurvivorLines` suggestion.

The older slices still help around the edges: `690-717` verifies the updated 9e baseline contract, and `831-881` keeps the empty-survivor/all-green controller path covered.

The gaps are meaningful:

- No slice asserts that pre-tagged `equivalent-logging` survivors are removed from future Cover feedback, which is how Finding 1 slipped through.
- No slice covers two survivors on the same line, so the line-key collision in Finding 2 is currently untested.
- The populated classify slice mocks a pre-tagged `coverResult`, so it does not actually prove the end-to-end `equivalentLoggingLines` forwarding seam.
- I could not rerun `node --test tests/unit/workflow-contract.test.mjs` in this sandbox: Node's test runner failed with `spawn EPERM`, so the assessment above is source-based rather than an in-sandbox green reproduction.

## SKILL.md Accuracy
`plugins/nexus/skills/mine-verify-cover/SKILL.md` is directionally aligned with the implementation in its added report-stage section (`54-78`): the five-tag taxonomy, assignment ownership, final-iteration authority note, cleanup concept, and `expectedSurvivorLines` suggestion all appear in the live workflows. The material mismatch is behavioral, not descriptive: line `68` says only `REAL-gap` survivors should drive another Cover iteration, but `harness/cover-flutter.workflow.js` still feeds pre-tagged `equivalent-logging` survivors back into `coverPrompt()` (`311-315`, `460`). Its line `74` also promises one-line reasons for source-dependent survivors, while `harness/loop-flutter.workflow.js` makes `reason` optional (`186-189`, `274-277`).

`plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md` accurately reflects the live Flutter behavior in its added Dart-cue subsection (`92-104`). The separation between `equivalentLoggingLines` and `expectedSurvivorLines` matches `harness/cover-flutter.workflow.js:225-234` and `harness/loop-flutter.workflow.js:47-50,163-166`; the pre-tag requirement of both a log-line signal and a void-call-removal mutator matches `harness/cover-flutter.workflow.js:76-85`; and the source-dependent tags being agent-assigned matches `harness/loop-flutter.workflow.js:175-275`. I did not find a contradiction in this edited adapter section.
