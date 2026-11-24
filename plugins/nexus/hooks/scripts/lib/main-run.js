'use strict';
/**
 * The full run on a branch after its merges: one running, one waiting, on a clean copy of the branch.
 * main-run.js is its command line.
 *
 * STATE. One file per branch, `.claude/audit/main-run/{key}.json` in the main checkout (usage-level.js
 * `mainCheckout`), so every session and worktree of the repo reads one state; the branch is the resolved default
 * branch (lib/default-branch.js) unless the caller names one. The key is the branch's name where it is lower-case
 * letters, digits, `.`, `_` and `-` only, else that name made safe plus `~` and a hash of the whole name, so two
 * branches never share a key; a state that names another branch is refused. It is read and written only while its
 * lock file beside it is held, and a lock older than 15 s is taken as abandoned. A state file that is there and
 * cannot be read or parsed is refused, never read as empty. It holds `proven` (the last commit a green
 * full run tested), `named` (the commits requests named since, with their slugs), `running` (the run going: its
 * id, commit, process ids and heartbeat), `waiters` (the requests waiting, each with a heartbeat), `answers` (the
 * finished run each answered waiter takes), `runs` (the last 20 finished runs), `red` (the newest red's facts, or
 * null), `cleared` (where the last red was cleared) and the clean copy's path.
 *
 * ONE RUNNING, ONE WAITING. A request names the commit that just reached the branch. A finished run whose commit
 * holds it — or the proven commit — answers it at once, an `unrun` run excepted. Otherwise it waits, keeping a
 * heartbeat; while no run is going, the oldest live waiter runs the suite at the branch's tip, and when a run ends
 * every waiter whose commit it holds takes its result (an answer is kept while its run is among the last 20). So a request made during a run joins the one run that
 * starts after it, at the tip then, holding every merge since.
 *
 * A DEAD RUN. A run whose heartbeat is 60 s old is dead. The taker ends its recorded processes' trees (verify-run.js
 * `endTree`) before the copy is used again; where that cannot be confirmed, the next run takes a fresh copy at a
 * new path and the old one is removed by a later run. A dead waiter is passed over: it never makes the run.
 *
 * THE COPY. A detached git worktree beside the main checkout, made once and moved to the commit under test with a
 * forced checkout and a clean that keeps ignored files. The main checkout's install-only folders (node_modules,
 * .venv, vendor) are linked into it (a junction on Windows) only while every lockfile the two hold is the same,
 * and its untracked pipeline config (.claude/verify.json, .claude/nexus-agents.json) is copied where the commit
 * tracks none (agents-workflow.md § Branch Pre-Flight & Default-Branch Resolution, the worktree duties). A copy
 * that cannot be prepared ends the run `unrun`, with why.
 *
 * THE RUN. verify-run.js `--profile complete --slug main-run --tree {copy}`, with the main checkout as the project
 * root (its record lands in the main checkout's log) and NEXUS_MAIN_RUN_BASE set to the proven commit — on a
 * branch's first run the parent of the oldest commit its requests named — which lib/run-verdict.js reads as the
 * base of the change. Green is a record that counts as passing (lib/run-verdict.js); it moves the proven commit
 * and clears any red. A red keeps its failed test files where its record names every failure (lib/gear-close.js
 * `failuresOf`), else null. A run with no record, or a copy that declares no full role, is `unrun`.
 *
 * A RED. Where a red run covers more than one commit since its base, its failed test files are re-run by name at
 * each covered commit, oldest first, and the first commit where one fails is the red's `trace`, with the slug of
 * the request that named it; a commit lacking every failed file is skipped, and a run by name in which no test ran
 * is passed over, never read as red. A red that names no failure, or a runner whose run by name builds first,
 * leaves the trace empty, naming every covered commit. The fix goes to one session at a time (`claim`, lapsing
 * 30 minutes after its last refresh; `release`). `retest` takes the copy when no run is going — while one is, it
 * answers `busy` at once and waits for nothing — and re-runs the failed files at the tip: all green clears a red
 * whose record names every failure and keeps the commit it was cleared at; any other red is cleared only by a green
 * full run. A run by name is green only where it ran each failed target: a test of each failed file, each failed
 * test of a failed .cs file by name, class and method, and each failed test of a target it times no test under
 * (a .NET test project) by name — and a failed test that names its test project only by a test timed in that
 * project, since one source file can belong to two projects; a timed test naming no project stands for none of
 * them. The red keeps its failed tests, with their projects, for that, and the trace counts a failure by name at a
 * commit only in a project the red failed in. The proven commit moves only on a green full run.
 *
 * TWO PASSES. A red is its feature's (the trace's slug, else the slug of the request that made the run), and the
 * passes it has had are counted per slug in the state (`red_passes`), never on the claim, so a release, a lapsed
 * claim or another feature's red in its place keeps them: the full run that made it is pass 1, and one retest that
 * ran by name — or, for a red that names no failure, one new full run its feature requests with the fix's commit —
 * is pass 2. Every full run counts a pass to the feature that requested it, and every retest that runs by name one to
 * the red's, as its run starts — whatever the feature's count and whether a red stands — so one that dies has still
 * spent it; a red its trace names to another feature gives that pass back and counts it there. A red at pass 2 is
 * `capped`: its claim is released, and `claim`, `retest` and its feature's `request` start nothing and answer
 * `capped`, its own result and exit code (4), never read as red — a request waiting when the cap lands included, and
 * a request a finished red run of the capped red holds or answers, whenever it reads that answer. A feature that has
 * spent both passes with no red standing (two runs that died) is answered `capped` the same way. A green full run
 * clears the count of each feature it holds a merge of and of the red it clears; a retest that clears it, its feature's.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const { mainCheckout } = require('../usage-level');
const { resolveDefaultBranch } = require('./default-branch');
const { countsAsPassing } = require('./run-verdict');
const { failuresOf, targetOf, ranTestOf } = require('./gear-close');
const { runnerOf, loadRunner } = require('./test-runners');

const STATE_DIR = ['.claude', 'audit', 'main-run'];
const VERIFY_RUN = path.join(__dirname, '..', 'verify-run.js');
const TIMING = { heartbeatMs: 10000, deadMs: 60000, pollMs: 2000, claimMs: 30 * 60000 };
const LOCK_STALE_MS = 15000;
const LOCK_WAIT_MS = 30000;
const KEEP_RUNS = 20;
const GIT_TIMEOUT_MS = 120000;
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
const DEPENDENCIES = ['node_modules', '.venv', 'vendor'];
const LOCKFILES = ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock',
  'poetry.lock', 'uv.lock', 'Pipfile.lock', 'composer.lock'];
const PIPELINE_CONFIG = ['.claude/verify.json', '.claude/nexus-agents.json'];
const SHARING = ['EPERM', 'EACCES', 'EBUSY'];
const AFTER_MERGE_PASSES = 2;

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const newId = () => `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;

function git(cwd, args) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, timeout: GIT_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 });
  return { ok: res.status === 0, out: (res.stdout || '').trim(), err: (res.stderr || '').trim() || (res.error ? res.error.message : '') };
}
const commitOf = (cwd, ref) => { const r = git(cwd, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]); return r.ok ? r.out : null; };
// Whether commit `a` is held by commit `b`.
const holds = (cwd, a, b) => Boolean(a && b) && git(cwd, ['merge-base', '--is-ancestor', a, b]).ok;

// No branch name holds `~` (git check-ref-format), so a hashed key never equals a plain one.
const keyOf = (branch) => (/^[a-z0-9._-]+$/.test(branch) ? branch
  : `${branch.replace(/[^A-Za-z0-9._-]/g, '_')}~${crypto.createHash('sha1').update(branch).digest('hex').slice(0, 10)}`);

function contextOf({ root, branch }) {
  const main = mainCheckout(root);
  const name = branch || resolveDefaultBranch(main).name;
  const dir = path.join(main, ...STATE_DIR);
  const key = keyOf(name);
  return { main, branch: name, key, file: path.join(dir, `${key}.json`), lock: path.join(dir, `${key}.lock`) };
}

function tipOf(ctx) {
  return commitOf(ctx.main, `refs/heads/${ctx.branch}`) || commitOf(ctx.main, `refs/remotes/origin/${ctx.branch}`);
}

function fullDeclared(dir) {
  try {
    const full = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'verify.json'), 'utf8')).roles.full;
    return typeof full === 'string' && full.trim() !== '';
  } catch {
    return false;
  }
}

function emptyState(branch) {
  return { branch, proven: null, named: [], running: null, waiters: [], answers: {}, runs: [], red: null, red_passes: {}, cleared: null, copy: null, stale_copies: [] };
}

function readState(ctx) {
  let text = null;
  try {
    text = retrying(() => fs.readFileSync(ctx.file, 'utf8'));
  } catch (e) {
    if (!e || e.code !== 'ENOENT') throw new Error(`main-run: the state ${ctx.file} cannot be read (${(e && (e.code || e.message)) || e}); nothing is changed`);
  }
  let saved = {};
  if (text !== null) {
    try { saved = JSON.parse(text) || {}; } catch (e) { throw new Error(`main-run: the state ${ctx.file} does not parse (${e.message}); remove it to start the branch's state again`); }
  }
  if (typeof saved.branch === 'string' && saved.branch !== ctx.branch) throw new Error(`main-run: the state ${ctx.file} is branch ${saved.branch}'s, not ${ctx.branch}'s`);
  const s = { ...emptyState(ctx.branch), ...saved };
  for (const list of ['named', 'waiters', 'runs', 'stale_copies']) if (!Array.isArray(s[list])) s[list] = [];
  if (!s.answers || typeof s.answers !== 'object') s.answers = {};
  if (!s.red_passes || typeof s.red_passes !== 'object' || Array.isArray(s.red_passes)) s.red_passes = {};
  return s;
}

// The passes a feature's red has had after the merge, kept per slug so a released or lapsed claim, or another
// feature's red in its place, never resets them; a green full run that clears the red clears them all.
const passesOf = (s, slug) => Number(s.red_passes[slug || '']) || 0;
function countPass(s, slug) {
  const n = passesOf(s, slug) + 1;
  s.red_passes[slug || ''] = n;
  if (s.red && (s.red.slug || null) === (slug || null)) s.red.passes = n;
  return n;
}
const spent = (s, red) => Boolean(red) && (red.capped === true || passesOf(s, red.slug) >= AFTER_MERGE_PASSES);
// A red past its passes is held by a blocking backlog row: nobody holds its fix and nothing starts for it.
function capRed(s) {
  s.red.capped = true;
  s.red.claim = null;
}
const cappedWhy = (slug) => `${slug || 'this red'} has had its ${AFTER_MERGE_PASSES} after-merge passes: the red is held by a blocking backlog row, and no run starts for it`;
// A request of a feature whose passes are spent, a red standing or not: its `capped` answer, else null.
function cappedRequest(s, slug) {
  if (passesOf(s, slug) < AFTER_MERGE_PASSES) return null;
  const own = Boolean(s.red) && (s.red.slug || null) === (slug || null);
  if (own) capRed(s);
  return { result: 'capped', commit: null, failed: own ? s.red.failed : null, why: cappedWhy(slug) };
}
// A finished run that answers a request: `capped` where it is the red run of the red that stands past its passes.
function asCapped(s, entry) {
  if (!entry || entry.result !== 'red' || !s.red || s.red.commit !== entry.commit || !spent(s, s.red)) return entry;
  capRed(s);
  return { ...entry, result: 'capped', why: cappedWhy(s.red.slug) };
}

function retrying(op) {
  for (let attempt = 1; ; attempt++) {
    try {
      return op();
    } catch (e) {
      if (attempt >= 20 || !SHARING.includes(e && e.code)) throw e;
      pause(25);
    }
  }
}

function writeState(ctx, state) {
  const tmp = `${ctx.file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(state, null, 1)}\n`);
  retrying(() => fs.renameSync(tmp, ctx.file));
}

// Runs `fn` on the state while its lock is held, and saves what it leaves.
function withState(ctx, fn) {
  fs.mkdirSync(path.dirname(ctx.file), { recursive: true });
  const until = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      fs.closeSync(fs.openSync(ctx.lock, 'wx'));
      break;
    } catch (e) {
      if (e.code !== 'EEXIST' && !SHARING.includes(e.code)) throw e;
      try {
        if (Date.now() - fs.statSync(ctx.lock).mtimeMs > LOCK_STALE_MS) { fs.unlinkSync(ctx.lock); continue; }
      } catch { /* released meanwhile */ }
      if (Date.now() > until) throw new Error(`main-run: the state lock ${ctx.lock} stays held`);
      pause(20);
    }
  }
  try {
    const state = readState(ctx);
    const value = fn(state);
    writeState(ctx, state);
    return value;
  } finally {
    try { retrying(() => fs.unlinkSync(ctx.lock)); } catch { /* left to go stale */ }
  }
}

