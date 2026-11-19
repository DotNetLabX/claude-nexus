'use strict';
/**
 * The machine's sandbox check for Codex seats: the throwaway repository, the probe script its two jobs run,
 * the reading of what they left, the record of the result and the one-check-at-a-time reservation. The jobs
 * themselves are started and waited on by codex-job.js `seat-check`, like any seat job.
 *
 * WHERE. Under the seat folder (lib/codex-seat.js `seatDir`): `check/main`, a git repository's main checkout,
 * and `check/worktree`, a linked worktree of it. Both are reused by the next check; the helper resets them
 * before each job. Each job is told to run `seat-probe.js`, committed in the repository, which tries a commit, a
 * write to `check/seat-check-outside/` beside its working folder, a network call and the three discard
 * commands, and writes each raw result to `seat-check-result.json` in its working folder.
 *
 * WHAT IS READ — never the model's message. The result file and the repository's own state: a commit must not
 * exist in either layout (HEAD moved, or the commit's own exit 0), the outside file must not exist, and the
 * network call must have failed. A missing or unreadable result file, or one without the network call, fails
 * the check. Whether `git clean`, `git checkout --` and `git restore` took effect is recorded from the files
 * they act on, and never fails it.
 *
 * THE RECORD is `check-record.json` in the seat folder, written whole: the result, its reason, each layout's
 * reading, and the machine's name, the Codex version (`codex --version`, or the command NEXUS_CODEX_VERSION_CMD
 * names as a JSON array) and a hash of the user's Codex config file (`config.toml` under CODEX_HOME, else
 * `.codex` in the home folder; `none` where there is no such file). `standing` reads it: a pass or a failure
 * holds only while all three facts are the same; otherwise, or with no record, the check is owed.
 *
 * ONE CHECK AT A TIME. `check.lock` in the seat folder (lib/file-lock.js) names its check; the check marks it fresh
 * before each job and removes it only while it is still its own. A lock left unmarked longer than LOCK_STALE_MS —
 * past one job's own limit and then some — is taken over by one caller at a time, and its path is never empty
 * meanwhile, so no other caller can make a lock of its own beside it.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { seatDir } = require('./codex-seat');
const fileLock = require('./file-lock');

const GIT_MS = 20000;
const VERSION_MS = 15000;
const JOB_MINUTES = 5;
const LOCK_STALE_MS = (2 * JOB_MINUTES + 2) * 60000;
const LAYOUTS = ['main', 'worktree'];
const RESULT_FILE = 'seat-check-result.json';
const PROBE_FILE = 'seat-probe.js';
const OUTSIDE_DIR = 'seat-check-outside';
const COMMITTED = 'committed\n';
const CHANGED = 'changed\n';

const PROBE = `'use strict';
// The seat sandbox check's probe: each try's raw result goes to ${RESULT_FILE}; nothing is judged here.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
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
fs.writeFileSync(path.join(here, '${RESULT_FILE}'), JSON.stringify(out, null, 2));
`;

const BRIEF = `This is a sandbox check run by the Nexus plugin. In your working folder, run \`node ${PROBE_FILE}\` once.
Do not change, fix or rerun anything, whatever it prints. Then reply with the single word: done.
`;

const checkDir = (env = process.env) => path.join(seatDir(env), 'check');
const recordFile = (env = process.env) => path.join(seatDir(env), 'check-record.json');
const lockFile = (env = process.env) => path.join(seatDir(env), 'check.lock');
const outsideFile = (dir) => path.join(path.dirname(dir), OUTSIDE_DIR, `${path.basename(dir)}.txt`);

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
    const v = JSON.parse(env.NEXUS_CODEX_VERSION_CMD || 'null');
    if (Array.isArray(v) && v.length && v.every((x) => typeof x === 'string')) return v;
  } catch { /* the default below */ }
  return null;
}

function codexVersion(env = process.env) {
  const own = versionCommand(env);
  const res = own
    ? spawnSync(own[0], own.slice(1), { encoding: 'utf8', timeout: VERSION_MS, windowsHide: true })
    : process.platform === 'win32'
      ? spawnSync('codex --version', { encoding: 'utf8', timeout: VERSION_MS, windowsHide: true, shell: true })
      : spawnSync('codex', ['--version'], { encoding: 'utf8', timeout: VERSION_MS, windowsHide: true });
  if (res.error || res.status !== 0) return null;
  const line = String(res.stdout || '').split(/\r?\n/).map((l) => l.trim()).find(Boolean);
  return line || null;
}

function configHash(env = process.env) {
  const file = path.join(env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'config.toml');
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
  } catch {
    return 'none';
  }
}

/** The three facts a record holds for. */
const machineFacts = (env = process.env) => ({ machine: os.hostname(), codexVersion: codexVersion(env), configHash: configHash(env) });

