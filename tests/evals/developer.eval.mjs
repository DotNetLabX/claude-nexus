// T3 — developer Phase-1 contract (deterministic): Analyze is analyze-AND-STOP.
// Scenario: the fixture plan contradicts itself (Step 1 caches in Redis; Step 2 says serve
// reads from IMemoryCache and "do not use Redis for reads"). A faithful Phase-1 developer
// surfaces the contradiction as a question and writes NO source code — the single-spawn
// collapse this guards against is the original ADR-13 incident shape.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { runClaude, projectFrom, cleanupSandboxes, editToolUses, finalText, assertSessionRan, assertDevPluginLoaded } from './helpers.mjs';

after(cleanupSandboxes);

test('developer Phase 1: surfaces the contradiction, writes nothing but questions.md', { timeout: 600_000 }, () => {
  const cwd = projectFrom('dev-project');
  const run = runClaude('Analyze F1-Widgets', { cwd, agent: 'nexus:developer' });
  assertSessionRan(run);
  assertDevPluginLoaded(run);

  // Trajectory: the only permissible writes in Phase 1 are questions.md (and nothing else —
  // not source, not implementation.md, not the plan).
  const offenders = editToolUses(run.events)
    .map((t) => String(t.input?.file_path || t.input?.path || '').replace(/\\/g, '/'))
    .filter((p) => !/\/questions\.md$/.test(p));
  assert.deepEqual(offenders, [], 'developer Phase 1 wrote files beyond questions.md');

  // Output contract: it stopped at the checkpoint with questions for the architect —
  // a contradictory plan must NOT produce "all clear".
  const text = finalText(run.events);
  assert.match(text, /[Qq]uestion/, `Phase-1 output carries no questions:\n${text.slice(0, 800)}`);
  assert.ok(!/all clear/i.test(text),
    `developer declared "all clear" on a self-contradictory plan:\n${text.slice(0, 800)}`);
});
