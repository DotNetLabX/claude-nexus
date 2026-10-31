'use strict';
/**
 * The vstest runner: `dotnet test`. Written to the test-runner contract of the nexus core (its
 * hooks/scripts/lib/test-runners.js, contract 1), which finds this file by its path in this plugin.
 *
 * Slow tests carry `[Trait("Speed", "Slow")]` on a class or a test method and are left out by the filter
 * clause `Speed!=Slow`. A named-files run is grouped per test project, each command filtered to the classes
 * its named files declare. In a developer's step run each class is selected by the full name a run reports for
 * its tests — its namespace, its enclosing types joined by `+`, a generic class by its name open before the
 * type arguments — and a filter past the command budget is split into batches rather than dropped; with no test file named, the step
 * run builds each project that owns a changed file (`buildCommand`). A changed file ties to every test project that reaches its nearest project
 * through any chain of ProjectReferences, that project included when it is a test project; a
 * Directory.Build.props/.targets, Directory.Packages.props, global.json or NuGet.config ties to every test
 * project. A file no project owns leaves the run to the declared unit whole. A step close is
 * timed from a trx report; a red run's failures are read from the VSTest summary line of each failing
 * assembly.
 *
 * A full run reads each `dotnet test` stage from its own trx files and blame Sequence files, in the folder the
 * run gives it: every failed result with its message, per test project its time and counts. Each test project
 * the stage selects needs a trx — its project target; a solution's listed test projects (every test project
 * under its folder when the solution cannot be read); with no target, the one solution or project in its
 * folder. A test a Sequence file marks not completed was running when its project's run ended: a stuck test,
 * set aside as a timeout and re-run without (`rerunWithout`), only while the output's hang-timeout lines cover
 * every such project — a crash otherwise, which sets nothing aside. Stuck tests are told only where the
 * declared stage carries `--blame-hang-timeout`; without it a hang runs to the full run's limit, and an abort
 * no Sequence file places leaves the stage unaccounted. A `stuck` entry adds `path`, its project's absolute
 * path.
 *
 * This runner also reads a full run's `vitest run` stage (directly or through `npx`), the front end beside a
 * .NET back end: vitest's json report, written when the run ends, gives each failed assertion as a failure of
 * its file, and a file that failed with none (a collection or import error) as one failure of that file. A
 * vitest timeout stays a failure — the report gives it no mark of its own — and a stage cut before its end
 * wrote no report, so it reads unfinished.
 */
const fs = require('fs');
const path = require('path');

const SLOW_CLAUSE = 'Speed!=Slow';
// A .csproj is a test project when it references a test SDK or a test framework, or says so outright.
const TEST_PROJECT = /Microsoft\.NET\.Test\.Sdk|<IsTestProject>\s*true|xunit|nunit|mstest/i;
// Under cmd.exe's 8,191-character line limit with room for its own wrapper. Applied on every
// platform so the Linux gate exercises the fallback the Windows run depends on.
const COMMAND_BUDGET = 7000;
// MSBuild, the SDK and NuGet read these from any folder above a project, so a change to one can reach
// every project's output.
const READ_BY_EVERY_PROJECT = new Set(['directory.build.props', 'directory.build.targets', 'directory.packages.props', 'global.json', 'nuget.config']);
const ALREADY_EXCLUDED = /Speed!=Slow/;
const ALREADY_STOPPED = /(^|\s)--blame-hang-timeout[= ]/;
// The `--filter` forms the join accepts: quoted either way, `=` or `:`.
const FILTER = /--filter(\s+|[=:])(?:"([^"]*)"|'([^']*)'|([^\s"']+))/;
// The VSTest summary line of an assembly with a failure.
const FAILURE = /^\s*Failed!\s+-\s+Failed:.*?-\s+([^\s\\/]+)\.dll\b/gm;
// A run the test host aborted never ran the tests after the abort.
const ABORTED = /^\s*Test Run Aborted\b|The active test run was aborted/im;

// ── report reader ────────────────────────────────────────────────────────────────────────────────────

