#!/usr/bin/env node
/**
 * Nexus codex-job: the one dispatch path for every Codex job, whichever seat starts it.
 *
 *   node codex-job.js start   --prompt-file <path> [--limit-minutes <n>] [--effort <level>] [--label <text>] [--kind <kind>]
 *   node codex-job.js wait    --job <id> --deadline <iso> [--started <iso>] [--max-seconds <n>]
 *   node codex-job.js collect --job <id> --deadline <iso> [--started <iso>] [--kind review|done-check|research|panel|mining]
 *   node codex-job.js jobs    --label <text>
 *   node codex-job.js sweep
 *
 * Every call prints one JSON object on stdout and exits 0 on every handled outcome — an unavailable
 * Codex, a failed or cancelled job, a job cut off at its limit. Exit 2 is reserved for a call the
 * helper cannot act on (a missing argument, a prompt file that does not exist, an unknown --kind),
 * printed as `{error}`.
 *
 * A JOB A LATER SESSION CAN FIND. The companion's job records are per working directory and no session
 * keeps another's job id, so a session started after one ended could not reach its jobs. `start`
 * appends an intent line to `.claude/audit/codex-jobs.jsonl` in the session root before it calls the
 * companion — its --label, or null without one — then the job id, or `unstarted` when no companion was
 * found to call. A labelled intent it cannot write starts no job, `unavailable`; an unlabelled one
 * starts the job anyway and adds `recordError`. A companion call that returns no id leaves the intent
 * standing, since its worker may already run; so does an id line it cannot write, which adds
 * `recordError`. `jobs --label` prints every job recorded under exactly that label, newest first:
 * `recorded` with its id, `started, id not recorded` for an intent with neither, or `none`, a missing
 * record file included; a record it cannot read whole is `unreadable`. --kind is validated as
 * `collect` validates it and recorded. A `collect` that returns `completed`, `failed` or `cancelled`
 * for a job the record holds appends one `end` line — its label, the job id, when it ended, the state
 * and, for a failed or cancelled job, its reason — once per job, so every job's run time can be read
 * back and its failures counted by cause; a job the record does not hold, a
 * companion not found, or a job still running writes none, and `jobs --label` reads past the line.
 *
 * CLOSING FORGOTTEN SERVERS. The Codex plugin keeps one background server per folder and, when its
 * connect check on it fails, starts another without ending the old one. `start`, before it calls the
 * companion, and a `collect` whose job ended — read as completed, failed or cancelled, or cut with the
 * cancel confirmed — end this folder's forgotten servers (lib/codex-servers.js): those whose pid file
 * is gone and that no Codex record names, and only while no Codex job runs in the folder, this
 * collect's own worker left out. The recorded server stays; the Codex plugin stops it when the session
 * ends. Each such call prints `serversClosed`; a close that fails adds `serversNote` and never changes
 * the job's state, verdict, output or early flag. `sweep` does the same for every folder on the
 * machine and prints one row per folder — closed, kept, and why kept — with the total. Every close
 * that ends servers appends one `close` line: when, the folder, how many, their ages in minutes, and
 * the trigger, `start`, `collect` or `sweep`.
 *
 * RUN FROM THE SESSION ROOT, NEVER WITH A --cwd. The Codex companion keeps its job records per
 * working directory, so `start`, `wait` and `collect` find the same job only when all three run from
 * the same directory. A build in a worktree is named to Codex in the brief, not by moving the job.
 *
 * READ-ONLY BY CONSTRUCTION. `start` never sends `--write` or `--model`: the user's Codex config is
 * the model dial. It sends `--effort` only where the dispatch's own `--effort` or, without one, the
 * repo's `codex.effort` names a Codex level — or, under a gear, where the session's active gear
 * context names one for Codex's effort (lib/gears.js decides which wins: a campaign's gear above the
 * repo setting, the repo setting above the feature's gear); a dispatch `--effort` outside the levels
 * starts no job, so a run asked to go lower never runs at the configured level. `start` prints the
 * effort it sent.
 *
 * ONE LIMIT, AND A STALL CHECK. `codex.timeLimitMinutes` (default 25) runs from the job's start. Inside
 * it the job's own log decides: 6 minutes with no new `[ISO time]` line is a stall — measured on 84 jobs,
 * no completed job went quiet longer than 5.6 minutes and every stuck one went quiet 8 or more. Quiet
 * counts from the newest timestamped line, or from --started when the log exists and is empty; a log the
 * helper cannot use (no path, missing, unreadable, no parsable timestamp) never makes a stall, and the
 * limit stays the backstop. `wait` reads the state once without waiting, for the log's path, then waits
 * at most until a stall would fall due, and reports `stalled` with the quiet minutes. Only `collect`
 * cuts a stall: it re-reads state and log itself, and a job that wrote again is still running.
 * `wait` returns within --max-seconds (default 100) plus a 15-second grace for a hung companion,
 * inside the Bash tool's default two-minute timeout, so no caller needs a timeout argument; past the
 * deadline it adds `deadlinePassed` to an unfinished job's state, since an agent has no clock, and keeps
 * waiting up to --max-seconds, so a dispatcher waiting on the round's other readers can call it again.
 * A status read that fails — the companion erred, timed out or knew no job — is `unknown` with
 * `readError`, never a job failure: the caller keeps waiting to the deadline, and a fast error still
 * takes the whole wait. At the deadline `collect` re-reads the state, allowing that read 30 seconds of
 * its own. A job that just finished is taken; otherwise `collect` cancels it and returns the job's
 * whole log as `partial`; the caller runs its fallback as well.
 *
 * THE EARLY FLAG. With --started, a job failure — `unavailable` at start, `failed`, `cancelled` read
 * as terminal, a completed job with no usable output for its --kind — returned before the start plus
 * the window (6 minutes, or the whole limit where that is shorter) carries `earlyFailure`; a stall
 * carries it only when `collect` sees it before the window plus one minute of companion setup. The time
 * the helper sees the failure governs, less the time `start` spent closing forgotten servers, so no
 * caller keeps a clock. No --started, no flag.
 *
 * THE STOP. `collect` runs the companion's own `cancel` first (40 s), with Git Bash path conversion off
 * so the companion's `taskkill /PID` switches arrive intact. A cancel that fails is judged by the
 * process, not by the cancel's exit code: after the re-read, the record's pid gone, or held by another
 * program, reads as stopped; on Windows a pid whose command line names this job's `task-worker` is
 * ended here with `taskkill /PID {pid} /T /F`, no shell, then checked again. A lookup that errors, runs
 * past its 5 seconds or returns an empty command line is tried once more; two such are no answer, which
 * never reads as stopped. Only a job still running — by its process — is reported as that state with
 * the cancel's error, never as `cancelled`. Node's own warning lines never reach a `reason`. A failed
 * or cancelled job whose record carries no error message is reasoned from the last lines of its log.
 *
 * A WORKER THAT NEVER TOOK THE JOB. The companion starts its background worker before it saves the
 * job, and a worker that reads first exits: the job stays `queued` with no process behind it. `start`
 * loads `codex-worker-wait.js` into the companion through NODE_OPTIONS, after whatever the shell set
 * there, and the worker then waits for its launcher to exit before it reads. Where a worker is lost
 * all the same, `wait` and `collect` read a `queued` job whose pid is gone, or held by another
 * program, as `failed` — a job failure, early flag included — and `collect` has the companion cancel
 * the record, only while no process holds the pid. A lookup with no answer never reads as lost, and
 * the stall check stays the backstop.
 *
 * FINDING THE COMPANION. `NEXUS_CODEX_COMPANION` names it directly. Otherwise
 * `installed_plugins.json` under CLAUDE_CONFIG_DIR (or ~/.claude), the first `codex@` key: the entry
 * installed for this working directory first, else the user-scope entry, the highest version
 * within the chosen group. Project paths compare case-folded on Windows, whose paths are.
 *
 * ONE JOB FOLDER. The companion keeps its jobs under CLAUDE_PLUGIN_DATA, which the Bash tool's shell
 * has and the PowerShell tool's has not, so a job started in one was unknown in the other. A shell
 * without the variable is given the Codex plugin's own data folder, `plugins/data/{id}` under the
 * config directory, the id being the registry key with every character outside letters, digits, `_`
 * and `-` turned into `-`. A companion named directly gets no folder.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_LIMIT_MINUTES = 25;
const DEFAULT_MAX_SECONDS = 100;
const STATUS_GRACE_MS = 15000;
const COLLECT_STATUS_MS = 30000;
const CANCEL_MS = 40000;
const QUIET_LIMIT_MS = 6 * 60000;
const SETUP_ALLOWANCE_MS = 60000;
const WAIT_FLOOR_MS = 1000;
const LOOKUP_MS = 5000;
const LOOKUP_TRIES = 2;
const READ_SLACK_MS = LOOKUP_MS * LOOKUP_TRIES + 1000;
const KILL_MS = 10000;
const RECHECK_MS = 2000;
const CODEX_EFFORTS = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'];
const KINDS = ['review', 'done-check', 'research', 'panel', 'mining'];
const ANY_OUTPUT_KINDS = new Set(['research', 'panel', 'mining']);
const RECORD_REL = '.claude/audit/codex-jobs.jsonl';
const TERMINAL = new Set(['completed', 'failed', 'cancelled']);
const WORKER_WAIT = path.join(__dirname, 'codex-worker-wait.js');
const PARTIAL_REASON = 'partial — Codex cancelled at the limit';
const STALL_REASON = 'stalled — no Codex output for 6 minutes';
const LOST_WORKER_REASON = 'the Codex worker exited before it took the job';
const NO_VERDICT = 'no verdict returned';
const NO_OUTPUT = 'no output returned';
const TAIL_LINES = 5;
const TAIL_CHARS = 400;
const LOG_TIME = /^\[(\d{4}-\d{2}-\d{2}T[^\]\s]+)\]/;
const NODE_WARNING = /^\(node:\d+\) (?:\[[A-Z]+\d+\] )?[A-Za-z]*Warning: /;
const DONE_CHECK_VERDICT = /^\s*(?:[-*+]\s+)?\*\*Verdict: (?:(PASS)\*\*|(FAIL)\b)/;
const BOLD_VERDICT = /^\s*\*\*(NO-GO|GO)(?:[.:!]|\s+[—–-]\s[^*]*)?\*\*[.:!]?\s*$/;

function print(obj) { process.stdout.write(JSON.stringify(obj) + '\n'); }
function warn(line) { process.stderr.write(line + '\n'); }
function sleepUntil(t) {
  const ms = t - Date.now();
  if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function usage(message) {
  print({ error: message });
  process.exitCode = 2;
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) opts[a.slice(2)] = true;
    else { opts[a.slice(2)] = next; i++; }
  }
  return opts;
}

const isPositive = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

function readCodexConfig(root) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'nexus-agents.json'), 'utf8'));
    return cfg && typeof cfg.codex === 'object' && cfg.codex ? cfg.codex : {};
  } catch {
    return {};
  }
}

function resolveLimit(codex, flag) {
  let limit = DEFAULT_LIMIT_MINUTES;
  if ('timeLimitMinutes' in codex) {
    if (isPositive(codex.timeLimitMinutes)) limit = codex.timeLimitMinutes;
    else warn(`codex.timeLimitMinutes is ${JSON.stringify(codex.timeLimitMinutes)}, not a positive number of minutes — using ${limit}.`);
  }
  if (flag !== undefined) {
    const n = Number(flag);
    if (flag !== true && isPositive(n)) limit = n;
    else warn(`--limit-minutes is ${JSON.stringify(flag)}, not a positive number of minutes — using ${limit}.`);
  }
  return limit;
}

function repoEffort(codex) {
  if (!('effort' in codex)) return null;
  if (CODEX_EFFORTS.includes(codex.effort)) return codex.effort;
  warn(`codex.effort is ${JSON.stringify(codex.effort)}, outside the Codex levels (${CODEX_EFFORTS.join(', ')}) — not sent.`);
  return null;
}

// Row 6 of the gear resolver for this session's active gear context, the dispatch's --effort as its
// explicit rung. A value naming no level (`not lowered`, `as today`) sends the repo's codex.effort,
// else none; a resolver that cannot run leaves today's rule.
function resolveEffort(codex, opts, root) {
  const explicit = 'effort' in opts ? opts.effort : undefined;
  try {
    const gears = require('./lib/gears');
    const { resolveDeclaredTree } = require('./lib/worktree-target');
    const session = String(process.env.CLAUDE_CODE_SESSION_ID || '');
    const v = gears.valueOf({ setting: 6, explicit, root, tree: resolveDeclaredTree(root, session), session, env: process.env });
    const geared = v.source === 'campaign' || v.source === 'gear';
    if (geared && Object.hasOwn(gears.EFFORT_LEVELS, v.value)) return gears.EFFORT_LEVELS[v.value];
  } catch { /* today's rule below */ }
  return explicit !== undefined ? explicit : repoEffort(codex);
}

