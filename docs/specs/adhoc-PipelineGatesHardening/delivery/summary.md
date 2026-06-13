# Pipeline Gates Hardening — Summary

## Status: COMPLETE

## What Was Built
Two pipeline enforcement gates for breaches that were previously only detected (or not at all),
both built on a detect-then-gate substrate (log the fact deterministically, gate on the logged
fact — a background subagent's PreToolUse deny is dropped, ADR-13, so prompt-level prevention is
impossible). **Gate A** (skill non-invocation): a new always-on `skill-tracker.js` hook logs every
`Skill` call to `skill-invocations.log`, and the architect done-check now scores skill-conformance
against that log instead of the fakeable self-report. **Gate B** (gate fabrication): the boundary
detector flags rogue subagent git writes, and `team-lead.md` gains a deterministic void-and-rerun
action matrix with a `git log` author check as the guaranteed backstop. Shipped as nexus **1.8.0**
(MINOR).

## Key Outcomes
- **Files:** 2 created (`skill-tracker.js`, `tests/unit/skill-tracker.test.mjs`); 8 source files
  modified (`boundary-detector.js`, `boundary-detector.test.mjs`, `hooks.json`, `architect.md`,
  `team-lead.md`, `agents-workflow.md`, `implementation-format/SKILL.md`, `enforcement.test.mjs`);
  1 doc (`docs/architecture/README.md`, proposed ADR-24); release artifacts (`plugin.json`,
  `CHANGELOG.md`, regenerated `commands/architect.md` + `commands/team-lead.md`); the `omni` twin
  regenerated (private, external to this tree — `gen-omni.mjs --check` green).
- **Tests:** full suite **127 pass / 1 fail / 128** — the 1 fail is the documented pre-existing,
  out-of-scope `nexus-dotnet:create-module-claude-md` frontmatter failure (committed `75ccd2b`).
  All 11 new tests green; no regression.
- **Review:** plan — code-grounded critic **REVISE** → architect re-grounded against the tree →
  **ready**. Implementation — architect Step-1 done-check **PASS** (all 8 Implemented, 0 Missing);
  Step-2 reviewer **APPROVED** (1 LOW only) + Codex **GO** (2 best-effort WARNs). Approved on
  **cycle 1/3** — no fix cycle needed.
- **Commits:** `f60abb3` (plan) + the implement commit (this close).

## Deviations from Plan
- **CRITICAL-1 (caught by the critic):** the plan's original premise that `## Skills Used` + the
  done-check skill-conformance check were *new* was false — they ship since 1.5.0. The architect
  re-grounded Steps 3-4 so Gate A *re-points* the existing check's authoritative source to the new
  log rather than re-building it. The net new surface is still two genuine detection mechanisms →
  MINOR confirmed.
- **Stale test count (Q1):** the plan cited 11 existing boundary-detector tests; there are 10. All
  preserved (incl. the `:76` Bash-no-verb no-op); the binding directive "preserve every test" held.
- **Step 9 (release) run by the team lead, not the developer** — the bump must be atomic with the
  team-lead commit and run on the final agent-doc state.

## Notes
- **ADR-24 is PROPOSED — owner ratifies.** It is not yet a decided architecture record (banner in
  `docs/architecture/README.md`).
- **Gate A's one platform dependency:** it keys on `tool_name === 'Skill'`. The developer verified
  this against 20 real session transcripts (14 occurrences) — Gate A is not false-green. A future
  platform rename of that tool string is the residual risk, documented in ADR-24 Tradeoffs (same
  risk profile as every hook).
- **Gate B's Bash regex is best-effort by design** — a `git -C /path commit` form or a shell alias
  can slip it (Codex's 2 WARNs). The Step-6 `git log` author check is the guaranteed retroactive
  catch (it sees the commit regardless of how it was issued). No fix owed; flagged for the owner if
  tighter regex coverage is ever wanted.
- **Live guardrail validation is owner-owned and deferred** — the plan's Testing Strategy defers a
  real pipeline run that deliberately fires both gates to the owner; the JS units prove the
  mechanism (the build-time obligation).
- **Pre-existing unrelated red:** `nexus-dotnet:create-module-claude-md` declares an unknown
  frontmatter key `disable-model-invocation` (from today's earlier DotnetSkillSweep, `75ccd2b`).
  Out of this `nexus`-only feature's scope — worth a separate cleanup pass.
- **Consumer action:** a consuming project must `/plugin update` to 1.8.0 to receive these gates
  (version-keyed cache; a stale install gets none of it).
- **Two plugin runtime issues surfaced during this run** (recorded in `communication-log.md` for the
  learner): RT-1 — the critic and other agents stranded their deliverables behind a "Done."/"Complete."
  lifecycle closer (recovered by transcript probe); RT-2 — `salvage-transcript.js`'s longest-recent
  heuristic is defeated by a multi-line fenced closer (it returned an 85-char closer over a 21k-char
  review). Both are live findings on the very surfaces this pass touches.
