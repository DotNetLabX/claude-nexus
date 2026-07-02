// trace-join.test.mjs — the spec-rule → class(es) mapping helper (adhoc-SddCoverageLoop, Step 4).
//
// Answers "which class(es) implement this spec rule?" so the two blind arms (spec-mine, code-mine) compare on
// the same subject (tech-spec "The trace-join — the crux"). Three sources, in priority order:
//   1. plan-ref  — anchored on a slug's plan/impl `Satisfies:` file citation (the convention-guaranteed case).
//   2. manual    — a human-confirmed map entry (the BugRatio pilot's case: SR is a port, no plan chain).
//   3. locator   — the spec-cover guided-miner's rule→code locator, ~53-56% accurate (spec-diff.mjs:42) —
//                  FALLBACK ONLY, never silently trusted; low-confidence/no-match routes to a human queue.
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (selfcheck.mjs:44).
import test from 'node:test';
import assert from 'node:assert/strict';
import { traceRule } from '../../harness/lib/trace-join.mjs';

// =================================================================================================
// SOURCE 1 — plan-ref: a slug's plan/impl Satisfies: citation. Convention-guaranteed, trusted directly.
// =================================================================================================
test('traceRule: a planRef citation is accepted as source "plan-ref" with full confidence', () => {
  const r = traceRule({ ruleId: 'SR-1', planRef: { classes: ['BugRatioAnalyzer'], step: 3, file: 'plan.md' } });
  assert.equal(r.source, 'plan-ref');
  assert.deepEqual(r.classes, ['BugRatioAnalyzer']);
  assert.equal(r.route, 'accepted');
  assert.equal(r.confidence, 1);
});

// =================================================================================================
// SOURCE 2 — manual: a human-confirmed map entry (the BugRatio pilot case — SR is a port, no plan chain).
// =================================================================================================
test('traceRule: a manualEntry is accepted as source "manual" with full confidence (no planRef present)', () => {
  const r = traceRule({ ruleId: 'SR-2', manualEntry: { classes: ['BugRatioAnalyzer'], note: 'GOLD-17 pilot map — SR port, no plan chain' } });
  assert.equal(r.source, 'manual');
  assert.deepEqual(r.classes, ['BugRatioAnalyzer']);
  assert.equal(r.route, 'accepted');
  assert.equal(r.confidence, 1);
});

test('traceRule: planRef wins over manualEntry when BOTH are present (priority order)', () => {
  const r = traceRule({
    ruleId: 'SR-1',
    planRef: { classes: ['FromPlan'] },
    manualEntry: { classes: ['FromManual'] },
  });
  assert.equal(r.source, 'plan-ref');
  assert.deepEqual(r.classes, ['FromPlan']);
});

// =================================================================================================
// SOURCE 3 — locator: the spec-cover guided-miner fallback (~53-56% accurate). FALLBACK ONLY — gated
// by confidence, never silently trusted (tech-spec AC-3 / ADR-B).
// =================================================================================================
test('traceRule: a locatorResult ABOVE the confidence threshold is accepted as source "locator"', () => {
  const r = traceRule({ ruleId: 'SR-3', locatorResult: { classes: ['BugRatioAnalyzer'], confidence: 0.8 } });
  assert.equal(r.source, 'locator');
  assert.deepEqual(r.classes, ['BugRatioAnalyzer']);
  assert.equal(r.route, 'accepted');
  assert.equal(r.confidence, 0.8);
});

test('traceRule: a locatorResult EXACTLY AT the confidence threshold is accepted (>=, inclusive boundary)', () => {
  // Default threshold is 0.6 — confidence === 0.6 exactly must still be accepted, not routed to human-queue.
  const r = traceRule({ ruleId: 'SR-3', locatorResult: { classes: ['BugRatioAnalyzer'], confidence: 0.6 } });
  assert.equal(r.route, 'accepted', 'confidence === threshold must be accepted — the comparison is >=, inclusive of the boundary');
  assert.equal(r.source, 'locator');
  assert.equal(r.confidence, 0.6);
});

test('traceRule: manualEntry wins over locatorResult when BOTH are present (priority order)', () => {
  const r = traceRule({
    ruleId: 'SR-3',
    manualEntry: { classes: ['FromManual'] },
    locatorResult: { classes: ['FromLocator'], confidence: 0.9 },
  });
  assert.equal(r.source, 'manual');
  assert.deepEqual(r.classes, ['FromManual']);
});

// =================================================================================================
// human-queue routing — low-confidence and no-match cases are NEVER auto-accepted (AC-3 / ADR-B).
// =================================================================================================
test('traceRule: a locatorResult BELOW the confidence threshold routes to "human-queue" — the guess is recorded, not silently accepted', () => {
  const r = traceRule({ ruleId: 'SR-4', locatorResult: { classes: ['MaybeBugRatioAnalyzer'], confidence: 0.53 } });
  assert.equal(r.source, 'locator');
  assert.equal(r.route, 'human-queue', 'below the default 0.6 threshold — never auto-accepted');
  assert.deepEqual(r.classes, ['MaybeBugRatioAnalyzer'], 'the low-confidence guess is still RECORDED for triage, not discarded');
});

test('traceRule: a custom confidenceThreshold is honored', () => {
  const r = traceRule({ ruleId: 'SR-4', locatorResult: { classes: ['X'], confidence: 0.7 }, confidenceThreshold: 0.9 });
  assert.equal(r.route, 'human-queue', '0.7 < the custom 0.9 threshold');
});

test('traceRule: a locatorResult with NO-CODE-FOUND (empty classes) routes to "human-queue"', () => {
  const r = traceRule({ ruleId: 'SR-4', locatorResult: { classes: [], confidence: 0.9 } });
  assert.equal(r.route, 'human-queue', 'no classes found, regardless of confidence — nothing to accept');
});

test('traceRule: no planRef, no manualEntry, no locatorResult at all → "human-queue" with source "none"', () => {
  const r = traceRule({ ruleId: 'SR-4' });
  assert.equal(r.source, 'none');
  assert.equal(r.route, 'human-queue');
  assert.deepEqual(r.classes, []);
  assert.equal(r.confidence, 0);
});
