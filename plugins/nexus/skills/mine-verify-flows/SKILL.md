---
name: mine-verify-flows
description: Discover, verify, and golden-gate the user flows of ONE app — clean-room miners extract flows from routes/screens/blocs, a skeptic re-traces each flow's reachability, a Cover agent writes on-device flow tests asserting golden-master comparison of the flow's output JSONs, and a sabotage check proves each test can go red. Produces a verified flow registry plus golden-gated flow tests. Stack-neutral method; pair with a stack adapter (mine-verify-flows-flutter for Dart/Flutter) for the device toolchain. Use when whole user flows need a trustworthy code-grounded inventory and end-to-end output-contract regression tests — or Mine→Verify alone for the flow inventory + dead-code findings with no device toolchain.
user-invocable: true
---

# Mine→Verify→Cover — flow scope (the JSON golden gate)

Point this at ONE app. It produces two things, automatically:

1. A **verified flow registry** — the user flows the app actually implements, each re-traced through the navigation/bloc code, with the output files each flow writes.
2. A **golden-gated flow test set** — one on-device test per selected flow, asserting the flow completes AND its normalized output JSONs match human-approved goldens, each test proven able to go red.

It **reverse-engineers** the flows already encoded in the app — it documents what the app *does*, not what it *should* do. It never edits production source, and it never deletes a failing test to go green.

This is the **flow-scoped sibling** of the mine family (ground truth: routes/screens/blocs + the app's on-device output documents; gate: a sabotage check over golden-master comparison). Read `../mine-verify-cover/references/mine-family-core.md` §The mine family for the full 11-row family table and the shared invariant (bounded unit → clean-room miners → consolidate → skeptic verify → graded/verified registry) all eleven members follow.

This is the **stack-neutral method**. The device toolchain (on-device runner, golden bless/pull mechanics, output capture, the golden-gate module, harness bringup) comes from a paired **stack adapter** skill — `mine-verify-flows-flutter` for Dart/Flutter. The method here does not change per stack; only the adapter does.

## The pipeline

```
Mine        3 clean-room miners read ONLY presentation/routes + screens + blocs and extract user
            flows: entry route, step sequence, decision points, exit — and, per flow, WHICH
            output files it writes (path patterns). Miners trace into usecases/repos only far
            enough to name the outputs.
Consolidate merge to consensus flows with agreement counts; classify each flow by fixture need:
            scan-flow (needs the native SDK + captured frames) vs non-scan (snapshot-only)
Verify      a fresh skeptic re-traces each flow through the navigation/bloc code:
            CONFIRMED / WRONG / IMPRECISE; unreachable flows are findings, not registry rows
Registry    write the verified flow inventory to docs/business-rules/flows/user-flows.md
Cover       one flow test per selected flow: drive the flow on-device against seeded fixtures,
            capture the output files it created or modified, gate them against approved goldens
Gate        per flow: suite green twice (no_flaky) + the sabotage check (below)
Report      flows covered, goldens approved/blessed, sabotage results, flows deferred
            (e.g. scan-flows awaiting frames) — written every run, including on halt
```

One app per run. The orchestrator is deterministic and trusted; the agents do all reading/writing (the orchestrator has no filesystem) and the orchestrator computes every gate from raw output — no agent self-reports a gate.

## Flow scope changes the family defaults — deliberate deviations

- **Gate = sabotage check, not a mutation floor.** Flow-level mutation cost explodes (minutes per on-device run × mutants). The sabotage check kills vacuous tests at O(flows) cost instead — stated honestly as **weaker than a mutation floor**. This is a NEW flow-scope fallback, not the family's class-scope no-mutation-tool fallback (coverage + assertion-density floor), which targets unit suites and does not transfer to on-device flow cost.
- **Registry = ONE file for the whole flow set** (`docs/business-rules/flows/user-flows.md`), not one-file-per-mined-unit — the mined unit here IS the flow inventory; flows are meaningful as a set, and per-flow files would fragment the summary table.
- **Miners are cross-layer by nature** — flows span presentation → domain → data. The clean-room property kept is **miner independence** (no shared output, no reading tests or docs), not the family's one-class reading boundary.
- **The Cover agent is the repo's integration-test owner where one exists** (it owns the harness and the repo's integration-test skill); a generic agent with a stage prompt is the fallback. Flow tests need harness-specific knowledge a generic agent lacks.
- **No Minimize stage in v1** — expected flow count is small (roughly 10–20); revisit only if the suite balloons past the flow count.

