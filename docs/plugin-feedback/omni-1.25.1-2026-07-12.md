# Plugin Feedback — omni 1.25.1 (2026-07-12)

Source: learner consolidation of the `adhoc-MineVerifyFlows` pipeline (7 steps: fixture triage,
harness seeder upgrade, determinism spike on device+emulator, JSON golden scrubber gate, golden-gated
flow tests FL-8/FL-10). Lessons: `docs/specs/adhoc-MineVerifyFlows/delivery/lessons.md`; context in
`delivery/{spike-findings.md,review.md,implementation.md}` and `definition/tech-spec.md`. Recurrence
counts cross-referenced against the other `docs/specs/*/delivery/lessons.md`.

**Part A (Entries 1–4)** — agent/rule feedback (recurring pipeline-agent behaviour).
**Part B (Entries 5–10)** — graduation inputs for a *new* `mine-verify-flows` skill (method-level; the
Flutter-adapter half is in `omni-flutter-0.3.0-2026-07-12.md`). None of Part B is applied to this repo.

---

## Entry 1: a relayed / consensus / remembered fact is a claim to re-verify against live source

- **Suggested target:** `agents-workflow.md` (cross-cutting) — or the critic/architect/developer
  `## Anti-patterns` if a per-agent home is preferred. **Dedup first:** the mine-verify skeptic stages
  already encode a narrower version of this; this is the general-pipeline generalization, not a
  duplicate — fold, don't double-state.
