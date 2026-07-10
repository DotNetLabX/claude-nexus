# Tech-Spec — Conclusion-Gate Verdict Semantics (B1)

**Status:** Implemented (2026-07-10, nexus 1.26.2)
**Branch:** technical (ADR-27 — architect-owned definition)
**Provenance:** `docs/proposals/mine-family-next-wave-2026-07.md` — consolidated backlog item B1
(new candidate from the VWH evaluation, `docs/research/2026-07-10-mine-suite-vs-vwh.md` §4c).
VWH lineage: its kernel `conclusion.py` gate — refuses a CAUSAL verdict that names no single
changed variable (Pattern A, confound) and a failure/kill verdict on thin evidence (Pattern B,
premature) — built there because the prose version demonstrably kept failing. Nexus adopts the
*rules* as prose in the two verdict-bearing skills; no gate machinery.
**Plan:** `docs/specs/adhoc-ConclusionGateSemantics/delivery/plan.md`

## Problem

Two verdict classes in the pipeline can currently pass their gates on bad epistemics:

1. **Causal verdicts without a named cause-variable.** `diagnose` Phase 4's gate is "Root cause
   identified with evidence" — it enforces *probing* one variable at a time (guardrail) but not
   that the *verdict* names the one variable whose change flips the outcome. A "root cause" that
   is really two entangled changes passes the gate, and the fix built on it fixes the wrong thing.
2. **Kills on thin evidence.** A ranked hypothesis can be *eliminated* by a single ambiguous probe
   (nothing distinguishes "falsified" from "probe didn't bite"), and an "approach is unworkable"
   claim can reach escalation with one failed attempt's evidence. VWH's measured version: a
   below-target result read as failure while the trajectory was still rising — their
   highest-effort run went the *most* wrong this way.

The review side already has its thin-evidence gate — review-format's **Confidence ≥80 report
cutoff** (a sub-80 finding routes to Open Questions, never asserted). This pass adds **no second
threshold**; it adds the causal-mechanism rule the cutoff doesn't cover.

## Design

**Additive prose only, two shipped files, no heading renames** — every edit inserts into an
existing section, so no consumer (reviewer.md, developer.md:99's escalation reference, team-lead
greps) needs a repoint. No new numeric thresholds, no schema/field changes, no gate machinery.

**Edit 1 — `plugins/nexus/skills/diagnose/SKILL.md`:**

- **Phase 4 gate hardening.** The gate becomes: root cause identified with evidence, where the
  causal verdict names (a) the ONE variable whose change **flips the outcome**, (b) the confirming
  probe, and (c) what falsified the ranked alternatives. If more than one variable changed between
  last-known-good and the failure (or during probing), the verdict carries an explicit
  **`confounded`** tag — keep bisecting, or state why acting on the confounded verdict is
  acceptable (override with logged reason). Composes with the existing one-variable-at-a-time
  guardrail: that rule governs the probing; this governs the verdict.
