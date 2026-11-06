#!/usr/bin/env node
/**
 * Nexus merge-close: the squash-merge at close, keeping another session's uncommitted edits to shared records.
 *
 *   node merge-close.js --branch <branch> --message-file <path> [--repo <checkout>]
 *
 * WHAT IT IS FOR. Several sessions share the main checkout and keep uncommitted edits to shared records there,
 * `docs/backlog.md` above all. Git refuses a squash over a file that holds a local change, and restoring that
 * file by hand would discard work that is not the coordinator's. This script commits the squash of `<branch>`
 * onto the checkout's current branch itself, with the message in `--message-file`, then brings the working copy
 * up to date: each shared record that holds an uncommitted edit gets the branch's change merged into that edit,
 * left unstaged. It never pushes. Exit 0 prints one JSON object:
 *
 *   {ok, branch, commit, files: [{path, kept}], kept, behind: [], backup}
 *
 * `files` are the shared records merged; `kept` counts the places in each where the other session's change was
 * carried in; `backup` is null unless the backup folder could not be removed.
 *
 * SHARED RECORDS. `docs/backlog.md`, plus every path a pattern in `.claude/nexus-agents.json` `sharedRecords`
 * matches (from the repo root, `*` within a path segment, `**` across segments, case-sensitive: these are paths
 * a user names). A missing file or key, or a value that is not a list of non-blank strings, reads as the
 * backlog alone.
 *
 * WHICH CHECKOUT. `--repo`, else CLAUDE_PROJECT_DIR, else the current directory. The session's published
 * `.worktree-target` is never read: it names the feature's own tree, and this script writes to the main one.
 *
 * REFUSALS. Exit 2 with one stderr line naming the files and the fix, nothing changed: an unknown branch, a
 * missing message file or a checkout git cannot read; the current branch is `<branch>`, or is not the default
 * branch (lib/default-branch.js); a merge, cherry-pick, revert, rebase or bisect in progress; HEAD is not an
 * ancestor of `<branch>` (the default branch moved since the merge-in); nothing to merge; an index that differs
 * from HEAD; a symlink or submodule the squash changes; a feature that changes a `.gitattributes` file; a local
 * type or mode change (a link, a folder, or an executable bit where core.filemode is on) on a path the squash
 * changes or deletes; a folder above a path the squash changes, deletes or adds, below the checkout root, that is
 * a link or junction rather than a real folder; a file the squash changes or deletes that holds an uncommitted change and is not a shared
 * record, or is a shared record the squash deletes (renames are read as a delete and an add); an existing file at
 * a path the squash adds; a shared record both sides changed on the same line; an `index.lock` already held; a
 * branch that moved before the publish. Every check is read-only and runs with GIT_OPTIONAL_LOCKS=0, so a refusal leaves even the
 * index file's stat data as it was.
 *
 * THE LINE RULE. HEAD's version is the base, the working copy one side and the branch's version the other, line
 * endings read as LF. Changes that do not overlap are both taken. Where they overlap: an identical change is
 * taken once; two adds at one place are both kept, the branch's first; a stretch of equal length in all three
 * versions takes each line from the side that changed it; anything else refuses. The result keeps the working
 * copy's own line endings. Every result is computed before anything is written.
 *
 * THE LOCK. From its last checks until the real index is in place the script holds git's own `index.lock`,
 * created exclusively, so another session's `git add`, `git commit` or `git reset` in those seconds fails loudly
 * instead of committing over a half-updated checkout. It is released on every exit path.
 *
 * COMMIT FIRST. With HEAD an ancestor of `<branch>`, the squash result is `<branch>`'s tree: the commit is
 * `git commit-tree {tree} -p {captured HEAD}`, published by `git update-ref {branch ref} {new} {captured HEAD}`,
 * which fails if anything moved the branch meanwhile. No commit hook runs on it (the branch's own commits ran
 * them on this tree), and the real index never feeds it, so nothing another session staged can ride it.
 *
 * THEN THE WORKING COPY. Each path the squash changes is written by the script itself, one file at a time, its
 * bytes as git would check them out (`cat-file --filters`), and only while the file still holds what the script
 * expects: an unchanged file (git's own test, `hash-object --path`, so line-ending settings are honoured, and
 * still a regular file of HEAD's mode, read with lstat), a shared record's exact bytes the merge was computed
 * from, an added path still absent; and every folder above the path, below the checkout root, still a real folder,
 * checked again just before each creation, replacement or removal. Any other bytes are left as they are and named. Then, in a copy of the index,
 * the entries of those paths alone are set to the commit's, each only while it still holds HEAD's old blob and
 * no entry sits at a folder above it or under it (one another session staged is kept and named); the finished
 * copy may differ from the real index only in the entries set, and is put in place through the held lock, as
 * git itself does. Every original byte the script overwrites or removes
 * is first copied to `{git common dir}/nexus-merge-aside/{time}/original/`, never `git stash`, which every
 * session in the repo shares; the folder is printed before the commit and removed once every path is up to date.
 *
 * AFTER THE COMMIT nothing is rolled back: the commit holds exactly the tested branch tree. A path not brought up
 * to date gives exit 3, "merged, working copy partly behind", naming each such path and the backup folder, with
 * the JSON object on stdout; so does an index another process holds open (EPERM or EBUSY on Windows), the lock
 * released and the index left as it was. A branch git cannot read after the publish is exit 3, the working copy
 * untouched. A failed removal of the backup folder still exits 0, naming it.
 *
 * KNOWN LIMIT. A write by another session between a file's last check and its rename is not seen. A git command
 * that takes no index lock (an `update-ref`, a fetch into the branch) can still move the branch after the
 * publish; seen before the index swap, it is exit 3 with the index left as it was.
 *
 * NEXUS_MERGE_CLOSE_TEST_HOOK names a module the tests load; it is called at each stage and may write or throw.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { resolveDefaultBranch } = require('./lib/default-branch');
const { globToRegExp } = require('./lib/prose-tests');

const BACKLOG = 'docs/backlog.md';
const GIT_TIMEOUT_MS = 120000;
const MAX_BUFFER = 512 * 1024 * 1024;
const UNWRITABLE_MODES = new Set(['120000', '160000']);
const OPERATIONS = ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'sequencer', 'BISECT_LOG'];
const HELD_OPEN = new Set(['EPERM', 'EBUSY', 'EACCES']);

// No read-only call may rewrite the index's stat data, and the run works on the checkout's own index.
const GIT_ENV = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
delete GIT_ENV.GIT_INDEX_FILE;

class Refusal extends Error {}

// Every call names paths literally: a name holding `[`, `*` or `?` must match only itself.
function git(root, args, { buffer = false, input, env } = {}) {
  const r = spawnSync('git', ['--literal-pathspecs', ...args], {
    cwd: root, encoding: buffer ? 'buffer' : 'utf8', windowsHide: true, timeout: GIT_TIMEOUT_MS, maxBuffer: MAX_BUFFER,
    input, env: env || GIT_ENV,
  });
  return { status: r.status, stdout: r.stdout, stderr: String(r.stderr || '').trim(), error: r.error };
}

const failText = (r, args) => r.stderr || (r.error && r.error.message) || `git ${args[0]} failed`;
const why = (err) => (err && HELD_OPEN.has(err.code)
  ? `held open by another process (${err.code}): ${err.message}`
  : String((err && err.message) || err));

function mustGit(root, args, what, opts) {
  const r = git(root, args, opts);
  if (r.status !== 0) throw new Error(`${what}: ${failText(r, args)}`);
  return r.stdout;
}

const revParse = (root, spec) => {
  const r = git(root, ['rev-parse', '--verify', '--quiet', spec]);
  return r.status === 0 ? r.stdout.trim() : null;
};

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const next = argv[i + 1];
    flags[a.slice(2)] = next !== undefined && !next.startsWith('--') ? argv[++i] : true;
  }
  return flags;
}

const zList = (out) => String(out || '').split('\0').filter(Boolean);
const readOrNull = (file) => { try { return fs.readFileSync(file); } catch { return null; } };
const same = (a, b) => (a === null || b === null ? a === b : a.equals(b));
const exists = (file) => { try { fs.lstatSync(file); return true; } catch { return false; } };

function sharedMatcher(root) {
  let list = [];
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'nexus-agents.json'), 'utf8'));
    const value = cfg && cfg.sharedRecords;
    if (Array.isArray(value) && value.every((p) => typeof p === 'string' && p.trim() !== '')) list = value;
  } catch { /* no config: the backlog alone */ }
  const res = list.map(globToRegExp);
  return (rel) => rel === BACKLOG || res.some((re) => re.test(rel));
}

