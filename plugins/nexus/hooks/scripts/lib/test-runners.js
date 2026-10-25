'use strict';
/**
 * The test-runner contract, its loader, and the core's runner table — the one shipped home of the contract;
 * every runner file points here.
 *
 * WHO OWNS WHAT. The core owns when tests run, what is recorded, the gates, and the runner table below: which
 * runner a command or a test file belongs to, and every runner's filter-clause flags — so a command keeps its
 * runner and a filtered complete run still reads as filtered with no runner installed. How one language's
 * tests are composed, tied, read and labelled is its runner's. node is built in (`runners/node.js` beside this
 * file); every other runner ships in its language plugin. The core names runners, never the plugins that run
 * them.
 *
 * A RUNNER FILE is `hooks/scripts/test-runner.js` in its plugin's folder (or a file in `runners/` beside this
 * one, for a built-in), exporting:
 *   runners    — the runner names it serves, e.g. ['vstest'];
 *   contract   — 1, the number of the interface below; a file speaking another number is refused;
 *   create(helpers) — called once per load with the helper set below; returns the operations.
 * It requires only Node's own modules and files in its own plugin: everything it shares with the core arrives
 * through `helpers`.
 *
 * THE HELPER SET (HELPER_NAMES): quote, fold, commandSegments, splitChain, insertAfter, hasTopLevelOr,
 * inferRunner, isFilteredFull (command text); optionEnd, argsListed (the command-shape reader: an option table
 * is a Map of name → null for a bare flag, or a predicate over its value); invocationsOf(command, runner, shape)
 * → { calls } | { why } (the direct invocations a declared command makes, every stage told); parseClasses (the class names a
 * source declares); listFiles, isExcluded, insideTree, sourceFiles, projectDir, relativeFile (the tree);
 * offsetAt, mapLine, setReason, clearReason, reasonLines (labels: the kept-slow reason comment one line above a
 * test, the same form in every language).
 *
 * THE OPERATIONS create() returns. `segment` is one invocation of the runner, cut from a chain by the core.
 *   filesCommand({ files, exclude, cwd, note, stopSeconds }) → [command]  the named-files run
 *   timingCommand({ targets, tmp, n, classes, reporter, note, exclusion }) → [command]  the timing pass;
 *     `exclusion`, when given, is a clause this runner's exclusionOf returned, kept in every command
 *   deltaTargets({ files, cwd }) → { targets, classes }  what a changed-files timing pass re-times
 *   stopFlags(seconds) → flags  the per-test stop
 *   joinExclusion(segment) → segment  the slow exclusion joined (unchanged when already there)
 *   joinStop(segment, seconds) → segment  the per-test stop joined (unchanged when already there)
 *   failedTargets({ output, repo, listing }) → [target] | null  the failures a run's output names; null when one
 *     cannot be placed in the repo; [] when it names none
 *   commandShape: { test(args) → bool, setup(args) → bool }  the arguments after the executable that a direct
 *     test stage, or a setup stage that runs no test, may carry for a red run's failure list to be trusted
 *   labelSource({ file, source, tests, threshold, wanted, shifts, out }) → { text, slow }  a step close's labels
 *     in one timed file; `slow` when a test in it is at or over the line
 *   timingEntries({ dir, n, stdout, tree }) → [entry]  the tests one timing pass timed
 *   retagEdits({ tree, keys, tagged, meta, blocks, log }) → [{ file, edit, optional }]  the timing pass's labels
 *   untagSource(text) → text  a source with every slow label removed, to compare two versions of a file
 * Optional — absent means the core's answer in brackets:
 *   tiedSet({ repo, changed, listing, unit, slow, stopSeconds }) → { targets, untied, commands, fallback }
 *     [the declared unit runs whole]
 *   withReport(command, dir) → command, reportTimes({ tree, reportDir, stdout }) → [time]  the report a step
 *     close is timed from [the core's events only]
 *   reportCount(dir) → number  the reports a timing leg wrote [the entries it parsed]
 *   labelCompanions({ tree, files }) → [{ file, merge(text|null) → text|null }]  a project file the labels need
 *     beside them [none]
 *   buildKey(command) → key, noBuild(command) → command  build reuse [always build]
 *   exclusionOf(command) → { known, clause } | { none } | { unknown, why }  the tests a declared command leaves
 *     out, in this runner's own syntax, its slow label never among them; unknown unless every invocation is
 *     read whole (invocationsOf) and none selects tests [the timing pass refuses]
 *
 * THE LOADER — loadRunner(name, { root, env }) → { runner, reason }. `root` is the session's checkout, never the
 * run's tree, which may be a worktree: a project install is matched to the checkout (lib/plugin-root.js). A
 * built-in file comes first, then each installed plugin whose runner file names the runner. Never throws: no
 * plugin serving it, a contract it does not read, or a file that fails to load or start returns runner null with
 * a one-line reason.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pluginRoot, installedNames } = require('./plugin-root');
const { isExcluded } = require('./tree-hash');

const CONTRACT = 1;
const RUNNER_FILE = 'hooks/scripts/test-runner.js';
const BUILT_IN = path.join(__dirname, 'runners');

// ── the runner table ─────────────────────────────────────────────────────────────────────────────────

const RUNNERS = new Set(['vstest', 'mtp', 'node', 'flutter']);

const INVOCATION = {
  vstest: /(^|\s)dotnet\s+test(\s|$)/,
  node: /(^|\s)node(\.exe)?\s(.*\s)?--test(\s|$)/,
  flutter: /(^|\s)(flutter|dart)\s+test(\s|$)/,
};

// The runner an executable is, by its own name.
const EXECUTABLES = new Map([['node', 'node'], ['dotnet', 'vstest'], ['flutter', 'flutter'], ['dart', 'flutter']]);

// The runner a test file is labelled by, first match wins.
const TEST_FILES = [['node', /\.test\.(mjs|js|cjs)$/], ['vstest', /\.cs$/], ['flutter', /_test\.dart$/]];

const FILTER_CLAUSE_FLAGS = new Set(['--filter', '--filter-not-trait', '-x', '--exclude-tags', '--test-skip-pattern', '--exclude']);

function runnerOfFile(file) {
  const hit = TEST_FILES.find(([, re]) => re.test(String(file)));
  return hit ? hit[0] : null;
}

// ── command text ─────────────────────────────────────────────────────────────────────────────────────

const quote = (p) => `"${String(p).replace(/\\/g, '/')}"`;

const fold = (command) => String(command || '').replace(/["']/g, '').replace(/\s+/g, ' ').trim();

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

function inferRunner(command) {
  for (const segment of splitChain(command)) {
    const folded = fold(segment);
    const runner = ['vstest', 'node', 'flutter'].find((r) => INVOCATION[r].test(folded));
    if (runner) return runner;
  }
  return '';
}

function isFilteredFull(command) {
  return fold(command).split(' ').some((token) => FILTER_CLAUSE_FLAGS.has(token.split('=')[0]));
}

function insertAfter(segment, re, flag) {
  const m = segment.match(re);
  const at = m.index + m[0].length;
  return segment.slice(0, at) + flag + segment.slice(at);
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

// ── command shape ────────────────────────────────────────────────────────────────────────────────────

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

// ── stages ───────────────────────────────────────────────────────────────────────────────────────────

// The stage grammar: stages joined by `&&` alone, each made of plain words. A word is a run of characters
// neither sh nor cmd gives a meaning, or one whole double-quoted word whose content neither expands. Anything
// else — a quote inside a word or after `=`, a single quote, a backslash, `$`, `%`, a backtick, a redirection,
// a pipe, any other separator — is a shape that cannot be told: null. With `values`, a whole single-quoted word
// and a quoted value right after `name=` are words too, their content holding no quote, backslash, `$`, `%` or
// backtick, so a word read in either shell re-quotes in double quotes to the same text.
const PLAIN = /[A-Za-z0-9_./:=,@+*?-]/;
const UNSAFE_QUOTED = /['\\$`%\r\n]/;
const UNSAFE_VALUE = /["'\\$`%\r\n]/;
const WORD_END = (ch) => ch === undefined || ch === ' ' || ch === '\t' || ch === '&';

function stagesOf(command, { values = false } = {}) {
  const s = String(command);
  const unsafe = values ? UNSAFE_VALUE : UNSAFE_QUOTED;
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
    if (ch === '"' || (values && ch === "'")) {
      end = s.indexOf(ch, i + 1);
      if (end < 0) return null;
      text = s.slice(i + 1, end);
      if (unsafe.test(text)) return null;
      quoted = true;
      end++;
    } else {
      end = i;
      while (end < s.length && PLAIN.test(s[end])) end++;
      text = s.slice(i, end);
      if (!text || /^[*?]/.test(text)) return null;
      if (values && text.endsWith('=') && (s[end] === '"' || s[end] === "'")) {
        const close = s.indexOf(s[end], end + 1);
        if (close < 0) return null;
        const value = s.slice(end + 1, close);
        if (unsafe.test(value)) return null;
        text += value;
        quoted = true;
        end = close + 1;
      }
    }
    if (!WORD_END(s[end])) return null;
    stages.at(-1).push({ text, quoted });
    i = end;
  }
  return stages.every((words) => words.length) ? stages : null;
}

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
  return EXECUTABLES.get(path.posix.basename(exe).toLowerCase().replace(/\.exe$/, '')) || '';
}

// The runner a stage invokes directly, in a listed shape, or ''.
function directRunner(words, shapeOf) {
  let start = 0;
  while (start < words.length && isAssignment(words[start])) start++;
  if (start === words.length) return '';
  const runner = runnerNamed(words[start]);
  const shape = runner ? shapeOf(runner) : null;
  return shape && shape.test(words.slice(start + 1).map((w) => w.text)) ? runner : '';
}

// A stage that runs no tests: a folder change, a listed environment assignment, or a runner's own setup.
function setupStage(words, shapeOf) {
  const [first, ...rest] = words;
  const head = first.text.toLowerCase();
  if (head === 'cd' || head === 'pushd' || head === 'chdir') return rest.length <= 1 && rest.every((w) => !/^[-/]/.test(w.text));
  if (head === 'set') return rest.length === 1 && isAssignment(rest[0]);
  if (head === 'export') return rest.length > 0 && rest.every(isAssignment);
  if (words.every(isAssignment)) return true;
  const runner = runnerNamed(first);
  const shape = runner ? shapeOf(runner) : null;
  return Boolean(shape && shape.setup(rest.map((w) => w.text)));
}

// What a declared command runs of `runner`, read only where every stage is told: each is a setup stage, or
// `runner` invoked directly in its listed `shape`. `calls` holds each invocation's arguments after the
// executable, quotes removed; `why` says what could not be told — a wrapper, another program, a shape the
// runner does not list, or a word outside the stage grammar.
function invocationsOf(command, runner, shape) {
  const stages = stagesOf(command, { values: true });
  if (!stages) return { why: `its words cannot be told apart in every shell (a quote inside a word, a variable, a backslash, a pipe or a redirection): ${String(command).trim()}` };
  const shapeOf = (r) => (r === runner ? shape : null);
  const calls = [];
  for (const words of stages) {
    if (directRunner(words, shapeOf) === runner) {
      let start = 0;
      while (isAssignment(words[start])) start++;
      calls.push(words.slice(start + 1).map((w) => w.text));
    } else if (!setupStage(words, shapeOf)) {
      return { why: `it runs a stage that is neither a direct ${runner} run nor a setup step: ${words.map((w) => w.text).join(' ')}` };
    }
  }
  return calls.length ? { calls } : { why: `it runs no direct ${runner} run` };
}

// ── source ───────────────────────────────────────────────────────────────────────────────────────────

function parseClasses(source) {
  const names = [];
  for (const m of String(source).matchAll(/\bclass\s+([A-Za-z_]\w*)/g)) {
    if (!names.includes(m[1])) names.push(m[1]);
  }
  return names;
}

// ── the tree ─────────────────────────────────────────────────────────────────────────────────────────

const WALK_SKIP = new Set(['.git', 'node_modules', 'bin', 'obj']);
const WALK_LIMIT = 50000;

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

function insideTree(tree, file) {
  const abs = path.resolve(tree, file);
  const rel = path.relative(tree, abs);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? abs : null;
}

function sourceFiles(dir, ext) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!['bin', 'obj', 'node_modules', '.git'].includes(entry.name)) out.push(...sourceFiles(path.join(dir, entry.name), ext));
    } else if (entry.name.endsWith(ext)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

// The nearest folder at or above `fromDir`, inside the tree, holding a file `marker` accepts.
function projectDir(fromDir, tree, marker) {
  for (let dir = fromDir; insideTree(tree, dir) || path.resolve(dir) === path.resolve(tree); dir = path.dirname(dir)) {
    let names = [];
    try { names = fs.readdirSync(dir); } catch { /* a build output that is gone */ }
    if (names.some(marker)) return dir;
    if (path.resolve(dir) === path.resolve(tree)) break;
  }
  return null;
}

