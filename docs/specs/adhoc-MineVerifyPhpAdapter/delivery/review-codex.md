# Cross-Check Review — adhoc-MineVerifyPhpAdapter

**Verdict:** NO-GO

## Findings

1. **HIGH** — `harness/php/composer.json.template:10`
`infection/infection` is left as `"*"`, but the entire PHP translation seam was authored against the **observed Infection 0.34.0 JSON shape** recorded in `docs/specs/adhoc-MineVerifyPhpAdapter/delivery/probe-report.md:20,56-111` and restated in `harness/php/cover-php-contract.md:13-15,109-115`. That means a fresh workspace install can legally resolve a later Infection release whose top-level groups or `stats` keys differ from the probed map, silently invalidating `INFECTION_STATUS_MAP` in `harness/cover-php.workflow.js` before Steps 6/7 ever run. This is a blocking deterministic defect on the core correctness surface the adapter depends on. Pin the template to the probed Infection line and update probe/workflow together when that pin changes.

2. **LOW** — `harness/cover-php.workflow.js:153-156`
The gate battery is not byte-identical to `harness/cover.workflow.js` except for the sanctioned disable-regex swap. The inserted four-line PHP-specific comment block inside the copied section means the thin-fork contract is already drifted beyond the regex identifier/value change, which defeats the plan’s stated “diff-checkable / byte-identical” acceptance for this surface. Runtime behavior is unchanged here, but the file no longer satisfies the mechanical sync invariant it claims to preserve.

3. **LOW** — `tests/unit/workflow-contract.test.mjs:147-154,1616-1620`
The Step-5 extension does add `COVER_PHP_PATH` to the shared **meta-purity** loop, but there is still no corresponding direct `hasStaticImport(...)` assertion for `cover-php`. The plan and implementation record both describe a shared static-import/meta-purity loop site; the current file only provides the meta-purity half, with static-import coverage for `cover-php` left implicit via the sandbox-run test. That is weaker than the documented contract for the named extension site.

## Checked Clean

- `harness/cover-php.workflow.js`’s `INFECTION_STATUS_MAP` matches the observed group-key/status map in `probe-report.md`, including `killedByStaticAnalysis -> Killed`, `syntaxErrors -> CompileError`, and stats-only `skipped`.
- The PHP sandbox fixtures in `tests/unit/workflow-contract.test.mjs:1535-1587` are correctly PHP-shaped for this adapter: translated `mutants`, `mutationSummary`, `mutatedFiles`, equivalent-survivor exclusion, and the `mutant-count-mismatch` fail-closed path.
- `harness/php/cover-php-contract.md`, `harness/php/infection.json5.template`, `harness/php/phpunit.xml.template`, `harness/php/Dockerfile`, and `harness/php/examples/calculate_reference_period_seed_test.php` are internally consistent on the native-fs runner shape and the observed Infection report structure.

## Verification Note

I attempted to run `node --test tests/unit/workflow-contract.test.mjs`, but this sandbox blocks child-process spawning (`spawn EPERM`), so the review is code-and-diff grounded rather than execution-verified.
