# Proposal P4 — Persona-for-Nexus: the ask-vs-decide calibration layer

**Status:** Draft / backlog (overview: `research-system-overview.md`). Last in sequence.
**Confidence:** **Medium** on value, **Low** on exact shape, **high drift-risk** — a wrong persona
generalization is invisible (no error signal), so it stays human-gated.
**Priority:** last.

## Decision (shape)
Port omnishelf `build-persona`'s discipline — **tiered, cited, dated, supersede-don't-delete,
approval-gated, two-phase** — to a **Nexus working-persona** whose job is to **calibrate P1's branch**:
"owner wants in on architecture calls, delegates mechanical ones" tells the agent when a low-confidence
fork is the user's to *decide* vs. the agent's to *research*.

## What differs from the omnishelf version
- **Sources:** session transcripts, the memory store, the active output-style ("Calm"), feedback
  entries — **not** Slack/Jira. Several persona signals already exist, scattered across these, so P4 is
  partly **consolidation**, not new collection.
- **Consumer:** the PO/architect tailoring questions and recommendations — **not** a Slack "reply as me"
  drafter.
- **Store relationship:** memory = inbox (raw observations); persona doc = merged schema'd output. One
  store, not two competing.

## Why last / why low-confidence
A stale research fact outs itself (a build fails). A wrong persona generalization is **silent** — it
biases every response with no signal. So: human-confirmed deltas only (the same approval gate the
learner uses), never silent inference.

## Builds on
omnishelf `build-persona` (the whole skill is the reference), `personal-attention-and-persona.md` (read
first), the memory store, the active output-style. Calibrates P1.

## Provenance
Session `researcher-build-persona`, 2026-06-13.
