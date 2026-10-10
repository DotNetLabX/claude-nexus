---
name: review-format
description: Format spec for the review artifact — severity ratings, verdict, findings, evidence table. Load when writing or consuming review.md.
---

# Review Format

The two checks after a build run **at the same time**, so each writes its own file:

- **`done-check.md`** — the architect's done check (Step 1): step dispositions, process slips and one PASS/FAIL verdict per check. Only the architect writes it.
- **`review.md`** — the reviewer's code review (Step 2) and its re-reviews, plus the coordinator's fix list for each round. Severity findings and one APPROVED/REQUEST CHANGES verdict per review section.

Five sibling verdict files are sanctioned beside `review.md` and no others (`plan-review.md` does NOT exist): `done-check.md` at the architect's seat; `review-codex.md` and `review-second.md` at the reviewer seat; `review-critic.md` and `review-critic-codex.md` at the critic seat. The critic writes no file; the persona persists its message to `review-critic.md` under the critic-round layout (→ agents-workflow.md § Critic rounds).

**Section map (targeting index).** The fixed top-level headings agents target for a section read (ADR-22 Extended): in `done-check.md`, `## Step 1 — Done-Check` with one `### Check {k}` block per check; in `review.md`, `## Step 2 — Code Review` (the first review), `## Step 2 — Re-review (cycle {N})`, `## Step 2 — Fix list, cycle {N}` and `## Step 2 — Merge, no fix round`. Grep `^##` for live line numbers, then `Read` with `offset/limit` around the section you need rather than the whole file.

The team lead greps **named sections**, not bare `Verdict:` lines, to avoid stacked-verdict ambiguity.

**Past features:** a feature closed before this release keeps its done check as a `## Step 1 — Done-Check` section inside `review.md`; readers fall back to that section only when `done-check.md` is absent.

## Review Checklist

### Step 1: Done check (architect, no code reading, writes `done-check.md`)
- Every plan step has a corresponding implementation.md entry
- No plan steps missing or silently skipped
- Reported deviations have reasons
- No unexpected files or scope creep
- Skill-conformance evidence (`.claude/audit/skill-invocations.log`): a log **absent entirely** — the file missing from both the local and the main-checkout `.claude/audit/` — is a **disclosed evidence gap**, scored per the architect done-check, not a Fail. An **empty scoped window inside an existing log** is NOT the absent-file case and keeps the normal Fail disposition

