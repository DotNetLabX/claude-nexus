# adhoc-MvcCoverMinimize — Implementation

Adds the Minimize stage (ADR-37) to the stack-neutral `mine-verify-cover` method: a post-floor pass that
trims mutation-redundant, categorically-dead tests while keeping every test that documents a distinct
verified rule — enforced by a fail-closed confirm re-gate, never by trusting the attribution. Executes
plan Steps 1–4 (`docs/specs/adhoc-MvcCoverMinimize/delivery/plan.md`, rev 2). Step 5 (version bump) and
commit are explicitly held back for the team lead per the task assignment.

## Files Created
- `docs/kb/research/mutation-test-dart-line-range-scoping.md` — research-pool entry (via the `research`
  skill) resolving Step 2's operator-owed fact: does `mutation_test` support line-range scoping? **Yes** —
  a `<lines begin="N" end="M"/>` child element nested inside `<file>`, confirmed against the package's own
  README and shipped `example/config.xml` (cite-check validated, single-source/low-stakes per schema).

## Files Modified
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — **Step 1.** Inserted a `Minimize` row into `## The
  pipeline` between `Gate` and `Report`, and a short non-restating guard clause into the `Cover` row.
  Added a new `## The Minimize stage` section (placed between the gate-battery section and `## The Report
  stage — survivor classification`, matching pipeline order) covering: who attributes redundancy (the
  minimize agent, by reasoning — an explicit hypothesis, mirroring the classify-survivors actor split);
  the rule-traceable removal rule; the four categorical-dead classes; actor split / I/O ownership
  (minimize agent reads, write-owning agent edits, runner agent re-gates, orchestrator only routes +
  decides); the fail-closed confirm (exact reachable killed-count compare, restore on any drop) named as
  the anti-fake-green invariant applied to test removal / the mutation ratchet post-floor — referenced by
  name only, no restated definitions, no `:NN` line citations (critic MEDIUM-2). Added a `## Safety rails`
  bullet for the generation guard, phrasing "a prompt instruction is a request, not a guarantee" directly
  in the skill's own words (per Step 1's instruction — not citing the skill for a principle it didn't yet
  state; also closes the sibling feature's outstanding improvement proposal in `lessons.md`).
- `plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md` — **Step 2.** Added a `## Minimize
  stage — Dart fill` section (between `## Test style` and `## Cost / scaling note`) naming the generation
  guard's reuse of the existing no-log-output test-style rule + the `equivalentLoggingLines` signal (a
  second use), and the confirm's reuse of the existing `mutation_test` run (same config shape, same
  stdout-summary parse) with an honest cost statement. Resolves the line-scoping question: **supported**
  (cites the new research entry) — documented as a **future optional optimization**, explicitly **not
  implemented in this pass** (the reference harness always runs the full-file re-gate, per the method's
  "full re-gate is the sound default").
- `harness/loop-flutter.workflow.js` — **Step 3.** Added the Minimize-stage reference implementation as a
  new Phase 3.5, between Cover and Report:
  - Pure helpers `mutantLine`/`VOID_CALL_REMOVAL_RE`/`pretagEquivalentLogging`/`mutationFloor` — copied
    **verbatim** from `cover-flutter.workflow.js` (documented "KEEP IN SYNC", the same pattern that file
    itself uses relative to `cover.workflow.js`) so the confirm scores the post-removal summary with the
    IDENTICAL exact-count formula that produced `killedBefore`. No cross-file import exists in the
    Workflow runtime, so duplication is the only mechanism available — not a shortcut.
  - `MINIMIZE_PROPOSAL_SCHEMA` + `minimizeAgentPrompt()` — the minimize agent (sonnet) reads SRC +
    COVER_TEST + KB_RULES plus the final-iteration residual survivor list, and returns a removal
    **proposal** per candidate `{ testName, killsMutants, subsumedBy, documentsDistinctRule, ruleId,
    category }` — reasoning only, explicitly framed as a hypothesis the confirm will test.
  - `MINIMIZE_APPLY_SCHEMA` + `minimizeApplyPrompt()` — a write-owning agent applies the removal to
    `COVER_TEST` and returns the **exact original file content verbatim** (the only way the orchestrator,
    which has no filesystem, can later instruct a restore).
  - `MINIMIZE_CONFIRM_SCHEMA` + `minimizeConfirmRunnerPrompt()` — a runner agent re-runs the FULL
    toolchain (`flutter test` ×2 + `mutation_test`) on the reduced file, producing a **fresh**
    `mutationSummary` + survivors-only `mutants` array — the real re-mutation, never a recompute.
  - `MINIMIZE_RESTORE_SCHEMA` + `minimizeRestorePrompt()` — a write-owning agent writes the captured
    original content back verbatim on regression.
  - The orchestrator block: pure accept/restore decision. Honors `documentsDistinctRule` (never
    overrides it — filters candidates before removal). Applies the SAME anti-fake-green survivor-count
    cross-check the main gate uses (`summary.undetected === survivors.length`) to the confirm result too
    — an inconsistent confirm is treated as untrustworthy and restores, same as a genuine drop. Compares
    **exact** `killed` counts (never `scorePct`). Restore-on-regression/inconsistency is a hard branch
    (`if (!countsConsistent || killedAfter < killedBefore)`), unconditional — not advisory.
  - Report: new `## Minimize` section (between Gate Battery and Residual Survivors) rendering
    `minimized: removed N tests, reachable kill X%→Y% (confirmed unchanged)` / `held-back:
    confirm-regression` / the zero-candidates case / the not-run case. `minimize: minimizeResult` added
    to the workflow's final return.
  - Fixed a duplicate `const allGatesGreen` declaration (moved the single declaration up so both the new
    Minimize gate and the existing Report phase share it).
  - Small boy-scout addition: cross-checks `applyResult.removed.length` against the proposed `testNames`
    count and logs a `WARNING` on mismatch — the confirm's kill-count check remains the real safety net
    regardless, but a silent count mismatch would otherwise mislead the report's `removed`/`restored`
    numbers.
