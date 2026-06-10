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

## Severity Ratings
- **CRITICAL**: Security vulnerability, data loss risk, fundamentally wrong approach. Blocks merge.
- **HIGH**: Logic error, missing error handling, plan deviation without justification. Should fix.
- **MEDIUM**: Suboptimal pattern, minor inconsistency. Consider fixing.
- **LOW**: Style preference, minor improvement. Optional.

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
**Issue:** What's wrong
**Fix:** Specific suggestion
**Confidence:** HIGH | MEDIUM | LOW

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
```

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
