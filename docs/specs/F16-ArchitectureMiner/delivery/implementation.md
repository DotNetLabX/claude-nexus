# F16-ArchitectureMiner — Implementation

**Scope of this round:** Steps 1–3 only (architect-led fast lane). Step 4 (release close: bump +
twin) is main-session-owned; Step 5 (pilot run) is operator-owed. NO git writes performed.

## Files Created
- `plugins/nexus/skills/mine-architecture/SKILL.md` — the eleventh mine's skill text. Prose-only
  skill (no harness code — evidence gate + kickoff preflight are shipped in `mine-verify-cover/tools/`
  and invoked in place per ADR-62). Mirrors `mine-reference-model/SKILL.md`'s section skeleton
  (N dimension extractors → one consolidate+skeptic; anti-flattery framing), content is F16-specific.
  Carries: frontmatter (`name: mine-architecture`, `user-invocable: true`, description with use-when
  + the not-list); intro (eleventh mine, full method-contract member, the what-is/what-hurts/
  what-to-copy triangle); the Extract→Consolidate→Verify→Emit→Refresh pipeline; the four dimensions
  D1–D4 incl. D1's overlap disposition; the BR-coverage join with the full
  `{registry file + row ids} | none | no-registry-estate` grammar; execution-topology pointer + own
  sizing + the kickoff-checklist pointer with the Tier-2 skipped-by-member-class note; the Verify
  gate (family §Skeptic protocol consumer — must-RUN, drop-without-excerpt, vacuous-evidence — plus
  the four dimension-specific re-executions and anti-flattery framing; judgment as `lens-note`); the
  output artifact (`docs/architecture-map/`, sixth species, registry-invariants pointer, evidence-gate
  on write, the mandatory `Current-state only` header + decided-architecture pointer line, the
  decided-vs-mined separation); binding prompt obligations + safety rails; a `## What this skill does
  NOT do` section with target-design as the first bullet; the relationship table incl. the
  mine-design/mine-algorithm no-seam row.

## Files Modified
Step 2 — family member-count sweep (ten → eleven). Edit list derived by RUNNING the plan's
authoritative grep (`grep -rnE 'ten-member|all ten|ten members|10-row' plugins/nexus/skills/` → 15
hits / 8 files at execution), not the plan's hand-transcribed table:

- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — four sweep edits:
  (1) line 3 `ten-member` → `eleven-member`; (2) line 4 added `mine-architecture` to the prose member
  list, placed among the full-method-contract members (after `mine-verify-flows`, before
  `mine-skill-gaps`) so it does NOT fall under the "the latter two are name-and-shape members"
  parenthetical (per plan); (3) added the 11th family-table row (unit = one repo's architecture;
  ground truth = code structure (+ optional graph and coupling table); gate = adversarial skeptic
  re-execution; output = `docs/architecture-map/` (index + per-module)); (4) invariant line 24
  `across all ten` → `across all eleven`. Plus the §Execution topology per-skill staging list gained
  one bullet: `mine-architecture — four dimension extractors in parallel (default), then ONE
  consolidate+skeptic (the reference-model shape)`.
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — line 473 `full 10-row family table` →
  `full 11-row family table`; and (consistency fix, see Deviations) added `mine-architecture` to the
  parenthetical member enumeration on lines 474–475 so the enumerated list matches the "11-row" count.
- `plugins/nexus/skills/mine-verify-repo/SKILL.md` — line 27 `all ten members follow` → `all eleven
  members follow`; line 276 `(all ten members)` → `(all eleven members)`.
- `plugins/nexus/skills/mine-reference-model/SKILL.md` — line 28 `full 10-row family table` →
  `full 11-row family table`; line 29 `all ten members follow` → `all eleven members follow`; line
  221 `(all ten members)` → `(all eleven members)`.
- `plugins/nexus/skills/mine-design/SKILL.md` — line 25 `full 10-row family` → `full 11-row family`;
  line 27 `all ten members follow` → `all eleven members follow`.
- `plugins/nexus/skills/mine-algorithm/SKILL.md` — line 26 `full 10-row family` → `full 11-row
  family`; line 28 `all ten members follow` → `all eleven members follow`.
