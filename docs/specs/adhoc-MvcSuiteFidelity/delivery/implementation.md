# MVC Suite Fidelity (F1 + F3) — Implementation

## Files Modified
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` (`## The Minimize stage`) — **Step 1, feedback-F1.**
  Three additive edits to the shipped method, no restated prose, no `:NN` citations:
  - **Activation gate** in the stage opening — Minimize runs only when the generated test count *materially
    exceeds* the distinct mined-rule count by a **non-zero margin** (margin 0 never skips); at/near the rule
    count the whole stage is skipped (logged + reported). Names both upstream sources (consensus-rule count,
    green suite size) and forbids counting them from the removal proposal (removed-tests-only, don't exist
    pre-agent).
  - **Categorical-KEEP class + discriminator** after the four categorical-dead classes — a degenerate-input
    test that *constructs* the edge (empty / no-match / zero / empty-collection / documented
    failure-passthrough) AND asserts the observable safe/no-op result is KEPT even when mutation-redundant
    and same-ruleId. Carries the "confirm compares kill counts → a mutation-redundant behaviour test
    contributes zero unique kills → its loss is invisible to the confirm" rationale + the deterministic
    honoring sentence (orchestrator refuses removal mechanically, same as the distinct-rule keep). The
    discriminator vs class #4 (*constructs + asserts?* → KEEP; names but never builds → #4) is stated
    adjacently.
  - **Report-line third form** — `minimized: skipped (at rule-floor) — generated N ≤ rules M + margin`,
    alongside the existing `removed N` and `held-back` forms, so a skipped stage is never misrendered as
    "removed 0 tests".

- `plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md` — **Step 2, feedback-F3 + F1.** Three
  additive edits:
  - **Mocks bullet (F3)** — hardened into a rule: *mock ONLY true I/O boundaries* (repositories, plugin
    `MethodChannel`s, other use-cases) and *never mock a plain data model*, with the one-line why (a mocked
    data getter blinds the suite to aggregation/derivation bugs — the pilot POG `SdkRealogramModel` gap).
  - **Fixtures bullet (F3)** — reinforced to construct real domain models via `*_dummy.dart` factories (or
    real constructors), *never a mocked stand-in for a data model*, cross-referencing the Mocks carve-out.
  - **Minimize-stage Dart-fill (F1)** — a Dart categorical-KEEP cue: empty template `''` / absent-placeholder
    / empty list `[]` passed to the use-case asserting the unchanged/no-op result, marked
    `categoricalKeep: true`, mirroring the adapter's existing survivor-tag Dart cues.
- `harness/loop-flutter.workflow.js` — **Step 3, feedback-F1** (dev-harness reference impl, not shipped):
  - **Module const** `MINIMIZE_ACTIVATION_MARGIN = _args.minimizeActivationMargin ?? 1` (default **1**,
    tunable via args) — hoisted to module scope so both the gate and the report renderer read it.
  - **`MINIMIZE_PROPOSAL_SCHEMA`** — added `categoricalKeep: { type: 'boolean' }` (additive; NOT in
    `required`, so old proposals still validate and `!c.categoricalKeep` is `true` when absent).
  - **Minimize-agent prompt** — added the CATEGORICAL-KEEP class (degenerate-input test that constructs the
    edge + asserts the no-op → include with `categoricalKeep: true`) + the DISCRIMINATOR vs categorical-dead
    class #4; extended the return-shape example with `categoricalKeep: false`.
  - **Orchestrator decision** — `toRemove = candidates.filter((c) => !c.documentsDistinctRule && !c.categoricalKeep)`
    (was `!c.documentsDistinctRule` only). Mechanical filter; derives nothing.
  - **Activation gate** — before the minimize `agent()` call: `distinctRules = mineVerifyResult.consensusRules.length`,
    `generated = coverResult.gates?.suite_green?.detail?.runs?.[0]?.passed ?? null`; when
    `generated !== null && generated <= distinctRules + margin` the stage is skipped (minimize agent NOT
    spawned), `minimizeResult = { skipped: 'at-rule-floor', generated, distinctRules }`, logged. `generated`
    unknown (null) ⇒ gate does not fire, Minimize proceeds as before (preserves the pre-existing 9h slices).
  - **Report renderer** — added a `skipped` branch to `minimizeSection`: renders
    `**minimized: skipped (at rule-floor)** — generated N ≤ rules M + margin …`, NOT falling through to
    "removed 0 tests" (MED-2).
