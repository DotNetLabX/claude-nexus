'use strict';
/**
 * The one owner of every per-runner test-command grammar. Consumers import it or call the CLI form
 * at the bottom; none carries a local copy of a rule here, because a drifted exclusion fails green.
 *
 * No spawns and no network. The `vstest` branch of filesCommand reads synchronously (the nearest
 * ancestor .csproj, the `class` declarations), and so does nodeLegs (which files hold the slow label);
 * the one write is announceLegs, a line appended to the run's events file. Everything else is pure.
 *
 * `mtp` is refused by every runner-keyed export until its report form is measured on a fixture
 * project; each form is lifted separately, so the refusal names the form.
 *
 * Commands come back as an array run in sequence — a vstest named-files run over two projects is two
 * invocations — so no consumer branches on the runner to know how to run the result. The string
 * builders stay strings (the paid timing pass runs them through a shell); nodeLegs alone returns
 * argument lists.
 *
 * THE PER-TEST STOPS. A node leg on Node 22.1 or later carries `--test-timeout={ms} --test-force-exit`
 * and the core reporter (test-reporter.mjs) beside `spec` on stdout. With `slow.labelled`, a run is two
 * legs: the fast set (`--test-skip-pattern "@slow"`) under the fast stop and the slow set
 * (`--test-name-pattern "@slow"`, only the files that hold the label) under the slow stop; otherwise one
 * leg under the slow stop. Below Node 22.1 nothing is added. Each leg names the stop the child-call
 * preload (test-stop-preload.mjs) reads from NEXUS_TEST_STOP_MS. vstest takes
 * `--blame-hang-timeout {s}s --blame-hang-dump-type none` and flutter `--timeout {s}s` (stopFlags),
 * in filesCommand when it is given `stopSeconds` and in a declared unit through joinStop.
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const RUNNERS = new Set(['vstest', 'mtp', 'node', 'flutter']);
const VSTEST_SLOW_CLAUSE = 'Speed!=Slow';

// A .csproj is a test project when it references a test SDK or a test framework, or says so outright.
const TEST_PROJECT = /Microsoft\.NET\.Test\.Sdk|<IsTestProject>\s*true|xunit|nunit|mstest/i;

function checkRunner(runner, form) {
  if (!RUNNERS.has(runner)) {
    throw new Error(`${form}: unknown runner ${JSON.stringify(runner)} (expected vstest | mtp | node | flutter)`);
  }
  if (runner === 'mtp') throw new Error(`${form}: runner not yet supported (mtp)`);
}

const quote = (p) => `"${String(p).replace(/\\/g, '/')}"`;

const TEST_FILE = {
  node: /\.test\.(mjs|js|cjs)$/,
  flutter: /_test\.dart$/,
};

function checkTestFiles(runner, files) {
  for (const f of files) {
    if (!TEST_FILE[runner].test(String(f))) {
      throw new Error(`filesCommand: ${f} is not a ${runner} test file`);
    }
  }
}

function parseClasses(source) {
  const names = [];
  for (const m of String(source).matchAll(/\bclass\s+([A-Za-z_]\w*)/g)) {
    if (!names.includes(m[1])) names.push(m[1]);
  }
  return names;
}

// Bounded by cwd: a .csproj above the tree belongs to some other checkout.
function nearestTestProject(absFile, cwd) {
  const top = path.resolve(cwd);
  let dir = path.dirname(absFile);
  while (dir === top || dir.startsWith(top + path.sep)) {
    let projects = [];
    try { projects = fs.readdirSync(dir).filter((n) => n.endsWith('.csproj')).sort(); } catch { /* unreadable */ }
    if (projects.length > 0) {
      const proj = path.join(dir, projects[0]);
      let text = '';
      try { text = fs.readFileSync(proj, 'utf8'); } catch { /* unreadable */ }
      return TEST_PROJECT.test(text) ? proj : null;
    }
    if (dir === top || path.dirname(dir) === dir) break;
    dir = path.dirname(dir);
  }
  return null;
}

const disjunction = (classes) => classes.map((c) => `FullyQualifiedName~${c}`).join('|');

// Under cmd.exe's 8,191-character line limit with room for its own wrapper. Applied on every
// platform so the Linux gate exercises the fallback the Windows run depends on.
const COMMAND_BUDGET = 7000;

