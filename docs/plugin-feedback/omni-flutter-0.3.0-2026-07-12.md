# Plugin Feedback — omni-flutter 0.3.0 (2026-07-12)

Source: learner consolidation of the `adhoc-MineVerifyFlows` pipeline (golden-gated on-device flow
tests on a real Flutter app with an FFI/native ML SDK). Lessons:
`docs/specs/adhoc-MineVerifyFlows/delivery/lessons.md`; context in `delivery/spike-findings.md`.

These are the **Flutter-adapter** graduation inputs for a *new* `mine-verify-flows` skill (the
method-level half is in `omni-1.25.1-2026-07-12.md`, Entries 5–10). A future `mine-verify-flows-flutter`
adapter would fill the on-device-flow toolchain the way `mine-verify-cover-flutter` fills the
class-level one. None of this is applied to the consuming repo. Placeholders are Flutter-generic;
OmniShelf specifics are cited only as the worked example.

## Entry 1: on-device output retrieval needs `flutter drive --keep-app-running`, never bare `flutter test`

- **Suggested target:** new `mine-verify-flows-flutter` adapter → on-device run section.
- **Action:** add (new skill)
- **Evidence:** adhoc-MineVerifyFlows determinism spike (run 2 had to be re-done: `flutter test`
  uninstalled the app at teardown and destroyed the outputs before `adb exec-out run-as` could pull
  them). Already captured for this project in `.claude/skills/new-integration-test/SKILL.md` Step 5 —
  this graduates the generic rule to the adapter.
- **Lesson:** `flutter test integration_test/...` uninstalls the app at teardown by design — any
  on-device output a flow test writes for later retrieval dies with it. When outputs must be pulled,
  run via `flutter drive --driver=test_driver/integration_test.dart --target=<flow> --keep-app-running
  --flavor <flavor> -d <device>` with the stock 3-line `integrationDriver()` entrypoint.
  `--keep-app-running` is load-bearing (without it `flutter drive` tears down too). The flow test file
  needs no changes — `integration_test` tests are runner-agnostic as long as they use only
  `IntegrationTestWidgetsFlutterBinding.ensureInitialized()` + plain `expect()`/`print()` and don't
  reach into `flutter test`-specific `reportData`/`callback`/`writeResponseData`.

## Entry 2: blessing an on-device golden is a two-hop pull-then-copy, not a single command

- **Suggested target:** new `mine-verify-flows-flutter` adapter → golden bless/record section.
- **Action:** add (new skill)
- **Evidence:** adhoc-MineVerifyFlows Step 5 (FL-8/FL-10 golden gate).
- **Lesson:** a device-side test process runs entirely inside the app sandbox — there is no path from
  Dart executing on-device back to the host repo's checked-in golden directory. Bless/record mode must
  write the canonicalized+scrubbed candidate to the app's OWN documents dir
  (`files/goldens_bless_output/<flowSlug>/<file>`) and print the exact pull path; the human step (pull
  via `adb exec-out run-as ... tar`, review, copy into the repo, declare as a pubspec asset,
  `flutter pub get`) is the only way a blessed golden reaches the repo. Design bless mode around this
  shape — never assume a direct host-filesystem write from the device side.

## Entry 3: fixture soundness — grep the Dart call chain for FFI/native-channel calls AND `firstWhere` joins

- **Suggested target:** new `mine-verify-flows-flutter` adapter → fixture-strategy section (the
  Flutter-concrete companion to method Entry 7).
- **Action:** add (new skill)
- **Evidence:** adhoc-MineVerifyFlows fix cycles 2–4; the FFI-init-ordering hazard (`omniazcore_method
  _channel.dart` gates `checkInit` per-method, not uniformly).
- **Lesson:** in a Flutter app whose flow re-enters a native/FFI SDK, "seed a pre-recorded output" is
  sound only after grepping the Dart call chain for **both** (a) any platform-channel/FFI method that
  operates on the native engine's stateful data (in OmniShelf: `assistant`, `sendPlanogram`,
  `processReport`, `checkShelfProductsInside`, `calcShelfFillRate` in `omniazcore_method_channel.dart`)
  and (b) any `firstWhere`/entity-id join against seeded deployment data. Passing (a) does not imply
  passing (b). Two Flutter-specific traps to bake into the adapter's checklist: (i) native init gates
  are often opt-in per method — a "cheap-looking" sync setter can skip the gate every other method
  runs, so a native-touching flow must dispatch the SDK-init event before it even if it never calls the
  setter; (ii) a `compute()`/background-isolate native call binds a *separate* copy of the plugin's
  static/singleton state (Dart statics are isolate-local) — an awaited `compute()` proves the spawned
  isolate mutated, not the caller's.

## Entry 4: the golden gate is a pure-Dart module (scrubber + FieldTolerance/FieldExclusion) — carry the two-tier calibration outcome

- **Suggested target:** new `mine-verify-flows-flutter` adapter → golden-gate mechanism.
- **Action:** add (new skill)
- **Evidence:** adhoc-MineVerifyFlows Step 4 (`json_golden.dart`) + Step 5 calibration.
- **Lesson:** implement the JSON golden gate as a Flutter-free pure-Dart module (`json_golden.dart` in
  the pilot — canonicalize → scrub GUID/timestamp/path → compare) so it is host-testable off-device,
  and extract any pure-Dart logic out of harness files that import `flutter_test`/`path_provider` into
  a sibling under `integration_test/support/` for the same reason. The gate must support three verdicts,
  not two: exact-match, `FieldTolerance` (bounded numeric drift), and `FieldExclusion` (shape-varying or
  garbage fields). The calibrated FL-8 outcome to graduate as the worked example is the **two-tier
  answer** — semantic exact-match + class-wide exclusions for geometry/garbage via `**.`-suffix rules +
  a single per-field tolerance `**.sfr` ε 0.005 — NOT the determinism spike's provisional "tolerance
  ships unused" (true only for the SDK-stage files the spike reached; see method Entry 5/8).
