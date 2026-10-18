#!/usr/bin/env node
'use strict';
/**
 * The tests tied to a change: the test files that exercise a changed file, as the repo's layout shows it,
 * plus the test files the change itself edits. verify-run.js `--tied` runs them; the CLI lists them.
 *
 *   node tied-tests.js --list --repo <path> --changed <file>...
 *
 * node: a changed test file is its own target, and a changed source ties to every test file whose base
 * name is the source's (src/foo.js → tests/unit/foo.test.mjs). vstest: a changed file belongs to its
 * nearest project; it ties to that project when that is a test project, and to every test project whose
 * csproj holds a ProjectReference to it — direct references only. Each .NET target runs as
 * `dotnet test "{project}"` with the declared unit's `--filter`, and the slow exclusion where slow tests
 * are declared, composed here: compose-test-command.js composes named-files runs, whose vstest form takes
 * test files only. A unit whose `dotnet test` runs carry different filters cannot be tied. A node unit's
 * own skips beyond the slow tag are not carried.
 *
 * Files lib/tree-hash.js leaves out of the hash (docs/, the pipeline's own writes) are ignored, since no
 * close ever asks for them. Any other changed file that ties to no test makes the set unknown: `fallback`
 * names why, and the caller runs its declared step tests instead — a step never runs no test at all.
 *
 * failedTargets reads a run's output for the test files (node) or test projects (vstest) it reports
 * failing, or null when it names none it can place in the repo, names one it cannot place, was aborted,
 * or ran anything but a listed shape: the runner invoked directly, with listed options only, as its last
 * stage after listed setup stages (a wrapper may stop at its first failing stage; an unlisted shape may hide one).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { fileURLToPath } = require('url');
const { filesCommand, inferRunner, joinExclusion, splitChain } = require('./compose-test-command');
const { isExcluded } = require('./tree-hash');

const NODE_SOURCE = /\.(js|mjs|cjs|ts|mts|cts|jsx|tsx)$/;
const NODE_TEST = /\.test\.(mjs|js|cjs)$/;
// compose-test-command.js keeps its own copy private; this one must say the same.
const TEST_PROJECT = /Microsoft\.NET\.Test\.Sdk|<IsTestProject>\s*true|xunit|nunit|mstest/i;
const WALK_SKIP = new Set(['.git', 'node_modules', 'bin', 'obj']);
const WALK_LIMIT = 50000;

const slashes = (p) => String(p).replace(/\\/g, '/');
const relTo = (repo, f) => slashes(path.relative(repo, path.resolve(repo, slashes(f))));

function walk(repo) {
  const out = [];
  const stack = [''];
  while (stack.length && out.length < WALK_LIMIT) {
    const dir = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(path.join(repo, dir), { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (e.isDirectory()) { if (!WALK_SKIP.has(e.name)) stack.push(rel); } else out.push(rel);
    }
  }
  return out;
}

function listFiles(repo) {
  try {
    return execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024, windowsHide: true,
    }).split('\0').filter(Boolean);
  } catch {
    return walk(repo);
  }
}

function readConfig(repo) {
  try { return JSON.parse(fs.readFileSync(path.join(repo, '.claude', 'verify.json'), 'utf8')); } catch { return null; }
}

// The runner verify-run.js composes `--files` for: `slow.runner`, else the one the declared unit invokes.
function runnerOf(cfg) {
  if (cfg && cfg.slow && typeof cfg.slow.runner === 'string' && cfg.slow.runner) return cfg.slow.runner;
  const unit = cfg && cfg.roles && cfg.roles.unit;
  return typeof unit === 'string' ? inferRunner(unit) : '';
}

// What tiedSet reads of a repo's verify.json: the runner, the declared unit and the slow declaration.
function declaredFor(cfg) {
  const unit = cfg && cfg.roles && typeof cfg.roles.unit === 'string' ? cfg.roles.unit : '';
  const slow = cfg && cfg.slow && typeof cfg.slow === 'object' ? cfg.slow : null;
  return { runner: runnerOf(cfg), unit, slow };
}

const exists = (repo, rel) => { try { return fs.statSync(path.join(repo, rel)).isFile(); } catch { return false; } };

function nodeTies(repo, changed, listing) {
  const tests = listing.map(slashes).filter((f) => NODE_TEST.test(f) && !isExcluded(f));
  const stem = (f, re) => path.posix.basename(f).replace(re, '');
  const targets = new Set();
  const untied = [];
  for (const f of changed) {
    const hits = NODE_TEST.test(f) ? [f] : NODE_SOURCE.test(f) ? tests.filter((t) => stem(t, NODE_TEST) === stem(f, NODE_SOURCE)) : [];
    const live = hits.filter((t) => exists(repo, t));
    if (live.length === 0) untied.push(f);
    for (const t of live) targets.add(t);
  }
  return { targets: [...targets].sort(), untied };
}

function readProjects(repo, listing) {
  return listing.map(slashes).filter((f) => f.endsWith('.csproj')).map((file) => {
    let text = '';
    try { text = fs.readFileSync(path.join(repo, file), 'utf8'); } catch { /* removed: no references, not a test project */ }
    const dir = path.posix.dirname(file);
    const refs = [...text.matchAll(/<ProjectReference\s+Include\s*=\s*"([^"]+)"/gi)]
      .map((m) => path.posix.normalize(path.posix.join(dir, slashes(m[1]))));
    const assembly = (text.match(/<AssemblyName>\s*([^<\s]+)\s*<\/AssemblyName>/i) || [])[1];
    return { file, dir, refs, test: TEST_PROJECT.test(text), assembly: assembly || path.posix.basename(file, '.csproj') };
  });
}

