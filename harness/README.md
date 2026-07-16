# harness/ — Mine→Verify→Cover automation harness (dev-repo build)

**Status:** Increment 2 (Cover stage). Dev-repo machinery — like `scripts/` and
`tests/`, this directory **ships nothing** to users and triggers **no plugin version bump**.

This is the dev-repo-first build of the **Mine→Verify→Cover** business-rule mining harness. It
graduates to a shipped skill at `plugins/nexus/skills/mine-verify-cover/` at **Increment 4**; until
then it lives here, where it can be developed, run, and grown across increments.

Design & roadmap (the binding definition for this ad-hoc work, ADR-27):
- `docs/proposals/mine-verify-automation-design.md` — the method/cost design (the §2 batched-sliced
  verifier is the load-bearing piece built here).
- `docs/proposals/mine-verify-pilot-method.md` — the manually-proven loop (recall 3/3 over 2 classes).

## What's here

| Path | Purpose | Increment |
|------|---------|-----------|
| `mine-verify.workflow.js` | The runnable Mine→batched-Verify Workflow (`Workflow({ scriptPath })`). | 1 |
| `targets/bugratio.json` | The pilot target config — source path, class name, **golden ids only**. | 1 |
| `lib/recall-score.mjs` | Deterministic recall-scoring helper (pure pairing fn + thin CLI). | 1 |
| `cover.workflow.js` | The runnable **Cover** Workflow — 3-actor (orchestrator + clean-room Cover agent + runner agent); turns verified rules into mutation-gated tests, gated on the §6 battery. | 2 |
| `lib/cover-gates.mjs` | The §6 gate battery as deterministic pure fns (5 gates + mutation ratchet) over the runner's JSON output. | 2 |
| `.runs/` | **Git-ignored.** Where the Cover runner agent writes its results — nexus-side, never in the sprint-rituals commit. | 2 |

Both helpers' unit tests live under `tests/unit/` (`recall-score.test.mjs`, `cover-gates.test.mjs`) —
inside the repo CI glob `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`, not co-located here,
so they run in CI and `scripts/selfcheck.mjs` with no wiring changes.

## The three actors (Cover — Increment 2, read before running)

Cover separates three actors and **never collapses them** (design §1 + §6 reward-hacking defense):

1. **Orchestrator** (`cover.workflow.js` JS) — reads the verified KB rules orchestrator-side, spawns the
   agents, computes the §6 gates via `lib/cover-gates.mjs`, applies the `// Stryker disable` annotation on
   KB-documented dead lines, and (Step 6, operator-owed) flips the KB ledger. Holds every privilege.
2. **Cover agent** (clean-room) — input = `BugRatioAnalyzer.cs` source + verified rules + surviving-mutant
   list + the `mutation-testing.md` API contract. **Only** writes the two test files. **No** write to the
   production class, `stryker-config.json`, the gate infra, or the KB. A red-on-current test is **kept +
   flagged** as a candidate bug, never deleted.
3. **Runner agent** — a **distinct** `agent()` call; double-runs `dotnet test` then `dotnet stryker`; writes
   results to `.runs/` (nexus-side, git-ignored). The golden set is **never** passed to either agent.

The acceptance gate is **mutation kill**, never coverage. First-pass floor = **per-file reachable kill ≥ 75**
(the 70→75→80 ratchet toward 100 is Increment 3). KB-documented dead-code survivors (`startIndex` L17/L133,
the `== 0` streak guard L268) are **expected-survivors**, excluded from the floor denominator — not chased.

## The clean-room boundary (read before running)

The harness measures how well clean-room miners rediscover a **sequestered golden set**. Two
non-negotiable rules carry over from the design (§3) and the golden set's own header:

1. **The golden text never enters the mining run.** `targets/bugratio.json` carries golden **ids
   only** (`GOLD-16/17/18`) — never the rule text. The golden *text* lives in the sibling repo
   (`sprint-rituals/docs/audit/golden-set.md`) and is read **orchestrator-side only**, after Mine,
   by the scorer — never by a miner/verifier/test-writer agent.
2. **Verifiers are structurally sealed.** Each verifier receives the relevant code **slice inline**
   and reads **zero files**. This is both the cost mechanism (one context load per batch, not per
   rule) and the leakage seal on the expensive path.

The **miner** clean-room is **prompt-enforced** this increment (the miner prompt forbids reading any
other file). The mechanical seal for miners (`disallowedTools` + inline source) is **Increment 3**
work — see the design §3 and ADR-13 (prompts are advisory on background subagents). Because miners
are prompt-only this round, the Increment-1 recall number is **conditioned on miners honoring the
prompt**; that conditionality is recorded with each run's results.

## Running (Increment 1)

The Workflow is run via the platform `Workflow({ scriptPath })` tool, then the scorer is run on its
output with the operator-supplied golden path:

```
# 1. Run the Mine→batched-Verify Workflow (orchestrator-side):
Workflow({ scriptPath: "<abs>/harness/mine-verify.workflow.js" })

# 2. Score recall vs golden (golden path supplied at run time, NOT committed):
node harness/lib/recall-score.mjs --pair \
  --consensus <consensus.json> \
  --golden D:\src\sprint-rituals\docs\audit\golden-set.md \
  --ids GOLD-16,GOLD-17,GOLD-18
```

**Resume, don't restart.** A `Workflow` launch returns a `runId`; on a kill or hang, relaunch with
`Workflow({ scriptPath, resumeFromRunId })` instead of from scratch — the unchanged `agent()` prefix
replays from cache and only live work re-runs. Same-session only (proven 2026-06-23: the
ReviewInvitation run resumed past a fixed budget gate, replaying Mine→Verify, ~193k tokens saved).

The golden path is **operator-supplied and machine-local** — it is deliberately not baked into any
committed artifact, to keep the answer key out of this repo. See the Step-4 results section of
`docs/specs/adhoc-MineVerifyCoverHarness/delivery/implementation.md`.
