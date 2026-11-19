'use strict';
/**
 * The close evidence, read at every close whatever the gear. The round's latest complete record
 * discharges the close at a tree that has changed since it, or despite its failures, when all three hold:
 *
 *   it completed — never cut or crashed, and a red one names all its failures (`failed` is a non-empty list,
 *     or the events were read whole, `failed_tests` is empty and every failure is a timed-out test placed in a
 *     file, whose touched entries' targets are then its failures), or it counts as passing (lib/run-verdict.js:
 *     its only failures are untouched timed-out tests — the one red whose `failed` is `[]`);
 *   each failure is repaired — a failed target (a test file, or the test project of a .NET failure placed in
 *     none; an older record's entry with no `target` is weighed by its file) whose only failures are untouched
 *     timeouts owes none, while a real failure or a touched timeout in the same target still does; otherwise the
 *     newest later record of the same slug and tree that ran the failed item by name — a record naming the item,
 *     or the project the complete record's entry for it carries — is green, ran it with no filter, and holds the
 *     content it ran at. A green project run with a filter may not have run the failure, so it is passed over:
 *     it neither repairs a file item nor hides an earlier repair of it. The one filter allowed is the class
 *     selection a run naming the failed .cs file was built with, `FullyQualifiedName~` clauses joined by `|` in
 *     every `--filter` of its command. A failed .cs file is repaired only by a record whose `test_times` hold each
 *     failed test of that file by its name, `test` (a theory's data is in it), class and method — and, for a failure
 *     that carries its `project`, timed in that project, since one source file can belong to two test projects —
 *     however it ran: a selection that matches nothing, or only the file's other tests or cases, exits green. A test whose name
 *     cannot be matched (renamed, its data changed, a timeout the blame file names otherwise) takes a complete run.
 *     That content is held in `delta_hashes` against this complete record: every file whose content now differs from
 *     that is held at its current hash by a green record after it, or the newest whole-unit fast record of the
 *     same slug and tree at the current tree hash stands after it and is green — a whole-unit record
 *     never repairs the failure itself;
 *   every later change is covered — for each file whose hash differs from the record's `file_hashes`
 *     (added and removed files included), the newest later fast record of the same slug and tree that
 *     holds the file at its current hash in `changed_hashes` is green; or the newest whole-unit fast
 *     record of the same slug and tree at the current tree hash is green.
 *
 * A file label-tests.js labelled after a green fast record that timed it is held by that record: its label
 * record's `before` is that run's hash for it (`timed_hashes`, or `companion_hashes` for a project file the
 * label needs beside it) and its `after` the hash now (labelsOnly gives invariant (4) the same reading of a
 * complete record). A two-leg check label-tests.js kept as failed at a file's content takes back, by the log's
 * append order, every coverage of that content recorded before it — a label, a green record holding it, a
 * whole-unit green, a named repair of it — until a newer check there passes or green evidence follows it.
 *
 * A developer's step run (`step_run`, verify-run.js `--step`) is read as a tied record naming the test files it
 * ran — it repairs those files and covers its `changed_hashes` — and is never a whole-unit record; one that ran
 * no test file (`files` empty: a build alone, `nothing to run`, a runner with no step run) is no evidence at all,
 * green or red, and takes back nothing.
 *
 * A cut record is never green, and a newer red takes back an older green. Records of another slug or
 * tree never count. `closeGear` names the plan header's gear (`lib/gears.js`) only where its complete run
 * runs once beside the reviewers, for the routing: there a red joins that gear's fix round. pipeline-gate.js
 * invariant (4) reads the evidence, and the campaign plugin's closing check loads it from the installed
 * core. verify-run.js writes a fast record's `delta_base` and `delta_hashes` through `deltaSince`.
 *
 * The pre-merge evidence (`premergeEvidence`) needs no complete record: the change against its base covered by
 * the same fast-record and label readings, plus a green `premerge` record at the current tree hash where the tree
 * declares that role; what is missing is returned by name, so a caller runs exactly that.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { planHeader, valueOf } = require('./gears');
const { treeHash, fileHashes, sameTree, isExcluded } = require('./tree-hash');
const { isFilteredFull } = require('./test-runners');
const { countsAsPassing, untouchedTimeouts } = require('./run-verdict');
const { resolveDefaultBranch } = require('./default-branch');

const GIT_TIMEOUT_MS = 10000;
const ONCE = 'once beside the reviewers';
const COMPLETE_RUN_SETTING = 12;
const NAME_FILTER = /--test-name-pattern|--test-only/;
const CLASS_SELECTION = /--filter\s+"FullyQualifiedName~[^"\s|&!=~()]+(?:\|FullyQualifiedName~[^"\s|&!=~()]+)*"/g;

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
const selectsClassesOnly = (r) => unfiltered({ command: String(r.command || '').replace(CLASS_SELECTION, '') });
const names = (r, item) => Array.isArray(r.files) && r.files.includes(item);
const ranTestOf = (r, file, failure) => Array.isArray(r.test_times) && r.test_times.some((t) => t && t.file === file
  && (!failure || (typeof failure.test === 'string' && failure.test !== '' && t.test === failure.test
    && t.class === failure.class && t.method === failure.method && (!failure.project || t.project === failure.project))));
const differing = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((p) => hashIn(a, p) !== hashIn(b, p));
// A developer's step run that ran no test file.
const noEvidence = (r) => r.step_run === true && !(Array.isArray(r.files) && r.files.length > 0);
// The item a failure is re-run by: its `target` (a test file, a .NET test project), else its file in an older record.
const targetOf = (t) => (typeof t.target === 'string' && t.target !== '' ? t.target : t.file);

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
  const failures = failuresOf(complete);
  const completed = Boolean(complete) && complete.reason !== 'timeout'
    && (passing || failures !== null)
    && Boolean(complete.file_hashes) && typeof complete.file_hashes === 'object';
  if (!completed) return { ok: false, cause: 'not-completed', files: [] };
  // A file whose only failures are untouched timeouts owes no repair; a real failure or a touched timeout in it still does.
  const untouched = new Set(untouchedTimeouts(complete).map(targetOf));
  const failedTests = Array.isArray(complete.failed_tests) ? complete.failed_tests : [];
  const timedOut = Array.isArray(complete.timed_out) ? complete.timed_out : [];
  const owed = [...failedTests, ...timedOut.filter((t) => !t || t.touched !== false)];
  const realFailure = new Set(owed.map((t) => t && targetOf(t)));
  const owesRepair = (item) => !(untouched.has(item) && Array.isArray(complete.failed_tests) && !realFailure.has(item));
  const projectsOf = (item) => [...failedTests, ...timedOut].filter((t) => t && targetOf(t) === item && t.project).map((t) => t.project);
  const namesProject = (r, item) => projectsOf(item).some((p) => names(r, p));
  const ranFailuresOf = (r, item) => ranTestOf(r, item) && owed.filter((t) => t && targetOf(t) === item).every((t) => ranTestOf(r, item, t));

  const now = fileHashes(tree);
  const changed = now === null ? [] : differing(complete.file_hashes, now).sort();
  const { later, laterAt, failed, heldGreenAfter, wholeGreenAfter } = coverageAfter({ records, index, tree, slug, now });

  const unrepaired = (failures || []).filter(owesRepair).filter((item) => {
    const i = later.findLastIndex((r) => names(r, item) || (namesProject(r, item) && (!green(r) || unfiltered(r))));
    const r = later[i];
    if (!green(r)) return true;
    if (!(names(r, item) && item.endsWith('.cs') ? selectsClassesOnly(r) : unfiltered(r))) return true;
    if (item.endsWith('.cs') && !ranFailuresOf(r, item)) return true;
    if (r.delta_base !== complete.ts || !r.delta_hashes || typeof r.delta_hashes !== 'object') return true;
    if (now === null) return false;
    if (failed.at(item, hashIn(now, item)) > laterAt[i]) return true;
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

/**
 * What the fast records of `slug` and `tree` after log place `index` hold for the content now (`now`, the file
 * hashes): `heldGreenAfter(i, p)` — the newest of them holding `p` at its current hash, after place `i` among
 * them, is green and stands after the newest failed two-leg check at that content, or a label stands for it;
 * `wholeGreenAfter(i)` — the newest whole-unit one at the current tree hash, after `i`, is green with no check
 * failed since. `later` are those records, `laterAt` their log places.
 */
