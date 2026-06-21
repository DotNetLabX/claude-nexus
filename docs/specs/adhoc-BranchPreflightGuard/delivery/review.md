# Branch Pre-Flight Guard + Push Gate — Review

## Step 1 — Done-Check

**Pre-commitment predictions** (made before reading implementation.md): given an agent-doc/rules-prose pass, the two most likely gaps were (1) the Step 2 Pre-Flight renumbering (`0,1,3,4,4b,5,6,7`, no #2) silently shifted or a `4b` cross-reference broken, and (2) the stale-default fetch overlay shipped with the *old* (wrong) "defers to hardened mode, which blocks remote fetches" wording instead of the corrected unconditional best-effort reframe. Both were checked specifically — both clean.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Canonical branch-guard rule in `agents-workflow.md` | Implemented | New `## Branch Pre-Flight & Default-Branch Resolution` section: D1 resolution order, 4-state attended\|unattended matrix (D2/D3), dirty-tree + stale-default overlays. Stale-default fetch shipped as **unconditionally best-effort warn-and-skip** — matches the corrected plan (the hardened-mode-deferral wording was removed). Launch-only / Resume-distinct pointer present. `Satisfies:` D1,D2,D3 real (locked this session). |
| 2 — Wire team-lead Pre-Flight to canonical guard | Implemented | #1(Dirty)+#2(Branch) collapsed into single #1 Branch guard; numbering held at `0,1,3,4,4b,5,6,7` (no #2, nothing below renumbered — developer grep-verified, `4b` xref at team-lead.md:101 intact); #0/Resume skip note added (HIGH-2); 4b reads both `defaultBranch`+`autoPush` (HIGH-3); unattended fork additive (ADR-30, MEDIUM-1). `Satisfies:` D1,D2,D3 real. |
| 3 — Push gate in team-lead Commit Protocol | Implemented | Push-gate subsection: attended ask; unattended `autoPush`-gated referencing the 4b-captured value; hardened-mode deferral to `guard.js` (correct — `git push` IS blocked at guard.js:139); explicit merge-to-main-out-of-scope note. `Satisfies:` D5 real. |
| 4 — Lightweight branch guard + push gate in solo | Implemented | Branch pre-flight folded into Workflow step 1 (Understand) referencing the canonical rule (matrix not restated); "before pushing, ask" line in step 4 (Document). Lightweight character kept. `Satisfies:` D4,D5 real. |
| 5 — Regenerate commands | N/A (generated artifact) | `node scripts/gen-commands.mjs nexus` run; `commands/team-lead.md` + `commands/solo.md` regenerated, diffs match agents line-for-line (developer: solo 4/4, team-lead 14/14). No hand-edits. The `selfcheck` gen-commands FAIL is the known git-HEAD-based false-positive that resolves at the team-lead commit — expected carry-over, not a regression (verified: lint+unit 0 failing, bump-plugin --check PASS per team-lead note; carry-over independently documented in implementation.md with grep evidence). |
| 6 — Version bump + release | Implemented (edits only; commit is team-lead/owner) | `plugin.json` 1.16.1 → 1.16.2 (PATCH) via `release-plugin`; CHANGELOG `[1.16.2]` entry naming the branch-guard + push-gate change. Edits-only, not committed (ADR-18 — team-lead owns the same-commit content+bump). Omni-twin regen is owner follow-through (the `selfcheck` gen-omni FAIL is that pending follow-through — expected carry-over, not a regression). `Satisfies:` ADR-9 release flow. |

**Skill conformance** (scored against `.claude/audit/skill-invocations.log`, scoped to `agent:developer` + `token:developer:implement` for this run):
- Plan Skill Mapping: Steps 1–5 `Skill: None` (agent-doc/rules-prose pass — the documented all-`None`-with-one-Follow shape; exempt from the log check); Step 6 `Follow release-plugin` (the only non-`None` mapping).
- Step 6 `release-plugin`: **present** in the scoped log — `2026-06-21T06:12:19Z … agent:"developer", skill:"nexus:release-plugin", token:"developer:implement"` (final-segment match `release-plugin`). ✓
- `## Skills Used` section present (structural gate) and consistent with the log — no fabrication (the one claimed invocation is logged; Steps 1–5 None corroborated). ✓
- TDD column all `TDD: no` (prose deliverable) — no `tdd` invocation owed. ✓

**Carry-over FAILs verified, not rubber-stamped** — both `selfcheck` FAILs are pre-existing/owner-follow-through, NOT this feature's regressions: (1) gen-commands drift = git-HEAD false-positive, commands match working-tree agents line-for-line, resolves at team-lead commit; (2) gen-omni --check = omni-twin owner follow-through after commit. lint+unit = 0 failing; bump-plugin --check = PASS. The pre-existing `claude plugin validate` frontmatter errors (evaluate-skill / improve-skills SKILL.md) and the `guard.js` hardened comment-vs-regex doc gap are both confirmed pre-existing and out of scope (the latter is the latent doc inaccuracy already flagged to the team lead).

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-06-21*

## Step 2 — Code Review

## Reviewed By
Reviewer agent (nexus:reviewer)

## Verdict: APPROVED

## Pre-commitment Predictions

Predicted before reading implementation:
1. Matrix wording in `agents-workflow.md` might drift from the plan's table (unrelated → ask, not auto-classify) — **CLEAN**
2. Pre-Flight numbering might have slipped from `0,1,3,4,4b,5,6,7` — **CLEAN** (confirmed via `git diff`)
3. 4b might have added only one key, not both `defaultBranch` + `autoPush` — **CLEAN**
4. Commit Protocol might do a fresh config read for `autoPush` rather than referencing the 4b-captured value — **CLEAN**
5. Solo might have restated the full matrix instead of just referencing the canonical rule — **CLEAN** (lightweight reference only)

All five predictions were checked specifically; all passed.

## Findings

(None — no CRITICAL, HIGH, MEDIUM, or LOW findings.)

## Positive Observations

- **ADR-30 discipline is exact.** The `git diff` confirms that attended items #3, #5, #6, #7 in Pre-Flight are byte-for-byte unchanged. The only modifications are: #0 gets the branch-guard/Resume skip note appended (sanctioned by HIGH-2 fix); #1+#2 collapse to new #1 Branch guard (the explicit plan action); 4b gets the two new keys appended (sanctioned by HIGH-3 fix). No collateral attended wording was touched.
- **Cross-reference at team-lead.md:101 ("see Pre-Flight 4b") is intact.** Both HEAD and working-tree line match — the `4b` numbering target is stable, so the pointer is never broken.
- **Canonical-rule locality.** The matrix lives once in `agents-workflow.md`. Solo and the team-lead both reference it by name; neither restates it. DRY is clean.
- **Push gate uses the 4b-cached value correctly.** Commit Protocol explicitly says "the value **captured at Pre-Flight 4b**" and "do **not** re-read the config at closure" — no silent second read.
- **Stale-default fetch wording is exactly the corrected form.** The plan-review's correction ("unconditionally best-effort, warn-and-skip, never block; hardened mode does **not** block `git fetch`") appears verbatim in `agents-workflow.md`. The old hardened-mode-deferral framing is not present anywhere in the diff.
- **selfcheck gates.** lint+unit: 0 failing. bump-plugin --check: PASS. The two FAILs (`gen-commands drift`, `gen-omni --check`) are the documented carry-overs: the first is the git-HEAD false-positive that resolves at team-lead commit; the second is owner follow-through.

## Gaps

None identified. The "Detached HEAD / no slug" matrix row is not restated in solo.md (by design — the plan explicitly says "reference the canonical rule, don't inline the matrix"), and the canonical rule in `agents-workflow.md` covers it for the attended column ("Ask to create a branch").

## Carry-Over Findings (from implementation.md)

All four carry-overs confirmed — none introduced by this feature:

| Carry-Over | Status | Evidence |
|---|---|---|
| `selfcheck` gen-commands FAIL — HEAD false-positive | Confirmed pre-commit, not regression | Commands match working-tree agents line-for-line; selfcheck `[FAIL] gen-commands drift` is the documented git-HEAD gap, resolves at team-lead commit |
| `selfcheck` gen-omni FAIL — owner follow-through | Confirmed out-of-scope | `gen-omni.mjs` + `../omni` commit are team-lead/owner action after the bump commit; not developer-owned |
| `claude plugin validate` frontmatter errors — pre-existing | Confirmed not in this diff | Only `evaluate-skill` and `improve-skills` SKILL.md; `git diff HEAD --name-only` does not include them |
| `guard.js` hardened comment vs regex mismatch — pre-existing doc gap | Confirmed out of scope | `guard.js:10-11` comment says "no network fetches" but `guard.js:143` regex does not match `git fetch`; present at HEAD, untouched by this feature; noted separately |

## Open Questions

(None — all predictions resolved with hard evidence; no findings below 80 confidence.)

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| lint + unit | PASS | `node scripts/selfcheck.mjs` | `[PASS] tests (lint + unit) — 0 failing` |
| bump-plugin check | PASS | `node scripts/selfcheck.mjs` | `[PASS] bump-plugin --check — bump present (or no shipped change)` |
| gen-commands drift | FAIL (expected) | `node scripts/selfcheck.mjs` | `[FAIL] gen-commands drift` — documented HEAD false-positive; carry-over |
| gen-omni check | FAIL (expected) | `node scripts/selfcheck.mjs` | `[FAIL] gen-omni --check` — owner follow-through; carry-over |
| plugin.json version | PASS | `grep version plugins/nexus/.claude-plugin/plugin.json` | `"version": "1.16.2"` (was 1.16.1 at HEAD) |
| Pre-Flight numbering | PASS | `git diff HEAD -- plugins/nexus/agents/team-lead.md` | Sequence is `0,1,3,4,4b,5,6,7`; no #2; #4b cross-ref at line 101 intact |
| 4b keys | PASS | `git diff HEAD -- plugins/nexus/agents/team-lead.md` | Both `defaultBranch` and `autoPush` present in 4b; `autoPush` cached for closure |
| Solo matrix not restated | PASS | `git diff HEAD -- plugins/nexus/agents/solo.md` | 2-line addition referencing canonical rule; no matrix table |
| ADR-30 attended byte-unchanged | PASS | `git diff HEAD -- plugins/nexus/agents/team-lead.md` | Items #3, #5, #6, #7 untouched; only sanctioned changes (#0 note, #1–#2 collapse, 4b extension) |
| agents-workflow.md additive | PASS | `git diff HEAD -- plugins/nexus/rules/agents-workflow.md` | Pure insert between two existing sections; no existing lines modified |
| stale-default fetch framing | PASS | Read `agents-workflow.md:56-58` | "unconditionally best-effort: if it fails or errors for any reason … warn-and-skip — never block or error" — corrected form present |

*Status: COMPLETE — reviewer, 2026-06-21*
