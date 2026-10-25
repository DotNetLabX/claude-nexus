---
name: implementation-format
description: Format spec for docs/specs/{slug}/delivery/implementation.md — step blocks, end-of-run summaries, anti-patterns, consumers. Load when writing or reviewing an implementation file.
---

# Implementation File Format

Written by developer **as each step completes**: `docs/specs/{slug}/delivery/implementation.md`. A
solo spawned inside the run writes its own section of it (§ Solo Fixes, below).

**Section map (targeting index).** The file is a fixed head, a variable step region, and a fixed
tail (ADR-22 Extended):

| Part | Headings | Targeted by |
|------|----------|-------------|
| Head | the title line, `**Model:**` | read the first few lines |
| Solo fixes (only when a solo ran) | `## Solo Fixes`, right after the head, one `### Solo fix {n} — {date}` block per spawn | `grep '^### Solo fix '` |
| Steps (variable) | `## Step N — {step name}`, one per plan step, in plan order | `grep '^## Step '` |
| Tail (fixed) | `## Key Decisions`, `## Skills Used`, `## Carry-Over Findings`, `## KB Changes`, `## Unfinished Tests` (only when a step close or a light acceptance run was cut), `## Deviations from Plan`, `## Self-Review` (Fast lane only), the completion footer | `grep '^## '` — the step blocks match too; read past them |

Grep for the heading you need, then `Read` with `offset/limit` around it rather than reading the
whole file. A crash-resume reads the **last step block** to find where work stopped.

`## Self-Review` appears **only on a Fast-lane run** (no reviewer agent), carrying the developer's
own verdict and evidence. It sits with the other tail sections, before the completion footer — the
footer is always the last line of the file. The architect's done-check and the team lead's close both
verify it exists on a Fast run, so it is required there and absent everywhere else.

```
# {Feature Name} — Implementation

**Model:** {your own model's exact id, self-reported from your system context — write "unknown" if unstated, never the model you were dispatched as; see agents-workflow.md § Artifact Formats}

## Step 1 — {step name}
**Files:** `full/path/to/File` — what changed and why; one line per file
**Skills:** {skill-name}, tdd — or `None` with the plan's sanction
**Rules:** one entry per rule the step lists under `Satisfies:` — `{ruleName}: tested — {test file} › {test name}` | `{ruleName}: not testable here — {reason}` | `{ruleName}: disputed — Q{n}`; omit the line where the step lists none
**Decisions:** implementation choices this step made that the plan did not specify — or `None`
**Deviations:** what was done differently, and why — or `None`
**Unfinished:** {files | whole unit run | {acceptance test file} (acceptance run)} — cut at {limit} s; only when this step's close, or its light acceptance run, was cut at its limit, else omit the line; one line per cut run
**Bug found:** {the symptom} — {the failing test or record} — {where it was}; only when this step met a bug it did not cause, else omit the line; one line per occurrence, so a block may carry several
**Risk raised:** {why} — light lane only: where this step turned out riskier than its plan line says, else omit the line
**Slow kept:** {test} — {reason}; only for a test this step wrote or touched that its one speed-up try left over the speed-up line, labelled slow with that reason, else omit the line; one line per test

## Step 2 — {step name}
...

## Key Decisions
- The step blocks' Decisions lines, gathered — the choices a reviewer or a later reader needs

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | {skill-name}, tdd | |
| 2 | None | wiring-only step (plan: TDD no) |
| 3 | None — deviation: {reason} | mapped skill not invoked; reason documented |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| {title} | low/medium/high | reviewer/architect | {one-line evidence} | {note} |

## KB Changes
| Entry | Action | What changed |
|-------|--------|-------------|
| `docs/kb/{area}/{entry}.md` | NEW/UPDATE | {brief description} |

## Unfinished Tests
- Step {n}: {files | whole unit run} — cut at {limit} s

## Deviations from Plan
- Steps done differently, with reasons

*Status: COMPLETE — developer, {date}*
```

