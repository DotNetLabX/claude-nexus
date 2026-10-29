#!/usr/bin/env node
/**
 * Nexus PreToolUse test-entry gate (SYNCHRONOUS — can block).
 *
 * A developer or solo seat runs tests through verify-run.js, never a raw test command. On every gated seat,
 * foreground or background, a raw command is denied with the runner call in the reason and logged to
 * .claude/audit/violations.log with `blocked: true`; a subagent's row also carries `spawn`.
 *
 * A DEVELOPER RUNS ONLY STEP RUNS. On a developer seat every runner call is the step-run form —
 * `verify-run.js --profile fast --step --attempt {1|2} --agent {identity} --unit {unit} --slug {slug}` with its
 * `--changed` and `--files` — alone in its command and never in the background (the tool's flag, or a `&` outside
 * quotes that is no `&&`, redirect or PowerShell call operator); any other form (`--files` or
 * `--tied` without `--step`, `--role`, `--profile complete`, `--timeout-ms`, a bare `--profile fast`), a second
 * runner call in the same command, a separate build (`dotnet build`, `dotnet msbuild`, `npm run build`,
 * `flutter build`) and a file a declared role in .claude/verify.json names (run as a script) are refused. These
 * checks hold whether or not the repo declares `roles.unit`; the raw-command refusal keeps that arming.
 *   - The identity is the payload's `agent_id`, or `session-{session_id}` for a main-session developer persona,
 *     compared case-sensitively. `--slug` is a safe id, and where the spawned developer's state file names the
 *     feature its dispatch named (`slug`), it is that one.
 *   - The work unit, for a spawned developer, comes from .claude/audit/dev-steps/{agent_id}.json (handoff-tracker.js):
 *     in a fix phase `fix-c{N}` (`fix` with no cycle); with no range `round`; else the step after the last one
 *     handed back, by the plan's step order, or the range's first. A main-session developer — and a spawn with no
 *     such file — names it with `--unit {n}`: a number that only stays or rises and never passes the plan's
 *     step count.
 *   - Each unit has two attempts, reserved before the run under a lock in
 *     .claude/audit/step-runs/{slug}/{agent}.json, so two calls never take one attempt. Attempt 2 needs the
 *     attempt-1 record — read from the session root's log and the declared tree's — to be a real red: verdict
 *     `fail`, reason `exit status {n}`, no timed-out test, inside its limit; and each of its `--files` to be one
 *     of that run's failed test files (every file it ran, where a failure names no file) or a file the fix
 *     changed since: its content differs from attempt 1's `changed_hashes` entry (every file attempt 1 ran or
 *     named), or, with no entry, HEAD does not track it — a file the fix created; the call's own `--changed`
 *     admits nothing. An interrupted attempt 1 with no record counts as used, and a third call is
 *     refused. What the runner itself would refuse — an empty `--files`, a file its `filesCommand` refuses — is
 *     refused before an attempt is reserved, and so is an empty or missing `--changed` (or one the gate cannot
 *     read, a `$(…)`), which the runner would record as `skipped: nothing to run`. Every refusal names the
 *     allowed call with identity, unit and
 *     attempt filled in, or says no run is left and to write a `Test problem:` line, or, where the runner has
 *     no step run, says so.
 * The labeller (label-tests.js) is allowed on a developer seat only with `--run` of this agent's own step-run
 * record. The solo keeps every runner and labeller form, declared-role scripts included.
 *
 * A SCRIPT FILE IS READ. On every gated seat, a chain segment that runs a file through an interpreter (`bash`,
 * `sh`, `zsh`, `pwsh`/`powershell -File`, `cmd /c`, `node`, `python`, `./{file}`, `source`, `.`) has the file
 * read. The interpreter's options are read up to its script only, so a word after the script never stops the
 * read; an option that runs no file (`bash -c`, `node -e` or `--check`, `python -m`) means no file. The file
 * is resolved against the `cd` targets before it in the same command; after a `cd` the gate cannot follow (a
 * variable, `-`, home) a relative script is a disclosed miss. It is read up to 256 KB — a larger or unreadable
 * file is let through and logged with `blocked: false` as a disclosed miss — and its lines checked for the raw
 * forms with quotes as token boundaries, plus, on a developer seat, the runner-form and build checks. The runner, the labeller, the repo's slow-test tagger and every file a
 * declared role names are never read.
 *
 * A BACKGROUND DENY IS A PLATFORM FACT, BY VERSION: dropped for a background subagent up to the
 * 2026-09-16 re-probe (Claude Code 2.1.273), honoured at 2.1.293 (ADR-135 P7) and at 2.1.301 (probe
 * 2026-10-17). On a version that drops it — an older client, or a later one — the command runs while
 * its row still reads `blocked: true`, and nothing here detects that.
 *
 * LATENCY: a synchronous hook on every shell call, so the order is the cheap path first: the string forms,
 * then the seat, then the exemptions, then any file read.
 *
 * An INVOCATION, not a mention: the command is split on its chain separators and newlines outside
 * quotes (lib/test-runners.js owns what a separator is) and on `$(`; a segment fires when it
 * contains a test form, token-bounded, UNLESS its first token (by basename) is a read/display lead —
 * `grep`, `cat`, `echo`, `git` and kin — or an exempt script. So `grep jest package.json` and
 * `git commit -m "wip; dotnet test"` pass, while `$out = node --test x`, `python -m pytest` and
 * `./node_modules/.bin/jest` do not, with no list of wrappers or launchers to keep current. A lead not
 * yet on the read list fires: a visible deny, added to the list on its first sighting. A heredoc that runs
 * tests without naming the invocation is a disclosed miss.
 *
 * FAIL OPEN on bad JSON, a missing session, an unresolvable seat, an unreadable declaration or a reservation
 * file that cannot be written.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { resolveRole } = require('./lib/resolve-role');
const { readSessionPersona } = require('./lib/read-session-persona');
const { resolveDeclaredTree } = require('./lib/worktree-target');
const { splitChain, inferRunner, filesCommand } = require('./lib/compose-test-command');
const { isSafeId } = require('./lib/safe-id');

const SHELL_TOOLS = /^(Bash|PowerShell)$/;
const GATED_SEATS = new Set(['developer', 'solo']);
const COMMAND_EXCERPT = 120; // audit-logger.js's cap
const SCRIPT_LIMIT = 256 * 1024;
const LOCK_STALE_MS = 10000;
const LOCK_TRIES = 80;

const fold = (command) => String(command || '').replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

// The ten forms, token-bounded on both sides and tolerant of an `.exe` on the executable.
const TEST_FORM = /(?:^|[\s;&|(){}:/\\])(?:dotnet(?:\.exe)? test|node(?:\.exe)? --test|flutter(?:\.exe)? test|dart(?:\.exe)? test|pytest(?:\.exe)?|vitest(?:\.exe)?|jest(?:\.exe)?|npm(?:\.exe)? (?:test|t|run test))(?=$|[\s;&|(){}:/\\])/;
// A separate build, refused on a developer seat: the step run builds what its tests need.
const BUILD_FORM = /(?:^|[\s;&|(){}:/\\])(?:dotnet(?:\.exe)? (?:build|msbuild)|npm(?:\.exe)? run build|flutter(?:\.exe)? build)(?=$|[\s;&|(){}:/\\])/;

// Leads whose naming of a test form is never an invocation. Extend on a measured sighting only.
const READ_LEADS = new Set([
  'grep', 'rg', 'cat', 'head', 'tail', 'ls', 'find', 'sed', 'awk', 'type',
  'select-string', 'get-content', 'echo', 'write-host', 'write-output', 'git',
  'where-object', 'group-object',
]);
const EXEMPT = new Set(['verify-run.js', 'tag-slow-tests.mjs']);
// Never read as a script: the runner, the timing tool and the labeller, which run tests by design.
const UNREAD = new Set([...EXEMPT, 'label-tests.js']);
const SCRIPT_EXT = /\.(c?js|mjs|ts|sh|bash|zsh|ps1|psm1|cmd|bat|py)$/i;

const basename = (token) => String(token || '').replace(/^.*[/\\]/, '').replace(/\.exe$/, '');

function segmentFires(raw) {
  const segment = fold(raw);
  const [first, second] = segment.split(' ').map(basename);
  if (EXEMPT.has(first) || (first === 'node' && EXEMPT.has(second))) return false;
  if (READ_LEADS.has(first)) return false;
  return TEST_FORM.test(segment);
}

function segmentsOf(command) {
  return splitChain(String(command || '')).flatMap((segment) => segment.split('$('));
}

// A `$(…)` substitution is a command of its own, even inside a double-quoted read.
function isRawTestCommand(command) {
  return segmentsOf(String(command || '').toLowerCase()).some(segmentFires);
}

function buildFires(raw) {
  const segment = fold(raw);
  if (READ_LEADS.has(basename(segment.split(' ')[0]))) return false;
  return BUILD_FORM.test(segment);
}

// A segment's words with their case kept, quotes taken off.
const wordsOf = (segment) => [...String(segment).matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);

// The words of a segment past its leading assignments and launchers.
function commandWords(segment) {
  const w = wordsOf(segment);
  let i = 0;
  for (;;) {
    if (i < w.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(w[i])) i++;
    else if (i < w.length && ['&', 'exec', 'time', 'env', '!'].includes(w[i])) i++;
    else if (i < w.length && w[i] === 'timeout' && /^\d/.test(w[i + 1] || '')) i += 2;
    else break;
  }
  return w.slice(i);
}

const NODE_VALUED = new Set(['-r', '--require', '--import', '--loader', '--experimental-loader', '-C', '--conditions', '--env-file', '--title']);
// Node options after which no file runs: code given inline, a syntax check, the test runner, a version, help.
// Never `-i`/`--interactive`: it runs the script before opening the REPL.
const NODE_NO_FILE = new Set(['-e', '--eval', '-p', '--print', '-c', '--check', '--test', '-v', '--version', '-h', '--help']);
const SHELL_VALUED = new Set(['-o', '+o', '-O', '+O', '--rcfile', '--init-file']);
const PYTHON_VALUED = new Set(['-W', '-X']);

// An interpreter's script: the first word after its own options. Only the words before it are options — a word
// after the script is the script's argument. Null where an option says no file runs, or no script is named.
function operand(w, { valued, noFile }) {
  for (let i = 1; i < w.length; i++) {
    const x = w[i];
    if (x === '--') return w[i + 1] || null;
    if (x === '-') return null;
    if (!/^[-+]./.test(x)) return x;
    if (noFile(x)) return null;
    if (valued.has(x)) i++;
  }
  return null;
}

// The file a segment runs through an interpreter, or null.
function scriptOf(segment) {
  const w = commandWords(segment);
  if (!w.length) return null;
  const exe = basename(w[0]).toLowerCase();
  if (['bash', 'sh', 'zsh'].includes(exe)) return operand(w, { valued: SHELL_VALUED, noFile: (x) => /^-[A-Za-z]*[cs]/.test(x) });
  if (exe === 'pwsh' || exe === 'powershell') {
    const at = w.findIndex((x) => /^-file$/i.test(x));
    return at >= 0 && w[at + 1] ? w[at + 1] : null;
  }
  if (exe === 'cmd') {
    const at = w.findIndex((x) => /^\/c$/i.test(x));
    const target = at >= 0 ? w[at + 1] : null;
    return target && !/\s/.test(target) && (SCRIPT_EXT.test(target) || /[/\\]/.test(target)) ? target : null;
  }
  if (exe === 'node') return operand(w, { valued: NODE_VALUED, noFile: (x) => NODE_NO_FILE.has(x.split('=')[0]) });
  if (/^(python3?|py)$/.test(exe)) return operand(w, { valued: PYTHON_VALUED, noFile: (x) => /^-[A-Za-z]*[cm]/.test(x) });
  if (exe === 'source' || w[0] === '.') return w[1] || null;
  if (/^\.\.?[/\\]/.test(w[0]) || SCRIPT_EXT.test(w[0])) return w[0];
  return null;
}

const CD = new Set(['cd', 'chdir', 'pushd', 'popd', 'set-location', 'sl']);

// The folder a `cd` segment moves to: null where it cannot be followed (a variable, `-`, home, `popd`);
// undefined for a segment that is no cd.
function cdOf(segment) {
  const w = commandWords(segment);
  const exe = w.length ? basename(w[0]).toLowerCase() : '';
  if (!CD.has(exe)) return undefined;
  const target = w.slice(1).find((x) => !/^-./.test(x) && !/^\/d$/i.test(x));
  if (exe === 'popd' || !target || target === '-' || /[$~%`*?]/.test(target)) return null;
  return target;
}

// A `&` outside quotes that sends what comes before it to the background: never `&&`, a redirect's
// (`2>&1`, `&>`), or PowerShell's call operator, which opens a segment.
function backgrounded(command) {
  const s = String(command);
  let quote = '';
  let opened = true;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) { if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") { quote = ch; opened = false; continue; }
    if (ch === '&') {
      if (s[i + 1] === '&') { i++; opened = true; continue; }
      if (s[i - 1] === '>' || s[i - 1] === '<' || s[i + 1] === '>') continue;
      if (!opened) return true;
      continue;
    }
    if (';|\n\r(){'.includes(ch)) opened = true;
    else if (!/\s/.test(ch)) opened = false;
  }
  return false;
}

// The arguments of a call to the named script in a segment that is no read.
const callAt = (name) => (segment) => {
  if (READ_LEADS.has(basename(commandWords(segment)[0]).toLowerCase())) return null;
  const w = wordsOf(segment);
  const at = w.findIndex((x) => basename(x).toLowerCase() === name);
  return at < 0 ? null : w.slice(at + 1);
};
const runnerAt = callAt('verify-run.js');
const labellerAt = callAt('label-tests.js');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!flag.startsWith('--')) continue;
    if (flag === '--files' || flag === '--changed') {
      const list = [];
      while (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') && !/^\d*[<>]/.test(argv[i + 1])) list.push(argv[++i]);
      out[flag.slice(2)] = list;
      continue;
    }
    out[flag.slice(2)] = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

// The pure read of a command: what it runs, before any file is opened. Each script carries the `cd` targets in
// force before it, in order — null once one cannot be followed.
function scan(command) {
  const segments = segmentsOf(command);
  const scripts = [];
  let dirs = [];
  for (const segment of segments) {
    const to = cdOf(segment);
    if (to !== undefined) {
      dirs = to === null ? null : path.isAbsolute(to) ? [to] : dirs && [...dirs, to];
      continue;
    }
    const script = scriptOf(segment);
    if (script) scripts.push({ script, dirs });
  }
  return {
    raw: isRawTestCommand(command),
    builds: segments.some(buildFires),
    runners: segments.map(runnerAt).filter(Boolean),
    labellers: segments.map(labellerAt).filter(Boolean),
    scripts,
  };
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// Which of `files` (relative to `tree`) HEAD tracks; none where there is no repo or no HEAD.
function trackedAtHead(tree, files) {
  if (!files.length) return new Set();
  try {
    const out = require('child_process').execFileSync('git', ['ls-tree', '-r', '-z', '--name-only', 'HEAD', '--', ...files], {
      cwd: tree, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true,
    });
    return new Set(out.split('\0').filter(Boolean));
  } catch {
    return new Set();
  }
}

function declaresUnit(cfg) {
  const unit = cfg && cfg.roles && cfg.roles.unit;
  return typeof unit === 'string' && unit.trim() !== '';
}

// The files the declared roles run, absolute.
function declaredFiles(cfg, tree) {
  const roles = cfg && cfg.roles && typeof cfg.roles === 'object' ? Object.values(cfg.roles) : [];
  return roles.filter((r) => typeof r === 'string').flatMap(wordsOf).filter((w) => SCRIPT_EXT.test(w)).map((w) => path.resolve(tree, w));
}

const samePath = (a, b) => path.relative(a, b) === '';

function fileFires(text, developer) {
  for (const line of String(text).split(/\r?\n/)) {
    const bounded = line.replace(/["'`]/g, ' ');
    if (isRawTestCommand(bounded)) return 'raw';
    if (developer && (segmentsOf(bounded).some(buildFires) || /verify-run\.js/i.test(line))) return 'developer';
  }
  return null;
}

function planSteps(tree, slug) {
  try {
    const text = fs.readFileSync(path.join(tree, 'docs', 'specs', slug, 'delivery', 'plan.md'), 'utf8');
    return [...text.matchAll(/^#{2,4}\s+Step\s+(\d+[a-z]?)\b/gm)].map((m) => m[1]);
  } catch {
    return null;
  }
}

// A spawned developer's state file (handoff-tracker.js), or null.
function devState(root, agentId) {
  if (!agentId || !isSafeId(agentId)) return null;
  const state = readJson(path.join(root, '.claude', 'audit', 'dev-steps', `${agentId}.json`));
  return state && typeof state === 'object' ? state : null;
}

// The unit a spawned developer is in, from its state; null where it has none.
function stateUnit(state, tree, slug) {
  if (!state) return null;
  if (state.phase === 'fixes' || state.phase === 'review-fixes') {
    return state.cycle ? `fix-c${String(state.cycle).split('/')[0]}` : 'fix';
  }
  if (!state.range) return 'round';
  if (!state.step) return String(state.range.from);
  const steps = planSteps(tree, slug);
  const at = steps ? steps.indexOf(String(state.step)) : -1;
  if (at >= 0 && at + 1 < steps.length) return steps[at + 1];
  return String(parseInt(state.step, 10) + 1);
}

function readLog(dir) {
  let text = '';
  try { text = fs.readFileSync(path.join(dir, '.claude', 'audit', 'verify-verdict.json'), 'utf8'); } catch { return []; }
  const out = [];
  for (const line of text.split('\n')) {
    try { const r = JSON.parse(line); if (r && typeof r === 'object') out.push(r); } catch { /* torn or blank */ }
  }
  return out;
}

