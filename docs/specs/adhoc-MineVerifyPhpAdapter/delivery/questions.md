# Mine→Verify→Cover — PHP adapter — Questions

## Q1: Implementation-pass scope given the Workflow-tool / live-spend boundary
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Phase 1 analysis (pre-implementation)
**File:** —

**Context:**
The plan is verified end-to-end — every referenced file exists, every cited line
reference is accurate (COVER_CPP_PATH :28, loop list :1554, cover-cpp slice
:1498-1518, gen-omni.test.mjs seed :30-31 / deepEqual :55, gen-omni.mjs mirrorDir
:95-96, marketplace.json :24, core-skill four sites :21/:296-302/:326/:409-411),
Docker is available (28.5.1), both target-repo classes exist, and target #2's five
imports match critic H-3 exactly. No pattern is missing.

The one structural issue: the plan's critical path runs through tooling a developer
subagent does not have.
- **Steps 2, 6, 7** require running `harness/mine-verify.workflow.js` and
  `harness/cover-php.workflow.js` via the nexus **Workflow runtime** (spawns
  miner/skeptic/Cover/runner LLM agents = live token spend). That runtime is **not in
  my toolset** (confirmed — the only "workflow"-shaped tool available is the Chrome
  extension's `shortcuts_execute`, which is unrelated). The plan already labels each of
  these **"Owner: operator"**, and Step 2 explicitly reads "Workflow tool — not
  available to a developer subagent."
- **Step 8** (ship `nexus-php`) is explicitly **gated on Step 7's live-run GO**, and its
  SKILL.md must bake in the **Step-1 probe-observed** JSON map (critic L-2) plus the
  **live-run lessons** from Steps 6–7 — so Step 8 cannot be authored faithfully before
  those runs happen.
- **Step 9** (close-out) reports run outcomes and so also follows the runs.

What a developer pass *can* cover — the deterministic/offline block:
- **Step 1** — author `harness/php/` assets (Dockerfile, composer/phpunit/infection
  templates) AND run the Docker probe via Bash (Docker is present), producing
  `probe-report.md` with the **observed** Infection JSON keys.
- **Step 3** — author `harness/cover-php.workflow.js` as the thin fork (gate battery
  verbatim; translation function written against Step-1's observed keys).
- **Step 4** — author `harness/php/cover-php-contract.md`.
- **Step 5** — extend `tests/unit/workflow-contract.test.mjs` at the three sites and run
  `node --test` (offline, no spend).

Note the intra-block dependency: Steps 3 and 5 both need the **real** Infection JSON
shape, which only Step 1's *run* produces. If Docker network access (pulling
`php:8.4-cli`, `composer install` from packagist) is unavailable at build time, the
Step-1 run is blocked and Steps 3/5 would have to fall back to the research entry's
**inferred** keys — a plan-sanctioned deviation that would then require an operator
follow-up to re-observe and reconcile before Step 8.

**Question:**
Should this implementation pass execute the deterministic block **{1, 3, 4, 5}** now
(including running the Step-1 Docker probe) and then **STOP at a checkpoint** for the
operator to run the Workflow-driven Steps 2, 6, 7 — with Steps 8–9 (ship + close-out)
deferred to a later developer pass that resumes after the live runs? Or is a different
split intended (e.g. author-only Step 1 with no probe run; or author Step-8 file
skeletons now against inferred keys)?

**Recommendation:** Execute **{1, 3, 4, 5}** in this pass — author all `harness/php/`
assets, run the Step-1 Docker probe to capture observed JSON keys, author the thin-fork
`cover-php.workflow.js` and the contract against those observed keys, and extend + run
the offline guard. Then STOP and hand off to the operator for Steps 2/6/7 (Workflow +
live spend), with Steps 8–9 in a later resume once run outputs exist. Do NOT author
Step 8's SKILL.md now — it must carry the probe-observed map and live-run lessons the
plan (critic L-2) mandates, none of which exist until after the runs.
**Confidence:** high — this boundary is the plan's own design (Steps 2/6/7 are
explicitly operator-owned; Step 8 is gated on Step 7's GO; Step 8's SKILL.md is
required to be probe-observed/run-proven, not pre-committed). I am only asking the team
lead to confirm the split and the checkpoint placement, not inventing scope.

