'use strict';
/**
 * The model presets: which model and effort every agent and job a session starts runs on.
 *
 * ONE HOME. `model-presets.json` beside this file holds every model choice the core makes; every hook and
 * script reads it through this module, and `rules/on-demand/pipeline-guardrails.md` § Model presets shows it
 * to readers, held equal by a test. A model family name written anywhere else in the core's shipped text or
 * code fails the name lint.
 *
 * THE PRESET IN FORCE is the repo's `modelPreset` (`.claude/nexus-agents.json`), else the profile's
 * (`{CLAUDE_CONFIG_DIR, else ~/.claude}/nexus/profile.json`), else unset, which runs `standard`. A repo
 * may always lower to `standard`; a repo value that would spend a family only a consenting preset uses —
 * a `modelPreset`, a `jobs` entry or a per-agent `model` — applies only where the profile's own preset uses
 * that family, because a committed setting is no consent of another account. Each ignored value is reported.
 *
 * LOCKED WRITES. Every script writer of the profile file and of `.claude/nexus-agents.json` goes through
 * `writeProfile` or `updateRepoConfig`: a lock file beside the target, a re-read, only the change applied,
 * a temp file renamed into place. A lock older than STALE_MS is taken over (its writer died); a lock held
 * past WAIT_MS refuses the write rather than waiting on.
 *
 * FAIL SOFT ON READ. A missing, unreadable or malformed profile or repo file, or an unknown preset name,
 * reads as unset.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const TABLE = JSON.parse(fs.readFileSync(path.join(__dirname, 'model-presets.json'), 'utf8'));
const DEFAULT_PRESET = 'standard';
const AS_TODAY = 'as today';
const SENTINELS = new Set(['as today', 'ask me']);
const HELPER_JOBS = ['discovery', 'audit', 'general'];
const REPO_JOBS = ['secondReader', 'discovery', 'audit', 'general', 'doneCheck'];
const CONFIG_REL = path.join('.claude', 'nexus-agents.json');
const PROFILE_REL = path.join('nexus', 'profile.json');
const NEXUS_PREFIX_RE = /^nexus(?:-[a-z0-9-]+)?:/;
const STALE_MS = 10_000;
const WAIT_MS = 8_000;
const POLL_MS = 25;

const presetOf = (name) => TABLE.presets[name] || TABLE.presets[DEFAULT_PRESET];
const objectOr = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

function table() { return TABLE; }
function families() { return TABLE.families.map((f) => ({ ...f })); }
function presetNames() { return Object.keys(TABLE.presets); }

let familyRe = null;
/** The pattern of a family named as a whole word, built from the table's families. */
function familyPattern() {
  if (!familyRe) familyRe = new RegExp(`\\b(${TABLE.families.map((f) => f.name).join('|')})\\b`);
  return familyRe;
}

/** The family a model value names as a whole word — a full model id, or an alias with a suffix — else null. */
function familyOf(value) {
  if (typeof value !== 'string') return null;
  const m = value.trim().toLowerCase().match(familyPattern());
  return m ? m[1] : null;
}

/** A preset name as written, or null where it is not one the table knows. */
function presetName(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  return Object.hasOwn(TABLE.presets, v) ? v : null;
}

const display = (family) => family.charAt(0).toUpperCase() + family.slice(1);

function pairsFor(preset) { return presetOf(preset).pairs.map((p) => [...p]); }

/** The preset's Claude family a pair lacks, or null where none is left. Codex is never added. */
function thirdReaderFor(preset, pair) {
  const have = new Set(pair.map((r) => String(r).toLowerCase()));
  return presetOf(preset).claudeFamilies.find((f) => !have.has(f)) || null;
}

/**
 * A row-3 reader token read under a preset: each family the preset does not use is substituted in place;
 * a reader that would repeat a family takes the preset's Claude family the pair still lacks, and is dropped
 * where none is left. The sentinels, and text that is no pair, pass through unchanged.
 */
function pairToken(preset, token) {
  if (typeof token !== 'string' || SENTINELS.has(token.trim())) return token;
  const readers = token.split('+').map((r) => r.trim().toLowerCase());
  if (readers.some((r) => !r)) return token;
  const sub = presetOf(preset).substitute;
  const out = [];
  for (const r of readers) {
    const want = Object.hasOwn(sub, r) ? sub[r] : r;
    if (!out.includes(want)) { out.push(want); continue; }
    const lacking = presetOf(preset).claudeFamilies.find((f) => !out.includes(f));
    if (lacking) out.push(lacking);
  }
  return out.map(display).join(' + ');
}

