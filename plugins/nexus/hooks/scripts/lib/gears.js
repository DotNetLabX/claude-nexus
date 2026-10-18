'use strict';
/**
 * The gear state and its resolver — the one place a gear's settings are computed.
 *
 * A gear is a named set of answers to the pipeline's process questions (the settings table, shipped
 * as `gears-shipped.json` beside this file). The repo gear is the top-level `gear` key of the
 * committed `.claude/nexus-agents.json`; custom gears live under its `gears` key and are honoured
 * only when an installed plugin ships `gears/custom.js`, which validates and resolves them — the
 * core names no plugin that does. A name that resolves to nothing is no gear, and is reported.
 *
 * WHICH VALUE WINS, per setting: an explicit value passed in; inside a campaign,
 * the campaign gear; the repo's own committed setting for that role or job; the feature's or the
 * session's gear; the shipped default. A cell reading `as today` or `ask me` names no value, so the
 * repo rung below it still applies. The repo rung by row: row 3 takes `jobs.secondReader` as the
 * pair's second reader; row 6 `codex.effort`; rows 8 and 9 `{role}.model` / `{role}.effort` for the
 * four author roles. Row 5 has none: a per-agent checker `effort` does not count at the checker seats
 * today, and a gear must not make it count.
 *
 * WHICH GEAR. Before a plan, the gear in force: the campaign gear, then the session's switch
 * (`.claude/audit/gear-next/{session}`), then the repo gear. A campaign `off` is a gear, never a
 * fall-through. Once a plan starts the feature's gear is fixed, and the plan header's `**Gear:**`
 * line is its authority — committed, so a worktree carries it; a plan written with no such line keeps
 * no gear. A repeated `begin` of the same feature keeps its campaign gear and a fixed gear. Hooks read the session's active
 * context (`.claude/audit/gear-active/{session}`): written by `begin` (pending) and `fix` (fixed),
 * removed by `close`, replaced by the next `begin`, and ignored after seven days. No context, no
 * gear — which is what keeps the learner, solo and ad-hoc work out.
 *
 * TWO FOLDERS. `root` holds the state and the config that is read and written — the session's
 * project folder, the one the hooks resolve. `tree` is where a build's plan lives; a plan header is
 * looked up there first, then at the root.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { isSafeId } = require('./safe-id');

const SHIPPED = JSON.parse(fs.readFileSync(path.join(__dirname, 'gears-shipped.json'), 'utf8'));
const SHIPPED_NAMES = SHIPPED.gears;
const ROWS = SHIPPED.rows;
const ROW_COUNT = ROWS.length;
const ASKED_ROWS = new Set(ROWS.filter((r) => r.catalogue).map((r) => r.row));
const AUTHOR_ROLES = ['po', 'architect', 'developer', 'team-lead'];
const NO_VALUE = new Set(['as today', 'ask me']);
const EFFORT_LEVELS = { low: 'low', medium: 'medium', high: 'high', 'extra-high': 'xhigh' };
const CONTEXT_MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const HEADER_RE = /^\*\*Gear:\*\*\s+(.+?)\s+[—–-]\s+(campaign|switch|repo)\s*$/;
const SLUG_RE = /^[A-Za-z0-9._-]+$/;
const CONFIG_REL = path.join('.claude', 'nexus-agents.json');
const EXTENSION_REL = path.join('gears', 'custom.js');

class GearError extends Error {}
const refuse = (message) => { throw new GearError(message); };

function readConfig(root) {
  try { return JSON.parse(fs.readFileSync(path.join(root, CONFIG_REL), 'utf8')); } catch { return null; }
}
const objectOr = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

// ── custom gears: the installed extension ────────────────────────────────────
function versionKey(v) { return String(v || '0').split('.').map((p) => parseInt(p, 10) || 0); }
function newerFirst(a, b) {
  const x = versionKey(a.version);
  const y = versionKey(b.version);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (y[i] || 0) - (x[i] || 0);
    if (d) return d;
  }
  return 0;
}

/** The first installed plugin shipping `gears/custom.js` for this root, as its loaded module, or null. */
function findExtension(root, env = process.env) {
  const configDir = env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  let registry;
  try { registry = JSON.parse(fs.readFileSync(path.join(configDir, 'plugins', 'installed_plugins.json'), 'utf8')); } catch { return null; }
  const plugins = objectOr((registry && registry.plugins) || registry);
  const win = process.platform === 'win32';
  const norm = (p) => { const r = path.resolve(String(p || '')); return win ? r.toLowerCase() : r; };
  const here = norm(root);
  for (const key of Object.keys(plugins).sort()) {
    const entries = Array.isArray(plugins[key]) ? plugins[key].filter((e) => e && e.installPath) : [];
    const forHere = entries.filter((e) => e.projectPath && norm(e.projectPath) === here);
    const pool = (forHere.length ? forHere : entries.filter((e) => e.scope === 'user')).sort(newerFirst);
    if (!pool.length) continue;
    const file = path.join(pool[0].installPath, EXTENSION_REL);
    if (!fs.existsSync(file)) continue;
    try { return require(file); } catch { return null; }
  }
  return null;
}

