# Implementation Plan — adhoc-MvcCoverMinimize (rev 2)

**Feature Spec:** None (ad-hoc technical pass; binding definition is **ADR-37**, `docs/architecture/README.md`)
**Intent:** Scoped (method skill + adapter skill + dev-harness reference impl + contract tests).
**Status:** Ready
**Binding input:** ADR-37 — "MVC trims redundant tests: a post-floor Minimize stage + a Cover generation guard, optimizing for rule-traceability." Owner-ratified 2026-06-30. Grounded in a 3-suite pilot on `D:\omnishelf\omnishelf_flutter_app` (BuildZpl 15/45 dead, CycleCount 7–8/57, POG 2/25).
**Revision:** rev 2 folds two converging NO-GO reviews (`review-critic.md` HIGH-1 + MEDIUM-1/2/3; `review-codex.md` CRITICAL + HIGH-2/-3). Both landed on the same seam: the confirm + the test-file edits are **I/O the orchestrator cannot do** (it has no filesystem). The crux they crystallized — per-test attribution is fallible agent *reasoning* that no tool can verify (the harness produces no per-test kill-map), so the confirm re-gate is the **only** safety net; it must be a real **agent-run** re-mutation, compared on **exact** killed-count, with restore-on-any-drop. Steps 3–4 are redesigned accordingly; ADR-37's confirm bullet amended (full re-gate is the sound default).

## Context

The Cover→Gate loop only ratchets *up* — each iteration adds tests to kill surviving mutants; nothing trims. On three live Dart suites 8–33% of generated tests killed **no new mutant** (worst on the simplest class). ADR-37 adds a post-floor **Minimize stage** (the dual of classify-survivors) plus a **Cover generation guard**, optimizing the suite toward **rule-traceability** (keep one test per *distinct verified rule*, drop only true-dups + categorically-dead). The shipped deliverable is the method spec (`mine-verify-cover/SKILL.md`); the reference harness demonstrates it and the contract suite gates it.

This change lives in the **stack-neutral method** so the .NET and C++ adapters inherit it; the Flutter adapter supplies only the Dart-specific signals it already has (the log-line set; `mutation_test` for the confirm re-gate).

## Dependencies & current state

- Versions: **nexus 1.18.7**, **nexus-flutter 0.1.2**. One PATCH bump each after all edits land (Step 5) — never per-step (CLAUDE.md release rule).
- The Minimize stage is the architectural **dual of the existing classify-survivors stage** (ADR shipped in `adhoc-MvcSurvivorReport`, `mine-verify-cover/SKILL.md` "The Report stage — survivor classification"). Read that section first — the minimize agent reuses its actor split (an agent reasons over source; the orchestrator records/acts, never derives).
- Reference-impl seams to read before Step 3: the loop in `harness/cover-flutter.workflow.js` (`phase('Cover')`/`phase('Run')`/`phase('Gate')`, ~lines 408–423) and the Report/classify wiring in `harness/loop-flutter.workflow.js`.

## Mechanism (resolves the "where + how" of ADR-37)

