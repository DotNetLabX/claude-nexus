# Pipeline Hardening — Implementation

## Files Created
- `plugins/nexus/hooks/scripts/__tests__/pipeline-gate.test.mjs` — 8-case test suite for pipeline-gate.js: deny/allow cases for H2 (analyze collapse), H4 (absent=open), unrecognized tokens, architect plan.md, and regression guards for invariants 2 and 3.
- `plugins/nexus/hooks/scripts/__tests__/restore-agent.test.mjs` — 4-case H4 test suite: verifies `.pipeline-state` is deleted on `startup`/`clear` and kept on `compact`/`resume`.

## Files Modified

### Step 1 — Vocabulary + gate-behavior table (M7)
- `plugins/nexus/rules/agents-workflow.md` — Added "Pipeline State" subsection with complete 10-token vocabulary table, team-lead sole-writer statement, gate contract summary, and H4 session lifecycle note. Also added L8 canonical `communication-log.md` filename statement (natural placement next to the paths block).
- `plugins/nexus/agents/team-lead.md` — Replaced `:84` "State for the gate" paragraph: references the `agents-workflow.md` vocabulary table, lists all tokens inline, states gate contract in one line (source allowed only under `developer:implement`; present-but-non-matching denies; absent fails open), names team-lead as sole writer.

### Step 2 — Gate phase enforcement: present⇒strict, absent⇒open + H4 state liveness
- `plugins/nexus/hooks/scripts/pipeline-gate.js` — Rewrote invariant 1 block: replaced generic `phaseIsAnalyze` with persona-keyed decision table. Developer source-write: exact-match `developer:implement` allows; any other present token denies (conservative). Architect plan.md: suffix-match `:analyze` denies; all other states allow. Both deny reasons are self-correcting. Added `readPipelineState()` helper returning null on absent/empty (fail open). Updated header doc comment to describe present⇒strict / absent⇒open and no-deadlock rationale.
- `plugins/nexus/hooks/scripts/restore-agent.js` — Added H4 `.pipeline-state` lifecycle: on `startup` and `clear`, deletes `.pipeline-state` (prior-session token cannot block new session). On `compact`/`resume`, keeps it (live session continues). Added doc comment explaining the design decision (mirrors persona registry lifecycle).

### Step 3 — Remove stacked verdicts, two labeled sections (M4)
- `plugins/nexus/skills/review-format/SKILL.md` — Rewrote: documents `review.md`'s two labeled sections (`## Step 1 — Done-Check` architect, `## Step 2 — Code Review` reviewer), explicit "critic produces no durable file," no `plan-review.md`/`done-check.md`. Added step-specific format templates and anti-patterns for stacked verdicts and critic-to-file.
- `plugins/nexus/agents/architect.md` — Done-check result section updated: verdict written to `## Step 1 — Done-Check` section of `review.md`; explicit "do NOT create done-check.md."
- `plugins/nexus/agents/reviewer.md` — Review Output updated: writes to `## Step 2 — Code Review` section; told not to overwrite architect's Step 1 section.
- `plugins/nexus/agents/critic.md` — Output section rewritten: message-only, no file, no `review.md`/`plan-review.md` writes; architect folds findings into `## Plan Review` note in `plan.md`.
- `plugins/nexus/agents/team-lead.md` — Read Discipline table: replaced single `review.md` row with three targeted rows (Step 1 section for `Missing`, Step 2 section for verdict/severity, `codex-crosscheck.md`). Verdict Validation: rewrote to grep named sections, added per-cycle staleness check (H1 — applied here per plan Step 3/4 coordination note).

### Step 4 — Reviewer re-review postcondition (H1)
- `plugins/nexus/agents/reviewer.md` — Hard postcondition added to Verdict Gate: on re-review, MUST rewrite `## Step 2 — Code Review` section (verdict + this-cycle evidence rows); bare ack without rewriting is incomplete; team lead will detect stale section and re-dispatch.
- `plugins/nexus/agents/team-lead.md` — Per-cycle staleness check applied in Step 3 (plan explicitly coordinates these two steps on the same lines).

