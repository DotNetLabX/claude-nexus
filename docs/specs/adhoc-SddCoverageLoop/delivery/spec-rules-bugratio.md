# Spec Rules — BugRatioAnalyzer (spec-oracle intermediate)

**Plan Step 1** (`docs/specs/adhoc-SddCoverageLoop/delivery/plan.md`). This is the golden-shaped intermediate
the spec-load agent (`harness/spec-cover-calc.workflow.js`, Step 3) reads at run time — the SOLE spec input
for the calculator pilot.

## Clean-room provenance (binding — Q1 resolution)

Authored **ONLY** from the Fokus prose lineage:
- `D:\src\fokus\docs\kb\analytics\bug-ratio.md` — ratio-of-totals formula (`:16-23`), alert system (`:26-33`)
- `D:\src\fokus\docs\kb\domain\ticket.md` — Bug classification (`:17`)

**NOT** sourced from, read, or cited: `sprint-rituals/docs/audit/golden-set.md`, any code-mined `docs/kb/`
entry, or `BugRatioAnalyzer.cs` / `BugRatioMultiSprintData` / `BugRatioSingleSprintData`. Per the Q1 answer
(`questions.md`), every `targetField` below is the **conceptual/intent field name** derived from the prose —
never an exact C# member. The intent→real-member binding is the spec-cover-calc test-writer's job at
live-run (Step 3 workflow, exercised in Step 8); it is explicitly **not** this document's job and **not** the
Step-7 rule-name crosswalk's job.

## Schema

Mirrors the spec-load agent's structured-rule shape (`harness/spec-cover.workflow.js` `SPEC_RULES_SCHEMA`:
`id`, `ruleName`, `statement`, `expectedOutcome`, `codeAttestation?`, `boundary?`), adapted for a numeric
calculator: `expectedOutcome` is a **structured object** (not a violation-identity string, since this class
has no `RULE_ORDER`-style single-violation-wins surface).

| Field | Meaning |
|-------|---------|
| `id` | `SR-<n>` — a spec-rule ordinal. **Not** a GOLD-id (GOLD-ids are the sequestered post-hoc benchmark). |
| `ruleName` | An authored identifier for this rule, in the **spec arm's own id space** — distinct from the code arm's autonomous `BR-N` naming. The two spaces are reconciled post-hoc by the Step-7 crosswalk, outside both blind runs. |
| `statement` | The rule's durable prose (paraphrased intent), citing its Fokus source line. |
| `expectedOutcome.kind` | One of `boolean`, `numeric`, `streak-integer`. |
| `expectedOutcome.targetField` | The **intent/conceptual** field name this rule asserts about (e.g. `bugRatioPercent`). Never a `BugRatioMultiSprintData`/`…SingleSprintData` member — see clean-room note above. |
| `expectedOutcome.condition` | The rule's assertable condition/formula, in prose-derived terms. |
| `boundary` | The rule's stated numeric/operator boundary, if any (feeds Step 2's `both-divergent` comparison and the labeler's ε tolerance). |
| `codeAttestation` | Omitted for every rule below — this is a ported class with no plan/impl chain (tech-spec "SDD — the trace-join — the crux"); Step 4's trace-join falls back to `source: manual` for the pilot. |

## SR-1 — Bug classification (intent analog of GOLD-16: boolean classification)

- **id:** `SR-1`
- **ruleName:** `BugClassification`
- **statement:** A ticket is classified as a Bug when its `IssueType` equals the literal `"Bug"`, exact
  match, case-sensitive. (`ticket.md:17` — "Bug classification: `IssueType == "Bug"` (exact match,
  case-sensitive). Used by BugRatioService and ScopeChangeService classification.")
- **expectedOutcome:**
  - `kind`: `boolean`
  - `targetField`: `bugClassification` (per-ticket; feeds the `bugSp` / `nonBugSp` split downstream)
  - `condition`: `IssueType == "Bug"` (case-sensitive, exact string match — `"bug"` or `"BUG"` do **not**
    qualify)
- **boundary:** none (an exact-match predicate, not a numeric/operator threshold)

