# Mine Siblings Skill Authoring — Questions

## Q1: Step 1 — do the sibling SKILL.md member-count pointers get synced to the 7-member family?
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Step 1 (family-table 5→7 rows) — Phase 1 analysis
**File:** `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` + sibling SKILL.md pointers

**Context:** Step 1 grows the family table from 5 to 7 rows and updates every member count *inside* `mine-family-core.md` (intro "five-member" + invariant "all five" — critic M1). Its accept criteria grep only that one file. But the member count is echoed in pointer sentences in sibling skills that ship in the SAME nexus MINOR release:
- `plugins/nexus/skills/mine-verify-cover/SKILL.md:409` — "the full **4-row** family table" (already stale today — the live table has 5 rows).
- `plugins/nexus/skills/mine-reference-model/SKILL.md:28-29` — "the full **5-row** family table" + "all **five** members follow".
- `plugins/nexus/skills/mine-verify-repo/SKILL.md:27` — "all **five** members follow".
- `plugins/nexus-analytics/skills/mine-semantic-model/SKILL.md:226,229` — "all **five** members" / "the other **four** mines" — but this is a **different plugin** (nexus-analytics, own version/release; out of the plan's nexus-only scope).

After step 1 lands, three same-release nexus siblings will read "all five" / "4-row" against a 7-row table. The counts are demonstrably informal already (mine-verify-cover ships a stale "4-row" today), which is evidence they're loose pointers — but shipping a visibly inconsistent count set in one MINOR is the kind of thing a reviewer flags.

**Question:** Should step 1 also sync the three in-plugin nexus sibling pointers (mine-verify-cover "4-row"→"7-row", mine-reference-model "5-row"/"all five"→"7-row"/"all seven", mine-verify-repo "all five"→"all seven") — expanding step 1's file scope and accept greps beyond `mine-family-core.md`? And is leaving nexus-analytics' `mine-semantic-model` untouched (separate plugin/release) the intended scope boundary?

**Recommendation:** Yes — sync the three in-plugin nexus siblings as part of step 1 (also fixes the pre-existing stale "4-row"), and add a greppable accept check (`grep -rciE "all five|[45]-row" plugins/nexus/skills/mine-*/SKILL.md` = 0). Leave `nexus-analytics/mine-semantic-model` alone — it's a separate plugin with its own version, out of this feature's scope, and its "other four mines" phrasing counts on a different basis anyway.
**Confidence:** medium — the estate already tolerates a stale "4-row", so these are informal pointers, not load-bearing facts; but a 7-row table shipping beside three same-release siblings saying "all five"/"4-row" is a real internal inconsistency, and whether to fix-now vs. leave-informal is a scope call the plan didn't make.

### Answer
**Architect, 2026-07-12 — Yes on both halves.** (Plan delta for step 1 + ## Decisions specified in the architect handback; application pending — the pipeline phase gate blocks plan.md writes during the analyze phase, so the team lead applies/resumes before implementation starts.)

1. **Sync the three in-plugin nexus siblings in step 1.** All three cited lines verified live. Rationale: (a) the plan's own grounding rule — when a pass removes/renames a counted surface, grep the whole doc tree for external consumers of it; the member count is such a surface and these are its consumers; (b) same plugin, same MINOR release — shipping a 7-row table beside "all five"/"4-row" pointers is a visible internal inconsistency the reviewer would flag anyway; (c) it retires the pre-existing stale "4-row" at `mine-verify-cover/SKILL.md:409` for free. Step 1 now carries the old→new pointer table (counts only — no other wording changes).

2. **Accept-grep shape changed from your suggestion.** Your `grep -rciE "all five|[45]-row" plugins/nexus/skills/mine-*/SKILL.md = 0` over the glob would also sweep the two NEW skills authored in steps 2/4 — and mine-algorithm's verdict grammar has exactly five verdicts, so a legitimate future "all five verdicts" sentence would false-positive the gate. The plan instead scopes the negative grep to the **three named sibling files** (the same file list the step enumerates — list and check derive from one query) and pairs it with a positive check (`7-row|all seven` ≥ 1 per file), per the positive+negative acceptance rule.

3. **nexus-analytics stays untouched — but as a recorded deferral, not silence.** Correct scope boundary: separate plugin, own version/release cadence; a sync there forces a nexus-analytics bump this feature doesn't own. Recorded as a `deferred` row in the plan's ## Decisions so it's findable at the next nexus-analytics release. Note your line list was short by one: `mine-semantic-model/SKILL.md:246` also says "the other four"; and `:72` "All five phases" is a **phase-count homonym — DO-NOT-TOUCH** when that sync eventually runs (both now named in the plan's deferral note).

## Q2: Step 6 — run improve-skills' mandatory Judgment Gate (`evaluate-skill`), or record an explicit waiver?
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Step 6 (Deterministic gate) — Phase 1 analysis
**File:** `plugins/nexus/skills/mine-algorithm/`, `plugins/nexus/skills/mine-design/`

**Context:** Steps 2 and 4 author two NEW shipped skills "Follow improve-skills (dev-repo carve-out … per its skill-recipe)". improve-skills' done-condition for a **new** skill is two-part (its §Judgment Gate, owner decision 2026-06-20, mandatory): "Done = lint exits 0 **AND** the evaluate-skill findings are resolved (or waived with a reason in the report)." It requires invoking `evaluate-skill` on each new skill folder after the lint passes and folding CRITICAL/HIGH findings.

Step 6 (and the Skill Mapping row) scope improve-skills to its **Deterministic Gate section only** — run `skill-lint.mjs`, fix findings, loader-safety pass. No `evaluate-skill` pass and no stated waiver. The plan's Testing Strategy notes "the methods were validated by the five pilot units; the skills encode, not re-derive, that validation" — which covers the *method*, but `evaluate-skill` judges the *authored artifact's* quality (job fitness, concrete steps, no-overlap, repeatability), a different axis a well-validated method can still fail.

**Question:** Should step 6 add the `evaluate-skill` Judgment Gate over both new skill folders (per improve-skills' mandatory done-condition for new skills), or does the plan intend to invoke the waiver clause — in which case the waiver + reason (e.g. "pilot-validated method; lint + acceptance greps sufficient") should be recorded explicitly per the skill's own rule?

**Recommendation:** Run `evaluate-skill` on both new skill folders after the lint (step 6), fold CRITICAL/HIGH, re-lint. It's mandatory in the skill the plan says to Follow, it's cheap relative to a shipped skill's force-multiplier blast radius, and pilot validation doesn't cover authoring quality. If the architect instead wants to waive, record the waiver + reason in implementation.md so improve-skills' done-condition is satisfied either way.
**Confidence:** medium — the plan's lint-only Testing Strategy reads like a deliberate stance, so a waiver may be intended; but improve-skills makes the Judgment Gate mandatory-or-explicitly-waived for new skills, and the plan does neither, so the step is under-specified as written.

### Answer
**Architect, 2026-07-12 — Run the Judgment Gate on both new skill folders. No waiver.**

Your reading is correct and the gate is not optional here: steps 2/4 say **Follow improve-skills under the dev-repo carve-out**, and the carve-out itself binds a new shipped skill to "the full New-Skill recipe here, **including its Judgment Gate**" (`improve-skills/SKILL.md:21`, verified live; done-condition at `:86` — "Done = lint exits 0 AND the evaluate-skill findings are resolved"). Step 6's Deterministic-only scoping was **under-specification, not a deliberate waiver** — the Testing Strategy sentence covers the *method* axis (pilot-validated); `evaluate-skill` judges the *authored artifact* axis (job fitness, repeatability, no-overlap, concrete steps), which pilot validation cannot certify. Two brand-new shipped skills carry the meta-loop's force-multiplier blast radius — exactly the case the owner's 2026-06-20 decision made the gate mandatory for — and the cost is one evaluate-skill pass per skill.

Mechanics: after the lint exits 0, invoke `evaluate-skill` on `plugins/nexus/skills/mine-algorithm/` and `plugins/nexus/skills/mine-design/`; fold every CRITICAL/HIGH back through improve-skills as a consolidating pass (net complexity flat or down, never additive patching); record MEDIUM/LOW dispositions in implementation.md; re-run the lint after folding. Plan delta (step 6 + Skill Mapping row 6 + Testing Strategy) is specified in the architect handback; application pending the phase gate, same as Q1.
