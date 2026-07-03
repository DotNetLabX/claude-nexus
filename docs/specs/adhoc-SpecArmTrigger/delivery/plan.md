# Implementation Plan — adhoc-SpecArmTrigger

**Spec:** `docs/specs/adhoc-SpecArmTrigger/definition/tech-spec.md` (Status: Ready, 2026-07-03)
**Intent:** Scoped — instruction-file edits to five shipped plugin files + regeneration + one live drill
+ release. No runtime source code; no tests to author (the drill is the live proof).
**Execution constraint (binding):** Step 7's drill orchestrates background agents. A spawned developer
subagent has no spawn primitives — the developer completes Steps 1–6, hands back, the **main session
orchestrates Step 7**, relays results to the developer to record, and the developer closes with Step 8.
This is plan-sanctioned (not a deviation).
**Version/release:** one MINOR bump (OD-T3) at Step 8, after ALL edits — never per-step (repo rule).
Omni twin sync + commit are team-lead/owner-owed at close, not plan steps.

---

## Skill Mapping

| Step | Skill | TDD |
|------|-------|-----|
| 1–7 | None (instruction-file edits, regeneration, drill) | no |
| 8 | `nexus:release-plugin` | no |

No step has testable runtime behavior — the shipped deliverables are agent/skill instructions; the
mode's behavior is proven by the Step 7 drill, not unit tests.

---

## Steps

### Step 1 — `mine-from-spec` mode + prose reconciliation in `mine-verify-cover`
**File:** `plugins/nexus/skills/mine-verify-cover/SKILL.md`
**Satisfies:** AC-T1

Add the mode per spec S1/S2 + Execution topology:
- Place the input-source-axis framing adjacent to the existing depth modes (`:33-36`): mine-from-spec is
  a **source** choice (spec docs instead of a class), always at Mine→Verify depth — not a third depth mode.
- The mode section must state: the source manifest (default `spec.md`/`tech-spec.md`; extra definition
  docs only if explicitly listed), the forbidden set (production source, tests, code-arm KB, golden sets)
  stated in **every stage prompt**, citation-per-rule, the skeptic's `verified | ambiguous` verdict with
  one-line reasons, the artifact path `docs/specs/{slug}/definition/spec-rules.md`, and the **stamp
  grammar verbatim from spec S2** (per-manifest-doc lines, sha256 first 12 hex, LF-normalized content,
  `spec-rules.md` never a hash input).
- The Execution-topology rule verbatim in substance: orchestrator = the session that owns spawning;
  stages = parallel clean-room miners (background `general-purpose`) → consolidate+skeptic (background
  `general-purpose`); never delegate the whole run to one agent.
- Reconciliation: update the SDD-lifecycle section (`:202-236`) — spec-arm **Mine+Verify shipped/ungated
  via this mode; only Cover-from-spec + two-arm merge remain AC-6-gated**; scope the "ONE production
  class" (`:9`) and "reverse-engineers … the code" (`:14`) premises to the code arm.

**Accept:** all AC-T1 greps pass; no remaining "spec arm … not yet shipped / AC-6-gated" claim anywhere
in the file.

### Step 2 — `Satisfies:` third referent in `create-implementation-plan`
**File:** `plugins/nexus/skills/create-implementation-plan/SKILL.md` (the `Satisfies:` section, `:70-78`)
**Satisfies:** AC-T3 (skill half)

