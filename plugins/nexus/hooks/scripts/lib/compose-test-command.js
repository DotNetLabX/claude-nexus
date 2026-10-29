'use strict';
/**
 * The one entry to every runner's test-command grammar. Consumers import it or call the CLI form at the
 * bottom; none carries a local copy of a rule here, because a drifted exclusion fails green.
 *
 * Each runner-keyed export (filesCommand, buildCommand, timingCommand, deltaTargets, stopFlags, joinExclusion, joinStop)
 * refuses a runner outside the core's table, then hands the work to that runner, found by lib/test-runners.js
 * (which holds the contract): node is built in, every other runner ships in its language plugin. A runner no
 * installed plugin serves is refused with the loader's reason. `root` is the session's checkout, which decides
 * which project install is read; it defaults to CLAUDE_PROJECT_DIR, else the working folder. `mtp` is refused
 * by every runner-keyed export until its report form is measured on a fixture project; each form is lifted
 * separately, so the refusal names the form.
 *
 * Commands come back as an array run in sequence — a named-files run over two projects is two invocations — so
 * no consumer branches on the runner to know how to run the result. The string builders stay strings (the paid
 * timing pass runs them through a shell); nodeLegs alone returns argument lists.
 *
 * THE PER-TEST STOPS. A node leg on Node 22.1 or later carries `--test-timeout={ms} --test-force-exit`
 * and the core reporter (test-reporter.mjs) beside the caller's own reporters, or `spec` on stdout. With
 * `slow.labelled`, a run is two legs: the fast set (`--test-skip-pattern "@slow"`) under the fast stop and
 * the slow set (`--test-name-pattern "@slow"`, only the files that hold the label) under the slow stop, its
 * report files named apart; otherwise one leg under the slow stop. Two legs run at the same time share the
 * run's concurrency (shareConcurrency). Below Node 22.1 nothing is added. Each leg names the stop the
 * child-call preload (test-stop-preload.mjs) reads from NEXUS_TEST_STOP_MS. Any other runner takes its own
 * stop flags (stopFlags), in filesCommand when it is given `stopSeconds` and in a declared unit through
 * joinStop.
 *
 * nodeLegs reads which files hold the slow label, and announceLegs and endLegs each append a line to the
 * run's events file — a wrapper calls the first before its legs and the second as its last act, which exits;
 * everything else here only composes text.
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const {
  RUNNERS, INVOCATION, loadRunner, fold, commandSegments, splitChain, inferRunner, isFilteredFull, parseClasses,
} = require('./test-runners');

function checkRunner(runner, form) {
  if (!RUNNERS.has(runner)) {
    throw new Error(`${form}: unknown runner ${JSON.stringify(runner)} (expected ${[...RUNNERS].join(' | ')})`);
  }
  if (runner === 'mtp') throw new Error(`${form}: runner not yet supported (mtp)`);
}

const sessionRoot = (root) => root || process.env.CLAUDE_PROJECT_DIR || process.cwd();

function runnerFor(runner, form, root) {
  checkRunner(runner, form);
  const loaded = loadRunner(runner, { root: sessionRoot(root) });
  if (!loaded.runner) throw new Error(`${form}: ${loaded.reason}`);
  return loaded.runner;
}

// The flags that stop one stuck test, for a stop in whole seconds.
function stopFlags(runner, seconds, { root } = {}) {
  return runnerFor(runner, 'stopFlags', root).stopFlags(seconds);
}

// `stopSeconds` adds the stop flags to a run whose runner stops in the command; a node run takes its stop as
// legs. `step` marks a developer's step run (the runner's own selection rule for it).
function filesCommand({ runner, files, exclude, cwd = process.cwd(), note, stopSeconds, root, step = false }) {
  const r = runnerFor(runner, 'filesCommand', root);
  return r.filesCommand({ files: Array.isArray(files) ? files : [], exclude, cwd, note, stopSeconds: runner === 'node' ? 0 : stopSeconds, step });
}

// A step run that names no test file: the runner's build of the projects owning `files`, or [] where the
// runner builds nothing of its own.
function buildCommand({ runner, files, cwd = process.cwd(), root }) {
  const r = runnerFor(runner, 'buildCommand', root);
  return typeof r.buildCommand === 'function' ? r.buildCommand({ files: Array.isArray(files) ? files : [], cwd }) : [];
}

// The changed-files restriction of a timing pass: what it re-times, and for a runner that filters by class,
// the classes of each target.
function deltaTargets({ runner, files, cwd = process.cwd(), root }) {
  return runnerFor(runner, 'deltaTargets', root).deltaTargets({ files, cwd });
}

// `reporter` (node only) is the reporter module whose records the caller reads; `classes` maps a target to
// the classes its run is filtered to, where the runner filters by class; `exclusion` is a clause the runner's
// `exclusionOf` returned, joined to every command it composes.
function timingCommand({ runner, targets, tmp, n, classes = {}, reporter, note, exclusion = null, root }) {
  return runnerFor(runner, 'timingCommand', root).timingCommand({ targets, tmp, n, classes, reporter, note, exclusion });
}

// The runner's invocation in a declared command, as [start, end], or a refusal naming the form.
function invocationOf(runner, text, form) {
  const target = commandSegments(text).find(([s, e]) => INVOCATION[runner].test(fold(text.slice(s, e))));
  if (!target) throw new Error(`${form}: no ${runner} test invocation in ${JSON.stringify(text)}`);
  return target;
}

function joinExclusion({ runner, unit, root }) {
  checkRunner(runner, 'joinExclusion');
  const text = String(unit || '');
  const [s, e] = invocationOf(runner, text, 'joinExclusion');
  return text.slice(0, s) + runnerFor(runner, 'joinExclusion', root).joinExclusion(text.slice(s, e)) + text.slice(e);
}

// A declared unit or full with its runner's stop joined in; node's stop is applied at run time, so a
// node unit comes back as it was.
function joinStop({ runner, unit, seconds, root }) {
  checkRunner(runner, 'joinStop');
  const text = String(unit || '');
  if (runner === 'node') return text;
  const [s, e] = invocationOf(runner, text, 'joinStop');
  return text.slice(0, s) + runnerFor(runner, 'joinStop', root).joinStop(text.slice(s, e), seconds) + text.slice(e);
}

// --test-skip-pattern first ships in Node 22.1.0; below it Node rejects the flag as a bad option.
function nodeSupportsSkipPattern(version) {
  if (!/^\d+\.\d+\.\d+$/.test(String(version))) return false;
  const [major, minor] = String(version).split('.').map(Number);
  return major > 22 || (major === 22 && minor >= 1);
}

const SLOW_LABEL = '@slow';
const GLOB = /[*?[\]{}]/;
const REPORTER_URL = pathToFileURL(path.join(__dirname, 'test-reporter.mjs')).href;
const PRELOAD_URL = pathToFileURL(path.join(__dirname, 'test-stop-preload.mjs')).href;

// The targets whose source holds the slow label. A file is read as itself, whatever its name; a folder, and
// a glob this Node cannot expand, is kept whole, so its files run in the slow leg too — slower, never wrong.
function labelledFiles({ targets, cwd = process.cwd() }) {
  const out = [];
  const holds = (rel) => { try { return fs.readFileSync(path.resolve(cwd, rel), 'utf8').includes(SLOW_LABEL); } catch { return false; } };
  const stat = (rel) => { try { return fs.statSync(path.resolve(cwd, rel)); } catch { return null; } };
  for (const target of targets) {
    const t = String(target).replace(/\\/g, '/');
    const s = stat(t);
    if (s && s.isDirectory()) { if (!out.includes(t)) out.push(t); continue; }
    if (s || !GLOB.test(t)) { if (holds(t) && !out.includes(t)) out.push(t); continue; }
    if (typeof fs.globSync !== 'function') { if (!out.includes(t)) out.push(t); continue; }
    for (const f of fs.globSync(t, { cwd }).map((p) => String(p).replace(/\\/g, '/')).sort()) {
      if (holds(f) && !out.includes(f)) out.push(f);
    }
  }
  return out;
}

// The options a leg sets itself, dropped from the caller's (with their value when it is the next word), the
// caller's reporters, which every leg keeps beside the core one, and the patterns that decide whether a run
// can be split.
const LEG_OWNED = new Set(['--test-timeout', '--test-force-exit']);
const REPORTING = new Set(['--test-reporter', '--test-reporter-destination']);
const PATTERNS = new Set(['--test-name-pattern', '--test-skip-pattern']);
const VALUED = new Set(['--test-timeout', '--test-reporter', '--test-reporter-destination', '--test-name-pattern', '--test-skip-pattern', '--test-concurrency']);
const STREAMS = new Set(['stdout', 'stderr']);

function splitOptions(options) {
  const kept = [];
  const patterns = [];
  const reporters = [];
  const destinations = [];
  const list = Array.isArray(options) ? options.map(String) : [];
  for (let i = 0; i < list.length; i++) {
    const name = list[i].split('=')[0];
    const pair = !list[i].includes('=') && VALUED.has(name) && list[i + 1] !== undefined && !list[i + 1].startsWith('-');
    const words = pair ? [list[i], list[++i]] : [list[i]];
    const value = pair ? words[1] : list[i].slice(name.length + 1);
    if (LEG_OWNED.has(name)) continue;
    if (REPORTING.has(name)) { (name === '--test-reporter' ? reporters : destinations).push(value); continue; }
    if (PATTERNS.has(name)) patterns.push({ name, value });
    kept.push(...words);
  }
  return { kept, patterns, reporters, destinations };
}

// The reporters a leg writes with: the caller's, each paired with its destination (stdout where it named none,
// as node gives a lone reporter), or `spec` on stdout; then the core reporter. `apart` names the slow leg's
// own file beside each file the caller named, so two legs never write one file.
function reportingArgs({ reporters, destinations }, reporter, apart) {
  const own = reporters.map((r, i) => [r, destinations[i] === undefined ? 'stdout' : destinations[i]]).filter(([r]) => r !== reporter);
  const pairs = own.length ? own : [['spec', 'stdout']];
  const file = (d) => {
    if (!apart || STREAMS.has(d)) return d;
    const ext = path.extname(d);
    return `${d.slice(0, d.length - ext.length)}.slow${ext}`;
  };
  return [...pairs, [reporter, 'stderr']].flatMap(([r, d]) => [`--test-reporter=${r}`, `--test-reporter-destination=${file(d)}`]);
}

/**
 * The node legs of one run, as argument lists for `node`, each with the stop the child-call preload is
 * handed (`env.NEXUS_TEST_STOP_MS`). `options` are the caller's own node options; `split: false` runs
 * every target whole under the slow stop (a step close). A caller's own `@slow` skip keeps its one leg
 * and, labelled, takes the fast stop; any other name or skip pattern keeps one leg under the slow stop.
 */
