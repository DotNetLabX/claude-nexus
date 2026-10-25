'use strict';
/**
 * Close the Codex background servers the Codex plugin has forgotten, and only those no Codex job could
 * be using.
 *
 * The Codex plugin keeps one recorded server per workspace (`state/{slug}-{hash}/broker.json` under its
 * data folder). When its connect check on that server fails it records a new one and drops the old
 * one from its record without ending it, deleting the old server's pid file; nothing ever ends that
 * server. A server is FORGOTTEN here when its command line names a `--pid-file` that does not exist
 * and no record this caller can read names its endpoint or pid. A server whose pid file stays — the
 * recorded one, another profile's recorded one, or one that lost a race between two starts — is never
 * closed, nor one whose pid file path or record cannot be read.
 *
 * A workspace's forgotten servers are ended only while no live `codex-companion.mjs` process belongs
 * to it, whatever its subcommand or age: the companion is every Codex job's process, whichever session
 * or profile started it. Command lines are read by the Codex plugin's own option rules (the last value
 * wins, `--` ends the options). A companion with no `--cwd`, whose folder cannot be read, or — off
 * Windows — whose `--cwd` cannot be told apart from prompt text, belongs to every workspace. Every
 * companion's folder is looked up before the listing taken right before each server's tree is ended;
 * in that listing a companion that appeared, one whose folder was not looked up yet, a server whose pid
 * or command line changed, a pid file back or a record that now names it or cannot be read stops that
 * workspace's close. Anything the listing cannot show for sure — a listing that fails, is malformed or
 * truncated, or holds an empty command line twice running — closes nothing and returns a reason. Only
 * a close the next listing confirms is counted.
 *
 * Workspaces compare by git top level (the folder itself outside a repository, as the Codex plugin
 * resolves it), case-folded with both separators on Windows, exact elsewhere. The listing is the
 * Windows CIM process table as JSON, or `ps` elsewhere; NEXUS_CODEX_PLATFORM forces the platform,
 * NEXUS_CODEX_LIST and NEXUS_CODEX_KILL replace the list and kill commands (a JSON array, the kill
 * receiving the platform's arguments after it). Off Windows a server, started detached, is ended by
 * its process group.
 *
 * closeForgotten returns { closed: [{ pid, workspace, ageMinutes }], workspaces: [{ workspace, closed,
 * kept, why }], reason? } and never throws for a process it could not read.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const LIST_MS = 15000;
const KILL_MS = 10000;
const GIT_MS = 10000;
const RECHECK_MS = 2000;
const RECHECK_STEP_MS = 250;
const SERVER_SCRIPT = 'app-server-broker.mjs';
const COMPANION_SCRIPT = 'codex-companion.mjs';
const PIPE_SUFFIX = '-codex-app-server';
const EVERY = Symbol('every workspace');
const UNREAD = Symbol('a folder not looked up');

function commandOverride(name, env = process.env) {
  try {
    const v = JSON.parse(env[name] || 'null');
    return Array.isArray(v) && v.length && v.every((x) => typeof x === 'string') ? v : null;
  } catch {
    return null;
  }
}

function sleep(ms) {
  if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// The CIM query prints UTF-8: a path decoded in the console's code page could read as a missing pid file.
function windowsListCommand() {
  const filter = "Name='node.exe' OR CommandLine LIKE '%codex-companion%' OR CommandLine LIKE '%app-server-broker%'";
  const script = "$ErrorActionPreference = 'Stop'; [Console]::OutputEncoding = [Text.Encoding]::UTF8; " +
    `try { $p = @(Get-CimInstance Win32_Process -Filter "${filter}" -ErrorAction Stop | ForEach-Object { ` +
    "[pscustomobject]@{ pid = [int]$_.ProcessId; started = $(if ($_.CreationDate) { ([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds() } else { $null }); cmd = $_.CommandLine } }); " +
    '[Console]::Out.Write((ConvertTo-Json -InputObject $p -Compress -Depth 3)) } catch { exit 1 }';
  return ['powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')]];
}

function defaultList(platform, env) {
  const override = commandOverride('NEXUS_CODEX_LIST', env);
  const [exe, args] = override ? [override[0], override.slice(1)]
    : platform === 'win32' ? windowsListCommand()
      : ['ps', ['-eww', '-o', 'pid=,etimes=,args=']];
  const res = spawnSync(exe, args, { encoding: 'utf8', timeout: LIST_MS, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (res.error) return { ok: false, reason: `the process list could not be taken: ${res.error.message}` };
  if (res.status !== 0) return { ok: false, reason: `the process list could not be taken: exit ${res.status}` };
  return { ok: true, stdout: String(res.stdout || '') };
}

function defaultKill(pid, platform, env) {
  const args = platform === 'win32' ? ['/PID', String(pid), '/T', '/F'] : ['-KILL', '--', `-${pid}`];
  const override = commandOverride('NEXUS_CODEX_KILL', env);
  if (override) {
    spawnSync(override[0], [...override.slice(1), ...args], { encoding: 'utf8', timeout: KILL_MS, windowsHide: true });
  } else if (platform === 'win32') {
    spawnSync('taskkill', args, { encoding: 'utf8', timeout: KILL_MS, windowsHide: true });
  } else {
    try { process.kill(-pid, 'SIGKILL'); } catch { /* gone, or not ours: the next listing decides */ }
  }
}

