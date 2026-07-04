# adhoc-RulesRegistry — Review

## Step 1 — Done-Check

Pre-commitment predictions (before reading implementation.md): (1) the Step-6 grep-count mismatch would
be the one real finding; (2) Step-1 external-repo evidence needed corroboration; (3) skill conformance
hinged on Step 7's lone `release-plugin` mapping. All three landed; none is a Missing step.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Move + convert omnivision registries (external repo) | Implemented | Both files moved `docs/kb/` → `docs/business-rules/{tracking,planogram}/`, converted per the Q1/Q2 rulings: hungarian.md 41 rule bullets annotated (`source: code` / `status: verified` / `last_verified: 2026-06-24` / `criticality: untagged`); levenshtein.md 18 bullets annotated under its two API-signature headings (no `## Rules` heading), `status: mutation-gated` / `last_verified: 2026-07-01`. Each file's own context sections kept, not cross-renamed. mvc-report.md appended (AC-5b artifact of record); old paths deleted. |
| 2 — cpp adapter artifact contract | Implemented | SKILL.md:118 ledger path → `docs/business-rules/<area>/<unit>.md`; :119 qualifier tightened; :31 research-pool ref untouched (Grep 3 confirms it survives); grammar references the core skill's `## The rule registry`, not `Contract R1`. AC-5a (contract half). |
| 3 — Core skill: path / retitle / inline grammar / migration note | Implemented | `## The KB rule-ledger` → `## The rule registry` + explicit landing path + full row grammar enumerated inline as THE shipped reference; Merge-stage default path re-pointed with `source:`/`last_verified` language kept (AC-6); relationship-table row updated; 3-line Flutter migration note added (AC-4). Grep 1 = 0 hits; Grep 2 = exactly 1 (the note at :265). AC-1 (file half), AC-4, AC-6. |
| 4 — kb-entry-schema species split | Implemented | `## Species boundary` note added, points to `docs/business-rules/` + the core skill's `## The rule registry` (shipped ref, not tech-spec/ADR-45). AC-3. |
| 5 — Agent hooks + command regen | Implemented | solo.md:14 / developer.md:66 / architect.md:246 re-pointed + parenthetical softened to "the class's registry at …"; trigger semantics unchanged; `gen-commands.mjs nexus` regen scoped to the 3 edited lines. AC-2. |
| 6 — Verification sweep (hard gate) | Deviated (valid reason) | Greps run and recorded verbatim. Grep 1 = 0 ✓, Grep 2 = 1 ✓. **Grep 3 = 5 vs the plan's stated "exactly FOUR"** — the 5th hit is `plugins/nexus-cpp/CHANGELOG.md:32`, the `[0.1.2]` **historical** entry's prose ("the mined BR KB … in `docs/kb/`"). This is a benign changelog hit already sanctioned by the step's **own second bullet** (CHANGELOG.md carve-out); the third bullet's whitelist simply omitted that same carve-out — a plan-acceptance defect, **not** an implementation defect. Substantive gate (zero *live ledger-path* references) holds. Developer correctly left it (changelog history is immutable). Adjudication below. |
| 7 — Version bumps | Implemented | nexus 1.21.0 → 1.21.1, nexus-cpp 0.1.3 → 0.1.4 (both PATCH, via `release-plugin`); both CHANGELOGs name `docs/business-rules/<area>/<unit>.md` + the row grammar (AC-5a). |

**Skill conformance (scored against `.claude/audit/skill-invocations.log`):** PASS. Sole non-`None`
mapping is Step 7 → `release-plugin`; the scoped window (agent `developer`, token `developer:implement`,
session `8e610d22…`, 2026-07-04) contains exactly that invocation (log line 121, `nexus:release-plugin`).
`## Skills Used` is present and its self-report is corroborated by the log — no fabrication, no missing
invocation. Steps 1–6 are legitimately `Skill: None` (contract-text/doc edits), so the log-based check
does not apply to them.

**Carry-over finding adjudication (Step 6, low severity, origin = design):** the finding is **valid and
the developer's handling was correct**. The extra Grep-3 hit is immutable changelog history, not a live
ledger-path directive, and the plan's own second bullet already whitelists CHANGELOG.md files — so the
third bullet's "exactly FOUR" was internally inconsistent with the second. This does not lower the
verdict: the step's real gate (zero live ledger-path references outside the sanctioned set) is met. I have
amended plan Step 6's third bullet to carry the same CHANGELOG.md carve-out as its second, closing the
inconsistency for the record and for the successor slices that re-run this grep.

