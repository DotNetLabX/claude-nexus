#!/usr/bin/env node
/**
 * Nexus PostToolUse(Write|Edit|MultiEdit) boundary detector. Async, observe-only — never blocks
 * (PostToolUse cannot block, and this must never wedge a run).
 *
 * Why this exists (evaluation roadmap B.2, unlocked by Probe P1 on 2026-06-10): the platform
 * drops a PreToolUse deny for background subagents (ADR-13), so the pipeline gate cannot
 * PREVENT a backgrounded agent's boundary violation — but PostToolUse hooks DO fire there.
 * Prevention stays with the agents' hard rules (ADR-14/18); this makes every breach
 * DETERMINISTICALLY VISIBLE: a violation appends one JSON line to .claude/audit/violations.log
 * (+ a systemMessage), and the team lead checks the log at every checkpoint instead of hoping
 * an agent self-reports.
 *
 * Scope: SUBAGENT calls only (agent_type present). Main-session/foreground writes are already
 * covered by the gate + guard, whose denies ARE honored there.
 *
 * Rules (ADR-18 ownership matrix):
 *   - a non-code role (architect/reviewer/po/critic/team-lead/learner) writing application source
 *   - a role writing another role's artifact: plan.md=architect, review.md=architect|reviewer,
 *     implementation.md=developer, summary.md=team-lead (lessons.md is shared by design)
 *   - ANY subagent writing .claude/.pipeline-state (the team lead owns it, main-session only)
 *
 * Zero footprint when clean: nothing is created unless a violation occurs. Fail silent on any
 * error (mirrors audit-logger).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const NONCODE_ROLES = new Set(['architect', 'reviewer', 'po', 'critic', 'team-lead', 'learner']);
const ARTIFACT_OWNERS = [
  [/\/plan\.md$/, new Set(['architect'])],
  [/\/review\.md$/, new Set(['architect', 'reviewer'])],
  [/\/implementation\.md$/, new Set(['developer'])],
  [/\/summary\.md$/, new Set(['team-lead'])],
];

// Same source-file test as guard.js/pipeline-gate.js: markdown/config are not code; docs/ and
// .claude/ are doc/system areas.
function isCodeFile(fp) {
  const p = String(fp).toLowerCase();
  if (/(^|\/)(docs|\.claude)\//.test(p)) return false;
  return /\.(cs|ts|tsx|js|jsx|mjs|cjs|vue|css|scss|sass|less|py|go|java|kt|rb|rs|php|c|h|cpp|hpp|cc|swift|sql|sh|ps1|razor|cshtml)$/.test(p);
}

function violation(role, fp) {
  if (/(^|\/)\.claude\/\.pipeline-state$/.test(fp)) {
    return 'subagent wrote .claude/.pipeline-state — the team lead (main session) is its sole writer (ADR-18)';
  }
  for (const [re, owners] of ARTIFACT_OWNERS) {
    if (re.test(fp) && !owners.has(role)) {
      return `wrote an artifact whose owner is another role (${fp}) — each artifact has exactly one owner (ADR-18)`;
    }
  }
  if (NONCODE_ROLES.has(role) && isCodeFile(fp)) {
    return `non-code role edited application source (${fp}) — route code changes to the developer`;
  }
  return null;
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    if (!/^(Write|Edit|MultiEdit)$/.test(data.tool_name || '')) return process.exit(0);
    if (!data.agent_type) return process.exit(0); // main session: the foreground gate covers it
    const role = String(data.agent_type).toLowerCase().split(/[:/]/).pop();

    const ti = data.tool_input || {};
    const fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
    if (!fp) return process.exit(0);

    const rule = violation(role, fp);
    if (!rule) return process.exit(0);

    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    const dir = path.join(root, '.claude', 'audit');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      path.join(dir, 'violations.log'),
      JSON.stringify({ ts: new Date().toISOString(), agent: role, tool: data.tool_name, path: fp, rule }) + '\n'
    );
    process.stdout.write(JSON.stringify({
      systemMessage: `Nexus boundary detector: ${role} ${data.tool_name} -> ${fp} (${rule}). Logged to .claude/audit/violations.log.`,
    }));
  } catch { /* fail silent — observe-only */ }
  process.exit(0);
});
