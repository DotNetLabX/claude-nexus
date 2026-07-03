// merge-rules.test.mjs — the M1/M3 merge/triage engine (adhoc-SddMergeGen, Step 1).
//
// Content-keyed, granularity-tolerant matching of a spec-rules.md rule set against a code-arm KB rule
// set. Composes with harness/lib/rule-crosswalk.mjs's reconcileRuleSets (the canonical-name rewrite) —
// does NOT replace it. Output = the five delta buckets (proposal §A.1 condition 5): overlap-confirmed |
// spec-only-other-layer | spec-only-divergent | spec-only-unimplemented | code-only-precision — every
// eligible spec rule lands in exactly one bucket, nothing silently dropped. `spec-only-divergent` rows
// carry the `divergence-pending-triage` state + the evidence pair (spec citation + code attestation),
// plus a `suspect-stale-spec` tag when the code-arm KB attributes the behavior to a source the mined
// spec predates. `ambiguous`-verdicted spec rules are excluded from the five buckets and routed to a
// `specRepair` list instead.
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (selfcheck.mjs:45).
import test from 'node:test';
import assert from 'node:assert/strict';
import { triageRuleSets, DELTA_BUCKETS } from '../../harness/lib/merge-rules.mjs';

// =================================================================================================
// Slice 1: many-to-one matching, BOTH directions (code-many→spec-one, spec-many→code-one), via the
// crosswalk reconciliation this lib composes with.
// =================================================================================================
test('triageRuleSets: many code rules → one spec rule (code-many) all resolve to overlap-confirmed after crosswalk', () => {
  const specRules = [{ id: 'SR-1', ruleName: 'BugRatioPercent', boundary: '>0' }];
  const codeRules = [
    { id: 'BR-1', boundary: '>0' },
    { id: 'BR-2', boundary: '>0' },
  ];
  const crosswalkMap = { 'BR-1': 'BugRatioPercent', 'BR-2': 'BugRatioPercent' };
  const { buckets } = triageRuleSets({ specRules, codeRules, crosswalkMap });
  assert.equal(buckets['overlap-confirmed'].length, 1, 'one spec rule → one bucket entry, regardless of how many code rules matched it');
  assert.equal(buckets['overlap-confirmed'][0].ruleName, 'BugRatioPercent');
});

test('triageRuleSets: many spec rules → one code rule (spec-many) EACH independently match', () => {
  const specRules = [
    { id: 'SR-1', ruleName: 'BugRatioPercent', boundary: '>0' },
    { id: 'SR-2', ruleName: 'BugRatioPercent', boundary: '>0' },
  ];
  const codeRules = [{ id: 'BR-1', boundary: '>0' }];
  const crosswalkMap = { 'BR-1': 'BugRatioPercent' };
  const { buckets } = triageRuleSets({ specRules, codeRules, crosswalkMap });
  assert.equal(buckets['overlap-confirmed'].length, 2, 'both spec rules independently match the single code rule');
});

// =================================================================================================
// Slice 2: the five delta buckets — each reachable, and exhaustive (a rule never lands in two).
// =================================================================================================
test('triageRuleSets: DELTA_BUCKETS names exactly the five sanctioned buckets', () => {
  assert.deepEqual(DELTA_BUCKETS, [
    'overlap-confirmed',
    'spec-only-other-layer',
    'spec-only-divergent',
    'spec-only-unimplemented',
    'code-only-precision',
  ]);
});