const seatValue = (v) => (v && typeof v === 'object' && typeof v.model === 'string' && v.model !== AS_TODAY ? { model: v.model, effort: v.effort ?? null } : null);

/** The table's role for an agent type: a core agent's name, a helper type, another nexus plugin's agent. */
function roleOf(preset, agentType) {
  if (typeof agentType !== 'string' || !agentType) return null;
  const p = presetOf(preset);
  const bare = agentType.startsWith('nexus:') ? agentType.slice('nexus:'.length) : agentType;
  if (Object.hasOwn(p.authors, bare)) return { kind: 'authors', key: bare };
  if (Object.hasOwn(p.readers, bare)) return { kind: 'readers', key: bare };
  if (Object.hasOwn(p.types, agentType)) return { kind: 'types', key: agentType };
  if (NEXUS_PREFIX_RE.test(agentType)) return { kind: 'otherAgents' };
  return null;
}

/**
 * The model and effort a seat runs on under a preset, or null where today's rule decides (the agent file,
 * the spawn, the architect's resolved model for the done check). `job` names a helper job, `secondReader`
 * (with `primary`, the main reader's model) or `doneCheck`; else `role` or `seat`, else `agentType`.
 */
function seatFor(preset, { agentType, role, seat, job, primary } = {}) {
  const p = presetOf(preset);
  if (job) {
    if (job === 'secondReader') {
      const model = p.secondReader.besidePrimary[familyOf(primary) || String(primary || '').toLowerCase()] || p.secondReader.default;
      return { model, effort: effortFor(preset, model, { seat: true }) };
    }
    if (HELPER_JOBS.includes(job) || job === 'doneCheck') return seatValue(p.jobs[job]);
    return null;
  }
  const named = role || seat;
  const r = named ? roleOf(preset, named) : roleOf(preset, agentType);
  if (!r) return null;
  return seatValue(r.kind === 'otherAgents' ? p.otherAgents : p[r.kind][r.key]);
}

/** The Claude fallback a helper job on Codex falls back to. */
function codexFallbackFor(preset, job) {
  const j = presetOf(preset).jobs[job];
  return j && j.codexFallback ? { ...j.codexFallback } : null;
}

/** The effort for a model family under a preset; Standard's applies at the reader seats only. */
function effortFor(preset, family, { seat = false } = {}) {
  const e = presetOf(preset).effort;
  if (e.scope === 'reader seats' && !seat) return null;
  return Object.hasOwn(e.byFamily, family) ? e.byFamily[family] : null;
}

/** How the presets know an agent type — `authors`, `readers`, `types` or `otherAgents` — or null for a type they do not cover. */
function agentRole(agentType) {
  const r = roleOf(DEFAULT_PRESET, agentType);
  return r ? r.kind : null;
}

/** The family whose reader-seat effort a gear's reader-effort setting replaces under a preset, or null. */
function gearEffortFamily(preset) { return presetOf(preset).gearEffortFamily || null; }

function neverSuggested(preset) { return [...presetOf(preset).neverSuggested]; }
/** The author whose row answers a caller that names no role: the planners' row. */
const NO_ROLE_AUTHOR = 'architect';

/**
 * The model and effort an author role runs on under a gear's `preset` token (rows 8 and 9): the role's own
 * row, else the preset's top-level `authorModel` for an `as today` row, else null. A role that is no author
 * is null. With no role it answers for the planners, never null: a campaign plugin published apart from
 * this core may still call it so and read the one model off the answer.
 */
function authorModel(preset, role) {
  const p = presetOf(preset);
  const r = role === undefined || role === null ? NO_ROLE_AUTHOR : role;
  if (!Object.hasOwn(p.authors, r)) return null;
  const own = seatValue(p.authors[r]);
  if (own) return own;
  return p.authorModel ? { ...p.authorModel } : null;
}

/** The family a code review's first reader takes where the preset's reader family is refused and Codex is absent, or null. */
function refusedReaderFor(preset) { return presetOf(preset).refusedReader || null; }
function consentPresets() { return presetNames().filter((n) => presetOf(n).claudeFamilies.some((f) => !presetOf(DEFAULT_PRESET).claudeFamilies.includes(f))); }

