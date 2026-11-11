'use strict';
/**
 * The stages of close-run.js (ADR-184): a feature's plain close sequence as one command, called twice from
 * the session root — `before` the summary and `after` it. `main(argv, deps)` is exported so the tests drive the
 * stages with an injected command runner (`deps.run`); every git command and script goes through it.
 *
 * Saved progress lives in `{session root}/.claude/audit/close-run/{slug}.json`, bound to the tree and its branch,
 * and is progress, never evidence: the stages that change the repository are skipped once finished, the others
 * read the repository again. One call at a time per slug, held by `{slug}.lock` (created exclusively, holding the
 * process id); a lock whose process is gone is never taken over — the call exits 2 naming it for the caller to remove.
 *
 * The result is plain text, one line per stage and a last line, at most 40 lines; what is cut is kept beside the
 * state. Exit 0 done or ended at `--until`, 3 stopped for the caller, 2 refused with nothing changed.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { resolveDeclaredTree } = require('./worktree-target');
const { resolveDefaultBranch } = require('./default-branch');
const { pipelineWrite, sameTree, treeHash } = require('./tree-hash');
const { globToRegExp } = require('./prose-tests');
const { staleRegistries, advisoryMessage } = require('./registry-stamp');
const { untouchedTimeouts } = require('./run-verdict');
const { stagesOf, isAssignment } = require('./test-runners');

const SCRIPTS = path.join(__dirname, '..');
const STAGES = {
  before: ['commits', 'commit', 'merge-in', 'release', 'tests', 'record'],
  after: ['record', 'backlog', 'commit', 'merge', 'push'],
};
const ONCE = new Set(['commits', 'commit', 'merge-in', 'backlog', 'merge', 'push']);
const VALUE_FLAGS = new Set(['slug', 'session', 'tree', 'message-file', 'exclude', 'paths-file', 'until', 'record-cmd', 'backlog-status']);
const BOOL_FLAGS = new Set(['settled', 'restart', 'merge', 'push']);
const MAX_LINES = 40;
const CUT = 20;
const RECORD_LIMIT_MS = 10 * 60 * 1000;
const BACKLOG = 'docs/backlog.md';
const CLOSE_GATE = 'team-lead.md § Close Gate, item 5';
const RED_RUNS = 'agents-workflow.md § Red runs';
// The summary gate's refusals the complete run answers, and those a run of each named file answers.
// `uncovered` names changed files a run by name cannot cover, so it takes the complete run as a stale record does.
const SUITE_CAUSES = new Set(['missing', 'wrong-tree', 'stale', 'uncovered']);
const BY_NAME_CAUSES = new Set(['unrepaired']);

class Refusal extends Error {}
const refuse = (why) => { throw new Refusal(why); };
const slash = (p) => String(p).replace(/\\/g, '/');
const firstLine = (text) => String(text || '').trim().split(/\r?\n/)[0] || 'no output';
const short = (sha) => String(sha || '').slice(0, 7);

// A shell command is passed as one string with no argument list: a list beside `shell` is joined unquoted.
function defaultRun(cmd, args, opts = {}) {
  const options = {
    cwd: opts.cwd, env: opts.env || process.env, encoding: 'utf8', windowsHide: true,
    timeout: opts.timeout, maxBuffer: 256 * 1024 * 1024,
  };
  const r = opts.shell ? spawnSync(cmd, { ...options, shell: true }) : spawnSync(cmd, args, options);
  const timedOut = Boolean(r.error && r.error.code === 'ETIMEDOUT');
  return {
    status: typeof r.status === 'number' ? r.status : 1,
    stdout: r.stdout || '',
    stderr: `${r.stderr || ''}${r.error && !timedOut ? String(r.error.message) : ''}`,
    timedOut,
  };
}

function isAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

function parseArgs(argv) {
  const [sub, ...rest] = argv;
  const flags = { exclude: [] };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith('--')) refuse(`unexpected argument ${a}`);
    const name = a.slice(2);
    if (BOOL_FLAGS.has(name)) { flags[name] = true; continue; }
    if (!VALUE_FLAGS.has(name)) refuse(`unknown option ${a}`);
    const value = rest[i + 1];
    if (value === undefined || value.startsWith('--')) refuse(`${a} needs a value`);
    i++;
    if (name === 'exclude') flags.exclude.push(value);
    else flags[name] = value;
  }
  return { sub, flags };
}

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

// The folder under docs/specs/ holding delivery/ whose leaf name is the slug: an epic's story or a part sits
// one or two folders down.
function findFeature(tree, slug) {
  const found = [];
  const walk = (dir, rel, depth) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || e.name === 'delivery' || e.name === 'definition') continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      const abs = path.join(dir, e.name);
      if (e.name === slug && fs.existsSync(path.join(abs, 'delivery'))) found.push(r);
      if (depth < 3) walk(abs, r, depth + 1);
    }
  };
  walk(path.join(tree, 'docs', 'specs'), '', 0);
  if (found.length === 0) refuse(`no folder under docs/specs/ in ${tree} is ${slug} with a delivery/ folder`);
  if (found.length > 1) refuse(`more than one folder under docs/specs/ ends with ${slug}: ${found.join(', ')}`);
  return { rel: `docs/specs/${found[0]}`, abs: path.join(tree, 'docs', 'specs', ...found[0].split('/')) };
}

// As commit-step.js reads the campaign unit's marker: it names this branch, and this slug as its unit or a story.
function markerNames(marker, branch, slug) {
  if (!marker || typeof marker !== 'object' || marker.branch !== branch) return false;
  return marker.unit === slug || (Array.isArray(marker.stories) && marker.stories.includes(slug));
}

// As merge-close.js reads the shared records: the backlog, plus the `sharedRecords` patterns.
function sharedMatcher(tree) {
  let list = [];
  try {
    const value = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'nexus-agents.json'), 'utf8')).sharedRecords;
    if (Array.isArray(value) && value.every((p) => typeof p === 'string' && p.trim() !== '')) list = value;
  } catch { /* no config: the backlog alone */ }
  const res = list.map(globToRegExp);
  return (rel) => rel === BACKLOG || res.some((re) => re.test(rel));
}