function relativeFile(file, tree) {
  const rel = file ? path.relative(tree, String(file)) : '';
  const inside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  return String(inside ? rel : file).replace(/\\/g, '/');
}

// ── labels ───────────────────────────────────────────────────────────────────────────────────────────

const REASON = /^(\s*)\/\/ slow: .*$/;

function offsetAt(text, line, column) {
  let offset = 0;
  for (let l = 1; l < line; l++) {
    offset = text.indexOf('\n', offset) + 1;
    if (offset === 0) return -1;
  }
  return offset + column - 1;
}

// A run line moved by the reason comments added (+1) or removed (-1) above it since the run.
const mapLine = (shifts, line) => line + shifts.filter((s) => s.at <= line).reduce((n, s) => n + s.delta, 0);

// The reason a test is kept slow, as the comment on the line above `line`: replaced where one is there,
// inserted (at that line's indent) where none is. `delta` is the lines the edit added.
function setReason(source, line, reason) {
  const lines = String(source).split('\n');
  if (line < 1 || line > lines.length) return { text: String(source), delta: 0 };
  const target = lines[line - 1];
  const eol = target.endsWith('\r') ? '\r' : '';
  const indent = (target.match(/^\s*/) || [''])[0].replace(/\r$/, '');
  const comment = `${indent}// slow: ${String(reason).replace(/[\r\n]+/g, ' ').trim()}${eol}`;
  if (line > 1 && REASON.test(lines[line - 2].replace(/\r$/, ''))) {
    lines[line - 2] = comment;
    return { text: lines.join('\n'), delta: 0 };
  }
  lines.splice(line - 1, 0, comment);
  return { text: lines.join('\n'), delta: 1 };
}

