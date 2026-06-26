# adhoc-MvcSurvivorReport — Questions

> **Phase 1 analysis result: NO BLOCKING QUESTIONS.** All 5 target files exist, every cited line
> anchor verifies against live source, versions match (nexus 1.18.5, nexus-flutter 0.1.1), and the
> `workflow-contract.test.mjs` baseline is confirmed 33/33 green. The two items below are
> **non-blocking design confirmations** routed to the architect for visibility — each has a
> proceed-default I will implement if not redirected at Phase-2 kickoff. They are recorded here per
> ADR-17 (write the artifact) because they have cross-step implications (Steps 2/4/5).

## Q1: Pre-tag log-line signal — dedicated arg, separate from `expectedSurvivorLines`?
**From:** developer
**To:** architect
**Status:** Open (non-blocking — proceed-default below)
**Step:** Step 4 (orchestrator pre-tag in `cover-flutter.workflow.js`) + Step 2 (adapter doc — what the adapter "must surface")

**Context:** Step 4 says tag a survivor `equivalent-logging` "ONLY when the adapter-supplied log-line
set contains its line AND `mutatorName` indicates a void-call removal." `cover-flutter.workflow.js`
has no such input today; `EXPECTED_SURVIVOR_LINES` (`:204`) is a *different* mechanism (it excludes
lines from the reachable denominator, `:89-92`). The plan's classification table treats
`equivalent-logging` (a *residual-survivor classification* signal) as distinct from the
denominator-exclusion list. So the pre-tagger needs its own input.

**Question:** Add a new optional workflow arg for the log-call line set (separate from
`expectedSurvivorLines`), defaulting to `[]`? And in Step 2, specify the adapter surfaces this set
(e.g. from the KB / a `mutation-testing.md` convention) as the orchestrator-pre-taggable signal?

**Recommendation:** Yes — new optional arg (proposed name `equivalentLoggingLines`, default `[]`),
kept separate from `expectedSurvivorLines`. A survivor on this set with a void-call-removal
`mutatorName` is tagged `equivalent-logging` but stays in `reachableSurvivors` (so the report can
suggest adding it to `expectedSurvivorLines`); excluded lines never reach the tag seam. This matches
the plan's "expectedSurvivorLines suggestion" flow and the design table's split.
**Confidence:** medium — the plan's intent is clear (separate signal); only the arg *name* and the
default are unspecified, which is normal developer latitude. Flagged because it also dictates one
sentence of the Step 2 adapter doc.

### Answer
_(architect — optional; absent ⇒ developer proceeds on the recommendation)_

## Q2: classify-survivors agent — spawn condition + keeping slice 9f green
**From:** developer
**To:** architect
**Status:** Open (non-blocking — proceed-default below)
**Step:** Step 4 (classify-survivors agent in `loop-flutter.workflow.js` Report phase) + Step 5 F3 (slice 9f)

**Context:** Step 4 spawns ONE sonnet agent in loop-flutter's Report phase to assign source-dependent
tags to "each residual survivor the orchestrator did not pre-tag." Slice 9f (`:719-769`) drives the
real `loop-flutter` with a mocked cover-flutter return whose `reachableSurvivors: []` (`:729`), and
asserts a fixed agent order (kb-write-file, kb-flip, report-write). An *unconditional* new agent call
would add a 4th agent fixture and shift that order, breaking 9f beyond the `mutationSummary` update
F3 already calls for.

**Question:** Gate the classify-survivors agent spawn on `residualSurvivors.length > 0` (so it runs
on any stop reason that leaves residual survivors — incl. `all-gates-green` with a sub-100% floor —
but is skipped when there are none)? That keeps 9f's empty-survivor path from needing a new agent
fixture; F3's job there is then only to add `mutationSummary` to the cover-shaped mock.

**Recommendation:** Yes — spawn the classify agent only when residual survivors exist; run it on the
final iteration's residuals regardless of stop reason (the plan's "first-run authority" note). 9f's
empty-survivor mock then needs only the `mutationSummary` field (no new agent fixture); a *new* Step-5
slice covers the populated-survivor classify path with its own fixture.
**Confidence:** medium — consistent with the plan ("each residual survivor"; nothing to classify when
none) and minimizes 9f churn; raised only because it couples Step 4's control flow to Step 5's fixture
wiring.

### Answer
_(architect — optional; absent ⇒ developer proceeds on the recommendation)_
