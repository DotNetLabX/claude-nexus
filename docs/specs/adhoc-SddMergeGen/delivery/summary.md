# SDD Merge Machinery + Diff-Driven Cover-from-Spec — Summary

## Status: COMPLETE

## What Was Built
- The SDD loop's second half, discharging the AC-6 gate (ratified proposal
  `docs/proposals/sdd-generate-merge-2026-07.md`): the M1 triage-merge machinery — content-keyed
  five-bucket triage (`harness/lib/merge-rules.mjs`), the durable per-repo rules registry with
  `divergence-pending-triage` + evidence pair + `suspect-stale-spec` and a deterministic
  render/parse round trip (`harness/lib/rules-registry.mjs`), the two-layer KB distillation with a
  fail-closed token-budget lint (`harness/lib/kb-distill.mjs`), and the `harness/merge.workflow.js`
  front-end (offline-proven; contract-guard + sandbox-run tested).
- Shipped method + adapters across THREE plugins: `mine-verify-cover` gains the Merge + Generate
  (diff-driven Cover-from-spec) stages, the fact/tier vocabulary (`layer` incl. `settings`,
  `criticality`, `mutation-gated`, `runtime-cost`; tiers `smoke`/`full`/`gate`; no-scalar rejection
  recorded), full AC-6 ungating, and the seven SR-pilot conditions; dotnet + flutter adapters gain
  the tag/filter mappings + the parked-red divergence idiom (cpp explicitly deferred).
- Pipeline rules: `solo.md` net-new Spec write-back section (trivial-factual only; behavioral →
  PO/owner); `developer.md` names `definition/` read-only in full (developer never edits specs/plans).
- Governance: SddLifecycle tech-spec amended (AC-6 discharged; C2/C3/C4 deferred with forward
  reference); ADR-40..44 extracted; backlog row + ratified proposal linked.

## Key Outcomes
- Files: 7 created (3 harness libs + 3 test files + 1 workflow), 15 modified (3 skills across 3
  plugins, 2 agents + regenerated commands, contract/selfcheck guards, SddLifecycle tech-spec, ADR
  register, 3× plugin.json/CHANGELOG). Releases staged: nexus 1.20.0→**1.21.0**, nexus-dotnet
  1.2.0→**1.3.0**, nexus-flutter 0.2.1→**0.3.0** (all MINOR, owner-escalated).
- Gates: **475/475** unit+lint tests; selfcheck 4/5 (the 1 FAIL is the plan-sanctioned expected-RED
  `gen-omni --check`, resolves at the owner's twin sync); `claude plugin validate --strict` exit 0 ×3.
- Review chain: code-grounded plan critic (NO-GO rev 1 → 11 findings folded → rev 2; rev 3 re-grounded
  on same-day pilot addenda); architect done-check **PASS** (log-corroborated skill conformance);
  reviewer **APPROVED after 1 fix cycle** — the cycle-1 HIGH (registry render dropped
  bucket/divergence columns → round-trip self-supersede) was fixed structurally (`parseRegistry`
  inverse + orchestrator-side parsing) and independently re-verified by the reviewer's own repro.

## Deviations from Plan
- Step 1's M3 dispositions live in Step 2's registry writer (Accept-criteria-wins; the stateless
  triage cannot see prior state) — architect-ruled valid, documented in implementation.md.
- Step 9 (live SR merge pilot) is a written runbook, not an execution — plan-sanctioned
  operator-owed-by-construction; runbook in implementation.md names the F13-BugRatio target,
  independence check, post-hoc human crosswalk, and expected artifacts.

## Notes
- **Commit protocol owed (operator/team-lead):** re-check `git branch`/`git log` immediately before
  committing (concurrent-run rule), stage scoped (this slug's delivery files + the implementation
  file set — no `git add -A`), one feature commit carrying the three bumps; then `gen-omni` twin sync
  + the mirrored omni commit (clears the expected-RED selfcheck).
- **Operator-owed next:** Step 9 runbook (live SR merge pilot on F13-BugRatio — also the U-2
  independence proof); then the queued follow-ups: read-tracker per-agent fix (SR feedback item 2),
  C2/C3/C4 arc, cpp tag mapping, omnishelf-docs render step.
- Backlog row flips to Done at commit (ship).
