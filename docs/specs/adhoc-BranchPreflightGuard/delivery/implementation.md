# Branch Pre-Flight Guard + Push Gate — Implementation

## Files Created
- (none)

## Files Modified
- `plugins/nexus/rules/agents-workflow.md` — **Step 1.** Added a new `## Branch Pre-Flight & Default-Branch Resolution` section between `Slug and Path Resolution` and `Pipeline State` (the "near the Pipeline Modes / Slug area" placement the plan suggested). Defines once: the 3-step best-effort default-branch resolution order (D1: `origin/HEAD` → config `defaultBranch` → `main`), the 4-state attended|unattended decision matrix (D2 ask-when-unrelated, D3 unattended auto-branch), and the two overlays (dirty-tree = existing team-lead behavior stated as shared rule; stale-default `git fetch` as unconditionally best-effort warn-and-skip). Opens with the launch-only / Resume-distinct pointer so it cannot be read as the Resume guard.
- `plugins/nexus/agents/team-lead.md` — **Steps 2 + 3.** Step 2: collapsed Pre-Flight #1 (Dirty tree) + #2 (Branch) into a single #1 **Branch guard** referencing the canonical rule (dirty-tree overlay folded in); added the #0/Resume skip note; extended Pre-Flight 4b to also capture `defaultBranch` + `autoPush` (one read, `autoPush` cached for closure); added an unattended **Branch guard (#1)** bullet to Unattended Mode (additive). Step 3: added a **Push gate** subsection at the end of Commit Protocol (attended ask; unattended `autoPush`-gated, references the 4b-captured value; hardened-mode deferral to `guard.js`; explicit merge-to-main-out-of-scope note).
- `plugins/nexus/agents/solo.md` — **Step 4.** Folded a lightweight **Branch pre-flight** into Workflow step 1 (Understand) referencing the canonical rule (attended column governs, matrix not restated), and a **"before pushing, ask"** line into step 4 (Document). Kept solo's lightweight character — references `agents-workflow`, no matrix duplicated.
- `plugins/nexus/commands/team-lead.md`, `plugins/nexus/commands/solo.md` — **Step 5 (generated, not hand-edited).** Regenerated via `node scripts/gen-commands.mjs nexus`. Diffs match the agent edits line-for-line (solo 4/4, team-lead 14/14); the generated command body inlines the agent body with frontmatter stripped, so the new branch-guard/push-gate prose carries through verbatim.
- `plugins/nexus/.claude-plugin/plugin.json` — **Step 6.** Version bumped `1.16.1` → `1.16.2` (PATCH) via `release-plugin` (`bump-plugin.mjs`). **Edit only — NOT committed** (ADR-18: team-lead owns commits).
- `plugins/nexus/CHANGELOG.md` — **Step 6.** Prepended the `[1.16.2]` entry; replaced the generated stub with a full description of the branch-guard + push-gate change across the three plugin files + the two new config keys. **Edit only — NOT committed.**

