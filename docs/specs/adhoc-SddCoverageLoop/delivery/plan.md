# SDD Coverage Loop — v1 (Implementation Plan)

**Feature Spec:** `docs/specs/adhoc-SddCoverageLoop/definition/tech-spec.md` (Status: Ready)

## Context

Today `mine-verify-cover` mines rules from **code** only. This builds the missing **spec arm** (tests from
the spec), the **trace-join** that aims the code arm at the same classes, a **rule-identity reconciliation**
so the two arms' rules can be compared, and the **two-blind-runs + diff** — proven on `BugRatioAnalyzer.cs`
in sprint-rituals. Dev-repo `harness/` machinery only; nothing ships and no plugin bumps until the eventual
skill fold-in (tech-spec roadmap step 4, out of scope here).

The spec arm is **net-new for a numeric calculator**: `spec-cover.workflow.js` is validator-shaped (returns a
rule-name/enum), so only `spec-diff.mjs`'s rule-set diff transfers (owner decision OD-5(a)). The spec oracle
is a **golden-shaped intermediate authored from the Fokus prose lineage** (OD-6(a)), never the sequestered
golden set.

## Scope

**In:** the calculator spec front-end, its (numeric + boolean/streak) labeler, the spec oracle doc, the
trace-join + pilot map, the rule-identity reconciliation crosswalk, the independence tripwire, the aimed
code-arm wiring, the diff/compare, the pilot report.
**Out:** multi-class sweep; automated per-PR loop; folding into the shipped `mine-verify-cover` skill;
any language beyond .NET; fixing SR's stale `BugRatioCalculator` golden attestation (flag only).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | Author spec-rule doc from Fokus prose into the spec-load schema; `expectedOutcome` covers numeric/boolean/streak + target field | — |
| 2 | (none) | — | yes | Labeler for numeric(±ε)/boolean/enum/streak outcomes; reuse `diffRules`/`classifyRule` unchanged | Log to lessons |
| 3 | (none) | — | yes | Calculator spec front-end workflow + spec target JSON + **register in the contract guard** + mirror sandbox test + sync-guard | Log to lessons |
| 4 | (none) | — | yes | Trace-join helper (rule→class, source+confidence, human-queue) + pilot manual map | Log to lessons |
| 5 | (none) | — | yes | Per-run input manifest + forbidden-path tripwire (golden set, other arm, crosswalk) | Log to lessons |
| 6 | mine-verify-cover | Follow | no | Run the code arm on `BugRatioAnalyzer` only, via `bugratio.json` (single-class) | — |
| 7 | (none) | — | yes | Rule-identity reconciliation: crosswalk helper (dev, TDD) + post-hoc human-confirmed map (operator) | Log to lessons |
| 8 | (none) | — | no | Launch both arms in two SR worktrees, apply crosswalk, diff (operator-owed) | Log to lessons |
| 9 | (none) | — | no | Pilot report: recall/precision vs GOLD-16..18 (spec-arm caveated) + intersection + verdict | — |

**Owner split.** Steps 1–5 + the **helper** in Step 7 are the developer's offline, unit-testable build.
Steps 6, 8, and Step 7's crosswalk *map* are **operator-owed** — not because the developer "lacks the
Workflow tool" (the `nexus:developer` has all tools), but because the live run needs a **git write to the
consuming (SR) working tree** the developer is barred from (`spec-cover.workflow.js:55-57`), the **live
.NET/Stryker toolchain**, **two SR git worktrees** (OD-4), and the KB flip that is out of the workflow's
runnable surface (`cover.workflow.js:509-517`). Each operator step's acceptance states what its build-only
PASS does *not* yet prove.

## Domain Model Changes

None (dev-repo harness; no product domain model).

## Data Model Changes

None.

## Implementation Steps

### Step 1 — Author the spec oracle (golden-shaped intermediate)
Transcribe the BugRatio **intent** from the Fokus prose lineage into the structured shape the spec-load agent
consumes (id, ruleName, statement, `expectedOutcome`, boundary). **Clean-room:** author ONLY from the intent
docs — never from the SR golden set, the code-mined KB, or `BugRatioAnalyzer.cs`.
- **Files:** create `docs/specs/adhoc-SddCoverageLoop/delivery/spec-rules-bugratio.md`.
- **Inputs:** `D:\src\fokus\docs\kb\analytics\bug-ratio.md` (ratio-of-totals `:23`; alert streak `:26-33`) +
  `D:\src\fokus\docs\kb\domain\ticket.md` (Bug classification `:17`). Cover the intent analogs of GOLD-16..18.