**Out-of-scope, correctly deferred (not findings):** `gen-omni --check` FAILs (twin drift) — the plan's
closing line assigns omni-twin sync to the team lead/owner at close; the selfcheck `gen-commands`/`tests`/
`bump-plugin --check`/`spec-diff` rows all PASS. No scope creep: the only extra touch is a same-file
boy-scout fix restoring an intro line the bump tool displaced in nexus-cpp CHANGELOG.md (disclosed).

**Verdict: PASS** — all 7 steps Implemented or Deviated (valid reason); skill conformance passes; no
Missing step.

*Status: COMPLETE — architect, 2026-07-04*

## Step 2 — Code Review

## Reviewed By
reviewer — code-grounded pass per the architect's note: re-ran the Step-6 greps against live source
(not trusted from implementation.md), read every edited SKILL.md/agent file in full, and verified all
external-repo (omnivision) filesystem facts with PowerShell (never Bash, per the plan's sandbox-fabrication
constraint). **Cycle 1/3 re-review (below):** re-verified the 3 applied fixes (reviewer's MEDIUM + 2
Codex-confirmed LOWs) with fresh PowerShell evidence and checked adjacent content for regressions.

## Verdict: APPROVED (re-affirmed after Cycle 1 fix verification)

## Pre-commitment Predictions
1. The Step-6 grep-count mismatch (Carry-Over Finding) would be the one real residual item — **landed as
   a non-issue**: re-ran all three greps myself; counts match implementation.md exactly (0 / 1 / 5), and
   the architect's plan amendment (Step 6 bullet 3 now carries the same CHANGELOG.md carve-out as bullet
   2) is confirmed live in `plan.md`'s diff.
