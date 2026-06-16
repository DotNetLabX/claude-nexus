#!/usr/bin/env node
// Renders the /nexus:fleet dashboard by joining four best-effort sources rooted at a project dir:
//   1. .claude/audit/fleet-state.json        live roster: role, run-state, tokens, elapsed (Step 1 heartbeat)
//   2. docs/specs/*/delivery/communication-log.md (newest)  phase/step + cycle
//   3. .claude/audit/token-usage.jsonl        depth: tool-call count per agent (token_audit only)
//   4. .claude/audit/violations.log           health: boundary-event count
//
// Every join is best-effort: a missing/malformed source degrades to a pinned one-liner, never an
// error. The degradation strings are exported constants so the tests and the reviewer agree on the
// exact pass/fail contract. Output is ANSI-styled; tests strip ANSI and assert verbatim.
//
// Time seam: elapsed and staleness are computed against `now`, injectable via NEXUS_FLEET_NOW
// (epoch ms) so the verbatim-string tests are deterministic; defaults to Date.now().
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// ---- ANSI (mirrors statusline/subagent-rows.js) ----
const R = '\x1b[0m', DIM = '\x1b[2m', BOLD = '\x1b[1m';
const MAG = '\x1b[35m', BLUE = '\x1b[34m', GRAY = '\x1b[90m';
const GREEN = '\x1b[32m', YELLOW = '\x1b[33m', CYAN = '\x1b[36m', WHITE = '\x1b[37m';

// Pipeline roles → short tag + colour. Kept in sync with statusline/subagent-rows.js ROLES.
const ROLES = {
  'team-lead': { tag: 'lead',  color: BOLD + WHITE },
  'architect': { tag: 'arch',  color: BLUE },
  'developer': { tag: 'dev',   color: GREEN },
  'reviewer':  { tag: 'rev',   color: YELLOW },
  'critic':    { tag: 'crit',  color: MAG },
  'learner':   { tag: 'learn', color: GRAY },
  'solo':      { tag: 'solo',  color: CYAN },
  'po':        { tag: 'po',    color: CYAN },
};
const ROLE_KEYS = Object.keys(ROLES)
  .sort((a, b) => b.length - a.length)
  .map((k) => ({ k, re: new RegExp('(?:^|[^a-z0-9])' + k + '(?:[^a-z0-9]|$)') }));

// Map a free-form agent label (e.g. 'nexus:developer', 'developer-2', 'team-lead') to a role key,
// token-boundary matched so 'po' never fires inside 'general-purpose'. Returns null if no role.
function roleOf(label) {
  if (typeof label !== 'string') return null;
  const hay = label.toLowerCase();
  for (const { k, re } of ROLE_KEYS) if (re.test(hay)) return k;
  return null;
}

// Pinned degradation strings — exported so the test suite imports the exact constant it asserts.
export const MSG = {
  noFleet: 'No active fleet — run a team (statusline populates this live).',
  noDepth: '(enable token_audit for depth)',
};

function fmtK(n) {
  // Mirror subagent-rows.js: zero/absent → '' (the caller omits the field), never '0 tok'.
  if (typeof n !== 'number' || !isFinite(n) || n <= 0) return '';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return String(n);
}

function fmtElapsed(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  return s < 3600 ? m + 'm' + (s % 60) + 's' : Math.floor(m / 60) + 'h' + (m % 60) + 'm';
}

function fmtAge(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm';
  return Math.floor(m / 60) + 'h';
}

// A status counts as "running" if it reads active/in-progress/running, idle otherwise. The status
// values are undocumented (statusline schema caveat), so we substring-match the known shapes.
function isRunning(status) {
  if (typeof status !== 'string') return false;
  return /progress|running|active|busy/i.test(status);
}

const FRESHNESS_MS = 60_000; // a snapshot older than this is rendered as stale, not live.

