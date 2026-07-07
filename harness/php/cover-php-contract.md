# Cover-PHP adapter — toolchain contract

The PHP fill of the `mine-verify-cover` 5-capability adapter contract, driving
`harness/cover-php.workflow.js`. Mirrors the C++ adapter's contract doc and the Flutter fork. **Dev-repo
reference, not (yet) a shipped skill** — Step 8 graduates it to `mine-verify-cover-php`, baking in the
Step-1 probe-observed facts recorded here.

## The 5 capabilities, filled for PHP

| Capability | PHP fill |
|------------|----------|
| Evidence indexer | the miner reads the target `.php` directly (pure classes; no indexer tooling this pass) |
| Test runner | `phpunit` (PHPUnit 12) **inside the `mvc-php-probe` Docker image, on the container's native fs** — run twice for `suite_green` + `no_flaky` |
| Mutation tool | **Infection 0.34** via `vendor/bin/infection <target>` (positional single-file pin); its `json` logger is proprietary → the runner **TRANSLATES** it to the gate's Stryker-shaped `mutants` schema |
| Test-style contract | PHPUnit 12 class tests (`final class XTest extends TestCase`), Pest-compatible for the consuming repo; **eris** trait for property tests |
| Prod-source-diff scoping | `git diff -- <slice>` for `char_pin`; the only tolerated change is an `@infection-ignore-all` / ignore comment (`PHP_DISABLE_RE`) |

**The version pin moves together with the observed map (reviewer F1).** `composer.json.template`
pins `infection/infection` to `^0.34` — the Step-1 PROBED minor line (0.34.0, confirmed in
`workspace/composer.lock`), not `*`. The translation seam (`INFECTION_STATUS_MAP` in
`cover-php.workflow.js`) is authored against THIS version's observed json shape
(`delivery/probe-report.md`). **Rule:** the composer pin, `probe-report.md`'s observed status map, and
`INFECTION_STATUS_MAP` are one unit — bumping the pin to a new Infection minor/major requires
re-running the Step-1 probe and reconciling all three (never float the pin ahead of an observed map).

## Host reality (why Docker, and why native-fs)

Infection needs PHP ^8.3 + a coverage driver (PCOV/Xdebug/phpdbg); Windows has none of this uniformly.
The runner executes every command in the `mvc-php-probe` image (`php:8.4-cli` + PCOV + composer +
per-workspace Infection/PHPUnit/eris), built once from `harness/php/Dockerfile`.

**Run on the container's NATIVE filesystem, never over the bind mount** (Step-1 probe finding,
`delivery/probe-report.md`). PHP's autoloader reads thousands of `vendor/` files; over a Windows→Linux
bind mount that is ~20× slower (measured **0.42 s** test logic → **9.6 s** wall). Infection spawns one
PHPUnit subprocess **per mutant**, so on the bind mount every mutant exceeds the per-process timeout →
a **false 45/45 "Timed Out"**. Copy the workspace into `/native` first; the same run is then ~0.16 s /
~2.5 s and yields the genuine kill/escape map.

## Workspace layout (mounted to `/work`, copied to `/native` at run time)

The HOST workspace (default `harness/php/workspace`, mounted `-v "<host>:/work"`) is set up ONCE per
target before the first run:

```
workspace/
  composer.json        # require: the slice's NARROW deps (e.g. nesbot/carbon:^3); require-dev: phpunit ^12 + infection + eris
  phpunit.xml          # <source> drives PCOV coverage collection; testsuite globs tests/
  infection.json5      # source.directories:["src"]; json + summary loggers; timeout 30; ignoreSourceCodeByRegex slot
  src/   Actions/CalculateReferencePeriodAction.php   # the slice, COPIED in (read-only; consuming repo never edited)
  tests/ CalculateReferencePeriodActionSeedTest.php   # the seed pattern; <cover agent writes *HarnessTest.php here>
```

- `Dockerfile`, the four `*.template` files, and the seed example are vendored in `harness/php/`.
- The slice is **copied** from `D:\omnishelf\fmcg_platform\...` — the consuming repo stays pristine.
- PHPUnit **auto-discovers** every `tests/*Test.php` — no GLOB build step (the C++ CMakeLists analogue
  is unnecessary). The seed test and the Cover agent's `*HarnessTest.php` both run.

## Test style the Cover agent MUST follow

- **PHPUnit 12 class style:** `final class <Class>HarnessTest extends TestCase`, one `public function
  test…(): void` per rule boundary. Use `#[DataProvider]` (attribute) for boundary matrices. Assert on
  `execute()`'s **returned array** (`$result['from']` / `$result['to']`).
- **Pest-compatibility constraint:** the file lands in the consuming repo's `tests/` and runs under
  Pest's PHPUnit-compatibility layer — so use ONLY plain PHPUnit-class APIs (`TestCase`, `assertSame`,
  data-provider attributes, `expectException`). Do NOT use PHPUnit-internal/experimental APIs beyond
  what Pest's compatibility layer runs, and do NOT write Pest `it()`/`test()` closures (the harness
  generates PHPUnit classes; Pest runs them, not vice-versa).