function versionKey(v) {
  return String(v || '0').split('.').map((p) => parseInt(p, 10) || 0);
}

function compareVersionsDesc(a, b) {
  const x = versionKey(a.version);
  const y = versionKey(b.version);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (y[i] || 0) - (x[i] || 0);
    if (d) return d;
  }
  return 0;
}

let codexDataDir = null;

function findCompanion(cwd) {
  if (process.env.NEXUS_CODEX_COMPANION) return { path: process.env.NEXUS_CODEX_COMPANION };
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(path.join(configDir, 'plugins', 'installed_plugins.json'), 'utf8'));
  } catch {
    return { unavailable: 'the Codex plugin is not installed (no installed-plugins registry)' };
  }
  const plugins = (registry && registry.plugins) || registry || {};
  const key = Object.keys(plugins).find((k) => k.startsWith('codex@'));
  const entries = key && Array.isArray(plugins[key]) ? plugins[key].filter((e) => e && e.installPath) : [];
  const win = process.platform === 'win32';
  const norm = (p) => { const r = path.resolve(String(p || '')); return win ? r.toLowerCase() : r; };
  const here = norm(cwd);
  const forHere = entries.filter((e) => e.projectPath && norm(e.projectPath) === here);
  const pool = forHere.length ? forHere : entries.filter((e) => e.scope === 'user');
  if (!pool.length) return { unavailable: 'the Codex plugin is not installed for this directory' };
  const chosen = pool.slice().sort(compareVersionsDesc)[0];
  const script = path.join(chosen.installPath, 'scripts', 'codex-companion.mjs');
  if (!fs.existsSync(script)) return { unavailable: `the Codex companion is missing at ${script}` };
  if (!process.env.CLAUDE_PLUGIN_DATA) codexDataDir = path.join(configDir, 'plugins', 'data', key.replace(/[^A-Za-z0-9_-]/g, '-'));
  return { path: script };
}

