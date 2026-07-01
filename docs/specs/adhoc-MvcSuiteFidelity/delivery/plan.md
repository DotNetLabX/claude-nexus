# Implementation Plan — adhoc-MvcSuiteFidelity (F1 + F3)

**Feature Spec:** None (ad-hoc technical pass; binding input is the **flutter rerun feedback** + **ADR-37**).
**Intent:** Scoped (method skill + adapter skill + dev-harness reference impl + contract tests).
**Status:** Ready
**Binding input:** `D:\omnishelf\omnishelf_flutter_app\docs\evaluations\mine-verify-cover-rerun\SKILL-FEEDBACK-mine-verify-cover-flutter.md` — findings **F1** (Minimize prunes behaviour-distinct tests) and **F3** (fixture realism should be a rule, not luck). Refines **ADR-37** (the post-floor Minimize stage) — no new ADR (a two-way-door refinement inside an accepted stage; recorded in CHANGELOG, not the register).
**Out of this pass (decided):** **F2** (durable gate mechanism — its own substrate pass, likely earns an ADR), **F4** (property-test emission — deferred), **F5** (auto-derive `equivalentLoggingLines` + raise floor — its own decision pass; it reverses the just-shipped two-tier survivor model and needs KB-schema + harness work).

## Context

The rerun validated the shipped Minimize stage (127→32 tests, identical kills) but surfaced its one over-reach: on the simplest class (zpl) Minimize removed an *empty-template* test and a *placeholder-absent → no-op* test — both **mutation-redundant** (killed no unique mutant) but each documenting a **real contract** (safe no-op on no-match). The generated 9-test suite became a **behavioural subset** of the human's 9-test suite. That is F1.

Why the existing safety net misses it: the post-floor **confirm re-gate** compares exact *kill counts* before/after removal. A behaviour-distinct-but-mutation-redundant test kills **no unique mutant by definition**, so dropping it leaves the kill count unchanged — the confirm passes. **The confirm is structurally blind to behaviour-coverage loss.** So the guard has to live *before* removal, at the categorical-classification layer — a **categorical-KEEP** list, the inverse of the four categorical-DEAD classes.

F3 is smaller: the adapter's Fixtures guidance ("build realistic models through real constructors") is a soft suggestion. On POG the rerun built real `dSdkRealogramModel`/`dSection` objects and caught an aggregation bug the pilot's mocked getter was blind to — but that improved *by luck, not by rule*. F3 hardens it: never mock a plain data model; mock only true I/O boundaries.

