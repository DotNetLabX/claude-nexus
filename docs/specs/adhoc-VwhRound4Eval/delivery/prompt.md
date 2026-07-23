# Prompt: round-4 blind evaluation + VWH-side borrow wave

**Run this in a Claude session working in `D:\omnishelf\virtual-worker-harness`.**
Authored 2026-07-22 by Solo in the nexus repo (`docs/specs/adhoc-VwhRound4Eval/`).
Rev 2: sealed-envelope blinding — orchestrator gets no prior scores/verdicts/borrow lists;
prior docs open only post-lock, and the shipped-borrow ledger only after the fresh borrow
list is written.
Rev 3: model assignments — Opus for generator/implementation tasks, Fable for judgment tasks
(skeptic, lock/adjudication, reconciliation), per the stage-model doctrine.

---

# Round-4 blind evaluation + VWH-side borrow wave: mine family vs virtual-worker-harness

You are working in `D:\omnishelf\virtual-worker-harness` (VWH). The comparison subject is the
nexus mine family at `D:\src\claude-plugins\nexus`.

## Model assignments (hard rule)

- **Normal/generator tasks → Opus** (`model: opus` on the Agent call): Evaluator-M, Evaluator-V,
  and any borrow-implementation or test-writing agents in Phase B.
- **Judgment tasks → Fable** (`model: fable`): the skeptic pass (step 3), any score
  adjudication, and the reconciliation/verdict authoring (step 6). The orchestrating session
  itself performs lock, adjudication, and verdict — run it on Fable (`/model` = Fable); if the
  session is not on Fable, spawn a `fable` subagent for those steps instead of doing them inline.

## Blinding rules (read first, they override everything below)

This is a BLIND re-evaluation. Prior comparison rounds exist, but neither you (the orchestrator)
nor any evaluator may read them — or any file mentioning the rival comparison — until the lock
step explicitly permits it. Forbidden until then, in BOTH repos: `docs/research/*vwh*`,
`docs/proposals/*vwh*`, `docs/specs/*Borrow*`, `research/` comparison notes, CHANGELOGs,
backlog/program docs, and any file whose content turns out to be about the other system —
if you open a file and it starts comparing the two systems, close it and log the near-miss.
You start knowing only: two systems exist, and a rubric. No prior scores, no prior verdicts,
no prior borrow lists are given in this prompt — do not go looking for them.

## Phase A — clean-room evaluation

1. Spawn **two independent clean-room evaluator subagents** (fresh context each, **Opus**):
   - **Evaluator-M** reads ONLY `D:\src\claude-plugins\nexus`, scoped to the mine family:
     skills `mine-verify-cover`, `mine-verify-repo`, `mine-verify-flows`, `mine-design`,
     `mine-algorithm`, `mine-reference-model`, plus `harness/` and the stack adapters.
     Any other `mine-*`/`regenerate-*` members it finds go into a **non-scored annex**.
     FORBIDDEN: this VWH repo and everything in the blinding list above.
   - **Evaluator-V** reads ONLY this repo. FORBIDDEN: the nexus repo and the blinding list.
   - Each produces an evidence-cited capability profile and scores 1–10 per category, with
     **≥2 `file:line` evidence items per score**.
2. **Rubric** (anchored: 10 = state of the art for agentic dev tooling; 5 = adequate;
   2 = aspirational prose):
   1 Grounding & enforcement · 2 Verification & skepticism · 3 Proven value ·
   4 Generality & extensibility · 5 Composability & workflow fit ·
   6 State, resumability & audit · 7 Economy (of operation) · 8 Operability & DX.
3. **Skeptic pass (Fable):** spawn a fresh skeptic agent that re-executes or spot-checks ≥2
   evidence citations per category per system (open the file at the cited lines; run the cited
   command where cheap). A claim that fails re-execution is dropped and the evaluator must
   re-ground it or the score is docked. Flag (do not trust) any self-scored numbers found in
   either repo.
4. **LOCK the scores** (judgment — Fable). Write the score table and justifications to the
   draft doc before opening anything from the blinding list.

## Phase B — borrow list + implementation (VWH side only)

5. From your own round-4 evidence ONLY, write the ranked **`VWH ← mine`** borrow table
   (what it fixes, expected category improvement, effort S/M/L). Write it down BEFORE step 6.
6. **Unseal** (judgment — Fable). Now read, in the nexus repo:
   `docs/research/2026-07-12-mine-family-vs-vwh-per-member.md`,
   `docs/research/2026-07-15-mine-family-vs-vwh-machinery.md`,
   `docs/research/2026-07-17-mine-family-vs-vwh-fresh-eval.md`, and
   `docs/specs/F7-MineMachineryBorrowWave2/delivery/summary.md` (the ledger of already-shipped
   borrows). Then write a **reconciliation** section: per-category deltas vs the prior round,
   each delta attributed to shipped changes since 2026-07-17 or to calibration, never left
   unexplained; and mark which of your fresh borrows the prior rounds also derived (convergence
   is signal) and which are already shipped (drop those from the implementation queue).
7. **Implement the surviving top borrows** (implementation agents — **Opus**) under these rules:
   - **Borrow lessons, not machinery**: pattern transfer in kernel-idiomatic Python; never
     transplant Node/JS from the nexus harness.
   - **S and M efforts only** this pass; L-effort borrows get a design doc, not code.
   - Every borrow lands **with tests**; the full suite stays green and the existing CI coverage
     floor holds. Do not weaken any existing blocking gate while integrating.
   - **One commit per borrow**, message:
     `feat(borrow-wave): <borrow-id> <name> — from nexus mine family round-4`.
8. After the last borrow: run the full test suite; record pass/fail counts and coverage.

## Outputs

- **Round-4 doc** → `D:\src\claude-plugins\nexus\docs\research\2026-07-22-mine-family-vs-vwh-round4-eval.md`
  (verdict first, locked score table, justifications, fresh borrow table, reconciliation,
  limitations — including any blinding near-misses from the log). Drop a one-paragraph pointer
  in this repo's `research/`.
- **Implementation report** → this repo: borrows applied, tests added, coverage, commit SHAs,
  deferred borrows with reasons.
- Newly derived **`mine ← VWH`** borrows go into the round-4 doc as a nexus backlog note only —
  do NOT modify the nexus repo beyond writing that one research doc.

## Guardrails

- The nexus repo is **read-only** except the single research doc above.
- Commit locally; do **not push** either repo without owner confirmation.
- If a borrow requires kernel-contract changes that would break shipped flavors, STOP and
  surface it instead of forcing it.
