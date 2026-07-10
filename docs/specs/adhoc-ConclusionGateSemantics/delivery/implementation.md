# Conclusion-Gate Verdict Semantics — Implementation

## Files Modified

- `plugins/nexus/skills/diagnose/SKILL.md` — Step 1. Four additive insertions (no existing text
  removed or reworded), net +3 lines (`git diff --numstat`: 5 added / 2 modified-in-place):
  1. **Phase 4 record step** (`- Record: which hypothesis confirmed/eliminated…`) — extended inline
     with the elimination rule: a hypothesis is *eliminated* only by recorded falsifying evidence;
     an ambiguous probe leaves it `inconclusive` (the resting verdict), alive and testable.
  2. **Phase 4 gate line** (`**Gate:** Root cause identified with evidence.`) — extended inline with
     the causal-verdict grammar: names (a) the ONE variable whose change **flips the outcome**,
     (b) the confirming probe, (c) what falsified the ranked alternatives; multiple changed
     variables ⇒ the verdict carries the `confounded` tag (keep bisecting, or override with a logged
     reason). Explicitly scoped as governing the *verdict*, distinct from the one-variable-at-a-time
     guardrail that governs *probing*.
  3. **Integration with Circuit Breaker** — new paragraph: the pre-escalation kill rule (an
     "approach is unworkable / unfixable" conclusion needs ≥2 distinct falsifying probes or a logged
     override), composed with (never replacing) the 3-attempt breaker; plus the reconciling clause
     (critic F2): escalation-with-evidence-log is a handoff, not a kill — never gated by the
     elimination rule; "3 hypotheses exhausted" = each top hypothesis probed at least once
     (confirmed / falsified / `inconclusive`), so inconclusive-alive hypotheses count toward the
     escalation trigger.
  4. **Guardrails** — one new bullet naming both rules (causal verdict names its cause-variable or
     carries `confounded`; `inconclusive` is the resting verdict — one ambiguous probe never kills a
     hypothesis). Worded with "cause-variable" (not "flips the outcome") to keep the `flips the
     outcome` signature at exactly one hit, per the tech-spec AC-1 note about the guardrail echo.

- `plugins/nexus/skills/review-format/SKILL.md` — Step 2. Two additive insertions, net +3 lines
  (`git diff --numstat`: 3 added / 0 removed):
  1. **Step 2 checklist** — one new bullet: a finding asserting causation names the mechanism
     (the variable/path producing the failure) or its causal attribution is tagged `correlation-only`
     (capped at MEDIUM), **with the severity-floor carve-out (critic F1):** a directly-observed
     CRITICAL/HIGH impact (data loss, security, silent incorrect output) keeps its severity floor —
     impact filed at full severity, unproven attribution routed to Open Questions; never collapse
     both into a non-blocking MEDIUM.
  2. **`## Confidence Score` section**, immediately after the `Report cutoff — ≥80` paragraph (the
     single anchor, critic F4) — new paragraph: the rule sentence + the carve-out + the explicit
     non-change (the ≥80 cutoff remains the sole thin-evidence threshold; this adds a *grammar*
     requirement, not a second number).

## Key Decisions

- **Insertions 1 and 2 in diagnose were made inline** (extending the existing record bullet and gate
  line) rather than as new standalone lines, to honour the plan's "≤20 lines — this skill is loaded
  mid-debugging; weight is a cost" constraint. Net additions: 3 lines (diagnose), 3 lines
  (review-format) — well inside the ≤20 / ≤12 budgets.
- **Guardrail bullet phrased to avoid a second `flips the outcome` hit.** The tech-spec AC-1 grep is
  `flips the outcome ≥ 1` (relaxed from `=1` by critic F3 precisely because a guardrail echo is
  brittle), but the plan Step 1 acceptance still reads `=1`. Wording the guardrail as "names its
  cause-variable" satisfies both readings (exactly 1 hit) with no loss of meaning — the plan's
  insertion-4 text itself says "name their variable", not "flips the outcome".

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Plan Skill Mapping: `(none)`, TDD no — additive prose edit, grep-checkable acceptance |
| 2 | None | Plan Skill Mapping: `(none)`, TDD no — additive prose edit, grep-checkable acceptance |
| 3 | None | Plan Skill Mapping: `(none)`, TDD no — gate battery only |
| 4 | release-plugin | Invoked (skill-first); **bump intentionally NOT applied** — see Deviations (concurrent-feature tree contamination) |

