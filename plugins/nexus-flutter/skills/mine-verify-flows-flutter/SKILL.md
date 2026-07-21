---
name: mine-verify-flows-flutter
description: The Dart/Flutter stack adapter for the mine-verify-flows method — fills its 5 capabilities with flutter drive --keep-app-running on-device runs, the two-hop adb pull golden bless, app-documents-dir pre/post output capture, a pure-Dart canonicalize→scrub→compare golden module, and the fixture-soundness greps (FFI re-entry, entity-id joins, per-method init gates). Use when running Mine→Verify→Cover at flow scope on a Flutter app with integration_test — especially flows that re-enter a native/FFI SDK or write JSON output documents on-device.
user-invocable: true
---

# Mine→Verify→Cover (flow scope) — Dart/Flutter adapter

The **stack adapter** for `mine-verify-flows` (the nexus core method). The method owns the pipeline, the gate battery, the calibration doctrine, and the flow registry; this skill fills the 5 device-toolchain capabilities for Dart/Flutter. Read `mine-verify-flows` first — this skill only supplies the Flutter-specific parts.

The Mine→Verify half is **stack-neutral** — the same clean-room flow miners + skeptic re-trace run on Dart routes/screens/blocs with no change. This adapter is really about the **Cover + Gate** half: running flow tests on a device, capturing what they write, and gating it against goldens.

## The 5 capabilities, filled for Dart/Flutter

