// spec-diff-calc.test.mjs — the calculator analog of spec-diff.mjs's labelRed (adhoc-SddCoverageLoop, Step 2).
//
// Where spec-diff.mjs's labelRed classifies a VIOLATION-IDENTITY red against a fixed positional rule order
// (validator-shaped), spec-diff-calc.mjs classifies a VALUE red for a numeric calculator — the expected vs
// actual outcome differ per the rule's `expectedOutcome.kind` (boolean | numeric ± ε | streak-integer), with
// no rule-order surface to compare positions against. `diffRules`/`classifyRule` from spec-diff.mjs are reused
// UNCHANGED for the rule-set diff (they key by name + string boundary); tolerance is entirely this labeler's
// concern (plan Step 2).
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (selfcheck.mjs:44).
import test from 'node:test';
import assert from 'node:assert/strict';
import { outcomeMatches, labelOutcome } from '../../harness/lib/spec-diff-calc.mjs';

// =================================================================================================
// outcomeMatches — the redness determiner (kind-aware; numeric needs epsilon tolerance, not ===)
// =================================================================================================
test('outcomeMatches numeric: within epsilon is a match', () => {
  const r = outcomeMatches({ kind: 'numeric', expected: 33.33, actual: 33.330000001, epsilon: 1e-6 });
  assert.equal(r, true, 'a difference smaller than epsilon is a match');
});

test('outcomeMatches numeric: outside epsilon is NOT a match', () => {
  const r = outcomeMatches({ kind: 'numeric', expected: 33.33, actual: 33.5, epsilon: 1e-6 });
  assert.equal(r, false, 'a difference larger than epsilon is a mismatch');
});

test('outcomeMatches numeric: EXACTLY AT a non-zero epsilon boundary (diff === epsilon) is a match (<=, inclusive)', () => {
  // 10.5 - 10 === 0.5 exactly (both binary-exact floats) — a genuine boundary hit, not a near-miss.
  const r = outcomeMatches({ kind: 'numeric', expected: 10, actual: 10.5, epsilon: 0.5 });
  assert.equal(r, true, 'diff === epsilon must match — the comparison is <=, inclusive of the boundary');
});

test('outcomeMatches numeric: exact equality with epsilon 0 is a match', () => {
  const r = outcomeMatches({ kind: 'numeric', expected: 50, actual: 50, epsilon: 0 });
  assert.equal(r, true, 'identical values match even at epsilon 0');
});

test('outcomeMatches numeric: defaults epsilon to 1e-9 when omitted', () => {
  const r = outcomeMatches({ kind: 'numeric', expected: 50, actual: 50 + 1e-12 });
  assert.equal(r, true, 'a sub-1e-9 difference matches under the default epsilon');
  const mismatch = outcomeMatches({ kind: 'numeric', expected: 50, actual: 50.001 });
  assert.equal(mismatch, false, 'a 0.001 difference exceeds the default 1e-9 epsilon');
});

// =================================================================================================
// outcomeMatches — boolean and streak-integer kinds (exact equality, no epsilon)
// =================================================================================================
test('outcomeMatches boolean: true === true matches, true !== false does not', () => {
  assert.equal(outcomeMatches({ kind: 'boolean', expected: true, actual: true }), true);
  assert.equal(outcomeMatches({ kind: 'boolean', expected: true, actual: false }), false);
});

test('outcomeMatches streak-integer: exact equality only — no tolerance', () => {
  assert.equal(outcomeMatches({ kind: 'streak-integer', expected: 2, actual: 2 }), true);
  assert.equal(outcomeMatches({ kind: 'streak-integer', expected: 2, actual: 3 }), false, 'off-by-one is a mismatch — streaks never get an epsilon');
});

// =================================================================================================
// labelOutcome — classify a RED (case 5 analog: errored / fixture un-constructable)
// =================================================================================================
test('labelOutcome CASE errored — test errored / fixture un-constructable → needs-triage (not classifiable)', () => {
  const l = labelOutcome({ kind: 'numeric', expected: 50, actual: null, errored: true });
  assert.equal(l.label, 'errored');
  assert.equal(l.route, 'needs-triage');
  assert.match(l.detail, /not classifiable/);
});

// =================================================================================================
// labelOutcome — CASE code-missing (the field was never produced — sin-of-omission analog, case 3).
// Distinct from a legitimate falsy value (`false` / `0`) — code-missing is actual === null/undefined.
// =================================================================================================
test('labelOutcome CASE code-missing — actual is null (target field never produced) → sin-of-omission, candidate-bug', () => {
  const l = labelOutcome({ kind: 'boolean', expected: true, actual: null });
  assert.equal(l.label, 'code-missing');
  assert.equal(l.route, 'candidate-bug');
  assert.match(l.detail, /spec ∧ ¬code/);
});

test('labelOutcome CASE code-missing — actual undefined is ALSO code-missing (not a value-divergence)', () => {
  const l = labelOutcome({ kind: 'numeric', expected: 50, actual: undefined });
  assert.equal(l.label, 'code-missing');
});

test('labelOutcome: actual `false` (a real boolean value) is NOT code-missing — it is a value-divergence', () => {
  const l = labelOutcome({ kind: 'boolean', expected: true, actual: false });
  assert.equal(l.label, 'value-divergence', 'a legitimate falsy value must not be mistaken for code-missing');
});

test('labelOutcome: actual `0` (a real numeric/streak value) is NOT code-missing — it is a value-divergence', () => {
  const l = labelOutcome({ kind: 'streak-integer', expected: 2, actual: 0 });
  assert.equal(l.label, 'value-divergence', 'a legitimate zero value must not be mistaken for code-missing');
});

// =================================================================================================
// labelOutcome — direction annotation for numeric/streak-integer divergences (over/under), the
// value-assertion analog of labelRed's over-rejection/under-enforce direction (no rule-order needed —
// direction here is just actual vs expected magnitude comparison).
// =================================================================================================
test('labelOutcome numeric divergence: actual > expected → direction "over"', () => {
  const l = labelOutcome({ kind: 'numeric', expected: 33.33, actual: 40 });
  assert.equal(l.label, 'value-divergence');
  assert.equal(l.direction, 'over');
});

test('labelOutcome numeric divergence: actual < expected → direction "under"', () => {
  const l = labelOutcome({ kind: 'numeric', expected: 33.33, actual: 20 });
  assert.equal(l.direction, 'under');
});

test('labelOutcome streak-integer divergence: actual > expected → direction "over"; actual < expected → "under"', () => {
  assert.equal(labelOutcome({ kind: 'streak-integer', expected: 2, actual: 4 }).direction, 'over');
  assert.equal(labelOutcome({ kind: 'streak-integer', expected: 2, actual: 1 }).direction, 'under');
});

test('labelOutcome boolean divergence: no direction field (over/under is meaningless for a boolean)', () => {
  const l = labelOutcome({ kind: 'boolean', expected: true, actual: false });
  assert.equal(l.direction, undefined);
});
