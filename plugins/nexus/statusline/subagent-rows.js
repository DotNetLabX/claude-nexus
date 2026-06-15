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
 * Pure transform — reads no plugin files, needs no path resolution, so it runs the same
 * whether wired via ${CLAUDE_PLUGIN_ROOT} or an absolute path written by an installer.
 *
 * Schema caveat: `type`/`name`/`status` values are undocumented, so role detection scans
 * every text field rather than trusting one. Set NEXUS_SUBAGENT_CAPTURE=<file> to append
 * the raw stdin payload there once — used to confirm the real shape against a live run.
 */
const fs = require('fs');

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

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch { /* no stdin */ }

const cap = process.env.NEXUS_SUBAGENT_CAPTURE;
if (cap) { try { fs.appendFileSync(cap, raw + '\n'); } catch { /* best-effort */ } }

let data = {};
try { data = raw ? JSON.parse(raw) : {}; } catch { process.exit(0); }

const tasks = Array.isArray(data.tasks) ? data.tasks : [];
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
