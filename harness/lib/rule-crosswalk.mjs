// rule-crosswalk.mjs — the rule-identity reconciliation crosswalk (adhoc-SddCoverageLoop, Step 7).
//
// THE FIX FOR THE EMPTY-INTERSECTION GAP: spec-diff.mjs's classifyRule/diffRules match rules by NAME
// (ruleKey = ruleName ?? id), but the two blind arms emit DIFFERENT identities — the code arm's autonomous
// `BR-1, BR-2…` (mine-verify-cover's consensus rules carry no ruleName, just an ordinal id), the spec arm's
// authored names (spec-rules-bugratio.md's SR-1..4 carry `ruleName: "BugRatioPercent"` etc.). Without
// reconciliation, `both-agree` is empty BY CONSTRUCTION (the two id spaces never collide) and `code∧¬spec` is
// falsely inflated (every code rule looks unmatched). This module rewrites both rule sets' `ruleName` from a
// human-confirmed canonical-name crosswalk map — a PURE, POST-HOC transform, applied only AFTER both blind
// arms have already produced their rule sets. The map itself is NEVER an input to either arm's run (Step 5's
// `checkIndependence` forbids it in both manifests) — reconciliation happens outside the blind runs,
// preserving AC-1.
//
// PURE — no fs, no LLM. The crosswalk MAP itself is authored by a human (operator, post-hoc, Step 7 "Files
// (operator)"), after inspecting both arms' actual output; this module only APPLIES an already-authored map.

/**
 * Rewrite ONE rule set's `ruleName` via the canonical-name crosswalk map. PURE — does not mutate the input.
 * Looks up the map by the rule's `id` first (the code arm's raw identity, e.g. "BR-2"), then by its existing
 * `ruleName` (in case the spec arm's authored name itself needs re-canonicalizing); a rule with no map entry
 * under either key passes through with its existing `ruleName` UNCHANGED (no correspondence found — it will
 * correctly land in `spec-not-code` / `code-not-spec` rather than crash or silently disappear).
 * @param {Array<{id?:string, ruleName?:string}>} rules
 * @param {Record<string,string>} crosswalkMap
 * @returns {Array<object>} a NEW array of NEW rule objects with `ruleName` rewritten where mapped
 */
export function applyCrosswalk(rules, crosswalkMap) {
  const map = crosswalkMap ?? {};
  return (rules ?? []).map((r) => {
    const canonical = map[r?.id] ?? map[r?.ruleName] ?? r?.ruleName;
    return { ...r, ruleName: canonical };
  });
}

/**
 * Align BOTH differently-keyed rule sets to canonical names via the SAME crosswalk map, in one call — the
 * direct fix for the empty-intersection gap: after this, `spec-diff.mjs`'s `diffRules`/`classifyRule` (keyed
 * by `ruleName`) can match corresponding rules across the two blind arms.
 * @param {{specRules?:Array<object>, codeRules?:Array<object>, crosswalkMap?:Record<string,string>}} r
 * @returns {{specRules:Array<object>, codeRules:Array<object>}}
 */
export function reconcileRuleSets(r) {
  return {
    specRules: applyCrosswalk(r?.specRules, r?.crosswalkMap),
    codeRules: applyCrosswalk(r?.codeRules, r?.crosswalkMap),
  };
}