- `plugins/nexus/skills/mine-verify-flows/SKILL.md` — line 16 (both matches in one line) `full 10-row
  family table` → `full 11-row family table` and `all ten members follow` → `all eleven members
  follow`.
- `plugins/nexus/skills/mine-skill-candidates/SKILL.md` — line 25 `full 10-row family table` →
  `full 11-row family table`; line 26 `all ten members follow` → `all eleven members follow`. (Line
  21 "tenth mine" is a positional ordinal — DO-NOT-TOUCH carve-out — left untouched.)

Step 3 — ADR extraction:

- `docs/architecture/README.md` — added `## ADR-67` body (house format: Context → Decision → Why →
  Tradeoffs → Rejected, with the Accepted status blockquote) after ADR-65's body, and a matching
  Contents line after the ADR-65 Contents entry. Next-free number verified at execution: highest
  *written* is ADR-65; ADR-66 is claimed by F15-SkillCandidateMiner (its summary records the 65→66
  renumber, not yet written to the register), so F16 takes ADR-67 (`grep -nE 'ADR-6[6-9]'
  docs/architecture/README.md` → 0 hits before the edit). Decision text per tech-spec Acceptance #5.

## Acceptance Evidence

### Step 1 — author `mine-architecture/SKILL.md`
Gate (run in foreground):
```
$ node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-architecture
OK    mine-architecture
---exit:0---
```
Required grep tokens (count in SKILL.md):
```
[1] user-invocable: true
[4] Current-state only
[3] no-registry-estate
[1] eleventh mine
[1] What this skill does NOT do
```

### Step 2 — family sweep (ten → eleven)
Acceptance pair (grep is authoritative):
```
$ grep -rnE 'ten-member|all ten|ten members|10-row' plugins/nexus/skills/
(no output)      exit:1   → 0 hits ✓

$ grep -rn 'eleventh mine' plugins/nexus/skills/
plugins/nexus/skills/mine-architecture/SKILL.md:20:This is the **eleventh mine** — a **full method-contract member** ...
→ hits ONLY in mine-architecture/SKILL.md ✓ (0 before Step 1, 1 after)
```
Carve-outs confirmed untouched:
```
$ grep -rn 'ninth mine' plugins/nexus/skills/mine-skill-gaps/SKILL.md   → :20 "ninth mine" (intact)
$ grep -rn 'tenth mine' plugins/nexus/skills/mine-skill-candidates/SKILL.md → :21 "tenth mine" (intact)
```
Regression guard: `skill-lint.mjs` re-run over all 8 edited skill folders + mine-architecture → all
`OK`, exit 0.

### Step 3 — extract ADR-67
```
$ grep -c 'ADR-67' docs/architecture/README.md
2                                        → ≥ 2 ✓ (Contents line 84 + body line 1868)
```
House-format section headings present in the ADR-67 body: `**Context.**`, `**Decision.**`,
`**Why.**`, `**Tradeoffs.**`, `**Rejected.**` (all confirmed via awk over the ADR-67..Inherited
range). Contents entry lists the new ADR.

