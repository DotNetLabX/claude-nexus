# Branch Strategy Ask — Lessons

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [APPLIED] prose-diff code-review variant (skill gap, 1st occurrence; threshold met with adhoc-ArchitectFastLane) → architect.md fast-lane dispatch. [APPLIED] bump dry-run reasons-list check (CLAUDE.md addition proposal) → CLAUDE.md release section.

## Architect Lessons

- **Verify-current-state-first reframed the whole request.** The ask read as green-field
  ("team-lead and solo should always ask…") but a grep found the canonical Branch Pre-Flight
  matrix already shipped and both agents already running it — the feature collapsed from "new
  checkpoint" to "amend one rule section + two thin restatements." Cost of the check: three greps.
  **Evidence:** adhoc-BranchStrategyAsk.
- **The live working tree was itself the evidence.** The repo's own dirty state (uncommitted
  adhoc-DecisionLog 1.28.0 entangling `team-lead.md`) simultaneously (a) proved the requested
  heuristic's value, (b) produced the sequencing question (Q4), and (c) forced Step 1 as an
  operator-owed precondition. When the request is about a workflow hazard, check whether the
  current session is living it — it sharpens the questions.
  **Evidence:** adhoc-BranchStrategyAsk.
- **User override on scope recorded verbatim (Q2).** The extend-to-po/architect recommendation was
  overridden with a rationale that refines the guard's semantics: the collision risk is *code*
  writes, not artifact writes. That rationale is design input, not just a "no" — it shaped R4 and
  the plan's out-of-scope list. Capture the why, not only the verdict.
  **Evidence:** adhoc-BranchStrategyAsk.
- **Critic pre-commitment predictions earned their keep.** The code-grounded critic's third
  prediction (detached-HEAD row left undispositioned) was the only MEDIUM — exactly the "silence
  ≠ deferral" class a doc-only self-review misses. The matrix-amendment pattern generalizes:
  when a plan changes N of M table rows, every untouched row needs an explicit
  stays-byte-stable disposition.
  **Evidence:** adhoc-BranchStrategyAsk.

- **Done-check on a first-round-reviewed implementation was cheap and clean.** The dispatch-baked
  `code-review` first round (the fast-lane shape) moved three wording defects from "done-check
  findings → fix cycle" to "fixed before implementation.md landed" — the done-check then passed
  first try. The lane's review-then-done-check ordering is doing real work; keep it when baking
  the lane (adhoc-ArchitectFastLane).
  **Evidence:** adhoc-BranchStrategyAsk.

## Developer Lessons

- **A plan's literal replacement prose for a rule amendment can silently narrow a guarantee the
  same plan step declares "unchanged."** Step 2e's exact replacement text ("the dirty state feeds
  the recommendation…") reads correctly on first pass but implicitly re-scopes the dirty-tree
  overlay from "applies on every matrix row" (the original's actual scope, per the "Overlays
  (apply on top of the matrix)" heading) down to "applies only where an ask/recommendation exists"
  — losing coverage of the silent slug-match row. A code-review pass caught it; a doc-only
  self-review likely wouldn't have (it reads as a faithful transcription of the plan). When a plan
  gives literal replacement prose for a rule amendment, verify the *scope* of the old text (what
  triggers it, not just what it says) before adopting the plan's replacement wording verbatim —
  the words can be right and the trigger condition wrong.
  **Evidence:** adhoc-BranchStrategyAsk.
- **`bump-plugin.mjs` classifies the whole *working tree*, not just this feature's files — a
  concurrent unrelated untracked file contaminates the CHANGELOG reasons list even though the
  version-only diff is otherwise correct.** An untracked in-flight skill dir
  (`plugins/nexus/skills/mine-semantic-model/`, someone else's work, explicitly out of scope for
  this run) produced a `skill change (mine-semantic-model)` line in both the dry-run and the apply
  output. The `release-plugin` skill's own Procedure step 3 already anticipates this ("edit the
  generated CHANGELOG entry to describe the actual change — the stub line is just a placeholder"),
  so the fix is in-flow, but it's easy to miss if you only skim the tool's happy-path output — the
  CLAUDE.md warning about "still-dirty earlier steps" double-bumping covers same-feature dirt; it
  doesn't call out *other* concurrent in-flight work as a second contamination source worth naming
  explicitly. Worth a one-line addition to CLAUDE.md's bump guidance: check the dry-run's reasons
  list against files you actually intended to touch before applying, especially in a multi-agent
  environment where the tree can be dirtied by a sibling session mid-run.
  **Evidence:** adhoc-BranchStrategyAsk.
- **Scaling `code-review` to a proportionate depth for a pure-prose diff worked well and is worth
  documenting as a pattern.** The skill's full xhigh-flavored procedure (10 finder angles × 8
  candidates, SQL injection / wrapper-proxy / language-pitfall angles) doesn't map onto a
  markdown-only instructional-rule diff. Running 2 focused parallel Explore-agent finder passes
  (removed-behavior + cross-reference + internal-consistency; reuse/altitude + conventions +
  CHANGELOG-accuracy) at `--effort medium`, then verifying/resolving in-context myself, surfaced 3
  real, fixable defects (a dangling forward-reference, a dropped guarantee, an internal
  cardinality contradiction) with zero wasted angles. A future `code-review` invocation on a
  docs/rules-only diff could route to this lighter shape by default rather than the full
  code-oriented angle set.
  **Evidence:** adhoc-BranchStrategyAsk.

## Skill Gaps

- **`code-review` has no docs/prose-diff variant.** Its Phase-1 angle set (line-by-line for
  null-deref/off-by-one, language-pitfall specialist, wrapper/proxy correctness, SQL injection) is
  written for executable code and doesn't cleanly apply when the diff is agent-instruction
  markdown (as here — a rule/agent-file amendment with zero executable surface). I adapted by hand
  (see Developer Lessons above) rather than following the skill's literal 10-angle/8-candidate
  procedure. Suggested addition: a short "prose/rules diff" branch in the skill that swaps the
  code-specific angles (D, E) for prose-specific ones (internal consistency, dangling
  cross-references, dropped guarantees) — the other angles (A removed-behavior, C cross-file
  tracer, conventions, reuse/simplification/altitude) already generalize fine.
  **Evidence:** adhoc-BranchStrategyAsk.
