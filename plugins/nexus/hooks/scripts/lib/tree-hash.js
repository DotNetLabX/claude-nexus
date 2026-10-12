'use strict';
/**
 * The source-tree hash (F147): verify-run.js stamps it on every record, and pipeline-gate.js invariant (4)
 * compares a record's hash with the tree's hash now. One rule, two consumers — the worktree-target.js
 * precedent: two copies of "what counts as the source tree" would fail GREEN, reusing a stale record.
 *
 * WHAT IS HASHED. The index plus the untracked-not-ignored files of `tree`, from one
 * `git ls-files --cached --others --exclude-standard` call, minus every path whose FIRST segment is
 * `docs` (case-sensitive), and minus what the plugins themselves write under the top-level `.claude/`,
 * so a close's own writes never make its record stale. Not is-code-file.js's any-depth, case-folded
 * rule: a nested `Docs/` source folder is source and must move the hash. Everything else under
 * `.claude/` counts — a project may keep scripts and tests there, and its settings (`verify.json`) are
 * input to the run. A pipeline write missing from the list costs one extra suite run; leaving code out
 * reuses a stale record, so the list errs toward counting. The pipeline writes, by writer:
 *   audit/**              every hook's logs, records, locks and stamps; the campaign runner's state
 *   review-queue/**       the team lead's unattended review queue
 *   .current-agent        the persona commands
 *   .personas.json        register-persona.js, restore-agent.js (and their `.personas.json.{pid}.tmp`)
 *   .pipeline-state       the team lead's phase token
 *   .approval-scope       the approval stamp (team lead, architect, solo)
 *   .worktree-target      the cross-tree verify target (team lead, architect, solo)
 *   .campaign-unit        the campaign runner's unit marker
 *   .owner-away           the owner-away mark, when a session has no scratchpad
 *   test-times.json       the slow-test timing record
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

const PIPELINE_DIRS = ['audit/', 'review-queue/'];
const PIPELINE_FILES = new Set([
  '.current-agent', '.personas.json', '.pipeline-state', '.approval-scope', '.worktree-target',
  '.campaign-unit', '.owner-away', 'test-times.json',
]);
const PERSONAS_TMP = /^\.personas\.json\.\d+\.tmp$/;

function excluded(p) {
  const slash = p.indexOf('/');
  const first = slash === -1 ? p : p.slice(0, slash);
  if (first === 'docs') return true;
  if (first !== '.claude') return false;
  const rest = p.slice(slash + 1);
  return PIPELINE_DIRS.some((d) => rest.startsWith(d)) || PIPELINE_FILES.has(rest) || PERSONAS_TMP.test(rest);
}

function treeHash(tree) {
  let listing;
  try {
    listing = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: tree, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
  const paths = listing.split('\0').filter((p) => p && !excluded(p)).sort();
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