// The Codex plugin's own workspace rule: git's top level, or the folder itself outside a repository.
// A folder that does not exist, or a git that could not answer in time, cannot be read.
function gitTopLevel(dir) {
  if (typeof dir !== 'string' || !path.isAbsolute(dir)) return null;
  try { if (!fs.statSync(dir).isDirectory()) return null; } catch { return null; }
  const res = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: dir, encoding: 'utf8', timeout: GIT_MS, windowsHide: true });
  if (res.error && res.error.code !== 'ENOENT') return null;
  const top = !res.error && res.status === 0 ? String(res.stdout).trim() : '';
  return top || dir;
}

function workspaceKey(top, platform) {
  if (platform === 'win32') return top.replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();
  return top.replace(/\/+$/, '') || '/';
}

// Raw listing text to [{ pid, started, cmd }], or { reason }.
function parseListing(text, platform, now) {
  const bad = (why) => ({ reason: `the process list ${why} — nothing closed` });
  const empty = (pid) => ({ ...bad(`holds an empty command line (pid ${pid})`), emptyCommand: true });
  if (platform === 'win32') {
    let rows;
    try { rows = JSON.parse(text); } catch { return bad('is malformed or truncated'); }
    if (!Array.isArray(rows)) return bad('is malformed');
    const procs = [];
    for (const r of rows) {
      if (!r || !Number.isInteger(r.pid) || r.pid <= 0) return bad('is malformed');
      if (typeof r.cmd !== 'string' || !r.cmd.trim()) return empty(r.pid);
      procs.push({ pid: r.pid, started: Number.isFinite(r.started) ? r.started : null, cmd: r.cmd });
    }
    return { procs };
  }
  if (!text.trim()) return bad('is empty');
  if (!text.endsWith('\n')) return bad('is truncated');
  const procs = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const m = /^\s*(\d+)\s+(\d+)(?:\s(.*))?$/.exec(line);
    if (!m) return bad('is malformed');
    const pid = Number(m[1]);
    if (!m[3] || !m[3].trim()) return empty(pid);
    procs.push({ pid, started: now - Number(m[2]) * 1000, cmd: m[3].trim() });
  }
  return { procs };
}

