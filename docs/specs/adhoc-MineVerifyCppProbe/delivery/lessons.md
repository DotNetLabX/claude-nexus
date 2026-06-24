# Lessons — adhoc-MineVerifyCppProbe

## Architect Lessons

- **Research-first reshaped the verdict.** Initial read leaned "C++ not ready"; the research dive
  (`docs/kb/research/cpp-mutation-and-test-tooling.md`) flipped the load-bearing unknown — **mull is a
  genuine Stryker.NET equivalent** (YAML config, JSON+SQLite machine-readable report, headless, LLVM 13–22).
  C++ mutation tooling is *more* mature than Flutter's (the roadmap's blocking risk). Lesson: on a
  fact-shaped "are we ready" question, run the research before rendering the readiness verdict — the
  pre-research lean was wrong on the decisive axis.

- **Separate the toolchain question from the domain question.** The readiness blockers were never the
  algorithms (the user's "it's only algs" intuition was right) — they were substrate: no test
  framework/CTest, Linux-only host, hardcoded dev paths, heavy native deps, unstable static teardown. The
  probe isolates the toolchain de-risk by picking a generic, dependency-free, branch-rich slice
  (Hungarian) so a NO-GO can't be blamed on slice choice.

- **The domain-rich slices are dependency-trapped — a standing finding for the real adapter.** The
  interesting business logic (planogram KPIs, fixing_tools, compliance guidance) is welded into
  OpenCV/Eigen translation units and can't be isolated cheaply. The eventual C++ adapter must budget for
  **slice isolation**, not just toolchain wiring. Captured so the post-GO adapter plan inherits it.

- **mull's host constraint is a real fork.** Clang/LLVM-only, Linux/macOS (no official Windows). On a
  Windows shop this forces WSL2/Linux for the whole loop — surfaced as the first user decision, not
  discovered mid-build.

- **The cheap-proof reframe.** Steps 1–4 (local Docker, no LLM tokens) proved the load-bearing unknown
  (toolchain viability) so cheaply that the costly Step 5 (the ~250k-token LLM loop) lost its
  justification — it only re-confirms a strong prior. Lesson: a probe should re-check its depth budget
  *after* the cheap evidence lands; "full e2e" chosen up front isn't binding once the real risk is
  retired more cheaply than expected.

## Execution Lessons (toolchain bring-up, live)

- **Clang-major ↔ mull-package is base-image-bound, not "latest".** jammy's Cloudsmith repo ships mull
  to LLVM 15 only (mull-11/13/14/15) — `mull-18` fails to locate. The plan's LLVM-18 assumption (from the
  research entry's capability range) was wrong for the *package* reality; pin clang to what mull packages
  the chosen base image. (LLVM 18 ⇒ a noble/24.04 base — re-verify.)
- **`exit(0)`/`abort` in code-under-test is a mutation false-survivor trap (confirmed live).** A mutant
  that trips a hard exit makes the process return 0 → test "passes" → mutant survives. The adapter needs
  an `exit`-neutralizing runner or kill-scores inflate. Belongs in the shipped adapter's contract.
- **libclang: use the pip wheel's bundled lib, whitelist the parse args.** Forcing the system
  `libclang-15.so` against newer pip bindings fails on a symbol mismatch; raw `compile_commands.json`
  args (`-fpass-plugin`, color, `-o *.o`) trip the parser — keep only `-I/-isystem/-D/-std`.
- **A green pipe ≠ a green build.** The backgrounded `docker build | tail` reported exit 0 (the *pipe*
  succeeded) while the build itself failed. Gate on `${PIPESTATUS[0]}` / write to a log and grep the real
  exit, not the tail's status.
