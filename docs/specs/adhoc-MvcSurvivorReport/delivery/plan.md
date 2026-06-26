# Implementation Plan — adhoc-MvcSurvivorReport (rev 2)

**Feature:** Structured survivor classification in the Mine→Verify→Cover Report stage, and make the Dart/Flutter reference harness demonstrate the corrected mutation-scoring contract.
**Intent:** Scoped (method skill + adapter skill + dev-harness reference impl + contract tests).
**Status:** Ready
**Binding input:** the consuming-repo feedback `D:\omnishelf\omnishelf_flutter_app\docs\kb\reports\SKILL-FEEDBACK-mine-verify-cover-flutter.md` — Proposal 2 (ENHANCEMENT), plus the reference-impl half of Proposal 1's anti-fake-green hardening. Re-grounded against live source 2026-06-25; both still apply.
**Revision:** rev 2 folds the code-grounded critic review (`review-critic.md`, NO-GO → 1 CRITICAL + 3 HIGH + 3 MEDIUM). The CRITICAL (pure classifier can't derive source-dependent tags) and F2 (fabrication-forcing cross-check) drove a redesign of Steps 3–4.

## Context

A live pilot run via a skill-authored Workflow (`GetNextPogStepAssistantDetailsUsecase`) exposed two gaps the dev-harness runs had papered over:

1. **The auto-report's survivor list is unstructured.** It optimistically labelled masked/dead-code mutants as "real gaps"; a human had to re-classify them and notice the implied dead-code cleanup (`goPreviousStep` never forwarded). Classification should be a structured, repeatable run output.
2. **The reference impl scores correctly only by luck of its prompt.** `harness/cover-flutter.workflow.js` counts `Killed` by iterating the mutant array, which works only because its runner prompt carries an ad-hoc "treat all others as Killed" instruction. A thinner authored Workflow followed the shipped prose literally and scored 0% on a 77% suite.

The shipped-skill PROSE bug is **already fixed by solo** (`adhoc-MvcGateScoringFix`, commit `1525cba`): nexus **1.18.5** added the anti-fake-green invariant (`mine-verify-cover/SKILL.md:52`); nexus-flutter **0.1.1** rewrote the scoring step to score from the stdout summary. THIS feature (a) adds the survivor-classification taxonomy the method should emit every run, and (b) makes the reference harness DEMONSTRATE the corrected summary-scoring + cross-check.

## Dependencies & current state

- **Solo fix has LANDED** (1525cba). The skill contract is now: score `killed = reachable − undetected` from the **stdout summary**; XML reserved for survivor enumeration; cross-check the total and **halt** on mismatch. Steps 3–4 implement exactly this contract — **read the solo-edited skills first** (`mine-verify-cover/SKILL.md:52`, `mine-verify-cover-flutter/SKILL.md` step 3).
- nexus is at **1.18.5**, nexus-flutter at **0.1.1**. Steps 1–2 bump again: nexus 1.18.5 → 1.18.6, nexus-flutter 0.1.1 → 0.1.2.

## Classification design (resolves F1 — split by who can compute the tag)

The five tags are NOT uniformly derivable. Split by computability:

| Tag | Who assigns it | Why |
|-----|----------------|-----|
| `equivalent-logging` | orchestrator (pure) **only** with an adapter/KB log-line signal; else leave `unclassified` | needs the line *text* — derivable only when the KB/adapter supplies the log-line set |
| `equivalent-format` | **classify-survivors agent** (source + KB access) | needs both key-builder use-sites |
| `dead-code` | **classify-survivors agent** | cross-procedural call-graph property |
| `masked` | **classify-survivors agent** | whole-source semantic property |
| `REAL-gap` | **classify-survivors agent** (the default *after* the agent fails to prove equivalence) | never the orchestrator's default — that is the defect being removed |

The orchestrator NEVER defaults an unprovable survivor to `REAL-gap`. Source-dependent tags are **agent-assigned**; the orchestrator only records the agent's verdict. This is the load-bearing correction.

## Steps

### Step 1 — Method: survivor-classification taxonomy + Report-stage spec
**File:** `plugins/nexus/skills/mine-verify-cover/SKILL.md`
**Skill:** None (skill-doc edit) · **TDD:** no · **Confidence:** high
Add a stack-neutral Report-stage spec naming the 5 tags and **who assigns each** (per the table above): `equivalent-logging` is the only mechanically pre-taggable tag (and only with an adapter signal); `equivalent-format`/`dead-code`/`masked`/`REAL-gap` are **agent-assigned by a classify-survivors agent with source access** — the orchestrator records, never derives. Only `REAL-gap` drives another Cover iteration. Add "implied source cleanups" (`dead-code` + always-`equivalent` survivors → candidate cleanups with `file:line`) and an `expectedSurvivorLines` suggestion.
**F5 note:** the anti-fake-green invariant (`:52`) and `## Model` section (`:81-83`) already shipped in 1.18.5 — this step is **additive** (the Report stage is currently only a one-line pipeline row); do NOT restate the invariant, but keep the new Report cross-check language consistent with line 52.
**Acceptance:** Report section names all 5 tags + the assignment owner of each + the REAL-gap-only-iterates rule + cleanup-findings + `expectedSurvivorLines` suggestion; no duplication of the 1.18.5 invariant. `tests/lint` green. Bump nexus PATCH (1.18.5 → 1.18.6).

### Step 2 — Adapter: Dart patterns mapped to the taxonomy
**File:** `plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md`
**Skill:** None · **TDD:** no · **Confidence:** high
Wire the adapter's existing "Equivalent-mutant filter" section to the method's tags: `equivalent-logging` = `removeVoidCall` on a `log`/`info`/`warning` line (this is the orchestrator-pre-taggable signal — define exactly what the adapter must surface: the set of log-call line numbers, e.g. from the KB); `equivalent-format` = consistent key-builder change; `dead-code`/`masked` cues for the classify-survivors agent. Reference live examples: BuildZpl log survivors, CycleCount key-format survivor, POG `goPreviousStep` dead branch.
**Acceptance:** adapter names each tag, marks `equivalent-logging` as the pre-taggable one and specifies the log-line signal it supplies, and lists the Dart cue per agent-assigned tag. `tests/lint` green. Bump nexus-flutter PATCH (0.1.1 → 0.1.2).

### Step 3 — Reference impl: rescore the floor from the summary + survivor-count cross-check + HALT
**File:** `harness/cover-flutter.workflow.js`
**Skill:** None · **TDD:** yes (paired with Step 5) · **Confidence:** medium
Resolves F2, F4, F6.
- **Runner** parses the `mutation_test` stdout summary and returns a `mutationSummary: { found, undetected, timeouts, notCovered }` field. The `mutants` array continues to carry **only survivors** (what the XML provides) — do NOT fabricate killed entries.
- **Rescore `mutation_floor` from the summary** (not by counting the array, matching the shipped skill `mine-verify-cover-flutter/SKILL.md` step 3): `reachable = found − notCovered`; subtract equivalent-exclusions (survivors on `expectedSurvivorLines`) from BOTH the reachable denominator and the survivor count; `killed = reachableDenominator − reachableSurvivors.length` (Timeouts already counted in `found`, not in `undetected`, so they fall on the killed side). `killRate = killed / reachableDenominator`.
- **Cross-check (anti-fake-green):** `mutationSummary.undetected === mutants.length` — the XML survivor array must equal the summary's undetected count. On mismatch, **early `break`** with `result.stopped = 'mutant-count-mismatch'` (the ratchet pattern at `cover-flutter.workflow.js:379-384`), NOT a loop-gate. Extend `RUNNER_RESULT_SCHEMA` with `mutationSummary` and add it to `required` (`:259`).
- **F6:** amend the file header (`:6-14`) to record that cover-flutter intentionally diverges from the "copied VERBATIM" battery with a Dart-specific summary-scoring + survivor-count cross-check (the regex tool reports survivors only) — so a future battery resync does not strip it.
**Acceptance:** runner returns `mutationSummary`; `mutation_floor` score derives from the summary and reproduces BuildZpl 90% / CycleCount 94% on their fixtures; a survivors-only/inconsistent count HALTS on iteration 1 with `mutant-count-mismatch`; header divergence note present.

### Step 4 — Survivor classification: pre-tag + classify-survivors agent + report emission
**Files:** `harness/cover-flutter.workflow.js` (pre-tag + tag seam) + `harness/loop-flutter.workflow.js` (classify agent + Report)
**Skill:** None · **TDD:** yes (Step 5) · **Confidence:** medium
Resolves F1 + the tag-seam gap.
- **Orchestrator pre-tag (pure):** in cover-flutter, tag a survivor `equivalent-logging` ONLY when the adapter-supplied log-line set contains its line AND `mutatorName` indicates a void-call removal; else leave the tag absent. Add the optional `tag` field to `reachableSurvivors` entries (`:95`) so loop-flutter can render it (the data-flow seam).
- **classify-survivors agent (source-aware):** in loop-flutter's Report phase, after gates, spawn ONE agent (model: sonnet) that reads the target source + the KB and assigns the source-dependent tags (`equivalent-format`/`dead-code`/`masked`/`REAL-gap`) to each residual survivor the orchestrator did not pre-tag. The orchestrator records the agent's tags — it does not derive them.
- **Report emission:** the loop-flutter report's Residual Survivors section shows each survivor's tag; an `## Implied cleanups` subsection lists `dead-code` + always-equivalent survivors as `file:line`; an `expectedSurvivorLines: [...]` suggestion line is emitted **in the operator-facing report** (machine return keeps the raw `reachableSurvivors`).
- **First-run authority (gap):** classification runs on the **final** iteration's residual survivors (after `expectedSurvivorLines` is known) so it does not shrink run-over-run; state this in the report.
**Acceptance:** pre-tag is a pure fn (no fs/Date); the classify agent is the only source-reader; report carries tagged survivors + Implied-cleanups + the suggestion; tag flows cover-flutter → loop-flutter via `reachableSurvivors.tag`.

### Step 5 — Contract tests
**File:** `tests/unit/workflow-contract.test.mjs`
**Skill:** tdd · **TDD:** yes · **Confidence:** high
Resolves F3 + F7.
- New slices: (a) summary-scoring computes the right killRate from a synthetic `mutationSummary` (70 found / 16 undetected / 0 not-covered → 77%; with an `expectedSurvivorLines` exclusion case); (b) the survivor-count cross-check HALTS on iteration 1 with `mutant-count-mismatch` when `undetected !== mutants.length`; (c) the orchestrator pre-tagger maps `equivalent-logging` fixtures correctly and leaves source-dependent survivors **untagged** (NOT `REAL-gap`). The agent-assigned tags are validated at the **schema** level (the classify agent returns a tag from the enum) — not as a pure 5-way fn.
- **F3:** update existing slice 9e and the loop-flutter slice 9f cover-shaped mock to include `mutationSummary`, so they stay green under the new gate.
- **F7:** scope the green gate to the changed file — `node --test tests/unit/workflow-contract.test.mjs` (current baseline 33 green) — and note the 4 pre-existing full-suite failures (gen-omni / nexus-cpp sync) as out of scope, not introduced here.
**Acceptance:** new slices green; `workflow-contract.test.mjs` fully green; slices 9e/9f updated and green.

## Review mode — recommendation

**Code-grounded re-review of Steps 3–4 only** (the redesigned steps). The doc steps (1, 2) and the test step (5) are low-risk; Steps 3–4 carry the corrected scoring arithmetic and the new agent seam — re-verify those against live source + the contract suite. The first code-grounded pass already caught the CRITICAL; a focused re-check confirms the redesign holds. Confidence: **high**.

## Out of scope

- The shipped-skill prose bug fix — DONE (solo, 1525cba).
- The omni twin regen — deferred to merge; `gen-omni.mjs` mirrors both skills (harness is dev-only, not mirrored).
- A Stryker-grade Dart AST mutator — none exists; trust anchor unchanged.
- The 4 pre-existing gen-omni/nexus-cpp full-suite test failures — unrelated, not introduced here.
