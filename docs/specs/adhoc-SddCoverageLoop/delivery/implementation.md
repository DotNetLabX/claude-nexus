# SDD Coverage Loop — Implementation

## Files Created
- `docs/specs/adhoc-SddCoverageLoop/delivery/spec-rules-bugratio.md` — Step 1: the golden-shaped spec-oracle
  intermediate for `BugRatioAnalyzer`, authored clean-room from the Fokus prose lineage only. 4 rules (SR-1..4)
  covering all 3 `expectedOutcome.kind` values (boolean, numeric ± ε, streak-integer) as intent analogs of
  GOLD-16/17/18. Every `targetField` is the conceptual/intent name per the Q1 answer — no `.cs` read.
- `harness/lib/spec-diff-calc.mjs` — Step 2: the calculator analog of `spec-diff.mjs`'s `labelRed`. Exports
  `outcomeMatches({kind,expected,actual,epsilon})` (the redness determiner — epsilon-tolerant for `numeric`,
  exact-equality for `boolean`/`streak-integer`) and `labelOutcome({kind,expected,actual,epsilon,errored})`
  (classifies a red into `errored` / `code-missing` (sin-of-omission, actual null/undefined) /
  `value-divergence` (with an `over`/`under` `direction` for orderable kinds), each carrying `{label, route,
  detail}` in the same shape as `labelRed`'s return). `diffRules`/`classifyRule` (spec-diff.mjs) are untouched
  — this module owns tolerance exclusively (plan Step 2 instruction).
- `tests/unit/spec-diff-calc.test.mjs` — Step 2: 16 unit tests (TDD, one behavior per red-green cycle;
  +1 in the Step-2 review fix cycle — see Deviations) covering all 3 outcome kinds, the ε boundary
  (in/out/exact-non-zero-boundary/exact-zero/default), errored, code-missing vs legitimate falsy/zero values,
  and divergence direction. `node --test tests/unit/spec-diff-calc.test.mjs` green; full `spec-diff.test.mjs` +
  `spec-diff-calc.test.mjs` together green (43 tests) — confirms `spec-diff.mjs` was not modified (plan:
  "reuse unchanged").
- `harness/targets/bugratio-spec.json` — Step 3: the spec arm's target config for the pilot, modeled on
  `generatedsqlvalidator.json` (9 fields) minus the validator-only `ruleOrder`/`_ruleOrderNote`. `specOracle`
  points at `delivery/spec-rules-bugratio.md` (never the sequestered SR golden set). `isolatedAssembly` names a
  new SR project (`Fokus.Domain.SpecHarness.Tests`) that does not exist on disk yet — created at live-run time
  (Step 8), referencing `Fokus.Domain.csproj` but not `Fokus.Domain.Tests`.
- `harness/spec-cover-calc.workflow.js` — Step 3: the calculator-shaped spec front-end. Mirrors
  `spec-cover.workflow.js`'s actor skeleton (Spec-load → Locate → Cover → Run → Diff+Label → Report) with two
  substitutions: (a) the spec-load/Cover/runner prompts assert VALUES against a target field (via
  `expectedOutcome.kind/targetField/condition`) instead of a violation identity, and explicitly assign the
  intent→real-C#-member binding to the spec-Cover agent at live-run (never to the spec-oracle, per the Q1
  answer); (b) Diff+Label uses `spec-diff-calc.mjs`'s `outcomeMatches`/`labelOutcome` in place of the
  validator's `labelRed`/`RULE_ORDER` (no positional firing order exists for a value assertion). Inlines
  verbatim: `spec-diff.mjs`'s rule-diff functions (`decideLocation`, `evaluateMinerResult`, `ruleKey`,
  `classifyRule`, `diffRules`, `serializeDiff` — NOT `labelRed`, which is validator-only), `spec-diff-calc.mjs`'s
  `outcomeMatches`/`labelOutcome`, and `cover-gates.mjs`'s gate battery (`suiteGreen`, `noFlaky`,
  `mutationFloor`, `targetMutated`) — same Workflow-runtime no-import/no-fs constraint as `spec-cover.workflow.js`.
