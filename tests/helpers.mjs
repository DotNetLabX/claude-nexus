// Shared helpers for the nexus test harness (T1 lint + T2 unit tiers).
// Plain node:test — no dependencies, no package.json needed. Run: node --test tests/lint tests/unit
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
export const FIXTURES = join(REPO, 'tests', 'fixtures');

export function pluginRoot(name) {
  return join(REPO, 'plugins', name);
}

export function listAgents(plugin = 'nexus') {
  const dir = join(pluginRoot(plugin), 'agents');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f));
}

export function listSkills(plugin) {
  const dir = join(pluginRoot(plugin), 'skills');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((d) => existsSync(join(dir, d, 'SKILL.md')))
    .map((d) => join(dir, d, 'SKILL.md'));
}

// Flat single-line frontmatter parser — matches the shape this repo actually uses
// (key: value lines between --- fences; no nesting, no multi-line values).
export function frontmatter(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { data: null, body: text, file };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].trim();
  }
  return { data, body: m[2], file };
}

// Spawn a hook script the way the platform does: synthetic event JSON on stdin,
// CLAUDE_PROJECT_DIR pointing at a sandbox. Returns { status, stdout, stderr, json }
// where json is the parsed stdout hook output (or null if stdout isn't JSON).
export function runHook(script, event, { argv = [], projectDir, env = {} } = {}) {
  const e = { ...process.env, ...env };
  if (projectDir !== undefined) e.CLAUDE_PROJECT_DIR = projectDir;
  else delete e.CLAUDE_PROJECT_DIR; // fall back to the event's cwd chain
  const res = spawnSync(process.execPath, [script, ...argv], {
    input: typeof event === 'string' ? event : JSON.stringify(event),
    encoding: 'utf8',
    env: e,
  });
  let json = null;
  try { json = JSON.parse(res.stdout); } catch { /* non-JSON stdout (silent allow) */ }
  return { status: res.status, stdout: res.stdout, stderr: res.stderr, json };
}

// Convenience: deny decision (or null) from a PreToolUse hook result.
export function denyReason(result) {
  const h = result.json && result.json.hookSpecificOutput;
  if (h && h.permissionDecision === 'deny') return h.permissionDecisionReason || '';
  return null;
}

const sandboxes = [];
export function makeSandbox(prefix = 'nexus-test-') {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  sandboxes.push(dir);
  return dir;
}
export function cleanupSandboxes() {
  for (const dir of sandboxes.splice(0)) {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
}

// Run an arbitrary command (used by the script-level tests: bump-plugin, gen-*).
export function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', ...opts });
}

export function agentName(file) {
  return basename(file, '.md');
}
