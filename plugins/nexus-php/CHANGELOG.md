# Changelog — nexus-php

All notable changes to the `nexus-php` plugin.

## [0.1.0] — 2026-07-08

Initial release. PHP stack adapter for the nexus `mine-verify-cover` method.

- **`mine-verify-cover-php` skill** — fills the 5 adapter capabilities for PHP: Infection 0.34 (the PHP
  mutation standard) driving PHPUnit 12, a workspace-copy isolation that copies ONE target slice into a
  self-contained composer workspace (the consuming repo is never touched), and a Docker toolchain
  (`php:8.4-cli` + PCOV + composer + per-workspace Infection/PHPUnit/eris) because Windows has no uniform
  coverage driver.
- **Ships the toolchain** (`toolchain/`): `Dockerfile`, `composer.json.template` (Infection pinned `^0.34`,
  PHPUnit `^12`, eris `^1.1`), `phpunit.xml.template`, and `infection.json5.template`.
- **The FLUTTER-style fork (translation required).** Unlike mull/Stryker (consumed as-is), Infection's `json`
  logger is proprietary — a mutant's status is the top-level group ARRAY it sits in, with no per-mutant
  `status` field. The runner translates each group array into the gate's Stryker-shaped `mutants` schema via
  the probe-observed status map (`killed`/`errored`/`killedByStaticAnalysis`→`Killed`, `escaped`→`Survived`,
  `timeouted`→`Timeout`, `uncovered`→`NoCoverage`, `syntaxErrors`→`CompileError` [unscored], `ignored`/
  `skipped` excluded). An anti-fake-green cross-check HALTs on a translated-count mismatch.
- **Bakes in the proven live-run lessons:** container native-fs execution is mandatory (the Windows→Linux
  bind-mount I/O tax falsely times out every mutant — `cp -r /work /native` first); the Infection pin, the
  observed json map, and the runner's status map move together; the `known-bug` group convention (a genuine
  SUT bug is pinned as a failing test tagged `#[Group('known-bug')]`, needing per-target suite scoping or a
  documented `--exclude-group known-bug` baseline); randomizer-injection targets need a seeded engine
  (`Xoshiro256StarStar`) for deterministic shuffles/tiebreaks, while framework-coupled collaborators get
  plain constructor stubs.
- **Test style:** PHPUnit 12 class tests (`final class XTest extends TestCase`, `#[DataProvider]` boundary
  matrices), Pest-compatible for the consuming repo; eris property tests; assert structural invariants, not
  hand-computed values; the equivalent-mutant filter (`ignoreSourceCodeByRegex` + `expectedSurvivorLines`).
- Proven end-to-end on the fmcg_platform repo: `CalculateReferencePeriodAction` (89% reachable kill,
  refused honestly on a genuine production bug) and `SelectStratifiedSampleAction` (88% reachable kill,
  the unlike-target de-hardcoding proof — zero prompt edits between the two runs). Grounding: nexus dev-repo
  `docs/specs/adhoc-MineVerifyPhpAdapter` + `docs/kb/research/php-mutation-and-test-tooling.md`.
