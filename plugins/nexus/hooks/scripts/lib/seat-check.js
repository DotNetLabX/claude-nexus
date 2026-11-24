'use strict';
/**
 * The machine's sandbox check for Codex seats: the throwaway repository, the probe script its two jobs run,
 * the reading of what they left, the record of the result and the one-check-at-a-time reservation. The jobs
 * themselves are started in boxes (lib/seat-box.js), under the sandbox mode and settings every writing seat job
 * carries, and waited on by codex-job.js `seat-check`.
 *
 * WHERE. Each check makes fresh layouts in a folder of its own under the seat folder (lib/codex-seat.js
 * `seatDir`): `check/{run}/main`, a git repository's main checkout, and `check/{run}/worktree`, a linked worktree
 * of it — never the layouts of an earlier check, whose job may still hold them. A check whose jobs' ends were
 * both confirmed removes its folder once read; any other keeps it. Each job is told to run `seat-probe.js`,
 * committed in the repository, which tries a commit, a write to `seat-check-outside/` beside its working folder, a
 * network call and the three discard commands, starts one detached child that would live two minutes, and writes
 * each raw result to `seat-check-result.json` in its working folder.
 *
 * WHAT IS READ — never the model's message, and only once both jobs' ends are confirmed. The result file and the
 * repository's own state: a commit must not exist in either layout (HEAD moved, or the commit's own exit 0), the
 * outside file must not exist, the network call must have failed, and the detached child must be among what the
 * box ended at its close (`leftovers`) and gone after it. A missing or unreadable result file, one without the
 * network call, or one naming no child fails the check. Whether `git clean`, `git checkout --` and `git restore`
 * took effect is recorded from the files they act on, and never fails it.
 *
 * THE RECORD is `check-record.json` in the seat folder, written whole: the result, its reason, each layout's
 * reading, and the facts it holds for — the machine's name, the Codex version (the launcher's package version, or
 * under the test runner the output of the command NEXUS_CODEX_VERSION_CMD names as a JSON array), a hash of the
 * user's Codex config file (`config.toml` under
 * CODEX_HOME, else `.codex` in the home folder; `none` where there is no such file), the route (`box`), the
 * launcher's resolved path and version, the sandbox mode and the command-line settings — the Windows sandbox's mode
 * and the approval posture among them. `standing` reads it: a pass or
 * a failure holds only while every one of those facts is the same; otherwise, with one missing, or with no
 * record, the check is owed. Codex installed through npm whose package names no version reads as failed, and the
 * check does not run: no pass is bound to an unknown version. The hash of the calling project's `.codex/config.toml` is recorded beside them and
 * not compared: the command-line settings outrank it.
 *
 * ONE CHECK AT A TIME. `check.lock` in the seat folder (lib/file-lock.js) names its check's process; the check
 * removes it only while it is still its own, and a lock whose process is dead is taken over by one caller at a
 * time, its path never empty meanwhile, so no other caller can make a lock of its own beside it.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { seatDir } = require('./codex-seat');
const seatBox = require('./seat-box');
const fileLock = require('./file-lock');
const { testSeam } = require('./codex-entry');

const GIT_MS = 20000;
const VERSION_MS = 15000;
const JOB_MINUTES = 5;
const LOCK_STALE_MS = (2 * JOB_MINUTES + 2) * 60000;
const CHILD_GONE_MS = 5000;
const LAYOUTS = ['main', 'worktree'];
const SANDBOX = 'workspace-write';
const ROUTE = 'box';
const RESULT_FILE = 'seat-check-result.json';
const PROBE_FILE = 'seat-probe.js';
const OUTSIDE_DIR = 'seat-check-outside';
const COMMITTED = 'committed\n';
const CHANGED = 'changed\n';

const PROBE = `'use strict';
// The seat sandbox check's probe: each try's raw result goes to ${RESULT_FILE}; nothing is judged here.
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const NET = "require('https').get('https://example.com', (r) => { process.stdout.write('status ' + r.statusCode); process.exit(0); }).on('error', (e) => { process.stdout.write('error ' + e.message); process.exit(2); }); setTimeout(() => process.exit(3), 10000);";
const here = process.cwd();
const cut = (s) => String(s || '').slice(0, 400);
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: here, encoding: 'utf8', timeout: 20000, windowsHide: true });
  return { status: r.status, error: r.error ? r.error.message : null, stdout: cut(r.stdout), stderr: cut(r.stderr) };
};
const out = { at: new Date().toISOString(), cwd: here };
try { fs.writeFileSync(path.join(here, 'commit-probe.txt'), 'probe'); } catch (e) { out.probeFile = e.message; }
out.add = run('git', ['add', 'commit-probe.txt']);
out.commit = run('git', ['commit', '-q', '--no-verify', '-m', 'seat check probe']);
const outside = path.join(path.dirname(here), '${OUTSIDE_DIR}', path.basename(here) + '.txt');
try {
  fs.mkdirSync(path.dirname(outside), { recursive: true });
  fs.writeFileSync(outside, 'probe');
  out.outside = { path: outside, wrote: true };
} catch (e) {
  out.outside = { path: outside, wrote: false, error: e.message };
}
out.network = run(process.execPath, ['-e', NET]);
out.clean = run('git', ['clean', '-fdq', '--', 'untracked-probe']);
out.checkout = run('git', ['checkout', '--', 'tracked.txt']);
out.restore = run('git', ['restore', '--', 'restore.txt']);
try {
  const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 120000)'], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  out.child = { pid: child.pid };
} catch (e) {
  out.child = { error: e.message };
}
fs.writeFileSync(path.join(here, '${RESULT_FILE}'), JSON.stringify(out, null, 2));
`;

const BRIEF = `This is a sandbox check run by the Nexus plugin. In your working folder, run \`node ${PROBE_FILE}\` once.
Do not change, fix or rerun anything, whatever it prints. Then reply with the single word: done.
`;

const checkDir = (env = process.env) => path.join(seatDir(env), 'check');
const recordFile = (env = process.env) => path.join(seatDir(env), 'check-record.json');
const lockFile = (env = process.env) => path.join(seatDir(env), 'check.lock');
const outsideFile = (dir) => path.join(path.dirname(dir), OUTSIDE_DIR, `${path.basename(dir)}.txt`);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function git(dir, args) {
  const res = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', timeout: GIT_MS, windowsHide: true });
  if (res.error || res.status !== 0) throw new Error(`git ${args[0]} failed in ${dir}: ${String(res.stderr || (res.error && res.error.message) || res.status).trim()}`);
  return String(res.stdout || '').trim();
}

function versionCommand(env) {
  try {
    const v = JSON.parse(testSeam('NEXUS_CODEX_VERSION_CMD', env) || 'null');
    if (Array.isArray(v) && v.length && v.every((x) => typeof x === 'string')) return v;
  } catch { /* the launcher's own below */ }
  return null;
}

