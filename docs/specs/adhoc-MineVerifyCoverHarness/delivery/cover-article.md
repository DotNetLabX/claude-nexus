# Cover run — Article (2026-06-21)

**Controller:** `harness/loop.workflow.js` (Inc 3a — automated pipeline controller)
**Target:** `D:\src\dotnet-microservices\src\Services\Review\Review.Domain\Articles\Behaviors\Article.cs`
**Clean-room status:** PROMPT-ONLY enforcement (agentType mechanical seal pending Step-8 bringup investigation — see controller header).

## Result

| Field | Value |
|-------|-------|
| Stopped | all-gates-green |
| Iterations | 1 |
| Achieved score | 100% reachable kill |
| Model | sonnet (every agent; default Sonnet) |
| Run cost (marginal) | 102,563 output tokens — THIS run only |
| Session total at finish | 1,983,121 tokens (shared pool: main loop + all workflows — NOT this run's cost) |
| Date | 2026-06-21 |

## Gate Battery (§6)

| Gate | Result | Detail |
|------|--------|--------|
| target_mutated | PASS | {"target":"Article.cs","count":76,"mutatedFiles":["Article.cs:76","IArticleState |
| suite_green | PASS | {"runs":[{"passed":127,"failed":0},{"passed":127,"failed":0}]} |
| no_flaky | PASS | {"counts":["127/0/0","127/0/0"]} |
| mutation_floor | PASS | 100% |
| no_new_skips | PASS | {"maxSkips":0,"baselineSkips":0} |
| char_pin | PASS | {"changedLines":0,"disallowed":[]} |

## Residual Survivors

_No reachable survivors._

## Candidate Bugs (red-on-current tests kept, never deleted)

_None._

## Mine→Verify Summary

- Consensus rules: 25
- Mine→Verify cost (up to this point): 1,923,691 tokens

## Notes

- Timeout mutants counted as killed (Inc-3 Step-3 fix — standard Stryker semantics).
- If the survivor section is empty, all reachable mutants were killed (Timeout-as-killed may have cleared the remaining survivors).
- This report was written automatically by the controller (no manual assembly required).
