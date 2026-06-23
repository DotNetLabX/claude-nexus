# Mine→Verify→Cover Harness — Journey Log & Flutter Plan

A faithful record of what we built/learned and the forward plan. Companion to `roadmap.md`
(the canonical architecture doc) — this is the narrative + the next-language plan.

---

## Part 1 — What the harness is

Automated **business-rule mining + mutation-gated test generation**. One production class per invocation:

```
Mine        → 3 clean-room miners read ONLY the source class, extract business rules
Verify      → batched skeptic refutation (≈5 rules/call); CONFIRMED / WRONG / IMPRECISE
KB write    → serialize verified rules into the target repo's KB (the Verify→Cover file seam)
Cover       → a Cover agent writes example + property tests; a runner double-runs `dotnet test`
              + `dotnet stryker`; the orchestrator gates on the §6 battery (mutation floor ≥75%)
Report      → controller auto-writes cover-{class}.md; flips KB verified → mutation-gated
```

Orchestrated as a `Workflow()` in **nexus** (`harness/loop.workflow.js` composes `mine-verify.workflow.js`
+ `cover.workflow.js`); tests + KB land in the **target repo** (sprint-rituals today). The harness IS the
product — automated, .NET first, then other languages.

**Safety rails (never fake green):** budget cap (`budget.spent()` vs ceiling), mutation ratchet, and a
report-on-halt. The gate cannot be fooled — a weak test that doesn't kill mutants is caught and iterated.

---

## Part 2 — Increment status

| Increment | State |
|---|---|
| **1 — Mine→Verify** | DONE. Recall 3/3 on BugRatioAnalyzer. `harness/mine-verify.workflow.js`. |
| **2 — Cover** | DONE + LIVE-PROVEN. BugRatioAnalyzer 88%→100% reachable kill. `harness/cover.workflow.js` + `lib/cover-gates.mjs`. |
| **3a — pipeline controller** | BUILT + APPROVED + LIVE-PROVEN (Run 1). Single-class automation. `harness/loop.workflow.js` + `lib/kb-write.mjs`. |
| **3b — DEFERRED** | Discover (boundary analysis), multi-class worklist sweep, dry-counter, mechanical clean-room seal. |
| **4 — ship as nexus skill** | NEXT after generalization proven. core→nexus, .NET adapter→nexus-dotnet. |

---

## Part 3 — This session's steps (chronological)

| Commit | What / why |
|---|---|
| `73c98a5` | roadmap: Inc-3 split, multi-language plan, the runtime contract. |
| `8661613` | **Run 1 (BugRatio)** report — controller live-proven, 100% kill, all 5 gates green. |
| `4785827` | **Line-number fix** — the re-mined KB embedded source line numbers (`L35`, `lines 48/145`) in rule prose; they rot when source shifts. Two layers: prompt (miners cite symbols/conditions, not lines) + a fail-closed `stripLineRefs` sanitizer at the KB-write boundary. |
| `7abe981` | **Per-class survivor lines** — `EXPECTED_SURVIVOR_LINES` was hardcoded to BugRatio's `[17,133,268]`; carrying one class's dead lines to another = fake-green risk. Parameterized, default `[]`. |
| `9198aa0` | **Args-shape fix** (the big one — see §4) — the Workflow tool delivers `args` as a JSON STRING; the workflows read `_args.targetClass` off a string → undefined → silently ran BugRatio instead of CycleTime, wasting a full run. Fix: `JSON.parse` string args; +3 regression tests in the offline guard. |
| `d8a1ad3` | **Sonnet by default** — every agent now runs on Sonnet (~5× cheaper output), parameterized via `_args.model`. Safe because the mutation gate MEASURES quality; escalate a stage to Opus only if a gate can't be met. |

### Runs ledger
- **Run 1 — BugRatioAnalyzer (Opus):** 100% reachable kill (150/150), 134 tests, all gates green. Live proof of the controller. Committed (SR `d5550bd`).
- **Run 2a — MISFIRE:** ran BugRatio again (args-shape bug), ~960k tokens wasted, fully reverted. Bought 3 committed fixes + settled the "does `workflow()` composition inject args" unknown (it does — as objects).
- **Run 2b — CycleTimeAnalyzer, FAKE-GREEN then FIXED:** the first attempt reported "100%" but Stryker had
  mutated BugRatio (177 mutants), not CycleTime (0) — the gate scored the wrong class. Root-caused, fixed
  (the `target_mutated` gate + `--mutate` CLI pin, commit `4bfaa25`), churn reverted.
- **Run 2c — CycleTimeAnalyzer (Sonnet), REAL:** 59 verified rules; Stryker mutated **CycleTimeAnalyzer.cs
  (399 mutants, 275 reachable)** — `target_mutated` confirmed the right file — **100% reachable kill, 0
  survivors**, 216 tests, all gates green. The genuine second-class generalization proof, on Sonnet
  (SR `c628dc1`). CycleTime's 399 mutants vs BugRatio's 177 prove it really mutated the target.

