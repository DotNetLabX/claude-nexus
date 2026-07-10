# Branch Strategy Ask (Branch Pre-Flight v2) — Implementation

Standalone architect-led run — no team lead. Executed Steps 2-6 of `plan.md`; Step 1 (operator
commit of adhoc-DecisionLog as `eb22ffa`) was already done before this run started.

## Files Modified

- `plugins/nexus/rules/agents-workflow.md` — amended the canonical **Branch Pre-Flight &
  Default-Branch Resolution** section (lines 34-78): added the timing-contract sentence (R1),
  changed the two attended "Ask" matrix cells to reference the shared option set (R1/R2), added
  the **Branch-strategy option set** block (4 options: continue here / new branch from default /
  stacked / new worktree) and the **Recommendation duty** block (confidence-labeled recommendation
  heuristic, R3), rewrote the dirty-tree overlay to fold into the recommendation duty while
  preserving its original "always warns, even on a silent slug-match proceed" guarantee, and added
  the one-line **Unattended note** (worktree never auto-selected). Heading, default-branch
  resolution order, unattended column, slug-match attended cell, and detached-HEAD row are
  byte-identical to pre-edit (verified below).
- `plugins/nexus/agents/team-lead.md` — Pre-Flight #1 (line 228): rewrote the inline branch-guard
  text to reference the canonical option set + recommendation instead of restating the old
  two-option list; folded the dirty-tree sentence into "tree dirtiness feeds the recommendation —
  never silently build on a tree you won't be able to commit cleanly." No option list of its own.
- `plugins/nexus/agents/solo.md` — Workflow step 1 (line 34): same treatment — drops the inline
  two-option enumeration for "ask with the canonical option set + recommendation (see the rule)",
  and adds the solo-specific line: for a 1-3 file fix on a clean tree the recommendation will
  usually be *continue here*, so solo should not over-branch for trivial work.
- `plugins/nexus/commands/team-lead.md`, `plugins/nexus/commands/solo.md` — regenerated via
  `node scripts/gen-commands.mjs nexus`; diffs mirror the two agent-file edits exactly (verified
  below). No other command file changed.
- `plugins/nexus/.claude-plugin/plugin.json` — version bumped `1.28.0` → `1.29.0` (MINOR,
  owner-escalated per plan Step 6).
- `plugins/nexus/CHANGELOG.md` — new `## [1.29.0]` entry, hand-edited after `bump-plugin.mjs`
  generated its stub (per the `release-plugin` skill's own Step 3: "edit the generated CHANGELOG
  entry to describe the actual change — the stub line is just a placeholder"). See Deviations for
  why the auto-generated reasons list needed correcting before use.

## Key Decisions

- **Overlay rewrite kept the original "applies on every row" scope explicit.** The plan's Step 2e
  literal replacement text ("the dirty state feeds the recommendation…") reads, taken alone, as
  scoped to rows that actually ask (recommendations only exist inside an ask). The original text
  ("warn and offer to isolate… before proceeding") was scoped to the whole "Overlays (apply on top
  of the matrix)" heading, i.e. every row including the silent slug-match proceed. My first draft
  reproduced the plan's literal wording and lost that "every row" guarantee; the code-review pass
  (below) caught it and I added one clause — "applies on top of every row, including a silent
  slug-match proceed" — to restore the plan's own stated invariant ("its meaning is unchanged").
  This is an implementation-level wording fix to deliver what the plan already committed to, not a
  scope change.
