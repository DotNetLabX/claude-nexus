# Lessons — adhoc-SddMergeGen

## Architect Lessons

- **Adapter skills live in their stack plugin, not `nexus` — and each changed plugin needs its own
  bump.** Plan rev 1 targeted `plugins/nexus/skills/mine-verify-cover-dotnet/` (doesn't exist) and a
  single `nexus` bump; the version-keyed cache would have shipped adapter edits that never reach users.
  Rule of thumb: any plan touching `mine-verify-cover-*` adapters must Glob the four plugin roots and
  carry one bump per changed plugin. (Critic F1/F2, CRITICAL ×2.)
- **A shipped adapter ≠ its harness workflow.** I conflated `harness/cover-flutter.workflow.js`
  (dev-repo pilot machinery) with `plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md`
  (shipped) and dropped a proposal commitment on that false premise. Verify "X doesn't exist" claims
  with a Glob of `plugins/*/skills/`, not by recalling the harness listing. (F2.)
- **Test placement is a collection-glob fact, not a convention guess.** The suite collects only
  `tests/{lint,unit}/*.test.mjs` (`selfcheck.mjs:45`); tests authored under `harness/` false-green the
  release gate by never running. Cite the collector's glob in the plan's Testing Strategy. (F3.)
- **An ungating edit must enumerate every stale claim via a fresh whole-file grep, and the accept grep
  must be broader than the edit list** — spot anchors + a narrow accept string shipped a
  self-contradictory skill in rev 1 (`:277`/`:280` table rows said "deferred" while the body said
  shipped). Accept on the semantic token (`\bdeferred\b` in-section) with a sanctioned-carve-out list.
  (F4.)
- **Owner-AFK auto-applied answers need a reversal map that includes the highest-fanout dependency.**
  U-3 (tag vocabulary) was the one whose reversal reworks 2 steps + 2 adapters — and the one I left
  unmapped. Map every provisional answer to the steps it re-opens before declaring "None open." (F5.)
- **The code-grounded critic mandate paid for itself again:** rev 1 passed my self-check; every
  CRITICAL/HIGH was findable only by reading the live repo (plugin roots, test globs, skill line
  anchors). Consistent with the standing evidence in `architect.md` step 12.

## Developer Lessons

- **The selfcheck inline-copy sync guard catches real dead code, not just drift.** Inlining
  `harness/lib/rules-registry.mjs`'s `updateRegistry` verbatim into `harness/merge.workflow.js` surfaced
  a `let changed = false` / `changed = true` variable that was written five times and read nowhere — a
  genuine leftover from an earlier draft the unit tests never exercised (nothing asserts on it). The
  cross-file byte-identity requirement is a free code-quality check on top of its stated job (keeping the
  Workflow-runtime inline copy honest) — worth treating a sync-guard FAIL as "investigate before
  reconciling," not just "make the copies match by any means."
- **A "many-to-one both directions" TDD requirement is satisfied naturally by a Map-keyed match, no
  special-casing needed** — `merge-rules.mjs`'s `codeByName` Map (keyed by canonical `ruleName`) handles
  code-many→spec-one and spec-many→code-one identically, because both directions independently look up
  the same map. Worth remembering as a default shape for any future N:M rule-matching lib — reach for a
  Map-of-arrays keyed on the shared identity before reaching for nested loops with direction-specific
  branches.
- **A plan step's Accept criteria is the authoritative scope boundary when the step's own prose is
  broader.** Step 1's prose said the triage lib's output includes "the M3 dispositions," but the Accept
  criteria never tested them, and the tech-spec's M3 table structurally needs PRIOR registry state Step
  1's stateless inputs don't carry. Building strictly to Accept criteria (and placing disposition logic
  in Step 2, which DOES see prior state) avoided inventing a disposition computation with no test to
  prove it right, and kept the two libs' responsibilities cleanly separated. When a step's narrative and
  its Accept criteria disagree on scope, Accept criteria wins — and the mismatch is worth flagging in Key
  Decisions rather than silently picking one.
- **A test's own expectation can be the thing that's red for the wrong reason, not the code.** The
  `rules-registry.test.mjs` idempotent-re-run test initially asserted two calls with IDENTICAL prior
  state would produce byte-identical output — but the first call legitimately transitions a row from
  absent→`add`, so a true "idempotent re-run" test needs a SEED call plus two STEADY-STATE calls, not a
  single before/after pair. The `tdd` skill's "fails for the wrong reason → fix the test setup, not the
  production code" rule paid off directly here — the production `updateRegistry` logic was correct on
  first pass.
- **In-memory-chained unit tests can pass while the real (render→file→parse) boundary is broken —
  test the SERIALIZATION boundary explicitly whenever a lib's job is "produce a durable artifact another
  run reads back."** Review Cycle 1's HIGH finding (confidence 92) was invisible to Steps 1–3's TDD suite
  because every idempotency/M3 test chained `updateRegistry` calls by passing the in-memory `.rows`
  object straight into the next call's `existingRows` — never through `renderRegistry` and back through a
  real parse. The pure-function tests were individually correct and non-vacuous; they just never exercised
  the one boundary (serialize → deserialize) where the bug actually lived. Going forward: any lib pair
  shaped like `render*`/`write*` + a corresponding read path needs at least one test that chains through
  the RENDERED text, not just the in-memory object — the render step is not a formality, it's where
  information can silently get lost.
- **A "private" cache field that never gets rendered can also never get recovered — that tension is
  itself a design smell worth spotting at write-time.** My original `_evidenceKey` field (added in the
  Step 4 implementation round, documented in Key Decisions as intentionally not rendered) was the exact
  seed of the bug: a fingerprint cached on an in-memory row that a real file round trip could never
  reproduce. The fix wasn't to render the cache field — it was to stop needing a cache at all, by
  restricting the fingerprint to fields that were ALREADY being persisted for other reasons. When a
  "private, never-serialized" field is load-bearing for a decision that must survive a save/load cycle,
  that's a signal to eliminate the field, not to add a comment explaining why it's fine that it's private.
- **Fixing a read-side prompt/schema mismatch at its structural root (deterministic parser + raw-content
  read) is more durable than hand-syncing two prose contracts.** The reviewer's literal fix ask ("update
  registryReadPrompt so the read-side column list matches what the writer actually emits") would have
  been satisfiable by just editing the prompt's column list — but two independently-maintained prose
  descriptions of the "same" data shape (one in the writer's render logic, one in the reader's prompt
  text) is exactly the class of thing that drifted apart the first time. Replacing the reader's job with
  "return raw content" + a tested, deterministic `parseRegistry` closes the drift vector structurally
  instead of just re-syncing it once more.

## Skill Gaps

- No skill gap surfaced this round — `tdd` covered Steps 1–3 cleanly (including catching the developer's
  own wrong test expectation, not a skill deficiency), and the existing `release-plugin`/
  `implementation-format`/`questions-format`/`lessons-format` skills covered the rest without needing
  extension. Worth noting as a positive data point: a plan with concrete Accept criteria per step (this
  one) needed zero ad-hoc pattern invention.

## Reviewer Lessons

- **A pure-function idempotency test that chains in-memory `.rows` output straight into the next call's
  `existingRows` proves nothing about idempotency once a serialization boundary sits between runs.**
  `rules-registry.mjs`'s `updateRegistry`/`renderRegistry` pair computes a rich row shape (`bucket`,
  `state`, `evidencePair`, `tags`) but `renderRegistry`'s markdown table only persists a subset
  (`canonicalName`/`layer`/`criticality`/`arms`/`disposition`/`source`/`lastVerified`). The unit suite's
  "idempotent re-run" test (and its M3-supersede sibling) both passed the FULL in-memory row object from
  one call to the next, never round-tripping through the actual render function — so a real registry file
  round trip (write → agent re-reads only the rendered columns → re-`updateRegistry`) silently breaks the
  documented "no diff" invariant, and every row supersedes itself on every re-run forever. Caught by
  writing a throwaway repro that reconstructed only the columns the renderer actually emits, not by
  reading the tests. **Generalizable check for any lib pair split as `computeX`/`renderX` +
  `parseX`-via-agent:** when reviewing a "pure lib + a markdown/text renderer + an agent that re-parses
  it on the next run" pattern, always ask "does every field the compute function attaches to a row survive
  a render→parse round trip?" — don't trust an idempotency test that never calls the renderer at all.
  Evidence: adhoc-SddMergeGen (this run) — HIGH finding in `review.md`.
