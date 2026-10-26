'use strict';
/**
 * The node runner, built into the core: `node --test`. Written to the contract in ../test-runners.js.
 *
 * Its slow label is the ` @slow` suffix on a test call's name literal, found at the position a reporter gave
 * (never by searching for a name). The per-test stops and the fast/slow legs a node run splits into are the
 * core's own (../compose-test-command.js `nodeLegs`), not this file's.
 *
 * In a full run whose declared command is a chain, a direct `node --test` stage gets the core events reporter
 * beside its own reporters; the run names the events file in the stage's folder (NEXUS_TEST_EVENTS), and
 * this runner reads it there as one leg (../test-events.js). A full role that is one `node --test` stage runs
 * as the core's legs instead.
 */
const fs = require('fs');
const path = require('path');
const { fileURLToPath, pathToFileURL } = require('url');
const { readTestEvents } = require('../test-events');

const SLOW_SUFFIX = ' @slow';
const TEST_FILE = /\.test\.(mjs|js|cjs)$/;
const SOURCE = /\.(js|mjs|cjs|ts|mts|cts|jsx|tsx)$/;
const ALREADY_EXCLUDED = /--test-skip-pattern[= ]@slow(\s|$)/;
// The core's events reporter: the one reporter outside the built-in ones a red run's output is read under.
const REPORTER_URL = pathToFileURL(path.join(__dirname, '..', 'test-reporter.mjs')).href;

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

