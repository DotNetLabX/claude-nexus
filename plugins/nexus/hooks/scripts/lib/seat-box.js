'use strict';
/**
 * The box a seat or direct job runs in: one `codex exec` job, or one command line, inside a Windows job object its keeper
 * owns (lib/seat-box.ps1), so every process the job starts stays inside it and ends when the box is closed.
 *
 *   node seat-box.js --try    one read-only Codex job through the box, a one-word reply; prints its end
 *
 * THE BOX FOLDER is `{seat folder}/box/{box id}/` (lib/codex-seat.js `seatDir`): `request.json` (what to run,
 * written by `start`), `prompt.md`, `claim`, `status.json` and `events.jsonl` (written by the keeper),
 * `output.log` for a command's output, `stderr.log`,
 * `keeper.log` (the keeper's own output) and `cut.request`.
 * A start refuses a seat folder — or a box folder, once made and resolved — that lies inside the tree or inside a
 * temporary folder the job may write (the system's and those TEMP, TMP and TMPDIR name), each path resolved through
 * its nearest folder that exists and compared by whole path segments.
 *
 * START. `start` writes the request, then starts the keeper hidden through Windows PowerShell, which reads
 * lib/seat-box.ps1 as text, so no execution policy stops it; a detached node process holds the keeper and
 * exits with it (`keeperPid` is that holder's). It waits for the keeper's
 * `status.json`: a launched job returns its box id and the keeper; a keeper that reports it could not launch, or
 * exits without a status, returns `unavailable` with the keeper's own words. ONE CLAIM DECIDES A LATE KEEPER:
 * the keeper creates `claim` holding `launch` just before it creates the job's process; a start that has waited
 * 30 s, or whose holder exited with no status, creates it holding `abandon` and reports `unavailable`. Whichever
 * create wins stands — a keeper that loses never launches and writes a status saying so; a start that loses waits
 * for the keeper's status while the holder lives and 30 s after it has gone, then returns `unavailable` with
 * `launchClaimed`: the job may have launched, so its tree stays held. `abandon` makes that claim for a box whose
 * start never reported, its folder made first where it is missing, so no later start or keeper launches it.
 * `limitMs` gives the keeper a limit of its own, past which it cuts the job itself; every caller passes its job's.
 * A direct request adds the route, dispatch kind, label, session root, start, deadline and Codex home for
 * collection. The start has a single 60 s launch window. It saves the holder's identity in `holder.json` before the keeper can claim
 * the launch, and the keeper writes its own identity into the launch claim before creating the job process.
 *
 * THE LAUNCHER is node with the npm package's `bin/codex.js`, found through the `codex` shim on PATH, read for
 * the package and never run; its version is the package's own. The command line is fixed: `exec --json
 * --skip-git-repo-check --sandbox {mode} -C {tree} [-m {model}] [-c model_reasoning_effort={effort}]`, then
 * SANDBOX_SETTINGS each as `-c` — no writable folder added, no network, the Windows sandbox's elevated mode and no
 * approval asked — then `-`, the prompt on stdin; settings given on the command line outrank every Codex config
 * file, and the sandbox check's record binds them. A command runs as `cmd.exe /d /s /c "{command}"`. The job's environment is
 * the caller's without NODE_TEST_CONTEXT and without any NEXUS_CODEX_ variable, with CLAUDE_PROJECT_DIR set to
 * the tree; it reaches the job through the keeper and is never written to disk.
 *
 * WINDOWS ONLY. On any other `process.platform` a start returns `unavailable`, naming the platform, and starts
 * nothing.
 *
 * STATUS AND CUT. `readBox` reads `status.json` — an unparsable read is read once more, then `unreadable`.
 * `status` adds whether the keeper lives by pid and creation time: a lookup with no answer is `unknown`, a pid
 * whose creation time differs is gone. `cut` writes `cut.request`, which the keeper reads every 2 s, and waits
 * up to 30 s for `boxClosed`; then it ends the keeper through one handle, only where that handle's creation
 * time is the keeper's. A status naming another box than the one cut is never acted on. `boxLeft` says whether the box's job object still opens and whether each listed process
 * lives, by pid and creation time. `sessionOf` names the Windows session a process runs in, the session that scopes
 * the job object's `Local\` name. `status.json` names the box's tree.
 *
 * TEST SEAMS, honoured only under the test runner (lib/codex-entry.js `testSeam`): NEXUS_CODEX_EXEC names
 * another launcher — a `.js`, `.cjs` or `.mjs` file runs under node — and NEXUS_CODEX_BOX names a stand-in
 * keeper, a node script given the box folder, which writes the same files on any platform and never runs the
 * real launcher unless NEXUS_CODEX_EXEC names one; `available` then answers yes on any platform. Under the test
 * runner the temporary folders a start compares against are only those NEXUS_CODEX_TEMP_ROOTS lists as JSON.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const { seatDir } = require('./codex-seat');
const { testSeam } = require('./codex-entry');

const KEEPER = path.join(__dirname, 'seat-box.ps1');
const START_WAIT_MS = 30000;
const CLAIMED_WAIT_MS = 30000;
const DIRECT_START_MS = 60000;
const CUT_WAIT_MS = 30000;
const LOOKUP_MS = 60000;
const SANDBOXES = ['workspace-write', 'read-only'];
const SANDBOX_SETTINGS = Object.freeze([
  'sandbox_workspace_write.writable_roots=[]', 'sandbox_workspace_write.network_access=false',
  "windows.sandbox='elevated'", "approval_policy='never'",
]);
const BOX_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const JOB_VARIABLE = /^(NODE_TEST_CONTEXT|NEXUS_CODEX_.*|CLAUDE_PROJECT_DIR)$/i;

// Windows PowerShell's console host does not start without a console, so the detached process is node, which
// gives the keeper a hidden console of its own and lives exactly as long as it does.
const HOLDER = [
  "const { spawn } = require('child_process');",
  'const [file, args] = JSON.parse(process.argv[1]);',
  "const keeper = spawn(file, args, { stdio: 'inherit', windowsHide: true });",
  "keeper.on('error', (err) => { process.stderr.write(`the keeper could not start: ${err.message}\\n`); process.exit(1); });",
  "keeper.on('exit', (code) => process.exit(code === null ? 1 : code));",
].join('\n');

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const boxRoot = (env = process.env) => path.join(seatDir(env), 'box');
const boxDir = (boxId, env = process.env) => path.join(boxRoot(env), boxId);
const newBoxId = () => `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
const lookupTimeout = (until) => Math.min(LOOKUP_MS, Math.max(0, until - Date.now()));

/** One argument as the Windows C runtime splits a command line back into arguments. */
function quoteArg(arg) {
  const s = String(arg);
  if (s !== '' && !/[\s"]/.test(s)) return s;
  let out = '"';
  let slashes = 0;
  for (const ch of s) {
    if (ch === '\\') { slashes++; continue; }
    if (ch === '"') out += `${'\\'.repeat(slashes * 2 + 1)}"`;
    else out += `${'\\'.repeat(slashes)}${ch}`;
    slashes = 0;
  }
  return `${out}${'\\'.repeat(slashes * 2)}"`;
}
const commandLine = (file, args) => [file, ...args].map(quoteArg).join(' ');

// A junction or a short name above a folder not made yet still resolves, through the nearest folder that exists.
function folded(p) {
  let at = path.resolve(p);
  const rest = [];
  for (;;) {
    try { at = fs.realpathSync.native(at); break; } catch { /* resolved from the folder above */ }
    const up = path.dirname(at);
    if (up === at) break;
    rest.unshift(path.basename(at));
    at = up;
  }
  const real = path.join(at, ...rest);
  return process.platform === 'win32' ? real.toLowerCase() : real;
}
function isUnder(child, parent) {
  const rel = path.relative(folded(parent), folded(child));
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
}

function tempRoots(env) {
  if (env.NODE_TEST_CONTEXT) {
    let named = [];
    try { named = JSON.parse(testSeam('NEXUS_CODEX_TEMP_ROOTS', env) || '[]'); } catch { /* none named */ }
    return Array.isArray(named) ? named.filter((r) => typeof r === 'string' && r) : [];
  }
  return [os.tmpdir(), env.TEMP, env.TMP, env.TMPDIR, process.platform === 'win32' ? null : '/tmp'].filter(Boolean);
}

// Null where no folder of `dirs` lies inside the tree or a temporary folder the job may write, else why.
function insideWritable(dirs, tree, env) {
  const roots = [['the tree', tree], ...tempRoots(env).map((r) => [`a temporary folder the job may write (${r})`, r])];
  for (const dir of dirs) {
    const hit = roots.find(([, root]) => isUnder(dir, root));
    if (hit) return `the seat folder (${dir}) lies inside ${hit[0]}, where the job could write its own box's record — no job started`;
  }
  return null;
}

function jobEnv(env, tree) {
  const out = {};
  for (const [key, value] of Object.entries(env)) if (value !== undefined && !JOB_VARIABLE.test(key)) out[key] = value;
  out.CLAUDE_PROJECT_DIR = tree;
  return out;
}

const scriptLauncher = (file) => (/\.(c|m)?js$/i.test(file)
  ? { application: process.execPath, args: [file], path: file }
  : { application: file, args: [], path: file });

/** `{application, args, path, version}` for the Codex launcher, or `{unavailable}`. */
function resolveLauncher(env = process.env) {
  const named = testSeam('NEXUS_CODEX_EXEC', env);
  if (named) return { ...scriptLauncher(path.resolve(named)), version: null };
  const dirs = String(env.PATH || env.Path || '').split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    for (const shim of ['codex.cmd', 'codex']) {
      let text;
      try { text = fs.readFileSync(path.join(dir, shim), 'utf8'); } catch { continue; }
      if (!/node_modules[\\/]@openai[\\/]codex[\\/]bin[\\/]codex\.js/.test(text)) continue;
      const pkg = path.join(dir, 'node_modules', '@openai', 'codex');
      const script = path.join(pkg, 'bin', 'codex.js');
      if (!fs.existsSync(script)) continue;
      let version = null;
      try { version = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'), 'utf8')).version || null; } catch { /* no version to name */ }
      return { application: process.execPath, args: [script], path: script, version };
    }
  }
  return { unavailable: 'no Codex installed through npm was found on PATH (a codex shim naming node_modules/@openai/codex/bin/codex.js)' };
}

const windowsOnly = (platform) => `a seat job runs inside a Windows job object, so it runs on Windows only — this machine is ${platform}`;

/** `{launcher}` where a box can start a Codex job here, else `{unavailable}`. */
function available({ env = process.env, platform = process.platform } = {}) {
  const standIn = testSeam('NEXUS_CODEX_BOX', env);
  if (standIn && !testSeam('NEXUS_CODEX_EXEC', env)) return { launcher: { path: null, version: null, standIn: path.resolve(standIn) } };
  if (!standIn && platform !== 'win32') return { unavailable: windowsOnly(platform) };
  const launcher = resolveLauncher(env);
  return launcher.unavailable ? launcher : { launcher };
}

const PS_QUOTES = new RegExp(`['${String.fromCharCode(0x2018, 0x2019, 0x201a, 0x201b)}]`, 'g');
const psQuote = (s) => `'${String(s).replace(PS_QUOTES, (q) => q + q)}'`;
const encoded = (script) => Buffer.from(script, 'utf16le').toString('base64');

function keeperArgs(mode, { box = '', arg = '' } = {}) {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$ProgressPreference = 'SilentlyContinue'",
    "if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') { Write-Output ('the keeper cannot run: PowerShell runs in ' + $ExecutionContext.SessionState.LanguageMode + ' mode, where its inline C# cannot load'); exit 3 }",
    `$keeper = [ScriptBlock]::Create([IO.File]::ReadAllText(${psQuote(KEEPER)}))`,
    `& $keeper -Mode ${psQuote(mode)} -Box ${psQuote(box)} -Arg ${psQuote(arg)}`,
  ].join('\n');
  return ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded(script)];
}

