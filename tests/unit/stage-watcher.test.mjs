// stage-watcher.test.mjs — F7 S2: mechanized stage/skeptic firing over the Step-4 journal (TDD, sim-level).
//
// The watcher advances a stalled stage or fires the cadence skeptic within a bounded interval and LOGS
// each firing. Its binding STATE SOURCE (critic MEDIUM-1) is the Step-4 run journal — an external watcher
// process cannot reach the Workflow in-session cache, so it polls journal stage/status/timestamps. This
// suite drives the PURE decision (`pollJournal`) over fixture journal state, exactly what the live watcher
// reads. The live Workflow missed-completion exercise is operator-owed (a subagent has no Workflow tool).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pollJournal, formatFiring } from '../../harness/lib/stage-watcher.mjs';
import { createJournal, startStage, completeStage } from '../../harness/lib/run-journal.mjs';

const WATCHER = fileURLToPath(new URL('../../harness/lib/stage-watcher.mjs', import.meta.url));

const STAGES = ['mine', 'consolidate-skeptic', 'cover'];
const STALL_MS = 5 * 60 * 1000; // 5 minutes

// A journal whose `stage` is running, started `agoMs` before `now`.
function runningAt(stage, startedAt) {
  let j = createJournal({ runId: 'r', script: 's.js', stages: STAGES, now: '2026-07-18T10:00:00Z' });
  // Mark prior stages done so `stage` is the active one.
  for (const s of STAGES) {
    if (s === stage) break;
    j = completeStage(startStage(j, s, startedAt), s, { now: startedAt, tokens: 100 });
  }
  return startStage(j, stage, startedAt);
}

test('a stage running LONGER than the stall interval → advance (no operator input)', () => {
  const j = runningAt('cover', '2026-07-18T10:00:00Z');
  const now = '2026-07-18T10:10:00Z'; // 10 min later, > 5 min stall
  const d = pollJournal(j, { now, stallMs: STALL_MS });
  assert.equal(d.action, 'advance');
  assert.equal(d.stage, 'cover');
  assert.ok(d.sinceMs >= STALL_MS, 'the stall duration is reported');
});

test('a stalled SKEPTIC stage → fire-skeptic (the cadence skeptic firing)', () => {
  const j = runningAt('consolidate-skeptic', '2026-07-18T10:00:00Z');
  const now = '2026-07-18T10:08:00Z';
  const d = pollJournal(j, { now, stallMs: STALL_MS, skepticStage: 'consolidate-skeptic' });
  assert.equal(d.action, 'fire-skeptic');
  assert.equal(d.stage, 'consolidate-skeptic');
});

test('a stage running WITHIN the stall interval → none (not yet stalled)', () => {
  const j = runningAt('cover', '2026-07-18T10:00:00Z');
  const now = '2026-07-18T10:03:00Z'; // 3 min < 5 min stall
  assert.equal(pollJournal(j, { now, stallMs: STALL_MS }).action, 'none');
});

test('a COMPLETED run is never fired on', () => {
  let j = createJournal({ runId: 'r', script: 's.js', stages: ['a'], now: 't0' });
  j = completeStage(startStage(j, 'a', 't1'), 'a', { now: 't2', tokens: 5 });
  assert.equal(j.status, 'completed');
  const d = pollJournal(j, { now: '2026-07-18T23:00:00Z', stallMs: STALL_MS });
  assert.equal(d.action, 'none');
});

test('formatFiring renders a loggable, stage-named line for a firing (each firing is logged)', () => {
  const j = runningAt('cover', '2026-07-18T10:00:00Z');
  const d = pollJournal(j, { now: '2026-07-18T10:10:00Z', stallMs: STALL_MS });
  const line = formatFiring(d, { runId: 'r' });
  assert.match(line, /advance/);
  assert.match(line, /cover/);
  assert.match(line, /\br\b/, 'names the runId for the operator log');
});

test('formatFiring on a none decision returns null (nothing to log)', () => {
  assert.equal(formatFiring({ action: 'none' }, { runId: 'r' }), null);
});

// --- CLI guard: a non-numeric stallMinutes fails loud, never a silent NaN watcher (reviewer LOW) --
test('the watch CLI rejects a non-numeric stallMinutes (exit 2), never silently never-fires', () => {
  let status = 0;
  try {
    execFileSync(process.execPath, [WATCHER, 'watch', 'nonexistent.journal.json', 'abc'], { stdio: 'pipe', timeout: 10000 });
  } catch (e) {
    status = e.status;
  }
  assert.equal(status, 2, 'invalid stallMinutes exits non-zero (2) BEFORE starting a NaN-threshold watcher');
});
