// kickoff-preflight.test.mjs — F7 S4: two-tier blocking kickoff preflight (TDD).
//
// The kickoff checklist becomes an orchestrator-verified preflight. Universal preconditions (all members)
// + member-conditional preconditions. A failed precondition REFUSES the run with a named reason (pattern:
// mine-algorithm Stage-0 HARD BLOCK). This suite drives the three acceptance fixtures — (a) missing
// universal → refusal, (b) oracle-consuming member missing registry freshness → refusal, (c) NON-oracle
// member → the registry check is REACHABLE and SKIPPED by member class (not merely absent — the
// vacuous-negative trap).
import test from 'node:test';
import assert from 'node:assert/strict';
import { preflight, ORACLE_CONSUMING_MEMBERS } from '../../plugins/nexus/skills/mine-verify-cover/tools/kickoff-preflight.mjs';

// A fully-satisfied universal set for a plain (non-oracle, non-cover) member.
function baseConfig(over = {}) {
  return {
    member: 'mine-verify-repo',
    coverArm: false,
    toolPreflight: true,
    expectedSurvivalRate: '~80% mined→confirmed',
    stopBudget: 50000,
    runReportLocation: 'docs/tech-debt/area.md',
    stageModelPlan: 'extract=named-cheaper-tier, judgment=session-tier',
    ...over,
  };
}

test('a fully-satisfied universal set passes for a plain member', () => {
  const r = preflight(baseConfig());
  assert.equal(r.pass, true);
  assert.deepEqual(r.refusals, []);
});

// --- (a) missing universal precondition → refusal with a named reason ----------------------------
test('(a) a missing universal precondition REFUSES the run with a named reason', () => {
  const r = preflight(baseConfig({ stopBudget: undefined }));
  assert.equal(r.pass, false, 'the run is refused');
  assert.equal(r.refusals.length, 1);
  assert.equal(r.refusals[0].check, 'stopBudget');
  assert.match(r.refusals[0].reason, /stop-budget/i, 'the refusal names the failed precondition');
});

test('(a2) every universal precondition is individually blocking', () => {
  for (const field of ['toolPreflight', 'expectedSurvivalRate', 'stopBudget', 'runReportLocation', 'stageModelPlan']) {
    const r = preflight(baseConfig({ [field]: undefined }));
    assert.equal(r.pass, false, `${field} missing must refuse`);
    assert.ok(r.refusals.some((x) => x.check === field), `${field} is named in the refusal`);
  }
});

// --- exact-boundary: a numeric 0 / NaN is NOT a valid declaration (reviewer LOW) -----------------
test('a numeric 0 stop-budget is REFUSED (0 halts immediately — not a meaningful ceiling)', () => {
  const r = preflight(baseConfig({ stopBudget: 0 }));
  assert.equal(r.pass, false);
  assert.ok(r.refusals.some((x) => x.check === 'stopBudget'), '0 does not confirm a declared budget');
});

test('a NaN stop-budget is REFUSED (e.g. a bad Number("abc") parse)', () => {
  const r = preflight(baseConfig({ stopBudget: NaN }));
  assert.equal(r.pass, false);
  assert.ok(r.refusals.some((x) => x.check === 'stopBudget'), 'NaN is never a valid declaration');
});

test('a positive stop-budget of exactly 1 IS confirmed (boundary above 0)', () => {
  const r = preflight(baseConfig({ stopBudget: 1 }));
  assert.equal(r.pass, true, 'any positive number is a declared ceiling');
  assert.equal(r.checks.stopBudget.ok, true);
});

// --- (b) oracle-consuming member missing registry freshness → refusal ----------------------------
test('(b) an oracle-consuming member (mine-design) missing registry freshness is REFUSED', () => {
  const r = preflight(baseConfig({ member: 'mine-design', registryFresh: undefined }));
  assert.equal(r.pass, false);
  assert.ok(r.refusals.some((x) => x.check === 'registryFreshness'), 'registry freshness is the blocking reason');
  assert.equal(r.checks.registryFreshness.applicable, true, 'the registry check APPLIES to an oracle-consuming member');
});

test('(b2) an oracle-consuming member WITH fresh registry passes', () => {
  const r = preflight(baseConfig({ member: 'mine-algorithm', registryFresh: true }));
  assert.equal(r.pass, true);
  assert.equal(r.checks.registryFreshness.applicable, true);
  assert.equal(r.checks.registryFreshness.ok, true);
});

// --- (c) NON-oracle member: registry check REACHABLE and SKIPPED by member class -----------------
// The vacuous-negative trap: a test that passes merely because the code never checks the registry is a
// false green. This asserts the check PATH is reachable (present in `checks`) and explicitly skipped by
// member class (applicable:false) — and that a missing registryFresh does NOT refuse a non-oracle run.
test('(c) a NON-oracle member skips the registry check BY MEMBER CLASS (reachable, applicable:false)', () => {
  const r = preflight(baseConfig({ member: 'mine-verify-repo', registryFresh: undefined }));
  assert.equal(r.pass, true, 'a non-oracle member is not blocked by a missing registry');
  assert.ok('registryFreshness' in r.checks, 'the registry-check path is REACHABLE (present in checks), not absent');
  assert.equal(r.checks.registryFreshness.applicable, false, 'skipped BY MEMBER CLASS, not vacuously missing');
  assert.match(r.checks.registryFreshness.reason, /oracle/i, 'the skip reason names the member-class rule');
  assert.equal(ORACLE_CONSUMING_MEMBERS.has('mine-verify-repo'), false, 'mine-verify-repo is not oracle-consuming');
});

// --- Cover-arm conditional: mined-test-root disclosure -------------------------------------------
test('a Cover-arm run missing the mined-test-root disclosure is REFUSED; a non-Cover run skips it by class', () => {
  const refused = preflight(baseConfig({ member: 'mine-verify-cover', coverArm: true, minedTestRootDisclosed: undefined }));
  assert.equal(refused.pass, false);
  assert.ok(refused.refusals.some((x) => x.check === 'minedTestRootDisclosure'));
  assert.equal(refused.checks.minedTestRootDisclosure.applicable, true, 'applies to a Cover-arm run');

  const skipped = preflight(baseConfig({ member: 'mine-verify-cover', coverArm: false, minedTestRootDisclosed: undefined }));
  assert.equal(skipped.checks.minedTestRootDisclosure.applicable, false, 'skipped by class on a non-Cover run');
  assert.equal(skipped.pass, true);
});
