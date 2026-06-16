---
name: review-format
description: Format spec for the review artifact — severity ratings, verdict, findings, evidence table. Load when writing or consuming review.md.
---

# Review Format

`review.md` carries **two labeled sections** — one per review step — written by different agents at different times. No other verdict files exist for this purpose (`done-check.md` and `plan-review.md` do NOT exist). The critic produces no durable file — its findings go via message only.

- **`## Step 1 — Done-Check`** — written by the architect. Contains step dispositions and a single PASS/FAIL verdict line.
- **`## Step 2 — Code Review`** — written by the reviewer. Contains severity findings and a single APPROVED/REQUEST CHANGES verdict line.

The team lead greps **named sections**, not bare `Verdict:` lines, to avoid stacked-verdict ambiguity.

## Review Checklist

### Step 1: Done check (architect, no code reading)
- Every plan step has a corresponding implementation.md entry
- No plan steps missing or silently skipped
- Reported deviations have reasons
- No unexpected files or scope creep

### Step 2: Code review (reviewer, reads implementation)
- Each plan instruction has corresponding code that matches
- Referenced patterns and skills were followed
- Naming conventions match coding standards
- Build passes (fresh output, not assumed)
- No new patterns invented
- Business/domain rules enforced at the architectural layer the project's conventions specify (not leaked into transport/handler code)
- Deviations flagged with verdict: plan wrong or code wrong
- Security: no hardcoded secrets, inputs validated, no injection vectors
- Logic: all branches reachable, no off-by-one, null handling correct
- Performance: check for performance anti-patterns per loaded conventions
- Data-loading depth: when logic accesses nested/related data, verify the data layer actually loads it to that depth — missing loads cause silent null/zero results, not runtime errors
- Boundary tests for threshold logic: when code uses `> N` / `>= N` conditions, verify tests exist at exactly N and N+1
- Skill mapping verified: any "None" disposition in the Skill Mapping was warranted (no existing skill actually covers the step)
- `Satisfies:` traceability (where present): for any plan step carrying a `Satisfies:` annotation (an `AC-n` or an ADR unit), verify the implemented code actually traces to that target — the defense against intent drift (code that runs but does the wrong thing). This is a **where-present** check, not a mandate: a step without `Satisfies:` is not a finding (the annotation is optional and existing plans predate it)

## Severity Ratings
- **CRITICAL**: Security vulnerability, data loss risk, fundamentally wrong approach. Blocks merge.
- **HIGH**: Logic error, missing error handling, plan deviation without justification. Should fix.
- **MEDIUM**: Suboptimal pattern, minor inconsistency. Consider fixing.
- **LOW**: Style preference, minor improvement. Optional.

## Origin (causal classification)

Each finding carries an **Origin** alongside its Severity — *where the defect was introduced*.
Severity says how much it hurts and Confidence how sure you are; Origin says where the *process*
leaked, so a recurring class of finding points at the stage that should have caught it. It never
changes the verdict — it is a tag, not a gate.

| Origin | The defect's root | Routes to |
|--------|-------------------|-----------|
| **requirements** | The spec / acceptance criteria asked for the wrong thing, or didn't ask. Fixing only the code leaves the spec wrong. | PO / user (via team lead) |
| **design** | The plan or architecture is the root; the code faithfully implements a flawed plan. | Architect, not developer |
| **implementation** | The code diverges from a correct plan. The default developer-fix path. | Developer |
| **external** | A dependency, platform, or upstream contract is the cause (a library bug, a Claude Code platform change, a sibling service). | Often a follow-up, not a same-cycle fix |

A finding whose origin is genuinely unclear defaults to **implementation**. The architect's Step-1
done-check dispositions are not findings and carry no Origin — Origin is a Step-2 finding field
(and applies to any standalone remediation finding written in the same block).

## Confidence Score (0–100)

Each finding carries a numeric **Confidence** (0–100) — how sure you are it is real and correctly
diagnosed. It bands onto the categorical labels the checklist and self-audit use:

| Score | Band | Basis |
|-------|------|-------|
| 80–100 | HIGH | Hard evidence — file:line, confirmed behavior, a reproduced failure. |
| 50–79 | MEDIUM | Likely, but the developer may hold context you don't. |
| 0–49 | LOW | A hunch, not a finding. |