## Verification (Step 3 gates)

| Check | Command | Result |
|-------|---------|--------|
| AC-1 (causal-verdict gate) | `grep -c` on diagnose | `flips the outcome`=1 (≥1 ✓), `confounded`=2 (≥1 ✓) |
| AC-2 (elimination + kill) | `grep -c` on diagnose | `inconclusive`=3 (≥2 ✓), `unworkable`=1 (≥1 ✓) |
| AC-3 (causal-finding rule) | `grep -c` on review-format | `correlation-only`=2 (≥2 ✓) |
| AC-4 (scope — my feature) | `git diff --name-only -- plugins/` | My contribution = exactly the two SKILL.mds. **Tree also carries a concurrent feature's files** (see Deviations). |
| AC-5 gate half — tests | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 509/509 pass, 0 fail |
| AC-5 gate half — selfcheck | `node scripts/selfcheck.mjs` | 4/5 pass; the 1 FAIL is `gen-omni --check` (twin drift), attributed below — not a defect in this feature's work |

`gen-omni --check` drift breakdown (4 paths): `hooks/hooks.json` + `hooks/scripts/learner-cadence.js`
belong to the concurrent adhoc-LearnerCadenceNudge feature; `skills/diagnose/SKILL.md` +
`skills/review-format/SKILL.md` are mine and sync when `gen-omni` runs post-bump (release-plugin
step 5, deferred with the bump). No standalone action owed by this feature to make it green.

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Shared working tree holds two concurrent features | medium | architect / team-lead | `git diff --name-only HEAD -- plugins/` shows adhoc-LearnerCadenceNudge's `agents/learner.md`, `commands/learner.md`, `hooks/hooks.json`, `hooks/scripts/learner-cadence.js` alongside my two SKILL.mds | Release bump not applied — would entangle both features. See questions.md Q1. |
| `gen-omni --check` red pre-commit | low | reviewer | selfcheck output | Expected: twin syncs at release-plugin step 5 (post-bump). Not a code defect. |

## Deviations from Plan

- **Step 4 (release bump) NOT applied — blocked on concurrent-feature tree contamination.** The plan
  Step 4 mandates `release-plugin` PATCH + "bump in the same commit". I invoked the release-plugin
  skill (skill-first) and ran the non-mutating `bump-plugin.mjs --dry-run` — it proposes the correct
  PATCH (`1.26.1 → 1.26.2`) but its reasons span **both** features (agent/command/hook changes I
  never touched, from adhoc-LearnerCadenceNudge whose files now share this working tree). Applying
  the bump now would:
  1. Classify + write a CHANGELOG over two features at once (the stub spans both).
  2. Set `plugin.json` to `1.26.2` in the shared tree, creating the CLAUDE.md-documented false
     signal (`cur != HEAD ⇒ "already bumped, ride along"`) that would make the parallel developer
     wrongly skip their own feature's bump → CI `plugin-release-check` failure on the second commit.
  3. Make `gen-omni` (release-plugin step 5) sweep the learner files into my omni twin.
  The developer never commits and the team lead owns commit **sequencing** (hard rule) — and the
  correct next patch number depends on which feature commits first. **Recommendation:** the team
  lead sequences the two features (separate commits, or one git worktree each), and the committer
  applies `node scripts/bump-plugin.mjs` (PATCH) + `gen-omni` at commit time for this feature, with
  the CHANGELOG one-liner: *"conclusion-gate verdict semantics in diagnose + review-format (causal
  verdicts name their variable; kills need falsifying evidence)"*. Full detail + confidence in
  questions.md Q1.

*Status: IN PROGRESS — content (Steps 1–2) + gates (Step 3) complete and verified; Step 4 (bump)
blocked on team-lead sequencing (questions.md Q1). Developer, 2026-07-10.*