// The version of the package the box runs, read from its package.json, never from a command a shell resolves.
function codexVersion(env = process.env) {
  const own = versionCommand(env);
  if (!own) {
    const launcher = launcherOf(env);
    return (launcher && launcher.version) || null;
  }
  const res = spawnSync(own[0], own.slice(1), { encoding: 'utf8', timeout: VERSION_MS, windowsHide: true });
  if (res.error || res.status !== 0) return null;
  const line = String(res.stdout || '').split(/\r?\n/).map((l) => l.trim()).find(Boolean);
  return line || null;
}

function hashOf(file) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
  } catch {
    return 'none';
  }
}

const configHash = (env = process.env) => hashOf(path.join(env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'config.toml'));

function launcherOf(env) {
  const ready = seatBox.available({ env });
  return ready.launcher ? { path: ready.launcher.path || null, version: ready.launcher.version || null } : null;
}

/** The facts a record holds for, and the calling project's config hash beside them. */
const machineFacts = (env = process.env, root = process.cwd()) => ({
  machine: os.hostname(), codexVersion: codexVersion(env), configHash: configHash(env),
  route: ROUTE, launcher: launcherOf(env), sandbox: SANDBOX, settings: [...seatBox.SANDBOX_SETTINGS],
  projectConfigHash: hashOf(path.join(root, '.codex', 'config.toml')),
});

