'use strict';
/**
 * The close evidence, read at every close whatever the gear. The round's latest complete record
 * discharges the close at a tree that has changed since it, or despite its failures, when all three hold:
 *
 *   it completed — never cut or crashed, and a red one names all its failures (`failed` is a list), or it
 *     counts as passing (lib/run-verdict.js: its only failures are untouched timed-out tests);
 *   each failure is repaired — a failed file whose only failures are untouched timeouts owes none, while a
 *     real failure in the same file still does; otherwise the newest later record of the same slug and tree that ran the failed
 *     test file or project by name is green, ran it with no filter, and holds the content it ran at
 *     (`delta_hashes` against this complete record): every file whose content now differs from that is
 *     held at its current hash by a green record after it, or the newest whole-unit fast record of the
 *     same slug and tree at the current tree hash stands after it and is green — a whole-unit record
 *     never repairs the failure itself;
 *   every later change is covered — for each file whose hash differs from the record's `file_hashes`
 *     (added and removed files included), the newest later fast record of the same slug and tree that
 *     holds the file at its current hash in `changed_hashes` is green; or the newest whole-unit fast
 *     record of the same slug and tree at the current tree hash is green.
 *
 * A file label-tests.js labelled after a green fast record that timed it is held by that record: its label
 * record's `before` is that run's hash for it and its `after` the hash now (labelsOnly gives invariant (4)
 * the same reading of a complete record).
 *
 * A cut record is never green, and a newer red takes back an older green. Records of another slug or
 * tree never count. `closeGear` names the plan header's gear (`lib/gears.js`) only where its complete run
 * runs once beside the reviewers, for the routing: there a red joins that gear's fix round. pipeline-gate.js
 * invariant (4) reads the evidence, and the campaign plugin's closing check loads it from the installed
 * core. verify-run.js writes a fast record's `delta_base` and `delta_hashes` through `deltaSince`.
 */
const { planHeader, valueOf } = require('./gears');
const { treeHash, fileHashes, sameTree } = require('./tree-hash');
const { isFilteredFull } = require('./compose-test-command');
const { countsAsPassing, untouchedTimeouts } = require('./run-verdict');

const ONCE = 'once beside the reviewers';
const COMPLETE_RUN_SETTING = 12;
const NAME_FILTER = /--test-name-pattern|--test-only/;

/** The feature's gear when its complete run runs once beside the reviewers, else null. */
function closeGear(slug, { tree, root, env } = {}) {
  try {
    if (!planHeader(slug, { tree, root }).gear) return null;
    const v = valueOf({ setting: COMPLETE_RUN_SETTING, slug, tree, root, env });
    return v.gear && v.value === ONCE ? v.gear : null;
  } catch {
    return null;
  }
}

const has = (m, p) => Boolean(m) && typeof m === 'object' && Object.prototype.hasOwnProperty.call(m, p);
const hashIn = (m, p) => (has(m, p) ? m[p] : null);
const green = (r) => Boolean(r) && r.verdict === 'pass';
const unfiltered = (r) => !isFilteredFull(r.command || '') && !NAME_FILTER.test(String(r.command || ''));
const differing = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((p) => hashIn(a, p) !== hashIn(b, p));

/**
 * What a fast record of `slug` writes about the content it ran at: the files whose content differs from
 * the latest complete record of that slug and tree, keyed to that record's `ts`. `{}` without one.
 */
function deltaSince({ records, tree, slug, files }) {
  if (!slug || !files) return {};
  const complete = records.filter((r) => r && r.role === 'full' && r.slug === slug && sameTree(r.tree, tree)
    && typeof r.ts === 'string' && r.file_hashes && typeof r.file_hashes === 'object').at(-1);
  if (!complete) return {};
  const delta = {};
  for (const p of differing(files, complete.file_hashes)) delta[p] = hashIn(files, p);
  return { delta_base: complete.ts, delta_hashes: delta };
}

/**
 * `{ok: true}`, or `{ok: false, cause, files}` — `not-completed`, `unrepaired` (the failures with no
 * green repair standing for their content now) or `uncovered` (the changed files with no green
 * covering run).
 */
