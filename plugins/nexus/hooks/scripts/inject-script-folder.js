#!/usr/bin/env node
/**
 * Nexus inject-script-folder (F173, D5; F179). SubagentStart: a spawned agent never sees the
 * session-start plugin-paths block (ADR-70), so it cannot locate a shipped script on its own.
 * - `team-lead`: one line with the resolved scripts folder, for the Codex job helper.
 * - `po` and `learner`: the same line, because each dispatches a Codex critic through the Codex job
 *   helper (`codex-job.js`) and cannot otherwise find it.
 * - `architect` and `reviewer` (a second reader resolves to `reviewer`): the same folder plus the
 *   `lessons-append.js` invocation, because the done check and the code review now run at once and
 *   append to one lessons.md. The architect also finds the Codex job helper there.
 * Every other spawn gets nothing, so no other context grows.
 *
 * Fail-silent: an absent agent_type, another role, or unparseable stdin is exit 0 with empty stdout.
 */
'use strict';
const path = require('path');
const crypto = require('crypto');
const { resolveRole } = require('./lib/resolve-role');

const SCRIPTS = path.resolve(__dirname).replace(/\\/g, '/');
const FOLDER = `Nexus plugin scripts folder (resolved at spawn): ${SCRIPTS}`;

// The scratch name is random per spawn: a primary reviewer and its second reader share the role.
function lessonsLine(role, root) {
  const scratch = `${root}/.claude/audit/lessons-append/${role}-${crypto.randomBytes(4).toString('hex')}.md`;
  return `${FOLDER}\nLessons while another agent may be writing lessons.md: Write your text to `
    + `${scratch}, then run `
    + `node "${SCRIPTS}/lessons-append.js" --file {absolute path of the feature's lessons.md — in a worktree lane, the lane's copy} `
    + `--role ${role} --from ${scratch} `
    + '(add --section "Skill Gaps" for that heading). If the script cannot be found or run, or the scratch file '
    + 'cannot be written, append with Edit — a lost lesson is acceptable, a stall is not.';
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const role = data.agent_type ? resolveRole(data.agent_type) : '';
    let context = '';
    if (role === 'team-lead' || role === 'po' || role === 'learner') context = FOLDER;
    else if (role === 'architect' || role === 'reviewer') {
      context = lessonsLine(role, path.resolve(process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd()).replace(/\\/g, '/'));
    }
    if (!context) return process.exit(0);
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SubagentStart',
        additionalContext: context,
      },
    }));
  } catch { /* fail silent */ }
  process.exit(0);
});
