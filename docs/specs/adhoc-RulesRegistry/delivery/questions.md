# adhoc-RulesRegistry — Questions

## Q1: Step 1 — physical format of a converted registry "row" (annotated bullet vs. markdown table)
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Step 1 — Move + convert the omnivision registries (external repo)
**File:** `D:\omnishelf\omnivision-ai-sdk\docs\business-rules\tracking\hungarian.md` and `…\planogram\levenshtein.md` (post-move)

**Context:**
The plan (Step 1) and tech-spec (Increment 1) point two slightly different directions for the physical
shape of the converted rows, and the acceptance grep can't discriminate them:

- **Bullet-annotation reading** — plan verb is "**append** `source: code`; `status:`…; `last_verified:`…;
  `criticality: untagged`" to "each `## Rules` bullet", and "Keep the kb-entry-schema context sections …
  **below the rows**". Tech-spec: "additive, not conflicting." This reads as: add the four fields to each
  existing rule bullet, preserving the mining prose.
- **Markdown-table reading** — tech-spec Contract R1 grammar says the columns are "the **PD-5263
  golden-registry row columns as-is**." I grounded that against the shipped Merge output
  (`adhoc-SddMergeGen` `renderRegistry`): the golden registry is a **markdown table** —
  `canonicalName | layer | criticality | arms | disposition | source | lastVerified`. Read literally,
  "columns as-is" could mean rebuild the rules into that table.

The source files are rich prose bullets (hungarian.md: BR-1..BR-42 with IMPRECISE corrections, entailment
caveats, `[OBS]/[INT]/[DEAD]` tags, a MUTATION NOTE; levenshtein.md: LV-1..LV-18 with per-op guidance).
Forcing 60 richly-annotated rules into table cells would either drop the verified correction prose or
create an unusable free-text column. The two readings produce materially different artifacts in an
**external repo** — hence surfacing rather than guessing (hard rule: no unresolved assumption baked in).

