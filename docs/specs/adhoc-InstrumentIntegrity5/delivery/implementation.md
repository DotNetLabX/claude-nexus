# adhoc-InstrumentIntegrity5 — Implementation

Three doctrine results from the C++ estate's adoption round, applied verbatim to the two
`mine-verify-cover` SKILL.md files. Trivial-intent direct dispatch, no plan. Two files touched
plus this artifact; no git, no version bump.

## Files Modified

- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — section `### Instrument integrity — the
  kill-attribution rule (binding)`:
  - **EDIT 1a (lines 163–169)** — appended two corollaries to the end of the `**Multi-oracle
    merges are part of the instrument.**` bullet: *timeout promotion requires a multi-oracle
    instrument* (a single-oracle gate can't tell a genuine infinite loop from that oracle's own
    long path — promotion may fire only when ≥2 oracles exist and the mutant completed under
    none) and *standing promotions are re-verified whenever the oracle set grows* (with the
    proven two-mutant/one-oracle→three-oracle refutation). Continues the existing bullet as one
    paragraph, 2-space continuation.
  - **EDIT 1b (lines 200–205)** — inserted a new bullet `**The subject's identity is part of the
    evidence.**` immediately after the `**Auditing a past claim…**` bullet (now ending line 199)
    and before `## The Minimize stage` (line 207). Covers the inherited-build-cache vacuous-green
    trap (CMake/Gradle/MSBuild) and the clean-configure + subject-identity-proof evidence
    requirement. 2-space continuation.

- `plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md` — step `3b.` instrument honesty proof:
  - **EDIT 2a (lines 83–85)** — appended to the `**Multi-oracle merge precedence (proven leak
    2026-07-22):**` sub-bullet, immediately after the `…requires "never completed under any
    oracle").` sentence: promotion additionally requires ≥2 oracles, and standing promotions are
    re-verified whenever the oracle set grows. Placement confirmed by reading the file first —
    the later `Multi-build gates assert…` sentence lives in the *next* sub-bullet (Declared-pass
    manifest, line 92), NOT this one, so the new text sits at the true end of the merge-precedence
    sub-bullet. `   - ` bullet, 5-space continuation.
  - **EDIT 2b (line 95 + lines 103–105)** — changed the bold lead-in count `(two proven traps):`
    → `(three proven traps):` on the `**Battery evidence banking + freshness anchor…**` sub-bullet,
    and appended trap `(3)`: an inherited sibling CMake cache compiling the WRONG sources →
    vacuous green, fixed by a clean configure + tree-identity reference-count proof. 5-space
    continuation.

## Key Decisions

- **EDIT 2a placement adjudication.** The dispatch flagged a conditional: place the new sentence
  before `Multi-build gates assert…` only if that sentence is in the same sub-bullet. Read
  confirmed it is not (it is in the Declared-pass manifest sub-bullet), so the two-oracle text
  went at the end of the merge-precedence sub-bullet — exactly after the never-completed-under-any-
  oracle sentence, no interleaving with the manifest sub-bullet.
- No wording changes beyond the supplied text; line-wrapping matched each file's existing width
  and indentation (generic 2-space continuation; cpp 3b `   - ` sub-bullets with 5-space
  continuation). Unicode `≥` and em-dash `—` reuse characters already present in both files.

## Test Result

`node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"` (glob form, repo root):
**593 pass / 0 fail / 0 skipped** — green.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1a–2b | None | Trivial-intent direct dispatch, no plan, no Skill Mapping — pure prose edits to two SKILL.md files, verbatim from the dispatch. No pattern skill applies. |

## Self-Review

**Angle 1 — the two-oracle minimum does not contradict "completion under ANY oracle refutes"; it
strengthens it.** The pre-existing rule (generic line 160–163) says a mutant that ran to completion
under any oracle *cannot* be adjudicated a genuine infinite loop — a disqualifier. EDIT 1a adds a
*precondition* on the same promotion path: the instrument must carry ≥2 oracles at all, because one
oracle cannot separate a real infinite loop from its own long path. Both conditions gate the SAME
`adjudicatedTimeoutKillLines`/timeout-promotion hatch and both narrow it (need ≥2 oracles AND
completed under none). Strictly additive — no case the old rule promoted is now blocked in a way
that reverses it, and no case it blocked is now allowed. The cpp EDIT 2a mirrors this against the
cpp sub-bullet whose sentence already states the "never completed under any oracle" disqualifier,
so the strengthening reads consistently in both files.

**Angle 2 — the `(three proven traps)` count matches the enumerated items.** The cpp battery
sub-bullet now enumerates exactly `(1)` accumulate-and-compare-once, `(2)` stale-embedded-TU
freshness, `(3)` inherited-sibling-CMake-cache. Lead-in `(three proven traps)` = 3 items. Verified
against the re-read (lines 95–105): items 1/2/3 present, count correct.

**Angle 3 — cross-references resolve.** EDIT 1b's "subject's identity" trap (generic) and cpp EDIT
2b trap (3) are the same doctrine at two altitudes (generic: any cached configure — CMake/Gradle/
MSBuild; cpp: CMake specifically) — mutually consistent, neither points at a missing anchor. EDIT
1a and cpp EDIT 2a both reference the existing multi-oracle / timeout-promotion machinery already
defined in-section; no new dangling term introduced. The generic `### Instrument integrity` section
is the one the cpp Declared-pass sub-bullet already cross-references ("full rule: the generic skill's
instrument-integrity section"), so the cpp additions stay subordinate to the generic rules, as
intended.

**Angle 4 — adjacent sentences are not stale.** EDIT 1a joins the multi-oracle bullet as a trailing
paragraph; the following bullet (`Every declared oracle pass…`, line 170) is untouched and still
reads. EDIT 1b sits cleanly between the era-rule bullet (line 193–199) and the `## The Minimize
stage` heading (line 207) with the intervening blank line preserved. EDIT 2a lands before the
Declared-pass manifest sub-bullet (line 86) — the manifest sub-bullet and its `Multi-build gates
assert…` sentence are unchanged and not duplicated. EDIT 2b's `(3)` follows `and red-prove the
anchor.` and precedes the numbered step `4.` (line 106) — no run-on into the next step.

**Verdict: PASS.** All four edits placed at the specified anchors with matching indentation, the
verbatim dispatch text, the strengthen-not-contradict relationship intact, the trap count
consistent, cross-references resolved, and no stale adjacency. Full lint+unit suite green (593/0).

*Status: COMPLETE — developer, 2026-07-23*
