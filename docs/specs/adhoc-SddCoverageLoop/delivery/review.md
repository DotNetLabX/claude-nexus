# SDD Coverage Loop — Review

## Step 1 — Done-Check

**Pre-commitment predictions (before reading implementation.md):** (1) Step 3's contract-guard
registration would be the likeliest gap — the plan review already caught it once as a false-green trap;
(2) Step 3's selfcheck inline-copy sync extension easy to skip; (3) operator-owed Steps 6/8/9 at risk of
either over-claiming live results or under-delivering the build-only deliverables. Checked each specifically.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Author spec oracle | Implemented | `spec-rules-bugratio.md`; 4 rules SR-1..4. GOLD-18's compound outcome split into SR-3 (boolean `AlertActive`) + SR-4 (streak `ConsecutiveStreak`) — documented Key Decision, valid (schema `expectedOutcome.kind` is singular per rule; plan required "intent analogs of GOLD-16..18", not a 1:1 mapping). Intent/conceptual `targetField` per the Q1 answer. **Clean-room verified by grep:** forbidden paths (`golden-set.md`, `BugRatioAnalyzer.cs`, `…Data`, code-mined `docs/kb/`) appear only in an explicit "NOT sourced from" negative clause (`:13-14`); the sole cited sources are the sanctioned Fokus prose (`D:\src\fokus\docs\kb\...`, `:10-11`). |
| 2 — Outcome labeler (TDD) | Implemented | `spec-diff-calc.mjs` (`outcomeMatches`/`labelOutcome`) + 15-test suite covering numeric±ε / boolean / streak, ε boundary, errored, code-missing vs falsy/zero, divergence direction. `diffRules`/`classifyRule` reused unchanged. `tdd` logged. |
| 3 — Calc spec front-end workflow | Deviated (valid) | `spec-cover-calc.workflow.js` + `bugratio-spec.json` + mirror sandbox test (11 tests) built. **Registration verified by grep** — `SPEC_COVER_CALC_PATH` at `workflow-contract.test.mjs:38`, in the shared loop `:1549`, individual no-static-import assertion `:1560` (the false-green trap is genuinely closed). **selfcheck PAIRS extension verified by grep** (`:145,149-150`). Deviation: no-static-import registered as an individual `test()` rather than "a shared loop" — valid: the live file has no shared no-static-import loop (only meta-purity is one; 3 of 7 existing workflows have no such test at all). Mirrored the `spec-cover` precedent; the plan's "both shared loops" premise was factually wrong about the codebase, and the developer followed the intent (register + get both checks). |
| 4 — Trace-join + pilot map (TDD) | Implemented | `trace-join.mjs` (`traceRule`, plan-ref > manual > locator priority, confidence-gated, human-queue routing) + 9 tests + `trace-map-bugratio.md` (SR-1..4 → `BugRatioAnalyzer` canonical, `source: manual`; class set matches `bugratio.json`). `tdd` logged. |
| 5 — Independence manifest + tripwire (TDD) | Implemented | `independence-check.mjs` (`checkManifest`/`checkIndependence`, fail-closed on all 3 violation types, Windows-path normalized) + 7 tests. selfcheck wiring intentionally skipped — the plan pre-sanctioned this as "developer's call"; reason documented (real per-run manifests only exist at operator live-run; a synthetic smoke call would be redundant with the unit tests). `tdd` logged. |
| 6 — Aimed code arm (Owner: operator) | Deviated (valid) — operator-owed | Build deliverable met: `bugratio.json`'s `class` == trace-map class set (`{BugRatioAnalyzer}=={BugRatioAnalyzer}`), no new files per plan. `mine-verify-cover` logged. **Open gate:** the live mutation-gated run is operator-owed by the plan's Owner Split; not executed. Runbook documented. |
| 7 — Rule-identity crosswalk | Implemented (helper) | `rule-crosswalk.mjs` (`applyCrosswalk`/`reconcileRuleSets`, pure) + 7 tests including an **end-to-end proof** that `diffRules`' `both-agree` flips empty→non-empty post-reconciliation (directly exercises the plan-review HIGH fix, not just internals). `tdd` logged. The crosswalk MAP is operator-owed post-hoc (cannot exist before Steps 6/8 produce real rule sets) — correctly not authored. |
| 8 — Two blind arms + reconcile + diff (Owner: operator) | Deviated (valid) — operator-owed | No developer-buildable deliverable (plan: "Owner: operator" throughout; evidence under git-ignored `.runs/`). Composes Steps 1–7; documented as an OPERATOR ACTION REQUIRED runbook incl. the pre-run `checkIndependence` tripwire gate. **Open gate:** the live two-arm run is not executed. |
| 9 — Pilot report + verdict (Owner: operator) | Deviated (valid) — operator-owed | Depends entirely on Step 8 live output. Documented as a runbook incl. the mandated transcription-fidelity caveat and the "code arm's independent recall = the load-bearing signal" framing. **Open gate:** `pilot-bugratio.md` not authored (by design — AC-6 lands only at the operator's live run). |

**Skill conformance (scored against the log):** PASS. Scoped to this developer run (session `d839f0e6`,
agent `developer`, token `developer:implement`), the skill-invocations log holds exactly `tdd` and
`mine-verify-cover` — the plan's two non-`None` mappings (`tdd` on Steps 2/3/4/5/7; `Follow mine-verify-cover`
on Step 6). Both present. `## Skills Used` section present; both self-reported skills appear in the log
(no fabrication). All-`None` steps (1/8/9) correctly carry no invocation.