function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

// Ends a process and what it started; true once nothing of it is left.
function endProcess(pid) {
  if (!alive(pid)) return true;
  // Loaded here, not at the top: the session-start line reads this file's state and must not load the runner.
  require('../verify-run').endTree(process.platform, pid);
  if (process.platform !== 'win32') { try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ } }
  for (let i = 0; i < 40 && alive(pid); i++) pause(50);
  return !alive(pid);
}

const live = (entry, now, timing) => Boolean(entry) && now - Number(entry.heartbeat) < timing.deadMs;

function samePath(a, b) {
  const norm = (p) => { const r = path.resolve(p); return process.platform === 'win32' ? r.toLowerCase() : r; };
  return norm(a) === norm(b);
}

function freshCopyPath(ctx, state) {
  const base = path.join(path.dirname(ctx.main), `${path.basename(ctx.main)}.main-run-${ctx.key}`);
  for (let n = 0; ; n++) {
    const candidate = n ? `${base}-${n}` : base;
    if (!fs.existsSync(candidate) && !state.stale_copies.some((p) => samePath(p, candidate))) return candidate;
  }
}

// The parent of the oldest of `commits` (by commit time, then by ancestry), or the empty tree for a root commit.
function parentOfOldest(ctx, commits) {
  if (commits.length === 0) return null;
  const timed = commits.map((c) => ({ c, t: Number(git(ctx.main, ['log', '-1', '--format=%ct', c]).out) || 0 }));
  timed.sort((x, y) => x.t - y.t || (holds(ctx.main, x.c, y.c) ? -1 : holds(ctx.main, y.c, x.c) ? 1 : 0));
  return commitOf(ctx.main, `${timed[0].c}^`) || EMPTY_TREE;
}