function nodeLegs({ targets, options = [], stop, labelled = false, split = true, cwd = process.cwd(),
  nodeVersion = process.versions.node, reporter = REPORTER_URL, slowFiles }) {
  const list = (Array.isArray(targets) ? targets : []).map(String);
  const split_ = splitOptions(options);
  const { kept, patterns } = split_;
  if (!nodeSupportsSkipPattern(nodeVersion)) return [{ args: ['--test', ...(Array.isArray(options) ? options : []).map(String), ...list], stopMs: null, env: {} }];
  const leg = (ms, extra, files, apart = false) => ({
    args: ['--test', ...kept, `--test-timeout=${ms}`, '--test-force-exit', ...reportingArgs(split_, reporter, apart), ...extra, ...files],
    stopMs: ms,
    env: { NEXUS_TEST_STOP_MS: String(ms) },
  });
  const skipsSlow = patterns.some((p) => p.name === '--test-skip-pattern' && p.value === SLOW_LABEL);
  if (skipsSlow) return [leg(labelled ? stop.fastMs : stop.slowMs, [], list)];
  if (!labelled || !split || patterns.length) return [leg(stop.slowMs, [], list)];
  const slow = Array.isArray(slowFiles) ? slowFiles : labelledFiles({ targets: list, cwd });
  const legs = [leg(stop.fastMs, ['--test-skip-pattern', SLOW_LABEL], list)];
  // With no target, node discovers the files itself, so the slow leg must run too.
  if (slow.length || list.length === 0) legs.push(leg(stop.slowMs, ['--test-name-pattern', SLOW_LABEL], slow, true));
  return legs;
}