// A filter that would take the command past the budget is dropped, keeping only the slow exclusion:
// the whole project runs, which is slower and never wrong.
function vstestFiltered(head, classes, exclude, note) {
  let expr = disjunction(classes);
  if (exclude) expr = `${classes.length > 1 ? `(${expr})` : expr}&${VSTEST_SLOW_CLAUSE}`;
  const command = `${head} --filter "${expr}"`;
  if (command.length <= COMMAND_BUDGET) return command;
  if (note) note(`${head}: its class filter makes a ${command.length}-character command, over the ${COMMAND_BUDGET}-character budget — running the whole project`);
  return exclude ? `${head} --filter "${VSTEST_SLOW_CLAUSE}"` : head;
}

// `strict` refuses what a changed-files restriction drops: a named-files run names only test files, while a diff
// over a test root also lists the code under test.
function classesByProject(files, cwd, strict) {
  const byProject = new Map();
  for (const f of files) {
    const abs = path.resolve(cwd, f);
    const proj = String(f).endsWith('.cs') ? nearestTestProject(abs, cwd) : null;
    if (!proj) {
      if (strict) throw new Error(`filesCommand: ${f} is not a .cs file under a test project`);
      continue;
    }
    let classes = [];
    try { classes = parseClasses(fs.readFileSync(abs, 'utf8')); } catch { /* unreadable → no classes */ }
    if (classes.length === 0) {
      if (strict) throw new Error(`filesCommand: ${f} declares no class to filter on`);
      continue;
    }
    const rel = path.relative(cwd, proj).replace(/\\/g, '/');
    if (!byProject.has(rel)) byProject.set(rel, []);
    const names = byProject.get(rel);
    for (const c of classes) if (!names.includes(c)) names.push(c);
  }
  return byProject;
}

// The flags that stop one stuck test, for a stop in whole seconds.
function stopFlags(runner, seconds) {
  checkRunner(runner, 'stopFlags');
  if (runner === 'node') return `--test-timeout=${seconds * 1000} --test-force-exit`;
  if (runner === 'vstest') return `--blame-hang-timeout ${seconds}s --blame-hang-dump-type none`;
  return `--timeout ${seconds}s`;
}

// `stopSeconds` adds the stop flags to a vstest or flutter run; a node run takes its stop as legs.
function filesCommand({ runner, files, exclude, cwd = process.cwd(), note, stopSeconds }) {
  checkRunner(runner, 'filesCommand');
  const list = Array.isArray(files) ? files : [];
  const stop = stopSeconds && runner !== 'node' ? ` ${stopFlags(runner, stopSeconds)}` : '';
  if (runner === 'vstest') {
    return [...classesByProject(list, cwd, true)].map(([proj, classes]) =>
      vstestFiltered(`dotnet test ${quote(proj)}${stop}`, classes, exclude, note));
  }
  checkTestFiles(runner, list);
  const quoted = list.map(quote).join(' ');
  if (runner === 'node') {
    return [`node --test ${exclude ? '--test-skip-pattern "@slow" ' : ''}${quoted}`];
  }
  return [`flutter test${stop} ${quoted}${exclude ? ' -x slow' : ''}`];
}

// The changed-files restriction: the changed test files for node / flutter; for vstest the test
// projects of the changed .cs files, each with only the classes that live in it.
function deltaTargets({ runner, files, cwd = process.cwd() }) {
  checkRunner(runner, 'deltaTargets');
  const list = (Array.isArray(files) ? files : []).map(String);
  if (runner !== 'vstest') return { targets: list.filter((f) => TEST_FILE[runner].test(f)), classes: {} };
  const byProject = classesByProject(list, cwd, false);
  return { targets: [...byProject.keys()], classes: Object.fromEntries(byProject) };
}

// `reporter` (node only) is the reporter module whose records the caller reads; `classes`
// (vstest only) maps a target to the classes its run is filtered to.
function timingCommand({ runner, targets, tmp, n, classes = {}, reporter, note }) {
  checkRunner(runner, 'timingCommand');
  const list = Array.isArray(targets) ? targets : [];
  const dir = String(tmp).replace(/\\/g, '/');
  if (runner === 'node') {
    if (!reporter) throw new Error('timingCommand: node needs a reporter module');
    return [`node --test --test-reporter=${quote(reporter)} --test-reporter-destination=${quote(`${dir}/${n}.jsonl`)} ${list.map(quote).join(' ')}`];
  }
  if (runner === 'flutter') {
    return [`flutter test --reporter json ${list.map(quote).join(' ')}`];
  }
  return list.map((t) => {
    const head = `dotnet test ${quote(t)} --logger trx --results-directory ${quote(dir)}`;
    const own = classes[t];
    return Array.isArray(own) && own.length ? vstestFiltered(head, own, false, note) : head;
  });
}