const BOUND = [
  ['machine', 'machine name'], ['codexVersion', 'Codex version'], ['configHash', 'Codex config'], ['route', 'route'],
  ['launcher', 'Codex launcher'], ['sandbox', 'sandbox mode'], ['settings', 'sandbox settings'],
];

/** Why no pass can hold for these facts — Codex installed through npm whose version cannot be read — else null. */
function versionMissing(facts, env = process.env) {
  const real = Boolean(facts.launcher && facts.launcher.path) && !testSeam('NEXUS_CODEX_EXEC', env);
  return real && !(facts.launcher.version && facts.codexVersion)
    ? `the version of the Codex launcher (${facts.launcher.path}) cannot be read from its package, so no sandbox check can be bound to it`
    : null;
}

/** `{state: 'pass'|'fail'|'owed', reason, record}` for this machine as it stands now. */
function standing(env = process.env, facts = machineFacts(env)) {
  const missing = versionMissing(facts, env);
  if (missing) return { state: 'fail', reason: missing, record: null };
  const record = readJson(recordFile(env));
  if (!record || typeof record !== 'object') return { state: 'owed', reason: 'the sandbox check has not run on this machine', record: null };
  const changed = BOUND.filter(([k]) => !(k in record) || JSON.stringify(record[k]) !== JSON.stringify(facts[k])).map(([, name]) => name);
  if (changed.length) return { state: 'owed', reason: `the sandbox check last ran under another ${changed.join(' and ')}, so it is owed again`, record };
  if (record.result === 'pass') return { state: 'pass', reason: null, record };
  return { state: 'fail', reason: `the sandbox check failed on this machine: ${record.reason || 'no reason recorded'}`, record };
}

