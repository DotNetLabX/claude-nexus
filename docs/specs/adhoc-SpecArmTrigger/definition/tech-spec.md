# Tech-Spec — Spec-Arm Trigger (mine-from-spec at spec-Ready) (v1)

**Slug:** adhoc-SpecArmTrigger
**Type:** Technical feature — architect owns the definition (ADR-27).
**Status:** **Ready** (2026-07-03) — code-grounded critic pass folded (NO-GO → fixed; see `## Critic
Review`). Owner confirmed OD-T2 (manifest-only) and the critic review mode 2026-07-03.
**Implements:** `adhoc-SddLifecycle` **OD-L8 / ADR-I** (the pipeline wiring for the spec-arm trigger).
**Relationship to the gated fold-in:** this pulls forward the **Mine+Verify half** of the
`adhoc-SddCoverageLoop` roadmap step 4 (the spec front-end fold-in, absorbing the old Inc-3). The
**Cover-from-spec half, the two-arm merge, and all M1/M3 triage machinery stay gated** on the pilot's
AC-6 verdict — a pilot NO-GO does not invalidate this feature: a verified spec-rule set is a spec-quality
gate and rule KB on its own. (Known scope reality, owner-sighted: until the fold-in lands, the artifact's
only live consumer is the architect's Phase-1 read — S5.)

---

## Context

`mine-verify-cover`'s SDD-lifecycle section (shipped 1.19.0) names the spec arm and M0 as positions but
ships no way to run them. The spec-arm machinery exists only as dev-repo harness code
(`harness/spec-cover-calc.workflow.js` + `harness/lib/{spec-diff,spec-diff-calc,trace-join,independence-check,rule-crosswalk}.mjs`)
— offline-proven, ships nothing. Meanwhile the pipeline has a natural trigger point the lifecycle spec
left unwired: the moment a spec flips to `Status: Ready`.

Owner decision (OD-L8, 2026-07-03, as amended): confirmation batched into the existing spec-review
checkpoint; on Ready, **Mine+Verify from the spec** runs in the background while the architect proceeds
to Phase-1/plan; version-stamped join at plan time; Cover waits for the plan's target surface.

---

## What exists vs net-new

| Piece | State | Role here |
|-------|-------|-----------|
| `mine-verify-cover` Mine/Verify phases (clean-room miners, skeptic) | Shipped, live-proven on code | **Method template** — reused with the spec as the source (multi-agent shape preserved; see Execution topology) |
| SKILL.md `## SDD lifecycle (M0–M3)` section (`:202-236`) | Shipped stubs | Gains the operational `mine-from-spec` mode **and the reconciliation edits (S1)** |
| `po.md` `### Spec review (mandatory gate)` (`:115-125`) | Shipped | Gains the batched second question (product branch) |
| `architect.md` technical-branch definition + Review gate (`:136`) | Shipped | Gains the same offer (technical branch) — tech-specs never traverse the PO gate |
| `team-lead.md` "Background, always" (`:86`) + parallel dispatch (`:218-224`) | Shipped | Precedent for the staged background orchestration |
| `create-implementation-plan` `Satisfies:` section (`:70-78`) | Shipped | Gains the third referent (spec-rules `ruleName`), stays optional |
| `harness/lib/independence-check.mjs` | Dev-repo, proven | **Pattern source** for the blindness rule — specifically the single-manifest `checkManifest` shape (`:25-30`), NOT the two-arm shared-SRC semantics (`:9-12`); production source is *forbidden* here, stricter than the two-arm precedent. No shipped `harness/` dependency. |
| Spec-source mining instructions; stamp grammar; PO/architect/team-lead wiring | — | **Net-new** (this feature) |

The shipped mode is **agent instructions in SKILL.md** (like every other mine-verify-cover phase), not a
harness dependency — consuming repos never see `harness/`.

---

## Definition

### S1 — `mine-from-spec` mode in `mine-verify-cover`

A new **input-source mode** covering **Mine and Verify only**. Input-source is an axis orthogonal to the
skill's existing *depth* modes (Full vs Mine→Verify-only, `SKILL.md:33-36`) — mine-from-spec always runs
at Mine→Verify depth; the SKILL text must present it as a source choice, not a third depth mode.

- **Source manifest:** the miners read ONLY the mined definition docs (default: the slug's
  `spec.md`/`tech-spec.md`; additional definition docs only if explicitly listed in the manifest).
  **Forbidden:** all production source, any existing tests, any code-arm rule KB, any golden set.
  Blindness is enforced the harness way — the input manifest declared in the run artifact + the
  forbidden-path rule stated in every stage prompt (the shipped analog of `checkManifest`;
  single-manifest forbidden-path semantics, per the table note above).
- **Mine:** clean-room miners extract every testable rule the spec commits to (boundaries, invariants,
  outcome rules), each with a **verbatim spec citation** (quoted line(s)).
- **Verify:** a fresh skeptic verifies each rule against the spec text only — is it really committed to,
  is the boundary stated or invented, is it testable? Unverifiable rules are marked `ambiguous` — these
  are **spec findings**, the mode's second product.
- **No Cover, no mutation gate** in this mode — M0 may have no code to run against; test authoring waits
  for the plan's target surface (OD-L8).
- **SKILL prose reconciliation (obligatory, part of this mode's fold-in):** the SDD-lifecycle section is
  updated so that spec-arm **Mine+Verify is stated as shipped/ungated via this mode** and only
  Cover-from-spec + the two-arm merge remain AC-6-gated (mirrors SddLifecycle OD-L8 as amended); the
  "Point this at ONE production class" premise (`SKILL.md:9`) and "reverse-engineers the rules already
  encoded in the code" (`:14`) are scoped to the **code arm** so the file is not self-contradictory.

### Execution topology (who runs what)

The Mine/Verify method is **multi-agent by design** (parallel clean-room miners, then a fresh skeptic) and
**a subagent cannot orchestrate it** — subagents have no Workflow/agent/parallel primitives, and a
subagent spawning further agents is the ADR-21 breach vector. Therefore:

- **The orchestrator is the session that owns spawning** — the team lead in team mode; the main session
  (PO or architect persona) in standalone mode.
- The orchestrator runs the mode as **staged background agents**, exactly like pipeline stages: the
  clean-room miners in parallel (background), then on their completion a consolidate+skeptic agent
  (background). Stages interleave with the architect dispatch — planning never blocks on the run.
- Miner and skeptic stages spawn as **`general-purpose` agents** carrying the mode's stage prompts — they
  are method stages, not pipeline roles (no pipeline `subagent_type`, no custom names).
- "Launch the run" in this spec always means "orchestrate its stages"; never "delegate the whole run to
  one background agent" — a single agent cannot preserve miner/skeptic independence.

### S2 — Output artifact + stamp

`docs/specs/{slug}/definition/spec-rules.md` — the verified rule set:

- One row per rule: authored `ruleName`, statement, boundary, verbatim citation, verdict
  (`verified | ambiguous`), and the skeptic's one-line reason for each `ambiguous`.
- **Stamp header (pinned grammar):** one line **per mined source doc**, in manifest order:
  ```
  Spec-stamp: {repo-relative path} @ sha256:{first 12 hex} ({date})
  ```
  **Hash input = exactly the docs the miners were given (the manifest)** — never `spec-rules.md` itself
  (it lives in the same folder; including it would be circular), never unmined siblings (e.g.
  `help.tooltips.md`). **Content is LF-normalized before hashing** (CRLF repo; writer and reader must
  agree). The join recomputes per-file with the same normalization and compares line-by-line.
- The citation-per-rule is what makes the later delta re-check archival-free: a stamp mismatch is
  resolved by re-verifying each citation against the current spec + scanning changed sections for
  uncovered commitments — never a full re-run.

### S3 — The batched question (both definition branches)

The confirmation question — "run mine-from-spec once Ready?" — is batched into the **existing** spec
review checkpoint of **whichever branch defines the feature**; one checkpoint, no new stop:

- **Product branch:** `po.md`'s `### Spec review (mandatory gate)` — the review-mode question gains the
  second item. Routing follows the existing rule: standalone PO asks the user directly; spawned PO hands
  both choices up to the team lead.
- **Technical branch:** the architect is the PO-equivalent definer (`architect.md:136`); tech-specs never
  traverse the PO gate. **The live file has no written tech-spec review checkpoint** — the definition
  review exists today only as practice (the ADR-27 "## Review gate" convention every recent tech-spec
  carries, exercised interactively). This feature **formalizes that checkpoint in `architect.md`**
  (net-new *in the file*, not a new stop *in practice*) and batches the mine-from-spec confirmation into
  it: review mode + the offer, one checkpoint.
- **Qualification gate (the definer judges before offering):** offer only when the spec commits to
  **rule-shaped behavior** — boundaries, invariants, computed outcomes. No target-surface requirement at
  spec time (the PO writes product language and never reads source; rule→class tracing is the
  plan/trace-join's job, not the spec's). UI/wiring/infra specs: don't offer — silence is the
  default-skip (ADR-25: no unconditional cost).

### S4 — Launch wiring (background, parallel with planning)

On `Status: Ready` with a yes-confirmation recorded:

- **Team mode:** the team lead **surfaces and records the second question at its PO Spec-Review
  Checkpoint** (`team-lead.md:111-118`, same answer-attribution discipline as `:126`), then on Ready
  **orchestrates the run's stages as background agents** (per Execution topology) **alongside**
  dispatching the architect — stages and Phase-1 proceed in parallel; the run never blocks the pipeline.
- **Standalone:** the main session (PO or architect persona) orchestrates the stages in background on
  Ready and tells the user where the artifact will land.
- The run writes only `spec-rules.md` (+ its run record); no worktree — see OD-T2.

### S5 — Architect join (plan-time)

In `architect.md`:

- **Phase 1:** if `definition/spec-rules.md` exists (or arrives mid-phase), read it once. `ambiguous`
  rules feed the gap analysis — they are pre-mined Phase-1 questions.
- **Stamp check:** recompute the per-file hash (same LF normalization); on mismatch (Phase-1 answers
  amended the spec), run the **delta re-check** (S2 mechanism) — re-verify citations, scan changed
  sections; update `spec-rules.md` and re-stamp. Never a silent stale join, never a forced full re-run.
- **Phase 2 (advisory anchor, v1):** when `spec-rules.md` exists, rule-bearing plan steps **should**
  carry `Satisfies: {ruleName}` — strengthening the trace-join's plan-ref anchor (SddCoverageLoop HIGH-5)
  for every slug that ran the spec arm. **Advisory, not a mandate:** `Satisfies:` stays optional and
  never-blanket per `create-implementation-plan:70-78`, and the done-check still **never Fails a step
  merely for lacking it** (`architect.md:246`). The promotion to a hard gate is deferred to the fold-in,
  when the trace-join becomes a live consumer.
- **Done-check referent extension:** the `Satisfies:` cross-check gains the third referent — a
  `{ruleName}` must resolve to a row in the slug's `spec-rules.md` (alongside the existing `AC-n` and
  ADR-unit referents). Validation of the referent's *existence* only; still no Fail for absence.
- **`create-implementation-plan` touch point:** its `Satisfies:` section gains the `ruleName` referent
  and the "should, when spec-rules exists" guidance — explicitly keeping "additive and optional … never
  a blanket mandate."
- If the background run hasn't landed by Phase 2, plan without it; the join is opportunistic, never a
  barrier (the run is advisory until the AC-6-gated machinery makes it load-bearing).

---

## v1 Acceptance Criteria

- **AC-T1 — Mode shipped + prose reconciled.** `mine-verify-cover/SKILL.md` contains the `mine-from-spec`
  mode: Mine+Verify only, input-source-axis framing, source manifest + forbidden paths, citation-per-rule,
  `ambiguous` verdict, stamp grammar, and the Execution-topology rule (orchestrator = spawning session;
  staged `general-purpose` agents). **And** the reconciliation edits: SDD-lifecycle section states
  Mine+Verify-from-spec as shipped/ungated (only Cover + merge AC-6-gated); the ONE-production-class /
  reverse-engineers-code premises scoped to the code arm.
  *Proof:* grep the mode heading, forbidden-path rule, stamp grammar, topology rule; grep `:218-219`'s
  successor text for the ungated statement; no remaining "spec arm … not yet shipped" claim.
- **AC-T2 — Both branch gates wired.** `po.md`'s spec-review gate carries the batched second question +
  qualification gate + both routings; `architect.md`'s technical branch carries the same batched offer in
  a **formalized definition-review checkpoint** (net-new in the file — codifies the existing ADR-27
  review-gate practice; the offer must sit inside that checkpoint, never as a separate stop). *Proof:*
  grep both files; in `po.md` the question text appears inside the existing gate section; in
  `architect.md` it appears inside the new checkpoint, which pairs it with the review-mode choice.
- **AC-T3 — Join shipped.** `architect.md` carries the Phase-1 read, the stamp/delta rule (with LF
  normalization), the advisory `Satisfies:` guidance, the third done-check referent, and the non-barrier
  rule; `create-implementation-plan`'s `Satisfies:` section carries the `ruleName` referent and stays
  optional/never-blanket. *Proof:* grep all six.
- **AC-T4 — Dispatch shipped.** `team-lead.md`: (a) the PO Spec-Review Checkpoint surfaces + records the
  mine-from-spec confirmation; (b) the parallel staged-background orchestration at Ready. *Proof:* grep
  both.
- **AC-T5 — Proven end-to-end on a wired path (blocking).** One run in this repo exercising the
  **architect technical-branch gate**: confirmation recorded at the batched checkpoint, stages
  orchestrated as background agents, stamped `spec-rules.md` lands. Extraction quality: every rule
  carries a verbatim citation that greps back to the source doc; the skeptic verdict column fully
  populated. Candidate target: `adhoc-SddLifecycle/definition/tech-spec.md` — a process-domain spec whose
  rule-shaped commitments (C2 verdict grammar, M3 reconciliation table, AC-L1..L6) qualify under S3's
  gate. *Proof:* the artifact + a grep-back spot-check recorded in implementation.md. (The PO-gate path
  is text-verified by AC-T2; its first live traversal is AC-T6 — the two paths share the launch and join
  machinery, only the checkpoint surface differs.)
- **AC-T6 — Consuming-repo run (named, operator-owed).** First live run on the next qualifying spec in
  KG or SR — owed, not blocking ship (no qualifying spec is in flight to order up); first live traversal
  of the PO-gate path rides with it.

**Out of scope:** Cover-from-spec (needs the plan's surface — post-plan, part of the gated fold-in);
two-arm merge/triage, C1–C4, M1/M3 (AC-6-gated); promotion of the `Satisfies:` anchor to a hard gate
(fold-in, when the trace-join consumes it); any `harness/` dependency in shipped files; automation of the
delta re-check beyond agent instructions; **team-mode technical-branch surfacing** — tech-specs are in
current practice authored standalone-first (architect + owner, interactively), so the team lead's PO
Spec-Review Checkpoint never fires for them; a team-mode technical definition checkpoint is **explicitly
deferred** to the fold-in / the first team-mode technical run (named, not silent — critic MEDIUM-1).

---

## Owner Decisions

- **OD-T1 — Artifact lives in `definition/`** (`spec-rules.md`) — a derived view of the spec that must
  travel with the definition the architect reads. It is **never a hash input** (S2). Confidence: medium.
- **OD-T2 — No worktree for this slice; manifest blindness suffices.** OD-L8's literal text said
  "transient worktree"; the enforced invariant is the disjoint input manifest (SddLifecycle Topology) —
  worktrees are the mechanism for arms that author code, and return with Cover/merge. **Amends OD-L8 —
  owner-confirmed 2026-07-03.** Confidence: high.
- **OD-T3 — Version bump: MINOR** (new capability on a shipped skill + three agent files + one skill
  touch point). Confidence: high.

---

## ADRs to extract (at ship, per ADR-27/28)

- **ADR-I** (already stubbed in `adhoc-SddLifecycle`) — this feature is its implementation; extract on
  ship with the OD-T2 amendment and the Execution-topology rule folded in.

---

## Cross-references

- **Decision source:** `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` (OD-L8 as amended, ADR-I,
  Topology).
- **Method + ship target:** `plugins/nexus/skills/mine-verify-cover/SKILL.md` (Mine/Verify phases, depth
  modes `:33-36`, SDD lifecycle section `:202-236`).
- **Wiring targets:** `plugins/nexus/agents/po.md` (spec-review gate `:115-125`),
  `agents/architect.md` (technical branch `:136`, plan workflow `:150-192`, done-check `:246`),
  `agents/team-lead.md` (checkpoint `:111-118`, dispatch `:218-224`),
  `skills/create-implementation-plan/SKILL.md` (`Satisfies:` `:70-78`) — plus regenerated commands.
- **Blindness pattern:** `harness/lib/independence-check.mjs` — `checkManifest` shape only (pattern, no
  shipped dependency).
- **Gated sibling:** `adhoc-SddCoverageLoop` roadmap step 4 (Cover half + merge stay there).

---

## Critic Review

**Mode:** code-grounded Mode 1 (tech-spec vs live SKILL/agent files + harness + both parent specs).
**Verdict as returned:** NO-GO — 1 CRITICAL + 4 HIGH + 2 MEDIUM + 1 LOW — **all accepted**; this revision
applies them. Full findings persisted at `delivery/review-critic.md`.

| # | Finding | Disposition in this revision |
|---|---------|------------------------------|
| CRITICAL-1 | "Single background agent" incompatible with the multi-agent Mine/Verify method (subagents can't orchestrate; ADR-21) | **Fixed** — Execution-topology section added: orchestrator = spawning session (team lead / main session), staged `general-purpose` background agents, miners∥ then skeptic; S4 reworded |
| HIGH-1 | Content-hash stamp non-reproducible (input set, CRLF, circular spec-rules.md) | **Fixed** — hash input = the manifest docs exactly, per-file stamp lines, LF-normalized; spec-rules.md never a hash input (S2, OD-T1) |
| HIGH-2 | `Satisfies:` "must/guaranteed" contradicts skill + done-check; prompt-only guarantee; unvalidated third referent | **Fixed** — demoted to advisory "should"; done-check gains referent-existence validation (no Fail-for-absence); `create-implementation-plan` added to the edit set; hard gate deferred to fold-in |
| HIGH-3 | SKILL prose left self-contradictory (ONE-class premise; ":218-219 AC-6-gated" falsified) | **Fixed** — S1 reconciliation obligation + AC-T1 clauses |
| HIGH-4 | Trigger wired only into the PO gate; tech-specs (incl. AC-T5's target) bypass it; no blocking trigger proof | **Fixed** — architect technical-branch gate wired (S3); qualification reworded to rule-shape (no target surface); AC-T5 rewritten as an end-to-end drill on the architect-gate path; PO-path live traversal explicitly rides AC-T6 |
| MEDIUM-1 | Team-lead surfacing/recording of the second question unscoped | **Fixed** — S4(a) + AC-T4(a) |
| MEDIUM-2 | independence-check cited with two-arm shared-SRC semantics | **Fixed** — `checkManifest` single-manifest shape named; stricter forbidden set stated (table + S1) |
| LOW | "mode" overloads the depth-mode axis | **Fixed** — input-source-axis framing line in S1 |

**Systemic root cause (accepted, third recurrence in this family):** composition claims grounded in
module *vocabulary* ("reuse Mine/Verify", "spawn a background agent") rather than concrete execution
shapes (multi-agent, Workflow-orchestrated, no-subagent-primitives). Fix applied: the Execution-topology
section states the concrete shape; every wiring claim now cites the live file/line it lands in.

**Mode-2 addendum (2026-07-03):** the plan critic caught a fourth instance this pass missed — S3/AC-T2
assumed an "existing" architect tech-spec review checkpoint that the live file does not contain (HIGH-1);
S3/AC-T2 corrected above (the checkpoint is formalized net-new, codifying the ADR-27 practice), and the
team-mode technical surfacing gap (MEDIUM-1) is now an explicit Out-of-scope deferral. Full Mode-2
findings: `delivery/review-critic.md`.

---

## Review gate

Code-grounded critic (Mode 1) — **done** (above). Re-review recommended only if the owner reverses OD-T2
or the Execution-topology decision (they shape S1/S4), or if the fold-in later promotes the advisory
anchor to a hard gate (that promotion needs its own pass).
