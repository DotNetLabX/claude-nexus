# Mine→Verify→Cover PHP Adapter — Summary

## Status: COMPLETE

## What Was Built

The fourth stack adapter for the mine-verify-cover method: a PHP toolchain (Docker `mvc-php-probe`
image — PHP 8.4, PHPUnit 12, Infection 0.34, PCOV), the `harness/cover-php.workflow.js` thin fork
with an Infection→Stryker translation seam authored against the probe-*observed* JSON map, and the
shipped **`nexus-php` 0.1.0** plugin (`mine-verify-cover-php` SKILL.md carrying five live-run-proven
lessons). Proven live on two structurally unlike classes in `fmcg_platform` — and the campaign found
and fixed a genuine production bug (`isFullWeek()` dead code, Carbon 3 float-vs-int strict compare).

## Key Outcomes

- Deterministic block committed at `f4f3c07` (harness assets, workflow fork, contract, offline-guard
  extension); ship block (this commit): `plugins/nexus-php/` (new), marketplace + gen-omni + test
  wiring, core-skill 4-site update, nexus 1.25.0→1.25.1, harness residue fixes.
- Gates: 490/490 CI tests green; `claude plugin validate --strict` clean on both plugins; omni twin
  regenerated and `--check`-verified in sync; skill-lint OK.
- Reviews: block {1,3,4,5} — dual-lane (reviewer + Codex), REQUEST CHANGES → 4/4 fixed → APPROVED
  after 1 cycle. Ship block {8,9} — done-check PASS; mandatory code-grounded review APPROVED +
  Codex GO first round; 4 non-blocking findings (2 MEDIUM, 2 LOW) + 1 optional fixed post-approval.
- Live runs: Mine→Verify ×2 (15 + 35 skeptic-verified rules, zero miner contradictions); Cover ×2
  (89% and 88% mutation kill, honest gate refusals both traced to the one genuine production bug).
  Campaign cost ≈ 1.53M subagent tokens across four workflow runs.
- Consuming repo (`fmcg_platform`, branch `adhoc-MineVerifyPhpAdapter`, commit `37b8a90f6`,
  **not pushed** per owner policy): one-line bug fix, two mined KBs, two landed suites
  (112 tests / 1,291 assertions green), full campaign report (`mvc-report.md`).

## Deviations from Plan

- Q1 (architect, owner-delegated): the single pass split into deterministic block → operator live
  runs → post-run ship resume, along the plan's own ownership seams.
- Step-6/7 formal verdicts were REFUSED (honest): run #1 on the genuine `isFullWeek` bug; run #2
  solely on run #1's known-bug pin sharing the workspace suite (its own 42-method suite green).
  Per plan, honest refusal = valid step outcome; suites landed in fmcg only after the bug fix.
- `bump-plugin.mjs` over-bumped the brand-new plugin (0.1.1) — corrected to 0.1.0; gen-omni needed
  the `wantPlugins` companion entry beyond the plan's named `mirrorDir`; eris dev-dependency
  blocked by fmcg platform requirements → property test converted to a deterministic sweep.

## Notes

- fmcg_platform: merge of branch `adhoc-MineVerifyPhpAdapter` to `develop` is the owner's call;
  never push that repo from here.
- The omni twin (`../omni`) was regenerated; its mirrored commit follows this repo's ship commit.
- Follow-up candidates (documented, not owed): in-repo/Pest execution variant for the PHP adapter;
  run-#2's 21 unclassified mutation survivors (triage list in `mvc-report.md`); known-bug
  group/per-target suite scoping support in the shared gate infra.
