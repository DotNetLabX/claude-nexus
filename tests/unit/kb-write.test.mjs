// kb-write.test.mjs — TDD unit suite for harness/lib/kb-write.mjs (Inc 3, Step 4).
//
// Design §5: the controller must serialize verified rules into the consuming project's KB schema
// (Rules / Key Files / Edge Cases / Relationships / Source + mutation HTML comments) BEFORE invoking
// Cover — else Cover reads stale/missing rules. This helper is the Verify→Cover data seam.
//
// The serializer is a DETERMINISTIC, pure function over the rules array — no LLM, no filesystem,
// no side effects. Fully testable offline.
//
// Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRulesSection,
  buildStatusFooter,
  supersedingRules,
  stripLineRefs,
  buildVerifyExcerpt,
} from '../../harness/lib/kb-write.mjs';
import { serializeKb } from '../../harness/lib/serialize-kb.mjs';

// --- Fixtures ------------------------------------------------------------------------------------
const RULES_1 = [
  { id: 'BR-1', kind: 'interpretive', agreement: 3, lines: '10-20', statement: 'A is true when X' },
  { id: 'BR-2', kind: 'transcribed',  agreement: 2, lines: '25-30', statement: 'B = X + Y' },
];

const RULES_2 = [
  { id: 'BR-1', kind: 'interpretive', agreement: 3, lines: '10-20', statement: 'Updated rule A' },
  { id: 'BR-2', kind: 'transcribed',  agreement: 2, lines: '25-30', statement: 'B = X + Y' },
  { id: 'BR-3', kind: 'interpretive', agreement: 3, lines: '40-50', statement: 'New rule C' },
];

// A minimal existing KB entry (simulating a verified-status file before mutation-gating).
const EXISTING_KB = `# Bug Ratio

Bug-vs-feature story-point ratios.

## Rules

- BR1: Old rule text here.

## Key Files

- \`src/Services/Fokus/Fokus.Domain/Analytics/BugRatioAnalyzer.cs\` — production implementation

## Edge Cases

- Some edge case.

## Relationships

- BugRatioAnalyzer → TransitionAttributionChecker: delegates.

## Source

Original Fokus fokus-spec.md §Bug Ratio.

---
<!-- status: verified -->
<!-- mutation-gated: false -->
<!-- last-stryker-run: none -->
`;

// =================================================================================================
// buildRulesSection: renders the ## Rules section from a rules array
// =================================================================================================
// Pass a fixed year (2026) to avoid relying on new Date() — mirrors the Workflow-script constraint
// and keeps the test deterministic regardless of when it runs.
const FIXED_YEAR = '2026';

test('buildRulesSection renders each rule as "- {id}: {statement}"', () => {
  const section = buildRulesSection(RULES_1, FIXED_YEAR);
  assert.ok(section.includes('- BR-1: A is true when X'), 'BR-1 rule present');
  assert.ok(section.includes('- BR-2: B = X + Y'),        'BR-2 rule present');
});

test('buildRulesSection starts with the ## Rules heading', () => {
  const section = buildRulesSection(RULES_1, FIXED_YEAR);
  assert.ok(section.trimStart().startsWith('## Rules'), 'section starts with ## Rules');
});

test('buildRulesSection includes a verified-status preamble line', () => {
  const section = buildRulesSection(RULES_1, FIXED_YEAR);
  assert.ok(section.includes('verified'), 'rules section declares verified status');
});

test('buildRulesSection preserves all rules in order', () => {
  const section = buildRulesSection(RULES_1, FIXED_YEAR);
  const pos1 = section.indexOf('BR-1');
  const pos2 = section.indexOf('BR-2');
  assert.ok(pos1 < pos2, 'BR-1 appears before BR-2');
});

