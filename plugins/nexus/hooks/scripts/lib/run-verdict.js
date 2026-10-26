'use strict';
/**
 * The one close rule. A complete record COUNTS AS PASSING when it passed, or when the run completed and its
 * only failures are timed-out tests the change did not touch: `reason: "tests-timed-out"`, a non-empty
 * `timed_out` list whose every entry carries `touched: false`, and an empty `failed_tests`. A `null` list,
 * any touched or unmarked entry, a real failure, or a whole-run cut (`reason: "timeout"`) does not.
 * pipeline-gate.js invariant (4), lib/gear-close.js and the campaign plugin's closing check read it, so
 * the three agree; the campaign loads it from the installed core and keeps its own rule without it.
 *
 * The runners whose timeouts reach it: node, vstest (.NET), flutter and vitest, each entry naming its own.
 *
 * markTouched is what verify-run.js runs before it writes. Each entry is marked by its own `runner`, else the
 * record's. The change is every file that differs from the merge-base with the repo's default branch —
 * `origin/HEAD`, else `.claude/nexus-agents.json` `defaultBranch` — plus untracked files. Files the tree
 * hash leaves out and prose (`.md`, `.txt`) never make a change untied: prose cannot make a test hang, so a
 * change with no code touches nothing, whatever the runner. Otherwise a node timeout is touched when its file
 * is in the change or tied to a changed file, a vstest one when its test project is tied to a changed file
 * (each runner's `tiedSet`, lib/tied-tests.js); every entry of that runner is touched when any changed file
 * ties to no test or sits outside the tree. A runner with no tie (flutter, vitest) has every entry touched
 * once the change holds code: a `pubspec.yaml` or a config file can make a test hang. Every entry is touched
 * when the base cannot be read, and an entry with no runner, or none of the file or project its runner
 * places it by, always is — the safe direction: nothing the change may have caused is passed on.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { tiedSet } = require('./tied-tests');
const { isExcluded } = require('./tree-hash');

const GIT_TIMEOUT_MS = 10000;
const PROSE = /\.(md|txt)$/i;

function untouchedTimeouts(record) {
  return record && Array.isArray(record.timed_out) ? record.timed_out.filter((t) => t && t.touched === false) : [];
}

function countsAsPassing(record) {
  if (!record || typeof record !== 'object') return false;
  if (record.verdict === 'pass') return true;
  return record.verdict === 'fail' && record.reason === 'tests-timed-out'
    && Array.isArray(record.failed_tests) && record.failed_tests.length === 0
    && Array.isArray(record.timed_out) && record.timed_out.length > 0
    && untouchedTimeouts(record).length === record.timed_out.length;
}

function git(repo, args) {
  return execFileSync('git', args, {
    cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true, timeout: GIT_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024,
  });
}

function baseRef(repo) {
  try {
    const ref = git(repo, ['symbolic-ref', '-q', 'refs/remotes/origin/HEAD']).trim();
    if (ref) return ref.replace(/^refs\/remotes\//, '');
  } catch { /* no origin/HEAD: the configured branch */ }
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(repo, '.claude', 'nexus-agents.json'), 'utf8'));
    if (cfg && typeof cfg.defaultBranch === 'string' && cfg.defaultBranch) return cfg.defaultBranch;
  } catch { /* none */ }
  return null;
}

// The changed paths, tree-relative with forward slashes, or null when the change cannot be read. `git diff`
// names paths from the repository's top, untracked ones from the tree: a tree below the top strips its
// prefix, and a code change outside the tree reads as unreadable, since nothing inside can tie it.
function changedFiles(repo) {
  const ref = baseRef(repo);
  if (!ref) return null;
  try {
    const base = git(repo, ['merge-base', 'HEAD', ref]).trim();
    const prefix = git(repo, ['rev-parse', '--show-prefix']).trim().replace(/\\/g, '/');
    const diffed = [];
    for (const f of git(repo, ['diff', '--name-only', '-z', base]).split('\0').filter(Boolean).map((p) => p.replace(/\\/g, '/'))) {
      if (f.startsWith(prefix)) diffed.push(f.slice(prefix.length));
      else if (!PROSE.test(f)) return null;
    }
    const untracked = git(repo, ['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean).map((p) => p.replace(/\\/g, '/'));
    return [...new Set([...diffed, ...untracked])];
  } catch {
    return null;
  }
}

// The runners whose tie decides an entry, and the field each places its entry by: the test file, or the
// .NET test project. Every other runner has no tie and places by the file.
const TIED_BY = { node: 'file', vstest: 'project' };

// An entry no change can be shown not to reach is touched: one its runner could not place, or one whose
// runner cannot be told.
function markTouched({ entries, repo, runner }) {
  if (!Array.isArray(entries)) return entries;
  const runnerOf = (e) => (typeof e.runner === 'string' && e.runner ? e.runner : runner || '');
  const keyOf = (e) => {
    const value = e[TIED_BY[runnerOf(e)] || 'file'];
    return typeof value === 'string' && value !== '' ? value.replace(/\\/g, '/') : null;
  };
  const changed = changedFiles(repo);
  const code = changed === null ? [] : changed.filter((f) => !isExcluded(f) && !PROSE.test(f));
  const ties = new Map();
  const hits = (name) => {
    if (!ties.has(name)) {
      const set = tiedSet({ repo, changed: code, runner: name });
      ties.set(name, set.fallback ? null : new Set(set.targets));
    }
    return ties.get(name);
  };
  return entries.map((e) => {
    const name = runnerOf(e);
    const key = keyOf(e);
    if (!name || key === null || changed === null) return { ...e, touched: true };
    if (code.length === 0) return { ...e, touched: false };
    if (!TIED_BY[name]) return { ...e, touched: true };
    const hit = hits(name);
    return { ...e, touched: hit === null || hit.has(key) };
  });
}

module.exports = { countsAsPassing, untouchedTimeouts, markTouched };