- **Elimination rule (anchored at Phase 4's record step — where elimination is actually
  recorded).** A hypothesis is *eliminated* only by recorded falsifying evidence (the "would show
  X if true" observed absent or contradicted). A probe that neither confirms nor falsifies leaves
  the hypothesis **`inconclusive` — the resting verdict**; it stays alive and testable. One
  ambiguous probe never kills a ranked hypothesis.
- **Pre-escalation kill rule + the exhausted definition (critic F2).** An "approach is
  unworkable / unfixable" conclusion requires ≥2 distinct falsifying probes in the evidence log,
  or an explicit override with logged reason. **Escalation is a handoff, not a kill** — escalating
  to the architect with the evidence log is never gated by the elimination rule; and "3 hypotheses
  exhausted" means each top hypothesis has been probed at least once
  (confirmed / falsified / **inconclusive** — an inconclusive-alive hypothesis still counts toward
  the escalation trigger, it never defers it). (The 3-attempt circuit breaker bounds *fix
  attempts*; this bounds premature *conclusions* — the two compose, neither replaces the other.)
- **Guardrails section:** one new bullet naming the two rules (causal-verdict grammar;
  inconclusive-as-resting-verdict).

**Edit 2 — `plugins/nexus/skills/review-format/SKILL.md`:**

- **Causal-finding mechanism rule** (one Step-2 checklist bullet + the rule sentence placed in the
  `## Confidence Score` section, adjacent to the `Report cutoff — ≥80` prose — the single anchor,
  critic F4): a finding asserting *causation* ("X causes Y", a diagnosed defect mechanism) names
  the mechanism — the variable/path that produces the failure — or its **causal attribution** is
  tagged **`correlation-only`** and capped at MEDIUM. **Severity-floor carve-out (critic F1 — the
  cap acts on the attribution, never the observed impact):** a **directly-observed** CRITICAL/HIGH
  impact (data loss, security, silent incorrect output) **retains its severity floor** even when
  its mechanism is unproven — file the impact at full severity and route the unproven attribution
  to Open Questions; never collapse both into a non-blocking MEDIUM. Explicit non-change stated
  inline: the ≥80 cutoff remains the sole thin-evidence threshold — this rule adds a *grammar*
  requirement, not a second number.

## Decisions

| Decision | Why | Rejected |
|---|---|---|
| Two files only (diagnose, review-format); agent docs untouched | reviewer/critic/developer consume these skills; grep verified no overlapping grammar exists in the agent docs (`confounded`/`causal` inventory: only reviewer.md:73's Origin tag, a different concept) | also editing reviewer.md/critic.md (duplication — the skill is the single source; agents load it) |
| Prose rules, no gate machinery | VWH needed kernel code because its agent runs unattended for hours; nexus verdicts pass through fresh-context reviews (done-check, Step 2, critic) that can enforce a grammar — cheapest correct locus is MD | a hook/lint (premature — promote on recurrence per the ratchet if the prose version measurably fails) |
| No second confidence threshold | ≥80 cutoff already IS the thin-evidence gate for findings; a second number would drift against it | a separate "evidence count" score |
| Additive edits only, no heading renames | consumer-safe by construction — no repoint step needed (MineFamilyCore F6 lesson applied preventively) | restructuring diagnose's phase gates into a new section |
| Tags are prose vocabulary (`confounded`, `correlation-only`, `inconclusive`), not schema fields | zero template churn; grep-checkable; matches the family's discrete-facts doctrine | new structured fields in the findings template |

## Acceptance criteria

All signature greps verified **zero pre-edit hits** across `plugins/**/*.md` (executed 2026-07-10
— the executable-true rule):

- **AC-1 (causal-verdict gate):** `grep -c "flips the outcome" plugins/nexus/skills/diagnose/SKILL.md`
  ≥ 1 (critic F3 — exact-count was brittle against a guardrail echo);
  `grep -c "confounded" plugins/nexus/skills/diagnose/SKILL.md` ≥ 1.
- **AC-2 (elimination + kill rules):** `grep -c "inconclusive" plugins/nexus/skills/diagnose/SKILL.md`
  ≥ 2 (elimination rule + guardrail bullet); the pre-escalation rule greps on `"unworkable"` ≥ 1.
- **AC-3 (causal-finding rule):** `grep -c "correlation-only" plugins/nexus/skills/review-format/SKILL.md`
  ≥ 2 (preamble sentence + checklist bullet).
- **AC-4 (scope honesty):** `git diff --name-only` over `plugins/` shows exactly the two SKILL.mds
  + `plugin.json` + `CHANGELOG.md` — no agent docs, no other skills.
- **AC-5 (gates):** `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` and
  `node scripts/selfcheck.mjs` green; `release-plugin` PATCH bump in the same commit.

## Out of scope

- Any enforcement machinery (hook, lint rule) — promote only on measured recurrence of the prose
  rules failing (the ratchet).
- The architect done-check and escalation verdicts (plan-wrong vs code-wrong) — a later candidate
  if the pattern proves out; keep this slice at the proposal's stated 2-file scope.
- VWH's trajectory semantics (still-rising curves) — no epoch curves exist in pipeline work; the
  ported meaning is "mid-convergence fix cycles", covered by the pre-escalation kill rule.

## Definition review

Shared-artifact pass (Nexus skills) → code-grounded critic mandated; one batched pass over
spec+plan. Signature greps pre-executed (see AC preamble). `mine-from-spec` offer: default-skip.
