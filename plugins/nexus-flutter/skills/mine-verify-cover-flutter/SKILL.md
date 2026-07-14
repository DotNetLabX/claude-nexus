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
3. **Score the gate from the stdout summary, not the XML.**

   > **Warning: the `-f xml` report contains ONLY undetected mutations; never infer the kill count from it.**

   Parse the stdout summary lines:
   - `Found {total} mutations` → `total`
   - `Undetected Mutations: {undetected}` → `undetected`
   - `Timeouts: {timeouts}` → `timeouts`
   - `Not covered by tests: {notCovered}` → `notCovered`

   Derive:
   - `reachable = total − notCovered`
   - `killed = reachable − undetected` (Timeouts count as killed — they interrupted a surviving mutation)
   - `killRate = killed / reachable`

   Use the XML `<undetected-mutations>` ONLY to enumerate survivors (line + original→modified) for the survivor report — never to count kills.
4. Clean up the config + `mutation_test_out/` from the app tree.

## Hung and crashing mutants — the abnormal-exit contract

`mine-verify-cover`'s `## The adapter contract` requires the Test runner and Mutation tool fills to state
their concrete hang/crash/re-verify mechanism, not re-derive it per run. The Windows/Dart form, hardened
after three abnormal-exit incidents in one mutation campaign:

- **Timeout must kill the process TREE, not the process.** A hanging `flutter test` leaves a grandchild
  Dart VM holding the stdout pipe open, so a naive `subprocess.run(timeout=...)` NEVER returns on Windows
  — the parent's timeout fires but the child keeps the pipe open and the call blocks forever. The harness
  must (a) redirect output to a FILE, never a captured pipe, and (b) kill the whole tree on timeout —
  `taskkill /F /T /PID {pid}` on Windows (`/T` = tree). Only then does "Timeout counts as a kill"
  (`mine-verify-cover` → `mutation_floor`) actually return a result instead of hanging the harness itself.
- **A crash return code is a kill, not a SUSPECT.** A crashing mutant can hand back a platform crash code
  (Windows `0xC0000409`, a stack-overflow security-cookie fault) paired with an empty or not-all-green
  suite. Treat `rc ∉ {0, clean-fail}` AND not-all-green as **KILLED-by-crash** — never leave it `SUSPECT`
  pending a manual look.
