// spec-diff.mjs — pure helpers for the spec-driven Cover front-end (adhoc-SpecDrivenHarnessBuild, Inc 1).
//
// SOURCE OF TRUTH for the spec-driven direction's deterministic logic (unit-tested in
// tests/unit/spec-diff.test.mjs). The spec-cover.workflow.js INLINES these verbatim — the Workflow runtime
// parses a non-module context, so a static `import` is a syntax error and there is no fs to load a sibling
// module (the same reason cover.workflow.js inlines cover-gates.mjs). Keep the two copies in sync.
//
// These are the `cover-gates.mjs` shape: DETERMINISTIC, pure functions over plain data. No LLM, no .NET,
// no fs. The ORCHESTRATOR computes them — no agent self-reports a classification (design §6 posture).
//
//   decideLocation(rule)                     — Step 2 / D1 / AC-2: rule→code location seam
//   classifyRule(specRule, codeRules)        — Step 4 / ADR-B / AC-4: the three-axis diff
//   labelRed({ expected, actual, ruleOrder }) — Step 5 / D3 / AC-5: the deterministic 5-case FP-labeler
//   RULE_ORDER                               — the validator's fixed 7-rule positional firing order

// =================================================================================================
// decideLocation — rule→code location seam (Step 2 / D1 / AC-2)
// =================================================================================================
/**
 * Attestation-first rule→code location decision. PURE — it decides which BRANCH to take; the workflow
 * runs the guided-miner agent for `miner-needed` rules (the LLM call is not in this helper).
 *
 * @param {{id?:string, statement?:string, codeAttestation?:string}} rule
 * @returns {{source:string, location:(string|null), route:string}}
 *   source 'attestation' + route 'located'      — the golden file:line attestation is present, use it
 *   source 'miner'       + route 'miner-needed' — no attestation; the workflow must run the guided miner
 */
export function decideLocation(rule) {
  const attestation = rule?.codeAttestation;
  if (attestation && String(attestation).trim() !== '') {
    return { source: 'attestation', location: String(attestation).trim(), route: 'located' };
  }
  return { source: 'miner', location: null, route: 'miner-needed' };
}

/**
 * Classify what the guided-miner agent returned for a `miner-needed` rule. PURE — the LLM call and the
 * code-containment check happen in the workflow (which has the agents); this fn decides the route from
 * their results. The `NO-CODE-FOUND` sentinel is NOT an error: it is the first candidate sin-of-omission
 * (`spec ∧ ¬code`), recorded as such. A miner-returned `file:line` whose code does NOT contain the rule is
 * a mis-anchor → `needs-triage` (AC-2 location-correctness caveat — the LLM locator is ~53-56% accurate),
 * never a silent mis-anchor.
 *
 * @param {{minerLocation:string, codeContainsRule?:boolean}} r
 *   minerLocation     — the miner agent's output: a `file:line` string, or the literal `NO-CODE-FOUND`.
 *   codeContainsRule  — operator/verifier confirmation that the located code actually encodes the rule.
 * @returns {{route:string, location:(string|null), isError:boolean, label?:string}}
 */
export function evaluateMinerResult(r) {
  const loc = (r?.minerLocation ?? '').trim();
  if (loc === '' || loc === 'NO-CODE-FOUND') {
    return { route: 'code-missing', location: null, isError: false };
  }
  if (r?.codeContainsRule === true) {
    return { route: 'located', location: loc, isError: false };
  }
  // A miner-returned location whose code does NOT contain the rule — a mis-anchor (AC-2). Never silently
  // accept it; route to needs-triage for operator verification.
  return { route: 'needs-triage', location: loc, isError: false, label: 'miner-mislocation' };
}

// =================================================================================================
// classifyRule + diffRules — the three-axis diff (Step 4 / ADR-B / AC-4)
// =================================================================================================
// Rules match by NAME (the Q6 caveat — key off the rule name, never a GOLD-id ordinal). The three axes:
//   spec-not-code   `spec ∧ ¬code`  — the spec rule has no matching code rule (missing feature — headline)
//   code-not-spec   `code ∧ ¬spec`  — the code rule has no matching spec rule (undocumented / enshrined bug)
//   both-divergent  `both` w/ boundary mismatch (a boundary disagreement)
// A matched pair whose boundaries AGREE is `both-agree` (not a divergence) — kept as a fourth bucket so the
// "every rule in exactly one axis" accounting (AC-4) is complete and a same-boundary match is not mislabeled.

function ruleKey(r) {
  return (r?.ruleName ?? r?.id ?? '').trim();
}

/**
 * Classify ONE spec rule against the code-rule set. PURE.
 * @param {{id?:string, ruleName:string, boundary?:string}} specRule
 * @param {{ruleName:string, boundary?:string}[]} codeRules
 * @returns {{axis:string, specRule:object, codeRule:(object|null)}}
 */
