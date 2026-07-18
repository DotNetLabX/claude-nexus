// kb-write.mjs — the harness's KB-write serializer (Increment 3, Step 4).
//
// Design §5 (KB ledger write — the Verify→Cover data seam):
//   Mine→Verify RETURNS consensusRules as a JS array (mine-verify.workflow.js:280-286) and does NOT
//   write the KB. Cover READS its rules from the KB FILE PATH (cover.workflow.js:193, :315-318).
//   The controller MUST serialize the verified rules into the consuming project's KB schema
//   (Rules / Key Files / Edge Cases / Relationships / Source + mutation HTML comments) BEFORE
//   invoking Cover — else Cover runs against stale or missing rules.
//
// Supersede-not-delete (design §5): a corrected rule supersedes; history is preserved. The helper
//   replaces ONLY the ## Rules section and the status footer; all other sections are unchanged.
//
// This module is a pure, deterministic helper — no filesystem I/O, no LLM. The controller calls
// it and then writes the result to the consuming project's KB file (the I/O is the controller's
// responsibility, not this helper's).
//
// Status ladder (design §5): verified → mutation-gated.
//   The helper writes `verified` status after Mine→Verify. The controller updates the footer to
//   `mutation-gated` after Cover passes all gates (Step 7 / operator-owed flip on all-gates-green).

// =================================================================================================
// stripLineRefs — fail-closed sanitizer: strip source line references from durable KB prose
// =================================================================================================
// The miner/consolidate prompts instruct "describe rules by SYMBOL/CONDITION, never by line number"
// — but a prompt is a request, not a guarantee. Line numbers (L35, "line 76", "lines 48/145") rot the
// moment the source file shifts, so they must NEVER reach the durable KB. This is the enforcement
// boundary: buildRulesSection runs every rule statement through it, so a stray ref a future miner
// emits despite the prompt is stripped before it lands. The structural `lines` field (used only for
// internal slicing) is untouched — only the human-facing `statement` prose is sanitized.
/**
 * Removes source line-number references from a rule statement, leaving the symbol/condition prose.
 * Strips `L<n>` tokens and `line(s) <n>[,/&- <n>]*` forms, then cleans up the punctuation artifacts
 * (empty parens, doubled commas, stray spaces) the removal leaves behind.
 *
 * @param {string} statement  The rule statement prose.
 * @returns {string}  The statement with line references removed.
 */
export function stripLineRefs(statement) {
  if (!statement) return statement;
  let s = statement;
  // "L35", "L145" line tokens (with any leading whitespace).
  s = s.replace(/\s*\bL\d+\b/g, '');
  // "line 76", "lines 48", "lines 48, 76", "lines 48/145", "lines 35-50" forms.
  s = s.replace(/\s*\blines?\s+\d+(?:\s*[,/&-]\s*\d+)*/gi, '');
  // Cleanup artifacts left by the removals.
  s = s.replace(/\(\s*[,;]\s*/g, '(');   // "( , " -> "("
  s = s.replace(/\s*,\s*,/g, ',');        // ", ," -> ","
  s = s.replace(/,\s*\)/g, ')');          // ", )" -> ")"
  s = s.replace(/\(\s*\)/g, '');          // "()" -> ""  (parenthetical that held only refs)
  s = s.replace(/\s+([.,;)])/g, '$1');    // space before punctuation
  s = s.replace(/\(\s+/g, '(');           // "( x" -> "(x"
  s = s.replace(/\s{2,}/g, ' ');          // collapse doubled spaces
  return s.trim();
}

