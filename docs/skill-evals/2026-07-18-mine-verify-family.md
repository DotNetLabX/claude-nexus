# Skill Evaluation — mine-verify-cover + mine-verify-repo (F7 S-Step 9 gate)

**Evaluator:** developer (Phase-2 subagent), F7-MineMachineryBorrowWave2 Step 9.
**Date:** 2026-07-18.
**Scope (exact files read):**
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` + `references/mine-family-core.md` +
  `tools/{cover-gates,evidence-gate,kickoff-preflight}.mjs` (all touched/created this wave).
- `plugins/nexus/skills/mine-verify-repo/SKILL.md` (poll-don't-wait pointer replaced).
**Run artifacts consulted:** the wave's implementation.md; the full CI suite green (578 lint+unit tests,
0 fail); Layer-0 `skill-lint.mjs` run directly on both skills (both `OK`); the per-step grep gates
(binding headings preserved, superseded sentences confined to their notes, 14 heading-pointer sites resolve).

## Channel note

These are shipped plugin skills, but this is the **nexus dev repo** (the plugins' source of truth, ADR-1) —
the skill files ARE the product here, so this evaluation judges them in place. The finding list below is
scoped to the F7 changes (did they degrade fitness?) plus whole-skill fitness spot-checks.

## Layer 0 — Mechanical (scripted)

`node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` on each → `OK mine-verify-cover`,
`OK mine-verify-repo` (exit 0). A dangling reference introduced mid-implementation (a bare
`references/mine-family-core.md` cite in mine-verify-repo, which owns no local copy) was caught by the
lint's dangling-reference check and fixed to the established cross-skill form
`../mine-verify-cover/references/mine-family-core.md`. **Clean.**

## Findings

## F1: mine-family-core.md is approaching a size worth watching
**Severity:** Low
**Layer:** 2.3 (right weight)
**Claim vs reality:** the shared reference for the 8-member family gained 4 sections this wave (Shipped gate
battery, Stage-completion + mechanized firing, the evidence-gate instruction, the runway-forecast bullet)
plus two supersede notes. It remains coherent and each addition is a load-bearing mechanism, but the file is
now the family's single largest reference. **Fix (deferred, not blocking):** watch for a future split by
concern (execution/topology vs budget/recovery vs registry) if it keeps growing; no action this wave.

## F2: inlined-verbatim copies of the shipped tools rely on manual SOURCE OF TRUTH comments, not a convergence check
**Severity:** Low
**Layer:** 2.1 (one concept once — deliberate copies need a mechanical convergence check)
**Claim vs reality:** the Workflow runtime cannot import, so `cover-gates.mjs` (and now the evidence-gate
predicate) are inlined VERBATIM into the drivers with "keep in sync" SOURCE OF TRUTH comments. This is a
pre-existing, sanctioned pattern (the runtime constraint is real), but the sync is prose-enforced, not
mechanically checked. **Fix (deferred):** a convergence test asserting each inlined copy's gate bodies match
the shipped source would harden the pattern — logged as a skill-gap in lessons.md, not owed this wave.

## Rubric items checked CLEAN

- **L1.1** frontmatter promise = body — the skills' job statements are unchanged; my additions are mechanisms
  the body already commits to (Cover gate battery, kickoff checklist, budget rail).
- **L1.2** guardrail claims vs mechanism — the new gates are PAIRED code+prose with **disclosed** residuals
  (evidence-gate: code at chokepoints, prose-only path disclosed; kickoff-preflight: code for workflow-run
  members, prose residue disclosed). Honest about what is enforced vs prose-tier.
- **L1.4** citation audit — all new pointers resolve (skill-lint clean); the dangling ref was fixed.
- **L2.1** one concept once — the "poll, don't wait" canonical was **consolidated** from mine-verify-repo
  (canonical) + mine-verify-cover (mirror) into ONE shared §Stage-completion section; siblings now point to
  it. Duplication REDUCED.
- **L2.2 / L2.5 (AP1)** mechanical checks over exhortation / dead-letter enforcement — three previously
  advisory obligations gained executors this wave: the evidence gate (`evidence-gate.mjs`), the kickoff
  preflight (`kickoff-preflight.mjs`, replacing the explicitly "Wired-but-advisory" label), and the
  mechanized stage firing (`stage-watcher.mjs`). Advisory → enforced.
- **L3 (resumable/long-running overlay)** — the run journal (`run-journal.mjs`) adds a state file at phase
  boundaries (P2), an idempotency check at entry (`reconcile` — double-reconcile is a no-op), and a
  finalize-what-exists path (`complete-tail`, AP6). The resumable overlay is now satisfied where it was a
  same-session-only limitation.
- **L3 (fan-out overlay)** — the watcher derives run state from the WRITTEN journal (disk), never an agent's
  final message.
- **Supersede discipline** — both superseded items (the same-session-resume sentence, the Wired-but-advisory
  label) are preserved verbatim inside supersede notes, never silently rewritten; grep-confirmed each survives
  only inside its note.

## Verdict

**ACCEPT.** Layer 0 clean; no Critical/High/Medium findings. The F7 changes are a net fitness improvement
(advisory→enforced, duplication reduced, the resumable + fan-out overlays satisfied). The two Low findings
are deferred watch-items (a future size split; a convergence test for the inlined copies), neither blocking
and both logged forward.
