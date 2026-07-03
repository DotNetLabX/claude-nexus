// merge-rules.mjs — the M1/M3 merge/triage engine (adhoc-SddMergeGen, Step 1).
//
// Content-keyed, granularity-tolerant matching of a spec-rules.md rule set against a code-arm KB rule
// set. Match on symbol + condition content (never names or counts; many-to-one both ways) — composes
// with harness/lib/rule-crosswalk.mjs's `reconcileRuleSets` (the canonical-name rewrite that fixes the
// empty-intersection gap), does NOT replace it: the crosswalk runs FIRST, then this lib's own matching
// keys on the reconciled `ruleName`.
//
// Output = the FIVE delta buckets (proposal §A.1 condition 5 / SR-addendum): overlap-confirmed |
// spec-only-other-layer | spec-only-divergent | spec-only-unimplemented | code-only-precision. Every
// ELIGIBLE spec rule (verdict !== 'ambiguous') lands in exactly one of the four spec-touching buckets;
// every code rule with no eligible-spec match lands in code-only-precision. A matched code rule is
// attached to its spec rule's bucket entry (`.codeRule`) rather than getting a separate top-level entry
// — it is represented, not orphaned.
//
// `spec-only-divergent` rows carry the distinct `divergence-pending-triage` STATE plus the EVIDENCE PAIR
// (spec citation + code attestation) — neither candidate-bug nor discard (SR-28/SR-23 precedent) — and a
// `suspect-stale-spec` TAG when the code-arm KB attributes the behavior to a source whose date POST-dates
// the mined spec (condition 6 — the spec predates the source, so the spec is the stale one).
//
// `ambiguous`-verdicted spec rules are EXCLUDED from the five buckets — routed to `specRepair` instead
// (never silently dropped; condition 2).
//
// M3 dispositions (add/carried/re-open/supersede/retire — the tech-spec's three-way reconciliation
// table) are NOT computed here: that table is keyed on PRIOR C2 registry state, which this pure,
// stateless triage has no access to (no fs). Disposition assignment is Step 2's job (rules-registry.mjs),
// which reads the existing registry rows and maps this lib's bucket output onto the M1/M3 table.
//
// PURE — no fs, no LLM. Consumes already-mined rule arrays; produces the triage in memory.

import { reconcileRuleSets } from './rule-crosswalk.mjs';

export const DELTA_BUCKETS = [
  'overlap-confirmed',
  'spec-only-other-layer',
  'spec-only-divergent',
  'spec-only-unimplemented',
  'code-only-precision',
];

function ruleKey(r) {
  return (r?.ruleName ?? r?.id ?? '').trim();
}

// A spec/code rule pair "diverges" when both state a boundary and the boundaries differ (string
// compare — never coerce, an operator change like `>` vs `>=` must not silently equal).
function boundaryDiverges(specRule, codeRule) {
  const sb = specRule?.boundary;
  const cb = codeRule?.boundary;
  if (sb === undefined || cb === undefined) return false;
  return String(sb) !== String(cb);
}

// suspect-stale-spec: the code-arm KB attributes the behavior to a source (e.g. a settings/feature
// flag) whose date POST-dates the spec that was mined — the spec predates the source, so the spec
// (not the code) is the stale artifact (SR-23's DefaultSpPerBug case).
function isStaleSpec(specRule, codeRule, specDate) {
  const srcDate = codeRule?.attributedSource?.date;
  const mineDate = specDate ?? specRule?.specDate;
  if (!srcDate || !mineDate) return false;
  return srcDate > mineDate; // ISO 8601 (YYYY-MM-DD) strings compare lexicographically = chronologically
}

/**
 * Triage a spec-arm rule set against a code-arm rule set into the five delta buckets.
 *
 * @param {{specRules?:Array<object>, codeRules?:Array<object>, crosswalkMap?:Record<string,string>,
 *   targetLayer?:string, specDate?:string}} opts
 *   targetLayer: the plan's target surface layer (domain-calc|api|ui|settings) — a spec-only rule whose
 *     `layer` differs routes to `spec-only-other-layer` instead of `spec-only-unimplemented` (it looks
 *     code-less only because the code arm never covered that layer). Omitted → every spec-only rule is
 *     treated as `spec-only-unimplemented` (no layer filter applied).
 *   specDate: the spec's mined date (ISO), used by the stale-spec check when a rule has no own `specDate`.
 * @returns {{buckets: Record<string, Array<object>>, specRepair: Array<object>}}
 */
export function triageRuleSets({ specRules = [], codeRules = [], crosswalkMap = {}, targetLayer, specDate } = {}) {
  const { specRules: specR, codeRules: codeR } = reconcileRuleSets({ specRules, codeRules, crosswalkMap });

  const buckets = {
    'overlap-confirmed': [],
    'spec-only-other-layer': [],
    'spec-only-divergent': [],
    'spec-only-unimplemented': [],
    'code-only-precision': [],
  };
  const specRepair = [];

  // Index code rules by canonical ruleName — many-to-one tolerant (multiple code rules can share a key).
  const codeByName = new Map();
  for (const c of codeR) {
    const key = ruleKey(c);
    if (!key) continue;
    if (!codeByName.has(key)) codeByName.set(key, []);
    codeByName.get(key).push(c);
  }
  const matchedCodeKeys = new Set();

  for (const s of specR) {
    if (s?.verdict === 'ambiguous') {
      specRepair.push({ ...s, reason: s.reason ?? s.ambiguousReason ?? 'ambiguous verdict — spec does not commit' });
      continue;
    }

    const key = ruleKey(s);
    const matches = key ? (codeByName.get(key) ?? []) : [];

    if (matches.length === 0) {
      if (targetLayer !== undefined && s?.layer !== undefined && s.layer !== targetLayer) {
        buckets['spec-only-other-layer'].push({ ...s, bucket: 'spec-only-other-layer' });
      } else {
        buckets['spec-only-unimplemented'].push({ ...s, bucket: 'spec-only-unimplemented' });
      }
      continue;
    }

    matchedCodeKeys.add(key);
    // Many-to-one tolerant: agree if ANY matching code rule agrees on boundary.
    const agreeing = matches.find((c) => !boundaryDiverges(s, c));
    if (agreeing) {
      buckets['overlap-confirmed'].push({ ...s, bucket: 'overlap-confirmed', codeRule: agreeing });
    } else {
      const codeRule = matches[0];
      const entry = {
        ...s,
        bucket: 'spec-only-divergent',
        state: 'divergence-pending-triage',
        codeRule,
        evidencePair: {
          specCitation: s.citation ?? s.statement ?? s.ruleName,
          codeAttestation: codeRule.attestation ?? codeRule.lines ?? codeRule.id,
        },
      };
      if (isStaleSpec(s, codeRule, specDate)) {
        entry.tags = [...(entry.tags ?? []), 'suspect-stale-spec'];
      }
      buckets['spec-only-divergent'].push(entry);
    }
  }

  // Code rules with no eligible-spec match at all → code-only-precision (candidate for spec/KB enrichment).
  for (const c of codeR) {
    const key = ruleKey(c);
    if (!key || matchedCodeKeys.has(key)) continue;
    buckets['code-only-precision'].push({ ...c, bucket: 'code-only-precision' });
  }

  return { buckets, specRepair };
}