function addNamed(state, commit, slug) {
  if (!state.named.some((n) => n.commit === commit)) state.named.push({ commit, slug, at: Date.now() });
}

// A run or retest past its heartbeat: its processes are ended, and an end that cannot be confirmed retires the copy.
function endDeadRun(state, now, timing) {
  if (!state.running || live(state.running, now, timing)) return;
  const dead = state.running;
  const ended = [dead.child, dead.pid].every((pid) => endProcess(pid));
  if (!ended && state.copy) {
    state.stale_copies.push(state.copy);
    state.copy = null;
  }
  state.running = null;
}

// One pass of a waiting request, under the lock: its answer, the run it is to make, or nothing yet.
function decide(ctx, state, id, timing) {
  const now = Date.now();
  if (state.answers[id]) {
    const run = state.runs.find((r) => r.id === state.answers[id]);
    delete state.answers[id];
    return { answer: asCapped(state, run) || { result: 'unrun', why: 'the run that answered this request is no longer kept' } };
  }
  const me = state.waiters.find((w) => w.id === id);
  if (!me) return { answer: { result: 'unrun', why: 'this request was dropped from the state' } };
  me.heartbeat = now;
  endDeadRun(state, now, timing);
  if (state.running) return {};
  const first = state.waiters.filter((w) => live(w, now, timing)).sort((a, b) => a.at - b.at)[0];
  if (!first || first.id !== id) return {};
  const capped = cappedRequest(state, me.slug);
  if (capped) {
    state.waiters = state.waiters.filter((w) => w.id !== id);
    return { answer: capped };
  }
  const commit = tipOf(ctx);
  if (!commit) return { answer: { result: 'unrun', why: `the branch ${ctx.branch} has no commit` } };
  state.waiters = state.waiters.filter((w) => w.id !== id);
  if (!state.copy) state.copy = freshCopyPath(ctx, state);
  const base = state.proven || parentOfOldest(ctx, state.named.map((n) => n.commit).filter((c) => holds(ctx.main, c, commit))) || commitOf(ctx.main, `${commit}^`) || EMPTY_TREE;
  state.running = {
    id: newId(), commit, base, copy: state.copy, pid: process.pid, child: null,
    session: me.session, slug: me.slug, heartbeat: now, started: now,
  };
  return { run: { ...state.running, stale: [...state.stale_copies] } };
}