## Two modes

- **Full** (needs a stack adapter): Mine→Verify→Cover→Gate→Report. Yields the verified registry *and* the golden-gated flow tests.
- **Mine→Verify only** (no adapter, no device): stops after the registry write. Yields the **verified flow inventory plus the dead-code findings** (below) for any app — even one you cannot run. Use it as a standalone code-grounded flow map.

## The JSON golden gate (the assertion layer)

Two-stage normalization before comparison:

1. **Canonicalize** — parse, recursively sort object keys, re-serialize with fixed indentation. Arrays are reordered ONLY when the flow registry marks them semantically-unordered, and then by a stable key — never blanket-reorder.
2. **Scrub** — regex-replace volatile values with stable tokens, one token per distinct original value (`Guid_1`, `Timestamp_1`, `{Path_1}`), preserving cross-field referential identity. **Token identity must not depend on the document position of excluded content** — scrubbing runs before compare-time exclusion, so first-seen-order numbering across the whole document lets an excluded-field flip renumber tokens referenced by gated fields (a phantom diff; observed on the first consumer run: a pairwise `{Path_A}`↔`{Path_B}` swap in gated fields whose actual values were identical). Number only non-excluded content, or derive token identity from the value itself.

Comparison is per-field, three verdict knobs — not two:

- **exact** (the default) — byte-equal after canonicalize+scrub.
- **FieldTolerance(path, ε)** — bounded numeric drift on a field that has a correct value.
- **FieldExclusion(path)** — the field is skipped entirely: its shape varies run-to-run, or it is garbage with no correct value.

Field paths support a **class-wide `**.` suffix wildcard** (`**.sfr` matches any dot-path ending in `.sfr`; dot-anchored, so `**.width` does not match `section_width`), with exact-path-beats-suffix precedence. Class-wide rules exist because nondeterministic fields **wander across subtrees run-to-run** — a per-path enumeration sampled from any finite set of runs does not converge.

**Output capture is a pre/post diff, never a static path list.** Seeded fixture snapshots routinely contain output-shaped files from their capture session, and the app writes fresh outputs to those same paths — so a static list risks diffing a golden against a seeded input. The golden set for a flow = the files the flow *created or modified during the test run* (snapshot the app documents dir before, diff after). Miner-reported output paths are cross-checked against the fixture manifest for collisions.

**Golden lifecycle.** The first blessed run produces the outputs → a human approves them once ("this result is correct") → committed as goldens → later runs must match. Goldens are generated, never hand-authored; regeneration is an explicit, reviewed act — **never an auto-refresh on failure**. Gate config (tolerances/exclusions) applies at compare time, so a config change never forces a re-bless.

**Flow outputs must not depend on live API responses** — the harness fakes the API surface so output generation is fully local; Cover authors must not assume a live or absent API.

**Goldens are pinned to ONE reproducible hardware/profile.** Cross-hardware ML/FFI outputs genuinely differ — a golden blessed on one device profile is only comparable on that profile. Pin one profile as the golden hardware and run CI on the same pin; the adapter names the concrete profile.

## The gate battery (flow scope — never fake green)

Every gate is computed by the orchestrator from raw runner output. All must pass, per flow:

| Gate | Passes when |
|------|-------------|
| `suite_green` | the flow test is run twice and is green both times |
| `no_flaky` | the two runs report identical pass/fail/skip counts |
| `sabotage_check` | with ONE asserted field perturbed in a copy of the golden, the test goes RED. A test that stays green on a sabotaged golden is vacuous and is rejected |

