# Re-validation run — shipped nexus-cpp skill on both proven targets — 2026-07-01

**Why:** the skill's Cover guidance was improved during the Flutter adapter work; this re-run proves
the improvements hold for C++ by re-running Cover+Gate on the SAME two SDK classes with the SAME KBs,
fresh workspaces, and a clean-room Cover agent (original test suites never in scope — verified: the
workspace `tests/` dirs were created empty; the agent read only the source slice, the KB, and the
5-test seed pattern).

## Levenshtein (`src/planogram/levenshtein.h`, header-only) — ALL GATES GREEN, iteration 1

- 29 tests, green ×2 (29/0/0 both runs), no flaky, no skips, `char_pin` clean, `redOnCurrent: []`.
- `mutation_floor`: **96%** (99/103 killed, 0 excluded) — same score as the original 49-test run.
- Survivors: lines 71/85 (`cxx_assign_const` path sentinels — the known likely-equivalents) +
  lines 24/28 (`cxx_le_to_lt` in `distance`'s init loops — killable; the older suite killed them but
  carried 2 over-fit position assertions instead).
- **Improvement confirmed:** the regenerated suite has NO hand-computed-position failures against the
  REAL SDK header (the original suite had 2 — caught when the landed SDK copy was first built against
  the real header) and adds 5 structural-invariant tests (`editops().size() == distance()`), exactly
  what the skill's "assert structural invariants" rule prescribes.
- Deliverable: the suite is landed in the SDK at `tests/mine-code/planogram/levenshtein_test.cpp`
  (evidence copy: `levenshtein_harness_test-revalidation.cpp` beside this report).

## Hungarian (`src/trackers/sortcpp/hungarian.cpp`, compiled, `--wrap=exit`) — STOPPED at ~69%

- Iteration-2 mull result: **~69%** reachable kill (203/296 incl. 34 Timeouts; 93 survivors),
  floor 75 → gate refusing, consistent with the known structural ceiling (64% original; the improved
  30-test suite scored marginally higher). The honest sub-floor refuse — expected, not a failure.
- **Run killed by the operator after a deadlock:** the runner agent went off-contract and
  hand-compiled surviving mutants into an ad-hoc diff harness with no timeout; one mutant (broken
  loop-termination guard in `hungarian_solve`) spun forever at 100% CPU, hanging the workflow.
  mull itself was unaffected (its per-mutant timeouts caught 34 mutants). Logged as
  `docs/plugin-feedback/nexus-cpp-0.1.0-2026-07-02.md`; fixed in **nexus-cpp 0.1.1** (runner
  contract: mutant execution outside mull forbidden; survivor triage is read-only).

## Verdict

The Flutter-era skill improvements **work for C++**: a clean-room re-run reproduced the green cert
(96%, one iteration, zero false failures) and the honest refuse (~69% < 75), and surfaced one new
runner-contract gap now shipped as 0.1.1.