function coverageAfter({ records, index, tree, slug, now }) {
  // `laterAt` holds each later record's place in the log, the append order a failed check is weighed by.
  const laterAt = [];
  records.forEach((r, k) => { if (k > index && r && r.profile === 'fast' && r.slug === slug && sameTree(r.tree, tree) && !noEvidence(r)) laterAt.push(k); });
  const later = laterAt.map((k) => records[k]);
  const labels = labelRecords(records.slice(index + 1), tree);
  const failed = failedChecks(records, index, tree);
  // A label record stands for the labelled file as its run's coverage: that run is a later green fast record
  // that timed the file at the label record's `before`, and no newer record holding the file is red.
  // A project file a label needs beside it (a Flutter project's dart_test.yaml) is held at the hash the run
  // took of it (`companion_hashes`).
  const ranAt = (r, p) => (has(r.timed_hashes, p) ? r.timed_hashes[p] : hashIn(r.companion_hashes, p));
  const labelHeld = (i, p) => labels.some((label) => {
    const f = label.files[p];
    if (!f || f.after !== hashIn(now, p) || failed.at(p, f.after) >= 0) return false;
    const j = later.findIndex((r) => r.run_id === label.run_id);
    if (j <= i || !green(later[j]) || ranAt(later[j], p) !== f.before) return false;
    return !later.slice(j + 1).some((r) => (has(r.changed_hashes, p) || has(r.timed_hashes, p) || has(r.companion_hashes, p)) && !green(r));
  });
  // Green evidence counts only after the newest failed check at the content it vouches for.
  const heldGreenAfter = (i, p) => {
    const j = later.findLastIndex((r, k) => k > i && has(r.changed_hashes, p) && r.changed_hashes[p] === hashIn(now, p));
    return (j > i && green(later[j]) && laterAt[j] > failed.at(p, hashIn(now, p))) || labelHeld(i, p);
  };
  let hashNow;
  const wholeGreenAfter = (i) => {
    if (hashNow === undefined) hashNow = treeHash(tree);
    const j = later.findLastIndex((r) => r.files === undefined && r.tree_hash === hashNow);
    return j > i && green(later[j]) && !failed.since(laterAt[j], now);
  };
  return { later, laterAt, failed, heldGreenAfter, wholeGreenAfter };
}