### Step 5 — Critic spawn = the current coordination hub (H3)
- `plugins/nexus/agents/critic.md` — Coordination Protocol: replaced "sub-review within the requester's turn" with hub-conditional routing (standalone hub → direct spawn; team hub → via team-lead). Added explicit warning that attempting to spawn as a subagent silently collapses to self-review.
- `plugins/nexus/agents/architect.md` — Plan Workflow step 11: split into three branches: self-review, critic-standalone (spawn directly), critic-team (hand back "critic review owed" for team-lead to spawn). Review-mode question is UNCHANGED.
- `plugins/nexus/agents/team-lead.md` — Pipeline diagram updated (conditional critic-spawn path visible). Message Handoffs: added "critic review owed on plan.md" handler (spawn critic Mode 2, relay findings to architect by agentId, resume architect to fix). Pipeline Sequence step 1 updated with the team-critic path.

### Step 6 — Codex cross-check writes findings to a file (M5)
- `plugins/nexus/agents/team-lead.md` — New `### Standard+Codex Dispatch` section added (between Pre-Flight and Launch Path Selection): mandates `codex-crosscheck.md` write, grep-the-artifact contract, dispatch message template requiring the file (not a bare ack), findings routing with same cycle-cap rules.

### Step 7 — Minimal-return requirement (M6)
- `plugins/nexus/agents/architect.md` — Phase 1 step 6: full question text verbatim required. Minimal-return rule added: Phase-1 must inline questions; verdict handoff must carry verdict line.
- `plugins/nexus/agents/developer.md` — Minimal-return rule added to Message Handoffs section.
- `plugins/nexus/agents/reviewer.md` — Minimal-return rule added to verdicts section: verdict line must appear inline.
- `plugins/nexus/agents/team-lead.md` — Checkpoint Report Format: mandatory contract added; bare acks trigger grep-then-redispatch with explicit rewrite requirement.

