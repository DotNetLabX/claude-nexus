# F28-RegenerateUnit — Implementation

## Files Created
- `plugins/nexus/skills/regenerate-unit/SKILL.md` — the program-home regeneration skill (Step 1).
  Self-contained (no docs/specs/ dependency): inlines the full tech-spec §Method as Stages 1–6, the
  four fail-closed preflight gates, cluster mode (G1 HALT semantics + orphaned-registry
  dispositions), the calibration-ledger mechanism + 4 seeded rulings, the owner-ratified stage-model
  pins, the ≤3 repair loop (registry-gap vs generation-slip), the files-read + declared-ambiguities
  honesty outputs, the adoption-standalone rule, the report shape, and the sibling-skill relationship
  table. `user-invocable: true`. No scripts/assets (agent-orchestrated loop, per plan Decision).

## Files Modified
- `docs/programs/br-anchored-regeneration.md` (Step 3) — two edits, re-grounded against the live
  2026-07-22 §7 rewrite:
  - **§5 (lines 140–141):** the S1/S2 sentence now marks **both** shipped in one edit — S1
    `regenerate-unit` (nexus 1.43.0, this release), S2 `mine-oracle-strength` (nexus 1.42.0). Repairs
    the half-stale line F29's ship left (F29 did not update §5). The S3-prototypes clause kept.
  - **§7 item-1 Build queue (lines 186–189):** F28 removed from the arrow-chain (now `F27
    conventions pipeline → F30/F31; …`) and a shipped note appended verbatim per plan — "F28
    `regenerate-unit` shipped (this release — cluster mode G1 + G2/G3 preflight gates live)". Item 1
    IS the edit site (the plan's HIGH-1 re-grounding; the old from-memory "item 3 fast-track list"
    no longer exists in the live doc).
  - DO-NOT-TOUCH honored: `twelve mines shipped` count untouched (F28 is not a mine), §7 items 2
    (LEAD) / 3 (PARKED) / 4 intact, §2 experiment table and §5 campaign narrative untouched. No
    backlog edit (row flips at lane close with the sha, per house precedent).
- `plugins/nexus/.claude-plugin/plugin.json` (Step 4) — version `1.42.2 → 1.43.0` (MINOR,
  owner-escalated — new shipped skill). Dry-run reasons named ONLY `regenerate-unit` (no
  contamination); applied with `--minor`.
- `plugins/nexus/CHANGELOG.md` (Step 4) — new `[1.43.0]` entry describing the program-home
  regeneration skill, the G1/G2/G3 fold, the D1 boundary, the F29-seam consumption, and the program
  doc updates (replaced the generated stub).

## Key Decisions
- **Stage numbering = tech-spec §Method 1–6 verbatim.** Stage 1 Preflight, Stage 2 Contract pack,
  Stage 3 Clean-room generation, Stage 4 Hidden-oracle + repair, Stage 5 PROVE, Stage 6 Report +
  adoption. Matches the plan's "stages 1–6" and the acceptance grep (`^## Stage [1-6]` → 6 hits).
- **Structural reference = the sibling F29 skill** (`mine-oracle-strength/SKILL.md`, freshly shipped
  same-program) rather than a from-scratch layout — the plan's Step-1 skill mapping is `None` (gap:
  program-home skill-authoring recipe, logged to lessons). Mirrored its frontmatter shape, stage-pin
  table, safety-rails / does-NOT / relationship-table sections, and the fenced-block presentation of
  the consumed report seam.
- **Step 2's observed catalog columns REPLACE the §Method placeholder row shape (never both).** The
  live campaign #2 catalog (`D:\omnishelf\omnishelf_flutter_app\docs\golden-seam-catalog.md`, read
  today at HEAD `7ab2c70f5`) has columns `unit | layer | registry | rules | gated | seam |
  byte-comparable? | wave-scope` and taxonomy `either-serialize | flow-golden:{flow} | file-write |
  none`. These are inlined in §Golden-seam catalog contract; the §Method placeholder
  ("seam kind (byte-seam | void/file-write | none), oracle location") is deliberately absent
  (grep `byte-seam` → 0 hits confirms).