// ── resolving a name ─────────────────────────────────────────────────────────
function shippedCells(name) {
  const cells = {};
  for (const r of ROWS) cells[r.row] = { ...r.values[name] };
  return cells;
}

/** `{gear, kind, base, cells}` for a name that resolves, else `{gear: null, missing, why}`. */
function resolveGear(name, o = {}) {
  const missing = (why) => ({ gear: null, missing: name, why });
  if (typeof name !== 'string' || !name.trim()) return missing('no name');
  if (SHIPPED_NAMES.includes(name)) return { gear: name, kind: 'shipped', base: null, cells: shippedCells(name) };
  const config = o.config === undefined ? readConfig(o.root) : o.config;
  const custom = objectOr(objectOr(config).gears);
  if (!Object.prototype.hasOwnProperty.call(custom, name)) return missing('no gear of that name');
  const ext = findExtension(o.root, o.env);
  if (!ext || typeof ext.resolve !== 'function') return missing('custom gears need an installed plugin that provides them');
  let resolved;
  try {
    if (typeof ext.validate === 'function') {
      const verdict = ext.validate({ name, gear: custom[name], gears: custom, shipped: SHIPPED });
      if (!verdict || !verdict.ok) return missing(((verdict && verdict.refusals) || ['refused by its plugin']).join('; '));
    }
    resolved = ext.resolve({ name, gears: custom, shipped: SHIPPED });
  } catch (e) {
    return missing(`its plugin failed: ${String((e && e.message) || e)}`);
  }
  if (!resolved || !SHIPPED_NAMES.includes(resolved.base)) return missing('its base is not a shipped gear or off');
  const cells = shippedCells(resolved.base);
  for (const [key, token] of Object.entries(objectOr(resolved.values))) {
    const row = ROWS.find((r) => String(r.row) === String(key));
    if (!row) return missing(`row ${key} is not a setting`);
    if (!row.allowed.includes(token)) return missing(`row ${row.row} cannot be "${token}"`);
    cells[row.row] = { value: token, text: token };
  }
  return { gear: name, kind: 'custom', base: resolved.base, cells };
}

function knownNames(o) {
  const custom = Object.keys(objectOr(objectOr(readConfig(o.root)).gears))
    .filter((n) => !SHIPPED_NAMES.includes(n) && resolveGear(n, o).gear);
  return [...SHIPPED_NAMES, ...custom];
}

function requireResolvable(name, o, what) {
  const r = resolveGear(name, o);
  if (!r.gear) refuse(`${what} "${name}" resolves to no gear (${r.why}) — name one of: ${knownNames(o).join(', ')}`);
  return r;
}

// ── state files ──────────────────────────────────────────────────────────────
const stateFile = (root, folder, session) => path.join(root, '.claude', 'audit', folder, session);

function requireSession(o) {
  if (!isSafeId(o.session)) refuse('no session id — pass --session, or run where CLAUDE_CODE_SESSION_ID is set');
  return o.session;
}

function writeState(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}

function readSwitch(root, session) {
  if (!isSafeId(session)) return null;
  try { return fs.readFileSync(stateFile(root, 'gear-next', session), 'utf8').trim() || null; } catch { return null; }
}

function clearState(file) { try { fs.unlinkSync(file); return true; } catch { return false; } }