const FILTER_CLAUSE_FLAGS = new Set(['--filter', '--filter-not-trait', '-x', '--exclude-tags', '--test-skip-pattern', '--exclude']);

const fold = (command) => String(command || '').replace(/["']/g, '').replace(/\s+/g, ' ').trim();

function isFilteredFull(command) {
  return fold(command).split(' ').some((token) => FILTER_CLAUSE_FLAGS.has(token.split('=')[0]));
}

// Chain separators (&&, ||, ;, |, &, newline) split a command line only OUTSIDE quotes: a VSTest
// filter expression carries `&` and `|` inside its quotes, and a quoted message carries anything.
function commandSegments(text) {
  const segments = [];
  let start = 0;
  let quoteChar = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoteChar) { if (ch === quoteChar) quoteChar = ''; continue; }
    if (ch === '"' || ch === "'") { quoteChar = ch; continue; }
    if (ch === ';' || ch === '&' || ch === '|' || ch === '\n' || ch === '\r') {
      segments.push([start, i]);
      if ((ch === '&' || ch === '|') && text[i + 1] === ch) i++;
      start = i + 1;
    }
  }
  segments.push([start, text.length]);
  return segments;
}

function splitChain(text) {
  const s = String(text || '');
  return commandSegments(s).map(([start, end]) => s.slice(start, end));
}

const INVOCATION = {
  vstest: /(^|\s)dotnet\s+test(\s|$)/,
  node: /(^|\s)node(\.exe)?\s(.*\s)?--test(\s|$)/,
  flutter: /(^|\s)(flutter|dart)\s+test(\s|$)/,
};

const ALREADY_EXCLUDED = {
  vstest: /Speed!=Slow/,
  node: /--test-skip-pattern[= ]@slow(\s|$)/,
  flutter: /(^|\s)(-x|--exclude-tags)[= ]slow(\s|$)/,
};

function inferRunner(command) {
  for (const segment of splitChain(command)) {
    const folded = fold(segment);
    const runner = ['vstest', 'node', 'flutter'].find((r) => INVOCATION[r].test(folded));
    if (runner) return runner;
  }
  return '';
}

function hasTopLevelOr(expr) {
  let depth = 0;
  for (const ch of expr) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === '|' && depth === 0) return true;
  }
  return false;
}

function joinVstest(segment) {
  const filter = segment.match(/--filter(\s+|[=:])(?:"([^"]*)"|'([^']*)'|([^\s"']+))/);
  if (filter) {
    const expr = filter[2] ?? filter[3] ?? filter[4];
    const joined = `${hasTopLevelOr(expr) ? `(${expr})` : expr}&${VSTEST_SLOW_CLAUSE}`;
    return segment.slice(0, filter.index) + `--filter${filter[1]}"${joined}"` + segment.slice(filter.index + filter[0].length);
  }
  const clause = ` --filter "${VSTEST_SLOW_CLAUSE}"`;
  const runsettings = segment.match(/\s--(\s|$)/);
  if (runsettings) return segment.slice(0, runsettings.index) + clause + segment.slice(runsettings.index);
  const body = segment.replace(/\s+$/, '');
  return body + clause + segment.slice(body.length);
}

function insertAfter(segment, re, flag) {
  const m = segment.match(re);
  const at = m.index + m[0].length;
  return segment.slice(0, at) + flag + segment.slice(at);
}

function joinExclusion({ runner, unit }) {
  checkRunner(runner, 'joinExclusion');
  const text = String(unit || '');
  const target = commandSegments(text).find(([s, e]) => INVOCATION[runner].test(fold(text.slice(s, e))));
  if (!target) throw new Error(`joinExclusion: no ${runner} test invocation in ${JSON.stringify(text)}`);
  const [s, e] = target;
  const segment = text.slice(s, e);
  if (ALREADY_EXCLUDED[runner].test(fold(segment))) return text;
  let joined;
  if (runner === 'vstest') joined = joinVstest(segment);
  else if (runner === 'node') joined = insertAfter(segment, /(^|\s)--test(?=\s|$)/, ' --test-skip-pattern "@slow"');
  else joined = insertAfter(segment, /(flutter|dart)\s+test(?=\s|$)/, ' -x slow');
  return text.slice(0, s) + joined + text.slice(e);
}

// --test-skip-pattern first ships in Node 22.1.0; below it Node rejects the flag as a bad option.
function nodeSupportsSkipPattern(version) {
  if (!/^\d+\.\d+\.\d+$/.test(String(version))) return false;
  const [major, minor] = String(version).split('.').map(Number);
  return major > 22 || (major === 22 && minor >= 1);
}

