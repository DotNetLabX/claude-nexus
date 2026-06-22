# Mine→Verify→Cover Harness — Increment 3a (automated single-class pipeline controller)

**Feature Spec:** `docs/proposals/mine-verify-automation-design.md` (§1 loop controller, §6 gates, §5 KB ledger)
+ `../roadmap.md` Increment 3. No `definition/spec.md` — ad-hoc technical feature (ADR-27/28).

**Scope decision (owner-confirmed):** Increment 3 is **split**. This is **3a** — automate the three *proven*
stages into one controller. **Deferred to 3b:** the Discover stage, the multi-class worklist sweep, and the
dry-counter stopping signal (all three are Discover/multi-pass concepts — moot until Discover lands).

## Context

Producing a mutation-gated class today is five manual acts: fire `mine-verify.workflow.js` → score → fire
`cover.workflow.js` → flip the KB → assemble the run report. Inc-2 proved each stage works (BugRatio: 88%
kill, all gates green) but also proved the workflows had three runtime-contract defects invisible to
`node --check` — found one painful live run at a time. Inc-3a makes the pipeline **one automated invocation**
and adds the cheap offline guard that would have caught those defects in milliseconds.

**Honest naming:** with Discover deferred + single-class, there is no multi-pass loop — this is a **pipeline
controller**, not an "autonomous loop." The multi-pass loop arrives with Discover (3b).

## Scope

**In:** a `harness/loop.workflow.js` controller that composes the proven sub-workflows (via `workflow({scriptPath})`)
into one automated Mine→Verify→Cover run for **one** target class: KB ledger write, self-written run report,
budget-cap + mutation-ratchet safety, and a mechanical clean-room seal (or a documented prompt-only fallback).
Plus the offline workflow-contract test, and the Timeout-semantics fix surfaced by the Inc-2 run.
**Out (3b / later):** Discover, multi-class worklist sweep, the dry-counter, the real char_pin manifest-pin,
and any language-adapter extraction (deferred until C++ — owner-confirmed).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | target via `args` (UNVERIFIED runtime global — investigate + fallback); BugRatio defaults preserve current behavior | — |
| 2 | (none) | — | **yes** | mock-globals sandbox; fixture agent-returns; assert no static import / no undefined global | Log: no workflow-contract-test skill |
| 3 | (none) | — | **yes** | `Timeout` ⇒ killed at the `killed++` predicate; two inlined copies; existing test expectations change | — |
| 4 | (none) | — | **yes** | `kb-write.mjs`: rules array → KB markdown (design §5 schema) — the Verify→Cover seam | Log: no KB-serializer skill |
| 5 | (none) | — | no | `workflow({scriptPath})` composition (UNVERIFIED — monolith fallback); `budget.spent()`-vs-ceiling cap; reuse `mutationRatchet` | Log: no controller-authoring skill (Inc 4) |
| 6 | (none) | — | no | clean-room `agentType` (agent() has no `disallowedTools` opt — verified); prompt-only fallback if infeasible | — |
| 7 | (none) | — | no | orchestrator writes `cover-{class}.md` (the `cover-bugratio.md` shape) as its final step | — |
| 8 | (none) | — | no | live runs: BugRatio (re-prove automated) + a fresh class (generalization) | — |

All `None` — no nexus skill covers "author a mutation-harness controller / KB serializer / workflow-contract test."
Steps 2, 3 & 4 are `TDD: yes` (deterministic helpers, same posture as Inc-1's recall scorer + Inc-2's gates).

## Domain / Data Model Changes
N/A (nexus JS dev-repo tooling). In sprint-rituals: only the automated KB ledger flip + generated tests, exactly
as Inc-2 — no domain-logic change (char_pin still enforces this).

## Implementation Steps