// One short keeper call (`check`, `kill`): its last output line as JSON, or null where it gave no answer.
function keeperCall(mode, payload, timeout = LOOKUP_MS) {
  if (timeout <= 0) return null;
  const arg = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
  const res = spawnSync('powershell.exe', keeperArgs(mode, { arg }), { encoding: 'utf8', timeout, windowsHide: true });
  if (res.error || res.status !== 0) return null;
  const line = String(res.stdout || '').trim().split(/\r?\n/).pop();
  try { return JSON.parse(line); } catch { return null; }
}

function readStatusFile(dir, until = Infinity) {
  const file = path.join(dir, 'status.json');
  for (let i = 0; i < 2; i++) {
    let text = null;
    try { text = fs.readFileSync(file, 'utf8'); } catch (err) { if (err.code === 'ENOENT') return { read: 'missing', status: null }; }
    if (text !== null) {
      try {
        const value = JSON.parse(text.replace(/^\uFEFF/, ''));
        if (value && typeof value === 'object') return { read: 'ok', status: value };
      } catch { /* read once more */ }
    }
    if (i === 0) {
      const retry = Math.min(150, until - Date.now());
      if (retry <= 0) break;
      sleep(retry);
    }
  }
  return { read: 'unreadable', status: null };
}

/** `{read: ok | missing | unreadable, status}` for a box's `status.json`. */
const readBox = (boxId, { env = process.env, until = Infinity } = {}) => readStatusFile(boxDir(boxId, env), until);

