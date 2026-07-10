# Branch Strategy Ask (Branch Pre-Flight v2)

**Feature Spec:** None (ad-hoc — binding input = the user request + the answered checkpoint in
`docs/specs/adhoc-BranchStrategyAsk/delivery/questions.md`, Q1–Q5 all Answered 2026-07-10)

## Context

Team-lead and solo must always run a branch/worktree checkpoint before anything is written, offering
the full option space (continue here / new branch / stacked branch / worktree) **with a
recommendation** derived from the work's shape and the tree's dirtiness. Today the canonical
**Branch Pre-Flight & Default-Branch Resolution** rule (`plugins/nexus/rules/agents-workflow.md:34-58`)
already runs at launch in both agents, but its ask offers only two options (continue / new branch
from default), worktree is buried in the dirty-tree overlay, and no recommendation is carried.
This is an **amendment to the existing rule**, not a new mechanism.

Requirements (from the request + checkpoint answers):
- **R1 — Always-ask-before-writing:** the checkpoint runs before the first write of any kind; it
  asks in every attended state **except** an exact slug match (Q1: exemption kept; unattended
  cannot ask — auto behavior unchanged).
- **R2 — Full option set, worktree first-class:** continue here / new `{slug}` branch from the
  default / new branch stacked on the current branch (shown only when current ≠ default) / new
  worktree (Q3 confirmed).
- **R3 — Recommendation heuristic:** every ask carries one recommended option + confidence + a
  one-line why, keyed on work shape × tree dirtiness (× relatedness of the dirt).
- **R4 — Scope: team-lead + solo only** (Q2: user overrode the extend-to-po/architect
  recommendation — "writing artifacts is not harmful, only writing code, because of the collision").

## Scope

In scope: the canonical rule amendment, the two agents' thin restatements, command regeneration,
plugin release. Out of scope: po/architect guards (R4), any hook/enforcement layer (prose-only
pass), unattended-mode behavior changes, the team-lead Resume branch-check (untouched — it guards
resuming, not launching).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | operator commit of the in-flight adhoc-DecisionLog | |
| 2 | (none) | — | no | rule amendment; before/after below | |
| 3 | (none) | — | no | team-lead.md Pre-Flight #1 restatement | |
| 4 | (none) | — | no | solo.md Workflow step 1 restatement | |
| 5 | (none) | — | no | `node scripts/gen-commands.mjs nexus` | |
| 6 | release-plugin | Follow | no | recommend owner escalation `--minor` (new capability) | |

**Disposition rules:** see plan-template. All-`None` on steps 1–5 is legitimate (prose + dev-repo
mechanics; no pattern skill exists for rule authoring). `TDD: no` throughout — no testable code
behavior; acceptance is grep-based (see Testing Strategy).

## Domain Model Changes

None.

## Data Model Changes

None.

## Implementation Steps

### Step 1 — Precondition: commit the in-flight adhoc-DecisionLog release. Owner: operator (user)

The tree carries an uncommitted, release-complete 1.28.0 (adhoc-DecisionLog: `team-lead.md`,
`learner.md`, regenerated commands, `plugin.json`, `CHANGELOG.md`). This feature also edits
`team-lead.md`; starting before that commit entangles two features in one bump (Q4: user chose
commit-first). Agents never commit another feature's work — this step is the user's.

Acceptance: `git status --short` reports no modified tracked files under `plugins/nexus/**` before
Step 2 begins. Satisfies: Q4 (questions.md).

### Step 2 — Amend the canonical rule (`plugins/nexus/rules/agents-workflow.md`, §Branch Pre-Flight & Default-Branch Resolution)

Skill: None. The section heading is **byte-stable** — referenced from `team-lead.md:228`
(verbatim), `team-lead.md:396` (abbreviated "Branch Pre-Flight"), `solo.md:34` (verbatim), and
in-file from `agents-workflow.md:82`; keep the heading unchanged so all resolve. Default-branch
resolution (lines 38-43) and the stale-default overlay (line 58) are untouched.

2a. **Preamble (R1):** extend the existing launch-time sentence with the explicit timing contract:
the checkpoint runs **before the first write of any kind — artifact or code** — on the clean-start
path. Keep the existing Resume-vs-launch disambiguation text as is.

2b. **Matrix (R1, R2):** the two attended "Ask" cells change from their two-option text to a
reference to the shared option set + recommendation duty. Before/after (amendment rule —
guardrail changes carry explicit before/after):

Before (rows 1 and 3, attended column):
> `Ask: new branch (named {slug}) or continue here` / `Ask: continue here, or new branch {slug} from the default`

After (both rows, attended column):
> `Ask: the branch-strategy option set below, with a recommendation`

