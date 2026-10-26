'use strict';
/**
 * The reader of the core events reporter's file (test-reporter.mjs beside this file): the record's
 * `timed_out` and `failed_tests` for a node run. verify-run.js reads a whole run's events with it, and the
 * built-in node runner (runners/node.js) reads one full-run stage's.
 */
const path = require('path');
const { fileURLToPath } = require('url');

const slashed = (p) => String(p).replace(/\\/g, '/');

// The events file the core reporter (lib/test-reporter.mjs) wrote, read into the record's lists. The
// events are complete when every expected leg reported its end — the legs a wrapper announced plus `legs`,
// the number this runner ran itself, and a `shell` command among them announced its own; without that both
// lists are null, never empty. Only tests
// count: a suite's own failure is judged from its tests. A test is timed out when its failure carries
// the child-call stop (`child-stopped`), is the runner's timeout (`timeout`) or was cancelled under an
// ancestor that itself timed out (`cancelled-by-parent`); any other failure is a real one, a cancellation
// with no timed-out ancestor among them. Each entry carries its failure's `message`, `runner: "node"` and
// `target`, its file — what a re-run by name takes. Events that are not complete return the failures seen
// so far apart, as `failures_partial`, so a partial list never stands as the list.
function readTestEvents(text, { legs = 0, shell = false, tree = '' } = {}) {
  const events = [];
  for (const line of String(text || '').split('\n')) {
    try { const e = JSON.parse(line); if (e && typeof e === 'object') events.push(e); } catch { /* a torn or blank line */ }
  }
  const announced = events.filter((e) => e.kind === 'legs' && Number.isInteger(e.legs));
  const expected = announced.reduce((n, e) => n + e.legs, 0) + legs;
  const ended = events.filter((e) => e.kind === 'run-end').length;
  // A command run through a shell that announced no legs may have stopped early: its events never count.
  const complete = expected > 0 && ended >= expected && (!shell || announced.length > 0);
  const fileOf = (f) => {
    if (!f) return null;
    const p = /^file:/.test(f) ? fileURLToPath(f) : f;
    return slashed(tree && path.isAbsolute(p) ? path.relative(tree, p) : p);
  };
  // A parent reports after its children, so the events still open at a deeper nesting of the same file when
  // a parent's own event arrives are its descendants. A test cancelled under a parent that failed for a real
  // reason — a hook that threw — did not time out: the parent's failure is the one counted.
  // Two legs running at the same time over one file are told apart by their runner's `pid`.
  const nodes = events.filter((e) => e.kind === 'test' || e.kind === 'suite').map((e) => ({ e, parent: null }));
  const open = new Map();
  for (const node of nodes) {
    const key = `${node.e.pid === undefined ? '' : node.e.pid}|${node.e.file || ''}`;
    const depth = Number(node.e.nesting) || 0;
    const pending = open.get(key) || [];
    open.set(key, pending.filter((child) => {
      if ((Number(child.e.nesting) || 0) <= depth) return true;
      if (!child.parent) child.parent = node;
      return false;
    }).concat(node));
  }
  const NOT_REAL = new Set(['subtestsFailed', 'testTimeoutFailure', 'cancelledByParent']);
  const realFailure = (e) => Boolean(e.failureType) && !NOT_REAL.has(e.failureType) && e.causeCode !== 'ERR_NEXUS_TEST_STOP';
  const timedOutItself = (e) => e.failureType === 'testTimeoutFailure' || e.causeCode === 'ERR_NEXUS_TEST_STOP';
  const above = (node, is) => { for (let p = node.parent; p; p = p.parent) if (is(p.e)) return true; return false; };
  const underRealFailure = (node) => above(node, realFailure);
  const timedOut = [];
  const failed = [];
  const times = [];
  for (const node of nodes) {
    const { e } = node;
    if (e.skip || e.todo) continue;
    const file = fileOf(e.file);
    const at = { file, line: e.line, test: e.test, message: typeof e.message === 'string' ? e.message : null, runner: 'node', target: file };
    if (e.kind === 'suite') {
      if (realFailure(e)) failed.push(at);
      continue;
    }
    if (!e.failureType) {
      if (typeof e.ms === 'number') times.push({ file: at.file, line: e.line, column: e.column, test: e.test, ms: e.ms });
      continue;
    }
    if (e.failureType === 'subtestsFailed') continue;
    let cause = null;
    if (e.causeCode === 'ERR_NEXUS_TEST_STOP') cause = 'child-stopped';
    else if (e.failureType === 'testTimeoutFailure') cause = 'timeout';
    else if (e.failureType === 'cancelledByParent') {
      if (underRealFailure(node)) cause = 'covered';
      else if (above(node, timedOutItself)) cause = 'cancelled-by-parent';
    }
    if (cause === 'covered') continue;
    if (cause) timedOut.push({ ...at, cause });
    else failed.push(at);
  }
  if (complete) return { complete, timed_out: timedOut, failed_tests: failed, test_times: times };
  return { complete, timed_out: null, failed_tests: null, failures_partial: [...failed, ...timedOut], test_times: times };
}

module.exports = { readTestEvents };
