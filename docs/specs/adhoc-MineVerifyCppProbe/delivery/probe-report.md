# C++ adapter Phase-0 probe — GO/NO-GO report

**Verdict: GO** — the Mine→Verify→Cover toolchain is viable on the omnivision-ai-sdk's real C++ code. Build the C++ adapter as the next planned increment.
**Date:** 2026-06-24
**Decision (owner):** stop the probe at the toolchain proof; make the LLM loop (former Step 5) the first *planned* increment of the real adapter build, not a throwaway shim.
**Scope of evidence:** one dependency-light slice — `hungarian.{h,cpp}` (419 LOC pure C, the SDK's assignment solver), built + tested + mutated + indexed in a Docker Ubuntu-22.04 container. SDK never modified.

## What the probe proves (the original question: "are we ready to port to C++?")

**Yes on the toolchain — proven, not asserted.** Every adapter capability except the LLM loop itself ran end-to-end on real SDK code:

| Capability | Tool | Result | Status |
|---|---|---|---|
| Host + isolated build | Docker Ubuntu 22.04 + clang-15 | slice builds standalone; **zero** OpenCV/NCNN/Eigen in `compile_commands.json` | ✅ |
| Test runner | GoogleTest + CTest | `ctest` green twice, identical → `suite_green` + `no_flaky` | ✅ |
| Mutation tool (the Stryker-equivalent) | **mull-15** (0.34.0) | 296 mutants, **100 killed**, parseable `probe.json` + `probe.sqlite`; scoping confined to the slice | ✅ |
| Evidence indexer | libclang (`clang.cindex`) | 8 functions extracted incl. `hungarian_solve` (L142–417) | ✅ |
| Test-style + prod-diff scoping | (generic core) | unchanged from .NET — language-neutral | n/a |

The kill rate (100/296) is low **by design** — one seed test, not the harness-generated suite. The point was that mull *bites* (real logic mutants killed in the assignment math) and emits a gate-parseable score. It does.

## Why we did NOT run the LLM loop (former Step 5)

The costly unknown turned out cheap: the *toolchain* was the real risk, and it's settled. The LLM loop proves a different thing — that the miner/verifier/cover agents produce good rules + killing tests for C — on which we already hold a strong prior (the loop is live-proven on 3 .NET classes; C source is well within model competence). A ~200–260k-token throwaway shim to re-confirm that prior is low marginal value. Better spent building the adapter properly.

## Cost

- **Toolchain bring-up:** low — local Docker, ~4 iteration cycles, **no LLM-loop tokens**. The image (clang-15+mull-15+gtest+libclang) builds in minutes and is reusable.
- **LLM loop (deferred):** stays the .NET per-class estimate (~231k output tokens / ~27 min for Cover) until measured on C++ in the real build.

## Findings the real adapter must carry forward

1. **Clang-major ↔ mull-package pin is base-image-dependent.** On jammy the Cloudsmith repo ships mull only to LLVM 15 (no mull-18). The adapter selects the clang major by *what mull packages exist for the chosen base image*, not by "latest LLVM." (LLVM 18 needs a noble/24.04 base — re-verify package availability there.)
2. **`exit(0)` is a mutation false-survivor blind spot (confirmed live).** `hungarian_solve` calls `exit(0)` in its internal double-check (L371/376/383) — a mutant tripping it exits the process 0 → the test falsely passes → mutant survives. The adapter must neutralize `exit`/`abort` under test (symbol `--wrap`, or a fork-isolated per-mutant runner) or kill-scores on any `exit`-using code are inflated-survivor.
3. **libclang version discipline.** Use the pip `libclang` wheel's *bundled* native lib — do not force the system `libclang-15.so` (symbol mismatch). Feed the parser a *whitelisted* arg set (`-I/-isystem/-D/-std` only) from `compile_commands.json`; the raw command line trips it (`-fpass-plugin`, color, `-o *.o`).
4. **Domain-rich slices are dependency-trapped — the real cost.** The *interesting* business logic (planogram KPIs, `fixing_tools`, compliance guidance) is welded into OpenCV/Eigen translation units and can't be isolated cheaply. Hungarian/DBSCAN are clean but generic. The adapter's hard, unbudgeted work is **slice isolation** of domain code, not toolchain wiring.
5. **Host reality:** mull is Clang/LLVM-only, Linux/macOS — on this Windows shop the loop runs in Docker/WSL, not native. Docker (already installed) was the lower-friction host than a fresh WSL Ubuntu.

## Recommendation — next increment (the real build)

Build the C++ adapter as a proper planned increment (a new `nexus-cpp`-style adapter skill filling the 5 capabilities, paired with the existing generic `mine-verify-cover` core), starting with a **real (non-throwaway) Mine→Verify→Cover loop** on `hungarian_solve`, then expanding to a domain slice once the slice-isolation cost (finding 4) is budgeted.

- **Sequencing stays the owner's call** — this GO does not reorder C++ ahead of the roadmap's Flutter increment; it just removes the toolchain risk that was blocking a C++ decision.
- **Code-grounded review is mandatory** at adapter-authoring time (shared/external-artifact rule) — not a doc-only critic.
- **Reusable assets** from this probe: the toolchain `Dockerfile`, the `mull.yml` + kill-score parser, and the `index_slice.py` evidence indexer are the adapter's starting skeleton.
