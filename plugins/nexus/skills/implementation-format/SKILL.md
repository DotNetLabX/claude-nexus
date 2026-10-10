---
name: implementation-format
description: Format spec for docs/specs/{slug}/delivery/implementation.md — step blocks, end-of-run summaries, anti-patterns, consumers. Load when writing or reviewing an implementation file.
---

# Implementation File Format

Written by developer **as each step completes**: `docs/specs/{slug}/delivery/implementation.md`.

**Section map (targeting index).** The file is a fixed head, a variable step region, and a fixed
tail (ADR-22 Extended):

| Part | Headings | Targeted by |
|------|----------|-------------|
| Head | the title line, `**Model:**` | read the first few lines |
| Steps (variable) | `## Step N — {step name}`, one per plan step, in plan order | `grep '^## Step '` |
| Tail (fixed) | `## Key Decisions`, `## Skills Used`, `## Carry-Over Findings`, `## KB Changes`, `## Deviations from Plan`, `## Self-Review` (Fast lane only), the completion footer | `grep '^## '` — the step blocks match too; read past them |

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

## Deviations from Plan
- Steps done differently, with reasons

*Status: COMPLETE — developer, {date}*
```

**One append per step.** A step block is written **once**, when that step completes (under a
`per-step` commit strategy, immediately before that step's commit). Never re-open the file to revise
an earlier block, and never spread one step's record across several edits — the churn this format
exists to remove was a measured 64 reads and 61 edits across 10 steps, nearly all of it spent
re-finding fixed per-topic sections to append a line to each.

**Flags the close gate reads.** Two flags are greped out of this file by name, so they must appear
here verbatim, not paraphrased: an **`M3 re-mine`** flag (a registry rule the change falsified whose
tests could not be updated in the same pass) and a **`Distill owed: {module} — {date}`** flag (a
module whose concept digest the change made stale). Write each on the `Deviations:` line of the step
that caused it, or in a tail section when it surfaces later. Both block the run's close until
discharged — the rules are the Registry guardrail's and the close gate's; this format only fixes
where they live.

**A fix round has no step of its own.** When the reviewer returns findings, every step block is
already closed and there is no current step to append to. Add one `## Fix Round N` block in the step
region, after the last step block, with the same four fields — `Files:` names what the fixes touched,
`Deviations:` records any finding you did not act on and why. Never rewrite the original step blocks
to make them look as though they had been right the first time: the sequence of what was built and
what was corrected is what a resume and a re-review both read.

**Required sections.** Every implementation.md carries a `## Step N` block for **every** plan step,
plus `## Key Decisions`, **`## Skills Used`** (a per-step table — never omit it), `## Deviations from
Plan`, and the completion footer. `## Skills Used` is a **required section**, not optional: the
architect's done-check treats its **absence as a hard Fail** (it scores skill conformance against
`.claude/audit/skill-invocations.log` and uses this section as the corroborating cross-check), so a
missing section leaves the gate nothing to cross-check and fails structurally. `## Carry-Over
Findings` and `## KB Changes` are included when they have content.

The tail sections are **end-of-run summaries**, written once when the implementation is done — they
gather what the step blocks already recorded, for a reader who wants the whole run at a glance. The
two per-file inventory sections this format used to require at the end (Files Created / Files
Modified) are **dropped**: each step block's `Files:` line already carries that, in plan order, next
to the work that caused it.

**Completion footer.** The final line above is written exactly once — when the implementation
round is genuinely done (all steps, verification run). While work is in progress the file ends
without it. The footer is how the artifact **self-certifies**: the team lead trusts the footer,
not the completion message, so a stranded message costs nothing (ADR-17).

## Anti-patterns

- **"Updated file" without explaining what changed.** Every `Files:` entry states what changed and why — not just that the file was touched.
- **Omitting deviation reasons.** Every deviation needs a reason. "Plan said X, did Y" is incomplete — add why Y was better or necessary.
- **Listing files without linking to plan steps.** A file belongs to the step block whose work touched it. If a file was touched that no plan step required, say why on that block's `Deviations:` line.
- **Writing all at once at the end.** Update implementation.md after each step completes — not all at the end. Enables resume-from-timeout and gives architect incremental visibility.
- **Re-opening the file to revise a finished block.** A completed step's block is done. Something learned later about an earlier step goes in the current step's block or a tail section — reworking old blocks is exactly the read-then-edit churn the step-block shape removes.
- **Empty or missing Skills Used section.** Every step gets a row — the skill(s) actually invoked, or `None` with the plan's sanction (`TDD: no`, `Skill: None`) or a documented deviation reason. The architect's done-check verifies this table against the plan's Skill Mapping; a mapped skill silently skipped is a Fail finding.
- **Missing operator-owed callout.** When a step fired a plan-sanctioned fallback (live connection/credential unavailable at build time), its step block carries an explicit `OPERATOR ACTION REQUIRED` note + the helper script path — the fallback is a valid deviation only with that documentation.

## Consumers

| Agent | What they read | Impact of stale data |
|-------|---------------|---------------------|
| Architect | The step blocks (files, decisions, deviations, and `Rules:` for the report-only rule count) plus `## Skills Used` against the plan's Skill Mapping | Done check misses gaps or falsely fails |
| Reviewer | All sections, especially `## Carry-Over Findings` | Reviewer misses developer-flagged risks |
| Developer (resume) | The last `## Step N` block, to find where work stopped | Duplicate work or missed steps on resume |