**Report cutoff — ≥80.** Only findings scoring **≥80** belong in `## Findings` as asserted
findings. A finding below 80 is **moved to `## Open Questions`** — surfaced for the developer to
confirm or refute, **never silently dropped**. This is feature-dev's ≥80 noise gate adapted to
Nexus's existing self-audit (which already routes non-HIGH CRITICAL/HIGH findings to Open
Questions) — the threshold is now a number. The point is to keep a genuine-but-uncertain CRITICAL
(say a security risk you're only 70% sure of) visible as an Open Question rather than asserting it
at full severity or losing it.

## Verdict
- **APPROVED**: No CRITICAL or HIGH issues.
- **REQUEST CHANGES**: Any CRITICAL or HIGH issue present.
- **COMMENT**: Only MEDIUM/LOW, no blockers.

## Review Output Format

Both steps write to `docs/specs/{slug}/delivery/review.md` under their own labeled section.

**Step 1 — Done-Check section (architect writes):**

```
## Step 1 — Done-Check

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — {step name} | Implemented / Deviated / Missing / Superseded / N/A | {reason if not Implemented} |
...

**Verdict: PASS** (or **Verdict: FAIL — step N missing**)
```

**Step 2 — Code Review section (reviewer writes):**

```
## Step 2 — Code Review

## Reviewed By
[Who performed this review: reviewer, /review (skill), an external review tool, or a combination]

## Verdict: APPROVED | REQUEST CHANGES | COMMENT

## Pre-commitment Predictions
- [What you expected to find vs what you found]

## Findings

### [SEVERITY] Finding title
**File:** `path/to/file:line`
**Origin:** requirements | design | implementation | external
**Issue:** What's wrong
**Fix:** Specific suggestion
**Confidence:** NN/100

## Positive Observations
- [What was done well]

## Gaps
- [Edge cases or paths not covered]

## Open Questions
- [Low-confidence findings moved here by self-audit]

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Build | pass/fail | [per docs/conventions/coding-conventions.md, if defined] | [summary] |

*Status: COMPLETE — reviewer, {date}*
```

**Completion footer.** Each section's writer (architect for Step 1, reviewer for Step 2) ends
its own section with `*Status: COMPLETE — {role}, {date}*` when that review step is done. The
footer is how the artifact **self-certifies**: the team lead trusts the footer, not the
completion message, so a stranded message costs nothing (ADR-17).

## Anti-patterns

- **Findings without file:line evidence.** Every CRITICAL or HIGH finding must cite an exact file path and line number. "The handler doesn't validate input" is not a finding — `src/area/Thing.ext:42` is.
- **Severity inflation.** Style preferences, naming choices, and minor inconsistencies are LOW by definition. Flagging them as HIGH inflates the fix burden and trains the developer to ignore severity ratings. When in doubt, write it as LOW or move to Open Questions.
- **Approving without fresh build output.** "Should work" is not evidence. Every approval must include a build check row in the Evidence table with actual command output. Claiming the build passes without running it is grounds for REQUEST CHANGES on the review itself.
- **Rubber-stamping fix cycles.** On cycles 2 and 3, re-check the areas adjacent to each fix — not just the exact lines changed. A fix that introduces a regression in a nearby call site is still a failed review.
- **Writing a critic verdict to review.md.** The critic returns findings by message only — it does not write to any file. Do not create `plan-review.md` or `done-check.md` — these files do not exist in the Nexus artifact model.
- **Stacked verdicts.** Never put more than one verdict line in a single section. The Step 1 and Step 2 sections each carry exactly one verdict line — their own.

## Consumers

| Agent | What they read | Action taken |
|-------|---------------|-------------|
| Developer | Step 2 findings (CRITICAL/HIGH first) | Fixes each finding, notes in implementation.md |
| Architect (done check) | Writes Step 1 section | Adds step dispositions + PASS/FAIL |
| Architect (escalation) | Step 2 findings | Decides plan wrong vs code wrong |
| Team Lead | `## Step 1 — Done-Check` section for `Missing` marker; `## Step 2 — Code Review` section for verdict line | Routes to developer (REQUEST CHANGES) or closes (APPROVED) |
