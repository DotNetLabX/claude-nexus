# Trace Map — BugRatioAnalyzer (pilot, plan Step 4)

The pilot spec-rule → class map for `SR-1..4` (`delivery/spec-rules-bugratio.md`, the intent analogs of
GOLD-16..18). Every row is `source: manual` — **sprint-rituals' Fokus analytics classes are a port with no
nexus plan/impl chain**, so the plan-ref anchor (source 1 — `create-implementation-plan`'s mandated step→file
citations) has nothing to anchor on for this pilot (tech-spec "The trace-join — the crux": "SR's analytics
classes are a *port* ... so the pilot join uses the guided-miner locator + a human-confirmed manual map").

This means AC-6 (the pilot end-to-end run) proves the `manual`/`locator` fallback path, **not** the `plan-ref`
anchor — as the tech-spec states explicitly (`AC-6`: "the SR port has no plan chain — only the locator +
manual map are exercised").

## Canonical target name (binding)

`BugRatioAnalyzer.cs` — **not** `BugRatioCalculator.cs`. The golden set (`sprint-rituals/docs/audit/golden-set.md`,
GOLD-16..18) still attests these rules to `BugRatioCalculator`, a **stale name**: the class was renamed to
`BugRatioAnalyzer` with line numbers preserved (tech-spec, MEDIUM finding — flagged for a separate SR-side
golden-set fix, out of scope here). Every row below uses the canonical, current name.

## Map

| Rule id | Rule name | Class(es) | Source | Confidence | Route | Note |
|---------|-----------|-----------|--------|------------|-------|------|
| SR-1 | `BugClassification` | `BugRatioAnalyzer` | manual | 1.0 | accepted | Human-confirmed: `BugRatioAnalyzer.ComputeMultiSprint`/`ComputeSingleSprint` classify tickets via the shared Bug predicate before summing SP. Intent analog of GOLD-16. |
| SR-2 | `BugRatioPercent` | `BugRatioAnalyzer` | manual | 1.0 | accepted | Human-confirmed: the ratio-of-totals computation is `BugRatioAnalyzer`'s headline output. Intent analog of GOLD-17. |
| SR-3 | `AlertActive` | `BugRatioAnalyzer` | manual | 1.0 | accepted | Human-confirmed: the alert evaluation walks sprint history inside the same class. Intent analog of GOLD-18 (boolean half). |
| SR-4 | `ConsecutiveStreak` | `BugRatioAnalyzer` | manual | 1.0 | accepted | Human-confirmed: the consecutive-sprint streak count is produced alongside the alert flag. Intent analog of GOLD-18 (streak half). |

All four rules trace to the SAME single class (`BugRatioAnalyzer`) — matches `harness/targets/bugratio.json`'s
code-mine target exactly (`{BugRatioAnalyzer}` == `{BugRatioAnalyzer}`, plan Step 6 acceptance).

## How this was produced

Authored directly as a human-confirmed manual map (`traceRule({ ruleId, manualEntry: { classes: [...] } })`
shape from `harness/lib/trace-join.mjs`) — the pilot did not run the guided-miner locator to PRODUCE this map
(the locator is exercised live, at Step 8, inside `spec-cover-calc.workflow.js`'s own Locate phase; its
per-rule `file:line` output there is a REPORT-level location hint, not a substitute for this coarser-grained
rule→CLASS trace-join, which operates before the code arm is even launched — see Step 1 vs Step 4 distinction
in `spec-cover-calc.workflow.js`'s header comment).

## Aiming the code arm (Step 6)

This map's class set is exactly what `harness/targets/bugratio.json` (the code-mine target) points at — so
Step 6's code arm is aimed correctly by construction for this single-class pilot. `Satisfies:` AC-3, AC-4.