const CONCURRENCY = '--test-concurrency';

/**
 * Two legs run at the same time share the run's test concurrency, never add to it: the slow leg takes a
 * third of it (at least one), the fast leg the rest. The cap is the legs' own `--test-concurrency`, else
 * `fallback` (node's default). A cap below two cannot be shared, so the legs keep it each and run one after
 * the other (`together: false`); so does a run of one leg.
 */
function shareConcurrency(legs, fallback) {
  if (!Array.isArray(legs) || legs.length !== 2) return { legs, together: false };
  const strip = (args) => {
    let cap = null;
    const out = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === CONCURRENCY) { cap = Number(args[++i]); continue; }
      if (args[i].startsWith(`${CONCURRENCY}=`)) { cap = Number(args[i].slice(CONCURRENCY.length + 1)); continue; }
      out.push(args[i]);
    }
    return { cap, args: out };
  };
  const stripped = legs.map((l) => strip(l.args));
  const declared = stripped[0].cap;
  const cap = Number.isInteger(declared) && declared > 0 ? declared : Math.max(1, Math.floor(Number(fallback)) || 1);
  const together = cap >= 2;
  const slow = together ? Math.max(1, Math.round(cap / 3)) : cap;
  const shares = together ? [cap - slow, slow] : [cap, cap];
  return {
    legs: legs.map((l, i) => ({ ...l, args: [stripped[i].args[0], `${CONCURRENCY}=${shares[i]}`, ...stripped[i].args.slice(1)] })),
    together,
  };
}

