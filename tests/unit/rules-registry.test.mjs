// rules-registry.test.mjs — the M1/M3 registry writer lib (adhoc-SddMergeGen, Step 2).
//
// Writes/updates the per-repo canonical rule registry (SddLifecycle C1, OD-L5 default path
// docs/kb/golden/{Class}.md) from Step 1's triage output. Binding invariants (borrowed from omnishelf
// kb-sync, cited in the proposal): every row carries `source:` provenance and `last_verified`; existing
// rows are NEVER deleted — disposition flips to retire/supersede with the record kept; every write
// appends a changelog entry; a re-run against an unchanged input pair is idempotent (no diff).
//
// PURE — no fs, no LLM. The caller does the actual file I/O (an agent, per the method's no-filesystem-
// in-the-orchestrator rule); this lib only computes the registry TEXT / row diffs.
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (selfcheck.mjs:45).
import test from 'node:test';
import assert from 'node:assert/strict';
import { updateRegistry, renderRegistry, parseRegistry } from '../../harness/lib/rules-registry.mjs';

// =================================================================================================
// Slice 1: no-delete invariant — a removal input yields a RETAINED row with disposition `retire`,
// never an actually-removed row.
// =================================================================================================
test('updateRegistry: a rule missing from the new triage input retains its existing row, disposition flips to retire', () => {
  const existingRows = [
    { canonicalName: 'OldRule', layer: 'domain-calc', criticality: 'core', arms: 'both', bucket: 'overlap-confirmed', disposition: 'add', source: 'F13-BugRatio run 1', lastVerified: '2026-06-01' },
  ];
  const { rows, changelog } = updateRegistry({ existingRows, triage: { buckets: emptyBuckets(), specRepair: [] }, source: 'F13-BugRatio run 2', date: '2026-07-01' });
  assert.equal(rows.length, 1, 'the row is RETAINED, never deleted');
  assert.equal(rows[0].canonicalName, 'OldRule');
  assert.equal(rows[0].disposition, 'retire', 'absent from the new triage → disposition flips to retire');
  assert.ok(changelog.some((c) => /retire/.test(c) && /OldRule/.test(c)), 'the retire is recorded in the changelog');
});

// =================================================================================================
// Slice 2: changelog append per write — every call to updateRegistry appends at least one entry,
// never overwrites the prior changelog.
// =================================================================================================
test('updateRegistry: appends a changelog entry per write, never overwrites the prior changelog', () => {
  const priorChangelog = ['- 2026-06-01: seeded OldRule (add) — source: F13-BugRatio run 1'];
  const existingRows = [
    { canonicalName: 'OldRule', layer: 'domain-calc', criticality: 'core', arms: 'both', bucket: 'overlap-confirmed', disposition: 'add', source: 'F13-BugRatio run 1', lastVerified: '2026-06-01' },
  ];
  const { changelog } = updateRegistry({ existingRows, existingChangelog: priorChangelog, triage: { buckets: emptyBuckets(), specRepair: [] }, source: 'F13-BugRatio run 2', date: '2026-07-01' });
  assert.ok(changelog.length > priorChangelog.length, 'new entries appended');
  assert.equal(changelog[0], priorChangelog[0], 'the prior changelog entry is preserved, not overwritten');
});

// =================================================================================================
// Slice 3: idempotent re-run — an unchanged input pair produces NO diff (same rows, no new changelog).
// =================================================================================================
test('updateRegistry: a re-run against an UNCHANGED input pair is idempotent (no diff, no new changelog entries)', () => {
  const triage = {
    buckets: {
      ...emptyBuckets(),
      'overlap-confirmed': [{ ruleName: 'BugRatioPercent', layer: 'domain-calc', criticality: 'core', bucket: 'overlap-confirmed' }],
    },
    specRepair: [],
  };
  // Seed run: the row does not exist yet → disposition 'add' (a legitimate one-time transition).
  const seed = updateRegistry({ existingRows: [], triage, source: 'F13-BugRatio run 1', date: '2026-07-01' });
  // Steady-state re-run 1: the row now exists with unchanged evidence → 'carried'.
  const run2 = updateRegistry({ existingRows: seed.rows, existingChangelog: seed.changelog, triage, source: 'F13-BugRatio run 1', date: '2026-07-01' });
  // Steady-state re-run 2: SAME unchanged input again → must be byte-identical to run2 (the actual
  // idempotency invariant — the steady state, not the one-time add→carried transition).
  const run3 = updateRegistry({ existingRows: run2.rows, existingChangelog: run2.changelog, triage, source: 'F13-BugRatio run 1', date: '2026-07-01' });
  assert.deepEqual(run3.rows, run2.rows, 'rows are byte-identical across two consecutive unchanged re-runs');
  assert.deepEqual(run3.changelog, run2.changelog, 'no new changelog entries once the row has reached the carried steady state');
});

