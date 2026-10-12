#!/usr/bin/env node
/**
 * Nexus codex-job: the one dispatch path for every Codex job, whichever seat starts it.
 *
 *   node codex-job.js start   --prompt-file <path> [--limit-minutes <n>] [--effort <level>]
 *   node codex-job.js wait    --job <id> --deadline <iso> [--started <iso>] [--max-seconds <n>]
 *   node codex-job.js collect --job <id> --deadline <iso> [--started <iso>] [--kind review|done-check|research]
 *
 * Every call prints one JSON object on stdout and exits 0 on every handled outcome — an unavailable
 * Codex, a failed or cancelled job, a job cut off at its limit. Exit 2 is reserved for a call the
 * helper cannot act on (a missing argument, a prompt file that does not exist, an unknown --kind),
 * printed as `{error}`.
 *
 * RUN FROM THE SESSION ROOT, NEVER WITH A --cwd. The Codex companion keeps its job records per
 * working directory, so `start`, `wait` and `collect` find the same job only when all three run from
 * the same directory. A build in a worktree is named to Codex in the brief, not by moving the job.
 *
 * READ-ONLY BY CONSTRUCTION. `start` never sends `--write` or `--model`: the user's Codex config is
 * the model dial. It sends `--effort` only where the dispatch's own `--effort` or, without one, the
 * repo's `codex.effort` names a Codex level; a dispatch `--effort` outside the levels starts no job,
 * so a run asked to go lower never runs at the configured level. `start` prints the effort it sent.
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
 * the helper sees the failure governs, so no caller keeps a clock. No --started, no flag.
 *
 * THE STOP. `collect` runs the companion's own `cancel` first (40 s), with Git Bash path conversion off
 * so the companion's `taskkill /PID` switches arrive intact. A cancel that fails is judged by the
 * process, not by the cancel's exit code: after the re-read, the record's pid gone, or held by another
 * program, reads as stopped; on Windows a pid whose command line names this job's `task-worker` is
 * ended here with `taskkill /PID {pid} /T /F`, no shell, then checked again. A lookup that errors, or
 * returns an empty command line, is no answer and never reads as stopped. Only a job still running —
 * by its process — is reported as that state with the cancel's error, never as `cancelled`. Node's own
 * warning lines never reach a `reason`.
 *
 * FINDING THE COMPANION. `NEXUS_CODEX_COMPANION` names it directly. Otherwise
 * `installed_plugins.json` under CLAUDE_CONFIG_DIR (or ~/.claude), the first `codex@` key: the entry
 * installed for this working directory first, else the user-scope entry, the highest version
 * within the chosen group. Project paths compare case-folded on Windows, whose paths are.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_LIMIT_MINUTES = 25;
const DEFAULT_MAX_SECONDS = 100;
const STATUS_GRACE_MS = 15000;
const READ_SLACK_MS = 5000;
const COLLECT_STATUS_MS = 30000;
const CANCEL_MS = 40000;
const QUIET_LIMIT_MS = 6 * 60000;
const SETUP_ALLOWANCE_MS = 60000;
const WAIT_FLOOR_MS = 1000;
const LOOKUP_MS = 3000;
const KILL_MS = 10000;
const RECHECK_MS = 2000;
const CODEX_EFFORTS = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'];
const KINDS = ['review', 'done-check', 'research'];
const TERMINAL = new Set(['completed', 'failed', 'cancelled']);
const PARTIAL_REASON = 'partial — Codex cancelled at the limit';
const STALL_REASON = 'stalled — no Codex output for 6 minutes';
const NO_VERDICT = 'no verdict returned';
const NO_OUTPUT = 'no output returned';
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

function resolveEffort(codex) {
  if (!('effort' in codex)) return null;
  if (CODEX_EFFORTS.includes(codex.effort)) return codex.effort;
  warn(`codex.effort is ${JSON.stringify(codex.effort)}, outside the Codex levels (${CODEX_EFFORTS.join(', ')}) — not sent.`);
  return null;
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
  return { path: script };
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

function companion(script, args, timeoutMs) {
  const res = spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, MSYS_NO_PATHCONV: '1', MSYS2_ARG_CONV_EXCL: '*' },
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
  const codex = readCodexConfig(process.cwd());
  const limit = resolveLimit(codex, opts['limit-minutes']);
  const effort = 'effort' in opts ? opts.effort : resolveEffort(codex);
  const unavailable = (why) => print(Date.now() < callStart + windowMs(limit * 60000)
    ? { unavailable: why, earlyFailure: true }
    : { unavailable: why });
  const found = findCompanion(process.cwd());
  if (found.unavailable) return unavailable(found.unavailable);

  const args = ['task', '--background', '--prompt-file', promptFile, '--json'];
  if (effort) args.push('--effort', effort);
  const startedAt = new Date();
  const res = companion(found.path, args, 120000);
  const jobId = res.json && res.json.jobId;
  if (!res.ok || !jobId) return unavailable(res.ok ? 'the Codex companion returned no job id' : res.reason);
  const deadline = new Date(startedAt.getTime() + limit * 60000);
  print({ jobId, startedAt: startedAt.toISOString(), deadline: deadline.toISOString(), effort: effort || null });
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
      const out = { state: s.state };
      return print(isJobFailure(out) ? flagEarly(out, a) : out);
    }
    const out = { state: s.state };
    const stall = stallOf(s.record, a.started);
    if (stall && stall.stalled) Object.assign(out, { stalled: true, quietMinutes: stall.quietMinutes });
    if (Date.now() >= a.deadline) out.deadlinePassed = true;
    return print(out);
  };

  const first = readStatus(a.found.path, a.job, 0, waitMs + STATUS_GRACE_MS);
  if (first.readError || TERMINAL.has(first.state)) return report(first);
  const stall = stallOf(first.record, a.started);
  if (stall && stall.stalled) return report(first);
  const timeLeft = budgetEnd - Date.now();
  const untilStall = stall ? Math.max(WAIT_FLOOR_MS, stall.due - Date.now()) : Infinity;
  const companionWait = Math.floor(Math.min(waitMs, untilStall, timeLeft - READ_SLACK_MS));
  if (companionWait < 1) return report(first);
  return report(readStatus(a.found.path, a.job, companionWait, timeLeft));
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

function finished(script, job, s, kind) {
  if (s.state === 'completed') {
    const res = companion(script, ['result', job], 60000);
    if (!res.ok) return { state: 'completed', output: '', verdict: null, reason: res.reason };
    if (kind === 'research') {
      return res.stdout.trim()
        ? { state: 'completed', output: res.stdout, verdict: null }
        : { state: 'completed', output: res.stdout, verdict: null, reason: NO_OUTPUT };
    }
    const verdict = kind === 'done-check' ? doneCheckVerdict(res.stdout) : findVerdict(res.stdout);
    return verdict
      ? { state: 'completed', output: res.stdout, verdict }
      : { state: 'completed', output: res.stdout, verdict: null, reason: NO_VERDICT };
  }
  const reason = s.reason || dropWarnings(s.record && s.record.errorMessage) || `the job ended ${s.state}`;
  return { state: s.state, output: '', verdict: null, reason };
}

function commandOverride(name) {
  try {
    const v = JSON.parse(process.env[name] || 'null');
    return Array.isArray(v) && v.length && v.every((x) => typeof x === 'string') ? v : null;
  } catch {
    return null;
  }
}

// Windows: 'gone', { commandLine }, or null when the lookup could not run or the command line is
// empty. Get-CimInstance errors are non-terminating: without Stop a denied query prints 'none'.
function lookupProcess(pid) {
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

// 'gone' (or held by another program), 'worker' (Windows: this job's), 'alive', or null (no answer).
function workerState(pid, jobId) {
  const platform = process.env.NEXUS_CODEX_PLATFORM || process.platform;
  if (platform !== 'win32') {
    try { process.kill(pid, 0); return 'alive'; } catch (e) { return e.code === 'EPERM' ? 'alive' : e.code === 'ESRCH' ? 'gone' : null; }
  }
  const found = lookupProcess(pid);
  if (found === null || found === 'gone') return found;
  return isWorkerOf(found.commandLine, jobId) ? 'worker' : 'gone';
}

function killTree(pid, jobId) {
  const [exe, ...lead] = commandOverride('NEXUS_CODEX_KILL') || ['taskkill'];
  spawnSync(exe, [...lead, '/PID', String(pid), '/T', '/F'], { encoding: 'utf8', timeout: KILL_MS, windowsHide: true });
  const end = Date.now() + RECHECK_MS;
  for (;;) {
    const state = workerState(pid, jobId);
    if (state === 'gone') return true;
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
  if (state === 'gone') return stopped();
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
  const s = readStatus(script, a.job, 0, COLLECT_STATUS_MS);
  if (TERMINAL.has(s.state)) {
    const out = finished(script, a.job, s, kind);
    return print(isJobFailure(out) ? flagEarly(out, a) : out);
  }
  if (Date.now() >= a.deadline) return print(cut(script, a.job, s, kind, null));
  const stall = s.readError ? null : stallOf(s.record, a.started);
  if (stall && stall.stalled) {
    const early = flagEarly({}, a, SETUP_ALLOWANCE_MS).earlyFailure === true;
    return print(cut(script, a.job, s, kind, { early }));
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
  return usage(`unknown subcommand ${JSON.stringify(sub || '')} — use start, wait or collect`);
}

main();
