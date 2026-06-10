// T2 — the persona pair: register-persona.js (PostToolUse bridge into the per-session
// registry) and restore-agent.js (SessionStart restore policy: compact restores, clear
// forgets, startup/resume do nothing). The two-files-by-design contract (ADR-8) is what
// these tests pin.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, runHook, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const REGISTER = join(pluginRoot('nexus'), 'hooks', 'scripts', 'register-persona.js');
const RESTORE = join(pluginRoot('nexus'), 'hooks', 'scripts', 'restore-agent.js');
after(cleanupSandboxes);

const registry = (dir) => JSON.parse(readFileSync(join(dir, '.claude', '.personas.json'), 'utf8'));
function seedRegistry(dir, reg) {
  mkdirSync(join(dir, '.claude'), { recursive: true });
  writeFileSync(join(dir, '.claude', '.personas.json'), JSON.stringify(reg));
}
// In production .claude/ always exists when register-persona fires — the trigger event IS a
// write to .claude/.current-agent. The hook itself never mkdirs (best-effort by design).
function sandboxWithClaudeDir() {
  const dir = makeSandbox();
  mkdirSync(join(dir, '.claude'), { recursive: true });
  return dir;
}

test('register: a .current-agent Write lands in the registry under the session id', () => {
  const dir = sandboxWithClaudeDir();
  runHook(REGISTER, {
    session_id: 's1', cwd: dir,
    tool_input: { file_path: join(dir, '.claude', '.current-agent'), content: 'architect' },
  }, { projectDir: dir });
  assert.equal(registry(dir).s1.agent, 'architect');
});

test('register: Edit events carry the role in new_string', () => {
  const dir = sandboxWithClaudeDir();
  runHook(REGISTER, {
    session_id: 's1', cwd: dir,
    tool_input: { file_path: '.claude/.current-agent', new_string: 'reviewer' },
  }, { projectDir: dir });
  assert.equal(registry(dir).s1.agent, 'reviewer');
});

test('register: invalid role strings and unrelated paths are ignored', () => {
  const dir = sandboxWithClaudeDir();
  for (const ti of [
    { file_path: '.claude/.current-agent', content: 'Architect!' }, // fails the slug regex
    { file_path: '.claude/.current-agent', content: '' },
    { file_path: 'src/app.js', content: 'developer' },              // not the trigger file
  ]) {
    runHook(REGISTER, { session_id: 's1', cwd: dir, tool_input: ti }, { projectDir: dir });
  }
  assert.ok(!existsSync(join(dir, '.claude', '.personas.json')), 'nothing valid was registered');
});

test('register: entries older than the TTL are pruned on write', () => {
  const dir = makeSandbox();
  seedRegistry(dir, { stale: { agent: 'po', ts: Date.now() - 17 * 60 * 60 * 1000 } });
  runHook(REGISTER, {
    session_id: 'fresh', cwd: dir,
    tool_input: { file_path: '.claude/.current-agent', content: 'developer' },
  }, { projectDir: dir });
  const reg = registry(dir);
  assert.ok(!reg.stale, '16h TTL prunes abandoned sessions');
  assert.equal(reg.fresh.agent, 'developer');
});

test('restore: compact re-injects the full agent body for this session only', () => {
  const dir = makeSandbox();
  seedRegistry(dir, { s1: { agent: 'critic', ts: Date.now() } });
  const res = runHook(RESTORE, { session_id: 's1', source: 'compact', cwd: dir }, { projectDir: dir });
  const ctx = res.json?.hookSpecificOutput?.additionalContext || '';
  assert.match(ctx, /Active persona: critic/);
  assert.match(ctx, /# Critic Agent/, 'the real agent body is inlined from the plugin');
  // A different session compacting must not inherit it.
  const other = runHook(RESTORE, { session_id: 's2', source: 'compact', cwd: dir }, { projectDir: dir });
  assert.equal(other.json, null);
});

test('restore: startup and resume inject nothing; clear forgets the persona', () => {
  const dir = makeSandbox();
  seedRegistry(dir, { s1: { agent: 'architect', ts: Date.now() } });
  for (const source of ['startup', 'resume']) {
    const res = runHook(RESTORE, { session_id: 's1', source, cwd: dir }, { projectDir: dir });
    assert.equal(res.json, null, `${source} must not inject`);
  }
  const cleared = runHook(RESTORE, { session_id: 's1', source: 'clear', cwd: dir }, { projectDir: dir });
  assert.equal(cleared.json, null);
  assert.ok(!registry(dir).s1, '/clear is the persona exit');
});

test('restore: a role not shipped by the plugin is never injected', () => {
  const dir = makeSandbox();
  seedRegistry(dir, { s1: { agent: 'bogus-role', ts: Date.now() } });
  const res = runHook(RESTORE, { session_id: 's1', source: 'compact', cwd: dir }, { projectDir: dir });
  assert.equal(res.json, null, 'roles are derived from agents/ on disk, never trusted from the registry');
});
