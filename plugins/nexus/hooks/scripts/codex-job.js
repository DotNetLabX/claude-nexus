#!/usr/bin/env node
/**
 * Nexus codex-job: the one dispatch path for every Codex job, whichever seat starts it.
 *
 *   node codex-job.js start   --prompt-file <path> [--limit-minutes <n>]
 *   node codex-job.js wait    --job <id> --deadline <iso> [--max-seconds <n>]
 *   node codex-job.js collect --job <id> --deadline <iso>
 *
 * Every call prints one JSON object on stdout and exits 0 on every handled outcome — an unavailable
 * Codex, a failed or cancelled job, a job cut off at its limit. Exit 2 is reserved for a call the
 * helper cannot act on (a missing argument, a prompt file that does not exist), printed as `{error}`.
 *
 * RUN FROM THE SESSION ROOT, NEVER WITH A --cwd. The Codex companion keeps its job records per
 * working directory, so `start`, `wait` and `collect` find the same job only when all three run from
 * the same directory. A build in a worktree is named to Codex in the brief, not by moving the job.
 *
 * READ-ONLY BY CONSTRUCTION. `start` never sends `--write` or `--model`: the user's Codex config is
 * the model dial. It sends `--effort` only where the repo's `codex.effort` names a Codex level.
 *
 * ONE LIMIT, TOTAL TIME. `codex.timeLimitMinutes` (default 25) runs from the job's start, not from
 * its last output: Codex writes nothing while it reasons, so a busy job and a hung one look alike.
 * `wait` returns within --max-seconds (default 100) plus a 15-second grace for a hung companion,
 * inside the Bash tool's default two-minute timeout, so no caller needs a timeout argument; past the
 * deadline it adds `deadlinePassed` to an unfinished job's state, since an agent has no clock. At the
 * deadline `collect` re-reads the state, allowing that read 30 seconds of its own: a read cut off reads
 * as `failed` and would skip the cancel. A job that just finished is taken; otherwise `collect` cancels
 * it and returns the job's whole log as `partial`; the caller runs its fallback as well. A cancel
 * that fails on a job still running is reported as that state with the cancel's error, never as
 * `cancelled`.
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
const COLLECT_STATUS_MS = 30000;
const CODEX_EFFORTS = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'];
const TERMINAL = new Set(['completed', 'failed', 'cancelled']);
const PARTIAL_REASON = 'partial — Codex cancelled at the limit';
const NO_VERDICT = 'no verdict returned';

function print(obj) { process.stdout.write(JSON.stringify(obj) + '\n'); }
function warn(line) { process.stderr.write(line + '\n'); }

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

function companion(script, args, timeoutMs) {
  const res = spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    timeout: timeoutMs,
    windowsHide: true,
  });
  const ok = res.status === 0 && !res.error;
  const reason = (res.stderr || '').trim() || (res.error && res.error.message) || `the Codex companion exited ${res.status}`;
  let json = null;
  try { json = JSON.parse(res.stdout); } catch { /* text output, or none */ }
  return { ok, stdout: res.stdout || '', json, reason };
}

function cmdStart(opts) {
  if (!opts['prompt-file'] || opts['prompt-file'] === true) return usage('start needs --prompt-file <path>');
  const promptFile = path.resolve(opts['prompt-file']);
  if (!fs.existsSync(promptFile)) return usage(`prompt file not found: ${promptFile}`);
  const codex = readCodexConfig(process.cwd());
  const limit = resolveLimit(codex, opts['limit-minutes']);
  const effort = resolveEffort(codex);
  const found = findCompanion(process.cwd());
  if (found.unavailable) return print({ unavailable: found.unavailable });

  const args = ['task', '--background', '--prompt-file', promptFile, '--json'];
  if (effort) args.push('--effort', effort);
  const startedAt = new Date();
  const res = companion(found.path, args, 120000);
  const jobId = res.json && res.json.jobId;
  if (!res.ok || !jobId) return print({ unavailable: res.ok ? 'the Codex companion returned no job id' : res.reason });
  const deadline = new Date(startedAt.getTime() + limit * 60000);
  print({ jobId, startedAt: startedAt.toISOString(), deadline: deadline.toISOString() });
}

