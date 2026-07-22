---
name: answer-qa
description: Check a shipped analytics answer against the mandatory-obligation contract before it reaches the user — grain named, every mandatory filter named as applied (or its declared exemption named as not-applied-and-why), date range and model constructs presented in one provenance panel, any data-caveat surfaced, every applied default named (persisted defaults inline, documented defaults as an "assumed:" line), and the path of any file the flow produced (under my-workspace/exports/ when the AM named no location). A grounding gate re-executes every cited number or drops it — a number that cannot re-execute ships only as an explicitly-pending estimate, and an unvalidated estimate is penalty-only. An answer missing an obligation is malformed. Use as the final check on every analytics answer, right before presenting it.
user-invocable: true
---

# Answer QA

## The answer contract

Every shipped answer is checked against this contract before it reaches the user. All seven items
are required whenever they apply to the query that produced the answer:

1. **Grain** — the row-level unit the numbers are computed at (order, hub-day, account-month, etc.),
   named explicitly, not left implicit.
2. **Filters** — every mandatory filter the profile declared (the bad-reports-excluded class from
   semantic-model-query, plus any other profile-mandatory filter) is named as **applied** — not
   just true in fact, but stated in the response so the user knows it happened. When the profile
   declares a filter **EXEMPT** for this query — a carve-out where the filter correctly does *not*
   apply to the measure or fact being queried — that exemption is itself the obligation: it is named
   as **not applied and why**, never silently dropped. Naming a declared exemption is a recognized
   obligation, not an edge the analyst handles by hand. Falsely stating an exempt filter as applied
   is malformed; so is silently omitting a declared exemption.
3. **Date range** — the actual date range the answer covers, anchored to the data (not silently
   assumed to be "today"), stated plainly.
4. **Constructs** — the model constructs used (measures, dimensions, joins) named, so the user can
   trace the answer back to the model instead of trusting an opaque number.
5. **Data caveats** — when the profile's model carries staleness info, availability gates, or a
   deferred/unknown-construct note relevant to this answer, that caveat is surfaced — never
   silently dropped because the number still computed.
