# Proposal — should the boundary detector enforce `test-implementation.md` ownership at all

**Status:** Draft (raised 2026-07-14 during `adhoc-AdrAmendments`, alongside the ADR-18 clause that
gives non-developer implementer agents `test-implementation.md` as their own artifact).
**Severity:** None today — no violation can fire against `test-implementation.md` under the current
`ARTIFACT_OWNERS` map (it matches no listed regex), so this is a forward-looking enforcement design
question, not a live false positive.

## Problem

ADR-18 now says non-developer implementer agents (a test-authoring agent such as an integration-tester)
write `docs/specs/{slug}/delivery/test-implementation.md`, never `implementation.md`, which stays
developer-owned. The source feedback entry (`docs/plugin-feedback/omni-1.25.1-2026-07-12.md` Part A
Entry 4) additionally recommends: "The boundary detector's artifact-ownership map should gain that
mapping (`test-implementation.md` → test-author roles) so the legitimate write stops logging as a
violation."

**That premise is false, and it matters to say so plainly.** `ARTIFACT_OWNERS`
(`plugins/nexus/hooks/scripts/boundary-detector.js:45-53`) only flags a file matching a **listed**
regex — the loop at `:59-63` iterates the list and returns a violation only on a match.
`test-implementation.md` matches no entry today, so **no violation can fire against it** — there is
nothing for a new mapping to "stop." The 11 logged hits in the source evidence were the
integration-tester writing **`implementation.md`** (which IS listed, owners `{developer, solo}`); they
stop the moment the agent writes the new filename instead — no detector change is needed for that.

So adding a `test-implementation.md` entry to `ARTIFACT_OWNERS` would **create new enforcement**, not
remove a false positive. The only coherent enforcement value such an entry could have is catching the
mirror-image breach: a **developer** writing `test-implementation.md` (the tester's artifact) instead of
its own `implementation.md`.

## The design question (why this is backlogged, not auto-fixed)

Adding the mapping needs an owner set, and nexus ships no test-author role to put in it:
`NONCODE_ROLES` (`boundary-detector.js:43`) lists architect/reviewer/po/critic/team-lead/learner;
`KNOWN_ROLES` in `lib/resolve-role.js` lists team-lead/po/architect/developer/reviewer/critic/learner/solo.
The integration-tester is **consumer-local** — it isn't in either set. `resolveRole` would return the
raw, unresolved token (`lib/resolve-role.js:48`, "genuinely unknown — caller treats as unknown"), and
`violation()`'s `!owners.has(role)` check would then flag the integration-tester for writing its **own**
artifact — the exact false-violation class nexus 1.34.1 just fixed for the `dev-*` fast-lane
abbreviation (`fix(adhoc-RoleAbbrev)`, `docs/plugin-feedback/omni-1.32.0-2026-07-14.md` Entry 1).
Shipping the mapping without a matching role would trade one false positive (the one already retired by
the filename split) for a new one.

Two coherent resolutions, and picking between them is an owner call, not a mechanical fix:

1. **Don't enforce it.** `test-implementation.md` is a developer-facing convention (ADR-18), not a
   boundary-detector concern — leave `ARTIFACT_OWNERS` untouched. Simplest; the filename split already
   delivers the practical fix (no more false positives on the integration-tester's legitimate write),
   and a developer writing the tester's artifact is a rare, low-stakes mistake with no evidence it has
   ever happened.
2. **Enforce it, but only after nexus names a test-author role.** Add
   `[/\/test-implementation\.md$/, new Set([...])]` to `ARTIFACT_OWNERS`, where the owner set names
   whatever role nexus eventually ships for test-authoring (or widens to accept any consumer-local role
   pattern) — mirroring how `implementation.md` accepts both `developer` and `solo`. Requires nexus to
   first decide whether test-authoring becomes a first-class pipeline role, which is a larger question
   than this detector map.

**Recommendation:** option 1 (medium confidence) — the enforcement gap is theoretical (no observed
developer writing `test-implementation.md`) and nexus has no role to name as its owner yet; adding a
mapping now would either enforce against nobody or misfire against the consumer-local integration-tester.
Revisit if nexus ever ships a test-author role, or if a real instance of the mirror breach is observed.

## Adoption trigger

Fix when next touching `boundary-detector.js` or the artifact-ownership contract (ADR-18), or if this
question ever starts masking a real breach — a developer observed writing `test-implementation.md`
instead of its own artifact.

## Provenance

Surfaced during `adhoc-AdrAmendments` (2026-07-14) while applying ADR-18 Decision 1 (non-developer
implementer agents own `test-implementation.md`). Source: `docs/plugin-feedback/omni-1.25.1-2026-07-12.md`
Part A Entry 4. Modeled on the identical precedent — `docs/proposals/boundary-detector-solo-ownership.md`
— which resolved the parallel `implementation.md` → `{developer, solo}` question the same way: recorded
as a deferred proposal because enumerating `ARTIFACT_OWNERS` entries is an owner call.
