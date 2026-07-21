---
name: mine-verify-cover-php
description: The PHP stack adapter for the mine-verify-cover method — fills its 5 capabilities with Infection 0.34 (the PHP Stryker-equivalent) driving PHPUnit 12, a workspace-copy isolation that copies ONE target slice into a self-contained composer workspace (the consuming repo is never touched), eris property tests, and a Docker toolchain (php:8.4-cli + PCOV + composer) run on the container's native filesystem. Infection's json log is proprietary, so the runner TRANSLATES it to the gate's Stryker schema. Use when running Mine→Verify→Cover on a PHP/Laravel class — especially the first run on a repo, which needs the Docker image + workspace bringup below. Generated tests land Pest-compatible. Ships the toolchain ready to run (toolchain/).
user-invocable: true
---

# Mine→Verify→Cover — PHP adapter

The **stack adapter** for `mine-verify-cover` (the nexus core method). The method owns the loop, the gate battery, and the KB ledger; this skill fills the 5 toolchain capabilities for PHP. Read `mine-verify-cover` first — this skill only supplies the PHP-specific parts.

The Mine→Verify half is **stack-neutral** — the same clean-room miners + skeptic verify run on a `.php` source with no change (proven on `CalculateReferencePeriodAction` and `SelectStratifiedSampleAction`). This adapter is really about the **Cover + Gate** half: the mutation tool, the test runner, the Infection-json translation, and the Docker bringup.

## The 5 capabilities, filled for PHP

| Capability | PHP fill |
|------------|----------|
| Evidence indexer | the miner reads the target `.php` directly (pure classes; no indexer tooling this pass) |
| Test runner | `vendor/bin/phpunit` (PHPUnit 12) **inside the `mvc-php-probe` Docker image, on the container's native fs** — run twice for `suite_green` + `no_flaky` |
| Mutation tool | **Infection 0.34** via `vendor/bin/infection <target>` (positional single-file pin); its `json` logger is proprietary → the runner **TRANSLATES** it to the gate's Stryker-shaped `mutants` schema |
| Test-style contract | PHPUnit 12 class tests (`final class XTest extends TestCase`, `#[DataProvider]` boundary matrices), Pest-compatible for the consuming repo; **eris** trait for property tests |
| Prod-source-diff scoping | `git diff -- <slice>` for `char_pin`; the only tolerated change is an `@infection-ignore-all` / ignore comment |

## The trust anchor — Infection is the PHP mutation standard, but its JSON needs translation

PHP **does** have a Stryker-grade mutation tool, unlike Dart:

- **Infection** is the production-viable engine: config-driven (`infection.json5`), headless, and single-file targeting via a **positional CLI arg**. But its `json` logger is **proprietary** — a mutant's status is the top-level **group ARRAY it sits in** (`killed`/`escaped`/`timeouted`/`uncovered`/`errored`/`killedByStaticAnalysis`/`syntaxErrors`/`ignored`); there is **no per-mutant `status` field**. So the runner **translates** the group arrays into the gate's Stryker-shaped per-mutant array (`{status, location.start.line, mutatorName, replacement}`) — this is the **Flutter-style fork** (translation required), NOT the mull/Stryker as-is fork.
- Infection needs **PHP ^8.3 + a coverage driver** (PCOV/Xdebug/phpdbg). **PCOV** is the fastest (line-only, all Infection needs). Windows has none of this uniformly, so we run every command **inside Docker** — the host-uniform path (the `toolchain/Dockerfile` image: `php:8.4-cli` + PCOV + composer, with Infection/PHPUnit/eris installed per-workspace). Observed on the proof runs: PHP 8.4.23, PHPUnit 12.5.31, Infection 0.34.0, PCOV active (no Xdebug).

Grounding: `docs/kb/research/php-mutation-and-test-tooling.md` in the nexus dev repo (hands-on confirmed); proven end-to-end on the fmcg_platform repo — see `docs/specs/adhoc-MineVerifyPhpAdapter` (probe-report + mvc-report).

## Toolchain bringup (the prerequisite — do ONCE per repo)

