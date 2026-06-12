# Proposal — Standing Cross-Cutting Lessons Inbox

**Date:** 2026-06-12 · **Status:** deferred (documented for later; not scheduled)
**Provenance:** Omnishelf estate sweep finding #7 (`.claude/rules/capture-lessons.md` there);
evidence context in `docs/evidence/2026-06-11-omnishelf-job-fitness.md`.

## The gap

Nexus lessons are **per-slug** (`docs/specs/{slug}/delivery/lessons.md`) and processed by the
learner at pipeline end. Observations not tied to any feature — harness friction, recurring
permission prompts, process ideas surfaced mid-session — have no home, and "a lesson saved
for later is a lesson lost" (sessions compact, crash, or get interrupted).

## The proposed shape (lean variant — the only one worth building)

- One file: `docs/lessons/_inbox.md`, append-only.
- **Single owner: the session driver** — the team lead in team mode, the active persona in
  solo/standalone. Subagents do NOT write it; they surface observations in their handback and
  the driver captures. (The team lead is the message hub — it already sees everything.)
- Capture on discovery, not at session end (end-of-session sweep is the backstop).
- The learner sweeps `_inbox.md` alongside the per-slug lessons files and routes items
  through the existing channels (improve-flow project/plugin split, improve-skills) — no new
  classification machinery.

## Why deferred (the as-swept variant fails our own tests)

- **AP3 risk:** a second capture home next to per-slug lessons.md means a classification
  decision at every capture; two homes for one content kind is how drift starts.
- **AP1 risk:** "capture on discovery" is a prose trigger with no executor at the capture
  end; only the learner's processing end has one.
- **Ownership cost (as-swept):** all-agents write access would widen the write sanctions the
  boundary detector keeps narrow. (The lean variant above removes this.)
- **Thin nexus-side evidence:** in the audited F16 run, cross-cutting observations *did*
  find homes — the communication-log's Runtime Issues section and the plugin-feedback file
  absorbed them. The homeless residue is measurably smaller here than in the source estate.

## Adoption trigger

Ship the lean variant when a consumer **measurably loses** a cross-cutting lesson (an
observation known to have been made mid-run that no artifact captured), or when the
team-lead's com-log Runtime Issues section visibly accretes non-runtime process/architecture
items that don't belong there. Until then: the com-log + plugin-feedback file remain the
sanctioned homes, and this stays a proposal.

## If adopted

Changes: `lessons-format` (inbox section + driver-only ownership), `team-lead.md` +
`solo.md` (capture-on-discovery line), `learner.md` (sweep `_inbox.md`). One PATCH release.
