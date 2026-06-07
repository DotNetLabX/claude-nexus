/**
 * restore-agent.js unit tests — Case 8: H4 session-scoped .pipeline-state lifecycle.
 *
 * Verifies that restore-agent.js deletes .claude/.pipeline-state on SessionStart
 * startup/clear (prior-session tokens must not block a new session) and keeps it
 * on compact/resume (the live session continues).
 *
 * Run with: node --test plugins/nexus/hooks/scripts/__tests__/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESTORE = join(__dirname, '..', 'restore-agent.js');

/**
 * Run restore-agent.js with a given SessionStart payload, with .pipeline-state pre-seeded.
 * Returns true if .pipeline-state still exists after the run, false if deleted.
 */
function runRestore(payload, existingStateContent = 'architect:analyze') {
  const tmpProject = join(tmpdir(), `nexus-restore-test-${randomUUID()}`);
  const claudeDir = join(tmpProject, '.claude');
  mkdirSync(claudeDir, { recursive: true });

  const stateFile = join(claudeDir, '.pipeline-state');
  writeFileSync(stateFile, existingStateContent);

  // Also create an empty .personas.json so the script doesn't crash on parse.
  writeFileSync(join(claudeDir, '.personas.json'), '{}');

  const input = JSON.stringify({ ...payload, session_id: randomUUID() });

  const result = spawnSync(process.execPath, [RESTORE], {
    input,
    encoding: 'utf8',
    timeout: 5000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: tmpProject },
  });

  if (result.error) throw result.error;
  assert.equal(result.status, 0, `restore-agent exited non-zero: ${result.stderr}`);

  return existsSync(stateFile);
}

// ---------- Case 8a: startup → .pipeline-state deleted ----------
test('Case 8a (H4) — startup source: .pipeline-state deleted', () => {
  const stillExists = runRestore({ source: 'startup' });
  assert.equal(stillExists, false, 'Expected .pipeline-state to be deleted on startup');
});

// ---------- Case 8b: clear → .pipeline-state deleted ----------
test('Case 8b (H4) — clear source: .pipeline-state deleted', () => {
  const stillExists = runRestore({ source: 'clear' });
  assert.equal(stillExists, false, 'Expected .pipeline-state to be deleted on clear');
});

// ---------- Case 8c: compact → .pipeline-state kept ----------
test('Case 8c (H4) — compact source: .pipeline-state kept', () => {
  const stillExists = runRestore({ source: 'compact' });
  assert.equal(stillExists, true, 'Expected .pipeline-state to be kept on compact');
});

// ---------- Case 8d: resume → .pipeline-state kept ----------
test('Case 8d (H4) — resume source: .pipeline-state kept', () => {
  const stillExists = runRestore({ source: 'resume' });
  assert.equal(stillExists, true, 'Expected .pipeline-state to be kept on resume');
});
