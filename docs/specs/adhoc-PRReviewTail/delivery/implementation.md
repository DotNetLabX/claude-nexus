# PR + AI-Review Tail (v1) — Implementation

Agent-doc / rules-prose pass. Two source files take edits (`agents-workflow.md` — Step 1; `agents/team-lead.md` — Steps 2–5), then the team-lead command is regenerated (Step 6) and the plugin is MINOR-bumped (Step 7). All steps `Skill: None` except Step 7 (`release-plugin`); `TDD: no` throughout (instruction prose, no runtime behavior). ADR-30 byte-unchanged discipline applied at every insertion anchor.

## Files Modified

- `plugins/nexus/rules/agents-workflow.md` — **Step 1.** Added a new `## Host Adapter & PR Tail` section immediately before `## Pipeline State` (i.e. right after `## Branch Pre-Flight & Default-Branch Resolution`, its closure-side companion). Defines the host-adapter surface (open-PR / post-review / view-PR / merge), the `gh`-only adapter (documented concept, not code), host-capability-resolved-FIRST (`gh auth status` / `github.com` origin → else **silently skipped**), the attended-only / unattended-unreachable / hardened-skip posture (stated once), and a pointer to Branch Pre-Flight for `{defaultBranch}` (do not re-derive). No `gh` command recipes here (those live in team-lead). Surrounding sections left byte-unchanged.
- `plugins/nexus/agents/team-lead.md` — **Steps 2, 3, 4, 5.**
  - **Step 2 (Pre-Flight 4b):** extended the existing single `.claude/nexus-agents.json` read to also capture the three PR-tail keys (`prTail`/`prDraft`/`prReviewMode`, with defaults) in the **same one read** as `defaultBranch`/`autoPush`, and extended the closure-cache note to cache them for the PR-Tail subsection. The model/effort and `defaultBranch`/`autoPush` wording is byte-unchanged; the three keys are appended to the same capture sentence (ADR-30 additive). No second config read introduced.
  - **Steps 3+4 (Commit Protocol → new `**PR Tail**` subsection):** inserted immediately **after** the existing `**Push gate (after the final feature commit)**` subsection (left byte-unchanged, including its "Merge-to-main is NOT part of closure" bullet) and before `### Communication Log`. Step 3 content: the after-push + OFF-by-default/opt-in gate (`prTail` pre-set), the `gh pr view` idempotency check, the `gh pr create --base {defaultBranch} --head {branch} --fill` (+`--draft` on `prDraft`) open, the `gh pr review --comment --body-file` projection of the `## Step 2 — Code Review` section with the explicit "--comment, not self-approve" rationale and "verdict + severity + file:line in the body", and the suggest-not-run `/code-review ultra` opt-in. Step 4 content (continuing in the same subsection): AI-goes-first → **STOP** + single-human hand-off, native-UX curation (no custom surface), and the human-controlled `gh pr merge` (only on explicit instruction, after review, never auto, never at closure). References the canonical `## Host Adapter & PR Tail` rule for host capability + posture rather than restating it.
  - **Step 5 (Unattended Mode list):** added one bullet ("PR tail: unreachable in v1 — no PR open, no review post, no merge", fail-closed ADR-32) directly after the existing `Branch guard (#1)` bullet — symmetric placement (closure-side safety property beside the launch-side guard). Surrounding bullets byte-unchanged.

## Key Decisions

- **Section placement (Step 1, developer's call per plan):** placed `## Host Adapter & PR Tail` directly after `## Branch Pre-Flight & Default-Branch Resolution` (the plan's "natural home"). They are the two git/host-boundary rules the team lead references — Branch Pre-Flight is the launch-side git-only guard, Host Adapter is the closure-side host-specific tail — so they read as a pair. Inserted by anchoring on the `## Pipeline State` heading that follows, to leave the Branch Pre-Flight section's trailing content byte-unchanged.
- **Table for the four adapter ops:** used a 2-column table (op | purpose) to stay consistent with the file's table-driven style (the plan asked for table-consistency and naming the four ops). Posture stated as a short bullet list (attended-only / unattended-unreachable / hardened-skip) so the team-lead subsection can *reference* it rather than restate it.