**1. Parameterize the sub-workflows by target.**
`harness/mine-verify.workflow.js` + `harness/cover.workflow.js` read their target (class, source path, KB paths,
golden ids) from the Workflow `args` global, **defaulting to the existing BugRatio consts when `args` is absent**
(back-compat — the standalone invocations still work).
**Runtime-capability note (unverified — investigate, don't assert):** neither workflow reads an `args` global
today (both hardcode consts, self-contained by design — `mine-verify.workflow.js:37-39`, `cover.workflow.js:188-201`).
Whether the runtime injects `args`, and whether `Workflow({scriptPath}, {target})` forwards a 2nd arg into it, is a
**Step-8 bringup check**. Fallback if no `args` injection: the workflows keep their consts and the controller
parameterizes another way (documented in the controller header).
Acceptance: with `args`, each workflow retargets; without, it reproduces the current BugRatio behavior; the offline
test (Step 2) surfaces a hard `ReferenceError` if `args` is referenced-but-absent.
Skill: None. TDD: no (refactor — Step 2 covers it).
Satisfies: design §1 (orchestrator selects the target).

**2. Offline workflow-contract test (the cheap guard).**
`tests/unit/workflow-contract.test.mjs` — loads each workflow script in a sandbox with **mock** runtime globals
(`agent`/`phase`/`log`/`budget`/`workflow`/`args`; `read` deliberately undefined) and **fixture** agent-returns, and
asserts: no static `import`, no reference to an undefined global, the orchestrator threads stage outputs to the
next stage, and the gates are called with the right-shaped objects. No real agents, no .NET — runs in ms.
Acceptance: the test **fails** if a workflow reintroduces a static `import`, calls `read()`/`fs`, or references an
undefined global (i.e. it would have caught all three Inc-2 defects); inside the CI glob `tests/unit/*.test.mjs`.
**Known blind spot:** the mock-globals sandbox has no filesystem, so it **cannot** exercise the KB-file seam
(Step 4) — that seam is covered by Step 4's own unit test + the Step-8 live run, not here.
Skill: None (gap). TDD: **yes**.
Satisfies: the Inc-2 lesson (`node --check` insufficient — validate the runtime contract).

**3. Fix Timeout semantics in the gate — precise site list.**
`Timeout` ⇒ **killed** (standard Stryker — a timeout is a *detected* mutant). The change is the **numerator
predicate**, not the survivor flag, and lands in **three** sites:
- (a) `harness/lib/cover-gates.mjs` — add `Timeout` to the **`killed++` predicate** (`:111`); **keep** `Timeout` in
  `DENOMINATOR_STATUSES` (`:63` — it's still a reachable, run mutant). The `isSurvivor` line (`:102`) is *not* the
  load-bearing change.
- (b) the **verbatim inlined copy** in `cover.workflow.js:87-128` ("keep in sync") — identical change, in lockstep.
- (c) `tests/unit/cover-gates.test.mjs:165-184` — this **existing** fixture's expectations **change** (not just an
  addition): `scorePct` 60→70, `reachableSurvivors.length` 4→3. Add a **new** assertion that a `Timeout` mutant
  lands in `killed`.
Downstream confirmed safe (critic): Timeout drops out of the `reachableSurvivors` feedback (intended — you can't
test-kill a hang), and the ratchet only compares `scorePct` (uniform rise, no spurious regression).
Acceptance: the updated fixture passes at 70 / 3; a `Timeout` mutant counts toward `killed`; a sync check confirms
(a) and (b) are byte-identical.
Skill: None. TDD: **yes**.
Satisfies: the Inc-2 `cover-bugratio.md` Timeout-semantics open item.

**4. KB-write serializer (`harness/lib/kb-write.mjs`) — the Verify→Cover data seam.**
**The seam is filesystem-mediated, not an in-memory return** (critic CRITICAL-1, grounded): Mine→Verify *returns*
`consensusRules` as a JS array and does **not** write the KB (`mine-verify.workflow.js:280-286`); Cover *reads* its
rules from the KB **file path** and has no in-memory rules parameter (`cover.workflow.js:193`, `:315-318`). So the
controller MUST serialize the verified rules into the consuming project's KB schema (`bug-ratio.md`, status
`verified`, **supersede-not-delete**) **and** update `index.md` **before** invoking Cover — else Cover runs against
stale/missing rules. A deterministic helper `harness/lib/kb-write.mjs` does the transform: rules array
(`{id,kind,agreement,lines,statement}`) → KB markdown per design §5 (Rules / Key Files / Edge Cases / Relationships
/ Source + mutation HTML comments).
Acceptance: given a fixture rules array, `kb-write.mjs` emits KB markdown matching the §5 schema (headings + footer
comments); `tests/unit/kb-write.test.mjs` pins it (TDD), incl. the supersede case (existing entry → new rules, history
preserved).
Skill: None (gap). TDD: **yes**.
Satisfies: design §5 (KB ledger — verified status written *before* Cover reads it).

