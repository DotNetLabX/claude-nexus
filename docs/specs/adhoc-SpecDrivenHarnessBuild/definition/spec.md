# Tech-Spec — Spec-driven Cover front-end + spec-vs-code diff (full-build Increment 1)

**Status:** Ready
**Type:** Technical feature (architect-owned definition; ADR-27/28)
**Graduates from:** `docs/specs/adhoc-SpecDrivenCoverDiff/` — the spike returned **GO** (all 5 ACs PASS;
`delivery/spike-result.md` + `delivery/summary.md`, 2026-06-25).
**Proposal:** `docs/proposals/spec-driven-cover-and-diff.md` (Draft, Confidence Medium → spike-first)
**Research basis:** `docs/kb/research/spec-driven-test-generation.md`
**Plan:** `docs/specs/adhoc-SpecDrivenHarnessBuild/delivery/plan.md`
**Questions (settled):** `docs/specs/adhoc-SpecDrivenHarnessBuild/delivery/questions.md`
**Date:** 2026-06-25

## Problem

The Mine→Verify→Cover harness is **code-derived** — it mines rules *from source*, so by construction it
can only test behavior the code already exhibits. It is structurally blind to **sins of omission** (the
spec requires X, the code never implemented X) and can faithfully encode a bug as a "rule." The spike
proved the inverse, **spec-driven** direction closes that blind spot, and that the **diff** between the
two rule sets surfaces real bugs (both directions independently converged on `GeneratedSqlValidator.cs:272`,
a true positive the KG team has since patched).

The spike proved the method **half-manually** (rule→code mapped by hand, the diff triaged by hand). This
build **automates the spec-driven front-end + the diff + the false-positive filter** as a runnable harness
workflow, proven on one class end-to-end through the automated path. It is **Increment 1** of the full
build — not the whole vision (multi-class sweep, retrieval-at-scale, automated spec-source extraction are
named next increments).

## Scope

**In (this increment):**
- A spec-driven front-end Workflow (`harness/spec-cover.workflow.js`) that takes a PO-authored golden rule
  set as input, locates each rule's code, generates mutation-gated tests via the **existing Cover engine**,
  and captures red-on-current tests as candidate bugs.
- A `loadSpecRules()` seam (golden-rules text source today; extracted-rules source later).
- A `locateRuleCode()` seam: use a rule's existing code attestation when present, else a guided LLM-miner
  agent returning `file:line | NO-CODE-FOUND`.
- The three-axis diff + a **deterministic false-positive labeler**, as pure helpers in
  `harness/lib/spec-diff.mjs`, unit-tested.
- A structured run report: a candidate-bug queue (never deleted) + a `needs-triage` bucket.
- End-to-end proof on **one** KG class (`GeneratedSqlValidator`) through the *automated* path.

**Out (named next increments, behind the seams above):**
- Multi-class / domain-wide sweep.
- Retrieval-at-scale for rule→code location (embedding index) — deferred; the `locateRuleCode()` seam
  takes it as a drop-in source later.
- Automated spec-source extraction beyond PO golden rules (`seed/db/generation-rules/`, the validator's
  XML doc comments) — deferred; the `loadSpecRules()` seam takes it as a drop-in source later.
