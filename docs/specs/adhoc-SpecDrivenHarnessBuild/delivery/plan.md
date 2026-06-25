# Plan — Spec-driven Cover front-end + spec-vs-code diff (full-build Increment 1)

**Slug:** adhoc-SpecDrivenHarnessBuild
**Spec:** `docs/specs/adhoc-SpecDrivenHarnessBuild/definition/spec.md` (Status: Ready)
**Type:** Technical feature — full-build Increment 1, graduating the GO'd spike (`adhoc-SpecDrivenCoverDiff`).
**Target repo:** `D:\src\knowledge-gateway` (.NET 10, class `GeneratedSqlValidator`). Harness lives here (`harness/`).
**Date:** 2026-06-25

## Goal

Automate the spec-driven direction the spike proved half-manually: a runnable front-end that takes the PO
golden rules, locates each rule's code, generates mutation-gated tests via the **existing Cover engine**,
diffs spec-rules against code-rules on three axes, and labels false positives deterministically — proven on
**one** class end-to-end through the *automated* path. The deliverable is the runnable harness +
pure-helper libs + unit tests + a known-answer reproduction of the spike's L272 finding. **No plugin bump**
(dev-repo machinery).

## Guardrails (carry from the harness + ADR-C; binding)

- **Clean-room (ADR-C, mechanical placement layer).** The golden rule TEXT is read by **one** actor — the
  `spec-load` agent — and never appears in the Cover or runner agent prompts (rule statements are handed
  **inline**). Tests go in an **isolated assembly**, never `KnowledgeGateway.Tests`. *Bounded:* the PO
  golden set is code-laddered (recall answer key) — isolation is enforced at placement, not at authoring
  (spec §AC-3 / HIGH-2). Do not assert deeper intent-isolation than that.
- **Reds are the output, not a gate failure (ADR-D).** A spec-driven test red on current code is **kept +
  flagged**, never deleted, routed to the candidate-bug queue. Reuse the gate **helpers** from
  `harness/lib/cover-gates.mjs`, **not** the code-derived all-gates-green stop — `suiteGreen` (`failed===0`)
  must **not** be applied to spec-driven reds (spec §AC-1 reuse boundary). The mutation gate still applies
  to the mutation pass over the spec-driven tests.
- **Mutation kill is the only acceptance gate; coverage is informational.** No coverage gate (proposal).
- **All harness agents run on Sonnet** (owner directive — every `agent()` gets `model: 'sonnet'`; the
  orchestrator context may be Opus). Matches `cover.workflow.js` / `loop.workflow.js` defaults.
