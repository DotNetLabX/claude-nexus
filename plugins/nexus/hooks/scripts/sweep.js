#!/usr/bin/env node
/**
 * Nexus sweep (F328). Run by hand — NOT a registered hook. It sits beside the step runner in the core
 * plugin's scripts folder.
 *
 *   sweep.js [--repo {tree}] [--exact-case] [--] {phrase} [{phrase}…]
 *   sweep.js --help
 *
 * Every file git lists for the whole tree — the git root of `--repo`, or of the current folder —
 * (tracked and untracked, ignored left out) is searched for each phrase as literal text whose words
 * may be split by a line break, a comment or quote prefix on the next line, or markdown emphasis and
 * code markers. Hits are grouped `tests/`, one group per plugin, `docs/`, then other, at most 200
 * printed per group, and a `test files:` line lists the distinct `tests/` files hit.
 *
 * git is looked up on PATH by absolute path, passing over the current folder, the repository and any
 * relative PATH entry, each compared as a real path once links and prefixes are resolved, and the
 * repository is found from the real start folder: a `git` planted in a checked-out tree never runs.
 *
 * Exit codes are the contract: 0 — it ran, hits or none; 2 — it could not run, and it printed
 * `sweep: cannot run — {why}`.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { findProgram, realPath } = require('./plan-check');

const USAGE = [
  'Usage:',
  '  sweep.js [--repo {tree}] [--exact-case] [--] {phrase} [{phrase}…]',
  '      every file that repeats or tests each phrase, grouped, with a `test files:` line',
  '  sweep.js --help',
].join('\n');

const MAX_PRINTED = 200;
const LINE_WIDTH = 160;
const MAX_BYTES = 2 * 1024 * 1024;
const BINARY_PROBE = 8 * 1024;

class CannotRun extends Error {}

function say(line) {
  process.stdout.write(`${line}\n`);
}

function fail(why) {
  throw new CannotRun(why);
}

function parseArgs(argv) {
  const opts = { repo: process.cwd(), exactCase: false, phrases: [] };
  let ended = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (ended) { if (a.trim()) opts.phrases.push(a.trim()); continue; }
    if (a === '--') ended = true;
    else if (a === '--exact-case') opts.exactCase = true;
    else if (a === '--repo' || a.startsWith('--repo=')) {
      const value = a === '--repo' ? argv[++i] : a.slice('--repo='.length);
      if (!value || value.startsWith('--')) fail('--repo was given with no value');
      opts.repo = value;
    } else if (a.startsWith('--')) fail(`unknown argument ${a}`);
    else if (a.trim()) opts.phrases.push(a.trim());
  }
  if (!opts.phrases.length) fail('no phrase given');
  return opts;
}

// Array form, shell false: no argument is ever re-read by a shell.
function git(root, ...args) {
  const program = findProgram('git', root);
  if (!program) fail('git is not on PATH outside the repository');
  const res = spawnSync(program, args, { cwd: root, encoding: 'utf8', shell: false, windowsHide: true, maxBuffer: 256 * 1024 * 1024 });
  if (res.error) fail(`git cannot run (${res.error.code})`);
  return res;
}

// The git root holding `dir` and every file git lists there.
function listFiles(dir) {
  let stat = null;
  try { stat = fs.statSync(dir); } catch { /* reported below */ }
  if (!stat || !stat.isDirectory()) fail(`--repo is not a directory: ${dir}`);
  const top = git(realPath(dir), 'rev-parse', '--show-toplevel');
  if (top.status !== 0 || !top.stdout.trim()) fail(`${dir} is not a git work tree`);
  const root = realPath(top.stdout.trim());
  const res = git(root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z');
  if (res.status !== 0) fail(`git ls-files failed (${(res.stderr || '').split(/\r?\n/)[0] || `exit ${res.status}`})`);
  return { root, files: [...new Set(res.stdout.split('\0').filter(Boolean))].sort() };
}

