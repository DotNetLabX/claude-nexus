# Plan Review — adhoc-MvcCoverMinimize (code-grounded critic)

**Mode:** Plan Review (code-grounded — read live SKILL.md + harness, not a doc-only diff)
**Verdict:** NO-GO (REVISE) — no CRITICAL; one HIGH blocker + three MEDIUM + three LOW
**Reviewed rev:** rev 1

## Findings

### HIGH-1 — confirm labeled "pure" + never tested → vacuous-confirm / fake-green risk
A real re-mutation needs the runner `agent()` (impure I/O); the orchestrator has none (`mine-verify-cover/SKILL.md:107`; runner call `cover-flutter.workflow.js:413`). A *pure* confirm can only recompute over the pre-minimize kill-map, which still credits a removed test's kills → can never regress → fake green. The contract suite (synthetic fixtures) exercises the restore *branch* but nothing gates that the production confirm actually re-mutates the reduced suite.
**Fix:** split confirm into (a) an impure re-gate runner call producing a *fresh* post-removal result, (b) a pure compare/restore decision. Add acceptance asserting the confirm consumes a fresh post-removal mutation run distinct from the pre-minimize map.

### MEDIUM-1 — wrong harness citation for the restore precedent
`cover-flutter.workflow.js:379-384` is runner-prompt prose, not a code branch. The real ratchet hard branch is `:440-445` (`const ratchet = mutationRatchet(…); if (!ratchet.pass){…break}`); a sibling HALT is `:423-427`.
**Fix:** cite `:440-445`.

### MEDIUM-2 — fragile `:52` line reference, uncaught by lint, against the skill's own convention
Step 1's pipeline-row insert shifts the invariant down, making `:52` stale on commit; `tests/lint/skill-refs.test.mjs` only checks dangling skill-name refs, not `:NN` line refs; and it contradicts the skill's own rule (`:91` "never by source line number").
**Fix:** reference the invariant **by name** ("the anti-fake-green invariant"). The mutation ratchet (`:85`, kill-rate-regression→halt) is the more precise anchor for the confirm.

### MEDIUM-3 — version baseline assumes an uncommitted, foreign bump
`git show HEAD:…plugin.json` = 1.18.6; the working-tree 1.18.7 is an uncommitted bump from a concurrent feature (dirty agents/hooks/resolve-role.js — none of MvcCoverMinimize's files are dirty yet).
**Fix:** don't hard-code the target; bump from committed HEAD at implementation time, scope staging to this feature's files, add the recheck-branch-under-concurrent-run safeguard.

### LOW
- **L1** — confirm primary/fallback inverted vs ADR-37 (ADR makes targeted re-mutation primary; plan makes full re-gate default). Flag as conscious deviation or reconcile.
- **L2** — categorical-class list mismatch: Mechanism-table parenthetical (4 items, drops "boundary-test-with-no-distinguishing-input") ≠ Step 1c's 4 classes. Align.
- **L3** — "a prompt instruction is a request, not an enforcement" attributed to "the skill's own"; grep finds it only in ADR-37, not in `mine-verify-cover/SKILL.md`. Reword or add to the skill.

## Verified accurate (no finding)
Step 2's "adapter already supplies" claims hold — `equivalentLoggingLines` (`mine-verify-cover-flutter/SKILL.md:98`), no-log test-style rule (`:108`), "The mutation_test run" (`:50-81`). Actor split (agent proposes / orchestrator records) matches live classify-survivors (`loop-flutter.workflow.js:175,277`). Pipeline insert placement correct. All six ADR-37 units have a covering step.

**GO/NO-GO:** NO-GO. HIGH-1 is the blocker; resolve the pure-vs-re-run contradiction + add the fresh-run test, then GO. MEDIUM-1/2/3 are quick fixes.