---

## Part 4 — The Workflow runtime contract (6 rules, each cost a live run before the offline guard caught it)

Authored against an imagined runtime; each rule surfaced one expensive live run at a time, then got encoded
in `tests/unit/workflow-contract.test.mjs` so future workflows validate in **milliseconds**. `node --check`
is necessary but NOT sufficient.

1. **No static `import`** — non-module context; inline helpers + config.
2. **No `read`/`fs`/`require`/`process`** — the orchestrator has NO filesystem. Agents do all file I/O; phase
   seams are file hops (agent returns data → write-agent persists → next phase reads).
3. **`meta` must be a PURE LITERAL** — no concat, interpolation, or calls.
4. **No `Date.now()` / `new Date()` / `Math.random()`** — they throw (break resume). Source the date from a
   start-of-run agent.
5. **`agent()` has no `disallowedTools`** — the clean-room seal is prompt-only or needs a custom `agentType`.
6. **Args arrive in TWO shapes** *(new this session)* — the **Workflow TOOL** injects `args` as a **JSON
   STRING**; **`workflow()` composition** injects a real **OBJECT**. Parse the string form, or `_args.X` is
   `undefined` and targeting silently falls back to defaults.

---

## Part 5 — Other findings

- **Model:** Sonnet is good enough for the whole pipeline. The mutation/verify gates validate output, so
  model choice is measured, not assumed. ~5× cheaper. Escalate a single stage to Opus only on a gate miss.
- **Per-class setup gaps** a fresh class surfaced (3b auto-scaffold territory): the target must be added to
  the Stryker mutate scope; the KB needs a scaffold for the supersede seam; no `index.md` row to flip yet.
- **`dotnet-microservices` as a diversity target** — clean .NET 9 DDD codebase, rule-rich domain behaviors
  (non-analytics), but ZERO test projects → forces the "harness scaffolds a test project" capability. Saved
  as a best-practices reference. Good next .NET target after CycleTime.

---

## Part 6 — Flutter plan (the next language target)

**Reorder (owner decision):** roadmap was .NET → C++ → Flutter. Now **.NET → Flutter next** (C++ deferred).
Flutter therefore forces the **language-adapter extraction** the roadmap had deferred until C++.

### The make-or-break risk: Dart/Flutter mutation tooling
The harness's entire gate is **mutation kill**. .NET has Stryker (mature). Dart has **no equivalent of
Stryker's maturity** — `mutation_test` (pub.dev) exists but is far less proven. If Dart mutation testing
can't produce a meaningful, parseable per-file survivor report, the gate's premise weakens and we need a
fallback. **De-risk this BEFORE building anything.**

### Phases

**Phase 0 — De-risk Dart mutation tooling (BLOCKING — do this first, cheaply).**
- Spike `mutation_test` (and scan alternatives) on ONE pure-Dart class with real branching.
- Pass criteria: (a) drives `dart test` / `flutter test`; (b) emits a **per-file survivor report the gate can
  parse** (like Stryker's JSON); (c) has **enough mutators** (conditionals, arithmetic, returns, booleans) to
  be meaningful; (d) tolerable runtime per class.
- If it fails: decide the fallback before proceeding — a coverage + property-based gate (weaker), or a minimal
  custom mutator. **Do not build the adapter until Phase 0 passes or a fallback is chosen.**

**Phase 1 — Extract the language adapter.**
- The harness currently hardcodes .NET (Stryker CLI, `dotnet test`, xUnit test style, Windows paths). Extract
  the **5 adapter capabilities**: evidence indexer · test runner · mutation tool · test-style contract ·
  prod-source-diff scoping.
- `.NET` adapter = today's behavior, kept green by the existing 300-test suite (regression guard for the
  extraction). `Dart` adapter = new.

**Phase 2 — Implement the Dart adapter.**
- mutation tool = `mutation_test` (or the Phase-0 fallback); test runner = `dart test` / `flutter test`;
  test-style = `package:test` + property tests (`glados`); diff scoping = `git diff` on `lib/`.
- KB schema + the Mine/Verify prompts are language-neutral (the miner just reads a source file) — minimal change.

**Phase 3 — Prove on a Flutter target.**
- Target **pure-Dart business logic** (models, services, validators, state/reducer logic) — **NOT widgets**
  (no business rules, framework-heavy, poor mining targets).
- Run the controller; expect the same gate discipline. A sub-100% honest kill is a pass.

### Open prerequisites
- **Identify a Flutter target repo** with pure-Dart business logic (the equivalent of sprint-rituals analytics
  or dotnet-microservices domain behaviors). None chosen yet — needed before Phase 3.
- Confirm the Dart toolchain is installed where the harness runs.

### Chief risk, stated plainly
If Dart mutation tooling is too weak (Phase 0 fails) and no good fallback exists, Flutter coverage would rest
on a weaker gate than .NET's — the harness would still mine + verify rules well, but the "tests provably kill
mutants" guarantee degrades. Phase 0 exists to learn this before investing in the adapter.