function readActive(root, session, now = Date.now()) {
  if (!isSafeId(session)) return null;
  let ctx;
  try { ctx = JSON.parse(fs.readFileSync(stateFile(root, 'gear-active', session), 'utf8')); } catch { return null; }
  if (!ctx || typeof ctx.slug !== 'string') return null;
  const at = Date.parse(ctx.at);
  if (!Number.isFinite(at) || now - at > CONTEXT_MAX_AGE_MS) return null;
  return ctx;
}

function writeActive(o, ctx) {
  writeState(stateFile(o.root, 'gear-active', o.session), JSON.stringify({ ...ctx, at: new Date(o.now || Date.now()).toISOString() }));
}

// ── the plan header ──────────────────────────────────────────────────────────
function planFile(base, slug) {
  const direct = path.join(base, 'docs', 'specs', slug, 'delivery', 'plan.md');
  if (fs.existsSync(direct)) return direct;
  let dirs = [];
  try { dirs = fs.readdirSync(path.join(base, 'docs', 'specs'), { withFileTypes: true }).filter((d) => d.isDirectory()); } catch { return null; }
  for (const d of dirs) {
    const nested = path.join(base, 'docs', 'specs', d.name, slug, 'delivery', 'plan.md');
    if (fs.existsSync(nested)) return nested;
  }
  return null;
}

/** `{exists, gear, source}` from the slug's plan — the tree's copy first, then the root's. */
function planHeader(slug, o) {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) refuse(`"${slug}" is not a slug`);
  const bases = [o.tree, o.root].filter((b, i, all) => b && all.indexOf(b) === i);
  for (const base of bases) {
    const file = planFile(base, slug);
    if (!file) continue;
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith('## ')) break;
      const m = HEADER_RE.exec(line.trim());
      if (m) return { exists: true, gear: m[1], source: m[2] };
    }
    return { exists: true, gear: null, source: null };
  }
  return { exists: false, gear: null, source: null };
}

const headerLine = (gear, source) => (gear ? `**Gear:** ${gear} — ${source}` : null);

// ── which gear ───────────────────────────────────────────────────────────────
/** The gear in force before a plan: campaign → this session's switch → the repo gear → none. */
function gearInForce(o = {}) {
  const missing = [];
  if (typeof o.campaign === 'string' && o.campaign) {
    const r = resolveGear(o.campaign, o);
    return r.gear ? { gear: r.gear, source: 'campaign', missing } : { gear: null, source: null, missing: [o.campaign] };
  }
  const next = readSwitch(o.root, o.session);
  if (next) {
    if (resolveGear(next, o).gear) return { gear: next, source: 'switch', missing };
    missing.push(next);
  }
  const repo = objectOr(readConfig(o.root)).gear;
  if (typeof repo === 'string' && repo) {
    if (resolveGear(repo, o).gear) return { gear: repo, source: 'repo', missing };
    missing.push(repo);
  }
  return { gear: null, source: null, missing };
}

/** The gear a setting is read at: the slug's own, or the session's active context. */
function featureGear(o = {}) {
  const ctx = readActive(o.root, o.session, o.now);
  if (o.slug !== undefined && o.slug !== null) {
    const header = planHeader(o.slug, o);
    if (header.gear) return { gear: header.gear, source: header.source, state: 'fixed', missing: [] };
    if (ctx && ctx.slug === o.slug && ctx.state === 'fixed') return { gear: ctx.gear || null, source: ctx.source || null, state: 'fixed', missing: [] };
    if (header.exists) return { gear: null, source: null, state: 'fixed', missing: [] };
    const pending = gearInForce({ ...o, campaign: ctx && ctx.slug === o.slug ? ctx.campaign : undefined });
    return { ...pending, state: 'pending' };
  }
  if (!ctx) return { gear: null, source: null, state: 'none', missing: [] };
  if (ctx.state === 'fixed') return { gear: ctx.gear || null, source: ctx.source || null, state: 'fixed', missing: [], slug: ctx.slug };
  return { ...gearInForce({ ...o, campaign: ctx.campaign }), state: 'pending', slug: ctx.slug };
}

// ── a setting's value ────────────────────────────────────────────────────────
const family = (model) => String(model || '').trim().toLowerCase();
const titled = (model) => family(model).replace(/^./, (c) => c.toUpperCase());