- **F28's terminal report given its own stable section names** (`## Verdict / ## Shape / ## Residuals
  / ## Registry-Gap / ## Gate-Gaps / ## Perf / ## Adoption`). The tech-spec does not mandate a
  consumed-seam grammar for F28's own report (unlike F29's, which F28 greps); these names are a clean
  faithful rendering of the §Method Stage-6 contents (GO/NO-GO, N-way shape table, residuals incl.
  the unpinned-log-text class, registry-gap findings, declared gate gaps, G3 bench line).

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan Skill Mapping: `(none)`, TDD no. Gap logged to lessons.md ## Skill Gaps (program-home skill-authoring recipe). Prose/docs step — no runtime code. |
| 2 | None | plan Skill Mapping: `(none)`. Content folded into Step 1's SKILL.md; verified by live greps (F29 seam byte-match; live catalog columns re-read). |
| 3 | None | plan Skill Mapping: `(none)`, TDD no. Program-doc line edits; targets re-verified against live file before editing. |
| 4 | release-plugin | plan Skill Mapping: `Follow release-plugin`. Invoked via Skill tool; ran `--dry-run` (reasons = regenerate-unit only), then `--minor` → 1.43.0; CHANGELOG stub replaced. Commit/tag/twin-sync are lane-close (HARD RULE 1). |

## Deviations from Plan
- **No structural deviations.** Step 2's catalog columns were re-read from the live campaign instance
  (not trusted from the plan snapshot, per dispatch rule 4) — the live columns
  (`unit | layer | registry | rules | gated | seam | byte-comparable? | wave-scope`, taxonomy
  `either-serialize | flow-golden:{flow} | file-write | none`) matched the plan's critic-observed set
  exactly, so no delta. Step 3's §5 and §7 targets were re-verified against the live file before
  editing (dispatch rule 5) — the live structure matched the plan's re-grounded line targets, no
  adaptation needed.
- **Lane-close steps deliberately NOT run** (HARD RULE 1 — no git writes; commit at lane close in the
  main session): `git` commit, `claude plugin tag --push`, and `scripts/gen-omni.mjs` twin-sync (the
  omni twin is a separate `../omni` repo, committed there mirroring this change). These are the
  main-session closure steps. The bump (plugin.json + CHANGELOG) is a file write, not a git write, and
  is left staged-ready per the release-plugin contract.

## Self-Review
**Verdict: PASS** (disclosed first-round review, dispatch rule 6 — prose angle set per review-format;
this is a docs/skill-text-only diff, no runtime source). `/code-review` not separately available in
this session (only `review` for GitHub PRs / `security-review`) and not applicable to a prose-only
diff — the prose angle set is the review.

- **Obligation diff (SKILL.md vs tech-spec §Method) — no dropped/silently-narrowed guarantee.** Walked
  every §Method item verbatim-equivalent: Preflight all 4 gates (registry+run-2 freshness / oracle-
  strength D1 assert-not-reimplement / golden-seam G2 "declared gate gap never silent" / perf-delta
  G3 bench line + W5 precedent); Contract pack (byte-exact ctor, NO import list, shape-directive inputs
  a–d, design-intent-at-generation-time + v3-pass evidence); Clean-room generation (forbidden set incl.
  git history + test trees + design docs; allowed set; active-rows-only + bug-preserve-verbatim; 3
  mandatory honesty outputs; analyzer-clean, no tests); ≤3 repair loop (registry-gap dated-annotation +
  "the fact never the old code" vs generation-slip; more rounds → NO-GO); PROVE (F29 invocation, six
  seam names, analyze + lizard + G3); Report (GO/NO-GO, N-way table, residuals incl. unpinned-log-text
  class, registry-gap, gate gaps); adoption-standalone (+ integration-branch) rule; cluster mode G1
  (every legacy row → home or explicit disposition, orphaned registries, unmapped-row HALT, target-cut
  waves); ledger mechanism + 4 seeded rulings; stage-model pins + asymmetry rule; D1–D4. All present.