function worktreeList(main) {
  return git(main, ['worktree', 'list', '--porcelain']).out.split(/\r?\n/)
    .filter((line) => line.startsWith('worktree ')).map((line) => line.slice('worktree '.length));
}

function isLink(p) {
  try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; }
}

function readOrNull(file) {
  try { return fs.readFileSync(file); } catch { return null; }
}

// Off the event loop's thread, so the run's heartbeat keeps beating through a long checkout.
function gitAsync(cwd, args) {
  return new Promise((resolve) => {
    const child = spawn('git', args, { cwd, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => resolve({ ok: false, err: e.message }));
    child.on('close', (code) => resolve({ ok: code === 0, err: err.trim() }));
  });
}

// Makes or moves the copy to `commit`: `{ok}` or `{ok: false, why}`.
async function prepareCopy(main, copy, commit, stale) {
  await gitAsync(main, ['worktree', 'prune']);
  for (const old of stale) await gitAsync(main, ['worktree', 'remove', '--force', old]);
  if (worktreeList(main).some((p) => samePath(p, copy))) {
    for (const dep of DEPENDENCIES) if (isLink(path.join(copy, dep))) fs.unlinkSync(path.join(copy, dep));
    const moved = await gitAsync(copy, ['checkout', '--detach', '--force', commit]);
    if (!moved.ok) return { ok: false, why: `the copy ${copy} could not be moved to ${commit.slice(0, 7)}: ${moved.err}` };
    const cleaned = await gitAsync(copy, ['clean', '-fdq']);
    if (!cleaned.ok) return { ok: false, why: `the copy ${copy} could not be cleaned: ${cleaned.err}` };
  } else {
    if (fs.existsSync(copy)) return { ok: false, why: `${copy} exists and is not a worktree of this repo` };
    const added = await gitAsync(main, ['worktree', 'add', '--detach', copy, commit]);
    if (!added.ok) return { ok: false, why: `the copy ${copy} could not be made: ${added.err}` };
  }
  for (const rel of PIPELINE_CONFIG) {
    const from = path.join(main, rel);
    if (fs.existsSync(from) && !git(copy, ['ls-files', '--error-unmatch', '--', rel]).ok) {
      fs.mkdirSync(path.dirname(path.join(copy, rel)), { recursive: true });
      fs.copyFileSync(from, path.join(copy, rel));
    }
  }
  const wanted = DEPENDENCIES.filter((dep) => fs.existsSync(path.join(main, dep)) && !fs.existsSync(path.join(copy, dep)));
  if (wanted.length) {
    const differing = LOCKFILES.filter((f) => {
      const a = readOrNull(path.join(main, f));
      const b = readOrNull(path.join(copy, f));
      return (a === null) !== (b === null) || (a !== null && !a.equals(b));
    });
    if (differing.length) return { ok: false, why: `${differing.join(', ')} differs from the main checkout's, so ${wanted.join(', ')} cannot be linked` };
    try {
      for (const dep of wanted) fs.symlinkSync(path.join(main, dep), path.join(copy, dep), process.platform === 'win32' ? 'junction' : 'dir');
    } catch (e) {
      return { ok: false, why: `the dependency folders could not be linked: ${e.message}` };
    }
  }
  return { ok: true };
}

function lastRecord(stdout) {
  const lines = stdout.trim().split(/\r?\n/).reverse();
  for (const line of lines) {
    try {
      const r = JSON.parse(line);
      if (r && typeof r === 'object' && typeof r.verdict === 'string') return r;
    } catch { /* not the record */ }
  }
  return null;
}

function classify(record, status) {
  if (!record) return { result: 'unrun', why: `verify-run wrote no record (exit ${status})` };
  const fields = { run_id: record.run_id || null };
  if (record.verdict === 'undeclared' || record.verdict === 'skipped') return { ...fields, result: 'unrun', why: record.reason || `verify-run: ${record.verdict}` };
  if (countsAsPassing(record)) return { ...fields, result: 'green', failed: [] };
  const failed = failuresOf(record);
  return { ...fields, result: 'red', failed, tests: failedTestsOf(record, failed), why: record.reason || null };
}

// The failed tests behind a red's failed targets, each with its target; null where the record lists none.
function failedTestsOf(record, failed) {
  if (!Array.isArray(failed) || !Array.isArray(record.failed_tests)) return null;
  const timedOut = Array.isArray(record.timed_out) ? record.timed_out.filter((t) => t && t.touched !== false) : [];
  return [...record.failed_tests, ...timedOut].filter((t) => t && failed.includes(targetOf(t)))
    .map((t) => ({ target: targetOf(t), file: t.file, test: t.test, class: t.class, method: t.method, project: projectOf(t) }));
}

// The test project a failure ran in: its `project`, else its target where that is not its file (a .NET failure
// placed in no file); null for a runner that names none.
const projectOf = (t) => (t.project || (t.target && t.target !== t.file ? t.target : null)) || null;

// Whether a green run by name ran `target` (the rule is the header's, A RED).
function ranTarget(record, target, tests) {
  const mine = (Array.isArray(tests) ? tests : []).filter((t) => t && t.target === target);
  if (target.endsWith('.cs')) return ranTestOf(record, target) && mine.every((t) => ranTestOf(record, target, t));
  if (ranTestOf(record, target)) return true;
  return mine.length > 0 && Array.isArray(record.test_times) && mine.every((t) => typeof t.test === 'string' && t.test !== ''
    && record.test_times.some((x) => x && x.project === (projectOf(t) || target) && x.test === t.test && x.class === t.class && x.method === t.method));
}

function beat(ctx, id) {
  try {
    withState(ctx, (s) => { if (s.running && s.running.id === id) s.running.heartbeat = Date.now(); });
  } catch { /* the next beat tries again */ }
}

// verify-run.js in the copy, with the main checkout as its project root: `{record, status}`.
function runVerify(ctx, slotId, copy, argv, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [VERIFY_RUN, '--tree', copy, ...argv], {
      cwd: copy, env: { ...env, CLAUDE_PROJECT_DIR: ctx.main }, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'],
    });
    try { withState(ctx, (s) => { if (s.running && s.running.id === slotId) s.running.child = child.pid; }); } catch { /* the heartbeat still holds the slot */ }
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => process.stderr.write(d));
    const stop = () => { endProcess(child.pid); };
    process.once('exit', stop);
    child.on('error', (e) => {
      process.removeListener('exit', stop);
      resolve({ record: null, status: e.message });
    });
    child.on('close', (status) => {
      process.removeListener('exit', stop);
      resolve({ record: lastRecord(stdout), status });
    });
  });
}

