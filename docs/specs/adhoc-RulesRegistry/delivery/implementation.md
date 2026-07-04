# adhoc-RulesRegistry — Implementation

## Files Created
- `D:\omnishelf\omnivision-ai-sdk\docs\business-rules\tracking\hungarian.md` — Step 1: moved from
  `docs\kb\hungarian.md`, converted. All 41 rule bullets (BR-1..BR-42, excluding the non-rule MUTATION
  NOTE) annotated in place with `source: code; status: verified; last_verified: 2026-06-24;
  criticality: untagged`. `Key Files` / `Edge Cases` / `Source` sections kept unchanged below the rows.
- `D:\omnishelf\omnivision-ai-sdk\docs\business-rules\planogram\levenshtein.md` — Step 1: moved from
  `docs\kb\levenshtein.md`, converted. All 18 rule bullets (LV-1..LV-18) annotated in place with
  `source: code; status: mutation-gated; last_verified: 2026-07-01; criticality: untagged`. No
  `## Rules` heading in this file — rules sit under the two API-signature headings, annotated there.
  `Mutation targets` / `Asserting editops safely` / `Source` sections kept unchanged, not renamed to
  match hungarian's section names (architect's Q1 ruling).

## Files Modified
- `D:\omnishelf\omnivision-ai-sdk\docs\specs\mvc-tests\delivery\mvc-report.md` — appended a new
  `## Registry migration (adhoc-RulesRegistry, 2026-07-04)` section at the end recording the move+convert
  (AC-5b's artifact of record). Append-only — the historical run data above it (dated pre-migration) is
  left as-written, not retroactively edited.
- `D:\omnishelf\omnivision-ai-sdk\docs\kb\hungarian.md`, `…\docs\kb\levenshtein.md` — deleted (moved, no
  copies left at old paths).
- `plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md` — Step 2: line 118 ledger-emission path
  `docs/kb/<class>.md` → `docs/business-rules/<area>/<unit>.md`; line 119 qualifier tightened from
  "(`kb-entry-schema` shape)" to "(registry rows over `kb-entry-schema` context sections — row grammar
  defined in `mine-verify-cover`'s `## The rule registry` section)" — a forward reference to the section
  Step 3 creates in the core skill (both steps land in the same implementation round). Line 31
  (`docs/kb/research/…`) untouched — verified.
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — Step 3, three edits: (1) retitled `## The KB
  rule-ledger` → `## The rule registry`, added the explicit landing path
  `docs/business-rules/<area>/<unit>.md`, enumerated the full row grammar inline as THE shipped
  reference (`source:`, `status:` incl. `divergence-pending-triage`, `criticality:` incl. `untagged`,
  `last_verified:`), kept the durable-prose/no-line-numbers/status-flip content, added the 3-line
  Flutter migration note naming the old `docs/kb/`/`docs/kb/golden/` paths; (2) the Merge-stage
  canonical-registry sentence's default path `docs/kb/golden/{Class}.md` →
  `docs/business-rules/<area>/<unit>.md`, `source:`/`last_verified` mandatory language kept intact
  (AC-6); (3) the `## Relationship to other skills` table's `kb-entry-schema` row updated to point at
  the registry's non-row context sections instead of "the KB rule-ledger shape."
- `plugins/nexus/skills/kb-entry-schema/SKILL.md` — Step 4: added a `## Species boundary` note (after
  the intro, before `## Required Sections`) disambiguating KB entries (`docs/kb/…`, this schema) from
  the mined/merged rule registry species (`docs/business-rules/<area>/<unit>.md`, row grammar defined
  in `mine-verify-cover`'s `## The rule registry`). No other content changed.
- `plugins/nexus/agents/solo.md:14`, `developer.md:66`, `architect.md:246` — Step 5: attestation-drift
  hook re-pointed `docs/kb/golden/{Class}.md` → `docs/business-rules/<area>/<unit>.md` and softened the
  parenthetical from "a C2 attestation record at …" to "the class's registry at …" in all three. Trigger
  semantics (attested golden set, forward conditional, C2 rebase-is-successor language) left as-written.
- `plugins/nexus/commands/{architect,developer,solo}.md` — Step 5: regenerated via
  `node scripts/gen-commands.mjs nexus`; diff confirmed scoped to exactly the 3 edited lines (1 line
  each), no other drift.
- `plugins/nexus-cpp/.claude-plugin/plugin.json` — Step 7: version 0.1.3 → 0.1.4 (PATCH, via
  `bump-plugin.mjs`, matches plan's specified target).
- `plugins/nexus-cpp/CHANGELOG.md` — Step 7: new `[0.1.4]` entry (hand-written to replace the tool's
  stub bullet list), naming `docs/business-rules/<area>/<unit>.md` + the row grammar fields (AC-5a's
  grep target). Also fixed a pre-existing formatting artifact from the bump tool: it had inserted the
  new entry above the file's "All notable changes…" intro line, orphaning that sentence mid-file —
  restored it to directly under the H1 title (boy-scout, same file already touched).
- `plugins/nexus/.claude-plugin/plugin.json` — Step 7: version 1.21.0 → 1.21.1 (PATCH, via
  `bump-plugin.mjs`).
- `plugins/nexus/CHANGELOG.md` — Step 7: new `[1.21.1]` entry (hand-written) naming
  `docs/business-rules/<area>/<unit>.md`, the row grammar, and all four edited shipped files.
- `D:\omnishelf\omnivision-ai-sdk\docs\specs\mvc-tests\delivery\mvc-report.md` — **Fix Cycle 1** (reviewer
  MEDIUM + Codex major, merged): (a) `## Artifacts` list (~:192) updated from the stale, present-tense
  `**BR registries (live):** docs/kb/levenshtein.md (mutation-gated) · docs/kb/hungarian.md (verified)` —
  both paths had already been deleted by Step 1 — to
  `docs/business-rules/planogram/levenshtein.md` / `docs/business-rules/tracking/hungarian.md`;
  (b) the Registry-migration section's own conversion count (~:167) corrected from "42" to "41" `## Rules`
  bullets, matching the section's own already-correct count three lines below it ("41 `source: code` hits
  in hungarian.md"). Both fixes are prose/pointer corrections only — no row content, dates, or the
  Q1-preserved prose touched.
- `D:\omnishelf\omnivision-ai-sdk\docs\business-rules\tracking\hungarian.md`,
  `…\planogram\levenshtein.md` — **Fix Cycle 1** (reviewer/Codex LOW/minor): line-1 self-label retitled
  from `# KB — {Concept}` to `# Business Rules — {Concept}`, matching the artifact-species split to
  `docs/business-rules/` the whole slug is about. Content below the title (all 41/18 annotated rule
  rows, prose, context sections) untouched — same Q1 preserve-prose ruling as Step 1.

## Key Decisions
- **Step 7's CHANGELOG entries were phrased to avoid re-tripping Step 6's own sweep.** My first draft of
  both `[0.1.4]`/`[1.21.1]` entries literally quoted the retired directive-form path
  (`docs/kb/golden/{Class}.md`, `docs/kb/<class>.md`) to describe what changed. Since these are entries
  I'm authoring fresh right now (unlike the pre-existing nexus-cpp `[0.1.2]` historical hit, which is
  immutable history — see the Carry-Over Finding below), I control the phrasing, so I reworded both to
  describe the change without repeating the exact retired strings (e.g., "old per-class registry path"
  instead of quoting `docs/kb/golden/{Class}.md`; "the old per-class KB path" instead of quoting
  `docs/kb/<class>.md`). Re-ran Grep 1/2/3 after the rewrite — Grep 1 is back to 0 hits, Grep 2 back to
  exactly 1 hit (no new CHANGELOG additions to that whitelist), Grep 3 unchanged at 5 hits (only the
  pre-existing historical `[0.1.2]` line, now shifted to `:32`, remains — same Carry-Over Finding as
  before, not a new one).
- **MUTATION NOTE bullet in hungarian.md left unannotated.** It's not a `BR-#`-tagged rule row — it's
  cross-cutting guidance about BR-29/30/31 (the `exit(0)` false-survivor trap), so it isn't itself a
  Contract R1 row. Only bullets carrying an actual rule identifier were converted. Confirmed by count:
  41 annotated bullets in hungarian.md matches 41 non-MUTATION-NOTE rule bullets in the source (42
  consensus rules total per the file header, with one number — BR-37 — legitimately appearing in two
  distinct bullets covering different aspects, consistent with the original file).
  9 (setup) + 20 (solve) + 4 (doublecheck, MUTATION NOTE excluded) + 4 (cost/cleanup) + 4
  (constants/dead-code) = 41.
- **Old per-row status footers (`<!-- mutation-gated: … -->`) kept as-is in both files.** The plan's
  edit list for Step 1 didn't direct removing them, and they're harmless historical metadata now
  superseded by the per-row `status:`/`last_verified:` fields — not conflicting with the new rows.
- **mvc-report.md's historical Verdict/Mine/Verify/Cover/Gate sections (which still say
  `docs/kb/hungarian.md` / `docs/kb/levenshtein.md`) were left untouched.** The plan's instruction was to
  *append* an entry recording the move, not retroactively edit the historical run record — mirrors the
  registry's own append-only-changelog invariant (Contract R1). The new appended section is the current
  source of truth for where the files live now.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan: `Skill: (none)`, TDD: no — external-repo doc move+convert, no runtime behavior |
| 2 | None | plan: `Skill: (none)`, TDD: no — contract-text edit |
| 3 | None | plan: `Skill: (none)`, TDD: no — contract-text edit |
| 4 | None | plan: `Skill: (none)`, TDD: no — contract-text edit |
| 5 | None | plan: `Skill: (none)`, TDD: no — hook re-point + generated-command regen |
| 6 | None | plan: `Skill: (none)`, TDD: no — verification sweep (greps only, no edits) |
| 7 | release-plugin | Followed exactly: `--dry-run` classify → judgment (PATCH matches plan, no escalation) → apply → hand-edited both CHANGELOG stubs → `claude plugin validate --strict` on both plugins (pass) |

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Step 6's third grep whitelist ("exactly FOUR sanctioned hits") is missing the CHANGELOG.md carve-out that the second grep bullet already grants | low | architect | Live `grep -rn "docs/kb" plugins/nexus-dotnet/ plugins/nexus-flutter/ plugins/nexus-cpp/` returns **5** hits, not 4 — the extra is `plugins/nexus-cpp/CHANGELOG.md:32` (line shifted from `:21` after Step 7's new entry was inserted above it), the `[0.1.2]` entry's "the mined BR KB in the consuming repo's `docs/kb/`" (a truthful historical record of what that version shipped). | Treated as sanctioned — same append-only-changelog class the plan's second grep bullet already whitelists for CHANGELOG.md files; not a live ledger-path reference, so Step 6's substantive goal (zero live hits) still holds. Not edited (changelog history is immutable). Recommend the plan's Step 6 third bullet be amended to add the same CHANGELOG.md carve-out, matching the second bullet's language, so future re-runs of this grep don't re-trip on this same benign hit. Re-confirmed after Step 7 landed its own new CHANGELOG entries (which I phrased to avoid adding further hits — see Key Decisions). |

