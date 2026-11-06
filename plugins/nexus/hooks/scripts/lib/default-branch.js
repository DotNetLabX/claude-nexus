'use strict';
/**
 * The default branch of a tree: the one resolver commit-step.js, foreign-commits.js, merge-close.js and
 * lib/run-verdict.js call. The order is agents-workflow.md § Branch Pre-Flight & Default-Branch Resolution's, duplicated here
 * because these scripts run with no agent context; tests/lint/convergence.test.mjs holds the two in step.
 *
 *   1. `.claude/.base-branch` in `dir` — its first line, the branch this tree is built on. A blank file, or one
 *      naming a branch git cannot resolve in `dir`, falls through.
 *   2. `origin/HEAD` — the repo's real default.
 *   3. `.claude/nexus-agents.json` `defaultBranch` — the config override.
 *   4. the literal fallback, only where the caller takes one (`fallback: true`, the default).
 *
 * Returns `{ name, ref, source }` — `name` the branch's local name, `ref` what to compare with: `origin/{name}`
 * when the name came from `origin/HEAD`, else the name itself — or `null` when nothing resolves and the caller
 * took no fallback. `source` is `file`, `origin`, `config` or `fallback`. It only reads.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const GIT_TIMEOUT_MS = 10000;

function git(dir, args) {
  const res = spawnSync('git', args, { cwd: dir, encoding: 'utf8', windowsHide: true, timeout: GIT_TIMEOUT_MS });
  return { ok: res.status === 0, stdout: (res.stdout || '').trim() };
}

function readFirstLine(file) {
  try { return fs.readFileSync(file, 'utf8').split(/\r?\n/)[0].trim(); } catch { return ''; }
}

function resolveDefaultBranch(dir, { fallback = true } = {}) {
  const named = readFirstLine(path.join(dir, '.claude', '.base-branch'));
  if (named && git(dir, ['rev-parse', '--verify', '--quiet', `${named}^{commit}`]).ok) {
    return { name: named, ref: named, source: 'file' };
  }

  const symref = git(dir, ['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD']);
  if (symref.ok && symref.stdout) {
    const name = symref.stdout.replace(/^refs\/remotes\/origin\//, '');
    return { name, ref: `origin/${name}`, source: 'origin' };
  }

  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'nexus-agents.json'), 'utf8')) || {}; } catch { cfg = {}; }
  if (typeof cfg.defaultBranch === 'string' && cfg.defaultBranch) {
    return { name: cfg.defaultBranch, ref: cfg.defaultBranch, source: 'config' };
  }

  return fallback ? { name: 'main', ref: 'main', source: 'fallback' } : null;
}

module.exports = { resolveDefaultBranch };
