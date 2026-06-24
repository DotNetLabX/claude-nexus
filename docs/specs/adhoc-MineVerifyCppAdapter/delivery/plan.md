# Mine→Verify→Cover — C++ adapter build (dev-repo increment)

**Feature Spec:** None (ad-hoc technical increment)
**Parent:** `docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md` — C++ adapter (GO'd by `adhoc-MineVerifyCppProbe`).
**Mirror pattern:** `harness/cover-flutter.workflow.js` (the in-flight Flutter fork) — itself a thin verbatim fork of `harness/cover.workflow.js`.
**Backing:** `docs/kb/research/cpp-mutation-and-test-tooling.md`; probe report `docs/specs/adhoc-MineVerifyCppProbe/delivery/probe-report.md`.

## Context

The probe proved the C++ toolchain (clang-15 + mull-15 + libclang + GoogleTest, in Docker) end-to-end on the Hungarian slice. This increment turns that into a working **C++ Cover adapter** running the real Mine→Verify→Cover→Gate loop on one class — mirroring how the Flutter adapter is being built: **dev-repo harness work, NO plugin skill, NO version bump.** Hardening to a shipped `mine-verify-cover-cpp` skill (with its mandatory code-grounded review + bump) is a *later* increment, after C++ proves out on a real target.

## Scope

**In:** Mine→Verify on the Hungarian slice → a verified KB; a new `harness/cover-cpp.workflow.js` (thin fork) wiring the probe's Docker toolchain as the runner; offline-guard validation; one live Cover run reaching the mutation floor; a run report.

**Out:** a shipped `nexus-cpp` plugin skill + version bump (later increment); domain-rich slices (OpenCV/Eigen-trapped — need the slice-isolation budget; follow-up); multi-class sweep / Discover; touching the SDK repo (slice stays the copied, read-only file).

**Isolation (binding — concurrent Flutter session in this tree):** implement on a **dedicated branch via `git worktree`** (`adhoc-MineVerifyCppAdapter`). `harness/` is the active contention zone (Flutter just added `cover-flutter.workflow.js` there) — do NOT author `cover-cpp.workflow.js` in the shared working tree.

## The 5 capabilities, filled for C++ (mirrors the .NET adapter table)

| Capability | C++ fill |
|------------|----------|
| Evidence indexer | miner reads the target `.cpp`/`.h` directly (libclang slice `index_slice.py` for coupled-file/boundary analysis later) |
| Test runner | `ctest` (GoogleTest) **in the probe's Docker image** — run twice for `suite_green` + `no_flaky` |
| Mutation tool | **mull-15** via `mull-runner-15` → `probe.json` (mutation-testing-elements; already Stryker-shaped) |
| Test-style contract | GoogleTest `TEST()` + `extern "C"` include + matrix helpers; RapidCheck `RC_GTEST_PROP` for property tests |
| Prod-source-diff scoping | `git diff` of the copied slice for `char_pin` (mull suppression comments are the only allowed change) |

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | run `harness/mine-verify.workflow.js` on `hungarian.cpp`; KB out nexus-side | Mine→Verify is stack-agnostic; no skill to invoke |
| 2 | (none) | — | no | author `harness/cover-cpp.workflow.js` as a verbatim-gate fork of `cover-flutter.workflow.js` | thin-fork; pattern is the sibling file |
| 3 | (none) | — | no | C++ test-style + runner mechanism (GoogleTest/Docker/mull.yml + `exit()` handling) | — |
| 4 | (none) | — | no | validate against `tests/unit/workflow-contract.test.mjs` (offline guard) | — |
| 5 | (none) | — | no | one live Cover run on Hungarian, Docker runner, floor ≥75% reachable | live LLM loop — token cost |
| 6 | (none) | — | no | run report + domain-slice GO/NO-GO | — |

**All-`None` (preserve the exemption):** the harness is authored/run via **Workflow**, not the Skill tool; the Cover agent applies `tdd` *inside* the loop (not a hand-coded plan step). The `mine-verify-cover` core skill + `cover-flutter.workflow.js` are read as the spec/mirror, not invoked.

## Implementation Steps

### Step 1 — Mine→Verify the Hungarian slice → verified KB
Run `harness/mine-verify.workflow.js` (3 clean-room miners → consolidate → skeptic verify → KB write) on the copied `hungarian.cpp`. KB out **nexus-side** (keep the SDK pristine): `harness/.runs/` or `docs/specs/adhoc-MineVerifyCppAdapter/delivery/kb-hungarian.md`, `kb-entry-schema` shape.
- **Accept:** a verified rule KB entry for the Hungarian assignment class (status `verified`), ≥1 interpretive rule the skeptic confirmed. `Satisfies:` adapter capability-1 (evidence indexer reads C source).
- Confidence: high (Mine→Verify is stack-agnostic + proven on .NET; C source is in-model).

### Step 2 — Author `harness/cover-cpp.workflow.js` (thin fork)
Fork `cover-flutter.workflow.js`. **Copy the §6 gate battery VERBATIM** (keep-in-sync comment). Change exactly two actors:
- **Cover agent** writes a **GoogleTest** suite (`TEST()`, `extern "C"` include, the `make_matrix`/`free_matrix` helpers from the probe seed test) — one test per rule boundary; red-on-current kept + flagged; forbidden to edit the slice/mull config/KB.
- **Runner agent** runs, **inside the probe's Docker image**, `ctest` ×2 + a mutated build + `mull-runner-15`, then translates `probe.json` → the existing `mutants` schema (`Killed`/`Survived`/`Timeout`/`NoCoverage`) — a **near-identity** map since mull already emits mutation-testing-elements. Builds the honest `mutatedFiles` list for `target_mutated`.
- Files: `harness/cover-cpp.workflow.js` (new). Reuse the probe assets (`Dockerfile`, `mull.yml`, `parse_mull.py`) as the runner mechanism; vendor them under `harness/cpp/` so the workflow is self-contained.
- **Accept:** `meta` is a pure literal; args parsed via the `_argsRaw`/`JSON.parse` pattern; the gate battery is byte-identical to `cover.workflow.js`'s (diff-checkable). `Satisfies:` capabilities 2–5.
- Confidence: medium (thin fork, but the runner's Docker-exec + report translation is new).

### Step 3 — C++ test-style + runner contract
Document the GoogleTest API the Cover agent must follow (so generated tests compile) + the Docker/mull runner mechanism, in `harness/cpp/cover-cpp-contract.md`. **Decide the `exit()` blind spot:** for this increment, pass the `hungarian_solve` `exit()`-region line numbers (L371/376/383) as `expectedSurvivorLines` (the proven equivalent-mutant filter — mirrors Flutter's log-line exclusion), and note `exit`-neutralization (`--wrap`) as a later hardening. State this in the contract.
- **Accept:** the contract names the test API + the runner command + the expected-survivor lines; the Cover agent reads it via a path arg.

### Step 4 — Offline-guard validation
Run `node tests/unit/workflow-contract.test.mjs` (or the project's workflow-contract guard) against `cover-cpp.workflow.js`: no static `import`/`fs`/`require`/`process`, no `Date()`/`Math.random()`, `meta` pure literal, args-may-be-stringified parse, `budget.spent()` treated as the shared pool (gate on marginal). **Validate offline — never discover these on an expensive live run.**
- **Accept:** the guard passes for the new workflow.

### Step 5 — One live Cover run on Hungarian (the spend)
Run `cover-cpp.workflow.js` on the Hungarian KB from Step 1, Docker runner. Bounded loop to the mutation floor.
- **Accept:** all 6 gates green (`target_mutated`, `suite_green`, `no_flaky`, `mutation_floor` ≥75% reachable, `no_new_skips`, `char_pin`); harness-**generated** GoogleTest tests kill mull mutants; cost recorded (output tokens + wall-time). A sub-100% honest kill that clears the floor is a pass — residual survivors reported, not hidden.
- Confidence: medium-low (first live LLM loop on C++; the runner Docker-exec seam is new). This is the increment's real proof.

### Step 6 — Run report + domain-slice decision
Write `docs/specs/adhoc-MineVerifyCppAdapter/delivery/implementation.md` + a run report: gates, kill score, cost vs the .NET/Flutter baselines, and a GO/NO-GO on extending to a **domain slice** (which needs the slice-isolation budget — OpenCV/Eigen carve-out).
- **Accept:** a binary verdict on whether the adapter is ready to harden to a shipped skill (the next increment) and whether a domain slice is worth the isolation cost.

## Testing Strategy

The gate battery IS the test: Step 4 proves the workflow is runtime-legal offline; Step 5 proves the generated suite compiles, double-runs green, and clears the mull floor. The `cover-cpp` gate battery must be **diff-identical** to `cover.workflow.js`'s — a sync check is part of Step 2's acceptance.

## KB Impact

Step 1 produces a verified KB entry (Hungarian). On a GO at Step 6, a follow-up updates the harness roadmap (C++ adapter proven end-to-end) — out of this increment's scope.

## Open Questions

None blocking. Defaults taken (architect's call, all reversible): KB nexus-side (SDK stays pristine); Docker (not WSL) as the runner host (probe-proven); `exit()` handled via `expectedSurvivorLines` this increment (neutralization later). The one genuine owner decision is the **live-run spend** at Step 5 — surfaced at the checkpoint, not assumed.

## Plan Review

**Mode:** self-review (standalone). **Verdict: PASS** — every capability + the live loop maps to a step; scope corrected to dev-repo (no bump) after grounding against `cover-flutter.workflow.js` and the absence of a Flutter plugin skill.

**Disclosure:** this increment is dev-repo and self-reviewed; the **shipped-skill increment that follows still owes a code-grounded review** (read the live workflow + harness seams), not a doc critic. The gate-battery-sync risk (Step 2) is the one correctness hazard a reviewer should check — recommend a critic on the `cover-cpp.workflow.js` diff before the live run even in solo mode.
