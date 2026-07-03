# adhoc-MineVerifyCppAdapter — Summary

## Status: COMPLETE

## What Was Built
- The C++ Mine→Verify→Cover adapter, shipped as the **nexus-cpp plugin** (`mine-verify-cover-cpp`
  skill + `harness/cover-cpp.workflow.js`, a thin fork of the Flutter runner with the §6 gate battery
  copied verbatim). Proven live on omnivision-ai-sdk: Hungarian (honest refusal) and Levenshtein
  (first GREEN C++ mutation cert).

## Key Outcomes
- Live run 1 — Hungarian: adapter mechanically proven end-to-end; gate honestly REFUSED at 46%
  reachable kill (< 75% floor), no fake-green (`run-cover-hungarian-2026-06-25.md`). `exit()`
  masking then neutralized with `--wrap=exit` (46% → 64%, `15623c3`).
- Live run 2 — Levenshtein: **GREEN cert, 96% reachable kill** (99/103, floor 75); 49-test suite
  captured as evidence (`run-cover-levenshtein-2026-06-25.md`, `a1e4008`).
- Shipped in `c3f9922` (nexus 1.18.3 release train); work isolated in a dedicated worktree, merged to main.

## Deviations from Plan
- The implementation.md status header ("Steps 1 + 5 PAUSED pending owner go-ahead") is stale — the
  owner go-ahead came and the live runs completed, per the run reports and commits `463c9b3`/`3e6267b`.
- Levenshtein `suite_green` closed 46/48 — the 2 fails were agent errors (positions vs costs), and the
  all-6-green polish re-run was deliberately skipped as cosmetic (sanctioned).

## Notes
- Closure written retroactively 2026-07-03 by the team lead.
- **Open follow-up (not blocking closure):** the Cover runner deadlocked when an agent hand-ran a
  non-terminating mutant outside mull with no timeout — logged as plugin feedback
  `docs/plugin-feedback/nexus-cpp-0.1.0-2026-07-02.md` (`99ab688`); fix belongs to a future nexus-cpp pass.
- `delivery/lessons.md` exists and is unprocessed (learner not run on this slug).
