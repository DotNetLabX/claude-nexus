# F2-AdhocIsSoloOnly — Lessons

> **Learner disposition (2026-07-21 → nexus 1.39.2):** [TRACKED] finder no-show → do-the-angle-set-yourself-and-disclose generalization (1 occurrence; F9's idle-recovery covers the dispatcher side). [TRACKED] selfcheck gen-commands FP wording is regen-timing-conditional (1 occurrence). Bump-reasons-are-categories note: recorded, no action (informational).

## Developer Lessons

- The plan's exact-anchor grounding (12 line anchors, all verified exact by the code-grounded
  critic) held completely — every `old_string` in every `Edit` call matched on the first try, zero
  re-reads needed to relocate a moved anchor. A well-grounded plan is the single biggest lever on
  developer wall-clock time for a prose-only feature like this one.
- `bump-plugin.mjs --dry-run`'s reasons list is a **category** list ("agent instruction/behavior
  change", "shipped command changed", ...), not a per-file list — CLAUDE.md's guard ("if a reason
  names a file outside your feature, stop") only fires when a reason is phrased as a bare filename.
  For this run the categories cleanly mapped to the actual touched surface (agents + commands +
  rules), so no stop was warranted, but a developer relying on the guard should know it won't catch
  contamination that a categorical reason doesn't literally name.
- `node scripts/selfcheck.mjs`'s gen-commands check did **not** false-positive this run (it PASSED)
  because the regen (Step 4) ran before selfcheck — the documented false-positive only fires when
  agent edits are staged/uncommitted **without** a matching commands regen having run yet. Worth
  tightening the CLAUDE.md wording: the noise is conditional on regen timing, not unconditional.
- One of two parallel `general-purpose` finder-pass subagents (dispatch hard rule 4's prose-review
  substitute for `/code-review` on a docs-only diff) never returned a report despite 5 check-in
  `SendMessage`s spread across the ~20-minute implementation window — it stayed "already running."
  The other finder's results arrived only via an **architect relay** message, not a direct reply.
  Fallback used: completed the un-returned finder's angle set myself in-context and disclosed this
  in implementation.md's Self-Review (the same fallback pattern the registry guardrail already
  sanctions for an unavailable subagent spawn). Worth generalizing that fallback's wording in the
  developer agent file beyond the registry-guardrail section — it applied cleanly here to a
  different trigger (a finder pass, not a registry re-verify).

## Architect Lessons

- **A rule about role boundaries must itself respect them:** my first draft of the re-slug guard had the architect self-assigning F-numbers and backlog rows — contradicting the never-derive-slug rule the same feature reinforces. The reviewer lens that caught it was "internal consistency of the new text against the file's own existing guarantees," which is exactly the prose-angle set the fast lane bakes in for docs-only diffs.
- **Re-ground concurrency assumptions at review time, not just plan time:** the plan's release-sequencing guard targeted a blocker (a concurrent feature's uncommitted bump) that had cleared by the time the critic ran; the critic's live re-grounding converted a confusing stale premise into a clean baseline (1.31.1 → 1.32.0). "Unchanged answer ≠ unchanged correctness" applies to tree state as much as code.
- **A policy ADR that widens an older ADR must sweep that ADR's consumers:** ADR-58 widening ADR-29 made `docs/backlog.md`'s own header self-contradictory the moment the F2 row landed. When a decision changes a lifecycle trigger, grep for the trigger's restatements (headers, agent files, skills) and fix-or-defer each explicitly.

## Skill Gaps

None — `release-plugin` covered Step 5 completely; no other plan step mapped a skill (Steps 1-4 are
correctly `Skill: (none)` — prose rule/agent edits with no structural pattern to reuse).
