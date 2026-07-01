# Spec-driven Cover: live validation + generalize off the single validator (Increment 2) — Implementation

## Files Created

- `harness/targets/slacksignatureverifier.json` — Step 3: Slack target config with GOLD-13..18 ids only, 5-value `ruleOrder` (MissingSecret→MissingSignature→MissingOrInvalidTimestamp→TimestampOutOfRange→InvalidSignature), `okValue: "Valid"`, own isolated assembly `KnowledgeGateway.SpecHarness.Slack.Tests`, source + product project paths, ADR-C sequestration `_note`.

## Files Modified

- `harness/targets/generatedsqlvalidator-l272-fixture.json` — Step 1: re-grounded both arms to explicit committed SHAs (`preFixArm: "9e40d1f"`, `patchedArm: "0811132"`); removed `git stash` dependency; added top-level `_note` stating Inc-1 stash runbook is superseded (fix is committed at `0811132`); finding referenced by symbol `NoStrayLiteralThreshold`, line-qualified "(L272 at 9e40d1f; L276 at 0811132)".

- `harness/lib/spec-diff.mjs` — Step 2(a): added `okValue` parameter to `labelRed` (`const okValue = r?.okValue !== undefined ? r.okValue : null`); case 3 (sin-of-omission) and case 4 (over-rejection) now compare against `okValue` instead of literal `null`, enabling enum pass-sentinels (`"Valid"` for Slack). Backward compat preserved — SQL callers that omit `okValue` default to `null`. Updated JSDoc with ADR-E reference.

- `harness/spec-cover.workflow.js` — Step 2(b/c/e): (1) inline `labelRed` made byte-identical to lib (added missing blank lines and case comments for sync guard to pass); (2) added `RULE_ORDER_CFG` and `OK_VALUE` constants in the config section, sourced from `_args.ruleOrder` and `_args.okValue`; (3) updated spec-load prompt rule-names to `(RULE_ORDER_CFG ?? RULE_ORDER).join(', ')` instead of hardcoded SQL names; (4) updated the `labelRed` call at `:571` to pass `ruleOrder: RULE_ORDER_CFG, okValue: OK_VALUE` instead of the hardcoded `RULE_ORDER` constant.

- `tests/unit/spec-diff.test.mjs` — Step 2 TDD: (1) added `SQL_TARGET` load from `generatedsqlvalidator.json` and `SLACK_RULE_ORDER` constant; (2) rewrote "RULE_ORDER matches source" test to assert `SQL_TARGET.ruleOrder` (the JSON is the source of truth; AC-1(a)); (3) added Slack over-rejection test (AC-2): `expected: "Valid"`, `actual: "TimestampOutOfRange"`, `okValue: "Valid"` → `over-rejection`/`candidate-bug`; (4) added Slack sin-of-omission test (AC-2): `expected: "InvalidSignature"`, `actual: "Valid"` → `sin-of-omission`/`candidate-bug`; (5) added backward-compat test (SQL `expected: null` path unchanged); (6) added Slack case 1 and case 2 tests against the 5-value Slack order.

- `tests/unit/spec-cover-workflow.test.mjs` — Step 2 TDD: added `slackSpecLoadFixture()`, `slackRunnerFixture()`, `slackFixtures()`, `SLACK_ARGS` (with `ruleOrder`, `okValue: "Valid"`, GOLD-13..18, `targetClass: "SlackSignatureVerifier"`); added AC-1/AC-2 run-path test asserting Slack enum over-rejection (`expected: "Valid"`, `actual: "TimestampOutOfRange"`) reaches `candidate-bug` queue as `over-rejection` — the workflow-level (run-path) proof for AC-1/AC-2. Test was first confirmed RED (workflow returned `unrecognized-rule`) then GREEN after workflow changes.

- `scripts/selfcheck.mjs` — Step 2(d): added `readFileSync` import; added `spec-diff inline-copy sync` gating check (check 5, before the informational salience report); check extracts all 7 shared functions (`decideLocation`, `evaluateMinerResult`, `ruleKey`, `classifyRule`, `diffRules`, `serializeDiff`, `labelRed`) from both `spec-diff.mjs` and the inline block in `spec-cover.workflow.js` using paren-depth scanning + brace counting; normalizes by stripping comment-only lines and blank lines before comparing (catches code-level divergence while ignoring comment-only differences between the lib's verbose inline comments and the workflow's stripped copy). Updated check numbering comment header to include check 5.

