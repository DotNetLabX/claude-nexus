# Plan — Spec-driven Cover + diff (one-class spike)

**Slug:** adhoc-SpecDrivenCoverDiff
**Spec:** `docs/specs/adhoc-SpecDrivenCoverDiff/definition/spec.md`
**Type:** Spike (de-risk the three unknowns → go/no-go on the full build). Two-way door — low ceremony.
**Target repo:** `D:\src\knowledge-gateway` (.NET 10). Harness lives in this nexus repo (`harness/`).
**Date:** 2026-06-24

## Goal

Run the spec-driven direction **once**, on a single KG class, and diff it against the code-derived
harness — to confirm (or kill) the three unconfirmed build assumptions before committing to a full
build. The deliverable is a **go/no-go writeup with a candidate-bug count**, not a production skill.

## Guardrails (carry from the existing harness + ADR-C)

- **Oracle isolation is mechanical.** Spec-rule authoring and spec-driven test generation must not share
  LLM context with the implementation or the existing tests. The spec rules (PO golden set) enter as
  **text the test-writer never reads** — handed as inline rule statements, same seal as the code-derived
  Cover agent (`harness/cover.workflow.js:342` — source + rules + survivor list is the *entire* input).
- **Harness tests go in an isolated assembly**, never `KnowledgeGateway.Tests` — so the writer can't see
  the 85 existing tests and the kill-delta stays measurable (existing-only vs harness-only vs union).
- **Mutation kill is the gate; coverage is informational.** Red-on-current tests are **kept + flagged**
  as candidate bugs (the primary output here), never deleted.
- **All harness agents run on Sonnet** (owner directive) — every `agent()` / Workflow worker gets
  `model: 'sonnet'`; the orchestrator context may be Opus. Matches the Article-run default (every agent Sonnet).

## Execution owner

This plan is **executed by solo/developer, not the architect** (the architect plans + does the done-check).
Two phases:
- **Phase 0 — runnable today (no new code):** the *code-derived* Mine→Verify→Cover on both KG classes via
  the built harness (`harness/loop.workflow.js`, args per class; exact invocation shape in
  `adhoc-MineVerifyCoverHarness/delivery/implementation-increment3-loop.md`). Yields mined rules +
  mutation-gated tests + the **kill-delta vs the existing suite** for each class. This alone answers the
  original "how many tests / how much stronger" question.
- **Phase 1 — needs a build:** the *spec-driven* front-end (golden/spec rules as the Cover rule source,
  Steps 4–5) + the diff. This is the net-new glue (~Step 4); solo builds it, then runs both directions and
  produces the diff.

## Steps

