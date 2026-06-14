# Mine→Verify→Cover — automation design (Pass-4 method layer, substrate-agnostic)

**Status:** Design — not yet bound to a substrate. The standalone-vs-VWH-flavor binding (§7) is
**deferred to step #1** (the VWH engine probe) + the step #4 comparison.
**Date:** 2026-06-14
**Inputs (proven):** [`mine-verify-pilot-method.md`](mine-verify-pilot-method.md) (the method + 2 failure
modes + 2-class calibration), [`mine-verify-pass3-evaluation.md`](mine-verify-pass3-evaluation.md)
(GO verdict + tuned gate params + the cost problem),
`sprint-rituals/docs/proposals/br-coverage-loop-harness.md` (the committed full plan: language-neutral
core + adapter, 5-gate battery, KB ledger, stopping signals).

## What this doc is (and isn't)

It is the bridge from the **manually-proven** Mine→Verify→Cover loop (2 classes, recall 3/3) to an
**executable controller** — the Pass-4 "Automate" row of the roadmap. It specifies the deterministic
orchestrator, the agent roles, their I/O contracts, the clean-room *mechanism*, and — the load-bearing
new piece — the **verifier cost fix**. It is written host-neutral so it binds to either a standalone
Workflow script or a VWH flavor; that choice is §7 and stays OPEN until #1 reports.

It is **not** a re-derivation of the loop's research basis (that's the harness-plan proposal) and it does
not start the build (constraint: wait for #1's substrate verdict).

## 1. Loop controller (deterministic orchestrator + clean-room agents)

The split that makes the loop honest: a **trusted orchestrator** holds every privilege; **clean-room
agents** see source only. The orchestrator never mines or verifies (it is contaminated by golden-set
visibility) and no agent ever scores itself.

```
ORCHESTRATOR (trusted, deterministic) — the controller
  • selects next target class from the KB index / worklist
  • dispatches clean-room agents with a RESTRICTED INPUT SURFACE (§3)
  • computes consistency + scores recall/precision vs golden (agents never do)
  • runs the 5-gate battery at Cover acceptance (§6)
  • writes/gates the KB ledger + index (§5); owns stopping signals (below)
  • holds loop state: dry counter, mutation ratchet, budget, per-rule dead-ends

  per target class, one pass:
  ┌─ MINE ──────────┐   ┌─ VERIFY ────────┐   ┌─ COVER ─────────┐   ┌─ DISCOVER ──────┐
  │ N clean-room    │──▶│ triage → scoped │──▶│ TDD + Stryker   │──▶│ boundary anal.  │──┐
  │ miners (source  │   │ Codex refutation│   │ mutation kill   │   │ → candidate BRs │  │
  │ + Roslyn slice) │   │ (the COST FIX,  │   │ (NEVER coverage-│   │                 │  │
  │ scaled to       │   │  §2)            │   │ gated)          │   │                 │  │
  │ complexity      │   └─────────────────┘   └─────────────────┘   └─────────────────┘  │
  └─────────────────┘            │ low-consistency / contradiction → human queue         │
        ▲                        └───────────────────────────────────────────────────────┘
        └──── candidate BRs re-enter at Mine (no discovery skips Verify) ─────────────────┘
```

**Phase agents and their contracts** (every deliverable is a **file write** — §4):

| Agent | Count | Input surface | Output file | Privilege limits |
|---|---|---|---|---|
| Miner | 1 pure-function / 3 branching-or-stateful (Pass-3 tuned) | source file + Roslyn evidence slice ONLY | `mined-{class}-{i}.md` | no read of `docs/audit/`, `docs/kb/`, test projects |
| Verifier | 1, distinct base model (Codex) | source + mined rules (scoped subset, §2) | `verify-{class}.md` | clean of golden set; refutation/collaborative framing |
| Cover | 1 | source + verified KB rules + surviving-mutant list | tests + `cover-{class}.md` | **no write** to stryker-config / gate infra (§6) |
| Discover | 1 | source + verified rules | `discover-{class}.md` (candidate BRs) | clean of golden set |

**Stopping — external signals only** (orchestrator-owned, no LLM self-assessment anywhere):
- **Dry counter:** 3–5 consecutive passes with zero net-new verified rules.
- **Hard budget cap:** tokens + wall-time ceiling (deployed loops converge in ~5 passes; cap ~20).
- **Mutation ratchet:** suite mutation score never regresses — a regression means the harness is
  broken → halt, don't continue.

## 2. The cost fix (the load-bearing Pass-4 requirement)

Pass-3's single blocker: Codex wall-time scaled 13 min → 48 min with rule count × samples, and won't run
across ~10 classes. The fix is **three composable mechanisms**, all orchestrator-driven:

1. **Triage before refute.** A cheap/deterministic pass classifies each mined rule:
   - **Transcribed** (a formula lifted verbatim from code — band math, `Σbug/Σtotal`) → the verbatim
     quote already entails it; **skip the expensive refuter**, accept on quote-entailment alone.
   - **Interpretive** (guard reachability, branch discontinuity, aggregation semantics, case-sensitivity
     asymmetry, "never reaches 100 within band") → these are where refutation earned its keep in the
     pilot (every real catch was interpretive). **Only these reach Codex.**
2. **Per-rule (or per-cluster) parallel verify** — replace the one monolithic 28-rule pass with a fan-out
   so wall-time ≈ slowest single rule, not the sum. This is the biggest lever.
3. **Tier the verifier** — a cheap model carries the bulk consistency/entailment check; Codex is reserved
   for low-consistency or interpretive rules. Escalation target ~14% (Pass-3 observed) → most rules never
   touch the expensive tier.

**Status:** unproven at scale — this is *the* thing #1/#4 must validate (does scoping+parallelizing the
verifier hold recall while cutting cost?). Recall must not regress from the manual 3/3 baseline.