### Answer
**Decision (architect, owner-delegated): YES — the recommended split is correct. Execute
`{1, 3, 4, 5}` + the Step-1 Docker probe in this developer pass, then STOP at an operator
checkpoint. Defer `{2, 6, 7}` to the operator (Workflow + live spend), and `{8, 9}` to a later
developer resume once the run outputs exist.**

This is not a new scope call — it is the plan's own design, and the pass boundaries fall exactly
on the plan's ownership seams:

- **Operator batch = `{2, 6, 7}`.** All three are `Owner: operator` in the plan (Step 2:67,
  Step 6:92, Step 7:100), and Step 2 is annotated verbatim "Workflow tool — not available to a
  developer subagent." A developer subagent has no `Workflow`/`agent`/`parallel` primitive, so these
  cannot execute in-pipeline however the developer tries. They are operator-owed *by construction*,
  and they cluster cleanly: Step 2 (Mine→Verify #1) produces the KB Step 6 consumes; Step 7 carries
  its own Mine→Verify then Cover. One operator session, with the two spend gates (Steps 6 and 7)
  surfaced at their own checkpoints per the plan's Open Questions.

- **`{8, 9}` deferred to a post-run resume — do NOT author Step 8's SKILL.md now.** Step 8 is gated
  on Step 7's GO (plan:103), and its SKILL.md is *required* to carry the Step-1 probe-observed
  Infection map AND the live-run lessons — never the pre-commitment table (critic L-2, plan:107).
  None of that ground-truth exists until after the runs, so pre-authoring a skeleton against inferred
  keys would bake in exactly the stale guess L-2 was raised to prevent. Rejected. Step 9 reports the
  run outcomes and likewise follows.

- **This pass = `{1, 3, 4, 5}`, and the Step-1 probe must actually RUN.** The block is internally
  coherent and correctly ordered: Step 1's probe converts the research entry's *inferred* Infection
  JSON keys into *observed* ones (probe-report.md), and Step 3's translation seam + Step 5's runner
  fixtures are authored against those observed keys. Step 4 (the contract) is independent of the JSON
  shape and grounds Step 3's Cover-agent spec, so author it first within the block. "Author-only Step
  1, no probe" is rejected — the probe *run* is the entire reason Step 1 exists ("convert read-docs
  facts to ran-it facts", plan:62); skipping it forces Steps 3/5 onto inferred keys and buys an
  operator re-reconciliation before Step 8.

**One execution guard on the probe contingency (this is the only nuance beyond your recommendation).**
Docker is present (28.5.1), but the probe run also needs network to pull `php:8.4-cli` and run
`composer install` from Packagist. The plan's intent is emphatic that the Step-3 translation is
authored against *observed* keys, never inferred (Step 1 accept, plan:60; critic L-2). So:
- **Probe run succeeds →** proceed with `{3, 4, 5}` against the observed keys (the intended path).
- **Probe run is blocked (no network) →** author Step 1's *assets* (Dockerfile + templates + the
  workspace scaffold) and Step 4 (the contract, key-independent), then **STOP and surface the
  blocker** — do NOT author Step 3's translation function or Step 5's Infection-shaped fixtures
  against inferred keys as a silent fallback. Fold the probe run into the operator batch (which has
  the same host and will run Docker anyway for the Cover runs) and let the deferred `{3, 5}` work
  ride the observed keys from that run. A translation seam grounded in a guess is the one thing this
  plan's whole Step-1-first structure exists to avoid; better a clean STOP than shipped-then-reworked
  inferred code.

No plan edit is required — the plan already carries the per-step ownership annotations and gates
that this split honors; the pass boundaries are an execution-sequencing decision, not a change to
plan content.

**Confidence: high** — every boundary is the plan's own design (Steps 2/6/7 explicitly
operator-owned; Step 8 gated on Step 7 GO with a probe-observed/run-proven SKILL.md; Steps 3/5
authored against observed keys). The only judgment I added is the fail-closed guard on the probe
contingency, which follows directly from the plan's "observed, never inferred" mandate.

*Answered by architect (owner-delegated decision), 2026-07-07.*
