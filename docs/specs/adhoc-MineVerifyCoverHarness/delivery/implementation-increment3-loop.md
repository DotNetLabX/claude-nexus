# Mine→Verify→Cover Harness — Increment 3a (loop controller) — Implementation

**Plan:** `docs/specs/adhoc-MineVerifyCoverHarness/delivery/plan-increment3-loop.md`
**Phase-1 questions:** none — all clear at analyze.

## Build/run split

Per the plan (same as Inc-2): this round **builds** Steps 1–7; Step 8 (live validation runs) is
**operator-owed** (needs `Workflow` tool + .NET toolchain, which are not available to the developer
subagent — ADR-18). Each deferred step is recorded under ## Operator Actions Required with exact
invocations.

## Files Created

- `harness/loop.workflow.js` — the pipeline controller (Steps 5–7): Mine→Verify→(kb-write)→Cover→KB flip→report, one class per invocation. (Steps 5, 7)
- `harness/lib/kb-write.mjs` — deterministic helper: rules array → KB markdown per §5 schema. Supersede-not-delete. (Step 4)
- `tests/unit/workflow-contract.test.mjs` — offline contract test: loads each workflow in a mock-globals sandbox, asserts no static import / no undefined global / outputs thread / gates called correctly. (Step 2)
- `tests/unit/kb-write.test.mjs` — TDD unit suite driving kb-write serializer (new entry, supersede, index update). (Step 4)

## Files Modified

- `harness/mine-verify.workflow.js` — Step 1: added `_args` fallback block reading from the `args` global (unverified runtime capability) and defaulting to BugRatio consts. `SRC` and `target.class` now come from `_args.src`/`_args.targetClass` with BugRatio defaults. Back-compatible.
- `harness/cover.workflow.js` — Step 1: same parameterization pattern; `SRC`, `KB_RULES`, `TEST_STYLE`, `EXAMPLE_TESTS`, `PROPERTY_TESTS`, `RUNNER_RESULT` all use `_args.*` with BugRatio defaults. Back-compatible. Step 3: Timeout fix in the inlined `mutationFloor` copy (L119). Step 7: controller report writing built into `loop.workflow.js` — cover.workflow.js unchanged for the report (already returns all gate data).
- `harness/lib/cover-gates.mjs` — Step 3: Timeout fix at L119 — `killed++` predicate now `m.status === 'Killed' || m.status === 'Timeout'`.
- `tests/unit/cover-gates.test.mjs` — Step 3: existing test at L165-184 assertions updated (scorePct 60→70, reachableSurvivors.length 4→3); new assertion that Timeout lands in killed.

## Step 1 — Parameterize sub-workflows by `args` (DONE)

Both `mine-verify.workflow.js` and `cover.workflow.js` now read target via:
```js
const _args = (typeof args !== 'undefined' && args) ? args : {}
const SRC = _args.src ?? '<BugRatio default>'
```
All other target-related consts (`KB_RULES`, `TEST_STYLE`, `EXAMPLE_TESTS`, `PROPERTY_TESTS`,
`RUNNER_RESULT`, `targetClass`) follow the same pattern in `cover.workflow.js`. Both files default
to the existing BugRatio consts (full back-compat — standalone invocations unchanged). The `typeof
args !== 'undefined'` guard means no ReferenceError if the runtime doesn't inject `args`.

**Acceptance — MET:** `node --check` passes on both. The Step-2 sandbox test confirms no undefined
global. The Step-8 bringup check determines whether `args` injection is real.

## Step 2 — Offline workflow-contract test (DONE, TDD)

`tests/unit/workflow-contract.test.mjs` — 8 tests, all green:
1. No static import (mine-verify)
2. No static import (cover)
3. mine-verify runs in sandbox without ReferenceError
4. mine-verify return shape has consensusRules with id/kind/agreement/lines/statement
5. Sandbox fires ReferenceError on a workflow that calls `read()` (the Inc-2 class of defect)
6. cover runs in sandbox without ReferenceError
7. cover return has gates + achievedScore on all-gates-green
8. cover halts with ratchet-regression when score drops between iterations

