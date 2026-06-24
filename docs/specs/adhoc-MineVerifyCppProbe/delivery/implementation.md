# Implementation — Mine→Verify→Cover C++ adapter Phase-0 probe

**Status:** Steps 1–4 COMPLETE + green. Step 5 (live harness Workflow run) PAUSED pending owner go-ahead on token spend. Step 6 (GO/NO-GO report) pending Step 5.

**Host (deviation from plan, sanctioned):** plan said WSL2 Ubuntu; actual machine has WSL2 but only the `docker-desktop` distro + Docker Desktop installed. Used **Docker** (Ubuntu 22.04 container) instead — functionally identical for the probe (Linux + Clang + mull), lower friction (no Ubuntu-in-WSL setup). Recorded as `Deviated (valid reason)`.

**Toolchain pin (deviation from plan, forced):** plan/research assumed LLVM 18 + mull-18. On jammy the Cloudsmith mull-stable repo ships mull only up to LLVM 15 (mull-11/13/14/15). Re-pinned to **clang-15 + mull-15 (mull 0.34.0)**. The harness/adapter must select the clang major by what mull packages exist for the chosen base image.

Workspace (throwaway): `…/scratchpad/cpp-mvc-probe/` — `Dockerfile`, `CMakeLists.txt`, `src/hungarian.{h,cpp}` (byte-identical copy, sha1 `46251e6…`), `tests/hungarian_smoke_test.cpp`, `mull.yml`, `index_slice.py`, `parse_mull.py`. SDK at `D:\omnishelf\omnivision-ai-sdk` was **read-only** — never modified.

## Step 1 — WSL/Docker host + isolated slice build under Clang ✅
- Built the isolated 2-file slice as a static lib under **clang-15 15.0.7**, `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`.
- **Accept met:** build exit 0; `grep -iE 'opencv|ncnn|eigen|openexr|curl' compile_commands.json` → **zero hits** (isolation from the SDK's heavy native deps proven). `compile_commands.json` emitted.

## Step 2 — GoogleTest + CTest, green-twice ✅
- `find_package(GTest)` (libgtest-dev) + `gtest_discover_tests`; one seed test pinning the unique optimal assignment of `[[1,2,3],[2,4,6],[3,6,9]]` (mates 2/1/0, total 10).
- **Accept met:** `ctest` ran twice, `1/1 Passed` both, identical counts → `suite_green` + `no_flaky` have a real runner.

## Step 3 — mull mutation gate ✅ (the highest-friction step)
- Mutated build via `-fpass-plugin=/usr/lib/mull-ir-frontend-15` (env `MULL_CONFIG=mull.yml`); `mull-runner-15 --reporters Elements --reporters SQLite`.
- **Accept met:** mull ran headless over **296 mutants**; **100 killed** (70 Killed + 30 Timeout), 196 survived. Machine-readable `probe.json` (mutation-testing-elements) + `probe.sqlite` emitted; a 25-line `parse_mull.py` extracts the kill ratio → the `mutation_floor` gate has a real, parseable number.
- **Scoping confirmed:** all 296 mutants confined to `src/hungarian.cpp` (`includePaths` worked; test + gtest excluded).
- **Real kills in the assignment logic:** `cxx_lt_to_le@L269`, `cxx_eq_to_ne@L109`, `cxx_assign_const@L350`, etc.
- **Finding — `exit(0)` blind spot (confirmed live):** `hungarian_solve`'s internal double-check calls `exit(0)` (L371/376/383). A mutant tripping it makes the process exit 0 → the test falsely "passes" → mutant survives. Part of the 196 survivors are this blind spot + the never-called `hungarian_print_*` functions + the untested `MAXIMIZE_UTIL` branch. The eventual adapter should neutralize `exit`/`abort` under test (e.g. an `--wrap` or a fork-isolated runner) so these aren't false survivors.

## Step 4 — libclang evidence slice (Mine input) ✅
- `clang.cindex` (pip `libclang`) over `compile_commands.json`; extracted all **8 function definitions** with line ranges (incl. `hungarian_solve` L142–417, `hungarian_init` L72–123) to `evidence/hungarian.slice.md`.
- **Accept met:** per-function evidence slice produced.
- **Findings (2, for the adapter):** (1) do NOT force the system `libclang-15.so` — the pip bindings ship their own newer matching lib; forcing the system one fails on symbol mismatch (`clang_CXXMethod_isDeleted`). (2) Raw `compile_commands.json` args trip the parser (`-fpass-plugin`, color, `-o *.o`); whitelist only `-I/-isystem/-D/-std` flags. A harmless `stddef.h not found` diag remains (builtin-header path) — doesn't affect source-extent extraction.

## Step 5 — one end-to-end Mine→Verify→Cover pass ⏭ DEFERRED (owner decision)
Not run as a throwaway shim. Owner decision (2026-06-24): the toolchain — the real unknown — is proven by Steps 1–4, so the LLM loop becomes the first *planned* increment of the real C++ adapter build rather than a ~250k-token throwaway. The three seams it needs (evidence indexer, gtest/ctest runner, mull gate) are all proven above.

## Step 6 — GO/NO-GO report ✅ → `delivery/probe-report.md`
**Verdict: GO.** Build the C++ adapter as the next planned increment. Sequencing vs Flutter stays the owner's call; code-grounded review mandatory at adapter-authoring time.

## Skills Used
None (toolchain bring-up — no pattern skill applies; the harness is invoked via Workflow, not the Skill tool). Plan is intentionally all-`None`; the `nexus:research` skill was used earlier in the session to produce `docs/kb/research/cpp-mutation-and-test-tooling.md`.
