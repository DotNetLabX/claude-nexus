# adhoc-NexusFleetView — Communication Log

**Branch:** main
**Step:** done
**Cycle:** 2/3 (never exhausted)
**Team Mode:** standard+codex
**Review Mode:** critic (plan-stage, done) + code-grounded reviewer (Step 2)
**Architect / Developer / Reviewer ID:** architect: architect@session-46a93019 (done-check PASS) / developer: developer-2@session-46a93019 (cycle-2 fixes) / reviewer: reviewer@session-46a93019 (APPROVE) + codex@session-46a93019 (GO) — round 1 done
**Plan Steps Completed / Remaining:** [1, 2, 3, 4] complete; cycle-2 LOW cleanup in progress / []
**Questions Resolved:** [Q1, Q2, Q3] + Step-1.0 root field resolved (workspace.project_dir, via official docs)

## Pre-run context

This slug was taken to plan-approved by a prior **solo-architect** session (not a team run — no
prior communication-log). On launch the team lead found: `plan.md` (approved, 4 steps),
`questions.md` (Status: Answered). Picked up at the Developer per the entry-point rule
(plan exists + approved → Developer).

- **Q1 → (A) Heartbeat**, **Q2 → snapshot skill only** (Vue dashboard deferred), **Q3 → critic
  Mode 2 + mandatory code-grounded review** — all answered by the user, 2026-06-16 (verbatim in
  `questions.md`).
- Plan critic review (Mode 2 vs ADR register) ran in the prior session: REVISE → all 3 HIGH +
  4 MEDIUM addressed; plan approved. The critic wrote no separate `review-critic.md` (solo run);
  dispositions are recorded in the plan's `## Plan Review` section.

## Messages

