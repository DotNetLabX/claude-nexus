# Critic Review — adhoc-SpecArmTrigger tech-spec (Mode 1, code-grounded)

**Date:** 2026-07-03. **Verdict as returned: NO-GO for `Status: Ready` (1 CRITICAL + 4 HIGH + 2 MEDIUM +
1 LOW).** All findings accepted; dispositions in the tech-spec's `## Critic Review` section.
Persisted verbatim by the architect (the critic writes no files, ADR-13).

---

## Cross-reference Matrix

| Spec claim / requirement | Live-source check | Status | Notes |
|---|---|---|---|
| SKILL has `## SDD lifecycle (M0–M3)` naming spec arm + M0 stubs | `SKILL.md:202-236` | COVERED | Accurate — M0 named, spec arm "not yet shipped / AC-6-gated" |
| Reuse Mine/Verify (clean-room miners + skeptic) as method template | `SKILL.md:20-31, 21` (3 miners), `189` (orchestrator, agents do I/O) | **CONTRADICTED** | Method is multi-agent + Workflow-orchestrated; spec frames run as "a background agent" — CRITICAL-1 |
| po.md `### Spec review (mandatory gate)` w/ two-mode Q + routing | `po.md:115-125` | COVERED | Section exists; batching structurally compatible |
| Batched second question | `po.md:117-125`; `team-lead.md:111-118` | PARTIAL | PO side fits; team-lead surfacing not scoped — MEDIUM-1; placement misfit — HIGH-4 |
| architect Phase 1 / Phase 2 structure for the join | `architect.md:150-164, 180-192` | COVERED | Real target sections |
| `Satisfies:` is *currently optional* | `create-implementation-plan:70-78`; `architect.md:246` | COVERED (claim accurate) | Proposed "must" conflicts — HIGH-2 |
| team-lead "Background, always" + parallel dispatch precedent | `team-lead.md:86, 218-224` | COVERED | Accurate precedent |
| independence-check = manifest tripwire; no harness dep shipped | `independence-check.mjs:16-63` | COVERED | Mechanism accurate; forbidden-set semantics diverge — MEDIUM-2 |
| spec-arm exists as harness code, offline-proven | `harness/lib/*.mjs`; `spec-cover-calc.workflow.js:59-61` | COVERED | Accurate |
| OD-L8 amendment / Topology / AC-6 boundary | SddLifecycle `:104-110, 181-194` | COVERED | Consistent |
| Roadmap step 4 / Inc-3 absorption; HIGH-5 Satisfies-optional | SddCoverageLoop `:12, 123-127, 198, 227` | COVERED | Both grounded |
| Existing SKILL prose stays coherent after adding the mode | `SKILL.md:9, 14, 218-219` | **MISSING** | "ONE production class" premise + "spec arm AC-6-gated" left contradictory — HIGH-3 |
| Trigger fires end-to-end (blocking proof) | AC-T2/T3/T4 grep-only; AC-T5 target bypasses PO gate | **MISSING** | No blocking AC proves the trigger — HIGH-4 |

---

## Findings

### [CRITICAL-1] Execution topology undefined; "single background agent" incompatible with the multi-agent clean-room method
The spec reuses mine-verify-cover's Mine/Verify shape — 3 clean-room miners + a fresh skeptic
(`SKILL.md:21,23`), Workflow-orchestrated, "agents do all I/O" (`SKILL.md:189`) — but S4 frames the
launch as a single delegated background agent. Both cannot hold: a subagent has no Workflow/agent/parallel
primitives (`create-implementation-plan/SKILL.md:113`), and a subagent spawning further agents is the
ADR-21 breach vector. Failure: the planned single agent either can't run the method or collapses
miner/skeptic independence (the method's entire value). Options: (a) the spawning session (team lead /
main session) orchestrates the stages itself; (b) declare a simplified single-agent mine+self-verify and
own the independence trade-off; (c) harness-Workflow-only (not shippable — contradicts "no harness
dependency"). Name the `subagent_type` that runs each stage.

### [HIGH-1] Content-hash stamp not reproducibly defined
Input set unspecified (`definition/*`? includes `help.tooltips.md`? — and OD-T1 puts `spec-rules.md`
*inside* `definition/`, a circular hash input); no newline normalization (CRLF repo); no ordering. Failure:
per-join spurious mismatch (delta re-check fires every time) or under-scoped set makes a real edit
hash-match — the exact "silent stale join" S5 claims to prevent. Pin file list, ordering, LF normalization.

### [HIGH-2] Conditional `Satisfies:` "must" conflicts with shipped rules; the "guarantee" is prompt-only
`create-implementation-plan:70-78`: "additive and optional … never a blanket mandate." `architect.md:246`:
"never Fail a step merely for lacking it." S5's "must … guaranteed anchor" wires into architect.md only,
leaves the governing skill + done-check contradicting it, introduces a third referent
(`Satisfies: {ruleName}`) the done-check can't validate, and ships with no enforcement (the
`architect.md:217` anti-pattern). Scope all three touch points; drop "must/guaranteed" or pair with a real
done-check Fail.

### [HIGH-3] SKILL.md prose left self-contradictory
`SKILL.md:9` "Point this at ONE production class"; `:14` "reverse-engineers the rules already encoded in
the code"; `:218-219` "the spec arm … not yet shipped — its live run is AC-6-gated." The mode inverts the
premise and falsifies 218-219 the moment it ships; AC-T1's grep passes on additions alone, so the
contradiction ships unflagged. Add an explicit reconciliation obligation + AC clause.

