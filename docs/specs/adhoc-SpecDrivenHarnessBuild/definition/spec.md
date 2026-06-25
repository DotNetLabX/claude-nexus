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
two rule sets surfaces real bugs (both directions independently converged on the Rule-5
`NoStrayLiteralThreshold` tolerance comparison — `Math.Abs(literal - resolvedNumeric.Value) > 0.01`, at
**L272 of KG HEAD** — a true positive).

**Provenance correction (verified against KG git, 2026-06-25):** the `+ 1e-9` fix is an **uncommitted
working-tree edit** in KG (` M` status; `git log -S "1e-9"` finds no commit). KG **HEAD still carries the
buggy `> 0.01` at L272**. The spike artifacts' "FIXED in live KG / the team patched it" wording is
inherited and **wrong** — there is no fix commit. This matters because AC-6's known-answer reproduction is
defined against committed git state, not a dirty tree.

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
- Equivalent-mutant filtering (research flags 4–39%; the spike saw ~70% of SQL survivors equivalent) is
  **inherited unchanged** from the Cover engine's `expectedSurvivorLines` exclusion (ADR-A) — no new
  equivalence detector this increment. (Named so the silence isn't read as a gap.)

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
`ReportIdsFirst`), or `null` when all pass (`GeneratedSqlValidator.cs:215-306` at the working tree;
`:227-305` for the rule body). This makes #3 a **pure comparison**, not a "re-run with the earlier rule
disabled" (which would need a production change and fail the harness's `char_pin` gate, `cover-gates.mjs`).
A spec test for rule `R` carries an **expected** outcome from its golden rule: `"R"` if the input should be
rejected by `R`, or `null` if it should pass. A **red** is `actual ≠ expected`. The labeler classifies each
red by comparing expected vs the validator's **actual** first-fired rule against the known order:

| # | expected | actual | label | route |
|---|----------|--------|-------|-------|
| 1 | `"R"` | a rule **earlier** than `R` | `interaction-artifact` (an earlier rule masked R) | `needs-triage` (auto-resolved) |
| 2 | `"R"` | a rule **later** than `R` | candidate bug — R under-enforces (R should have fired, a later rule did) | candidate-bug queue |
| 3 | `"R"` | `null` | candidate bug — **sin of omission** (`spec ∧ ¬code`): code passed an input the spec rejects | candidate-bug queue |
| 4 | `null` | a rule fired | candidate bug — **over-rejection**: code rejects a spec-valid input. **Cannot be auto-decided** real-vs-artifact (a real boundary bug like L272 *or* a #2 fixture-fidelity artifact) | candidate-bug queue, tagged `needs-triage` |
| 5 | either | test errored / fixture un-constructable | not classifiable | `needs-triage` |

Only **case 1** (earlier-fired) is mechanically auto-resolved. **Case 4 is the L272 shape** — and the same
shape the spike's fixture artifacts (ARTIFACT-01/02) take — so the labeler routes it to the candidate-bug
queue *tagged* `needs-triage`, never auto-confirming a bug and never deleting a red (ADR-D); human triage
separates the real over-reject from the fixture artifact. Against the spike's 4 SQL artifacts this
auto-resolves **1** (the earlier-fired interaction, ARTIFACT-03), routes 2 over-rejections (ARTIFACT-01/02)
+ the real L272 to the candidate/needs-triage queue, and routes the un-constructable curated profile
(ARTIFACT-04) to `needs-triage` — reproducing the spike's manual split (1 real + 4 artifacts) through the
automated path.

Deterministic, unit-testable, no production change, no LLM in the filter — the `cover-gates.mjs` shape.

## Acceptance criteria

- **AC-1 — Engine reuse (ADR-A).** The spec front-end drives the existing Cover engine + §6 gate battery
  with the spec-rule input shape; no change to the code-derived harness's behavior. *Grep target:* the
  spec front-end reuses the runner-result schema + gate helpers from `harness/lib/cover-gates.mjs` (no fork
  of the gate logic). **Reuse boundary (the spec direction inverts one assumption):** reuse the gate
  *helpers*, **not** the code-derived *all-gates-green stop condition*. In the code-derived direction a
  red fails `suiteGreen` (`failed === 0`); in the spec direction a red-on-current is the **primary output**
  (ADR-D), so spec-driven reds are captured by the diff/labeler **before** any green gate and must not be
  run through `suiteGreen` as a pass/fail. The mutation gate still applies to the *mutation* pass over the
  spec-driven tests; the red-handling vs gate boundary is made explicit in the plan.
- **AC-2 — rule→code location seam (D1).** Every spec rule resolves to `file:line` (via attestation or the
  guided miner) **or** an explicit `NO-CODE-FOUND` (itself a candidate sin-of-omission). The seam prefers
  an existing attestation and falls back to the miner. *Assertion:* a `locateRuleCode()` unit test covers
  attestation-present, miner-fallback, and `NO-CODE-FOUND`. **Known limit (research caveat):** the unit
  test covers the seam's *control flow* (which branch), not the *correctness* of a miner-returned location —
  LLM locator accuracy is ~53–56% (research entry), so the miner can return a wrong `file:line`.
  Attestation-first mitigates this on the spike class (the golden rules carry code attestations); a
  miner-located `file:line` whose code does not contain the rule is operator-verified and routes to
  `needs-triage` this increment (not a silent mis-anchor).
- **AC-3 — Spec-driven Cover (ADR-A/C/D).** Spec-driven tests are generated into an **isolated assembly**
  (never `KnowledgeGateway.Tests`), each asserting the spec-expected **violation identity** (`Validate`
  return); red-on-current tests are **kept + flagged**, never deleted; clean-room isolation holds (the
  golden text appears in no agent prompt). *Assertions (two):* (a) the golden-set path appears in no agent
  prompt in `spec-cover.workflow.js` (a Step-2-style grep acceptance); (b) the generated test project
  references the KG **product** project but **not** `KnowledgeGateway.Tests` (the isolated-assembly check —
  a grep over the generated `.csproj` references).
  **ADR-C scope (the isolation this AC actually proves).** ADR-C is enforced at the **mechanical placement**
  layer — sequestered golden text, isolated assembly, no golden path in any prompt. It does **not** prove
  the deeper "intent, not code" guarantee, because the PO golden set is **code-laddered**: it is the
  mine-verify *recall answer key* and its own header states the golden rule *follows the code* where the
  two diverge. So it is a **bounded** spec oracle (research's #1 validity threat — contamination — is
  mitigated at placement, not eliminated at authoring). On the spike class this still surfaced L272 because
  the FP defect is an IEEE-754 artifact *below* the rule's stated `> 0.01` granularity (any faithful
  encoding expects exactly-0.01 to pass), but the general sins-of-omission guarantee is only as strong as
  the PO's intent authoring. The deeper intent-isolation is named as the next increment's concern (tied to
  automated spec-source extraction, D4).
