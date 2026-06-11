#!/usr/bin/env node
/**
 * Nexus PostToolUse(Read) read-tracker. Async, observe-only — never blocks (PostToolUse
 * cannot block, and this must never wedge a run).
 *
 * Why this exists (ADR-22): the read-once-per-round discipline is prose in every agent file,
 * and prose measurably fails over long runs (F16: the architect re-read its own plan.md ×35,
 * ~2.5MB through context). A PreToolUse deny would wedge legitimate reads and is dropped for
 * background subagents anyway (ADR-13) — so the only honest mechanism is rule + nudge +
 * deterministic detection, the same shape boundary-detector.js uses for spawns:
 *   - 2nd same-round read of a file  -> corrective systemMessage (best-effort; whether it
 *     reaches a background subagent's context is unverified — Probe P1 proved PostToolUse
 *     fires there, not that hook output is delivered)
 *   - 3rd+ same-round read           -> one line in .claude/audit/violations.log, which the
 *     team lead triages at every checkpoint (guaranteed detection layer)
 *
 * Round boundary: the content of .claude/.pipeline-state OR the session id changing — the
 * team lead rewrites the token at every spawn/resume, so a token change IS a new round.
 * Chunked reads (offset/limit present) are one logical read and are never counted.
 *
 * State: .claude/audit/read-tracker.json — { session, token, counts: { "agent|file": n } }.
 * A deliberate exception to boundary-detector's zero-footprint posture (counting across
 * calls needs state); reset on every round change. Fail silent on any error.
 */
'use strict';
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    if ((data.tool_name || '') !== 'Read') return process.exit(0);

    const ti = data.tool_input || {};
    // Chunked reads of distinct ranges are ONE logical read — sanctioned, never counted.
    if (ti.offset !== undefined || ti.limit !== undefined) return process.exit(0);
    const fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
    if (!fp) return process.exit(0);

    const agent = data.agent_type
      ? String(data.agent_type).toLowerCase().split(/[:/]/).pop()
      : 'main';
    const session = String(data.session_id || '');

    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    const auditDir = path.join(root, '.claude', 'audit');
    const stateFile = path.join(auditDir, 'read-tracker.json');

    let token = '';
    try { token = fs.readFileSync(path.join(root, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }

    let state = null;
    try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { /* fresh */ }
    if (!state || state.session !== session || state.token !== token) {
      state = { session, token, counts: {} }; // new round — every count resets
    }

    const key = `${agent}|${fp.toLowerCase()}`;
    const n = (state.counts[key] || 0) + 1;
    state.counts[key] = n;

    fs.mkdirSync(auditDir, { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(state));

    if (n < 2) return process.exit(0);

    if (n >= 3) {
      fs.appendFileSync(
        path.join(auditDir, 'violations.log'),
        JSON.stringify({
          ts: new Date().toISOString(), agent, tool: 'Read', path: fp,
          rule: `same-round re-read x${n} — read each file once per round (ADR-22, agents-workflow Read Discipline)`,
        }) + '\n'
      );
    }
    process.stdout.write(JSON.stringify({
      systemMessage:
        `Nexus read-tracker: ${agent} re-read ${fp} (x${n} this round). Read each file once per round — ` +
        'it is already in your context; work from it. Re-read only after a compaction or an external change ' +
        '(agents-workflow Read Discipline).',
    }));
  } catch { /* fail silent — observe-only */ }
  process.exit(0);
});