function ownerOf(f, projects) {
  if (f.endsWith('.csproj')) return projects.find((p) => p.file === f) || null;
  let best = null;
  for (const p of projects) {
    const inside = p.dir === '.' || f.startsWith(`${p.dir}/`);
    if (inside && (!best || p.dir.length > best.dir.length)) best = p;
  }
  return best;
}

function dotnetTies(repo, changed, listing) {
  const projects = readProjects(repo, listing);
  const targets = new Set();
  const untied = [];
  for (const f of changed) {
    const owner = ownerOf(f, projects);
    const hits = owner ? projects.filter((p) => p.test && (p.file === owner.file || p.refs.includes(owner.file))) : [];
    if (hits.length === 0) untied.push(f);
    for (const p of hits) targets.add(p.file);
  }
  return { targets: [...targets].sort(), untied };
}

// The `--filter` forms the shared composer's vstest join accepts: quoted either way, `=` or `:`.
const FILTER = /--filter(\s+|[=:])(?:"([^"]*)"|'([^']*)'|([^\s"']+))/;

// The one filter every `dotnet test` run of the declared unit carries ('' for none), or null when two
// runs differ — then no tied project can be told which filter is its own.
function unitFilter(unit) {
  const filters = new Set();
  for (const segment of splitChain(unit)) {
    if (inferRunner(segment) !== 'vstest') continue;
    const m = segment.match(FILTER);
    filters.add(m ? (m[2] ?? m[3] ?? m[4]) : '');
  }
  if (filters.size > 1) return null;
  return filters.size ? [...filters][0] : '';
}

// A tied run is never wider than the step close it stands in for: it keeps the unit's filter and,
// where slow tests are declared, their exclusion.
function dotnetCommand(project, filter, slow) {
  const head = `dotnet test "${project}"${filter ? ` --filter "${filter}"` : ''}`;
  return slow ? joinExclusion({ runner: 'vstest', unit: head }) : head;
}