- **eris property tests:** `use Eris\TestTrait;` in the class, `$this->forAll(Eris\Generator\…)` for
  invariants. Seed any randomness fixed. Property tests are OPTIONAL per target — add them for
  invariants a table can't express cheaply.

## Anti-trap assertion rules (carried from the C++ lessons)

**Assert structural INVARIANTS, not hand-computed values.** A suite of hand-typed expected dates is
brittle and over-fits; the mutation gate rewards invariants that a mutated comparison/arithmetic breaks.
For `CalculateReferencePeriodAction` specifically:

- **Period-length conservation:** the reference period spans the **same number of days** as the input
  range (`refPeriod length == input length`) — a mutated `subDays`/`+1`/`diffInDays` flips it.
- **Adjacency:** for the arbitrary (non-aligned) branch, the reference period ends the day **immediately
  before** the input starts (`refPeriod['to'] + 1 day == input from`).
- **Full-period shifts:** a full ISO week/month/quarter/year input maps to the **previous** full
  week/month/quarter/year (assert the previous period's exact start/end via Carbon, not a typed literal)
  — this pins the `isFullWeek`/`isFullMonth`/`isFullQuarter`/`isFullYear` boundary conditions and their
  `&&` sub-expressions (the mutators that dominate this class: `LogicalAnd*`, `IfNegation`, `Identical`).
- **Idempotence / monotonicity** on non-aligned ranges where it holds.
- **Exactly ONE hand-computed date case** — a single trivially-traceable example (e.g. the seed's
  `2024-01-08..2024-01-14 → 2024-01-01..2024-01-07`) as a human-readable anchor. Everything else is an
  invariant.

**Never assert to make coverage go up — assert to KILL mutants.** Pin every boundary the KB documents:
each `&&`, each `===`, each `isMonday`/`isSunday`/`isStartOf*`/`isEndOf*` predicate, the `+ 1` in
`diffInDays(...) + 1`, and the exact previous-period arithmetic.

## Equivalent-mutant hygiene (never "everything that survived")

Two distinct mechanisms, both reasoned per mutator-type × observability — never a blanket exclusion:

- **`ignoreSourceCodeByRegex`** (in `infection.json5`) — for **provably behavior-free** lines only
  (a mutation that cannot change any observable output, e.g. a log call). Per-mutator regex form.
- **`expectedSurvivorLines`** (workflow `_args`) — line numbers of survivors a behaviour-asserting test
  can NEVER kill, EXCLUDED from the reachable denominator (not chased). Justify each by mutator type +
  observability. For target #1 the expected list is `[]` (no known equivalents on this pure class);
  populate only with a reasoned entry when a live run surfaces a genuinely unobservable survivor.

## Timeout policy

Infection default: a timed-out mutant counts as **killed** (matches the gate's `Timeout`→killed
semantics). Do NOT set `timeoutsAsEscaped`. `timeout: 30` (seconds) in `infection.json5`. NB: with the
native-fs run (above) genuine timeouts are rare — a class with no loops produces none.

## Infection report → gate schema (TRANSLATION required — the Flutter-style fork)

Unlike mull/Stryker (consumed as-is), Infection's `json` log is proprietary: a mutant's status is the
top-level **array it sits in** (`killed`/`escaped`/`timeouted`/`uncovered`/`errored`/
`killedByStaticAnalysis`/`syntaxErrors`/`ignored`), and per-mutant fields are `mutator.{mutatorName,
originalStartLine,originalFilePath,…}` + `diff` + `processOutput` — there is NO per-mutant `status`.
The runner translates each group array into the gate's `{status, location:{start:{line}}, mutatorName,
replacement}` shape using the **probe-observed status map** in `delivery/probe-report.md`
(`killed`/`errored`/`killedByStaticAnalysis`→`Killed`, `escaped`→`Survived`, `timeouted`→`Timeout`,
`uncovered`→`NoCoverage`, `syntaxErrors`→`CompileError` [unscored], `ignored`/`skipped` excluded), and
carries the `stats` block as `mutationSummary` for the anti-fake-green cross-check
(`mutants.length === total − ignored − skipped`).

## Runner command sequence (native-fs — the Step-1 canonical form)

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "<host-ws>:/work" mvc-php-probe bash -c '
  set -e
  cp -r /work /native && cd /native
  vendor/bin/phpunit          # run 1  (suite_green + no_flaky)
  vendor/bin/phpunit          # run 2
  vendor/bin/infection src/Actions/CalculateReferencePeriodAction.php --no-progress --threads=4
  cp infection-log.json infection-summary.log /work/
'
```

Then read the host-side `infection-log.json`, translate, and return the schema'd result.

## Run invocation

```
Workflow({ scriptPath: "<abs>/harness/cover-php.workflow.js",
           args: { targetClass: "CalculateReferencePeriodAction",
                   kbRules: "<abs>/kb-calculate-reference-period.md" } })
```

Prereq: `docker build -t mvc-php-probe harness/php` once; the workspace set up as above; a verified KB
from Mine→Verify (Step 2, operator-owed).