// A file's text, or null when it is skipped (binary, too large) or gone from the working tree.
function readText(root, rel, counts) {
  const full = path.join(root, rel);
  let size;
  try {
    const stat = fs.statSync(full);
    if (!stat.isFile()) return null;
    size = stat.size;
  } catch {
    return null;
  }
  if (size > MAX_BYTES) {
    counts.skipped += 1;
    return null;
  }
  let buf;
  try { buf = fs.readFileSync(full); } catch { return null; }
  if (buf.subarray(0, BINARY_PROBE).includes(0)) {
    counts.skipped += 1;
    return null;
  }
  return buf.toString('utf8');
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Between two words: spaces, emphasis and code markers, and a line break followed by a line-start
// comment or quote prefix (`//`, `#`, `>`, ` * `). Every character has exactly one way to match — the
// spaces inside BREAK only ever precede a prefix character INLINE cannot take — so a near miss over
// many indented lines fails in linear time instead of backtracking exponentially.
const INLINE = '[ \\t*_`]';
const BREAK = '\\r?\\n(?:[ \\t]*(?:\\/\\/+|#+|>(?:[ \\t]*>)*))?';
const BETWEEN = `(?:${INLINE}|${BREAK})+`;

function phraseRegex(phrase, exactCase) {
  return new RegExp(phrase.split(/\s+/).map(escape).join(BETWEEN), exactCase ? 'g' : 'gi');
}

function lineStarts(text) {
  const starts = [0];
  for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) starts.push(i + 1);
  return starts;
}

function lineIndex(starts, offset) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function groupOf(rel) {
  if (rel.startsWith('tests/')) return 'tests/';
  if (rel.startsWith('docs/')) return 'docs/';
  const m = /^plugins\/([^/]+)\//.exec(rel);
  return m ? `plugins/${m[1]}/` : 'other';
}

// The live groups first, so history never pushes them off the screen.
function groupRank(group) {
  if (group === 'tests/') return '0';
  if (group === 'docs/') return '2';
  if (group === 'other') return '3';
  return `1${group}`;
}

// One hit per line where a match starts.
function findHits(files, regex) {
  const hits = [];
  for (const { rel, text, starts, lines } of files) {
    regex.lastIndex = 0;
    const seen = new Set();
    for (let m = regex.exec(text); m; m = regex.exec(text)) {
      if (m[0] === '') { regex.lastIndex += 1; continue; }
      const idx = lineIndex(starts, m.index);
      if (seen.has(idx)) continue;
      seen.add(idx);
      hits.push({ rel, line: idx + 1, text: lines[idx].trim().slice(0, LINE_WIDTH) });
    }
  }
  return hits;
}

const plural = (n) => `${n} hit${n === 1 ? '' : 's'}`;

function report(phrase, hits) {
  say(`phrase: ${phrase} — ${plural(hits.length)}`);
  const groups = new Map();
  for (const hit of hits) {
    const g = groupOf(hit.rel);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(hit);
  }
  for (const g of [...groups.keys()].sort((a, b) => groupRank(a).localeCompare(groupRank(b)))) {
    const list = groups.get(g);
    say(`${g} — ${plural(list.length)}`);
    for (const hit of list.slice(0, MAX_PRINTED)) say(`${hit.rel}:${hit.line}: ${hit.text}`);
    if (list.length > MAX_PRINTED) say(`… ${list.length - MAX_PRINTED} more — narrow the phrase`);
  }
  const testFiles = [...new Set(hits.filter((h) => h.rel.startsWith('tests/')).map((h) => h.rel))].sort();
  say(`test files: ${testFiles.length ? testFiles.join(', ') : 'none'}`);
}

function main(argv) {
  if (argv[0] === '--help' || argv[0] === '-h') {
    say(USAGE);
    process.exit(0);
  }
  try {
    const opts = parseArgs(argv);
    const counts = { skipped: 0 };
    const files = [];
    const tree = listFiles(path.resolve(opts.repo));
    for (const rel of tree.files) {
      const text = readText(tree.root, rel, counts);
      if (text === null) continue;
      files.push({ rel, text, starts: lineStarts(text), lines: text.split('\n') });
    }
    say(`tree: ${tree.root}`);
    opts.phrases.forEach((phrase) => {
      say('');
      report(phrase, findHits(files, phraseRegex(phrase, opts.exactCase)));
    });
    say('');
    say(`skipped: ${counts.skipped} file${counts.skipped === 1 ? '' : 's'} (binary or over 2 MB)`);
    process.exit(0);
  } catch (err) {
    const why = err instanceof CannotRun ? err.message : `unexpected error: ${String(err && err.message || err).split(/\r?\n/)[0]}`;
    say(`sweep: cannot run — ${why}`);
    process.exit(2);
  }
}

main(process.argv.slice(2));
