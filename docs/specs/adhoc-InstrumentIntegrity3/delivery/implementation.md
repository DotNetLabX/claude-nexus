# adhoc-InstrumentIntegrity3 — Implementation

Trivial-intent direct dispatch (no plan). Three doctrine edits from production feedback in the C++
estate: two gaps in the shipped instrument-integrity doctrine plus one audit technique.

## Files Modified

- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — two new bullets in
  `### Instrument integrity — the kill-attribution rule (binding)`:
  - **EDIT 1 (lines 164–171):** `**Every declared oracle pass must be proven present in the merge.**`
    — inserted after the `**Multi-oracle merges are part of the instrument.**` bullet (now ends
    line 163) and before `**Score arithmetic and its evidence artifacts are committed**` (now
    line 172). Adds the per-pass manifest requirement (each declared pass named, evaluated-mutant
    count > 0; a missing pass HALTs the gate) and the corollary that the reproducibility proof is
    necessary-never-sufficient because a missing pass is deterministic and reproduces perfectly.
    A missing pass **mis-measures** silently (not merely under-measures): an absent pass's
    completions would have refuted timeout promotions, so absence can also inflate the score
    (done-check precision fix, 2026-07-22).
  - **EDIT 2 (lines 178–184):** `**Auditing a past claim: re-score under the claim's own era rule
    first.**` — appended at the end of the bullet list, after the `**Comparative claims require a
    uniform instrument.**` bullet (now ends line 177) and before the `## The Minimize stage`
    heading (now line 186). Documents re-scoring a past claim under its era rule to separate bad
    work from a bad instrument, with the 2026-07-22 C++ estate sweep as evidence.

- `plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md` — one new sub-bullet in step `3b.`:
  - **EDIT 3 (lines 84–90):** `**Declared-pass manifest (deterministic leak — invisible to the
    run-pair):**` — inserted after the `**Multi-oracle merge precedence (proven leak
    2026-07-22):**` sub-bullet (now ends line 83) and before step `4.` (now line 91). The
    stack-adapter concretion of EDIT 1: the merged evidence must name every declared mull pass
    (discovery/golden/shell/…) with a per-pass evaluated-mutant count > 0; a declared pass absent
    HALTs the gate, and the reproducibility run-pair cannot see it because the defect is
    deterministic.

Indentation matched to each file's neighbors: generic file uses `- ` bullets with 2-space
continuation; cpp `3b.` sub-bullets use `   - ` (3-space) with 5-space continuation.

## Key Decisions

- None beyond verbatim placement. All three bullet bodies were supplied by the dispatch; the only
  discretionary work was boundary anchoring and indentation matching, both dictated by the
  surrounding text.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| EDIT 1 | None | direct doctrine edit — no skill mapped (trivial-intent dispatch, no plan) |
| EDIT 2 | None | direct doctrine edit — no skill mapped |
| EDIT 3 | None | direct doctrine edit — no skill mapped |

## Verification

- Command: `node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"` (glob form, from repo root).
- Result: **tests 589 · pass 589 · fail 0 · duration 5712ms** — green.

## Self-Review

Prose angles for this docs-only diff:

- **Internal consistency — no contradiction with the multi-oracle bullet (EDIT 1).** The multi-oracle
  bullet (lines 156–163) governs *merge precedence* — how a status is allowed to score over another
  when a mutant IS scored under several passes. EDIT 1 governs *presence* — that every declared pass
  actually appears in the merge at all. Orthogonal concerns, no overlap or conflict; EDIT 1 sits
  correctly as the next bullet.
- **Internal consistency — reproducibility-proof framing.** EDIT 1's "necessary, never sufficient"
  claim does not contradict the earlier honesty-proof bullet (lines 149–152) that names the
  reproducibility proof for the parallel-harness shape; it refines it — the run-pair catches
  non-deterministic defects, deterministic mis-attribution needs its own manifest assertion. EDIT 3
  states the same relationship in the cpp adapter and is consistent with the cpp reproducibility-proof
  sub-bullet (lines 70–73) it references as "the run-pair".
- **No dangling references / directional references valid.** No section was renamed, so the existing
  cross-reference at cpp line 66 (`→ ### Instrument integrity`) and the "see `## The adapter
  contract`" pointer still resolve. EDIT 3's "invisible to the run-pair" correctly points back to the
  reproducibility-proof sub-bullet above it in the same 3b list.
- **Adjacent sentences not left stale.** The generic section intro (lines 139–142, "every audited
  mutation instrument lying in its own way") frames a list the two new bullets extend — still reads
  correctly. The cpp `3b.` intro (lines 67–69, "MANDATORY before any score is reported") frames the
  sub-bullet list the new manifest bullet joins — still correct; the new bullet is another mandatory
  pre-score check. The `## The Minimize stage` heading following EDIT 2 is unaffected (blank-line
  separation preserved).

**Verdict: PASS** — three edits placed at the specified boundaries with matched indentation, suite
green (589/589), no internal contradictions, no dangling or stale references.

*Status: COMPLETE — developer, 2026-07-22*