// =================================================================================================
// buildVerifyExcerpt — sanitizes a skeptic's evidence string into the `  - verify: {excerpt}`
// sub-bullet payload (F6-MineMachineryHardening R2 / D2 row shape).
// =================================================================================================
// The skeptic's re-execution `evidence` is free text (the batched-verify agent's own prose) — it can
// carry embedded newlines, source line-number references, or run arbitrarily long. D2 pins the row
// shape: ONE excerpt line, sanitized the SAME WAY rule statements already are (stripLineRefs), never
// a raw transcript. Rules whose verdict path carries no evidence (transcribed rules — they have no
// verdict at all) get null here, which buildRulesSection/serializeKb read as "no sub-bullet".
/**
 * Builds the single-line, sanitized, length-capped excerpt for a rule's `  - verify: {excerpt}`
 * sub-bullet, or null when there is no evidence to render.
 *
 * @param {string|undefined|null} evidence  The skeptic's verdict evidence for this rule, if any.
 * @returns {string|null}  The sanitized excerpt (<=200 chars, single line), or null.
 */
export function buildVerifyExcerpt(evidence) {
  if (!evidence) return null;
  const collapsed = stripLineRefs(String(evidence).replace(/\s+/g, ' ').trim());
  if (!collapsed) return null;
  return collapsed.length > 200 ? collapsed.slice(0, 200) : collapsed;
}