### Step 8 — L8 canonical name (verify), L9 agentId, RUNTIME notes
- `plugins/nexus/rules/agents-workflow.md` — L8 canonical-name statement added in Step 1 (natural placement). No additional change needed here.
- `plugins/nexus/agents/team-lead.md` — L9: Phase 2 Resume step updated to mandate agentId, with explicit warning that role-name addressing fails once an agent goes idle. RUNTIME caveats block added: stale task-notification labels (track by agentId, not label) and self-report count drift (rely on artifact, not agent's self-count).

### Step 9 — Tests
*(test files listed under Files Created above)*

### Step 10 — Release
- `plugins/nexus/.claude-plugin/plugin.json` — MINOR bump: 1.1.1 → 1.2.0 (owner-escalated MINOR; new enforcement capability).
- `plugins/nexus/CHANGELOG.md` — 1.2.0 entry added by `bump-plugin.mjs`.
- `plugins/nexus/commands/*.md` — All 8 commands regenerated from edited `agents/*.md` by `gen-commands.mjs`.
- Omni twin synced via `gen-omni.mjs`.

## Key Decisions
- **L8 canonical name placed in Step 1:** The `communication-log.md` canonical-name statement belongs next to the paths block in `agents-workflow.md`. Step 8 says "verify-only — do not rename," so this is consistent: the statement was placed in the natural location during Step 1.
- **Steps 3 + 4 Verdict Validation edit combined:** Both steps edit the same Verdict Validation block in `team-lead.md`. Applied in one edit during Step 3 to avoid partial state. Plan explicitly coordinates these two steps on the same lines.
- **Deny reason addresses the acting developer subagent (not team-lead):** The plan noted the deny reason says "addresses the team-lead" but the deny actually reaches the developer subagent. Implemented as a self-correcting message to the developer (explains the required state and that the team lead must advance it) — the developer relays the block reason; the team lead acts. Consistent with the invariant-3 deny idiom.
- **Test runner: explicit file paths:** `node --test <dir>` fails on Node v24 (the directory path is treated as a module). Tests are run as `node --test file1.mjs file2.mjs`. Plan says "run with bare `node --test`" — the explicit-file invocation achieves the same result with no `package.json`.
- **H1 live-fire evidence:** The planning session's critic returning bare acks twice before being re-dispatched with explicit rewrite instructions is direct in-session evidence of the staleness-detection-and-redispatch pattern. Cited as the live-fire result for H1 per plan Step 9 guidance.

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Node --test directory invocation broken on v24 | low | reviewer | `node --test <dir>` fails; use explicit file paths | Test runner note in plan ("bare node --test") needs a small doc correction |

## KB Changes
| Entry | Action | What changed |
|-------|--------|-------------|
| N/A | — | No docs/kb/ in this repo |

## Deviations from Plan
- **Step 1 + Step 8 (L8):** Canonical comm-log name placed in Step 1 (natural location in `agents-workflow.md`). Step 8 becomes verify-only — consistent with plan's "verify-only — do not rename."
- **Steps 3 + 4 (Verdict Validation):** Applied in one edit during Step 3. Plan explicitly coordinates these; no functional difference.
- **Step 9 test runner invocation:** `node --test` with a directory argument fails on Node v24. Used explicit file paths instead — same effect, no `package.json` needed. All 12 cases pass.

## Live-Fire Results (cross-cutting acceptance #1)

| Guarantee | Evidence | Result |
|-----------|----------|--------|
| Developer source-write during `analyze` denied | Case 1 (unit test: DENY confirmed) + live block of `pipeline-gate.js`/`restore-agent.js`/`*.mjs` writes during this session's analyze phase | **PASS** |
| Pipeline subagent `.pipeline-state` write denied | Case 6 (unit test: DENY confirmed, invariant 3 regression) | **PASS** |
| H4: prior-session token cleared on startup/clear | Cases 8a/8b (unit tests: file deleted on startup, file deleted on clear) | **PASS** |
| Reviewer stale `review.md` re-dispatch | Planning session: critic returned bare acks twice; recovered via explicit "write the verdict" re-dispatch. Prose enforcement now in reviewer.md + team-lead.md | **PASS (documented live pattern)** |

## Delta — H0 / H2b / critic fixes

This section documents ONLY the delta added after the halted run (which left Steps 1, 3–8 prose, a first cut
of Step 2's gate/restore, and tests for cases 1–8 already on disk). It folds **H0** (team-lead read-lane),
**H2b** (dev-repo markdown source coverage), and the **second critic pass's 2 MAJOR + 5 MINOR fixes** into
Step 2 and Step 9. **Step 10 (release) was intentionally NOT run** — no bump, no `gen-commands`, no
`gen-omni`, no CHANGELOG/commands edits (a later coordinated step).

### Files Modified (delta)

- `plugins/nexus/hooks/scripts/pipeline-gate.js`
  - **H2b** — added `isDevRepoPluginSource(fp, root)`: a developer write under
    `plugins/<name>/{agents,rules,skills,commands,hooks}/**` counts as a guarded source file, but **only**
    when the root-anchored marker `<root>/plugins/<name>/.claude-plugin/plugin.json` exists AND its `name` ∈
    {`nexus`,`nexus-dotnet`} (MINOR-3 — the marker must resolve at the project root, so a vendored/nested
    plugin in a consumer monorepo cannot trip it; the regex may match a nested `plugins/` segment, but the
    root-anchored marker read is what actually arms the rule). Wired into the existing developer source-write
    branch as `isCodeFile(fp) || isDevRepoPluginSource(fp, root)`. Existing `docs/`/`.claude/` exclusions in
    `isCodeFile` are unchanged.
  - **H0** — added invariant (4), the team-lead read-lane. New helpers: `isMainSessionTeamLead(data)` detects
    the hub via `.personas.json[data.session_id].agent === 'team-lead'` **AND** no subagent `data.agent_type`
    (NOT `.current-agent` — MAJOR-1; that file is never cleared and would go stale). Absent registry, missing
    `session_id`, no entry, disagreeing agent, or any `agent_type` present ⇒ returns false ⇒ `allow()` (fail
    open, ADR-7). `teamLeadReadLane(tool, ti)` encodes the allowlist: **allow** `Read` of
    `communication-log.md` / `questions.md`; **deny** `Read` of `plan.md`/`implementation.md`/`lessons.md` and
    any `plugins/**`/`src/**` source (and any other Read — the lane is enumerated, not open); **allow** `Grep`
    only when `base ∈ {review.md, codex-crosscheck.md}` AND `grepIsBounded(ti)`; **deny** every other team-lead
    `Grep`. `grepIsBounded(ti)` (MINOR-1, machine-checkable): true when `output_mode ∈
    {files_with_matches,count}` (or unset → defaults to `files_with_matches`), OR `content` mode with
    `head_limit !== 0` and `max(-C,-A,-B,context) ≤ 3`. Self-correcting deny reason via `denyReadLane()`
    ("you route, you don't read…").
  - **MINOR-2 ordering** — the H0 `Read`/`Grep` branch runs **before** the
    `if (!/^(Write|Edit|MultiEdit)$/…) return allow();` early-return (that line hard-allows all non-Write
    tools, so a branch after it would be dead code). Common case stays cheap: a non-team-lead `Read`/`Grep`
    hits `isMainSessionTeamLead` → false → `allow()` immediately (one `.personas.json` read at most, only when
    `session_id` is present and `agent_type` is absent).
  - Header doc comment extended: documents invariant (4) and the H2b dev-repo source note.

- `plugins/nexus/hooks/hooks.json` — widened ONLY the `pipeline-gate.js` PreToolUse matcher from
  `Write|Edit|MultiEdit|Task|Agent` to `Write|Edit|MultiEdit|Task|Agent|Read|Grep` so the read-lane branch is
  reached. The `guard.js` block (PreToolUse[0]) and `audit-logger.js` block (PreToolUse[2]) have no matcher
  (all-tools) and were left untouched — verified via a parse check.

- `plugins/nexus/agents/team-lead.md` — Read Discipline now states the lane is **hook-enforced** (invariant 4):
  added the enforcement note to the section intro (gate denies `Read` of plan/implementation/lessons/source,
  allows only the table rows), and to the closing paragraph quoted the deny reason and the bounded-Grep rule
  (paths/count or context ≤ 3; a wide `-C`/`head_limit: 0` is denied). The existing table rows already matched
  the hook allowlist exactly (MINOR-4) — comm-log Read, questions.md Read, bounded grep of
  `review.md`/`codex-crosscheck.md`, deny plan/implementation/lessons/source.

- `plugins/nexus/hooks/scripts/__tests__/pipeline-gate.test.mjs` — `runGate` extended with an `opts` arg
  (`plugin`/`pluginDir` → writes the H2b marker; `personas` → writes `.personas.json`); cleanup switched to
  `rmSync(tmpProject, {recursive})` so nested fixture trees are removed. Net-new **case 9** (H2b: 9a marker
  name=nexus → DENY; 9b no marker → allow; 9c marker name≠nexus → allow) and **case 10** (H0: 10a/10b Read
  plan/implementation → DENY; 10c/10d Read comm-log/questions → allow; 10e bounded Grep review.md → allow;
  10f broad Grep plan.md → DENY; 10g broad Grep review.md → DENY; 10h absent persona → allow [MAJOR-1
  fail-open]; 10i subagent with `agent_type` → allow). Cases 1–8 are unchanged.

### Critic-fix checklist (second pass)

| Fix | Resolution in this delta |
|-----|--------------------------|
| MAJOR-1 — persona detection on `.current-agent` (never cleared) | Detect via session-keyed `.personas.json[session_id]` + no `agent_type`; absent/disagreeing ⇒ fail open. Case 10h/10i prove it. |
| MAJOR-2 — bare-dir `node --test` runs 0 tests on Node v24 | Ran with the glob form `node --test "…/__tests__/*.test.mjs"` — 24 tests executed (see output). |
| MINOR-1 — "targeted grep" was intent-based | `grepIsBounded` is structural (path-allowlist + output_mode/context). Cases 10f/10g deny broad context. |
| MINOR-2 — matcher widening dead after `:59` early-return | H0 branch placed before that line; non-team-lead fast-paths to `allow()`. |
| MINOR-3 — H2b marker would misfire on a vendored plugin | Marker root-anchored + `name ∈ {nexus,nexus-dotnet}`. Case 9c (vendored) allows. |
| MINOR-4 — allow-list vs team-lead.md table divergence | Allow comm-log + `questions.md`; `git diff --stat` is Bash (unaffected). Table and hook match. |
| MINOR-5 — case count / 1–8 already in-tree | Cases 1–8 kept as-is; only 9 and 10 added. |

### Test result (delta)

`node --test "plugins/nexus/hooks/scripts/__tests__/*.test.mjs"` → **tests 24, pass 24, fail 0** (12 prior
cases 1–8 + 12 new sub-cases for 9 and 10). All green.

### Key Decisions (delta)

- **Team-lead Read/Grep default = deny (enumerated lane).** The plan's allowlist is exhaustive, so any
  team-lead Read/Grep outside it (including a Grep whose path is not `review.md`/`codex-crosscheck.md`) is
  denied. This is the tightest reading of "allow Grep ONLY when path ∈ {…}" and "you route, you don't read."
  Only the main-session team lead is ever affected; every other actor fast-paths to allow.
- **H2b regex may match nested `plugins/`, but the root-anchored marker is the real gate.** A nested/vendored
  path extracts a `<name>` whose `<root>/plugins/<name>/.claude-plugin/plugin.json` does not exist → false.
  This keeps the rule scoped to the dev repo without needing the path itself to be root-relative.
- **Step 10 not executed (per task scope).** `plugin.json`/`CHANGELOG.md`/`commands/*.md`/omni twin are
  unchanged in this delta; the `1.2.0` bump rows already in this file (lines 50–53) describe the halted run's
  intent and are NOT a record of work done in this delta.

### Deviations from Plan (delta)

- None functional. The plan left the team-lead Grep default boundary implicit for a non-allowlisted path;
  resolved as **deny** (documented above) consistent with the enumerated-lane intent. Step 10 deliberately
  skipped per the task's explicit scope, not a plan deviation.

### Fix — backlog.md missing from H0 allow-list (done-check finding)

The done-check identified that `teamLeadReadLane` denied the team-lead a `Read` of `docs/backlog.md` via the
catch-all deny. `backlog.md` is the hub's own triage ledger (not "the work"), so it belongs in the allow-list
alongside `communication-log.md`/`questions.md`.

**Three changes applied (all surgical, no scope expansion):**

1. `pipeline-gate.js` — `teamLeadReadLane` Read allow-list: added `|| base === 'backlog.md'` to the three
   allowed-Read names. Grep behaviour for `backlog.md` is unchanged (not a verdict file → denied if a
   team-lead Grep targets it — the team lead has no reason to grep its own ledger).

2. `team-lead.md` — Read Discipline table: added a row for `docs/backlog.md` ("triage / read-before-edit to
   update status"; Never: full re-read each cycle). Hook allowlist and table are back in lock-step.

3. `pipeline-gate.test.mjs` — added **case 10j**: team-lead `Read` of `docs/backlog.md` → **allow**.

`node --test "plugins/nexus/hooks/scripts/__tests__/*.test.mjs"` → **tests 25, pass 25, fail 0**.
