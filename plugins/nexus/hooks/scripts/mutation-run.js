#!/usr/bin/env node
/**
 * Nexus mutation-run: a mutation battery that never writes the tree under review.
 *
 *   node mutation-run.js --mutants <file.json> --out <report.json> [--tree <path>] [--timeout-ms <n>] [--link <dir>]...
 *
 * THE MANIFEST is lib/mutation-battery.js's: a JSON array of `{id, file, find, replace, tests, line?, note?}`.
 *
 * KILLS ARE SCORED FOR NODE TEST FILES ONLY: a kill is a node test, not failing at the baseline, that fails an
 * assertion (`code: "ERR_ASSERTION"` on its record entry). Another runner's `--files` record names no test, so
 * its mutants read `unscored` and are scored by hand by the same rule.
 *
 * THE COPY is a fresh folder made with `fs.mkdtemp` under CLAUDE_CODE_TMPDIR, else the system temp folder,
 * its root resolved with `fs.realpathSync.native`. It holds every file `git ls-files --cached --others
 * --exclude-standard` lists in the tree and the disk holds, bytes kept — the tree as it is, uncommitted and
 * untracked work included. Each `--link` folder (relative to the tree, its `.` segments dropped, existing,
 * git-ignored there, never named `.git` in any case or resolving into or around the tree's git folder) is
 * linked in — a junction on Windows, a folder symlink elsewhere — for dependencies such as `node_modules`;
 * a mutant's file or test that resolves through a link is refused. The copy gets its own repository:
 * `git init`, its git folder, index, object folder and work tree checked with `git rev-parse` to be its own
 * there and again before every reset (a failed check stops the battery before any write), the links excluded, every attribute that converts bytes unset, exactly the copied files outside
 * `.claude/audit/` added and one commit with signing and hooks off and a fixed identity. Every git call and
 * every child runs with git's
 * location and config overrides (GIT_DIR, GIT_INDEX_FILE, GIT_CONFIG_*, …) removed in any letter case,
 * since Windows reads environment names case-blind, so nothing reaches the user's repository.
 *
 * TESTS RUN THROUGH verify-run.js beside this file — `--profile fast --files {tests} --tree {copy}
 * --timeout-ms {limit}`, with CLAUDE_PROJECT_DIR and the cwd the copy — and each record is read back from the
 * copy's own `.claude/audit/verify-verdict.json`. The baseline runs first, over every mutant's tests, under
 * 10 minutes or `--timeout-ms` where larger: a pass, or a fail whose failures are all named tests, runs the
 * battery with those tests subtracted from every kill; a fail naming no test, a cut baseline, `undeclared`
 * or `skipped` exits 1 and no mutant runs.
 *
 * PER MUTANT, under `--timeout-ms`, else 3 × the baseline's duration and at least 30 s: apply in the copy,
 * run its own tests, then put the copy back to its commit — every file, folder or link a run added removed
 * first, then the committed files reset, `.git`, the links and `.claude/audit/` left alone — and check the
 * mutated file is still the copy's own and holds its pristine bytes; the same reset follows the baseline.
 * `.claude/audit/` is copied but never committed, so a reset never rewinds the run records, and a mutant of a
 * file there is `not-applied`. A failed restore stops the battery at once, with nothing more written.
 * The report is rewritten after every mutant: `{tree, host, baseline, estimate_ms, limit_ms, results,
 * counts, suspects}`, `host` naming the platform the scores hold for. Stdout opens with the estimate
 * (mutants × the baseline's duration) and ends with the counts, one line per mutant and the suspects.
 *
 * ANY EXIT — the end, an error, SIGINT, SIGTERM, SIGHUP, an uncaught exception — ends the running child's
 * tests and removes the copy. On Windows that is `taskkill /T /F` over its tree. Elsewhere verify-run.js gets
 * SIGTERM, so it ends its commands' own process groups, and once it exits, or after 5 s, its group and every
 * group a descendant led when the stop began are killed. The copy is removed only once the tests are known
 * ended: a refused taskkill, a child still running after it, or a group kill that fails leaves the copy where
 * it is, named on stderr, and a child past its limit that cannot be ended stops the battery the same way,
 * named in the report's `error` — a run past its limit settles only once its teardown has finished. A hard
 * kill of this process can leave a copy, in the temp folder only.
 *
 * WHAT IT GUARDS AGAINST: accidental damage by ordinary tests run by cooperating agents. It is no sandbox
 * against hostile test code — a test can still reach any path the user can write, outside the copy.
 *
 * Exit 0 when the battery ran (survivors included); 1 for an invalid manifest, no git tree, a refused
 * `--link`, an unusable baseline or a failed restore; 2 for bad arguments.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const mb = require('./lib/mutation-battery');

const VERIFY_RUN = path.join(__dirname, 'verify-run.js');
const GIT_LOCATION = new Set(['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_COMMON_DIR', 'GIT_NAMESPACE']);
const BASELINE_MIN_MS = 10 * 60 * 1000;
const MUTANT_MIN_MS = 30 * 1000;
const CHILD_GRACE_MS = 60 * 1000;
const TERM_GRACE_MS = 5000;
const GIT_SAFE = ['-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=', '-c', 'user.name=nexus-mutation-run', '-c', 'user.email=mutation-run@nexus.invalid'];
const RAW_BYTES = '* -text -eol -filter -ident -working-tree-encoding\n';
const AUDIT = '.claude/audit';
const underAudit = (rel) => {
  const p = path.posix.normalize(String(rel).replace(/\\/g, '/'));
  return p === AUDIT || p.startsWith(`${AUDIT}/`);
};

const slashed = (p) => String(p).replace(/\\/g, '/');
const inside = (outer, inner) => {
  const rel = path.relative(outer, inner);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};

function cleanEnv(base = process.env) {
  const env = {};
  for (const [key, value] of Object.entries(base)) {
    const name = key.toUpperCase();
    if (GIT_LOCATION.has(name) || name.startsWith('GIT_CONFIG') || name === 'NODE_TEST_CONTEXT') continue;
    env[key] = value;
  }
  return env;
}

function git(cwd, args, input) {
  return spawnSync('git', args, { cwd, encoding: 'utf8', env: cleanEnv(), windowsHide: true, maxBuffer: 256 * 1024 * 1024, input });
}

class Stop extends Error {}
class Teardown extends Stop {}

// The battery's live state, for the exit paths: the copy, its links, the running child and its guard timer.
// `generation` moves on a cancel, so a run that ends after it never resumes the battery.
const active = { copy: null, links: [], child: null, guard: null, generation: 0 };

function exited(child, ms) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    const timer = setTimeout(resolve, ms);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
  });
}

// The process groups of every descendant of `pid`, read from `ps`; never this process's own group.
function descendantGroups(pid, run = (file, args) => spawnSync(file, args, { encoding: 'utf8', windowsHide: true })) {
  const res = run('ps', ['-A', '-o', 'pid=', '-o', 'ppid=', '-o', 'pgid=']);
  if (!res || res.status !== 0) return [];
  const rows = String(res.stdout || '').split('\n').map((l) => l.trim().split(/\s+/).map(Number))
    .filter((r) => r.length === 3 && r.every((n) => Number.isInteger(n) && n > 0));
  const own = (rows.find(([p]) => p === process.pid) || [])[2];
  const kids = new Map();
  for (const [p, pp, g] of rows) kids.set(pp, [...(kids.get(pp) || []), [p, g]]);
  const groups = new Set();
  const queue = [pid];
  const seen = new Set(queue);
  while (queue.length) {
    for (const [p, g] of kids.get(queue.shift()) || []) {
      if (g !== own && g > 1) groups.add(g);
      if (!seen.has(p)) { seen.add(p); queue.push(p); }
    }
  }
  return [...groups];
}

const isDone = (child) => child.exitCode !== null || child.signalCode !== null;

// Ends the running child's tests; true only when they are known ended. On Windows that is a taskkill that
// succeeded and a child that exited; elsewhere, every group kill delivered or finding the group gone.
async function endChild(deps = {}) {
  const child = deps.child || active.child;
  if (!child || isDone(child)) return true;
  const platform = deps.platform || process.platform;
  const endTree = deps.endTree || require('./verify-run').endTree;
  const graceMs = deps.graceMs === undefined ? TERM_GRACE_MS : deps.graceMs;
  const end = (p, pid) => { try { return endTree(p, pid) !== false; } catch { return false; } };
  if (platform === 'win32') {
    const ended = end('win32', child.pid);
    await exited(child, graceMs);
    return ended && isDone(child);
  }
  const kill = deps.kill || ((pid, sig) => process.kill(pid, sig));
  const groups = (deps.groups || descendantGroups)(child.pid);
  try { kill(child.pid, 'SIGTERM'); } catch { /* already gone */ }
  await exited(child, graceMs);
  let ended = true;
  for (const group of new Set([child.pid, ...groups])) if (!end(platform, group)) ended = false;
  return ended;
}

