---
name: value-ledger
description: Record and refresh an analyst's value claims as a persistent ESTIMATED-to-MEASURED ledger in the consuming project — one appendable detail doc per claim, a five-status lifecycle, and a validation path — so every impact estimate that reaches a stakeholder carries provenance instead of living in throwaway prose. Use when an analyst ships a value or impact estimate that is not yet measured, when a pending claim needs a durable home until its query re-executes, or when refreshing an existing claim toward validated or invalidated.
user-invocable: true
---

# Value Ledger

## What this skill is

The **method** for turning an analyst's value claims into a persistent, provenance-backed record —
the ESTIMATED-to-MEASURED lifecycle a claim travels from "we think this is worth X" to "we measured
X". It is the accuracy-side answer to a recurring failure: an impact estimate ships to a stakeholder,
influences a decision, and then lives only in the prose of the answer that produced it, with no home,
no validation path, and no way to tell later whether it was ever checked.

**Method here, data in the project (the boundary rule).** This skill ships the method and the output
contract. The ledger itself is a **consuming-project artifact** — it lives at `docs/value-ledger/` in
the project that owns the claims, git-tracked, evolving across analyst sessions. The shipped skill
carries no project claims and no project paths; every value comes from the project's own ledger. This
is the same *method to the plugin, data to the project* split the analytics extension follows
throughout.

## The claim lifecycle — five statuses

A value claim is a single proposal that some KPI, data point, or intervention is worth a stated
magnitude. Every claim carries exactly one status, and the status only ever moves along this
lifecycle:

- **`proposed`** — the claim exists and names its estimate, but its evidence has not been
  re-executed against live data. A claim whose number is shape-attested (the query is known and
  correct) but never actually run enters here — see *Pending-live-validation* below.
- **`validating`** — the claim is under active check; some evidence has re-executed but the estimate
  is not yet confirmed. This is also the **re-entry** status: a validated or invalidated claim that
  is reopened for refinement returns to `validating` (there is no separate `refining` state).
- **`validated`** — the estimate re-executed against live data and held; the number is now MEASURED,
  not estimated.
- **`invalidated`** — the estimate re-executed and did **not** hold; the claim is refuted. It is kept
  (never deleted) so the refutation stays on the record.
- **`retired`** — the never-delete terminal disposition. A superseded or abandoned claim flips to
  `retired`; it never vanishes from the ledger. A claim that is simply wrong flips to `invalidated`,
  not `retired` — `retired` is for claims withdrawn or replaced, not disproven.

The transition detail (which moves are legal, what each write records) lives in the output contract —
see `references/output-contract.md`.

## The artifact

Two shapes, both in the consuming project's `docs/value-ledger/`:

1. **A one-line index file** — one rendered row per claim (id, claim, estimate, confidence, status),
   an at-a-glance view of every claim the project holds.
2. **One detail doc per claim** — YAML frontmatter carrying the machine-readable summary, and a body
   carrying the full provenance (which evidence supports the estimate, the validation and
   invalidation paths, the dated changelog of every status move).

The exact frontmatter fields, the index format, and the append-only changelog grammar are the
**output contract**: `references/output-contract.md`. Do not restate the schema here — that reference
is its single owner.

## Registry invariants — by pointer, not restatement

The ledger is a **registry-species artifact**: the same never-delete, append-only, idempotent-refresh
discipline the mine-family registries follow. Those invariants are **not restated here** — they are
cited, so there is one authoritative copy and this skill cannot drift from it.

Read the **nexus plugin's `mine-verify-cover` skill** — its reference file
`skills/mine-verify-cover/references/mine-family-core.md`, under the full heading
`## Registry invariants + refresh outcome grammar` — for the binding rules this ledger inherits:
per-row provenance and `last_verified`; **rows are never deleted** (a disposition flip keeps the
record); **every write appends a changelog entry**; a re-run against unchanged input is
**idempotent**; and the refresh outcome grammar (`resolved` / `still-active` / `superseded`) for
re-verifying an existing claim against the delta since its `last_verified`. This ledger's five
statuses are its own disposition vocabulary; the invariants above are the shared grammar they map
onto. (A cross-plugin prose citation, not a relative path — nexus-analytics ships no copy of that
file, so a `../` path would dangle.)