- `tests/unit/workflow-contract.test.mjs` — **Step 4.** Added 5 slices (a)–(e) for the Minimize stage
  (see Skills Used / Verification below), plus a one-line fixture fix to the pre-existing "loop-flutter
  withholds the GENUINE cover pre-tag…" test (F1/F2, adhoc-MvcSurvivorReport): that test's STAGE-1
  `coverResult` comes from a REAL (non-mocked) `cover-flutter.workflow.js` gate computation, so it
  genuinely carries `gates.mutation_floor.detail.killed` — meaning the new Minimize phase now engages for
  it too. Inserted one `{ candidates: [] }` fixture (a clean Minimize no-op) so the test still isolates
  the classify-survivors seam it was written to prove.

## Key Decisions
- **"Reuse the existing runner-agent re-gate path" = documented verbatim duplication, not a cross-file
  call or a nested `workflow()` composition.** Considered composing `cover-flutter.workflow.js` again for
  the confirm, but its loop's iteration 1 ALWAYS spawns a Cover agent first — including "no
  surviving-mutant feedback yet, write the full suite" when fed no feedback — which would silently
  regenerate/discard the just-reduced test file, defeating the confirm entirely. The Workflow runtime has
  no cross-file import, so the only sound option is the same "keep in sync" verbatim-copy pattern
  `cover-flutter.workflow.js` itself already uses relative to `cover.workflow.js`. `cover-flutter.workflow.js`
  itself needed **no edit** — the plan's file-list parenthetical describes what's reused, not a required
  diff to that file.
- **Minimize is gated on `killedBefore !== null` (i.e., `coverResult.gates.mutation_floor.detail.killed`
  present), not on a separate opt-in flag.** In production this field is always present on an
  `all-gates-green` result (`mutationFloor()` always computes it) — the null-check is a genuine fail-closed
  guard ("don't attempt a trim without a trustworthy pre-minimize baseline"), and it has the side effect of
  leaving pre-existing tests with hand-built, incomplete `coverResult` mocks (`9f`, `9f-2`) unaffected,
  since Minimize was never meant to be togglable behind a flag per ADR-37/the plan.
- **v1 restore is all-or-nothing on the whole proposed batch** (per plan Step 3 — bisection is a future
  optimization). A partial `applyResult.removed` (write-agent did fewer than proposed) is logged as a
  `WARNING` but does not block; the confirm's exact-count compare is what actually gates safety, regardless
  of exactly how many tests the write-agent reports removing.
- **Line-scoping research resolved SUPPORTED** but the harness stays full-file-only in this pass, per the
  method's "full re-gate is the sound default" (it inherits every anti-fake-green guard; a line-scoped
  re-mutation would not catch an attribution error outside the at-risk lines). This matches Step 2's
  acceptance ("supported → optional optimization documented") — documented, not built.
