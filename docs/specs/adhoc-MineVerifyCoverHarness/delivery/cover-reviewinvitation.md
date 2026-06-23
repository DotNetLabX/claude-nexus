# Cover run — ReviewInvitation (2026-06-21)

**Controller:** `harness/loop.workflow.js` (Inc 3a — automated pipeline controller)
**Target:** `D:\src\dotnet-microservices\src\Services\Review\Review.Domain\Invitations\Behaviors\ReviewInvitation.cs`
**Clean-room status:** PROMPT-ONLY enforcement (agentType mechanical seal pending Step-8 bringup investigation — see controller header).

## Result

| Field | Value |
|-------|-------|
| Stopped | all-gates-green |
| Iterations | 1 |
| Achieved score | 91% reachable kill |
| Model | sonnet (every agent) |
| Run cost (actual) | ~395k output tokens (193k mine-verify + 203k cover, Sonnet) |
| Session total shown | 1,658,906 tokens — the SHARED session pool (prep + builds + run), NOT this run's cost; the old budget gate misread this (now fixed → reports marginal) |
| Date | 2026-06-21 (date-stamp agent guessed wrong; real date 2026-06-23) |

## Gate Battery (§6)

| Gate | Result | Detail |
|------|--------|--------|
| target_mutated | PASS | {"target":"ReviewInvitation.cs","count":13,"mutatedFiles":["ReviewInvitation.cs: |
| suite_green | PASS | {"runs":[{"passed":39,"failed":0},{"passed":39,"failed":0}]} |
| no_flaky | PASS | {"counts":["39/0/0","39/0/0"]} |
| mutation_floor | PASS | 91% |
| no_new_skips | PASS | {"maxSkips":0,"baselineSkips":0} |
| char_pin | PASS | {"changedLines":0,"disallowed":[]} |

## Residual Survivors

- Line 13: Equality mutation `ExpiresOn <=  DateTime.UtcNow` (Survived)

## Candidate Bugs (red-on-current tests kept, never deleted)

_None._

## Mine→Verify Summary

- Consensus rules: 7
- Mine→Verify cost (up to this point): 1,633,842 tokens

## Notes

- Timeout mutants counted as killed (Inc-3 Step-3 fix — standard Stryker semantics).
- If the survivor section is empty, all reachable mutants were killed (Timeout-as-killed may have cleared the remaining survivors).
- This report was written automatically by the controller (no manual assembly required).