// Windows command-line splitting: backslashes are literal except before a double quote.
function splitWindows(cmd) {
  const out = [];
  let cur = '';
  let quoted = false;
  let has = false;
  for (let i = 0; i < cmd.length;) {
    const c = cmd[i];
    if (c === '\\') {
      let n = 0;
      while (cmd[i] === '\\') { n++; i++; }
      if (cmd[i] === '"') {
        cur += '\\'.repeat(Math.floor(n / 2));
        if (n % 2) { cur += '"'; i++; }
      } else {
        cur += '\\'.repeat(n);
      }
      has = true;
    } else if (c === '"') {
      if (quoted && cmd[i + 1] === '"') { cur += '"'; i += 2; } else { quoted = !quoted; i++; }
      has = true;
    } else if (!quoted && (c === ' ' || c === '\t')) {
      if (has) out.push(cur);
      cur = '';
      has = false;
      i++;
    } else {
      cur += c;
      has = true;
      i++;
    }
  }
  if (has) out.push(cur);
  return out;
}

const lastSegment = (p) => String(p).split(/[\\/]/).pop();
const parentOf = (p) => String(p).replace(/[\\/][^\\/]*$/, '');

// The Codex plugin's own option rules, which decide what its processes act on: the last value wins,
// `--` ends the options, a value option takes the next token whatever it is, `--name=value` keeps the
// text up to a second `=`, an unknown option is a positional. null where the plugin refuses the line.
function parseOptions(argv, { values, booleans = [], aliases = {} }) {
  const options = {};
  const counts = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--') { positionals.push(...argv.slice(i + 1)); break; }
    if (!t.startsWith('-') || t === '-') { positionals.push(t); continue; }
    const long = t.startsWith('--');
    const [raw, inline] = long ? t.slice(2).split('=', 2) : [t.slice(1), undefined];
    const key = aliases[raw] ?? raw;
    if (booleans.includes(key)) continue;
    if (!values.includes(key)) { positionals.push(t); continue; }
    const value = inline ?? argv[i + 1];
    if (value === undefined) return null;
    if (inline === undefined) i++;
    options[key] = value;
    counts[key] = (counts[key] || 0) + 1;
  }
  return { options, counts, positionals };
}

