# Build-Flow Formalization — Summary

**Slug:** adhoc-BuildFlowFormalization · **Date:** 2026-06-14 · **Branch:** main
**Team mode:** Standard+Codex · **Review mode:** critic (plan) + reviewer+Codex (code) · **Release:** nexus 1.9.0 (MINOR)

## What this pass did

Formalized the **front** of the Nexus build flow (idea → research → proposal → definition), which was previously informal, and integrated it with the mature back (plan → build → verify). Governing input: `docs/research/2026-06-14-end-to-end-build-flow.md`. The pass is **definitional** — ADRs + a tech-spec + a format skill + light agent edits — and **consumes** the shipped research system (P1/P2/P3) without redefining it (the binding hard constraint).

## Owner decisions (Phase 1)

| Q | Decision |
|---|----------|
| Q1 — research as a stage | Name RESEARCH an explicit stage, as a thin documentation layer over P1+P2 (zero new machinery) |
| Q2 — scope | Tier 1 + R5 (`Satisfies: AC-n`); R6 verify harness named **by reference**, not built |
| Q3 — backlog | Minimal `docs/backlog.md` + the ratified-proposal⇒row lifecycle rule; no migration |
| Q4 — ADR status | New ADRs land `PROPOSED — owner ratifies` |

## Delivered

- **ADR-25…ADR-29** appended to `docs/architecture/README.md` (master gate; flow + named RESEARCH; technical/product definition branch; proposal RFC-lite lifecycle; ratified-proposal backlog) — all `Status: PROPOSED — owner ratifies`.
- **Tech-spec** `definition/tech-spec.md` (the design-doc home; defers decisions to the ADRs).
- **`proposal-format` skill** — RFC-lite front-matter + NABC; lifecycle rules point to ADR-28.
- **`docs/backlog.md`** — ratified-proposal queue, impact÷effort ranking, `Spec` column, lifecycle rule mirroring ADR-29.
- **`Satisfies: AC-n` traceability (R5)** — wired (optional/where-present, never a blanket mandate) into `create-implementation-plan` (+ template), `architect.md` done-check, `reviewer.md`, `review-format`.
- **Light agent edits** — `architect.md` (technical feature ⇒ you own tech-spec + extracted ADRs), `po.md` (ratified product proposal = spec seed).

## Review outcome

- **Plan:** critic Mode 2 → **ACCEPT** (detailed findings unrecoverable due to an empty-transcript platform issue; verdict reliable — see review-critic.md).
- **Code (Step 2, Standard+Codex):** nexus reviewer **APPROVED**; Codex **NO-GO** with 5 findings. Reconciled finding-by-finding: F1 (P1/P2 "schema restatement") **refuted**; F2 folded as a light drift-pass; **F3/F4/F5 confirmed on disk and fixed** in cycle 1 (Impact-optional vs backlog-ranking; spec-link absent from schema; broken sample path). Re-review → **APPROVED**, 1 cycle. Codex's independent cross-check caught 3 genuine cross-file gaps the per-file review missed.

## Deviations / open items

- **Step 7 release** was dry-run-only during implementation (owner-confirmed Q5; ADR-18 — agents never commit). The team lead applied the bump at close: **nexus 1.8.3 → 1.9.0**, regenerated 3 commands (architect/po/reviewer), ran gen-omni (twin untracked here — no-op for this repo).
- **The new ADRs are `PROPOSED` — they await your ratification.** Flipping them to decided is the first run of the ratification gate this pass defines.
- Two co-staged releases were sequenced per your decision: **GateNegationFix 1.8.3 committed first**, then this pass's 1.9.0.

## Commits

1. `d755f9c` — feat(adhoc-BuildFlowFormalization): add implementation plan
2. `eda62e1` — fix(adhoc-GateNegationFix): pipeline-gate negation false-positive, release 1.8.3 *(your pre-staged release, committed first per your sequencing decision)*
3. *(this commit)* — feat(adhoc-BuildFlowFormalization): implement build-flow formalization, release 1.9.0

## Lessons

Recorded in `lessons.md` (architect, developer incl. fix cycle, reviewer, team lead). Team-lead highlights: phase-agnostic spawn labels (stale-label fix → fold into team-lead.md), the empty-transcript/salvage platform issue, and Standard+Codex earning its keep on a doc pass via cross-file defect detection. **Lessons processing (learner) not yet run** — offered to the owner at close.
