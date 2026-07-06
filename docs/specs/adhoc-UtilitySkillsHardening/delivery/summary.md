# Utility Skills Hardening — Summary

## Status: COMPLETE

## What Was Built
Applied the six consolidating fixes from the routed dotnet-microservices utility-skill audit
(`nexus-1.23.1-2026-07-06.md`, Entries 1–6). The `improve-skills` lint gained real capability:
E6's citation net now covers **file-shaped** `scripts/`/`assets/` paths and resolves a citation
skill-relative **or** at the `.git`-anchored repo root (never `process.cwd()`), plus two new
warnings — **W3** (SKILL.md body >500 lines) and **W4** (a cited `references/*.md` that itself
cites another reference, references-only scope). The `evaluate-skill` rubric shed a dead-letter
check and gained a degrees-of-freedom clause; the authoring recipe and `improve-skills/SKILL.md`
now sanction a bundled `scripts/` folder. Owner-escalated **MINOR** release → **nexus 1.24.0**.

## Key Outcomes
- **Files:** 6 plugin files + `docs/skill-backlog.md` + `tests/unit/skill-lint.test.mjs` modified;
  slug delivery artifacts created (plan, implementation, review, review-codex, lessons, summary,
  communication-log).
- **Tests:** skill-lint suite 16 → **25** green; full mandated suite **484/484**
  (`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`); estate-wide lint sweep **exit 0**
  across all 3 plugins (58 skill folders), both DO-NOT-BREAK sites clean.
- **Review:** Step 1 done-check **PASS** (3 Implemented, 1 Deviated–valid); Step 2 **APPROVED**,
  0 fix cycles. Standard+Codex — Codex cross-check reconciled (see Deviations).
- **Release:** `bump-plugin --check` exit 0; nexus 1.24.0; omni twin synced at closure.

## Deviations from Plan
- **gen-omni twin sync + commits were team-lead-owed by construction** (plan Step 4) — not a gap.
  The architect's done-check scored this the sole "Deviated (valid reason)" step; sequenced
  post-implementation so the omni footer pins the impl commit sha.
- **Codex returned NO-GO; reconciled finding-by-finding to non-blocking.** Its *major* was the
  gen-omni `--check` drift — the deferred-by-design twin sync above (ADR-20 two-commit protocol),
  not a defect. Its *minor* (shared with the reviewer's LOW #1) was a doc nit: the plan cited the
  bare `node --test tests/` command, which regressed on Node ≥22; patched to the glob form at
  closure.

## Notes
- **Plugin tooling footgun surfaced (logged, out of scope):** `scripts/bump-plugin.mjs` has no
  unknown-flag guard — the reviewer ran `--help` and it silently applied a real bump
  (1.24.0→1.24.1 + duplicate CHANGELOG entry). Caught via `git diff --stat`, hand-reverted,
  verified byte-clean back to 1.24.0. Worth a follow-up guard on bump-plugin's arg parsing.
- Lessons unprocessed unless the user opts in (learner not run).