- **Action:** add
- **Evidence:** adhoc-MineVerifyFlows (skeptic killed 2-of-3 confident citing miners' "off-shelf flow
  is live" — it's dead code; a relayed research fact licensed skipping a `tasks.json` seed that would
  have silently tested against no planogram), adhoc-CodebaseEvaluation ("fact-shape at the source, not
  skepticism at the end"), PD-5263-proportional-planogram ("'mirror function X' is a parity claim that
  must be code-verified, not a remembered name"; a golden path written from memory that `ls` disproves).
  **Recurrence 3x.**
- **Lesson:** a fact that is *relayed from another agent, backed by a consensus of citing sources, or
  recalled from memory* is a claim to re-execute against live source before a decision depends on it —
  especially when it licenses *skipping* a step ("no need to seed X"), because that error direction is
  invisible at authoring time (the test still passes). Re-executed evidence, not citation count, is
  ground truth. A parity/"mirrors X" claim is byte-checkable — check the bytes (grep the cited body,
  diff the arithmetic); a cited path is `ls`-checkable — check it.

## Entry 2: invoke the Skill tool every time a step maps to a skill — the log is the only proof

- **Suggested target:** `developer.md ## Anti-patterns` (the actor rule) + the architect/reviewer
  done-check protocol (the verification rule). **The log-scored skill-conformance gate itself needs no
  fix — it worked on first real application; this reinforces the actor-side and done-check-side rules
  the gate assumes.**
- **Action:** add
- **Evidence:** adhoc-MineVerifyFlows Step 6 (`tdd` self-reported in `## Skills Used`, absent from
  `.claude/audit/skill-invocations.log` — method applied from memory after a legitimate Step 4
  invocation), PD-5263-proportional-planogram Step 5 (`new-golden-test` self-reported, absent from the
  log). **Recurrence 2x.**
- **Lesson:** (actor) call the Skill tool *every* time a step maps to a skill, even one used minutes
  earlier in the same session — the log is the only thing distinguishing "invoked" from "remembered,"
  and "I already know this method" is exactly the situation the skill-first protocol exists to catch.
  (done-check) always diff the self-reported `## Skills Used` against `skill-invocations.log`, *even
  when the substance is verifiably good* — that is precisely when a false invocation claim slides
  through. A caught-and-corrected claim whose substance is independently verified is
  **Deviated-with-reason, not Fail** — the gate's job is truth in the record, not punishing good work
  done through the wrong channel. (Edge case observed: crash-resume across two runs can log the
  invocation under the run that *started* the step, not the one that finished it — scope the check to
  the step's whole run set, not a single run id.)

## Entry 3: the subagent no-output watchdog on long ops — one root cause, two facets

- **Suggested target:** `developer.md ## Anti-patterns` (also relevant to any implementer agent).
- **Action:** add — **relates to an already-Deferred item** in this project's `docs/skill-backlog.md`
  (2026-06-08, PD-5444).
- **Evidence:** one root cause (the 600s no-output watchdog kills subagents mid long-op), two
  different-in-kind facets — *not* two occurrences of the same phenomenon:
  - **Facet A — untrusted draft after a kill:** PD-5444-summary-lists (documented in that slug —
    developer instances killed mid-run left files with missing/unused imports; the surviving instance
    had to `flutter analyze` before trusting them).
  - **Facet B — watchdog root cause on long Flutter ops:** adhoc-MineVerifyFlows (the watchdog killed
    the integration-tester once mid-`flutter test`; evidenced by the in-session task-notification, not
    a slug artifact — this project mitigates it project-side via the new CLAUDE.md guardrail that runs
    long ops from the main session).
- **Lesson:** the 600s no-output watchdog kills subagents mid long-op — two consequences an implementer
  agent must handle: (A) on resume after a killed instance, treat any files the predecessor left on
  disk as an *untrusted draft* — run the analyzer / a build before assuming they compile or are
  complete; (B) prefer to run long ops (build_runner, full test suites, on-device drives) from the main
  session, and write evidence to the artifact incrementally as decisions land so a mid-run kill loses
  the least.

## Entry 4: ADR-18 — non-developer implementer agents need their own artifact, not implementation.md

- **Suggested target:** `ADR-18` (artifact ownership) + the boundary-detector's artifact-ownership map.
- **Action:** update (clarify the ownership map)
- **Evidence:** adhoc-MineVerifyFlows — the integration-tester wrote the developer-owned
  `implementation.md` in **every** round (11 boundary-detector hits in `.claude/audit/violations.log`
  across two device-days). Standing practice collided with the rule each round because a test-authoring
  agent had no artifact of its own. **Resolved by the project owner (2026-07-12): option (a).**
- **Lesson:** non-developer implementer agents (the integration-tester, and any future test-authoring
  agent) write `docs/specs/{slug}/delivery/test-implementation.md`, **never** `implementation.md`
  (which stays developer-only). Done-checks read both files where both exist. The boundary detector's
  artifact-ownership map should gain that mapping (`test-implementation.md` → test-author roles) so the
  legitimate write stops logging as a violation. (This project has already applied the local half — its
  `integration-tester.md` now names `test-implementation.md` as its artifact; the ADR/detector change
  is the plugin-side half.)

---

## Entry 5 (graduation → mine-verify-flows): gate calibration on ML output converges by class excision, not tolerance tuning

- **Suggested target:** new `mine-verify-flows` skill → gate-calibration section (method-level).
- **Action:** add (new skill)
- **Evidence:** adhoc-MineVerifyFlows (FL-8 report-stage gate; verify pairs 1–8).
- **Lesson:** for a gate over FFI/ML output documents, **start at semantic-only exact-match plus
  class-wide exclusions; treat per-field tolerances as the exception, not the default.** Every
  tolerance bound sampled from N verify runs was exceeded by run N+1 (a field's drift magnitude itself
  moved: `width` epsilon implied via `price_tags` → ±2 → ±3 across pairs); every *excluded class*
  stayed excluded. **Final FL-8 config to graduate as the worked example: semantic exact-match on
  ~189 leaf fields (SKUs, anchor ids, counts, KPIs, price-fixing audit trail) + class-wide exclusions
  for geometry/garbage classes via `**.`-suffix rules + a single per-field tolerance `**.sfr` ε 0.005.**
  (Do NOT graduate the determinism spike's provisional "exact-match, `FieldTolerance` ships unused"
  wording — that was true only for the ~140 SDK-stage files the spike actually produced; extending the
  flow into report-stage writes re-opened it and produced the two-tier answer above. The knob existing
  from day one is the design paying off, not the spike being wrong — see Entry 8.)
- **Design note:** `FieldTolerance` (value drifts within a bounded range) and `FieldExclusion` (shape
  varies run-to-run, or the field is uninitialized-memory garbage with no correct value) solve
  *different* problems; a length-mismatch on a shape-varying array short-circuits before any per-element
  tolerance runs, so tolerance on it still flakes. Diagnose which case a nondeterministic field is
  before reaching for a knob. Only exclude/tolerate fields with **observed** drift — never sibling
  fields "for safety."

## Entry 6 (graduation → mine-verify-flows): budget ~4 verify pairs for gate calibration per new output document

- **Suggested target:** new `mine-verify-flows` skill → cost/planning guidance.
- **Action:** add (new skill)
- **Evidence:** adhoc-MineVerifyFlows (four verify pairs produced four different drift surfaces:
  price_tags ±2 → products ±3 → shelf_width/section_id → rectCorners/svg_kpis.sfr).
- **Lesson:** one verify pair *samples* an ML output document's drift; it does not *bound* it. Budget
  ~4 pairs before the exclusion/tolerance set stabilizes for any newly-reached FFI output document.

## Entry 7 (graduation → mine-verify-flows): catalog match is necessary but not sufficient for FFI/entity-join flows

- **Suggested target:** new `mine-verify-flows` skill → fixture-strategy section (method-level; the
  Flutter-concrete instantiation is in the omni-flutter feedback file).
- **Action:** add (new skill)
- **Evidence:** adhoc-MineVerifyFlows fix cycles 2–3 (a field-recorded realogram with the right catalog
  but a different planogram *version* carried entity ids the seeded deployment lacked; the deployment-
  side `firstWhere` join threw).
- **Lesson:** before choosing "seed a pre-recorded output" as a flow test's fixture strategy, grep the
  flow's full call chain for **both** (a) any FFI call that operates on realogram/product data and
  (b) any `firstWhere`/entity-id join against deployment/planogram data. Either alone is disqualifying,
  and passing (a) does not imply passing (b): catalog match (same product *names*) is necessary but a
  realogram produced against a different planogram *version* still fails the id-space join. The only
  self-consistent state is state produced by processing frames against **this run's own configured
  planogram** — pre-recorded seeds are sound only for pure local-file flows with no FFI re-entry and no
  entity-id join (confirm by grepping the chain, not by a scan/non-scan label).

## Entry 8 (graduation → mine-verify-flows): a determinism/tolerance verdict is scoped to the files the flow actually produced

- **Suggested target:** new `mine-verify-flows` skill → determinism-spike section.
- **Action:** add (new skill)
- **Evidence:** adhoc-MineVerifyFlows (the spike closed OQ-1 as "exact-match, no tolerance" for the
  ~140 SDK-stage files it reached at `VideoProcessingSuccessState`; extending the flow into
  ConfirmSelection/Assistant report-stage writes found a real nondeterministic surface the spike never
  touched).
- **Lesson:** treat a determinism/tolerance verdict as scoped to an explicit **file/field inventory**,
  not to "the flow" as a whole. Every time a flow test's reach is extended (more screens, more blocs,
  more write sites), re-ask the determinism question for the newly-reached output — never assume an
  earlier spike answered it for output it never produced.

## Entry 9 (graduation → mine-verify-flows): a deferred smoke-test claim is only as good as its precision about which function/seam it covers

- **Suggested target:** new `mine-verify-flows` skill → verification/acceptance section.
- **Action:** add (new skill)
- **Evidence:** adhoc-MineVerifyFlows Step 6 (acceptance deferred the seeder smoke to "the Step 1/5
  device runs" — but Step 1 seeded frame bytes directly and never called `seedFieldOutputs()`, so a
  wrong-base asset-prefix constant sat unexercised through Step 6, its own sign-off, and the whole spike
  until a Step 5 bless run made the first real call).
- **Lesson:** when a plan step defers verification to "a later step," that later step's own plan/doc
  must name **which specific function/seam** finally gets its first real exercise — otherwise "some
  code in this file ran on a device" is mistaken for "the function I'm about to call for the first time
  has ever run." Pin composed asset-key/path constants with a host-side exact-string unit test (cheap,
  no device) rather than deferring their first exercise to a device day.