Both land in the **method + Dart adapter** (shipped) and the **reference harness** (dev-repo, keeps the operator-run path honest — the feedback's own scaling note says operators should prefer the harness scripts over re-authoring from prose).

## Scope

**In scope**
- F1: a **categorical-KEEP** list in the method's Minimize stage + the discriminator vs categorical-DROP #4 + a Minimize **activation gate** (only trim when generated materially exceeds the distinct-rule count) + the "confirm is blind to behaviour-coverage loss" rationale.
- F1 (harness): the minimize agent proposes a `categoricalKeep` flag; the orchestrator honors it **deterministically** (never removes a categorical-keep candidate) + the activation gate.
- F3: harden the adapter's Fixtures/Mocks guidance into a rule (never mock a plain data model; mock only I/O boundaries) + the Dart cue for a categorical-KEEP degenerate-input test.
- Contract-test slices + one PATCH bump per plugin.

**Out of scope**
- F2 / F4 / F5 (see header).
- A live end-to-end re-run on the pilot classes (maintainer validation; the contract suite is the gate).
- The two-tier survivor model (`equivalentLoggingLines` vs `expectedSurvivorLines`) — untouched here; F5 owns it.
- The omni twin regen — deferred to merge (`gen-omni.mjs` mirrors both SKILL.md; the harness is dev-only, not mirrored).

## Mechanism (resolves "what changes + where")

| Concern | Decision |
|---------|----------|
| **The F1 defect** | the removal decision collapses to one agent boolean — `toRemove = candidates.filter(c => !c.documentsDistinctRule)` (`loop-flutter.workflow.js:457`). A degenerate-input test that maps to the *same* ruleId as a broader test gets `documentsDistinctRule:false` and is dropped, even though it exercises a **distinct input scenario** (empty / no-match / zero-boundary → observable no-op). |
| **Why the confirm can't catch it** | the confirm re-gate (ADR-37) compares exact kill counts; a mutation-redundant test contributes **zero** unique kills, so its removal is invisible to the confirm. The guard must be a **pre-removal categorical rule**, not a post-removal count check. |
| **Categorical-KEEP (the fix)** | a test is a KEEP — never removed, even when mutation-redundant and same-ruleId — when it **constructs a degenerate/boundary input and asserts the observable safe/no-op result**: empty input, no-match, zero/empty-collection, or the documented failure-passthrough. This is the inverse of the four categorical-DEAD classes and sits alongside the existing `documentsDistinctRule` keep. |
| **Discriminator vs categorical-DROP #4** | categorical-DROP #4 removes a "boundary" test that **never actually constructs** the distinguishing input. Categorical-KEEP protects a degenerate test that **does** construct the edge and asserts the no-op. The single discriminator: *does the test construct the degenerate input AND assert the observable result?* Yes → KEEP; names a boundary but doesn't build it → still DROP #4. State this so the two rules don't collide. |
| **Deterministic honoring** | the orchestrator honors `categoricalKeep` the same way it honors `documentsDistinctRule` — a mechanical filter, not agent discretion: `toRemove = candidates.filter(c => !c.documentsDistinctRule && !c.categoricalKeep)`. (Allocation principle: the guard that must not decay lives in the orchestrator, not only the prompt.) |
| **Activation gate** | run Minimize only when the generated test count **exceeds the distinct mined-rule count by a non-zero margin**. Concrete sources — both already computed upstream, do NOT re-derive: rule count = `mineVerifyResult.consensusRules.length` (`loop-flutter.workflow.js:132`); generated total = `passed + failed + skipped` of `coverResult.gates.suite_green.detail.runs[0]` (`cover-flutter.workflow.js:57` — NOT `passed` alone: `suiteGreen()` tolerates skipped tests when `baselineSkips > 0`, so `passed` alone undercounts the true suite size). Skip when `generated <= distinctRules + margin` (default margin **1** — a non-degenerate band; NOT `> distinctRules`, which is margin 0 and never skips). At/near rule-count there is nothing safe to trim; a skip is logged **and reported** (see the Report-line skip form), never a silent no-op. **Do NOT source the rule count from the proposal `candidates`** — those are the *removed* tests only and don't exist until after the minimize agent runs. |
| **F3 fixture rule** | Cover constructs real domain models via the repo's `*_dummy.dart` factories (or real constructors); mocks **only** true I/O boundaries — repositories, plugin MethodChannels, other use-cases. **Never mock a plain data model** (mocking a data getter blinds the suite to aggregation/derivation bugs — the pilot POG gap). |

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | method SKILL.md: categorical-KEEP list, discriminator, activation gate, confirm-blind rationale | skill-doc edit |
| 2 | (none) | — | no | adapter SKILL.md: F3 fixture rule (never-mock-a-data-model), Dart cue for a categorical-KEEP test | skill-doc edit |
| 3 | (none) | — | yes | harness: minimize prompt + `categoricalKeep` flag + orchestrator honors it + activation gate | dev-harness reference impl |
| 4 | tdd | Follow | yes | contract-test slices for keep/discriminator/activation | |
| 5 | release-plugin | Follow | no | one PATCH bump for nexus + nexus-flutter; omni deferred | |

**TDD note:** Steps 1–2 are spec prose (no behavior to test). Step 3 (the harness change) is `TDD: yes`, paired with Step 4's contract slices against mocked minimize-agent proposals (the real proposal shape), not a live MVC run.

## Implementation Steps

### Step 1 — Method: categorical-KEEP + activation gate in the Minimize stage
**File:** `plugins/nexus/skills/mine-verify-cover/SKILL.md` (`## The Minimize stage` section)
**Skill:** None (skill-doc edit) · **TDD:** no · **Confidence:** high
**Satisfies:** feedback-F1 (categorical-KEEP, activation gate)

Refine the existing Minimize stage — do NOT restate it, add to it:
- **Categorical-KEEP paragraph** — introduce the inverse of the four categorical-DEAD classes: a **degenerate-input test that constructs the edge (empty / no-match / zero / empty-collection / documented failure-passthrough) AND asserts the observable safe/no-op result is KEPT**, even when mutation-redundant and filed under a shared ruleId. Give the rationale in one line: *the post-floor confirm compares kill counts, and a mutation-redundant behaviour test contributes zero unique kills — so its loss is invisible to the confirm; the categorical rule is the only guard.*
- **The discriminator vs categorical-DROP #4** — state the single test that separates KEEP from DROP #4: *does the test actually construct the distinguishing input and assert the result?* Constructs + asserts → KEEP; names a boundary but never builds it → DROP #4. Put this immediately after the categorical-KEEP paragraph so the two rules read as complementary, not contradictory.
- **Activation gate** — add to the stage's opening: Minimize runs only when the generated test count **materially exceeds** the distinct mined-rule count; at or near rule-count it is skipped (logged), since there is nothing safe to trim.
- **Deterministic honoring** — in the actor-split/removal description, state that the orchestrator honors a **categorical-keep** signal the same mechanical way it honors `documents-a-distinct-rule` (a filter, never derived) — the agent proposes, the orchestrator refuses removal.
- **Report-line skip form** — the method's Report-line spec (`## The Minimize stage`, the report-line paragraph) currently defines only `removed N …` and `held-back: confirm-regression`. Add a **third form** for an activation-gate skip — `minimized: skipped (at rule-floor) — generated N ≤ rules M + margin` — so a run where Minimize never executed is not rendered as "removed 0 tests / no redundant tests found" (that misreports a stage that never ran). Keep it one line, alongside the other two forms.

Reference the confirm, the anti-fake-green invariant, and the categorical-DEAD classes **by name** — no restated prose, no `:NN` line citations (the skill's own line-numbers-rot rule).

**Acceptance (mechanism, not surface):**
- `## The Minimize stage` contains a categorical-KEEP paragraph naming the degenerate-input classes and the "confirm is blind to behaviour-coverage loss" rationale; the discriminator-vs-DROP-#4 sentence is present and adjacent.
- The activation-gate sentence is present and names the non-zero-margin skip (not the degenerate `> distinctRules`).
- The Report-line paragraph carries the third `skipped (at rule-floor)` form alongside `removed N` and `held-back`.
- The removal description states the orchestrator honors the categorical-keep signal mechanically (agent proposes, orchestrator refuses removal).
- `grep -n ':[0-9][0-9]' ` introduces no new line-number citations in the edited section; classify-survivors / confirm referenced by name.
- `node --test tests/lint/*.test.mjs` green.

### Step 2 — Adapter: F3 fixture rule + Dart cue for categorical-KEEP
**File:** `plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md`
**Skill:** None (skill-doc edit) · **TDD:** no · **Confidence:** high
**Satisfies:** feedback-F3 (fixture rule), feedback-F1 (Dart cue)

Two additive edits:
- **F3 — harden the Fixtures/Mocks guidance into a rule** (Test-style section, the "Fixtures" and "Mocks" bullets): construct real domain models via the repo's `*_dummy.dart` factories (or real constructors when no dummy exists); **mock ONLY true I/O boundaries — repositories, plugin MethodChannels, other use-cases — and never mock a plain data model.** State the one-line why: *a mocked data getter blinds the suite to aggregation/derivation bugs* (the pilot POG `SdkRealogramModel` gap the rerun closed with real objects). Keep it a rule, not a suggestion.
- **F1 — Dart cue for a categorical-KEEP test** (Minimize-stage Dart-fill section): give the Dart shape of a degenerate-input keeper — e.g. empty template string, absent-placeholder input, empty list — that returns/asserts the unchanged/no-op result. One line, mirroring how the adapter already gives Dart cues for the survivor tags.

**Acceptance:** the Fixtures/Mocks text states the never-mock-a-data-model rule + the I/O-boundary carve-out with the one-line why; the Minimize-fill section carries a Dart categorical-KEEP cue. `node --test tests/lint/*.test.mjs` green.

### Step 3 — Reference harness: honor categorical-KEEP + activation gate
**File:** `harness/loop-flutter.workflow.js` (minimize agent prompt `~:295-307`; orchestrator decision `~:457`; the phase gate `~:439`)
**Skill:** None (dev-harness reference impl; not shipped) · **TDD:** yes (paired with Step 4) · **Confidence:** medium
**Satisfies:** feedback-F1 (categorical-KEEP honored, activation gate)

Mirror the shipped Minimize wiring — read `loop-flutter.workflow.js:295-307` (the current minimize prompt) and `:457` (the current decision) first.
- **Minimize agent prompt** — add the **categorical-KEEP** class + the discriminator vs the existing categorical-DROP #4; extend the returned per-candidate shape with `categoricalKeep: bool` (alongside `documentsDistinctRule`, `ruleId`, `subsumedBy`, `killsMutants`).
- **Orchestrator decision (`:457`)** — extend the mechanical filter to honor the new flag: `toRemove = candidates.filter(c => !c.documentsDistinctRule && !c.categoricalKeep)`. The orchestrator derives nothing — it only reads the two agent booleans.
- **Activation gate** — compute, **before** the minimize `agent()` call (`~:451`), `distinctRules = mineVerifyResult.consensusRules.length` (`:132`) and `generated = coverResult.gates.suite_green.detail.runs[0].passed` (`cover-flutter.workflow.js:57`); when `generated <= distinctRules + margin` (default margin **1**, tunable — document the value in implementation.md), skip Minimize entirely — **do not spawn the minimize agent** — set `result.minimize = { skipped: 'at-rule-floor', generated, distinctRules }` and `log()` the skip. Do NOT compute the rule count from the proposal `candidates` (those are the removed tests only, and don't exist until after the agent call — HIGH-1).
- **Render the skip** — add a `skipped` branch to the report renderer (`loop-flutter.workflow.js:642-648`, which today branches only `!minimize / heldBack / removed>0 / else`). A `{ skipped }` object must render the Step-1 skip form, NOT fall through to the `else` that prints "removed 0 tests — no redundant tests found" (a false statement for a skipped run — MED-2).
- Leave the confirm re-gate path untouched — categorical-KEEP works *before* it, and the confirm still guards the kill-count on whatever is removed.

**Acceptance (mechanism):**
- A candidate with `categoricalKeep:true` is **never** in `toRemove`, even when `documentsDistinctRule:false` and `subsumedBy` is non-empty (Step 4a).
- When `generated <= consensusRules.length + margin`, the minimize agent is **not** spawned, `result.minimize.skipped === 'at-rule-floor'`, and the renderer prints the skip form (not "removed 0 tests") — Step 4b.
- The orchestrator performs no filesystem I/O; `meta` a pure literal; no `Date`/`Math.random`. Workflow validates against the offline mock-globals guard.
- `node --check harness/loop-flutter.workflow.js` clean.

### Step 4 — Contract tests for keep / discriminator / activation
**File:** `tests/unit/workflow-contract.test.mjs`
**Skill:** tdd · **TDD:** yes · **Confidence:** high
**Satisfies:** feedback-F1

Follow `tdd`. Fixtures mock the **minimize agent's proposal** (the real `{ testName, killsMutants, subsumedBy, documentsDistinctRule, categoricalKeep, ruleId }` shape) — do not invent a per-test kill-map. Slices:
- **(a) categorical-KEEP honored (load-bearing):** a candidate with `categoricalKeep:true`, `documentsDistinctRule:false`, non-empty `subsumedBy` → assert it is **not** in `toRemove` and survives the trim. This is the direct F1 regression guard (the zpl empty-template case).
- **(b) activation gate:** the canonical `minimizeCoverResult` fixture sets `suite_green: { pass: true, detail: {} }` (`workflow-contract.test.mjs:1093`) — **empty detail, no `runs`** — so this slice MUST extend the fixture to populate `suite_green.detail.runs[0].passed` and set `mineVerifyResult.consensusRules` so that `generated <= consensusRules.length + margin`. Then assert: the minimize agent is not invoked, `result.minimize.skipped === 'at-rule-floor'`, zero removals, **and the rendered report line is the skip form** (not "removed 0 tests"). Without the fixture extension the skip path is untested — call it out.
- **(c) discriminator:** two candidates both `documentsDistinctRule:false` — one `categoricalKeep:true` (constructs the degenerate input), one categorical-DROP #4 (`categoricalKeep:false`, fake boundary) → the keep survives, the DROP-#4 is removed. Proves the two rules coexist without collision.
- **(d) no-regression on the happy path:** an ordinary mutation-redundant, non-keep, non-distinct-rule candidate is still removed and the confirm path still runs (categorical-KEEP did not disable ordinary trimming).
- Scope the gate to the changed file: `node --test tests/unit/workflow-contract.test.mjs`; flag any pre-existing unrelated failures as out of scope, introduce none.

**Acceptance:** all four slices green; (a) asserts the keep survives, (c) asserts keep-survives + DROP-#4-removed in one proposal; `workflow-contract.test.mjs` fully green.

### Step 5 — Version bump (once) + omni note
**Files:** `plugins/nexus/.claude-plugin/plugin.json` + `CHANGELOG.md`, `plugins/nexus-flutter/.claude-plugin/plugin.json` + `CHANGELOG.md` (via the tool)
**Skill:** release-plugin · **TDD:** no · **Confidence:** high

Follow `release-plugin` (or `node scripts/bump-plugin.mjs --dry-run` then `node scripts/bump-plugin.mjs`) **once, after Steps 1–4 land**. Both plugins **PATCH** (default — categorical-KEEP + the fixture rule are additive refinements; the owner did not escalate). At plan time committed HEAD is **nexus 1.18.9 / nexus-flutter 0.2.0**, tree clean (no concurrent bump), but re-check `git branch`/`git log` immediately before the bump (recheck-branch discipline) and bump from the then-committed HEAD. The nexus edit (Step 1) forces the nexus bump; the adapter edit (Step 2) forces the nexus-flutter bump; the harness + tests are dev-only and force neither.

**Acceptance:** `node scripts/bump-plugin.mjs --check` passes (both plugins bumped, CHANGELOG entries present naming F1 + F3). Committed in the same commit as the SKILL.md edits (team lead). Omni twin regen deferred to merge.

## Cross-Service Changes
None. Skill-doc + dev-harness change.

## Migration Notes
None.

## Testing Strategy
Step 4's contract slices against mocked minimize-agent proposals (the real shape) are the gate — deterministic, no live MVC run. Load-bearing slices: **(a)** categorical-KEEP survives a subsumed/non-distinct-rule candidate (the F1 regression), and **(c)** the discriminator keeps a real degenerate test while still dropping a fake-boundary #4 in the same proposal. A live re-run on the zpl class is the maintainer's optional end-to-end check.

## KB Impact
None. The change alters which generated tests survive Minimize; no `docs/kb/` rule-ledger entry changes (the KB `mutation-gated` status is unaffected — the gate still passes).

## Open Questions
None blocking. Two properties the reviewer should know (both by-design, not defects):
- **Agent-judgment dependency.** "Deterministic honoring" is only the orchestrator's mechanical filter; the *value* of `categoricalKeep` is still the minimize agent's classification — same reliability profile as `documentsDistinctRule`. The fix's real-world reach equals the agent's ability to recognize a degenerate-input keeper.
- **Minor over-retention (accepted).** categorical-KEEP keeps a degenerate test even when mutation-redundant and same-ruleId, so two *true-duplicate* degenerate tests (identical input + assertion) would both survive. Tolerable — the stage targets rule-traceable, not mutation-minimal — but noted so the developer doesn't treat it as a bug.
- The activation-gate margin (default 1) is a documented developer choice (Step 3), not a blocker.

## Plan Review
**Mode (owner-selected):** code-grounded critic (Mode 2) — mandatory for this pass: it edits shipped skill prose **and** the dev-repo harness, and F1's correctness is a behaviour-coverage property provable only by reading the live `loop-flutter.workflow.js` decision at `:457` against the categorical rule. A doc-only critic is structurally blind here.

**Result: REVISE — 1 HIGH + 2 MEDIUM, all on the *activation gate* (the secondary F1 guard). The load-bearing fix (categorical-KEEP honored by the orchestrator filter) confirmed sound and code-grounded (`loop-flutter.workflow.js:457`); F3 confirmed consistent with the adapter's existing Mocks/Fixtures guidance. All three folded (rev 1 → this revision):**

| Finding | Severity | Disposition |
|---|---|---|
| Activation gate's data sources contradictory + not computable at the specified point (counted distinct `ruleId`s among the *proposal* `candidates` = removed tests, which don't exist pre-proposal) | HIGH | **Fixed.** Mechanism row + Step 3 now name concrete sources — `distinctRules = mineVerifyResult.consensusRules.length` (`:132`), `generated = coverResult.gates.suite_green.detail.runs[0].passed` (`cover-flutter.workflow.js:57`) — computed **before** the agent call; explicit "do NOT source from `candidates`". |
| "Materially exceeds" undefined; the example `> distinctRules` is margin-0 and never skips | MEDIUM | **Fixed.** Skip when `generated <= distinctRules + margin`, default margin **1** (non-degenerate); margin-0 example removed. |
| Activation-gate SKIP state not wired to either report renderer or the method Report-line spec → a skipped run renders as "removed 0 tests / no redundant tests found" (false) | MEDIUM | **Fixed.** Step 1 adds a third `skipped (at rule-floor)` Report-line form; Step 3 adds a `skipped` branch to the renderer (`:642-648`); Step 4b asserts the rendered line + extends the `minimizeCoverResult` fixture to populate `suite_green.detail.runs` (the empty-`detail` gap the critic flagged). |

Two non-blocking Open Questions (agent-judgment dependency, minor over-retention) recorded above for the reviewer. Every finding was code-grounded (critic cited `mine-verify-cover/SKILL.md:73-80`, `loop-flutter.workflow.js:132/457/642-648`, `cover-flutter.workflow.js:57`, `workflow-contract.test.mjs:1093/1142`). Revision closes all three; the primary F1 fix needed no change.
