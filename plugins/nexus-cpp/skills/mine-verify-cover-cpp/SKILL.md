---
name: mine-verify-cover-cpp
description: The C/C++ stack adapter for the mine-verify-cover method — fills its 5 capabilities with mull (the C++ Stryker-equivalent, driving GoogleTest/CTest), libclang evidence indexing, GoogleTest + RapidCheck test style, and a Docker toolchain (clang-15 + mull-15 + GoogleTest + libclang) because mull has no native Windows build (Linux/macOS only). Use when running Mine→Verify→Cover on a C or C++ unit (a function, class, or header-only template) — especially the first run on a repo, which needs the Docker image + workspace bringup below. Ships the toolchain ready to run (toolchain/).
user-invocable: true
---

# Mine→Verify→Cover — C/C++ adapter

The **stack adapter** for `mine-verify-cover` (the nexus core method). The method owns the loop, the gate battery, and the KB ledger; this skill fills the 5 toolchain capabilities for C/C++. Read `mine-verify-cover` first — this skill only supplies the C/C++-specific parts.

The Mine→Verify half is **stack-neutral** — the same clean-room miners + skeptic verify run on a `.cpp`/`.h` source with no change (proven 2026-06 on a C assignment solver). This adapter is really about the **Cover + Gate** half: the mutation tool, the test runner, and the Docker bringup.

## The 5 capabilities, filled for C/C++

| Capability | C/C++ fill |
|------------|------------|
| Evidence indexer | the miner reads the target `.cpp`/`.h` directly; `toolchain/index_slice.py` (libclang) extracts per-function slices for boundary/coupled-file analysis |
| Test runner | `ctest` (GoogleTest, via `gtest_discover_tests`) **inside the Docker image** — run twice for `suite_green` + `no_flaky` |
| Mutation tool | **mull-15** via `mull-runner-15`; emits `cover.json` (mutation-testing-elements) + `cover.sqlite` |
| Test-style contract | GoogleTest `TEST()`; a C SUT is included via `extern "C" { #include "x.h" }`, a C++ SUT by its namespace-qualified calls; `int**`/`std::vector` helpers; RapidCheck `RC_GTEST_PROP` for property tests |
| Prod-source-diff scoping | `git diff -- <slice>` for `char_pin`; the only tolerated change is a `// mull disable` / `// Stryker disable` comment |

## The trust anchor — why mull, and why Docker

C/C++ **does** have a Stryker-grade mutation tool, unlike Dart:

- **mull** (LLVM IR pass-plugin) is the production-viable engine: config-driven (`mull.yml`), headless, and it emits a **mutation-testing-elements JSON** — the *same schema family Stryker uses* — so the per-mutant array is consumed by the gate **AS-IS, with no translation** (the thinnest adapter fork; contrast the Flutter XML translation). It embeds all mutants at compile time via `-fpass-plugin` and `mull-runner-15` toggles them per-run.
- **dextool-mutate** is the heavier AST-based alternative — skip it unless mull can't target your build.
- mull is **Clang/LLVM + Linux/macOS-only** — there is **no native Windows** build that ships the runner (it runs natively on Linux and on macOS via Homebrew). We run every command **inside Docker** regardless — the proven, host-uniform path (the `toolchain/Dockerfile` image: Ubuntu 22.04 + clang-15 + mull-15 + GoogleTest + libclang). On Ubuntu jammy the Cloudsmith repo ships mull up to LLVM 15, so clang/mull are pinned to **15**.

Grounding: `docs/kb/research/cpp-mutation-and-test-tooling.md` in the nexus dev repo (hands-on confirmed); proven end-to-end on the omnivision SDK — see `docs/specs/adhoc-MineVerifyCppProbe` + `adhoc-MineVerifyCppAdapter`.

## Toolchain bringup (the prerequisite — do ONCE per repo)

