# Changelog — nexus-flutter


## [0.4.1] — 2026-07-14
**Fix `mine-verify-cover-flutter`'s fact tags: colon form is unparseable in `package:test`.** The
adapter's "Fact tags & test tiers" mapping shipped `tags: ['layer:domain-calc', 'criticality:golden',
'runtime-cost:fast']` and `--tags "criticality:golden&&runtime-cost:fast"` — written by analogy to
the .NET adapter's key-value `[Trait("layer", "…")]` shape. But `package:test` tags are flat
identifiers (`[a-zA-Z_-][a-zA-Z0-9_-]*`, `boolean_selector`'s hyphenated-identifier token) with no
key-value syntax, and `:` lexes as the ternary-conditional operator — so the documented form is
syntactically invalid in both `dart_test.yaml` `tags:` declarations and `--tags` selectors. A
colon-form `dart_test.yaml` fails to load outright (`Invalid tags key: Expected end of input.`),
blocking every test in the file.
- Switched the examples and tier filters to hyphen composition (`layer-domain-calc`,
  `criticality-golden && runtime-cost-fast`) — the full fact vocabulary and every tier expression
  survive with no loss.
- Added the grammar note explaining *why* (so the .NET analogy isn't re-derived), and a reminder to
  declare generated tests' tags in the repo-root `dart_test.yaml` to avoid unknown-tag warnings.

Reported twice and unapplied for 10 days: `docs/plugin-feedback/omni-flutter-0.3.0-2026-07-04.md`
Entry 1 (reproduced load failure + `boolean_selector-2.1.2` source inspection), re-flagged as still
open by `omni-1.23.1-2026-07-07.md` Entry 3 — where a correctly-tagged suite in the consuming repo
had independently re-derived the hyphen workaround, evidence the example was actively misleading.

## [0.4.0] — 2026-07-14
**Add the `mine-verify-flows-flutter` adapter — the Dart/Flutter fill for the new flow-scoped
`mine-verify-flows` method (nexus 1.34.0).** Fills the method's 5 device-toolchain capabilities:
`flutter drive --keep-app-running` on-device runs (bare `flutter test` uninstalls the app at
teardown and destroys the outputs before they can be pulled), the two-hop golden bless (device
docs-dir write + printed pull path → human `adb exec-out run-as … tar` pull, review, pubspec-asset
commit — no path exists from on-device Dart back to the host repo), app-documents-dir pre/post
output capture, a pure-Dart host-testable canonicalize→scrub→compare golden module (three
verdicts — exact / FieldTolerance / FieldExclusion — with the `**.` suffix wildcard and the
calibrated two-tier worked example), and the fixture-soundness greps (FFI re-entry + `firstWhere`
entity-id joins, the per-method `checkInit` gate trap, the `compute()` isolate-local-statics
trap). Goldens are hardware-pinned (worked example: Pixel 7 Pro API 30 arm64 AVD). Proven in the
OmniShelf pilot (FL-8/FL-10 golden-gated on-device through the real FFI SDK).
(adhoc-MineVerifyFlows)

## [0.3.0] — 2026-07-03
- **`mine-verify-cover-flutter` — fact tags & test tiers mapping (`adhoc-SddMergeGen`).** New capability:
  maps the core method's fact-tagging vocabulary (`mine-verify-cover` → "Fact tagging & test tiers") to
  the Dart/Flutter toolchain — facts as flutter `test()` `tags:`, the `smoke`/`full`/`gate` tiers as
  `flutter test --tags` filter expressions, and the parked-red idiom (`skip: 'SPEC-CODE DIVERGENCE …
  pending triage'`) for a generated test that documents a divergence without failing the suite. A
  distinct taxonomy from the existing survivor-tag table — extends it, does not collide.

## [0.2.1] — 2026-07-01
- **`mine-verify-cover-flutter` — fixture rule (F3) + categorical-KEEP Dart cue (F1).** Hardened the
  Fixtures/Mocks guidance from a suggestion into a **rule**: mock ONLY true I/O boundaries (repositories,
  plugin `MethodChannel`s, other use-cases) and **never mock a plain data model** — a mocked data getter
  blinds the suite to aggregation/derivation bugs (the pilot POG `SdkRealogramModel` gap the rerun closed by
  constructing real objects). Added a Dart cue for the method's new categorical-KEEP class: a degenerate-input
  keeper (empty template `''`, absent-placeholder, empty list `[]`) that asserts the unchanged/no-op result,
  marked `categoricalKeep: true`. (adhoc-MvcSuiteFidelity)

## [0.2.0] — 2026-06-30
**Add the `figma-to-flutter` design-fidelity skill.** Ports the skill from omnishelf_flutter_app into the plugin so the nexus pipeline can produce pixel-accurate Flutter widgets from Figma nodes. It reads exact specs via the Figma MCP (`get_design_context`/`get_metadata`/`get_screenshot`) and maps them mechanically to this design system's primitives — `AppColors` tokens (no inline `Color(0x…)`), `AppText.*` styles (no raw `Text()`), `pxToW`/`pxToH` scaling (no raw px), and lucide-first `AppIcons` — then verifies with a golden test against the Figma screenshot. Marked `user-invocable: true` (`/figma-to-flutter`). Grounded in the PD-5444 cycle-count card rebuild, where eyeballed (not spec-checked) layouts produced a crashing card and wrong icons. Passed both ADR-1 dev-repo gates — `skill-lint` (exit 0) and the `evaluate-skill` Judgment Gate (findings in `docs/skill-evals/2026-06-30-figma-to-flutter.md`, verdict ACCEPT); the gate added a scope fence, a prefix-agnostic Figma-MCP tool-load step (the server prefix varies — `mcp__figma__*` vs `mcp__claude_ai_Figma__*`), and a lessons-capture pointer. (adhoc-FigmaToFlutterSkill)

## [0.1.3] — 2026-07-01
- **`mine-verify-cover-flutter` — Minimize stage Dart fill (ADR-37).** Documented the Dart-specific signals
  for the new method-level Minimize stage: guard-signal reuse and the confirm re-gate reusing the existing
  `mutation_test` run. Line-range scoping for a future targeted re-gate was researched (supported via
  `<lines begin/end>`) and noted as an optional future optimization — the harness runs the full-file
  re-gate (the sound default).
All notable changes to the `nexus-flutter` plugin are documented here.

## [0.1.2] — 2026-06-26
**Dart survivor-tag cues for the Report-stage taxonomy.** Maps the method's five survivor tags to Dart-specific cues and marks `equivalent-logging` as the one tag the orchestrator can pre-tag — specifying that the adapter must surface the log-call line numbers as an `equivalentLoggingLines` set (from the mined KB or a project `docs/conventions/mutation-testing.md`), kept distinct from the `expectedSurvivorLines` denominator-exclusion list (a pre-tagged log survivor stays in the reachable survivors so the report can suggest excluding it). Lists the Dart cue per agent-assigned tag (consistent key-builder change → `equivalent-format`; unreachable backward-edge branch → `dead-code`; fallback/`else` → `masked`) with live pilot examples (BuildZpl log survivors, CycleCount key-format, POG `goPreviousStep` dead branch).

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
