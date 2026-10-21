#!/usr/bin/env node
/**
 * Nexus verify-run: the runner for a declared verify role (F81, KH feedback item 2).
 *
 *   node verify-run.js --profile fast [--files <test file>...] [--light] [--timeout-ms N] [--tree <path>] [--session <id>]
 *   node verify-run.js --profile fast --tied --changed <file>... [--slug <slug>] [--light] …
 *   node verify-run.js --profile complete --slug <slug> [--timeout-ms N] [--tree <path>] [--session <id>]
 *   node verify-run.js --role <name> [--slug <slug>] …   (the same runs, addressed by role)
 *
 * THE STEP LIMIT. A step close — `--profile fast`, or `--role unit` — runs under `--timeout-ms`, else
 * the repo's top-level `stepLimitSeconds` (a whole number > 0; anything else is ignored with a stderr
 * line), else 90 s; those two are clamped to 110 s, and `--light` halves them (floor 15 s), while an
 * explicit `--timeout-ms` passes through as given. Its record carries
 * `limit_ms`. A cut run stays `verdict: "fail"`, `reason: "timeout"`, and never feeds `fast_green`.
 * THE FULL-RUN LIMIT. A full run — `--profile complete`, or `--role full` — runs under `--timeout-ms`,
 * else the repo's top-level `fullLimitSeconds` (read as `stepLimitSeconds` is), else 10 minutes, never
 * clamped or halved; its record carries `limit_ms`, and a cut one names the limit and the setting.
 * Every other run defaults to 30 minutes.
 * THE PER-TEST STOPS. `testStop.fastSeconds` (3) and `testStop.slowSeconds` (30), beside them
 * `speedUpSeconds` (5), are read as `stepLimitSeconds` is; `slow.labelled: true` says the repo's slow
 * tests carry their label, and only then does a fast test run under the fast stop
 * (lib/compose-test-command.js composes the legs). readTestEvents reads the core reporter's events into
 * the record's `timed_out` and `failed_tests`, and each timed-out test is marked `touched` by the change
 * before the record is written (lib/run-verdict.js `markTouched`, where the close rule lives too).
 *
 * A STEP CLOSE TIMES ITS TESTS. A `--files` or `--tied` record carries `test_times`, `over_speed_up` and
 * `timed_hashes`, executed tests only, which label-tests.js labels from. Node's come from the core
 * reporter's events; a vstest or flutter step close this runner composed adds the runner's own report
 * (`--logger trx` into a per-run folder, `--reporter json` on stdout), read through lib/test-labels.js. Their
 * `timed_out` stays null: neither runner's timeouts are told apart here.
 *
 * PROFILES ARE ALIASES, NEVER NEW KEYS: `fast` runs roles.unit (the step close) and
 * `complete` runs roles.full (the close gate's suite, 10 min default, --slug required). `--files`
 * runs only the named test files, composed by lib/compose-test-command.js for `slow.runner`, else for
 * the runner the declared unit invokes — never spliced into the declared unit string. The named files
 * run WHOLE, slow tests included: a developer names a file to see its tests, the tagged one it is
 * editing among them.
 *
 * `--tied --changed` runs the tests tied to the named changed files (lib/tied-tests.js), recorded with
 * `files` (the tied test files or projects), `tied: true`, `changed` and `changed_hashes`; a change it
 * cannot tie runs roles.unit whole, its record naming why in `tied_fallback`. An undeclared unit exits 3
 * and writes nothing. A full record carries `file_hashes` (lib/tree-hash.js's per-file form) and `failed`: the test files or projects its output names as
 * failing, `[]` when it passed, `null` when the run was cut or crashed, names a failure it cannot place,
 * was aborted, or ran anything but the test runner invoked directly as its last stage, after setup stages only. A fast record with a slug, written after a full
 * record of that slug on the same tree, carries `delta_base` (that record's `ts`) and `delta_hashes`
 * (the files whose content then differed from its `file_hashes`, at their content then) — the content a
 * gear's close repair ran at (lib/gear-close.js).
 *
 * EVERY RECORD CARRIES `tree_hash` (lib/tree-hash.js), and a `full` record adds `filtered` (its command
 * carries a filter clause) and `fast_green` (the latest whole fast record's verdict on the same tree at
 * the same hash, else `none` — and `none` when that record was cut at its limit). The close gate reuses a passing record only while the hash still matches.
 *
 * WHY NOT A HOOK. The close gate has to run the repo's full suite, and that suite cannot live in
 * verify-gate.js: that hook caps each command at 120 s (hooks.json's outer cap is 180 s) and a
 * measured consuming-repo suite takes ~7 minutes. It must not be a SUBAGENT's op either — the
 * platform's 600 s no-output watchdog kills a subagent mid-suite, and the Bash tool's own hard cap
 * is 600,000 ms. So the full suite runs HERE, from the main session, where neither limit applies.
 *
 * WHY IT RECORDS RATHER THAN RETURNS. "The suite passed" has to survive the turn that ran it: the
 * team lead reads the record at close, and pipeline-gate.js refuses a summary.md write without one
 * (Step 4). A verdict that exists only as console output is a claim; a verdict on disk is evidence.
 * Enforcement by CONSUMING a record is ADR-31's shape, reused rather than reinvented.
 *
 * ONE AUDIT FILE, ONE GRAMMAR. Records are appended to .claude/audit/verify-verdict.json in
 * verify-gate's shape (JSON line per record, same `ts`/`session`/`token`/`tree` fields) plus `role`,
 * `source: "verify-run"` and `duration_ms`. The team lead already parses that file line by line; a
 * second file or a second shape would need a second reader for no gain.
 *
 * AN UNDECLARED ROLE IS RECORDED, NEVER SILENT. If the repo declared no such role the run writes
 * verdict:"undeclared" and exits 0. That is the honest outcome — nothing ran, and the close gate
 * discloses it in summary.md — and it is deliberately distinguishable from a pass. A silent skip
 * here would be the false-green the whole verdict substrate exists to prevent.
 *
 * A RUN ENDED AT ITS LIMIT ENDS EVERYTHING IT STARTED. A synchronous exec's timeout ends only the
 * shell, and the test runner under it ran on. So the command — a shell, or a node leg started with none —
 * starts as the head of its own process group (POSIX) or as a root taskkill can walk (Windows), and the
 * whole tree is ended
 * at the limit, on output overflow, and when this runner is itself interrupted.
 *
 * THE RUN KEEPS ITS CALLER'S PRIORITY. A suite lowered below normal on a busy machine fails its
 * timing-dependent tests; a suite that must leave room for other work caps its own parallelism in
 * the command the repo declares.
 *
 * A COMPLETE RUN KNOWS ITS USUAL TIME, AND A SLOW ONE IS REPORTED, NEVER STOPPED. The usual time is
 * the median `duration_ms` of the last 10 passing complete runs of the same command in this log, from
 * 5 such runs on. At 1.5x it the runner writes one stderr line while the run goes on, and the record
 * carries `usual_ms` and `slow`, pass or fail. Stopping at 2x would have stopped about 1 in 20 healthy
 * runs here, and a stopped run never enters a passing-only figure, so a lasting slowdown would stop
 * every run after it.
 *
 * COMPLETE RUNS TAKE TURNS ACROSS THE MACHINE, BEST EFFORT. At most NEXUS_COMPLETE_RUNS_AT_ONCE (default
 * 2; 0 turns it off) run at once over every repo, session and profile of the user; the rest wait, say
 * so, and record `waited_ms` and `others` — the wait counts toward neither `duration_ms` nor the limit.
 * `waited_ms` includes the settle period, so a run that never waited records about 500 ms; contention
 * shows as `others` and the waiting line, never as `waited_ms` above zero.
 * Each run publishes its own uniquely named claim in NEXUS_RUN_SLOTS_DIR (else ~/.nexus/run-slots),
 * refreshes it every 10 s, settles, and starts when the started claims plus its place among the waiting
 * ones (by claim time, then name) are under the limit. A claim is stale once its heartbeat is 60 s old,
 * past its expiry (wait cap + the run's limit + 1 min), or unparsable; a claim kept on purpose because
 * the command's tree could not be confirmed ended lives until that expiry. A stale claim is skipped,
 * never renamed, rewritten or deleted by another run; only its owner deletes it, on release. Any run
 * sweeps a file named like a claim once it is a day past its expiry, or unparsable and a day unwritten,
 * ignoring any error. A run started inside a live claim
 * (NEXUS_COMPLETE_RUN_CLAIM) takes no turn. A broken folder never blocks: the run goes ahead as
 * `slot: "unavailable"` — also the record's slot when, after the turn, the claim can no longer be
 * refreshed or released; at the wait cap (NEXUS_SLOT_WAIT_MS, 30 min) as `"waited out"`. Accepted gaps:
 * a runner stalled past the settle period between its read and marking itself started can start beside
 * one other run; a hard-killed runner's suite stops counting 60 s after its heartbeat stops; a run
 * whose heartbeat stalled past a minute (a machine asleep) is uncounted until its next heartbeat; a
 * hard-killed runner's claim stays in the folder until the sweep; a retained tree still alive past
 * its expiry is a runaway and no longer counts.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { resolveDeclaredTree } = require('./lib/worktree-target');
const { filesCommand, isFilteredFull, nodeLegs, nodeSupportsSkipPattern, PRELOAD_URL } = require('./lib/compose-test-command');
const { parseTrx, parseFlutterJson, sourceFiles, dotnetClassFile, dotnetMethodLine } = require('./lib/test-labels');
const { hashTree, fileHash, sameTree } = require('./lib/tree-hash');
const { tiedSet, failedTargets, declaredFor, nodeInvocation, runnerOf } = require('./lib/tied-tests');
const { deltaSince } = require('./lib/gear-close');
const { markTouched } = require('./lib/run-verdict');

// The full run, from the main session where the Bash tool's cap does not apply: a repo whose suite
// runs longer declares `fullLimitSeconds`, so the cut is never clamped.
const FULL_TIMEOUT_MS = 600000;
// Every bare role that is neither a step close nor the full run — a build, a mutation run.
const DEFAULT_TIMEOUT_MS = 1800000;
// The step close (`--profile fast` or `--role unit`) runs under, in order: `--timeout-ms`, the repo's
// `stepLimitSeconds`, this default. The last two are clamped to the ceiling, below the Bash tool's
// 120 s so the `timeout` record lands before a Bash call the caller did not size; an explicit
// `--timeout-ms` is the caller's, who sizes that call too, so it passes through. `--light` halves a
// declared or default limit, never below the floor and never above the limit itself.
const FAST_TIMEOUT_MS = 90000;
const STEP_CEILING_MS = 110000;
const LIGHT_FLOOR_MS = 15000;
// The per-test stops (`testStop.fastSeconds`, `testStop.slowSeconds`) and the line over which a test the
// developer wrote or touched gets one speed-up try (`speedUpSeconds`).
const FAST_STOP_MS = 3000;
const SLOW_STOP_MS = 30000;
const SPEED_UP_MS = 5000;
const NODE_TEST_FILE = /\.test\.(mjs|js|cjs)$/;
// verify-gate's bound, and for its reason: a big suite's output clears 1 MB exactly when the
// excerpt matters most, and an ENOBUFS kill would turn a green run into a recorded red.
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024;
const EXCERPT_HEAD = 400;
const EXCERPT_TAIL = 1200;
// A process outside the ended tree can still hold the output pipes open; past this the runner closes
// them itself rather than wait on it.
const PIPE_GRACE_MS = 2000;
const USUAL_WINDOW = 10;
const USUAL_MIN_RUNS = 5;
const SLOW_RATIO = 1.5;
const DEFAULT_RUNS_AT_ONCE = 2;
const HEARTBEAT_MS = 10000;
// A claim whose heartbeat is older than this is stale; also the slack added to a claim's expiry.
const CLAIM_STALE_MS = 60000;
// How long past its expiry, or past its last write when unreadable, a claim file waits before any run
// may delete it — long past any run that could still own it.
const SWEEP_AFTER_MS = 24 * 3600000;
const DEFAULT_SETTLE_MS = 500;
const DEFAULT_POLL_MS = 2000;
const DEFAULT_SLOT_WAIT_MS = 1800000;

function startOptions(platform, cwd) {
  return { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, detached: platform !== 'win32' };
}

function runHidden(file, args) {
  return spawnSync(file, args, { stdio: 'ignore', windowsHide: true });
}

// taskkill runs with no shell: Git Bash rewrites `/PID`. A failed taskkill is never read as ended: a
// shell already gone says nothing of what it started, which taskkill can no longer find from it. A
// process group, by contrast, exists while any member does, so ESRCH on it means nothing is left.
function endTree(platform, pid, { run = runHidden, signal = (target, sig) => process.kill(target, sig) } = {}) {
  if (platform === 'win32') {
    const res = run('taskkill', ['/PID', String(pid), '/T', '/F']);
    return Boolean(res && !res.error && res.status === 0);
  }
  try {
    signal(-pid, 'SIGKILL');
    return true;
  } catch (err) {
    return Boolean(err && err.code === 'ESRCH');
  }
}

let running = null;
let releaseTurn = () => {};

function endRunningOnSignal(sig, code) {
  process.once(sig, () => {
    releaseTurn(running ? endTree(process.platform, running.pid) : true);
    process.exit(code);
  });
}

// Resolves with execSync's failure vocabulary: `code` ETIMEDOUT / ENOBUFS / a spawn errno, else the
// exit `status` or the `signal`, plus `tree` — whether the tree was ended when the runner ended it.
// `cmd` is a shell string, or `{shell}` / `{file, args}` with an `env` laid over this process's.
function runCommand(cmd, cwd, timeoutMs, platform = process.platform) {
  return new Promise((resolve) => {
    const out = [];
    const err = [];
    let bytes = 0;
    let code = null;
    let tree = null;
    let settled = false;
    let grace = null;
    let child;
    const finish = (status, sig) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(grace);
      running = null;
      resolve({ code, status, signal: sig, tree, pid: child && child.pid,
        stdout: Buffer.concat(out).toString(), stderr: Buffer.concat(err).toString() });
    };
    const stop = (why) => {
      if (code) return;
      code = why;
      tree = endTree(platform, child.pid);
      grace = setTimeout(() => {
        child.stdout.destroy();
        child.stderr.destroy();
        finish(null, null);
      }, PIPE_GRACE_MS);
    };
    const timer = setTimeout(() => stop('ETIMEDOUT'), timeoutMs);
    const item = typeof cmd === 'string' ? { shell: cmd } : cmd;
    const env = item.env ? { ...process.env, ...item.env } : process.env;
    try {
      child = item.file
        ? spawn(item.file, item.args, { ...startOptions(platform, cwd), shell: false, env })
        : spawn(item.shell, { ...startOptions(platform, cwd), env });
    } catch (e) {
      code = (e && e.code) || 'spawn failed';
      finish(null, null);
      return;
    }
    running = child;
    const take = (sink) => (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_OUTPUT_BYTES) stop('ENOBUFS');
      else sink.push(chunk);
    };
    child.stdout.on('data', take(out));
    child.stderr.on('data', take(err));
    child.on('error', (e) => {
      if (!code) code = (e && e.code) || 'spawn failed';
      finish(null, null);
    });
    child.on('close', (status, sig) => finish(status, sig));
  });
}

function excerpt(text) {
  const s = String(text || '');
  if (s.length <= EXCERPT_HEAD + EXCERPT_TAIL) return s;
  const dropped = s.length - EXCERPT_HEAD - EXCERPT_TAIL;
  return `${s.slice(0, EXCERPT_HEAD)}\n… [${dropped} chars elided] …\n${s.slice(-EXCERPT_TAIL)}`;
}

// The failure classes a reader cannot otherwise diagnose: a timeout often ends with no output at all,
// and an overflow ends while the output holds megabytes of healthy lines. Naming the cause is what
// keeps a red attributable.
function failureCause(e) {
  if (!e) return 'unknown error';
  if (e.code) return String(e.code);
  if (e.signal) return `killed by ${e.signal}`;
  if (typeof e.status === 'number') return `exit status ${e.status}`;
  return 'unknown error';
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!flag.startsWith('--')) continue;
    if (flag === '--files' || flag === '--changed') {
      const list = [];
      while (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) list.push(argv[++i]);
      out[flag.slice(2)] = list;
      continue;
    }
    out[flag.slice(2)] = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

const PROFILE_ROLES = { fast: 'unit', complete: 'full' };

function readLog(root) {
  let lines = [];
  try { lines = fs.readFileSync(path.join(root, '.claude', 'audit', 'verify-verdict.json'), 'utf8').split('\n'); } catch { return []; }
  const out = [];
  for (const line of lines) {
    try { out.push(JSON.parse(line)); } catch { /* a torn or blank line */ }
  }
  return out;
}

