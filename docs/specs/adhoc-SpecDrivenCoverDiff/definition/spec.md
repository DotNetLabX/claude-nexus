# Tech-Spec — Spec-driven Cover + spec-vs-code diff

**Status:** Spike complete — **GO** (2026-06-25; see `delivery/spike-result.md` + `delivery/summary.md`). Full build now warranted; ADR-A..D to extract, code-grounded critic mandatory at the build plan.
**Type:** Technical feature (architect-owned definition; ADR-27/28)
**Graduates from:** `docs/proposals/spec-driven-cover-and-diff.md` (Draft, Confidence Medium → spike-first)
**Research basis:** `docs/kb/research/spec-driven-test-generation.md`
**Plan:** `docs/specs/adhoc-SpecDrivenCoverDiff/delivery/plan.md`
**Date:** 2026-06-24

## Problem

The Mine→Verify→Cover harness is code-derived — it mines rules *from source*, so it can only test
behavior the code already exhibits. It is structurally blind to **sins of omission** (the spec requires
X, the code never implemented X) and can faithfully encode a bug as a "rule." The inverse,
**spec-driven** direction closes that blind spot; the **diff** between the two rule sets is the
headline output (the JEST / SPECA pattern — see research entry).

This tech-spec is **where the direction is explored**. The full build is **not** committed here — it is
gated on a one-class **spike** (the plan) that confirms three unconfirmed, harness-specific assumptions.
Only a go on all three graduates this spec to a full build plan with ADRs extracted.

## Scope

**In (spike):** one KG class; spec rules authored by the PO independent of the implementation; a
rule→code-location step; spec-driven Cover (reusing the existing engine) producing mutation-gated tests;
the three-axis diff; a go/no-go writeup.

**Out:** replacing the code-derived harness (the two are complementary); a formal-spec/MBT toolchain;
multi-class sweep; the language adapter beyond .NET; coverage as any gate; productionizing the
spec-driven direction as a shipped skill (that is the post-spike build).

## ADR units (to be *extracted*, not re-authored, on a go)

- **ADR-A — Pluggable rule source / Cover-engine reuse.** The Cover engine accepts a rule set from
  either Mine→Verify (code-derived) or a spec front-end; everything downstream of "verified rules"
  (Cover agent, §6 gate battery, clean-room isolation, mutation gating) is unchanged.
- **ADR-B — The three diff axes are the deliverable.** `spec ∧ ¬code` (missing features — the headline),
  `code ∧ ¬spec` (undocumented behavior / enshrined bug), `both-divergent` (boundary disagreements).
- **ADR-C — Oracle isolation is mechanical, not prompt.** Spec-rule authoring and spec-driven test
  generation must not share LLM context with the implementation (research: contamination is the #1
  validity threat — the model otherwise mirrors buggy code into the "spec").
- **ADR-D — Red-on-current = candidate bug, routed not gated.** In the spec-driven direction a test that
  fails on current code is the *expected primary output* (code violates spec), not an edge case to gate
  away; it routes to a candidate-bug queue, never deleted.

## Acceptance criteria (the spike must satisfy all five to return a clean go)

- **AC-1** — A spec source exists for the chosen class, authored independent of the implementation and
  the existing tests (the PO golden rules double as this input). Isolation is demonstrable, not asserted.
- **AC-2** — Every spec rule is mapped to the code path(s) that should implement it (rule→code location),
  or explicitly flagged "no code found" — which is itself a candidate sin-of-omission.
- **AC-3** — Spec-driven Cover produces mutation-gated tests for the chosen class via the existing
  engine; red-on-current tests are captured as candidate bugs, not discarded.
- **AC-4** — The diff classifies every rule into exactly one of the three axes; each `spec ∧ ¬code` item
  carries either a red test or a "code-missing" note.
- **AC-5** — A go/no-go writeup answers each of the three unknowns (usable spec source; rule→code
  location feasible; diff signal usable for triage) and reports a candidate-bug count from the diff.

## The three unknowns the spike resolves

1. **Spec source on KG** — is there a usable spec beyond the PO-authored golden rules? (If golden rules
   are the only source, viable but bounded to what the PO writes.)
2. **rule→code location** — the one genuinely new piece (the code-derived harness gets this free by
   starting *from* a class). Manual for the spike; retrieval at scale is unproven.
3. **Diff signal-to-noise** on a real, already-tested KG class — could be dominated by trivial wording
   mismatches; triage cost is the risk.

## Review gate

No spec to diff (ADR-register pass). The plan's review is **Mode 2 against this tech-spec's AC list**.
The spike plan itself is a **two-way-door experiment** (master gate ADR-25 → low ceremony): self-review
against the AC mapping is sufficient. The **code-grounded review becomes mandatory at the full-build
plan** (shared/external-artifact change to `harness/**`), not for the spike.
