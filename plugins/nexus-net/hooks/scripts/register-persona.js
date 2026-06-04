#!/usr/bin/env node
/**
 * Nexus PostToolUse(Write) hook — bridge a /<agent> persona command into the per-session registry.
 *
 * The persona commands instruct the model to write the role slug to .claude/.current-agent.
 * That Write fires this hook, which carries the authoritative session_id (concurrency-safe —
 * each session sees only its own event) and the written content. We record the role under this
 * session's id in the HOST project's .claude/.personas.json and prune entries older than 16h.
 *
 * Why a hook and not the command itself: a slash command is model-run and never learns its own
 * session_id; a SessionStart-injected id would be shared/raced across concurrent tabs. The
 * PostToolUse payload is the only place both the session_id and the chosen role meet.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const TTL_MS = 16 * 60 * 60 * 1000;

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let evt = {};
  try { evt = JSON.parse(raw || '{}'); } catch { process.exit(0); }

  const sid = evt.session_id;
  const ti = evt.tool_input || {};
  const fp = String(ti.file_path || '').replace(/\\/g, '/');
  if (!sid || !fp.endsWith('.current-agent')) process.exit(0);

  const agent = String(ti.content || '').trim();
  if (!/^[a-z][a-z-]{1,30}$/.test(agent)) process.exit(0);

  const root = process.env.CLAUDE_PROJECT_DIR || evt.cwd || process.cwd();
  const file = path.join(root, '.claude', '.personas.json');

  let reg = {};
  try { reg = JSON.parse(fs.readFileSync(file, 'utf8')) || {}; } catch { /* new registry */ }

  const now = Date.now();
  for (const k of Object.keys(reg)) {
    const e = reg[k];
    if (!e || typeof e.ts !== 'number' || now - e.ts > TTL_MS) delete reg[k];
  }
  reg[sid] = { agent, ts: now };

  try {
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(reg, null, 2));
    fs.renameSync(tmp, file);
  } catch { /* best-effort, never block */ }
  process.exit(0);
});