// A real red: a failing test or a failed build, never a cut, a timeout or a kill.
const realRed = (r) => r.verdict === 'fail' && /^exit status \d+$/.test(String(r.reason || ''))
  && !(Array.isArray(r.timed_out) && r.timed_out.length > 0)
  && typeof r.duration_ms === 'number' && typeof r.limit_ms === 'number' && r.duration_ms < r.limit_ms;

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Runs `fn` holding the reservation file's lock; false when the lock cannot be had.
function withLock(file, fn) {
  const lock = `${file}.lock`;
  for (let i = 0; i < LOCK_TRIES; i++) {
    try {
      const fd = fs.openSync(lock, 'wx');
      fs.closeSync(fd);
      try { return { held: true, value: fn() }; } finally { try { fs.unlinkSync(lock); } catch { /* already gone */ } }
    } catch (e) {
      if (!e || e.code !== 'EEXIST') throw e;
      try { if (Date.now() - fs.statSync(lock).mtimeMs > LOCK_STALE_MS) fs.unlinkSync(lock); } catch { /* raced */ }
      sleep(25);
    }
  }
  return { held: false };
}

// The runner a step run of this repo runs through, or '' where no installed plugin serves one.
function stepRunner(cfg, root) {
  const runner = cfg && cfg.slow && typeof cfg.slow.runner === 'string' && cfg.slow.runner
    ? cfg.slow.runner : inferRunner(cfg && cfg.roles && typeof cfg.roles.unit === 'string' ? cfg.roles.unit : '');
  if (!runner || runner === 'mtp') return '';
  try {
    const { RUNNERS, loadRunner } = require('./lib/test-runners');
    return RUNNERS.has(runner) && loadRunner(runner, { root }).runner ? runner : '';
  } catch {
    return '';
  }
}

