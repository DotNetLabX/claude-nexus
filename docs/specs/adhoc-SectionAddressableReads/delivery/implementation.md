# Section-Addressable Reads & Read-Discipline Extension — Implementation

## Files Created
- `scripts/measure-read-cost.mjs` — **Step 6.** The audit parser dev-tool. Exports a pure `measureReadCost(text, {agent, since})` that parses a `token-usage.jsonl`, filters by exact agent + `--since` time window, and returns `{calls, cacheCreation, cacheRead, efficiency}` (efficiency = `cache_read/(cache_read+cache_creation)`, 0/0 guarded). Parsing logic ported from `consumption-report/SKILL.md` (the source of truth — there is no `cache-sweep` script). CLI entrypoint (guarded by `import.meta.url === argv[1]`) reads `<log> [--agent <name>] [--since <iso-ts>]`, reports the **absolute** `cache_creation` first (AC4's metric), exits 2 on no path, 1 on missing log. Dev-repo tooling — not shipped, not bumped (same posture as selfcheck/gen-*). **Reviewer fix (cycle 1):** added a post-loop dangling-flag guard — if `--agent` or `--since` appears in argv but its parsed value is `undefined` (last token, no following value), the CLI exits 2 with a clear `error: --agent requires a value` message, rather than silently running unfiltered and returning a misleading result.
- `tests/unit/measure-read-cost.test.mjs` — **Step 6 (TDD).** Originally 6 cases (now 7 after reviewer fix cycle 1): no-filter totals, `--agent` exact match, `--since` window, agent+since composition, empty-result zeros (no NaN), malformed/blank-line tolerance **with `calls` assertion** (7 = 6 original rows + 1 parseable-but-missing-fields `{"ts":"x"}` row), and a new **`--since` boundary case** (row 4's exact timestamp `2023-11-14T22:18:20.000Z` is inclusive — `>=` not `>`). All 233 tests green.

## Files Modified
- `docs/architecture/README.md` — **Step 1.** Added an `**Extended (this release).**` note under ADR-22 (after its Rejected paragraph, mirroring the ADR-23 Extended style). States the read rule gains a *section-targeting* dimension: for a large/multi-section input, locate the heading (`grep '^#'`) → `Read` with `offset/limit` rather than whole-file; non-lossy; whole-read fallback preserved (three cases). Records it as a two-way-door amendment, not a new ADR (ADR-25), and ties it to ADR-14 (duplicate into agent files) + ADR-2 #2 (subagent sees only its own file) — the load-bearing reason Step 4 exists.
- `plugins/nexus/rules/agents-workflow.md` — **Step 2.** Added ONE bullet to `## Read Discipline (all agents)`, after the "Sanctioned re-reads" bullet and before "Role-input boundary". Names the locate-then-read mechanism (`grep '^#'` → `offset/limit`) for large (> ~400 lines) / multi-section inputs, states it is targeting (not re-reading) and composes with the chunked-reads exemption, and lists all three fallbacks (a: no `^#` → whole-read; b: ambiguous/duplicate → whole-read; c: oversized section → `offset/limit` within it). Cross-references the format skills' heading sets and ADR-22 Extended.
- `plugins/nexus/skills/review-format/SKILL.md` — **Step 3.** Added a `**Section map (targeting index).**` line listing the 2 fixed headings (`## Step 1 — Done-Check`, `## Step 2 — Code Review`) as the targeting set.
- `plugins/nexus/skills/implementation-format/SKILL.md` — **Step 3.** Added the section-map line listing the 7 fixed headings (Files Created/Files Modified/Key Decisions/Skills Used/Carry-Over Findings/KB Changes/Deviations from Plan).
- `plugins/nexus/skills/summary-format/SKILL.md` — **Step 3.** Added the section-map line listing the 5 fixed headings (Status/What Was Built/Key Outcomes/Deviations from Plan/Notes).
- `plugins/nexus/skills/lessons-format/SKILL.md` — **Step 3.** Added the section-map line listing the 6 fixed per-role headings (PO/Architect/Developer/Reviewer/Solo Lessons + Skill Gaps), with the critic-F2 caveat: target the role heading only — `### Improvement Proposal` repeats and is not a targetable anchor (ADR-22 duplicate-heading fallback).
- `plugins/nexus/skills/create-implementation-plan/references/plan-template.md` — **Step 3.** Added the section-map line listing the 11 fixed plan headings (Context … Open Questions).
- `plugins/nexus/skills/questions-format/SKILL.md` — **Step 3.** Added the variable-heading **exclusion** one-liner: no fixed set (`## Q{N}` runtime-numbered), target by the grep step alone; noted `communication-log.md` is likewise excluded (one `## Messages` catch-all, no format skill).
- `plugins/nexus/agents/critic.md` — **Step 4.** Appended a `**Section-targeted reads:**` clause to the existing Read-Discipline pointer in `## Tool Usage`: critic loads large spec+plan+product docs → read the sections under review (locate heading → `offset/limit`), whole-read available. Points to the canonical rule (ADR-14 one-line duplication), does not restate it.
- `plugins/nexus/agents/reviewer.md` — **Step 4.** Added a `**Section-target large inputs:**` clause to `## Before Reviewing` item 1 (Re-read the plan first): large plan/impl/source → read the section needed, whole-read available.
- `plugins/nexus/agents/architect.md` — **Step 4.** Added a `**Section-target large inputs.**` bullet to `## Read Discipline`, alongside the existing read-once rules: big spec/plan/KB/source → locate heading (`grep '^#'`) → `offset/limit`; composes with read-once.
- `plugins/nexus/agents/po.md` — **Step 4 (critic F1).** Added a `**Section-target large docs:**` clause to `## Question Answering Mode` Process line: PO is a spawned subagent that can't Read source and loads large specs/product/sibling specs → read the section needed, whole-read available.
- `plugins/nexus/commands/{architect,critic,po,reviewer}.md` — **Step 4.** Regenerated via `node scripts/gen-commands.mjs nexus` (generated artifacts — not hand-edited). Exactly the 4 touched agents' commands changed (git diff confirms; the other 4 unchanged).
- `plugins/nexus/rules/kb-navigation.md` — **Step 5.** Extended numbered step 4 ("read the specific source files you need") with a section-targeting clause: for a large entry or source file, read the specific section (locate by heading → `offset/limit`), not the whole file (ADR-22 Extended). Added inline to the existing line — file stays at 19 lines.
- `plugins/nexus/plugin.json` — **Step 7.** PATCH bump 1.16.0 → 1.16.1 via `release-plugin` / `bump-plugin.mjs` (classifier detected the rule/skill/agent/command changes; PATCH per plan). Only `nexus` bumped — no `nexus-dotnet` shipped files changed (see Deviations).
- `plugins/nexus/CHANGELOG.md` — **Step 7.** Prepended the 1.16.1 entry; replaced the stub with a descriptive summary (section-addressable reads; the four edit groups; ADR-22 two-way-door amendment; PATCH rationale).
- `../omni` (private twin, outside this repo) — **Step 7.** Regenerated via `node scripts/gen-omni.mjs ../omni` so the bumped `plugin.json` + CHANGELOG ride along; `gen-omni.mjs --check` exits 0 (in sync). **Commit of the twin is the team lead's** (separate `../omni` repo, per CLAUDE.md omni-twin commit convention).

## Key Decisions
- **`measure-read-cost.mjs` design = pure core + guarded CLI** (mirrors `render-fleet.mjs` / the repo's testable-script pattern): exports `measureReadCost(text, opts)` for the unit test to import and assert on, with a `import.meta.url === argv[1]`-guarded CLI for the operator command. This is the repo's established way to make a `scripts/` tool both testable and runnable (the plan said "a `tests/unit` case feeding it the fixture" — this is how).
- **Efficiency defined as `cache_read / (cache_read + cache_creation)`** — the read/create ratio the spec frames as "59% cache efficiency". The tool reports the **absolute `cache_creation` first** because AC4's success metric is the absolute drop, not the ratio (the ratio flags amortisation, not waste — spec AC4).
- **Section-map lines point to the canonical rule, not restate it** (ADR-14 one-line duplication) — each agent-file pointer and each skill section-map cross-references "agents-workflow Read Discipline → Read the section" / "ADR-22 Extended" rather than re-stating the mechanism, keeping the duplication one line.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan: Skill (none), TDD no — prose edit to an ADR; no pattern skill covers "edit a rule/ADR" |
| 2 | None | plan: Skill (none), TDD no — prose edit to the canonical rule |
| 3 | None | plan: Skill (none), TDD no — edits shipped skills; acceptance is the ADR-23 form gate `skill-lint.mjs` (exited 0 on all 6 folders), not a skill invocation |
| 4 | None | plan: Skill (none), TDD no — agent-file prose edits + `gen-commands.mjs nexus` regen |
| 5 | None | plan: Skill (none), TDD no — one-clause edit to kb-navigation rule |
| 6 | **tdd** | plan: Skill (none), **TDD yes** — invoked `tdd`; red (module-not-found) → green (6 cases pass). Parser logic ported from `consumption-report/SKILL.md` per critic F4 |
| 7 | **release-plugin** | plan: Follow release-plugin (ADR-9) — invoked; `bump-plugin.mjs --dry-run` → PATCH → apply, CHANGELOG written, `gen-omni` synced + `--check` 0. Commit left to team lead per dispatch |

## Deviations from Plan

### Step 6 — baseline + AC4 final delta are OPERATOR ACTION REQUIRED (plan-sanctioned, pre-authored)
**OPERATOR ACTION REQUIRED — helper:** `scripts/measure-read-cost.mjs` (committed, tested).

The done-check verifies the harness + baseline procedure + recorded commands exist; the **absolute
`cache_creation` drop (AC4 success) is validated by the operator post-bump**, not at done-check (plan
Step 6 + Testing Strategy explicitly defer it). Two reasons it cannot be captured at build time:
1. The baseline needs a **live `be critic` Mode-2 run** over the pinned pair with the `token_audit`
   plugin config ON — a real agent invocation, not a build step. No live
   `.claude/audit/token-usage.jsonl` from such a run exists in the repo to read a real baseline from.
2. The "after" figure needs the changes **live** (`/reload-plugins` or `/plugin update`) — a reload,
   not a code path.

**Pinned fixture (the stable heavy-load input):** the critic Mode-2 review of *this slice's own*
spec + plan —
`docs/specs/adhoc-SectionAddressableReads/definition/spec.md` + `docs/specs/adhoc-SectionAddressableReads/delivery/plan.md`.

**Operator procedure (verbatim — run post-commit):**

1. **Baseline (pre-change behaviour — capture BEFORE the reload picks up this release):** note a
   run-start timestamp, run `be critic` Mode-2 over the pinned pair, then:
   ```
   node scripts/measure-read-cost.mjs .claude/audit/token-usage.jsonl --agent critic --since <run-start-ts>
   ```
   Record the absolute `cache_creation`. (If a pre-change baseline was missed, the 2026-06-20 audit's
   59%-efficiency / 150–250K-context figures stand as the documented prior state.)
2. **After (changes live — needs `/reload-plugins` or `/plugin update`):** note a fresh run-start
   timestamp, re-run the same `be critic` Mode-2 over the same pinned pair, then the **same** command
   with the new timestamp. **Success = absolute `cache_creation` drops, with no loss of review quality.**

**Baseline figure:** not captured at implementation time — it is operator-owed per the above (live
agent run + `token_audit` ON). The harness that produces it is committed and verified (CLI run against
the fixture in this round: all-agents cc=12000 / efficiency 11.1%; `--agent nexus:architect` cc=4000).

### Step 4 — `selfcheck.mjs` gen-commands drift check is RED pre-commit (expected; resolves on commit)
`node scripts/selfcheck.mjs` reports `[FAIL] gen-commands drift — commands/ differ from agents/` (3/4
passed). This is a structural property of the pre-commit state, not a bug to fix before handoff:

1. The selfcheck drift check: (a) runs `gen-commands.mjs nexus` into the working tree; (b) runs `git diff
   --exit-code -- plugins/nexus/commands/` comparing the working tree to **HEAD**.
2. HEAD is the pre-change baseline. The 4 regenerated commands (architect/critic/po/reviewer) are correctly
   in the working tree but not yet in HEAD — the team lead hasn't committed yet.
3. Verified: `git diff --name-only HEAD -- plugins/nexus/commands/` shows **exactly** `architect.md
   critic.md po.md reviewer.md` — the 4 intended commands, no others (developer/team-lead/solo/learner are
   all stable — `git diff` shows nothing on them). Re-running gen-commands is idempotent (same 4 files,
   same sizes as Step 4).
4. **The selfcheck gen-commands check will pass on the commit.** Once HEAD = the regenerated commands,
   `git diff --exit-code` exits 0. Three of 4 checks are already green (tests 232/232, gen-omni in sync,
   bump present); the 4th resolves when the team lead makes the commit. No pre-commit fix is possible
   without committing.

### Step 7 — only `nexus` bumped, not `nexus-dotnet` (plan wording imprecise)
The plan's Skill Mapping row 7 said "both plugins touched", but **no `nexus-dotnet/**` file changed in
this slice** — every edit is under `plugins/nexus/**` (rules/skills/agents/commands). `bump-plugin.mjs`
(the authoritative detector) classified **only `nexus`** (PATCH 1.16.0 → 1.16.1); `git status` confirms
`plugins/nexus-dotnet/` is clean. Bumping only `nexus` is correct (per-plugin classification rule in
`release-plugin`); the plan's "both" was a planning-time over-estimate, not a missed change.

### Step 7 — `claude plugin validate --strict` fails on PRE-EXISTING, UNTOUCHED skills (not this change set)
`claude plugin validate plugins/nexus --strict` (plan Step 7 accept gate) exits 1 with a
`YAML frontmatter failed to parse` error — but the failing skills are **`boy-scout`, `diagnose`,
`evaluate-skill`, `improve-skills`**, **none of which this slice modifies** (`git status` on all four:
clean). The validator's YAML parser rejects the repo's flat single-line frontmatter style across the
estate; it is an environment/CLI issue, not a defect introduced here. **Proof of pre-existence + that my
edits are clean:** the repo's authoritative ADR-23 form gate `skill-lint.mjs` exits **0** on all 6 skill
folders I edited *and* on the untouched failing skills (`boy-scout`/`diagnose`), and the dogfood test
`tests/unit/skill-lint.test.mjs` (lints every shipped skill) is green in the 232/232 run. The substantive
Step-7 acceptance is met by the real gates: `plugin.json` incremented (1.16.1), CHANGELOG entry present,
omni `--check` in sync, bump staged-ready for the same commit. **For the reviewer/team-lead:** the
`--strict` validator failure is pre-existing and out of this slice's scope — do not attribute it here; it
warrants its own fix (likely the CLI's YAML strictness vs the repo's frontmatter convention).

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| selfcheck gen-commands drift RED pre-commit | low | architect/team-lead | `git diff --name-only HEAD -- plugins/nexus/commands/` shows exactly the 4 intended commands (architect/critic/po/reviewer); 3/4 selfcheck checks green; 4th resolves on commit | NOT a regression — the working tree is correct; the pre-commit `git diff` vs HEAD reports the expected change set. Will be green on the first selfcheck run after the team lead commits. |
| Step 6 AC4 delta is operator-validated, not at done-check | low | architect | plan Step 6 + Testing Strategy defer the absolute-drop check to the operator post-bump | Done-check should read Step 6's baseline/delta as `Deviated (valid reason)`, not Missing — the harness + procedure + recorded commands are present; the live run is OPERATOR ACTION REQUIRED. |
| `claude plugin validate --strict` fails on pre-existing untouched skills | medium | reviewer/architect | validator errors only on `boy-scout`/`diagnose`/`evaluate-skill`/`improve-skills` (all `git status`-clean); `skill-lint.mjs` exits 0 on them; 232/232 tests green | Pre-existing CLI/YAML-strictness issue, NOT introduced by this slice. Step-7's substantive gates (bump, CHANGELOG, omni sync) all pass. Out of scope here — warrants a separate fix. Don't re-investigate as a regression. |
| Only `nexus` bumped despite plan saying "both plugins" | low | architect | `git status plugins/nexus-dotnet/` clean; `bump-plugin.mjs` classified nexus-only | Plan Skill-Mapping row 7 over-estimated; no nexus-dotnet file changed. nexus-only PATCH is correct per per-plugin classification. |

## KB Changes
None — no `docs/kb/` business entries change. The evidence entry (`docs/kb/research/plugin-token-optimization.md`) was already updated by the audit (2026-06-20) and needs no further edit (plan KB Impact).

*Status: COMPLETE — developer, 2026-06-20*