### Step 1 — Confirm targets + ingest the sequestered golden set (PO-authored)
**Targets confirmed (PO + source check):** two validation classes, deliberately spanning the difficulty
range (mirrors the pilot's easy/hard pair):
- `SlackSignatureVerifier` (**simple** — 111 lines, ~12 branches) —
  `src/Services/KnowledgeGateway/KnowledgeGateway.API/Features/Slack/SlackSignatureVerifier.cs`; existing suite `…/Tests/Slack/SlackSignatureVerifierTests.cs`.
- `GeneratedSqlValidator` (**complex** — 519 lines, ~90 branches) —
  `src/Services/KnowledgeGateway/KnowledgeGateway.API/Features/TextToSql/GeneratedSqlValidator.cs`; existing suite `…/Tests/TextToSql/GeneratedSqlValidatorTests.cs` (808 lines).
These supersede the earlier scout guesses — the PO's authored golden set decides the targets. Both have
existing suites, so the **kill-delta** baseline is live for both. **Cost note:** the complex class exceeds
the BugRatio calibration size → budget Mine→Verify above the ~1.9M-token/class baseline.
The PO has **already authored** the golden rules for both, held in a **sequestered folder outside KG's
source tree** (so the prompt-only-sealed agents can't reach it this increment). The harness receives the
**folder path + class→id mapping only** — never the text; the orchestrator/architect does not open it.
- **Skill:** None — **TDD:** no — **Satisfies:** AC-1 — **Confidence:** medium
- **Accept:** both classes located in KG source; golden folder confirmed **outside** the agents' read
  path (or excluded); path + ids registered in the harness target config; a written note that the golden
  text never entered the mining run or a committed nexus artifact (isolation demonstrable, not asserted).

### Step 2 — rule→code location
Map each spec rule to the production code path(s) that should implement it. Manual for the spike (the PO/
architect points at file:line). A rule with **no locatable code** is **not an error** — it is the first
candidate sin-of-omission and is recorded as such.
- **Skill:** None — **TDD:** no — **Satisfies:** AC-2 — **Confidence:** low (the genuinely new piece — no precedent in the code-derived harness)
- **Accept:** every spec rule has a `rule → file:line` target OR a `no-code-found` flag; the map is written
  to `delivery/rule-code-map-{class}.md`.

### Step 3 — Code-derived baseline (existing harness, same class)
Run Mine→Verify on the chosen class via the existing harness to produce the **code-rules** set for the
diff. Reuse `harness/mine-verify.workflow.js` with `args` pointing at the KG class (no golden set needed —
recall is not the spike's question).
- **Skill:** None — **TDD:** no — **Satisfies:** AC-4 (provides the `code` side of the diff) — **Confidence:** high (proven path)
- **Accept:** a consensus code-rules set is produced and saved for Step 5.

### Step 4 — Spec-driven Cover (reuse the engine, spec rules as input)
Feed the **spec rules** (Step 1) — not mined rules — into the Cover engine; generate mutation-gated tests
into an **isolated test assembly**; run `dotnet test` + `dotnet stryker`. Capture red-on-current tests as
candidate bugs. This is the engine-reuse proof (ADR-A): same Cover agent + gate battery, different rule source.
- **Skill:** tdd — **TDD:** yes — **Satisfies:** AC-3 — **Confidence:** medium (engine is proven; the spec-rule *input shape* is new)
- **Accept:** tests written + double-run green (or reds captured); Stryker run; per-rule kill recorded;
  reds written to `delivery/candidate-bugs-{class}.md`. Reference the code-derived Cover run shape in
  `harness/cover.workflow.js` for the runner/gate contract.

### Step 5 — Diff the two rule sets (the headline)
Diff spec-rules (Step 1) against code-rules (Step 3) on the three axes: `spec ∧ ¬code` (missing features),
`code ∧ ¬spec` (undocumented behavior), `both-divergent` (boundary disagreements). Each `spec ∧ ¬code`
item carries its red test (Step 4) or a `code-missing` note (Step 2).
- **Skill:** None — **TDD:** no — **Satisfies:** AC-4 — **Confidence:** medium
- **Accept:** every rule classified into exactly one axis; written to `delivery/diff-{class}.md` with the
  `spec ∧ ¬code` set listed first.

### Step 6 — Go/no-go writeup
Answer each of the three unknowns (usable spec source? rule→code location feasible? diff signal usable for
triage?) with evidence from Steps 1–5, plus a candidate-bug count from the diff, plus a recommendation on
the full build (and whether to extract ADR-A..D).
- **Skill:** None — **TDD:** no — **Satisfies:** AC-5 — **Confidence:** high
- **Accept:** `delivery/spike-result.md` with an explicit go/no-go per unknown + bug count + build recommendation.

## Review mode

**Self-review against the AC list** (Mode 2 vs this spec's AC-1..AC-5). Justification: this is a
two-way-door spike (master gate ADR-25 → low ceremony), and its real verification is the go/no-go output
in Step 6. **The code-grounded critic is owed at the full-build plan** — when the spec-driven direction is
actually wired into `harness/**` (a shared-artifact change) — not for this spike.

## Out of scope (do not let the spike sprawl)

Multi-class sweep; productionizing as a shipped skill; retrieval-based rule→code location; coverage
metrics as a gate; touching the code-derived harness's behavior. All deferred to the post-go build.