function jobArgs(opts, sub) {
  if (!opts.job || opts.job === true) return usage(`${sub} needs --job <id>`);
  const deadline = Date.parse(opts.deadline);
  if (!opts.deadline || opts.deadline === true || Number.isNaN(deadline)) return usage(`${sub} needs --deadline <iso time>`);
  const found = findCompanion(process.cwd());
  return { job: String(opts.job), deadline, found };
}

function readStatus(script, job, waitMs, timeoutMs = waitMs + STATUS_GRACE_MS) {
  const args = waitMs > 0
    ? ['status', job, '--wait', '--timeout-ms', String(waitMs), '--json']
    : ['status', job, '--json'];
  const res = companion(script, args, timeoutMs);
  const record = res.json && res.json.job;
  if (!res.ok || !record || typeof record.status !== 'string') {
    return { state: 'failed', reason: res.ok ? 'the Codex companion returned no job state' : res.reason };
  }
  return { state: record.status, record };
}

function cmdWait(opts) {
  const a = jobArgs(opts, 'wait');
  if (!a) return;
  if (a.found.unavailable) return print({ state: 'failed', reason: a.found.unavailable });
  const max = Number(opts['max-seconds']);
  const maxMs = (isPositive(max) ? max : DEFAULT_MAX_SECONDS) * 1000;
  const waitMs = Math.max(0, Math.min(maxMs, a.deadline - Date.now()));
  const s = readStatus(a.found.path, a.job, Math.floor(waitMs));
  const out = s.reason ? { state: s.state, reason: s.reason } : { state: s.state };
  if (!TERMINAL.has(s.state) && Date.now() >= a.deadline) out.deadlinePassed = true;
  print(out);
}

// The last verdict line wins: a reply that reconsiders ends on its final word.
function findVerdict(text) {
  const re = /^[-#>*\s]*verdict\s*:?[*\s]*(NO-GO|GO)\b/gim;
  let verdict = null;
  for (let m = re.exec(text); m; m = re.exec(text)) verdict = m[1].toUpperCase();
  return verdict;
}

function readLog(record) {
  try {
    return fs.readFileSync(record.logFile, 'utf8');
  } catch {
    return '';
  }
}

function finished(script, job, s) {
  if (s.state === 'completed') {
    const res = companion(script, ['result', job], 60000);
    if (!res.ok) return { state: 'completed', output: '', verdict: null, reason: res.reason };
    const verdict = findVerdict(res.stdout);
    return verdict
      ? { state: 'completed', output: res.stdout, verdict }
      : { state: 'completed', output: res.stdout, verdict: null, reason: NO_VERDICT };
  }
  const reason = s.reason || (s.record && s.record.errorMessage) || `the job ended ${s.state}`;
  return { state: s.state, output: '', verdict: null, reason };
}

function cmdCollect(opts) {
  const a = jobArgs(opts, 'collect');
  if (!a) return;
  if (a.found.unavailable) return print({ state: 'failed', output: '', verdict: null, reason: a.found.unavailable });
  const script = a.found.path;
  let s = readStatus(script, a.job, 0, COLLECT_STATUS_MS);
  if (TERMINAL.has(s.state)) return print(finished(script, a.job, s));
  if (Date.now() < a.deadline) {
    return print({ state: s.state, output: '', verdict: null, reason: 'still running — wait until the deadline' });
  }
  const cancel = companion(script, ['cancel', a.job, '--json'], 60000);
  if (!cancel.ok) {
    s = readStatus(script, a.job, 0, COLLECT_STATUS_MS);
    if (TERMINAL.has(s.state)) return print(finished(script, a.job, s));
    return print({ state: s.state, output: '', verdict: null, reason: `cancel failed: ${cancel.reason}`, partial: readLog(s.record || {}) });
  }
  print({ state: 'cancelled', output: '', verdict: null, reason: PARTIAL_REASON, partial: readLog(s.record || {}) });
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
