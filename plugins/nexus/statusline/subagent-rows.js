#!/usr/bin/env node
'use strict';
/*
 * Nexus subagentStatusLine renderer — restyles the agent-panel rows for the
 * pipeline roles nexus spawns (architect, developer, reviewer, …).
 *
 * Contract (https://code.claude.com/docs/en/statusline.md, Subagent status lines):
 *   stdin  → one JSON object: { tasks: [ {id,name,type,status,description,
 *            startTime,tokenCount,cwd}, … ], columns: <width>, …base hook fields }
 *   stdout → one JSON line PER row we want to override: {"id": "<task id>", "content": "<line>"}
 *            Omit a task's id entirely → that row keeps Claude Code's default rendering.
 *            ANSI colour is rendered as-is; we are responsible for honouring `columns`.
 *
 * Fail-open, like the nexus hooks: any parse trouble, or a row we don't recognise as a
 * pipeline role, is left untouched (no line emitted) so we never blank out a legit row.
 *
 * Heartbeat (adhoc-NexusFleetView, ADR-33): after building the rows, this script also persists
 * a normalized fleet snapshot to `<root>/.claude/audit/fleet-state.json`. This is the *only*
 * place the rich live roster (per-task tokenCount/startTime/status/role) is delivered, so the
 * `/nexus:fleet` dashboard reads this file rather than querying on demand (TaskList carries only
 * the task board). The write is:
 *   - Root-resolved from the base-hook `cwd` field — the subagentStatusLine payload is
 *     hook-shaped (base hook common-input-fields + `columns` + `tasks[]`), so the session's
 *     working directory is carried as the top-level `cwd`, NOT in a `workspace` object.
 *     `data.workspace.project_dir` is the *main* statusLine field (absent here; kept as a
 *     harmless forward-compat fallback in case the schema converges). `tasks[].cwd` is the
 *     per-subagent working directory — wrong audit location. `CLAUDE_PROJECT_DIR`/
 *     `CLAUDE_PLUGIN_ROOT` are hooks-only env vars (absent here). `process.cwd()` violates
 *     ADR-8 stray-log. No root → skip the write.
 *   - Atomic: temp file + rename, so a mid-render reader (the dashboard) never sees a torn file.
 *   - Drain-on-empty: an empty `tasks[]` with a resolvable root writes an empty snapshot, so a
 *     stale roster never lingers after a run ends.
 *   - Fail-open: the whole write is swallowed on any error — row rendering is unaffected.
 *
 * Schema caveat: `type`/`name`/`status` values are undocumented, so role detection scans
 * every text field rather than trusting one. Set NEXUS_SUBAGENT_CAPTURE=<file> to append
 * the raw stdin payload there once — used to confirm the real shape against a live run.
 */
const fs = require('fs');
const path = require('path');

// ---- ANSI (mirrors ~/.claude/statusline/statusline.js) ----
const R = '\x1b[0m', DIM = '\x1b[2m', BOLD = '\x1b[1m';
const MAG = '\x1b[35m', BLUE = '\x1b[34m', GRAY = '\x1b[90m';
const GREEN = '\x1b[32m', YELLOW = '\x1b[33m', CYAN = '\x1b[36m', WHITE = '\x1b[37m';

// Pipeline roles → short tag + colour. Longest keys first so 'team-lead' wins over a
// stray 'lead' substring; keep in sync with the agents nexus ships under agents/.
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
// Match each role as a whole token, not a substring — otherwise 'po' fires inside
// "general-purpose" and "dev" inside "development". Flanks: anything but a letter/digit
// (so 'nexus:architect', 'architect', '[architect]' all match; 'architecture' does not).
const ROLE_KEYS = Object.keys(ROLES)
  .sort((a, b) => b.length - a.length)
  .map((k) => ({ k, re: new RegExp('(?:^|[^a-z0-9])' + k + '(?:[^a-z0-9]|$)') }));

function detectRole(task) {
  const hay = [task.type, task.name, task.label, task.description]
    .filter((v) => typeof v === 'string')
    .join(' ')
    .toLowerCase();
  for (const { k, re } of ROLE_KEYS) if (re.test(hay)) return k;
  return null;
}

function fmtK(n) {
  if (typeof n !== 'number' || !isFinite(n) || n <= 0) return '';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return String(n);
}