- **AC-4 — Three-axis diff (ADR-B).** The diff classifies **every** rule into exactly one of `spec ∧ ¬code`
  / `code ∧ ¬spec` / `both-divergent`; each `spec ∧ ¬code` item carries a red test or a `code-missing`
  note. *Assertion:* `spec-diff.mjs` diff helper unit test — every input rule lands in exactly one axis.
- **AC-5 — Deterministic FP-labeler (D3).** The labeler is a pure function over (expected rule, actual
  `Validate` return, the fixed rule order) implementing the five cases in §FP-labeler: case 1 earlier-fired
  → `interaction-artifact`; case 2 later-fired → candidate (under-enforce); case 3 expected-rule/actual-null
  → candidate (sin of omission); case 4 expected-null/actual-fired → candidate **tagged `needs-triage`**
  (over-reject — real-or-fixture, not auto-decided); case 5 errored → `needs-triage`. *Assertion:*
  `spec-diff.mjs` labeler unit test covers **all five** cases, including the case-4 expected-null/actual-fired
  shape that produces L272 (→ candidate-bug queue, `needs-triage` tag).
- **AC-6 — End-to-end known-answer reproduction (D5).** Two **reproducibly-defined** arms (the `+ 1e-9`
  fix is uncommitted, so neither arm may depend on KG's dirty working tree — see §Problem provenance
  correction):
  - **Pre-fix arm = KG `main` HEAD**, which *still carries* the buggy `> 0.01` at L272 (committed —
    reproducible from a clean checkout). The automated front-end runs against this arm.
  - **Patched arm = HEAD + a documented one-line operator patch**: change the Rule-5 tolerance comparison
    from `Math.Abs(literal - resolvedNumeric.Value) > 0.01` to `> 0.01 + 1e-9`. The operator applies this
    explicit edit (an `OPERATOR ACTION REQUIRED` note in implementation.md); the build does **not** assume
    a pre-existing working-tree edit.

  *Primary assertion (pre-fix arm, known-answer):* the candidate-bug queue contains the **case-4
  over-rejection** red for the Rule-5 tolerance comparison (the L272 finding — expected pass, actual
  `NoStrayLiteralThreshold`), and the earlier-fired interaction artifact (ARTIFACT-03) is auto-labeled
  `interaction-artifact` — reproducing the spike's manual split through the automated path.

  *Secondary assertion (patched arm), pinned to the specific known-answer input:* the test asserting
  `|0.86 - 0.85|` (= `0.0100000000000000009`) **passes** is **green** on the patched arm (the fix holds for
  the known input). **Caveat (do not over-assert):** the golden set encodes the pre-fix `> 0.01` boundary,
  so a spec test probing the band between `0.01` and `0.01 + 1e-9` will red on the patched arm — that is
  **expected divergence** (the golden text trails the operator patch), routed to `needs-triage`, **not**
  counted against AC-6. AC-6 secondary is the *specific* input flipping green, not "no Rule-5 red exists at
  all."
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

