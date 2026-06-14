# Tech-Spec — Build-Flow Formalization

**Type:** technical feature (ad-hoc TECHNICAL pass — no `spec.md`; the architect owns the definition,
per ADR-27). **Owner ratifies** (this document and the ADRs it points at land `Status: PROPOSED`).
**Status:** Draft.
**Governing source:** `docs/research/2026-06-14-end-to-end-build-flow.md` (§7 recommendations, §8
decisions). **Decisions live in the ADRs** (ADR-25…ADR-29, `docs/architecture/README.md`); this
tech-spec is the durable *rationale* home and points at them — it does **not** restate their decision
text (the one-authoritative-source rule, ADR-27).

This document is itself the **worked example** of what ADR-27 describes: a technical feature defined by
the architect as *a tech-spec + extracted ADRs*, the promoted-proposal artifact the formalized flow
prescribes (eating our own dog food).

---

## Context

The **back** of the Nexus flow (plan → build → verify → ship) is mature — well-specified across the
agent files and the ADR register. The **front** (idea → research → proposal → definition) was
**informal**: research had just shipped as the confidence-gated engine (P1, `research-before-asking.md`)
and was in build as the recall layer (P2, `search-researches` + the research-KB schema,
`adhoc-ResearchKB`), but neither was *named as a stage* with a place in the canonical flow; proposals
were freeform files in `docs/proposals/` with ad-hoc `Status:` lines and no ratification rule; the
technical/product definition split was implicit; and the team lead already depended on a
`docs/backlog.md` that did not exist.

This pass formalizes the front as a **documentation layer** — it names the stages, encodes the master
skip gate, splits the technical/product definition branch, gives proposals an RFC-lite lifecycle, closes
the one SDD traceability gap (`Satisfies: AC-n`), and creates the minimal backlog. It is **definition,
not machinery**: ADRs + this tech-spec + a `proposal-format` skill + a minimal `docs/backlog.md` + light
agent/skill edits. **No new engine, agent, or hook.**

---

## Goals

- Name the front-of-flow stages (RESEARCH, PROPOSAL, DEFINITION) and place them in one canonical
  end-to-end ordering — see ADR-26.
- Make the mandatory-vs-skippable decision **principled** via a single master gate (cost-of-being-wrong
  = uncertainty × irreversibility), retiring size-based reasoning — see ADR-25.
- Record the technical/product **definition branch** (architect owns the technical definition; PO owns
  the product definition) and operationalize it in the two definer agents — see ADR-27.
- Give proposals an **RFC-lite lifecycle** (named-owner ratification, Draft→Ratified→Superseded,
  graduate-to-spec) as front-matter (a `proposal-format` skill) + lifecycle rules (the ADR) — see
  ADR-28.
- Close the SDD requirement→task traceability gap with a lightweight, **optional** `Satisfies: AC-n`
  plan-step annotation — see R5 in the plan; wired into `create-implementation-plan` + the architect
  done-check + the reviewer Step-2 checklist.
- Create the minimal `docs/backlog.md` the team lead already depends on, with the
  ratified-proposal→row lifecycle — see ADR-29.

## Non-goals

These are **deliberately out of scope** for this pass (the boundary is intentional):

- **Building the VERIFY harness (R6).** The tiered T1–T4 harness
  (`docs/research/testing-claude-code-plugins.md`) and the `mine-verify` clean-room/adversarial pattern
  are named **by reference only** in ADR-26's VERIFY row. They are **NOT built here** — building them
  collides with the in-flight plugin-unit-test work ([Known limitations](../../../architecture/README.md),
  ADR register) and the `mine-verify` Pass-4 generic-harness seed. Promote to its own ADR when built.
- **Any redefinition or duplication of P1/P2/P3 (the hard constraint).** This flow **consumes** the
  research system — it does **not** re-specify it. RESEARCH-as-a-stage *is* P1 (the inline
  confidence-gated engine, shipped) + P2 (`search-researches` + the research schema, in build as
  `adhoc-ResearchKB`); the proposal layer adds only **impact (1–10)** and **effort (low/med/high)** on
  top of P2's research-output format. P1/P2/P3 are **referenced by name; their entry/output schemas are
  not copied** anywhere in this pass.
- **Editing `research-before-asking.md`'s recall wiring.** That file is owned by `adhoc-ResearchKB` (P2)
  for recall/capture edits. This pass only *names* the RESEARCH stage in ADR-26; it does **not** edit
  that rule file (avoids an edit race — see Cross-cutting). No shared file is edited by both passes.
- **A proposal/spec/plan vocabulary doc.** The owner barred re-proposing it (MEMORY
  "proposal-spec-plan-vocabulary"). The RFC-lite **front-matter + lifecycle** (ADR-28 + the
  `proposal-format` skill) is a different, narrower thing and is what is built here.
- **An automated Mode-0 proposal critic gate.** User-confirmation **is** the gate (ADR-28, consistent
  with ADR-13 — an automated gate on a background subagent does not hold). Documented, not enforced by
  new machinery.

---

## The formalized flow

The canonical end-to-end ordering and the named RESEARCH stage are **decided in ADR-26** — see it for
the spine, the RESEARCH stage-entry test, and the mandatory-vs-skippable matrix. **ADR-26 owns that
matrix and the stage's output-contract decision; ADR-25 owns the master gate** the matrix keys on — the
paragraphs below are the *rationale*, not the decision. The rationale this tech-spec adds:

