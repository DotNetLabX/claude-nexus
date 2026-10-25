'use strict';
/**
 * The flutter runner: `flutter test` (and `dart test`). Written to the test-runner contract of the nexus
 * core (its hooks/scripts/lib/test-runners.js, contract 1), which finds this file by its path in this plugin.
 *
 * Slow tests carry `tags: ['slow']` on a `test()`/`testWidgets()` call, or `@Tags(['slow'])` on a whole
 * file, with `slow: {}` declared in the project's dart_test.yaml; `-x slow` leaves them out. A step close is
 * timed from the `--reporter json` stream on stdout. It ties no tests: a step close runs the declared unit.
 */
const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');

const TEST_FILE = /_test\.dart$/;
const INVOKE = /(flutter|dart)\s+test(?=\s|$)/;
const ALREADY_EXCLUDED = /(^|\s)(-x|--exclude-tags)[= ]slow(\s|$)/;
const ALREADY_STOPPED = /(^|\s)--timeout[= ]/;

function relativeFile(file, tree) {
  const rel = file ? path.relative(tree, String(file)) : '';
  const inside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  return String(inside ? rel : file).replace(/\\/g, '/');
}

// Each executed test of a `flutter test --reporter json` stream, at the position it reported.
function parseFlutterJson(text, tree) {
  const starts = new Map();
  const entries = [];
  for (const line of String(text).split(/\r?\n/)) {
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (event && event.type === 'testStart' && event.test) {
      starts.set(event.test.id, { test: event.test, time: event.time });
    } else if (event && event.type === 'testDone' && !event.hidden && !event.skipped && starts.has(event.testID)) {
      const { test, time } = starts.get(event.testID);
      const url = test.root_url || test.url;
      if (!url) continue;
      const file = relativeFile(fileURLToPath(url), tree);
      entries.push({
        key: `${file}::${test.name}`,
        file,
        name: test.name,
        line: test.root_url ? test.root_line : test.line,
        column: test.root_url ? test.root_column : test.column,
        ms: event.time - time,
      });
    }
  }
  return entries;
}

function skipDartString(text, i) {
  const q = text[i];
  if (text.startsWith(q.repeat(3), i)) {
    const end = text.indexOf(q.repeat(3), i + 3);
    return end < 0 ? text.length : end + 2;
  }
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] === '\\') j++;
    else if (text[j] === q || text[j] === '\n') return j;
  }
  return text.length;
}

// The call's top level: the comma after its description and a `tags:` argument, skipping strings,
// comments and nested brackets (the test body holds commas and may mention tags).
function scanCall(text, open) {
  let depth = 0;
  let firstComma = -1;
  let tags = -1;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" || ch === '"') { i = skipDartString(text, i); continue; }
    if (ch === '/' && text[i + 1] === '/') { const nl = text.indexOf('\n', i); if (nl < 0) break; i = nl; continue; }
    if (ch === '/' && text[i + 1] === '*') { const end = text.indexOf('*/', i + 2); if (end < 0) break; i = end + 1; continue; }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) { depth--; if (depth === 0) break; }
    else if (depth === 1 && ch === ',' && firstComma < 0) firstComma = i;
    else if (depth === 1 && tags < 0 && /^tags\s*:/.test(text.slice(i, i + 12)) && !/\w/.test(text[i - 1])) tags = i;
  }
  return { firstComma, tags };
}

