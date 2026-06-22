# Mine→Verify→Cover Harness — Increment 3a (loop controller) — Review

Increment-3a review. Step 1 (done-check) is the architect's; Step 2 (code review) is the reviewer's.

## Step 1 — Done-Check

**Scope rule (same as Inc-2):** the *buildable* scope is Steps 1–7. Step 8 (live controller runs) is
**OPERATOR-OWED by design** (no `Workflow`/`agent` tool, no .NET, no commit role — ADR-18), assessed as
correctly-deferred-and-documented, not Missing.

**Pre-commitment predictions (before reading implementation.md):** (1) the KB-write seam is the riskiest —
the orchestrator has no fs, so the rules→KB write must go through an agent; the "two-agent seam" is a plan
deviation to verify — **occurred, and is coherent** (read-agent returns existing KB, write-agent writes the
new text; same precedent as Inc-2's runner-returns-via-schema). (2) The Timeout fix touched `isSurvivor` *and*
`killed++` — risk of dropping Timeout from the reachable denominator — **did not occur**: `Timeout` stays in
`DENOMINATOR_STATUSES` (verified `cover-gates.mjs:100,109-112`), so it's counted in `reachableDenominator` and
classified as killed — correct. (3) `tdd` must appear in the scoped log for TDD:yes steps — **confirmed**.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Parameterize sub-workflows by `args` | Implemented | `_args = (typeof args !== 'undefined' && args) ? args : {}` + `?? defaultConst` in both workflows; back-compat; `typeof` guard prevents ReferenceError if no injection. `node --check` + contract test cover it. |
| 2 — Offline workflow-contract test (TDD) | Implemented | `tests/unit/workflow-contract.test.mjs` — 10 tests (8 + 2 for `loop.workflow.js`); test #5 fires ReferenceError on a `read()` call (the Inc-2 defect class). The cheap guard now exists. |
| 3 — Timeout → killed (3 sites, TDD) | Implemented | **Code-verified** `cover-gates.mjs:112` `killed++` now `Killed||Timeout`; `:104` `isSurvivor` excludes Timeout; `Timeout` kept in `DENOMINATOR_STATUSES` (reachable denominator intact). Inline copy byte-synced (`SYNC OK`). Test updated 60→70 / 4→3 + new Timeout-killed assertion. |
| 4 — `kb-write.mjs` serializer (TDD) | Implemented | 3 pure fns (`buildRulesSection`/`buildStatusFooter`/`supersedingRules`) + 15 tests incl. supersede (Key Files/Edge Cases/Source preserved). Returns text; the disk write is the controller's (Step 5). |
| 5 — Pipeline controller `loop.workflow.js` | Implemented (Deviated — valid) | Mine→Verify→(KB write)→Cover→flip→report. `workflow()` preferred + `MONOLITH_FALLBACK` flag (composition unverified — plan-sanctioned). Budget cap `budget.spent()` vs 1.5M ceiling. Ratchet reused. Helpers inlined (no static import). |
| 6 — Clean-room seal | Implemented (Deviated — valid) | `agent()` has no `disallowedTools`; restricted `agentType` unverifiable at build → **PROMPT-ONLY fallback** (plan-sanctioned), declared in the controller header + every report. No mechanical seal claimed (ADR-13). |
| 7 — Self-written run report | Implemented | Controller auto-writes `cover-{class}.md`; zero-survivor renders `_No reachable survivors._` (the Step-3-interaction note); candidate-bug section always present. |
| 8 — Live validation runs | N/A — operator-owed (correctly deferred) | Exact `Workflow({scriptPath}, {target})` invocations for BugRatio (re-prove) + CycleTime (generalize) documented, with the three bringup checks (args injection / `workflow()` nesting / agentType seal). Golden-set-absent handling for CycleTime noted. |

**Deviations assessed — all valid:**
- **Two-agent KB-write seam** (Step 4/5) — the orchestrator has no fs, so an agent reads the existing KB and an
  agent writes the new text (the pure serializer computes it). Sound; mirrors Inc-2's no-fs-orchestrator pattern.
- **`MONOLITH_FALLBACK` flag** (Step 5) — `workflow()` composition unverified at build; both paths built, operator
  flips the flag at Step-8 if nesting fails. Plan-sanctioned investigation-with-fallback.
- **PROMPT-ONLY clean-room** (Step 6) — sanctioned fallback, openly documented.
- **Contract test extended to `loop.workflow.js`** (+2 tests, 10 not 8) — `loop.workflow.js` is a new script born
  in Step 5; testing it is correctness, not scope creep.
- **boy-scout removed unused `MINE_VERIFY_RETURN_SCHEMA`** — valid in-file cleanup.
- **Step 8 operator-deferred** — ADR-18 + Inc-2 precedent.

**Skill-conformance (scored against `.claude/audit/skill-invocations.log`, this session `a6015324`):** the TDD:yes
steps (2, 3, 4) require `tdd` — `nexus:tdd` is logged (developer, 2026-06-22T12:43, session `a6015324`); `nexus:boy-scout`
also logged (12:58, matching the disclosed cleanup). `## Skills Used` present and corroborated — no fabrication,
no missing-section gate. Steps 1/5/6/7 are `Skill: None` (legitimate gaps — no controller/serializer/contract-test
skill exists; logged for Inc-4). Gate met.

**Open production gate (operator-owed, NOT a done-check failure):** the entire *live* value — the controller
actually running Mine→Verify→Cover end-to-end, and the three runtime-bit bringup checks (`args` injection,
`workflow()` nesting, the `agentType` seal) — is **unproven until Step 8 runs**. The gate *logic* + the offline
contract test are proven (285 tests green); the *orchestration* is not. This is by design for a build-only round.

**Verdict: PASS** — Steps 1–7 Implemented (5/6/7 with valid, documented deviations); Step 8 correctly
deferred-and-documented; skill-conformance met; no `Missing`. 285 tests pass / 0 fail.

**For the Step-2 reviewer — focus areas (code-grounded mandatory):** (a) the **two-agent KB-write seam** in
`loop.workflow.js` — does the read-agent/write-agent pattern thread correctly, and is the serialized KB valid §5
markdown? (b) the **monolith fallback path** — is it actually equivalent to the `workflow()` path, or has it
drifted? (c) the two inlined helper copies (gates + kb-write) — confirm byte-sync vs the source modules. These are
the source-only-visible risks the offline test can't reach.

*Status: COMPLETE — architect, 2026-06-22*

## Step 2 — Code Review

## Reviewed By
Reviewer agent — code-grounded (all five source files read in full, tests run live, inlined-copy byte-comparison performed).

## Verdict: APPROVED

## Pre-commitment Predictions
Predictions before reading the source (the focus areas from the done-check):

1. **Two-agent KB-write seam threading** — predicted risk that the read→serialize→write chain could lose data or that Cover could run against stale content. **Found: CORRECT for the happy path; a minor divergence in the empty-content fallback (see Finding 1). The happy path is safe.**
2. **Monolith fallback drift from composition path** — predicted the two paths might diverge at a business-logic level. **Found: logic-equivalent for the gate battery and ratchet; only the KB-write path in `supersedingRules` diverges (new-entry case only — see Finding 1).**
3. **Inlined-copy byte-sync (gates + kb-write)** — predicted drift in the Step-3 Timeout fix across copies. **Found: `mutationFloor` copies are byte-identical across `cover-gates.mjs`, `cover.workflow.js`, and `loop.workflow.js`. Gate helpers confirmed in sync. `supersedingRules` inline has a behavioral divergence in one branch (Finding 1).**
4. **Runtime-contract regressions (static import / undefined global)** — predicted a new undefined-global or static-import could have been introduced. **Found: none. `node --test` sandbox confirms clean.**
5. **`args` parameterization back-compat** — predicted the `??` pattern might silently change BugRatio defaults. **Found: correct. `typeof args !== 'undefined' && args` guard is sound; BugRatio defaults are identical to pre-Inc-3 consts.**

## Findings

### [MEDIUM] `supersedingRules` inlined in `loop.workflow.js` diverges from source on the new-entry path
**File:** `harness/loop.workflow.js:214`
**Origin:** implementation
**Issue:** When `existingKbContent === ''` (the KB-read agent returns no content — i.e. a fresh target class with no existing KB file), `text.indexOf('\n## Rules')` is `-1`. The inlined copy falls back to:
```js
return text + '\n\n' + buildRulesSection(rules) + '\n\n---\n' + buildStatusFooter(...)
```
The source module (`kb-write.mjs:94`) instead calls `_insertRulesIntoNew`, which finds the first `\n## ` heading and inserts the Rules section BEFORE it, placing Key Files / Edge Cases / Relationships / Source after Rules per design §5 section order. The inline appends Rules AFTER all existing non-empty content when a real partial KB (with other sections but no Rules) is passed. For an empty string (agent failure path) both produce equivalent output; for a non-empty string missing `## Rules`, the order is inverted.

The production impact for BugRatio is zero (the existing KB always has `## Rules`). For a new class target like CycleTimeAnalyzer at Step 8, if the KB file is absent or the read agent fails, the resulting KB entry will have Rules appended after other sections rather than inserted before them — a design §5 schema violation.

**Fix:** Replace the inlined no-`## Rules` branch with a proper `_insertRulesIntoNew`-equivalent inline, or add a private named function identical to `kb-write.mjs`'s `_insertRulesIntoNew` and call it from the inlined `supersedingRules`:
```js
// At line 214, replace the one-liner return with:
function _insertRulesIntoNew(text, rules, { date, mutationGated, runNote }) {
  const firstSectionMatch = text.match(/\n## /);
  const insertAt = firstSectionMatch ? text.indexOf('\n## ') : text.length;
  const before = text.slice(0, insertAt);
  const after = text.slice(insertAt).replace(/\n---[\s\S]*$/, '');
  const newRulesBlock = '\n\n' + buildRulesSection(rules);
  const footer = '\n\n---\n' + buildStatusFooter({ mutationGated, date, runNote });
  return before + newRulesBlock + after + footer;
}
// Then in supersedingRules, replace the one-liner:
if (rulesHeadingIdx === -1) { return _insertRulesIntoNew(text, rules, { date, mutationGated, runNote }); }
```
**Confidence:** 95/100

## Positive Observations
- **Gate battery byte-sync (Step 3 Timeout fix):** `mutationFloor` in `cover-gates.mjs` (lines 99–131), `cover.workflow.js` (lines 110–131), and `loop.workflow.js` (lines 141–157) are byte-identical. The `isSurvivor` change and `killed++` predicate both updated consistently. `DENOMINATOR_STATUSES` unchanged — Timeout stays in the denominator.
- **KB-write seam is correctly filesystem-mediated:** The two-agent (read → write) pattern is sound. Phase 2 reads the existing KB content via an agent, computes the new text in pure JS, then delegates the file write to a second agent. Cover then reads the freshly-written KB file in Phase 3. The chain is correct for the happy path.
- **No new undefined globals or static imports** across all three workflow scripts — confirmed by the offline contract test AND by reading source. The `typeof args !== 'undefined' && args` guard is the correct pattern for an unverified runtime injection.
- **Monolith fallback logic-equivalence:** The monolith path in Phase 3 (lines 464–507) runs the full gate battery identically to `cover.workflow.js`. The ratchet, budget cap, and all-gates-green signals are consistent. The `MONOLITH_FALLBACK = false` const is well-placed for the Step-8 operator flip.
- **Report zero-survivor rendering:** `survivorsSection` at lines 553–557 correctly emits `_No reachable survivors._` when the survivors list is empty — the Step-3 interaction note is handled.
- **`supersedingRules` happy path (existing KB with `## Rules`):** The inlined copy is byte-faithful to the source for this branch (lines 215–229 of `loop.workflow.js` vs lines 98–133 of `kb-write.mjs`). The footer replacement logic is identical.
- **Budget cap uses `budget.spent()` not `budget.remaining()`** — the HIGH-1 critic finding is correctly applied throughout (lines 336, 498, 513).
- **`kb-write.mjs` test coverage (15 tests):** All three functions tested including the supersede case. The `supersedingRules` tests cover: rules replaced, Key Files/Edge Cases/Relationships/Source preserved, footer updated, 3-rule replacement, header preserved. (The new-entry path where `## Rules` is absent from the existing KB is not tested — this is the path that exposes Finding 1.)

## Gaps
- **`supersedingRules` new-entry path not tested in `kb-write.test.mjs`** — the EXISTING_KB fixture always has `## Rules`. A test with an existing KB that has other sections but no `## Rules` section would have caught the inlined divergence. Low priority since the production path is the supersede-path (BugRatio KB always has `## Rules`), but it is the exact gap that hides Finding 1.
- **KB-read failure path untested in `workflow-contract.test.mjs`** — the test always provides `kbReadReturn = { content: '...' }`. The WARNING path (line 367: `kbReadResult?.content` falsy → `existingKbContent = ''`) is exercised neither by the contract test nor by the kb-write unit tests.
- **No test for `gateRows` report rendering in the composition path** — when `MONOLITH_FALLBACK = false`, `coverResult.gates` is sourced from the sub-workflow. The contract test verifies the controller completes and returns `allGatesGreen: true` but does not assert the gate-table content in the generated report. Minor — the rendering logic is straightforward.

## Open Questions
None — all focus-area findings resolved to ≥80 confidence.

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Full test suite | PASS | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 285 pass / 0 fail / 0 skip — `duration_ms 8018.9ms` |
| `loop.workflow.js` no static import | PASS | workflow-contract.test.mjs slice 8 | ✔ loop.workflow.js has no static import |
| `loop.workflow.js` sandbox run (composition path) | PASS | workflow-contract.test.mjs slice 9 | ✔ loop.workflow.js runs in mock-globals sandbox without ReferenceError (MONOLITH path) |
| Timeout fix byte-sync (3 sites) | CONFIRMED | Direct source read — cover-gates.mjs:112, cover.workflow.js:123, loop.workflow.js:151 | Identical: `if (m.status === 'Killed' \|\| m.status === 'Timeout') killed++` |
| `supersedingRules` inlined divergence | FOUND | Direct source comparison: loop.workflow.js:214 vs kb-write.mjs:91-95 | New-entry branch in loop differs from `_insertRulesIntoNew` helper |
| `budget.spent()` cap (no `budget.remaining()`) | CONFIRMED | loop.workflow.js:336, 498, 513 | All three budget checks use `budget.spent()` |

*Status: COMPLETE — reviewer, 2026-06-22*
