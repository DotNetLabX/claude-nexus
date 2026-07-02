// independence-check.test.mjs — the per-run input-manifest tripwire (adhoc-SddCoverageLoop, Step 5).
//
// AC-1 (two mutually-blind runs) + AC-2 (spec source ≠ golden set) need a PRE-RUN, declarative proof that
// neither arm's agents can see: the sequestered SR golden set (post-hoc scoring only), the Step-7
// reconciliation crosswalk (applied outside both blind runs), or the OTHER arm's private oracle/output. This
// mirrors the golden-set placement+tripwire and the spec-cover single-reader placement — FAILS CLOSED on any
// violation, never silently passes.
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (selfcheck.mjs:44).
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkManifest, checkIndependence } from '../../harness/lib/independence-check.mjs';

// =================================================================================================
// checkManifest — a single manifest against an explicit forbidden-path list. FAILS CLOSED.
// =================================================================================================
test('checkManifest: a forbidden path present in the manifest FAILS CLOSED', () => {
  const r = checkManifest({ paths: ['a.md', 'golden-set.md', 'b.cs'], forbidden: ['golden-set.md'] });
  assert.equal(r.pass, false);
  assert.deepEqual(r.violations, ['golden-set.md']);
});

test('checkManifest: no forbidden path present PASSES', () => {
  const r = checkManifest({ paths: ['a.md', 'b.cs'], forbidden: ['golden-set.md'] });
  assert.equal(r.pass, true);
  assert.deepEqual(r.violations, []);
});

// =================================================================================================
// checkIndependence — combines both arms' manifests: disjointness + golden-set-free + crosswalk-free.
// FAILS CLOSED on any of the three violation types.
// =================================================================================================
const GOLDEN_SET = 'D:\\src\\sprint-rituals\\docs\\audit\\golden-set.md';
const CROSSWALK = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs\\rule-crosswalk-bugratio.json';

test('checkIndependence: disjoint manifests, golden-set-free, crosswalk-free → PASSES', () => {
  const specManifest = { arm: 'spec', paths: ['spec-rules-bugratio.md', 'spec-cover-calc-bugratio-run.json'] };
  const codeManifest = { arm: 'code', paths: ['bugratio.json', 'bugratio-run.json'] };
  const r = checkIndependence({ specManifest, codeManifest, goldenSetPath: GOLDEN_SET, crosswalkPath: CROSSWALK });
  assert.equal(r.pass, true);
  assert.deepEqual(r.violations, []);
});

test('checkIndependence: the golden set in EITHER manifest FAILS CLOSED', () => {
  const specManifest = { arm: 'spec', paths: ['spec-rules-bugratio.md', GOLDEN_SET] };
  const codeManifest = { arm: 'code', paths: ['bugratio.json'] };
  const r = checkIndependence({ specManifest, codeManifest, goldenSetPath: GOLDEN_SET, crosswalkPath: CROSSWALK });
  assert.equal(r.pass, false);
  assert.ok(r.violations.some((v) => v.arm === 'spec' && v.path === GOLDEN_SET));
});

test('checkIndependence: the crosswalk map in EITHER manifest FAILS CLOSED', () => {
  const specManifest = { arm: 'spec', paths: ['spec-rules-bugratio.md'] };
  const codeManifest = { arm: 'code', paths: ['bugratio.json', CROSSWALK] };
  const r = checkIndependence({ specManifest, codeManifest, goldenSetPath: GOLDEN_SET, crosswalkPath: CROSSWALK });
  assert.equal(r.pass, false);
  assert.ok(r.violations.some((v) => v.arm === 'code' && v.path === CROSSWALK));
});

test('checkIndependence: an overlapping path between the two manifests (not disjoint) FAILS CLOSED', () => {
  const specManifest = { arm: 'spec', paths: ['spec-rules-bugratio.md', 'shared-leak.json'] };
  const codeManifest = { arm: 'code', paths: ['bugratio.json', 'shared-leak.json'] };
  const r = checkIndependence({ specManifest, codeManifest, goldenSetPath: GOLDEN_SET, crosswalkPath: CROSSWALK });
  assert.equal(r.pass, false);
  assert.ok(r.violations.some((v) => v.arm === 'both' && v.path === 'shared-leak.json'), 'the overlap is reported as a "both" violation');
});

test('checkIndependence: path comparison is case-insensitive and separator-normalized (Windows paths)', () => {
  const specManifest = { arm: 'spec', paths: ['D:\\src\\sprint-rituals\\docs\\audit\\GOLDEN-SET.MD'] };
  const codeManifest = { arm: 'code', paths: ['bugratio.json'] };
  const r = checkIndependence({ specManifest, codeManifest, goldenSetPath: GOLDEN_SET, crosswalkPath: CROSSWALK });
  assert.equal(r.pass, false, 'a case/slash-differing golden-set path must still be caught');
});
