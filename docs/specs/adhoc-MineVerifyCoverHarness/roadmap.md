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

## Next

**Re-fire Step-8 Run 1** (the live proof of the 3a controller):
`Workflow({ scriptPath: "D:\\src\\claude-plugins\\nexus\\harness\\loop.workflow.js" })` on BugRatioAnalyzer
(expect ~100% now Timeout counts as killed). Then **Run 2** on CycleTimeAnalyzer (generalize; skips recall —
no golden set). Both pause for owner go (they run the .NET toolchain + write to sprint-rituals). After 3a is
live-proven → Inc 4 (ship .NET skill), then the C++ adapter (extract the contract THEN), then Flutter.