The C/C++ analogue of the .NET test-project scaffold / the Flutter `build_runner`. You need **Docker running** — nothing is compiled on the host.

1. **Build the image once:** `docker build -t mvc-probe <skill>/toolchain` (clang-15 + mull-15 + GoogleTest + libclang; ~1.2 GB).
2. **Scaffold a workspace** the image mounts at `/probe` — set up ONCE per target, kept OUT of the consuming source tree:
   ```
   workspace/
     CMakeLists.txt   # copy toolchain/CMakeLists.compiled.txt (.cpp slice) OR .header-only.txt (.h/template)
     mull.yml         # copy toolchain/mull.yml.template; set includePaths to your slice
     src/   <slice>   # the SUT, COPIED from the consuming repo (the repo stays pristine — never edited)
     support/ exit_wrap.cpp   # copy toolchain/exit_wrap.cpp IF the slice calls exit()/abort() (see below)
     tests/           # the Cover agent writes <class>_harness_test.cpp here
   ```
3. The runner mounts it: `MSYS_NO_PATHCONV=1 docker run --rm -v "<workspace>:/probe" -w /probe mvc-probe bash -lc '<cmd>'` (the `MSYS_NO_PATHCONV=1` stops Git-Bash mangling `/probe` on a Windows host).

## The mull run (what the runner does)

The Cover agent writes the test file; a distinct runner agent executes the toolchain inside Docker:

1. Configure + build (non-mutated) and run the suite **twice** (for `suite_green` + `no_flaky`):
   ```
   cmake -S /probe -B /probe/build -G Ninja -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
   cmake --build /probe/build
   ctest --test-dir /probe/build    # ×2 — record { passed, failed, skipped } each run
   ```
2. Mutated build + mull on ONLY the target file:
   ```
   export MULL_CONFIG=/probe/mull.yml
   cmake -S /probe -B /probe/build-mull -G Ninja -DMULL=ON
   cmake --build /probe/build-mull
   mull-runner-15 --reporters Elements --reporters SQLite --report-name cover --report-dir /probe/mull-out --workers 4 /probe/build-mull/cover_tests
   ```
3. Read `/probe/mull-out/cover.json`. It is **already** mutation-testing-elements: `files[<path>].mutants[{status, location.start.line, mutatorName, replacement}]`, statuses `Killed`/`Survived`/`Timeout`/`NoCoverage` — exactly the gate's denominator set. Take the target file's `mutants` array **AS-IS** (no translation; `Timeout` counts as a kill).
4. Build `mutatedFiles` (one `{file,count}` per key in `cover.json.files`) for the `target_mutated` anti-fake-green guard — verify your slice's basename was actually mutated (count > 0).
5. **Never execute mutant binaries outside mull.** Survivor triage is **read-only** — reason from `cover.json` + the source. A mutation can break a loop guard and produce a **non-terminating binary**; mull's per-mutant timeout contains that, an ad-hoc probe does not (a live run hand-compiled surviving mutants into a diff harness with no timeout — one spun at 100% CPU and deadlocked the whole workflow until killed). If SUT execution outside `ctest`/`mull-runner-15` is ever unavoidable, wrap it in `timeout <N>s`.

Two path namespaces (the one structural difference from host-native adapters): the **container** source path (`/probe/src/<slice>`) is the mull-report key + the `mutation_floor` lookup; the **host** path is what the Cover agent reads. `target_mutated` matches on basename, so it is namespace-agnostic.

## exit()/abort() neutralization — a FIRST-CLASS limiter, not a footnote

If the SUT calls `exit()`/`abort()` on invalid internal state (a sanity check, a `assert`-like guard), it is a **mutation blind spot**: a mutant that breaks an invariant trips the guard → the process exits status 0 *before the test asserts* → the runner sees "passed" → the mutant **survives undetectably**. Measured on the Hungarian solver: this masking capped black-box kill at **46%**.

