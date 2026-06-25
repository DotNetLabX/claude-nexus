# Implementation — Mine→Verify→Cover C++ adapter build

**Status:** Steps 2–4 COMPLETE + offline-validated (the free dev work). Steps 1 (Mine→Verify) + 5 (live Cover run) PAUSED pending owner go-ahead on token spend. Step 6 (report) pending Step 5.

**Branch/isolation:** authored on `adhoc-MineVerifyCppAdapter` in a dedicated `git worktree` (`D:\src\claude-plugins\nexus-cppwt`) — the shared tree is in active use by the concurrent Flutter session; nothing here touches it.

## Step 2 — `harness/cover-cpp.workflow.js` (thin fork) ✅
- Forked `harness/cover-flutter.workflow.js`. **§6 gate battery copied verbatim** — diff vs the Flutter sibling shows ONLY the intended `DART_DISABLE_RE → CPP_DISABLE_RE` rename + comment wording; same 9 battery functions as `cover.workflow.js` (sync check passed).
- Two actors changed: Cover agent writes a **GoogleTest** suite (`extern "C"` include + `int**` matrix helpers); Runner agent runs, **inside the `mvc-probe` Docker image**, `ctest` ×2 + a mutated build + `mull-runner-15`, and consumes mull's `cover.json` (mutation-testing-elements) **as-is** — no translation, since mull's statuses already match the gate schema (the thinnest fork yet).
- Handles the one structural difference from host-native covers: dual path namespaces (`CONTAINER_SRC` = mull-report key/gate lookup; `HOST_SRC` = what the Cover agent reads; `target_mutated` matches on basename).
- `Satisfies:` adapter capabilities 2–5.

## Step 3 — C++ test-style + runner contract ✅
- `harness/cpp/cover-cpp-contract.md`: the 5-capability fill, the Docker host rationale, the workspace layout + the GLOB CMakeLists (so the Cover agent's file is built as `cover_tests`), the dual-path namespaces, the mull→gate (no-translation) note, and the `exit()` blind-spot handling.
- **`exit()` decision (this increment):** pass `hungarian_solve`'s `exit()` lines (371/376/383) via `expectedSurvivorLines` (the proven equivalent-mutant filter); `exit`-neutralization (`--wrap`) noted as a later hardening.
- Vendored the probe toolchain into `harness/cpp/`: `Dockerfile`, `CMakeLists.txt`, `mull.yml`, `index_slice.py`, `parse_mull.py`, `examples/hungarian_smoke_test.cpp`.

## Step 4 — offline workflow-contract guard ✅
- Added a `cover-cpp` slice to `tests/unit/workflow-contract.test.mjs` (sandbox run + meta-purity + the path const) mirroring the Flutter slice.
- **`node --test tests/unit/workflow-contract.test.mjs` → 29/29 pass**, including: `cover-cpp runs in sandbox; gate battery + equivalent-mutant filter work` (variant `inc4-cover-cpp`, all-gates-green, exit()-line survivor excluded) and `cover-cpp.workflow.js meta is a pure literal`. No static import, no `Date`/`Math.random`/`read`/`fs`, args parsed in both JSON-string and object shapes.

## Step 1 — Mine→Verify Hungarian → KB ✅ (live, `wf_356fb6ab-024`)
42 consensus rules (40/42 in all 3 miners; 14 CONFIRMED / 9 IMPRECISE / 18 transcribed); clean-room held (miners read only the source). ~297k tokens, ~6 min → `delivery/kb-hungarian.md`. **Proves Mine→Verify works on C++.**

## Step 5 — one live Cover run on Hungarian ✅ ran end-to-end; gate honestly REFUSED (live, `wf_050b8b0a-d2b`)
5 iterations (cap). **Adapter mechanically proven:** the Docker/mull-15/GoogleTest runner seam all worked — a clean-room Cover agent wrote a compiling 1196-line / 53-test suite; runner ran `ctest`×2 + `-DMULL=ON` build + `mull-runner-15`; mull's `cover.json` consumed as-is. 5/6 gates green (target_mutated 296 mutants, suite_green 53/0 ×2, no_flaky, no_new_skips, char_pin). **mutation_floor FAILED at 46% reachable** (136/293, floor 75) → `cap-reached`, **no fake-green** (the design working). Root cause: the `exit(0)` doublecheck masks invariant-breaking mutants (bigger than the 3 pre-excluded lines) + unobservable internal-state/print/free mutants. ~787k tokens, ~66 min. Full analysis: `delivery/run-cover-hungarian-2026-06-25.md`.

## Step 6 — run report + GO/NO-GO ✅ → `delivery/run-cover-hungarian-2026-06-25.md`
**Verdict: C++ adapter GO (mechanically proven).** Hungarian floor not cleared at black-box (46%); the concrete fix is `--wrap=exit` (turn `exit()`-on-invalid into a test failure → masked mutants become killable) — re-run before certifying this class. Sequencing vs Flutter unchanged; code-grounded review owed at shipped-skill authoring.

## Step 7 — `--wrap=exit` implemented + re-run ✅ → run report `## UPDATE` section
`support/exit_wrap.cpp` (`__wrap_exit` → non-zero exit) + `target_link_options(... -Wl,--wrap=exit)` in the workspace AND the vendored `harness/cpp/` template + contract. **Measured: 46% → 64%** reachable kill on the same suite (zero new tests) — confirms the exit(0) doublecheck was the dominant limiter. A fresh full-loop run (`wf_bd63af3f-389`, 3 iters) **also landed 64%** ⇒ structural ceiling, not a test gap; 68% with the defensible `free()`/`print` void-call exclusion. **`--wrap=exit` is now permanent adapter hardening.** Hungarian stays GO-as-toolchain-proof but is NOT certifiable ≥75 black-box — certify a more observable slice. (The 5 `suite_green` reds were agent hand-math errors, not bugs.)

## Skills Used
None (Workflow authoring + offline validation — no pattern skill applies; the harness is authored/run via Workflow, not the Skill tool). Plan is intentionally all-`None`.

## Open / owed
- The shipped-skill increment that follows still owes a **code-grounded review** (read the live workflow + harness seams) — recommend a critic on `cover-cpp.workflow.js` before the live run even in solo mode.
- The live Docker/mull runner seam (Step 5) is only truly validated by a live run — the offline guard cannot exercise it.