| Capability | Dart/Flutter fill |
|------------|-------------------|
| On-device runner | `flutter drive --keep-app-running` against `integration_test/` flow tests (never bare `flutter test` when outputs must be pulled) |
| Golden bless + pull | two-hop: bless mode writes candidates into the app's own documents dir, a human pulls via `adb exec-out run-as … tar`, reviews, commits as pubspec assets |
| Output capture | app-documents-dir pre/post snapshot; gated files = the post-minus-pre set difference, filtered to the flow's output patterns |
| Golden-gate module | a pure-Dart (Flutter-free) canonicalize → scrub → compare module, host-testable off-device |
| Harness bringup | fixture seeding + fake camera/API adapters + native-SDK init ordering (plus the class-scope adapter's repo bringup: pub get, build_runner, HTTPS rewrite) |

## On-device runs — `flutter drive --keep-app-running`, never bare `flutter test`

`flutter test integration_test/...` **uninstalls the app at teardown by design** — any on-device output a flow test writes for later retrieval dies with it (pilot-verified 2026-07: a determinism run had to be redone for exactly this). When outputs must be pulled afterward, run:

```
flutter drive --driver=test_driver/integration_test.dart --target={flow test file} \
  --keep-app-running --flavor {flavor} -d {device}
```

`--keep-app-running` is load-bearing — without it `flutter drive` tears down too. Omit `--flavor` on a flavorless app. The driver entrypoint is the stock two-liner — create `test_driver/integration_test.dart` if the repo lacks it:

```dart
import 'package:integration_test/integration_test_driver.dart';
Future<void> main() => integrationDriver();
```

The flow test file needs **no changes** to be runner-agnostic: use only `IntegrationTestWidgetsFlutterBinding.ensureInitialized()` plus plain `expect()`/`print()`, and never reach into the `flutter test`-specific `reportData`/`callback`/`writeResponseData` APIs.

**The sabotage re-run** (the method's gate) uses the same invocation: the runner agent perturbs one asserted field in the checked-in golden file, re-runs the identical `flutter drive` command (the rebuild re-bundles the asset), confirms the test goes RED, then restores the golden (`git checkout -- {golden path}`).

## Blessing a golden is a two-hop pull-then-copy, never a single command

A device-side test process runs entirely inside the app sandbox — there is **no path from Dart executing on-device back to the host repo's** checked-in golden directory. Design bless mode around that:

1. **Device hop** — bless mode canonicalizes+scrubs the candidate, writes it to the app's OWN documents dir (`files/goldens_bless_output/{flowSlug}/{file}`), and prints the exact pull path.
2. **Human hop** — pull the candidates:
   ```
   adb exec-out run-as {appId} tar c files/goldens_bless_output -C {appDocsPath} | tar x
   ```
   (`{appDocsPath}` = the parent data directory the bless run prints — use the printed path verbatim; on Android the `files/` operand composes against the app data root, not path_provider's documents dir.) Then review the JSONs ("this result is correct" — the method's one human approval), copy them into the repo's golden directory, declare them as pubspec assets — **one `assets:` entry per flow subdirectory; pubspec asset directories are not recursive** — and run `flutter pub get`.

Verify mode loads goldens via the asset bundle and fails with remediation text when a golden asset is not bundled. Gate config (tolerances/exclusions) applies at **compare time** — a config change never forces a re-bless.

## Output capture — device-side pre/post listing

The flow test itself takes the snapshots — the orchestrator has no filesystem, and the app sandbox is not host-visible mid-run:

1. Before driving the flow, list the output directory's files as **relative paths** (a shared `listFilesRelative`-style helper in the pilot).
2. Drive the flow to its terminal state.
3. List again; **gated files = the post-minus-pre set difference**, filtered to `.json` and the flow's registered output patterns.

A pure path-set diff catches *created* files; for a flow the registry says **modifies** seeded files, record file sizes (or hashes) in the pre-listing so a rewrite at the same path is caught too. Each gated file then runs through the golden-gate module with the flow's declared tolerances/exclusions.

## Harness bringup — seeding and the fakes

- **Fixture seeding** — the test's setup copies the committed fixture tree (the sync-snapshot dir + any capture frames) into the app's real on-device directories before the flow runs, resolving the seeded task/config by content match (never by hard-coded id); assert the output dir is empty pre-run.
- **Fake camera / fake API** — installed at the test entrypoint via the harness's DI overrides: the fake API adapter answers unstubbed calls with an empty-success response (output generation stays fully local, per the method), and the fake camera feeds the seeded fixture frames so scan-flows drive the real native pipeline without hardware capture.
- **Native-SDK init ordering** — bind the FFI symbol table (SDK init) **before** SDK configuration calls; the two traps below apply every time.
- The class-scope adapter's repo bringup (`flutter pub get`, `build_runner`, the HTTPS rewrite — see `mine-verify-cover-flutter`) is a prerequisite here too.
- **Generated Dart must pass `flutter analyze` clean** — flow tests, harness files, and the golden-gate module all sit on the repo's analyzer path; apply the class-scope adapter's lint gate (`mine-verify-cover-flutter` → "The lint gate") to every file this harness writes.

## Fixture soundness — grep the Dart chain before seeding a pre-recorded output

The method's two disqualifying greps (`mine-verify-flows` → Fixture strategy), made concrete for Flutter — before seeding any pre-recorded output, grep the flow's Dart call chain for **both**:

1. **Platform-channel/FFI methods that operate on the native engine's stateful data** (in the pilot app: `assistant`, `sendPlanogram`, `processReport`, `checkShelfProductsInside`, `calcShelfFillRate` in the plugin's method-channel file), and
2. **`firstWhere`/entity-id joins against seeded deployment data** — catalog match (names) is necessary but a recording made against a different config *version* still throws on the id join.

Two Flutter-specific traps to check every time:

- **Native init gates are often opt-in per method.** A cheap-looking sync setter can skip the `checkInit` gate every other method runs — so a native-touching flow must dispatch the SDK-init event **before** it, even if the flow never calls the gated setter.
- **A `compute()`/background-isolate native call binds a *separate* copy of the plugin's static/singleton state** — Dart statics are isolate-local. An awaited `compute()` proves the *spawned isolate* mutated its state, not the caller's.

## The golden-gate module is pure Dart — host-testable off-device

Implement canonicalize → scrub → compare as a **Flutter-free pure-Dart module** so it unit-tests on the host with no device (the pilot shape, proven):

- `canonicalizeJson(jsonText, unorderedArrays)` — recursive key-sort + fixed-indent re-serialize; arrays reordered only via opt-in `UnorderedArray(path, sortKeyField)` declarations.
- `scrubJson(jsonText)` — GUID → timestamp → device-path patterns, each distinct original value mapped to a first-seen-order token (`Guid_N`, `Timestamp_N`, `{Path_N}`) so referential identity survives scrubbing. **Numbering pitfall (consumer-run-confirmed):** first-seen-order across the WHOLE document includes subtrees that `FieldExclusion` will later skip — an excluded-field flip can renumber tokens referenced by gated fields, producing a phantom diff (signature: a pure pairwise `{Path_A}`↔`{Path_B}` swap on fields whose raw values are identical). Assign tokens only over non-excluded content, or derive token identity from the value (basename/hash); if you hit the signature on an unfixed module, check where the two originals first appear before treating it as real instability.
- `FieldTolerance(path, epsilon)` and `FieldExclusion(path)` — the two knobs beyond exact-match, with the `**.` suffix wildcard (dot-anchored) and exact-path-beats-suffix precedence.
- A diff-record list as the compare output (path, actual, golden per disagreeing field) — empty list = gate green.

Extract any pure-Dart logic **out of harness files that import `flutter_test`/`path_provider`** into a sibling module for the same host-testability reason.

The gate supports **three verdicts, not two** — exact (default), tolerance, exclusion. **The calibrated worked example to carry** is the two-tier outcome: semantic exact-match for pure-Dart-flow and SDK-stage outputs; for FFI report-stage JSONs, class-wide `**.` **exclusions** for the geometry/garbage classes — including ranked below-the-winner candidate lists (alternative-SKU/OCR tails; gate the winner, never the tail) — plus the single tolerance `**.sfr` ε 0.005 (per-flow calibrated; a later consumer widened its own flow to ε 0.015 after observing a single-facing step — the ε is a flow-level calibration outcome, not canon). The calibration doctrine itself — why class excision, not tolerance tuning, and why a verdict is scoped to the files actually produced — is the method's (`mine-verify-flows` → Gate calibration + determinism-verdict scoping); this adapter only carries the calibrated config.

**Exclusion is deliberate blindness.** An excluded field is skipped before inspection — an excluded array's length/membership drift is invisible too, not just its values. Use exclusion only on diagnosed shape-varying/garbage classes, never as a convenience.

## The golden hardware pin, concretely

The method owns the pin-one-profile principle; the adapter's concrete fill: the pilot pinned a **Pixel 7 Pro API 30 arm64 AVD** — reproducible on Apple Silicon hosts and ~5× faster than the reference physical device. Evidence for why the pin is load-bearing: in the pilot's cross-device comparison, 58/112 shared output files differed and 28 more existed on one hardware only (crop filenames embed confidence values). CI runs the same pinned AVD profile.

## What this skill does NOT do

- Own the pipeline, the gate battery, the calibration doctrine, or the flow registry — those are `mine-verify-flows` (the core method). This skill is only the Dart/Flutter device-toolchain fill.
- Widget/pixel golden tests — this adapter gates the flow's **JSON output documents**, not rendering.
- Class-scope mutation gating — that is `mine-verify-cover-flutter` (the sibling adapter); its repo bringup (pub get, build_runner, HTTPS rewrite) is a prerequisite here too.
- Decide WHICH flows to cover — flow selection is the method's rule (operator choice guided by registry criticality).

## Relationship to other skills

| Skill | Relationship |
|-------|-------------|
| `mine-verify-flows` | the stack-neutral method this adapter plugs into (read it first) |
| `mine-verify-cover-flutter` | the class-scope sibling adapter — same stack, different unit (one class, mutation-gated); supplies the shared repo bringup |
| `tdd` | the test discipline the Cover agent follows |
