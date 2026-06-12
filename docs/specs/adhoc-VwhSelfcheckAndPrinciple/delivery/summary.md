# VWH Adoptions: Allocation Principle + Selfcheck — Summary

## Status: COMPLETE

## What Was Built
- The "allocation principle — cheapest correct locus" section added to `docs/architecture/README.md` (with Contents link and pointers from ADR-7/ADR-23), and the learner's classify step extended with a third axis (c) locus.
- T1 lint extensions: ADR-14 block-equality test in `convergence.test.mjs`; new `wiring.test.mjs` (duplicate matcher, orphan command, `${user_config.*}` resolution, agent-name reference resolution); report-only salience tooling (`scripts/salience-report.mjs` + `salience.test.mjs`); local `scripts/selfcheck.mjs` aggregator documented in `tests/README.md`.
- Proposal doc §A1 + §A3 Tier 1 marked delivered; nexus bumped 1.7.1 → 1.7.2 (PATCH), `commands/learner.md` regenerated, omni twin sync verified.

## Key Outcomes
- 5 files created, 8 modified (slug delivery artifacts aside)
- Build green: 117 tests pass / 0 fail; every new lint verified red-then-reverted; `claude plugin validate --strict` passed
- Review: APPROVED, cycle 1/3, no blocking findings (2 LOW observations recorded in review.md)
- Step 1 done check: PASS (all 8 steps COMPLETE)

## Deviations from Plan
- `selfcheck.mjs` uses the glob form `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` instead of the plan's bare-dir form (Node ≥22 regression); same gate, matches CI.

## Notes
- The nexus-dotnet changes (`plugin.json`, `CHANGELOG.md`, `conventions/csharp.md`) belong to `adhoc-DotnetSkillSweep` and were deliberately excluded from this slug's commits; they remain in the working tree.
- `.claude/nexus-agents.json` (model config: architect/po→fable, developer→opus) is local session config, left uncommitted.
- Run had recoverable runtime issues (SubagentStop notification storms ×2, salvage-transcript miss, 0-byte spawn output file, one Phase-1 boundary collapse on the killed sonnet developer) — all documented in communication-log.md Runtime / Plugin Issues Log; 2nd storm occurrence meets the learner's promotion threshold.
