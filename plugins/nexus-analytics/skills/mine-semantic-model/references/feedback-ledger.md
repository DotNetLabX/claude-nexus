# Model-Feedback Ledger

Governs the profile's model-feedback ledger (item 11, proposed default
`docs/model-feedback/{area}.md`) — the consumption-side companion to the provenance ledger (which
records *where a fact came from*; this ledger records *usage signals observed after the fact*: a
measure returning nonsense, a join-guard firing unexpectedly, a user correction, an operator's own
doubt). It is what makes the semantic model improve **between** deliberate `mine-semantic-model`
runs instead of only at the moment someone runs the skill.

## Placement (BR-A)

The profile's item-11 location (proposed default `docs/model-feedback/{area}.md`) — a sibling of
the run-report directory (item 4), **never** under the bundle root or any runtime-served grounding
root (the same logic as BR9's run-report placement: this ledger carries open, unresolved
observations that must not become runtime grounding material via whatever root the project serves
recursively). One file per model area, area names matching the run-scoping areas used by the
run-report directory (e.g. `Reports`, `Tasks`, `analytics-audit`).

## Entry shape

One `##` block per distinct observation, written at the moment of observation (by any consuming
agent skill or a human — see Open append policy below):

```markdown
## {construct id(s)} — {short title}

**Expected (per the model):** {what the current bundle/measure/join-guard/dimension claims}
**Observed:** {what actually happened — aggregate-shaped only (value + count/share/boundary
stamps), never a per-row/per-client identifier — BR13 applies here exactly as it does to run
reports}
**Evidence:** {a pointer — a run report path, a verified-query id, an answer-review session doc, a
specific query result — never inline raw row data}
**Date / observer:** {YYYY-MM-DD, who/what filed it — an agent skill name or a human}
**Status:** open
```

## Recurrence rule (strengthen, don't duplicate)

If the same construct/observation recurs, **append a provenance tag to the existing `##` block** —
never open a second block for the same underlying observation. A recurrence tag:

```markdown
**Recurred:** {YYYY-MM-DD} — {one-line: same symptom, new evidence pointer, or "still reproduces"}
```

This keeps one entry's Status/disposition history legible in one place instead of scattered
duplicate blocks that would each need independent tracking.

## Closure rule (BR-D: never delete)

Entries and their tags are **append-only**. A block closes only when a `mine-semantic-model` run
actually consumes it (Phase 1/3, or Audit's leg 0 — `SKILL.md`) and appends a resolution line —
never by deleting or editing the original observation text:

```markdown
**Resolved:** {YYYY-MM-DD}, {run report path} — disposition: {probed | grounded | asked} —
{one-line outcome: what changed in the bundle/ledger, or "confirmed correct, no model change"}
**Status:** {probed | grounded | asked}
```

An entry consumed but genuinely still unresolved (the run looked, found nothing conclusive) stays
open — the run report's feedback-disposition section records it as `still-open` for that run
without a resolution append; the ledger entry itself is untouched until a future run actually
closes it.

## Disposition vocabulary (closed set — mirrors the run-report's `## Feedback dispositions`)

Every open entry a run consumes gets exactly one disposition, recorded in that run's report
(`references/output-contract.md`):

- **`probed`** — a fresh data probe ran against the observation and produced a conclusive answer.
- **`grounded`** — the profile's KB hub(s) already had the answer (Phase 3 Ground, BR3); no new
  probe was needed.
- **`asked`** — the observation surfaced a genuine fork; it went to interview and the user
  answered.
- **`still-open`** — the run looked at the entry (it is never silently skipped) but could not
  reach a conclusive disposition this run; it remains open for the next one.

## Area-file map

One file per model area at the profile's item-11 location (proposed default
`docs/model-feedback/{area}.md`). Area names match the scoping already used by the run-report
directory (e.g. `docs/model-feedback/analytics.md`, `docs/model-feedback/tasks.md`) — a run over an
area reads (and, on closure, writes to) exactly that area's file. A construct that spans areas is
filed under the area the observation was made in, not duplicated across files.

## Open append policy

Any consuming agent skill (this skill's own runs; a future ask session that notices a construct
behaving oddly; any other agent working in this repo) **and** humans may append an observation. The
junk guard is not gatekeeping who can write — it is the **mandatory per-run disposition** (BR-C):
every open entry in an area a Refresh/Audit run touches must get a disposition in that run's report,
so noise gets triaged on a predictable cadence rather than accumulating unread.
