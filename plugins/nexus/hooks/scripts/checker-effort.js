#!/usr/bin/env node
/**
 * Nexus PreToolUse(Agent|Task) checker-effort hook. Synchronous, and it never blocks.
 *
 * The critic and reviewer seats take their reasoning effort from the model in the seat. The table's
 * one home is `rules/on-demand/pipeline-guardrails.md` § Effort by model at the checker seats;
 * EFFORT_BY_FAMILY below is a copy that a test holds equal to it. Where such a spawn passes no
 * `effort` of its own, this hook returns the call's whole input with `effort` added, as
 * `updatedInput`. A spawn that passes its own `effort` (the light lane's lowered level, an owner's
 * choice) is left alone, because this hook cannot see the lane.
 *
 * UNDER A GEAR, a Sonnet seat takes the gear's checker effort (row 5 of lib/gears-shipped.json) in
 * place of the table, read through lib/gears.js for the spawning session's active gear context —
 * pending or fixed, so a spec review is covered. `as today` and no context keep the table; other
 * families keep it always. A learner or solo session never takes a gear, whatever context survives.
 *
 * NEVER A permissionDecision. An `allow` from a hook would skip the user's permission rules for every
 * checker spawn; the `updatedInput` reaches the spawn without one (probed on Claude Code 2.1.302).
 *
 * NEEDS CLAUDE CODE 2.1.292 OR LATER for the per-spawn `effort`; an older version ignores the field
 * and the agent file's `effort` applies. The version is not checked here.
 *
 * THE FAMILY is the call's `model`, else the `model:` frontmatter of this plugin's own agent file,
 * read plugin-relative. FAMILY_RE is the pattern of config-advisor.js family(), held equal by a test.
 * A consuming repo's same-named project agent, or a subagent model the environment forces, is not
 * detected: the hook assumes this plugin's critic and reviewer files.
 *
 * FAIL OPEN. A tool other than Agent or Task, a seat other than the two, a family outside the table,
 * and every read or parse error: no output, exit 0 — the agent file's `effort` applies.
 */
const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');

const EFFORT_BY_FAMILY = { sonnet: 'high', opus: 'xhigh', fable: 'xhigh' };
const FAMILY_RE = /\b(fable|opus|sonnet|haiku)\b/;
const TOOLS = ['Agent', 'Task'];
const SEATS = { 'nexus:critic': 'critic', 'nexus:reviewer': 'reviewer', critic: 'critic', reviewer: 'reviewer' };
const GEAR_EXEMPT_ROLES = new Set(['learner', 'solo']);

function family(value) {
  const v = String(value).trim().toLowerCase();
  const m = v.match(FAMILY_RE);
  return m ? m[1] : v;
}

function frontmatterModel(agent) {
  try {
    const text = fs.readFileSync(path.join(PLUGIN_ROOT, 'agents', `${agent}.md`), 'utf8');
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fm = m ? m[1].match(/^model:\s*(\S+)\s*$/m) : null;
    return fm ? fm[1] : '';
  } catch { return ''; }
}

const hasEffort = (v) => (typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null);

/** Row 5's runtime level for the spawning session's active gear context, or null. Never throws. */
function gearEffort(data) {
  try {
    const { valueOf, EFFORT_LEVELS } = require('./lib/gears');
    const { resolveRole } = require('./lib/resolve-role');
    const { readSessionPersona } = require('./lib/read-session-persona');
    const { resolveDeclaredTree } = require('./lib/worktree-target');
    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    const session = data.session_id;
    if (GEAR_EXEMPT_ROLES.has(resolveRole(data.agent_type || readSessionPersona(session, root) || 'main'))) return null;
    const v = valueOf({ setting: 5, root, tree: resolveDeclaredTree(root, session), session, env: process.env });
    return Object.hasOwn(EFFORT_LEVELS, v.value) ? EFFORT_LEVELS[v.value] : null;
  } catch { return null; }
}

/** The input with `effort` added, or null where the hook leaves the call alone. */
function updatedInputFor(data) {
  if (!data || typeof data !== 'object' || !TOOLS.includes(data.tool_name)) return null;
  const input = data.tool_input;
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  if (!Object.hasOwn(SEATS, input.subagent_type)) return null;
  if (hasEffort(input.effort)) return null;
  const given = input.model;
  if (given !== undefined && given !== null && typeof given !== 'string') return null;
  const model = typeof given === 'string' && given.trim() ? given : frontmatterModel(SEATS[input.subagent_type]);
  const f = family(model);
  if (!Object.hasOwn(EFFORT_BY_FAMILY, f)) return null;
  return { ...input, effort: (f === 'sonnet' && gearEffort(data)) || EFFORT_BY_FAMILY[f] };
}

function main(raw) {
  let updatedInput = null;
  try { updatedInput = updatedInputFor(JSON.parse(raw || '{}')); } catch { updatedInput = null; }
  if (updatedInput) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', updatedInput } }));
  }
  // No process.exit: on an asynchronous stdout it drops the write still pending.
  process.exitCode = 0;
}

module.exports = { updatedInputFor, family, EFFORT_BY_FAMILY, FAMILY_RE };

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (input += d));
  process.stdin.on('end', () => main(input));
}