test('buildRulesSection with empty rules array returns just the heading', () => {
  const section = buildRulesSection([], FIXED_YEAR);
  assert.ok(section.includes('## Rules'), 'heading still present');
  // No bullet items beyond the heading.
  const bulletCount = (section.match(/^- /gm) ?? []).length;
  assert.equal(bulletCount, 0, 'no rule bullets for empty input');
});

// =================================================================================================
// buildStatusFooter: renders the ---\n<!-- ... --> footer block
// =================================================================================================
test('buildStatusFooter sets mutation-gated to the supplied value', () => {
  const footer = buildStatusFooter({ mutationGated: false, date: '2026-06-22', runNote: 'verified — not yet mutation-gated' });
  assert.ok(footer.includes('<!-- mutation-gated: false -->'), 'mutation-gated: false');
});

test('buildStatusFooter sets mutation-gated: true when supplied', () => {
  const footer = buildStatusFooter({ mutationGated: true, date: '2026-06-22', runNote: '88% kill' });
  assert.ok(footer.includes('<!-- mutation-gated: true -->'), 'mutation-gated: true');
});

test('buildStatusFooter includes the last-stryker-run note', () => {
  const footer = buildStatusFooter({ mutationGated: false, date: '2026-06-22', runNote: 'verified — not yet mutation-gated' });
  assert.ok(footer.includes('<!-- last-stryker-run:'), 'last-stryker-run comment present');
  assert.ok(footer.includes('verified'), 'runNote text appears');
});

test('buildStatusFooter starts with the --- separator', () => {
  const footer = buildStatusFooter({ mutationGated: false, date: '2026-06-22', runNote: 'x' });
  assert.ok(footer.trimStart().startsWith('---'), '--- separator present');
});

// =================================================================================================
// supersedingRules: replaces the ## Rules section in an existing KB entry, preserving all other
// sections (Key Files, Edge Cases, Relationships, Source) and updating the footer.
// Supersede-not-delete: the old rules are replaced; the rest of the entry is preserved.
// =================================================================================================
test('supersedingRules replaces the ## Rules section with the new rules', () => {
  const result = supersedingRules(EXISTING_KB, RULES_1, { date: '2026-06-22', mutationGated: false, runNote: 'verified' });
  assert.ok(result.includes('- BR-1: A is true when X'), 'new BR-1 rule present');
  assert.ok(result.includes('- BR-2: B = X + Y'),        'new BR-2 rule present');
  assert.ok(!result.includes('- BR1: Old rule text here.'), 'old rules replaced');
});

test('supersedingRules preserves the ## Key Files section', () => {
  const result = supersedingRules(EXISTING_KB, RULES_1, { date: '2026-06-22', mutationGated: false, runNote: 'verified' });
  assert.ok(result.includes('## Key Files'), 'Key Files section preserved');
  assert.ok(result.includes('BugRatioAnalyzer.cs'), 'Key Files content preserved');
});

test('supersedingRules preserves ## Edge Cases, ## Relationships, ## Source sections', () => {
  const result = supersedingRules(EXISTING_KB, RULES_1, { date: '2026-06-22', mutationGated: false, runNote: 'verified' });
  assert.ok(result.includes('## Edge Cases'),    'Edge Cases section preserved');
  assert.ok(result.includes('## Relationships'), 'Relationships section preserved');
  assert.ok(result.includes('## Source'),        'Source section preserved');
  assert.ok(result.includes('fokus-spec.md'),    'Source content preserved');
});

test('supersedingRules updates the footer (replaces old mutation-gated comment)', () => {
  const result = supersedingRules(EXISTING_KB, RULES_1, { date: '2026-06-22', mutationGated: false, runNote: 'verified — not yet mutation-gated' });
  // Old footer was mutation-gated: false too, but the last-stryker-run was "none".
  // After supersede the new footer carries the supplied runNote.
  assert.ok(result.includes('<!-- mutation-gated: false -->'), 'mutation-gated: false in new footer');
  assert.ok(!result.includes('<!-- last-stryker-run: none -->'), 'old "none" run note replaced');
  assert.ok(result.includes('verified — not yet mutation-gated'), 'new runNote present');
});

