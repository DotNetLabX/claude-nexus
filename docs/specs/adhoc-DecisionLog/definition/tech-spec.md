# Tech-Spec — Decision Log with Outcome Back-links (A5 pilot)

**Status:** Ready
**Branch:** technical (ADR-27 — architect-owned definition)
**Provenance:** `docs/proposals/vwh-adoptions-2026-06.md` A5 (Ratified; pilot design settled
2026-06-12) + the consolidated backlog rank #3 in
`docs/proposals/mine-family-next-wave-2026-07.md`. VWH lineage: `decisions.jsonl` (every fluid
judgment call logged append-only with reasoning, outcome back-linked). Nexus port: a
**team-lead-only pilot** — the proposal's own scope guard ("prove the loop closes before the
writing obligation widens beyond the team lead").
**Plan:** `docs/specs/adhoc-DecisionLog/delivery/plan.md`

## Problem

The team lead makes judgment calls every run — escalation-menu choices, phase-failure recovery
(resume vs re-spawn vs split), launch-path/team-mode selection, triage STOPs resolved without the
user — and their outcomes are never systematically tied back. The learner consolidates *agent*
lessons (lessons.md) and *tooling* evidence (comm-log Issues sections) but has no source for
*coordination-decision quality*: a recovery choice that repeatedly fails looks identical to one
that works.

Two decaying links the ratified pilot design wires shut up front: (1) a write-only log nobody
reads (→ writer and reader ship in the same change), and (2) outcome rows nobody fills (→ the
back-fill is a deterministic close-protocol step, not a memory obligation).

## Design

**Additive prose in the two agent docs + command regen. No new file species** — the rows live in
the existing `communication-log.md`, whose real-time maintenance obligation already exists.

**Edit 1 — `plugins/nexus/agents/team-lead.md`** (three insertion points):

1. **Communication Log section** — after the Runtime / Plugin Issues Log sentence, define the new
   sibling section `## Decisions Log` with the row format:
   `| # | Phase | Decision (choice over rejected alternative) | Reasoning | Outcome |`
   — `Outcome` left `open` at write time. **Trigger rule (the no-cry-wolf bound):** a row is owed
   when the team lead **chooses between real alternatives** — escalation-menu picks, phase-failure
   recovery (resume/re-spawn/split), non-default launch-path or team-mode, a triage STOP resolved
   without the user, a model-per-phase override. Routine protocol-following (a forward the triage
   table dictates) is NOT a decision — no row.
2. **Pipeline Sequence step 6 (Shutdown)** — one added clause: before writing `summary.md`,
   **back-fill the Outcome** on every open Decisions Log row (what the choice led to, one line);
   zero rows left `open` at close. Deterministic close step, not a memory obligation.
3. **Resume section** — one line: on resume, tail the Decisions Log with the message rows (it is
   part of the resume state the header already serves).

**Edit 2 — `plugins/nexus/agents/learner.md`** (two insertion points):

1. **Consolidation step 1** — extend the comm-log read: also read each run's `## Decisions Log`;
   recurring decision patterns (a recovery choice that keeps failing, an escalation option that
   keeps being right) are lesson items, classified per the existing steps.
2. **The pilot kill-criterion (one sentence):** the **decision-log pilot** is evaluated at
   consolidation once ≥3 runs carry a Decisions Log — if no tracked/promoted lesson cites
   decision-log evidence by then, or rows keep closing `open`, flag the pilot for removal (the
   ratified "otherwise the artifact is overhead — kill it" criterion).

**Command regen:** `node scripts/gen-commands.mjs nexus` — both agent docs have generated
`commands/` mirrors.

## Decisions

| Decision | Why | Rejected |
|---|---|---|
| Rows live in `communication-log.md`, not a sibling file | the comm-log is already real-time-maintained, resume-tailed, and learner-read — zero new artifact plumbing | a separate `decisions.md` per slug (new species, new read obligations — the ratified proposal itself leaned this way) |
| Team-lead-only writer (pilot) | ratified scope guard — prove the loop closes before widening; the TL makes the highest-leverage coordination calls | all-agents writing (widens before value proven; the architect's plan `## Decisions` section already covers its lane) |
| Trigger = "chose between real alternatives" | bounds volume (no-cry-wolf); routine forwards are already in the message table | log-everything (noise the learner must wade through) |
| Kill-criterion lives in learner.md, evaluated at consolidation | the learner is the reader — cheapest locus that actually fires (a criterion only in a spec is a memory obligation) | selfcheck assertion on outcome-empty rows (A3-tier machinery; named seam, deferred until the pilot proves value) |
| MINOR bump recommendation | a new pipeline capability (new artifact section + learner input), not a fix | PATCH (understates a new obligation surface; owner confirms at release) |

## Acceptance criteria

All greps **per-file scoped** (tree-wide signature `Decisions Log` verified virgin 2026-07-10;
`back-fill` collides with figma-to-flutter, hence per-file only):

- **AC-1:** `grep -c "Decisions Log" plugins/nexus/agents/team-lead.md` ≥ 3 (template definition +
  shutdown clause + resume line); the row format line present (grep `"Reasoning | Outcome"`).
- **AC-2:** the shutdown back-fill clause — `grep -c "back-fill" plugins/nexus/agents/team-lead.md`
  ≥ 1, located in Pipeline Sequence step 6.
- **AC-3:** `grep -c "Decisions Log" plugins/nexus/agents/learner.md` ≥ 1 and
  `grep -c "decision-log pilot" plugins/nexus/agents/learner.md` ≥ 1 (critic L1 — exact-count was
  brittle).
- **AC-4:** both `commands/team-lead.md` and `commands/learner.md` regenerated — same greps hit
  the mirrors; regen in the same commit.
- **AC-5:** scope honesty — `git diff --name-only` over `plugins/` = the two agent docs + their
  two command mirrors + `plugin.json` + `CHANGELOG.md`, nothing else.
- **AC-6:** repo gates green (lint + unit tests + selfcheck); `release-plugin` bump in-commit
  (recommend `--minor`; owner escalation per policy).

## Out of scope

- Widening the writer set beyond the team lead (post-pilot decision, gated on the kill-criterion).
- A selfcheck assertion on outcome-empty rows (named seam; build only if the pilot survives).
- The architect's plan `## Decisions` section (exists, different lane) and `agent_calib`-style
  confidence calibration (revisit only after this pilot proves the outcome stream, per the
  consolidated backlog).
- Any structured/JSONL format — markdown rows in the existing artifact; promote to machinery on
  recurrence only.

## Definition review

Shared-artifact pass (Nexus agent docs) → code-grounded critic mandated; one batched pass over
spec+plan. Insertion-point anchors read live this session (team-lead.md:282–431 map; learner.md
whole). `mine-from-spec`: default-skip.
