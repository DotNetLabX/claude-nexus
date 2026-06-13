# Proposal P3 — Research-KB retention / eviction (research-first)

**Status:** Draft / **BLOCKED on research** (overview: `research-system-overview.md`). Do not build
until the policy is chosen.
**Confidence:** **Low** — the policy is genuinely undecided. Per **P1**, low confidence on a knowable
unknown ⇒ **research before building.** This proposal practices the rule it serves.
**Priority:** after P2.

## The question
How does a research entry age? The owner's instinct was a generational-GC pass: score topics, tier
them, periodically **eliminate** irrelevant ones.

## What's already settled (the design constraints)
- **Two axes, not one score.** Heat (reuse) drives **ranking**; validity (freshness) drives
  **supersession**. Don't collapse them.
- **Deletion is earned, not heat-driven.** Only `superseded` (replaced) or proven-stale (failed
  re-verification) earn deletion. Heat only ever **demotes to an archive tier** (searchable, not
  auto-loaded). A cold-but-true entry is precious when its topic recurs and costs ~nothing to keep —
  coldness ≠ garbage.
- **GC reachability is the wrong deletion criterion.** A dormant-yet-true research is "unreachable" and
  valuable. **Leitner (spaced-repetition boxes)** is the closer model for promote-on-use /
  demote-on-disuse / reconfirm-on-interval. build-persona's `RECONFIRM_DAYS` is already a Leitner
  interval.

## What needs research (feeds the topic list)
- heat axis: LRU-K / LFU-with-aging / ARC eviction
- tiering: Leitner / spaced-repetition intervals
- supersede-don't-delete prior art: **Mem0** (already cited by build-persona)
- omnishelf prior art to read **first**: `build-persona` (`RECONFIRM_DAYS` + supersede), `kb-sync`
  staleness handling, `personas.md` Confidence/Status

## Stub — the consolidator (when unblocked)
A **learner mode** (not a new agent): heat-tier cold entries to archive; re-verify entries whose
reconfirm trigger fired; supersede the proven-stale.

## Provenance
Session `researcher-build-persona`, 2026-06-13. Decay risk made concrete by the Stryker finding (the
MTP runner is preview; issue #3424 could invalidate it on a future Stryker version).
