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
 * checks hold whether or not the repo declares `roles.unit`; the raw-command refusal keeps that arming. One step
 * run can hold several commands, one per runner of the repo: the pre-check routes `--files` as the runner does
 * (lib/compose-test-command.js `routeFiles`), and what routing does not place stays the main runner's to answer.
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
 *     of that run's failed test files (every file it ran, the repo's step tests included, where a failure names no file) or a file the fix
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
 * record. The solo keeps every runner and labeller form, and runs any script file: none is read on its seat.
 * The mutation runner (mutation-run.js) is refused on a developer seat wherever the gate sees it run, checked
 * before the plugin's own folder is skipped. The command is read as shell words (lib/shell-words.js), and every
 * command it runs is judged, nested ones included (`bash -c`, `cmd /c`, `eval`, `find -exec`, `$(…)`): it runs
 * the runner when its executable is `mutation-run.js`, when it is node and the runner is its script or preload
 * (`.js` optional), or when node's `-e` / `-p` or python's `-c` code runs it. The name anywhere else — a step
 * run's `--changed` or `--files`, a print, a grep — is data. A script the gate reads is judged line by line: a
 * `.js`, `.mjs`, `.cjs`, `.ts` or `.py` file as code, every other one as shell. Code is judged statement by
 * statement and name by name: a name in a comment, or in a print call with nothing before it that could launch
 * it, is a mention, and any other names it; only the comment itself is skipped, so code after a block
 * comment's close is judged. A developer's test runs are its step runs; a battery is a reviewer's, a solo's or
 * a main session's. This refusal stops ordinary misuse by a cooperating agent, not deliberate evasion: a shell
 * or a program cannot be fully read, and the misses lib/shell-words.js names, a runner path built at run time
 * and an assignment of the runner's name in a code file (refused, though it runs nothing) are stated limits.
 *
 * A SCRIPT FILE IS READ. On a developer seat, a chain segment that runs a file through an interpreter (`bash`,
 * `sh`, `zsh`, `pwsh`/`powershell -File`, `cmd /c`, `node`, `python`, `./{file}`, `source`, `.`) has the file
 * read. The interpreter's options are read up to its script only, so a word after the script never stops the
 * read; an option that runs no file (`bash -c`, `node -e` or `--check`, `python -m`) means no file. The file
 * is resolved against the `cd` targets before it in the same command; after a `cd` the gate cannot follow (a
 * variable, `-`, home) a relative script is a disclosed miss. It is read up to 256 KB — a larger or unreadable
 * file is let through and logged with `blocked: false` as a disclosed miss — and judged by what it runs. A shell
 * script runs what its commands run, read as a command is (below). Code runs a test, a build or the runner only
 * where one statement both starts a process — in JavaScript a `spawn`, `spawnSync`, `exec`, `execSync`,
 * `execFile`, `execFileSync` or `fork` call, in Python `subprocess` or `os.system`, in Perl or Ruby (`-e` code)
 * `system`, in PowerShell `Start-Process`
 * or `&` — and names it, quotes read as token boundaries, a call laid out over several lines one statement; a
 * name in a comment or a value runs nothing. A build and the runner count beside the raw forms. A script this
 * same command wrote from a here-document is judged by that text, on every gated seat, not read from disk. The runner, the labeller, the repo's slow-test
 * tagger and every file a declared role names are never read.
 *
 * A BACKGROUND DENY IS A PLATFORM FACT, BY VERSION: dropped for a background subagent up to the
 * 2026-09-16 re-probe (Claude Code 2.1.273), honoured at 2.1.293 (ADR-135 P7) and at 2.1.301 (probe
 * 2026-10-17). On a version that drops it — an older client, or a later one — the command runs while
 * its row still reads `blocked: true`, and nothing here detects that.
 *
 * LATENCY: a synchronous hook on every shell call, so the order is the cheap path first: the string forms,
 * then the seat, then the exemptions, then any file read.
 *
 * WHAT A COMMAND RUNS, never what its text names. The command is read as the commands it runs
 * (lib/shell-words.js `commandsOf`: past launchers such as `timeout 60`, into `bash -c`, `$(…)` and backticks),
 * a leading PowerShell `$name =` taken off; `Start-Process` is read as the program it starts with its argument
 * list. A test or build form fires as a run of whole words anywhere in a command's words — each word by its file
 * name, `.exe` dropped, cut at a `:` — or, for a test, as node's script (`jest.js`, `vitest.mjs`), unless the
 * command's executable is a read/display lead (`grep`, `cat`, `echo`, `git` and kin) or its script is the runner
 * or the slow-test tagger; a quoted argument holding a space is one word and never matches — save the code or
 * command line one argument hands on (node's `-e`/`-p`, python's `-c`, perl's and ruby's `-e`,
 * `Invoke-Expression`/`iex` — a PowerShell variable it is given read as the string assigned it — what `ssh`,
 * `docker`, `podman`, `kubectl` or `wsl` runs, what a launcher the shell reader does not list runs — `setsid`,
 * `flock`, `su -c`, `watch`, `nodemon`, `concurrently`, `start` and kin), a shell's `<<<` here-string and text
 * a print pipes into a shell, node or python, each judged as a script this command holds. So
 * `grep jest package.json`, `printf 'dotnet test'` and `git commit -m "wip; dotnet test"` pass, while
 * `$out = node --test x`, `python -m pytest`, `uv run pytest` and `./node_modules/.bin/jest` do not. A lead not
 * yet on the read list fires: a visible deny, added to the list on its first sighting. The runner and the
 * labeller are called only where one is the executed script — itself, or node's script behind any launcher,
 * `.js` optional — so a path naming either as data (a commit helper's file list) is no call.
 * HERE-DOCUMENTS (lib/heredocs.js) are read by what they feed, a header continued over lines read whole: a body
 * fed to a shell (`at`, `ssh` with no remote command, and a shell `docker`, `podman` or `kubectl` starts, among
 * them) is run as its commands, one fed to node or python is judged as code; any other body (`cat`,
 * `tee`, a redirect) is data, unless a script the same command runs — at any depth, `bash -c 'bash run.sh'` and a
 * script's own lines included — is the file it wrote, judged by that text. A PowerShell here-string is one
 * argument, run as commands only where PowerShell runs it as code (`Invoke-Expression`/`iex`, `pwsh -Command`, a
 * script block made from it), directly or through the variable assigned it. Stated limits: a body a substitution
 * hands on (`bash -c "$(cat <<EOF …)"`) is read by its reader, `cat`, as data; a process substitution
 * (`bash <(…)`) and stdin handed on through `xargs … sh -c {}` are not read.
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
const { readRoundToken } = require('./lib/round-token');
const { splitChain, filesCommand, routeFiles } = require('./lib/compose-test-command');
const { RUNNERS, loadRunner, repoRunners, runnerOf } = require('./lib/test-runners');
const { isSafeId } = require('./lib/safe-id');
const { planFile } = require('./lib/gears');
const { exeName, commandsOf } = require('./lib/shell-words');
const { readHeredocs, HERE_STRING_WORD } = require('./lib/heredocs');

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

function segmentsOf(command) {
  return splitChain(String(command || '')).flatMap((segment) => segment.split('$('));
}

// The same forms as runs of whole words, for a command read as the words it runs.
const TEST_RUNS = [['dotnet', 'test'], ['node', '--test'], ['flutter', 'test'], ['dart', 'test'], ['pytest'], ['vitest'], ['jest'],
  ['npm', 'test'], ['npm', 't'], ['npm', 'run', 'test']];
const BUILD_RUNS = [['dotnet', 'build'], ['dotnet', 'msbuild'], ['npm', 'run', 'build'], ['flutter', 'build']];
const RUNNER_SCRIPT = /^verify-run(?:\.js)?$/;
const LABELLER_SCRIPT = /^label-tests(?:\.js)?$/;
// An exempt script by name, its extension optional as node resolves it.
const isExemptScript = (name) => [...EXEMPT].some((e) => e === name || e.replace(/\.m?js$/, '') === name);

// A word as a form matches it: its file name, lower-cased, with no `.exe`, cut at a `:` (`test:watch`). A quoted
// argument holding a space is one word and matches nothing; only an executable's path may hold one.
const tok = (word, i) => (i > 0 && /\s/.test(word) ? null : exeName(word).split(':')[0]);
const hasRun = (words, forms) => words.some((_, i) => forms.some((form) => form.every((part, k) => tok(words[i + k] ?? '', i + k) === part)));

// A PowerShell `$name =` before a command assigns its output; the command is what follows it.
function dropAssignment(words) {
  if (words.length > 2 && /^\$[\w:.]+$/.test(words[0]) && words[1] === '=') return words.slice(2);
  if (words.length > 1 && /^\$[\w:.]+=$/.test(words[0])) return words.slice(1);
  return words;
}

// The index of node's script among its words, or -1 where node runs no file.
function nodeScriptIndex(words) {
  for (let i = 1; i < words.length; i++) {
    const x = words[i];
    if (x === '--') return words[i + 1] === undefined ? -1 : i + 1;
    if (!/^[-+]./.test(x)) return i;
    if (NODE_NO_FILE.has(x.split('=')[0])) return -1;
    if (NODE_VALUED.has(x)) i++;
  }
  return -1;
}

// The script a command runs by name: the executable itself, or node's script.
function scriptRun(words) {
  const exe = exeName(words[0]);
  if (exe !== 'node') return { exe, at: 0 };
  const at = nodeScriptIndex(words);
  return at < 0 ? { exe, at: -1 } : { exe: exeName(words[at]), at };
}

// The arguments of a call to the script `re` names (`.js` optional), or null; a read lead calls nothing. A launcher
// the shell reader does not list (`setsid`, `flock {file}`, `start /b`) still runs node's script.
const callOf = (re) => (all) => {
  const words = asLaunched(all);
  if (!words.length || READ_LEADS.has(exeName(words[0]))) return null;
  const at = exeName(words[0]) === 'node' ? 0 : words.findIndex((w) => exeName(w) === 'node');
  const from = at < 0 ? words : words.slice(at);
  const run = scriptRun(from);
  return run.at >= 0 && re.test(run.exe) ? from.slice(run.at + 1) : null;
};

// `Start-Process` (`saps`) runs its `-FilePath`, or first positional word, with its `-ArgumentList`, or the positional
// words after it — a list split at its commas and a quoted argument string at its spaces, as the program gets them.
const START_SWITCHES = ['wait', 'nonewwindow', 'passthru', 'usenewenvironment', 'loaduserprofile', 'whatif', 'confirm'];
function asLaunched(words) {
  if (!/^(?:start-process|saps)$/.test(exeName(words[0] || ''))) return words;
  let file = null;
  let list = null;
  const positional = [];
  for (let i = 1; i < words.length; i++) {
    const p = /^-([A-Za-z]+)(?::(.*))?$/.exec(words[i]);
    if (!p) { positional.push(words[i]); continue; }
    const name = p[1].toLowerCase();
    if (p[2] === undefined && START_SWITCHES.some((s) => s.startsWith(name))) continue;
    let value = p[2] !== undefined ? p[2] : words[++i] ?? '';
    while (value.endsWith(',') && i + 1 < words.length) value += words[++i];
    if ('filepath'.startsWith(name) || name === 'path' || name === 'pspath') file = value;
    else if ('argumentlist'.startsWith(name) || name === 'args') list = value;
  }
  if (file === null) file = positional.shift() ?? '';
  const args = (list !== null ? [list] : positional).flatMap((a) => a.split(',')).flatMap((a) => a.trim().split(/\s+/)).filter(Boolean);
  return [file, ...args];
}

// A test tool started as node's script (`node node_modules/jest/bin/jest.js`).
const TEST_SCRIPT = /^(?:jest|vitest)\.[cm]?js$/;

function commandRuns(all, forms) {
  const words = asLaunched(all);
  if (!words.length || READ_LEADS.has(exeName(words[0]))) return false;
  const run = scriptRun(words);
  if (run.at >= 0 && isExemptScript(run.exe)) return false;
  if (forms === TEST_RUNS && run.at > 0 && TEST_SCRIPT.test(run.exe)) return true;
  return hasRun(words, forms);
}
const runsTest = (words) => commandRuns(words, TEST_RUNS);
const runsBuild = (words) => commandRuns(words, BUILD_RUNS);

const SSH_VALUED = new Set(['-B', '-b', '-c', '-D', '-E', '-e', '-F', '-I', '-i', '-J', '-L', '-l', '-m', '-O', '-o', '-p', '-Q', '-R', '-S', '-W', '-w']);

// What a command reading stdin makes of a here-document: a shell runs it as commands, node or python as code — and
// so do `at` and `batch`, `ssh` given no remote command, and a shell that `docker`, `podman` or `kubectl` starts.
function stdinReader(all) {
  const words = withoutRedirects(all);
  const exe = exeName(words[0] || '');
  if (exe === 'at' || exe === 'batch') return 'shell';
  if (exe === 'ssh') {
    let named = 0;
    for (let i = 1; i < words.length; i++) {
      if (SSH_VALUED.has(words[i])) i++;
      else if (!/^-/.test(words[i])) named++;
    }
    return named <= 1 ? 'shell' : null;
  }
  if (/^(?:docker|podman|kubectl)$/.test(exe)) {
    const at = words.findIndex((w, i) => i > 0 && /^(?:ba|z|da|k)?sh$/.test(exeName(w)));
    return at > 0 ? stdinReader(words.slice(at)) : null;
  }
  if (/^(?:ba|z|da|k)?sh$/.test(exe)) {
    if (words.some((w) => /^-[a-z]*c[a-z]*$/.test(w))) return null;
    return operand(words, { valued: SHELL_VALUED, noFile: (x) => /^-[A-Za-z]*s/.test(x) }) ? null : 'shell';
  }
  if (exe === 'node') {
    if (words.some((w) => NODE_CODE.has(w.split('=')[0]))) return null;
    const at = nodeScriptIndex(words);
    return at < 0 || words[at] === '-' ? 'code' : null;
  }
  if (/^(python3?|py)$/.test(exe)) {
    if (words.some((w) => /^-[A-Za-z]*[cm]/.test(w))) return null;
    return operand(words, { valued: PYTHON_VALUED, noFile: () => false }) ? null : 'code';
  }
  return null;
}

// The file a command writes its stdin to: a `>` or `>>` redirect's target, or `tee`'s first file.
function writtenBy(words) {
  if (exeName(words[0] || '') === 'tee') return withoutRedirects(words).slice(1).find((w) => !/^-/.test(w)) || null;
  for (let i = 0; i < words.length; i++) {
    const glued = /^\d?>>?(.+)$/.exec(words[i]);
    if (glued) return glued[1];
    if (/^\d?>>?$/.test(words[i]) && words[i + 1]) return words[i + 1];
  }
  return null;
}

// A command's words without its redirects: a `<<WORD` operator, a glued `>file`, or a bare `>` and its target.
function withoutRedirects(words) {
  const out = [];
  for (let i = 0; i < words.length; i++) {
    if (/^\d?(?:<|>)/.test(words[i])) {
      if (/^\d?(?:<<?-?|>>?)$/.test(words[i])) i++;
      continue;
    }
    out.push(words[i]);
  }
  return out;
}

const samePlace = (a, b) => path.posix.normalize(String(a).replace(/\\/g, '/')) === path.posix.normalize(String(b).replace(/\\/g, '/'));

// PowerShell that runs a string as code: Invoke-Expression, `pwsh -Command`, a script block made from text.
const PS_RUNS_TEXT = /(?:^|[\s;|(&{])(?:iex|invoke-expression)(?![\w-])|(?:^|[\s;|(&{])(?:pwsh|powershell)(?:\.exe)?\s(?:.*\s)?-c(?:o(?:m(?:m(?:a(?:n(?:d)?)?)?)?)?)?(?=\s|$)|\[scriptblock\]::create/i;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Whether a line after `at` runs the PowerShell variable `name` as code.
function laterRuns(lines, at, name) {
  const mention = new RegExp(`${escapeRe(name)}(?![\\w:])`, 'i');
  return lines.slice(at + 1).some((l) => PS_RUNS_TEXT.test(l) && mention.test(l));
}
const ASSIGNED_HERE_STRING = new RegExp(`^\\s*(\\$[\\w:]+)\\s*=\\s*${HERE_STRING_WORD}`, 'i');
const ASSIGNED_STRING = /^\s*(\$[\w:]+)\s*=\s*(["'])(.*)\2\s*;?\s*$/;

// The PowerShell text a command runs as code beside its lines: a here-string on a line that runs text as code, and a
// here-string or a quoted string assigned to a variable a later line runs as code; by the line each stands on.
function psCodeText(lines, hereStrings) {
  const out = [];
  for (const h of hereStrings) {
    const named = ASSIGNED_HERE_STRING.exec(lines[h.at]);
    if (PS_RUNS_TEXT.test(lines[h.at]) || (named && laterRuns(lines, h.at, named[1]))) out.push({ at: h.at, text: h.body });
  }
  lines.forEach((line, at) => {
    const m = ASSIGNED_STRING.exec(line);
    if (m && laterRuns(lines, at, m[1])) out.push({ at, text: m[3] });
  });
  return out;
}

// A command with its here-documents placed: a body fed to a shell stays as lines it runs; a body fed to node or
// python is code (`code`); any other body is data, kept only as the text of the file it writes (`writes`).
// PowerShell text run as code (`psCodeText`) is run as lines; elsewhere a here-string is data.
function readCommand(command) {
  const { lines, bodies, hereStrings } = readHeredocs(String(command || ''));
  const after = new Map();
  const code = [];
  const writes = [];
  for (const p of psCodeText(lines, hereStrings)) after.set(p.at, [...(after.get(p.at) || []), p.text]);
  for (const b of bodies) {
    const commands = commandsOf(b.line).map(dropAssignment);
    const holder = commands.find((w) => w.some((x) => x.startsWith('<<'))) || [];
    const reader = [holder, ...commands.filter((c) => c !== holder)].map(stdinReader).find(Boolean) || null;
    if (reader === 'shell') after.set(b.at, [...(after.get(b.at) || []), b.body]);
    else if (reader === 'code') code.push({ script: `${exeName(holder[0] || 'node')} heredoc`, dirs: [], text: b.body, code: true });
    else {
      const file = writtenBy(holder);
      if (file) writes.push({ file, text: b.body });
    }
  }
  const text = lines.flatMap((line, i) => [line, ...(after.get(i) || [])]).join('\n').replace(/[\\`]\r?\n/g, ' ');
  return { text, code, writes };
}

// A command runs a raw test where one of its commands does, or a script whose text the command itself holds.
function isRawTestCommand(command) {
  const seen = scan(command);
  return seen.raw || seen.scripts.some((s) => s.text !== undefined && fileFires(s.text, false, s.code, { writes: seen.writes }) === 'raw');
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
const scriptOf = (segment) => scriptOfWords(commandWords(segment));

// The file a command, from its executable on, runs through an interpreter, or null.
function scriptOfWords(w) {
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

const runnerCall = callOf(RUNNER_SCRIPT);
const labellerCall = callOf(LABELLER_SCRIPT);

// The mutation runner as an interpreter's script: `.js` optional, node resolves it.
const MUTATOR_SCRIPT = /^mutation-run(?:\.js)?$/i;
const isMutator = (word) => MUTATOR_SCRIPT.test(String(word || '').replace(/^.*[/\\]/, ''));
const NODE_CODE = new Set(['-e', '--eval', '-p', '--print']);
const NODE_PRELOAD = new Set(['-r', '--require', '--import', '--loader', '--experimental-loader']);

// Code that runs the mutation runner, judged statement by statement and name by name: a name in a
// comment, or in a print call with nothing before it that could launch it, is a mention.
const MUTATOR_NAME = /(?:(?<![\w-])mutation-run\.js|[/\\]mutation-run|(?<=\bnode(?:\.exe)?\s+["']?)mutation-run)(?![\w.-])/gi;
const PRINTS = /console\.(?:log|error|warn|info|debug)|process\.std(?:out|err)\.write|\becho\b|\bprintf?\b|write-(?:host|output)/i;
const LAUNCHES = /\bnode(?:\.exe)?\b|execPath|\bspawn|\bexec|\bfork\b|\brequire\b|[&|]/i;
function codeRunsMutator(text) {
  return codeStatements(text).map(afterComments).some((statement) => {
    return [...statement.matchAll(MUTATOR_NAME)].some((m) => {
      const before = statement.slice(0, m.index);
      return !(PRINTS.test(before) && !LAUNCHES.test(before));
    });
  });
}

// A statement with its leading comments taken off: a line comment ends it, and a block comment — or a
// line inside one, led by `*` — ends at its `*/`, the code after it judged.
function afterComments(statement) {
  let s = statement.replace(/^\s+/, '');
  while (/^(?:\/\*|\*)/.test(s)) {
    const close = s.indexOf('*/', s.startsWith('/*') ? 2 : 0);
    if (close < 0) return '';
    s = s.slice(close + 2).replace(/^\s+/, '');
  }
  return /^(?:\/\/|#)/.test(s) ? '' : s;
}

// Code split at `;`, and at line ends outside brackets, outside its quotes; only a backtick quote spans a line
// end, so a call laid out over several lines stays one statement. A `//` line comment is left out.
function codeStatements(text) {
  const out = [];
  let quote = '';
  let depth = 0;
  let from = 0;
  let kept = '';
  const s = String(text);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === '\n' && quote !== '`') quote = '';
      else { if (ch === '\\') i++; else if (ch === quote) quote = ''; continue; }
    }
    if (ch === '/' && s[i + 1] === '/' && (i === 0 || /[\s;{}()]/.test(s[i - 1]))) {
      const end = s.indexOf('\n', i);
      kept += s.slice(from, i);
      i = end < 0 ? s.length : end - 1;
      from = i + 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth = Math.max(0, depth - 1);
    else if (ch === ';' || (ch === '\n' && depth === 0)) { out.push(kept + s.slice(from, i)); kept = ''; from = i + 1; }
  }
  out.push(kept + s.slice(from));
  return out;
}

// Code or a command line one argument hands to another program: node's, python's, perl's and ruby's inline code,
// PowerShell's Invoke-Expression, what ssh, docker, podman, kubectl and wsl run elsewhere, and what a launcher the shell reader
// does not list runs (`setsid`, `flock`, `su -c`, `watch`, `nodemon --exec`, `concurrently`, `start`). A shell's
// or an interpreter's `<<<` here-string is its stdin. Each is judged as a script.
const ELSEWHERE = new Set(['ssh', 'docker', 'podman', 'kubectl', 'wsl', 'setsid', 'flock', 'script', 'su', 'runuser',
  'watch', 'nodemon', 'concurrently', 'npm-run-all', 'parallel', 'busybox', 'start']);
const inlineScripts = (words) => [...argumentScripts(words), ...hereStringScripts(words)];

function hereStringScripts(words) {
  const at = words.findIndex((w) => w.startsWith('<<<'));
  if (at < 0) return [];
  const bare = words[at] === '<<<';
  const reader = stdinReader([...words.slice(0, at), ...words.slice(at + (bare ? 2 : 1))]);
  const text = bare ? words[at + 1] ?? '' : words[at].slice(3);
  return reader ? [{ script: `${exeName(words[0] || '')} here-string`, dirs: [], text, code: reader === 'code' }] : [];
}

// Text a print hands down a pipe to a shell, node or python reading its stdin (`printf 'npm test\n' | bash`).
const PRINTERS = new Set(['echo', 'printf', 'write-output', 'write-host']);
function pipedScripts(text) {
  return pipelines(text).flatMap((stages) => stages.slice(1).flatMap((stage, k) => {
    const [left] = commandsOf(stages[k]);
    const [right] = commandsOf(stage);
    if (!left || !right || !PRINTERS.has(exeName(left[0]))) return [];
    const reader = stdinReader(right);
    if (!reader) return [];
    const said = left.slice(1).filter((w) => !/^-[A-Za-z]+$/.test(w)).join(' ');
    const escapes = exeName(left[0]) === 'printf' || left.includes('-e');
    return [{ script: `${exeName(left[0])} into ${exeName(right[0])}`, dirs: [], text: escapes ? said.replace(/\\n/g, '\n') : said, code: reader === 'code' }];
  }));
}

// Each pipeline of a text as its stages: split at `|` outside quotes; `||`, `;`, `&` and a line end close one.
function pipelines(text) {
  const s = String(text);
  const out = [];
  let stages = [];
  let from = 0;
  let quote = '';
  for (let i = 0; i <= s.length; i++) {
    const ch = s[i];
    if (quote) { if (ch === '\\' && quote === '"') i++; else if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    const pipe = ch === '|' && s[i + 1] !== '|';
    const close = i === s.length || ch === '|' || ch === ';' || ch === '\n' || (ch === '&' && s[i - 1] !== '>');
    if (!pipe && !close) continue;
    stages.push(s.slice(from, i));
    if (!pipe) { out.push(stages); stages = []; if (s[i + 1] === ch) i++; }
    from = i + 1;
  }
  return out;
}

function argumentScripts(words) {
  const exe = exeName(words[0] || '');
  const held = (text, code) => [{ script: `${exe} ${code ? 'inline code' : 'command text'}`, dirs: [], text, code }];
  if (exe === 'node') {
    for (let i = 1; i < words.length; i++) {
      const x = words[i];
      const eq = x.indexOf('=');
      const flag = eq < 0 ? x : x.slice(0, eq);
      if (NODE_CODE.has(flag)) return held(eq < 0 ? words[i + 1] || '' : x.slice(eq + 1), true);
      if (x === '--' || !/^[-+]./.test(x)) return [];
      if (NODE_VALUED.has(flag) && eq < 0) i++;
    }
    return [];
  }
  if (/^(python3?|py)$/.test(exe)) {
    for (let i = 1; i < words.length; i++) {
      if (words[i] === '-c') return held(words[i + 1] || '', true);
      if (!/^-./.test(words[i])) return [];
      if (PYTHON_VALUED.has(words[i])) i++;
    }
    return [];
  }
  if (exe === 'perl' || exe === 'ruby') {
    const at = words.findIndex((w) => /^-[A-Za-z]*[eE]$/.test(w));
    return at > 0 ? held(words[at + 1] || '', true) : [];
  }
  if (exe === 'iex' || exe === 'invoke-expression') return held(words.slice(1).filter((w) => !/^-command$/i.test(w)).join(' '), false);
  if (ELSEWHERE.has(exe)) return words.slice(1).filter((w) => /\s/.test(w)).flatMap((w) => held(w, false));
  return [];
}

// One command, from its executable on, that runs the mutation runner: the runner itself, node's script or
// preload, or node's or python's inline code that runs it. A runner name in any other place is data.
function runsMutatorCommand(words) {
  const exe = exeName(words[0]);
  if (exe === 'mutation-run.js') return true;
  if (/^(python3?|py)$/.test(exe)) {
    const at = words.findIndex((x) => x === '-c');
    return at > 0 && codeRunsMutator(words[at + 1] || '');
  }
  if (exe !== 'node') return false;
  for (let i = 1; i < words.length; i++) {
    const x = words[i];
    if (x === '--') return isMutator(words[i + 1]);
    if (!/^[-+]./.test(x)) return isMutator(x);
    const eq = x.indexOf('=');
    const flag = eq < 0 ? x : x.slice(0, eq);
    const value = () => (eq < 0 ? words[++i] : x.slice(eq + 1));
    if (NODE_CODE.has(flag)) return codeRunsMutator(value() || '');
    if (NODE_PRELOAD.has(flag)) { if (isMutator(value())) return true; continue; }
    if (NODE_NO_FILE.has(flag)) return false;
    if (NODE_VALUED.has(flag) && eq < 0) i++;
  }
  return false;
}

// The script files the gate reads as code, statement by statement; every other script is read as shell.
const CODE_EXT = /\.(c?js|mjs|ts|py)$/i;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!flag.startsWith('--')) continue;
    if (flag === '--files' || flag === '--changed') {
      const list = [];
      // A `$` is what is left of a `$(…)` the gate cannot read: the list ends there.
      while (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') && !/^\d*[<>]/.test(argv[i + 1]) && argv[i + 1] !== '$') list.push(argv[++i]);
      out[flag.slice(2)] = list;
      continue;
    }
    out[flag.slice(2)] = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

// The pure read of a command: what it runs, before any file is opened. Each script carries the `cd` targets in
// force before it, in order — null once one cannot be followed — and, where the command itself wrote it from a
// here-document, that text; code a here-document feeds node or python is a script of its own.
function scan(command) {
  const read = readCommand(command);
  const segments = segmentsOf(read.text);
  const scripts = [];
  let dirs = [];
  for (const segment of segments) {
    const to = cdOf(segment);
    if (to !== undefined) {
      dirs = to === null ? null : path.isAbsolute(to) ? [to] : dirs && [...dirs, to];
      continue;
    }
    const script = scriptOf(segment);
    if (!script) continue;
    const wrote = read.writes.findLast((w) => samePlace(w.file, script));
    scripts.push(wrote ? { script, dirs, text: wrote.text, code: CODE_EXT.test(script) } : { script, dirs });
  }
  const commands = commandsOf(read.text).map(dropAssignment).filter((w) => w.length);
  return {
    raw: commands.some(runsTest),
    builds: commands.some(runsBuild),
    runners: commands.map(runnerCall).filter(Boolean),
    labellers: commands.map(labellerCall).filter(Boolean),
    mutator: commands.some(runsMutatorCommand),
    scripts: [...scripts, ...read.code, ...commands.flatMap(inlineScripts), ...pipedScripts(read.text), ...writtenScripts(commands, read.writes)],
    writes: read.writes,
  };
}

// The scripts that commands run, nested ones included (`bash -c 'bash run.sh'`), that a here-document wrote: each
// with the text it was written with.
function writtenScripts(commands, writes) {
  if (!writes.length) return [];
  return commands.flatMap((w) => {
    const script = scriptOfWords(w);
    const wrote = script && writes.findLast((x) => samePlace(x.file, script));
    return wrote ? [{ script, dirs: [], text: wrote.text, code: CODE_EXT.test(script) }] : [];
  });
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

// A statement of code that starts a process: in JavaScript a spawn, exec or fork call, in Python `subprocess` or
// `os.system`, in Perl or Ruby `system`, in PowerShell `Start-Process` or the call operator.
const CODE_LAUNCH = /\b(?:spawn|spawnSync|exec|execSync|execFile|execFileSync|fork|system)\s*\(|\bsubprocess\.|\bStart-Process\b|(?:^|[\s;({])&\s/;
const RUNNER_NAME = /(?<![\w.-])verify-run(?:\.js)?(?![\w.-])/i;

// What a script's text runs. Code runs a test, a build or the runner only where one statement both launches a
// process and names it; a shell script runs what its commands run, here-documents read as in a command, and a
// script it runs that it — or the command around it (`writes`) — wrote from a here-document by that text. A name
// in a comment, a print or a value is data.
const NESTING = 4;
function fileFires(text, developer, code, { writes = [], depth = 0 } = {}) {
  if (depth > NESTING) return null;
  if (code) {
    for (const statement of codeStatements(text).map(afterComments)) {
      if (!statement || !CODE_LAUNCH.test(statement)) continue;
      const bounded = fold(statement.replace(/["'`]/g, ' '));
      if (TEST_FORM.test(bounded)) return 'raw';
      if (developer && (BUILD_FORM.test(bounded) || RUNNER_NAME.test(statement))) return 'developer';
    }
    return developer && codeRunsMutator(text) ? 'mutation-run' : null;
  }
  const read = readCommand(text);
  const known = [...writes, ...read.writes];
  const inner = { writes: known, depth: depth + 1 };
  for (const line of read.text.split(/\r?\n/)) {
    const commands = commandsOf(line).map(dropAssignment).filter((w) => w.length);
    if (commands.some(runsTest)) return 'raw';
    if (developer && commands.some(runsMutatorCommand)) return 'mutation-run';
    if (developer && (commands.some(runsBuild) || commands.some(runnerCall))) return 'developer';
    for (const held of [...commands.flatMap(inlineScripts), ...pipedScripts(line), ...writtenScripts(commands, known)]) {
      const fired = fileFires(held.text, developer, held.code, inner);
      if (fired) return fired;
    }
  }
  for (const held of read.code) {
    const fired = fileFires(held.text, developer, true, inner);
    if (fired) return fired;
  }
  return null;
}

function planSteps(tree, slug) {
  try {
    const text = fs.readFileSync(planFile(tree, slug), 'utf8');
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

// Whether an installed plugin gives this runner a step run.
function served(runner, root) {
  if (!runner || runner === 'mtp') return false;
  try {
    return RUNNERS.has(runner) && Boolean(loadRunner(runner, { root }).runner);
  } catch {
    return false;
  }
}

// The first of the repo's runners a step run can go through, or '' where no installed plugin serves one.
const stepRunner = (cfg, root) => repoRunners(cfg).find((runner) => served(runner, root)) || '';

function main(input) {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return allow(); }
  const ti = (data && data.tool_input) || {};
  if (!SHELL_TOOLS.test(String(data.tool_name || ''))) return allow();
  // A backslash (sh) or backtick (PowerShell) before a newline continues the line.
  const command = String(ti.command || '').replace(/[\\`]\r?\n/g, ' ');
  const seen = scan(String(ti.command || ''));
  if (!seen.raw && !seen.builds && !seen.runners.length && !seen.labellers.length && !seen.mutator && !seen.scripts.length) return allow();
  if (!data.session_id) return allow();

  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const role = resolveRole(data.agent_type || readSessionPersona(data.session_id, root) || 'main');
  if (!GATED_SEATS.has(role)) return allow();
  const developer = role === 'developer';

  const tree = resolveDeclaredTree(root, data.session_id);
  const cfg = readJson(path.join(tree, '.claude', 'verify.json'));
  const armed = declaresUnit(cfg);
  // The session's own token, at the root whatever tree is resolved (lib/round-token.js).
  const token = readRoundToken(root, data.session_id);

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
  const mutationWhy = `a developer's test runs are its step runs; a mutation battery is the reviewer's or a solo's. ${developerWay()}`;
  if (developer && seen.mutator) return refuse('mutation-run', `the mutation runner (\`mutation-run.js\`): ${mutationWhy}`);

  const cwd = data.cwd || root;
  const declared = declaredFiles(cfg, tree);
  for (const { script, dirs, text: held, code } of seen.scripts) {
    if (held !== undefined) {
      const fired = fileFires(held, developer, code, { writes: seen.writes });
      if (fired === 'raw' && armed) return refuse('script', `\`${script}\`, written by this command, runs a raw test command. ${developer ? developerWay() : soloWay}`);
      if (fired === 'mutation-run') return refuse('mutation-run', `\`${script}\`, written by this command, starts the mutation runner: ${mutationWhy}`);
      if (fired === 'developer') return refuse('script', `\`${script}\`, written by this command, runs a build or the test runner itself. ${developerWay()}`);
      continue;
    }
    if (!developer) continue;
    const name = basename(script).toLowerCase();
    if (UNREAD.has(name) || RUNNER_SCRIPT.test(name) || LABELLER_SCRIPT.test(name) || isExemptScript(name)) continue;
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
    const fired = fileFires(text, developer, CODE_EXT.test(script), { writes: seen.writes });
    if (fired === 'raw' && armed) return refuse('script', `\`${script}\` runs a raw test command. ${developer ? developerWay() : soloWay}`);
    if (fired === 'mutation-run') return refuse('mutation-run', `\`${script}\` starts the mutation runner: ${mutationWhy}`);
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
    // The failed tests' files; where a failure names none, every file attempt 1 ran — the named ones and the ones
    // the repo's step tests added.
    const entries = Array.isArray(first.failed_tests) ? first.failed_tests.filter((t) => t && typeof t === 'object') : [];
    const failed = new Set(entries.map((t) => t.file).filter((f) => typeof f === 'string' && f));
    const ran = [first.files, first.step_tests_added].flatMap((list) => (Array.isArray(list) ? list : []));
    if (!entries.length || entries.some((t) => !t.file)) for (const f of ran) failed.add(f);
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

  // The runner's own refusal, checked before an attempt is reserved: a call it refuses writes no record. Files no
  // routing places stay the main runner's to answer, as they are in the run.
  if (Array.isArray(args.files)) {
    const named = args.files.map(rel);
    const mainRunner = runnerOf(cfg);
    if (!routeFiles({ cfg, files: named, cwd: tree, root, step: true }) && served(mainRunner, root)) {
      try {
        filesCommand({ runner: mainRunner, files: named, exclude: false, cwd: tree, root, step: true });
      } catch (e) {
        return refuse('runner', `the runner would refuse this step run (${e && e.message}). ${developerWay(unit, used + 1, slug)}`);
      }
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