Slug-match row (silent proceed) and the entire unattended column: **unchanged, byte-for-byte**.
Row 4 (detached HEAD) attended cell also stays **byte-stable** (`Ask to create a branch`) — the
option set doesn't cleanly apply on a detached HEAD (continue-here strands commits, stacked is
meaningless with no current branch); the cell still asks, so R1 holds (critic MED-1, resolved).

2c. **New block — "Branch-strategy option set (attended ask)":** the four options, each with its
one-line "right when" description:
1. **Continue here** — work on the current branch (covers "just use main" when on the default).
2. **New branch from the default** — name = `{slug}` (existing naming rule stands).
3. **New branch from the current branch (stacked)** — offered **only when current ≠ default**;
   right when the new work builds on unmerged in-flight work.
4. **New worktree** — `git worktree add -b {slug} ../{repo-dir-name}-{slug} {defaultBranch}`;
   right for parallel/long-running work or a dirty tree that must stay untouched. Note the
   cleanup obligation (`git worktree remove` after merge) in one line.

The 4-option shape deliberately fits the `AskUserQuestion` option cap; agents may present it with
that tool or plain text — the rule stays mechanism-agnostic.

2d. **New block — "Recommendation duty (attended ask)":** every ask **carries exactly one
recommended option + `confidence: high|medium|low` + a one-line why** (house checkpoint pattern),
derived from work shape × tree state:
- Dirty tree, dirt belongs to **this same work** (fix-cycle) → recommend **continue here**.
- Dirty tree, dirt is **unrelated / another feature's in-flight work** → recommend **worktree**
  (isolate the new work; never build on a tree you can't commit cleanly). Stash-then-branch is
  fallback guidance only — when a worktree is impractical — never a first-class option (stashes
  get forgotten; a worktree isolates without moving the in-flight work).
- Clean tree, small single-commit change → recommend **continue here**.
- Clean tree, multi-commit / PR-bound feature → recommend **new `{slug}` branch from the default**.
- New work **builds on** the current unmerged branch → recommend **stacked branch**.
- Work will run **in parallel** with other active work in this checkout (another session/agent)
  → recommend **worktree**.

One line on relatedness inference: the agent judges "same work vs unrelated" from available
signals — slug/branch-name match, the dirty files' overlap with the new work's surface, an
uncommitted bump/CHANGELOG entry naming another slug — and when unsure says so (that lowers the
recommendation's confidence label; it never silently classifies).

2e. **Dirty-tree overlay rewrite:** the existing overlay line (line 57) folds into 2d — replace
its "warn and offer to isolate (new branch or worktree)" with: the dirty state feeds the
recommendation (per 2d) and the warning names *which files are dirty and whose work they appear to
be*. The unattended half of the overlay ("abort if it can't be cleanly isolated") is **unchanged**.

2f. **Unattended note (one line):** a worktree is **never auto-selected** — unattended keeps
auto-branch per the matrix and the abort overlay (an unattended run switching its working
directory mid-run is a harness risk no one can approve).

Acceptance (grep-and-confirm, all against `plugins/nexus/rules/agents-workflow.md`):
`grep -c 'stacked'` ≥ 1; `grep 'git worktree add -b'` hits; `grep 'confidence: high|medium|low'`
(or the block's literal label line) hits; `grep 'never auto-selected'` hits; the heading line
`## Branch Pre-Flight & Default-Branch Resolution` unchanged; the unattended column cells, the
slug-match attended cell, and the detached-HEAD row byte-identical to pre-edit (verify via
`git diff` — no hunk touches them).
Satisfies: R1, R2, R3.

### Step 3 — Update the team-lead restatement (`plugins/nexus/agents/team-lead.md`, Pre-Flight #1, line 228)

Skill: None. Rewrite the inline option text to match the amended rule without restating it: the
guard asks with **the canonical option set + a recommendation** (reference the rule section by
name); fold the step's existing dirty-tree sentence into "tree dirtiness feeds the
recommendation — never silently build on a tree you won't be able to commit cleanly." Keep the
clean-start-only parenthetical and the #0-fork note verbatim. Binding constraint: the restatement
**names no option list of its own** — drift-proofing; the rule is the single source (the current
two-option restatement is exactly the drift this prevents).

Acceptance: `team-lead.md:228` region references the canonical section name and contains no
enumerated option list; `git diff` on the file touches only Pre-Flight #1. Satisfies: R1, R2, R4.

### Step 4 — Update the solo restatement (`plugins/nexus/agents/solo.md`, Workflow step 1, line 34)

Skill: None. Same treatment: solo's step 1 keeps "Branch pre-flight (first)" and the
attended-column note, drops its inline two-option enumeration in favor of "ask with the canonical
option set + recommendation (see the rule)", and keeps "Reference the rule; don't restate the
matrix." Solo-specific line to add: for a 1-3 file fix on a clean tree the recommendation will
usually be *continue here* — solo should not over-branch for trivial work.

Acceptance: `solo.md` step 1 references the canonical section; no enumerated option list remains
in the step; `git diff` touches only step 1. Satisfies: R1, R2, R4.

### Step 5 — Regenerate commands

Skill: None. Run `node scripts/gen-commands.mjs nexus`. With Step 1 done (tree clean beforehand),
the diff must be confined to `plugins/nexus/commands/team-lead.md` and
`plugins/nexus/commands/solo.md`, mirroring Steps 3-4.

Acceptance: `git status --short` shows exactly those two files newly modified by this step;
their diffs mirror the agent-file edits. Satisfies: R4.

### Step 6 — Release

Follow release-plugin. Feature-specific inputs: single bump covering Steps 2-5 (run once, after all
edits land — never per-step); the tool proposes PATCH; recommend the owner escalate to
**`--minor`** — first-class worktree option + recommendation duty is a new capability, not a fix.
CHANGELOG entry names: rule amendment (option set + recommendation heuristic), the two agent
restatements, regenerated commands. The skill's own flow covers validate + the omni twin sync
(mirrored commit message per CLAUDE.md).

Acceptance: per the skill (bump committed with the change; `claude plugin validate --strict`
clean); plus `node --test tests/unit/*.test.mjs` green (no test pins the rule prose — verified at
plan time: zero hits for `agents-workflow|Branch Pre-Flight` under `tests/`). Satisfies: R1-R4
(release reaches users; a version-keyed cache means an unbumped change ships to no one).

## Cross-Service Changes

None. (The omni twin regenerates inside Step 6's release flow.)

## Migration Notes

None.

## Testing Strategy

Prose-only pass — no new tests. Verification is grep-based acceptance per step (each written as
the exact grep target, above) plus the existing unit suite green as the no-regression backstop.
The reviewer's Step-2 lens: option-set completeness vs Q3, heuristic vs R3, restatement-vs-rule
drift (Steps 3-4 must not re-enumerate options), and byte-stability of the unattended column +
slug-match cell + detached-HEAD row + section heading.

Unchanged-anchor consumers (verify consistency, no edit expected — critic LOW-2):
`team-lead.md:462` (Unattended-Mode restatement — unattended column + stale-default overlay only,
both byte-stable here; 2f's "worktree never auto-selected" note is consistent with it) and
`agents-workflow.md:75`/`:82` (Host Adapter references to this section's unchanged anchors).

## KB Impact

None — this repo has no `docs/kb/` consumers of the rule; the CHANGELOG (Step 6) is the release
record.

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| Amend the canonical rule; agents keep thin references (no per-agent matrix restatement) | Single source both agents already load (allocation principle); the current two-option restatement in team-lead.md is live drift evidence | Restate the full option set per agent | decided |
| Worktree is never auto-selected in unattended mode | Unattended can't ask, and a mid-run CWD switch is a harness risk; auto-branch + abort overlay preserved | Auto-worktree for dirty unattended trees | decided |
| Stacked-branch option shown only when current ≠ default | Keeps the common case a 3-option ask; the option is meaningless from the default branch | Always show 4 options | decided |
| Stash demoted to fallback guidance inside the recommendation block | Stashes get forgotten; a worktree isolates without moving in-flight work | First-class stash-then-branch option | decided |
| Detached-HEAD attended cell stays byte-stable (`Ask to create a branch`) | Continue-here strands commits and stacked is meaningless there — the narrow ask is the state-appropriate one, and it still asks (R1 holds) | Upgrade row 4 to the full option set with a recommendation | decided |

## Open Questions

None — Q1-Q5 answered (`questions.md`).

## Plan Review

Code-grounded critic (Mode 2), 2026-07-10 — verdict **ACCEPT**, no CRITICAL/HIGH. All factual
claims about the live rule/agent files verified (matrix cell quotes, line refs, gen-commands
mirror behavior, zero test pins on the rule prose, git-worktree recipe argument order). Findings
folded: **MED-1** detached-HEAD row dispositioned byte-stable (Step 2b + Decisions row + reviewer
checklist); **LOW-1** reference list corrected (verbatim vs abbreviated); **LOW-2**
unchanged-anchor consumers (`team-lead.md:462`, `agents-workflow.md:75/:82`) listed in Testing
Strategy; **LOW-3** Step 3 `Satisfies:` now carries R2. Critic's open note on Q3's
presumed-default option set: confirmed sound by the critic; stands as adopted.