Two structural sub-notes (same step, don't need separate answers if Q1 resolves to bullet-annotation):
- **levenshtein.md has no `## Rules` heading** — its rules sit directly under the two API-signature
  headings (`## Levenshtein::distance<T>…`, `## …editops<T>…`), and its context sections are
  `## Mutation targets` / `## Asserting editops safely` / `## Source`, not the `Key Files / Edge Cases /
  Source` the plan names (those match hungarian.md). Under the bullet reading I annotate every rule bullet
  in place and keep whatever non-rule sections each file has; the table reading has no clean anchor here.

**Question:** For Step 1, should each converted rule be an **annotated bullet** (append the four Contract R1
fields to the existing rule bullet, preserving prose; keep the file's non-rule context sections below), or a
**markdown-table row** matching the golden-registry columns?

**Recommendation:** Annotated bullet — append `source: code`, `status:` (from footer), `last_verified:`,
`criticality: untagged` to each existing rule bullet; keep each file's context sections below. Rationale:
the plan's operative verb is "append … to each bullet" + "context sections below the rows"; tech-spec says
"additive, not conflicting"; AC-6 language is "per-row"; the golden-registry table is the *Merge* stage
output, whereas these files are the *Mine→Verify day-one registry* the tech-spec explicitly says stays
"in kb-entry-schema shape" and MOVES — so "columns as-is" means the same **field set**, not a table
rebuild. The prose corrections are the verified mining value and must survive.
**Confidence:** medium — "the PD-5263 golden-registry row columns as-is" is a real counter-signal, and this
lands in an external repo (60 rows) where a wrong call is costly to redo. A one-word confirm de-risks it.

### Answer
**Annotated bullet — confirmed. Not a table.** Append `source: code`, `status:` (from the file's
verify/mutation-gated footer), `last_verified:`, `criticality: untagged` to each existing rule bullet; the
bullet **is** the row. Preserve every rule's verified prose (IMPRECISE corrections, entailment caveats,
`[OBS]/[INT]/[DEAD]` tags, the MUTATION NOTE, per-op guidance) — that prose is the mining value the whole
campaign produced; a table rebuild would drop it or bury it in an unusable free-text cell. Keep each file's
non-rule context sections below the rows.

Your medium confidence was right to flag "columns as-is," but the full tech-spec resolves it to **high**:
1. **"columns as-is" names the field set, not a rendering.** Contract R1 enumerates the columns inline right
   after the phrase (`source / status / criticality / last_verified`) — "as-is" = "use PD-5263's column
   vocabulary, don't invent new columns," not "render as PD-5263's table."
2. **The golden-registry table is the *Merge* stage output** (`renderRegistry`, `canonicalName | layer | …`).
   Merge behavior is explicitly **out of scope** for this slice (plan `Out-of-scope guard`; tech-spec `## Out
   of scope`). Rebuilding these files into that table would be doing the successor slice's work.
3. **The species glossary settles it:** "The Mine→Verify verified per-class entry IS the day-one registry
   (today emitted … **in kb-entry-schema shape** … it MOVES)." kb-entry-schema shape = annotated bullets; the
   table is a *later* stage these files have not reached.
4. **"additive, not conflicting" + "keep context sections below the rows"** = preserve the bullet body, append
   the fields — a conversion that *drops* prose is by definition "conflicting."

**Sub-notes (both resolved by the bullet reading — no table anchor needed):** annotate the rule bullets
wherever they physically live. levenshtein.md has no `## Rules` heading — its rules sit under the two
API-signature headings; annotate those bullets in place. Keep each file's **own** non-rule sections as-is —
do **not** rename levenshtein's `Mutation targets / Asserting editops safely / Source` to match hungarian's
`Key Files / Edge Cases / Source`. The plan's parenthetical section list was hungarian-derived; the binding
instruction is "keep the non-rule context sections," not "impose one file's section names on the other."

**This answer is binding — follow it.** The matching clarification (bullet-not-table + per-file section
handling + the two `last_verified` dates) is **now applied to plan Step 1** (team lead granted the plan-write
window; the earlier attempt was blocked by the analyze-phase gate). Plan and this answer now agree.
— architect, 2026-07-04

## Q2: Step 1 — `last_verified` date for levenshtein.md (two candidate dates)
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Step 1 — Move + convert the omnivision registries (external repo)
**File:** `…\planogram\levenshtein.md` (post-move)

**Context:**
The plan says "`last_verified:` from the run record date." hungarian.md is unambiguous — Mine→Verify run
`wf_356fb6ab-024`, **2026-06-24** (both header and Source section), status footer `mutation-gated: false`
→ `status: verified`, `last_verified: 2026-06-24`. levenshtein.md has **two** candidate dates: mined by
direct read **2026-06-25** (Source section), and its footer is `mutation-gated: true (96% reachable kill,
**2026-07-01**, nexus-cpp 0.1.1 re-validation)` → `status: mutation-gated`. Which date is `last_verified`?

**Question:** For levenshtein.md, is `last_verified` the mining date (2026-06-25) or the mutation-gate
re-validation date (2026-07-01)?

**Recommendation:** 2026-07-01 (the mutation-gate re-validation). `last_verified` should reflect the most
recent event that verified the rules against live code; the mutation gate is exactly that and is also what
sets `status: mutation-gated`.
**Confidence:** high — the mutation gate is the last verification event and is consistent with the row's
`status`. Low stakes; flagged only because the plan says "the run record date" (singular) and this file has two.

### Answer
**2026-07-01 — the mutation-gate re-validation. Confirmed.** Your high confidence holds.

The governing rule (binding here; now applied to plan Step 1 — see the Q1 answer): **`last_verified`
= the date of the file's most recent verification-against-live-code event, and it must be coherent with `status`.**
- hungarian.md: one event → `last_verified: 2026-06-24`, `status: verified`.
- levenshtein.md: `status: mutation-gated` is set by the 2026-07-01 gate (96% reachable kill, nexus-cpp
  0.1.1). `last_verified` must name that same event — pairing `status: mutation-gated` with `last_verified:
  2026-06-25` (the pre-gate mining read) would be internally incoherent: the row would claim a verification
  strength it dates to *before* that verification happened. The mutation gate is a strictly later and stronger
  verification of the same rules against the same code, so it is the correct `last_verified`.

The 2026-06-25 mining date is superseded as `last_verified` (it remains the provenance in the file's `Source`
section, which is untouched).
— architect, 2026-07-04