function closeEvidence({ records, index, tree, slug }) {
  const complete = records[index];
  const passing = countsAsPassing(complete);
  const completed = Boolean(complete) && complete.reason !== 'timeout'
    && (passing || (complete.verdict === 'fail' && Array.isArray(complete.failed)))
    && Boolean(complete.file_hashes) && typeof complete.file_hashes === 'object';
  if (!completed) return { ok: false, cause: 'not-completed', files: [] };
  // A file whose only failures are untouched timeouts owes no repair; a real failure in it still does.
  const untouched = new Set(untouchedTimeouts(complete).map((t) => t.file));
  const realFailure = new Set((Array.isArray(complete.failed_tests) ? complete.failed_tests : []).map((t) => t.file));
  const owesRepair = (item) => !(untouched.has(item) && Array.isArray(complete.failed_tests) && !realFailure.has(item));

  const later = records.slice(index + 1)
    .filter((r) => r && r.profile === 'fast' && r.slug === slug && sameTree(r.tree, tree));
  const now = fileHashes(tree);
  const changed = now === null ? [] : differing(complete.file_hashes, now).sort();
  const labels = labelRecords(records.slice(index + 1), tree);
  // A label record stands for the labelled file as its run's coverage: that run is a later green fast record
  // that timed the file at the label record's `before`, and no newer record holding the file is red.
  const labelHeld = (i, p) => labels.some((label) => {
    const f = label.files[p];
    if (!f || f.after !== hashIn(now, p)) return false;
    const j = later.findIndex((r) => r.run_id === label.run_id);
    if (j <= i || !green(later[j]) || hashIn(later[j].timed_hashes, p) !== f.before) return false;
    return !later.slice(j + 1).some((r) => (has(r.changed_hashes, p) || has(r.timed_hashes, p)) && !green(r));
  });
  const heldGreenAfter = (i, p) => green(later.slice(i + 1).filter((r) => has(r.changed_hashes, p) && r.changed_hashes[p] === hashIn(now, p)).at(-1))
    || labelHeld(i, p);
  let hashNow;
  const wholeGreenAfter = (i) => {
    if (hashNow === undefined) hashNow = treeHash(tree);
    const j = later.findLastIndex((r) => r.files === undefined && r.tree_hash === hashNow);
    return j > i && green(later[j]);
  };

  const unrepaired = (complete.verdict === 'fail' && Array.isArray(complete.failed) ? complete.failed : []).filter(owesRepair).filter((item) => {
    const i = later.findLastIndex((r) => Array.isArray(r.files) && r.files.includes(item));
    const r = later[i];
    if (!green(r) || !unfiltered(r)) return true;
    if (r.delta_base !== complete.ts || !r.delta_hashes || typeof r.delta_hashes !== 'object') return true;
    if (now === null) return false;
    const ranAt = (p) => (has(r.delta_hashes, p) ? r.delta_hashes[p] : hashIn(complete.file_hashes, p));
    const moved = [...new Set([...Object.keys(r.delta_hashes), ...changed])].filter((p) => ranAt(p) !== hashIn(now, p));
    return moved.some((p) => !heldGreenAfter(i, p)) && !wholeGreenAfter(i);
  });
  if (unrepaired.length) return { ok: false, cause: 'unrepaired', files: unrepaired };

  if (now === null || changed.length === 0) return { ok: true };
  if (wholeGreenAfter(-1)) return { ok: true };

  const uncovered = changed.filter((p) => !heldGreenAfter(-1, p));
  return uncovered.length ? { ok: false, cause: 'uncovered', files: uncovered } : { ok: true };
}

const labelRecords = (records, tree) => records.filter((r) => r && r.source === 'label-tests' && sameTree(r.tree, tree)
  && typeof r.run_id === 'string' && r.files && typeof r.files === 'object');

/**
 * Whether the files that changed since a complete record (`index`) changed by labels alone: each file whose
 * hash now differs from the record's `file_hashes` has a later label record (label-tests.js) whose `before`
 * is the record's hash for it and whose `after` is its hash now. pipeline-gate.js invariant (4) then reads
 * the record as not stale — whichever step close the label record names.
 */
function labelsOnly({ records, index, tree }) {
  const complete = records[index];
  if (!complete || !complete.file_hashes || typeof complete.file_hashes !== 'object') return false;
  const now = fileHashes(tree);
  if (now === null) return false;
  const changed = differing(complete.file_hashes, now);
  if (changed.length === 0) return false;
  const labels = labelRecords(records.slice(index + 1), tree);
  return changed.every((p) => labels.some((l) => l.files[p] && l.files[p].before === hashIn(complete.file_hashes, p) && l.files[p].after === hashIn(now, p)));
}

module.exports = { closeGear, closeEvidence, deltaSince, labelsOnly, ONCE };
