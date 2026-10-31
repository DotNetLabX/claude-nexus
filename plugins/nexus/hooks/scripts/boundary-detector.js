#!/usr/bin/env node
/**
 * Nexus PostToolUse(Write|Edit|MultiEdit) boundary detector. Async, observe-only — never blocks
 * (PostToolUse cannot block, and this must never wedge a run).
 *
 * Why this exists (evaluation roadmap B.2, unlocked by Probe P1 on 2026-06-10): the platform
 * drops a PreToolUse deny for background subagents (ADR-13), so the pipeline gate cannot
 * PREVENT a backgrounded agent's boundary violation — but PostToolUse hooks DO fire there.
 * Prevention stays with the agents' hard rules (ADR-14/18); this makes every breach
 * DETERMINISTICALLY VISIBLE: a violation appends one JSON line to .claude/audit/violations.log
 * (+ a systemMessage), and the team lead checks the log at every checkpoint instead of hoping
 * an agent self-reports.
 *
 * Scope: SUBAGENT calls only (agent_id present). A main session, one started with `--agent` included
 * (it carries agent_type but no agent_id), is covered by the gate + guard, whose denies ARE honored there.
 *
 * Rules (ADR-18 ownership matrix + ADR-21 delegation):
 *   - a non-code role (architect/reviewer/po/critic/team-lead/learner) writing application source
 *   - a role writing another role's artifact: plan.md=architect, done-check.md=architect,
 *     review.md=reviewer|team-lead (the team lead writes its fix list; the architect is absent because
 *     it writes done-check.md, and its fast-lane fix list is a main-session write this detector skips),
 *     implementation.md=developer, summary.md=team-lead (lessons.md is shared by design). A Codex
 *     done check's done-check.md block is a main-session write, which this detector skips, so a
 *     spawned coordinator hands that check back and never writes the block itself
 *   - ANY subagent writing .claude/.pipeline-state (the team lead owns it, main-session only)
 *   - ANY subagent spawning a pipeline-role agent via Agent/Task (ADR-21: delegated
 *     self-advancement — the F16 incident vector: a developer commissioned done-checks, a
 *     Step-2 review, and a learner as correctly-typed agents, so the ownership rules above
 *     never fired). Research spawns (Explore, general-purpose) are sanctioned.
 *   - ANY subagent running a git command that changes the repository through either shell tool
 *     (ADR-18/20: pipeline agents never commit; the team lead owns commits — the #1 fabrication
 *     vector's commit leg). Every command the line runs is read — each chain segment, substitution,
 *     subshell and block, past assignments and wrappers (`env`, `xargs`, `nohup`…), and the command
 *     string a shell (`bash -c`, `pwsh -Command`, `cmd /c`, `eval`, a heredoc fed to a shell) or
 *     `find -exec` runs; a `git` that is only mentioned (quoted text, a heredoc body, a comment, a
 *     `grep` pattern) is no command. Where git runs (`git`, `git.exe`, a path to either): global flags
 *     skipped, then the verb judged on its own arguments. A verb in WRITE_VERBS flags unless its
 *     arguments ask for a dry run or for help, or are one of the read-only forms readsOnly() lists;
 *     `fetch`, `config`, `clone`, `init`, the reads (`show`/`log`/`diff`/`status`…) and
 *     `git commit-graph` never flag. Best-effort
 *     early-warning only — the team lead's `git log` author check is the guaranteed retroactive catch
 *     (team-lead.md Enforcing the Rules).
 *
 * Zero footprint when clean: nothing is created unless a violation occurs. Fail silent on any
 * error (mirrors audit-logger).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { isCodeFile } = require('./lib/is-code-file');
const { resolveRole } = require('./lib/resolve-role');
const { isSpawned } = require('./lib/is-spawned');
const { splitChain } = require('./lib/test-runners');

const NONCODE_ROLES = new Set(['architect', 'reviewer', 'po', 'critic', 'team-lead', 'learner']);
const PIPELINE_ROLES = new Set(['po', 'architect', 'developer', 'reviewer', 'critic', 'learner', 'team-lead', 'solo']);
const ARTIFACT_OWNERS = [
  [/\/plan\.md$/, new Set(['architect'])],
  [/\/review\.md$/, new Set(['reviewer', 'team-lead'])],
  [/\/done-check\.md$/, new Set(['architect'])],
  // implementation.md is the developer's deliverable AND solo's — solo runs the implement phase
  // outside the team pipeline and writes its own implementation.md (plugin-feedback nexus-1.13.0
  // item 2: flagging solo's own deliverable was a false positive that drowned real breaches).
  [/\/implementation\.md$/, new Set(['developer', 'solo'])],
  [/\/summary\.md$/, new Set(['team-lead'])],
];

function violation(role, fp, root) {
  if (/(^|\/)\.claude\/\.pipeline-state$/.test(fp)) {
    return 'subagent wrote .claude/.pipeline-state — the team lead (main session) is its sole writer (ADR-18)';
  }
  for (const [re, owners] of ARTIFACT_OWNERS) {
    if (re.test(fp) && !owners.has(role)) {
      return `wrote an artifact whose owner is another role (${fp}) — each artifact has exactly one owner (ADR-18)`;
    }
  }
  if (NONCODE_ROLES.has(role) && isCodeFile(fp, root)) {
    return `non-code role edited application source (${fp}) — route code changes to the developer`;
  }
  return null;
}

// Every git verb that moves a branch, the staging area, a working file, a ref or a worktree. A flagged
// line makes the team lead unwind the developer's commits, so a verb that changes none of them —
// `fetch`, `config`, and `clone`/`init`, which make another repository — stays out.
const WRITE_VERBS = new Set([
  'commit', 'add', 'reset', 'push', 'stash', 'restore', 'switch', 'rm', 'mv', 'checkout', 'merge', 'rebase',
  'cherry-pick', 'revert', 'apply', 'am', 'clean', 'tag', 'branch', 'pull', 'update-index', 'update-ref',
  'symbolic-ref', 'read-tree', 'worktree', 'checkout-index', 'sparse-checkout',
]);
// Global options whose value is the next word. The command is lowercased first, so `-c` is `-C` too.
const DETACHED_GLOBALS = new Set(['-c', '--git-dir', '--work-tree', '--namespace', '--config-env']);
const isFlag = (word) => word.startsWith('-');

// Words that run the command after them, each with its options that take the next word as their value.
const WRAPPERS = new Map([
  ['env', new Set(['-u', '--unset', '-c', '--chdir', '-s', '--split-string'])],
  ['xargs', new Set(['-n', '-i', '-l', '-p', '-s', '-d', '-e', '-a', '--max-args', '--max-lines', '--max-procs',
    '--max-chars', '--delimiter', '--eof', '--arg-file'])],
  ['nice', new Set(['-n', '--adjustment'])],
  ['timeout', new Set(['-s', '--signal', '-k', '--kill-after'])],
  ['sudo', new Set(['-u', '-g', '-c', '-r', '-t', '-d', '-p'])],
  ...['nohup', 'command', 'builtin', 'exec', 'time', 'call', '!', 'if', 'elif', 'then', 'else', 'while', 'until', 'do']
    .map((word) => [word, new Set()]),
]);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);
const POWERSHELLS = new Set(['pwsh', 'powershell']);
const EVALS = new Set(['eval', 'iex', 'invoke-expression']);
const FIND_EXEC = new Set(['-exec', '-execdir', '-ok', '-okdir']);
// A command string run by a shell is read too, to this depth.
const MAX_DEPTH = 3;
// A redirection belongs to the shell, never to the command: joined to its target or bare before it.
const REDIRECT = /^(?:\d|\*)?(?:>>?|<{1,3})/;
// A PowerShell here-string and a heredoc carry text, never a command, unless a shell reads the heredoc.
const HERE_STRING = /@(['"])[ \t]*\r?\n[\s\S]*?\r?\n\1@/g;
const HEREDOC = /(?<!<)<<(?!<)-?[ \t]*(['"]?)([a-z_][\w.-]*)\1/;
// A line continued onto the next is one line: by a trailing backslash in sh, by a backtick in PowerShell.
const CONTINUATION = /\\\r?\n/g;
const PS_CONTINUATION = /`\r?\n/g;
// A write verb asked for a dry run or for help changes nothing.
const ASKS_ONLY = new Set(['--dry-run', '-h', '--help']);
// The option that hands a shell its command string: `-c` alone or in a cluster; PowerShell's `-Command`.
const SHELL_C = /^-[a-z]*c[a-z]*$/;
const POWERSHELL_C = /^-c(?:o(?:m(?:m(?:a(?:n(?:d)?)?)?)?)?)?$/;

const basename = (word) => word.replace(/^.*[\\/]/, '').replace(/\.exe$/, '');

// The words of one command, a quoted part joined to the word it sits in and its quote marks dropped,
// redirections left out.
function wordsOf(text) {
  const raw = [];
  let word = null;
  let quote = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = '';
      else if (quote === '"' && ch === '\\' && (text[i + 1] === '"' || text[i + 1] === '\\')) word.text += text[++i];
      else word.text += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      word = word || { text: '', bare: false };
    } else if (/\s/.test(ch)) {
      if (word) raw.push(word);
      word = null;
    } else {
      word = word || { text: '', bare: true };
      word.text += ch;
    }
  }
  if (word) raw.push(word);
  const words = [];
  for (let i = 0; i < raw.length; i++) {
    const redirect = raw[i].bare && REDIRECT.exec(raw[i].text);
    if (!redirect) words.push(raw[i].text);
    else if (redirect[0] === raw[i].text) i++;
  }
  return words;
}

// The commands of a command line: its chain segments (lib/test-runners.js owns what a separator is), each
// cut again where a substitution, a subshell or a block opens or closes. A substitution runs inside double
// quotes too, never inside single quotes.
function piecesOf(text) {
  const pieces = [];
  for (const segment of splitChain(text)) {
    let start = 0;
    let quote = '';
    for (let i = 0; i < segment.length; i++) {
      const ch = segment[i];
      if (quote === "'") { if (ch === quote) quote = ''; continue; }
      const opens = ch === '`' || (ch === '$' && segment[i + 1] === '(');
      if (opens || (!quote && '(){}'.includes(ch))) {
        pieces.push(segment.slice(start, i));
        if (ch === '$') i++;
        start = i + 1;
        quote = '';
      } else if (ch === quote) quote = '';
      else if (!quote && (ch === '"' || ch === "'")) quote = ch;
    }
    pieces.push(segment.slice(start));
  }
  return pieces;
}

// Where the command starts: past leading assignments, and past each wrapper with its options.
function commandStart(words) {
  let i = 0;
  for (;;) {
    while (i < words.length && /^[a-z_]\w*=/.test(words[i])) i++;
    if (/^\$[\w:]+$/.test(words[i] || '') && words[i + 1] === '=') { i += 2; continue; }
    const wrapper = basename(words[i] || '');
    const valued = WRAPPERS.get(wrapper);
    if (!valued) return i;
    const duration = wrapper === 'timeout';
    i++;
    while (i < words.length && isFlag(words[i])) i += valued.has(words[i]) ? 2 : 1;
    if (duration && /^\d/.test(words[i] || '')) i++;
  }
}

// A heredoc's body taken out of the command line, and kept apart where the command it feeds is a shell.
function withoutHeredocs(text) {
  const lines = text.split('\n');
  const kept = [];
  const run = [];
  for (let i = 0; i < lines.length; i++) {
    const m = HEREDOC.exec(lines[i]);
    if (!m) { kept.push(lines[i]); continue; }
    const head = lines[i].slice(0, m.index);
    kept.push(head + lines[i].slice(m.index + m[0].length));
    const body = [];
    for (i++; i < lines.length && lines[i].replace(/^\t+/, '').trim() !== m[2]; i++) body.push(lines[i]);
    const words = wordsOf(splitChain(head).at(-1));
    const exe = basename(words[commandStart(words)] || '');
    const ps = POWERSHELLS.has(exe);
    const readsStdin = (SHELLS.has(exe) && !words.some((w) => SHELL_C.test(w)))
      || (ps && !words.some((w) => POWERSHELL_C.test(w)));
    if (readsStdin) run.push({ body: body.join('\n'), ps });
  }
  return { text: kept.join('\n'), run };
}

// A `#` that starts a word outside quotes opens a comment to the end of its line, in both shells.
function withoutComments(text) {
  let out = '';
  let quote = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!quote && ch === '#' && (i === 0 || /[\s;&|()]/.test(text[i - 1]))) {
      while (i + 1 < text.length && text[i + 1] !== '\n') i++;
      continue;
    }
    out += ch;
    if (quote === '"' && ch === '\\') out += text[++i] ?? '';
    else if (ch === quote) quote = '';
    else if (!quote && (ch === '"' || ch === "'")) quote = ch;
  }
  return out;
}

// `branch`/`tag` only list: no argument names a branch or tag outside list mode. A listing or display flag
// (alone or in a short cluster), a flag taking a sort key or a format with its value, a filter flag that
// takes a commit; a name only in list mode, which `--list`, a filter flag and, for `tag`, `-n` and `-v`
// open.
const LIST_FILTERS = new Set(['--contains', '--no-contains', '--merged', '--no-merged', '--points-at']);
const DISPLAY = (a) => /^--(?:format|color|column|abbrev|sort)(?:=|$)|^--no-(?:color|column|abbrev)$/.test(a)
  || a === '--ignore-case' || a === '--omit-empty';
const BRANCH_LISTING = {
  plain: new Set(['--all', '--remotes', '--verbose', '--show-current']),
  lists: new Set(['--list']),
  cluster: /^-[arvil]+$/,
  listLetters: /l/,
};
const TAG_LISTING = {
  plain: new Set(),
  lists: new Set(['--list', '--verify']),
  cluster: /^-[lnvi]*(?:n\d+)?$/,
  listLetters: /[lnv]/,
};

function listsOnly(args, { plain, lists, cluster, listLetters }) {
  let list = false;
  let named = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') { named = named || i + 1 < args.length; break; }
    if (!isFlag(a)) { named = true; continue; }
    if (LIST_FILTERS.has(a.split('=')[0]) || lists.has(a)) { list = true; continue; }
    if (a === '--sort' || a === '--format') { i++; continue; }
    if (plain.has(a) || DISPLAY(a)) continue;
    if (a.length > 1 && cluster.test(a)) { list = list || listLetters.test(a); continue; }
    return false;
  }
  return !named || list;
}

// The read-only forms of a write verb, judged on that verb's own arguments.
function readsOnly(verb, args) {
  const first = args[0];
  switch (verb) {
    case 'stash': return first === 'list' || first === 'show';
    case 'worktree': return first === 'list' || (first === 'prune' && args.some((a) => a === '-n' || a === '--dry-run'));
    case 'sparse-checkout': return first === 'list';
    case 'checkout': return args.length === 0;
    case 'branch': return listsOnly(args, BRANCH_LISTING);
    case 'tag': return listsOnly(args, TAG_LISTING);
    case 'apply': return !args.includes('--apply')
      && args.some((a) => ['--check', '--stat', '--numstat', '--summary'].includes(a));
    case 'clean': return args.some((a) => a === '--dry-run' || /^-[dfnqx]*n[dfnqx]*$/.test(a));
    case 'symbolic-ref': return args.filter((a) => !isFlag(a)).length === 1
      && args.filter(isFlag).every((a) => ['-q', '--quiet', '--short'].includes(a));
    default: return false;
  }
}

// A git command's arguments change the repository: global flags skipped, then the verb and its own arguments
// (the options before a `--`).
function gitArgsWrite(args) {
  let i = 0;
  while (i < args.length && isFlag(args[i])) {
    if (ASKS_ONLY.has(args[i])) return false;
    i += DETACHED_GLOBALS.has(args[i]) ? 2 : 1;
  }
  if (!WRITE_VERBS.has(args[i])) return false;
  const own = args.slice(i + 1);
  const end = own.indexOf('--');
  if ((end < 0 ? own : own.slice(0, end)).some((a) => ASKS_ONLY.has(a))) return false;
  return !readsOnly(args[i], own);
}

// The command in `words` changes the repository: git run as the command, or a command string a shell, an
// eval or `find -exec` runs. `ps`: the line is PowerShell's.
function runsWrite(words, depth, ps) {
  const at = commandStart(words);
  if (at >= words.length) return false;
  const exe = basename(words[at]);
  const rest = words.slice(at + 1);
  if (exe === 'git') return gitArgsWrite(rest);
  if (depth >= MAX_DEPTH) return false;
  if (SHELLS.has(exe)) {
    let k = 0;
    while (k < rest.length && /^[-+]./.test(rest[k]) && !SHELL_C.test(rest[k])) {
      k += ['-o', '+o', '--rcfile', '--init-file'].includes(rest[k]) ? 2 : 1;
    }
    const script = SHELL_C.test(rest[k] || '') ? rest.slice(k + 1).find((w) => !isFlag(w)) : undefined;
    return script !== undefined && writes(script, depth + 1, false);
  }
  if (POWERSHELLS.has(exe)) {
    const k = rest.findIndex((w) => POWERSHELL_C.test(w));
    return k >= 0 && writes(rest.slice(k + 1).join(' '), depth + 1, true);
  }
  if (exe === 'cmd') {
    const k = rest.findIndex((w) => w === '/c' || w === '/k');
    return k >= 0 && writes(rest.slice(k + 1).join(' '), depth + 1, false);
  }
  if (EVALS.has(exe)) return writes(rest.join(' '), depth + 1, ps);
  if (exe === 'find') {
    const k = rest.findIndex((w) => FIND_EXEC.has(w));
    return k >= 0 && runsWrite(rest.slice(k + 1), depth + 1, ps);
  }
  return false;
}

function writes(command, depth, ps) {
  const c = command.replace(HERE_STRING, () => "''").replace(/[<>]&/g, (m) => m[0]).replace(/&>/g, () => '>');
  const { text, run } = withoutHeredocs(c);
  if (depth < MAX_DEPTH && run.some((doc) => writes(doc.body, depth + 1, doc.ps))) return true;
  const joined = withoutComments(text).replace(ps ? PS_CONTINUATION : CONTINUATION, () => ' ');
  return piecesOf(joined).some((piece) => runsWrite(wordsOf(piece), depth, ps));
}

// True when a command the line runs is a git command that changes the repository — a `git` that a command
// only mentions (in quoted text, a heredoc, a comment, a `grep` pattern) is no command. `tool`: the shell
// tool that runs the line, `Bash` (the default) or `PowerShell`.
function gitWrite(command, tool) {
  return writes(String(command || '').toLowerCase(), 0, tool === 'PowerShell');
}

module.exports = { gitWrite };

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (input += d));
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input || '{}');
      if (!/^(Write|Edit|MultiEdit|Agent|Task|TaskCreate|TaskUpdate|Bash|PowerShell)$/.test(data.tool_name || '')) return process.exit(0);
      if (!isSpawned(data)) return process.exit(0); // main session: the foreground gate + team lead cover it
      // resolveRole strips a `nexus:` namespace AND a custom/auto-suffixed spawn name (developer-2,
      // developer-f6) to its base role — without it ARTIFACT_OWNERS false-flags a suffixed developer
      // writing its OWN implementation.md. plugin-feedback from two consuming repos.
      const role = resolveRole(data.agent_type);
      const ti = data.tool_input || {};
      const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();

      let rule = null;
      let fp = '';
      if (/^(Agent|Task)$/.test(data.tool_name)) {
        // ADR-21: delegated self-advancement — a subagent commissioning pipeline-role agents.
        const target = resolveRole(ti.subagent_type);
        if (!PIPELINE_ROLES.has(target)) return process.exit(0); // research spawns are sanctioned
        fp = String(ti.subagent_type || '');
        rule = `subagent spawned a pipeline-role agent (${target}) — pipeline advancement belongs to the team lead alone (ADR-21)`;
      } else if (/^Task(Create|Update)$/.test(data.tool_name)) {
        // ADR-21 (peer channel): a subagent re-owning a task to ANOTHER agent via the task system.
        // Assignment = setting `owner` (TaskCreate makes owner-less tasks; TaskUpdate sets owner). A
        // subagent legitimately claims its OWN task (owner === its own spawn identity) or updates status
        // (no owner); assigning work to a peer is the team lead's alone. The Agent/Task spawn branch above
        // can't see this — it's a different tool. (A consuming repo's plugin-feedback — developer-2
        // assigned "Step 2" to developer-1.)
        // Compare RAW identities, not base roles: developer-2 and developer-1 both resolve to `developer`,
        // so a base-role compare would mistake a peer hand-off for a self-claim and miss it. (A base-role
        // self-claim — owner `developer` while spawned `developer-2` — may log; the detector is
        // observe-only, so the team lead adjudicates that rare case rather than the breach going unseen.)
        const ownerRaw = String(ti.owner || '').toLowerCase();
        const selfRaw = String(data.agent_type || '').toLowerCase();
        // Exempt a self-claim by EITHER the exact spawn identity (developer-2 -> developer-2) OR the
        // bare base role of self (developer-2 -> "developer") — an agent naturally claims its own task as
        // "the developer". A peer hand-off (developer-2 -> developer-1) still differs from both, so it
        // still flags. Without the base-role exemption the raw compare re-introduces the very suffix
        // noise resolve-role removed (a real developer-2 emits `TaskUpdate{owner:"developer"}`).
        if (!ownerRaw || ownerRaw === selfRaw || ownerRaw === resolveRole(data.agent_type)) return process.exit(0);
        fp = `${data.tool_name} owner=${ti.owner}`;
        rule = `subagent re-owned a task to another agent (${ti.owner}) — cross-agent task assignment belongs to the team lead alone (ADR-21 peer-orchestration)`;
      } else if (/^(Bash|PowerShell)$/.test(data.tool_name)) {
        // ADR-18/20: pipeline agents never commit — the team lead owns commits. A subagent running a
        // git command that changes the repository is the #1 fabrication vector's commit leg. Best-effort
        // EARLY-WARNING layer only; the team lead's `git log` author check at every verify point is the
        // GUARANTEED retroactive catch (it unwinds any commit not authored by the team lead, however it was made).
        //
        // Every command of the LOWERCASED line is read, not only its first: `git status && git commit -m x`
        // and `bash -c "git commit …"` both run a commit, and a missed write is a silently undetected
        // breach. A `git` only mentioned is no command, because a flagged line forces the team lead to
        // unwind the step commits. The verb is a whole word, so `git commit-graph` is not `git commit`.
        //
        // A read-only form is judged on its own arguments only, up to the end of its command, so a
        // developer proving a pre-existing failure runs `git stash list` unflagged (plugin-feedback
        // nexus-1.13.0 item 5) while a chained `git stash list && git commit -m x` still flags the commit.
        if (!gitWrite(ti.command, data.tool_name)) return process.exit(0);
        fp = String(ti.command || '');
        rule = 'subagent ran a git write — pipeline agents never commit; the team lead owns commits (ADR-18, commit strategy ADR-20)';
      } else {
        fp = String(ti.file_path || ti.path || '').replace(/\\/g, '/');
        if (!fp) return process.exit(0);
        rule = violation(role, fp, root);
        if (!rule) return process.exit(0);
      }

      const dir = path.join(root, '.claude', 'audit');
      fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(
        path.join(dir, 'violations.log'),
        JSON.stringify({ ts: new Date().toISOString(), agent: role, tool: data.tool_name, path: fp, rule }) + '\n'
      );
      process.stdout.write(JSON.stringify({
        systemMessage: `Nexus boundary detector: ${role} ${data.tool_name} -> ${fp} (${rule}). Logged to .claude/audit/violations.log.`,
      }));
    } catch { /* fail silent — observe-only */ }
    process.exit(0);
  });
}