- `tests/unit/spec-cover-calc-workflow.test.mjs` — Step 3: the mirror sandbox test (mirrors
  `spec-cover-workflow.test.mjs`'s categories), 11 tests: no static import, sandbox-runs to return without
  ReferenceError, both `args` shapes, AC-1 reuse boundary (a numeric-outside-epsilon red + a boolean-divergence
  red both reach the candidate-bug queue with the correct label/direction; green rules SR-1/SR-4 do not),
  green-subset mutation scoring, the spec-oracle path scoped to the spec-load prompt only (plus a defense-in-
  depth check that the sequestered SR golden-set filename never appears in any prompt), the Cover prompt's
  isolated-assembly directive + its explicit intent→member-binding instruction, and meta purity. All green on
  first run (11/11) — the assertions exercise real computed values (e.g. `direction: 'over'` from
  `40 > 33.33`), not tautologies.
- `harness/lib/trace-join.mjs` — Step 4: exports `traceRule({ruleId, planRef?, manualEntry?, locatorResult?,
  confidenceThreshold?})`, a pure priority resolver over the tech-spec's 3 sources (`plan-ref` >
  `manual` > `locator`, in that order — `plan-ref` and `manual` are trusted directly; `locator` is
  confidence-gated, default threshold `0.6`). Any no-match / below-threshold / all-absent case routes to
  `route: 'human-queue'` — never silently accepted (AC-3 / ADR-B); a below-threshold locator guess is still
  RECORDED in the return (for triage), not discarded.
- `tests/unit/trace-join.test.mjs` — Step 4: 10 unit tests (TDD; +1 in the Step-2 review fix cycle — see
  Deviations) covering all 3 sources individually, the plan-ref > manual > locator priority order, the
  confidence-threshold gate at above/exactly-at/below the boundary (default + custom threshold), the
  NO-CODE-FOUND (empty-classes) case, and the all-absent case. `node --test tests/unit/trace-join.test.mjs`
  green.
- `docs/specs/adhoc-SddCoverageLoop/delivery/trace-map-bugratio.md` — Step 4: the pilot manual map. All 4
  spec rules (SR-1..4) → `BugRatioAnalyzer` (canonical name — the golden set's `BugRatioCalculator` attestation
  is stale), `source: manual`, confidence 1.0, `route: accepted` — SR is a ported class with no nexus plan
  chain, so `plan-ref` has nothing to anchor on for this pilot (tech-spec: AC-6 proves the manual/locator
  fallback, not the plan-ref anchor). Confirms the class set matches `harness/targets/bugratio.json` exactly
  (Step 6 acceptance: `{BugRatioAnalyzer}` == `{BugRatioAnalyzer}`).
- `harness/lib/independence-check.mjs` — Step 5: exports `checkManifest({paths, forbidden})` (one manifest vs
  an explicit forbidden list) and `checkIndependence({specManifest, codeManifest, goldenSetPath,
  crosswalkPath})` (both arms together: neither contains the golden set or the Step-7 crosswalk, AND the two
  manifests are disjoint — mutual blindness). A "manifest" is each arm's DECLARED private oracle/output paths,
  not the full read-surface — the shared production source class is deliberately out of scope (both arms
  legitimately read it; that's not a blindness violation). FAILS CLOSED: any violation type → `pass: false`.
  Path comparison is case-insensitive and separator-normalized (Windows paths).
- `tests/unit/independence-check.test.mjs` — Step 5: 7 unit tests (TDD) covering `checkManifest`'s fail-closed
  and pass cases, and `checkIndependence`'s three violation types (golden-set-in-either-manifest,
  crosswalk-in-either-manifest, cross-manifest overlap) plus the disjoint/clean pass case and Windows-path
  normalization. `node --test tests/unit/independence-check.test.mjs` green.

### Step 6 — Wire the aimed code arm (Owner: operator — live run)

