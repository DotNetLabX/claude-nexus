# adhoc-MineVerifyCppProbe — Summary

## Status: COMPLETE

## What Was Built
- Phase-0 toolchain probe for a C++ Mine→Verify→Cover adapter against `D:\omnishelf\omnivision-ai-sdk`:
  proved build + mutation + coverage + evidence extraction work on the SDK's real code.
  **Verdict: GO** (`delivery/probe-report.md`) — build the C++ adapter as the next planned increment.

## Key Outcomes
- Steps 1–4 complete and green: Docker Ubuntu 22.04 host, clang-15 + mull-15 (0.34.0) mutation run,
  gtest/ctest runner, libclang evidence slice (all 8 Hungarian functions extracted).
- Step 6 GO/NO-GO report delivered; committed in `9636fe4`.
- Key findings carried into the adapter build: `exit(0)` blind spot (needs `--wrap`/fork isolation),
  pip-libclang over system lib, whitelist-only compile flags, pin clang major to available mull packages.

## Deviations from Plan
- Host: Docker container instead of WSL2 Ubuntu (only `docker-desktop` distro present) — sanctioned, functionally identical.
- Toolchain: clang-15 + mull-15 instead of LLVM 18 (Cloudsmith mull-stable tops out at LLVM 15 on jammy) — forced, recorded.
- Step 5 (end-to-end LLM pass) deferred by owner decision 2026-06-24: toolchain risk was the real
  unknown and Steps 1–4 proved it; the LLM loop became the first planned increment of the real
  adapter build (adhoc-MineVerifyCppAdapter) instead of a ~250k-token throwaway.

## Notes
- Closure written retroactively 2026-07-03 by the team lead.
- `delivery/lessons.md` exists and is unprocessed (learner not run on this slug).
- Follow-up work landed as adhoc-MineVerifyCppAdapter (see its summary).