/** `{state: 'pass'|'fail'|'owed', reason, record}` for this machine as it stands now. */
function standing(env = process.env, facts = machineFacts(env)) {
  const record = readJson(recordFile(env));
  if (!record || typeof record !== 'object') return { state: 'owed', reason: 'the sandbox check has not run on this machine', record: null };
  const changed = [['machine', 'machine name'], ['codexVersion', 'Codex version'], ['configHash', 'Codex config']]
    .filter(([k]) => record[k] !== facts[k]).map(([, name]) => name);
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

/** `{taken: true}`, or `{taken: false}` while another live check holds it or takes it over. */
function takeLock(env = process.env) {
  return { taken: fileLock.take(lockFile(env), { staleMs: LOCK_STALE_MS, token: OWN_TOKEN }) };
}

const lockHeld = (env = process.env) => fs.existsSync(lockFile(env)) && !fileLock.isStale(lockFile(env), LOCK_STALE_MS);

/** Marks this process's lock fresh, before each of the check's jobs. Another check's lock is left alone. */
const refreshLock = (env = process.env) => fileLock.refresh(lockFile(env), OWN_TOKEN);

function releaseLock(env = process.env) {
  fileLock.release(lockFile(env), OWN_TOKEN);
}

/** Makes or refreshes the repository and its worktree; returns `[{name, dir}]`. Throws where git cannot. */
function prepare(env = process.env) {
  const base = checkDir(env);
  const main = path.join(base, 'main');
  const worktree = path.join(base, 'worktree');
  if (!fs.existsSync(path.join(main, '.git'))) {
    fs.mkdirSync(main, { recursive: true });
    git(main, ['init', '-q', '-b', 'main']);
    for (const [k, v] of [['user.name', 'nexus-seat-check'], ['user.email', 'nexus-seat-check@example.invalid'], ['core.autocrlf', 'false'], ['commit.gpgsign', 'false']]) git(main, ['config', k, v]);
  } else {
    git(main, ['reset', '-q', '--hard']);
    git(main, ['clean', '-fdxq']);
  }
  let current = null;
  try { current = fs.readFileSync(path.join(main, PROBE_FILE), 'utf8'); } catch { /* first check */ }
  if (current !== PROBE) {
    fs.writeFileSync(path.join(main, PROBE_FILE), PROBE);
    fs.writeFileSync(path.join(main, 'tracked.txt'), COMMITTED);
    fs.writeFileSync(path.join(main, 'restore.txt'), COMMITTED);
    git(main, ['add', '-A']);
    git(main, ['commit', '-q', '--no-verify', '-m', 'seat check repository']);
  }
  if (!fs.existsSync(path.join(worktree, '.git'))) {
    git(main, ['worktree', 'prune']);
    git(main, ['worktree', 'add', '-q', '-B', 'seat-check-worktree', worktree, 'main']);
  }
  git(worktree, ['reset', '-q', '--hard', 'main']);
  git(worktree, ['clean', '-fdxq']);
  return [{ name: 'main', dir: main }, { name: 'worktree', dir: worktree }];
}

/** Sets a layout up for its job and returns what the reading compares against. */
function setUp(dir) {
  try { fs.rmSync(outsideFile(dir), { force: true }); } catch { /* not there */ }
  fs.mkdirSync(path.join(dir, 'untracked-probe'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'untracked-probe', 'keep.txt'), 'untracked\n');
  fs.writeFileSync(path.join(dir, 'tracked.txt'), CHANGED);
  fs.writeFileSync(path.join(dir, 'restore.txt'), CHANGED);
  return { head: git(dir, ['rev-parse', 'HEAD']) };
}

const readText = (file) => { try { return fs.readFileSync(file, 'utf8'); } catch { return null; } };

/** One layout's reading after its job: what failed, and what the discard commands did. */
function judge(name, dir, before) {
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
  const reading = {
    result: result ? 'read' : 'missing or unreadable',
    commit: committed ? 'made' : 'refused',
    outside: outside ? 'appeared' : 'absent',
    network,
    clean: fs.existsSync(path.join(dir, 'untracked-probe')) ? 'refused' : 'took effect',
    checkout: readText(path.join(dir, 'tracked.txt')) === COMMITTED ? 'took effect' : 'refused',
    restore: readText(path.join(dir, 'restore.txt')) === COMMITTED ? 'took effect' : 'refused',
  };
  return { reading, failed };
}

module.exports = {
  JOB_MINUTES, LAYOUTS, BRIEF, PROBE, RESULT_FILE, checkDir, recordFile, lockFile, outsideFile, machineFacts, standing,
  writeRecord, takeLock, lockHeld, refreshLock, releaseLock, prepare, setUp, judge,
};
