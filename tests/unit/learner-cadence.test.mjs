// learner-cadence.test.mjs — AC-1 for the learner-cadence nudge (adhoc-LearnerCadenceNudge, Step 1, TDD).
//
// Tests the PURE decision function `computeNudge(summaryMtimes, stampMtime|null, now)` — no I/O, no
// clock read, so the four cases stay filesystem-free (plan Step 1). The I/O main that globs the
// summaries, reads the stamp, and wraps the line in the systemMessage envelope is exercised by the
// AC-4 dry-fire (manual), not here. Runs inside the CI glob `node --test tests/unit/*.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeNudge, THRESHOLD } from '../../plugins/nexus/hooks/scripts/learner-cadence.js';

const DAY = 86_400_000;
const STAMP = Date.parse('2026-06-30T00:00:00Z'); // last consolidation
const NOW = Date.parse('2026-07-10T00:00:00Z');

// n summary mtimes, each strictly newer than the stamp.
const newer = (n) => Array.from({ length: n }, (_, i) => STAMP + (i + 1) * DAY);

// ── ≥ threshold newer → the nudge line, with the count and the stamp's ISO date ──
test('computeNudge fires the nudge line when >= threshold summaries are newer than the stamp', () => {
  const line = computeNudge(newer(6), STAMP, NOW);
  assert.equal(
    line,
    "Learner cadence: 6 slugs closed since the last learner consolidation (2026-06-30) — consider 'be learner'.",
  );
});

// ── below threshold → empty string; summaries older than the stamp do not count ──
test('computeNudge is silent (empty string) below the threshold', () => {
  assert.equal(computeNudge(newer(4), STAMP, NOW), '', '4 newer < 5 → silent');
  const mixed = [...newer(3), STAMP - DAY, STAMP - 2 * DAY]; // 3 newer + 2 older
  assert.equal(computeNudge(mixed, STAMP, NOW), '', 'only summaries newer than the stamp count → 3 < 5 → silent');
});

// ── null stamp (never consolidated) → count ALL summaries, date reads "never" ──
test('computeNudge counts ALL summaries and says "never" when the stamp is missing (null)', () => {
  const all = [STAMP - 5 * DAY, STAMP - DAY, STAMP + DAY, STAMP + 2 * DAY, STAMP + 3 * DAY]; // 5 total, mixed ages
  const line = computeNudge(all, null, NOW);
  assert.equal(
    line,
    "Learner cadence: 5 slugs closed since the last learner consolidation (never) — consider 'be learner'.",
  );
});

// ── exact-threshold boundary: 5 fires, 4 is silent ──
test('threshold boundary: exactly 5 newer fires, 4 newer is silent', () => {
  assert.notEqual(computeNudge(newer(5), STAMP, NOW), '', '5 newer == threshold → fires');
  assert.equal(computeNudge(newer(4), STAMP, NOW), '', '4 newer < threshold → silent');
  assert.equal(THRESHOLD, 5, 'the threshold constant is 5');
});
