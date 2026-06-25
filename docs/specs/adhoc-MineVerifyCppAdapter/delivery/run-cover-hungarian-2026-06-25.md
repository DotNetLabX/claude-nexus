# Run report — cover-cpp on Hungarian (2026-06-25)

**Verdict: adapter MECHANICALLY PROVEN end-to-end; gate honestly REFUSED at 46% (< 75% floor).** Not a green certification — and that is the design working, not failing.

## What ran
- **Step 1 Mine→Verify** (`wf_356fb6ab-024`): 42 consensus rules (40/42 in all 3 miners), 14 CONFIRMED / 9 IMPRECISE / 1 self-corrected / 18 transcribed. Clean-room held. ~297k tokens, ~6 min → `kb-hungarian.md`.
- **Step 5 cover-cpp** (`wf_050b8b0a-d2b`): clean-room Cover agent + Docker runner, 5 iterations (cap). ~787k tokens, ~66 min.

## Gate battery (final iteration)
| Gate | Result |
|------|--------|
| target_mutated | ✅ 296 mutants on `hungarian.cpp` |
| suite_green | ✅ 53 tests, 0 failed, both runs (Cover agent wrote a 1196-line GoogleTest suite that compiles + runs in Docker) |
| no_flaky | ✅ 53/0/0 identical across runs |
| no_new_skips | ✅ 0 skips |
| char_pin | ✅ slice untouched |
| **mutation_floor** | ❌ **46% reachable** (136 killed / 293, floor 75; 3 exit-lines pre-excluded) |
| stopped | `cap-reached` (5 iters) — **no fake-green** |

## The win (why this is a successful adapter proof)
Everything the offline guard could NOT test ran for real:
- The **Docker/mull-15 runner seam** works: `ctest` ×2 + a `-DMULL=ON` build + `mull-runner-15`, all inside the `mvc-probe` image.
- mull's `cover.json` (mutation-testing-elements) was consumed **as-is** — no translation, as designed.
- The **gate battery computed honestly** and **refused to certify** below floor. The anti-fake-green machinery (target_mutated, the honest reachable denominator) did its job.
- A clean-room LLM Cover agent produced a real, compiling 53-test suite from the KB across 5 feedback iterations.

So: the C++ adapter is sound. The harness ran the full Mine→Verify→Cover→Gate loop on real SDK C++ code and produced a trustworthy (refused) verdict.

## Why 46% — root cause (a real property of the slice, not a harness defect)
1. **`exit(0)` doublecheck is the dominant limiter.** `hungarian_solve`'s validity check (L367–383) calls `exit(0)` whenever an internal invariant is violated. A mutant that breaks the algorithm makes the process `exit(0)` → the test binary exits status 0 → the test "passes" → **the mutant survives undetectably.** This masks a large fraction of the solve's mutants — far more than the 3 lines pre-excluded via `expectedSurvivorLines`. The probe flagged this; the live run **quantifies it as load-bearing**: it caps black-box kill at ~46%.
2. **Genuinely unobservable mutants.** Survivors include `cxx_assign_const = 42` on internal-state init lines (slack/col_inc/row_dec — not observable via the public API), `cxx_remove_void_call` on `printf`/`hungarian_print_*` (no output asserted) and on the trailing `free()` calls (a leak, not a failed assertion).
3. **Algorithm robustness.** The Hungarian method self-stabilizes; some perturbed intermediate state still yields a correct final assignment.

## The fix (concrete, known)
- **`--wrap=exit` (linker)** in the mutated test build: redirect `exit` to a wrapper that throws / fails the test instead of exiting 0. Every `exit(0)`-on-invalid mutant then becomes a **failing test → killed**. Expected to lift the kill rate substantially. This is the adapter hardening the probe named — now confirmed mandatory for any slice that calls `exit`/`abort` on an invalid internal state.
- Secondary: exclude the structurally-unobservable mutants (the `print`/`free` void-call removals) from the reachable denominator with a documented KB list — they are equivalent-by-construction for a behavior suite.

## Decision
- **C++ adapter: GO** — mechanically proven; ready to harden to a shipped skill.
- **Hungarian floor: NOT cleared at black-box** — re-run after `--wrap=exit` before certifying this class.
- **Sequencing vs Flutter unchanged** (owner's call).
- **Code-grounded review** still owed at shipped-skill authoring time.

## Cost
Step 1 ~297k tok / ~6 min; Step 5 ~787k tok / ~66 min (5 iterations × 2 Docker builds + mull each — expensive because it never cleared and ran the full cap). Future runs: `--wrap=exit` should converge in fewer iterations; consider a lower `maxIterations` for exploratory runs.

---

## UPDATE — `--wrap=exit` re-run (2026-06-25, same day)

The probe's predicted fix was implemented and re-run. **The wrap works and is now permanent adapter hardening — but it does not clear the floor, and nothing honest gets Hungarian there.**

### What changed
`support/exit_wrap.cpp` + `target_link_options(cover_tests PRIVATE -Wl,--wrap=exit)` (workspace + vendored template). `exit(0)` from the SUT now exits **non-zero** → a mutant that trips the doublecheck is **killed**, not masked.

### Results — two independent measurements, both 64%
| Measurement | Reachable kill | Gate |
|---|---|---|
| Pre-wrap (this report, above) | 46% (136/293) | FAIL |
| Wrap, **existing 53-test suite** rebuilt (no agents) | **64% (188/293)** | FAIL |
| Wrap, **fresh 78-test suite** (full loop, 3 iters, `wf_bd63af3f-389`) | **64% (188/293)** | FAIL |
| Wrap + `free()`/`print` void-call exclusion (defensible) | 68% (188/277) | FAIL |

Two independently-written suites plateau at the **same 188 kills** → **64% is a structural ceiling of the slice, not a test-writing gap.** More/better tests do not move it.

### Why 64% is the ceiling
The ~105 reachable survivors are dominated by mutants no black-box behavior suite can kill:
- **`cxx_remove_void_call` on `free()` (L131–135, 409–416) and `printf`/print (L51–64)** — removing a free or a print can't fail a behavior assertion. ~16, provably side-effect-only → defensibly excludable (→68%).
- **`cxx_assign_const = 42` on `[INT]` internal state (L176–225 forest/slack/col_inc)** — not observable through `init/solve/free`; NOT provably equivalent (can propagate to output), so left counted. ~34.
- The rest are boundary-comparison flips on internal paths a stronger suite *might* pick off, but neither suite did — and there aren't enough to reach 75 without also excluding the unobservable class (which would be moving the goalposts).

### `suite_green` red — agent math errors, not bugs
The fresh suite ran 78 passed / **5 failed**. All 5 expected a **higher** assignment cost than the solver returned (e.g. expected 7, got 5). For a *minimization* solver the lower cost is correct → the tests' hand-computed expectations are wrong, not the production code. **Lesson:** the Cover agent must derive expected optimal cost from a reference solver or assert structural invariants (valid permutation, complementary slackness), never hand-computed optimal totals.

### Decision
- **`--wrap=exit`: keep** — mandatory adapter hardening, now in the vendored template + contract.
- **Hungarian floor: not clearable black-box at 75** — 64/68% is structural. Leave the green ≥75 cert for a more observable slice.
- Cost: the cheap wrap measurement was ~0 agent tokens (Docker only); the full loop was ~540k tok / 3 iters (capped, vs 787k at 5).