- `tests/unit/workflow-contract.test.mjs` — **Step 4, feedback-F1** (`Skill: tdd`, red-green per slice):
  - Parameterized `runMinimizeLoop(coverResult, agentFixtures, mineVerifyReturn = MINIMIZE_MINE_VERIFY_RETURN)`
    (backward-compatible default) so slice (b) can set the consensus-rule count.
  - Added slices **9h-6..9h-9**: (a) categoricalKeep honored (keep survives a subsumed/non-distinct
    candidate — the zpl empty-template regression), (c) discriminator (keep survives + fake-boundary DROP-#4
    removed in one proposal), (b) activation gate (extends `suite_green.detail.runs` + a 3-rule mineVerify so
    `generated(4) <= rules(3)+margin(1)` → skip; asserts no minimize agent, `skipped==='at-rule-floor'`,
    skip-form report line, no "removed 0 tests"), (d) no-regression (ordinary `categoricalKeep:false`
    candidate still removed + confirm still runs).
- `plugins/nexus/.claude-plugin/plugin.json` + `plugins/nexus/CHANGELOG.md` — **Step 5.** PATCH bump
  1.18.9 → 1.18.10 (forced by the Step 1 skill edit); CHANGELOG entry names F1 (categorical-KEEP, activation
  gate, discriminator, skip report-line).
- `plugins/nexus-flutter/.claude-plugin/plugin.json` + `plugins/nexus-flutter/CHANGELOG.md` — **Step 5.**
  PATCH bump 0.2.0 → 0.2.1 (forced by the Step 2 adapter edit); CHANGELOG entry names F3 (never-mock-a-data-model
  rule) + F1 (categorical-KEEP Dart cue). Bumps applied via `scripts/bump-plugin.mjs`; `--check` passes.
  Harness + tests are dev-only and correctly forced no bump.

## Key Decisions
- (Step 1) Placed the deterministic-honoring sentence inside the categorical-KEEP paragraph (rather than a
  separate paragraph) so the keep-signal handling reads as one unit with its rationale — the plan asked for
  it "in the actor-split/removal description"; the categorical-KEEP paragraph is the removal description for
  this signal.
- (Step 3) `MINIMIZE_ACTIVATION_MARGIN` is **arg-overridable** (`_args.minimizeActivationMargin ?? 1`) and
  hoisted to **module scope** (near `MUTATION_FLOOR`/`MAX_ITERATIONS`) so both the activation gate and the
  report renderer read the same value — the plan said "tunable"; making it an arg mirrors the other tunables.
  Default **1** documented per the plan's request.
- (Step 3) When `generated` cannot be read (cover result has no `suite_green.detail.runs` — e.g. the
  canonical pre-existing test fixtures), the gate **does not fire** and Minimize proceeds as before. This
  preserves the pre-existing 9h-1..9h-5 slices (whose fixtures carry empty `suite_green.detail`) and is the
  safe default (don't skip a stage on missing data). Only slice (b) populates `runs` to exercise the skip.
- (Step 3/4) TDD interleave: the plan sequences Step 3 (harness) before Step 4 (tests), but the `tdd` skill's
  red-green loop reverses that within the pair — each new mechanism was driven test-first: slice (a) red →
  filter green; slice (b) red → activation gate + renderer green; (c)/(d) are coexistence/no-regression
  guards written after and confirmed green. Both steps are fully implemented and recorded.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | skill-doc edit (plan: Skill None, TDD no) |
| 2 | None | skill-doc edit (plan: Skill None, TDD no) |
| 3 | tdd | dev-harness impl (plan: Skill None, TDD yes) — tdd invoked once for the Step 3+4 pair; harness is the production code, Step 4 the slices |
| 4 | tdd | contract slices (plan: Skill tdd, TDD yes) — red→green per slice (a filter red, b gate red, c/d guard) |
| 5 | release-plugin | PATCH bump both plugins via `scripts/bump-plugin.mjs`; `--check` green |

**Boy-scout:** considered on `harness/loop-flutter.workflow.js` (the only non-doc/non-test file touched);
the modified regions follow the file's existing conventions (module-const placement, comment style, the
pure-decision filter idiom) — no adjacent dead code, naming, or duplication issues to clean. No changes.

