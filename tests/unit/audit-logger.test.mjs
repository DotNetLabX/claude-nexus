// T2 — audit-logger.js: the opt-in contract is the load-bearing part. OFF must mean
// literally zero footprint in the host project (scorecard #10 scored it on exactly that).
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, runHook, makeSandbox, cleanupSandboxes, FIXTURES } from '../helpers.mjs';

const LOGGER = join(pluginRoot('nexus'), 'hooks', 'scripts', 'audit-logger.js');
const USAGE_TAIL = join(FIXTURES, 'transcripts', 'usage-tail.jsonl');
after(cleanupSandboxes);

const event = (sandbox, extra = {}) => ({
  session_id: 'sess-audit-1',
  tool_name: 'Read',
  tool_input: { file_path: 'src/App.vue' },
  cwd: sandbox,
  ...extra,
});

test('audit OFF (default): zero footprint — no directories, no files', () => {
  const sandbox = makeSandbox();
  for (const argv of [[], ['off'], ['false'], ['0']]) {
    const res = runHook(LOGGER, event(sandbox), { argv, projectDir: sandbox });
    assert.equal(res.status, 0);
  }
  assert.ok(!existsSync(join(sandbox, '.claude')), 'audit OFF must create nothing at all');
});

test('audit ON: writes the per-session trace with agent attribution and redacted detail', () => {
  const sandbox = makeSandbox();
  runHook(LOGGER, event(sandbox), { argv: ['true'], projectDir: sandbox });
  runHook(LOGGER, event(sandbox, { agent_type: 'developer', tool_name: 'Bash', tool_input: { command: 'dotnet build' } }),
    { argv: ['true'], projectDir: sandbox });

  const log = readFileSync(join(sandbox, '.claude', 'audit', 'sess-audit-1.log'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(log.length, 2);
  assert.equal(log[0].agent, 'main', 'no agent_type and no registry -> main');
  assert.equal(log[0].detail, 'src/App.vue', 'detail carries the forensic argument');
  assert.equal(log[1].agent, 'developer', 'subagent calls are attributed via agent_type');
  assert.equal(log[1].detail, 'dotnet build');
});

test('audit ON: token reading is extracted from the transcript tail', () => {
  const sandbox = makeSandbox();
  runHook(LOGGER, event(sandbox, { transcript_path: USAGE_TAIL }), { argv: ['1'], projectDir: sandbox });
  const recs = readFileSync(join(sandbox, '.claude', 'audit', 'token-usage.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].input, 120);
  assert.equal(recs[0].output, 45);
  assert.equal(recs[0].cache_read, 3000);
  assert.equal(recs[0].context, 120 + 3000 + 17, 'context = input + cache_read + cache_creation');
});

test('audit ON: detail is capped at 120 chars and session ids are sanitized for the filename', () => {
  const sandbox = makeSandbox();
  const longCmd = 'x'.repeat(500);
  runHook(LOGGER, event(sandbox, { session_id: 'a/b..#c', tool_name: 'Bash', tool_input: { command: longCmd } }),
    { argv: ['true'], projectDir: sandbox });
  const rec = JSON.parse(readFileSync(join(sandbox, '.claude', 'audit', 'abc.log'), 'utf8').trim());
  assert.equal(rec.detail.length, 120, 'forensic detail is excerpt-capped, never full content');
});

test('fail silent: unreadable transcript and malformed stdin never break the call', () => {
  const sandbox = makeSandbox();
  const res1 = runHook(LOGGER, event(sandbox, { transcript_path: join(sandbox, 'nope.jsonl') }), { argv: ['true'], projectDir: sandbox });
  assert.equal(res1.status, 0);
  const res2 = runHook(LOGGER, 'not json', { argv: ['true'], projectDir: sandbox });
  assert.equal(res2.status, 0);
});