// The companion re-splits a lone argument as a shell-like string, backslash escaping the next character.
function splitRaw(raw) {
  const tokens = [];
  let cur = '';
  let quote = null;
  let escaping = false;
  for (const c of raw) {
    if (escaping) { cur += c; escaping = false; continue; }
    if (c === '\\') { escaping = true; continue; }
    if (quote) { if (c === quote) quote = null; else cur += c; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if (/\s/.test(c)) { if (cur) { tokens.push(cur); cur = ''; } continue; }
    cur += c;
  }
  if (escaping) cur += '\\';
  if (cur) tokens.push(cur);
  return tokens;
}

const SERVER_OPTIONS = { values: ['cwd', 'pid-file', 'endpoint'] };
const REVIEW_OPTIONS = { values: ['base', 'scope', 'model', 'cwd'], booleans: ['json', 'background', 'wait'], aliases: { m: 'model' } };
const COMPANION_OPTIONS = {
  setup: { values: ['cwd'], booleans: ['json', 'enable-review-gate', 'disable-review-gate'] },
  review: REVIEW_OPTIONS,
  'adversarial-review': REVIEW_OPTIONS,
  task: { values: ['model', 'effort', 'cwd', 'prompt-file'], booleans: ['json', 'write', 'resume-last', 'resume', 'fresh', 'background'], aliases: { m: 'model' } },
  transfer: { values: ['cwd', 'source'], booleans: ['json'] },
  'task-worker': { values: ['cwd', 'job-id'] },
  status: { values: ['cwd', 'timeout-ms', 'poll-interval-ms'], booleans: ['json', 'all', 'wait'] },
  result: { values: ['cwd'], booleans: ['json'] },
  'task-resume-candidate': { values: ['cwd'], booleans: ['json'] },
  cancel: { values: ['cwd'], booleans: ['json'] },
};

// { endpoint, cwd, pidFile } of a server, each null where it cannot be read. Off Windows `ps` joins
// the arguments with spaces, so a value runs to the next flag.
function serverOptions(proc, platform) {
  if (platform === 'win32') {
    const args = scriptArgs(proc, platform, SERVER_SCRIPT) || [];
    const parsed = parseOptions(args.slice(1), SERVER_OPTIONS);
    const o = parsed ? parsed.options : {};
    return { endpoint: o.endpoint || null, cwd: o.cwd || null, pidFile: o['pid-file'] || null };
  }
  const m = new RegExp(`(?:^|[\\s/])${SERVER_SCRIPT.replace(/[.-]/g, (c) => `\\${c}`)}\\s+serve(\\s.*)?$`).exec(proc.cmd);
  const text = m && m[1] ? m[1].split(/\s--(?=\s|$)/)[0] : '';
  const last = (name) => {
    let value = null;
    for (const v of text.matchAll(new RegExp(`\\s--${name.replace(/-/g, '\\-')}(=|\\s+)(.+?)(?=\\s+--?[A-Za-z]|$)`, 'g'))) {
      value = v[1] === '=' ? v[2].split('=')[0] : v[2];
    }
    return value || null;
  };
  return { endpoint: last('endpoint'), cwd: last('cwd'), pidFile: last('pid-file') };
}

// { sub, cwd, jobId, sure } of a companion, or null for another process. Not sure where the plugin
// would refuse the line, the subcommand is not one it knows, or — off Windows, where `ps` cannot show
// where one argument ends — any positional or a repeated flag could have carried prompt text.
function companionOptions(proc, platform) {
  const args = scriptArgs(proc, platform, COMPANION_SCRIPT);
  if (args === null) return null;
  const [sub, ...rest] = args;
  const config = Object.hasOwn(COMPANION_OPTIONS, sub || '') ? COMPANION_OPTIONS[sub] : null;
  const argv = rest.length === 1 ? (rest[0].trim() ? splitRaw(rest[0]) : []) : rest;
  const parsed = config ? parseOptions(argv, { ...config, aliases: { C: 'cwd', ...config.aliases } }) : null;
  if (!parsed) return { sub, cwd: null, jobId: null, sure: false };
  const sure = platform === 'win32'
    || (!parsed.positionals.length && (parsed.counts.cwd || 0) <= 1 && (parsed.counts['job-id'] || 0) <= 1);
  return { sub, cwd: parsed.options.cwd || null, jobId: parsed.options['job-id'] || null, sure };
}

function scriptArgs(proc, platform, script) {
  if (platform === 'win32') {
    const t = splitWindows(proc.cmd);
    const i = t.findIndex((x) => lastSegment(x) === script);
    return i < 0 ? null : t.slice(i + 1);
  }
  const m = new RegExp(`(?:^|[\\s/])${script.replace(/[.-]/g, (c) => `\\${c}`)}(?:\\s+(.*))?$`).exec(proc.cmd);
  return m ? String(m[1] || '').split(/\s+/).filter(Boolean) : null;
}

const isServer = (proc, platform) => {
  const args = scriptArgs(proc, platform, SERVER_SCRIPT);
  return Boolean(args && args[0] === 'serve');
};

// The pid file must sit in the session folder the endpoint names, as the Codex plugin makes them; a
// path that does not tie to the endpoint was not read right, and a misread path would look absent.
function pidFileFor({ endpoint, pidFile }) {
  if (!endpoint || !pidFile || pidFile.includes('�')) return { endpoint, pidFile: null };
  const sessionDir = parentOf(pidFile);
  let tied = false;
  if (endpoint.startsWith('pipe:')) {
    const name = lastSegment(sessionDir).replace(/[^A-Za-z0-9._-]/g, '-').replace(/^-+|-+$/g, '');
    tied = lastSegment(endpoint.slice('pipe:'.length)) === `${name}${PIPE_SUFFIX}`;
  } else if (endpoint.startsWith('unix:')) {
    tied = parentOf(endpoint.slice('unix:'.length)) === sessionDir;
  }
  return { endpoint, pidFile: tied ? pidFile : null };
}

function pathState(p, stat = fs.statSync) {
  try { stat(p); return 'present'; } catch (err) { return err.code === 'ENOENT' ? 'absent' : 'unknown'; }
}

// The record file the Codex plugin keeps for a workspace root, under one state root.
function recordFile(stateRoot, top) {
  let canonical = top;
  try { canonical = fs.realpathSync.native(top); } catch { /* the plugin keeps the root as given */ }
  const slug = (path.basename(top) || 'workspace').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'workspace';
  const hash = crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 16);
  return path.join(stateRoot, `${slug}-${hash}`, 'broker.json');
}

