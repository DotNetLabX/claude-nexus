# Step 1 — PHP toolchain probe report (OBSERVED facts)

**Ran:** 2026-07-07, host Docker Desktop 4.49.0 (engine 28.5.1, linux/amd64), image `mvc-php-probe:latest`
(built from `harness/php/Dockerfile`: `php:8.4-cli` + PCOV + composer + per-workspace Infection/PHPUnit/eris).
**Workspace:** `harness/php/workspace/` (git-ignored) — the copied slice
`CalculateReferencePeriodAction.php` (+ `nesbot/carbon:^3`) + one hand-written seed test.

This report converts the research entry's **inferred** Infection JSON keys into **observed** ones
(`docs/kb/research/php-mutation-and-test-tooling.md` Q1 caveat). Step 3's translation seam and Step 5's
runner fixtures are authored against the tables below — **never** the inferred pre-commitment
(plan Step 1 Accept; critic L-2).

## Toolchain versions (observed)

| Tool | Observed |
|------|----------|
| PHP | 8.4.23 (cli, NTS), Zend OPcache 8.4.23 |
| Coverage driver | **PCOV** active (`php -m` lists `pcov`; **no Xdebug**) |
| PHPUnit | 12.5.31 |
| Infection | **0.34.0** |
| eris | installed via composer (`giorgiosironi/eris:^1.1`) — not exercised by the seed |

## THE BIND-MOUNT ANOMALY — diagnosed and resolved (the probe re-run)

The prior probe pass observed **45/45 mutants "Timed Out"** (0 Killed, 0 Escaped, MSI 100 purely via
timeouts) — a status map that never demonstrated the kill path (critic L-2). Diagnosed via the
`diagnose` skill:

- **Root cause:** the Windows→Linux **bind-mount I/O tax**. A bare PHPUnit run over the bind-mounted
  workspace measured **9.587 s wall** (`real`) for **0.420 s** of actual test time — a ~20× penalty,
  almost entirely `sys` time (PHP's autoloader reads thousands of `vendor/` files over the slow
  9p/virtiofs mount). Infection spawns a **fresh PHPUnit subprocess per mutant**; each pays that tax
  plus Infection's own overhead and blows past the per-process `timeout` (30 s) → every mutant is
  killed by the timeout wall. (The SUT has **no loops**, so no mutant can produce a genuine infinite
  loop — confirming the 45/45 timeouts were purely infrastructural, not real detections.)
- **Fix:** run PHPUnit + Infection on the container's **native filesystem**, not over the bind mount.
  Copy the mounted workspace in (`cp -r /work /native && cd /native`), run there, copy the two log
  files back out. On native fs the same bare PHPUnit run is **0.161 s** and the full Infection run is
  **2.5 s** — the tax is gone.
- **Result after the fix (the genuine status map, kill path demonstrated):**

  ```
  Total: 45 | Killed by Test Framework: 21 | Escaped: 24 | Timed Out: 0
  Errored: 0 | Killed by Static Analysis: 0 | Syntax Errors: 0 | Not Covered: 0 | Skipped: 0 | Ignored: 0
  Metrics: Mutation Code Coverage 100% | Covered Code MSI 46.67%
  ```

  **21 Killed + 24 Escaped observed for real.** (Timed Out is legitimately 0 — a loop-free SUT has no
  genuine timeout mutant; the translation map still documents `timeouted`→`Timeout` for classes that do.)

This native-fs requirement is **load-bearing** and is carried into the runner command sequence
(below), `harness/cover-php.workflow.js` (runner prompt), and `harness/php/cover-php-contract.md`.

## OBSERVED Infection JSON log shape (`infection-log.json`)

**Top-level keys** (Infection 0.34.0, `json` logger):

```
stats, escaped, timeouted, killed, killedByStaticAnalysis, errored, syntaxErrors, uncovered, ignored
```

- `stats` — an **object** of counts (below).
- Every other top-level key is a **per-mutant array** (may be empty). **A mutant's status is encoded by
  WHICH array it sits in — there is no per-mutant `status` field.** This is the single most important
  structural fact for the translation: status = the group key.

**`stats` object keys** (observed):

```
totalMutantsCount, killedCount, killedByStaticAnalysisCount, notCoveredCount, escapedCount,
errorCount, syntaxErrorCount, skippedCount, ignoredCount, timeOutCount, msi, mutationCodeCoverage,
coveredCodeMsi
```

**Per-mutant entry** (identical shape in every group array):

