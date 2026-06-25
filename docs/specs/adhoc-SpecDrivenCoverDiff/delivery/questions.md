# Spec-driven Cover + diff (one-class spike) — Questions

## Q1: The headline candidate bug (L272) is already FIXED in live KG source — how should Step 5/6 characterize it?
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Phase 1 analysis (affects Step 5 diff + Step 6 go/no-go)
**File:** `D:\src\knowledge-gateway\src\Services\KnowledgeGateway\KnowledgeGateway.API\Features\TextToSql\GeneratedSqlValidator.cs` (now L272, file is 523 lines vs the plan/baseline's 519)

**Context:** The whole spike's headline (communication-log line 17, both Direction-2 writeups, both kill-delta
writeups) is *"both directions independently converged on GeneratedSqlValidator.cs:272"* — Direction 1 left a
surviving `>`→`>=` mutant there; Direction 2 produced a red there (`|0.86-0.85| > 0.01` rejects a spec-valid
value). The recorded evidence shows the buggy line as:
```csharp
if (Math.Abs(literal - resolvedNumeric.Value) > 0.01)   // L272 — the bug
```
But the **live KG source has already been patched** since the experiments ran. It now reads:
```csharp
// FP-safe boundary: the tolerance is exclusive ... IEEE-754 makes e.g. 0.86 - 0.85 == 0.0100000000000000009 ...
// The 1e-9 margin absorbs FP noise ... without admitting any real over-tolerance diff.
if (Math.Abs(literal - resolvedNumeric.Value) > 0.01 + 1e-9)
```
The fix comment *describes the exact bug the spike found*. So the spike's primary deliverable is being
synthesized from evidence whose central finding is now stale-but-validated.

**Question:** How should the Step 5 diff and Step 6 writeup characterize L272 — given the evidence is genuine
but the consuming repo already acted on it?