6. **Applied defaults** — every persisted default that was used is named inline ("Using default
   {input}: {value}"); every documented default that was applied is named as an "assumed:
   {input} = {value}" line, with any relative date resolved to its concrete, data-anchored range
   (see the sibling `fail-closed-intake` skill) before it is stated. This item applies even when
   the default maps to none of items 1–5 above — for example a per-user identifier the profile
   marks as a persistable default.
7. **Produced-file path** — when the flow produced a file (an export written to disk), the shipped
   answer names its full path; when the AM named no location, the path is under
   `my-workspace/exports/` (the sibling `workspace-self-heal` skill owns *where* the file lands;
   this contract owns that the answer *names* it). Conditional like the others — a query that
   produces no file satisfies this vacuously.

## Grounding gate

Before an answer or any value claim ships, **every cited evidence reference must re-execute**: the
query re-runs (or the cited rows re-fetch) and the resulting excerpt is attached to the answer. A
number shipped **as a validated value** whose evidence does not re-execute is **dropped, not
shipped** — it never reaches the user. This is the same excerpt-or-drop discipline the nexus plugin's
mine-family skeptic applies to a mined rule (`skills/mine-verify-cover/references/mine-family-core.md`,
its evidence gate — evidence carrying no re-execution content earns nothing); this skill reuses that
shape, it does not reinvent one.

There is exactly one disposition for a number that **cannot re-execute by circumstance** — no live
connection resolved, or a committed-bundle vantage that carries the query but no result rows:
**cannot re-execute by circumstance ⇒ the number appears only as an explicitly-pending ESTIMATE
(never as a validated value), routes to the `value-ledger` skill's ledger as a `proposed` claim, and
is penalty-only until validated.** This is not an exception to the gate — it is the gate's own
disposition for "cannot re-execute". The "dropped, not shipped" rule governs a number shipped *as
validated* without re-execution; the pending lane ships the *label* (the explicitly-pending
estimate), never the naked number presented as fact. This section and `## Check order` are one rule,
not two — read them together.

## Penalty-only doctrine

An agent-produced estimate that feeds any score, rank, or recommendation may only ever count
**against** it, never for it, until the estimate is validated in the `value-ledger` skill's ledger.
An unvalidated number can withhold a recommendation or lower a rank; it can never manufacture or
raise one. (The `data-analyst` persona carries this same doctrine, so it holds whether or not this
skill is loaded.)

## Provenance panel

Contract items 3 (**date range**) and 4 (**constructs**) are **presented together** — alongside the
evidence **source** and the **query** that produced each number — as one **provenance panel** beneath
the answer, CSV-first so it exports cleanly and can later swap to a live endpoint. This is a
**presentation convention that integrates the existing contract items into one place, not a second
obligation to satisfy them twice**: an answer already names its date range and constructs to clear
the contract; the panel is simply where they, plus source and query, are shown so the user can trace
every number back to the model without hunting for the pieces.

## Malformed answers

An answer missing grain, an applied mandatory filter, the date range, or a required construct
listing is **malformed** — it does not ship. Fix the gap (name what was missing) before presenting
the answer, never present it first and caveat later. An answer that inverts an obligation — for
example, stating a filter was applied when it was not — is malformed regardless of whether the
underlying numbers happen to be correct; the contract is about what the user was told, not just
whether the SQL ran clean. A declared **exemption** is on the same footing: **silently omitting a
profile-declared filter exemption** is malformed just as stating an exempt filter as applied is —
both misrepresent what the user was told.

An answer that applied any default — persisted or documented — without its inline confirmation or
"assumed:" line is likewise **malformed**, even when that default maps to none of items 1–5 above;
fix it (name the default) before shipping, never ship it uncaptioned.

An answer that produced a file — an export written to disk — without naming that file's path is
**malformed**; name the path (under `my-workspace/exports/` when the AM named no location) before
shipping, never ship the file's existence uncaptioned.

## Check order

Run this check LAST, after the query has executed and the numbers are in hand — it is a gate on
the response, not a substitute for the mandatory-obligation pre-query check in
semantic-model-query (which prevents a wrong number; this skill prevents an unexplained one).

**When the numbers are NOT in hand — the pending-value lane.** A run legitimately ends at a
resolved-and-grounded *query plan* with no live surface to execute it (no connection resolved, or a
committed-bundle vantage that carries the query but no result rows). The answer may still ship — but
only as **shape-attested with the value explicitly pending**: cannot re-execute by circumstance ⇒
the number appears only as an explicitly-pending ESTIMATE (never as a validated value), routes to the
`value-ledger` skill's ledger as a `proposed` claim, and is penalty-only until validated. This is the
grounding gate's disposition for "cannot re-execute", **not** an exception to it — the gate and this
lane are one rule: a number shipped *as validated* without re-execution is dropped, not shipped; a
number that cannot re-execute is shipped *as a pending label*, never as a naked fact.

## What this skill does NOT do

- Build or execute the query — that's the `semantic-model-query` skill, run BEFORE this one.
- Investigate what an unclear column or flag means — that's the `data-investigation` skill.
- Replace the mandatory-obligation pre-query check — this skill checks what the ANSWER told the
  user, not whether the query itself applied the obligations correctly (a wrong query is
  semantic-model-query's job to prevent; an unexplained answer is this skill's).

**Consumed by:** the `data-analyst` agent, as the last check before presenting any answer.

Discovered a defect in the contract or a missing obligation class while using this skill? Log it —
inside the SDD pipeline, append to that feature's `docs/specs/{slug}/delivery/lessons.md` under
`## Developer Lessons` or `## Skill Gaps`; running standalone, note it for the project's own
lessons flow. Never silently work around a gap.

## References

- `docs/semantic-model/profile.md` — the source of the mandatory-obligation list this check runs
  against (which filters are mandatory, which constructs carry data caveats, what "grain" means
  for the tables involved). Never invent an obligation this skill doesn't find named there, and
  never drop one that is.
- `references/analyst-craft.md` — the ten transferable analyst-craft moves (attribution isolation,
  effort≠outcome, actionable-vs-structural gap decomposition, the validity firewall,
  coverage-as-frontier, per-entity dynamic baselines, distribution-over-mean, heterogeneous effect
  sizes, value-as-provenance-band, managed-cohort≠population) that this contract's caveats
  operationalize. The `data-analyst` agent points here too.
