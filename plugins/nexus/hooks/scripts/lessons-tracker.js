#!/usr/bin/env node
/**
 * Nexus PostToolUse(Write|Edit) lessons-write logger. Async, observe-only — never blocks.
 *
 * Why this exists (ADR-100 K5 → the observing gate; F100 § 7 ruling b): "write lessons before you
 * close" was the one AFFIRMATIVE duty the always-on prohibitions envelope carried, and the W4 probes
 * measured it at 0.000 — prose alone did not carry it at either depth. The duty now leaves the
 * envelope and is OBSERVED instead: this hook records every lessons write, and `pipeline-gate.js`
 * invariant (5) refuses a `summary.md` write while no record exists for the round.
 *
 * Chosen over a file-timestamp or a git-dirty check because a `per-step` commit strategy can commit
 * the lessons write before close and make either proxy lie. A record cannot be back-dated by a commit.
 *
 * Log line: { ts, agent, slug, token, session } appended to .claude/audit/lessons-writes.log —
 * the same shape and the same attribution chain as skill-invocations.log, so one reader idiom serves
 * both. `slug` is the capture from the path, so a nested issue keeps its full inner path (`E/I`) and
 * one issue's close can never be discharged by a sibling's lessons.
 *
 * Zero footprint on any other path: no dirs, no file. Fail silent on any error.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { readSessionPersona } = require('./lib/read-session-persona');

// The capture is greedy on purpose — `docs/specs/{epic}/{issue}/delivery/lessons.md` yields
// `{epic}/{issue}`, which is the round key a nested issue closes under.
const LESSONS_RE = /(?:^|\/)docs\/specs\/(.+)\/delivery\/lessons\.md$/;

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    if (!/^(Write|Edit)$/.test(data.tool_name || '')) return process.exit(0);

    const ti = data.tool_input || {};
    const fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
    const m = fp.match(LESSONS_RE);
    if (!m) return process.exit(0); // any other path — nothing observed, nothing written

    const session = String(data.session_id || '');
    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();

    const agentRaw = data.agent_type || readSessionPersona(session, root) || 'main';
    const agent = String(agentRaw).toLowerCase().split(/[:/]/).pop();

    let token = '';
    try { token = fs.readFileSync(path.join(root, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }

    const auditDir = path.join(root, '.claude', 'audit');
    fs.mkdirSync(auditDir, { recursive: true });
    fs.appendFileSync(
      path.join(auditDir, 'lessons-writes.log'),
      JSON.stringify({ ts: new Date().toISOString(), agent, slug: m[1], token, session }) + '\n'
    );
  } catch { /* fail silent — observe-only */ }
  process.exit(0);
});
