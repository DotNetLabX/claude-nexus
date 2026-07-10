---
name: answer-qa
description: Check a shipped analytics answer against the mandatory-obligation contract before it reaches the user — grain named, every mandatory filter named as applied, date range stated, model constructs listed, and any data-caveat surfaced. An answer missing an obligation is malformed. Use as the final check on every analytics answer, right before presenting it.
user-invocable: true
---

# Answer QA

## The answer contract

Every shipped answer is checked against this contract before it reaches the user. All five items
are required whenever they apply to the query that produced the answer:

1. **Grain** — the row-level unit the numbers are computed at (report, store-day, SKU-day, etc.),
   named explicitly, not left implicit.
2. **Filters** — every mandatory filter the profile declared (the bad-reports-excluded class from
   semantic-model-query, plus any other profile-mandatory filter) is named as **applied** — not
   just true in fact, but stated in the response so the user knows it happened.
3. **Date range** — the actual date range the answer covers, anchored to the data (not silently
   assumed to be "today"), stated plainly.
4. **Constructs** — the model constructs used (measures, dimensions, joins) named, so the user can
   trace the answer back to the model instead of trusting an opaque number.
5. **Data caveats** — when the profile's model carries staleness info, availability gates, or a
   deferred/unknown-construct note relevant to this answer, that caveat is surfaced — never
   silently dropped because the number still computed.

## Malformed answers

An answer missing grain, an applied mandatory filter, the date range, or a required construct
listing is **malformed** — it does not ship. Fix the gap (name what was missing) before presenting
the answer, never present it first and caveat later. An answer that inverts an obligation — for
example, stating a filter was applied when it was not — is malformed regardless of whether the
underlying numbers happen to be correct; the contract is about what the user was told, not just
whether the SQL ran clean.

## Check order

Run this check LAST, after the query has executed and the numbers are in hand — it is a gate on
the response, not a substitute for the mandatory-obligation pre-query check in
semantic-model-query (which prevents a wrong number; this skill prevents an unexplained one).

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