- **Mutation-sanity self-check performed on slices (c)/(d).** Temporarily replaced the restore condition
  with `if (false)`, re-ran the two slices, confirmed both fail with the exact expected assertion messages
  (proving they are load-bearing, not vacuous), then reverted and byte-diffed the file back to its
  pre-mutation state before re-running the full suite. This is the same discipline the plan's Testing
  Strategy calls for on slice (c) specifically ("load-bearing").

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | skill-doc edit (plan: Skill None, TDD no) |
| 2 | None, `research` | skill-doc edit (plan: Skill None, TDD no); `research` invoked for the Step-2 operator-owed fact (mutation_test line-scoping) — recall missed, forked `Explore` dive ran, `cite-check.mjs` validated, persisted to `docs/kb/research/` before use |
| 3 | None | dev-harness reference impl (plan: Skill None, TDD yes — paired with Step 4); `boy-scout` invoked post-edit on `loop-flutter.workflow.js`, found and fixed one proportional gap (applyResult.removed cross-check) |
| 4 | tdd | plan: Skill tdd, TDD yes — wrote the 5 proving slices against the already-written Step 3 code (same suite-level pattern as the sibling `adhoc-MvcSurvivorReport` feature); one genuine RED surfaced and was fixed (see Verification) before all 5 went green; slices (c)/(d) further verified load-bearing via a temporary mutation + revert |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| 4 pre-existing full-suite failures (nexus-cpp CHANGELOG ×1, gen-omni ENOENT ×3) | low | reviewer | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → 379/383 (4 fail); confirmed pre-existing via `git show HEAD:plugins/nexus-cpp/CHANGELOG.md` (top entry already unbracketed `## 0.1.0` at HEAD, before any of my edits) — identical signature to the one the sibling `adhoc-MvcSurvivorReport` implementation.md already carried forward days earlier | NOT introduced here; none of my changed files touch `nexus-cpp/**` or `scripts/gen-omni.mjs`/its test fixtures. My own scoped gate (`tests/unit/workflow-contract.test.mjs`) is 48/48 green |
| `selfcheck.mjs` reports `gen-omni --check` drift | low | team lead | `node scripts/selfcheck.mjs` → `[FAIL] gen-omni --check — omni twin drifted` | Expected, not a defect: the plan's Out-of-scope section explicitly defers the omni twin regen to merge, and my task assignment explicitly excludes Step 5/commit. The drift is the two edited SKILL.md files not yet mirrored — resolves when the team lead runs `gen-omni.mjs` after the version bump, per CLAUDE.md's release flow |

## KB Changes
| Entry | Action | What changed |
|-------|--------|-------------|
| `docs/kb/research/mutation-test-dart-line-range-scoping.md` | NEW | Resolves Step 2's operator-owed fact: `mutation_test` supports `<lines begin="N" end="M"/>` line-range scoping (read-docs tier, cite-check validated) |

## Deviations from Plan
- **`harness/cover-flutter.workflow.js` was not edited.** The plan's Step 3 file line names it
  parenthetically ("reuse the existing runner-agent re-gate path + the exact-count fields") — read as
  identifying the SOURCE pattern to reuse, not a required diff target. Given the Workflow runtime's
  no-cross-file-import constraint (and that composing it as a sub-workflow would re-invoke a Cover agent
  and discard the reduced file — see Key Decisions), the sound reuse mechanism is the verbatim-copy
  pattern `cover-flutter.workflow.js` itself already establishes. No behavior in `cover-flutter.workflow.js`
  needed to change for the Minimize stage to work correctly.
- **One pre-existing test's fixtures updated** (`tests/unit/workflow-contract.test.mjs`, the F1/F2
  "GENUINE cover pre-tag" test) — not a plan step, but required to keep the full suite green after Step 3
  legitimately changed loop-flutter's agent-call sequence for any all-gates-green result carrying a real
  `killed` count. Documented above under Files Modified / Key Decisions.
- **Step 5 (version bump) and commit intentionally not run**, per the task assignment — the team lead owns
  closure. The working tree is left uncommitted with all Steps 1–4 changes plus the new research KB entry.

## Verification
- `node --test tests/unit/workflow-contract.test.mjs` → **48/48 green** (43 pre-existing + 5 new Step-4
  slices). One genuine RED surfaced while writing the new slices: the inline test sandbox's `Math` mock
  only stubbed `random` (sufficient for every PRE-Minimize loop-flutter code path), and the new
  `mutationFloor()` call in loop-flutter now calls `Math.round` — fixed by building the full Math shim
  (every method proxied except `random`, matching the file's own top-level `runInSandbox` helper) in the
  new `runMinimizeLoop` test helper. Not a production defect — a test-helper gap the new code path
  exposed.
- Slices (c) and (d) verified **load-bearing**: temporarily forced the restore branch to `if (false)`,
  re-ran — both failed with the expected assertion messages — then reverted and confirmed a byte-identical
  diff against the pre-mutation file before re-running the full suite green again.
- `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → **379/383 green**; the 4 failures are
  pre-existing and unrelated (see Carry-Over Findings). My own scoped file is 48/48.
- `node --check harness/loop-flutter.workflow.js` → clean.
- Grep-verified Step 3's mechanism acceptance directly: no `^import `, no `require(`/`readFileSync`/
  `writeFileSync`/`node:fs`, no `new Date(`/`Date.now(`/`Math.random(` anywhere in the modified file — the
  orchestrator performs no filesystem I/O and the meta block (untouched) remains a pure literal (also
  covered by the passing `loop-flutter.workflow.js meta is a pure literal` test).
- `node scripts/selfcheck.mjs` → 3/5 (the 2 failures are the carried-forward pre-existing test failures and
  the expected/deferred omni-twin drift — see Carry-Over Findings). Not run: `bump-plugin.mjs` in any form
  (Step 5 explicitly out of scope for this round).

*Status: COMPLETE — developer, 2026-07-01*