function removeCopy() {
  const copy = active.copy;
  if (!copy) return;
  for (const link of active.links) {
    try { fs.unlinkSync(link); } catch { try { fs.rmdirSync(link); } catch { /* not there */ } }
  }
  try { fs.rmSync(copy, { recursive: true, force: true }); } catch { /* the temp folder keeps it */ }
  active.copy = null;
  active.links = [];
}

const leftWhy = () => `the running tests could not be ended, so the copy is left at ${active.copy}`;

// Resolves null once the tests are ended and the copy removed, or why the copy is left: never removed while
// its tests may still run.
let cancelling = null;
function cancel(deps = {}) {
  if (!cancelling) {
    active.generation++;
    clearTimeout(active.guard);
    cancelling = endChild(deps).catch(() => false)
      .then((ended) => { if (!ended) return leftWhy(); removeCopy(); return null; })
      .finally(() => { cancelling = null; });
  }
  return cancelling;
}

// A `--link` as its path parts, with `.` segments dropped.
const linkParts = (rel) => slashed(rel).split('/').filter((p) => p && p !== '.');

// The copy's exclude line for a link: rooted, its glob characters escaped.
function excludeLine(rel) {
  return `/${linkParts(rel).join('/').replace(/[\\*?[\]!# ]/g, (c) => `\\${c}`)}`;
}

