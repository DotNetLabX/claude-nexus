# Codex Review - adhoc-MvcSuiteFidelity

**Verdict: NO-GO** - the categorical-KEEP filter and skip renderer are present, but the activation gate undercounts suites that legally contain skipped tests and the `categoricalKeep` contract still fails open when the agent omits that field.

## Findings

| Severity | File | Line(s) | Issue description | Suggested fix |
|---|---|---:|---|---|
| major | `harness/loop-flutter.workflow.js`; `harness/cover-flutter.workflow.js` | `loop-flutter: 475-480`; `cover-flutter: 54-57, 129-132, 224, 448-456` | The activation gate uses `const generated = coverResult.gates?.suite_green?.detail?.runs?.[0]?.passed ?? null`, but the upstream `suiteGreen()` detail only preserves `{ passed, failed }`: `return { pass: everyGreen, detail: { runs: runs.map((r) => ({ passed: r.passed, failed: r.failed })) } };`. At the same time, `noNewSkips()` and `all-gates-green` still allow skipped tests whenever `BASELINE_SKIPS` is non-zero (`const BASELINE_SKIPS = _args.baselineSkips ?? 0`; `pass: maxSkips <= baselineSkips`; `const allGreen = Object.values(gates).every((g) => g.pass)`). That makes the plan's claim in `plan.md:42` - `"on the all-gates-green path passed == total suite size"` - false in real code. Example: `passed=4`, `skipped=1`, `distinctRules=3`, `margin=1` skips at `4 <= 4` even though the suite actually has 5 tests and should still run Minimize. | Carry an explicit total generated-test count from `runRaw.testRuns` into the cover result, or compute `passed + failed + skipped` before `suiteGreen()` drops `skipped`; gate on that total. Add a contract slice with non-zero `baselineSkips` / `skipped` so this cannot regress silently. |
| major | `harness/loop-flutter.workflow.js` | `245-262, 494` | `MINIMIZE_PROPOSAL_SCHEMA` declares `categoricalKeep: { type: 'boolean' }` but does not require it: `required: ['testName', 'killsMutants', 'subsumedBy', 'documentsDistinctRule']`. The removal filter then treats a missing flag as removable: `const toRemove = candidates.filter((c) => !c.documentsDistinctRule && !c.categoricalKeep)`. `implementation.md:36-37` explicitly endorses this (`"NOT in required, so old proposals still validate and !c.categoricalKeep is true when absent"`). That leaves the F1 guard fail-open on any partial or legacy proposal shape: a true keeper with `documentsDistinctRule:false` is removed if the model forgets to emit `categoricalKeep`. | Make `categoricalKeep` required, or reject / hold back any candidate missing either keep flag before computing `toRemove`. Add a contract slice where `categoricalKeep` is absent and assert the workflow fails closed instead of trimming. |
| minor | `tests/unit/workflow-contract.test.mjs` | `1343-1375` | Slice (b) genuinely exercises the skip path, but it does not fully prove the Step-4b claim. The assertions are `assert.equal(result?.minimize?.skipped, 'at-rule-floor')`, `!minimize-propose`, `!minimize-apply`, and a report-line match for `minimized: skipped`. It never literally asserts `"zero removals,"` and its fixture uses only `runs: [{ passed: 4, failed: 0 }, ...]`, so it cannot detect the skipped-test undercount above. | Keep the current assertions, add an explicit no-removal / no-confirm assertion, and add a second activation-gate case with `skipped > 0` and `baselineSkips > 0` so the gate is forced to use total generated tests rather than `passed` alone. |
| minor | `harness/loop-flutter.workflow.js` | `496-498, 687` | The zero-removal path misreports categorical-KEEP-only proposals. When `toRemove.length === 0`, the log says `Minimize: no removal candidates (nothing redundant, or every candidate documents a distinct rule).` and the report says `minimized: removed 0 tests - no redundant tests proposed (nothing categorically dead, and every mutation-redundant candidate documented a distinct rule).` That is false for slice (a)'s shape, where the survivor has `documentsDistinctRule:false` and `categoricalKeep:true`. | Split the no-removal outcome into at least three cases: empty proposal, kept by `documentsDistinctRule`, and kept by `categoricalKeep`; render/log the matching reason instead of attributing all zero-removal cases to distinct-rule coverage. |

## Contract Slices

### Slice (b) - activation-gate skip

**Refute as a complete proof; confirm as a partial proof.**

The test at `tests/unit/workflow-contract.test.mjs:1343-1375` does hit the intended branch:

- it extends `suite_green.detail.runs` with `runs: [{ passed: 4, failed: 0 }, ...]`,
- it asserts `result?.minimize?.skipped === 'at-rule-floor'`,
- it asserts the minimize agent is not spawned (`!minimize-propose`),
- and it asserts the report uses the skip form instead of `removed 0 tests`.

That is enough to prove the happy-path skip wiring exists.

It is not enough to prove the full behavioral claim from `plan.md:117-118`, because:

- it never literally asserts `"zero removals,"`
- it never asserts `minimize-confirm-run` is absent,
- and it cannot catch the `passed` vs total-suite-size bug because the fixture has no `skipped` tests.

### Slice (c) - discriminator / categorical-KEEP coexistence

**Confirm for the orchestrator filter; refute if read as a proof of the agent-side classifier.**

The test at `tests/unit/workflow-contract.test.mjs:1314-1340` does prove the downstream discriminator/coexistence behavior:

- both candidates have `documentsDistinctRule:false`,
- one has `categoricalKeep:true`,
- one has `categoricalKeep:false`,
- and the assertions verify that only the false case reaches `minimize-apply` (`assert.match(applyCall.promptFull, /fake boundary test/)` and `assert.doesNotMatch(applyCall.promptFull, /no-match no-op test/)`).

That is a real proof that the orchestrator-level filter at `harness/loop-flutter.workflow.js:494` keeps the two categories from colliding.

What it does **not** prove is that the minimize agent will classify real tests correctly, because the proposal is mocked by design. The prompt-level discriminator lives in `harness/loop-flutter.workflow.js:311-321`, and slice (c) never inspects or executes that classification logic.

### Slices (a) and (d)

Slices (a) (`1298-1311`) and (d) (`1378-1399`) do match their stated goals: (a) proves a `categoricalKeep:true` candidate is not removed, and (d) proves an ordinary `categoricalKeep:false` / `documentsDistinctRule:false` candidate still flows through confirm.

## Checks Run

- `node --check harness/loop-flutter.workflow.js` - passed.
- `node --test --test-isolation=none tests/unit/workflow-contract.test.mjs` - passed (`52/52`).
