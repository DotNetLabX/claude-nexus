# Implementation Plan — adhoc-RulesRegistry

**Spec:** `docs/specs/adhoc-RulesRegistry/definition/tech-spec.md` (Ready — code-grounded critic pass
folded). Governing decision: ADR-45; ratified source: `docs/proposals/rules-registry-vertical-slice.md`.
**Intent:** Scoped — a rename/convert pass across shipped contract text (2 plugins) + one external-repo
move. 7 steps, no split.
**Execution constraint (binding):** Step 1 edits the consuming repo `D:\omnishelf\omnivision-ai-sdk`
directly (same machine). **All external-repo filesystem facts must be verified with PowerShell, not
Bash** — the Bash sandbox returned a fabricated directory listing for exactly these paths during the
spec review (recorded in the spec's `## Critic Review`).
**Out-of-scope guard:** the C2→C1 trigger rebase, the guardrail/review consumer, the conformance spike,
and any Merge/Generate behavior change — successor slices per the tech-spec. This plan changes WHERE
registry artifacts live and their row grammar; it changes no pipeline behavior.

## Context

ADR-45 splits the mined-rule registries into their own artifact species at `docs/business-rules/`
(flat per-unit, Contract R1 row grammar). The shipped estate still points at `docs/kb/golden/{Class}.md`
(7 files, verified) and the cpp adapter emits `docs/kb/<class>.md` in kb-entry-schema shape. This pass
is tech-spec Increments 1 + 2: move+convert the two omnivision first-mover registries, then re-point
every shipped file, in that order, so the contract text never references a location that doesn't exist.

## Scope

**In:** omnivision registry move+convert; `mine-verify-cover-cpp` artifact contract; core
`mine-verify-cover` path + section retitle + Flutter migration note; `kb-entry-schema` species split;
3 agent hooks + command regen; verification sweep; PATCH bumps (`nexus`, `nexus-cpp`).
**Out:** everything in the tech-spec's `## Out of scope` (successor slices); `nexus-dotnet` /
`nexus-flutter` edits (verified zero ledger-path references — their `docs/kb/research/…` mentions are
the research pool and stay); the Flutter repo's physical migration (owed on that repo's next touch, per
the migration note).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | omnivision paths + Contract R1 grammar | |
| 2 | (none) | — | no | cpp SKILL.md:118 edit, :31 carve-out | |
| 3 | (none) | — | no | core SKILL.md :359 + :244-246 + migration note | |
| 4 | (none) | — | no | kb-entry-schema species split | |
| 5 | (none) | — | no | 3 hook lines + gen-commands | |
| 6 | (none) | — | no | the two acceptance greps | |
| 7 | release-plugin | Follow | no | nexus PATCH, nexus-cpp PATCH (0.1.4) | |

All steps are contract-text/doc edits — no runtime behavior, so TDD is `no` throughout (the TDD column
is still binding process mapping, not waived by `Skill: None`).

## Domain Model Changes

None — documentation/contract artifacts only.

## Data Model Changes

None.

## Implementation Steps

**Step 1 — Move + convert the omnivision registries (external repo).**
In `D:\omnishelf\omnivision-ai-sdk` (PowerShell for all filesystem operations/verification):
- `docs\kb\hungarian.md` → `docs\business-rules\tracking\hungarian.md`
- `docs\kb\levenshtein.md` → `docs\business-rules\planogram\levenshtein.md`
- Convert each `## Rules` bullet to a Contract R1 row — **an annotated bullet, never a table rebuild**: the
  row IS the existing rule bullet plus four appended fields (the "columns as-is" grammar names the field set,
  not a rendering; the golden-registry *table* is the out-of-scope Merge stage). Append `source: code`;
  `status:` from the file's existing verify/mutation-gated footer; `last_verified:` = the file's most recent
  verification-against-code event, coherent with `status` (hungarian.md → `2026-06-24`, Mine→Verify run
  `wf_356fb6ab-024`, `status: verified`; levenshtein.md → `2026-07-01`, the mutation-gate re-validation that
  sets `status: mutation-gated`, **not** the 2026-06-25 mining date); `criticality: untagged` (cpp
  fact-mapping is deferred — never invent a value). **Preserve each rule's verified prose** (IMPRECISE
  corrections, entailment/`[OBS]`/`[INT]`/`[DEAD]` tags, MUTATION NOTE, per-op guidance) — that prose is the
  mining value. Keep each file's own kb-entry-schema context sections below the rows: hungarian.md's are
  `Key Files / Edge Cases / Source`; levenshtein.md has **no `## Rules` heading** (its rules sit under the two
  API-signature headings — annotate those bullets in place) and its own non-rule sections
  (`Mutation targets / Asserting editops safely / Source`) stay as-is — do not rename them to match
  hungarian's.