## SR-2 — Bug ratio percent, ratio-of-totals (intent analog of GOLD-17: numeric ratio)

- **id:** `SR-2`
- **ruleName:** `BugRatioPercent`
- **statement:** Multi-sprint bug ratio is the **ratio of totals** — `sum(bugSp across included sprints) /
  sum(completedSp across included sprints) * 100` — **not** an average of each sprint's individual ratio.
  This prevents a high-SP sprint from skewing the aggregate. Where `completedSp` totals `0`, the ratio is
  `0`. (`bug-ratio.md:16-23`, esp. `:23` "Uses ratio of totals (total bugSp / total completedSp), NOT average
  of per-sprint ratios.")
- **expectedOutcome:**
  - `kind`: `numeric` (value ± ε)
  - `targetField`: `bugRatioPercent`
  - `condition`: `totalBugSp / totalCompletedSp * 100`, computed over the **sum** of each component across
    sprints (never as `average(perSprintRatio)`); `totalCompletedSp == 0 → 0`.
  - `epsilon`: `1e-9` — the intent docs state no explicit rounding/tolerance; `1e-9` is an author-supplied
    floating-point-identity default (exact rational arithmetic expected), not a value taken from any
    sequestered source. Step 2's labeler treats this as the default tolerance unless a rule states otherwise.
- **boundary:** the `totalCompletedSp == 0 → 0` edge case (a computation-identity boundary, not a numeric
  threshold)

## SR-3 — Alert active (intent analog of GOLD-18, boolean half)

- **id:** `SR-3`
- **ruleName:** `AlertActive`
- **statement:** An alert is active for a developer when the count of consecutive closed sprints (walked
  from most recent backward) where the developer's bug ratio is `>=` the configured threshold reaches the
  configured consecutive-sprint-count. Defaults: threshold `50%`, consecutive count `2`. Evaluated against
  **all** sprint history, not just the current view range. (`bug-ratio.md:26-33`.)
- **expectedOutcome:**
  - `kind`: `boolean`
  - `targetField`: `alertActive`
  - `condition`: `consecutiveStreak >= consecutiveSprintCountThreshold` (see SR-4 for the streak itself)
- **boundary:** `threshold = 50%` (default), `consecutiveSprintCountThreshold = 2` (default) — both
  configurable in Settings per the prose.

## SR-4 — Consecutive streak (intent analog of GOLD-18, streak-integer half)

- **id:** `SR-4`
- **ruleName:** `ConsecutiveStreak`
- **statement:** The consecutive-sprint streak is the count of the most-recent consecutive closed sprints
  (walked backward from the latest) where the developer's bug ratio is `>=` the threshold. A sprint with `0`
  completed SP has a `0%` bug ratio and **breaks** the streak (does not count toward it, and resets the walk).
  (`bug-ratio.md:26-33`, esp. `:31-33` "Streak breakers: A sprint with 0 completed SP = 0% bug ratio -> breaks
  the streak; Alert evaluates against ALL sprint history, not just the current view range.")
- **expectedOutcome:**
  - `kind`: `streak-integer`
  - `targetField`: `consecutiveStreak`
  - `condition`: count of trailing consecutive closed sprints (most-recent-first) with `bugRatioPercent >=
    threshold`; a `0`-completed-SP sprint breaks the count (does not extend it, and is itself not `>=
    threshold` since its ratio is defined as `0%`).
- **boundary:** `threshold = 50%` (default) — the per-sprint qualifying condition for extending the streak.

## Coverage summary

| Golden intent analog | Outcome kind(s) | Spec rule(s) |
|---|---|---|
| GOLD-16 (boolean classification) | boolean | SR-1 |
| GOLD-17 (numeric ratio) | numeric (± ε) | SR-2 |
| GOLD-18 (boolean alert + integer streak) | boolean, streak-integer | SR-3, SR-4 |

All three `expectedOutcome.kind` values (`boolean`, `numeric`, `streak-integer`) are exercised. `Satisfies:`
AC-2, AC-6 (plan Step 1).
