'use strict';
/**
 * The source-tree hash (F147): verify-run.js stamps it on every record, and pipeline-gate.js invariant (4)
 * compares a record's hash with the tree's hash now. One rule, two consumers — the worktree-target.js
 * precedent: two copies of "what counts as the source tree" would fail GREEN, reusing a stale record.
 *
 * WHAT IS HASHED. The index plus the untracked-not-ignored files of `tree`, from one
 * `git ls-files --cached --others --exclude-standard` call, minus every path whose FIRST segment is
 * `docs` or `.claude` (case-sensitive). Not is-code-file.js's any-depth, case-folded rule: a nested
 * `Docs/` source folder is source and must move the hash. Review artifacts, audit logs and tool
 * reports all live under those two roots, so a close's own writes never make its record stale.
 *
 * CONTENT-ADDRESSED. The digest is over `path NUL content` per sorted path — never HEAD, never mtimes —
 * so two trees with equal content hash equal across commits. A listed path that cannot be read (a
 * tracked file deleted from the worktree) contributes `path NUL deleted` instead of throwing.
 *
 * COST. Measured at plan time: 0.9–1.1 s per call on ~700 files / 9.9 MB, against a 9.6 s fast run.
 *
 * `null` means the tree is not a git repository, or git is absent: a consumer skips the hash factor.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const EXCLUDED_ROOTS = new Set(['docs', '.claude']);

function treeHash(tree) {
  let listing;
  try {
    listing = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: tree, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
  const paths = listing.split('\0').filter((p) => p && !EXCLUDED_ROOTS.has(p.split('/')[0])).sort();
  const hash = crypto.createHash('sha256');
  for (const p of paths) {
    hash.update(`${p}\0`);
    try { hash.update(fs.readFileSync(path.join(tree, p))); } catch { hash.update('deleted'); }
  }
  return hash.digest('hex');
}

// A record's `tree` is spelled by whoever typed `--tree`; the gate's is the published target string. No
// case folding and no platform branch: resolve both sides, and never let an absent side match the cwd.
function sameTree(a, b) {
  if (typeof a !== 'string' || !a || typeof b !== 'string' || !b) return false;
  return path.resolve(a) === path.resolve(b);
}

module.exports = { treeHash, sameTree };