- Append a run-report entry to `docs\specs\mvc-tests\delivery\mvc-report.md` recording the move+convert
  (this is AC-5b's artifact of record).
- Leave no copies at the old paths.
Acceptance: PowerShell `Test-Path` false for both old paths, true for both new; both new files contain
`source: code` and `criticality: untagged` rows; mvc-report.md has the new entry.
Satisfies: AC-5b.

**Step 2 — cpp adapter artifact contract.**
`plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md` — the ledger emission line (currently
`docs/kb/<class>.md`, line 118): emit `docs/business-rules/<area>/<unit>.md` in registry row grammar,
referencing **the core `mine-verify-cover` skill's registry-grammar sentence** (a SHIPPED artifact —
never `Contract R1`/the tech-spec/ADR-45, which don't ship; ADR-45 may appear only as a parenthetical
provenance tag). Tighten the line-119 qualifier from "(`kb-entry-schema` shape)" to "(registry rows
over `kb-entry-schema` context sections)". **DO NOT TOUCH line 31**
(`docs/kb/research/cpp-mutation-and-test-tooling.md`) — research pool, stays under `docs/kb/`.
Acceptance: grep `docs/kb/<class>` in the file → 0 hits; grep `docs/kb/research` → still 1 hit
(line 31); grep `Contract R1` in the file → 0 hits.
Satisfies: AC-5a (contract half).

**Step 3 — Core skill: path, section retitle, shipped grammar enumeration, migration note.**
`plugins/nexus/skills/mine-verify-cover/SKILL.md`:
- Line 359: `docs/kb/golden/{Class}.md` → `docs/business-rules/<area>/<unit>.md`; keep the
  `source:`/`last_verified` mandatory language of that sentence intact (AC-6).
- Section `## The KB rule-ledger` (lines 244-246): retitle to `## The rule registry`, add the explicit
  landing path `docs/business-rules/<area>/<unit>.md` (the section currently has no literal path —
  this ADDS one), and **enumerate the full row grammar inline** — this shipped sentence becomes THE
  grammar definition every other shipped file references: `source: code | spec | both`, `status`
  (incl. `divergence-pending-triage`), `criticality: golden | core | edge | untagged` (`untagged` =
  the arm never mined that fact), `last_verified`. ADR-45 as parenthetical provenance only. Keep the
  durable-prose/no-line-numbers and status-flip content; kb-entry-schema stays referenced for the
  registry's non-row context sections.
- Line 392 (`## Relationship to other skills` table, kb-entry-schema row): "the KB rule-ledger shape
  this method reads and writes" → "the registry's non-row context sections (row grammar lives in
  `## The rule registry`)".
- Add a 2-3 line **Flutter migration note** in/next to the registry section: existing Flutter-repo
  ledgers at `docs/kb/` and registries at `docs/kb/golden/` migrate to `docs/business-rules/` on that
  repo's next campaign touch; until then consumers read the old paths for those repos.