function pidLives(pid) {
  try { process.kill(pid, 0); return true; } catch (err) { return err.code === 'EPERM'; }
}

/** A process's creation time as the keeper writes it; null where no such process runs, undefined for no answer. */
function processCreated(pid, platform = process.platform, timeout = LOOKUP_MS) {
  if (!Number.isInteger(pid) || pid <= 0) return null;
  if (platform === 'win32') {
    const script = `$p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue; if ($null -eq $p) { 'none' } else { try { $p.StartTime.ToUniversalTime().ToString('o', [Globalization.CultureInfo]::InvariantCulture) } catch { 'unknown' } }`;
    const res = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded(script)], { encoding: 'utf8', timeout, windowsHide: true });
    if (res.error || res.status !== 0) return undefined;
    const out = String(res.stdout || '').trim().split(/\r?\n/).pop();
    if (out === 'none') return null;
    return out && out !== 'unknown' ? out : undefined;
  }
  if (!pidLives(pid)) return null;
  // A `ps` that cannot take these options (BusyBox) also exits 1 with nothing on stdout: no answer.
  const res = spawnSync('ps', ['-o', 'lstart=', '-p', String(pid)], { encoding: 'utf8', timeout, env: { ...process.env, LC_ALL: 'C' } });
  const out = String(res.stdout || '').trim();
  return !res.error && res.status === 0 && out ? out : undefined;
}

