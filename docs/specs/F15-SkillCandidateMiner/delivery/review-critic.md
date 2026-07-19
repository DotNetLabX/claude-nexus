# Critic Review — F15-SkillCandidateMiner tech-spec (code-grounded)

**Date:** 2026-07-19 · **Mode:** spec review, code-grounded (live plugin tree + SDK fixture repo)
**Verdict:** GO-with-fixes — 2 HIGH, 5 MEDIUM; ~25 claims verified correct (every enumerated
member-count line number exact; SDK fixture facts — 7 Gaps recipes, 50 tech-debt rows — exact).
**Disposition:** all findings folded by the architect 2026-07-19 (table below); spec flipped Ready.

## Findings (critic, substance)

1. **[HIGH-1] Member-count acceptance grep broken.** The pattern `nine-member|all nine|9-row`
   cannot match "ninth mine" (ninth ≠ nine), and without `-E` the alternation is a literal pipe in
   GNU grep — the stated output ("returns only the ninth-mine line") is impossible; post-sweep the
   grep returns 0 hits.
2. **[HIGH-2] Run gate vacuous under the seed-join.** S1 seeds the 7 Gaps-table recipes as
   pre-named candidates, so "re-finds ≥3 of 7 by name" passes even with both lenses broken (seed
   citations are the Gaps file-lists, which trivially resolve). Unlike F10, whose named clusters
   were *discovered*, not seeded.
3. **[MEDIUM-1] Template mirrored into both skills = two owners for one schema** (AP3); and the
   anti-patterns section would be documented in a skill (`mine-skill-gaps`) that never emits it.
4. **[MEDIUM-2] `source` column position unspecified** — two implementers could diverge.
5. **[MEDIUM-3] Landing sites omit `mine-family-core.md:4`** — the member-enumeration parenthetical
   must gain `mine-skill-candidates` or the count-vs-list goes inconsistent.
6. **[MEDIUM-4] Two acceptance lines not pass/fail as written:** "contains no improve-skills
   invocation" fails on a correct miner (S4 must name improve-skills as route target); the
   "≥1 anti-pattern row" gate was abstract (clearest real intersection: tech-debt COR-4, the
   near-duplicate KPI-block shape).
7. **[MEDIUM-5] Process gaps:** no F15 backlog row yet (ADR-58 requires one at shaping); no ADR
   extraction planned though ADR-63 (ninth mine) is the direct precedent.

Verified-correct highlights: all 13 enumerated member-count line cites exact and the sweep list
complete (`mine-design:93,182` "nine fixed causes" correctly excluded); 8-column registry schema +
invariants as cited; ADR-62/ADR-63 as cited; improve-skills carve-out + Judgment Gate at cited
lines; Code Maat + bot-filter in mine-verify-repo as cited; SDK fixture facts exact; F15 slug free;
no command-file drift (skills generate no commands; omni twin regen scheduled).

## Architect disposition (2026-07-19)

| # | Severity | Disposition |
|---|----------|-------------|
| 1 | HIGH | Fixed — split into two greps: `-E` alternation → expect 0 hits; positive control `grep 'ninth mine'` → exactly `mine-skill-gaps/SKILL.md:20` |
| 2 | HIGH | Fixed — S1 uncorroborated-seed rule (seeds survive as marked rows, never count); run gate requires lens-produced citations (commit SHAs / file:line), never the seed file-list |
| 3 | MEDIUM | Fixed — `mine-skill-gaps` = canonical schema owner (gains `source`, stamps `artifact`); F15 points + owns only its deltas; anti-patterns section cross-referenced, not mirrored |
| 4 | MEDIUM | Fixed — `source` immediately after `kind`; full 9-column header stated once |
| 5 | MEDIUM | Fixed — `:4` member enumeration added to landing sites; SKILL.md family-core pointer stated |
| 6 | MEDIUM | Fixed — improve-skills line moved to read-verified Judgment; anti-pattern gate names COR-4 as the expected row with a named-in-report fallback |
| 7 | MEDIUM | Fixed — F15 backlog row added at Spec Ready (this pass); ADR-65 extraction added to close acceptance |