**No new files** (plan: "Files: none new"). Build-only deliverable: confirmed `harness/targets/bugratio.json`'s
`class` field (`"BugRatioAnalyzer"`) matches `trace-map-bugratio.md`'s (Step 4) target class set exactly —
`{BugRatioAnalyzer} == {BugRatioAnalyzer}` (plan Step 6 acceptance, satisfied by inspection; no code change
needed since both artifacts already agree).

**OPERATOR ACTION REQUIRED** — the live code-arm run itself. Run `harness/cover.workflow.js` via the Workflow
tool against `harness/targets/bugratio.json` (`_args.targetClass = "BugRatioAnalyzer"`,
`_args.src = bugratio.json`'s `source` path), in an isolated SR git worktree (OD-4), following the
`mine-verify-cover` skill (toolchain: `mine-verify-cover-dotnet`). Before the run, build the code arm's input
manifest for Step 5's `checkIndependence({ codeManifest, specManifest, goldenSetPath, crosswalkPath })`
tripwire — the code arm's manifest is its own private output paths only (it consults no oracle):
```
codeManifest = { arm: 'code', paths: [
  'harness/.runs/bugratio-run.json',       // the code arm's own runner-result output
  'harness/.runs/bugratio-report.md',      // the code arm's own report output (path per mine-verify-cover's Report stage)
] }
```
This must be run against the spec arm's manifest (Step 8's live spec-cover-calc run) with
`goldenSetPath: 'D:\src\sprint-rituals\docs\audit\golden-set.md'` and `crosswalkPath` (Step 7's map, once
authored) BEFORE either arm's live run, per AC-1/AC-2. `Satisfies:` AC-4.

### Step 7 — Rule-identity reconciliation crosswalk (developer helper; operator authors the map post-hoc)

- `harness/lib/rule-crosswalk.mjs` — exports `applyCrosswalk(rules, crosswalkMap)` (rewrites ONE rule set's
  `ruleName` via the map, looking up by `id` first then existing `ruleName`; an unmapped rule passes through
  unchanged rather than crashing or disappearing) and `reconcileRuleSets({specRules, codeRules, crosswalkMap})`
  (applies the same map to both arms' rule sets in one call). PURE — no fs, no LLM; the map itself is authored
  by the operator, post-hoc, after both arms' live runs (Steps 6+8) produce their rule sets — this module only
  APPLIES an already-authored map, never authors one.
- `tests/unit/rule-crosswalk.test.mjs` — 7 unit tests (TDD): the BR-N-id rewrite, unmapped pass-through, spec-
  arm re-canonicalization via its own `ruleName`, immutability (fixed a test-only bug along the way — see
  Key Decisions), `reconcileRuleSets` rewriting both sides, and **the fix proven end-to-end**: `diffRules`
  (from `spec-diff.mjs`, imported unmodified) on un-reconciled rule sets produces an EMPTY `both-agree`
  (`BugRatioPercent` vs `BR-2` never collide), then on the SAME rules post-`reconcileRuleSets` produces a
  NON-EMPTY `both-agree` — directly demonstrating the plan Step 7 HIGH-finding fix, not just the helper's
  internals in isolation. `Satisfies:` AC-5 (closes the keying gap).

**OPERATOR ACTION REQUIRED** — the crosswalk MAP itself (`Files (operator, post-hoc)` per the plan) is
authored after Steps 6+8 produce real rule sets: inspect the code arm's `BR-N` rules and the spec arm's
`SR-1..4` rules, human-confirm which pairs denote the same underlying rule, and record the map (e.g.
`{"BR-2":"BugRatioPercent","BugRatioPercent":"BugRatioPercent",...}`) under `harness/.runs/` — cited in the
Step 9 pilot report. The map must NEVER appear in either arm's Step 5 input manifest (apply
`reconcileRuleSets` only after both runs complete).

### Step 8 — Run the two blind arms + reconcile + diff (Owner: operator) — NOT RUN, build-only wiring only