// NODE_OPTIONS for the companion's `task` call: the worker wait, after whatever the shell set.
function workerWaitEnv() {
  if (!fs.existsSync(WORKER_WAIT)) return {};
  const flag = `--require "${WORKER_WAIT.replace(/[\\"]/g, (c) => `\\${c}`)}"`;
  const own = process.env.NODE_OPTIONS;
  return { NODE_OPTIONS: own ? `${own} ${flag}` : flag, NEXUS_CODEX_WORKER_WAIT: flag };
}

// Drops Node's own warning lines, and the `(Use \`node --trace-…` hint right after one.
function dropWarnings(text) {
  const kept = [];
  let afterWarning = false;
  for (const line of String(text || '').split(/\r?\n/)) {
    if (NODE_WARNING.test(line)) { afterWarning = true; continue; }
    if (afterWarning && line.startsWith('(Use `node --trace-')) { afterWarning = false; continue; }
    afterWarning = false;
    kept.push(line);
  }
  return kept.join('\n').trim();
}

function companion(script, args, timeoutMs, extraEnv = {}) {
  const res = spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(codexDataDir ? { CLAUDE_PLUGIN_DATA: codexDataDir } : {}),
      MSYS_NO_PATHCONV: '1',
      MSYS2_ARG_CONV_EXCL: '*',
      ...extraEnv,
    },
    timeout: timeoutMs,
    windowsHide: true,
  });
  const ok = res.status === 0 && !res.error;
  const reason = dropWarnings(res.stderr) || (res.error && res.error.message) || `the Codex companion exited ${res.status}`;
  let json = null;
  try { json = JSON.parse(res.stdout); } catch { /* text output, or none */ }
  return { ok, stdout: res.stdout || '', json, reason };
}