/** `alive`, `gone` or `unknown` for a process named by pid and creation time. */
function processState({ pid, created } = {}, platform = process.platform, until = Infinity) {
  if (Number.isInteger(pid) && pid > 0 && !pidLives(pid)) return 'gone';
  if (Number.isInteger(pid) && pid > 0 && !created) return 'alive';
  const timeout = lookupTimeout(until);
  if (timeout <= 0) return 'unknown';
  const now = processCreated(pid, platform, timeout);
  if (now === null) return 'gone';
  if (now === undefined) return 'unknown';
  return !created || now === created ? 'alive' : 'gone';
}

/**
 * The session a process runs in — on Windows the Terminal Services session that scopes `Local\` names, elsewhere the
 * POSIX session — or null where no such process runs, undefined for no answer.
 */
function sessionOf(pid, platform = process.platform, until = Infinity) {
  if (!Number.isInteger(pid) || pid <= 0) return null;
  const timeout = lookupTimeout(until);
  if (timeout <= 0) return undefined;
  if (platform === 'win32') {
    const res = spawnSync('tasklist.exe', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8', timeout, windowsHide: true });
    if (res.error || res.status !== 0) return undefined;
    for (const line of String(res.stdout || '').split(/\r?\n/)) {
      const cells = [...line.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
      if (cells.length >= 4 && Number(cells[1]) === pid) {
        const session = Number(cells[3].replace(/\D/g, ''));
        return cells[3].trim() !== '' && Number.isInteger(session) ? session : undefined;
      }
    }
    return null;
  }
  if (!pidLives(pid)) return null;
  const res = spawnSync('ps', ['-o', 'sess=', '-p', String(pid)], { encoding: 'utf8', timeout });
  const out = String(res.stdout || '').trim();
  return !res.error && res.status === 0 && /^\d+$/.test(out) ? Number(out) : undefined;
}

/** `{job: yes | no | unknown, members: [{pid, created, state}]}` — what of a box is still there. */
function boxLeft({ boxId, members = [] }, { platform = process.platform, until = Infinity } = {}) {
  const listed = (members || []).filter((m) => m && Number.isInteger(m.pid)).map((m) => ({ pid: m.pid, created: m.created || null }));
  if (platform !== 'win32') return { job: 'no', members: listed.map((m) => ({ ...m, state: processState(m, platform, until) })) };
  const answer = keeperCall('check', { boxId, members: listed }, lookupTimeout(until));
  if (!answer || typeof answer !== 'object') return { job: 'unknown', members: listed.map((m) => ({ ...m, state: 'unknown' })) };
  return { job: answer.job, members: Array.isArray(answer.members) ? answer.members : [] };
}

/** `readBox` and whether the keeper lives: `alive`, `gone` or `unknown`. */
function status(boxId, { env = process.env, platform = process.platform } = {}) {
  const read = readBox(boxId, { env });
  const keeper = read.status && read.status.keeper ? processState(read.status.keeper, platform) : 'unknown';
  return { boxId, read: read.read, status: read.status, keeper };
}

function logTail(dir) {
  let text = '';
  try { text = fs.readFileSync(path.join(dir, 'keeper.log'), 'utf8'); } catch { return ''; }
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(-3).join(' / ').slice(0, 600);
}

function started(state, boxId, dir, keeperPid) {
  if (state.launched === false) return { unavailable: `the box's keeper could not launch the job: ${state.reason || 'it gave no reason'}`, boxId, keeperPid };
  return { boxId, dir, keeper: state.keeper || null, keeperPid, status: state };
}

/**
 * Starts one job in a new box: `{tree, sandbox, model, effort, prompt | promptFile}` for Codex, or
 * `{tree, command}` for a command line. `boxId`, `env`, and — for tests — `platform` and `waitMs` are optional.
 */
function start(opts = {}) {
  const env = opts.env || process.env;
  const platform = opts.platform || process.platform;
  const { direct } = opts;
  const directWaitMs = Number(testSeam('NEXUS_CODEX_DIRECT_START_MS', env)) || DIRECT_START_MS;
  const startBy = Date.now() + directWaitMs;
  if (!opts.tree) return { unavailable: 'a box needs the tree its job runs in' };
  const tree = path.resolve(opts.tree);
  const seats = seatDir(env);
  const inside = insideWritable([seats, boxRoot(env)], tree, env);
  if (inside) return { unavailable: inside };
  const standIn = testSeam('NEXUS_CODEX_BOX', env);
  if (!standIn && platform !== 'win32') return { unavailable: `${windowsOnly(platform)}; no job started` };
  const kind = opts.command !== undefined ? 'command' : 'codex';
  const sandbox = opts.sandbox || 'read-only';
  if (!SANDBOXES.includes(sandbox)) return { unavailable: `the sandbox ${JSON.stringify(sandbox)} is not one of ${SANDBOXES.join(', ')}` };
  const boxId = opts.boxId || newBoxId();
  if (!BOX_ID.test(boxId)) return { unavailable: `the box id ${JSON.stringify(boxId)} is not one of lower-case letters, digits and dashes` };

  let launch;
  if (kind === 'command') {
    const cmd = path.join(env.SystemRoot || env.SYSTEMROOT || 'C:\\Windows', 'System32', 'cmd.exe');
    launch = { application: cmd, commandLine: `${quoteArg(cmd)} /d /s /c "${opts.command}"`, path: cmd, version: null };
  } else {
    const found = standIn && !testSeam('NEXUS_CODEX_EXEC', env) ? { application: null, args: [], path: null, version: null } : resolveLauncher(env);
    if (found.unavailable) return { unavailable: `${found.unavailable} — no job started` };
    const args = [
      ...found.args, 'exec', '--json', '--skip-git-repo-check', '--sandbox', sandbox, '-C', tree,
      ...(opts.model ? ['-m', opts.model] : []),
      ...(opts.effort ? ['-c', `model_reasoning_effort=${opts.effort}`] : []),
      ...SANDBOX_SETTINGS.flatMap((s) => ['-c', s]), '-',
    ];
    launch = { application: found.application, commandLine: found.application ? commandLine(found.application, args) : null, path: found.path, version: found.version };
  }

  const dir = boxDir(boxId, env);
  let promptFile = null;
  try {
    fs.mkdirSync(boxRoot(env), { recursive: true });
    fs.mkdirSync(dir);
  } catch (err) {
    return { unavailable: `the box folder (${dir}) could not be made: ${err.message}`, boxId };
  }
  const made = insideWritable([dir], tree, env);
  if (made) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* an empty folder left behind */ }
    return { unavailable: made };
  }
  try {
    if (kind === 'codex') {
      promptFile = path.join(dir, 'prompt.md');
      fs.writeFileSync(promptFile, opts.prompt !== undefined ? String(opts.prompt) : fs.readFileSync(opts.promptFile));
    }
    fs.writeFileSync(path.join(dir, 'request.json'), JSON.stringify({
      boxId, kind, tree, sandbox, cwd: tree, application: launch.application, commandLine: launch.commandLine, promptFile,
      launcher: { path: launch.path, version: launch.version }, model: opts.model || null, effort: opts.effort || null,
      command: kind === 'command' ? opts.command : null, limitMs: opts.limitMs > 0 ? opts.limitMs : null, at: new Date().toISOString(),
      ...(direct ? { route: 'direct', jobKind: direct.jobKind, label: direct.label, sessionRoot: direct.sessionRoot,
        startedAt: direct.startedAt, deadline: direct.deadline,
        codexHome: path.resolve(tree, env.CODEX_HOME || path.join(os.homedir(), '.codex')) } : {}),
    }));
  } catch (err) {
    return { unavailable: `the box folder (${dir}) could not be made: ${err.message}`, boxId };
  }

  let child;
  let log = null;
  try {
    log = fs.openSync(path.join(dir, 'keeper.log'), 'w');
    const [file, args] = standIn
      ? [process.execPath, [path.resolve(standIn), dir]]
      : [process.execPath, ['-e', HOLDER, JSON.stringify(['powershell.exe', keeperArgs('run', { box: dir })])]];
    const childEnv = jobEnv(env, tree);
    if (direct) Object.assign(childEnv, { MSYS_NO_PATHCONV: '1', MSYS2_ARG_CONV_EXCL: '*' });
    child = spawn(file, args, { detached: true, windowsHide: true, stdio: ['ignore', log, log], env: childEnv, cwd: dir });
    child.on('error', () => {});
    child.unref();
  } catch (err) {
    return { unavailable: `the box's keeper could not be started: ${err.message}`, boxId };
  } finally {
    if (log !== null) fs.closeSync(log);
  }
  const keeperPid = child.pid;
  if (!keeperPid) return { unavailable: 'the box\'s keeper could not be started', boxId };

  if (direct) {
    try {
      const left = startBy - Date.now();
      const created = left > 0 && processCreated(keeperPid, platform, left);
      if (!created) throw new Error('its creation time could not be read');
      const holder = path.join(dir, 'holder.json');
      fs.writeFileSync(`${holder}.tmp`, JSON.stringify({ pid: keeperPid, created }));
      fs.renameSync(`${holder}.tmp`, holder);
    } catch (err) {
      takeClaim(dir, 'abandon');
      return { unavailable: `the box's holder could not be recorded: ${err.message} — no job started`, boxId, keeperPid };
    }
  }

  const waitMs = opts.waitMs === undefined ? START_WAIT_MS : opts.waitMs;
  const claimedWaitMs = opts.claimedWaitMs === undefined ? CLAIMED_WAIT_MS : opts.claimedWaitMs;
  const deadline = direct ? startBy : Date.now() + waitMs;
  let claimed = false;
  let goneAt = null;
  for (;;) {
    const read = readStatusFile(dir);
    if (read.status) return started(read.status, boxId, dir, keeperPid);
    const gone = !pidLives(keeperPid);
    if (!claimed && (gone || Date.now() >= deadline)) {
      if (takeClaim(dir, 'abandon')) {
        const tail = logTail(dir);
        const why = gone ? `the box's keeper exited before it reported: ${tail || 'it wrote nothing'}` : `the box's keeper wrote no status within ${Math.round((direct ? directWaitMs : waitMs) / 1000)} s${tail ? ` (${tail})` : ''}`;
        return { unavailable: `${why} — the job was given up before it launched`, boxId, keeperPid, abandoned: true };
      }
      claimed = true;
    }
    if (direct && claimed && (gone || Date.now() >= deadline)) {
      const last = readStatusFile(dir);
      if (last.status) return started(last.status, boxId, dir, keeperPid);
      return { unavailable: "the box's keeper did not report after claiming the launch — the job may have launched",
        boxId, keeperPid, launchClaimed: true };
    }
    if (claimed && gone) {
      if (goneAt === null) goneAt = Date.now();
      else if (Date.now() - goneAt >= claimedWaitMs) {
        const last = readStatusFile(dir);
        if (last.status) return started(last.status, boxId, dir, keeperPid);
        return {
          unavailable: `the box's keeper claimed the launch, but its holder exited and no status came within ${Math.round(claimedWaitMs / 1000)} s: ${logTail(dir) || 'it wrote nothing'} — the job may have launched`,
          boxId, keeperPid, launchClaimed: true,
        };
      }
    }
    sleep(100);
  }
}

