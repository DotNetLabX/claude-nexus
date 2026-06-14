# Mine→Verify Harness — Increment 1 (batched Verify component)

**Feature Spec:** `docs/proposals/mine-verify-automation-design.md` (design) + `../roadmap.md` (increments).
No `definition/spec.md` — ad-hoc technical feature; the design proposal + roadmap are the binding definition (ADR-27).

## Context

The harness's Mine→Verify path is proven over two pilot sessions (recall 3/3 on HealthScore + BugRatio),
but only as throwaway spikes. Two spikes also corrected the cost design: per-rule parallel verify wins
wall-time but blows up tokens (~1.58M) and trips server rate limits at 35-way fan-out; the fix is a
**batched, sliced verifier** (design §2). This increment turns that into the harness's first durable,
runnable component — dev-repo-first, no shipped artifact yet (graduates to a skill at Increment 4).

## Scope

**In:** a committed, runnable Mine→batched-Verify Workflow + a recall-scoring helper, validated on
`BugRatioCalculator`, producing verified rules + recall + the clean per-class token cost owed to the #4
comparison.
**Out (later increments):** Cover/Stryker (Inc 2), the loop controller + stopping signals + 5-gate battery
+ KB ledger write (Inc 3), Discover, and shipping as a nexus skill (Inc 4). No `docs/kb/` write here.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | `harness/` layout; pilot target = BugRatioCalculator + golden ids GOLD-16/17/18 | — |
| 2 | (none) | — | no | batched-sliced verify shape (design §2); spike script as the proven Mine+consolidate reference | Log: no harness-authoring skill exists |
| 3 | (none) | — | yes | consensus↔golden pairing; substance-match, wording-independent | Log: no scoring skill exists |
| 4 | (none) | — | no | acceptance thresholds (recall 3/3; ≤~7 verify calls; cost ≪ 1.58M) | — |

No nexus skill covers "author a clean-room rule-mining Workflow" or "score recall vs a golden set" — all
steps are `None` (gap logged for a future harness skill, which is Increment 4 itself). Step 3 is `TDD: yes`
(deterministic helper); the developer writes the failing test first via the `tdd` skill.

## Domain / Data Model Changes
N/A — JS dev-repo tooling, no .NET domain or persistence surface.

## Implementation Steps

**1. Scaffold the harness dev-repo home.**
Create a top-level `harness/` dir (dev-repo machinery, like `scripts/`/`tests/` — ships nothing, no version
bump). Files: `harness/README.md` (purpose: dev-repo-first build of the Mine→Verify→Cover harness; states it
graduates to `plugins/nexus/skills/mine-verify-cover/` at Inc 4) and `harness/targets/bugratio.json` (the
pilot target: absolute source path to `BugRatioCalculator.cs`, class name, and golden **ids only**
`["GOLD-16","GOLD-17","GOLD-18"]` — never the golden rule text; the config must stay safe to feed the run).
Skill: None. TDD: no.
Satisfies: roadmap Inc 1 (delivery model — dev-repo-first).

**2. Author the Mine→batched-Verify Workflow.**
Create `harness/mine-verify.workflow.js` — a committed Workflow runnable via `Workflow({scriptPath})`. Phases:
Mine (3 clean-room miners, source-only — prompt-enforced clean-room for this increment; the disallowedTools
mechanism is Inc 3), Consolidate+triage (merge the 3 → consensus rules with agreement + transcribed/interpretive
+ a consistency string + contradictions), and **Verify, batched + sliced** — one slicer agent reads the source
**once** and emits a per-rule code slice (±~15 lines); interpretive rules are verified in **batches of ~5
(rule + slice inline)**, so verifiers do **zero file reads** and the call count is ≈⌈interpretive/5⌉. Transcribed
rules get a single batched quote-entailment check. Return consensus rules + verdicts + counts + a cost signal.
The proven Mine+consolidate shape is the spike script `<session>/workflows/scripts/mine-verify-bugratio-spike-*.js`
— reuse it; the **batched verifier is the new build** (design §2). Acceptance: verify issues batched calls
(≤~7 for ~35 rules), no per-rule fan-out, verifiers receive slices inline and read no files.
Skill: None (gap). TDD: no — agent-orchestration, validated live in Step 4.
Satisfies: design §2 (batched sliced verify — the cost fix).

**3. Build the recall-scoring helper (outside the clean-room path).**
Create `harness/lib/recall-score.mjs` — a deterministic helper (pure fn + thin CLI) that loads the golden
subset (orchestrator-side; **never** passed into the mining Workflow) and pairs each golden rule with the
Workflow's consensus rules into a structured scoring packet for a semantic judge, then reports recall/precision
once the judge returns matched/unmatched per golden id. The substance-match itself is semantic, so the pairing
is deterministic but the match verdict is a scoped judge call (golden + consensus inline) — keep that judge
out of the mining run. Acceptance: given a fixture consensus set + golden subset, the helper emits the correct
pairing packet and computes recall from a supplied verdict map.
Skill: None (gap). TDD: **yes** — write the failing test first (`tdd` skill); `harness/lib/recall-score.test.mjs`
(or `tests/unit/recall-score.test.mjs`).
Satisfies: design §3 (orchestrator-scores-only) + the #4 recall metric.

**4. Validation run + record results.**
Run the Workflow on BugRatio; run the scorer/judge on its output. Capture recall (vs GOLD-16/17/18), verify
call-count, per-class token cost, consistency, and escalation. Write results to
`docs/specs/adhoc-MineVerifyCoverHarness/delivery/implementation.md`. Acceptance: **recall 3/3**; batched verify
**≤~7 calls with zero rate-limit failures**; per-class token cost recorded and **materially below** the v1
fan-out (~1.58M) — that recorded number is our half of the #4 comparison.
Skill: None. TDD: no (validation).
Satisfies: design §2 (cost) + roadmap Inc 1 acceptance.

## Testing Strategy
Unit-test the deterministic recall-pairing helper (Step 3, TDD). The Workflow itself is validated by the
live Step-4 run against fixed acceptance thresholds (recall + batched-call-count + cost), not by unit tests —
it orchestrates non-deterministic agents.

## KB Impact
None this increment. The `docs/kb/` ledger write is Increment 3 (loop controller). Verified rules are Step-4
output only.

## Open Questions
1. **Recall judge form** — semantic LLM judge (lean: handles wording-independence) vs deterministic
   match-keys per golden rule (brittle but $0). Recommend the judge; developer may prototype both.
2. **Miner clean-room** stays prompt-enforced this increment; the mechanical seal (verifiers are already
   sealed-by-inline-slice; miners get `disallowedTools` + inline source) is Increment 3. Confirm that defer.
3. **Build location** `harness/` (top-level, dev-repo machinery) — decided; flag if you'd prefer it under
   `docs/specs/.../delivery/`.
