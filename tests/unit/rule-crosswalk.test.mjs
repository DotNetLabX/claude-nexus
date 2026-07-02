// rule-crosswalk.test.mjs — the rule-identity reconciliation crosswalk (adhoc-SddCoverageLoop, Step 7).
//
// THE FIX FOR THE EMPTY-INTERSECTION GAP (plan Step 7, HIGH finding #2 from the plan review): spec-diff.mjs's
// classifyRule matches by rule NAME, but the two blind arms emit DIFFERENT identities — the code arm's
// autonomous `BR-1, BR-2…` (no ruleName), the spec arm's authored names (`BugRatioPercent`, ...). Without
// reconciliation, `both-agree` is empty BY CONSTRUCTION and `code∧¬spec` is falsely inflated. This helper
// rewrites both rule sets' `ruleName` from a canonical-name crosswalk map — applied ONLY AFTER both arms run
// (a pure, post-hoc transform; the map is NEVER in either arm's input manifest — Step 5 — preserving AC-1
// blindness).
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (selfcheck.mjs:44).
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCrosswalk, reconcileRuleSets } from '../../harness/lib/rule-crosswalk.mjs';
import { diffRules } from '../../harness/lib/spec-diff.mjs';

// =================================================================================================
// applyCrosswalk — rewrite ONE rule set's ruleName via the canonical-name map. PURE.
// =================================================================================================
test('applyCrosswalk: rewrites the code arm\'s autonomous BR-N id to the canonical name', () => {
  const codeRules = [{ id: 'BR-2', boundary: '>0' }];
  const map = { 'BR-2': 'BugRatioPercent' };
  const rewritten = applyCrosswalk(codeRules, map);
  assert.equal(rewritten[0].ruleName, 'BugRatioPercent');
});

test('applyCrosswalk: a rule with NO map entry (neither id nor ruleName) passes through unchanged — no correspondence found, never a crash', () => {
  const rules = [{ id: 'BR-99', ruleName: undefined }];
  const rewritten = applyCrosswalk(rules, { 'BR-2': 'BugRatioPercent' });
  assert.equal(rewritten[0].ruleName, undefined, 'unmapped rule keeps its existing (absent) ruleName — it will land in an unmatched diff bucket, not crash');
});

test('applyCrosswalk: re-canonicalizes an ALREADY-named spec-arm rule via its existing ruleName key', () => {
  const specRules = [{ id: 'SR-2', ruleName: 'BugRatioPercent' }];
  // The human confirms the spec arm's own authored name IS the canonical spelling — identity mapping.
  const map = { BugRatioPercent: 'BugRatioPercent', 'BR-2': 'BugRatioPercent' };
  const rewritten = applyCrosswalk(specRules, map);
  assert.equal(rewritten[0].ruleName, 'BugRatioPercent');
});

test('applyCrosswalk is a PURE transform: does not mutate the input array or its rule objects', () => {
  const original = [{ id: 'BR-2', boundary: '>0' }];
  const snapshot = structuredClone(original); // preserves shape exactly (JSON round-trip drops `undefined` keys)
  applyCrosswalk(original, { 'BR-2': 'BugRatioPercent' });
  assert.deepEqual(original, snapshot, 'the input array/objects must be untouched — a new array of new objects is returned');
});

// =================================================================================================
// reconcileRuleSets — align BOTH differently-keyed rule sets to canonical names in one call.
// =================================================================================================
test('reconcileRuleSets: rewrites BOTH the spec and code rule sets via the same crosswalk map', () => {
  const specRules = [{ id: 'SR-2', ruleName: 'BugRatioPercent', boundary: '>0' }];
  const codeRules = [{ id: 'BR-2', boundary: '>0' }];
  const map = { 'BR-2': 'BugRatioPercent', BugRatioPercent: 'BugRatioPercent' };
  const { specRules: s, codeRules: c } = reconcileRuleSets({ specRules, codeRules, crosswalkMap: map });
  assert.equal(s[0].ruleName, 'BugRatioPercent');
  assert.equal(c[0].ruleName, 'BugRatioPercent');
});

// =================================================================================================
// THE FIX, PROVEN END-TO-END: before reconciliation, diffRules (spec-diff.mjs, UNCHANGED) produces an
// EMPTY both-agree by construction (different id spaces never collide). After reconciliation, the SAME
// diffRules call produces a NON-EMPTY both-agree — this is the empty-intersection gap fix (plan Step 7,
// HIGH finding #2).
// =================================================================================================
test('THE FIX: diffRules on UN-reconciled rule sets produces an EMPTY both-agree (the gap this step closes)', () => {
  const specRules = [{ id: 'SR-2', ruleName: 'BugRatioPercent', boundary: '>0' }];
  const codeRules = [{ id: 'BR-2', boundary: '>0' }]; // no ruleName — ruleKey falls back to id "BR-2"
  const diff = diffRules(specRules, codeRules);
  assert.equal(diff.bothAgree.length, 0, 'different id spaces (BugRatioPercent vs BR-2) never collide — empty by construction');
});

test('THE FIX: diffRules on RECONCILED rule sets produces a NON-EMPTY both-agree (the crosswalk applied)', () => {
  const specRules = [{ id: 'SR-2', ruleName: 'BugRatioPercent', boundary: '>0' }];
  const codeRules = [{ id: 'BR-2', boundary: '>0' }];
  const map = { 'BR-2': 'BugRatioPercent', BugRatioPercent: 'BugRatioPercent' };
  const { specRules: s, codeRules: c } = reconcileRuleSets({ specRules, codeRules, crosswalkMap: map });
  const diff = diffRules(s, c);
  assert.equal(diff.bothAgree.length, 1, 'after the crosswalk, both sides carry ruleName "BugRatioPercent" — classifyRule matches them');
  assert.equal(diff.bothAgree[0].ruleName, 'BugRatioPercent');
});
