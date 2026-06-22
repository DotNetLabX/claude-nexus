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
// buildRulesSection — renders the ## Rules section from a rules array
// =================================================================================================
/**
 * Renders the `## Rules` section of a KB entry from a verified rules array.
 * Each rule becomes a bullet: `- {id}: {statement}`.
 * The section includes a brief preamble noting the verified status.
 *
 * @param {{id:string, kind:string, agreement:number, lines:string, statement:string}[]} rules
 *   The consensus rules from Mine→Verify, in order.
 * @returns {string}  The rendered section (including the `## Rules` heading), without a trailing newline.
 */
export function buildRulesSection(rules) {
  const preamble =
    'Rules below are **verified** via the Mine→Verify pass (automated harness, ' +
    `${new Date().getFullYear()} — ${rules.length} rule${rules.length !== 1 ? 's' : ''} confirmed).`;

  if (!rules.length) {
    return `## Rules\n\n${preamble}`;
  }

  const bullets = rules.map((r) => `- ${r.id}: ${r.statement}`).join('\n');
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

  // --- 1. Locate the ## Rules section boundaries -------------------------------------------------
  // Find `## Rules` and the next `## ` heading after it (or the `---` footer separator).
  const rulesHeadingIdx = text.indexOf('\n## Rules');
  if (rulesHeadingIdx === -1) {
    // No existing ## Rules section — insert after the first paragraph break.
    // Locate the first ## heading that is NOT Rules, or the --- separator.
    return _insertRulesIntoNew(text, rules, { date, mutationGated, runNote });
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
  const newRulesBlock = '\n' + buildRulesSection(rules);

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
function _insertRulesIntoNew(text, rules, { date, mutationGated, runNote }) {
  // For a brand-new entry that has no ## Rules yet: insert the Rules section before
  // the first non-title ## heading, and append the footer.
  const firstSectionMatch = text.match(/\n## /);
  const insertAt = firstSectionMatch
    ? text.indexOf('\n## ')
    : text.length;
  const before = text.slice(0, insertAt);
  const after  = text.slice(insertAt).replace(/\n---[\s\S]*$/, '');
  const newRulesBlock = '\n\n' + buildRulesSection(rules);
  const footer = '\n\n---\n' + buildStatusFooter({ mutationGated, date, runNote });
  return before + newRulesBlock + after + footer;
}
