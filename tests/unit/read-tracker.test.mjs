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
const STATE = (dir) => join(dir, '.claude', 'audit', 'read-tracker.json');
const DECAY_MS = 30 * 60 * 1000; // must mirror the hook's constant (ADR-61 part 4)

function read(dir, agentType, file, session = 'sess-rt') {
  const event = { session_id: session, tool_name: 'Read', tool_input: { file_path: file }, cwd: dir };
  if (agentType) event.agent_type = agentType;
  return runHook(TRACKER, event, { projectDir: dir });
}
function setToken(dir, token) {
  mkdirSync(join(dir, '.claude'), { recursive: true });
  writeFileSync(join(dir, '.claude', '.pipeline-state'), token);
}
// Seed / inspect the tracker state directly, so decay windows can be simulated without a real
// clock: the hook uses Date.now(), and ageing a stored lastTs into the past is how we cross the
// window deterministically. session:'sess-rt' + token:'' match the read() defaults, so the
// whole-round (session/token) reset does NOT fire — the decay path is what these exercise.
function writeState(dir, state) {
  mkdirSync(join(dir, '.claude', 'audit'), { recursive: true });
  writeFileSync(STATE(dir), JSON.stringify(state));
}
function readState(dir) {
  return JSON.parse(readFileSync(STATE(dir), 'utf8'));
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

// --- ADR-61 part 4: per-file round decay (30-min sliding window) ---

test('decay (a): repeat reads inside the window still nudge at x2 and log at x3', () => {
  const dir = makeSandbox();
  const f = 'docs/specs/F1/delivery/implementation.md';
  const r1 = read(dir, 'developer', f);
  assert.ok(!r1.json?.systemMessage, 'first read clean');
  const r2 = read(dir, 'developer', f); // consecutive → within the window
  assert.ok(r2.json?.systemMessage, 'second in-window read nudges (x2)');
  assert.ok(!existsSync(VLOG(dir)), 'x2 is a nudge, not yet a violation');
  const r3 = read(dir, 'developer', f);
  assert.ok(r3.json?.systemMessage, 'third in-window read still nudges');
  assert.ok(existsSync(VLOG(dir)), 'x3 logs a violation — the F16 tight-loop catch survives decay');
  const lines = readFileSync(VLOG(dir), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines.length, 1, 'exactly one violation line at x3');
});

test('decay (b): a repeat read with lastTs older than DECAY_MS resets — no nudge', () => {
  const dir = makeSandbox();
  const f = 'src/a.cs';
  const key = 'developer|src/a.cs';
  const stale = Date.now() - (DECAY_MS + 60 * 1000); // last read > 30 min ago
  writeState(dir, { session: 'sess-rt', token: '', counts: { [key]: [1, stale] } });
  const r = read(dir, 'developer', f);
  assert.ok(!r.json?.systemMessage, 'a read after the window elapsed resets the count — no nudge');
  const st = readState(dir);
  assert.equal(st.counts[key][0], 1, 'count reset to 1');
  assert.ok(st.counts[key][1] > stale, 'lastTs refreshed to now on the reset read (sliding window)');
});

test('decay (c): legacy numeric state (same session/token) is actively replaced, not merely tolerated', () => {
  const dir = makeSandbox();
  const f = 'src/legacy.cs';
  const key = 'developer|src/legacy.cs';
  // Pre-decay state file: a bare number, same session + token so the round reset does NOT fire.
  writeState(dir, { session: 'sess-rt', token: '', counts: { [key]: 4 } });
  const r1 = read(dir, 'developer', f);
  assert.ok(!r1.json?.systemMessage, 'the read carrying legacy numeric state resets to 1 — no nudge');
  assert.ok(!existsSync(VLOG(dir)), 'the legacy count (4) did NOT continue to 5 and log');
  const r2 = read(dir, 'developer', f); // next same-key read, within the window
  assert.ok(r2.json?.systemMessage, 'the next in-window read nudges at x2 — proves it reset to 1, not tolerated');
});

test('decay (d): spanning streak — per-gap < window but total span > window still reaches x3 and logs', () => {
  const dir = makeSandbox();
  const f = 'docs/specs/F1/delivery/plan.md';
  const key = 'architect|docs/specs/f1/delivery/plan.md';
  const near = () => Date.now() - (20 * 60 * 1000); // 20 min ago: inside the 30-min window
  // A streak already at n=1 whose previous read was 20 min ago.
  writeState(dir, { session: 'sess-rt', token: '', counts: { [key]: [1, near()] } });
  const r2 = read(dir, 'architect', f); // 2nd read, ~20 min after the 1st — within the sliding window
  assert.ok(r2.json?.systemMessage, 'x2 within the sliding window nudges');
  // Age the streak again to 20 min ago: span from read #1 is now ~40 min (> window), each gap < window.
  const st = readState(dir);
  st.counts[key] = [st.counts[key][0], near()];
  writeState(dir, st);
  const r3 = read(dir, 'architect', f); // 3rd read, another ~20 min gap — still within the window
  assert.ok(r3.json?.systemMessage, 'x3 still within the sliding window nudges');
  assert.ok(existsSync(VLOG(dir)), 'x3 logs — a fixed-from-first window would have reset before here');
  const lines = readFileSync(VLOG(dir), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines.length, 1, 'exactly one violation line at x3 across the spanning streak');
});