- **Accept:** one structured entry per rule; `expectedOutcome` shape supports **numeric (value ± ε), boolean,
  and streak-integer** outcomes **and names the target field** of `BugRatioMultiSprintData`/`…SingleSprintData`
  each rule asserts (GOLD-16 boolean classification; GOLD-17 numeric ratio; GOLD-18 boolean alert + integer
  streak). No `golden-set.md` / `docs/kb/` / `*.cs` path cited as a source. `Satisfies:` AC-2, AC-6.

### Step 2 — Build the outcome labeler (deterministic, TDD)
The calculator analog of `spec-diff.mjs`'s validator `labelRed`: classify a spec-test result by comparing the
**expected outcome vs actual**, over the outcome kinds Step 1 produces — **numeric (± ε), boolean/enumerated,
and streak-integer** — per the rule's target field. Reuse `diffRules`/`classifyRule` from `spec-diff.mjs`
**unchanged** for the rule-set diff (they key by name + string boundary — numeric bounds fit as strings;
tolerance is the labeler's concern, verified with the critic).
- **Files:** create `harness/lib/spec-diff-calc.mjs`; create `tests/unit/spec-diff-calc.test.mjs`.
- **Accept:** unit tests (pattern: `tests/unit/spec-diff.test.mjs`) cover each outcome kind incl. the ε
  boundary and the boolean/streak cases; `node --test tests/unit/spec-diff-calc.test.mjs` green. `Satisfies:` AC-5.

### Step 3 — Build the calculator spec front-end workflow
A new spec-arm Workflow mirroring the **actor skeleton** of `harness/spec-cover.workflow.js` (spec-load →
guided-miner → spec-cover test-writer → runner), with the test model asserting the numeric/boolean outcomes
of `BugRatioAnalyzer.ComputeMultiSprint` / `ComputeSingleSprint` (not a validator's violation identity). Inline
`spec-diff.mjs` + `spec-diff-calc.mjs` verbatim (runtime contract: no imports).
- **Files:**
  - create `harness/spec-cover-calc.workflow.js` (pattern: `harness/spec-cover.workflow.js` — actor wiring, `_args`).
  - create `harness/targets/bugratio-spec.json` — model on the **spec** target `generatedsqlvalidator.json`
    (9 fields), **omitting** the validator-only `ruleOrder`/`okValue`; `isolatedAssembly`/`productProject` name
    **new SR paths** (an SR `SpecHarness.Tests` project, created at live-run time — Step 8, not built here).
  - **edit `tests/unit/workflow-contract.test.mjs`** — register the new path const + add it to both shared
    loops (meta-purity + no-static-import) [the guard is a hard-coded registry, not a globber — an unregistered
    workflow is tested by nothing].
  - create `tests/unit/spec-cover-calc-workflow.test.mjs` — mirror `tests/unit/spec-cover-workflow.test.mjs`
    (sandbox-run to return; both `args` shapes; a labeler red routes to the candidate-bug queue).
  - **edit `scripts/selfcheck.mjs`** — extend the "spec-diff inline-copy sync" check (`:86-144`) to cover
    `spec-cover-calc.workflow.js`'s inlined copies + add `spec-diff-calc.mjs` to the checked libs.
- **Accept:** the new workflow **is registered in** `workflow-contract.test.mjs` **and** passes it (meta
  pure-literal, no `import`/`fs`/`Date`/`Math.random`, agents do all I/O) — `node --check` is NOT sufficient;
  the mirror sandbox test is green; selfcheck sync passes. Spec-load reads only `spec-rules-bugratio.md`
  (Step 1). `Satisfies:` AC-6. **Build-only PASS ≠ a live spec-arm run** (Step 8).

### Step 4 — Build the trace-join + pilot map (TDD)
A deterministic helper mapping each spec rule → 0..N classes with a `source` (`plan-ref | locator | manual`)
+ confidence; anchor on plan/impl file refs where present, fall back to the **spec-cover guided-miner**
locator, route low-confidence / no-match to a human-queue flag (never auto-accept). Author the pilot manual
map (SR is a port — no plan chain).
- **Files:** create `harness/lib/trace-join.mjs`; create `tests/unit/trace-join.test.mjs`; create
  `docs/specs/adhoc-SddCoverageLoop/delivery/trace-map-bugratio.md` (GOLD-16..18 → `BugRatioAnalyzer.cs`,
  `source: manual`).
- **Accept:** unit tests cover the three sources + human-queue routing; the pilot map's target is
  `BugRatioAnalyzer.cs` (canonical — the golden set's `BugRatioCalculator` name is stale). `Satisfies:` AC-3, AC-4.

### Step 5 — Build the independence manifest + tripwire (TDD)
A per-run input manifest (paths each arm's agents may see) + a pre-run assertion that the **forbidden paths**
(`golden-set.md`; the other arm's outputs; the reconciliation crosswalk from Step 7; for the code arm, the
spec-rule doc) appear in **no** agent prompt / config. Mirror the golden-set placement+tripwire
(`golden-set.md:9-23`) and the spec-cover single-reader placement.
- **Files:** create `harness/lib/independence-check.mjs`; create `tests/unit/independence-check.test.mjs`.
  (If a selfcheck home fits, wire the assertion into `scripts/selfcheck.mjs` — developer's call.)
- **Accept:** FAILS closed when a forbidden path is in a manifest; PASSES when the two arms' manifests are
  disjoint + golden-set-free + crosswalk-free; unit tests prove both. `Satisfies:` AC-1, AC-2.

### Step 6 — Wire the aimed code arm — **Owner: operator (live run)**
Run the code arm on `BugRatioAnalyzer` **only**, driven by the existing `harness/targets/bugratio.json`
(single-class per invocation, `_args.targetClass/src`), matching the trace-join (Step 4) selection.
- **Files:** none new (reuse `harness/cover.workflow.js` + `bugratio.json`); deliverable = the scoped run
  config + its input manifest (Step 5).
- **Skill:** **Follow mine-verify-cover** (toolchain via `mine-verify-cover-dotnet`).
- **Accept:** the code-arm target == the trace class set (pilot: `{BugRatioAnalyzer}` == `{BugRatioAnalyzer}`).
  **Build deliverable** = the scoped config; the live mutation-gated run is operator-owed. `Satisfies:` AC-4.

### Step 7 — Rule-identity reconciliation crosswalk
**The fix for the empty-intersection gap.** `classifyRule` matches by rule NAME, but the two blind arms emit
different identities (code arm: autonomous `BR-1, BR-2…`, no `ruleName`; spec arm: names authored in Step 1).
Without reconciliation `both-agree` is empty by construction and `code∧¬spec` is falsely inflated. Build a
deterministic helper that rewrites both rule sets' `ruleName` from a **canonical-name crosswalk map**, applied
**only after both arms run** — the map is **never** in either arm's input manifest (Step 5), preserving AC-1
blindness.
- **Files (developer):** create `harness/lib/rule-crosswalk.mjs`; create `tests/unit/rule-crosswalk.test.mjs`.
- **Files (operator, post-hoc):** the crosswalk map authored at run time (human-confirmed) after Steps 6+8's
  arms produce their rule sets — recorded under `harness/.runs/` / cited in the pilot report.
- **Accept:** the helper unit-tests prove it aligns two differently-keyed rule sets to canonical names so
  `diffRules` can match, and that it is a pure transform applied outside the runs; the map's authoring is
  operator-owed and gated as *not* an arm input. `Satisfies:` AC-5 (closes the keying gap).

### Step 8 — Run the two blind arms + reconcile + diff — **Owner: operator**
Launch the spec arm (Step 3) and code arm (Step 6) in **two isolated SR git worktrees** (OD-4), each with its
Step-5 manifest; author the Step-7 crosswalk from the two rule sets; apply it; feed both to `spec-diff.mjs` →
the four buckets + the rule-level `both-agree` intersection. Also create the SR `SpecHarness.Tests` isolated
assembly the spec arm needs.
- **Files:** run evidence under `harness/.runs/` (git-ignored).
- **Accept:** both arms complete blind (tripwire passed for each; crosswalk absent from both manifests); after
  reconciliation the diff emits every rule in exactly one bucket **and** a non-vacuous `both-agree` where the
  arms genuinely agree. **Operator-owed by construction** (consuming-tree git write + toolchain + worktrees);
  build-only validation proves the wiring is runnable-shaped, NOT the live comparison. `Satisfies:` AC-1, AC-5.

### Step 9 — Pilot report + verdict — **Owner: operator** (depends on Step 8)
Cross-arm report: per-arm recall/precision vs GOLD-16..18, the intersection, the sins-of-omission list, and an
explicit verdict on generalizing (roadmap step 2).
- **Files:** create `docs/specs/adhoc-SddCoverageLoop/delivery/pilot-bugratio.md` (cites `.runs/` evidence).
- **Accept:** scores both arms against the golden set (which neither arm saw) — **caveat the spec-arm recall
  as transcription-fidelity, not independent rediscovery** (the golden set's intent column was curated from
  the same Fokus prose the spec arm reads, `golden-set.md:25,47-48`); frame the load-bearing signals as the
  diff's `spec∧¬code` sins-of-omission + the **code arm's** independent recall. Name any blocker as a
  generalization scope item. `Satisfies:` AC-6.

## Cross-Service Changes

None.

## Migration Notes

None. Steps 6–8 need SR git worktrees + `dotnet` + `dotnet-stryker` (verified present) + a new SR
`SpecHarness.Tests` project (created at live-run, Step 8) — operator setup, not a migration.

## Testing Strategy

- **Unit (offline, developer):** `spec-diff-calc` (2), `trace-join` (4), `independence-check` (5),
  `rule-crosswalk` (7) via `node --test`, mirroring `tests/unit/spec-diff.test.mjs`.
- **Contract (offline, developer):** the new workflow (3) is registered in + passes
  `tests/unit/workflow-contract.test.mjs`, plus the mirror `spec-cover-calc-workflow.test.mjs` sandbox test.
- **Live end-to-end (operator):** the two-arm pilot on `BugRatioAnalyzer` is AC-6 — the real proof.

## KB Impact

None. Dev-repo harness; no `docs/kb/` entries in nexus. The eventual `mine-verify-cover` skill-doc update is
roadmap step 4 (out of scope).

## Open Questions

None blocking — OD-1..6 resolved in the tech-spec. Non-blocking: SR's golden set attests GOLD-16..18 to the
stale `BugRatioCalculator` name (renamed to `BugRatioAnalyzer`, lines preserved) — flagged for a separate
SR-side golden-set fix, out of scope here.

## Plan Review

**Mode:** code-grounded Mode 2 (plan vs tech-spec + live harness). **Verdict:** REVISE / GO-with-fixes —
0 CRITICAL, 2 HIGH, 5 MEDIUM — **all accepted and folded into this revision.**

| # | Severity | Finding | Disposition |
|---|----------|---------|-------------|
| 1 | HIGH | `workflow-contract.test.mjs` is a hard-coded registry, not a globber → Step 3 acceptance was a false-green trap | **Fixed** — Step 3 now registers the new workflow + adds the mirror sandbox test; AC restated "registered AND passes" |
| 2 | HIGH | Blind arms don't share rule names → `spec-diff` `both-agree` empty by construction, `code∧¬spec` inflated | **Fixed** — new **Step 7** rule-identity reconciliation (post-hoc crosswalk, outside the blind runs); AC-5 confidence lowered for the calculator case in the tech-spec |
| 3 | MEDIUM | Labeler was numeric-only; GOLD-16/18 are boolean/streak | **Fixed** — Steps 1 + 2 broadened to numeric/boolean/streak + target field |
| 4 | MEDIUM | Operator-owed rationale mis-stated ("lacks Workflow tool") | **Fixed** — restated as consuming-tree git-write bar + toolchain + worktrees |
| 5 | MEDIUM | New inline copies got no drift-guard | **Fixed** — Step 3 extends `selfcheck.mjs` sync check |
| 6 | MEDIUM | Spec-arm recall is transcription-fidelity, not independent | **Fixed** — Step 9 caveats it; load-bearing signals reframed |
| 7 | MEDIUM | Spec-target JSON should mirror `generatedsqlvalidator.json` minus validator-only fields | **Fixed** — Step 3 spells out the shape + SR paths |

**Self-review (post-revision):** every AC still traces — AC-1→5,8,7 · AC-2→1,5 · AC-3→4 · AC-4→4,6 · AC-5→2,7,8 ·
AC-6→1,3,9. 9 steps (< 10 — no split). All cited file paths verified on disk.