test('supersedingRules handles a 3-rule replacement correctly (more rules than original)', () => {
  const result = supersedingRules(EXISTING_KB, RULES_2, { date: '2026-06-22', mutationGated: false, runNote: 'verified' });
  assert.ok(result.includes('- BR-1: Updated rule A'), 'BR-1 updated');
  assert.ok(result.includes('- BR-2: B = X + Y'),      'BR-2 present');
  assert.ok(result.includes('- BR-3: New rule C'),      'BR-3 (new) present');
  assert.ok(!result.includes('- BR1: Old rule text'), 'old rule gone');
});

test('supersedingRules preserves the entry header (title + intro paragraph)', () => {
  const result = supersedingRules(EXISTING_KB, RULES_1, { date: '2026-06-22', mutationGated: false, runNote: 'verified' });
  assert.ok(result.startsWith('# Bug Ratio'), 'entry title preserved at top');
  assert.ok(result.includes('Bug-vs-feature story-point ratios.'), 'intro paragraph preserved');
});

// =================================================================================================
// stripLineRefs: fail-closed sanitizer — no source line number may reach the durable KB
// =================================================================================================
// The fixture is the ACTUAL Run-1 BR-3 statement (the one that motivated the rule): a parenthetical
// list of "label L<n>" pairs. After stripping, the symbol labels must survive and every L<n> must be
// gone — proving the sanitizer cleans real output without mangling the meaning.
const REAL_BR3 = 'The guard appears at every non-alert ratio site (per-sprint trend L35, per-dev sprint trend L76, team totals L48, single-sprint team L145, single-sprint dev L186, prior team L161, prior dev L201, multi-sprint dev aggregate L95).';

test('stripLineRefs removes every L<n> token from the real Run-1 BR-3 statement', () => {
  const out = stripLineRefs(REAL_BR3);
  assert.ok(!/\bL\d+\b/.test(out), `no L<n> tokens remain: ${out}`);
});

