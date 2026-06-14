// T2 — pipeline-gate.js invariants: two-phase spawn (analyze-and-stop) and review-verdict
// integrity, plus the fail-open edges the header declares DELIBERATE (don't "fix" them here —
// if one of these starts denying, the gate got stricter than ADR-7 allows).
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pluginRoot, runHook, denyReason, makeSandbox, cleanupSandboxes } from '../helpers.mjs';

const GATE = join(pluginRoot('nexus'), 'hooks', 'scripts', 'pipeline-gate.js');
after(cleanupSandboxes);

function sandboxWithState(state) {
  const dir = makeSandbox();
  mkdirSync(join(dir, '.claude'), { recursive: true });
  if (state !== null) writeFileSync(join(dir, '.claude', '.pipeline-state'), state);
  return dir;
}
function gate(event, projectDir) {
  return runHook(GATE, event, { projectDir });
}
const write = (fp, content = 'x') => ({ tool_name: 'Write', tool_input: { file_path: fp, content } });

test('analyze phase: plan.md and source writes are denied, docs and artifacts pass', () => {
  const dir = sandboxWithState('architect:analyze');
  assert.match(denyReason(gate(write('docs/specs/F1/delivery/plan.md'), dir)) || '', /analyze phase/);
  assert.match(denyReason(gate(write('src/Feature/Handler.cs'), dir)) || '', /analyze phase/);
  assert.equal(denyReason(gate(write('docs/specs/F1/delivery/questions.md'), dir)), null, 'questions.md is the analyze-phase output');
  assert.equal(denyReason(gate(write('docs/notes.md'), dir)), null);
  assert.equal(denyReason(gate(write('.claude/scratch.js'), dir)), null, '.claude/ is never "source"');
});

test('implement phase and missing state file pass (fail open)', () => {
  const implementing = sandboxWithState('developer:implement');
  assert.equal(denyReason(gate(write('docs/specs/F1/delivery/plan.md'), implementing)), null);
  assert.equal(denyReason(gate(write('src/Feature/Handler.cs'), implementing)), null);
  const noState = sandboxWithState(null);
  assert.equal(denyReason(gate(write('src/Feature/Handler.cs'), noState)), null, 'no state file -> fail open');
});

test('deliberate edge: a bare relative plan.md (no directory separator) is NOT matched', () => {
  const dir = sandboxWithState('architect:analyze');
  assert.equal(denyReason(gate(write('plan.md'), dir)), null,
    'documented fail-open edge — path matches require a separator before the filename');
});

// Findings in review-format are `### [SEVERITY] title` headings with File/Issue/Fix lines —
// NOT table rows. The gate's window scan is built around exactly that shape.
const APPROVED_OPEN_HIGH = [
  '## Step 2 — Code Review', '', '## Verdict: APPROVED', '', '## Findings', '',
  '### [HIGH] SQL injection in OrderQuery',
  '**File:** `src/Orders/OrderQuery.cs:42`',
  '**Issue:** user input concatenated into the WHERE clause',
  '**Fix:** parameterize the query',
].join('\n');
const APPROVED_RESOLVED_HIGH = APPROVED_OPEN_HIGH.replace(
  'concatenated into the WHERE clause', 'concatenated into the WHERE clause — resolved in cycle 2');

test('review.md verdict integrity: APPROVED with an open CRITICAL/HIGH is denied', () => {
  const dir = sandboxWithState(null); // verdict check is independent of phase
  const deny = denyReason(gate(write('docs/specs/F1/delivery/review.md', APPROVED_OPEN_HIGH), dir));
  assert.match(deny || '', /APPROVED while an unresolved CRITICAL or HIGH/);
});

test('review.md verdict integrity: resolved findings, REQUEST CHANGES, and legend lines all pass', () => {
  const dir = sandboxWithState(null);
  assert.equal(denyReason(gate(write('docs/specs/F1/delivery/review.md', APPROVED_RESOLVED_HIGH), dir)), null,
    'a resolution marker within the finding window clears the block');
  const requestChanges = APPROVED_OPEN_HIGH.replace('## Verdict: APPROVED', '## Verdict: REQUEST CHANGES (not APPROVED)');
  assert.equal(denyReason(gate(write('docs/specs/F1/delivery/review.md', requestChanges), dir)), null,
    'REQUEST CHANGES near the APPROVED token is not an approval');
  const legendOnly = '## Verdict: APPROVED\n\n| Severity | Meaning |\n|---|---|\n| HIGH | must fix before merge |\n';
  assert.equal(denyReason(gate(write('docs/specs/F1/delivery/review.md', legendOnly), dir)), null,
    'severity legend lines are not findings');
});

