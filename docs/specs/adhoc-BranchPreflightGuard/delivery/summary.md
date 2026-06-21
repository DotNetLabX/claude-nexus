# Branch Pre-Flight Guard + Push Gate — Summary

## Status: COMPLETE

## What Was Built
A launch-time **branch guard** and a closure-time **push gate** for the Nexus pipeline, added to
both the team-lead and solo agents and defined once canonically in the always-on
`agents-workflow.md` rule. The guard resolves the repo's default branch (`origin/HEAD` → config
`defaultBranch` → `main`) and decides new-branch-vs-continue via a 4-state attended/unattended
matrix, with dirty-tree and (best-effort) stale-default overlays. The push gate is opt-in: attended
asks, unattended never pushes unless `autoPush: true`, and both defer to hardened guard mode. Git-only
and host-agnostic; the PR / AI-review / merge-to-main tail is explicitly out of scope (deferred).

## Key Outcomes
- **Files modified:** 7 plugin files — `agents/team-lead.md`, `agents/solo.md`,
  `commands/team-lead.md`, `commands/solo.md`, `rules/agents-workflow.md`,
  `.claude-plugin/plugin.json`, `CHANGELOG.md`. Two optional `.claude/nexus-agents.json` keys
  documented (`defaultBranch`, `autoPush`).
- **Version:** bumped 1.16.1 → **1.16.2** (PATCH).
- **Build:** lint+unit 0 failing; `attended-unchanged.golden.test.mjs` 5/5 (negative control — no hook
  surface moved); `bump-plugin --check` PASS. (The 2 selfcheck FAILs — gen-commands HEAD
  false-positive, gen-omni owner follow-through — are expected carry-overs, resolved at commit /
  omni-sync.)
- **Review:** Step-1 done-check **PASS** (0 Missing). Step-2 **Standard+Codex** — nexus reviewer
  **APPROVED** (0 findings) and Codex **GO** (all invariants hold), independently, **1 cycle**.

## Deviations from Plan
- **One in-flight plan correction (not a deviation from the committed plan):** the developer's Phase-1
  analyze found Step 1's stale-default `git fetch` overlay rested on two false premises (`git fetch` is
  not blocked in hardened mode; agents have no runtime signal for guard mode). The architect confirmed
  against source and corrected plan.md Step 1 to "unconditional best-effort warn-and-skip" before
  implementation. Implementation matches the corrected plan exactly — no substantive deviations.

## Notes
- **Latent doc bug, out of scope (flagged for a future pass):** `guard.js:12` doc-comment and
  `README.md:40` over-claim that hardened mode blocks "remote fetches" — the regex only blocks
  `git push`, network installs, and `curl|wget|iwr|invoke-webrequest`, **not** `git fetch`. A reader
  would wrongly assume `git fetch` is blocked. Candidate for a separate doc-hardening pass.
- **Pre-existing, out of scope:** `claude plugin validate` reports frontmatter errors on
  `evaluate-skill`/`improve-skills` SKILL.md — present at HEAD, not in this diff.
- **Owner follow-through (post-commit):** omni twin regenerated via `gen-omni.mjs` and committed in
  `../omni` with the mirrored-subject convention (resolves the `gen-omni --check` selfcheck FAIL).