Add the `{ruleName}` referent (resolves to a row in the slug's `definition/spec-rules.md`) and the
guidance "rule-bearing steps *should* carry it when `spec-rules.md` exists." Preserve verbatim the
"additive and optional … never a blanket mandate" rule — the edit extends referents, never strength.

**Accept:** grep shows the ruleName referent + the preserved optional/never-blanket language.

### Step 3 — Architect join, done-check referent, technical-branch gate
**File:** `plugins/nexus/agents/architect.md`
**Satisfies:** AC-T2 (architect half), AC-T3 (agent half)

Four edits, at the anchors the spec cites:
1. **Phase 1** (`:150-164` region): read `definition/spec-rules.md` once if present/arrived; `ambiguous`
   rows feed gap analysis as pre-mined questions; stamp recompute (same LF normalization) + delta
   re-check on mismatch (re-verify citations, scan changed sections, re-stamp) — never silent-stale,
   never full re-run; the join is opportunistic, never a barrier.
2. **Phase 2**: advisory guidance — rule-bearing steps *should* carry `Satisfies: {ruleName}` when
   `spec-rules.md` exists.
3. **Done-check `Satisfies:` cross-check** (`:246` region): add the third referent — a `{ruleName}` must
   resolve to a `spec-rules.md` row; existence-validation only, still never Fail for absence.
4. **Technical-branch definition checkpoint** (`:136` region): `architect.md` has **no existing
   tech-spec review-mode checkpoint** (unlike `po.md:115-125`) — the definition review exists only as
   the ADR-27 "## Review gate" practice. **Add a minimal, net-new checkpoint** to the technical-branch
   definition flow: after authoring a tech-spec, one batched ask — review mode (self cross-check vs
   code-grounded critic) + "run mine-from-spec once Ready?" with the S3 qualification gate (rule-shaped
   behavior; silence = default-skip). Net-new in the file is sanctioned (spec S3 as revised): it codifies
   existing practice, the architect's equivalent of the PO gate — not a redundant stop.

**Accept:** AC-T3 greps (stamp/delta w/ LF, advisory Satisfies, third referent, non-barrier) + the
batched offer sits inside the new checkpoint, paired with the review-mode choice — never a separate stop.

### Step 4 — PO batched question
**File:** `plugins/nexus/agents/po.md` (`### Spec review (mandatory gate)`, `:115-125`)
**Satisfies:** AC-T2 (PO half)

Inside the existing gate section: the second question in the same batch as the review-mode choice; the
qualification gate (offer only for rule-shaped commitments — boundaries/invariants/computed outcomes; no
target-surface requirement; UI/wiring/infra → don't offer); routing rides the existing rule (standalone →
ask user; spawned → hand both choices up to the team lead).

**Accept:** question text greps inside the existing gate section; both routings named.

### Step 5 — Team-lead checkpoint + staged dispatch
**File:** `plugins/nexus/agents/team-lead.md`
**Satisfies:** AC-T4

Two edits:
1. **PO Spec-Review Checkpoint** (`:111-118`): surface the mine-from-spec question alongside self-vs-critic
   and record the confirmation (same answer-attribution discipline as `:126`).
2. **Dispatch**: on `Status: Ready` with a recorded yes — orchestrate the run's stages as background
   agents (miners in parallel, then consolidate+skeptic, `general-purpose`) **alongside** dispatching the
   architect (the `:218-224` parallel-dispatch shape); never delegate the whole run to a single background
   agent; the run never blocks the pipeline.

**Accept:** both greps (checkpoint surfacing + staged parallel orchestration).

Note: the PO checkpoint fires only for PO-defined (product) specs (`team-lead.md:113`). Team-mode
surfacing for **technical** specs is explicitly out of scope (spec Out-of-scope, critic MEDIUM-1) — do
not wire it; tech-specs are authored standalone-first in current practice.

### Step 6 — Regenerate commands
**Command:** `node scripts/gen-commands.mjs nexus`
**Satisfies:** — (repo rule: agents changed → commands regenerated)

**Accept:** `plugins/nexus/commands/{po,architect,team-lead}.md` regenerated; `git diff` shows them in
sync with the agent files. (N/A-type step — verify output exists.)

### Step 7 — AC-T5 drill (main-session step; plan-sanctioned handback)
**Executor:** main session (see Execution constraint). Developer records the results.
**Satisfies:** AC-T5
**Confidence:** medium — first live run of the mode; no direct precedent.

Run the shipped mode end-to-end on the architect-gate path, per Step 1's shipped instructions (not from
memory of this plan):
- Record a confirmation at a batched checkpoint (simulated for the drill — the recorded answer is this
  feature's own owner go-ahead).
- Manifest: `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` (exactly one doc).
- Stages: parallel clean-room miners (background `general-purpose`) → consolidate+skeptic (background
  `general-purpose`) → `docs/specs/adhoc-SddLifecycle/definition/spec-rules.md` with the stamp header.
- Spot-check: grep 3+ citations back to the source doc; verify the verdict column is fully populated and
  the stamp hash recomputes identically (LF-normalized).

**Accept:** the artifact exists with stamps; grep-back spot-check + hash recompute recorded in
implementation.md.

### Step 8 — Release: MINOR bump + validation gates
**Skill:** `nexus:release-plugin`
**Satisfies:** OD-T3

After all edits: `node scripts/bump-plugin.mjs --dry-run --minor` → verify a single MINOR proposal for
`nexus` (a bare `--dry-run` shows PATCH — the tool never auto-escalates) → apply with `--minor`. Then the repo gates: `claude plugin validate plugins/nexus --strict` (exit 0), lint/unit
suite, selfcheck (`gen-omni --check` expected-RED until the owner's twin sync at commit — not a failure).

**Accept:** `plugin.json` minor-bumped once; CHANGELOG entry; validate exit 0; gates recorded in
implementation.md. No commit (owner-owed).

---

## Plan Review

Mode: code-grounded critic (Mode 2) — architect's recommendation auto-applied (owner AFK at checkpoint;
consistent with the owner's spec-review choice). **Verdict as returned: REVISE → all findings folded;
plan approved.** Full findings: `delivery/review-critic.md` (Mode 2 section).

| # | Finding | Disposition |
|---|---------|-------------|
| HIGH-1 | Step 3 edit #4 targeted an "existing" architect tech-spec review checkpoint that the live file doesn't contain | **Fixed** — spec S3/AC-T2 corrected (checkpoint is net-new, codifies ADR-27 practice); Step 3 edit #4 rewritten with the carve-out |
| MEDIUM-1 | Team-mode technical-branch surfacing unwired and silent | **Fixed** — explicit Out-of-scope deferral in the spec; do-not-wire note on Step 5 |
| LOW-1 | Bare `--dry-run` shows PATCH, not MINOR | **Fixed** — Step 8 uses `--dry-run --minor` |