/** The repo's own committed setting for a row, or null when it sets none that applies. */
function repoSetting(row, cell, o, config) {
  if (row === 3) {
    const second = objectOr(config.jobs).secondReader;
    const parts = cell ? cell.value.split(' + ') : [];
    if (typeof second !== 'string' || !second.trim() || parts.length < 2) return null;
    if (family(second) === family(parts[0])) return null;
    if (family(second) === 'fable' && o.unattended) return null;
    parts[1] = titled(second);
    return parts.filter((p, i) => parts.findIndex((q) => family(q) === family(p)) === i).join(' + ');
  }
  if (row === 6) {
    const effort = objectOr(config.codex).effort;
    return typeof effort === 'string' && effort ? effort : null;
  }
  if (row === 8 || row === 9) {
    const v = objectOr(config[o.role])[row === 8 ? 'model' : 'effort'];
    return typeof v === 'string' && v ? v : null;
  }
  return null;
}

function defaultValue(row) {
  if (ASKED_ROWS.has(row)) return 'asked';
  return row === 10 ? 'runs' : 'as today';
}

function cellAnswer(row, cell) {
  if (cell.value === 'ask me') return ASKED_ROWS.has(row) ? 'asked' : 'as today';
  return cell.value;
}

/**
 * `{setting, value, source, gear, gearSource, state, text?}` — the value of one row, `source` naming
 * the rung it came from (`explicit | campaign | repo | gear | default`).
 */
function valueOf(o) {
  const row = Number(o.setting);
  if (!Number.isInteger(row) || row < 1 || row > ROW_COUNT) refuse(`--setting must be a row number from 1 to ${ROW_COUNT}`);
  if ((row === 8 || row === 9) && !AUTHOR_ROLES.includes(o.role)) {
    refuse(`--setting ${row} needs --role, one of: ${AUTHOR_ROLES.join(', ')}`);
  }
  const fg = featureGear(o);
  const g = fg.gear ? resolveGear(fg.gear, o) : null;
  const cell = g && g.gear ? g.cells[row] : null;
  const base = { setting: row, gear: g && g.gear ? g.gear : null, gearSource: g && g.gear ? fg.source : null, state: fg.state };
  if (fg.missing && fg.missing.length) base.missing = fg.missing;
  if (o.explicit !== undefined && o.explicit !== null && o.explicit !== true) return { ...base, value: String(o.explicit), source: 'explicit' };
  const names = cell && !NO_VALUE.has(cell.value);
  if (names && fg.source === 'campaign') return { ...base, value: cell.value, source: 'campaign', text: cell.text };
  const repo = repoSetting(row, names ? cell : null, o, objectOr(readConfig(o.root)));
  if (repo !== null) return { ...base, value: repo, source: 'repo' };
  if (cell) return { ...base, value: cellAnswer(row, cell), source: 'gear', text: cell.text };
  return { ...base, value: defaultValue(row), source: 'default' };
}

// ── the commands' state changes ──────────────────────────────────────────────
// A plan already written with no header started before gears: it keeps no gear for good.
function begin(o) {
  requireSession(o);
  const header = planHeader(o.slug, o);
  if (typeof o.campaign === 'string' && o.campaign) requireResolvable(o.campaign, o, 'the campaign gear');
  if (header.exists) {
    const ctx = { slug: o.slug, gear: header.gear, source: header.source, state: 'fixed' };
    writeActive(o, ctx);
    return { ...ctx, missing: [] };
  }
  const was = readActive(o.root, o.session, o.now);
  const same = was && was.slug === o.slug ? was : null;
  if (same && same.state === 'fixed') {
    writeActive(o, same);
    return { ...same, missing: [] };
  }
  const campaign = typeof o.campaign === 'string' && o.campaign ? o.campaign : same && same.campaign;
  const gif = gearInForce({ ...o, campaign });
  const ctx = { slug: o.slug, gear: gif.gear, source: gif.source, state: 'pending' };
  if (campaign) ctx.campaign = campaign;
  writeActive(o, ctx);
  return { ...ctx, missing: gif.missing };
}

