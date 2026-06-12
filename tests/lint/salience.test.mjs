// T1 — salience report lint. Report-only by decision (Q1: 8/19 agent/rule files exceed any sane
// ceiling today; thresholds arrive with A2 after declutter calibration). So this asserts the report
// RUNS and is well-formed and total — NOT that any number is under a budget. It is the parse-only
// guard that keeps salience-report.mjs from silently breaking before it ever gains teeth.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, run, pluginRoot } from '../helpers.mjs';

const SCRIPT = join(REPO, 'scripts', 'salience-report.mjs');

function expectedFiles() {
  const out = [];
  for (const scope of ['agents', 'rules']) {
    const dir = join(pluginRoot('nexus'), scope);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) out.push(f);
  }
  return out;
}

test('salience-report.mjs --json executes, parses, and covers every agent/rule file', () => {
  const res = run(process.execPath, [SCRIPT, '--json']);
  assert.equal(res.status, 0, `salience-report.mjs exited ${res.status}: ${res.stderr}`);

  let rows;
  assert.doesNotThrow(() => { rows = JSON.parse(res.stdout); }, 'salience --json output is not valid JSON');
  assert.ok(Array.isArray(rows) && rows.length > 0, 'salience report produced no rows');

  // Every row carries the four measured metrics (no threshold check — report-only).
  for (const r of rows) {
    for (const key of ['scope', 'file', 'lines', 'boldDensity', 'maxBlockWords', 'totalWords']) {
      assert.ok(key in r, `row for ${r.file || '?'} missing metric "${key}"`);
    }
  }

  // Total coverage: every agent/rule .md on disk appears exactly once.
  const reported = new Set(rows.map((r) => r.file));
  for (const f of expectedFiles()) {
    assert.ok(reported.has(f), `salience report omits ${f}`);
  }
  assert.equal(rows.length, expectedFiles().length, 'salience report row count != agent/rule file count');
});

test('salience-report.mjs human table runs and is non-empty', () => {
  const res = run(process.execPath, [SCRIPT]);
  assert.equal(res.status, 0, `salience-report.mjs (table) exited ${res.status}: ${res.stderr}`);
  assert.match(res.stdout, /maxBlock/, 'human table missing its header');
});
