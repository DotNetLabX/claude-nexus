# Architect Decision Disclosure — Summary

## Status: COMPLETE

## What Was Built
The architect now **declares** its self-resolved judgment calls instead of baking them into plan
steps invisibly. Plans carry a new `## Decisions` section (one row per call: decision · why ·
rejected alternative · status `decided | deferred`), always present with an explicit
`None — no self-resolved calls met the disclosure bar` sentence when empty. The architect emits a
`Decisions taken: N` metric in its plan-approval message and flags a missing/silent section as a
self-attributed plan-hygiene note in the Step-1 done-check; the critic flags the same as a MEDIUM
finding in its Mode-2 plan review. The row bar is user-divergence **AND** two-way door — one-way
doors stay with the existing ask-first machinery, not this section. Prose-only; no runtime surface.

## Key Outcomes
- **Files modified:** 7 nexus plugin files — `plan-template.md`, `agents/architect.md`,
  `agents/critic.md`, regenerated `commands/architect.md` + `commands/critic.md`, `plugin.json`
  (1.24.0 → **1.25.0**, MINOR, user-ratified), `CHANGELOG.md`. Plus slug delivery artifacts.
- **Validation:** `claude plugin validate plugins/nexus --strict` passed; all acceptance greps
  green against live files; lint + unit tests pass; gen-commands in sync.
- **Review:** Step-1 done-check **PASS** (4/4 conform, dogfooded on this plan's own `## Decisions`
  section — 9 rows, non-silent). Step-2 **APPROVED** by the reviewer (0 findings ≥80 conf) +
  independent **Codex** cross-check (Standard+Codex). 1 fix cycle.
- **Codex findings dispositioned:** (1) plan.md acceptance path typo (`plugins/nexus/plugin.json`
  → `.claude-plugin/plugin.json`) — implementation was correct; fixed the plan text.
  (2) architect done-check missing the predate-exemption clause — fixed (now consistent with
  template + critic).

## Deviations from Plan
- **Step 4 bump scoped with `--staged`** instead of the plan's plain `--minor`. A concurrent
  pipeline (`adhoc-DotnetFeedbackApply`) had 28 dirty nexus-dotnet files + its own bump in the
  shared tree; whole-tree `--minor` would have hijacked that feature's release. Net effect on nexus
  is identical (1.24.0 → 1.25.0). Architect done-check accepted this as Deviated-valid-reason.

## Notes
- **Concurrent tree.** `adhoc-DotnetFeedbackApply` committed mid-run and moved HEAD
  (`3a135a8` → `46dcc0d`, nexus-dotnet 1.4.0). Verified: it touched none of this feature's files;
  my plan commit is intact; history is linear (plan → their feature → this implementation). The
  closure commit used an explicit pathspec, never `git add -A`.
- **Omni twin** synced at closure via `gen-omni` after commit 2, so the twin footer pins the real
  implementation sha (per CLAUDE.md).
- **Follow-up (non-blocking, out of scope):** the new plan-hygiene finding type isn't yet reflected
  in the `review-format` skill's Step-1 template — a future documentation-consistency item the
  reviewer flagged. Candidate for the backlog, not a defect here.