## Key Decisions
- **Step 1 placement:** inserted the canonical section directly after `Slug and Path Resolution` (it consumes the slug for branch naming) and before `Pipeline State`. The plan said "near the Pipeline Modes / Slug area"; the Slug-adjacent slot keeps the new-branch-name = slug dependency next to the slug definition and stays in the file's table-driven style.
- **Step 2 numbering:** the #1 (Dirty tree) and #2 (Branch) Pre-Flight items collapsed into a single **#1 Branch guard** with the dirty-tree overlay folded in; **no #2**, nothing below renumbered. Verified the live sequence is `0, 1, 3, 4, 4b, 5, 6, 7` (grep) — the `4b` cross-reference from team-lead.md:101 ("see Pre-Flight 4b") and from this plan stays valid.
- **Step 2 — #0/Resume skip note:** added explicit text to the #0 idempotency gate that the branch guard sits *after* the #0 fork and runs on the clean-start path only; an interrupted run takes the Resume branch-check and skips the launch guard — closes the double-fire-via-#0 route (HIGH-2), not just the Resume-block route.
- **Step 2 — unattended fork (ADR-30 additive):** added a new `Branch guard (#1)` bullet to the Unattended Mode list, sitting alongside the existing `Dirty tree` / spec-gate unattended bullets (auto-branch `{slug}` from default; abort on detached HEAD / no slug). Existing attended wording left byte-unchanged except the explicit #1–#2 collapse the plan sanctions.
- **Step 3 — hardened-mode claim re-verified against live source.** Confirmed `plugins/nexus/hooks/scripts/guard.js:139` blocks `git push` in hardened mode (`'git push (hardened mode disables pushes)'`) and that `git fetch` is **not** in the blocked set (line 143 matches `curl|wget|iwr|invoke-webrequest`, not `git fetch`). This validates both the Step 3 push-gate deferral and the Step 1 stale-default best-effort reframe — the architect's correction holds exactly. (The guard's header comment at line 10–11 says hardened = "no network fetches", but the regex never matches a literal `git fetch`; see Carry-Over.)
- **Step 6 — PATCH per plan; owner may escalate.** `bump-plugin.mjs --dry-run` proposed PATCH (agent + command + rule change); applied PATCH as Step 6 directs. The branch guard + push gate are arguably a *new user-facing capability* (a MINOR case under the release policy), but tier escalation is the **owner's** call, not the developer's — the plan locks PATCH and the owner can re-run with `--minor` before committing if they read it as additive-capability.
- **Boy-scout deliberately skipped on the three edited prose files.** ADR-30's byte-unchanged-attended mandate plus the boy-scout skill's own "never go looking for unrelated cleanup" scope guard both forbid touching adjacent wording here; any "improvement" would be an additive-discipline violation. No report needed beyond this note.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan: `Skill: None`, `TDD: no` — agent-doc/rules-prose pass, no pattern skill |
| 2 | None | plan: `Skill: None`, `TDD: no` — agent-doc prose pass |
| 3 | None | plan: `Skill: None`, `TDD: no` — agent-doc prose pass |
| 4 | None | plan: `Skill: None`, `TDD: no` — agent-doc prose pass |
| 5 | None | plan: `Skill: None` — run `gen-commands.mjs` (generated-artifact regen, no skill) |
| 6 | release-plugin | Follow — version bump (ADR-9 release flow), bump EDITS only (no commit per ADR-18) |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| `selfcheck` gen-commands FAIL is the known HEAD false-positive | low | reviewer | `selfcheck.mjs` → `[FAIL] gen-commands drift`; commands match working-tree agents line-for-line (grep diff: solo 4/4, team-lead 14/14) | Expected pre-commit; resolves at team-lead commit. Plan Step 5 Note + my prompt call this out — do not bounce. |
| `selfcheck` gen-omni FAIL is owner follow-through | low | reviewer / team-lead | `selfcheck.mjs` → `[FAIL] gen-omni --check` | The omni-twin regen (`gen-omni.mjs`) + `../omni` commit are explicitly team-lead/owner follow-through (plan Step 6, my prompt). Out of scope for the developer. |
| `claude plugin validate` frontmatter errors are PRE-EXISTING & unrelated | low | reviewer | Errors only on `skills/evaluate-skill/SKILL.md` + `skills/improve-skills/SKILL.md` (long unquoted `description:` + `user-invocable`); confirmed NOT in this feature's `git diff HEAD` and present at HEAD (`git show HEAD:…`) | Strict-YAML validator over-strictness on a multi-line description; skills load and are in the available-skills list. Not introduced here, not a blocker. The project's own gate (`selfcheck` lint+unit) passes. |
| `guard.js` hardened comment vs regex mismatch | low | reviewer | `guard.js:10-11` comment says hardened = "no network fetches", but the only network-fetch regex (line 143) matches `curl\|wget\|iwr\|invoke-webrequest`, not a literal `git fetch` | Pre-existing, untouched. Surfaced because Step 1/3 depend on `git fetch` NOT being blocked — which the regex confirms. The doc-vs-code gap is a separate cleanup, out of scope. |

## Deviations from Plan
- **None on substance.** All six steps implemented exactly as the (corrected) plan specifies: Step 1 stale-default fetch is unconditionally best-effort warn-and-skip (the architect's correction); Step 2 numbering held at `0,1,3,4,4b,5,6,7`; Step 3 push gate references the 4b-captured `autoPush`; Step 6 is PATCH, edits-only (no commit, no omni regen — team-lead/owner follow-through).
- **Step 6 commit + omni-twin sync intentionally NOT done** — per ADR-18 and the explicit instruction, the team-lead/owner makes the single same-commit (content + bump together) and regenerates/commits the omni twin in `../omni`. The bump edits are left staged-ready in the working tree.

*Status: COMPLETE — developer, 2026-06-21*
