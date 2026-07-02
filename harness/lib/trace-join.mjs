// trace-join.mjs — the spec-rule → class(es) mapping helper (adhoc-SddCoverageLoop, Step 4).
//
// Answers "which class(es) implement this spec rule?" so the two blind arms (spec-mine, code-mine) compare on
// the same subject (tech-spec "The trace-join — the crux"). THREE SOURCES, in priority order:
//
//   1. plan-ref  — anchored on a slug's plan/impl `Satisfies:` file citation (`create-implementation-plan`
//                  mandates step→file paths, so this is the convention-guaranteed anchor). Trusted directly.
//   2. manual    — a human-confirmed map entry (the BugRatio pilot's case: SR is a ported class with no nexus
//                  plan chain — `trace-map-bugratio.md`). Trusted directly (a human already confirmed it).
//   3. locator   — the spec-cover guided-miner's rule→code locator, ~53-56% accurate (spec-diff.mjs:42) —
//                  FALLBACK ONLY. Its confidence gates acceptance: below `confidenceThreshold`, or no match
//                  at all, routes to a HUMAN QUEUE — never silently accepted (tech-spec AC-3 / ADR-B).
//
// PURE — no LLM call, no fs. The orchestrator (or an operator script) supplies the plan-ref citation / manual
// map entry / locator result as plain data; this module only decides which one wins and whether the result
// is trustworthy enough to accept.

const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;

/**
 * @param {{
 *   ruleId: string,
 *   planRef?: {classes:string[], step?:number, file?:string},
 *   manualEntry?: {classes:string[], note?:string},
 *   locatorResult?: {classes:string[], confidence?:number},
 *   confidenceThreshold?: number,
 * }} r
 * @returns {{ruleId:string, classes:string[], source:string, confidence:number, route:string}}
 */
export function traceRule(r) {
  const ruleId = r?.ruleId ?? '';
  const threshold = r?.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;

  // SOURCE 1 — plan-ref: the convention-guaranteed anchor. Trusted directly, no confidence gate.
  const planRef = r?.planRef;
  if (planRef && Array.isArray(planRef.classes) && planRef.classes.length > 0) {
    return { ruleId, classes: planRef.classes, source: 'plan-ref', confidence: 1, route: 'accepted' };
  }

  // SOURCE 2 — manual: a human-confirmed map entry. Trusted directly (a human already confirmed it).
  const manualEntry = r?.manualEntry;
  if (manualEntry && Array.isArray(manualEntry.classes) && manualEntry.classes.length > 0) {
    return { ruleId, classes: manualEntry.classes, source: 'manual', confidence: 1, route: 'accepted' };
  }

  // SOURCE 3 — locator: the spec-cover guided-miner FALLBACK (~53-56% accurate). Never silently trusted —
  // gated by confidenceThreshold. Handled by a separate branch below (needs the confidence gate + no-match
  // case), so it is NOT folded into this early-return chain the same way plan-ref/manual are.
  const locatorResult = r?.locatorResult;
  if (locatorResult && Array.isArray(locatorResult.classes) && locatorResult.classes.length > 0) {
    const confidence = locatorResult.confidence ?? 0;
    if (confidence >= threshold) {
      return { ruleId, classes: locatorResult.classes, source: 'locator', confidence, route: 'accepted' };
    }
    // Below threshold — the locator's guess is recorded (for triage) but NOT auto-accepted.
    return { ruleId, classes: locatorResult.classes, source: 'locator', confidence, route: 'human-queue' };
  }

  // No plan-ref, no manual, no locator match at all — nothing to route on; straight to the human queue.
  return { ruleId, classes: [], source: 'none', confidence: 0, route: 'human-queue' };
}
