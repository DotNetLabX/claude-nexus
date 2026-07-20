// kickoff-preflight.mjs — F7 S4: the two-tier blocking kickoff preflight (SHIPPED, ADR-62).
//
// The kickoff checklist (references/mine-family-core.md §Kickoff checklist) is no longer wired-but-advisory:
// this is the ORCHESTRATOR-VERIFIED preflight. A failed precondition REFUSES the run with a named reason
// (the mine-algorithm Stage-0 HARD BLOCK pattern), rather than launching on an unmet assumption.
//
// TARGET-AGNOSTIC, zero imports. A workflow-run member's orchestrator invokes it in place (ADR-62). A
// prose-only sibling run walks the same two tiers by hand — that residue is disclosed in the core section.
//
// TWO TIERS:
//   Universal (blocking, ALL members): tool preflight · expected survival rate · stop-budget · run-report location · stage-model-plan.
//   Member-conditional:
//     - registry existence/freshness — ORACLE-CONSUMING members only (mine-design, mine-algorithm).
//     - mined-test-root disclosure   — Cover-arm runs only.
//
// The member-conditional checks are always PRESENT in the result (`applicable` true/false) — never silently
// absent — so a caller/test can prove the path is reachable and skipped BY CLASS, not vacuously missing.

// The two members that CONSUME a business-rule registry as their oracle — they must never launch without a
// fresh one (the anti-self-mine independence rule). Every other member either produces the registry or does
// not consume one.
export const ORACLE_CONSUMING_MEMBERS = new Set(['mine-design', 'mine-algorithm']);

// A precondition value is "confirmed" when it is present and meaningful (a named location, a stated rate, a
// declared positive budget, or an explicit true). Empty string / undefined / null / false read as
// unconfirmed — and so do a numeric 0 or NaN: a 0 stop-budget halts immediately and a NaN (e.g. a bad
// `Number('abc')` parse) is never a valid declaration, so neither may satisfy a precondition (reviewer LOW).
function confirmed(v) {
  if (v === undefined || v === null || v === '' || v === false) return false;
  if (typeof v === 'number' && (Number.isNaN(v) || v === 0)) return false;
  return true;
}

const UNIVERSAL = [
  { key: 'toolPreflight', reason: 'tool preflight not confirmed — verify the toolchain is present or consciously accept the documented fallback' },
  { key: 'expectedSurvivalRate', reason: 'expected survival rate not stated — a run far off the estimate must get a second look before the registry is trusted' },
  { key: 'stopBudget', reason: 'stop-budget not declared — the marginal-spend ceiling this run halts at' },
  { key: 'runReportLocation', reason: 'run-report location not named — where the run report (areas scanned/skipped, survival rate, registry delta) lands' },
  { key: 'stageModelPlan', reason: 'stage-model-plan not declared — which model tier each stage class runs on (mechanical collection/extraction stages may run a named cheaper tier; judgment stages run the session tier or a deliberately named one); declare-and-veto, the operator vetoes it in the kickoff output' },
];

/**
 * Verify the kickoff preconditions for a mine-family run. Returns the pass/refuse decision, the named
 * refusals, and the full check map (member-conditional checks carry `applicable`).
 *
 * @param {{member:string, coverArm?:boolean, toolPreflight?:*, expectedSurvivalRate?:*, stopBudget?:*,
 *   runReportLocation?:*, stageModelPlan?:*, registryFresh?:*, minedTestRootDisclosed?:*}} config
 * @returns {{pass:boolean, refusals:Array<{check:string, reason:string}>, checks:object}}
 */
export function preflight(config = {}) {
  const refusals = [];
  const checks = {};

  // --- Tier 1: universal (blocking, all members) ---
  for (const { key, reason } of UNIVERSAL) {
    const ok = confirmed(config[key]);
    checks[key] = { applicable: true, ok };
    if (!ok) refusals.push({ check: key, reason });
  }

  // --- Tier 2a: registry existence/freshness — oracle-consuming members ONLY ---
  const registryApplicable = ORACLE_CONSUMING_MEMBERS.has(config.member);
  if (registryApplicable) {
    const ok = confirmed(config.registryFresh);
    checks.registryFreshness = { applicable: true, ok };
    if (!ok) {
      refusals.push({
        check: 'registryFreshness',
        reason: `registry absent or stale — oracle-consuming member "${config.member}" must not self-mine its oracle; run mine-verify-cover to produce/refresh it first`,
      });
    }
  } else {
    // REACHABLE but skipped by member class (not vacuously absent — the anti-vacuous-negative contract).
    checks.registryFreshness = {
      applicable: false,
      ok: true,
      reason: `skipped — "${config.member}" is not an oracle-consuming member (registry freshness applies to ${[...ORACLE_CONSUMING_MEMBERS].join(', ')})`,
    };
  }

  // --- Tier 2b: mined-test-root disclosure — Cover-arm runs ONLY ---
  if (config.coverArm) {
    const ok = confirmed(config.minedTestRootDisclosed);
    checks.minedTestRootDisclosure = { applicable: true, ok };
    if (!ok) {
      refusals.push({
        check: 'minedTestRootDisclosure',
        reason: 'mined-test-root not disclosed — a Cover-arm run must declare where the mined tests are rooted',
      });
    }
  } else {
    checks.minedTestRootDisclosure = {
      applicable: false,
      ok: true,
      reason: 'skipped — not a Cover-arm run (mined-test-root disclosure applies to Cover-arm runs only)',
    };
  }

  return { pass: refusals.length === 0, refusals, checks };
}