function frontmatterModel(file) {
  try {
    const m = fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fm = m ? m[1].match(/^model:\s*(\S+)\s*$/m) : null;
    return fm ? fm[1] : null;
  } catch { return null; }
}

/**
 * The default preset's model a refused start is retried on, named outright: a helper type's from the table,
 * a nexus agent's from its agent file. Null for any other type.
 */
function standardModelFor(agentType, { root = null, env = process.env } = {}) {
  if (typeof agentType !== 'string' || !agentType) return null;
  if (Object.hasOwn(TABLE.standardRetry, agentType)) return TABLE.standardRetry[agentType];
  const colon = agentType.indexOf(':');
  const plugin = colon >= 0 ? agentType.slice(0, colon) : 'nexus';
  const agent = colon >= 0 ? agentType.slice(colon + 1) : agentType;
  if (!/^nexus(?:-[a-z0-9-]+)?$/.test(plugin) || !agent) return null;
  const { findAgent } = require('./plugin-root');
  const found = findAgent(agent, { plugin, root, env });
  return found ? frontmatterModel(found.file) : null;
}

// ── plain words ──────────────────────────────────────────────────────────────
const listText = (items) => (items.length ? items.map(display).join(', ') : 'none');
function seatText(value, asToday) {
  const seat = seatValue(value);
  if (!seat) return asToday;
  return seat.effort ? `${display(seat.model)} at ${seat.effort}` : display(seat.model);
}

const GEAR_AUTHORS = ['po', 'architect', 'developer', 'team-lead'];
const ROLE_WORDS = { po: 'PO', 'team-lead': 'team lead' };
const roleWords = (role) => ROLE_WORDS[role] || role;
const andList = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

/** One text per distinct value, each naming the roles that share it, in first-seen order; one shared value stands alone. */
function perRoleText(roles, textOf) {
  const groups = new Map();
  for (const role of roles) {
    const text = textOf(role);
    if (!groups.has(text)) groups.set(text, []);
    groups.get(text).push(roleWords(role));
  }
  if (groups.size === 1) return [...groups.keys()][0];
  return [...groups].map(([text, names]) => `${text} for ${andList(names)}`).join('; ');
}

const AUTHOR_LABELS = { architect: 'Architect', po: 'PO', developer: 'Developer', solo: 'Solo', 'team-lead': 'Team lead', learner: 'Learner' };
const seatRow = (setting, value, row) => ({ setting, value, need: row.need, why: row.why });

/**
 * What a preset runs, one row per setting, in plain words built from the table: `{ setting, value }`, and
 * on a seat's row its `need` (1–10, how much a better model changes the result) and `why`. The command's
 * `show` prints these rows, and the rule section's table holds the same rows for both presets.
 */
