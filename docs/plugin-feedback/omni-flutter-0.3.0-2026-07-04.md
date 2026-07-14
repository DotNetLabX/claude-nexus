# Plugin Feedback — omni-flutter 0.3.0 (2026-07-04)

## Entry 1: colon-form test tags are invalid in package:test's tag grammar

- **Suggested target:** `mine-verify-cover-flutter` → section "Fact tags & test tiers — Dart/Flutter mapping"
- **Action:** Replace the colon-form fact-tag examples and tier filter expressions with hyphen form throughout the section:
  - `tags: ['layer:domain-calc', 'criticality:golden', 'runtime-cost:fast']` → `tags: ['layer-domain-calc', 'criticality-golden', 'runtime-cost-fast']`
  - `flutter test --tags "criticality:golden&&runtime-cost:fast"` → `flutter test --tags "criticality-golden && runtime-cost-fast"`
  - Add one grammar note: package:test tag identifiers match `[a-zA-Z_-][a-zA-Z0-9_-]*` (`boolean_selector`'s hyphenated-identifier token); `:` is tokenized as the ternary-conditional operator, so colon-form tags are syntactically invalid in BOTH `dart_test.yaml`'s `tags:` declarations and `--tags` selector expressions. Tags used in tests should also be declared in `dart_test.yaml` to avoid unknown-tag warnings.
- **Evidence:** PD-5263 spec-arm pilot close-out (omnishelf_flutter_app, branch `feat/PD-5263-mvc-rule-tests`, 2026-07-04):
  1. A `dart_test.yaml` declaring colon-form keys failed to load entirely — `Error on line 5, column 3 of dart_test.yaml: Invalid tags key: Expected end of input.` — a hard failure blocking every test in the file, not a warning.
  2. Source inspection of `boolean_selector-2.1.2/lib/src/{scanner,parser}.dart` confirms `--tags "criticality:golden && …"` throws the same `Expected end of input.` after lexing `criticality` as a bare identifier.
  3. Hyphen form verified working end-to-end: 11 fact-tagged tests, suite 5 pass / 6 skip / 0 fail; tier filter `--tags "criticality-golden && runtime-cost-fast"` correctly excluded the one `criticality-core` test. See `test_mine/spec/pd5263_spec_conformance_probe_test.dart` + repo-root `dart_test.yaml`.
- **Condensed lesson:** The adapter's fact→native-filter mapping was written by analogy to the .NET `[Trait("layer", "…")]` key-value form, but flutter/package:test tags are flat identifiers with no key-value syntax — the separator must itself be a legal identifier character. Hyphen composition (`layer-domain-calc`) preserves the full fact vocabulary and every tier expression with no loss. The parked-red idiom (`skip:`) is unaffected and verified working.