| Concern | Decision |
|---------|----------|
| **Who attributes redundancy** | a **minimize agent** (source + suite + the final-iteration survivor list, model: sonnet) reconstructs, **by reasoning**, which mutant(s) each test kills and proposes removals. The attribution is **fallible reasoning that no tool can verify** — `mutation_test` reports only aggregate survivors, never which *test* killed which mutant — so the proposal is a hypothesis the confirm must test, not a trusted fact. |
| **Removal rule (rule-traceable)** | propose removing test T **only if** every mutant T is reasoned to kill is also killed by a **retained** test **AND** T documents no *distinct* verified rule — i.e. T is one of the four **categorical-dead classes**: (1) log-only, (2) occurrence-count escalation, (3) same-call-same-assertion under two rule labels, (4) "boundary" test that never constructs the distinguishing input. A test that uniquely documents a distinct verified rule is **kept** even if mutation-redundant. |
| **Actor split / I/O ownership** | the **orchestrator has no filesystem** (`mine-verify-cover/SKILL.md:30`) — it only routes proposals and makes pure decisions. Every I/O step is an **agent**: the minimize agent reads/reasons; a **write-owning agent** edits the test file (remove, and restore on regression); the **runner agent** re-runs the gate. Mirrors classify-survivors exactly (agent judges, orchestrator records). |
| **Fail-closed confirm (the only enforcement)** | because attribution is unverifiable reasoning, the confirm is the sole safety net. After the write-agent removes the proposed tests, the **runner agent re-runs the full gate on the reduced suite** (a real re-mutation, producing a fresh `mutationSummary`); the orchestrator compares the **exact reachable killed-count** (not the rounded `scorePct` — a one-mutant drop on a large denominator rounds away) to the pre-minimize count. Any drop → instruct the write-agent to **restore** all removed tests; report `held-back: confirm-regression`. Full re-gate is the **sound default** (it inherits the gate's anti-fake-green guards and catches attribution errors beyond the at-risk lines); targeted at-risk-line re-mutation is an optional optimization only where the mutation tool supports line-scoping. |
| **Generation guard** | the Cover prompt forbids emitting categorically-dead tests up front: no log-output assertions (the adapter's existing policy) and one representative per mutation-equivalence class. Prompt-level volume reduction — **not** the enforcement (the confirm is). |
| **Report** | emit `minimized: removed N tests, reachable kill X%→X% (confirmed unchanged)` every run; never a silent trim. |

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | method SKILL.md: Minimize stage spec, generation guard, report line | skill-doc edit |
| 2 | (none) | — | no | adapter SKILL.md: Dart fill (log-line set, confirm re-gate) | skill-doc edit |
| 3 | (none) | — | yes | harness: minimize agent + orchestrator apply + confirm re-gate + restore | dev-harness reference impl |
| 4 | tdd | Follow | yes | contract-test slices for the minimize logic | |
| 5 | release-plugin | Follow | no | one PATCH bump for nexus + nexus-flutter; omni note | |

**TDD note:** Steps 1–2 are spec prose (no behavior to test). Step 3 (the minimize mechanism) is `TDD: yes`, paired with Step 4's contract tests — the harness logic is exercised by mocked runner `mutationSummary` fixtures (the real output shape), not a live MVC run.

## Implementation Steps

### Step 1 — Method: the Minimize stage spec + generation guard + report line
**File:** `plugins/nexus/skills/mine-verify-cover/SKILL.md`
**Skill:** None (skill-doc edit) · **TDD:** no · **Confidence:** high
**Satisfies:** ADR-37 Minimize-stage, rule-traceable-target, generation-guard, base-method-home, report-line

Add the Minimize stage to the **stack-neutral method**, written as the **dual of classify-survivors** (do NOT restate that stage — reference it):
- **Pipeline row:** insert `Minimize` into the `## The pipeline` block between `Gate` (floor reached) and `Report` — "a minimize agent attributes each test to the mutant(s) it kills (by reasoning, no re-runs) and proposes removals; the orchestrator applies them and confirms."
- **A `## The Minimize stage` section** specifying: (a) the **minimize agent** reads source + suite + the final-iteration survivor list and proposes removals by **reasoning** about which mutant each test kills — no per-test mutation re-runs, and the proposal is an explicit hypothesis (no tool can verify per-test attribution); mirror the classify-survivors actor split (agent proposes, orchestrator records/routes, **never derives**); (b) the **rule-traceable removal rule** from the Mechanism table — propose removing T only if every mutant it is reasoned to kill is also killed by a retained test AND T documents no distinct verified rule; keep a test that uniquely documents a distinct verified rule even if mutation-redundant; (c) the four categorical-dead classes — (1) log-only, (2) occurrence-count escalation, (3) same-call-same-assertion under two rule labels, (4) boundary-test-with-no-distinguishing-input — as always-removable; (d) the **actor split / I/O ownership** — the orchestrator has no filesystem, so a write-owning agent edits the test file and the runner agent re-runs the gate; (e) the **fail-closed confirm** — the runner agent re-runs the full gate on the reduced suite, the orchestrator compares **exact reachable killed-count** to the pre-minimize count, any drop → **restore**. Call this the **anti-fake-green invariant applied to test removal**, and note it is the **mutation ratchet** (a kill-rate regression → halt) in a new place — reference both **by name**, do not restate them and do not cite line numbers (the skill's own rule: line numbers rot).
- **Generation guard** — in the Cover-stage description and `## Safety rails`, add: the Cover agent must not emit categorically-dead tests (no log-output assertions; one representative per mutation-equivalence class). State explicitly this is **volume reduction, not enforcement** — the Minimize pass + confirm is the enforcement. (This applies the nexus plan-grounding principle "a prompt instruction is a request, not an enforcement" — ADR-37; the principle is not yet stated in this skill, so phrase it directly rather than citing the skill for it.)
- **Report line** — the Report stage emits `minimized: removed N tests, reachable kill X%→X% (confirmed unchanged)` every run; a held-back minimize (confirm regressed) reports `held-back: confirm-regression` with the restored count. No silent trim.

**Acceptance (mechanism, not surface):**
- `grep -n "^Minimize" mine-verify-cover/SKILL.md` hits the pipeline row; `## The Minimize stage` section exists and names the agent/write-agent/runner/orchestrator split, the rule-traceable removal rule, the 4 categorical classes, the I/O-ownership note, and the confirm (exact-count re-gate) + restore rule.
- The section refers to the classify-survivors stage, the anti-fake-green invariant, and the mutation ratchet **by name** (grep: no duplicated invariant prose; no `:NN` line citations introduced).
- The Cover/Safety-rails guard text is present and labels itself non-enforcing.
- `node --test tests/lint/*.test.mjs` green (frontmatter + dangling-ref lint).

### Step 2 — Adapter: Dart fill for the guard signal + the confirm re-gate
**File:** `plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md`
**Skill:** None (skill-doc edit) · **TDD:** no · **Confidence:** high
**Satisfies:** ADR-37 generation-guard, fail-closed-confirm

Tie the method's Minimize stage to the Dart toolchain the adapter already provides — additive, mostly pointers (the adapter already supplies what's needed):
- **Generation guard signal:** note that the guard's "no log-output assertions" reuses the adapter's existing test-style rule (line 108) and the `equivalentLoggingLines` set the adapter already surfaces — the Cover agent already has the signal; this just names its second use (suppress emission, not only pre-tag survivors).
- **Confirm re-gate:** the minimize confirm re-uses the adapter's existing `mutation_test` run (the "The mutation_test run" section) on the **reduced** test file — no new capability. State the cost honestly (each mutant re-runs the whole suite; the confirm is one extra pass, made cheaper by the smaller post-minimize suite). If `mutation_test` line-scoping is available, the targeted at-risk-line confirm is an optional optimization; otherwise the full re-gate is the path — **developer verifies whether `mutation_test` config supports line-range scoping and documents the answer in implementation.md** (operator-owed fact, not a blocker).

**Acceptance:** adapter names the guard's reuse of the log-line signal and the confirm's reuse of the `mutation_test` run; the line-scoping question is resolved in implementation.md (supported → optional optimization documented; not supported → full re-gate is the path). `tests/lint` green.

### Step 3 — Reference harness: implement the Minimize stage
**Files:** `harness/loop-flutter.workflow.js` (minimize agent spawn + orchestrator decision + report) · `harness/cover-flutter.workflow.js` (reuse the existing runner-agent re-gate path + the exact-count fields)
**Skill:** None (dev-harness reference impl) · **TDD:** yes (paired with Step 4) · **Confidence:** medium
**Satisfies:** ADR-37 Minimize-stage, fail-closed-confirm

Demonstrate the spec in the reference Workflow (dev-repo reference impl; not shipped — same status as the survivor-classification harness work in `adhoc-MvcSurvivorReport`). **Read the live classify-survivors wiring first** (`loop-flutter.workflow.js:175,277`) — it is the exact actor-split precedent to copy. The hard constraint resolved by both reviews: **the orchestrator has no filesystem** (`mine-verify-cover/SKILL.md:30`), so every I/O step is an agent and the orchestrator only routes + decides.

- **Minimize agent (source-aware, sonnet):** after the loop reaches the floor and before Report, spawn ONE agent that receives the final test file + target source + the final-iteration survivor list and returns a structured removal **proposal** (reasoning only): per candidate `{ testName, killsMutants:[...], subsumedBy:[retainedTestName...], documentsDistinctRule: bool, ruleId }`. This is a hypothesis — no per-test kill-map exists to verify it.
- **Write-owning agent applies the removal:** the orchestrator hands the proposal to a write agent that edits the test file to remove the proposed tests (mirror the file-writing agents at `cover-flutter.workflow.js:320,335`). The orchestrator itself writes nothing.
- **Runner agent re-runs the FULL gate on the reduced suite:** a second `phase('Run')` through the existing runner path (`cover-flutter.workflow.js:413`) produces a **fresh** `mutationSummary` for the reduced file. This is the real re-mutation — never a recompute over the stale pre-minimize numbers (that was the rev-1 fake-green defect).
- **Orchestrator decision (pure) on EXACT counts:** compare `killed_after` to `killed_before` using the **exact reachable killed-count** (`reachable = found − notCovered`, `killed = reachable − undetected` — `cover-flutter.workflow.js:120-125`), **never** the rounded `scorePct` (a one-mutant drop on a large denominator rounds away — Codex HIGH-3). `killed_after === killed_before` → accept the trim; `killed_after < killed_before` → instruct the write-agent to **restore all** removed tests and set `result.minimize = { heldBack: 'confirm-regression', restored: N, killedBefore, killedAfter }`. v1 removes the whole proposed batch and restores all-or-nothing on regression (bisecting which removal was bad is a future optimization — `log()` the held-back batch, never silently keep a partial trim).
- **Restore-on-regression is a hard branch**, modeled on the real ratchet HALT at `cover-flutter.workflow.js:440-445` (`const ratchet = mutationRatchet(…); if (!ratchet.pass){ … break }`) — not advisory.
- **Report emission:** add `minimized: removed N tests, reachable kill X%→X% (confirmed unchanged)` (or the `held-back: confirm-regression` form) to the loop-flutter operator report.

**Acceptance (mechanism):**
- The minimize agent is the only source-reader; the write-agent is the only test-file editor; the orchestrator performs **no** filesystem I/O (grep the new code: no `fs`/file writes in orchestrator scope; meta a pure literal; no `Date`/`Math.random`).
- The confirm consumes a **fresh** post-removal `mutationSummary` from a second runner call — distinct from the pre-minimize map. (Acceptance test in Step 4c asserts a second runner invocation occurred and its result drove the decision.)
- The compare uses exact `killed` counts, not `scorePct`.
- On a fixture where a removed test was the **sole** killer of a mutant, the fresh re-gate shows `killed_after < killed_before` and the suite is **restored** with `held-back: confirm-regression`.
- Workflow validates against the offline mock-globals guard.

### Step 4 — Contract tests for the minimize logic
**File:** `tests/unit/workflow-contract.test.mjs`
**Skill:** tdd · **TDD:** yes · **Confidence:** high
**Satisfies:** ADR-37 fail-closed-confirm, rule-traceable-target

Follow `tdd`. **Fixtures mock the runner `agent()` return — a `mutationSummary` `{ found, undetected, timeouts, notCovered }` (the real output shape, `cover-flutter.workflow.js:265`) — NOT an invented per-test kill-map** (Codex CRITICAL: a per-test map the harness never produces makes the test vacuous). The confirm is driven by mocking the **second** (post-removal) runner call to return a different summary. Add slices:
- **(a) accept on no regression:** removal proposal applied; the mocked post-removal re-gate returns the **same** `killed` count → orchestrator accepts; report shows `confirmed unchanged`.
- **(b) rule-traceable keep:** a proposal that flags a test as `documentsDistinctRule: true` is **not** removed even when `subsumedBy` is non-empty — the rule-traceable boundary (asserts the orchestrator honors the agent's distinct-rule flag, never overrides it).
- **(c) confirm regression → restore (load-bearing):** mock the post-removal runner call to return a summary with `undetected` **one higher** (a previously-killed mutant now survives) → orchestrator computes `killed_after < killed_before` on **exact counts**, instructs restore, emits `held-back: confirm-regression`. **Assert a second runner invocation occurred** and its result (not the pre-minimize map) drove the decision — this is what proves the confirm is a real re-gate, not a vacuous recompute.
- **(d) rounding guard:** a large-denominator fixture where one mutant drops but the rounded `scorePct` is unchanged (e.g. 199/200 → 198/200, both round to 99%) → the **exact-count** compare still fires restore. Proves Codex HIGH-3 is closed.
- **(e) report line:** the operator report carries `minimized: removed N tests … (confirmed unchanged)` on the happy path.
- Keep the green gate scoped to the changed file: `node --test tests/unit/workflow-contract.test.mjs`; note any pre-existing unrelated full-suite failures as out of scope (do not introduce new ones).

**Acceptance:** all five slices green; slice (c) asserts the second runner call + exact-count restore; slice (d) asserts rounding does not mask a drop; `workflow-contract.test.mjs` fully green.

### Step 5 — Version bump (once) + omni note
**Files:** `plugins/nexus/.claude-plugin/plugin.json` + `CHANGELOG.md`, `plugins/nexus-flutter/.claude-plugin/plugin.json` + `CHANGELOG.md` (via the tool)
**Skill:** release-plugin · **TDD:** no · **Confidence:** high

Follow `release-plugin` (or `node scripts/bump-plugin.mjs --dry-run` then `node scripts/bump-plugin.mjs`) **once, after Steps 1–4 land**, both plugins PATCH (default — a Minimize stage is additive but the owner did not escalate to MINOR).

**Concurrency hazard (MEDIUM-3 — do NOT hard-code the target version).** At plan time, committed `HEAD` is **nexus 1.18.6 / nexus-flutter 0.1.2**, but the working tree carries an **uncommitted 1.18.7 bump from a concurrent feature** (dirty `agents/`, `hooks/`, `resolve-role.js` — none of MvcCoverMinimize's files). `bump-plugin.mjs` classifies the **whole tree**, so a naive run here would bundle the foreign feature into this CHANGELOG or ride within its phantom 1.18.7. Therefore:
- Bump from **committed HEAD at implementation time** (which may have advanced past 1.18.6 by then), not from the dirty working-tree version. Apply the **recheck-branch-under-concurrent-run** discipline: re-check `git branch`/`git log` immediately before the bump and the commit.
- **Scope staging to this feature's files only** (the two SKILL.md edits, the plan/ADR/review docs, the harness + tests) so the concurrent feature's changes are not swept into this commit.
- The harness + tests are dev-only and do not force a bump — the two SKILL.md edits do.

**Acceptance:** `node scripts/bump-plugin.mjs --check` passes (both plugins bumped from the then-committed HEAD, CHANGELOG entries present, scoped to this feature); committed in the same commit as the SKILL.md edits (team lead). The omni twin regen (`gen-omni.mjs` mirrors both SKILL.md; the harness is not mirrored) is **deferred to merge** per the sibling pass.

## Cross-Service Changes

None. Pure skill-doc + dev-harness change.

## Migration Notes

None.

## Testing Strategy

The minimize mechanism is gated by Step 4's contract slices against **mocked runner `mutationSummary` fixtures** (the real output shape, not an invented per-test kill-map) — the cheap, deterministic path (a live MVC run is the maintainer's optional end-to-end check, not a CI gate). The load-bearing tests are **(c)** — a post-removal re-gate that drops one mutant must trip restore, *and* the test asserts a real second runner call drove it (proving the confirm is not vacuous) — and **(d)** — the exact-count compare catches a drop the rounded `scorePct` would hide. Together they prove the fail-closed enforcement, not just the happy path.

## KB Impact

None. The minimize pass changes the **test suite**, not the per-class rule ledger; the KB entry's `mutation-gated` status is unaffected (the gate still passes after minimize). No `docs/kb/` entry needs updating.

## Open Questions

None. ADR-37 ratified; the one operator-owed fact (whether `mutation_test` supports line-range scoping for the optional targeted confirm) is resolved by the developer in Step 2 and does not block — the full re-gate is the sound default either way.

## Plan Review

**Mode (owner-selected):** code-grounded critic + Codex cross-check (rev 1). Both NO-GO; full findings in `review-critic.md` and `review-codex.md`. Dispositions folded into rev 2:

| Finding | Severity | Disposition in rev 2 |
|---|---|---|
| Codex CRITICAL — slice-c vacuous (no per-test kill-map in harness) | CRITICAL | **Fixed.** Confirm uses aggregate `mutationSummary`; attribution is acknowledged fallible reasoning; slice-c mocks the real post-removal re-gate (Step 4c). |
| Critic HIGH-1 / Codex HIGH-2 — confirm + writes are I/O, orchestrator has no filesystem | HIGH | **Fixed.** Step 3 redesigned: minimize agent reasons, write-agent edits, runner re-runs, orchestrator only decides (Mechanism table "Actor split"). |
| Codex HIGH-3 — rounded `scorePct` masks a one-mutant drop | HIGH | **Fixed.** Confirm compares exact `killed` count; slice (d) guards it. |
| Critic MEDIUM-1 — wrong harness citation (`:379-384`) | MEDIUM | **Fixed.** Now cites the real ratchet branch `:440-445`. |
| Critic MEDIUM-2 — fragile `:52` line-ref | MEDIUM | **Fixed.** Referenced by name; no `:NN` citations introduced. |
| Critic MEDIUM-3 — version baseline is a concurrent feature's uncommitted bump | MEDIUM | **Fixed.** Step 5 bumps from committed HEAD, scopes staging, recheck-branch safeguard. |
| Critic L1 / Codex L4 — confirm primary/fallback inverted vs ADR-37 | LOW | **Fixed.** Reconciled to full-re-gate-primary (safer; inherits anti-fake-green guards); **ADR-37 confirm bullet amended** to match. |
| Critic L2 — categorical-class list mismatch | LOW | **Fixed.** Four classes listed consistently. |
| Critic L3 — "prompt is a request" misattributed to the skill | LOW | **Fixed.** Phrased directly; attributed to the nexus principle / ADR-37, not the skill. |

**Re-review recommendation:** a **focused code-grounded re-review of Steps 3–4 only** (the redesigned surfaces) before approval — the critic conditioned its GO on resolving HIGH-1, and the I/O-ownership restructure is the load-bearing change. The doc/version steps (1, 2, 5) are low-risk and need no second pass. Confidence: **high** that rev 2 closes every finding; the re-review confirms the agent/write/runner split is wired as described against live `loop-flutter.workflow.js`.

## Out of scope

- The omni twin regen — deferred to merge (`gen-omni.mjs` mirrors both SKILL.md; harness is dev-only, not mirrored).
- Live end-to-end re-run on the three pilot classes — a maintainer validation, not part of this pass (the contract suite is the gate).
- Multi-class / cross-suite minimize — single-class only, consistent with the method's single-class scope.
- A mutation-minimal suite target — rejected by ADR-37.