## Pending-live-validation — the first-class "shape-attested, not yet measured" reading

An analyst frequently reaches a *resolved and grounded query plan* with **no live surface to run it**
— no read-only connection resolved, or a committed-bundle vantage that carries the canonical query
but no result rows. The query shape is trustworthy; the number is not yet produced. This is a
**legitimate, first-class** ledger state, not an error:

- The claim enters as **`proposed`**, and its evidence names the **actual probe window and cohort**
  that any shape-attesting magnitude came from — not the population the claim is *about*. A magnitude
  sized on a narrow probe (one region, a two-day window) is recorded as exactly that, and the
  contract forbids presenting it as the broad answer.
- **An ESTIMATED number that appears in any shipped answer MUST have a ledger entry.** Prose is not a
  ledger: a number that influenced a decision and lives only in the sentence that produced it has no
  provenance, no validation path, and no way to be found and checked later. The ledger is where such
  a number belongs.

This reading is the ledger side of the `answer-qa` skill's grounding gate: when an answer's number
*cannot re-execute by circumstance*, that number routes here as `proposed` and is governed by the
penalty-only doctrine until it validates.

## Species disambiguation — what this ledger is NOT

Two boundaries are load-bearing; state both, and keep them distinct:

- **The value ledger is not the model-feedback ledger.** The model-feedback ledger (consumed by the
  `mine-semantic-model` and `value-briefing` skills) records evolving *model* corrections — a
  construct's provenance, a coefficient's confirmation-in-use, a deprecated field. The value ledger
  records *value claims* — estimates of what a KPI or intervention is worth and whether they held.
  Two different artifacts, two different lifecycles; a claim never lands in the model-feedback ledger
  and a model correction never lands here.
- **The value ledger is the accuracy-side claims registry, not the worth/prioritization layer.** The
  `value-briefing` skill declares itself the ONLY home of *value content* — worth, prioritization,
  monetization, displacement labeling — and that content never flows back into the accuracy surface.
  The value ledger does not cross that line: it is an **accuracy-side registry of claims and their
  validation state** (a claim's estimate must re-execute and hold before it counts as measured), not
  a worth or prioritization judgment. Deciding what a validated claim is *worth* or how to *rank* it
  stays value-briefing's monopoly; recording that the claim exists, what it estimated, and whether it
  validated is this ledger's job.

## What this skill does NOT do

- **Ship any tooling.** There is no index-rebuild or index-check script in this wave — the contract
  stands as prose, and any deterministic checker stays project-provided until a later wave
  generalizes one. Maintain the index by the contract, not a script.
- **Produce the answer or run the query.** Building and executing a query is the
  `semantic-model-query` skill; checking a shipped answer is the `answer-qa` skill. This skill only
  records the *claim* an answer makes and tracks it to validation.
- **Assign worth or priority.** That is value-briefing's monopoly (above). The ledger records the
  claim and its validation state, never what to do about it.
- **Author project claims from the shipped skill.** Every claim lives in the consuming project's
  `docs/value-ledger/`; this skill defines the method and the contract, never a project's claims.

Discovered a defect while using this skill (a missing status, a contract gap, an unhandled evidence
shape)? Log it — inside the SDD pipeline, append to that feature's
`docs/specs/{slug}/delivery/lessons.md` under `## Developer Lessons` or `## Skill Gaps`; running
standalone, note it for the project's own lessons flow. Never silently work around a gap.

**Consumed by:** the `data-analyst` agent when an answer ships an unvalidated estimate, and the
`answer-qa` skill's grounding gate when a number cannot re-execute by circumstance and must route to
a `proposed` claim.

## References

- `references/output-contract.md` — the ledger's output contract: the per-claim YAML frontmatter, the
  one-line index format, and the append-only dated-changelog grammar for status transitions.
