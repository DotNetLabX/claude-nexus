---
name: mine-verify-cover-flutter
description: The Dart/Flutter stack adapter for the mine-verify-cover method — fills its 5 capabilities with mutation_test (regex, driving flutter test), flutter test, flutter_test + mocktail, kiri_check property tests, and the build_runner + HTTPS-rewrite repo bringup. Use when running Mine→Verify→Cover on a Dart class (domain use-cases, services, Cubits/Blocs) in a Flutter app — especially the first run on a repo, which needs the bringup steps below.
user-invocable: true
---

# Mine→Verify→Cover — Dart/Flutter adapter

The **stack adapter** for `mine-verify-cover` (the nexus core method). The method owns the loop, the gate battery, and the KB ledger; this skill fills the 5 toolchain capabilities for Dart/Flutter. Read `mine-verify-cover` first — this skill only supplies the Flutter-specific parts.

The Mine→Verify half is **stack-neutral** — the same clean-room miners + skeptic verify run on a `.dart` source with no change (proven 2026-06-24 on a Dart use-case). This adapter is really about the **Cover + Gate** half: the mutation tool, the test runner, and the bringup.

## The 5 capabilities, filled for Dart/Flutter

| Capability | Dart/Flutter fill |
|------------|-------------------|
| Evidence indexer | the miner reads the target `.dart` source file directly |
| Test runner | `flutter test {testFile}` — run twice for `suite_green` + `no_flaky` (parse the `+N: All tests passed!` summary) |
| Mutation tool | `mutation_test` (pub.dev, regex) via `dart pub global run mutation_test -f xml`, configured to drive `flutter test` |
| Test-style contract | `flutter_test` `test()`/`group()` + `mocktail`; `kiri_check` for property tests |
| Prod-source-diff scoping | `git diff -- lib/` (scoped to the production source) |

## The trust anchor — why mutation_test, not dart_mutant

Dart has **no Stryker-grade mutation tool**. Two candidates, only one usable:

- **`dart_mutant`** (AST-based, the better engine) is **NOT pub-installable** — it is a Rust binary, and `dart pub global activate dart_mutant` fails. Skip it.
- **`mutation_test`** (pub.dev, regex-based) **works**: install once with `dart pub global activate mutation_test`. It mutates by text replacement and runs any shell command — point it at `flutter test`, so it needs **no** pure-Dart `dart test` isolation and works on flutter-coupled code. Its `-f xml` report is machine-readable (per-mutation line + detected status).

Grounding: `docs/kb/research/dart-flutter-test-trust-anchor.md` in the nexus dev repo (hands-on confirmed).

## Repo bringup (the prerequisite — do ONCE per repo)

A fresh checkout will not run tests until these are done. They are the Flutter analogue of the .NET test-project scaffold.

1. **Resolve private deps over HTTPS, not SSH.** Many Flutter pubspecs declare private git deps as `git@github.com:` (SSH) URLs. If the machine authenticates over HTTPS (Git Credential Manager), `flutter pub get` fails with "Repository not found" — a protocol mismatch, not an access problem. Fix once:
   ```
   git config --global url."https://github.com/".insteadOf "git@github.com:"
   ```
   A dev-only dep that is genuinely access-denied (e.g. a private lint package) can be commented out of `dev_dependencies` — it does not affect test or mutation runs.
2. **Resolve + generate:**
   ```
   flutter pub get
   dart run build_runner build --delete-conflicting-outputs
   ```
   `build_runner` is **mandatory** before any `flutter test` — Freezed (`copyWith`), `json_serializable`, and `injectable` (`.config.dart`) generate files the whole `lib/` compiles against; without them every test fails to compile.
3. **Install the mutation tool:** `dart pub global activate mutation_test`.

## The mutation_test run (what the runner does)

The Cover agent writes the test file; a distinct runner agent executes the toolchain. From the app root:

