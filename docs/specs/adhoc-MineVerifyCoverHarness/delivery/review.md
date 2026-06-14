# Mine→Verify Harness — Increment 1 — Review

## Step 1 — Done-Check

**Pre-commitment predictions (before reading implementation.md):** most likely gaps — (1) Step 3 TDD
evidence: the test actually at `tests/unit/recall-score.test.mjs` (Q1) and `tdd` actually invoked
(logged), not just claimed; (2) Step 2 verifier-seal acceptance demonstrated (≤~7 batched calls, verifiers
read zero files), not merely asserted; (3) the Q2/Q3/Q4 recording obligations actually carried into
implementation.md. **Result: all three predicted-risk areas hold up** — verified below.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Scaffold the harness dev-repo home | Implemented | `harness/README.md` (3637 B) + `harness/targets/bugratio.json` (478 B) both exist. JSON carries golden **ids only** (`GOLD-16/17/18`) + a self-documenting `_note` asserting the ids-only invariant — satisfies the Q2/Q5 tightening ("confirm config carries ids only"). `Satisfies: roadmap Inc 1` — real. |
| 2 — Author the Mine→batched-Verify Workflow | Implemented (Deviated — verification-rigor, valid: disclosed + corrected) | `harness/mine-verify.workflow.js` (13.3 KB) exists; per-rule fan-out replaced by `chunk(interpretive, 5)` batched verifier (the load-bearing build, design §2). Acceptance demonstrated live at Step 4: 7 batched calls, verifiers read 0 files, 0 rate-limit failures. **Deviation:** original build was claimed "runnable / `node --check`-validated" but had never been launched and failed the Workflow tool's "meta must be the first statement" + "description must be a literal" rules; fixed mid-run (meta moved to first statement at L26 — verified, only comments precede it; description collapsed to a single literal) and the false claim **corrected in implementation.md Files Modified + Deviations**. Plan-conformant outcome met; defect disclosed and closed. `Satisfies: design §2` — real. |
| 3 — Build the recall-scoring helper (TDD) | Implemented | `harness/lib/recall-score.mjs` (7.3 KB) = 3 pure fns (`parseGoldenSubset` / `buildPairingPacket` / `computeRecall`) + thin CLI. Test at `tests/unit/recall-score.test.mjs` (Q1 path, in the CI glob) — **6/6 green** (re-ran: `pass 6 / fail 0`). Helper computes recall from a **supplied verdict map**, no LLM in the test — satisfies my Q3 enforcement. The 1→3 fn split is documented decomposition (developer's call on internal structure; acceptance preserved). `Satisfies: design §3 + #4 recall metric` — real. |
| 4 — Validation run + record results | Implemented (Deviated — execution role, valid: developer subagent lacks Workflow tool) | All four acceptance thresholds met + measured: **recall 3/3** (=1.0); **7 batched interpretive calls**, 0 rate-limit failures; **241,939 output tokens** vs v1 ~1.58M (**~6.5× reduction** — the #4 comparison half); 0 contradictions. Judge prompt + GOLD-16/17/18 substance recorded **verbatim** (Q3); golden path kept out of repo, operator-supplied (Q2); miner-clean-room conditionality recorded as binding caveat (Q4). **Deviation:** executed by team lead as orchestrator (developer subagent has no `Workflow` tool) — a runtime-role assignment, documented; validation intent unchanged. `Satisfies: design §2 + roadmap Inc 1 acceptance` — real. |

**Skill conformance (scored against `.claude/audit/skill-invocations.log`, scoped to `token=developer:implement`):**
Steps 1/2/4 are `Skill: None, TDD: no` — no log entry required (per-step all-`None` exemption). Step 3 is
`Skill: None, TDD: yes` — the `tdd` invocation **is logged** (`{"agent":"developer","skill":"tdd","token":"developer:implement"}`,
2026-06-14T17:21:44Z), matching the `## Skills Used` self-report (no fabrication). `## Skills Used` section
present. PASS on skill conformance.

**`Satisfies:` cross-check:** every step's annotation cites a real unit in the ADR-27 definition stack
(roadmap Inc 1, design §2, design §3, #4 metric). Confirmed.

**Note for Step 2 (reviewer's lane, not a done-check gap):** a real verification-rigor defect surfaced
this run — `harness/mine-verify.workflow.js` was reported runnable on `node --check` alone, but `--check`
validates JS syntax only, not the Workflow tool's statement-placement/literal constraints, so the file
passed `--check` while being unlaunchable. It was caught at launch, fixed, and the false claim corrected.
The gap is **closed**, but the reviewer should weigh the "validated by `node --check`" pattern for any
remaining run-time-only constraints (it is the one place a self-reported claim outran its evidence this run).

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-06-14*

## Step 2 — Code Review

## Reviewed By
Reviewer agent (claude-sonnet-4-6), Cycle 2, 2026-06-14. Fresh test execution and targeted grep verification performed in this session.

## Verdict: APPROVED

## Pre-commitment Predictions
1. **Codex F2 (golden text removal)** — predicted the verbatim 8-line "Expected golden substance" block would be cleanly excised from implementation.md while preserving the matched-pairs audit trail. Confirmed: lines 150–154 now point to the sequestered path; the old block is gone. The matched-pairs section (BR consensus statements) is intact and is correctly NOT a sequestration violation.
2. **Codex F1 (transcribed verifier seal)** — predicted the "only if needed" escape hatch would be replaced with "do NOT read any file." Confirmed at `harness/mine-verify.workflow.js:245`: `"Judge ONLY from the inline quote — do NOT read any file."` No "only if needed" phrase survives anywhere in the file.
3. **MEDIUM fix (matchedPairs coverage)** — predicted a `deepEqual` assertion on `matchedPairs` would be added to the 3/3 test. Confirmed at `tests/unit/recall-score.test.mjs:74–82`.
4. **LOW fix (empty-consensus test)** — predicted a new `buildPairingPacket with empty consensus` test would be added. Confirmed at `tests/unit/recall-score.test.mjs:52–59`.
5. **Adjacent-call-site regression** — predicted the transcribed prompt change would have no adjacent breakage; the comment block at lines 211–216 was updated to accurately describe zero-reads for both interpretive (inline slices) and transcribed (inline quotes), and to scope mechanical sealing to Inc 3. No adjacent code paths changed.

## Findings

No CRITICAL or HIGH findings. All four targeted fixes are correct and complete.

## Carry-Over Findings (from Cycle-1 and Codex review)

| Finding | Status | Evidence |
|---------|--------|---------|
| Codex F2 — golden answer-key text in implementation.md | RESOLVED | Verbatim 8-line block removed; implementation.md:150–154 now references sequestered path. Grep for "Expected golden substance" in delivery/ returns 0 hits. |
| Codex F1 — transcribed verifier "only if needed" file-read permission | RESOLVED | `mine-verify.workflow.js:245` now: "do NOT read any file." Zero "only if needed" occurrences remain in workflow. Comment block updated at lines 211–216. |
| MEDIUM — matchedPairs untested | RESOLVED | `tests/unit/recall-score.test.mjs:74–82` adds `deepEqual` on `matchedPairs` in the 3/3 test. |
| LOW — empty-consensus test missing | RESOLVED | `tests/unit/recall-score.test.mjs:52–59` adds `buildPairingPacket with empty consensus` test. |
| LOW — SRC portability | Recorded as backlog | `implementation.md` Carry-Over table: "SRC path is hard-coded (Windows absolute path)" → Inc-2/3 backlog. No code change required this increment. |
| LOW — --score shape validation | Recorded as backlog | `implementation.md` Carry-Over table: "--score CLI does not validate verdicts-map shape" → Inc-2/3 backlog. |
| LOW — Workflow no automated test | Confirmed by-design | Plan Testing Strategy explicitly excludes orchestration from unit tests; live run is the validation. |
| LOW — Miner clean-room prompt-only | Confirmed as Inc-3 gap | Mechanical seal scheduled Inc 3; recorded in lessons and implementation.md conditionality caveat. |

## Positive Observations
- The matched-pairs section in implementation.md (GOLD-16↔BR-1 etc.) is correctly preserved — it records miner consensus output (BR statements), not the sequestered golden rule text. The distinction is correctly drawn and documented in lessons.md.
- The transcribed verifier fix is conservative and correct: the quote was already inline in the prompt; removing the file-read permission costs nothing and tightens the seal exactly as planned.
- The comment block update at lines 211–216 now accurately describes both verifier types as zero-read and explicitly names Inc-3 as the mechanical-seal milestone. This removes the ambiguity Cycle-1 flagged.
- 7/7 recall-score tests pass (up from 6); 141/141 full suite pass. No regressions introduced.
- The new `buildPairingPacket with empty consensus` test correctly asserts both the count (GOLDEN.length pairs) and the shape (candidates: empty array) — not just a no-crash check.
- The `matchedPairs` deepEqual assertion covers all three golden ids in golden-subset order, which is the meaningful contract (order-sensitive pairing).

## Gaps
None introduced by the fixes. Previously noted LOWs are recorded as Inc-2/3 backlog items in implementation.md.

## Open Questions
None.

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Unit tests (recall-score) | PASS | `node --test tests/unit/recall-score.test.mjs` | 7 pass, 0 fail, 93.5ms |
| Full test suite | PASS | `node --test tests/unit/*.test.mjs tests/lint/*.test.mjs` | 141 pass, 0 fail, 4200ms |
| JS syntax check (workflow) | PASS | `node --check harness/mine-verify.workflow.js` | syntax-ok |
| JS syntax check (helper) | PASS | `node --check harness/lib/recall-score.mjs` | syntax-ok |
| Golden text removed (F2) | PASS | grep "Expected golden substance" in delivery/ | 0 hits; implementation.md lines 150–154 reference sequestered path |
| "only if needed" removed (F1) | PASS | grep "only if needed" in workflow | 0 hits; line 245 is "do NOT read any file" |
| matchedPairs tested (MEDIUM) | PASS | test file:74–82 | deepEqual on `[{goldenId, consensusId}]` in golden-subset order |
| empty-consensus test (LOW) | PASS | test file:52–59 | candidates.length === 0 for all pairs |

*Status: COMPLETE — reviewer, 2026-06-14*
