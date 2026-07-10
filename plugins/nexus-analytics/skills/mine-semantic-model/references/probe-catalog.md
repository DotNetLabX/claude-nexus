# Probe Catalog

Seven probe classes (Phase 2), each a self-contained, parameterized `.sql` template under
`probes/`, executed only through a project-provided runner (never a bare driver call — the runner
is the BR1/BR12 gatekeeper; see "The runner contract" below).

| File | Class | Question it answers |
|---|---|---|
| `probes/cardinality.sql` | cardinality | How many distinct values does this column have, and how many rows/nulls? |
| `probes/null-rate.sql` | null rate | What share of rows have a null in this column? |
| `probes/value-distribution.sql` | value distribution (low-cardinality only) | For a flag/enum column, what values occur and how often — "what does `status = 9` mean" evidence. |
| `probes/orphan-fk-fanout.sql` | orphan-FK rate + fan-out | Does every FK value resolve to a parent row, and what's the child-per-parent fan-out (informs join-guard cardinality)? |
| `probes/date-coverage.sql` | date coverage | `MIN`/`MAX` of a fact table's date column — also the run's data-vintage stamp (BR9). |
| `probes/cross-column-implication.sql` | cross-column implication | Do two flag-shaped columns imply each other consistently (e.g. `is_valid` vs `deleted_at`)? |
| `probes/usage-heat.sql` | usage heat (Audit mode) | Which tables are actually HOT — live scan/fetch/write activity from `pg_stat_user_tables` (catalog view, no table scan). Feeds the Audit tier attestation. Stats are since the last `pg_stat_reset()` — treat as relative heat, not absolute truth. |

## The preamble/postamble (BR1 — every file, verbatim)

```sql
BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '{{timeout_seconds}}s';

-- BODY START
{templated query}
-- BODY END

ROLLBACK;
```

The preamble/postamble is **static text in the file** — that is what makes a per-file grep
(`SET TRANSACTION READ ONLY` and `statement_timeout` both present, no statement-leading write
keyword) pass verbatim without the runner injecting anything. The runner does not trust the file's
transaction wrapper to actually run as written — it separately re-issues `SET TRANSACTION READ ONLY`
and `SET LOCAL statement_timeout` on its own connection before EXPLAIN/execute, so the floor is
real at runtime too, not just textually present in the file.

The `-- BODY START` / `-- BODY END` markers delimit exactly what the runner extracts, parameter-
substitutes, `EXPLAIN`s, and (if it passes the ceiling) executes. Everything outside the markers
(the `BEGIN`/`SET`/`ROLLBACK` lines) exists for the static grep and for a human reading the file —
the runner's own transaction handling is authoritative at execution time.

## Parameters (per class)

| Param | Used by | Meaning |
|---|---|---|
| `{{schema}}` | all | Usually `public`. |
| `{{table}}` | cardinality, null-rate, value-distribution, date-coverage, cross-column-implication | Target table. |
| `{{column}}` | cardinality, null-rate, value-distribution | Target column. |
| `{{column_a}}` / `{{column_b}}` | cross-column-implication | The two columns being cross-checked. |
| `{{date_column}}` | date-coverage | The date/timestamp column. |
| `{{child_table}}` / `{{fk_column}}` / `{{parent_table}}` / `{{parent_key}}` | orphan-fk-fanout | The FK relationship under test. |
| `{{timeout_seconds}}` | all | Defaults to 60s if not supplied. |
| `{{bound_predicate}}` | all | Defaults to `TRUE`. **Mandatory bounded-SHAPE value** (see "Large table policy" below) when the body references one of the profile's flagged large tables — the runner refuses a tautology, an empty value, or a predicate that doesn't reference the expected bounding columns (BR12c). |

## The EXPLAIN cost gate (BR12)

