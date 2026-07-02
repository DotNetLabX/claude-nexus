# SDD Coverage Loop — Questions

## Q1: Step 1 clean-room — does "names the target field of BugRatioMultiSprintData/…SingleSprintData" mean the exact C# member, or the conceptual/intent field?
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Step 1 — Author the spec oracle (golden-shaped intermediate)
**File:** `docs/specs/adhoc-SddCoverageLoop/delivery/spec-rules-bugratio.md` (to be created)

**Context:** Step 1 is emphatically **clean-room**: "author ONLY from the intent docs — never from the SR
golden set, the code-mined KB, or `BugRatioAnalyzer.cs`." Its acceptance also requires each `expectedOutcome`
to **name the target field** of `BugRatioMultiSprintData` / `BugRatioSingleSprintData` the rule asserts.
Those are the C# **return types** of `ComputeMultiSprint` / `ComputeSingleSprint`; their exact member names
(e.g. a `BugRatioPercent` / `AlertActive` / `ConsecutiveStreak`-style property) live **in the code**
(`BugRatioAnalyzer.cs` or its data types) — which the clean-room rule forbids me from reading before authoring.
The Fokus prose lineage (the sanctioned source) gives the intent field names — `bugRatioPercent`, the alert
being "active", the "consecutive sprint count" streak — but not the exact C# `…Data` members.

So the two acceptance clauses are in tension only if "target field" means the exact C# member. This is
load-bearing: reading the `.cs` to get exact member names would contaminate the spec arm and defeat the
independence the whole pilot exists to test (AC-1/AC-2, and the Step-7 crosswalk that reconciles the two
arms' differing identities post-hoc).

**Question:** For Step 1, should `expectedOutcome.targetField` be the **conceptual/intent field name derived
from the Fokus prose** (clean-room preserved; the exact C# member binding is deferred to the spec-cover agent
at live-run in Step 3/8, and reconciled by the Step-7 crosswalk) — or do you intend the exact
`BugRatioMultiSprintData` member name (which would require sanctioning a narrow, field-names-only read of the
`…Data` type declarations, ordered strictly after Step 1 is otherwise drafted)?

**Recommendation:** Conceptual/intent field name from the Fokus prose. Author `targetField` as the intent
identity (e.g. `bugRatioPercent`, `bugClassification`, `alertActive`+`consecutiveStreak`); do **not** read any
`.cs` before or during Step 1. The exact C# member is the code arm's business; the Step-7 canonical-name
crosswalk is exactly the mechanism that lets the two differently-named identities line up later — so naming
the intent field is not only clean-room-safe, it is the design.
**Confidence:** high — the feature's core claim (two mutually-blind arms, reconciled post-hoc) makes any
code-derived naming in Step 1 self-defeating; the plan's own clean-room directive resolves the tension toward
the prose. Surfacing only because a wrong reading here contaminates the pilot's headline independence.

### Answer
**Answered by:** architect (To: architect — no user attribution needed).

**Your recommendation is correct: `expectedOutcome.targetField` is the conceptual/intent field name derived
from the Fokus prose. Do NOT read any `.cs` before or during Step 1.** Author the intent identity
(`bugRatioPercent`, `bugClassification`, `alertActive` + `consecutiveStreak`, etc.).

Three independent constraints all force this reading, and none of them tolerate an exact-member read in Step 1:
- **AC-1** (two mutually-blind arms) + **AC-2** (spec source is the intent/spec lineage, never the golden set
  or code) — reading `BugRatioAnalyzer.cs` / the `…Data` type declarations to author the *oracle* would leak
  the code's actual output shape into the spec arm and defeat the independence the whole pilot exists to test.
- **OD-6(a)** — the owner's resolved decision is to author a golden-shaped intermediate **from the Fokus prose
  lineage**. Prose lineage = intent. An exact-member read contradicts the very decision Step 1 implements.
- The exact C# member binding already has a home elsewhere, so Step 1 does not need it: it is bound by the
  **spec-cover-calc test-writer at live-run** (the Step 3 workflow's Cover agent, exercised in Step 8). That
  agent legitimately reads production source to emit `ComputeMultiSprint(input).<member>` assertions — that is
  spec-cover's *normal* operation and **not** a clean-room breach. The clean-room bar is on authoring the
  ORACLE from code; it is not a bar on the test-writer *running against* code. So the "should" (intent field,
  Step 1) and the "is" (real member, live test-write) stay on opposite sides of the blind line, exactly as
  designed.

**One correction to your framing, so the plan stays precise:** the intent→C#-member binding is the
**test-writer's** job at live-run (Step 3 workflow / Step 8), **not** the Step-7 crosswalk. Step 7 reconciles
**rule NAMES** (code arm's autonomous `BR-1, BR-2…` vs your authored names) so `diffRules` can match — it is
**not** the field-name binder. Keep the two axes separate: rule-name reconciliation = Step 7 (post-hoc, outside
the blind runs); field-identity binding = the spec-cover-calc test-writer (live, reads code by design). Don't
overload the crosswalk map with field-name entries.

**No offline build step (Steps 1–5, 7-helper) needs an exact C# member name.** The labeler (Step 2) is a
generic comparator over whatever field identity the test model carries — it does not hard-code members; the
Step 3 workflow reads only `spec-rules-bugratio.md` at spec-load. So the clean-room boundary holds across your
entire developer-owned build with zero `.cs` reads.

**Recommended plan edit (owed — not yet applied):** Step 1's acceptance currently reads "names the target
field of `BugRatioMultiSprintData`/`…SingleSprintData`," which is the exact phrasing that invites the wrong
read. It should be tightened to "names the **intent/conceptual** target field … **NOT an exact C# member read
from code**" so this tension cannot resurface at the done-check. I could not apply it now — the pipeline gate
blocks `plan.md` writes during this answer/analyze phase (Phase-2 only). Flagged to the team lead to fold in on
the next plan-writable pass; the answer above is binding regardless. Proceed with Step 1 as you recommended.