**Scope check:** no unexpected files — every created/modified file (11 created, 2 modified) traces to a
plan step (Steps 1–5). No scope creep.

**Open production gate (surfaced, not a Fail):** the pilot has **no live evidence yet** — no `.runs/`
artifacts, no authored crosswalk map, no `pilot-bugratio.md`. This is **by plan design**: the Owner Split
marked Steps 6/8/9 operator-owed up front, and each step's acceptance stated what a build-only PASS does not
prove. AC-6 (the real proof) is realized only when the operator runs the two-arm pilot. The developer
disposed these correctly and flagged the gate in Carry-Over Findings.

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-07-02.*

## Step 2 — Code Review

## Reviewed By
nexus reviewer (code-grounded — every new/modified file read in full; offline suite + selfcheck re-run fresh
this session, not trusted from implementation.md's claims). **Re-review cycle 1/3**: verified both MEDIUM
fixes against live source + a fresh full-suite run, not against the developer's fix-cycle description alone.

## Verdict: APPROVED

## Re-review (Cycle 1/3) — Fix Verification

Both MEDIUM findings from the initial pass are **RESOLVED**, confirmed against live source:

1. **Epsilon boundary (`spec-diff-calc.mjs:45`)** — `tests/unit/spec-diff-calc.test.mjs` now has
   `outcomeMatches numeric: EXACTLY AT a non-zero epsilon boundary (diff === epsilon) is a match (<=, inclusive)`
   (`expected: 10, actual: 10.5, epsilon: 0.5` — a binary-exact diff, not a float near-miss). Confirmed
   non-tautological by inspection: under `<=` (current code) `0.5 <= 0.5` → `true` (test passes); under a
   hypothetical `<` mutation, `0.5 < 0.5` → `false` (test would fail) — matching the developer's own
   documented mutation-check (implementation.md `## Fixes Applied`).
2. **Confidence threshold (`trace-join.mjs:52`)** — `tests/unit/trace-join.test.mjs` now has
   `traceRule: a locatorResult EXACTLY AT the confidence threshold is accepted (>=, inclusive boundary)`
   (`confidence: 0.6` against the default `threshold: 0.6`). Same non-tautological check: under `>=`
   (current code) `0.6 >= 0.6` → `route: 'accepted'`; under a hypothetical `>` mutation it would route
   `human-queue` instead — the test would catch the regression.
3. **Lib files verified unchanged** — read `harness/lib/spec-diff-calc.mjs:40-48` and
   `harness/lib/trace-join.mjs:46-58` directly: both still read `<=`/`>=` exactly as in cycle 0, confirming
   "no net change" to production logic — only test coverage was added, matching the developer's claim that
   both findings were coverage gaps, not logic bugs.
4. **Counts re-verified fresh, not re-quoted**: `spec-diff-calc.test.mjs` 15→**16** (confirmed:
   `node --test tests/unit/spec-diff-calc.test.mjs` → 16/16), `trace-join.test.mjs` 9→**10** (confirmed:
   10/10), full suite 441→**443** (confirmed: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` →
   443/443), `node scripts/selfcheck.mjs` → 5/5 (unchanged, as expected — no registration/sync surface
   touched by this fix cycle).

No new findings introduced by the fix (both edits are additive test-only changes; no adjacent call sites to
re-check since neither lib file changed).

## Reconciling `review-codex.md` (parallel cross-check, this cycle)

The parallel Codex cross-check returned **NO-GO**, citing Step 9's missing pilot report and Step 5/6's
independence tripwire as "not wired into a run path" as blocker/major findings. I read `review-codex.md` in
full. Both findings judge the delivery against a bar the plan **does not set**:

- Plan Steps 6, 8, 9 are each headed **`Owner: operator`** in `plan.md` verbatim (Step 6: "Owner: operator
  (live run)"; Step 8: "Owner: operator"; Step 9: "Owner: operator (depends on Step 8)"), with an explicit
  Owner Split section stating these need a consuming-tree (SR) git write, the live .NET/Stryker toolchain,
  and two SR git worktrees — none of which the developer has authority or ability to perform. Codex's
  "blocker" (`pilot-bugratio.md` missing, no `.runs/` artifacts) restates the plan's own by-design gate
  (Steps 8/9 are the live proof, not yet run) as if it were an unflagged shortfall — it is flagged, in
  implementation.md's Carry-Over Findings, the architect's Step 1 done-check, and my own cycle-0 review.
- The Step 5 "major" finding (`checkIndependence` not invoked outside tests) mirrors the plan's OWN
  parenthetical on Step 5's file list — "(If a selfcheck home fits, wire the assertion into
  `scripts/selfcheck.mjs` — developer's call.)" — an explicitly optional wiring, not a mandate. The developer's
  Key Decision reasons this out (real manifest data only exists at operator live-run time); the operator's
  Step 8 runbook instructs calling `checkIndependence` directly with real data as its own pre-run gate. This
  is a plan-sanctioned choice, not a gap.

This matches a known failure mode for the Codex cross-check (a NO-GO built on a premise not grounded in the
actual plan/spec text) — I reconcile finding-by-finding against `plan.md`'s live "Owner: operator" markers
rather than deferring to either verdict on its face. **My verdict stands: APPROVED.** The team lead should
treat my Step 2 section (which independently re-verified the Owner Split against plan.md text, not just
implementation.md's claim of it) as authoritative on this specific disagreement; Codex's finding about the
Step 5 wiring being *undocumented as invoked* is fair as a note (see Gaps) but does not rise to a plan
deviation or a code defect.

## Pre-commitment Predictions
Before reading the code: (1) the `spec-diff-calc.mjs` epsilon-boundary logic (`<=`) was the most likely place
for an off-by-one, given it's net-new tolerance math; (2) the `spec-cover-calc.workflow.js` inline copies
(spec-diff.mjs's rule-diff fns + spec-diff-calc.mjs + cover-gates.mjs) were the most likely place for a silent
inline/lib divergence, since only one of the three is selfcheck-guarded per the plan's own scoping; (3) the
Step-7 crosswalk's "closes the empty-intersection gap" claim was the most likely overclaim to verify literally,
not take on faith. **Found:** (1) epsilon boundary logic is correct (verified by direct execution at exactly
`diff==eps` and `diff==eps+epsilon`), but the exact-boundary case is untested — a real MEDIUM gap, not a bug.
(2) the two unguarded inline copies (`cover-gates.mjs` into both `spec-cover.workflow.js` and
`spec-cover-calc.workflow.js`) have in fact already drifted from `harness/lib/cover-gates.mjs` (reformatting +
one reworded error string) — but the drift is 100% inherited from the pre-existing `spec-cover.workflow.js`
copy (byte-diffed to confirm), not newly introduced by this feature; correctly flagged as a pre-existing LOW
carry-over, not a new finding. (3) the crosswalk fix is real, not asserted — `rule-crosswalk.test.mjs` proves
`diffRules` flips `both-agree` from empty to non-empty pre/post-reconciliation using the SAME unmodified
`spec-diff.mjs` import, the strongest form of proof available offline.

## Findings

### [MEDIUM — RESOLVED cycle 1] Numeric-epsilon boundary (`<=`) has no test at the exact non-zero boundary value
**File:** `harness/lib/spec-diff-calc.mjs:45` (`Math.abs(actual - expected) <= eps`)
**Origin:** implementation
**Issue:** The redness determiner uses an inclusive `<=` comparison against `epsilon`. `spec-diff-calc.test.mjs`
covered epsilon=0 exactly at its own boundary (diff=0=eps=0, "exact equality with epsilon 0 is a match") and
within/outside cases with a wide margin (e.g. diff 1e-12 vs eps 1e-9; diff 0.17 vs eps 1e-6), but never
asserted the case that actually exercises the `<=` vs `<` choice for a **non-zero** epsilon: `diff === eps`.
Verified correct by direct execution at the time — a coverage gap, not a live bug.
**Fix:** Add a case to `spec-diff-calc.test.mjs` asserting `diff === epsilon` (non-zero) matches.
**Resolution (cycle 1, verified this session):** `tests/unit/spec-diff-calc.test.mjs` now has "outcomeMatches
numeric: EXACTLY AT a non-zero epsilon boundary (diff === epsilon) is a match (<=, inclusive)"
(`expected:10, actual:10.5, epsilon:0.5` — a binary-exact diff). Confirmed non-tautological by inspection
(would fail under a `<` mutation). `spec-diff-calc.mjs` itself is unchanged (read `:40-48` directly — still
`<=`). 15→16 tests, re-run fresh: 16/16 pass.
**Confidence:** 85/100 (original) — resolution confidence 95/100 (fix verified against live source + fresh run)

### [MEDIUM — RESOLVED cycle 1] Locator confidence threshold (`>=`) has no test at the exact threshold value
**File:** `harness/lib/trace-join.mjs:52` (`if (confidence >= threshold)`)
**Origin:** implementation
**Issue:** `trace-join.test.mjs` tested confidence comfortably above (0.8 vs default 0.6; 0.7 vs custom 0.9 —
this one is actually below) and comfortably below (0.53 vs default 0.6) the threshold, but never asserted
`confidence === threshold` exactly, which is the case that distinguishes `>=` from `>`. Verified correct by
direct execution at the time — a coverage gap, not a live bug.
**Fix:** Add a test asserting `confidence === threshold` routes `'accepted'`.
**Resolution (cycle 1, verified this session):** `tests/unit/trace-join.test.mjs` now has "traceRule: a
locatorResult EXACTLY AT the confidence threshold is accepted (>=, inclusive boundary)" (`confidence: 0.6`
against the default `threshold: 0.6`). Confirmed non-tautological by inspection (would route `human-queue`
under a `>` mutation). `trace-join.mjs` itself is unchanged (read `:46-58` directly — still `>=`). 9→10 tests,
re-run fresh: 10/10 pass.
**Confidence:** 85/100 (original) — resolution confidence 95/100 (fix verified against live source + fresh run)

## Positive Observations
- **Plan conformance is exact.** All 9 plan steps trace to implementation.md entries; the operator-owed Steps
  6/8/9 are correctly disposed as build-only-deliverable + documented runbook, with no fabricated live-run
  evidence (checked `harness/.runs/` — no artifacts for this feature; `pilot-bugratio.md` does not exist, as
  expected).
- **The Step-7 crosswalk fix is proven, not asserted.** `rule-crosswalk.test.mjs`'s last two tests call the
  real, unmodified `diffRules` (imported from `spec-diff.mjs`) on the same fixture before and after
  `reconcileRuleSets`, and the `both-agree` bucket genuinely flips 0 → 1. This is exactly the kind of
  fresh-evidence proof the plan-review HIGH finding demanded, not a description of the fix.
- **Independence tripwire fails closed on all three violation types**, verified with real unit tests
  (golden-set-in-manifest, crosswalk-in-manifest, cross-manifest overlap) plus a Windows-path
  case/separator-normalization test — a real edge case given every path in this feature is a `D:\...` string.
- **Clean-room boundary verified independently, not taken on faith.** I grepped `spec-rules-bugratio.md` myself:
  the only occurrences of `golden-set.md` / `BugRatioAnalyzer.cs` / `…Data` are inside the document's own
  explicit "NOT sourced from" negative clause. I also confirmed by direct sandbox-test read that
  `SPEC_ORACLE` (the spec-oracle path) is referenced in exactly one prompt template
  (`specLoadPrompt`) in `spec-cover-calc.workflow.js` — the workflow's own test
  (`spec-cover-calc-workflow.test.mjs:173-192`) captures the *actual* rendered prompt text sent to each
  labeled agent call inside a real sandboxed run and asserts the oracle string is absent from Cover/runner/miner
  prompts, which is a non-vacuous negative assertion (the sandbox executes the real Locate/Cover/Run control
  flow, it doesn't stub it away).
- **`spec-cover-calc.workflow.js`'s inlined helpers are selfcheck-guarded exactly where the plan scoped them**
  (`spec-diff.mjs`'s 6 rule-diff fns minus the validator-only `labelRed`, plus `spec-diff-calc.mjs`'s 2 fns) —
  verified by reading the generalized `PAIRS` list in `scripts/selfcheck.mjs` and re-running it fresh (PASS,
  "3 lib/workflow pair(s) in sync").
- **All three Carry-Over Findings in implementation.md are legitimate and accurately scoped** — confirmed by
  independent evidence, not just re-stated: (1) Steps 6/8/9 have zero live artifacts (`harness/.runs/` checked,
  `pilot-bugratio.md` absent) — correctly by-design, not a shortfall; (2) the no-static-import "shared loop"
  claim — grepped `workflow-contract.test.mjs` and counted exactly 5 individual `has no static import` tests
  against 8 registered workflows, confirming 3 (`cover-flutter`, `cover-cpp`, `loop-flutter`) lack one, a
  pre-existing gap; (3) the `cover-gates.mjs` inline-copy drift — byte-diffed `spec-cover-calc.workflow.js`'s
  inlined `suiteGreen`/`noFlaky`/`mutationFloor`/`targetMutated` against both `harness/lib/cover-gates.mjs`
  (diverged: reformatting + a reworded error string) and `spec-cover.workflow.js`'s own pre-existing inline
  copy (byte-identical) — proving the divergence from the lib predates this feature and this feature introduced
  zero *new* drift.

## Gaps
- Both MEDIUM findings above are **RESOLVED as of cycle 1** — see the Re-review section and the Findings'
  Resolution notes.
- `NaN`-typed `expected`/`actual` in `outcomeMatches` (defensively handled — returns `false`/not-a-match) has
  no explicit unit test. Very low priority: the spec-load schema only ever produces numbers for a `numeric`
  kind, so this path is not reachable from the documented spec-oracle shape; flagging only for completeness,
  not as a finding.
- Steps 6, 8, 9's live two-arm pilot run remains entirely unexecuted, as designed — the real proof of AC-6 does
  not yet exist. This is a plan-scoped, correctly-disposed gap (see Carry-Over Findings), not a review finding.
- `checkIndependence` (Step 5) is not invoked anywhere outside its own unit tests — Codex's cross-check flags
  this as "major." I judge it plan-sanctioned (see "Reconciling `review-codex.md`" above), but noting it here
  too so it isn't lost: if the team lead wants a stronger guarantee before the live Step 8 run, the cheapest
  fix would be a thin operator-facing CLI wrapper (`scripts/`) that calls `checkIndependence` against a
  manifest file — not required by the plan, but would close the "no non-test invocation" observation outright.

## Open Questions
None. Every CRITICAL/HIGH-candidate I investigated resolved to either a confirmed non-issue (verified by
direct execution or byte-diff) or below the MEDIUM severity floor.

## Evidence

**Cycle 1 (this session, re-review after fixes) — all commands re-run fresh, not re-quoted from cycle 0:**

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Full offline suite (fresh, cycle 1) | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | `tests 443 / pass 443 / fail 0` (was 441 in cycle 0 — +2 from the two boundary-test fixes) |
| selfcheck (fresh, cycle 1) | pass | `node scripts/selfcheck.mjs` | `5/5 passed` — incl. `[PASS] spec-diff inline-copy sync — 3 lib/workflow pair(s) in sync` (unchanged — no sync surface touched) |
| `spec-diff-calc.test.mjs` (Step 2, fix verification) | pass, 15→16 confirmed | `node --test tests/unit/spec-diff-calc.test.mjs` | `16/16` |
| `trace-join.test.mjs` (Step 4, fix verification) | pass, 9→10 confirmed | `node --test tests/unit/trace-join.test.mjs` | `10/10` |
| Lib files unchanged (direct read, cycle 1) | confirmed | `sed -n '40,49p' harness/lib/spec-diff-calc.mjs`; `sed -n '46,58p' harness/lib/trace-join.mjs` | both still `<=`/`>=` exactly as cycle 0 — no production logic changed |
| `review-codex.md` reconciliation | reviewed in full | (read, not run) | NO-GO premise does not match `plan.md`'s explicit `Owner: operator` markers on Steps 6/8/9 — see reconciliation note above |

**Cycle 0 (initial pass) — retained for audit trail:**

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Full offline suite (fresh, cycle 0) | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | `tests 441 / pass 441 / fail 0` |
| selfcheck (fresh, cycle 0) | pass | `node scripts/selfcheck.mjs` | `5/5 passed` — incl. `[PASS] spec-diff inline-copy sync — 3 lib/workflow pair(s) in sync` |
| `spec-diff-calc.test.mjs` (Step 2) | pass, count matches implementation.md | `node --test tests/unit/spec-diff-calc.test.mjs` | `15/15` |
| `spec-diff.test.mjs` + `spec-diff-calc.test.mjs` combined | pass, count matches implementation.md ("42 tests") | `node --test tests/unit/spec-diff.test.mjs tests/unit/spec-diff-calc.test.mjs` | `42/42` |
| `trace-join.test.mjs` (Step 4) | pass, count matches | `node --test tests/unit/trace-join.test.mjs` | `9/9` |
| `independence-check.test.mjs` (Step 5) | pass, count matches | `node --test tests/unit/independence-check.test.mjs` | `7/7` |
| `rule-crosswalk.test.mjs` (Step 7) | pass, count matches | `node --test tests/unit/rule-crosswalk.test.mjs` | `7/7` |
| `spec-cover-calc-workflow.test.mjs` (Step 3 mirror) | pass, count matches ("11/11") | `node --test tests/unit/spec-cover-calc-workflow.test.mjs` | `11/11` |
| `workflow-contract.test.mjs` (Step 3 registration) | pass, count matches implementation.md ("57 pass, was 55") | `node --test tests/unit/workflow-contract.test.mjs` | `57/57` |
| Epsilon boundary manual check | correct, uncovered by unit test at the time (MEDIUM finding, now resolved) | `node --input-type=module -e "...outcomeMatches({kind:'numeric',expected:1,actual:1.000001,epsilon:1e-6})..."` | `diff==eps → true`, `diff==eps+tiny → false` |
| Confidence threshold boundary manual check | correct, uncovered by unit test at the time (MEDIUM finding, now resolved) | `node --input-type=module -e "...traceRule({...confidence:0.6})..."` | `confidence==0.6 → accepted`, `0.599999 → human-queue` |
| Clean-room grep (independent re-verification) | pass | `grep -n "golden-set\|BugRatioAnalyzer\.cs\|...Data\|docs/kb" spec-rules-bugratio.md` | only inside the doc's own "NOT sourced from" negative clause |
| `harness/.runs/` artifact check (no fabricated live evidence) | pass | `ls harness/.runs` | pre-existing files from other features only; nothing new for this slug |
| `cover-gates.mjs` inline-copy drift provenance | pre-existing, not new (carry-over LOW confirmed) | `diff` of `suiteGreen`/`mutationFloor`/`targetMutated` between `cover-gates.mjs`, `spec-cover.workflow.js`, `spec-cover-calc.workflow.js` | lib vs either inline copy: cosmetic/error-string drift; the two inline copies: byte-identical |

*Status: COMPLETE — reviewer, 2026-07-02 (cycle 1/3 re-review).*