function lineOffset(text, line, column) {
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
    const offset = lineOffset(text, line, column);
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

// Every call-shaped tag in a file stripped, never written: a changed-files timing pass compares two
// versions of a file with it.
function untagNodeSource(source) {
  const text = String(source);
  const cuts = new Set();
  for (const m of text.matchAll(/\b(?:describe|suite|it|test)\b/g)) {
    const literal = callLiteral(text, m.index);
    if (literal && text.slice(literal.close - SLOW_SUFFIX.length, literal.close) === SLOW_SUFFIX) cuts.add(literal.close - SLOW_SUFFIX.length);
  }
  let out = text;
  for (const at of [...cuts].sort((a, b) => b - a)) out = out.slice(0, at) + out.slice(at + SLOW_SUFFIX.length);
  return out;
}

function relativeFile(file, tree) {
  const rel = file ? path.relative(tree, String(file)) : '';
  const inside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  return String(inside ? rel : file).replace(/\\/g, '/');
}

const stripTag = (name) => String(name).replace(/ @slow$/, '');

// One record per line from the timing pass's reporter. A describe record is kept as a block location,
// never timed: the key is `file::{chain > name}` with every segment's tag stripped, so it survives tagging.
function parseReporterRecords(text, tree) {
  const entries = [];
  for (const line of String(text).split(/\r?\n/)) {
    let r;
    try { r = JSON.parse(line); } catch { continue; }
    if (!r || !r.file) continue;
    const file = relativeFile(r.file, tree);
    const segments = [...(Array.isArray(r.chain) ? r.chain : []), r.name].map(stripTag);
    entries.push({
      kind: r.kind === 'describe' ? 'describe' : 'test',
      key: `${file}::${segments.join(' > ')}`,
      file,
      line: r.line,
      column: r.column,
      name: segments[segments.length - 1],
      chain: segments.slice(0, -1),
      ms: Number(r.duration_ms),
    });
  }
  return entries;
}

// A describe is tagged when every test under it is tagged, choosing the outermost such block, so a
// tagged block's own tests keep their names. Every measured call gets the state it should end in.
function nodeEdits(keys, tagged, meta, blocks) {
  const isTagged = new Set(tagged);
  const byFile = new Map();
  const want = (entry, slow) => {
    if (!byFile.has(entry.file)) byFile.set(entry.file, new Map());
    const calls = byFile.get(entry.file);
    const at = `${entry.line}:${entry.column}`;
    calls.set(at, { line: entry.line, column: entry.column, slow: slow || Boolean(calls.get(at) && calls.get(at).slow) });
  };
  for (const k of keys) want(meta[k], false);
  for (const block of blocks.values()) want(block, false);
  for (const key of tagged) {
    const entry = meta[key];
    const inFile = keys.filter((k) => meta[k].file === entry.file);
    let block = null;
    for (let depth = 1; depth <= entry.chain.length && !block; depth++) {
      const prefix = entry.chain.slice(0, depth);
      const under = inFile.filter((k) => prefix.every((s, i) => meta[k].chain[i] === s));
      if (under.every((k) => isTagged.has(k))) block = blocks.get(`${entry.file}::${prefix.join(' > ')}`) || null;
    }
    want(block || entry, true);
  }
  return [...byFile].map(([file, calls]) => ({ file, calls: [...calls.values()] }));
}

// The spec reporter's `test at {file}:{line}:{col}` and the TAP reporter's `location: '{file}:…'`.
const FAILURE = /(?:^\s*test at |location:\s*')(.+?):\d+:\d+/gm;
// A failed test's line in the spec reporter (`✖ name`) and in TAP (`not ok n - name`).
const FAILURE_LINE = /^\s*(?:✖\s|not ok\b)/;
// The events file a full-run stage's reporter writes in its folder; the run names it in NEXUS_TEST_EVENTS.
const RUN_EVENTS = 'node-events.jsonl';

const VALUE = () => true;
const oneOf = (...allowed) => (v) => allowed.includes(v);
// A reporter outside the built-in ones is a module that runs code and owns the output read here; the core's
// own events reporter writes only its events file.
const TEST_OPTIONS = new Map([
  ['--test-concurrency', VALUE], ['--test-reporter', oneOf('spec', 'tap', 'dot', 'junit', 'lcov', REPORTER_URL)],
  ['--test-reporter-destination', VALUE], ['--test-timeout', VALUE], ['--test-force-exit', null], ['--test-name-pattern', VALUE],
  ['--test-skip-pattern', VALUE], ['--test-only', null], ['--experimental-test-coverage', null], ['--no-warnings', null],
]);
// The options a run selects tests by: with one, what the run leaves out is everything it did not select.
const SELECTS = new Set(['--test-name-pattern', '--test-only']);

function create(h) {
  const slashes = (p) => String(p).replace(/\\/g, '/');
  const relTo = (repo, f) => slashes(path.relative(repo, path.resolve(repo, slashes(f))));
  const exists = (repo, rel) => { try { return fs.statSync(path.join(repo, rel)).isFile(); } catch { return false; } };

  function checkTestFiles(files) {
    for (const f of files) if (!TEST_FILE.test(String(f))) throw new Error(`filesCommand: ${f} is not a node test file`);
  }

  function filesCommand({ files, exclude }) {
    const list = Array.isArray(files) ? files : [];
    checkTestFiles(list);
    return [`node --test ${exclude ? '--test-skip-pattern "@slow" ' : ''}${list.map(h.quote).join(' ')}`];
  }

  // listed options only before `--test`; after it listed options, then file and glob arguments only.
  function argsListed(args) {
    const at = args.indexOf('--test');
    if (at < 0) return false;
    let i = 0;
    while (i < at) {
      i = h.optionEnd(TEST_OPTIONS, args, i);
      if (i < 0) return false;
    }
    for (i = at + 1; i < args.length && args[i].startsWith('-');) {
      i = h.optionEnd(TEST_OPTIONS, args, i);
      if (i < 0) return false;
    }
    return args.slice(i).every((a) => !a.startsWith('-'));
  }
  const shape = { test: argsListed, setup: () => false, options: TEST_OPTIONS };

  // A changed test file is its own target, and a changed source ties to every test file whose base name is
  // the source's (src/foo.js → tests/unit/foo.test.mjs).
  function tiedSet({ repo, changed, listing }) {
    const tests = listing.map(slashes).filter((f) => TEST_FILE.test(f) && !h.isExcluded(f));
    const stem = (f, re) => path.posix.basename(f).replace(re, '');
    const targets = new Set();
    const untied = [];
    for (const f of changed) {
      const hits = TEST_FILE.test(f) ? [f] : SOURCE.test(f) ? tests.filter((t) => stem(t, TEST_FILE) === stem(f, SOURCE)) : [];
      const live = hits.filter((t) => exists(repo, t));
      if (live.length === 0) untied.push(f);
      for (const t of live) targets.add(t);
    }
    const sorted = [...targets].sort();
    return { targets: sorted, untied, commands: untied.length ? [] : filesCommand({ files: sorted, exclude: false }) };
  }

  // A full-run stage this runner owns: a direct `node … --test` run in its listed shape — a `--test` inside an
  // option's value, or after a script, is no test run. The core reporter joins the stage's own reporters (or
  // `spec` on stdout where it names none), each own reporter keeping its destination.
  function withRunReport(stage) {
    const s = String(stage);
    if (!h.invocationsOf(s, 'node', shape).calls || s.includes(REPORTER_URL)) return s;
    const reporters = (s.match(/(^|\s)--test-reporter(?=[\s=])/g) || []).length;
    const destinations = (s.match(/(^|\s)--test-reporter-destination(?=[\s=])/g) || []).length;
    const own = reporters ? Array.from({ length: Math.max(0, reporters - destinations) }, () => ' --test-reporter-destination=stdout').join('') : ' --test-reporter=spec --test-reporter-destination=stdout';
    const added = `${own} --test-reporter="${REPORTER_URL}" --test-reporter-destination=stderr`;
    // Node pairs reporters and destinations by their order, so the core's pair goes after the stage's own.
    const last = [...s.matchAll(/(^|\s)--test-reporter(?:-destination)?(?:=(?:"[^"]*"|\S+)|\s+(?:"[^"]*"|\S+))/g)].at(-1);
    if (!last) return h.insertAfter(s, /(^|\s)--test(?=\s|$)/, added);
    const at = last.index + last[0].length;
    return s.slice(0, at) + added + s.slice(at);
  }

  // One stage's events, from its own folder: one leg, ended once its reporter wrote `run-end`.
  function readRunResults({ tree, dir, cwd }) {
    let text = '';
    try { text = fs.readFileSync(path.join(dir, RUN_EVENTS), 'utf8'); } catch { /* the stage never reported */ }
    const read = readTestEvents(text, { legs: 1, tree });
    const seen = read.complete ? [...read.failed_tests, ...read.timed_out] : read.failures_partial;
    const failed = seen.filter((t) => !t.cause);
    const project = {
      project: slashes(path.relative(tree, path.resolve(cwd || tree))) || '.', runner: 'node', ms: 0,
      state: read.complete ? 'finished' : 'unfinished', failed: failed.length, passed: read.test_times.length,
    };
    return { failed_tests: failed, timed_out: seen.filter((t) => t.cause), projects: [project], complete: read.complete, explained: read.complete, stuck: [], copies: [] };
  }

  return {
    filesCommand,
    withRunReport,
    readRunResults,
    failureLines: (text) => String(text || '').split(/\r?\n/).filter((l) => FAILURE_LINE.test(l)),
    deltaTargets({ files }) {
      return { targets: (Array.isArray(files) ? files : []).map(String).filter((f) => TEST_FILE.test(f)), classes: {} };
    },
    timingCommand({ targets, tmp, n, reporter, exclusion = null }) {
      if (!reporter) throw new Error('timingCommand: node needs a reporter module');
      const list = Array.isArray(targets) ? targets : [];
      const dir = String(tmp).replace(/\\/g, '/');
      return [`node --test ${exclusion ? `${exclusion} ` : ''}--test-reporter=${h.quote(reporter)} --test-reporter-destination=${h.quote(`${dir}/${n}.jsonl`)} ${list.map(h.quote).join(' ')}`];
    },
    exclusionOf(command) {
      const read = h.invocationsOf(command, 'node', shape);
      if (read.why) return { unknown: true, why: read.why };
      const clauses = [];
      for (const args of read.calls) {
        const patterns = [];
        for (let i = 0; i < args.length; i++) {
          const eq = args[i].startsWith('-') ? args[i].indexOf('=') : -1;
          const name = eq < 0 ? args[i] : args[i].slice(0, eq);
          if (SELECTS.has(name)) return { unknown: true, why: `its node --test run selects tests (${name}), so what it leaves out cannot be told` };
          if (name !== '--test-skip-pattern') continue;
          const value = eq < 0 ? args[++i] : args[i].slice(eq + 1);
          if (value !== '@slow') patterns.push(value);
        }
        clauses.push(patterns.map((p) => `--test-skip-pattern "${p}"`).join(' '));
      }
      if (new Set(clauses).size > 1) return { unknown: true, why: 'its node --test runs skip different tests' };
      return clauses[0] ? { known: true, clause: clauses[0] } : { none: true };
    },
    stopFlags: (seconds) => `--test-timeout=${seconds * 1000} --test-force-exit`,
    joinExclusion(segment) {
      if (ALREADY_EXCLUDED.test(h.fold(segment))) return segment;
      return h.insertAfter(segment, /(^|\s)--test(?=\s|$)/, ' --test-skip-pattern "@slow"');
    },
    joinStop: (segment) => segment,
    tiedSet,
    failedTargets({ output, repo }) {
      const found = [];
      for (const m of String(output || '').matchAll(FAILURE)) {
        let file = m[1];
        if (/^file:/.test(file)) { try { file = fileURLToPath(file); } catch { return null; } }
        const rel = relTo(repo, file);
        if (rel.startsWith('../') || !TEST_FILE.test(rel) || !exists(repo, rel)) return null;
        if (!found.includes(rel)) found.push(rel);
      }
      return found;
    },
    commandShape: shape,
    // A test run several times at one source position (a loop) is one literal: it takes its slowest run, so it
    // is slow when any run is at or over the line.
    labelSource({ file, source, tests, threshold, wanted, shifts, out }) {
      const slowest = new Map();
      for (const t of tests.filter((x) => Number.isInteger(x.line))) {
        const key = `${t.line}:${t.column}`;
        if (!slowest.has(key) || t.ms > slowest.get(key).ms) slowest.set(key, t);
      }
      const located = [...slowest.values()];
      const tagged = retagNodeSource(source, located.map((t) => ({ line: h.mapLine(shifts, t.line), column: t.column, slow: t.ms >= threshold })));
      for (const where of tagged.missing) out(`label-tests: ${file} ${where} — the test's name is not a literal, so no label was written\n`);
      const text = h.reasonLines({ file, text: tagged.text, tests: located, threshold, wanted, shifts, out });
      return { text, slow: located.some((t) => t.ms >= threshold) };
    },
    timingEntries({ dir, n, tree }) {
      const records = path.join(dir, `${n}.jsonl`);
      return fs.existsSync(records) ? parseReporterRecords(fs.readFileSync(records, 'utf8'), tree) : [];
    },
    retagEdits({ tree, keys, tagged, meta, blocks }) {
      return nodeEdits(keys, tagged, meta, blocks).map(({ file, calls }) => ({
        file: path.join(tree, file), edit: (text) => retagNodeSource(text, calls),
      }));
    },
    untagSource: untagNodeSource,
  };
}

module.exports = {
  runners: ['node'], contract: 1, create,
  SLOW_SUFFIX, REPORTER_URL, callLiteral, retagNodeSource, untagNodeSource, parseReporterRecords,
};