// Removes the reason comment above `line`, if one is there; `delta` is -1 when it did.
function clearReason(source, line) {
  const lines = String(source).split('\n');
  if (line < 2 || line > lines.length || !REASON.test(lines[line - 2].replace(/\r$/, ''))) return { text: String(source), delta: 0 };
  lines.splice(line - 2, 1);
  return { text: lines.join('\n'), delta: -1 };
}

// The reason comments of a step close's tests located by line: a test under the slow line loses its
// reason, an asked-for one at or over it gets it. Bottom-up by run line, so each edit's line count moves
// only the tests below it, which are done; every edit that moves lines is pushed onto `shifts`.
function reasonLines({ file, text, tests, threshold, wanted, shifts, out }) {
  let result = text;
  for (const t of [...tests].sort((a, b) => b.line - a.line)) {
    const asked = wanted.find((w) => w.file === file && w.line === t.line);
    let edit = { text: result, delta: 0 };
    if (t.ms < threshold) {
      edit = clearReason(result, mapLine(shifts, t.line));
      if (asked) { asked.done = true; out(`label-tests: ${file}:${t.line} ran under the slow line (${Math.round(t.ms)} ms) — no reason written\n`); }
    } else if (asked) {
      edit = setReason(result, mapLine(shifts, t.line), asked.reason || 'kept slow');
      asked.done = true;
    }
    result = edit.text;
    if (edit.delta) shifts.push({ at: t.line, delta: edit.delta });
  }
  return result;
}

