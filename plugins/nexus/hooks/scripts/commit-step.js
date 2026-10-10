#!/usr/bin/env node
/**
 * Nexus commit-step: the ONE sanctioned subagent git write (F81 Step 8, ADR-96).
 *
 *   node commit-step.js --slug <slug> --step <n> --msg-file <path> [--tree <path>] -- <path>...
 *
 * WHY THIS EXISTS. Under the `per-step` commit strategy the developer commits each finished step on
 * the slug branch. That reverses a standing prohibition (ADR-18/20: pipeline agents never commit),
 * and it is worth reversing for exactly one reason: after a watchdog kill — measured at ~13% of runs
 * in a consuming repo — a commit boundary is the only thing that separates a finished step from the
 * half-done one. `implementation.md` CLAIMS a step is done; a commit PROVES it.
 *
 * WHY A HELPER RATHER THAN A LICENCE TO RUN GIT. Every guard below is something a prose rule can
 * only ask for. Handing a subagent `git commit` grants it `git push`, `git reset` and `--amend` in
 * the same breath; handing it this script grants it one commit, on a branch this script checked,
 * over paths it was explicitly given. The prohibition stays absolute for raw git (the boundary
 * detector still flags every `git <verb>` a subagent runs through Bash) — this is a narrow, named,
 * inspectable hole in it, not a general relaxation.
 *
 * NOT DETECTOR-AWARE BY DESIGN. boundary-detector.js flags a subagent Bash command matching
 * `\bgit\s+(commit|add|…)`. This script's invocation contains no such token, so it is silent by
 * construction — no carve-out, no branch-awareness, nothing for a forged command to imitate. That
 * is the whole reason the helper runs git INSIDE node instead of shelling out a git line.
 *
 * ONE TREE, NEVER A REDIRECT. Root is `--tree` → CLAUDE_PROJECT_DIR → cwd, then the enclosing
 * repository (`git rev-parse --show-toplevel`). The session-keyed `.worktree-target` redirect that
 * verify-gate.js and the read-only declaration readers honour is deliberately NOT consulted here.
 * Those readers MEASURE a tree; this one WRITES to it, and reading the config from tree A while
 * committing into tree B is the F51 defect (measure one tree, record about another) with a write on
 * the end. A CLI also has no hook payload to match a session against.
 *
 * REFUSALS ARE TOTAL AND READABLE. Every guard fails before anything is staged, exits 2, and prints
 * one JSON line naming the reason. Exit 2 is "you invoked me wrong or the preconditions do not
 * hold"; there is no exit 1, because this script has no "your suite is red" outcome. A refusal that
 * had already staged files would leave the developer's index in a state it did not ask for and
 * cannot see — so the one refusal that happens AFTER staging (git itself rejecting the commit, e.g.
 * a repo pre-commit hook) undoes its own staging first, and undoes only what it added.
 *
 * WHAT IT WILL NEVER DO: `git add -A` or any unscoped stage; `--amend`; `push`; `reset`; `rebase`;
 * `stash`; a branch change; a commit on the default branch. Those are the coordinating session's or
 * nobody's.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { staleRegistries, advisoryMessage } = require('./lib/registry-stamp');

// One-line JSON on stdout, both ways. The caller is a model reading a tool result, so the refusal
// has to say which of the guards fired — a bare exit code would leave it guessing among six.
function refuse(reason, extra = {}) {
  process.stdout.write(JSON.stringify({ ok: false, reason, ...extra }) + '\n');
  return 2;
}

// `--` ends the flags and begins the paths. Written out rather than reusing verify-run.js's
// parseArgs: that one has no notion of a positional tail, and a path that happens to start with `-`
// (or a flag value that does) must not be able to shift the boundary.
function parseArgs(argv) {
  const flags = {};
  const paths = [];
  let i = 0;
  for (; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') { i++; break; }
    if (!a.startsWith('-')) continue;          // a stray positional before `--` is not a path
    // `-F` is accepted as an alias for `--msg-file` because that is git's own spelling for the same
    // thing, and the invocation delivered into a developer's context is copied by hand.
    const key = a === '-F' ? 'msg-file' : a.replace(/^--?/, '');
    const next = argv[i + 1];
    flags[key] = next !== undefined && next !== '--' ? argv[++i] : true;
  }
  for (; i < argv.length; i++) paths.push(argv[i]);
  return { flags, paths };
}

function git(cwd, args) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

// The message the caller wrote, plus the provenance trailer. Appended in node rather than passed
// through `git interpret-trailers` so the caller's bytes are never re-flowed: the message file is
// routinely a here-string carrying `$`, backticks and quotes, and a round trip through another tool
// is one more chance to mangle them. Idempotent — re-stamping an already-stamped message is a
// no-op, so a retried invocation cannot grow two trailers.
function withTrailer(message, slug, step) {
  const trailer = `Nexus-Step: ${slug}/${step}`;
  const body = message.replace(/\s+$/, '');
  if (new RegExp(`(^|\\n)${trailer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).test(body)) return `${body}\n`;
  return `${body}\n\n${trailer}\n`;
}

function main() {
  const { flags, paths } = parseArgs(process.argv.slice(2));

  const start = typeof flags.tree === 'string'
    ? flags.tree
    : (process.env.CLAUDE_PROJECT_DIR || process.cwd());

  const top = git(start, ['rev-parse', '--show-toplevel']);
  if (top.status !== 0) return refuse('not inside a git repository', { tree: start });
  const root = top.stdout.trim();

  // The declared strategy. A missing file, unreadable file, malformed JSON or absent key all mean
  // "not declared", which is a refusal rather than an error: the default strategy is 2 commits, and
  // under it no subagent commit is sanctioned at all.
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'nexus-agents.json'), 'utf8')); }
  catch { cfg = {}; }
  if (cfg.commitStrategy !== 'per-step') {
    return refuse(
      'this repo has not declared the per-step commit strategy — set commitStrategy: "per-step" in ' +
      '.claude/nexus-agents.json, or leave commits to the coordinating session',
      { declared: cfg.commitStrategy || null });
  }

  const slug = typeof flags.slug === 'string' ? flags.slug : '';
  const step = typeof flags.step === 'string' ? flags.step : '';
  const msgFile = typeof flags['msg-file'] === 'string' ? flags['msg-file'] : '';
  if (!slug || !step || !msgFile) {
    return refuse('usage: --slug <slug> --step <n> --msg-file <path> -- <path>...');
  }
  // The step number goes into a commit trailer that a later attribution check parses line by line,
  // so it has to BE a number: a value carrying a newline would inject extra trailer lines, and a
  // non-numeric one would be reported as null in the result while still reaching the message.
  if (!/^\d+$/.test(step)) {
    return refuse(`--step must be a whole number, got ${JSON.stringify(step)}`);
  }

  let message;
  try { message = fs.readFileSync(msgFile, 'utf8'); }
  catch { return refuse(`the message file cannot be read: ${msgFile}`); }

  const branch = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();

  // Same three rungs, same order, as the Branch Pre-Flight rule the team lead runs at launch
  // (agents-workflow.md § Branch Pre-Flight): the repo's real default, then the config override,
  // then the literal fallback. Duplicated here rather than pointed at because this script runs with
  // no agent context at all — but the ORDER is the rule's, and it must stay the rule's.
  const symref = git(root, ['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD']);
  const defaultBranch = (symref.status === 0 && symref.stdout.trim())
    ? symref.stdout.trim().replace(/^refs\/remotes\/origin\//, '')
    : (typeof cfg.defaultBranch === 'string' && cfg.defaultBranch ? cfg.defaultBranch : 'main');

  if (branch === defaultBranch) {
    return refuse(
      `refusing to commit on the default branch (${defaultBranch}) — a step commit belongs on the ` +
      'slug branch, and integration is what reaches the default branch',
      { branch, defaultBranch });
  }

  // Containment is ONE-WAY: the branch must name the slug, never the reverse. The pre-flight
  // matrix's heuristic accepts either direction because it only has to CLASSIFY a branch well enough
  // to ask a question; this has to decide whether to write. Under the two-way rule a branch called
  // `on` would "match" the slug F12-SessionRecovery, and the cost of that mistake here is a
  // commit on someone else's branch. Case-folded, and `/` segments come along for free because this
  // is a plain substring test on the whole name.
  if (!branch.toLowerCase().includes(slug.toLowerCase())) {
    return refuse(
      `the current branch (${branch}) does not name the slug (${slug}) — a step commit goes on the ` +
      "feature's own branch",
      { branch, slug });
  }

  // No paths means no commit. There is deliberately no "commit whatever is dirty" mode: the caller
  // naming its own files is what makes the commit attributable to a step, and an empty list would
  // otherwise reach `git add --` and stage nothing while still producing a commit object.
  if (paths.length === 0) {
    return refuse('at least one path is required after `--` — this helper never stages by itself');
  }

  // Existence is checked HERE, before anything is staged, so the refusal is this helper's and names
  // the offending path. Leaving it to `git add` would work by accident (git's add is atomic) but the
  // message would be git's, and the guard would sit after the point where staging begins.
  const missing = paths.filter((p) => !fs.existsSync(path.resolve(root, p)));
  if (missing.length) {
    return refuse(`these paths do not exist: ${missing.join(', ')}`, { missing });
  }

  // The registry co-commit check, run over the paths about to be staged. registry-stamp-check.js
  // keys on a Bash `git … commit`, which this commit never passes through, so without this call the
  // check would go dark for exactly the commits `per-step` creates. It WARNS and commits: the
  // matcher is a v1 basename heuristic its own author graded tolerant of wrong misses, so a false
  // match must not be able to wedge the commit boundary this strategy exists to provide. Never
  // stricter than the hook it shares its implementation with.
  let warnings = [];
  try {
    const stale = staleRegistries(root, paths.map((p) => path.relative(root, path.resolve(root, p))));
    if (stale.length) warnings = [advisoryMessage(stale)];
  } catch { /* the advisory is best-effort; it never decides whether the commit happens */ }
  for (const w of warnings) process.stderr.write(w + '\n');

  // What the caller had already staged before we touched anything. Needed to undo OUR staging
  // precisely if the commit fails below — unstaging a path the caller had staged itself would
  // destroy work this script was never given.
  const preStaged = new Set(
    (git(root, ['diff', '--cached', '--name-only']).stdout || '')
      .split('\n').map((l) => l.trim()).filter(Boolean));

  // Stage ONLY what was listed. `--` separates paths from revisions so a file named like a branch
  // cannot be reinterpreted, and there is no code path here that can widen this set.
  const add = git(root, ['add', '--', ...paths]);
  if (add.status !== 0) return refuse(`git add failed: ${(add.stderr || '').trim()}`);

  // Undo our own staging, and only ours. Called when the commit fails: a refusal that left files
  // staged would (a) leave a tree the caller cannot clean up, since it may not run git, and (b) feed
  // the NEXT step commit foreign content.
  const unstageOurs = () => {
    const ours = paths.filter((p) => !preStaged.has(path.relative(root, path.resolve(root, p)).replace(/\\/g, '/')));
    if (ours.length) git(root, ['restore', '--staged', '--', ...ours]);
  };

  // A temp file rather than stdin: `-F` is the shape a human uses for a multi-line message, and the
  // bytes reach git without passing through a shell that could expand them.
  //
  // `--cleanup=verbatim` because fidelity is this script's contract, and the DEFAULT is not verbatim:
  // it strips trailing whitespace, and a repo that sets `commit.cleanup=strip` would silently drop
  // every body line starting with `#` — a markdown heading or an issue reference. Fidelity must not
  // depend on the consuming repo's git config.
  //
  // The trailing pathspec is what makes the commit SCOPED rather than merely the staging: without
  // it, `git commit` commits the whole index, so anything the caller (or a previous failed attempt)
  // had staged would ride along silently. With it, this commit contains the listed paths and
  // nothing else, whatever else the index holds.
  const tmp = path.join(os.tmpdir(), `nexus-commit-step-${process.pid}-${Date.now()}.txt`);
  fs.writeFileSync(tmp, withTrailer(message, slug, step), 'utf8');
  const commit = git(root, ['commit', '--cleanup=verbatim', '-F', tmp, '--', ...paths]);
  try { fs.unlinkSync(tmp); } catch { /* best-effort */ }
  if (commit.status !== 0) {
    unstageOurs();
    return refuse(`git commit failed: ${((commit.stderr || '') || (commit.stdout || '')).trim()}`);
  }

  process.stdout.write(JSON.stringify({
    ok: true,
    sha: git(root, ['rev-parse', 'HEAD']).stdout.trim(),
    branch,
    step: Number(step),
    files: paths,
    warnings,
  }) + '\n');
  return 0;
}

process.exit(main());
