---
name: semantic-model-query
description: Resolve a business question's grain, metrics, and dimensions through the project's semantic model before building any query — the resolution ladder — then apply the model's mandatory pre-query obligations (bad-reports exclusions, no-gold-tables shortcuts refused, large-table bound patterns honored). Use before constructing SQL or any data query, so results reconcile against the model instead of an improvised join or a guessed column.
user-invocable: true
---

# Semantic Model Query

## The resolution ladder

Every query resolves through three ordered lookups against the project's committed model contract
at `docs/semantic-model/profile.md` — never a schema guess, never an improvised join:

1. **`grain → table`** — the profile's construct-file map resolves the question's grain (the
   row-level unit: report, store-day, SKU-day, etc.) to the table or view that carries it at that
   grain.
2. **`metric → column`** — the requested metric resolves to a column whose existence is verified
   against the model before it is ever referenced in a query — no metric ships blind.
3. **`dimension → join`** — a requested dimension resolves to a join path via the model's declared
   relationships and join-guards; fan-trap, chasm-trap, and temporal-join hazards each carry their
   safe pattern in the model — never an ad-hoc join around a declared hazard.

Synonym matching (a user's word for a metric or dimension against the model's alias set) is
**case-insensitive** — "OSA" and "osa" resolve identically.

Both model flavors resolve through the same resolution ladder: the profile's construct-file map
may name either representation — a JSON bundle or a CSV trio (a grain-routing file, a
metric-dictionary file, and a dimension-dictionary file) — the ladder is representation-agnostic
and consumes whatever the profile maps. Never assume one flavor; always resolve through whatever
`docs/semantic-model/profile.md` actually declares.

## Mandatory-obligation pre-query check

Run this check before any query executes — never after a wrong number or a timeout surfaces the
gap:

- **Bad-reports-excluded class** — apply every profile-declared mandatory row-quality filter (for
  example: exclude invalid, low-quality, ignored-in-analytics, deleted, or internal-type rows) to
  every query touching a fact table the profile marks as needing it. Not configurable, never asked
  about — always on, and always named in the shipped answer (see the answer-qa skill).
- **No-gold-tables class** — refuse a forbidden aggregate shortcut. A pre-aggregated table the
  profile marks as unable to carry the mandatory row-quality filters (no per-row quality flags) is
  never used for an answer or export that needs those filters — only for the profile's declared
  exceptions (freshness or health checks). Do not take the gold-table shortcut just because it is
  faster; an answer built on it is not trustworthy.
- **Large-table bound patterns** — a query against a profile-declared large table honors that
  table's sanctioned bound pattern (for example: collect filtered ids in a CTE first, then join the
  detail table by id) instead of a raw, unbounded join that times out or scans the whole table.

A query that has not cleared all three checks is not ready to run.

## What this skill does NOT do

- Investigate what an unclear column or flag means — that's the sibling `data-investigation` skill;
  this skill resolves against what the model already declares, it doesn't discover new model facts.
- Check a shipped answer's presentation contract — that's the sibling `answer-qa` skill, run AFTER
  the query executes, not by this skill.
- Build or execute the query itself — this skill resolves grain/metric/dimension and clears the
  pre-query obligations; constructing and running the SQL (or whatever query surface the
  consuming project uses) is the caller's job.

**Consumed by:** the `data-analyst` agent, as its first stop before any query.

Discovered a defect in the resolution ladder or a missing obligation class while using this
skill? Log it — inside the SDD pipeline, append to that feature's
`docs/specs/{slug}/delivery/lessons.md` under `## Developer Lessons` or `## Skill Gaps`; running
standalone, note it for the project's own lessons flow. Never silently work around a gap.

## References

- `docs/semantic-model/profile.md` — the project's committed model contract and this skill's only
  source of truth. Never hardcode a table, column, or filter this skill can resolve through the
  profile instead. If the profile is missing, this skill has nothing to resolve against — route to
  whatever this project's model-build method is (do not query the live schema directly as a
  substitute).