The PHP analogue of the .NET test-project scaffold / the C++ Docker image. You need **Docker running** — nothing runs on the host.

1. **Build the image once:** `docker build -t mvc-php-probe <skill>/toolchain` (`php:8.4-cli` + PCOV + composer; Infection/PHPUnit/eris are pinned in `composer.json.template` and installed per-workspace by `composer install`).
2. **Scaffold a workspace** the image mounts at `/work` — set up ONCE per target, kept OUT of the consuming source tree (the workspace-copy isolation: the consuming repo stays pristine):
   ```
   workspace/
     composer.json        # from toolchain/composer.json.template — set require to the slice's NARROW deps
     phpunit.xml          # from toolchain/phpunit.xml.template — <source> drives PCOV coverage
     infection.json5      # from toolchain/infection.json5.template — source.directories:["src"]; json+summary loggers; timeout 30
     src/    <slice>      # the SUT, COPIED from the consuming repo (the repo stays pristine — never edited)
     tests/               # the seed pattern + the Cover agent writes <Class>HarnessTest.php here
   ```
3. Run `composer install` inside the image once to resolve the workspace vendor tree. PHPUnit **auto-discovers** every `tests/*Test.php` — no GLOB/build step (the C++ CMakeLists analogue is unnecessary).

## Native-fs execution — MANDATORY, not an optimization

**Run PHPUnit + Infection on the container's NATIVE filesystem, never over the bind mount.** PHP's autoloader reads thousands of `vendor/` files; over a Windows→Linux bind mount that is **~20× slower** (measured **0.420 s** of test logic → **9.587 s** wall). Infection spawns a **fresh PHPUnit subprocess per mutant**, so on the bind mount every mutant blows past the per-process `timeout` (30 s) → a **false 45/45 "Timed Out"** (the first probe pass observed exactly this — 0 Killed, 0 Escaped, MSI 100 purely via timeouts, which never demonstrated the kill path). Copy the mounted workspace into `/native` first, run there, copy the two log files back out. On native fs the same run is **~0.161 s** (bare PHPUnit) / **~2.5 s** (full Infection). This is load-bearing — it is baked into the runner command below.

## The Infection run (what the runner does)

The Cover agent writes the test file; a distinct runner agent executes the toolchain inside Docker on the native fs:

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "<host-ws>:/work" mvc-php-probe bash -c '
  set -e
  cp -r /work /native && cd /native          # escape the bind-mount I/O tax (mandatory)
  vendor/bin/phpunit                          # run 1  (suite_green + no_flaky)
  vendor/bin/phpunit                          # run 2
  vendor/bin/infection src/Actions/CalculateReferencePeriodAction.php \
      --no-progress --threads=4               # POSITIONAL single-file pin
  cp infection-log.json infection-summary.log /work/   # deliver logs to the host side