**5. Build the pipeline controller (`harness/loop.workflow.js`).**
Run **Mine→Verify** (returns rules) → **`kb-write.mjs` writes the verified rules to the KB** (Step 4) → **Cover**
(reads that freshly-written KB; returns gates + per-file score) → on all-gates-green, flip the KB to `mutation-gated`
→ write the report (Step 7). Target via `args` (Step 1). One class per invocation.
**Composition mechanism (unverified — investigation-with-fallback):** prefer `workflow({scriptPath})` to reuse the
fixed sub-workflow code (the children never call `workflow()` — confirmed by grep — so the one-level nesting limit,
*if* it exists, holds). But `workflow()` composition appears in **no** live file and is not in the design's
primitive list (§7 names `pipeline()`/`parallel()`, not `workflow()`). **If it's unavailable or doesn't nest, fall
back to a single controller that inlines the fixed sub-workflow bodies (a monolith).** The Step-4 KB seam is
identical either way.
**Safety rails:** budget cap via **`budget.spent()` vs a per-class ceiling const** (`budget.remaining()` does **not**
exist in the runtime — only `budget.spent()` is used, `cover.workflow.js:446`; critic HIGH-1), and the mutation
ratchet (reuse the existing `mutationRatchet`).
Acceptance: one `Workflow({scriptPath:'harness/loop.workflow.js'}, {target})` runs Mine→Verify→(KB write)→Cover
end-to-end; on success the KB is `mutation-gated` and the report written with **zero** manual steps; on budget-ceiling
breach or a ratchet regression it **halts and reports**, never fakes green. Step 2 covers the wiring; Step 8 confirms
live.
Skill: None (gap). TDD: no (orchestration — Step 2 offline + Step 8 live validate).
Satisfies: design §1 (the controller) minus the deferred Discover/dry-counter.

**6. Mechanical clean-room seal (or a documented fallback).**
The Workflow `agent()` has **no `disallowedTools` opt** (verified against the tool contract), so the seal must come
via a custom clean-room **`agentType`** (a subagent whose tool set cannot read the golden path) for the miners +
Cover agent. **Investigate** whether a restricted `agentType` is achievable in the Workflow runtime; if so, route
the clean-room agents through it. If **not**, keep the Inc-1/2 prompt-enforcement and **document the gap explicitly**
in the controller header + every run report — never claim a mechanical seal that isn't there (design §3 / ADR-13).
Acceptance: miners + Cover run under the restricted `agentType` **and** the golden path is unreadable to them; OR
the prompt-only status + the reason is written in the controller header and every run report.
Skill: None. TDD: no. **Confidence: low** — runtime capability unverified; investigation with a sanctioned fallback.
Satisfies: design §3 (clean-room as a mechanism).

**7. Self-written run report (orchestrator-owned).**
The controller writes `docs/specs/adhoc-MineVerifyCoverHarness/delivery/cover-{class}.md` (the `cover-bugratio.md`
shape — gates, score, cost, candidate bugs, survivors, the clean-room status from Step 6) as its **final step**. No
operator assembly (closes the Inc-2 gap the owner flagged).
**Note (Step-3 interaction):** with Timeout counted as killed, BugRatio's "Residual survivors" section becomes
**empty** — the template must render a zero-survivor section cleanly (no broken table).
Acceptance: a controller run emits `cover-{class}.md` automatically; content matches the live gate/score/cost
returned by the run (not hand-filled); a zero-survivor run renders cleanly.
Skill: None. TDD: no.
Satisfies: the owner's per-run-report requirement + design §5.

