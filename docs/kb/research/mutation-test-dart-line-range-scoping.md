# mutation-test-dart-line-range-scoping

## Does mutation_test (Dart, pub.dev) support scoping a mutation run to a line range within a single file?

**Verdict:** Yes — `mutation_test` natively supports true line-range scoping via a `<lines begin="N" end="M"/>` child element nested inside `<file>`, not just a regex-approximation.
**Evidence tier:** read-docs
**As-of:** 2026-07-01
**Validity scope:** `mutation_test` (pub.dev) versions 1.0.0 through current 1.8.x; XML schema `<mutations version="1.0">`, the same schema version the nexus-flutter adapter already emits.
**Status:** current
**Reconfirm trigger:** a future `mutation_test` major version (e.g. a 2.x release) that changes the XML schema and removes, renames, or deprecates the `<lines>` element; or a CHANGELOG entry documenting its removal.
**Corroboration:** single primary source (the package's own GitHub repo / pub.dev listing — there is no independent third-party documentation of this niche tool), corroborated internally across 3 independent files within that source (README.md, `example/config.xml`, CHANGELOG.md) plus the pub.dev-hosted mirror of the same docs. Low-stakes optional-optimization question (the method's confirm design already treats targeted scoping as optional, full re-gate as the sound default either way), not a high-stakes verdict — single-source with internal cross-file corroboration is acceptable.

## Verdict

Yes. The `mutation_test` Dart package (`domohuhn/mutation-test` on GitHub, published as `mutation_test` on pub.dev) supports true line-range scoping of mutations within a single file. Inside a `<file>` element under `<files>`, one or more `<lines begin="N" end="M"/>` child elements act as a whitelist: only mutations whose source location falls within `[begin, end]` (1-indexed, inclusive) are generated; if no `<lines>` child is present, the whole file is mutated as before. The same `<lines begin="N" end="M"/>` element also works inside the global `<exclude>` block to blacklist line ranges across matching files. This is a first-class, documented XML config feature — not merely an approximation via regex include/exclude patterns — though the tool separately also supports regex/token-based exclusion patterns that could be layered on top.

## Finding

- The XML schema documented on the package's pub.dev page and GitHub README shows `<lines begin="N" end="M"/>` as a valid child of `<file>`, used to whitelist line ranges for mutation; the docs state that with no whitelist the whole file is used, and that the line index starts at 1 [1][2].
- The package's own shipped example config, `example/config.xml` in the `domohuhn/mutation-test` repository, contains a real working example: a `<file>` entry for `example/source2.dart` with a nested `<lines begin="9" end="60"/>`, using the same `<mutations version="1.0">` schema root the nexus-flutter adapter already emits [3].
- `<lines begin="N" end="M"/>` is also valid inside the top-level `<exclude>` block, to globally blacklist a line range from mutation across matching files; explicit exclusions take precedence over inclusions, so an excluded line range wins even inside an otherwise-whitelisted file [1][2].
- Separately, `mutation_test` also supports regex- and token-based include/exclude rules (e.g. a `<regex pattern="..." dotAll="true"/>` inside `<exclude>`) for excluding constructs like comments, loop conditions, or import/export statements — a content-pattern mechanism distinct from, and weaker/less precise than, the numeric line-range scoping, since it matches by text pattern rather than by explicit line number [2].
- No `CHANGELOG.md` entry documents the addition of the `<lines>` whitelist as a "new" feature in any released version; the earliest changelog entry is simply "1.0.0: Initial version," consistent with line-range scoping having existed since the package's first pub.dev release rather than being bolted on later [4].
- There is no separate CLI flag for line-range restriction — scoping is expressed only through the XML config file's `<lines>` element, not via command-line arguments; the closest CLI-level scoping is `--coverage` (lcov-based, excludes uncovered lines, added in 1.6.0), which is an orthogonal mechanism [2][4].

## Fix

- The nexus-flutter mutation-testing adapter skill should document `<lines begin="N" end="M"/>` nested inside `<file>` as the supported, native mechanism for scoping a `mutation_test` run to a line range in one file, and should generate this element when a caller wants to mutate only a specific rule/method's line span rather than the whole file [1][2][3].
- The adapter should note the element is 1-indexed and inclusive on both ends (`[begin, end]`), and that multiple `<lines>` blocks can be stacked under one `<file>` to whitelist several disjoint ranges in the same file [1][2].

## Alternatives

- If finer-than-line scoping were ever needed (e.g. scoping to a single expression rather than a line span), regex/token-based `<exclude>` rules could approximate it by pattern-matching the surrounding code — unnecessary here since native line-range scoping already exists and is more precise [2].
- Coverage-driven exclusion (`--coverage` with an lcov file, added in 1.6.0) offers an orthogonal way to skip mutating uncovered lines; it can be combined with `<lines>` scoping but is not a substitute for explicit line-range targeting [4].

## Caveat

WebFetch calls in this research summarize page content through a secondary model rather than returning raw HTML/markdown byte-for-byte, so quoted wording is reconstructed rather than a literal copy-paste dump. However, five independent fetch/search calls (pub.dev package page, GitHub root README rendered view, raw README.md, an independent WebSearch, and the actual `example/config.xml` file content) all independently reproduced the identical, specific XML syntax and matching example line numbers, which is strong internal corroboration against hallucination. Separately, a schema-reference table surfaced a current schema attribute of `version="1.2"` while the repo's own live example still declares `version="1.0"` — this discrepancy was not fully resolved, but it does not appear to affect whether `<lines>` scoping works, since the shipped example runs against the current tool version.

## Fallback

If a future `mutation_test` release changes the XML schema and this verdict turns out wrong on re-check (e.g. `<lines>` renamed or removed in a major version bump), fall back to regex/token `<exclude>` pattern matching to approximate scoping, or run `mutation_test` on the whole file and post-filter the mutant report by line number outside the tool (e.g. via a git-diff line-range filter applied externally to the tool's output). Reconfirm by fetching the current README/example config for the installed `mutation_test` version before relying on `<lines>` again.

## Sources

[1] https://pub.dev/packages/mutation_test
[2] https://github.com/domohuhn/mutation-test (README.md)
[3] https://github.com/domohuhn/mutation-test/blob/main/example/config.xml
[4] https://github.com/domohuhn/mutation-test/blob/main/CHANGELOG.md

## Recommendation

The nexus-flutter mutation-testing adapter skill should document and use `<lines begin="N" end="M"/>` nested inside `<file>` as the supported, native way to scope a `mutation_test` run to a line range in one file, citing `example/config.xml` in `domohuhn/mutation-test` as the reference pattern — the Minimize stage's confirm re-gate can use it as the optional at-risk-line optimization instead of the full-file re-gate. If this is later found not to work against a specific installed version, re-run this research against that version's README/CHANGELOG before falling back to regex-exclude approximations.