### [HIGH-4] Trigger wired only into the PO/product gate; technical specs (the natural qualifiers, incl. AC-T5's own target) bypass it; no blocking AC proves the trigger fires
PO writes product language, never reads source (`po.md:50,94`) — "identifiable target surface" misfits;
tech-specs are architect-owned (`architect.md:136`) and never traverse the PO gate. AC-T5's target
(SddLifecycle tech-spec) is a technical spec that wouldn't route through the wired path, and AC-T2/T3/T4
are text-presence greps. Net: nothing blocking demonstrates trigger→run integration. Wire the architect's
technical-branch gate too (or defer explicitly with an owner) and make the smoke target traverse a wired
path; reconcile the qualification wording with the PO's product-language constraint.

### [MEDIUM-1] Team-lead surfacing of the batched second question unscoped
`team-lead.md:111-118` surfaces only self-vs-critic; S4/AC-T4 name only the launch. The "yes-confirmation
recorded" precondition has no defined provenance. Add the checkpoint edit (surface + record) to S4 and
AC-T4.

### [MEDIUM-2] independence-check analog cited with the wrong semantics
`independence-check.mjs:9-12`: both arms legitimately share production source (SRC); its core is cross-arm
disjointness. mine-from-spec is single-arm and forbids production source entirely — the relevant primitive
is `checkManifest` (`:25-30`) with a stricter forbidden set. Note the shape difference so the implementer
doesn't restate shared-source semantics.

### [LOW] "mode" terminology overload
`SKILL.md:33-36` "Two modes" is a depth axis (Full vs Mine→Verify-only); mine-from-spec is an orthogonal
input-source axis. One framing line in S1 resolves it.

---

## Gap analysis (critic's, verbatim gist)

- **Systemic (same as both parents):** reuse/composition claims grounded in module *vocabulary*
  ("reuse Mine/Verify", "spawn as a background agent") rather than concrete execution shapes
  (Workflow-orchestrated, multi-agent, no-subagent-primitives). CRITICAL-1 is that gap.
- **Standalone value thin but real:** every immediate consumer of `spec-rules.md` except the architect's
  Phase-1 `ambiguous`-rules read is AC-6-gated. Defensible pull-forward; owner's eye warranted.
- **Consistency with both parent specs: clean.**

**Critic self-audit:** all CRITICAL/HIGH findings survive with line evidence + failure scenarios;
CRITICAL-1 confidence HIGH — refutable only by the owner already intending a specific topology, in which
case the spec must state it.

---
---

# Critic Review — adhoc-SpecArmTrigger plan (Mode 2, code-grounded)

**Date:** 2026-07-03. **Verdict as returned: REVISE — GO after one HIGH.** 1 HIGH + 1 MEDIUM + 1 LOW, no
CRITICAL. All accepted and folded (dispositions in `plan.md ## Plan Review`; spec S3/AC-T2/Out-of-scope
corrected in the same pass). Persisted by the architect (critic writes no files, ADR-13).

## Findings

### [HIGH-1] Step 3 edit #4 targets an architect "tech-spec review gate" that does not exist in the live file
`architect.md:136` is a definition-*ownership* bullet, not a review checkpoint; exhaustive grep of
architect.md finds review-mode checkpoints only for **plan** review (`:159`, `:160-178`, `:336-338`); the
pipeline diagram (`:322-340`) has a definition-review gate only on the **PO** branch. The spec's S3
premise ("batched into the **existing** checkpoint … no new stop") is unsatisfiable for the technical
branch as written — the checkpoint must be **created**. AC-T2's "not as new sections" proof would fail at
done-check. Fix: state the checkpoint as net-new-in-file (codifying the ADR-27 review-gate practice — the
architect's equivalent of the PO gate), carve out AC-T2 accordingly. Confidence: HIGH.
**Systemic note: fourth instance of the family both parent specs were caught on** — a wiring claim
grounded in an assumed structure ("a review gate") the live file does not contain.

### [MEDIUM-1] Team-mode technical-branch surfacing unwired and unacknowledged
`team-lead.md:113`: the PO Spec-Review Checkpoint fires **only when the team lead spawned the PO** —
never for architect-defined tech-specs. Step 5 wires surfacing only there; neither spec nor plan said
whether team-mode-technical surfacing is wired or deferred (silence ≠ deferral). Non-blocking (drill is
standalone; AC-T6 operator-owed) but the feature's headline path had no team-mode checkpoint. Fix: (b) —
explicit Out-of-scope deferral. Confidence: MEDIUM (refutable if team-mode tech-specs are unsupported by
design — which is what the deferral now states).

### [LOW-1] Bare `--dry-run` proposes PATCH, not MINOR
`bump-plugin.mjs:40,111,137,146` — `OVERRIDE_TIER` null without `--minor`/`--major`; the tool never
auto-escalates. Step 8's "verify single MINOR proposal" needed `--dry-run --minor`. Confidence: HIGH.

## Verified clean (highlights)
All other anchors live-verified (SKILL.md `:9/:14/:33-36/:202-236/:218-219`; create-implementation-plan
`:70-78`; architect.md `:150-164/:246`; po.md `:115-125` incl. routings `:121-123`; team-lead.md
`:111-118/:126/:218-224`); `gen-commands.mjs` regenerates all 8 agents (3 diffs expected);
`bump-plugin.mjs` supports the claimed flags; the subagent-can't-spawn premise confirmed verbatim
(`create-implementation-plan/SKILL.md:113`); AC→step mapping complete; AC-T6 correctly absent; ordering
correct (regen after agent edits; single bump last; drill artifact under `docs/` doesn't perturb the
bump); handback flow coherent with role rules; Step 7's hash-recompute accept is the S2 reproducibility
proof.
