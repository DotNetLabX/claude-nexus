# Critic Review (Mode 2, code-grounded) — adhoc-MvcSurvivorReport

**Verdict:** NO-GO (REJECT) — 1 CRITICAL + 3 HIGH + 3 MEDIUM. Doc steps (1, 2) and the scoring-fix *intent* sound; the automation core (Steps 3–4) needed redesign.
**Reviewed plan:** `docs/specs/adhoc-MvcSurvivorReport/delivery/plan.md` (pre-revision).
**Persisted by the architect** (critic writes no file by design, ADR-13). Revision applied in `plan.md`; this file is the durable record.

## Cross-reference matrix (binding input → step)

| Binding-input item | Step(s) | Status |
|---|---|---|
| Proposal 2 §1 — taxonomy (5 tags) routing | 1 (method), 2 (Dart cues) | COVERED |
| Proposal 2 §1 — *automated* classifier emitting the 5 tags | 4 + 5(c) | **INFEASIBLE** (F1) |
| Proposal 2 §2 — implied cleanups (file:line) | 1, 4 | PARTIAL — depends on infeasible classifier |
| Proposal 2 §3 — expectedSurvivorLines suggestion | 1, 4 | PARTIAL |
| Proposal 1 — score from stdout summary | 3 | COVERED (intent) — impedance mismatch (F2) |
| Proposal 1 — total cross-check + **halt** | 3 | PARTIAL — loop-gate, not halt (F4) |
| Reference matches new skill contract | 3–4 | PARTIAL (F2) |
| Scope check | — | CLEAN (no creep) |

## Findings

- **[CRITICAL] F1 — Step 4's pure classifier can't produce 3/5 tags; reproduces the defect.** `dead-code` (cross-procedural call-graph — POG `goPreviousStep` not forwarded, `evaluation.md:196-200`), `masked` (whole-source semantic), `equivalent-format` (both key use-sites) all need source the orchestrator lacks (no fs, `cover-flutter.workflow.js:35`). `equivalent-logging` needs the line *text*, not the line *number*. The `kbFlagged` input is a **phantom** — `reachableSurvivors` entries are `{status,line,mutatorName,replacement}` (`cover-flutter.workflow.js:95`), no tag, no kbFlagged; miners tag rules, not mutants. Built as specified → defaults unprovable survivors to `REAL-gap` = the exact failure the feature removes (`SKILL-FEEDBACK:12`). **Fix:** split by computability — orchestrator pre-tags only `equivalent-logging` from an adapter/KB log-line signal; source-dependent tags are assigned by a **classify-survivors agent with source+KB access**, orchestrator only records. Method spec must say these tags are agent-assigned.

- **[HIGH] F2 — `mutants.length === found` forces fabrication + diverges from the skill.** XML lists only survivors; the 54 killed can't be enumerated, so reaching length 70 means synthesizing schema-required `status/location/mutatorName` (fabrication in the anti-fake-green path). The shipped adapter scores `killed = reachable − undetected` from the **summary** (`SKILL.md:75-79`); the harness counts the array (`cover-flutter.workflow.js:94`). Literal impl → returns 16 ≠ 70 → **permanent false-halt on every legit run**. **Fix:** rescore `mutation_floor` from `mutationSummary` (reachable = found − notCovered; killed = reachable − undetected; Timeouts as killed); `mutants` carries only survivors; cross-check = `mutationSummary.undetected === mutants.length` (survivor-count integrity).

- **[HIGH] F3 — the new gate breaks existing slice 9e the plan says stays green.** Slice 9e runs real cover-flutter with a `runnerReturn` lacking `mutationSummary` (`workflow-contract.test.mjs:690-702`) and asserts `all-gates-green`. New gate reads `mutationSummary.found` → undefined → fail/throw → 9e fails. **Fix:** Step 5 must update slice 9e + the 9f cover-shaped mock to include `mutationSummary`, and add it to `RUNNER_RESULT_SCHEMA.required` (`cover-flutter.workflow.js:259`).

- **[HIGH] F4 — cross-check is a loop-gate, not the required "halt and flag."** Binding input + shipped method invariant (`SKILL.md:52`) demand a halt; a plain battery gate failing just reassigns survivors and burns `MAX_ITERATIONS` → `cap-reached`, not a data-integrity halt. **Fix:** early `break` like the ratchet (`cover-flutter.workflow.js:379-384`), `stopped:'mutant-count-mismatch'`; test halt on iteration 1.

- **[MEDIUM] F5 — Step 1 may duplicate the 1.18.5-shipped invariant + Model section** (`SKILL.md:52, 81-83`). Make Step 1 additive-only, referencing the existing invariant.

- **[MEDIUM] F6 — a flutter-only gate breaks the "copied VERBATIM / KEEP IN SYNC" battery** (`cover-flutter.workflow.js:6-9,42-45`) without acknowledgement. Justified (regex tool is survivors-only) but the header comment must record the intentional Dart-specific divergence so a future resync doesn't strip it.

- **[MEDIUM] F7 — "315 baseline / 0 fail" is stale + false.** Live: 350 tests, 4 pre-existing failures (gen-omni/nexus-cpp), unrelated. `workflow-contract.test.mjs` alone = 33, green. **Fix:** scope Step 5's green gate to the changed file; note the 4 pre-existing failures out of scope.

## Gap analysis
- The tag data-flow seam: tag must be added to `reachableSurvivors` in cover-flutter so loop-flutter (`:198-201,227`) renders it.
- First-run vs follow-run survivor visibility: excluded equivalents are filtered before the classifier on follow runs (`:89-92`) — state which run the classification is authoritative for.
- Where the `expectedSurvivorLines` suggestion lands (operator report vs machine return) — pick one.

## Confirmed-good
- Ordering/dependency correct: solo `adhoc-MvcGateScoringFix` landed (1525cba, nexus 1.18.5, nexus-flutter 0.1.1); version math matches.
- Taxonomy routing (ADR-1) correct; no scope creep.