test('stripLineRefs keeps the symbol labels (the part we WANT in the KB)', () => {
  const out = stripLineRefs(REAL_BR3);
  for (const label of ['per-sprint trend', 'per-dev sprint trend', 'team totals', 'single-sprint team', 'multi-sprint dev aggregate']) {
    assert.ok(out.includes(label), `label preserved: ${label}`);
  }
  assert.ok(!/,\s*,/.test(out), 'no doubled commas left behind');
  assert.ok(!/\(\s*,/.test(out), 'no stray leading comma in the parenthetical');
});

test('stripLineRefs removes "line N" and "lines N, M" prose forms', () => {
  assert.equal(stripLineRefs('the divide guard at line 76 returns 0m'), 'the divide guard at returns 0m');
  assert.equal(stripLineRefs('summed across lines 48, 76 and 95'), 'summed across and 95');
  assert.equal(stripLineRefs('slice covering lines 35-50'), 'slice covering');
});

test('stripLineRefs leaves clean statements untouched (no false positives)', () => {
  for (const clean of [
    'A SprintMembership is a bug iff Ticket.IssueType == "Bug"',
    'rounds ratioPercent to 1 decimal via Math.Round(x, 1)',
    'ratio = bugSp / completedSp * 100 when completedSp > 0, else 0m',
    'GetEffectiveSp(defaultSpPerBug) ?? 0m',
    'grouping uses StringComparer.OrdinalIgnoreCase',
  ]) {
    assert.equal(stripLineRefs(clean), clean, `unchanged: ${clean}`);
  }
});

test('stripLineRefs drops a parenthetical that held only a line ref', () => {
  assert.equal(stripLineRefs('the streak loop terminates (L268) on the first zero-SP sprint'),
    'the streak loop terminates on the first zero-SP sprint');
});

test('buildRulesSection sanitizes line refs out of emitted statements', () => {
  const section = buildRulesSection([{ id: 'BR-1', kind: 'interpretive', agreement: 3, lines: '35', statement: REAL_BR3 }], FIXED_YEAR);
  assert.ok(!/\bL\d+\b/.test(section), 'no L<n> tokens in the rendered KB section');
  assert.ok(section.includes('team totals'), 'symbol label survives into the KB section');
});

// =================================================================================================
// F6-MineMachineryHardening R2: buildVerifyExcerpt — sanitizes a skeptic's evidence string into the
// `  - verify: {excerpt}` sub-bullet payload (D2: single line, <=200 chars, statement-style sanitize).
// =================================================================================================
test('buildVerifyExcerpt returns null for missing/empty evidence', () => {
  assert.equal(buildVerifyExcerpt(undefined), null);
  assert.equal(buildVerifyExcerpt(null), null);
  assert.equal(buildVerifyExcerpt(''), null);
  assert.equal(buildVerifyExcerpt('   '), null);
});

test('buildVerifyExcerpt passes short clean evidence through unchanged', () => {
  assert.equal(buildVerifyExcerpt('the guard returns 0 when X is false'), 'the guard returns 0 when X is false');
});

test('buildVerifyExcerpt strips line refs the same way stripLineRefs does', () => {
  const out = buildVerifyExcerpt('confirmed at line 76, the guard holds');
  assert.ok(!/\bline\s+\d+/i.test(out), `no line-ref survives: ${out}`);
});

test('buildVerifyExcerpt collapses embedded newlines into a single line', () => {
  const out = buildVerifyExcerpt('line one\nline two\nline three');
  assert.ok(!out.includes('\n'), `no embedded newline: ${JSON.stringify(out)}`);
});

test('buildVerifyExcerpt truncates to at most 200 chars', () => {
  const out = buildVerifyExcerpt('x'.repeat(250));
  assert.ok(out.length <= 200, `length ${out.length} <= 200`);
});

// =================================================================================================
// F6-MineMachineryHardening R2: buildRulesSection emits the `  - verify: {excerpt}` sub-bullet for a
// rule carrying evidence (from the verdict), and NO sub-bullet for a rule without one (D2 row shape:
// transcribed rules carry no verdict path, so they never get a sub-bullet).
// =================================================================================================
const RULE_WITH_EVIDENCE = {
  id: 'BR-1', kind: 'interpretive', agreement: 3, lines: '10-20', statement: 'A is true when X',
  evidence: 'The guard at the check returns 0 when X is false, confirming the rule.',
};
const RULE_NO_EVIDENCE = { id: 'BR-2', kind: 'transcribed', agreement: 2, lines: '25-30', statement: 'B = X + Y' };

test('buildRulesSection emits a "  - verify: {excerpt}" sub-bullet for a rule with evidence', () => {
  const section = buildRulesSection([RULE_WITH_EVIDENCE], FIXED_YEAR);
  assert.ok(
    section.includes('  - verify: The guard at the check returns 0 when X is false, confirming the rule.'),
    section,
  );
});

test('buildRulesSection emits NO sub-bullet for a rule without evidence', () => {
  const section = buildRulesSection([RULE_NO_EVIDENCE], FIXED_YEAR);
  assert.ok(!section.includes('  - verify:'), 'no sub-bullet for an evidence-less (transcribed) rule');
});

test('buildRulesSection sub-bullet excerpt is sanitized the same way statements are (line refs stripped)', () => {
  const section = buildRulesSection([{ ...RULE_WITH_EVIDENCE, evidence: 'confirmed at L42, the guard holds' }], FIXED_YEAR);
  assert.ok(!/\bL\d+\b/.test(section), 'no L<n> token in the rendered excerpt');
});

test('buildRulesSection preserves ordering and mixes rules with/without evidence correctly', () => {
  const section = buildRulesSection([RULE_WITH_EVIDENCE, RULE_NO_EVIDENCE], FIXED_YEAR);
  const lines = section.split('\n');
  const br1Idx = lines.findIndex((l) => l.startsWith('- BR-1'));
  const br2Idx = lines.findIndex((l) => l.startsWith('- BR-2'));
  assert.ok(br1Idx !== -1 && br2Idx !== -1, 'both rule bullets present');
  assert.equal(lines[br1Idx + 1], '  - verify: The guard at the check returns 0 when X is false, confirming the rule.');
  // BR-2 has no evidence: the line right after its bullet must NOT be a sub-bullet.
  assert.ok(!(lines[br2Idx + 1] ?? '').trim().startsWith('- verify:'), 'BR-2 has no sub-bullet');
});

// =================================================================================================
// F6-MineMachineryHardening R2: serializeKb (harness/lib/serialize-kb.mjs) — the Flutter controller's
// KB row serializer, extracted from loop-flutter.workflow.js's previously inline-only, untested
// function. Same D2 sub-bullet contract as buildRulesSection above.
// =================================================================================================
const FLUTTER_RULES = [
  { id: 'BR-1', kind: 'interpretive', agreement: 3, statement: 'Rule A holds', evidence: 'The branch returns true when the flag is set.' },
  { id: 'BR-2', kind: 'transcribed', agreement: 3, statement: 'Rule B = X + Y' },
];
const FLUTTER_VERDICTS = [{ id: 'BR-1', verdict: 'CONFIRMED', evidence: 'The branch returns true when the flag is set.' }];
const FLUTTER_OPTS = { targetClass: 'BuildZplCodeUsecase', relpath: 'lib/x.dart', date: '2026-07-16', mutationGated: false, runNote: 'Mine→Verify pass complete, Cover not yet run' };

test('serializeKb emits a "  - verify: {excerpt}" sub-bullet for a rule with evidence', () => {
  const kb = serializeKb(FLUTTER_RULES, FLUTTER_VERDICTS, FLUTTER_OPTS);
  assert.ok(kb.includes('  - verify: The branch returns true when the flag is set.'), kb);
});

test('serializeKb emits no sub-bullet for a rule without evidence', () => {
  const kb = serializeKb(FLUTTER_RULES, FLUTTER_VERDICTS, FLUTTER_OPTS);
  const lines = kb.split('\n');
  const br2Idx = lines.findIndex((l) => l.startsWith('- BR-2'));
  assert.ok(br2Idx !== -1, 'BR-2 bullet present');
  assert.ok(!(lines[br2Idx + 1] ?? '').trim().startsWith('- verify:'), 'no sub-bullet follows BR-2');
});

test('serializeKb preserves the existing tally + rule-line rendering', () => {
  const kb = serializeKb(FLUTTER_RULES, FLUTTER_VERDICTS, FLUTTER_OPTS);
  assert.ok(kb.includes('2 rules; 1 CONFIRMED, 0 IMPRECISE, 0 WRONG'), kb);
  assert.ok(kb.includes('- BR-1: Rule A holds'), kb);
  assert.ok(kb.includes('- BR-2: Rule B = X + Y'), kb);
});

test('serializeKb excerpt is truncated/sanitized the same way as buildRulesSection', () => {
  const rules = [{ id: 'BR-1', kind: 'interpretive', agreement: 3, statement: 'Rule A', evidence: 'confirmed at line 76, ' + 'x'.repeat(250) }];
  const kb = serializeKb(rules, [], FLUTTER_OPTS);
  const m = kb.match(/  - verify: (.*)/);
  assert.ok(m, 'sub-bullet present');
  assert.ok(!/line\s+\d+/i.test(m[1]), 'line ref stripped');
  assert.ok(m[1].length <= 200, `excerpt length ${m[1].length} <= 200`);
});
