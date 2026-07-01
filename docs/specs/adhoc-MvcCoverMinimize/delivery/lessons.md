# Lessons — adhoc-MvcCoverMinimize

## Architect Lessons

- **In the MVC harness the orchestrator has no filesystem — confirm / apply / restore are agent ops, never orchestrator ops.** Rev 1 put the confirm re-mutation and the test-file edits on the "pure/deterministic" orchestrator. That is structurally impossible (`mine-verify-cover/SKILL.md:30` — agents do all I/O) and produced a fake-green confirm (a pure recompute over the stale kill-map can never regress). **Apply:** in any MVC/harness plan, mark every I/O step's owning agent explicitly (minimize agent reasons; write-agent edits; runner re-runs; orchestrator only routes + decides) — mirror the live classify-survivors split, don't reinvent it.

- **A fail-closed confirm is only real if it RE-RUNS fresh and compares EXACT counts.** Two independent ways rev 1's confirm could pass while coverage dropped: (a) recomputing over the pre-minimize numbers instead of a fresh re-gate; (b) comparing the rounded `scorePct` (a one-mutant drop on a large denominator rounds away). **Apply:** confirm = a fresh runner call on the reduced suite + an exact `killed`-count compare + restore-on-any-drop. A confirm with no fresh-run assertion in its test is vacuous.

- **Per-test mutant attribution is fallible reasoning that NO tool can verify — name it as a hypothesis and make the confirm the only safety net.** `mutation_test` reports aggregate survivors, never which *test* killed which mutant. A contract test that mocks a per-test kill-map tests fabricated data. **Apply:** ground minimize tests on the real aggregate output shape (`mutationSummary`); the re-gate is the verifier, not the attribution.

- **Code-grounded review earned its mandate here — a doc-only critic would have shipped the defects.** Both the code-grounded critic (HIGH-1) and Codex (CRITICAL + 2 HIGH) converged on the same seam, and every blocker was visible only by reading live source (the no-filesystem contract, the harness output shape, the rounded-vs-exact compare). Confirms the ADR done-check rule: for a shared/external-artifact (skill) change, code-grounded review is the load-bearing gate, not a plan-vs-spec diff.

- **Don't read a dirty working tree's version as the bump baseline.** Working-tree `plugin.json` showed 1.18.7, but committed HEAD was 1.18.6 — the 1.18.7 was a *concurrent* feature's uncommitted bump. A naive `bump-plugin` run would have bundled the foreign feature. **Apply:** bump from committed HEAD at implementation time, scope staging to this feature's files, recheck branch/log before commit (the recheck-branch-under-concurrent-run discipline).

### Improvement proposals

- **Consider adding the "a prompt instruction is a request, not an enforcement" principle to `mine-verify-cover/SKILL.md` itself.** It currently lives only in ADR-37 / the plan-grounding rules; the Cover stage (which grounds the suite via prompt) is exactly where a reader would benefit from it. Low-risk doc addition; route via the learner if it recurs.
