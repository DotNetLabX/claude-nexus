# Cover-C++ adapter — toolchain contract

The C++ fill of the `mine-verify-cover` 5-capability adapter contract, driving `harness/cover-cpp.workflow.js`. Mirrors the `.NET` adapter's contract doc and the Flutter fork. **Dev-repo reference, not a shipped skill** (hardening to `mine-verify-cover-cpp` is a later increment).

## The 5 capabilities, filled for C++

| Capability | C++ fill |
|------------|----------|
| Evidence indexer | the miner reads the target `.cpp`/`.h` directly; `harness/cpp/index_slice.py` (libclang) extracts per-function slices for boundary/coupled-file analysis later |
| Test runner | `ctest` (GoogleTest) **inside the `mvc-probe` Docker image** — run twice for `suite_green` + `no_flaky` |
| Mutation tool | **mull-15** via `mull-runner-15`; emits `cover.json` (mutation-testing-elements) + `cover.sqlite` |
| Test-style contract | GoogleTest `TEST()`; the SUT is C → include via `extern "C" { #include "hungarian.h" }`; `int**` matrix helpers; RapidCheck `RC_GTEST_PROP` for property tests (optional) |
| Prod-source-diff scoping | `git diff -- <slice>` for `char_pin`; the only tolerated change is a `// mull disable` / `// Stryker disable` comment (`CPP_DISABLE_RE`) |

## Host reality (why Docker)

mull is Clang/LLVM + **Linux/macOS only** — no native Windows. The runner executes every command in the `mvc-probe` image (Ubuntu 22.04 + clang-15 + mull-15 + GoogleTest + libclang), built once from `harness/cpp/Dockerfile`. On jammy the Cloudsmith repo ships mull up to LLVM 15, so the clang/mull majors are pinned to **15** (not 18). See `docs/kb/research/cpp-mutation-and-test-tooling.md`.

## Workspace layout (mounted to `/probe`)

The HOST workspace (default `harness/cpp/workspace`, mounted `-v "<host>:/probe"`) is set up ONCE per target before the first run:

```
workspace/
  CMakeLists.txt        # GLOB variant (below) — builds the slice lib + the cover test target
  mull.yml              # scopes mutation to src/<slice>.cpp (includePaths)
  src/   hungarian.cpp  # the SDK slice, COPIED in (read-only; SDK never edited), + hungarian.h
  tests/ <cover agent writes *_harness_test.cpp here>
```

- `Dockerfile`, `mull.yml`, `index_slice.py`, `parse_mull.py`, and the seed-test example are vendored in `harness/cpp/`.
- The slice is **copied** from `D:\omnishelf\omnivision-ai-sdk\src\trackers\sortcpp\hungarian.{h,cpp}` — the SDK stays pristine.

### GLOB CMakeLists (so the Cover agent's file is picked up)

The probe's `CMakeLists.txt` builds a fixed seed test; the live workspace instead globs `tests/` into one binary named `cover_tests` (the `TEST_BINARY` arg default):

```cmake
file(GLOB COVER_TESTS tests/*.cpp)
add_executable(cover_tests ${COVER_TESTS})
target_link_libraries(cover_tests PRIVATE hungarian GTest::gtest GTest::gtest_main)
gtest_discover_tests(cover_tests)
```

Everything else (the `hungarian` lib target, `-DMULL=ON` pass-plugin wiring, `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`) is unchanged from `harness/cpp/CMakeLists.txt`.

## Two path namespaces (the one structural difference from .NET/Flutter)

The .NET/Flutter covers run host-native — one path namespace. The C++ runner runs in a container, so:

- **`CONTAINER_SRC`** (default `/probe/src/hungarian.cpp`) is the **mull-report key** and the `mutation_floor` lookup key. The gate uses this.
- **`HOST_SRC`** is what the Cover agent reads on the host.
- `target_mutated` matches on **basename** (`hungarian.cpp`), so it is namespace-agnostic.

## The `exit()` false-survivor blind spot (probe finding)

`hungarian_solve` calls `exit(0)` in its internal sanity check (L371/376/383). A mutant that trips one exits the process with code 0 → the test "passes" → the mutant **survives** undetectably. Until `exit`-neutralization (linker `--wrap=exit`, or a fork-isolated per-mutant runner) lands, pass those line numbers via `_args.expectedSurvivorLines: [371, 376, 383]` so `mutation_floor` excludes them from the **reachable** denominator — the same equivalent-mutant mechanism as the Flutter log lines and the .NET dead-line list. **Hardening TODO:** wrap `exit` so these become real, killable mutants.

## mull report → gate schema (no translation)

mull's `cover.json` is already mutation-testing-elements: `files[<path>].mutants[{status, location:{start:{line}}, mutatorName, replacement}]`, with statuses `Killed`/`Survived`/`Timeout`/`NoCoverage` — exactly the gate's `DENOMINATOR_STATUSES`. The runner returns the target file's `mutants` array **as-is** (unlike the Flutter XML fork, which translates). `Timeout` counts as a kill.

## Run invocation

```
Workflow({ scriptPath: "<abs>/harness/cover-cpp.workflow.js",
           args: { targetClass: "Hungarian", expectedSurvivorLines: [371,376,383],
                   kbRules: "<abs>/kb-hungarian.md" } })
```

Prereq: `docker build -t mvc-probe harness/cpp` once; the workspace set up as above; a verified KB from Mine→Verify (Step 1).