- **Reworded the option-set intro sentence away from an "always four" overclaim.** The plan's Step
  2c doesn't give literal intro-sentence text — I drafted "the four options every attended ask
  offers (except the detached-HEAD row…)". That overclaims: per the plan's own Decisions table
  ("Stacked-branch option shown only when current ≠ default… keeps the common case a 3-option
  ask"), the "On the default branch" row only ever offers 3 of the 4 (stacked never applies there).
  Reworded to "up to four, per each option's own condition below" so the per-option conditions (own
  option 3's "only when current ≠ default") are the single source of truth for cardinality, instead
  of a contradicting blanket claim.
- **Fixed a dangling forward-reference.** My first draft's intro sentence said the detached-HEAD
  row's narrower ask is explained "see below" — nothing below explains it (it's the pre-existing
  matrix cell, above). Reworded to point at the matrix above instead of an empty "below".

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | operator precondition, already done before this run (commit `eb22ffa`) |
| 2 | None | plan disposition: no pattern skill exists for rule authoring (plan-sanctioned) |
| 3 | None | plan disposition: thin restatement, no pattern skill (plan-sanctioned) |
| 4 | None | plan disposition: thin restatement, no pattern skill (plan-sanctioned) |
| 5 | None | mechanical: `node scripts/gen-commands.mjs nexus` |
| 6 | release-plugin | invoked via Skill tool; followed its Procedure steps 1 (dry-run/classify), 2 (owner judgment already made — `--minor`), 3 (apply + hand-edit the generated CHANGELOG stub), 6 (validate). Steps 5 (omni sync), 7 (same-commit stage+commit), 8 (tag) explicitly out of scope for this run per task limits — see Deviations. |
| (post-implementation) | code-review | invoked via Skill tool at `effort: medium` for the first-round review of the working diff — see Self-Review below |

## Deviations from Plan

- **Step 6 — gen-omni, tag, commit skipped by task mandate.** The dispatching instructions
  explicitly scoped this run to "run the bump... validate... Do NOT run gen-omni (it writes outside
  this repo — close-time concern), do NOT tag, do NOT commit." This deviates from the
  `release-plugin` skill's full Procedure (steps 5, 7, 8) and from the plan's Step 6 acceptance
  line ("bump committed with the change") — both are **plan-sanctioned deviations for this run**;
  the commit, omni sync, and tag are the main session's close-time responsibility, not mine. No
  `OPERATOR ACTION REQUIRED` fallback is implicated (this isn't a missing credential/connection —
  it's a scoping decision in the dispatch instructions), so I'm recording it here as a scope
  deviation rather than an operator-owed fallback.
- **CHANGELOG auto-generation picked up unrelated, untracked in-flight work — hand-corrected.**
  `bump-plugin.mjs` classifies the *whole working tree* against HEAD (staged + unstaged +
  untracked), per its own header comment and CLAUDE.md's warning about mid-sequence double-bumps.
  At Step 6 time the tree also carried an untracked `plugins/nexus/skills/mine-semantic-model/`
  directory — unrelated in-flight work explicitly named in my task's do-not-touch list. Both the
  dry-run and the apply run surfaced a `skill change (mine-semantic-model)` reason line as a result
  (recorded verbatim below in Step 6's evidence). I did not touch that skill directory or its spec;
  I hand-edited only the generated `## [1.29.0]` CHANGELOG entry text to describe this feature's
  actual change and removed the false attribution — exactly what the `release-plugin` skill's own
  Step 3 instructs ("edit the generated CHANGELOG entry to describe the actual change — the stub
  line is just a placeholder"). `plugin.json`'s version number itself (`1.29.0`) is unaffected by
  this — the tool doesn't version per-reason, so no further correction was needed there.
  **Carry-over note for the architect/main session:** the untracked `mine-semantic-model` skill dir
  (and, discovered later in the run, further concurrent edits to
  `plugins/nexus/skills/mine-reference-model/SKILL.md`,
  `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`, and
  `plugins/nexus/skills/mine-verify-repo/SKILL.md` from what appears to be another concurrent
  session) are still on the tree as of this writing and are **not** part of this feature's diff —
  confirm they're excluded when staging this feature's commit at close.
- **Two wording fixes beyond the plan's literal Step 2 text**, both surfaced by the code-review
  pass and both needed to actually satisfy the plan's own stated constraints (not a scope change) —
  see Key Decisions above: (1) the dirty-tree overlay's "applies on every row" scope, (2) the
  option-set intro's cardinality overclaim + dangling "see below" reference.

## Step-by-Step Acceptance (grep/diff evidence)

### Step 1 (operator precondition — pre-verified, not re-run as "my" step)
`git status --short` before Step 2 began showed no modified tracked files under `plugins/nexus/**`
(only unrelated untracked dirs/files, and one already-modified `docs/proposals/...` file outside
`plugins/nexus/**`). `git log --oneline -1` = `eb22ffa feat(adhoc-DecisionLog): ... release nexus
1.28.0`; `plugin.json` read `1.28.0`. Confirmed satisfied.

### Step 2 — rule amendment
All plan-specified greps against `plugins/nexus/rules/agents-workflow.md`, re-run after the
code-review fixes:
```
grep -c 'stacked'                        -> 2
grep 'git worktree add -b'               -> line 60, hit
grep 'confidence: high|medium|low'       -> line 64, hit
grep 'never auto-selected'               -> line 78, hit
grep '^## Branch Pre-Flight & Default-Branch Resolution' -> line 34, hit
```
Byte-stability (verified via `git diff` hunks on the file):
- **Section heading** (`## Branch Pre-Flight & Default-Branch Resolution`, line 34): no `-`/`+`
  hunk touches it — pure context line. Byte-identical.
- **Unattended column**: the "Auto-create `{slug}` from the default, proceed" cell text on both
  changed rows (On the default branch / Unrelated branch) is byte-identical between old and new —
  the row is a single markdown table line so the diff shows the whole line as a hunk, but only the
  Attended cell's text differs; the Unattended cell substring is unchanged in both directions
  (manually diffed cell-by-cell above).
- **Slug-match attended cell** (`Proceed silently ("Working on `{branch}`")`, "Branch matches the
  slug" row): no hunk touches this row at all — pure context line. Byte-identical.
- **Detached-HEAD row** (`Ask to create a branch` / `**Abort** (can't safely auto-branch)`): no
  hunk touches this row at all — pure context line. Byte-identical.
Satisfies: R1, R2, R3.

### Step 3 — team-lead.md restatement
`team-lead.md:228` region now reads: "on the default branch or an **unrelated** branch, **ask with
the canonical option set + a recommendation** (see the rule)" — references the canonical section
by name, contains no enumerated option list (grepped for "new branch" / numbered list markers in
the changed line — none found). `git diff --stat -- plugins/nexus/agents/team-lead.md` = `1 file
changed, 1 insertion(+), 1 deletion(-)` — touches only Pre-Flight #1. Satisfies: R1, R2, R4.

### Step 4 — solo.md restatement
`solo.md` step 1 now reads "ask with the canonical option set + recommendation (see the rule)" —
no enumerated option list remains (the old "(new `{slug}` branch from the default, or continue
here)" parenthetical is gone). `git diff --stat -- plugins/nexus/agents/solo.md` = `1 file changed,
1 insertion(+), 1 deletion(-)` — touches only step 1. Solo-specific "don't over-branch for trivial
work" line added per plan. Satisfies: R1, R2, R4.

### Step 5 — regenerate commands
`node scripts/gen-commands.mjs nexus` run; `git status --short -- plugins/nexus/commands/` shows
exactly:
```
 M plugins/nexus/commands/solo.md
 M plugins/nexus/commands/team-lead.md
```
No other command file changed. `git diff` on both confirmed to mirror the corresponding
agent-file edits line-for-line (same before/after text, differing only by the generator's
frontmatter/wrapper, not the body). Satisfies: R4.

### Step 6 — release
`--dry-run` (before apply):
```
bump-plugin (dry-run) — base HEAD:
  nexus: PATCH  1.28.0 -> 1.28.1
      - agent instruction/behavior change
      - shipped command changed
      - rule (injected every session)
      - skill change (mine-semantic-model)
```
(The `skill change (mine-semantic-model)` line is the unrelated-tree contamination described in
Deviations — not part of this feature.)

`--minor` (apply):
```
bump-plugin (apply) — base HEAD:
  nexus: MINOR  1.28.0 -> 1.29.0
      - agent instruction/behavior change
      - shipped command changed
      - rule (injected every session)
      - skill change (mine-semantic-model)
      - owner-escalated to minor
  wrote nexus 1.28.0 -> 1.29.0 + CHANGELOG.md
```
`plugin.json` confirmed at `"version": "1.29.0"`. CHANGELOG entry hand-corrected (see Deviations)
to accurately describe the rule amendment, the two restatements, and regenerated commands, per the
plan's Step 6 instruction ("CHANGELOG entry names: rule amendment..., the two agent
restatements, regenerated commands").

`claude plugin validate plugins/nexus --strict`:
```
Validating plugin manifest: D:\src\claude-plugins\nexus\plugins\nexus\.claude-plugin\plugin.json
✔ Validation passed
```
(Re-run after the code-review fixes too — still passes.)

`node --test tests/unit/*.test.mjs`:
```
ℹ tests 462
ℹ pass 462
ℹ fail 0
```
Zero hits for `agents-workflow|Branch Pre-Flight` under `tests/` confirmed at plan time; no test
regressed.

**Deviations for this step** (task-mandated, see Deviations from Plan): no gen-omni, no tag, no
commit — all deferred to the main session's close.
Satisfies: R1-R4.

## Self-Review

Invoked the `code-review` skill via the Skill tool (`--effort medium`) on the working diff. The
diff is pure prose (markdown instructional text for agents, no executable code), so several of the
skill's default finder angles (SQL injection, wrapper/proxy correctness, language pitfalls, etc.)
don't apply to this content. Scaled the review to two focused, parallel read-only finder passes
(via the Explore agent) covering the angles that map onto a prose/rule diff: removed-behavior
audit, cross-file/cross-reference consistency, internal logical consistency, reuse/duplication,
simplification/altitude, CLAUDE.md conventions, and CHANGELOG accuracy — then verified and
resolved the findings myself (I have full diff context; this substitutes for the skill's separate
verify-agent step at this proportionate depth).

**Findings found: 3 real, 1 dismissed.**

| # | Finding | Verdict | Disposition |
|---|---------|---------|-------------|
| 1 | Dangling forward-reference: option-set intro said the detached-HEAD row's narrower ask is explained "see below" — nothing below explains it; the actual explanation (`Ask to create a branch`, matrix line 52) is *above* the sentence. | CONFIRMED (both finder passes independently found this) | **Fixed** — reworded to "the detached-HEAD row keeps its narrower ask from the matrix above instead of this set" (line 56). |
| 2 | Dropped guarantee: original dirty-tree overlay ("warn and offer to isolate... before proceeding") applied on top of every matrix row, including the silent slug-match proceed row. My first-draft rewrite tied the warning to "the recommendation," which per the Recommendation-duty block only exists inside an ask — leaving the slug-match+dirty-tree combination with no stated warning, narrowing a guarantee the same bullet claims is "unchanged." | CONFIRMED | **Fixed** — added "applies on top of every row, including a silent slug-match proceed... a dirty/unrelated tree still gets a named warning even when the branch choice itself asks nothing" (line 75). |
| 3 | Internal contradiction: option-set intro claimed "the four options every attended ask offers... except the detached-HEAD row," but option 3 (stacked) is separately conditioned on "only when current ≠ default" — so the "On the default branch" row only ever offers 3 of the 4, contradicting the blanket "four... except detached-HEAD" claim. | CONFIRMED | **Fixed** — same edit as finding 1 reworded the intro to "up to four, per each option's own condition below," making the per-option conditions (not a blanket count) the source of truth. |
| 4 | Redundant "why" restated between the option-set block's descriptive prose (e.g. "right when the new work builds on unmerged in-flight work") and the recommendation-duty block's decision rules (e.g. "New work builds on the current unmerged branch → recommend stacked branch") — a forward-looking maintenance note that both blocks could drift apart if a trigger condition changes. | PLAUSIBLE, but plan-conformant | **Dismissed — not a defect.** This duplication is exactly what the approved plan specifies (plan.md Step 2c/2d, lines 96-121, read almost byte-identically) and the plan's own critic pass (ACCEPT, no CRITICAL/HIGH) didn't flag it as an issue. The finding agent itself classified this as "not an authoring error." Logged to `lessons.md` as a forward-looking note rather than fixed, since fixing it would mean deviating from the plan's explicit prescribed structure without architect sign-off. |

Both finder passes also explicitly checked and found **no issues** on: preservation of the two
original options (continue-here, new-branch-from-default) in the new 4-option set; the
detached-HEAD row's matrix-cell vs. option-set-carve-out consistency; recommendation-duty coverage
of all 4 options; the team-lead.md/solo.md "no enumerated option list" binding constraint;
cross-file references (`Host Adapter & PR Tail` section, team-lead.md:462 Unattended-Mode
restatement) still resolving correctly; command-mirror fidelity; version-bump correctness against
CLAUDE.md's release rules; and CHANGELOG-vs-`git diff --stat` accuracy (confirmed the corrected
entry lists exactly the files this feature changed, no more, no less).

**Verdict: 3 findings fixed, 1 dismissed with reason. No CRITICAL/HIGH outstanding.** All grep/diff
acceptance criteria re-verified clean after the fixes (see Step 2 evidence above); build/test
suite green; `claude plugin validate --strict` clean.

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Redundant trigger-condition wording between the option-set and recommendation-duty blocks | low | architect | `agents-workflow.md` lines 56-70 — "builds on unmerged in-flight work" (option 3) / "New work builds on the current unmerged branch" (recommendation bullet); "dirty tree that must stay untouched" + "parallel/long-running work" (option 4) / two separate worktree-recommendation bullets | Plan-conformant duplication (plan.md Step 2c/2d), not a defect — flagged only as a future maintenance note: if a trigger condition changes, both blocks need updating in lockstep. |
| Unrelated concurrent tree activity during this run | info | architect/main session | `plugins/nexus/skills/mine-reference-model/SKILL.md`, `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`, `plugins/nexus/skills/mine-verify-repo/SKILL.md` modified, and `docs/skill-evals/2026-07-10-mine-semantic-model.md` created, all mid-session, none by me | Confirm these (plus the pre-existing untracked `plugins/nexus/skills/mine-semantic-model/`, `docs/specs/adhoc-AnalystExtension/`, `docs/specs/adhoc-ArchitectFastLane/`, `docs/specs/adhoc-MineSemanticModel/`, `docs/proposals/nexus-data-extension-2026-07.md`) are excluded when staging this feature's commit at close — none are part of this diff. |

## KB Changes

None — this repo has no `docs/kb/` consumers of the rule (plan's KB Impact: None).

---

*Status: COMPLETE — developer, 2026-07-10*