// =================================================================================================
// F7 S1.3: structuralEvidenceOk — the registry-write structural evidence predicate (co-located here so
// the Verify→Cover KB serializer chokepoint OWNS the gate; this lib is inlined verbatim into the loop
// workflows, so it stays import-free — the predicate is copied, not imported).
// SOURCE OF TRUTH: plugins/nexus/skills/mine-verify-cover/tools/evidence-gate.mjs (target-agnostic,
// unit-tested in tests/unit/evidence-gate.test.mjs). Copied VERBATIM; keep in sync.
// =================================================================================================
// A JSON schema can assert non-empty; it cannot express "this is a re-execution excerpt, not a restatement
// of the claim". The LIVE drop enforcement runs at the mine-verify verdict chokepoint (evidence a rule
// fails the gate is never carried onto the rule, so it never reaches this serializer). Here the gate is
// PAIRED and available: `gateRuleEvidence` strips echo/empty/no-reexecution evidence from a rules array
// before serialization, for a caller that wants the code validator at the KB seam. The residual prose-only
// path — a sibling KB write with no orchestrating code — is prompt-tier (mine-family-core §Registry invariants).
const _EVIDENCE_LINE_REF_RE = /\bL\d+\b|\blines?\s+\d+|:\d+\b|@@/i;
const _EVIDENCE_REEXEC_RE = /["'`][^"'`\n]+["'`]|=>|->|→|==|!=|>=|<=|\breturn(?:s|ed)?\b|\boutput\b|\bactual\b|\bexpected\b|\bstdout\b|\bresult(?:s|ed)?\b|\bprint(?:s|ed)?\b|\byield(?:s|ed)?\b|\bevaluate(?:s|d)?\b|\bcomputed?\b|\bran\b|\bthrew\b|\bthrows\b/i;
function _evidenceNorm(s) { return String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim(); }

/**
 * @param {string|null|undefined} evidence  The skeptic's verdict evidence.
 * @param {string} [claim]  The claim it purports to re-execute (the rule statement); optional.
 * @returns {{pass:boolean, reason:'ok'|'empty'|'claim-echo'|'no-reexecution-content', detail:object}}
 */
export function structuralEvidenceOk(evidence, claim = '') {
  const raw = evidence == null ? '' : String(evidence);
  const e = _evidenceNorm(raw);
  if (e === '') return { pass: false, reason: 'empty', detail: { evidenceLength: 0 } };
  const hasLineRef = _EVIDENCE_LINE_REF_RE.test(raw);
  const hasReexecOutput = _EVIDENCE_REEXEC_RE.test(raw);
  const hasReexec = hasLineRef || hasReexecOutput;
  const c = _evidenceNorm(claim);
  const _evContains = (hay, needle) => (' ' + hay + ' ').includes(' ' + needle + ' ');
  const isEcho = c !== '' && (e === c || (!hasReexec && (_evContains(c, e) || _evContains(e, c))));
  if (isEcho) return { pass: false, reason: 'claim-echo', detail: { hasLineRef, hasReexecOutput } };
  if (!hasReexec) return { pass: false, reason: 'no-reexecution-content', detail: { hasLineRef, hasReexecOutput } };
  return { pass: true, reason: 'ok', detail: { hasLineRef, hasReexecOutput } };
}

/**
 * Gate a rules array at the KB-write chokepoint: a rule whose `evidence` fails the structural predicate
 * (against its own `statement` as the claim) has that evidence STRIPPED before serialization, so no
 * un-re-executed excerpt is written as a verified `- verify:` sub-bullet. Non-destructive to the rule
 * otherwise (only the `evidence` field is dropped). Returns the gated rules + the dropped findings.
 *
 * @param {{id:string, statement?:string, evidence?:string}[]} rules
 * @returns {{gatedRules:Array<object>, dropped:Array<{id:string, reason:string}>}}
 */
export function gateRuleEvidence(rules = []) {
  const dropped = [];
  const gatedRules = rules.map((r) => {
    if (!r?.evidence) return r;
    const gate = structuralEvidenceOk(r.evidence, r.statement ?? '');
    if (gate.pass) return r;
    dropped.push({ id: r.id, reason: gate.reason });
    const { evidence, ...rest } = r;
    return rest;
  });
  return { gatedRules, dropped };
}

// =================================================================================================
// buildRulesSection — renders the ## Rules section from a rules array
// =================================================================================================
/**
 * Renders the `## Rules` section of a KB entry from a verified rules array.
 * Each rule becomes a bullet: `- {id}: {statement}`, plus an indented `  - verify: {excerpt}`
 * sub-bullet when the rule carries verifier evidence (F6-MineMachineryHardening R2 / D2).
 * The section includes a brief preamble noting the verified status.
 *
 * @param {{id:string, kind:string, agreement:number, lines:string, statement:string, evidence?:string}[]} rules
 *   The consensus rules from Mine→Verify, in order.
 * @returns {string}  The rendered section (including the `## Rules` heading), without a trailing newline.
 */
export function buildRulesSection(rules, year) {
  const y = year ?? new Date().getFullYear(); // year param: caller passes when in a Workflow script (no Date allowed)
  const preamble =
    'Rules below are **verified** via the Mine→Verify pass (automated harness, ' +
    `${y} — ${rules.length} rule${rules.length !== 1 ? 's' : ''} confirmed).`;

  if (!rules.length) {
    return `## Rules\n\n${preamble}`;
  }

  const bullets = rules.map((r) => {
    const line = `- ${r.id}: ${stripLineRefs(r.statement)}`;
    const excerpt = buildVerifyExcerpt(r.evidence);
    return excerpt ? `${line}\n  - verify: ${excerpt}` : line;
  }).join('\n');
  return `## Rules\n\n${preamble}\n\n${bullets}`;
}

// =================================================================================================
// buildStatusFooter — renders the ---\n<!-- ... --> footer block
// =================================================================================================
/**
 * Renders the mutation-gate tracking footer block (design §5).
 * The footer is appended after the `## Source` section (after the `---` separator).
 *
 * @param {{mutationGated:boolean, date:string, runNote:string}} opts
 *   mutationGated: true when Cover has passed all gates; false at verified-but-not-gated status.
 *   date:          ISO date string for the last-stryker-run or verification date.
 *   runNote:       Free-text note (e.g. "88% reachable kill", "verified — not yet mutation-gated").
 * @returns {string}  The rendered footer block, starting with `---`.
 */
export function buildStatusFooter({ mutationGated, date, runNote }) {
  const gatedStr = mutationGated ? 'true' : 'false';
  const status   = mutationGated ? 'mutation-gated' : 'verified';
  return [
    '---',
    `<!-- status: ${status} — ${runNote} (${date}) -->`,
    `<!-- mutation-gated: ${gatedStr} -->`,
    `<!-- last-stryker-run: ${date} — ${runNote} -->`,
  ].join('\n');
}

// =================================================================================================
// supersedingRules — replaces the ## Rules section in an existing KB entry (supersede-not-delete)
// =================================================================================================
/**
 * Replaces the `## Rules` section and the status footer in an existing KB entry string, preserving
 * all other sections (header/intro, Key Files, Edge Cases, Relationships, Source). The old rules
 * are replaced by the new rules; nothing else is touched.
 *
 * @param {string} existingKb    Full text of the existing KB entry file.
 * @param {{id:string, kind:string, agreement:number, lines:string, statement:string}[]} rules
 *   The new verified rules to write.
 * @param {{date:string, mutationGated:boolean, runNote:string}} opts
 *   Date, mutation-gate status, and run note for the footer.
 * @returns {string}  The updated KB entry text.
 */
export function supersedingRules(existingKb, rules, { date, mutationGated, runNote }) {
  const text = existingKb ?? '';
  // Derive year from the ISO date string so callers never need to pass it separately and
  // buildRulesSection never falls back to new Date() (which throws in Workflow scripts).
  const year = date ? date.slice(0, 4) : undefined;

  // --- 1. Locate the ## Rules section boundaries -------------------------------------------------
  // Find `## Rules` and the next `## ` heading after it (or the `---` footer separator).
  const rulesHeadingIdx = text.indexOf('\n## Rules');
  if (rulesHeadingIdx === -1) {
    // No existing ## Rules section — insert after the first paragraph break.
    // Locate the first ## heading that is NOT Rules, or the --- separator.
    return _insertRulesIntoNew(text, rules, { date, mutationGated, runNote, year });
  }

  // Find the next section after ## Rules (next `\n## ` or `\n---`).
  const afterRules = rulesHeadingIdx + '\n## Rules'.length;
  const nextSectionMatch = text.slice(afterRules).match(/\n##\s+\w/);
  const footerSepMatch   = text.slice(afterRules).match(/\n---/);

  let nextSectionIdx;
  if (nextSectionMatch && footerSepMatch) {
    nextSectionIdx = afterRules + Math.min(nextSectionMatch.index, footerSepMatch.index);
  } else if (nextSectionMatch) {
    nextSectionIdx = afterRules + nextSectionMatch.index;
  } else if (footerSepMatch) {
    nextSectionIdx = afterRules + footerSepMatch.index;
  } else {
    nextSectionIdx = text.length;
  }

  // --- 2. Build the replacement ## Rules block ---------------------------------------------------
  const newRulesBlock = '\n' + buildRulesSection(rules, year);

  // --- 3. Locate the footer (--- separator) and replace it ---------------------------------------
  const footerIdx = text.lastIndexOf('\n---');
  const newFooter = '\n' + buildStatusFooter({ mutationGated, date, runNote });

  let result;
  if (footerIdx !== -1 && footerIdx >= nextSectionIdx) {
    // Normal case: footer exists after the rules section.
    const beforeRules  = text.slice(0, rulesHeadingIdx);
    const afterSection = text.slice(nextSectionIdx, footerIdx);
    result = beforeRules + newRulesBlock + afterSection + newFooter;
  } else {
    // Footer absent or before the rules section: replace up to end.
    const beforeRules  = text.slice(0, rulesHeadingIdx);
    const afterSection = text.slice(nextSectionIdx).replace(/\n---[\s\S]*$/, '');
    result = beforeRules + newRulesBlock + afterSection + '\n\n' + newFooter;
  }

  return result;
}

// --- Private helper (new-entry path) -------------------------------------------------------------
function _insertRulesIntoNew(text, rules, { date, mutationGated, runNote, year }) {
  // For a brand-new entry that has no ## Rules yet: insert the Rules section before
  // the first non-title ## heading, and append the footer.
  const firstSectionMatch = text.match(/\n## /);
  const insertAt = firstSectionMatch
    ? text.indexOf('\n## ')
    : text.length;
  const before = text.slice(0, insertAt);
  const after  = text.slice(insertAt).replace(/\n---[\s\S]*$/, '');
  const newRulesBlock = '\n\n' + buildRulesSection(rules, year);
  const footer = '\n\n---\n' + buildStatusFooter({ mutationGated, date, runNote });
  return before + newRulesBlock + after + footer;
}