function realOr(p) {
  try { return fs.realpathSync.native(p); } catch { return path.resolve(p); }
}

// The links as normalised relative paths, each checked.
function checkLinks(tree, links) {
  if (!links.length) return [];
  const where = git(tree, ['rev-parse', '--absolute-git-dir', '--git-common-dir']);
  const gitDirs = String(where.stdout || '').split(/\r?\n/).filter(Boolean).map((p) => realOr(path.resolve(tree, p)));
  return links.map((rel) => {
    const parts = linkParts(rel);
    if (path.isAbsolute(rel) || /^[a-zA-Z]:/.test(rel) || parts.includes('..') || !parts.length) throw new Stop(`--link ${rel}: name a folder relative to the tree, with no ..`);
    if (parts.some((p) => p.toLowerCase() === '.git')) throw new Stop(`--link ${rel}: the tree's own git folder is never linked`);
    const at = path.join(tree, ...parts);
    let dir = false;
    try { dir = fs.statSync(at).isDirectory(); } catch { /* missing */ }
    if (!dir) throw new Stop(`--link ${rel}: no such folder in the tree`);
    const target = realOr(at);
    if (gitDirs.some((g) => inside(g, target) || inside(target, g))) {
      throw new Stop(`--link ${rel}: it resolves into or around the tree's git folder, which is never linked`);
    }
    if (git(tree, ['check-ignore', '-q', '--', parts.join('/')]).status !== 0) {
      throw new Stop(`--link ${rel}: the tree does not ignore it, so its files belong in the copy, never behind a link`);
    }
    return parts.join('/');
  });
}

// The git folder, index, object folder and work tree the copy's git would write, each the copy's own, or why
// not. Checked after `git init` and before every reset, since a test can replace `.git` or set a work tree.
function gitLocationsError(copy, run = git) {
  const res = run(copy, ['rev-parse', '--absolute-git-dir', '--git-path', 'index', '--git-path', 'objects', '--show-toplevel']);
  const lines = String(res.stdout || '').split(/\r?\n/).filter(Boolean);
  const own = path.join(copy, '.git');
  const want = [[own, '.git'], [path.join(own, 'index'), '.git/index'], [path.join(own, 'objects'), '.git/objects'], [copy, 'work tree']];
  if (res.status !== 0 || lines.length !== want.length) return `git rev-parse in the copy failed: ${String(res.stderr || '').trim()}`;
  for (let i = 0; i < want.length; i++) {
    const abs = path.resolve(copy, lines[i]);
    const got = fs.existsSync(abs) ? realOr(abs) : path.join(realOr(path.dirname(abs)), path.basename(abs));
    if (got !== want[i][0]) return `the copy's git would write ${slashed(lines[i])}, not its own ${want[i][1]} — nothing is written`;
  }
  return null;
}

