// T2 — the /nexus:fleet renderer (skills/fleet/scripts/render-fleet.mjs). It joins four best-effort
// sources rooted at a project dir and prints a consolidated dashboard. The pass/fail contract is the
// exact ANSI-stripped output: the full-data render and each degradation path are asserted verbatim,
// and the pinned degradation strings are imported from the renderer so test and code can't drift.
//
// Time is frozen via the `now` seam so elapsed/staleness are deterministic. The fixtures' ts/startTime
// are chosen relative to NOW: ts 20s old (fresh) for full/roster, 10m old (stale) for the stale case;
// startTimes give 10m0s / 5m0s elapsed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { FIXTURES } from '../helpers.mjs';
import { renderFleet, readDepth, MSG } from '../../plugins/nexus/skills/fleet/scripts/render-fleet.mjs';

const NOW = 1700000600000; // 2023-11-14T22:23:20Z
const fx = (name) => join(FIXTURES, 'fleet', name);
const plain = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const render = (name) => plain(renderFleet(fx(name), { now: NOW }));

test('full-data render: header, per-agent lines, cycle + health footers (verbatim)', () => {
  assert.equal(render('full'), [
    'fleet · running 1 · idle 1',
    '  [arch] · developer:implement · 4.2k tok · ▶ 10m0s · 3 calls',
    '  [dev] · developer:implement · 18k tok · ⏸ 5m0s · 2 calls',
    'cycle 1/3',
    'health: 2 boundary events',
  ].join('\n'));
});

test('degradation — no fleet-state.json → pinned noFleet line', () => {
  assert.equal(render('does-not-exist'), MSG.noFleet);
});

test('degradation — malformed fleet-state.json → pinned noFleet line', () => {
  assert.equal(render('malformed'), MSG.noFleet);
});

test('degradation — stale snapshot is labelled, not rendered as live (verbatim)', () => {
  assert.equal(render('stale'), [
    'fleet · running 1 · idle 0 · stale — last seen 10m ago',
    '  [rev] · 7.0k tok · ▶ 10m0s',
    MSG.noDepth,
    'health: 0 boundary events',
  ].join('\n'));
});

test('degradation — no token_audit log → basic columns + depth hint, no calls column (verbatim)', () => {
  // roster-only carries fleet-state but no token-usage.jsonl, no comm-log, no violations.
  const out = render('roster-only');
  assert.equal(out, [
    'fleet · running 1 · idle 0',
    '  [arch] · 4.2k tok · ▶ 10m0s',
    MSG.noDepth,
    'health: 0 boundary events',
  ].join('\n'));
  assert.doesNotMatch(out, /calls/);
});

test('degradation — no communication-log → phase/step and cycle columns omitted', () => {
  const out = render('roster-only');
  assert.doesNotMatch(out, /developer:implement/);
  assert.doesNotMatch(out, /cycle/);
});

test('zero or absent tokenCount omits the token field, matching subagent-rows.js (verbatim)', () => {
  // t1 tokenCount:0, t2 tokenCount absent — neither must render "0 tok" or any "tok" segment.
  const out = render('zero-token');
  assert.equal(out, [
    'fleet · running 2 · idle 0',
    '  [arch] · ▶ 10m0s',
    '  [dev] · ▶ 5m0s',
    MSG.noDepth,
    'health: 0 boundary events',
  ].join('\n'));
  assert.doesNotMatch(out, /\btok\b/); // no token field at all (the depth hint's "token_audit" is fine)
});

test('depth columns appear only when token-usage.jsonl is present', () => {
  assert.match(render('full'), /calls/);
  assert.doesNotMatch(render('roster-only'), /calls/);
});

test('depth dedup matches the consumption-report algorithm (output counted once per turn)', () => {
  // Mirrors consumption-report's consecutive-tuple dedup on the same fixture: architect has two
  // identical tuples (counted once = 100) + one distinct (200) = 300 over 3 calls; developer has
  // two distinct tuples (300 + 400) = 700 over 2 calls (nexus:developer + developer-2 both → dev).
  const d = readDepth(fx('full'));
  assert.deepEqual(d.architect, { calls: 3, out: 300, key: '1500|200|500|1000' });
  assert.deepEqual(d.developer, { calls: 2, out: 700, key: '2500|400|1000|2000' });
  assert.equal(d.main, undefined); // no role → excluded, like the row renderer
});

test('every render path exits via a string, never throws', () => {
  for (const name of ['full', 'stale', 'roster-only', 'malformed', 'does-not-exist']) {
    assert.equal(typeof renderFleet(fx(name), { now: NOW }), 'string');
  }
});