const ALREADY_STOPPED = {
  vstest: /(^|\s)--blame-hang-timeout[= ]/,
  flutter: /(^|\s)--timeout[= ]/,
};

// A declared unit or full with its runner's stop joined in; node's stop is applied at run time, so a
// node unit comes back as it was.
function joinStop({ runner, unit, seconds }) {
  checkRunner(runner, 'joinStop');
  const text = String(unit || '');
  if (runner === 'node') return text;
  const target = commandSegments(text).find(([s, e]) => INVOCATION[runner].test(fold(text.slice(s, e))));
  if (!target) throw new Error(`joinStop: no ${runner} test invocation in ${JSON.stringify(text)}`);
  const [s, e] = target;
  const segment = text.slice(s, e);
  if (ALREADY_STOPPED[runner].test(fold(segment))) return text;
  const at = runner === 'vstest' ? /dotnet\s+test(?=\s|$)/ : /(flutter|dart)\s+test(?=\s|$)/;
  return text.slice(0, s) + insertAfter(segment, at, ` ${stopFlags(runner, seconds)}`) + text.slice(e);
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

// The options a leg sets itself, dropped from the caller's (with their value when it is the next word),
// and the patterns that decide whether a run can be split.
const LEG_OWNED = new Set(['--test-timeout', '--test-force-exit', '--test-reporter', '--test-reporter-destination']);
const PATTERNS = new Set(['--test-name-pattern', '--test-skip-pattern']);
const VALUED = new Set(['--test-timeout', '--test-reporter', '--test-reporter-destination', '--test-name-pattern', '--test-skip-pattern', '--test-concurrency']);

function splitOptions(options) {
  const kept = [];
  const patterns = [];
  const list = Array.isArray(options) ? options.map(String) : [];
  for (let i = 0; i < list.length; i++) {
    const name = list[i].split('=')[0];
    const pair = !list[i].includes('=') && VALUED.has(name) && list[i + 1] !== undefined && !list[i + 1].startsWith('-');
    const words = pair ? [list[i], list[++i]] : [list[i]];
    if (LEG_OWNED.has(name)) continue;
    if (PATTERNS.has(name)) patterns.push({ name, value: pair ? words[1] : list[i].slice(name.length + 1) });
    kept.push(...words);
  }
  return { kept, patterns };
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
  const { kept, patterns } = splitOptions(options);
  if (!nodeSupportsSkipPattern(nodeVersion)) return [{ args: ['--test', ...kept, ...list], stopMs: null, env: {} }];
  const leg = (ms, extra, files) => ({
    args: ['--test', ...kept, `--test-timeout=${ms}`, '--test-force-exit',
      '--test-reporter=spec', '--test-reporter-destination=stdout', `--test-reporter=${reporter}`, '--test-reporter-destination=stderr',
      ...extra, ...files],
    stopMs: ms,
    env: { NEXUS_TEST_STOP_MS: String(ms) },
  });
  const skipsSlow = patterns.some((p) => p.name === '--test-skip-pattern' && p.value === SLOW_LABEL);
  if (skipsSlow) return [leg(labelled ? stop.fastMs : stop.slowMs, [], list)];
  if (!labelled || !split || patterns.length) return [leg(stop.slowMs, [], list)];
  const slow = Array.isArray(slowFiles) ? slowFiles : labelledFiles({ targets: list, cwd });
  const legs = [leg(stop.fastMs, ['--test-skip-pattern', SLOW_LABEL], list)];
  // With no target, node discovers the files itself, so the slow leg must run too.
  if (slow.length || list.length === 0) legs.push(leg(stop.slowMs, ['--test-name-pattern', SLOW_LABEL], slow));
  return legs;
}

// A wrapper that runs legs of its own says how many first, so the run's events count as complete only
// when every leg reported its end.
function announceLegs(n, env = process.env) {
  if (!env.NEXUS_TEST_EVENTS) return;
  fs.appendFileSync(env.NEXUS_TEST_EVENTS, `${JSON.stringify({ kind: 'legs', legs: n })}\n`);
}

module.exports = {
  COMMAND_BUDGET, filesCommand, timingCommand, deltaTargets, parseClasses, isFilteredFull, joinExclusion, nodeSupportsSkipPattern,
  splitChain, inferRunner, stopFlags, joinStop, labelledFiles, nodeLegs, announceLegs, REPORTER_URL, PRELOAD_URL,
};

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
