# F9-CoordinationHardening — Lessons

## Architect Lessons

- **Live-log re-grounding overturned the inbound diagnosis.** Feedback Entry 3 blamed read-tracker
  attribution; the consuming repo's live `violations.log`/`read-tracker.json` showed attribution
  working and three different causes (type-bucket collision, token-less endless round,
  qualifier-first names). The "re-verify aged findings against current source" rule paid for itself
  before a wrong code fix shipped — for hook-behavior claims, the *consuming repo's audit logs* are
  the ground truth, not the plugin source alone.
- **The code-grounded critic caught what plan-conformance could not.** Both HIGHs were invisible to
  a doc-only pass: the sliding-vs-fixed window distinction (a semantics gap in my own step wording)
  and the Relay Contract contradiction + ADR-2 reachability of a cross-file pointer. The
  shared-artifact mandate (code-grounded review for passes editing shipped surfaces) holds.
- **A pointer to another agent's file is a reachability claim.** team-lead.md is not injected to
  other agents; citing it as "canonical long form" from an all-agents rule was structurally dead for
  the target audience. Check the injection surface (rules/ vs agents/) before writing cross-file
  pointers in shipped prose.
- **Baseline drift mid-planning is real even solo.** Three commits (including an edit to a target
  file) landed between drafting and review in the same working tree. The critic's HEAD re-check
  caught it; "anchor by quoted text, not line number" made it harmless.
- Skill Mapping disposition: Steps 1–6 verified `None` — dev-repo prose/hook authoring has no
  pattern skill by design (the repo's core work, consistent with prior F-passes); explicitly not
  logged to `## Skill Gaps` as it is expected coverage absence, not a gap.

## Developer Lessons

- **A state-shape migration needs an explicit per-value shape guard — not the round/session reset,
  not the fail-silent catch.** For read-tracker's number→`[n, lastTs]` change: the session/token
  reset does NOT fire for a legacy value in the *same* round (same session + token), and a blind
  `const [n, ts] = prev` destructure of a bare number silently throws into the observe-only catch,
  killing tracking with no signal. Only an explicit `Array.isArray(prev) && typeof prev[0]==='number'
  && typeof prev[1]==='number'` guard that treats any non-shape value as absent (reset) is correct.
  Assert *active replacement* in tests (next read nudges at ×2), not merely "no throw" — fail-silent
  makes a no-throw assertion vacuous.
- **Test a subprocess hook's time-dependent behavior by ageing the stored state, not by mocking the
  clock.** read-tracker runs as a spawned process using real `Date.now()`. To cross a decay window
  deterministically, seed/age the *stored previous* `lastTs` into the past via a `writeState` helper —
  the hook keeps a real clock and needs no test-only time seam. Match the seeded `session`/`token` to
  the test's read defaults so the whole-round reset does NOT fire and the decay path is what's exercised.
- **On a red-first shape change, seed the full new shape rather than mutating the hook's stored
  value.** In strict-mode ESM, `state.counts[key][1] = x` on a value the *current* hook stored as a
  bare number throws a TypeError — a "wrong reason" red. Writing the complete `[n, lastTs]` state via
  `writeState` before the read makes the red come from the missing behavior, not test-infra breakage.

## Carried-forward flags (not planned in F9)

- mine-family miners are deliberately unnamed (`mine-family-core.md`): the `general-purpose|file`
  read-tracker collision persists for them; candidate for a future mine-family pass.
- Capability pins are prose-only authority; `guard.js` enforcement of push/config/history-rewrite
  remains roadmap (hardened mode note, agents-workflow.md).
