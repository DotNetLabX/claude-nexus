// spec-diff-calc.mjs — the calculator analog of spec-diff.mjs's labelRed (adhoc-SddCoverageLoop, Step 2).
//
// spec-diff.mjs's labelRed classifies a VIOLATION-IDENTITY red against a fixed positional rule order
// (RULE_ORDER — first-violation-wins validator shape). BugRatioAnalyzer has no such surface: its rules
// assert VALUES against a target field (boolean / numeric / streak-integer), per the golden-shaped spec-oracle
// intermediate (spec-rules-bugratio.md, Step 1). This module is the calculator-shaped comparator + labeler:
//
//   outcomeMatches({ kind, expected, actual, epsilon }) — the redness determiner. Numeric outcomes need an
//     epsilon tolerance (never strict `===` — floating-point ratio-of-totals arithmetic never lands on an
//     exact literal); boolean/streak-integer are exact-equality kinds. Tolerance is entirely THIS module's
//     concern (plan Step 2) — diffRules/classifyRule (spec-diff.mjs) stay unchanged and key by name+boundary.
//
//   labelOutcome({ kind, expected, actual, epsilon, errored }) — classify a RED (outcomeMatches === false)
//     into a label + route, mirroring spec-diff.mjs's labelRed shape ({ label, route, detail, ... }) so the
//     calculator workflow (spec-cover-calc.workflow.js, Step 3) quarantines/reports reds the same way the
//     validator front-end does. There is no rule-order to compare positions against, so the case table is
//     the calculator analog of labelRed's cases 3/4/5 (sin-of-omission / value-divergence / errored) — cases
//     1/2 (earlier/later-fired) do not apply (no positional firing order exists for a value assertion).
//
// SOURCE OF TRUTH for the calculator direction's deterministic logic (unit-tested in
// tests/unit/spec-diff-calc.test.mjs). Reused (inlined verbatim, same Workflow-runtime reason as spec-diff.mjs)
// by harness/spec-cover-calc.workflow.js — the runtime parses a non-module context, so a static `import` is a
// syntax error. Keep the two copies in sync (scripts/selfcheck.mjs "spec-diff inline-copy sync" check, Step 3).

const OUTCOME_KINDS = new Set(['boolean', 'numeric', 'streak-integer']);
const DEFAULT_EPSILON = 1e-9;

// =================================================================================================
// outcomeMatches — the redness determiner (kind-aware; numeric needs epsilon tolerance, not ===)
// =================================================================================================
/**
 * PURE. Decide whether an actual outcome matches an expected outcome, per the rule's outcome kind.
 * @param {{kind:string, expected:*, actual:*, epsilon?:number}} r
 * @returns {boolean}
 */
export function outcomeMatches(r) {
  const kind = r?.kind;
  const expected = r?.expected;
  const actual = r?.actual;
  if (kind === 'numeric') {
    const eps = r?.epsilon !== undefined && r?.epsilon !== null ? r.epsilon : DEFAULT_EPSILON;
    if (typeof expected !== 'number' || typeof actual !== 'number' || Number.isNaN(expected) || Number.isNaN(actual)) {
      return false;
    }
    return Math.abs(actual - expected) <= eps;
  }
  // boolean / streak-integer (and any unrecognized kind, defensively) — exact equality.
  return expected === actual;
}

// =================================================================================================
// labelOutcome — classify a RED (outcomeMatches === false). PURE. No rule-order surface exists for a
// value assertion, so this is the calculator analog of labelRed's cases 3/4/5 only (sin-of-omission /
// value-divergence / errored) — cases 1/2 (earlier/later-fired) do not apply.
// =================================================================================================
/**
 * @param {{kind:string, expected:*, actual:*, epsilon?:number, errored?:boolean}} r
 * @returns {{label:string, route:string, detail:string, direction?:string}}
 */
export function labelOutcome(r) {
  const kind = r?.kind;
  const expected = r?.expected ?? null;
  const rawActual = r?.actual;

  // CASE errored — the test errored or the fixture couldn't be constructed (mirrors labelRed case 5).
  if (r?.errored === true) {
    return { label: 'errored', route: 'needs-triage', detail: 'test errored / fixture un-constructable — not classifiable' };
  }

  // CASE code-missing — the target field was never produced (null/undefined), NOT a legitimate falsy
  // value (`false`/`0`). Mirrors labelRed case 3 (sin-of-omission): the spec asserts a value the code
  // arm never computed (spec ∧ ¬code — a missing-feature signal, distinct from a wrong-value divergence).
  if (rawActual === null || rawActual === undefined) {
    return { label: 'code-missing', route: 'candidate-bug', detail: `code never produced a value for this rule's target field (spec ∧ ¬code — sin of omission); spec expected ${JSON.stringify(expected)}` };
  }

  const actual = rawActual;
  const detail = `${kind} outcome diverged: expected ${JSON.stringify(expected)}, actual ${JSON.stringify(actual)}`;
  // Direction (over/under) is meaningful only for orderable kinds (numeric/streak-integer) — a boolean
  // divergence has no "more/less" axis, so it carries no direction field.
  if ((kind === 'numeric' || kind === 'streak-integer') && typeof expected === 'number' && typeof actual === 'number') {
    const direction = actual > expected ? 'over' : actual < expected ? 'under' : undefined;
    return { label: 'value-divergence', route: 'candidate-bug', detail, direction };
  }
  return { label: 'value-divergence', route: 'candidate-bug', detail };
}
