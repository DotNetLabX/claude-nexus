// T2 — the subagentStatusLine renderer (statusline/subagent-rows.js). It transforms the
// agent-panel `tasks` payload into one {id,content} override line per row it recognises as a
// nexus pipeline role, and leaves everything else to Claude Code's default rendering.
//
// Schema caveat this suite pins: the per-task field values (type/name/status) are undocumented,
// so detection scans every text field — which makes word-boundary matching load-bearing. The
// "general-purpose must not match po" case is a regression guard for a real bug (substring match
// fired `po` inside "purpose").
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pluginRoot, runHook } from '../helpers.mjs';

const SCRIPT = join(pluginRoot('nexus'), 'statusline', 'subagent-rows.js');
const plain = (s) => s.replace(/\x1b\[[0-9;]*m/g, ''); // drop ANSI for content assertions

function render(payload) {
  const { stdout, status } = runHook(SCRIPT, payload);
  const lines = stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { lines, status, stdout };
}

test('recognised roles get a restyled row carrying the same id', () => {
  const { lines } = render({
    columns: 120,
    tasks: [{ id: 't1', type: 'nexus:architect', description: 'Plan F5 card', tokenCount: 4200 }],
  });
  assert.equal(lines.length, 1);
  assert.equal(lines[0].id, 't1');
  const c = plain(lines[0].content);
  assert.match(c, /\[arch\]/);
  assert.match(c, /Plan F5 card/);
  assert.match(c, /4\.2k tok/);
});

test('each pipeline role maps to its tag', () => {
  const cases = {
    'team-lead': 'lead', architect: 'arch', developer: 'dev', reviewer: 'rev',
    critic: 'crit', learner: 'learn', solo: 'solo', po: 'po',
  };
  for (const [role, tag] of Object.entries(cases)) {
    const { lines } = render({ tasks: [{ id: 'x', type: `nexus:${role}` }] });
    assert.equal(lines.length, 1, `${role} should be recognised`);
    assert.match(plain(lines[0].content), new RegExp(`\\[${tag}\\]`));
  }
});

test('word boundaries: substrings of longer words never match (regression: po in "purpose")', () => {
  for (const type of ['general-purpose', 'architecture review', 'purpose', 'redevelopment', 'solos']) {
    const { lines } = render({ tasks: [{ id: 'x', name: type, description: 'work' }] });
    assert.equal(lines.length, 0, `"${type}" must keep default rendering`);
  }
});

test('unrecognised rows emit no line; recognised siblings still render', () => {
  const { lines } = render({
    tasks: [
      { id: 'a', name: 'general-purpose', description: 'search' },
      { id: 'b', type: 'nexus:developer', description: 'impl' },
    ],
  });
  assert.deepEqual(lines.map((l) => l.id), ['b']);
});

test('a task without an id is skipped', () => {
  const { lines } = render({ tasks: [{ type: 'nexus:critic', description: 'review' }] });
  assert.equal(lines.length, 0);
});

test('token counts use the k-suffix; zero/absent counts are omitted', () => {
  assert.match(plain(render({ tasks: [{ id: 'x', type: 'reviewer', tokenCount: 860 }] }).lines[0].content), /860 tok/);
  assert.match(plain(render({ tasks: [{ id: 'x', type: 'reviewer', tokenCount: 12000 }] }).lines[0].content), /12k tok/);
  assert.doesNotMatch(plain(render({ tasks: [{ id: 'x', type: 'reviewer', tokenCount: 0 }] }).lines[0].content), /tok/);
});

test('content is clipped to the column budget with an ellipsis', () => {
  const { lines } = render({
    columns: 24,
    tasks: [{ id: 'x', type: 'reviewer', description: 'a very long description that overflows the row' }],
  });
  const c = plain(lines[0].content);
  assert.ok(c.length <= 24, `visible length ${c.length} must fit 24 cols`);
  assert.match(c, /…$/);
});

test('fail open: empty tasks, no tasks, and malformed JSON all produce no output at exit 0', () => {
  for (const payload of [{ tasks: [] }, { columns: 80 }, '{not valid json']) {
    const { stdout, status } = runHook(SCRIPT, payload);
    assert.equal(stdout.trim(), '');
    assert.equal(status, 0);
  }
});