function writeRecord(record, env = process.env) {
  const file = recordFile(env);
  const tmp = `${file}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(record, null, 2));
  fs.renameSync(tmp, file);
}

const OWN_TOKEN = fileLock.newToken();

/**
 * `{taken: true}`, or `{taken: false}` while another live check holds it or takes it over — with `stranded`, the
 * path a stopped caller left beside it, where no check can take it until a person removes that file.
 */
function takeLock(env = process.env) {
  if (fileLock.take(lockFile(env), { staleMs: LOCK_STALE_MS, token: OWN_TOKEN })) return { taken: true };
  const stranded = fileLock.stranded(lockFile(env));
  return stranded ? { taken: false, stranded } : { taken: false };
}

const lockHeld = (env = process.env) => fileLock.held(lockFile(env), LOCK_STALE_MS);

function releaseLock(env = process.env) {
  fileLock.release(lockFile(env), OWN_TOKEN);
}

/** Makes this check's own repository and worktree; returns `{dir, layouts: [{name, dir}]}`. Throws where git cannot. */
function prepare(env = process.env) {
  const dir = path.join(checkDir(env), `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`);
  const main = path.join(dir, 'main');
  const worktree = path.join(dir, 'worktree');
  fs.mkdirSync(main, { recursive: true });
  git(main, ['init', '-q', '-b', 'main']);
  for (const [k, v] of [['user.name', 'nexus-seat-check'], ['user.email', 'nexus-seat-check@example.invalid'], ['core.autocrlf', 'false'], ['commit.gpgsign', 'false']]) git(main, ['config', k, v]);
  fs.writeFileSync(path.join(main, PROBE_FILE), PROBE);
  fs.writeFileSync(path.join(main, 'tracked.txt'), COMMITTED);
  fs.writeFileSync(path.join(main, 'restore.txt'), COMMITTED);
  git(main, ['add', '-A']);
  git(main, ['commit', '-q', '--no-verify', '-m', 'seat check repository']);
  git(main, ['worktree', 'add', '-q', '-b', 'seat-check-worktree', worktree, 'main']);
  return { dir, layouts: [{ name: 'main', dir: main }, { name: 'worktree', dir: worktree }] };
}

/** Removes a check's own folder; true where it is gone. */
function dropRun(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); return true; } catch { return false; }
}

/** Sets a layout up for its job and returns what the reading compares against. */
function setUp(dir) {
  fs.mkdirSync(path.join(dir, 'untracked-probe'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'untracked-probe', 'keep.txt'), 'untracked\n');
  fs.writeFileSync(path.join(dir, 'tracked.txt'), CHANGED);
  fs.writeFileSync(path.join(dir, 'restore.txt'), CHANGED);
  return { head: git(dir, ['rev-parse', 'HEAD']) };
}

const readText = (file) => { try { return fs.readFileSync(file, 'utf8'); } catch { return null; } };

// The probe's child as the box saw it: `held` (ended with the box), `escaped`, `left running` or `no child`.
function containmentOf(child, leftovers) {
  if (!child) return 'no child';
  const listed = (leftovers || []).find((m) => m && m.pid === child.pid);
  if (!listed) return 'escaped';
  const end = Date.now() + CHILD_GONE_MS;
  let state = seatBox.processState({ pid: listed.pid, created: listed.created || null });
  while (state !== 'gone' && Date.now() < end) {
    sleep(250);
    state = seatBox.processState({ pid: listed.pid, created: listed.created || null });
  }
  return state === 'gone' ? 'held' : 'left running';
}

/** One layout's reading after its job's end was confirmed: what failed, and what the discard commands did. */
function judge(name, dir, before, leftovers) {
  const failed = [];
  const result = readJson(path.join(dir, RESULT_FILE));
  let head = null;
  try { head = git(dir, ['rev-parse', 'HEAD']); } catch { /* read as moved below */ }
  const committed = head !== before.head || Boolean(result && result.commit && result.commit.status === 0);
  if (!result) failed.push(`the ${name} job left no readable result file`);
  if (committed) failed.push(`a commit was made in the ${name} layout`);
  const outside = fs.existsSync(outsideFile(dir));
  if (outside) failed.push(`the ${name} job wrote a file outside its working folder`);
  const network = result && result.network && typeof result.network === 'object' ? (result.network.status === 0 ? 'reached' : 'failed') : 'unread';
  if (network === 'reached') failed.push(`the ${name} job reached the network`);
  if (result && network === 'unread') failed.push(`the ${name} result file holds no network call`);
  const child = result && result.child && Number.isInteger(result.child.pid) ? result.child : null;
  const containment = result ? containmentOf(child, leftovers) : 'unread';
  if (containment === 'no child') failed.push(`the ${name} job's containment probe started no child`);
  if (containment === 'escaped') failed.push(`the ${name} job's detached child (pid ${child.pid}) was not in its box`);
  if (containment === 'left running') failed.push(`the ${name} job's detached child (pid ${child.pid}) still runs after its box closed`);
  const reading = {
    result: result ? 'read' : 'missing or unreadable',
    commit: committed ? 'made' : 'refused',
    outside: outside ? 'appeared' : 'absent',
    network,
    containment,
    clean: fs.existsSync(path.join(dir, 'untracked-probe')) ? 'refused' : 'took effect',
    checkout: readText(path.join(dir, 'tracked.txt')) === COMMITTED ? 'took effect' : 'refused',
    restore: readText(path.join(dir, 'restore.txt')) === COMMITTED ? 'took effect' : 'refused',
  };
  return { reading, failed };
}

module.exports = {
  JOB_MINUTES, LAYOUTS, SANDBOX, BRIEF, PROBE, RESULT_FILE, checkDir, recordFile, lockFile, outsideFile, machineFacts,
  standing, versionMissing, writeRecord, takeLock, lockHeld, releaseLock, prepare, dropRun, setUp, judge,
};
