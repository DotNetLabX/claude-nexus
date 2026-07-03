// kb-distill.test.mjs — the two-layer KB distillation + token-budget lint (adhoc-SddMergeGen, Step 3).
//
// Distills a registry (Step 2's rows) into hot-layer rows (one line per rule CLUSTER — same symbol +
// layer — plus a pointer back to the cold-layer ledger) and lints the hot layer against a token ceiling
// (default constant, overridable; fail-closed when exceeded — the sync must not silently bloat the
// always-loaded context). Proposal §C: the hot layer is loaded into every agent's context and must stay
// distilled; the cold layer (full BR ledgers) is read on demand.
//
// PURE — no fs, no LLM. Runs inside the CI glob: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`
// (selfcheck.mjs:45).
import test from 'node:test';
import assert from 'node:assert/strict';
import { distillRegistry, lintTokenBudget, DEFAULT_TOKEN_CEILING } from '../../harness/lib/kb-distill.mjs';

// =================================================================================================
// Slice 1: one row per cluster (same symbol + layer) with a resolving pointer back to the ledger.
// =================================================================================================
test('distillRegistry: clusters rows by symbol+layer into ONE hot-layer row with a resolving pointer', () => {
  const rows = [
    { canonicalName: 'BugRatioPercent', layer: 'domain-calc', disposition: 'add', symbol: 'BugRatioAnalyzer.ComputeMultiSprint' },
    { canonicalName: 'BugRatioPercentBoundary', layer: 'domain-calc', disposition: 'carried', symbol: 'BugRatioAnalyzer.ComputeMultiSprint' },
    { canonicalName: 'AlertActiveFlag', layer: 'domain-calc', disposition: 'add', symbol: 'BugRatioAnalyzer.ComputeSingleSprint' },
  ];
  const { hotRows } = distillRegistry({ className: 'BugRatioAnalyzer', rows, ledgerPath: 'docs/kb/golden/BugRatioAnalyzer.md' });
  // Two clusters: (BugRatioAnalyzer.ComputeMultiSprint, domain-calc) and (BugRatioAnalyzer.ComputeSingleSprint, domain-calc).
  assert.equal(hotRows.length, 2, 'two distinct symbol+layer clusters → two hot rows, not three');
  for (const row of hotRows) {
    assert.equal(row.pointer, 'docs/kb/golden/BugRatioAnalyzer.md', 'every hot row resolves back to the cold-layer ledger');
  }
});

test('distillRegistry: a hot row is a ONE-LINE summary — never carries the full rule statement/body', () => {
  const rows = [
    { canonicalName: 'BugRatioPercent', layer: 'domain-calc', disposition: 'add', symbol: 'BugRatioAnalyzer.ComputeMultiSprint', statement: 'A long multi-line rule statement text that must never leak into the hot layer.\nSecond line of the rule body.' },
  ];
  const { hotRows } = distillRegistry({ className: 'BugRatioAnalyzer', rows, ledgerPath: 'docs/kb/golden/BugRatioAnalyzer.md' });
  assert.equal(hotRows.length, 1);
  assert.equal(hotRows[0].line.includes('\n'), false, 'the rendered hot-layer line is single-line');
  assert.ok(!hotRows[0].line.includes('Second line of the rule body'), 'the full multi-line statement never appears in the hot-layer line');
});

// =================================================================================================
// Slice 2: token-budget lint — fails over ceiling, passes AT the ceiling.
// =================================================================================================
test('lintTokenBudget: passes when the hot layer is AT the ceiling', () => {
  const hotText = 'x'.repeat(40); // 40 chars ≈ 10 tokens at the lib's 4-chars/token estimate
  const result = lintTokenBudget({ hotText, ceiling: 10 });
  assert.equal(result.pass, true);
  assert.equal(result.estimatedTokens, 10);
});

test('lintTokenBudget: fails (fail-closed) when the hot layer EXCEEDS the ceiling', () => {
  const hotText = 'x'.repeat(44); // 44 chars ≈ 11 tokens > ceiling 10
  const result = lintTokenBudget({ hotText, ceiling: 10 });
  assert.equal(result.pass, false);
  assert.ok(result.estimatedTokens > 10);
});

test('lintTokenBudget: uses DEFAULT_TOKEN_CEILING when no ceiling is supplied (overridable, not hardcoded)', () => {
  const tiny = lintTokenBudget({ hotText: 'short' });
  assert.equal(tiny.pass, true);
  assert.equal(tiny.ceiling, DEFAULT_TOKEN_CEILING);
});

// =================================================================================================
// Slice 3: a ledger's full text never appears in the distillate (grep: no multi-line rule bodies).
// =================================================================================================
test('distillRegistry: the rendered distillate text contains NO multi-line rule bodies (grep-checkable)', () => {
  const rows = [
    { canonicalName: 'DefaultSpPerBug', layer: 'settings', disposition: 'add', symbol: 'SprintSettings.SpPerBug', statement: 'Line one of a long rule body.\nLine two.\nLine three with embedded detail that must not leak.' },
  ];
  const { renderedDistillate } = distillRegistry({ className: 'SprintSettings', rows, ledgerPath: 'docs/kb/golden/SprintSettings.md' });
  assert.ok(!renderedDistillate.includes('Line two.'), 'no multi-line rule body content leaks into the rendered distillate');
  assert.ok(!renderedDistillate.includes('embedded detail'), 'no multi-line rule body content leaks into the rendered distillate');
});
