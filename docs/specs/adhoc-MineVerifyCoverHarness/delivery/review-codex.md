# Review: adhoc-MineVerifyCoverHarness
Date: 2026-06-14
Reviewer: Codex (independent cross-check)

## Verdict: NO-GO

## Summary
The deterministic recall helper is implemented correctly: `computeRecall()` uses the golden-subset length as the denominator, `parseGoldenSubset()` throws on missing requested IDs, and the unit test file covers the requested scorer scenarios. The workflow also removes per-rule interpretive fan-out and accounts batched interpretive calls as `ceil(interpretive_count / BATCH_SIZE)`.

This is still a NO-GO for Increment 1 as reviewed here. The transcribed verifier path can still read `SRC` directly instead of consuming inline slices, and the miner clean room is only prompt-enforced while answer-key substance is committed in repo docs, so golden content remains reachable in practice.

## Findings
| # | Severity | File | Finding |
|---|----------|------|---------|
| 1 | BLOCKER | `harness/mine-verify.workflow.js:239-245` | Verified observation: the transcribed verify path is not sealed. Its prompt tells the agent to confirm entailment and to read `SRC` if needed, and it is fed quotes only, not inline per-rule slices. That violates the stated verifier contract that verifiers receive slices inline and perform zero file reads. |
| 2 | BLOCKER | `harness/README.md:40-44`; `docs/specs/adhoc-MineVerifyCoverHarness/delivery/implementation.md:131-138,166-173` | Verified observation: the miner boundary is explicitly prompt-enforced only, not mechanically sealed, and the implementation write-up commits the GOLD-16/17/18 answer-key substance into repo docs. Inference: because miners are background agents without the planned `disallowedTools` or inline-source seal, that committed answer-key content remains reachable to miners, so clean-room integrity is not guaranteed. |
| 3 | NOTE | `harness/lib/recall-score.mjs:32-48,81-102`; `tests/unit/recall-score.test.mjs:53-121` | Verified observation: the deterministic scorer meets the requested math contract. `computeRecall()` iterates over the golden subset and sets `total = golden.length`, while `parseGoldenSubset()` throws on missing requested IDs; the unit tests cover correct recall math, denominator-by-golden-length, fail-loud parsing, and golden-subset extraction. |

## Focus Area Results
### 1. Recall Math Correctness
Pass.

Verified observations:
- `parseGoldenSubset()` extracts only requested `GOLD-*` rows from the markdown table, preserves requested ID order, and throws if any requested ID is missing (`harness/lib/recall-score.mjs:32-48`).
- `computeRecall()` iterates over `golden`, not `verdictMap`, and sets `total = golden.length`, so the denominator is the golden-subset size (`harness/lib/recall-score.mjs:81-102`).
- A missing verdict entry is counted as an unmatched golden rule, so recall cannot be inflated by an underspecified verdict map (`harness/lib/recall-score.mjs:85-96`).

Nuance:
- The implemented fail-loud behavior applies to missing requested golden IDs during subset parsing. Missing verdict entries do not throw; they are treated as misses by design (`harness/lib/recall-score.mjs:85-92`).

Edge case:
- Empty golden subsets return `0` recall via the `total ? ... : 0` guard (`harness/lib/recall-score.mjs:94-96`). I did not find a dedicated unit test for that edge case.

### 2. Batched-Verify Accounting
Partial pass.

Verified observations:
- `chunk()` groups interpretive rules by `BATCH_SIZE`, and `verifyBatchCalls` is `batches.length`, which equals `ceil(interpretive_count / BATCH_SIZE)` for positive `BATCH_SIZE` (`harness/mine-verify.workflow.js:137-140,214-215,265`).
- No per-rule interpretive fan-out remains. The workflow launches one verifier agent per batch, not per rule (`harness/mine-verify.workflow.js:215-235`).
- Interpretive verifiers receive rule slices inline and are explicitly told not to read files (`harness/mine-verify.workflow.js:217-232`).

Failure:
- The transcribed verifier does not receive slices inline and is explicitly allowed to read `SRC` if needed (`harness/mine-verify.workflow.js:239-245`). Because of that, the verifier path as a whole is not zero-read.

### 3. Clean-Room Integrity
Fail.

Verified observations:
- `harness/targets/bugratio.json` is clean: it carries only `class`, `source`, `goldenIds`, and a note; it does not contain golden verdicts, answer text, or rule text (`harness/targets/bugratio.json:1-6`).
- The workflow itself does not inject golden text into miner or interpretive-verifier prompts (`harness/mine-verify.workflow.js:22-23,145-154,217-232`).

Verified observation plus inference:
- The README states the miner boundary is prompt-only this increment (`harness/README.md:40-44`).
- The implementation write-up records the actual GOLD-16/17/18 answer-key substance in repo docs (`docs/specs/adhoc-MineVerifyCoverHarness/delivery/implementation.md:131-138`).
- Inference: absent the planned mechanical miner seal, that repo-local answer key remains reachable to miners if they ignore the prompt. That breaks clean-room integrity even though `bugratio.json` itself is safe.

Additional verifier-path issue:
- The transcribed verify path can also reach `SRC` directly (`harness/mine-verify.workflow.js:239-245`), so verifier clean-room integrity is incomplete even without considering miners.

### 4. Unit-Test Adequacy
Pass for the requested checklist.

Verified observations:
- Correct recall math is covered by the 3/3 and 2/3 tests (`tests/unit/recall-score.test.mjs:53-78`).
- Denominator = golden length is covered by the missing-verdict-entry test (`tests/unit/recall-score.test.mjs:80-90`).
- Golden-subset parsing is covered by the extraction test (`tests/unit/recall-score.test.mjs:107-114`).
- Fail-loud on missing ID is covered by the throwing parse test (`tests/unit/recall-score.test.mjs:116-121`).

Review limitation:
- In this sandbox, `node --test tests/unit/recall-score.test.mjs` failed with `spawn EPERM`, so execution re-check was limited to static inspection plus direct inline module assertions against `computeRecall()`, `parseGoldenSubset()`, and `buildPairingPacket()`.

## Recommendation
Do not sign this off yet.

1. Seal the transcribed verifier the same way as the interpretive verifier: pre-slice or inline all needed evidence and remove any instruction that permits reading `SRC`.
2. Remove committed answer-key substance from repo-visible docs, or land the planned mechanical miner seal before treating the recall result as clean-room valid.
3. After those fixes, rerun the workflow validation and rerun the scorer tests in an environment where `node --test` can spawn normally.