export function classifyRule(specRule, codeRules) {
  const list = codeRules ?? [];
  const match = list.find((c) => ruleKey(c) !== '' && ruleKey(c) === ruleKey(specRule));
  if (!match) return { axis: 'spec-not-code', specRule, codeRule: null };
  // Matched by name — divergent only if both carry a boundary AND they differ.
  const sb = specRule?.boundary;
  const cb = match?.boundary;
  if (sb !== undefined && cb !== undefined && String(sb) !== String(cb)) {
    return { axis: 'both-divergent', specRule, codeRule: match };
  }
  return { axis: 'both-agree', specRule, codeRule: match };
}

/**
 * Run the diff in both directions and guarantee EVERY rule lands in exactly one axis (AC-4).
 * Each `spec ∧ ¬code` item carries either its red test (Step 3) or a `code-missing` note (Step 2
 * `NO-CODE-FOUND`). The serialized form puts the `spec ∧ ¬code` set FIRST (the headline ordering).
 * @param {{id?:string, ruleName:string, boundary?:string, redTest?:any, locationRoute?:string}[]} specRules
 * @param {{ruleName:string, boundary?:string}[]} codeRules
 */
export function diffRules(specRules, codeRules) {
  const specs = specRules ?? [];
  const codes = codeRules ?? [];
  const specNotCode = [];
  const bothDivergent = [];
  const bothAgree = [];

  for (const s of specs) {
    const { axis, codeRule } = classifyRule(s, codes);
    if (axis === 'spec-not-code') {
      // headline item — carries a red test, else a code-missing note.
      const carries = s.redTest ? 'red-test' : 'code-missing';
      specNotCode.push({ ...s, ruleName: ruleKey(s), axis, carries });
    } else if (axis === 'both-divergent') {
      bothDivergent.push({ ...s, ruleName: ruleKey(s), axis, codeRule });
    } else {
      bothAgree.push({ ...s, ruleName: ruleKey(s), axis, codeRule });
    }
  }

  // code ∧ ¬spec — code rules with no matching spec rule (the complementary direction).
  const specNames = new Set(specs.map(ruleKey).filter((k) => k !== ''));
  const codeNotSpec = codes
    .filter((c) => ruleKey(c) !== '' && !specNames.has(ruleKey(c)))
    .map((c) => ({ ...c, ruleName: ruleKey(c), axis: 'code-not-spec' }));

  const serialized = serializeDiff({ specNotCode, codeNotSpec, bothDivergent, bothAgree });
  return { specNotCode, codeNotSpec, bothDivergent, bothAgree, serialized };
}

/**
 * Serialize the three-axis diff as markdown with the `spec ∧ ¬code` set FIRST (AC-4 headline ordering).
 * Pure string builder — no fs (the workflow's report agent writes the file).
 */
export function serializeDiff({ specNotCode = [], codeNotSpec = [], bothDivergent = [], bothAgree = [] }) {
  const fmtSpecNotCode = (r) =>
    `- **${r.ruleName}** (${r.id ?? 'no-id'}) — ${r.carries === 'red-test' ? 'red test attached' : 'code-missing (sin of omission)'}`;
  const fmtDivergent = (r) =>
    `- **${r.ruleName}** (${r.id ?? 'no-id'}) — spec boundary \`${r.boundary ?? '?'}\` vs code \`${r.codeRule?.boundary ?? '?'}\``;
  const fmtCodeNotSpec = (r) => `- **${r.ruleName}** — undocumented behavior / enshrined bug`;
  const fmtAgree = (r) => `- **${r.ruleName}** (${r.id ?? 'no-id'}) — spec and code agree`;
  return [
    `## spec ∧ ¬code (missing features — headline)`,
    specNotCode.length ? specNotCode.map(fmtSpecNotCode).join('\n') : '_None._',
    ``,
    `## code ∧ ¬spec (undocumented behavior / enshrined bug)`,
    codeNotSpec.length ? codeNotSpec.map(fmtCodeNotSpec).join('\n') : '_None._',
    ``,
    `## both-divergent (boundary disagreement)`,
    bothDivergent.length ? bothDivergent.map(fmtDivergent).join('\n') : '_None._',
    ``,
    `## both-agree (spec and code agree)`,
    bothAgree.length ? bothAgree.map(fmtAgree).join('\n') : '_None._',
  ].join('\n');
}

// =================================================================================================
// labelRed + RULE_ORDER — the deterministic 5-case FP-labeler (Step 5 / D3 / AC-5)
// =================================================================================================
// The validator's FIXED positional firing order (GeneratedSqlValidator.cs:227-303). Validate is
// first-violation-wins over these 7 rules; it returns the FIRST violated name or null. This is the
// POSITIONAL list — NOT the 12-id golden catalog (the Q6 caveat): NoStrayLiteralThreshold here is Rule 5
// (index 4) yet is GOLD-08; RelationPolicy is Rule 2 (index 1) yet is GOLD-05. Key the labeler off this
// list / the rule name, never a GOLD-id ordinal.
export const RULE_ORDER = [
  'SingleSelect',
  'RelationPolicy',
  'CategoryIdPresent',
  'NoRelativeDateUnderAnchoring',
  'NoStrayLiteralThreshold',
  'BadReportsFilterPresent',
  'ReportIdsFirst',
];