async function runSuite(ctx, run, { env, session }) {
  const { record, status } = await runVerify(ctx, run.id, run.copy, ['--profile', 'complete', '--slug', 'main-run', '--session', session],
    { ...env, NEXUS_MAIN_RUN_BASE: run.base });
  return classify(record, status);
}

// A run by name of a red's failed test files: `green`, `red` (one of them failed), `inconclusive` (no test ran, or
// the run was cut, or a green one that did not run each of them) or `absent` (none of the files is in the copy).
async function byName(ctx, slotId, copy, files, env, session, tests) {
  const present = files.filter((f) => fs.existsSync(path.join(copy, f)));
  if (present.length === 0) return 'absent';
  const plain = { ...env };
  delete plain.NEXUS_MAIN_RUN_BASE;
  const { record } = await runVerify(ctx, slotId, copy, ['--profile', 'fast', '--slug', 'main-run', '--session', session, '--files', ...present], plain);
  if (!record || record.reason === 'no test ran' || record.reason === 'timeout') return 'inconclusive';
  if (record.verdict === 'pass') return Array.isArray(record.test_times) && present.every((f) => ranTarget(record, f, tests)) ? 'green' : 'inconclusive';
  return failedByName(record, present, tests) ? 'red' : 'inconclusive';
}

// Whether a run by name failed one of the `present` targets, in a project the red failed it in where it names one.
function failedByName(record, present, tests) {
  if (!record || record.verdict !== 'fail' || !Array.isArray(record.failed_tests)) return false;
  const named = (t) => String((t && (t.target || t.file)) || '').replace(/\\/g, '/');
  const projectsAt = (f) => (Array.isArray(tests) ? tests : []).filter((k) => k && k.target === f).map(projectOf).filter(Boolean);
  return record.failed_tests.some((t) => {
    const f = named(t);
    const projects = projectsAt(f);
    return present.includes(f) && (projects.length === 0 || projects.includes(t.project));
  });
}

