# Cover run — CycleTimeAnalyzer (2026-06-21)

**Controller:** `harness/loop.workflow.js` (Inc 3a — automated pipeline controller)
**Target:** `D:\src\sprint-rituals\src\Services\Fokus\Fokus.Domain\Analytics\CycleTimeAnalyzer.cs`
**Clean-room status:** PROMPT-ONLY enforcement (agentType mechanical seal pending Step-8 bringup investigation — see controller header).

## Result

| Field | Value |
|-------|-------|
| Stopped | all-gates-green |
| Iterations | 1 |
| Achieved score | 100% reachable kill |
| Budget spent | 1,494,268 tokens |
| Date | 2026-06-21 |

## Gate Battery (§6)

| Gate | Result | Detail |
|------|--------|--------|
| target_mutated | PASS | {"target":"CycleTimeAnalyzer.cs","count":399,"mutatedFiles":["CycleTimeAnalyzer. |
| suite_green | PASS | {"runs":[{"passed":216,"failed":0},{"passed":216,"failed":0}]} |
| no_flaky | PASS | {"counts":["216/0/0","216/0/0"]} |
| mutation_floor | PASS | 100% |
| no_new_skips | PASS | {"maxSkips":0,"baselineSkips":0} |
| char_pin | PASS | {"changedLines":0,"disallowed":[]} |

## Residual Survivors

_No reachable survivors._

## Candidate Bugs (red-on-current tests kept, never deleted)

_None._

## Mine→Verify Summary

- Consensus rules: 59
- Mine→Verify cost (up to this point): 1,378,076 tokens

## Notes

- Timeout mutants counted as killed (Inc-3 Step-3 fix — standard Stryker semantics).
- If the survivor section is empty, all reachable mutants were killed (Timeout-as-killed may have cleared the remaining survivors).
- This report was written automatically by the controller (no manual assembly required).
