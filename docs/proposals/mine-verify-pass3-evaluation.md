# Pass 3 — Evaluate (checkpoint): tuned gates + automation go/no-go

**Status:** Ratified — partially delivered. Bookkept 2026-06-22.
**Delivered:** the GO verdict + cost fix (batched-sliced verifier) shipped in MineVerify Inc 1; Inc 2 (Cover) built (adhoc-MineVerifyCoverHarness).
**Remainder (backlog):** Inc 3 (loop controller, 5-gate battery, mechanical clean-room seal) + Inc 4 (ship as nexus skill); the Inc 2 live Cover run is operator-owed.

**Input:** the 2-class Pass-2 calibration (`mine-verify-pilot-method.md` §Calibration log).
**Sample:** deliberately stopped at 2 classes — HealthScore (easy, pure math) + BugRatio (hard,
multi-sprint + alert streak). The temporal `TransitionAttributionChecker` was skipped on purpose:
the *path* is proven, and the manual cost (48 min/hard class) is itself the signal to stop hand-running
and automate. **Known gap:** temporal/stateful extraction is unvalidated — watch it at Pass 5 (Scale).

## Verdict: GO for automation

Accuracy is not the constraint — recall held **3/3** across the difficulty range, both aggregation
traps were independently rediscovered (ratio-of-totals; zero-SP-breaks-streak), and the method found
real bugs the hand-authored KB missed. The **only** blocker is manual cost, which is exactly what
automation removes. So: automate.

## Tuned gate parameters (provisional — 2 data points; refine at scale)

| Gate / knob | Pilot setting | Tuned recommendation |
|---|---|---|
| Mine consistency samples | 1 (easy), 3 (hard) | **Scale to complexity:** 1 for pure-function classes, 3 for any branching/stateful class. 3-sample is what produced the confidence number + caught the rounding smell. |
| Confidence → auto-proceed | informal | **In all 3 samples + survives refutation + no contradiction → auto.** 2/3, or any contradiction → escalate. |
| Verifier | single Codex refutation pass | Keep Codex + collaborative-refutation framing — it caught every real issue. **It is the cost bottleneck** (see below). |
| Escalation rate | 14% observed | Matches the plan's 16–25% norm. Size the human queue for ~1 ruling per 7 rules. |
| `break-at` ladder | 70 → 75 → 80 | Keep — HealthScore reached 100% under it. |
| Dead-code handling | exclude unreachable guards from mutation | Keep — required for an honest kill score. |

## The cost problem (the load-bearing Pass-4 requirement)

Codex wall-time: ~13 min (HealthScore) → ~48 min (BugRatio), scaling with rule count × 3 samples.
This will not run interactively across ~10 classes. Automation must do **one** of:
- scope the verifier to interpretive/edge claims only (skip refuting transcribed formulas),
- run Verify in parallel per-rule rather than one monolithic pass,
- or use a cheaper verifier tier for the bulk, reserving Codex for low-consistency rules.

## Next: the Pass-4 substrate decision (your steps #1/#2/#4)

This is where VWH re-enters. Per the harness plan, VWH is the leading Pass-4 substrate candidate,
decided *at this checkpoint* against `br-coverage-vwh-evaluation.md §6`. The concrete next action is
your **#1 — test VWH**: run it against the same yardstick we just set (can it produce the same
verified KB entry + mutation-gated tests on a Fokus class, at acceptable cost?), then **#2 build ours**
(this method, scripted, with the cost fix above) and **#4 compare** on: recall/precision, escalation
rate, cost/class, and how much of the gate battery it enforces mechanically.
