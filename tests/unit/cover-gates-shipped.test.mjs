// cover-gates-shipped.test.mjs — F7 S1.1: the SHIPPED gate battery is importable and TARGET-AGNOSTIC.
//
// The dev-repo shim (harness/lib/cover-gates.mjs) is already covered by cover-gates.test.mjs. This suite
// pins the SHIPPED artifact directly — the file a consuming repo invokes in place (ADR-62). Its binding
// property is that it ships ZERO per-class data: no EXPECTED_SURVIVOR_LINES export, and mutationFloor with
// no opts.expectedSurvivorLines excludes NOTHING (a fresh class must not inherit the pilot's dead lines).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as shipped from '../../plugins/nexus/skills/mine-verify-cover/tools/cover-gates.mjs';

const {
  suiteGreen, noFlaky, mutationFloor, targetMutated, noNewSkips, charPin, mutationRatchet,
} = shipped;

test('the shipped file exports the seven binding gate names', () => {
  for (const name of ['suiteGreen', 'noFlaky', 'mutationFloor', 'targetMutated', 'noNewSkips', 'charPin', 'mutationRatchet']) {
    assert.equal(typeof shipped[name], 'function', `${name} must be a shipped export`);
  }
});

test('the shipped file exports NO analyzer-specific data (target-agnostic invariant)', () => {
  // The pilot's dead-line set (EXPECTED_SURVIVOR_LINES) stays in the dev-repo shim ONLY — a shipped default
  // would silently exclude those lines for every consuming class (fake-green). It must be absent here.
  assert.equal(shipped.EXPECTED_SURVIVOR_LINES, undefined, 'no baked-in expected-survivor set ships');
  assert.equal(Object.keys(shipped).includes('EXPECTED_SURVIVOR_LINES'), false);
});

const SRC = 'X:\\repo\\src\\SomeAnalyzer.cs';
function mut(status, line) {
  return { status, location: { start: { line, column: 1 }, end: { line, column: 9 } } };
}

test('mutationFloor with NO expectedSurvivorLines opt excludes nothing (no inherited dead lines)', () => {
  // A survivor on line 17 — a pilot dead line — must be COUNTED for any other class, because the shipped
  // battery carries no default. 8 killed + 1 survivor-on-17 = 9 reachable, expectedSurvivorsExcluded === 0.
  const report = {
    schemaVersion: '2',
    files: {
      [SRC]: {
        language: 'cs',
        mutants: [
          ...[1, 2, 3, 4, 5, 6, 7, 8].map((l) => mut('Killed', l * 10)),
          mut('Survived', 17),
        ],
      },
    },
  };
  const res = mutationFloor(report, SRC, { floor: 75 });
  assert.equal(res.detail.expectedSurvivorsExcluded, 0, 'no dead line is excluded without a caller-supplied set');
  assert.equal(res.detail.reachableDenominator, 9, 'the line-17 survivor is counted, not silently excluded');
  assert.equal(res.detail.scorePct, 89, '8/9 = 88.9 → 89%');
});

test('mutationFloor still honors a CALLER-supplied expectedSurvivorLines set', () => {
  // The exclusion mechanism is intact — it is just caller input, not a shipped default.
  const report = {
    schemaVersion: '2',
    files: { [SRC]: { language: 'cs', mutants: [mut('Killed', 10), mut('Killed', 20), mut('Survived', 99)] } },
  };
  const res = mutationFloor(report, SRC, { floor: 75, expectedSurvivorLines: [99] });
  assert.equal(res.detail.expectedSurvivorsExcluded, 1, 'the caller-supplied dead line IS excluded');
  assert.equal(res.detail.reachableDenominator, 2, '2/2 reachable once the caller dead line is dropped');
  assert.equal(res.pass, true);
});

test('the shipped gates behave identically to the battery contract (smoke)', () => {
  assert.equal(suiteGreen([{ passed: 5, failed: 0, skipped: 0 }, { passed: 5, failed: 0, skipped: 0 }]).pass, true);
  assert.equal(noFlaky([{ passed: 5, failed: 0, skipped: 0 }, { passed: 4, failed: 1, skipped: 0 }]).pass, false);
  assert.equal(targetMutated([{ file: 'SomeAnalyzer.cs', count: 12 }], SRC).pass, true);
  assert.equal(noNewSkips([{ skipped: 0 }, { skipped: 0 }], 0).pass, true);
  assert.equal(charPin('').pass, true);
  assert.equal(mutationRatchet(88, 75).pass, false, 'a regression halts');
});
