# harness/ — Mine→Verify→Cover automation harness (dev-repo build)

**Status:** Increment 1 (batched Verify component). Dev-repo machinery — like `scripts/` and
`tests/`, this directory **ships nothing** to users and triggers **no plugin version bump**.

This is the dev-repo-first build of the **Mine→Verify→Cover** business-rule mining harness. It
graduates to a shipped skill at `plugins/nexus/skills/mine-verify-cover/` at **Increment 4**; until
then it lives here, where it can be developed, run, and grown across increments.

Design & roadmap (the binding definition for this ad-hoc work, ADR-27):
- `docs/proposals/mine-verify-automation-design.md` — the method/cost design (the §2 batched-sliced
  verifier is the load-bearing piece built here).
- `docs/proposals/mine-verify-pilot-method.md` — the manually-proven loop (recall 3/3 over 2 classes).

## What's here (Increment 1)

| Path | Purpose |
|------|---------|
| `mine-verify.workflow.js` | The runnable Mine→batched-Verify Workflow (`Workflow({ scriptPath })`). |
| `targets/bugratio.json` | The pilot target config — source path, class name, **golden ids only**. |
| `lib/recall-score.mjs` | Deterministic recall-scoring helper (pure pairing fn + thin CLI). |

The recall-scorer's unit test lives at `tests/unit/recall-score.test.mjs` (inside the repo CI glob
`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`), not co-located here, so it runs in CI and
`scripts/selfcheck.mjs` with no wiring changes.

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

The golden path is **operator-supplied and machine-local** — it is deliberately not baked into any
committed artifact, to keep the answer key out of this repo. See the Step-4 results section of
`docs/specs/adhoc-MineVerifyCoverHarness/delivery/implementation.md`.