## 3. Clean-room as a mechanism, not a prompt

Prompts are advisory on background subagents (nexus ADR-13) — "don't read the golden set" is not
enforcement. The boundary must be a **capability restriction**:

- Miner/verifier/discover agents run with an **input surface restricted to the source file + Roslyn
  slice** — `disallowedTools` / path-scoped read so `docs/audit/golden-set.md`, `docs/kb/`, and test
  projects are *unreadable*, not merely off-limits.
- **Orchestrator-scores-only:** the golden set is visible to exactly one actor (the orchestrator), which
  never mines. Recall/precision is computed after the fact, against output the miner could not have
  shaped to the key. This is the contamination fix from the pilot, made structural.

## 4. Pilot return-contract fixes (carry forward verbatim)

Two failure modes from the manual runs, now design invariants:

- **Deliverable = a file write, never the final message.** `general-purpose`/Codex agents returned bare
  "Done." with output discarded. Every agent `Write`s (or `cat`-heredocs, for Bash-only bridges) to a
  named file; the orchestrator reads the file. This also makes the pipeline **resumable** — each phase's
  artifact is durable.
- **Confidence = semantic consistency across the N samples, computed by the orchestrator.** Never
  verbalized H/M/L, never CoT-derived (ECE ≈ 0.10 overconfidence). The orchestrator does set-agreement
  over rule statements across miners; all-samples-agree + survives refutation + no contradiction → auto;
  else → human queue.

## 5. KB ledger write (project schema)

Output binds to the *consuming project's* schema (`sprint-rituals/docs/kb/_schema/entry-template.md`:
Rules / Key Files / Edge Cases / Relationships / Source + mutation-tracking HTML comments) — **not** the
harness-plan's aspirational rich frontmatter. The instance KB is sprint-rituals'; the method is nexus'.

- **`index.md` is load-bearing** — a row is added before the KB file, and the index is the authoritative
  worklist Cover reads. First artifact touched, last updated, every pass.
- **Supersession, not deletion** — a corrected rule supersedes; history is preserved.
- Status ladder is mechanical: `verified` (Mine→Verify passed) → `mutation-gated` (Stryker killed ≥1
  mutant per rule). The footer comments (`mutation-gated`, `last-stryker-run`) are flipped by Cover.

## 6. Gates (honesty battery + reward-hacking defense)

Adopt VWH's 5-gate forms at Cover acceptance, enforced **mechanically** (not by agent self-report):

| Gate | Checks | Note for this flavor |
|---|---|---|
| `suite_green` | all tests pass, both double-runs | — |
| `no_flaky` | identical pass/fail counts across the two runs | — |
| `mutation_floor` | sampled kill-rate ≥ floor per pass; full-scope at certify | the BR acceptance gate; `break-at` 70→75→80 |
| `no_new_skips` | skip count ≤ baseline | catches "skip the failing test" hacking |
| `char_pin` | prod-source-touch proxy | **caveat:** VWH's is a count proxy, not a manifest pin — a real char-pin must be reimplemented for the BR flavor |

**Reward-hacking defense (non-negotiable):** the Cover agent gets **no write access** to the Stryker
config, the gate infra, or the KB schema. Coverage is *never* an acceptance criterion anywhere (it is
informational — coverage-gated generation validated bugs in the research). A test that fails on current
code is **not discarded** — it routes to the human queue as a candidate bug.

## 7. Substrate binding — OPEN (decided after #1)

The architecture above is host-neutral. Two candidate hosts; the choice is the output of the #1 engine
probe + #4 comparison, on these criteria: cost/class under the §2 fix, how much of the §6 battery the host
enforces mechanically, fidelity on a real multi-project CPM solution, and how cleanly the orchestrator's
trusted/clean-room split maps.

| Design element | Bind as **standalone Workflow** | Bind as **VWH flavor** |
|---|---|---|
| Orchestrator (§1) | the JS workflow script — deterministic control flow, `pipeline()` for the per-class loop | VWH kernel's experiment loop (`harness step`, commit-per-experiment) |
| Clean-room agents (§3) | `agent(..., {agentType, disallowedTools-equiv})`, schema-validated returns | flavor's worker invocation under VWH's firewall/editable surface |
| Cost fix parallelism (§2) | `parallel()` / `pipeline()` per-rule fan-out — native fit | flavor's per-experiment fan-out (kernel is more serial) |
| 5-gate battery (§6) | re-implemented in-script (the gates are not provided) | **already exists** (`measure.py:170-181`) — strongest argument for VWH |
| Stopping signals (§1) | script-owned counters + budget cap | VWH's score/ratchet + experiment cap |
| Scoring vs golden (§3) | orchestrator step, golden read in-script | flavor `score()` = recall-vs-golden + mutation-kill-of-verified |

**Leading tension:** the standalone Workflow is the more natural fit for the trusted-orchestrator +
per-rule-parallel shape (the cost fix is `pipeline()`-native); VWH's pull is that it *already ships* the
mechanical gate battery and the commit-per-experiment honesty record. #1 tells us whether VWH's engine
holds up on a real CPM closure (the vendored-slice probe) and at what cost — that result, against the §2
projected cost here, decides it. See `br-coverage-vwh-evaluation.md §6` for the original criteria and
`§Boundary & sequencing` for the three-layer split (method → nexus; instance → sprint-rituals; loop
orchestration → host).

## Rejoin point

Tracks #1 (VWH probe, running) and #2 (this design) converge at **#4 — compare**: VWH's measured
engine numbers (coverage %, mutation kill %, 5 gates, tokens, wall-time on the vendored BugRatio slice)
against this design's §2 projected cost and §6 gate coverage. That comparison resolves §7 and unlocks the
executable build.