function takeClaim(dir, word) {
  try { fs.writeFileSync(path.join(dir, 'claim'), word, { flag: 'wx' }); return true; } catch { return false; }
}

/** The box's claim, `launch` or `abandon`; null where none was made, `unreadable` for a read that failed. */
function claimOf(boxId, { env = process.env } = {}) {
  try { return fs.readFileSync(path.join(boxDir(boxId, env), 'claim'), 'utf8').trim().split(/\s/)[0] || null; } catch (err) {
    return err.code === 'ENOENT' ? null : 'unreadable';
  }
}

/** Gives up a box's job before it launches: true where the box holds `abandon`, so no start or keeper launches it. */
function abandon(boxId, { env = process.env } = {}) {
  if (!BOX_ID.test(String(boxId))) return false;
  const dir = boxDir(boxId, env);
  try { fs.mkdirSync(dir, { recursive: true }); } catch { return false; }
  return takeClaim(dir, 'abandon') || claimOf(boxId, { env }) === 'abandon';
}

function endKeeper(keeper, platform) {
  if (platform === 'win32') return keeperCall('kill', { pid: keeper.pid, created: keeper.created || null }) || 'unknown';
  const state = processState(keeper, platform);
  if (state !== 'alive') return state === 'gone' ? 'gone' : 'unknown';
  try { process.kill(keeper.pid, 'SIGKILL'); return 'killed'; } catch { return 'unknown'; }
}

