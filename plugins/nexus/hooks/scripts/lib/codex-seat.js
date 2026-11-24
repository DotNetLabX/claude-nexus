'use strict';
/**
 * A seat job's own facts, read by codex-job.js: the seat folder, the one-job-per-tree reservation, whether a
 * role's writing start may run on Codex, the job's label and the tree's uncommitted files.
 *
 * THE SEAT FOLDER is NEXUS_SEAT_DIR, else `.nexus/seats` in the user's home — outside every tree and outside
 * temp, where a sandboxed job cannot write. Every session on the machine meets the same folder, whatever its
 * session root.
 *
 * ONE SEAT JOB PER TREE. `reserveTree` makes the tree's file under `trees/` with an exclusive create, so of two
 * callers at the same moment exactly one makes it. The file is named from the tree's real path, case-folded on
 * Windows as lib/codex-servers.js folds a folder's name, and holds who took it; a caller that finds it made is
 * told who holds it. `releaseTree` removes it only for the holder it names, and `updateHeld` changes it only for
 * that holder; every caller of either holds the tree's lock (codex-job.js), so of two at the same moment one acts.
 *
 * A WRITING START'S CONDITIONS. `seatDecision` answers whether a role's writing start runs on Codex: the role's
 * row allows a seat on this platform (lib/codex-entry.js `seatState`), its entry is a usable seat setting (lib/model-presets.js `seats`), the
 * caller does not say it is a spawned agent, and no campaign gear names the role's author model — gear row 8,
 * which names the developer and never the solo. Each refusal comes back with its reason — a closed row's
 * `notYetReason` included — and one for a role whose row allows no seat is marked `closed`.
 *
 * THE LABEL is `{slug} seat {role} {unit}`, then a space and the model where the entry names one. A unit is one
 * of the forms in `UNIT_TEXT`.
 *
 * THE TREE'S UNCOMMITTED FILES are git's status read by position, NUL-separated, never trimmed whole, with every
 * untracked file listed by itself; files git ignores are not in it.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const codexEntry = require('./codex-entry');

const GIT_MS = 20000;
const UNIT_FORMS = [
  /^steps \d+[a-z]?[–-]\d+[a-z]?$/,
  /^fix cycle \d+$/,
  /^fix cycle \d+ part \d+$/,
  /^hand-up \d+$/,
  /^solo fix \d+$/,
  /^solo fix \d+ attempt \d+$/,
  /^questions$/,
];
const UNIT_TEXT = 'steps {a}–{b}, fix cycle {N}, fix cycle {N} part {k}, hand-up {n}, solo fix {n}, solo fix {n} attempt {k} or questions';

const isUnit = (u) => typeof u === 'string' && UNIT_FORMS.some((re) => re.test(u));
const seatLabel = ({ slug, role, unit, model }) => `${slug} seat ${role} ${unit}${model ? ` ${model}` : ''}`;

function seatDir(env = process.env) {
  return path.resolve(env.NEXUS_SEAT_DIR || path.join(os.homedir(), '.nexus', 'seats'));
}

function treeKey(tree) {
  let real = path.resolve(tree);
  try { real = fs.realpathSync.native(real); } catch { /* a tree that cannot be resolved keeps its path */ }
  return require('./codex-servers').workspaceKey(real, process.platform);
}

function reservationFile(tree, env = process.env) {
  const key = treeKey(tree);
  const base = (path.basename(key) || 'tree').replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 40) || 'tree';
  const hash = crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  return path.join(seatDir(env), 'trees', `${base}-${hash}.json`);
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

/** `{file}` where this caller took the tree, `{held}` (the holder, `{}` where unreadable) where another has it, else `{error}`. */
function reserveTree(tree, holder, env = process.env) {
  const file = reservationFile(tree, env);
  let fd;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fd = fs.openSync(file, 'wx');
  } catch (err) {
    if (err.code === 'EEXIST') return { held: readJson(file) || {} };
    return { error: `the seat reservation (${file}) could not be made: ${err.message}` };
  }
  try { fs.writeSync(fd, JSON.stringify({ ...holder, tree: path.resolve(tree) })); } catch { /* the file alone holds the tree */ }
  try { fs.closeSync(fd); } catch { /* already closed */ }
  return { file };
}

/** Adds fields to the holder this caller wrote; the file is replaced whole. */
function updateReservation(file, fields) {
  const tmp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify({ ...(readJson(file) || {}), ...fields }));
    fs.renameSync(tmp, file);
    return true;
  } catch {
    try { fs.unlinkSync(tmp); } catch { /* never made */ }
    return false;
  }
}

/**
 * Adds fields — or what `fields(holder)` returns — to the holder only while every field of `match` is still the
 * holder's; true where it did. The caller holds the tree's lock, so no other caller removes or replaces it meanwhile.
 */
function updateHeld(file, match, fields) {
  const held = readJson(file);
  if (!held || !Object.entries(match).every(([k, v]) => held[k] === v)) return false;
  return updateReservation(file, typeof fields === 'function' ? fields(held) : fields);
}

const readReservation = (tree, env = process.env) => readJson(reservationFile(tree, env));

