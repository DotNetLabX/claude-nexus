# Lessons — adhoc-SddCoverageLoop

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [ROUTED-TO-PROPOSAL] resumed-agent absent-agent_type verify-skip gap → docs/proposals/session-scoped-pipeline-state-2026-07.md. [TRACKED] harness-inline-helper skill candidate (2 instances, borderline — held below threshold).

## Architect Lessons

- **Don't build composition/reuse claims from a harness's self-description.** The first tech-spec drew its
  "spec-cover just needs retargeting" thesis from file headers, ADR labels, and the loop-diagram vocabulary —
  a code-grounded critic caught a CRITICAL (spec-cover is validator-shaped; the pilot target is a numeric
  calculator, so the spec-load prompt / test model / runner schema / FP-labeler don't transfer) + 5 HIGH.
  Trace the actual agent prompts, return schemas, and the target class's real API before claiming reuse.
- **For a spec-vs-code diff, verify the JOIN KEY exists.** `spec-diff.mjs` matches rules by NAME. Two *blind*
  arms with different id spaces (code arm `BR-N`, spec arm authored names) never intersect → `both-agree` is
  empty by construction and `code∧¬spec` is falsely inflated. A comparison harness needs an explicit
  rule-identity reconciliation (a post-hoc crosswalk applied *outside* the blind runs, to preserve
  independence) whenever the two sides don't already share a canonical name space. This was the plan's
  near-critical gap.
- **"Passes the contract test" is a real acceptance only if the new file is REGISTERED.**
  `workflow-contract.test.mjs` is a hard-coded registry, not a globber — a new workflow is tested by nothing
  until added. An acceptance criterion that reads as green while testing nothing is a false-green trap; the
  plan step must include the registry edit.
- **Operator-owed must cite the durable bar, not the tool surface.** "Steps need the Workflow tool the
  developer lacks" was wrong (the developer has all tools). The durable, correct reasons a live harness run is
  operator-owed: the consuming-project working-tree git write the developer is barred from, the live toolchain,
  and the isolated worktrees.
- **A code-grounded critic earns its cost on shared/harness artifacts.** Two passes (tech-spec, plan) each
  returned 1 near-critical + several HIGH that a doc-only pass would have missed — every finding rested on
  reading the live harness, not the doc. Worth the ~8 min each on this class of work.
- **A clean-room acceptance clause must not name a code type as the field source.** Step 1's "names the target
  field of `BugRatioMultiSprintData`/`…SingleSprintData`" reads as sanctioning the exact-C#-member read that
  the same step's clean-room directive forbids — the developer (correctly) stopped on the contradiction (Q1).
  In a blind-arm design, the oracle names the **intent/conceptual** field (from prose); the exact member is
  bound later by the arm that legitimately reads code (here the spec-cover test-writer at live-run). When
  writing acceptance for a clean-room step, phrase every field/identity as intent-derived and name where the
  code binding happens on the *other* side of the blind line — never let a return-type name sit in the
  clean-room step's acceptance. (Provenance: [adhoc-SddCoverageLoop])
- **Answering a developer question can't edit `plan.md` mid-phase — the pipeline gate blocks it.** A Q-answer
  that implies a plan wording change must record the edit as *owed* (flagged to the team lead for the next
  plan-writable pass), not assert it as done; the gate correctly refuses `plan.md` writes during the
  analyze/answer phase. The answer in questions.md is binding regardless of when the plan text catches up.
  (Provenance: [adhoc-SddCoverageLoop])
- **A plan that names a specific code structure ("add it to both shared loops") must verify that structure
  exists on disk at plan-time — a cited structure is a deferred read.** Step 3 told the developer to register
  the new workflow in "both shared loops (meta-purity + no-static-import)," but only meta-purity is a genuine
  `for`-loop registry in `workflow-contract.test.mjs`; no-static-import is a per-workflow `test()` convention
  (3 of 7 workflows lack it entirely). The developer had to reconcile the instruction against reality and
  followed the closest precedent — a clean, low-cost outcome here, but the plan asserted a codebase shape it
  hadn't confirmed. When a plan step cites an exact code structure the developer must edit, grep it at
  plan-time and describe what's actually there; don't assert a symmetry the file doesn't have. (Provenance:
  [adhoc-SddCoverageLoop])

## Developer Lessons

