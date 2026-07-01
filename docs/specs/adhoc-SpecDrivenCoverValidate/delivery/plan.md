# Plan — Spec-driven Cover: live validation + generalize off the single validator (full-build Increment 2)

**Feature Spec:** None (ad-hoc technical increment — definition inlined below; governing artifacts:
`docs/specs/adhoc-SpecDrivenHarnessBuild/definition/spec.md` §"named next increments" + ADR-A..D, and
`docs/proposals/spec-driven-cover-and-diff.md`). The architect is the definer (ADR-27/28).
**Slug:** adhoc-SpecDrivenCoverValidate
**Type:** Technical feature — full-build **Increment 2**, graduating Increment 1
(`adhoc-SpecDrivenHarnessBuild`, COMPLETE/APPROVED 2026-06-25).
**Target repo:** `D:\src\knowledge-gateway` (.NET 10). Harness lives in this nexus repo (`harness/`).
**Date:** 2026-06-30

## Context

Increment 1 built the spec-driven Cover front-end (`harness/spec-cover.workflow.js` + `harness/lib/spec-diff.mjs`)
and proved it **offline** on **one** class (`GeneratedSqlValidator`). Two gaps block graduating it to a
shipped skill (Increment 3, deferred), and this increment closes them:

1. **It has never run live.** The Inc-1 AC-6 two-arm `dotnet test` + Stryker reproduction was operator-owed
   and blocked on KG's dirty tree; the .NET toolchain arm was only proven through an **offline fixture**.
2. **It is hardcoded to one validator.** `RULE_ORDER` in `spec-diff.mjs` (and its inlined copy in
   `spec-cover.workflow.js`) is `GeneratedSqlValidator`'s 7-rule firing order, the workflow passes that
   constant at `spec-cover.workflow.js:571`, the spec-load prompt enumerates the 7 SQL rule names inline
   (`:415-417`), **and the labeler's pass-sentinel is hardcoded to `null`** — none of which a second
   validator can satisfy without code edits.

