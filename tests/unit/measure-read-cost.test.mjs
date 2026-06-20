// T2 — measure-read-cost.mjs (scripts/, dev-repo tooling). The audit parser for the
// section-addressable-reads slice: read a token-usage.jsonl, filter by agent + time window,
// and report absolute cache_creation / cache_read / efficiency. Asserted against the existing
// committed fixture so the parsed totals are pinned and can't drift.
//
// Fixture rows (tests/fixtures/fleet/full/.claude/audit/token-usage.jsonl):
//   1 nexus:architect  cc=2000 cr=0     22:13:20
//   2 nexus:architect  cc=2000 cr=0     22:13:25
//   3 architect        cc=1000 cr=500   22:13:30
//   4 nexus:developer  cc=4000 cr=0     22:18:20
//   5 developer-2      cc=2000 cr=1000  22:18:25
//   6 main             cc=1000 cr=0     22:18:30
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES } from '../helpers.mjs';
import { measureReadCost } from '../../scripts/measure-read-cost.mjs';

const LOG = join(FIXTURES, 'fleet', 'full', '.claude', 'audit', 'token-usage.jsonl');
const rows = readFileSync(LOG, 'utf8');

test('no filter: sums cache_creation / cache_read across every row, computes efficiency', () => {
  const r = measureReadCost(rows, {});
  assert.equal(r.calls, 6);
  assert.equal(r.cacheCreation, 12000); // 2000+2000+1000+4000+2000+1000
  assert.equal(r.cacheRead, 1500); // 0+0+500+0+1000+0
  // efficiency = cache_read / (cache_read + cache_creation)
  assert.equal(r.efficiency.toFixed(4), (1500 / 13500).toFixed(4));
});

test('--agent filters to one agent (exact match, no token-prefix coalescing)', () => {
  const r = measureReadCost(rows, { agent: 'nexus:architect' });
  assert.equal(r.calls, 2); // rows 1,2 — the bare "architect" (row 3) is a different agent
  assert.equal(r.cacheCreation, 4000);
  assert.equal(r.cacheRead, 0);
  assert.equal(r.efficiency, 0);
});

test('--since keeps only rows at/after the timestamp', () => {
  const r = measureReadCost(rows, { since: '2023-11-14T22:18:00.000Z' });
  assert.equal(r.calls, 3); // rows 4,5,6
  assert.equal(r.cacheCreation, 7000); // 4000+2000+1000
  assert.equal(r.cacheRead, 1000);
});

test('--agent + --since compose', () => {
  const r = measureReadCost(rows, { agent: 'nexus:developer', since: '2023-11-14T22:18:00.000Z' });
  assert.equal(r.calls, 1); // row 4 only
  assert.equal(r.cacheCreation, 4000);
  assert.equal(r.cacheRead, 0);
});

test('an agent with no matching rows reports zeros, not NaN', () => {
  const r = measureReadCost(rows, { agent: 'critic' });
  assert.equal(r.calls, 0);
  assert.equal(r.cacheCreation, 0);
  assert.equal(r.cacheRead, 0);
  assert.equal(r.efficiency, 0); // 0/0 guarded to 0
});

test('tolerates blank lines and malformed JSON rows — calls counts only parseable rows', () => {
  const dirty = rows.trimEnd() + '\n\nnot json at all\n{"ts":"x"}\n';
  const r = measureReadCost(dirty, {});
  // "not json at all" → parse error → skipped entirely (not counted)
  // '{"ts":"x"}' → valid JSON object, passes the typeof check → counts as a call (cc/cr += 0)
  // Original 6 rows + 1 parseable-but-missing-fields row = 7 calls; the pure-malformed line is 0
  assert.equal(r.calls, 7);
  assert.equal(r.cacheCreation, 12000);
  assert.equal(r.cacheRead, 1500);
});

test('--since boundary: the exact timestamp of a row is inclusive (>= not >)', () => {
  // Row 4 ts = 2023-11-14T22:18:20.000Z. Passing that exact ts as --since must INCLUDE row 4.
  const r = measureReadCost(rows, { since: '2023-11-14T22:18:20.000Z' });
  assert.equal(r.calls, 3); // rows 4, 5, 6 all qualify (22:18:20, 22:18:25, 22:18:30)
  assert.equal(r.cacheCreation, 7000);
  assert.equal(r.cacheRead, 1000);
});
