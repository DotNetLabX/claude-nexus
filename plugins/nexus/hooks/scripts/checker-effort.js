#!/usr/bin/env node
/**
 * Nexus PreToolUse(Agent|Task) model-preset hook. Synchronous, and it never blocks. (The file keeps its
 * first job's name, filling the checker seats' effort, so its registration stays as it is.)
 *
 * It fills a spawn's `model` and `effort` from the model preset in force for the session — the repo's,
 * else the profile's, else the default — read through lib/model-presets.js, whose table is the one home
 * of every model choice (shown to readers in `rules/on-demand/pipeline-guardrails.md` § Model presets).
 * Where it fills anything it returns the call's whole input with the field added, as `updatedInput`.
 * A spawn's own `model` or `effort` is never replaced, because this hook cannot see why it was chosen
 * (the light lane's lowered level, an owner's direction, the pairing check's reader).
 *
 * WHICH SPAWNS. An agent of any nexus plugin (`nexus:` or `nexus-{name}:`), the core agents' bare names,
 * and the built-in helper types the table names. Under a preset that fills every matched spawn, each one
 * with no `model` whose seat the preset names gets that seat's model and, with no `effort`, the seat's own
 * effort; a spawn that names its own model and no effort gets the preset's effort for that model's family.
 * A seat the preset leaves `as today`, another plugin's agent among them, is left to its agent file. Under the default preset only the critic and reviewer seats are
 * touched, and only their effort: the table's effort for the model in the seat, the call's `model` else
 * the `model:` frontmatter of this plugin's own agent file.
 *
 * UNDER A GEAR, the default preset's reader family takes the gear's reader effort (row 5 of
 * lib/gears-shipped.json) in place of the table, read through lib/gears.js for the spawning session's
 * active gear context — pending or fixed, so a spec review is covered. `as today` and no context keep the
 * table. A learner or solo session never takes a gear, whatever context survives.
 *
 * NEVER A permissionDecision. An `allow` from a hook would skip the user's permission rules for every
 * spawn; the `updatedInput` reaches the spawn without one (probed on Claude Code 2.1.302 for `effort`,
 * and on 2.1.322 for `model`).
 *
 * NEEDS CLAUDE CODE 2.1.292 OR LATER for the per-spawn `effort`; an older version ignores the field and
 * the agent file's `effort` applies. The version is not checked here. A consuming repo's same-named
 * project agent, or a subagent model the environment forces, is not detected.
 *
 * FAIL OPEN. A tool other than Agent or Task, a type the presets do not cover, a model family outside
 * the table, and every read or parse error: no output, exit 0 — the agent file decides.
 */
const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_PRESET = 'standard';

let mp = null;
try { mp = require('./lib/model-presets'); } catch { mp = null; }

const EFFORT_BY_FAMILY = mp ? { ...mp.table().presets[DEFAULT_PRESET].effort.byFamily } : {};
const FAMILY_RE = mp ? mp.familyPattern() : /(?!)/;
const TOOLS = ['Agent', 'Task'];
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

const hasValue = (v) => (typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null);
const rootOf = (data) => process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();

function presetInForce(data) {
  try { return mp.resolvePreset({ root: rootOf(data), env: process.env }).preset; } catch { return DEFAULT_PRESET; }
}

/** Row 5's runtime level for the spawning session's active gear context, or null. Never throws. */
function gearEffort(data) {
  try {
    const { valueOf, EFFORT_LEVELS } = require('./lib/gears');
    const { resolveRole } = require('./lib/resolve-role');
    const { readSessionPersona } = require('./lib/read-session-persona');
    const { resolveDeclaredTree } = require('./lib/worktree-target');
    const root = rootOf(data);
    const session = data.session_id;
    if (GEAR_EXEMPT_ROLES.has(resolveRole(data.agent_type || readSessionPersona(session, root) || 'main'))) return null;
    const v = valueOf({ setting: 5, root, tree: resolveDeclaredTree(root, session), session, env: process.env });
    return Object.hasOwn(EFFORT_LEVELS, v.value) ? EFFORT_LEVELS[v.value] : null;
  } catch { return null; }
}

/** The input with `model` and/or `effort` added, or null where the hook leaves the call alone. */
function updatedInputFor(data) {
  if (!mp || !data || typeof data !== 'object' || !TOOLS.includes(data.tool_name)) return null;
  const input = data.tool_input;
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const type = input.subagent_type;
  const kind = typeof type === 'string' ? mp.agentRole(type) : null;
  if (!kind) return null;
  const given = input.model;
  if (given !== undefined && given !== null && typeof given !== 'string') return null;
  const preset = presetInForce(data);
  const fill = mp.seatFor(preset, { agentType: type });
  const reader = kind === 'readers';
  if (!fill && !reader) return null;
  const out = { ...input };
  let model = hasValue(given) ? given : null;
  let seatEffort = null;
  if (!model && fill) { model = fill.model; out.model = model; seatEffort = fill.effort; }
  if (!model) model = frontmatterModel(type.startsWith('nexus:') ? type.slice('nexus:'.length) : type);
  if (!hasValue(input.effort)) {
    const f = family(model);
    const gearFamily = mp.gearEffortFamily(preset);
    const effort = seatEffort || (reader && gearFamily && f === gearFamily && gearEffort(data)) || mp.effortFor(preset, f, { seat: reader });
    if (effort) out.effort = effort;
  }
  return out.model !== input.model || out.effort !== input.effort ? out : null;
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
