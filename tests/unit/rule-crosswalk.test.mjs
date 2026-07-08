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
import { applyCrosswalk, reconcileRuleSets, crosswalkExpectations } from '../../harness/lib/rule-crosswalk.mjs';
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

// =================================================================================================
// adhoc-SddMergeFeedback item 2a: a crosswalk value may now be a `string` (canonical name, as today)
// OR an object `{canonical, expect?, staleSpec?}` carrying operator-declared metadata. applyCrosswalk
// resolves the canonical name from either shape; crosswalkExpectations surfaces the declarations
// (keyed by canonical name) for triageRuleSets (Step 3) to consult.
// =================================================================================================
test('applyCrosswalk: resolves the canonical name from an OBJECT-valued crosswalk entry (item 2a)', () => {
  const codeRules = [{ id: 'BR-2', boundary: '>0' }];
  const map = { 'BR-2': { canonical: 'BugRatioPercent', expect: 'divergent' } };
  const rewritten = applyCrosswalk(codeRules, map);
  assert.equal(rewritten[0].ruleName, 'BugRatioPercent', 'object-valued entry resolves ruleName from its `canonical` field');
});

test('applyCrosswalk: an OBJECT-valued entry missing `canonical` keeps the rule\'s existing ruleName (no undefined key) (LOW-3)', () => {
  const rules = [{ id: 'BR-3', ruleName: 'ExistingName' }];
  const map = { 'BR-3': { expect: 'divergent' } }; // object with NO canonical — defensive fallback
  const rewritten = applyCrosswalk(rules, map);
  assert.equal(rewritten[0].ruleName, 'ExistingName', 'a canonical-less object must not silently key by undefined — existing ruleName is kept');
});

test('crosswalkExpectations: builds a canonical-keyed declaration map from the OBJECT-valued entries only', () => {
  const map = {
    'BR-1': 'PlainName',                                        // string entry — no declaration
    'BR-2': { canonical: 'Divergent', expect: 'divergent' },
    'BR-3': { canonical: 'Overlap', expect: 'overlap' },
    'BR-4': { canonical: 'Stale', expect: 'divergent', staleSpec: true },
  };
  const exp = crosswalkExpectations(map);
  assert.deepEqual(exp.get('Divergent'), { expect: 'divergent' });
  assert.deepEqual(exp.get('Overlap'), { expect: 'overlap' });
  assert.deepEqual(exp.get('Stale'), { expect: 'divergent', staleSpec: true });
  assert.equal(exp.has('PlainName'), false, 'a string-valued (no-declaration) entry contributes nothing');
});

test('crosswalkExpectations: an all-string crosswalk yields an EMPTY expectations map (backward-compat)', () => {
  const map = { 'BR-1': 'A', 'BR-2': 'B', A: 'A', B: 'B' };
  const exp = crosswalkExpectations(map);
  assert.equal(exp.size, 0, 'no object-valued entries → no declared expectations → today\'s behavior preserved');
});

// adhoc-SddMergeFeedback fix-cycle 1 (Codex finding 2): two source aliases can map to the SAME canonical
// — one carrying a real declaration, a later one metadata-less (`{canonical:'X'}` → decl `{}`). The
// metadata-less object must NOT overwrite/clear the sibling's real declaration; an empty declaration is
// not stored at all, so the consumer sees it as absent and falls through to the boundary hint.
test('crosswalkExpectations: a metadata-less object aliasing the same canonical does NOT clear a sibling\'s real declaration (fix-cycle 1)', () => {
  const map = {
    'BR-2a': { canonical: 'X', expect: 'divergent' }, // real operator-declared divergence
    'BR-2b': { canonical: 'X' },                       // metadata-less alias to the SAME canonical
  };
  const exp = crosswalkExpectations(map);
  assert.deepEqual(exp.get('X'), { expect: 'divergent' }, 'the empty-decl object must not overwrite/clear the sibling\'s real declaration');
});

test('crosswalkExpectations: a canonical with ONLY a metadata-less object is absent — empty decl and absent entry both fall through to the boundary hint (fix-cycle 1)', () => {
  const map = { 'BR-5': { canonical: 'Y' } }; // object with a canonical but NO expect/staleSpec
  const exp = crosswalkExpectations(map);
  assert.equal(exp.has('Y'), false, 'an empty declaration is not stored — the consumer treats it identically to an absent entry (falls through to the boundary hint)');
});

test('applyCrosswalk: an all-string crosswalk resolves canonical names byte-identically to today (backward-compat)', () => {
  const codeRules = [{ id: 'BR-2', boundary: '>0' }, { id: 'BR-9', boundary: '>1' }];
  const map = { 'BR-2': 'BugRatioPercent' };
  const rewritten = applyCrosswalk(codeRules, map);
  assert.equal(rewritten[0].ruleName, 'BugRatioPercent', 'mapped string entry resolves as before');
  assert.equal(rewritten[1].ruleName, undefined, 'unmapped rule keeps its (absent) ruleName as before');
});
