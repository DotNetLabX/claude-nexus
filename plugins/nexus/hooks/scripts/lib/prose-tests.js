'use strict';
/**
 * The tests a repo declares for a step run's changed files: `stepTests` in `.claude/verify.json`, read by
 * verify-run.js for a developer's step run on the node runner.
 *
 *   "stepTests": { "{glob}": ["{test file}" | "{folder}/", …] }
 *
 * A changed file a glob matches adds that glob's entries. A test file entry is added as named, where it exists and
 * is a node test file. A folder entry adds only the node test files directly in that folder whose text names the
 * changed file — by its base name, or, for a name every folder shares (`SKILL.md`, `README.md`, `CHANGELOG.md`,
 * `index.md`, `plan.md`), by its parent folder's name three or more levels down (`plugins/p/skills/s/SKILL.md`
 * keys on `s`), by its whole path one or two levels down (`plugins/p/README.md` — a package's or plugin's name is
 * in most of its tests) and by its own name at the tree's top. A file under `docs/`, or one of
 * the pipeline's own files under `.claude/` (lib/tree-hash.js `isExcluded`), adds nothing, and so does a repo that
 * declares no `stepTests`, a glob whose value is not a list, or an entry that is not a string. In a glob, `**`
 * spans folders, `*` and `?` stay within one.
 */
const fs = require('fs');
const path = require('path');
const { isExcluded } = require('./tree-hash');

const NODE_TEST_FILE = /\.test\.(mjs|js|cjs)$/;
const GENERIC_NAMES = new Set(['skill.md', 'readme.md', 'changelog.md', 'index.md', 'plan.md']);

function globToRegExp(glob) {
  let src = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') { src += '(?:.*/)?'; i += 2; } else { src += '.*'; i += 1; }
    } else if (c === '*') src += '[^/]*';
    else if (c === '?') src += '[^/]';
    else src += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${src}$`);
}

// The word a test's text must hold to name `file`: its base name, or, for a name every folder shares, its folder's
// name three or more levels down and its whole path nearer the top, where a folder's name is a package's or
// plugin's, which most of its tests name.
function keyOf(file) {
  const base = path.posix.basename(file);
  const folder = path.posix.dirname(file);
  if (!GENERIC_NAMES.has(base.toLowerCase()) || folder === '.') return base;
  return folder.split('/').length >= 3 ? path.posix.basename(folder) : file;
}

function folderTests(tree, folder, key) {
  let names = [];
  try { names = fs.readdirSync(path.join(tree, folder)); } catch { return []; }
  return names.filter((n) => NODE_TEST_FILE.test(n)).map((n) => path.posix.join(folder, n)).filter((f) => {
    try { return fs.readFileSync(path.join(tree, f), 'utf8').includes(key); } catch { return false; }
  });
}

/** The test files `cfg.stepTests` adds for `changed` (tree-relative, `/`-separated), sorted, each once. */
function stepTestsFor({ cfg, tree, changed }) {
  const declared = cfg && cfg.stepTests;
  if (!declared || typeof declared !== 'object' || Array.isArray(declared)) return [];
  const added = new Set();
  const rules = Object.entries(declared).filter(([, entries]) => Array.isArray(entries)).map(([glob, entries]) => ({ re: globToRegExp(glob), entries }));
  for (const raw of changed || []) {
    const file = String(raw).replace(/\\/g, '/');
    if (isExcluded(file)) continue;
    for (const { re, entries } of rules) {
      if (!re.test(file)) continue;
      for (const entry of entries.filter((e) => typeof e === 'string' && e)) {
        if (entry.endsWith('/')) {
          for (const f of folderTests(tree, entry.slice(0, -1), keyOf(file))) added.add(f);
        } else if (NODE_TEST_FILE.test(entry) && fs.existsSync(path.join(tree, entry))) added.add(entry.replace(/\\/g, '/'));
      }
    }
  }
  return [...added].sort();
}

module.exports = { stepTestsFor, globToRegExp };
