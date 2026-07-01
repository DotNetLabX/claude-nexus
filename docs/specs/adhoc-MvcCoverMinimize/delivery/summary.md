# MvcCoverMinimize — Summary

## Status: COMPLETE

## What Was Built
The post-floor **Minimize stage** for the mine-verify-cover method (ADR-37). After Cover reaches
all-gates-green, a minimize agent reasons (by hypothesis — no per-test kill-map exists) about which tests
are redundant and proposes removals; a write-owning agent applies them and captures the verbatim original;
a runner agent re-runs the **full** mutation gate on the reduced suite (a fresh re-mutation, never a
recompute); the orchestrator restores everything on any **exact reachable killed-count** drop or an
inconsistent confirm (fail-closed — the confirm is the only enforcement, since attribution is unverifiable).
`documentsDistinctRule` is honored unconditionally (rule-traceable target, not mutation-minimal). Plus a
Cover generation guard (no categorically-dead tests up front, labeled non-enforcing) and a `minimized: …`
report line. Shipped in the stack-neutral method skill + the Dart adapter fill; demonstrated in the Flutter
reference harness and gated by contract tests.

## Key Outcomes
- **5 tracked files changed (+655/−4):** `mine-verify-cover/SKILL.md`, `mine-verify-cover-flutter/SKILL.md`,
  `harness/loop-flutter.workflow.js` (new Phase 3.5), `tests/unit/workflow-contract.test.mjs` (+5 slices),
  `lessons.md`. New: `implementation.md`, `review.md`, `docs/kb/research/mutation-test-dart-line-range-scoping.md`.
- **Tests:** contract suite **48/48 green** (43 baseline + 5 new). Full gate 379/383 — the 4 failures are
  pre-existing carry-overs (nexus-cpp CHANGELOG + 3× gen-omni ENOENT), independently confirmed to predate
  this work.
- **Version:** nexus 1.18.8 → **1.18.9**, nexus-flutter 0.1.2 → **0.1.3** (PATCH each).
- **Review:** Step-1 done-check **PASS** (architect, independent, code-grounded); Step-2 **APPROVED**,
  cycle 1 — 0 CRITICAL/HIGH/MED, 2 LOW (defensive-only).

## Deviations from Plan
- `cover-flutter.workflow.js` not edited — `mutationFloor` + deps copied **verbatim** into
  `loop-flutter.workflow.js` (documented "keep in sync"). A `workflow()` re-compose was rejected because its
  iteration-1 always regenerates the test file, which would silently defeat the confirm.
- One pre-existing F1/F2 contract fixture updated to keep the suite green after the agent-call sequence
  changed (non-masking, documented).
- **Step-2 code review done by the team lead inline** — three reviewer subagents died on an API-side outage
  (watchdog stall → connection-closed → connection-refused). The architect's Step-1 done-check was an
  independent code-grounded pass over the same crux; owner accepted ("close now"). Recorded in `review.md`.

## Notes
- Step 5 (this dual PATCH bump + omni-twin regen) is the closing action, per plan.
- Live MVC end-to-end run is out of scope — the harness logic is proven by mocked runner `mutationSummary`
  fixtures (the real output shape), not a live Flutter run. Dart line-range scoping for a future targeted
  re-gate was researched (supported, `<lines begin/end>`) and captured to the research KB, not implemented.
