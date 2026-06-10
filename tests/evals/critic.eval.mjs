// T3 — critic contracts (the two highest-risk, both deterministic):
//   1. The critic NEVER uses an edit tool — message-only, now also platform-locked via
//      frontmatter disallowedTools (1.4.0 B.1). This eval exercises the real agent surface.
//   2. The verdict line uses the exact vocabulary REJECT / REVISE / ACCEPT.
// Scenario: the fixture plan silently drops spec requirement R3 (a stated compliance
// blocker) — a glaring gap, so an ACCEPT verdict is itself a contract failure.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { runClaude, projectFrom, cleanupSandboxes, editToolUses, finalText, assertSessionRan, assertDevPluginLoaded } from './helpers.mjs';

after(cleanupSandboxes);

test('critic: no edit tools, verdict vocabulary, and the seeded gap is not accepted', { timeout: 600_000 }, () => {
  const cwd = projectFrom('critic-project');
  const run = runClaude(
    'Review the implementation plan at docs/specs/F1-Widgets/delivery/plan.md against the spec at ' +
    'docs/specs/F1-Widgets/definition/spec.md. You are running standalone (no team lead). ' +
    'End your final message with your verdict line and findings.',
    { cwd, agent: 'nexus:critic' }
  );
  assertSessionRan(run);
  assertDevPluginLoaded(run);

  // Contract 1: message-only. Any Write/Edit/MultiEdit/NotebookEdit attempt is a breach.
  const edits = editToolUses(run.events);
  assert.deepEqual(
    edits.map((t) => `${t.name}:${t.input?.file_path || ''}`), [],
    'critic attempted edit tools'
  );

  // Contract 2: verdict vocabulary present...
  const text = finalText(run.events);
  const verdict = (text.match(/\b(REJECT|REVISE|ACCEPT)\b/g) || []).pop();
  assert.ok(verdict, `no REJECT/REVISE/ACCEPT verdict in final message:\n${text.slice(0, 800)}`);

  // ...and contract 3: a plan missing a stated compliance blocker must not pass.
  assert.notEqual(verdict, 'ACCEPT',
    `critic ACCEPTed a plan that silently drops spec R3 (audit log):\n${text.slice(0, 800)}`);
});
