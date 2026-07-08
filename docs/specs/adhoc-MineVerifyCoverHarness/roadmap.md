# adhoc-MineVerifyCoverHarness — implementation plan

**Design/spec:** `docs/proposals/mine-verify-automation-design.md` (method + the spike-corrected cost
design). **Pilot record:** `mine-verify-pilot-method.md`, `mine-verify-pass3-evaluation.md`.
**Architecture home:** the VERIFY-stage gate named by reference in ADR-26 — *"promote to its own ADR
when built."* This feature is that build; it graduates to **ADR-30** when shipped.

**Status (2026-06-23):** Mine→Verify proven (recall 3/3); **Inc-3a pipeline controller LIVE-PROVEN on TWO
classes** — BugRatioAnalyzer (100% reachable kill, SR `d5550bd`) and CycleTimeAnalyzer (100%, 399 mutants,
SR `c628dc1`), both fully automated on **Sonnet** (the gate validates quality, so the model is measured not
assumed). A fake-green was found + fixed mid-run (Stryker mutated the wrong class and the gate scored it as
the target — new `target_mutated` gate + `--mutate` pin, `4bfaa25`). VWH ruled out as host (see
`docs/research/2026-06-23-vwh-vs-mine-verify-cover.md`). Substrate: **standalone nexus skill + Workflow.** The
harness IS the product (automated, **.NET → Flutter** next; C++ deferred — see Multi-language end goal). Full
narrative + Flutter plan: `delivery/journey-and-flutter-plan.md`.

**Cross-repo bringup (2026-06-23):** third target = `dotnet-microservices` `ReviewInvitation.Accept/Decline`
(different repo, DDD behavior guards, not analytics). Scaffold (isolated net9.0 test project + Stryker MTP)
and harness parameterization (`testProjectDir`/`mutateGlob`/`patternTests`/`testDir` args + full-path report
extraction) are **done + validated offline** (307 tests; baseline Stryker = 11 testable mutants on the target).
Surfaced + fixed the **same-basename partial hazard** (the repo splits `Foo.cs`/`Behaviors/Foo.cs`; basename
report-key matching could fake-green). **LIVE-PROVEN GREEN (2026-06-23):** all 6 gates, **91% reachable kill**
(10/11), 39 tests, 7 rules, `target_mutated` confirmed the behaviors partial (13 mutants). One honest survivor
(`< → <=` exact-instant). Also fixed a budget-gate bug (it measured the shared session pool, not the run's
marginal spend). The harness is now **live-proven on 3 classes across 2 repos**. See journey-and-flutter-plan §5.5.

## Delivery model (the architectural decision)

Build **dev-repo-first; harden to a shipped skill last** — the repo's own pilot-before-harden pattern
(ADR-25 master gate: prove the loop before paying the skill-delivery + version-bump cost).

