# adhoc-NexusFleetView — Questions

**Phase:** architect analyze (Phase 1)
**Status:** Answered
**Slug:** adhoc-NexusFleetView

**Answers (user, 2026-06-16):** Q1 → **(A) Heartbeat**. Q2 → **snapshot skill only** (defer Vue
dashboard to a separate feature). Q3 → **critic (Mode 2 vs ADR register) + mandatory code-grounded
review**.

Context: build "our own visual representation of the running background agents" for the nexus
plugin. Continuation of the knowledge-gateway discussion (2026-06-16). Prior verdict: native
in-terminal FleetView can't be reskinned from a plugin; a custom view fed by data nexus already
emits is doable.

## Findings that reshape the design (codebase facts — decided, not asked)

- **A per-row live glance already ships.** `plugins/nexus/statusline/subagent-rows.js` (1.11.0) is a
  `subagentStatusLine` the platform feeds a live `tasks[]` array — `{id, name, type, status,
  startTime, tokenCount, cwd}` — and restyles each agent row per role (`[arch] label · 12k tok ·
  3m20s`). A "fleet view" is therefore the **consolidated** layer the per-row statusline structurally
  cannot provide (no summary header, no aggregation, no pipeline phase/cycle).
- **The rich live fleet data is push-only.** The in-session `TaskList` tool returns only the task
  board (`{id, subject, status, owner, blockedBy}`) — no tokens, no elapsed, no role, no run state.
  The only component that ever sees the rich `tasks[]` is the `subagentStatusLine` hook. So a live
  fleet view's data must be **captured from the statusline**, not queried on demand.
- **Build target = a skill** `/nexus:fleet` (sibling of `consumption-report`; `commands/` are
  agent-generated personas only).
- **Ships to consumers** (runtime observability, like ADR-11) → MINOR bump **1.12.0** + omni twin
  regen (ADR-6/9).
- **Graceful degradation is natural:** basic columns (role/status/label/tokens/elapsed) need no
  precondition; depth columns (peak context, growth, tool-calls) come from `token-usage.jsonl` and
  are `token_audit`-gated — `consumption-report` already parses that log, so depth is reuse.
- **Write-root is a solved pattern:** every hook resolves `process.env.CLAUDE_PROJECT_DIR ||
  data.cwd || process.cwd()`; the heartbeat reuses it and skips the write if unresolvable
  (fail-open, no stray-log — ADR-8).

## Q1 — Data-source architecture (load-bearing) — **To: user**

How does `/nexus:fleet` get live per-agent data?

- **(A) Heartbeat.** `subagent-rows.js` also writes the latest `tasks[]` snapshot to
  `.claude/audit/fleet-state.json` (latest-wins). `/nexus:fleet` renders that + joins
  `communication-log.md` (phase/cycle/review-mode), `token-usage.jsonl` (depth), `violations.log`
  (health). The same file is the data source a future Vue dashboard tails.
  *Cost:* a guarded write added to a shipped pure-transform statusline; freshness = statusline
  cadence (near-real-time, not frame-accurate).
- **(B) Files-only.** Skill reads task board + comm-log + token-usage + violations; **no statusline
  change**. Zero-touch/safe, but no live tokens/elapsed/run-state per agent — thinner than the live
  panel, and overlaps `consumption-report`.

**Recommendation: A** — it's the only path to the *live* glance you asked for, and the heartbeat
doubles as the dashboard's source. **Confidence: medium-high** (two impl-time confirmables: which
payload field reliably carries the write-root, and that `tokenCount` is always present — both
checkable via the existing `NEXUS_SUBAGENT_CAPTURE`).

## Q2 — v1 scope — **To: user**

v1 = `/nexus:fleet` snapshot skill only, with the Vue web dashboard deferred to a **separate later
feature**?

**Recommendation: yes** — dashboard is Med-effort on a different surface; Option A already lays its
data source, so deferring costs nothing. **Confidence: high.**

## Q3 — Review mode — **To: user**

Self-review or critic? This pass edits a **shipped plugin** and adds a **JS write path**, so per the
shared/external-artifact rule a code-grounded review is load-bearing.

**Recommendation: critic (Mode 2 vs the ADR register) + mandatory code-grounded review** (reviewer
reads the actual statusline + skill files, not just a doc-diff). **Confidence: high.**