- **Workflow runtime contract.** No `import`/`fs`/`Date`/`Math.random`; `meta` is a pure literal; agents do
  all I/O; `args` arrives JSON-stringified (tool) or as an object (composition) — parse both
  (`mine-verify.workflow.js:47-49`). Pure helpers live in `harness/lib/*.mjs` (unit-tested) and are
  **inlined verbatim** into the workflow (the runtime can't import) — same pattern as `cover-gates.mjs` ↔
  `cover.workflow.js`.
- **Runner results land nexus-side, git-ignored** (`harness/.runs/`), never in the KG tree
  (`cover.workflow.js:261-264`).

## Steps

### Step 1 — Target config + `loadSpecRules()` seam (the spec-load actor)
Create `harness/targets/generatedsqlvalidator.json` — class source path, the isolated-assembly target, and
the **golden ids only** (mirrors `harness/targets/bugratio.json`'s golden-ids-only discipline). Implement
`loadSpecRules()` as a **distinct spec-load agent** (a read-only actor, the pattern of the kb-read agent at
`loop.workflow.js:438-455`) that reads the sequestered golden set (`D:\src\knowledge-gateway\docs\audit\golden-set.md`)
and returns structured rules via schema: `{ id, statement, expectedOutcome, codeAttestation? }`. This is the
D4 seam — golden source today, an extracted source later, behind the same return shape. The golden path is
passed to **this agent only**.
- **Skill:** None — **TDD:** no — **Satisfies:** AC-3, ADR-C; D4 — **Confidence:** medium
- **Accept:** target config created with golden **ids** only (no rule text); the spec-load agent returns
  structured rules with per-rule `expectedOutcome`; the golden-set path appears in **no** Cover/runner agent
  prompt (grep over `spec-cover.workflow.js`). A written note that the golden text entered only the
  spec-load actor (isolation demonstrable, not asserted).

### Step 2 — `locateRuleCode()` seam (attestation-first, guided-miner fallback)
Pure decision helper in `harness/lib/spec-diff.mjs`: `decideLocation(rule)` → if `codeAttestation` present,
use it; else flag `miner-needed`. The workflow then runs a **guided-miner `agent()`** for `miner-needed`
rules (input: rule statement + the candidate class source; output schema: `file:line | NO-CODE-FOUND`).
`NO-CODE-FOUND` is **not an error** — it is the first candidate sin-of-omission, recorded as such. Embedding
retrieval is **out of scope** (D1) — the seam takes it as a drop-in source later.
- **Skill:** None — **TDD:** yes — **Satisfies:** AC-2; D1 — **Confidence:** medium
- **Accept:** `spec-diff.test.mjs` covers `decideLocation` for attestation-present, miner-fallback, and
  `NO-CODE-FOUND`. A miner-returned `file:line` whose code does **not** contain the rule routes to
  `needs-triage` (the location-correctness caveat, spec AC-2) — not a silent mis-anchor.

### Step 3 — Spec-driven Cover front-end (`harness/spec-cover.workflow.js`) — reuse the engine
The runnable Workflow, the **3-actor** shape of `cover.workflow.js` (orchestrator + clean-room spec-Cover
agent + distinct runner agent), differing only in the **rule source** (spec rules, not mined) and the
**assertion shape** (each test asserts `GeneratedSqlValidator.Validate(...)`'s expected **violation
identity** per its golden rule). Tests are written into an **isolated assembly**; red-on-current tests are
kept + flagged (`// CANDIDATE BUG:`), never deleted. Reuse the runner-result schema + gate **helpers** from
`cover-gates.mjs` (inlined verbatim per the runtime contract).

**Two reuse-boundary divergences from `cover.workflow.js` — design them, don't inherit them (AC-1):**
1. **Own control flow, not the all-gates-green stop loop.** `cover.workflow.js:487` computes
   `allGreen = every gate pass` (incl. `suiteGreen`), and with kept reds it would never reach all-green and
   run to `cap-reached`. The spec front-end reuses the prompts/schema/gate-helpers but drives its **own**
   loop: reds route to the diff/labeler (Steps 4-6) **before** any green-gate evaluation; `suiteGreen`
   (`failed===0`, `cover-gates.mjs:29`) is **never** run over the spec-driven reds.
2. **The mutation pass runs over the GREEN subset only.** Stryker requires a **baseline-green** suite (it
   aborts/▸mis-scores if the initial run has failures); a suite with kept reds breaks kill-detection. So the
   reds are **quarantined** as candidate bugs and the mutation pass (the `mutationFloor` gate) runs over the
   **passing** spec-driven tests only — proving the spec tests that *do* pass are strong, while the reds are
   the diff output. (This engine-interaction is new to the automated path — the manual spike never hit it.)
- **Skill:** tdd — **TDD:** yes — **Satisfies:** AC-1, AC-3; ADR-A/C/D — **Confidence:** medium (engine
  proven; the spec-rule input shape, violation-identity assertion, and the green-subset mutation pass are
  the new surface)
- **Accept:** the generated test project's `.csproj` references the KG **product** project but **not**
  `KnowledgeGateway.Tests` (isolated-assembly grep, spec AC-3(b)); the golden path is in no agent prompt
  (AC-3(a)); gate helpers imported unforked (no copy of the gate logic diverging from `cover-gates.mjs`);
  the front-end does **not** reuse the `allGreen`-stop loop and `suiteGreen` is **not** run over reds; the
  mutation pass runs over the green subset (reds quarantined, never deleted); reds captured to the
  candidate-bug queue. Reference the 3-actor contract + runner prompt in `cover.workflow.js:344-431`.

### Step 4 — The three-axis diff (`harness/lib/spec-diff.mjs`)
Pure `classifyRule(specRule, codeRules)` → exactly one of `spec ∧ ¬code` (missing feature — headline),
`code ∧ ¬spec` (undocumented behavior / enshrined bug), `both-divergent` (boundary disagreement). The
**code-rules** side is produced by the existing `harness/mine-verify.workflow.js` run on the same class (the
proven path — **no new code**; reuse its `consensusRules` output). Each `spec ∧ ¬code` item carries its red
test (Step 3) or a `code-missing` note (Step 2 `NO-CODE-FOUND`).
- **Skill:** None — **TDD:** yes — **Satisfies:** AC-4; ADR-B — **Confidence:** medium
- **Accept:** `spec-diff.test.mjs` proves **every** input rule lands in exactly one axis (no rule
  unclassified, none double-counted); `spec ∧ ¬code` items carry a red test or a code-missing note; the diff
  is serialized with the `spec ∧ ¬code` set first.

### Step 5 — The deterministic FP-labeler (`harness/lib/spec-diff.mjs`)
Pure `labelRed({ expected, actual, ruleOrder })` → `{ label, route }` implementing the spec's **5-case
table** (§FP-labeler): 1 earlier-fired → `interaction-artifact`; 2 later-fired → candidate (under-enforce);
3 expected-rule/actual-null → candidate (sin of omission); 4 expected-null/actual-fired → candidate **tagged
`needs-triage`** (over-reject — the L272 shape *and* the fixture-artifact shape, not auto-decided); 5 errored
→ `needs-triage`. `ruleOrder` is the validator's fixed 7-rule order (`SingleSelect` … `ReportIdsFirst`).
- **Skill:** None — **TDD:** yes — **Satisfies:** AC-5; D3 — **Confidence:** high (mechanism confirmed
  against `GeneratedSqlValidator.cs:215-306`)
- **Accept:** `spec-diff.test.mjs` covers **all five** cases, explicitly including case 4
  (expected-null/actual-fired → candidate-bug queue + `needs-triage` tag — the L272 case). Case 5's
  representative fixture is modeled on the spike's **ARTIFACT-04** (the un-constructable `SurfaceProfile.Curated`
  profile — the test errors/won't construct), not a synthetic stub, so the test exercises the real failure
  signal. The `ruleOrder` constant matches the source rule order exactly (a test asserts the 7 names in
  order). Pattern: the pure-fn + unit-test shape of `cover-gates.mjs` ↔ `tests/unit/cover-gates.test.mjs`.

### Step 6 — Run report: 3-axis diff + candidate-bug queue + needs-triage bucket
The orchestrator writes a self-contained run report (the self-written-report pattern of
`loop.workflow.js:647-719`): the 3-axis diff table, the **candidate-bug queue** (every red, never deleted —
ADR-D), and the **needs-triage bucket** (case-4 over-rejections, case-5 errors, miner mis-locations,
fixture-fidelity artifacts). The report is the operator's triage surface for #1/#2 (the operator-assisted
discipline, D3).
- **Skill:** None — **TDD:** no — **Satisfies:** AC-4, AC-5; ADR-D — **Confidence:** medium
- **Accept:** report written with all three sections; every red present in the candidate-bug queue (count
  matches the run); zero reds deleted; needs-triage bucket lists each unresolved item with its label.

### Step 7 — End-to-end known-answer reproduction (AC-6) + the operator patch
Run the front-end against the two reproducibly-defined arms (spec AC-6). **The Rule-5 comparison is at L272
on HEAD but L276 in KG's dirty working tree** — refer to it by symbol (`Math.Abs(literal -
resolvedNumeric.Value) > 0.01`, Rule-5 `NoStrayLiteralThreshold`), not the line.

**Dirty-tree hazard (the patch already exists uncommitted in KG — `git diff` confirms it).** The arms are
NOT "HEAD" vs "apply a patch" — KG's working tree *already* holds the `+ 1e-9` edit. The operator must
neutralize it for the pre-fix arm and restore it for the patched arm. `OPERATOR ACTION REQUIRED` in
implementation.md, exact commands:
- **Pre-fix arm:** `git -C D:\src\knowledge-gateway stash push -- <validator>` (or `git checkout HEAD --
  <validator>`) → the committed `> 0.01` form. Run the front-end.
- **Patched arm:** `git -C D:\src\knowledge-gateway stash pop` (or re-apply the one-line `> 0.01` → `> 0.01
  + 1e-9`). Run the front-end. Never double-apply (the tree starts dirty-with-patch).

**Pin the L272 fixture so ONLY Rule 5 can fire (else the red reproduces an artifact, not L272).** Rule 5 is
5th of 7 and only reaches if rules 1-4 pass and rules 6-7 stay silent. The spike's ARTIFACT-01/02 prove the
trap — a `public.analytics_report*` table trips Rule 6 (`BadReportsFilterPresent`) first. Construct the
known-answer SQL as: a single SELECT over a **pre-computed stats table** (e.g.
`public.analytics_store_category_stats` — in `PreComputedStatsTables`, exempt from Rule 6, and not a large
detail table so Rule 7 is silent), schema-qualified `public.*` FROM (passes Rule 2), no category trigger
(Rule 3), no `CURRENT_DATE`/`now()` (Rule 4), with a `resolvedThreshold` set and a literal exactly at
tolerance — so rules 1-4, 6, 7 all pass and **only** Rule 5 can fire.

- **Pre-fix arm assertion:** the candidate-bug queue contains a **case-4 over-rejection whose `actual ===
  "NoStrayLiteralThreshold"`** (the L272 finding — assert the *specific* rule identity, not "any case-4 red")
  and the earlier-fired interaction (ARTIFACT-03) is auto-labeled `interaction-artifact`.
- **Patched-arm assertion (pinned to the input):** the test asserting `|0.86 - 0.85|` passes is **green**.
  Boundary-band reds (golden text encodes `> 0.01`, fix is `> 0.01 + 1e-9`) are **expected divergence** →
  `needs-triage`, **not** counted against AC-6.

When consuming the spike's `candidate-bugs-generatedsqlvalidator.md` as the triage reference, treat its
"Live KG status: FIXED / applied by the KG team" row as **superseded** by the spec's provenance correction
(the fix is uncommitted; no fix commit exists).
- **Skill:** None — **TDD:** no — **Satisfies:** AC-6, AC-7; D5, D2 — **Confidence:** medium
- **Accept:** pre-fix run reproduces the L272 finding in the candidate-bug queue with `actual ===
  "NoStrayLiteralThreshold"` (the spike's manual finding via the automated path); patched-arm specific-input
  test green; `node --test tests/unit/spec-diff.test.mjs` passes (in the CI glob); `git status` shows
  **no** `plugins/**` change and no plugin version bump (AC-7 / increment hygiene).

## Review mode

**Code-grounded critic — MANDATORY** (spec §Review gate; shared-`harness/**` change + AC-6 rests on a
known-answer/negative assertion). The critic must read the actual harness libs (`cover-gates.mjs`,
`spec-cover.workflow.js`, `spec-diff.mjs`) and live KG source/git — not a doc-conformance pass — and
**re-verify**: (a) the labeler unit tests encode the corrected 5-case set incl. case 4; (b) the
red-handling-vs-mutation-gate boundary is honored (no `suiteGreen` over reds); (c) the AC-6 operator-patch
step is spelled out and the two arms are reproducible from committed git, not a dirty tree; (d) the
`ruleOrder` constant matches live source. Mode 2 against the spec's AC-1..AC-7.

## Out of scope (do not let the increment sprawl)

Multi-class / domain sweep; embedding retrieval (D1 defer); automated spec-source extraction (D4 defer);
automated input rule-isolation #1; equivalent-mutant detector (inherited from the Cover engine, spec
Out-of-scope); shipping as a `plugins/nexus/skills/` skill; coverage as a gate; touching the code-derived
harness's behavior.

## Plan Review (critic — code-grounded, MANDATORY, 2026-06-25)

A `nexus:critic` ran the mandatory code-grounded Mode-2 pass (read the live `harness/` libs, live KG
`GeneratedSqlValidator.cs`, and ran KG `git` itself). **Verdict: GO-with-fixes — no surviving CRITICAL; all
findings folded.** It confirmed against source/git: the AC-1..AC-7 cross-reference is complete (every step
traces to an AC/ADR, no AC unaddressed); `ruleOrder` matches `Validate()` exactly; the AC-6 arms are correct
(HEAD carries `> 0.01`, the `+ 1e-9` fix is in **no commit**); `tests/unit/*.test.mjs` is in the CI glob
(`scripts/selfcheck.mjs:44`); `.runs/` is git-ignored; the runtime contract holds. Dispositions:

| Finding | Sev | Disposition |
|---------|-----|-------------|
| AC-6 dirty-tree hazard — the `+ 1e-9` patch is *already* in KG's working tree, so the operator must stash it for the pre-fix arm | HIGH | **Fixed** — Step 7 now spells out `git stash push/pop` (or `checkout HEAD`/re-apply) and warns the tree starts dirty-with-patch. |
| AC-1 reuse residual (i): reusing `cover.workflow.js`'s `allGreen`-stop loop would run to cap-reached with reds | HIGH | **Fixed** — Step 3 now states the front-end drives its **own** loop (reds route to diff/labeler before any green gate; `suiteGreen` never over reds). |
| AC-1 reuse residual (ii): Stryker needs a **baseline-green** suite; kept reds break kill-detection | HIGH | **Fixed** — Step 3: the mutation pass runs over the **green subset** only; reds quarantined as candidate bugs (never deleted). The one genuine new engine-interaction the automated path introduces. |
| AC-6 "wrong-reason red": Rule 5 is 5th of 7; a mis-built fixture reds as `BadReportsFilterPresent` (Rule 6), reproducing an artifact not L272 | HIGH→ (folded) | **Fixed** — Step 7 pins the fixture (pre-computed stats table, only Rule 5 can fire) and asserts `actual === "NoStrayLiteralThreshold"`, not "any case-4 red". |
| ARTIFACT-04 is case-5 (un-constructable), not case-4 — both → needs-triage | MED | **Fixed** — Step 5 case-5 test models ARTIFACT-04's real un-constructable signal. |
| Stale "FIXED in live KG" row lives in the spike's candidate-bugs artifact the plan references | MED | **Fixed** — Step 7 notes that row is superseded by the spec's provenance correction. |
| "L272" handle vs L276 in the dirty tree | LOW | **Fixed** — Step 7 refers by symbol; line qualified "(L272 at pre-fix HEAD; L276 in dirty tree)". |

Open item the critic raised and the architect confirms resolved: the mutation-baseline-with-reds question
(HIGH ii) is answered by the green-subset quarantine design, not deferred. The spec-load agent reading the
golden text (Step 1) is a *new* golden-text reader vs the mine-verify zero-agent rule — acceptable and
bounded by AC-3's placement-layer caveat (the spec-load actor is the single permitted reader; golden text
never reaches the Cover/runner prompts).
