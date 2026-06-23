# Deep-Dive: VWH vs. our Mine→Verify→Cover harness — which is better for the technical job?

**Date:** 2026-06-23 · **Subject A:** `virtual-worker-harness` ("VWH", `D:\omnishelf\virtual-worker-harness`,
`github.com/omniaz/virtual-worker-harness`) · **Subject B:** our Mine→Verify→Cover harness
(`D:\src\claude-plugins\nexus\harness\*`). **Job under test:** *automatically generate mutation-gated unit
tests around the business rules of a codebase — .NET today, Flutter next.*

**Grounded in:** current VWH source (fresh survey), the two prior evals
(`nexus/docs/proposals/vwh-adoptions-2026-06.md`, `sprint-rituals/docs/proposals/br-coverage-vwh-evaluation.md`
incl. its §8 code-grounded pass), our `delivery/journey-and-flutter-plan.md`, and today's live finding (a
fake-green in our harness — §7).

---

## Verdict (read this first)

**They are optimized for different jobs, and the honest answer is "neither wins outright — it depends on the
constraint that's actually binding."**

- **As a standalone, better-engineered test-gen *engine*: VWH wins.** More mature (≈124 test files, 90%
  self-coverage gate, CI, selfcheck, dry-run), a real toolchain-abstraction seam (YAML per language,
  `dotnet-xunit.yaml` **live-validated**, `flutter.yaml` already drafted), a **mechanical firewall**, and — the
  sharp one today — its gate reads the **real** Stryker report, so it structurally avoids the fake-green we
  just hit (§7).
- **As a fit for *our* goal (a reusable testing capability that ships inside a Claude Code plugin, is
  rule-centric, and spans .NET→Flutter automatically): ours wins on substrate + front-end.** A markdown/
  Workflow harness needs no Python kernel to host or maintain, and it has a **Mine→Verify rule front-end**
  (clean-room miners + skeptic refutation → verified business rules) that VWH's coverage flavor simply does
  not have — VWH optimizes *code* coverage, we optimize *verified-rule* coverage.

**Recommendation: hybrid, and it matches the prior verdict.** Keep our plugin-native substrate and the rule
front-end; **steal VWH's engineering** (the real-report gate read — already partially done today; the
`flutter.yaml` fallback design; the firewall framing; the gaming threat model). Do **not** host our loop on
VWH's kernel — a markdown plugin can't ship a Python kernel, and a fixed Mine→Verify→Cover conveyor underuses
(or fights) VWH's exploration machinery. This is exactly what the 2026-06 eval concluded; nothing since
overturns it.

---

## What each one is

**VWH** — a task-agnostic **autonomous research/build/eval kernel** you point at a project: an agent pursues a
quantified goal on an editable surface; a hypothesis DAG plans; every experiment commits to an immutable
ledger; a fresh-context skeptic challenges; governance owns budgets/stopping. Domain semantics attach via an
**adapter** (`surfaces/data_tiers/train/select/score/gates/noise_model`) packaged as a **flavor**. Two flavors
ship: ML/PyTorch (the founding one) and **test-coverage**. Python 3.11, ~5,448 LOC kernel + ~956 LOC coverage
flavor; cross-platform locking (`fcntl`/`msvcrt`). Standalone kernel, not a library.

**Ours** — a purpose-built **Mine→Verify→Cover pipeline** for business-rule test generation, authored as
`Workflow()` orchestration (markdown + JS workflow scripts) native to Claude Code. 3 clean-room miners →
batched skeptic verify → KB ledger → Cover agent writes tests → Stryker mutation gate → auto-report. ~304
offline guard tests; no separate runtime — the orchestrator IS the Claude Code session.

---

## Side-by-side

| Dimension | VWH | Ours |
|---|---|---|
| **Substrate** | Standalone Python kernel pointed at a project | Markdown + `Workflow()` native to Claude Code (no separate runtime) |
| **Shape** | General goal-pursuit over a hypothesis DAG (superset engine) | Fixed Mine→Verify→Cover conveyor (purpose-built) |
| **Test-writing model** | **Agent writes tests; `harness step` = mechanical measurement** | **Cover agent writes tests; orchestrator = mechanical gates** — *identical philosophy* |
| **Objective (maximand)** | Branch coverage %, mutation as a gate | **Verified-rule** coverage (every mined+verified rule has a mutation-killed test) |
| **Rule front-end** | None — optimizes code coverage directly | **Mine→Verify**: clean-room rule extraction + skeptic refutation (a capability VWH lacks) |
| **Gate battery** | `suite_green · no_flaky · mutation_floor · no_new_skips · char_pin` | **The same five** (independent convergence — see Common parts) |
| **Mutation tool** | Stryker.NET (.NET, live-validated) / `mutmut` (Python) | Stryker.NET (.NET) |
| **Planning** | Hypothesis DAG, islands, EV ranking, agent calibration, skeptic daemon, journal/recovery | Budget cap + mutation ratchet; Discover deferred |
| **Language seam** | YAML toolchain configs; `.NET` live, **`flutter.yaml` already drafted** | Adapter **not yet extracted** (.NET paths still inline) — planned at the Flutter step |
| **Clean-room seal** | **Mechanical** `sys.addaudithook` firewall (tripwire, same-process) | **Prompt-only** (agentType seal unverified) |
| **Maturity** | ~124 test files, 90% self-cov gate, CI, selfcheck, dry-run | ~304 offline tests; 2 live runs (1 real 100%, 1 fake-green being re-run) |

---

## Common parts (striking convergence — treat as mutual validation)

Two harnesses built independently landed on the **same load-bearing design**:

