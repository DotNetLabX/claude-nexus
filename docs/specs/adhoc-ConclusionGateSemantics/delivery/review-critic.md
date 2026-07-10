# Critic Review — Plan Review (code-grounded) — adhoc-ConclusionGateSemantics

**Verdict:** GO-with-fixes (REVISE) · **Date:** 2026-07-10 · **Mode:** 2, code-grounded.
All five AC signatures re-verified zero-hit tree-wide; all six insertion points verified present
and exactly quoted; consumer-safety claim verified true (developer.md:99 and reviewer.md:74 mirror
only *unchanged* grammar; `correlation-only` appears in no agent doc); gen-commands correctly
absent (skills have no command mirrors); gen-omni owned transitively by release-plugin Step 5.

## Findings

- **[HIGH] F1 — `correlation-only` MEDIUM cap can suppress a genuine CRITICAL.** The cap acts on
  **severity** for an **epistemic** property, but review-format keeps the axes orthogonal
  ("Severity says how much it hurts and Confidence how sure you are") and CRITICAL blocks merge
  while MEDIUM does not. Scenario: reviewer ≥80-confident of intermittent data loss, mechanism not
  isolated → tagged correlation-only → forced MEDIUM → merge proceeds on a suspected data-loss
  bug. **Fix (adopted):** the cap applies to the *causal attribution* only; a directly-observed
  CRITICAL/HIGH impact (data loss, security, silent incorrect output) retains its severity floor —
  file the impact at full severity, route the unproven attribution to Open Questions.
- **[MEDIUM] F2 — "inconclusive stays alive" unreconciled with "3 hypotheses exhausted →
  escalate"** (diagnose:104, mirrored at developer.md:99). "Exhausted" becomes fuzzy — an
  inconclusive-alive hypothesis could be read as "not exhausted", deferring a warranted
  escalation; the spec's reconciliation clause covered the *fix-attempt* breaker (a different
  "3"). **Fix (adopted):** escalation-with-evidence-log is a **handoff, not a kill** — never gated
  by the elimination rule; "exhausted" = each top hypothesis probed at least once
  (confirmed / falsified / inconclusive), so inconclusive hypotheses count toward the trigger.
- **[LOW] F3 —** AC-1 `= 1` is brittle (a guardrail echo of the phrase would false-fail). Fix: `≥ 1`.
- **[LOW] F4 —** spec said "Findings-format preamble", plan said "near the Confidence/report-cutoff
  prose" — two different anchors; review-format has no "Findings preamble" heading. Fix: pin to the
  Confidence/report-cutoff prose (where the "sole threshold" non-change belongs).
- **[LOW] F5 —** elimination rule anchored "Phase 3, after the gate", but elimination is *recorded*
  in Phase 4 ("Record: which hypothesis confirmed/eliminated", diagnose:71). Fix: pin to Phase 4's
  record step.

## Verified clean

Zero-hit signatures (`flips the outcome`, `confounded`, `correlation-only`, `inconclusive`,
`unworkable`); insertion anchors diagnose:57/74/98/107 and review-format:25–41/67–84; AC-4 scope
(omni twin is a different repo, correctly outside the diff scope); Decisions hygiene; line budgets
feasible.