- **Running the actual gates yourself (not just reading the developer's reported numbers) paid off twice
  here**: `node scripts/selfcheck.mjs` and `node scripts/gen-commands.mjs nexus` both came back exactly as
  implementation.md claimed (fresh, this session) — cheap confirmation that build evidence, not free-form
  trust, cost under a minute total for three gates.
- **Re-review: re-run your OWN repro against the fix, don't just re-read the developer's new test.** On
  Fix-Cycle 1 I re-derived the seed→steady-state→render→parse→re-run sequence from scratch instead of just
  confirming the developer's new "THE FIX" test passed. First attempt at the ad hoc repro compared the
  wrong two runs (seed 'add' vs. the first 'carried' transition — which legitimately DOES grow the
  changelog by one entry, a valid one-time transition) and produced a false "still broken" signal. Caught
  it myself by re-reading my OWN original finding's definition of idempotency (steady-state vs.
  steady-state, matching the plan's own binding invariant) before writing up the re-review — a good
  reminder that a reviewer's own verification script needs the same rigor as the code under review, and
  that re-deriving beats trusting either side's number on a re-check.
- **A structural fix (deterministic parser as the read-side contract) closes a drift class a literal fix
  request would not have.** My fix instruction only asked to "update the read prompt's column list to
  match." The developer instead replaced the read-agent's job with "return raw content" plus a tested
  `parseRegistry` inverse — eliminating the two-independently-maintained-prose-descriptions failure mode
  entirely rather than re-syncing it once more. Worth recognizing and crediting explicitly in a re-review
  (not just checking the literal ask was satisfied) — it changes what future findings in this area are
  even possible.