// trx attribute values are read as written: the fields used (ids, a class and method name, a
// codeBase path, a duration) carry nothing XML escapes.
function attributes(text) {
  const out = {};
  for (const m of String(text).matchAll(/([\w:-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

function trxDurationMs(text) {
  const m = String(text).match(/^(\d+):(\d+):(\d+)(?:\.(\d+))?$/);
  if (!m) return 0;
  const [, h, min, s, frac = ''] = m;
  return (Number(h) * 3600 + Number(min) * 60 + Number(s)) * 1000 + Number(frac.padEnd(7, '0').slice(0, 7)) / 10000;
}

// Each executed test of a .trx report.
function parseTrx(xml) {
  const methods = new Map();
  for (const m of String(xml).matchAll(/<UnitTest\b([^>]*)>([\s\S]*?)<\/UnitTest>/g)) {
    const method = String(m[2]).match(/<TestMethod\b([^>]*?)\/?>/);
    if (method) methods.set(attributes(m[1]).id, attributes(method[1]));
  }
  const entries = [];
  for (const m of String(xml).matchAll(/<UnitTestResult\b([^>]*?)\/?>/g)) {
    const a = attributes(m[1]);
    if (a.outcome === 'NotExecuted') continue;
    const def = methods.get(a.testId) || {};
    const className = def.className || '';
    entries.push({ key: `${className}::${a.testName}`, className, method: def.name || '', codeBase: def.codeBase || '', ms: trxDurationMs(a.duration) });
  }
  return entries;
}

// ── a full run's results ─────────────────────────────────────────────────────────────────────────────

const MESSAGE_CAP = 400;
const unescapeXml = (s) => String(s)
  .replace(/&#x([0-9a-f]+);/gi, (m, hex) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (m, dec) => String.fromCodePoint(Number(dec)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const messageLine = (text) => {
  const line = String(text || '').split(/\r?\n/).map((l) => l.trim()).find(Boolean) || '';
  return line.slice(0, MESSAGE_CAP);
};
const assemblyOf = (dll) => path.basename(String(dll).replace(/\\/g, '/')).replace(/\.dll$/i, '').toLowerCase();

// Every result of a .trx report, with its outcome and its failure's message, and the run's own time.
function parseTrxResults(xml) {
  const text = String(xml);
  const methods = new Map();
  for (const m of text.matchAll(/<UnitTest\b([^>]*)>([\s\S]*?)<\/UnitTest>/g)) {
    const method = String(m[2]).match(/<TestMethod\b([^>]*?)\/?>/);
    if (method) methods.set(attributes(m[1]).id, attributes(method[1]));
  }
  const results = [];
  for (const m of text.matchAll(/<UnitTestResult\b([^>]*?)(?:\/>|>([\s\S]*?)<\/UnitTestResult>)/g)) {
    const a = attributes(m[1]);
    const def = methods.get(a.testId) || {};
    const message = (String(m[2] || '').match(/<Message>([\s\S]*?)<\/Message>/) || [])[1];
    results.push({
      outcome: a.outcome, test: unescapeXml(a.testName || ''), className: def.className || '', method: def.name || '',
      codeBase: def.codeBase || '', message: message === undefined ? '' : messageLine(unescapeXml(message)),
    });
  }
  const times = attributes((text.match(/<Times\b([^>]*?)\/?>/) || [])[1] || '');
  const ms = Date.parse(times.finish) - Date.parse(times.start);
  return { results, ms: Number.isFinite(ms) && ms >= 0 ? ms : 0, assemblies: [...new Set([...methods.values()].map((d) => assemblyOf(d.codeBase || '')).filter(Boolean))] };
}

// The tests of a blame Sequence file, each with the assembly it ran from and whether it completed.
function parseSequence(xml) {
  return [...String(xml).matchAll(/<Test\b([^>]*?)\/?>/g)].map((m) => {
    const a = attributes(m[1]);
    return { name: unescapeXml(a.Name || ''), source: a.Source || '', completed: a.Completed !== 'False' };
  });
}

// `Ns.Class.Method(args)` → { className: 'Ns.Class', method: 'Method', full: 'Ns.Class.Method' }.
function splitTestName(name) {
  const full = String(name).replace(/\(.*$/s, '');
  const dot = full.lastIndexOf('.');
  return { className: dot < 0 ? '' : full.slice(0, dot), method: dot < 0 ? full : full.slice(dot + 1), full };
}

// The words of a stage with where each sits, so one can be replaced in place.
const stageTokens = (stage) => [...String(stage).matchAll(/"[^"]*"|'[^']*'|\S+/g)]
  .map((m) => ({ text: m[0], value: m[0].replace(/["']/g, ''), start: m.index, end: m.index + m[0].length }));
// The first word after a stage's leading assignments: a tool is a stage's own only there, never as a wrapper's argument.
const afterAssignments = (toks) => {
  let i = 0;
  while (i < toks.length && /^[A-Za-z_]\w*=/.test(toks[i].text)) i++;
  return i;
};
const dotnetAt = (toks) => {
  const i = afterAssignments(toks);
  return toks[i] && /(^|[\\/])dotnet(\.exe)?$/i.test(toks[i].value) && toks[i + 1] && toks[i + 1].value === 'test' ? i : -1;
};
// The `dotnet test` options whose value is the next word.
const VALUED = new Set(['--filter', '--logger', '-l', '--results-directory', '-r', '--runtime', '-c', '--configuration', '-f',
  '--framework', '-a', '--arch', '-s', '--settings', '-o', '--output', '-d', '--diag', '--blame-hang-timeout',
  '--blame-hang-dump-type', '--blame-crash-dump-type', '--collect', '--os', '-v', '--verbosity', '--test-adapter-path', '-e', '--environment']);
const isSwitch = (v) => v.startsWith('-') || /^\/\w+[:=]/.test(v);

// The options of a `dotnet test` stage, each with its value and the tokens it spans, and its target word.
function readStage(stage) {
  const toks = stageTokens(stage);
  const at = dotnetAt(toks);
  if (at < 0) return null;
  const options = [];
  let target = null;
  let tail = null;
  for (let i = at + 2; i < toks.length; i++) {
    const v = toks[i].value;
    if (v === '--') { tail = toks[i]; break; }
    if (isSwitch(v)) {
      const sep = v.search(/[=:]/);
      const name = sep > 0 ? v.slice(0, sep) : v;
      if (sep < 0 && VALUED.has(name) && toks[i + 1]) {
        options.push({ name, value: toks[i + 1].value, from: toks[i], to: toks[i + 1] });
        i++;
      } else options.push({ name, value: sep > 0 ? v.slice(sep + 1) : null, from: toks[i], to: toks[i] });
    } else if (!target) target = toks[i];
  }
  return { toks, at, options, target, tail };
}

// The `run` word of a `vitest run` stage (directly, or through `npx`), after any leading assignments; -1 otherwise.
function vitestRunAt(toks) {
  let i = afterAssignments(toks);
  if (toks[i] && toks[i].value === 'npx') i++;
  return toks[i] && /(^|[\\/])vitest(\.cmd)?$/i.test(toks[i].value) && toks[i + 1] && toks[i + 1].value === 'run' ? i + 1 : -1;
}

// A `vitest run` stage's reporters and output files, each with the tokens it spans: { at, reporters, json, file }.
function readVitestStage(stage) {
  const toks = stageTokens(stage);
  const at = vitestRunAt(toks);
  if (at < 0) return null;
  const options = [];
  for (let i = at + 1; i < toks.length; i++) {
    const m = toks[i].value.match(/^(--reporter|--outputFile(?:\.json)?)(?:=(.*))?$/);
    if (!m) continue;
    if (m[2] !== undefined || !toks[i + 1]) options.push({ name: m[1], value: m[2] || '', from: toks[i], to: toks[i] });
    else { options.push({ name: m[1], value: toks[i + 1].value, from: toks[i], to: toks[i + 1] }); i++; }
  }
  const reporters = options.filter((o) => o.name === '--reporter');
  const namesJson = reporters.some((o) => o.value === 'json');
  const json = options.find((o) => o.name === '--outputFile.json') || (namesJson ? options.find((o) => o.name === '--outputFile') : null) || null;
  return { at: toks[at], reporters, json, drop: [...reporters.filter((o) => o.value === 'json'), ...(json ? [json] : [])] };
}

const isTrxLogger = (o) => (o.name === '--logger' || o.name === '-l') && /^trx(;|$)/i.test(String(o.value || ''));

// The stage with the spans of `drop` (options) removed.
function without(stage, drop) {
  let out = String(stage);
  for (const o of [...drop].sort((a, b) => b.from.start - a.from.start)) out = out.slice(0, o.from.start).replace(/\s+$/, '') + out.slice(o.to.end);
  return out;
}

// A test name inside a vstest filter, its operator characters escaped.
const escapeFilter = (s) => String(s).replace(/[\\()&|=!~]/g, (c) => `\\${c}`);

const VITEST_REPORT = 'vitest.json';
const INACTIVITY = /The specified inactivity time of [^\n]*? has elapsed\./g;
const ABORT_LINE = /The active test run was aborted\. Reason:/g;
const NO_MATCH = /No test matches the given testcase filter .*? in (.+?\.dll)/g;
const FAILURE_LINE = /\[FAIL\]|^\s*Failed[\s!]|^\s*Error Message:|Test Run Aborted|test run was aborted|inactivity time of/i;
const VITEST_FAILURE_LINE = /^\s*FAIL\s|^\s*×\s|Test timed out/;

// ── labels ───────────────────────────────────────────────────────────────────────────────────────────

const TRAIT = '[Trait("Speed", "Slow")]';
const HAS_TRAIT = /Trait\(\s*"Speed"\s*,\s*"Slow"\s*\)/;
const TRAIT_LINE = /^\s*\[Trait\(\s*"Speed"\s*,\s*"Slow"\s*\)\]\s*\r?$/;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The index of the quote closing the literal opened at `i`, -1 when the line ends first.
function closingQuote(s, i) {
  const verbatim = s[i] === '"' && (s[i - 1] === '@' || (s[i - 1] === '$' && s[i - 2] === '@'));
  for (let j = i + 1; j < s.length; j++) {
    if (verbatim && s[j] === '"') {
      if (s[j + 1] !== '"') return j;
      j++;
    } else if (!verbatim && s[j] === '\\') j++;
    else if (!verbatim && s[j] === s[i]) return j;
  }
  return -1;
}

// The attributes written at the start of a line (`[Fact] public void X()`), read bracket by bracket past string
// and character literals: { indent, attrs, rest }, `{ open: true }` when an attribute goes on past the line, null
// when the line starts with none.
function leadingAttributes(line) {
  const s = String(line);
  const indent = s.match(/^\s*/)[0];
  let i = indent.length;
  if (s[i] !== '[') return null;
  while (s[i] === '[') {
    let depth = 0;
    for (; i < s.length; i++) {
      if (s[i] === '"' || s[i] === "'") {
        i = closingQuote(s, i);
        if (i < 0) return { open: true };
      } else if (s[i] === '[') depth++;
      else if (s[i] === ']' && --depth === 0) break;
    }
    if (depth > 0) return { open: true };
    i++;
    while (i < s.length && /\s/.test(s[i])) i++;
  }
  return { indent, attrs: s.slice(indent.length, i), rest: s.slice(i) };
}
const inlineAttributes = (line) => {
  const a = leadingAttributes(line);
  return a && !a.open ? a.attrs : '';
};
const INLINE_TRAIT = /\[Trait\(\s*"Speed"\s*,\s*"Slow"\s*\)\]\s*/;
// A line of attributes alone belongs to the declaration below it; one that goes on is a declaration itself.
const attributesOnly = (line) => {
  const a = leadingAttributes(line);
  const rest = a && !a.open ? a.rest.trim() : null;
  return rest === '' || (rest !== null && rest.startsWith('//'));
};

function insertAttribute(lines, declIndex) {
  let top = declIndex;
  while (top > 0 && attributesOnly(lines[top - 1])) top--;
  if (lines.slice(top, declIndex).some((l) => HAS_TRAIT.test(l)) || HAS_TRAIT.test(inlineAttributes(lines[declIndex]))) return false;
  const indent = lines[declIndex].match(/^\s*/)[0];
  lines.splice(top, 0, `${indent}${TRAIT}${lines[declIndex].endsWith('\r') ? '\r' : ''}`);
  return true;
}

const classIndex = (lines, name) => lines.findIndex((l) => new RegExp(`\\bclass\\s+${escapeRegex(name)}\\b`).test(l));
const methodDecl = (method) => new RegExp(`\\b(?:void|Task|ValueTask)(?:<[^>]*>)?\\s+${escapeRegex(method)}\\s*\\(`);
const TYPE_DECL = /\b(?:class|struct|record|interface)\s+\w+/;
const indentOf = (line) => line.match(/^\s*/)[0].length;

// Where a class's own members end: the next type declared at its indent or less — a type nested in it sits
// deeper — else the end of the file.
function classEnd(lines, from) {
  const indent = indentOf(lines[from]);
  for (let i = from + 1; i < lines.length; i++) if (TYPE_DECL.test(lines[i]) && indentOf(lines[i]) <= indent) return i;
  return lines.length;
}

// The line of a method declared in the class, never in another class after it in the same file; -1 when none.
function methodIndex(lines, className, method) {
  const from = classIndex(lines, className);
  if (from < 0) return -1;
  const end = classEnd(lines, from);
  for (let i = from + 1; i < end; i++) if (methodDecl(method).test(lines[i])) return i;
  return -1;
}

// The source with comments blanked and string and character literals emptied, in one pass, so whichever opens
// first wins: a `//` inside a string is no comment.
const codeOnly = (source) => String(source).replace(
  /\/\*[\s\S]*?\*\/|\/\/[^\n]*|@"(?:[^"]|"")*"|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)'/g,
  (m) => (m.startsWith('/') ? ' ' : '""'));

function tagDotnetSource(source, { classes = [], methods = [] }) {
  const lines = String(source).split('\n');
  const missing = [];
  for (const name of classes) {
    const at = classIndex(lines, name);
    if (at < 0) missing.push(name);
    else insertAttribute(lines, at);
  }
  for (const { className, method } of methods) {
    const at = methodIndex(lines, className, method);
    if (at < 0) missing.push(`${className}.${method}`);
    else insertAttribute(lines, at);
  }
  return { text: lines.join('\n'), missing };
}

const TEST_ATTRIBUTE = /[[,]\s*(?:[\w.]*\.)?(?:Fact|Theory|Test|TestMethod|TestCase|TestCaseSource|DataTestMethod|SkippableFact|SkippableTheory)\b/;
const ANY_METHOD = /\b(?:void|Task|ValueTask)(?:<[^>]*>)?\s+(\w+)\s*\(/;

// The test methods a class declares, by the test attribute above each or on its own line, up to the next
// class declaration; `complete` is false when an attribute there goes on past its line, so its method may be
// missing.
function testMethodsOf(lines, className) {
  const from = classIndex(lines, className);
  if (from < 0) return { names: [], complete: false };
  const names = [];
  let complete = true;
  for (let i = from + 1; i < lines.length && !/\bclass\s+\w+/.test(lines[i]); i++) {
    const a = leadingAttributes(lines[i]);
    if (a && a.open) complete = false;
    const m = lines[i].match(ANY_METHOD);
    if (!m) continue;
    let top = i;
    while (top > 0 && attributesOnly(lines[top - 1])) top--;
    if (lines.slice(top, i).some((l) => TEST_ATTRIBUTE.test(l)) || TEST_ATTRIBUTE.test(inlineAttributes(lines[i]))) names.push(m[1]);
  }
  return { names, complete };
}

const labelAbove = (lines, at) => {
  let top = at;
  while (top > 0 && attributesOnly(lines[top - 1])) top--;
  return lines.slice(top, at).some((l) => HAS_TRAIT.test(l)) || HAS_TRAIT.test(inlineAttributes(lines[at]));
};
// Removes the label lines above the declaration at `at` and a label written on its own line; returns its new index.
function removeLabelAbove(lines, at) {
  let top = at;
  while (top > 0 && attributesOnly(lines[top - 1])) top--;
  let decl = at;
  for (let i = at - 1; i >= top; i--) if (TRAIT_LINE.test(lines[i])) { lines.splice(i, 1); decl--; }
  const a = leadingAttributes(lines[decl]);
  if (a && !a.open) lines[decl] = a.indent + a.attrs.replace(INLINE_TRAIT, () => '') + a.rest;
  return decl;
}

// The labels of the timed tests set from their times, in place; a test the pass did not time keeps its label,
// and a class label is written only when every test of the class was timed slow. `classes` maps a class's
// short name to its timed methods, each true when slow. `split` maps a partial class's short name to
// `{ inherited, complete }` read over all its files: such a class is never labelled whole, and a class label on
// any of its declarations counts for the methods of this file.
function retagDotnetSource(source, classes, split = new Map()) {
  const lines = String(source).split('\n');
  const missing = [];
  for (const [className, timed] of classes) {
    if (classIndex(lines, className) < 0) {
      if ([...timed.values()].some(Boolean)) missing.push(className);
      continue;
    }
    // A class label needs the class's membership read whole from its source: every timed method among the
    // declared test methods, and every declared one timed slow. A class label over members that cannot all be
    // read stays, so none of them loses it.
    const part = split.get(className);
    const { names: declared, complete } = testMethodsOf(lines, className);
    const ownLabel = labelAbove(lines, classIndex(lines, className));
    const inherited = part ? part.inherited : ownLabel;
    if (inherited && !(part ? part.complete : complete)) continue;
    const members = [...new Set([...declared, ...timed.keys()])];
    const wholeClass = !part && complete && declared.length > 0 && [...timed.keys()].every((m) => declared.includes(m))
      && declared.every((m) => timed.has(m)) && [...timed.values()].every(Boolean);
    if (!wholeClass && ownLabel) removeLabelAbove(lines, classIndex(lines, className));
    for (const method of members) {
      const at = methodIndex(lines, className, method);
      if (at < 0) {
        if (timed.get(method) || (!timed.has(method) && inherited)) missing.push(`${className}.${method}`);
        continue;
      }
      const slow = wholeClass ? false : timed.has(method) ? timed.get(method) : (inherited || labelAbove(lines, at));
      if (slow) insertAttribute(lines, at);
      else removeLabelAbove(lines, at);
    }
    if (wholeClass) insertAttribute(lines, classIndex(lines, className));
  }
  return { text: lines.join('\n'), missing };
}

function untagDotnetSource(source) {
  return String(source).split('\n').filter((l) => !TRAIT_LINE.test(l)).join('\n');
}

// The 1-based line of a test method's declaration, 0 when it is not found.
function dotnetMethodLine(source, className, method) {
  return methodIndex(String(source).split('\n'), className, method) + 1;
}

// The 1-based line of the first attribute above a test method (its declaration when it has none) — where
// a reason comment goes; 0 when the method is not found.
function dotnetReasonLine(source, className, method) {
  const lines = String(source).split('\n');
  let top = methodIndex(lines, className, method);
  if (top < 0) return 0;
  while (top > 0 && attributesOnly(lines[top - 1])) top--;
  return top + 1;
}

// One test method labelled slow or not, from its own time: the method's own Trait is added or removed; a
// class-level Trait is never touched.
function labelDotnetMethod(source, className, method, slow) {
  const lines = String(source).split('\n');
  const at = methodIndex(lines, className, method);
  if (at < 0) return { text: String(source), found: false };
  if (slow) insertAttribute(lines, at);
  else removeLabelAbove(lines, at);
  return { text: lines.join('\n'), found: true };
}

// ── command shape ────────────────────────────────────────────────────────────────────────────────────

const VALUE = () => true;
const oneOf = (...allowed) => (v) => allowed.includes(v);
const VERBOSITY = oneOf('q', 'quiet', 'm', 'minimal', 'n', 'normal', 'd', 'detailed', 'diag', 'diagnostic');
const TEST_OPTIONS = new Map([
  ['--filter', VALUE], ['--no-build', null], ['--no-restore', null], ['-c', VALUE], ['--configuration', VALUE],
  ['--logger', (v) => /^(?:console|trx|html)(?:;[\w.]+=[\w.]+)*$/i.test(v)], ['-v', VERBOSITY], ['--verbosity', VERBOSITY],
  ['--blame-hang-timeout', (v) => /^\d+(?:ms|s|m|h)?$/.test(v)], ['--blame-hang-dump-type', oneOf('none', 'mini', 'full')],
  ['--results-directory', VALUE],
]);
const BUILD_OPTIONS = new Map([
  ['-c', VALUE], ['--configuration', VALUE], ['-f', VALUE], ['--framework', VALUE], ['-v', VERBOSITY], ['--verbosity', VERBOSITY],
  ['--no-restore', null], ['--nologo', null],
]);
// MSBuild reads a `/` word as a switch and an `@` word as a response file of further arguments.
const PROJECT_PATH = (a) => !/^[-/@]/.test(a);

// ── build reuse ──────────────────────────────────────────────────────────────────────────────────────

// Options that leave the build output as it is, with whether each takes a value. Every other option is
// read as part of the output's identity, so an option this list does not know makes a key of its own.
const NOT_OUTPUT = new Map([
  ['--filter', true], ['--logger', true], ['-l', true], ['--results-directory', true], ['--blame-hang-timeout', true],
  ['--blame-hang-dump-type', true], ['-v', true], ['--verbosity', true], ['--blame', false], ['--no-restore', false],
  ['--nologo', false], ['--no-build', false],
]);
const SAME_OPTION = { '--configuration': '-c', '--framework': '-f', '--runtime': '-r', '--arch': '-a', '--property': '-p', '/p': '-p', '-property': '-p' };

function words(command) {
  return [...String(command).matchAll(/"([^"]*)"|(\S+)/g)].map((m) => (m[1] !== undefined ? m[1] : m[2]));
}

// The project a `dotnet test` command runs and every option that changes what it builds, in one string.
function buildKey(command) {
  const all = words(command);
  const at = all.findIndex((w, i) => /(^|[\\/])dotnet(\.exe)?$/i.test(w) && all[i + 1] === 'test');
  const args = at < 0 ? all : all.slice(at + 2);
  let target = '';
  const parts = [];
  for (let i = 0; i < args.length; i++) {
    const w = args[i];
    if (w === '--') {
      parts.push(args.slice(i).join(' '));
      break;
    }
    const [name, inline] = w.split(/[:=](.*)/s);
    if (NOT_OUTPUT.has(name)) {
      if (NOT_OUTPUT.get(name) && inline === undefined) i++;
      continue;
    }
    if (/^[-/]/.test(w)) {
      const value = inline !== undefined ? inline : (args[i + 1] !== undefined && !/^-/.test(args[i + 1]) ? args[++i] : '');
      parts.push(`${SAME_OPTION[name] || name}=${value}`);
      continue;
    }
    if (!target) target = w.replace(/\\/g, '/');
    else parts.push(w);
  }
  return [target, ...parts.sort()].join(' ');
}

function noBuild(command) {
  if (/(^|\s)--no-build(\s|$)/.test(command)) return command;
  const m = String(command).match(/dotnet(\.exe)?"?\s+test(?=\s|$)/i);
  if (!m) return command;
  const at = m.index + m[0].length;
  return `${command.slice(0, at)} --no-build${command.slice(at)}`;
}

function create(h) {
  const slashes = (p) => String(p).replace(/\\/g, '/');
  const stopFlags = (seconds) => `--blame-hang-timeout ${seconds}s --blame-hang-dump-type none`;
  const shape = {
    test: (args) => args[0] === 'test' && h.argsListed(TEST_OPTIONS, args.slice(1), PROJECT_PATH, 1),
    setup: (args) => (args[0] === 'restore' || args[0] === 'build') && h.argsListed(BUILD_OPTIONS, args.slice(1), PROJECT_PATH, 1),
  };

  // Bounded by cwd: a .csproj above the tree belongs to some other checkout.
  function nearestProject(absFile, cwd) {
    const top = path.resolve(cwd);
    let dir = path.dirname(absFile);
    while (dir === top || dir.startsWith(top + path.sep)) {
      let projects = [];
      try { projects = fs.readdirSync(dir).filter((n) => n.endsWith('.csproj')).sort(); } catch { /* unreadable */ }
      if (projects.length > 0) return path.join(dir, projects[0]);
      if (dir === top || path.dirname(dir) === dir) break;
      dir = path.dirname(dir);
    }
    return null;
  }

  function nearestTestProject(absFile, cwd) {
    const proj = nearestProject(absFile, cwd);
    if (!proj) return null;
    let text = '';
    try { text = fs.readFileSync(proj, 'utf8'); } catch { /* unreadable */ }
    return TEST_PROJECT.test(text) ? proj : null;
  }

  // Each class a source declares, as the start of the full name a test run reports for its tests: the namespace
  // in force (file-scoped or block), the enclosing types joined by `+`, then the dot before the method — or, for
  // a generic class, its name open before the type arguments (`Name<`). Comments, strings and character
  // literals are blanked first, so a brace or a `class` word inside one is never read.
  function qualifiedClasses(source) {
    const text = codeOnly(source);
    const token = /\bnamespace\s+([A-Za-z_][\w.]*)\s*([;{])|\b(?:(class|struct|interface)|record(?:\s+(class|struct))?)\s+([A-Za-z_]\w*)(\s*<)?|[{};]/g;
    const scopes = [];
    let fileSpace = '';
    let pending = null;
    const names = [];
    for (const m of text.matchAll(token)) {
      if (m[1]) {
        if (m[2] === ';') fileSpace = m[1];
        else scopes.push({ space: m[1] });
        continue;
      }
      if (m[5]) {
        pending = { type: m[5], cls: m[3] === 'class', generic: Boolean(m[6]) };
        continue;
      }
      if (m[0] === ';') { pending = null; continue; }
      if (m[0] === '}') { scopes.pop(); continue; }
      if (!pending) { scopes.push({}); continue; }
      const space = [fileSpace, ...scopes.filter((s) => s.space).map((s) => s.space)].filter(Boolean).join('.');
      const chain = [...scopes.filter((s) => s.type).map((s) => s.type), pending.type].join('+');
      if (pending.cls) {
        const name = `${space ? `${space}.` : ''}${chain}${pending.generic ? '<' : '.'}`;
        if (!names.includes(name)) names.push(name);
      }
      scopes.push({ type: pending.type });
      pending = null;
    }
    return names;
  }

  const disjunction = (classes) => classes.map((c) => `FullyQualifiedName~${c}`).join('|');

  // A step run selects each class by the start of its tests' full names (qualifiedClasses), so no class whose
  // name ends in another's is selected beside it; a filter past the budget is split into batches, never dropped.
  function stepBatches(head, classes, clause) {
    const expr = (list) => {
      const or = list.map((c) => `FullyQualifiedName~${c}`).join('|');
      return clause ? `${list.length > 1 ? `(${or})` : or}&${clause}` : or;
    };
    const command = (list) => `${head} --filter "${expr(list)}"`;
    const batches = [];
    let current = [];
    for (const c of classes) {
      if (current.length && command([...current, c]).length > COMMAND_BUDGET) {
        batches.push(current);
        current = [];
      }
      current.push(c);
    }
    if (current.length) batches.push(current);
    return batches.map(command);
  }

  // A filter that would take the command past the budget is dropped, keeping only the exclusion `clause`:
  // the whole project runs, which is slower and never wrong.
  function filtered(head, classes, clause, note) {
    let expr = disjunction(classes);
    if (clause) expr = `${classes.length > 1 ? `(${expr})` : expr}&${clause}`;
    const command = `${head} --filter "${expr}"`;
    if (command.length <= COMMAND_BUDGET) return command;
    if (note) note(`${head}: its class filter makes a ${command.length}-character command, over the ${COMMAND_BUDGET}-character budget — running the whole project`);
    return clause ? `${head} --filter "${clause}"` : head;
  }

  const wrapped = (e) => {
    if (!e.startsWith('(') || !e.endsWith(')')) return false;
    let depth = 0;
    for (let i = 0; i < e.length; i++) {
      if (e[i] === '(') depth++;
      else if (e[i] === ')' && --depth === 0) return i === e.length - 1;
    }
    return false;
  };
  function topLevelParts(e) {
    const parts = [];
    let depth = 0;
    let from = 0;
    for (let i = 0; i < e.length; i++) {
      if (e[i] === '(') depth++;
      else if (e[i] === ')') depth--;
      else if (e[i] === '&' && depth === 0) {
        parts.push(e.slice(from, i));
        from = i + 1;
      }
    }
    return [...parts, e.slice(from)];
  }
  // A filter as its `&` parts, parentheses opened wherever no `|` stands between them.
  function conjuncts(expr) {
    let e = expr.trim();
    while (wrapped(e)) e = e.slice(1, -1).trim();
    if (h.hasTopLevelOr(e)) return [{ group: e }];
    const parts = topLevelParts(e);
    return parts.length === 1 ? [{ atom: e }] : parts.flatMap(conjuncts);
  }
  const NEGATIVE = /^[^=!~&|()]+(!=|!~)/;
  const isSlowClause = (atom) => atom.replace(/\s+/g, '') === SLOW_CLAUSE;

  const selects = (part) => ({ why: `its filter selects tests (${part}), so what it leaves out cannot be told` });

  // One invocation's exclusion, from its arguments after `dotnet`: the negative parts of its filter, or why
  // they cannot be told apart.
  function callExclusion(args) {
    let expr = null;
    for (let i = 1; i < args.length; i++) {
      const eq = args[i].indexOf('=');
      if ((eq < 0 ? args[i] : args[i].slice(0, eq)) === '--filter') expr = eq < 0 ? args[i + 1] : args[i].slice(eq + 1);
    }
    if (expr === null) return { clause: '' };
    const kept = [];
    for (const part of conjuncts(expr)) {
      if (part.group) {
        if (/!=|!~/.test(part.group)) return { why: `its filter leaves tests out inside a | expression, so what it excludes cannot be told: ${part.group}` };
        return selects(part.group);
      }
      if (isSlowClause(part.atom)) continue;
      if (!NEGATIVE.test(part.atom)) return selects(part.atom.trim());
      kept.push(part.atom.trim());
    }
    return { clause: kept.join('&') };
  }

  function exclusionOf(command) {
    if (/(^|\s)(--settings|-s)(\s|=|$)|TestCaseFilter/i.test(command)) return { unknown: true, why: `its settings may filter tests of their own: ${String(command).trim()}` };
    const read = h.invocationsOf(command, 'vstest', shape);
    if (read.why) return { unknown: true, why: read.why };
    const found = read.calls.map(callExclusion);
    const blocked = found.find((f) => f.why);
    if (blocked) return { unknown: true, why: blocked.why };
    const clauses = new Set(found.map((f) => f.clause.split('&').filter(Boolean).sort().join('&')));
    if (clauses.size > 1) return { unknown: true, why: 'its dotnet test runs leave out different tests' };
    return found[0].clause ? { known: true, clause: found[0].clause } : { none: true };
  }

  // `strict` refuses what a changed-files restriction drops: a named-files run names only test files, while a
  // diff over a test root also lists the code under test. `qualified` names each class with its namespace.
  function classesByProject(files, cwd, strict, qualified = false) {
    const byProject = new Map();
    for (const f of files) {
      const abs = path.resolve(cwd, f);
      const proj = String(f).endsWith('.cs') ? nearestTestProject(abs, cwd) : null;
      if (!proj) {
        if (strict) throw new Error(`filesCommand: ${f} is not a .cs file under a test project`);
        continue;
      }
      let classes = [];
      try {
        const source = fs.readFileSync(abs, 'utf8');
        classes = qualified ? qualifiedClasses(source) : h.parseClasses(source);
      } catch { /* unreadable → no classes */ }
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

  function joinExclusion(segment) {
    if (ALREADY_EXCLUDED.test(h.fold(segment))) return segment;
    const filter = segment.match(FILTER);
    if (filter) {
      const expr = filter[2] ?? filter[3] ?? filter[4];
      const joined = `${h.hasTopLevelOr(expr) ? `(${expr})` : expr}&${SLOW_CLAUSE}`;
      return segment.slice(0, filter.index) + `--filter${filter[1]}"${joined}"` + segment.slice(filter.index + filter[0].length);
    }
    const clause = ` --filter "${SLOW_CLAUSE}"`;
    const runsettings = segment.match(/\s--(\s|$)/);
    if (runsettings) return segment.slice(0, runsettings.index) + clause + segment.slice(runsettings.index);
    const body = segment.replace(/\s+$/, '');
    return body + clause + segment.slice(body.length);
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

  // The one filter every `dotnet test` run of the declared unit carries ('' for none), or null when two
  // runs differ — then no tied project can be told which filter is its own.
  function unitFilter(unit) {
    const filters = new Set();
    for (const segment of h.splitChain(unit)) {
      if (h.inferRunner(segment) !== 'vstest') continue;
      const m = segment.match(FILTER);
      filters.add(m ? (m[2] ?? m[3] ?? m[4]) : '');
    }
    if (filters.size > 1) return null;
    return filters.size ? [...filters][0] : '';
  }

  // A tied run is never wider than the step close it stands in for: it keeps the unit's filter and,
  // where slow tests are declared, their exclusion. `stopSeconds` adds the hang stop.
  function tiedCommand(project, filter, slow, stopSeconds) {
    const stop = stopSeconds ? ` ${stopFlags(stopSeconds)}` : '';
    const head = `dotnet test "${project}"${stop}${filter ? ` --filter "${filter}"` : ''}`;
    return slow ? joinExclusion(head) : head;
  }

  // Every test project that reaches `start` through any chain of project references, itself included.
  function testsReaching(start, projects) {
    const seen = new Set([start.file]);
    const queue = [start];
    const hits = [];
    while (queue.length) {
      const p = queue.shift();
      if (p.test) hits.push(p);
      for (const q of projects) {
        if (!seen.has(q.file) && q.refs.includes(p.file)) {
          seen.add(q.file);
          queue.push(q);
        }
      }
    }
    return hits;
  }

  function tiedSet({ repo, changed, listing, unit = '', slow = null, stopSeconds = 0 }) {
    const projects = readProjects(repo, listing);
    const targets = new Set();
    const untied = [];
    for (const f of changed) {
      let hits;
      if (READ_BY_EVERY_PROJECT.has(path.posix.basename(slashes(f)).toLowerCase())) hits = projects.filter((p) => p.test);
      else {
        const owner = ownerOf(f, projects);
        hits = owner ? testsReaching(owner, projects) : [];
      }
      if (hits.length === 0) untied.push(f);
      for (const p of hits) targets.add(p.file);
    }
    const sorted = [...targets].sort();
    if (untied.length) return { targets: sorted, untied, commands: [] };
    if (sorted.length === 0) return { targets: sorted, untied, commands: [], fallback: 'no changed file ties to a test project' };
    const filter = unitFilter(typeof unit === 'string' ? unit : '');
    if (filter === null) {
      return { targets: sorted, untied, commands: [], fallback: "the declared unit's dotnet test runs carry different filters, so a tied project's own cannot be told" };
    }
    return { targets: sorted, untied, commands: sorted.map((p) => tiedCommand(p, filter, Boolean(slow), stopSeconds)) };
  }

  // Every source file declaring the class `short` in the test project above `codeBase` (the test assembly's
  // path), with each file's text — by its full name `full` first, where a run reports one, so two classes of one
  // short name in different namespaces are told apart; more than one file is a partial class. `cache` keeps one
  // class index per project across calls.
  function classFiles(tree, codeBase, short, cache = new Map(), full = '') {
    const project = h.projectDir(path.dirname(codeBase), tree, (n) => n.endsWith('.csproj'));
    if (!project) return [];
    if (!cache.has(project)) {
      const index = new Map();
      const qualified = new Map();
      const texts = new Map();
      const add = (map, key, f) => { if (!map.has(key)) map.set(key, []); if (!map.get(key).includes(f)) map.get(key).push(f); };
      for (const f of h.sourceFiles(project, '.cs')) {
        const source = fs.readFileSync(f, 'utf8');
        texts.set(f, source);
        for (const c of h.parseClasses(source)) add(index, c, f);
        for (const q of qualifiedClasses(source)) add(qualified, q, f);
      }
      cache.set(project, { index, qualified, texts });
    }
    const { index, qualified, texts } = cache.get(project);
    const files = (full && qualified.get(`${full}.`)) || index.get(short) || [];
    return files.map((file) => ({ file, text: texts.get(file) }));
  }

  // Of the files declaring class `short`, the one whose declaration holds `method`, else the first. The one
  // resolver the timing report, a full run's failure placement and the retag share.
  function declaring(files, short, method) {
    return (method && files.find(({ text }) => methodIndex(String(text).split('\n'), short, method) >= 0)) || files[0];
  }

  // The source file of one test; null when no file declares its class.
  function classFile(tree, codeBase, short, cache = new Map(), full = '', method = '') {
    const files = classFiles(tree, codeBase, short, cache, full);
    return files.length === 0 ? null : declaring(files, short, method).file;
  }

  // A .NET method is labelled by its name, never its line, so the attribute and comment lines the edits add
  // move nothing still to come. A method is slow when every timed case of it is at or over the line.
  function labelSource({ file, source, tests, threshold, wanted, out }) {
    let text = source;
    const methods = new Map();
    for (const t of tests.filter((x) => x.class && x.method)) {
      const key = `${t.class}.${t.method}`;
      if (!methods.has(key)) methods.set(key, { cls: t.class, method: t.method, lines: new Set(), slow: true, ms: 0 });
      const m = methods.get(key);
      m.lines.add(t.line);
      m.slow = m.slow && t.ms >= threshold;
      m.ms = Math.max(m.ms, t.ms);
    }
    for (const { cls, method, lines, slow, ms } of methods.values()) {
      const edit = labelDotnetMethod(text, cls, method, slow);
      if (!edit.found) { out(`label-tests: ${file} ${cls}.${method} — its declaration was not found, so no label was written\n`); continue; }
      text = edit.text;
      const asked = wanted.find((w) => w.file === file && lines.has(w.line));
      const at = dotnetReasonLine(text, cls, method);
      if (!slow) {
        text = h.clearReason(text, at).text;
        if (asked) { asked.done = true; out(`label-tests: ${file}:${asked.line} ran under the slow line (${Math.round(ms)} ms) — no reason written\n`); }
      } else if (asked) {
        text = h.setReason(text, at, asked.reason || 'kept slow').text;
        asked.done = true;
      }
    }
    return { text, slow: [...methods.values()].some((m) => m.slow) };
  }

  // The timing pass's labels: a class whose every test is slow gets the class-level Trait, otherwise each
  // slow method its own; the labels of the timed tests are set from their times, and a test the pass did not
  // time keeps its label.
  function retagEdits({ tree, keys, tagged, meta, log }) {
    const isTagged = new Set(tagged);
    const allIn = (list) => list.length > 0 && list.every((k) => isTagged.has(k));
    const byClass = new Map();
    for (const key of keys) {
      const { className } = meta[key];
      if (!byClass.has(className)) byClass.set(className, []);
      byClass.get(className).push(key);
    }
    const indexes = new Map();
    const byFile = new Map();
    for (const [className, classKeys] of byClass) {
      const timed = new Map([...new Set(classKeys.map((k) => meta[k].method))]
        .map((method) => [method, allIn(classKeys.filter((k) => meta[k].method === method))]));
      const short = className.split('.').pop();
      const files = classFiles(tree, meta[classKeys[0]].codeBase, short, indexes, className);
      if (files.length === 0) {
        if ([...timed.values()].some(Boolean)) log(`could not find class ${className} under its test project — tag it by hand`);
        continue;
      }
      const at = (file) => {
        if (!byFile.has(file)) byFile.set(file, { classes: new Map(), split: new Map() });
        return byFile.get(file);
      };
      // Several files of one short name are one class only when each declares it `partial`; otherwise they
      // are different classes the full name did not tell apart, and the first file is the one read. C# puts
      // `partial` right before `class` (or `record`), with any space, line break or comment between.
      const partial = new RegExp(`\\bpartial\\s+(?:record\\s+)?class\\s+${escapeRegex(short)}\\b`);
      if (files.length === 1 || !files.every(({ text }) => partial.test(codeOnly(text)))) {
        at(files[0].file).classes.set(short, timed);
        continue;
      }
      // A partial class: each file is given the timed methods it declares, and a class label on any one
      // declaration covers the methods of every file, so every file is edited while one stands.
      const parts = files.map(({ file, text }) => ({ file, lines: String(text).split('\n') }));
      const inherited = parts.some(({ lines }) => labelAbove(lines, classIndex(lines, short)));
      const complete = parts.every(({ lines }) => testMethodsOf(lines, short).complete);
      const holder = (method) => declaring(files, short, method).file;
      for (const { file } of parts) {
        const here = new Map([...timed].filter(([method]) => holder(method) === file));
        if (here.size === 0 && !inherited) continue;
        const entry = at(file);
        entry.classes.set(short, here);
        entry.split.set(short, { inherited, complete });
      }
    }
    return [...byFile].map(([file, { classes, split }]) => ({ file, edit: (text) => retagDotnetSource(text, classes, split) }));
  }

  // ── a full run ─────────────────────────────────────────────────────────────────────────────────────

  function withRunReport(stage, dir) {
    const vitest = readVitestStage(stage);
    if (vitest) {
      const plain = without(stage, vitest.drop);
      const shown = vitest.reporters.some((o) => o.value !== 'json') ? '' : ' --reporter=default';
      const runEnd = stageTokens(plain)[vitestRunAt(stageTokens(plain))].end;
      return `${plain.slice(0, runEnd)}${shown} --reporter=json --outputFile.json=${h.quote(`${slashes(dir)}/${VITEST_REPORT}`)}${plain.slice(runEnd)}`;
    }
    const read = readStage(stage);
    if (!read) return stage;
    const plain = without(stage, read.options.filter((o) => isTrxLogger(o) || o.name === '--results-directory'));
    return h.insertAfter(plain, /dotnet(\.exe)?"?\s+test(?=\s|$)/i, ` --logger trx --results-directory ${h.quote(dir)}`);
  }

  // The test projects a stage selects, read against the folder it ran in (`cwd`): its project; a solution's
  // listed projects that are test projects; with no target, the one solution or project in `cwd`. A solution
  // that cannot be read, or a folder holding no single one, expects every test project under it. `unknown` for
  // a target of any other kind.
  function selectedProjects(tree, cwd, read, projects) {
    const rel = (abs) => slashes(path.relative(tree, abs));
    const under = (abs) => {
      const dir = rel(abs);
      return projects.filter((p) => p.test && (dir === '' || p.file.startsWith(`${dir}/`)));
    };
    let target = read.target ? path.resolve(cwd, read.target.value) : cwd;
    let isDir = false;
    try { isDir = fs.statSync(target).isDirectory(); } catch { /* a file, or gone */ }
    if (isDir) {
      let names = [];
      try { names = fs.readdirSync(target); } catch { /* unreadable */ }
      const solutions = names.filter((n) => /\.slnx?$/i.test(n));
      const csprojs = names.filter((n) => /\.csproj$/i.test(n));
      if (solutions.length === 1) target = path.join(target, solutions[0]);
      else if (solutions.length === 0 && csprojs.length === 1) target = path.join(target, csprojs[0]);
      else return { selected: under(target) };
    }
    if (/\.csproj$/i.test(target)) return { selected: projects.filter((p) => p.test && p.file === rel(target)) };
    if (!/\.slnx?$/i.test(target)) return { selected: [], unknown: true };
    let text;
    try { text = fs.readFileSync(target, 'utf8'); } catch { return { selected: under(path.dirname(target)) }; }
    const listed = /\.slnx$/i.test(target)
      ? [...text.matchAll(/<Project\b[^>]*\bPath="([^"]+\.csproj)"/gi)]
      : [...text.matchAll(/^\s*Project\([^)]*\)\s*=\s*"[^"]*"\s*,\s*"([^"]+\.csproj)"/gmi)];
    const files = new Set(listed.map((m) => rel(path.resolve(path.dirname(target), slashes(m[1])))));
    return { selected: projects.filter((p) => p.test && files.has(p.file)) };
  }

  // A vitest stage's results, from its json report under `dir`: each failed assertion a failure of its file.
  function readVitest({ tree, dir, cwd, stage }) {
    const own = readVitestStage(stage).json;
    const report = path.join(dir, VITEST_REPORT);
    const copies = own && own.value && fs.existsSync(report) ? [{ from: report, to: own.value }] : [];
    return { ...vitestResults({ tree, dir, cwd }), copies };
  }

  function vitestResults({ tree, dir, cwd }) {
    const folder = slashes(path.relative(tree, path.resolve(cwd || tree))) || '.';
    const project = { project: folder, runner: 'vitest', ms: 0, state: 'unfinished', failed: 0, passed: 0 };
    let report = null;
    try { report = JSON.parse(fs.readFileSync(path.join(dir, VITEST_REPORT), 'utf8')); } catch { /* no report: the run never ended */ }
    const results = report && Array.isArray(report.testResults) ? report.testResults : null;
    if (!results) return { failed_tests: [], timed_out: [], projects: [project], complete: false, explained: false, stuck: [], copies: [] };
    const failed = [];
    let end = 0;
    let explained = true;
    for (const file of results) {
      const target = h.relativeFile(file.name, tree);
      if (!['passed', 'failed', 'skipped'].includes(file.status)) explained = false;
      end = Math.max(end, Number(file.endTime) || 0);
      const before = failed.length;
      for (const a of Array.isArray(file.assertionResults) ? file.assertionResults : []) {
        if (a.status === 'passed') { project.passed++; continue; }
        if (a.status !== 'failed') continue;
        failed.push({ file: target, line: null, test: a.fullName, target, runner: 'vitest', message: messageLine((a.failureMessages || [])[0]) });
      }
      if (file.status === 'failed' && failed.length === before) {
        failed.push({ file: target, line: null, test: null, target, runner: 'vitest', message: messageLine(file.message) });
      }
    }
    project.failed = failed.length;
    project.ms = end && Number(report.startTime) ? Math.max(0, end - Number(report.startTime)) : 0;
    project.state = 'finished';
    return { failed_tests: failed, timed_out: [], projects: [project], complete: true, explained, stuck: [], copies: [] };
  }

  // A full-run stage's results, from the .trx and blame Sequence files under `dir`.
  function readRunResults({ tree, dir, cwd, output = '', stage }) {
    if (vitestRunAt(stageTokens(stage)) >= 0) return readVitest({ tree, dir, cwd, stage });
    const read = readStage(stage);
    if (!read) return null;
    const text = String(output || '');
    const projects = readProjects(tree, h.listFiles(tree));
    const byAssembly = (name) => projects.find((p) => p.test && p.assembly.toLowerCase() === name) || null;
    const { selected, unknown } = selectedProjects(tree, path.resolve(cwd || tree), read, projects);
    let explained = !unknown;
    const cache = new Map();
    const sources = new Map();
    const place = (codeBase, name) => {
      const { className, method } = splitTestName(name);
      const short = className.split('.').pop();
      const abs = codeBase ? classFile(tree, codeBase, short, cache, className, method) : null;
      if (!abs) return { file: null, line: null, class: short, method };
      const file = slashes(path.relative(tree, abs));
      if (!sources.has(file)) sources.set(file, fs.readFileSync(abs, 'utf8'));
      return { file, line: dotnetMethodLine(sources.get(file), short, method) || null, class: short, method };
    };
    const state = new Map(selected.map((p) => [p.file, { project: p.file, runner: 'vstest', ms: 0, state: 'unfinished', failed: 0, passed: 0, seen: false }]));
    const entry = (p) => {
      if (!state.has(p.file)) state.set(p.file, { project: p.file, runner: 'vstest', ms: 0, state: 'unfinished', failed: 0, passed: 0, seen: false });
      return state.get(p.file);
    };
    const failed = [];
    const timedOut = [];
    const trxFiles = (() => { try { return h.sourceFiles(dir, '.trx'); } catch { return []; } })();
    for (const trx of trxFiles) {
      const run = parseTrxResults(fs.readFileSync(trx, 'utf8'));
      const owners = run.assemblies.map(byAssembly);
      if (owners.some((p) => !p)) explained = false;
      for (const p of owners.filter(Boolean)) { const e = entry(p); e.seen = true; e.ms += run.ms; }
      for (const r of run.results) {
        const p = byAssembly(assemblyOf(r.codeBase));
        const e = p ? entry(p) : null;
        if (r.outcome === 'Passed') { if (e) e.passed++; continue; }
        if (r.outcome === 'NotExecuted') continue;
        if (r.outcome !== 'Failed' && r.outcome !== 'Error') { explained = false; continue; }
        if (e) e.failed++;
        else explained = false;
        const at = place(r.codeBase, r.className && r.method ? `${r.className}.${r.method}` : r.test);
        failed.push({ file: at.file, line: at.line, test: r.test, class: at.class, method: at.method, project: p ? p.file : null, target: p ? p.file : null, runner: 'vstest', message: r.message });
      }
    }
    for (const m of text.matchAll(NO_MATCH)) {
      const p = byAssembly(assemblyOf(m[1]));
      if (p && state.has(p.file)) state.get(p.file).seen = true;
    }
    // A blame Sequence file names the project each test ran in; a test it marks not completed was running
    // when its run ended — stuck where the blame collector's inactivity lines cover every such project, a
    // crash otherwise.
    const incomplete = new Map();
    let sequences = [];
    try { sequences = h.sourceFiles(dir, '.xml').filter((f) => /^Sequence_.*\.xml$/i.test(path.basename(f))); } catch { /* none */ }
    for (const file of sequences) {
      for (const t of parseSequence(fs.readFileSync(file, 'utf8'))) {
        const p = byAssembly(assemblyOf(t.source));
        if (!p || !state.has(p.file)) { explained = false; continue; }
        if (t.completed) continue;
        if (!incomplete.has(p.file)) incomplete.set(p.file, { p, source: t.source, tests: [] });
        incomplete.get(p.file).tests.push(t.name);
      }
    }
    const inactivity = [...text.matchAll(INACTIVITY)];
    const aborts = [...text.matchAll(ABORT_LINE)].length;
    const hung = incomplete.size > 0 && inactivity.length >= incomplete.size;
    const stuck = [];
    for (const { p, source, tests } of incomplete.values()) {
      if (!hung) { explained = false; continue; }
      for (const name of tests) {
        if (name.includes('(')) explained = false;
        const at = place(source, name);
        timedOut.push({ file: at.file, line: at.line, test: name, class: at.class, method: at.method, project: p.file, target: p.file, runner: 'vstest', message: messageLine(inactivity[0][0]), cause: 'timeout' });
      }
      stuck.push({ project: p.file, path: path.join(tree, p.file), tests });
    }
    let complete = !unknown && aborts <= incomplete.size;
    if (!complete) explained = false;
    // A confirmed hang can stop a project before it wrote any result; its Sequence file shows it ran.
    for (const e of state.values()) {
      if (!e.seen && !(hung && incomplete.has(e.project))) explained = false;
      e.state = e.seen && !incomplete.has(e.project) ? 'finished' : 'unfinished';
      if (e.state !== 'finished') complete = false;
    }
    const logger = read.options.find(isTrxLogger);
    const own = read.options.find((o) => o.name === '--results-directory');
    const copies = logger ? trxFiles.map((from) => ({ from, to: path.join(own && own.value ? own.value : 'TestResults', path.basename(from)) })) : [];
    return {
      failed_tests: failed, timed_out: timedOut,
      projects: [...state.values()].map(({ seen, ...e }) => e).sort((a, b) => (a.project < b.project ? -1 : 1)),
      complete, explained, stuck, copies,
    };
  }

  // The declared stage narrowed to `project` (absolute, or relative to the stage's folder), built no more,
  // without `tests` — a theory case's whole method, since vstest filters by method — its results under `dir`.
  function rerunWithout({ stage, project, tests, dir }) {
    const read = readStage(stage);
    if (!read) return stage;
    let out = String(stage);
    const quoted = h.quote(project);
    out = read.target ? out.slice(0, read.target.start) + quoted + out.slice(read.target.end) : h.insertAfter(out, /dotnet(\.exe)?"?\s+test(?=\s|$)/i, ` ${quoted}`);
    out = noBuild(out);
    const clause = [...new Set((tests || []).map((t) => `FullyQualifiedName!=${escapeFilter(splitTestName(t).full)}`))].join('&');
    const filter = out.match(FILTER);
    if (filter) {
      const expr = filter[2] ?? filter[3] ?? filter[4];
      const joined = `${h.hasTopLevelOr(expr) ? `(${expr})` : expr}&${clause}`;
      out = out.slice(0, filter.index) + `--filter${filter[1]}"${joined}"` + out.slice(filter.index + filter[0].length);
    } else {
      const tail = out.match(/\s--(\s|$)/);
      out = tail ? `${out.slice(0, tail.index)} --filter "${clause}"${out.slice(tail.index)}` : `${out.replace(/\s+$/, '')} --filter "${clause}"`;
    }
    return withRunReport(out, dir);
  }

  return {
    filesCommand({ files, exclude, cwd = process.cwd(), note, stopSeconds, step = false }) {
      const list = Array.isArray(files) ? files : [];
      const stop = stopSeconds ? ` ${stopFlags(stopSeconds)}` : '';
      const clause = exclude ? SLOW_CLAUSE : '';
      return [...classesByProject(list, cwd, true, step)].flatMap(([proj, classes]) => (step
        ? stepBatches(`dotnet test ${h.quote(proj)}${stop}`, classes, clause)
        : [filtered(`dotnet test ${h.quote(proj)}${stop}`, classes, clause, note)]));
    },
    // The projects that own the changed files, each built once; a file no project owns builds nothing.
    buildCommand({ files, cwd = process.cwd() }) {
      const projects = [];
      for (const f of Array.isArray(files) ? files : []) {
        const abs = path.resolve(cwd, String(f));
        const proj = String(f).endsWith('.csproj') ? abs : nearestProject(abs, cwd);
        if (!proj) continue;
        const rel = path.relative(cwd, proj).replace(/\\/g, '/');
        if (!projects.includes(rel)) projects.push(rel);
      }
      return projects.map((p) => `dotnet build ${h.quote(p)}`);
    },
    // The test projects of the changed .cs files, each with only the classes that live in it.
    deltaTargets({ files, cwd = process.cwd() }) {
      const byProject = classesByProject((Array.isArray(files) ? files : []).map(String), cwd, false);
      return { targets: [...byProject.keys()], classes: Object.fromEntries(byProject) };
    },
    timingCommand({ targets, tmp, classes = {}, note, exclusion = null }) {
      const dir = String(tmp).replace(/\\/g, '/');
      const clause = exclusion || '';
      return (Array.isArray(targets) ? targets : []).map((t) => {
        const head = `dotnet test ${h.quote(t)} --logger trx --results-directory ${h.quote(dir)}`;
        const own = classes[t];
        if (Array.isArray(own) && own.length) return filtered(head, own, clause, note);
        return clause ? `${head} --filter "${clause}"` : head;
      });
    },
    exclusionOf,
    stopFlags,
    joinExclusion,
    joinStop(segment, seconds) {
      if (ALREADY_STOPPED.test(h.fold(segment))) return segment;
      return h.insertAfter(segment, /dotnet\s+test(?=\s|$)/, ` ${stopFlags(seconds)}`);
    },
    tiedSet,
    failedTargets({ output, repo, listing }) {
      const text = String(output || '');
      if (ABORTED.test(text)) return null;
      const assemblies = [...text.matchAll(FAILURE)].map((m) => m[1]);
      if (assemblies.length === 0) return [];
      const projects = readProjects(repo, listing || h.listFiles(repo));
      const found = [];
      for (const name of assemblies) {
        const owners = projects.filter((p) => p.test && p.assembly === name);
        if (owners.length === 0) return null;
        for (const p of owners) if (!found.includes(p.file)) found.push(p.file);
      }
      return found;
    },
    commandShape: shape,
    // A trx file in its own folder per command.
    withReport: (command, dir) => `${command} --logger trx --results-directory "${dir}"`,
    // Each executed test by the file that declares its class and the line of its method. The report folder is
    // removed once read.
    reportTimes({ tree, reportDir }) {
      const dir = path.join(tree, reportDir);
      const times = [];
      const cache = new Map();
      const sources = new Map();
      try {
        for (const trx of h.sourceFiles(dir, '.trx')) {
          for (const e of parseTrx(fs.readFileSync(trx, 'utf8'))) {
            const short = e.className.split('.').pop();
            const abs = e.codeBase ? classFile(tree, e.codeBase, short, cache, e.className, e.method) : null;
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
    },
    labelSource,
    withRunReport,
    readRunResults,
    rerunWithout,
    failureLines: (text) => String(text || '').split(/\r?\n/).filter((l) => FAILURE_LINE.test(l) || VITEST_FAILURE_LINE.test(l)),
    timingEntries: ({ dir }) => h.sourceFiles(dir, '.trx').flatMap((f) => parseTrx(fs.readFileSync(f, 'utf8'))),
    reportCount: (dir) => h.sourceFiles(dir, '.trx').length,
    buildKey,
    noBuild,
    retagEdits,
    untagSource: untagDotnetSource,
  };
}

module.exports = {
  runners: ['vstest'], contract: 1, create,
  COMMAND_BUDGET, parseTrx, tagDotnetSource, untagDotnetSource, dotnetMethodLine, dotnetReasonLine, labelDotnetMethod,
};