test('triageRuleSets: all five buckets reachable in one run, no rule lands in two buckets', () => {
  const specRules = [
    { id: 'SR-1', ruleName: 'Agree', boundary: '>0', layer: 'domain-calc' },
    { id: 'SR-2', ruleName: 'OtherLayer', layer: 'ui' },
    { id: 'SR-3', ruleName: 'Divergent', boundary: '>0', layer: 'domain-calc' },
    { id: 'SR-4', ruleName: 'Unimplemented', layer: 'domain-calc' },
  ];
  const codeRules = [
    { id: 'BR-1', ruleName: 'Agree', boundary: '>0' },
    { id: 'BR-2', ruleName: 'Divergent', boundary: '>=0' },
    { id: 'BR-3', ruleName: 'CodeOnly' },
  ];
  const { buckets } = triageRuleSets({ specRules, codeRules, crosswalkMap: {}, targetLayer: 'domain-calc' });
  assert.equal(buckets['overlap-confirmed'].length, 1);
  assert.equal(buckets['overlap-confirmed'][0].ruleName, 'Agree');
  assert.equal(buckets['spec-only-other-layer'].length, 1);
  assert.equal(buckets['spec-only-other-layer'][0].ruleName, 'OtherLayer');
  assert.equal(buckets['spec-only-divergent'].length, 1);
  assert.equal(buckets['spec-only-divergent'][0].ruleName, 'Divergent');
  assert.equal(buckets['spec-only-unimplemented'].length, 1);
  assert.equal(buckets['spec-only-unimplemented'][0].ruleName, 'Unimplemented');
  assert.equal(buckets['code-only-precision'].length, 1);
  assert.equal(buckets['code-only-precision'][0].ruleName, 'CodeOnly');

  // exhaustive + no double-landing: every spec rule name appears in exactly ONE bucket across the run.
  const allEntries = Object.values(buckets).flat();
  const seenNames = allEntries.map((e) => e.ruleName);
  assert.equal(new Set(seenNames).size, seenNames.length, 'no rule name appears in two buckets');
});

// =================================================================================================
// Slice 3: divergence-pending-triage state carries BOTH evidence-pair fields.
// =================================================================================================
test('triageRuleSets: a spec-only-divergent row carries the divergence-pending-triage state + evidence pair', () => {
  const specRules = [{ id: 'SR-28', ruleName: 'BoundaryRule', boundary: '>', citation: 'spec says strictly greater' }];
  const codeRules = [{ id: 'BR-28', ruleName: 'BoundaryRule', boundary: '>=', attestation: 'BugRatioAnalyzer.cs:42' }];
  const { buckets } = triageRuleSets({ specRules, codeRules, crosswalkMap: {} });
  const row = buckets['spec-only-divergent'][0];
  assert.equal(row.state, 'divergence-pending-triage');
  assert.equal(row.evidencePair.specCitation, 'spec says strictly greater');
  assert.equal(row.evidencePair.codeAttestation, 'BugRatioAnalyzer.cs:42');
});

// =================================================================================================
// Slice 4: the suspect-stale-spec tag fires on a "predates" fixture.
// =================================================================================================
test('triageRuleSets: suspect-stale-spec tag fires when the code-arm source POST-dates the mined spec', () => {
  const specRules = [{ id: 'SR-23', ruleName: 'DefaultSpPerBug', boundary: '2', specDate: '2026-01-01' }];
  const codeRules = [{
    id: 'BR-23', ruleName: 'DefaultSpPerBug', boundary: '3',
    attributedSource: { name: 'settings.SpPerBugDefault', date: '2026-05-01' }, // AFTER the spec was mined
  }];
  const { buckets } = triageRuleSets({ specRules, codeRules, crosswalkMap: {} });
  const row = buckets['spec-only-divergent'][0];
  assert.ok(row.tags?.includes('suspect-stale-spec'), 'the source post-dates the spec — spec is stale, route to spec repair not code-bug triage');
});

test('triageRuleSets: suspect-stale-spec tag does NOT fire when the source PRE-dates the spec', () => {
  const specRules = [{ id: 'SR-24', ruleName: 'Rule24', boundary: '2', specDate: '2026-05-01' }];
  const codeRules = [{
    id: 'BR-24', ruleName: 'Rule24', boundary: '3',
    attributedSource: { name: 'settings.Foo', date: '2026-01-01' }, // BEFORE the spec was mined — not stale
  }];
  const { buckets } = triageRuleSets({ specRules, codeRules, crosswalkMap: {} });
  const row = buckets['spec-only-divergent'][0];
  assert.equal(row.tags?.includes('suspect-stale-spec') ?? false, false);
});

