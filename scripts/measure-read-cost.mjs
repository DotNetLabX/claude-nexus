#!/usr/bin/env node
// measure-read-cost.mjs — the audit parser for the section-addressable-reads slice
// (adhoc-SectionAddressableReads). Reads a token-usage.jsonl, optionally filters by agent
// and time window, and reports ABSOLUTE cache_creation / cache_read and the cache efficiency
// ratio for that slice. AC4's success metric is the absolute `cache_creation` per run dropping
// after the change (the ratio flags amortisation, not waste — see the spec), so this tool
// reports the absolute first.
//
// Dev-repo tooling ONLY — same posture as selfcheck / gen-* / bump-plugin: never shipped to
// consumers, never bumped. The parsing logic is ported from the consumption-report skill
// (plugins/nexus/skills/consumption-report/SKILL.md), the source of truth for this log shape.
//
// Usage:
//   node scripts/measure-read-cost.mjs <token-usage.jsonl> [--agent <name>] [--since <iso-ts>]
//
//   --agent <name>   exact agent match (e.g. "nexus:critic" or "critic" — no prefix coalescing)
//   --since <iso-ts> keep only rows with ts >= the ISO timestamp (the run-start marker)
//
// Each line is one tool call: {ts, agent, tool, input, output, cache_read, cache_creation, context}.
// cache_creation/cache_read are summed per row (every tool call has its own cache numbers — unlike
// `output`, which the consumption-report dedups per turn).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Pure core: takes the raw file text + options, returns the aggregated totals.
export function measureReadCost(text, { agent, since } = {}) {
  const sinceMs = since ? Date.parse(since) : null;
  let calls = 0;
  let cacheCreation = 0;
  let cacheRead = 0;
  for (const line of String(text).split('\n')) {
    if (!line.trim()) continue;
    let r;
    try { r = JSON.parse(line); } catch { continue; } // skip malformed rows
    if (!r || typeof r !== 'object') continue;
    if (agent !== undefined && r.agent !== agent) continue;
    if (sinceMs !== null && !(Date.parse(r.ts) >= sinceMs)) continue;
    calls += 1;
    cacheCreation += r.cache_creation || 0;
    cacheRead += r.cache_read || 0;
  }
  const denom = cacheRead + cacheCreation;
  const efficiency = denom > 0 ? cacheRead / denom : 0; // guard 0/0 → 0
  return { calls, cacheCreation, cacheRead, efficiency };
}

// CLI entrypoint — only when run directly, not when imported by the test.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2);
  const opts = {};
  let path;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--agent') opts.agent = argv[++i];
    else if (a === '--since') opts.since = argv[++i];
    else if (!path) path = a;
  }
  if (!path) {
    console.error('usage: node scripts/measure-read-cost.mjs <token-usage.jsonl> [--agent <name>] [--since <iso-ts>]');
    process.exit(2);
  }
  // Guard dangling flags: a flag present in argv but with no following value silently becomes
  // undefined, which means the filter is NOT applied — an unfiltered result looks plausible and
  // is the worst possible failure mode for an AC4 measurement. Fail loud instead.
  if (argv.includes('--agent') && opts.agent === undefined) {
    console.error('error: --agent requires a value (e.g. --agent critic)');
    process.exit(2);
  }
  if (argv.includes('--since') && opts.since === undefined) {
    console.error('error: --since requires a value (e.g. --since 2026-06-20T10:00:00.000Z)');
    process.exit(2);
  }
  if (!existsSync(path)) {
    console.error(`no such log: ${path} (enable the token_audit plugin config and re-run to capture .claude/audit/token-usage.jsonl)`);
    process.exit(1);
  }
  const r = measureReadCost(readFileSync(path, 'utf8'), opts);
  const pct = (r.efficiency * 100).toFixed(1) + '%';
  const scope = [opts.agent ? `agent=${opts.agent}` : 'all agents', opts.since ? `since=${opts.since}` : 'full window'].join(', ');
  console.log(`measure-read-cost — ${scope}`);
  console.log(`  calls:          ${r.calls}`);
  console.log(`  cache_creation: ${r.cacheCreation}   (absolute — AC4 success = this drops post-change)`);
  console.log(`  cache_read:     ${r.cacheRead}`);
  console.log(`  efficiency:     ${pct}   (cache_read / (cache_read + cache_creation) — amortisation, not waste)`);
}