// =================================================================================================
// Slice 4: provenance mandatory — a write without `source:` throws.
// =================================================================================================
test('updateRegistry: throws when `source` is missing (provenance mandatory)', () => {
  const triage = { buckets: emptyBuckets(), specRepair: [] };
  assert.throws(
    () => updateRegistry({ existingRows: [], triage, date: '2026-07-01' }),
    /source/i,
    'a write without source: provenance must throw, never silently write an unattributed row',
  );
});

// =================================================================================================
// Slice 5: last_verified stamped on every touched row; every row carries source: (positive path).
// =================================================================================================
test('updateRegistry: every new row carries source: provenance and last_verified', () => {
  const triage = {
    buckets: {
      ...emptyBuckets(),
      'spec-only-unimplemented': [{ ruleName: 'NewGap', layer: 'domain-calc', bucket: 'spec-only-unimplemented' }],
    },
    specRepair: [],
  };
  const { rows } = updateRegistry({ existingRows: [], triage, source: 'F13-BugRatio run 1', date: '2026-07-01' });
  const row = rows.find((r) => r.canonicalName === 'NewGap');
  assert.equal(row.source, 'F13-BugRatio run 1');
  assert.equal(row.lastVerified, '2026-07-01');
  assert.equal(row.disposition, 'add', 'a brand-new rule (not present prior) gets the M1 add disposition');
});

// =================================================================================================
// Slice 6: M3 reconciliation table — carried / re-open / supersede dispositions from the tech-spec's
// (prior C2 status, prior verdict, new two-way bucket) table.
// =================================================================================================
test('updateRegistry: M3 carried — same bucket, evidence consistent with the prior verdict', () => {
  const existingRows = [
    { canonicalName: 'StableRule', layer: 'domain-calc', criticality: 'core', arms: 'both', bucket: 'overlap-confirmed', disposition: 'add', source: 'run 1', lastVerified: '2026-06-01' },
  ];
  const triage = {
    buckets: { ...emptyBuckets(), 'overlap-confirmed': [{ ruleName: 'StableRule', layer: 'domain-calc', bucket: 'overlap-confirmed' }] },
    specRepair: [],
  };
  const { rows } = updateRegistry({ existingRows, triage, source: 'run 2', date: '2026-07-01' });
  const row = rows.find((r) => r.canonicalName === 'StableRule');
  assert.equal(row.disposition, 'carried');
});

test('updateRegistry: M3 supersede — rule persists in both arms but the bucket/boundary changed', () => {
  const existingRows = [
    { canonicalName: 'ChangedRule', layer: 'domain-calc', criticality: 'core', arms: 'both', bucket: 'overlap-confirmed', disposition: 'add', source: 'run 1', lastVerified: '2026-06-01' },
  ];
  const triage = {
    buckets: { ...emptyBuckets(), 'spec-only-divergent': [{ ruleName: 'ChangedRule', layer: 'domain-calc', bucket: 'spec-only-divergent', state: 'divergence-pending-triage', evidencePair: { specCitation: 'x', codeAttestation: 'y' } }] },
    specRepair: [],
  };
  const { rows } = updateRegistry({ existingRows, triage, source: 'run 2', date: '2026-07-01' });
  const row = rows.find((r) => r.canonicalName === 'ChangedRule');
  assert.equal(row.disposition, 'supersede');
});

