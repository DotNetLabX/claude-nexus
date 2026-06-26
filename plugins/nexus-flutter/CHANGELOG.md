# Changelog — nexus-flutter

All notable changes to the `nexus-flutter` plugin are documented here.

## [0.1.1] — 2026-06-26
**Fix mutation gate under-report in the Dart/Flutter adapter.** `mutation_test -f xml` writes an `<undetected-mutations>` report that lists ONLY surviving mutations — the killed/total counts appear only in stdout. Step 3 of "The mutation_test run" now instructs the runner to score from the stdout summary (`Found N mutations`, `Undetected Mutations: M`, `Timeouts`, `Not covered`) rather than from the XML, and reserves the XML only for enumerating survivors. Adds a bold warning so no author treats the XML element count as the full mutant set. A pilot using the old prose reported 0% kill; the corrected scorer on the same run produced 77.14% (54/70 killed, all 16 survivors equivalent/masked) — the 75% floor passes (adhoc-MvcGateScoringFix).

## [0.1.0] — 2026-06-24

Initial release. The Dart/Flutter stack extension for the `nexus` core pipeline.

### Added

- **`mine-verify-cover-flutter`** — the Dart/Flutter adapter for the `mine-verify-cover` method. Fills the 5 toolchain capabilities for Flutter:
  - mutation tool: `mutation_test` (pub.dev, regex) driving `flutter test` — the practical mechanical gate for Dart, since `dart_mutant` (AST) is not pub-installable.
  - test runner: `flutter test` (double-run for `suite_green` + `no_flaky`).
  - test style: `flutter_test` + `mocktail`, `kiri_check` for property tests.
  - the repo bringup (HTTPS-rewrite for SSH-declared private deps, `flutter pub get` + `build_runner`, mutation_test install).
  - the equivalent-mutant filter (regex log-line / consistent-key-format mutants → `expectedSurvivorLines`).

  Grounded in two live runs on omnishelf_flutter_app: `BuildZplCodeUsecase` (90%, 45 tests) and the untested `GetNextCycleCountTargetUsecase` (94% after the feedback loop closed 2 real traversal-direction gaps, 57 tests). Mine→Verify proven stack-agnostic (ran on Dart unchanged).
