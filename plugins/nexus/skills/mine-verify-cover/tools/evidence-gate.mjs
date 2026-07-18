// evidence-gate.mjs — the registry-write structural evidence predicate (SHIPPED, F7 S1.3, ADR-62).
//
// The skeptic protocol (references/mine-family-core.md §Skeptic protocol) requires a verdict row to
// carry the RE-EXECUTION output excerpt, and the orchestrator drops any verdict without one. A JSON
// schema can only assert `minLength: 1` (non-empty) — it CANNOT express "this is a re-execution excerpt,
// not a bare restatement of the claim". This predicate is that structural check, rejected in CODE at
// registry-write time.
//
// TARGET-AGNOSTIC, zero imports. A consuming prose sibling invokes it in place (ADR-62) wherever a
// registry row / verified rule is written.
//
// A verdict's evidence is REJECTED when it is:
//   - empty        — nothing to verify.
//   - claim-echo   — it merely restates the claim (no independent re-execution content).
//   - no-reexecution-content — it carries neither a line reference NOR a quoted/output re-execution
//                    artifact, so nothing shows a command was actually re-run.
//
// FEASIBILITY (F7 S1.3, developer-confirmed): a code-only heuristic for the claim-echo case is feasible
// in the MECHANICAL sense — identity, and containment with no re-execution markers. A full SEMANTIC
// paraphrase-echo (evidence reworded from the claim but adding a fake line ref) is NOT reliably
// code-detectable; that residual is prompt-tier (the skeptic prompt + the mine-family-core instruction),
// disclosed, not claimed here.

// A source LINE reference: `L268`, `line 76`, `lines 48-52`, a `:42` file:line tail, or a diff hunk `@@`.
const LINE_REF_RE = /\bL\d+\b|\blines?\s+\d+|:\d+\b|@@/i;

// A quoted / pasted RE-EXECUTION artifact: a quoted span, or an output/return/comparison marker that
// signals the evidence reports what running the code produced (not just what the rule claims).
const REEXEC_OUTPUT_RE =
  /["'`][^"'`\n]+["'`]|=>|->|→|==|!=|>=|<=|\breturn(?:s|ed)?\b|\boutput\b|\bactual\b|\bexpected\b|\bstdout\b|\bresult(?:s|ed)?\b|\bprint(?:s|ed)?\b|\byield(?:s|ed)?\b|\bevaluate(?:s|d)?\b|\bcomputed?\b|\bran\b|\bthrew\b|\bthrows\b/i;

function norm(s) {
  return String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Structural evidence predicate — is this verdict evidence a real re-execution excerpt, not a claim-echo?
 *
 * @param {string|null|undefined} evidence  The skeptic's verdict evidence string.
 * @param {string} [claim]  The claim the evidence purports to re-execute (the rule statement / quote).
 *        Optional — when omitted, the claim-echo check is skipped (only empty + no-reexecution apply).
 * @returns {{pass:boolean, reason:'ok'|'empty'|'claim-echo'|'no-reexecution-content', detail:object}}
 */
export function structuralEvidenceOk(evidence, claim = '') {
  const raw = evidence == null ? '' : String(evidence);
  const e = norm(raw);
  if (e === '') {
    return { pass: false, reason: 'empty', detail: { evidenceLength: 0 } };
  }

  const hasLineRef = LINE_REF_RE.test(raw);
  const hasReexecOutput = REEXEC_OUTPUT_RE.test(raw);
  const hasReexec = hasLineRef || hasReexecOutput;

  const c = norm(claim);
  // claim-echo (mechanical): identical to the claim, or wholly contained in it (word-boundary, so a stray
  // 1-char fragment does not false-match) with NO re-execution markers to distinguish it from a
  // restatement. The semantic paraphrase-echo is prompt-tier (above).
  const contains = (hay, needle) => (' ' + hay + ' ').includes(' ' + needle + ' ');
  const isEcho =
    c !== '' && (e === c || (!hasReexec && (contains(c, e) || contains(e, c))));
  if (isEcho) {
    return { pass: false, reason: 'claim-echo', detail: { hasLineRef, hasReexecOutput } };
  }

  if (!hasReexec) {
    return { pass: false, reason: 'no-reexecution-content', detail: { hasLineRef, hasReexecOutput } };
  }

  return { pass: true, reason: 'ok', detail: { hasLineRef, hasReexecOutput } };
}