// A runner whose run by name reuses a build (a `buildKey`, as verify-run.js reads it) needs the build first.
function needsBuild(copy, main, env) {
  let cfg = null;
  try { cfg = JSON.parse(fs.readFileSync(path.join(copy, '.claude', 'verify.json'), 'utf8')); } catch { return false; }
  const name = runnerOf(cfg);
  if (!name) return false;
  const ops = loadRunner(name, { root: main, env }).runner;
  return Boolean(ops && typeof ops.buildKey === 'function');
}

/**
 * The commit a red run's failures first appear at: its failed test files re-run by name at each commit it covers
 * since its base, oldest first (first-parent), a commit lacking every failed file skipped and an inconclusive run
 * passed over. `{commit, slug}` — the slug of the request that named it, else null — or `{empty: true, commits,
 * why}` naming every covered commit where the red names no failure, the runner builds first, or no commit fails.
 */
async function traceRed(ctx, run, failed, tests, env, session) {
  const range = run.base === EMPTY_TREE ? run.commit : `${run.base}..${run.commit}`;
  const listed = git(ctx.main, ['rev-list', '--reverse', '--first-parent', range]);
  let slugs = new Map();
  try { slugs = new Map(readState(ctx).named.map((n) => [n.commit, n.slug])); } catch { /* the trace names no slug */ }
  const commits = (listed.ok && listed.out ? listed.out.split(/\s+/) : [run.commit]).map((c) => ({ commit: c, slug: slugs.get(c) || null }));
  const empty = (why) => ({ empty: true, commits, why });
  if (!Array.isArray(failed) || failed.length === 0) return empty('the red does not name every failure, so nothing can be re-run by name');
  if (commits.length === 1) return commits[0];
  if (needsBuild(run.copy, ctx.main, env)) return empty('the runner builds before a run by name');
  for (const c of commits) {
    const prepared = await prepareCopy(ctx.main, run.copy, c.commit, []);
    if (!prepared.ok) return empty(prepared.why);
    if (await byName(ctx, run.id, run.copy, failed, env, session, tests) === 'red') return c;
  }
  return empty('no covered commit failed by name');
}

function finish(ctx, run, res) {
  const { tests, ...outcome } = res;
  return withState(ctx, (s) => {
    const entry = { id: run.id, commit: run.commit, base: run.base, slug: run.slug, session: run.session, at: new Date().toISOString(), failed: null, why: null, ...outcome };
    s.runs.push(entry);
    s.runs = s.runs.slice(-KEEP_RUNS);
    if (s.running && s.running.id === run.id) s.running = null;
    if (res.result === 'green') {
      if (!s.proven || holds(ctx.main, s.proven, run.commit)) s.proven = run.commit;
      const held = s.named.filter((n) => holds(ctx.main, n.commit, run.commit));
      const proven = new Set([run.slug || '', ...held.map((n) => n.slug || '')]);
      s.named = s.named.filter((n) => !held.includes(n));
      if (s.red && holds(ctx.main, s.red.commit, run.commit)) {
        s.cleared = { commit: run.commit, by: 'full run', at: entry.at, red: s.red.commit };
        proven.add(s.red.slug || '');
        s.red = null;
      }
      for (const slug of proven) delete s.red_passes[slug];
    } else if (res.result === 'red') {
      const slug = (res.trace && !res.trace.empty && res.trace.slug) || run.slug || null;
      const counted = run.counted !== undefined;
      if (counted && run.counted !== slug) s.red_passes[run.counted || ''] = Math.max(passesOf(s, run.counted) - 1, 0);
      const passes = counted && run.counted === slug ? Math.max(passesOf(s, slug), 1) : passesOf(s, slug) + 1;
      s.red_passes[slug || ''] = passes;
      s.red = { commit: run.commit, base: run.base, run_id: res.run_id || null, failed: res.failed, tests: tests || null, at: entry.at,
        covers: s.named.filter((n) => holds(ctx.main, n.commit, run.commit)), trace: res.trace || null, claim: (s.red && s.red.claim) || null, slug, passes };
      if (passes >= AFTER_MERGE_PASSES) {
        capRed(s);
        entry.result = 'capped';
        entry.why = cappedWhy(slug);
      }
    }
    s.waiters = s.waiters.filter((w) => {
      if (!holds(ctx.main, w.commit, run.commit)) return true;
      s.answers[w.id] = run.id;
      return false;
    });
    const kept = new Set(s.runs.map((r) => r.id));
    for (const [waiter, runId] of Object.entries(s.answers)) if (!kept.has(runId)) delete s.answers[waiter];
    s.stale_copies = s.stale_copies.filter((p) => fs.existsSync(p));
    return entry;
  });
}