// ── the line rule ────────────────────────────────────────────────────────────────────────────────────

// The changed stretches from `a` to `b` (Myers): [{s, e, lines}] — base lines [s, e) become `lines`.
function diffHunks(a, b) {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const off = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace = [];
  let found = -1;
  for (let d = 0; d <= max && found < 0; d++) {
    trace.push(v.slice(off - d - 1, off + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = (k === -d || (k !== d && v[off + k - 1] < v[off + k + 1])) ? v[off + k + 1] : v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v[off + k] = x;
      if (x >= n && y >= m) { found = d; break; }
    }
  }
  const at = (d, k) => trace[d][k + d + 1];
  const matches = [];
  let x = n;
  let y = m;
  for (let d = found; d > 0; d--) {
    const k = x - y;
    const prevK = (k === -d || (k !== d && at(d, k - 1) < at(d, k + 1))) ? k + 1 : k - 1;
    const prevX = at(d, prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) { matches.push([x - 1, y - 1]); x--; y--; }
    x = prevX;
    y = prevY;
  }
  while (x > 0 && y > 0) { matches.push([x - 1, y - 1]); x--; y--; }
  matches.reverse();
  const hunks = [];
  let i = 0;
  let j = 0;
  for (const [mi, mj] of [...matches, [n, m]]) {
    if (mi > i || mj > j) hunks.push({ s: i, e: mi, lines: b.slice(j, mj) });
    i = mi + 1;
    j = mj + 1;
  }
  return hunks;
}

function overlaps(h, g) {
  const hEmpty = h.s === h.e;
  const gEmpty = g.s === g.e;
  if (hEmpty && gEmpty) return h.s === g.s;
  if (hEmpty) return g.s < h.s && h.s < g.e;
  if (gEmpty) return h.s < g.s && g.s < h.e;
  return h.s < g.e && g.s < h.e;
}

// One side's lines over base [s, e), its hunks applied.
function sideText(base, hunks, s, e) {
  const out = [];
  let cur = s;
  for (const h of hunks) {
    out.push(...base.slice(cur, h.s), ...h.lines);
    cur = h.e;
  }
  out.push(...base.slice(cur, e));
  return out;
}

const sameLines = (a, b) => a.length === b.length && a.every((l, i) => l === b[i]);

// The merge of `local` (the working copy) with `branch`, base `base`: {lines, kept} or {conflicts: [range]}.
function mergeLines(base, local, branch) {
  const mine = diffHunks(base, local).map((h) => ({ ...h, side: 'local' }));
  const theirs = diffHunks(base, branch).map((h) => ({ ...h, side: 'branch' }));
  const all = [...mine, ...theirs].sort((p, q) => p.s - q.s || (p.e - p.s) - (q.e - q.s));
  const groups = [];
  for (const h of all) {
    const g = groups[groups.length - 1];
    if (g && overlaps(h, g)) {
      g.hunks.push(h);
      g.s = Math.min(g.s, h.s);
      g.e = Math.max(g.e, h.e);
    } else {
      groups.push({ s: h.s, e: h.e, hunks: [h] });
    }
  }
  const out = [];
  const conflicts = [];
  let cur = 0;
  for (const g of groups) {
    out.push(...base.slice(cur, g.s));
    cur = g.e;
    const l = g.hunks.filter((h) => h.side === 'local');
    const b = g.hunks.filter((h) => h.side === 'branch');
    if (!l.length || !b.length) {
      out.push(...sideText(base, g.hunks, g.s, g.e));
      continue;
    }
    const lt = sideText(base, l, g.s, g.e);
    const bt = sideText(base, b, g.s, g.e);
    if (sameLines(lt, bt)) { out.push(...lt); continue; }
    if (g.s === g.e) { out.push(...bt, ...lt); continue; }
    const len = g.e - g.s;
    if (lt.length === len && bt.length === len) {
      const bad = [];
      for (let i = 0; i < len; i++) {
        const o = base[g.s + i];
        if (lt[i] === o || lt[i] === bt[i]) out.push(bt[i]);
        else if (bt[i] === o) out.push(lt[i]);
        else bad.push(g.s + i + 1);
      }
      if (bad.length) conflicts.push(...bad.map((n) => `line ${n}`));
      continue;
    }
    conflicts.push(g.e - g.s === 1 ? `line ${g.s + 1}` : `lines ${g.s + 1}-${g.e}`);
  }
  out.push(...base.slice(cur));
  return conflicts.length ? { conflicts } : { lines: out, kept: mine.length };
}

function mergedText(baseBuf, localBuf, branchBuf) {
  const split = (buf) => buf.toString('utf8').replace(/\r\n/g, '\n').split('\n');
  const result = mergeLines(split(baseBuf), split(localBuf), split(branchBuf));
  if (result.conflicts) return result;
  const eol = localBuf.toString('utf8').includes('\r\n') ? '\r\n' : '\n';
  return { buf: Buffer.from(result.lines.join(eol), 'utf8'), kept: result.kept };
}

// ── the checks ───────────────────────────────────────────────────────────────────────────────────────

// `:{oldMode} {newMode} {oldOid} {newOid} {status}` then the path, NUL-separated.
function listSquash(root, from, to) {
  const parts = zList(mustGit(root, ['diff-tree', '-r', '--no-renames', '--raw', '-z', '--no-abbrev', from, to, '--'], 'list the squash'));
  const changes = [];
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const [oldMode, newMode, oldOid, newOid, status] = parts[i].replace(/^:/, '').split(' ');
    changes.push({ path: parts[i + 1], status: status[0], oldMode, newMode, oldOid, newOid });
  }
  return changes;
}

