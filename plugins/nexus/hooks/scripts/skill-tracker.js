#!/usr/bin/env node
/**
 * Nexus PostToolUse(Skill) skill-invocation logger. Async, observe-only — never blocks
 * (PostToolUse cannot block, and this must never wedge a run).
 *
 * Why this exists (Gate A, ADR-24 proposed): the skill-first mandate is enforced by the
 * architect's done-check, but that check scored the developer's OWN `## Skills Used` self-report
 * in implementation.md — fakeable (claim an invocation that never happened) and, if the section
 * is omitted, the check has nothing to compare. The fix is to score against a platform-logged
 * FACT instead. This hook appends one JSON line per Skill invocation to
 * `.claude/audit/skill-invocations.log`; the done-check (architect.md) treats THAT as authoritative
 * and demotes the self-report to a cross-check.
 *
 * Always-on, NOT config-gated (read-tracker.js is the precedent): Gate A must not depend on the
 * opt-in `token_audit` flag (ADR-11) — audit-logger.js ALSO captures `Skill` via its broad ti.skill
 * pick, but only when token_audit is on, so it cannot back a reliable gate. This logger is
 * deliberately separate and always-on (do NOT consolidate them, or Gate A re-couples to the flag).
 *
 * Platform contract (live-verified 2026-06-13 against this project's session transcripts): a skill
 * invocation surfaces as tool_name === 'Skill' with tool_input.skill carrying the skill name (bare
 * `create-feature` or namespaced `nexus:summary-format`). A wrong matcher would silently capture
 * nothing and make Gate A false-green — verified to avoid exactly that.
 *
 * Log line: { ts, agent, skill, token, session } appended to .claude/audit/skill-invocations.log.
 *   - agent  — resolved exactly as audit-logger.js:99: data.agent_type || session persona || 'main'.
 *              The '|| main' tail is required: on solo/fast runs the developer IS the main session and
 *              a Skill call there must attribute to 'main', not blank, or Step 3's scoping drops it.
 *   - skill  — data.tool_input.skill, verbatim (Step 3 matches on the final segment).
 *   - token  — .claude/.pipeline-state content ('' if absent) AND session = data.session_id: the
 *              round window Step 3 scopes by (read-tracker.js round-keying — survives resumes and
 *              two back-to-back features in one session).
 *
 * Worktree note (behavior is deliberate — do NOT make this hook worktree-aware): the log home is
 * resolved from CLAUDE_PROJECT_DIR (below), so a session running inside a git WORKTREE writes to the
 * MAIN CHECKOUT's `.claude/audit/`, not the worktree's. One log home is the correct design — a split
 * log would break the token-scoped round queries Step 3 depends on. The reader compensates: the
 * architect's done-check resolves the main checkout via
 * `git rev-parse --path-format=absolute --git-common-dir` and checks BOTH homes before declaring the
 * log absent (`plugins/nexus/agents/architect.md` §Step 1: Done Check, the "Skill conformance
 * check" paragraph; mirrored into `commands/architect.md` by gen-commands). A measured false
 * "log missing" came from the reader looking in the worktree only, never from this writer.
 *
 * Counterpart note (F51): verify-gate.js DELIBERATELY diverges from the decision above — see its
 * header. It measures the coordinator-published target tree rather than the resolved root. That
 * divergence does not re-create the split-log harm: the gate still APPENDS ITS VERDICT to the
 * resolved root, so it too keeps one log home and the token-scoped round queries keep working — it
 * moved where it MEASURES, not where it writes. What licenses the split is the asymmetry: this hook
 * only RECORDS, so one log home is simply right for it; a verify verdict DECIDES an unattended
 * close, so measuring the wrong tree is a correctness bug that fails green. Nothing here changes —
 * this hook stays worktree-unaware on purpose.
 *
 * Zero footprint on error (no dirs, no files). Fail silent on any error (mirrors read-tracker /
 * audit-logger).
 */
'use strict';
const fs = require('fs');
const path = require('path');
// Shared with audit-logger.js and guard.js — the '|| persona || main' attribution chain's middle
// tier. Was a hand-copied local definition until F45-RuntimeDriftHardening Step 3.
const { readSessionPersona } = require('./lib/read-session-persona');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    if ((data.tool_name || '') !== 'Skill') return process.exit(0);

    const ti = data.tool_input || {};
    const skill = String(ti.skill || '');
    if (!skill) return process.exit(0); // no skill name — nothing to attribute

    const session = String(data.session_id || '');
    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();

    // Attribution: subagent agent_type, else this session's recorded persona, else 'main'
    // (audit-logger.js:99 — the '|| main' tail is load-bearing for solo/fast runs).
    const agentRaw = data.agent_type || readSessionPersona(session, root) || 'main';
    const agent = String(agentRaw).toLowerCase().split(/[:/]/).pop();

    // Round window for Step 3 scoping (read-tracker.js:52-53 round-keying).
    let token = '';
    try { token = fs.readFileSync(path.join(root, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }

    const auditDir = path.join(root, '.claude', 'audit');
    fs.mkdirSync(auditDir, { recursive: true });
    fs.appendFileSync(
      path.join(auditDir, 'skill-invocations.log'),
      JSON.stringify({ ts: new Date().toISOString(), agent, skill, token, session }) + '\n'
    );
  } catch { /* fail silent — observe-only */ }
  process.exit(0);
});
