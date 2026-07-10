---
name: data-investigation
description: Investigate what a column or flag actually means before trusting it in a measure, filter, or join-guard — never guess between near-measures or assume a name is self-explanatory. Delegates to the sibling mine-semantic-model skill's read-only investigation posture. Use whenever a query needs a column whose meaning the semantic model doesn't already resolve, or a business flag's semantics are unclear.
user-invocable: true
---

# Data Investigation

## When to invoke this skill

The semantic-model-query skill's resolution ladder resolves grain, metric, and dimension through
`docs/semantic-model/profile.md` — but a ladder lookup can miss: a column genuinely unmodeled yet,
a flag whose stated meaning doesn't match what the data shows, or a near-measure ambiguity (for
example, two columns that both sound like "is this valid" but mean different things). Any of these
is an investigation, never a guess.

## Delegate to the sibling mine

Invoke the sibling `mine-semantic-model` skill (same plugin — plain name, never a cross-plugin
file path) in its **read-only investigation posture**: run it against the profile's declared
read-only role and runner (never the profile's forbidden surface), carrying the BR1/BR12 rails —
read-only always, and every probe carries its load-floor preamble. This is exactly the mine's own
Audit/Refresh discipline applied to one column or flag instead of a whole area: ground the
hypothesis in a real probe or an existing KB citation before trusting it in anything downstream.

## Routing a finding

- **The column/flag means what the model already says** — the investigation confirms an existing
  construct; nothing changes, cite the confirmation and proceed with the query.
- **The column/flag means something the model doesn't yet capture, or capture correctly** — this is
  a model-changing finding. It does NOT get patched inline here; it routes to
  `mine-semantic-model`'s own proper run mode (Bootstrap for an unmodeled area, Refresh for a
  drifted one, Audit for a claim under active dispute) so the change goes through that skill's
  interview/provenance/validation gate — never a silent, ungoverned edit to
  `docs/semantic-model/profile.md` or the bundle it maps to.
- **The investigation is inconclusive** — say so to the user; do not present a guess as a resolved
  answer, and do not block indefinitely — surface what was checked and what remains unknown.

## What this skill does NOT do

- Query the live datasource directly, outside the mine's read-only runner and rails — that
  channel exists precisely so an investigation never becomes an unguarded write-capable
  connection.
- Patch a measure, dimension, or filter definition inline — every model change goes through
  `mine-semantic-model`'s own governed modes.
- Substitute for the `semantic-model-query` skill's resolution ladder on a routine lookup — this
  skill is for the cases the ladder cannot already resolve, not a first stop for every query.

**Consumed by:** the `data-analyst` agent, when the resolution ladder can't resolve a column or
flag on its own.

Discovered a defect in the investigation posture or the routing rules while using this skill? Log
it — inside the SDD pipeline, append to that feature's `docs/specs/{slug}/delivery/lessons.md`
under `## Developer Lessons` or `## Skill Gaps`; running standalone, note it for the project's own
lessons flow. Never silently work around a gap.

## References

- `docs/semantic-model/profile.md` — the model locus this investigation grounds itself against and,
  when a finding is confirmed, ultimately updates through the mine's own governed run.
