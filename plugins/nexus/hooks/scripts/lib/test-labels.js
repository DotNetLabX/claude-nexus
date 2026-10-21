'use strict';
/**
 * The slow-label writers and the report readers for node, .NET and Flutter tests. label-tests.js (the step
 * close's labeller), verify-run.js (which times a step close's tests) and the whole-suite tagging tool all
 * go through these; a plugin that needs them ships a byte-identical copy of this file.
 *
 * Node: the ` @slow` suffix on a test call's name literal, found at the position a reporter gave (never by
 * searching for a name). .NET: `[Trait("Speed", "Slow")]` on a class or a test method. Flutter: `tags:
 * ['slow']` on a `test()`/`testWidgets()` call, `@Tags(['slow'])` on a whole file, `slow: {}` in
 * dart_test.yaml. A test kept slow carries its reason as a `// slow: {reason}` comment on the line above.
 *
 * The readers turn a .trx report (parseTrx) and a `flutter test --reporter json` stream (parseFlutterJson)
 * into timed tests, executed ones only. dotnetClassFile maps a timed .NET class to its source file through
 * its test project; it is the one function here that reads the tree. Nothing here writes or spawns.
 */
const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');
const { parseClasses } = require('./compose-test-command');

const SLOW_SUFFIX = ' @slow';
const REASON = /^(\s*)\/\/ slow: .*$/;

// ── node ──────────────────────────────────────────────────────────────────────────────────────────────

// The index of the quote closing the literal that opens at `open`, escapes skipped and never
// evaluated; -1 when the literal does not close.
function closeQuote(text, open) {
  const quote = text[open];
  for (let i = open + 1; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\') i++;
    else if (ch === quote) return i;
    else if (quote === '`' && ch === '$' && text[i + 1] === '{') { i = closeSubstitution(text, i + 2); if (i < 0) return -1; }
  }
  return -1;
}

function closeSubstitution(text, from) {
  let depth = 1;
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') { i = closeQuote(text, i); if (i < 0) return -1; }
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i;
  }
  return -1;
}

