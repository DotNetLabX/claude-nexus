# F17-MineFieldFixes — Lessons

> **Learner disposition (2026-07-21 → nexus 1.39.2):** [APPLIED] `node --test` glob form → CLAUDE.md ## Running tests (with F3, AgentModelRetier2) — the execute-the-test-invocation rule itself already ships in create-implementation-plan ("grep, test runner, or generator"); the CLAUDE.md line removes the per-run rediscovery. [ROUTED-TO-BACKLOG] `edit-shipped-plugin-skill` gap → backlog F24 (with F16, F20). [TRACKED] built-in `/review` is PR-scoped — disclosed self-review is the fast-lane fallback (1 occurrence); stale-adjacent-surface triple (JSDoc/header/prose) folds into the F24 recipe.

## Developer Lessons
- **`node --test <dir>` (directory form) fails under Node 24 in this repo.** The plan's Step-4
  invocation `node --test tests/unit/` errors with `Cannot find module '…/tests/unit'` on Node
  v24.18.0 (the runner tries to load the directory as a CJS entry point, not discover tests). The
  working equivalent from repo root is the shell-expanded glob **`node --test tests/unit/*.test.mjs`**
  (bash), which ran all 42 files / 538 tests. Worth having plans specify the glob form, or a repo
  test script, to avoid the per-run rediscovery. (There is no `package.json` in the repo root, so no
  `npm test` shortcut exists.)
- **The built-in `/review` skill is GitHub-PR-scoped — it cannot review an uncommitted working-tree
  diff.** Invoking it resolves the target via `gh pr view <arg>` and explicitly declares "local
  working-tree changes are out of scope." For an architect-led fast lane (commit deferred to lane
  close, no PR yet), `/code-review` is effectively unavailable; the sanctioned fallback is a
  disclosed self-review against the `review-format` checklist. Record the reason in the Self-Review
  section so the choice is auditable.
- **Prose-hardening self-review pays off on adjacent code docs.** The `stageModelPlan` UNIVERSAL key
  was correct, but the function's `@param` JSDoc typedef enumerated the config fields and silently
  went stale (missing the new key). A "stale adjacent element" pass caught it — for a shipped tool,
  the typedef, header comment, and the array are three surfaces that must move together.

## Architect Lessons
- **Execute the *test invocation* at plan time, not just the greps.** The plan-grounding rule
  ("every pinned acceptance command is executed at plan time") was applied to every grep but NOT to
  the Step-4 full-suite command — `node --test tests/unit/` (directory form) fails under this
  repo's Node 24 and had to be swapped mid-run. One unexecuted pinned command = the one that
  deviated. (Evidence: [F17-MineFieldFixes])
- **A code-grounded critic on a prose-heavy plan is cheap and decisive.** All four findings were
  real (term-overload, semver deliberation, a literal-token gap, a labeling slip) and all were
  foldable in minutes because the critic re-executed every grep against the live tree; the
  fast-lane sequence plan → code-grounded critic → dispatch held up end-to-end. (Evidence:
  [F16-ArchitectureMiner, F17-MineFieldFixes])

## Skill Gaps

### edit-shipped-plugin-skill (dev-repo)
- **Kind:** missing
- **Searched for:** a skill covering the recurring dev-repo pass "edit shipped plugin skill text
  coherently" — smallest-coherent-edit discipline, enumeration/consumer sweep, adjacent-surface
  staleness (header comment / JSDoc / prose triple), lint gate, release-note obligations
- **Why it would help:** every plugin-feedback apply wave (F9, F16, F17, and the queued F18–F22)
  runs this same pass with the discipline re-derived in each plan; `improve-skills` covers
  project-local scaffolds and routes shipped fixes *to* this repo but no skill covers executing
  them *in* this repo
- **References:** `docs/specs/F17-MineFieldFixes/delivery/plan.md` (Steps 1–2, 4),
  `docs/specs/F16-ArchitectureMiner/delivery/plan.md` (Step 1 skill-verification note)
- **Evidence:** [F16-ArchitectureMiner, F17-MineFieldFixes]
