// spec-diff.test.mjs — pure helpers for the spec-driven Cover front-end (adhoc-SpecDrivenHarnessBuild).
//
// The spec-driven direction (ADR-A/B/C/D) inverts the code-derived harness's assumptions: a red-on-current
// test is the PRIMARY output (a candidate bug), not a gate failure. These helpers are the DETERMINISTIC,
// pure, unit-tested core — the ORCHESTRATOR (spec-cover.workflow.js) computes them; no agent self-reports.
// They are the `cover-gates.mjs` shape: pure fns + this exhaustive offline test, no LLM, no .NET. The
// workflow inlines them verbatim (the Workflow runtime can't import) — same pattern as cover-gates.mjs ↔
// cover.workflow.js.
//
//   decideLocation(rule)                — Step 2: rule→code location seam (attestation-first / miner-needed)
//   classifyRule(specRule, codeRules)   — Step 4: the three-axis diff
//   labelRed({expected, actual, ruleOrder}) — Step 5: the deterministic 5-case FP-labeler
//   RULE_ORDER                          — the validator's fixed 7-rule positional firing order
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (selfcheck.mjs:44).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  decideLocation,
  evaluateMinerResult,
  classifyRule,
  diffRules,
  labelRed,
  RULE_ORDER,
} from '../../harness/lib/spec-diff.mjs';

// The pinned L272 known-answer fixture (Step 7 / AC-6 → Step 4 in Inc-2). Loaded from the committed
// nexus-side file so the known-answer is a single source of truth shared with the operator's live two-arm run.
const L272_FIXTURE = JSON.parse(
  readFileSync(new URL('../../harness/targets/generatedsqlvalidator-l272-fixture.json', import.meta.url), 'utf8'),
);

// The SQL target config — the source of truth for the SQL ruleOrder (AC-1(a): asserted below against RULE_ORDER).
const SQL_TARGET = JSON.parse(
  readFileSync(new URL('../../harness/targets/generatedsqlvalidator.json', import.meta.url), 'utf8'),
);

// Slack ruleOrder (GOLD-18 precedence: first-violation-wins, 5 values; pass sentinel = "Valid").
// Used by the okValue tests below (AC-2) — asserts that labelRed handles a non-null pass sentinel.
const SLACK_RULE_ORDER = [
  'MissingSecret',
  'MissingSignature',
  'MissingOrInvalidTimestamp',
  'TimestampOutOfRange',
  'InvalidSignature',
];

// =================================================================================================
// Step 2 — decideLocation: rule→code location seam (D1 / AC-2)
// =================================================================================================
// Attestation-first: a rule that carries a `codeAttestation` (the golden `file:line` column) uses it
// directly; a rule with no attestation flags `miner-needed` so the workflow runs the guided-miner agent.
// `NO-CODE-FOUND` from the miner is NOT an error — it is the first candidate sin-of-omission, recorded as
// such. A miner-returned `file:line` whose code does NOT contain the rule routes to `needs-triage` (the
// location-correctness caveat, AC-2) — not a silent mis-anchor.

test('decideLocation uses the code attestation when present (attestation-first)', () => {
  const res = decideLocation({ id: 'GOLD-08', statement: 'stray literal threshold', codeAttestation: 'GeneratedSqlValidator.cs:260-277' });
  assert.equal(res.source, 'attestation');
  assert.equal(res.location, 'GeneratedSqlValidator.cs:260-277');
  assert.equal(res.route, 'located');
});

test('decideLocation flags miner-needed when no attestation is present (miner-fallback)', () => {
  const res = decideLocation({ id: 'GOLD-XX', statement: 'a rule with no code attestation' });
  assert.equal(res.source, 'miner');
  assert.equal(res.location, null);
  assert.equal(res.route, 'miner-needed');
});

test('decideLocation treats a blank/whitespace attestation as miner-needed (not a located anchor)', () => {
  assert.equal(decideLocation({ id: 'G', codeAttestation: '' }).route, 'miner-needed');
  assert.equal(decideLocation({ id: 'G', codeAttestation: '   ' }).route, 'miner-needed');
});