function describeRows(preset) {
  const p = presetOf(preset);
  const effortList = Object.entries(p.effort.byFamily).map(([f, e]) => `${display(f)} ${e}`).join(', ');
  const late = p.fallback.late;
  const never = late.neverSpend.length ? ` or ${listText(late.neverSpend)}` : '';
  const neverFresh = late.neverSpend.length ? `, never ${listText(late.neverSpend)}` : '';
  const authorGear = perRoleText(GEAR_AUTHORS, (role) => {
    const a = authorModel(preset, role);
    return a ? `${display(a.model)}, ${a.effort}` : "the agent file's model and effort";
  });
  const refused = refusedReaderFor(preset);
  return [
    ...Object.entries(p.authors).map(([role, row]) => seatRow(AUTHOR_LABELS[role] || role, seatText(row, "the agent file's model and effort"), row)),
    ...Object.entries(p.readers).map(([role, row]) => seatRow(`${display(role)}, where the spawn names no model`, seatText(row, "the agent file's model"), row)),
    seatRow('Second reader', `${display(p.secondReader.default)}, or ${Object.entries(p.secondReader.besidePrimary).map(([k, v]) => `${display(v)} beside a ${display(k)} primary`).join(', ')}`, p.secondReader),
    { setting: 'Refused-start reader: a code review\'s first reader when its reader family is refused and Codex is absent', value: refused ? display(refused) : 'none' },
    ...HELPER_JOBS.map((j) => seatRow(`Helper job ${j}`, seatText(p.jobs[j], 'today'), p.jobs[j])),
    { setting: 'Claude fallback of a helper job on Codex', value: HELPER_JOBS.map((j) => `${j} ${seatText(p.jobs[j].codexFallback, 'today')}`).join('; ') },
    ...Object.entries(p.types).map(([type, row]) => seatRow(`Helper type ${type}`, seatText(row, "Claude Code's own default"), row)),
    { setting: "Other nexus plugins' agents", value: seatText(p.otherAgents, "the agent file's model and effort") },
    seatRow('Done check', seatText(p.jobs.doneCheck, "the architect's resolved model"), p.jobs.doneCheck),
    { setting: 'Effort by model', value: `${effortList} (${p.effort.scope})` },
    { setting: 'Lowest effort on the light lane', value: p.lightLaneFloor },
    { setting: 'Reader pairs, in order', value: p.pairs.map((pair) => pair.map(display).join(' + ')).join('; ') },
    { setting: 'Third reader under a gear that adds one', value: `the family the pair lacks among ${listText(p.claudeFamilies)}; none where none is left` },
    { setting: 'Gear reader tokens', value: `${Object.entries(p.substitute).map(([from, to]) => `${display(from)} reads as ${display(to)}`).join(', ')}; a repeat takes the family the pair lacks, or is dropped` },
    { setting: 'After an early Codex drop', value: `the next eligible pair from pair ${p.fallback.early.freshFrom} on` },
    { setting: 'After a late Codex drop', value: `the second reader is promoted unless it is the author's family${never}; else a fresh main from pair ${late.freshFrom} on${neverFresh}` },
    { setting: 'Author model and effort under a gear (rows 8 and 9)', value: authorGear },
    { setting: 'Never suggested by the config advisor', value: listText(p.neverSuggested) },
  ];
}

// ── the profile and the repo ─────────────────────────────────────────────────
function profileDir(env = process.env) {
  return (env && env.CLAUDE_CONFIG_DIR) || path.join(os.homedir(), '.claude');
}
const profileFile = (env) => path.join(profileDir(env), PROFILE_REL);

function readJsonObject(file) {
  try { return objectOr(JSON.parse(fs.readFileSync(file, 'utf8'))) || {}; } catch { return {}; }
}

function readProfile(env = process.env) { return readJsonObject(profileFile(env)); }

/**
 * The preset in force, its source, the repo values the consent guard ignored, and the guarded repo jobs and
 * agents. `config`, where given, is the repo's config already read (a campaign's, as committed at its pin).
 */
function resolvePreset({ root, env = process.env, config: given } = {}) {
  const profilePreset = presetName(readProfile(env).modelPreset);
  const config = given !== undefined ? objectOr(given) || {} : root ? readJsonObject(path.join(root, CONFIG_REL)) : {};
  const repoPreset = presetName(config.modelPreset);
  const consent = consentPresets();
  const ignored = [];
  let preset;
  let source;
  if (repoPreset && (!consent.includes(repoPreset) || repoPreset === profilePreset)) {
    preset = repoPreset; source = 'repo';
  } else {
    if (repoPreset) ignored.push({ key: 'modelPreset', value: config.modelPreset });
    preset = profilePreset || DEFAULT_PRESET;
    source = profilePreset ? 'profile' : 'unset';
  }
  const allowed = new Set(presetOf(profilePreset || DEFAULT_PRESET).claudeFamilies.concat(presetOf(DEFAULT_PRESET).claudeFamilies));
  const guarded = (family) => family !== null && !allowed.has(family) && TABLE.families.some((f) => f.name === family)
    && consent.some((n) => presetOf(n).claudeFamilies.includes(family));
  const jobs = {};
  for (const [job, value] of Object.entries(objectOr(config.jobs) || {})) {
    const model = typeof value === 'string' ? value : objectOr(value) && value.model;
    if (REPO_JOBS.includes(job) && guarded(familyOf(model))) { ignored.push({ key: `jobs.${job}`, value: model }); continue; }
    jobs[job] = value;
  }
  const agents = {};
  const roles = Object.keys(presetOf(DEFAULT_PRESET).authors).concat(Object.keys(presetOf(DEFAULT_PRESET).readers));
  for (const [role, value] of Object.entries(config)) {
    if (!roles.includes(role) || !objectOr(value)) continue;
    const entry = { ...value };
    if (guarded(familyOf(entry.model))) { ignored.push({ key: `${role}.model`, value: entry.model }); delete entry.model; }
    agents[role] = entry;
  }
  return { preset, source, ignored, profilePreset, jobs, agents };
}

