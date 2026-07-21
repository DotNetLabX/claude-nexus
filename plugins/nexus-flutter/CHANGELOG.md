# Changelog — nexus-flutter


## [0.5.1] — 2026-07-21
- lint_clean gate (eighth gate) ported from the omni twin: analyzer zero-findings on generated tests, capability-4 analyzer-command input, deprecated-member suppression carve-out; flutter analyze fill; flows harness Dart under the same gate. Originally shipped twin-side as omni 1.38.5 / omni-flutter 0.4.4 by Ovidiu Usvat — ported to the source of truth and reconciled with the instrument-integrity release.
  - skill change (mine-verify-cover-flutter)
  - skill change (mine-verify-flows-flutter)

## [0.5.0] — 2026-07-21
- instrument-integrity: kill-attribution rule — timeout/crash/compile-fail are adjudication buckets, never auto-kills; exact floor comparison (no rounding); per-instrument honesty proofs; evidence committed
  - skill change (mine-verify-cover-flutter)
  - owner-escalated to minor

## [0.4.3] — 2026-07-18
**Back-port the first consumer's FL-2 feedback into the `mine-verify-flows-flutter` module spec**
(hand-carried in the omni twin 2026-07-15, now canonical). The scrubJson spec gains the
token-numbering pitfall (first-seen-order tokens assigned across excluded subtrees leak excluded
flips into gated fields as phantom pairwise `{Path_N}` swaps; assign tokens over non-excluded
content only, or derive identity from the value, and the diagnostic to run when the swap signature
appears on an unfixed module). The carried worked-example config gains the candidate-list
exclusion class and marks the `**.sfr` ε as a per-flow calibration outcome, not canon (the
consumer widened its flow to 0.015 after a single-facing step).
  - skill change (mine-verify-flows-flutter)

## [0.4.2] — 2026-07-14
**The Dart/Flutter fills for `mine-verify-cover`'s new abnormal-exit contract, plus a codegen-inert
mutant class and a mined-test placement rule that keeps generated suites in CI.** Hardened against
the `mvr-pilot-1-2026-07-04` campaign, where each of these cost real operator time.

- **`## Hung and crashing mutants — the abnormal-exit contract`** (new). A hanging `flutter test`
  leaves a **grandchild Dart VM** holding the stdout pipe open, so a naive `subprocess.run(timeout=)`
  **never returns on Windows** — the parent's timeout fires but the call blocks forever. The harness
  must redirect output to a **file**, never a captured pipe, and kill the whole tree
  (`taskkill /F /T /PID {pid}`). Only then does "Timeout counts as a kill" return a result instead of
  hanging the harness itself (the pilot's infinite-401-retry mutant then scored KILLED at 75s). A
  crashing mutant hands back a platform crash code (`0xC0000409`, a stack-overflow security-cookie
  fault) with a green-less suite — that is **KILLED-by-crash**, not `SUSPECT`. And `char_pin` gets
  re-run (`git diff -- lib/`) after **every** abnormal exit: a hard kill bypasses the restore
  `finally` and leaves the mutant on `lib/` source — this happened **3× in one campaign**, so it is
  not theoretical.
- **`@JsonKey(name: '...')` mutants are codegen-inert** — a third entry in the equivalent-mutant
  filter ("Two seen" → "Three seen"). Mutating the annotation has no effect at test time: the
  generated `*.g.dart` holds the real `_$FromJson`/`_$ToJson` key strings and is not regenerated
  between applying the mutant and running the suite. Worse, even a per-mutant `build_runner` regen
  defeats a *symmetric* `fromJson(toJson())` round-trip — both directions use the renamed key, so it
  still passes; only a wire-key-string assertion would catch it. Default is to exclude them via
  `expectedSurvivorLines` (the same denominator mechanism as the other two classes). Generalized: on a
  codegen'd stack, a mutation whose effect is mediated by a build step is inert unless that build step
  runs **inside** the gate loop.
- **Mined-test root — `test/mine/`, never a top-level sibling.** Bare `flutter test` discovers `test/`
  by default; a sibling like `test_mine/` is off that path and runs in CI only if the pipeline names
  it. The pilot put the code arm in `test_mine/` and the spec arm in `test_mine/spec/`; its bare
  `flutter test` (`build_all.sh:93`) picked up the spec arm's 11 tests but **never the code arm's
  132** — the entire mutation-gated code-arm suite was absent from CI and nothing alerted. Both arms
  now go under `test/mine/`, told apart by the new `arm-code` / `arm-spec` tags (added to the `tags:`
  mapping) rather than by folder.

Reported in `docs/plugin-feedback/omni-1.22.0-2026-07-05.md` Entries 9/10 and
`docs/plugin-feedback/omni-1.23.1-2026-07-07.md` Entry 2.

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