// =================================================================================================
// Slice 5: ambiguous exclusion — an ambiguous-verdicted spec rule is excluded from the five buckets
// and routed to specRepair instead (never silently dropped).
// =================================================================================================
test('triageRuleSets: an ambiguous-verdicted spec rule is excluded from the five buckets, routed to specRepair', () => {
  const specRules = [
    { id: 'SR-30', ruleName: 'ThresholdZero', verdict: 'ambiguous', reason: 'boundary not stated — 0 or 1?' },
    { id: 'SR-31', ruleName: 'Clear', boundary: '>0' },
  ];
  const codeRules = [{ id: 'BR-31', ruleName: 'Clear', boundary: '>0' }];
  const { buckets, specRepair } = triageRuleSets({ specRules, codeRules, crosswalkMap: {} });
  const allBucketed = Object.values(buckets).flat().map((e) => e.ruleName);
  assert.ok(!allBucketed.includes('ThresholdZero'), 'ambiguous rule never lands in a delta bucket');
  assert.equal(specRepair.length, 1);
  assert.equal(specRepair[0].ruleName, 'ThresholdZero');
  assert.equal(specRepair[0].reason, 'boundary not stated — 0 or 1?');
  assert.ok(allBucketed.includes('Clear'), 'the non-ambiguous rule still triages normally');
});

// =================================================================================================
// Slice 6: the BugRatio fixture pair (42 spec rules vs 37 code BRs, synthetic — mirrors the SR shapes)
// triages with a non-empty overlap-confirmed AFTER crosswalk is applied.
// =================================================================================================
test('triageRuleSets: BugRatio-shaped fixture (42 spec rules vs 37 code BRs) triages non-empty overlap-confirmed after crosswalk', () => {
  // 37 code-arm rules (BR-1..BR-37), autonomous ids, no ruleName (mirrors the code arm's shape).
  const codeRules = Array.from({ length: 37 }, (_, i) => ({ id: `BR-${i + 1}`, boundary: `${i}` }));
  // 42 spec-arm rules (SR-1..SR-42), authored names — the first 30 correspond 1:1 to BR-1..BR-30 (agreeing
  // boundary), the remaining 12 are spec-only (unimplemented) — mirrors "spec rules span more than the
  // code arm's single-class KB covers."
  const specRules = [
    ...Array.from({ length: 30 }, (_, i) => ({ id: `SR-${i + 1}`, ruleName: `Rule${i + 1}`, boundary: `${i}` })),
    ...Array.from({ length: 12 }, (_, i) => ({ id: `SR-${i + 31}`, ruleName: `SpecOnlyRule${i + 1}`, layer: 'domain-calc' })),
  ];
  // The crosswalk map: BR-n <-> Rule{n} for n=1..30 (the human-confirmed post-hoc correspondence).
  const crosswalkMap = {};
  for (let i = 1; i <= 30; i++) {
    crosswalkMap[`BR-${i}`] = `Rule${i}`;
    crosswalkMap[`Rule${i}`] = `Rule${i}`;
  }
  assert.equal(specRules.length, 42);
  assert.equal(codeRules.length, 37);
  const { buckets } = triageRuleSets({ specRules, codeRules, crosswalkMap, targetLayer: 'domain-calc' });
  assert.equal(buckets['overlap-confirmed'].length, 30, 'the 30 crosswalked, boundary-agreeing rules land in overlap-confirmed');
  assert.ok(buckets['overlap-confirmed'].length > 0, 'non-empty overlap-confirmed after crosswalk');
  assert.equal(buckets['spec-only-unimplemented'].length, 12, 'the 12 spec-only rules (matching layer, no code match) are unimplemented gaps');
  assert.equal(buckets['code-only-precision'].length, 7, 'the 7 un-crosswalked code rules (BR-31..BR-37) are code-only precision');
});