const DART_CALL = /^(?:test|testWidgets)\s*\(/;

function tagDartCall(text, offset) {
  const call = text.slice(offset).match(DART_CALL);
  if (!call) return null;
  const { firstComma, tags } = scanCall(text, offset + call[0].length - 1);
  if (tags >= 0) {
    const list = text.slice(tags).match(/^tags\s*:\s*\[/);
    if (!list) return null;
    const open = tags + list[0].length;
    const close = text.indexOf(']', open);
    if (/['"]slow['"]/.test(text.slice(open, close))) return text;
    return `${text.slice(0, open)}'slow', ${text.slice(open)}`;
  }
  if (firstComma < 0) return null;
  return `${text.slice(0, firstComma + 1)} tags: ['slow'],${text.slice(firstComma + 1)}`;
}

// The inverse of tagDartCall for one call: `slow` leaves its `tags:` list, and a list it was alone in goes.
function untagDartCall(text, offset) {
  const call = text.slice(offset).match(DART_CALL);
  if (!call) return null;
  const { tags } = scanCall(text, offset + call[0].length - 1);
  if (tags < 0) return text;
  const list = text.slice(tags).match(/^tags\s*:\s*\[/);
  if (!list) return null;
  const open = tags + list[0].length;
  const close = text.indexOf(']', open);
  const inner = text.slice(open, close);
  if (!/['"]slow['"]/.test(inner)) return text;
  if (/^\s*['"]slow['"]\s*,?\s*$/.test(inner)) {
    const from = text[tags - 1] === ' ' ? tags - 1 : tags;
    let to = close + 1;
    if (text[to] === ',') to++;
    return text.slice(0, from) + text.slice(to);
  }
  const kept = inner.replace(/['"]slow['"]\s*,\s*/, '').replace(/,\s*['"]slow['"]/, '');
  return text.slice(0, open) + kept + text.slice(close);
}

function tagDartSource(source, { fileLevel = false, calls = [] }) {
  let text = String(source);
  const missing = [];
  if (fileLevel) {
    const existing = text.match(/^@Tags\(\s*\[([^\]]*)\]/m);
    if (!existing) text = `@Tags(['slow'])${text.includes('\r\n') ? '\r\n' : '\n'}${text}`;
    else if (!/['"]slow['"]/.test(existing[1])) text = text.replace(/^@Tags\(\s*\[/m, () => "@Tags(['slow', ");
    return { text, missing };
  }
  const ordered = [...calls].sort((a, b) => b.line - a.line || b.column - a.column);
  for (const { line, column } of ordered) {
    const lines = text.split('\n');
    const offset = lines.slice(0, line - 1).reduce((sum, l) => sum + l.length + 1, 0) + column - 1;
    const next = line >= 1 && line <= lines.length ? tagDartCall(text, offset) : null;
    if (next === null) missing.push(`line ${line}:${column}`);
    else text = next;
  }
  return { text, missing };
}

function mergeDartTestYaml(text) {
  if (text === null || text === undefined) return 'tags:\n  slow: {}\n';
  const lines = String(text).split('\n');
  const at = lines.findIndex((l) => /^tags:\s*(#.*)?\r?$/.test(l));
  if (at < 0) {
    if (lines.some((l) => /^tags:/.test(l))) return null;
    return `${text}${text === '' || text.endsWith('\n') ? '' : '\n'}tags:\n  slow: {}\n`;
  }
  let indent = null;
  for (let i = at + 1; i < lines.length; i++) {
    if (/^\s*(#.*)?\r?$/.test(lines[i])) continue;
    const child = lines[i].match(/^(\s+)(['"]?)([^'":\s]+)\2\s*:/);
    if (!child) break;
    if (indent === null) indent = child[1];
    if (child[1] === indent && child[3] === 'slow') return text;
  }
  lines.splice(at + 1, 0, `${indent ?? '  '}slow: {}${lines[at].endsWith('\r') ? '\r' : ''}`);
  return lines.join('\n');
}

// `shift` is the number of lines removed above every test call, so reported call lines still point
// at their calls after the strip.
function untagDartSource(source) {
  let text = String(source);
  let shift = 0;
  const fileTag = text.match(/^@Tags\(\s*\[\s*['"]slow['"]\s*\]\s*\)\r?\n/m);
  if (fileTag) {
    text = text.slice(0, fileTag.index) + text.slice(fileTag.index + fileTag[0].length);
    shift = 1;
  }
  text = text
    .replace(/ tags: \['slow'\],/g, '')
    .replace(/(\btags\s*:\s*\[|@Tags\(\s*\[)\s*['"]slow['"]\s*,\s*/g, (m, open) => open)
    .replace(/,\s*['"]slow['"](?=\s*\])/g, '');
  return { text, shift };
}

// The offset of every test() and testWidgets() call in a Dart source, strings and comments skipped.
function dartCalls(text) {
  const found = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" || ch === '"') { i = skipDartString(text, i); continue; }
    if (ch === '/' && text[i + 1] === '/') { const nl = text.indexOf('\n', i); if (nl < 0) break; i = nl; continue; }
    if (ch === '/' && text[i + 1] === '*') { const end = text.indexOf('*/', i + 2); if (end < 0) break; i = end + 1; continue; }
    if (/[\w.$]/.test(text[i - 1] || '')) continue;
    if (DART_CALL.test(text.slice(i, i + 16))) found.push(i);
  }
  return found;
}

const FILE_SLOW = /^@Tags\(\s*\[[^\]]*['"]slow['"]/m;

function untagDartFile(text) {
  const sole = text.match(/^@Tags\(\s*\[\s*['"]slow['"]\s*\]\s*\)\r?\n/m);
  if (sole) return text.slice(0, sole.index) + text.slice(sole.index + sole[0].length);
  return text.replace(/^@Tags\(\s*\[[^\]]*\]/m, (m) => m.replace(/['"]slow['"]\s*,\s*/, '').replace(/,\s*['"]slow['"]/, ''));
}

// The labels of the timed calls set from their times, in place; a call the pass did not time keeps its label,
// and `@Tags` is written only when every call in the file was timed slow. `timed` carries each call's offset
// in `source` and whether it is slow.
function retagDartKeeping(source, timed) {
  let text = String(source);
  const missing = [];
  const calls = dartCalls(text);
  const slowAt = new Map(timed.map((t) => [t.offset, t.slow]));
  const wholeFile = calls.length > 0 && calls.every((c) => slowAt.has(c)) && timed.every((t) => t.slow);
  const inherited = FILE_SLOW.test(text);
  for (const at of [...new Set([...calls, ...slowAt.keys()])].sort((a, b) => b - a)) {
    const slow = wholeFile ? false : slowAt.has(at) ? slowAt.get(at) : inherited;
    if (!slow && !slowAt.has(at) && !inherited && !wholeFile) continue;
    const next = (slow ? tagDartCall : untagDartCall)(text, at);
    if (next === null) { if (slow) missing.push(`offset ${at}`); continue; }
    text = next;
  }
  if (wholeFile) text = tagDartSource(text, { fileLevel: true, calls: [] }).text;
  else if (inherited) text = untagDartFile(text);
  return { text, missing };
}

// `calls` carry the lines the run reported, i.e. before the strip.
function retagDartSource(source, { wholeFile, calls }) {
  const stripped = untagDartSource(source);
  const spec = wholeFile
    ? { fileLevel: true, calls: [] }
    : { fileLevel: false, calls: calls.map((c) => ({ ...c, line: c.line - stripped.shift })) };
  return tagDartSource(stripped.text, spec);
}

const VALUE = () => true;
const oneOf = (...allowed) => (v) => allowed.includes(v);
const REPORTER = oneOf('compact', 'expanded', 'github', 'json', 'silent', 'failures-only');
const TEST_OPTIONS = new Map([
  ['--no-pub', null], ['--coverage', null], ['-r', REPORTER], ['--reporter', REPORTER], ['-j', VALUE], ['--concurrency', VALUE], ['-n', VALUE], ['--name', VALUE], ['--plain-name', VALUE],
  ['-t', VALUE], ['--tags', VALUE], ['-x', VALUE], ['--exclude-tags', VALUE], ['--timeout', VALUE],
]);
const TEST_PATH = (a) => !/^[-@]/.test(a);
const SELECTS = new Set(['-t', '--tags', '-n', '--name', '--plain-name']);

function create(h) {
  const stopFlags = (seconds) => `--timeout ${seconds}s`;
  // The project root above a Dart test file: where its dart_test.yaml belongs.
  const projectOf = (tree, file) => h.projectDir(path.dirname(path.resolve(tree, file)), tree, (n) => n === 'pubspec.yaml');

  function checkTestFiles(files) {
    for (const f of files) if (!TEST_FILE.test(String(f))) throw new Error(`filesCommand: ${f} is not a flutter test file`);
  }

  const testShape = (args) => args[0] === 'test' && h.argsListed(TEST_OPTIONS, args.slice(1), TEST_PATH);
  // A full run may fetch its packages first; that stage runs no test.
  const fullShape = { test: testShape, setup: (args) => args[0] === 'pub' && args[1] === 'get' && args.slice(2).every((a) => a === '--offline') };

  // The tags one invocation leaves out, slow aside, as `-x` flags ('' for none), from its arguments after the
  // executable; null when it selects tests.
  function callExclusion(args) {
    const tags = [];
    for (let i = 1; i < args.length; i++) {
      const eq = args[i].startsWith('-') ? args[i].indexOf('=') : -1;
      const name = eq < 0 ? args[i] : args[i].slice(0, eq);
      if (SELECTS.has(name)) return null;
      if (name !== '-x' && name !== '--exclude-tags') continue;
      const value = eq < 0 ? args[++i] : args[i].slice(eq + 1);
      if (value !== 'slow') tags.push(value);
    }
    return tags.map((t) => `-x "${t}"`).join(' ');
  }

  function exclusionOf(command) {
    const read = h.invocationsOf(command, 'flutter', fullShape);
    if (read.why) return { unknown: true, why: read.why };
    const clauses = read.calls.map(callExclusion);
    if (clauses.includes(null)) return { unknown: true, why: 'its test run selects tests (-t, --tags or a name), so what it leaves out cannot be told' };
    if (new Set(clauses.map((c) => c.split(' -x ').sort().join(' -x '))).size > 1) return { unknown: true, why: 'its test runs leave out different tags' };
    return clauses[0] ? { known: true, clause: clauses[0] } : { none: true };
  }

  // One test() call labelled slow or not, from its own time, at the position the json reporter gave.
  function labelDartCall(source, line, column, slow) {
    const text = String(source);
    const offset = h.offsetAt(text, line, column);
    const next = offset < 0 ? null : (slow ? tagDartCall : untagDartCall)(text, offset);
    return next === null ? { text, found: false } : { text: next, found: true };
  }

  return {
    filesCommand({ files, exclude, stopSeconds }) {
      const list = Array.isArray(files) ? files : [];
      checkTestFiles(list);
      const stop = stopSeconds ? ` ${stopFlags(stopSeconds)}` : '';
      return [`flutter test${stop} ${list.map(h.quote).join(' ')}${exclude ? ' -x slow' : ''}`];
    },
    deltaTargets({ files }) {
      return { targets: (Array.isArray(files) ? files : []).map(String).filter((f) => TEST_FILE.test(f)), classes: {} };
    },
    timingCommand({ targets, exclusion = null }) {
      return [`flutter test --reporter json ${exclusion ? `${exclusion} ` : ''}${(Array.isArray(targets) ? targets : []).map(h.quote).join(' ')}`];
    },
    exclusionOf,
    stopFlags,
    joinExclusion(segment) {
      if (ALREADY_EXCLUDED.test(h.fold(segment))) return segment;
      return h.insertAfter(segment, INVOKE, ' -x slow');
    },
    joinStop(segment, seconds) {
      if (ALREADY_STOPPED.test(h.fold(segment))) return segment;
      return h.insertAfter(segment, INVOKE, ` ${stopFlags(seconds)}`);
    },
    failedTargets: () => [],
    commandShape: { test: testShape, setup: () => false },
    withReport: (command) => command.replace(/^flutter test(?=\s|$)/, 'flutter test --reporter json'),
    reportTimes: ({ tree, stdout }) => parseFlutterJson(stdout, tree).map((e) => ({ file: e.file, line: e.line, column: e.column, test: e.name, ms: e.ms })),
    labelSource({ file, source, tests, threshold, wanted, shifts, out }) {
      const located = tests.filter((t) => Number.isInteger(t.line));
      let text = source;
      for (const t of located) {
        const edit = labelDartCall(text, h.mapLine(shifts, t.line), t.column, t.ms >= threshold);
        if (!edit.found) out(`label-tests: ${file}:${t.line} — no test() call at the reported position, so no label was written\n`);
        text = edit.text;
      }
      text = h.reasonLines({ file, text, tests: located, threshold, wanted, shifts, out });
      return { text, slow: located.some((t) => t.ms >= threshold) };
    },
    // A project declares the tag its tests now carry, so `flutter test` does not warn on it.
    labelCompanions({ tree, files }) {
      return [...new Set(files.map((f) => projectOf(tree, f)).filter(Boolean))].map((project) => {
        const file = path.relative(tree, path.join(project, 'dart_test.yaml')).split(path.sep).join('/');
        return { file, merge: mergeDartTestYaml, refused: `${file} — its tags: is not a block map; add "slow: {}" under it by hand` };
      });
    },
    timingEntries: ({ stdout, tree }) => parseFlutterJson(stdout, tree),
    retagEdits({ tree, keys, tagged, meta, log }) {
      const isTagged = new Set(tagged);
      const allIn = (list) => list.length > 0 && list.every((k) => isTagged.has(k));
      const files = [...new Set(keys.map((k) => meta[k].file))];
      const edits = files.map((file) => {
        const inFile = keys.filter((k) => meta[k].file === file);
        return {
          file: path.join(tree, file),
          edit: (text) => retagDartKeeping(text, inFile.map((k) => ({ offset: h.offsetAt(String(text), meta[k].line, meta[k].column), slow: allIn([k]) }))),
        };
      });
      const taggedFiles = [...new Set(tagged.map((k) => meta[k].file))];
      const roots = new Set(taggedFiles.map((file) => h.projectDir(path.dirname(path.join(tree, file)), tree, (n) => n === 'pubspec.yaml')).filter(Boolean));
      for (const root of roots) {
        edits.push({
          file: path.join(root, 'dart_test.yaml'),
          optional: true,
          edit: (text) => {
            const merged = mergeDartTestYaml(text);
            if (merged === null) log(`${path.join(root, 'dart_test.yaml')}: tags is not a block map — add "slow: {}" under it by hand`);
            return { text: merged ?? text, missing: [] };
          },
        });
      }
      return edits;
    },
    untagSource: (text) => untagDartSource(text).text,
  };
}

module.exports = {
  runners: ['flutter'], contract: 1, create,
  parseFlutterJson, tagDartSource, untagDartSource, retagDartSource, mergeDartTestYaml,
};