## Key Decisions

- **Normalization in sync guard (vs. literal byte comparison):** The lib's functions carry more inline comments than the inlined workflow copy (the lib has `// Case 1 —`, `// Case 2 —`, `// Defensive:`, `// headline item...`, `// code ∧ ¬spec...`, etc.). Making every function literally byte-identical would require adding all comments to the workflow too. Instead, the sync guard normalizes by stripping comment-only lines and blank lines before comparing — this catches actual code changes without requiring the workflow to carry the full lib documentation. The `labelRed` function was made comment-identical (so both normalizations match); the other 6 functions match after normalization. Verified: all 7 functions pass the guard.

- **`RULE_ORDER` constant kept in lib (backward compat):** `spec-diff.mjs` still exports the SQL `RULE_ORDER` constant so any existing caller that hasn't migrated to passing `_args.ruleOrder` continues to work. The `labelRed` function uses it as the fallback when `r?.ruleOrder` is absent. The AC-1(b) move is in the workflow's run-path (`:571` no longer hardcodes `RULE_ORDER`) — the lib constant is not the forbidden artifact, the hardcoded run-path call was.

- **Slack fixture has 4 agents (no miner):** The `slackFixtures()` helper in the workflow test builds a 4-element agent sequence (spec-load, spec-cover, runner, report-write) with no miner agent, because all Slack rules have `codeAttestation` (the `decideLocation` path returns `route: 'located'` for all, so no miner-needed rule enters the miner branch). This matches the SQL fixture's shape for attested rules.

- **`slacksignatureverifier.json` uses `isolatedAssembly` as a directory path (not project name):** Following `generatedsqlvalidator.json`'s pattern, the `isolatedAssembly` field holds the absolute directory path to the test project, not just the project name. The operator creates this assembly in Step 5.

- **Workflow `RULE_ORDER_CFG` defaults to `null`, not the SQL constant:** `const RULE_ORDER_CFG = _args.ruleOrder ?? null` — when `null`, `labelRed`'s `r?.ruleOrder ?? RULE_ORDER` fallback picks up the lib's SQL constant, preserving backward compatibility for SQL runs that don't pass `ruleOrder` in `_args`. Explicit pass of `_args.ruleOrder` (from the target JSON) is the expected path for any new target.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Plan: `Skill: None`, `TDD: no` — fixture JSON update only |
| 2 | `nexus:tdd` | Plan: `Skill: None`, `TDD: yes`. Invoked per TDD mandatory rule. Red→Green on `spec-diff.test.mjs` Slack cases; Red confirmed then Green on `spec-cover-workflow.test.mjs` Slack-args AC-1/AC-2 run-path test. |
| 3 | None | Plan: `Skill: None`, `TDD: no` — target config JSON creation only |
| 4 | None | Operator-owed step — runbook only (see Deviations) |
| 5 | None | Operator-owed step — runbook only (see Deviations) |
| 6 | None | Operator-owed step — depends on Steps 4+5 live outputs |

## Deviations from Plan