// =================================================================================================
// Slice 7: renderRegistry produces the C1 markdown shape (OD-L5 default path docs/kb/golden/{Class}.md)
// with source:/last_verified columns and an append-only changelog section.
// =================================================================================================
test('renderRegistry: renders a markdown table with source/last_verified columns + a changelog section', () => {
  const rows = [
    { canonicalName: 'BugRatioPercent', layer: 'domain-calc', criticality: 'core', arms: 'both', bucket: 'overlap-confirmed', disposition: 'add', source: 'run 1', lastVerified: '2026-07-01' },
  ];
  const changelog = ['- 2026-07-01: added BugRatioPercent (add) — source: run 1'];
  const md = renderRegistry({ className: 'BugRatioAnalyzer', rows, changelog });
  assert.match(md, /BugRatioPercent/);
  assert.match(md, /source/i);
  assert.match(md, /last_verified/i);
  assert.match(md, /## Changelog/);
  assert.match(md, /added BugRatioPercent/);
});

// =================================================================================================
// Slice 7b (review HIGH fix, cycle 1): renderRegistry persists the delta BUCKET on every row, and the
// divergence STATE + EVIDENCE PAIR + `suspect-stale-spec` TAG for a spec-only-divergent row — the
// exact fields the review found silently dropped.
// =================================================================================================
test('renderRegistry: persists the bucket column + the divergence state/evidence-pair/tag for a divergent row', () => {
  const rows = [
    { canonicalName: 'BugRatioPercent', layer: 'domain-calc', criticality: 'core', arms: 'spec', bucket: 'overlap-confirmed', disposition: 'add', source: 'run 1', lastVerified: '2026-07-01' },
    {
      canonicalName: 'BoundaryRule', layer: 'domain-calc', arms: 'spec', bucket: 'spec-only-divergent', disposition: 'add', source: 'run 1', lastVerified: '2026-07-01',
      state: 'divergence-pending-triage',
      evidencePair: { specCitation: 'spec says strictly greater', codeAttestation: 'BugRatioAnalyzer.cs:42' },
      tags: ['suspect-stale-spec'],
    },
  ];
  const md = renderRegistry({ className: 'BugRatioAnalyzer', rows, changelog: [] });
  assert.match(md, /\bBucket\b/, 'the table header names a Bucket column');
  assert.match(md, /overlap-confirmed/, 'the ordinary row\'s bucket is persisted');
  assert.match(md, /spec-only-divergent/, 'the divergent row\'s bucket is persisted');
  assert.match(md, /## Divergence detail/, 'a dedicated section carries the divergence detail');
  assert.match(md, /divergence-pending-triage/, 'the divergence STATE is persisted');
  assert.match(md, /spec says strictly greater/, 'the evidence pair\'s spec citation is persisted');
  assert.match(md, /BugRatioAnalyzer\.cs:42/, 'the evidence pair\'s code attestation is persisted');
  assert.match(md, /suspect-stale-spec/, 'the suspect-stale-spec TAG is persisted');
});

test('renderRegistry: an all-ordinary registry (no divergent rows) omits the Divergence detail section entirely', () => {
  const rows = [
    { canonicalName: 'PlainRule', layer: 'domain-calc', criticality: 'core', arms: 'both', bucket: 'overlap-confirmed', disposition: 'add', source: 'run 1', lastVerified: '2026-07-01' },
  ];
  const md = renderRegistry({ className: 'BugRatioAnalyzer', rows, changelog: [] });
  assert.doesNotMatch(md, /## Divergence detail/, 'no divergent rows -> no empty/dangling section header');
});

// =================================================================================================
// Slice 8 (review HIGH fix, cycle 1): parseRegistry is the deterministic INVERSE of renderRegistry —
// a render -> parse round trip recovers every field exactly, including the divergence detail.
// =================================================================================================
test('parseRegistry: recovers every rendered field exactly, including divergence state/evidence-pair/tags', () => {
  const rows = [
    { canonicalName: 'BugRatioPercent', layer: 'domain-calc', criticality: 'core', arms: 'spec', bucket: 'overlap-confirmed', disposition: 'add', source: 'run 1', lastVerified: '2026-07-01' },
    {
      canonicalName: 'BoundaryRule', layer: 'domain-calc', arms: 'spec', bucket: 'spec-only-divergent', disposition: 'add', source: 'run 1', lastVerified: '2026-07-01',
      state: 'divergence-pending-triage',
      evidencePair: { specCitation: 'spec says strictly greater', codeAttestation: 'BugRatioAnalyzer.cs:42' },
      tags: ['suspect-stale-spec'],
    },
  ];
  const changelog = ['- 2026-07-01: added BugRatioPercent (add) — source: run 1', '- 2026-07-01: added BoundaryRule (add) — source: run 1'];
  const md = renderRegistry({ className: 'BugRatioAnalyzer', rows, changelog });
  const parsed = parseRegistry(md);

  const plain = parsed.rows.find((r) => r.canonicalName === 'BugRatioPercent');
  assert.equal(plain.layer, 'domain-calc');
  assert.equal(plain.criticality, 'core');
  assert.equal(plain.arms, 'spec');
  assert.equal(plain.bucket, 'overlap-confirmed');
  assert.equal(plain.disposition, 'add');
  assert.equal(plain.source, 'run 1');
  assert.equal(plain.lastVerified, '2026-07-01');

  const divergent = parsed.rows.find((r) => r.canonicalName === 'BoundaryRule');
  assert.equal(divergent.bucket, 'spec-only-divergent');
  assert.equal(divergent.state, 'divergence-pending-triage');
  assert.equal(divergent.evidencePair.specCitation, 'spec says strictly greater');
  assert.equal(divergent.evidencePair.codeAttestation, 'BugRatioAnalyzer.cs:42');
  assert.deepEqual(divergent.tags, ['suspect-stale-spec']);

  assert.deepEqual(parsed.changelog, changelog, 'the changelog round-trips verbatim');
});

test('parseRegistry: an empty/first-ever-run registry (no rows) parses to empty rows + empty changelog', () => {
  const md = renderRegistry({ className: 'BugRatioAnalyzer', rows: [], changelog: [] });
  const parsed = parseRegistry(md);
  assert.deepEqual(parsed.rows, []);
  assert.deepEqual(parsed.changelog, []);
});

// =================================================================================================
// Slice 9 (THE review HIGH finding's regression test, cycle 1): a render -> real-file-shaped parse ->
// re-run updateRegistry on UNCHANGED input is idempotent — `carried`, ZERO changelog growth. This is
// the render/parse-boundary test the review found missing: Slices 3/6 above chain updateRegistry calls
// via the IN-MEMORY .rows object directly, never through renderRegistry and back through parseRegistry
// — supplemented here, not replaced (both are valid, if previously incomplete, checks).
// =================================================================================================
test('THE FIX: render -> parse -> updateRegistry on UNCHANGED input is idempotent (carried, zero changelog growth) — the real file round trip, not in-memory chaining', () => {
  const triage = {
    buckets: {
      ...emptyBuckets(),
      'overlap-confirmed': [{ ruleName: 'BugRatioPercent', layer: 'domain-calc', criticality: 'core', bucket: 'overlap-confirmed' }],
      'spec-only-divergent': [{
        ruleName: 'BoundaryRule', layer: 'domain-calc', bucket: 'spec-only-divergent',
        state: 'divergence-pending-triage',
        evidencePair: { specCitation: 'spec says strictly greater', codeAttestation: 'BugRatioAnalyzer.cs:42' },
        tags: ['suspect-stale-spec'],
      }],
    },
    specRepair: [],
  };

  // Reach the CARRIED steady state first (seed 'add' -> one carried transition), same as Slice 3.
  const seed = updateRegistry({ existingRows: [], triage, source: 'run 1', date: '2026-07-01' });
  const steadyState = updateRegistry({ existingRows: seed.rows, existingChangelog: seed.changelog, triage, source: 'run 1', date: '2026-07-01' });
  assert.ok(steadyState.rows.every((r) => r.disposition === 'carried'), 'sanity: steady state reached in-memory first');

  // NOW cross the REAL boundary: render the steady-state registry to markdown, parse it back — exactly
  // what a real file write + a real file read would produce (unlike Slices 3/6's in-memory .rows chaining).
  const rendered = renderRegistry({ className: 'BugRatioAnalyzer', rows: steadyState.rows, changelog: steadyState.changelog });
  const parsed = parseRegistry(rendered);

  // Re-run updateRegistry on the SAME unchanged triage/source/date, against the PARSED (round-tripped) state.
  const afterRoundTrip = updateRegistry({ existingRows: parsed.rows, existingChangelog: parsed.changelog, triage, source: 'run 1', date: '2026-07-01' });

  assert.ok(afterRoundTrip.rows.every((r) => r.disposition === 'carried'), 'every row stays carried across a REAL render->parse round trip on unchanged input (not supersede)');
  assert.equal(afterRoundTrip.changelog.length, parsed.changelog.length, 'ZERO changelog growth — the idempotency invariant holds across the real file boundary');
});

// =================================================================================================
// Slice 10 (adhoc-SddMergeFeedback item 1, HIGH): a code-only-precision entry carrying ONLY `id`
// (BR-n, no ruleName) must NOT be silently dropped. `triageRuleSets` keys rules via ruleKey = ruleName
// ?? id, but `updateRegistry` used to read `entry.ruleName` only, so a code-only-precision entry
// (which carries no ruleName) was skipped — the row never reached the registry. The fix keys the new
// entry (and the retire-walk lookup) by the SAME ruleName ?? id fallback.
// =================================================================================================
test('updateRegistry: a code-only-precision entry with only `id` (no ruleName) still produces a registry row (item 1)', () => {
  const triage = {
    buckets: {
      ...emptyBuckets(),
      'code-only-precision': [{ id: 'BR-9', bucket: 'code-only-precision', layer: 'domain-calc' }],
    },
    specRepair: [],
  };
  const { rows } = updateRegistry({ existingRows: [], triage, source: 'F13-BugRatio run 1', date: '2026-07-01' });
  assert.ok(rows.some((r) => r.canonicalName === 'BR-9'), 'the code-only row keyed by id BR-9 must persist, not be silently dropped');
  const row = rows.find((r) => r.canonicalName === 'BR-9');
  assert.equal(row.arms, 'code', 'a code-only-precision entry with no attached codeRule → arms: code');
});

// ---- fixture helper ------------------------------------------------------------------------------
function emptyBuckets() {
  return {
    'overlap-confirmed': [],
    'spec-only-other-layer': [],
    'spec-only-divergent': [],
    'spec-only-unimplemented': [],
    'code-only-precision': [],
  };
}