// evaluateMinerResult — the second half of the seam: classify what the guided miner returned. The miner
// agent returns either a `file:line` OR the literal `NO-CODE-FOUND`. This pure fn decides the route.
test('evaluateMinerResult routes NO-CODE-FOUND to code-missing (the first candidate sin-of-omission, not an error)', () => {
  const res = evaluateMinerResult({ minerLocation: 'NO-CODE-FOUND', codeContainsRule: false });
  assert.equal(res.route, 'code-missing');
  assert.equal(res.location, null);
  assert.equal(res.isError, false, 'NO-CODE-FOUND is a candidate finding, never an error');
});

test('evaluateMinerResult accepts a miner file:line whose code DOES contain the rule (located)', () => {
  const res = evaluateMinerResult({ minerLocation: 'GeneratedSqlValidator.cs:260', codeContainsRule: true });
  assert.equal(res.route, 'located');
  assert.equal(res.location, 'GeneratedSqlValidator.cs:260');
});

test('evaluateMinerResult routes a miner file:line whose code does NOT contain the rule to needs-triage (AC-2 mis-anchor caveat, not a silent mis-anchor)', () => {
  const res = evaluateMinerResult({ minerLocation: 'GeneratedSqlValidator.cs:999', codeContainsRule: false });
  assert.equal(res.route, 'needs-triage');
  assert.equal(res.label, 'miner-mislocation');
});

// =================================================================================================
// Step 4 — classifyRule + diffRules: the three-axis diff (ADR-B / AC-4)
// =================================================================================================
// Exactly one of: `spec ∧ ¬code` (missing feature — headline), `code ∧ ¬spec` (undocumented behavior /
// enshrined bug), `both-divergent` (boundary disagreement). Rules match by NAME (the Q6 caveat — key off
// the rule name, never a GOLD-id ordinal). `both` with the same boundary is NOT a divergence (it agrees);
// only a boundary mismatch is `both-divergent`. classifyRule handles ONE spec rule vs the code-rule set;
// diffRules runs both directions and guarantees every rule lands in exactly one axis.

test('classifyRule → spec ∧ ¬code when the spec rule has no matching code rule (missing feature)', () => {
  const res = classifyRule({ id: 'GOLD-XX', ruleName: 'RowLimitWrap' }, [{ ruleName: 'SingleSelect' }]);
  assert.equal(res.axis, 'spec-not-code');
});

test('classifyRule → both-divergent when the rule matches by name but boundaries disagree', () => {
  const res = classifyRule(
    { id: 'GOLD-08', ruleName: 'NoStrayLiteralThreshold', boundary: '> 0.01' },
    [{ ruleName: 'NoStrayLiteralThreshold', boundary: '> 0.01 + 1e-9' }],
  );
  assert.equal(res.axis, 'both-divergent');
});

test('classifyRule → both-agree (NOT divergent) when name AND boundary match', () => {
  const res = classifyRule(
    { id: 'GOLD-01', ruleName: 'SingleSelect', boundary: 'first-violation-wins' },
    [{ ruleName: 'SingleSelect', boundary: 'first-violation-wins' }],
  );
  assert.equal(res.axis, 'both-agree');
});

test('diffRules classifies EVERY rule into exactly one axis (no rule unclassified, none double-counted) — AC-4', () => {
  const specRules = [
    { id: 'GOLD-01', ruleName: 'SingleSelect', boundary: 'first-violation-wins' },        // both-agree
    { id: 'GOLD-08', ruleName: 'NoStrayLiteralThreshold', boundary: '> 0.01' },           // both-divergent
    { id: 'GOLD-XX', ruleName: 'RowLimitWrap' },                                           // spec-not-code (F10-deferred)
  ];
  const codeRules = [
    { ruleName: 'SingleSelect', boundary: 'first-violation-wins' },
    { ruleName: 'NoStrayLiteralThreshold', boundary: '> 0.01 + 1e-9' },
    { ruleName: 'NormalizeSqlQuoteStrip' },                                                // code-not-spec
  ];
  const diff = diffRules(specRules, codeRules);
  const total =
    diff.specNotCode.length + diff.codeNotSpec.length + diff.bothDivergent.length + diff.bothAgree.length;
  assert.equal(total, 4, 'every input rule (3 spec + 1 code-only) lands in exactly one axis');
  assert.equal(diff.specNotCode.length, 1);
  assert.equal(diff.codeNotSpec.length, 1);
  assert.equal(diff.bothDivergent.length, 1);
  assert.equal(diff.bothAgree.length, 1);
  // no rule appears in two axes — count the distinct rule identities across all four buckets
  const seen = new Set();
  for (const r of [...diff.specNotCode, ...diff.codeNotSpec, ...diff.bothDivergent, ...diff.bothAgree]) {
    const key = r.ruleName;
    assert.equal(seen.has(key), false, `rule ${key} double-counted across axes`);
    seen.add(key);
  }
});