// 'none', 'names' or 'unreadable' across every state root.
function recordVerdict(stateRoots, top, server) {
  if (!Array.isArray(stateRoots) || !stateRoots.length) return 'unreadable';
  let verdict = 'none';
  for (const root of stateRoots) {
    let rec;
    try {
      rec = JSON.parse(fs.readFileSync(recordFile(root, top), 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      return 'unreadable';
    }
    if (!rec || typeof rec !== 'object') return 'unreadable';
    if (rec.endpoint === server.endpoint || rec.pid === server.pid) verdict = 'names';
  }
  return verdict;
}

// Why a server stays, or null while its pid file is gone and no record names it.
function keptBecause(stateRoots, f, stat) {
  const state = pathState(f.pidFile, stat);
  if (state === 'present') return 'it has its pid file';
  if (state !== 'absent') return 'its pid file cannot be read';
  const rec = recordVerdict(stateRoots, f.top, { endpoint: f.endpoint, pid: f.proc.pid });
  if (rec === 'names') return 'the Codex record names it';
  if (rec !== 'none') return 'the Codex record cannot be read';
  return null;
}

function closeForgotten({ workspace = null, excludeJob = null, stateRoots = [], platform, env = process.env, deps = {} } = {}) {
  const plat = platform || env.NEXUS_CODEX_PLATFORM || process.platform;
  const now = deps.now || Date.now;
  const list = deps.list || (() => defaultList(plat, env));
  const kill = deps.kill || ((pid) => defaultKill(pid, plat, env));
  const wait = deps.sleep || sleep;
  const tops = new Map();
  const topOf = (dir) => {
    if (!tops.has(dir)) tops.set(dir, (deps.topLevel || gitTopLevel)(dir));
    return tops.get(dir);
  };
  const keyOf = (dir) => { const top = dir ? topOf(dir) : null; return top ? workspaceKey(top, plat) : null; };

  // An exiting process can show an empty command line for a moment, so that listing is taken once more.
  const take = () => {
    for (let tries = 1; ; tries++) {
      const res = list();
      if (!res || !res.ok) return { reason: (res && res.reason) || 'the process list could not be taken — nothing closed' };
      const parsed = parseListing(res.stdout, plat, now());
      if (!parsed.emptyCommand || tries >= 2) return parsed;
    }
  };
  // The workspaces live companions belong to; EVERY when one cannot be placed. Without `resolve` no
  // folder is looked up, so a listing is acted on at once: a folder not looked up before is UNREAD.
  const busyKeys = (procs, resolve = true) => {
    const keys = new Set();
    for (const p of procs) {
      const c = companionOptions(p, plat);
      if (!c) continue;
      if (excludeJob && c.sure && c.sub === 'task-worker' && c.jobId === excludeJob) continue;
      if (!c.sure || !c.cwd) { keys.add(EVERY); continue; }
      if (!resolve && !tops.has(c.cwd)) { keys.add(UNREAD); continue; }
      const key = keyOf(c.cwd);
      keys.add(key === null ? EVERY : key);
    }
    return keys;
  };
  const isBusy = (keys, key) => keys.has(EVERY) || keys.has(UNREAD) || keys.has(key);

  const result = { closed: [], workspaces: [] };
  const first = take();
  if (first.reason) return { ...result, reason: first.reason };
  const listed = first.procs.filter((p) => isServer(p, plat));
  if (!listed.length) return result;
  const target = workspace === null ? null : keyOf(workspace);
  if (workspace !== null && target === null) return { ...result, reason: 'this folder cannot be read — nothing closed' };

  const rows = new Map();
  const rowFor = (key, label) => {
    if (!rows.has(key)) rows.set(key, { workspace: label, closed: 0, kept: 0, why: [], forgotten: [] });
    return rows.get(key);
  };
  const keep = (row, why) => { row.kept++; if (!row.why.includes(why)) row.why.push(why); };

  for (const p of listed) {
    const opts = serverOptions(p, plat);
    const top = opts.cwd ? topOf(opts.cwd) : null;
    const key = top ? workspaceKey(top, plat) : null;
    if (target !== null && key !== target) continue;
    const row = rowFor(key === null ? EVERY : key, top || opts.cwd || '(unknown folder)');
    if (top === null) { keep(row, 'its folder cannot be read'); continue; }
    const { endpoint, pidFile } = pidFileFor(opts);
    if (!pidFile) { keep(row, 'its pid file path cannot be read'); continue; }
    const f = { proc: p, top, endpoint, pidFile };
    const why = keptBecause(stateRoots, f, deps.stat);
    if (why) { keep(row, why); continue; }
    row.forgotten.push(f);
  }

  let stopAll = null;
  let latest = first.procs;
  const busyAtStart = busyKeys(first.procs);
  for (const [key, row] of rows) {
    if (!row.forgotten.length) continue;
    if (stopAll || isBusy(busyAtStart, key)) {
      for (let i = 0; i < row.forgotten.length; i++) keep(row, stopAll ? 'the process list could not be read' : 'a Codex job is running there');
      continue;
    }
    for (let i = 0; i < row.forgotten.length; i++) {
      const f = row.forgotten[i];
      const server = f.proc;
      const left = row.forgotten.length - i;
      const stop = (why) => { for (let j = 0; j < left; j++) keep(row, why); };
      busyKeys(latest);
      const before = take();
      if (before.reason) {
        stopAll = before.reason;
        stop('the process list could not be read');
        break;
      }
      latest = before.procs;
      const busy = busyKeys(before.procs, false);
      if (isBusy(busy, key)) {
        stop(busy.has(EVERY) || busy.has(key) ? 'a Codex job started there' : 'a Codex job started in a folder not yet read');
        break;
      }
      const now1 = before.procs.find((x) => x.pid === server.pid);
      if (!now1 || now1.cmd !== server.cmd) {
        stop('a server changed before the close');
        break;
      }
      const why = keptBecause(stateRoots, f, deps.stat);
      if (why) {
        stop(why);
        break;
      }
      kill(server.pid);
      let confirmed = false;
      for (let tries = RECHECK_MS / RECHECK_STEP_MS; tries > 0; tries--) {
        const after = take();
        if (!after.reason) {
          latest = after.procs;
          const still = after.procs.find((x) => x.pid === server.pid);
          if (!still || still.cmd !== server.cmd) { confirmed = true; break; }
        }
        if (tries > 1) wait(RECHECK_STEP_MS);
      }
      if (confirmed) {
        row.closed++;
        const ageMinutes = Number.isFinite(server.started) ? Math.round((now() - server.started) / 60000) : null;
        result.closed.push({ pid: server.pid, workspace: row.workspace, ageMinutes });
      } else {
        keep(row, 'its end could not be confirmed');
        result.reason = result.reason || `server ${server.pid} was not confirmed ended`;
      }
    }
  }
  for (const row of rows.values()) result.workspaces.push({ workspace: row.workspace, closed: row.closed, kept: row.kept, why: row.why });
  if (stopAll) result.reason = stopAll;
  return result;
}

function defaultStateRoots(dataDir, env = process.env) {
  const roots = [];
  const data = env.CLAUDE_PLUGIN_DATA || dataDir;
  if (data) roots.push(path.join(data, 'state'));
  roots.push(path.join(os.tmpdir(), 'codex-companion'));
  return roots;
}

module.exports = { closeForgotten, parseListing, splitWindows, recordFile, gitTopLevel, workspaceKey, commandOverride, defaultStateRoots };
