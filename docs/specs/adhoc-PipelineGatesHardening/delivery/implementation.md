# Pipeline Gates Hardening — Implementation

## Files Created
- `plugins/nexus/hooks/scripts/skill-tracker.js` — **Step 2.** Always-on PostToolUse(`Skill`) logger.
  Appends `{ts, agent, skill, token, session}` to `.claude/audit/skill-invocations.log`. Plumbing
  mirrors `read-tracker.js`: stdin JSON, `tool_name === 'Skill'` filter, `root = CLAUDE_PROJECT_DIR ||
  data.cwd || cwd`, `mkdir -p .claude/audit`, fail-silent, `process.exit(0)`, never blocks. `agent`
  resolved as `audit-logger.js:99` (`agent_type || session persona || 'main'`, then final-segment
  reduced); `token` = `.claude/.pipeline-state` content (`''` if absent) for Step-3 round scoping. NOT
  config-gated (deliberately separate from the opt-in `audit-logger.js` `Skill` capture — MED-4).
- `tests/unit/skill-tracker.test.mjs` — **Step 1 red.** Drives the new Gate-A logger via synthetic
  PostToolUse(`Skill`) events: asserts one `{ts, agent, skill, token, session}` line per Skill call,
  the `|| 'main'` fallback (MED-5), namespaced-agent reduction, the round token capture (MED-6,
  empty-string when no `.pipeline-state`), and zero-footprint on non-Skill/malformed-stdin. Mirrors
  `read-tracker.test.mjs`.

