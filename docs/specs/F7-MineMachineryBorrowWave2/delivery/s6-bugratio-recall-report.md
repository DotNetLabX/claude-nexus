# F7 S6 — BugRatio Recall Report (evidence, not a gate)

**Run:** 2026-07-18 · developer (Phase-2 subagent) · F7-MineMachineryBorrowWave2 Step 8 (S6).
**Class:** BugRatio (user-confirmed, questions.md Q1).
**Scored with:** `harness/lib/recall-score.mjs` (parseGoldenSubset → buildPairingPacket →
orchestrator-side judge verdict map → computeRecall). **No fresh mine run** — the mined side is the
current confirmed registry state.

## Inputs (referenced by path + GOLD id only — golden rule TEXT is NEVER quoted here; clean-room binding rule)

- **Golden subset (leg 1 — frozen, sequestered):** `D:\src\sprint-rituals\docs\audit\golden-set.md`,
  ids **GOLD-16, GOLD-17, GOLD-18** (frozen, user-confirmed 2026-06-11, pre-pipeline — the 3 BugRatio rows
  of the 20-row held-out benchmark).
- **Independence corroboration (leg 2 — manual pilot):** `D:\src\sprint-rituals\docs\kb\bug-ratio.md`
  §Source — 3 independent clean-room miners + independent Codex refutation, 2026-06-14 (~22 converged
  behaviors, zero contradictions).
- **Independence corroboration (leg 3 — original product spec):**
  `D:\src\sprint-rituals\docs\product\fokus\v1.md` §5.5 "Bug Ratio Per Developer" (v1.md:239). The legacy
  `fokus-spec.md` citation (bug-ratio.md:74) resolves here; v1 (2026-05-04) predates both the golden-set
  freeze (2026-06-11) and the miner, so it is a genuinely independent oracle (critic MEDIUM-2).
- **Mined side:** `D:\src\sprint-rituals\docs\kb\bug-ratio.md` — the current **37-rule** confirmed
  BugRatio registry state (mutation-gated, 100% reachable kill, 2026-06-22). No fresh mine run.

The golden known-rules list was curated from the INDEPENDENT legs only, **never** from the harness-mined
registry (the circular-oracle trap — a golden set derived from the thing being measured makes recall
trivially high).

## Recall (matched / total)

**Recall = 3 / 3 = 100%.**

| Golden id | Matched? | Matched mined rule |
|-----------|----------|--------------------|
| GOLD-16 | yes | BR-1 |
| GOLD-17 | yes | BR-5 |
| GOLD-18 | yes | BR-21 (bug-ratio alert cluster: BR-19 / BR-20 / BR-21 / BR-22) |

**Unmatched golden ids:** none.

**No precision, no F1** (spec/critic HIGH-1 boundary — S6 measures recall only).

## Disclosures

- Disclosure line (verbatim): **"recall measured on the development class (method tuned on BugRatio)"** —
  BugRatio is the class the mining method was developed and tuned on, so this recall reads as recall on the
  *development* class, not a held-out generalization estimate for an unseen class.
- **Judge attribution.** The substance-match verdict was an orchestrator-side semantic judgment performed by
  the **developer (Phase-2 subagent), 2026-07-18**, over the deterministic pairing packet produced by
  `recall-score.mjs` — golden rule substance vs the mined candidates, per `golden-set.md` §Measurement
  ("a discovery counts if the harness's extracted rule matches the golden rule's substance … regardless of
  wording"). This was a scoped judgment on the packet, both pre-authorized options being (developer-performed
  | operator-owed); the developer-performed path was taken and is disclosed here.

## Status

**Evidence, not a gate — no floor, no halt.** This report records a recall measurement; it does not gate the
wave, set a floor, or trigger a halt (S6 is method *evidence* per the tech-spec, not an acceptance
threshold).