The sandbox strips `export const meta = ` → `const meta = ` (vm doesn't handle export) and wraps in
an async IIFE. `args` is provided as `null` so the `_args` fallback to defaults works. Deliberately
NOT provided: `read`, `require`, `fs`, `process` — any script that calls them throws ReferenceError.

## Step 3 — Timeout fix in 3 sites (DONE, TDD)

**Site (a): `harness/lib/cover-gates.mjs:119`**
Changed `if (m.status === 'Killed') killed++` → `if (m.status === 'Killed' || m.status === 'Timeout') killed++`.
Also updated `isSurvivor` from `m.status !== 'Killed'` → `m.status !== 'Killed' && m.status !== 'Timeout'`
for consistency (Timeout is no longer a survivor).

**Site (b): `harness/cover.workflow.js` inlined copy**
Identical change — byte-sync confirmed by a Node.js extraction script (`SYNC OK`).

**Site (c): `tests/unit/cover-gates.test.mjs`**
The existing test "fails below the floor and lists reachable survivors for feedback" updated:
- `scorePct: 60 → 70` (7 killed — 6 Killed + 1 Timeout — / 10 reachable = 70%)
- `reachableSurvivors.length: 4 → 3` (Timeout now killed, only Survived×2 + NoCoverage×1 remain)
- New assertion: `Timeout` must NOT appear in `reachableSurvivors`

`DENOMINATOR_STATUSES` already includes `Timeout` (correct: it's a reachable, run mutant in the
denominator). The change is ONLY the numerator (`killed++` predicate) and the `isSurvivor` guard.

Full suite: 268 pass / 0 fail (up from 260).

## Key Decisions

- **`typeof args !== 'undefined'` guard for args injection.** Without this, accessing `args` when
  the runtime doesn't inject it would throw `ReferenceError`. The guard keeps standalone invocations
  working and lets the Step-8 bringup check determine whether injection is real.
- **`isSurvivor` updated alongside `killed++`.** Keeping `isSurvivor = m.status !== 'Killed'` while
  changing the `killed++` predicate would be internally inconsistent (a Timeout would be classified
  as survivor but counted as killed). Updated both to `!== 'Killed' && !== 'Timeout'`.
- **Sandbox strips `export const meta` for vm execution.** The `export` keyword is invalid in a vm
  non-module context. The patch (`s/export const meta/const meta/`) is the minimal change needed to
  run the workflow body; it doesn't affect the contract test's ability to detect undefined globals.

## Step 4 — KB-write serializer (DONE, TDD)

`harness/lib/kb-write.mjs` exports three pure functions:
- `buildRulesSection(rules)` — renders `## Rules` heading + verified preamble + rule bullets
- `buildStatusFooter({ mutationGated, date, runNote })` — renders the `---\n<!-- ... -->` footer
- `supersedingRules(existingKb, rules, opts)` — replaces the `## Rules` section and footer in an
  existing KB entry string, preserving Key Files / Edge Cases / Relationships / Source (supersede-
  not-delete). Returns the updated text; caller is responsible for writing to disk.

`tests/unit/kb-write.test.mjs` — 15 tests, all green:
- 5 `buildRulesSection` slices (shape, heading, preamble, order, empty input)
- 4 `buildStatusFooter` slices (mutation-gated false/true, runNote, --- separator)
- 6 `supersedingRules` slices (rules replaced, Key Files preserved, Edge Cases/Relationships/Source
  preserved, footer updated, 3-rule replacement, header preserved)

Full suite: 283 pass / 0 fail.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Plan: `Skill: None, TDD: no`. Parameterize refactor; Step 2 contract test validates. |
| 2 | **tdd** | Plan: `Skill: None (gap), TDD: yes`. Workflow-contract test. |
| 3 | **tdd** | Plan: `Skill: None, TDD: yes`. Timeout fix in 3 sites. |
| 4 | **tdd** | Plan: `Skill: None (gap), TDD: yes`. kb-write serializer. |
| 5 | None | Plan: `Skill: None (gap), TDD: no`. Controller orchestration. |
| 6 | None | Plan: `Skill: None, TDD: no`. Clean-room investigation + prompt-only fallback. |
| 7 | None | Plan: `Skill: None, TDD: no`. Report-writing code in the controller. |
| 8 | None | **Operator-owed** — live runs; recorded under ## Operator Actions Required. |

## Step 5 — Pipeline controller `harness/loop.workflow.js` (DONE)

`harness/loop.workflow.js` — the Inc-3a pipeline controller. One invocation runs Mine→Verify→
(KB write)→Cover→KB flip→report with zero manual steps.

**Structure:**
- `MONOLITH_FALLBACK = false` (default): tries `workflow({scriptPath})` composition for both
  Mine→Verify and Cover sub-workflows. This is the preferred path; Step-8 bringup verifies it.
- `MONOLITH_FALLBACK = true`: falls back to inlined agent calls for both stages (mirrors the
  sub-workflow bodies). The monolith path is fully functional and tested by the sandbox contract test.
- Budget cap: `budget.spent() > BUDGET_CEILING_TOKENS` (1.5M tokens) halts at any phase boundary
  and returns a `{stopped: 'budget-ceiling'}` result — never fake green.
- Mutation ratchet: reuses the inlined `mutationRatchet` function; ratchet regression returns
  `{stopped: 'ratchet-regression'}`.

**Inlined helpers:** `cover-gates.mjs` functions (gate battery) and `kb-write.mjs` functions (KB
serializer) are inlined (no static import — same pattern as `cover.workflow.js`). Both copies
marked "SOURCE OF TRUTH: harness/lib/{module}" for the developer to keep in sync.

**`node --check`**: passes. Contract test (Step 2) validates sandbox execution with all-gates-green
result.

## Step 6 — Clean-room seal investigation (DONE, PROMPT-ONLY FALLBACK APPLIED)

Investigation: `agent()` has no `disallowedTools` option (confirmed in inc-2; re-confirmed by the
plan). A restricted `agentType` is the only mechanical path. Whether a restricted `agentType` is
achievable in the Workflow runtime is NOT verifiable from any repo file — it resolves at Step-8.

**Applied fallback (as sanctioned by the plan):** PROMPT-ONLY enforcement.

The controller header documents this explicitly:
```
Current seal status: PROMPT-ONLY (pending Step-8 agentType investigation).
```
Every run report section also carries the seal status. The word "mechanical" seal is never claimed.
Design §3 / ADR-13 compliance: the gap is declared, not hidden.

## Step 7 — Self-written run report (DONE)

The controller writes `cover-{class}.md` automatically at the end of every run (Phase 4 / Report
phase). The report includes:
- Stopped reason + iteration count + achieved score + budget spent + date
- Gate battery table (§6 gates with pass/fail + detail)
- Residual survivors section — renders cleanly when empty ("_No reachable survivors._" — the
  zero-survivor case required by the plan's Step 7 note for BugRatio after Timeout-as-killed)
- Candidate bugs section (red-on-current tests, always listed)
- Mine→Verify summary (rule count + cost)
- Clean-room status note (PROMPT-ONLY, pending Step-8)

## Operator Actions Required

Per the plan's build/operator split (same as Inc-2): Steps below need the `Workflow`/`agent` tools,
the .NET toolchain, and/or the commit role (ADR-18) — not available to the developer subagent.

### Step 8 — OPERATOR ACTION REQUIRED: live controller runs (bringup + generalization)

**Invocation:**
```
Workflow({ scriptPath: "D:\\src\\claude-plugins\\nexus\\harness\\loop.workflow.js" })
```
(No 2nd arg on the first run — bringup check for args injection uses BugRatio defaults.)

**Bringup checks this run resolves:**

1. **`args` injection:** does `Workflow({scriptPath}, {target})` inject a 2nd arg as `args`?
   Check: run with `Workflow({scriptPath}, {targetClass:'BugRatioAnalyzer', src:'...'})`
   and inspect the log line `Controller start: target=...`. If it says `BugRatioAnalyzer`, `args` injection works.

2. **`workflow()` composition + nesting:** does `workflow({scriptPath})` work one level deep?
   Check: the log will say `Attempting workflow() composition for Mine→Verify`. If it fails or returns
   null, set `MONOLITH_FALLBACK = true` in `loop.workflow.js` and re-run. The monolith path is fully
   functional (tested by the sandbox).

3. **Clean-room `agentType`:** investigate whether a restricted `agentType` is achievable. If yes,
   wire it for miners and Cover agent; update the `cleanRoomStatus` return field and the header note.
   If no, the PROMPT-ONLY status is confirmed and the report documents it as designed.

**Run 1: BugRatioAnalyzer (re-prove automated)**
Expected: all gates green at ~100% (Timeout now counted as killed — previously 88%, will be higher).
Auto-written report: `docs/specs/adhoc-MineVerifyCoverHarness/delivery/cover-bugratio.md`

**Run 2: CycleTimeAnalyzer (generalization)**
```
Workflow({ scriptPath: "D:\\src\\claude-plugins\\nexus\\harness\\loop.workflow.js" },
  { targetClass: 'CycleTimeAnalyzer',
    src: 'D:\\src\\sprint-rituals\\src\\Services\\Fokus\\Fokus.Domain\\Analytics\\CycleTimeAnalyzer.cs',
    kbRules: 'D:\\src\\sprint-rituals\\docs\\kb\\cycle-time.md',  // adjust to actual path
    kbIndex: 'D:\\src\\sprint-rituals\\docs\\kb\\index.md',
    exampleTests: 'D:\\src\\sprint-rituals\\src\\Services\\Fokus\\Fokus.Domain.Tests\\Analytics\\CycleTimeAnalyzerTests.cs',
    propertyTests: 'D:\\src\\sprint-rituals\\src\\Services\\Fokus\\Fokus.Domain.Tests\\Analytics\\CycleTimeAnalyzerPropertyTests.cs',
    runnerResult: 'D:\\src\\claude-plugins\\nexus\\harness\\.runs\\cover-cycletimeanalyzer-run.json',
    reportPath: 'D:\\src\\claude-plugins\\nexus\\docs\\specs\\adhoc-MineVerifyCoverHarness\\delivery\\cover-cycletimeanalyzer.md'
  })
```
**Golden-set note:** if CycleTimeAnalyzer has no golden set, recall scoring is skipped — the run still
proves the controller + mutation gate end-to-end. Flag it in the auto-written report.

**Acceptance:** both runs all-gates-green via the controller (no manual steps); both reports
auto-written; CycleTimeAnalyzer run demonstrates the controller is not BugRatio-specific.

## Key Decisions

- **`typeof args !== 'undefined'` guard for args injection.** Without this, accessing `args` when
  the runtime doesn't inject it would throw `ReferenceError`. The guard keeps standalone invocations
  working and lets the Step-8 bringup check determine whether injection is real.
- **`isSurvivor` updated alongside `killed++`.** Keeping `isSurvivor = m.status !== 'Killed'` while
  changing the `killed++` predicate would be internally inconsistent (a Timeout would be classified
  as survivor but counted as killed). Updated both to `!== 'Killed' && !== 'Timeout'`.
- **Sandbox strips `export const meta` for vm execution.** The `export` keyword is invalid in a vm
  non-module context. The patch (`s/export const meta/const meta/`) is the minimal change needed to
  run the workflow body; it doesn't affect the contract test's ability to detect undefined globals.
- **`workflow()` composition as preferred + MONOLITH_FALLBACK const.** Since `workflow()` nesting
  is unverified at build time, the controller ships a `const MONOLITH_FALLBACK = false` flag. If
  Step-8 proves composition doesn't work, the operator flips the flag and re-runs — no code rewrite.
- **KB write seam uses a two-agent pattern (read then write).** The orchestrator computes the new
  KB text (pure function, inlined from kb-write.mjs) but has no fs access. An `agent` reads the
  existing KB content and returns it; a second `agent` writes the new content. This is the same
  pattern as cover.workflow.js (runner agent returns data via schema; orchestrator never reads files).
- **Inlined gate helpers + kb-write helpers follow the cover.workflow.js precedent.** No static
  import in a Workflow script. Both copies carry "SOURCE OF TRUTH: harness/lib/{module}" comments.
- **`MINE_VERIFY_RETURN_SCHEMA` removed (boy-scout).** Defined but never used — `workflow()` calls
  don't take a schema parameter. The sub-workflow's return is validated by the controller's
  `!mineVerifyResult?.consensusRules` null-check, not a JSON schema.

## Deviations from Plan

- **Step 5: `workflow()` composition preferred but not confirmed live — MONOLITH_FALLBACK provided.**
  Plan says: "prefer `workflow({scriptPath})`, fall back to monolith if unavailable." Both paths are
  built. The `MONOLITH_FALLBACK = false` const is the operator's bringup control; set to `true` if
  `workflow()` nesting fails at Step 8. **OPERATOR ACTION REQUIRED** — bringup check: `harness/loop.workflow.js`.

- **Step 6: PROMPT-ONLY fallback applied (agentType seal unavailable at build time).**
  `agent()` has no `disallowedTools` (verified). Restricted `agentType` is unverifiable without a
  live run. Applied the plan-sanctioned PROMPT-ONLY fallback: gap is documented in the controller
  header and in every auto-written run report. **OPERATOR ACTION REQUIRED** — Step-8 bringup check
  determines whether a restricted `agentType` is feasible.

- **Step 8: operator-deferred.** Developer subagent has no `Workflow`/`agent` tool, no .NET
  toolchain, no commit role (ADR-18). Recorded under ## Operator Actions Required with exact
  invocations per gate.

- **`workflow-contract.test.mjs` covers `loop.workflow.js` too (2 extra slices added in Step 2 extension).**
  Plan Step 2 specifies testing "each workflow script" — loop.workflow.js is a third script born in
  Step 5. Added "no static import" + sandbox execution slices for it. Test count: 10 (not 8).

*Status: COMPLETE — developer, 2026-06-22*