function elapsed(start) {
  let t;
  if (typeof start === 'number') t = start;
  else if (typeof start === 'string') { const p = Date.parse(start); if (!isNaN(p)) t = p; }
  if (!t) return '';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  return s < 3600 ? m + 'm' + (s % 60) + 's' : Math.floor(m / 60) + 'h' + (m % 60) + 'm';
}

// Truncate to a visible-character budget, stepping over zero-width ANSI sequences.
function clip(s, max) {
  if (!max || max <= 0) return s;
  let vis = 0, out = '', i = 0;
  while (i < s.length) {
    if (s[i] === '\x1b') {
      const m = s.slice(i).match(/^\x1b\[[0-9;]*m/);
      if (m) { out += m[0]; i += m[0].length; continue; }
    }
    if (vis >= max - 1) { out += '…'; break; }
    out += s[i]; vis++; i++;
  }
  return out + R;
}

// ---- Heartbeat: persist the live fleet snapshot (adhoc-NexusFleetView) ----

// The subagentStatusLine payload is hook-shaped (base hook common-input-fields + columns +
// tasks[]). The session root arrives as the top-level `cwd` (main session's working directory
// at render time — equals the project root in normal usage). `workspace.project_dir` is the
// main statusLine field and is absent in the subagent payload; kept first as a forward-compat
// fallback in case the two schemas converge. `tasks[].cwd` is the per-subagent directory —
// rejected (wrong audit location). No CLAUDE_PROJECT_DIR (hooks-only env, absent here).
function resolveRoot(data) {
  const root = (data && data.workspace && data.workspace.project_dir) || (data && data.cwd);
  return typeof root === 'string' && root.trim() ? root : null;
}

// Normalize one task to the snapshot shape the dashboard reads. Reuses detectRole/ROLES so the
// roster's role labels match the row rendering exactly.
function normalizeTask(t) {
  return {
    id: t.id,
    role: detectRole(t),
    tag: t.tag,
    name: t.name,
    description: t.description,
    status: t.status,
    startTime: t.startTime,
    tokenCount: t.tokenCount,
    cwd: t.cwd,
  };
}

// Atomic write: temp file in the same dir, then rename over the target so a concurrent reader
// (the /nexus:fleet renderer) never observes a torn JSON file. Whole thing is fail-open — any
// error is swallowed so row rendering is never affected.
function writeFleetState(root, data, tasks) {
  try {
    const dir = path.join(root, '.claude', 'audit');
    fs.mkdirSync(dir, { recursive: true });
    const snapshot = {
      ts: new Date().toISOString(),
      columns: typeof data.columns === 'number' ? data.columns : null,
      tasks: tasks.filter((t) => t && t.id != null).map(normalizeTask),
    };
    const target = path.join(dir, 'fleet-state.json');
    const tmp = target + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(snapshot));
    fs.renameSync(tmp, target);
  } catch { /* fail-open: never disturb row rendering */ }
}

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch { /* no stdin */ }

const cap = process.env.NEXUS_SUBAGENT_CAPTURE;
if (cap) { try { fs.appendFileSync(cap, raw + '\n'); } catch { /* best-effort */ } }

let data = {};
try { data = raw ? JSON.parse(raw) : {}; } catch { process.exit(0); }

const tasks = Array.isArray(data.tasks) ? data.tasks : [];

// Heartbeat first, before the no-rows short-circuit: an empty roster with a resolvable root must
// still write an empty snapshot (drain), so a stale fleet never lingers after a run ends. No root
// resolved → skip entirely (the dashboard then reads "No active fleet").
const root = resolveRoot(data);
if (root) writeFleetState(root, data, tasks);

if (!tasks.length) process.exit(0);
const cols = typeof data.columns === 'number' ? data.columns : 0;

const out = [];
for (const t of tasks) {
  if (!t || t.id == null) continue;
  const role = detectRole(t);
  if (!role) continue; // not a nexus role → leave the default row alone
  const r = ROLES[role];

  const parts = [r.color + '[' + r.tag + ']' + R];
  const label = (typeof t.description === 'string' && t.description.trim()) || t.name;
  if (typeof label === 'string' && label.trim()) parts.push(DIM + label.trim() + R);
  const tk = fmtK(t.tokenCount);
  if (tk) parts.push(GRAY + tk + ' tok' + R);
  const el = elapsed(t.startTime);
  if (el) parts.push(DIM + el + R);

  const content = clip(parts.join(DIM + ' · ' + R), cols);
  out.push(JSON.stringify({ id: t.id, content }));
}

if (out.length) process.stdout.write(out.join('\n'));
process.exit(0);