test('diffRules serializes the spec ∧ ¬code set FIRST (the headline ordering, AC-4) and carries a red test or code-missing note', () => {
  const specRules = [{ id: 'GOLD-XX', ruleName: 'RowLimitWrap', redTest: null, locationRoute: 'code-missing' }];
  const codeRules = [];
  const diff = diffRules(specRules, codeRules);
  const lines = diff.serialized.split('\n').filter((l) => l.includes('spec') || l.includes('code') || l.includes('both'));
  // the spec-not-code section header is the first axis serialized
  assert.match(diff.serialized.split('\n').find((l) => /^##/.test(l)) ?? '', /spec.*code/i);
  // a spec-not-code item with no red test carries a code-missing note
  assert.equal(diff.specNotCode[0].carries, 'code-missing');
});

// =================================================================================================
// Step 5 — labelRed + RULE_ORDER: the deterministic 5-case FP-labeler (D3 / AC-5)
// =================================================================================================
// Validate(...) returns the name of the FIRST violated rule (or null), in a fixed 7-rule order. A spec
// test for rule R carries an EXPECTED outcome ("R" if the input should be rejected by R, or null if it
// should pass). A RED is actual ≠ expected. labelRed classifies each red by comparing expected vs the
// validator's ACTUAL first-fired rule against RULE_ORDER. Only case 1 (earlier-fired) is mechanically
// auto-resolved. Case 4 is the L272 shape AND the fixture-artifact shape — routed to the candidate-bug
// queue *tagged* needs-triage, never auto-confirmed. Keyed off the rule NAME / RULE_ORDER, never a GOLD-id.

test('generatedsqlvalidator.json ruleOrder is the source of truth; RULE_ORDER lib export matches it (AC-1(a))', () => {
  // The JSON config is the CANONICAL SOURCE for the SQL 7-rule firing order (Step 2(b) / AC-1(a)).
  // GeneratedSqlValidator.cs:227-303 — Validate's first-violation-wins sequence.
  assert.deepEqual(SQL_TARGET.ruleOrder, [
    'SingleSelect',
    'RelationPolicy',
    'CategoryIdPresent',
    'NoRelativeDateUnderAnchoring',
    'NoStrayLiteralThreshold',
    'BadReportsFilterPresent',
    'ReportIdsFirst',
  ], 'JSON ruleOrder must match the validator firing sequence — edit generatedsqlvalidator.json, not the lib constant');
  // Roundtrip: the lib export must also equal the JSON (sync guard + this test enforce both directions).
  assert.deepEqual(RULE_ORDER, SQL_TARGET.ruleOrder, 'spec-diff.mjs RULE_ORDER must equal the JSON ruleOrder (JSON is the authority)');
});

test('labelRed CASE 1 — expected R, actual an EARLIER rule → interaction-artifact, route needs-triage (auto-resolved)', () => {
  // expected NoStrayLiteralThreshold (Rule 5), actual BadReportsFilterPresent would be LATER; use an earlier
  // one: expected ReportIdsFirst (Rule 7), actual BadReportsFilterPresent (Rule 6) — earlier masked it.
  const res = labelRed({ expected: 'ReportIdsFirst', actual: 'BadReportsFilterPresent', ruleOrder: RULE_ORDER });
  assert.equal(res.label, 'interaction-artifact');
  assert.equal(res.route, 'needs-triage');
  assert.equal(res.autoResolved, true, 'case 1 is the only mechanically auto-resolved case');
});

test('labelRed CASE 2 — expected R, actual a LATER rule → candidate bug (R under-enforces), route candidate-bug', () => {
  // expected SingleSelect (Rule 1), actual RelationPolicy (Rule 2 — later): R should have fired, a later did.
  const res = labelRed({ expected: 'SingleSelect', actual: 'RelationPolicy', ruleOrder: RULE_ORDER });
  assert.equal(res.label, 'under-enforce');
  assert.equal(res.route, 'candidate-bug');
});

test('labelRed CASE 3 — expected R, actual null → candidate bug (sin of omission: spec ∧ ¬code), route candidate-bug', () => {
  const res = labelRed({ expected: 'NoStrayLiteralThreshold', actual: null, ruleOrder: RULE_ORDER });
  assert.equal(res.label, 'sin-of-omission');
  assert.equal(res.route, 'candidate-bug');
});

test('labelRed CASE 4 — expected null, actual a rule fired → candidate-bug queue TAGGED needs-triage (the L272 over-rejection shape)', () => {
  // The L272 finding: a spec-VALID input (expected null) that the code rejects with NoStrayLiteralThreshold.
  const res = labelRed({ expected: null, actual: 'NoStrayLiteralThreshold', ruleOrder: RULE_ORDER });
  assert.equal(res.label, 'over-rejection');
  assert.equal(res.route, 'candidate-bug', 'case 4 lands in the candidate-bug queue (AC-6 demands it there)');
  assert.equal(res.needsTriage, true, 'case 4 is tagged needs-triage — real-or-fixture, not auto-decided');
});

test('labelRed CASE 5 — test errored / fixture un-constructable → needs-triage (not classifiable)', () => {
  // Modeled on the spike ARTIFACT-04 — the un-constructable SurfaceProfile.Curated profile: the test errors.
  const res = labelRed({ expected: null, actual: null, ruleOrder: RULE_ORDER, errored: true });
  assert.equal(res.label, 'errored');
  assert.equal(res.route, 'needs-triage');
});

test('labelRed case 4 is keyed off the rule NAME, not a GOLD-id ordinal (the Q6 binding caveat)', () => {
  // NoStrayLiteralThreshold is GOLD-08 but Rule 5 — the label must come from the name's position in
  // RULE_ORDER, never from "08". An over-rejection by ANY named rule is case 4.
  const byRule5 = labelRed({ expected: null, actual: 'NoStrayLiteralThreshold', ruleOrder: RULE_ORDER });
  const byRule2 = labelRed({ expected: null, actual: 'RelationPolicy', ruleOrder: RULE_ORDER });
  assert.equal(byRule5.label, 'over-rejection');
  assert.equal(byRule2.label, 'over-rejection');
});

// =================================================================================================
// Step 2(a) / AC-2 — okValue: per-target pass-sentinel (ADR-E)
// =================================================================================================
// The SQL validator returns string? (null = pass); Slack's SignatureVerificationResult enum returns
// "Valid" as the pass outcome (never null). labelRed's case-3 and case-4 must compare against the
// per-target okValue, not a literal null — otherwise a Slack over-rejection (expected "Valid", actual
// "TimestampOutOfRange") falls through to unrecognized-rule instead of reaching the candidate-bug queue.
//
// These tests use the Slack 5-value ruleOrder (GOLD-18 precedence) and okValue: "Valid". The pre-existing
// SQL cases (expected: null) MUST NOT stand in for this (they pass unchanged code) — AC-2 explicitly
// requires the "Valid" sentinel to be exercised.

test('labelRed CASE 4 (Slack enum) — expected "Valid" (okValue), actual "TimestampOutOfRange" → over-rejection, candidate-bug (AC-2)', () => {
  // A conforming Slack input (expected: Valid = the pass sentinel) that the code incorrectly rejects
  // with TimestampOutOfRange. With okValue: "Valid", case 4 must fire: expected === okValue && actual !== okValue.
  // Without okValue support: "Valid" !== null → case 4 doesn't fire → falls to unrecognized-rule (wrong).
  const res = labelRed({ expected: 'Valid', actual: 'TimestampOutOfRange', ruleOrder: SLACK_RULE_ORDER, okValue: 'Valid' });
  assert.equal(res.label, 'over-rejection', 'Slack case 4: expected the pass sentinel (Valid), got a violation — over-rejection');
  assert.equal(res.route, 'candidate-bug', 'over-rejection routes to candidate-bug queue (AC-2)');
  assert.equal(res.needsTriage, true, 'case 4 is tagged needs-triage — real-or-fixture, not auto-decided');
});

test('labelRed CASE 3 (Slack enum) — expected "InvalidSignature", actual "Valid" (okValue) → sin-of-omission, candidate-bug (AC-2)', () => {
  // A Slack input that should be rejected by InvalidSignature (expected !== okValue) but the code passed
  // it (actual === okValue "Valid"). With okValue: "Valid", case 3 must fire: expected !== okValue && actual === okValue.
  // Without okValue support: "Valid" !== null → case 3 condition actual === null is false → unrecognized-rule (wrong).
  const res = labelRed({ expected: 'InvalidSignature', actual: 'Valid', ruleOrder: SLACK_RULE_ORDER, okValue: 'Valid' });
  assert.equal(res.label, 'sin-of-omission', 'Slack case 3: code passed an input that InvalidSignature should reject (spec ∧ ¬code)');
  assert.equal(res.route, 'candidate-bug', 'sin-of-omission routes to candidate-bug queue (AC-2)');
});

test('labelRed okValue defaults to null — existing SQL cases (expected: null) still pass unchanged (backward compat)', () => {
  // Confirm okValue: null (the SQL default) is preserved when no okValue is passed.
  // These are the pre-existing cases — they must pass with or without an explicit okValue.
  const case4 = labelRed({ expected: null, actual: 'NoStrayLiteralThreshold', ruleOrder: RULE_ORDER });
  assert.equal(case4.label, 'over-rejection', 'SQL case 4: okValue defaults to null, expected null, actual a rule → over-rejection');
  const case3 = labelRed({ expected: 'NoStrayLiteralThreshold', actual: null, ruleOrder: RULE_ORDER });
  assert.equal(case3.label, 'sin-of-omission', 'SQL case 3: okValue defaults to null, expected a rule, actual null → sin-of-omission');
});

test('labelRed Slack CASE 1 — expected later rule, actual earlier rule → interaction-artifact (Slack order)', () => {
  // expected InvalidSignature (rule 5 of 5), actual TimestampOutOfRange (rule 4) — earlier masked it.
  const res = labelRed({ expected: 'InvalidSignature', actual: 'TimestampOutOfRange', ruleOrder: SLACK_RULE_ORDER, okValue: 'Valid' });
  assert.equal(res.label, 'interaction-artifact');
  assert.equal(res.route, 'needs-triage');
  assert.equal(res.autoResolved, true);
});

test('labelRed Slack CASE 2 — expected earlier rule, actual later rule → under-enforce (Slack order)', () => {
  // expected MissingSecret (rule 1), actual MissingSignature (rule 2) — R should have fired first.
  const res = labelRed({ expected: 'MissingSecret', actual: 'MissingSignature', ruleOrder: SLACK_RULE_ORDER, okValue: 'Valid' });
  assert.equal(res.label, 'under-enforce');
  assert.equal(res.route, 'candidate-bug');
});

// =================================================================================================
// Step 7 — the pinned L272 known-answer reproduction, proven OFFLINE (AC-6 unit level / D5)
// =================================================================================================
// The live two-arm dotnet+Stryker run is operator-owed (Q7 — it needs a KG git write the developer is
// barred from). What the DEVELOPER phase proves offline is the known-answer ITSELF: the Rule-5 comparison
// is a pure IEEE-754 predicate, so the pre-fix vs patched outcome is deterministic and provable here. We
// model Validate's Rule-5 comparison exactly (GeneratedSqlValidator.cs:276) over the PINNED fixture, then
// run the observed outcome through labelRed and assert the case-4 over-rejection reaches the candidate-bug
// queue (pre-fix) and flips green (patched). This is the AC-5 + AC-6 unit gate the architect named in Q7.

// Validate's Rule-5 comparison, modeled exactly (the only rule the pinned fixture lets fire). Returns the
// Validate return value: "NoStrayLiteralThreshold" if the literal is over-tolerance, else null.
function rule5Fires(literal, threshold, toleranceExpr) {
  // toleranceExpr 'pre-fix' = `> 0.01`; 'patched' = `> 0.01 + 1e-9` (the one-line operator patch).
  const margin = toleranceExpr === 'patched' ? 0.01 + 1e-9 : 0.01;
  return Math.abs(literal - threshold) > margin ? 'NoStrayLiteralThreshold' : null;
}

test('Step 7 fixture pins ONLY Rule 5 (pre-computed stats table, schema-qualified public.*, no category/date trigger)', () => {
  // Guard the pin itself — if the fixture SQL drifts to a public.analytics_report* table or a large detail
  // table, Rule 6 / Rule 7 would fire FIRST and the red would reproduce an ARTIFACT, not L272.
  const sql = L272_FIXTURE.sql;
  assert.match(sql, /public\.analytics_store_category_stats\b/, 'FROM a pre-computed stats table (Rule 6 exempt)');
  assert.doesNotMatch(sql, /analytics_report/i, 'no analytics_report* table (would trip Rule 6 BadReportsFilterPresent first)');
  assert.doesNotMatch(sql, /analytics_report_(client_subcategory_stats|product_stats|items)/i, 'no large detail table (Rule 7 ReportIdsFirst)');
  assert.doesNotMatch(sql, /CURRENT_DATE|now\s*\(/i, 'no relative-date function (Rule 4)');
  assert.equal(L272_FIXTURE.validateArgs.requireCategoryId, false, 'requireCategoryId off (Rule 3 not triggered)');
  assert.equal(L272_FIXTURE.ruleUnderTest, 'NoStrayLiteralThreshold');
  assert.equal(L272_FIXTURE.ruleIndex, 5);
});

test('Step 7 PRE-FIX arm — the pinned literal reds with actual === "NoStrayLiteralThreshold" (the L272 over-rejection)', () => {
  const { literal, threshold } = L272_FIXTURE.knownAnswer;
  const actual = rule5Fires(literal, threshold, 'pre-fix');
  // The known-answer: |0.86 - 0.85| = 0.010000000000000009 > 0.01 → Rule 5 fires on a spec-VALID input.
  assert.equal(actual, 'NoStrayLiteralThreshold', 'pre-fix: the IEEE-754 artifact makes Rule 5 fire (the bug)');
  // The spec test for this input EXPECTED a pass (null) — actual ≠ expected → a red → labelRed case 4.
  const lab = labelRed({ expected: null, actual, ruleOrder: RULE_ORDER });
  assert.equal(lab.label, 'over-rejection');
  assert.equal(lab.route, 'candidate-bug', 'the L272 red is in the candidate-bug queue (AC-6 primary assertion)');
  assert.equal(lab.needsTriage, true);
  // Assert the SPECIFIC rule identity, not "any case-4 red" (the plan's binding requirement).
  assert.equal(actual, L272_FIXTURE.knownAnswer.preFixArm.expectedValidateReturn);
});

test('Step 7 PATCHED arm — the same pinned literal flips GREEN (the |0.86 - 0.85| test passes; AC-6 secondary)', () => {
  const { literal, threshold } = L272_FIXTURE.knownAnswer;
  const actual = rule5Fires(literal, threshold, 'patched');
  // |0.86 - 0.85| = 0.010000000000000009 ; with > 0.01 + 1e-9 the FP noise is absorbed → Rule 5 silent.
  assert.equal(actual, null, 'patched: the 1e-9 margin makes Rule 5 NOT fire → Validate returns null (green)');
  assert.equal(actual, L272_FIXTURE.knownAnswer.patchedArm.expectedValidateReturn);
  // expected null AND actual null → NOT a red → no candidate bug for this input on the patched arm.
  const isRed = actual !== null; // expected is null
  assert.equal(isRed, false, 'the specific known-answer input is green on the patched arm (AC-6 secondary)');
});

test('Step 7 fixture arithmetic matches the spec exactly (|0.86 - 0.85| = 0.010000000000000009)', () => {
  assert.equal(Math.abs(L272_FIXTURE.knownAnswer.literal - L272_FIXTURE.knownAnswer.threshold), L272_FIXTURE.knownAnswer.absDiff);
  assert.equal(L272_FIXTURE.knownAnswer.absDiff > 0.01, true, 'pre-fix boundary crossed');
  assert.equal(L272_FIXTURE.knownAnswer.absDiff > 0.01 + 1e-9, false, 'patched boundary NOT crossed');
});
