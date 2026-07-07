# php-mutation-and-test-tooling

## What report formats does Infection emit, and does any logger produce a Stryker/mutation-testing-elements schema JSON with per-mutant status+file+line, or must I translate Infection's own JSON log?

**Verdict:** Infection emits text/html/summary/summaryJson/json/perMutator/github/gitlab loggers plus a `stryker` dashboard config; its `json` logger is Infection's OWN format (not the Stryker schema), so a consumer must translate it — no logger writes a standalone `mutation-testing-report-schema.json` to disk.
**Evidence tier:** read-docs
**As-of:** 2026-07-06
**Validity scope:** Infection ~0.3x line, mid-2026; infection.json5 `logs` schema
**Status:** current
**Reconfirm trigger:** Infection ships a native Stryker mutation-testing-report-schema file logger, or JsonLogger.php field names change
**Corroboration:** 5 sources; second independent source agreed (Stryker's own stryker-mutator.io blog independently confirms Infection has no native schema logger and "will support the mutation testing report schema in the future")

## Verdict
Infection does not emit a Stryker-schema-family per-mutant JSON file. Its `json` logger is a proprietary shape carrying per-mutant file+line+diff data; consumers wanting the mutation-testing-elements schema must translate from that log (or scrape the HTML report's embedded data).

## Finding
- Infection's `logs` config accepts these logger keys: `text`, `html`, `summary`, `summaryJson`, `json`, `perMutator`, `github`, `gitlab`, and `stryker` (with nested `badge`) [1][2].
- The `json` logger writes Infection's own machine-readable format containing "original, mutated code, diff and test framework output for each Mutant," not the Stryker report schema [1][2].
- Per-mutant fields in Infection's JSON log include `originalFilePath`, `originalStartLine`, `originalEndLine`, `originalStartColumn`, `diff`, and `processOutput` [3].
- The `html` logger renders a self-contained HTML file "based on Stryker Elements" (mutation-testing-elements), but it is an HTML artifact, not a standalone schema JSON file on disk [1][2].
- No Infection logger emits a standalone Stryker `mutation-testing-report-schema.json`; Stryker's team documented that Infection "will support the mutation testing report schema in the future" [4][5].
- Infection's status vocabulary is Killed / Escaped / Errored / Timed Out / Skipped / Not Covered, differing in naming from Stryker's Killed / Survived / Timeout / NoCoverage (Escaped≈Survived, Not Covered≈NoCoverage) [2][5].

## Fix
- Translate Infection's `json` log into the mutation-testing-report-schema, mapping Escaped→Survived and Not Covered→NoCoverage [4][5].
- Read `originalFilePath` + `originalStartLine` (and end line/column) from the JSON log to reconstruct per-mutant file+line locations [3].
- Treat any JSON embedded in the `html` report as an undocumented internal detail, not a supported file logger, if you extract it [1][4].

## Alternatives
- Use the `stryker` logger to push results to the Stryker dashboard for a hosted HTML report + badge, but this uploads to a cloud service rather than writing a local schema JSON [1][2].
- Use `gitlab` (Code Climate) or `github` loggers when only CI annotations are needed rather than a per-mutant schema [1][2].

## Caveat
The exact top-level array keys of Infection's JSON (escaped/killed/errored/timeouted/notCovered/ignored plus a `stats` block) are inferred from the summary categories and field-level JsonLogger evidence, not from a published JSON schema.

## Fallback
If Infection's JSON shape shifts, diff JsonLogger.php and re-derive fields; if a native Stryker-schema logger later ships, prefer it over hand translation.

## Sources
[1] https://infection.github.io/guide/usage.html
[2] https://github.com/infection/site/blob/master/src/guide/usage.md
[3] https://github.com/infection/infection/commit/1e584ea134a1bd3065c1305e14fe3382b30eb2a9
[4] https://stryker-mutator.io/blog/one-mutation-testing-html-report/
[5] https://github.com/stryker-mutator/mutation-testing-elements/blob/master/packages/report-schema/src/mutation-testing-report-schema.json

## Recommendation
Build the adapter to read Infection's `json` logger and translate to the Stryker schema; probe JsonLogger.php for the authoritative top-level array keys before finalizing the mapping.

## Can Infection pin mutation scope to ONE source file from the CLI, and does the filter restrict which files are MUTATED or which tests run?

**Verdict:** Yes — pass the file as a positional argument (or the now-deprecated `--filter=<path>`); it restricts which source files are MUTATED (and coverage collected), while the full test suite still runs for the initial sanity check.
**Evidence tier:** read-docs
**As-of:** 2026-07-06
**Validity scope:** Infection ~0.3x CLI; `--filter` deprecated in favor of positional args
**Status:** current
**Reconfirm trigger:** Infection removes the deprecated `--filter`, or changes positional-argument targeting semantics
**Corroboration:** 3 sources; second independent source agreed (alejandrocelaya.blog independently corroborates that `--filter` applies mutations only to the passed files while the full suite still runs)

## Verdict
Single-file CLI targeting is supported. The filter narrows mutation (and coverage collection) to the named file(s); it does not narrow which tests run — the initial full-suite check always executes.

## Finding
- Infection can pin mutation scope to one file from the CLI via `infection --filter=src/Service/Mailer.php`, and also accepts a comma-separated list [1][2].
- `--filter` restricts which source files are MUTATED and "in no way restricts the initial Infection check on the overall test suite, which is still executed in full" [1][2].
- `--filter` is deprecated; the documented replacement is positional arguments, e.g. `infection src/Service/Mailer.php` [2].
- An independent write-up confirms `--filter` "gets applied only to" the passed files while all tests still run beforehand [3].
- `--git-diff-filter` scopes mutation to files from `git diff` (e.g. `AM` = added+modified, `A` = added only), and `--git-diff-base` sets the diff base branch [1][2].

## Fix
- To mutate exactly one target file, pass it as a positional argument (preferred) or `--filter=<path>`; expect the full suite to still run once for the initial check [1][2].
- Verify the resolved file set with `infection config:list-sources --filter=<path>` before a long run [1].

## Alternatives
- Static config `source.directories` / `source.excludes` narrows the mutable set persistently, but that is config, not per-invocation CLI targeting [1].
- `--git-diff-filter` / `--git-diff-base` targets changed files in CI instead of a hardcoded single path [1][2].

## Caveat
The filter narrows mutation and coverage collection only; it does not skip the initial full test-suite run, so single-file targeting is not fully independent of the rest of the suite.

## Fallback
If `--filter` is removed in a future major, switch to positional file arguments (already the recommended form).

## Sources
[1] https://infection.github.io/guide/command-line-options.html
[2] https://github.com/infection/site/blob/master/src/guide/command-line-options.md
[3] https://alejandrocelaya.blog/2018/02/17/mutation-testing-with-infection-in-big-php-projects/

## Recommendation
Use a positional path argument for single-file targeting; reserve `--filter` for older Infection lines, and pre-check with `config:list-sources`.

## What are Infection's coverage-driver and version requirements as of mid-2026 (PCOV vs Xdebug vs phpdbg, min PHP, PHPUnit 11/12, Pest)?

**Verdict:** Current Infection requires PHP ^8.3 and one of Xdebug/phpdbg/PCOV; it drives PHPUnit (11 and 12 supported) with no runtime PHPUnit constraint, supports Pest via a PestAdapter, and PCOV is the fastest driver (line-only) while Xdebug is ~2.8x slower but richer.
**Evidence tier:** read-docs
**As-of:** 2026-07-06
**Validity scope:** Infection current/master line (composer `php: ^8.3`); PHPUnit 11/12; Pest via PestAdapter; PCOV/Xdebug/phpdbg drivers
**Status:** current
**Reconfirm trigger:** Infection bumps its PHP floor past 8.3, drops/adds a PHPUnit major, or changes supported coverage drivers
**Corroboration:** 5 sources (Infection installation docs, Infection composer.json, PestAdapter issue, php.watch coverage comparison, thePHP.cc)

## Verdict
As of mid-2026, run current Infection on PHP 8.3+ with a coverage driver enabled. PHPUnit 11/12 and Pest are all supported; pick PCOV for speed and Xdebug for feature completeness.

## Finding
- Infection requires a coverage driver: Xdebug, phpdbg, or PCOV must be enabled [1].
- The current Infection line requires PHP `^8.3` (older Infection releases supported down to PHP 7.x) [2][1].
- Infection has no runtime PHPUnit constraint and targets PHPUnit at `^12.5.29` in dev, so PHPUnit 11 and 12 are both supported [2].
- Pest is supported via a dedicated PestAdapter in Infection, alongside bundled PHPUnit, PhpSpec, Codeception, and Testo [1][3].
- PCOV is the fastest coverage driver (line coverage only, no branch/path coverage); Xdebug is ~2.8x slower but more featureful and more accurate; phpdbg ships with PHP and also lacks path coverage [4][5].

## Fix
- Use PCOV for the fastest Infection coverage collection when only line coverage is required [4][5].
- Fall back to Xdebug when richer/more accurate coverage is needed or PCOV is unavailable, accepting the slowdown [4][5].
- Ensure PHP >= 8.3 for the current Infection line; pin an older Infection release if constrained to PHP 7.x/8.0-8.2 [2][1].

## Alternatives
- phpdbg is a valid driver option but is the least recommended (no path coverage, known closure-coverage limitations) [1][4].
- Precomputed coverage can be supplied via `--coverage` to reuse an existing report instead of a live driver [1].

## Caveat
The `^8.3` floor reflects Infection's current/master release line; a specifically pinned older Infection version may allow a lower PHP. PHPUnit support tracks the adapter, so a brand-new PHPUnit major may lag briefly.

## Fallback
If a PHPUnit major is unsupported, pin PHPUnit/Infection to a known-good pair or wait for the adapter update; if PCOV misbehaves, switch to Xdebug.

## Sources
[1] https://infection.github.io/guide/installation.html
[2] https://raw.githubusercontent.com/infection/infection/master/composer.json
[3] https://github.com/infection/infection/issues/1795
[4] https://php.watch/articles/php-code-coverage-comparison
[5] https://thephp.cc/articles/pcov-or-xdebug

## Recommendation
Standardize on PHP 8.3+ with PCOV and current Infection; confirm the PestAdapter path if the target suite uses Pest.

## Is there a maintained QuickCheck-style property-based testing library for PHP usable as a generated-test API?

**Verdict:** Yes — giorgiosironi/eris is healthily maintained (v1.1.0, 2026-03-31), requires PHP ^8.1, and supports PHPUnit ^10 through ^13.
**Evidence tier:** read-docs
**As-of:** 2026-07-06
**Validity scope:** eris 1.1.0; PHP ^8.1; PHPUnit ^10 || ^11 || ^12 || ^13
**Status:** current
**Reconfirm trigger:** eris has no release for ~12+ months, or drops the PHPUnit/PHP versions you rely on
**Corroboration:** 2 sources (GitHub repo + Packagist)

## Verdict
giorgiosironi/eris is a maintained QuickCheck/property-based testing port for PHP+PHPUnit and is a suitable generated-test API as of mid-2026.

## Finding
- giorgiosironi/eris is a QuickCheck-style property-based testing library for the PHP/PHPUnit ecosystem [1][2].
- Its latest release is 1.1.0 (2026-03-31), i.e. recent activity as of mid-2026 [2].
- It requires PHP `^8.1` and supports PHPUnit `^10.0.4 || ^11.0 || ^12.0 || ^13.0` [2].
- It has broad adoption (~1.45M installs, ~78 dependents), indicating a healthy dependency [2].

## Fix
- Adopt giorgiosironi/eris as the generated-test / property-based API, integrating via its PHPUnit TestCase trait [1].
- Target PHP 8.1+ and PHPUnit 10-13 to stay inside eris's supported matrix [2].

## Alternatives
- eris is a direct QuickCheck/PHPUnit port, making it the natural generated-test API for this stack [1].
- No healthier-maintained QuickCheck-style PHP alternative surfaced in this search [no source found].

## Caveat
eris is PHPUnit-oriented; using it under Pest relies on Pest's PHPUnit compatibility layer rather than a native Pest integration.

## Fallback
If eris stalls, re-check its release cadence, consider hand-rolled generators, and re-survey Packagist for newer PBT libraries.

## Sources
[1] https://github.com/giorgiosironi/eris
[2] https://packagist.org/packages/giorgiosironi/eris

## Recommendation
Adopt eris; reconfirm maintenance if no release appears for roughly 12+ months.

## Are there PHP-specific equivalent-mutant or kill-masking traps (analogous to C/C++ exit()/abort() masking), and what timeout/ignore mechanisms does Infection provide?

**Verdict:** Infection documents general equivalent/harmless-mutant and timeout traps and provides ignore mechanisms (`ignoreSourceCodeByRegex`, `@infection-ignore-all`, `timeoutsAsEscaped`, `maxTimeouts`); a specific die()/exit()-in-code-under-test masking analog to C/C++ exit()/abort() is NOT documented (unconfirmed).
**Evidence tier:** inferred
**As-of:** 2026-07-06
**Validity scope:** Infection ~0.3x config (ignoreSourceCodeByRegex, @infection-ignore-all, timeoutsAsEscaped, maxTimeouts)
**Status:** uncertain
**Reconfirm trigger:** Infection documents die()/exit() kill-masking behavior, or changes the timeout/ignore config keys
**Corroboration:** 3 sources for the documented ignore/timeout mechanisms; for the exit()/die() masking analog specifically: no source found (see Caveat)

## Verdict
The documented PHP traps are harmless/equivalent mutants (e.g. logging, assertions) and timeout masking, both handled via config. A dedicated exit()/die() kill-masking trap analogous to C/C++ is not documented and remains unconfirmed.

## Finding
- Infection acknowledges some mutants are harmless/false positives (e.g. calls to a logging function) and provides `ignoreSourceCodeByRegex` to suppress them globally or per-mutator (e.g. global `"$this->logger.*"`, per-mutator `"MethodRemoval": { "ignoreSourceCodeByRegex": ["Assert::.*"] }`) [1].
- Infection supports the `@infection-ignore-all` annotation at class, method, and statement level to suppress mutations at that scope [1].
- Timeout trap: a mutant that creates an infinite loop (e.g. `++`→`--` on a counter) is marked Timeout and counted as killed by default, treated as a positive result rather than escaped [3].
- Timeout handling is configurable: `timeoutsAsEscaped` counts timed-out mutants as escaped in the MSI, and `maxTimeouts` fails the build past a threshold — mitigating weak CI machines where would-be escapes masquerade as timeouts [2].
- Infection's own CLI process exits 0 regardless of the MSI score unless an internal error occurs, which is a separate concern from per-mutant kill detection [2].
- A PHP-specific die()/exit()-in-code-under-test masking trap directly analogous to C/C++ exit()/abort() (mutant forces process exit 0 and falsely "passes") was not found in Infection's documentation [no source found].

## Fix
- Suppress known equivalent/harmless mutants (logging, assertions) with `ignoreSourceCodeByRegex` instead of lowering the MSI threshold [1].
- Use `@infection-ignore-all` for targeted class/method/statement suppression where a mutant is provably equivalent [1].
- Set `timeoutsAsEscaped` and/or `maxTimeouts` in CI so slow machines cannot hide escapes behind timeouts [2].

## Alternatives
- Disable specific mutators entirely in config when a whole mutator class produces equivalent mutants for your codebase [1].
- Rely on the default timeout-as-killed behavior when CI machines are fast and stable [3].

## Caveat
Whether die()/exit() in code under test can falsely "pass" a mutant is undocumented for Infection; since Infection runs each mutant's tests in a separate process, a hard exit most plausibly yields an error/timeout rather than a silent pass, but this is inferred, not confirmed.

## Fallback
If a suspected equivalent mutant persists, inspect the diff manually and either ignore it (regex/annotation) or add a killing test; if exit()/die() masking is suspected, run that single mutant and inspect the actual process result.

## Sources
[1] https://infection.github.io/guide/how-to.html
[2] https://infection.github.io/guide/usage.html
[3] https://medium.com/@maks_rafalko/infection-mutation-testing-framework-c9ccf02eefd1

## Recommendation
Adopt `ignoreSourceCodeByRegex` + timeout config as standard hygiene; run a targeted single-mutant experiment if exit()/die() masking must be positively ruled out for your code.