// Two clean-approval prose shapes carry the CRITICAL/HIGH token without being a finding
// (review-format SKILL.md). Both must ALLOW; a real open HIGH alongside them must still DENY.
test('verdict integrity: a negation line stating ABSENCE of findings is not a finding', () => {
  const dir = sandboxWithState(null);
  const negated = ['## Verdict: APPROVED', '', '## Findings', '', 'No CRITICAL or HIGH findings.'].join('\n');
  assert.equal(denyReason(gate(write('docs/specs/F1/delivery/review.md', negated), dir)), null,
    '"No CRITICAL or HIGH findings." states absence — it carries both tokens but is not a finding');
});

test('verdict integrity: a **Confidence:** field is the reviewer qualifier, not a severity', () => {
  const dir = sandboxWithState(null);
  // A fully-resolved review whose only remaining HIGH token is the Confidence qualifier on a
  // resolved finding — the field must not be read as an open severity.
  const confidenceOnly = [
    '## Verdict: APPROVED', '', '## Findings', '',
    '### [HIGH] SQL injection in OrderQuery',
    '**File:** `src/Orders/OrderQuery.cs:42`',
    '**Issue:** user input concatenated into the WHERE clause — resolved in cycle 2',
    '**Fix:** parameterize the query',
    '**Confidence:** HIGH',
  ].join('\n');
  assert.equal(denyReason(gate(write('docs/specs/F1/delivery/review.md', confidenceOnly), dir)), null,
    '**Confidence:** HIGH is the per-finding format qualifier, not an open severity');
});

test('verdict integrity: exemptions do NOT mask a real open HIGH that sits beside them', () => {
  const dir = sandboxWithState(null);
  // A genuinely-open HIGH finding, in the same review as a negation line and a Confidence field.
  // The exemptions are line-local skips; the real ### [HIGH] (no resolution marker) must still DENY.
  const mixed = [
    '## Verdict: APPROVED', '', '## Findings', '',
    'No CRITICAL issues in the data layer.',
    '### [HIGH] Missing auth check on the admin endpoint',
    '**File:** `src/Admin/Endpoint.cs:10`',
    '**Issue:** the role gate is absent',
    '**Confidence:** HIGH',
  ].join('\n');
  assert.match(denyReason(gate(write('docs/specs/F1/delivery/review.md', mixed), dir)) || '',
    /APPROVED while an unresolved CRITICAL or HIGH/,
    'a real open HIGH must still fire even when negation/Confidence lines are present');
});

test('verdict integrity: a ### heading containing "no … critical/high" mid-heading is a real finding, not a negation', () => {
  const dir = sandboxWithState(null);
  // "No" appears mid-heading, not at the start of the line — the exemption must NOT fire.
  // The NEGATED anchor (^[\s>*_-]*no) requires "no" to open the line; a ### prefix disqualifies it.
  const midHeadingNo = [
    '## Verdict: APPROVED', '', '## Findings', '',
    '### [HIGH] No input validation on critical path',
    '**Issue:** unsanitized input reaches the DB.',
    '**Fix:** add a guard.',
  ].join('\n');
  assert.match(denyReason(gate(write('docs/specs/F1/delivery/review.md', midHeadingNo), dir)) || '',
    /APPROVED while an unresolved CRITICAL or HIGH/,
    '"no" mid-heading inside a ### finding is not a negation summary — must still DENY');
});

test('deliberate edge: table-row findings never trigger the verdict check', () => {
  // In review-format, real findings are ### headings; table rows are step dispositions,
  // evidence, and legends. The gate skips ALL `| ...` lines (conservative by design) —
  // if this starts denying, the gate has become stricter than the format warrants.
  const dir = sandboxWithState(null);
  const tableFinding = '## Verdict: APPROVED\n\n| F1 | HIGH | SQL injection, unresolved |\n';
  assert.equal(denyReason(gate(write('docs/specs/F1/delivery/review.md', tableFinding), dir)), null);
});

test('Edit events are inspected via new_string', () => {
  const dir = sandboxWithState(null);
  const ev = { tool_name: 'Edit', tool_input: { file_path: 'docs/specs/F1/delivery/review.md', new_string: APPROVED_OPEN_HIGH } };
  assert.match(denyReason(gate(ev, dir)) || '', /APPROVED while an unresolved/);
});

test('non-edit tools and malformed stdin pass (fail open)', () => {
  const dir = sandboxWithState('architect:analyze');
  assert.equal(denyReason(gate({ tool_name: 'Bash', tool_input: { command: 'echo hi > plan.md' } }, dir)), null,
    'the gate only guards edit tools');
  const res = runHook(GATE, '{{{not json', { projectDir: dir });
  assert.equal(res.status, 0);
  assert.equal(denyReason(res), null);
});
