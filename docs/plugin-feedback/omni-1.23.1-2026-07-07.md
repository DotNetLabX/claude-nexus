# Plugin Feedback — omni 1.23.1 / omni-flutter (2026-07-07)

Source: audit of the `test_mine/` generated-suite estate on omnishelf_flutter_app (branch
`epic/OmniShelf-V6`), 13 mine-verify-cover code-arm suites generated 2026-07-02..05. Investigation
prompted by "the tagging feature is shipped, so why aren't the code-arm tests tagged, and why are the
two arms in different folders?"

## Entry 1: Cover-from-code emits fact tags on ~1 in 13 suites — the "test-writer emits the facts" contract is unenforced

- **Suggested target:** `mine-verify-cover` → `## Fact tagging & test tiers` (the line "Cover's
  test-writer emits the facts on the generated test") + the Cover/Report stage gates.
- **Action:** Make tag emission a **verified Cover/Report-stage gate**, not prose. After Cover writes a
  suite, assert that every `test(...)` carries the required facts (`layer`, `criticality`,
  `runtime-cost`) — e.g. a post-Cover check that the count of `tags: [` occurrences equals the test
  count, failing/​warning the Report if not. Today the sentence is a request the Cover agent silently
  skips most of the time.
- **Evidence:** Of 13 code-arm suites in `test_mine/`, **exactly one** carries per-test tags —
  `data/models/sdk_model/sdk_product_model_rules_test.dart` (created 2026-07-05, 16 tagged tests,
  correct hyphen form `layer-domain-calc` / `criticality-core` / `runtime-cost-fast`). The other 12
  have zero. Fact-tagging shipped in omni 1.21.0 (2026-07-04) and is unchanged in the installed 1.23.1,
  so **5 of the 6 suites generated on 2026-07-05 — after the feature was available — still emitted no
  tags.** This is an adherence gap, not a capability gap: `sdk_product_model` proves the path works.
- **Condensed lesson:** a stage instruction that isn't checked by a gate gets followed ~1 time in 6.
  The spec-arm Generate path already tags reliably because its close-out verifies the suite; the
  code-arm Cover path has no equivalent post-write assertion.

## Entry 2: the method consolidates rules but is silent on test-file location — the two arms drift into separate folders and the code arm falls out of CI

- **Suggested target:** `mine-verify-cover` (arm-agnostic note) + `mine-verify-cover-flutter` (Dart
  path convention).
- **Action:** Prescribe (a) a **single mined-test root** for both arms and (b) an `arm-code` /
  `arm-spec` fact tag so the two arms colocate and are distinguishable by filter rather than by folder.
  State the **default-path consequence explicitly**: a top-level sibling of `test/` (like
  `test_mine/`) is NOT discovered by bare `flutter test`, so a suite placed there runs in CI only
  if the pipeline names the path. The skill should tell the orchestrator to either place mined tests
  under `test/` or wire the extra path into the project's test command.
- **Evidence:** The code arm landed in `test_mine/` (off the default path) and the spec arm in
  `test_mine/spec/` (on it) — no skill guidance drove either choice; both folder names were
  improvised. `build_all.sh:93` runs bare `flutter test`, which discovers `test_mine/spec/`
  (11 spec tests) but **never `test_mine/` (132 code-arm tests)** — the entire mutation-gated
  code-arm suite is absent from CI and nobody was alerted. The "one set" the method actually produces
  is the rule registries under `docs/kb/golden/` (Merge stage); test-file consolidation was never
  specified, so teams reasonably assume the tests merged too.
- **Condensed lesson:** consolidating rules but not tests, and being silent on the default-path
  discovery rule, leaves a repo with two divergent suites and a silent CI blind spot on the larger one.

## Entry 3 (status re-flag): colon-form tag fix from omni-flutter-0.3.0 (2026-07-04) is still unapplied

- The `mine-verify-cover-flutter` "Fact tags & test tiers" section **still documents the colon form**
  (`'layer:domain-calc'`, `--tags "criticality:golden&&runtime-cost:fast"`) as of 2026-07-07, despite
  the 2026-07-04 feedback (`omni-flutter-0.3.0-2026-07-04.md`, Entry 1) proving colons are unparseable
  in `package:test` and must be hyphens. The one correctly-tagged suite (Entry 1 above) independently
  re-derived the hyphen workaround — evidence the adapter example is actively misleading implementers.
  No new lesson; this is a not-yet-actioned re-flag of the existing one.