## Key Decisions
- **`mine-verify-cover/SKILL.md` parenthetical member list** — the plan scoped this file's edit to
  `10-row` → `11-row` (line 473). Lines 474–475 enumerate the non-head family members ("including
  ... `mine-skill-candidates`"). Changing "10-row" → "11-row" while leaving the enumeration at 8
  members would be internally inconsistent (an "11-row table" listing an incomplete member set), so
  `mine-architecture` was appended to that enumeration. Recorded as a deviation below.
- **Prose member-list placement in `mine-family-core.md`** — `mine-architecture` was inserted before
  `mine-skill-gaps` (among the full-method-contract members) rather than at the end of the list, so
  the "the latter two are name-and-shape members" anaphora still correctly binds to
  `mine-skill-gaps` + `mine-skill-candidates`. Appending at the end would have silently mis-scoped
  that phrase to include `mine-architecture`, which is a full-contract member.
- **ADR status blockquote wording** — the house pattern is "highest was ADR-N-1; N free, no
  renumber." Adapted to disclose the F15/ADR-66 claim explicitly ("highest *written* is ADR-65; ADR-66
  is claimed by F15-SkillCandidateMiner ... so F16 takes 67") so the register's visible 65→67 gap is
  self-explaining until F15's close writes ADR-66.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Plan: `Skill: None` (verified: `improve-skills` scaffolds project-local skills / routes shipped-skill fixes to plugin-feedback; `evaluate-skill` is the diagnose half — neither authors a new shipped dev-repo skill). TDD: no. The skill-lint run is a **command** (`node .../skill-lint.mjs`), not a skill invocation. Logged as a skill gap per plan (see lessons.md `## Skill Gaps`). |
| 2 | None | Plan: `Skill: None` — mechanical grep-derived sweep. TDD: no. |
| 3 | None | Plan: `Skill: None` — dev-repo README keeps its own ADR format (file-local; `create-architecture-doc` targets consumer-repo `index.md`). TDD: no. |

No plan-mapped skill was skipped: all three in-scope steps are `Skill: None` by the plan's Skill
Mapping. (Step 4's `Follow release-plugin` is out of this round's scope — main-session-owned.)

## Deviations from Plan
- **Added `mine-architecture` to the parenthetical member enumeration in
  `mine-verify-cover/SKILL.md` (lines 474–475).** The plan's Step 2 table scoped this file to
  `10-row` → `11-row` only. The adjacent enumeration would otherwise be a stale sentence the sweep
  left inconsistent with the new count (exactly the "stale adjacent sentences" prose-review angle in
  this dispatch). Minimal, consistency-preserving addition; no member-count grep string touched. The
  enumeration was already non-exhaustive (it omits the head `mine-verify-cover` and the
  `mine-from-spec` mode), so this keeps it a complete list of the non-head members.

## Self-Review

**Method.** This is a prose-only diff (skill text + ADR prose — no runtime source), so PROSE review
angles were run, not code review: internal consistency, dangling cross-references, dropped/narrowed
guarantees vs the tech-spec required-content list, directional references vs final layout, and stale
adjacent sentences the sweep didn't touch. Executed as **two parallel `general-purpose` finder
subagents** over the changed files; each finding was then verified in-context before disposition.

**Round 1 (baked into this dispatch).**
- **Finder A — internal consistency + dangling cross-references + ADR directional refs: NO
  FINDINGS.** Confirmed all seven `§` pointers in `mine-architecture/SKILL.md` resolve to real
  headings in `mine-family-core.md`; the cited shipped path `tools/evidence-gate.mjs` and its export
  `structuralEvidenceOk` exist on disk; the sweep grep returns 0 hits; `mine-family-core.md`'s prose
  member list, 11-row table, and invariant line all agree on eleven; the "the latter two are
  name-and-shape members" anaphora still binds to `mine-skill-gaps` + `mine-skill-candidates`;
  ADR-67 is the correct next-free number, the "sixth registry species" enumeration lists exactly
  five priors, and all cited ADRs are coherent with their index titles.
- **Finder B — dropped/narrowed guarantees vs tech-spec + internal contradictions: NO FINDINGS.**
  Walked the tech-spec and plan Step 1 required-content lists item-by-item; every item present at
  full strength, no weakening; dimension count, member count, and species count stated consistently.
- **One borderline item raised by Finder B and dismissed:** the "~145 findings" scale datapoint in
  the SKILL.md's execution-topology sizing conflates the reference-model *shape* with the debt-mine
  *pilot* that exercised it. Verified against the canonical source (`mine-family-core.md` §Execution
  topology, which itself states "one consolidate+skeptic held at roughly 145 findings on the
  debt-mine pilot") — the wording is faithful to canon, not a weakened guarantee. **Dismissed — not
  a defect.**

**My in-context re-verification (independent of the finders).** Re-ran the sweep grep (0 hits), the
positive control (`eleventh mine` hits only `mine-architecture/SKILL.md`), the carve-out check
("ninth mine"/"tenth mine" intact), `skill-lint` over all nine touched skill folders (all `OK`, exit
0), the `mine-family-core.md` table-row count (11 data rows) and `mine-architecture`'s three correct
placements, and the ADR-67 count (2) with the ADR-66-claimed-by-F15 disclosure. All pass.

**Verdict: PASS — prose review clean (0 findings across both parallel finders + my re-verification);
1 borderline item examined and dismissed with reason; Steps 1–3 meet every acceptance gate. Ready
for Step 1 done-check.**

*Status: COMPLETE — developer, 2026-07-20*