const HELPERS = Object.freeze({
  quote, fold, commandSegments, splitChain, insertAfter, hasTopLevelOr, inferRunner, isFilteredFull,
  optionEnd, argsListed, invocationsOf, parseClasses,
  listFiles, isExcluded, insideTree, sourceFiles, projectDir, relativeFile,
  offsetAt, mapLine, setReason, clearReason, reasonLines,
});
const HELPER_NAMES = Object.keys(HELPERS);

// ── the loader ───────────────────────────────────────────────────────────────────────────────────────

const firstLine = (e) => String((e && e.message) || e).split(/\r?\n/)[0];

// One runner file, read for `name`: null when it does not serve that runner.
function fromFile(file, name, where) {
  let mod;
  try { mod = require(file); } catch (e) { return { failed: `could not load ${file}: ${firstLine(e)}` }; }
  if (!mod || !Array.isArray(mod.runners) || !mod.runners.includes(name)) return null;
  if (mod.contract !== CONTRACT) {
    return { reason: `the ${where} ${name} runner (${file}) speaks contract ${mod.contract}; this core reads contract ${CONTRACT}` };
  }
  if (typeof mod.create !== 'function') return { reason: `the ${where} ${name} runner (${file}) exports no create()` };
  try {
    return { runner: { ...mod.create(HELPERS), name } };
  } catch (e) {
    return { reason: `the ${where} ${name} runner (${file}) failed to start: ${firstLine(e)}` };
  }
}