function git(tree, args) {
  return execFileSync('git', args, {
    cwd: tree, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true, timeout: GIT_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024,
  });
}
const gitOk = (tree, args) => { try { return git(tree, args).trim(); } catch { return null; } };
const commitOf = (tree, ref) => (ref ? gitOk(tree, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]) : null);

/**
 * The commit the change is measured from: the merge-base of HEAD with the default branch's ref, as
 * lib/run-verdict.js resolves it with no fallback; on that branch itself its remote-tracking ref (its upstream,
 * else `origin/{name}`); where neither resolves — a configured name no commit answers to included — the plan's base
 * commit. `{base}`, `{base: null}` when nothing resolves, or `{unreadable}` when a ref resolves and git cannot read
 * the merge-base.
 */
function changeBase(tree, planBase) {
  const resolved = resolveDefaultBranch(tree, { fallback: false });
  let ref = resolved ? resolved.ref : null;
  if (resolved && ref === resolved.name && gitOk(tree, ['symbolic-ref', '--quiet', '--short', 'HEAD']) === resolved.name) {
    const upstream = gitOk(tree, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', `${resolved.name}@{upstream}`]);
    ref = commitOf(tree, upstream) ? upstream : commitOf(tree, `refs/remotes/origin/${resolved.name}`) ? `origin/${resolved.name}` : null;
  }
  if (ref && !commitOf(tree, ref)) ref = null;
  if (ref) {
    const base = gitOk(tree, ['merge-base', 'HEAD', ref]);
    return base ? { base } : { unreadable: `git cannot read the merge-base of HEAD with ${ref}` };
  }
  const plan = commitOf(tree, planBase);
  return { base: plan || null };
}

// The paths that differ from `base` — committed, uncommitted and untracked — tree-relative, less what the tree hash
// leaves out; null when git cannot read them.
function changedSince(tree, base) {
  try {
    const diffed = git(tree, ['diff', '--name-only', '-z', '--no-renames', '--relative', base]).split('\0');
    const untracked = git(tree, ['ls-files', '--others', '--exclude-standard', '-z']).split('\0');
    return [...new Set([...diffed, ...untracked].filter(Boolean).map((p) => p.replace(/\\/g, '/')))].filter((p) => !isExcluded(p)).sort();
  } catch {
    return null;
  }
}

function declaredRoles(tree) {
  try {
    const roles = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8')).roles || {};
    const on = (r) => typeof roles[r] === 'string' && roles[r].trim() !== '';
    return { unit: on('unit'), premerge: on('premerge') };
  } catch {
    return { unit: false, premerge: false };
  }
}

// A fast record's failed tests and touched timeouts.
const failuresIn = (r) => [...(Array.isArray(r.failed_tests) ? r.failed_tests : []),
  ...(Array.isArray(r.timed_out) ? r.timed_out.filter((t) => t && t.touched !== false) : [])];

// The test files a red fast record failed in, or null when it cannot name them all: a cut run, a list that is not
// whole, or a red with no failure in it.
function failedFilesOf(r) {
  if (r.reason === 'timeout' || !Array.isArray(r.failed_tests)) return null;
  const items = failuresIn(r).map((t) => t && targetOf(t));
  if (items.length === 0 || items.some((f) => typeof f !== 'string' || f === '')) return null;
  return [...new Set(items)];
}

/**
 * The evidence a merge needs, with no complete record: every file the change holds against its base
 * (changeBase) is covered — the newest fast record of the slug and tree holding it at its current hash is green, or
 * a label stands for it, or the newest whole-unit fast record at the current tree hash is green — and, where the
 * tree declares `premerge`, the newest `premerge` record of the slug and tree at the current tree hash is green.
 * With no base, no changed set can be trusted and only that whole-unit record stands (`whole`). A red that decides a
 * file is cleared by a later green, unfiltered fast record at the red's own tree hash whose `files` hold every test
 * file it failed in, and that timed each failed test placed in a .cs file that names its test project in that project
 * (a source file can belong to two); otherwise its file is `unrepaired` — its failed test files named — only where the red sits at
 * the current tree hash and names them, and `uncovered` everywhere else, for the next tied run to decide. A tree
 * with no `unit` role stands on the `premerge` record alone, and one with neither stands empty.
 *
 * Returns `{ok, uncovered, unrepaired, premerge, whole, unreadable, why}`: `premerge` is null or `missing`, `stale`,
 * `red`; `unreadable` names a change git cannot read, which never stands.
 */
function premergeEvidence({ records, tree, slug, planBase = '' }) {
  const out = { ok: false, uncovered: [], unrepaired: [], premerge: null, whole: false, unreadable: null, why: '' };
  const roles = declaredRoles(tree);
  if (!roles.unit && !roles.premerge) return { ...out, ok: true, why: 'no unit and no premerge role is declared: nothing to run before the merge' };
  const hash = treeHash(tree);
  const now = fileHashes(tree);
  if (hash === null || now === null) return { ...out, unreadable: 'git cannot list the tree' };

  if (roles.premerge) {
    const own = records.filter((r) => r && r.role === 'premerge' && r.slug === slug && sameTree(r.tree, tree)
      && r.verdict !== 'undeclared' && r.verdict !== 'skipped');
    const atHash = own.filter((r) => r.tree_hash === hash).at(-1);
    out.premerge = atHash ? (green(atHash) ? null : 'red') : own.length ? 'stale' : 'missing';
  }

  if (roles.unit) {
    const { later, heldGreenAfter, wholeGreenAfter } = coverageAfter({ records, index: -1, tree, slug, now });
    const from = changeBase(tree, planBase);
    if (from.unreadable) return { ...out, unreadable: from.unreadable };
    if (!from.base) {
      out.whole = !wholeGreenAfter(-1);
    } else if (!wholeGreenAfter(-1)) {
      const changed = changedSince(tree, from.base);
      if (changed === null) return { ...out, unreadable: `git cannot read the change since ${from.base.slice(0, 7)}` };
      const unrepaired = new Set();
      for (const p of changed) {
        if (heldGreenAfter(-1, p)) continue;
        const j = later.findLastIndex((r) => has(r.changed_hashes, p) && r.changed_hashes[p] === hashIn(now, p));
        const red = j >= 0 ? later[j] : null;
        const names = red ? failedFilesOf(red) : null;
        const placed = names ? failuresIn(red).filter((t) => t && t.project &&targetOf(t).endsWith('.cs')) : [];
        const cleared = names && later.some((r, k) => k > j && green(r) && unfiltered(r) && r.tree_hash === red.tree_hash
          && names.every((f) => Array.isArray(r.files) && r.files.includes(f)) && placed.every((t) => ranTestOf(r, targetOf(t), t)));
        if (cleared) continue;
        if (names && red.tree_hash === hash) names.forEach((f) => unrepaired.add(f));
        else out.uncovered.push(p);
      }
      out.unrepaired = [...unrepaired].sort();
    }
  }
  out.ok = !out.whole && !out.premerge && out.uncovered.length === 0 && out.unrepaired.length === 0;
  return out;
}

/**
 * The failures a red complete record names, or null when it cannot name them all: its `failed` list, unless
 * it is empty — a red run that names no failure names nothing; else, for a run the events read whole whose
 * only failures are timed-out tests each placed in a file, the targets of its touched timeouts (an entry not
 * marked untouched counts as touched). `failures_partial` is never read: the failures seen so far are not the list.
 */
function failuresOf(complete) {
  if (!complete || complete.verdict !== 'fail') return null;
  if (Array.isArray(complete.failed)) return complete.failed.length ? complete.failed : null;
  const timedOut = complete.timed_out;
  const timeoutsOnly = complete.reason === 'tests-timed-out' && complete.events === true
    && Array.isArray(complete.failed_tests) && complete.failed_tests.length === 0
    && Array.isArray(timedOut) && timedOut.length > 0
    && timedOut.every((t) => t && typeof t.file === 'string' && t.file !== '');
  return timeoutsOnly ? [...new Set(timedOut.filter((t) => t.touched !== false).map(targetOf))] : null;
}

const isLabelRecord = (r, tree) => Boolean(r) && r.source === 'label-tests' && sameTree(r.tree, tree)
  && typeof r.run_id === 'string' && Boolean(r.files) && typeof r.files === 'object';
const labelRecords = (records, tree) => records.filter((r) => isLabelRecord(r, tree));

// The two-leg checks label-tests.js kept (`checks`) in the label records after the complete one (`index`):
// `at(p, hash)` is the log place of the newest check of that file at that content when it failed, else -1;
// `since(k, now)` whether one failed after place `k` at a file's content in `now`.
function failedChecks(records, index, tree) {
  const newest = new Map();
  records.forEach((r, k) => {
    if (k <= index || !isLabelRecord(r, tree) || !r.checks || typeof r.checks !== 'object') return;
    for (const [p, c] of Object.entries(r.checks)) {
      if (c && typeof c === 'object') newest.set(JSON.stringify([p, c.hash]), { p, hash: c.hash, at: c.passed === true ? -1 : k });
    }
  });
  const at = (p, hash) => { const c = newest.get(JSON.stringify([p, hash])); return c ? c.at : -1; };
  const since = (k, now) => [...newest.values()].some((c) => c.at > k && hashIn(now, c.p) === c.hash);
  return { at, since };
}

/**
 * Whether the files that changed since a complete record (`index`) changed by labels alone: each file whose
 * hash now differs from the record's `file_hashes` has a later label record (label-tests.js) whose `before`
 * is the record's hash for it and whose `after` is its hash now, and whose newest two-leg check at that
 * content, if any, passed. pipeline-gate.js invariant (4) then reads the record as not stale — whichever step
 * close the label record names.
 */
function labelsOnly({ records, index, tree }) {
  const complete = records[index];
  if (!complete || !complete.file_hashes || typeof complete.file_hashes !== 'object') return false;
  const now = fileHashes(tree);
  if (now === null) return false;
  const changed = differing(complete.file_hashes, now);
  if (changed.length === 0) return false;
  const labels = labelRecords(records.slice(index + 1), tree);
  const failed = failedChecks(records, index, tree);
  return changed.every((p) => failed.at(p, hashIn(now, p)) < 0
    && labels.some((l) => l.files[p] && l.files[p].before === hashIn(complete.file_hashes, p) && l.files[p].after === hashIn(now, p)));
}

module.exports = { closeGear, closeEvidence, premergeEvidence, deltaSince, labelsOnly, failuresOf, targetOf, ranTestOf, ONCE };