### Step 2: Code review (reviewer, reads implementation)
- Each plan instruction has corresponding code that matches
- Referenced patterns and skills were followed
- Naming conventions match coding standards
- Comment noise: narration/rationale comments that restate what the code shows, or history in a comment (feature or bug ids, review rounds, dates) — LOW, MEDIUM when pervasive; exempt: constraint comments, `[{unit} BR-n]` tags, tooling suppressions (e.g. `// Stryker disable`), conventions-mandated forms.
- Build passes (fresh output, not assumed)
- Platform-conditional check: **a green suite proves the code works on your platform, nothing more.** Grep the diff for `process.platform` (or any OS/filesystem-conditional) in shipped code; for each hit, force the branch to the other side and re-run the affected suite before approving — tests that spawn the script inherit the author's OS and cannot tell "correct" from "correct here". Authoring-side mirror worth filing as a finding: a platform-conditional normaliser's consumers must each declare which side they need — folding is right against well-known names, wrong against paths the user supplied, and the two must not share a helper silently
- Concurrent-append discipline: **a read-before-write rule makes your read atomic with your write, never with the other agent's** — so two agents can each obey it and still collide. Two measured shapes: a string-anchored `Edit` resolving *inside* another checker's still-open block, and a sequential id claimed from a shared register that a peer commits first. Re-read the file's true end immediately before appending; prefer one `## Pass {X}` region per checker, else serialize appends through the team lead. In practice no shipped checker shares this file — the done check and the second reader each write their own sibling, and a Codex verdict is persisted by the session that dispatched it — so the rule guards a future same-file case rather than a live one. Reordering afterwards is not the fix, it edits another checker's artifact
- Plan-mandated tests are executed under a filter that *includes* them — a green baseline that *excludes* a required test (e.g. a `--filter Category!=Integration` run when the plan mandates an `Integration`-tagged test) says nothing about that test and can hide it shipping RED. Run the mandated test by name; and verify a tagged test's *actual* dependency before deeming it un-runnable (an in-process integration test with no live dependency still runs)
- No new patterns invented
- Business/domain rules enforced at the architectural layer the project's conventions specify (not leaked into transport/handler code)
- Deviations flagged with verdict: plan wrong or code wrong
- Security: no hardcoded secrets, inputs validated, no injection vectors
- Logic: all branches reachable, no off-by-one, null handling correct
- Performance: check for performance anti-patterns per loaded conventions
- Data-loading depth: when logic accesses nested/related data, verify the data layer actually loads it to that depth — missing loads cause silent null/zero results, not runtime errors
- Boundary tests for threshold logic: when code uses `> N` / `>= N` conditions, verify tests exist at exactly N and N+1
- Negative-assertion gates traced: a "X is never called" / "no regression" / `CallCount == 0` assertion is a real gate **only** if a reachable path exists from the exercised entry point to X in the test wiring. Trace the spy / captured dependency before trusting the negative — a spy on a dependency the path never invokes asserts nothing (a vacuous test that passes for the wrong reason)
- Skill mapping verified: any "None" disposition in the Skill Mapping was warranted (no existing skill actually covers the step)
- `Satisfies:` traceability (where present): for any plan step carrying a `Satisfies:` annotation (an `AC-n`, an ADR unit, or a `{ruleName}` from the slug's rule list), verify the implemented code actually traces to that target — the defense against intent drift (code that runs but does the wrong thing). This is a **where-present** check, not a mandate: a step without `Satisfies:` is not a finding (the annotation is optional and existing plans predate it), and plan-level coverage of the rule list's behaviour rows is the architect's duty and the plan critic's check — never a review finding
- Relocation/refactor moves: verify at least one moved or "verbatim-adopted" block **mechanically** (`diff` against `git show {pre-commit}:{path}`), never by reading both copies — a verbatim-move claim from the developer or a prior pass is a relayed fact, and single-word qualifier drops survive prose reading but not a diff
- Producer/consumer literal check: when the change adds a parser for a contract string (a stamp line, a required heading, a tag grammar), grep that literal across the shipped prose the *producing* agent reads, and close the round trip by instantiating the producer's documented template **by hand** — never by running the parser's own fixture, which can agree with the parser while the shipped template disagrees with both. A literal living only in the parser and its test fixture is an unreachable check however green the suite (the vacuous-gate class — `rules/on-demand/engineering-discipline.md` § Failure-mode direction)
- Mutation evidence scored, not read: when the record cites a mutation sweep as its sanction (e.g. for a retro-fit step that skipped red-first), run your own battery instead of accepting the count — an author's mutants are drawn from the branches the author already reasoned about, so the sweep systematically misses scope decisions and rulings that arrived after the matrix was written. **Scale: a handful, 3–10** — enough to sample independently, never a full mine (`mine-oracle-strength`, in `nexus-miner`, is the blind-battery instrument; this is not it). **Aim** at the guards encoding *ratified rulings* — answered questions, scope decisions, exclusions — rather than the verdict rows the author's matrix already covers, plus the code the fix itself added. **Scoring: a kill counts only from a failing test assertion** — a crash, compile failure, or timeout is an adjudication bucket, never an auto-kill, or you report a suite stronger than it earned (the same over-claiming this check exists to stop). Copy the subject, its tests, and the shared test helpers into a scratch tree so the experiments are free and reversible (and keep the pre-fix copy — it is a free differential oracle for "did this fix flip any exit code?"). Re-run **per fix cycle**; pick the class the round calls for — deletion finds missing guards, refinement (swap an exact key/lookup for a heuristic one) finds guards whose *precision* is unasserted, **set membership** (remove one member of a policy set the tests iterate — a `for (const k of SET) assert(...)` loop pins no membership at all), **threshold boundary** (N−1 for every `>= N`; a fixture sitting exactly at N says nothing about N−1), and — on a **fix cycle** — **one constraint at a time**: drop each claimed pin singly, require each mutant to die on its own, then mutate the original bug **back in** to prove the regression test prevents rather than describes it (a pin dying only under the blanket widening is a guard rail, not a discriminator). **Aim at the function that spends a ratified constant, never the constant** — a constant asserted by name reads as coverage, which is what makes the gap invisible. **Run the unmutated baseline inside the scratch tree and subtract its failures before scoring** — path-sensitive pins go red in a scratch copy at a longer path, and a *constant* failure count across mutants is the tell you are reading the baseline, not kills
- Causal-finding grammar: a finding asserting *causation* (a diagnosed defect mechanism — "X causes Y") names the mechanism — the variable/path that produces the failure — or its causal attribution is tagged **`correlation-only`** and capped at MEDIUM. Carve-out: a **directly-observed** CRITICAL/HIGH impact (data loss, security, silent incorrect output) keeps its severity floor even when the mechanism is unproven — file the impact at full severity and route the unproven attribution to Open Questions; never collapse both into a non-blocking MEDIUM

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
confirm or refute, **never silently dropped**. The point is to keep a genuine-but-uncertain CRITICAL
(say a security risk you're only 70% sure of) visible as an Open Question rather than asserting it
at full severity or losing it.

**Causal-attribution grammar (not a second threshold).** A finding asserting *causation* names its mechanism — the variable/path producing the failure — or the causal attribution is tagged **`correlation-only`** and capped at MEDIUM; a **directly-observed** CRITICAL/HIGH impact (data loss, security, silent incorrect output) keeps its severity floor (impact filed at full severity, unproven attribution routed to Open Questions). This is a *grammar* requirement, not a number: the ≥80 cutoff above remains the **sole** thin-evidence threshold.

## Verdict
- **APPROVED**: No CRITICAL or HIGH issues.
- **REQUEST CHANGES**: Any CRITICAL or HIGH issue present.
- **COMMENT**: Only MEDIUM/LOW, no blockers.

## Review Output Format

The done check writes `docs/specs/{slug}/delivery/done-check.md`; the code review, each re-review and the coordinator's fix list write `docs/specs/{slug}/delivery/review.md` — with one carve-out: a reviewer dispatched as a **second reader** (the first review, or a follow-up whose `Covers:` lists steps) writes the same Step-2 content to `review-second.md` instead, appending a new `## Verdict:` section per round, and the coordinator merges every reader's findings into the fix list. A second reader promoted to primary after Codex dropped writes that round's `review.md` section itself and re-heads its own `review-second.md` section to `## Promoted to primary — round {n}`. Where Codex is the code review's primary, the reviewer is always that second reader, and the session that dispatched Codex writes the Step-2 section from Codex's verdict (below).

**`done-check.md` (architect writes):** one `## Step 1 — Done-Check` heading, then one `### Check {k}` block per check, newest last. The newest block **with a completion footer** is the current verdict; a block without one is still in flight. A re-check re-checks only what the check it names failed.

```
## Step 1 — Done-Check

### Check {k} — {date} — {after the build | after fix cycle {N}}

**Model:** {your own model's exact id, self-reported from your system context — write "unknown" if unstated, never the model you were dispatched as; see agents-workflow.md § Artifact Formats}
**Re-checks:** check {j}        ← a re-check only

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — {step name} | Implemented / Deviated / Missing / Superseded / N/A | {reason if not Implemented} |
...

**Process slips:**              ← omit when none
- skill slip — step {n}: {skill}
- test slip — {the raw command as logged}

**Rules:** {n} listed behaviour rules without a disposition · {n} `tested` rules whose named test does not exist
{plan-hygiene or evidence-gap notes, if any}

**Verdict: PASS** (or **Verdict: FAIL — {the failed steps and slips}**)

*Status: COMPLETE — architect, {date}*
```

**Fix list (coordinator writes, in `review.md`):** once both checks are in, the coordinator appends one section per round. Every item is a numbered list row — never a `### [SEVERITY]` heading, which the verdict-integrity gate reads as an open finding — naming its source or sources (`done check`, `reviewer`, `second reader`, `Codex`); an item several readers reported is listed once. Failed steps first, then process slips, then review findings. The `Bar:` line under the heading names the round's bar (→ agents-workflow.md § Fix rounds): only the items that reach it are numbered above the follow-up line. Where readers disagree on a finding's level, its row carries the settlement in the level brackets with a one-line reason — `[MEDIUM — contested LOW/MEDIUM: {reason}]`. The in-bar rows close with the **follow-up line**, the one place both pipelines decide whether a follow-up review is owed:

```
## Step 2 — Fix list, cycle {N}
Bar: {all | MEDIUM | HIGH}

1. step {n} — missing (done check)
2. skill slip — step {n}: {skill} (done check)
3. test slip — {the raw command as logged} (done check)
4. [HIGH] {finding title} — `path/to/file:line` (reviewer, second reader)
5. [MEDIUM — contested LOW/MEDIUM: {reason}] {finding title} — `path/to/file:line` (Codex, reviewer)
...

Follow-up review: due — covers steps {list | none}

**Under the bar — recorded, not fixed:**
6. [LOW] {finding title} — `path/to/file:line` (second reader)
...
```

Items below the bar follow the follow-up line, under the bold line `**Under the bar — recorded, not fixed:**` — a bold line, never a heading, so it stays out of the section map — as numbered rows `{n}. [LEVEL] title — file:line (source)` that continue the list's numbering. The developer reads the block and never fixes it; open questions keep their own place and never go in it. Omit the block when nothing sits under the bar.

The follow-up is **due** when the list holds a failed step or a skill slip (a step built or redone in the round), or the review asked for changes; the line then names the built or redone steps, or `none`. It reads `Follow-up review: none due` when the round's done-check items are test slips only and the review approved. "The review asked for changes" means a `REQUEST CHANGES` — a CRITICAL or HIGH open: a round whose items are all leveled findings below that, with no step built or redone, reads `none due` whichever check raised them, a COMMENT or a Codex NO-GO over MEDIUMs included. Any merge that leaves nothing in the round's bar is a `## Step 2 — Merge, no fix round` section instead, carrying the merged verdicts; it may carry the under-bar block.

**Re-review (reviewer writes — or, on the Codex pair, the dispatching session):** every re-review is appended as its own section, with Edit, never by rewriting the file — the first review's findings stand, and a whole-file write would put them beside a later APPROVED:

```
## Step 2 — Re-review (cycle {N})

Covers: the round's changes; steps built or redone: {list | none}.
**Model:** {your own model's exact id}

## Verdict: APPROVED | REQUEST CHANGES | COMMENT

{findings, evidence and footer in the Code Review layout below}
```

`## Step 2 — Code Review` is the first review and is never rewritten.

**Step 2 — Code Review section (reviewer writes — or, on the Codex pair, the dispatching session):** a section persisted from a Codex primary keeps this layout, puts the provenance line `Primary: Codex — {GO | NO-GO}, persisted by {session}` under its verdict, and writes `**Model:** codex` plus any model the job reported — never the persisting session's own model (→ codex-dispatch.md § Code-review seat).

```
## Step 2 — Code Review

## Reviewed By
[Who performed this review: reviewer, /review (skill), an external review tool, or a combination]
**Model:** {your own model's exact id, self-reported from your system context — write "unknown" if unstated, never the model you were dispatched as; see agents-workflow.md § Artifact Formats}

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

**Completion footer.** Each writer ends its own block with `*Status: COMPLETE — {role}, {date}*`
when it is done — the architect each `### Check {k}` block, the reviewer the Code Review section
and each Re-review section. The
footer is how the artifact **self-certifies**: the team lead trusts the footer, not the
completion message, so a stranded message costs nothing (ADR-17).

## Anti-patterns

- **Findings without file:line evidence.** Every CRITICAL or HIGH finding must cite an exact file path and line number. "The handler doesn't validate input" is not a finding — `src/area/Thing.ext:42` is.
- **Severity inflation.** Style preferences, naming choices, and minor inconsistencies are LOW by definition. Flagging them as HIGH inflates the fix burden and trains the developer to ignore severity ratings. When in doubt, write it as LOW or move to Open Questions.
- **Approving without fresh build output.** "Should work" is not evidence. Every approval must include a build check row in the Evidence table with actual command output. Claiming the build passes without running it is grounds for REQUEST CHANGES on the review itself.
- **Rubber-stamping fix cycles.** On cycles 2 and 3, re-check the areas adjacent to each fix — not just the exact lines changed. A fix that introduces a regression in a nearby call site is still a failed review.
- **Writing a critic verdict to review.md.** The critic returns findings by message only — it does not write to any file. Do not create `plan-review.md` — that file does not exist in the Nexus artifact model.
- **Writing the done check into review.md.** The done check has its own file; the architect never writes `review.md` as done-check author (a past feature's in-file section is read, never extended).
- **Stacked verdicts.** Never put more than one verdict line in a single block. Each `### Check {k}` block, the Code Review section and each Re-review section carry exactly one verdict line — their own.

## Consumers

| Agent | What they read | Action taken |
|-------|---------------|-------------|
| Developer | The `## Step 2 — Fix list, cycle {N}` section (failed steps, slips, findings) | Fixes each numbered row above the follow-up line, notes in implementation.md |
| Architect (done check) | Writes `done-check.md` | Adds a `### Check {k}` block: dispositions, slips, PASS/FAIL |
| Architect (escalation) | Step 2 findings and the fix lists | Decides plan wrong vs code wrong |
| Team Lead | `done-check.md`'s newest footed check for its verdict and any `Missing` marker; the Code Review / newest Re-review section for its verdict line | Writes the fix list and routes one round to the developer when an item reaches the round's bar, or closes on the close predicate |
