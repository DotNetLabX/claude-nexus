# Cross-Check Review — adhoc-BranchPreflightGuard

**Verdict:** GO

## Summary

All seven changed files were read in full. The implementation is internally consistent across every requested check: default-branch resolution order, the 4-state attended/unattended matrix, dirty-tree and stale-default overlays, push-gate branching, team-lead Pre-Flight numbering and cross-reference integrity, agent-to-rule consistency, and agent-to-command consistency. No contradictions, omissions of required content, numbering errors, or blocking prose ambiguities were found.

## Findings

| # | Severity | File | Section/Line | Issue |
|---|----------|------|--------------|-------|
| — | — | — | — | No issues found. |

## Evidence Notes

- **Default-branch resolution order** (origin/HEAD → config → main) is explicit and consistent in `plugins/nexus/rules/agents-workflow.md:39-41`, `plugins/nexus/agents/team-lead.md:202`, `plugins/nexus/commands/team-lead.md:202`, and `plugins/nexus/CHANGELOG.md:15`.
- **4-state attended/unattended matrix** is canonically defined in `plugins/nexus/rules/agents-workflow.md:45-52`, including the detached/no-slug cell at line 52. Team-lead applies the canonical rule in `agents/team-lead.md:202` and mirrors the unattended branch outcomes at `agents/team-lead.md:411`; the generated command mirror matches at `commands/team-lead.md:202` and `commands/team-lead.md:411`. Solo references the same canonical attended flow in `agents/solo.md:16` and `commands/solo.md:17`.
- **Dirty-tree overlay and stale-default overlay** are both present and consistent in `plugins/nexus/rules/agents-workflow.md:57-58`. Team-lead folds the dirty-tree overlay into Pre-Flight #1 at `agents/team-lead.md:202` and carries the stale-default best-effort note in unattended mode at `agents/team-lead.md:411` (mirrored in `commands/team-lead.md:202` and `commands/team-lead.md:411`).
- **Push-gate logic** is explicit in `plugins/nexus/agents/team-lead.md:355-359`: attended ask (`:356`), unattended `autoPush` gate (`:357`), hardened-mode deferral (`:358`), and merge-to-main deferral (`:359`). The generated command mirror matches at `commands/team-lead.md:355-359`. Solo's attended-only push ask is present in `agents/solo.md:19` and `commands/solo.md:20`.
- **Pre-Flight numbering integrity** (0, 1, 3, 4, 4b, 5, 6, 7 — no #2): intact in `plugins/nexus/agents/team-lead.md:201-208`. The `see Pre-Flight 4b` cross-reference is valid at `agents/team-lead.md:101`; the generated command mirror preserves the same structure at `commands/team-lead.md:101, 202, 205`.
- **Release metadata**: `plugins/nexus/.claude-plugin/plugin.json` bumps version to `1.16.2`; `plugins/nexus/CHANGELOG.md:5-29` records the branch-guard/push-gate change set consistently with the reviewed prose.

## Carry-Overs Confirmed (not findings)

| Item | Confirmed state |
|------|----------------|
| `selfcheck.mjs` gen-commands FAIL | Expected; git-HEAD false-positive at pre-commit stop, resolves at team-lead commit. Not a finding. |
| `selfcheck.mjs` gen-omni --check FAIL | Expected; omni-twin owner follow-through pending. Not a finding. |
| lint + unit = 0 failing | Confirmed pass. |
| `bump-plugin --check` = PASS | Confirmed pass. |
| `claude plugin validate` frontmatter errors (evaluate-skill/improve-skills) | Pre-existing, out of scope. |
| guard.js/README "remote fetches" doc over-claim | Pre-existing, out of scope. |