| # | From → To | Phase | Message | Problem |
|---|-----------|-------|---------|---------|
| 1 | team-lead → developer | developer:analyze | `Analyze adhoc-NexusFleetView.` (Phase 1, background, opus) | — |
| 2 | developer → team-lead | developer:analyze | Phase-1 verdict: plan implementation-ready, all 4 steps' precedents verified, no plan revisions. One gate: Step 1.0 root-resolution unknown needs a live run. Boundary held (no source written). | Step 1.0 not runnable by a subagent (statusline is main-session-bound) |
| 3 | team-lead → ccguide | (research) | Focused platform-fact check: is `CLAUDE_PROJECT_DIR` in the statusLine env? top-level root field in payload? | — |
| 4 | ccguide → team-lead | (research) | Confirmed from official docs: `CLAUDE_PROJECT_DIR`/`CLAUDE_PLUGIN_ROOT` are **hooks-only** (not in statusLine env); statusLine stdin carries **`workspace.project_dir`** (top-level launch root). → Step 1.0 root field resolved. | — |
| 5 | team-lead → developer-2 | developer:implement | Re-spawned fresh on **opus** (model-on-resume caveat — frontmatter is sonnet) with handoff: implement Steps 1–4; root = `workspace.project_dir`; no live spike (team-lead owns post-build confirm). | — |
| 6 | developer-2 → team-lead | developer:implement | Implement complete: all 4 steps, suite 192/192, validate --strict clean, gen-omni in sync, NOT committed. 3 deviations + 2 carry-overs documented in implementation.md. | — |
| 7 | team-lead → architect | architect:donecheck | `Step 1 done check.` (background) — disposition the 4 steps + the developer's deviations; write `## Step 1 — Done-Check` in review.md. | — |
| 8 | architect → team-lead | architect:donecheck | **PASS** (review.md:52). No step Missing/skipped; 23 unit tests pass; 3 deviations accepted, 2 carry-overs routed (C2 live-confirm → team-lead). Verdict validated (no Missing in §Step 1). | — |
| 9 | team-lead → reviewer | reviewer:review | `Step 2 code review.` — mandatory code-grounded (read actual statusline + skill files); confirm `nexus:fleet` invocable (D2). Write `## Step 2`. (round 1) | — |
| 10 | team-lead → codex | reviewer:review | Standard+Codex round-1 cross-check (independent, parallel). GO/NO-GO + findings → review-codex.md. | — |
| 11 | reviewer → team-lead | reviewer:review | **APPROVE** (review.md §Step 2). 23/23 tests, skill-lint clean, full plan conformance. 2 LOWs: LOW-1 fmtK zero-case divergence (`'0'` vs `''`); LOW-2 dead `import.meta.url` main-guard on Windows. D2 confirmed; C2 ack'd team-lead-owed. Valid (no open HIGH/CRITICAL). | awaiting Codex before merge |
| 12 | codex → team-lead | reviewer:review | **GO** (review-codex.md). 23/23 tests; all critical areas verified clean (join degradation, dedup parity traced, staleness, atomic write, drain, root resolution). 4 LOWs (LOW-1 = reviewer LOW-2 dead guard; LOW-2 null-role `[?]`; LOW-3 misleading test comment; LOW-4 inherited dedup under-count). No conflict, no blockers. | — |
| 13 | team-lead → developer-2 | developer:implement | Cycle 2/3 consolidated LOW fix-list (4 items; deduped reviewer+Codex). Codex LOW-4 deferred (M2 follow-up, keep consumption-report parity). Re-run suite, no commit. | — |
| 14 | developer-2 → team-lead | developer:implement | Cycle-2 done: 4 fixes + LOW-4 documented; suite **193/193** (+1 zero-token test); validate clean; twin in sync; not committed. Version stays 1.12.0 (dry-run's 1.12.1 is a diff-vs-last-commit artifact). | — |
| 15 | team-lead (self) | close | **C2 live-confirm discharged:** write-path verified end-to-end (Windows-safe synthetic payload → fleet-state.json correct shape + role detection); render CLI smoke passed; suite 193/193. Residual (live `workspace.project_dir` + hot-reload) needs a session restart; fail-open ⇒ worst-case-inert. | platform caches statusline at launch — live file not observable this session |
| 16 | team-lead (self) | close | Commit #2 `a4a4f64` (path-scoped to FleetView; foreign adhoc-UnattendedAutonomy files excluded). summary.md written → pipeline COMPLETE. | — |

## Outcome

**COMPLETE** — 2-commit strategy: `f89bcd4` (plan) + `a4a4f64` (implementation). Review: reviewer
APPROVE + Codex GO; 4 LOW fixes (cycle 2); M2 dedup-extraction deferred. Lessons.md was **not**
written by the pipeline agents (minor process gap) — team-lead runtime observations live in the
Issues Log below; the learner sweeps this log. **Lessons processing: SKIPPED per user (2026-06-16)** —
findings remain recorded here for a later learner run.

## Runtime / Plugin Issues Log

1. **`.pipeline-state` reverted by a hook.** After I set `developer:analyze`, a system reminder reported the file reverted to `architect:plan`; a later write errored "modified since read." Re-set to `developer:implement` at the phase transition (sole-writer, legitimate). The gate is a best-effort tripwire (ADR-13) so this didn't block the run, but the token drifted from the true phase between writes — monitor.
2. **`TaskStop` could not find the idle Phase-1 developer** (`No task found with ID: developer@session-46a93019`); `TaskList` showed no tasks. Local-agent tasks appear to terminate (not linger as stoppable tasks) once idle — so the fresh spawn auto-suffixed the name to `developer-2`. Not a defect; documented for resume addressing.
3. **Model-on-resume caveat applied (not a malfunction).** Developer frontmatter is `model: sonnet`; `nexus-agents.json` sets developer→opus. A `SendMessage` resume would have silently downgraded to sonnet, so Phase 2 was re-spawned fresh on opus with a context handoff (the documented remedy).
4. **Boundary-detector FALSE POSITIVE from the re-spawn name suffix.** `developer-2` writing its own `implementation.md` was logged to violations.log as "wrote an artifact whose owner is another role (ADR-18)". implementation.md IS developer-owned — but the detector matches ownership by exact role name and `developer-2` ≠ `developer` (the name auto-suffixed because the idle Phase-1 `developer` slot wasn't freed). Verified legitimate (correct owner, real artifact); NOT voided. Consequence to flag: any re-spawn-suffixed pipeline agent will mis-attribute in the boundary detector.
5. **Foreign change in the shared working tree (NOT this run).** `M docs/specs/adhoc-UnattendedAutonomy/delivery/plan.md` (+ that slug's untracked comm-log) appeared during this session but belongs to a **concurrent `adhoc-UnattendedAutonomy` run** (content = its Q-D1 design amendment; no violations entry for it under this session; its comm-log was already untracked at our launch). NOT touched, NOT reverted (it is another run's live work). Eventual commit #2 will be path-scoped to FleetView files only (dirty-tree rule).

6. **LIVE WIRING GAP — the fleet heartbeat does not fire in a real run (observability regression, NOT execution).** Reported by the owner during the first real multi-agent run since FleetView shipped (`adhoc-NexusResearch`, session `dc5ee579`, 2026-06-18): "I don't see the agents in the background … the agents get lost." This is exactly the residual that **msg #15 deferred** ("live `workspace.project_dir` + hot-reload needs a session restart; platform caches statusline at launch — live file not observable this session"), now observed live.
   - **Symptom:** `.claude/audit/fleet-state.json` is **ABSENT** despite 5 live subagents in the run. `/nexus:fleet` renders "No active fleet" and the per-agent status rows show nothing. The agents themselves ran and returned correctly — only the visibility surface is dead.
   - **Evidence chain (this session):**
     1. Active install is **1.13.0** (`~/.claude/plugins/cache/claude-nexus/nexus/1.13.0`) and ships the FULL machinery: `settings.json` (with the `subagentStatusLine` registration), `statusline/subagent-rows.js`, `skills/fleet/`. Nothing missing from the install. (The `nexus:fleet` skill is loaded this session → active version ≥ 1.12.0, confirming 1.13.0.)
     2. `subagent-rows.js` is the **only** writer of `fleet-state.json` (it writes a snapshot — or an empty drain — whenever it runs with a resolvable root). **Smoke-tested the active 1.13.0 script** with a synthetic payload (Windows-form root `D:/tmp/…`) → it writes a correct snapshot, exit 0. **Script is fine.** (First smoke attempt with an MSYS `/tmp` path falsely failed — node-on-Windows resolves `/tmp` to a different drive location than git-bash; a test artifact, not a script bug.)
     3. `fleet-state.json` is absent — **not even an empty drain snapshot** — during the live run ⇒ the script is **never invoked** ⇒ the `subagentStatusLine` hook is not active.
     4. There is **no `subagentStatusLine` key** in user (`~/.claude/settings.json` — only `statusLine`) or project (`.claude/settings*.json`) settings. The **only** registration is the plugin-bundled `plugins/nexus/settings.json` → `subagentStatusLine: node "${CLAUDE_PLUGIN_ROOT}/statusline/subagent-rows.js"`.
   - **Root cause (ccguide-confirmed against official docs, `a780718e4f50adfe9` — TWO stacked faults):**
     - **PRIMARY / the blocker — wrong payload field (code bug in `subagent-rows.js`).** `resolveRoot()` reads **only** `data.workspace.project_dir`, but the docs state the **`subagentStatusLine` payload is hook-shaped** — base hook fields + `columns` + `tasks[]` — and contains **no `workspace` object at all** (`workspace.project_dir` exists only in the MAIN `statusLine` payload). So in a real run `resolveRoot` always returns `null` → `if (root) writeFleetState(...)` is always skipped → the heartbeat **never writes, even when the hook fires.** Origin: msg #4's research confirmed `workspace.project_dir` for the *main* statusLine, and the build assumed the *subagent* statusLine payload was identical — it is not. The synthetic-payload validation in msg #15 masked this exactly because it *fed* `workspace.project_dir`, which a real payload never sends. (Source: statusline.md "Subagent status lines".)
     - **SECONDARY — activation needs a reload/restart.** Plugins CAN register `subagentStatusLine` from a plugin-bundled `settings.json` (it's an explicitly supported key — `agent` and `subagentStatusLine` are the only two), so the wiring *mechanism* is valid (my earlier "plugin settings.json unsupported" candidate was WRONG). BUT the plugin-component load (incl. its `settings.json`) takes effect only after `/reload-plugins` or a session restart — this running session predates the 1.13.0 activation, so the hook likely isn't even firing yet. Necessary, but **not sufficient** — the primary bug still blocks the write. (Source: plugins.md "Ship default settings"; statusline.md "When it updates".)
   - **Why it stayed hidden until now:** the build session only ever validated the **write path with a synthetic payload** (msg #15); the live `subagentStatusLine` invocation was explicitly never confirmed. Fail-open held throughout (no crash; rows fell back to default; the pipeline was unaffected) — "worst-case-inert" as designed — but the feature is **non-functional in practice** until the wiring is delivered through a supported, activated channel.
   - **Remedy (confirmed — a real FleetView follow-up bump):**
     1. **Fix `resolveRoot()` in `subagent-rows.js`** to resolve the root from a field the subagent payload actually carries. First **capture a real payload** (the script already supports `NEXUS_SUBAGENT_CAPTURE=<file>`) to see the exact base-hook fields, then resolve from the top-level base-hook `cwd` (session cwd = project root) — i.e. `data.workspace?.project_dir || data.cwd` (keep the `workspace` read as a harmless forward-compat fallback). Per-task `tasks[].cwd` stays rejected (subagent dir). **This is the load-bearing fix — without it the heartbeat cannot write.**
     2. **Activation:** the registration takes effect only on `/reload-plugins` or a Claude Code restart after the plugin install/update — document this as a `/nexus:fleet` setup step (plugin `settings.json` is read at plugin-load, not hot-reloaded).
     3. **Re-validate live** (the step msg #15 deferred): after the fix + restart, run a real multi-agent pipeline and confirm `fleet-state.json` is written and `/nexus:fleet` renders the roster. Do **not** re-validate with a hand-fed `workspace.project_dir` payload — that is exactly what masked the bug.
     The current FleetView is **observability-dead in live runs** until at least fix #1 ships.
