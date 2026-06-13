// T2 — skill-tracker.js (Gate A, ADR-24 proposed): an always-on positive log of every Skill
// invocation, so the architect's done-check scores skill conformance against a platform-logged
// FACT, not the developer's fakeable/omittable `## Skills Used` self-report. Mirrors read-tracker:
// observe-only PostToolUse, never blocks, fail-silent, NOT config-gated (must not depend on the
// opt-in token_audit — ADR-11). One JSON line per Skill call to .claude/audit/skill-invocations.log.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, runHook, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const TRACKER = join(pluginRoot('nexus'), 'hooks', 'scripts', 'skill-tracker.js');
after(cleanupSandboxes);

const LOG = (dir) => join(dir, '.claude', 'audit', 'skill-invocations.log');
const lines = (dir) => readFileSync(LOG(dir), 'utf8').trim().split('\n').map(JSON.parse);

// A skill invocation as the platform surfaces it: tool_name === 'Skill', tool_input.skill = name.
function invoke(dir, skill, { agentType, session = 'sess-st' } = {}) {
  const event = { session_id: session, tool_name: 'Skill', tool_input: { skill }, cwd: dir };
  if (agentType) event.agent_type = agentType;
  return runHook(TRACKER, event, { projectDir: dir });
}
function setToken(dir, token) {
  mkdirSync(join(dir, '.claude'), { recursive: true });
  writeFileSync(join(dir, '.claude', '.pipeline-state'), token);
}

test('a Skill invocation appends one {ts, agent, skill, token, session} line', () => {
  const dir = makeSandbox();
  setToken(dir, 'developer:implement');
  const res = invoke(dir, 'create-feature', { agentType: 'developer' });
  assert.equal(res.status, 0, 'tracker never fails the call');
  const all = lines(dir);
  assert.equal(all.length, 1, 'exactly one line per Skill call');
  const [v] = all;
  assert.equal(v.agent, 'developer');
  assert.equal(v.skill, 'create-feature');
  assert.equal(v.token, 'developer:implement', 'the round token is captured for Step-3 scoping (MED-6)');
  assert.equal(v.session, 'sess-st');
  assert.ok(v.ts, 'a timestamp is recorded');
});

test('a namespaced agent_type is reduced to its final segment', () => {
  const dir = makeSandbox();
  invoke(dir, 'tdd', { agentType: 'nexus:developer' });
  assert.equal(lines(dir)[0].agent, 'developer');
});

test('a main-session Skill call (no agent_type) attributes to main, not blank (|| main tail, MED-5)', () => {
  const dir = makeSandbox();
  const res = invoke(dir, 'create-aggregate'); // no agent_type — solo/fast run, developer IS main
  assert.equal(res.status, 0);
  const [v] = lines(dir);
  assert.equal(v.agent, 'main', "the audit-logger.js:99 '|| main' tail must fill agent, never leave it empty");
});

test('a non-Skill tool appends nothing — zero footprint', () => {
  const dir = makeSandbox();
  const res = runHook(TRACKER, {
    session_id: 's', tool_name: 'Read', tool_input: { file_path: 'src/a.cs' }, cwd: dir,
  }, { projectDir: dir });
  assert.equal(res.status, 0);
  assert.ok(!existsSync(LOG(dir)), 'a non-Skill event writes no log');
});

test('fail silent: malformed stdin creates/writes nothing and exits 0', () => {
  const dir = makeSandbox();
  const res = runHook(TRACKER, '{{{', { projectDir: dir });
  assert.equal(res.status, 0);
  assert.ok(!existsSync(LOG(dir)), 'malformed stdin leaves no audit dir');
});

test('the token is empty-string when no .pipeline-state exists (read-tracker round-keying shape)', () => {
  const dir = makeSandbox(); // no setToken
  invoke(dir, 'diagnose', { agentType: 'developer' });
  assert.equal(lines(dir)[0].token, '', 'absent token reads as empty string, not undefined/throw');
});