/**
 * Asks the keeper to end the job; after `waitMs` with no `boxClosed`, ends the keeper itself. A status naming another
 * box is never acted on.
 */
function cut(boxId, { env = process.env, platform = process.platform, waitMs = CUT_WAIT_MS } = {}) {
  const dir = boxDir(boxId, env);
  const foreign = (r) => (r.status && r.status.boxId !== boxId
    ? { cut: false, boxClosed: false, reason: `the box's status names another box (${r.status.boxId}), so its keeper is not acted on` }
    : null);
  let read = readStatusFile(dir);
  if (foreign(read)) return foreign(read);
  try { fs.writeFileSync(path.join(dir, 'cut.request'), new Date().toISOString()); } catch (err) {
    return { cut: false, reason: `the cut request could not be written: ${err.message}` };
  }
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    if (foreign(read)) return foreign(read);
    if (read.status && read.status.boxClosed !== undefined) return { cut: true, boxClosed: read.status.boxClosed === true, status: read.status };
    if (read.status && read.status.keeper && !pidLives(read.status.keeper.pid)) break;
    sleep(500);
    read = readStatusFile(dir);
  }
  if (foreign(read)) return foreign(read);
  if (read.status && read.status.boxClosed !== undefined) return { cut: true, boxClosed: read.status.boxClosed === true, status: read.status };
  const keeper = read.status && read.status.keeper;
  if (!keeper) return { cut: true, boxClosed: false, keeperEnded: 'unknown', status: read.status };
  return { cut: true, boxClosed: false, keeperEnded: endKeeper(keeper, platform), status: read.status };
}