| Field | Type | Example |
|-------|------|---------|
| `mutator.mutatorName` | string | `"LogicalAnd"`, `"PublicVisibility"`, `"IfNegation"` |
| `mutator.originalSourceCode` | string | full original file source |
| `mutator.mutatedSourceCode` | string | full mutated file source |
| `mutator.originalFilePath` | string | `"/native/src/Actions/CalculateReferencePeriodAction.php"` |
| `mutator.originalStartLine` | int | `57` |
| `diff` | string | unified diff of the single mutation |
| `processOutput` | string | the PHPUnit output for that mutant run |

Note: **no per-mutant `id`, no per-mutant `status`, no `location.end`.** The line number is
`mutator.originalStartLine` (a flat int, not a `location.start.line` object — the runner maps it into
the gate's `location.start.line` shape when it translates).

## OBSERVED status map — Infection group key → gate `mutants` status

Authored against the observed group keys above (extends the plan's capabilities table with the two
groups the research had NOT enumerated — `killedByStaticAnalysis`, `syntaxErrors` — per critic L-2):

| Infection group key | → gate status | In `mutants` array? | Scored (in `DENOMINATOR_STATUSES`)? |
|---------------------|---------------|---------------------|-------------------------------------|
| `killed` | `Killed` | yes | yes (kill) |
| `killedByStaticAnalysis` | `Killed` | yes | yes (kill) — static analysis detected it |
| `errored` | `Killed` | yes | yes (kill) — an errored mutant was detected |
| `escaped` | `Survived` | yes | yes (survivor) |
| `timeouted` | `Timeout` | yes | yes (kill — gate treats Timeout as killed) |
| `uncovered` | `NoCoverage` | yes | yes (survivor side of the denominator) |
| `syntaxErrors` | `CompileError` | yes | **no** — not in `DENOMINATOR_STATUSES`, excluded from the score (a syntax-broken mutant is not a test outcome; mirrors Stryker `CompileError`) |
| `ignored` | (excluded) | **no** — not enumerated | no |
| `skipped` (stats-only; no array observed) | (excluded) | no | no |

- `DENOMINATOR_STATUSES = {Killed, Survived, Timeout, NoCoverage}` (the gate battery's set, unchanged).
- `Timeout` counts on the **killed** side (gate semantics — unchanged from .NET/cpp/Flutter).
- **Anti-fake-green cross-check** the runner+workflow enforce: the translated `mutants` array length
  must equal `stats.totalMutantsCount − ignoredCount − skippedCount` (every non-excluded mutant is
  enumerated). A mismatch HALTs the run (`mutant-count-mismatch`) — the translation-seam analogue of
  the Flutter runner's survivor-count guard.

## Positional-pin proof (`target_mutated`)

`vendor/bin/infection src/Actions/CalculateReferencePeriodAction.php` (positional arg) mutated
**exactly one file**:

```
/native/src/Actions/CalculateReferencePeriodAction.php => 45 mutants   (0 stray files)
```

13 distinct mutator types were generated (`LogicalAndSingleSubExprNegation` 11, `LogicalAnd` 9,
`IfNegation`/`LogicalAndNegation`/`LogicalAndAllSubExprNegation` 4 each, `Identical`/`TrueValue`/
`DecrementInteger`/`IncrementInteger`/`ArrayItem` 2 each, `Plus`/`PublicVisibility`/`ArrayItemRemoval`
1 each). The positional arg narrows the actual mutation to the one target file even though
`source.directories` is `["src"]` — confirming the pin mechanism the runner relies on.

## Canonical runner command sequence (native-fs)

The Cover runner (Step 3) executes this exact shape inside the image. `${HOST_WS}` is the host
workspace, `${TARGET_REL}` the target's workspace-relative path (`src/Actions/…Action.php`):

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "${HOST_WS}:/work" ${IMAGE} bash -c '
  set -e
  cp -r /work /native && cd /native          # escape the bind-mount I/O tax (mandatory)
  vendor/bin/phpunit                          # run 1  (suite_green + no_flaky)
  vendor/bin/phpunit                          # run 2
  vendor/bin/infection src/Actions/CalculateReferencePeriodAction.php \
      --no-progress --threads=4               # positional single-file pin
  cp infection-log.json infection-summary.log /work/   # deliver logs to the host side
'
```

The runner then reads the host-side `${HOST_WS}/infection-log.json`, translates the group arrays →
the gate `mutants` array via the status map above, builds `mutatedFiles` (one `{file,count}` per
distinct `originalFilePath`), and returns `testRuns` + `mutationSummary` (the `stats` counts) +
`mutants` + `mutatedFiles` in its schema'd result.

Prereq: `docker build -t mvc-php-probe harness/php` once; the workspace set up as above; a verified KB
from Mine→Verify (Step 2, operator-owed).

*Status: COMPLETE — developer, 2026-07-07.*