## Deviations from Plan
- None. All five steps implemented as specified. The activation-gate margin was made arg-overridable (a
  natural reading of the plan's "tunable"), not a deviation from any concrete instruction.

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| plan.md:42 wording correction (developer cannot edit plan.md) | low | architect | plan Mechanism row `:42` says `generated count = coverResult.gates.suite_green.detail.runs[0].passed` "— on the all-gates-green path `passed` == total suite size" | **Now false** (FIX-B): `suiteGreen()` tolerates skipped tests when `baselineSkips > 0`, so `passed` alone undercounts. Correct wording: *generated total = `passed + failed + skipped` of a `suite_green` run (NOT `passed` alone — skips are tolerated)*. plan.md is architect-owned/read-only to the developer, so this is flagged for the architect to apply rather than edited here. |
| Pre-existing unrelated lint failure | low | reviewer | `tests/lint/release.test.mjs` → `nexus-cpp: plugin.json / CHANGELOG top entry` mismatch | nexus-cpp is untouched by this feature; failure present on baseline HEAD before any edit. "lint green" acceptance read as "no NEW failure". Do not investigate. |
| `claude plugin validate` frontmatter errors (pre-existing) | low | reviewer | `claude plugin validate plugins/nexus --strict` reports 4 YAML-frontmatter parse errors on `boy-scout`, `diagnose`, `evaluate-skill`, `improve-skills` | All 4 are UNTOUCHED by this feature (not in the change set); a validator-version quirk, not caused here. `mine-verify-cover` is NOT flagged. nexus-flutter validates clean. |
| Unrelated dirty tree entries (not mine) | low | team-lead | `git status`: `.gitignore` M (adds `harness/cpp/workspace*/`) + untracked `docs/specs/adhoc-SddCoverageLoop/` | Both pre-date this session (not edited by this feature). **Scope staging to this feature's files** when committing Step 5 (the 8 tracked files below + the 2 delivery docs) — do NOT stage `.gitignore` or `adhoc-SddCoverageLoop/`. |
| Omni twin regen deferred | low | team-lead | plan Scope "The omni twin regen — deferred to merge" | `gen-omni.mjs` not run (harness is dev-only / not mirrored; the two SKILL.md bumps ride the content sync at merge). Per plan. |

**This feature's change set (for scoped staging):** `plugins/nexus/skills/mine-verify-cover/SKILL.md`,
`plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md`, `harness/loop-flutter.workflow.js`,
`tests/unit/workflow-contract.test.mjs`, `plugins/nexus/.claude-plugin/plugin.json`,
`plugins/nexus/CHANGELOG.md`, `plugins/nexus-flutter/.claude-plugin/plugin.json`,
`plugins/nexus-flutter/CHANGELOG.md` (+ `docs/specs/adhoc-MvcSuiteFidelity/delivery/implementation.md`).

## KB Changes
None — per plan (§KB Impact). The change alters which generated tests survive Minimize; no `docs/kb/`
rule-ledger entry changes (mutation-gated status unaffected, the gate still passes).

## Review Fixes — Cycle 1/3 (2026-07-01)
Consolidated fix-list from the nexus reviewer + a Codex cross-check. All four HARDEN the delivered mechanism
to match the plan's own principles; none is a scope change. Gates re-run green: `node --test
tests/unit/workflow-contract.test.mjs` = **55 pass / 0 fail** (51 → 55, four new slices); `node --check` on
both harness workflows clean.

- **FIX-A (HIGH — fail-CLOSED F1 guard)** — `harness/loop-flutter.workflow.js`.
  - **Chosen fix = BOTH forms, primary is the orchestrator filter** (per the plan's "the guard that must not
    decay lives in the orchestrator, not only the prompt" principle): the removal filter now removes a
    candidate **only when BOTH keep flags are explicitly `false`** —
    `candidates.filter((c) => c.documentsDistinctRule === false && c.categoricalKeep === false)` (was
    `!c.documentsDistinctRule && !c.categoricalKeep`, which treated an ABSENT flag as removable via
    `!undefined === true`). A candidate MISSING either flag is now HELD BACK, never removed.
  - **Backstop:** `categoricalKeep` added to `MINIMIZE_PROPOSAL_SCHEMA.required` (was properties-only) — a
    fresh MVC run always emits it, so an omitting proposal is malformed, not legacy. The filter is the
    load-bearing guard; the schema is defense-in-depth at the contract boundary.
- **FIX-B (MEDIUM — activation-gate count)** — `harness/cover-flutter.workflow.js` + `loop-flutter.workflow.js`.
  - `suiteGreen()` now carries `skipped` through its `detail.runs` (was `{passed, failed}` only) — additive;
    nothing reading passed/failed breaks.
  - The activation gate now computes `generated = passed + failed + skipped` of `suite_green.detail.runs[0]`
    (was `?.passed ?? null`) — the true suite size, since the all-gates-green path tolerates skipped tests
    when `baselineSkips > 0` and `passed` alone undercounts (would let Minimize skip early). `passed` absent
    ⇒ still `null` ⇒ gate does not fire (preserves the empty-detail fixtures).
  - **plan.md:42 wording is now false** (it claims `passed` == total suite size) — flagged for the architect
    in Carry-Over (developer cannot edit the architect-owned plan.md).
- **FIX-C (MINOR — zero-removal report accuracy)** — `harness/loop-flutter.workflow.js`.
  - New pure `zeroRemovalReason(candidates)` helper produces the exact reason + counts + a rendered `clause`
    shared by the log (`~:496`) and the report line (`~:687`): empty-proposal / kept-by-distinct-rule /
    kept-by-categorical-KEEP / held-back-fail-closed. Replaces the blanket "every mutation-redundant candidate
    documented a distinct rule" (false for slice (a)'s categorical-KEEP shape). Same spirit as the MED-2
    skip-render split.
- **FIX-D (test hardening)** — `tests/unit/workflow-contract.test.mjs`.
  - Existing removal-expecting proposals (9h-1/-2/-3/-4/-5) now carry explicit `categoricalKeep: false`
    (required by the fail-closed filter — an absent flag now holds back; a real proposal always emits it).
  - New slice **(e)** proceed-side boundary: `generated = distinctRules + margin + 1` → minimize agent IS
    spawned, `result.minimize.skipped` ABSENT (guards a flipped comparison operator — only the skip side was
    tested).
  - New slice **(f)** FIX-B skipped-count: `passed 4 + skipped 2 = 6 > threshold 4` while `passed` alone (4)
    would skip → asserts the agent IS spawned (gate uses the total, not `passed`).
  - New slice **(g)** FIX-A fail-closed: `categoricalKeep` ABSENT + `documentsDistinctRule:false` → NOT
    removed; report renders the `held back fail-closed (missing keep flag)` reason (also exercises FIX-C).
  - Enhanced slice **(b)** (activation-gate skip): added `minimize-confirm-run` absent + `removed` absent
    assertions.

**Fix-cycle Key Decision (FIX-A which-of-two):** picked BOTH the filter fail-closed (primary — orchestrator
guard) AND schema-`required` (backstop). Rationale: FIX-D's fail-closed slice (g) asserts the filter itself
holds back an absent-flag candidate, which only the filter change delivers (the test sandbox does not validate
against the schema); the schema-`required` add makes malformed proposals rejectable in production without
being the sole guard.

*Status: COMPLETE — developer, 2026-07-01*
