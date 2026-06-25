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
add_executable(cover_tests ${COVER_TESTS} support/exit_wrap.cpp)
target_link_libraries(cover_tests PRIVATE hungarian GTest::gtest GTest::gtest_main)
target_link_options(cover_tests PRIVATE -Wl,--wrap=exit)   # exit() neutralization — see below
gtest_discover_tests(cover_tests)
```

Everything else (the `hungarian` lib target, `-DMULL=ON` pass-plugin wiring, `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`) is unchanged from `harness/cpp/CMakeLists.txt`.

## Two path namespaces (the one structural difference from .NET/Flutter)

The .NET/Flutter covers run host-native — one path namespace. The C++ runner runs in a container, so:

- **`CONTAINER_SRC`** (default `/probe/src/hungarian.cpp`) is the **mull-report key** and the `mutation_floor` lookup key. The gate uses this.
- **`HOST_SRC`** is what the Cover agent reads on the host.
- `target_mutated` matches on **basename** (`hungarian.cpp`), so it is namespace-agnostic.

## The `exit()` false-survivor blind spot — NOW NEUTRALIZED (`--wrap=exit`)

`hungarian_solve` calls `exit(0)` in its internal doublecheck (L371/376/383). A mutant that breaks an algorithm invariant trips that check → the process exits status 0 *before the test asserts* → the runner sees "passed" → the mutant **survives undetectably**. This was the dominant kill-rate limiter: it masks any invariant-breaking mutant anywhere in `solve`, not just the 3 exit lines.

**Fix (implemented):** `support/exit_wrap.cpp` defines `__wrap_exit`, linked via `target_link_options(cover_tests PRIVATE -Wl,--wrap=exit)`. Every `exit()` from the SUT is redirected to a wrapper that exits **non-zero**, so a tripping mutant now **fails the run → mull marks it killed**. Returning from `main()` is unaffected (glibc's main-return exit is resolved inside libc, not via our final link). Measured effect on Hungarian: **46% → 64% reachable kill** on the same suite, with zero new tests.

**The 3 exit LINES stay excluded** (`_args.expectedSurvivorLines: [371, 376, 383]`): a `remove_void_call` mutant *on* the exit call is genuinely equivalent for a valid-input suite (the guard is never true on valid inputs, so removing the exit changes nothing) — same equivalent-mutant mechanism as the Flutter log lines and the .NET dead-line list. The wrap fixes the *masking* (mutants elsewhere that TRIP the exit); it does not make the exit lines themselves killable.

**Residual ceiling (measured):** even with the wrap, Hungarian black-box-certifies at ~64% (~68% if the `free()`/`print` void-call removals are also excluded as side-effect-only). The remaining survivors are structurally unobservable through `init/solve/free` — internal `slack`/`col_inc`/`parent_row` writes (`cxx_assign_const`) and `free`/`printf` removals (`cxx_remove_void_call`). Full anatomy: `docs/specs/adhoc-MineVerifyCppAdapter/delivery/run-cover-hungarian-2026-06-25.md`. **Lesson:** Hungarian is a strong *toolchain* target but a weak *kill-rate* target; certify a more observable slice.

## mull report → gate schema (no translation)

mull's `cover.json` is already mutation-testing-elements: `files[<path>].mutants[{status, location:{start:{line}}, mutatorName, replacement}]`, with statuses `Killed`/`Survived`/`Timeout`/`NoCoverage` — exactly the gate's `DENOMINATOR_STATUSES`. The runner returns the target file's `mutants` array **as-is** (unlike the Flutter XML fork, which translates). `Timeout` counts as a kill.

## Run invocation

```
Workflow({ scriptPath: "<abs>/harness/cover-cpp.workflow.js",
           args: { targetClass: "Hungarian", expectedSurvivorLines: [371,376,383],
                   kbRules: "<abs>/kb-hungarian.md" } })
```

Prereq: `docker build -t mvc-probe harness/cpp` once; the workspace set up as above; a verified KB from Mine→Verify (Step 1).