function tiedSet({ repo, changed, runner, unit = '', slow = null, listing = null }) {
  const named = [...new Set((changed || []).map((f) => relTo(repo, f)))];
  const considered = named.filter((f) => !isExcluded(f));
  const result = (fields) => ({
    runner, changed: named, ignored: named.filter(isExcluded), targets: [], untied: [], commands: [], fallback: null, ...fields,
  });
  if (considered.length === 0) return result({ fallback: "no changed file outside docs/ and the pipeline's own files" });
  if (runner !== 'node' && runner !== 'vstest') {
    return result({ fallback: runner ? `tests are tied for node and vstest repos, not ${runner}` : 'no test runner in .claude/verify.json' });
  }
  const files = listing || listFiles(repo);
  const { targets, untied } = runner === 'node' ? nodeTies(repo, considered, files) : dotnetTies(repo, considered, files);
  if (untied.length) return result({ targets, untied, fallback: `no tied test for ${untied.join(', ')}` });
  if (runner === 'node') return result({ targets, commands: filesCommand({ runner: 'node', files: targets, exclude: false, cwd: repo }) });
  const filter = unitFilter(typeof unit === 'string' ? unit : '');
  if (filter === null) {
    return result({ targets, fallback: "the declared unit's dotnet test runs carry different filters, so a tied project's own cannot be told" });
  }
  return result({ targets, commands: targets.map((p) => dotnetCommand(p, filter, Boolean(slow))) });
}