**No developer-buildable deliverable** (plan: "Owner: operator" throughout, "Files: run evidence under
harness/.runs/ (git-ignored)"). Everything this step needs was built in Steps 1–7 (`spec-cover-calc.workflow.js`
+ `bugratio-spec.json` for the spec arm; `cover.workflow.js` + `bugratio.json` for the code arm;
`independence-check.mjs` for the pre-run tripwire; `rule-crosswalk.mjs` for post-hoc reconciliation;
`spec-diff.mjs`'s `diffRules` for the final compare) — build-only validation proves the wiring is
runnable-shaped (all offline tests green), **not** the live comparison itself.

**OPERATOR ACTION REQUIRED — runbook:**
1. Create two isolated SR git worktrees (OD-4).
2. In worktree A: run `harness/spec-cover-calc.workflow.js` (Step 3) via the Workflow tool against
   `harness/targets/bugratio-spec.json`. First create the SR `Fokus.Domain.SpecHarness.Tests` isolated
   assembly project (referencing `Fokus.Domain.csproj`, not `Fokus.Domain.Tests`) if it doesn't already exist.
3. In worktree B: run `harness/cover.workflow.js` (Step 6) via the Workflow tool against
   `harness/targets/bugratio.json`, following `mine-verify-cover`/`mine-verify-cover-dotnet`.
4. **Before EITHER run**, build both arms' manifests (spec arm's per Step 3's `RUNNER_RESULT`/`REPORT_PATH`
   defaults; code arm's per the Step 6 note above) and call `checkIndependence({specManifest, codeManifest,
   goldenSetPath: 'D:\src\sprint-rituals\docs\audit\golden-set.md', crosswalkPath: <chosen .runs/ path>})`
   (`harness/lib/independence-check.mjs`) — it must `pass: true` before launching either arm.
5. After both arms complete, author the Step-7 crosswalk map from the two arms' actual rule sets (human-
   confirmed), then call `reconcileRuleSets({specRules, codeRules, crosswalkMap})`
   (`harness/lib/rule-crosswalk.mjs`) followed by `diffRules(...)` (`harness/lib/spec-diff.mjs`) to produce the
   four buckets + the rule-level `both-agree` intersection.
6. Verify acceptance: every rule lands in exactly one bucket, `both-agree` is non-vacuous where the arms
   genuinely agree, and the independence tripwire passed for both arms with the crosswalk absent from both
   manifests. `Satisfies:` AC-1, AC-5.

### Step 9 — Pilot report + verdict (Owner: operator, depends on Step 8) — NOT RUN

**No developer-buildable deliverable** — depends entirely on Step 8's live output.

**OPERATOR ACTION REQUIRED — runbook:** after Step 8 completes, author
`docs/specs/adhoc-SddCoverageLoop/delivery/pilot-bugratio.md`, citing `harness/.runs/` evidence, covering:
per-arm recall/precision against GOLD-16..18 (scored post-hoc — the golden set is never a run input, per
AC-2), the `both-agree` intersection, the `spec∧¬code` sins-of-omission list, and an explicit verdict on
generalizing (roadmap step 2). **Caveat required by the plan:** the spec-arm's recall must be framed as
transcription-fidelity (how faithfully SR-1..4 transcribe the Fokus prose), NOT independent rediscovery — the
golden set's intent column was curated from the same Fokus prose the spec arm reads (tech-spec, `golden-set.md
:25,47-48`). Frame the load-bearing signals as the diff's `spec∧¬code` sins-of-omission plus the **code arm's**
independent recall (the code arm never saw the spec, so ITS recall against the golden set is the genuinely
independent signal). Name any blocker found as a generalization-scope item (roadmap step 2), not a fix to make
here. `Satisfies:` AC-6.

## Files Modified
- `tests/unit/workflow-contract.test.mjs` — Step 3: registered `spec-cover-calc.workflow.js` — added
  `SPEC_COVER_CALC_PATH` (mirrors the `SPEC_COVER_PATH` const pattern), added it to the shared meta-purity
  `for` loop, and added an individual `has no static import` test (mirroring the existing per-workflow pattern
  used for `spec-cover`/`mine-verify`/`cover`/`loop` — see Key Decisions for why "no-static-import" isn't
  literally a shared loop today). Full suite: 57 pass / 0 fail (was 55 before this step).
- `scripts/selfcheck.mjs` — Step 3: generalized the "spec-diff inline-copy sync" check (previously a single
  hard-coded `(spec-diff.mjs, spec-cover.workflow.js)` pair) into a loop over a `PAIRS` list, each entry naming
  its own lib, workflow, and the specific function subset that workflow inlines from that lib. Added two new
  pairs: `(spec-diff.mjs, spec-cover-calc.workflow.js)` for the 6 shared rule-diff functions (excluding the
  validator-only `labelRed`), and `(spec-diff-calc.mjs, spec-cover-calc.workflow.js)` for `outcomeMatches`/
  `labelOutcome`. `node scripts/selfcheck.mjs` → `[PASS] spec-diff inline-copy sync — 3 lib/workflow pair(s) in
  sync`.

## Key Decisions

- **Step 1: split GOLD-18's compound outcome into two sibling rules (SR-3 `AlertActive` boolean, SR-4
  `ConsecutiveStreak` streak-integer)** rather than one rule with a compound `expectedOutcome`. The schema's
  `expectedOutcome.kind` is singular per rule (mirrors the validator schema's one-outcome-per-rule shape), and
  splitting gives Step 2's labeler independent boolean and streak-integer test fixtures naturally, rather than
  requiring a compound-outcome comparator. Both cite the same Fokus source lines (`bug-ratio.md:26-33`).
- **Step 1: `epsilon: 1e-9` for SR-2 is an author-supplied default, not a value read from any sequestered
  source.** The Fokus prose states no explicit numeric tolerance for `bugRatioPercent`; documented inline in
  spec-rules-bugratio.md so the labeler's ε default is traceable to this decision, not mistaken for a golden
  citation.
- **Step 3: "no-static-import" is registered per-workflow (individual `test()` calls), not as a genuine shared
  `for` loop.** The plan says "add it to both shared loops (meta-purity + no-static-import)," but only
  meta-purity is actually a `for`-loop registry (`workflow-contract.test.mjs:1544`) — `cover-flutter`,
  `cover-cpp`, and `loop-flutter` have NO individual no-static-import test at all, so "no-static-import" isn't
  a uniform loop today, just a per-workflow convention exercised by `mine-verify`/`cover`/`loop`/`spec-cover`.
  Followed the INTENT (every registered workflow gets both a meta-purity entry and a no-static-import check) by
  mirroring `spec-cover`'s own individual-test precedent exactly — the most directly analogous existing case,
  since Step 3 explicitly models this workflow on `spec-cover.workflow.js`.
- **Step 3: `spec-cover-calc.workflow.js` inlines `spec-diff.mjs`'s rule-diff functions but NOT `labelRed`/
  `RULE_ORDER`.** Those are validator-only (a positional first-violation-wins firing order); this class has no
  such surface. Reused-unchanged per plan Step 2 applies to `diffRules`/`classifyRule` (confirmed byte-identical
  via the selfcheck sync check), not to the validator-specific labeler.
- **Step 3: the Cover-agent prompt explicitly assigns intent→real-member binding to the spec-Cover agent at
  live-run** (see prompt text: "You choose the REAL return-type member... binding intent→member is YOUR job at
  this step, not the spec-oracle's"), carrying forward the Q1 answer's binding correction (the crosswalk is
  NOT the binder) directly into the workflow's own agent instructions — not just this doc.
- **Step 5: did NOT wire the independence check into `scripts/selfcheck.mjs`** (plan left this "developer's
  call"). `selfcheck.mjs`'s existing checks are all STATIC repo-state assertions (test suite, gen-commands
  drift, omni sync, bump-plugin, spec-diff inline-copy sync) that need no live data. `checkIndependence`'s real
  inputs — the two arms' actual per-run manifests — only exist at operator-owed live-run time (plan Step 8);
  wiring a synthetic-data smoke call into selfcheck would be redundant with the unit tests already covering
  every violation type, and a real call has nothing to check offline. The operator's Step 8 runbook should
  invoke `checkIndependence` directly, pre-run, with the two real manifests, as its own tripwire gate.
- **Step 7: caught and fixed a test-only bug during the immutability cycle** — `JSON.parse(JSON.stringify(x))`
  silently drops object keys whose value is `undefined`, so a snapshot-vs-original comparison on a fixture
  containing `ruleName: undefined` false-failed (the implementation was never buggy; the snapshot technique
  was). Fixed by switching to `structuredClone` (preserves `undefined`-valued keys) and simplifying the
  fixture to avoid an explicit `undefined` field. Logged here per the diagnose-adjacent principle: don't
  silently "fix the test to pass" — confirm which side is wrong before changing anything (it was the test).

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan: `Skill: None`, `TDD: no` — clean-room authoring step, no code |
| 2 | tdd | plan: `Skill: None`, `TDD: yes` — red-green cycles for `outcomeMatches`/`labelOutcome`, one behavior per cycle |
| 3 | tdd | plan: `Skill: None`, `TDD: yes` — registration edit driven red (ENOENT) → green; mirror sandbox test built against the completed workflow (single-orchestrator-unit granularity — see Developer Lessons), all 11 assertions exercise real computed values |
| 4 | tdd | plan: `Skill: None`, `TDD: yes` — 10 red-green cycles for `traceRule`'s 3 sources, priority order, and human-queue routing (incl. the Step-2 review's exact-threshold boundary cycle) |
| 5 | tdd | plan: `Skill: None`, `TDD: yes` — 7 red-green cycles for `checkManifest`/`checkIndependence`, incl. fail-closed on all 3 violation types |
| 6 | mine-verify-cover | plan: `Skill: Follow mine-verify-cover`, `TDD: no`. Invoked to confirm the adapter contract/workflow shape before verifying `bugratio.json` — no code written (plan: "Files: none new", "Owner: operator (live run)"); build-only deliverable is the config-match verification, documented above with an OPERATOR ACTION REQUIRED note for the live run |
| 7 | tdd | plan: `Skill: None`, `TDD: yes` (developer helper only — the crosswalk map itself is operator-authored, post-hoc). 7 red-green cycles, ending in an end-to-end proof against `diffRules` (spec-diff.mjs) that `both-agree` flips from empty to non-empty post-reconciliation |
| 8 | None | plan: `Skill: None`, `TDD: no`, `Owner: operator`. No developer-buildable deliverable — documented as an OPERATOR ACTION REQUIRED runbook above, composing Steps 1-7's artifacts |
| 9 | None | plan: `Skill: None`, `TDD: no`, `Owner: operator`, depends on Step 8. No developer-buildable deliverable — documented as an OPERATOR ACTION REQUIRED runbook above |

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Steps 6, 8, 9 unexecuted — pilot has no live evidence yet | high | architect/reviewer | `harness/.runs/` has no run artifacts for this feature; `pilot-bugratio.md` does not exist | By plan design (operator-owed). The done-check should verify the BUILD-ONLY acceptance criteria (offline tests, selfcheck, registrations) — NOT expect live `.runs/` evidence, a `pilot-bugratio.md`, or an authored crosswalk map. Runbooks are in this file under Steps 6/8/9. |
| `workflow-contract.test.mjs`'s "no-static-import" loop is per-workflow convention, not a genuine shared `for` loop | low | architect | `cover-flutter`/`cover-cpp`/`loop-flutter` have no individual no-static-import test; only `mine-verify`/`cover`/`loop`/`spec-cover`/`spec-cover-calc` do | Pre-existing inconsistency, not introduced by this feature — followed the closest precedent (`spec-cover`) faithfully. Worth a separate cleanup pass if the architect wants full uniformity. |
| `cover-gates.mjs`'s inline-copy sync (in `cover.workflow.js` AND now `spec-cover-calc.workflow.js`) has no selfcheck guard | low | architect | `grep -rn cover-gates scripts/selfcheck.mjs` finds no sync check; only `spec-diff`/`spec-diff-calc` are checked | Out of scope for plan Step 3 (explicitly scoped to "the spec-diff inline-copy sync check" + `spec-diff-calc.mjs`, not `cover-gates.mjs`). Flagging since `spec-cover-calc.workflow.js` now inlines `cover-gates.mjs` too, same as `spec-cover.workflow.js` and `cover.workflow.js` already did, unguarded. |

## Deviations from Plan

- **Step 3: registered "no-static-import" as an individual `test()` call, not a shared loop** — the plan says
  "add it to both shared loops (meta-purity + no-static-import)," but only meta-purity is a genuine `for` loop
  in the live file; no-static-import is per-workflow `test()` calls exercised by 4 of 7 existing workflows.
  Mirrored the `spec-cover` precedent exactly (see Key Decisions + Carry-Over above) — satisfies the plan's
  intent (every registered workflow gets both checks) without inventing a loop structure the codebase doesn't
  have.
- **Step 5: did not wire `checkIndependence` into `scripts/selfcheck.mjs`** — plan explicitly left this
  "developer's call." Reasoned in Key Decisions: `checkIndependence`'s real inputs only exist at operator-owed
  live-run time; a synthetic-data selfcheck call would be redundant with the unit tests. The operator's Step 8
  runbook invokes it directly instead.
- **Steps 6, 8, 9: no code written** — all three are explicitly `Owner: operator` in the plan, with Steps 8/9
  stating "Files: run evidence under harness/.runs/" / a report file that depends on live Step-8 output. Per
  the plan's own Owner Split ("Steps 6, 8, and Step 7's crosswalk map are operator-owed"), documented each as
  an OPERATOR ACTION REQUIRED runbook instead of fabricating a live run or its evidence.
- **Step 7: the crosswalk MAP itself was not authored** (only the `applyCrosswalk`/`reconcileRuleSets` helper
  that APPLIES a map). Per the plan: "Files (operator, post-hoc): the crosswalk map authored at run time
  (human-confirmed) after Steps 6+8's arms produce their rule sets" — the map cannot exist before Steps 6/8
  produce real rule sets to reconcile. The helper's tests prove correctness against synthetic BR-N/SR-N
  fixtures standing in for the eventual real ones.

## Fixes Applied — Review Cycle 1/3

Step-2 review verdict: **APPROVED**, 2 MEDIUM findings to close before ship. Both fixed:

1. **`harness/lib/spec-diff-calc.mjs:45` — numeric epsilon boundary (`<=`) untested at the exact non-zero
   boundary value.** Added `outcomeMatches numeric: EXACTLY AT a non-zero epsilon boundary (diff === epsilon)
   is a match (<=, inclusive)` to `tests/unit/spec-diff-calc.test.mjs` (`expected: 10, actual: 10.5, epsilon:
   0.5` — `10.5 - 10 === 0.5` exactly, both binary-exact floats, so this is a genuine boundary hit, not a
   near-miss masked by float rounding). **Mutation-verified**: temporarily changed `<=` to `<` and reran — the
   new test failed as expected (proving it is not tautological); reverted, reran, green.
2. **`harness/lib/trace-join.mjs:52` — locator confidence threshold (`>=`) untested at the exact threshold
   value.** Added `traceRule: a locatorResult EXACTLY AT the confidence threshold is accepted (>=, inclusive
   boundary)` to `tests/unit/trace-join.test.mjs` (`confidence: 0.6` against the default `threshold: 0.6`).
   **Mutation-verified**: temporarily changed `>=` to `>` and reran — the new test failed as expected; reverted,
   reran, green.

Test counts updated: `spec-diff-calc.test.mjs` 15→16, `trace-join.test.mjs` 9→10 (both call sites above and in
Skills Used updated). Full suite: 441→443 tests, all green. `node scripts/selfcheck.mjs`: 5/5 passed
(unchanged — no registration/sync surface touched by this fix cycle).

No implementation code changed — both findings were test-coverage gaps, not logic bugs; the mutation checks
above confirm the boundary logic (`<=`/`>=`) was already correct.

*Status: COMPLETE — developer, 2026-07-02 (fix cycle 1/3 applied).*