// Every full run is its feature's next pass, saved as the suite starts: the slug it was counted to, or undefined
// where the state could not be written and it counts at its finish instead.
function countRunPass(ctx, run) {
  try {
    return withState(ctx, (s) => {
      if (!s.running || s.running.id !== run.id) return undefined;
      countPass(s, run.slug);
      return run.slug || null;
    });
  } catch {
    return undefined;
  }
}

async function makeRun(ctx, run, { env, session, timing }) {
  const timer = setInterval(() => beat(ctx, run.id), timing.heartbeatMs);
  let res;
  try {
    const prepared = await prepareCopy(ctx.main, run.copy, run.commit, run.stale);
    if (prepared.ok) run.counted = countRunPass(ctx, run);
    res = prepared.ok ? await runSuite(ctx, run, { env, session }) : { result: 'unrun', why: prepared.why };
    if (res.result === 'red') res.trace = await traceRed(ctx, run, res.failed, res.tests, env, session);
  } finally {
    clearInterval(timer);
  }
  return finish(ctx, run, res);
}

function report(ctx, entry, requested) {
  return { result: entry.result, branch: ctx.branch, commit: entry.commit || null, requested, run_id: entry.run_id || null, failed: entry.failed ?? null, why: entry.why || null };
}

/**
 * `{code, line}` for one request: `code` 0 for green, `unrun` and `undeclared`, 1 for red, 2 for a request that
 * names no commit on the branch, 4 for `capped` (never read as red); `line` the JSON printed.
 */
async function request({ root, slug, session, commit, branch, env = process.env, timing = TIMING }) {
  const ctx = contextOf({ root, branch });
  if (!fullDeclared(ctx.main)) return { code: 0, line: { result: 'undeclared', branch: ctx.branch, why: 'no roles.full declared in .claude/verify.json' } };
  const sha = commitOf(ctx.main, commit);
  const tip = tipOf(ctx);
  if (!sha || !tip || !holds(ctx.main, sha, tip)) return { code: 2, error: `main-run: ${commit} is not on ${ctx.branch}` };
  const id = newId();
  const done = (entry) => ({ code: entry.result === 'red' ? 1 : entry.result === 'capped' ? 4 : 0, line: report(ctx, entry, sha) });
  const at = withState(ctx, (s) => {
    const held = [...s.runs].reverse().find((r) => r.result !== 'unrun' && holds(ctx.main, sha, r.commit));
    if (held) return asCapped(s, held);
    if (s.proven && holds(ctx.main, sha, s.proven)) return { result: 'green', commit: s.proven };
    const capped = cappedRequest(s, slug);
    if (capped) return capped;
    addNamed(s, sha, slug);
    const now = Date.now();
    s.waiters.push({ id, slug, session, commit: sha, at: now, heartbeat: now, pid: process.pid });
    return null;
  });
  if (at) return done(at);
  for (;;) {
    const step = withState(ctx, (s) => decide(ctx, s, id, timing));
    if (step.answer) return done(step.answer);
    if (step.run) return done(await makeRun(ctx, step.run, { env, session, timing }));
    await sleep(timing.pollMs);
  }
}

const holderOf = (red, now, timing) => (red && red.claim && now - Number(red.claim.refreshed) < timing.claimMs ? red.claim.session : null);

/** The fix of the red goes to the first session that asks; a later one is told who holds it (`code` 1). */
function claim({ root, session, branch, timing = TIMING }) {
  const ctx = contextOf({ root, branch });
  return withState(ctx, (s) => {
    if (!s.red) return { code: 1, line: { claimed: false, holder: null, branch: ctx.branch, red: null, why: `no red on ${ctx.branch}` } };
    if (spent(s, s.red)) {
      capRed(s);
      return { code: 4, line: { claimed: false, holder: null, branch: ctx.branch, red: s.red.commit, result: 'capped', failed: s.red.failed, why: cappedWhy(s.red.slug) } };
    }
    const now = Date.now();
    const holder = holderOf(s.red, now, timing);
    if (holder && holder !== session) {
      return { code: 1, line: { claimed: false, holder, branch: ctx.branch, red: s.red.commit, since: s.red.claim.at, why: `${holder} holds the fix` } };
    }
    s.red.claim = holder === session ? { ...s.red.claim, refreshed: now } : { session, at: now, refreshed: now };
    return { code: 0, line: { claimed: true, holder: session, branch: ctx.branch, red: s.red.commit, failed: s.red.failed, trace: s.red.trace || null } };
  });
}

function release({ root, session, branch }) {
  const ctx = contextOf({ root, branch });
  return withState(ctx, (s) => {
    const held = s.red && s.red.claim;
    if (!held || held.session !== session) return { code: 0, line: { released: false, holder: held ? held.session : null, branch: ctx.branch } };
    s.red.claim = null;
    return { code: 0, line: { released: true, holder: null, branch: ctx.branch } };
  });
}