**Fix (ship it, don't remember it):** copy `toolchain/exit_wrap.cpp` into `workspace/support/` and link with `-Wl,--wrap=exit` (already in `CMakeLists.compiled.txt`). `exit()` from the SUT is redirected to `__wrap_exit`, which exits **non-zero** → the tripping mutant is **killed**. `main()`-return is unaffected (glibc resolves it inside libc, not via the final link). The Hungarian kill rose **46% → 64%** from this alone. Make `--wrap=exit` a PREREQUISITE for any slice that calls `exit`/`abort` — it is not later hardening.

## Header-only / template targets

mull mutates header-only templates fine: the instantiated code's debug **source path is the header**, so `includePaths: src/<hdr>.h` scopes mutation correctly even though the IR physically lives in the test TU (kept un-mutated by `excludePaths: tests/.*`). Use `CMakeLists.header-only.txt` — no library target, no exit-wrap unless the header calls `exit()`. Proven on `levenshtein.h` (103 mutants, 99 killed = 96% reachable kill; that run's 2 `suite_green` reds were the agent's hand-computed-position errors, not bugs — see the test-style note below).

## Equivalent-mutant filter (reason about it — the tool can't)

Some survivors are **equivalent mutants** a behaviour-asserting test can never kill. Identify them by reasoning, then exclude their line numbers via the method's `expectedSurvivorLines` so they leave the reachable denominator (the .NET dead-line mechanism):

- **`cxx_remove_void_call` on `free()` / `printf` / logging** — removing a free (a leak) or a print (no asserted output) cannot fail a behaviour assertion. **Side-effect-only ⇒ defensibly excludable.**
- **`exit()`-line mutants** (a `remove_void_call` *on* the exit call): once `--wrap=exit` is in, mutants that TRIP exit are killed, but a mutant ON the exit line is genuinely equivalent for a valid-input suite (the guard is never true) — keep those lines excluded.
- **`cxx_assign_const` on internal state** that can propagate to the output is **NOT** provably equivalent — leave it counted. Exclude on mutator-type × observability, never "everything that survived" (that is reward-hacking).

## Test style (so generated tests compile and kill mutants)

- **Example tests** — GoogleTest `TEST()`/`TEST_F()`, one per rule boundary. A C SUT: `extern "C" { #include "x.h" }`. A C++ SUT: include the header and call namespace-qualified (`Ns::fn<T>(...)`). Build inputs in the test; assert ONLY on the **public return value(s)** — never on internal state or log output.
- **Assert STRUCTURAL INVARIANTS, not hand-computed values.** The recurring Cover-agent failure mode (seen on BOTH Hungarian costs and Levenshtein edit-op positions): the agent hand-computes a wrong expected value, the test fails on *correct* code, and `suite_green` goes red on a non-bug. Prefer invariants the agent cannot mis-arithmetic: round-trip (`apply(ops, source) == target`), conservation (`editops.size() == distance`), a reference implementation, or symmetry (`f(a,b)==f(b,a)`). Assert an exact hand-computed value ONLY for a single trivially-traceable case. **A wrong hand-computed expectation is a FALSE failure, never a candidate bug — do not keep it as one.**
- **Property tests** — RapidCheck (`RC_GTEST_PROP`) for pure functions (the FsCheck/kiri_check analogue).
- **Pick boundary cases** that kill relational/arithmetic mutants: every `<`/`<=`/`==`/`!=`, each `+1`, init values, and traversal-direction cases.

Record these facts in a project `docs/conventions/mutation-testing.md` so the Cover agent reads the contract from the consuming repo.

## Run artifacts — written AUTOMATICALLY, every run, without being asked

A run that leaves only a green console is not done. Every run — **all-gates-green OR refused** —
ends by landing THREE artifacts in the **consuming repo** (the orchestrator/agents write them as the
final step of the loop; the operator never has to request them):

1. **The gated test suite** → `tests/mine-code/<area>/<class>_test.cpp` — the deliverable.
   Landed only when the gates pass; a refused run lands no suite (but still writes #2).
2. **The run report** → append a per-class section to the consuming repo's
   `docs/specs/{slug}/delivery/mvc-report.md` (the canonical, cumulative report — one file per
   MVC campaign, one section per class/run; a thin per-run summary next to the test file is optional).
   Required content per section — match the depth of the Flutter pilot's report, not a gate printout:
   verdict + full 6-gate table; **Mine stats** (miners, raw-rules-per-miner, consensus count, agreement
   distribution, triage); **Verify verdicts** (CONFIRMED/IMPRECISE/WRONG + notable corrections);
   **Cover stats** (tests per iteration, cover-quality findings, CANDIDATE BUGS — state "none" explicitly);
   **Gate stats** (mutants, kill history across iterations, **every reachable survivor** classified
   killable vs equivalent-with-reasoning + the `expectedSurvivorLines` hand-off for the next run);
   **incidents** (every anomaly and what rule/fix it produced); **cost** (agents, tokens, wall time).
   A refused or halted run STILL writes its section with the stop reason — never silently exit.
3. **The verified rule KB (the mined BRs)** → the consuming repo's `docs/kb/<class>.md`
   (`kb-entry-schema` shape) — written at the Mine→Verify seam, flipped `verified → mutation-gated`
   when the gates pass. The BRs belong to the consuming project, not to the harness side. **Even when a
   run reuses a previously-mined KB, copy it into the consuming repo** — every input artifact must exist
   there, not only on the harness side.
4. **Evidence copies** → beside the report in `docs/specs/{slug}/delivery/`: every generated suite
   (dated, including refused ones that never land in `tests/`), the KB snapshot(s), and the raw
   per-mutant gate JSON. The consuming repo must hold the complete evidence trail of every run.

`mine-code` vs `mine-spec` stay separate trees (`tests/mine-spec/` for the spec-conformance mode) —
the two modes must never read each other's output during a run.

## Picking a target (this decides the ceiling)

The kill-rate ceiling is the **target's observable surface**, not the harness. Same adapter: Hungarian (output in an opaque `int**`, `exit()` guards, lots of internal bookkeeping) capped at **64%**; Levenshtein (pure input→`int`/op-list return) hit **96%**. **Choose a slice whose rules are observable through its public return value(s)** — a dependency-isolated slice proves the toolchain but is not automatically a good kill-rate target. `index_slice.py` + the mined KB's `[OBS]`/`[INT]` tags tell you which rules are observable.

## Cost / scaling note

mull embeds all mutants in ONE compiled binary, then runs them in-process — **far cheaper than per-mutation rebuilds**: ~300 mutants run in one in-process pass, no per-mutant rebuild. The cost is the LLM Cover loop, not the engine. For an exploratory first run on a new slice, cap `maxIterations` low (1–2) to get the kill signal cheaply before committing to the full feedback loop.

## What this skill does NOT do

- Own the loop, the gate battery, or the KB ledger — those are `mine-verify-cover` (the core method). This skill is only the C/C++ toolchain fill.
- Compile on the host — everything runs in the Docker image (mull has no native Windows build; Docker is the host-uniform path).
- Decide WHICH unit to target — the operator chooses; start with logic-rich, return-observable slices (math, geometry, parsing, distance/scoring, data structures), not framework-coupled (e.g. OpenCV `cv::Mat`-trapped) code.

## Relationship to other skills

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover` | the stack-neutral method this adapter plugs into (read it first) |
| `mine-verify-cover-dotnet` | the sibling .NET adapter — same method (Stryker.NET + dotnet test + xUnit/FsCheck) |
| `mine-verify-cover-flutter` | the sibling Dart/Flutter adapter (mutation_test + flutter test + flutter_test/mocktail) |
| `tdd` | the boundary-case + kill-the-mutant test discipline |
