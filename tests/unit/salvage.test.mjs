// T2 — salvage-transcript.js (evaluation roadmap C.2): recover a background subagent's
// stranded deliverable from its platform-written transcript. Born as TDD reds, promoted on ship.
// The platform transcript cannot strand and is verbatim by construction; reading it is a
// SCRIPT's job, never a model's (token-consumption goal).
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pluginRoot, run, FIXTURES } from '../helpers.mjs';

const SALVAGE = join(pluginRoot('nexus'), 'hooks', 'scripts', 'salvage-transcript.js');
const fixture = (name) => join(FIXTURES, 'transcripts', name);
const salvage = (...args) => run(process.execPath, [SALVAGE, ...args]);

test('recovers a report stranded behind a lifecycle reply', () => {
  const res = salvage('--file', fixture('stranded.jsonl'));
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /FINDINGS:/, 'the substantive report must be recovered');
  assert.match(res.stdout, /two-tier offline harness/, 'recovered text is verbatim, not summarized');
  assert.ok(!res.stdout.includes('Ready when you are.'), 'lifecycle stubs are not the deliverable');
});

test('returns the final text when the agent ended cleanly', () => {
  const res = salvage('--file', fixture('clean.jsonl'));
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /VERDICT: REVISE/, 'clean transcripts return the final substantive message');
});

test('an all-stub transcript still returns the last text, with a warning', () => {
  const res = salvage('--file', fixture('stubs-only.jsonl'));
  assert.equal(res.status, 0);
  assert.match(res.stdout, /Standing by\./, 'best-effort: the last text is better than nothing');
  assert.match(res.stderr, /no substantive/i, 'but the caller is warned');
});

test('recovers a deliverable stranded behind a VERBOSE lifecycle closer (F16 shape)', () => {
  // The measured F16 failure: the closer is single-line but >=80 chars, so the stub skip
  // does not catch it. Longest-recent selection must surface the real deliverable.
  const res = salvage('--file', fixture('stranded-verbose-closer.jsonl'));
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /REVISION COMPLETE/, 'the deliverable must be recovered, not the closer');
  assert.ok(!res.stdout.includes("Holding for the team lead"), 'a verbose single-line closer is not the deliverable');
});

test('--final preserves the old final-substantive selection', () => {
  const res = salvage('--final', '--file', fixture('stranded-verbose-closer.jsonl'));
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /Holding for the team lead/, 'old behavior: first non-stub from the end');
});

test('a missing transcript is a hard error (exit 1), not empty output', () => {
  const res = salvage('--file', fixture('does-not-exist.jsonl'));
  assert.equal(res.status, 1);
  assert.match(res.stderr, /not found|no such|unreadable/i);
});

test('no arguments prints usage and exits 2', () => {
  const res = salvage();
  assert.equal(res.status, 2);
  assert.match(res.stderr, /usage/i);
});