## Files Created

None (all edits modify existing files).

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | `Skill: None` per plan Skill Mapping; agent-doc / rules-prose, `TDD: no`. |
| 2 | None | `Skill: None`; additive edit to Pre-Flight 4b, `TDD: no`. |
| 3 | None | `Skill: None`; PR-Tail subsection prose, `TDD: no`. |
| 4 | None | `Skill: None`; PR-Tail subsection prose (same subsection as Step 3), `TDD: no`. |
| 5 | None | `Skill: None`; one Unattended-Mode bullet, `TDD: no`. |
| 6 | None | `Skill: None`; ran `node scripts/gen-commands.mjs nexus` (generated artifact), `TDD: no`. |
| 7 | release-plugin | Invoked via the Skill tool; ran `bump-plugin.mjs --dry-run` then `--minor` (owner-decided MINOR → 1.17.0), rewrote the CHANGELOG stub to name the capability + the three keys. `TDD: no`. |

## Verification

| Check | Result | Notes |
|-------|--------|-------|
| `tests/lint/*` + `tests/unit/*` (the real additivity/structure gate) | **233/233 PASS** | green after all edits — the developer's pass signal |
| `attended-unchanged.golden.test.mjs` (negative control) | **5/5 PASS** | confirms no hook surface moved (exercises hook scripts + `hooks.json`, not markdown) — as the plan predicted |
| `selfcheck.mjs` | 2/4 (2 expected FAILs) | `tests` PASS + `bump-plugin --check` PASS; `gen-commands drift` and `gen-omni --check` FAIL are the **documented pre-commit false-positives** (resolve at the team-lead commit / omni follow-through) — see Deviations |
| `claude plugin validate` | n/a | `plugin.json` confirmed valid JSON at 1.17.0 via `node -e require(...)`; full `claude plugin validate --strict` is the owner/team-lead release step |
| Grep acceptance (all 7 steps) | **PASS** | every required token present (see per-step confirmations) |
| Debug artifacts (TODO/HACK/FIXME) | none | clean in all modified source |
| Diff scope | 5 files, all expected | no stray edits |

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Two `selfcheck` FAILs are expected pre-commit artifacts — do not re-investigate | low | reviewer | `selfcheck.mjs` → `gen-commands drift` + `gen-omni --check` FAIL | `gen-commands` is git-HEAD-based (Step 6 ran the regen; differs from HEAD until commit — push-gate lesson + MEMORY); `gen-omni` is team-lead/owner follow-through (ADR-18). The real gate (lint+unit 233/233) + golden (5/5) are green. |
| Plan Testing-Strategy cites the golden test at the wrong path | low | reviewer | plan cites `tests/lint/…`; real path `tests/unit/attended-unchanged.golden.test.mjs` | A reference, not a numbered step; the plan's point (it's an unaffected negative control) still holds. Already in Architect/Developer lessons. |

## Deviations from Plan

- **Step 7 scoped to EDIT only (no commit, no omni regen) — per the context handoff + ADR-18.** The
  `release-plugin` skill's full procedure includes Step 5 (gen-omni twin sync), Step 7 (same-commit
  commit), and Step 8 (tag). I executed only the bump (`plugin.json` + `CHANGELOG.md`) and left the edits
  staged-ready. Committing, the omni twin regen/sync, and tagging are **team-lead/owner follow-through**
  (ADR-18: pipeline agents never commit; the omni twin is committed in `../omni` per CLAUDE.md). This is
  the sanctioned developer boundary, not an omission. The consequent `gen-omni --check` FAIL is therefore
  expected, not a defect.
- **No code/TDD deviations** — `TDD: no` throughout (instruction prose, no runtime behavior), as the plan
  mandated; nothing else departed from the plan.

*Status: COMPLETE — developer, 2026-06-21*
