'use strict';
/**
 * Where an installed plugin's files live, and which plugin ships an agent.
 *
 * The core serves every repo, so a plugin's install is resolved checkout-first: a project- or
 * local-scope install whose project path is the session's checkout wins, then the user-scope one,
 * the highest version first within each. Another project's install is never used — its version
 * may differ from what this session runs. The core's own plugin is always this script's own folder.
 *
 * Read from Claude Code's installed-plugins record (`plugins/installed_plugins.json` under
 * CLAUDE_CONFIG_DIR, else `~/.claude`). Fail-soft: an unreadable record resolves nothing.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const OWN_ROOT = path.resolve(__dirname, '..', '..', '..');

function ownName() {
  try { return JSON.parse(fs.readFileSync(path.join(OWN_ROOT, '.claude-plugin', 'plugin.json'), 'utf8')).name || null; } catch { return null; }
}

function readRecord(env) {
  const configDir = env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  try {
    const record = JSON.parse(fs.readFileSync(path.join(configDir, 'plugins', 'installed_plugins.json'), 'utf8'));
    return (record && record.plugins) || record || {};
  } catch { return {}; }
}

const parts = (v) => String(v || '0').split('.').map((n) => Number.parseInt(n, 10) || 0);
function newerFirst(a, b) {
  const [x, y] = [parts(a.version), parts(b.version)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (y[i] || 0) - (x[i] || 0);
  return 0;
}

// Paths the record and the session name for the same folder; Windows paths are case-insensitive.
const samePath = (a, b) => {
  const fold = (p) => { const r = path.resolve(String(p)); return process.platform === 'win32' ? r.toLowerCase() : r; };
  return fold(a) === fold(b);
};

function entriesOf(record, name) {
  return Object.keys(record)
    .filter((k) => k.split('@')[0] === name && Array.isArray(record[k]))
    .flatMap((k) => record[k].filter((e) => e && e.installPath));
}

/** The install folder of plugin `name` for a session in checkout `root`, or null. */
function pluginRoot(name, root, env = process.env, record = null) {
  if (!name) return null;
  if (name === ownName()) return OWN_ROOT;
  const entries = entriesOf(record || readRecord(env), name);
  const forHere = root
    ? entries.filter((e) => (e.scope === 'project' || e.scope === 'local') && e.projectPath && samePath(e.projectPath, root))
    : [];
  const pool = (forHere.length ? forHere : entries.filter((e) => e.scope === 'user')).sort(newerFirst);
  return pool.length ? pool[0].installPath : null;
}

/** The plugin names the installed-plugins record holds, in its order. */
function installedNames(env = process.env, record = null) {
  return [...new Set(Object.keys(record || readRecord(env)).map((k) => k.split('@')[0]))];
}

/**
 * The plugin that ships agent `agent`, with that agent's file. Given `plugin`, only that plugin is
 * looked in; without it, the core's own agents first, then each installed plugin's. Null when none does.
 */
function findAgent(agent, { plugin = null, root = null, env = process.env } = {}) {
  const record = readRecord(env);
  const own = ownName();
  const names = plugin ? [plugin] : [own, ...installedNames(env, record).filter((n) => n !== own)];
  for (const name of names) {
    const base = pluginRoot(name, root, env, record);
    if (!base) continue;
    const file = path.join(base, 'agents', `${agent}.md`);
    if (fs.existsSync(file)) return { plugin: name, file };
  }
  return null;
}

module.exports = { pluginRoot, installedNames, findAgent };
