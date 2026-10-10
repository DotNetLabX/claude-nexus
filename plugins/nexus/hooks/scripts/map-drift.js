#!/usr/bin/env node
/**
 * Nexus architecture-map drift meter (F93). Manually invoked — NOT a registered hook, so there is
 * no hooks.json entry (unregistered-script precedent: anchor-check.js, salvage-transcript.js). The
 * session-start payload's resolved-plugin-paths block carries its absolute path, because
 * ${CLAUDE_PLUGIN_ROOT} does not expand in markdown and no agent file can name it otherwise.
 *
 * Why it exists: the architecture map (docs/architecture-map/, the sixth registry species) was the
 * only navigation surface in the estate with no freshness gate at all — measured going 790 commits
 * and 597 source files stale in four weeks while every sibling layer had one. This is the METER:
 * it prints how many map rows cite code that has changed since the map was mined, and that is all
 * it does. It is read-only, it takes seconds, and it never blocks a close unless the repo itself
 * asked it to.
 *
 * Exit codes are the contract:
 *   0 — every case but one, including every failure of its own: no map, an unstamped map, a basis
 *       that does not resolve, no git, a broken diff. A meter that cannot measure says so and
 *       skips; it never turns its own fault into someone's blocked close.
 *   1 — ONLY when rows cite changed files AND the repo declares `Map cadence: per-merge` in
 *       docs/conventions/anchored-set.md. There is deliberately no flag that forces this: an
 *       override would be a block with no declaration behind it. Default cadence is `milestone`,
 *       under which this script can never exit non-zero.
 *
 * Root resolution: `--repo <root>` when given, else CLAUDE_PROJECT_DIR, else cwd (estate
 * convention; bare cwd breaks worktree sessions). Only an explicitly passed `--repo` is validated —
 * an ambient env var that points nowhere degrades to "no map here", like anchor-check.js.
 * Node, zero third-party deps. Compares the basis against the WORKING TREE, not HEAD: the
 * close-gate moment precedes the closure commit, so uncommitted work is exactly what it must see.
 *
 * FOUR DISCLOSED LIMITS. The first three are not solvable by a better regex; the fourth is
 * solvable and is deliberately not solved here:
 *
 *  1. A path that legitimately contains a space (`lib/my file.dart`) cannot be told apart from a
 *     cite followed by prose. The boundary rule prefers the cite reading, so `lib/a.dart backup`
 *     counts as a cite of `lib/a.dart`. Over-counting a cite is the safe direction here.
 *  2. A row is one physical LINE. mine-architecture pins one row per line as a binding prompt
 *     obligation, but that pin is prompt-only, so a wrapped row counts as two. The error is
 *     one-directional: wrapping can only OVERCOUNT N, never miss a cite, never undercount, and
 *     never turn 0 into non-zero (M is per distinct changed file, unaffected by line structure).
 *     Since the opt-in block fires on N > 0 rather than magnitude, wrapping cannot cause a spurious
 *     block. If an estate ever shows real wrapping, a reader-side join is the fix.
 *  3. A repo declaring neither an anchored-set manifest nor `Source roots:` gets the coarse meter
 *     (whole repo minus docs/) and no existence tier at all. A cited file that was renamed away or
 *     deleted is the existence tier's question, and anchor-check.js owns that one.
 *  4. The delimiter allow-list (OPEN/CLOSE below) errs toward UNDER-counting. A cite is recognised
 *     only when the characters around it are on those lists, so a citation shape nobody listed is
 *     missed — measured: a markdown autolink `<lib/a.dart>`, a brace-wrapped `{lib/a.dart}`, and a
 *     directory cite `lib/widgets/` each count zero. This is the opposite direction from limit 1,
 *     and the less safe one: an over-counted cite is noise, but an uncounted cite reads as a fresh
 *     map. The lists are the ratified contract and are deliberately NOT widened here, so a map
 *     written in one of those shapes reads low until that contract changes.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const MAP_DIR_REL = 'docs/architecture-map';
const INDEX_REL = `${MAP_DIR_REL}/index.md`;
const MANIFEST_REL = 'docs/conventions/anchored-set.md';

// The basis stamp: `Basis: {sha}` in the index preamble, written by every mine-architecture run.
// Unlike anchor-check.js's `Source roots:`, a missing or malformed declaration here is NEVER a
// config error — a map written before this line existed is not a broken map, it is an older map.
const BASIS_RE = /^\s*[Bb]asis:\s*`?([0-9a-f]{7,40})`?(?![0-9A-Za-z])/;

// The boundary rule is a delimiter ALLOW-list, and must be. anchor-check.js states its boundary as
// a deny-list of path characters because it opens an UNKNOWN path out of arbitrary text; here the
// path is known exactly (git produced it) and the only question is whether the neighbours extend
// it. A deny-list fails that job on both sides: a filename may legally contain a space, an `@` or a
// non-ASCII letter, so `lib/a.dart@old` and `elib/a.dart` would both match a changed `lib/a.dart`.
const OPEN = new Set([' ', '\t', '`', '"', "'", '(', '[', '*', '|']);
const CLOSE = new Set([' ', '\t', '`', '"', "'", ')', ']', '*', '|', ',', ';']);

try {
  main();
} catch (err) {
  // Row 10, the catch-all: any failure at all is a skip with a one-line reason. The meter never
  // throws and never blocks on its own fault.
  skip(oneLine(err));
}

function main() {
  const root = resolveRoot();

  // Probe order is contract — the rows overlap, so stop at the first that fires. Existence is not
  // readability: existsSync passes on a directory and the read then throws EISDIR.
  const indexPath = path.join(root, ...INDEX_REL.split('/'));
  if (!fs.existsSync(indexPath)) process.exit(0);            // no map here — silent, no behavior change
  let indexText;
  try {
    indexText = fs.readFileSync(indexPath, 'utf8');
  } catch (err) {
    skip(`cannot read ${INDEX_REL} (${err.code || 'unreadable'})`);
  }

  // Before the basis probe, deliberately: a non-repository whose map has no basis reports "not a
  // git repository", which is the actionable half of its two problems.
  if (git(root, 'rev-parse', '--git-dir').status !== 0) skip('not a git repository');

  const basis = parseBasis(indexText);
  if (!basis) skip('basis not stamped — re-run the mine to stamp one');

  // `{sha}^{commit}` — and this is why every git call below goes through the array form.
  if (git(root, 'cat-file', '-e', `${basis}^{commit}`).status !== 0) {
    skip(`basis ${basis} is not in this repo`);
  }

  const headRes = git(root, 'rev-parse', 'HEAD');
  if (headRes.status !== 0) skip('HEAD does not resolve');
  const head = headRes.stdout.trim();

  const changed = changedFiles(root, basis, scopeArgs(root));
  const { rows, perFile } = countCites(root, changed);

  // The label names the WORKING TREE, not HEAD, because that is what was compared: with basis ==
  // HEAD the diff still reports tracked working-tree changes, so a `basis {sha} -> HEAD {sha}`
  // label would print two identical shas beside a non-zero count. HEAD's sha stays only to locate
  // the tree in history.
  // The clean case names no file count: there is no set of changed files being reported on, so
  // "0 rows cite 0 changed files" would invite the reading that nothing changed at all — when what
  // is true is that nothing the map cites changed.
  const scale = rows.size === 0 ? '0 rows cite changed files' : `${rows.size} rows cite ${perFile.size} changed files`;
  say(`map-drift: ${scale} (basis ${basis.slice(0, 7)} → working tree at ${head.slice(0, 7)})`);
  for (const p of [...perFile.keys()].sort()) say(`  ${p} — ${perFile.get(p)} row(s)`);

  if (rows.size > 0 && cadence(root) === 'per-merge') {
    say('map-drift: refresh required — this repo declares Map cadence: per-merge.');
    process.exit(1);
  }
  process.exit(0);
}

function resolveRoot() {
  // Both spellings: `--repo {path}` and `--repo={path}`. Accepting only the first silently ignored
  // the second and fell through to cwd, which on a drifted repo prints NOTHING (row 1) — a caller
  // would record "no map here" for a map that is stale.
  const argv = process.argv;
  const i = argv.indexOf('--repo');
  const eq = argv.find((a) => a.startsWith('--repo='));
  if (i === -1 && !eq) return process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const given = i !== -1 ? argv[i + 1] : eq.slice('--repo='.length);
  if (!given) skip('--repo was given with no path');
  let stat = null;
  try { stat = fs.statSync(given); } catch { /* missing — reported just below */ }
  if (!stat || !stat.isDirectory()) skip(`--repo path is not a directory: ${given}`);
  return given;
}