- **Method** → eventual `plugins/nexus/skills/mine-verify-cover/SKILL.md` (the durable, shippable core).
- **Orchestration** → a Workflow (the Mine→Verify→Cover→Discover loop). It ships as *documented design the
  orchestrator instantiates* — skill markdown cannot reference `${CLAUDE_PLUGIN_ROOT}` (ADR-2 #3), so the
  loop is authored from the skill's spec, not loaded from a bundled script path.
- **Deterministic helpers** (recall scorer, gate computations, KB-ledger writer) → small scripts; consuming
  projects receive them via the read-index copy pattern (ADR-5).
- **Language-neutral core / adapter split** (the plan's binding constraint): core = loop controller, the
  5-gate battery, consistency math, KB schema, stopping signals; adapter = evidence indexer (Roslyn),
  mutation tool (Stryker), test stack (xUnit + FsCheck). **First adapter = .NET.**

## Build increments (dependency order)

1. **Verify — productionized (batched + sliced).** ✅ **DONE** (recall 3/3 on BugRatioAnalyzer). The
   spike-corrected cost fix as the real Verify phase: triage → slice once → batched sliced verify
   (~5 rules/call) → tier. Pure nexus, self-contained; yields the clean per-class token number still owed
   to #4. *No cross-repo dependency.* **NOT the dropped v3 spike** — that was a throwaway measurement; this
   is the durable component. Shipped: `harness/mine-verify.workflow.js` + `harness/lib/recall-score.mjs`.
2. **Cover.** ✅ **DONE + LIVE-PROVEN.** `harness/cover.workflow.js` + `harness/lib/cover-gates.mjs`. First
   live Cover run on BugRatioAnalyzer: **88% reachable mutation kill** (132/150), all 5 gates green, 0
   candidate bugs; KB flipped verified→mutation-gated; tests + stryker-config committed in sprint-rituals
   (`a86ad4d`). Cover cost recorded (~231k output tokens, ~27 min) — closes #4. Report: `delivery/cover-bugratio.md`.
3. **Loop controller — SPLIT into 3a / 3b (owner decision, 2026-06-22).**
   - **3a — automated single-class pipeline controller.** ✅ **BUILT + APPROVED** (`harness/loop.workflow.js`
     + `harness/lib/kb-write.mjs`; 291 tests). One invocation runs Mine→Verify→(KB write)→Cover→KB flip→
     auto-report for ONE class. Stopping signals that stay meaningful single-class: budget cap
     (`budget.spent()` vs ceiling) + mutation ratchet. Clean-room: **PROMPT-ONLY** (the `agentType` seal is
     unverified — sanctioned fallback). **Live proof PENDING (Step 8):** re-fire `loop.workflow.js` on
     BugRatio (re-prove automated) + CycleTime (generalize). All five Workflow-runtime rules (below) now
     caught offline by `tests/unit/workflow-contract.test.mjs`.
   - **3b — DEFERRED.** Discover (boundary analysis → candidate BRs re-enter at Mine), the multi-class
     worklist sweep, the dry-counter stopping signal, the **mechanical** clean-room seal (disallowedTools/
     agentType), and the real char_pin manifest-pin. None needed to prove the single-class controller.
4. **Harden to a shipped nexus skill.** Born-compliant `SKILL.md`, lint/unit tests, ship via `release-plugin`;
   **core → nexus, .NET adapter → nexus-dotnet** (ADR-3); promote the ADR-26 reference to a new ADR.

## Multi-language end goal (the harness IS the product)

Applied first to **.NET**, then **C++**, then **Flutter** — automated. The language-neutral core / per-language
adapter split (Delivery model above) is the mechanism. **Adapter extraction is DEFERRED until C++ actually
lands** (owner decision): abstracting the seam from one language risks a .NET-shaped contract; keep the .NET
calls cleanly isolated so the later extraction is mechanical, not a rewrite. Adapter contract = 5 capabilities:
evidence indexer · test runner · mutation tool · test-style contract · prod-source-diff scoping. **Flutter
risk — de-risk BEFORE committing:** Dart mutation tooling is immature (Stryker/.NET solid; C++ has mull/
dextool; Flutter may need a custom mutator or a coverage+property fallback). Probe it first.

**C++ toolchain de-risked → GO (2026-06-24).** Phase-0 probe `docs/specs/adhoc-MineVerifyCppProbe/`
proved the C++ adapter toolchain end-to-end on the SDK's Hungarian slice: **clang-15 + mull-15 (0.34.0) +
libclang + GoogleTest** — mull killed 100/296 mutants with a gate-parseable JSON+SQLite report; slice
isolated cleanly from OpenCV/NCNN. Toolchain risk retired; the C++ adapter is now a **ready increment**
(sequencing vs Flutter stays the owner's call — this GO does not reorder). Carry-forward costs:
domain-rich slices are OpenCV/Eigen-trapped (budget slice-isolation), and `exit()`-in-code-under-test is
a mutation false-survivor trap (the adapter must neutralize it). Backing research:
`docs/kb/research/cpp-mutation-and-test-tooling.md`.

## Workflow runtime contract (learned the hard way — now encoded in the offline guard)

Workflow scripts run in a constrained runtime. Each rule below was found via an expensive live run before
`tests/unit/workflow-contract.test.mjs` was hardened to catch them all offline (mock-globals sandbox + meta
parse). Author future workflows (and adapters) against the guard, not against a live run:
1. **No static `import`** — non-module context; inline helpers + config.
2. **No `read()` / `fs` / `require` / `process`** — the orchestrator has NO filesystem. Agents do all file
   I/O and return via schema; the orchestrator works from returns. (The Verify→Cover seam is a KB *file* hop:
   Mine→Verify returns rules in memory → a write-agent persists them → Cover reads the file.)
3. **`meta` must be a PURE LITERAL** — no string concat, template interpolation, or calls.
4. **No `Date.now()` / `new Date()` / `Math.random()`** — they throw (break resume). Source the date from a
   cheap start-of-run agent, or pass via args, or stamp after return.
5. **`agent()` has no `disallowedTools` opt** — the mechanical clean-room seal needs a custom `agentType`
   (unverified) or stays prompt-only.

## Versioning & blockers (per `docs/research/2026-06-14-next-major-selection.md`)

- **Big *effort*, not a MAJOR *version*.** A new skill is new *capability* → **MINOR**. Increments **1–3 are
  no-bump dev-repo work** (the Workflow + helpers ship nothing); only **increment 4 (ship the skill) bumps —
  MINOR.** Don't force a MAJOR.
- **No CI-auth blocker** — the loop runs via Workflow/agents on the subscription session.

## Knowledge-layer integration (forward vision — captured, not yet built)

The harness's KB is one layer of a **3-layer knowledge stack** for agentic development. Each layer is
code-derived (so it does not drift) and serves a different agent/phase:

| Layer | Tool | Answers | Most valuable to |
|-------|------|---------|------------------|
| Structure | **graphify** | where things are, what's coupled, blast radius | architect (orient), impact analysis |
| Behavior (deep) | **mine-verify KB** | what each class *does*, verified + mutation-gated | developer, reviewer, architect-modifying-code |
| Product (broad) | a doc-set KB (e.g. omnishelf `docs-bootstrap`/`kb-sync`) | what exists, intent, ownership | PO, architect (scope) |

**The seams (thin, sequenced — do NOT build before the single-class skill ships):**
- **graphify → mine-verify** (the deferred *Discover* / 3b phase): the structural map selects which classes
  are rule-rich and where rules cross file boundaries — structure *scopes* behavior. graphify is the engine
  for graph-scoped target selection; it is an INPUT, not a new skill.
- **mine-verify → graphify**: verified rules can enrich graphify's semantic labels (deep mode) — cleaner than
  raw source for *meaning*, though source stays the ground truth for *structure*.
- **mine-verify → broad KB**: the verified rules are high-confidence, code-grounded facts a `kb-sync`-style
  ingest would want. A separate **rule-graph** (rules as nodes) built FROM the KB is the clean "semantic graph"
  — distinct from graphify's code graph.

Do not build graphify *on* the KB: the clean-room KB has no structural edges by design. The stack composes by
*layering*, not by feeding one into another's core.

## Next

**Inc 4 — ship the skill (IN PROGRESS):** authored as a **two-part split** (ADR-3) —
`plugins/nexus/skills/mine-verify-cover` (the stack-neutral method) + `plugins/nexus-dotnet/skills/
mine-verify-cover-dotnet` (the .NET toolchain adapter). Both lint-clean; MINOR bumps (nexus, nexus-dotnet).
Evidence gate cleared: **live-proven on 3 classes across 2 repos** (BugRatio 100% / CycleTime 100% in
sprint-rituals; ReviewInvitation 91% in dotnet-microservices). The skill-doc split is safe now (the
generic/stack boundary is drawn from 3 real .NET runs, not guessed); the deeper *code-level* adapter interface
stays deferred until Flutter forces it.

**After Inc 4:** Discover / 3b (graph-scoped multi-class sweep — the structure→behavior seam above), then
**Flutter Phase 0** (de-risk Dart mutation tooling — BLOCKING), then the Dart adapter. C++ deferred.

## Multi-language adapters — status (2026-07-08)

The multi-language end goal is now **four adapters shipped**: **.NET ✅, Flutter ✅, C++ ✅, PHP ✅**.

**PHP adapter — SHIPPED (`nexus-php` 0.1.0, 2026-07-08).** The fourth stack adapter, graduated from
`docs/specs/adhoc-MineVerifyPhpAdapter`. Fills the 5 capabilities with **Infection 0.34** (the PHP
Stryker-equivalent) driving **PHPUnit 12**, **workspace-copy isolation** (copy ONE target slice into a
self-contained composer workspace — the consuming repo stays pristine), **eris** property tests, and a
**Docker toolchain** (`php:8.4-cli` + PCOV + composer) run on the **container's native fs**. Like the
Flutter fork it is a **translation adapter** (not as-is like mull/Stryker): Infection's `json` logger is
proprietary — a mutant's status is the top-level group ARRAY it sits in, no per-mutant `status` field — so
the runner translates the group arrays into the gate's Stryker schema via the probe-observed status map.

- **Verdicts (both live runs on `fmcg_platform`, honest — the gate refused to fake-green both):**
  - `CalculateReferencePeriodAction` (pure Carbon date logic): **89% reachable kill** (51/57), `char_pin`
    0 — **REFUSED honestly on a GENUINE production bug** (`isFullWeek` dead code: Carbon 3 `diffInDays()`
    returns float, the strict `=== 6` predicate is permanently false → the full-week branch never runs).
    The Cover agent pinned the bug via reflection and tagged it `#[Group('known-bug')]` rather than
    delete the failing test. A sub-floor/refused run that mechanically worked is a valid outcome (the cpp
    precedent).
  - `SelectStratifiedSampleAction` (largest-remainder quota allocation + injected RNG, the de-hardcoding
    target): **88% reachable kill** (152/173), its own 42-method suite green (93/93, 657 assertions with
    `--exclude-group known-bug`). Formal refusal was **cross-suite contamination** (run #1's known-bug pin
    shares the workspace `tests/` dir), not this class. **Zero PHP-adapter prompt edits between the two
    runs** — the unlike-target de-hardcoding proof held (grep of the Cover prompt: zero `Carbon` hits).
- **Cost vs the baselines:** run #2 Cover = 760,940 subagent tokens / 4 agents / ~118 min (the mutation
  phase dominates: 173 mutants × 94 tests × 2 iterations on container native fs) — the same
  Docker-bound cost profile as the C++ adapter, well above the host-native .NET runs (BugRatio/CycleTime
  100%, ReviewInvitation 91% — no container tax). Campaign total (both classes, four workflow runs):
  ~1.53M subagent tokens. Native-fs execution is **mandatory** — the first probe hit 45/45 false
  timeouts on the Windows→Linux bind mount (a ~20× autoloader I/O tax); `cp -r /work /native` first.
- **Named future work:** the **in-repo / Pest-native variant** (run Infection against the consuming
  repo's own Pest suite instead of the copied workspace) is documented in the shipped SKILL.md but **not
  built** — it needs Infection + a driver installed into the consuming repo and drags the full (often
  live-DB) suite through Infection's initial sanity check; adopt only when a repo already ships both and
  its suite is fast + DB-free. Also deferred: the fact/tier vocabulary mapping for the PHP adapter
  (PHPUnit `#[Group(…)]` + `--group`/`--exclude-group`), mirroring the still-deferred cpp mapping.