## Entry 10 (graduation → mine-verify-flows): recipe-shaping inputs from the pilot

- **Suggested target:** new `mine-verify-flows` skill → stage recipes.
- **Action:** add (new skill)
- **Evidence:** adhoc-MineVerifyFlows (pilot).
- **Lesson (bundle):**
  - **Cover-stage scrubber must smoke against real captured outputs, not synthetic tests only.** The
    scrubber passed 18 synthetic acceptance tests, then real field JSONs broke it twice within minutes
    (13-digit float fractions matched the epoch-millis pattern; base64 feature vectors matched the path
    pattern). Make "smoke the scrubber against a real captured output corpus" a mandatory Cover step.
  - **Fixture triage must run a catalog-overlap grep, not rank by frame-count/completeness alone.** A
    30-second `grep product_name … | grep -f snapshot-planograms` flipped the "best" fixture (an
    0/37-catalog-match RGT export lost to a 22-frame device export at 24/24 match). Add re-capturability
    as a triage dimension — a source the operator can re-scan on demand beats a bigger frozen archive.
  - **State intra-miner fan-out policy in the stage prompt.** A clean-room miner sub-delegated its
    reading to 3 sub-agents; inter-miner independence survived, but delivery mechanics changed and cost
    nudge cycles. Say explicitly whether intra-miner fan-out is allowed.
  - **Flow mining doubles as dead-code discovery** (reachability is a whole-graph property a class-
    scoped mine can't surface) — route the by-product findings to the tech-debt registry.
  - **Critic-review the tech-spec against the live fixture tree, not doc-only** — a committed sync
    snapshot already containing output-shaped files (input/output collision) and a "replace the
    snapshot" procedure contradicting the committed snapshot were both invisible without reading the
    live tree.