function fix(o) {
  const header = planHeader(o.slug, o);
  const hasSession = isSafeId(o.session);
  if (header.exists) {
    if (hasSession) writeActive(o, { slug: o.slug, gear: header.gear, source: header.source, state: 'fixed' });
    return { slug: o.slug, gear: header.gear, source: header.source, state: 'fixed', header: headerLine(header.gear, header.source), written: false };
  }
  const ctx = hasSession ? readActive(o.root, o.session, o.now) : null;
  const campaign = ctx && ctx.slug === o.slug ? ctx.campaign : undefined;
  const gif = gearInForce({ ...o, campaign, session: hasSession ? o.session : undefined });
  if (hasSession) {
    writeActive(o, { slug: o.slug, gear: gif.gear, source: gif.source, state: 'fixed', ...(campaign ? { campaign } : {}) });
    if (gif.source === 'switch') clearState(stateFile(o.root, 'gear-next', o.session));
  }
  const out = { slug: o.slug, gear: gif.gear, source: gif.source, state: 'fixed', header: headerLine(gif.gear, gif.source), missing: gif.missing };
  if (!hasSession) out.note = 'no session id, so no context was recorded';
  return out;
}

function close(o) {
  const ctx = readActiveRaw(o);
  if (!ctx || ctx.slug !== o.slug) return { slug: o.slug, closed: false };
  return { slug: o.slug, closed: clearState(stateFile(o.root, 'gear-active', o.session)) };
}

function readActiveRaw(o) {
  if (!isSafeId(o.session)) return null;
  try { return JSON.parse(fs.readFileSync(stateFile(o.root, 'gear-active', o.session), 'utf8')); } catch { return null; }
}

function next(o) {
  requireSession(o);
  requireResolvable(o.name, o, 'the gear');
  writeState(stateFile(o.root, 'gear-next', o.session), o.name);
  return { next: o.name, session: o.session };
}

function setRepoGear(o) {
  requireResolvable(o.name, o, 'the gear');
  const file = path.join(o.root, CONFIG_REL);
  let text = '{}\n';
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { if (!e || e.code !== 'ENOENT') refuse(`${file} cannot be read: ${e.message}`); }
  try { JSON.parse(text); } catch (e) { refuse(`${file} does not parse (${e.message}) — repair it, then set the gear again`); }
  const out = setTopLevelKey(text, 'gear', o.name);
  if (out === null) refuse(`${file} is not a JSON object — repair it, then set the gear again`);
  atomicWrite(file, out);
  return { gear: o.name, path: file };
}

