#!/usr/bin/env node
/**
 * Nexus SDD read — where a feature's spec and rule list are read from.
 *
 *   node sdd-read.js --feature {feature folder} [--json]
 *
 * A feature that goes to the tracker keeps its SDD part (its tracker spec, drafts and publish record) in
 * `{feature}/sdd/`, and may keep a development spec of its own in `{feature}/definition/`:
 *   - no `sdd/` folder: the feature's own `definition/` is read as always (`source: definition`);
 *   - `sdd/definition/spec.md`: that spec and `sdd/definition/spec-rules.md` where present (`source: sdd`);
 *     an `sdd/` holding drafts only gives `spec: null`;
 *   - `sdd/upstream.md`: the one-line pin
 *     `**Upstream:** {remote URL} @ {commit} ({YYYY-MM-DD}) — docs/specs/{feature}/` names the
 *     specification repository's feature at a pushed commit. The repository is found among the folders
 *     the session may write (`permissions.additionalDirectories` of `.claude/settings.local.json` and
 *     `.claude/settings.json` at the feature's repository, at `CLAUDE_PROJECT_DIR` and at the main
 *     checkout of a worktree, and of the user's `settings.json`), as the clone whose remote matches the
 *     pin's once both are normalised to host and path, so an ssh and an https clone match. The commit is
 *     fetched when the clone lacks it; the spec and its rule list at that commit are written to files
 *     in the OS temp folder and their paths printed (`source: pinned`). The pin never moves here.
 * The development spec (`definition/spec.md`, and its `spec-rules.md`) is named beside the SDD part
 * whenever it exists. Paths are absolute.
 *
 * No working-tree file is written in any repository: a fetch adds objects under `.git` only.
 * Exit codes: 0 resolved · 1 a pin that cannot be resolved, named in `error` · 2 usage.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const USAGE = 'usage: sdd-read.js --feature {feature folder} [--json]';
const PIN_RE = /^\*\*Upstream:\*\*\s+(\S+)\s+@\s+([0-9a-f]{7,40})\s+\((\d{4}-\d{2}-\d{2})\)\s+[—–-]+\s+(\S+?)\/?\s*$/m;
const FETCH_TIMEOUT_MS = 30000;

function git(cwd, args, timeout = 10000) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, timeout, maxBuffer: 64 * 1024 * 1024 });
  return { ok: res.status === 0, stdout: res.stdout || '', stderr: res.stderr || '' };
}

const fileOrNull = (p) => (fs.existsSync(p) && fs.statSync(p).isFile() ? p : null);

function parsePin(text) {
  const m = PIN_RE.exec(text);
  if (!m) return null;
  return { url: m[1], commit: m[2], date: m[3], path: m[4].replace(/\\/g, '/').replace(/\/+$/, '') };
}

// Host and path, lower case, with no scheme, user, port or `.git`: `git@host:a/b.git`,
// `ssh://git@host:22/a/b` and `https://user@host/a/b` all read `host/a/b`. A local path keeps its path.
function normalizeRemote(url) {
  let u = String(url).trim().replace(/\\/g, '/');
  if (/^[a-z]:\//i.test(u) || u.startsWith('/') || u.startsWith('./') || u.startsWith('../')) {
    return path.resolve(u).replace(/\\/g, '/').toLowerCase().replace(/\.git$/, '').replace(/\/+$/, '');
  }
  const scheme = /^[a-z][a-z0-9+.-]*:\/\//i.exec(u);
  if (scheme) {
    u = u.slice(scheme[0].length);
    if (/^file:/i.test(scheme[0])) return normalizeRemote(u.replace(/^\/(?=[a-z]:)/i, ''));
    u = u.replace(/^[^@/]*@/, '').replace(/^([^/:]+):\d+(?=\/)/, '$1');
  } else {
    const scp = /^(?:[^@/]+@)?([^/:]+):(.*)$/.exec(u);
    if (scp) u = `${scp[1]}/${scp[2]}`;
  }
  return u.toLowerCase().replace(/\/+$/, '').replace(/\.git$/, '').replace(/\/+$/, '');
}

function topLevel(dir) {
  const res = git(dir, ['rev-parse', '--show-toplevel']);
  return res.ok ? path.resolve(res.stdout.trim()) : null;
}

function mainCheckout(dir) {
  const res = git(dir, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
  return res.ok ? path.dirname(path.resolve(res.stdout.trim())) : null;
}

// The folders the session may write, read as guard.js reads them, from every root the session can have.
function addedFolders(roots) {
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const files = [];
  for (const root of roots) {
    files.push([root, path.join(root, '.claude', 'settings.local.json')], [root, path.join(root, '.claude', 'settings.json')]);
  }
  files.push([roots[0] || process.cwd(), path.join(configDir, 'settings.json')]);
  const dirs = [];
  for (const [root, file] of files) {
    let listed;
    try { listed = JSON.parse(fs.readFileSync(file, 'utf8')).permissions.additionalDirectories; } catch { continue; }
    if (!Array.isArray(listed)) continue;
    for (const entry of listed) {
      if (typeof entry !== 'string' || !entry.trim()) continue;
      const named = entry.trim();
      const home = /^~(?=$|[\\/])/.test(named) ? path.join(os.homedir(), named.slice(1)) : named;
      dirs.push(path.resolve(root, home));
    }
  }
  return [...new Set(dirs)];
}

function findClone(pin, roots) {
  const wanted = normalizeRemote(pin.url);
  for (const dir of addedFolders(roots)) {
    if (!fs.existsSync(dir)) continue;
    const repo = topLevel(dir);
    if (!repo) continue;
    const remotes = git(repo, ['remote']).stdout.split(/\r?\n/).filter(Boolean);
    for (const remote of remotes) {
      const url = git(repo, ['remote', 'get-url', remote]).stdout.trim();
      if (url && normalizeRemote(url) === wanted) return { repo, remote };
    }
  }
  return null;
}

const hasCommit = (repo, commit) => git(repo, ['cat-file', '-e', `${commit}^{commit}`]).ok;

function showAt(repo, commit, rel) {
  const res = git(repo, ['show', `${commit}:${rel}`]);
  return res.ok ? res.stdout : null;
}

function writeTemp(commit, featurePath, name, text) {
  const dir = path.join(os.tmpdir(), 'nexus-sdd-read', `${commit.slice(0, 12)}-${path.posix.basename(featurePath)}`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  fs.writeFileSync(file, text);
  return file;
}

function readPinned(pin, roots) {
  const found = findClone(pin, roots);
  if (!found) {
    return { error: `no folder this session may write is a clone of ${pin.url} — add the specification repository's folder to the session (permissions.additionalDirectories), then read again` };
  }
  if (!hasCommit(found.repo, pin.commit)) {
    git(found.repo, ['fetch', '--quiet', found.remote], FETCH_TIMEOUT_MS);
    if (!hasCommit(found.repo, pin.commit)) return { error: `the pinned commit ${pin.commit} is not in ${found.repo}, even after a fetch of ${found.remote}` };
  }
  const specRel = `${pin.path}/definition/spec.md`;
  const spec = showAt(found.repo, pin.commit, specRel);
  if (spec === null) return { error: `${specRel} does not exist at the pinned commit ${pin.commit} in ${found.repo}` };
  const rules = showAt(found.repo, pin.commit, `${pin.path}/definition/spec-rules.md`);
  return {
    source: 'pinned',
    pin,
    repository: found.repo,
    spec: writeTemp(pin.commit, pin.path, 'spec.md', spec),
    specRules: rules === null ? null : writeTemp(pin.commit, pin.path, 'spec-rules.md', rules),
  };
}

function resolveFeature(feature) {
  const dir = path.resolve(feature);
  const dev = {
    devSpec: fileOrNull(path.join(dir, 'definition', 'spec.md')),
    devSpecRules: fileOrNull(path.join(dir, 'definition', 'spec-rules.md')),
  };
  const sdd = path.join(dir, 'sdd');
  if (!fs.existsSync(sdd)) {
    const definition = ['spec.md', 'bug.md', 'epic.md'].map((n) => fileOrNull(path.join(dir, 'definition', n))).find(Boolean) || null;
    return { source: 'definition', spec: definition, specRules: dev.devSpecRules, devSpec: null, devSpecRules: null };
  }
  const localSpec = fileOrNull(path.join(sdd, 'definition', 'spec.md'));
  const pinFile = fileOrNull(path.join(sdd, 'upstream.md'));
  if (localSpec || !pinFile) {
    return { source: 'sdd', spec: localSpec, specRules: fileOrNull(path.join(sdd, 'definition', 'spec-rules.md')), ...dev };
  }
  const pin = parsePin(fs.readFileSync(pinFile, 'utf8'));
  if (!pin) return { error: `${pinFile} holds no pin line of the form **Upstream:** {remote URL} @ {commit} ({YYYY-MM-DD}) — docs/specs/{feature}/` };
  const here = topLevel(dir);
  const roots = [here, process.env.CLAUDE_PROJECT_DIR || null, here ? mainCheckout(here) : null].filter(Boolean).map((r) => path.resolve(r));
  const pinned = readPinned(pin, [...new Set(roots)]);
  return pinned.error ? pinned : { ...pinned, ...dev };
}

function main(argv) {
  let feature = null;
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') json = true;
    else if (argv[i] === '--feature' && argv[i + 1] && !argv[i + 1].startsWith('--')) feature = argv[++i];
    else feature = undefined;
  }
  if (!feature) {
    process.stderr.write(`${USAGE}\n`);
    return 2;
  }
  const out = resolveFeature(feature);
  if (json) process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  else if (out.error) process.stdout.write(`refused: ${out.error}\n`);
  else {
    process.stdout.write(`source: ${out.source}\nspec: ${out.spec ?? 'null'}\n`);
    if (out.specRules) process.stdout.write(`specRules: ${out.specRules}\n`);
    if (out.pin) process.stdout.write(`pin: ${out.pin.url} @ ${out.pin.commit} (${out.pin.date}) — ${out.pin.path}/\n`);
    if (out.devSpec) process.stdout.write(`devSpec: ${out.devSpec}\n`);
    if (out.devSpecRules) process.stdout.write(`devSpecRules: ${out.devSpecRules}\n`);
  }
  return out.error ? 1 : 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { parsePin, normalizeRemote, resolveFeature };