function stateFiles(root, slug) {
  const dir = path.join(root, '.claude', 'audit', 'close-run');
  return { dir, state: path.join(dir, `${slug}.json`), lock: path.join(dir, `${slug}.lock`) };
}

function loadState(file) {
  try {
    const s = JSON.parse(fs.readFileSync(file, 'utf8'));
    return s && typeof s === 'object' ? s : null;
  } catch { return null; }
}

function saveState(ctx) {
  fs.mkdirSync(ctx.files.dir, { recursive: true });
  const tmp = `${ctx.files.state}.${ctx.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(ctx.state, null, 2)}\n`);
  fs.renameSync(tmp, ctx.files.state);
}

const createExclusive = (file, text) => {
  try { fs.writeFileSync(file, text, { flag: 'wx' }); return true; } catch (e) { if (e.code !== 'EEXIST') throw e; return false; }
};
const ageMs = (file) => { try { return Date.now() - fs.statSync(file).mtimeMs; } catch { return 0; } };

// A lock with no process id yet is being written, unless it has been empty this long: its writer died.
const EMPTY_LOCK_MS = 60 * 1000;

// Why the lock as read cannot be taken, or '' when its holder is gone.
function lockBusy(text, file, pid, alive) {
  const held = parseInt(text, 10);
  if (Number.isInteger(held) && held > 0) {
    return held !== pid && alive(held) ? `another close-run call is running for this feature (process ${held}) — wait for it to end` : '';
  }
  return ageMs(file) < EMPTY_LOCK_MS ? 'another close-run call is starting for this feature — wait for it, then call again' : '';
}

// Created exclusively, and never taken over: a call that removed a lock it judged abandoned could remove one another
// call had just created, so a lock whose holder is gone is left for the caller to remove.
function takeLock(lock, pid, alive) {
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  if (createExclusive(lock, String(pid))) return;
  const text = readText(lock);
  if (text === null) refuse('another close-run call for this feature has just ended — call again');
  const busy = lockBusy(text, lock, pid, alive);
  refuse(busy || `the lock ${lock} was left by a close-run call that is gone — remove it, then call again`);
}

function releaseLock(lock, pid) {
  if (readText(lock) === String(pid)) { try { fs.unlinkSync(lock); } catch { /* gone already */ } }
}

function prepare(argv, deps, held) {
  const env = deps.env || process.env;
  const { sub, flags } = parseArgs(argv);
  if (!STAGES[sub]) refuse(`the first word is before or after, not ${sub || 'nothing'}`);
  if (!flags.slug) refuse('--slug is required');
  if (!/^[A-Za-z0-9._-]+$/.test(flags.slug)) refuse(`--slug ${flags.slug} is not a folder name`);
  if (!flags.session) refuse('--session is required — the id of the session the close runs in');
  if (flags.until && !STAGES[sub].includes(flags.until)) refuse(`--until ${flags.until} is not a stage of ${sub}: ${STAGES[sub].join(', ')}`);
  const slug = flags.slug;
  const run = deps.run || defaultRun;
  const root = path.resolve(env.CLAUDE_PROJECT_DIR || deps.cwd || process.cwd());
  const tree = path.resolve(flags.tree || resolveDeclaredTree(root, flags.session));
  const git = (args, opts = {}) => run('git', ['-C', tree, ...args], { cwd: tree, ...opts });

  const inside = git(['rev-parse', '--is-inside-work-tree']);
  if (inside.status !== 0 || inside.stdout.trim() !== 'true') refuse(`${tree} is not a git work tree`);
  const head = git(['symbolic-ref', '--quiet', '--short', 'HEAD']);
  const branch = head.status === 0 ? head.stdout.trim() : '';
  if (!branch) refuse(`HEAD is detached in ${tree} — check out the feature's branch`);
  const feature = findFeature(tree, slug);
  if (sub === 'after' && !fs.existsSync(path.join(feature.abs, 'delivery', 'summary.md'))) {
    refuse(`${feature.rel}/delivery/summary.md is not in ${tree} — after runs once the summary is written`);
  }
  const deflt = (deps.defaultBranch || resolveDefaultBranch)(tree);

  let marker = null;
  const markerText = readText(path.join(tree, '.claude', '.campaign-unit'));
  if (markerText !== null) { try { marker = JSON.parse(markerText); } catch { marker = {}; } }
  const dirs = git(['rev-parse', '--path-format=absolute', '--git-dir', '--git-common-dir']).stdout.split(/\r?\n/).filter(Boolean);
  const linked = dirs.length === 2 && path.resolve(dirs[0]) !== path.resolve(dirs[1]);
  const own = linked && (branch === slug || branch.endsWith(`/${slug}`) || markerNames(marker, branch, slug));

  // `before` on the default branch commits nothing, so it needs neither a file list nor a message.
  const offDefault = branch !== deflt.name;
  const commits = sub === 'after' || offDefault;
  let listed = null;
  if (flags['paths-file']) {
    const text = readText(path.resolve(root, flags['paths-file']));
    if (text === null) refuse(`cannot read --paths-file ${flags['paths-file']}`);
    listed = [...new Set(text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((p) => relative(tree, p)))];
  } else if (commits && !own) {
    refuse('this tree is not a worktree of the feature\'s own (a linked worktree on the feature\'s branch) — pass --paths-file with the paths to commit');
  }

  const messageFile = flags['message-file'] ? path.resolve(root, flags['message-file']) : null;
  if (!messageFile && commits) {
    refuse(`--message-file is required ${sub === 'after' ? 'for after' : 'for before on a branch other than the default branch'}`);
  }
  if (messageFile && readText(messageFile) === null) refuse(`cannot read --message-file ${flags['message-file']}`);

  const pid = deps.pid || process.pid;
  const files = stateFiles(root, slug);
  takeLock(files.lock, pid, deps.alive || isAlive);
  held.lock = files.lock;
  held.pid = pid;
  let state = flags.restart ? null : loadState(files.state);
  if (state && (!sameTree(state.tree, tree) || state.branch !== branch)) {
    refuse(`the saved progress is for ${state.tree} on ${state.branch}, not ${tree} on ${branch} — pass --restart to clear it`);
  }
  if (!state) state = { tree, branch, finished: [], stops: [], data: {} };
  for (const k of ['finished', 'stops']) if (!Array.isArray(state[k])) state[k] = [];
  if (!state.data || typeof state.data !== 'object') state.data = {};

  return {
    sub, flags, slug, run, root, tree, git, branch, feature, deflt, marker, campaign: markerText !== null,
    own, listed, offDefault, messageFile, pid, files, state, env,
    treeHash: deps.treeHash || treeHash,
    gate: deps.gate || null,
    onBacklogWrite: deps.onBacklogWrite || null,
    excludes: flags.exclude.map((x) => relative(tree, x).replace(/\/+$/, '')),
  };
}

