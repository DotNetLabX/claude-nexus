# Skill-Authoring Recipe — Implementation

## Files Created
- `plugins/nexus/skills/improve-skills/references/skill-recipe.md` — the new authoring-from-scratch
  reference (Plan Step 1). Three sections: (1) archetype decision (heavy/autonomous vs
  light/conversational, nexus-grounded examples), (2) the reusable-element menu (re-pointed to
  nexus's own artifacts, not omnishelf's), (3) a frontmatter cheat-sheet for all 9 fields,
  fact-checked against live Claude Code Skills semantics. Sibling to `proven-patterns.md`.

## Files Modified
- `plugins/nexus/skills/improve-skills/SKILL.md` — "For New Project-Local Skills": Step 2 gained a
  new bullet consulting `references/skill-recipe.md` for the archetype decision + element menu
  (placed after the `proven-patterns.md` bullet, before the "2–3 existing skills" bullet); Step 4's
  "frontmatter first" line now points to the same file's §frontmatter cheat-sheet. Both edits state
  explicitly that the pointer applies to **both** authoring paths (project-local and the dev-repo
  carve-out) — required so Step 3's lint-green doesn't mask an effectively-unwired reference
  (critic M1). Cites the literal relative path `references/skill-recipe.md` in both places, not a
  paraphrase.
- `plugins/nexus/.claude-plugin/plugin.json` — version bumped `1.22.0` → `1.22.1` via
  `node scripts/bump-plugin.mjs` (PATCH, owner-confirmed — additive reference, no behavior change).
- `plugins/nexus/CHANGELOG.md` — the generated `[1.22.1]` stub entry replaced with a real
  description of the change (the tool only writes a placeholder line).
- `docs/skill-backlog.md` — new `### improve-skills` entry under `## Skills Fixed`, matching the
  live file's structured `### {Skill Name}` block format (not the plan's inline one-liner —
  developer's-call latitude, confirmed by the team lead in the Phase 1 → Phase 2 handoff).
- `../omni/` (twin repo, outside this repo) — regenerated via `node scripts/gen-omni.mjs`;
  `--check` confirms the twin is in sync. Not committed here — that's the `../omni` repo's own
  commit, per dev-repo CLAUDE.md convention (out of scope for this implementation.md).

Not touched by me: `docs/proposals/skill-authoring-recipe.md` shows as modified in `git status`
(Draft → Ratified, 1 line) — this was done by the team lead/launcher before spawning the developer
(see `communication-log.md` launch notes), not part of this implementation pass. Likewise
`docs/specs/adhoc-MineVerifyRepo/delivery/communication-log.md` is a pre-existing unrelated dirty
file noted at session start — not touched.