/**
 * Classify a spec-driven red by comparing the EXPECTED rule outcome vs the validator's ACTUAL first-fired
 * rule against the fixed rule order. PURE — no production change, no "re-run with the earlier rule disabled"
 * (which would need a prod edit and fail char_pin). Implements the spec's 5-case table (§FP-labeler):
 *
 *   1 expected R, actual EARLIER than R        → interaction-artifact  → needs-triage (auto-resolved)
 *   2 expected R, actual LATER than R          → under-enforce         → candidate-bug
 *   3 expected R, actual okValue (pass)        → sin-of-omission       → candidate-bug
 *   4 expected okValue (pass), actual a rule   → over-rejection        → candidate-bug, TAGGED needs-triage
 *   5 errored / fixture un-constructable       → errored               → needs-triage
 *
 * Only case 1 is mechanically auto-resolved. Case 4 is the L272 shape AND the fixture-artifact shape —
 * routed to the candidate-bug queue *tagged* needs-triage, never auto-confirmed real-vs-artifact (ADR-D).
 *
 * `okValue` (ADR-E) is the per-target pass sentinel: null for SQL (Validate returns string?), "Valid" for
 * Slack (SignatureVerificationResult enum). Cases 3 and 4 compare against `okValue`, not a literal null, so
 * a non-null pass sentinel (Slack's "Valid") is handled correctly.
 *
 * @param {{expected:(string|null), actual:(string|null), ruleOrder?:string[], okValue?:(string|null), errored?:boolean}} r
 * @returns {{label:string, route:string, autoResolved?:boolean, needsTriage?:boolean, detail:string}}
 */
export function labelRed(r) {
  const order = r?.ruleOrder ?? RULE_ORDER;
  // okValue: the per-target pass sentinel (ADR-E). Defaults to null (SQL: Validate returns null on pass).
  // For Slack: "Valid" (SignatureVerificationResult.Valid). Compare cases 3+4 against okValue, not literal null.
  const okValue = r?.okValue !== undefined ? r.okValue : null;
  const expected = r?.expected ?? null;
  const actual = r?.actual ?? null;

  // Case 5 — the test errored or the fixture couldn't be constructed (the spike ARTIFACT-04 shape).
  if (r?.errored === true) {
    return { label: 'errored', route: 'needs-triage', detail: 'test errored / fixture un-constructable — not classifiable' };
  }

  // Case 4 — expected a PASS (okValue), but a rule fired: over-rejection. The L272 shape. Candidate-bug
  // queue, tagged needs-triage (real boundary bug OR a #2 fixture-fidelity artifact — not auto-decided).
  if (expected === okValue && actual !== okValue) {
    return {
      label: 'over-rejection',
      route: 'candidate-bug',
      needsTriage: true,
      detail: `code rejected a spec-valid input with "${actual}" (over-reject — real-or-fixture, not auto-decided)`,
    };
  }

  // Case 3 — expected a rejection by R, but the validator passed (okValue): sin of omission (spec ∧ ¬code).
  if (expected !== okValue && actual === okValue) {
    return { label: 'sin-of-omission', route: 'candidate-bug', detail: `code passed an input the spec says "${expected}" should reject (spec ∧ ¬code)` };
  }

  // expected R and actual a (different) rule — compare positions in the fixed order.
  const ei = order.indexOf(expected);
  const ai = order.indexOf(actual);
  // Case 1 — an EARLIER rule fired before R could (an interaction artifact: the earlier rule masked R).
  if (ai !== -1 && ei !== -1 && ai < ei) {
    return { label: 'interaction-artifact', route: 'needs-triage', autoResolved: true, detail: `"${actual}" (rule ${ai + 1}) fired before "${expected}" (rule ${ei + 1}) could — earlier rule masked R` };
  }
  // Case 2 — a LATER rule fired: R should have fired but a later one did (R under-enforces).
  if (ai !== -1 && ei !== -1 && ai > ei) {
    return { label: 'under-enforce', route: 'candidate-bug', detail: `"${expected}" (rule ${ei + 1}) should have fired but "${actual}" (rule ${ai + 1}) did — R under-enforces` };
  }
  // Defensive: an unknown rule name on either side (not in the order) — route to needs-triage rather than
  // silently mislabel. (Not one of the 5 canonical cases — a name typo or an off-catalog rule.)
  return { label: 'unrecognized-rule', route: 'needs-triage', detail: `expected="${expected}" actual="${actual}" — a rule name is not in the known order` };
}
