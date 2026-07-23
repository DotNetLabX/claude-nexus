# adhoc-InstrumentIntegrity4 — Implementation

Three instrument-integrity doctrine refinements from the C++ estate production rulings, applied as
exact prescribed edits to two SKILL.md files. No other changes; no git, no version bump.

## Files Modified

- `plugins/nexus/skills/mine-verify-cover/SKILL.md`
  - **EDIT 1a (L168–174)** — in the `**Every declared oracle pass must be proven present in the
    merge.**` bullet, inserted the multi-build region-routing rule immediately after
    `…HALTs the gate.` and before the `Corollary:` sentence. Adds the per-pass × build assertion
    against a committed region-routing table, the three empty-cell verdicts (legitimate / HALT /
    scope-leak), the ≥1-build-with-count>0 requirement, and the routed-union denominator honesty
    condition. 2-space continuation indentation; the `Corollary:` sentence is preserved intact
    (now L174–177).
  - **EDIT 1b (L180–183)** — in the `**Score arithmetic and its evidence artifacts are
    committed**` bullet, appended after `…one cleanup away from gone.` the "instrument's own
    sources are covered too" rule: a corrected scorer counts as propagated only when every live
    copy is committed or provably derived, with the production measurement (one clone reverted, 49
    stale scorers across 7 containers).

- `plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md`
  - **EDIT 2a (L90–92)** — in step 3b's `**Declared-pass manifest (deterministic leak — invisible
    to the run-pair):**` sub-bullet, appended after `…Both legs ship before any score does.` the
    multi-build cross-reference to the generic skill's instrument-integrity section. 5-space
    continuation indentation matching the 3b sub-bullet style.
  - **EDIT 2b (L93–101)** — inserted a NEW sub-bullet `**Battery evidence banking + freshness
    anchor (two proven traps):**` immediately after the declared-pass-manifest sub-bullet and
    before step `4.`. Trap (1): per-fixture compare inside try/catch so a late-fixture crash still
    banks earned kills. Trap (2): anchor freshness on the FINAL LINKED test artifact (whole-archive
    static-embed defeats a .so-hash freshness check; a hard `return;` mutant SURVIVED this way),
    and red-prove the anchor. `   - ` prefix with 5-space continuation.

## Key Decisions

- EDITs 2a and 2b were applied as a single Edit spanning the manifest sub-bullet's last line
  through the `4. Build mutatedFiles` line — the insertion point for 2b is exactly the boundary 2a
  modifies, so one contiguous replacement avoids an ordering hazard between two edits touching
  adjacent lines. Net text is identical to applying them separately.
- Each inserted sentence-1 rides on the same physical line as the preceding sentence it was
  appended after (markdown reflows single newlines as spaces), with subsequent lines wrapped at the
  bullet's own continuation indentation exactly as the dispatch specified. No existing sentence was
  reworded, moved, or dropped.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 (all 4 edits) | None | No skill mapped — trivial-intent direct dispatch, prescribed verbatim edits (`Skill: None`). |

## Deviations from Plan

- None. All four edits applied exactly as specified; no other files touched; no git command run; no
  plugin version bumped (all per the dispatch's hard rules).

## Self-Review

Prose-angle checks against the surrounding doctrine:

- **No contradiction with the existing pass-manifest bullet (generic, L164–177).** EDIT 1a extends
  the same rule to the multi-build case: the base rule ("every declared pass present, count > 0,
  absent pass HALTs") is unchanged; the new text specializes it per build via a committed routing
  table and adds a *reason* an empty cell can be legitimate (table-predicted) — it does not weaken
  the HALT (an unpredicted empty cell still HALTs; a region dropped from every build is still a
  leak). Consistent, strictly additive.
- **No contradiction with the reproducibility-proof bullet (Corollary, L174–177).** The Corollary
  ("proof necessary, never sufficient; deterministic mis-attribution needs its own assertion")
  still reads correctly after the insertion — the new "deterministic scope leak" is exactly the
  class of deterministic mis-attribution the Corollary says needs a dedicated assertion, so the
  region-routing assertion is an instance of that principle, not a competing claim. Adjacent
  sentence "a collapsed scope" in the Corollary's parenthetical now has a concrete upstream
  mechanism (routed-union denominator) — reinforced, not stale.
- **Generic ↔ cpp cross-reference resolves both ways.** EDIT 2a's cpp sub-bullet points to "the
  generic skill's instrument-integrity section" for the full rule; that full rule is precisely what
  EDIT 1a added to `mine-verify-cover/SKILL.md`'s `### Instrument integrity` section. The cpp text
  is a faithful compression (per pass × build, committed routing table, empty-cell-legitimate-only-
  if-predicted, ≥1 build with count > 0) with no claim absent from the generic source. Forward
  reference and backing rule agree.
- **EDIT 1b vs the committed-artifacts bullet.** The base sentence forbids ephemeral score
  artifacts; the appendix extends "committed, not ephemeral" to the scorer's *own sources* (clones,
  containers, worktrees). Same principle (a committed verdict must not depend on uncommitted state),
  new object (the instrument code itself). No tension with the surrounding "worktrees, /tmp"
  enumeration — it reuses the same live-copy vocabulary.
- **EDIT 2b adjacency.** The new battery/freshness sub-bullet sits between the manifest sub-bullet
  and step 4 (`mutatedFiles` / `target_mutated` guard). Both neighbors concern evidence integrity of
  the scored run; the freshness-anchor trap (stale linked artifact) is complementary to
  `target_mutated` (basename actually mutated) — different fake-green vectors, no overlap or
  contradiction. Step numbering (3b sub-bullets → 4 → 5) is intact; the insert did not renumber.

**Verdict: PASS** — all four edits applied verbatim at the specified anchors, both files internally
consistent and mutually cross-referential, no adjacent sentence rendered stale, lint+unit suite
green (593/593).

*Status: COMPLETE — developer, 2026-07-23*
