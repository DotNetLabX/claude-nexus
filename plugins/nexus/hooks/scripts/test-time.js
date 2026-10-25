#!/usr/bin/env node
/**
 * Nexus test-time: what a feature spent on test runs and builds, as the one line a closing summary copies.
 *
 *   node test-time.js --slug <slug> [--tree <path>]
 *
 * Reads .claude/audit/verify-verdict.json in the session root (CLAUDE_PROJECT_DIR, else the working folder)
 * and, with --tree, in that tree too; a record present in both is counted once. It never runs anything.
 *
 * WHICH RECORDS ARE THE FEATURE'S. A verify-run record of any role and profile, or a verify-gate record, that
 * carries the slug; or one that carries no slug and a non-empty pipeline token one of the slug's own records
 * carries, from a session the slug's records name, between the slug's first and last record (the token is a phase
 * word, shared by every feature in that phase). A gate record with no token and no slug (a lane with no pipeline
 * state) counts under the same session and window rule; that part of the line is then marked `≈`. A record that ran nothing
 * — an undeclared role, a gate record with no commands — is not a run.
 *
 * THE LINE. `Tests and builds: {total} across {n} runs — complete {a}, step runs {b}, gate runs {c}, builds {d}`:
 * complete is `full`, builds is `build`, step runs every other verify-run role, gate runs the sum of each gate
 * record's commands. A part with nothing reads `0`. A log that exists but cannot be read is named after the line
 * as `not measured: {path}`; an absent log holds no records.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const LOG = ['.claude', 'audit', 'verify-verdict.json'];

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--slug') { out.slug = argv[i + 1]; i++; }
    else if (argv[i] === '--tree') { out.tree = argv[i + 1]; i++; }
  }
  return out;
}

// An absent log holds no records: a tree whose runs were all written to the session root has none. Any
// other failure to read it is reported, so a missing figure never reads as zero.
function readLog(dir) {
  const file = path.join(dir, ...LOG);
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) {
    return e && e.code === 'ENOENT' ? { records: [] } : { records: [], unread: file };
  }
  const records = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try { records.push({ key: trimmed, record: JSON.parse(trimmed) }); } catch { /* a torn line is skipped */ }
  }
  return { records };
}

function formatMs(ms) {
  if (!ms) return '0';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${s % 60} s`;
  return `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min`;
}

function bucketOf(record) {
  if (record.role === 'full') return 'complete';
  if (record.role === 'build') return 'builds';
  return 'step';
}

// The verify gate's records carry no `source`; one that ran nothing (a step checkpoint, a skipped spawn)
// is not a run.
const isGate = (r) => r.source === undefined && Array.isArray(r.commands) && r.commands.length > 0;
const gateMs = (r) => r.commands.reduce((sum, c) => sum + (typeof c.duration_ms === 'number' ? c.duration_ms : 0), 0);

function measure({ slug, logs }) {
  const seen = new Set();
  const all = [];
  for (const entries of logs) {
    for (const { key, record } of entries) {
      const id = record.source === 'verify-run' && record.run_id ? `run:${record.run_id}` : key;
      if (seen.has(id)) continue;
      seen.add(id);
      all.push(record);
    }
  }
  const own = all.filter((r) => r.source === 'verify-run' && r.slug === slug);
  const tokens = new Set(own.map((r) => r.token).filter((t) => typeof t === 'string' && t !== ''));
  const sessions = new Set(own.map((r) => r.session).filter((s) => typeof s === 'string' && s !== ''));
  const times = own.map((r) => Date.parse(r.ts)).filter(Number.isFinite);
  const first = Math.min(...times);
  const last = Math.max(...times);
  // A token is a phase word every feature shares, so it ties only a record that carries no slug, inside the
  // slug's own sessions and its first-to-last window.
  const ownSpan = (r) => (typeof r.slug !== 'string' || r.slug === '') && sessions.has(r.session) && Date.parse(r.ts) >= first && Date.parse(r.ts) <= last;
  const tied = (r) => r.slug === slug || (typeof r.token === 'string' && r.token !== '' && tokens.has(r.token) && ownSpan(r));
  const inWindow = (r) => !r.token && ownSpan(r);
  const sums = { complete: 0, step: 0, gate: 0, builds: 0 };
  let runs = 0;
  let approximate = false;
  for (const r of all) {
    if (r.source === 'verify-run') {
      if (!tied(r) || typeof r.duration_ms !== 'number') continue;
      sums[bucketOf(r)] += r.duration_ms;
      runs++;
    } else if (isGate(r)) {
      if (tied(r)) { /* counted below */ } else if (inWindow(r)) approximate = true;
      else continue;
      sums.gate += gateMs(r);
      runs++;
    }
  }
  return { sums, runs, approximate };
}

function line({ sums, runs, approximate }) {
  const total = sums.complete + sums.step + sums.gate + sums.builds;
  return `Tests and builds: ${formatMs(total)} across ${runs} runs — complete ${formatMs(sums.complete)}, ` +
    `step runs ${formatMs(sums.step)}, gate runs ${approximate ? '≈' : ''}${formatMs(sums.gate)}, builds ${formatMs(sums.builds)}`;
}

function main(argv = process.argv.slice(2), env = process.env) {
  const args = parseArgs(argv);
  if (typeof args.slug !== 'string' || !args.slug) {
    process.stderr.write('usage: node test-time.js --slug <slug> [--tree <path>]\n');
    return 2;
  }
  const root = env.CLAUDE_PROJECT_DIR || process.cwd();
  const dirs = [root];
  if (args.tree && path.resolve(args.tree) !== path.resolve(root)) dirs.push(args.tree);
  const read = dirs.map((d) => readLog(d));
  const unread = read.filter((r) => r.unread).map((r) => r.unread);
  const text = line(measure({ slug: args.slug, logs: read.map((r) => r.records) }));
  process.stdout.write(text + (unread.length ? `; not measured: ${unread.join(', ')}` : '') + '\n');
  return 0;
}

if (require.main === module) process.exitCode = main();

module.exports = { main, measure, formatMs };