'
```

(`MSYS_NO_PATHCONV=1` stops Git-Bash mangling the container paths on a Windows host.) The positional arg narrows the ACTUAL mutation + coverage to the one target file even though `infection.json5`'s `source.directories` is `["src"]` — proven: `vendor/bin/infection src/Actions/CalculateReferencePeriodAction.php` mutated exactly one file (45 mutants, 0 strays). Then the runner reads the host-side `infection-log.json`, translates (below), and returns `testRuns` + `mutationSummary` + `mutants` + `mutatedFiles` in its schema'd result.

## The Infection json → gate schema translation (the observed status map)

`infection-log.json` (Infection 0.34.0, `json` logger) has these **top-level keys**: `stats` (an object of counts) + one **per-mutant array per status**: `escaped`, `timeouted`, `killed`, `killedByStaticAnalysis`, `errored`, `syntaxErrors`, `uncovered`, `ignored`. **The status IS the array key — there is no per-mutant `status` field** (the single most important structural fact). Each element is `{ mutator: { mutatorName, originalStartLine, originalFilePath, originalSourceCode, mutatedSourceCode }, diff, processOutput }`. The line number is `mutator.originalStartLine` (a flat int — the runner maps it into the gate's `location.start.line` shape).

The runner maps each group array to a gate status using this **probe-observed** map (it extends the naive inference with the two groups a docs-only read misses — `killedByStaticAnalysis` and `syntaxErrors`):

| Infection group key | → gate status | In `mutants`? | Scored (`DENOMINATOR_STATUSES`)? |
|---------------------|---------------|---------------|----------------------------------|
| `killed` | `Killed` | yes | yes (kill — an assertion fired) |
| `killedByStaticAnalysis` | `Killed` | yes | yes (kill) |
| `errored` | `Killed` **only after per-mutant adjudication** | yes | conditional — read the mutant's `processOutput`: a PHP fatal originating in the MUTATED code (TypeError from the mutant's change, etc.) is a genuine detection → `Killed`; a harness/environment error (autoload, filesystem, framework bootstrap) is an **instrument defect → HALT and fix**, never a kill. `rc != 0` alone proves nothing (kill-attribution rule) |
| `escaped` | `Survived` | yes | yes (survivor) |
| `timeouted` | `Timeout` | yes | yes, on the **survivor** side unless adjudicated — the gate scores an unadjudicated Timeout as a survivor; only a proven infinite loop passes via `adjudicatedTimeoutKillLines` |
| `uncovered` | `NoCoverage` | yes | yes (survivor side of the denominator) |
| `syntaxErrors` | `CompileError` | yes | **no** — present for an honest count, excluded from BOTH sides (mirrors Stryker `CompileError`) |
| `ignored` | (excluded) | **no** — not enumerated | no |
| `skipped` | (excluded — stats-only, no array) | no | no |

`DENOMINATOR_STATUSES = {Killed, Survived, Timeout, NoCoverage}` (the gate battery's set, unchanged). **Timeout is NOT auto-killed** (kill-attribution rule, `mine-verify-cover` → `### Instrument integrity`, audit 2026-07-21 — Infection has never been audited; this map is the conservative fill). Build `mutationSummary` from `stats` (`total: totalMutantsCount`, `killed: killedCount`, `escaped: escapedCount`, `timeout: timeOutCount`, `notCovered: notCoveredCount`, `errored: errorCount`, `killedByStaticAnalysis: killedByStaticAnalysisCount`, `syntaxError: syntaxErrorCount`, `ignored: ignoredCount`, `skipped: skippedCount`).

**Anti-fake-green cross-check** (the translation seam's guard — the Flutter runner's survivor-count analogue): the translated `mutants` array length MUST equal `stats.totalMutantsCount − ignoredCount − skippedCount`. A mismatch means the runner mis-translated, dropped, or padded the set → the run **HALTs** (`mutant-count-mismatch`), never scores on an inconsistent set. Report exactly what the log lists; never pad or drop to force the match.

## The version pin moves with the observed map

`composer.json.template` pins `infection/infection` to **`^0.34`** — the probed minor line (0.34.0, `composer.lock`-confirmed), **not `*`**. The translation map above was authored against **this** version's observed json shape. **Rule:** the composer pin, the observed status map, and the runner's translation map are **one unit** — bumping the pin to a new Infection minor/major requires **re-running the toolchain probe** and reconciling all three before the pin is allowed to float forward. A future Infection whose json shape shifts would otherwise silently invalidate the translation.

## The `known-bug` group convention (per-target suite scoping)

The Cover agent keeps a test that is **RED on current production code** and flags it as a candidate bug — it never deletes it and never edits production to make it pass. In PHP, pin such a bug as a failing test tagged **`#[Group('known-bug')]`** (on the proof run the Cover agent pinned a genuine dead-code bug via reflection on the private predicate and tagged it this way — `char_pin` stayed 0).