2. Step 1's external-repo claims (file moves, row counts, dates) would need independent corroboration
   since Bash is known to fabricate filesystem facts for this exact repo — **worth the check**: PowerShell
   `Test-Path`/`Select-String` confirm both old paths gone, both new paths present, and exact row counts
   (41 hungarian / 18 levenshtein `source: code` + `criticality: untagged` occurrences, matching
   implementation.md's claimed count precisely).
3. Skill/hook re-pointing (Step 5, three agent files + generated commands) was mechanical and low-risk —
   **confirmed low-risk**: `git diff HEAD` on all three command files shows exactly the one changed line
   each, byte-identical to the corresponding agent-file edit.
4. Not predicted: tracing the full content of the external mvc-report.md (not just grepping for the new
   section) surfaced one MEDIUM finding — a stale sibling pointer the new section directly contradicts.
   See Findings below.

## Findings

### [MEDIUM] Stale "BR registries (live)" pointer in mvc-report.md contradicts the migration entry three lines above it
**File:** `D:\omnishelf\omnivision-ai-sdk\docs\specs\mvc-tests\delivery\mvc-report.md:192` (pre-existing
`## Artifacts` section, three lines below the new `## Registry migration (adhoc-RulesRegistry,
2026-07-04)` section added at line 160)
**Origin:** implementation
**Issue:** The new Step-1 entry (line 160-187) correctly states both registries moved and "No copies left
at the old `docs/kb/` paths" (line 181). Three lines later, the pre-existing `## Artifacts` section still
asserts (present tense, "live"): `**BR registries (live):** \`docs/kb/levenshtein.md\` (**mutation-gated**)
· \`docs/kb/hungarian.md\` (verified)`. I verified with PowerShell that both of these paths no longer exist
(`Test-Path` → `False` for both) — a reader following this pointer hits a 404. This directly contradicts
the entry the developer just finished writing in the same file, in the same edit session. The developer's
own rationale ("the historical run data **above** this section... is left as-written") explicitly scoped
the preserve-as-is treatment to the sections *above* the new entry (Verdict/Mine/Verify/Cover/Gate/
Incidents/Cost/Grand totals) — `## Artifacts` sits *below* the new entry and uses present-tense "(live)"
language, so it isn't covered by that same rationale, yet it wasn't updated or flagged. This wasn't logged
as a Carry-Over Finding either, unlike the (correctly handled) Step-6 grep mismatch.
**Fix:** Update the `## Artifacts` bullet to point at the new paths (`docs/business-rules/tracking/
hungarian.md`, `docs/business-rules/planogram/levenshtein.md`), or at minimum add a forwarding note
("moved — see `## Registry migration` above"). Low blast radius (external-repo report narrative, not a
shipped nexus contract, not consumed by any automated gate), so this doesn't block merge — recommend as a
same-slug follow-up edit or fold into the next omnivision MVC touch.
**Confidence:** 90/100
**Status (Cycle 1):** RESOLVED — verified fresh via PowerShell, see `## Re-Review (Cycle 1/3)` below.

## Positive Observations
- Every plan acceptance grep re-verified independently against live source matches implementation.md's
  reported output exactly (0 / 1 / 5 for the three Step-6 sweeps; 0 for `Contract R1` across all plugins;
  0 / 3 for Step 3's `KB rule-ledger` / `docs/business-rules/` gates) — no fabricated or stale evidence.
- The core skill's `## The rule registry` section (mine-verify-cover/SKILL.md:244-266) is a clean,
  self-contained shipped grammar reference exactly as HIGH-2 of the plan review demanded — every other
  edited file (cpp adapter, kb-entry-schema, both omnivision registries) points at it rather than at
  `Contract R1`/ADR-45/the tech-spec.
- Row-level conversion in both omnivision files is faithful to the "annotated bullet, never a table
  rebuild" instruction: exact counts (41/18) confirmed by direct grep of the converted files themselves,
  not just trusted from the developer's self-report; verified prose (IMPRECISE corrections, `[OBS]`/`[INT]`/
  `[DEAD]` tags, MUTATION NOTE) preserved verbatim; each file's own non-rule context sections kept
  distinct (hungarian's `Key Files/Edge Cases/Source` vs levenshtein's `Mutation targets/Asserting editops
  safely/Source`) per the architect's Q1 ruling.
- Step 7's CHANGELOG entries were deliberately phrased to avoid re-tripping the Step-6 gate they describe
  the retirement of (verified: 0 hits for both banned literal strings across all shipped text) — a subtle
  trap correctly anticipated and handled, and disclosed in Key Decisions rather than silently done.
- `claude plugin validate --strict` passes fresh for both `nexus` and `nexus-cpp`; `bump-plugin --dry-run`
  correctly shows the known "current+1" false-dirty signal (0.1.4→0.1.5, 1.21.1→1.21.2) rather than
  proposing a phantom re-bump, consistent with the repo's uncommitted-bump-rides-within convention.
- No scope creep: `git status` shows edits confined to the two plugins' shipped files + version/CHANGELOG
  bumps; `nexus-dotnet`/`nexus-flutter` untouched, confirmed by fresh grep.

## Gaps
- The pre-existing `docs\kb\` directory in the omnivision repo survives as an empty folder after both
  files were moved out of it (confirmed via PowerShell `Test-Path`/`Get-ChildItem`) — harmless (git doesn't
  track empty directories; nothing reads from it), not worth a finding.
- The omnivision repo's `docs/` tree is entirely untracked in its own git history (pre-existing across
  prior features, not introduced by this pass) — external-repo commit hygiene is out of scope for this
  plan and not this feature's defect.

## Open Questions
(none — no finding scored below the 80-confidence cutoff)

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Grep 1 (directive form) | pass | `grep -rn "docs/kb/golden/{Class}.md" plugins/` | 0 hits (matches implementation.md) |
| Grep 2 (bare form) | pass | `grep -rn "docs/kb/golden" plugins/` | 1 hit, `mine-verify-cover/SKILL.md:265` (matches) |
| Grep 3 (cross-plugin sweep) | pass | `grep -rn "docs/kb" plugins/nexus-dotnet/ plugins/nexus-flutter/ plugins/nexus-cpp/` | 5 hits — 4 sanctioned research/index + 1 sanctioned CHANGELOG historical (matches, Carry-Over Finding correctly adjudicated) |
| Contract R1 leak check | pass | `grep -rn "Contract R1" plugins/` | 0 hits |
| Step 3 gates | pass | `grep -c "KB rule-ledger"` / `grep -c "docs/business-rules/"` on core SKILL.md | 0 / 3 (≥2 required) |
| cpp adapter gates | pass | Read `mine-verify-cover-cpp/SKILL.md:31,118-123` | line 31 untouched; 118-120 emit new path + reference core skill |
| Agent hooks + command regen | pass | `git diff HEAD` on 3 agent files + 3 generated command files | 1 line changed each, byte-identical pairs |
| External repo — old paths gone | pass | PowerShell `Test-Path docs\kb\hungarian.md`, `docs\kb\levenshtein.md` | both `False` |
| External repo — new paths exist | pass | PowerShell `Test-Path docs\business-rules\tracking\hungarian.md`, `...\planogram\levenshtein.md` | both `True` |
| Row-count fidelity | pass | PowerShell `Select-String -Pattern "source: code"` / `"criticality: untagged"` on both converted files | 41/41 hungarian, 18/18 levenshtein |
| Plugin validation | pass | `claude plugin validate --strict` (nexus, nexus-cpp) | both "Validation passed" |
| Version bumps | pass | `grep '"version"' plugin.json` (both) | nexus 1.21.1, nexus-cpp 0.1.4 |
| Repo selfcheck | pass (4/5, 1 expected fail) | `node scripts/selfcheck.mjs` | tests/gen-commands/bump-plugin/spec-diff PASS; gen-omni FAIL (expected, owner-owed at close per plan) |
| Bump-plugin dry-run sanity | pass | `node scripts/bump-plugin.mjs --dry-run` | shows current+1 (known false-dirty signal), not a re-bump cue |
| Build | N/A — no runtime surface | — | contract-text/doc-only feature per plan's Testing Strategy |

## Re-Review (Cycle 1/3)

Scope per the team lead's routing: the 3 applied fixes only (reviewer's MEDIUM + 2 Codex-confirmed LOWs),
recorded in `implementation.md` `## Fix Cycle 1`. All three are external-repo (omnivision) text edits.
Re-verified fresh with PowerShell (never Bash, per the plan's binding constraint) — not re-trusted from
implementation.md's self-reported verification block.

| # | Severity | Finding | Fix claimed | Independently re-verified | Result |
|---|----------|---------|-------------|---------------------------|--------|
| 1 | MEDIUM | `mvc-report.md:192` `## Artifacts` still named the retired `docs/kb/{hungarian,levenshtein}.md` paths "(live)" | Re-pointed to `docs/business-rules/{tracking,planogram}/...` | `Select-String mvc-report.md -Pattern "BR registries"` → line 192 now reads `docs/business-rules/planogram/levenshtein.md` (mutation-gated) · `docs/business-rules/tracking/hungarian.md` (verified) | **Confirmed fixed** |
| 2 | LOW | `mvc-report.md:167` said "42 `## Rules` bullets", contradicting the correct "41 `source: code` hits" 17 lines later (:184) | "42" → "41" | Read lines 145-197 fresh: line 167 now reads "the file's 41 `## Rules` bullets were each converted" | **Confirmed fixed** |
| 3 | LOW | `hungarian.md:1` / `levenshtein.md:1` still self-labeled `# KB — {Concept}` after the artifact-species move | Retitled to `# Business Rules — {Concept}` | `Select-String -Pattern "^# "` on both files → `# Business Rules — Hungarian assignment solver (...)` and `# Business Rules — Levenshtein edit distance (...)` | **Confirmed fixed** |

**Adjacent-area regression check** (per the rubber-stamp anti-pattern — not just the exact changed lines):
- Row counts re-counted after the heading edit: still exactly 41 `source: code` hits in `hungarian.md`,
  18 in `levenshtein.md` — the heading-only fix (#3) didn't disturb the row content below it.
- `## Grand totals` (mvc-report.md:151) still reads "42 Hungarian" — checked this is NOT a regression of
  fix #2: it's a different unit (42 = distinct mined rule-ID count, including BR-37 used for two separate
  facts) vs. 41 = physical bullet count (one bullet groups BR-2/BR-35/BR-37(print) together) — the same
  42-vs-41 reconciliation already validated in the original pass. Both numbers are independently correct;
  fix #2 correctly touched only the bullet-count line (:167), not this rule-ID-count line.
- No orphaned reference to the old `# KB — Hungarian`/`# KB — Levenshtein` title text remains in
  `mvc-report.md` (grepped clean) or elsewhere in the nexus repo's *live* text — the only two hits left
  (`docs/specs/adhoc-MineVerifyCppAdapter/delivery/kb-hungarian.md`, `kb-levenshtein.md`) are frozen
  evidence snapshots from a prior feature's delivery folder, out of scope for this slug (same immutable-
  history class as the CHANGELOG carve-outs already adjudicated).
- Section structure below each renamed heading (`## Rules`, `## Key Files`, `## Edge Cases`, `## Source`
  in hungarian.md; the two API-signature headings in levenshtein.md) is untouched — the fix was heading-
  only, as claimed.

**Out-of-scope items correctly not actioned** (per the team lead's routing, confirmed appropriate):
Codex's merge-side/harness blocker (deferred successor slice, not this slice's contract), the levenshtein-
grammar structure finding (already adjudicated by the architect's Q1 ruling), and the delivery-docs-stale
claim (audit-trail chronology — implementation.md/review.md correctly describe state *as of when written*,
not retroactively wrong after a later plan amendment). No re-litigation needed — the routing rationale
holds up against a fresh read of each.

**Disposition:** All 3 fixes confirmed applied and correct with fresh evidence; no regressions found in
adjacent content. No new findings from the re-review. Nothing outstanding at CRITICAL/HIGH or MEDIUM/LOW.
Verdict unchanged from `## Verdict` above (the original APPROVED was never blocked by the MEDIUM/LOWs;
Cycle 1 closes out all three as fixed) — see the single verdict line at the top of this section, now
updated to note the re-affirmation.

*Status: COMPLETE — reviewer, 2026-07-04 (Cycle 1/3 re-review)*