function readJSON(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

// ---- Source 2: newest communication-log header (phase/step + cycle) ----
function readCommLog(root) {
  let dir;
  try { dir = readdirSync(join(root, 'docs', 'specs')); } catch { return null; }
  let newest = null, newestMtime = -1;
  for (const slug of dir) {
    const file = join(root, 'docs', 'specs', slug, 'delivery', 'communication-log.md');
    let m;
    try { m = statSync(file).mtimeMs; } catch { continue; }
    if (m > newestMtime) { newestMtime = m; newest = file; }
  }
  if (!newest) return null;
  let text;
  try { text = readFileSync(newest, 'utf8'); } catch { return null; }
  const step = (text.match(/^\*\*Step:\*\*\s*(.+)$/m) || [])[1];
  const cycle = (text.match(/^\*\*Cycle:\*\*\s*(.+)$/m) || [])[1];
  return { step: step && step.trim(), cycle: cycle && cycle.trim() };
}

// ---- Source 3: per-agent tool-call counts (token_audit) ----
// Tallies calls per role. (Output dedup uses the consecutive-tuple algorithm from
// consumption-report — same tuple key [input,output,cache_read,cache_creation] — kept for parity
// with that report even though the fleet line surfaces only the call count.)
export function readDepth(root) {
  let p = join(root, '.claude', 'audit', 'token-usage.jsonl');
  if (!existsSync(p)) p = join(root, 'docs', 'audit', 'token-usage.jsonl'); // pre-1.3.0 path
  let text;
  try { text = readFileSync(p, 'utf8'); } catch { return null; }
  const rows = text.split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
  if (!rows.length) return null;
  const byRole = {};
  for (const r of rows) {
    const role = roleOf(r.agent);
    if (!role) continue;
    // Known limitation (kept for consumption-report parity, M2 follow-up): the dedup key is the last
    // tuple seen *for this role*, which persists across other roles' interleaved rows. So two genuinely
    // distinct turns of the same role that carry an identical tuple — separated by another role's rows —
    // collapse into one, under-counting output. Matches consumption-report's algorithm exactly by
    // design; the fix is to extract a shared dedup module both consume rather than diverge here.
    const g = byRole[role] || (byRole[role] = { calls: 0, out: 0, key: null });
    g.calls++;
    const k = [r.input, r.output, r.cache_read, r.cache_creation].join('|');
    if (k !== g.key) { g.out += r.output || 0; g.key = k; } // new turn → count its output once
  }
  return byRole;
}

// ---- Source 4: boundary-event (violation) count ----
function readViolations(root) {
  let text;
  try { text = readFileSync(join(root, '.claude', 'audit', 'violations.log'), 'utf8'); } catch { return null; }
  return text.split('\n').filter(Boolean).length;
}

// Pure render: takes the resolved root, returns the full ANSI dashboard string (no trailing newline).
export function renderFleet(root, { now = Date.now() } = {}) {
  const state = readJSON(join(root, '.claude', 'audit', 'fleet-state.json'));
  if (!state || !Array.isArray(state.tasks)) return GRAY + MSG.noFleet + R;

  const tasks = state.tasks.filter((t) => t && t.id != null);
  if (!tasks.length) return GRAY + MSG.noFleet + R;

  const tsMs = Date.parse(state.ts);
  const age = isFinite(tsMs) ? now - tsMs : null;
  const stale = age != null && age > FRESHNESS_MS;

  const comm = readCommLog(root);
  const depth = readDepth(root);
  const violations = readViolations(root);

  // ---- Header: counts by run-state ----
  let running = 0, idle = 0;
  for (const t of tasks) (isRunning(t.status) ? running++ : idle++);
  const head = [];
  head.push(BOLD + 'fleet' + R);
  head.push(GREEN + 'running ' + running + R);
  head.push(DIM + 'idle ' + idle + R);
  if (stale) head.push(YELLOW + 'stale — last seen ' + fmtAge(age) + ' ago' + R);
  let out = head.join(DIM + ' · ' + R);

  // ---- One line per agent ----
  for (const t of tasks) {
    const role = t.role;
    // Null-role tasks render as [?] (or their raw role string) on purpose: the fleet view shows the
    // whole roster, unlike the row renderer which hides non-pipeline rows. Full visibility is intent.
    const meta = (role && ROLES[role]) || { tag: role || '?', color: WHITE };
    const parts = [meta.color + '[' + meta.tag + ']' + R];

    if (comm && comm.step) parts.push(DIM + comm.step + R);

    const tok = fmtK(t.tokenCount);
    if (tok) parts.push(GRAY + tok + ' tok' + R); // omit when zero/absent, like the row renderer

    const glyph = isRunning(t.status) ? '▶' : '⏸';
    const startMs = typeof t.startTime === 'number' ? t.startTime
      : (typeof t.startTime === 'string' ? Date.parse(t.startTime) : NaN);
    const el = isFinite(startMs) ? ' ' + fmtElapsed(now - startMs) : '';
    parts.push((isRunning(t.status) ? GREEN : DIM) + glyph + el + R);

    if (depth) {
      const d = (role && depth[role]) || null;
      parts.push(GRAY + (d ? d.calls : 0) + ' calls' + R);
    }
    out += '\n  ' + parts.join(DIM + ' · ' + R);
  }

  // ---- Footers ----
  if (comm && comm.cycle) out += '\n' + DIM + 'cycle ' + comm.cycle + R;
  if (!depth) out += '\n' + DIM + MSG.noDepth + R;
  out += '\n' + DIM + 'health: ' + (violations == null ? '0' : violations) + ' boundary events' + R;

  return out;
}

// CLI: resolve root from argv[2] or cwd; print the dashboard. Always exit 0 (best-effort surface).
function main() {
  const root = process.argv[2] || process.cwd();
  const nowEnv = process.env.NEXUS_FLEET_NOW;
  const now = nowEnv ? Number(nowEnv) : Date.now();
  try {
    process.stdout.write(renderFleet(root, { now }) + '\n');
  } catch {
    process.stdout.write(GRAY + MSG.noFleet + R + '\n');
  }
  process.exit(0);
}

// Run only when invoked directly, not when imported by the test suite. pathToFileURL handles the
// Windows drive-letter / separator quirks that a bare `file://${argv[1]}` string comparison misses.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
