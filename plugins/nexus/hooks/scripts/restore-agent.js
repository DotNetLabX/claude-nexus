#!/usr/bin/env node
/**
 * Nexus SessionStart hook: session-aware persona restore.
 *
 * Personas are tracked per session in the HOST project's .claude/.personas.json:
 *     { "<session_id>": { "agent": "architect", "ts": <epoch-ms> }, ... }
 * written by register-persona.js when a /<agent> command sets the role.
 *
 * Restore policy (decided deliberately — see the persona design notes):
 *   compact -> restore: re-inject the full agent body (the summary dropped it)
 *   clear   -> forget THIS session's persona (clear is the exit)
 *   startup -> nothing (a fresh session_id has no entry — clean slate for free)
 *   resume  -> nothing (the transcript, persona included, is reloaded verbatim)
 * Entries older than 16h are pruned on every run so abandoned sessions self-expire.
 *
 * In a plugin the agent file is NOT at .claude/agents/ and ${CLAUDE_PLUGIN_ROOT} does not
 * expand in command/agent markdown, so we inject the agent body directly from the plugin's
 * own agents/ folder (resolved from __dirname — robust against the version-keyed cache path).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const TTL_MS = 16 * 60 * 60 * 1000;

// Valid roles = whatever the plugin actually ships — derived from agents/, never hardcoded
// (a hardcoded roster silently orphans a newly added agent: it registers but never restores).
function validRoles() {
  try {
    const pluginRoot = path.resolve(__dirname, '..', '..');
    return fs.readdirSync(path.join(pluginRoot, 'agents'))
      .filter(f => f.endsWith('.md'))
      .map(f => f.slice(0, -3));
  } catch {
    return [];
  }
}

function stripFrontmatter(md) {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
}

function readAgentBody(agent) {
  const pluginRoot = path.resolve(__dirname, '..', '..'); // hooks/scripts -> plugin root
  try {
    return stripFrontmatter(fs.readFileSync(path.join(pluginRoot, 'agents', `${agent}.md`), 'utf8'));
  } catch {
    return null;
  }
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let sid = '', source = '', evtCwd = '';
  try { const e = JSON.parse(raw || '{}'); sid = e.session_id || ''; source = e.source || ''; evtCwd = e.cwd || ''; } catch { /* ignore */ }

  // Same root chain as register-persona.js — the hook process's own cwd may differ from the event's.
  const root = process.env.CLAUDE_PROJECT_DIR || evtCwd || process.cwd();
  const file = path.join(root, '.claude', '.personas.json');

  let reg = {};
  try { reg = JSON.parse(fs.readFileSync(file, 'utf8')) || {}; } catch { /* no registry yet */ }

  // Prune expired entries.
  const now = Date.now();
  let changed = false;
  for (const k of Object.keys(reg)) {
    const e = reg[k];
    if (!e || typeof e.ts !== 'number' || now - e.ts > TTL_MS) { delete reg[k]; changed = true; }
  }

  // /clear is the exit: drop this session's persona so a later compact won't resurrect it.
  if (source === 'clear' && sid && reg[sid]) { delete reg[sid]; changed = true; }

  if (changed) {
    try {
      const tmp = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(reg, null, 2));
      fs.renameSync(tmp, file);
    } catch { /* best-effort */ }
  }

  // Restore ONLY on compact.
  if (source !== 'compact' || !sid) process.exit(0);
  const agent = reg[sid] && reg[sid].agent;
  if (!agent || !validRoles().includes(agent)) process.exit(0);

  const body = readAgentBody(agent);
  const context = body
    ? `Active persona: ${agent}. You are operating as the ${agent} agent for this session. ` +
      `Your full role definition is restored below — adopt it exactly; this IS your role.\n\n${body}`
    : `Active persona: ${agent}. You are operating as the ${agent} agent, but its role definition ` +
      `could not be loaded from the plugin. Ask the user to re-run the /${agent} command.`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context }
  }));
  process.exit(0);
});