1. `flutter test {testFile}` twice → record `{ passed, failed, skipped }` per run.
2. Write a config XML and run it with the xml reporter:
   ```xml
   <mutations version="1.0">
     <files><file>lib/path/to/target.dart</file></files>
     <commands><command group="test" expected-return="0" working-directory="." timeout="180">flutter test {testFile}</command></commands>
   </mutations>
   ```
   ```
   dart pub global run mutation_test -f xml -o mutation_test_out {config}.xml
   ```
   `expected-return=0` means: test passes (exit 0) → mutation **undetected** (survived); test fails → **detected** (killed).
3. Parse the XML and **translate into the method's mutant schema** so the gate battery is reused unchanged:
   `detected`→`Killed`, `undetected`→`Survived`, `timeout`→`Timeout`, `not-covered`→`NoCoverage`. One mutant per mutation `{ status, location.start.line, mutatorName, replacement }`.
4. Clean up the config + `mutation_test_out/` from the app tree.

## Equivalent-mutant filter (regex's one weakness — reason about it)

A regex mutator produces **equivalent mutants** a behaviour-asserting test can never kill. Two seen in practice:

- **No-output statements** — removing a `log`/`info(...)` void call (`removeVoidCall`) does not change the return value, so no output assertion kills it.
- **Consistent internal-format changes** — mutating a key-builder used for BOTH map construction and lookup (e.g. `'$a|$b|$c'`) changes the format on both sides identically, so matching is unaffected.

These are NOT test gaps. Identify them by **reasoning** (the regex tool can't), then exclude their line numbers via the method's `expectedSurvivorLines` so they leave the reachable denominator — exactly the .NET dead-line mechanism. The mined KB often flags them already (a rule noting "the log call is a pure side-effect"). The mutation floor (default 75) usually tolerates a couple of them; raise the floor and exclude the equivalents only when a clean 100% is wanted.

## Test style (so generated tests compile and kill mutants)

- **Example tests** — `flutter_test`: `test()` / `group()`, one test per rule boundary. Assert on the **returned value** (and any observable collaborator call) — never on log output (that over-specifies and only chases equivalent mutants).
- **Mocks** — `mocktail` (no codegen). REUSE the repo's central `test/mocks.dart` where a mock exists; for a collaborator with no mock there, declare a local one in the test file (`class MockFoo extends Mock implements Foo {}`) — do not edit the shared mocks file. Register `mocktail` fallback values for non-primitive arg types.
- **Property tests** — `kiri_check` (`forAll`, shrinking, stateful model testing) is the actively-maintained PBT library; use it for pure functions and state machines. `glados` is effectively unmaintained — avoid.
- **Fixtures** — build realistic model/entity objects through their real constructors (read the model source for required fields; reuse a repo's `test/dummy_data` or `*_dummy.dart` if present). Pin the exact boundary cases each rule turns on so relational, logical, and arithmetic mutants die — including **traversal-direction** cases (a circular-index mutation only dies when 2+ candidates qualify at different positions).
- Collaborators returning `Either<Failure, _>` (dartz): stub `Right(...)` for happy paths and `Left(Failure)` for failure-propagation rules.

Record these facts in a project `docs/conventions/mutation-testing.md` so the Cover agent reads the contract from the consuming repo.

## Cost / scaling note

`mutation_test` runs the full test command **once per mutation** (~13s per `flutter test`). ~20 mutations on a small class ≈ 5 min; a ~190-line class can be 30–60+ min. Mitigations: `mutation_test -c lcov.info` to skip no-coverage mutants, scope the mutate file tightly, and `log()` any truncation — never silently cap coverage.

## What this skill does NOT do

- Own the loop, the gate battery, or the KB ledger — those are `mine-verify-cover` (the core method). This skill is only the Dart toolchain fill.
- Cover widget / golden tests — this adapter targets Dart logic (use-cases, services, Cubits/Blocs), not pixel rendering.
- Decide WHICH class to target — the operator chooses; start with logic-rich, dependency-fakeable classes, not UI-coupled ones.

## Relationship to other skills

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover` | the stack-neutral method this adapter plugs into (read it first) |
| `mine-verify-cover-dotnet` | the sibling .NET adapter — same method, different toolchain fill |
| `tdd` | the boundary-case + kill-the-mutant test discipline |
