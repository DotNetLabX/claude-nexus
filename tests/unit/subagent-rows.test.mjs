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
import { existsSync, readFileSync } from 'node:fs';
import { pluginRoot, runHook, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const SCRIPT = join(pluginRoot('nexus'), 'statusline', 'subagent-rows.js');
const plain = (s) => s.replace(/\x1b\[[0-9;]*m/g, ''); // drop ANSI for content assertions

test.after(cleanupSandboxes);

const stateFile = (root) => join(root, '.claude', 'audit', 'fleet-state.json');
const readState = (root) => JSON.parse(readFileSync(stateFile(root), 'utf8'));

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

// ---- Heartbeat: the fleet-state.json snapshot (adhoc-NexusFleetView, Step 1) ----
//
// Root resolution uses the base-hook `cwd` (top-level, session root) — the subagentStatusLine
// payload is hook-shaped (not main-statusLine-shaped), so it carries NO `workspace` object.
// `workspace.project_dir` is kept in the fallback chain as a forward-compat guard but is absent
// in real subagent payloads. The CLAUDE_PROJECT_DIR env is hooks-only (absent here). Tests
// cover both shapes: the real hook-shaped payload (cwd at top level, no workspace) and the
// forward-compat workspace.project_dir path.

test('heartbeat: a populated payload writes the normalized snapshot under the resolved root', () => {
  const root = makeSandbox('nexus-fleet-');
  const payload = {
    columns: 120,
    workspace: { project_dir: root },
    tasks: [
      { id: 't1', type: 'nexus:architect', description: 'Plan F5', status: 'in_progress',
        startTime: 1700000000000, tokenCount: 4200, tag: 'arch', name: 'architect', cwd: '/sub/a' },
      { id: 't2', type: 'nexus:developer', description: 'Impl', status: 'active', tokenCount: 9000 },
    ],
  };
  runHook(SCRIPT, payload);
  const s = readState(root);
  assert.equal(typeof s.ts, 'string');
  assert.equal(s.columns, 120);
  assert.equal(s.tasks.length, 2);
  assert.deepEqual(s.tasks[0], {
    id: 't1', role: 'architect', tag: 'arch', name: 'architect', description: 'Plan F5',
    status: 'in_progress', startTime: 1700000000000, tokenCount: 4200, cwd: '/sub/a',
  });
  assert.equal(s.tasks[1].role, 'developer');
});

test('heartbeat: a second run overwrites latest-wins, no growth', () => {
  const root = makeSandbox('nexus-fleet-');
  const base = { workspace: { project_dir: root } };
  runHook(SCRIPT, { ...base, tasks: [{ id: 'a', type: 'nexus:developer' }, { id: 'b', type: 'nexus:reviewer' }] });
  runHook(SCRIPT, { ...base, tasks: [{ id: 'a', type: 'nexus:developer' }] });
  const s = readState(root);
  assert.equal(s.tasks.length, 1);
  assert.equal(s.tasks[0].id, 'a');
});

test('heartbeat: empty tasks[] with a resolvable root drains to an empty snapshot (not skipped)', () => {
  const root = makeSandbox('nexus-fleet-');
  runHook(SCRIPT, { workspace: { project_dir: root }, tasks: [] });
  const s = readState(root);
  assert.deepEqual(s.tasks, []);
});

// Regression guard (adhoc-FleetHeartbeatFix): the real subagentStatusLine payload is hook-shaped
// — it carries top-level `cwd` from the base hook common-input-fields but NO `workspace` object.
// `workspace.project_dir` is the main statusLine field only. This test exercises the real shape
// so any future regression to workspace-only resolution is caught immediately.
test('heartbeat: hook-shaped payload (no workspace, cwd at top level) writes the snapshot', () => {
  const root = makeSandbox('nexus-fleet-');
  // Real subagent payload: base hook fields including cwd, no workspace object.
  const payload = {
    session_id: 'test-session',
    cwd: root,
    columns: 100,
    tasks: [
      { id: 'x1', type: 'nexus:developer', description: 'Impl step 3', status: 'in_progress',
        startTime: 1700000000000, tokenCount: 5000, cwd: '/subagent/work' },
    ],
  };
  runHook(SCRIPT, payload);
  const s = readState(root);
  assert.equal(typeof s.ts, 'string');
  assert.equal(s.columns, 100);
  assert.equal(s.tasks.length, 1);
  assert.equal(s.tasks[0].role, 'developer');
  assert.equal(s.tasks[0].id, 'x1');
  // tasks[].cwd is the per-subagent dir — must be normalized into the snapshot as-is, not used
  // as the audit root.
  assert.equal(s.tasks[0].cwd, '/subagent/work');
});

test('heartbeat: hook-shaped empty tasks[] via cwd drains to empty snapshot', () => {
  const root = makeSandbox('nexus-fleet-');
  runHook(SCRIPT, { cwd: root, tasks: [] });
  const s = readState(root);
  assert.deepEqual(s.tasks, []);
});

test('heartbeat: no root in the payload → no file written', () => {
  // Neither workspace.project_dir nor top-level cwd is present → resolveRoot returns null.
  const root = makeSandbox('nexus-fleet-');
  runHook(SCRIPT, { tasks: [{ id: 'a', type: 'nexus:developer' }] });
  assert.equal(existsSync(stateFile(root)), false);
});

test('heartbeat: malformed/empty stdin → no throw, no write, exit 0', () => {
  const root = makeSandbox('nexus-fleet-');
  for (const payload of ['{not valid json', '']) {
    // projectDir sets CLAUDE_PROJECT_DIR, which the script deliberately ignores (root comes only
    // from the payload's base-hook cwd or forward-compat workspace.project_dir). No file is written:
    // the env root is not a root source, and the payload never parses to yield cwd either.
    const { status } = runHook(SCRIPT, payload, { projectDir: root });
    assert.equal(status, 0);
  }
  assert.equal(existsSync(stateFile(root)), false);
});

test('heartbeat: row stdout is unaffected by the write present', () => {
  const root = makeSandbox('nexus-fleet-');
  const tasks = [{ id: 't1', type: 'nexus:architect', description: 'Plan F5', tokenCount: 4200 }];
  const withRoot = runHook(SCRIPT, { columns: 120, workspace: { project_dir: root }, tasks });
  const without = runHook(SCRIPT, { columns: 120, tasks });
  assert.equal(withRoot.stdout, without.stdout);
});