**Who executes the sabotage:** a distinct **runner agent** — never the Cover agent (the gate-infra prohibition below stands) — perturbs one asserted field in a working copy of the checked-in golden, re-runs the flow test against it, and restores the original afterward (the adapter's on-device runner capability covers the sabotage re-run mechanics); the orchestrator scores red/green from the raw runner output. The sabotage target is an **asserted** field (one the gate compares exactly or within tolerance) — sabotaging an excluded field proves nothing. A skipped stage or a deferred flow is logged and reported, never a silent no-op.

## Gate calibration — converge by class excision, not tolerance tuning

For a gate over FFI/ML output documents, **start at semantic-only exact-match plus class-wide exclusions; treat per-field tolerances as the exception, not the default.** Pilot evidence: every tolerance bound sampled from N verify runs was exceeded by run N+1 (a field's drift magnitude itself moved — ±2 became ±3 across pairs); every *excluded class* stayed excluded.

**The worked example to copy** (a shelf-scan report gate, final form after 6 verify runs): semantic exact-match on ~189 leaf fields (SKUs, anchor ids, counts, KPIs, audit trail) + class-wide `**.`-suffix **exclusions** for the geometry and garbage classes (positions, widths/heights, uninitialized-memory fields, unstable OCR candidate lists) + a single per-field tolerance, `**.sfr` ε 0.005. The FFI-stage gate asserts **semantics only**; excluding geometry wholesale is a two-way door — tolerances can be reintroduced per-field if a future consumer needs geometry gated.

**Ranked below-the-winner candidate lists are excluded-by-class from the start** — any ML output that is a ranked list of alternatives below the chosen winner (alternative-SKU lists, OCR candidate lists) reshuffles its tail membership and confidences run-to-run while the winner stays stable. Gate the winner; never the tail. (2nd-occurrence evidence: pilot OCR lists + the first consumer run's alternative-SKU tails.)

**Diagnose which case a nondeterministic field is before reaching for a knob.** `FieldTolerance` (value drifts within a bounded range) and `FieldExclusion` (shape varies run-to-run, or the value is garbage) solve *different* problems — a length-mismatch on a shape-varying array short-circuits before any per-element tolerance runs, so tolerance on it still flakes. And exclude/tolerate only fields with **observed** drift — never sibling fields "for safety."

**When a verify pair fails on a field DERIVED from an already-excluded instability, stop patching per-field.** The first consumer run's near-tie attribution escaped three successive narrow exclusions (a verdict subtree, then an identity trio, then a top-level summary bool), each escape costing a full device run to discover. Enumerate the root cause's whole downstream surface in the golden files (grep for every field family computed from the unstable input) and cut it in ONE reviewed pass. **After any config change, run N uncounted "flush" runs (the consumer used 3) before restarting the formal verify counter** — rare flips then surface as a batch instead of one per formal round.

**"Accept the flake" is a legitimate third verdict at the non-convergence decision point.** When the flipping field is the gate's core value (the consumer run: per-product placement verdicts, one flip in 12 runs), excluding it guts the gate. Keep it GATED, document the exact flake signature + a rerun-once policy next to the gate config, and treat a failure matching only that signature as the known flake — never silently widen the blind spot.

## Budget ~4 verify pairs per new output document

One verify pair *samples* an ML output document's drift; it does not *bound* it. In the pilot, four pairs produced four different drift surfaces (price-tag counts → product geometry → shelf dimensions → KPI floats). Budget roughly 4 pairs before the exclusion/tolerance set stabilizes for any newly-reached FFI output document.

**An exclusion baseline transfers between flows only for the output files they share.** A new flow that gates report *variants* the baseline flow never serialized (confirmation-scoped reports, assistant report strings) meets field families the baseline never saw — every NEW file family adds at least one calibration round on top of the inherited config. (2nd-occurrence evidence: pilot + the first consumer run, which inherited the pilot's baseline and still needed rounds for its three new file families.)

## A determinism verdict is scoped to the files actually produced

Treat any determinism/tolerance verdict as scoped to an explicit **file/field inventory**, never to "the flow" as a whole. The pilot's determinism spike closed the question for the ~140 SDK-stage files it reached — and extending the flow into report-stage writes found a real nondeterministic surface the spike never touched. Every time a flow test's reach is extended (more screens, more blocs, more write sites), **re-ask the determinism question for the newly-reached output**.

## Fixture strategy — only self-consistent state is sound

The only self-consistent fixture state is state produced by processing inputs against **this run's own configured context** (its own planogram/config/version). Before choosing "seed a pre-recorded output" as a flow's fixture strategy, grep the flow's full call chain for **both**:

1. any **native/FFI re-entry** that operates on the seeded data, and
2. any **entity-id join** (a `firstWhere`-style lookup) against seeded deployment/config data.

**Either alone is disqualifying, and passing (1) does not imply passing (2)**: catalog match (the same entity *names*) is necessary but not sufficient — a recording produced against a different config *version* still fails the id-space join. Pre-recorded seeds are sound only for pure local-file flows with no native re-entry and no entity-id join — confirm by grepping the chain, never by a scan/non-scan label.

## Acceptance precision — name the seam a deferred smoke covers

When a plan step defers verification to "a later step," that later step's own plan/doc must name **which specific function/seam** finally gets its first real exercise — otherwise "some code in this file ran on a device" is mistaken for "the function I'm about to call for the first time has ever run." (Pilot: a wrong asset-prefix constant sat unexercised through its own sign-off because the deferred smoke never called the seeding function.) Pin composed asset-key/path constants with a **host-side exact-string unit test** (cheap, no device) rather than deferring their first exercise to a device day.

## Stage recipes (pilot-proven)

- **The Cover-stage scrubber MUST smoke against a real captured-output corpus** — synthetic acceptance tests alone are insufficient. Pilot: the scrubber passed 18 synthetic tests, then real field JSONs broke it twice within minutes (13-digit float fractions matched the epoch-millis pattern; base64 feature vectors matched the path pattern).
- **Fixture triage runs a catalog-overlap grep, never ranks by frame-count/completeness alone.** A 30-second overlap grep flipped the pilot's "best" fixture (a 0/37-match export lost to a smaller one at 24/24). Add **re-capturability** as a triage dimension — a source the operator can re-scan on demand beats a bigger frozen archive.
- **State the intra-miner fan-out policy in the stage prompt.** Say explicitly whether a clean-room miner may sub-delegate its reading; inter-miner independence survives a fan-out, but delivery mechanics change and cost nudge cycles when it is left implicit.
- **Flow mining doubles as dead-code discovery.** Reachability is a whole-graph property a class-scoped mine cannot surface — dead subtrees, orphaned routes, and stub buttons fall out of Verify. Log these by-product findings in the **run report as candidate rows** for a `mine-verify-repo` run — never append them directly to `docs/tech-debt/` (that registry's row contract requires its own pipeline's evidence, priority, and provenance).
- **Critic-review the flow tech-spec against the live fixture tree, not doc-only.** A committed fixture snapshot already containing output-shaped files (an input/output collision) and a replace-the-snapshot procedure contradicting the committed snapshot were both invisible without reading the live tree.
- **State a verification flow's expected verdict explicitly — identical-replay fixtures assert the FAIL branch.** When a flow's semantics are "verify that something changed" (a rescan measuring whether flagged problems were fixed), replaying the identical input frames must yield the FAILED verdict — the first consumer run initially asserted the happy-path PASS and was wrong. Name the expected verdict during flow analysis; never default to the happy path.

## The flow registry

Mine→Verify writes ONE file for the whole flow set: `docs/business-rules/flows/user-flows.md`. Per flow, the family row grammar plus the flow-specific fields:

- `source: code` | `status` (`verified`, per the family grammar) | `criticality: golden | core | edge` | `last_verified`
- Entry route, step sequence, decision points
- **Outputs written** — the file path patterns the flow writes, with code citations
- **Class** — scan-flow vs non-scan (the fixture-need classification)
- **Agreement** — how many miners independently found the flow

**Criticality is assigned at Consolidate and confirmed at Verify**; flow selection for Cover is
the **operator's choice, guided by criticality** (golden first). The registry's consumers: the
Cover stage (selection), refresh runs (re-verify against the git delta), and the operator's triage.

Read `../mine-verify-cover/references/mine-family-core.md` §Registry invariants + refresh outcome grammar for the never-deleted / append-only-changelog / idempotent-re-run rules this registry follows.

## Execution topology (who runs what)

Read `../mine-verify-cover/references/mine-family-core.md` §Execution topology before orchestrating — the canonical shape (multi-agent by design, orchestrator-owns-spawning, staged background `general-purpose` agents, "launch = orchestrate stages") is defined there. This skill's own staging: the 3 clean-room flow miners run in parallel (background), then a consolidate+skeptic agent, then the Cover agent per selected flow — with the orchestrator computing the sabotage gate from raw runner output.

**On a NEW target, walk the core §kickoff checklist first** (tool preflight, expected survival rate, stop-budget, run-report location) before launching a run.

**The Verify stage is a code re-trace, not a command re-execution** — this skill reuses the family verdict grammar but is not a consumer of the core §Skeptic protocol's must-RUN enforcement; the carve-out (and its rationale) is recorded in the core.

## Model

Pin the mechanical stages (miners, consolidate, Cover) to a cheap model (Sonnet); a stronger model earns its keep only where judgment concentrates — the Verify skeptic. Never inherit the session model as a blanket default.

## Safety rails

- **Budget cap + report on halt** — read `../mine-verify-cover/references/mine-family-core.md` §Marginal-budget rail (capture-the-start delta gating; every stop writes a report naming the reason — never silently exit green).
- **A skipped stage or deferred flow is logged and reported** — never a silent no-op (a scan-flow blocked on frames is reported as deferred, not dropped).
- **Forbidden to the Cover agent** — editing production source, the gate infrastructure, or the registry; deleting or weakening a RED test (a red test is a candidate bug, kept and flagged); regenerating a golden to make a run pass.

## The adapter contract (what a stack skill provides)

The method names FIVE capabilities; the stack adapter fills them:

1. **On-device runner** — run a flow test on a device/emulator such that the outputs it writes remain retrievable afterward (test teardown must not destroy them) — including the **sabotage re-run** (re-running the same flow test against a perturbed golden copy, then restoring the original).
2. **Golden bless + pull mechanics** — how a candidate golden gets from the device sandbox into the repo (the human-review hop included).
3. **Output capture** — the app-documents-dir pre/post snapshot + diff that yields "files this flow created or modified."
4. **The golden-gate module** — a host-testable canonicalize → scrub → compare implementation with the three verdict knobs and the `**.` path grammar.
5. **Harness bringup** — fixture seeding, camera/API bypass, and native-SDK init ordering, so a flow test can run against seeded state.

## What this skill does NOT do

- Provide the device toolchain — that is the stack adapter's job (`mine-verify-flows-flutter` for Dart/Flutter).
- Verify anything platform-side / post-sync — the cut point is the file system (outputs the app writes locally). No Maestro/Patrol/Appium, no monkey testing.
- Mutation-gate flow tests — the sabotage check is the flow-scope gate, stated as weaker.
- Mine the rules of a single class — that is `mine-verify-cover` (the family head). This skill's unit is the app's flow inventory.

## Relationship to other skills

| Skill | Relationship |
|-------|-------------|
| `mine-verify-flows-flutter` | the Dart/Flutter stack adapter — fills the 5 capabilities (flutter drive keep-app-running runs, the two-hop adb bless pull, docs-dir pre/post capture, the pure-Dart golden module, harness bringup) |
| `mine-verify-cover` | the family head — class scope, mutation-gated; owns `../mine-verify-cover/references/mine-family-core.md`, the shared core this skill points to |
| `mine-verify-repo` | consumes this skill's dead-code by-product findings in its `docs/tech-debt/` triage registry |
| `tdd` | the test discipline the Cover agent follows |
