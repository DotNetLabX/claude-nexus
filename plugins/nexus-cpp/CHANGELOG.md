# Changelog — nexus-cpp

All notable changes to the `nexus-cpp` plugin.

## [0.1.5] — 2026-07-09
- **C++ graph-extraction recipe: clang-uml + Joern fallback (adhoc-AgentGrounding).**
  `mine-verify-cover-cpp/SKILL.md` gains a self-contained graph-extraction section beside `## Picking
  a target`: **clang-uml** as the extraction layer feeding `graphify-out/GRAPH_REPORT.md`
  (`compile_commands.json` via Ninja, GraphML + JSON model output, context-radius and path/regex
  filters that exclude god nodes at extraction time); **CodeQL** flagged licence-barred for private
  repos; **Joern** as the zero-build fallback when no compilation database can be produced. The SDK
  research entry (`docs/kb/research/cpp-code-graph-tooling.md`, omnivision repo) is cited as
  provenance only.
  - skill change (mine-verify-cover-cpp)

## [0.1.4] — 2026-07-04

- **Registry artifact contract: ledger emission moves to `docs/business-rules/<area>/<unit>.md`.** Per
  ADR-45 (nexus dev repo), mined rule ledgers are their own artifact species, separate from the KB
  namespace. The `mine-verify-cover-cpp/SKILL.md` emission path now lands at
  `docs/business-rules/<area>/<unit>.md` in registry row grammar (`source: code | spec | both`,
  `status`, `criticality: golden | core | edge | untagged`, `last_verified` — defined in the core
  `mine-verify-cover` skill's `## The rule registry` section), replacing the old per-class KB path. The
  research-pool grounding reference is untouched. Contract-text only, no adapter/tooling behavior change
  (PATCH).

## [0.1.3] — 2026-07-04

- **Run report deepened + full evidence trail in the consuming repo.** The canonical report is now the
  cumulative `docs/specs/{slug}/delivery/mvc-report.md` (one section per class/run) at the Flutter
  pilot's depth: Mine/Verify/Cover/Gate stats, every survivor classified, candidate bugs stated
  explicitly, incidents, cost. Reused KBs must still be copied into the consuming repo, and every
  generated suite (including refused ones) + KB snapshots + raw gate JSON land as evidence copies in
  the same delivery folder.

## [0.1.2] — 2026-07-04

- **Mandatory run artifacts, written automatically.** Every run (green OR refused) now ends by landing
  three artifacts in the consuming repo without being asked: the gated test suite
  (`tests/mine-code/<area>/<class>_test.cpp`), a full run report beside it (gate table, mutation score,
  every reachable survivor classified killable-vs-equivalent, candidate bugs, evaluation verdict —
  refused/halted runs still write it with the stop reason), and the mined BR KB in the consuming repo's
  `docs/kb/` (verified → mutation-gated on green). Also pins the `mine-code`/`mine-spec` folder split.

## [0.1.1] — 2026-07-04

- **Runner contract: never execute mutant binaries outside mull.** Survivor triage is read-only
  (reason from `cover.json` + the source); any unavoidable SUT execution outside `ctest`/`mull-runner-15`
  must be wrapped in `timeout`. Grounded in a live deadlock: a hand-run non-terminating mutant (broken
  loop guard, no timeout) hung a whole Cover run at 100% CPU until killed. Feedback:
  `docs/plugin-feedback/nexus-cpp-0.1.0-2026-07-02.md`.

## [0.1.0] — 2026-06-25

Initial release. C/C++ stack adapter for the nexus `mine-verify-cover` method.

- **`mine-verify-cover-cpp` skill** — fills the 5 adapter capabilities for C/C++: mull-15 (the C++
  Stryker-equivalent) driving GoogleTest/CTest, libclang evidence indexing, GoogleTest + RapidCheck test
  style, and a Docker toolchain (clang-15 + mull-15 + GoogleTest + libclang) because mull has no native Windows build (Linux/macOS only).
- **Ships the toolchain** (`toolchain/`): `Dockerfile`, `exit_wrap.cpp` (the `--wrap=exit` neutralization),
  `mull.yml.template`, CMakeLists templates (compiled-slice + header-only), and the libclang index +
  mull-parse helpers.
- Consumes mull's mutation-testing-elements JSON **as-is** (same schema family as Stryker — no translation).
- Bakes in the proven lessons: `--wrap=exit` for `exit()`/`abort()` masking, header-only template mutation,
  the void-call equivalent-mutant filter, and "assert structural invariants, not hand-computed values."
- Proven end-to-end on the omnivision SDK: Hungarian (64%, `exit()`-masking ceiling) and Levenshtein
  (96% green cert). Grounding: nexus dev-repo `docs/specs/adhoc-MineVerifyCppProbe` + `-CppAdapter`.
