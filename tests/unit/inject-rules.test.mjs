// T2 — inject-rules.js: rules/*.md are delivered as SessionStart additionalContext on
// startup/clear/compact, and deliberately NOT on resume (the transcript already carries them).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, runHook } from '../helpers.mjs';

const INJECT = join(pluginRoot('nexus'), 'hooks', 'scripts', 'inject-rules.js');

test('startup/clear/compact inject every shipped rule file', () => {
  const ruleFiles = readdirSync(join(pluginRoot('nexus'), 'rules')).filter((f) => f.endsWith('.md'));
  assert.ok(ruleFiles.length > 0, 'plugin ships no rules?');
  for (const source of ['startup', 'clear', 'compact']) {
    const res = runHook(INJECT, { source });
    const ctx = res.json?.hookSpecificOutput?.additionalContext || '';
    assert.match(ctx, /Nexus — always-on rules/, `${source}: missing injection header`);
    for (const f of ruleFiles) {
      assert.ok(ctx.includes(`--- ${f} ---`), `${source}: rule ${f} not injected`);
    }
  }
});

test('resume injects nothing (transcript already contains the rules)', () => {
  const res = runHook(INJECT, { source: 'resume' });
  assert.equal(res.status, 0);
  assert.equal(res.json, null);
});

test('unparseable stdin fails open and still injects', () => {
  const res = runHook(INJECT, 'not-json{{');
  assert.match(res.json?.hookSpecificOutput?.additionalContext || '', /always-on rules/);
});