function loadRunner(name, { root = null, env = process.env } = {}) {
  const runnerName = String(name || '');
  if (!/^[a-z][a-z0-9-]*$/.test(runnerName)) return { runner: null, reason: `no runner named ${JSON.stringify(runnerName)}` };
  const failures = [];
  const candidates = [{ file: path.join(BUILT_IN, `${runnerName}.js`), where: 'built-in' }];
  let names = [];
  try { names = installedNames(env); } catch { /* an unreadable record resolves nothing */ }
  for (const plugin of names) {
    let base = null;
    try { base = pluginRoot(plugin, root, env); } catch { /* resolves nothing */ }
    if (base) candidates.push({ file: path.join(base, ...RUNNER_FILE.split('/')), where: 'installed' });
  }
  for (const { file, where } of candidates) {
    if (!fs.existsSync(file)) continue;
    const found = fromFile(file, runnerName, where);
    if (!found) continue;
    if (found.failed) { failures.push(found.failed); continue; }
    if (found.runner) return { runner: found.runner, reason: null };
    return { runner: null, reason: found.reason };
  }
  const missing = `no installed plugin runs ${runnerName} tests`;
  return { runner: null, reason: failures.length ? `${missing} (${failures.join('; ')})` : missing };
}

module.exports = {
  CONTRACT, RUNNER_FILE, HELPERS, HELPER_NAMES, loadRunner,
  RUNNERS, INVOCATION, EXECUTABLES, TEST_FILES, FILTER_CLAUSE_FLAGS, runnerOfFile,
  quote, fold, commandSegments, splitChain, inferRunner, isFilteredFull, insertAfter, hasTopLevelOr,
  optionEnd, argsListed, parseClasses, listFiles, isExcluded, insideTree, sourceFiles, projectDir, relativeFile,
  offsetAt, mapLine, setReason, clearReason, reasonLines,
  stagesOf, isAssignment, runnerNamed, directRunner, setupStage, invocationsOf,
};
