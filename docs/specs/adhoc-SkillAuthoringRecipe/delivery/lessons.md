# Lessons — adhoc-SkillAuthoringRecipe

## Architect Lessons

- **A grep-based "verify against live source" instruction is only as good as the source actually
  containing the thing.** Step 1 told the developer to verify the §4 frontmatter fields by grepping the repo —
  but four of the nine fields (`allowed-tools`, `disallowed-tools`, `context: fork`, `when_to_use` + cap) have
  **zero** in-repo frontmatter precedent, so the grep silently confirms nothing and the unverified omnishelf
  forms pass straight through. When a plan says "verify X against the codebase," confirm the codebase can
  actually confirm X; if it can't, name the real ground truth (here: the `claude-code-guide` agent /
  platform docs) per field. This is the AP5 "fictional infrastructure" trap applied to a verification step,
  not just a referenced path. (Caught by the code-grounded critic, not derivable from the plan alone — which
  is exactly why a shared/plugin-source pass needs a *code-grounded* review, not a doc-only diff.)

- **A lint done-condition that depends on an exact token must say so in the step that writes the token.**
  Step 3's `skill-lint` only bites because Step 2 cites the literal `references/skill-recipe.md`. The coupling
  was implicit; a paraphrased pointer would have passed the lint green while leaving the reference unwired.
  When a later step's gate depends on an earlier step's literal output, state the literal in the earlier step.

- **For a small extraction pass, the proposal *is* the confirmed scope.** P5 was High-confidence and named
  exactly §0/§1/§4 in, §2/§3/§5/§6/§7 out — no separate tech-spec or scope-confirmation round was needed
  (master gate, ADR-25). The judgment that earned its keep was the *anti-duplication* constraint (reference
  `proven-patterns.md`, don't restate it — AP3), not scope reconstruction.

- **An enumerated verification split must cover every item in its governing list, or it leaves a silent
  latitude the developer has to close.** The critic's H1 fix named 6 of the 9 §4 frontmatter fields by
  bucket (2 grep-confirmable, 4 agent-verified) but left `effort`/`model` unassigned — even though the
  governing instruction ("verify every field name before writing it") covered all 9. At done-check the
  developer had (correctly) extended the same rigor to the unbucketed two, so the outcome was fine — but the
  plan authored the gap. When a step enumerates a per-item verification split, cross-check it against the
  parent list at plan time: an item that's in the governing rule but absent from the split is a plan defect,
  not a "safe to pass through." (Done-check observation, adhoc-SkillAuthoringRecipe — both this pass's
  developer deviations traced back to under-specified plan enumerations the developer closed well.)

## Developer Lessons

- **A plan's field-verification split can itself be incomplete — extend the same rigor to
  fields it didn't explicitly bucket.** The plan's H1 fix named 4 zero-precedent fields needing
  `claude-code-guide` verification and 2 grep-confirmable ones, but left `effort`/`model` (also in
  the field table) unassigned to either bucket. A quick grep showed they too have zero in-repo
  frontmatter precedent — so I ran the same agent verification on them rather than treating
  "not named in the split" as "safe to pass through on general familiarity." The governing
  instruction ("verify every field name... before writing it") covered all 9 fields; the critic's
  H1 fix only spelled out 6 of them by name. When a plan enumerates a verification split, check
  whether every item in the parent list actually got a bucket — an unassigned item is not the
  same as a confirmed-safe one.
- **Structural fit beats a plan's suggested example names when "developer's call" is explicitly
  granted.** The plan suggested `evaluate-skill`/`release-plugin` as heavy-archetype candidates
  "to verify" — reading both showed they're single-file, script-orchestrated procedural skills,
  not a structural match for the source's "heavy" definition (multi-phase pipeline + parallel
  subagent dispatch + state/gate). `mine-verify-repo`/`mine-verify-cover` matched exactly,
  including a verbatim echo of the source's own "Use when" wording. The plan's Binding
  vs. developer's-call section had already granted this latitude ("which nexus skills to name as
  the archetype examples") — worth re-checking suggested examples against their real structure
  even when the plan offers named candidates, since "candidates to verify" means verify, not
  adopt.
- **An agent spawned foreground can be re-queried cheaply via SendMessage instead of a fresh
  spawn.** Continuing the same `claude-code-guide` agent (by `agentId`, via `SendMessage`) for a
  second, related fact-check (the `effort`/`model` follow-up) reused its already-loaded docs
  context — it answered directly from what it had fetched in the first round, no re-fetch. Faster
  and cheaper than spawning a second fresh agent for a small extension of the same question.
- **Reading a background agent's raw transcript file directly (before its completion
  notification) is unreliable at scale, but `Get-Content -Tail` + a small extraction file works.**
  The transcript `.output` file exceeded the Read tool's size cap, and even line-scoped greps hit
  "content omitted" on long JSON lines. Piping the last line through PowerShell into a small
  temp file, then reading that, got the answer without waiting idle for the async notification.
  Useful pattern when a foreground-dependent async result is needed before proceeding but the
  harness's own notification hasn't arrived yet in the same turn.

## Reviewer Lessons

- **For a doc/reference-only feature whose entire risk is "did the fact-check actually happen,"
  the reviewer's fresh evidence has to be an independent re-fetch of the ground truth, not a
  re-read of the developer's transcript summary.** Trusting implementation.md's "verified via
  claude-code-guide" claim would have been a rubber stamp on the single highest-risk part of this
  change (AP5 fictional infrastructure in the one reference authors are meant to trust blindly). I
  independently `WebFetch`'d `code.claude.com/docs/en/skills.md` and `.../model-config.md` and
  diffed all 9 frontmatter claims line-by-line — all held up. Worth the extra round-trip: a
  plausible-sounding but subtly wrong platform fact in an authoring reference would propagate into
  every future skill built from it (the same force-multiplier property `improve-skills/SKILL.md`
  names for skill defects generally).
- **One genuine wording-precision gap surfaced only by fetching the *second* platform page.** The
  skill-recipe.md's `effort` row claims the override is turn-scoped like `model`'s; the primary
  skills.md frontmatter table doesn't state this for `effort` (only for `model`), and confirming it
  required a second fetch of `model-config.md`'s "Set the effort level" section, which uses "applies
  when...active" — compatible with, but not verbatim, "current turn." Filed as a sub-80-confidence
  Open Question rather than a finding — a reminder that a single-page platform fact-check can miss
  a claim whose confirming text lives on a different doc page.