## KB Changes

(none in this repo — Step 1 touches the external omnivision repo only; see Files Created/Modified above)

## Step 6 — Verification Sweep (verbatim grep output, re-run after Step 7 to confirm final state)

**Grep 1** — `grep -rn "docs/kb/golden/{Class}.md" plugins/` → **0 hits.** (command exit 1, no matches)

**Grep 2** — `grep -rn "docs/kb/golden" plugins/` → **1 hit** (matches plan's "exactly 1 hit" expectation):
```
plugins/nexus/skills/mine-verify-cover/SKILL.md:265:`docs/kb/golden/` migrate to `docs/business-rules/` on that repo's next campaign touch; until then,
```

**Grep 3** — `grep -rn "docs/kb" plugins/nexus-dotnet/ plugins/nexus-flutter/ plugins/nexus-cpp/` → **5 hits**
(plan expected exactly 4 — see Carry-Over Finding above for the 5th):
```
plugins/nexus-dotnet/skills/improve-architecture/SKILL.md:35:Read `docs/kb/index.md` and relevant entries. Complex business rules with many edge cases suggest the logic may be scattered across multiple handlers instead of consolidated in the domain.
plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md:30:Grounding: `docs/kb/research/dart-flutter-test-trust-anchor.md` in the nexus dev repo (hands-on confirmed).
plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md:163:`example/config.xml` (`docs/kb/research/mutation-test-dart-line-range-scoping.md`). So the **targeted
plugins/nexus-cpp/CHANGELOG.md:32:  `docs/kb/` (verified → mutation-gated on green). Also pins the `mine-code`/`mine-spec` folder split.
plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md:31:Grounding: `docs/kb/research/cpp-mutation-and-test-tooling.md` in the nexus dev repo (hands-on confirmed); proven end-to-end on the omnivision SDK — see `docs/specs/adhoc-MineVerifyCppProbe` + `adhoc-MineVerifyCppAdapter`.
```
All 4 plan-enumerated hits present (dotnet `improve-architecture:35`, flutter `:30`/`:163`, cpp `:31`) +
the 1 sanctioned historical CHANGELOG hit (line number shifted `:21`→`:32` by Step 7's own insertion
above it, otherwise unchanged). Zero ledger-path (`docs/kb/<class>` or `docs/kb/golden`) hits among them
— the substantive goal of Step 6 (zero live ledger-path references outside the sanctioned set) holds,
confirmed both immediately after Step 6 and again after Step 7 landed its CHANGELOG entries.

**Repo selfcheck** (`node scripts/selfcheck.mjs`) run for a broader sanity pass: `tests` PASS,
`gen-commands drift` PASS (in sync — confirms Step 5's regen), `bump-plugin --check` PASS (confirms
Step 7's bump is present), `spec-diff inline-copy sync` PASS. `gen-omni --check` FAILs (twin drifted) —
expected and out of scope: the plan's closing line assigns omni twin sync to the team lead/owner at
close, not to a plan step.

## Deviations from Plan

(none — Steps 1-7 executed exactly as specified in the plan after the architect's Q1/Q2 answers; the
Step-6 grep-count mismatch is recorded above as a Carry-Over Finding, not a deviation — no code or text
was changed differently than instructed; Step 7's CHANGELOG phrasing choice is recorded above as a Key
Decision, not a deviation, since the plan's instruction — name the new path + row grammar — was followed
literally, just without quoting the exact retired string)

## Fix Cycle 1 (reviewer + Codex cross-check, merged list — cycle 1/3)

Reviewer verdict: **APPROVED** (findings non-blocking). Three fixes applied per the team lead's merged
findings list, all in the external omnivision repo (PowerShell verification per the plan's binding
constraint):

| # | Severity | Source | Finding | Fix | Status |
|---|----------|--------|---------|-----|--------|
| 1 | MEDIUM | reviewer (review.md Step 2) + Codex (major) | `mvc-report.md`'s pre-existing `## Artifacts` list (~:192) still called the retired `docs/kb/hungarian.md`/`docs/kb/levenshtein.md` paths "(live)" — contradicts the migration entry 3 lines above it in the same file/session | Updated to `docs/business-rules/tracking/hungarian.md` (verified) · `docs/business-rules/planogram/levenshtein.md` (mutation-gated) | Fixed, PowerShell-verified |
| 2 | LOW | Codex (major, bundled with #1's file) | Same file, ~:167 — "42 `## Rules` bullets" contradicts the section's own already-correct "41 `source: code` hits" three lines later (~:184) | Corrected "42" → "41" | Fixed, PowerShell-verified |
| 3 | LOW | reviewer/Codex (minor) | `hungarian.md` / `levenshtein.md` line 1 still self-label `# KB — {Concept}` after the artifact-species move to `docs/business-rules/` | Retitled to `# Business Rules — {Concept}`; content below untouched | Fixed, PowerShell-verified |

**Verification (PowerShell, per the plan's external-repo constraint):**
```
Select-String mvc-report.md -Pattern "BR registries"
  → :192  **BR registries (live):** `docs/business-rules/planogram/levenshtein.md` (**mutation-gated**) ·
           `docs/business-rules/tracking/hungarian.md` (verified)
Select-String mvc-report.md -Pattern "docs/kb/hungarian\.md|docs/kb/levenshtein\.md"
  → only the historical Verdict-section refs (:12,:14, pre-migration, left as-written) and the
    Registry-migration section's "X → Y" move-description arrows (:166,:173) — no more "(live)" claims
Select-String mvc-report.md -Pattern "## Rules. bullets were each converted"
  → :167  "...the file's 41 `## Rules` bullets were each converted to a..."
Select-String hungarian.md -Pattern "^# " (first match)
  → :1  # Business Rules — Hungarian assignment solver (`hungarian.cpp`)
Select-String levenshtein.md -Pattern "^# " (first match)
  → :1  # Business Rules — Levenshtein edit distance (`levenshtein.h`)
```

**Out of scope (per the team lead's routing, not actioned):**
- Codex's merge-side/harness blocker (`harness/merge.workflow.js`, `harness/lib/rules-registry.mjs`,
  associated unit tests still targeting `docs/kb/golden/{Class}.md`) — deferred successor slice per the
  tech-spec's `## Out of scope`, not this slice's contract.
- Codex's levenshtein-grammar finding (registry rules living under API-signature headings instead of a
  `## Rules` section, with source-line prose) — already adjudicated by the architect's Q1 ruling
  (preserve the file's own structure/prose, annotate bullets in place).
- Codex's delivery-docs-stale finding (claiming implementation.md/review.md's Step-6 narrative is stale
  against plan.md) — rejected; it's audit-trail chronology. implementation.md/review.md correctly
  describe the mismatch **as it stood at the time each was written**; the architect's later plan
  amendment (adding the CHANGELOG.md carve-out to Step 6's third bullet) doesn't retroactively make the
  as-written record wrong — it's the fix the record correctly prompted.

*Status: COMPLETE — developer, 2026-07-04*
