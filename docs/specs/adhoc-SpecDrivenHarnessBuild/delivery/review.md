# Review — Spec-driven Cover front-end + spec-vs-code diff (full-build Increment 1)

**Slug:** adhoc-SpecDrivenHarnessBuild
**Plan:** `docs/specs/adhoc-SpecDrivenHarnessBuild/delivery/plan.md` (Steps 1-7)
**Implementation:** `docs/specs/adhoc-SpecDrivenHarnessBuild/delivery/implementation.md`

## Step 1 — Done-Check

**Pre-commitment predictions (before reading implementation.md):** (1) highest-risk gap = the Step-5
5-case labeler — case 4 (L272 over-rejection) / case 5 (ARTIFACT-04 un-constructable) collapsed or the
`needs-triage` tag dropped; (2) Step-7 fixture not actually pinning Rule 5 (reds as Rule 6 instead); (3)
Step-1 config missing the full 12 GOLD ids or the `_note` sequestration mirror (post-Q6 edit). **All three
checked clean against live source** (`spec-diff.mjs` labelRed, the L272 fixture, the target config — see
notes).

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Target config + `loadSpecRules()` seam | Implemented | `harness/targets/generatedsqlvalidator.json` carries all **12** GOLD ids (ids only), the `_note` sequestration mirror, the isolated-assembly target (`KnowledgeGateway.SpecHarness.Tests`, never `KnowledgeGateway.Tests`), the KG product `.csproj`, and the `_ruleOrderNote` binding Q6 caveat (GOLD-08 = Rule 5, GOLD-05 = Rule 2). Spec-load agent wired as the single golden-text reader (ADR-C). Matches the post-Q6 plan edit. |
| 2 — `locateRuleCode()` seam | Implemented | `spec-diff.mjs` `decideLocation` (attestation → `located`; else `miner-needed`) + `evaluateMinerResult` (`code-missing` for `NO-CODE-FOUND`; `located`; mis-location → `needs-triage` with `miner-mislocation` label — the AC-2 location-correctness caveat). Unit-tested in `tests/unit/spec-diff.test.mjs`. TDD step, `tdd` logged. |
| 3 — Spec-driven Cover front-end (`spec-cover.workflow.js`) | Implemented | 3-actor `cover.workflow.js` shape + the spec-load + guided-miner agents; inlines `spec-diff.mjs` + `cover-gates.mjs` helpers verbatim (runtime can't import). **Both AC-1 reuse-boundary divergences present:** drives its own loop (reds → labeler before any green gate, `suiteGreen` never over reds — div 1); mutation pass over the GREEN subset only, reds quarantined (div 2). Isolated-assembly + golden-path-isolation gated by `spec-cover-workflow.test.mjs`. `tdd` logged. |
| 4 — Three-axis diff (`spec-diff.mjs`) | Implemented | `classifyRule` / `diffRules` / `serializeDiff` — every rule in exactly one axis, `spec ∧ ¬code` serialized first. A 4th `both-agree` bucket added to keep the exactly-one-axis accounting honest (a same-boundary match is not a `both-divergent` divergence) — recorded as a Key Decision, consistent with AC-4's "every rule in exactly one axis." TDD step, `tdd` logged. |
| 5 — Deterministic FP-labeler (`spec-diff.mjs`) | Implemented | `labelRed` + `RULE_ORDER` — **all 5 cases verified against source** (`spec-diff.mjs:179-230`): case 1 earlier-fired → `interaction-artifact` (only auto-resolved); case 2 later → under-enforce; case 3 actual-null → sin-of-omission; **case 4 expected-null/actual-fired → `over-rejection` → `candidate-bug` tagged `needsTriage` (the L272 shape)**; case 5 errored → `needs-triage`. Keyed off rule name, not GOLD-id (Q6 caveat). All 5 covered in `spec-diff.test.mjs`. |
| 6 — Run report (3-axis diff + candidate-bug queue + needs-triage bucket) | Implemented (Deviated — location) | Folded into `spec-cover.workflow.js`'s `Report` phase (D2) — the `loop.workflow.js:647-719` self-written-report precedent, which lives **inside** the orchestrator. Same artifact, same three sections; written git-ignored to `harness/.runs/spec-cover-generatedsqlvalidator.md` (Q8 default). Valid reason — matches precedent exactly. |
| 7 — End-to-end known-answer reproduction (AC-6) + operator patch | Implemented (offline) + Deviated (live arm — operator-owed) | **Per my pre-declared Q7 disposition.** Offline sub-parts **Implemented**: runnable `spec-cover.workflow.js` ✓; pinned L272 fixture (`generatedsqlvalidator-l272-fixture.json`) — **pins Rule 5 with a full per-rule rationale, rules 1-4/6/7 all pass**, two-arm known answer `NoStrayLiteralThreshold` (pre-fix) vs `null` (patched) keyed by IEEE-754 `0.010000000000000009 > 0.01` ✓; offline gate `node --test tests/unit/spec-diff.test.mjs` green (22 pass) ✓. **Live two-arm dotnet+Stryker run = Deviated (valid reason: operator-owed, no-git-writes boundary)** — the `OPERATOR ACTION REQUIRED` runbook (Deviations D3) is present with exact stash/restore commands, the dirty-tree hazard, and the precise pre-fix/patched assertions. Runbook present + fixture pins Rule 5, so this is Deviated, not Missing. |

### Deviation ledger (all carry valid reasons)
- **D1 — execution order 2→4→5 before 3.** Sound dependency reason: Steps 2/4/5 build `spec-diff.mjs`; Step 3 inlines those helpers verbatim (runtime can't import). No behavior change. **Valid.**
- **D2 — Step 6 report folded into the Step-3 workflow file.** Matches the `loop.workflow.js` inline-report precedent exactly. **Valid.**
- **D3 — live two-arm AC-6 run is operator-owed** (`OPERATOR ACTION REQUIRED` runbook). Plan-sanctioned (Q7=A), no-git-writes boundary makes developer execution physically impossible. **Valid** — Deviated, not Missing.
- **D4 — `_args.codeRules` seam for the diff's code-side.** The mine-verify `consensusRules` is operator-supplied (D4 seam); AC-4's "every rule in exactly one axis" is proven by the `diffRules` unit test, not a live full-run — consistent with the harness operator-seam lineage. **Valid.**

### Skill conformance (scored against `.claude/audit/skill-invocations.log`, scoped to `developer` + token `developer:implement` + session `995e6477…`)
- Scoped log for this run: `tdd` (2026-06-25T07:26) + `boy-scout` (07:43, auto-loaded after-edit, not plan-mapped).
- Plan mapping: Steps 1/6/7 `Skill: None` (no log owed); Steps 2/4/5 `Skill: None — TDD: yes` and Step 3 `Skill: tdd — TDD: yes` (`tdd` owed). **`tdd` is logged** ✓ and covers all four `TDD: yes` steps.
- `## Skills Used` section present; self-report (`tdd` on 2/3/4/5, `None` on 1/6/7) matches the plan mapping and is backed by the logged invocation. No fabrication. **PASS.**

### Independent verify gate
Already recorded **PASS** (team-lead relay): `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → 347 pass / 0 fail; `tests/unit/spec-diff.test.mjs` → 22 pass; `tests/unit/spec-cover-workflow.test.mjs` → 8 pass; `node scripts/selfcheck.mjs` → 4/4 (incl. `bump-plugin --check` = no shipped change). AC-7 git hygiene: no `plugins/**` change, no version bump, all net-new code under `harness/` + `tests/unit/`.

### `Satisfies:` cross-check (where present)
Every step's `Satisfies:` annotation cites a real AC/ADR (AC-1..AC-7, ADR-A..D, D1..D5 — all defined in the tech-spec). Spot-confirmed: Step 5 `Satisfies: AC-5; D3` (real); Step 7 `Satisfies: AC-6, AC-7; D5, D2` (real). No phantom citations.

**Verdict: PASS** — all 7 plan steps Implemented (Steps 6, 7 with documented, valid deviations; the live AC-6 arm is operator-owed per the pre-declared Q7 disposition, not Missing). No step skipped, no unexplained scope creep, skill conformance clean, independent verify green.

*Status: COMPLETE — architect, 2026-06-25*

---

## Step 2 — Code Review

## Reviewed By
Reviewer agent (nexus:reviewer). Code-grounded pass — read all five new files + the modified test file, ran live test commands, and diffed inline copies against sources.

## Verdict: APPROVED

## Pre-commitment Predictions

Predicted 3–5 likely problems and investigated each:

1. **FP-labeler case 4 dropped or mis-routed** — investigated `spec-diff.mjs:205-213` + test at `spec-diff.test.mjs:197-203`. Confirmed case 4 (`expected===null`, `actual!==null`) routes to `candidate-bug` + `needsTriage:true`. CLEAN.
2. **suiteGreen applied to spec-driven reds** — investigated the `Diff+Label` phase at `spec-cover.workflow.js:563-606`. Confirmed: reds route to `labelRed` before any gate eval; `suiteGreen` is invoked only on `runRaw.testRuns` (the green-subset double-run the runner already quarantined). The `spec-cover-workflow.test.mjs:129-144` sandbox test asserts this path. CLEAN.
3. **RULE_ORDER drift between spec-diff.mjs and inline copy** — ran inline comparison programmatically. Function bodies identical (formatting-only diff on `suiteGreen`'s return literal — confirmed semantically identical). CLEAN.
4. **L272 fixture could let Rule 6 fire first** — read `generatedsqlvalidator-l272-fixture.json` rule-pin rationale + ran `spec-diff.test.mjs:239-249` (asserts `public.analytics_store_category_stats`, no `analytics_report*`). The fixture uses a `PreComputedStatsTables` table that `BadReportsFilterPresent` explicitly exempts. CLEAN.
5. **Carry-over finding: inline-copy sync hazard** — investigated via programmatic diff. Spec-diff helpers are byte-identical in function bodies; cover-gates inline has a formatting difference in `suiteGreen` (trailing comma in multi-line vs. single-line) but is semantically identical and validated by the sandbox test. LOW risk confirmed by the developer's note. CLEAN.

## Findings

No CRITICAL or HIGH findings.

### [MEDIUM] codeContainsRule auto-assignment in the guided-miner evaluation silently trusts miner output
**File:** `harness/spec-cover.workflow.js:468`
**Origin:** implementation
**Issue:** The orchestrator calls `evaluateMinerResult({ minerLocation: loc.location, codeContainsRule: loc.location !== 'NO-CODE-FOUND' })`. This auto-sets `codeContainsRule=true` for any non-`NO-CODE-FOUND` location, which bypasses the AC-2 location-correctness caveat (`evaluateMinerResult`'s `needs-triage` branch requires `codeContainsRule !== true`). The effect: a miner-returned `file:line` that is a mis-anchor is silently treated as `located` rather than `needs-triage`. The developer noted this in the carry-over findings table ("operator-verified at the live run; at wire time the miner's own claim is recorded"), and the code carries an inline comment to this effect. The `evaluateMinerResult` function in `spec-diff.mjs` is correctly designed; it is the caller that bypasses the second leg.
**Fix:** At wire time, leave `codeContainsRule` unset (or set to `false`) and let `evaluateMinerResult` route all miner-returned locations to `needs-triage` until the operator confirms code-containment. The current behavior is the developer's documented intent (wire-time shortcut accepted); this is an operator-owed quality check, not a test-level defect. Confirm or flag for the next increment.
**Confidence:** 82/100

### [LOW] Cover-gates inline copy uses single-line return in `suiteGreen` vs. multi-line in the source
**File:** `harness/spec-cover.workflow.js:207-209`
**Origin:** implementation
**Issue:** The inlined `suiteGreen` uses `return { pass: everyGreen, detail: ... }` (single-line) while `harness/lib/cover-gates.mjs:30-33` uses a multi-line return with a trailing comma. The "verbatim" copy claim in the comment is technically inaccurate. Semantically identical and verified by the sandbox test. The sync hazard noted in the carry-over table remains real but currently benign.
**Fix:** Align the inline copy to be byte-for-byte identical to the source, or add a lint test that diffs the inline copy against the source file. The former is simplest.
**Confidence:** 85/100

### [LOW] No guard for `expected === actual` (green test) being passed to labelRed
**File:** `harness/spec-cover.workflow.js:569-571`
**Origin:** implementation
**Issue:** The `isRed` check at line 569 (`o.errored === true || !sameOutcome(o.actual, o.expected)`) correctly filters green tests out of `labelRed`. This is structurally correct. However, there is no check that a green test where `expected === actual === null` (a pass that expected a pass) is not mistakenly counted as a red. The `sameOutcome` helper at line 567 uses `(a ?? null) === (b ?? null)`, which handles this correctly. No actual bug — noting for completeness.
**Confidence:** 81/100 — intentional, no fix required.

## Positive Observations

- **All 4 mandatory checkpoints verified against source:**
  - **(a)** FP-labeler: all 5 cases implemented and unit-tested at `spec-diff.mjs:193-233` and `spec-diff.test.mjs:162-219`. Case 4 (`expected-null/actual-fired`) routes to `candidate-bug` + `needsTriage:true` — both the L272 shape and the fixture-artifact shape correctly handled.
  - **(b)** Red-handling/mutation-gate boundary: reds bypass `suiteGreen` entirely; `suiteGreen` runs only on the quarantined-green subset (`spec-cover.workflow.js:599`). Pinned by `spec-cover-workflow.test.mjs:138-144`.
  - **(c)** AC-6 fixture genuinely pins Rule 5: per-rule rationale in `generatedsqlvalidator-l272-fixture.json:12-20`; fixture tests at `spec-diff.test.mjs:239-281` assert the pin and both arms. Runbook in `implementation.md` D3 is complete with exact stash/restore commands, dirty-tree hazard warning, and per-arm assertions.
  - **(d)** `RULE_ORDER` matches live `GeneratedSqlValidator.cs:227-303` (confirmed: the architect pre-verified against source; the unit test at `spec-diff.test.mjs:162-173` asserts all 7 names in order).
- **Workflow runtime contract fully honored**: no static import, no fs/Date/Math.random, `meta` is a pure literal, args parsed for both tool-injection and composition shapes, `budget.spent()` gated on marginal spend (`RUN_START_SPENT`).
- **Clean-room boundary enforced mechanically**: golden path (`GOLDEN_SET`) only in the `specLoadPrompt` (`spec-cover.workflow.js:407`); AC-3(a) pinned by a sandbox assertion at `spec-cover-workflow.test.mjs:146-157`.
- **Inline-copy sync is testable by the sandbox**: `spec-cover-workflow.test.mjs` exercises `labelRed`/`diffRules` via the inlined code paths (test at line 129 uses `result.candidateBugQueue`), so a behavioral drift in the inline copy would fail the test.
- **Both-agree bucket**: the `both-agree` fourth bucket is a sound extension — it preserves "every rule in exactly one axis" without mis-labeling an agreement as `both-divergent`. Correctly documented in implementation.md Key Decisions.
- **RULE_ORDER constant**: appears once in `spec-diff.mjs` (source of truth) and once inlined in `spec-cover.workflow.js` — both identical (`spec-diff.mjs:166-174`).

## Gaps

- **`codeContainsRule` auto-assignment** (Medium, above): the AC-2 mis-anchor path is reachable at wire time when a miner returns a wrong `file:line`. The developer documented this as operator-verified; it is a known limitation, not a silent hole.
- **No lint enforcing inline-copy sync**: the carry-over table calls this out. A test comparing `spec-cover.workflow.js`'s inlined sections against `spec-diff.mjs`/`cover-gates.mjs` would make the "keep in sync" comment mechanical. Suitable for a follow-up.
- **Live two-arm run is operator-owed**: the plan sanctions this (Q7=A). The offline proof at `spec-diff.test.mjs:252-281` is complete and correct. Noted, not a gap.

## Open Questions

None from the ≥80-cutoff self-audit; the `codeContainsRule` finding scored 82 and is included as a confirmed MEDIUM.

## Carry-Over Findings (from implementation.md)

| Title | Dev Severity | Resolution |
|-------|-------------|------------|
| Triple inline-duplication of pure helpers (sync hazard) | low | **Confirmed but benign.** Inline copies are functionally identical to source (programmatic diff ran and confirmed for both `spec-diff.mjs` and `cover-gates.mjs` function bodies). The `suiteGreen` formatting difference is cosmetic; semantically identical verified by execution. Filed as LOW finding above. |
| AC-4 `code ∧ ¬spec` axis empty without `_args.codeRules` | low | **Confirmed as designed.** The D4 seam is explicit; when `_args.codeRules` is absent, every spec rule still lands in an axis (`spec-not-code` or `both-*`). AC-4 "every rule in exactly one axis" proven by `diffRules` unit test. Not a defect. |
| Live two-arm AC-6 reproduction is operator-owed | medium | **Confirmed as plan-sanctioned.** Offline unit proof complete and green (`spec-diff.test.mjs:252-281`, 22/22 pass). The operator runbook in implementation.md D3 is complete. Not a reviewer concern. |
| Spec-load agent maps golden rules → Validate rule names at runtime (LLM judgment) | low | **Confirmed as operator-surface.** The `ruleName` mapping is LLM judgment inside the spec-load agent; unit tests pin the labeler logic, not the mapping fidelity. Consistent with how the miner's `file:line` fidelity is operator-verified (AC-2). Not a defect. |

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| spec-diff unit tests | PASS | `node --test tests/unit/spec-diff.test.mjs` | 22 pass, 0 fail |
| spec-cover-workflow sandbox tests | PASS | `node --test tests/unit/spec-cover-workflow.test.mjs` | 8 pass, 0 fail |
| Full CI glob | PASS | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 347 pass, 0 fail |
| selfcheck | PASS | `node scripts/selfcheck.mjs` | 4/4 passed (incl. bump-plugin --check = no shipped change) |
| Inline spec-diff sync | PASS | programmatic normalize+compare | Function bodies byte-identical |
| Cover-gates sync | PASS (semantic) | programmatic normalize+compare | Formatting diff only; semantically verified by sandbox test |
| RULE_ORDER match | PASS | `spec-diff.test.mjs:162-173` | 7 names in order asserted + live test green |
| Case 4 route | PASS | `spec-diff.test.mjs:197-203` + `spec-cover-workflow.test.mjs:129-136` | `route=candidate-bug`, `needsTriage=true` confirmed |
| Golden path isolation | PASS | `spec-cover-workflow.test.mjs:146-157` | `goldenRe` not in Cover/runner/miner prompts |
| No plugin bump | PASS | selfcheck `bump-plugin --check` | No `plugins/**` change |

*Status: COMPLETE — reviewer, 2026-06-25*
