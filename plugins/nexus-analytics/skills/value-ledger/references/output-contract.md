# Value Ledger — Output Contract

The single owner of the ledger's on-disk shape. Every claim the consuming project records lives at
`docs/value-ledger/` as **one index file plus one detail doc per claim**, and follows the grammar
below. Worked examples use invented domains (logistics, subscriptions, sensor telemetry) purely to
show the *shape* — a real project fills them with its own claims.

## Where it lives

```
docs/value-ledger/
  index.md                     the one-line-per-claim index (rendered from the detail docs)
  claims/
    VL-001-<short-slug>.md      one detail doc per claim
    VL-002-<short-slug>.md
    ...
```

`VL-NNN` ids are assigned in sequence and never reused. A claim's file is never deleted; a withdrawn
or refuted claim keeps its file and flips its status (see *Never-delete*, below).

## The one-line index

`index.md` is an at-a-glance table, one row per claim, rendered from the detail docs — it is a view,
not a second source of truth. Its columns:

| id | claim | estimate | conf | status | last_verified |
|----|-------|----------|------|--------|---------------|
| VL-001 | On-time delivery lifts renewal revenue | +0.4% renewed revenue per +1pp on-time | 55% | validating | 2026-05-02 |
| VL-002 | Failed handoffs lose shipments each month | ~350 shipments / month (probe-sized, pending) | 30% | proposed | — |

`last_verified` is blank (`—`) for a `proposed` claim whose evidence has not yet re-executed.

## The per-claim detail doc

Each `claims/VL-NNN-*.md` opens with YAML frontmatter — the machine-readable summary — followed by a
prose body carrying the full provenance and the dated changelog.

### Frontmatter (the machine-readable summary)

```yaml
---
id: VL-001                       # sequential, never reused
slug: on-time-delivery-lifts-renewal-revenue
claim: On-time delivery lifts renewal revenue    # the kpi or claim this proposal is about
estimate: "+0.4% renewed revenue per +1pp on-time delivery"   # the magnitude, WITH its per-unit basis
confidence: 0.55                 # 0..1 — how much we trust the estimate today
evidence:
  source: renewals fact joined to the delivery-events fact   # where the number comes from
  query: distinct renewed accounts over accounts whose shipments cleared on-time, per month   # the query...
  # ...OR, when the evidence is a fixed set of rows rather than a re-runnable query:
  # rows: 12 cohort rows from the Q1 controlled-hub pilot export
status: validating               # proposed | validating | validated | invalidated | retired
last_verified: 2026-05-02        # the date the evidence last re-executed; omitted while proposed
---
```

Field rules:

- **`estimate` always carries its per-unit basis.** "+0.4% renewed revenue" alone is not a claim;
  "+0.4% renewed revenue **per +1pp on-time delivery**" is. A bare percentage or count with no unit
  is malformed.
- **`evidence` carries `source` plus exactly one of `query` or `rows`.** `query` is the re-runnable
  query that produces the number (the preferred, re-executable form); `rows` names a fixed set of
  rows when the evidence is a captured export that cannot be re-run. An evidence block with neither is
  malformed — a claim with no way to re-check its number does not belong in the ledger.
- **`confidence` is a 0..1 scalar**, the analyst's current trust in the estimate. It moves with the
  changelog, never silently.
- **`status` is one of the five** in the lifecycle; no other value is legal.
- **`last_verified` is present once evidence has re-executed** and is omitted (or `—` in the index)
  while the claim is `proposed`.

### Body

The body carries what the frontmatter cannot:

```markdown
# VL-001 — On-time delivery lifts renewal revenue

## The claim
What the value is, the causal story, and the boundary conditions — the cohort and window it holds
for, and where it is not expected to hold.

## Estimate and derivation
How the magnitude was derived — from which source, query or coefficient, over which window and
cohort. State the per-unit basis and every assumption. Be explicit about whether the number is
grounded in local re-executed data or is still shape-attested only.

## Evidence
The `source` and `query`/`rows` from the frontmatter, spelled out — the exact join, filter, and grain
that produce the number, so a later reader re-runs the same thing.

## Validation / invalidation
- **Minimum validation path:** the cheapest way to CONFIRM the estimate.
- **Minimum invalidation path:** the cheapest way to REFUTE it.

## Changelog
- 2026-04-18 — created; status proposed; estimate shape-attested on the Q1 controlled-hub pilot
  export (rows), no live re-execution yet; confidence 0.30.
- 2026-05-02 — evidence re-executed against the renewals fact for the full quarter; estimate held at
  +0.4%; status proposed -> validating; confidence 0.30 -> 0.55; last_verified 2026-05-02.
```

## Append-only changelog grammar (the load-bearing rule)

Every status move and every field change is recorded as a **new dated changelog line** appended to
the body's `## Changelog` — the prior lines are never edited or removed. One line per write, each
naming the date, what changed, and why:

```
YYYY-MM-DD — <what moved> (status A -> B; confidence X -> Y); <the evidence or reason>.
```

The frontmatter always reflects the *current* state; the changelog is the append-only history of how
it got there. Re-rendering `index.md` from the detail docs is idempotent — running it against
unchanged docs produces byte-identical output.

## Never-delete and the disposition flips

A claim's file is **never deleted**. The status is the disposition:

- A refuted estimate flips `status` to **`invalidated`** — the refutation stays on the record with the
  changelog line that recorded it.
- A withdrawn or superseded claim flips `status` to **`retired`** (the never-delete terminal). A
  superseding claim is a *new* `VL-NNN` doc whose changelog cites the retired id; the retired doc
  stays in place.

These are this ledger's mapping onto the shared registry grammar — the never-delete, append-only, and
idempotent-refresh invariants are cited (not restated) from the nexus mine-family core in the parent
`SKILL.md`.

## The pending-live-validation shape (worked example)

The recurring case the ledger exists for: a query is resolved and grounded, but there is no live
surface to run it, so the number is shape-attested only.

```yaml
---
id: VL-002
slug: failed-handoffs-lose-shipments
claim: Failed handoffs lose shipments each month
estimate: "~350 shipments/month lost to failed handoffs (probe-sized, pending full validation)"
confidence: 0.30
evidence:
  source: handoff-events fact — started vs completed transitions
  rows: a 2-day, single-hub probe (started 6,240 vs completed 5,890 => ~350 never completed)
status: proposed
---
```

- The magnitude is recorded with the **exact probe window and cohort it came from** (a two-day,
  single-hub probe), and the estimate string says *probe-sized, pending* in plain words — it is never
  presented as the monthly, all-hub answer it is *about*. Generalizing the narrow probe to the broad
  population would be the managed-cohort-is-not-population error the analyst craft warns against.
- `last_verified` is absent — nothing re-executed against the population the claim concerns.
- The claim stays `proposed` until the query re-runs over the full window and cohort; only then does
  it move to `validating` and earn a `last_verified` date. Until it validates, the penalty-only
  doctrine governs any use of its number.
