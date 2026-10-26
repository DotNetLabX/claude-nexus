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
 * (lib/compose-test-command.js composes the legs; the two legs of a split unit run at the same time, sharing
 * its test concurrency). readTestEvents (lib/test-events.js) reads the core reporter's events into the record's `timed_out` and
 * `failed_tests`, and each timed-out test is marked `touched` by the change before the record is written
 * (lib/run-verdict.js `markTouched`, where the close rule lives too). A red run reads `tests-timed-out` only
 * when every failure is a timed-out test and every red exit is explained: a leg's by its own events, a
 * wrapper's only by its own statement — the `endLegs` line (compose-test-command.js), the last its command
 * wrote, naming that exit, written by the very process this runner started, with no shell, for a command that
 * is one `node {script}` stage, running that script. Anything else, an exit status that merely matches a
 * leg's or a statement from a process the wrapper started included, is a real failure.
 *
 * A STEP CLOSE TIMES ITS TESTS. A `--files` or `--tied` record carries `test_times` and `over_speed_up`,
 * executed tests only, and `timed_hashes` — the files it timed or timed out — which label-tests.js labels
 * from, with `companion_hashes` for a project file a label there needs (the runner's `labelCompanions`).
 * Node's times come from the core reporter's events; a command this runner composed for a runner that writes
 * its own report adds it (the runner's `withReport`, read back by its `reportTimes` — the contract in
 * lib/test-runners.js). A tied step close runs the change's own test files whole beside what it runs — a node
 * file as one more leg, another runner's as a command composed for them, with its report — so they are timed
 * even when the rest falls back to the declared unit. Those runners' `timed_out` stays null: their timeouts
 * are not told apart here.
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
 * cannot tie runs roles.unit whole, its record naming why in `tied_fallback`. A `--files` or `--tied` run
 * whose runner no installed plugin serves runs roles.unit whole too, its record carrying the loader's
 * reason in `runner_missing` (a too-old or missing language plugin). An undeclared unit exits 3
 * and writes nothing. A full record carries `file_hashes` (lib/tree-hash.js's per-file form) and `failed`: the test files or projects its output names as
 * failing, `[]` when it passed, `null` when the run was cut or crashed, names a failure it cannot place,
 * was aborted, or ran anything but the test runner invoked directly as its last stage, after setup stages only
 * — where no runner reads the run's own results (A FULL RECORD NAMES ITS FAILURES, below). A fast record with a slug, written after a full
 * record of that slug on the same tree, carries `delta_base` (that record's `ts`) and `delta_hashes`
 * (the files whose content then differed from its `file_hashes`, at their content then) — the content a
 * gear's close repair ran at (lib/gear-close.js).
 *
 * A COMPOSED RUN BUILDS ONLY WHEN A FILE CHANGED. For a runner with `buildKey` and `noBuild`, each named-files
 * or tied command takes the runner's no-build form when the latest record in this tree that built anything
 * built it: the same `buildKey`, at the current build hash (lib/tree-hash.js `buildHash`, which keeps `docs/`),
 * and that build succeeded with the tree unchanged while it ran. Any other run in the tree that may have
 * built — a declared role, a verify-gate run, a composed run of other targets — comes after it and voids it,
 * and so does a tree outside git. The record carries `builds`: per command run, `key`, `hash` (taken before
 * the run) and `outcome` — `built` (tests ran), `reused`, `failed` (no test ran) or `changed` (the tree moved
 * during the run). A no-build command that fails with no test run is run once more with the build, said on
 * stderr, and marked `retried`. A declared role always builds; a build made by hand is not seen.
 * "The latest" is the tree's build ledger's (lib/build-ledger.js), where every run in the tree, whichever session
 * ran it, writes a start line before it may build and an end line when it ends, in the order they happened; a
 * build that overlapped another, or a start the ledger cannot show ended, voids reuse. A record in the session root's log or the
 * tree's own log of a run the ledger does not hold voids it too, unless that run ended before the last build
 * started.
 *
 * A FULL RECORD NAMES ITS FAILURES from each test tool's own results file, read by the stage's runner (the
 * contract's withRunReport and readRunResults, lib/test-runners.js). Every installed runner that reads them is
 * offered each stage, and the first that rewrites it for a report owns it. A declared command of stages joined
 * by `&&` alone is split into groups when every stage before its last test stage is a setup stage or a test
 * stage a runner owns: one test stage with the setup stages since the previous one, and the stages after the
 * last test stage as the last group; each folder change and environment assignment before a group is carried in
 * front of it. Every group runs, a red one included, within the one limit; a cut ends the run and the groups
 * after it are not run. A readable chain that fails the rule runs as one group, `&&` kept; a command no runner
 * owns a stage of, or one whose stages cannot be read, runs whole as today, `unsplit` saying why; a command that
 * is one node stage keeps its legs. Each test stage reports to a folder of its own under
 * `.claude/audit/test-reports-{run_id}/{group}/{k}`, removed at the end; its runner reads it after the group on
 * any outcome, and the result is copied to the output the stage named. A .NET project a hang stopped runs once
 * more without its stuck tests (`rerunWithout`), behind the carried stages, from a folder of its own; the
 * re-run adds what it names and drops nothing. After every full run stderr carries a short summary of what
 * it named — each failed or timed-out test with its message, the finished projects with their times, the
 * unfinished ones and the stages not run — or the one-line reason it named nothing. Every red record's
 * excerpt keeps, between its head and tail, the lines each installed runner marks as a failure
 * (`failureLines`), up to a cap and with the count left out; the core keeps no runner's patterns of its own.
 * A group is accounted for when every stage in it ran, its runner read every selected project or
 * file whole, and its red, if any, is explained by the failures and timeouts named; a non-test stage that went
 * red, a stage `&&` skipped, a cut, or a stuck theory case leaves it unaccounted. These fields are written on
 * full records only:
 *   `failed_tests`, `timed_out` — complete lists only: written when every group is accounted for, else null;
 *     never capped. Each entry carries `message` (first line, capped), `runner` and `target`; a .NET entry
 *     adds `project`, `class` and `method`.
 *   `failed` — the targets of the real failures and the touched timeouts: `[]` on a pass, and on a red whose
 *     only failures are untouched timeouts; null on a red run with any group unaccounted.
 *   `failures_partial` — where the lists are null, the failures named so far, in the same shape; on a run of
 *     the whole command or of a node stage's legs, only where its events named one. No close rule reads it:
 *     the printed summary shows it, and the handover ladder re-runs its failures by name.
 *   `projects` — `{ project, runner, ms, state: finished | unfinished | not-run, failed, passed }`, one per
 *     .NET test project and one per vitest, Flutter or node stage.
 *   `stages` — one per group of stages, not per stage: `{ command, kind: test | other, state: passed | failed
 *     | cut | not-run, ms }`, `command` the group as declared with its carried stages, where the run split the
 *     declared chain; absent where it ran the command whole, which `unsplit` says why.
 *   `reruns` — `{ project, without, verdict }`, one per stuck .NET project run again without its stuck tests.
 *   `events` — the lists are complete, whichever reader made them.
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
 * at the limit, on output overflow, and when this runner is itself interrupted — then the tree of every
 * command running at that moment, both legs of a split unit included, before its turn is released.
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
const { filesCommand, isFilteredFull, nodeLegs, shareConcurrency, nodeSupportsSkipPattern, PRELOAD_URL } = require('./lib/compose-test-command');
const { loadRunner, RUNNERS, stagesOf, isAssignment, splitChain, setupStage } = require('./lib/test-runners');
const { hashTree, buildHash, fileHash, sameTree } = require('./lib/tree-hash');
const { readBuildEntries, hasBuildLedger, startBuild, endBuild, mayHaveBuilt, lastBuildReusable } = require('./lib/build-ledger');
const { tiedSet, failedTargets, declaredFor, nodeInvocation, runnerOf } = require('./lib/tied-tests');
const { deltaSince } = require('./lib/gear-close');
const { markTouched } = require('./lib/run-verdict');
const { readTestEvents } = require('./lib/test-events');

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
const EXCERPT_FAILURE_LINES = 40;
const EXCERPT_LINE_CHARS = 300;
// The full run's printed summary: its entries and each one's message, capped; the record keeps every one whole.
const SUMMARY_ENTRIES = 20;
const SUMMARY_MESSAGE_CHARS = 200;
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

// Every command running now: the two legs of a split unit run at the same time.
const running = new Set();
let releaseTurn = () => {};

// Ends every running command's tree, each tried; ended only when every one is.
function endRunning(end = (pid) => endTree(process.platform, pid)) {
  let ended = true;
  for (const child of [...running]) if (!end(child.pid)) ended = false;
  return ended;
}

const runningPids = () => [...running].map((child) => child.pid);

function endRunningOnSignal(sig, code) {
  process.once(sig, () => {
    releaseTurn(endRunning());
    process.exit(code);
  });
}

// Resolves with execSync's failure vocabulary: `code` ETIMEDOUT / ENOBUFS / a spawn errno, else the
// exit `status` or the `signal`, plus `tree` — whether the tree was ended when the runner ended it.
// `cmd` is a shell string, or `{shell}` / `{file, args}` with an `env` laid over this process's; a `{shell}`
// with a `direct` form runs that form with no shell, its own `env` laid over that.
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
      running.delete(child);
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
    const { direct } = item;
    try {
      child = direct
        ? spawn(direct.file, direct.args, { ...startOptions(platform, cwd), shell: false, env: { ...env, ...direct.env } })
        : item.file
        ? spawn(item.file, item.args, { ...startOptions(platform, cwd), shell: false, env })
        : spawn(item.shell, { ...startOptions(platform, cwd), env });
    } catch (e) {
      code = (e && e.code) || 'spawn failed';
      finish(null, null);
      return;
    }
    running.add(child);
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

// The excerpt keeps its head and tail and, from the middle it elides, the lines a runner marks as failures
// (`pick`, each loaded runner's `failureLines`) — up to a cap, each line cut to a width, the rest counted.
function excerpt(text, pick = null) {
  const s = String(text || '');
  if (s.length <= EXCERPT_HEAD + EXCERPT_TAIL) return s;
  const dropped = s.length - EXCERPT_HEAD - EXCERPT_TAIL;
  let found = [];
  if (pick) {
    try { found = pick(s.slice(EXCERPT_HEAD, s.length - EXCERPT_TAIL)); } catch { /* the head and tail stand alone */ }
  }
  const kept = found.slice(0, EXCERPT_FAILURE_LINES).map((l) => (l.length > EXCERPT_LINE_CHARS ? `${l.slice(0, EXCERPT_LINE_CHARS)}…` : l));
  const more = found.length - kept.length;
  const failures = kept.length
    ? `\n… failure lines from the elided middle:\n${kept.join('\n')}${more ? `\n… ${more} more failure lines left out` : ''}`
    : '';
  return `${s.slice(0, EXCERPT_HEAD)}\n… [${dropped} chars elided] …${failures}\n${s.slice(-EXCERPT_TAIL)}`;
}

// The lines of `text`, in order, that any of `runners` marks as a failure (`failureLines`).
function failureLinesIn(text, runners) {
  const marked = new Set();
  for (const r of runners) {
    if (typeof r.failureLines !== 'function') continue;
    try { for (const l of r.failureLines(text)) marked.add(l); } catch { /* that runner marks nothing */ }
  }
  return marked.size ? String(text).split(/\r?\n/).filter((l) => marked.has(l)) : [];
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

// What may say what last built in `tree`: its build ledger, and the records of the session root's log and the
// tree's own log of runs the ledger does not hold.
function buildHistory(root, tree) {
  const ledger = readBuildEntries(tree);
  const held = new Set(ledger.map((e) => e.run_id).filter(Boolean));
  const logs = [...readLog(root), ...(sameTree(root, tree) ? [] : readLog(tree))]
    .filter((r) => r && sameTree(r.tree, tree) && !held.has(r.run_id) && mayHaveBuilt(r));
  return { ledger, logs };
}

// A log record's start plus its duration: a gate record times each command, a run record the whole run.
function endedAt(r) {
  const ms = typeof r.duration_ms === 'number' ? r.duration_ms
    : Array.isArray(r.commands) ? r.commands.reduce((sum, c) => sum + (c && typeof c.duration_ms === 'number' ? c.duration_ms : 0), 0) : 0;
  return Date.parse(r.ts) + ms;
}

function buildReusable(history, key, hash, own) {
  if (!hash) return false;
  const last = lastBuildReusable(history.ledger, key, hash, own);
  if (!last || !last.ok) return false;
  const from = Date.parse(last.start.ts);
  return history.logs.every((r) => endedAt(r) < from);
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

// The node options whose value is the next word, so that word is never read as the script.
const NODE_VALUED = new Set(['-r', '--require', '--import', '--loader', '--experimental-loader', '-C', '--conditions',
  '--env-file', '--input-type', '--title', '-e', '--eval', '-p', '--print']);

// A command that is one `node {script}` stage (lib/test-runners.js stagesOf), as the no-shell spawn of its words —
// `file`, `args`, its leading assignments as `env` — with its `script` resolved in `tree`; null for any other
// shape, or a bare word a shell may expand (`*`, `?`). In a chain the exit may be a stage's that never ran the
// script, or ran it inside; through a shell the process started is the shell's, not the script's.
function directNode(command, tree) {
  const stages = stagesOf(String(command || ''), { values: true });
  if (!stages || stages.length !== 1) return null;
  const words = stages[0];
  if (words.some((w) => !w.quoted && /[*?]/.test(w.text))) return null;
  let i = 0;
  const env = {};
  for (; i < words.length && isAssignment(words[i]); i++) {
    const eq = words[i].text.indexOf('=');
    env[words[i].text.slice(0, eq)] = words[i].text.slice(eq + 1);
  }
  if (i >= words.length || !/^node(\.exe)?$/i.test(path.basename(words[i].text))) return null;
  const file = words[i].text;
  const start = i + 1;
  for (i++; i < words.length && words[i].text.startsWith('-'); i++) {
    if (!words[i].text.includes('=') && NODE_VALUED.has(words[i].text)) i++;
  }
  if (i >= words.length) return null;
  return { file, args: words.slice(start).map((w) => w.text), env, script: path.resolve(tree, words[i].text) };
}

const samePath = (a, b) => {
  try { return path.relative(fs.realpathSync(a), fs.realpathSync(b)) === ''; } catch { return false; }
};

// The last line written to the events file from byte `from` on, parsed; null when there is none or it is torn.
function lastEventFrom(file, from) {
  let text = '';
  try { text = fs.readFileSync(file).subarray(from).toString('utf8'); } catch { return null; }
  const line = text.split('\n').map((l) => l.trim()).filter(Boolean).at(-1);
  if (!line) return null;
  try { const e = JSON.parse(line); return e && typeof e === 'object' ? e : null; } catch { return null; }
}

// A shell item's red exit is its legs' own only by the wrapper's `endLegs` line (compose-test-command.js) as
// the last its command wrote: own checks passed, that exit named, written by the process this runner started
// with no shell for a one-stage `node {script}` command, running that script — a process it started in turn,
// the same script's included, never counts.
function wrapperExplained(item, res, last) {
  const { direct } = item;
  return Boolean(direct && last && last.kind === 'legs-end' && last.own === 'passed' && Number.isInteger(last.status)
    && last.status === res.status && Number.isInteger(last.pid) && last.pid === res.pid
    && typeof last.script === 'string' && samePath(direct.script, last.script));
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
  // Only node splits a run into a fast and a slow set; every other runner takes one stop, the slow one.
  const stopSeconds = settings.slowMs / 1000;
  const runner = runnerOf(cfg);
  // The libraries below load runners from the process environment; this load must read the same install record.
  const loaded = runner ? loadRunner(runner, { root, env: { ...process.env, ...env } }) : { runner: null, reason: null };
  const runnerOps = loaded.runner;
  // A runner of the core's table that no installed plugin serves: a named-files or tied run takes the declared
  // unit whole, and its record names why.
  const runnerMissing = runner && !runnerOps && RUNNERS.has(runner) && runner !== 'mtp' ? loaded.reason : null;
  const runId = `${Date.now().toString(36)}-${require('crypto').randomBytes(4).toString('hex')}`;
  let composed = false;
  let relFiles = null;
  if (files) {
    if (!runner) {
      process.stderr.write('verify-run: --files needs a runner — no slow.runner in .claude/verify.json and no recognised test invocation in roles.unit; declare verify roles first\n');
      return 2;
    }
    if (runnerMissing) {
      process.stderr.write(`verify-run: --files: ${runnerMissing} — running roles.unit\n`);
    } else {
      relFiles = files.map((f) => path.relative(tree, path.resolve(tree, f)).split(path.sep).join('/'));
      composed = true;
      try {
        commands = filesCommand({ runner, files: relFiles, exclude: false, cwd: tree, stopSeconds, root, note: (line) => process.stderr.write(`verify-run: ${line}\n`) });
      } catch (e) {
        process.stderr.write(`verify-run: ${e.message}\n`);
        return 2;
      }
    }
  }
  // An undeclared unit writes no record: the developer's own fallback runs instead, and a tied record
  // that ran nothing must never read as covering the change.
  let tiedFields = null;
  let changedTests = [];
  // The first of `commands` this runner composed for the change's own test files, where the rest is not.
  let ownFrom = composed ? 0 : null;
  if (tied) {
    if (commands.length === 0) {
      process.stderr.write('verify-run: --tied: no roles.unit declared in .claude/verify.json — nothing ran and nothing is recorded; take the undeclared-unit fallback\n');
      return 3;
    }
    const declared = declaredFor(cfg);
    const set = tiedSet({ repo: tree, changed, ...declared, stopSeconds, root });
    // The test files the change itself touched run whole beside what runs for it, timed, whatever that holds:
    // a node file as one more leg; another runner's, a command it composes (no slow exclusion), with its report —
    // beside a tied set unless that set provably runs every test: no slow tests declared and no filter in any of
    // its commands (the runner's `exclusionOf` reads none). A file the runner refuses as a test file is none.
    const own = set.changed.filter((f) => fs.existsSync(path.join(tree, f)));
    let ownTests = [];
    if (runner === 'node') ownTests = own.filter((f) => NODE_TEST_FILE.test(f));
    else if (runnerOps && !runnerMissing) {
      ownTests = own.filter((f) => { try { filesCommand({ runner, files: [f], exclude: false, cwd: tree, root }); return true; } catch { return false; } });
    }
    const ownCommands = ownTests.length
      ? filesCommand({ runner, files: ownTests, exclude: false, cwd: tree, stopSeconds, root, note: (line) => process.stderr.write(`verify-run: ${line}\n`) })
      : [];
    if (set.fallback) {
      process.stderr.write(`verify-run: tied: ${set.fallback} — running roles.unit\n`);
      if (runner === 'node') changedTests = ownTests;
      if (ownCommands.length) {
        ownFrom = runner === 'node' ? null : commands.length;
        commands = [...commands, ...ownCommands];
      }
    } else {
      const whole = (c) => { try { const read = runnerOps.exclusionOf(c); return Boolean(read && read.none); } catch { return false; } };
      const everyTest = !declared.slow && Boolean(runnerOps && typeof runnerOps.exclusionOf === 'function') && set.commands.every(whole);
      commands = runner === 'node' || everyTest ? set.commands : [...set.commands, ...ownCommands];
      relFiles = set.targets;
      composed = true;
      ownFrom = 0;
    }
    tiedFields = { tied: true, changed: set.changed, ...(set.fallback ? { tied_fallback: set.fallback } : {}) };
  }
  const buildOps = composed && runnerOps && typeof runnerOps.buildKey === 'function' && typeof runnerOps.noBuild === 'function' ? runnerOps : null;
  let builds = null;
  if (buildOps) {
    const before = buildHash(tree);
    const log = buildHistory(root, tree);
    builds = { before, items: commands.map((c) => {
      const key = buildOps.buildKey(c);
      return { key, reuse: buildReusable(log, key, before, runId), build: c, outcome: null, retried: false };
    }) };
    commands = commands.map((c, i) => (builds.items[i].reuse ? buildOps.noBuild(c) : c));
  }
  // A step close this runner composed, for a runner that writes its own report, is timed from that report —
  // the commands it composed, never a declared one beside them.
  const reported = ownFrom !== null && ownFrom < commands.length && Boolean(runnerOps && runnerOps.withReport);
  const reportDir = `.claude/audit/test-reports-${runId}`;
  if (reported) commands = commands.map((c, i) => (i >= ownFrom ? runnerOps.withReport(c, `${reportDir}/${i}`) : c));
  if (builds && reported) builds.items.forEach((b, i) => { b.build = runnerOps.withReport(b.build, `${reportDir}/${i}`); });
  // The record keeps the unsplit command: the readers of `command` (the usual time, `filtered`, the
  // failure list's shape check) read the legs as one run.
  const command = commands.join(' && ');
  const plan = runPlan({ commands, composed: composed || ownFrom !== null, runner, relFiles, settings, tree, root, changedTests });

  // `slug` is omitted rather than written empty when absent: the gate treats a record with no slug as
  // undischargeable, and an explicit `slug: ""` would be one `=== ''` bug away from matching.
  const base = {
    ts: new Date().toISOString(), source: 'verify-run', role, run_id: runId,
    ...(profile ? { profile } : {}), ...(relFiles ? { files: relFiles } : {}), ...(slug ? { slug } : {}),
    session, token, tree, ...(tiedFields || {}),
    ...(runnerMissing && (files || tied) ? { runner_missing: runnerMissing } : {}),
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
  // A tree whose runner reuses no build needs no ledger, unless one is already kept there.
  const reuses = Boolean(runnerOps && typeof runnerOps.buildKey === 'function' && typeof runnerOps.noBuild === 'function');
  const ledgered = () => reuses || hasBuildLedger(tree);
  let buildStarted = false;
  const beginBuild = () => {
    if (buildStarted || !ledgered()) return;
    buildStarted = true;
    startBuild(tree, { id: runId, source: 'verify-run' });
  };
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
    if (record.verdict !== 'undeclared' && ledgered()) {
      endBuild(tree, { id: runId, ts: record.ts, source: 'verify-run', run_id: runId, builds: Array.isArray(record.builds) ? record.builds : null });
    }
    out(JSON.stringify(record) + '\n');
    if (role === 'full' && record.verdict !== 'undeclared') process.stderr.write(fullSummary(record));
  };

  if (!command) {
    write({ verdict: 'undeclared', reason: `no roles.${role} declared in .claude/verify.json` });
    return 0; // visible, never silent — and never a blocker: a repo may legitimately declare no suite
  }
  // A full run names its failures from each test tool's own results, stage group by stage group; a command it
  // cannot split runs whole as declared, its record saying why.
  let runnerSet = null;
  const installed = () => runnerSet || (runnerSet = fullRunners(root, { ...process.env, ...env }));
  const pick = (middle) => failureLinesIn(middle, installed().all);
  const full = role === 'full' && !composed ? fullPlan(command, { ...installed(), tree }) : null;
  const unsplitField = full && full.unsplit ? { unsplit: full.unsplit } : {};

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
    if (role === 'full' && Array.isArray(read.failures_partial) && read.failures_partial.length) fields.failures_partial = read.failures_partial;
    if (plan.stop || (read.complete && text.includes('"kind":"legs"'))) fields.stop_ms = { fast: settings.fastMs, slow: settings.slowMs };
    // A step close times its tests: each executed test, those over the speed-up line, and the content hash
    // of every file it timed or timed out — what label-tests.js checks a file against before it labels from
    // this run — and of each project file a label there needs beside it (`labelCompanions`), as it stood.
    if (composed || tied) {
      fields.test_times = reported ? [...read.test_times, ...runnerOps.reportTimes({ tree, reportDir, stdout: outputs.join('') })] : read.test_times;
      fields.over_speed_up = fields.test_times.filter((t) => t.ms > settings.speedUpMs).map(({ file, line, test, ms }) => ({ file, line, test, ms }));
      const hashed = [...new Set([...fields.test_times, ...(timedOut || [])].map((t) => t.file).filter((f) => typeof f === 'string'))].sort();
      fields.timed_hashes = Object.fromEntries(hashed.map((f) => [f, fileHash(tree, f)]));
      if (hashed.length && runnerOps && typeof runnerOps.labelCompanions === 'function') {
        let companions = [];
        try { companions = runnerOps.labelCompanions({ tree, files: hashed }).map((c) => c.file); } catch { /* none read */ }
        if (companions.length) fields.companion_hashes = Object.fromEntries([...new Set(companions)].sort().map((f) => [f, fileHash(tree, f)]));
      }
    }
    return fields;
  };

  // A composed command of another runner is one shell item: item k runs commands[k].
  if (builds && plan.items.length !== commands.length) builds = null;
  const testsRan = (k, res) => {
    if (!reported || typeof buildOps.reportCount !== 'function') return !res.code && res.status === 0;
    try { return buildOps.reportCount(path.join(tree, reportDir, String(k))) > 0; } catch { return false; }
  };
  const buildsField = () => {
    if (!builds) return {};
    const after = builds.before === null ? null : buildHash(tree);
    return { builds: builds.items.filter((b) => b.outcome).map((b) => ({
      key: b.key, hash: builds.before, outcome: b.outcome === 'built' && after !== builds.before ? 'changed' : b.outcome,
      ...(b.retried ? { retried: true } : {}),
    })) };
  };

  if (!builds || !builds.items.every((b) => b.reuse)) beginBuild();
  const started = Date.now();
  const slowTimer = usual ? setTimeout(() => warnSlow(SLOW_RATIO), Math.ceil(SLOW_RATIO * usual.usual_ms)) : null;
  if (slowTimer) slowTimer.unref();
  if (full && full.groups) {
    const reportsRoot = path.join(tree, '.claude', 'audit', `test-reports-${runId}`);
    const ran = await runFullGroups(full, { tree, run, env: runEnv, timeoutMs, started, reportsRoot });
    removeQuietly(eventsFile);
    try { fs.rmSync(reportsRoot, { recursive: true, force: true }); } catch { /* left for the next run's sweep */ }
    const durationMs = Date.now() - started;
    const red = ran.reds.length ? (ran.reds.find((r) => r.code || typeof r.status !== 'number') || ran.reds.at(-1)) : null;
    releaseTurn(!red || red.tree !== false);
    const reads = ran.groups.flatMap((o) => o.reads);
    const accounted = ran.groups.every(groupAccounted);
    const failedTests = reads.flatMap((r) => r.failed_tests);
    let timedOut = reads.flatMap((r) => r.timed_out);
    if (accounted && timedOut.length) {
      try { timedOut = markTouched({ entries: timedOut, repo: tree, runner }); } catch { timedOut = timedOut.map((t) => ({ ...t, touched: true })); }
    }
    const targetOf = (t) => t.target || t.file;
    const named = accounted
      ? { failed_tests: failedTests, timed_out: timedOut }
      : { failed_tests: null, timed_out: null, failures_partial: [...failedTests, ...timedOut] };
    const fields = {
      command,
      verdict: red ? 'fail' : 'pass',
      duration_ms: durationMs,
      failed: !red ? [] : accounted ? [...new Set([...failedTests, ...timedOut.filter((t) => t.touched !== false)].map(targetOf))] : null,
      events: accounted,
      ...named,
      projects: ran.groups.flatMap((o) => o.reads.flatMap((r) => r.projects.map((p) => (o.state === 'not-run' ? { ...p, state: 'not-run' } : p)))),
      ...(full.unsplit ? { unsplit: full.unsplit } : {
        stages: ran.groups.map((o) => ({
          command: [...o.group.carried, ...o.group.stages].map((s) => s.text).join(' && '),
          kind: o.group.stages.some((s) => s.owner) ? 'test' : 'other', state: o.state, ms: o.ms,
        })),
      }),
      ...(ran.reruns.length ? { reruns: ran.reruns } : {}),
    };
    if (!red) {
      write(fields);
      return 0;
    }
    const cause = failureCause(red);
    const endedLine = red.tree === null ? '' : red.tree ? '; process tree ended' : `; process tree NOT ended (pid ${red.pid})`;
    let raise = '';
    if (cause === 'ETIMEDOUT') {
      const given = typeof args['timeout-ms'] === 'string' && Number(args['timeout-ms']) > 0 ? ' (from --timeout-ms)' : '';
      raise = `the full run was cut at its limit of ${timeoutMs / 1000} s${given} — to give it longer, raise fullLimitSeconds in .claude/verify.json`;
      process.stderr.write(`verify-run: ${raise}\n`);
    }
    const timedOutOnly = accounted && failedTests.length === 0 && timedOut.length > 0;
    write({
      ...fields,
      reason: cause === 'ETIMEDOUT' ? 'timeout' : timedOutOnly ? 'tests-timed-out' : cause,
      output_excerpt: excerpt(`${ran.outputs.join('')}\n[verify-run] command failed: ${cause}${endedLine}\n${raise ? `[verify-run] ${raise}\n` : ''}`, pick),
    });
    return 1;
  }
  const outputs = [];
  const reds = [];
  const eventsSize = () => { try { return fs.statSync(eventsFile).size; } catch { return 0; } };
  // Items of one `group` (the two legs of a split unit) start at the same time; the rest one after the other.
  let halted = false;
  for (let k = 0; k < plan.items.length && !halted;) {
    let end = k + 1;
    if (plan.items[k].group !== undefined) while (end < plan.items.length && plan.items[end].group === plan.items[k].group) end++;
    const remaining = Math.max(1, timeoutMs - (Date.now() - started));
    const batch = plan.items.slice(k, end);
    // A shell item runs alone; the events it writes start where the file ended before it.
    const from = batch.length === 1 && !batch[0].file ? eventsSize() : null;
    const results = await Promise.all(batch.map((item) => run({ ...item, env: { ...runEnv, ...item.env } }, tree, remaining)));
    for (const [n, item] of batch.entries()) {
      let res = results[n];
      const index = k + n;
      outputs.push(`${res.stdout}${res.stderr}`);
      if (builds) {
        const b = builds.items[index];
        let ran = testsRan(index, res);
        if (b.reuse && !ran && !res.code && res.status !== 0) {
          const line = `verify-run: ${b.key}: no build output for the --no-build run — running it once more with the build\n`;
          process.stderr.write(line);
          outputs.push(line);
          b.reuse = false;
          b.retried = true;
          beginBuild();
          res = await run({ ...item, shell: b.build, direct: undefined, env: { ...runEnv, ...item.env } }, tree, Math.max(1, timeoutMs - (Date.now() - started)));
          outputs.push(`${res.stdout}${res.stderr}`);
          ran = testsRan(index, res);
        }
        b.outcome = b.reuse ? 'reused' : ran ? 'built' : 'failed';
      }
      if (!res.code && res.status === 0) continue;
      reds.push({ item, res, last: from === null ? null : lastEventFrom(eventsFile, from) });
      // Both legs always run: a red fast leg still leaves the slow leg to run. A cut, a crash or a signal ends the run.
      if (!(!res.code && typeof res.status === 'number' && item.leg)) halted = true;
    }
    k = end;
  }
  // The red the record names: a cut, a crash or a signal over a plain red status.
  const red = reds.length ? (reds.find((r) => r.res.code || typeof r.res.status !== 'number') || reds.at(-1)).res : null;
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
    // A run that completed and whose every failure is a timed-out test says so apart from a red one; a command
    // the runner did not compose — a wrapper — counts only by its own endLegs statement.
    const explained = reds.every(({ item, res: r, last }) => item.file || wrapperExplained(item, r, last));
    const timedOutOnly = !res.code && typeof res.status === 'number' && explained && tests.events
      && tests.failed_tests.length === 0 && tests.timed_out.length > 0;
    write({
      command,
      verdict: 'fail',
      duration_ms: durationMs,
      // ETIMEDOUT is surfaced as a plain `reason: "timeout"` as well as in the excerpt: the close
      // gate distinguishes "the suite is red" from "the suite never finished", and a reader should
      // not have to pattern-match an errno to tell them apart.
      reason: cause === 'ETIMEDOUT' ? 'timeout' : timedOutOnly ? 'tests-timed-out' : cause,
      ...(role === 'full' ? { failed: res.code || typeof res.status !== 'number' ? null : failedTargets({ output: captured, repo: tree, command, root }) } : {}),
      ...unsplitField,
      ...tests,
      ...buildsField(),
      output_excerpt: excerpt(`${captured}\n[verify-run] command failed: ${cause}${ended}\n${raise ? `[verify-run] ${raise}\n` : ''}`, pick),
    });
    return 1;
  }
  const durationMs = Date.now() - started;
  releaseTurn(true);
  write({ command, verdict: 'pass', duration_ms: durationMs, ...(role === 'full' ? { failed: [] } : {}), ...unsplitField, ...testFields(), ...buildsField() });
  return 0;
}

// ── a full run, by stage groups ───────────────────────────────────────────────────────────────────────

// The core reporter's file in a node stage's own folder: the one hand-off that is no function (lib/test-runners.js).
const NODE_EVENTS = 'node-events.jsonl';
const FOLDER_STAGE = new Set(['cd', 'pushd', 'chdir']);
// A runner owns a stage when it rewrites the stage for a report; this folder is only offered, never written.
const PROBE_DIR = path.resolve(path.sep, 'nexus-full-run-probe');

// Every installed runner of the core's table (`all`), those that read a full run's own results — any with
// `withRunReport` and `readRunResults`, the contract's other two being optional — and each runner's shape.
function fullRunners(root, env) {
  const all = [];
  const readers = [];
  const shapes = new Map();
  for (const name of RUNNERS) {
    const { runner } = loadRunner(name, { root, env });
    shapes.set(name, runner && runner.commandShape ? runner.commandShape : null);
    if (!runner) continue;
    all.push(runner);
    if (typeof runner.withRunReport === 'function' && typeof runner.readRunResults === 'function') readers.push(runner);
  }
  return { all, readers, shapeOf: (name) => shapes.get(name) || null };
}

const cap = (text, n) => { const s = String(text == null ? '' : text); return s.length > n ? `${s.slice(0, n)}…` : s; };

/**
 * What a full run named, as the lines printed to stderr after it: the verdict and counts; each failed or
 * timed-out test with its message (the failures seen so far where the lists are not whole), capped; the
 * finished projects with their times, the unfinished and the not-run ones, and the stages not run; or, where
 * nothing was named, why — the command ran whole, the run was cut before any result was written, a stage that
 * runs no tests went red, or no test results were written.
 */
function fullSummary(record) {
  const whole = Array.isArray(record.failed_tests);
  const entries = whole
    ? [...record.failed_tests, ...record.timed_out]
    : (Array.isArray(record.failures_partial) ? record.failures_partial : []);
  const head = record.verdict === 'pass' ? 'passed' : `failed (${record.reason})`;
  const lines = [whole
    ? `verify-run: full run ${head}: ${record.failed_tests.length} failed, ${record.timed_out.length} timed out`
    : `verify-run: full run ${head}`];
  if (!whole && entries.length) lines.push('  named so far (the run did not name every failure):');
  for (const t of entries.slice(0, SUMMARY_ENTRIES)) {
    const what = t.cause ? `timed out${t.touched === false ? ', untouched' : ''}` : 'failed';
    lines.push(`  ${t.target || t.file || '?'} › ${t.test || '(the file)'} — ${cap(t.message || what, SUMMARY_MESSAGE_CHARS)}${t.cause ? ` (${what})` : ''}`);
  }
  if (entries.length > SUMMARY_ENTRIES) lines.push(`  … and ${entries.length - SUMMARY_ENTRIES} more — the record lists every one`);
  const projects = Array.isArray(record.projects) ? record.projects : [];
  const named = (state, withTime) => projects.filter((p) => p.state === state)
    .map((p) => (withTime ? `${p.project} (${((p.ms || 0) / 1000).toFixed(1)} s)` : p.project));
  const finished = named('finished', true);
  const unfinished = named('unfinished', false);
  const notRun = named('not-run', false);
  const stagesNotRun = (record.stages || []).filter((s) => s.state === 'not-run').map((s) => s.command);
  if (finished.length) lines.push(`  finished: ${finished.join(', ')}`);
  if (unfinished.length) lines.push(`  unfinished: ${unfinished.join(', ')}`);
  if (notRun.length) lines.push(`  projects not run: ${notRun.join(', ')}`);
  if (stagesNotRun.length) lines.push(`  stages not run: ${stagesNotRun.join(' | ')}`);
  if (record.verdict !== 'pass' && entries.length === 0) {
    const redOther = (record.stages || []).find((s) => s.kind === 'other' && s.state === 'failed');
    let why = 'the run went red without naming a failure';
    if (record.unsplit && !projects.length) why = `the command ran whole — ${record.unsplit}`;
    else if (record.reason === 'timeout' && !finished.length) why = 'the run was cut before any test result was written';
    else if (redOther) why = `a stage that runs no tests went red — ${redOther.command}`;
    else if (unfinished.length) why = `no test results were written for ${unfinished.join(', ')}`;
    lines.push(`  nothing named: ${why}`);
  }
  return `${lines.join('\n')}\n`;
}

// A setup stage that sets where or how the next stages run, so it is carried in front of every later group.
function carriedStage(words) {
  const head = words[0].text.toLowerCase();
  if (FOLDER_STAGE.has(head)) return true;
  if (head === 'set' || head === 'export') return true;
  return words.every(isAssignment);
}

/**
 * The groups a full run's declared command splits into — `{ groups }`, each `{ carried, stages }` — or
 * `{ unsplit }` naming why it runs whole as today, or null for a command that is one node stage, whose legs
 * already name its failures (the built-in node runner always reads results). A command `stagesOf` reads is split when every
 * stage before its last test stage is a setup stage or a test stage a runner owns: each group is a test
 * stage and the setup stages since the previous one, and the stages after the last test stage form the last
 * group; any other readable chain is one group, `unsplit` saying why. Each stage carries the folder it runs
 * in (`cwd`, after the folder changes before it) and the carried stages before it (`before`).
 */
function fullPlan(command, { readers, shapeOf, tree }) {
  const words = stagesOf(command);
  const texts = splitChain(command).map((s) => s.trim());
  if (!words || texts.length !== words.length) return { unsplit: 'its stages cannot be read apart: only stages of plain words joined by && are split' };
  const ownerOf = (text) => readers.find((r) => { try { return r.withRunReport(text, PROBE_DIR) !== text; } catch { return false; } }) || null;
  let cwd = tree;
  const before = [];
  const stages = texts.map((text, i) => {
    const owner = ownerOf(text);
    const setup = setupStage(words[i], shapeOf);
    const stage = { text, owner, setup, cwd, before: [...before] };
    if (setup && carriedStage(words[i])) before.push(stage);
    if (setup && FOLDER_STAGE.has(words[i][0].text.toLowerCase()) && words[i].length === 2) cwd = path.resolve(cwd, words[i][1].text);
    return stage;
  });
  const last = stages.findLastIndex((s) => s.owner);
  if (last < 0) return { unsplit: 'no installed test runner owns a stage of it' };
  if (stages.length === 1 && stages[0].owner.name === 'node') return null;
  const blocking = stages.slice(0, last).find((s) => !s.owner && !s.setup);
  if (blocking) return { groups: [{ carried: [], stages }], unsplit: `a stage before its last test stage is neither a setup stage nor a test stage a runner reads (${blocking.text}), so it runs as one chain` };
  const groups = [];
  let own = [];
  for (const [i, s] of stages.entries()) {
    own.push(s);
    if (s.owner || i === stages.length - 1) {
      groups.push({ carried: own[0].before, stages: own });
      own = [];
    }
  }
  return { groups };
}

const EMPTY_READ = Object.freeze({ failed_tests: [], timed_out: [], projects: [], complete: false, explained: false, stuck: [], copies: [] });

// One stage's results, from its runner; anything the runner cannot read reads incomplete and unexplained.
function readStageResults(owner, args) {
  let read = null;
  try { read = owner.readRunResults(args); } catch { /* unreadable */ }
  if (!read || typeof read !== 'object') return { ...EMPTY_READ };
  const list = (v) => (Array.isArray(v) ? v : []);
  return {
    failed_tests: list(read.failed_tests), timed_out: list(read.timed_out), projects: list(read.projects),
    complete: read.complete === true, explained: read.explained === true, stuck: list(read.stuck), copies: list(read.copies),
  };
}

// A stage's results file copied to the exact file its runner names, against the folder the stage ran in; the
// runner, not the name's extension, says whether the stage named a file or a folder. A failed copy changes nothing.
function copyResults(copies, cwd) {
  for (const c of copies) {
    try {
      const file = path.resolve(cwd, String(c.to));
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(c.from, file);
    } catch { /* the record stands without it */ }
  }
}

// A stuck project's re-run adds evidence and drops nothing: its failures join the first run's, its timeouts
// too, and the project reads as the re-run left it — finished only when the re-run read it whole.
function mergeRerun(read, again, project) {
  const key = (t) => `${t.target}|${t.test}`;
  const seen = new Set(read.failed_tests.map(key));
  read.failed_tests.push(...again.failed_tests.filter((t) => !seen.has(key(t))));
  read.timed_out.push(...again.timed_out);
  const fresh = again.projects.find((p) => p.project === project);
  read.projects = read.projects.map((p) => (p.project === project && fresh ? { ...fresh, ms: (p.ms || 0) + (fresh.ms || 0) } : p));
  read.explained = read.explained && again.explained;
  read.complete = read.complete || (read.explained && read.projects.every((p) => p.state === 'finished'));
}

/**
 * Runs a full run's groups one after the other, every group whatever the one before did, all within the
 * limit: a cut, an overflow, a crash or a signal ends the run and the groups after it are not run. Each test
 * stage reports to `{reportsRoot}/{group}/{k}`; a group with a node stage hands its reporter that stage's
 * folder. After a group, on any outcome, each test stage's runner reads its folder and the stage's own
 * output is copied; each project a .NET hang stopped runs once more without its stuck tests, behind the
 * carried stages before it, reporting to `{group}/rerun-{n}`. Returns each group's outcome and reads, the
 * re-runs, the reds and the output.
 */
async function runFullGroups(plan, { tree, run, env, timeoutMs, started, reportsRoot }) {
  const outputs = [];
  const reds = [];
  const reruns = [];
  const groups = [];
  let halted = false;
  const left = () => Math.max(1, timeoutMs - (Date.now() - started));
  const ended = (res) => Boolean(res.code) || typeof res.status !== 'number';
  for (const [g, group] of plan.groups.entries()) {
    const dirs = group.stages.map((s, k) => (s.owner ? path.join(reportsRoot, String(g), String(k)) : null));
    const outcome = { group, state: 'not-run', ms: 0, reads: [] };
    groups.push(outcome);
    if (halted) {
      for (const [k, s] of group.stages.entries()) {
        if (s.owner) outcome.reads.push(readStageResults(s.owner, { tree, dir: dirs[k], cwd: s.cwd, output: '', stage: s.text }));
      }
      continue;
    }
    for (const d of dirs) if (d) fs.mkdirSync(d, { recursive: true });
    const node = group.stages.findIndex((s) => s.owner && s.owner.name === 'node');
    const groupEnv = node >= 0 ? { ...env, NEXUS_TEST_EVENTS: path.join(dirs[node], NODE_EVENTS) } : env;
    const shell = [...group.carried.map((s) => s.text), ...group.stages.map((s, k) => (s.owner ? s.owner.withRunReport(s.text, dirs[k]) : s.text))].join(' && ');
    const t0 = Date.now();
    const res = await run({ shell, env: groupEnv }, tree, left());
    outcome.ms = Date.now() - t0;
    const output = `${res.stdout}${res.stderr}`;
    outputs.push(output);
    outcome.state = res.code === 'ETIMEDOUT' ? 'cut' : !res.code && res.status === 0 ? 'passed' : 'failed';
    if (res.code || res.status !== 0) reds.push(res);
    if (ended(res)) halted = outcome.ended = true;
    let n = 0;
    for (const [k, s] of group.stages.entries()) {
      if (!s.owner) continue;
      const read = readStageResults(s.owner, { tree, dir: dirs[k], cwd: s.cwd, output, stage: s.text });
      copyResults(read.copies, s.cwd);
      for (const stuck of halted || typeof s.owner.rerunWithout !== 'function' ? [] : read.stuck) {
        const dir = path.join(reportsRoot, String(g), `rerun-${++n}`);
        fs.mkdirSync(dir, { recursive: true });
        let narrowed;
        try { narrowed = s.owner.rerunWithout({ stage: s.text, project: stuck.path || stuck.project, tests: stuck.tests, dir }); } catch { continue; }
        const again = await run({ shell: [...s.before.map((c) => c.text), narrowed].join(' && '), env: groupEnv }, tree, left());
        const out = `${again.stdout}${again.stderr}`;
        outputs.push(out);
        mergeRerun(read, readStageResults(s.owner, { tree, dir, cwd: s.cwd, output: out, stage: narrowed }), stuck.project);
        reruns.push({ project: stuck.project, without: stuck.tests, verdict: again.code === 'ETIMEDOUT' ? 'timeout' : !again.code && again.status === 0 ? 'pass' : 'fail' });
        if (ended(again)) {
          reds.push(again);
          halted = outcome.ended = true;
          if (again.code === 'ETIMEDOUT') outcome.state = 'cut';
          break;
        }
      }
      outcome.reads.push(read);
    }
  }
  return { groups, reruns, reds, outputs };
}

// A group is accounted for when it ran to its end and its runners read every test stage whole, and, where it
// went red, its last stage is a test stage whose red the named failures and timeouts explain: a non-test
// stage that went red, a stage `&&` skipped, a cut, an overflow, a crash or a signal leaves it unaccounted.
function groupAccounted({ group, state, ended, reads }) {
  if (ended || (state !== 'passed' && state !== 'failed')) return false;
  if (!reads.every((r) => r.complete)) return false;
  if (state === 'passed') return true;
  return Boolean(group.stages.at(-1).owner) && reads.every((r) => r.explained)
    && reads.some((r) => r.failed_tests.length > 0 || r.timed_out.length > 0);
}

// How a run's commands are executed. A node run is the composer's legs, as argument lists with no shell:
// the files or tied tests this runner composed run whole under the slow stop, and a declared command that
// is one direct `node --test` stage is split into its fast and slow legs. Anything else — a wrapper, a
// setup stage, another runner — runs as declared, through a shell, and inherits the environment (a one-stage
// `node {script}` wrapper with no word a shell would expand runs as its words with no shell, `directNode`); another
// runner's composed command carries its own stop. The test files a tied fallback adds for the change
// (`changedTests`, the last of `commands`) are one more whole leg. The two legs of a split unit run at the
// same time (`together`, their items one `group`), sharing its test concurrency — node's own default when it
// names none — unless that cap is below two.
function runPlan({ commands, composed, runner, relFiles, settings, tree, root = null, changedTests = [] }) {
  const stop = { fastMs: settings.fastMs, slowMs: settings.slowMs };
  if (changedTests.length) {
    const unit = runPlan({ commands: commands.slice(0, -1), composed, runner, relFiles, settings, tree, root });
    const extra = nodeLegs({ targets: changedTests, stop, labelled: settings.labelled, split: false, cwd: tree });
    return {
      items: [...unit.items.map((i) => ({ ...i, leg: true })), ...extra.map((l) => ({ file: 'node', args: l.args, env: { ...l.env }, leg: true }))],
      legs: unit.legs + extra.length,
      stop: unit.stop || extra.some((l) => l.stopMs !== null),
      together: unit.together,
    };
  }
  const asLegs = (exe, env, legs, together = false) => ({
    items: legs.map((l) => ({ file: exe, args: l.args, env: { ...env, ...l.env }, leg: true, ...(together ? { group: 1 } : {}) })),
    legs: legs.length,
    stop: legs.some((l) => l.stopMs !== null),
    together,
  });
  if (composed && runner === 'node') {
    return asLegs('node', {}, nodeLegs({ targets: relFiles, stop, labelled: settings.labelled, split: false, cwd: tree }));
  }
  // Below Node 22.1 no stop applies, so a declared command runs as declared, its shell expanding its globs.
  const invocation = commands.length === 1 && !composed && nodeSupportsSkipPattern(process.versions.node) ? nodeInvocation(commands[0], { root }) : null;
  if (invocation) {
    const legs = nodeLegs({ targets: invocation.targets, options: invocation.options, stop, labelled: settings.labelled, cwd: tree });
    const shared = shareConcurrency(legs, require('os').availableParallelism() - 1);
    return asLegs(invocation.exe, invocation.env, shared.legs, shared.together);
  }
  return {
    items: commands.map((shell) => { const direct = directNode(shell, tree); return direct ? { shell, direct } : { shell }; }),
    legs: 0, stop: composed && runner !== 'node', together: false,
  };
}

module.exports = { main, timeoutFor, testSettings, readTestEvents, runPlan, endTree, runCommand, endRunning, runningPids, startOptions, usualTime, slowField, runsAtOnce, readClaims, mayStart, takeTurn };

if (require.main === module) main().then((code) => process.exit(code));
