#!/usr/bin/env node
/**
 * Nexus PreToolUse test-entry gate (SYNCHRONOUS — can block).
 *
 * A developer or solo seat runs tests through verify-run.js (`--profile fast`, or `--files` for the test
 * being written), never a raw test command. On every gated seat, foreground or background, a raw
 * command is denied with the runner call in the reason and logged to .claude/audit/violations.log with
 * `blocked: true`; a subagent's row also carries `spawn`.
 *
 * A BACKGROUND DENY IS A PLATFORM FACT, BY VERSION: dropped for a background subagent up to the
 * 2026-09-16 re-probe (Claude Code 2.1.273), honoured at 2.1.293 (ADR-135 P7) and at 2.1.301 (probe
 * 2026-10-17). On a version that drops it — an older client, or a later one — the command runs while
 * its row still reads `blocked: true`, and nothing here detects that.
 *
 * LATENCY: a synchronous hook on every shell call, so the first act is isRawTestCommand, a pure
 * string decision made before any registry or declaration read.
 *
 * An INVOCATION, not a mention: the command is split on its chain separators and newlines outside
 * quotes (lib/test-runners.js owns what a separator is) and on `$(`; a segment fires when it
 * contains a test form, token-bounded, UNLESS its first token (by basename) is a read/display lead —
 * `grep`, `cat`, `echo`, `git` and kin — or an exempt script. So `grep jest package.json` and
 * `git commit -m "wip; dotnet test"` pass, while `$out = node --test x`, `python -m pytest` and
 * `./node_modules/.bin/jest` do not, with no list of wrappers or launchers to keep current. A lead not
 * yet on the read list fires: a visible deny, added to the list on its first sighting. A script or
 * heredoc that runs tests without naming the invocation is a disclosed miss.
 *
 * FAIL OPEN on bad JSON, a missing session, an unresolvable seat or an unreadable declaration.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { resolveRole } = require('./lib/resolve-role');
const { readSessionPersona } = require('./lib/read-session-persona');
const { resolveDeclaredTree } = require('./lib/worktree-target');
const { splitChain } = require('./lib/compose-test-command');

const SHELL_TOOLS = /^(Bash|PowerShell)$/;
const GATED_SEATS = new Set(['developer', 'solo']);
const COMMAND_EXCERPT = 120; // audit-logger.js's cap

const fold = (command) => String(command || '').replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

// The ten forms, token-bounded on both sides and tolerant of an `.exe` on the executable.
const TEST_FORM = /(?:^|[\s;&|(){}:/\\])(?:dotnet(?:\.exe)? test|node(?:\.exe)? --test|flutter(?:\.exe)? test|dart(?:\.exe)? test|pytest(?:\.exe)?|vitest(?:\.exe)?|jest(?:\.exe)?|npm(?:\.exe)? (?:test|t|run test))(?=$|[\s;&|(){}:/\\])/;

// Leads whose naming of a test form is never an invocation. Extend on a measured sighting only.
const READ_LEADS = new Set([
  'grep', 'rg', 'cat', 'head', 'tail', 'ls', 'find', 'sed', 'awk', 'type',
  'select-string', 'get-content', 'echo', 'write-host', 'write-output', 'git',
  'where-object', 'group-object',
]);
const EXEMPT = new Set(['verify-run.js', 'tag-slow-tests.mjs']);

const basename = (token) => String(token || '').replace(/^.*[/\\]/, '').replace(/\.exe$/, '');

function segmentFires(raw) {
  const segment = fold(raw);
  const [first, second] = segment.split(' ').map(basename);
  if (EXEMPT.has(first) || (first === 'node' && EXEMPT.has(second))) return false;
  if (READ_LEADS.has(first)) return false;
  return TEST_FORM.test(segment);
}

// A `$(…)` substitution is a command of its own, even inside a double-quoted read.
function isRawTestCommand(command) {
  return splitChain(String(command || '').toLowerCase())
    .flatMap((segment) => segment.split('$('))
    .some(segmentFires);
}

function declaresUnit(tree) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8'));
    const unit = cfg && cfg.roles && cfg.roles.unit;
    return typeof unit === 'string' && unit.trim() !== '';
  } catch {
    return false;
  }
}

function main(input) {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return allow(); }
  const ti = (data && data.tool_input) || {};
  if (!SHELL_TOOLS.test(String(data.tool_name || '')) || !isRawTestCommand(ti.command)) return allow();
  if (!data.session_id) return allow();

  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const role = resolveRole(data.agent_type || readSessionPersona(data.session_id, root) || 'main');
  if (!GATED_SEATS.has(role)) return allow();

  const tree = resolveDeclaredTree(root, data.session_id);
  if (!declaresUnit(tree)) return allow();

  let token = '';
  try { token = fs.readFileSync(path.join(tree, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }

  // POSIX separators: the path is pasted into a command line, where a backslash is an escape.
  const runner = path.join(__dirname, 'verify-run.js').replace(/\\/g, '/');
  const call = `node "${runner}" --profile fast (for the test file you are writing: --profile fast --files <test file>...)`;
  const row = {
    agent: role,
    ...(data.agent_type ? { spawn: String(data.agent_type) } : {}),
    tool: String(data.tool_name),
    path: tree,
    rule: 'test-entry',
    command: fold(ti.command).slice(0, COMMAND_EXCERPT),
    token,
    session: data.session_id,
    blocked: true,
  };
  logViolation(root, row);
  return deny(`a raw test command (\`${row.command}\`). Run tests through ${call}.`);
}

function logViolation(root, row) {
  try {
    const dir = path.join(root, '.claude', 'audit');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'violations.log'), JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n');
  } catch { /* observation must never wedge the call */ }
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `Nexus test-entry gate blocked: ${reason}`,
    },
  }));
  process.exit(0);
}

function allow() { process.exit(0); }

module.exports = { isRawTestCommand };

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (input += d));
  process.stdin.on('end', () => main(input));
}
