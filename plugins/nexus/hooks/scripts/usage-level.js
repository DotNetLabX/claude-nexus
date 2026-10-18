#!/usr/bin/env node
/**
 * Nexus usage level: whether a campaign's third reader may join a review.
 *
 *   node usage-level.js [--root <dir>]
 *
 * Reads the campaign runner's snapshot, .claude/audit/usage-level.json in the main checkout
 * (`{fiveHour, weekly, at}`, percent, `at` an ISO time or epoch milliseconds), and prints one JSON
 * object `{readable, fiveHour, weekly, ageMinutes, skip, reason}`. `skip` is true only for a
 * readable snapshot at most 15 minutes old with either window at or above 70%; a missing,
 * malformed or older snapshot never skips — the reader joins. --root defaults to
 * CLAUDE_PROJECT_DIR, else the working folder; from a worktree the main checkout is found through
 * git, and outside git the root is read as it is.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SNAPSHOT_REL = ['.claude', 'audit', 'usage-level.json'];
const SKIP_AT = 70;
const FRESH_MINUTES = 15;

function mainCheckout(root) {
  const r = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 10000 });
  const common = r.status === 0 ? r.stdout.trim() : '';
  return common && path.basename(common) === '.git' ? path.dirname(common) : root;
}

function readUsageLevel({ root, now = Date.now() }) {
  const none = (reason) => ({ readable: false, fiveHour: null, weekly: null, ageMinutes: null, skip: false, reason });
  const file = path.join(mainCheckout(root), ...SNAPSHOT_REL);
  let snapshot;
  try { snapshot = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) {
    return none(err.code === 'ENOENT' ? 'no usage snapshot' : 'the usage snapshot could not be read');
  }
  const at = typeof snapshot?.at === 'number' ? snapshot.at : Date.parse(snapshot?.at);
  const { fiveHour, weekly } = snapshot || {};
  if (![fiveHour, weekly].every((n) => typeof n === 'number' && Number.isFinite(n)) || !Number.isFinite(at)) {
    return none('the usage snapshot lacks fiveHour, weekly or at');
  }
  const ageMinutes = Math.max(0, Math.round((now - at) / 60000));
  const reading = { readable: true, fiveHour, weekly, ageMinutes };
  if (ageMinutes > FRESH_MINUTES) return { ...reading, skip: false, reason: `the usage snapshot is older than ${FRESH_MINUTES} minutes` };
  const high = [['five-hour', fiveHour], ['weekly', weekly]].find(([, pct]) => pct >= SKIP_AT);
  return { ...reading, skip: Boolean(high), reason: high ? `${high[0]} usage at ${high[1]}%` : null };
}

if (require.main === module) {
  const i = process.argv.indexOf('--root');
  const root = i > 0 && process.argv[i + 1] ? process.argv[i + 1] : process.env.CLAUDE_PROJECT_DIR || process.cwd();
  process.stdout.write(`${JSON.stringify(readUsageLevel({ root }))}\n`);
}

module.exports = { readUsageLevel, mainCheckout, SKIP_AT, FRESH_MINUTES };