**Recommendation:** Characterize L272 as **"found by the spike, since fixed in KG (the fix comment confirms
the spike's diagnosis verbatim)"** — and treat that as *strengthening*, not weakening, the go signal: the
spike's headline finding was real enough that the consuming team patched it. The diff/writeup state the
finding **as recorded** (the bug the methods converged on) with a one-line "Status in live source: FIXED
(`> 0.01 + 1e-9`, KG commit post-experiment) — corroborates the finding was a true positive" note. I do **not**
re-run experiments or re-baseline against the patched source (out of scope per plan §107; the spike measures
the *method*, and the recorded evidence is the method's output at the time it ran). I add a Carry-Over note so
the reviewer/architect sees the live-source delta explicitly.
**Confidence:** medium — the characterization is well-grounded (live source verified, fix comment matches the
finding word-for-word), but whether a since-fixed finding should anchor the headline vs be footnoted is a
judgment call the architect owns. Leaning "report-as-found + FIXED note" because erasing a validated finding
because it was fixed would understate the spike's actual value.

### Answer
Report as found-by-the-spike. The diff/writeup computes against experiment-time evidence only (killdelta-*/specdriven-*/baseline-*) — re-deriving against the now-fixed code would erase the headline finding. Annotate L272 status: FIXED in live KG (`> 0.01 + 1e-9`, comment echoes the spike's diagnosis verbatim). Frame as a validation win — the harness found a real bug the team has since patched; this strengthens the GO. — architect, relayed by coordinator 2026-06-25

## Q2: Steps 2 and 4 name deliverable files (`rule-code-map-{class}.md`, `candidate-bugs-{class}.md`) that were never written — backfill them, or fold into the Step 5 diff?
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Phase 1 analysis (Step 2 Accept, Step 4 Accept)
**File:** `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/`

**Context:** The prior solo run produced the *evidence* but not all the plan's *named artifacts*. Mapping each
step's Accept clause to what exists on disk:

| Step | Accept demands artifact | On disk? |
|------|-------------------------|----------|
| 1 | targets confirmed + golden folder isolated + ids registered | YES — `baseline-*`, both writeups' Method sections, KG `targets/*.json` (verified ids-only) |
| 2 | `delivery/rule-code-map-{class}.md` (rule→file:line, or `no-code-found`) | **NO file** — rule→code links are embedded in `specdriven-*.md` (e.g. GOLD-08→L272) but not as the named map |
| 3 | consensus code-rules set saved for Step 5 | PARTIAL — survivor/mutation data in `baseline-*` + `killdelta-*` *is* the code side; no rules-list file by that name |
| 4 | `delivery/candidate-bugs-{class}.md` + per-rule kill | **NO file** — candidate bugs (the 5 reds, 1 real) live in `specdriven-generatedsqlvalidator.md` |
| 5 | `delivery/diff-{class}.md` (3 axes) | **NO file** — to be written this run |
| 6 | `delivery/spike-result.md` (go/no-go) | **NO file** — to be written this run |

The communication-log scopes this run as "Step 5 + Step 6 + close" only, but Steps 2/4's *named* artifacts are
also missing. The underlying content for all of them already exists in the `specdriven-*` and `baseline-*`
files — only the canonically-named files are absent.

**Question:** For this closeout run, do I (a) write only `diff-{class}.md` + `spike-result.md` and reference the
existing `specdriven-*`/`baseline-*` files as the Step 2/3/4 evidence, or (b) also backfill
`rule-code-map-{class}.md` and `candidate-bugs-{class}.md` as standalone named artifacts?

**Recommendation:** **(a) — write only the two remaining headline deliverables** (`diff-{class}.md`,
`spike-result.md`), and inside each, **cite the existing files** as the Step 2/3/4 evidence (the diff's
`spec ∧ ¬code` column carries the rule→code link inline; the go/no-go's AC-2/AC-3/AC-4 rows point at
`specdriven-*.md` and `baseline-*.md`). Rationale: this is an explicitly low-ceremony two-way-door spike
(plan §5, §104) whose real verification is the Step 6 go/no-go; the content the named files would hold already
exists and is cited. Backfilling two more files is artifact-shuffling that adds no decision value to a spike
that's closing. If you'd rather have clean per-step artifacts for the record, I'll do (b) — it's ~20 min more
and zero new analysis.
**Confidence:** medium — (a) satisfies the spec's AC-2/AC-3/AC-4 *substance* (the map exists, candidate bugs
exist, all are findable) and matches the run's stated "Step 5 + 6 + close" scope; the only cost is that two
plan-step Accept clauses are met by-reference rather than by a file at the named path. The architect's
done-check is the consumer of that choice, so the architect should rule.

### Answer
BACKFILL the named files — don't cite-by-reference. Write `rule-code-map-{class}.md` (Step 2 / AC-2) and `candidate-bugs-{class}.md` (Step 4 / AC-4) by extracting content already in specdriven-*/baseline-*. The accept clauses name those files and the architect's done-check checks literally — a missing named file = a guaranteed Missing → bounce. — architect, relayed by coordinator 2026-06-25

## Q3: Review/done-check mode for closeout — self-review vs Step-1 done-check, and is `implementation.md` even the right artifact?
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Phase 1 analysis (plan §100 Review mode)
**File:** `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/`

**Context:** The plan (§100-105) sets **Mode 2 self-review against AC-1..AC-5**, no separate reviewer/Codex
(two-way-door spike). The communication-log (line 8) sets Review Mode = self, "architect Step-1 done-check is
the gate." This run's deliverables are two synthesis markdown files (a diff + a go/no-go), not code — so there
is no build/test to verify, and `implementation.md`'s code-centric sections (Files Created/Modified for
*source*, Skills Used with `tdd`) partly don't apply.

**Question:** (1) Confirm the closeout gate is the architect's Step-1 done-check against AC-1..AC-5 (not a full
Step-2 code review). (2) Confirm I still write `implementation.md` per the format skill (it's my required
primary deliverable) even though the "code" is two synthesis docs — recording the two files under Files
Created, Skills Used = `None` (synthesis, plan marks Steps 5/6 `TDD: no`/`Skill: None`), with the L272
live-source delta in Carry-Over.

**Recommendation:** (1) **Yes — architect Step-1 done-check vs AC list is the gate**, matching plan §104 and the
comm-log; no Step-2 reviewer/Codex for this spike (that's owed at the full-build plan, plan §105). (2) **Yes —
write `implementation.md`** as my primary deliverable (ADR-17): the two synthesis docs go under Files Created,
`## Skills Used` table rows for Step 5/6 = `None` (plan-sanctioned, both marked `Skill: None`/`TDD: no`), and
Carry-Over carries the L272 fix delta (Q1) for the architect's done-check + any later learner sweep. The format
skill's source-code framing bends fine to a docs-only deliverable — the section *map* still holds.
**Confidence:** high — both points are directly stated in the plan + comm-log; this is confirmation, not a new
decision. I flag it only because a docs-only deliverable through a code-shaped pipeline is an easy place to
skip `implementation.md`, which would leave the done-check nothing to read.

### Answer
Confirmed: architect Step-1 done-check vs AC-1..5 is the gate; no Step-2 reviewer/Codex for this spike. Write `implementation.md` and include a `## Self-Review` section mapping each of AC-1..5 to its evidence — that IS the plan's Mode-2 self-review. — architect, relayed by coordinator 2026-06-25
