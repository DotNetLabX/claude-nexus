# Critic Review — Unattended Autonomy (v1) tech-spec

**Mode:** 2 (Tech-Spec vs ADR register, code-grounded)
**Reviewed:** `docs/specs/adhoc-UnattendedAutonomy/definition/tech-spec.md`
**Verdict:** GO-with-changes
**Date:** 2026-06-16
**Critic agentId:** ac61d7778f6cf856d (resumable)

> Durable record of the critic's findings (ADR-13: the critic writes no file; the architect
> persists). Architect dispositions appended per finding — all accepted.

## Code-grounded claim verification
| Spec claim | Critic verdict | Evidence |
|---|---|---|
| No `Stop`/`SubagentStop` hook today; gate net-new | CONFIRMED | `hooks.json` has only SessionStart/PreToolUse/PostToolUse; `Stop` tokens elsewhere are menu text. |
| Unattended already fails-closed in spirit (`:319`/`:330`) | CONFIRMED | `team-lead.md:319` retry-once-then-skip-record; `:330` fail-run-record-never-escalate. |
| `Force-accept` = `:327`, attended-only | CONFIRMED | `:330` already makes it unreachable unattended. |
| Dogfood target exists | CONFIRMED | `tests/lint/*` (7), `tests/unit/*` (15), `scripts/selfcheck.mjs` present. |
| `[UNATTENDED]` lives in `pipeline-gate.js` | **PARTIALLY REFUTED** | `pipeline-gate.js` has **no** `UNATTENDED` ref; it is fail-open-by-design but does not read the flag. Real homes: `team-lead.md:383`, `agents-workflow.md:56`, `questions-format`. |

## Findings & dispositions
| ID | Sev | Finding | Architect disposition |
|----|-----|---------|------------------------|
| CR-1 | CRITICAL | The "foreground team-lead Stop boundary" (AC-1.1/ADR-31) is asserted, never shown. Team-lead can be a subagent (ADR-21) → not always foreground; and a background worker's `SubagentStop` fires for the *worker*, not the team-lead — is the gate per-phase or only end-of-run? Spec conflates "hook fires/runs" with "deny honored" (the ADR-13 distinction). | **ACCEPTED.** Reframed AC-1.1 to key the gate to `SubagentStop` after the implementation subagent (Probe P1 confirms PostToolUse/SubagentStop *runs* on background subagents — the gate needs only run+record, not deny). Added a **Probe-P1 spike as a prerequisite to `Ready`** + an owner scoping question (unattended = standalone foreground team-lead?). |
| CR-2 | HIGH | Inventory wrongly places `[UNATTENDED]` in `pipeline-gate.js`. | **ACCEPTED.** Corrected the inventory row. |
| CR-3 | HIGH | AC-0.3 golden test under-specified — names no observable. | **ACCEPTED.** AC-0.3 now names the concrete invariants (no-op on output+filesystem flag-off; byte-identical hook decisions vs pre-v1 fixtures; advisory verify doesn't alter exit codes/block). |
| CR-4 | MED | AC-1.2 "one code path" vs AC-0.2 "branches on flag" stated as identical; the real fork is verdict *consumption* (where ADR-19 drift lives). | **ACCEPTED.** Reworded AC-1.2: verify *execution* is one path; the only branch is verdict *consumption* — one testable fork, not two verify implementations. |
| CR-5 | MED | AC-3.2 resume path not wired to existing `communication-log.md`+`.pipeline-state` idempotency (ADR-19) → risk of cold-restart resume. | **ACCEPTED.** AC-3.2 now points resume at the ADR-19 resume state (summary.md⇒done, log⇒resume-from-step). |

## ADRs-to-extract check (no conflicts)
- ADR-30 (additive mode): genuinely new. Clean.
- ADR-31 (Stop-boundary gate): new, **contingent on CR-1**; text must claim only run+record (advisory), not deny — within Probe-P1's confirmed behavior. **Disposition:** ADR-31 note updated accordingly.
- ADR-32 (fail-closed→queue): new; consistent with ADR-15/19; should cite ADR-15 as the unattended *replacement* for the graduated menu. **Disposition:** note added.

## Explicit verdicts
- Attended-preservation: SOUND in design, not yet airtight until AC-0.3 names its assertion (CR-3 — now fixed).
- Foreground-Stop-boundary: UNVERIFIED — the CRITICAL; needs the spike (CR-1).
- D1 (`.claude/verify.json`): SOUND.
- D2 (queue dir+index+resume): SOUND but must reuse ADR-19 idempotency (CR-5 — now fixed).
- D3 (budget governor): SOUND, lowest-risk; caveat — requires `token_audit` enabled (ADR-11 opt-in) or it's inert. **Disposition:** D3 note added.

## Open questions (owner)
- Does unattended always run the team-lead as the standalone/foreground (`claude -p`) main session? If yes, CR-1's team-lead-as-subagent sub-case leaves v1 scope (CRITICAL→HIGH). **Routed to owner.**
- Does a `Stop` fire between phases on the main session, or only at session end? **Empirical — the core of the CR-1 spike.**
