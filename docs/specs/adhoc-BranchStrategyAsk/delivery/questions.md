# Branch Strategy Ask (Branch Pre-Flight v2) — Questions

Phase 1 analysis of the request: "team-lead and solo should always ask, before writing anything
down, what kind of branch/worktree to use (main / new branch / new worktree / anything missing),
and suggest based on the work and how dirty the main/current branch is."

**Current state (verified against source):** a canonical **Branch Pre-Flight & Default-Branch
Resolution** rule already exists (`plugins/nexus/rules/agents-workflow.md:34-58`) with a
branch-state decision matrix + a dirty-tree overlay, and both team-lead (Pre-Flight #1,
`team-lead.md:228`) and solo (Workflow step 1, `solo.md:34`) already run it before writing
anything. The request is therefore an **amendment**, not a green-field feature. Gaps found:
worktree is not a first-class option (only appears inside the dirty-tree overlay); there is no
recommendation heuristic (the ask lists options without suggesting one); standalone po/architect
have no branch guard at all; the slug-matching state proceeds silently (vs the requested "always
ask").

## Q1: Does "always ask" override the slug-matching silent proceed?
**From:** architect
**To:** user
**Status:** Open
**Step:** Phase 1 analysis

**Context:** The existing matrix asks in 3 of 4 attended states but **proceeds silently when the
current branch already matches the slug** (deliberate: that branch was created by this very ask on
a previous launch/resume — re-asking every time is noise). Unattended mode cannot ask by
definition (auto-creates `{slug}` from the default). A literal "always ask" reverses the
slug-match exemption.

**Question:** Should the checkpoint ask in every attended state, or keep the slug-matching
silent-proceed exemption?

**Recommendation:** Keep the exemption — reframe the rule as "the checkpoint always *runs* before
anything is written; it *asks* in every state except an exact slug match, where the earlier ask
already chose this branch." Unattended stays auto (cannot ask).
**Confidence:** high — the slug-match branch is the product of a prior ask; re-asking adds a
prompt to every resume/relaunch with no new information.

### Answer
User (2026-07-10): Keep slug-match silent. Status → Answered.

## Q2: Scope — team-lead + solo only, or all standalone entry personas?
**From:** architect
**To:** user
**Status:** Open
**Step:** Phase 1 analysis

**Context:** You named team-lead and solo. But standalone **po** and **architect** personas write
artifacts too (spec.md, plan.md, questions.md) and carry **no branch guard at all** — live
evidence: this very session (architect) wrote this file onto a dirty `main` with an uncommitted
1.28.0 release in flight. "Before writing anything down" arguably covers them. Cost of including
them: one reference line each in po.md + architect.md (the canonical rule already exists), plus
command regeneration.

**Question:** Guard team-lead + solo only (as named), or extend the same one-line reference to
standalone po + architect?

**Recommendation:** Extend to all four entry personas — the failure mode (artifacts landing on the
wrong/dirty branch) is identical and just demonstrated live; the marginal cost is two lines.
**Confidence:** medium — it expands the scope you named, so it is your call.

### Answer
User (2026-07-10): **team-lead & solo only.** Rationale: "writing artifacts is not harmful, only
writing code [is], because of the collision." The guard's purpose is collision-avoidance on code
writes; doc-artifact writes by standalone po/architect are acceptable on any branch. Recommendation
overridden — this is the binding scope. Status → Answered.

## Q3: The option set — what "anything else" is missing?
**From:** architect
**To:** user
**Status:** Open
**Step:** Phase 1 analysis

**Context:** You listed main / new branch / new worktree and asked what's missing. Analysis of the
existing matrix + git's real option space says the complete first-class set is four, one of them
conditional:
1. **Continue here** (current branch — covers "main branch" when on main)
2. **New branch from the default** (existing behavior; name = `{slug}`)
3. **New branch from the *current* branch (stacked)** — genuinely missing today; the right choice
   when the new work builds on in-flight, not-yet-merged work. Offered **only when current ≠
   default**, so the common case stays a clean 3-option ask.
4. **New worktree** (`git worktree add`) — promoted from the dirty-tree overlay to first-class;
   the right choice for parallel work or a dirty tree you must not touch.

Deliberately **excluded**: stash-then-branch (kept as guidance inside the dirty-tree overlay only —
stashes get forgotten; a worktree achieves the same isolation without moving the in-flight work);
remote/cloud sandboxes (harness-specific, not git-universal — the rule stays git-only and
host-agnostic).

**Question:** Confirm this 4-option set (stacked-branch conditional), or trim/extend it?

**Recommendation:** Adopt the 4-option set as above.
**Confidence:** high — matches git's real decision space, stays within the 4-option UI cap of
`AskUserQuestion`, and keeps the common case simple.

### Answer
Presumed (proceed-default), not user-confirmed — the 4-option set (stacked-branch conditional) was
presented in the checkpoint message with the recommendation; no objection raised. Adopted for the
plan; trivially revisable at plan review. Status → Answered.

## Q4: Sequencing — the tree already carries an uncommitted 1.28.0 (adhoc-DecisionLog)
**From:** architect
**To:** user
**Status:** Open
**Step:** Phase 1 analysis

**Context:** `main` is dirty with a complete-looking in-flight feature: **adhoc-DecisionLog**
(team-lead.md, learner.md, regenerated commands, plugin.json bumped 1.27.0 → 1.28.0, CHANGELOG
entry dated today). This feature also edits `team-lead.md`, so implementing it now would entangle
two features in one uncommitted bump — exactly the double-bump hazard CLAUDE.md warns about (and,
fittingly, exactly the scenario this feature exists to catch).

**Question:** How do we sequence?

**Recommendation:** Commit adhoc-DecisionLog first (it looks release-complete: bump + CHANGELOG +
regenerated commands all present), then implement this feature on top as its own bump (PATCH
proposed by the tool; owner may escalate MINOR — first-class worktree option + recommendation
heuristic is arguably a new capability).
**Confidence:** high — it is the only sequence that keeps one-feature-one-bump intact; but the
in-flight work is yours, so the commit decision is yours.

### Answer
User (2026-07-10): Commit adhoc-DecisionLog first. Recorded as the plan's Step 0 precondition
(user/owner action — the architect never commits). Status → Answered.

## Q5: Review mode for the plan
**From:** architect
**To:** user
**Status:** Open
**Step:** Phase 1 analysis

**Context:** Standalone checkpoint ask (bundled here per protocol). This pass edits **shared
plugin artifacts** (an always-on rule + agent files) — the class of change for which a doc-only
review is structurally blind and a **code-grounded critic** (reads the live rule/agent files, greps
the repo) is the mandated recommendation.

**Question:** Critic review (code-grounded) or self-review?

**Recommendation:** Code-grounded critic (Mode 2 against the amended rule + agent files).
**Confidence:** high — shared/external-artifact mandate applies directly.

### Answer
User (2026-07-10): Code-grounded critic. Status → Answered.
