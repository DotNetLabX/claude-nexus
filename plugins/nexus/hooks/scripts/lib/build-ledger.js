'use strict';
/**
 * The build ledger of a tree: .claude/audit/build-ledger.json in that tree, written by whichever session runs
 * commands there. A session's run log lives in its own root, so a session rooted in the tree and one redirected
 * into it from another checkout never read each other's logs; the ledger is the one place every run in the tree
 * leaves its lines, and build reuse reads it.
 *
 * The ledger's order is the order its lines were written, never their times. A run that may build writes a start
 * line before its first command — { event: "start", id, ts, source, pid, open, ended, tree }, naming the earlier
 * starts it read with no end line: `open` those whose process still ran, `ended` those whose process had ended —
 * and every run writes an end line when it finishes — { event: "end", id, ts, end_ts, source, run_id?, builds,
 * tree }. `builds` lists what a composed run built or reused, as its record does; null means the run may have
 * built anything (a declared role, a fallback, a verify-gate run). The last start line is the tree's build
 * generation: a build is reused only from it, and only where the ledger shows no other run building beside it —
 * every other start matched by an end line or named ended, since two runs that read the ledger together never
 * name each other (lastBuildReusable).
 */
const fs = require('fs');
const path = require('path');

const LEDGER = ['.claude', 'audit', 'build-ledger.json'];

function appendBuildEntry(tree, entry) {
  try {
    fs.mkdirSync(path.join(tree, '.claude', 'audit'), { recursive: true });
    fs.appendFileSync(path.join(tree, ...LEDGER), JSON.stringify({ ...entry, tree }) + '\n');
  } catch { /* an unwritable ledger must not fail the run that measured */ }
}

// A ledger is started by a run whose runner can reuse a build, or by a verify-gate run that runs commands; a
// verify-run run of any other kind adds its lines only where a ledger is kept.
function hasBuildLedger(tree) {
  try { return fs.statSync(path.join(tree, ...LEDGER)).isFile(); } catch { return false; }
}

function readBuildEntries(tree) {
  let text = '';
  try { text = fs.readFileSync(path.join(tree, ...LEDGER), 'utf8'); } catch { return []; }
  const out = [];
  for (const line of text.split('\n')) {
    try {
      const entry = JSON.parse(line);
      if (entry && typeof entry === 'object') out.push(entry);
    } catch { /* a torn or blank line */ }
  }
  return out;
}

// A pid that cannot be checked counts as running.
function running(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return true;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

// The ids that start lines among `entries` name in their `ended`: each was checked, when that line was written, to
// be a start whose process no longer ran.
function namedEnded(entries) {
  const ids = new Set();
  for (const e of entries) if (e.event === 'start' && Array.isArray(e.ended)) for (const id of e.ended) ids.add(id);
  return ids;
}

// The start lines no end line matches and no start line has named ended. Two runs that read the ledger before
// either appended never name each other, so being left out of a later start line proves nothing.
function unmatchedStarts(entries) {
  const ended = namedEnded(entries);
  const open = new Map();
  for (const e of entries) {
    if (e.event === 'start') open.set(e.id, e);
    else if (e.id !== undefined) open.delete(e.id);
  }
  for (const id of ended) open.delete(id);
  return [...open.values()];
}

function startBuild(tree, { id, source, ts = new Date().toISOString() }) {
  const unmatched = unmatchedStarts(readBuildEntries(tree));
  const open = unmatched.filter((s) => running(s.pid)).map((s) => s.id);
  const ended = unmatched.filter((s) => !running(s.pid)).map((s) => s.id);
  appendBuildEntry(tree, { event: 'start', id, ts, source, pid: process.pid, open, ended });
}

function endBuild(tree, entry) {
  appendBuildEntry(tree, { event: 'end', ...entry, end_ts: new Date().toISOString() });
}

// A line or record that ran nothing, or only reused, built nothing; any other may have built anything.
function mayHaveBuilt(r) {
  if (r.event === 'start' || r.verdict === 'undeclared') return false;
  if (Array.isArray(r.commands) && r.commands.length === 0) return false;
  return !(Array.isArray(r.builds) && r.builds.every((b) => b && b.outcome === 'reused'));
}

// Whether the tree's last build generation built or reused `key` at `hash` with nothing else building beside it:
// its start line names no open run, every other start line up to it has an end line or was named ended by a start
// line up to it, its own end line is written and lists that key and hash, and no other line that may have built
// follows its start. `own` is the deciding run's id; its lines are left out.
function lastBuildReusable(entries, key, hash, own) {
  const lines = own === undefined ? entries : entries.filter((e) => e.id !== own);
  let at = -1;
  for (let i = lines.length - 1; i >= 0 && at < 0; i--) if (lines[i].event === 'start') at = i;
  if (at < 0) return null;
  const start = lines[at];
  const verdict = (ok) => ({ ok, start });
  if (!Array.isArray(start.open) || start.open.length) return verdict(false);
  const ended = namedEnded(lines.slice(0, at + 1));
  const ends = new Set(lines.filter((e) => e.event !== 'start' && e.id !== undefined).map((e) => e.id));
  if (lines.slice(0, at).some((e) => e.event === 'start' && !ends.has(e.id) && !ended.has(e.id))) return verdict(false);
  let end = null;
  for (const e of lines.slice(at + 1)) {
    if (e.event !== 'start' && e.id === start.id) end = e;
    else if (mayHaveBuilt(e)) return verdict(false);
  }
  if (!end || !Array.isArray(end.builds)) return verdict(false);
  return verdict(end.builds.some((b) => b && b.key === key && b.hash === hash && (b.outcome === 'built' || b.outcome === 'reused')));
}

module.exports = { LEDGER, appendBuildEntry, readBuildEntries, hasBuildLedger, startBuild, endBuild, mayHaveBuilt, lastBuildReusable };
