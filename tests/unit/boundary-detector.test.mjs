// T2 — boundary-detector.js (evaluation roadmap B.2, unlocked by Probe P1 2026-06-10:
// PostToolUse fires inside background subagents). Prevention is impossible there (the
// platform drops PreToolUse deny, ADR-13); this detector makes violations DETERMINISTICALLY
// VISIBLE instead: every boundary breach lands in .claude/audit/violations.log, which the
// team lead checks at every checkpoint. Observe-only — it must never block anything.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, runHook, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const DETECTOR = join(pluginRoot('nexus'), 'hooks', 'scripts', 'boundary-detector.js');
after(cleanupSandboxes);

const LOG = (dir) => join(dir, '.claude', 'audit', 'violations.log');
const lines = (dir) => readFileSync(LOG(dir), 'utf8').trim().split('\n').map(JSON.parse);

function detect(dir, agentType, file, tool = 'Write') {
  return runHook(DETECTOR, {
    session_id: 'sess-bd', tool_name: tool, agent_type: agentType,
    tool_input: { file_path: file, content: 'x' }, cwd: dir,
  }, { projectDir: dir });
}

test('a non-code role writing application source is logged', () => {
  const dir = makeSandbox();
  const res = detect(dir, 'critic', 'src/Orders/OrderQuery.cs');
  assert.equal(res.status, 0, 'detector never fails the call');
  const [v] = lines(dir);
  assert.equal(v.agent, 'critic');
  assert.match(v.rule, /non-code role/i);
  assert.ok(res.json?.systemMessage, 'a violation surfaces a systemMessage for visibility');
});

test('artifact ownership: a role writing another role\'s artifact is logged', () => {
  const dir = makeSandbox();
  detect(dir, 'developer', 'docs/specs/F1/delivery/plan.md');          // architect's file
  detect(dir, 'developer', 'docs/specs/F1/delivery/review.md');        // architect+reviewer's file
  detect(dir, 'nexus:architect', 'docs/specs/F1/delivery/summary.md'); // team lead's file
  const all = lines(dir);
  assert.equal(all.length, 3);
  assert.ok(all.every((v) => /owner/i.test(v.rule)));
});

test('any subagent writing .pipeline-state is logged (team lead is main-session only)', () => {
  const dir = makeSandbox();
  detect(dir, 'developer', '.claude/.pipeline-state');
  const [v] = lines(dir);
  assert.match(v.rule, /pipeline-state/i);
});

test('legitimate writes are NOT logged — zero footprint when clean', () => {
  const dir = makeSandbox();
  detect(dir, 'developer', 'src/Orders/OrderQuery.cs');                    // code role writes code
  detect(dir, 'developer', 'docs/specs/F1/delivery/implementation.md');    // own artifact
  detect(dir, 'nexus:architect', 'docs/specs/F1/delivery/plan.md');        // own artifact (namespaced)
  detect(dir, 'reviewer', 'docs/specs/F1/delivery/review.md');             // own artifact
  detect(dir, 'developer', 'docs/specs/F1/delivery/lessons.md');           // shared by design
  detect(dir, 'critic', 'docs/notes.md');                                  // docs are not source
  assert.ok(!existsSync(LOG(dir)), 'a clean run leaves no audit dir at all');
});

test('main-session calls (no agent_type) are ignored — the foreground gate already covers them', () => {
  const dir = makeSandbox();
  const res = runHook(DETECTOR, {
    session_id: 's', tool_name: 'Write',
    tool_input: { file_path: 'docs/specs/F1/delivery/plan.md', content: 'x' }, cwd: dir,
  }, { projectDir: dir });
  assert.equal(res.status, 0);
  assert.ok(!existsSync(LOG(dir)));
});

test('fail silent: malformed stdin and non-edit tools never log or fail', () => {
  const dir = makeSandbox();
  assert.equal(runHook(DETECTOR, '{{{', { projectDir: dir }).status, 0);
  assert.equal(detect(dir, 'critic', '', 'Bash').status, 0);
  assert.ok(!existsSync(LOG(dir)));
});