// "Was this tree fast-green when the complete run saw it?" — the latest whole-suite fast record on the
// same tree at the same hash. A named-files record is a partial run, never a fast-green. Both hashes are
// post-run, so this reads `none` forever in a repo whose complete suite rewrites a tracked file the hash
// counts (lib/tree-hash.js) that the fast run leaves alone: a `0 / 0` tally is diagnosed there first.
function fastGreen(root, tree, hash) {
  if (!hash) return 'none';
  let latest = null;
  for (const rec of readLog(root)) {
    if (!rec || rec.profile !== 'fast' || rec.files !== undefined) continue;
    if (!sameTree(rec.tree, tree) || rec.tree_hash !== hash) continue;
    latest = rec;
  }
  if (!latest || latest.reason === 'timeout') return 'none';
  return latest.verdict === 'pass' || latest.verdict === 'fail' ? latest.verdict : 'none';
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function usualTime(records, command) {
  const runs = records.filter((r) => r && r.source === 'verify-run' && r.role === 'full' && r.command === command
    && r.verdict === 'pass' && typeof r.duration_ms === 'number' && Number.isFinite(r.duration_ms));
  if (runs.length < USUAL_MIN_RUNS) return null;
  const window = runs.slice(-USUAL_WINDOW);
  return { usual_ms: Math.round(median(window.map((r) => r.duration_ms))), last_ms: window[window.length - 1].duration_ms };
}

function slowField(durationMs, usual) {
  if (!usual || !(durationMs >= SLOW_RATIO * usual.usual_ms)) return null;
  return { ratio: Math.round((durationMs / usual.usual_ms) * 10) / 10, usual_ms: usual.usual_ms, last_ms: usual.last_ms };
}

function humanMs(ms) {
  return ms >= 60000 ? `${(ms / 60000).toFixed(1)} min` : `${(ms / 1000).toFixed(1)} s`;
}

function slowLine(ratio, usual) {
  return `verify-run: this complete run has reached ${ratio}x its usual time (${humanMs(usual.usual_ms)}; the last passing run took ${humanMs(usual.last_ms)}) — it goes on, nothing is stopped\n`;
}

function runsAtOnce(raw, note = () => {}) {
  if (raw === undefined || raw === '') return DEFAULT_RUNS_AT_ONCE;
  if (/^\d+$/.test(raw)) return Number(raw);
  note(`NEXUS_COMPLETE_RUNS_AT_ONCE is ${JSON.stringify(raw)}, not a whole number >= 0 — using ${DEFAULT_RUNS_AT_ONCE}`);
  return DEFAULT_RUNS_AT_ONCE;
}

function wholeMs(raw, fallback) {
  return typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : fallback;
}

// Absolute, so a nested run started from another folder is handed a claim path that names this one.
function slotsDir(env) {
  return path.resolve(env.NEXUS_RUN_SLOTS_DIR || path.join(require('os').homedir(), '.nexus', 'run-slots'));
}

function removeQuietly(file) {
  try { fs.unlinkSync(file); } catch { /* already gone, or another cleaner's */ }
}

// A reader or a virus scanner holding a file open makes an operation on it fail briefly on Windows.
const SHARING = ['EPERM', 'EACCES', 'EBUSY'];
function retrying(op) {
  for (let attempt = 1; ; attempt++) {
    try {
      return op();
    } catch (e) {
      if (attempt >= 5 || !SHARING.includes(e && e.code)) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
    }
  }
}

// Only files of these shapes are ever swept from the folder; anything else in it is left alone.
const CLAIM_NAME = /^\d+-\d+-[0-9a-f]{8}\.json$/;
const TMP_NAME = /^\d+-\d+-[0-9a-f]{8}\.json\.tmp$/;

function claimLive(claim, mtimeMs, now) {
  if (!claim || typeof claim !== 'object') return false;
  if (typeof claim.expires === 'number' && now > claim.expires) return false;
  return claim.retained === true || now - mtimeMs < CLAIM_STALE_MS;
}

// A stale claim is skipped, never touched: its owner may still be alive (a machine asleep) and refresh
// it. A file is swept only once no run can still own it — a claim a day past its expiry, or a claim or
// temporary file that cannot be read as a claim and has not been written for a day. Sweeping never
// changes what is counted, so its errors are ignored.
function sweepable(file, claim, mtimeMs, now) {
  if (TMP_NAME.test(file)) return now - mtimeMs > SWEEP_AFTER_MS;
  if (!CLAIM_NAME.test(file)) return false;
  if (claim && typeof claim === 'object' && typeof claim.expires === 'number') return now > claim.expires + SWEEP_AFTER_MS;
  return !(claim && typeof claim === 'object') && now - mtimeMs > SWEEP_AFTER_MS;
}

// The live claims in the folder. A claim gone between the listing and its read is a normal race; any
// other error listing the folder or reading a claim, once retried, throws, so a claim that cannot be
// seen never silently stops counting.
function readClaims(dir, {
  now = Date.now(),
  list = () => fs.readdirSync(dir),
  read = (full) => ({ mtimeMs: fs.statSync(full).mtimeMs, text: fs.readFileSync(full, 'utf8') }),
  remove = (full) => fs.unlinkSync(full),
} = {}) {
  const live = [];
  const sweep = (full) => { try { remove(full); } catch { /* another run swept it, or it is held */ } };
  for (const file of list()) {
    const full = path.join(dir, file);
    if (TMP_NAME.test(file)) {
      try { if (sweepable(file, null, fs.statSync(full).mtimeMs, now)) sweep(full); } catch { /* gone */ }
      continue;
    }
    if (!file.endsWith('.json')) continue;
    let seen;
    try {
      seen = retrying(() => read(full));
    } catch (e) {
      if (e && e.code === 'ENOENT') continue;
      throw e;
    }
    let claim = null;
    try { claim = JSON.parse(seen.text); } catch { /* torn or foreign */ }
    if (claimLive(claim, seen.mtimeMs, now)) live.push({ file, claim, mtimeMs: seen.mtimeMs });
    else if (sweepable(file, claim, seen.mtimeMs, now)) sweep(full);
  }
  return live;
}

function mayStart(live, ownFile, n) {
  const started = live.filter((c) => c.file !== ownFile && c.claim.started === true).length;
  const waiting = live.filter((c) => c.file === ownFile || c.claim.started !== true)
    .sort((a, b) => (Number(a.claim.claimed) - Number(b.claim.claimed)) || (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  const ahead = started + waiting.findIndex((c) => c.file === ownFile);
  return { ok: ahead < n, ahead };
}

function claimFileLive(file, now = Date.now()) {
  try {
    const mtimeMs = fs.statSync(file).mtimeMs;
    return claimLive(JSON.parse(fs.readFileSync(file, 'utf8')), mtimeMs, now);
  } catch {
    return false;
  }
}

// Through a temporary file and a rename, so a reader never sees half a claim.
function writeClaim(file, claim) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(claim));
  try {
    retrying(() => fs.renameSync(tmp, file));
  } catch (e) {
    removeQuietly(tmp);
    throw e;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CLAIM_IO = {
  touch: (file) => { const t = new Date(); fs.utimesSync(file, t, t); },
  write: writeClaim,
  remove: (file) => fs.unlinkSync(file),
};

// Takes a turn in the machine-wide queue and resolves with the record fields and the held claim's path.
// The fields object stays live: a heartbeat lost after the turn, or a release that fails, sets
// `slot: "unavailable"` on it, and the caller writes it into the record after releasing.
// `hold` receives `release(treeEnded)` as soon as a claim exists, so a signal during the wait releases
// it too; release deletes the claim, or keeps it `retained` until its expiry when the command's tree
// could not be confirmed ended.
async function takeTurn({ env, n, settleMs, pollMs, waitCapMs, heartbeatMs = HEARTBEAT_MS, runLimitMs, info, say, hold = () => {}, io = {} }) {
  const ops = { ...CLAIM_IO, ...io };
  const t0 = Date.now();
  const fields = {};
  const name = `${process.pid}-${t0}-${require('crypto').randomBytes(4).toString('hex')}.json`;
  let dir = '';
  let file = '';
  let claim = { pid: process.pid, started: false, claimed: t0, expires: t0 + waitCapMs + runLimitMs + CLAIM_STALE_MS, ...info };
  let beat = null;
  const lost = (line) => {
    if (fields.slot === 'unavailable') return;
    fields.slot = 'unavailable';
    say(line);
  };
  const unavailable = (why) => {
    clearInterval(beat);
    if (file) removeQuietly(file);
    hold(() => {});
    say(`the queue folder ${dir || '(not found)'} cannot be used (${why}) — running without a turn`);
    return { fields: Object.assign(fields, { slot: 'unavailable', waited_ms: Date.now() - t0 }), claimFile: null };
  };
  const cause = (e) => (e && e.code) || String(e);
  try {
    dir = slotsDir(env);
    fs.mkdirSync(dir, { recursive: true });
    file = path.join(dir, name);
    ops.write(file, claim);
  } catch (e) {
    return unavailable(cause(e));
  }
  // A claim gone from the folder (cleared by hand, or swept after a machine slept a day) is written
  // again, so a live run never stays uncounted. Before the turn the wait loop
  // decides what a failure means; after it, a claim that can be neither touched nor written again no
  // longer protects the run, and the record says so.
  let admitted = false;
  const refresh = () => {
    try { ops.touch(file); return; } catch { /* gone or blocked: write it again */ }
    try {
      ops.write(file, claim);
    } catch (e) {
      if (admitted) lost(`the claim ${file} can no longer be refreshed (${cause(e)}) — the run goes on, no longer counted by other runs`);
    }
  };
  beat = setInterval(refresh, Math.max(1, heartbeatMs));
  beat.unref();
  let released = false;
  const release = (treeEnded) => {
    if (released) return;
    released = true;
    clearInterval(beat);
    try {
      if (treeEnded === false) ops.write(file, { ...claim, retained: true });
      else retrying(() => { try { ops.remove(file); } catch (e) { if (!(e && e.code === 'ENOENT')) throw e; } });
    } catch (e) {
      lost(treeEnded === false
        ? `the claim ${file} could not be kept (${cause(e)}) — its place is freed a minute after its last heartbeat, though the command's tree may still run`
        : `the claim ${file} could not be removed (${cause(e)}) — it holds a place until its heartbeat is a minute old`);
    }
  };
  hold(release);
  await sleep(settleMs);
  let said = false;
  for (;;) {
    let live;
    try { live = readClaims(dir); } catch (e) { return unavailable(cause(e)); }
    if (!live.some((c) => c.file === name)) {
      try { ops.write(file, claim); } catch (e) { return unavailable(cause(e)); }
      live.push({ file: name, claim, mtimeMs: Date.now() });
    }
    if (fields.others === undefined) fields.others = live.length - 1;
    const turn = mayStart(live, name, n);
    if (turn.ok || Date.now() - t0 >= waitCapMs) {
      claim = { ...claim, started: true };
      try { ops.write(file, claim); } catch (e) { return unavailable(cause(e)); }
      admitted = true;
      if (!turn.ok) fields.slot = 'waited out';
      fields.waited_ms = Date.now() - t0;
      return { fields, claimFile: file };
    }
    if (!said) {
      said = true;
      say(`waiting for a turn — ${turn.ahead} complete run(s) ahead, at most ${n} at once on this machine (NEXUS_COMPLETE_RUNS_AT_ONCE)`);
    }
    await sleep(Math.max(1, Math.min(pollMs, waitCapMs - (Date.now() - t0))));
  }
}

// `--timeout-ms` with no value parses to `true`, and Number(true) === 1 — which would cap a healthy
// suite at ONE millisecond and record a green run as `reason: "timeout"`, a false red that then
// blocks the close. Require an actual string before trusting the number.
function timeoutFor(profile, rawTimeout, { role = '', stepLimitSeconds, fullLimitSeconds, light = false, note = () => {} } = {}) {
  const explicit = typeof rawTimeout === 'string' && Number(rawTimeout) > 0 ? Number(rawTimeout) : null;
  if (explicit !== null) return explicit;
  if (profile === 'complete' || role === 'full') return settingMs('fullLimitSeconds', fullLimitSeconds, FULL_TIMEOUT_MS, note);
  if (profile !== 'fast' && role !== 'unit') return DEFAULT_TIMEOUT_MS;
  let limit = settingMs('stepLimitSeconds', stepLimitSeconds, FAST_TIMEOUT_MS, note);
  if (limit > STEP_CEILING_MS) {
    note(`step limit ${limit / 1000} s clamped to ${STEP_CEILING_MS / 1000} s (the Bash tool's 120 s cap)`);
    limit = STEP_CEILING_MS;
  }
  if (light) limit = Math.min(limit, Math.max(LIGHT_FLOOR_MS, limit / 2));
  return limit;
}

function settingMs(name, seconds, fallbackMs, note) {
  if (Number.isInteger(seconds) && seconds > 0) return seconds * 1000;
  if (seconds !== undefined) {
    note(`${name} is ${JSON.stringify(seconds)}, not a positive whole number of seconds — using ${fallbackMs / 1000} s`);
  }
  return fallbackMs;
}

// The per-test stops and the speed-up line, read beside stepLimitSeconds with the same fall-back.
function testSettings(cfg, note = () => {}) {
  let stop = cfg ? cfg.testStop : undefined;
  if (stop !== undefined && (stop === null || typeof stop !== 'object' || Array.isArray(stop))) {
    note(`testStop is ${JSON.stringify(stop)}, not an object — using its defaults`);
    stop = {};
  }
  stop = stop || {};
  return {
    fastMs: settingMs('testStop.fastSeconds', stop.fastSeconds, FAST_STOP_MS, note),
    slowMs: settingMs('testStop.slowSeconds', stop.slowSeconds, SLOW_STOP_MS, note),
    speedUpMs: settingMs('speedUpSeconds', cfg ? cfg.speedUpSeconds : undefined, SPEED_UP_MS, note),
    labelled: Boolean(cfg && cfg.slow && typeof cfg.slow === 'object' && cfg.slow.labelled === true),
  };
}

const slashed = (p) => String(p).replace(/\\/g, '/');

// The events file the core reporter (lib/test-reporter.mjs) wrote, read into the record's lists. The
// events are complete when every expected leg reported its end — the legs a wrapper announced plus `legs`,
// the number this runner ran itself, and a `shell` command among them announced its own; without that both
// lists are null, never empty. Only tests
// count: a suite's own failure is judged from its tests. A test is timed out when its failure carries
// the child-call stop (`child-stopped`), is the runner's timeout (`timeout`) or was cancelled by a
// parent cut (`cancelled-by-parent`); any other failure is a real one.
function readTestEvents(text, { legs = 0, shell = false, tree = '' } = {}) {
  const events = [];
  for (const line of String(text || '').split('\n')) {
    try { const e = JSON.parse(line); if (e && typeof e === 'object') events.push(e); } catch { /* a torn or blank line */ }
  }
  const announced = events.filter((e) => e.kind === 'legs' && Number.isInteger(e.legs));
  const expected = announced.reduce((n, e) => n + e.legs, 0) + legs;
  const ended = events.filter((e) => e.kind === 'run-end').length;
  // A command run through a shell that announced no legs may have stopped early: its events never count.
  const complete = expected > 0 && ended >= expected && (!shell || announced.length > 0);
  const fileOf = (f) => {
    if (!f) return null;
    const p = /^file:/.test(f) ? require('url').fileURLToPath(f) : f;
    return slashed(tree && path.isAbsolute(p) ? path.relative(tree, p) : p);
  };
  // A parent reports after its children, so the events still open at a deeper nesting of the same file when
  // a parent's own event arrives are its descendants. A test cancelled under a parent that failed for a real
  // reason — a hook that threw — did not time out: the parent's failure is the one counted.
  const nodes = events.filter((e) => e.kind === 'test' || e.kind === 'suite').map((e) => ({ e, parent: null }));
  const open = new Map();
  for (const node of nodes) {
    const key = String(node.e.file || '');
    const depth = Number(node.e.nesting) || 0;
    const pending = open.get(key) || [];
    open.set(key, pending.filter((child) => {
      if ((Number(child.e.nesting) || 0) <= depth) return true;
      if (!child.parent) child.parent = node;
      return false;
    }).concat(node));
  }
  const NOT_REAL = new Set(['subtestsFailed', 'testTimeoutFailure', 'cancelledByParent']);
  const realFailure = (e) => Boolean(e.failureType) && !NOT_REAL.has(e.failureType) && e.causeCode !== 'ERR_NEXUS_TEST_STOP';
  const underRealFailure = (node) => { for (let p = node.parent; p; p = p.parent) if (realFailure(p.e)) return true; return false; };
  const timedOut = [];
  const failed = [];
  const times = [];
  for (const node of nodes) {
    const { e } = node;
    if (e.skip || e.todo) continue;
    const at = { file: fileOf(e.file), line: e.line, test: e.test };
    if (e.kind === 'suite') {
      if (realFailure(e)) failed.push(at);
      continue;
    }
    if (!e.failureType) {
      if (typeof e.ms === 'number') times.push({ file: at.file, line: e.line, column: e.column, test: e.test, ms: e.ms });
      continue;
    }
    if (e.failureType === 'subtestsFailed') continue;
    let cause = null;
    if (e.causeCode === 'ERR_NEXUS_TEST_STOP') cause = 'child-stopped';
    else if (e.failureType === 'testTimeoutFailure') cause = 'timeout';
    else if (e.failureType === 'cancelledByParent') cause = underRealFailure(node) ? 'covered' : 'cancelled-by-parent';
    if (cause === 'covered') continue;
    if (cause) timedOut.push({ ...at, cause });
    else failed.push(at);
  }
  return { complete, timed_out: complete ? timedOut : null, failed_tests: complete ? failed : null, test_times: times };
}

let signalsWired = false;

async function main(argv = process.argv.slice(2), { env = process.env, run = runCommand, out = (s) => process.stdout.write(s) } = {}) {
  const args = parseArgs(argv);
  const profile = typeof args.profile === 'string' ? args.profile : '';
  if (args.profile !== undefined && !PROFILE_ROLES[profile]) {
    process.stderr.write('verify-run: --profile is fast or complete\n');
    return 2;
  }
  if (profile && args.role !== undefined) {
    process.stderr.write('verify-run: pass --profile or --role, not both\n');
    return 2;
  }
  const role = profile ? PROFILE_ROLES[profile] : (typeof args.role === 'string' ? args.role : '');
  if (!role) {
    // Names the four conventional roles as a hint, but any key the repo declares under `roles` runs —
    // the roster is the repo's, not this script's, so an unlisted role is `undeclared`, not rejected.
    process.stderr.write('verify-run: --role <name> is required (conventionally build|unit|full|mutation)\n');
    return 2;
  }
  const files = args.files || null;
  if (files && profile !== 'fast') {
    process.stderr.write('verify-run: --files <test file>... runs only with --profile fast\n');
    return 2;
  }
  if (files && files.length === 0) {
    process.stderr.write('verify-run: --files names no test file (the list is empty)\n');
    return 2;
  }
  const tied = args.tied !== undefined;
  const changed = args.changed || null;
  if (tied || changed) {
    let refusal = '';
    if (profile !== 'fast') refusal = '--tied --changed <file>... runs only with --profile fast';
    else if (!tied) refusal = '--changed <file>... is read only with --tied';
    else if (files) refusal = 'pass --tied or --files, not both';
    else if (!changed || changed.length === 0) refusal = '--tied needs --changed <file>... (the files this step changed)';
    if (refusal) {
      process.stderr.write(`verify-run: ${refusal}\n`);
      return 2;
    }
  }

  // THE ROUND KEY. A token-or-session match alone is not round-scoped: a session outlives a feature,
  // and a repo with no .pipeline-state has no token at all, so two closes in one session could
  // discharge each other. Required for `full` because `full` is the role the close gate consumes — a
  // full record that cannot name its round is worse than an absent one, because it still reads as
  // evidence. Optional for every other role: only `full` is consumed at close, and demanding a slug
  // for a step-close `unit` run would add ceremony to the loop this feature exists to shorten.
  // Checked BEFORE anything is resolved or run, and nothing is written when it fails — an unscoped
  // full record must never reach the log at all.
  const slug = typeof args.slug === 'string' ? args.slug : '';
  if (role === 'full' && !slug) {
    process.stderr.write("verify-run: --slug <slug> is required for --role full (the record's round key)\n");
    return 2;
  }

  // Root resolution mirrors the hooks' (CLAUDE_PROJECT_DIR || cwd), then honours a session-matching
  // .worktree-target line. --tree is the explicit override for a caller that already knows.
  const root = env.CLAUDE_PROJECT_DIR || process.cwd();
  // The harness exports CLAUDE_CODE_SESSION_ID (verified against a live environment). The shorter
  // CLAUDE_SESSION_ID is accepted as a secondary name only — do NOT rely on it alone: an env-var
  // name that is merely plausible yields an empty `session` on every run, which silently removes one
  // of the two scoping paths the close gate matches on.
  const session = typeof args.session === 'string'
    ? args.session
    : String(env.CLAUDE_CODE_SESSION_ID || env.CLAUDE_SESSION_ID || '');
  const tree = typeof args.tree === 'string' ? args.tree : resolveDeclaredTree(root, session);

  let token = '';
  try { token = fs.readFileSync(path.join(tree, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }

  let cfg = null;
  try { cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8')); }
  catch { /* absent or malformed → undeclared, recorded below */ }
  const declared = cfg && cfg.roles && cfg.roles[role];
  let commands = typeof declared === 'string' && declared.trim() !== '' ? [declared.trim()] : [];

  const settings = testSettings(cfg, (line) => process.stderr.write(`verify-run: ${line}\n`));
  // vstest and flutter take one stop, the slow one: neither is split into a fast and a slow set.
  const stopSeconds = settings.slowMs / 1000;
  const runner = runnerOf(cfg);
  const runId = `${Date.now().toString(36)}-${require('crypto').randomBytes(4).toString('hex')}`;
  let composed = false;
  let relFiles = null;
  if (files) {
    if (!runner) {
      process.stderr.write('verify-run: --files needs a runner — no slow.runner in .claude/verify.json and no recognised test invocation in roles.unit; declare verify roles first\n');
      return 2;
    }
    relFiles = files.map((f) => path.relative(tree, path.resolve(tree, f)).split(path.sep).join('/'));
    composed = true;
    try {
      commands = filesCommand({ runner, files: relFiles, exclude: false, cwd: tree, stopSeconds, note: (line) => process.stderr.write(`verify-run: ${line}\n`) });
    } catch (e) {
      process.stderr.write(`verify-run: ${e.message}\n`);
      return 2;
    }
  }
  // An undeclared unit writes no record: the developer's own fallback runs instead, and a tied record
  // that ran nothing must never read as covering the change.
  let tiedFields = null;
  let changedTests = [];
  if (tied) {
    if (commands.length === 0) {
      process.stderr.write('verify-run: --tied: no roles.unit declared in .claude/verify.json — nothing ran and nothing is recorded; take the undeclared-unit fallback\n');
      return 3;
    }
    const set = tiedSet({ repo: tree, changed, ...declaredFor(cfg), stopSeconds });
    if (set.fallback) {
      process.stderr.write(`verify-run: tied: ${set.fallback} — running roles.unit\n`);
      // The test files the change itself touched run beside the whole unit, timed, whatever it holds.
      if (runner === 'node') changedTests = set.changed.filter((f) => NODE_TEST_FILE.test(f) && fs.existsSync(path.join(tree, f)));
      if (changedTests.length) commands = [...commands, ...filesCommand({ runner, files: changedTests, exclude: false, cwd: tree })];
    } else {
      commands = set.commands;
      relFiles = set.targets;
      composed = true;
    }
    tiedFields = { tied: true, changed: set.changed, ...(set.fallback ? { tied_fallback: set.fallback } : {}) };
  }
  // A .NET or Flutter step close this runner composed writes the runner's own report, which it is timed from.
  const reported = composed && (runner === 'vstest' || runner === 'flutter');
  const reportDir = `.claude/audit/test-reports-${runId}`;
  if (reported) commands = commands.map((c, i) => withReport(c, runner, `${reportDir}/${i}`));
  // The record keeps the unsplit command: the readers of `command` (the usual time, `filtered`, the
  // failure list's shape check) read the legs as one run.
  const command = commands.join(' && ');
  const plan = runPlan({ commands, composed, runner, relFiles, settings, tree, changedTests });

  // `slug` is omitted rather than written empty when absent: the gate treats a record with no slug as
  // undischargeable, and an explicit `slug: ""` would be one `=== ''` bug away from matching.
  const base = {
    ts: new Date().toISOString(), source: 'verify-run', role, run_id: runId,
    ...(profile ? { profile } : {}), ...(relFiles ? { files: relFiles } : {}), ...(slug ? { slug } : {}),
    session, token, tree, ...(tiedFields || {}),
  };

  // The audit file is the RESOLVED ROOT's, even when the command ran in a redirected tree — same
  // split verify-gate makes (measure there, write here), so the token-scoped round queries keep
  // working against one log home.
  // The hash is taken when the record is written, AFTER the command exits: a suite that rewrites a
  // tracked file records the tree it left behind, which is the tree the close gate will hash.
  let usual = null;
  let warned = false;
  const warnSlow = (ratio) => {
    if (warned) return;
    warned = true;
    process.stderr.write(slowLine(ratio, usual));
  };
  // The queue's fields are read when the record is written: a release or a heartbeat that failed
  // after the turn was taken still reaches it.
  let turn = { fields: {}, claimFile: null };
  const write = (fields) => {
    const hashed = hashTree(tree);
    const record = { ...base, ...turn.fields, tree_hash: hashed && hashed.hash, ...fields };
    if (tiedFields) record.changed_hashes = Object.fromEntries(tiedFields.changed.map((f) => [f, fileHash(tree, f)]));
    if (profile === 'fast' && slug) Object.assign(record, deltaSince({ records: readLog(root), tree, slug, files: hashed && hashed.files }));
    if (role === 'full') {
      record.filtered = isFilteredFull(record.command || '');
      record.fast_green = fastGreen(root, tree, record.tree_hash);
      record.file_hashes = hashed && hashed.files;
      if (usual) record.usual_ms = usual.usual_ms;
      const slow = slowField(record.duration_ms, usual);
      if (slow) {
        record.slow = slow;
        warnSlow(slow.ratio);
      }
    }
    try {
      fs.mkdirSync(path.join(root, '.claude', 'audit'), { recursive: true });
      fs.appendFileSync(path.join(root, '.claude', 'audit', 'verify-verdict.json'), JSON.stringify(record) + '\n');
    } catch { /* an unwritable audit dir must not also lose the stdout record below */ }
    out(JSON.stringify(record) + '\n');
  };

  if (!command) {
    write({ verdict: 'undeclared', reason: `no roles.${role} declared in .claude/verify.json` });
    return 0; // visible, never silent — and never a blocker: a repo may legitimately declare no suite
  }

  const stepForm = profile === 'fast' || role === 'unit';
  const timeoutMs = timeoutFor(profile, args['timeout-ms'], {
    role,
    stepLimitSeconds: cfg && cfg.stepLimitSeconds,
    fullLimitSeconds: cfg && cfg.fullLimitSeconds,
    light: args.light !== undefined,
    note: (line) => process.stderr.write(`verify-run: ${line}\n`),
  });
  if (stepForm || role === 'full') base.limit_ms = timeoutMs;
  if (!signalsWired) {
    signalsWired = true;
    endRunningOnSignal('SIGINT', 130);
    endRunningOnSignal('SIGTERM', 143);
  }
  if (role === 'full') {
    const say = (line) => process.stderr.write(`verify-run: ${line}\n`);
    const outer = process.env.NEXUS_COMPLETE_RUN_CLAIM;
    const n = runsAtOnce(process.env.NEXUS_COMPLETE_RUNS_AT_ONCE, say);
    if (n > 0 && outer && claimFileLive(outer)) turn.fields = { slot: 'nested' };
    else if (n > 0) {
      turn = await takeTurn({
        env: process.env, n,
        settleMs: wholeMs(process.env.NEXUS_SLOT_SETTLE_MS, DEFAULT_SETTLE_MS),
        pollMs: wholeMs(process.env.NEXUS_SLOT_POLL_MS, DEFAULT_POLL_MS),
        waitCapMs: wholeMs(process.env.NEXUS_SLOT_WAIT_MS, DEFAULT_SLOT_WAIT_MS),
        heartbeatMs: wholeMs(process.env.NEXUS_SLOT_HEARTBEAT_MS, HEARTBEAT_MS),
        runLimitMs: timeoutMs, info: { tree, ...(slug ? { slug } : {}) }, say,
        hold: (release) => { releaseTurn = release; },
      });
    }
    if (turn.claimFile) process.env.NEXUS_COMPLETE_RUN_CLAIM = turn.claimFile;
    else if (turn.fields.slot !== 'nested') delete process.env.NEXUS_COMPLETE_RUN_CLAIM;
    usual = usualTime(readLog(root), command);
  }
  // Every run hands its command the events file and, where this Node takes it, the child-call preload.
  const eventsFile = path.join(root, '.claude', 'audit', `test-events-${runId}.jsonl`);
  try { fs.mkdirSync(path.dirname(eventsFile), { recursive: true }); } catch { /* the events are then incomplete */ }
  const runEnv = { NEXUS_TEST_EVENTS: eventsFile, NEXUS_TEST_STOP_MS: String(settings.slowMs) };
  const options = String(process.env.NODE_OPTIONS || '');
  if (nodeSupportsSkipPattern(process.versions.node) && !options.includes(PRELOAD_URL)) {
    runEnv.NODE_OPTIONS = `${options} --import=${PRELOAD_URL}`.trim();
  }
  const testFields = () => {
    let text = '';
    try { text = fs.readFileSync(eventsFile, 'utf8'); } catch { /* no runner wrote events */ }
    removeQuietly(eventsFile);
    const read = readTestEvents(text, { legs: plan.legs, shell: plan.items.some((i) => !i.file), tree });
    let timedOut = read.timed_out;
    if (timedOut && timedOut.length) {
      try { timedOut = markTouched({ entries: timedOut, repo: tree, runner }); } catch { timedOut = timedOut.map((t) => ({ ...t, touched: true })); }
    }
    const fields = { events: read.complete, timed_out: timedOut, failed_tests: read.failed_tests };
    if (plan.stop || (read.complete && text.includes('"kind":"legs"'))) fields.stop_ms = { fast: settings.fastMs, slow: settings.slowMs };
    // A step close times its tests: each executed test, those over the speed-up line, and the content hash
    // of every file it timed — what label-tests.js checks a file against before it labels from this run.
    if (composed || tied) {
      fields.test_times = reported ? [...read.test_times, ...reportTimes(runner, tree, reportDir, outputs.join(''))] : read.test_times;
      fields.over_speed_up = fields.test_times.filter((t) => t.ms > settings.speedUpMs).map(({ file, line, test, ms }) => ({ file, line, test, ms }));
      fields.timed_hashes = Object.fromEntries([...new Set(fields.test_times.map((t) => t.file))].sort().map((f) => [f, fileHash(tree, f)]));
    }
    return fields;
  };

  const started = Date.now();
  const slowTimer = usual ? setTimeout(() => warnSlow(SLOW_RATIO), Math.ceil(SLOW_RATIO * usual.usual_ms)) : null;
  if (slowTimer) slowTimer.unref();
  const outputs = [];
  let red = null;
  for (const item of plan.items) {
    const remaining = Math.max(1, timeoutMs - (Date.now() - started));
    const res = await run({ ...item, env: { ...runEnv, ...item.env } }, tree, remaining);
    outputs.push(`${res.stdout}${res.stderr}`);
    if (!res.code && res.status === 0) continue;
    red = res;
    // Both legs always run: a red fast leg still leaves the slow leg to run. A cut, a crash or a signal ends the run.
    if (!res.code && typeof res.status === 'number' && item.leg) continue;
    break;
  }
  if (red) {
    const res = red;
    const captured = outputs.join('');
    const cause = failureCause(res);
    const ended = res.tree === null ? '' : res.tree ? '; process tree ended' : `; process tree NOT ended (pid ${res.pid})`;
    const durationMs = Date.now() - started;
    releaseTurn(res.tree !== false);
    let raise = '';
    if (cause === 'ETIMEDOUT' && role === 'full') {
      const given = typeof args['timeout-ms'] === 'string' && Number(args['timeout-ms']) > 0 ? ' (from --timeout-ms)' : '';
      raise = `the full run was cut at its limit of ${timeoutMs / 1000} s${given} — to give it longer, raise fullLimitSeconds in .claude/verify.json`;
      process.stderr.write(`verify-run: ${raise}\n`);
    }
    const tests = testFields();
    // A run that completed and whose every failure is a timed-out test says so apart from a red one.
    const timedOutOnly = !res.code && typeof res.status === 'number' && tests.events && tests.failed_tests.length === 0 && tests.timed_out.length > 0;
    write({
      command,
      verdict: 'fail',
      duration_ms: durationMs,
      // ETIMEDOUT is surfaced as a plain `reason: "timeout"` as well as in the excerpt: the close
      // gate distinguishes "the suite is red" from "the suite never finished", and a reader should
      // not have to pattern-match an errno to tell them apart.
      reason: cause === 'ETIMEDOUT' ? 'timeout' : timedOutOnly ? 'tests-timed-out' : cause,
      ...(role === 'full' ? { failed: res.code || typeof res.status !== 'number' ? null : failedTargets({ output: captured, repo: tree, command }) } : {}),
      ...tests,
      output_excerpt: excerpt(`${captured}\n[verify-run] command failed: ${cause}${ended}\n${raise ? `[verify-run] ${raise}\n` : ''}`),
    });
    return 1;
  }
  const durationMs = Date.now() - started;
  releaseTurn(true);
  write({ command, verdict: 'pass', duration_ms: durationMs, ...(role === 'full' ? { failed: [] } : {}), ...testFields() });
  return 0;
}

// The report a vstest or flutter step close is timed from: a trx file in its own folder per command, or the
// json event stream on stdout.
function withReport(command, runner, dir) {
  if (runner === 'flutter') return command.replace(/^flutter test(?=\s|$)/, 'flutter test --reporter json');
  return `${command} --logger trx --results-directory "${dir}"`;
}

// Each executed test of a vstest or flutter step close, by its source file: a .NET test by the file that
// declares its class and the line of its method, a Flutter test at the position the stream reported.
// The report folder is removed once read.
function reportTimes(runner, tree, reportDir, stdout) {
  if (runner === 'flutter') {
    return parseFlutterJson(stdout, tree).map((e) => ({ file: e.file, line: e.line, column: e.column, test: e.name, ms: e.ms }));
  }
  const dir = path.join(tree, reportDir);
  const times = [];
  const cache = new Map();
  const sources = new Map();
  try {
    for (const trx of sourceFiles(dir, '.trx')) {
      for (const e of parseTrx(fs.readFileSync(trx, 'utf8'))) {
        const short = e.className.split('.').pop();
        const abs = e.codeBase ? dotnetClassFile(tree, e.codeBase, short, cache) : null;
        if (!abs) continue;
        const file = path.relative(tree, abs).split(path.sep).join('/');
        if (!sources.has(file)) sources.set(file, fs.readFileSync(abs, 'utf8'));
        const line = dotnetMethodLine(sources.get(file), short, e.method) || null;
        times.push({ file, line, column: null, test: e.key.slice(e.key.indexOf('::') + 2), class: short, method: e.method, ms: e.ms });
      }
    }
  } catch { /* no report written: nothing was timed */ }
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* left for the next run's sweep */ }
  return times;
}

// How a run's commands are executed. A node run is the composer's legs, as argument lists with no shell:
// the files or tied tests this runner composed run whole under the slow stop, and a declared command that
// is one direct `node --test` stage is split into its fast and slow legs. Anything else — a wrapper, a
// setup stage, another runner — runs as declared, through a shell, and inherits the environment. The test
// files a tied fallback adds for the change (`changedTests`, the last of `commands`) are one more whole leg.
function runPlan({ commands, composed, runner, relFiles, settings, tree, changedTests = [] }) {
  const stop = { fastMs: settings.fastMs, slowMs: settings.slowMs };
  if (changedTests.length) {
    const unit = runPlan({ commands: commands.slice(0, -1), composed, runner, relFiles, settings, tree });
    const extra = nodeLegs({ targets: changedTests, stop, labelled: settings.labelled, split: false, cwd: tree });
    return {
      items: [...unit.items.map((i) => ({ ...i, leg: true })), ...extra.map((l) => ({ file: 'node', args: l.args, env: { ...l.env }, leg: true }))],
      legs: unit.legs + extra.length,
      stop: unit.stop || extra.some((l) => l.stopMs !== null),
    };
  }
  const asLegs = (exe, env, legs) => ({
    items: legs.map((l) => ({ file: exe, args: l.args, env: { ...env, ...l.env }, leg: true })),
    legs: legs.length,
    stop: legs.some((l) => l.stopMs !== null),
  });
  if (composed && runner === 'node') {
    return asLegs('node', {}, nodeLegs({ targets: relFiles, stop, labelled: settings.labelled, split: false, cwd: tree }));
  }
  // Below Node 22.1 no stop applies, so a declared command runs as declared, its shell expanding its globs.
  const invocation = commands.length === 1 && !composed && nodeSupportsSkipPattern(process.versions.node) ? nodeInvocation(commands[0]) : null;
  if (invocation) {
    return asLegs(invocation.exe, invocation.env,
      nodeLegs({ targets: invocation.targets, options: invocation.options, stop, labelled: settings.labelled, cwd: tree }));
  }
  return { items: commands.map((shell) => ({ shell })), legs: 0, stop: composed && (runner === 'vstest' || runner === 'flutter') };
}

module.exports = { main, timeoutFor, testSettings, readTestEvents, endTree, startOptions, usualTime, slowField, runsAtOnce, readClaims, mayStart, takeTurn };

if (require.main === module) main().then((code) => process.exit(code));