- **Steps 4, 5, 6 — written as runbook only, not executed (plan-sanctioned).**  
  OPERATOR ACTION REQUIRED. The live .NET toolchain + KG git checkout required by Steps 4 and 5 are outside the pipeline's no-KG-git-writes boundary. The plan explicitly designates these as operator-owed. The developer's deliverable is the runbook in `implementation.md`; the operator executes and results land in `harness/.runs/`. Step 6 (validation report) depends on Steps 4 and 5 live outputs.

  **Step 4 runbook — Live two-arm AC-6 run on `GeneratedSqlValidator`:**
  ```
  # Pre-fix arm (L272: > 0.01, no tolerance fix)
  git -C D:\src\knowledge-gateway checkout 9e40d1f -- src\Services\KnowledgeGateway\KnowledgeGateway.API\Features\TextToSql\GeneratedSqlValidator.cs
  # Arm-sanity: confirm SUT contains "> 0.01" and NOT "> 0.01 + 1e-9":
  findstr /n "0.01" D:\src\knowledge-gateway\src\Services\KnowledgeGateway\KnowledgeGateway.API\Features\TextToSql\GeneratedSqlValidator.cs
  # Run spec-cover workflow with SQL target config:
  # node harness/run-workflow.mjs harness/spec-cover.workflow.js harness/targets/generatedsqlvalidator.json
  # Expected: candidate-bug red with actual === "NoStrayLiteralThreshold" (case-4 over-rejection)
  # Results land in harness/.runs/

  # Patched arm (L276: > 0.01 + 1e-9, tolerance fix committed at 0811132)
  git -C D:\src\knowledge-gateway checkout 0811132 -- src\Services\KnowledgeGateway\KnowledgeGateway.API\Features\TextToSql\GeneratedSqlValidator.cs
  # Arm-sanity: confirm SUT contains "> 0.01 + 1e-9":
  findstr /n "1e-9" D:\src\knowledge-gateway\src\Services\KnowledgeGateway\KnowledgeGateway.API\Features\TextToSql\GeneratedSqlValidator.cs
  # Run spec-cover workflow again
  # Expected: known-answer input |0.86 - 0.85| flips GREEN (NoStrayLiteralThreshold no longer fires)
  # Results land in harness/.runs/

  # Restore to current HEAD (validator is byte-identical at 0811132 and HEAD, so this is a no-op in practice)
  git -C D:\src\knowledge-gateway checkout HEAD -- src\Services\KnowledgeGateway\KnowledgeGateway.API\Features\TextToSql\GeneratedSqlValidator.cs
  ```

  **Step 5 runbook — Live generalization run on `SlackSignatureVerifier`:**
  ```
  # Ensure KnowledgeGateway.SpecHarness.Slack.Tests project exists (create if not):
  # dotnet new xunit -o D:\src\knowledge-gateway\src\Services\KnowledgeGateway\KnowledgeGateway.SpecHarness.Slack.Tests
  # Add project reference to KnowledgeGateway.API.csproj:
  # dotnet add D:\src\knowledge-gateway\src\...\KnowledgeGateway.SpecHarness.Slack.Tests reference <KnowledgeGateway.API.csproj>

  # Run spec-cover workflow with Slack target config:
  # node harness/run-workflow.mjs harness/spec-cover.workflow.js harness/targets/slacksignatureverifier.json
  # _args: {
  #   ruleOrder: ["MissingSecret","MissingSignature","MissingOrInvalidTimestamp","TimestampOutOfRange","InvalidSignature"],
  #   okValue: "Valid",
  #   goldenIds: ["GOLD-13","GOLD-14","GOLD-15","GOLD-16","GOLD-17","GOLD-18"],
  #   targetClass: "SlackSignatureVerifier"
  # }
  # Expected: green-subset mutation score >= floor; every GOLD-13..18 rule in exactly one diff axis (spec-only);
  # reds (if any) labeled with enum value names keyed off okValue: "Valid"
  # Results land in harness/.runs/
  # RECORD: run completed with NO edit to spec-cover.workflow.js / spec-diff.mjs beyond Step 2
  # (config + ruleOrder + okValue drove it) — this is the AC-1/AC-2 live evidence
  ```

  **Step 6 — Cross-class validation report (after Steps 4+5):**
  Write `docs/specs/adhoc-SpecDrivenCoverValidate/delivery/validation-report.md` with:
  - Per class (SQL + Slack): did the live run produce the expected finding? Did the generalization hold on config alone (y/n)? False-positive rate (reds → real vs artifact). Inc-3 blockers (if any).
  - Explicit Inc-3 readiness verdict: is the spec-driven direction ready to graduate as a second front-end in `mine-verify-cover`?
  - Cite `.runs/` evidence files; name any blocker as an Inc-3 scope item.

- **Pre-existing test failures (4):** `node --test` reports 4 failing tests — `nexus-cpp: plugin.json is valid and CHANGELOG top entry matches its version`, and 3 `gen-omni` tests (`apply`, `--check`, `refuses to write a README…`). Confirmed pre-existing by stashing all my changes and running the suite: same 4 failures on HEAD. Not caused by this increment.

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| 4 pre-existing test failures | medium | architect | `node --test` 4 fail on HEAD before my changes (verified by `git stash` + rerun) | nexus-cpp CHANGELOG + 3 gen-omni tests; scope not touched by this increment |
| Sync guard normalizes (no literal byte-identity) | low | reviewer | `scripts/selfcheck.mjs` sync check; all 7 fns pass | The lib carries more inline comments than the inlined workflow copy; normalization (strip comment lines + blank lines) is used instead of literal equality. Code logic is identical; comments are informational only. |

*Status: COMPLETE (Steps 1–3 offline; Steps 4–6 operator-owed runbook) — developer, 2026-06-30*
