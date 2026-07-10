# Lessons — adhoc-LearnerCadenceNudge

## Architect Lessons

- **Integration surfaces need their own verification pass — "the pattern exists" is not "adding a
  sibling is safe."** [adhoc-LearnerCadenceNudge] The definition verified the hooks.json wiring
  *shape* against the live file but missed all three integration facts a code-grounded critic
  found: the wiring lint forbids a duplicate `(event, matcher)` (so "add an entry like
  register-persona" was a red-CI instruction), the only proven output-delivery shape is the
  `systemMessage` JSON envelope (a raw stdout line would have shipped green and been inert — the
  AC was false-green because a substring grep matches both shapes), and the release step assumed a
  clean tree that actually held a sibling's uncommitted bump. **How to apply:** for any
  hook/wiring/release-touching spec, verify three surfaces explicitly: (1) what the LINTS assert
  about the config being extended, (2) what the DELIVERY convention of the sibling components
  actually is (read their output code, not just their input code), (3) what the WORKING TREE holds
  right now that the release step will collide with.
- **An AC must discriminate the failure it guards.** [adhoc-LearnerCadenceNudge] AC-4's "stdout
  contains the substring" passed for both the working envelope and the inert raw line — a
  verification that cannot distinguish delivered from undelivered verifies nothing about delivery.
  Same family as the vacuous-grep skeptic clause harvested into the mine-family core: check that
  the check CAN fail on the failure mode it exists for.
- **A pre-authored operator-owed release deferral made the done-check deterministic, not an
  escalation.** [adhoc-LearnerCadenceNudge] Plan Step 4 named the release bump as team-lead/operator-
  owned with an explicit sequencing gate, so when the developer deferred APPLY (concurrent sibling
  uncommitted skill edits in the tree would have been bundled by the whole-tree `bump-plugin.mjs`),
  the done-check resolved it to a one-line `Deviated (valid reason)` by *reading the live tree* —
  `plugin.json == committed HEAD` plus the two sibling `M skills/*/SKILL.md` changes — rather than
  guessing or escalating. Confirms the operator-owed-fallback rule end-to-end: a fallback the plan
  pre-authorized, that fires, is a binary PASS with the open production gate surfaced, not a Missing
  step. **How to apply:** when a plan step is operator-owned, the done-check's job is to *confirm the
  deferral condition still holds on disk*, not to re-litigate the deferral.
- **Skill-log token+session scoping was load-bearing to attribute the release-plugin invocation.**
  [adhoc-LearnerCadenceNudge] This feature's `release-plugin` (session 54db1d0c, 13:27:30) and a
  concurrent sibling pipeline's `release-plugin` (session 0b3a9544, 13:26:47) fired ~40s apart under
  the same `developer:implement` token. A timestamp-only heuristic would have cross-attributed; the
  session filter disambiguated cleanly. The read-tracker round-keying (agent + token + session) is
  what makes the skill-conformance check trustworthy when sibling pipelines run in parallel.

## Developer Lessons

- **A whole-tree release tool + concurrent slugs = the bump belongs to the team lead, not the
  developer.** [adhoc-LearnerCadenceNudge] The plan's Step-4 gate ("bump only when `plugin.json` ==
  HEAD") passed literally, but `bump-plugin.mjs` classifies the *entire working tree*, and at
  implementation time the tree held two unrelated sibling slugs' uncommitted plugin changes
  (`diagnose`/`review-format` skills). The dry-run attributed both to this feature's bump. The
  developer cannot isolate them (git writes forbidden, ADR-18) and cannot commit (team-lead hard
  rule), so the atomic bump+commit is inherently the team lead's when >1 slug is in flight. **How to
  apply:** on a release step, `bump-plugin.mjs --dry-run` FIRST and read the reason lines — if any
  names a file outside your feature, STOP and hand the apply+commit to the team lead with the
  dry-run evidence; do not apply a bump that bundles a sibling's work. (Strengthens the architect's
  "verify what the WORKING TREE holds right now" lesson — same hazard, a second manifestation:
  concurrent sibling *changes*, not the foreseen sibling *bump*.)
- **Hook script (CJS `.js`) + unit test (`.mjs`): export via `module.exports = { fn }`, guard the
  I/O main with `require.main === module`.** [adhoc-LearnerCadenceNudge] The `.mjs` test imports the
  named export through Node's CJS→ESM interop (`import { computeNudge } from '...js'` — verified
  green on Node 24). When the ESM test is the process entry point, `require.main` is `undefined`, so
  `if (require.main === module) { ...stdin/exit... }` never runs on import — the pure fn is testable
  with zero stdin handler or `process.exit` side-effects. This is the clean pattern for making a
  sibling-style CJS hook (register-persona.js / read-tracker.js run their I/O at top level, unguarded)
  unit-testable without changing its runtime behavior.

## Reviewer Lessons

- **Re-run the whole-tree tool yourself before trusting a "the tool would bundle sibling work"
  claim.** [adhoc-LearnerCadenceNudge] The developer's Step 4 deferral rested on a specific,
  checkable claim: `bump-plugin.mjs --dry-run` attributes two unrelated sibling `M skills/*/SKILL.md`
  changes to this feature's bump. Rather than accepting the implementation.md narrative, I re-ran
  `git diff HEAD -- plugin.json` (clean) and the dry-run itself (confirmed both reason lines) —
  cheap, and it converts a plausible-sounding deferral into a verified one. **How to apply:** when a
  Carry-Over Finding cites a tool's *output* as justification, re-run that exact tool in the review
  session rather than re-reading the developer's transcription of it.

## Skill Gaps

- **No `hook-authoring` skill exists.** [adhoc-LearnerCadenceNudge] (Plan Step-1 mapping flagged
  this gap explicitly.) Authoring a nexus PostToolUse hook has a repeatable, non-obvious shape that
  every hook in `plugins/nexus/hooks/scripts/` re-derives by copy-reading a sibling: read stdin JSON
  → `tool_input.file_path` (backslash-normalize) → resolve root via
  `CLAUDE_PROJECT_DIR || evt.cwd || process.cwd()` → self-filter by path → do work → deliver via
  `process.stdout.write(JSON.stringify({ systemMessage }))` (the ONLY proven delivery shape) →
  swallow-all + `process.exit(0)` (never block a run); plus the wiring rules (append to the existing
  `(event, matcher)` group — a duplicate matcher fails `wiring.test.mjs`), and — new here — the
  guarded-main + `module.exports` pattern for unit-testing the decision logic. Suggested skill:
  `create-nexus-hook`. Coverage: the stdin/field/root/delivery/swallow contract, the hooks.json
  append-not-duplicate rule, and the testable-pure-fn structure. References used this run:
  `read-tracker.js:79` (envelope), `register-persona.js` (stdin/field shape), `hooks.json`
  (Write|Edit group), `tests/lint/wiring.test.mjs` (duplicate-matcher lint + `walk()`),
  `tests/unit/cover-gates.test.mjs` (test conventions).