- **Clean-room authoring imposes a hard Phase-2 ordering.** Step 1 (author `spec-rules-bugratio.md`) forbids
  reading `golden-set.md`, the code-mined KB, or `BugRatioAnalyzer.cs`. But later steps legitimately need
  those: Step 5's tripwire mirrors `golden-set.md:9-23`, Step 9 cites `golden-set.md:25,47-48`, and the code
  arm reads the `.cs`. So Step 1 MUST be authored and closed **before** any golden-set / `.cs` read — the
  sanctioned Step-1 source is the Fokus prose only (`D:\src\fokus\docs\kb\analytics\bug-ratio.md`,
  `…\domain\ticket.md`). During analysis I read only the Fokus prose + file *existence* of the sequestered
  sources, never their rule content, to preserve the clean room. Sequence Phase 2 as: Step 1 → then Steps
  2–5/7 (which may touch the golden-set placement region). (Provenance: [adhoc-SddCoverageLoop])
- **The workflow-contract guard is a hard-coded registry, confirmed on disk.** `workflow-contract.test.mjs`
  registers workflows in two places: the meta-purity **loop** (`:1544`, an inline `[[name, PATH],…]` array)
  and a per-workflow **no-static-import** test (e.g. spec-cover at `:1551`). A new workflow is tested by
  nothing until BOTH are added + a path const declared (`:33` pattern). Step 3's "registered AND passes" is
  real only after those three edits. (Provenance: [adhoc-SddCoverageLoop])
- **`selfcheck.mjs`'s inline-copy sync check is single-lib/single-workflow today** (`:92-93` reads one lib +
  one workflow; `SHARED_FNS` at `:132`). Step 3 (adding `spec-cover-calc.workflow.js` + `spec-diff-calc.mjs`)
  needs it generalized to multiple `(lib, workflow, fn-list)` tuples, not a second copy-paste block.
  (Provenance: [adhoc-SddCoverageLoop])
- **`workflow-contract.test.mjs`'s "no-static-import" registration is per-workflow convention, not a shared
  loop, despite reading like one.** Only the meta-purity check (`:1544`) is a genuine `for` loop; "no static
  import" is individual `test()` calls that exist for `mine-verify`/`cover`/`loop`/`spec-cover` but NOT for
  `cover-flutter`/`cover-cpp`/`loop-flutter`. A plan step that says "add it to both shared loops" should be
  read as intent (every registered workflow gets both checks), verified against the live file rather than
  assumed — the actual registry shape can lag a plan author's mental model of it. (Provenance:
  [adhoc-SddCoverageLoop])
- **A "pure transform, no mutation" test needs a real deep-clone, not `JSON.parse(JSON.stringify(x))`.** That
  round-trip silently DROPS object keys whose value is `undefined` — so a before/after snapshot comparison on
  a fixture carrying `field: undefined` false-fails even when the code under test never touched the object.
  Use `structuredClone` (preserves `undefined`-valued keys) for immutability-proof snapshots, or avoid explicit
  `undefined` fields in the fixture. Caught via the debugging discipline (confirm which side is wrong before
  changing anything) rather than reflexively "fixing" the test to pass. (Provenance: [adhoc-SddCoverageLoop])

## Reviewer Lessons

- **A byte-diff against the immediate precedent (not just the ur-source lib) resolves "is this drift new"
  faster than re-deriving intent from comments.** `spec-cover-calc.workflow.js`'s inlined `cover-gates.mjs`
  copy had already cosmetically diverged from `harness/lib/cover-gates.mjs` (reformatting, a reworded error
  string) before I could tell whether the developer introduced it. Diffing the new inline copy against
  `spec-cover.workflow.js`'s own pre-existing inline copy (byte-identical) — rather than only against the
  canonical lib — proved in one command that zero new drift was introduced; the divergence from the lib
  predates this feature entirely. When a carry-over finding claims "pre-existing, not introduced by this
  feature," verify against the nearest sibling copy, not just the ultimate source of truth. (Provenance:
  [adhoc-SddCoverageLoop])
- **Boundary-value gaps can be genuine test-coverage findings even when the implementation is verified
  correct.** `spec-diff-calc.mjs`'s `<= eps` and `trace-join.mjs`'s `>= threshold` both lacked a test at the
  exact boundary value (only comfortably-inside/outside cases were covered). I confirmed both behave correctly
  via direct one-line `node --input-type=module -e` execution before filing — the review checklist's "boundary
  tests for threshold logic" item catches real coverage gaps independent of whether the underlying logic has a
  bug, and direct execution is the fastest way to separate "coverage gap" from "live bug" without writing a
  throwaway test file. (Provenance: [adhoc-SddCoverageLoop])