- Automated input rule-isolation (#1) — the undecidable-in-general construction problem; the deterministic
  labeler makes it low-value this round.
- Productionizing as a shipped skill (`plugins/nexus/skills/`) — a later increment, per the harness's
  increment pattern. **This build ships nothing to users and triggers no plugin version bump** (dev-repo
  machinery, like `scripts/` and `tests/`).

## ADR units (extracted on GO — durable decisions; not re-authored)

These were named "to be extracted on a go" in the spike spec (`adhoc-SpecDrivenCoverDiff/definition/spec.md`
§ADR units) and the spike confirmed each. They are now **extracted** as the durable decisions this build
implements; rationale lives in the spike spec + `spike-result.md` (ADR-28: one authoritative source — point
back, don't restate).

- **ADR-A — Pluggable rule source / Cover-engine reuse.** The Cover engine accepts a rule set from either
  Mine→Verify (code-derived) or the spec front-end; everything downstream of "verified rules" (Cover agent,
  the §6 gate battery, clean-room isolation, mutation gating) is **unchanged**. *Confirmed in the spike
  (spec-rule input shape worked with the engine unchanged).*
- **ADR-B — The three diff axes are the deliverable.** `spec ∧ ¬code` (missing features — the headline),
  `code ∧ ¬spec` (undocumented behavior / enshrined bug), `both-divergent` (boundary disagreements). Every
  rule classifies into exactly one axis. *Confirmed (all three axes populated with real content).*
- **ADR-C — Oracle isolation is mechanical, not prompt.** Spec-rule authoring and spec-driven test
  generation must not share LLM context with the implementation: the golden text is **sequestered outside
  the agents' read path**, handed in as inline rule statements, and harness tests live in an **isolated
  assembly** (never `KnowledgeGateway.Tests`). *Confirmed (miner/Cover agents never saw the golden folder).*
- **ADR-D — Red-on-current = candidate bug, routed not gated.** In the spec-driven direction a test that
  fails on current code is the *expected primary output* (code violates spec), not an edge case to gate
  away; it routes to a candidate-bug queue, **never deleted**. *Confirmed (5 reds captured + triaged; the
  1 real one was the headline finding).*

## Build decisions (the five settled questions)

Full text + recommendations + confidence in `delivery/questions.md`; the binding answers:

| # | Decision | Drives |
|---|----------|--------|
| **D1** (Q1) | rule→code location = guided LLM-miner behind a `locateRuleCode()` seam (attestation-first, miner-fallback, `NO-CODE-FOUND`). Embedding index **deferred** (master-gate one-way door). | the location step |
| **D2** (Q2) | **One increment** — spec front-end + 3-axis diff + FP-filter on one class, ~7 steps, `harness/` only, no plugin bump. | scope / step count |
| **D3** (Q3) | FP-filter = **deterministic violation-identity labeler** (#3) against the fixed rule order; #1 (rule isolation) + #2 (fixture fidelity) are operator-assisted + a `needs-triage` bucket. | the filter |
| **D4** (Q4) | Keep the PO-golden-rules input contract behind `loadSpecRules()`; automated extraction is the named next increment. | the input |
| **D5** (Q5) | Target = knowledge-gateway / `GeneratedSqlValidator`; acceptance = **reproduce the spike's L272 red against pre-fix source** (primary, known-answer), live-source run secondary. | target + acceptance |

## The FP-labeler mechanism (D3 — grounded in source)

`GeneratedSqlValidator.Validate(...)` returns `string?` — **the name of the *first* violated rule**, in a
fixed rule order (1 `SingleSelect` → 2 `RelationPolicy` → 3 `CategoryIdPresent` → 4
`NoRelativeDateUnderAnchoring` → 5 `NoStrayLiteralThreshold` → 6 `BadReportsFilterPresent` → 7
`ReportIdsFirst`), or `null` when all pass (`GeneratedSqlValidator.cs:215-306`). This makes #3 a **pure
comparison**, not a "re-run with the earlier rule disabled" (which would need a production change and fail
the harness's `char_pin` gate). The labeler compares a spec test's **expected** rule identity against the
validator's **actual** first-fired rule, against the known order:

- actual fired rule is **earlier** than expected → `interaction-artifact` → `needs-triage` (this auto-kills
  the spike's 2 rule-precedence false positives).
- actual **==** expected but the boundary differs, **or** actual is `null` when a violation was expected →
  genuine **candidate bug** (boundary divergence / sin of omission).
- anything the labeler cannot resolve (e.g. a fixture-fidelity artifact — #2) → `needs-triage`, never
  deleted (ADR-D).

Deterministic, unit-testable, no production change, no LLM in the filter — the `cover-gates.mjs` shape.

## Acceptance criteria

- **AC-1 — Engine reuse (ADR-A).** The spec front-end drives the existing Cover engine + §6 gate battery
  with the spec-rule input shape; no change to the code-derived harness's behavior. *Grep target:* the
  spec front-end reuses the runner-result schema + gate helpers from `harness/lib/cover-gates.mjs` (no fork
  of the gate logic).
- **AC-2 — rule→code location seam (D1).** Every spec rule resolves to `file:line` (via attestation or the
  guided miner) **or** an explicit `NO-CODE-FOUND` (itself a candidate sin-of-omission). The seam prefers
  an existing attestation and falls back to the miner. *Assertion:* a `locateRuleCode()` unit test covers
  attestation-present, miner-fallback, and `NO-CODE-FOUND`.
- **AC-3 — Spec-driven Cover (ADR-A/C/D).** Spec-driven tests are generated into an **isolated assembly**
  (never `KnowledgeGateway.Tests`), each asserting the spec-expected **violation identity** (`Validate`
  return); red-on-current tests are **kept + flagged**, never deleted; clean-room isolation holds (the
  golden text appears in no agent prompt). *Assertion:* the golden-set path appears in no agent prompt in
  `spec-cover.workflow.js` (a Step-2-style grep acceptance).
- **AC-4 — Three-axis diff (ADR-B).** The diff classifies **every** rule into exactly one of `spec ∧ ¬code`
  / `code ∧ ¬spec` / `both-divergent`; each `spec ∧ ¬code` item carries a red test or a `code-missing`
  note. *Assertion:* `spec-diff.mjs` diff helper unit test — every input rule lands in exactly one axis.
- **AC-5 — Deterministic FP-labeler (D3).** The labeler is a pure function over (expected rule, actual
  `Validate` return, the fixed rule order); it labels earlier-fired reds `interaction-artifact` and routes
  the unresolved residue to `needs-triage`. *Assertion:* `spec-diff.mjs` labeler unit test covers
  earlier-fired (→ artifact), expected==actual-boundary-diff (→ candidate), and actual==null (→ candidate).
- **AC-6 — End-to-end known-answer reproduction (D5).** Run the automated front-end against the **pre-fix**
  `GeneratedSqlValidator` (the revision before the `+ 1e-9` patch, materialized via an operator-owed step)
  and confirm it independently re-derives the spike's L272 candidate bug + the recorded artifact
  classification. A **secondary** live-source run confirms the fix holds (L272 no longer reds), exercises
  the labeler, and surfaces any new red as a candidate. *Assertion:* the candidate-bug queue from the
  pre-fix run contains the L272 FP-boundary red; the live run's L272 is absent.
- **AC-7 — Increment hygiene (D2).** All net-new code lives under `harness/`; pure helpers carry unit tests
  under `tests/unit/` inside the CI glob; no plugin file changes, no plugin version bump. *Assertion:*
  `node --test tests/unit/spec-diff.test.mjs` passes; `git status` shows no `plugins/**` change.

## Review gate

No product spec to diff (ADR-register / technical-branch pass; ADR-27). The plan's review is **Mode 2
against this tech-spec's AC list**. Per the spike's carried-forward condition and the architect's
shared/external-artifact mandate, the **code-grounded critic is MANDATORY at the plan** — this is a change
to shared `harness/**` dev-repo machinery *and* AC-6 rests on a known-answer/negative assertion (L272
present pre-fix, absent live). The critic must read the actual harness libs (`cover-gates.mjs`,
`spec-cover.workflow.js`) and the live KG source, not run a doc-conformance pass. The user has also asked
for a critic pass on **this spec** before planning.