const windowMs = (limitMs) => Math.min(QUIET_LIMIT_MS, limitMs);

function cmdStart(opts) {
  const callStart = Date.now();
  if (!opts['prompt-file'] || opts['prompt-file'] === true) return usage('start needs --prompt-file <path>');
  const promptFile = path.resolve(opts['prompt-file']);
  if (!fs.existsSync(promptFile)) return usage(`prompt file not found: ${promptFile}`);
  if ('effort' in opts && !CODEX_EFFORTS.includes(opts.effort)) {
    return usage(`--effort is ${JSON.stringify(opts.effort)}, not one of the Codex levels (${CODEX_EFFORTS.join(', ')}) — no job started`);
  }
  if ('kind' in opts && !KINDS.includes(opts.kind)) return usage(`--kind is ${JSON.stringify(opts.kind)}, not one of ${KINDS.join(', ')} — no job started`);
  if ('label' in opts && (typeof opts.label !== 'string' || !opts.label.trim())) return usage('--label needs the text of the label — no job started');
  const codex = readCodexConfig(process.cwd());
  const limit = resolveLimit(codex, opts['limit-minutes']);
  const effort = resolveEffort(codex, opts, process.cwd());
  let closeMs = 0;
  const unavailable = (why, servers = {}) => print({
    ...(Date.now() - closeMs < callStart + windowMs(limit * 60000) ? { unavailable: why, earlyFailure: true } : { unavailable: why }),
    ...servers,
  });

  const labelled = 'label' in opts;
  let intent = `${Date.now().toString(36)}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  let recordError = null;
  const at = new Date();
  const wroteIntent = appendRecord({
    type: 'intent', intent, label: labelled ? opts.label : null, kind: opts.kind || null,
    at: at.toISOString(), deadline: new Date(at.getTime() + limit * 60000).toISOString(),
  });
  if (wroteIntent !== true) {
    if (labelled) return unavailable(wroteIntent);
    recordError = wroteIntent;
    intent = null;
  }
  const unstarted = (why) => {
    if (intent) appendRecord({ type: 'unstarted', intent, reason: why });
    return unavailable(why);
  };
  const found = findCompanion(process.cwd());
  if (found.unavailable) return unstarted(found.unavailable);
  const closeStart = Date.now();
  const servers = closeServers('start', null);
  closeMs = Date.now() - closeStart;

  const args = ['task', '--background', '--prompt-file', promptFile, '--json'];
  if (effort) args.push('--effort', effort);
  const startedAt = new Date();
  const res = companion(found.path, args, 120000, workerWaitEnv());
  const jobId = res.json && res.json.jobId;
  if (!res.ok || !jobId) return unavailable(res.ok ? 'the Codex companion returned no job id' : res.reason, servers);
  const deadline = new Date(startedAt.getTime() + limit * 60000);
  const out = { jobId, startedAt: startedAt.toISOString(), deadline: deadline.toISOString(), effort: effort || null };
  if (intent) {
    const wrote = appendRecord({ type: 'job', intent, jobId, startedAt: out.startedAt, deadline: out.deadline });
    if (wrote !== true) recordError = wrote;
  }
  if (recordError) out.recordError = recordError;
  print({ ...out, ...servers });
}

// Ends forgotten Codex servers (lib/codex-servers.js) — this folder's, or with `workspace` null every
// folder's — and records one close line per folder where any ended. Whatever happens here, the job's
// own outcome stands: a failure, the module's loading included, is only a note beside it.
function closeAndRecord(trigger, excludeJob, workspace) {
  const { closeForgotten, defaultStateRoots } = require('./lib/codex-servers');
  const res = closeForgotten({ workspace, excludeJob, stateRoots: defaultStateRoots(codexDataDir) });
  const at = new Date().toISOString();
  for (const row of res.workspaces) {
    if (!row.closed) continue;
    const ages = res.closed.filter((c) => c.workspace === row.workspace).map((c) => c.ageMinutes);
    const wrote = appendRecord({ type: 'close', at, workspace: row.workspace, servers: row.closed, ages, trigger });
    if (wrote !== true && !res.reason) res.reason = wrote;
  }
  return res;
}

function cmdSweep() {
  findCompanion(process.cwd());
  let res;
  try {
    res = closeAndRecord('sweep', null, null);
  } catch (err) {
    res = { workspaces: [], reason: `the Codex server close failed: ${err.message}` };
  }
  const total = res.workspaces.reduce((t, w) => ({ closed: t.closed + w.closed, kept: t.kept + w.kept }), { closed: 0, kept: 0 });
  print(res.reason ? { workspaces: res.workspaces, total, reason: res.reason } : { workspaces: res.workspaces, total });
}

function closeServers(trigger, excludeJob) {
  try {
    const res = closeAndRecord(trigger, excludeJob, process.cwd());
    return res.reason ? { serversClosed: res.closed.length, serversNote: res.reason } : { serversClosed: res.closed.length };
  } catch (err) {
    return { serversClosed: 0, serversNote: `the Codex server close failed: ${err.message}` };
  }
}

// The session root's record of Codex jobs, one JSON line each: an intent before the companion is
// called, then the job id — or `unstarted` where no companion was found — and a close line per folder
// whose forgotten servers were ended. Returns true, or why not.
function appendRecord(line) {
  const file = path.join(process.cwd(), RECORD_REL);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `${JSON.stringify(line)}\n`);
    return true;
  } catch (err) {
    return `the Codex job record (${RECORD_REL}) could not be written: ${err.message}`;
  }
}

// A record that cannot be read whole writes no end line: a collect never fails on its timing line.
function recordEnd(jobId, state, reason) {
  let lines;
  try {
    lines = fs.readFileSync(path.join(process.cwd(), RECORD_REL), 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
  } catch {
    return;
  }
  if (lines.some((l) => l && l.type === 'end' && l.jobId === jobId)) return;
  const job = lines.filter((l) => l && l.type === 'job' && l.jobId === jobId).pop();
  const intent = job && lines.find((l) => l && l.type === 'intent' && l.intent === job.intent);
  if (!intent) return;
  const why = reason && state !== 'completed' ? { reason } : {};
  appendRecord({ type: 'end', label: intent.label, jobId, endedAt: new Date().toISOString(), state, ...why });
}

// Every job recorded under exactly this label, newest first. A record that cannot be read whole is
// `unreadable`: a lost line might have been the one asked for, so it never answers `none`.
function cmdJobs(opts) {
  if (typeof opts.label !== 'string' || !opts.label.trim()) return usage('jobs needs --label <text>');
  const label = opts.label;
  const file = path.join(process.cwd(), RECORD_REL);
  let lines;
  try {
    lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
  } catch (err) {
    if (err.code === 'ENOENT') return print({ label, result: 'none' });
    return print({ label, result: 'unreadable', reason: `the Codex job record (${RECORD_REL}) could not be read: ${err.message}` });
  }
  const jobs = [];
  for (const line of lines) {
    if (!line || line.type !== 'intent' || line.label !== label) continue;
    if (lines.some((l) => l && l.type === 'unstarted' && l.intent === line.intent)) continue;
    const job = lines.find((l) => l && l.type === 'job' && l.intent === line.intent);
    jobs.unshift(job
      ? { jobId: job.jobId, kind: line.kind, startedAt: job.startedAt, deadline: job.deadline, status: 'recorded' }
      : { jobId: null, kind: line.kind, startedAt: line.at, deadline: line.deadline, status: 'started, id not recorded' });
  }
  return print(jobs.length ? { label, result: 'found', jobs } : { label, result: 'none' });
}

function jobArgs(opts, sub) {
  if (!opts.job || opts.job === true) return usage(`${sub} needs --job <id>`);
  const deadline = Date.parse(opts.deadline);
  if (!opts.deadline || opts.deadline === true || Number.isNaN(deadline)) return usage(`${sub} needs --deadline <iso time>`);
  const parsed = typeof opts.started === 'string' ? Date.parse(opts.started) : NaN;
  const started = Number.isNaN(parsed) ? null : parsed;
  const found = findCompanion(process.cwd());
  return { job: String(opts.job), deadline, started, found };
}

// A job failure seen before the start plus the window (plus `extraMs`) is early.
function flagEarly(out, a, extraMs = 0) {
  if (a.started === null) return out;
  return Date.now() < a.started + windowMs(a.deadline - a.started) + extraMs ? { ...out, earlyFailure: true } : out;
}

const isJobFailure = (out) => out.state === 'failed' || out.state === 'cancelled' || (out.state === 'completed' && Boolean(out.reason));

function readStatus(script, job, waitMs, timeoutMs = waitMs + STATUS_GRACE_MS) {
  const args = waitMs > 0
    ? ['status', job, '--wait', '--timeout-ms', String(waitMs), '--json']
    : ['status', job, '--json'];
  const res = companion(script, args, timeoutMs);
  const record = res.json && res.json.job;
  if (!res.ok || !record || typeof record.status !== 'string') {
    return { state: 'unknown', readError: true, reason: res.ok ? 'the Codex companion returned no job state' : res.reason };
  }
  return { state: record.status, record };
}

// The time quiet is counted from: the newest timestamped log line, or --started for an empty log.
// Null where the log cannot be used, which never makes a stall.
function quietFrom(record, started) {
  if (!record || !record.logFile) return null;
  let text;
  try { text = fs.readFileSync(record.logFile, 'utf8'); } catch { return null; }
  if (text === '') return started;
  let newest = null;
  for (const line of text.split(/\r?\n/)) {
    const m = LOG_TIME.exec(line);
    const t = m ? Date.parse(m[1]) : NaN;
    if (!Number.isNaN(t) && (newest === null || t > newest)) newest = t;
  }
  return newest;
}

function stallOf(record, started) {
  const from = quietFrom(record, started);
  if (from === null) return null;
  const now = Date.now();
  return { due: from + QUIET_LIMIT_MS, stalled: now >= from + QUIET_LIMIT_MS, quietMinutes: Math.round((now - from) / 6000) / 10 };
}

function cmdWait(opts) {
  const a = jobArgs(opts, 'wait');
  if (!a) return;
  if (a.found.unavailable) return print(flagEarly({ state: 'failed', reason: a.found.unavailable }, a));
  const t0 = Date.now();
  const max = Number(opts['max-seconds']);
  const maxMs = (isPositive(max) ? max : DEFAULT_MAX_SECONDS) * 1000;
  const waitMs = t0 >= a.deadline ? maxMs : Math.min(maxMs, a.deadline - t0);
  const budgetEnd = t0 + waitMs + STATUS_GRACE_MS;

  const report = (s) => {
    if (s.readError) {
      sleepUntil(t0 + waitMs);
      const out = { state: s.state, readError: true, reason: s.reason };
      if (Date.now() >= a.deadline) out.deadlinePassed = true;
      return print(out);
    }
    if (TERMINAL.has(s.state)) {
      const out = s.reason ? { state: s.state, reason: s.reason } : { state: s.state };
      return print(isJobFailure(out) ? flagEarly(out, a) : out);
    }
    const out = { state: s.state };
    const stall = stallOf(s.record, a.started);
    if (stall && stall.stalled) Object.assign(out, { stalled: true, quietMinutes: stall.quietMinutes });
    if (Date.now() >= a.deadline) out.deadlinePassed = true;
    return print(out);
  };

  const first = lostWorker(readStatus(a.found.path, a.job, 0, waitMs + STATUS_GRACE_MS), a.job);
  if (first.readError || TERMINAL.has(first.state)) return report(first);
  const stall = stallOf(first.record, a.started);
  if (stall && stall.stalled) return report(first);
  const timeLeft = budgetEnd - Date.now();
  const untilStall = stall ? Math.max(WAIT_FLOOR_MS, stall.due - Date.now()) : Infinity;
  const companionWait = Math.floor(Math.min(waitMs, untilStall, timeLeft - READ_SLACK_MS));
  if (companionWait < 1) return report(first);
  return report(lostWorker(readStatus(a.found.path, a.job, companionWait, timeLeft), a.job));
}

// The last line naming the verdict wins: a reply that reconsiders ends on its final word. Only where no
// line names it, a first non-empty line that is one whole bold verdict counts (`**NO-GO — Round 1.**`).
function findVerdict(text) {
  const re = /^[-#>*\s]*verdict\s*:?[*\s]*(NO-GO|GO)\b/gim;
  let verdict = null;
  for (let m = re.exec(text); m; m = re.exec(text)) verdict = m[1].toUpperCase();
  if (verdict) return verdict;
  const first = String(text).split(/\r?\n/).find((l) => l.trim() !== '');
  const bold = first === undefined ? null : BOLD_VERDICT.exec(first);
  return bold ? bold[1] : null;
}

// A done-check body is usable with exactly one of the layout's verdict lines.
function doneCheckVerdict(text) {
  const found = String(text).split(/\r?\n/).map((l) => DONE_CHECK_VERDICT.exec(l)).filter(Boolean);
  return found.length === 1 ? found[0][1] || found[0][2] : null;
}

function readLog(record) {
  try {
    return fs.readFileSync(record.logFile, 'utf8');
  } catch {
    return '';
  }
}

function logTail(record) {
  const lines = dropWarnings(readLog(record || {})).split(/\r?\n/).map((l) => l.replace(LOG_TIME, '').trim()).filter(Boolean);
  const tail = lines.slice(-TAIL_LINES).join(' | ');
  return tail.length > TAIL_CHARS ? `…${tail.slice(-(TAIL_CHARS - 1))}` : tail;
}

function endedReason(s) {
  const tail = logTail(s.record);
  return tail ? `the job ended ${s.state} — its log ends: ${tail}` : `the job ended ${s.state}`;
}

function finished(script, job, s, kind) {
  if (s.state === 'completed') {
    const res = companion(script, ['result', job], 60000);
    if (!res.ok) return { state: 'completed', output: '', verdict: null, reason: res.reason };
    if (ANY_OUTPUT_KINDS.has(kind)) {
      return res.stdout.trim()
        ? { state: 'completed', output: res.stdout, verdict: null }
        : { state: 'completed', output: res.stdout, verdict: null, reason: NO_OUTPUT };
    }
    const verdict = kind === 'done-check' ? doneCheckVerdict(res.stdout) : findVerdict(res.stdout);
    return verdict
      ? { state: 'completed', output: res.stdout, verdict }
      : { state: 'completed', output: res.stdout, verdict: null, reason: NO_VERDICT };
  }
  const reason = s.reason || dropWarnings(s.record && s.record.errorMessage) || endedReason(s);
  return { state: s.state, output: '', verdict: null, reason };
}

// Windows: 'gone', { commandLine }, or null when no try could run or every command line was empty.
// A busy machine can push one query past its limit, so a try with no answer is asked once more.
function commandOverride(name) {
  try {
    const v = JSON.parse(process.env[name] || 'null');
    return Array.isArray(v) && v.length && v.every((x) => typeof x === 'string') ? v : null;
  } catch {
    return null;
  }
}

function lookupProcess(pid) {
  for (let i = 1; ; i++) {
    const found = lookupOnce(pid);
    if (found !== null || i >= LOOKUP_TRIES) return found;
  }
}

// Get-CimInstance errors are non-terminating: without Stop a denied query prints 'none'.
function lookupOnce(pid) {
  const override = commandOverride('NEXUS_CODEX_LOOKUP');
  let exe;
  let args;
  if (override) {
    [exe, ...args] = override;
    args.push(String(pid));
  } else {
    const cls = /^\w+$/.test(process.env.NEXUS_CODEX_LOOKUP_CLASS || '') ? process.env.NEXUS_CODEX_LOOKUP_CLASS : 'Win32_Process';
    const script = "$ErrorActionPreference = 'Stop'; " +
      `try { $p = Get-CimInstance ${cls} -Filter 'ProcessId=${pid}' -ErrorAction Stop; ` +
      "if ($p) { [Console]::Out.Write('found:' + $p.CommandLine) } else { [Console]::Out.Write('none') } } catch { exit 1 }";
    exe = 'powershell.exe';
    args = ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')];
  }
  const res = spawnSync(exe, args, { encoding: 'utf8', timeout: LOOKUP_MS, windowsHide: true });
  if (res.error || res.status !== 0) return null;
  const out = String(res.stdout || '').trim();
  if (out === 'none') return 'gone';
  const commandLine = out.startsWith('found:') ? out.slice('found:'.length) : '';
  return commandLine.trim() ? { commandLine } : null;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isWorkerOf = (commandLine, jobId) => /(?:^|[\s"])task-worker(?=[\s"]|$)/.test(commandLine)
  && new RegExp(`--job-id\\s+"?${escapeRe(jobId)}"?(?=\\s|$)`).test(commandLine);

// 'gone', 'other' (Windows: another program holds the pid), 'worker' (Windows: this job's), 'alive',
// or null (no answer).
function workerState(pid, jobId) {
  const platform = process.env.NEXUS_CODEX_PLATFORM || process.platform;
  if (platform !== 'win32') {
    try { process.kill(pid, 0); return 'alive'; } catch (e) { return e.code === 'EPERM' ? 'alive' : e.code === 'ESRCH' ? 'gone' : null; }
  }
  const found = lookupProcess(pid);
  if (found === null || found === 'gone') return found;
  return isWorkerOf(found.commandLine, jobId) ? 'worker' : 'other';
}

const isStopped = (state) => state === 'gone' || state === 'other';

// A queued job whose worker is gone never runs. Returns the status as a failed one, `pidFree` saying
// that no process holds the pid, or the status unchanged.
function lostWorker(s, jobId) {
  if (s.state !== 'queued') return s;
  const pid = s.record && s.record.pid;
  if (!(Number.isInteger(pid) && pid > 0)) return s;
  const state = workerState(pid, jobId);
  return isStopped(state) ? { state: 'failed', reason: LOST_WORKER_REASON, record: s.record, pidFree: state === 'gone' } : s;
}

function killTree(pid, jobId) {
  const [exe, ...lead] = commandOverride('NEXUS_CODEX_KILL') || ['taskkill'];
  spawnSync(exe, [...lead, '/PID', String(pid), '/T', '/F'], { encoding: 'utf8', timeout: KILL_MS, windowsHide: true });
  const end = Date.now() + RECHECK_MS;
  for (;;) {
    const state = workerState(pid, jobId);
    if (isStopped(state)) return true;
    if (state === null || Date.now() >= end) return false;
    sleepUntil(Date.now() + 250);
  }
}

// Cancels a running job at the limit, or at a stall (`stall` set). The stall's early flag is decided
// before this runs, since the cancel appends lines to the job's log.
function cut(script, job, s, kind, stall) {
  const extra = stall ? { stalled: true } : {};
  const readError = s.readError ? { readError: true } : {};
  const stopped = () => ({
    state: 'cancelled', output: '', verdict: null, reason: stall ? STALL_REASON : PARTIAL_REASON,
    ...extra, partial: readLog(s.record || {}), ...readError, ...(stall && stall.early ? { earlyFailure: true } : {}),
  });
  const cancel = companion(script, ['cancel', job, '--json'], CANCEL_MS);
  if (cancel.ok) return stopped();
  const again = readStatus(script, job, 0, COLLECT_STATUS_MS);
  if (TERMINAL.has(again.state)) {
    const out = finished(script, job, again, kind);
    return stall && stall.early && isJobFailure(out) ? { ...out, earlyFailure: true } : out;
  }
  const cancelFailed = () => ({
    state: again.state, output: '', verdict: null, reason: `cancel failed: ${cancel.reason}`,
    partial: readLog(again.record || {}), ...extra, ...(again.readError ? { readError: true } : {}),
  });
  const pid = again.record && again.record.pid;
  if (again.readError || !(Number.isInteger(pid) && pid > 0)) return cancelFailed();
  const state = workerState(pid, job);
  if (isStopped(state)) return stopped();
  if (state === 'worker' && killTree(pid, job)) return stopped();
  return cancelFailed();
}

function cmdCollect(opts) {
  const a = jobArgs(opts, 'collect');
  if (!a) return;
  const kind = opts.kind === undefined ? 'review' : opts.kind;
  if (!KINDS.includes(kind)) return usage(`--kind is ${JSON.stringify(kind)}, not one of ${KINDS.join(', ')}`);
  if (a.found.unavailable) return print(flagEarly({ state: 'failed', output: '', verdict: null, reason: a.found.unavailable }, a));
  const script = a.found.path;
  const s = lostWorker(readStatus(script, a.job, 0, COLLECT_STATUS_MS), a.job);
  if (s.pidFree) companion(script, ['cancel', a.job, '--json'], CANCEL_MS);
  const ended = (out) => {
    if (!TERMINAL.has(out.state)) return print(out);
    recordEnd(a.job, out.state, out.reason);
    return print({ ...out, ...closeServers('collect', a.job) });
  };
  if (TERMINAL.has(s.state)) {
    const out = finished(script, a.job, s, kind);
    return ended(isJobFailure(out) ? flagEarly(out, a) : out);
  }
  if (Date.now() >= a.deadline) return ended(cut(script, a.job, s, kind, null));
  const stall = s.readError ? null : stallOf(s.record, a.started);
  if (stall && stall.stalled) {
    const early = flagEarly({}, a, SETUP_ALLOWANCE_MS).earlyFailure === true;
    return ended(cut(script, a.job, s, kind, { early }));
  }
  const out = { state: s.state, output: '', verdict: null, reason: 'still running — wait until the deadline' };
  return print(s.readError ? { ...out, readError: true } : out);
}

function main() {
  const [sub, ...rest] = process.argv.slice(2);
  const opts = parseArgs(rest);
  if (sub === 'start') return cmdStart(opts);
  if (sub === 'wait') return cmdWait(opts);
  if (sub === 'collect') return cmdCollect(opts);
  if (sub === 'jobs') return cmdJobs(opts);
  if (sub === 'sweep') return cmdSweep();
  return usage(`unknown subcommand ${JSON.stringify(sub || '')} — use start, wait, collect, jobs or sweep`);
}

main();