Acceptance: grep `docs/kb/golden/{Class}.md` in the file → 0 hits; grep `docs/kb/golden/` → exactly
1 hit (the migration note — AC-4's target); grep `docs/business-rules/` → ≥2 hits; grep
`KB rule-ledger` → 0 hits; grep `Contract R1` → 0 hits.
Satisfies: AC-1 (file half), AC-4, AC-6.

**Step 4 — kb-entry-schema species split.**
`plugins/nexus/skills/kb-entry-schema/SKILL.md`: add a short species-boundary note — KB entries
(vocabulary, research pool, `docs/kb/…`) stay; the mined/merged **rule registry** species lives at
`docs/business-rules/<area>/<unit>.md`, row grammar defined in the core `mine-verify-cover` skill's
`## The rule registry` section (shipped reference — never the tech-spec/ADR-45), and kb-entry-schema's
context sections remain the registry's non-row body. No other content changes.
Acceptance: grep `docs/business-rules` in the file → ≥1 hit naming the split.
Satisfies: AC-3.

**Step 5 — Agent hooks + command regen.**
In `plugins/nexus/agents/solo.md` (line 14), `developer.md` (line 66), `architect.md` (line 246):
re-point `docs/kb/golden/{Class}.md` → `docs/business-rules/<area>/<unit>.md` AND soften the
parenthetical from "a C2 attestation record at …" to "the class's registry at …". **Trigger semantics
stay as-written** ("attested golden set", forward conditional) — the C2→C1 rebase is the successor
slice. Then run `node scripts/gen-commands.mjs nexus` to regenerate `commands/{solo,developer,architect}.md`.
Acceptance: grep `docs/kb/golden` across `plugins/nexus/agents/` and `plugins/nexus/commands/` → 0 hits;
generated commands diff only in the regenerated block.
Satisfies: AC-2.

**Step 6 — Verification sweep (hard gate, same greps as the ACs — reconciled, no judgment calls).**
- `grep -r "docs/kb/golden/{Class}.md" plugins/` → **0 hits** (the directive form is fully retired).
- `grep -r "docs/kb/golden" plugins/` → hits ONLY in: the Step-3 migration note (core SKILL.md, names
  the old location by design) and `CHANGELOG.md` files (if a bump entry mentions the old path). Any
  other hit fails the step.
- `grep -rn "docs/kb" plugins/nexus-dotnet/ plugins/nexus-flutter/ plugins/nexus-cpp/` → FOUR sanctioned
  research/index hits **plus any `CHANGELOG.md` historical entries** (the same append-only carve-out the
  second bullet grants — a `CHANGELOG.md` line describing what a past version shipped, e.g. nexus-cpp
  `[0.1.2]`'s `docs/kb/` mention, is immutable history: sanctioned, never edited). The four: cpp `:31` +
  flutter `:30`/`:163` (research pool) and `plugins/nexus-dotnet/skills/improve-architecture/SKILL.md:35`
  (`docs/kb/index.md` — the actual KB index; DO NOT "fix" it). Zero **live ledger-path** hits.
Record all three grep outputs verbatim in implementation.md.
Satisfies: AC-1.

**Step 7 — Version bumps (once, after all edits).**
Follow release-plugin. Inputs: `nexus` PATCH (contract-text change), `nexus-cpp` PATCH → 0.1.4;
CHANGELOG entries name the new path + row grammar (AC-5a's grep target). Run once after Steps 2-6 land —
never per-step (repo rule: mid-sequence runs double-bump). Known benign: the selfcheck gen-commands
check is git-HEAD-based and false-positives at the pre-commit stop when agents changed — resolves at
commit, don't bounce.
Acceptance: `plugins/nexus-cpp/.claude-plugin/plugin.json` = 0.1.4; both CHANGELOGs name
`docs/business-rules/`.
Satisfies: AC-5a.

Omni twin sync + the commit itself are owner/team-lead-owed at close (repo rule), not plan steps.

## Cross-Service Changes

None (no runtime services). Cross-REPO: Step 1 only, paths pinned above.

## Migration Notes

The Flutter repo's physical migration is deliberately NOT in this plan — the shipped migration note
(Step 3) owes it to that repo's next campaign touch. No data migrations.

## Testing Strategy

No runtime surface — the gates are the Step-6 greps + Step-1 PowerShell path checks, mirrored 1:1 from
the tech-spec ACs.

## KB Impact

None in this repo (`docs/kb/research/…` untouched). The omnivision "KB" files ARE the moved artifacts
(Step 1) — that is the feature, not a side effect.

## Open Questions

None. Two pre-sanctioned decisions (migration note lives in the core skill → no nexus-flutter bump;
Step 1 executes against the external repo directly) were surfaced at the Phase-1 checkpoint and stand
unless the owner objects.

## Plan Review

Code-grounded critic pass, 2026-07-04 (fresh-context; every plan anchor re-verified against live
source; external-repo facts PowerShell-verified). Verdict: **REVISE** → all findings folded, plan
approved.

| Finding | Severity | Disposition |
|---------|----------|-------------|
| HIGH-1 — Step 3 acceptance self-contradicted (migration note must contain `docs/kb/golden/` while the step demanded 0 hits); AC-1 collided with AC-4 | HIGH | Fixed — gate split: directive form `docs/kb/golden/{Class}.md` → 0 hits; bare form whitelisted to migration note + CHANGELOGs; AC-1 amended in tech-spec to match |
| HIGH-2 — shipped skills pointed at dev-repo-only `Contract R1`/ADR-45 for load-bearing grammar | HIGH | Fixed — Step 3 enumerates the full row grammar inline in the core skill (now THE shipped reference); Steps 2/4 reference it; `Contract R1` banned from shipped text (grep gates added); self-containment rule added to tech-spec Increment 2 |
| MED-1 — Step 6's sweep omitted `improve-architecture/SKILL.md:35` (`docs/kb/index.md`) | MED | Fixed — sanctioned-hits list now enumerates all four surviving `docs/kb` references with a DO-NOT-FIX on the KB index |
| MED-2 — core SKILL.md:392 relationship-table row left stale after retitle | MED | Fixed — added to Step 3's edit list |
| LOW — cpp :119 "(kb-entry-schema shape)" qualifier stale after Step 2 | LOW | Fixed — Step 2 tightens it to "(registry rows over kb-entry-schema context sections)" |

Root pattern (also logged to lessons.md): the edits were sound; every finding was an *acceptance
assertion* stated slightly wrong against what the greps actually return — reconcile grep gates against
live output at plan time, and never let shipped text resolve through dev-repo docs.
