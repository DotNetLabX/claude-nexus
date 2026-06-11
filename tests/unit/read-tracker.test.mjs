// T2 — read-tracker.js (ADR-22): round-scoped read discipline made visible. Prose-only
// discipline measurably fails (F16: plan.md re-read ×35 by its own author); a PreToolUse
// deny would wedge legitimate reads and is dropped for background subagents anyway (ADR-13).
// So: observe-only PostToolUse(Read) — nudge on the 2nd same-round read, log ≥3 to
// violations.log for the team-lead checkpoint. Round boundary = .pipeline-state content or
// session change (the team lead rewrites the token at every spawn/resume).
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, runHook, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const TRACKER = join(pluginRoot('nexus'), 'hooks', 'scripts', 'read-tracker.js');
after(cleanupSandboxes);

const VLOG = (dir) => join(dir, '.claude', 'audit', 'violations.log');

function read(dir, agentType, file, session = 'sess-rt') {
  const event = { session_id: session, tool_name: 'Read', tool_input: { file_path: file }, cwd: dir };
  if (agentType) event.agent_type = agentType;
  return runHook(TRACKER, event, { projectDir: dir });
}
function setToken(dir, token) {
  mkdirSync(join(dir, '.claude'), { recursive: true });
  writeFileSync(join(dir, '.claude', '.pipeline-state'), token);
}

test('first read is silent; second same-round read nudges via systemMessage', () => {
  const dir = makeSandbox();
  const r1 = read(dir, 'architect', 'docs/specs/F1/delivery/plan.md');
  assert.equal(r1.status, 0);
  assert.ok(!r1.json?.systemMessage, 'first read is clean');
  const r2 = read(dir, 'architect', 'docs/specs/F1/delivery/plan.md');
  assert.equal(r2.status, 0);
  assert.ok(r2.json?.systemMessage, 'second read nudges');
  assert.match(r2.json.systemMessage, /once per round|re-read/i);
  assert.ok(!existsSync(VLOG(dir)), 'a nudge is not yet a violation');
});

test('third same-round read of the same file lands in violations.log', () => {
  const dir = makeSandbox();
  read(dir, 'architect', 'docs/specs/F1/delivery/plan.md');
  read(dir, 'architect', 'docs/specs/F1/delivery/plan.md');
  read(dir, 'architect', 'docs/specs/F1/delivery/plan.md');
  const lines = readFileSync(VLOG(dir), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines.length, 1, 'exactly one violation line at the 3rd read');
  assert.equal(lines[0].agent, 'architect');
  assert.match(lines[0].rule, /re-read|once per round/i);
});

test('a pipeline-state token change resets the round', () => {
  const dir = makeSandbox();
  setToken(dir, 'architect:plan');
  read(dir, 'architect', 'docs/specs/F1/delivery/plan.md');
  setToken(dir, 'architect:donecheck'); // team lead advanced the phase -> new round
  const r = read(dir, 'architect', 'docs/specs/F1/delivery/plan.md');
  assert.ok(!r.json?.systemMessage, "new round: the re-read is that round's first read");
});

test('a session change resets counts', () => {
  const dir = makeSandbox();
  read(dir, 'developer', 'src/a.cs', 'sess-1');
  const r = read(dir, 'developer', 'src/a.cs', 'sess-2');
  assert.ok(!r.json?.systemMessage);
});

test('different agents and different files are tracked independently', () => {
  const dir = makeSandbox();
  read(dir, 'architect', 'docs/specs/F1/delivery/plan.md');
  const r1 = read(dir, 'developer', 'docs/specs/F1/delivery/plan.md');
  assert.ok(!r1.json?.systemMessage, "another agent's first read is clean");
  const r2 = read(dir, 'architect', 'docs/specs/F1/delivery/questions.md');
  assert.ok(!r2.json?.systemMessage, "another file's first read is clean");
});

test('offset/limit (chunked) reads are not counted — distinct ranges are ONE logical read', () => {
  const dir = makeSandbox();
  const chunk = (offset) => runHook(TRACKER, {
    session_id: 's', tool_name: 'Read', agent_type: 'developer',
    tool_input: { file_path: 'src/Big.cs', offset, limit: 100 }, cwd: dir,
  }, { projectDir: dir });
  chunk(0);
  const r = chunk(100);
  assert.ok(!r.json?.systemMessage, 'chunked first reads never nudge');
});

test('fail silent: malformed stdin and non-Read tools never log or fail', () => {
  const dir = makeSandbox();
  assert.equal(runHook(TRACKER, '{{{', { projectDir: dir }).status, 0);
  const r = runHook(TRACKER, {
    session_id: 's', tool_name: 'Grep', tool_input: { pattern: 'x' }, cwd: dir,
  }, { projectDir: dir });
  assert.equal(r.status, 0);
  assert.ok(!existsSync(VLOG(dir)));
});
