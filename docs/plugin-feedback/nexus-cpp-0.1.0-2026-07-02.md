# Nexus-cpp plugin feedback — v0.1.0 — 2026-07-02

Portable feedback file (ADR-1). Plugin-bound item for the shipped `mine-verify-cover-cpp` skill
(and its dev-repo reference harness `harness/cover-cpp.workflow.js`, kept in sync).

Source: nexus dev-repo validation of `nexus-cpp` on the omnivision-ai-sdk — parallel Cover+Gate runs
on `Levenshtein` (certified green, 96%) and `Hungarian` (task `woojejcb4`). Levenshtein passed clean;
the Hungarian run **deadlocked** and had to be killed.

---

## Runner agent hand-ran a non-terminating mutant with no timeout → the whole workflow deadlocked

- **Suggested target:** the runner contract in the `mine-verify-cover-cpp` skill (the runner's
  "what it may execute" steps) — primary; the `runnerPrompt` in `harness/cover-cpp.workflow.js` —
  secondary (dev reference, keep in sync).
- **Action:** add (a hard rule) + guard
- **Evidence:** Hungarian Cover run `woojejcb4` (2026-07-01). After the gated mull pass completed
  (iter-2, ~69% reachable, runner result written 22:47), the runner agent went OFF its defined steps
  to hand-analyze survivors: it compiled the SUT + specific mutants (`mut216`, `mut226`, `mut265`,
  `mut291`, `mut312`, `mut313`) into an ad-hoc `probe2` harness and ran each, diffing output.
  `probe2_mut216` — a mutation that broke a loop-termination guard in `hungarian_solve` — spun
  forever (100% CPU for 51 min, no timeout), so the `docker run` never returned and the orchestrator,
  awaiting the runner agent, was deadlocked. Recovery required `TaskStop` + `docker kill`. mull itself
  was UNAFFECTED — its own per-mutant timeouts correctly caught 34 mutants as `Timeout`; only the
  agent's hand-rolled probe lacked a guard.
- **Lesson:** A mutation can produce a non-terminating binary (broken loop/exit guard). The mutation
  TOOL guards against this (mull's per-mutant timeouts); an agent that executes mutants OUTSIDE the
  tool does not. The runner contract must (1) FORBID hand-compiling/running individual mutant
  binaries — survivor triage is done by READING the mull report + source, never by executing mutants;
  and (2) if any SUT execution outside `ctest` / `mull-runner-15` is ever unavoidable, wrap it in
  `timeout <N>s`. Without this, a single non-terminating mutant hangs the entire pipeline
  indefinitely with no self-recovery — a much worse failure than a low kill score.