function atomicWrite(target, text) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.tmp`);
  try {
    fs.writeFileSync(tmp, text, 'utf8');
    fs.renameSync(tmp, target);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch { /* best effort */ }
    throw e;
  }
}

// ── the gear command's table ─────────────────────────────────────────────────
function show(o) {
  const config = objectOr(readConfig(o.root));
  const names = knownNames(o);
  const resolved = names.map((n) => resolveGear(n, o));
  const repo = typeof config.gear === 'string' && config.gear ? config.gear : null;
  const repoState = !repo ? 'unset' : resolveGear(repo, o).gear ? 'set' : 'missing';
  const roles = AUTHOR_ROLES.map((role) => ({ role, ...objectOr(config[role]) }))
    .filter((r) => typeof r.model === 'string' || typeof r.effort === 'string')
    .map(({ role, model, effort }) => ({ role, ...(typeof model === 'string' ? { model } : {}), ...(typeof effort === 'string' ? { effort } : {}) }));
  const rows = ROWS.map((r) => {
    const values = {};
    for (const g of resolved) values[g.gear] = g.cells[r.row];
    const entry = { row: r.row, setting: r.setting, values };
    if (r.row === 3 && typeof objectOr(config.jobs).secondReader === 'string') entry.overridden = { source: 'repo', value: `second reader ${config.jobs.secondReader}` };
    if (r.row === 6 && typeof objectOr(config.codex).effort === 'string') entry.overridden = { source: 'repo', value: config.codex.effort };
    if ((r.row === 8 || r.row === 9) && roles.some((x) => (r.row === 8 ? x.model : x.effort))) {
      entry.overridden = { source: 'repo', value: roles.filter((x) => (r.row === 8 ? x.model : x.effort)).map((x) => `${x.role} ${r.row === 8 ? x.model : x.effort}`).join(', ') };
    }
    if (r.row === 10 && typeof objectOr(config.jobs).doneCheck === 'string') entry.repo = `done check runs — on ${config.jobs.doneCheck} (repo)`;
    return entry;
  });
  const ctx = readActive(o.root, o.session, o.now);
  return {
    gears: resolved.map((g) => ({ name: g.gear, kind: g.kind, ...(g.base ? { base: g.base } : {}) })),
    repoGear: { name: repo, state: repoState },
    pendingSwitch: readSwitch(o.root, o.session),
    active: ctx,
    rows,
    note: 'rows 8 and 9 reach spawned authors only; a main-session persona runs on the session model',
    path: path.join(o.root, CONFIG_REL),
  };
}

// ── the preserving writer ────────────────────────────────────────────────────
// A position-tracking scan of the top-level object, run only on text that already parsed: a regex
// would find a nested key of the same name first.
function topLevelMembers(text) {
  let i = 0;
  const n = text.length;
  const members = [];
  const ws = () => { while (i < n && /\s/.test(text[i])) i++; };
  const str = () => {
    const start = i++;
    while (i < n) {
      if (text[i] === '\\') { i += 2; continue; }
      if (text[i] === '"') { i++; return text.slice(start, i); }
      i++;
    }
    return null;
  };
  const value = () => {
    ws();
    const c = text[i];
    if (c === '"') return str() !== null;
    if (c === '{' || c === '[') {
      const closer = c === '{' ? '}' : ']';
      let depth = 0;
      while (i < n) {
        const ch = text[i];
        if (ch === '"') { if (str() === null) return false; continue; }
        if (ch === c) depth++;
        else if (ch === closer) { depth--; i++; if (depth === 0) return true; continue; }
        i++;
      }
      return false;
    }
    const start = i;
    while (i < n && !/[\s,}\]]/.test(text[i])) i++;
    return i > start;
  };
  ws();
  if (text[i] !== '{') return null;
  i++;
  ws();
  if (text[i] === '}') return members;
  while (i < n) {
    ws();
    if (text[i] !== '"') return null;
    const keyStart = i;
    const rawKey = str();
    if (rawKey === null) return null;
    ws();
    if (text[i] !== ':') return null;
    const colonIdx = i++;
    ws();
    const valueStart = i;
    if (!value()) return null;
    members.push({ key: JSON.parse(rawKey), keyStart, colonIdx, valueStart, valueEnd: i });
    ws();
    if (text[i] === ',') { i++; continue; }
    return members;
  }
  return members;
}

/**
 * The text with one top-level key set to `value`, every other byte kept: an existing key's value is
 * replaced in place (its last occurrence, the one JSON.parse reads); a new key is inserted first.
 * An object or array value is laid out at the file's own indentation. Null when the text is not a
 * JSON object.
 */
function setTopLevelKey(text, key, value) {
  const members = topLevelMembers(text);
  if (!members) return null;
  const nl = /\r\n/.test(text) ? '\r\n' : '\n';
  let indent = '  ';
  let multiline = true;
  if (members.length) {
    const lineStart = text.lastIndexOf('\n', members[0].keyStart) + 1;
    const lead = text.slice(lineStart, members[0].keyStart);
    if (/^[ \t]*$/.test(lead) && text.slice(0, lineStart).includes('{')) indent = lead;
    else multiline = false;
  }
  const serialized = typeof value === 'object' && value !== null && multiline
    ? JSON.stringify(value, null, indent).split('\n').join(nl + indent)
    : JSON.stringify(value);
  const existing = members.filter((m) => m.key === key).pop();
  if (existing) return text.slice(0, existing.valueStart) + serialized + text.slice(existing.valueEnd);
  const open = text.indexOf('{');
  let j = open + 1;
  while (j < text.length && /\s/.test(text[j])) j++;
  const spaced = members.length === 0 || text[members[0].colonIdx + 1] === ' ';
  const member = `${JSON.stringify(key)}:${spaced ? ' ' : ''}${serialized}`;
  if (members.length === 0) return text.slice(0, open + 1) + nl + indent + member + nl + text.slice(j);
  return text.slice(0, open + 1) + text.slice(open + 1, j) + member + ',' + text.slice(open + 1);
}

module.exports = {
  SHIPPED, SHIPPED_NAMES, ROWS, AUTHOR_ROLES, EFFORT_LEVELS, CONTEXT_MAX_AGE_MS, GearError,
  readConfig, findExtension, resolveGear, gearInForce, featureGear, planHeader, valueOf,
  readSwitch, readActive, begin, fix, close, next, setRepoGear, show, setTopLevelKey,
};