**The trap this creates:** the workspace `tests/` directory is shared across targets, so **one class's `known-bug` pin fails another class's `suite_green` gate**. This happened live: run #2's own 42-method suite was fully green (88% floor), but `suite_green` failed **solely** on run #1's `known-bug` pin sharing the workspace `tests/` dir — a **cross-suite contamination**, not a defect in run #2's class. Design the gate/runner with **per-target suite scoping** (isolate each target's tests) OR run the gate against a **documented `--exclude-group known-bug` baseline** (`vendor/bin/phpunit --exclude-group known-bug` verified 93/93 green, 657 assertions once the other class's pin was excluded). Never let a sibling target's genuine-bug pin masquerade as this target's `suite_green` failure.

## Collaborator handling — seed the RNG, stub the framework-coupled

A PHP target rarely stands alone. Two rules, both proven on `SelectStratifiedSampleAction` (5 imports):

- **Randomizer-injection targets need a seeded engine.** A class taking an injected `Random\Randomizer` (for shuffles/quota tiebreaks) must be tested with a **fixed-seed** engine — construct `new Randomizer(new Xoshiro256StarStar(<fixed seed>))` so shuffles and tiebreaks are deterministic; otherwise `no_flaky` and the boundary assertions are unstable. Plain-DTO/enum collaborators (`SamplingCandidateData`, `SamplingScanTypeGroup` + its enum) are **copied verbatim** into workspace `src/`.
- **Framework-coupled collaborators get a plain constructor stub.** A collaborator that extends `Spatie\LaravelData\Data` or references Eloquent (e.g. `SamplingDimensionsData`, which the SUT reads only for its five public booleans) is **not copied** — replace it with a plain public-property stub in workspace `src/` that tests construct directly (never via a framework factory). `char_pin` pins only the **target** file, so a stubbed collaborator is legal.

## Equivalent-mutant filter (reason about it — the tool can't)

Some survivors are **equivalent mutants** a behaviour-asserting test can never kill. Two mechanisms, both reasoned per **mutator-type × observability** — never a blanket "everything that survived" exclusion (that is reward-hacking):

- **`ignoreSourceCodeByRegex`** (in `infection.json5`) — for **provably behavior-free** lines only (a mutation that cannot change any observable output, e.g. a log call). Per-mutator regex form.
- **`expectedSurvivorLines`** (workflow arg) — line numbers of survivors a behaviour-asserting test can NEVER kill, EXCLUDED from the reachable denominator (not chased). Justify each by mutator type + observability. On the proof run all 6 reachable survivors sat on the dead-conjunct line and were equivalent **against the current (buggy) production code** — killable only after the bug is fixed; the hand-off was `expectedSurvivorLines: [57]` (pre-fix), removed after the fix so all six become killable.

## Test style (so generated tests compile and kill mutants)

- **PHPUnit 12 class style:** `final class <Class>HarnessTest extends TestCase`, one `public function test…(): void` per rule boundary. Use `#[DataProvider]` (attribute) for boundary matrices. Assert on the method's **public return value**.
- **Pest-compatibility constraint:** the file lands in the consuming repo's `tests/` and runs under Pest's PHPUnit-compatibility layer — use ONLY plain PHPUnit-class APIs (`TestCase`, `assertSame`, data-provider attributes, `expectException`). Do NOT write Pest `it()`/`test()` closures, and no PHPUnit-internal APIs beyond Pest's layer.
- **Assert STRUCTURAL INVARIANTS, not hand-computed values.** The recurring Cover-agent failure mode (carried from the C++ lessons): the agent hand-computes a wrong expected value, the test fails on *correct* code, and `suite_green` goes red on a non-bug. Prefer invariants a mutated comparison/arithmetic breaks — conservation, adjacency, a reference computation, symmetry. Assert an exact hand-computed value for ONE trivially-traceable anchor case only. **A wrong hand-computed expectation is a FALSE failure, never a candidate bug.**
- **Property tests** — eris (`use Eris\TestTrait;`, `$this->forAll(...)`) for pure functions; seed any randomness fixed. Optional per target. **Fallback (run-proven):** `composer require --dev giorgiosironi/eris` can fail on root platform requirements (`ext-gd`/`ext-pgsql`/`ext-exif` absent from the available image) — when it does, convert the property test to a deterministic exhaustive sweep over the input range instead (strictly stronger coverage than the random sampling it replaces, no dependency needed).
- **Pick boundary cases** that kill relational/arithmetic mutants: every `&&`/`||`, every `===`/`!==`/comparison, each `+1`/`-1`, each `(int)` cast, and each predicate the KB documents.

