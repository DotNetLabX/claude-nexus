# F6-MineMachineryHardening — Lessons

> **Learner disposition (2026-07-21 → nexus 1.39.2):** [APPLIED] "runs-in-CI is a wiring fact — grep the invoker" (with MineSkillAuthoring/F7/F8/F9) → create-implementation-plan referent-verification bullet. [APPLIED-PRIOR] explicit-path staging (recurrence evidence; rule already shipped). [TRACKED] architect critic-default for shared-artifact tech-specs (owner approval not given this pass). [TRACKED] wiped-tree recovery mitigations (scratchpad-secure-first, commit-early) — 1 occurrence. [TRACKED] killed-agent cheap-verify-then-resume technique — 1 occurrence.

## Architect Lessons

- **A "runs in CI" claim is a wiring fact — grep the invoker, never trust the invokee or repo prose.**
  The definition's CRITICAL (C1) came from the README §Known-limitations sentence claiming
  `selfcheck.mjs` is "gated by `plugin-release-check.yml`" — the workflow never invokes it. My own
  same-day grounding verified both files *exist* but not the wiring between them, and the false
  mechanism reached a ratified ADR before the critic caught it. Grounding an "X runs Y" anchor means
  grepping X for Y.
- **In a Workflow harness, prompts are not mechanisms — serializer functions are.** R2's acceptance
  originally targeted "the KB-writer prompt"; the row is actually built by a pure function
  (`buildRulesSection`) whose input mapping strips the very field the criterion cared about, so a
  prompt-grep acceptance could pass with zero behavioral change. Extends the existing "acceptance
  asserts the mechanism, not the surface" rule (`create-implementation-plan`) with the harness-specific
  trap: point acceptance at the composing function and the written artifact, never at prompt text.
- **A dev-repo reference implementation can have multiple homes for one mechanism** — the verify
  schema lives in both the delegated workflow (preferred path) and the caller's inline fallback.
  Any "harden/extend the schema" scope must enumerate all copies explicitly or the change lands only
  on the path that doesn't run.
- **The concurrent-tree hazard recurred — twice in one run.** (Recurrence of the F5-SkillGapCapture
  lesson, 2026-07-15: the shared working tree is synced across machines/sessions.) First a mid-session
  re-sync reverted tracked files and deleted untracked ones — a day of uncommitted work vanished from
  disk mid-pipeline; second, a different live session edited 6 agent files while the F6 developer was
  running. Mitigations that worked and are worth keeping: (a) on detecting a wiped/contested tree,
  secure recoverable content to the session scratchpad BEFORE writing anything back into the repo —
  verbatim reads held in context made a near-full reconstruction possible; (b) commit early — everything
  committed survived trivially via pull, everything uncommitted needed reconstruction; (c) close-time
  commits stage explicit paths only, never `-A`, so a concurrent session's in-flight edits can't ride in.
- **A killed background agent's completed work can be verified cheaply instead of re-run:** re-execute
  the plan's acceptance gates + the full suite against the tree it left, score the skill log for its
  invocation window, then resume the same agent by transcript for only the missing tail. The F6
  developer died mid-code-review; verification took minutes and nothing was redone.

### Improvement Proposal (optional, for systemic issues)
**Target:** `plugins/nexus/agents/architect.md` (technical-branch definition checkpoint)
**Change:** strengthen the definition-review guidance from "apply the shared-artifact mandate when
the tech-spec touches shared/external artifacts" to an explicit recommendation that the code-grounded
critic is the default for such tech-specs even when the author grounded the claims the same day —
author-grounding verifies anchors' existence, a fresh critic verifies their *wiring*.
**Evidence:** [F6-MineMachineryHardening] — definition review NO-GO with 1 CRITICAL (false CI
mechanism inside a just-extracted ADR) that same-session author grounding had missed.
**Priority:** medium

## Developer Lessons

- **A "byte-identical" lib/inline-mirror requirement, absent an automated guard, means logically
  identical — check whether the repo already has a normalize-and-compare convention for that exact
  class of pair before assuming literal source-byte identity.** `scripts/selfcheck.mjs`'s existing
  "spec-diff inline-copy sync" check already normalizes (strips comments/blank lines) before
  comparing lib functions to their Workflow-inlined mirrors — that's the established meaning of
  "keep in sync" for this repo's `harness/lib/*.mjs` + `harness/*.workflow.js` pairs, and the plan's
  own H1-fold text ("no automated sync guards the pair") confirms no wiring was expected, not that
  literal-byte parity was.
- **A heading-substring search (`text.indexOf('## Heading')`) can latch onto an inline backtick
  cross-reference to that same heading elsewhere in the file, not the heading itself.** Hit this
  writing `capability-contract.test.mjs`'s `methodCapabilities` helper — the method SKILL.md cites
  its own `## The adapter contract` heading in prose 200+ lines earlier ("see `` `## The adapter
  contract` ``'s..."). TDD's red run caught it immediately (wrong-section names came back), but the
  general lesson is: any heading lookup over a markdown file that documents itself needs a
  line-anchored regex (`/^## Heading\b.*$/m`), never a bare substring search.
- **When a Workflow script's mirror function was extracted fresh in the same step that also adds
  new behavior (e.g. `serializeKb` -> `harness/lib/serialize-kb.mjs`), the new lib is free to import
  a sibling lib's helpers (`stripLineRefs`/`buildVerifyExcerpt` from `kb-write.mjs`) even though the
  Workflow-script mirror itself cannot import anything — the "cannot import" constraint is a
  Workflow-runtime restriction, not a restriction on the plain `.mjs` lib files that only `node:test`
  ever loads.
- **Re-running `bump-plugin.mjs --dry-run` *after* applying a bump will show a new, higher proposed
  version (`cur -> cur+1`) purely because the working tree is now ahead of committed HEAD — this is
  the documented false dirty-vs-HEAD signal (CLAUDE.md), not a second bump to apply. Worth a quick
  sanity check after every `bump-plugin.mjs` apply so the developer doesn't second-guess a correct
  single bump.
- **A live concurrent-tree contamination is directly detectable mid-run, not just at dispatch time.**
  The dispatch's "unrelated-dirt exclusion" snapshots dirt at dispatch time; re-running `git status`
  later in the same session caught a DIFFERENT session actively editing 6 unrelated agent files
  (`model:` frontmatter) in the same shared working directory — confirmed genuinely live by two
  `git diff` checks a minute apart showing the edit still in progress (`opus` -> an invalid `fable`
  value, tripping a lint test). Re-checking `git status`/`git diff HEAD` against the dispatch's
  named scope right before finalizing (not just once at the start) is what caught it — worth doing
  as a matter of course before any developer's final handback, not only when a coordinator message
  prompts it.

## Skill Gaps

- No gap found this round — `tdd` and `release-plugin` both fit their mapped steps without
  adaptation; `code-review`'s printed protocol assumes a full multi-agent fan-out regardless of the
  `effort` argument passed (the tool-level description promises "medium: fewer, high-confidence
  findings" but the skill's own loaded text doesn't branch on effort) — not filed as a gap since the
  developer's own in-context scaling covered the intent, but worth the skill author's attention if
  "effort medium" is meant to visibly shrink the loaded protocol, not just the developer's
  interpretation of it.
