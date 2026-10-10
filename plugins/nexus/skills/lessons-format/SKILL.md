---
name: lessons-format
description: Format spec for docs/specs/{slug}/delivery/lessons.md — per-role headings plus improvement proposals. Load before any agent finishes its work.
---

# Lessons File Format

All pipeline agents append under their own heading: `docs/specs/{slug}/delivery/lessons.md`. The PO writes lessons during spec shaping (before the delivery/ folder exists) — create the folder and lessons file if needed.

**Section map (targeting index).** `lessons.md`'s fixed **per-role** top-level headings — the set agents target for a section read (ADR-22 Extended): `## PO Lessons`, `## Architect Lessons`, `## Developer Lessons`, `## Reviewer Lessons`, `## Solo Lessons`, `## Skill Gaps`. Grep `^##` for live line numbers, then `Read` with `offset/limit` around your role's heading rather than the whole file. **Target the role heading only** — the `### Improvement Proposal` sub-heading repeats under multiple roles, so (per ADR-22's duplicate-heading fallback) it is not a targetable anchor; widen to the enclosing role section.

**Capture bar.** An item earns its line by being **reusable** — `lessons.md` is an input to the learner, not a diary. Run each candidate past this bar before appending it.
- **Write it down when** — the user had to intervene or correct you; a review caught something an agent should have known about this codebase; understanding one thing cost several files or a wrong turn; the same clarification was typed twice; a gate, skill, or rule fired wrongly or not at all.
- **Do NOT add** — anything derivable from the code itself, or already written down elsewhere: Only add items not already in CLAUDE.md, convention files, skills, or agent files. Nor a one-off incident with no reuse beyond this run; nor step-by-step narration of what you did (that is `implementation.md`'s job).
- **Propose proactively** — when an item meets the bar mid-run, surface it in your handback then rather than saving it for the end-of-run sweep; the driver captures it. (Subagents still never write another role's section — the append-only rule below.)

```
# {Feature Name} — Lessons

## PO Lessons
- Spec gaps the critic caught
- Research that changed a decision
- Questions that should have been asked earlier or differently

## Architect Lessons
- Plan instructions that were ambiguous
- Architecture decisions needing documentation
- Skill gaps discovered

## Developer Lessons
- Patterns discovered not yet documented
- Inconsistencies found
- Steps missing from a skill

## Reviewer Lessons
- Review criteria that were unclear
- Recurring code quality issues
- Patterns that should become conventions

## Solo Lessons
- Patterns discovered not yet documented
- Deviations from conventions found
- Missing skills or conventions

## Skill Gaps
- Skills referenced in plan steps but not found
- Recurring patterns that should become skills
```

For a skill gap, add the fielded entry template below inside `## Skill Gaps` — the section that feeds
`improve-skills`, which had no field template until now:

```markdown
### {Suggested skill name}
- **Kind:** missing | ill-fitting
- **Searched for:** {what you needed a skill to do}
- **Why it would help:** {what it would cover; what you did instead}
- **References:** {file paths the pattern lives in / was extracted from}
- **Evidence:** [{slug}, ...]
```

**Field rationale.**
- `Kind` is `improve-skills`' first branch — a "skill fix" and a "skill gap" route to different homes
  (its `## Two Channels`). Carries forward the missing-vs-ill-fitting distinction.
- `References` is a structural dependency, not decoration: `improve-skills` step 1 checks those files
  still exist, and step 5 extracts the real pattern from them — never invents abstract instructions.
- `Evidence` is the provenance tag (below), extended to gap entries — a recurring gap **strengthens**
  one entry instead of spawning a twin.

For systemic issues that recur across features, append an improvement proposal inside the relevant heading:

```
### Improvement Proposal (optional, for systemic issues)
**Target:** {file path — agent file, skill, convention, or rule}
**Change:** {what to add/modify}
**Evidence:** {which features demonstrated this, with links}
**Priority:** {low/medium/high}
```

**Provenance & strengthen-don't-duplicate.** A lesson earns promotion by *recurring*, not by a single
sighting — so treat the improvement proposal's and skill-gap entry's `**Evidence:**` line as a
**provenance tag**: the set of runs/features the lesson has appeared in (e.g. `**Evidence:**
[adhoc-Foo, F5-Bar]`).
- **Maturity = provenance count.** The number of runs in the tag *is* the recurrence — it surfaces the
  2-occurrence promotion threshold (learner step 3) **in the lesson itself**, not re-derived from learner
  bookkeeping each pass.
- **Strengthen, don't duplicate.** When a lesson matching an existing entry recurs, **append the new run
  to that entry's provenance** — never add a near-identical twin. Promote only at the threshold; on a
  *contradicting* recurrence, revise the entry rather than appending a conflicting twin. Keeps
  `lessons.md` lean and the recurrence signal honest.

Update before `/compact` or `/clear`.

**Mandatory:** Every agent must write lessons before finishing its work. This is not optional — if you learned something (a gap, a pattern, a mistake, an ambiguity), write it down **when it clears the capture bar above**. If the lessons file doesn't exist yet, create it. If your heading already exists, append to it. No agent exits without writing lessons. When nothing you learned clears the bar, running the bar and saying so in your handback *is* the discharge — never pad your section with items the bar rejects to satisfy the letter of this rule. The close gate observes this: a `summary.md` write with no lessons write on record for the round is refused.

**Append-only per role (hard rule).** `lessons.md` is a shared artifact — so each
role touches **only its own `## {Role} Lessons` heading** (plus `## Skill Gaps`): append entries with
`Edit`, never rewrite the whole file with `Write`. Never modify the file header or another role's
section — a full-file write across a resume boundary has silently dropped another role's lessons
before. If your heading is missing, add it at the end; if the file is missing, create it with the
header and your heading only.

**Agents writing at the same time append through the script.** The done check runs beside the code
review and its second reader, so those checkers can append in the same minute, and a read-then-Edit
lets one save erase the other. They Write their text to a scratch file and run the plugin's
`lessons-append.js` (the invocation arrives at their spawn): it takes a lock, re-reads the file, and
appends under the role's heading — `--section "Skill Gaps"` for that heading. It never blocks: when
the lock cannot be taken it writes anyway. If the script cannot be found or run, or the scratch file
cannot be written, append with `Edit` — a lost lesson is acceptable, a stall is not. Every other agent keeps appending with `Edit`.