1. **The exact 5-gate battery** — `suite_green`, `no_flaky`, `mutation_floor`, `no_new_skips`, `char_pin`.
   Same names, same intent. This is the strongest signal that the gate set is *right*.
2. **"Agent writes tests; harness does mechanical measurement"** — neither has an autonomous test-writing
   subprocess; the intelligence writes tests, deterministic code scores them.
3. **Mutation kill as the trust anchor** (not raw coverage) — coverage without a killing assertion is
   rejected by both.
4. **Held-out / clean-room discipline** — VWH's firewalled sequestered tier ≈ our golden-set clean-room.
5. **No-fake-green as a first principle** — both treat "a gate the agent can game" as the cardinal sin.
   (Today proved we hadn't fully *implemented* this; VWH had — §7.)

---

## Genuine differences (where they actually diverge)

1. **Substrate — decisive for our context.** VWH is a Python kernel; a Claude Code plugin ships markdown.
   We cannot host VWH inside nexus. Ours runs as a Workflow with zero extra runtime. (Conversely, VWH runs
   anywhere Python runs, independent of Claude Code.)
2. **Objective — rule-centric vs coverage-centric.** Ours mines and *verifies business rules first*, then
   covers each. VWH's coverage flavor maximizes branch coverage of code. For "test the business rules," our
   front-end is the point; VWH would need a new "BR flavor" (the prior eval sketched exactly this).
3. **Planning weight.** VWH's hypothesis-DAG/islands/EV/agent-calibration is built for open *exploration*.
   A fixed Mine→Verify→Cover conveyor doesn't need it — the prior eval (code-grounded) found a BR use would
   actively use ~30% of the kernel and no-op or fight the ML-training-lineage rest (`governance.py` phases
   `UNDERSTAND→DEEP_RESEARCH→GREEDY_PLAN→ARCH↔HYPERPARAM`, epochs, `field_kill_fn`).
4. **The "~70% ML scaffold" nuance (both prior claims are right at different layers).** The **coverage flavor
   code** (~956 LOC) is clean and non-ML — toolchain-abstracted gates, no statistics in the hot path (the
   adapter overrides `certify` to run a real mutation pass instead of seed-variance stats). But the **kernel
   it runs inside** is ML-training-lineage; a coverage campaign sits in that arc and bypasses much of it.
   Net: the *flavor* is reusable and good; the *kernel overhead* is the cost you'd inherit.
5. **Firewall — mechanical vs prompt.** VWH blocks `open()` on sequestered paths via an audit hook (real, if
   "tripwire-not-guarantee"); ours is prompt-only (the mechanical agentType seal is still unverified).
6. **Language portability maturity.** VWH already has the toolchain-YAML seam *and a Flutter config*; ours
   hasn't extracted the adapter yet. **VWH is ahead here, and has already done our Flutter Phase-0 thinking**
   (`flutter.yaml`: line-only coverage, **no Dart mutation tool**, an explicit assertion-density + skeptic
   fallback — the exact risk our plan flags).

---

## §7 — Today's fake-green, as concrete evidence

Our CycleTime run reported "100% (150/150)". The Stryker report actually held **177 mutants under
BugRatioAnalyzer.cs and 0 under CycleTimeAnalyzer.cs** — our orchestrator *fabricated* `{files:{[target]:
runner's mutants}}` and scored BugRatio's kill-rate as CycleTime's. Two root causes (a hardcoded
`BugRatioAnalyzer.cs` in the runner prompt; no check that the target was the file mutated), both fixed today
with a new `target_mutated` gate + a CLI `--mutate` pin (commit `4bfaa25`).

**This is a real point for VWH.** Its `measure.py` reads the **actual** per-file report dict
(`files[<path>].mutants`) rather than trusting a runner-fabricated entry, so this specific fake-green can't
arise there. It's direct evidence that VWH's gate path is more battle-tested — and the fix we shipped today is
essentially adopting VWH's posture (score the real report, not a relabeled blob).

---

## Where each wins (decision guide)

**Choose VWH when:** you want a mature, language-portable, standalone test-gen/coverage engine *outside* a
Claude Code plugin; you value the mechanical firewall and the exploration planner; you're optimizing code
coverage with a mutation gate; you want a battle-tested gate path today.

**Choose ours when:** the capability must ship *inside* nexus (markdown, no Python kernel); the objective is
*verified business rules* (you need the Mine→Verify front-end); you want a light, conveyor-shaped loop without
inheriting an ML-training kernel; you want it native to the Workflow/agent substrate you already run.

**Best of both (recommended):** our substrate + rule front-end, hardened with VWH's engineering —
(1) read the **real** Stryker report in the gate (done today), (2) port `flutter.yaml`'s fallback design into
our Flutter Phase-0, (3) adopt the firewall *framing* + the gaming **threat model** (`coverage/prd.md §3`,
cookbook §TRAPS) as our reward-hacking defense, (4) lift the `dotnet-xunit.yaml` command/glob shapes when we
extract our adapter. Do **not** host on VWH's kernel.

---

## Update — second-class proof now real

The CycleTime re-run (after the fake-green fix) landed **real**: Stryker mutated CycleTimeAnalyzer.cs (399
mutants, 275 reachable), `target_mutated` confirmed the right file, **100% reachable kill**, 216 tests, all
gates green, on Sonnet (SR `c628dc1`). So our side now has **two genuine 100% proofs** (BugRatio 177 mutants,
CycleTime 399). This strengthens — but does not change — the verdict: the fake-green was a real maturity gap
vs. VWH, and closing it (by adopting VWH's read-the-real-report posture) is exactly the hybrid move §Verdict
recommends.