- **Internal consistency.** Pipeline diagram, per-stage headings (Stage 1–6), and the stage-model pin
  table agree on models (1/2/6 sonnet, 3 opus, 4 fable, 5 invokes F29). D1–D4 references (Preflight
  gate 2, ledger section, golden-seam contract, Stage 5) resolve to the Decisions block.
- **Dangling cross-references.** All sibling skills cited exist (`mine-verify-cover`,
  `mine-oracle-strength`, `mine-design`, `mine-skill-candidates`); `../mine-verify-cover/references/
  mine-family-core.md` exists and is slash-preceded (lint-skipped); no `references/`/`scripts/`/
  `assets/` file-shaped cite is dangling — skill-lint OK (0 errors, 0 warnings).
- **Directional references vs final layout.** "§Golden-seam catalog contract", "§Stage-model pins",
  "§The report artifact", Stage 2 (a)/(b)/(c) back-refs all resolve to real sections/labels.
- **Stale adjacent sentences.** §5 edit's neighbours (Track A/B ratification sentence before;
  "Pilot cluster: fix-shelf" after) read cleanly with the two shipped tags. §7 item-1 lead "twelve
  mines shipped" stays correct (F28 is not a mine); the build queue no longer names F28, consistent
  with the appended shipped note. One low-severity residual carried below.

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| §7 item-2 "fix-shelf cluster pilot (needs F28)" now softenable | low | architect/team-lead | `docs/programs/br-anchored-regeneration.md:198` | With F28 shipped, "(needs F28)" could read "F28-gated (now shipped)", but item 2 is explicit DO-NOT-TOUCH (other session owns the LEAD narrative) and the pilot still needs to be *run*. Flagged, not touched. |

## Verification (Steps 1–2)
- `skill-lint.mjs plugins/nexus/skills/regenerate-unit` → `OK regenerate-unit` (clean, no warnings).
- F29 seam grep (dispatch rule 4, run against the live shipped file):
  `grep -E "## Scores|## Buckets|## Survivors|## Gap-Kill|## Pair|## Registry Annotations"
  plugins/nexus/skills/mine-oracle-strength/SKILL.md` → 6 section-name hits (lines 242–247), plus
  echoes at 105/250/319. Byte-match confirmed.
- Acceptance greps against the new SKILL.md: A1 (exists + `user-invocable: true`) PASS; stages 1–6 →
  6; four hard gates named; golden-seam gap line "declared gate gap — never silent" present;
  adoption-standalone rule present verbatim-equivalent; F29 seam six names → 6; cluster mode
  "Every legacy registry row from EVERY cluster unit" + explicit-disposition + "HALTs the run before
  generation" present; 4 ledger rulings present; stage-model pins present; `byte-seam` placeholder
  absent (0 hits).

## Verification (Steps 3–4)
- Step 3 edits verified: §5 both S1 (1.43.0) + S2 (1.42.0) marked shipped; §7 build queue has F28
  removed from the arrow-chain (`conventions pipeline → F30/F31`) + shipped note appended. DO-NOT-TOUCH
  intact: `twelve mines shipped` (1 hit, untouched), F28-in-chain removed (0 hits), item 2 (LEAD) +
  item 3 (PARKED) headings intact.
- Lint suite (glob form, plan-exact): `node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"`
  → **589 pass / 0 fail** BEFORE the bump; re-run AFTER the bump + CHANGELOG edit → **589 pass / 0
  fail** (includes the dogfood `all shipped nexus skills are lint-clean` test, which now covers the
  new skill, and `release.test.mjs` version/CHANGELOG consistency).
- Bump: `bump-plugin.mjs --dry-run` → reasons = `skill change (regenerate-unit)` ONLY (no
  contamination); `--minor` applied → `1.42.2 → 1.43.0`; `plugin.json` confirms `"version": "1.43.0"`.
- Working tree = plan-step files only (`git status --short`): M program doc, M plugin.json, M
  CHANGELOG, ?? regenerate-unit skill, ?? F28 delivery folder. No stray changes.

*Status: COMPLETE — developer, 2026-07-22*