## Key Decisions
- **Heavy/autonomous examples swapped from the plan's suggested candidates.** The plan named
  `evaluate-skill`/`release-plugin` as candidates "to verify." I read both plus `mine-verify-repo`
  and `mine-verify-cover`: `evaluate-skill` and `release-plugin` are single-`SKILL.md`,
  script-orchestrated procedural skills with no `phases/`/parallel-subagent-dispatch/state-file
  structure — they don't structurally match the "heavy" archetype's defining shape (thin
  orchestrator + multi-stage pipeline + parallel clean-room-miner dispatch + a proof-bearing gate).
  `mine-verify-repo`/`mine-verify-cover` do match it exactly — multi-stage pipeline
  (Mine→Verify→Cover→Gate→Report), parallel miner/skeptic/Cover subagent dispatch, a
  `references/` folder, a mutation/must-reproduce gate — and their "Use when" language
  ("mining a codebase... bulk ingest, long unattended runs") is a verbatim match to the source
  table's own "Use when" row. Used these two as the honest examples instead. This is within the
  plan's explicit "developer's call... which nexus skills to name as the archetype examples" grant
  (Binding vs developer's-call section) — not a deviation from a binding decision.
- **Extended the H1 fact-check rigor to `effort`/`model`.** The plan's critic-fixed H1 named 4
  fields with zero in-repo precedent needing `claude-code-guide` verification
  (`allowed-tools`/`disallowed-tools`/`context: fork`/`when_to_use`) and 2 fields confirmable by
  grep (`user-invocable`/`disable-model-invocation`). It listed `effort` and `model` in the field
  table but didn't assign them to either verification bucket. I grepped for `effort:`/`model:` as
  SKILL.md frontmatter (zero real hits — the one `model:` grep hit is prose inside a sentence, not
  frontmatter) and, finding zero precedent, extended the same `claude-code-guide` verification to
  those two as well, consistent with the plan's governing instruction ("verify every field name...
  before writing it") and AP5 (verify every named fact before it ships as if wired). Both came back
  VERIFIED with real, stable semantics — no surprises, but the check was worth doing rather than
  silently passing them through on the strength of general familiarity.
- **`context: fork` illustrative citation corrected to `research/SKILL.md`.** The plan's Step 1
  parenthetical cited `search-researches/SKILL.md` as the shipped-skill home of the
  prose-arguing-against-`context:fork` pattern; that skill no longer exists under that name (it's
  `research/SKILL.md` now, confirmed by grep — the prose is at L19-25). Per the team lead's
  accepted FYI from Phase 1, I did not reproduce this citation inside the shipped reference file
  itself (the reference file doesn't cite that skill at all — it only documents `context: fork`'s
  real platform semantics), so there was nothing in the new file to correct; noted here for the
  record since the plan text itself still has the stale name (architect's call whether to fix the
  plan doc — not mine to edit).
- **`disallowed-tools`/`effort`/`model` nuances added beyond the plan's stated claims.**
  `claude-code-guide` surfaced three details the plan's draft table didn't have: `disallowed-tools`
  restrictions are turn-scoped (clear on the next message, not session-long);
  `effort`/`model` overrides are also turn-scoped; `model` is silently ignored if excluded by an
  org allowlist. Included all three in the shipped cheat-sheet — omitting a real, verified nuance
  would under-serve the authors this reference is for.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | improve-skills (Skill tool) + claude-code-guide agent (fact-check, 2 rounds — 4 zero-precedent fields, then `effort`/`model`) | Authored `references/skill-recipe.md`. Followed improve-skills' Write Discipline (Write tool, UTF-8 no BOM) and its dev-repo carve-out (shipped-skill fix done directly, lint is the done-condition — this is a fix to an existing skill, not a new skill, so the Judgment Gate/evaluate-skill pass does not apply per improve-skills' own scoping). |
| 2 | improve-skills (same invocation carried forward — one process per Entry Points) | Wired the two pointers into SKILL.md steps 2 and 4; ran `boy-scout` on the modified file afterward (no improvements found — edits were minimal and the surrounding file was already clean). |
| 3 | release-plugin (Skill tool) | Ran `bump-plugin.mjs --dry-run` (confirmed PATCH, `improve-skills` skill change), then applied; edited the generated CHANGELOG stub with real content; ran `gen-omni.mjs` + `gen-omni.mjs --check` (in sync); ran `claude plugin validate plugins/nexus --strict` (passed). No `gen-commands` regen — no `agents/*.md` touched, matching the plan. Added the `docs/skill-backlog.md` entry. Did not commit (team lead's job). |

## Carry-Over Findings
None.

## Deviations from Plan
- **Heavy-archetype examples** — used `mine-verify-repo`/`mine-verify-cover` instead of the plan's
  suggested `evaluate-skill`/`release-plugin` candidates. See Key Decisions above; within the
  plan's explicit developer's-call grant for "which nexus skills to name," not an unauthorized
  deviation.
- **Skill-backlog entry format** — used the live file's structured `### {Skill Name}` block
  instead of the plan's inline one-liner. Flagged as a non-blocking FYI at the Phase 1 checkpoint
  and explicitly accepted by the team lead in the Phase 2 resume message.
- **No `OPERATOR ACTION REQUIRED` fallback fired** — node was available throughout (v24.13.0); the
  plan's "if node is genuinely unavailable, walk the checklist by hand" fallback was never needed.

## Verification
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/improve-skills`
  → `OK improve-skills` (run twice — after Step 2's edit, and again as a final check; no
  warnings, no errors).
- `node scripts/bump-plugin.mjs --dry-run` → PATCH, `improve-skills` skill change (matches plan).
- `node scripts/gen-omni.mjs --check` → "omni twin is in sync with nexus."
- `claude plugin validate plugins/nexus --strict` → "Validation passed."
- `plugin.json` version confirmed `1.22.1` post-bump.
- `node --test tests/lint/*.test.mjs` → 46/46 pass, 0 fail (per plan's Testing Strategy — the
  repo's structural lint suite, including "plugin.json is valid and CHANGELOG top entry matches
  its version" and the skill-reference-resolution tests).

*Status: COMPLETE — developer, 2026-07-04*