## Files Modified
- `tests/unit/boundary-detector.test.mjs` — **Step 1 red (extend, not rewrite).** Added an ADR-18/20
  git-write section: (a) two positive reds (a subagent `git commit` logs a rogue-write line; every
  canonical state-changing verb incl. `&&`-chains logs exactly one line each), (b) two negative tests
  that must stay green (read-only git / `git commit-graph` / empty / non-git append nothing; a
  main-session git write is not flagged). All **10** pre-existing tests preserved unchanged, incl. the
  `:76` `detect(dir,'critic','','Bash')` no-op (Q1: count is 10, not the plan's "11").
- `tests/lint/enforcement.test.mjs` — **Step 1 red.** Added "Gate A: implementation-format names
  `## Skills Used` as a required section" — red until Step 4 promotes the section from template+anti-pattern
  to a named required section. Co-located with the existing C.3 footer lint (`:45-50`), the natural home.
- `plugins/nexus/hooks/hooks.json` — **Step 2.** Registered `skill-tracker.js` on `PostToolUse` with
  matcher **`Skill`** (the live-verified tool name), `async: true`, `timeout: 10` — same shape as the
  `read-tracker` entry. Distinct matcher from the `Read` entry, so no duplicate-matcher wiring violation.
- `plugins/nexus/agents/architect.md` (the Step 1 Done-Check "Skill conformance check", was `:230`) —
  **Step 3.** Re-pointed in place (replaced, not duplicated): the **authoritative** source is now
  `.claude/audit/skill-invocations.log`; the implementation.md `## Skills Used` section is demoted to a
  secondary cross-check. Added: (a) explicit **round-scoping** by the `.pipeline-state` token + `agent ==
  developer|main` (read-tracker round-keying), with final-segment skill matching to reconcile namespaced
  vs bare logged names; (b) hard-Fail on a mapped non-`None` skill absent from the scoped log without a
  documented deviation; (c) hard-Fail on a self-report not corroborated by the log (fabrication); (d)
  **structural hard-Fail on a missing `## Skills Used` section**; (e) the **all-`None` exemption preserved
  explicitly** (no Fail on an empty log when every step maps `Skill: None`), incl. the documented
  Read-channel deviation as a valid pass. The prior "compare to implementation.md `## Skills Used`"
  wording is replaced.
- `plugins/nexus/skills/implementation-format/SKILL.md` — **Step 4.** Verify-first carve-out checked:
  the skill had **no** explicit "required sections" enumeration today (only the template at `:22-28` +
  the anti-pattern at `:56`), so this is **not** a no-op. Added a **"Required sections"** statement that
  names `## Skills Used` as required and binds its absence to the architect's hard-Fail. The existing
  template, the `None — deviation: {reason}` row form, and the "Empty or missing Skills Used" anti-pattern
  are preserved unchanged — the new line makes the requirement a *named* line the Step-1 structural lint
  asserts against. Turns Step 1's enforcement Gate-A red green.
- `plugins/nexus/hooks/scripts/boundary-detector.js` — **Step 5.** Added a `Bash` branch (between the
  `Agent|Task` spawn branch and the existing `file_path` edit branch, so the git check runs **before**
  the no-`file_path` early-exit). Subagent-only (the existing `agent_type` guard already covers it).
  Matches the architect's **verified anchored regex** `/\bgit\s+(commit|add|reset|push|stash|restore|switch)(\s|$)/`
  on the **lowercased** command (guard.js house style) — the trailing `(\s|$)` excludes `git commit-graph`.
  Logs the canonical rogue-write rule (ADR-18/20). Header rule-list comment updated to document the new
  branch and its best-effort/`git log`-backstop relationship. All existing Write/Edit/MultiEdit/Agent/Task
  behavior unchanged; the `:76` Bash-no-verb path stays a zero-footprint no-op.
- `plugins/nexus/hooks/hooks.json` — **Step 5.** Added `Bash` to the boundary-detector matcher
  (`Write|Edit|MultiEdit|Agent|Task` → `…|Bash`). No new entry (extends the existing matcher), so no
  duplicate-matcher violation.
- `plugins/nexus/agents/architect.md` (Step-3 block) — **Step 5 follow-on correction.** The Step-3 edit
  illustrated namespaced logged skill names with a literal `nexus:create-feature`; the `wiring.test.mjs`
  agent-reference lint (`:79`) reads any `nexus:X` token in agent prose as an **agent** reference and
  flagged it as unresolved. Reworded to a generic `{plugin}:{skill}` placeholder — same meaning, no
  dangling agent reference. (Caught by the lint, not shipped.)
- `plugins/nexus/agents/team-lead.md` (Enforcing the Rules §) — **Step 6.** Added the **deterministic
  fabrication void-and-rerun matrix** (4 rows: non-owner-authored gate → void+re-run real gate, keep code;
  rogue pipeline-role spawn → void downstream + re-run; subagent git write OR non-team-lead commit →
  unwind+re-commit; skill-conformance Fail → bounce to developer) run at every verify point. Named the
  **`git log` author check** as the guaranteed retroactive catch reconciling Step 5 (best-effort Bash
  branch + guaranteed author check). Extended the "Detect at each checkpoint" bullet to name the Step-5
  rogue-write line as a triaged input. The matrix is **additive**: the existing Verdict Validation
  (`:162-168`) and the least-intervention ladder (`:175-179`, incl. the "don't restart a clean run" rule)
  are preserved and explicitly referenced, not replaced.
- `plugins/nexus/rules/agents-workflow.md` — **Step 7.** Added a new `## Audit Substrate` section (after
  Read Discipline, before Agents) documenting **both** logs in one table — `violations.log` (writers,
  records incl. the new git-write rule, consumer = team lead's void-and-rerun matrix + `git log` backstop)
  and `skill-invocations.log` (writer = `skill-tracker.js`, schema, consumer = architect done-check) — and
  names the **detect-then-gate principle** once. No dangling reference: every log named is written by a
  shipped script. The pre-existing `violations.log` mention in Read Discipline (`:117`) is left in place.
- `docs/architecture/README.md` — **Step 8.** Added **proposed** ADR-24 ("Skill invocation is a logged,
  gated fact; gate fabrication is deterministically voided") after ADR-23, plus its Contents-list line.
  Carries a **`Status: PROPOSED (owner ratifies)`** banner — explicitly NOT finalized as decided; the
  owner ratifies and may amend the framing. Notes it **extends ADR-18/21** (adds the determinism layer:
  fixed action matrix + skill conformance scored against a platform fact). No existing ADR is rewritten.
  **Flagged for owner ratification in the handback.**

## Key Decisions
- **Reds land directly in `tests/unit/` + `tests/lint/`, no `tests/red/` staging** (Q3): single-delivery
  red→green, no commit leaves a red failing. Matches how `enforcement.test.mjs` describes itself.
- **The enforcement Gate-A lint regex** accepts an explicit "required section(s)" statement within ~400
  chars of `## Skills Used` (either order). Strict enough that the pre-Step-4 template-only state fails;
  loose enough to bind to natural prose Step 4 will add.
- **Boundary git test asserts the verified case table from the plan** (commit/add/stash/push/restore/
  switch/reset → log; status/diff/log/rev-parse/branch/remote/fetch/`commit-graph`/empty/non-git → no
  log). The `git reset --soft` row confirms the gate flags *any* reset (the plan logs `reset` redundantly
  with guard.js's `reset --hard` deny — acceptable per Step 5).

## HIGHEST-RISK LIVE-VERIFY — platform `tool_name` for a Skill invocation (Step 2)
**Result: VERIFIED on disk. Gate A is NOT false-green.**

The plan flags this as the gate-killer: a wrong matcher captures nothing and Gate A is silently
false-green. I verified the **actual** platform emission against this project's real Claude Code
session transcripts (`~/.claude/projects/D--src-claude-plugins-nexus/*.jsonl`, 20 transcripts) — the
authoritative record of what the platform emits, not the opportunistic `ti.skill` pick in
`audit-logger.js:51`:

- **`tool_name` = `Skill`** — 14 real `"name":"Skill"` tool_use occurrences across the transcripts
  (vs `Edit` 614, `Bash` 452, `Read` 450, `Agent` 67, … — `Skill` is a distinct, confirmed tool name).
- **`tool_input.skill` carries the skill name** — verbatim samples:
  `{"skill":"nexus:summary-format"}`, `{"skill":"nexus:create-implementation-plan"}`,
  `{"skill":"claude-api","args":"…"}`. The value is sometimes **namespaced** (`nexus:summary-format`)
  and sometimes **bare** (`create-feature`). The logger stores `data.tool_input.skill` verbatim (per
  the plan); Step 3's done-check matches on the **final segment** so both forms reconcile against the
  plan's bare-name Skill Mapping. (`skill-tracker.js` reduces `agent` to final-segment but keeps
  `skill` verbatim — matching the plan's `skill = data.tool_input.skill`.)

**Verified matcher string recorded:** `"Skill"` (hooks.json matcher) ↔ event `tool_name === 'Skill'`.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Test authoring (plan Skill Mapping: `Skill: None`, `TDD: yes` — these ARE the tests; `tdd` red-green is the step itself, not a separate skill invocation on a test-authoring step). |
| 2 | None | CC hook authoring (plan: `Skill: None`, `TDD: yes` — Step-1 red → green). No `nexus`/`nexus-dotnet` skill covers writing a Claude Code hook (plan's own skill-verification note). |
| 3 | None | Agent-definition edit (plan: `Skill: None`, `TDD: no`). Re-point of an existing done-check; no pattern skill applies. |
| 4 | None | Format-skill edit (plan: `Skill: None`, `TDD: no` — covered by Step 1's structural lint). Promote-if-not-already; verified not already enumerated. |
| 5 | None | CC hook edit (plan: `Skill: None`, `TDD: yes` — Step-1 red → green). Verified regex + case table per plan; no pattern skill applies. |
| 6 | None | Agent-definition edit (plan: `Skill: None`, `TDD: no`). Action-matrix wording; no pattern skill applies. |
| 7 | None | Rules-doc edit (plan: `Skill: None`, `TDD: no`). Documentation; no pattern skill applies. |
| 8 | None | ADR proposal (plan: `Skill: None`, `TDD: no`). Owner-ratify proposal; no pattern skill applies. |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Steps 1–8 only — Step 9 (release bump / gen-commands / gen-omni twin) deliberately NOT done | medium | team lead | Prompt scope boundary + plan Step 9 | The team lead runs Step 9 at final commit on the final agent-doc state. `nexus` `plugin.json`/`CHANGELOG.md` are unbumped; `commands/architect.md`+`commands/team-lead.md` are NOT regenerated (architect + team-lead agent docs changed); the `omni` twin's `hooks.json` does NOT yet carry the `skill-tracker` entry / `Bash` matcher. These are expected pending-states, not defects. |
| ADR-24 is PROPOSED, owner-ratify — not a decided record | medium | architect / owner | `docs/architecture/README.md` ADR-24 banner | Per Step 8 the ADR text is explicitly not finalized; the owner ratifies (may amend framing) before it is accepted architecture. Flag at handback. |
| Gate A depends on the live-verified platform `tool_name === 'Skill'` (unversioned platform surface) | low | reviewer | Live-verify section above; ADR-24 Tradeoffs | Verified against 20 real session transcripts (`Skill` 14×, `tool_input.skill` carries the name) → NOT false-green today. Residual: a future Claude Code rename of the Skill tool would silently false-green the gate until the matcher is updated — the same unversioned-surface risk every hook carries (tests/README.md Conventions). No action owed now. |
| Live guardrail validation is owner-owned, deferred | low | team lead / owner | plan Testing Strategy ("Live validation (owner, last)") | The JS units prove the mechanisms; the plan defers a real pipeline run that deliberately fires both gates (self-advance + skill-skip) to the owner, on the updated install. Not a build-time step. |

## KB Changes
None — no `docs/kb/` in this repo (plan: KB Impact = None).

## Deviations from Plan
- **Step 1 existing-test count: 10, not the plan's "11"** (Q1, Resolved). The plan's Step-1 body/acceptance
  say "preserve all 11 existing tests"; the file has exactly **10** (all preserved, incl. the `:76`
  Bash-no-verb no-op HIGH-3 protects). Stale count, non-blocking — the binding directive is "preserve every
  existing test." No plan change owed.
- **Step 5 follow-on: a one-token reword in the Step-3 architect.md block.** The Step-3 edit used a literal
  `nexus:create-feature` as a skill-name example; `wiring.test.mjs:79` reads any `nexus:X` in agent prose as
  an agent reference and flagged it unresolved. Reworded to a generic `{plugin}:{skill}` placeholder — same
  meaning, lint green. (A lint catch, corrected before handback — not a shipped defect.)
- **No `tests/red/` staging** (Q3, Resolved). Reds landed directly in `tests/unit/` + `tests/lint/`
  (single-delivery red→green); the `tests/red/` cross-commit staging adds nothing when red and green ship in
  one pass. Matches `enforcement.test.mjs`'s own "born as reds, promoted here" description.
- **Pre-existing `nexus-dotnet` baseline failure left unfixed** (Q2, Resolved) — see the Baseline note below.

## Baseline note (pre-existing, OUT OF SCOPE — do NOT fix here, per Q2)
- Baseline on the unmodified tree under the canonical invocation
  `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` is **116 pass / 1 fail / 117 total**.
  The single failure is `tests/lint/frontmatter.test.mjs:34` —
  `plugins/nexus-dotnet/skills/create-module-claude-md/SKILL.md` declares an unknown frontmatter key
  `disable-model-invocation`, committed at `75ccd2b` (DotnetSkillSweep, ship 1.1.0). It is **pre-existing**,
  lives in **`nexus-dotnet`** (outside this feature's `nexus`-only scope), and is untouched by any step
  here. Per the "don't attribute pre-existing failures to the current feature" rule it is documented, not
  fixed. Acceptance target for this feature = **116/117 unchanged + the 3 new reds turning green**, no new
  failures introduced (Q2, Resolved).

## Verification
- Full suite (canonical invocation `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`):
  **127 pass / 1 fail / 128 total.** The 1 fail is the documented pre-existing out-of-scope
  `nexus-dotnet:create-module-claude-md` frontmatter failure; all 11 new tests are green (the 3 Step-1
  reds turned green; 8 additional positive/negative tests also green). No new failure introduced —
  baseline 116/117 preserved + 3 reds → green.
- `node --check` on both touched hook scripts (`skill-tracker.js`, `boundary-detector.js`) → OK;
  `hooks.json` parses.
- Boy Scout: scanned both modified hook scripts — no scoped improvements warranted (freshly written to
  the established `read-tracker.js`/`guard.js` patterns; the lowercased-vs-raw `ti.command` double-read in
  the boundary git branch is intentional, mirrors guard.js, and is not duplication to extract).

*Status: COMPLETE — developer, 2026-06-13*
