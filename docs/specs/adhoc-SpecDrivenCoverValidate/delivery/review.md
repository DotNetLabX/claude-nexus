# Review — adhoc-SpecDrivenCoverValidate

## Step 1 — Done-Check (architect, code-grounded, 2026-06-30)

**Verdict: PASS (developer-delivered scope)** — Steps 1–3 Implemented + verified against live source; Steps 4–6
Deviated (operator-owed, plan-sanctioned). **No Missing step.** The increment's **offline** acceptance
(AC-1, AC-2, AC-6) is proven; its **live** acceptance (AC-3, AC-4, AC-5) is **outstanding/operator-owed** — see
the Open Production Gate below. This is a shared-`harness/**` pass, so the check read the actual changed source,
not implementation.md alone.

**Pre-commitment predictions (made before reading):** (1) AC-1's SQL order might still be lib-sourced not
config-sourced; (2) the sync guard might cover only `labelRed`. Both checked and **clean** (see evidence).

### Step disposition

| Step | Deliverable | Disposition | Evidence (code-grounded) |
|------|-------------|-------------|--------------------------|
| 1 | Re-ground L272 fixture to committed SHAs | **Implemented** | `generatedsqlvalidator-l272-fixture.json` arms = `9e40d1f`/`0811132`, stash runbook gone, symbol-referenced (per impl.md; consistent with the verified KG git state) |
| 2 | Generalize `ruleOrder`+identity+`okValue`; sync guard; tests | **Implemented** (TDD) | `spec-diff.mjs:197-224` — `okValue` param, cases 3/4 compare against it; `generatedsqlvalidator.json:11-19` holds the SQL `ruleOrder`; `selfcheck.mjs:86-144` sync guard over all 7 shared fns; `nexus:tdd` in skill log (this session/token) |
| 3 | `SlackSignatureVerifier` target config | **Implemented** | `slacksignatureverifier.json` — GOLD-13…18 ids only, 5-value `ruleOrder`, `okValue:"Valid"`, **own** isolated assembly `KnowledgeGateway.SpecHarness.Slack.Tests`, sequestration `_note` (matches golden-set.md GOLD-13…18) |
| 4 | Live two-arm AC-6 run (SQL) | **Deviated** (operator-owed) | Runbook in impl.md:49-70 (`OPERATOR ACTION REQUIRED`, surgical per-file checkout + arm-sanity). Plan-sanctioned; live AC-3 evidence outstanding |
| 5 | Live run (Slack) | **Deviated** (operator-owed) | Runbook in impl.md:72-92. Plan-sanctioned; live AC-2/AC-4 evidence outstanding |
| 6 | Cross-class validation report | **Deviated** (blocked on 4–5) | Runbook in impl.md:94-98. Depends on live outputs; AC-5 outstanding |

### AC / ADR cross-check (`Satisfies:` annotations confirmed real)

| AC / ADR | Status | Note |
|----------|--------|------|
| AC-1 generalized off single validator | **MET (offline)** | order in JSON; run-path config-sourced (`:571`); 2nd-order test present. Lib `RULE_ORDER` remains as the documented fallback — permitted by revised AC-1 (run-path is the gate, not the lib constant). |
| AC-2 enum + non-`null` pass-sentinel | **MET (offline) / pending live** | `okValue` cases proven in `spec-diff.test.mjs` + the workflow-level run-path test; live Slack proof is Step 5 (operator) |
| AC-3 live SQL AC-6 reproduction | **OUTSTANDING** | operator-owed Step 4; not yet executed |
| AC-4 second-class live run | **OUTSTANDING** | operator-owed Step 5 |
| AC-5 validation report + Inc-3 verdict | **OUTSTANDING** | operator-owed Step 6 |
| AC-6 increment hygiene + sync guard | **MET** | sync guard gating in selfcheck; `spec-diff.test.mjs`/`spec-cover-workflow.test.mjs` pass (36/36); no `plugins/**` change, no version bump |
| ADR-E validator-shape contract | **MET** | `okValue` axis + `ruleOrder` config axis implemented + documented in `spec-diff.mjs` JSDoc; extract to register on completion |

### Skill conformance (scored against `.claude/audit/skill-invocations.log`)

Scoped to `agent=developer`, `session=50abe201-…`, `token=reviewer:review` (matches `.claude/.pipeline-state`).
Plan's only non-`None` step is **Step 2 (TDD: yes)**. The log carries `nexus:tdd` (2026-06-30T17:22) and
`nexus:implementation-format` (17:49) for the developer this run. **PASS** — the TDD obligation is in the log
(not a self-report), `## Skills Used` is present and corroborated by the log (no fabrication), and the
remaining steps are legitimately `Skill: None`.

