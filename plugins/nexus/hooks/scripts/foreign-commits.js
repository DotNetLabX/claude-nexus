#!/usr/bin/env node
/**
 * Nexus foreign-commits: the commits other sessions landed on the default branch since a plan's base,
 * and which of them touch this feature's files.
 *
 *   node foreign-commits.js --base <sha> [--repo <tree>] [--ref <branch>] [--files <path>...]
 *
 * WHAT IT IS FOR. The coordinator runs it at each phase boundary (team-lead.md, Other sessions'
 * commits at each phase boundary): several sessions share one checkout, and a peer's commit to a
 * file this feature changes must be seen before the next dispatch, not at the merge. It prints one
 * JSON object and exits 0:
 *
 *   {base, ref, tip, total, overlapping, commits: [{sha, subject, files}]}
 *
 * `commits` are the non-merge commits on `ref` since `base` that the tree's HEAD does not hold, so a
 * commit already merged in drops out. Each commit's `files` are only those it shares with the
 * feature; `overlapping` counts the commits with any. The feature's files are the tree's own changes
 * against the merge-base of HEAD and `ref` — committed, staged, unstaged and untracked-not-ignored —
 * so the files a merge of `ref` brought in are not the feature's; plus every `--files` path (the
 * plan's named files, which the build may not have touched yet), a relative one read from the tree's
 * top and matched as a whole file path. A change made only inside a merge commit (a conflict
 * resolution) is not listed: the commits that merge brought in are.
 *
 * IT ONLY READS. No git command here changes a ref, the index or the working tree.
 *
 * DEFAULTS. `--repo` is the tree the session's published `.worktree-target` line names, else the
 * session root (as verify-run.js resolves it). `--ref` is the tree's default branch, as lib/default-branch.js
 * resolves it (agents-workflow.md § Branch Pre-Flight & Default-Branch Resolution).
 *
 * REFUSALS. A missing `--base`, an unknown or empty option, a tree git cannot read, an unknown
 * `--base` or `--ref`, no merge-base between HEAD and `ref`, or a git read that fails exits 2 with
 * one stderr line naming the fix — never an empty list that would read as no foreign commits.
 */
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const { resolveDeclaredTree } = require('./lib/worktree-target');
const { resolveDefaultBranch } = require('./lib/default-branch');

function git(dir, args) {
  const r = spawnSync('git', ['-C', dir, '-c', 'core.quotepath=off', ...args], {
    encoding: 'utf8', windowsHide: true, timeout: 30000, maxBuffer: 64 * 1024 * 1024,
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function refuse(line) {
  process.stderr.write(`foreign-commits: ${line}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const args = { files: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--files') {
      while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) args.files.push(argv[++i]);
    } else if (a === '--base' || a === '--repo' || a === '--ref') {
      const value = argv[++i];
      if (typeof value !== 'string' || !value || value.startsWith('-')) refuse(`${a} needs a value`);
      args[a.slice(2)] = value;
    } else {
      refuse(`unknown option ${a} — the options are --base, --repo, --ref and --files`);
    }
  }
  return args;
}

const lines = (text) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

function repoRelative(top, p) {
  const abs = path.isAbsolute(p) ? p : path.join(top, p);
  return path.relative(top, abs).split(path.sep).join('/');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (typeof args.base !== 'string' || !args.base) refuse('--base is required: pass the plan\'s **Base:** commit');

  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const session = String(process.env.CLAUDE_CODE_SESSION_ID || process.env.CLAUDE_SESSION_ID || '');
  const repo = typeof args.repo === 'string' && args.repo ? args.repo : resolveDeclaredTree(root, session);

  const topRun = git(repo, ['rev-parse', '--show-toplevel']);
  if (topRun.status !== 0 || !topRun.stdout.trim()) {
    refuse(`git cannot read ${repo} as a repository — pass --repo with the feature's tree`);
  }
  const top = path.resolve(topRun.stdout.trim());

  const baseRun = git(top, ['rev-parse', '--verify', '--quiet', `${args.base}^{commit}`]);
  if (baseRun.status !== 0) refuse(`unknown commit ${args.base} for --base — pass the plan's **Base:** sha`);
  const base = baseRun.stdout.trim();

  const ref = typeof args.ref === 'string' && args.ref ? args.ref : resolveDefaultBranch(top).name;
  const tipRun = git(top, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
  if (tipRun.status !== 0) refuse(`unknown branch ${ref} — pass --ref with the default branch`);
  const tip = tipRun.stdout.trim();

  const feature = new Set(args.files.map((f) => repoRelative(top, f)));
  const mb = git(top, ['merge-base', 'HEAD', tip]);
  if (mb.status !== 0 || !mb.stdout.trim()) refuse(`HEAD and ${ref} share no merge-base in ${top} — pass --ref with the branch this tree was made from`);
  const read = (gitArgs, what) => {
    const r = git(top, gitArgs);
    if (r.status !== 0) refuse(`git could not list ${what} in ${top}: ${r.stderr.trim().split(/\r?\n/)[0] || 'no output'} — re-run once git can read the tree`);
    return r.stdout;
  };
  for (const f of lines(read(['diff', '--name-only', '--no-renames', mb.stdout.trim()], 'the feature\'s changes'))) feature.add(f);
  for (const f of lines(read(['ls-files', '--others', '--exclude-standard'], 'the untracked files'))) feature.add(f);

  const logged = read(['log', '--no-merges', '--no-renames', '--name-only', '--format=%x00%H%x09%s', tip, `^${base}`, '^HEAD'], `the commits on ${ref}`);
  const commits = logged.split('\0').filter((c) => c.trim()).map((chunk) => {
    const [head, ...rest] = chunk.split(/\r?\n/);
    const tab = head.indexOf('\t');
    const files = [...new Set(lines(rest.join('\n')))].filter((f) => feature.has(f));
    return { sha: head.slice(0, tab), subject: head.slice(tab + 1), files };
  });

  process.stdout.write(`${JSON.stringify({
    base, ref, tip, total: commits.length,
    overlapping: commits.filter((c) => c.files.length).length, commits,
  })}\n`);
}

main();