## Spec Review (critic — code-grounded, 2026-06-25)

A `nexus:critic` ran a code-grounded Mode-1 pass against the spike artifacts, the settled `questions.md`,
the proposal/research, the live harness libs, and live KG source. **Verdict: REVISE → all findings folded;
no settled decision (D1..D5) changed.** Dispositions:

| Finding | Sev | Disposition |
|---------|-----|-------------|
| Labeler couldn't express the L272 shape (expected-null/actual-fired) — routed it to needs-triage while AC-6 demanded it in the candidate queue | CRITICAL | **Fixed** — §FP-labeler rewritten to a 5-case table; case 4 (over-reject) routes to the candidate-bug queue *tagged* `needs-triage`; AC-5/AC-6 updated. (Refined the critic's literal "→ candidate bug": case 4 is the *same* shape as the fixture artifacts, so it's a candidate needing triage, not an auto-confirmed bug.) |
| AC-6 provenance wrong — the `+ 1e-9` fix is **uncommitted**; no "patch revision" to point before | CRITICAL | **Fixed** — verified against KG git (HEAD has `> 0.01` at L272; `git log -S "1e-9"` empty). §Problem corrected; AC-6 redefined to two reproducible arms (HEAD vs HEAD+operator-patch). |
| "Auto-kills 2 rule-precedence FPs" overstated — only 1 is earlier-fired | HIGH | **Fixed** — corrected to 1 auto-resolved (ARTIFACT-03); ARTIFACT-01/02 are case-4, routed to triage. |
| ADR-C asserted full isolation, but the golden set is **code-laddered** (recall answer key) | HIGH | **Fixed** — AC-3 now scopes ADR-C to the mechanical/placement layer; code-laddered oracle named as bounded; deeper intent-isolation deferred to the extraction increment (D4). |
| AC-6 secondary ("L272 absent live") could spuriously red on the boundary band | HIGH | **Fixed** — AC-6 secondary pinned to the specific known-answer input; boundary-band reds = expected divergence → `needs-triage`. |
| Equivalent-mutant risk dropped | MED | **Fixed** — Out-of-scope bullet: inherited from the Cover engine, no new detector. |
| LLM-locator accuracy (~53–56%) not carried onto the miner seam | MED | **Fixed** — AC-2 notes the miner can mis-locate; attestation-first mitigates; mis-locations → `needs-triage`. |
| "L272" used as a stable handle though line numbers rot | LOW | **Fixed** — finding now referred to by symbol/predicate, "(L272 at pre-fix HEAD)" parenthetical. |
| AC-1 reuse: a spec-driven red must not fail `suiteGreen` | GAP | **Fixed** — AC-1 reuse boundary added (reuse gate *helpers*, not the all-gates-green stop); red-vs-gate boundary deferred to the plan. |
| AC-3 isolated-assembly had no checkable assertion | OQ | **Fixed** — AC-3 assertion (b) added (generated `.csproj` references product, not `KnowledgeGateway.Tests`). |

Carried to the **plan** (the mandatory code-grounded critic re-verifies these): the labeler unit tests must
encode the corrected 5-case set; the red-handling-vs-mutation-gate boundary must be made explicit; the
AC-6 operator-patch step must be spelled out as `OPERATOR ACTION REQUIRED`.
