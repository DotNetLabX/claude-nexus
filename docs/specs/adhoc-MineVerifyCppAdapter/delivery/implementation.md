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

## Step 1 — Mine→Verify Hungarian → KB ⏸ PAUSED (live LLM run)
Run `harness/mine-verify.workflow.js` on the copied `hungarian.cpp` → a verified KB the Cover agent writes tests against. Token cost; awaiting go-ahead.

## Step 5 — one live Cover run on Hungarian ⏸ PAUSED (live LLM run)
Run `cover-cpp.workflow.js` (Docker runner) → all 6 gates, floor ≥75% reachable, cost numbers. Awaiting go-ahead.

## Step 6 — run report + domain-slice GO/NO-GO ⏸ pending Step 5

## Skills Used
None (Workflow authoring + offline validation — no pattern skill applies; the harness is authored/run via Workflow, not the Skill tool). Plan is intentionally all-`None`.

## Open / owed
- The shipped-skill increment that follows still owes a **code-grounded review** (read the live workflow + harness seams) — recommend a critic on `cover-cpp.workflow.js` before the live run even in solo mode.
- The live Docker/mull runner seam (Step 5) is only truly validated by a live run — the offline guard cannot exercise it.
