# Proposal — Spec-driven Cover + the spec-vs-code diff (the inverse of Mine→Verify→Cover)

**Status:** Draft
**Decision-maker:** Laurentiu (owner)
**Recommendation:** Build the inverse, **spec-driven** direction as a second front-end on the *existing* Cover engine, whose headline output is the **spec-vs-code rule diff**; prove it first as a scoped spike on one knowledge-gateway class, with the PO-authored golden rules doubling as the spec input. Gate on mutation kill, never coverage.
**Confidence:** Medium — the *direction* is validated by external research (sins-of-omission blind spot, the diff technique, mutation>coverage are all corroborated by multiple real sources; see `docs/kb/research/spec-driven-test-generation.md`). It is **not High** because three build assumptions specific to *our* harness are unconfirmed: a usable spec source on KG, the rule→code-location step, and oracle isolation in our pipeline. Per ADR-28, Medium → the recommendation is **spike-first**, not ratify-and-build-blind.
**Impact:** 7 — finds a bug class the current harness structurally cannot (missing features), and is the natural complement that makes the harness bidirectional.
**Effort:** med — high reuse of the Cover engine; the new pieces (spec front-end, rule→code location, diff) are real but bounded. The spike is low; the full build is med.
**Date:** 2026-06-24

## Need

The current Mine→Verify→Cover harness is **code-derived** (bottom-up): it mines business rules *from source*, so by construction it can only ever test behavior the code already exhibits. Research confirms this is a **structural blind spot**, not a tuning gap — characterization / regression-oracle tests cannot detect behavior the code never implemented (Feathers' definition; the 2024 RBTG survey: code-based generation "may not address issues arising from misunderstandings or mistakes in the analysis or design phases"). The harness has **no mechanism to find "the spec requires X, the code never implemented X"** (a sin of omission) — and a mined rule can faithfully encode a bug as if it were correct.

**Why now:** the owner is about to have the KG PO author a **golden rule set** (to measure recall on the planned KG run). That same artifact — human/PO-authored business rules — is *exactly* the spec input the inverse direction needs. The golden set does **double duty**: recall yardstick for the code-derived run *and* the spec source for the inverse run. The two ideas converge on one artifact, so building the inverse now is cheap-to-try.

**Out of scope:** replacing the code-derived harness (the two are complementary — run both); a full formal-spec / model-based-testing toolchain; the language adapter beyond .NET; coverage as any kind of gate.

## Approach

Add a **second front-end** (spec source) onto the *existing* Cover engine. Rules come from PO/human-authored business rules (or docstrings / acceptance criteria) instead of from Mine→Verify. Everything downstream of "verified rules" — the Cover agent, the §6 gate battery, clean-room isolation, Stryker mutation gating — is reused unchanged.

Pipeline (the inverse direction):
1. **Spec rules authored independently** (PO), with hard isolation from the implementation — *no shared LLM context with the code*. Research flags oracle contamination (the model mirroring buggy current code into the "spec" rule) as the **#1 validity threat**; our existing clean-room split already positions us for this.
2. **rule→code location** — map each spec rule to the code paths that *should* implement it. This is the one genuinely new engineering piece (the code-derived harness gets this for free by starting *from* a class). Manual (PO points at the class) for the spike; retrieval-based at scale.
3. **Cover generates tests per rule**, gated on mutation kill (unchanged engine). A red-on-current test is the **primary, expected output here** — a spec rule the code violates is a candidate bug — not the rare edge case it is in the code-derived direction.
4. **The diff** (the headline deliverable). Run both directions independently and diff the rule sets on three axes:
   - **spec ∧ ¬code** → missing features / sins of omission — *the signal the current harness cannot produce at all*. Triage first.
   - **code ∧ ¬spec** → undocumented behavior or an enshrined bug — human ruling.
   - **both, divergent conditions** → boundary disagreements (the band-edge / off-by-one class).

   This is the established **JEST / SPECA** pattern (spec as the "N+1 implementation"; spec checklist vs. code audit), not a novel invention.

## Benefits

- **Finds sins of omission** — a bug class the code-derived harness is structurally blind to (research-confirmed).
- **The diff itself finds real bugs** — not just stronger tests. Prior art: JEST found 44 engine + 27 spec bugs; SPECA found 4 novel production bugs (one missed by all 366 human auditors) precisely by diffing spec-derived properties against implementations.
- **High reuse** — mostly a new front-end on the proven Cover machinery; the gate battery, isolation, and mutation gating carry over.
- **The PO golden set does double duty** — recall yardstick + spec input — so authoring it is not extra work for this.
- **It cross-checks the existing harness** — rules both directions agree on are high-confidence; every divergence is a finding. The two directions validate each other.
- **Mutation-gated, not coverage-gated** — keeps the harness's honest acceptance signal; research independently confirms mutation score is the stronger objective (Meta ACH: 49% of mutant-killing tests added *zero* new line coverage).

## Alternatives

- **Property-based testing from specs (FsCheck on KG).** Encode spec invariants as properties, run against the implementation. Lighter build, .NET-native, industrially validated — but a lower ceiling on missing-feature detection unless properties are written to *explicitly require* a behavior. A good **fallback** if the LLM spec-oracle path proves too noisy.
- **Model-based testing (behavioral model → tests).** Strongest for complex stateful systems, but heavy model authoring + maintenance; overkill for KG's domain shape.
- **LTL / Quickstrom formal-spec acceptance testing.** Bypasses LLM oracle hallucination by executing formal temporal properties directly — but needs formal-spec authoring; too heavy for a first step.
- **Don't build it — keep code-derived only.** Rejected: that leaves the sins-of-omission blind spot permanently open, which is the entire motivation.
- **Single combined bidirectional pipeline (mine code + mine spec in one framework).** No prior art found for this exact unification (closest are JEST/SPECA, which derive from spec and diff against code but don't bottom-up mine code in the same framework) — so it's research territory, not a build-now option.

## Unresolved

- **Does KG have a usable spec source beyond the PO golden rules?** If the golden rules are the *only* source, the proposal is still viable but bounded to what the PO writes — the diff only covers rules someone authored. Worth confirming what written business rules / acceptance criteria KG already has.
- **rule→code location** — how reliably can a spec rule be mapped to the code paths meant to implement it? Manual for the spike; the scale answer (retrieval — ironic on a retrieval system) is unproven. The spike is the test.
- **Diff signal-to-noise on a real, already-tested KG class** — unknown until the spike runs. The diff could be dominated by trivial wording mismatches; triage cost is the risk.
- **Mutation-gate semantics for spec-driven red tests** — a red test means "code violates spec," which is the *output*, not a failure to gate away. Likely: reds route to a human/candidate-bug queue rather than being killed-or-discarded. Needs a decision before build.
- **LLM oracle accuracy** — research puts spec-oracle accuracy at ~53–56% even under good conditions, with multi-agent consensus (CANDOR) as the SOTA mitigation. Whether we need the panel-of-agents shape or a single verifier suffices is a spike question.

## Graduate-to-spec

**Technical branch (ADR-28).** On ratification this graduates to a tech-spec at `docs/specs/{slug}/definition/` with ADRs *extracted* (not re-authored): the load-bearing ADR units are (a) Cover-engine reuse / spec-front-end seam, (b) the three diff axes as the headline deliverable, (c) oracle isolation as a mechanical (not prompt) boundary, and (d) red-on-current = candidate-bug routing. The spike result feeds the tech-spec's risk section before any full build commits.

## Provenance

- This session, 2026-06-24. The owner proposed the inverse direction ("golden rules are the target; a loop circles each rule") and asked for grounding research before a write-up.
- Fed by the validated research entry `docs/kb/research/spec-driven-test-generation.md` (21 cited sources; recall-greppable) and the existing harness design (`docs/proposals/mine-verify-automation-design.md`, `mine-verify-pilot-method.md`; `harness/`).
- Connects to the planned KG evaluation run (mutation-kill-delta vs the existing suite; PO golden rules for recall) — the spec-driven direction reuses that golden set as its input.