### Open Production Gate (operator-owed — disclosed, not Missing)

The increment is **not live-validated yet.** AC-3/AC-4/AC-5 require the live `dotnet test` + Stryker runs
(Steps 4–5) and the report (Step 6), which are plan-designated operator-owed (KG checkout + .NET toolchain,
outside the pipeline's no-KG-git-writes boundary). The code is done and reviewable; the live acceptance is a
**separate outstanding track**. The team lead must NOT treat reviewer-approval of the code as increment
completion — the slug stays open for the operator validation, or the open gate is tracked explicitly.

### Notes for the team lead (process flags — not conformance fails)

- **Boundary-detector logged 2 git-write violations** by the developer: `git stash` / `git stash pop` (on the
  **nexus** repo, to isolate pre-existing failures — not a commit, not a KG write, reverted). Benign to the
  deliverable but a recorded breach of the no-git-writes discipline (ADR-18/21). The git-log author check will
  be clean (no developer commit); `violations.log` has the two entries.
- **4 pre-existing test failures** (`nexus-cpp` CHANGELOG + 3 `gen-omni` tests) confirmed pre-existing by the
  developer (stash + rerun) — **not caused by this increment**, outside its scope. Carry-over for a separate
  fix (route to the learner/team lead); does not affect this increment's AC-6 (its two unit files pass).

**Routing:** PASS → reviewer for Step 2 code review of the Steps 1–3 code surface (`spec-diff.mjs`,
`spec-cover.workflow.js`, the two target JSONs, `selfcheck.mjs`, the two test files). The live validation
(Steps 4–6) proceeds on the operator track in parallel.

## Step 2 — Code Review

## Reviewed By
Reviewer (nexus:reviewer), 2026-06-30. Code-grounded: read all 7 changed/created files; ran tests and selfcheck directly.

## Verdict: APPROVED

## Pre-commitment Predictions

1. **`labelRed` case ordering with `okValue`** — predicted a possible edge case where case 4 (expected === okValue) masks the `unrecognized-rule` fallback for genuine off-order names. **Checked** — not masked: the fallback fires when neither expected nor actual is the okValue AND at least one is absent from `ruleOrder`. ✓
2. **`RULE_ORDER` constant might still appear at the `:571` call site** — predicted the hardcoded constant might survive. **Checked** — call site uses `RULE_ORDER_CFG` from `_args`; the constant is only the internal fallback in `labelRed`. ✓
3. **Spec-load prompt might hardcode SQL names** — predicted the inline rule-name list might not be config-sourced. **Checked** — line 440 uses `(RULE_ORDER_CFG ?? RULE_ORDER).join(', ')`. ✓
4. **Sync guard normalization might be too lax** — predicted a logic change with a comment tweak could slip through. **Reasoned** — normalization strips `t.trim().startsWith('//')` lines only (standalone comments); any line mixing code + trailing comment starts with the code token, not `//`, so it is preserved. Code changes are always caught. LOW confirmed, not escalated.
5. **Slack JSON might share the SQL isolated assembly** — predicted wrong `isolatedAssembly` field. **Checked** — `KnowledgeGateway.SpecHarness.Slack.Tests` vs SQL's `KnowledgeGateway.SpecHarness.Tests`. ✓

## Findings

### [LOW] Slack target JSON missing `specTests` field; default is SQL-specific
**File:** `harness/targets/slacksignatureverifier.json` + `harness/spec-cover.workflow.js:311`
**Origin:** implementation
**Issue:** The workflow defaults `SPEC_TESTS = _args.specTests ?? ${ISOLATED_ASSEMBLY}\\GeneratedSqlValidatorSpecTests.cs`. The filename `GeneratedSqlValidatorSpecTests.cs` is SQL-specific and wrong for a Slack live run. `slacksignatureverifier.json` does not include a `specTests` field, nor does the Step 5 runbook's `_args` annotation list it. An operator running Step 5 with only the target JSON fields as args would direct the Cover agent to write `GeneratedSqlValidatorSpecTests.cs` inside the Slack assembly — wrong filename, though the assembly isolation itself is correct.
**Fix:** Add `"specTests": "D:\\src\\knowledge-gateway\\src\\Services\\KnowledgeGateway\\KnowledgeGateway.SpecHarness.Slack.Tests\\SlackSignatureVerifierSpecTests.cs"` to `slacksignatureverifier.json`, or add `specTests` to the Step 5 runbook `_args` annotation. Either makes the Slack live run self-documenting without requiring the operator to know the internal default.
**Confidence:** 82/100

## Positive Observations

- The `okValue` generalization in `labelRed` is clean: `r?.okValue !== undefined ? r.okValue : null` correctly distinguishes between an explicit `null` sentinel (SQL) and a missing `okValue` (defaults to `null`). Cases 3 and 4 compare against `okValue` consistently, and the SQL backward-compat case (`okValue` absent → `null`) is verified by the dedicated backward-compat test.
- The `unrecognized-rule` fallback is NOT masked by the `okValue` branches. Traced through both SQL (okValue=null) and Slack (okValue="Valid") for off-order names: cases 3/4 only fire when expected or actual equals the okValue; off-order names pass straight through to the `indexOf` comparisons, which return −1, and then fall to `unrecognized-rule`. ✓
- The sync guard extracts all 7 shared functions by name using paren-depth + brace-counting, normalizes, and compares. The normalization is correctly scoped: standalone comment lines (lines whose trimmed form starts with `//`) are stripped; mixed code+comment lines (starting with code) are preserved. A code-level divergence (e.g., `> 0.01` changed to `> 0.01 + 1e-9`) is always caught.
- AC-1(a) test asserts `SQL_TARGET.ruleOrder` (the JSON), not a lib constant — making the JSON the single source of truth with automated verification. The lib `RULE_ORDER` constant is additionally asserted equal to the JSON as a cross-check.
- The Slack AC-1/AC-2 run-path test in `spec-cover-workflow.test.mjs` is genuinely non-vacuous: before the fix, the hardcoded `RULE_ORDER` and `null` comparison would cause the Slack over-rejection to be labeled `unrecognized-rule` (not `over-rejection`), so the test would have failed on the pre-change code. This is the correct red-first proof.
- `slacksignatureverifier.json` correctly includes GOLD-13..18 only (6 ids), 5-value `ruleOrder` (rejection outcomes only; `Valid` in `okValue`), own isolated assembly `KnowledgeGateway.SpecHarness.Slack.Tests`, and `_note` / `_okValueNote` / `_ruleOrderNote` explaining the design.
- `RULE_ORDER_CFG` defaults to `null`, not to `RULE_ORDER` — so an unconfigured SQL run still works via `labelRed`'s internal `r?.ruleOrder ?? RULE_ORDER` fallback, while an explicit pass of `_args.ruleOrder` (from the JSON) is the documented path. Clean layering.

## Gaps

- No automated test for the `unrecognized-rule` fallback with genuine off-order names (a rule name absent from `ruleOrder` and not equal to `okValue`). The logical path is verified by inspection and the existing case coverage, but a regression on the fallback would not be caught by the test suite. Follow-up for Inc-3, not a blocker.
- Steps 4–6 runbooks exist in `implementation.md` as plan-sanctioned operator-owed deliverables. AC-3/AC-4/AC-5 remain outstanding on the operator track. Reviewed as runbooks only (scope per instructions).

## Open Questions

None.

## Carry-Over Finding Dispositions

| Title | Status | Evidence |
|-------|--------|----------|
| 4 pre-existing test failures | **Confirmed pre-existing** | `node scripts/selfcheck.mjs` fails check 1 with "4 failing" — same 4 (nexus-cpp CHANGELOG + 3 gen-omni); the 36 spec-diff/spec-cover tests pass independently. Out of scope. |
| Sync guard normalizes (no literal byte-identity) | **Confirmed LOW** | Normalization strips only standalone comment lines (`t.trim().startsWith('//')`). Mixed code+comment lines are preserved. Code-level changes are always caught. Selfcheck check 5 passes: "lib and inline copy in sync". LOW rating is correct. |

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| spec-diff tests | PASS | `node --test tests/unit/spec-diff.test.mjs tests/unit/spec-cover-workflow.test.mjs` | 36 pass, 0 fail |
| sync guard (selfcheck check 5) | PASS | `node scripts/selfcheck.mjs` | `[PASS] spec-diff inline-copy sync — lib and inline copy in sync` |
| `plugins/` unchanged | PASS | `git status --short -- plugins/` | (no output — no plugin changes) |
| pre-existing failures | CONFIRMED | `node scripts/selfcheck.mjs` | `[FAIL] tests (lint + unit) — 4 failing` (same 4 as documented, out of scope) |

*Status: COMPLETE — reviewer, 2026-06-30*
