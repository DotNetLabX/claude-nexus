# Lessons — adhoc-SpecDrivenCoverValidate

## Architect Lessons

- **Re-ground before planning a "next increment" — the user's premise can be a version behind the repo.**
  The ask was "write the full-build plan"; the user believed no full build existed. It did —
  `adhoc-SpecDrivenHarnessBuild` (Increment 1) was COMPLETE/APPROVED. Globbing `docs/specs/` for the
  workstream + reading `harness/` (the presence of `spec-cover.workflow.js` + `spec-diff.mjs` was the tell)
  surfaced it before I planned a duplicate. The spike→Inc1→Inc2 arc is only visible by reading the artifacts,
  not by trusting the conversation's framing. (Applied: check-session-transcripts / feature-wins memories.)

- **Aged acceptance premises rot against live state — re-run the check at plan time, never inherit it.**
  Inc-1's AC-6 said "pre-fix arm = KG HEAD (carries `> 0.01`)". By plan time the `+ 1e-9` fix was **committed**
  (`0811132`), so HEAD was the *patched* arm and the arms had flipped. A `git log -S`/`git grep` at plan time
  caught it; quoting the prior spec would have shipped a plan whose primary known-answer arm was wrong. The
  fix also moved the line (272→276) — refer to a finding by symbol, never a line. (recheck-branch /
  reground-feedback memories, applied to a sibling spec's own evidence.)

- **The code-grounded critic earned its mandate — it found 2 HIGH the doc-accurate plan missed, both forward-design.**
  My plan described the *current* code correctly (the inlined copy, the hardcoded SQL prompt, `labelRed`
  already taking `ruleOrder`), but leaned on the already-working SQL/`null` path for the *new* surface. A
  doc-conformance pass cannot catch "the named acceptance test passes against unchanged code" — only reading
  `labelRed` + tracing the Slack values does. This is the shared/external-artifact mandate paying off exactly
  as predicted (in-context/doc critics are blind to this class).

- **"Generalize off one validator" was three axes, not one.** The obvious lock was `RULE_ORDER`. Reading the
  2nd target's shape revealed two more invisible single-class assumptions: the **identity type** (string rule
  name vs enum value) and — the load-bearing miss — the **pass-sentinel** (`labelRed` hardcodes `null` as
  "pass", but Slack's pass is the enum `Valid`). A generalization plan must enumerate every place the one
  exemplar's shape leaked into "general" code, not just the headline constant. The pass-sentinel only became
  visible by tracing `labelRed`'s case-3/case-4 guards against a concrete second validator's values.

- **Pick the 2nd validation target by *shape difference that exercises the generalization*, not just "another class."**
  `SlackSignatureVerifier` was the right pick precisely because it is first-violation-wins (same supported
  shape) yet returns an **enum with a non-`null` pass** — different enough to prove the generalization,
  same-shape enough to stay in scope. It also already had golden rules (no PO authoring blocker). An Explore
  scan of candidate classes (ranked by shape + dependency surface) is the cheap way to find that fit.

- **A done-check on a half-operator-owed increment is a *split* verdict, not a single PASS/FAIL.** Steps 1–3
  (code) are Implemented + offline-proven (AC-1/2/6); Steps 4–6 (live runs + report) are Deviated/operator-owed
  with AC-3/4/5 **outstanding**. The verdict must PASS the developer's delivered scope yet explicitly flag the
  **open production gate** so the team lead doesn't read reviewer-approval-of-the-code as increment-complete.
  The honest shape is "code done + reviewable; live acceptance is a separate outstanding track" — verdict
  binary per step, risk disclosure not.
- **Skill-log scoping survived an odd `.pipeline-state` token.** The state read `reviewer:review` (not
  `developer:implement`), but the developer's log entries carried the *same* `reviewer:review` token — so the
  round-keying still matched (scope by agent+session+the in-force token, not by the token's expected *label*).
  `nexus:tdd` was in the log for the one non-`None` step; the verdict held.

## Developer Lessons

- **String-identity sync guards need normalization when the two copies evolved at different verbosity levels.**
  The lib's inlined functions carry full inline comments (`// Case 1 —`, `// Defensive:`, etc.) and blank-line
  structure; the workflow's copy was stripped (comments present in `labelRed` but absent in the other 6). A
  literal byte-comparison guard would have permanently failed unless I updated all 6 other functions. Instead,
  normalizing (strip comment-only lines and blank lines) before comparing catches code-level divergence while
  tolerating the verbosity mismatch. When writing a sync guard for a partially-stripped inline copy, strip
  comments and blank lines from both sides before comparing — not from source alone.

- **Confirm the guard actually detects drift before calling it done.** I ran the sync guard against HEAD both
  before AND after my stash-restore to confirm: (a) the guard passes with my changes, and (b) the 4 pre-existing
  test failures are not caused by my changes. A guard that always passes is no better than no guard — verify it
  by running against a known-bad state or by confirming the normalization strips only the known differences.

- **`ruleOrder` in the workflow defaults to `null`, not the SQL constant.** `const RULE_ORDER_CFG = _args.ruleOrder ?? null` — null propagates to `labelRed`'s `r?.ruleOrder ?? RULE_ORDER` fallback (the SQL constant in the lib), preserving backward compat for any SQL-targeted run that was invoked without an explicit `ruleOrder` arg. This makes the null the right default, not the SQL array — the SQL array in the workflow constant would've silently applied the SQL order to a Slack run if the caller forgot `ruleOrder`.

- **A Slack workflow test fixture needs no miner agent when all rules have attestations.** The `slackFixtures()` helper builds a 4-element sequence (spec-load → spec-cover → runner → report-write). If all rules have `codeAttestation`, no rule enters `route: 'miner-needed'`, so the miner agent never fires. Building a 5-element fixture with a miner that never contributes would over-specify the test and couple it to an internal routing detail the plan doesn't require.

## Reviewer Lessons

- **Sync guard normalization — confirm the stripping is narrow, not broad.** When reviewing a guard that normalizes before comparing, trace the normalization rule against plausible code-change scenarios (change a code token on a mixed code+comment line; add/remove a code-only line; change only a comment). If mixed lines are preserved and code-only lines are preserved, the guard is sound. The LOW carry-over was correct to confirm rather than blindly accept.
- **Operator-owed runbooks need a `specTests` field when the workflow default is target-specific.** The workflow's `SPEC_TESTS` defaulted to `GeneratedSqlValidatorSpecTests.cs` — fine for SQL, wrong for Slack. The Slack target JSON and its runbook annotation didn't include this override, creating a documentation gap. For operator-owed steps whose only deliverable is the runbook, include all non-obvious arg overrides in the runbook's `_args` annotation, not just the semantically interesting ones.
- **The AC-1/AC-2 workflow test for a second validator is non-vacuous when the pre-change code would produce a wrong label.** The Slack over-rejection test asserts `label: 'over-rejection'`; before the `okValue` fix, the hardcoded `null` sentinel would route it to `unrecognized-rule` (wrong). This confirms the test was genuinely RED before the fix — a sound red-first check. When reviewing a "second validator" test, always ask: would this assertion have passed against the unchanged code? If yes, it is vacuous.
