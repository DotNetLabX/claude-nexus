# Unattended Autonomy (v1) — Implementation

Phase-2 implementation of `docs/specs/adhoc-UnattendedAutonomy/delivery/plan.md` (APPROVED, critic
Mode-2 ACCEPT + Q-D1 amendment). Tests-first; all 9 steps landed. Suite: **215/215 green** under the
canonical invocation `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (was 214; the Step-2
Polish empty-test-dir guard added one test — see below).

## LIVE-VERIFY RESULT (Step 2 — the mandatory blocking probe)

**The load-bearing unknown is now pinned.** The spike only ever observed `general-purpose`; this probe
spawned a **real `nexus:developer` subagent** and captured the literal `SubagentStop` payload.

| Field | Observed value |
|-------|----------------|
| `hook_event_name` | `SubagentStop` |
| **`agent_type`** | **`nexus:developer`** (exact literal string) |
| `agent_id` | `a38668d43c32f6da9` |
| `last_assistant_message` | `READY` (the handback text) |
| `agent_transcript_path` | `…\subagents\agent-a38668d43c32f6da9.jsonl` |
| `stop_hook_active` | `false` |

**Probe method (reproducible, zero repo footprint):** ran in a throwaway `/tmp` dir with a temp
`--settings` file registering a matcher-less `SubagentStop` logger that dumps raw stdin; `claude -p`
(CLI **2.1.179**) instructed to spawn a **background** `nexus:developer` subagent via the `Agent` tool.
`git status` clean afterward; all probe artifacts removed.

**Three load-bearing confirmations:**
1. **`agent_type` is `nexus:developer`** — the gate's `String(agent_type).toLowerCase().split(/[:/]/).pop()`
   normalization reduces it to `developer`, which is in `IMPL_ROLES`. The presumption holds; the gate
   keys correctly. (The unknown-agent fallback is the safety net had this surprised.)
2. **`SubagentStop` fires only on the BACKGROUND spawn.** An inline (`run_in_background:false`) `Agent`
   call emitted `PreToolUse:Agent` / `PostToolUse:Agent` / end-of-session `Stop` but **no
   `SubagentStop`**. The background spawn emitted `SubagentStop` with the full payload. This is fine —
   the real pipeline always spawns background (`team-lead.md`: "Background, always"). **Operational
   consequence for the maintainer:** the verify gate fires only for backgrounded subagents; a future
   foreground-spawn path would not trigger it.
3. **`agent_transcript_path` ends in `subagents/agent-{agentId}.jsonl`** — the exact surface
   `salvage-transcript.js` consumes by agentId (LOW-2). Shared platform surface confirmed; the gate
   keys off the lighter `agent_type`/`agent_id` fields and leaves the transcript available but unused.

The string is permanently tripwired by the `SubagentStop` CONTRACT entry in
`platform-contract.test.mjs` (event name + `agent_type` field + matcher-less registration).

## Files Created
- `plugins/nexus/hooks/scripts/verify-gate.js` — the always-on advisory `SubagentStop` verify gate
  (ADR-31). Three-way agent branch (impl → run verify + write verdict; recognized non-impl → skip;
  absent/unrecognized → write `agent:"unknown"`). Synchronous (`execSync`); never denies/blocks; the
  verify-config resolver (explicit `.claude/verify.json` → detection fallback) lives inside it (Step 3).
- `.claude/verify.json` — this repo's dogfood verify set: the `node --test` glob + `selfcheck.mjs`
  (AC-1.4), both `blocking:true`.
- `tests/unit/verify-gate.test.mjs` — 13 unit tests for the gate (Step 1 reds → green).
- `tests/unit/attended-unchanged.golden.test.mjs` — the AC-0.3 golden regression test (Step 6).

## Files Modified
- `plugins/nexus/hooks/hooks.json` — registered a new **matcher-less `SubagentStop`** event (the first
  in the file) wiring `verify-gate.js` with `"timeout": 180` (seconds; the verify set can take seconds,
  vs the observe-only hooks' `timeout: 10`). Not `async` — the gate runs a command synchronously.
- `plugins/nexus/agents/team-lead.md` — Step 4. Added the **verdict-consumption fork** to Enforcing
  the Rules (attended informs / unattended decides, scoped to the implementation-phase checkpoint per
  Q-D1); evolved the **Unattended Mode §** (defer-to-queue on verify-fail / 3-cycle / unanswered
  question / token-cap; loud-inert token-cap warning; `Force-accept` unreachable); updated the
  `:319`/`:330` attended trailers for consistency; added a **Review Queue** convention section (Step 5).
- `plugins/nexus/rules/agents-workflow.md` — Step 7. New "Unattended Autonomy (additive mode)" section
  documenting verify.json, the verify gate, the one consumption fork, and the review queue, alongside
  the existing audit substrate; names the ADR-30 additive-mode principle.
- `tests/lint/platform-contract.test.mjs` — Step 6. Added the `SubagentStop` CONTRACT entry (3 checks:
  event-name registration, `agent_type` read, matcher-less wiring) — the permanent drift tripwire.
- `plugins/nexus/.claude-plugin/plugin.json` + `plugins/nexus/CHANGELOG.md` — Step 9. MINOR bump
  **1.12.0 → 1.13.0** (see Deviations) + a real feature CHANGELOG entry (replacing the bump stub).
- `plugins/nexus/commands/team-lead.md` — regenerated from the agent edit (`gen-commands.mjs nexus`).
- `../omni` twin (sibling repo `D:\src\claude-plugins\omni`, generated, not in this repo's git) —
  regenerated via `gen-omni.mjs`; the new `SubagentStop`/`verify-gate.js` entry and version 1.13.0
  round-tripped (asserted: twin `hooks.json` carries the entry; `gen-omni --check` clean).

## Key Decisions
- **Implementation roles = `{developer, solo}`.** Both write application source, so both are the verify
  boundary. The plan said "the implementation subagent (developer/solo)"; `solo` is included and tested.
- **`SubagentStop` timeout = 180s (hook-level), 120s (per-command internal).** The verify set is ~7s
  today; 180s is generous headroom and exceeds the per-command internal `execSync` timeout so the hook
  is never killed mid-verify.
- **Verdict file is append-only** (`.claude/audit/verify-verdict.json`, one JSON line per stop) —
  mirrors the `read-tracker`/`skill-tracker` audit-append idiom; the team lead reads the latest line
  scoped by the `.pipeline-state` token. `verdict` is `pass|fail` for an impl stop, `skipped` for the
  unknown-agent record.
- **Detection fallback markers** (when `.claude/verify.json` is absent): a `tests/` node:test suite →
  the `node --test` glob; `scripts/selfcheck.mjs` present → the selfcheck command. Explicit config
  always wins; an undetectable project yields an empty set and a clean (non-blocking) verdict — never
  a crash.
- **`denyReason()` helper gap (LOW-1) honored as written:** the "never block" assertion uses a **raw**
  `assert.doesNotMatch(stdout, /"decision"\s*:\s*"block"/)` next to `denyReason(res) === null`, because
  `helpers.mjs:62` only reads the PreToolUse deny shape, not the `SubagentStop` `decision:"block"` field.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Test authoring (plan: Skill None). Mirrors read-tracker/skill-tracker test idiom. |
| 2 | None | CC-hook authoring — no nexus skill covers "write a Claude Code hook" (plan-sanctioned None). |
| 3 | None | Config convention (plan: Skill None). |
| 4 | None | Agent-definition edit (plan: Skill None). |
| 5 | None | Convention doc (plan: Skill None). |
| 6 | None | Golden test + lint tripwire (plan: Skill None). |
| 7 | None | Rules doc (plan: Skill None). |
| 8 | None | ADR cross-check (plan: Skill None) — no drift found. |
| 9 | release-plugin | Followed the ADR-9 release flow (`bump-plugin.mjs --minor`, `gen-commands`, `gen-omni`). |

All-`None`-except-Step-9 matches the plan's Skill Mapping exactly (Steps 1–8 are plugin-internal
authoring with no covering skill; Step 9 is the Follow step). The `tdd` skill applies behaviorally to
the tests-first Steps 1/2/6 but was followed as the red-green loop, not invoked as a `Skill` call —
consistent with how the existing hook-test suites were authored.

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| `SubagentStop` fires only on background spawns, not inline `Agent` calls | low | reviewer | live-probe run5 (above) | Correct for the pipeline (always background), but a future foreground-spawn path would bypass the gate. Documented in the live-verify section. |
| `gen-commands` "drift" in selfcheck is uncommitted-only | low | team-lead | `selfcheck` 3/4; second regen is idempotent (identical 26/5 diff) | The regen is in sync; the flag is `git diff --exit-code` over uncommitted `commands/`. Resolves when the team-lead commits (ADR-18: pipeline agents never commit). |

## Deviations from Plan
- **Version bump: 1.12.0 → 1.13.0, not the plan's literal "1.11.0 → 1.12.0".** The plan was written
  when the plugin was at 1.11.0; `adhoc-NexusFleetView` shipped **1.12.0** between plan-approval and
  this implementation (ADR-33, the most recent commit context). The bump **tier (MINOR) and intent
  (new capability) are unchanged** — only the resulting number shifts. `bump-plugin.mjs --minor`
  applied 1.12.0 → 1.13.0; the omni twin rode along to 1.13.0. **No owner decision needed** — the tier
  the owner set (MINOR) is preserved; this is purely a number-line consequence of an intervening release.
- **No commit made** — per ADR-18, pipeline agents never commit; the team-lead owns all commits. The
  bump + change are staged-equivalent (edited in place) but uncommitted, which is why `selfcheck`'s
  gen-commands-drift check shows uncommitted (see Carry-Over). The CI `plugin-release-check.yml` and a
  clean `selfcheck` both pass once the team-lead commits the regen with the change in one commit.

## Owner-Owed Live Validation (from the plan's Testing Strategy — NOT run here)
The plan's final acceptance is one real `claude -p [UNATTENDED]` pipeline run that (a) passes verify →
advances, and (b) fails verify → **defers to `.claude/review-queue/`** with a resumable item, then
resumes and confirms it continues at the failing phase (ADR-19), not a cold restart. That is an
owner/operator step on the updated install (it needs a `/plugin update` to 1.13.0) — a clean
happy-path run alone proves nothing about the fail-closed path. The in-session probe validated the
**platform boundary** (the gate's load-bearing unknown); the **end-to-end fail-defer-resume** loop is
the operator-owed validation.

## Step-2 Polish

Non-blocking review fixes from the merged nexus-reviewer + Codex Step-2 reviews (both SHIP, no
CRITICAL/HIGH). All in `plugins/nexus/hooks/scripts/verify-gate.js`, its test, and the workflow doc.

- **[MED — Codex] Detection-fallback spurious-fail guard.** When `.claude/verify.json` is absent and
  the detection fallback synthesized `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`, a
  project with an *empty* test dir expanded the glob to a literal non-existent path → Node exits
  non-zero → a spurious `verdict:"fail"`. Fixed in `resolveCommands`: the resolver now reads each
  candidate test dir and emits a `dir/*.test.mjs` glob **only when at least one `*.test.mjs` file is
  present**; a dir with no matching files contributes nothing. A zero-match set is therefore a clean
  non-blocking pass, never a false fail. Affects detection-fallback consumers only — an explicit
  `.claude/verify.json` is untouched. **New test:** *"an empty test dir (no \*.test.mjs) does NOT
  synthesize a --test command → no spurious fail"* asserts no `--test` command, `commands_count:0`,
  and `verdict:"pass"`. The existing positive detection test now seeds a `marker.test.mjs` so the glob
  is still emitted in the has-tests case. (+1 test: 214 → 215.)
- **[MED — Codex] Documented the `blocking` default.** `resolveCommands` treats an absent `blocking`
  key as `true`. Added to the `verify.json` schema description in
  `plugins/nexus/rules/agents-workflow.md` (Unattended Autonomy section): an omitted `blocking` ⇒
  `blocking:true` (blocking unless explicitly opted out with `blocking:false`).
- **[LOW — reviewer] Tightened the unknown-branch test.** The gate writes exactly
  `verdict:'skipped'` for an unclassifiable stop; the test's `=== 'skipped' || === 'unknown'`
  acceptance is now `assert.equal(v.verdict, 'skipped')`, pinning the contract.
- **[LOW — reviewer] Documented the inner timeout.** Inline comment on the `execSync` call:
  `// 120s inner cap; hooks.json outer is 180s` (confirmed against `hooks.json` line 59: the
  `SubagentStop` verify-gate entry has `timeout: 180`).
- **[LOW — Codex] Made the empty-command-set visible.** The verdict record now carries
  `commands_count: results.length`, so a `verdict:"pass"` with `commands_count:0` ("nothing was
  verified") is a visible audit signal the team lead can distinguish from a real green run — not a
  silent pass.

**Accepted as-is (not changed):** `stop_hook_active` not checked (harmless — the gate never blocks, so
no retry loop); token-scoped verdict consumption ordering (correct per Q-D1 — the team-lead consumes
before advancing the token; behavioral, not a hook bug); no automated end-to-end fail-defer-resume test
(owner-owed live validation by design — see the section above).

**Verification after polish:** `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → **215/215,
0 failing.** `node scripts/selfcheck.mjs` → **2/4** — the two failures (`gen-commands` drift, `gen-omni`
twin drift) are **pre-existing**, from the in-flight UnattendedAutonomy change's `team-lead.md` /
shipped-file edits, not from this polish (confirmed: both persist with the polish edits stashed out).
Both resolve when the team-lead regenerates and commits (ADR-18) — pipeline agents never commit.

*Status: COMPLETE — developer, 2026-06-16*
