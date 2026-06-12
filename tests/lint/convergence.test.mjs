// T1 — convergence lint. Several contracts live in MULTIPLE files by design (ADR-14:
// background subagents only see their own definition, so shared protocol is duplicated).
// Duplication without a lint is drift waiting to happen (scorecard #8's standing risk).
// These tests pin the load-bearing shared vocabulary; if one side is edited alone, this fails.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listAgents, agentName, pluginRoot } from '../helpers.mjs';

const read = (...p) => readFileSync(join(pluginRoot('nexus'), ...p), 'utf8');

const critic = read('agents', 'critic.md');
const teamLead = read('agents', 'team-lead.md');
const po = read('agents', 'po.md');
const reviewer = read('agents', 'reviewer.md');
const reviewFormat = read('skills', 'review-format', 'SKILL.md');
const implFormat = read('skills', 'implementation-format', 'SKILL.md');
const gate = read('hooks', 'scripts', 'pipeline-gate.js');

test('critic verdict vocabulary (REJECT / REVISE / ACCEPT) converges across producer and consumers', () => {
  for (const token of ['REJECT', 'REVISE', 'ACCEPT']) {
    assert.ok(critic.includes(token), `critic.md no longer emits verdict token ${token}`);
  }
  // Consumers route on the exact triple — if the critic's vocabulary changes, these must move with it.
  assert.match(teamLead, /REJECT \/ REVISE \/ ACCEPT/, 'team-lead.md lost the critic verdict triple');
  assert.match(po, /REJECT \/ REVISE \/ ACCEPT/, 'po.md lost the critic verdict triple');
});

test('review verdict vocabulary (APPROVED / REQUEST CHANGES) converges across producer, consumer, format, and gate', () => {
  for (const [name, text] of [['reviewer.md', reviewer], ['team-lead.md', teamLead], ['review-format', reviewFormat]]) {
    assert.ok(text.includes('APPROVED'), `${name} lost the APPROVED verdict token`);
    assert.ok(text.includes('REQUEST CHANGES'), `${name} lost the REQUEST CHANGES verdict token`);
  }
  // pipeline-gate.js enforces verdict integrity with regexes over the same vocabulary —
  // if the words change in the prompts, the hook goes blind without failing anywhere. Pin it.
  assert.ok(/APPROVED/.test(gate), 'pipeline-gate.js no longer matches APPROVED');
  assert.ok(/REQUEST\\s\+CHANGES|REQUEST CHANGES/.test(gate), 'pipeline-gate.js no longer matches REQUEST CHANGES');
});

test('Carry-Over Findings heading converges between producer (implementation-format) and consumer (reviewer)', () => {
  assert.ok(implFormat.includes('## Carry-Over Findings'), 'implementation-format lost the Carry-Over Findings section');
  assert.ok(reviewer.includes('## Carry-Over Findings'), 'reviewer.md no longer instructs engaging with ## Carry-Over Findings');
});

test('severity vocabulary converges between review-format and the gate', () => {
  // The gate blocks APPROVED-with-open-CRITICAL/HIGH; the format must still define those levels.
  for (const sev of ['CRITICAL', 'HIGH']) {
    assert.ok(reviewFormat.includes(sev), `review-format lost severity level ${sev}`);
    assert.ok(gate.includes(sev), `pipeline-gate.js no longer matches severity ${sev}`);
  }
});

// ── ADR-14 designated-identical blocks ───────────────────────────────────────
// ADR-14 duplicates a few load-bearing blocks verbatim into every carrier agent (a background
// subagent sees only its own file). The convergence checks above pin shared *vocabulary*; these
// pin a shared *block* byte-for-byte. Each registry entry names the block and an extractor; the
// carrier set is DISCOVERED (every agent whose file contains the block), never hand-curated — so a
// 9th agent that grows the block is covered automatically and a single divergent edit is named.
const BLOCK_REGISTRY = [
  {
    name: 'Slug / paths / caps (compact reference)',
    // Heading line through the end of the `- **Cycle caps**` bullet. [\s\S] across the 3 bullets;
    // .* (no s-flag) stops the tail at the Cycle-caps line's own newline.
    extract: /\*\*Slug \/ paths \/ caps \(compact reference[\s\S]*?- \*\*Cycle caps\*\*.*/,
  },
];

test('ADR-14 designated-identical blocks are byte-identical across all carrier agents', () => {
  const agents = listAgents('nexus').map((file) => ({ name: agentName(file), text: readFileSync(file, 'utf8') }));
  for (const { name: blockName, extract } of BLOCK_REGISTRY) {
    const carriers = [];
    for (const { name: agent, text } of agents) {
      const m = text.match(extract);
      if (m) carriers.push({ agent, block: m[0] });
    }
    assert.ok(carriers.length >= 2, `block "${blockName}" found in <2 agents — extractor stale or block removed`);
    const [canonical, ...rest] = carriers;
    for (const c of rest) {
      assert.equal(
        c.block,
        canonical.block,
        `block "${blockName}" in agents/${c.agent}.md diverges from agents/${canonical.agent}.md ` +
          `(ADR-14 says these must be byte-identical — edit all carriers together)`
      );
    }
  }
});