**One append per step.** A step block is written **once**, when that step completes (under a
`per-step` commit strategy, immediately before that step's commit). Never re-open the file to revise
an earlier block, and never spread one step's record across several edits — the churn this format
exists to remove was a measured 64 reads and 61 edits across 10 steps, nearly all of it spent
re-finding fixed per-topic sections to append a line to each. **Two writes amend that timing, and
nothing else does:** a step that meets a bug this developer did not cause writes its block early,
with a `Bug found:` line, before it hands back (the step is still in progress — it finishes that same
block when it resumes, and a fresh developer finishes it from the partial block); and a solo writes
its own block, any carry-over rows and, where the tail lacks one, their table, during the run (§ Solo Fixes).

**Flags the close gate reads.** Two flags are greped out of this file by name, so they must appear
here verbatim, not paraphrased: an **`M3 re-mine`** flag (a registry rule the change falsified whose
tests could not be updated in the same pass) and a **`Distill owed: {module} — {date}`** flag (a
module whose concept digest the change made stale). Write each on the `Deviations:` line of the step
that caused it, or in a tail section when it surfaces later. Both block the run's close until
discharged — the rules are the Registry guardrail's and the close gate's; this format only fixes
where they live.

**A step close cut at its limit.** Where the repo declares a full suite, a step close whose record
reads `reason: "timeout"` is not finished rather than red: the step block carries one `Unfinished:`
line naming what was cut — the named files, or the whole unit run — and the limit it was cut at. On
the light lane a cut acceptance run (`--files {the acceptance test file}`) writes its own `Unfinished:`
line, naming that run, even when the step close passed. At
the end of the run the developer gathers every such line — an acceptance run's and a solo block's included — into
`## Unfinished Tests`, the way Key Decisions is gathered, without reopening an earlier block; the section is absent when nothing was
cut. Its readers take each entry as not verified at the step — the complete run covers it.

**A fix round has no step of its own.** When the reviewer returns findings, every step block is
already closed and there is no current step to append to. Add one `## Fix Round N` block in the step
region, after the last step block, with the same four fields (plus an `Unfinished:` line when its close was cut, and a `Slow kept:` line per test the round kept slow) — `Files:` names what the fixes touched,
`Deviations:` records any finding you did not act on and why. Never rewrite the original step blocks
to make them look as though they had been right the first time: the sequence of what was built and
what was corrected is what a resume and a re-review both read. A bug met in a fix round that this
developer did not cause goes on a `Bug found:` line in that round's block, never in a closed step
block. A round dispatched as `Hand-up {n}` — the fix round that carries an architect's ruling on a
solo hand-up (a solo's `too big`, or any other case the coordinator forwards to the architect that
way), outside the fix-round cap — is headed `## Fix Round Hand-up {n}` in place of the
cycle number.

**Required sections.** Every implementation.md carries a `## Step N` block for **every** plan step,
plus `## Key Decisions`, **`## Skills Used`** (a per-step table — never omit it), `## Deviations from
Plan`, and the completion footer. `## Skills Used` is a **required section**, not optional: the
architect's done-check treats its **absence as a hard Fail** (it scores skill conformance against
`.claude/audit/skill-invocations.log` and uses this section as the corroborating cross-check), so a
missing section leaves the gate nothing to cross-check and fails structurally. `## Carry-Over
Findings`, `## KB Changes` and `## Unfinished Tests` are included when they have content.

The tail sections are **end-of-run summaries**, written once when the implementation is done — they
gather what the step blocks already recorded, for a reader who wants the whole run at a glance —
`## Carry-Over Findings` also takes every solo block's `Left:` items (§ Solo Fixes). The
two per-file inventory sections this format used to require at the end (Files Created / Files
Modified) are **dropped**: each step block's `Files:` line already carries that, in plan order, next
to the work that caused it.

**Completion footer.** The final line above is written exactly once — when the implementation
round is genuinely done (all steps, verification run). While work is in progress the file ends
without it. The footer is how the artifact **self-certifies**: the team lead trusts the footer,
not the completion message, so a stranded message costs nothing (ADR-17).

## Solo Fixes

A solo spawned inside a feature's run — for a red complete run, for a bug a developer met and did
not cause, or after the closing commit for the timed-out tests the change did not touch — records its work here, never in a step block. The section sits **immediately after the
head, before the first step block**: a developer's step blocks are appended at the end of the file,
so they never land after it, mid-build or at close. The first solo creates the section; each later
solo inserts its block inside it, after the last solo block. Solo appends its own model id to the
`**Model:**` stamp, as any writer of the file does.

```
## Solo Fixes

### Solo fix {n} — {date}
**Failure:** the failing test or record, the developer's `Bug found:` line, or the timed-out tests, as given
**Cause:** what made it fail
**Approach:** what it will change — written before the first edit
**Files:** `full/path/to/File` — what changed; one line per file
**Class checked:** other places with the same flaw — fixed, or listed
**Verify:** each fast call it ran, as run — and its outcome: green | red | unfinished
**Unfinished:** {files | whole unit run} — cut at {limit} s; only when that call was cut at its limit
**Slow kept:** {test} — {reason}; only for a test its one speed-up try left over the speed-up line, one line per test
**Left:** each listed instance or follow-up, one per line — or `None`
**Verdict:** fixed | too big | not caused here — {for `not caused here`, the act that would clear it}
```