function makeCopy(tree, links, tmpRoot) {
  const listed = git(tree, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']);
  if (listed.status !== 0) throw new Stop(`no git tree at ${tree}: ${String(listed.stderr || '').trim()}`);
  const rels = checkLinks(tree, links);
  fs.mkdirSync(tmpRoot, { recursive: true });
  active.copy = fs.realpathSync.native(fs.mkdtempSync(path.join(tmpRoot, 'nexus-mutation-')));
  const copy = active.copy;
  const files = new Set();
  for (const rel of new Set(listed.stdout.split('\0').filter(Boolean))) {
    const from = path.join(tree, rel);
    let stat;
    try { stat = fs.statSync(from); } catch { continue; }
    if (!stat.isFile()) continue;
    const to = path.join(copy, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    files.add(slashed(rel));
  }
  for (const rel of rels) {
    const at = path.join(copy, rel);
    if (fs.existsSync(at)) throw new Stop(`--link ${rel}: the copy already holds files there`);
    fs.mkdirSync(path.dirname(at), { recursive: true });
    fs.symlinkSync(fs.realpathSync.native(path.join(tree, rel)), at, process.platform === 'win32' ? 'junction' : 'dir');
    active.links.push(at);
  }
  const init = git(copy, ['init', '-q', '--template=']);
  if (init.status !== 0) throw new Stop(`git init in the copy failed: ${String(init.stderr || '').trim()}`);
  const located = gitLocationsError(copy);
  if (located) throw new Stop(located);
  const info = path.join(copy, '.git', 'info');
  fs.mkdirSync(info, { recursive: true });
  fs.writeFileSync(path.join(info, 'attributes'), RAW_BYTES);
  if (rels.length) fs.appendFileSync(path.join(info, 'exclude'), rels.map((l) => `${excludeLine(l)}\n`).join(''));
  // The run records stay out of the commit, so a reset never rewinds them.
  const committed = [...files].filter((f) => !underAudit(f));
  if (committed.length) {
    const add = git(copy, [...GIT_SAFE, '--literal-pathspecs', 'add', '-f', '--pathspec-from-file=-', '--pathspec-file-nul'], committed.join('\0'));
    if (add.status !== 0) throw new Stop(`git add in the copy failed: ${String(add.stderr || '').trim()}`);
  }
  const commit = git(copy, [...GIT_SAFE, 'commit', '-q', '--allow-empty', '-m', 'mutation-run baseline']);
  if (commit.status !== 0) throw new Stop(`git commit in the copy failed: ${String(commit.stderr || '').trim()}`);
  const dirs = new Set();
  for (const f of files) for (let d = path.posix.dirname(f); d !== '.'; d = path.posix.dirname(d)) dirs.add(d);
  return { copy, files, dirs, keep: new Set(['.git', AUDIT, ...rels]) };
}

// Puts the copy back to its commit: every file, folder or link a run added removed first, so the reset that
// then writes the committed files back never writes through a link a test made. Never enters `.git`, a link
// or `.claude/audit/`, and writes nothing unless the copy's git locations are still its own. Returns why it
// failed, or null.
function restoreSnapshot(snap) {
  const located = gitLocationsError(snap.copy);
  if (located) return located;
  const sweep = (rel) => {
    for (const name of fs.readdirSync(path.join(snap.copy, rel))) {
      const r = rel ? `${rel}/${name}` : name;
      if (snap.keep.has(r)) continue;
      const abs = path.join(snap.copy, r);
      const st = fs.lstatSync(abs);
      if (st.isSymbolicLink()) {
        try { fs.unlinkSync(abs); } catch { fs.rmdirSync(abs); }
      } else if (st.isDirectory()) {
        sweep(r);
        if (!snap.dirs.has(r) && !fs.readdirSync(abs).length) fs.rmdirSync(abs);
      } else if (!snap.files.has(r)) {
        fs.unlinkSync(abs);
      }
    }
  };
  try { sweep(''); } catch (e) { return `the copy could not be swept: ${e.message}`; }
  const reset = git(snap.copy, [...GIT_SAFE, 'reset', '-q', '--hard', 'HEAD']);
  if (reset.status !== 0) return `git reset in the copy failed: ${String(reset.stderr || '').trim()}`;
  return null;
}

const verdictLog = (copy) => path.join(copy, '.claude', 'audit', 'verify-verdict.json');

function readRecords(copy) {
  let text = '';
  try { text = fs.readFileSync(verdictLog(copy), 'utf8'); } catch { return []; }
  return text.split('\n').filter(Boolean);
}

// One verify-run.js call in the copy; resolves with the record it appended, or null. After a cancel it
// never resolves, so the battery stops where it was. A child past its limit is settled only once its
// teardown has finished: one that cannot be ended rejects with a Teardown, so the battery stops with the
// copy left as it is, even when the child closed while the teardown ran.
function runTests(copy, files, limitMs, deps = {}) {
  const start = deps.spawn || spawn;
  const end = deps.endChild || endChild;
  const graceMs = deps.graceMs === undefined ? CHILD_GRACE_MS : deps.graceMs;
  return new Promise((resolve, reject) => {
    const before = readRecords(copy).length;
    const generation = active.generation;
    const child = start(process.execPath, [VERIFY_RUN, '--profile', 'fast', '--files', ...files, '--tree', copy, '--timeout-ms', String(limitMs)], {
      cwd: copy, env: { ...cleanEnv(), CLAUDE_PROJECT_DIR: copy }, stdio: 'ignore', windowsHide: true, detached: process.platform !== 'win32',
    });
    active.child = child;
    let settled = false;
    let closed = false;
    let tearing = false;
    active.guard = setTimeout(() => {
      tearing = true;
      Promise.resolve().then(() => end()).catch(() => false).then((ended) => {
        tearing = false;
        if (settled || generation !== active.generation) return;
        if (!ended) {
          settled = true;
          reject(new Teardown(leftWhy()));
        } else if (closed) {
          done();
        }
      });
    }, limitMs + graceMs);
    const done = () => {
      closed = true;
      if (settled || tearing) return;
      settled = true;
      clearTimeout(active.guard);
      active.child = null;
      if (generation !== active.generation) return;
      let record = null;
      for (const line of readRecords(copy).slice(before)) {
        try { const r = JSON.parse(line); if (r && r.source === 'verify-run') record = r; } catch { /* torn line */ }
      }
      resolve(record);
    };
    child.on('error', done);
    child.on('close', done);
  });
}

function writeReport(out, report) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = `${out}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(report, null, 2)}\n`);
  fs.renameSync(tmp, out);
}

