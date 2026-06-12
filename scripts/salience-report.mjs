#!/usr/bin/env node
// salience-report.mjs — cognitive-load diagnostics for the plugin's prose surfaces.
// A different axis from redundancy (VWH dive, Level 6): "can a reader find the load-bearing rules,
// or do they drown?" Reports four measured numbers per agent/rule file; it does NOT judge or fail
// (Q1: 8/19 files exceed any sane ceiling today — ceilings arrive with A2 after declutter
// calibration). Report-only. Run: node scripts/salience-report.mjs [--json]
//
// Measurement definition (binding — tests assert specific numbers against it):
//   - blocks  = spans split on blank lines (/\n\s*\n/)
//   - words   = whitespace-split tokens (/\S+/); markdown punctuation counts as part of the token
//   - metrics = lines, bold-line density (lines containing **…** ÷ lines), max-block word count,
//               total words
//
// Paths resolve relative to this file — location-independent.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NEXUS = join(ROOT, 'plugins', 'nexus');

// The two prose surfaces a reader navigates: persona definitions and the always-on rules.
const SCOPE = [
  ['agents', join(NEXUS, 'agents')],
  ['rules', join(NEXUS, 'rules')],
];

const wordsIn = (s) => (s.match(/\S+/g) || []).length;

export function measure(text) {
  const lines = text.split(/\r?\n/);
  const lineCount = lines.length;
  const boldLines = lines.filter((l) => /\*\*[^*]+\*\*/.test(l)).length;
  const blocks = text.split(/\n\s*\n/);
  let maxBlockWords = 0;
  for (const b of blocks) maxBlockWords = Math.max(maxBlockWords, wordsIn(b));
  return {
    lines: lineCount,
    boldDensity: lineCount ? boldLines / lineCount : 0,
    maxBlockWords,
    totalWords: wordsIn(text),
  };
}

export function collect() {
  const rows = [];
  for (const [scope, dir] of SCOPE) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      const m = measure(readFileSync(join(dir, f), 'utf8'));
      rows.push({ scope, file: basename(f), ...m });
    }
  }
  return rows;
}

function renderTable(rows) {
  const head = ['scope', 'file', 'lines', 'bold%', 'maxBlock', 'words'];
  const fmt = (r) => [r.scope, r.file, String(r.lines), (r.boldDensity * 100).toFixed(0) + '%', String(r.maxBlockWords), String(r.totalWords)];
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => fmt(r)[i].length)));
  const line = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join('  ');
  const out = [line(head), line(widths.map((w) => '-'.repeat(w)))];
  for (const r of rows) out.push(line(fmt(r)));
  return out.join('\n');
}

// Run directly (not when imported by the lint test).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const rows = collect();
  if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
  } else {
    process.stdout.write('Salience report — report-only, no thresholds (see Q1 / A2 for ceilings)\n\n');
    process.stdout.write(renderTable(rows) + '\n');
  }
}