## Run artifacts — written AUTOMATICALLY, every run

A run that leaves only a green console is not done. Every run — **all-gates-green OR refused** — lands its artifacts in the **consuming repo** (the orchestrator/agents write them; the operator never has to ask):

1. **The gated test suite** → `tests/Unit/MineCode/<Class>HarnessTest.php` as Pest-compatible PHPUnit classes (register the directory in the repo's test discovery if `tests/Unit` auto-discovery does not already cover it — resolve against `tests/Pest.php`). Landed only when the gates pass; a refused run lands no suite (but still writes #2 and #3).
2. **The run report** → a per-class section appended to the consuming repo's `docs/specs/{slug}/delivery/mvc-report.md` (the cumulative report, one section per class/run): verdict + full 6-gate table; Mine stats; Verify verdicts; Cover stats (CANDIDATE BUGS stated explicitly, "none" if none); every reachable survivor classified killable-vs-equivalent + the `expectedSurvivorLines` hand-off; incidents; cost. A refused/halted run STILL writes its section with the stop reason.
3. **The verified rule KB** → the consuming repo's `docs/business-rules/<area>/<unit>.md` (registry row grammar — see the core method's `## The rule registry`), flipped `verified → mutation-gated` when the gates pass. Copy it in even when a run reuses a previously-mined KB.

## Picking a target (this decides the ceiling)

The kill-rate ceiling is the **target's observable surface**, not the harness. Choose a slice whose rules are observable through its **public return value(s)** — pure logic (date arithmetic, quota/allocation, ranking, parsing), dependency-isolatable, not framework-trapped. A dependency-isolated slice proves the toolchain but is not automatically a good kill-rate target. Proven targets: `CalculateReferencePeriodAction` (pure Carbon date logic — 89% reachable kill, refused honestly on a genuine dead-code bug) and `SelectStratifiedSampleAction` (largest-remainder quota allocation + injected RNG — 88% reachable kill; the unlike-target de-hardcoding proof with zero prompt edits between runs).

## The in-repo / Pest-native variant (a documented later mode — not run this pass)

This adapter uses **workspace-copy isolation** (copy the slice into a self-contained composer workspace). The alternative — running Infection **in-repo against the consuming repo's own Pest suite** — is a documented future mode, **not** exercised here. It needs Infection + a coverage driver installed into the consuming repo AND drags the full suite (often live-DB Feature tests) through Infection's initial full-suite sanity check. Workspace-copy avoids both and keeps the consuming repo pristine; adopt the in-repo/Pest-native variant only when a repo already ships Infection + a driver and its suite is fast + DB-free.

## What this skill does NOT do

- Own the loop, the gate battery, or the KB ledger — those are `mine-verify-cover` (the core method). This skill is only the PHP toolchain fill.
- Run on the host — everything runs in the Docker image on the container's native fs (Windows has no uniform coverage driver; Docker is the host-uniform path).
- Decide WHICH unit to target — the operator chooses; start with logic-rich, return-observable slices, not framework-coupled (Eloquent/Spatie-trapped) code.
- Run Infection in-repo against the consuming repo's Pest suite — that is the documented later variant above, not this adapter's default.

## Relationship to other skills

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover` | the stack-neutral method this adapter plugs into (read it first) |
| `mine-verify-cover-dotnet` | the sibling .NET adapter — same method (Stryker.NET + dotnet test + xUnit/FsCheck) |
| `mine-verify-cover-flutter` | the sibling Dart/Flutter adapter (mutation_test + flutter test + flutter_test/mocktail); the other translation fork |
| `mine-verify-cover-cpp` | the sibling C/C++ adapter (mull-15 + GoogleTest/CTest + libclang); consumes its report as-is (no translation) |
| `tdd` | the boundary-case + kill-the-mutant test discipline |