**Re-grounding (verified against KG git, 2026-06-30 — supersedes the Inc-1 artifacts).** The Inc-1 spec/plan
recorded the `+ 1e-9` tolerance fix as **uncommitted** ("HEAD still carries `> 0.01`", a `git stash` runbook).
That is **no longer true**: the fix is **committed** at `0811132` (2026-06-28, "…SQL grounding FP-safe
boundary…") and the validator file is **clean** in KG's working tree. So the AC-6 arms have **flipped** and
the dirty-tree runbook is dead:
- **Pre-fix arm = `9e40d1f`** (parent of the fix) — `Math.Abs(literal - resolvedNumeric.Value) > 0.01` (L272).
- **Patched arm = `0811132`** (explicit SHA) — `> 0.01 + 1e-9` (L276). **Pin the SHA, not "HEAD"**: KG's
  `main` HEAD is `337c0537`, five `docs:`/`chore:` commits past `0811132`; the validator file is byte-identical
  at both, but the tree is active (F38 WIP) so "HEAD" is a moving, fragile handle (memory:
  recheck-branch-under-concurrent-run). The finding is referenced by **symbol** (`NoStrayLiteralThreshold`,
  the stray-literal tolerance compare), line qualified "(L272 at `9e40d1f`; L276 at `0811132`)".

The second validator is **`SlackSignatureVerifier`** (KG, `Features/Slack/`): first-violation-wins (same shape
the labeler assumes), already carries golden rules **GOLD-13…GOLD-18** (no new authoring needed), but returns a
**`SignatureVerificationResult` enum** where `GeneratedSqlValidator` returns a `string?`. **Two** differences
exercise the generalization, not one: (a) the identity is an enum value name, not a rule-name string; and
(b) the "pass" outcome is the enum value **`Valid`**, not `null`. Its precedence (GOLD-18, first-failure-wins):
`MissingSecret → MissingSignature → MissingOrInvalidTimestamp → TimestampOutOfRange → InvalidSignature → Valid`.

Out: the richer **collect-all / bucket / dispatch** validators (`ChartSpecValidator`, `GroundingDecision`,
`MetricViewMapper`) — those need a different outcome model and are deferred to Increment 3.

## Scope

**In (this increment):**
- Generalize `RULE_ORDER` + the violation-identity model + **the pass-sentinel** off `GeneratedSqlValidator`
  into **per-target config**, supporting a `string?` rule-name return **and** an **enum** return with a
  non-`null` pass value (ADR-E, new).
- An **offline sync guard** so the inlined `spec-diff.mjs` copy in the workflow cannot drift from the lib.
- Re-ground the AC-6 reproduction to the committed two-SHA arms; supersede the Inc-1 dirty-tree runbook.
- **Live** end-to-end run (real `dotnet test` + Stryker) on `GeneratedSqlValidator` reproducing the L272
  finding live — the thing Inc-1 only did offline.
- **Live** end-to-end run on a **second** validator (`SlackSignatureVerifier`, GOLD-13…18) — proving the
  generalization on a different validator shape **on config alone** (no front-end code edits beyond Step 2).
- A cross-class validation report with an explicit **Increment-3 readiness verdict**.

**Out (named, not gaps):**
- Productionizing as a shipped skill (`plugins/nexus/skills/…`) and the **plugin version bump** — that is
  Increment 3 (the chosen shape: a second front-end inside `mine-verify-cover`). **This increment ships
  nothing to users and bumps no plugin version** (dev-repo `harness/` machinery, like `scripts/`/`tests/`).
- Arbitrary validator shapes (collect-all, multi-violation, bucket/dispatch) — ADR-E scopes this increment to
  first-violation-wins; the others are Inc-3 design.
- **A Slack `code-derived` (mine-verify) run** to populate the diff's `code ∧ ¬spec` / `both-divergent` axes —
  the Slack diff is **deliberately spec-only** this increment (the diff helper is already proven on SQL in
  Inc-1; the new surface is the spec-side path + the enum labeler, not the pure `diffRules` fn). A Slack
  mine-verify run feeding `_args.codeRules` is the named, optional enhancement (Step 5 note), not required.
- Embedding retrieval for rule→code at scale (D1); automated spec-source extraction (D4); multi-class/domain
  sweep; equivalent-mutant detector (inherited from the Cover engine); coverage as a gate. All deferred,
  unchanged from Inc-1.

## Acceptance criteria (this increment — the done-check + critic map to these)

- **AC-1 — Generalized off the single validator (ADR-E).** The positional `ruleOrder`, the violation-identity,
  **and the pass-sentinel** come from per-target config, not from a `GeneratedSqlValidator`-keyed constant in
  the labeler **or** the workflow run-path. *Assertions (all three — the SQL order must leave the run-path,
  not just be renamed):* (a) the SQL 7-rule order lives in `harness/targets/generatedsqlvalidator.json` (it
  already has a `ruleOrder` field) and `spec-diff.test.mjs`'s "order matches source" test asserts **the JSON's**
  order, not a lib constant; (b) `spec-cover.workflow.js` selects `ruleOrder` (and `okValue`) from
  `_args`/config — `:571` no longer passes a hardcoded `RULE_ORDER`, and the spec-load prompt's rule-name set
  is config-sourced; (c) `spec-diff.test.mjs` runs `labelRed` against a **second** order (Slack's 5 values)
  and passes all five label cases.
- **AC-2 — Enum return + non-`null` pass-sentinel supported.** The identity model handles an **enum** return
  (`SignatureVerificationResult`) and a pass value of **`Valid`** (not `null`). *Assertion (must exercise the
  sentinel, not the already-working `null` path):* `spec-diff.test.mjs` includes a Slack **over-rejection**
  (`expected: "Valid"`, `actual: "TimestampOutOfRange"`) → `over-rejection`/candidate-bug, and a Slack
  **sin-of-omission** (`expected: "InvalidSignature"`, `actual: "Valid"`) → `sin-of-omission`/candidate-bug —
  each asserting the candidate-bug route with the Slack `ruleOrder` + `okValue: "Valid"`. The pre-existing
  `expected: null` SQL case must **not** stand in for this (it passes against an unchanged `labelRed`).
- **AC-3 — Live AC-6 reproduction, committed two-SHA arms.** Running the front-end **live** (real `dotnet test`
  + Stryker) against the pre-fix arm `9e40d1f` produces a **case-4 over-rejection** candidate bug with
  `actual === "NoStrayLiteralThreshold"`; the patched arm `0811132` flips the specific known-answer input
  (`|0.86 - 0.85|`) **green**. *Assertion:* the live run report (`.runs/`) shows the pre-fix candidate bug
  with that exact `actual`, and the patched-arm input green; both arms are committed SHAs (no dirty-tree
  dependency); an **arm-sanity check** records that the SUT under the pre-fix run contained `> 0.01` and not
  `> 0.01 + 1e-9` before the result was trusted.
- **AC-4 — Second-class live run.** The generalized front-end runs **live** end-to-end on
  `SlackSignatureVerifier` (GOLD-13…18) into its **own** isolated assembly, yielding a green-subset mutation
  score **≥ floor** and a diff that classifies **every** GOLD-13…18 rule into exactly one axis (spec-only
  this increment), plus a candidate-bug/needs-triage split keyed off the enum value names. *Assertion:* a
  Slack run report exists with the mutation score, every rule in exactly one axis, and labeled reds (if any).
- **AC-5 — Cross-class validation report + Inc-3 verdict.** A committed report names, per class: did L272
  reproduce **live** (y/n); did the generalization hold on the enum-return validator **on config alone** (y/n);
  the false-positive rate (reds → real vs artifact, from the labeler + triage); and the explicit blockers (if
  any) for Inc-3 skill graduation. *Assertion:* `delivery/validation-report.md` exists with all four fields per
  class + the verdict, citing the `.runs/` evidence.
- **AC-6 — Increment hygiene + sync guard.** All net-new/changed code lives under `harness/` (+ its unit
  tests/selfcheck wiring); the inlined `spec-diff.mjs` copy is guarded against drift; **no `plugins/**` change
  and no plugin version bump.** *Assertions:* `node --test tests/unit/spec-diff.test.mjs` and
  `tests/unit/spec-cover-workflow.test.mjs` pass; the new **inline-copy sync check** (Step 2) passes in
  `scripts/selfcheck.mjs` (or as a unit test in the CI glob); `git status` shows no `plugins/**` change.

## ADR unit (new — extract on completion)

- **ADR-E — Validator-shape contract for the spec-driven direction.** The spec-driven Cover front-end supports
  **first-violation-wins** validators whose decision method returns a **single discriminated violation
  identity** along **two** per-target config axes:
  - **identity type** — a `string?` rule name (`GeneratedSqlValidator`) **or** an **enum** value name
    (`SlackSignatureVerifier`/`SignatureVerificationResult`); the labeler keys off the value *name*.
  - **pass-sentinel (`okValue`)** — the outcome that means "no violation": `null` for SQL, the enum value
    **`Valid`** for Slack. `labelRed`'s sin-of-omission (case 3) and over-rejection (case 4) branches compare
    against the per-target `okValue`, **not** a literal `null`; `okValue` defaults to `null` and is threaded
    from config like `ruleOrder`.

  Collect-all / multi-violation / bucket / dispatch validators are **out of scope** (a different outcome model
  — Inc-3 design). Rationale + evidence live here and in the validation report; extract the one-line ADR to the
  register on completion (ADR-28: point back, don't restate).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | re-ground the L272 fixture target to committed SHAs `9e40d1f`/`0811132`; supersede the Inc-1 stash runbook | |
| 2 | (none) | — | yes | lift `ruleOrder` + identity + **`okValue`** to per-target config in `spec-diff.mjs` + inlined copy + workflow `:571`/spec-load prompt; enum support; inline-copy sync guard; document ADR-E | Log ADR-E |
| 3 | (none) | — | no | `harness/targets/slacksignatureverifier.json` — GOLD-13…18 ids only, 5-value ruleOrder, `okValue: "Valid"`, source + **own** isolated-assembly paths | |
| 4 | (none) | — | no | operator-owed live two-arm `dotnet test`+Stryker run on `GeneratedSqlValidator` (surgical per-file checkout + arm-sanity) | |
| 5 | (none) | — | no | operator-owed live run on `SlackSignatureVerifier` (enum + `okValue` generalization proof, config-only) | |
| 6 | (none) | — | no | cross-class validation report + Inc-3 readiness verdict | |

All `Skill: None` — this is dev-repo harness JS (Workflow scripts + pure `.mjs` helpers); the nexus-dotnet
pattern skills do not apply, and there is no harness-authoring pattern skill. The `tdd` process skill applies to
Step 2 (the pure-helper change is testable behavior); the live-run and config/report steps are wiring/execution.

## Guardrails (carry from Inc-1 + ADR-C; binding)

- **Clean-room (ADR-C, mechanical placement layer).** The golden TEXT is read by **one** actor — the
  `spec-load` agent — and never appears in the Cover/runner prompts (statements handed **inline**). Tests go in
  an **isolated assembly**, never `KnowledgeGateway.Tests`. Bounded: the golden set is code-laddered; isolation
  is at placement, not authoring. Holds unchanged; the Slack target gets its **own** isolated assembly (Step 3).
- **Reds are the output, not a gate failure (ADR-D).** Reuse the gate **helpers** from `cover-gates.mjs`, never
  the all-gates-green stop; `suiteGreen` is never applied to spec-driven reds; the mutation pass runs over the
  **green subset** only. Unchanged.
- **Mutation kill is the only acceptance gate; coverage is informational.**
- **All harness agents run on Sonnet** (owner directive — every `agent()` gets `model: 'sonnet'`).
- **Workflow runtime contract.** No `import`/`fs`/`Date`/`Math.random`; `meta` is a pure literal; agents do all
  I/O; `args` parsed both JSON-string and object. Pure helpers in `harness/lib/*.mjs` (unit-tested) are
  **inlined verbatim** into the workflow — Step 2 touches **both** copies of the shared `spec-diff` functions
  and adds an **automated sync guard** (a manual byte-for-byte read is not a control).
- **Runner results + reports land nexus-side, git-ignored** (`harness/.runs/`), never in the KG tree.
- **No KG git writes from the pipeline.** The live arms require a KG checkout — **operator-owed** (Steps 4–5).

## Implementation Steps

### Step 1 — Re-ground AC-6 to committed two-SHA arms; supersede the Inc-1 dirty-tree runbook
Update `harness/targets/generatedsqlvalidator-l272-fixture.json` so the two arms are the **committed SHAs**
(`preFixArm: "9e40d1f"`, `patchedArm: "0811132"` — the explicit SHA, **not** "HEAD"). Remove any `git stash`
assumption. Add a short note (in the fixture `_note`) that the Inc-1 plan Step 7 dirty-tree runbook is
**superseded** (the fix is committed; the validator file is clean) and that the finding is referenced by
**symbol** (`NoStrayLiteralThreshold`), line qualified "(L272 at `9e40d1f`; L276 at `0811132`)".
- **Skill:** None — **TDD:** no — **Satisfies:** AC-3 — **Confidence:** high (verified against KG git, 2026-06-30)
- **Accept:** the fixture target names the two committed SHAs; no `git stash` dependency remains; no assertion
  is keyed to a bare line number (`272`/`276` appear only in the symbol-qualified parenthetical).

### Step 2 — Generalize `ruleOrder` + identity + `okValue` into per-target config; add the sync guard (ADR-E)
Three coupled changes to remove the single-validator lock, plus a drift guard:

**(a) Pass-sentinel `okValue` (the load-bearing fix — HIGH-1).** `labelRed`'s case-3 (sin-of-omission) and
case-4 (over-rejection) currently compare against literal `null` (`spec-diff.mjs:205,215`). Add an `okValue`
parameter (default `null`); compare against it so a non-`null` pass value (Slack's `"Valid"`) is handled. Today
the workflow passes `o.actual ?? null` into the labeler (`:571`) — thread `okValue` the same way and stop
collapsing the pass value. ADR-E names this axis.

**(b) `ruleOrder` out of the run-path (HIGH-2).** Move the SQL 7-rule order into
`harness/targets/generatedsqlvalidator.json` (it already carries a `ruleOrder` field — use it as the source of
truth). The labeler already takes `ruleOrder` as a param; the gap is the **workflow** hardcoding
`ruleOrder: RULE_ORDER` at `:571` and the spec-load prompt enumerating the 7 SQL names inline at `:415-417` —
source **both** from `_args`/config. Rewrite the `spec-diff.test.mjs` "order matches source" test to assert
**the JSON's** order (not a lib constant), so "SQL cases pass" stays true *by sourcing the order from config*,
not by keeping a lib constant the AC-1 grep forbids.

**(c) Identity is the value name** — already true for strings; confirm the enum value name flows through
unchanged (the runner records `actual` as the enum value name per schema `:381`).

**(d) Inline-copy sync guard (MED-3).** Add a cheap offline check that the shared `spec-diff` functions inlined
in `spec-cover.workflow.js` are string-identical to `harness/lib/spec-diff.mjs` (extract both blocks, assert
equality) — wire it into `scripts/selfcheck.mjs` or a unit test in the CI glob. This replaces the "keep in
sync" prose with an enforced control.

Files: `harness/lib/spec-diff.mjs`, `harness/spec-cover.workflow.js`, `harness/targets/generatedsqlvalidator.json`,
`tests/unit/spec-diff.test.mjs`, **`tests/unit/spec-cover-workflow.test.mjs`** (it sandboxes the workflow Step 2
edits — MED-4), and the sync-guard wiring.
- **Skill:** None — **TDD:** yes — **Satisfies:** AC-1, AC-2, AC-6; ADR-E — **Confidence:** medium (the labeler
  is proven; the `okValue` axis, the second rule-order, and the run-path threading are the new surface)
- **Accept:**
  - `spec-diff.test.mjs`: a Slack **over-rejection** (`expected: "Valid"`, `actual: "TimestampOutOfRange"`,
    `okValue: "Valid"`, Slack order) → `over-rejection`/candidate-bug; a Slack **sin-of-omission**
    (`expected: "InvalidSignature"`, `actual: "Valid"`) → `sin-of-omission`/candidate-bug; the "order matches
    source" test asserts the **JSON** order; all pre-existing SQL cases pass (sourcing the SQL order from config).
  - `spec-cover-workflow.test.mjs`: a Slack-args sandbox case (runner fixture `expected: "Valid"`,
    `actual: "TimestampOutOfRange"`, the 5-value Slack `ruleOrder`, `okValue: "Valid"`) asserts the
    over-rejection reaches the **candidate-bug queue** — the workflow-level (run-path) proof for AC-1/AC-2.
  - a grep shows `spec-cover.workflow.js:~571` selects `ruleOrder`/`okValue` from `_args`/config (no hardcoded
    `RULE_ORDER`); the spec-load prompt's rule-name set is config-sourced.
  - the inline-copy sync check passes and fails loudly if the two `spec-diff` blocks diverge.

### Step 3 — `SlackSignatureVerifier` target config
Create `harness/targets/slacksignatureverifier.json` mirroring `generatedsqlvalidator.json`: the source path
(`…\Features\Slack\SlackSignatureVerifier.cs`), an **own** isolated-assembly target
(`KnowledgeGateway.SpecHarness.Slack.Tests`, referencing the KG product project, **never**
`KnowledgeGateway.Tests`, and **separate** from the SQL spec-harness assembly so a Slack `dotnet test` does not
pick up SQL spec tests — OQ-1), the golden ids **GOLD-13…GOLD-18 (ids only, no rule text)** with the
sequestration `_note`, the per-target **ruleOrder** = the 5 enum values in precedence order (GOLD-18), and
**`okValue: "Valid"`**. The spec-load `expectedOutcome` for a conforming-pass Slack rule is recorded as the
string `"Valid"` (parallel to SQL's `"null"`), consumed by the labeler as the `okValue` (Gap: pass
representation). Confirm the id range + source path against `D:\src\knowledge-gateway\docs\audit\golden-set.md`
(already verified: GOLD-13…18, denominator 6) and live `SlackSignatureVerifier.cs` before pinning.
- **Skill:** None — **TDD:** no — **Satisfies:** AC-4; ADR-C, ADR-E — **Confidence:** high (ids + shape verified)
- **Accept:** target config created with GOLD-13…18 ids only + the sequestration `_note` + the 5-value
  ruleOrder + `okValue: "Valid"`; an **own** isolated assembly distinct from the SQL one; the source path
  resolves against live KG; the golden path is **not** embedded in the config (the spec-load agent reads it).

### Step 4 — Live two-arm AC-6 run on `GeneratedSqlValidator` (operator-owed)
Run `spec-cover.workflow.js` **live** against both committed arms. **OPERATOR ACTION REQUIRED** (the live .NET
toolchain + the KG checkout are outside the pipeline's no-KG-git-writes boundary). The developer's deliverable
is the **runbook** in `implementation.md` + the wired workflow; the operator executes and the results land in
`.runs/`. Use the **surgical per-file checkout** (keeps all the workflow's KG-derived paths — `SRC`,
`PRODUCT_PROJECT`, `ISOLATED_ASSEMBLY`, `SPEC_TESTS`, `TEST_PROJECT_DIR` — valid; a `git worktree` arm would
require repointing **all** of them or the suite silently builds against the patched product, MED-5):
- **Pre-fix arm:** `git -C D:\src\knowledge-gateway checkout 9e40d1f -- <validator path>` → **arm-sanity:** the
  runner confirms the SUT file contains `> 0.01` and **not** `> 0.01 + 1e-9` before recording → run the
  workflow → expect the case-4 over-rejection red with `actual === "NoStrayLiteralThreshold"`.
- **Restore:** `git -C D:\src\knowledge-gateway checkout 0811132 -- <validator path>` (the patched arm) →
  arm-sanity confirms `> 0.01 + 1e-9` → run the workflow → the known-answer input `|0.86 - 0.85|` test is
  **green**.
Pin the known-answer SQL fixture so **only Rule 5 can fire** (single SELECT over a pre-computed stats table —
exempt from Rule 6, not a large detail table so Rule 7 stays silent; schema-qualified `public.*`, no category
trigger, no `CURRENT_DATE`/`now()`, a resolved threshold + a literal exactly at tolerance) — carry the Inc-1
fixture construction forward verbatim. Boundary-band reds on the patched arm (golden encodes `> 0.01`, fix is
`> 0.01 + 1e-9`) are **expected divergence** → `needs-triage`, not counted against AC-3.
- **Skill:** None — **TDD:** no — **Satisfies:** AC-3 — **Confidence:** medium (offline-proven in Inc-1; first
  live execution — environment-dependent)
- **Accept:** `.runs/` holds a live pre-fix report with the candidate bug `actual ===
  "NoStrayLiteralThreshold"` (arm-sanity recorded `> 0.01`) and a live patched report with the known-answer
  input green (arm-sanity recorded `+ 1e-9`). A plan-sanctioned operator fallback that fires is `Deviated
  (valid reason)` at done-check; the open production gate (live toolchain) is surfaced as operator-owed, not
  Missing.

### Step 5 — Live validation run on `SlackSignatureVerifier` (operator-owed — generalization proof)
Run the **generalized** front-end **live** on the Slack target (Step 3 config): spec-load GOLD-13…18 → locate
(attestation-first) → spec-Cover into the **own** isolated assembly (each test asserts `Verify(...)`'s expected
`SignatureVerificationResult`) → distinct runner agent: `dotnet test` ×2 + Stryker over the green subset →
3-axis diff (**spec-only** — no `codeRules` this increment) + FP-labeler with the **Slack** `ruleOrder` +
`okValue: "Valid"`. **OPERATOR ACTION REQUIRED** (same boundary as Step 4) — runbook in `implementation.md`;
results to `.runs/`. This is the load-bearing generalization proof: a **different validator, enum return,
non-`null` pass-sentinel, different ruleOrder**, through the same front-end **with no code edits beyond Step 2's
config-driving** (record this explicitly — it is the AC-1/AC-2 live evidence). *Optional enhancement (named,
not required):* feed a `SlackSignatureVerifier` mine-verify run's `consensusRules` as `_args.codeRules` to
populate the `code ∧ ¬spec` / `both-divergent` axes (e.g. GOLD-13's exclusive-boundary window vs code) — out of
scope unless the operator opts in.
- **Skill:** None — **TDD:** no — **Satisfies:** AC-2, AC-4 — **Confidence:** medium (clean first-violation-wins
  shape, trivially-constructable fixtures per the KG scan; first live run on this class)
- **Accept:** `.runs/` holds a live Slack report with a green-subset mutation score **≥ floor**, a diff with
  **every GOLD-13…18 rule in exactly one axis** (spec-only), and labeled reds (if any) keyed off the enum value
  names with `okValue: "Valid"` applied. The run completed with **no** edit to
  `spec-cover.workflow.js`/`spec-diff.mjs` beyond Step 2 (config + ruleOrder + okValue drove it) — recorded as
  the AC-1/AC-2 evidence.

### Step 6 — Cross-class validation report + Increment-3 readiness verdict
Write `docs/specs/adhoc-SpecDrivenCoverValidate/delivery/validation-report.md` (committed) consolidating both
live runs. Per class: did the live run reproduce/produce the expected finding (L272 for SQL; the spec-only diff
for Slack); did the generalization hold (Slack ran on config alone — y/n); the **false-positive rate** (reds →
real vs artifact after the labeler + triage); and any **Inc-3 blockers**. End with the explicit verdict: **is
the spec-driven direction ready to graduate to a skill (Inc-3, as a second front-end in `mine-verify-cover`),
or what remains** (e.g. arbitrary validator shapes, the Slack code-derived axis, retrieval). Raw run outputs
stay in `.runs/` (git-ignored); the report is the committed synthesis.
- **Skill:** None — **TDD:** no — **Satisfies:** AC-5 — **Confidence:** high (synthesis of Steps 4–5)
- **Accept:** `validation-report.md` exists with the four per-class fields + the Inc-3 verdict; it cites the
  `.runs/` evidence files; it names any blocker as an Inc-3 scope item (not a silent gap).

## Migration Notes

None. No schema, no DI, no plugin packaging this increment.

## Testing Strategy

- **Unit (developer-ownable, offline):** `tests/unit/spec-diff.test.mjs` extended with the Slack `ruleOrder` +
  the `okValue: "Valid"` over-rejection/sin-of-omission cases; `tests/unit/spec-cover-workflow.test.mjs`
  extended with the Slack-args sandbox case (run-path proof); the inline-copy **sync check** (Step 2d). All run
  in the CI glob (`node --test tests/unit/*.test.mjs`) + `scripts/selfcheck.mjs`.
- **Live (operator-owed):** the two AC-6 arms (Step 4, with arm-sanity) and the Slack end-to-end run (Step 5) —
  real `dotnet test` + Stryker, results captured to `.runs/` and synthesized in the report. These are the
  acceptance evidence for AC-3/AC-4 and cannot be proven offline (the Inc-1 gap this increment closes).

## KB Impact

None this increment. The deliverables are the diff + candidate-bug reports (the spec-driven direction's output),
which live nexus-side in `.runs/` + the committed validation report — not `docs/kb/` entries. (Producing a
verified-rule KB entry is the **mine-verify** direction's job, not this validation pass.)

## Review mode

**Code-grounded critic — MANDATORY** (shared `harness/**` change; AC-3 rests on a **known-answer / negative
assertion** over live git; Step 2 edits the shared labeler in two synced copies). A doc-conformance pass is
structurally blind here. The critic must read the live `spec-diff.mjs` + `spec-cover.workflow.js` + the new
target config, run KG `git` itself (confirm `9e40d1f` has `> 0.01` and `0811132` has `> 0.01 + 1e-9`), and
re-verify: (a) `labelRed`'s case-3/case-4 compare against the per-target `okValue`, and the Step-2 tests
exercise the `Valid` sentinel (not the `null` path); (b) the run-path is config-driven — `:571` + the spec-load
prompt no longer hardcode the SQL order; (c) the inline-copy sync guard exists and trips on divergence; (d) the
AC-6 runbook is reproducible from the two committed SHAs with arm-sanity, no dirty-tree/worktree-path hazard;
(e) `git status` shows no `plugins/**` change. Mode 2 against AC-1…AC-6 + ADR-E. (This plan was already revised
once against a code-grounded critic — see `## Plan Review` below; the developer-phase critic re-verifies the folds.)

## Out of scope (do not let the increment sprawl)

Skill packaging + plugin bump (Inc-3); arbitrary validator shapes beyond first-violation-wins (Inc-3 design);
the Slack code-derived (mine-verify) run / its diff axes (optional, Step 5); embedding retrieval (D1); automated
spec-source extraction (D4); multi-class/domain sweep; equivalent-mutant detector (inherited from the Cover
engine); coverage as a gate; any change to the code-derived harness's behavior.

## Open Questions

None blocking. Resolved during planning: the scope forks (validate-then-graduate; second front-end in
`mine-verify-cover`), the second target (`SlackSignatureVerifier`), the AC-6 arms (committed SHAs), the
pass-sentinel mechanism (`okValue` config axis), and the Slack diff scope (spec-only). OQ-1 (a shared vs own
isolated assembly) is resolved to **own** assembly in Step 3. ADR-E is the architect's call within the
technical-branch mandate, recorded for extraction on completion.

## Plan Review (critic — code-grounded, MANDATORY, 2026-06-30)

A `nexus:critic` ran the mandatory code-grounded Mode-2 pass (read the live `harness/` libs + tests, live KG
`SlackSignatureVerifier.cs` + golden set, and ran KG `git` itself). **Verdict: REVISE → all 7 findings folded;
no surviving CRITICAL; no settled fork changed.** It confirmed against source/git: `9e40d1f` carries `> 0.01`
(L272), `0811132` carries `> 0.01 + 1e-9` (L276) and is `9e40d1f`'s child; `labelRed` already takes `ruleOrder`
but the workflow hardcodes it at `:571`; the inlined `spec-diff` copy + the inline SQL spec-load names exist;
Slack is first-violation-wins/enum with the pinned 5-value precedence; GOLD-13…18 = Slack. Dispositions:

| Finding | Sev | Disposition |
|---------|-----|-------------|
| Slack pass-sentinel is `Valid`, not `null`; `labelRed` case-3/4 hardcode `null` → the two key cases mislabel to `unrecognized-rule`/needs-triage; the Step-2 test used `expected: null` and passes against unchanged code | HIGH | **Fixed** — ADR-E adds the `okValue` axis; Step 2(a) compares case-3/4 against per-target `okValue`; AC-2 + Step-2 tests now require `expected:"Valid"` over-rejection + `actual:"Valid"` sin-of-omission cases. |
| AC-1 grep contradicted "SQL cases unchanged" and was blind to the workflow run-path (`:571`, spec-load prompt) | HIGH | **Fixed** — Step 2(b): SQL order moves into `generatedsqlvalidator.json`, the "order matches source" test asserts the JSON, AC-1 mechanism extended to assert the workflow + spec-load prompt are config-sourced. |
| No step supplies Slack `codeRules` → diff is spec-only; AC-4 "populated 3-axis" overstated | MED | **Fixed** — Slack diff scoped **spec-only** (Scope + Step 5 + AC-4 wording "every rule in exactly one axis"); a Slack mine-verify→`codeRules` run named as optional enhancement. |
| "Patched arm = HEAD `0811132`" stale — HEAD is `337c0537` | MED | **Fixed** — pinned to explicit SHA `0811132` everywhere; "HEAD" gloss dropped; the moving-handle hazard noted. |
| Inlined `spec-diff.mjs` copy has no automated sync guard | MED | **Fixed** — Step 2(d) adds an offline string-equality check (selfcheck/unit test) + AC-6 acceptance line. |
| Step 2 omitted `spec-cover-workflow.test.mjs`; no workflow-level enum proof | MED | **Fixed** — added to Step 2 files + a required Slack-args sandbox case (run-path proof for AC-1/AC-2). |
| Worktree pre-fix runbook underspecified which KG paths repoint → silent wrong-arm | MED | **Fixed** — Step 4 prescribes the **surgical per-file checkout** (all paths stay valid) + an **arm-sanity** assertion (SUT contains `> 0.01`, not `+ 1e-9`, before trusting the result). |
| Gap: Slack `expectedOutcome` representation (`"null"` vs `"Valid"`) | GAP | **Fixed** — Step 3 records the Slack pass as `"Valid"`, consumed as `okValue`. |
| OQ: shared vs own isolated assembly for the two classes | OQ | **Resolved** — Step 3 gives Slack its **own** isolated assembly. |
