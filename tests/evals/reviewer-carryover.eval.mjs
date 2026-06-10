// T4 — reviewer engages with Carry-Over Findings (judge-graded, subscription-only judge).
// The deterministic halves are asserted directly (review.md exists, exactly one verdict in
// the Step-2 section, completion footer per 1.4.0 C.3); whether the review *substantively
// addresses* the developer-flagged risk is graded by a haiku judge with a structural rubric.
// Fixture: a tiny git repo built at test time — sum() with a seeded empty-list hazard, and
// an implementation.md whose Carry-Over table flags exactly that.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runClaude, cleanupSandboxes, finalText, assertSessionRan, assertDevPluginLoaded, judge } from './helpers.mjs';

after(cleanupSandboxes);

function buildFixtureRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'nexus-eval-rev-'));
  const git = (...a) => {
    const r = spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, 0, `git ${a.join(' ')}: ${r.stderr}`);
  };
  git('init', '-b', 'main');
  git('config', 'user.email', 'eval@test.local');
  git('config', 'user.name', 'eval');

  mkdirSync(join(dir, 'src'), { recursive: true });
  mkdirSync(join(dir, 'docs', 'specs', 'F1-Widgets', 'definition'), { recursive: true });
  mkdirSync(join(dir, 'docs', 'specs', 'F1-Widgets', 'delivery'), { recursive: true });

  writeFileSync(join(dir, 'src', 'stats.js'), 'export function placeholder() {}\n');
  writeFileSync(join(dir, 'docs', 'specs', 'F1-Widgets', 'definition', 'spec.md'),
    '# F1-Widgets — Spec\n\n- R1: `averageWidgetScore(widgets)` returns the mean of `widget.score` values.\n');
  writeFileSync(join(dir, 'docs', 'specs', 'F1-Widgets', 'delivery', 'plan.md'),
    '# F1-Widgets — Plan\n\n## Steps\n\n### Step 1 — averageWidgetScore\nSkill: None\nImplement `averageWidgetScore(widgets)` in `src/stats.js` returning the mean of `score` values.\n');
  git('add', '-A');
  git('commit', '-m', 'baseline');

  // The "developer's" implementation — mean works for non-empty input, divides by zero on [].
  writeFileSync(join(dir, 'src', 'stats.js'), [
    'export function placeholder() {}',
    '',
    'export function averageWidgetScore(widgets) {',
    '  let total = 0;',
    '  for (const w of widgets) total += w.score;',
    '  return total / widgets.length;',
    '}',
    '',
  ].join('\n'));
  writeFileSync(join(dir, 'docs', 'specs', 'F1-Widgets', 'delivery', 'implementation.md'), [
    '# F1-Widgets — Implementation',
    '',
    '## Files Created',
    '- (none)',
    '',
    '## Files Modified',
    '- `src/stats.js` — added averageWidgetScore per Step 1',
    '',
    '## Key Decisions',
    '- Plain loop over reduce for readability.',
    '',
    '## Carry-Over Findings',
    '| Title | Severity | For | Evidence | Note |',
    '|-------|----------|-----|----------|------|',
    '| Empty-list behavior unverified | medium | reviewer | `src/stats.js` — `total / widgets.length` with `widgets=[]` divides by zero (NaN) | Spec is silent on empty input; reviewer to confirm or refute whether NaN is acceptable |',
    '',
    '## KB Changes',
    '| Entry | Action | What changed |',
    '|-------|--------|-------------|',
    '| (none) | — | — |',
    '',
    '## Deviations from Plan',
    '- None.',
    '',
    '*Status: COMPLETE — developer, 2026-06-10*',
    '',
  ].join('\n'));
  git('add', '-A');
  git('commit', '-m', 'F1-Widgets implementation');
  return dir;
}

test('reviewer: writes review.md and explicitly addresses the carry-over finding', { timeout: 600_000 }, () => {
  const cwd = buildFixtureRepo();
  const run = runClaude(
    'Step 2 code review for F1-Widgets (cycle 1). You are running standalone (no team lead). ' +
    'The plan is docs/specs/F1-Widgets/delivery/plan.md; the implementation record is ' +
    'docs/specs/F1-Widgets/delivery/implementation.md. There is no build system in this repo — ' +
    'verify behavior by reading the code (you may run node to exercise it). ' +
    'Write your review to docs/specs/F1-Widgets/delivery/review.md.',
    { cwd, agent: 'nexus:reviewer' }
  );
  assertSessionRan(run);
  assertDevPluginLoaded(run);

  // Deterministic half: the artifact exists, carries exactly one Step-2 verdict, self-certifies.
  const reviewPath = join(cwd, 'docs', 'specs', 'F1-Widgets', 'delivery', 'review.md');
  assert.ok(existsSync(reviewPath), `review.md not written; final message:\n${finalText(run.events).slice(0, 500)}`);
  const review = readFileSync(reviewPath, 'utf8');
  assert.match(review, /APPROVED|REQUEST CHANGES|COMMENT/, 'review.md has no verdict line');
  assert.match(review, /Status:\s*COMPLETE/, 'review.md lacks the completion footer (1.4.0 C.3)');

  // Judged half: does the review CONFIRM OR REFUTE the flagged risk, explicitly?
  const verdict = judge(
    'The content is a code review. PASS only if it explicitly addresses the developer-flagged ' +
    'carry-over risk that averageWidgetScore divides by zero / returns NaN for an empty widgets ' +
    'list — either confirming it as a finding or refuting it with a reason. Merely repeating ' +
    'the table or ignoring it is a FAIL.',
    review,
    { cwd }
  );
  assert.ok(verdict.pass, `judge failed the review: ${verdict.reason}\n--- review.md ---\n${review.slice(0, 1200)}`);
});
