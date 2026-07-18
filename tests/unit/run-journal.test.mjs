// run-journal.test.mjs — F7 S3: per-run journal + idempotent cross-session reconcile (TDD).
//
// The journal is the wave's shared run-state substrate (Step 4): Step 5's watcher polls its stage
// status/timestamps to detect stalls, Step 7 accrues realized tokens per completed stage into it. It is
// a per-run file under the runs dir, layered over the Workflow tool's same-session agent()-cache. This
// suite pins the PURE logic — build, stage transitions, and the reconcile decision (resume / complete-tail
// / none) with the binding idempotency invariant: a double-reconcile is a no-op.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createJournal, startStage, completeStage, reconcile, serializeJournal, parseJournal,
} from '../../harness/lib/run-journal.mjs';

const STAGES = ['mine', 'consolidate-skeptic', 'cover'];

test('createJournal builds pending stages and a running status', () => {
  const j = createJournal({ runId: 'run-1', script: 'cover.workflow.js', stages: STAGES, now: '2026-07-18T10:00:00Z' });
  assert.equal(j.runId, 'run-1');
  assert.equal(j.status, 'running');
  assert.deepEqual(j.stages.map((s) => s.name), STAGES);
  assert.ok(j.stages.every((s) => s.status === 'pending'), 'all stages start pending');
  assert.equal(j.createdAt, '2026-07-18T10:00:00Z');
});

test('startStage / completeStage transition status, stamp timestamps, and accrue tokens', () => {
  let j = createJournal({ runId: 'run-1', script: 's.js', stages: STAGES, now: 't0' });
  j = startStage(j, 'mine', 't1');
  assert.equal(j.stages.find((s) => s.name === 'mine').status, 'running');
  assert.equal(j.stages.find((s) => s.name === 'mine').startedAt, 't1');
  j = completeStage(j, 'mine', { now: 't2', tokens: 1500 });
  const mine = j.stages.find((s) => s.name === 'mine');
  assert.equal(mine.status, 'done');
  assert.equal(mine.endedAt, 't2');
  assert.equal(mine.tokens, 1500, 'per-stage token accrual (Step-7 substrate) is recorded on the journal');
});

test('completing the LAST stage flips the run status to completed', () => {
  let j = createJournal({ runId: 'r', script: 's.js', stages: ['a', 'b'], now: 't0' });
  j = completeStage(startStage(j, 'a', 't1'), 'a', { now: 't2', tokens: 10 });
  assert.equal(j.status, 'running', 'still running with a pending stage left');
  j = completeStage(startStage(j, 'b', 't3'), 'b', { now: 't4', tokens: 20 });
  assert.equal(j.status, 'completed', 'all stages done → completed');
  assert.equal(j.completedAt, 't4');
});

// --- reconcile: killed mid-run → resume plan -----------------------------------------------------
test('reconcile of a killed-mid-run journal returns a resume plan from the first non-done stage', () => {
  // mine done; consolidate-skeptic was RUNNING when the run was killed; cover never started.
  let j = createJournal({ runId: 'run-1', script: 'cover.workflow.js', stages: STAGES, now: 't0' });
  j = completeStage(startStage(j, 'mine', 't1'), 'mine', { now: 't2', tokens: 1000 });
  j = startStage(j, 'consolidate-skeptic', 't3'); // dangling running — the kill point
  const r = reconcile(j, 'tNow');
  assert.equal(r.action, 'resume');
  assert.equal(r.resumeFromStage, 'consolidate-skeptic', 'resume from the stage that was mid-flight');
  assert.equal(r.journal.stages.find((s) => s.name === 'consolidate-skeptic').status, 'pending',
    'the dangling running stage is reset to pending so the resumed run re-executes it');
  assert.equal(r.journal.stages.find((s) => s.name === 'mine').status, 'done', 'completed stages stay done (agent() cache replays them)');
});

// --- reconcile: all stages done but not finalized → complete-tail --------------------------------
test('reconcile of an all-done-but-not-finalized journal completes the tail', () => {
  let j = createJournal({ runId: 'r', script: 's.js', stages: ['a'], now: 't0' });
  // Stage a is done, but imagine the finalization (status flip) never got written.
  j = completeStage(startStage(j, 'a', 't1'), 'a', { now: 't2', tokens: 5 });
  j = { ...j, status: 'running', completedAt: undefined }; // simulate an unwritten completion tail
  const r = reconcile(j, 'tNow');
  assert.equal(r.action, 'complete-tail');
  assert.equal(r.journal.status, 'completed');
});

// --- reconcile: already completed → none ---------------------------------------------------------
test('reconcile of a completed journal is a no-op (action none, journal unchanged)', () => {
  let j = createJournal({ runId: 'r', script: 's.js', stages: ['a'], now: 't0' });
  j = completeStage(startStage(j, 'a', 't1'), 'a', { now: 't2', tokens: 5 });
  assert.equal(j.status, 'completed');
  const r = reconcile(j, 'tNow');
  assert.equal(r.action, 'none');
  assert.deepEqual(r.journal, j, 'a completed journal is returned unchanged');
});

// --- BINDING: double-reconcile is a no-op (idempotency) ------------------------------------------
test('double-reconcile is a no-op — resume case: second reconcile yields the identical decision + journal', () => {
  let j = createJournal({ runId: 'run-1', script: 's.js', stages: STAGES, now: 't0' });
  j = completeStage(startStage(j, 'mine', 't1'), 'mine', { now: 't2', tokens: 1000 });
  j = startStage(j, 'consolidate-skeptic', 't3');
  const r1 = reconcile(j, 'tNow');
  const r2 = reconcile(r1.journal, 'tLater'); // reconcile AGAIN on the reconciled journal
  assert.equal(r2.action, 'resume');
  assert.equal(r2.resumeFromStage, r1.resumeFromStage);
  assert.deepEqual(r2.journal, r1.journal, 'no state drift across a second reconcile (idempotent)');
});

test('double-reconcile is a no-op — complete-tail case: the second reconcile is a plain none', () => {
  let j = createJournal({ runId: 'r', script: 's.js', stages: ['a'], now: 't0' });
  j = completeStage(startStage(j, 'a', 't1'), 'a', { now: 't2', tokens: 5 });
  j = { ...j, status: 'running', completedAt: undefined };
  const r1 = reconcile(j, 'tNow');
  const r2 = reconcile(r1.journal, 'tLater');
  assert.equal(r1.action, 'complete-tail');
  assert.equal(r2.action, 'none', 'the tail is completed once; a second reconcile does nothing');
  assert.deepEqual(r2.journal, r1.journal);
});

// --- serialize / parse round trip ----------------------------------------------------------------
test('serializeJournal / parseJournal round-trips the journal exactly', () => {
  let j = createJournal({ runId: 'run-1', script: 's.js', stages: STAGES, now: 't0', budget: { ceiling: 50000 } });
  j = completeStage(startStage(j, 'mine', 't1'), 'mine', { now: 't2', tokens: 1000 });
  const round = parseJournal(serializeJournal(j));
  assert.deepEqual(round, j, 'a render → parse round trip recovers the journal');
});