/**
 * Re-runs the red's failed test files by name at the branch's tip, in the copy, once no run is going. All green
 * clears a red whose record names every failure; the state keeps the commit it was cleared at (`cleared`), and the
 * proven commit stays. Any other red is cleared only by a green full run. The holder's retest refreshes its claim.
 */
async function retest({ root, session, branch, env = process.env, timing = TIMING }) {
  const ctx = contextOf({ root, branch });
  const tip = tipOf(ctx);
  const out = (code, fields) => ({ code, line: { branch: ctx.branch, commit: tip, ...fields } });
  const capped = (red) => out(4, { result: 'capped', cleared: false, red: red.commit, failed: red.failed, why: cappedWhy(red.slug) });
  const red = withState(ctx, (s) => {
    if (spent(s, s.red)) capRed(s);
    else if (s.red && holderOf(s.red, Date.now(), timing) === session) s.red.claim.refreshed = Date.now();
    return s.red;
  });
  if (!red) return out(0, { result: 'green', cleared: false, red: null, why: `no red on ${ctx.branch}` });
  if (red.capped) return capped(red);
  if (!Array.isArray(red.failed) || red.failed.length === 0) {
    return out(1, { result: 'red', cleared: false, red: red.commit, failed: red.failed,
      why: 'the red does not name every failure: only a green full run clears it — request one with the fix commit' });
  }
  if (!tip) return out(0, { result: 'unrun', cleared: false, red: red.commit, failed: red.failed, why: `the branch ${ctx.branch} has no commit` });
  const id = newId();
  const slot = withState(ctx, (s) => {
    if (spent(s, s.red)) {
      capRed(s);
      return 'capped';
    }
    const now = Date.now();
    endDeadRun(s, now, timing);
    if (s.running) return null;
    if (!s.copy) s.copy = freshCopyPath(ctx, s);
    s.running = { id, kind: 'retest', commit: tip, copy: s.copy, pid: process.pid, child: null, session, slug: null, heartbeat: now, started: now };
    return { ...s.running, stale: [...s.stale_copies] };
  });
  if (slot === 'capped') return capped(red);
  if (!slot) {
    return out(1, { result: 'busy', cleared: false, red: red.commit, failed: red.failed,
      why: `a run is going on ${ctx.branch}: the red stands until a run proves the fix — request one with the fix commit, or retest once this one ends` });
  }
  const timer = setInterval(() => beat(ctx, id), timing.heartbeatMs);
  let verdict = 'inconclusive';
  let why = null;
  let ran = false;
  try {
    const prepared = await prepareCopy(ctx.main, slot.copy, tip, slot.stale);
    const missing = prepared.ok ? red.failed.filter((f) => !fs.existsSync(path.join(slot.copy, f))) : [];
    if (!prepared.ok) {
      verdict = 'unrun';
      why = prepared.why;
    } else if (missing.length) {
      why = `${missing.join(', ')} is not at the tip: only a green full run clears the red`;
    } else {
      ran = true;
      withState(ctx, (s) => { countPass(s, red.slug); });
      verdict = await byName(ctx, id, slot.copy, red.failed, env, session, red.tests);
      if (verdict === 'inconclusive') why = 'the run by name did not run each failed test, or was cut: only a green full run clears the red';
    }
  } finally {
    clearInterval(timer);
  }
  return withState(ctx, (s) => {
    if (s.running && s.running.id === id) s.running = null;
    s.stale_copies = s.stale_copies.filter((p) => fs.existsSync(p));
    const fields = { red: red.commit, failed: red.failed };
    if (verdict === 'unrun') return out(0, { ...fields, result: 'unrun', cleared: false, why });
    if (verdict !== 'green') {
      if (ran && passesOf(s, red.slug) >= AFTER_MERGE_PASSES) {
        if (s.red && s.red.commit === red.commit) capRed(s);
        return capped(red);
      }
      return out(1, { ...fields, result: 'red', cleared: false, why });
    }
    delete s.red_passes[red.slug || ''];
    if (!s.red || s.red.commit !== red.commit) return out(0, { ...fields, result: 'green', cleared: false, why: 'the red was cleared or replaced meanwhile' });
    s.cleared = { commit: tip, by: 'retest', at: new Date().toISOString(), red: red.commit, session };
    s.red = null;
    return out(0, { ...fields, failed: [], result: 'green', cleared: true, why: null });
  });
}

function status({ root, branch, timing = TIMING }) {
  const ctx = contextOf({ root, branch });
  const s = readState(ctx);
  const now = Date.now();
  return {
    branch: ctx.branch, proven: s.proven,
    running: s.running ? { ...s.running, live: live(s.running, now, timing) } : null,
    waiting: s.waiters.filter((w) => live(w, now, timing)),
    red: s.red, holder: holderOf(s.red, now, timing), cleared: s.cleared, last: s.runs.at(-1) || null, copy: s.copy,
  };
}

module.exports = { request, status, claim, release, retest, contextOf, withState, readState, ranTarget, failedTestsOf, failedByName, TIMING };