// The spec reporter's `test at {file}:{line}:{col}` and the TAP reporter's `location: '{file}:…'`.
const NODE_FAILURE = /(?:^\s*test at |location:\s*')(.+?):\d+:\d+/gm;
// The VSTest summary line of an assembly with a failure.
const DOTNET_FAILURE = /^\s*Failed!\s+-\s+Failed:.*?-\s+([^\s\\/]+)\.dll\b/gm;

// The command shapes a red run's list is read from, and nothing else: stages joined by `&&` alone,
// each made of plain words. A word is a run of characters neither sh nor cmd gives a meaning, or one
// whole double-quoted word whose content neither expands. Anything else — a quote inside a word or
// after `=`, a single quote, a backslash, `$`, `%`, a backtick, a redirection, a pipe, any other
// separator — is a shape that cannot be told, and the caller reads it as null.
const PLAIN = /[A-Za-z0-9_./:=,@+*?-]/;
const UNSAFE_QUOTED = /['\\$`%\r\n]/;
const WORD_END = (ch) => ch === undefined || ch === ' ' || ch === '\t' || ch === '&';

function stagesOf(command) {
  const s = String(command);
  const stages = [[]];
  for (let i = 0; i < s.length;) {
    const ch = s[i];
    if (ch === ' ' || ch === '\t') { i++; continue; }
    if (ch === '&') {
      if (s[i + 1] !== '&') return null;
      stages.push([]);
      i += 2;
      continue;
    }
    let text;
    let quoted = false;
    let end;
    if (ch === '"') {
      end = s.indexOf('"', i + 1);
      if (end < 0) return null;
      text = s.slice(i + 1, end);
      if (UNSAFE_QUOTED.test(text)) return null;
      quoted = true;
      end++;
    } else {
      end = i;
      while (end < s.length && PLAIN.test(s[end])) end++;
      text = s.slice(i, end);
      if (!text || /^[*?]/.test(text)) return null;
    }
    if (!WORD_END(s[end])) return null;
    stages.at(-1).push({ text, quoted });
    i = end;
  }
  return stages.every((words) => words.length) ? stages : null;
}

const RUNNERS = new Map([['node', 'node'], ['dotnet', 'vstest'], ['flutter', 'flutter'], ['dart', 'flutter']]);
// The variables a stage may set: none that a supported runner reads as options or as code to load.
const SAFE_ENV = new Set(['CI', 'NODE_ENV', 'NO_COLOR', 'TZ', 'LANG', 'LC_ALL', 'DOTNET_NOLOGO', 'DOTNET_CLI_TELEMETRY_OPTOUT']);

function isAssignment(word) {
  const m = !word.quoted && /^([A-Za-z_]\w*)=/.exec(word.text);
  return Boolean(m && SAFE_ENV.has(m[1]));
}

// A runner by the executable's own name, bare or by an absolute path, never through another program.
function runnerNamed(word) {
  const exe = word.text;
  if (exe.includes('/') && !/^(?:\/|[A-Za-z]:\/)/.test(exe)) return '';
  return RUNNERS.get(path.posix.basename(exe).toLowerCase().replace(/\.exe$/, '')) || '';
}

const VALUE = () => true;
const oneOf = (...allowed) => (v) => allowed.includes(v);
const VERBOSITY = oneOf('q', 'quiet', 'm', 'minimal', 'n', 'normal', 'd', 'detailed', 'diag', 'diagnostic');
// A reporter or logger outside the built-in ones is a module that runs code and owns the output read here.
const NODE_TEST_OPTIONS = new Map([
  ['--test-concurrency', VALUE], ['--test-reporter', oneOf('spec', 'tap', 'dot', 'junit', 'lcov')],
  ['--test-reporter-destination', VALUE], ['--test-timeout', VALUE], ['--test-name-pattern', VALUE],
  ['--test-skip-pattern', VALUE], ['--test-only', null], ['--experimental-test-coverage', null], ['--no-warnings', null],
]);
const DOTNET_TEST_OPTIONS = new Map([
  ['--filter', VALUE], ['--no-build', null], ['--no-restore', null], ['-c', VALUE], ['--configuration', VALUE],
  ['--logger', (v) => /^(?:console|trx|html)(?:;[\w.]+=[\w.]+)*$/i.test(v)], ['-v', VERBOSITY], ['--verbosity', VERBOSITY],
]);
const DOTNET_BUILD_OPTIONS = new Map([
  ['-c', VALUE], ['--configuration', VALUE], ['-f', VALUE], ['--framework', VALUE], ['-v', VERBOSITY], ['--verbosity', VERBOSITY],
  ['--no-restore', null], ['--nologo', null],
]);
const FLUTTER_REPORTER = oneOf('compact', 'expanded', 'github', 'json', 'silent', 'failures-only');
const FLUTTER_TEST_OPTIONS = new Map([
  ['--no-pub', null], ['--coverage', null], ['-r', FLUTTER_REPORTER], ['--reporter', FLUTTER_REPORTER], ['-j', VALUE], ['--concurrency', VALUE], ['-n', VALUE], ['--name', VALUE], ['--plain-name', VALUE],
  ['-t', VALUE], ['--tags', VALUE], ['-x', VALUE], ['--exclude-tags', VALUE], ['--timeout', VALUE],
]);
// MSBuild reads a `/` word as a switch and an `@` word as a response file of further arguments.
const DOTNET_PATH = (a) => !/^[-/@]/.test(a);
const FLUTTER_PATH = (a) => !/^[-@]/.test(a);

// The index after the listed option at args[i] and its value, or -1. A value given as the next word
// never starts with `-`, so no option is read as another's value.
function optionEnd(options, args, i) {
  const eq = args[i].indexOf('=');
  const name = eq < 0 ? args[i] : args[i].slice(0, eq);
  if (!options.has(name)) return -1;
  const allows = options.get(name);
  if (allows === null) return eq < 0 ? i + 1 : -1;
  const value = eq < 0 ? args[i + 1] : args[i].slice(eq + 1);
  if (!value || value.startsWith('-') || !allows(value)) return -1;
  return eq < 0 ? i + 2 : i + 1;
}

function argsListed(options, args, isPath, maxPaths = Infinity) {
  let paths = 0;
  for (let i = 0; i < args.length;) {
    if (args[i].startsWith('-')) {
      i = optionEnd(options, args, i);
      if (i < 0) return false;
    } else {
      if (!isPath(args[i]) || ++paths > maxPaths) return false;
      i++;
    }
  }
  return true;
}

// node: listed options only before `--test`; after it listed options, then file and glob arguments only.
function nodeArgsListed(args) {
  const at = args.indexOf('--test');
  if (at < 0) return false;
  let i = 0;
  while (i < at) {
    i = optionEnd(NODE_TEST_OPTIONS, args, i);
    if (i < 0) return false;
  }
  for (i = at + 1; i < args.length && args[i].startsWith('-');) {
    i = optionEnd(NODE_TEST_OPTIONS, args, i);
    if (i < 0) return false;
  }
  return args.slice(i).every((a) => !a.startsWith('-'));
}

// The runner a stage invokes directly, in a listed shape, or ''.
function directRunner(words) {
  let start = 0;
  while (start < words.length && isAssignment(words[start])) start++;
  if (start === words.length) return '';
  const runner = runnerNamed(words[start]);
  const args = words.slice(start + 1).map((w) => w.text);
  if (runner === 'node') return nodeArgsListed(args) ? runner : '';
  if (!runner || args[0] !== 'test') return '';
  const listed = runner === 'vstest'
    ? argsListed(DOTNET_TEST_OPTIONS, args.slice(1), DOTNET_PATH, 1)
    : argsListed(FLUTTER_TEST_OPTIONS, args.slice(1), FLUTTER_PATH);
  return listed ? runner : '';
}

// A stage that runs no tests: a folder change, a listed environment assignment, the .NET restore or build.
function setupStage(words) {
  const [first, ...rest] = words;
  const head = first.text.toLowerCase();
  if (head === 'cd' || head === 'pushd' || head === 'chdir') return rest.length <= 1 && rest.every((w) => !/^[-/]/.test(w.text));
  if (head === 'set') return rest.length === 1 && isAssignment(rest[0]);
  if (head === 'export') return rest.length > 0 && rest.every(isAssignment);
  if (words.every(isAssignment)) return true;
  const args = rest.map((w) => w.text);
  return runnerNamed(first) === 'vstest' && (args[0] === 'restore' || args[0] === 'build')
    && argsListed(DOTNET_BUILD_OPTIONS, args.slice(1), DOTNET_PATH, 1);
}

// A red run proves its failures are all there were only when the runner itself ran every test: the
// runner invoked directly, in a listed shape, as the last stage, after setup stages only. A wrapper can
// stop at its first failing stage, and so can the shell's chain; a shape not listed may hide either.
function chainAccountsFor(command) {
  const stages = stagesOf(command);
  return Boolean(stages && directRunner(stages.at(-1))) && stages.slice(0, -1).every(setupStage);
}

// A run the test host aborted never ran the tests after the abort.
const ABORTED = /^\s*Test Run Aborted\b|The active test run was aborted/im;

// A partial list reads as the whole one, so one failure it cannot place makes the list unknown.
function failedTargets({ output, repo, command = null, listing = null }) {
  if (command !== null && !chainAccountsFor(command)) return null;
  const text = String(output || '');
  if (ABORTED.test(text)) return null;
  const found = new Set();
  for (const m of text.matchAll(NODE_FAILURE)) {
    let file = m[1];
    if (/^file:/.test(file)) { try { file = fileURLToPath(file); } catch { return null; } }
    const rel = relTo(repo, file);
    if (rel.startsWith('../') || !NODE_TEST.test(rel) || !exists(repo, rel)) return null;
    found.add(rel);
  }
  const assemblies = [...text.matchAll(DOTNET_FAILURE)].map((m) => m[1]);
  if (assemblies.length) {
    const projects = readProjects(repo, listing || listFiles(repo));
    for (const name of assemblies) {
      const owners = projects.filter((p) => p.test && p.assembly === name);
      if (owners.length === 0) return null;
      for (const p of owners) found.add(p.file);
    }
  }
  return found.size ? [...found].sort() : null;
}

module.exports = { tiedSet, failedTargets, runnerOf, declaredFor, readConfig };

function cli(argv) {
  const at = (flag) => argv.indexOf(flag);
  const repo = at('--repo') >= 0 ? argv[at('--repo') + 1] : process.cwd();
  const changed = [];
  if (at('--changed') >= 0) {
    for (let i = at('--changed') + 1; i < argv.length && !argv[i].startsWith('--'); i++) changed.push(argv[i]);
  }
  if (at('--list') < 0 || changed.length === 0 || !repo) {
    return { err: 'usage: tied-tests.js --list --repo <path> --changed <file>...' };
  }
  const root = path.resolve(repo);
  const cfg = readConfig(root);
  return { out: tiedSet({ repo: root, changed, ...declaredFor(cfg) }) };
}

if (require.main === module) {
  const { out, err } = cli(process.argv.slice(2));
  if (err) {
    process.stderr.write(`tied-tests: ${err}\n`);
    process.exit(2);
  }
  process.stdout.write(`${JSON.stringify(out)}\n`);
}
