/**
 * The business-rule registry CO-COMMIT check, as a pure function over a list of paths.
 *
 * Extracted from registry-stamp-check.js (F81 Step 8) because it now has a second consumer:
 * commit-step.js. The hook keys on a Bash `git … commit` (`registry-stamp-check.js` — its PostToolUse
 * matcher), and a commit made inside node never passes through that gate, so a per-step commit would
 * silently lose the check the hook exists to provide. One rule, one implementation, two callers —
 * the same reason lib/resolve-role.js and lib/worktree-target.js were extracted.
 *
 * WHAT IT ACTUALLY CHECKS — read this before renaming anything. Despite the "stamp" in the name, no
 * `last_verified` value is ever read. The check is: *a file in this change-set has a registry whose
 * basename matches, and that registry is NOT in the same change-set.* "The stamp is stale" is the
 * conclusion a human draws from that; the machine only knows the registry did not ride along.
 *
 * It is deliberately ADVISORY on both sides. The matching is a v1 basename heuristic (F40 Decision 5)
 * and its own author graded a wrong miss as tolerable; a check that imprecise must not be able to
 * block a commit. The hook prints a systemMessage; the helper prints a warning and commits anyway.
 *
 * The two callers differ only in where the path list comes from: the hook reads the commit that just
 * happened (`git diff-tree … HEAD`), the helper passes the paths it is about to stage.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REGISTRY_DIR = ['docs', 'business-rules'];
const REGISTRY_PREFIX = REGISTRY_DIR.join('/') + '/';

// Reserved NON-registry species that live under docs/business-rules/ (F49; extended by F41). The unit
// index below is keyed on bare basename, so without this a module `index.md` would claim the `index`
// key and false-advise on every committed `index.*` file in the repo — likewise `digest.*`. The
// evidence appendix `{unit}-evidence.md` and the C2 attestation record `{unit}-attestation.md` are
// excluded for the same reason: each is a dated record beside a registry, never one itself. Both carry
// a per-unit PREFIX, so they are matched by suffix below — do not "complete" the basename Set with them.
const NON_REGISTRY_BASENAMES = new Set(['index', 'digest']);

// Basename without its extension, lowercased — the whole of the v1 match heuristic.
function unitKey(file) {
  const name = path.basename(file);
  return name.slice(0, name.length - path.extname(name).length).toLowerCase();
}

function isNonRegistry(name) {
  return NON_REGISTRY_BASENAMES.has(unitKey(name)) || /-(evidence|attestation)$/.test(unitKey(name));
}

// Map every registry file to its unit key: `docs/business-rules/tracking/hungarian.md` -> `hungarian`.
// A key can hold several paths (the same class name registered under two areas) — the advisory only
// fires when NONE of that key's registries rode along in the change-set.
function registryIndex(root) {
  const base = path.join(root, ...REGISTRY_DIR);
  const index = new Map();
  if (!fs.existsSync(base)) return index;   // no registries here — both callers then find nothing
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.toLowerCase().endsWith('.md')) continue;
      if (isNonRegistry(entry.name)) continue;
      const key = unitKey(entry.name);
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(rel);
    }
  };
  walk(base);
  return index;
}

/**
 * The check. `files` is a list of repo-relative POSIX-ish paths (the caller normalizes separators).
 * Returns one `{ file, registry }` pair per UNSTAMPED registry, deduped: several files in one
 * change-set can map to the same registry, and repeating it would only pad the message.
 */
function staleRegistries(root, files) {
  const index = registryIndex(root);
  if (index.size === 0) return [];
  const list = files.map((f) => String(f).replace(/\\/g, '/'));
  const present = new Set(list);
  const stale = new Map();
  for (const file of list) {
    if (file.startsWith(REGISTRY_PREFIX)) continue;   // a registry is not a unit to check
    const paths = index.get(unitKey(file));
    if (!paths || paths.some((p) => present.has(p))) continue;   // unregistered, or re-stamped
    for (const p of paths) if (!stale.has(p)) stale.set(p, file);
  }
  return [...stale].map(([registry, file]) => ({ file, registry }));
}

// One sentence, shared by both callers verbatim, so a repo sees the same wording whichever path the
// commit took. It ends "Advisory only." on purpose — neither caller blocks on it.
function advisoryMessage(pairs) {
  const units = pairs.map(({ file, registry }) => `${file} -> ${registry}`).join('; ');
  return `Nexus registry stamp check: this commit changed a unit that has a business-rule registry, ` +
    `but the registry was not re-stamped in the same commit (${units}). Re-verify the affected ` +
    `rows against the edited source and re-stamp last_verified, or flag an M3 re-mine. Advisory only.`;
}

module.exports = { staleRegistries, advisoryMessage, unitKey, isNonRegistry, REGISTRY_DIR, REGISTRY_PREFIX };