/** Gives the tree back where every field of `match` is the holder's; true where it did. */
function releaseTree(tree, match, env = process.env) {
  const file = reservationFile(tree, env);
  const held = readJson(file);
  if (!held || !Object.entries(match).every(([k, v]) => held[k] === v)) return false;
  try { fs.unlinkSync(file); return true; } catch { return false; }
}

// The campaign gear naming this role's author model, or null. Row 8 names no solo, so a solo's seat is never
// decided here.
function gearAuthor({ role, root, tree, slug, env }) {
  try {
    const gears = require('./gears');
    if (!gears.AUTHOR_ROLES.includes(role)) return null;
    const session = String(env.CLAUDE_CODE_SESSION_ID || '');
    const v = gears.valueOf({ setting: 8, role, root, tree, slug, session, env });
    return v.source === 'campaign' ? { gear: v.gear, model: v.value } : null;
  } catch {
    return null;
  }
}

/** The role's seat setting `{entry, effort, codexModel}`, or `{why}` where its entry reads as unset. */
function seatSettingOf(role, root, env = process.env) {
  const resolved = require('./model-presets').resolvePreset({ root, env });
  const setting = resolved.seats[role];
  if (setting) {
    const reason = setting.source ? `${setting.source}'s default seat` : "the repo's seat entry";
    return { setting, reason };
  }
  const ignored = (resolved.ignored || []).find((i) => i.key === role && i.why);
  if (resolved.preset === 'speed' && resolved.agents[role]?.model) return { why: "the repo's seat entry names a Claude model" };
  return { why: ignored ? ignored.why : `the ${role} has no Codex entry in .claude/nexus-agents.json` };
}

/**
 * The model and effort a role's Claude seat runs on without its Codex entry: the preset's row for the role, else
 * the agent file's own. Null for a value neither names.
 */
function claudeSeat(role, root, env = process.env) {
  const presets = require('./model-presets');
  let resolved = null;
  try { resolved = presets.resolvePreset({ root, env }); } catch { /* the agent file below */ }
  const preset = resolved?.preset;
  const entry = resolved?.agents[role];
  if (preset === 'speed' && typeof entry?.model === 'string' && entry.model) {
    return { model: entry.model, effort: entry.effort ?? null };
  }
  const row = preset ? presets.seatFor(preset, { role }) : null;
  if (row) return { model: row.model, effort: row.effort || null };
  const found = require('./plugin-root').findAgent(role, { plugin: 'nexus', root, env });
  let head = '';
  try { head = (/^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(found.file, 'utf8')) || [])[1] || ''; } catch { /* no agent file */ }
  const field = (name) => { const m = new RegExp(`^${name}:\\s*(\\S+)\\s*$`, 'm').exec(head); return m ? m[1] : null; };
  return { model: field('model'), effort: field('effort') };
}

/** `{codex: true, setting}`, or `{codex: false, reason, setting?, gear?}` for a writing start of this role's seat. */
function seatDecision({ role, root, tree, slug, spawned = false, env = process.env }) {
  const state = codexEntry.seatState(role);
  if (!state) return { codex: false, closed: true, reason: `"${role}" has no row in the seat table, so it has no Codex seat` };
  if (state.seat !== 'yes') {
    const on = state.platform ? ` on ${state.platform}` : '';
    const why = state.reason ? `: ${state.reason}` : '';
    return { codex: false, closed: true, reason: `the ${role}'s seat does not run on Codex — its row reads "${state.seat}"${on}${why}` };
  }
  const read = seatSettingOf(role, root, env);
  if (!read.setting) return { codex: false, reason: read.why };
  const setting = read.setting;
  if (spawned) {
    return { codex: false, setting, reason: `the coordinator says it is a spawned agent, so the ${role}'s Codex entry reads as unset` };
  }
  const gear = gearAuthor({ role, root, tree, slug, env });
  if (gear) {
    return { codex: false, setting, gear, reason: `the campaign gear ${gear.gear} names the ${role}'s author model (${gear.model}), above the seat's Codex entry` };
  }
  return { codex: true, setting, reason: read.reason };
}

/** `[{path, status}]` for every uncommitted file git shows in the tree, or null where git cannot answer. */
function gitChanged(tree) {
  const res = spawnSync('git', ['-C', tree, 'status', '--porcelain=v1', '-z', '--untracked-files=all'], {
    encoding: 'utf8', timeout: GIT_MS, windowsHide: true, maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error || res.status !== 0) return null;
  const parts = String(res.stdout).split('\0');
  const files = [];
  for (let i = 0; i < parts.length; i++) {
    const entry = parts[i];
    if (entry.length < 4) continue;
    const status = entry.slice(0, 2);
    files.push({ path: entry.slice(3), status });
    if (status[0] === 'R' || status[0] === 'C') i++;
  }
  return files;
}

module.exports = {
  UNIT_TEXT, isUnit, seatLabel, seatDir, treeKey, reservationFile, reserveTree, updateReservation, updateHeld, readReservation,
  releaseTree, seatSettingOf, seatDecision, claudeSeat, gitChanged,
};