**8. Validation runs — re-prove + generalize.**
Run the controller on **BugRatioAnalyzer** (re-prove, fully automated; expect ~100% with Timeout counted as killed)
**and** one **fresh** class — `CycleTimeAnalyzer` — to prove the controller generalizes beyond the two pilots.
Capture both auto-written reports + costs. This run also closes the **Step-1/4/5/6 bringup checks** (`args` injection,
`workflow()` composition, the KB seam, the clean-room agentType) — the imagined-API risks resolve here.
**Golden-set note:** if `CycleTimeAnalyzer` has no golden set, the generalization run **skips recall scoring** and
proves the **controller + Cover mutation gate** end-to-end (recall is independent of the mutation gate). Flag it in
the report; do not block on a missing golden set.
Acceptance: both runs all-gates-green via the **controller** (no manual steps); both reports auto-written; the fresh
class demonstrates the controller is not BugRatio-specific. Each live run pauses for owner go (it runs the .NET
toolchain against SR).
Skill: None. TDD: no (live validation).
Satisfies: roadmap Inc 3 acceptance + the owner's generalization/robustness check.

## Testing Strategy
Three deterministic suites under the CI glob: the workflow-contract test (Step 2), the updated gate tests (Step 3),
and the KB-serializer test (Step 4). The controller itself is validated offline by Step 2 and live by Step 8 (it
orchestrates non-deterministic agents — no unit test). The `.NET` tests produced remain gated by the Stryker
mutation floor, not their own count.

## KB Impact
The controller **automates** the Inc-2 KB ledger write (verified → mutation-gated) — now orchestrator-owned, not
operator-owed. Supersede, not delete.

## Open Questions
1. **Runtime-capability cluster (Steps 1, 5, 6) — the imagined-API risk.** Four capabilities are asserted by the
   design/intent but **not verifiable from any repo file**: `args` injection (Step 1), `workflow({scriptPath})`
   composition + one-level nesting (Step 5), and the restricted clean-room `agentType` (Step 6). Each now carries an
   explicit investigation-with-fallback (monolith for composition; consts for `args`; prompt-enforcement for the
   seal). They resolve at the Step-8 bringup run. **If out-of-repo Workflow-runtime docs confirm them, cite the
   contract in the controller header rather than re-discovering live.** Confirm the fallbacks are acceptable.
   Recommend: yes — Confidence: high (every path has a sanctioned fallback; none rescopes 3a).
2. **Clean-room seal feasibility (Step 6)** — the prompt-only fallback is the design's own ADR-13 reality; confirm
   it's acceptable if the `agentType` seal proves infeasible this increment. Recommend: yes — Confidence: high.
3. **CycleTime golden set (Step 8)** — if absent, the generalization run skips recall scoring and still proves the
   controller + mutation gate. Confirm acceptable. Recommend: yes (recall is a separate metric; the controller is
   what's under test) — Confidence: high.

## Plan Review

Code-grounded critic (`nexus:critic`, Mode 2, read the live workflow files + gate module + design): **GO-WITH-FIXES**
— 1 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW. Grounding verified (scope-to-3a clean, deferrals model-honest, Step-5/6 honesty
impeccable); the findings were folded in-place. None rescoped 3a.

| # | Finding (code-grounded) | Disposition |
|---|---|---|
| CRITICAL-1 | Step 4 hand-waved the Verify→Cover seam — live code makes it a **KB file hop** (Mine→Verify returns rules in memory `mine-verify:280-286`; Cover reads them from the KB file `cover:193,315-318`), so the controller must serialize rules→KB *before* Cover | Fixed — new **Step 4** `kb-write.mjs` (TDD'd serializer); Step 5 wires the KB write as the seam |
| HIGH-1 | `budget.remaining()` doesn't exist — only `budget.spent()` (`cover:446`); plan overclaimed a runtime API | Fixed — Step 5 cap is `budget.spent()` vs a per-class ceiling const |
| HIGH-2 | Timeout fix understated — it's the `killed++` predicate (`:111`) not `isSurvivor`; **two** inlined copies; an **existing** test's expectations break (60→70, 4→3) | Fixed — Step 3 names all three sites + the changed assertions precisely |
| MED-1 | `args` global unverified (both workflows hardcode consts) — asserted flat | Fixed — Step 1 investigation-with-fallback + Step-8 bringup check |
| MED-2 | `workflow()` composition + nesting limit unverified (in no live file) | Fixed — Step 5 monolith fallback + Open Q1 |
| LOW-1 | Step 7 report: Timeout-as-killed empties BugRatio's survivor section | Fixed — Step 7 zero-survivor rendering note |