// A wrapper that runs legs of its own says how many first, so the run's events count as complete only
// when every leg reported its end.
function announceLegs(n, env = process.env) {
  if (!env.NEXUS_TEST_EVENTS) return;
  fs.appendFileSync(env.NEXUS_TEST_EVENTS, `${JSON.stringify({ kind: 'legs', legs: n })}\n`);
}

// A wrapper's last act, once its legs ended and nothing of its own failed: it writes that its exit is its legs'
// outcome — their statuses (a missing one counts 1), the worse of them, `own: "passed"` and the script and
// process that write it — and exits with that worse status. A wrapper whose own check failed exits without it,
// and so does one with an `exit` listener registered: process.exit runs it after the line, and it may still
// fail. Its red exit reads as its legs' own only when this line is the last its command wrote, names that exit,
// and comes from the process verify-run.js started for a one-stage `node {script}` command, running that
// script — never from a process that one started. `proc` (its `exit` and `listenerCount`) is for a test.
function endLegs(statuses, env = process.env, proc = process) {
  const list = (Array.isArray(statuses) ? statuses : []).map((s) => (Number.isInteger(s) ? s : 1));
  const status = list.reduce((a, b) => Math.max(a, b), 0);
  const script = process.argv[1] ? path.resolve(process.argv[1]) : null;
  if (env.NEXUS_TEST_EVENTS && proc.listenerCount('exit') === 0) fs.appendFileSync(env.NEXUS_TEST_EVENTS, `${JSON.stringify({ kind: 'legs-end', statuses: list, status, own: 'passed', script, pid: process.pid })}\n`);
  proc.exit(status);
  return status;
}

module.exports = {
  filesCommand, buildCommand, timingCommand, deltaTargets, parseClasses, isFilteredFull, joinExclusion, nodeSupportsSkipPattern,
  splitChain, inferRunner, stopFlags, joinStop, labelledFiles, nodeLegs, shareConcurrency, announceLegs, endLegs,
  REPORTER_URL, PRELOAD_URL,
};

// `filtered` is the core's own predicate and needs no runner; `join` and `join-stop` need the runner's.
function cli(argv) {
  const [sub, ...rest] = argv;
  const dash = rest.indexOf('--');
  const tail = dash >= 0 ? rest.slice(dash + 1).join(' ') : '';
  const flag = (name) => { const i = rest.indexOf(`--${name}`); return i >= 0 && (dash < 0 || i < dash) ? rest[i + 1] : undefined; };
  try {
    if (sub === 'join') return { out: joinExclusion({ runner: flag('runner'), unit: tail }) };
    if (sub === 'join-stop') {
      const seconds = Number(flag('seconds'));
      if (!Number.isInteger(seconds) || seconds <= 0) return { err: 'join-stop: --seconds is a whole number > 0' };
      return { out: joinStop({ runner: flag('runner'), unit: tail, seconds }) };
    }
    if (sub === 'filtered') return { out: String(isFilteredFull(tail)) };
    if (sub === 'node-skip-pattern') return { out: String(nodeSupportsSkipPattern(process.versions.node)) };
    return { err: 'usage: compose-test-command.js join --runner <r> -- "<unit>" | join-stop --runner <r> --seconds <n> -- "<unit>" | filtered -- "<full>" | node-skip-pattern' };
  } catch (e) {
    return { err: e.message };
  }
}

if (require.main === module) {
  const { out, err } = cli(process.argv.slice(2));
  if (err) {
    process.stderr.write(`compose-test-command: ${err}\n`);
    process.exit(2);
  }
  process.stdout.write(`${out}\n`);
}
