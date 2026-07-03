# Spec-Arm Trigger (mine-from-spec at spec-Ready) — Implementation

**Scope:** All 8 plan steps now complete across two stints. Steps 1–6 (developer, this session). Step 7
(AC-T5 drill) — main-session step, orchestrated by the coordinator per the plan's Execution constraint (a
spawned developer has no agent-spawn primitives); recorded here on the coordinator's verified report, not
re-run. Step 8 (release bump) — developer, after Step 7 landed. No commit — owner-owed (ADR-18/20).

## Files Modified

- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — added the input-source axis framing (`## Input-source
  axis`) adjacent to the existing depth-mode section; added the `## mine-from-spec mode` section (source
  manifest, forbidden set stated per-stage-prompt, Mine/Verify stage descriptions, output artifact path,
  the stamp grammar verbatim from spec S2, and the Execution-topology rule); scoped the intro's "ONE
  production class" / "reverse-engineers" premises to the code arm with a pointer to the new axis section;
  reconciled the `## SDD lifecycle (M0–M3)` section so M0/M1/M3 state Mine+Verify-from-spec as
  shipped/ungated via `mine-from-spec`, with only Cover-from-spec + the two-arm merge machinery remaining
  AC-6-gated.
- `plugins/nexus/skills/create-implementation-plan/SKILL.md` — the `Satisfies:` traceability paragraph
  (step 6 of the skill's Steps) gained the third referent form, `{ruleName}` (resolves to a row in the
  slug's `definition/spec-rules.md`), plus the "should, when spec-rules.md exists" guidance for
  rule-bearing steps. Preserved verbatim the "additive and optional … never a blanket mandate" language —
  only extended the referent set, never the strength.
- `plugins/nexus/agents/architect.md` — four edits:
  1. Phase 1 numbered list gained a new item 4, "Spec-rules join (if present)" (existing items 4–6
     renumbered 5–7): reads `spec-rules.md` once if present/arrives mid-phase, feeds `ambiguous` rows into
     gap analysis as pre-mined questions, states the stamp-recompute + delta re-check on mismatch (never
     silent-stale, never full re-run), and the join-is-opportunistic-not-a-barrier rule. Phase 2's
     numbered list renumbered 8–13 to stay sequential with the new Phase 1 item.
  2. Phase 2 item 8 ("Produce the plan…") gained the advisory `Satisfies: {ruleName}` guidance sentence,
     citing `create-implementation-plan` and reiterating the done-check never Fails for absence.
  3. The done-check `Satisfies:` cross-check paragraph (Step 1: Done Check section) gained the third
     referent: a `{ruleName}` must resolve to a `spec-rules.md` row, existence-validation only, same
     never-Fail-for-absence posture as the existing AC-n/ADR-unit referents.
  4. Added a **net-new** "Technical-branch definition checkpoint" paragraph after the existing "For a
     technical feature, you own the definition" bullet (Feature Spec Workflow section): one batched ask —
     review mode (self vs code-grounded critic) + the mine-from-spec offer with the S3 qualification gate
     (rule-shaped behavior; silence = default-skip) — both in one checkpoint, never a separate stop.
     Explicitly notes team-mode technical-branch surfacing is out of scope for this slice.
- `plugins/nexus/agents/po.md` — inside the existing `### Spec review (mandatory gate)` section: added the
  batched second question ("run `mine-from-spec` once Ready?") with the S3 qualification gate
  (rule-shaped-behavior only; no target-surface requirement; UI/wiring/infra → don't offer, silence =
  default-skip), and updated both routing bullets (standalone → ask user directly, in the same batch as
  the review-mode choice; spawned → hand both choices up to the team lead in one message).
- `plugins/nexus/agents/team-lead.md` — two edits:
  1. `### PO Spec-Review Checkpoint` — now surfaces both the review-mode choice and the mine-from-spec
     recommendation in one batch, added the unattended default-skip behavior, and added the
     answer-attribution recording rule (same discipline as the Architect Questions Checkpoint —
     `presumed (proceed-default), not user-confirmed` when no verbatim user reply exists).
  2. Added a **net-new** `### Mine-from-spec Dispatch (spec arm)` subsection immediately after: on
     `Status: Ready` with a recorded yes, orchestrates the mode's stages as background `general-purpose`
     agents (miners in parallel, then consolidate+skeptic) **alongside** dispatching the architect for
     Phase 1 — same parallel-dispatch shape as the existing Standard+Codex "Dispatch both, in parallel"
     precedent. States never-delegate-to-a-single-agent and the run-never-blocks-the-pipeline rule. Does
     **not** wire team-mode technical-branch surfacing (explicit out-of-scope per plan Step 5 note).
- `plugins/nexus/commands/architect.md`, `plugins/nexus/commands/po.md`,
  `plugins/nexus/commands/team-lead.md` — regenerated via `node scripts/gen-commands.mjs nexus` (Step 6).
  Only these three changed; `developer.md`/`reviewer.md`/`critic.md`/`learner.md`/`solo.md` unaffected
  (their source agent files were untouched this stint).
- `plugins/nexus/.claude-plugin/plugin.json` — version bumped `1.19.0` → `1.20.0` (MINOR, owner-escalated
  per OD-T3) via `node scripts/bump-plugin.mjs --minor` (Step 8).
- `plugins/nexus/CHANGELOG.md` — `[1.20.0]` entry prepended by the bump tool, then hand-edited (per the
  `release-plugin` skill's step 3) from the generic reason-code stub into a real description of the
  spec-arm-trigger capability and its five touch points (Step 8).

## Key Decisions

- **Renumbered architect.md's Phase 1/Phase 2 numbered lists** rather than inserting the new spec-rules
  join step as an unnumbered sub-bullet. The existing list runs 1–12 continuously across Phase 1 → Phase 2
  (separated only by the un-numbered Options Panel section); inserting a new Phase 1 item without
  renumbering Phase 2 would have produced a duplicate "8." Chose full renumbering (Phase 1 now 1–7, Phase 2
  now 8–13) to keep the sequence internally consistent — not a plan requirement, but the plan's anchor
  region (`:150-164`) implied insertion into the existing numbered flow.
- **Technical-branch checkpoint placed as a new paragraph after the `:136` bullet**, not as its own `###`
  subsection — kept it inside "Feature Spec Workflow" (the section the anchor bullet lives in) rather than
  promoting it to a sibling of "Architecture Doc Workflow", since the PO's equivalent
  (`### Spec review (mandatory gate)`) is itself a `###` inside `po.md`'s flow, not a top-level `##`
  section — matched that structural level.
- **Team-lead dispatch given its own `###` subsection** ("Mine-from-spec Dispatch (spec arm)") rather than
  folding it into the PO Spec-Review Checkpoint bullet list, since it is materially different content (an
  orchestration recipe, not a checkpoint-surfacing rule) and the plan's AC-T4 Accept line greps for it as
  a distinct staged-orchestration block.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan maps `Skill: None` for Steps 1–7 (instruction-file edits; the mode's behavior is proven by the Step 7 drill, not a pattern skill). Read-channel consult: re-read the live `mine-verify-cover/SKILL.md` in full before editing to match its existing voice/structure (no separate authoring skill exists for skill-file prose). |
| 2 | None | plan-mapped None. Edited in place, preserving the section's existing structure and cross-references. |
| 3 | None | plan-mapped None. Cross-checked all four edits against the live `architect.md` before writing (per Plan Grounding rule — verified the `:136`, `:150-164`, `:246` anchors were still at those approximate locations before editing). |
| 4 | None | plan-mapped None. Edited in place inside the existing gate section. |
| 5 | None | plan-mapped None. Cross-checked the `:218-224` Standard+Codex parallel-dispatch shape (read in full) before writing the new dispatch subsection, per the plan's explicit precedent pointer. |
| 6 | None | mechanical step — ran `node scripts/gen-commands.mjs nexus` directly, no skill mapped. |
| 7 | None | plan-mapped None; executed and verified by the coordinator (main session), not the developer — recorded here per the coordinator's report. |
| 8 | `nexus:release-plugin` | Invoked via the Skill tool before running the bump (plan mapping: `nexus:release-plugin`, `TDD: no`). Followed its procedure: dry-run with `--minor` first (single MINOR proposal for `nexus`, no other plugin/file noise), then applied, then hand-edited the CHANGELOG stub into a real description (skill step 3), then validated. |

No step in Steps 1–7 mapped a pattern or TDD skill (plan: "No step has testable runtime behavior — the
shipped deliverables are agent/skill instructions"). `implementation-format` and `questions-format` were
consulted (Read channel — skill markdown supplied via the command harness) to structure this file and
confirm no questions.md was owed. Step 8's `release-plugin` invocation is the only mapped-skill step in
this plan.

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Pre-existing uncommitted edit to `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` | low | reviewer | `git diff docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` shows a 17-line OD-L8 amendment + ADR-I addition, present in the working tree before this stint started (not touched by Steps 1–6) | Out of scope for this plan's five target files; appears to be the architect's OD-T2 amendment landing in the sibling spec. Not authored or modified by the developer this round — flagged so the reviewer doesn't attribute it to this implementation, and so the team lead includes it (or excludes it) deliberately at commit time. |

## Deviations from Plan

- None. All eight steps implemented as specified; no plan step required deviation. Step 7's execution
  location (main session, not the developer subagent) is plan-sanctioned, not a deviation — stated
  explicitly in the plan header's Execution constraint. Step 8's single expected-RED gate
  (`gen-omni --check` — twin sync is owner-owed at commit, per repo convention) is a documented,
  plan-sanctioned non-failure, not a deviation.

## Step-by-Step Accept Evidence

**Step 1 — `mine-verify-cover/SKILL.md`.** Accept: "all AC-T1 greps pass; no remaining 'spec arm … not yet
shipped / AC-6-gated' claim anywhere in the file."
- `grep 'not yet shipped'` → 0 matches (was 1, at the old M0 paragraph; rewritten).
- `grep '## mine-from-spec mode'` → line 56 (mode heading present).
- `grep 'Forbidden.*production source'` → present in the mode's Source manifest paragraph (forbidden-path rule).
- `grep 'Spec-stamp: {repo-relative'` → line 82 (stamp grammar verbatim from spec S2).
- `grep 'Execution topology (who runs what)'` → line 91 (topology rule).
- M0/M1/M3 rows + prose all state Mine+Verify-from-spec shipped/ungated via `mine-from-spec`; only
  Cover-from-spec + merge/triage/reconciliation machinery remain AC-6-gated.

**Step 2 — `create-implementation-plan/SKILL.md`.** Accept: "grep shows the ruleName referent + the
preserved optional/never-blanket language."
- `grep 'ruleName'` → present (the third `Satisfies:` referent form + the done-check confirmation clause).
- `grep 'additive and optional'` and `'never'.*'blanket'` → both preserved verbatim in the same paragraph.

**Step 3 — `architect.md`.** Accept: "AC-T3 greps (stamp/delta w/ LF, advisory Satisfies, third referent,
non-barrier) + the batched offer sits inside the new checkpoint, paired with the review-mode choice —
never a separate stop."
- `grep 'Stamp check'` / `'LF-normalization'` → present in the new Phase 1 item 4.
- `grep 'should.*carry .Satisfies'` → present in Phase 2 item 8's advisory guidance sentence.
- `grep 'resolves to a row in the slug'` → present in the done-check cross-check paragraph (third
  referent).
- `grep 'opportunistic, not a barrier'` → present in the new Phase 1 item 4.
- `grep 'Technical-branch definition checkpoint'` → present, and the mine-from-spec offer sentence sits in
  the same paragraph block as the review-mode-choice sentence (one batched checkpoint, not a separate
  stop) — confirmed by reading the rendered section back.

**Step 4 — `po.md`.** Accept: "question text greps inside the existing gate section; both routings named."
- `grep 'run .mine-from-spec. once Ready'` → present inside `### Spec review (mandatory gate)`.
- `grep 'Qualification gate'` → present, same section.
- Both routing bullets present and updated: "Standalone … ask the user directly which review mode and the
  mine-from-spec offer, in one batch" and "Spawned by the team lead … Hand both choices up …".

**Step 5 — `team-lead.md`.** Accept: "both greps (checkpoint surfacing + staged parallel orchestration)."
- `grep 'Record the mine-from-spec confirmation'` → present in `### PO Spec-Review Checkpoint`.
- `grep 'Mine-from-spec Dispatch'` → present, new `###` subsection with the staged miners-then-skeptic
  parallel orchestration + never-delegate-to-one-agent + never-blocks-the-pipeline language.
- Out-of-scope note for team-mode technical-branch surfacing included per plan Step 5 instruction (do NOT
  wire it).

**Step 6 — Regenerate commands.** Accept: "`plugins/nexus/commands/{po,architect,team-lead}.md`
regenerated; `git diff` shows them in sync with the agent files."
- `node scripts/gen-commands.mjs nexus` ran clean, wrote all 8 command files.
- `git status --short plugins/nexus/commands/` → only `architect.md`, `po.md`, `team-lead.md` modified
  (matches the three agent files edited this stint; the other five agents were untouched, so their
  regenerated commands are byte-identical to HEAD and show no diff).

**Step 7 — AC-T5 drill.** Executor: main session (plan-sanctioned handback — a spawned developer has no
agent-spawn primitives). Orchestrated and verified by the coordinator; recorded here per the coordinator's
instruction, not re-run by the developer.
- Run: `mine-from-spec` (Mine+Verify), **architect-gate path**. Confirmation recorded = owner go-ahead
  2026-07-03 (this feature's own batched checkpoint precedent, per Step 3's Technical-branch definition
  checkpoint).
- Manifest: `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` — exactly one doc.
- Stages: 3 clean-room miners (`general-purpose`, background, parallel) → 1 consolidate+skeptic
  (`general-purpose`, background) — the Execution-topology shape from Step 1's `mine-from-spec` mode.
  Miner run artifacts persisted to the session scratchpad (`spec-arm-drill/miner-{1,2,3}.md`) as
  disposable run records, not part of the shipped artifact.
- Artifact: `docs/specs/adhoc-SddLifecycle/definition/spec-rules.md` (confirmed present on disk, 38200
  bytes) — 54 consolidated rules from 144 miner rows (agreement 44@3/3, 6@2/3, 4@1/3); 52 `verified`, 2
  `ambiguous` with skeptic reasons (`ships-only-via-fold-in` — header contradicts the OD-L8 pull-forward
  amendment; `re-review-conditions` — advisory wording, no observable violation). Both `ambiguous` rows are
  genuine spec findings — the mode's second product working as designed, not a mode defect.
- Accept checks (run by the orchestrator, all PASS):
  1. Stamp line present and well-formed: `Spec-stamp: docs/specs/adhoc-SddLifecycle/definition/tech-spec.md @ sha256:ab725d865a7f (2026-07-03)` — confirmed matches the file's first line on disk.
  2. Recomputed LF-normalized hash (`sed 's/\r$//' tech-spec.md | sha256sum | cut -c1-12`) → `ab725d865a7f` — identical to the stamp; the grammar from spec S2 is reproducible.
  3. Verdict column fully populated: 56 verdict-token hits ≥ 54 rules (no row left unverdicted).
  4. Citation grep-back: 3 sampled fragments confirmed present in both the rule file and the source doc —
     "one verdict per disagreement" (1/2), "never auto-override a recorded verdict" (1/1), "disjoint input
     manifests" (1/2).
- **Accept met:** "the artifact exists with stamps; grep-back spot-check + hash recompute recorded in
  implementation.md" — recorded above from the orchestrator's verified run.

**Step 8 — Release: MINOR bump + validation gates.** Accept: "`plugin.json` minor-bumped once; CHANGELOG
entry; validate exit 0; gates recorded in implementation.md. No commit (owner-owed)." Skill
`nexus:release-plugin` invoked first (see `## Skills Used`), then followed its procedure:
1. **Classify (dry-run):** `node scripts/bump-plugin.mjs --dry-run --minor` → single proposal, `nexus:
   MINOR 1.19.0 -> 1.20.0` (reasons: agent instruction/behavior change; shipped command changed; skill
   change ×2 [`create-implementation-plan`, `mine-verify-cover`]; owner-escalated to minor). No other
   plugin and no `docs/**` noise affected the classification — confirms the coordinator's flag-if-anything-
   beyond-nexus-plugin-files condition did not trigger; the concurrent `docs/specs/**` edits (SddLifecycle
   tech-spec amendment, SpecArmTrigger definition/delivery artifacts, `spec-rules.md`) are correctly
   invisible to the bump tool per the "no bump: `docs/**`" policy.
2. **Bump:** `node scripts/bump-plugin.mjs --minor` → applied. `plugins/nexus/.claude-plugin/plugin.json`
   `version: "1.19.0"` → `"1.20.0"` (confirmed via `grep '"version"'` post-bump). CHANGELOG stub prepended,
   then hand-edited per the skill's step 3 into a real description of the spec-arm-trigger capability and
   its five file touch points (see `plugins/nexus/CHANGELOG.md` `[1.20.0]`).
3. **Regenerate commands:** already current — Step 6 ran `gen-commands.mjs nexus` before the bump, and the
   dry-run's own "shipped command changed" reason confirms the tool saw that diff; no second regen needed.
4. **Sync twin:** not run — twin sync (`gen-omni.mjs`, no `--check`) is owner-owed at commit per this
   repo's `CLAUDE.md` ("commit it in the `../omni` repo... after a bump so the twin's versions ride
   along"), not a developer-stint action.
5. **Validate:** `claude plugin validate plugins/nexus --strict` → `✔ Validation passed` (exit 0).
6. **Gates (`node scripts/selfcheck.mjs`, run clean, no flags):**

   | Gate | Result |
   |------|--------|
   | tests (lint + unit) | **PASS** — 0 failing |
   | gen-commands drift | **PASS** — in sync |
   | gen-omni --check | **FAIL (expected)** — omni twin drifted; owner-owed sync at commit, per repo convention, not a stint failure |
   | bump-plugin --check | **PASS** — bump present |
   | spec-diff inline-copy sync | **PASS** — 3 lib/workflow pairs in sync |
   | salience report | INFO — never fails the run |

   Overall `selfcheck: 4/5 passed (1 failing)`, exit code 1 — the single failure is the expected-RED
   `gen-omni --check`, recorded here as expected per the plan's Step 8 Accept line and the coordinator's
   explicit instruction, not treated as a gate failure.
- **No commit made** — owner-owed (ADR-18/20; plan Step 8 Accept: "No commit (owner-owed)").

*Status: COMPLETE — developer, 2026-07-03. All 8 plan steps done (Steps 1–6 and 8 by the developer; Step 7
orchestrated by the coordinator per the plan's Execution constraint and recorded here). No commit —
owner-owed.*