Every probe, being an aggregate (COUNT/GROUP BY/anti-join), goes through `EXPLAIN (FORMAT JSON)`
before execution. `LIMIT` bounds output rows, never scan cost, so it is not a substitute for this
gate (BR12a). The ceiling is a project-runner setting — provisional/uncalibrated by default until
an operator calibrates it against a real EXPLAIN sample set from the target datasource (see the
profile's runner invocation, item 10). The runner takes the ceiling as a parameter, defaulting to
its configured value — never hardcoded past that default, and overridable for a demonstration run
with an artificially low ceiling (used to prove the refusal path without needing a real runaway
query).

An unreadable `EXPLAIN` plan (parse failure, missing cost field) is treated as the worst case —
fail-closed, never optimistic.

## Large table policy (BR12c)

Tables named in the profile's large-table policy rows (item 9) get a mandatory bound-predicate
SHAPE check, not merely a non-empty/non-`TRUE` check — a bare tautology (`1=1`, `TRUE`, a
self-comparison, or a real clause defeated by an `OR TRUE`-style disjunction) must never pass by
construction. Each policy row states the table and its required bound-predicate SHAPE; the runner
enforces the SHAPE positively (a whitelist: the predicate must match a sanctioned form) rather than
merely failing to equal a known-bad string — a whitelist is the only construction a novel bypass
shape cannot defeat.

Two shape families recur across projects (see the profile's worked example for the concrete rows):

- **Date-window / IDs-first-CTE shape** — a direct date-window comparison on the table's own date
  column, OR an `IN (SELECT id FROM {header-table} WHERE date ...)` header-IDs-first CTE.
  Appropriate for a large detail/fact table that hangs off a smaller header table by a single ID
  join.
- **Stricter multi-filter shape** — for an especially large or unindexed table, a single date
  window is not enough: the policy row may require an exact secondary filter (e.g. an event-type
  filter, a tenant/partition-key filter) present TOGETHER with the date window, all parts
  mandatory. Reserve this stricter shape for the extreme end of the profile's large-table list.

**What the shape check is and isn't:** a regex-based mechanical check, not a SQL parser — best
effort, not a semantic guarantee. On the real surface, the EXPLAIN cost gate (above) remains the
authoritative backstop this shape check cannot replace; on a dry-run/seed path there is typically
no such backstop (small seed tables never approach the cost ceiling regardless of predicate), which
is exactly why a vacuous shape check is a real gap, not a cosmetic one.

## The runner contract (what a compliant project runner MUST do)

Every probe execution goes through a project-provided runner (never a bare driver call). Resolve
the DSN per the profile's datasource surface (item 7) — never hardcode it, never commit it. A
compliant runner MUST refuse:

(a) **A DSN not matching the profile's read-only role** (item 7) — and the profile's forbidden
    surfaces (e.g. a superuser/dev-bypass role) unconditionally, regardless of any flag.
(b) **Execution when the EXPLAIN cost exceeds the ceiling, or the plan is unreadable** —
    fail-closed; an unparseable plan is treated as ceiling-exceeded, never as passing.
(c) **A large-table probe whose `bound_predicate` fails the profile row's shape** (see "Large table
    policy" above) — a tautology or a self-comparison is refused even when it also contains a
    real-looking token elsewhere in the predicate.
(d) **Non-dry-run flags issued against a dry-run surface** — the profile's optional dry-run role
    (item 8) never executes without the explicit dry-run acknowledgment.

And MUST **log every invocation** — pass or refused — to a cost log (BR12), so the run report's
per-probe cost log can be reconstructed from it.

## Running a probe

Invocation is project-specific — the profile's item 10 states the exact command and attests that
the runner implements this contract. Shape (illustrative, not literal):

```
{the profile's runner invocation} {probe file} \
    --param schema=... --param table=... --param column=... \
    --param bound_predicate="..." \
    --timeout 60
```

Add the profile's dry-run flag when the DSN points at a non-real-surface role (any role other than
the profile's read-only role requires this explicit acknowledgment). Add a ceiling override to test
the refusal path without needing a real runaway query.

Every invocation appends one line to the runner's cost log (pass or refused) — this is the source
for the run report's per-probe cost log (BR12).