// The first argument of the call whose callee starts at `offset` — the reporter's column, which for
// `test.skip(` is the member name — when that argument is a string or template literal.
function callLiteral(text, offset) {
  const call = text.slice(offset, offset + 200).match(/^[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*\s*\(\s*/);
  if (!call) return null;
  const open = offset + call[0].length;
  if (!["'", '"', '`'].includes(text[open])) return null;
  const close = closeQuote(text, open);
  return close < 0 ? null : { open, close };
}

function offsetAt(text, line, column) {
  let offset = 0;
  for (let l = 1; l < line; l++) {
    offset = text.indexOf('\n', offset) + 1;
    if (offset === 0) return -1;
  }
  return offset + column - 1;
}

// `calls` are reporter positions, each with the state it should end in. Applied bottom-up, so no
// edit moves a position still to come; a call that should be slow but whose first argument is not a
// literal comes back as missing.
function retagNodeSource(source, calls) {
  let text = String(source);
  const missing = [];
  for (const { line, column, slow } of [...calls].sort((a, b) => b.line - a.line || b.column - a.column)) {
    const offset = offsetAt(text, line, column);
    const literal = offset < 0 ? null : callLiteral(text, offset);
    if (!literal) {
      if (slow) missing.push(`line ${line}:${column}`);
      continue;
    }
    const tagged = text.slice(literal.close - SLOW_SUFFIX.length, literal.close) === SLOW_SUFFIX;
    if (slow && !tagged) text = text.slice(0, literal.close) + SLOW_SUFFIX + text.slice(literal.close);
    else if (!slow && tagged) text = text.slice(0, literal.close - SLOW_SUFFIX.length) + text.slice(literal.close);
  }
  return { text, missing };
}

// The reason a test is kept slow, as the comment on the line above `line`: replaced where one is there,
// inserted (at that line's indent) where none is. `delta` is the lines the edit added. The comment form is
// the same in all three languages.
function setNodeReason(source, line, reason) {
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
function clearNodeReason(source, line) {
  const lines = String(source).split('\n');
  if (line < 2 || line > lines.length || !REASON.test(lines[line - 2].replace(/\r$/, ''))) return { text: String(source), delta: 0 };
  lines.splice(line - 2, 1);
  return { text: lines.join('\n'), delta: -1 };
}

// ── report readers ────────────────────────────────────────────────────────────────────────────────────

// trx attribute values are read as written: the fields used (ids, a class and method name, a
// codeBase path, a duration) carry nothing XML escapes.
function attributes(text) {
  const out = {};
  for (const m of String(text).matchAll(/([\w:-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

function relativeFile(file, tree) {
  const rel = file ? path.relative(tree, String(file)) : '';
  const inside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  return String(inside ? rel : file).replace(/\\/g, '/');
}

function trxDurationMs(text) {
  const m = String(text).match(/^(\d+):(\d+):(\d+)(?:\.(\d+))?$/);
  if (!m) return 0;
  const [, h, min, s, frac = ''] = m;
  return (Number(h) * 3600 + Number(min) * 60 + Number(s)) * 1000 + Number(frac.padEnd(7, '0').slice(0, 7)) / 10000;
}

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

// ── .NET source resolution (reads the tree) ───────────────────────────────────────────────────────────

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

function projectDir(fromDir, tree, marker) {
  for (let dir = fromDir; insideTree(tree, dir) || path.resolve(dir) === path.resolve(tree); dir = path.dirname(dir)) {
    let names = [];
    try { names = fs.readdirSync(dir); } catch { /* a build output that is gone */ }
    if (names.some(marker)) return dir;
    if (path.resolve(dir) === path.resolve(tree)) break;
  }
  return null;
}

// The source file declaring the class `short` in the test project above `codeBase` (the test assembly's
// path), or null. `cache` keeps one class index per project across calls.
function dotnetClassFile(tree, codeBase, short, cache = new Map()) {
  const project = projectDir(path.dirname(codeBase), tree, (n) => n.endsWith('.csproj'));
  if (!project) return null;
  if (!cache.has(project)) {
    const index = new Map();
    for (const f of sourceFiles(project, '.cs')) {
      for (const c of parseClasses(fs.readFileSync(f, 'utf8'))) if (!index.has(c)) index.set(c, f);
    }
    cache.set(project, index);
  }
  return cache.get(project).get(short) || null;
}

// ── .NET labels ───────────────────────────────────────────────────────────────────────────────────────

const TRAIT = '[Trait("Speed", "Slow")]';
const HAS_TRAIT = /Trait\(\s*"Speed"\s*,\s*"Slow"\s*\)/;
const TRAIT_LINE = /^\s*\[Trait\(\s*"Speed"\s*,\s*"Slow"\s*\)\]\s*\r?$/;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function insertAttribute(lines, declIndex) {
  let top = declIndex;
  while (top > 0 && /^\s*\[/.test(lines[top - 1])) top--;
  if (lines.slice(top, declIndex).some((l) => HAS_TRAIT.test(l))) return false;
  const indent = lines[declIndex].match(/^\s*/)[0];
  lines.splice(top, 0, `${indent}${TRAIT}${lines[declIndex].endsWith('\r') ? '\r' : ''}`);
  return true;
}

const classIndex = (lines, name) => lines.findIndex((l) => new RegExp(`\\bclass\\s+${escapeRegex(name)}\\b`).test(l));
const methodDecl = (method) => new RegExp(`\\b(?:void|Task|ValueTask)(?:<[^>]*>)?\\s+${escapeRegex(method)}\\s*\\(`);

function methodIndex(lines, className, method) {
  const from = classIndex(lines, className);
  return from < 0 ? -1 : lines.findIndex((l, i) => i > from && methodDecl(method).test(l));
}

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
  while (top > 0 && /^\s*\[/.test(lines[top - 1])) top--;
  return top + 1;
}

// One test method labelled slow or not, from its own time: the method's own Trait is added or removed; a
// class-level Trait is never touched.
function labelDotnetMethod(source, className, method, slow) {
  const lines = String(source).split('\n');
  const at = methodIndex(lines, className, method);
  if (at < 0) return { text: String(source), found: false };
  if (slow) insertAttribute(lines, at);
  else {
    for (let i = at - 1; i >= 0 && /^\s*\[/.test(lines[i]); i--) if (TRAIT_LINE.test(lines[i])) lines.splice(i, 1);
  }
  return { text: lines.join('\n'), found: true };
}

// ── Flutter labels ────────────────────────────────────────────────────────────────────────────────────

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

// One test() call labelled slow or not, from its own time, at the position the json reporter gave.
function labelDartCall(source, line, column, slow) {
  const text = String(source);
  const offset = offsetAt(text, line, column);
  const next = offset < 0 ? null : (slow ? tagDartCall : untagDartCall)(text, offset);
  return next === null ? { text, found: false } : { text: next, found: true };
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

// `calls` carry the lines the run reported, i.e. before the strip.
function retagDartSource(source, { wholeFile, calls }) {
  const stripped = untagDartSource(source);
  const spec = wholeFile
    ? { fileLevel: true, calls: [] }
    : { fileLevel: false, calls: calls.map((c) => ({ ...c, line: c.line - stripped.shift })) };
  return tagDartSource(stripped.text, spec);
}

// The project root above a Dart test file: where its dart_test.yaml belongs.
function dartProjectDir(tree, file) {
  return projectDir(path.dirname(path.resolve(tree, file)), tree, (n) => n === 'pubspec.yaml');
}

module.exports = {
  SLOW_SUFFIX, callLiteral, retagNodeSource, setNodeReason, clearNodeReason,
  relativeFile, parseTrx, parseFlutterJson,
  insideTree, sourceFiles, projectDir, dotnetClassFile, dartProjectDir,
  tagDotnetSource, untagDotnetSource, dotnetMethodLine, dotnetReasonLine, labelDotnetMethod,
  tagDartSource, untagDartSource, retagDartSource, labelDartCall, mergeDartTestYaml,
};
