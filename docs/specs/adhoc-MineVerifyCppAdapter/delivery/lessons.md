# Lessons — adhoc-MineVerifyCppAdapter

## Architect / Execution Lessons

- **The honest-refusal path is the proof, not the failure.** The live Cover run stopped `cap-reached` at
  46% (< 75% floor) — and that is the **success signal** for the adapter: every mechanical gate worked,
  the kill score was real, and the gate **refused to certify** rather than fake-green. A green run would
  have proven less. When reporting a sub-floor run, lead with "the gate did its job," not "it failed."

- **`exit()`/`abort()` in code-under-test is a FIRST-CLASS mutation limiter, not a footnote.** The probe
  flagged `hungarian_solve`'s `exit(0)` doublecheck as a blind spot; the live run **quantified** it as the
  dominant cap on black-box kill (~46%). Any mutant that breaks an internal invariant trips `exit(0)` →
  process exits status 0 → test "passes" → mutant survives. The 3 pre-excluded lines were a fraction of
  the real masking. **Lesson:** for any C/C++ slice that calls `exit`/`abort` on invalid state, `--wrap=exit`
  neutralization is a PREREQUISITE of a meaningful mutation run, not a later hardening. Bake it into the
  C++ adapter's mutated-build flags, not the operator's memory.

- **A dependency-free slice is ideal for de-risking the TOOLCHAIN but can be a poor mutation TARGET.**
  Hungarian was the right probe slice (isolates the toolchain question) but a weak floor target: much of it
  is internal bookkeeping not observable through `init/solve/free`, plus `printf`/`free` side-effects and a
  self-stabilizing algorithm. **Lesson:** separate "good toolchain-proof target" from "good kill-rate
  target." For a certify-able run, pick a slice whose rules are observable through its public surface, or
  budget the unobservable mutants out of the reachable denominator with a documented KB list.

- **Cost: an unconverged Cover run is expensive — cap it for exploration.** Step 5 ran the full 5 iterations
  (×2 Docker builds + mull each) = ~787k tokens / ~66 min because it never cleared. **Lesson:** for an
  exploratory first run on a new stack/slice, set `maxIterations` low (1–2) to get the kill-rate signal
  cheaply before committing to the full feedback loop; raise it once the floor is reachable.

- **The C++ fork was genuinely thin.** mull emits mutation-testing-elements JSON (the Stryker schema
  family), so the runner consumed it **as-is** — no translation, unlike the Flutter XML fork. The §6 gate
  battery was reused byte-identical. Confirms the language-neutral-core / thin-adapter design holds for a
  third stack.

- **Mine→Verify is stack-agnostic in practice, not just in theory.** 3 clean-room miners produced 42
  rules with 40/42 triple-agreement on C source they'd never seen, and the batched skeptic caught 9
  imprecisions + 1 wrong. No .NET-specific assumptions leaked. The KB-write seam (orchestrator returns
  rules → operator/agent persists the KB) worked as a manual bridge; the loop controller would automate it.