- **Re-verify `char_pin` after every abnormal exit, before scoring the next mutant.** A hard external
  kill or the run's own time limit bypasses a restore-on-exit `finally` and can leave the mutant still
  applied to `lib/` source. Re-run the `git diff -- lib/` scoping (this adapter's capability-5 fill) and
  restore before proceeding — this happened 3× in one campaign; it is not theoretical.

## Equivalent-mutant filter (regex's one weakness — reason about it)

A regex mutator produces **equivalent mutants** a behaviour-asserting test can never kill. Three seen in practice:

- **No-output statements** — removing a `log`/`info(...)` void call (`removeVoidCall`) does not change the return value, so no output assertion kills it.
- **Consistent internal-format changes** — mutating a key-builder used for BOTH map construction and lookup (e.g. `'$a|$b|$c'`) changes the format on both sides identically, so matching is unaffected.
- **`@JsonKey(name: '...')` annotation mutants on json_serializable models — codegen-inert, not just
  equivalent.** Mutating a `@JsonKey(name: '...')` string has NO effect at test time: the generated
  `*.g.dart` holds the actual `_$FromJson`/`_$ToJson` key strings and is not regenerated between applying
  the mutant and running the suite, so no test can observe the change. Worse, even a per-mutant
  `build_runner` regen defeats a *symmetric* `fromJson(toJson())` round-trip test — both directions use
  the renamed key, so the round-trip still passes; only a wire-key-string assertion
  (`toJson()['2d_x_position']` present) paired with the regen would catch it. Default: exclude
  `@JsonKey(name:` annotation lines from the mutated set via `expectedSurvivorLines` (same denominator
  mechanism as the two classes above) — do not chase them with per-mutant `build_runner` regens unless a
  specific wire-format rule is worth the cost, and if so pair it with a wire-key assertion, not a
  round-trip test.

These are NOT test gaps. Identify them by **reasoning** (the regex tool can't), then exclude their line numbers via the method's `expectedSurvivorLines` so they leave the reachable denominator — exactly the .NET dead-line mechanism. The mined KB often flags them already (a rule noting "the log call is a pure side-effect"). The mutation floor (default 75) usually tolerates a couple of them; raise the floor and exclude the equivalents only when a clean 100% is wanted.

For codegen'd stacks generally: a source mutation whose effect is mediated by a build step is inert
unless the build step runs inside the gate loop — own that boundary explicitly rather than rediscovering
it per target.

### Survivor tags — Dart cues (the method's Report-stage taxonomy, filled for Dart)

The method's Report stage tags every residual survivor (see `mine-verify-cover` → "The Report stage — survivor classification"). This adapter supplies the Dart-specific cue per tag, and the one signal the orchestrator can pre-tag:

| Tag | Who assigns | Dart cue |
|-----|-------------|----------|
| `equivalent-logging` | **orchestrator pre-tag** — the one mechanically pre-taggable tag | a void-call removal (`removeVoidCall`) on a `log`/`info`/`warning`/`debug` line. **The adapter must surface the log-call line numbers** so the orchestrator can pre-tag without source: supply them as the `equivalentLoggingLines` set (from the mined KB, which flags log calls as pure side-effects, or a project `docs/conventions/mutation-testing.md`). This is **distinct from `expectedSurvivorLines`** (the denominator-exclusion list): a pre-tagged log survivor STAYS in the reachable survivors so the report can suggest excluding it. |
| `equivalent-format` | classify-survivors agent | a consistent key-builder change — the same interpolation (e.g. `'$a\|$b\|$c'`) mutated on BOTH the map-construction and the lookup side, so matching is unaffected. |
| `dead-code` | classify-survivors agent | a mutation inside a branch no caller reaches — e.g. a backward-edge guard whose input is never forwarded (POG's `goPreviousStep` is never passed into `_isNextIndexValid`, so its branch is dead). |
| `masked` | classify-survivors agent | a fallback/`else` (or a `?? default`) that reproduces the same observable result, so no assertion distinguishes the mutant. |
| `REAL-gap` | classify-survivors agent | a genuine behaviour the suite missed — the only tag that drives another Cover iteration. |

The orchestrator supplies **only** the `equivalentLoggingLines` signal and pre-tags `equivalent-logging`; the source-dependent tags are the classify-survivors agent's call (it has the `.dart` source + the KB) and the orchestrator records its verdict — it never derives them. Live examples seen in pilots: the BuildZpl `info(...)` log survivors (`equivalent-logging`), the CycleCount key-format survivor (`equivalent-format`), the POG `goPreviousStep` dead branch (`dead-code`).

## Test style (so generated tests compile and kill mutants)

- **Example tests** — `flutter_test`: `test()` / `group()`, one test per rule boundary. Assert on the **returned value** (and any observable collaborator call) — never on log output (that over-specifies and only chases equivalent mutants).
- **Mocks** — `mocktail` (no codegen). REUSE the repo's central `test/mocks.dart` where a mock exists; for a collaborator with no mock there, declare a local one in the test file (`class MockFoo extends Mock implements Foo {}`) — do not edit the shared mocks file. Register `mocktail` fallback values for non-primitive arg types. **Rule (not a suggestion): mock ONLY true I/O boundaries** — repositories, plugin `MethodChannel`s, other use-cases — and **never mock a plain data model** (a `*Model` / entity / value object). *Why: a mocked data getter returns a canned value and blinds the suite to aggregation / derivation bugs* — the pilot POG `SdkRealogramModel` gap the rerun closed by constructing real objects instead of stubbing the getter.
- **Property tests** — `kiri_check` (`forAll`, shrinking, stateful model testing) is the actively-maintained PBT library; use it for pure functions and state machines. `glados` is effectively unmaintained — avoid.
- **Fixtures** — construct real domain models via the repo's `*_dummy.dart` factories (or their real constructors when no dummy exists; read the model source for required fields, reuse a repo's `test/dummy_data`) — **never a mocked stand-in for a data model** (see Mocks: mocking a data getter is the aggregation-bug blind spot). Pin the exact boundary cases each rule turns on so relational, logical, and arithmetic mutants die — including **traversal-direction** cases (a circular-index mutation only dies when 2+ candidates qualify at different positions).
- Collaborators returning `Either<Failure, _>` (dartz): stub `Right(...)` for happy paths and `Left(Failure)` for failure-propagation rules.

Record these facts in a project `docs/conventions/mutation-testing.md` so the Cover agent reads the contract from the consuming repo.

## Fact tags & test tiers — Dart/Flutter mapping

The method's fact-tagging + tier vocabulary (`mine-verify-cover` → "Fact tagging & test tiers") is a
**different taxonomy from the survivor tags above** (those classify residual *mutants*; these classify
generated *tests* — extend the vocabulary here, don't collide with `equivalent-logging`/`dead-code`/etc.):

- **Facts → flutter `test()` tags** — `tags: ['layer-domain-calc', 'criticality-golden', 'mutation-gated',
  'runtime-cost-fast', 'arm-code']` (`'arm-spec'` for the spec arm — `mine-verify-cover` → "Mined-test
  location") on the `test(...)` call (flutter_test's native `tags` parameter).
- **Tiers → `--tags` filter expressions** — `smoke` = `flutter test --tags "criticality-golden && runtime-cost-fast"`;
  `full` = `flutter test` (no filter); `gate` = `flutter test --tags "mutation-gated"`, run on target-class
  change.
- **Hyphen composition is mandatory — colon form is a hard failure, not a style nit.** `package:test` tags
  are **flat identifiers with no key-value syntax**: they match `[a-zA-Z_-][a-zA-Z0-9_-]*`
  (`boolean_selector`'s hyphenated-identifier token), and `:` lexes as the **ternary-conditional
  operator**. So `layer:domain-calc` is syntactically invalid in *both* `dart_test.yaml`'s `tags:`
  declarations and `--tags` selector expressions — a colon-form `dart_test.yaml` fails to load outright
  (`Invalid tags key: Expected end of input.`), blocking **every** test in the file. Compose the separator
  as a legal identifier character instead (`layer-domain-calc`): the full fact vocabulary and every tier
  expression survive with no loss. Do not port the .NET adapter's key-value `[Trait("layer", "…")]` shape
  here by analogy — that is where the colon form came from.
- **Declare the tags** used by generated tests in the repo-root `dart_test.yaml` to avoid unknown-tag
  warnings.
- **Mined-test root — place under `test/`, never a top-level sibling.** `flutter test` (bare invocation)
  discovers `test/` by default; a top-level sibling like `test_mine/` is off that path and runs in CI only
  if the pipeline names it explicitly (`mine-verify-cover` → "Mined-test location"). Put both arms under
  `test/mine/`, told apart by the `arm-code` / `arm-spec` tag above, not by folder. One pilot placed the
  code arm in `test_mine/` and the spec arm in `test_mine/spec/`; the project's bare `flutter test`
  invocation (`build_all.sh:93`) discovered the spec arm's 11 tests but never the code arm's 132 — the
  entire mutation-gated code-arm suite was silently absent from CI.
- **The parked-red idiom** — a generated red documenting a genuine spec-code divergence (Cover-from-spec's
  output convention, `mine-verify-cover` → SDD lifecycle) is KEPT, never deleted, and marked:
  ```dart
  test('rule name', () { ... },
    skip: 'SPEC-CODE DIVERGENCE — pending triage: {one-line divergence summary, observed value}');
  ```
  so the suite stays green (`flutter test` reports it skipped, not failed) while the divergence stays on
  the record — the same divergence-marker message shape as the .NET adapter's `[Fact(Skip = "...")]`.

## Minimize stage — Dart fill

The method's Minimize stage (see `mine-verify-cover` → "The Minimize stage") reuses signals and toolchain
this adapter already provides — no new capability.

**Categorical-KEEP — Dart cue.** The method keeps a **degenerate-input** test even when mutation-redundant
(see `mine-verify-cover` → "The Minimize stage", the categorical-KEEP class). In Dart that keeper constructs
the edge and asserts the no-op result — an **empty template `''`**, an **absent-placeholder** input, or an
**empty list `[]`** passed to the use-case, asserting the returned value is unchanged / empty / the
documented safe no-op — and is marked `categoricalKeep: true` so the orchestrator refuses its removal.

**Generation guard signal.** The guard's "no log-output assertions" is the adapter's existing test-style
rule (above, "Test style" — assert on the returned value, never on log output) and the
`equivalentLoggingLines` set this adapter already surfaces (above, "Survivor tags — Dart cues") for a
SECOND use: suppressing emission up front, not only pre-tagging survivors after the fact. The Cover agent
already carries both signals; nothing new is wired.

**Confirm re-gate.** The minimize confirm re-runs the adapter's existing mutation_test pass (above, "The
mutation_test run") on the REDUCED test file — no new capability, same config shape, same stdout-summary
parse. State the cost honestly: `mutation_test` re-runs the whole test command once per mutation, so the
confirm is one more full pass — made cheaper only by the smaller post-minimize suite (fewer assertions to
re-execute per mutation run, not fewer mutations).

**Line-scoping — resolved: supported.** `mutation_test`'s XML config supports true line-range scoping: a
`<lines begin="N" end="M"/>` child element nested inside `<file>` whitelists mutations to that 1-indexed,
inclusive line range (multiple `<lines>` blocks stack for disjoint ranges); with no `<lines>` child the
whole file is mutated, as today. Confirmed against the package's own README and its shipped
`example/config.xml` (`docs/kb/research/mutation-test-dart-line-range-scoping.md`). So the **targeted
at-risk-line confirm is available as a future optimization** for this adapter — nest a `<lines>` block
scoped to the removed tests' at-risk lines instead of mutating the whole file. **Not implemented in this
pass**: the reference harness (Step 3) always runs the full-file re-gate, per the method's "full re-gate is
the sound default" — it inherits every existing anti-fake-green guard and catches attribution errors beyond
the at-risk lines, which a line-scoped re-mutation would not. Revisit the targeted form only if confirm
cost becomes a measured problem.

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
