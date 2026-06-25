# Spec-driven Cover front-end + spec-vs-code diff (full-build Increment 1) — Implementation

**Slug:** adhoc-SpecDrivenHarnessBuild
**Plan:** `docs/specs/adhoc-SpecDrivenHarnessBuild/delivery/plan.md` (Steps 1-7)
**Phase:** 2 (Implement) — Phase-1 analysis complete, blocking questions Q6/Q7 answered, Q8 default confirmed.
**Date:** 2026-06-25

Live-source/git re-confirmation done before writing a line (all held — see Developer Lessons in `lessons.md`):
`Validate`'s 7-rule firing order matches the `ruleOrder` constant exactly
(`GeneratedSqlValidator.cs:227-303`); KG HEAD carries `> 0.01` and the working tree is dirty-with-patch
(` M`, no `1e-9` commit — `git log -S "1e-9"` empty); `PreComputedStatsTables` contains
`analytics_store_category_stats` (the Step-7 fixture-pin table); the golden set defines GOLD-01..12 with a
`Code attestation` column (file:line); `harness/.runs/` is git-ignored (`.gitignore:30`);
`tests/unit/*.test.mjs` is in the selfcheck CI glob (`scripts/selfcheck.mjs:44`).

## Files Created

- `harness/spec-cover.workflow.js` — **(Steps 3, 6)** the runnable spec-driven Cover front-end. The
  3-actor `cover.workflow.js` shape extended with the spec-load agent (the single permitted golden-text
  reader — ADR-C) and the guided-miner agent (Step 2 fallback). Inlines the `spec-diff.mjs` helpers AND the
  `cover-gates.mjs` gate helpers verbatim (the runtime can't import). Drives its OWN loop — reds route to
  the labeler before any green gate (`suiteGreen` never over reds — divergence 1); the mutation pass runs
  over the GREEN subset only (reds quarantined as candidate bugs — divergence 2). Writes the self-contained
  run report (3-axis diff + candidate-bug queue + needs-triage bucket — Step 6) to git-ignored
  `harness/.runs/spec-cover-generatedsqlvalidator.md` (Q8). Live two-arm dotnet+Stryker run is operator-owed
  (Q7) — see Deviations.
- `tests/unit/spec-cover-workflow.test.mjs` — **(Step 3)** the offline runtime-contract guard for the
  workflow (the `workflow-contract.test.mjs` sandbox pattern). Pins: runs to return with no ReferenceError
  (no fs/Date/Math.random/undefined global); parses both args shapes; the case-4 red reaches the
  candidate-bug queue (reuse boundary AC-1 — never gated by `suiteGreen`); the green-subset mutation pass
  scores the passing tests; the golden path is in the spec-load prompt ONLY (AC-3(a)); the Cover prompt
  directs tests to the isolated assembly and forbids `KnowledgeGateway.Tests` (AC-3(b)); meta is a pure literal.
- `harness/lib/spec-diff.mjs` — **(Steps 2, 4, 5)** the spec-driven direction's deterministic pure-helper
  module (the `cover-gates.mjs` shape). `decideLocation` + `evaluateMinerResult` (Step 2 seam),
  `classifyRule` + `serializeDiff` (Step 4 three-axis diff), `labelRed` + `RULE_ORDER` (Step 5 5-case
  FP-labeler). No LLM, no .NET, no fs — inlined verbatim into `spec-cover.workflow.js` (the runtime can't
  import).
- `tests/unit/spec-diff.test.mjs` — **(Steps 2, 4, 5)** the exhaustive offline unit suite (`node --test`,
  in the CI glob per `selfcheck.mjs:44` — AC-7). Covers `decideLocation` (attestation / miner-fallback /
  `NO-CODE-FOUND`), the miner mis-location → `needs-triage` caveat, the three-axis diff (every rule in
  exactly one axis), and all five FP-labeler cases incl. case 4 (the L272 shape) and case 5
  (ARTIFACT-04-modelled un-constructable fixture).
- `harness/targets/generatedsqlvalidator-l272-fixture.json` — **(Step 7)** the PINNED L272 known-answer
  fixture. The SQL (`SELECT … FROM public.analytics_store_category_stats … WHERE ascs.osa_pct > 0.86`,
  `resolvedThreshold: "0.85"`) is constructed so ONLY Rule 5 can fire — rules 1-4/6/7 all pass (per-rule pin
  rationale embedded + verified against live source). Carries the two-arm known answer: pre-fix
  (`> 0.01`) → `actual === "NoStrayLiteralThreshold"` (the over-rejection); patched (`> 0.01 + 1e-9`) →
  `null` (green). Loaded by the Step-7 unit tests AND the single source of truth for the operator's live run.
- `harness/targets/generatedsqlvalidator.json` — **(Step 1)** the target config for the spec-driven run.
  Carries the class source path, the isolated-assembly target
  (`KnowledgeGateway.SpecHarness.Tests` — never `KnowledgeGateway.Tests`), the KG **product** `.csproj`
  the isolated assembly references, and the **full** golden-id set `GOLD-01..12` (ids only, no rule text —
  Q6 answer: the whole class golden set, denominator 12 per `golden-set.md:76`, mirroring how
  `bugratio.json` lists BugRatioAnalyzer's whole `GOLD-16..18` set). The `_note` mirrors `bugratio.json`'s
  sequestration note in intent (golden IDs only; golden text sequestered, read by the spec-load agent
  alone). Carries the 7-element `ruleOrder` constant (the validator's positional firing order) with an
  explicit `_ruleOrderNote` that the catalog ids do NOT positionally map to `ruleOrder` (GOLD-08 = Rule 5,
  GOLD-05 = Rule 2 — the binding Q6 caveat).

## Files Modified

- `tests/unit/workflow-contract.test.mjs` — **(Step 3)** added `spec-cover.workflow.js` to the shared
  contract loop: a new `SPEC_COVER_PATH` const, the path appended to the meta-purity `for` loop, and a
  no-static-import test. The workflow's *full* sandbox-run contract lives in the dedicated
  `spec-cover-workflow.test.mjs`; this change makes the new workflow a first-class member of the canonical
  no-import + pure-literal-meta guard alongside the other five harness workflows. (Net +2 tests; all 31 in
  the file pass.)

## Key Decisions

- **`spec-diff.mjs` carries a fourth `both-agree` bucket** beyond the plan's three named axes. AC-4 demands
  "every rule classifies into **exactly one** axis"; a spec rule matched to a code rule on the **same**
  boundary is neither a divergence nor a missing/undocumented rule, so labeling it `both-divergent` would be
  wrong. `both-agree` keeps the every-rule-in-exactly-one-axis accounting complete without mis-labeling an
  agreement as a divergence. The serialized diff still leads with `spec ∧ ¬code` (the headline ordering).
- **Match key = rule NAME, never a GOLD-id ordinal** (the binding Q6 caveat). `classifyRule`, `diffRules`,
  and `labelRed` all key off `ruleName` / `RULE_ORDER` position. `labelRed` has an explicit test proving a
  case-4 over-rejection is recognized by the rule name regardless of which GOLD-id it carries.
- **The runner reports per-test `{ id, ruleName, expected, actual, errored }` outcomes** (an extension of
  `cover.workflow.js`'s `redOnCurrent`). The orchestrator needs the observed `actual` Validate-return to
  feed `labelRed` — a bare red list (test name only) can't be classified into the 5-case table. The runner
  still never deletes a red (ADR-D); it reports the outcome and quarantines the red for the mutation pass.
- **`suite_green_subset` is computed but only as the mutation-pass precondition.** It is the inlined
  `suiteGreen` helper run over the GREEN-subset double-run (Stryker needs a baseline-green suite). It is
  **never** applied to the spec-driven reds as a pass/fail — the reds route to `labelRed` before this gate
  runs (the AC-1 reuse boundary; pinned by a Step-3 sandbox test).
- **The L272 known-answer is proven offline by modeling Rule-5's IEEE-754 comparison** (`Math.Abs(literal -
  threshold) > margin`) rather than running live .NET. The comparison is a pure predicate, so the pre-fix
  vs patched outcome is deterministic and provable in `node --test`. This is the developer-phase AC-6 proof
  (Q7 = A); the live behavioral run confirms it operator-side.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan: `Skill: None — TDD: no`. Wiring-only: the target config (a JSON data file mirroring `bugratio.json`) + the spec-load agent *contract* (wired into the Step-3 workflow, its host). No behavior to unit-test. |
| 2 | tdd | plan: `Skill: None — TDD: yes`. Red-green-refactor on `decideLocation` + `evaluateMinerResult` (attestation / miner-fallback / `NO-CODE-FOUND` / mis-location). |
| 4 | tdd | plan: `Skill: None — TDD: yes`. Red-green-refactor on `classifyRule` + `diffRules` + `serializeDiff` (every rule in exactly one axis; spec∧¬code first). |
| 5 | tdd | plan: `Skill: None — TDD: yes`. Red-green-refactor on `labelRed` + `RULE_ORDER` (all 5 cases incl. case 4 L272 + case 5 ARTIFACT-04; keyed off rule name, not GOLD-id). |
| 3 | tdd | plan: `Skill: tdd — TDD: yes`. The workflow's testable behavior is its sandbox-run; `tdd` invoked (red: workflow absent → sandbox ReferenceError; green: workflow runs to return). Contract tests gate the reuse-boundary divergences + clean-room isolation. |
| 6 | None | plan: `Skill: None — TDD: no`. Report-writing is folded into the Step-3 workflow (the self-written-report pattern of `loop.workflow.js:647-719`); its content is asserted via the Step-3 sandbox tests (candidate-bug queue + needs-triage bucket in the return). |
| 7 | None | plan: `Skill: None — TDD: no`. Wire-and-handoff (Q7 = A): pinned fixture + offline known-answer unit proof (`node --test tests/unit/spec-diff.test.mjs` green) + the `OPERATOR ACTION REQUIRED` runbook (Deviations). The live two-arm run is operator-owed (no-git-writes boundary). |

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Triple inline-duplication of pure helpers (sync hazard) | low | reviewer | `spec-cover.workflow.js:73-300` re-inlines `spec-diff.mjs` (lines 25-end) + `cover-gates.mjs` helpers verbatim | **Intentional** — the Workflow runtime can't `import` (workflow-contract.test.mjs), the established `cover-gates.mjs`↔`cover.workflow.js` pattern. The unit tests gate the `spec-diff.mjs` source-of-truth; the inlined copies are validated by `spec-cover-workflow.test.mjs`'s sandbox run (it exercises the inlined `labelRed`/`diffRules`). Reviewer: confirm the two copies are byte-identical for the shared fns (a drift wouldn't fail a test unless the inlined path is exercised — it is, for `labelRed` + `diffRules` + the gate helpers). |
| AC-4 `code ∧ ¬spec` axis empty without `_args.codeRules` | low | reviewer | `spec-cover.workflow.js` `Diff+Label` phase: `const codeRules = _args.codeRules ?? []` | The three-axis diff's code-side is the operator-supplied mine-verify `consensusRules` (D4 seam). AC-4 "every rule in exactly one axis" is proven by the `diffRules` unit test (which feeds both spec + code rules), not by a live full-run. The live diff populates `code ∧ ¬spec` only when the operator passes the mine-verify output — consistent with the harness's operator-seam lineage. |
| Live two-arm AC-6 reproduction is operator-owed | medium | architect | implementation.md Deviations D3 (`OPERATOR ACTION REQUIRED` runbook) | Plan-sanctioned (Q7 = A); the developer-phase offline proof (`node --test tests/unit/spec-diff.test.mjs` green) is complete. The live behavioral L272 reproduction is recorded here when the operator executes it. Done-check disposition (architect pre-declared in Q7): offline parts Implemented; live arm `Deviated (valid reason)`. |
| Spec-load agent maps golden rules → Validate rule names at runtime (LLM judgment) | low | reviewer | `spec-cover.workflow.js` spec-load prompt: `ruleName` field "the Validate() rule name this golden rule maps to, if it maps to one" | The golden→Validate-rule mapping is done by the spec-load agent, not hard-coded — several golden rules can map to one Validate rule (e.g. GOLD-01..04 all → `SingleSelect`/structure). The labeler keys off `ruleName`; a mis-mapping would mis-key a red. The unit tests pin the labeler logic; the agent's mapping fidelity is an operator-verified surface (like the miner's locate fidelity, AC-2). |

## Deviations from Plan

### D1 — Step execution order: 2 → 4 → 5 before 3 (inline-after-define dependency)
The plan numbers steps 1-7 sequentially, but Steps 2, 4, 5 all build the pure-helper module
`harness/lib/spec-diff.mjs` (TDD), and Step 3 builds the workflow that **inlines those helpers verbatim**
(the runtime can't import). Building the Step-3 workflow before the helpers it inlines exist would mean
inlining incomplete logic. I implemented the pure-helper TDD steps (2 → 4 → 5) first, completing
`spec-diff.mjs` + its full test, then built the Step-3 workflow that inlines the finished helpers, then
Steps 6 (folded into the workflow) and 7. Every plan step is fully implemented; only the *order* differs,
for a sound dependency reason. No behavior changed.

### D2 — Step 6 report folded into the Step-3 workflow file (not a separate file)
The plan's Step 6 ("the orchestrator writes a self-contained run report") is the `loop.workflow.js:647-719`
self-written-report pattern, which lives **inside** the orchestrator workflow. I implemented it as the
`Report` phase of `spec-cover.workflow.js` rather than a separate file — matching the precedent exactly
(`loop.workflow.js` writes its report inline). The report path is the Q8-confirmed git-ignored
`harness/.runs/spec-cover-generatedsqlvalidator.md`.

### D3 — OPERATOR ACTION REQUIRED: the live two-arm AC-6 reproduction (Step 7, Q7 = A, plan-sanctioned)
**This is a plan-sanctioned operator-owed fallback, not a gap** (architect Q7 answer: offline-unit-proof +
this runbook **satisfies** the Step-7 developer phase; the live arm is `Deviated (valid reason: operator-owed,
no-git-writes boundary)`, never Missing). The developer-phase deliverable is complete: the runnable
`harness/spec-cover.workflow.js`, the pinned L272 fixture
(`harness/targets/generatedsqlvalidator-l272-fixture.json`), and the green self-served offline gate
`node --test tests/unit/spec-diff.test.mjs` (the AC-5 + AC-6-unit proof). The live behavioral two-arm run
needs a **KG working-tree git write** the developer is barred from (ADR-18 no-git-writes; the boundary
detector flags `git stash`/`checkout`/`reset` in the target repo) — so it is operator-executed.

**Helper / fixture the runbook uses:** `harness/targets/generatedsqlvalidator-l272-fixture.json` (the
pinned SQL + two-arm known answer); the workflow `harness/spec-cover.workflow.js`.

**⚠ DIRTY-TREE HAZARD (verified live, 2026-06-25):** KG's working tree **already holds** the `+ 1e-9` edit
(`git status` shows ` M` on the validator; `git log -S "1e-9"` finds **no commit** — HEAD still carries the
buggy `> 0.01`). The two arms are NOT "HEAD vs apply a patch" — the operator must **neutralize** the dirty
edit for the pre-fix arm and **restore** it for the patched arm. Never double-apply.

**`OPERATOR ACTION REQUIRED` — run both arms (paths are KG = `D:\src\knowledge-gateway`; validator =
`src/Services/KnowledgeGateway/KnowledgeGateway.API/Features/TextToSql/GeneratedSqlValidator.cs`):**

1. **Pre-fix arm (HEAD's `> 0.01` — the buggy form):**
   ```
   git -C D:\src\knowledge-gateway stash push -- src/Services/KnowledgeGateway/KnowledgeGateway.API/Features/TextToSql/GeneratedSqlValidator.cs
   ```
   (or `git -C D:\src\knowledge-gateway checkout HEAD -- <validator>`). Confirm line ~272 reads
   `Math.Abs(literal - resolvedNumeric.Value) > 0.01` (no `+ 1e-9`). Then run the front-end:
   `Workflow({ scriptPath: "D:\\src\\claude-plugins\\nexus\\harness\\spec-cover.workflow.js" })`.
   **Expected (AC-6 primary):** the candidate-bug queue contains a **case-4 over-rejection whose
   `actual === "NoStrayLiteralThreshold"`** (the L272 finding — assert the *specific* rule identity, not
   "any case-4 red"), and the earlier-fired interaction (ARTIFACT-03) is auto-labeled `interaction-artifact`.

2. **Patched arm (HEAD + the one-line fix `> 0.01 + 1e-9`):**
   ```
   git -C D:\src\knowledge-gateway stash pop
   ```
   (or re-apply the one-line edit `> 0.01` → `> 0.01 + 1e-9`). Confirm line ~276 reads
   `Math.Abs(literal - resolvedNumeric.Value) > 0.01 + 1e-9`. Re-run the front-end.
   **Expected (AC-6 secondary, pinned to the input):** the test asserting `|0.86 - 0.85|` passes is
   **green**. Boundary-band reds (the golden text encodes `> 0.01`, the fix is `> 0.01 + 1e-9`) are
   **expected divergence** → `needs-triage`, **NOT** counted against AC-6.

3. Record the observed two-arm result in this file when executed. The run report lands git-ignored at
   `harness/.runs/spec-cover-generatedsqlvalidator.md`.

When consuming the spike's `candidate-bugs-generatedsqlvalidator.md` as the triage reference, treat its
"Live KG status: FIXED / applied by the KG team" row as **superseded** — the fix is uncommitted; no fix
commit exists (verified: `git log -S "1e-9"` empty).

### D4 — `_args.codeRules` seam for the three-axis code-rules side (Step 4)
Step 4's `code-rules` side is "produced by the existing `harness/mine-verify.workflow.js` run on the same
class (reuse its `consensusRules` output)". At wire time the workflow takes the code-rules via
`_args.codeRules` (the operator supplies the mine-verify run output for this class). Absent that arg, the
diff runs spec-only (every spec rule still lands in an axis — `spec ∧ ¬code` or `both-*` by attestation).
This matches the harness lineage's operator-seam discipline (the live mine-verify run is operator-owed, like
the live Stryker run); the diff logic and its AC-4 unit proof are fully in the developer's control.

## Verification summary

- `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → **347 pass, 0 fail** (the full CI glob).
- `node --test tests/unit/spec-diff.test.mjs` → **22 pass, 0 fail** (the AC-7 / AC-5 / AC-6-unit gate).
- `node --test tests/unit/spec-cover-workflow.test.mjs` → **8 pass, 0 fail** (the Step-3 workflow contract).
- `node scripts/selfcheck.mjs` → **4/4 passed** (incl. `bump-plugin --check` = no shipped change).
- AC-7 git hygiene: `git status` shows **no `plugins/**` change**, no version bump; all net-new code under
  `harness/` + `tests/unit/`.

*Status: COMPLETE — developer, 2026-06-25*
