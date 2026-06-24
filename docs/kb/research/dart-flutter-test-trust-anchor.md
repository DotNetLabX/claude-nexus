# dart-flutter-test-trust-anchor

## What is the best test-quality trust anchor for auto-generated Dart/Flutter tests (2026)?

**Verdict:** No mechanically un-foolable single gate exists today; the honest best is a multi-signal soft gate combining branch-coverage thresholds (via `package:coverage --branch-coverage`, not `flutter test --coverage`) with property-based testing (`kiri_check`) and — for pure-Dart logic only — mutation scoring via `dart_mutant`, accepting that Flutter widget and integration layers lack a production-ready mutation harness.
**Evidence tier:** read-docs
**As-of:** 2026-06-24
**Validity scope:** Flutter/Dart pub-tool versions as of June 2026 (`dart_mutant`, `kiri_check` 1.x, `mutation_test` 1.8.x); revisit if dart_mutant ships explicit `flutter test` runner support or if `flutter test --coverage` gains native branch coverage. Specific version/star/download numbers below are the researcher's weakest claims — treat the capability verdict as load-bearing, the exact numbers as indicative.
**Status:** uncertain — the flutter-test/mutation gap is confirmed by two independent sources, but dart_mutant's non-support of `flutter test` rests on absence of documentation rather than an explicit statement
**Reconfirm trigger:** dart_mutant publishes a versioned release documenting `flutter test` runner support, OR `flutter test --coverage` gains a native `--branch-coverage` flag, OR a new pub.dev package with >100 likes ships AST-based mutation testing against `flutter test`
**Corroboration:** high-stakes — two independent sources confirm dart_mutant targets `dart test` only (dartmutant.dev + Nimblesite/dart_mutant README); two independent sources confirm `flutter test --coverage` is line-only (Flutter issue #108313 + SonarQube docs); the "no production-ready Flutter mutation harness" verdict is corroborated by two further independent sources (christianfindlay.com + flutterfromdotnet.hashnode.dev)

## Verdict

A mechanically un-foolable Dart/Flutter test-quality gate is not achievable today for the full Flutter stack. Mutation testing is viable only for pure-Dart business logic (`dart_mutant`, AST-based, `dart test` only) or via the regex-based `mutation_test` (configurable to any shell command including `flutter test`, but mutations are semantically shallow). For widget and integration layers there is no production-ready automated mutation harness. The strongest achievable gate is a composite: branch coverage from `package:coverage` (not `flutter test --coverage`), property-based testing with `kiri_check`, assertion-density discipline, and diff-coverage enforcement in CI.

## Finding

- `dart_mutant` (Nimblesite/dart_mutant) is AST-based (tree-sitter), generates 40+ semantically valid mutation operator categories, and runs under `dart test` only — the README and CI examples reference `dart-lang/setup-dart`, not Flutter, and `flutter test` is absent from all documentation [1]
- `mutation_test` (pub.dev, 1.8.x as of early 2026) is regex-based text replacement, not AST; it can be configured with any shell command including `flutter test` via its XML configuration, but regex mutations may produce syntactically invalid Dart and cannot reason about code structure [2]
- Neither `dart_mutant` nor `mutation_test` publishes a documented real-world case study on a Flutter app with widget or integration tests; the mutation-testing ecosystem gap was noted as early as 2021 and remains largely unclosed as of mid-2026 [3] [4]
- `flutter test --coverage` produces only line coverage in LCOV format; branch and function coverage require the separate `package:coverage` tool via `dart pub global run coverage:test_with_coverage --branch-coverage` — the gap was tracked in Flutter issue #108313 (closed "r: fixed"), but post-fix availability in a standard `flutter test` invocation is not confirmed in current docs [5] [6]
- `glados` (last pub.dev release December 2023, no 2025/2026 updates) is effectively unmaintained for property-based testing in Flutter [7]
- `kiri_check` (1.x, Apache-2.0, maintained into 2026) is the actively maintained property-based testing library; it integrates with `package:test`, supports stateful/model-based testing with shrinking, and installs via `flutter pub add dev:kiri_check`; no documented validation specifically against `testWidgets` contexts [8]
- SonarQube Cloud supports Dart/Flutter LCOV (line coverage) via `sonar.dart.lcov.reportPaths` but does not itself produce branch coverage; it relies on whatever the coverage tool emits [9]
- Community practice in 2025–2026 converges on 75–85% line-coverage thresholds plus per-PR "diff coverage" as the prevailing pragmatic gate, not mutation scoring [10]
- The `very_good_test_runner` package exposes a programmatic API that can spawn both `dart test` and `flutter test` via the JSON Reporter Protocol — a possible foundation for a future Flutter-aware mutation harness, but no mutation tool has built on it yet [11]

## Fix

- Use `dart_mutant` only against packages that do NOT import `package:flutter` — restrict to domain/service/repository layers where `dart test` is the correct runner; do not apply it to widget or integration test files [1]
- For packages that require `flutter test`, use `mutation_test` with an explicit `<runner><command>flutter test</command></runner>` XML block; accept regex-mutation noise (invalid Dart, equivalent mutants) and budget manual triage [2]
- Replace `flutter test --coverage` with `dart pub global run coverage:test_with_coverage --branch-coverage` in CI where branch data is needed; for a Flutter app this may require separating Dart logic into a pure-Dart package or a bridge script [5]
- Gate PRs on branch coverage (≥80%) plus diff coverage of changed lines via `lcov --summary` or SonarQube — the strongest mechanical gate available across the full Flutter stack [9] [10]
- Add `kiri_check` property tests for pure functions and state machines; `forAll` with shrinking is the closest available substitute for mutation-grade confidence on hard-to-enumerate logic [8]

## Alternatives

- **Manual mutation testing** (deliberately inject a bug, confirm a test fails): zero automation, scales to nothing beyond a handful of functions; still the only option for the widget layer in 2026 [3] [4]
- **dart_mutant** (AST, `dart test` only): strongest automated option for pure-Dart layers; disqualified for Flutter widget/integration layers by its `dart test`-only runner [1]
- **mutation_test** (regex, configurable runner): can target `flutter test` but emits syntactically invalid mutations and high false-positive rates; acceptable only as a coarse filter with triage budget [2]
- **100% line-coverage enforcement (Very Good Ventures style)**: eliminates untested dead code but does not prove assertions exist; widely cited yet acknowledged insufficient for behavioral correctness [10] [11]
- **kiri_check stateful model testing**: most powerful fallback for behavioral correctness on stateful logic (Blocs/Cubits); requires per-component model authoring [8]
- **glados**: dismissed — last release December 2023, effectively abandoned [7]

## Caveat

The claim that `dart_mutant` does not support `flutter test` is inferred from the absence of any mention in its docs/CI examples — no explicit "not supported" statement and no GitHub issue was found confirming it; it may be configurable with an undocumented custom command. The branch-coverage fix in Flutter #108313 is marked "r: fixed" but no post-fix doc confirms `flutter test --coverage --branch-coverage` is available in a current stable Flutter; until verified, assume branch coverage requires the standalone `coverage` package. The precise version numbers, star counts, and download figures the researcher reported (e.g. a specific dart_mutant `v0.5.1` / Flutter `3.44` / Dart `3.12`) were not independently re-verified against live pub.dev/GitHub and should be treated as indicative — the capability verdict does not depend on them. `kiri_check` integrates with `package:test` (which `flutter test` also uses) but widget-test pump loops / async frame scheduling may introduce undocumented incompatibilities.

## Fallback

If `dart_mutant` ships explicit `flutter test` support (watch https://github.com/Nimblesite/dart_mutant): re-evaluate it as the primary anchor for all layers and retire the composite gate. If `flutter test --coverage --branch-coverage` becomes confirmed in a stable release: adopt it as the CI coverage command and drop the `package:coverage` bridge. If neither fires within ~6 months, standardize the multi-signal gate permanently: (1) `dart_mutant` on pure-Dart packages, (2) `mutation_test` + `flutter test` on widget packages with triage budget, (3) `kiri_check` property tests on state machines, (4) branch-coverage threshold via `package:coverage`, (5) per-PR diff-coverage enforcement.

## Sources

[1] https://github.com/Nimblesite/dart_mutant
[2] https://pub.dev/packages/mutation_test
[3] https://www.christianfindlay.com/blog/mutation-testing
[4] https://flutterfromdotnet.hashnode.dev/mutation-testing
[5] https://github.com/flutter/flutter/issues/108313
[6] https://pub.dev/packages/coverage
[7] https://pub.dev/packages/glados
[8] https://pub.dev/packages/kiri_check
[9] https://docs.sonarsource.com/sonarqube-cloud/enriching/test-coverage/dart-test-coverage
[10] https://medium.com/@m.m.shahmeh/flutter-testing-strategy-at-scale-af1aa236958e
[11] https://pub.dev/packages/very_good_test_runner

## Recommendation

Adopt the multi-signal composite gate: wire `dart_mutant` into CI for all non-Flutter packages (domain/service layers), configure `mutation_test` with `flutter test` for widget packages, add `kiri_check` property tests for state machines and pure functions, and enforce branch-coverage thresholds via `package:coverage`. Next probe if the question reopens: fetch https://github.com/Nimblesite/dart_mutant/issues and search "flutter test" to see whether a Flutter-runner issue is filed/planned; and run `flutter test --coverage --branch-coverage` against a current Flutter project to determine whether the #108313 fix is actually exposed in the CLI — that would remove the largest remaining coverage-side uncertainty.