// EVERY git call goes through here, in the array form with shell false. Measured: a shell-string
// `git cat-file -e {sha}^{commit}` loses its caret to cmd.exe on Windows (`fatal: Not a valid
// object name {sha}{commit}`) while the array form exits 0. Built the wrong way this meter reports
// every stamped map as unstamped, silently and permanently — and rows 2 and 3 become
// indistinguishable from a map nobody ever stamped. Sibling scripts here use the shell-string form
// for non-git commands, so the wrong precedent is close to hand.
function git(root, ...args) {
  // maxBuffer raised off the 1 MiB default: a badly stale map is the motivating case, and tens of
  // thousands of NUL-separated paths clear 1 MiB. Overflow is handled in collect(), not here.
  return spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// The region before the first `## ` heading — the same preamble contract anchor-check.js applies to
// `Source roots:` (`:38-41`), so a declaration that drifted below a heading is not silently read.
function preamble(text) {
  // Fences are stripped FIRST, so a `Basis:` or `Map cadence:` line inside an illustrative code
  // block is not read as a live declaration (and a `## ` inside one cannot end the preamble). The
  // strip preserves line count, so the slice below still lines up with the source.
  const lines = stripFences(text).split(/\r?\n/);
  const firstHeading = lines.findIndex((l) => /^##\s/.test(l));
  return firstHeading === -1 ? lines : lines.slice(0, firstHeading);
}

function parseBasis(text) {
  for (const line of preamble(text)) {
    const m = BASIS_RE.exec(line);
    if (m) return m[1];
  }
  return null;
}

// `Source roots:` scopes the diff when declared. It is not dropped when absent: the map's
// rule-coverage field embeds registry paths, so an unscoped diff would report registry churn as map
// drift on most closes.
function scopeArgs(root) {
  let roots = [];
  try {
    const line = preamble(fs.readFileSync(path.join(root, ...MANIFEST_REL.split('/')), 'utf8'))
      .find((l) => /^\s*Source roots:/i.test(l));
    if (line) {
      roots = line.replace(/^\s*Source roots:/i, '').split(',')
        .map((s) => s.replace(/`/g, '').trim()).filter(Boolean);
    }
  } catch { /* no manifest, or unreadable — the fallback below is the answer, never an error */ }
  return roots.length > 0 ? roots : ['.', ':(exclude)docs/'];
}

// Two commands, not one — a plain diff misses two classes that matter here.
function changedFiles(root, basis, scope) {
  const set = new Set();
  // `-z` because git C-quotes any non-ASCII or control byte otherwise (`lib/café.dart` ->
  // `"lib/caf\303\251.dart"`), and NUL removes newline ambiguity. `--no-renames` because rename
  // detection is on by default and reports only the NEW path, so a cited file renamed away would
  // never appear and its broken citation would read as no drift. No `..HEAD`: bare `{basis}`
  // compares against the working tree.
  collect(set, git(root, 'diff', '--name-only', '-z', '--no-renames', basis, '--', ...scope));
  // Untracked files, which a diff never lists. At close time a newly created source file is
  // routinely still untracked.
  // `--full-name` is load-bearing, not tidiness: `ls-files` prints paths relative to the CWD while
  // `diff --name-only` prints them relative to the repo root, so without it the two halves land in
  // different namespaces whenever the root is a subdirectory of the repo (reachable via `--repo`)
  // and the tracked half silently stops matching any cite.
  collect(set, git(root, 'ls-files', '--others', '--exclude-standard', '--full-name', '-z', '--', ...scope));
  return set;
}

function collect(set, res) {
  if (res.status !== 0) {
    // A buffer overflow surfaces as status null + ENOBUFS, which is NOT "git is missing" — saying so
    // would send a reader hunting a broken install. The very-stale map is exactly the case that can
    // produce enough paths to hit it, so it gets its own wording.
    const code = res.error && res.error.code;
    throw new Error(
      code === 'ENOBUFS' ? 'git produced more output than the meter can buffer'
        : res.status === null ? `git did not run (${code || 'unknown error'})`
          : `git exited ${res.status}`
    );
  }
  for (const p of (res.stdout || '').split('\0')) if (p) set.add(p);
}

// Invert the match: iterate the CHANGED FILES — an exact, git-produced list of literals — and search
// each map file for that literal. No path-shape heuristic anywhere.
//
// N = distinct LINES citing at least one changed file. M = distinct changed FILES cited by at least
// one line. Both are counts of distinct things: a line citing three changed files is one row, and a
// file cited on four lines is one file.
function countCites(root, changed) {
  const rows = new Set();
  const perFile = new Map();

  for (const mapFile of mapModuleFiles(root)) {
    let text;
    try {
      text = fs.readFileSync(path.join(root, ...mapFile.split('/')), 'utf8');
    } catch (err) {
      throw new Error(`cannot read ${mapFile} (${err.code || 'unreadable'})`);
    }
    const lines = stripFences(text).split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      for (const target of changed) {
        if (!citesPath(lines[i], target)) continue;
        rows.add(`${mapFile}:${i}`);
        perFile.set(target, (perFile.get(target) || 0) + 1);
      }
    }
  }
  return { rows, perFile };
}

// The per-module {module}.md files. index.md is EXCLUDED and is not a row surface: it holds the
// context map, the run report and the append-only changelog, so a path named there is a record of
// history, not a current-state claim. Counting it would inflate N with the map's own bookkeeping —
// worst on a long-lived map, whose changelog only grows.
function mapModuleFiles(root) {
  const found = [];
  walk(path.join(root, ...MAP_DIR_REL.split('/')), MAP_DIR_REL, found);
  return found.filter((f) => f.endsWith('.md') && !f.endsWith('/index.md')).sort();
}

function walk(dir, prefix, found) {
  let listing;
  try { listing = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of listing) {
    const rel = `${prefix}/${e.name}`;
    if (e.isDirectory()) walk(path.join(dir, e.name), rel, found);
    else found.push(rel);
  }
}

// Fenced code blocks are illustrative, not claims about the current tree — drop them before
// matching. Blanking rather than deleting keeps the line COUNT intact, which matters for the
// preamble slice in preamble() — not for row counting, where a row's key carries its file and would
// stay distinct either way. doc-anchoring.md § The close-time check already rules a cite inside a
// fence skipped, not a cite. Adapted from anchor-check.js (`:155-166`) rather than required — that
// file has no export surface — with the unbalanced-fence fallback below added here; the original
// still blanks the remainder of a file after a stray marker.
function stripFences(text) {
  const out = [];
  let inFence = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; out.push(''); continue; }
    out.push(inFence ? '' : line);
  }
  // An UNBALANCED fence — one stray marker, or a fenced block containing the other marker style —
  // would otherwise blank every line after it, and a silently dropped cite is indistinguishable
  // from a fresh map: exactly the failure this meter exists to catch. If the toggle is still open
  // at EOF the markers cannot be trusted, so fall back to the unstripped text. Over-counting is the
  // safe direction here (the header says so); under-counting is not.
  return inFence ? text : out.join('\n');
}

function citesPath(line, target) {
  let from = 0;
  for (;;) {
    const i = line.indexOf(target, from);
    if (i === -1) return false;
    from = i + 1;
    if (!(i === 0 || OPEN.has(line[i - 1]))) continue;
    if (isHistoryQualified(line, i)) continue;

    const j = i + target.length;
    if (j === line.length || CLOSE.has(line[j])) return true;
    // `.` only at the end of a sentence: `See lib/a.dart.` is a cite, `lib/a.dart.bak` is a
    // different path entirely.
    if (line[j] === '.' && (j + 1 === line.length || /\s/.test(line[j + 1]))) return true;
    // `:` followed by digits — the advisory `:{line}` suffix the map's evidence cites carry.
    if (line[j] === ':' && /[0-9]/.test(line[j + 1] || '')) return true;
  }
}

// A `{sha}:` prefix describes a tree at another commit and is not a claim about this one — the same
// exclusion anchor-check.js applies (`:197`). The opener allow-list already excludes `:`, so this
// states the citation grammar's rule in its own right rather than being the only thing enforcing
// it: the exclusion must survive any future widening of that list.
function isHistoryQualified(line, i) {
  return /\b[0-9a-f]{7,40}:$/.test(line.slice(Math.max(0, i - 41), i));
}

// `per-merge` is the only value that changes behavior. `milestone`, any other token, an unparseable
// line, and a missing manifest all mean `milestone` — so a repo with no manifest can never block,
// which is the intended reading of the narrowing's "defaulted to milestone".
function cadence(root) {
  try {
    const line = preamble(fs.readFileSync(path.join(root, ...MANIFEST_REL.split('/')), 'utf8'))
      .find((l) => /^\s*Map cadence:/i.test(l));
    const m = line && line.match(/^\s*Map cadence:\s*`?([A-Za-z-]+)`?/i);
    return m ? m[1].toLowerCase() : 'milestone';
  } catch {
    return 'milestone';
  }
}

function oneLine(err) {
  return String((err && err.message) || err).split(/\r?\n/)[0].trim() || 'unknown failure';
}

function say(line) {
  process.stdout.write(`${line}\n`);
}

function skip(reason) {
  say(`map-drift: ${reason}; skipped.`);
  process.exit(0);
}