function tryRun() {
  const tree = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-box-try-'));
  try {
    const limitMs = 5 * 60000;
    const began = start({ tree, sandbox: 'read-only', effort: 'low', prompt: 'Reply with the single word: ok', limitMs });
    if (began.unavailable) return began;
    const deadline = Date.now() + limitMs;
    let read = readBox(began.boxId);
    while (!(read.status && read.status.boxClosed !== undefined) && Date.now() < deadline) {
      sleep(1000);
      read = readBox(began.boxId);
    }
    if (!(read.status && read.status.boxClosed !== undefined)) return { boxId: began.boxId, timedOut: true, cut: cut(began.boxId) };
    const s = read.status;
    return {
      boxId: began.boxId, state: s.state, boxClosed: s.boxClosed, thread: s.thread, output: s.output, reason: s.reason,
      leftovers: s.leftovers, launcher: available().launcher || null,
    };
  } finally {
    try { fs.rmSync(tree, { recursive: true, force: true }); } catch { /* a temp folder left behind */ }
  }
}

module.exports = {
  SANDBOX_SETTINGS, quoteArg, commandLine, resolveLauncher, available, newBoxId, boxRoot, boxDir, start, readBox, status, cut, boxLeft,
  processCreated, processState, sessionOf, claimOf, abandon,
};

if (require.main === module) {
  if (process.argv.includes('--try')) process.stdout.write(`${JSON.stringify(tryRun())}\n`);
  else process.stdout.write(`${JSON.stringify({ error: 'usage: node seat-box.js --try' })}\n`);
}
