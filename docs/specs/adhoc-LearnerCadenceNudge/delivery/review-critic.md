# Critic Review — Plan Review (code-grounded) — adhoc-LearnerCadenceNudge

**Verdict:** GO-with-fixes · **Date:** 2026-07-10 · **Mode:** 2, code-grounded (live hooks.json,
hook scripts, tests/lint, learner.md, working tree). Verified TRUE: stdin field
`tool_input.file_path` (register-persona.js:37); CI glob auto-pickup; all three signatures virgin;
44 summary.md files exist now; no learner.md region collision with adhoc-DecisionLog.

## Findings (all adopted)

- **[HIGH] H1 — duplicate `(PostToolUse, Write|Edit)` matcher fails `wiring.test.mjs:13-36`**
  ("no two hook entries under the same event share a matcher"). Step 2's "add an entry, same shape
  as register-persona" reads as a second Write|Edit group → red CI; AC-2's grep passes either way.
  **Fix:** append the command object to the EXISTING `Write|Edit` group's `hooks` array (the
  SessionStart group already runs two commands — the precedent).
- **[HIGH] H2 — delivery envelope: a raw stdout line has zero in-repo precedent for reaching the
  session; the proven mechanism is `process.stdout.write(JSON.stringify({ systemMessage }))`**
  (read-tracker.js:79, boundary-detector.js:151). AC-4's substring grep was **false-green** (matches
  both shapes — verifies production, not delivery). The feature could ship green and fire into the
  void — the exact VWH failure it exists to fix. **Fix:** pin the envelope; AC-4 asserts stdout
  parses as JSON with a `systemMessage` containing the line. Residual (LOW, recorded):
  systemMessage delivery to a *background subagent* team-lead is unverified per read-tracker's own
  note — fine for main-session closes.
- **[HIGH] H3 — Step 4's bump collides with MineFamilyCore's uncommitted `plugin.json`/CHANGELOG**
  (CLAUDE.md double-bump rule: bump only when `cur` == committed HEAD). **Fix:** sequencing clause —
  this bump runs only after the sibling bump is committed; team-lead-owned closure ordering.
- **[MEDIUM] M1 —** Step 3's anchor "existing end-of-run bookkeeping" doesn't exist in learner.md.
  **Fix:** a new workflow **step 8** after step 7 (Critic review before close).
- **[MEDIUM] M2 —** stamp on "run end" would let a STOP/classification-only learner run silently
  reset the counter. **Fix:** stamp ONLY when promotions were actually applied (a completed
  consolidation).
- **[MEDIUM] M3 —** "every failure path is swallowed" contradicts "missing stamp fires `never`"
  (ENOENT caught → inert flagship case). **Fix:** narrow stamp read mapping ENOENT/parse-fail →
  `null`; outer swallow reserved for unexpected errors (read-tracker.js:53 precedent).
- **[MEDIUM] M4 —** mirroring register-persona's top-level stdin+`process.exit(0)` while exporting
  the pure fn would kill the test runner on import. **Fix:** guard the I/O main
  (`require.main === module`-equivalent); pure fn side-effect-free.
- **[LOW] L1 —** displayed date source unpinned. **Fix:** mtime drives BOTH count and display; the
  stamp's ISO content is informational-only.
- **[LOW] L2 —** first fire will read `44 slugs … (never)`, not "~10" — by-design (Decision 4);
  noted in Migration Notes so it isn't mistaken for a bug.
- **Gap (insurance):** learner stamp step does `mkdir -p .claude/audit` first.

## Systemic note (3 HIGH → adversarial mode ran)

The plan was strong on the unit (counting, threshold, testability, verified stdin field) and weak
on every **integration surface**: delivery envelope, wiring lint, release coordination. The
definition-review's "wiring shape verified against live hooks.json" confirmed an entry *exists* —
not what adding a sibling does to the lint, nor the output convention. Integration surfaces need
their own verification pass, not incidental coverage.
