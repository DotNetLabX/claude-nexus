# Tech-Spec — Unattended Autonomy (v1)

**Slug:** adhoc-UnattendedAutonomy
**Status:** Draft — pending the CR-1 verify-boundary spike + owner scope confirm (critic verdict: GO-with-changes; see `../delivery/review-critic.md`)
**Owner (definition):** architect (technical branch, ADR-27)
**Ratifier:** Laurentiu (repo owner)
**Graduated from:** `docs/proposals/unattended-autonomy-2026-06.md` (Ratified 2026-06-16)
**Plan:** None
**Date:** 2026-06-16

> Technical-branch definition (ADR-27): the architect owns this tech-spec; the binding
> cross-check is the **ADR register**, not product docs. This document is *where the design
> is explored*; the durable decisions are the ADRs listed under **ADRs to extract**, which
> are extracted (not re-authored) when this spec reaches `Ready`.

---

## Context

**Goal.** Run Nexus unattended overnight as jobs/pipelines — specs in, verified work (or a
triaged review queue) out by morning.

**The two gaps that define the work** (code-grounded research, `docs/research/2026-06-16-*`):
Nexus already leads the field on orchestration, engineering, observability, and attended UX,
and has exactly two weak axes — **verification rigor (3/10)** and **enforcement on background
subagents (6/10, capped by ADR-13)**. Those two axes *are* unattended operation.

**The hard constraint (owner-stated, non-negotiable).** The attended pipeline must not break.
v1 is **strictly additive** — a switch, not a rewrite. This constraint is the spec's spine and
is made mechanical by AC-0.3 (the golden test).

**v1 scope (owner decisions, 2026-06-16):** Layers **0 + 1 + 3** only — mode switch,
verification gate, fail-closed defer-to-queue. Owner chose: *thin slice first*, *fail-closed*,
*Stop-boundary gate (no MCP server)*. Layers 2 (enforceable advancement) and 4 (anti-gaming
holdout) are roadmap, defined only by name here.

**Out of scope:** any change to attended behavior beyond the named additions; the Layer-2
enforcement mechanism (gated behind a spike); holdout scenarios; T3/T4 eval CI-wiring (a
separate deferred owner decision); true headless-on-subscription (ToS/cost).

---

## What already exists — v1 extends, does not reinvent