function main(input) {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return allow(); }
  const ti = (data && data.tool_input) || {};
  if (!SHELL_TOOLS.test(String(data.tool_name || ''))) return allow();
  // A backslash (sh) or backtick (PowerShell) before a newline continues the line.
  const command = String(ti.command || '').replace(/[\\`]\r?\n/g, ' ');
  const seen = scan(command);
  if (!seen.raw && !seen.builds && !seen.runners.length && !seen.labellers.length && !seen.scripts.length) return allow();
  if (!data.session_id) return allow();

  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const role = resolveRole(data.agent_type || readSessionPersona(data.session_id, root) || 'main');
  if (!GATED_SEATS.has(role)) return allow();
  const developer = role === 'developer';

  const tree = resolveDeclaredTree(root, data.session_id);
  const cfg = readJson(path.join(tree, '.claude', 'verify.json'));
  const armed = declaresUnit(cfg);
  let token = '';
  try { token = fs.readFileSync(path.join(tree, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }

  // POSIX separators: the path is pasted into a command line, where a backslash is an escape.
  const runnerPath = path.join(__dirname, 'verify-run.js').replace(/\\/g, '/');
  const identity = data.agent_id ? String(data.agent_id) : `session-${data.session_id}`;
  const row = (check) => ({
    agent: role,
    ...(data.agent_type ? { spawn: String(data.agent_type) } : {}),
    tool: String(data.tool_name),
    path: tree,
    rule: 'test-entry',
    check,
    command: fold(command).slice(0, COMMAND_EXCERPT),
    token,
    session: data.session_id,
    blocked: true,
  });
  const refuse = (check, why) => {
    logViolation(root, row(check));
    return deny(why);
  };
  const stepCall = (unit = '{unit}', attempt = '{1|2}', slug = '{slug}') =>
    `node "${runnerPath}" --profile fast --step --attempt ${attempt} --agent ${identity} --unit ${unit} --slug ${slug} --changed <every file the step changed> [--files <test files>], with the Bash tool's timeout at 180000 ms`;
  const developerWay = (unit, attempt, slug) => (stepRunner(cfg, root)
    ? `A developer runs tests only as a step run (developer.md § The step test rule): ${stepCall(unit, attempt, slug)}. Where no run is left, write a \`Test problem:\` line in the step block and go on.`
    : 'This repo\'s test runner has no step run: write a `Test problem:` line in the step block and go on — the complete run covers it.');
  const soloWay = `Run tests through node "${runnerPath}" --profile fast --tied --changed <every file you changed> --slug <slug> (a by-name proof: --profile fast --files <test file>...).`;

  if (seen.raw && armed) {
    return refuse('raw', `a raw test command (\`${fold(command).slice(0, COMMAND_EXCERPT)}\`). ${developer ? developerWay() : soloWay}`);
  }
  if (developer && seen.builds) return refuse('build', `a separate build (\`${fold(command).slice(0, COMMAND_EXCERPT)}\`): the step run builds what its tests need. ${developerWay()}`);

  const cwd = data.cwd || root;
  const declared = declaredFiles(cfg, tree);
  for (const { script, dirs } of seen.scripts) {
    if (UNREAD.has(basename(script).toLowerCase())) continue;
    if (dirs === null && !path.isAbsolute(script)) {
      logViolation(root, { ...row('script-unread'), blocked: false, file: script, why: 'after a cd the gate cannot follow' });
      continue;
    }
    const file = path.resolve(cwd, ...(dirs || []), script);
    // The plugin's own helpers (the commit helper among them) name the runner in their text without running it.
    if (samePath(path.dirname(file), __dirname)) continue;
    if (declared.some((d) => samePath(d, file))) {
      if (developer) return refuse('role-script', `\`${script}\` is a declared verify role's script, and a developer never runs a role. ${developerWay()}`);
      continue;
    }
    let size = -1;
    try { size = fs.statSync(file).size; } catch { /* unreadable */ }
    if (size < 0 || size > SCRIPT_LIMIT) {
      logViolation(root, { ...row('script-unread'), blocked: false, file: script, why: size < 0 ? 'unreadable' : 'over 256 KB' });
      continue;
    }
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const fired = fileFires(text, developer);
    if (fired === 'raw' && armed) return refuse('script', `\`${script}\` runs a raw test command. ${developer ? developerWay() : soloWay}`);
    if (fired === 'developer') return refuse('script', `\`${script}\` runs a build or the test runner itself. ${developerWay()}`);
  }

  const logs = () => [...readLog(root), ...(samePath(root, tree) ? [] : readLog(tree))];
  if (developer && seen.labellers.length) {
    const records = logs();
    for (const call of seen.labellers) {
      const id = parseArgs(call).run;
      const run = typeof id === 'string' ? records.filter((r) => r.source === 'verify-run' && r.run_id === id).at(-1) : null;
      if (!run || run.step_run !== true || run.agent !== identity) {
        return refuse('labeller', `a developer labels only from its own step run; ${typeof id === 'string' ? `run ${id}` : 'a call naming no --run'} is not one. Label from the run_id your last step run printed.`);
      }
    }
  }

  if (!developer || !seen.runners.length) return allow();
  if (seen.runners.length > 1) return refuse('runner', `two runner calls in one command: one step run a call. ${developerWay()}`);
  const args = parseArgs(seen.runners[0]);
  const formWhy = args.step === undefined ? 'not a step run'
    : args.profile !== 'fast' ? 'a step run is --profile fast'
    : args.role !== undefined || args.tied !== undefined || args['timeout-ms'] !== undefined || args.light !== undefined ? 'a step run takes no --role, --tied, --timeout-ms or --light'
    : typeof args.slug !== 'string' || !isSafeId(args.slug) ? 'a step run names its --slug'
    : !Array.isArray(args.changed) || args.changed.length === 0 ? 'a step run\'s --changed names no file: pass every file the step changed, written out in the call (with no test file changed, leave --files out to build only)'
    : Array.isArray(args.files) && args.files.length === 0 ? 'a step run\'s --files names no test file: name them, or leave --files out to build only'
    : '';
  if (formWhy) return refuse('runner', `${formWhy}. ${developerWay(undefined, undefined, typeof args.slug === 'string' && isSafeId(args.slug) ? args.slug : undefined)}`);
  const slug = args.slug;
  if (ti.run_in_background === true || backgrounded(command)) return refuse('runner', `a step run in the background. ${developerWay(undefined, undefined, slug)}`);
  if (args.agent !== identity) return refuse('runner', `--agent ${args.agent === true ? '' : args.agent} is not this agent's identity. ${developerWay(undefined, undefined, slug)}`);
  if (!isSafeId(identity)) return allow();
  const state = devState(root, data.agent_id);
  if (state && typeof state.slug === 'string' && state.slug && state.slug !== slug) {
    return refuse('runner', `--slug ${slug} is another feature: you were dispatched for ${state.slug}. ${developerWay(undefined, undefined, state.slug)}`);
  }

  const file = path.join(root, '.claude', 'audit', 'step-runs', slug, `${identity}.json`);
  const held = readJson(file) || { units: {} };
  const units = held.units && typeof held.units === 'object' ? held.units : {};
  let unit = stateUnit(state, tree, slug);
  if (unit === null) {
    const steps = planSteps(tree, slug);
    const asked = typeof args.unit === 'string' && /^\d+$/.test(args.unit) ? Number(args.unit) : null;
    const floor = Math.max(0, ...Object.keys(units).filter((u) => /^\d+$/.test(u)).map(Number));
    if (asked === null) return refuse('runner', `--unit names the step you are building, by its number. ${developerWay(undefined, undefined, slug)}`);
    if (asked < floor) return refuse('runner', `--unit ${asked} is below step ${floor}, already run: a unit only stays or rises. ${developerWay(floor, undefined, slug)}`);
    if (steps && asked > steps.length) return refuse('runner', `--unit ${asked} is past the plan's ${steps.length} steps. ${developerWay(undefined, undefined, slug)}`);
    unit = String(asked);
  }
  if (args.unit !== unit) return refuse('runner', `--unit ${args.unit === true ? '' : args.unit} is not the unit you are in (${unit}). ${developerWay(unit, undefined, slug)}`);
  const used = units[unit] && Number.isInteger(units[unit].attempts) ? units[unit].attempts : 0;
  if (used >= 2) return refuse('runner', `both step runs of unit ${unit} are used. Write a \`Test problem:\` line in the step block and go on — the complete run covers it.`);
  if (args.attempt !== String(used + 1)) return refuse('runner', `the next step run of unit ${unit} is attempt ${used + 1}. ${developerWay(unit, used + 1, slug)}`);

  const rel = (f) => path.relative(tree, path.resolve(tree, f)).split(path.sep).join('/');
  if (used === 1) {
    const first = logs().filter((r) => r.source === 'verify-run' && r.step_run === true && r.agent === identity
      && String(r.unit) === unit && r.attempt === 1 && (r.slug === undefined || r.slug === slug)).at(-1);
    const noRun = `Write a \`Test problem:\` line in the step block and go on — the complete run covers it.`;
    if (!first) return refuse('runner', `attempt 1 of unit ${unit} left no record, so it counts as used and not red. ${noRun}`);
    if (!realRed(first)) return refuse('runner', `attempt 2 follows only a real red — a failing test or a failed build, never a pass, a cut or a timeout; attempt 1 of unit ${unit} read ${first.verdict}${first.reason ? ` (${first.reason})` : ''}. ${noRun}`);
    // The failed tests' files; where a failure names none, every file attempt 1 ran.
    const entries = Array.isArray(first.failed_tests) ? first.failed_tests.filter((t) => t && typeof t === 'object') : [];
    const failed = new Set(entries.map((t) => t.file).filter((f) => typeof f === 'string' && f));
    if (!entries.length || entries.some((t) => !t.file)) for (const f of Array.isArray(first.files) ? first.files : []) failed.add(f);
    // A file the fix changed: its content differs from attempt 1's hash, or attempt 1 hashed none and HEAD
    // tracks none (a file the fix created). What this call names in --changed admits nothing.
    const { fileHash } = require('./lib/tree-hash');
    const hashes = first.changed_hashes && typeof first.changed_hashes === 'object' ? first.changed_hashes : {};
    const asked = (args.files || []).map(rel).filter((f) => !failed.has(f));
    const tracked = trackedAtHead(tree, asked.filter((f) => !Object.hasOwn(hashes, f)));
    const fixed = (f) => (Object.hasOwn(hashes, f) ? fileHash(tree, f) !== hashes[f] : !tracked.has(f));
    const extra = asked.filter((f) => !fixed(f));
    if (extra.length) return refuse('runner', `attempt 2 runs only the tests that failed and the test files the fix changed since attempt 1; ${extra.join(', ')} is neither. ${developerWay(unit, 2, slug)}`);
  }

  // The runner's own refusal, checked before an attempt is reserved: a call it refuses writes no record.
  const runner = Array.isArray(args.files) ? stepRunner(cfg, root) : '';
  if (runner) {
    try {
      filesCommand({ runner, files: args.files.map(rel), exclude: false, cwd: tree, root, step: true });
    } catch (e) {
      return refuse('runner', `the runner would refuse this step run (${e && e.message}). ${developerWay(unit, used + 1, slug)}`);
    }
  }

  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const took = withLock(file, () => {
      const now = readJson(file) || { units: {} };
      const all = now.units && typeof now.units === 'object' ? now.units : {};
      const count = all[unit] && Number.isInteger(all[unit].attempts) ? all[unit].attempts : 0;
      if (count !== used) return false;
      all[unit] = { attempts: used + 1, ts: new Date().toISOString() };
      const tmp = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ units: all }));
      fs.renameSync(tmp, file);
      return true;
    });
    if (!took.held) return refuse('runner', 'the step-run reservation is busy: make the same call again.');
    if (!took.value) return refuse('runner', `another call took attempt ${used + 1} of unit ${unit} first. ${developerWay(unit, undefined, slug)}`);
  } catch { /* a reservation that cannot be written never wedges the call */ }
  return allow();
}

function logViolation(root, row) {
  try {
    const dir = path.join(root, '.claude', 'audit');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'violations.log'), JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n');
  } catch { /* observation must never wedge the call */ }
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `Nexus test-entry gate blocked: ${reason}`,
    },
  }));
  process.exit(0);
}

function allow() { process.exit(0); }

module.exports = { isRawTestCommand, scriptOf };

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (input += d));
  process.stdin.on('end', () => main(input));
}