- **A Codex parallel cross-check NO-GO needs the same finding-by-finding reconciliation against live plan
  text as any other claim — a stated verdict is not evidence.** `review-codex.md` returned NO-GO citing
  Step 9's missing pilot report and Step 5's independence check as "not wired into a run path." Both findings
  judge the delivery against a bar `plan.md` explicitly does not set: Steps 6/8/9 are headed `Owner: operator`
  verbatim in the plan text, with a dedicated Owner Split section explaining why (consuming-tree git write,
  live toolchain, isolated worktrees — none available to the developer); Step 5's file list has an explicit
  parenthetical marking the selfcheck wiring "developer's call," not a mandate. Re-grepping `plan.md` itself
  (not implementation.md's paraphrase of it) settled the disagreement in under a minute. Matches the existing
  "Codex reviewer fabricates schema" pattern from a prior feature (MEMORY.md) — the fix is the same: reconcile
  finding-by-finding against the live source-of-truth document, never accept or dismiss a cross-check verdict
  on its face. (Provenance: [adhoc-SddCoverageLoop])
- **A resolved-finding re-review still needs live-source re-verification, not a trust of the fix-cycle
  description.** The team lead's resume message described both fixes accurately (boundary tests added, lib
  files unchanged, counts updated), but I re-read the lib files directly (confirmed byte-for-byte `<=`/`>=`
  unchanged) and re-ran the full suite + both individual test files fresh rather than accepting the message's
  claim — cheap (under a minute) and is what actually makes the re-review's evidence rows honest per the
  Verdict Gate's "verified the fix" requirement, not a restatement of what the developer said they did.
  (Provenance: [adhoc-SddCoverageLoop])

## Skill Gaps

- **No skill covers "build a deterministic harness helper module + its inline-copy sync guard."** Plan's own
  Skill Mapping marks Steps 2/3/4/5/7/8 `Skill: (none)` with an explicit `Gap?: Log to lessons` flag — this
  whole feature (a pure-function labeler/comparator, a Workflow-runtime orchestrator that inlines sibling
  helpers verbatim because the runtime forbids `import`, a selfcheck sync guard proving the inline copies stay
  byte-identical to their source-of-truth libs) is a recurring SHAPE across this nexus dev-repo's `harness/`
  work (`spec-diff.mjs`↔`spec-cover.workflow.js` already existed before this feature; this feature adds a
  SECOND instance of the exact same shape: `spec-diff-calc.mjs`↔`spec-cover-calc.workflow.js`). A candidate
  skill — "harness-inline-helper" or similar — would codify: (a) the pure-function-module pattern (no fs, no
  LLM, `node --test`-unit-tested), (b) the verbatim-inline-in-Workflow requirement + why (no static import in
  the Workflow runtime), (c) the selfcheck sync-guard pattern generalized to a `(lib, workflow, fn-list)[]`
  registry (this feature's Step 3 had to GENERALIZE an existing single-pair check — a skill could ship the
  generalized shape from the start). Coverage: 2 confirmed instances now (`spec-diff`/`spec-cover` pair,
  `spec-diff-calc`/`spec-cover-calc` pair) — below the 2-occurrence promotion bar is borderline-met; worth
  raising to the learner. References: `harness/lib/spec-diff.mjs`, `harness/spec-cover.workflow.js`,
  `harness/lib/spec-diff-calc.mjs`, `harness/spec-cover-calc.workflow.js`, `scripts/selfcheck.mjs` (the
  generalized "spec-diff inline-copy sync" check). (Provenance: [adhoc-SddCoverageLoop])
- **No skill covers "mutually-blind comparison harness" primitives** — the trace-join (`traceRule`
  priority-source resolver), the independence tripwire (`checkManifest`/`checkIndependence`, fail-closed
  manifest disjointness), and the rule-identity crosswalk (`applyCrosswalk`/`reconcileRuleSets`, post-hoc
  reconciliation of two differently-keyed id spaces) are three genuinely novel, small, well-tested pure-helper
  patterns this feature had to invent from the tech-spec's design intent alone (no existing skill or codebase
  precedent to copy). Single-occurrence so far (this feature is the first of its kind in the repo) — below the
  2-occurrence promotion bar; flagging for awareness, not yet ripe for a skill. References:
  `harness/lib/trace-join.mjs`, `harness/lib/independence-check.mjs`, `harness/lib/rule-crosswalk.mjs`.
  (Provenance: [adhoc-SddCoverageLoop])