Inventory (resolved Unresolved #5 from the proposal), so v1 wires into the current machinery:

| Existing | Where | v1 relationship |
|----------|-------|-----------------|
| `[UNATTENDED]` mode convention | `team-lead.md:383` (the behavioral switch), `agents-workflow.md:56`, `questions-format` | **Reuse the flag** — do not add a parallel mode signal. |
| `pipeline-gate.js` is fail-open-by-design but **does not read the flag** | `pipeline-gate.js:101` (`// no state -> fail open`) | Safe under `-p`; **not** a consumer of the mode signal — do not wire the flag here (CR-2). |
| Unattended phase-failure = retry-once-then-skip-and-record | `team-lead.md:319` | **Evolve** → defer the item to the review queue instead of a silent skip. |
| Unattended escalation = "fail the run (record the outcome), never escalate to a human" | `team-lead.md:330` | **Evolve** → "fail the run, record, **and enqueue for human resume**." Already fail-closed in spirit; v1 adds the structured queue + resume path. |
| Attended `Force-accept` option | `team-lead.md:327` | **Stays attended-only.** Unreachable under `[UNATTENDED]` (AC-3.4). |
| No `Stop`/`SubagentStop` hook exists | `hooks/hooks.json` (only SessionStart / PreToolUse / PostToolUse) | **Net-new hook event** for the Layer-1 gate — clean insertion, nothing to refactor. |
| Observability: `audit-logger`, `boundary-detector`, `read-tracker`, `skill-tracker`, `violations.log`, `consumption-report` | `hooks/`, `.claude/audit/` | **Reuse** as the morning-review evidence; the gate writes its verdict here. |
| Dogfood suite: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` + `scripts/selfcheck.mjs` | `tests/`, `scripts/` | **The verify target for this repo** (AC-1.4) **and** where the golden test lives (AC-0.3). |

---

## v1 definition & acceptance criteria

The plan's steps will carry `Satisfies: AC-n`. Acceptance is grep/test-checkable where noted.

### Layer 0 — Mode switch + the attended-unchanged guarantee
- **AC-0.1** A single mode signal (the existing `[UNATTENDED]`) governs *all* autonomous
  behavior. No new parallel flag.
- **AC-0.2** With the flag off, every code path is identical to the pre-v1 baseline — new
  behavior is **unreachable** when attended. (Design rule: new logic branches on the flag; it
  never alters the shared path.)
- **AC-0.3** A **golden regression test** in `tests/` pins attended-unchanged with concrete,
  offline observables (matching the repo's hook-test idiom — stdout/exit-code/written-artifact
  assertions, cf. `tests/unit/pipeline-gate.test.mjs`): with no `[UNATTENDED]` token, **(a)** the
  new verify-gate hook is a **no-op on output and filesystem** (zero deny output, no queue
  artifact written); **(b)** `pipeline-gate.js` and `guard.js` produce **byte-identical decisions
  to a pre-v1 snapshot** for fixtures X/Y/Z; **(c)** the gate's *advisory* run in attended mode
  does **not** alter exit codes or block. Runs in the existing `node:test` CI gate. *This test
  must exist and pass before any other v1 code merges* — it is the mechanical form of the hard
  constraint (CR-3).

### Layer 1 — Verification gate (advisory attended / authoritative unattended)
- **AC-1.1** A new **`SubagentStop` hook, keyed to the implementation subagent's completion**,
  runs the project's declared verify command set and **writes a verdict** the foreground
  team-lead then reads. It only needs to **run + record**, never to *deny* — which is within
  Probe-P1's confirmed behavior ("PostToolUse/SubagentStop *runs* on background subagents", ADR-13);
  the ADR-13 deny-drop does not apply because v1 enforces by *consuming the recorded verdict*,
  not by a hook deny. **Blocked on the CR-1 spike** (does `SubagentStop` fire per-phase with the
  needed payload, and is the team-lead always foreground? — see Prerequisite spike).
- **AC-1.2** **The verify *execution* is one code path; the only branch is verdict
  *consumption*.** The gate always runs and records the same way. The single fork is who reads
  the verdict — the human in attended (informs, human decides), the pipeline in unattended (the
  verdict *is* the decision). This consumption branch is the one place ADR-19's drift risk lives,
  so it is deliberately kept to that single, testable fork — there is no second verify
  implementation to rot (CR-4).
- **AC-1.3** Verify commands are **project-declared** (config) with a detection fallback.
  *(Decision D1 — recommend `.claude/verify.json`.)*
- **AC-1.4** Dogfood: for this repo the command set is
  `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` + `node scripts/selfcheck.mjs`.
- **AC-1.5** The gate writes its verdict to the audit trail (`.claude/audit/`) so the morning
  review can reconstruct the run.

### Layer 3 — Fail-safe budgets + fail-closed defer
- **AC-3.1** Under `[UNATTENDED]`, on **verify-fail OR 3-cycle-cap-exhausted OR a genuinely
  unanswered question**, the run **defers the item to the review queue** — never force-accepts,
  never silently skips. (Evolves `team-lead.md:319/:330`.)
- **AC-3.2** The review queue is a **structured artifact** capturing, per deferred item: slug,
  the failing gate/reason, the audit-trail pointer, and the **resume instruction**. Resume
  **reuses the existing ADR-19 idempotency machinery** — `communication-log.md` + `.pipeline-state`
  (Step/Cycle), with `summary.md`⇒done / log⇒resume-from-step — so re-entry continues at the
  failing phase and **does not re-run completed work** (a cold restart is wrong). *(Decision D2 —
  recommend a queue dir + index over that resume state; CR-5.)*
- **AC-3.3** A **per-run token/cost cap** aborts-to-queue when exceeded. In attended the human
  is the governor, so the cap is advisory/inert. *(Decision D3.)*
- **AC-3.4** Unattended **never force-accepts and never force-ships.** Worst case is "deferred
  to the queue." `Force-accept` (`team-lead.md:327`) remains attended-only and unreachable
  under `[UNATTENDED]`.

---

## Roadmap (named only — NOT defined or planned here)

- **Layer 2 — enforceable advancement.** "No phase advance without recorded verification," via
  a Stop-boundary + cooperative-tool-call gate that survives background subagents (owner chose
  this over a stateful MCP server). **Gated behind a Probe-P1-style spike** — it rests on the
  one unconfirmed assumption (does the cooperative-tool-call route actually enforce on a
  background subagent without an MCP server?). v1 does **not** depend on it.
- **Layer 4 — anti-gaming holdout.** joycraft pattern (verified in source): separate private
  repo, one-way spec dispatch, tests against the **built artifact** in CI, GitHub-App-token
  access. Lives entirely outside the in-session path → cannot touch attended mode by
  construction. Phased last.

---

## ADRs to extract (on reaching `Ready`, per ADR-27/28)

Extracted, not re-authored — terse one-decision records pointing back at this spec. Next free
number is **ADR-30**.

- **ADR-30 — Autonomy is an additive mode (switch, not rewrite).** Default-off; new behavior
  unreachable when attended; one advisory-or-authoritative code path; pinned by a golden test.
- **ADR-31 — The verification gate at the `SubagentStop` boundary.** Net-new `SubagentStop`
  hook keyed to the implementation subagent; **runs + records a verdict only — never denies**
  (within Probe-P1's confirmed behavior, so the ADR-13 deny-drop does not apply); advisory in
  attended, authoritative in unattended via verdict *consumption*. *(Text contingent on the CR-1
  spike — write it to claim only run/record, not deny.)*
- **ADR-32 — Unattended fails closed → review queue.** Never force-accept/ship; evolves the
  existing `team-lead.md:319/:330` record-and-don't-wait behavior with a structured, resumable
  queue. **Cite ADR-15** — ADR-32 is the unattended *replacement* for the graduated-intervention
  menu (which is attended-only), not a competitor to it.
- *(Layer-2 enforcement and Layer-4 holdout get ADRs only when built.)*

---

## Open decisions (for the critic Mode-2 review / owner, before `Ready`)

- **D1 — Verify-command config location & shape.** Rec: a small explicit `.claude/verify.json`
  (commands + which are blocking) with runner-detection as fallback. Confidence: medium-high.
- **D2 — Review-queue format & location + resume path.** Rec: a queue directory (e.g.
  `docs/specs/_review-queue/` or `.claude/review-queue/`) holding one file per deferred item +
  an index; resume re-enters the attended pipeline at the recorded failing phase. Confidence:
  medium.
- **D3 — Per-run budget governor.** Rec: a token cap the team-lead reads at each checkpoint,
  abort-to-queue on breach; reuse the `token_audit` reading machinery. **Caveat (CR-D3):**
  `token_audit` is opt-in/off-by-default (ADR-11), so an unattended run must **enable it** or the
  governor is inert — state the dependency, or carry a lightweight always-on counter for the cap.
  Confidence: medium.
- **D4 (deferred) — Layer-2 spike scope.** Defined when Layer 2 is scheduled, not now.

---

## Prerequisite — verify-boundary spike (blocks `Ready`)

CR-1 (the critic's one CRITICAL): AC-1.1's enforcement boundary is verified-by-assertion, not by
the platform. Before this spec reaches `Ready` and a plan is written, run a **Probe-P1-style
in-repo spike** (the same pattern the Layer-2 roadmap already uses) answering:
1. Does a **`SubagentStop` hook fire when the implementation subagent completes**, and does its
   payload identify the subagent/phase? (The gate keys off this — AC-1.1.)
2. Does it **run and write** when the subagent is background (expected yes, per Probe P1), so the
   gate needs only run+record, not deny?
3. **Per-phase vs end-of-run:** is there a fire point after *implementation* specifically, or only
   at end-of-pipeline? This changes what AC-3.1's "defer the item" can mean.

If the spike shows the needed boundary does not fire as assumed, Layer 1 is re-scoped (fall back to
the team-lead reading verify at each foreground checkpoint, or the maestro-style cooperative
tool-call from the Layer-2 roadmap) **before** planning — not discovered mid-implementation.

**Owner scope question (retires the CRITICAL's edge case):** confirm that unattended runs always
use the **standalone / foreground (`claude -p`) team-lead** as the main session. If yes, the
team-lead-as-subagent case (ADR-21) is out of v1 scope and CR-1 downgrades from CRITICAL to HIGH.

## Critic Review

Mode-2 code-grounded critic, 2026-06-16 — **verdict: GO-with-changes** (full record:
`../delivery/review-critic.md`). All five findings accepted and folded in: CR-2 (inventory fix),
CR-3 (AC-0.3 observables), CR-4 (AC-1.2 reword), CR-5 (AC-3.2 → ADR-19 resume) are **resolved in
this spec**; CR-1 (verify boundary) is addressed by the Prerequisite spike above + the owner scope
question, and **gates `Ready`**. ADR-31/32 and D3 notes updated per the critic.

## Review gate

This is the technical branch (no product `spec.md`), so the review is **critic Mode-2 against
the ADR register** (plan/spec steps ↔ ADR acceptance), not a product-spec diff. Recommend a
**code-grounded** critic pass (it touches shipped hooks + agent files + the test suite — a
doc-only review is structurally blind here, per the architect's shared-artifact rule). On a
clean review the spec moves `Draft → Ready`, the ADRs extract, and the plan follows.
