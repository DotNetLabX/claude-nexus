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
