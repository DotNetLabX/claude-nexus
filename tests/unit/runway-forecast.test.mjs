// runway-forecast.test.mjs — F7 S5: the marginal-budget rail's forward projection (TDD, sim-level).
//
// The reactive rail halts WHEN marginal spend exceeds the ceiling (report-on-halt, unchanged). S5 adds a
// FORWARD projection over the Step-4 journal's per-stage token accrual: it projects spent + projected-
// remaining vs budget and emits `forecast: over-budget at stage N` BEFORE the overrun, so the run gets a
// warning ahead of the halt. This suite drives the projection over fixture journal state.
import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastRunway, createJournal, startStage, completeStage } from '../../harness/lib/run-journal.mjs';

const STAGES = ['mine', 'consolidate-skeptic', 'cover', 'report'];

// A journal where the first `doneCount` stages are done, each costing `perStage` tokens.
function journalWithDone(doneCount, perStage) {
  let j = createJournal({ runId: 'r', script: 's.js', stages: STAGES, now: 't0', budget: { ceiling: 100000 } });
  for (let i = 0; i < doneCount; i++) {
    j = completeStage(startStage(j, STAGES[i], `t${i}a`), STAGES[i], { now: `t${i}b`, tokens: perStage });
  }
  return j;
}

test('a low budget emits the forecast line BEFORE the rail trips', () => {
  // Stages: 1 mine, 2 consolidate-skeptic, 3 cover, 4 report. 2 done at 30k each = 60k spent; the 30k
  // average projects the remaining stages: stage 3 → 90k (still under 100k), stage 4 → 120k (over).
  // So the projection first exceeds 100k AT stage 4, while spent (60k) is still UNDER budget — the forecast
  // fires BEFORE the actual overrun.
  const j = journalWithDone(2, 30000);
  const f = forecastRunway(j, { budget: 100000 });
  assert.equal(f.spent, 60000, 'realized spend is the sum of completed-stage tokens');
  assert.ok(f.spent < 100000, 'still under budget — the forecast fires BEFORE the overrun');
  assert.equal(f.projectedTotal, 120000, 'spent + avg×remaining = 60k + 30k×2');
  assert.equal(f.line, 'forecast: over-budget at stage 4', 'binding line shape names the crossing stage');
  assert.equal(f.overBudgetAtStage, 4, 'stage 4 (report) is the first stage whose projected cumulative exceeds budget');
});

test('a comfortable budget emits NO forecast line', () => {
  const j = journalWithDone(2, 30000); // projected total 120k
  const f = forecastRunway(j, { budget: 500000 });
  assert.equal(f.line, null, 'no forecast when the projection stays under budget');
  assert.equal(f.overBudgetAtStage, null);
  assert.equal(f.projectedTotal, 120000);
});

test('the crossing stage is the FIRST remaining stage whose projected cumulative exceeds budget', () => {
  // 1 done at 40k; 3 remaining at the 40k average → cumulative 80k, 120k, 160k. Budget 110k crosses at the
  // SECOND remaining stage = run stage index 3.
  const j = journalWithDone(1, 40000);
  const f = forecastRunway(j, { budget: 110000 });
  assert.equal(f.overBudgetAtStage, 3, 'cumulative crosses 110k at run stage 3 (second remaining stage)');
  assert.equal(f.line, 'forecast: over-budget at stage 3');
});

test('no completed stages (no basis to project) → no forecast, no throw', () => {
  const j = createJournal({ runId: 'r', script: 's.js', stages: STAGES, now: 't0' });
  const f = forecastRunway(j, { budget: 100000 });
  assert.equal(f.line, null);
  assert.equal(f.spent, 0);
});

test('all stages done → projectedTotal equals spent, no forecast (nothing left to overrun)', () => {
  const j = journalWithDone(4, 20000); // all 4 done = 80k, completed run
  const f = forecastRunway(j, { budget: 50000 });
  assert.equal(f.spent, 80000);
  assert.equal(f.projectedRemaining, 0, 'nothing remaining to project');
  assert.equal(f.line, null, 'a finished run does not forecast a future overrun (report-on-halt covers the realized spend)');
});