function baselineProblem(record) {
  if (!record) return 'the baseline wrote no record';
  if (record.reason === 'timeout' || (Array.isArray(record.timed_out) && record.timed_out.length)) return 'the baseline was cut or a test timed out';
  if (record.verdict === 'pass') return null;
  if (record.verdict !== 'fail') return `the baseline read ${record.verdict}${record.reason ? ` (${record.reason})` : ''}`;
  if (!Array.isArray(record.failed_tests) || !record.failed_tests.length) return 'the baseline failed naming no test';
  return null;
}

async function runBattery(opts, deps = {}) {
  const run = deps.runTests || runTests;
  const restoreError = deps.restoreError || mb.restoreError;
  const print = opts.print || ((s) => process.stdout.write(`${s}\n`));
  const tree = path.resolve(opts.tree);
  const report = {
    tree: slashed(tree), host: { platform: process.platform, arch: process.arch, node: process.version },
    baseline: null, estimate_ms: null, limit_ms: null, results: [], counts: null, suspects: [],
  };
  const finish = (code, error, keepCopy = false) => {
    Object.assign(report, mb.summarize(report.results));
    if (error) report.error = error;
    if (report.baseline) writeReport(opts.out, report);
    if (!keepCopy) removeCopy();
    return { code, report };
  };
  try {
    const snap = makeCopy(tree, opts.links || [], opts.tmpRoot || process.env.CLAUDE_CODE_TMPDIR || os.tmpdir());
    const { copy } = snap;
    const union = [...new Set(opts.mutants.flatMap((m) => m.tests))];
    const baseLimit = Math.max(BASELINE_MIN_MS, opts.timeoutMs || 0);
    const base = await run(copy, union, baseLimit);
    const problem = baselineProblem(base);
    const subtracted = base && base.verdict === 'fail' ? base.failed_tests.map((t) => ({ test: t.test, target: t.target })) : [];
    report.baseline = { verdict: base ? base.verdict : null, duration_ms: base ? base.duration_ms : null, subtracted };
    if (problem) {
      report.baseline.why = problem;
      return finish(1, `${problem}: no mutant ran`);
    }
    const reset = restoreSnapshot(snap);
    if (reset) return finish(1, `restore failed after the baseline: ${reset} — no mutant ran`);
    const baseMs = Number(base.duration_ms) || 0;
    report.limit_ms = opts.timeoutMs || Math.max(MUTANT_MIN_MS, 3 * baseMs);
    report.estimate_ms = opts.mutants.length * baseMs;
    print(`estimate: ${opts.mutants.length} mutants × ${baseMs} ms baseline ≈ ${report.estimate_ms} ms; each mutant limited to ${report.limit_ms} ms`);
    writeReport(opts.out, { ...report, ...mb.summarize(report.results) });

    for (const m of opts.mutants) {
      const started = Date.now();
      const result = { id: m.id, file: m.file, status: 'not-applied', killers: [], why: null, duration_ms: 0, note: m.note || null };
      const contained = underAudit(m.file) ? `${slashed(m.file)}: the run records under ${AUDIT}/ are never mutated` : mb.containmentError(copy, m);
      const file = path.join(copy, m.file);
      if (contained) {
        result.why = contained;
      } else {
        const pristine = fs.readFileSync(file);
        const applied = mb.applyMutant(pristine.toString('utf8'), m);
        if (!applied.ok) {
          result.why = applied.why;
        } else {
          fs.writeFileSync(file, applied.text);
          const record = await run(copy, m.tests, report.limit_ms);
          Object.assign(result, mb.classify(record, subtracted));
          const restored = restoreSnapshot(snap) || mb.containmentError(copy, m) || restoreError(file, mb.hashBytes(pristine));
          result.duration_ms = Date.now() - started;
          if (restored) {
            report.results.push(result);
            return finish(1, `restore failed for ${m.id}: ${restored} — the battery stopped`);
          }
        }
      }
      report.results.push(result);
      writeReport(opts.out, { ...report, ...mb.summarize(report.results) });
    }
    const outcome = finish(0);
    const c = outcome.report.counts;
    print(`counts: ${Object.entries(c).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    for (const r of outcome.report.results) {
      print(`${r.id}: ${r.status} — ${r.killers.length ? r.killers.map((k) => k.test).join(', ') : r.why || ''}`);
    }
    for (const s of outcome.report.suspects) print(`${s.test} (${s.target}): ${s.note}`);
    return outcome;
  } catch (e) {
    if (e instanceof Teardown) return finish(1, e.message, true);
    if (e instanceof Stop) return finish(1, e.message);
    finish(1, `the battery failed: ${e && e.message}`);
    throw e;
  }
}

function parseArgs(argv) {
  const out = { links: [] };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (!['--mutants', '--out', '--tree', '--timeout-ms', '--link'].includes(flag)) return { error: `unknown argument ${flag}` };
    if (value === undefined || value.startsWith('--')) return { error: `${flag} needs a value` };
    i++;
    if (flag === '--link') out.links.push(value);
    else out[flag.slice(2)] = value;
  }
  if (!out.mutants || !out.out) return { error: '--mutants <file.json> and --out <report.json> are required' };
  if (out['timeout-ms'] !== undefined && !/^[1-9]\d*$/.test(out['timeout-ms'])) return { error: '--timeout-ms is a whole number of milliseconds' };
  return out;
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.error) {
    process.stderr.write(`mutation-run: ${args.error}\n`);
    return 2;
  }
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(path.resolve(args.mutants), 'utf8')); } catch (e) {
    process.stderr.write(`mutation-run: the manifest cannot be read as JSON (${e.message})\n`);
    return 1;
  }
  const { errors, mutants } = mb.validateManifest(manifest);
  if (errors.length) {
    process.stderr.write(`mutation-run: invalid manifest:\n${errors.map((e) => `  ${e}`).join('\n')}\n`);
    return 1;
  }
  const outcome = await runBattery({
    tree: args.tree || process.cwd(), mutants, out: path.resolve(args.out), links: args.links,
    timeoutMs: args['timeout-ms'] ? Number(args['timeout-ms']) : 0,
  });
  if (outcome.report.error) process.stderr.write(`mutation-run: ${outcome.report.error}\n`);
  return outcome.code;
}

module.exports = { runBattery, runTests, parseArgs, cleanEnv, gitLocationsError, excludeLine, endChild, descendantGroups, cancel };

if (require.main === module) {
  const stop = (code) => {
    cancel().then((left) => { if (left) process.stderr.write(`mutation-run: ${left}\n`); }).finally(() => process.exit(code));
  };
  for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) process.on(sig, () => stop(code));
  process.once('uncaughtException', (e) => {
    process.stderr.write(`mutation-run: ${e && e.stack ? e.stack : e}\n`);
    stop(1);
  });
  main().then((code) => process.exit(code), (e) => {
    process.stderr.write(`mutation-run: ${e && e.stack ? e.stack : e}\n`);
    stop(1);
  });
}