// ── locked writes ────────────────────────────────────────────────────────────
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Two waiters can read the same stale age: only one rename of the lock succeeds, and a lock that another
// writer made fresh in between is linked back in place, never over a lock that stands.
function takeOver(lock) {
  const claimed = `${lock}.${process.pid}.${Date.now()}`;
  try { fs.renameSync(lock, claimed); } catch { return; }
  let fresh = false;
  try { fresh = Date.now() - fs.statSync(claimed).mtimeMs <= STALE_MS; } catch { /* already gone */ }
  if (fresh) { try { fs.linkSync(claimed, lock); } catch { /* a newer lock stands */ } }
  try { fs.unlinkSync(claimed); } catch { /* already gone */ }
}

function withLock(target, fn) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const lock = `${target}.lock`;
  const start = Date.now();
  for (;;) {
    try {
      fs.closeSync(fs.openSync(lock, 'wx'));
      break;
    } catch (e) {
      if (!e || e.code !== 'EEXIST') throw e;
      let age = 0;
      try { age = Date.now() - fs.statSync(lock).mtimeMs; } catch { continue; }
      if (age > STALE_MS) { takeOver(lock); continue; }
      if (Date.now() - start > WAIT_MS) throw new Error(`${lock} is held by another writer — try again in a moment`);
      sleep(POLL_MS);
    }
  }
  try { return fn(); } finally { try { fs.unlinkSync(lock); } catch { /* already gone */ } }
}

function atomicWrite(target, text) {
  const tmp = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.tmp`);
  try {
    fs.writeFileSync(tmp, text, 'utf8');
    fs.renameSync(tmp, target);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch { /* never mask the real error */ }
    throw e;
  }
}

function readTextOrNull(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (e) { if (e && e.code === 'ENOENT') return null; throw e; }
}

/** Merge `patch` into the profile file under its lock; a null or undefined value removes its key. */
function writeProfile(patch, env = process.env) {
  const file = profileFile(env);
  return withLock(file, () => {
    const text = readTextOrNull(file);
    let current = {};
    if (text !== null) {
      try { current = JSON.parse(text); } catch (e) { throw new Error(`${file} does not parse (${e.message}) — repair or delete it, then run this again`); }
      if (!objectOr(current)) throw new Error(`${file} is not a JSON object — repair or delete it, then run this again`);
    }
    const next = { ...current };
    for (const [k, v] of Object.entries(patch || {})) { if (v === null || v === undefined) delete next[k]; else next[k] = v; }
    atomicWrite(file, JSON.stringify(next, null, 2) + '\n');
    return { path: file, profile: next };
  });
}

/**
 * Change `.claude/nexus-agents.json` under its lock: `mutate` gets the file's current text (null where the
 * file is absent) and returns the new text; nothing is written where it returns null or the same text.
 */
function updateRepoConfig(root, mutate) {
  const file = path.join(root, CONFIG_REL);
  return withLock(file, () => {
    const text = readTextOrNull(file);
    const out = mutate(text);
    if (out === null || out === undefined || out === text) return { path: file, written: false };
    atomicWrite(file, out);
    return { path: file, written: true };
  });
}

/** Set one top-level key of `.claude/nexus-agents.json`, every other byte kept. */
function setRepoKey(root, key, value) {
  return updateRepoConfig(root, (text) => {
    const base = text === null ? '{}\n' : text;
    try { JSON.parse(base); } catch (e) { throw new Error(`${path.join(root, CONFIG_REL)} does not parse (${e.message}) — repair it, then run this again`); }
    const out = require('./gears').setTopLevelKey(base, key, value);
    if (out === null) throw new Error(`${path.join(root, CONFIG_REL)} is not a JSON object — repair it, then run this again`);
    return out;
  });
}

module.exports = {
  AS_TODAY, table, families, familyPattern, familyOf, presetNames, presetName, pairsFor, thirdReaderFor, pairToken,
  seatFor, codexFallbackFor, effortFor, agentRole, gearEffortFamily, neverSuggested, authorModel, refusedReaderFor, standardModelFor,
  describeRows, perRoleText, GEAR_AUTHORS, NO_ROLE_AUTHOR,
  profileDir, profileFile, readProfile, writeProfile, resolvePreset, updateRepoConfig, setRepoKey,
};