function preflight(flags) {
  const usage = 'usage: merge-close.js --branch <branch> --message-file <path> [--repo <checkout>]';
  const branch = typeof flags.branch === 'string' ? flags.branch : '';
  if (!branch || branch.startsWith('-')) throw new Refusal(usage);
  if (typeof flags['message-file'] !== 'string') throw new Refusal(usage);
  const messageFile = path.resolve(flags['message-file']);
  if (!fs.existsSync(messageFile)) throw new Refusal(`no message file at ${messageFile} — write the closure message there first`);
  const start = typeof flags.repo === 'string' ? flags.repo : (process.env.CLAUDE_PROJECT_DIR || process.cwd());
  const top = git(start, ['rev-parse', '--show-toplevel']);
  if (top.status !== 0) throw new Refusal(`git cannot read the checkout ${start} — name the main checkout with --repo`);
  const root = top.stdout.trim();
  const tip = revParse(root, `${branch}^{commit}`);
  if (!tip) throw new Refusal(`unknown branch ${branch} — name the feature branch with --branch`);
  const ref = git(root, ['symbolic-ref', '--quiet', 'HEAD']).stdout.trim();
  const current = ref.replace(/^refs\/heads\//, '');
  if (current === branch) {
    throw new Refusal(`the checkout is on ${branch} itself — run from the main checkout, on the default branch`);
  }
  const def = resolveDefaultBranch(root).name;
  if (current !== def) {
    throw new Refusal(`the checkout is on ${current || 'a detached HEAD'}, not the default branch (${def}) — run from the main checkout`);
  }
  const where = mustGit(root, ['rev-parse', '--git-path', 'index', ...OPERATIONS.flatMap((n) => ['--git-path', n])], 'find the git directory');
  const [indexFile, ...operationPaths] = where.split('\n').filter(Boolean).map((p) => path.resolve(root, p));
  const busy = OPERATIONS.filter((_, i) => exists(operationPaths[i]));
  if (busy.length) {
    throw new Refusal(`a git operation is in progress in the checkout (${busy.join(', ')}) — whoever started it finishes or aborts it first`);
  }
  const head = revParse(root, 'HEAD');
  const anc = git(root, ['merge-base', '--is-ancestor', head, tip]);
  if (anc.status === 1 && git(root, ['merge-base', '--is-ancestor', tip, head]).status === 0) {
    throw new Refusal(`nothing to merge — ${def} already holds ${branch}`);
  }
  if (anc.status === 1) {
    throw new Refusal(`${def} moved since ${branch}'s last merge-in — take the catch-up (team-lead.md § Close Gate, item 5), then merge again`);
  }
  if (anc.status !== 0) throw new Refusal(`git cannot compare HEAD with ${branch}: ${anc.stderr}`);
  const changes = listSquash(root, head, tip);
  if (!changes.length) throw new Refusal(`nothing to merge — ${branch} adds nothing ${def} lacks`);
  if (git(root, ['diff-index', '--cached', '--quiet', head, '--']).status !== 0) {
    const names = zList(git(root, ['diff-index', '--cached', '--name-only', '-z', head, '--']).stdout);
    throw new Refusal(`the index holds staged files (${names.join(', ')}) — another session's staged work; it commits or unstages them first`);
  }
  const special = changes.filter((c) => UNWRITABLE_MODES.has(c.oldMode) || UNWRITABLE_MODES.has(c.newMode)).map((c) => c.path);
  if (special.length) throw new Refusal(`the squash changes symlinks or submodules (${special.join(', ')}) — merge this branch by hand`);
  const attributes = changes.filter((c) => c.path.split('/').pop() === '.gitattributes').map((c) => c.path);
  if (attributes.length) {
    throw new Refusal(`the feature changes ${attributes.join(', ')}, so the checks would hash clean files differently — merge this branch by hand`);
  }
  const fm = git(root, ['config', '--bool', '--get', 'core.filemode']);
  const filemode = fm.status !== 0 || fm.stdout.trim() !== 'false';
  return { branch, def, ref, root, head, tip, tree: revParse(root, `${tip}^{tree}`), messageFile, changes, indexFile, filemode };
}

// git's own test of an entry's kind: still a regular file (no link followed), its executable bit matching HEAD's
// mode where core.filemode is on.
function sameKind(file, mode, filemode) {
  let st;
  try { st = fs.lstatSync(file); } catch { return false; }
  if (!st.isFile()) return false;
  return !filemode || ((st.mode & 0o100) !== 0) === (mode === '100755');
}

// lstat checks only a path's last part, so a link or junction in place of a folder above it would send every
// check and write to the link's target. Returns the first folder below the checkout root that is not a real
// folder, or null; a missing folder ends the walk.
function linkedParent(root, rel) {
  const parts = rel.split('/').slice(0, -1);
  for (let i = 1; i <= parts.length; i++) {
    const dir = parts.slice(0, i).join('/');
    let st;
    try { st = fs.lstatSync(path.join(root, dir)); } catch { return null; }
    if (st.isSymbolicLink() || !st.isDirectory()) return dir;
  }
  return null;
}

const linkLeft = (root, rel) => {
  const dir = linkedParent(root, rel);
  return dir ? `the folder ${dir} above it is a link or junction, not a real folder` : null;
};

// The feature's paths whose working file differs from HEAD's blob by git's own test, filters and line endings
// applied (a missing file counts as changed), and those whose type or mode differs from HEAD's entry.
function dirtyPaths(root, changes, filemode) {
  const dirty = new Set();
  const kind = [];
  const batch = [];
  for (const c of changes) {
    if (c.status === 'A') continue;
    const file = path.join(root, c.path);
    if (!exists(file)) dirty.add(c.path);
    else if (!sameKind(file, c.oldMode, filemode)) kind.push(c.path);
    else if (/^"|[\r\n]/.test(c.path)) { if (hashAs(root, c.path, fs.readFileSync(file)) !== c.oldOid) dirty.add(c.path); }
    else batch.push(c);
  }
  if (batch.length) {
    const input = batch.map((c) => `${c.path}\n`).join('');
    const oids = mustGit(root, ['hash-object', '--stdin-paths'], 'hash the feature\'s paths', { input }).split('\n').filter(Boolean);
    if (oids.length !== batch.length) throw new Error(`hash the feature's paths: ${oids.length} hashes for ${batch.length} files`);
    batch.forEach((c, i) => { if (oids[i] !== c.oldOid) dirty.add(c.path); });
  }
  return { dirty, kind };
}

// The merge of every shared record that holds an uncommitted edit, by path; refuses before anything is written.
function plan({ branch, root, changes, filemode }) {
  const isShared = sharedMatcher(root);
  const linked = changes.map((c) => [c.path, linkedParent(root, c.path)]).filter(([, dir]) => dir);
  if (linked.length) {
    const list = linked.map(([rel, dir]) => `${dir} above ${rel}`).join(', ');
    throw new Refusal(`a folder above files the squash changes is a link or junction, not a real folder (${list}) — whoever made it puts the real folder back first`);
  }
  const { dirty, kind } = dirtyPaths(root, changes, filemode);
  if (kind.length) {
    throw new Refusal(`a local type or mode change on files the squash changes (${kind.join(', ')}) — whoever made it commits or reverts it first`);
  }
  const blocked = [];
  const deletedShared = [];
  const occupied = [];
  const records = [];
  for (const c of changes) {
    if (c.status === 'A') {
      if (exists(path.join(root, c.path))) occupied.push(c.path);
      continue;
    }
    if (!dirty.has(c.path)) continue;
    if (!isShared(c.path)) blocked.push(c.path);
    else if (c.status !== 'M') deletedShared.push(c.path);
    else records.push(c);
  }
  if (blocked.length) {
    throw new Refusal(`uncommitted changes to files the squash changes (${blocked.join(', ')}) — not shared records; whoever owns them commits or sets them aside first`);
  }
  if (deletedShared.length) {
    throw new Refusal(`the squash deletes or renames shared records that hold uncommitted changes (${deletedShared.join(', ')}) — their owner commits or sets them aside first`);
  }
  if (occupied.length) {
    throw new Refusal(`files already exist at paths the squash adds (${occupied.join(', ')}) — their owner moves them first`);
  }
  const merged = new Map();
  const conflicts = [];
  for (const { path: rel, oldOid, newOid } of records) {
    const local = readOrNull(path.join(root, rel));
    const baseBuf = mustGit(root, ['cat-file', 'blob', oldOid], `read HEAD:${rel}`, { buffer: true });
    const branchBuf = mustGit(root, ['cat-file', 'blob', newOid], `read ${branch}:${rel}`, { buffer: true });
    const notText = [local, baseBuf, branchBuf].some((b) => !b || Buffer.from(b.toString('utf8'), 'utf8').compare(b) !== 0);
    if (!local || notText) { conflicts.push(`${rel} (${local ? 'not UTF-8 text' : 'deleted in the working copy'})`); continue; }
    const r = mergedText(baseBuf, local, branchBuf);
    if (r.conflicts) conflicts.push(`${rel} (${r.conflicts.join(', ')} of HEAD's version)`);
    else merged.set(rel, { local, result: r.buf, kept: r.kept });
  }
  if (conflicts.length) {
    throw new Refusal(`both sides changed the same line of a shared record: ${conflicts.join('; ')} — nothing merged; the other session commits or reverts that line first`);
  }
  return merged;
}

function loadHook() {
  const file = process.env.NEXUS_MERGE_CLOSE_TEST_HOOK;
  if (!file) return () => {};
  const hook = require(path.resolve(file));
  return typeof hook === 'function' ? hook : () => {};
}

// ── the commit ───────────────────────────────────────────────────────────────────────────────────────

// git's own index lock: every `git add`, `git commit` and `git reset` of another session fails while it is held.
function takeLock(ctx) {
  const lock = `${ctx.indexFile}.lock`;
  try {
    ctx.lockFd = fs.openSync(lock, 'wx');
  } catch (err) {
    if (err.code === 'EEXIST') {
      throw new Refusal(`${lock} exists — another git command is running in the checkout, or one crashed and left it; nothing merged; run the merge again once it is gone`);
    }
    throw err;
  }
  ctx.lock = lock;
}

// Returns null, or why the lock could not be removed.
function releaseLock(ctx) {
  if (!ctx.lock) return null;
  const lock = ctx.lock;
  ctx.lock = null;
  if (ctx.lockFd !== null && ctx.lockFd !== undefined) {
    try { fs.closeSync(ctx.lockFd); } catch { /* already closed */ }
    ctx.lockFd = null;
  }
  try {
    fs.unlinkSync(lock);
    return null;
  } catch (err) {
    return err.code === 'ENOENT' ? null : `${lock} could not be removed (${why(err)}) — remove it by hand before the next git command`;
  }
}

// Returns the new commit's id once the branch points at it, or {overrun} when the branch cannot be verified.
function publish(ctx, stage) {
  const { root, head, tree } = ctx;
  const made = git(root, ['commit-tree', tree, '-p', head, '-F', ctx.messageFile]);
  if (made.status !== 0) throw new Refusal(`git could not make the commit (${failText(made, ['commit-tree'])}) — nothing merged`);
  const newCommit = made.stdout.trim();
  const parents = mustGit(root, ['rev-parse', `${newCommit}^@`], 'check the commit').split('\n').filter(Boolean);
  if (revParse(root, `${newCommit}^{tree}`) !== tree || parents.length !== 1 || parents[0] !== head) {
    throw new Refusal(`the commit git made is not the squash of ${ctx.branch} on ${ctx.def} — nothing merged`);
  }
  stage('before-publish');
  const up = git(root, ['update-ref', '-m', `merge-close: squash ${ctx.branch}`, ctx.ref, newCommit, head]);
  const now = revParse(root, ctx.ref);
  if (now === newCommit) return newCommit;
  if (up.status !== 0 && now) {
    throw new Refusal(`${ctx.def} moved while merging (it is now ${now}) — nothing merged; run the merge again`);
  }
  const cause = up.status === 0 ? 'another session moved it' : failText(up, ['update-ref']);
  return { overrun: `${ctx.def} reads ${now || 'nothing git can verify'} after the merge commit ${newCommit} was published (${cause}) — the working copy is not touched; check by hand` };
}

// ── the working copy ─────────────────────────────────────────────────────────────────────────────────

function hashAs(root, rel, buf) {
  return mustGit(root, ['hash-object', `--path=${rel}`, '--stdin'], `hash ${rel}`, { input: buf }).trim();
}

function copyInto(folder, rel, buf) {
  const dest = path.join(folder, 'original', rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

function removeEmptyParents(root, rel) {
  for (let dir = path.dirname(rel); dir && dir !== '.'; dir = path.dirname(dir)) {
    try {
      if (!fs.lstatSync(path.join(root, dir)).isDirectory()) break;
      fs.rmdirSync(path.join(root, dir));
    } catch { break; }
  }
}

// Writes one path, or returns why it was left: the file must hold what the script expects up to the write.
function bringUp(ctx, c, record, stage) {
  const { root, folder } = ctx;
  const file = path.join(root, c.path);
  const next = c.status === 'D' ? null
    : record ? record.result
      : mustGit(root, ['cat-file', '--filters', `--path=${c.path}`, c.newOid], `read ${c.path}`, { buffer: true });
  const mode = c.newMode === '100755' ? 0o755 : 0o666;
  stage('before-write', { path: c.path });
  if (c.status === 'A') {
    const linkedBefore = linkLeft(root, c.path);
    if (linkedBefore) return linkedBefore;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const linkedAfter = linkLeft(root, c.path);
    if (linkedAfter) return linkedAfter;
    try { fs.writeFileSync(file, next, { flag: 'wx', mode }); } catch (err) {
      if (err.code === 'EEXIST') return 'another session created it';
      throw err;
    }
    return null;
  }
  const linked = linkLeft(root, c.path);
  if (linked) return linked;
  const now = readOrNull(file);
  const kindKept = () => sameKind(file, c.oldMode, ctx.filemode);
  const moved = () => linkLeft(root, c.path) || (kindKept() && same(readOrNull(file), now) ? null : 'another session wrote it');
  if (now !== null && !kindKept()) return 'another session changed its type or mode';
  const expected = record ? same(now, record.local) : now !== null && hashAs(root, c.path, now) === c.oldOid;
  if (!expected) return 'another session wrote it';
  copyInto(folder, c.path, now);
  if (c.status === 'D') {
    const gone = moved();
    if (gone) return gone;
    fs.rmSync(file);
    removeEmptyParents(root, c.path);
    return null;
  }
  const tmp = `${file}.nexus-merge-${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, next, { mode });
    const changed = moved();
    if (changed) {
      fs.rmSync(tmp, { force: true });
      return changed;
    }
    fs.renameSync(tmp, file);
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
  return null;
}

// {path: 'mode oid stage' per entry, joined} for every entry of the index `env` names.
function indexEntries(root, env) {
  const entries = new Map();
  for (const rec of zList(mustGit(root, ['ls-files', '-s', '-z'], 'read the index', { env }))) {
    const tab = rec.indexOf('\t');
    const rel = rec.slice(tab + 1);
    entries.set(rel, entries.has(rel) ? `${entries.get(rel)},${rec.slice(0, tab)}` : rec.slice(0, tab));
  }
  return entries;
}

// The entries at a folder above `rel` or under it, which setting `rel` would make git drop.
function besideEntries(entries, folders, rel) {
  const found = [];
  for (let dir = path.posix.dirname(rel); dir !== '.'; dir = path.posix.dirname(dir)) if (entries.has(dir)) found.push(dir);
  if (folders.has(rel)) found.push(...[...entries.keys()].filter((k) => k.startsWith(`${rel}/`)));
  return found;
}

// git's own protocol: the new index is written into the held `index.lock`, which is then renamed over `index`.
function swapIndex(ctx, copy) {
  const buf = fs.readFileSync(copy);
  for (let off = 0; off < buf.length;) off += fs.writeSync(ctx.lockFd, buf, off);
  fs.closeSync(ctx.lockFd);
  ctx.lockFd = null;
  fs.renameSync(ctx.lock, ctx.indexFile);
  ctx.lock = null;
}

// Sets the feature paths' entries to the commit's in a copy of the index, each only while it still holds HEAD's
// old blob and no entry another session staged sits above or under it, checks that the finished copy differs
// from the real index in those entries alone, then puts the copy in place. Returns the entries kept.
function setIndex(ctx, newCommit, stage) {
  const { root } = ctx;
  const copy = path.join(ctx.folder, 'index');
  const env = { ...GIT_ENV, GIT_INDEX_FILE: copy };
  fs.copyFileSync(ctx.indexFile, copy);
  const entries = indexEntries(root, env);
  const folders = new Set();
  for (const rel of entries.keys()) {
    for (let dir = path.posix.dirname(rel); dir !== '.'; dir = path.posix.dirname(dir)) folders.add(dir);
  }
  const holds = new Map(ctx.changes.map((c) => [c.path, c.status === 'A'
    ? !entries.has(c.path)
    : entries.get(c.path) === `${c.oldMode} ${c.oldOid} 0`]));
  const byPath = new Map(ctx.changes.map((c) => [c.path, c]));
  const removed = (rel) => byPath.has(rel) && byPath.get(rel).status === 'D' && holds.get(rel);
  const kept = [];
  const want = new Map();
  let info = '';
  for (const c of ctx.changes) {
    const beside = besideEntries(entries, folders, c.path).filter((rel) => !removed(rel));
    if (!holds.get(c.path)) {
      kept.push({ path: c.path, why: 'another session staged it; its index entry is kept' });
    } else if (beside.length) {
      kept.push({ path: c.path, why: `another session staged ${beside.join(', ')} beside it; that entry is kept and this one not set` });
    } else if (c.status === 'D') {
      info += `0 ${'0'.repeat(c.oldOid.length)}\t${c.path}\0`;
      want.set(c.path, undefined);
    } else {
      info += `${c.newMode} ${c.newOid}\t${c.path}\0`;
      want.set(c.path, `${c.newMode} ${c.newOid} 0`);
    }
  }
  if (info) mustGit(root, ['update-index', '-z', '--index-info'], 'set the index entries', { env, input: info });
  stage('before-swap', { copy });
  const finished = indexEntries(root, env);
  const real = indexEntries(root, GIT_ENV);
  const differ = [...new Set([...finished.keys(), ...real.keys(), ...want.keys()])]
    .filter((rel) => finished.get(rel) !== (want.has(rel) ? want.get(rel) : real.get(rel)));
  if (differ.length) throw new Error(`the finished index differs from the real one beyond the entries set (${differ.join(', ')}); it is left as it was`);
  const now = revParse(root, ctx.ref);
  if (now !== newCommit) throw new Error(`${ctx.def} moved after the merge was published (it is now ${now || 'unreadable'})`);
  swapIndex(ctx, copy);
  return kept;
}

function update(ctx, records, newCommit, stage) {
  const behind = [];
  for (const c of ctx.changes) {
    try {
      const left = bringUp(ctx, c, records.get(c.path), stage);
      if (left) behind.push({ path: c.path, why: left });
    } catch (err) {
      behind.push({ path: c.path, why: why(err) });
    }
  }
  try {
    stage('before-index');
    behind.push(...setIndex(ctx, newCommit, stage));
  } catch (err) {
    behind.push({ path: '(index)', why: `the index is not updated: ${why(err)}` });
  }
  return behind;
}

// ── the run ──────────────────────────────────────────────────────────────────────────────────────────

function removeFolder(folder) {
  fs.rmSync(folder, { recursive: true, force: true });
  try { fs.rmdirSync(path.dirname(folder)); } catch { /* other runs' folders remain */ }
}

function runMerge(ctx) {
  let records;
  let newCommit;
  const stage = (name, info = {}) => ctx.hook(name, { root: ctx.root, folder: ctx.folder, ...info });
  try {
    ctx.hook = loadHook();
    Object.assign(ctx, preflight(parseArgs(process.argv.slice(2))));
    records = plan(ctx);
    const common = path.resolve(ctx.root, mustGit(ctx.root, ['rev-parse', '--git-common-dir'], 'find the git directory').trim());
    ctx.folder = path.join(common, 'nexus-merge-aside', `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`);
    fs.mkdirSync(ctx.folder, { recursive: true });
    process.stderr.write(`merge-close: backup folder ${ctx.folder}\n`);
    try {
      stage('before-lock');
      takeLock(ctx);
      newCommit = publish(ctx, stage);
    } catch (err) {
      try { removeFolder(ctx.folder); } catch { /* the folder is still empty */ }
      throw err;
    }
  } catch (err) {
    process.stderr.write(`merge-close: refused — ${err instanceof Refusal ? err.message : `unexpected failure, nothing merged: ${err && err.message}`}\n`);
    return 2;
  }
  if (typeof newCommit !== 'string') {
    process.stderr.write(`merge-close: merged, working copy not brought up to date — ${newCommit.overrun}; backup folder ${ctx.folder}\n`);
    return 3;
  }

  let behind;
  try {
    behind = update(ctx, records, newCommit, stage);
  } catch (err) {
    behind = [{ path: '(working copy)', why: `unexpected failure: ${err && err.message}` }];
  }
  let backup = null;
  if (behind.length) {
    backup = ctx.folder;
  } else {
    try {
      stage('before-cleanup');
      removeFolder(ctx.folder);
    } catch (err) {
      backup = ctx.folder;
      process.stderr.write(`merge-close: merged; the backup folder ${ctx.folder} could not be removed (${err.message}) — remove it by hand\n`);
    }
  }
  const files = [...records].map(([rel, r]) => ({ path: rel, kept: r.kept }));
  const out = { ok: !behind.length, branch: ctx.branch, commit: newCommit, files, kept: files.reduce((n, f) => n + f.kept, 0), behind, backup };
  process.stdout.write(`${JSON.stringify(out)}\n`);
  if (!behind.length) return 0;
  const list = behind.map((b) => `${b.path} (${b.why})`).join(', ');
  process.stderr.write(`merge-close: merged as ${newCommit}, working copy partly behind — not brought up to date: ${list}; original bytes of what was overwritten are in ${ctx.folder}\n`);
  return 3;
}

function main() {
  const ctx = {};
  process.on('exit', () => releaseLock(ctx));
  let code = 2;
  try {
    code = runMerge(ctx);
  } finally {
    const stuck = releaseLock(ctx);
    if (stuck) {
      process.stderr.write(`merge-close: ${stuck}\n`);
      if (code === 0) code = 3;
    }
  }
  return code;
}

process.exit(main());