The flow is a **logical ordering of artifacts, not a gated waterfall** (every surveyed source stresses
iteration — TOGAF ADM is an iterative information-flow model; dual-track agile runs discovery
continuously alongside delivery). The *back* three stages (PLAN, BUILD, VERIFY) are always mandatory;
the *front* three (RESEARCH, PROPOSAL, DEFINITION) flex on the master gate (ADR-25). This is exactly the
existing `solo`-lane (top-row collapse, two-way door) vs. full-pipeline (right column, one-way door)
distinction — the pass makes the choice *principled* rather than a size instinct.

RESEARCH and P1 are the **same engine at two scopes**, which is why naming the stage costs no new
machinery: P1 is the *micro* gate (fires inside any stage at the moment an agent would otherwise assume
past an unconfirmed load-bearing assumption); the RESEARCH *stage* is the *macro* placement of that same
engine at the front of large/uncertain work, before a proposal is drafted. The stage's output contract
is P1+P2's existing one (recommendation + confidence + options eliminated) — not a new artifact.

---

## The definition branch

The technical/product split — including *who owns the definition* and the ADR-register cross-check — is
**decided in ADR-27 (it owns this decision)**. The paragraphs below are the *rationale*, not the
decision. Rationale this tech-spec adds:

The split is on **who owns the definition**, and it determines the *artifact*, not the *rigor*. A
product feature has a "what & why" the PO shapes (`spec.md` + acceptance criteria); a purely technical
feature has no product "what", so the architect *is* the definer (the PO-equivalent) and the binding
cross-check is the **ADR register** (critic Mode 2), not product docs — which is what `architect.md`
already says for ad-hoc passes. Both branches converge at PLAN.

The altitude rule ("same thinking at two altitudes, one authoritative"): the **tech-spec/proposal is
where you explore**; the **ADR is the durable one-decision record**. This document is the exploration;
ADR-25…ADR-29 are the decisions extracted from it. Keeping the decisions in the ADRs and the rationale
here — with the ADRs pointing back — is the one-authoritative-source rule that prevents two drifting
decision records. On drift over time: **supersede, don't rewrite** (the same supersede-don't-delete
discipline P2 and the ADR-status convention use).

---

## Cross-cutting — the P1/P2/P3 boundary (hard constraint)

The single load-bearing constraint across this pass: **the flow consumes the research system; it does
not redefine it.** Concretely:

- **RESEARCH stage = P1 + P2.** P1 (`research-before-asking.md`, shipped 1.8.2) is the inline
  confidence gate; P2 (`search-researches` + the research-KB entry/output schema, in build as
  `adhoc-ResearchKB`) is the recall/capture layer. ADR-26 **names** them and **does not restate** their
  schemas.
- **The proposal layer's only additions** on top of P2's research-output format are **impact (1–10)**
  and **effort (low/med/high)** (ADR-28) — which also give the backlog its impact ÷ effort ordering
  (ADR-29). Recommendation + confidence + alternatives are P1/P2's, reused not re-decided; below-High
  confidence routes to research-first (the anti-regression guarantee).
- **No shared file is edited by both this pass and `adhoc-ResearchKB`.** P2 owns the recall/capture
  edits to `research-before-asking.md`; this pass only *names the stage* in ADR-26. There is **no hard
  ordering dependency**: if `adhoc-ResearchKB` has not landed, this pass still ships cleanly (it only
  references the P1 rule by name).
- **P3** (retention / eviction) is BLOCKED-on-research and out of scope here; ADR-26 does not depend on
  it.

---

## Alternatives considered

- **Leave research as P1's inline gate, no named stage** (the research's deferred §8 question).
  Rejected in ADR-26 — loses the front-of-work placement and leaves the §6 matrix's RESEARCH row
  meaningless; naming the stage costs only an ADR paragraph because it reuses P1+P2.
- **Take on R6 (build the verify harness) in this pass.** Rejected (research Q2/§7.6) — collides with
  two in-flight efforts; ADR-26 names verify by reference instead.
- **Bundle the five content units into fewer ADRs.** Rejected — the register is strictly
  one-decision-per-ADR; five coherent decisions became ADR-25…ADR-29, cross-linked rather than merged.
- **Owner ratifies all proposals with no architect recommendation** (research §3a option 1). Rejected
  in ADR-28 — a regression that discards the recommendation + confidence the agents already produce.
- **A proposal/spec/plan vocabulary doc.** Barred by the owner's prior decision; the RFC-lite
  front-matter is the narrower sanctioned thing.

---

## Unresolved

- **Ratification of these ADRs.** ADR-25…ADR-29 land `Status: PROPOSED — owner ratifies` (Q4, ADR-24
  precedent). The owner flips them to decided in the first run of the very ratification gate this pass
  defines (ADR-28). Until then the wording is the architect's recommendation, not settled architecture.
- **VERIFY harness (R6) as a future ADR.** When the T1–T4 / `mine-verify` harness is built (its own
  pass, reconciled with the in-flight plugin-unit-test + `mine-verify` Pass-4 work), promote ADR-26's
  by-reference VERIFY row to a full ADR.
- **Backlog population.** `docs/backlog.md` ships as schema + the lifecycle rule + at most one example
  row (ADR-29); back-filling existing `docs/proposals/*` into rows is operator curation, deferred.