**The verdicts.** `fixed` — it made the change its approach named. The fast calls' outcomes are
recorded apart, on `Verify:`, and the coordinator routes on them (`team-lead.md` § Message Handoffs (you are the hub)):
mid-build, green stands, red resumes the solo once and then goes to the architect, unfinished is left
to the complete run. On the handover ladder the solo's proof is each failed test file run by name plus its
tied call: every failure green by name ends the red with no second complete run, a red proof is the
ladder's next attempt — at most three, then the architect — and only a failure that cannot be named, or a
by-name run cut at its limit, waits for another complete run. `too big` — the fix is outside
solo's size rule, or would change something the plan or the spec decided; nothing is left half-done,
and a `questions.md` entry to the architect points at the block. `not caused here` — the failure is
real but nothing in this feature's change caused it (a default branch that moved, the environment, a
test that fails only sometimes for a reason outside the feature), and the block names the act that
would clear it.

**Written during the run.** A solo block is written by its solo before the hand-back — the
`Approach:` line before the first edit. A solo resumed with a new record (a red on its own fast call,
or a red proof on the ladder — its next attempt) keeps its `{n}`: it appends an `Attempt {k} — {date}` part, `{k}` the attempt's number, to its own block
— that bold line, then the fields from `Failure:` to `Verdict:` for the new record — and hands back
with the same `{n}`; the block's last `Verdict:` is the one that stands. Its `Left:` items reach
`## Carry-Over Findings` so the readers that must disposition that table see them: where the table
already exists, solo appends one row per item itself; where the tail is already written without it (a
red at handover or at close after the last developer finished), solo adds the table to the tail, before
the completion footer, holding its own rows; otherwise the developer who writes the tail gathers every
`Left:` line into it, as `Unfinished:` lines are gathered. Either way the row's
Note cell opens `solo fix {n} —`, which names its source.

## Anti-patterns

- **"Updated file" without explaining what changed.** Every `Files:` entry states what changed and why — not just that the file was touched.
- **Omitting deviation reasons.** Every deviation needs a reason. "Plan said X, did Y" is incomplete — add why Y was better or necessary.
- **Listing files without linking to plan steps.** A file belongs to the step block whose work touched it. If a file was touched that no plan step required, say why on that block's `Deviations:` line.
- **Writing all at once at the end.** Update implementation.md after each step completes — not all at the end. Enables resume-from-timeout and gives architect incremental visibility.
- **Re-opening the file to revise a finished block.** A completed step's block is done. Something learned later about an earlier step goes in the current step's block or a tail section — reworking old blocks is exactly the read-then-edit churn the step-block shape removes.
- **Empty or missing Skills Used section.** Every step gets a row — the skill(s) actually invoked, or `None` with the plan's sanction (`TDD: no`, `Skill: None`; on a light-format plan, the step line's `None` and no `TDD: yes`) or a documented deviation reason. The architect's done-check verifies this table against the plan's Skill Mapping — a light-format plan's step lines, where it has no table; a mapped skill silently skipped is a Fail finding.
- **Missing operator-owed callout.** When a step fired a plan-sanctioned fallback (live connection/credential unavailable at build time), its step block carries an explicit `OPERATOR ACTION REQUIRED` note + the helper script path — the fallback is a valid deviation only with that documentation.

## Consumers

| Agent | What they read | Impact of stale data |
|-------|---------------|---------------------|
| Architect | The step blocks (files, decisions, deviations, and `Rules:` for the report-only rule count) plus `## Skills Used` against the plan's Skill Mapping; `## Unfinished Tests` as not verified at the step — the complete run covers it; `## Solo Fixes` as work done outside the plan's steps, never a step | Done check misses gaps or falsely fails |
| Reviewer | All sections, especially `## Carry-Over Findings`; `## Solo Fixes` as code in the diff no step block names; `## Unfinished Tests` as not verified at the step — the complete run covers it | Reviewer misses developer-flagged risks, reads a cut step as verified, or leaves a solo fix unread |
| Developer (resume) | The last `## Step N` block, to find where work stopped | Duplicate work or missed steps on resume |
| Developer (fresh fix round or hand-up) | The round's fix list, `## Solo Fixes` for what a solo already found and changed, and the step blocks | Re-investigates a bug a solo already diagnosed, or undoes its fix |