function relative(tree, p) {
  const rel = path.isAbsolute(p) ? path.relative(tree, p) : p;
  return slash(rel).replace(/^\.\//, '');
}

// ── git reads ────────────────────────────────────────────────────────────────────────────────────────

const zList = (text) => String(text || '').split('\0').filter(Boolean);
const cached = (ctx) => zList(ctx.git(['diff', '--cached', '--name-only', '-z', '--no-renames']).stdout);
const inMerge = (ctx) => ctx.git(['rev-parse', '-q', '--verify', 'MERGE_HEAD']).status === 0;

function tipOf(ctx, ref) {
  const r = ctx.git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
  return r.status === 0 ? r.stdout.trim() : '';
}

function currentBranch(ctx) {
  const r = ctx.git(['symbolic-ref', '--quiet', '--short', 'HEAD']);
  return r.status === 0 ? r.stdout.trim() : '';
}

// Every changed and untracked file of the tree, less the excluded paths and the pipeline's own local files.
function ownChanges(ctx) {
  const r = ctx.git(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames']);
  const out = [];
  for (const entry of zList(r.stdout)) {
    const p = entry.slice(3);
    if (!p || pipelineWrite(p) || ctx.excludes.some((x) => p === x || p.startsWith(`${x}/`))) continue;
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

// ── the stages ───────────────────────────────────────────────────────────────────────────────────────

function planBase(ctx) {
  const text = readText(path.join(ctx.feature.abs, 'delivery', 'plan.md')) || '';
  const m = text.match(/^\*\*Base:\*\*\s*`?([0-9a-f]{7,40})\b/m);
  return m ? m[1] : '';
}

function stageCommits(ctx) {
  let base = planBase(ctx);
  if (!base) {
    const mb = ctx.git(['merge-base', 'HEAD', ctx.deflt.name]);
    base = mb.status === 0 ? mb.stdout.trim() : '';
  }
  if (!base) return { status: 'skipped', why: `no plan base and no merge-base with ${ctx.deflt.name}` };
  const r = ctx.run(process.execPath, [path.join(SCRIPTS, 'foreign-commits.js'), '--base', base, '--repo', ctx.tree, '--ref', ctx.deflt.name], { cwd: ctx.root });
  if (r.status !== 0) return { status: 'skipped', why: `foreign-commits.js could not read: ${firstLine(r.stderr || r.stdout)}` };
  let report;
  try { report = JSON.parse(r.stdout); } catch { return { status: 'skipped', why: 'foreign-commits.js printed no report' }; }
  const over = (report.commits || []).filter((c) => Array.isArray(c.files) && c.files.length);
  return {
    status: 'done',
    why: `${report.total} on ${report.ref} since ${short(base)}, ${over.length} touching this feature's files`,
    list: over.map((c) => `${short(c.sha)} ${c.subject} (${c.files.join(', ')})`),
  };
}

// The staging rule: exactly the listed paths, or in the feature's own worktree every change but the excluded and
// the pipeline's files; the staged set must equal the intended one, and a stop unstages what this call staged.
function commitChanges(ctx) {
  const now = currentBranch(ctx);
  if (now !== ctx.state.branch) return { status: 'stopped', why: `the branch is ${now || 'detached'}, not ${ctx.state.branch}`, next: `check out ${ctx.state.branch}, then call again` };
  // Staging during a merge marks its conflicts resolved and commits them, markers included.
  if (inMerge(ctx)) return { status: 'stopped', why: 'a merge is in progress', next: `finish it by ${CLOSE_GATE} and commit it, then call again` };
  const intended = ctx.listed || ownChanges(ctx);
  if (!intended.length) return { status: 'skipped', why: 'nothing uncommitted' };
  const before = new Set(cached(ctx));
  const added = intended.filter((p) => !before.has(p));
  const undo = () => { if (added.length) ctx.git(['--literal-pathspecs', 'reset', '-q', '--', ...added]); };
  const add = ctx.git(['--literal-pathspecs', 'add', '-A', '--', ...intended]);
  if (add.status !== 0) {
    undo();
    return { status: 'stopped', why: `git add failed: ${firstLine(add.stderr)}`, next: 'fix what git names, then call again' };
  }
  const staged = cached(ctx);
  const want = new Set(intended);
  if (staged.length !== want.size || staged.some((p) => !want.has(p))) {
    undo();
    return {
      status: 'stopped',
      why: 'the staged set differs from the intended one; nothing committed',
      list: [
        ...staged.filter((p) => !want.has(p)).map((p) => `${p} — staged, not intended`),
        ...intended.filter((p) => !staged.includes(p)).map((p) => `${p} — intended, not staged`),
      ],
      next: 'unstage what another writer staged, or name the paths in --paths-file, then call again',
    };
  }
  // Named paths make git commit them alone from HEAD, under its index lock, so what another session stages after
  // the check above stays staged and out of the commit.
  const c = ctx.git(['--literal-pathspecs', 'commit', '-q', '-F', ctx.messageFile, '--', ...intended]);
  if (c.status !== 0) {
    undo();
    return { status: 'stopped', why: `git commit failed: ${firstLine(c.stderr || c.stdout)}`, output: `${c.stdout}${c.stderr}`, next: 'fix what git names, then call again' };
  }
  const sha = ctx.git(['rev-parse', 'HEAD']).stdout.trim();
  const committed = zList(ctx.git(['diff-tree', '-r', '--no-commit-id', '--name-only', '-z', '--no-renames', '--root', sha]).stdout);
  const stale = staleRegistries(ctx.tree, intended);
  return {
    status: 'done',
    why: `${short(sha)}, ${committed.length} path${committed.length === 1 ? '' : 's'}`,
    list: committed,
    notes: stale.length ? [advisoryMessage(stale)] : [],
    sha,
  };
}

function stageScopedCommit(ctx) {
  if (!ctx.offDefault) return { status: 'skipped', why: 'on the default branch' };
  if (inMerge(ctx)) return { status: 'skipped', why: 'the merge-in is in progress' };
  const behind = parseInt(ctx.git(['rev-list', '--count', `HEAD..${ctx.deflt.name}`]).stdout, 10);
  if (!(behind > 0)) return { status: 'skipped', why: `the branch holds ${ctx.deflt.name}'s tip` };
  return commitChanges(ctx);
}

function conflictStop(ctx, why) {
  const shared = sharedMatcher(ctx.tree);
  const conflicted = zList(ctx.git(['diff', '--name-only', '--diff-filter=U', '-z']).stdout);
  return {
    status: 'stopped',
    why,
    list: conflicted.map((p) => `${p} — ${shared(p) ? 'shared record' : 'other'}`),
    next: `resolve each path by ${CLOSE_GATE}, commit the merge, then call again`,
  };
}

function stageMergeIn(ctx) {
  const name = ctx.deflt.name;
  if (!ctx.offDefault) return { status: 'skipped', why: 'on the default branch' };
  if (inMerge(ctx)) return conflictStop(ctx, `the merge of ${name} is still in progress`);
  const tip = tipOf(ctx, name);
  if (!tip) return { status: 'stopped', why: `git cannot read ${name}`, next: 'name the default branch in .claude/.base-branch, then call again' };
  if (ctx.git(['merge-base', '--is-ancestor', tip, 'HEAD']).status === 0) {
    ctx.state.data.mergedTip = tip;
    const stoppedBefore = ctx.state.stops.some((s) => s.call === ctx.sub && s.stage === 'merge-in');
    return stoppedBefore ? { status: 'done', why: `the merge of ${name} is committed` } : { status: 'skipped', why: `the branch already holds ${name}` };
  }
  const m = ctx.git(['merge', '--no-ff', '--no-edit', name]);
  if (m.status === 0) {
    ctx.state.data.mergedTip = tip;
    return { status: 'done', why: `${name} merged in at ${short(ctx.git(['rev-parse', 'HEAD']).stdout.trim())}` };
  }
  if (inMerge(ctx)) return conflictStop(ctx, `conflict merging ${name}`);
  return { status: 'stopped', why: `git refused the merge: ${firstLine(m.stderr || m.stdout)}`, output: `${m.stdout}${m.stderr}`, next: 'clear what git names, then call again' };
}

// A finished merge-in stands only while the default branch is where it was merged from; the catch-up is by hand.
function mergeInFinished(ctx) {
  const name = ctx.deflt.name;
  const tip = tipOf(ctx, name);
  const merged = ctx.state.data.mergedTip;
  if (!merged || !tip || tip === merged) return { status: 'skipped', why: 'finished earlier' };
  if (ctx.git(['merge-base', '--is-ancestor', tip, 'HEAD']).status === 0) {
    ctx.state.data.mergedTip = tip;
    return { status: 'skipped', why: `finished earlier, and the branch holds ${name}'s new tip` };
  }
  return { status: 'stopped', why: `catch-up owed — ${name} moved since the merge-in`, next: `catch up by ${CLOSE_GATE}, then call again` };
}

// The words of a command that is one `node` stage of plain words, as verify-run.js tells its direct form
// (lib/test-runners.js `stagesOf`): leading assignments become `env`. Null for a chain, a pipe, a redirection, an
// escape, a word a shell may expand, or any other command.
function directNode(command) {
  const stages = stagesOf(String(command), { values: true });
  if (!stages || stages.length !== 1) return null;
  const list = stages[0];
  if (list.some((w) => !w.quoted && /[*?]/.test(w.text))) return null;
  let i = 0;
  const env = {};
  for (; i < list.length && isAssignment(list[i]); i++) {
    const eq = list[i].text.indexOf('=');
    env[list[i].text.slice(0, eq)] = list[i].text.slice(eq + 1);
  }
  if (i >= list.length || list[i].text !== 'node') return null;
  return { args: list.slice(i + 1).map((w) => w.text), env };
}

// A direct `node` stage runs as this Node with its words apart; any other command runs through the shell as one
// string, so a chain runs whole, a launcher a shell resolves (`npm`, `npx`) works, and the shell reads its quoting.
function runCommand(ctx, command, opts) {
  const direct = directNode(command);
  if (direct) {
    const env = Object.keys(direct.env).length ? { ...(opts.env || process.env), ...direct.env } : opts.env;
    return ctx.run(process.execPath, direct.args, { ...opts, env });
  }
  return ctx.run(command, [], { ...opts, shell: true });
}

function closeCommands(tree) {
  const text = readText(path.join(tree, '.claude', 'nexus-agents.json'));
  if (text === null) return { list: [] };
  let cfg;
  try { cfg = JSON.parse(text); } catch { return { malformed: true }; }
  const value = cfg && cfg.closeCommands;
  if (value === undefined || (Array.isArray(value) && value.length === 0)) return { list: [] };
  if (!Array.isArray(value) || !value.every((c) => typeof c === 'string' && c.trim() !== '')) return { malformed: true };
  return { list: value };
}

function stageRelease(ctx) {
  const { list, malformed } = closeCommands(ctx.tree);
  if (malformed) return { status: 'stopped', why: 'closeCommands in .claude/nexus-agents.json is not a list of command strings', next: 'fix the list, then call again' };
  if (!list.length) return { status: 'skipped', why: 'none declared' };
  const data = ctx.state.data;
  const settled = Boolean(ctx.flags.settled);
  if (ctx.state.finished.includes('before:release')) {
    const hash = ctx.treeHash(ctx.tree);
    if (hash === data.releaseHash) return { status: 'skipped', why: 'finished earlier, the tree unchanged since' };
    if (!settled) {
      return { status: 'stopped', why: 'the tree changed since the release commands ran', next: 'run again what the change needs, then call again with --settled' };
    }
    data.releaseHash = hash;
    return { status: 'done', why: 'settled by the caller; the tree\'s new content is kept' };
  }
  if (ctx.campaign) {
    if (settled) return finishRelease(ctx, 'settled by the caller for the campaign unit');
    return { status: 'stopped', why: 'a campaign unit hands its release commands back', list, next: 'settle the release step as the campaign unit\'s rules say, then call again with --settled' };
  }
  let at = Number.isInteger(data.releaseAt) ? data.releaseAt : 0;
  if (settled && data.releaseFailed) at += 1;
  data.releaseFailed = false;
  const base = ctx.offDefault ? ctx.deflt.name : 'HEAD';
  const ran = [];
  for (; at < list.length; at++) {
    const command = list[at].split('{base}').join(base);
    const r = runCommand(ctx, command, { cwd: ctx.tree });
    if (r.status !== 0) {
      data.releaseAt = at;
      data.releaseFailed = true;
      return {
        status: 'stopped',
        why: `${command} exited ${r.status}`,
        output: `${r.stdout}${r.stderr}`,
        next: 'fix what it names and call again, or settle it by hand and call again with --settled',
      };
    }
    ran.push(command);
  }
  return finishRelease(ctx, `${ran.length} command${ran.length === 1 ? '' : 's'} ran`, ran);
}

function finishRelease(ctx, why, list = []) {
  const data = ctx.state.data;
  data.releaseAt = 0;
  data.releaseFailed = false;
  data.releaseHash = ctx.treeHash(ctx.tree);
  return { status: 'done', why, list };
}

// The last JSON line a run printed: its record.
function lastRecord(stdout) {
  const lines = String(stdout || '').trim().split(/\r?\n/).reverse();
  for (const line of lines) {
    if (!line.trim().startsWith('{')) continue;
    try { return JSON.parse(line); } catch { /* not a record */ }
  }
  return null;
}

// Done exactly when the summary gate's own full-suite check would let summary.md through.
function stageTests(ctx) {
  const gate = ctx.gate || require(path.join(SCRIPTS, 'pipeline-gate.js'));
  if (!gate.fullSuiteDeclared(ctx.tree)) return { status: 'done', why: 'undeclared — the repo declares no complete suite' };
  const data = { session_id: ctx.flags.session };
  const verify = path.join(SCRIPTS, 'verify-run.js');
  const tail = ['--slug', ctx.slug, '--session', ctx.flags.session, '--tree', ctx.tree];
  const env = { ...ctx.env, CLAUDE_PROJECT_DIR: ctx.root };
  const ranByName = new Set();
  // The flaky files stand for the complete record they failed in, so a call that runs nothing keeps them.
  const saved = ctx.state.data;
  let flaky = Array.isArray(saved.flaky) ? saved.flaky.slice() : [];
  let flakyRecord = saved.flakyRecord || null;
  const runs = [];
  let ranComplete = false;
  for (;;) {
    const seen = {};
    const denial = gate.fullSuiteDenial(ctx.tree, ctx.root, data, ctx.slug, seen);
    const recordId = seen.record && seen.record.run_id ? seen.record.run_id : null;
    if (!denial) {
      if (flakyRecord !== recordId) { flaky = []; flakyRecord = null; }
      saved.flaky = flaky;
      saved.flakyRecord = flakyRecord;
      saved.untouchedTimeouts = untouchedTimeouts(seen.record).map((t) => `${t.file || '?'} › ${t.test || '?'}`);
      return testsPassed(seen, runs, flaky);
    }
    const files = Array.isArray(denial.files) ? denial.files : [];
    const todo = !denial.foreign && BY_NAME_CAUSES.has(denial.cause) ? files.filter((f) => !ranByName.has(f)) : [];
    if (todo.length) {
      if (flakyRecord !== recordId) { flaky = []; flakyRecord = recordId; }
      for (const file of todo) {
        ranByName.add(file);
        const r = ctx.run(process.execPath, [verify, '--profile', 'fast', '--files', file, ...tail], { cwd: ctx.root, env });
        const rec = lastRecord(r.stdout);
        const passed = rec ? rec.verdict === 'pass' : r.status === 0;
        runs.push(`${file} by name: ${passed ? 'green' : 'red'}${rec && rec.run_id ? ` (${rec.run_id})` : ''}`);
        if (passed && denial.cause === 'unrepaired' && !flaky.includes(file)) flaky.push(file);
      }
      continue;
    }
    if ((denial.foreign || SUITE_CAUSES.has(denial.cause)) && !ranComplete) {
      ranComplete = true;
      const r = ctx.run(process.execPath, [verify, '--profile', 'complete', ...tail], { cwd: ctx.root, env });
      const rec = lastRecord(r.stdout);
      runs.push(`complete run: ${rec ? rec.verdict : `exit ${r.status}`}${rec && rec.run_id ? ` (${rec.run_id})` : ''}`);
      continue;
    }
    return {
      status: 'stopped',
      why: `the summary gate refuses: ${denial.cause} — ${gate.denialGloss(denial)}`,
      list: [...runs, ...files.map((f) => `${f} — not discharged`), ...recordNotes(seen.record)],
      next: `${RED_RUNS}, then call again`,
    };
  }
}

function recordNotes(record) {
  const notes = untouchedTimeouts(record).map((t) => `${t.file || '?'} › ${t.test || '?'} — timed out, untouched by the change`);
  if (record && record.slow && typeof record.slow === 'object') {
    notes.push(`slow: ${record.slow.ratio}x its usual time${record.others !== undefined ? `, ${record.others} other run(s) at once` : ''}`);
  }
  return notes;
}

function testsPassed(seen, runs, flaky) {
  const id = seen.record && seen.record.run_id ? seen.record.run_id : 'without a run id';
  const why = seen.by === 'evidence'
    ? `the close evidence stands for record ${id}`
    : `passing record ${id}${runs.length ? '' : ', no run needed'}`;
  return {
    status: 'done',
    why,
    list: [...runs, ...flaky.map((f) => `${f} — flaky: failed in the complete run, green alone`), ...recordNotes(seen.record)],
  };
}

function stageRecord(ctx) {
  if (!ctx.flags['record-cmd']) return { status: 'skipped', why: 'no --record-cmd' };
  const r = runCommand(ctx, ctx.flags['record-cmd'], { cwd: ctx.root, timeout: RECORD_LIMIT_MS });
  const output = `${r.stdout}${r.stderr}`;
  if (r.timedOut) return { status: 'failed', why: 'timed out after 10 min', output, keep: true };
  if (r.status !== 0) return { status: 'failed', why: `exit ${r.status}`, output, keep: true };
  return { status: 'done', output, keep: true };
}

// Once the closing commit is made, a refreshed record would be left outside it.
function stageAfterRecord(ctx) {
  if (ctx.state.finished.includes('after:commit')) return { status: 'skipped', why: 'the closing commit is made' };
  return stageRecord(ctx);
}

const cellsOf = (line) => line.split(/(?<!\\)\|/);

// The backlog text with the slug's one row's Status cell set, or why it is left. The column is counted from the
// row's end, so a pipe inside an earlier cell cannot shift it.
function withStatus(text, slug, status) {
  const lines = text.split('\n');
  const isRow = (l) => l.trimStart().startsWith('|');
  const rows = [];
  lines.forEach((l, i) => {
    if (!isRow(l)) return;
    const first = (cellsOf(l)[1] || '').trim();
    if (first === slug || first.startsWith(`${slug} `)) rows.push(i);
  });
  if (!rows.length) return { skip: `no row of ${slug}` };
  if (rows.length > 1) return { skip: `more than one row of ${slug}` };
  const at = rows[0];
  // The header is the nearest table line above the row that a separator line follows: a table may be broken by
  // blank lines or prose and go on under the same header.
  const isSeparator = (l) => isRow(l) && /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-*:?\s*$/.test(l);
  let head = at - 1;
  while (head >= 0 && !(isRow(lines[head]) && !isSeparator(lines[head]) && head + 1 < lines.length && isSeparator(lines[head + 1]))) head--;
  if (head < 0) return { skip: 'no Status column' };
  const header = cellsOf(lines[head]);
  const col = header.findIndex((c) => c.trim() === 'Status');
  if (col < 1) return { skip: 'no Status column' };
  const cells = cellsOf(lines[at]);
  // A closing pipe is optional on each line, so the count from the end starts at the last real cell of each.
  const lastCell = (list) => (list[list.length - 1].trim() === '' ? list.length - 1 : list.length);
  const cell = lastCell(cells) - (lastCell(header) - col);
  if (cell < 1) return { skip: 'no Status column' };
  cells[cell] = ` ${status} `;
  lines[at] = cells.join('|');
  return { text: lines.join('\n') };
}

// Compared right before the rename: another writer's change is never overwritten, read again once, then left.
function stageBacklog(ctx) {
  if (ctx.campaign) return { status: 'skipped', why: 'a campaign unit leaves the backlog to its campaign' };
  const status = ctx.flags['backlog-status'];
  if (!status) return { status: 'skipped', why: 'no --backlog-status' };
  const file = path.join(ctx.tree, 'docs', 'backlog.md');
  for (let attempt = 0; attempt < 2; attempt++) {
    const read = readText(file);
    if (read === null) return { status: 'skipped', why: 'no docs/backlog.md' };
    const next = withStatus(read, ctx.slug, status);
    if (next.skip) return { status: 'skipped', why: next.skip };
    const tmp = `${file}.${ctx.pid}.tmp`;
    fs.writeFileSync(tmp, next.text);
    if (ctx.onBacklogWrite) ctx.onBacklogWrite(file);
    if (readText(file) === read) {
      try {
        fs.renameSync(tmp, file);
      } catch (e) {
        try { fs.unlinkSync(tmp); } catch { /* gone already */ }
        return { status: 'skipped', why: `the file could not be replaced: ${e.code || e.message}` };
      }
      return { status: 'done', why: `${ctx.slug}: ${status}` };
    }
    try { fs.unlinkSync(tmp); } catch { /* gone already */ }
  }
  return { status: 'skipped', why: 'the file is being written' };
}

function stageClosingCommit(ctx) {
  const res = commitChanges(ctx);
  if (res.status === 'done') ctx.state.data.closingCommit = res.sha;
  return res;
}

// The working tree of this repository that has the default branch checked out.
function checkoutOf(ctx, name) {
  const r = ctx.git(['worktree', 'list', '--porcelain']);
  for (const block of String(r.stdout || '').split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/);
    const tree = lines.find((l) => l.startsWith('worktree '));
    if (tree && lines.includes(`branch refs/heads/${name}`)) return tree.slice('worktree '.length);
  }
  return '';
}

function unverified(ctx, u) {
  return {
    status: 'stopped',
    why: 'the merge is unverified',
    list: [u.diagnostic, `merge-close.js reported ${u.commit ? short(u.commit) : 'no commit'}; ${ctx.deflt.name} is at ${u.tip ? short(u.tip) : 'an unreadable tip'}`],
    next: `check ${ctx.deflt.name} in ${u.checkout}; once it is settled, call again with --settled`,
  };
}

// A result object proves nothing alone: the merge landed only where the default branch's tip is its commit.
function stageMerge(ctx) {
  if (ctx.campaign) return { status: 'skipped', why: 'a campaign unit never merges' };
  if (!ctx.offDefault) return { status: 'skipped', why: 'on the default branch' };
  if (!ctx.flags.merge) return { status: 'skipped', why: 'not asked' };
  const data = ctx.state.data;
  const name = ctx.deflt.name;
  if (data.mergeUnverified) {
    if (!ctx.flags.settled) return unverified(ctx, data.mergeUnverified);
    data.mergeCommit = data.mergeUnverified.commit || null;
    data.mergeUnverified = null;
    data.merged = true;
    return { status: 'done', why: 'settled by the caller' };
  }
  const checkout = checkoutOf(ctx, name);
  if (!checkout) {
    if (ctx.flags.settled) { data.merged = true; return { status: 'done', why: 'settled by the caller' }; }
    return { status: 'stopped', why: `no checkout holds ${name}; merge by hand`, next: 'merge by hand, then call again with --settled' };
  }
  const r = ctx.run(process.execPath, [path.join(SCRIPTS, 'merge-close.js'), '--branch', ctx.branch, '--message-file', ctx.messageFile, '--repo', checkout], { cwd: ctx.root });
  if (r.status === 2) return { status: 'stopped', why: firstLine(r.stderr || r.stdout), next: 'settle what it names, then call again' };
  const result = lastRecord(r.stdout);
  const tipRun = ctx.run('git', ['-C', checkout, 'rev-parse', '--verify', '--quiet', `${name}^{commit}`], { cwd: checkout });
  const tip = tipRun.status === 0 ? tipRun.stdout.trim() : '';
  const landed = Boolean(result && result.commit && tip === result.commit);
  if (landed && r.status === 0) {
    data.mergeCommit = result.commit;
    data.merged = true;
    return { status: 'done', why: `merged as ${short(result.commit)}` };
  }
  if (landed && r.status === 3) {
    data.mergeCommit = result.commit;
    data.merged = true;
    const behind = Array.isArray(result.behind) ? result.behind : [];
    return {
      status: 'stopped',
      finish: true,
      why: `merged as ${short(result.commit)}; some files of that checkout are behind`,
      list: [...behind.map((b) => `${b.path} — ${b.why || 'behind'}`), `backup: ${result.backup || 'none'}`],
      next: `bring those files of ${checkout} up to date by hand, then call again`,
    };
  }
  data.mergeUnverified = { commit: (result && result.commit) || '', tip, checkout, diagnostic: firstLine(r.stderr || r.stdout) };
  return unverified(ctx, data.mergeUnverified);
}

function stagePush(ctx) {
  if (ctx.campaign) return { status: 'skipped', why: 'a campaign unit never pushes' };
  if (!ctx.flags.push) return { status: 'skipped', why: 'not asked' };
  const data = ctx.state.data;
  const name = ctx.deflt.name;
  // The remote is what the resolver's ref holds before the branch's own name, which may itself hold a slash.
  const ref0 = typeof ctx.deflt.ref === 'string' ? ctx.deflt.ref : '';
  const remote = ref0 !== name && ref0.endsWith(`/${name}`) ? ref0.slice(0, -(name.length + 1)) : 'origin';
  const fetched = ctx.git(['fetch', '-q', remote, name]);
  if (fetched.status !== 0) return { status: 'stopped', why: `git fetch failed: ${firstLine(fetched.stderr)}`, next: 'fix what git names, then call again' };
  const ahead = parseInt(ctx.git(['rev-list', '--count', `${name}..${remote}/${name}`]).stdout, 10);
  if (ahead > 0) {
    return { status: 'stopped', why: `catch-up owed — ${remote}/${name} has ${ahead} commit${ahead === 1 ? '' : 's'} ${name} lacks`, next: `catch up by ${CLOSE_GATE}, then call again` };
  }
  const ref = data.merged || !ctx.offDefault ? name : ctx.branch;
  const pushed = ctx.git(['push', '-q', remote, ref]);
  if (pushed.status !== 0) return { status: 'stopped', why: `git push refused: ${firstLine(pushed.stderr || pushed.stdout)}`, next: 'settle what git names, then call again' };
  data.pushedRef = ref;
  return { status: 'done', why: `pushed ${ref} to ${remote}` };
}

const STAGE_FNS = {
  before: { commits: stageCommits, commit: stageScopedCommit, 'merge-in': stageMergeIn, release: stageRelease, tests: stageTests, record: stageRecord },
  after: { record: stageAfterRecord, backlog: stageBacklog, commit: stageClosingCommit, merge: stageMerge, push: stagePush },
};

// What a finished `after` call made, on its last line.
function madeLine(ctx) {
  const d = ctx.state.data;
  const parts = [];
  if (d.closingCommit) parts.push(`closing commit ${short(d.closingCommit)}`);
  if (d.mergeCommit) parts.push(`merge ${short(d.mergeCommit)}`);
  if (d.pushedRef) parts.push(`pushed ${d.pushedRef}`);
  return parts.length ? ` — ${parts.join(', ')}` : '';
}

// ── the result ───────────────────────────────────────────────────────────────────────────────────────

function keepWhole(ctx, stage, text) {
  const file = path.join(ctx.files.dir, `${ctx.slug}.${ctx.sub}-${stage}.log`);
  try { fs.mkdirSync(ctx.files.dir, { recursive: true }); fs.writeFileSync(file, text); } catch { return ''; }
  return file;
}

function render(ctx, stage, res) {
  const head = `${stage}: ${res.status}${res.why ? ` — ${res.why}` : ''}`;
  const details = [];
  const list = res.list || [];
  if (list.length > CUT) {
    details.push(...list.slice(0, CUT), `… and ${list.length - CUT} more, all in ${keepWhole(ctx, stage, `${list.join('\n')}\n`)}`);
  } else details.push(...list);
  if (res.output) {
    const lines = String(res.output).trimEnd().split(/\r?\n/);
    if (lines.length > CUT) details.push(`… ${lines.length - CUT} lines before, all in ${keepWhole(ctx, stage, res.output)}`, ...lines.slice(-CUT));
    else details.push(...lines);
  }
  details.push(...(res.notes || []));
  return { head, details: details.map((d) => `  ${d}`), keep: Boolean(res.keep) };
}

function emit(ctx, blocks, last, out) {
  const whole = [...blocks.flatMap((b) => [b.head, ...b.details]), last];
  // One line is held back for the cut note; a block marked `keep` (the record's, which can carry an owed notice) is
  // given its lines before any other.
  let budget = MAX_LINES - 2 - blocks.length;
  const shown = blocks.map(() => 0);
  const order = blocks.map((b, i) => i).sort((a, b) => Number(blocks[b].keep) - Number(blocks[a].keep));
  for (const i of order) {
    shown[i] = Math.min(blocks[i].details.length, Math.max(0, budget));
    budget -= shown[i];
  }
  const lines = [];
  let dropped = 0;
  blocks.forEach((b, i) => {
    lines.push(b.head, ...b.details.slice(0, shown[i]));
    dropped += b.details.length - shown[i];
  });
  if (dropped) {
    const file = path.join(ctx.files.dir, `${ctx.slug}.result.txt`);
    try { fs.mkdirSync(ctx.files.dir, { recursive: true }); fs.writeFileSync(file, `${whole.join('\n')}\n`); } catch { /* the cut line still says how much */ }
    lines.push(`  … ${dropped} more lines, all in ${file}`);
  }
  lines.push(last);
  out(`${lines.join('\n')}\n`);
}

function runStages(ctx, out) {
  const blocks = [];
  let code = 0;
  let last = 'close-run: done';
  for (const stage of STAGES[ctx.sub]) {
    const key = `${ctx.sub}:${stage}`;
    let res;
    if (!(ONCE.has(stage) && ctx.state.finished.includes(key))) res = STAGE_FNS[ctx.sub][stage](ctx);
    else if (key === 'before:merge-in') res = mergeInFinished(ctx);
    else res = { status: 'skipped', why: 'finished earlier' };
    blocks.push(render(ctx, stage, res));
    if ((res.status === 'done' || res.finish) && !ctx.state.finished.includes(key)) ctx.state.finished.push(key);
    if (res.status === 'stopped') ctx.state.stops.push({ call: ctx.sub, stage, why: res.why, at: new Date().toISOString() });
    saveState(ctx);
    if (res.status === 'stopped') {
      code = 3;
      last = `close-run: stopped at ${stage} — ${res.why}; next: ${res.next || 'settle it, then call again'}`;
      break;
    }
    if (stage === ctx.flags.until) { last = `close-run: ended after ${stage}`; break; }
  }
  if (code === 0 && last === 'close-run: done' && ctx.sub === 'after') last += madeLine(ctx);
  emit(ctx, blocks, last, out);
  return code;
}

function main(argv, deps = {}) {
  const out = deps.out || ((t) => process.stdout.write(t));
  const held = {};
  try {
    return runStages(prepare(argv, deps, held), out);
  } catch (e) {
    if (e instanceof Refusal) { out(`close-run: refused — ${e.message}\n`); return 2; }
    throw e;
  } finally {
    if (held.lock) releaseLock(held.lock, held.pid);
  }
}

module.exports = { main, STAGES, defaultRun };
